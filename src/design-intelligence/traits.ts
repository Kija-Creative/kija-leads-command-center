// Brand traits, inferred ONLY from verified lead data. Each trait carries the field and the
// exact evidence that produced it, so the reasoning summary can cite it.
//
// Sources and weights:
//   categoryKey   1  what the trade is (a sourced classification)
//   city          1  "local" for a business with a recorded city
//   reviewThemes  2  paraphrased themes the researcher read in real reviews
//   languages     2  "bilingual" and "community" when Spanish is recorded
//   googleRating / googleReviews  1 to 2  rating and volume bands
//   demoConcept   3  Kija's design intent for the demo (wording, never a claim)
//   pitchAngle    2  Kija's positioning note (wording, never a claim)
//   established   3  only when the record has a sourced established year
//
// Claims are guarded: "established" and "heritage" need a sourced year, "family-owned" needs a
// review theme that says so. Wording such as "decades of trust" in a pitch note never produces
// a tenure trait, and "family" in a concept line produces "warm" and "approachable" only.
import { BRAND_TRAITS } from "./schema.ts";
import type { BrandTrait, BusinessAttributes, LeadRecord, TraitEvidence, TraitSummary } from "./schema.ts";

const TRAIT_SET: ReadonlySet<string> = new Set(BRAND_TRAITS);

// What the trade itself suggests about the visual language. Conservative on purpose.
export const CATEGORY_TRAITS: Readonly<Record<string, readonly BrandTrait[]>> = {
  "auto-repair": ["practical", "reliable"],
  "auto-body-collision": ["craftsmanship", "detail-oriented", "visual"],
  "tire-shop": ["practical", "value", "fast"],
  "muffler-exhaust": ["craftsmanship", "practical"],
  "diesel-truck-repair": ["commercial", "hardworking"],
  "mobile-mechanic": ["fast", "direct"],
  "auto-detailing": ["detail-oriented", "craftsmanship", "visual"],
  towing: ["urgent-need", "fast"],
  hvac: ["reliable", "practical"],
  plumbing: ["reliable", "practical"],
  electrical: ["reliable", "precise"],
  septic: ["practical", "hardworking"],
  "garage-door": ["practical"],
  restoration: ["urgent-need", "reliable"],
  "appliance-repair": ["practical"],
  "pest-control": ["practical"],
  roofing: ["practical", "hardworking"],
  concrete: ["hardworking", "craftsmanship"],
  fencing: ["craftsmanship", "practical"],
  pools: ["residential", "visual"],
  landscaping: ["residential", "organic", "visual"],
  painting: ["craftsmanship", "residential"],
  "foundation-repair": ["technical", "reliable"],
  remodeling: ["residential", "craftsmanship"],
  "tree-service": ["hardworking", "organic"],
  barber: ["personal", "local"],
  "hair-salon": ["personal", "visual"],
  "nail-salon": ["detail-oriented", "visual"],
  tattoo: ["artistic", "expressive"],
  "pet-grooming": ["warm", "approachable"],
  general: [],
};

interface WordRule {
  pattern: RegExp;
  traits: readonly BrandTrait[];
}

