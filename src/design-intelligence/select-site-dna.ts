// selectSiteDna: the brief's pipeline, pure and deterministic.
//
//   lead -> classification (industry, sub-industry) -> business attributes -> brand traits
//   (verified fields only) -> conversion objective -> appropriate archetypes scored
//   (select-archetype.ts) -> Site DNA candidates in a seeded order -> variation check against
//   the global and same industry windows -> repair in v2's order when too similar ->
//   SiteDnaRecord with a reasoning summary.
//
// Suitability always outranks the seed: every option list is sorted by brand trait affinity,
// then the archetype family's preference, and the seed only orders options of equal fit.
//
// Locking (v2): a locked DNA keeps its archetype, typography, palette family, layout rhythm,
// geometry, hero, section architecture and component dialect (LOCKED_AXES) until unlocked; facts,
// truth and copy are refreshed from the lead. Regenerate keeps facts, industry and conversion and
// picks another valid combination deterministically; explore forces a different appropriate
// archetype. A human override is validated against the industry and archetype bounds and stored
// with overridden true.
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
  MobilePriority,
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
import { MOTION_STYLES, TREATMENT_AXES } from "./schema.ts";
import type { BaseArchetype, FamilyRegistry } from "./archetypes.ts";
import { familyPreference } from "./archetypes.ts";
import type { DialectRegistry } from "./component-dialects.ts";
import { DIMENSION_LABELS, fontPairing as findPairing, GLOBAL_FORBIDDEN_DEFAULTS, pairingsFor, VALUE_TRAIT_AFFINITY } from "./design-tokens.ts";
import type { HistoryEntry, HistorySource } from "./history.ts";
import { comparisonPool, comparisonWindows, DEFAULT_INDUSTRY_LOOKBACK, DEFAULT_LOOKBACK, queryHistory, toHistoryFile } from "./history.ts";
import type { IndustryRegistry } from "./industries.ts";
import { classifyLead, getArchetype } from "./industries.ts";
import { isModuleKey, moduleTruth } from "./modules.ts";
import type { DesignReference } from "./references.ts";
import { selectReferences } from "./references.ts";
import type { AvailableImagery } from "./select-archetype.ts";
import { ctaMatchesConversion, isTrustSensitive, scoreArchetypes } from "./select-archetype.ts";
import { buildSeed, domainOf, seededOrder } from "./seed.ts";
import { businessAttributes, citeTrait, inferBrandTraits, traitWeights } from "./traits.ts";
import { DEFAULT_TRUST_SIGNALS, trustSignalTruth } from "./trust-signals.ts";
import { checkRecent, dnaFingerprint, MIN_DIFFERING_DIMENSIONS, SAME_INDUSTRY_MIN_DIFFERING } from "./variation.ts";
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
  history?: HistorySource;       // a repository, a HistoryFile or entries; never a path
  existing?: SiteDnaRecord | null;
  unlock?: boolean;              // regenerate a locked DNA from scratch (a person's decision)
  override?: DnaOverride;
  regenerate?: boolean;          // another valid combination; facts, industry and conversion kept
  explore?: boolean;             // a different appropriate archetype (explore another direction)
  imagery?: AvailableImagery;    // photos that fit the business, for archetype scoring
  allowHighMotion?: boolean;     // explicit permission for kinetic directions in trust sensitive industries
  lookback?: number;             // global window (default 8)
  industryLookback?: number;     // same industry window (default 4), always compared
  industryMinDiffering?: number; // same industry bar (default 7)
  maxCandidates?: number;
}

export interface SelectResult extends ValidationResult {
  record: SiteDnaRecord | null;
  reused: boolean;
}

// v2 repair order after "1. try another appropriate archetype": 2 hero architecture,
// 3 typography classification, 4 recompose section order, 5 layout rhythm, 6 geometry,
// 7 imagery strategy, 8 component dialect, 9 navigation architecture. Colour never changes alone:
// the palette only moves in the last resort steps, together with every structural axis.
export const REPAIR_ORDER = ["hero", "typography", "sectionOrder", "layoutRhythm", "geometry", "imagery", "componentDialect", "navigation"] as const;
export const LAST_RESORT_AXES = ["motion", "ctaStyle", "proofStyle", "paletteFamily"] as const;

