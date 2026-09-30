// selectSiteDna: the brief's pipeline, pure and deterministic.
//
//   lead -> classification (industry, sub-industry) -> business attributes -> brand traits
//   (verified fields only) -> conversion objective -> appropriate archetypes scored by trait fit
//   first -> Site DNA candidates in a seeded order -> variation check against history -> repair
//   in the brief's order when too similar -> SiteDnaRecord with a reasoning summary.
//
// Suitability always outranks the seed: every option list is sorted by brand trait affinity,
// then the archetype family's preference, and the seed only orders options of equal fit.
// Locked DNA comes back unchanged unless options.unlock. A human override is validated against
// the industry and archetype bounds and stored with overridden true.
import type {
  ArchetypeScore,
  BusinessAttributes,
  BusinessFacts,
  CategoryRegistry,
  Classification,
  ComparisonSummary,
  ConversionObjective,
  DnaOverride,
  FontPairing,
  GeometryStyle,
  HeroStyle,
  ImageryStyle,
  IndustryArchetype,
  IndustryProfile,
  LayoutRhythm,
  LeadDnaSnapshot,
  LeadRecord,
  MotionStyle,
  NavigationStyle,
  ReferenceUse,
  ResolvedPalette,
  SiteDNA,
  SiteDnaRecord,
  TraitSummary,
  TruthPlan,
  TypographyStyle,
  ValidationResult,
} from "./schema.ts";
import { MOTION_STYLES } from "./schema.ts";
import type { BaseArchetype, FamilyRegistry } from "./archetypes.ts";
import { familyPreference } from "./archetypes.ts";
import type { DialectRegistry } from "./component-dialects.ts";
import { DIMENSION_LABELS, fontPairing as findPairing, GLOBAL_FORBIDDEN_DEFAULTS, pairingsFor, VALUE_TRAIT_AFFINITY } from "./design-tokens.ts";
import type { HistoryEntry, HistoryFile } from "./history.ts";
import { comparisonPool, comparisonSet, emptyHistory } from "./history.ts";
import type { IndustryRegistry } from "./industries.ts";
import { classifyLead, getArchetype } from "./industries.ts";
import { isModuleKey, moduleTruth } from "./modules.ts";
import type { DesignReference } from "./references.ts";
import { selectReferences } from "./references.ts";
import { buildSeed, seededIndex, seededOrder } from "./seed.ts";
import { businessAttributes, citeTrait, inferBrandTraits, traitWeights } from "./traits.ts";
import { checkCandidate, dnaFingerprint } from "./variation.ts";
import { toIso, uniq } from "./util.ts";

export interface EngineData {
  registry: IndustryRegistry;
  categories: CategoryRegistry;
  families?: FamilyRegistry;
  dialects?: DialectRegistry;
  references?: readonly DesignReference[];
}

export interface SelectOptions {
  now: string | Date;
  history?: HistoryFile;
  existing?: SiteDnaRecord | null;
  unlock?: boolean;
  override?: DnaOverride;
  lookback?: number;
  industryLookback?: number;
  maxCandidates?: number;
}

export interface SelectResult extends ValidationResult {
  record: SiteDnaRecord | null;
  reused: boolean;
}

// The brief's repair order after "try another appropriate archetype". Color never changes alone:
// the palette only moves in the last resort step, together with the remaining axes.
export const REPAIR_ORDER = ["sectionOrder", "typography", "hero", "layoutRhythm", "imagery", "geometry", "componentDialect"] as const;
export const LAST_RESORT_AXES = ["navigation", "motion", "ctaStyle", "proofStyle", "paletteFamily"] as const;

const REPAIR_LABELS: Record<string, string> = {
  sectionOrder: "Recomposed the section order.",
  typography: "Changed the typography classification.",
  hero: "Changed the hero architecture.",
  layoutRhythm: "Changed the layout rhythm.",
  imagery: "Changed the imagery treatment.",
  geometry: "Changed the geometry.",
  componentDialect: "Changed the component dialect.",
};

type AxisKey = "hero" | "navigation" | "typography" | "layoutRhythm" | "geometry" | "imagery" | "motion" | "paletteFamily" | "ctaStyle" | "proofStyle" | "componentDialect" | "sectionOrder";
const AXIS_KEYS: readonly AxisKey[] = ["hero", "navigation", "typography", "layoutRhythm", "geometry", "imagery", "motion", "paletteFamily", "ctaStyle", "proofStyle", "componentDialect", "sectionOrder"];

type Values = Record<AxisKey, string>;   // sectionOrder is stored as a comma joined key

// ---------------------------------------------------------------------------------------------
// Facts, truth, conversion
// ---------------------------------------------------------------------------------------------

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function list(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim()) : [];
}

export function factsFromLead(lead: LeadRecord, categories: CategoryRegistry): BusinessFacts {
  const cat = categories[String(lead.categoryKey || "")] || categories.general;
  const services = list(lead.services);
  const defaults = cat && Array.isArray(cat.serviceDefaults) ? list(cat.serviceDefaults) : [];
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return {
    business: str(lead.business),
    category: str(lead.category) || str(cat && cat.label),
    categoryKey: str(lead.categoryKey),
    city: str(lead.city),
    area: str(lead.area),
    state: str(lead.state),
    metro: str(lead.metro),
    address: str(lead.address),
    phone: str(lead.phone),
    googleRating: num(lead.googleRating),
    googleReviews: num(lead.googleReviews),
    ratingSource: str(lead.ratingSource),
    services: services.length ? services : defaults,
    servicesFromDefaults: services.length === 0 && defaults.length > 0,
    reviewThemes: list(lead.reviewThemes),
    languages: list(lead.languages),
    established: num(lead.established),
    hours: str(lead.hours),
    sources: Array.isArray(lead.sources) ? lead.sources.filter((s) => s && typeof s.url === "string").map((s) => ({ ...s })) : [],
  };
}

export const NEVER_CLAIM = [
  "licensed, insured, bonded or certified",
  "awards, rankings, #1, number one or best in",
  "years in business, since a year, decades or established",
  "family owned or family run",
  "guarantees, warranties or financing",
  "testimonials, quotes or named reviewers",
  "customer counts, project counts, results or any statistic",
  "availability promises such as 24/7 or same day",
];