// Words in Kija's concept and pitch notes. They describe the intended design, so they never
// produce a claim trait (established, heritage, family-owned).
export const WORDING_RULES: readonly WordRule[] = [
  { pattern: /\b(premium|upscale|high[- ]end)\b/i, traits: ["premium", "high-end"] },
  { pattern: /\bluxury\b/i, traits: ["luxury", "premium"] },
  { pattern: /\bboutique\b/i, traits: ["boutique"] },
  { pattern: /\beditorial\b/i, traits: ["editorial"] },
  { pattern: /\b(old[- ]school|classic|traditional|heritage)\b/i, traits: ["old-school", "traditional"] },
  { pattern: /\bbold\b|\bhigh[- ]impact\b/i, traits: ["bold", "energetic", "high-energy"] },
  { pattern: /\b(industrial|fabrication|shop floor|heavy[- ]duty)\b/i, traits: ["industrial"] },
  { pattern: /\b(creative|artistic|expressive)\b/i, traits: ["creative", "expressive"] },
  { pattern: /\b(modern|contemporary|clean)\b/i, traits: ["modern"] },
  { pattern: /\b(european|euro|bmw|mercedes|audi|porsche|german)\b/i, traits: ["specialist", "precise"] },
  { pattern: /\b(emergency|24\/7|roadside|stranded|storm)(?![\w/])/i, traits: ["urgent-need"] },
  { pattern: /\bsame[- ]day\b/i, traits: ["urgent-need", "fast"] },
  { pattern: /\b(family|mom[- ]and[- ]pop|neighbou?rhood|owner[- ]led)\b/i, traits: ["warm", "approachable"] },
  { pattern: /\b(community|neighbou?rhood|local)\b/i, traits: ["community", "community-oriented", "local"] },
  { pattern: /\b(custom|craft|fabrication|welding|detail)\b/i, traits: ["craftsmanship"] },
  { pattern: /\b(fast|quick|express|instant|frictionless|one tap)\b/i, traits: ["fast"] },
  { pattern: /\b(value|affordable|budget|pricing|used tires?)\b/i, traits: ["value"] },
  { pattern: /\bminimal\b/i, traits: ["minimal"] },
  { pattern: /\b(gallery|portfolio|before\/after|before-after|visual|showcase|transformation)\b/i, traits: ["visual"] },
  { pattern: /\b(fleet|commercial|semi|truck)\b/i, traits: ["commercial"] },
  { pattern: /\bresidential\b|\bhomeowners?\b/i, traits: ["residential"] },
  { pattern: /\b(honest|honesty|trust|high[- ]trust|credible)\b/i, traits: ["trusted"] },
  { pattern: /\b(direct|straightforward|no[- ]nonsense|plain)\b/i, traits: ["direct", "straightforward"] },
  { pattern: /\b(hardworking|crew|job[- ]site)\b/i, traits: ["hardworking"] },
  { pattern: /\b(character|personality|personal)\b/i, traits: ["personal", "expressive"] },
  { pattern: /\b(story|history)\b/i, traits: ["documentary"] },
  { pattern: /\bdark\b/i, traits: ["cinematic"] },
  { pattern: /\b(precision|technical|diagnostic)\b/i, traits: ["technical", "precise"] },
  { pattern: /\b(calm|relax|relaxing)\b/i, traits: ["calm"] },
  { pattern: /\b(playful|fun|pop)\b/i, traits: ["playful"] },
  { pattern: /\bcinematic\b/i, traits: ["cinematic"] },
  { pattern: /\barchitectural\b/i, traits: ["architectural"] },
];

// Paraphrased review themes: what real customers said.
export const THEME_RULES: readonly WordRule[] = [
  { pattern: /\b(honest|fair|trust|transparent)\b/i, traits: ["trusted", "straightforward"] },
  { pattern: /\b(price|pricing|affordable|value|cheap)\b/i, traits: ["value"] },
  { pattern: /\b(fast|quick|same[- ]day|on time|prompt)\b/i, traits: ["fast", "reliable"] },
  { pattern: /\b(friendly|kind|welcoming|caring)\b/i, traits: ["warm", "approachable"] },
  { pattern: /\b(quality|detail|careful|craft|meticulous)\b/i, traits: ["craftsmanship", "detail-oriented"] },
  { pattern: /\b(professional|reliable|dependable)\b/i, traits: ["reliable"] },
  { pattern: /\b(clean|tidy)\b/i, traits: ["precise"] },
  { pattern: /\b(communicat|explain)\w*/i, traits: ["direct"] },
  { pattern: /\b(knowledgeable|expert|skilled)\b/i, traits: ["specialist"] },
  { pattern: /\bfamily[- ](owned|run|business)\b/i, traits: ["family-owned"] },
];

function add(out: TraitEvidence[], trait: BrandTrait, field: string, evidence: string, weight: number): void {
  if (!TRAIT_SET.has(trait)) return;
  if (out.some((e) => e.trait === trait && e.field === field && e.evidence === evidence)) return;
  out.push({ trait, field, evidence, weight });
}

function wording(out: TraitEvidence[], text: string, field: string, weight: number, rules: readonly WordRule[]): void {
  for (const rule of rules) {
    const m = text.match(rule.pattern);
    if (!m) continue;
    for (const t of rule.traits) add(out, t, field, m[0].toLowerCase(), weight);
  }
}

