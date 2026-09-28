// Text helpers shared by the discovery modules. Domain guessing needs its own
// tokenization (possessives, "&" and legal suffixes are kept or dropped per
// variant), so these stay local instead of reusing src/lib/normalize.js.

export const LEGAL_WORDS = new Set([
  "inc", "llc", "co", "corp", "corporation", "ltd", "company", "pllc", "lp", "llp",
]);

// Words a business often leaves out of its domain, so a variant without them
// is worth a lookup: "Al's Auto Repair Shop" may own alsautorepair.com.
export const OPTIONAL_WORDS = new Set([
  "shop", "auto", "automotive", "service", "services", "repair", "repairs", "center",
  "centre", "care", "company", "group", "and", "the", "pro", "pros",
  // category words owners often leave off: papasandninos.com, primetimeseptic.com
  "body", "bodyshop", "collision", "paint", "tire", "tires", "muffler", "exhaust", "truck",
  "towing", "barbershop", "barber", "salon", "plumbing", "roofing", "electric", "electrical",
  "pumping", "septic", "hvac", "heating", "cooling", "air",
]);

// 10 US digits, or "" when the input is not a plausible US number. Same rule
// as src/lib/normalize.js phoneDigits, so discovery dedupes the way ingest does.
export function phoneDigits(raw) {
  const text = String(raw ?? "").replace(/\s*(ext\.?|extension|x|#)\s*\d{1,6}\s*$/i, "");
  let digits = text.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return "";
  // NANP: area code and exchange never start with 0 or 1.
  if (digits[0] < "2" || digits[3] < "2") return "";
  return digits;
}

// NNN-NNN-NNNN, the display format SPEC uses for Lead.phone.
export function formatPhone(raw) {
  const d = phoneDigits(raw);
  return d ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : "";
}

const NAMED_ENTITIES = {
  amp: "&", nbsp: " ", quot: "\"", apos: "'", lt: "<", gt: ">",
  rsquo: "'", lsquo: "'", rdquo: "\"", ldquo: "\"", ndash: "-", mdash: "-",
};

export function decodeEntities(text) {
  return String(text ?? "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      // Dash code points become plain hyphens so evidence never carries them.
      if (code === 0x2013 || code === 0x2014) return "-";
      return String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

function stripAccents(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Tokens of a business name: [{ word, possessive }], lowercase ascii, "&" as "and".
export function nameTokens(name) {
  const text = stripAccents(decodeEntities(name))
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[‘’`]/g, "'");
  const tokens = [];
  for (const raw of text.split(/[^a-z0-9']+/)) {
    if (!raw) continue;
    const possessive = /[a-z0-9]'s$/.test(raw);
    const word = raw.replace(/'/g, "");
    if (word) tokens.push({ word, possessive });
  }
  return tokens;
}

// The words that identify the business: no leading "the", no trailing legal suffix.
export function coreWords(name) {
  const words = nameTokens(name).map((t) => t.word);
  while (words.length > 1 && words[0] === "the") words.shift();
  while (words.length > 1 && LEGAL_WORDS.has(words[words.length - 1])) words.pop();
  return words;
}

// Lowercase words separated by single spaces, for substring matching.
export function matchText(text) {
  return ` ${stripAccents(String(text ?? ""))
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['‘’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

// Visible text of an HTML page plus any JSON-LD blocks (they often carry the
// business name and phone even when the markup does not).
export function plainText(html) {
  const source = String(html ?? "");
  const ld = [];
  for (const m of source.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    ld.push(m[1]);
  }
  const visible = source
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(`${visible} ${ld.join(" ")}`).replace(/\s+/g, " ").trim();
}

export function isoDate(now) {
  const date = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(date.getTime())) throw new Error(`Not a valid date: ${now}`);
  return date.toISOString().slice(0, 10);
}

export function addDays(dateString, days) {
  const date = new Date(`${String(dateString).slice(0, 10)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Run fn over items with at most `limit` in flight. Results keep input order.
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}
