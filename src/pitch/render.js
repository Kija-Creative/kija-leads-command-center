// Pitch page generator. renderPitch(lead, options) returns one self-contained
// HTML page for the business owner to read after seeing their demo. The page
// argues from facts on the lead record and numbers from computeRoi; anything
// not sourced is labelled an estimate. Pure: no clock, no disk.
//
// The rating and review count come only from the lead record, which carries its
// own dated source. Nothing on the page is built from Places API responses.

import { formatDollars, ESTIMATE_DISCLAIMER } from "../lib/roi.js";
import {
  DASH_RE,
  REQUEST_ACTIONS,
  checkedDate,
  clean,
  cleanList,
  contactOf,
  esc,
  formatCount,
  formatDate,
  fixDoubledPer,
  formatRating,
  hasSpanish,
  normalizeUnitText,
  perUnit,
  pitchStats,
  placeLine,
  plainPlatform,
  requestKind,
  reviewsPhrase,
  roiFor,
  safeUrl,
  sentence,
  statCite,
  statHeadline,
  statSentence,
  stripDashes,
  telHref,
  titleYear,
  toDate,
  verticalFor,
  withPlainPlatform,
} from "./shared.js";

export const PRICE_TO_CONFIRM = "Pricing to confirm on our call";
export const ESTIMATE_LABEL = "Estimate";
export const FONTS_HREF = "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=League+Gothic&display=swap";

export function demoHref(lead) {
  return `../../demos/${encodeURIComponent(lead.id)}/`;
}

// Five stars, filled to the rating. One per page, so fixed ids are safe.
function starsSvg(rating, cls = "stars") {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const star = "M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z";
  const paths = [0, 1, 2, 3, 4].map((i) => `<path transform="translate(${i * 26} 0)" d="${star}"/>`).join("");
  const width = (r / 5) * 126;
  return `<svg class="${cls}" viewBox="0 0 126 24" role="img" aria-label="${esc(formatRating(r))} out of 5 stars">`
    + `<defs><clipPath id="${cls}-fill"><rect x="0" y="0" width="${width.toFixed(1)}" height="24"/></clipPath></defs>`
    + `<g class="star-empty">${paths}</g><g class="star-full" clip-path="url(#${cls}-fill)">${paths}</g></svg>`;
}

function presenceItems(lead) {
  const p = lead.presence ?? {};
  const named = [
    ["facebook", "a Facebook page"],
    ["instagram", "an Instagram profile"],
    ["yelp", "a Yelp listing"],
    ["booking", "a third party booking page"],
  ];
  const items = [];
  for (const [key, text] of named) {
    const url = safeUrl(p[key]);
    if (url) items.push({ text, url });
  }
  for (const other of Array.isArray(p.other) ? p.other : []) {
    const url = safeUrl(typeof other === "string" ? other : other?.url);
    if (!url) continue;
    const label = typeof other === "object" && clean(other.label) ? clean(other.label) : new URL(url).hostname.replace(/^www\./, "");
    items.push({ text: `a listing on ${label}`, url });
  }
  return items;
}

function websiteChip(gap) {
  if (gap >= 3) return { text: "No website of their own", state: "missing" };
  if (gap === 2) return { text: "Third party pages only", state: "missing" };
  return { text: "Own site, limited", state: "weak" };
}

function linkOrText(text, url) {
  return url ? `<a href="${esc(url)}" rel="noopener noreferrer">${esc(text)}</a>` : esc(text);
}

function heroSection(ctx) {
  const { lead } = ctx;
  const checked = checkedDate(lead);
  const asOf = checked ? `As listed when we checked on ${formatDate(checked)}.` : "As listed on Google.";
  return `
<header class="hero" id="top">
  <div class="wrap">
    <div class="masthead">
      <span class="wordmark">Kija Creative</span>
      <span class="prepared">Prepared for ${esc(ctx.business)}, ${esc(formatDate(ctx.date))}</span>
    </div>
    <div class="hero-grid">
      <div class="hero-copy">
        <p class="kicker">A private proposal${ctx.place ? `, ${esc(ctx.place)}` : ""}</p>
        <h1 class="biz">${esc(ctx.business)}</h1>
        <p class="lede">Your customers already vouch for you. This page shows what a website you own could do with that reputation, and the plain math behind it.</p>
      </div>
      <div class="proof" aria-label="Google rating">
        <div class="proof-num">${esc(formatRating(lead.googleRating))}</div>
        ${starsSvg(lead.googleRating, "hero-stars")}
        <div class="proof-count">${esc(reviewsPhrase(lead))}</div>
        <div class="proof-note">${esc(asOf)}</div>
      </div>
    </div>
  </div>
</header>`;
}

function verdict(rating) {
  const r = Number(rating);
  if (r >= 5) return "a perfect score";
  if (r >= 4.8) return "close to perfect";
  return "overwhelmingly good";
}

