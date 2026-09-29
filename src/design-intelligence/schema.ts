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
  | "gallery";

export type NavigationStyle =
  | "transparent-overlay"
  | "solid"
  | "two-tier"
  | "utility-bar"
  | "minimal"
  | "editorial"
  | "mega-menu";

export type TypographyStyle =
  | "serif-sans"
  | "sans-only"
  | "condensed-sans"
  | "editorial-serif"
  | "humanist-sans"
  | "grotesk"
  | "geometric"
  | "mono-accent";

export type LayoutRhythm =
  | "editorial"
  | "dense-grid"
  | "wide-cinematic"
  | "alternating"
  | "modular"
  | "asymmetric"
  | "gallery"
  | "technical"
  | "narrative";

export type GeometryStyle =
  | "square"
  | "subtle-radius"
  | "rounded"
  | "pill"
  | "mixed"
  | "architectural";

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
  | "collage";

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
