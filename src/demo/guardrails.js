// Guardrails every generated demo must pass. Used by build-demos, the check CLI
// and the tests. A failure is a list of readable sentences, never a throw.

import { DEMO_SENT_MESSAGE, esc, formatRating, ribbonText } from "./shared.js";
import { isLibraryUrl, photoForUrl } from "./stock.js";

// Claim patterns, English and Spanish. They target the claim, not the word:
// "since 1998" (or a bare "since 19") is a claim, "since you called" is not.
export const CLAIM_RULES = [
  { key: "licensed", label: "licensed", patterns: [/\blicen[sc]ed\b/i, /\blicenciad[oa]s?\b/i, /\bcon\s+licencia\b/i] },
  { key: "insured", label: "insured or insurance", patterns: [/\binsured\b/i, /\binsurance\b/i, /\bcon\s+seguro\b/i, /\basegurad[oa]s?\b/i, /\baseguradoras?\b/i, /\bcompa(n|ñ)(i|í)as?\s+de\s+seguros\b/i] },
  { key: "bonded", label: "bonded", patterns: [/\bbonded\b/i, /\bafianzad[oa]s?\b/i] },
  { key: "certified", label: "certified", patterns: [/\bcertifi(?:ed|cation|cations)\b/i, /\bcertificad[oa]s?\b/i, /\bcertificaci(o|ó)n\b/i] },
  { key: "award", label: "award", patterns: [/\baward(?:s|ed)?\b/i, /\baward[\s-]+winning\b/i, /\bpremiad[oa]s?\b/i, /\bgalardonad[oa]s?\b/i] },
  { key: "number-one", label: "#1 or number one", patterns: [/(?<![&\w])#\s?1(?![\w.])/i, /\bnumber\s+(?:one|1)\b/i, /\bno\.\s?1\b/i, /\bn(u|ú)mero\s+(?:uno|1)\b/i] },
  { key: "best-in", label: "best in", patterns: [/\bbest[\s-]+in\b/i, /\b(?:el|la|los|las)\s+mejor(?:es)?\b/i] },
  { key: "since", label: "since (a year)", patterns: [/\bsince\s+((?:19|20)(?:\d{2})?)(?!\d)/i, /\bsince\s+'\d{2}\b/i, /\bdesde\s+((?:19|20)(?:\d{2})?)(?!\d)/i, /\bdesde\s+hace\s+\d+/i, /\best(?:ablished|\.)\s+(?:in\s+)?((?:19|20)\d{2})\b/i] },
  { key: "tenure", label: "years in business", patterns: [/\b\d+\+?\s+years?\s+(?:of|in)\b/i, /\bdecades?\b/i, /\ba(n|ñ)os\s+de\s+experiencia\b/i, /\bd(e|é)cadas\b/i] },
  { key: "family-owned", label: "family owned", patterns: [/\bfamily[\s-]+(?:owned|run|operated|business)\b/i, /\bnegocio\s+familiar\b/i, /\bempresa\s+familiar\b/i] },
  { key: "guarantee", label: "guarantee", patterns: [/\bguarantee(?:s|d)?\b/i, /\bgarant(i|í)a/i, /\bgarantizad/i] },
  { key: "warranty", label: "warranty", patterns: [/\bwarrant(?:y|ies|ied)\b/i] },
  { key: "financing", label: "financing", patterns: [/\bfinanc(?:ing|ed|e)\b/i, /\bfinanciamiento\b/i, /\bfinanciaci(o|ó)n\b/i, /\bfinanciad[oa]s?\b/i] },
];

// Built from char codes so this file never contains the characters it bans.
export const DASH_RE = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]|&(?:mdash|ndash);|&#(?:8211|8212);|&#x201[34];`, "i");

const TRACKERS = /google-analytics|googletagmanager|gtag\(|\bfbq\(|connect\.facebook\.net|hotjar|segment\.com|clarity\.ms|plausible\.io|doubleclick/i;
const NETWORK_CALLS = /\bfetch\s*\(|XMLHttpRequest|sendBeacon|new\s+WebSocket|new\s+EventSource/;
const FONT_HOSTS = /^https:\/\/fonts\.(?:googleapis|gstatic)\.com(?:\/|$)/i;
const OPEN_QUOTE = String.fromCharCode(0x201c);
const CLOSE_QUOTE = String.fromCharCode(0x201d);
const QUOTED_RE = new RegExp(`["${OPEN_QUOTE}]([^"${OPEN_QUOTE}${CLOSE_QUOTE}]{3,})["${CLOSE_QUOTE}]`, "g");
const HIDES = /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?![.\d])/i;

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

function stripScripts(html) {
  return String(html).replace(/<script\b[\s\S]*?<\/script>/gi, " ");
}

// Text of attributes people or search engines read: labels, titles, meta content.
function attributeText(html) {
  const src = stripScripts(html);
  const out = [];
  for (const m of src.matchAll(/\s(?:aria-label|title|alt|content|placeholder)\s*=\s*"([^"]*)"/gi)) out.push(decodeEntities(m[1]));
  const title = src.match(/<title>([\s\S]*?)<\/title>/i);
  if (title) out.push(decodeEntities(title[1]));
  return out.join(" \n ");
}

// Text the lead record itself vouches for. A claim found here is sourced fact.
// demoCopy is deliberately left out: it is copy, not a fact, so a claim typed
// into a headline cannot vouch for itself.
function backingCorpus(lead) {
  const parts = [lead.business, lead.category, lead.area, lead.hours, lead.address];
  for (const list of [lead.services, lead.reviewThemes]) {
    if (Array.isArray(list)) parts.push(...list);
  }
  return parts.filter((p) => typeof p === "string" && p).join(" \n ");
}

// A CSS rule that would hide the ribbon on load. Hiding is allowed only after
// the viewer clicks "Hide for presentation", which sets data-hidden.
function ribbonHidingRule(html) {
  const css = [...String(html).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!HIDES.test(m[2])) continue;
    const parts = m[1].split(",").filter((part) => /kija-ribbon/.test(part));
    if (parts.some((part) => !/data-hidden/.test(part))) return m[1].trim();
  }
  return "";
}

// A script may hide the ribbon only inside a click handler, never on load.
function ribbonHiddenByScript(html) {
  const scripts = [...String(html).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const hide = /ribbon\w*\s*(?:\.\s*setAttribute\(\s*["'](?:data-)?hidden|\.\s*hidden\s*=|\.\s*remove\(\)|\.\s*style\.(?:display|visibility|opacity)|\.\s*classList\.add)/g;
  for (const js of scripts) {
    for (const m of js.matchAll(hide)) {
      const before = js.slice(Math.max(0, m.index - 240), m.index);
      if (!/addEventListener\(\s*["']click["']/.test(before)) return true;
    }
  }
  return false;
}

// Every <img> tag outside scripts.
function imgTags(html) {
  return [...stripScripts(html).matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i"));
  return m ? decodeEntities(m[1]) : null;
}

// An <img> may only show a photo from src/demo/stock-library.json, and each
// one carries the disclosure, sizing and loading rules. Photos shown need the
// footer credit naming their photographers.
function checkImages(html, tags) {
  const errors = [];
  const shown = [];
  tags.forEach((tag, i) => {
    const n = `Image ${i + 1}`;
    const srcUrl = attr(tag, "src");
    if (!srcUrl || !isLibraryUrl(srcUrl)) {
      errors.push(`${n} does not point at a photo in the stock library (${String(srcUrl || "no src").slice(0, 80)}); demos may show library photos only, never another business's images.`);
      return;
    }
    const srcset = attr(tag, "srcset");
    if (srcset !== null) {
      for (const part of srcset.split(",")) {
        const url = part.trim().split(/\s+/)[0];
        if (url && photoForUrl(url) !== photoForUrl(srcUrl)) errors.push(`${n} has a srcset entry that is not the same library photo: ${url.slice(0, 80)}`);
      }
    }
    const alt = attr(tag, "alt");
    if (!alt || !/stock photo$/i.test(alt.trim())) errors.push(`${n} needs alt text that ends with ", stock photo".`);
    for (const a of ["width", "height"]) {
      if (!/^\d+$/.test(String(attr(tag, a) || ""))) errors.push(`${n} needs a numeric ${a} attribute.`);
    }
    const hero = /\sdata-hero\b/i.test(tag);
    if (!hero && attr(tag, "loading") !== "lazy") errors.push(`${n} must load lazily (loading="lazy"); only the hero photo loads eagerly.`);
    if (attr(tag, "referrerpolicy") !== "no-referrer") errors.push(`${n} needs referrerpolicy="no-referrer".`);
    shown.push(photoForUrl(srcUrl));
  });
  if (tags.filter((t) => /\sdata-hero\b/i.test(t)).length > 1) errors.push("Only one photo may be the eagerly loaded hero.");
  if (shown.length) {
    const credits = String(html).match(/<p\b[^>]*\bdata-stock-credits\b[^>]*>([\s\S]*?)<\/p>/i);
    if (!credits) errors.push("The demo shows stock photos but has no photo credit line (data-stock-credits) in the footer.");
    else {
      const text = decodeEntities(credits[1].replace(/<[^>]+>/g, " "));
      for (const p of new Set(shown)) {
        if (!text.includes(p.photographer)) errors.push(`The photo credit line does not name ${p.photographer} for the photo "${p.id}".`);
      }
    }
  }
  return errors;
}

function numbersEqual(found, expected) {
  const n = Number(String(found).replace(/,/g, ""));
  return Number.isFinite(n) && n === Number(expected);
}

const RATING_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*(?:out\s+of\s+5\b|stars?\b|estrellas\b|de\s+5\b)/gi,
  /\brated\s+(\d+(?:\.\d+)?)(?!\d)/gi,
  /\bcalificaci(?:o|ó)n\s+(?:de\s+)?(\d+(?:\.\d+)?)(?!\d)/gi,
];
const REVIEWS_PATTERN = /(\d[\d,]*)\s+(?:Google\s+)?(?:reviews?|rese(?:n|ñ)as)\b/gi;

export function checkDemoHtml(html, lead) {
  const errors = [];
  const src = String(html || "");
  const l = lead || {};

  if (!/<meta\s+name="robots"\s+content="noindex, nofollow"\s*\/?>/i.test(src)) {
    errors.push("The demo is missing <meta name=\"robots\" content=\"noindex, nofollow\">.");
  }

  // A demo that shows stock photos must say so in the ribbon; one without must not.
  const images = imgTags(src);
  const expectedRibbon = ribbonText(l.business || "", { photos: images.length > 0 });
  if (!src.includes(esc(expectedRibbon))) {
    errors.push(`The concept ribbon text is missing or altered. Expected: "${expectedRibbon}"`);
  }
  // Share files are copies of the demo, so these checks also keep the ribbon
  // visible when an exported file is opened.
  const ribbonTag = src.match(/<[a-z]+[^>]*\bdata-kija-ribbon\b[^>]*>/i);
  if (!ribbonTag) {
    errors.push("The concept ribbon element (data-kija-ribbon) is missing.");
  } else if (/\shidden\b|data-hidden/i.test(ribbonTag[0]) || /\bstyle\s*=\s*"[^"]*(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?![.\d]))/i.test(ribbonTag[0])) {
    errors.push("The concept ribbon must be visible when the page loads.");
  }
  const hidingRule = ribbonHidingRule(src);
  if (hidingRule) errors.push(`The concept ribbon must be visible when the page loads, but the CSS rule "${hidingRule}" hides it.`);
  if (ribbonHiddenByScript(src)) {
    errors.push("The concept ribbon must be visible when the page loads; the page script may hide it only when the viewer clicks Hide for presentation.");
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
  const labels = attributeText(src);
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
  for (const [where, body] of [["Text", readable], ["Label", labels]]) {
    for (const re of RATING_PATTERNS) {
      for (const m of body.matchAll(re)) {
        if (!numbersEqual(m[1], l.googleRating)) errors.push(`${where} "${m[0]}" does not match the recorded rating ${l.googleRating}.`);
      }
    }
    for (const m of body.matchAll(REVIEWS_PATTERN)) {
      if (!numbersEqual(m[1], l.googleReviews)) errors.push(`${where} "${m[0]}" does not match the recorded ${l.googleReviews} reviews.`);
    }
  }
  // The big rating numeral reads exactly as the record, formatted as Google shows it.
  const numeral = formatRating(l.googleRating);
  for (const m of src.matchAll(/<[a-z]+\b[^>]*\bdata-rating-num\b[^>]*>([^<]*)</gi)) {
    const shown = decodeEntities(m[1]).trim();
    if (shown !== numeral) errors.push(`The rating numeral reads "${shown}" but the lead record says ${numeral}.`);
  }
  if (!/Google reviews/i.test(readable)) errors.push("The rating proof must use the wording \"Google reviews\".");

  // Images: only licensed library photos, each disclosed and credited.
  errors.push(...checkImages(src, images));
  if (/<script\b[^>]*\bsrc\s*=/i.test(src)) errors.push("The demo loads an external script.");
  if (/<iframe\b/i.test(src)) errors.push("The demo embeds an iframe, which makes an external request.");
  for (const m of src.matchAll(/<link\b[^>]*\bhref\s*=\s*"([^"]*)"/gi)) {
    if (/^(?:https?:)?\/\//i.test(m[1]) && !FONT_HOSTS.test(m[1])) errors.push(`The demo links an external resource other than Google Fonts: ${m[1]}`);
  }
  if (/url\(\s*["']?\s*(?:https?:)?\/\//i.test(src)) errors.push("The demo CSS loads a remote url().");
  if (TRACKERS.test(src)) errors.push("The demo contains a tracking script.");
  if (NETWORK_CALLS.test(src)) errors.push("The demo script makes network requests.");

  // Nothing is copied from another business: no photos but library stock, no
  // logos or embedded media, and no review text. Visitor photo previews are made
  // by the script from the visitor's own files, so they never appear as markup.
  const markup = stripScripts(src);
  if (/<(?:picture|video|audio|object|embed|image|source)\b/i.test(markup)) {
    errors.push("The demo contains an image or media tag other than a library <img>; demos use no logos or media, so nothing can be copied from another business.");
  }
  if (/\b(?:src|href|srcset)\s*=\s*["']?\s*data:(?:image|video|audio)\//i.test(markup) || /url\(\s*["']?\s*data:(?:image|video)\//i.test(markup)) {
    errors.push("The demo embeds an image as a data URL; demos use no photos or logos.");
  }
  if (/<blockquote\b/i.test(src)) errors.push("The demo contains a quote block; reviews appear only as paraphrased themes.");
  if (/<(?:q|cite)\b/i.test(markup)) errors.push("The demo contains a quotation element; reviews appear only as paraphrased themes.");
  for (const m of visibleText(markup).matchAll(QUOTED_RE)) {
    const quoted = m[1].trim();
    if (quoted.split(/\s+/).length >= 4) errors.push(`The demo shows quoted text "${quoted.slice(0, 60)}"; reviews appear only as paraphrased themes, never quotes.`);
  }

  return { ok: errors.length === 0, errors, warnings: [] };
}
