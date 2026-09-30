// Archetype selection (IMPLEMENTATION-BRIEF-v2.md, Selection engine): score every archetype of
// the industry on
//
//   industry suitability   the gate: excluded brand traits, a kinetic direction in a trust
//                          sensitive industry (unless explicitly permitted), weak trait fit and
//                          "explore another direction" exclusions make an archetype not
//                          appropriate, and no score can bring it back
//   verified brand traits  trait fit x 10, the dominant term
//   primary conversion     conversion fit x 2
//   business type          the sub-industry the archetype suits
//   available imagery      whether the direction's photography can actually be supplied
//   verified attributes    the record facts the direction relies on (booking link, rating, ...)
//   recent history         a bounded penalty for the archetypes the last few same industry
//                          sites used (at most SIMILARITY_PENALTY_CAP, below one unit of trait fit)
//   the seed               only to break exact ties
//
// Appropriate archetypes always rank above inappropriate ones, so recent similarity influences
// the choice among appropriate directions and never lets an inappropriate one win.
import type {
  ArchetypeScore,
  AttributeSignal,
  BusinessAttributes,
  ConversionObjective,
  IndustryArchetype,
  IndustryProfile,
  ImageryDemand,
  TraitSummary,
} from "./schema.ts";
import { seededIndex } from "./seed.ts";
import { traitWeights } from "./traits.ts";

export interface AvailableImagery {
  stockPhotos: number;     // licensed library photos that fit the business (captioned placeholders)
  ownerPhotos: number;     // the owner's own photos on record (none today; research never collects them)
}

// The recent sites the penalty reads: anything with an industry and an archetype.
export interface RecentSite {
  industry: string;
  archetype: string;
}

export interface ArchetypeContext {
  subIndustry?: string;
  attributes?: BusinessAttributes;
  imagery?: AvailableImagery;
  recentSameIndustry?: readonly RecentSite[];   // oldest first, the most recent last
  recentGlobal?: readonly RecentSite[];         // oldest first
  allowHighMotion?: boolean;                    // explicit permission for kinetic directions
  exclude?: readonly string[];                  // archetype ids ruled out (explore another direction)
}

export const SIMILARITY_PENALTY_CAP = 8;
export const SAME_INDUSTRY_PENALTY_STEPS: readonly number[] = [4, 3, 2, 1];   // most recent first
export const CROSS_INDUSTRY_PENALTY = 1;

// Industries where clarity, legitimacy and evidence beat novelty (health, law, finance). A
// profile can also set trustSensitive itself (roofing does, for home access).
export const TRUST_SENSITIVE_INDUSTRIES: readonly string[] = ["medical", "dental", "law", "finance", "accounting", "insurance"];

export function isTrustSensitive(profile: IndustryProfile): boolean {
  return profile.trustSensitive === true || TRUST_SENSITIVE_INDUSTRIES.includes(profile.id);
}

// A kinetic, high motion direction: a kinetic dialect or family, or only kinetic and cinematic
// motion options.
export function isHighMotionArchetype(a: IndustryArchetype): boolean {
  const kineticDialect = a.componentDialects.some((d) => d === "kinetic" || d.startsWith("kinetic-") || d.endsWith("-kinetic"));
  const onlyHigh = a.motion.length > 0 && a.motion.every((m) => m === "kinetic" || m === "cinematic");
  return kineticDialect || a.family === "kinetic" || onlyHigh;
}

// Heroes that work with type alone, when no photograph can be supplied.
const TYPE_CAPABLE_HEROES: readonly string[] = ["type-led", "utility", "centered", "minimal-copy", "conversion-form", "search-first", "product-demo"];

export function imageryDemandOf(a: IndustryArchetype): ImageryDemand {
  if (a.imageryDemand) return a.imageryDemand;
  if (!a.heroes.some((h) => TYPE_CAPABLE_HEROES.includes(h))) return "high";
  if (a.imagery.some((i) => i === "technical" || i === "product-ui" || i === "cutout")) return "low";
  return "medium";
}

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

export function ctaMatchesConversion(style: string, conversion: string): boolean {
  const re = CONVERSION_WORDS[conversion];
  return re ? re.test(style) : style.includes(conversion);
}

function hasAttribute(attrs: BusinessAttributes, signal: AttributeSignal): boolean {
  switch (signal) {
    case "phone":
      return attrs.hasPhone;
    case "address":
      return attrs.hasAddress;
    case "hours":
      return attrs.hasHours;
    case "booking-link":
      return attrs.hasBookingLink;
    case "rating":
      return attrs.rating !== null;
    case "reviews":
      return attrs.reviews !== null && attrs.reviews > 0;
    case "sourced-services":
      return attrs.sourcedServices > 0;
    case "established-year":
      return attrs.establishedYear !== null;
    case "bilingual":
      return attrs.bilingual;
  }
}

