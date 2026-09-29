// Roofing industry profile. Supplied by Jamey on 2026-09-29. Two changes from the original:
// the import path "../schema.ts" (this file lives in industries/), and "utility-bar" added to the
// Premium Residential navigation options so Jamey's roofing Site DNA example (Premium Residential
// with "Utility bar + conventional nav") is valid under this profile.
//
// Truth rule: modules such as "testimonial-story", "credentials" and "warranty" render as
// clearly labelled owner-to-confirm placeholders unless the lead record sources them.
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

  archetypes: [
    {
      id: "industrial-utility",
      label: "Industrial Utility",

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
