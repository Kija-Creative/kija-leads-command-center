// Text, phone and identity helpers. Pure: no disk, no clock.

const APOSTROPHES = /['\u2018\u2019\u02bc`]/g;
const DROP_WORDS = new Set(["inc", "llc", "co", "ltd", "the"]);

function asciiFold(text) {
  // NFKD splits accented letters into base letter plus combining mark; drop the marks.
  return String(text ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function slugify(text) {
  return asciiFold(text)
    .toLowerCase()
    .replace(APOSTROPHES, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Ten digit US number as a string, or "" when the input is not a plausible US number.
export function phoneDigits(raw) {
  if (raw === null || raw === undefined) return "";
  // Drop a trailing extension so "214-946-4100 ext 12" still parses.
  const text = String(raw).replace(/\s*(ext\.?|extension|x|#)\s*\d{1,6}\s*$/i, "");
  let digits = text.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return "";
  // NANP: area code and exchange never start with 0 or 1.
  if (digits[0] < "2" || digits[3] < "2") return "";
  return digits;
}

export function normalizePhone(raw) {
  const d = phoneDigits(raw);
  return d ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : "";
}

export function normalizeName(name) {
  const words = asciiFold(name)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(APOSTROPHES, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w && !DROP_WORDS.has(w));
  return words.join(" ");
}

export function nameStateKey({ business, state } = {}) {
  return `${normalizeName(business)}|${String(state ?? "").trim().toUpperCase()}`;
}

// Callers pass { business, city, state, phone }. city is deliberately not part of the key:
// the same shop is often listed under a suburb in one source and the core city in another.
export function dedupeKey({ business, state, phone } = {}) {
  return phoneDigits(phone) || nameStateKey({ business, state });
}

// Duplicate rule from SPEC: phone digits match, or normalized name plus state match.
export function sameBusiness(a, b) {
  if (!a || !b) return false;
  const pa = phoneDigits(a.phone);
  const pb = phoneDigits(b.phone);
  if (pa && pb && pa === pb) return true;
  const na = normalizeName(a.business ?? a.candidate);
  const nb = normalizeName(b.business ?? b.candidate);
  if (!na || !nb) return false;
  return na === nb && String(a.state ?? "").trim().toUpperCase() === String(b.state ?? "").trim().toUpperCase();
}

function chainList(chains) {
  if (Array.isArray(chains)) return { names: chains, allow: [] };
  return { names: chains?.names ?? [], allow: chains?.allow ?? [] };
}

// chains may be the config object { names, allow } or a plain array of names.
export function isChain(name, chains) {
  const n = normalizeName(name);
  if (!n) return { chain: false, match: "" };
  const { names, allow } = chainList(chains);
  if (allow.some((a) => normalizeName(a) === n)) return { chain: false, match: "" };
  const padded = ` ${n} `;
  for (const chainName of names) {
    const c = normalizeName(chainName);
    if (!c) continue;
    if (n === c || n.startsWith(`${c} `)) return { chain: true, match: chainName };
    // Long chain names are distinctive enough to match anywhere; short ones only as a prefix,
    // so "Quick Fix Auto" is not mistaken for the "Fix Auto" franchise.
    if (c.split(" ").length >= 3 && padded.includes(` ${c} `)) return { chain: true, match: chainName };
  }
  return { chain: false, match: "" };
}

export function hostname(url) {
  if (!url) return "";
  const text = String(url).trim();
  for (const candidate of [text, `https://${text}`]) {
    try {
      const u = new URL(candidate);
      if (u.hostname && u.hostname.includes(".")) return u.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      // try the next form
    }
  }
  return "";
}
