// Landscaping industry profile (added 2026-10-23 so every category in config/categories.json that maps to
// "landscaping" has a loaded profile). Modelled on roofing.ts: same vocabularies, same truth rule.
//
// Truth rule: licenses, insurance, certifications, warranties, awards, staff and years in business render
// as clearly labelled owner-to-confirm placeholders unless the lead record sources them.
import type { IndustryProfile } from "../schema.ts";

export const landscaping: IndustryProfile = {
  "id": "landscaping",
  "label": "Landscaping",
  "primaryConversions": [
    "request-estimate",
    "consultation",
    "call"
  ],
  "requiredModules": [
    "services",
    "project-proof",
    "service-area",
    "reviews",
    "contact"
  ],
  "defaultForbiddenPatterns": [
    "generic-saas-bento",
    "fake-dashboard-ui",
    "excessive-glassmorphism",
    "unrelated-tech-gradients"
  ],
  "description": "Landscaping, lawn care, outdoor design and tree service.",
  "subIndustries": {
    "landscaping": {
      "label": "Landscaping",
      "schemaOrgType": "LandscapingBusiness"
    },
    "tree-service": {
      "label": "Tree service",
      "schemaOrgType": "LandscapingBusiness"
    }
  },
  "schemaOrgType": "LandscapingBusiness",
  "conversionLogic": "Homeowners hire landscapers for recurring care or a planned project and tree crews for removal and storm work. They choose on finished yards near them, the Google rating, the service area and how easy the estimate is to request.",
  "imageryNotes": "Finished yards, plantings, hardscape, crews and equipment. Until the owner supplies photos, library stock of landscapes only, captioned as placeholders for the owner's projects. Never a photo that could pass for this company's crew or a job it did.",
  "proofNotes": "Proof is the recorded Google rating and review count, paraphrased review themes, the recorded city as the service area and project imagery captioned as placeholders. Licenses, insurance, arborist certifications and years in business appear only as owner-to-confirm slots unless the lead record sources them.",
  "trustSensitive": false,
  "preferredTrustSignals": [
    "real-projects",
    "google-rating",
    "review-themes",
    "service-area",
    "before-after",
    "crew",
    "licenses",
    "insurance-coverage",
    "certifications",
    "years-in-business"
  ],
  "motionCeiling": "moderate",
  "palettes": {
    "garden-moss": {
      "label": "Moss and linen",
      "tone": "light",
      "traits": [
        "organic",
        "calm",
        "residential"
      ],
      "tokens": {
        "bg": "#f4f3ea",
        "surface": "#fffffa",
        "ink": "#1d2a20",
        "muted": "#505c4f",
        "line": "#dcdcc9",
        "primary": "#2e6b3a",
        "on-primary": "#ffffff",
        "accent": "#b58a3c"
      }
    },
    "crew-truck-green": {
      "label": "Truck green and charcoal",
      "tone": "light",
      "traits": [
        "hardworking",
        "local",
        "energetic"
      ],
      "tokens": {
        "bg": "#eff1ec",
        "surface": "#ffffff",
        "ink": "#17201a",
        "muted": "#475248",
        "line": "#d1d6cd",
        "primary": "#1d5a2c",
        "on-primary": "#ffffff",
        "accent": "#f0a81a"
      }
    },
    "estate-dusk": {
      "label": "Estate dusk and bronze",
      "tone": "dark",
      "traits": [
        "luxury",
        "architectural",
        "high-end"
      ],
      "tokens": {
        "bg": "#171c18",
        "surface": "#222823",
        "ink": "#f1eee6",
        "muted": "#b9bdb2",
        "line": "#38403a",
        "primary": "#cfa763",
        "on-primary": "#171c18",
        "accent": "#9db39c"
      }
    }
  },
  "styleNotes": {
    "consultation": "A calm consultation request with a short form; no urgency language.",
    "estimate-forward": "Request an estimate is the primary action in the header, the hero and after every proof section; the phone is the always visible fallback.",
    "bold-estimate": "Oversized estimate CTA blocks in the display face with the phone beside them; direct and impossible to miss.",
    "call-now": "Call now dominates on mobile and in the hero, with a short line on what happens when you call.",
    "project-proof": "Proof through finished work: a captioned project set (type, area) built for the owner's photos, stock stand-ins captioned as placeholders.",
    "review-led": "The recorded Google rating and review count lead the proof, followed by paraphrased review themes. No quotes, no names.",
    "crew-led": "Proof through the crew, as owner-to-confirm team slots with roles; never stock faces presented as the team.",
    "before-after": "Before and after pairs as captioned placeholder slots until the owner supplies real pairs.",
    "craftsmanship-proof": "Proof through detail: close images of the work with plain captions about how good work is done, not claims about this company."
  },
  "archetypes": [
    {
      "id": "garden-editorial",
      "label": "Garden Editorial",
      "family": "editorial",
      "description": "Calm and organic: large photography of finished yards, soft greens, a serif and sans pairing and a consultation-led action.",
      "imageryNotes": "Wide, calm photographs of finished yards, plantings and paths in soft light.",
      "suitableSubIndustries": [
        "landscaping",
        "tree-service"
      ],
      "prefersAttributes": [
        "rating",
        "sourced-services"
      ],
      "suitableBrandTraits": [
        "organic",
        "calm",
        "residential",
        "craftsmanship",
        "warm",
        "detail-oriented"
      ],
      "heroes": [
        "full-bleed",
        "editorial-split",
        "type-led",
        "cinematic"
      ],
      "navigation": [
        "centered-brand",
        "minimal",
        "solid",
        "utility-bar",
        "transparent-overlay"
      ],
      "typography": [
        "serif-sans",
        "humanist-sans",
        "condensed-sans",
        "sans-only",
        "high-contrast-serif"
      ],
      "layoutRhythms": [
        "editorial",
        "narrative",
        "alternating",
        "asymmetric",
        "wide-cinematic"
      ],
      "geometries": [
        "organic",
        "rounded",
        "square",
        "mixed",
        "architectural",
        "editorial"
      ],
      "imagery": [
        "full-bleed",
        "lifestyle",
        "project-gallery",
        "documentary",
        "before-after",
        "collage",
        "editorial",
        "portfolio"
      ],
      "motion": [
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "garden-moss",
        "crew-truck-green"
      ],
      "ctaStyles": [
        "consultation",
        "estimate-forward",
        "bold-estimate",
        "call-now"
      ],
      "proofStyles": [
        "project-proof",
        "review-led",
        "crew-led",
        "before-after",
        "craftsmanship-proof"
      ],
      "componentDialects": [
        "editorial",
        "warm-local",
        "utility",
        "documentary",
        "luxury",
        "architectural"
      ],
      "sectionOrders": [
        [
          "hero",
          "selected-projects",
          "craftsmanship",
          "services",
          "process",
          "reviews",
          "consultation"
        ],
        [
          "hero",
          "brand-position",
          "projects",
          "services",
          "about",
          "reviews",
          "estimate"
        ]
      ],
      "requiredModules": [
        "project-gallery",
        "estimate-form"
      ],
      "forbiddenPatterns": [
        "neon-safety-theme",
        "generic-saas"
      ]
    },
    {
      "id": "crew-and-trucks",
      "label": "Crew and Trucks",
      "family": "documentary",
      "description": "Local, direct and energetic: bold type, crews and trucks front and center, recurring-service clarity and a straightforward estimate action.",
      "imageryNotes": "Crews, mowers, chainsaws and trucks at work: documentary and energetic, never glossy.",
      "suitableSubIndustries": [
        "landscaping",
        "tree-service"
      ],
      "prefersAttributes": [
        "phone",
        "rating",
        "reviews"
      ],
      "suitableBrandTraits": [
        "local",
        "hardworking",
        "family-owned",
        "straightforward",
        "energetic",
        "working-class",
        "bilingual"
      ],
      "heroes": [
        "type-led",
        "full-bleed",
        "editorial-split",
        "cinematic"
      ],
      "navigation": [
        "solid",
        "utility-bar",
        "centered-brand",
        "minimal",
        "transparent-overlay"
      ],
      "typography": [
        "condensed-sans",
        "sans-only",
        "serif-sans",
        "humanist-sans",
        "high-contrast-serif"
      ],
      "layoutRhythms": [
        "alternating",
        "asymmetric",
        "editorial",
        "narrative",
        "wide-cinematic"
      ],
      "geometries": [
        "square",
        "mixed",
        "organic",
        "rounded",
        "architectural",
        "editorial"
      ],
      "imagery": [
        "documentary",
        "before-after",
        "collage",
        "full-bleed",
        "lifestyle",
        "project-gallery",
        "editorial",
        "portfolio"
      ],
      "motion": [
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "crew-truck-green",
        "garden-moss"
      ],
      "ctaStyles": [
        "bold-estimate",
        "call-now",
        "consultation",
        "estimate-forward"
      ],
      "proofStyles": [
        "review-led",
        "crew-led",
        "before-after",
        "project-proof",
        "craftsmanship-proof"
      ],
      "componentDialects": [
        "utility",
        "documentary",
        "editorial",
        "warm-local",
        "luxury",
        "architectural"
      ],
      "sectionOrders": [
        [
          "hero",
          "ratings",
          "services",
          "projects",
          "process",
          "reviews",
          "service-area",
          "estimate"
        ],
        [
          "hero",
          "services",
          "before-after",
          "crew",
          "credentials",
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
      "id": "estate-design",
      "label": "Estate Design",
      "family": "editorial",
      "description": "Architectural and high-end: a dark ground, wide cinematic photography of finished outdoor spaces and a design-consultation action.",
      "imageryNotes": "Dusk-lit hardscape, lighting and plantings; the property as architecture.",
      "suitableSubIndustries": [
        "landscaping",
        "tree-service"
      ],
      "prefersAttributes": [
        "rating",
        "reviews"
      ],
      "suitableBrandTraits": [
        "luxury",
        "architectural",
        "high-end",
        "premium",
        "boutique",
        "artistic"
      ],
      "heroes": [
        "cinematic",
        "full-bleed",
        "editorial-split",
        "type-led"
      ],
      "navigation": [
        "transparent-overlay",
        "minimal",
        "centered-brand",
        "solid",
        "utility-bar"
      ],
      "typography": [
        "high-contrast-serif",
        "serif-sans",
        "humanist-sans",
        "condensed-sans",
        "sans-only"
      ],
      "layoutRhythms": [
        "wide-cinematic",
        "editorial",
        "narrative",
        "alternating",
        "asymmetric"
      ],
      "geometries": [
        "architectural",
        "editorial",
        "organic",
        "rounded",
        "square",
        "mixed"
      ],
      "imagery": [
        "full-bleed",
        "editorial",
        "portfolio",
        "lifestyle",
        "project-gallery",
        "documentary",
        "before-after",
        "collage"
      ],
      "motion": [
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "estate-dusk"
      ],
      "ctaStyles": [
        "consultation",
        "estimate-forward",
        "bold-estimate",
        "call-now"
      ],
      "proofStyles": [
        "craftsmanship-proof",
        "project-proof",
        "review-led",
        "crew-led",
        "before-after"
      ],
      "componentDialects": [
        "luxury",
        "architectural",
        "editorial",
        "warm-local",
        "utility",
        "documentary"
      ],
      "sectionOrders": [
        [
          "hero",
          "selected-projects",
          "craftsmanship",
          "services",
          "process",
          "reviews",
          "consultation"
        ],
        [
          "hero",
          "brand-position",
          "projects",
          "services",
          "about",
          "reviews",
          "estimate"
        ]
      ],
      "requiredModules": [
        "project-gallery",
        "estimate-form"
      ],
      "forbiddenPatterns": [
        "cheap-coupon-layout",
        "neon-safety-theme"
      ]
    }
  ]
};
