// Small pure helpers shared by the pitch page and the outreach drafts.
// Nothing here reads the clock or the disk, so output is reproducible.

import { benchmarkFor, computeRoi } from "../lib/roi.js";

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };

export function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

// Built from char codes so this file never holds the characters it removes.
const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);
const SPACED_DASH_RE = new RegExp(`\\s*[${EM}${EN}]\\s+|\\s+[${EM}${EN}]\\s*`, "g");
const BARE_DASH_RE = new RegExp(`[${EM}${EN}]`, "g");
export const DASH_RE = new RegExp(`[${EM}${EN}]|&(?:mdash|ndash);|&#(?:8211|8212);|&#x201[34];`, "i");

// A research field could carry a dash. Output never does: a spaced dash reads as
// a pause (comma), a bare one sits in a range or compound word (hyphen).
export function stripDashes(text) {
  return String(text ?? "").replace(SPACED_DASH_RE, ", ").replace(BARE_DASH_RE, "-");
}

export function clean(value) {
  return stripDashes(String(value ?? "").trim());
}

export function cleanList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((s) => clean(s)).filter(Boolean);
}

// Ends a sentence that a researcher may have left without a period.
export function sentence(text) {
  const t = clean(text);
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

export function toDate(now, lead) {
  if (now instanceof Date && !Number.isNaN(now.getTime())) return now;
  if (typeof now === "string" && now) {
    const d = new Date(now.length === 10 ? `${now}T12:00:00.000Z` : now);
    if (!Number.isNaN(d.getTime())) return d;
  }
  // Stay pure: fall back to the lead's own date, never the clock.
  const fallback = new Date(`${lead?.addedAt || "2026-01-01"}T12:00:00.000Z`);
  return Number.isNaN(fallback.getTime()) ? new Date("2026-01-01T12:00:00.000Z") : fallback;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// "2026-09-26" or an ISO stamp to "September 26, 2026", using the date part as written.
export function formatDate(value) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!m) return "";
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${Number(m[3])}, ${m[1]}` : "";
}

export function formatRating(rating) {
  const n = Number(rating);
  if (!Number.isFinite(n)) return "";
  // 5 shows as "5.0" the way Google shows it; recorded decimals are kept as is.
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}

export function formatCount(count) {
  const n = Number(count);
  if (!Number.isFinite(n)) return "";
  return Math.round(n).toLocaleString("en-US");
}

export function reviewsPhrase(lead) {
  const n = Number(lead?.googleReviews);
  return `${formatCount(n)} Google ${n === 1 ? "review" : "reviews"}`;
}

export function telHref(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return "";
}

export function safeUrl(url) {
  const u = String(url || "").trim();
  return /^https?:\/\//i.test(u) ? u : "";
}

export function placeLine(lead) {
  const city = clean(lead?.city);
  const area = clean(lead?.area);
  const state = clean(lead?.state);
  const cityState = [city, state].filter(Boolean).join(", ");
  return area ? `${area}, ${cityState}` : cityState;
}

// The most recent date anyone checked this lead's facts.
export function checkedDate(lead) {
  const dates = [lead?.verification?.checkedAt, ...(Array.isArray(lead?.sources) ? lead.sources.map((s) => s?.checkedAt) : [])]
    .map((d) => String(d || ""))
    .filter((d) => /^\d{4}-\d{2}-\d{2}/.test(d))
    .sort();
  return dates.length ? dates[dates.length - 1].slice(0, 10) : "";
}

export function hasSpanish(lead) {
  const langs = Array.isArray(lead?.languages) ? lead.languages : [];
  return langs.some((l) => /^(spanish|espa(n|ñ)ol|es)$/i.test(String(l).trim()));
}

export function verticalFor(lead, categories) {
  const v = categories?.[lead?.categoryKey]?.vertical;
  return ["auto", "home-services", "contractor", "personal-care", "general"].includes(v) ? v : "general";
}

// Mirrors formKindFor in src/demo/forms.js so the pitch describes the form the
// demo actually has. Kept local so the pitch module does not reach into demo internals.
export function requestKind(vertical, categoryKey) {
  if (vertical === "auto") {
    if (categoryKey === "auto-body-collision" || categoryKey === "auto-detailing") return "photo-estimate";
    if (categoryKey === "tire-shop") return "tire-quote";
    if (categoryKey === "towing" || categoryKey === "diesel-truck-repair" || categoryKey === "mobile-mechanic") return "roadside";
    return "repair-estimate";
  }
  if (vertical === "home-services") return "emergency";
  if (vertical === "contractor") return "estimate";
  if (vertical === "personal-care") return "booking";
  return "request";
}

// What a customer can do through the concept's request form, as a verb phrase.
export const REQUEST_ACTIONS = {
  "photo-estimate": "send photos of the damage to start an estimate",
  "repair-estimate": "describe what the vehicle is doing and request an estimate",
  "tire-quote": "send their tire size and ask what is available",
  roadside: "send their location and what happened when they cannot talk",
  emergency: "send a service request, marked urgent or planned ahead",
  estimate: "request an estimate with project details and photos",
  booking: "request an appointment time",
  request: "send a request with a few details",
};

// Short noun for the request, used in drafts: "a photo estimate path".
export const REQUEST_NOUNS = {
  "photo-estimate": "photo estimate requests",
  "repair-estimate": "estimate requests",
  "tire-quote": "tire size requests",
  roadside: "roadside help requests",
  emergency: "service requests",
  estimate: "estimate requests",
  booking: "appointment requests",
  request: "requests",
};

export function roiFor(lead, { settings, benchmarks } = {}) {
  return computeRoi({
    lead,
    benchmark: benchmarkFor(benchmarks, lead?.categoryKey),
    offer: settings?.offer ?? {},
    overrides: lead?.roiOverrides ?? {},
  });
}

// Consumer statistics a pitch may cite: verified, approved for pitches, and
// complete enough to attribute (claim, year, source). At most three.
export function pitchStats(benchmarks, limit = 3) {
  const list = Array.isArray(benchmarks?.consumerStats) ? benchmarks.consumerStats : [];
  return list
    .filter((s) => s && s.verified === true && s.useInPitch === true && clean(s.claim) && s.year && clean(s.source))
    .slice(0, limit);
}

// Kija's physical mailing address for the CAN-SPAM block. Settings does not have
// the field yet; until it does the draft carries a placeholder to fill in.
export const ADDRESS_PLACEHOLDER = "[Kija mailing address]";
export const PHONE_PLACEHOLDER = "[Kija phone number]";

export function contactOf(settings) {
  const c = settings?.contact ?? {};
  return {
    name: clean(c.name) || "Jamey",
    title: clean(c.title) || "Design Director, Kija Creative",
    email: clean(c.email),
    phone: clean(c.phone),
    site: clean(c.site),
    address: clean(c.address || c.mailingAddress) || ADDRESS_PLACEHOLDER,
  };
}

export function wordCount(text) {
  return String(text || "").split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}