function trustSection(ctx) {
  const { lead } = ctx;
  const themes = cleanList(lead.reviewThemes).slice(0, 5);
  const where = ctx.place ? ` in ${esc(ctx.place)}` : "";
  const themeBlock = themes.length
    ? `<div class="themes">
        <h3>What customers keep saying</h3>
        <ul class="theme-list">${themes.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <p class="fine">Themes we noticed reading your reviews, in our words. We do not quote customers.</p>
      </div>`
    : `<div class="themes">
        <h3>What customers keep saying</h3>
        <p>We would rather hear it from you. On our call we can read your recent reviews together and pull out the themes your site should lead with.</p>
      </div>`;
  return `
<section class="block trust" id="trust" aria-labelledby="trust-h">
  <div class="wrap two">
    <div>
      <h2 id="trust-h">You already earned the trust</h2>
      <p class="big">${esc(formatRating(lead.googleRating))} stars across ${esc(reviewsPhrase(lead))}${where}. That is ${esc(formatCount(lead.googleReviews))} customers who took the time to tell strangers what it is like to work with you, and the verdict is ${esc(verdict(lead.googleRating))}.</p>
      <p>That kind of reputation is slow to build and hard to fake. A website does not create it. Its job is to make sure the next person who finds you can act on it.</p>
    </div>
    ${themeBlock}
  </div>
</section>`;
}

// One stat: the headline number alone ("41%", never "41% always (29% in 2025)"),
// one plain sentence, then the source and year.
function statItem(s) {
  const headline = statHeadline(s.value);
  // A fragment claim ("of shoppers read reviews") reads straight on from the number
  // above it, so it is not repeated; a full sentence stands on its own.
  const fragment = headline && /^[a-z]/.test(clean(s.claim));
  return `<li>
          ${headline ? `<strong class="stat-val">${esc(headline)}</strong>` : ""}
          <span class="stat-claim">${esc(fragment ? sentence(s.claim) : statSentence(s))}</span>
          <cite>${linkOrText(statCite(s), safeUrl(s.url))}</cite>
        </li>`;
}

function gapSection(ctx) {
  const { lead } = ctx;
  const gap = Number(lead.websiteGap) || 0;
  const chip = websiteChip(gap);
  const presence = presenceItems(lead);
  const phone = clean(lead.phone);
  const can = [
    `See your ${esc(formatRating(lead.googleRating))} star rating and ${esc(formatCount(lead.googleReviews))} reviews on Google.`,
  ];
  if (phone) can.push(`Call you at <a href="${esc(telHref(phone))}">${esc(phone)}</a>.`);
  for (const item of presence) can.push(`Find ${linkOrText(item.text, item.url)}.`);

  const action = REQUEST_ACTIONS[ctx.kind];
  const missing = [
    "See what you do, in your words, on a page you own.",
    `${action.charAt(0).toUpperCase()}${action.slice(1)}.`,
    "Land on a page that carries only your name, instead of a directory page you do not control.",
  ];
  if (ctx.spanish) missing.push("Read about you in Spanish as easily as in English.");
  const missingTitle = gap >= 2 ? "What they cannot do yet" : "What your site could do better";

  const stats = pitchStats(ctx.benchmarks, { lead });
  const statBlock = stats.length
    ? `<div class="stats" aria-label="Research on how customers choose local businesses">
        <h3>How people choose a local business</h3>
        <ul class="stat-list">${stats.map(statItem).join("")}</ul>
      </div>`
    : "";

  return `
<section class="block gap" id="gap" aria-labelledby="gap-h">
  <div class="wrap">
    <h2 id="gap-h">What a customer finds today</h2>
    <div class="gap-grid">
      <figure class="sketch">
        <div class="sketch-card" aria-hidden="true">
          <div class="sk-name">${esc(ctx.business)}</div>
          <div class="sk-rating"><span>${esc(formatRating(lead.googleRating))}</span>${starsSvg(lead.googleRating, "sk-stars")}<span>(${esc(formatCount(lead.googleReviews))})</span></div>
          <div class="sk-meta">${esc(clean(lead.category))}${ctx.place ? `, ${esc(ctx.place)}` : ""}</div>
          <div class="sk-actions">
            <span class="sk-chip ok">Call</span>
            <span class="sk-chip ${chip.state}">${esc(chip.text)}</span>
          </div>
        </div>
        <figcaption><span class="fine">A simplified sketch of a search listing, not a screenshot.</span> What our research found: ${esc(sentence(lead.websiteStatus))}</figcaption>
      </figure>
      <div class="lists">
        <div>
          <h3>What they can do</h3>
          <ul class="ticks can">${can.map((t) => `<li>${t}</li>`).join("")}</ul>
        </div>
        <div>
          <h3>${missingTitle}</h3>
          <ul class="ticks cannot">${missing.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        </div>
      </div>
    </div>
    ${statBlock}
  </div>
</section>`;
}

// demoConcept is written by researchers for Jamey ("estimate CTA", "hours/map").
// The owner reads this page, so trade the shorthand for plain words.
export function plainConcept(text) {
  return clean(text)
    .replace(/\bCTAs\b/g, "buttons")
    .replace(/\bCTA\b/g, "button")
    .replace(/\b[A-Za-z]+(?:\/[A-Za-z]+)+\b/g, (m) => {
      const parts = m.split("/");
      return parts.length === 2 ? parts.join(" and ") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
    });
}

