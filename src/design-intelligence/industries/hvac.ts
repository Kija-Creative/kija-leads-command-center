// HVAC industry profile (added 2026-10-23 so every category in config/categories.json that maps to
// "hvac" has a loaded profile). Modelled on roofing.ts: same vocabularies, same truth rule.
//
// Truth rule: licenses, insurance, certifications, warranties, awards, staff and years in business render
// as clearly labelled owner-to-confirm placeholders unless the lead record sources them.
import type { IndustryProfile } from "../schema.ts";

export const hvac: IndustryProfile = {
  "id": "hvac",
  "label": "HVAC",
  "primaryConversions": [
    "call",
    "appointment",
    "request-estimate"
  ],
  "requiredModules": [
    "services",
    "service-area",
    "reviews",
    "contact",
    "phone-cta"
  ],
  "defaultForbiddenPatterns": [
    "generic-saas-bento",
    "fake-dashboard-ui",
    "excessive-glassmorphism",
    "unrelated-tech-gradients"
  ],
  "description": "Heating, cooling and air quality: repair, maintenance, replacement and emergency service.",
  "subIndustries": {
    "hvac": {
      "label": "HVAC contractor",
      "schemaOrgType": "HVACBusiness"
    }
  },
  "schemaOrgType": "HVACBusiness",
  "conversionLogic": "Homeowners call when the system fails in the heat or cold, and request an estimate when replacing equipment. They choose on response time, the Google rating, licensing and the service area, so the phone leads and the service area is explicit.",
  "imageryNotes": "Units, technicians, ductwork and comfortable homes. Until the owner supplies photos, library stock of HVAC work only, captioned as placeholders. Never a photo that could pass for this company's technicians.",
  "proofNotes": "Proof is the recorded Google rating and review count, paraphrased review themes and the recorded city as the service area. Licenses, insurance, manufacturer certifications, financing and years in business appear only as owner-to-confirm slots unless the lead record sources them.",
  "trustSensitive": true,
  "preferredTrustSignals": [
    "google-rating",
    "review-themes",
    "service-area",
    "licenses",
    "insurance-coverage",
    "manufacturer-certifications",
    "financing",
    "warranty",
    "years-in-business",
    "crew"
  ],
  "motionCeiling": "moderate",
  "palettes": {
    "cool-air-blue": {
      "label": "Cool air blue and white",
      "tone": "light",
      "traits": [
        "clinical",
        "precise",
        "reliable"
      ],
      "tokens": {
        "bg": "#f2f7fb",
        "surface": "#ffffff",
        "ink": "#0b2038",
        "muted": "#455c75",
        "line": "#d0dde9",
        "primary": "#0b5aa5",
        "on-primary": "#ffffff",
        "accent": "#e8590c"
      }
    },
    "season-red-charcoal": {
      "label": "Charcoal and heat red",
      "tone": "dark",
      "traits": [
        "urgent-need",
        "bold",
        "fast"
      ],
      "tokens": {
        "bg": "#171819",
        "surface": "#222426",
        "ink": "#f4f1ec",
        "muted": "#b8b4ac",
        "line": "#393c3f",
        "primary": "#ff5a36",
        "on-primary": "#171819",
        "accent": "#8fc7ee"
      }
    },
    "home-comfort-warm": {
      "label": "Warm home and evergreen",
      "tone": "light",
      "traits": [
        "warm",
        "family-owned",
        "local"
      ],
      "tokens": {
        "bg": "#f7f2e8",
        "surface": "#fffdf6",
        "ink": "#22291f",
        "muted": "#59604f",
        "line": "#e0d9c2",
        "primary": "#245a45",
        "on-primary": "#ffffff",
        "accent": "#d27a2c"
      }
    }
  },
  "styleNotes": {
    "appointment-forward": "Schedule a visit is the primary action, with the phone beside it; urgent jobs are pointed at the phone first.",
    "estimate-forward": "Request an estimate is the primary action in the header, the hero and after every proof section; the phone is the always visible fallback.",
    "call-now": "Call now dominates on mobile and in the hero, with a short line on what happens when you call.",
    "call-forward": "Tap to call is the primary action: the number is large in the header and hero and sits in a sticky mobile bar; the form or booking path is secondary.",
    "credential-strip": "A compact strip under the hero: recorded Google rating and review count, city and metro served. License, insurance and certification slots are labelled to confirm with the owner.",
    "review-led": "The recorded Google rating and review count lead the proof, followed by paraphrased review themes. No quotes, no names."
  },
  "archetypes": [
    {
      "id": "comfort-clinical",
      "label": "Comfort Clinical",
      "family": "editorial",
      "description": "Clean, cool and exact: light grounds, a neo-grotesk pairing, a clear maintenance and repair menu and a visible service area.",
      "imageryNotes": "Units, filters and ducts in bright, even light; clean workmanship and comfortable rooms.",
      "suitableSubIndustries": [
        "hvac"
      ],
      "prefersAttributes": [
        "rating",
        "sourced-services",
        "address"
      ],
      "suitableBrandTraits": [
        "clinical",
        "precise",
        "reliable",
        "trusted",
        "technical",
        "calm"
      ],
      "heroes": [
        "editorial-split",
        "centered",
        "conversion-form",
        "type-led",
        "image-left"
      ],
      "navigation": [
        "two-tier",
        "solid",
        "conversion-heavy"
      ],
      "typography": [
        "neo-grotesk",
        "grotesk",
        "condensed-sans",
        "industrial-condensed",
        "humanist-sans",
        "serif-sans"
      ],
      "layoutRhythms": [
        "modular",
        "technical",
        "conversion-heavy",
        "alternating",
        "narrative"
      ],
      "geometries": [
        "subtle-radius",
        "square",
        "hard-edge",
        "rounded"
      ],
      "imagery": [
        "technical",
        "macro-detail",
        "lifestyle",
        "documentary",
        "environment-first"
      ],
      "motion": [
        "none",
        "subtle"
      ],
      "paletteFamilies": [
        "cool-air-blue",
        "home-comfort-warm"
      ],
      "ctaStyles": [
        "appointment-forward",
        "estimate-forward",
        "call-now",
        "call-forward"
      ],
      "proofStyles": [
        "credential-strip",
        "review-led"
      ],
      "componentDialects": [
        "clinical",
        "technical",
        "utility",
        "documentary",
        "warm-local"
      ],
      "sectionOrders": [
        [
          "hero",
          "emergency-or-estimate",
          "services",
          "reviews",
          "service-area",
          "why-us",
          "process",
          "contact"
        ],
        [
          "hero",
          "trust-strip",
          "services",
          "why-us",
          "process",
          "reviews",
          "service-area",
          "estimate"
        ]
      ],
      "requiredModules": [
        "phone-cta",
        "service-area",
        "estimate-form"
      ],
      "forbiddenPatterns": [
        "cinematic-3d",
        "neon-safety-theme"
      ]
    },
    {
      "id": "seasonal-direct",
      "label": "Seasonal Direct",
      "family": "documentary",
      "description": "For the 3 a.m. breakdown: a dark ground, a huge phone number, plain statements of what happens when you call.",
      "imageryNotes": "Technicians, vans and units in weather; honest and functional.",
      "suitableSubIndustries": [
        "hvac"
      ],
      "prefersAttributes": [
        "phone",
        "hours",
        "reviews"
      ],
      "suitableBrandTraits": [
        "urgent-need",
        "fast",
        "bold",
        "direct",
        "energetic",
        "hardworking"
      ],
      "heroes": [
        "conversion-form",
        "type-led",
        "editorial-split",
        "centered",
        "image-left"
      ],
      "navigation": [
        "conversion-heavy",
        "solid",
        "two-tier"
      ],
      "typography": [
        "condensed-sans",
        "industrial-condensed",
        "neo-grotesk",
        "grotesk",
        "humanist-sans",
        "serif-sans"
      ],
      "layoutRhythms": [
        "conversion-heavy",
        "alternating",
        "modular",
        "technical",
        "narrative"
      ],
      "geometries": [
        "hard-edge",
        "square",
        "subtle-radius",
        "rounded"
      ],
      "imagery": [
        "documentary",
        "technical",
        "macro-detail",
        "lifestyle",
        "environment-first"
      ],
      "motion": [
        "subtle",
        "none"
      ],
      "paletteFamilies": [
        "season-red-charcoal"
      ],
      "ctaStyles": [
        "call-now",
        "call-forward",
        "appointment-forward",
        "estimate-forward"
      ],
      "proofStyles": [
        "review-led",
        "credential-strip"
      ],
      "componentDialects": [
        "utility",
        "documentary",
        "clinical",
        "technical",
        "warm-local"
      ],
      "sectionOrders": [
        [
          "hero",
          "emergency",
          "services",
          "reviews",
          "service-area",
          "process",
          "contact"
        ],
        [
          "hero",
          "emergency-or-estimate",
          "trust-strip",
          "services",
          "reviews",
          "service-area",
          "estimate"
        ]
      ],
      "requiredModules": [
        "phone-cta",
        "emergency",
        "service-area"
      ],
      "forbiddenPatterns": [
        "delicate-luxury-serif",
        "generic-saas"
      ]
    },
    {
      "id": "family-hvac",
      "label": "Family HVAC",
      "family": "documentary",
      "description": "Warm and local: soft neutrals, humanist type, the owner's town, financing and warranty slots and a calm booking action.",
      "imageryNotes": "Homes, living rooms and tidy installs in natural light; people only as owner-to-confirm slots.",
      "suitableSubIndustries": [
        "hvac"
      ],
      "prefersAttributes": [
        "rating",
        "phone",
        "bilingual"
      ],
      "suitableBrandTraits": [
        "family-owned",
        "local",
        "warm",
        "approachable",
        "community",
        "established",
        "bilingual"
      ],
      "heroes": [
        "editorial-split",
        "image-left",
        "centered",
        "conversion-form",
        "type-led"
      ],
      "navigation": [
        "solid",
        "two-tier",
        "conversion-heavy"
      ],
      "typography": [
        "humanist-sans",
        "serif-sans",
        "neo-grotesk",
        "grotesk",
        "condensed-sans",
        "industrial-condensed"
      ],
      "layoutRhythms": [
        "alternating",
        "narrative",
        "modular",
        "technical",
        "conversion-heavy"
      ],
      "geometries": [
        "rounded",
        "subtle-radius",
        "square",
        "hard-edge"
      ],
      "imagery": [
        "environment-first",
        "documentary",
        "lifestyle",
        "technical",
        "macro-detail"
      ],
      "motion": [
        "subtle",
        "none"
      ],
      "paletteFamilies": [
        "home-comfort-warm",
        "cool-air-blue"
      ],
      "ctaStyles": [
        "appointment-forward",
        "call-forward",
        "estimate-forward",
        "call-now"
      ],
      "proofStyles": [
        "review-led",
        "credential-strip"
      ],
      "componentDialects": [
        "warm-local",
        "utility",
        "clinical",
        "technical",
        "documentary"
      ],
      "sectionOrders": [
        [
          "hero",
          "emergency-or-estimate",
          "services",
          "reviews",
          "service-area",
          "why-us",
          "process",
          "contact"
        ],
        [
          "hero",
          "trust-strip",
          "services",
          "why-us",
          "process",
          "reviews",
          "service-area",
          "estimate"
        ]
      ],
      "requiredModules": [
        "phone-cta",
        "reviews",
        "service-area"
      ],
      "forbiddenPatterns": [
        "luxury-fashion-layout",
        "cinematic-3d"
      ]
    }
  ]
};
