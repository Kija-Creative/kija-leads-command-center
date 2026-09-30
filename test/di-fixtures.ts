// Fixtures for the Design Intelligence Engine tests. Every business here is a clearly labelled
// example (fixture), never a real lead: "ABC Roofing" is the brief's own example name, and the
// phone numbers use the reserved 555-01xx range.
import type { CategoryRegistry, IndustryProfile, LeadRecord } from "../src/design-intelligence/schema.ts";
import type { IndustryRegistry } from "../src/design-intelligence/industries.ts";
import type { EngineData } from "../src/design-intelligence/select-site-dna.ts";
import { roofing } from "../src/design-intelligence/industries/roofing.ts";

export const NOW = "2026-09-29T12:00:00.000Z";

// A boutique fitness fixture profile, used only to prove cross-industry differentiation. The
// real pilates-wellness profile lives in src/design-intelligence/industries/ (another author).
export const pilatesFixture: IndustryProfile = {
  id: "pilates-fixture",
  label: "Pilates (fixture)",
  primaryConversions: ["intro-offer", "book"],
  requiredModules: ["intro-offer", "classes", "schedule", "instructors"],
  defaultForbiddenPatterns: ["generic-saas-bento"],
  subIndustries: { pilates: { label: "Pilates studio", schemaOrgType: "ExerciseGym" } },
  schemaOrgType: "ExerciseGym",
  motionCeiling: "kinetic",
  palettes: {
    "linen-clay": { label: "Linen and clay", tone: "light", tokens: { bg: "#f5f0e8", surface: "#fffaf3", ink: "#2a2420", muted: "#5f554c", line: "#e4d9ca", primary: "#7d4b35", "on-primary": "#ffffff", accent: "#b98b6e" } },
    "sage-stone": { label: "Sage and stone", tone: "light", tokens: { bg: "#eef0ea", surface: "#ffffff", ink: "#1f2620", muted: "#4f5a51", line: "#d5dbd2", primary: "#3f5a45", "on-primary": "#ffffff", accent: "#a7b59c" } },
    "ink-volt": { label: "Ink and volt", tone: "dark", tokens: { bg: "#101214", surface: "#1a1d20", ink: "#f2f4f1", muted: "#b3b9b4", line: "#2c3135", primary: "#d7ff3a", "on-primary": "#101214", accent: "#ffffff" } },
  },
  archetypes: [
    {
      id: "boutique-editorial",
      label: "Boutique Editorial",
      family: "editorial",
      suitableBrandTraits: ["boutique", "editorial", "calm", "premium", "warm"],
      heroes: ["editorial-split", "type-led"],
      navigation: ["minimal", "editorial"],
      typography: ["editorial-serif", "serif-sans"],
      layoutRhythms: ["editorial", "narrative"],
      geometries: ["subtle-radius", "architectural"],
      imagery: ["editorial", "lifestyle", "macro-detail"],
      motion: ["subtle"],
      paletteFamilies: ["linen-clay", "sage-stone"],
      ctaStyles: ["intro-offer-book"],
      proofStyles: ["review-led", "instructor-story"],
      componentDialects: ["editorial", "editorial-luxury"],
      sectionOrders: [
        ["hero", "intro-offer", "methodology", "classes", "instructors", "schedule", "reviews", "booking"],
        ["hero", "classes", "intro-offer", "instructors", "methodology", "schedule", "faq", "booking"],
      ],
      requiredModules: ["booking"],
      forbiddenPatterns: ["neon-gradient"],
    },
    {
      id: "organic-minimal",
      label: "Organic Minimal",
      suitableBrandTraits: ["minimal", "organic", "calm"],
      heroes: ["centered", "full-bleed"],
      navigation: ["minimal", "solid"],
      typography: ["humanist-sans", "geometric"],
      layoutRhythms: ["wide-cinematic", "alternating"],
      geometries: ["rounded"],
      imagery: ["lifestyle", "full-bleed"],
      motion: ["subtle", "moderate"],
      paletteFamilies: ["sage-stone"],
      ctaStyles: ["book-soft"],
      proofStyles: ["review-led"],
      componentDialects: ["boutique", "minimal"],
      sectionOrders: [["hero", "methodology", "classes", "intro-offer", "instructors", "schedule", "booking"]],
      requiredModules: ["booking"],
      forbiddenPatterns: [],
    },
    {
      id: "modern-performance",
      label: "Modern Performance",
      suitableBrandTraits: ["performance", "energetic", "bold", "modern"],
      excludedBrandTraits: ["calm"],
      heroes: ["type-led", "asymmetric"],
      navigation: ["solid", "two-tier"],
      typography: ["condensed-sans", "grotesk"],
      layoutRhythms: ["modular", "asymmetric"],
      geometries: ["square", "mixed"],
      imagery: ["documentary", "collage"],
      motion: ["moderate", "kinetic"],
      paletteFamilies: ["ink-volt"],
      ctaStyles: ["bold-book"],
      proofStyles: ["review-led"],
      componentDialects: ["kinetic"],
      sectionOrders: [["hero", "intro-offer", "classes", "schedule", "instructors", "memberships", "reviews", "booking"]],
      requiredModules: ["memberships"],
      forbiddenPatterns: [],
    },
  ],
  styleNotes: {
    "intro-offer-book": "The introductory offer (an owner-to-confirm slot) with a Book first class action.",
    "book-soft": "A soft Book a class action, repeated after each section.",
    "bold-book": "A loud Book action in the display face.",
    "instructor-story": "Instructors as owner-to-confirm profiles with their approach in their own words.",
  },
};

