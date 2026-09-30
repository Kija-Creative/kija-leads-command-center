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
  preferredTrustSignals: ["instructors", "methodology", "studio", "schedule", "community", "class-descriptions", "google-rating"],
  palettes: {
    "pilates-stone": { label: "Stone and warm neutral", tone: "light", tokens: { bg: "#f3efe9", surface: "#fbf8f4", ink: "#2b2622", muted: "#5d554d", line: "#e1d8cc", primary: "#6b4f3a", "on-primary": "#ffffff", accent: "#a89078" } },
    "linen-clay": { label: "Linen and clay", tone: "light", tokens: { bg: "#f5f0e8", surface: "#fffaf3", ink: "#2a2420", muted: "#5f554c", line: "#e4d9ca", primary: "#7d4b35", "on-primary": "#ffffff", accent: "#b98b6e" } },
    "sage-stone": { label: "Sage and stone", tone: "light", tokens: { bg: "#eef0ea", surface: "#ffffff", ink: "#1f2620", muted: "#4f5a51", line: "#d5dbd2", primary: "#3f5a45", "on-primary": "#ffffff", accent: "#a7b59c" } },
    "ink-volt": { label: "Ink and volt", tone: "dark", tokens: { bg: "#101214", surface: "#1a1d20", ink: "#f2f4f1", muted: "#b3b9b4", line: "#2c3135", primary: "#d7ff3a", "on-primary": "#101214", accent: "#ffffff" } },
  },
  archetypes: [
    {
      // v2 Demonstration: Boutique Editorial (asymmetric, minimal, warm-serif + humanist-sans,
      // stone and warm neutral, editorial or narrative, subtle-radius, lifestyle, subtle motion,
      // intro offer, instructor, studio and methodology proof, boutique dialect).
      id: "boutique-editorial",
      label: "Boutique Editorial",
      family: "editorial",
      description: "Refined type, warm spacing and human movement imagery; a boutique studio, never a gym.",
      suitableBrandTraits: ["boutique", "editorial", "calm", "premium", "warm"],
      heroes: ["asymmetric", "editorial-split", "type-led"],
      navigation: ["minimal", "editorial"],
      typography: ["warm-serif", "editorial-serif", "serif-sans"],
      layoutRhythms: ["editorial", "narrative"],
      geometries: ["subtle-radius", "architectural"],
      imagery: ["lifestyle", "editorial", "macro-detail"],
      motion: ["subtle"],
      paletteFamilies: ["pilates-stone", "linen-clay", "sage-stone"],
      ctaStyles: ["intro-offer-book"],
      proofStyles: ["instructor-story", "review-led"],
      componentDialects: ["boutique", "editorial", "editorial-luxury"],
      sectionOrders: [
        ["hero", "intro-offer", "methodology", "studio", "classes", "instructors", "schedule", "memberships", "community", "booking"],
        ["hero", "intro-offer", "methodology", "classes", "instructors", "schedule", "reviews", "booking"],
        ["hero", "classes", "intro-offer", "instructors", "methodology", "schedule", "faq", "booking"],
      ],
      requiredModules: ["booking"],
      forbiddenPatterns: ["neon-gradient"],
      treatments: {
        headerBehaviors: ["static", "sticky-condensing"],
        backgroundTreatments: ["continuous-light", "tonal-shift"],
        buttonTreatments: ["solid-soft", "underline-link"],
        cardTreatments: ["none", "image-led"],
        spacingDensities: ["airy"],
        contentDensities: ["sparse"],
        storytellingModes: ["methodology"],
        mobilePriorities: ["book-first"],
      },
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

// A medical fixture profile (id "medical", so the engine treats it as trust sensitive by
// industry even without the flag). Its third archetype is a deliberately inappropriate kinetic
// direction whose traits match an "energetic" lead best: v2 test 2 proves it is never selected
// unless explicitly permitted. The real medical profile is another author's file.
export const medicalFixture: IndustryProfile = {
  id: "medical",
  label: "Medical (fixture)",
  primaryConversions: ["appointment", "call"],
  requiredModules: ["providers", "services", "insurance", "locations"],
  defaultForbiddenPatterns: ["generic-saas-bento"],
  preferredTrustSignals: ["providers", "credentials", "insurance-accepted", "hospital-affiliation", "patient-process", "locations", "google-rating"],
  subIndustries: { clinic: { label: "Medical clinic", schemaOrgType: "MedicalClinic" } },
  schemaOrgType: "MedicalClinic",
  palettes: {
    "clinical-blue": { label: "Clinical blue", tone: "light", tokens: { bg: "#f5f8fa", surface: "#ffffff", ink: "#14212b", muted: "#4a5a66", line: "#d7e0e6", primary: "#1d5c8c", "on-primary": "#ffffff", accent: "#6aa6c8" } },
    "clinical-green": { label: "Clinical green", tone: "light", tokens: { bg: "#f4f8f5", surface: "#ffffff", ink: "#16241b", muted: "#4b5d51", line: "#d6e2da", primary: "#2f6b4a", "on-primary": "#ffffff", accent: "#8fbf9f" } },
    "ink-volt": { label: "Ink and volt", tone: "dark", tokens: { bg: "#101214", surface: "#1a1d20", ink: "#f2f4f1", muted: "#b3b9b4", line: "#2c3135", primary: "#d7ff3a", "on-primary": "#101214", accent: "#ffffff" } },
  },
  styleNotes: {
    "appointment-calm": "A calm Request an appointment action with the phone beside it.",
    "provider-led": "Providers as owner-to-confirm profiles; credentials are slots until sourced.",
    "bold-book": "A loud booking action in the display face.",
  },
  archetypes: [
    {
      id: "clinical-authority",
      label: "Clinical Authority",
      description: "Clarity and calm hierarchy; providers and services first.",
      suitableBrandTraits: ["clinical", "precise", "calm", "trusted"],
      heroes: ["editorial-split", "utility"],
      navigation: ["solid", "two-tier"],
      typography: ["humanist-sans", "neo-grotesk"],
      layoutRhythms: ["modular", "editorial"],
      geometries: ["subtle-radius", "rounded"],
      imagery: ["people-first", "environment-first"],
      motion: ["none", "subtle"],
      paletteFamilies: ["clinical-blue", "clinical-green"],
      ctaStyles: ["appointment-calm"],
      proofStyles: ["provider-led"],
      componentDialects: ["clinical", "institutional"],
      sectionOrders: [["hero", "appointment", "services", "providers", "insurance", "locations", "faq", "contact"]],
      requiredModules: ["appointment"],
      forbiddenPatterns: [],
    },
    {
      id: "human-family-care",
      label: "Human / Family Care",
      description: "Warm, approachable care with people-first imagery.",
      suitableBrandTraits: ["warm", "approachable", "community"],
      heroes: ["image-left", "centered"],
      navigation: ["centered-brand", "solid"],
      typography: ["warm-serif", "humanist-sans"],
      layoutRhythms: ["narrative", "alternating"],
      geometries: ["rounded", "organic"],
      imagery: ["people-first", "lifestyle"],
      motion: ["subtle"],
      paletteFamilies: ["clinical-green"],
      ctaStyles: ["appointment-calm"],
      proofStyles: ["provider-led"],
      componentDialects: ["warm-local", "clinical"],
      sectionOrders: [["hero", "appointment", "providers", "services", "patient-comfort", "insurance", "locations", "contact"]],
      requiredModules: ["appointment"],
      forbiddenPatterns: [],
    },
    {
      id: "kinetic-clinic",
      label: "Kinetic Clinic (inappropriate on purpose)",
      description: "A high motion, kinetic direction that has no place in medicine unless a person permits it.",
      suitableBrandTraits: ["energetic", "bold", "high-energy", "modern"],
      heroes: ["type-led", "layered"],
      navigation: ["floating"],
      typography: ["industrial-condensed"],
      layoutRhythms: ["asymmetric"],
      geometries: ["hard-edge"],
      imagery: ["collage"],
      motion: ["moderate", "kinetic"],
      paletteFamilies: ["ink-volt"],
      ctaStyles: ["bold-book"],
      proofStyles: ["provider-led"],
      componentDialects: ["kinetic"],
      sectionOrders: [["hero", "services", "providers", "appointment", "insurance", "locations", "contact"]],
      requiredModules: ["appointment"],
      forbiddenPatterns: [],
    },
  ],
};

export const categories: CategoryRegistry = {
  roofing: { label: "Roofing", vertical: "contractor", industry: "roofing", subIndustry: "roofing", serviceDefaults: ["Roof repair", "Roof replacement", "Storm damage inspections"] },
  pilates: { label: "Pilates studio", vertical: "personal-care", industry: "pilates-fixture", subIndustry: "pilates", serviceDefaults: ["Reformer classes", "Mat classes", "Private sessions"] },
  "medical-clinic": { label: "Medical clinic", vertical: "health", industry: "medical", subIndustry: "clinic", serviceDefaults: ["Primary care visits", "Annual physicals"] },
  general: { label: "Local service", vertical: "general", industry: "roofing", subIndustry: "roofing", serviceDefaults: [] },
};

export function registry(extra: IndustryProfile[] = []): IndustryRegistry {
  return {
    profiles: new Map<string, IndustryProfile>([["roofing", roofing], ["pilates-fixture", pilatesFixture], ["medical", medicalFixture], ...extra.map((p): [string, IndustryProfile] => [p.id, p])]),
    files: new Map(),
    errors: [],
    warnings: [],
  };
}

export function engineData(extra: IndustryProfile[] = []): EngineData {
  return { registry: registry(extra), categories };
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

// An energetic medical fixture lead: its wording matches the kinetic archetype best.
export const energeticClinic = lead({
  id: "fixture-energetic-clinic-dallas-tx",
  business: "Example Energetic Clinic (fixture)",
  category: "Medical clinic",
  categoryKey: "medical-clinic",
  phone: "214-555-0104",
  googleRating: null,
  googleReviews: null,
  demoConcept: "Bold, high-energy modern clinic site with a loud booking action.",
  pitchAngle: "Bold and modern.",
});

// A lead with almost nothing on record, for the truthfulness test: no rating, no reviews, no
// themes, no services, no year.
export const bareRoofing = lead({
  id: "fixture-bare-roofing-dallas-tx",
  business: "Example Bare Roofing (fixture)",
  phone: "214-555-0105",
  googleRating: null,
  googleReviews: null,
  reviewThemes: [],
  demoConcept: "",
  pitchAngle: "",
});

// Pilates fixtures for filling the global window with another industry.
export function pilatesBatch(n: number): LeadRecord[] {
  return Array.from({ length: n }, (_, i) => lead({
    id: `fixture-studio-${i + 1}-dallas-tx`,
    business: `Example Studio ${i + 1} (fixture)`,
    category: "Pilates studio",
    categoryKey: "pilates",
    phone: `214-555-01${String(40 + i).padStart(2, "0")}`,
    demoConcept: "Boutique editorial pilates studio site with class schedule and intro offer.",
    pitchAngle: "Calm and premium.",
  }));
}

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
