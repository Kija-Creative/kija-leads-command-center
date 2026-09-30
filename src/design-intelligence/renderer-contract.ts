// The renderer contract: what a site renderer must implement so every page is built from its
// Site DNA and the audit can verify it. The renderer lives outside the engine (src/demo); these
// types and helpers are the agreement between them.
//
//   renderSite(record, lead, ctx) -> html
//
// - The root element carries dnaAttributes(record.dna); :root CSS starts with dnaRootCss(dna).
// - Sections render in record.dna.sectionOrder, each through the ModuleRegistry entry for its
//   key, wrapped as <section moduleAttributes([key, ...embedded], index)>.
// - Required modules that are not sections are embedded where modulePlan puts them, each marked
//   moduleAttributes(key) (no index). phone-cta goes in the header and the mobile call bar.
// - Every axis value has an implementation (AxisImplementations), so no DNA can fall back to a
//   shared default look. coverageErrors() lists what a renderer is missing.
// - Modules whose truth status is "placeholder" render through primitives.placeholder (or carry
//   data-placeholder="owner-to-confirm"), headed with pageLabel(key).
// - Every conversion control carries ctaAttribute(conversion); the primary conversion appears in
//   the hero and again in the closing section.
import type {
  CategoryRegistry,
  GeometryStyle,
  HeroStyle,
  ImageryStyle,
  IndustryArchetype,
  IndustryProfile,
  LayoutRhythm,
  LeadRecord,
  ModuleKey,
  ModuleTruth,
  MotionStyle,
  NavigationStyle,
  SiteDNA,
  SiteDnaRecord,
  TypographyStyle,
} from "./schema.ts";
import type { DialectPrimitives, PrimitiveTheme, ResolvedDialect } from "./component-dialects.ts";
import { GEOMETRY_TOKENS, MOTION_RULES } from "./design-tokens.ts";
import type { StockAsset } from "./prompt-builder.ts";
import { isModuleKey } from "./modules.ts";

export interface RenderContext {
  now: string;                      // injected render time, ISO
  categories: CategoryRegistry;
  profile: IndustryProfile;
  archetype: IndustryArchetype;
  dialect: ResolvedDialect | null;
  primitives: DialectPrimitives | null;
  theme: PrimitiveTheme;
  assets: StockAsset[];             // library photos allowed for this lead, with captions
  plan: ModulePlan;
  [extra: string]: unknown;         // renderer specific helpers (i18n, photo set, forms)
}

export interface ModuleRenderInput {
  key: ModuleKey;
  index: number | null;             // position in sectionOrder, null when embedded
  embedded: ModuleKey[];            // modules the plan puts inside this section
  truth: ModuleTruth;
  record: SiteDnaRecord;
  lead: LeadRecord;
  ctx: RenderContext;
}

export type ModuleRenderer = (input: ModuleRenderInput) => string;

// One renderer per module key. Partial: coverageErrors reports keys a DNA needs but lacks.
export type ModuleRegistry = Partial<Record<ModuleKey, ModuleRenderer>>;

export interface AxisPart {
  css(theme: PrimitiveTheme): string;
}

export interface HeroPart extends AxisPart {
  render(input: ModuleRenderInput): string;
}

export interface NavigationPart extends AxisPart {
  render(input: { record: SiteDnaRecord; lead: LeadRecord; ctx: RenderContext }): string;
}

// Every value of every vocabulary has an implementation: a new vocabulary value is a compile
// error in the renderer until it is implemented.
export interface AxisImplementations {
  hero: Record<HeroStyle, HeroPart>;
  navigation: Record<NavigationStyle, NavigationPart>;
  typography: Record<TypographyStyle, AxisPart>;   // type scale, weights, tracking
  layoutRhythm: Record<LayoutRhythm, AxisPart>;    // section widths, spacing, grid
  geometry: Record<GeometryStyle, AxisPart>;       // borders, rules, radius use (tokens from GEOMETRY_TOKENS)
  imagery: Record<ImageryStyle, AxisPart>;         // crops, frames, captions, fallbacks
  motion: Record<MotionStyle, AxisPart>;           // within MOTION_RULES, reduced motion included
}