function conceptSection(ctx) {
  const { lead } = ctx;
  const action = REQUEST_ACTIONS[ctx.kind];
  const does = [
    ["Call in one tap", "A call button stays within reach on every screen, so a customer on a phone never hunts for your number."],
    ["Your reputation up front", `Your ${formatRating(lead.googleRating)} rating and ${reviewsPhrase(lead)} are the first proof a visitor sees, shown exactly as Google lists them.`],
    ["A request path that fits your work", `Customers can ${action}. You get the details before you call back.`],
    ["Services in plain words", "Each service is spelled out, so people know they are in the right place before they call."],
  ];
  if (ctx.spanish) does.push(["English and Spanish", "One tap switches the page between English and Spanish."]);
  const concept = sentence(plainConcept(lead.demoConcept));
  return `
<section class="block concept" id="concept" aria-labelledby="concept-h">
  <div class="wrap">
    <h2 id="concept-h">The concept we built for you</h2>
    <div class="concept-grid">
      <div>
        ${concept ? `<p class="big">${esc(concept)}</p>` : ""}
        <p>It is private and unpublished, made to show you rather than tell you. Names, services and details are ours to confirm with you before anything is real.</p>
        <p class="screen-only"><a class="btn" href="${esc(demoHref(lead))}">Open the private concept</a></p>
        <p class="print-only fine">We will walk through the live concept together on our call.</p>
      </div>
      <dl class="does">
        ${does.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join("")}
      </dl>
    </div>
  </div>
</section>`;
}

function badge(verified, text = ESTIMATE_LABEL) {
  return verified ? "" : ` <span class="badge">${esc(text)}</span>`;
}

// Owner facing wording for an assumption's source.
function assumptionSource(a, ctx) {
  if (a.key === "price") {
    return esc(ctx.priceConfirmed ? "Kija's current offer." : "A working price for planning. The real price is set together on our call.");
  }
  if (a.key === "jobsPerMonth") return esc("A scenario to talk through, not a forecast.");
  if (a.origin === "override") return esc("A number we adjusted for your business. Tell us if it is off.");
  const sources = Array.isArray(a.sources) ? a.sources.filter((s) => s.title || s.url) : [];
  if (sources.length) {
    return sources.map((s) => linkOrText(titleYear(s.title || s.url, s.year), safeUrl(s.url))).join("; ");
  }
  return esc("A working estimate, not yet backed by a published source. Your real number replaces it.");
}

function assumptionValue(a, ctx) {
  if (a.key === "price" && !ctx.priceConfirmed) return PRICE_TO_CONFIRM;
  if (a.key === "jobsPerMonth") return `${a.display} as the middle case`;
  if (a.key === "ticket" && Number(a.value) > 0) return `${formatDollars(a.value)} ${perUnit(ctx.roi.inputs?.unit)}`;
  return fixDoubledPer(clean(a.display));
}

function isVerified(roi, key, fallback) {
  const a = Array.isArray(roi.assumptions) ? roi.assumptions.find((x) => x.key === key) : null;
  return a ? Boolean(a.verified) : Boolean(fallback);
}

// The rented lead comparison as support for the customer line: same numbers, framed
// as why the customer figure is the one that counts. Falls back to computeRoi's
// own sentence when a field is missing.
function supportingLeadLine(lead) {
  const leads = Number(lead?.leads);
  const low = Number(lead?.low);
  const high = Number(lead?.high);
  if (!(leads > 0) || !(low > 0) || !(high > 0)) return withPlainPlatform(lead?.sentence, lead?.platform);
  const platform = plainPlatform(lead.platform);
  const range = low === high ? formatDollars(low) : `${formatDollars(low)} to ${formatDollars(high)}`;
  return `Counted per lead instead, the same money buys about ${leads} rented ${leads === 1 ? "lead" : "leads"}${platform ? ` from ${platform}` : ""} at about ${range} each, and not every lead becomes a paying customer.`;
}

// Cost per paying customer is the strongest comparison, so it leads when computeRoi
// has one; the cost per rented lead follows as support, or stands alone without it.
function rentedBlock(roi) {
  const customer = roi.rentedCustomerComparison;
  const lead = roi.rentedLeadComparison;
  const customerText = withPlainPlatform(customer?.sentence, customer?.platform);
  const leadText = clean(lead?.sentence);
  const tidy = (text) => esc(normalizeUnitText(text, roi.inputs ?? {}));
  const leadBadge = badge(isVerified(roi, "rentedLead", false));
  if (customerText) {
    const customerBadge = badge(isVerified(roi, "rentedCustomer", customer.verified ?? (Array.isArray(customer.sources) && customer.sources.length > 0)));
    return `<p class="rented rented-customer">${tidy(customerText)}${customerBadge}</p>`
      + (leadText ? `<p class="rented-lead">${tidy(supportingLeadLine(lead))}${leadBadge}</p>` : "");
  }
  if (leadText) return `<p class="rented rented-lead">${tidy(withPlainPlatform(leadText, lead.platform))}${leadBadge}</p>`;
  return "";
}