function imageryFit(a: IndustryArchetype, imagery: AvailableImagery | undefined): { fit: number; reason: string } {
  if (!imagery) return { fit: 0, reason: "" };
  const demand = imageryDemandOf(a);
  const total = imagery.stockPhotos + imagery.ownerPhotos;
  if (demand === "high") {
    if (total === 0) return { fit: -6, reason: "photography led, and no photos fit this business" };
    if (imagery.ownerPhotos >= 3) return { fit: 3, reason: "photography led, and the owner's photos are on record" };
    if (total < 3) return { fit: -2, reason: `photography led, with only ${total} fitting photo${total === 1 ? "" : "s"}` };
    return { fit: 0, reason: "" };
  }
  if (demand === "medium") return total === 0 ? { fit: -2, reason: "needs some photography, and none fits" } : { fit: 0, reason: "" };
  return total === 0 ? { fit: 1, reason: "works with type alone, and no photos fit" } : { fit: 0, reason: "" };
}

function similarityPenalty(a: IndustryArchetype, ctx: ArchetypeContext): number {
  let penalty = 0;
  const same = [...(ctx.recentSameIndustry || [])].reverse();
  same.forEach((s, i) => {
    if (s.archetype === a.id) penalty += SAME_INDUSTRY_PENALTY_STEPS[i] ?? 1;
  });
  const sameSet = new Set(ctx.recentSameIndustry || []);
  for (const s of ctx.recentGlobal || []) {
    if (!sameSet.has(s) && s.archetype === a.id) penalty += CROSS_INDUSTRY_PENALTY;
  }
  return Math.min(SIMILARITY_PENALTY_CAP, penalty);
}

export function scoreArchetypes(profile: IndustryProfile, traits: readonly TraitSummary[], conversion: ConversionObjective, seed: string, ctx: ArchetypeContext = {}): ArchetypeScore[] {
  const weights = traitWeights(traits);
  const trustSensitive = isTrustSensitive(profile);
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
    const reasons: string[] = [];
    let businessTypeFit = 0;
    if (a.suitableSubIndustries && a.suitableSubIndustries.length && ctx.subIndustry) {
      businessTypeFit = a.suitableSubIndustries.includes(ctx.subIndustry) ? 6 : -2;
      reasons.push(businessTypeFit > 0 ? `suits the ${ctx.subIndustry} business type` : `is written for ${a.suitableSubIndustries.join(", ")}, not ${ctx.subIndustry}`);
    }
    const img = imageryFit(a, ctx.imagery);
    if (img.reason) reasons.push(img.reason);
    let characteristicsFit = 0;
    if (ctx.attributes && a.prefersAttributes) {
      const met = a.prefersAttributes.filter((s) => hasAttribute(ctx.attributes as BusinessAttributes, s));
      characteristicsFit = met.length * 2;
      if (met.length) reasons.push(`the record has ${met.join(", ")}`);
    }
    const penalty = similarityPenalty(a, ctx);
    if (penalty) reasons.push(`recent similarity penalty ${penalty}`);
    const excludedBy = (a.excludedBrandTraits || []).filter((t) => weights.has(t));
    const gate: string[] = [];
    if (excludedBy.length) gate.push(`excluded by ${excludedBy.join(", ")}`);
    if (trustSensitive && isHighMotionArchetype(a) && !a.permitsHighMotion && !ctx.allowHighMotion) gate.push(`a high motion kinetic direction in the trust sensitive ${profile.label} industry`);
    if ((ctx.exclude || []).includes(a.id)) gate.push("ruled out to explore another direction");
    return { a, traitFit, conversionFit, businessTypeFit, imageryFit: img.fit, characteristicsFit, penalty, matchedTraits, excludedBy, gate, reasons };
  });
  const eligible = raw.filter((r) => !r.gate.length);
  const best = Math.max(0, ...eligible.map((r) => r.traitFit));
  return raw
    .map((r) => {
      const weak = !r.gate.length && best > 0 && r.traitFit * 2 < best;
      const notAppropriateBecause = weak ? [...r.gate, `trait fit ${r.traitFit} is under half the best fit ${best}`] : r.gate;
      return {
        id: r.a.id,
        label: r.a.label,
        score: r.traitFit * 10 + r.conversionFit * 2 + r.businessTypeFit + r.imageryFit + r.characteristicsFit - r.penalty,
        traitFit: r.traitFit,
        conversionFit: r.conversionFit,
        matchedTraits: r.matchedTraits,
        excludedBy: r.excludedBy,
        appropriate: notAppropriateBecause.length === 0,
        businessTypeFit: r.businessTypeFit,
        imageryFit: r.imageryFit,
        characteristicsFit: r.characteristicsFit,
        similarityPenalty: r.penalty,
        notAppropriateBecause,
        reasons: r.reasons,
        tie: seededIndex(seed, `archetype:${r.a.id}`, 1000003),
      };
    })
    .sort((x, y) => Number(y.appropriate) - Number(x.appropriate) || y.score - x.score || y.traitFit - x.traitFit || x.tie - y.tie)
    .map(({ tie: _tie, ...s }) => s);
}

// The best appropriate archetype and the full ranking, for the app and for tests. `best` is
// null when no archetype is appropriate (every one excluded), which the pipeline reports.
export function selectArchetype(profile: IndustryProfile, traits: readonly TraitSummary[], conversion: ConversionObjective, seed: string, ctx: ArchetypeContext = {}): { best: ArchetypeScore | null; ranking: ArchetypeScore[] } {
  const ranking = scoreArchetypes(profile, traits, conversion, seed, ctx);
  return { best: ranking.find((s) => s.appropriate) || null, ranking };
}
