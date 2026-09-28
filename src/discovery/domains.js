// Candidate domain generation for the domain probe. Pure: no DNS, no network.
// The goal is to guess what an owner would have registered, so the probe can
// look for a site the directories missed before we claim there is none.

import { nameTokens, LEGAL_WORDS, OPTIONAL_WORDS } from "./text.js";

export const PROBE_TLDS = Object.freeze(["com", "net", "biz", "us"]);

const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
// Shorter bases ("gm", "als") are someone else's domain far more often than not.
const MIN_BASE_LENGTH = 4;

function uniquePush(list, value) {
  if (value && !list.includes(value)) list.push(value);
}

function slugWords(text) {
  return nameTokens(text).map((t) => t.word);
}

// Name variants as word arrays, most likely first.
export function nameVariants(name) {
  const tokens = nameTokens(name);
  const full = tokens.map((t) => t.word);
  const core = [...full];
  while (core.length > 1 && core[0] === "the") core.shift();
  while (core.length > 1 && LEGAL_WORDS.has(core[core.length - 1])) core.pop();
  const noAnd = core.filter((w) => w !== "and");

  // Drop generic words from the end one at a time: alsautorepairshop, alsautorepair, alsauto.
  const trims = [];
  for (const start of [noAnd, core]) {
    let trimmed = [...start];
    while (trimmed.length > 1 && OPTIONAL_WORDS.has(trimmed[trimmed.length - 1])) {
      trimmed = trimmed.slice(0, -1);
      // Never end a variant on "and": "papas and" is not a name.
      if (trimmed[trimmed.length - 1] !== "and") trims.push(trimmed);
    }
  }

  // "Al's" may register as "al": alautorepairshop.
  const coreTokens = tokens.filter((t) => core.includes(t.word) && t.word !== "and");
  const hasPossessive = coreTokens.some((t) => t.possessive);
  const possessive = hasPossessive
    ? coreTokens.map((t) => (t.possessive ? t.word.replace(/s$/, "") : t.word)).filter(Boolean)
    : [];

  const minimal = noAnd.filter((w) => !OPTIONAL_WORDS.has(w));

  const variants = [];
  const add = (words) => {
    if (!words.length) return;
    const key = words.join(" ");
    if (!variants.some((v) => v.join(" ") === key)) variants.push(words);
  };
  add(core);
  add(noAnd);
  add(full);
  for (const t of trims) add(t);
  add(possessive);
  if (minimal.length >= 2 || minimal.join("").length >= 6) add(minimal);
  return variants;
}

function validLabel(label) {
  return label.length <= 63 && LABEL_RE.test(label);
}

// Domain labels (no TLD) in priority order, split into two tiers.
export function candidateLabels({ name, city = "", state = "" }) {
  const variants = nameVariants(name).filter((w) => w.join("").length >= MIN_BASE_LENGTH);
  const joined = variants.map((w) => w.join(""));
  const citySlug = slugWords(city).join("");
  const cityHyphen = slugWords(city).join("-");
  const st = String(state ?? "").toLowerCase().replace(/[^a-z]/g, "").slice(0, 2);

  const primary = [];
  const secondary = [];
  // The core name, its "and"-less form, the full legal name and the first trim.
  for (const base of joined.slice(0, 4)) uniquePush(primary, base);

  const topBases = joined.slice(0, 3);
  for (const base of topBases) {
    if (citySlug) uniquePush(secondary, `${base}${citySlug}`);
    if (st) uniquePush(secondary, `${base}${st}`);
  }
  const hyphenCore = variants[0] && variants[0].length > 1 ? variants[0].join("-") : "";
  const hyphenNoAnd = variants.find((w) => w.length > 1 && !w.includes("and"));
  if (hyphenCore) uniquePush(secondary, hyphenCore);
  if (hyphenNoAnd) uniquePush(secondary, hyphenNoAnd.join("-"));
  for (const base of joined.slice(4)) uniquePush(secondary, base);
  for (const base of topBases.slice(0, 2)) {
    if (citySlug && st) uniquePush(secondary, `${base}${citySlug}${st}`);
  }
  if (hyphenCore && cityHyphen) uniquePush(secondary, `${hyphenCore}-${cityHyphen}`);

  return {
    primary: primary.filter(validLabel),
    secondary: secondary.filter((l) => validLabel(l) && !primary.includes(l)),
  };
}

// Full candidate domains, most likely first, capped at `max`.
// Order: primary labels on every TLD, then secondary labels .com first.
export function candidateDomains({ name, city = "", state = "", tlds = PROBE_TLDS, max = 64 }) {
  const { primary, secondary } = candidateLabels({ name, city, state });
  const out = [];
  for (const label of primary) for (const tld of tlds) uniquePush(out, `${label}.${tld}`);
  for (const tld of tlds) for (const label of secondary) uniquePush(out, `${label}.${tld}`);
  return out.slice(0, Math.max(0, max));
}

// Normalize a user supplied domain or URL to a bare lowercase host, or "".
export function cleanDomain(input) {
  const text = String(input ?? "").trim().toLowerCase();
  if (!text) return "";
  let host = text;
  try {
    host = new URL(/^[a-z]+:\/\//.test(text) ? text : `https://${text}`).hostname;
  } catch {
    return "";
  }
  host = host.replace(/^www\./, "").replace(/\.$/, "");
  const labels = host.split(".");
  if (labels.length < 2 || !labels.every(validLabel)) return "";
  return host;
}