function mathSection(ctx) {
  const { roi } = ctx;
  const priceNote = ctx.priceConfirmed ? "" : " It uses a working price, since final pricing is set on our call.";
  const assumptions = roi.assumptions.map((a) => {
    let labelled = badge(a.verified);
    if (a.key === "jobsPerMonth") labelled = badge(false, "Scenario");
    else if (a.key === "price" && !ctx.priceConfirmed) labelled = badge(false, "To confirm");
    return `<li><span class="a-label">${esc(a.label)}</span><span class="a-val">${esc(assumptionValue(a, ctx))}${labelled}</span><span class="a-src">${assumptionSource(a, ctx)}</span></li>`;
  }).join("");

  if (!roi.breakEven.jobs) {
    return `
<section class="block math page-start" id="math" aria-labelledby="math-h">
  <div class="wrap">
    <h2 id="math-h">The math</h2>
    <p class="big">We would rather run these numbers with your real average job than guess. On our call it takes about two minutes: your typical ticket, your margin, and how many extra jobs a month would feel realistic.</p>
    <ul class="assumptions">${assumptions}</ul>
    <p class="disclaimer">${esc(ESTIMATE_DISCLAIMER)}</p>
  </div>
</section>`;
  }

  const beLabel = roi.unverified ? `<span class="badge">${ESTIMATE_LABEL}</span>` : "";
  const rows = roi.scenarios.map((s) => `<tr class="${s.label === "middle" ? "mid" : ""}">
      <th scope="row">${esc(String(s.jobsPerMonth))} a month</th>
      <td>${esc(formatDollars(s.monthlyRevenue))}</td>
      <td>${esc(formatDollars(s.annualGrossProfit))}</td>
      <td>${s.paybackMonths < 1 ? "Under a month" : `About ${esc(String(s.paybackMonths))} months`}</td>
      <td>${esc(String(s.returnMultiple))}x</td>
    </tr>`).join("");
  const rented = rentedBlock(roi);
  const middle = roi.scenarios.find((s) => s.label === "middle");

  return `
<section class="block math page-start" id="math" aria-labelledby="math-h">
  <div class="wrap">
    <h2 id="math-h">The math, in plain words</h2>
    <div class="breakeven">
      <div class="be-num"><span class="n">${esc(String(roi.breakEven.jobs))}</span><span class="u">extra ${roi.breakEven.jobs === 1 ? "job" : "jobs"}</span></div>
      <div class="be-copy">
        <p class="big">${esc(normalizeUnitText(clean(roi.breakEven.sentence), roi.inputs ?? {}))} ${beLabel}</p>
        <p>After that, every extra job the site brings in is yours to keep.${esc(priceNote)}</p>
      </div>
    </div>
    <h3>If the site brings in a few extra jobs a month</h3>
    <div class="table-wrap">
      <table class="scen">
        <caption class="fine">All figures are estimates${roi.unverified ? " built on working numbers" : ""}. Revenue is what customers pay; gross profit is what is left after the cost of the job.</caption>
        <thead><tr><th scope="col">Extra jobs</th><th scope="col">Revenue a month</th><th scope="col">Gross profit a year</th><th scope="col">Pays for itself</th><th scope="col">First year return</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${middle ? `<p>${esc(normalizeUnitText(clean(middle.sentence), roi.inputs ?? {}))}</p>` : ""}
    ${rented}
    <h3>Every number we used</h3>
    <ul class="assumptions">${assumptions}</ul>
    <p class="disclaimer">${esc(ESTIMATE_DISCLAIMER)}</p>
  </div>
</section>`;
}

function marketLine(benchmarks) {
  const m = benchmarks?.websiteMarket;
  const sources = Array.isArray(m?.sources) ? m.sources.filter((s) => s && (s.title || s.url)) : [];
  const sub = m?.subscription;
  if (!sources.length || !(sub?.lowMonthly > 0) || !(sub?.highMonthly > 0)) return "";
  const cite = sources.map((s) => linkOrText(titleYear(s.title || s.url, s.year), safeUrl(s.url))).join("; ");
  return `<p>For comparison, subscription website plans commonly run about ${esc(formatDollars(sub.lowMonthly))} to ${esc(formatDollars(sub.highMonthly))} a month, for as long as you want the site to stay up. <span class="fine">Source: ${cite}.</span></p>`;
}

