// Roofing industry profile. Supplied by Jamey on 2026-09-29. Two changes from the original:
// the import path "../schema.ts" (this file lives in industries/), and "utility-bar" added to the
// Premium Residential navigation options so Jamey's roofing Site DNA example (Premium Residential
// with "Utility bar + conventional nav") is valid under this profile.
//
// Truth rule: modules such as "testimonial-story", "credentials" and "warranty" render as
// clearly labelled owner-to-confirm placeholders unless the lead record sources them.
//
// Extension (engine architect, 2026-09-29): optional fields only, nothing renamed or narrowed.
// Added: description, subIndustries, schemaOrgType, conversionLogic, imageryNotes, proofNotes,
// trustSensitive, motionCeiling, palettes (tokens for every palette family named below, each
// checked for WCAG AA at load), styleNotes, and a family, description and imageryNotes on each
// archetype. Every other line is as supplied.
//
// v2 extension (engine upgrade, 2026-09-30), again additions only: preferredTrustSignals and
// industry treatments; per archetype suitableSubIndustries, prefersAttributes, treatments (and
// imageryDemand on Premium Residential); v2's home services section architectures and the
// Demonstration's two roofer directions as extra section orders; "before-after" imagery on
// Blue-Collar Modern.
import type { IndustryProfile } from "../schema.ts";

