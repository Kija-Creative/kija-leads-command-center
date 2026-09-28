// Lead scoring, mirroring the sheet's Scoring Rules tab. Pure.
// The total is always computed from the lead; it is never stored.

export const DEFAULT_THRESHOLDS = {
  minRating: 4.5,
  preferredRating: 4.7,
  minReviews: 20,
  preferredReviews: 30,
  strongReviews: 75,
  minWebsiteGap: 2,
};

const REVIEW_CAP = 300;

export const SCORING_RULES = [
  {
    key: "rating",
    label: "Google rating",
    field: "googleRating",
    max: 30,
    formula: "Rating divided by 5, times 30.",
    why: "Trust already exists; Kija is converting it, not inventing it.",
    scale: "0 to 5 stars, one decimal, as Google shows it.",
  },
  {
    key: "reviews",
    label: "Review volume",
    field: "googleReviews",
    max: 25,
    formula: "Reviews divided by 300, capped at 1, times 25.",
    why: "Volume shows the reputation is durable, not a handful of friends.",
    scale: "Every 12 reviews adds a point, full marks at 300 or more.",
  },
  {
    key: "websiteGap",
    label: "Website gap",
    field: "websiteGap",
    max: 20,
    formula: "Gap score divided by 3, times 20.",
    why: "The bigger the gap, the more an owned site changes what a searcher finds.",
    scale: "1 weak own site, 2 very weak or third party only, 3 no credible owned site.",
  },
  {
    key: "ticketValue",
    label: "Ticket value",
    field: "ticketValue",
    max: 15,
    formula: "Ticket score divided by 3, times 15.",
    why: "Higher tickets mean fewer extra jobs pay for the site.",
    scale: "1 low, 2 medium, 3 high.",
  },
  {
    key: "visualFit",
    label: "Visual fit",
    field: "visualFit",
    max: 10,
    formula: "Visual fit score divided by 3, times 10.",
    why: "Work people can see makes a private demo persuasive.",
    scale: "1 limited, 2 good, 3 excellent.",
  },
];

const GAP_WORDS = { 1: "weak own site", 2: "very weak or third party only", 3: "no credible owned site" };
const TICKET_WORDS = { 1: "low", 2: "medium", 3: "high" };
const VISUAL_WORDS = { 1: "limited", 2: "good", 3: "excellent" };

function round1(n) {
  return Math.round(n * 10) / 10;
}

// 30 reads "30", 6.666 reads "6.7".
function fmt(n) {
  const r = round1(n);
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function readNumber(value, { min, max, label, warnings }) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) {
    warnings.push(`${label} is missing or not a number, so it earns 0 points.`);
    return 0;
  }
  if (n < min || n > max) {
    warnings.push(`${label} ${n} is outside ${min} to ${max}, so it was clamped for scoring.`);
    return Math.min(max, Math.max(min, n));
  }
  return n;
}

function scaleDetail(value, words, label, earned, max, why) {
  const v = Math.round(value);
  const word = words[v] ? ` (${words[v]})` : "";
  return `${label} ${fmt(value)} of 3${word} earns ${fmt(earned)} of ${max}. ${why}`;
}

export function scoreLead(lead, { thresholds } = {}) {
  const t = { ...DEFAULT_THRESHOLDS, ...(thresholds ?? {}) };
  const warnings = [];
  const l = lead ?? {};

  const rating = readNumber(l.googleRating, { min: 0, max: 5, label: "Google rating", warnings });
  const reviews = readNumber(l.googleReviews, { min: 0, max: Number.MAX_SAFE_INTEGER, label: "Google review count", warnings });
  const gap = readNumber(l.websiteGap, { min: 0, max: 3, label: "Website gap", warnings });
  const ticket = readNumber(l.ticketValue, { min: 0, max: 3, label: "Ticket value", warnings });
  const visual = readNumber(l.visualFit, { min: 0, max: 3, label: "Visual fit", warnings });

  const raw = {
    rating: (rating / 5) * 30,
    reviews: Math.min(reviews / REVIEW_CAP, 1) * 25,
    websiteGap: (gap / 3) * 20,
    ticketValue: (ticket / 3) * 15,
    visualFit: (visual / 3) * 10,
  };

  const reviewTail = reviews >= REVIEW_CAP
    ? "That is at or past the 300 review cap, so volume is fully proven."
    : `Every 12 more reviews adds a point, up to full marks at ${REVIEW_CAP}.`;

  const details = {
    rating: `${rating.toFixed(1)} stars earns ${fmt(raw.rating)} of 30. Trust already exists; Kija is converting it, not inventing it.`,
    reviews: `${reviews} Google reviews earns ${fmt(raw.reviews)} of 25. ${reviewTail}`,
    websiteGap: scaleDetail(gap, GAP_WORDS, "Website gap", raw.websiteGap, 20, "The bigger the gap, the more an owned site changes what a searcher finds."),
    ticketValue: scaleDetail(ticket, TICKET_WORDS, "Ticket value", raw.ticketValue, 15, "Higher tickets mean fewer extra jobs pay for the site."),
    visualFit: scaleDetail(visual, VISUAL_WORDS, "Visual fit", raw.visualFit, 10, "Work people can see makes a private demo persuasive."),
  };

  const parts = SCORING_RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    points: round1(raw[rule.key]),
    max: rule.max,
    detail: details[rule.key],
  }));

  const sum = Object.values(raw).reduce((a, b) => a + b, 0);
  const total = Math.round(sum);

  if (rating > 0 && rating < t.preferredRating) {
    warnings.push(`Rating ${rating.toFixed(1)} is below the preferred ${t.preferredRating}.`);
  }
  if (reviews < t.preferredReviews) {
    warnings.push(`${reviews} reviews is below the preferred ${t.preferredReviews}.`);
  }
  if (gap > 0 && gap < t.minWebsiteGap) {
    warnings.push(`Website gap ${fmt(gap)} is below ${t.minWebsiteGap}, so the business already has a site that works reasonably well.`);
  }

  return { total, parts, warnings };
}