function ownSection(ctx) {
  const offer = ctx.settings?.offer ?? {};
  const includes = cleanList(offer.includes);
  const days = Number(offer.timelineDays);
  const care = offer.optionalCare ?? {};
  const careLine = clean(care.name) && (Number(care.monthly) > 0 || clean(care.description))
    ? `<p class="fine">Optional: ${esc(clean(care.name))}${Number(care.monthly) > 0 && ctx.priceConfirmed ? `, ${esc(formatDollars(care.monthly))} a month` : ""}${clean(care.description) ? `. ${esc(sentence(care.description))}` : "."} You can skip it and still own everything.</p>`
    : "";
  const price = ctx.priceConfirmed && Number(offer.price) > 0 ? formatDollars(offer.price) : "";
  return `
<section class="block own page-start" id="own" aria-labelledby="own-h">
  <div class="wrap two">
    <div>
      <h2 id="own-h">Own it. Do not rent it.</h2>
      <p class="big">We think a local business should own its marketing, not rent it.</p>
      <p>Directory listings, lead services and monthly website plans all charge you, again and again, for access to customers who already trust you. Stop paying and the page goes away. A site you own works the other way: the domain, the design and the words are yours to keep, change or take elsewhere.</p>
      ${marketLine(ctx.benchmarks)}
    </div>
    <div class="offer">
      <h3 class="offer-name">${esc(clean(offer.name) || "Owned Website")}</h3>
      <div class="price">${price ? esc(price) : esc(PRICE_TO_CONFIRM)}</div>
      ${includes.length ? `<ul class="ticks can">${includes.map((i) => `<li>${esc(sentence(i))}</li>`).join("")}</ul>` : ""}
      ${days > 0 ? `<p><strong>Timeline:</strong> about ${esc(String(days))} days from the go ahead.</p>` : ""}
      ${clean(offer.ownershipLine) ? `<p class="ownership">${esc(sentence(offer.ownershipLine))}</p>` : ""}
      ${careLine}
    </div>
  </div>
</section>`;
}

function nextSection(ctx) {
  const c = ctx.contact;
  const subject = encodeURIComponent(`15 minute walkthrough for ${ctx.business}`);
  const lines = [];
  if (c.email) lines.push(`<li><span>Email</span><a href="mailto:${esc(c.email)}?subject=${esc(subject)}">${esc(c.email)}</a></li>`);
  if (c.phone) lines.push(`<li><span>Phone</span><a href="${esc(telHref(c.phone))}">${esc(c.phone)}</a></li>`);
  if (safeUrl(c.site)) lines.push(`<li><span>Web</span><a href="${esc(safeUrl(c.site))}" rel="noopener noreferrer">${esc(c.site.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a></li>`);
  return `
<section class="block next" id="next" aria-labelledby="next-h">
  <div class="wrap two">
    <div>
      <h2 id="next-h">Next step: a 15 minute walkthrough</h2>
      <p class="big">We open the concept together, swap in your real numbers, and you decide whether it is worth doing.</p>
      <p>If it is not a fit, that is a fine answer. Nothing goes live and nothing changes unless you say so.</p>
    </div>
    <div class="contact">
      <p class="who"><strong>${esc(c.name)}</strong><br>${esc(c.title)}</p>
      <ul class="contact-list">${lines.join("")}</ul>
    </div>
  </div>
</section>`;
}

