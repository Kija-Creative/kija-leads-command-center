// Site DNA schema. The types below were supplied by Jamey on 2026-09-29 and are the contract
// for the Design Intelligence Engine. Extend them by adding new types or optional fields; do not
// rename or narrow the ones given.
//
// This file runs directly under Node 24 (type stripping) and is checked with `npm run typecheck`.

export type HeroStyle =
  | "full-bleed"
  | "editorial-split"
  | "centered"
  | "search-first"
  | "cinematic"
  | "asymmetric"
  | "product-demo"
  | "utility"
  | "type-led"
  | "gallery"
  // v2 additions (IMPLEMENTATION-BRIEF-v2.md)
  | "project-led"
  | "image-left"
  | "image-right"
  | "layered"
  | "minimal-copy"
  | "conversion-form"
  | "split-screen";

export type NavigationStyle =
  | "transparent-overlay"
  | "solid"
  | "two-tier"
  | "utility-bar"
  | "minimal"
  | "editorial"
  | "mega-menu"
  // v2 additions
  | "sidebar"
  | "floating"
  | "centered-brand"
  | "conversion-heavy";

export type TypographyStyle =
  | "serif-sans"
  | "sans-only"
  | "condensed-sans"
  | "editorial-serif"
  | "humanist-sans"
  | "grotesk"
  | "geometric"
  | "mono-accent"
  // v2 additions
  | "high-contrast-serif"
  | "industrial-condensed"
  | "neo-grotesk"
  | "warm-serif";

export type LayoutRhythm =
  | "editorial"
  | "dense-grid"
  | "wide-cinematic"
  | "alternating"
  | "modular"
  | "asymmetric"
  | "gallery"
  | "technical"
  | "narrative"
  // v2 additions
  | "conversion-heavy"
  | "catalog"
  | "magazine"
  | "portfolio"
  | "documentary";

export type GeometryStyle =
  | "square"
  | "subtle-radius"
  | "rounded"
  | "pill"
  | "mixed"
  | "architectural"
  // v2 additions
  | "hard-edge"
  | "organic"
  | "editorial";

export type ImageryStyle =
  | "full-bleed"
  | "documentary"
  | "project-gallery"
  | "product-ui"
  | "portfolio"
  | "cutout"
  | "technical"
  | "editorial"
  | "lifestyle"
  | "macro-detail"
  | "collage"
  // v2 additions
  | "before-after"
  | "people-first"
  | "environment-first"
  | "material-detail";

export type MotionStyle =
  | "none"
  | "subtle"
  | "moderate"
  | "kinetic"
  | "cinematic";

export interface SiteDNA {
  version: 1;

  leadId: string;
  businessName: string;

  industry: string;
  subIndustry?: string;

  archetype: string;
  brandTraits: string[];
  primaryConversion: string;

  hero: HeroStyle;
  navigation: NavigationStyle;
  typography: TypographyStyle;

  paletteFamily: string;
  layoutRhythm: LayoutRhythm;
  geometry: GeometryStyle;
  imagery: ImageryStyle;
  motion: MotionStyle;

  sectionOrder: string[];

  ctaStyle: string;
  proofStyle: string;
  componentDialect: string;

  requiredModules: string[];
  forbiddenPatterns: string[];

  referencesUsed: string[];

  seed: string;
  createdAt: string;
}

export interface IndustryArchetype {
  id: string;
  label: string;

  suitableBrandTraits: string[];

  heroes: HeroStyle[];
  navigation: NavigationStyle[];
  typography: TypographyStyle[];
  layoutRhythms: LayoutRhythm[];
  geometries: GeometryStyle[];
  imagery: ImageryStyle[];
  motion: MotionStyle[];

  paletteFamilies: string[];
  ctaStyles: string[];
  proofStyles: string[];
  componentDialects: string[];

  sectionOrders: string[][];

  requiredModules: string[];
  forbiddenPatterns: string[];
}

export interface IndustryProfile {
  id: string;
  label: string;

  primaryConversions: string[];

  requiredModules: string[];
  defaultForbiddenPatterns: string[];