export const roofing: IndustryProfile = {
  id: "roofing",
  label: "Roofing",

  primaryConversions: [
    "request-estimate",
    "call",
    "inspection",
  ],

  requiredModules: [
    "services",
    "service-area",
    "project-proof",
    "reviews",
    "warranty",
    "contact",
  ],

  defaultForbiddenPatterns: [
    "generic-saas-bento",
    "fake-dashboard-ui",
    "excessive-glassmorphism",
    "unrelated-tech-gradients",
  ],

  description: "Residential and light commercial roofing: repair, replacement, storm damage and inspections.",

  subIndustries: {
    roofing: { label: "Roofing contractor", schemaOrgType: "RoofingContractor" },
  },

  schemaOrgType: "RoofingContractor",

  conversionLogic: "Homeowners choose a roofer after a leak, a storm or an inspection finding. They call when it is urgent and request an estimate or inspection when it is planned, and they decide on visible proof: the Google rating, finished roofs near them, the service area and what happens if something goes wrong (warranty, to confirm with the owner).",

  imageryNotes: "Real roofs, crews at work, details of materials and flashing, and before and after transformations. Until the owner supplies photos, library stock of roofs only, captioned as placeholders for the owner's projects. Never a photo that could pass for this company's crew or a job it did.",

  proofNotes: "Proof is the recorded Google rating and review count, paraphrased review themes, the recorded city and metro as the service area, and project imagery captioned as placeholders. Licenses, insurance, warranties, manufacturer certifications and years in business appear only as owner-to-confirm slots unless the lead record sources them.",

  trustSensitive: true,

  // v2: the trust signals home services lean on (IMPLEMENTATION-BRIEF-v2.md, Truthfulness). Only
  // the rating, review themes and service area can be sourced from a lead record; the rest are
  // owner-to-confirm slots.
  preferredTrustSignals: ["real-projects", "google-rating", "review-themes", "licenses", "warranty", "service-area", "financing", "crew", "manufacturer-certifications"],

  treatments: {
    localBusinessStrategies: ["service-area"],
    seoStrategies: ["local-service-pages"],
  },

  motionCeiling: "moderate",

  palettes: {
    "steel-safety": { label: "Steel and safety orange", tone: "light", traits: ["practical", "reliable", "commercial"], tokens: { bg: "#f2f3f1", surface: "#ffffff", ink: "#15191d", muted: "#4a535c", line: "#d3d7da", primary: "#a84300", "on-primary": "#ffffff", accent: "#f2b705" } },
    "charcoal-construction": { label: "Charcoal and construction orange", tone: "dark", traits: ["hardworking", "bold", "commercial"], tokens: { bg: "#1b1d1f", surface: "#25282b", ink: "#f2f0eb", muted: "#b5b1a8", line: "#3a3e42", primary: "#e8772e", "on-primary": "#1b1d1f", accent: "#c9c2b4" } },
    "navy-industrial": { label: "Navy and signal amber", tone: "light", traits: ["established", "reliable", "trusted"], tokens: { bg: "#f4f5f7", surface: "#ffffff", ink: "#0f1b2d", muted: "#4b5668", line: "#d5dae2", primary: "#16365c", "on-primary": "#ffffff", accent: "#d9822b" } },
    "warm-architectural": { label: "Warm plaster and walnut", tone: "light", traits: ["premium", "residential", "craftsmanship"], tokens: { bg: "#f6f2ec", surface: "#fffdf9", ink: "#23201c", muted: "#5e574e", line: "#e2dacd", primary: "#6f4426", "on-primary": "#ffffff", accent: "#b08d57" } },
    "charcoal-stone": { label: "Charcoal slate and limestone", tone: "dark", traits: ["high-end", "architectural", "premium"], tokens: { bg: "#2a2926", surface: "#34322e", ink: "#f1ede6", muted: "#bdb6aa", line: "#4a4741", primary: "#d8cbb4", "on-primary": "#2a2926", accent: "#9c8a6c" } },
    "cream-copper": { label: "Cream and copper flashing", tone: "light", traits: ["craftsmanship", "warm", "residential"], tokens: { bg: "#f8f3ea", surface: "#fffaf2", ink: "#2b2320", muted: "#62574e", line: "#e6dccb", primary: "#8f4a22", "on-primary": "#ffffff", accent: "#c47a45" } },
    "black-safety-yellow": { label: "Black and safety yellow", tone: "dark", traits: ["bold", "energetic", "urgent-need"], tokens: { bg: "#111111", surface: "#1c1c1c", ink: "#f5f5f0", muted: "#b8b8b0", line: "#333333", primary: "#ffd400", "on-primary": "#111111", accent: "#ffffff" } },
    "navy-red": { label: "Navy and truck red", tone: "light", traits: ["local", "straightforward", "hardworking"], tokens: { bg: "#f5f6f8", surface: "#ffffff", ink: "#101a2e", muted: "#4c566a", line: "#d6dbe4", primary: "#b3202a", "on-primary": "#ffffff", accent: "#1d3461" } },
    "charcoal-orange": { label: "Concrete grey and hi-vis orange", tone: "light", traits: ["energetic", "direct", "value"], tokens: { bg: "#ededeb", surface: "#ffffff", ink: "#1e1f21", muted: "#4d5054", line: "#d1d2d4", primary: "#b83d0b", "on-primary": "#ffffff", accent: "#1e1f21" } },
  },

  styleNotes: {
    "estimate-forward": "Request an estimate is the primary action in the header, the hero and after every proof section; the phone is the always visible fallback.",
    "call-forward": "Tap to call is the primary action: the number is large in the header and hero and sits in a sticky mobile bar; the estimate form is the planned-work path.",
    consultation: "A calm consultation request (a site visit to talk through the project) with a short form; no urgency language.",
    "project-estimate": "A project estimate request that asks for the project type and a photo or two; framed as planning, not emergency.",
    "bold-estimate": "Oversized estimate CTA blocks in the display face with the phone beside them; direct and impossible to miss.",
    "call-now": "Call now dominates on mobile and in the hero, with a short line on what happens when you call.",
    "credential-strip": "A compact strip right under the hero: recorded Google rating and review count, city and metro served. License, insurance and warranty slots are labelled to confirm with the owner.",
    "project-proof": "Proof through finished roofs: a captioned project set (type, area) built for the owner's photos, stock stand-ins captioned as placeholders.",
    "review-led": "The recorded Google rating and review count lead the proof, followed by paraphrased review themes. No quotes, no names.",
    "project-story": "One or two projects told as short stories (problem, material, result) using only facts the owner supplies; placeholders until then.",
    "craftsmanship-proof": "Proof through detail: macro images of flashing, underlayment and ridge work with plain captions about how good work is done, not claims about this company.",
    "crew-led": "Proof through the crew, as owner-to-confirm team slots with roles; never stock faces presented as the crew.",
    "before-after": "Before and after pairs of roofs as captioned placeholder slots until the owner supplies real pairs.",
  },

  archetypes: [
    {
      id: "industrial-utility",
      label: "Industrial Utility",
      family: "industrial",
      description: "Functional and high trust: strong sans serif, squared geometry, the phone and estimate actions always in reach, project photography, low motion.",
      imageryNotes: "Roofs, crews and job sites shown plainly and tightly cropped; technical detail over atmosphere.",
      suitableSubIndustries: ["roofing"],
      prefersAttributes: ["phone", "address", "hours"],
      treatments: {
        headerBehaviors: ["sticky", "sticky-mobile-bar"],
        footerStyles: ["contact-led", "directory", "utility"],
        backgroundTreatments: ["border-separated", "tonal-shift", "technical-grid"],
        buttonTreatments: ["solid-block", "oversized-block"],
        cardTreatments: ["hairline-border", "spec-sheet"],
        imageShapes: ["rectangle", "landscape"],
        iconStyles: ["line", "numerals", "technical-glyph"],
        spacingDensities: ["compact", "balanced"],
        contentDensities: ["dense", "balanced"],
        storytellingModes: ["direct-response"],
        mobilePriorities: ["call-first", "form-first"],
      },

      suitableBrandTraits: [
        "established",
        "practical",
        "reliable",
        "commercial",
        "direct",
      ],

      heroes: ["utility", "editorial-split"],
      navigation: ["utility-bar", "two-tier"],
      typography: ["condensed-sans", "grotesk"],
      layoutRhythms: ["modular", "technical"],
      geometries: ["square", "subtle-radius"],
      imagery: [
        "project-gallery",
        "documentary",
        "technical",
      ],
      motion: ["none", "subtle"],

      paletteFamilies: [
        "steel-safety",
        "charcoal-construction",
        "navy-industrial",
      ],

      ctaStyles: [
        "estimate-forward",
        "call-forward",
      ],

      proofStyles: [
        "credential-strip",
        "project-proof",
        "review-led",
      ],

      componentDialects: [
        "industrial",
        "utility",
      ],

      sectionOrders: [
        [
          "hero",
          "emergency-or-estimate",
          "services",
          "project-proof",
          "credentials",
          "reviews",
          "service-area",
          "warranty",
          "contact",
        ],
        [
          "hero",
          "trust-strip",
          "services",
          "why-us",
          "projects",
          "process",
          "reviews",
          "service-area",
          "estimate",
        ],
        // v2 home services architectures (IMPLEMENTATION-BRIEF-v2.md, Conversion architecture)
        ["hero", "emergency-or-estimate", "trust-strip", "services", "projects", "why-us", "process", "reviews", "service-area", "warranty", "estimate"],
        ["hero", "services", "emergency", "before-after", "crew", "credentials", "reviews", "financing", "service-area", "contact"],
      ],

      requiredModules: [
        "phone-cta",
        "estimate-form",
        "service-area",
      ],

      forbiddenPatterns: [
        "cinematic-3d",
        "luxury-fashion-layout",
      ],
    },

    {
      id: "premium-residential",
      label: "Premium Residential",
      family: "editorial",
      description: "Architectural photography, a warmer neutral palette, larger whitespace, sophisticated typography and craftsmanship presented like a residential architecture feature.",
      imageryNotes: "Large, calm photographs of finished residential roofs and material details; the house as architecture.",
      suitableSubIndustries: ["roofing"],
      prefersAttributes: ["rating", "sourced-services"],
      imageryDemand: "high",
      treatments: {
        headerBehaviors: ["transparent-to-solid", "sticky-condensing"],
        footerStyles: ["editorial", "minimal"],
        backgroundTreatments: ["continuous-light", "full-bleed-imagery", "material-texture"],
        buttonTreatments: ["solid-soft", "underline-link", "text-arrow"],
        cardTreatments: ["image-led", "none"],
        imageShapes: ["full-bleed", "landscape", "portrait"],
        iconStyles: ["none", "numerals"],
        spacingDensities: ["airy"],
        contentDensities: ["sparse", "balanced"],
        storytellingModes: ["craft-story", "project-story"],
        mobilePriorities: ["form-first", "call-first"],
      },

      suitableBrandTraits: [
        "premium",
        "craftsmanship",
        "residential",
        "architectural",
        "high-end",
      ],

      heroes: [
        "full-bleed",
        "editorial-split",
        "asymmetric",
      ],

      navigation: [
        "transparent-overlay",
        "minimal",
        "solid",
        "utility-bar",
      ],

      typography: [
        "serif-sans",
        "grotesk",
      ],

      layoutRhythms: [
        "editorial",
        "wide-cinematic",
        "asymmetric",
      ],

      geometries: [
        "architectural",
        "subtle-radius",
      ],

      imagery: [
        "full-bleed",
        "project-gallery",
        "macro-detail",
      ],

      motion: [
        "subtle",
        "moderate",
      ],

      paletteFamilies: [
        "warm-architectural",
        "charcoal-stone",
        "cream-copper",
      ],

      ctaStyles: [
        "consultation",
        "project-estimate",
      ],

      proofStyles: [
        "project-story",
        "craftsmanship-proof",
      ],

      componentDialects: [
        "editorial",
        "luxury",
      ],

      sectionOrders: [
        [
          "hero",
          "selected-projects",
          "craftsmanship",
          "services",
          "materials",
          "process",
          "testimonial-story",
          "consultation",
        ],
        [
          "hero",
          "brand-position",
          "projects",
          "services",
          "warranty",
          "about",
          "reviews",
          "estimate",
        ],
        // v2 reference direction for a premium residential roofer (IMPLEMENTATION-BRIEF-v2.md, Demonstration)
        ["hero", "projects", "craftsmanship", "services", "materials", "process", "warranty", "reviews", "estimate"],
      ],

      requiredModules: [
        "project-gallery",
        "estimate-form",
      ],

      forbiddenPatterns: [
        "cheap-coupon-layout",
        "neon-safety-theme",
      ],
    },

    {
      id: "blue-collar-modern",
      label: "Blue-Collar Modern",
      family: "documentary",
      description: "Bold typography, high contrast, real crew and job-site imagery, energetic layouts and a straightforward CTA treatment.",
      imageryNotes: "Crews on roofs, trucks, tear-offs and weather: documentary and energetic, never glossy.",
      suitableSubIndustries: ["roofing"],
      prefersAttributes: ["phone", "rating", "reviews"],
      treatments: {
        headerBehaviors: ["sticky", "sticky-mobile-bar"],
        footerStyles: ["contact-led", "oversized-type"],
        backgroundTreatments: ["dark-sections", "oversized-type", "split-image"],
        buttonTreatments: ["oversized-block", "solid-block"],
        cardTreatments: ["flat-tonal", "numbered-list"],
        imageShapes: ["mixed-crop", "square", "landscape"],
        iconStyles: ["solid", "numerals"],
        spacingDensities: ["compact", "balanced"],
        contentDensities: ["balanced", "dense"],
        storytellingModes: ["direct-response", "documentary"],
        mobilePriorities: ["call-first", "form-first"],
      },

      suitableBrandTraits: [
        "local",
        "energetic",
        "hardworking",
        "family-owned",
        "straightforward",
      ],

      heroes: [
        "type-led",
        "editorial-split",
        "full-bleed",
      ],

      navigation: [
        "solid",
        "utility-bar",
      ],

      typography: [
        "condensed-sans",
        "sans-only",
      ],

      layoutRhythms: [
        "alternating",
        "modular",
        "asymmetric",
      ],

      geometries: [
        "square",
        "mixed",
      ],

      imagery: [
        "documentary",
        "collage",
        "before-after",
        "project-gallery",
      ],

      motion: [
        "subtle",
        "moderate",
      ],

      paletteFamilies: [
        "black-safety-yellow",
        "navy-red",
        "charcoal-orange",
      ],

      ctaStyles: [
        "bold-estimate",
        "call-now",
      ],

      proofStyles: [
        "review-led",
        "crew-led",
        "before-after",
      ],

      componentDialects: [
        "utility",
        "industrial",
      ],

      sectionOrders: [
        [
          "hero",
          "ratings",
          "services",
          "crew",
          "before-after",
          "process",
          "reviews",
          "estimate",
        ],
        // v2 reference direction for a family-owned local roofer (IMPLEMENTATION-BRIEF-v2.md, Demonstration)
        ["hero", "ratings", "services", "crew", "before-after", "process", "reviews", "service-area", "estimate"],
      ],

      requiredModules: [
        "phone-cta",
        "reviews",
        "estimate-form",
      ],

      forbiddenPatterns: [
        "delicate-luxury-serif",
        "generic-saas",
      ],
    },
  ],
};