const CSS = `
:root {
  --ink: #0b0b0d;
  --plum: #210019;
  --plum-2: #2c0a24;
  --magenta: #ae0f64;
  --magenta-hi: #e0368f;
  --green: #5dff92;
  --bg: #0b0b0d;
  --surface: #160711;
  --line: rgba(255, 255, 255, 0.12);
  --text: #f4eef2;
  --muted: #c3b6bf;
  --positive: #5dff92;
  --star-empty: rgba(255, 255, 255, 0.18);
  --display: "League Gothic", "Arial Narrow", Impact, sans-serif;
  --body: "Hanken Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif;
  color-scheme: dark;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font: 400 17px/1.65 var(--body); }
a { color: var(--magenta-hi); text-underline-offset: 3px; }
a:hover { color: #fff; }
a:focus-visible, .btn:focus-visible { outline: 3px solid var(--green); outline-offset: 3px; border-radius: 4px; }
.wrap { width: min(1080px, 100% - 32px); margin-inline: auto; }
.two { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: clamp(28px, 5vw, 72px); align-items: start; }
h1, h2, h3 { text-wrap: balance; margin: 0; }
h2 { font: 400 clamp(2.4rem, 5.2vw, 3.9rem)/0.98 var(--display); letter-spacing: 0.005em; margin-bottom: 0.45em; }
h3 { font: 700 0.95rem/1.3 var(--body); margin: 0 0 0.8em; color: var(--text); }
p { margin: 0 0 1em; max-width: 68ch; text-wrap: pretty; }
.big { font-size: clamp(1.15rem, 2vw, 1.4rem); line-height: 1.5; color: var(--text); }
.fine { font-size: 0.86rem; color: var(--muted); }
.block { padding: clamp(56px, 8vw, 104px) 0; border-top: 1px solid var(--line); }
.block p:not(.big):not(.fine) { color: var(--muted); }

/* Hero: the one drenched surface, plum carrying the brand. */
.hero { background: radial-gradient(120% 90% at 85% 10%, #3a0530 0%, var(--plum) 55%, #14000f 100%); padding: 28px 0 clamp(56px, 8vw, 96px); overflow: hidden; }
.masthead { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; align-items: baseline; padding-bottom: clamp(40px, 7vw, 88px); }
.wordmark { font: 400 1.7rem/1 var(--display); letter-spacing: 0.02em; }
.prepared { font-size: 0.85rem; color: var(--muted); }
.hero-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(220px, 0.8fr); gap: clamp(28px, 5vw, 64px); align-items: end; }
.kicker { color: var(--green); font-weight: 600; font-size: 0.95rem; margin-bottom: 0.9em; }
.biz { font: 400 clamp(3.2rem, 9vw, 6rem)/0.92 var(--display); letter-spacing: 0.005em; overflow-wrap: anywhere; margin-bottom: 0.3em; animation: rise 900ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.lede { font-size: clamp(1.1rem, 1.8vw, 1.3rem); color: #eadfe6; max-width: 46ch; }
.proof { border-top: 2px solid var(--green); padding-top: 18px; }
.proof-num { font: 400 clamp(5rem, 12vw, 7.5rem)/0.85 var(--display); color: var(--green); }
.hero-stars { width: 180px; height: auto; margin: 12px 0 10px; display: block; }
.proof-count { font-weight: 700; font-size: 1.15rem; }
.proof-note { font-size: 0.82rem; color: var(--muted); margin-top: 4px; }
.star-empty path { fill: var(--star-empty); }
.star-full path { fill: var(--positive); }
.hero-stars .star-full path { animation: glow 1200ms 300ms cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes rise { from { transform: translateY(18px); } to { transform: none; } }
@keyframes glow { from { filter: brightness(0.6); } to { filter: none; } }

/* Trust */
.theme-list { list-style: none; padding: 0; margin: 0 0 1em; display: flex; flex-wrap: wrap; gap: 10px; }
.theme-list li { border: 1px solid rgba(93, 255, 146, 0.45); color: var(--text); padding: 8px 14px; border-radius: 999px; font-weight: 600; font-size: 0.98rem; }
.themes { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 24px; }

/* Gap */
.gap-grid { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: clamp(28px, 5vw, 64px); align-items: start; }
.sketch { margin: 0; }
.sketch-card { background: #f7f5f6; color: #1d1a1c; border-radius: 14px; padding: 22px 22px 20px; box-shadow: 0 30px 60px -30px rgba(174, 15, 100, 0.55); }
.sk-name { font-weight: 700; font-size: 1.25rem; line-height: 1.25; }
.sk-rating { display: flex; align-items: center; gap: 8px; margin: 6px 0 2px; font-size: 0.95rem; color: #3b3439; }
.sk-stars { width: 86px; height: auto; }
.sk-stars .star-empty path { fill: #d8d1d5; }
.sk-stars .star-full path { fill: #b7791f; }
.sk-meta { font-size: 0.9rem; color: #5b5358; }
.sk-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.sk-chip { font-size: 0.85rem; font-weight: 600; padding: 7px 12px; border-radius: 999px; border: 1px solid #cfc6cb; }
.sk-chip.ok { background: #1d1a1c; color: #fff; border-color: #1d1a1c; }
.sk-chip.missing { color: #8a1450; border-style: dashed; border-color: #ae0f64; text-decoration: line-through; text-decoration-thickness: 1px; }
.sk-chip.weak { color: #8a1450; border-style: dashed; border-color: #ae0f64; }
figcaption { margin-top: 14px; font-size: 0.95rem; color: var(--muted); }
figcaption .fine { display: block; margin-bottom: 4px; }
.lists { display: grid; gap: 28px; }
.ticks { list-style: none; padding: 0; margin: 0; }
.ticks li { position: relative; padding-left: 30px; margin-bottom: 10px; }
.ticks li::before { content: ""; position: absolute; left: 0; top: 0.45em; width: 16px; height: 16px; border-radius: 50%; }
.ticks.can li::before { border: 2px solid var(--positive); }
.ticks.cannot li::before { border: 2px dashed var(--magenta-hi); }
.stats { margin-top: clamp(40px, 6vw, 64px); padding-top: 28px; border-top: 1px solid var(--line); }
.stat-list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 28px; }
.stat-val { display: block; font: 400 3rem/1 var(--display); color: var(--green); margin-bottom: 6px; }
.stat-claim { display: block; }
.stat-list cite { display: block; font-style: normal; font-size: 0.84rem; color: var(--muted); margin-top: 6px; }

/* Concept */
.concept-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(28px, 5vw, 72px); align-items: start; }
.btn { display: inline-block; background: var(--magenta); color: #fff; font-weight: 700; text-decoration: none; padding: 14px 22px; border-radius: 10px; transition: background 200ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms cubic-bezier(0.22, 1, 0.36, 1); }
.btn:hover { background: #c81574; color: #fff; transform: translateY(-1px); }
.does { margin: 0; display: grid; gap: 0; }
.does div { padding: 16px 0; border-bottom: 1px solid var(--line); }
.does div:first-child { padding-top: 0; }
.does dt { font-weight: 700; margin-bottom: 4px; }
.does dd { margin: 0; color: var(--muted); }
.print-only { display: none; }

/* Math */
.math { background: linear-gradient(180deg, #120510 0%, var(--bg) 70%); }
.breakeven { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: clamp(24px, 4vw, 56px); align-items: center; margin-bottom: clamp(36px, 5vw, 56px); }
.be-num { display: flex; flex-direction: column; align-items: flex-start; }
.be-num .n { font: 400 clamp(6rem, 16vw, 9.5rem)/0.8 var(--display); color: var(--green); }
.be-num .u { font-weight: 700; font-size: 1.05rem; margin-top: 8px; }
.badge { display: inline-block; vertical-align: 0.15em; font: 700 0.72rem/1 var(--body); letter-spacing: 0.04em; text-transform: uppercase; color: #ffd7ea; background: rgba(174, 15, 100, 0.35); border: 1px solid var(--magenta); padding: 4px 7px; border-radius: 6px; margin-left: 4px; white-space: nowrap; }
.table-wrap { overflow-x: auto; margin-bottom: 20px; }
.scen { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; min-width: 560px; }
.scen caption { text-align: left; caption-side: bottom; padding-top: 10px; }
.scen th, .scen td { text-align: left; padding: 14px 12px; border-bottom: 1px solid var(--line); }
.scen thead th { font-size: 0.82rem; color: var(--muted); font-weight: 600; }
.scen tbody th { font-weight: 700; }
.scen tr.mid { background: rgba(93, 255, 146, 0.07); }
.scen tr.mid th, .scen tr.mid td { color: #fff; }
.rented { color: var(--text) !important; }
.assumptions { list-style: none; padding: 0; margin: 0 0 24px; }
.assumptions li { display: grid; grid-template-columns: minmax(140px, 0.7fr) minmax(160px, 0.9fr) minmax(0, 1.6fr); gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--line); }
.a-label { font-weight: 700; }
.a-val { font-variant-numeric: tabular-nums; }
.a-src { color: var(--muted); font-size: 0.93rem; }
.disclaimer { font-weight: 700; color: var(--text) !important; }

/* Own it */
.offer { background: var(--plum); border: 1px solid rgba(174, 15, 100, 0.6); border-radius: 16px; padding: clamp(22px, 3vw, 32px); }
.offer-name { font: 400 2.2rem/1 var(--display); margin-bottom: 8px; }
.price { font: 700 1.25rem/1.3 var(--body); color: var(--positive); margin-bottom: 20px; }
.ownership { color: var(--text) !important; font-weight: 600; }

/* Next */
.contact { border-top: 2px solid var(--magenta); padding-top: 18px; }
.who { color: var(--text) !important; }
.contact-list { list-style: none; padding: 0; margin: 0; }
.contact-list li { display: flex; gap: 14px; padding: 8px 0; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
.contact-list span { width: 60px; color: var(--muted); font-size: 0.9rem; }
.foot { padding: 32px 0 48px; border-top: 1px solid var(--line); }
.foot p { font-size: 0.84rem; color: var(--muted); max-width: 90ch; }

@media (max-width: 820px) {
  .two, .hero-grid, .gap-grid, .concept-grid { grid-template-columns: minmax(0, 1fr); }
  .breakeven { grid-template-columns: minmax(0, 1fr); }
  .assumptions li { grid-template-columns: minmax(0, 1fr); gap: 4px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}

/* Print: letter paper, white page, ink only where it carries meaning. */
@page { size: letter; margin: 0.6in 0.65in; }
@media print {
  :root { --bg: #fff; --text: #0b0b0d; --muted: #3f383d; --line: #d9d2d6; --positive: #0b7a3b; --star-empty: #ddd4d9; --surface: #fff; color-scheme: light; }
  body { background: #fff; color: #0b0b0d; font-size: 10pt; line-height: 1.5; }
  .breakeven { grid-template-columns: auto minmax(0, 1fr); }
  .assumptions li { grid-template-columns: 1.2in 1.9in minmax(0, 1fr); gap: 12pt; padding: 6pt 0; }
  .assumptions { margin-bottom: 10pt; }
  .breakeven { margin-bottom: 14pt; gap: 18pt; }
  .scen th, .scen td { padding: 6pt 8pt; }
  .table-wrap { margin-bottom: 8pt; }
  .math h3 { margin: 12pt 0 6pt; }
  .math p { margin-bottom: 6pt; }
  .disclaimer { break-before: avoid; }
  .wrap { width: 100%; }
  a { color: #8a0c4f; text-decoration: none; }
  .hero { background: none; padding: 0 0 18pt; border-bottom: 2pt solid #ae0f64; }
  .masthead { padding-bottom: 20pt; }
  .wordmark { color: #210019; }
  .kicker { color: #8a0c4f; }
  .biz { color: #210019; font-size: 46pt; animation: none; }
  .lede { color: #0b0b0d; }
  .proof { border-top-color: #0b7a3b; }
  .proof-num, .be-num .n, .stat-val { color: #0b7a3b; }
  .proof-num { font-size: 64pt; }
  .be-num .n { font-size: 60pt; }
  h2 { font-size: 28pt; color: #210019; break-after: avoid; }
  h3 { break-after: avoid; }
  .block { padding: 20pt 0; border-top: 0.75pt solid #d9d2d6; }
  .page-start { break-before: page; border-top: 0; padding-top: 0; }
  .math { background: none; }
  .themes, .offer { background: #fff; border: 1pt solid #d9d2d6; }
  .offer { border-color: #ae0f64; }
  .theme-list li { border-color: #0b7a3b; color: #0b0b0d; }
  .sketch-card { box-shadow: none; border: 1pt solid #cfc6cb; }
  .badge { color: #8a0c4f; background: #fff; border-color: #ae0f64; }
  .scen { min-width: 0; }
  .scen tr.mid { background: #eefaf2; }
  .scen tr.mid th, .scen tr.mid td { color: #0b0b0d; }
  .table-wrap { overflow: visible; }
  .sketch, .themes, .offer, .contact, .breakeven, .scen, .assumptions li, .stat-list li, .does div, .ticks li { break-inside: avoid; }
  .two, .gap-grid, .concept-grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
  .hero-grid { grid-template-columns: minmax(0, 1.5fr) minmax(0, 0.8fr); }
  .screen-only { display: none; }
  .print-only { display: block; }
  .foot { padding: 12pt 0 0; }
}
`;

