// Monthly budget guard for Places Text Search requests. Pure: the caller
// passes the usage object read from data/places-usage.json and `now`, and
// writes the result back itself.
//
// research/places-api.md section 4: every discovery request bills at Text
// Search Enterprise, free for the first 1,000 a month per billing account,
// then $35.00 per 1,000. The guard stops at 900 by default so a retried page
// or a second run in the same month never tips the bill past $0. Use one
// billing account and one project: splitting usage to multiply free caps
// reads as avoiding fees under Terms 3.2.1(c)(ii)(1).
//
// data/places-usage.json is { "YYYY-MM": count }: request counts only, never
// any Places content.

export const PLACES_USAGE_FILE = "data/places-usage.json";
export const PLACES_FREE_MONTHLY = 1000;
export const DEFAULT_MAX_MONTHLY = 900;
export const PRICE_PER_REQUEST = 0.035;

// Calendar month of `now` in UTC, "2026-09".
export function monthKey(now) {
  const date = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(date.getTime())) throw new Error(`Not a valid date: ${now}`);
  return date.toISOString().slice(0, 7);
}

// Keep only "YYYY-MM": whole number pairs; anything else in the file is ignored.
export function cleanUsage(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    const n = Number(value);
    if (/^\d{4}-\d{2}$/.test(key) && Number.isInteger(n) && n >= 0) out[key] = n;
  }
  return out;
}

export function budgetFor({ usage, now, maxMonthly = DEFAULT_MAX_MONTHLY }) {
  const month = monthKey(now);
  const used = cleanUsage(usage)[month] ?? 0;
  const max = Math.max(0, Math.floor(Number(maxMonthly) || 0));
  return {
    month,
    used,
    maxMonthly: max,
    remaining: Math.max(0, max - used),
    freeRemaining: Math.max(0, PLACES_FREE_MONTHLY - used),
  };
}

// A new usage object with `count` more requests in `month`, keys sorted.
export function addUsage(usage, month, count) {
  const clean = cleanUsage(usage);
  const add = Math.max(0, Math.floor(Number(count) || 0));
  clean[month] = (clean[month] ?? 0) + add;
  return Object.fromEntries(Object.keys(clean).sort().map((k) => [k, clean[k]]));
}

function count(n) {
  return Number(n).toLocaleString("en-US");
}

function plural(n, word) {
  return `${count(n)} ${word}${n === 1 ? "" : "s"}`;
}

export function budgetSentence(budget) {
  return `Places budget for ${budget.month}: ${count(budget.used)} of ${count(budget.maxMonthly)} requests used, ${plural(budget.remaining, "request")} left under the monthly guard, ${plural(budget.freeRemaining, "free call")} left of Google's ${count(PLACES_FREE_MONTHLY)} a month.`;
}

export function refusalSentence(budget) {
  return `The monthly guard of ${budget.maxMonthly} Places requests is used up for ${budget.month} (${budget.used} made), so nothing was called. Use web research (WEEKLY_RUN.md step 2B) until next month.`;
}

// A warning when --max-monthly is set above Google's free cap.
export function overFreeCapWarning(maxMonthly) {
  if (maxMonthly <= PLACES_FREE_MONTHLY) return "";
  const extra = maxMonthly - PLACES_FREE_MONTHLY;
  return `--max-monthly ${maxMonthly} is above Google's free ${PLACES_FREE_MONTHLY.toLocaleString("en-US")} a month: up to ${extra} requests could bill at $${PRICE_PER_REQUEST} each (about $${Math.round(extra * PRICE_PER_REQUEST)}).`;
}