  archetypes: IndustryArchetype[];
}

// ---------------------------------------------------------------------------------------------
// Extensions (engine architect, 2026-09-29). Everything above is Jamey's contract, unchanged.
// Everything below adds vocabularies, optional fields and the per-site record. Vocabularies are
// runtime arrays so loaders can validate data written by other authors with readable sentences.
// ---------------------------------------------------------------------------------------------

// Runtime lists of the axis vocabularies above, in the order the brief names them.
export const HERO_STYLES = [
  "full-bleed",
  "editorial-split",
  "centered",
  "search-first",
  "cinematic",
  "asymmetric",
  "product-demo",
  "utility",
  "type-led",
  "gallery",
  "project-led",
  "image-left",
  "image-right",
  "layered",
  "minimal-copy",
  "conversion-form",
  "split-screen",
] as const satisfies readonly HeroStyle[];

export const NAVIGATION_STYLES = [
  "transparent-overlay",
  "solid",
  "two-tier",
  "utility-bar",
  "minimal",
  "editorial",
  "mega-menu",
  "sidebar",
  "floating",
  "centered-brand",
  "conversion-heavy",
] as const satisfies readonly NavigationStyle[];

export const TYPOGRAPHY_STYLES = [
  "serif-sans",
  "sans-only",
  "condensed-sans",
  "editorial-serif",
  "humanist-sans",
  "grotesk",
  "geometric",
  "mono-accent",
  "high-contrast-serif",
  "industrial-condensed",
  "neo-grotesk",
  "warm-serif",
] as const satisfies readonly TypographyStyle[];

export const LAYOUT_RHYTHMS = [
  "editorial",
  "dense-grid",
  "wide-cinematic",
  "alternating",
  "modular",
  "asymmetric",
  "gallery",
  "technical",
  "narrative",
  "conversion-heavy",
  "catalog",
  "magazine",
  "portfolio",
  "documentary",
] as const satisfies readonly LayoutRhythm[];

export const GEOMETRY_STYLES = [
  "square",
  "subtle-radius",
  "rounded",
  "pill",
  "mixed",
  "architectural",
  "hard-edge",
  "organic",
  "editorial",
] as const satisfies readonly GeometryStyle[];

export const IMAGERY_STYLES = [
  "full-bleed",
  "documentary",
  "project-gallery",
  "product-ui",
  "portfolio",
  "cutout",
  "technical",
  "editorial",
  "lifestyle",
  "macro-detail",
  "collage",
  "before-after",
  "people-first",
  "environment-first",
  "material-detail",
] as const satisfies readonly ImageryStyle[];

export const MOTION_STYLES = [
  "none",
  "subtle",
  "moderate",
  "kinetic",
  "cinematic",
] as const satisfies readonly MotionStyle[];

// Compile time proof that each runtime list covers its union: a missing value makes the
// matching tuple slot `never`, and the constant below stops typechecking.
type Covers<Union, List extends readonly unknown[]> = [Exclude<Union, List[number]>] extends [never] ? true : never;
export type VocabularyCoverage = [
  Covers<HeroStyle, typeof HERO_STYLES>,
  Covers<NavigationStyle, typeof NAVIGATION_STYLES>,
  Covers<TypographyStyle, typeof TYPOGRAPHY_STYLES>,
  Covers<LayoutRhythm, typeof LAYOUT_RHYTHMS>,
  Covers<GeometryStyle, typeof GEOMETRY_STYLES>,
  Covers<ImageryStyle, typeof IMAGERY_STYLES>,
  Covers<MotionStyle, typeof MOTION_STYLES>,
];
export const VOCABULARY_COVERAGE: VocabularyCoverage = [true, true, true, true, true, true, true];

