// auditSite: the brief's Quality Control, run before a generated site is marked complete. Each
// check returns sentences; an error fails the page, a warning lowers the score. The page is read
// through the markers in markers.ts (data-dna, data-module, data-section, data-cta,
// data-placeholder) and its measurable CSS (radius and font tokens, durations, media queries).
import type { AuditCheckId, AuditFlag, AuditResult, IndustryProfile, LeadRecord, SiteDnaRecord } from "./schema.ts";
import { checkDemoHtml } from "../demo/guardrails.js";
import { AA_NORMAL, contrastRatio, parseColor } from "./contrast.ts";
import { GEOMETRY_TOKENS, MOTION_RULES } from "./design-tokens.ts";
import type { HistoryEntry, HistoryFile } from "./history.ts";
import { comparisonPool, comparisonSet } from "./history.ts";
import type { CssRule, HtmlNode } from "./html.ts";
import { classList, contains, cssRules, declarations, durationsMs, findAll, hasAncestor, lengthPx, parseHtml, rootTokens, skeleton, styleText } from "./html.ts";
import { DNA_ATTRIBUTE_MAP, moduleFromMarker } from "./markers.ts";
import { moduleSpec } from "./modules.ts";
import { checkCandidate, dnaFingerprint } from "./variation.ts";
import { toIso, uniq } from "./util.ts";

export interface AuditInput {
  html: string;
  record: SiteDnaRecord;
  profile: IndustryProfile;
  history?: HistoryFile | readonly HistoryEntry[];
  lead?: LeadRecord;
  now?: string | Date;
}

export const AUDIT_CHECKS: readonly AuditCheckId[] = [
  "similarity",
  "required-modules",
  "forbidden-patterns",
  "cta-architecture",
  "dna-fidelity",
  "fabricated-trust",
  "guardrails",
  "responsive",
  "accessibility",
  "component-library-look",
];

const FIX_HINTS: Record<AuditCheckId, string> = {
  similarity: "Regenerate the Site DNA (npm run dna -- --id <id> --unlock) or override it, then rebuild",
  "required-modules": "Render every section of dna.sectionOrder and every required module with its data-module marker",
  "forbidden-patterns": "Remove the forbidden pattern or restyle it to the DNA",
  "cta-architecture": "Put the primary conversion control (data-cta) in the hero and the close, and keep CTAs to the industry's conversions",
  "dna-fidelity": "Build from the DNA: markers from dnaAttributes, tokens from dnaRootCss, fonts from fontsHref, motion within its limits",
  "fabricated-trust": "Remove the claim or render the module as an owner-to-confirm placeholder",
  guardrails: "Fix the demo guardrail failure",
  responsive: "Add the viewport meta, width media queries and fluid widths",
  accessibility: "Fix the accessibility fundamental",
  "component-library-look": "Restyle the library component to the dialect and DNA tokens",
};

const ERROR_COST = 15;
const WARNING_COST = 5;

interface Page {
  root: HtmlNode;
  html: string;
  css: string;
  rules: CssRule[];
  tokens: Map<string, string>;
}

type Flag = (check: AuditCheckId, severity: "error" | "warning", message: string) => void;

function moduleTokens(n: HtmlNode): string[] {
  return String(n.attrs["data-module"] || "").split(/\s+/).filter(Boolean).map(moduleFromMarker);
}

function historyFile(h: AuditInput["history"]): HistoryFile | null {
  if (!h) return null;
  if (Array.isArray(h)) return { version: 1, cap: 500, note: "", entries: [...h] };
  return h as HistoryFile;
}