export function buildTruthPlan(modules: readonly string[], facts: BusinessFacts): TruthPlan {
  const out: TruthPlan["facts"] = [];
  const push = (field: string, label: string, value: string) => {
    if (value) out.push({ field, label, value });
  };
  push("business", "Business name", facts.business);
  push("category", "Category", facts.category);
  push("city", "City", [facts.city, facts.state].filter(Boolean).join(", "));
  push("area", "Area", facts.area);
  push("metro", "Metro", facts.metro);
  push("address", "Address", facts.address);
  push("phone", "Phone", facts.phone);
  if (facts.googleRating !== null) push("googleRating", "Google rating", String(facts.googleRating));
  if (facts.googleReviews !== null) push("googleReviews", "Google review count", String(facts.googleReviews));
  push("services", facts.servicesFromDefaults ? "Services (category defaults, label as examples to confirm)" : "Services", facts.services.join("; "));
  push("reviewThemes", "Review themes (paraphrased, never quotes)", facts.reviewThemes.join("; "));
  push("languages", "Languages", facts.languages.join(", "));
  if (facts.established !== null) push("established", "Established (sourced year)", String(facts.established));
  push("hours", "Hours", facts.hours);
  const truths = uniq(modules).map((m) => moduleTruth(m, facts));
  return {
    facts: out,
    sources: facts.sources,
    modules: truths,
    placeholders: truths.filter((t) => t.status === "placeholder").map((t) => t.module),
    neverClaim: [...NEVER_CLAIM],
  };
}

export function conversionObjective(profile: IndustryProfile, attrs: BusinessAttributes, traits: readonly TraitSummary[]): ConversionObjective {
  const weights = traitWeights(traits);
  let order = [...profile.primaryConversions];
  const reasons: string[] = [];
  if (!attrs.hasPhone && order.includes("call")) {
    order = order.filter((c) => c !== "call");
    reasons.push("the record has no phone, so call cannot be a conversion");
  }
  const moveFirst = (c: string, why: string) => {
    if (order.includes(c) && order[0] !== c) {
      order = [c, ...order.filter((x) => x !== c)];
      reasons.push(why);
    }
  };
  if (attrs.hasBookingLink) moveFirst("book", "the record has a booking link, so booking leads");
  if (weights.has("urgent-need") && attrs.hasPhone) moveFirst("call", "the urgent-need trait puts the call first");
  const primary = order[0] || profile.primaryConversions[0];
  const secondary = order.find((c) => c !== primary) || "";
  const reason = `Primary conversion ${primary}${secondary ? `, secondary ${secondary}` : ""}, from the ${profile.label} conversion list${reasons.length ? `; ${reasons.join("; ")}` : ""}.`;
  return { primary, secondary, reason };
}

// ---------------------------------------------------------------------------------------------
// Archetype scoring
// ---------------------------------------------------------------------------------------------

const CONVERSION_WORDS: Record<string, RegExp> = {
  call: /call|phone/,
  "request-estimate": /estimate|quote/,
  inspection: /inspection|estimate/,
  quote: /quote|estimate/,
  book: /book/,
  appointment: /appointment|book/,
  consultation: /consult/,
  reserve: /reserv|book/,
  tour: /tour/,
  demo: /demo/,
  donate: /donat/,
  rfq: /rfq|quote/,
};

function ctaMatchesConversion(style: string, conversion: string): boolean {
  const re = CONVERSION_WORDS[conversion];
  return re ? re.test(style) : style.includes(conversion);
}

export function scoreArchetypes(profile: IndustryProfile, traits: readonly TraitSummary[], conversion: ConversionObjective, seed: string): ArchetypeScore[] {
  const weights = traitWeights(traits);
  const raw = profile.archetypes.map((a) => {
    const matchedTraits = a.suitableBrandTraits.filter((t) => weights.has(t));
    const traitFit = matchedTraits.reduce((s, t) => s + (weights.get(t) || 0), 0);
    let conversionFit = 0;
    if (a.primaryConversions && a.primaryConversions.length) {
      const i = a.primaryConversions.indexOf(conversion.primary);
      conversionFit = i === 0 ? 3 : i > 0 ? 2 : 0;
    } else if (a.ctaStyles.some((c) => ctaMatchesConversion(c, conversion.primary))) {
      conversionFit = 2;
    }
    const excludedBy = (a.excludedBrandTraits || []).filter((t) => weights.has(t));
    return { a, traitFit, conversionFit, matchedTraits, excludedBy };
  });
  const eligible = raw.filter((r) => !r.excludedBy.length);
  const best = Math.max(0, ...eligible.map((r) => r.traitFit));
  return raw
    .map((r) => ({
      id: r.a.id,
      label: r.a.label,
      score: r.traitFit * 10 + r.conversionFit,
      traitFit: r.traitFit,
      conversionFit: r.conversionFit,
      matchedTraits: r.matchedTraits,
      excludedBy: r.excludedBy,
      appropriate: !r.excludedBy.length && (best === 0 || r.traitFit * 2 >= best),
      tie: seededIndex(seed, `archetype:${r.a.id}`, 1000003),
    }))
    .sort((x, y) => Number(y.appropriate) - Number(x.appropriate) || y.traitFit - x.traitFit || y.conversionFit - x.conversionFit || x.tie - y.tie)
    .map((s) => ({ id: s.id, label: s.label, score: s.score, traitFit: s.traitFit, conversionFit: s.conversionFit, matchedTraits: s.matchedTraits, excludedBy: s.excludedBy, appropriate: s.appropriate }));
}

// ---------------------------------------------------------------------------------------------
// Option ordering inside an archetype
// ---------------------------------------------------------------------------------------------

const PROOF_WORD_TRAITS: readonly { pattern: RegExp; traits: readonly string[] }[] = [
  { pattern: /review|rating/, traits: ["highly-rated", "popular", "trusted"] },
  { pattern: /project|craft|portfolio/, traits: ["craftsmanship", "visual", "residential", "detail-oriented"] },
  { pattern: /before-after/, traits: ["visual", "craftsmanship"] },
  { pattern: /crew|team/, traits: ["hardworking", "local", "personal"] },
  { pattern: /credential/, traits: ["established", "commercial", "reliable"] },
  { pattern: /story/, traits: ["documentary", "personal", "warm"] },
];

