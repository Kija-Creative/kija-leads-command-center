// Return on investment math for a pitch. Pure. Dollars are whole numbers.
// Sentences are hedged ("if", "about") and never promise an outcome.

export const ESTIMATE_DISCLAIMER = "These are estimates to adjust together, not a promise.";
export const PLACEHOLDER_SOURCE = "Placeholder, not researched";
export const DEFAULT_MARGIN = 0.4;
export const DEFAULT_JOBS_PER_MONTH = 3;

function positive(v, { max = Infinity } = {}) {
  return typeof v === "number" && Number.isFinite(v) && v > 0 && v <= max ? v : undefined;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function fmt1(n) {
  const r = round1(n);
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export function formatDollars(n) {
  const whole = Math.round(Number(n) || 0);
  const sign = whole < 0 ? "-" : "";
  return `${sign}$${String(Math.abs(whole)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function formatPercent(fraction) {
  return `${Math.round(fraction * 100)}%`;
}

const SMALL = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
function countWord(n) {
  return SMALL[n] ?? String(n);
}

// The pace needed to break even within a year, in plain words.
function paceWithinYear(jobs) {
  if (jobs >= 104) return `about ${Math.round(jobs / 52)} a week for a year`;
  const perMonth = jobs / 12;
  // Round the interval down so the stated pace always reaches the break even count
  // (8 jobs is "one a month", not "one every two months", which would only be 6).
  const everyMonths = Math.floor(12 / jobs);
  if (everyMonths >= 2) return `about one every ${countWord(everyMonths)} months for a year`;
  if (perMonth < 1.5) return "about one a month for a year";
  return `about ${Math.round(perMonth)} a month for a year`;
}

// Category benchmark for a lead, falling back to the general entry.
export function benchmarkFor(benchmarks, categoryKey) {
  const cats = benchmarks?.categories ?? {};
  return cats[categoryKey] ?? cats.general ?? null;
}

function sourceInfo(sources) {
  const list = Array.isArray(sources) ? sources.filter((s) => s && (s.title || s.url)) : [];
  if (list.length === 0) return { source: PLACEHOLDER_SOURCE, url: "", sources: [], verified: false };
  return {
    source: list.map((s) => s.title || s.url).join("; "),
    url: list[0].url ?? "",
    sources: list.map((s) => ({ title: s.title ?? "", url: s.url ?? "", year: s.year ?? null })),
    verified: true,
  };
}

export function computeRoi({ lead, benchmark, offer, overrides } = {}) {
  const o = overrides ?? lead?.roiOverrides ?? {};
  const unit = benchmark?.ticket?.unit || "job";

  const ticketOverride = positive(o.ticket);
  const benchTicket = positive(benchmark?.ticket?.typical);
  const ticket = ticketOverride ?? benchTicket ?? null;

  const marginOverride = positive(o.margin, { max: 1 });
  const benchMargin = positive(benchmark?.grossMargin?.typical, { max: 1 });
  const margin = marginOverride ?? benchMargin ?? DEFAULT_MARGIN;

  const priceOverride = positive(o.price);
  const price = priceOverride ?? positive(offer?.price) ?? null;
  const priceConfirmed = Boolean(offer?.priceConfirmed);

  const jobsOverride = positive(o.jobsPerMonth);
  const middle = jobsOverride ?? DEFAULT_JOBS_PER_MONTH;

  const assumptions = [];
  const ticketSource = ticketOverride
    ? { source: "Set in the ROI calculator", url: "", sources: [], verified: false }
    : sourceInfo(benchmark?.ticket?.sources);
  assumptions.push({
    key: "ticket",
    label: "Typical ticket",
    value: ticket,
    display: ticket === null ? "Not set" : `${formatDollars(ticket)} per ${unit}`,
    origin: ticketOverride ? "override" : benchTicket ? "benchmark" : "missing",
    ...ticketSource,
  });
  const marginSource = marginOverride
    ? { source: "Set in the ROI calculator", url: "", sources: [], verified: false }
    : benchMargin
      ? sourceInfo(benchmark?.grossMargin?.sources)
      : { source: `Default ${formatPercent(DEFAULT_MARGIN)} margin, ${PLACEHOLDER_SOURCE.toLowerCase()}`, url: "", sources: [], verified: false };
  assumptions.push({
    key: "margin",
    label: "Gross margin",
    value: margin,
    display: formatPercent(margin),
    origin: marginOverride ? "override" : benchMargin ? "benchmark" : "default",
    ...marginSource,
  });
  assumptions.push({
    key: "price",
    label: "Website price",
    value: price,
    display: price === null ? "Not set" : formatDollars(price),
    origin: priceOverride ? "override" : "offer",
    source: priceOverride
      ? "Set in the ROI calculator"
      : priceConfirmed ? "Kija offer in settings" : "Kija offer in settings, placeholder price until confirmed",
    url: "",
    sources: [],
    verified: !priceOverride && priceConfirmed,
  });
  assumptions.push({
    key: "jobsPerMonth",
    label: "Extra jobs a month",
    value: middle,
    display: fmt1(middle),
    origin: jobsOverride ? "override" : "default",
    source: "Scenario assumption to discuss with the owner, not a forecast",
    url: "",
    sources: [],
    verified: false,
  });

  const inputs = {
    ticket,
    margin,
    price,
    grossPerJob: ticket === null ? null : Math.round(ticket * margin),
    jobsPerMonth: middle,
    unit,
    priceConfirmed,
  };

  if (ticket === null || price === null) {
    const missing = ticket === null ? "a typical ticket value" : "a website price";
    const sentence = `Add ${missing} to see about how many extra jobs would pay for the site.`;
    return {
      inputs,
      breakEven: { jobs: null, sentence },
      scenarios: [],
      rentedLeadComparison: null,
      sentences: [sentence],
      assumptions,
      unverified: true,
      disclaimer: ESTIMATE_DISCLAIMER,
    };
  }

  const grossPerJob = ticket * margin;
  // Nudge down before ceil so 2500 / 250 stays 10 despite float noise.
  const jobs = Math.max(1, Math.ceil(price / grossPerJob - 1e-9));
  const lead1 = ticketOverride ? "At a" : "At a typical";
  const breakEven = {
    jobs,
    sentence: `${lead1} ${formatDollars(ticket)} ${unit} and ${formatPercent(margin)} gross margin, the site pays for itself after ${jobs === 1 ? "about one extra job" : `${jobs} extra jobs, ${paceWithinYear(jobs)}`}.`,
  };

  // 1, 3, 5 by default. An override becomes the middle and the ends keep the 1:3:5 spread.
  const levels = jobsOverride ? [round1(middle / 3), middle, round1((middle * 5) / 3)] : [1, 3, 5];
  const scenarios = levels.map((n, i) => {
    const monthlyGross = n * ticket * margin;
    const annualGross = monthlyGross * 12;
    const paybackMonths = round1(price / monthlyGross);
    const returnMultiple = round1(annualGross / price);
    const jobsText = `${fmt1(n)} extra ${n === 1 ? "job" : "jobs"} a month`;
    const payback = paybackMonths < 1 ? "in under a month" : `in about ${fmt1(paybackMonths)} months`;
    return {
      label: ["low", "middle", "high"][i],
      jobsPerMonth: n,
      monthlyRevenue: Math.round(n * ticket),
      annualRevenue: Math.round(n * ticket * 12),
      annualGrossProfit: Math.round(annualGross),
      paybackMonths,
      returnMultiple,
      sentence: `If the site brings in about ${jobsText}, that is about ${formatDollars(n * ticket)} a month in revenue and about ${formatDollars(annualGross)} a year in gross profit, so it would pay for itself ${payback}.`,
    };
  });

  let rentedLeadComparison = null;
  const rented = benchmark?.rentedLead;
  if (rented && positive(rented.low) && positive(rented.high)) {
    const perLead = (rented.low + rented.high) / 2;
    const leads = Math.max(1, Math.round(price / perLead));
    const platform = rented.platform ? ` from ${rented.platform}` : "";
    rentedLeadComparison = {
      low: rented.low,
      high: rented.high,
      platform: rented.platform ?? "",
      leads,
      sentence: `The site costs about the same as ${leads} rented leads${platform}, at about ${formatDollars(rented.low)} to ${formatDollars(rented.high)} each.`,
    };
    assumptions.push({
      key: "rentedLead",
      label: "Rented lead cost",
      value: perLead,
      display: `${formatDollars(rented.low)} to ${formatDollars(rented.high)}`,
      origin: "benchmark",
      ...sourceInfo(rented.sources),
    });
  }

  const sentences = [breakEven.sentence, ...scenarios.map((s) => s.sentence)];
  if (rentedLeadComparison) sentences.push(rentedLeadComparison.sentence);

  return {
    inputs,
    breakEven,
    scenarios,
    rentedLeadComparison,
    sentences,
    assumptions,
    unverified: assumptions.some((a) => a.key !== "jobsPerMonth" && !a.verified),
    disclaimer: ESTIMATE_DISCLAIMER,
  };
}