export const categories: CategoryRegistry = {
  roofing: { label: "Roofing", vertical: "contractor", industry: "roofing", subIndustry: "roofing", serviceDefaults: ["Roof repair", "Roof replacement", "Storm damage inspections"] },
  pilates: { label: "Pilates studio", vertical: "personal-care", industry: "pilates-fixture", subIndustry: "pilates", serviceDefaults: ["Reformer classes", "Mat classes", "Private sessions"] },
  general: { label: "Local service", vertical: "general", industry: "roofing", subIndustry: "roofing", serviceDefaults: [] },
};

export function registry(): IndustryRegistry {
  return {
    profiles: new Map<string, IndustryProfile>([["roofing", roofing], ["pilates-fixture", pilatesFixture]]),
    files: new Map(),
    errors: [],
    warnings: [],
  };
}

export function engineData(): EngineData {
  return { registry: registry(), categories };
}

function lead(fields: Partial<LeadRecord> & { id: string; business: string }): LeadRecord {
  return {
    category: "Roofing",
    categoryKey: "roofing",
    city: "Dallas",
    state: "TX",
    metro: "dallas-fort-worth",
    phone: "214-555-0100",
    googleRating: 4.8,
    googleReviews: 120,
    services: [],
    reviewThemes: [],
    languages: [],
    established: null,
    hours: "",
    sources: [{ url: "https://example.com/fixture", label: "fixture", checkedAt: "2026-09-29" }],
    demo: { shareApproved: false },
    addedAt: "2026-09-29",
    ...fields,
  };
}

// The brief's example business, as a fixture: premium residential wording.
export const abcRoofing = lead({
  id: "fixture-abc-roofing-dallas-tx",
  business: "ABC Roofing (fixture)",
  googleRating: 4.9,
  googleReviews: 212,
  reviewThemes: ["Careful, quality work", "Clear communication"],
  demoConcept: "Premium residential roofing site with an architectural project gallery and a craftsmanship story.",
  pitchAngle: "Homeowners expect a premium, craft-first contractor.",
});

// Storm and repair wording: urgent, crew led.
export const stormRoofing = lead({
  id: "fixture-storm-roofing-dallas-tx",
  business: "Example Storm Roofing (fixture)",
  phone: "214-555-0101",
  googleRating: 4.7,
  googleReviews: 64,
  reviewThemes: ["Fast response after hail"],
  demoConcept: "Storm response roofing site with an emergency call CTA, crew photos and an inspection form.",
  pitchAngle: "Hardworking local crew; make the call one tap.",
});

// Plain wording, a sourced established year.
export const establishedRoofing = lead({
  id: "fixture-established-roofing-plano-tx",
  business: "Example Established Roofing (fixture)",
  city: "Plano",
  phone: "972-555-0102",
  established: 1988,
  reviewThemes: ["Family owned and honest"],
  demoConcept: "Straightforward commercial and residential roofing site with credentials slots and estimate form.",
  pitchAngle: "Reliable and direct, decades of trust.",
});

export const pilatesStudio = lead({
  id: "fixture-reformer-studio-dallas-tx",
  business: "Example Reformer Studio (fixture)",
  category: "Pilates studio",
  categoryKey: "pilates",
  phone: "214-555-0103",
  googleRating: 5,
  googleReviews: 88,
  reviewThemes: ["Welcoming instructors", "Calm, clean studio"],
  demoConcept: "Boutique editorial pilates studio site with class schedule, intro offer and calm minimal photography.",
  pitchAngle: "A calm, premium studio that deserves a boutique presence.",
});

// Many roofing fixtures for variation tests.
export function roofingBatch(n: number): LeadRecord[] {
  return Array.from({ length: n }, (_, i) => lead({
    id: `fixture-roofer-${i + 1}-dallas-tx`,
    business: `Example Roofer ${i + 1} (fixture)`,
    phone: `214-555-01${String(10 + i).padStart(2, "0")}`,
    demoConcept: i % 2 ? "Local roofing site with estimate form and review proof." : "Roofing site with project gallery and inspection form.",
    pitchAngle: "Make estimates easy.",
  }));
}