function sumWeights(traits: readonly string[] | undefined, weights: Map<string, number>): number {
  return (traits || []).reduce((s, t) => s + (weights.get(t) || 0), 0);
}

interface OrderContext {
  seed: string;
  weights: Map<string, number>;
  // Palette order ignores traits every lead of the category shares (category and city
  // evidence), so colour follows what is specific to the business, then the seed.
  paletteWeights: Map<string, number>;
  family?: BaseArchetype;
  profile: IndustryProfile;
  conversion: ConversionObjective;
}

function affinity(axis: AxisKey, value: string, c: OrderContext): number {
  if (axis === "paletteFamily") return sumWeights(c.profile.palettes?.[value]?.traits, c.paletteWeights);
  if (axis === "ctaStyle") {
    let s = sumWeights(VALUE_TRAIT_AFFINITY[`ctaStyle:${value}`], c.weights);
    if (ctaMatchesConversion(value, c.conversion.primary)) s += 100;
    else if (c.conversion.secondary && ctaMatchesConversion(value, c.conversion.secondary)) s += 10;
    return s;
  }
  if (axis === "proofStyle") return PROOF_WORD_TRAITS.filter((p) => p.pattern.test(value)).reduce((s, p) => s + sumWeights(p.traits, c.weights), 0);
  return sumWeights(VALUE_TRAIT_AFFINITY[`${axis}:${value}`], c.weights);
}