export function renderPitch(lead, { settings = {}, benchmarks = {}, categories = {}, now, roi = null } = {}) {
  if (!lead || typeof lead !== "object" || !lead.id) throw new TypeError("renderPitch needs a lead with an id.");
  const vertical = verticalFor(lead, categories);
  const ctx = {
    lead,
    settings,
    benchmarks,
    business: clean(lead.business),
    place: placeLine(lead),
    date: toDate(now, lead),
    kind: requestKind(vertical, lead.categoryKey),
    vertical,
    spanish: hasSpanish(lead),
    roi: roi && typeof roi === "object" && roi.breakEven ? roi : roiFor(lead, { settings, benchmarks }),
    priceConfirmed: Boolean(settings?.offer?.priceConfirmed),
    contact: contactOf(settings),
  };

  const title = `${ctx.business}: your reputation, and the math`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS_HREF}">
<style>${CSS}</style>
</head>
<body data-pitch="${esc(lead.id)}">
${heroSection(ctx)}
<main>
${trustSection(ctx)}
${gapSection(ctx)}
${conceptSection(ctx)}
${mathSection(ctx)}
${ownSection(ctx)}
${nextSection(ctx)}
</main>
<footer class="foot">
  <div class="wrap">
    <p>Prepared privately by Kija Creative for ${esc(ctx.business)} on ${esc(formatDate(ctx.date))}. Not published. Rating and review count as listed on Google when we checked. Kija Creative is an independent design studio and is not affiliated with Google. Figures in the math are estimates to adjust together, not a promise.</p>
  </div>