// Brand traits. Inferred only from verified lead data (see traits.ts). "family-owned",
// "established" and "heritage" are claims about the business, so traits.ts infers them only
// from a sourced field (a review theme that says so, or a sourced established year).
export const BRAND_TRAITS = [
  "established",
  "heritage",
  "practical",
  "reliable",
  "commercial",
  "direct",
  "premium",
  "craftsmanship",
  "residential",
  "architectural",
  "high-end",
  "local",
  "energetic",
  "hardworking",
  "family-owned",
  "straightforward",
  "bilingual",
  "community",
  "urgent-need",
  "fast",
  "value",
  "trusted",
  "highly-rated",
  "popular",
  "emerging",
  "warm",
  "approachable",
  "personal",
  "calm",
  "precise",
  "clinical",
  "specialist",
  "modern",
  "bold",
  "editorial",
  "expressive",
  "playful",
  "luxury",
  "boutique",
  "minimal",
  "organic",
  "performance",
  "technical",
  "innovative",
  "institutional",
  "documentary",
  "grassroots",
  "cinematic",
  "artistic",
  "detail-oriented",
  "old-school",
  "visual",
  // v2 trait names
  "traditional",
  "community-oriented",
  "high-energy",
  "industrial",
  "youthful",
  "creative",
  "working-class",
] as const;

export type BrandTrait = (typeof BRAND_TRAITS)[number];