function orderValues(axis: AxisKey, values: readonly string[], c: OrderContext): string[] {
  const pref = familyPreference(c.family, axis);
  return seededOrder(values, c.seed, `axis:${axis}`)
    .map((v, i) => ({ v, i, s: affinity(axis, v, c) * 10 + (pref.includes(v) ? 1 : 0) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.v);
}

// Bounded recompositions of an allowed order: adjacent swaps of middle sections. The hero, the
// section right after it (where the proof or triage sits) and the closing section never move.
export function recomposeSectionOrders(orders: readonly string[][]): string[][] {
  const seen = new Set(orders.map((o) => o.join(",")));
  const out: string[][] = [];
  for (const order of orders) {
    for (let i = 2; i < order.length - 2; i += 1) {
      const next = [...order];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      const key = next.join(",");
      if (!seen.has(key)) {
        seen.add(key);
        out.push(next);
      }
    }
  }
  return out;
}

// An order is within an archetype's bounds when it is one of its orders or a recomposition, or
// (for a human override) it reorders exactly the sections of an allowed order with hero first.
export function sectionOrderWithinBounds(order: readonly string[], archetype: IndustryArchetype, { human = false } = {}): boolean {
  const key = order.join(",");
  const allowed = [...archetype.sectionOrders, ...recomposeSectionOrders(archetype.sectionOrders)];
  if (allowed.some((o) => o.join(",") === key)) return true;
  if (!human || order[0] !== "hero" || new Set(order).size !== order.length) return false;
  const sorted = [...order].sort().join(",");
  return archetype.sectionOrders.some((o) => [...o].sort().join(",") === sorted);
}

function motionAllowed(values: readonly string[], ceilings: readonly (MotionStyle | undefined)[]): string[] {
  let max = MOTION_STYLES.length - 1;
  for (const c of ceilings) if (c) max = Math.min(max, MOTION_STYLES.indexOf(c));
  return values.filter((v) => MOTION_STYLES.indexOf(v as MotionStyle) <= max);
}

interface ArchetypePlan {
  archetype: IndustryArchetype;
  family?: BaseArchetype;
  options: Record<AxisKey, string[]>;
  orders: Map<string, string[]>;
}

function planArchetype(archetype: IndustryArchetype, profile: IndustryProfile, base: Omit<OrderContext, "family" | "profile">, families: FamilyRegistry | undefined, warnings: string[]): ArchetypePlan {
  const family = archetype.family ? families?.families.get(archetype.family) : undefined;
  const c: OrderContext = { ...base, family, profile };
  let motion = motionAllowed(archetype.motion, [profile.motionCeiling, family?.motion.ceiling]);
  if (!motion.length) {
    warnings.push(`Every motion option of ${archetype.label} is above a ceiling; the archetype's own list is used.`);
    motion = [...archetype.motion];
  }
  const allOrders = [...seededOrder(archetype.sectionOrders, base.seed, "axis:sectionOrder"), ...recomposeSectionOrders(archetype.sectionOrders)];
  const orders = new Map(allOrders.map((o) => [o.join(","), o]));
  return {
    archetype,
    family,
    orders,
    options: {
      hero: orderValues("hero", archetype.heroes, c),
      navigation: orderValues("navigation", archetype.navigation, c),
      typography: orderValues("typography", archetype.typography, c),
      layoutRhythm: orderValues("layoutRhythm", archetype.layoutRhythms, c),
      geometry: orderValues("geometry", archetype.geometries, c),
      imagery: orderValues("imagery", archetype.imagery, c),
      motion: orderValues("motion", motion, c),
      paletteFamily: orderValues("paletteFamily", archetype.paletteFamilies, c),
      ctaStyle: orderValues("ctaStyle", archetype.ctaStyles, c),
      proofStyle: orderValues("proofStyle", archetype.proofStyles, c),
      componentDialect: orderValues("componentDialect", archetype.componentDialects, c),
      sectionOrder: [...orders.keys()],
    },
  };
}

function baseValues(plan: ArchetypePlan): Values {
  const v = {} as Values;
  for (const k of AXIS_KEYS) v[k] = plan.options[k][0];
  return v;
}

// Every combination where the unlocked axes vary and `mustChange` is off its base value, fewest
// changed axes first, then in option order (earlier repair axes vary slowest).
function* stepCandidates(plan: ArchetypePlan, unlocked: readonly AxisKey[], mustChange: AxisKey, collectLimit = 20000): Generator<Values> {
  const axes = [...unlocked];
  const sizes = axes.map((a) => plan.options[a].length);
  const total = sizes.reduce((p, n) => p * n, 1);
  const base = baseValues(plan);
  const mustIndex = axes.indexOf(mustChange);
  const build = (idx: number[]) => {
    const v = { ...base };
    axes.forEach((a, i) => {
      v[a] = plan.options[a][idx[i]];
    });
    return v;
  };
  if (total <= collectLimit) {
    const all: { idx: number[]; changed: number; n: number }[] = [];
    for (let n = 0; n < total; n += 1) {
      const idx: number[] = [];
      let rest = n;
      for (let i = axes.length - 1; i >= 0; i -= 1) {
        idx[i] = rest % sizes[i];
        rest = Math.floor(rest / sizes[i]);
      }
      if (idx[mustIndex] === 0) continue;
      all.push({ idx, changed: idx.filter((x) => x !== 0).length, n });
    }
    all.sort((a, b) => a.changed - b.changed || a.n - b.n);
    for (const c of all) yield build(c.idx);
    return;
  }
  const idx = axes.map(() => 0);
  for (let n = 0; n < total; n += 1) {
    if (idx[mustIndex] !== 0) yield build(idx);
    for (let i = axes.length - 1; i >= 0; i -= 1) {
      idx[i] += 1;
      if (idx[i] < sizes[i]) break;
      idx[i] = 0;
    }
  }
}

// ---------------------------------------------------------------------------------------------
// DNA assembly
// ---------------------------------------------------------------------------------------------

interface Assembly {
  lead: LeadRecord;
  classification: Classification;
  profile: IndustryProfile;
  traits: TraitSummary[];
  conversion: ConversionObjective;
  seed: string;
  createdAt: string;
  dialects?: DialectRegistry;
  references?: readonly DesignReference[];
  extraForbidden: string[];
  extraRequired: string[];
  fontPairingId?: string;
  recentPairings: ReadonlySet<string>;
}

// The pairing for a typography classification: an explicit choice first, then the archetype's
// preferred pairings, in seeded order, skipping pairings the recent sites already use while an
// unused one remains.
export function pickFontPairing(typography: TypographyStyle, archetype: IndustryArchetype, seed: string, preferredId?: string, avoid: ReadonlySet<string> = new Set()): FontPairing {
  const all = pairingsFor(typography);
  if (preferredId) {
    const p = all.find((x) => x.id === preferredId);
    if (p) return p;
  }
  const preferred = all.filter((p) => (archetype.fontPairings || []).includes(p.id));
  const pool = preferred.length ? preferred : all;
  const ordered = seededOrder(pool, seed, `fonts:${typography}`);
  return ordered.find((p) => !avoid.has(p.id)) || ordered[0];
}

export function resolvePalette(profile: IndustryProfile, family: string): ResolvedPalette | undefined {
  const p = profile.palettes?.[family];
  return p ? { ...p, family, tokens: { ...p.tokens } } : undefined;
}

function forbiddenFor(dna: Pick<SiteDNA, "geometry" | "hero" | "imagery" | "typography" | "layoutRhythm" | "componentDialect">, profile: IndustryProfile, archetype: IndustryArchetype, family: BaseArchetype | undefined, dialects: DialectRegistry | undefined, extra: readonly string[]): string[] {
  const globals = GLOBAL_FORBIDDEN_DEFAULTS.filter((g) => !(g.releasedBy && g.releasedBy(dna))).map((g) => g.key);
  const dialect = dialects?.dialects.get(dna.componentDialect);
  return uniq([...profile.defaultForbiddenPatterns, ...archetype.forbiddenPatterns, ...(family?.forbiddenPatterns || []), ...(dialect?.forbiddenPatterns || []), ...globals, ...extra]);
}

function assemble(plan: ArchetypePlan, values: Values, a: Assembly): SiteDNA {
  const archetype = plan.archetype;
  const sectionOrder = [...(plan.orders.get(values.sectionOrder) || values.sectionOrder.split(","))];
  const typography = values.typography as TypographyStyle;
  const sub = a.profile.subIndustries?.[a.classification.subIndustry];
  const dna: SiteDNA = {
    version: 1,
    leadId: a.lead.id,
    businessName: String(a.lead.business || ""),
    industry: a.profile.id,
    subIndustry: a.classification.subIndustry,
    archetype: archetype.id,
    brandTraits: a.traits.map((t) => t.trait),
    primaryConversion: a.conversion.primary,
    hero: values.hero as HeroStyle,
    navigation: values.navigation as NavigationStyle,
    typography,
    paletteFamily: values.paletteFamily,
    layoutRhythm: values.layoutRhythm as LayoutRhythm,
    geometry: values.geometry as GeometryStyle,
    imagery: values.imagery as ImageryStyle,
    motion: values.motion as MotionStyle,
    sectionOrder,
    ctaStyle: values.ctaStyle,
    proofStyle: values.proofStyle,
    componentDialect: values.componentDialect,
    // The phone is part of the conversion architecture whenever the industry converts by call
    // and the record has a number, whatever the archetype lists.
    requiredModules: uniq([...a.profile.requiredModules, ...archetype.requiredModules, ...(a.profile.primaryConversions.includes("call") && String(a.lead.phone || "").trim() ? ["phone-cta"] : []), ...a.extraRequired]),
    forbiddenPatterns: [],
    referencesUsed: [],
    seed: a.seed,
    createdAt: a.createdAt,
  };
  dna.forbiddenPatterns = forbiddenFor(dna, a.profile, archetype, plan.family, a.dialects, a.extraForbidden);
  if (sub) dna.subIndustryLabel = sub.label;
  dna.schemaType = sub?.schemaOrgType || a.profile.schemaOrgType || "LocalBusiness";
  if (a.conversion.secondary) dna.secondaryConversion = a.conversion.secondary;
  dna.fontPairing = pickFontPairing(typography, archetype, a.seed, a.fontPairingId, a.recentPairings);
  const palette = resolvePalette(a.profile, dna.paletteFamily);
  if (palette) dna.palette = palette;
  const refs = selectReferences(a.references || [], { industry: a.profile.id, archetype: archetype.id, family: archetype.family, dialect: dna.componentDialect, preferred: a.profile.references });
  dna.referencesUsed = refs.map((r) => r.id);
  dna.fingerprint = dnaFingerprint(dna);
  return dna;
}

// ---------------------------------------------------------------------------------------------
// Fast similarity pre-check (same rules as compareSiteDNA), used to skip hopeless candidates
// before the official validateAgainstHistory call.
// ---------------------------------------------------------------------------------------------

const SCALAR_DIMS = ["archetype", "hero", "navigation", "typography", "paletteFamily", "layoutRhythm", "geometry", "imagery", "motion", "ctaStyle", "proofStyle", "componentDialect"] as const;

interface FastSite {
  values: string[];
  order: string;
  hero: string;
  typography: string;
  geometry: string;
}

function fast(dna: Pick<SiteDNA, (typeof SCALAR_DIMS)[number] | "sectionOrder">): FastSite {
  return { values: SCALAR_DIMS.map((d) => String(dna[d])), order: dna.sectionOrder.join(","), hero: dna.hero, typography: dna.typography, geometry: dna.geometry };
}

function fastOk(c: FastSite, set: readonly FastSite[], all: readonly FastSite[]): boolean {
  for (const s of set) {
    let diff = c.order === s.order ? 0 : 1;
    for (let i = 0; i < c.values.length; i += 1) if (c.values[i] !== s.values[i]) diff += 1;
    if (diff < 6) return false;
    if (c.order === s.order && c.hero === s.hero && c.typography === s.typography && c.geometry === s.geometry) return false;
  }
  for (const s of all) {
    if (c.order !== s.order) continue;
    let same = true;
    for (let i = 0; i < c.values.length; i += 1) if (c.values[i] !== s.values[i]) { same = false; break; }
    if (same) return false;
  }
  return true;
}

function fastFromValues(archetypeId: string, v: Values): FastSite {
  const values = SCALAR_DIMS.map((d) => (d === "archetype" ? archetypeId : v[d as AxisKey]));
  return { values, order: v.sectionOrder, hero: v.hero, typography: v.typography, geometry: v.geometry };
}

// ---------------------------------------------------------------------------------------------
// Variation summary
// ---------------------------------------------------------------------------------------------

function summarize(dna: SiteDNA, set: readonly HistoryEntry[], others: readonly SiteDNA[], lookback: number, industryLookback: number, repairs: string[], checked: number) {
  const check = checkCandidate(dna, set.map((e) => e.dna), [...others]);
  const comparisons: ComparisonSummary[] = check.comparisons.map(({ site, result }, i) => ({
    leadId: set[i].leadId,
    business: set[i].business,
    industry: set[i].industry,
    archetype: site.archetype,
    valid: result.valid,
    differenceCount: result.differenceCount,
    differenceRatio: Math.round(result.differenceRatio * 1000) / 1000,
    matchingDimensions: result.matchingDimensions,
    differingDimensions: result.differingDimensions,
    cloneSignatureConflict: result.cloneSignatureConflict,
    duplicate: result.differenceCount === 0,
  }));
  return {
    valid: check.valid,
    summary: {
      score: check.score,
      valid: check.valid,
      comparedWith: set.length,
      lookback,
      industryLookback,
      duplicateOf: check.duplicate ? check.duplicate.leadId : null,
      comparisons,
      repairs,
      candidatesChecked: checked,
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Records, locking, snapshots
// ---------------------------------------------------------------------------------------------

export function lockRecord(record: SiteDnaRecord, opts: { by: string; now: string | Date }): SiteDnaRecord {
  const at = toIso(opts.now);
  return { ...record, dna: { ...record.dna, locked: true }, locked: true, lockedBy: opts.by, lockedAt: at, updatedAt: at, reasoningSummary: [...record.reasoningSummary.filter((l) => !l.startsWith("Locked by ")), `Locked by ${opts.by} on ${at.slice(0, 10)}.`] };
}

export function unlockRecord(record: SiteDnaRecord, opts: { now: string | Date }): SiteDnaRecord {
  const at = toIso(opts.now);
  return { ...record, dna: { ...record.dna, locked: false }, locked: false, lockedBy: "", lockedAt: "", updatedAt: at, reasoningSummary: record.reasoningSummary.filter((l) => !l.startsWith("Locked by ")) };
}

export function snapshotOf(record: SiteDnaRecord): LeadDnaSnapshot {
  return {
    file: `demos/${record.leadId}/SITE_DNA.json`,
    fingerprint: record.fingerprint,
    industry: record.dna.industry,
    archetype: record.dna.archetype,
    variationScore: record.variation.score,
    variationValid: record.variation.valid,
    locked: record.locked,
    lockedBy: record.lockedBy,
    lockedAt: record.lockedAt,
    overridden: record.overridden,
    auditPass: record.audit ? record.audit.pass : null,
    auditScore: record.audit ? record.audit.score : null,
    updatedAt: record.updatedAt,
    dna: record.dna,
  };
}

// The stored snapshot on a lead, if it looks like one.
export function snapshotFromLead(lead: LeadRecord): LeadDnaSnapshot | null {
  const s = lead.demo && (lead.demo as Record<string, unknown>).dna;
  if (!s || typeof s !== "object") return null;
  const snap = s as LeadDnaSnapshot;
  return snap.dna && typeof snap.dna === "object" && Array.isArray(snap.dna.sectionOrder) ? snap : null;
}

// ---------------------------------------------------------------------------------------------
// Override validation
// ---------------------------------------------------------------------------------------------

const OVERRIDE_AXES: readonly { field: AxisKey; list: keyof IndustryArchetype }[] = [
  { field: "hero", list: "heroes" },
  { field: "navigation", list: "navigation" },
  { field: "typography", list: "typography" },
  { field: "layoutRhythm", list: "layoutRhythms" },
  { field: "geometry", list: "geometries" },
  { field: "imagery", list: "imagery" },
  { field: "motion", list: "motion" },
  { field: "paletteFamily", list: "paletteFamilies" },
  { field: "ctaStyle", list: "ctaStyles" },
  { field: "proofStyle", list: "proofStyles" },
  { field: "componentDialect", list: "componentDialects" },
];

export function validateOverride(override: DnaOverride, profile: IndustryProfile, archetype: IndustryArchetype): ValidationResult {
  const errors: string[] = [];
  const f = override.fields || {};
  if (!override.by || !String(override.by).trim()) errors.push("An override needs the name of the person making it (by).");
  for (const { field, list: key } of OVERRIDE_AXES) {
    const value = f[field];
    if (value === undefined) continue;
    const allowed = archetype[key] as string[];
    if (!allowed.includes(String(value))) errors.push(`${DIMENSION_LABELS[field]} "${value}" is outside the ${archetype.label} bounds for ${profile.label}; allowed: ${allowed.join(", ")}.`);
  }
  if (f.sectionOrder !== undefined) {
    const bad = f.sectionOrder.filter((m) => !isModuleKey(m));
    if (bad.length) errors.push(`The section order uses unknown modules: ${bad.join(", ")}.`);
    else if (!sectionOrderWithinBounds(f.sectionOrder, archetype, { human: true })) errors.push(`The section order is outside the ${archetype.label} bounds: it must start with hero and reorder exactly the sections of one of the archetype's orders.`);
  }
  if (f.primaryConversion !== undefined && !profile.primaryConversions.includes(f.primaryConversion)) {
    errors.push(`The conversion "${f.primaryConversion}" is not one ${profile.label} uses; allowed: ${profile.primaryConversions.join(", ")}.`);
  }
  if (f.fontPairing !== undefined) {
    const p = findPairing(f.fontPairing);
    const typography = f.typography || "";
    if (!p) errors.push(`The font pairing "${f.fontPairing}" is not defined in design-tokens.ts.`);
    else if (typography && p.typography !== typography) errors.push(`The font pairing "${f.fontPairing}" is ${p.typography}, not the chosen typography ${typography}.`);
    else if (!archetype.typography.includes(p.typography)) errors.push(`The font pairing "${f.fontPairing}" is ${p.typography}, which ${archetype.label} does not allow.`);
  }
  for (const m of f.addRequiredModules || []) if (!isModuleKey(m)) errors.push(`The added required module "${m}" is not a ModuleKey.`);
  return { ok: errors.length === 0, errors, warnings: [] };
}

// ---------------------------------------------------------------------------------------------
// The pipeline
// ---------------------------------------------------------------------------------------------

function fail(errors: string[], warnings: string[] = []): SelectResult {
  return { ok: false, errors, warnings, record: null, reused: false };
}

export function selectSiteDna(lead: LeadRecord, engine: EngineData, options: SelectOptions): SelectResult {
  const warnings: string[] = [];
  const now = toIso(options.now);
  const history = options.history || emptyHistory();
  const lookback = options.lookback ?? 8;
  const industryLookback = options.industryLookback ?? 8;
  const existing = options.existing || null;
  const snapshot = snapshotFromLead(lead);
  const lockedSnapshot = !existing && snapshot && snapshot.locked ? snapshot : null;

  if (!lead || typeof lead.id !== "string" || !lead.id) return fail(["The lead needs an id."]);
  if (existing && existing.locked && !options.unlock) {
    if (options.override) return { ok: false, errors: [`The Site DNA for ${lead.business} is locked by ${existing.lockedBy || "a reviewer"}; unlock it before overriding.`], warnings, record: existing, reused: true };
    return { ok: true, errors: [], warnings, record: existing, reused: true };
  }

  const classification = classifyLead(lead, { categories: engine.categories, registry: engine.registry });
  warnings.push(...classification.warnings);
  const overrideIndustry = options.override?.fields.industry;
  let industryId = classification.industry;
  if (overrideIndustry) {
    if (!engine.registry.profiles.has(overrideIndustry)) return fail([`The override names the industry "${overrideIndustry}", which has no loaded profile.`], warnings);
    industryId = overrideIndustry;
  } else if (lockedSnapshot && !options.unlock && engine.registry.profiles.has(lockedSnapshot.dna.industry)) {
    industryId = lockedSnapshot.dna.industry;
  } else if (!classification.ok) {
    return fail(classification.errors, warnings);
  }
  const profile = engine.registry.profiles.get(industryId) as IndustryProfile;
  const cls: Classification = { ...classification, ok: true, errors: [], industry: industryId, reason: overrideIndustry ? `Industry set to ${profile.label} by ${options.override?.by}'s override (the category maps to ${classification.industry || "nothing"}).` : classification.reason };

  const attributes = businessAttributes(lead);
  const traits = inferBrandTraits(lead, { now });
  const weights = traitWeights(traits);
  const conversion0 = conversionObjective(profile, attributes, traits);
  const conversion = options.override?.fields.primaryConversion
    ? { ...conversion0, primary: options.override.fields.primaryConversion, secondary: conversion0.primary === options.override.fields.primaryConversion ? conversion0.secondary : conversion0.primary, reason: `Primary conversion ${options.override.fields.primaryConversion}, set by override.` }
    : conversion0;
  const seed = buildSeed({ leadId: lead.id, business: String(lead.business || ""), domain: String(lead.domain || lead.website || ""), industry: profile.id });
  const scores = scoreArchetypes(profile, traits, conversion, seed);
  const facts = factsFromLead(lead, engine.categories);
  const pool = comparisonPool(history, lead.id);
  const set = comparisonSet(pool.predecessors, profile.id, lookback, industryLookback);
  const fastSet = set.map((e) => fast(e.dna));
  const fastAll = pool.others.map((d) => fast(d));
  const createdAt = existing ? existing.createdAt : now;
  const assembly: Assembly = {
    lead,
    classification: cls,
    profile,
    traits,
    conversion,
    seed,
    createdAt,
    dialects: engine.dialects,
    references: engine.references,
    extraForbidden: options.override?.fields.addForbiddenPatterns || [],
    extraRequired: options.override?.fields.addRequiredModules || [],
    fontPairingId: options.override?.fields.fontPairing,
    recentPairings: new Set(set.map((e) => e.dna.fontPairing?.id).filter((id): id is string => Boolean(id))),
  };
  const paletteWeights = new Map<string, number>();
  for (const t of traits) {
    const w = t.evidence.filter((e) => e.field !== "categoryKey" && e.field !== "city").reduce((s, e) => s + e.weight, 0);
    if (w > 0) paletteWeights.set(t.trait, w);
  }
  const orderBase = { seed, weights, paletteWeights, conversion };
  const plans = new Map<string, ArchetypePlan>();
  const planFor = (a: IndustryArchetype) => {
    let p = plans.get(a.id);
    if (!p) {
      p = planArchetype(a, profile, orderBase, engine.families, warnings);
      plans.set(a.id, p);
    }
    return p;
  };

  let chosen: { plan: ArchetypePlan; values: Values } | null = null;
  const repairs: string[] = [];
  let checked = 0;
  let overridden = false;

  if (lockedSnapshot && !options.unlock && !options.override) {
    // The lock lives on the lead (demos/ may be gone): rebuild the record around the locked DNA.
    const dna = lockedSnapshot.dna;
    const record = finishRecord({ lead, profile, archetypeLabel: getArchetype(profile, dna.archetype)?.label || dna.archetype, dna, cls, attributes, traits, conversion, scores, facts, set, pool, lookback, industryLookback, repairs, checked, engine, now, createdAt: now, overridden: lockedSnapshot.overridden, override: null, locked: true, lockedBy: lockedSnapshot.lockedBy, lockedAt: lockedSnapshot.lockedAt, notes: ["Reused the locked Site DNA stored on the lead record."] });
    return { ok: true, errors: [], warnings, record, reused: true };
  }

  if (options.override) {
    const base = existing && existing.dna.industry === profile.id ? existing.dna : null;
    const archetypeId = options.override.fields.archetype || (base ? base.archetype : scores[0].id);
    const archetype = getArchetype(profile, archetypeId);
    if (!archetype) return fail([`The archetype "${archetypeId}" is not one of ${profile.label}'s: ${profile.archetypes.map((a) => a.id).join(", ")}.`], warnings);
    const check = validateOverride(options.override, profile, archetype);
    if (!check.ok) return fail(check.errors, warnings);
    const plan = planFor(archetype);
    const values = baseValues(plan);
    if (base && base.archetype === archetype.id) {
      for (const k of AXIS_KEYS) values[k] = k === "sectionOrder" ? base.sectionOrder.join(",") : String(base[k]);
      if (!plan.orders.has(values.sectionOrder)) plan.orders.set(values.sectionOrder, [...base.sectionOrder]);
    }
    for (const { field } of OVERRIDE_AXES) {
      const v = options.override.fields[field];
      if (v !== undefined) values[field] = String(v);
    }
    if (options.override.fields.sectionOrder) {
      values.sectionOrder = options.override.fields.sectionOrder.join(",");
      plan.orders.set(values.sectionOrder, [...options.override.fields.sectionOrder]);
    }
    if (options.override.fields.fontPairing && !options.override.fields.typography) {
      const p = findPairing(options.override.fields.fontPairing);
      if (p && p.typography !== values.typography) return fail([`The font pairing "${p.id}" is ${p.typography}, not the chosen typography ${values.typography}; override the typography too.`], warnings);
    }
    chosen = { plan, values };
    overridden = true;
  } else {
    const appropriate = scores.filter((s) => s.appropriate).map((s) => getArchetype(profile, s.id) as IndustryArchetype);
    const primary = planFor(appropriate[0]);
    const tryValues = (plan: ArchetypePlan, values: Values) => {
      checked += 1;
      return fastOk(fastFromValues(plan.archetype.id, values), fastSet, fastAll);
    };
    const max = options.maxCandidates ?? 250000;
    const baseV = baseValues(primary);
    if (tryValues(primary, baseV)) chosen = { plan: primary, values: baseV };
    // 1. another appropriate archetype
    if (!chosen) {
      for (const a of appropriate.slice(1)) {
        const plan = planFor(a);
        const v = baseValues(plan);
        if (tryValues(plan, v)) {
          chosen = { plan, values: v };
          repairs.push(`Tried another appropriate archetype: ${a.label}.`);
          break;
        }
      }
      if (!chosen && appropriate.length > 1) repairs.push(`Other appropriate archetypes (${appropriate.slice(1).map((a) => a.label).join(", ")}) were also too similar as composed.`);
    }
    // 2 to 8. recompose, typography, hero, layout, imagery, geometry, dialect (cumulative)
    const steps: { unlocked: AxisKey[]; must: AxisKey; label: string }[] = [];
    REPAIR_ORDER.forEach((axis, i) => steps.push({ unlocked: [...REPAIR_ORDER.slice(0, i + 1)], must: axis, label: REPAIR_LABELS[axis] }));
    LAST_RESORT_AXES.forEach((axis, i) => steps.push({ unlocked: [...REPAIR_ORDER, ...LAST_RESORT_AXES.slice(0, i + 1)], must: axis, label: `Last resort: also changed ${DIMENSION_LABELS[axis].toLowerCase()} together with the structural axes.` }));
    for (const step of steps) {
      if (chosen || checked > max) break;
      for (const a of appropriate) {
        if (chosen || checked > max) break;
        const plan = planFor(a);
        for (const v of stepCandidates(plan, step.unlocked, step.must)) {
          if (checked > max) break;
          if (tryValues(plan, v)) {
            chosen = { plan, values: v };
            break;
          }
        }
        if (chosen) {
          if (plan !== primary) repairs.push(`Moved to the appropriate archetype ${plan.archetype.label}.`);
          const changed = AXIS_KEYS.filter((k) => chosen && chosen.values[k] !== baseValues(plan)[k]);
          for (const axis of REPAIR_ORDER) if (changed.includes(axis)) repairs.push(REPAIR_LABELS[axis]);
          for (const axis of LAST_RESORT_AXES) if (changed.includes(axis)) repairs.push(`Also changed the ${DIMENSION_LABELS[axis].toLowerCase()} (last resort, together with structural axes).`);
        }
      }
    }
    if (!chosen) {
      // Best effort: the primary base candidate, flagged invalid for a person to resolve.
      chosen = { plan: primary, values: baseV };
      warnings.push(`No Site DNA inside the appropriate ${profile.label} archetypes differs enough from the recent sites (${checked} candidates checked); the best fit base is returned flagged invalid. Override it or add an archetype.`);
    }
  }

  const dna = assemble(chosen.plan, chosen.values, assembly);
  const notes: string[] = [];
  if (overridden) notes.push(`Overridden by ${options.override?.by}: ${Object.keys(options.override?.fields || {}).join(", ")}.`);
  const record = finishRecord({
    lead,
    profile,
    archetypeLabel: chosen.plan.archetype.label,
    dna,
    cls,
    attributes,
    traits,
    conversion,
    scores,
    facts,
    set,
    pool,
    lookback,
    industryLookback,
    repairs,
    checked,
    engine,
    now,
    createdAt,
    overridden,
    override: overridden && options.override ? { ...options.override, at: options.override.at || now } : null,
    locked: false,
    lockedBy: "",
    lockedAt: "",
    notes,
  });
  if (overridden && !record.variation.valid) warnings.push(`The override is too similar to recent sites (variation score ${record.variation.score}); it is kept because a person chose it.`);
  return { ok: true, errors: [], warnings, record, reused: false };
}

interface FinishInput {
  lead: LeadRecord;
  profile: IndustryProfile;
  archetypeLabel: string;
  dna: SiteDNA;
  cls: Classification;
  attributes: BusinessAttributes;
  traits: TraitSummary[];
  conversion: ConversionObjective;
  scores: ArchetypeScore[];
  facts: BusinessFacts;
  set: HistoryEntry[];
  pool: { others: SiteDNA[] };
  lookback: number;
  industryLookback: number;
  repairs: string[];
  checked: number;
  engine: EngineData;
  now: string;
  createdAt: string;
  overridden: boolean;
  override: DnaOverride | null;
  locked: boolean;
  lockedBy: string;
  lockedAt: string;
  notes: string[];
}

function finishRecord(i: FinishInput): SiteDnaRecord {
  const { summary } = summarize(i.dna, i.set, i.pool.others, i.lookback, i.industryLookback, i.repairs, i.checked);
  // v2 lists variationScore and locked on the DNA itself; they mirror the record and are not
  // compared dimensions, so the fingerprint does not change.
  i.dna.variationScore = summary.score;
  i.dna.locked = i.locked;
  const archetype = getArchetype(i.profile, i.dna.archetype);
  const refs: ReferenceUse[] = selectReferences(i.engine.references || [], { industry: i.profile.id, archetype: i.dna.archetype, family: archetype?.family, dialect: i.dna.componentDialect, preferred: i.profile.references });
  const truth = buildTruthPlan(uniq([...i.dna.sectionOrder, ...i.dna.requiredModules]), i.facts);
  const reasoning: string[] = [];
  reasoning.push(i.cls.reason);
  reasoning.push(i.traits.length ? `Brand traits from verified fields: ${i.traits.slice(0, 6).map(citeTrait).join(", ")}.` : "No brand traits could be inferred from verified fields; archetypes were ranked by conversion fit and the seed.");
  reasoning.push(i.conversion.reason);
  const top = i.scores.filter((s) => s.appropriate);
  reasoning.push(`${i.scores[0].label} ranked first on trait fit${i.scores[0].matchedTraits.length ? ` (${i.scores[0].matchedTraits.join(", ")})` : ""}; appropriate: ${top.map((s) => `${s.label} ${s.score}`).join(", ")}${i.scores.some((s) => !s.appropriate) ? `; set aside: ${i.scores.filter((s) => !s.appropriate).map((s) => `${s.label} ${s.score}${s.excludedBy.length ? ` (excluded by ${s.excludedBy.join(", ")})` : ""}`).join(", ")}` : ""}.`);
  reasoning.push(`${i.archetypeLabel} DNA: ${i.dna.hero} hero, ${i.dna.typography} type (${i.dna.fontPairing ? `${i.dna.fontPairing.display.family} with ${i.dna.fontPairing.body.family}` : "no pairing"}), ${i.dna.geometry} geometry, ${i.dna.imagery} imagery, ${i.dna.layoutRhythm} rhythm, ${i.dna.motion} motion, ${i.dna.componentDialect} dialect, ${i.dna.paletteFamily} palette. The seed ${i.dna.seed} only ordered options of equal fit.`);
  if (summary.comparedWith) {
    const closest = [...summary.comparisons].sort((a, b) => a.differenceCount - b.differenceCount)[0];
    reasoning.push(`Compared with ${summary.comparedWith} recent sites; the closest (${closest.business}) differs on ${closest.differenceCount} of 13 dimensions; variation score ${summary.score}${summary.valid ? "" : ", below the bar"}.`);
  } else {
    reasoning.push("No earlier sites to compare with; variation score 1.");
  }
  reasoning.push(i.repairs.length ? i.repairs.join(" ") : "No repair was needed.");
  if (truth.placeholders.length) reasoning.push(`Owner-to-confirm placeholders: ${truth.placeholders.join(", ")}.`);
  reasoning.push(...i.notes);
  if (i.locked && i.lockedBy) reasoning.push(`Locked by ${i.lockedBy} on ${i.lockedAt.slice(0, 10)}.`);
  return {
    version: 1,
    leadId: i.lead.id,
    business: String(i.lead.business || ""),
    industryLabel: i.profile.label,
    archetypeLabel: i.archetypeLabel,
    dna: i.dna,
    fingerprint: dnaFingerprint(i.dna),
    classification: i.cls,
    attributes: i.attributes,
    brandTraits: i.traits,
    conversion: i.conversion,
    archetypeScores: i.scores,
    variation: summary,
    reasoningSummary: reasoning,
    referencesUsed: refs,
    truth,
    facts: i.facts,
    locked: i.locked,
    lockedBy: i.lockedBy,
    lockedAt: i.lockedAt,
    overridden: i.overridden,
    override: i.override,
    audit: null,
    createdAt: i.createdAt,
    updatedAt: i.now,
  };
}