// 1. Too similar to recent sites.
function checkSimilarity(input: AuditInput, flag: Flag): void {
  const file = historyFile(input.history);
  if (!file) return;
  const dna = input.record.dna;
  const pool = comparisonPool(file, input.record.leadId);
  const set = comparisonSet(pool.predecessors, dna.industry, input.record.variation.lookback || 8, input.record.variation.industryLookback || 8);
  if (!set.length) return;
  const check = checkCandidate(dna, set.map((e) => e.dna), pool.others);
  if (check.duplicate) flag("similarity", "error", `The Site DNA is identical to ${check.duplicate.businessName || check.duplicate.leadId}'s; a DNA may never be issued twice.`);
  check.comparisons.forEach(({ result }, i) => {
    if (result.valid) return;
    const who = set[i].business || set[i].leadId;
    if (result.cloneSignatureConflict) flag("similarity", "error", `It shares hero, section order, typography and geometry with ${who}, the combination the brief forbids on consecutive sites.`);
    else flag("similarity", "error", `It differs from ${who} on only ${result.differenceCount} of 13 dimensions (matching: ${result.matchingDimensions.join(", ")}); at least 6 must differ.`);
  });
}

// 2. Required modules, section order and placeholders.
function checkModules(page: Page, input: AuditInput, flag: Flag): void {
  const dna = input.record.dna;
  const marked = findAll(page.root, (n) => "data-module" in n.attrs);
  const present = new Set(marked.flatMap(moduleTokens));
  for (const m of uniq([...dna.sectionOrder, ...dna.requiredModules])) {
    if (!present.has(m)) flag("required-modules", "error", `The required module "${m}" (${moduleSpec(m)?.label || m}) is missing: no element carries data-module="${m}".`);
  }
  const sections = marked.filter((n) => "data-section" in n.attrs);
  const order = sections.map((n) => moduleTokens(n)[0]);
  if (sections.length && order.join(",") !== dna.sectionOrder.join(",")) {
    flag("required-modules", "error", `The sections render as ${order.join(", ")}, but the Site DNA section order is ${dna.sectionOrder.join(", ")}.`);
  } else if (!sections.length && marked.length) {
    flag("required-modules", "error", "No section carries data-section, so the section order cannot be checked against the Site DNA.");
  }
  sections.forEach((n, i) => {
    if (String(n.attrs["data-section"]) !== String(i)) flag("required-modules", "warning", `Section "${moduleTokens(n)[0]}" is number ${i} on the page but marked data-section="${n.attrs["data-section"]}".`);
  });
  for (const m of input.record.truth.placeholders) {
    const hosts = marked.filter((n) => moduleTokens(n).includes(m));
    if (hosts.length && !hosts.some((h) => contains(h, (x) => x.attrs["data-placeholder"] === "owner-to-confirm") || hasAncestor(h, (x) => x.attrs["data-placeholder"] === "owner-to-confirm"))) {
      flag("fabricated-trust", "error", `The "${m}" module must render as a labelled owner-to-confirm placeholder (data-placeholder="owner-to-confirm"), because the lead record does not source it.`);
    }
  }
}

// 3. Forbidden patterns. Error when the DNA forbids the pattern, warning otherwise.
const PATTERN_ALIASES: Record<string, readonly string[]> = {
  pill: ["pill-buttons-everywhere", "rounded-pill-cards"],
  bento: ["generic-saas-bento", "generic-saas"],
  glow: ["glowing-blobs", "gradient-blobs"],
  gradient: ["purple-blue-gradient", "neon-gradient", "unrelated-tech-gradients", "generic-saas"],
  glass: ["excessive-glassmorphism"],
  inter: ["inter-everywhere"],
  cards: ["three-feature-cards"],
  testimonials: ["identical-testimonial-cards"],
  dashboard: ["fake-dashboard-ui"],
};

function hueSat(color: string): { h: number; s: number } | null {
  const c = parseColor(color);
  if (!c) return null;
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s };
}