// Every section or embedded module any industry may require. The renderer keeps a module
// registry keyed by these; the audit finds them through data-module markers.
export const MODULE_KEYS = [
  // shared structure and conversion
  "hero",
  "phone-cta",
  "estimate-form",
  "estimate",
  "quote",
  "emergency",
  "emergency-or-estimate",
  "contact",
  "faq",
  "process",
  "services",
  "service-area",
  "locations",
  "hours",
  "availability",
  "reviews",
  "ratings",
  "trust-strip",
  "why-us",
  "about",
  "story",
  "team",
  "gallery",
  "pricing",
  "booking",
  "appointment",
  "consultation",
  // home services, roofing and construction
  "project-proof",
  "projects",
  "selected-projects",
  "project-gallery",
  "before-after",
  "craftsmanship",
  "materials",
  "credentials",
  "warranty",
  "financing",
  "crew",
  "brand-position",
  "testimonial-story",
  // law
  "practice-areas",
  "attorneys",
  "experience",
  "case-studies",
  // medical and dental
  "providers",
  "conditions",
  "insurance",
  "patient-info",
  "patient-comfort",
  "first-visit",
  // real estate
  "property-search",
  "featured-properties",
  "neighborhoods",
  "agent",
  "valuation",
  "tour",
  // restaurant
  "menu",
  "reservation",
  "order",
  "food-gallery",
  // hospitality
  "rooms",
  "experiences",
  "amenities",
  // beauty, barber, tattoo, grooming
  "treatments",
  "results",
  "portfolio",
  // fitness and wellness
  "intro-offer",
  "classes",
  "methodology",
  "schedule",
  "instructors",
  "memberships",
  // saas and technology
  "product-demo",
  "use-cases",
  "integrations",
  "signup",
  "client-logos",
  // ecommerce
  "product-discovery",
  "product-detail",
  "merchandising",
  "cart",
  "checkout",
  // nonprofit
  "mission",
  "impact",
  "programs",
  "stories",
  "volunteer",
  "donate",
  "transparency",
  // architecture, interiors, photography and creative
  "work",
  "philosophy",
  "studio",
  // industrial and manufacturing
  "capabilities",
  "industries-served",
  "equipment",
  "certifications",
  "rfq",
  // education and finance
  "admissions",
  "events",
  "disclosures",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

// Conversions an industry may list in primaryConversions. CTAs carry data-cta="<key>".
export const CONVERSION_KEYS = [
  "call",
  "request-estimate",
  "inspection",
  "quote",
  "book",
  "appointment",
  "consultation",
  "reserve",
  "order",
  "check-availability",
  "tour",
  "valuation",
  "search",
  "intro-offer",
  "membership",
  "demo",
  "signup",
  "purchase",
  "donate",
  "volunteer",
  "rfq",
  "enroll",
  "visit",
  "contact",
] as const;

export type ConversionKey = (typeof CONVERSION_KEYS)[number];

// The thirteen dimensions compareSiteDNA reads (twelve scalar axes plus sectionOrder).
export const DNA_DIMENSIONS = [
  "archetype",
  "hero",
  "navigation",
  "typography",
  "paletteFamily",
  "layoutRhythm",
  "geometry",
  "imagery",
  "motion",
  "ctaStyle",
  "proofStyle",
  "componentDialect",
  "sectionOrder",
] as const;

export type DnaDimension = (typeof DNA_DIMENSIONS)[number];

// The axes chosen inside an archetype, each with the archetype list it comes from.
export const DNA_AXES = [
  { axis: "hero", list: "heroes" },
  { axis: "navigation", list: "navigation" },
  { axis: "typography", list: "typography" },
  { axis: "layoutRhythm", list: "layoutRhythms" },
  { axis: "geometry", list: "geometries" },
  { axis: "imagery", list: "imagery" },
  { axis: "motion", list: "motion" },
  { axis: "paletteFamily", list: "paletteFamilies" },
  { axis: "ctaStyle", list: "ctaStyles" },
  { axis: "proofStyle", list: "proofStyles" },
  { axis: "componentDialect", list: "componentDialects" },
  { axis: "sectionOrder", list: "sectionOrders" },
] as const;

export type DnaAxis = (typeof DNA_AXES)[number]["axis"];

// ---------------------------------------------------------------------------------------------
// Tokens that make a DNA reproducible: the concrete font pairing and palette tokens.
// ---------------------------------------------------------------------------------------------

export interface FontFace {
  family: string;          // exact Google Fonts family name
  weights: number[];
  italic?: boolean;
  fallback: string;        // CSS fallback stack
  classification: string;  // plain words for the brief, e.g. "condensed grotesk"
}

export interface FontPairing {
  id: string;
  typography: TypographyStyle;
  display: FontFace;
  body: FontFace;
  accent?: FontFace;       // mono accent, when the classification calls for one
  note: string;            // what the pairing is for, one sentence
}

// Token names match the demo direction tokens (src/demo/directions/README.md).
export interface PaletteTokens {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  primary: string;
  "on-primary": string;
  accent: string;
}

export interface PaletteDefinition {
  label: string;
  tone: "light" | "dark";
  tokens: PaletteTokens;
  traits?: string[];        // BrandTrait values this palette suits; orders options, never excludes
  note?: string;
}

export interface ResolvedPalette extends PaletteDefinition {
  family: string;
}

// ---------------------------------------------------------------------------------------------
// Optional extension fields for the supplied interfaces. Interface merging leaves the
// originals above untouched; every added field is optional, so roofing.ts as supplied is valid.
// ---------------------------------------------------------------------------------------------

export interface SiteDNA {
  subIndustryLabel?: string;
  variationScore?: number;   // v2 lists it on the DNA; mirrors record.variation.score
  locked?: boolean;          // v2 lists it on the DNA; mirrors record.locked
  schemaType?: string;       // most specific schema.org type
  secondaryConversion?: string;
  fontPairing?: FontPairing;
  palette?: ResolvedPalette;
  fingerprint?: string;      // dnaFingerprint(dna), see variation.ts
}

export interface IndustryArchetype {
  family?: string;                // base family id: design-intelligence/archetypes/<id>.json
  description?: string;           // one or two sentences on what this direction is
  excludedBrandTraits?: string[]; // a lead with any of these traits may not receive this archetype
  primaryConversions?: string[];  // conversions this archetype leads with, best first
  fontPairings?: string[];        // FontPairing ids this archetype prefers
  imageryNotes?: string;          // what the photography must show for this direction
}

export interface SubIndustryInfo {
  label: string;
  schemaOrgType?: string;
}

export interface IndustryProfile {
  description?: string;
  subIndustries?: Record<string, SubIndustryInfo>;
  schemaOrgType?: string;                      // most specific schema.org type for the industry
  conversionLogic?: string;                    // how customers choose this kind of business
  imageryNotes?: string;                       // what imagery must show
  proofNotes?: string;                         // what counts as proof, and what may never be claimed
  trustSensitive?: boolean;                    // health, law, finance, home access: clarity first
  motionCeiling?: MotionStyle;                 // most motion any archetype of this industry may use
  palettes?: Record<string, PaletteDefinition>; // tokens for every paletteFamily the archetypes name
  styleNotes?: Record<string, string>;         // meaning of this industry's ctaStyle and proofStyle ids
  moduleJobs?: Record<string, string>;         // industry wording of a module's job
  references?: string[];                       // preferred reference ids
  preferredTrustSignals?: string[];            // v2: the trust signals this industry leans on (sourced or placeholder)
}

// ---------------------------------------------------------------------------------------------
// Inputs: the lead shape the engine reads (a structural subset of the SPEC.md Lead) and a
// category entry from config/categories.json.
// ---------------------------------------------------------------------------------------------

export interface LeadSource {
  url: string;
  label?: string;
  checkedAt?: string;
}

export interface LeadRecord {
  id: string;
  business: string;
  category?: string;
  categoryKey?: string;
  city?: string;
  area?: string;
  state?: string;
  metro?: string;
  address?: string;
  phone?: string;
  googleRating?: number | null;
  googleReviews?: number | null;
  ratingSource?: string;
  website?: string;
  domain?: string;
  presence?: { facebook?: string; instagram?: string; yelp?: string; booking?: string; other?: unknown[] };
  whyKija?: string;
  pitchAngle?: string;
  demoConcept?: string;
  services?: string[];
  reviewThemes?: string[];
  languages?: string[];
  established?: number | null;
  hours?: string;
  sources?: LeadSource[];
  demo?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CategoryConfig {
  label: string;
  vertical?: string;
  industry?: string;
  subIndustry?: string;
  serviceDefaults?: string[];
  [key: string]: unknown;
}

export type CategoryRegistry = Record<string, CategoryConfig>;

// ---------------------------------------------------------------------------------------------
// Pipeline results
// ---------------------------------------------------------------------------------------------

export interface Classification {
  ok: boolean;
  errors: string[];
  warnings: string[];
  industry: string;
  subIndustry: string;
  categoryKey: string;
  reason: string;
}

export interface BusinessAttributes {
  hasPhone: boolean;
  hasAddress: boolean;
  hasHours: boolean;
  sourcedServices: number;
  bilingual: boolean;
  rating: number | null;
  reviews: number | null;
  hasBookingLink: boolean;
  establishedYear: number | null;
  city: string;
  metro: string;
}

export interface TraitEvidence {
  trait: BrandTrait;
  field: string;      // the lead field that produced it, e.g. "demoConcept"
  evidence: string;   // the exact word or value, e.g. "premium" or "4.9 from 212 reviews"
  weight: number;
}

export interface TraitSummary {
  trait: BrandTrait;
  weight: number;
  evidence: TraitEvidence[];
}

export interface ConversionObjective {
  primary: string;
  secondary: string;
  reason: string;
}

export interface ArchetypeScore {
  id: string;
  label: string;
  score: number;
  traitFit: number;
  conversionFit: number;
  matchedTraits: string[];
  excludedBy: string[];
  appropriate: boolean;
}

export interface ComparisonSummary {
  leadId: string;
  business: string;
  industry: string;
  archetype: string;
  valid: boolean;
  differenceCount: number;
  differenceRatio: number;
  matchingDimensions: string[];
  differingDimensions: string[];
  cloneSignatureConflict: boolean;
  duplicate: boolean;
}

export interface VariationSummary {
  score: number;                 // variationScore: minimum differenceRatio across the comparisons
  valid: boolean;
  comparedWith: number;
  lookback: number;
  industryLookback: number;
  duplicateOf: string | null;
  comparisons: ComparisonSummary[];
  repairs: string[];             // repair steps applied, in the brief's order
  candidatesChecked: number;
}

export type TruthStatus = "structural" | "sourced" | "to-confirm" | "placeholder" | "stock-placeholder";

export interface FactEntry {
  field: string;
  label: string;
  value: string;
}

export interface ModuleTruth {
  module: string;
  status: TruthStatus;
  note: string;
}

export interface TruthPlan {
  facts: FactEntry[];
  sources: LeadSource[];
  modules: ModuleTruth[];
  placeholders: string[];        // modules that must carry data-placeholder="owner-to-confirm"
  neverClaim: string[];
}

export interface BusinessFacts {
  business: string;
  category: string;
  categoryKey: string;
  city: string;
  area: string;
  state: string;
  metro: string;
  address: string;
  phone: string;
  googleRating: number | null;
  googleReviews: number | null;
  ratingSource: string;
  services: string[];
  servicesFromDefaults: boolean;
  reviewThemes: string[];
  languages: string[];
  established: number | null;
  hours: string;
  sources: LeadSource[];
}

export interface ReferenceUse {
  id: string;
  title: string;
  source: string;
  path: string;
  takeaways: string[];
}

export type AuditCheckId =
  | "similarity"
  | "required-modules"
  | "forbidden-patterns"
  | "cta-architecture"
  | "dna-fidelity"
  | "fabricated-trust"
  | "guardrails"
  | "responsive"
  | "accessibility"
  | "component-library-look";

export interface AuditFlag {
  check: AuditCheckId;
  severity: "error" | "warning";
  message: string;
}

export interface AuditResult {
  pass: boolean;
  failures: string[];            // error flags as sentences (v2: pass, warnings, failures)
  warnings: string[];
  similarityIssues: string[];
  requiredFixes: string[];       // one fix per failure, in check order
  score: number;                 // 0 to 100: 100 minus 15 per error and 5 per warning
  flags: AuditFlag[];
  checks: { id: AuditCheckId; pass: boolean; errors: number; warnings: number }[];
  checkedAt: string;
  fingerprint: string;
}

export interface DnaOverrideFields {
  industry?: string;
  archetype?: string;
  hero?: HeroStyle;
  navigation?: NavigationStyle;
  typography?: TypographyStyle;
  paletteFamily?: string;
  layoutRhythm?: LayoutRhythm;
  geometry?: GeometryStyle;
  imagery?: ImageryStyle;
  motion?: MotionStyle;
  sectionOrder?: string[];
  ctaStyle?: string;
  proofStyle?: string;
  componentDialect?: string;
  primaryConversion?: string;
  fontPairing?: string;              // a FontPairing id for the chosen typography
  addForbiddenPatterns?: string[];   // overrides may add forbidden patterns, never remove them
  addRequiredModules?: string[];     // overrides may add required modules, never remove them
}

export interface DnaOverride {
  by: string;
  at?: string;
  fields: DnaOverrideFields;
}

// The per-site SITE_DNA.json, written to demos/<id>/SITE_DNA.json. Its snapshot lives on
// lead.demo.dna in data/leads.json (LeadDnaSnapshot).
export interface SiteDnaRecord {
  version: 1;
  leadId: string;
  business: string;
  industryLabel: string;
  archetypeLabel: string;
  dna: SiteDNA;
  fingerprint: string;
  classification: Classification;
  attributes: BusinessAttributes;
  brandTraits: TraitSummary[];
  conversion: ConversionObjective;
  archetypeScores: ArchetypeScore[];
  variation: VariationSummary;
  reasoningSummary: string[];
  referencesUsed: ReferenceUse[];
  truth: TruthPlan;
  facts: BusinessFacts;
  locked: boolean;
  lockedBy: string;
  lockedAt: string;
  overridden: boolean;
  override: DnaOverride | null;
  audit: AuditResult | null;
  createdAt: string;
  updatedAt: string;
}

// lead.demo.dna: enough to reproduce the site and honour a lock even when the gitignored
// demos/ folder is gone.
export interface LeadDnaSnapshot {
  file: string;                  // "demos/<id>/SITE_DNA.json"
  fingerprint: string;
  industry: string;
  archetype: string;
  variationScore: number;
  variationValid: boolean;
  locked: boolean;
  lockedBy: string;
  lockedAt: string;
  overridden: boolean;
  auditPass: boolean | null;
  auditScore: number | null;
  updatedAt: string;
  dna: SiteDNA;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}
