// Guardrails every generated demo must pass. Used by build-demos, the check CLI
// and the tests. A failure is a list of readable sentences, never a throw.

import { DEMO_SENT_MESSAGE, esc, ribbonText } from "./shared.js";

// Claim patterns, English and Spanish. They target the claim, not the word:
// "since 1998" is a claim, "since you called" is not.
export const CLAIM_RULES = [
  { key: "licensed", label: "licensed", patterns: [/\blicen[sc]ed\b/i, /\blicenciad[oa]s?\b/i, /\bcon\s+licencia\b/i] },
  { key: "insured", label: "insured or insurance", patterns: [/\binsured\b/i, /\binsurance\b/i, /\bcon\s+seguro\b/i, /\basegurad[oa]s?\b/i, /\baseguradoras?\b/i, /\bcompa(n|ñ)(i|í)as?\s+de\s+seguros\b/i] },
  { key: "bonded", label: "bonded", patterns: [/\bbonded\b/i, /\bafianzad[oa]s?\b/i] },
  { key: "certified", label: "certified", patterns: [/\bcertifi(?:ed|cation|cations)\b/i, /\bcertificad[oa]s?\b/i, /\bcertificaci(o|ó)n\b/i] },
  { key: "award", label: "award", patterns: [/\baward(?:s|ed)?\b/i, /\baward[\s-]+winning\b/i, /\bpremiad[oa]s?\b/i, /\bgalardonad[oa]s?\b/i] },
  { key: "number-one", label: "#1 or number one", patterns: [/(?<![&\w])#\s?1(?![\w.])/i, /\bnumber\s+one\b/i, /\bno\.\s?1\b/i, /\bn(u|ú)mero\s+uno\b/i] },
  { key: "best-in", label: "best in", patterns: [/\bbest[\s-]+in\b/i, /\b(?:el|la|los|las)\s+mejor(?:es)?\b/i] },
  { key: "since", label: "since (a year)", patterns: [/\bsince\s+((?:19|20)\d{2})\b/i, /\bsince\s+'\d{2}\b/i, /\bdesde\s+((?:19|20)\d{2})\b/i, /\bdesde\s+hace\s+\d+/i] },
  { key: "tenure", label: "years in business", patterns: [/\b\d+\+?\s+years?\s+(?:of|in)\b/i, /\bdecades?\b/i, /\ba(n|ñ)os\s+de\s+experiencia\b/i, /\bd(e|é)cadas\b/i] },
  { key: "family-owned", label: "family owned", patterns: [/\bfamily[\s-]+(?:owned|run|operated)\b/i, /\bnegocio\s+familiar\b/i, /\bempresa\s+familiar\b/i] },
  { key: "guarantee", label: "guarantee", patterns: [/\bguarantee(?:s|d)?\b/i, /\bgarant(i|í)a/i, /\bgarantizad/i] },
  { key: "warranty", label: "warranty", patterns: [/\bwarrant(?:y|ies)\b/i] },
  { key: "financing", label: "financing", patterns: [/\bfinanc(?:ing|e\s+options?)\b/i, /\bfinanciamiento\b/i, /\bfinanciaci(o|ó)n\b/i, /\bfinanciad[oa]s?\b/i] },
];

// Built from char codes so this file never contains the characters it bans.
export const DASH_RE = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]|&(?:mdash|ndash);|&#(?:8211|8212);|&#x201[34];`, "i");

const TRACKERS = /google-analytics|googletagmanager|gtag\(|\bfbq\(|connect\.facebook\.net|hotjar|segment\.com|clarity\.ms|plausible\.io|doubleclick/i;
const NETWORK_CALLS = /\bfetch\s*\(|XMLHttpRequest|sendBeacon|new\s+WebSocket|new\s+EventSource/;
const FONT_HOSTS = /^https:\/\/fonts\.(?:googleapis|gstatic)\.com(?:\/|$)/i;

export function decodeEntities(text) {
  return String(text)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

// Readable text: styles dropped, tags turned into spaces. Script bodies stay in,
// because the Spanish chrome lives there and is shown on toggle.
export function visibleText(html) {
  const noStyle = String(html).replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ");
  const noTags = noStyle.replace(/<script[^>]*>/gi, " ").replace(/<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
  return decodeEntities(noTags).replace(/\s+/g, " ");
}

// Text the lead record itself vouches for. A claim found here is sourced fact.
function backingCorpus(lead) {
  const parts = [lead.business, lead.category, lead.area, lead.hours, lead.address];
  for (const list of [lead.services, lead.reviewThemes]) {
    if (Array.isArray(list)) parts.push(...list);
  }
  if (lead.demoCopy && typeof lead.demoCopy === "object") parts.push(...Object.values(lead.demoCopy));
  return parts.filter((p) => typeof p === "string" && p).join(" \n ");
}

function numbersEqual(found, expected) {
  const n = Number(String(found).replace(/,/g, ""));
  return Number.isFinite(n) && n === Number(expected);
}

export function checkDemoHtml(html, lead) {
  const errors = [];
  const src = String(html || "");
  const l = lead || {};

  if (!/<meta\s+name="robots"\s+content="noindex, nofollow"\s*\/?>/i.test(src)) {
    errors.push("The demo is missing <meta name=\"robots\" content=\"noindex, nofollow\">.");
  }

  const ribbon = esc(ribbonText(l.business || ""));
  if (!src.includes(ribbon)) {
    errors.push(`The concept ribbon text is missing or altered. Expected: "${ribbonText(l.business || "")}"`);
  }
  const ribbonTag = src.match(/<[a-z]+[^>]*\bdata-kija-ribbon\b[^>]*>/i);
  if (!ribbonTag) {
    errors.push("The concept ribbon element (data-kija-ribbon) is missing.");
  } else if (/\shidden\b|data-hidden/i.test(ribbonTag[0])) {
    errors.push("The concept ribbon must be visible when the page loads.");
  }

  const forms = src.match(/<form\b[^>]*>/gi) || [];
  forms.forEach((tag, i) => {
    if (!/\bdata-demo-form\b/i.test(tag)) errors.push(`Form ${i + 1} is missing data-demo-form.`);
    if (/\saction\s*=/i.test(tag)) errors.push(`Form ${i + 1} has an action attribute; demo forms must not submit anywhere.`);
  });
  if (forms.length && !src.includes(DEMO_SENT_MESSAGE)) {
    errors.push(`Demo forms must answer a submit with "${DEMO_SENT_MESSAGE}"`);
  }

  if (DASH_RE.test(src)) {
    errors.push("The demo contains an em dash or en dash.");
  }

  const text = decodeEntities(src);
  const corpus = backingCorpus(l);
  for (const rule of CLAIM_RULES) {
    const backed = rule.key === "since" || rule.key === "tenure" ? false : rule.patterns.some((p) => p.test(corpus));
    for (const pattern of rule.patterns) {
      const g = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
      for (const m of text.matchAll(g)) {
        if (backed) continue;
        if (rule.key === "since" && m[1] && l.established && Number(m[1]) === Number(l.established)) continue;
        if (rule.key === "since" && pattern.test(corpus)) continue;
        if (rule.key === "tenure" && (l.established || pattern.test(corpus))) continue;
        errors.push(`Unbacked claim "${m[0].trim()}" (${rule.label}); the lead record does not carry this fact.`);
      }
    }
  }

  const readable = visibleText(src);
  const ratingAttrs = [...src.matchAll(/\bdata-rating="([^"]*)"/g)].map((m) => m[1]);
  const reviewAttrs = [...src.matchAll(/\bdata-reviews="([^"]*)"/g)].map((m) => m[1]);
  if (!ratingAttrs.length) errors.push("No rating proof block (data-rating) was found.");
  if (!reviewAttrs.length) errors.push("No review count (data-reviews) was found.");
  for (const v of ratingAttrs) {
    if (!numbersEqual(v, l.googleRating)) errors.push(`Rating shown as ${v} but the lead record says ${l.googleRating}.`);
  }
  for (const v of reviewAttrs) {
    if (!numbersEqual(v, l.googleReviews)) errors.push(`Review count shown as ${v} but the lead record says ${l.googleReviews}.`);
  }
  for (const m of readable.matchAll(/(\d+(?:\.\d+)?)\s*(?:out\s+of\s+5\b|stars?\b|estrellas\b|de\s+5\b)/gi)) {
    if (!numbersEqual(m[1], l.googleRating)) errors.push(`Text "${m[0]}" does not match the recorded rating ${l.googleRating}.`);
  }
  for (const m of readable.matchAll(/(\d[\d,]*)\s+(?:Google\s+)?(?:reviews?|rese(?:n|ñ)as)\b/gi)) {
    if (!numbersEqual(m[1], l.googleReviews)) errors.push(`Text "${m[0]}" does not match the recorded ${l.googleReviews} reviews.`);
  }
  if (!/Google reviews/i.test(readable)) errors.push("The rating proof must use the wording \"Google reviews\".");

  if (/<img\b[^>]*\bsrc\s*=\s*["']?\s*(?:https?:)?\/\//i.test(src) || /\bsrcset\s*=\s*["'][^"']*https?:/i.test(src)) {
    errors.push("The demo loads an image from another site; demos must not use other businesses' assets.");
  }
  if (/<script\b[^>]*\bsrc\s*=/i.test(src)) errors.push("The demo loads an external script.");
  if (/<iframe\b/i.test(src)) errors.push("The demo embeds an iframe, which makes an external request.");
  for (const m of src.matchAll(/<link\b[^>]*\bhref\s*=\s*"([^"]*)"/gi)) {
    if (/^(?:https?:)?\/\//i.test(m[1]) && !FONT_HOSTS.test(m[1])) errors.push(`The demo links an external resource other than Google Fonts: ${m[1]}`);
  }
  if (/url\(\s*["']?\s*(?:https?:)?\/\//i.test(src)) errors.push("The demo CSS loads a remote url().");
  if (TRACKERS.test(src)) errors.push("The demo contains a tracking script.");
  if (NETWORK_CALLS.test(src)) errors.push("The demo script makes network requests.");
  if (/<blockquote\b/i.test(src)) errors.push("The demo contains a quote block; reviews appear only as paraphrased themes.");

  return { ok: errors.length === 0, errors, warnings: [] };
}