export function hasSpanish(lead: LeadRecord): boolean {
  return Array.isArray(lead.languages) && lead.languages.some((l) => /spanish|espa(n|ñ)ol/i.test(String(l)));
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function businessAttributes(lead: LeadRecord): BusinessAttributes {
  const est = num(lead.established);
  return {
    hasPhone: Boolean(String(lead.phone || "").trim()),
    hasAddress: Boolean(String(lead.address || "").trim()),
    hasHours: Boolean(String(lead.hours || "").trim()),
    sourcedServices: Array.isArray(lead.services) ? lead.services.filter((s) => typeof s === "string" && s.trim()).length : 0,
    bilingual: hasSpanish(lead),
    rating: num(lead.googleRating),
    reviews: num(lead.googleReviews),
    hasBookingLink: Boolean(lead.presence && String(lead.presence.booking || "").trim()),
    establishedYear: est,
    city: String(lead.city || "").trim(),
    metro: String(lead.metro || "").trim(),
  };
}

// Every piece of trait evidence in the lead. `now` is only used to age a sourced established year.
export function traitEvidence(lead: LeadRecord, opts: { now?: string | Date } = {}): TraitEvidence[] {
  const out: TraitEvidence[] = [];
  const key = String(lead.categoryKey || "");
  for (const t of CATEGORY_TRAITS[key] || []) add(out, t, "categoryKey", key, 1);

  const city = String(lead.city || "").trim();
  if (city) add(out, "local", "city", city, 1);

  const themes = Array.isArray(lead.reviewThemes) ? lead.reviewThemes.filter((t) => typeof t === "string") : [];
  for (const theme of themes) wording(out, theme, "reviewThemes", 2, THEME_RULES);

  if (hasSpanish(lead)) {
    add(out, "bilingual", "languages", (lead.languages || []).join(", "), 2);
    add(out, "community", "languages", (lead.languages || []).join(", "), 1);
  }

  const rating = num(lead.googleRating);
  const reviews = num(lead.googleReviews);
  if (rating !== null && reviews !== null) {
    const ev = `${rating} from ${reviews} reviews`;
    if (rating >= 4.8 && reviews >= 100) add(out, "highly-rated", "googleRating", ev, 2);
    else if (rating >= 4.7 && reviews >= 40) add(out, "highly-rated", "googleRating", ev, 1);
    if (reviews >= 250) add(out, "popular", "googleReviews", ev, 2);
    else if (reviews >= 120) add(out, "popular", "googleReviews", ev, 1);
    if (rating >= 4.5 && reviews < 40) add(out, "emerging", "googleReviews", ev, 1);
    if (rating >= 4.8 && reviews >= 100) add(out, "trusted", "googleRating", ev, 1);
  }

  wording(out, String(lead.demoConcept || ""), "demoConcept", 3, WORDING_RULES);
  wording(out, String(lead.pitchAngle || ""), "pitchAngle", 2, WORDING_RULES);

  const est = num(lead.established);
  if (est !== null && est > 1800) {
    add(out, "established", "established", String(est), 3);
    if (opts.now !== undefined) {
      const year = new Date(opts.now).getUTCFullYear();
      if (Number.isFinite(year) && year - est >= 25) add(out, "heritage", "established", String(est), 2);
    }
  }
  return out;
}

// Evidence grouped per trait, strongest first (then alphabetical, so the order is stable).
export function inferBrandTraits(lead: LeadRecord, opts: { now?: string | Date } = {}): TraitSummary[] {
  const byTrait = new Map<BrandTrait, TraitEvidence[]>();
  for (const e of traitEvidence(lead, opts)) {
    const list = byTrait.get(e.trait) || [];
    list.push(e);
    byTrait.set(e.trait, list);
  }
  return [...byTrait.entries()]
    .map(([trait, evidence]) => ({ trait, weight: evidence.reduce((s, e) => s + e.weight, 0), evidence }))
    .sort((a, b) => b.weight - a.weight || a.trait.localeCompare(b.trait));
}

export function traitWeights(traits: readonly TraitSummary[]): Map<string, number> {
  return new Map(traits.map((t) => [t.trait, t.weight]));
}

// One cited phrase per trait for the reasoning summary: `premium (demoConcept "premium")`.
export function citeTrait(t: TraitSummary): string {
  const e = t.evidence.slice().sort((a, b) => b.weight - a.weight)[0];
  return `${t.trait} (${e.field} "${e.evidence}")`;
}
