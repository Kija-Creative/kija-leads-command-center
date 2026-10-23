// Automotive industry profile (added 2026-10-23 so every category in config/categories.json that maps to
// "automotive" has a loaded profile). Modelled on roofing.ts: same vocabularies, same truth rule.
//
// Truth rule: licenses, insurance, certifications, warranties, awards, staff and years in business render
// as clearly labelled owner-to-confirm placeholders unless the lead record sources them.
import type { IndustryProfile } from "../schema.ts";

export const automotive: IndustryProfile = {
  "id": "automotive",
  "label": "Automotive",
  "primaryConversions": [
    "call",
    "request-estimate",
    "appointment",
    "quote"
  ],
  "requiredModules": [
    "services",
    "reviews",
    "hours",
    "contact",
    "service-area"
  ],
  "defaultForbiddenPatterns": [
    "generic-saas-bento",
    "fake-dashboard-ui",
    "excessive-glassmorphism",
    "unrelated-tech-gradients"
  ],
  "description": "Auto repair, body and collision, tires, exhaust, diesel and fleet, mobile mechanics, detailing and towing.",
  "subIndustries": {
    "auto-repair": {
      "label": "Auto repair shop",
      "schemaOrgType": "AutoRepair"
    },
    "collision": {
      "label": "Auto body and collision",
      "schemaOrgType": "AutoBodyShop"
    },
    "tires": {
      "label": "Tire shop",
      "schemaOrgType": "TireShop"
    },
    "exhaust": {
      "label": "Muffler and exhaust",
      "schemaOrgType": "AutoRepair"
    },
    "diesel-fleet": {
      "label": "Diesel and truck repair",
      "schemaOrgType": "AutoRepair"
    },
    "mobile-mechanic": {
      "label": "Mobile mechanic",
      "schemaOrgType": "AutoRepair"
    },
    "detailing": {
      "label": "Auto detailing and tint",
      "schemaOrgType": "AutomotiveBusiness"
    },
    "towing": {
      "label": "Towing and roadside",
      "schemaOrgType": "AutomotiveBusiness"
    }
  },
  "schemaOrgType": "AutomotiveBusiness",
  "conversionLogic": "Drivers pick a shop after a breakdown, a warning light or a collision. They call when the car is down, request an estimate when it is planned, and decide on the Google rating, how close the shop is, the hours and whether the shop does the exact job (brakes, body work, tires, diesel).",
  "imageryNotes": "Real bays, lifts, tools, finished repairs and paint work. Until the owner supplies photos, library stock of shops and vehicles only, captioned as placeholders. Never a photo that could pass for this shop's staff or a job it did.",
  "proofNotes": "Proof is the recorded Google rating and review count, paraphrased review themes, the recorded hours and address, and project imagery captioned as placeholders. ASE certifications, insurer approvals, warranties and years in business appear only as owner-to-confirm slots unless the lead record sources them.",
  "trustSensitive": false,
  "preferredTrustSignals": [
    "google-rating",
    "review-themes",
    "hours",
    "service-area",
    "services",
    "certifications",
    "warranty",
    "real-projects",
    "before-after",
    "years-in-business"
  ],
  "motionCeiling": "moderate",
  "palettes": {
    "garage-graphite": {
      "label": "Graphite and signal orange",
      "tone": "light",
      "traits": [
        "practical",
        "reliable",
        "commercial"
      ],
      "tokens": {
        "bg": "#f1f1ef",
        "surface": "#ffffff",
        "ink": "#17191b",
        "muted": "#4a4f54",
        "line": "#d2d4d6",
        "primary": "#b54300",
        "on-primary": "#ffffff",
        "accent": "#f2b705"
      }
    },
    "track-black-red": {
      "label": "Track black and racing red",
      "tone": "dark",
      "traits": [
        "performance",
        "bold",
        "technical"
      ],
      "tokens": {
        "bg": "#101112",
        "surface": "#1b1c1e",
        "ink": "#f4f2ee",
        "muted": "#b9b6b0",
        "line": "#34363a",
        "primary": "#ff4a3d",
        "on-primary": "#101112",
        "accent": "#e8e4dc"
      }
    },
    "neighborhood-cream-green": {
      "label": "Cream and service green",
      "tone": "light",
      "traits": [
        "local",
        "family-owned",
        "warm"
      ],
      "tokens": {
        "bg": "#f6f3ea",
        "surface": "#fffdf7",
        "ink": "#1f2a22",
        "muted": "#555d52",
        "line": "#dcd6c4",
        "primary": "#1f5a3a",
        "on-primary": "#ffffff",
        "accent": "#c8962e"
      }
    }
  },
  "styleNotes": {
    "call-forward": "Tap to call is the primary action: the number is large in the header and hero and sits in a sticky mobile bar; the form or booking path is secondary.",
    "estimate-forward": "Request an estimate is the primary action in the header, the hero and after every proof section; the phone is the always visible fallback.",
    "bold-estimate": "Oversized estimate CTA blocks in the display face with the phone beside them; direct and impossible to miss.",
    "call-now": "Call now dominates on mobile and in the hero, with a short line on what happens when you call.",
    "walk-in-or-book": "Show the recorded hours and address beside a book or call action, so a walk-in customer and a planned one both have a clear next step.",
    "credential-strip": "A compact strip under the hero: recorded Google rating and review count, city and metro served. License, insurance and certification slots are labelled to confirm with the owner.",
    "review-led": "The recorded Google rating and review count lead the proof, followed by paraphrased review themes. No quotes, no names.",
    "before-after": "Before and after pairs as captioned placeholder slots until the owner supplies real pairs.",
    "service-menu-proof": "Proof through a clear service list with the recorded rating beside it; prices appear only when the owner supplies them."
  },
  "archetypes": [
    {
      "id": "shop-floor-utility",
      "label": "Shop Floor Utility",
      "family": "industrial",
      "description": "Functional and high trust: strong condensed sans, squared geometry, the phone and estimate always in reach, and the hours and address impossible to miss.",
      "imageryNotes": "Bays, lifts and finished repairs shown plainly and tightly cropped; technical detail over atmosphere.",
      "suitableSubIndustries": [
        "auto-repair",
        "collision",
        "tires",
        "exhaust",
        "diesel-fleet",
        "mobile-mechanic",
        "detailing",
        "towing"
      ],
      "prefersAttributes": [
        "phone",
        "address",
        "hours"
      ],
      "suitableBrandTraits": [
        "practical",
        "reliable",
        "commercial",
        "direct",
        "established",
        "hardworking"
      ],
      "heroes": [
        "utility",
        "editorial-split",
        "type-led",
        "full-bleed",
        "image-right"
      ],
      "navigation": [
        "utility-bar",
        "two-tier",
        "solid"
      ],
      "typography": [
        "condensed-sans",
        "grotesk",
        "industrial-condensed",
        "humanist-sans",
        "sans-only"
      ],
      "layoutRhythms": [
        "modular",
        "technical",
        "alternating",
        "asymmetric",
        "documentary"
      ],
      "geometries": [
        "square",
        "subtle-radius",
        "hard-edge",
        "rounded"
      ],
      "imagery": [
        "project-gallery",
        "documentary",
        "technical",
        "macro-detail",
        "before-after",
        "environment-first",
        "people-first"
      ],
      "motion": [
        "none",
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "garage-graphite",
        "neighborhood-cream-green"
      ],
      "ctaStyles": [
        "call-forward",
        "estimate-forward",
        "bold-estimate",
        "call-now",
        "walk-in-or-book"
      ],
      "proofStyles": [
        "credential-strip",
        "review-led",
        "before-after",
        "service-menu-proof"
      ],
      "componentDialects": [
        "industrial",
        "utility",
        "performance",
        "warm-local"
      ],
      "sectionOrders": [
        [
          "hero",
          "trust-strip",
          "services",
          "why-us",
          "reviews",
          "hours",
          "contact"
        ],
        [
          "hero",
          "services",
          "reviews",
          "process",
          "hours",
          "service-area",
          "contact"
        ]
      ],
      "requiredModules": [
        "phone-cta",
        "hours",
        "service-area"
      ],
      "forbiddenPatterns": [
        "cinematic-3d",
        "luxury-fashion-layout"
      ]
    },
    {
      "id": "performance-garage",
      "label": "Performance Garage",
      "family": "documentary",
      "description": "Dark, bold and technical: oversized type, high contrast, close detail of engines, paint and exhaust, and a direct call to action.",
      "imageryNotes": "Engines, welds, paint and machined parts in raking light; energetic but never glossy stock.",
      "suitableSubIndustries": [
        "auto-repair",
        "collision",
        "tires",
        "exhaust",
        "diesel-fleet",
        "mobile-mechanic",
        "detailing",
        "towing"
      ],
      "prefersAttributes": [
        "rating",
        "reviews",
        "sourced-services"
      ],
      "suitableBrandTraits": [
        "performance",
        "bold",
        "technical",
        "energetic",
        "specialist",
        "modern"
      ],
      "heroes": [
        "type-led",
        "full-bleed",
        "utility",
        "editorial-split",
        "image-right"
      ],
      "navigation": [
        "solid",
        "utility-bar",
        "two-tier"
      ],
      "typography": [
        "industrial-condensed",
        "condensed-sans",
        "grotesk",
        "humanist-sans",
        "sans-only"
      ],
      "layoutRhythms": [
        "alternating",
        "asymmetric",
        "modular",
        "technical",
        "documentary"
      ],
      "geometries": [
        "hard-edge",
        "square",
        "subtle-radius",
        "rounded"
      ],
      "imagery": [
        "macro-detail",
        "documentary",
        "before-after",
        "project-gallery",
        "technical",
        "environment-first",
        "people-first"
      ],
      "motion": [
        "subtle",
        "moderate",
        "none"
      ],
      "paletteFamilies": [
        "track-black-red"
      ],
      "ctaStyles": [
        "bold-estimate",
        "call-now",
        "call-forward",
        "estimate-forward",
        "walk-in-or-book"
      ],
      "proofStyles": [
        "review-led",
        "before-after",
        "credential-strip",
        "service-menu-proof"
      ],
      "componentDialects": [
        "performance",
        "industrial",
        "utility",
        "warm-local"
      ],
      "sectionOrders": [
        [
          "hero",
          "ratings",
          "services",
          "before-after",
          "process",
          "reviews",
          "hours",
          "estimate"
        ],
        [
          "hero",
          "services",
          "projects",
          "why-us",
          "reviews",
          "service-area",
          "contact"
        ]
      ],
      "requiredModules": [
        "phone-cta",
        "reviews",
        "estimate-form"
      ],
      "forbiddenPatterns": [
        "delicate-luxury-serif",
        "generic-saas"
      ]
    },
    {
      "id": "neighborhood-garage",
      "label": "Neighborhood Garage",
      "family": "documentary",
      "description": "Warm and local: humanist type, a friendly palette, the owner's town front and center, and plain service language a driver trusts.",
      "imageryNotes": "The shop front, the bays and everyday repairs in natural light; people only as owner-to-confirm slots.",
      "suitableSubIndustries": [
        "auto-repair",
        "collision",
        "tires",
        "exhaust",
        "diesel-fleet",
        "mobile-mechanic",
        "detailing",
        "towing"
      ],
      "prefersAttributes": [
        "phone",
        "rating",
        "bilingual"
      ],
      "suitableBrandTraits": [
        "local",
        "family-owned",
        "community",
        "warm",
        "approachable",
        "bilingual",
        "trusted",
        "personal"
      ],
      "heroes": [
        "editorial-split",
        "image-right",
        "utility",
        "type-led",
        "full-bleed"
      ],
      "navigation": [
        "solid",
        "two-tier",
        "utility-bar"
      ],
      "typography": [
        "humanist-sans",
        "sans-only",
        "condensed-sans",
        "grotesk",
        "industrial-condensed"
      ],
      "layoutRhythms": [
        "alternating",
        "documentary",
        "modular",
        "technical",
        "asymmetric"
      ],
      "geometries": [
        "rounded",
        "subtle-radius",
        "square",
        "hard-edge"
      ],
      "imagery": [
        "documentary",
        "environment-first",
        "people-first",
        "project-gallery",
        "technical",
        "macro-detail",
        "before-after"
      ],
      "motion": [
        "subtle",
        "none",
        "moderate"
      ],
      "paletteFamilies": [
        "neighborhood-cream-green",
        "garage-graphite"
      ],
      "ctaStyles": [
        "walk-in-or-book",
        "call-forward",
        "estimate-forward",
        "bold-estimate",
        "call-now"
      ],
      "proofStyles": [
        "review-led",
        "service-menu-proof",
        "credential-strip",
        "before-after"
      ],
      "componentDialects": [
        "warm-local",
        "utility",
        "industrial",
        "performance"
      ],
      "sectionOrders": [
        [
          "hero",
          "trust-strip",
          "services",
          "why-us",
          "reviews",
          "hours",
          "contact"
        ],
        [
          "hero",
          "services",
          "reviews",
          "process",
          "hours",
          "service-area",
          "contact"
        ]
      ],
      "requiredModules": [
        "phone-cta",
        "hours",
        "reviews"
      ],
      "forbiddenPatterns": [
        "luxury-fashion-layout",
        "cinematic-3d"
      ]
    }
  ]
};