</footer>
</body>
</html>
`;
  return stripDashes(html);
}

// Guardrails for a rendered pitch, in the same { ok, errors, warnings } shape as
// the rest of the system. Used by the tests and available to check.js.
export function checkPitchHtml(html, lead, { settings } = {}) {
  const errors = [];
  const warnings = [];
  const text = String(html || "");
  if (!/<meta name="robots" content="noindex, nofollow">/.test(text)) errors.push("The pitch page is missing the noindex, nofollow robots meta tag.");
  if (DASH_RE.test(text)) errors.push("The pitch page contains an em or en dash.");
  if (/guarantee/i.test(text)) errors.push("The pitch page uses the word guarantee.");
  if (/\bper\s+per\b/i.test(text)) errors.push("The pitch page repeats a unit (\"per per\").");
  if (/google partner|partner(?:ed)? with google|certified by google|on behalf of google|endorsed by google/i.test(text)) {
    errors.push("The pitch page implies a tie to Google. Kija is independent and says so.");
  }
  if (lead) {
    // Places API content may not be used to build pitch content (research/places-api.md).
    if (lead.ratingSource === "places-api") {
      errors.push("The lead's rating is recorded from the Places API, which may not be used for pitch content. Record it from the public listing (google-maps-observed) or a secondary source first.");
    }
    if (!text.includes(esc(formatRating(lead.googleRating)))) errors.push("The pitch page does not show the lead's recorded rating.");
    if (!text.includes(esc(reviewsPhrase(lead)))) errors.push("The pitch page does not show the lead's recorded review count.");
  }
  const offer = settings?.offer;
  // Scenario cells are computed revenue (5 jobs at $500 is $2,500), not the price, so
  // they are left out of the search. Anything else that matches is worth a look.
  const outsideScenarios = text.replace(/<table class="scen">[\s\S]*?<\/table>/g, "");
  if (offer && !offer.priceConfirmed && Number(offer.price) > 0 && outsideScenarios.includes(formatDollars(offer.price))) {
    // A sentence figure can still equal the price by coincidence, so this is a warning.
    warnings.push("The pitch page shows a dollar figure equal to the unconfirmed price. Check that the price is not on the page.");
  }
  if (!text.includes(ESTIMATE_DISCLAIMER)) errors.push("The pitch page is missing the estimates disclaimer.");
  return { ok: errors.length === 0, errors, warnings };
}