// What a lock preserves (v2, Locking and regeneration). Copy and content may still evolve.
export const LOCKED_AXES = ["archetype", "typography", "paletteFamily", "layoutRhythm", "geometry", "hero", "sectionOrder", "componentDialect"] as const;

const REPAIR_LABELS: Record<string, string> = {
  hero: "Changed the hero architecture.",
  typography: "Changed the typography classification.",
  sectionOrder: "Recomposed the section order.",
  layoutRhythm: "Changed the layout rhythm.",
  geometry: "Changed the geometry.",
  imagery: "Changed the imagery strategy.",
  componentDialect: "Changed the component dialect.",
  navigation: "Changed the navigation architecture.",
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

export function buildTruthPlan(modules: readonly string[], facts: BusinessFacts, trustSignals: readonly string[] = []): TruthPlan {
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
    trustSignals: trustSignalTruth(uniq(trustSignals), facts),
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

// Archetype scoring lives in select-archetype.ts (scoreArchetypes, selectArchetype).

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
  // Trust sensitive industries (health, law, finance, home access) get restrained motion: at most
  // moderate unless the profile sets its own ceiling or the archetype is explicitly permitted.
  const industryCeiling = profile.motionCeiling ?? (isTrustSensitive(profile) && !archetype.permitsHighMotion ? "moderate" : undefined);
  let motion = motionAllowed(archetype.motion, [industryCeiling, family?.motion.ceiling]);
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
  subIndustry: string;
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

// The mobile priority a conversion implies, when the archetype lists none.
const MOBILE_PRIORITY_FOR: Record<string, MobilePriority> = {
  call: "call-first",
  book: "book-first",
  appointment: "book-first",
  consultation: "book-first",
  reserve: "book-first",
  "intro-offer": "book-first",
  membership: "book-first",
  tour: "book-first",
  "check-availability": "book-first",
  enroll: "book-first",
  "request-estimate": "form-first",
  inspection: "form-first",
  quote: "form-first",
  rfq: "form-first",
  valuation: "form-first",
  demo: "form-first",
  signup: "form-first",
  contact: "form-first",
  order: "menu-first",
  search: "search-first",
  purchase: "search-first",
  donate: "donate-first",
  volunteer: "donate-first",
};

// v2 optional treatments: each list the archetype (or, failing that, its industry) defines, in a
// seeded order; the seed only chooses among values the author allowed. mobilePriority,
// trustSignals and conversionSecondary are always derived.
function fillTreatments(dna: SiteDNA, archetype: IndustryArchetype, profile: IndustryProfile, conversion: ConversionObjective, seed: string): void {
  const target = dna as unknown as Record<string, unknown>;
  const implied = MOBILE_PRIORITY_FOR[conversion.primary] || "content-first";
  for (const t of TREATMENT_AXES) {
    const list = (archetype.treatments?.[t.list] || profile.treatments?.[t.list] || []) as readonly string[];
    if (!list.length) continue;
    // The mobile priority follows the conversion whenever the list allows it.
    target[t.field] = t.field === "mobilePriority" && list.includes(implied) ? implied : seededOrder(list, seed, `treatment:${t.field}`)[0];
  }
  if (!dna.mobilePriority) dna.mobilePriority = implied;
  dna.trustSignals = [...(profile.preferredTrustSignals && profile.preferredTrustSignals.length ? profile.preferredTrustSignals : DEFAULT_TRUST_SIGNALS)];
  if (conversion.secondary) dna.conversionSecondary = conversion.secondary;
}

function assemble(plan: ArchetypePlan, values: Values, a: Assembly): SiteDNA {
  const archetype = plan.archetype;
  const sectionOrder = [...(plan.orders.get(values.sectionOrder) || values.sectionOrder.split(","))];
  const typography = values.typography as TypographyStyle;
  const sub = a.profile.subIndustries?.[a.subIndustry];
  const dna: SiteDNA = {
    version: 1,
    leadId: a.lead.id,
    businessName: String(a.lead.business || ""),
    industry: a.profile.id,
    subIndustry: a.subIndustry,
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
    variationScore: 1,   // set by finishRecord from the variation summary
    createdAt: a.createdAt,
    locked: false,       // set by finishRecord
  };
  dna.forbiddenPatterns = forbiddenFor(dna, a.profile, archetype, plan.family, a.dialects, a.extraForbidden);
  fillTreatments(dna, archetype, a.profile, a.conversion, a.seed);
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
  min: number;       // differing dimensions required against this site
  clone: boolean;    // whether the hard clone rule applies (false only for a relaxed self check)
}

function fast(dna: Pick<SiteDNA, (typeof SCALAR_DIMS)[number] | "sectionOrder">, min = MIN_DIFFERING_DIMENSIONS, clone = true): FastSite {
  return { values: SCALAR_DIMS.map((d) => String(dna[d])), order: dna.sectionOrder.join(","), hero: dna.hero, typography: dna.typography, geometry: dna.geometry, min, clone };
}

function fastOk(c: FastSite, set: readonly FastSite[], all: readonly FastSite[]): boolean {
  for (const s of set) {
    let diff = c.order === s.order ? 0 : 1;
    for (let i = 0; i < c.values.length; i += 1) if (c.values[i] !== s.values[i]) diff += 1;
    if (diff < s.min) return false;
    if (s.clone && c.order === s.order && c.hero === s.hero && c.typography === s.typography && c.geometry === s.geometry) return false;
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
  return { values, order: v.sectionOrder, hero: v.hero, typography: v.typography, geometry: v.geometry, min: 0, clone: true };
}

// ---------------------------------------------------------------------------------------------
// Variation summary
// ---------------------------------------------------------------------------------------------

export interface Windows {
  set: HistoryEntry[];
  sameIndustry: ReadonlySet<HistoryEntry>;
  industryMin: number;
}

function summarize(dna: SiteDNA, w: Windows, others: readonly SiteDNA[], lookback: number, industryLookback: number, repairs: string[], checked: number) {
  const check = checkRecent(dna, w.set.map((e) => ({ dna: e.dna, sameIndustry: w.sameIndustry.has(e) })), others, { industryMinDiffering: w.industryMin });
  const comparisons: ComparisonSummary[] = check.comparisons.map((c, i) => ({
    leadId: w.set[i].leadId,
    business: w.set[i].business,
    industry: w.set[i].industry,
    archetype: c.site.archetype,
    valid: c.valid,
    differenceCount: c.result.differenceCount,
    differenceRatio: Math.round(c.result.differenceRatio * 1000) / 1000,
    matchingDimensions: c.result.matchingDimensions,
    differingDimensions: c.result.differingDimensions,
    cloneSignatureConflict: c.result.cloneSignatureConflict,
    duplicate: c.result.differenceCount === 0,
    sameIndustry: c.sameIndustry,
    required: c.required,
    optionalDiffering: c.optional.differing,
    optionalMatching: c.optional.matching,
  }));
  return {
    valid: check.valid,
    summary: {
      score: check.score,
      valid: check.valid,
      comparedWith: w.set.length,
      lookback,
      industryLookback,
      duplicateOf: check.duplicate ? check.duplicate.leadId : null,
      comparisons,
      repairs,
      candidatesChecked: checked,
      industryScore: check.industryScore,
      industryComparedWith: comparisons.filter((c) => c.sameIndustry).length,
      industryMinDiffering: check.industryMinDiffering,
      minDiffering: check.minDiffering,
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

function valuesOf(dna: SiteDNA): Values {
  const v = {} as Values;
  for (const k of AXIS_KEYS) v[k] = k === "sectionOrder" ? dna.sectionOrder.join(",") : String(dna[k]);
  return v;
}

// The axes a lock leaves free. Regenerating a locked DNA may move only these.
export const FREE_UNDER_LOCK = ["navigation", "imagery", "motion", "ctaStyle", "proofStyle"] as const;

// Every combination of the free axes around a pinned base, fewest changes first, the base
// itself excluded. Options come in the plan's order, so the result is deterministic.
function* freeCombinations(plan: ArchetypePlan, base: Values, axes: readonly AxisKey[]): Generator<Values> {
  const lists = axes.map((a) => uniq([base[a], ...plan.options[a]]));
  const sizes = lists.map((l) => l.length);
  const total = sizes.reduce((p, n) => p * n, 1);
  const all: { v: Values; changed: number; n: number }[] = [];
  for (let n = 1; n < total; n += 1) {
    let rest = n;
    const v = { ...base };
    let changed = 0;
    for (let i = axes.length - 1; i >= 0; i -= 1) {
      const j = rest % sizes[i];
      rest = Math.floor(rest / sizes[i]);
      v[axes[i]] = lists[i][j];
      if (j) changed += 1;
    }
    all.push({ v, changed, n });
  }
  all.sort((a, b) => a.changed - b.changed || a.n - b.n);
  for (const c of all) yield c.v;
}

// The sub-industry is always populated: the category's, unless the industry was changed by an
// override or kept from a lock, in which case the profile's first sub-industry (or its id).
function resolveSubIndustry(profile: IndustryProfile, own: string, industryChanged: boolean, warnings: string[]): string {
  const subs = profile.subIndustries ? Object.keys(profile.subIndustries) : [];
  if (!industryChanged) return own || subs[0] || profile.id;
  if (own && subs.includes(own)) return own;
  const fallback = subs[0] || profile.id;
  if (own) warnings.push(`The sub-industry "${own}" comes from the lead's category, not the ${profile.label} profile; "${fallback}" is used.`);
  return fallback;
}

export function selectSiteDna(lead: LeadRecord, engine: EngineData, options: SelectOptions): SelectResult {
  const warnings: string[] = [];
  if (!lead || typeof lead.id !== "string" || !lead.id) return fail(["The lead needs an id."]);
  const now = toIso(options.now);
  const history = toHistoryFile(options.history);
  const lookback = options.lookback ?? DEFAULT_LOOKBACK;
  const industryLookback = options.industryLookback ?? DEFAULT_INDUSTRY_LOOKBACK;
  const industryMin = Math.max(MIN_DIFFERING_DIMENSIONS, options.industryMinDiffering ?? SAME_INDUSTRY_MIN_DIFFERING);
  const existing = options.existing || null;
  const snapshot = snapshotFromLead(lead);
  const ownEntries = queryHistory(history, { leadId: lead.id });
  // The lead's current DNA: its record, else the snapshot on the lead, else its latest history entry.
  const current: SiteDNA | null = existing ? existing.dna : snapshot ? snapshot.dna : ownEntries.length ? ownEntries[ownEntries.length - 1].dna : null;
  const lockInfo = existing && existing.locked
    ? { by: existing.lockedBy, at: existing.lockedAt, overridden: existing.overridden, override: existing.override }
    : !existing && snapshot && snapshot.locked
      ? { by: snapshot.lockedBy, at: snapshot.lockedAt, overridden: snapshot.overridden, override: null }
      : null;
  const locked = lockInfo !== null && !options.unlock && current !== null;
  const lockedBy = lockInfo?.by || "a reviewer";
  if (locked && options.override) return { ok: false, errors: [`The Site DNA for ${lead.business} is locked by ${lockedBy}; unlock it before overriding.`], warnings, record: existing, reused: true };
  if (locked && options.explore) return { ok: false, errors: [`The Site DNA for ${lead.business} is locked by ${lockedBy}; unlock it before exploring another direction, which changes the archetype.`], warnings, record: existing, reused: true };
  if (options.override && (options.regenerate || options.explore)) return fail(["Override, regenerate and explore are separate actions; pick one."]);
  const redirect = Boolean(options.regenerate || options.explore);

  const classification = classifyLead(lead, { categories: engine.categories, registry: engine.registry });
  warnings.push(...classification.warnings);
  const overrideIndustry = options.override?.fields.industry;
  // A lock, a regeneration and an exploration keep the industry of the current DNA.
  const keptIndustry = current && (locked || redirect) && engine.registry.profiles.has(current.industry) ? current.industry : "";
  let industryId = classification.industry;
  if (overrideIndustry) {
    if (!engine.registry.profiles.has(overrideIndustry)) return fail([`The override names the industry "${overrideIndustry}", which has no loaded profile.`], warnings);
    industryId = overrideIndustry;
  } else if (keptIndustry) {
    industryId = keptIndustry;
  } else if (!classification.ok) {
    return fail(classification.errors, warnings);
  }
  const profile = engine.registry.profiles.get(industryId) as IndustryProfile;
  const industryChanged = industryId !== classification.industry;
  const subIndustry = resolveSubIndustry(profile, classification.subIndustry, industryChanged, warnings);
  const reason = overrideIndustry
    ? `Industry set to ${profile.label} by ${options.override?.by}'s override (the category maps to ${classification.industry || "nothing"}).`
    : keptIndustry && industryChanged
      ? `Industry kept at ${profile.label} from the ${locked ? "locked" : "current"} Site DNA (the category maps to ${classification.industry || "nothing"}).`
      : classification.reason;
  const cls: Classification = { ...classification, ok: true, errors: [], industry: industryId, subIndustry, reason };

  const attributes = businessAttributes(lead);
  const traits = inferBrandTraits(lead, { now });
  const weights = traitWeights(traits);
  const conversion0 = conversionObjective(profile, attributes, traits);
  let conversion = conversion0;
  const overrideConversion = options.override?.fields.primaryConversion;
  if (overrideConversion) {
    conversion = { primary: overrideConversion, secondary: conversion0.primary === overrideConversion ? conversion0.secondary : conversion0.primary, reason: `Primary conversion ${overrideConversion}, set by override.` };
  } else if (current && (locked || redirect) && current.industry === profile.id && current.primaryConversion !== conversion0.primary && profile.primaryConversions.includes(current.primaryConversion) && (current.primaryConversion !== "call" || attributes.hasPhone)) {
    // The conversion objective survives a lock and a regeneration while it is still possible.
    conversion = { primary: current.primaryConversion, secondary: conversion0.primary, reason: `Primary conversion ${current.primaryConversion} kept from the ${locked ? "locked" : "current"} Site DNA, secondary ${conversion0.primary}.` };
  }
  const seed = buildSeed({ leadId: lead.id, business: String(lead.business || ""), domain: domainOf(lead), industry: profile.id });
  const facts = factsFromLead(lead, engine.categories);
  const pool = comparisonPool(history, lead.id);
  const win = comparisonWindows(pool.predecessors, profile.id, lookback, industryLookback);
  const windows: Windows = { set: win.set, sameIndustry: new Set(win.sameIndustry), industryMin };
  const fastSet = win.set.map((e) => fast(e.dna, windows.sameIndustry.has(e) ? industryMin : MIN_DIFFERING_DIMENSIONS));
  const fastAll = pool.others.map((d) => fast(d));
  const createdAt = existing ? existing.createdAt : now;
  const scores = scoreArchetypes(profile, traits, conversion, seed, {
    subIndustry,
    attributes,
    imagery: options.imagery,
    recentSameIndustry: win.sameIndustry,
    recentGlobal: win.global,
    allowHighMotion: options.allowHighMotion,
    exclude: options.explore && current ? [current.archetype] : [],
  });
  const assembly: Assembly = {
    lead,
    classification: cls,
    subIndustry,
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
    recentPairings: new Set(win.set.map((e) => e.dna.fontPairing?.id).filter((id): id is string => Boolean(id))),
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
  const finish = (dna: SiteDNA, archetypeLabel: string, extra: Partial<FinishInput>) => finishRecord({
    lead, profile, archetypeLabel, dna, cls, attributes, traits, conversion, scores, facts, windows, pool, lookback, industryLookback, repairs: [], checked: 0, engine, now, createdAt,
    overridden: false, override: null, locked: false, lockedBy: "", lockedAt: "", notes: [], audit: null,
    ...extra,
  });

  // ---- Locked: the LOCKED_AXES stay; facts, truth and copy are refreshed ----------------------
  if (locked && current && lockInfo) {
    const archetype = getArchetype(profile, current.archetype);
    if (!archetype) {
      if (existing) {
        warnings.push(`The locked archetype "${current.archetype}" is no longer in the ${profile.label} profile; the locked Site DNA is kept exactly as it was.`);
        return { ok: true, errors: [], warnings, record: existing, reused: true };
      }
      return fail([`The locked archetype "${current.archetype}" is no longer in the ${profile.label} profile; unlock the Site DNA to choose again.`], warnings);
    }
    const plan = planFor(archetype);
    const pinned = valuesOf(current);
    if (!plan.orders.has(pinned.sectionOrder)) plan.orders.set(pinned.sectionOrder, [...current.sectionOrder]);
    let values = pinned;
    const repairs: string[] = [];
    let checked = 0;
    if (options.regenerate) {
      const self = [fast(current, 1, false)];
      const ownAll = ownEntries.map((e) => fast(e.dna));
      let fallback: Values | null = null;
      let found: Values | null = null;
      for (const v of freeCombinations(plan, pinned, FREE_UNDER_LOCK)) {
        checked += 1;
        const f = fastFromValues(archetype.id, v);
        if (!fastOk(f, self, ownAll)) continue;
        if (!fallback) fallback = v;
        if (fastOk(f, fastSet, fastAll)) {
          found = v;
          break;
        }
      }
      if (found || fallback) {
        values = (found || fallback) as Values;
        const moved = FREE_UNDER_LOCK.filter((k) => values[k] !== pinned[k]);
        repairs.push(`Regenerated inside the lock: changed ${moved.map((k) => DIMENSION_LABELS[k].toLowerCase()).join(", ")}; ${LOCKED_AXES.map((k) => DIMENSION_LABELS[k].toLowerCase()).join(", ")} kept.`);
        if (!found) warnings.push(`Inside the lock no free combination differs enough from the recent sites; unlock the Site DNA to change the locked axes.`);
      } else {
        warnings.push(`The lock leaves no other valid combination for ${lead.business}; the locked Site DNA is kept.`);
      }
    }
    const dna = assemble(plan, values, { ...assembly, fontPairingId: current.fontPairing?.id || assembly.fontPairingId, createdAt: current.createdAt || createdAt });
    const unchanged = dnaFingerprint(dna) === dnaFingerprint(current);
    const record = finish(dna, archetype.label, {
      repairs,
      checked,
      createdAt: existing ? existing.createdAt : current.createdAt || now,
      overridden: lockInfo.overridden,
      override: lockInfo.override,
      locked: true,
      lockedBy: lockInfo.by,
      lockedAt: lockInfo.at,
      audit: unchanged && existing ? existing.audit : null,
      notes: [existing ? "Kept the locked Site DNA; facts and copy were refreshed from the lead." : "Reused the locked Site DNA stored on the lead record."],
    });
    return { ok: true, errors: [], warnings, record, reused: unchanged && !options.regenerate };
  }

  // ---- Unlocked ----------------------------------------------------------------------------------
  let chosen: { plan: ArchetypePlan; values: Values } | null = null;
  const repairs: string[] = [];
  let checked = 0;
  let overridden = false;
  const notes: string[] = [];

  if (options.override) {
    const base = current && current.industry === profile.id ? current : null;
    const archetypeId = options.override.fields.archetype || (base ? base.archetype : scores[0].id);
    const archetype = getArchetype(profile, archetypeId);
    if (!archetype) return fail([`The archetype "${archetypeId}" is not one of ${profile.label}'s: ${profile.archetypes.map((a) => a.id).join(", ")}.`], warnings);
    const check = validateOverride(options.override, profile, archetype);
    if (!check.ok) return fail(check.errors, warnings);
    const plan = planFor(archetype);
    const values = baseValues(plan);
    if (base && base.archetype === archetype.id) {
      Object.assign(values, valuesOf(base));
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
    notes.push(`Overridden by ${options.override.by}: ${Object.keys(options.override.fields).join(", ")}.`);
  } else {
    const appropriate = scores.filter((s) => s.appropriate).map((s) => getArchetype(profile, s.id) as IndustryArchetype);
    if (!appropriate.length) {
      if (options.explore && current) return fail([`No other appropriate ${profile.label} archetype fits ${lead.business}; ${current.archetype} is the only one. Regenerate instead, or add an archetype to the profile.`], warnings);
      return fail([`No ${profile.label} archetype is appropriate for ${lead.business}: ${scores.map((s) => `${s.label} (${(s.notAppropriateBecause || []).join("; ")})`).join(", ")}.`], warnings);
    }
    const max = options.maxCandidates ?? 250000;
    // Regenerate and explore also move away from the lead's own current DNA and never return to
    // any DNA this lead has had before.
    const own = redirect && current ? [fast(current, MIN_DIFFERING_DIMENSIONS)] : [];
    const ownAll = redirect ? ownEntries.map((e) => fast(e.dna)) : [];
    const search = (set: readonly FastSite[], all: readonly FastSite[]) => {
      const steps: string[] = [];
      const tryValues = (plan: ArchetypePlan, values: Values) => {
        checked += 1;
        return fastOk(fastFromValues(plan.archetype.id, values), set, all);
      };
      const primary = planFor(appropriate[0]);
      const baseV = baseValues(primary);
      if (tryValues(primary, baseV)) return { found: { plan: primary, values: baseV }, steps };
      // 1. another appropriate archetype
      for (const a of appropriate.slice(1)) {
        const plan = planFor(a);
        const v = baseValues(plan);
        if (tryValues(plan, v)) return { found: { plan, values: v }, steps: [`Tried another appropriate archetype: ${a.label}.`] };
      }
      if (appropriate.length > 1) steps.push(`Other appropriate archetypes (${appropriate.slice(1).map((a) => a.label).join(", ")}) were also too similar as composed.`);
      // 2 to 9. hero, typography, section order, layout, geometry, imagery, dialect, navigation
      // (cumulative), then the last resort axes together with all of them.
      const ladder: { unlocked: AxisKey[]; must: AxisKey }[] = [];
      REPAIR_ORDER.forEach((axis, i) => ladder.push({ unlocked: [...REPAIR_ORDER.slice(0, i + 1)], must: axis }));
      LAST_RESORT_AXES.forEach((axis, i) => ladder.push({ unlocked: [...REPAIR_ORDER, ...LAST_RESORT_AXES.slice(0, i + 1)], must: axis }));
      for (const step of ladder) {
        for (const a of appropriate) {
          if (checked > max) return null;
          const p = planFor(a);
          for (const v of stepCandidates(p, step.unlocked, step.must)) {
            if (checked > max) return null;
            if (!tryValues(p, v)) continue;
            if (p !== primary) steps.push(`Moved to the appropriate archetype ${p.archetype.label}.`);
            const changed = AXIS_KEYS.filter((k) => v[k] !== baseValues(p)[k]);
            for (const axis of REPAIR_ORDER) if (changed.includes(axis)) steps.push(REPAIR_LABELS[axis]);
            for (const axis of LAST_RESORT_AXES) if (changed.includes(axis)) steps.push(`Also changed the ${DIMENSION_LABELS[axis].toLowerCase()} (last resort, together with structural axes).`);
            return { found: { plan: p, values: v }, steps };
          }
        }
      }
      return null;
    };
    let result = search([...fastSet, ...own], [...fastAll, ...ownAll]);
    if (!result && own.length && current) {
      result = search([...fastSet, fast(current, 1, false)], [...fastAll, ...ownAll]);
      if (result) warnings.push(`No new combination differs from ${lead.business}'s previous Site DNA on six dimensions and from the recent sites; the closest valid alternative is used.`);
    }
    if (result) {
      chosen = result.found;
      repairs.push(...result.steps);
      if (options.explore && current) notes.push(`Explored another direction: ${result.found.plan.archetype.label} instead of ${getArchetype(profile, current.archetype)?.label || current.archetype}.`);
      else if (options.regenerate && current) notes.push("Regenerated: another valid combination, with the facts, industry and conversion kept.");
    } else {
      // Best effort: the primary base candidate, flagged invalid for a person to resolve.
      const primary = planFor(appropriate[0]);
      chosen = { plan: primary, values: baseValues(primary) };
      warnings.push(`No Site DNA inside the appropriate ${profile.label} archetypes differs enough from the recent sites (${checked} candidates checked); the best fit base is returned flagged invalid. Override it or add an archetype.`);
    }
  }

  const dna = assemble(chosen.plan, chosen.values, assembly);
  const record = finish(dna, chosen.plan.archetype.label, {
    repairs,
    checked,
    overridden,
    override: overridden && options.override ? { ...options.override, at: options.override.at || now } : null,
    notes,
  });
  if (overridden && !record.variation.valid) warnings.push(`The override is too similar to recent sites (variation score ${record.variation.score}); it is kept because a person chose it.`);
  return { ok: true, errors: [], warnings, record, reused: false };
}

// Convenience actions for the app and the CLI (v2 UI: Generate, Regenerate, Lock, Unlock,
// Explore another direction, overrides). Each is selectSiteDna with one intent.
export function regenerateSiteDna(lead: LeadRecord, engine: EngineData, options: Omit<SelectOptions, "regenerate" | "explore" | "override">): SelectResult {
  return selectSiteDna(lead, engine, { ...options, regenerate: true });
}

export function exploreAnotherDirection(lead: LeadRecord, engine: EngineData, options: Omit<SelectOptions, "regenerate" | "explore" | "override">): SelectResult {
  return selectSiteDna(lead, engine, { ...options, explore: true });
}

export function overrideSiteDna(lead: LeadRecord, engine: EngineData, override: DnaOverride, options: Omit<SelectOptions, "regenerate" | "explore" | "override">): SelectResult {
  return selectSiteDna(lead, engine, { ...options, override });
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
  windows: Windows;
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
  audit: SiteDnaRecord["audit"];
}

function finishRecord(i: FinishInput): SiteDnaRecord {
  const { summary } = summarize(i.dna, i.windows, i.pool.others, i.lookback, i.industryLookback, i.repairs, i.checked);
  // v2 lists variationScore and locked on the DNA itself; they mirror the record and are not
  // compared dimensions, so the fingerprint does not change.
  i.dna.variationScore = summary.score;
  i.dna.locked = i.locked;
  const archetype = getArchetype(i.profile, i.dna.archetype);
  const refs: ReferenceUse[] = selectReferences(i.engine.references || [], { industry: i.profile.id, archetype: i.dna.archetype, family: archetype?.family, dialect: i.dna.componentDialect, preferred: i.profile.references });
  const truth = buildTruthPlan(uniq([...i.dna.sectionOrder, ...i.dna.requiredModules]), i.facts, i.dna.trustSignals || []);
  const reasoning: string[] = [];
  reasoning.push(i.cls.reason);
  reasoning.push(i.traits.length ? `Brand traits from verified fields: ${i.traits.slice(0, 6).map(citeTrait).join(", ")}.` : "No brand traits could be inferred from verified fields; archetypes were ranked by conversion fit and the seed.");
  reasoning.push(i.conversion.reason);
  const top = i.scores.filter((s) => s.appropriate);
  const aside = i.scores.filter((s) => !s.appropriate);
  reasoning.push(`${i.scores[0].label} ranked first${i.scores[0].matchedTraits.length ? ` on trait fit (${i.scores[0].matchedTraits.join(", ")})` : ""}; appropriate: ${top.map((s) => `${s.label} ${s.score}${s.similarityPenalty ? ` (recent similarity penalty ${s.similarityPenalty})` : ""}`).join(", ") || "none"}${aside.length ? `; set aside: ${aside.map((s) => `${s.label} (${(s.notAppropriateBecause || s.excludedBy).join("; ")})`).join(", ")}` : ""}.`);
  reasoning.push(`${i.archetypeLabel} DNA: ${i.dna.hero} hero, ${i.dna.typography} type (${i.dna.fontPairing ? `${i.dna.fontPairing.display.family} with ${i.dna.fontPairing.body.family}` : "no pairing"}), ${i.dna.geometry} geometry, ${i.dna.imagery} imagery, ${i.dna.layoutRhythm} rhythm, ${i.dna.motion} motion, ${i.dna.componentDialect} dialect, ${i.dna.paletteFamily} palette. The seed ${i.dna.seed} only ordered options of equal fit.`);
  if (summary.comparedWith) {
    const closest = [...summary.comparisons].sort((a, b) => a.differenceCount - b.differenceCount)[0];
    const industryPart = summary.industryComparedWith ? `, ${summary.industryComparedWith} of them ${i.profile.label.toLowerCase()} sites held to ${summary.industryMinDiffering} differing dimensions` : "";
    reasoning.push(`Compared with ${summary.comparedWith} recent sites${industryPart}; the closest (${closest.business}) differs on ${closest.differenceCount} of 13 dimensions; variation score ${summary.score}${summary.valid ? "" : ", below the bar"}.`);
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
    audit: i.audit,
    createdAt: i.createdAt,
    updatedAt: i.now,
  };
}