export type RenderSite = (record: SiteDnaRecord, lead: LeadRecord, ctx: RenderContext) => string;

// The theme every primitive and axis part receives.
export function themeFor(dna: SiteDNA): PrimitiveTheme {
  if (!dna.palette || !dna.fontPairing) throw new Error(`The Site DNA for ${dna.businessName} has no resolved palette or font pairing; select it again with the engine.`);
  return { dna, palette: dna.palette, fonts: dna.fontPairing, geometry: GEOMETRY_TOKENS[dna.geometry], motion: MOTION_RULES[dna.motion] };
}

export interface ModulePlan {
  header: ModuleKey[];                                   // embedded in the header (phone-cta)
  sections: { key: ModuleKey; index: number; embedded: ModuleKey[] }[];
}

const CLOSERS = ["estimate", "consultation", "emergency-or-estimate", "booking", "appointment", "reservation", "quote", "rfq", "contact", "signup", "donate", "valuation", "tour"];
const PROOF_HOSTS = ["ratings", "trust-strip", "testimonial-story", "why-us"];
const WORK_HOSTS = ["selected-projects", "projects", "project-gallery", "project-proof", "before-after", "gallery", "portfolio", "work", "food-gallery", "results"];

// Where each required module that is not a section is rendered. Deterministic, so the renderer,
// the brief and the audit agree.
export function modulePlan(dna: SiteDNA): ModulePlan {
  const order = dna.sectionOrder.filter(isModuleKey);
  const sections = order.map((key, index) => ({ key, index, embedded: [] as ModuleKey[] }));
  const header: ModuleKey[] = [];
  const find = (keys: readonly string[]) => sections.find((s) => keys.includes(s.key));
  const closer = [...sections].reverse().find((s) => CLOSERS.includes(s.key)) || sections[sections.length - 1];
  for (const m of dna.requiredModules) {
    if (!isModuleKey(m) || order.includes(m)) continue;
    if (m === "phone-cta") {
      header.push(m);
      continue;
    }
    let host = closer;
    if (m === "reviews") host = find(PROOF_HOSTS) || sections[Math.min(1, sections.length - 1)];
    else if (m === "project-proof" || m === "project-gallery") host = find(WORK_HOSTS) || sections[Math.min(1, sections.length - 1)];
    else if (m === "warranty" || m === "financing" || m === "credentials") host = find(["credentials", "why-us", "process"]) || closer;
    else if (m === "services") host = find(["craftsmanship", "brand-position", "why-us"]) || sections[Math.min(1, sections.length - 1)];
    host.embedded.push(m);
  }
  return { header, sections };
}

// What a renderer lacks for a DNA, as sentences. Empty means every section, embedded module and
// axis value has an implementation.
export function coverageErrors(dna: SiteDNA, modules: ModuleRegistry, axes: Partial<AxisImplementations>): string[] {
  const errors: string[] = [];
  const plan = modulePlan(dna);
  const keys = new Set<ModuleKey>([...plan.header, ...plan.sections.flatMap((s) => [s.key, ...s.embedded])]);
  for (const k of keys) if (!modules[k]) errors.push(`The renderer has no module "${k}".`);
  const checks: [keyof AxisImplementations, string][] = [
    ["hero", dna.hero],
    ["navigation", dna.navigation],
    ["typography", dna.typography],
    ["layoutRhythm", dna.layoutRhythm],
    ["geometry", dna.geometry],
    ["imagery", dna.imagery],
    ["motion", dna.motion],
  ];
  for (const [axis, value] of checks) {
    const impl = axes[axis] as Record<string, unknown> | undefined;
    if (!impl || !impl[value]) errors.push(`The renderer has no ${axis} implementation for "${value}".`);
  }
  return errors;
}