function checkForbidden(page: Page, input: AuditInput, flag: Flag): void {
  const dna = input.record.dna;
  const forbidden = new Set(dna.forbiddenPatterns);
  const report = (group: string, message: string) => {
    const hit = PATTERN_ALIASES[group].some((k) => forbidden.has(k));
    flag("forbidden-patterns", hit ? "error" : "warning", message);
  };
  const buttonRules = page.rules.filter((r) => !r.media && /(button|btn|cta|\[type=["']?submit)/i.test(r.selector) && declarations(r.body).has("border-radius"));
  const pillRules = buttonRules.filter((r) => {
    const v = declarations(r.body).get("border-radius") || "";
    const resolved = v.startsWith("var(") ? page.tokens.get(v.slice(4, -1).split(",")[0].trim()) || "" : v;
    return lengthPx(resolved) >= 999 || lengthPx(resolved) >= 24;
  });
  if (dna.geometry !== "pill" && buttonRules.length >= 2 && pillRules.length * 2 > buttonRules.length) {
    report("pill", `Pill radius is on ${pillRules.length} of ${buttonRules.length} button rules, but the DNA geometry is ${dna.geometry}.`);
  }
  const bentoClass = findAll(page.root, (n) => /bento/i.test(`${n.attrs.class || ""} ${n.attrs.id || ""}`)).length;
  const spans = (page.css.match(/grid-(?:row|column)\s*:\s*span\s*2/gi) || []).length;
  if (bentoClass || (/grid-auto-rows/i.test(page.css) && spans >= 2)) report("bento", "A bento grid (uniform tiles with spanning cells) is on the page.");
  if (/radial-gradient\(/i.test(page.css) || /filter\s*:\s*blur\(\s*(?:[4-9]\d|\d{3,})px/i.test(page.css)) report("glow", "Radial gradient or blurred glow effects are on the page.");
  for (const m of page.css.matchAll(/(?:linear|conic)-gradient\(([^;{}]*)\)/gi)) {
    const stops = [...m[1].matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi)].map((s) => hueSat(s[0])).filter((x): x is { h: number; s: number } => x !== null);
    if (stops.filter((s) => s.s > 0.55 && s.h >= 200 && s.h <= 310).length >= 2) {
      report("gradient", "A saturated blue to purple gradient is on the page, the stock AI SaaS look.");
      break;
    }
  }
  if (/backdrop-filter\s*:/i.test(page.css)) report("glass", "backdrop-filter (glassmorphism) is used.");
  const fontHref = findAll(page.root, (n) => n.tag === "link" && /fonts\.googleapis\.com/.test(n.attrs.href || "")).map((n) => n.attrs.href).join(" ");
  // The body face as the cascade resolves it: the last body, html or :root font-family wins, and
  // a var() reference is followed to its token.
  const declared = page.rules.filter((r) => !r.media && /(^|,)\s*(body|html|:root)\s*(,|$)/.test(r.selector)).map((r) => declarations(r.body).get("font-family") || "").filter(Boolean);
  let bodyFont = declared[declared.length - 1] || "";
  const ref = bodyFont.match(/^var\(\s*(--[\w-]+)/);
  if (ref) bodyFont = page.tokens.get(ref[1]) || "";
  const isInter = (v: string) => /^\s*["']?Inter["']?\s*(,|$)/i.test(v);
  if (/family=Inter[:&]/.test(fontHref) || isInter(bodyFont) || isInter(page.tokens.get("--font-body") || "") || isInter(page.tokens.get("--body") || "")) report("inter", "Inter is the main typeface.");
  let cardHit = false;
  let testimonialHit = false;
  for (const n of findAll(page.root, (x) => x.children.length >= 3)) {
    const kids = n.children.filter((c) => !["script", "style"].includes(c.tag));
    const cls = kids.map((k) => k.attrs.class || "");
    const same = kids.length >= 3 && cls[0] !== "" && cls.every((c) => c === cls[0]) && kids.every((k) => k.tag === kids[0].tag && skeleton(k) === skeleton(kids[0]));
    if (!same) continue;
    const reviewish = /review|testimonial|quote/i.test(`${n.attrs.class || ""} ${cls[0]} ${n.attrs["data-module"] || ""}`);
    if (reviewish && !testimonialHit) {
      testimonialHit = true;
      report("testimonials", `${kids.length} identical testimonial style cards (class "${cls[0]}") are on the page.`);
    } else if (!reviewish && kids.length === 3 && !cardHit && kids.every((k) => contains(k, (x) => /^h[2-4]$/.test(x.tag)))) {
      cardHit = true;
      report("cards", `Three identical feature cards (class "${cls[0]}") are on the page.`);
    }
  }
  if (findAll(page.root, (n) => /\b(dashboard|kpi-card|chart-card)\b/i.test(n.attrs.class || "")).length && dna.imagery !== "product-ui") report("dashboard", "Dashboard style UI appears on a site whose imagery is not product UI.");
}

// 4. CTA architecture.
function checkCtas(page: Page, input: AuditInput, flag: Flag): void {
  const dna = input.record.dna;
  const allowed = new Set([...input.profile.primaryConversions, "contact"]);
  const ctas = findAll(page.root, (n) => "data-cta" in n.attrs);
  if (!ctas.length) {
    flag("cta-architecture", "error", "No conversion control carries data-cta, so the CTA architecture cannot match the industry.");
    return;
  }
  for (const v of uniq(ctas.map((n) => n.attrs["data-cta"]))) {
    if (!allowed.has(v)) flag("cta-architecture", "warning", `The CTA "${v}" is not a conversion ${input.profile.label} uses (${input.profile.primaryConversions.join(", ")}).`);
  }
  const hero = findAll(page.root, (n) => "data-section" in n.attrs && moduleTokens(n)[0] === "hero")[0];
  if (hero && !contains(hero, (n) => n.attrs["data-cta"] === dna.primaryConversion)) flag("cta-architecture", "error", `The hero has no "${dna.primaryConversion}" control, the primary conversion.`);
  const primaryCount = ctas.filter((n) => n.attrs["data-cta"] === dna.primaryConversion).length;
  if (primaryCount === 0) flag("cta-architecture", "error", `The primary conversion "${dna.primaryConversion}" has no control on the page.`);
  else if (primaryCount === 1) flag("cta-architecture", "warning", `The primary conversion "${dna.primaryConversion}" appears once; repeat it at the close.`);
  if (input.profile.primaryConversions.includes("call") && input.record.facts.phone) {
    const tel = findAll(page.root, (n) => n.tag === "a" && /^tel:/i.test(n.attrs.href || ""));
    if (!tel.length) flag("cta-architecture", "error", "The industry converts by phone and the record has a phone, but there is no tel: link.");
    else if (!tel.some((n) => n.attrs["data-cta"] === "call")) flag("cta-architecture", "warning", "The tel: links do not carry data-cta=\"call\".");
  }
}

// 5. The page follows its declared DNA.
function checkFidelity(page: Page, input: AuditInput, flag: Flag): void {
  const dna = input.record.dna;
  const root = findAll(page.root, (n) => "data-dna" in n.attrs)[0];
  if (!root) {
    flag("dna-fidelity", "error", "The page carries no data-dna root marker, so it cannot be tied to its Site DNA.");
  } else {
    const fp = dnaFingerprint(dna);
    if (root.attrs["data-dna"] !== fp) flag("dna-fidelity", "error", `The page is marked data-dna="${root.attrs["data-dna"]}" but its Site DNA fingerprint is ${fp}.`);
    for (const [key, attr] of Object.entries(DNA_ATTRIBUTE_MAP)) {
      const want = String(dna[key as keyof typeof DNA_ATTRIBUTE_MAP]);
      const got = root.attrs[attr];
      if (got === undefined) flag("dna-fidelity", "error", `The root is missing ${attr} (the DNA says "${want}").`);
      else if (got !== want) flag("dna-fidelity", "error", `The root says ${attr}="${got}" but the DNA says "${want}".`);
    }
  }
  const g = GEOMETRY_TOKENS[dna.geometry];
  const radius = page.tokens.get("--radius-control");
  if (radius === undefined) flag("dna-fidelity", "warning", "The page does not declare --radius-control on :root, so the geometry cannot be measured.");
  else {
    const px = lengthPx(radius);
    if (!(px >= g.controlRangePx[0] && px <= g.controlRangePx[1])) flag("dna-fidelity", "error", `--radius-control is ${radius}, outside the ${dna.geometry} geometry (${g.controlRangePx[0]} to ${g.controlRangePx[1] >= 100000 ? "fully round" : `${g.controlRangePx[1]}px`}).`);
  }
  if (dna.fontPairing) {
    const href = findAll(page.root, (n) => n.tag === "link" && /fonts\.googleapis\.com\/css/.test(n.attrs.href || "")).map((n) => n.attrs.href).join(" ");
    for (const face of [dna.fontPairing.display, dna.fontPairing.body]) {
      if (!href.includes(`family=${face.family.replace(/ /g, "+")}`)) flag("dna-fidelity", "error", `The Google Fonts request does not load ${face.family}, the DNA's ${face === dna.fontPairing.display ? "display" : "body"} face.`);
    }
    const disp = page.tokens.get("--font-display");
    const body = page.tokens.get("--font-body");
    if (disp === undefined || body === undefined) flag("dna-fidelity", "warning", "The page does not declare --font-display and --font-body on :root.");
    else {
      if (!disp.includes(dna.fontPairing.display.family)) flag("dna-fidelity", "error", `--font-display is ${disp}, not ${dna.fontPairing.display.family}.`);
      if (!body.includes(dna.fontPairing.body.family)) flag("dna-fidelity", "error", `--font-body is ${body}, not ${dna.fontPairing.body.family}.`);
    }
  }
  const motion = MOTION_RULES[dna.motion];
  const longest = Math.max(0, ...page.rules.filter((r) => !/reduce/.test(r.media || "")).flatMap((r) => {
    const d = declarations(r.body);
    return ["transition", "transition-duration", "animation", "animation-duration"].flatMap((k) => durationsMs(d.get(k) || ""));
  }));
  if (longest > motion.maxDurationMs) flag("dna-fidelity", "error", `A ${longest}ms transition or animation exceeds the ${dna.motion} motion limit of ${motion.maxDurationMs}ms.`);
  if (!motion.keyframes && /@keyframes/i.test(page.css)) flag("dna-fidelity", "error", `@keyframes animation is used, but ${dna.motion} motion allows none.`);
  if (dna.motion !== "none" && !/prefers-reduced-motion\s*:\s*reduce/i.test(page.css)) flag("dna-fidelity", "error", "Motion is used without a prefers-reduced-motion: reduce rule.");
  if (dna.palette) {
    for (const [k, v] of Object.entries(dna.palette.tokens)) {
      const got = page.tokens.get(`--${k}`);
      if (got !== undefined && got.toLowerCase() !== v.toLowerCase()) flag("dna-fidelity", "warning", `--${k} is ${got}, but the DNA palette ${dna.paletteFamily} says ${v}.`);
    }
  }
}

// 6. Fabricated trust signals and the demo guardrails (src/demo/guardrails.js).
const TRUST_RE = /Unbacked claim|Rating|rating|Review count|reviews|quote|quoted|Google reviews/;

function leadFor(input: AuditInput): LeadRecord {
  if (input.lead) return input.lead;
  const f = input.record.facts;
  return { id: input.record.leadId, business: f.business, category: f.category, categoryKey: f.categoryKey, city: f.city, state: f.state, area: f.area, address: f.address, phone: f.phone, googleRating: f.googleRating, googleReviews: f.googleReviews, services: f.servicesFromDefaults ? [] : f.services, reviewThemes: f.reviewThemes, languages: f.languages, established: f.established, hours: f.hours };
}

function checkTrust(input: AuditInput, flag: Flag): void {
  const result = checkDemoHtml(input.html, leadFor(input)) as { errors: string[] };
  for (const e of result.errors) flag(TRUST_RE.test(e) ? "fabricated-trust" : "guardrails", "error", e);
}

// 7. Responsive basics.
function checkResponsive(page: Page, flag: Flag): void {
  if (!findAll(page.root, (n) => n.tag === "meta" && n.attrs.name === "viewport" && /width=device-width/.test(n.attrs.content || "")).length) {
    flag("responsive", "error", "The page has no <meta name=\"viewport\" content=\"width=device-width, ...\">.");
  }
  if (!page.rules.some((r) => r.media && /(min|max)-width/.test(r.media))) flag("responsive", "error", "The CSS has no width media queries, so the layout cannot adapt from 375px to desktop.");
  const fixed = page.rules.filter((r) => {
    if (r.media) return false;
    const d = declarations(r.body);
    return ["width", "min-width"].some((k) => {
      const px = lengthPx(d.get(k) || "");
      return Number.isFinite(px) && px > 480 && !/%|vw|min\(|clamp\(/.test(d.get(k) || "");
    });
  });
  if (fixed.length) flag("responsive", "error", `Fixed widths wider than a phone outside any media query: ${fixed.slice(0, 3).map((r) => r.selector).join("; ")}.`);
}

// 8. Accessibility fundamentals.
function checkAccessibility(page: Page, input: AuditInput, flag: Flag): void {
  const html = findAll(page.root, (n) => n.tag === "html")[0];
  if (!html || !html.attrs.lang) flag("accessibility", "error", "The html element has no lang attribute.");
  if (!findAll(page.root, (n) => n.tag === "main").length) flag("accessibility", "error", "There is no <main> landmark.");
  for (const tag of ["header", "footer", "nav"]) if (!findAll(page.root, (n) => n.tag === tag).length) flag("accessibility", "warning", `There is no <${tag}> landmark.`);
  const headings = findAll(page.root, (n) => /^h[1-6]$/.test(n.tag)).map((n) => Number(n.tag[1]));
  const h1 = headings.filter((h) => h === 1).length;
  if (!h1) flag("accessibility", "error", "The page has no h1.");
  else if (h1 > 1) flag("accessibility", "warning", `The page has ${h1} h1 elements; use one.`);
  let skips = 0;
  for (let i = 1; i < headings.length; i += 1) {
    if (headings[i] > headings[i - 1] + 1 && skips < 3) {
      skips += 1;
      flag("accessibility", "warning", `A heading jumps from h${headings[i - 1]} to h${headings[i]}.`);
    }
  }
  const imgs = findAll(page.root, (n) => n.tag === "img" && !("alt" in n.attrs));
  if (imgs.length) flag("accessibility", "error", `${imgs.length} image${imgs.length > 1 ? "s have" : " has"} no alt attribute.`);
  const labelled = new Set(findAll(page.root, (n) => n.tag === "label" && Boolean(n.attrs.for)).map((n) => n.attrs.for));
  const controls = findAll(page.root, (n) => (n.tag === "input" && !["hidden", "submit", "button", "reset", "image"].includes((n.attrs.type || "text").toLowerCase())) || n.tag === "select" || n.tag === "textarea");
  const unlabelled = controls.filter((n) => !n.attrs["aria-label"] && !n.attrs["aria-labelledby"] && !(n.attrs.id && labelled.has(n.attrs.id)) && !hasAncestor(n, (p) => p.tag === "label"));
  if (unlabelled.length) flag("accessibility", "error", `${unlabelled.length} form control${unlabelled.length > 1 ? "s have" : " has"} no label (first: ${unlabelled[0].attrs.name || unlabelled[0].attrs.id || unlabelled[0].tag}).`);
  const tok = (k: string) => page.tokens.get(`--${k}`) || input.record.dna.palette?.tokens[k as keyof typeof input.record.dna.palette.tokens];
  for (const [fg, bg, what] of [["ink", "bg", "Body text"], ["muted", "bg", "Secondary text"], ["on-primary", "primary", "Button text"]] as const) {
    const a = tok(fg);
    const b = tok(bg);
    if (!a || !b) continue;
    const ratio = contrastRatio(a, b);
    if (ratio !== null && ratio < AA_NORMAL) flag("accessibility", "error", `${what} (--${fg} ${a} on --${bg} ${b}) is ${ratio}:1, below WCAG AA ${AA_NORMAL}:1.`);
  }
  if (!/:focus-visible/.test(page.css)) flag("accessibility", "error", "No :focus-visible style is defined, so keyboard focus may be invisible.");
  const tel = findAll(page.root, (n) => n.tag === "a" && /^tel:/i.test(n.attrs.href || ""));
  for (const link of tel.slice(0, 4)) {
    const classes = classList(link);
    const matching = page.rules.filter((r) => !r.media && (/a\[href\^=["']?tel:/.test(r.selector) || classes.some((c) => new RegExp(`\\.${c.replace(/[^a-z0-9_-]/gi, "")}(?![\\w-])`).test(r.selector))));
    const ok = matching.some((r) => {
      const d = declarations(r.body);
      return ["min-height", "height", "min-block-size", "block-size"].some((k) => lengthPx(d.get(k) || "") >= 44);
    });
    if (!ok) {
      flag("accessibility", "warning", `The phone link${classes.length ? ` (.${classes[0]})` : ""} has no rule that makes it 44px or taller.`);
      break;
    }
  }
}

// 9. Unmodified component library demo look.
const LIBRARY_SIGNATURES: readonly { re: RegExp; label: string }[] = [
  { re: /\bbg-card\b/, label: "shadcn bg-card class" },
  { re: /\btext-card-foreground\b/, label: "shadcn text-card-foreground class" },
  { re: /\btext-muted-foreground\b/, label: "shadcn text-muted-foreground class" },
  { re: /\bring-offset-background\b/, label: "shadcn ring-offset-background class" },
  { re: /data-slot="(?:card|button|input|badge)"/, label: "shadcn data-slot markup" },
  { re: /--card-foreground\s*:/, label: "shadcn --card-foreground token" },
  { re: /hsl\(var\(--(?:primary|background|foreground|card)\)\)/, label: "shadcn hsl(var(--token)) colours" },
  { re: /inline-flex items-center justify-center (?:gap-2 )?whitespace-nowrap rounded-md text-sm font-medium/, label: "shadcn default button class string" },
  { re: /rounded-lg border bg-card/, label: "shadcn default card class string" },
  { re: /\bhs-(?:dropdown|collapse|overlay|accordion)\b/, label: "Preline hs- component classes" },
];

function checkLibraryLook(page: Page, flag: Flag): void {
  const hits = LIBRARY_SIGNATURES.filter((s) => s.re.test(page.html));
  if (hits.length >= 2) flag("component-library-look", "error", `The page looks like an unmodified component library demo: ${hits.map((h) => h.label).join(", ")}.`);
  else if (hits.length === 1) flag("component-library-look", "warning", `A default component library signature is present: ${hits[0].label}. Restyle it to the Site DNA.`);
}

export function auditSite(input: AuditInput): AuditResult {
  const flags: AuditFlag[] = [];
  const flag: Flag = (check, severity, message) => {
    if (!flags.some((f) => f.check === check && f.message === message)) flags.push({ check, severity, message });
  };
  const root = parseHtml(input.html);
  const css = styleText(root);
  const rules = cssRules(css);
  const page: Page = { root, html: String(input.html || ""), css, rules, tokens: rootTokens(rules) };
  checkSimilarity(input, flag);
  checkModules(page, input, flag);
  checkForbidden(page, input, flag);
  checkCtas(page, input, flag);
  checkFidelity(page, input, flag);
  checkTrust(input, flag);
  checkResponsive(page, flag);
  checkAccessibility(page, input, flag);
  checkLibraryLook(page, flag);
  const errors = flags.filter((f) => f.severity === "error").length;
  const warnings = flags.length - errors;
  const checks = AUDIT_CHECKS.map((id) => {
    const e = flags.filter((f) => f.check === id && f.severity === "error").length;
    const w = flags.filter((f) => f.check === id && f.severity === "warning").length;
    return { id, pass: e === 0, errors: e, warnings: w };
  });
  const failures = flags.filter((f) => f.severity === "error");
  return {
    pass: errors === 0,
    failures: failures.map((f) => f.message),
    warnings: flags.filter((f) => f.severity === "warning").map((f) => f.message),
    similarityIssues: flags.filter((f) => f.check === "similarity").map((f) => f.message),
    requiredFixes: failures.map((f) => `${FIX_HINTS[f.check]} (${f.message})`),
    score: Math.max(0, 100 - errors * ERROR_COST - warnings * WARNING_COST),
    flags,
    checks,
    checkedAt: input.now !== undefined ? toIso(input.now) : input.record.updatedAt,
    fingerprint: dnaFingerprint(input.record.dna),
  };
}
