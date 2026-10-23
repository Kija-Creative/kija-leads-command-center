// Beauty and Spa industry profile (added 2026-10-23 so every category in config/categories.json that maps to
// "beauty-spa" has a loaded profile). Modelled on roofing.ts: same vocabularies, same truth rule.
//
// Truth rule: licenses, insurance, certifications, warranties, awards, staff and years in business render
// as clearly labelled owner-to-confirm placeholders unless the lead record sources them.
import type { IndustryProfile } from "../schema.ts";

export const beautySpa: IndustryProfile = {
  "id": "beauty-spa",
  "label": "Beauty and Spa",
  "primaryConversions": [
    "book",
    "appointment",
    "call"
  ],
  "requiredModules": [
    "services",
    "hours",
    "reviews",
    "contact"
  ],
  "defaultForbiddenPatterns": [
    "generic-saas-bento",
    "fake-dashboard-ui",
    "stock-model-faces",
    "unrelated-tech-gradients"
  ],
  "description": "Hair salons, nail salons and similar appointment-led beauty businesses.",
  "subIndustries": {
    "hair-salon": {
      "label": "Hair salon",
      "schemaOrgType": "HairSalon"
    },
    "nail-salon": {
      "label": "Nail salon",
      "schemaOrgType": "NailSalon"
    }
  },
  "schemaOrgType": "BeautySalon",
  "conversionLogic": "Clients choose a salon on the look of the work, the Google rating and whether the stylist or technician fits them. They book, so a clear booking action, the hours and the address matter, and the services list sets expectations.",
  "imageryNotes": "Finished hair, nails and the room itself. Until the owner supplies photos, library stock of salon details only, captioned as placeholders; never faces presented as this salon's staff or clients.",
  "proofNotes": "Proof is the recorded Google rating and review count, paraphrased review themes, the hours and address, and a gallery of work as owner-to-confirm photo slots. Prices, staff names, product brands and awards appear only when the lead record sources them.",
  "trustSensitive": false,
  "preferredTrustSignals": [
    "google-rating",
    "review-themes",
    "hours",
    "locations",
    "services",
    "portfolio",
    "team",
    "years-in-business"
  ],
  "motionCeiling": "moderate",
  "palettes": {
    "blush-clay": {
      "label": "Blush and clay",
      "tone": "light",
      "traits": [
        "warm",
        "approachable",
        "personal"
      ],
      "tokens": {
        "bg": "#f8efe9",
        "surface": "#fffaf6",
        "ink": "#2d2220",
        "muted": "#665652",
        "line": "#e6d5cb",
        "primary": "#9a4a3a",
        "on-primary": "#ffffff",
        "accent": "#c9a38a"
      }
    },
    "ink-champagne": {
      "label": "Ink and champagne",
      "tone": "dark",
      "traits": [
        "luxury",
        "boutique",
        "high-end"
      ],
      "tokens": {
        "bg": "#171416",
        "surface": "#231f22",
        "ink": "#f6f0ea",
        "muted": "#bdb3ab",
        "line": "#3b363a",
        "primary": "#d9bc92",
        "on-primary": "#171416",
        "accent": "#f6f0ea"
      }
    },
    "pop-orchid": {
      "label": "Orchid and pop",
      "tone": "light",
      "traits": [
        "playful",
        "youthful",
        "expressive"
      ],
      "tokens": {
        "bg": "#fbf3f8",
        "surface": "#ffffff",
        "ink": "#2a1530",
        "muted": "#5f4a66",
        "line": "#e9d6e6",
        "primary": "#8f1f7a",
        "on-primary": "#ffffff",
        "accent": "#ff7a59"
      }
    }
  },
  "styleNotes": {
    "book-forward": "Book an appointment is the primary action. Use the recorded booking link when the lead has one; otherwise a request form and the phone, never an invented booking system.",
    "appointment-forward": "Schedule a visit is the primary action, with the phone beside it; urgent jobs are pointed at the phone first.",
    "review-led": "The recorded Google rating and review count lead the proof, followed by paraphrased review themes. No quotes, no names.",
    "portfolio-proof": "Proof through the work itself: a grid of finished results as owner-to-confirm photo slots, with stock stand-ins clearly captioned as placeholders."
  },
  "archetypes": [
    {
      "id": "soft-studio",
      "label": "Soft Studio",
      "family": "editorial",
      "description": "Calm and personal: soft neutrals, generous space, a humanist type pairing and a gentle booking action.",
      "imageryNotes": "Natural light, textures, hands at work and the room; quiet and tactile.",
      "suitableSubIndustries": [
        "hair-salon",
        "nail-salon"
      ],
      "prefersAttributes": [
        "rating",
        "hours"
      ],
      "suitableBrandTraits": [
        "warm",
        "approachable",
        "personal",
        "calm",
        "organic",
        "local"
      ],
      "heroes": [
        "editorial-split",
        "image-right",
        "full-bleed",
        "asymmetric",
        "gallery"
      ],
      "navigation": [
        "centered-brand",
        "minimal",
        "transparent-overlay",
        "editorial",
        "solid",
        "floating"
      ],
      "typography": [
        "humanist-sans",
        "serif-sans",
        "high-contrast-serif",
        "geometric",
        "grotesk"
      ],
      "layoutRhythms": [
        "editorial",
        "narrative",
        "magazine",
        "wide-cinematic",
        "gallery",
        "asymmetric"
      ],
      "geometries": [
        "rounded",
        "organic",
        "editorial",
        "square",
        "pill"
      ],
      "imagery": [
        "lifestyle",
        "macro-detail",
        "environment-first",
        "editorial",
        "portfolio",
        "full-bleed",
        "collage"
      ],
      "motion": [
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "blush-clay",
        "pop-orchid"
      ],
      "ctaStyles": [
        "book-forward",
        "appointment-forward"
      ],
      "proofStyles": [
        "review-led",
        "portfolio-proof"
      ],
      "componentDialects": [
        "boutique",
        "warm-local",
        "luxury",
        "editorial",
        "kinetic"
      ],
      "sectionOrders": [
        [
          "hero",
          "treatments",
          "portfolio",
          "team",
          "reviews",
          "booking",
          "hours"
        ],
        [
          "hero",
          "services",
          "gallery",
          "reviews",
          "about",
          "hours",
          "contact"
        ]
      ],
      "requiredModules": [
        "booking",
        "hours"
      ],
      "forbiddenPatterns": [
        "neon-safety-theme",
        "generic-saas"
      ]
    },
    {
      "id": "editorial-salon",
      "label": "Editorial Salon",
      "family": "editorial",
      "description": "Fashion-forward and refined: high contrast serif headlines, dark ground, large photography of the work.",
      "imageryNotes": "Large, controlled photographs of finished color and cuts; magazine framing.",
      "suitableSubIndustries": [
        "hair-salon",
        "nail-salon"
      ],
      "prefersAttributes": [
        "rating",
        "reviews",
        "sourced-services"
      ],
      "suitableBrandTraits": [
        "luxury",
        "boutique",
        "high-end",
        "editorial",
        "premium",
        "artistic"
      ],
      "heroes": [
        "full-bleed",
        "asymmetric",
        "editorial-split",
        "image-right",
        "gallery"
      ],
      "navigation": [
        "transparent-overlay",
        "editorial",
        "centered-brand",
        "minimal",
        "solid",
        "floating"
      ],
      "typography": [
        "high-contrast-serif",
        "serif-sans",
        "humanist-sans",
        "geometric",
        "grotesk"
      ],
      "layoutRhythms": [
        "magazine",
        "wide-cinematic",
        "editorial",
        "narrative",
        "gallery",
        "asymmetric"
      ],
      "geometries": [
        "editorial",
        "square",
        "rounded",
        "organic",
        "pill"
      ],
      "imagery": [
        "editorial",
        "portfolio",
        "full-bleed",
        "lifestyle",
        "macro-detail",
        "environment-first",
        "collage"
      ],
      "motion": [
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "ink-champagne"
      ],
      "ctaStyles": [
        "book-forward",
        "appointment-forward"
      ],
      "proofStyles": [
        "portfolio-proof",
        "review-led"
      ],
      "componentDialects": [
        "luxury",
        "editorial",
        "boutique",
        "warm-local",
        "kinetic"
      ],
      "sectionOrders": [
        [
          "hero",
          "portfolio",
          "treatments",
          "team",
          "reviews",
          "booking",
          "hours"
        ],
        [
          "hero",
          "brand-position",
          "gallery",
          "services",
          "reviews",
          "booking"
        ]
      ],
      "requiredModules": [
        "portfolio",
        "booking"
      ],
      "forbiddenPatterns": [
        "cheap-coupon-layout",
        "neon-safety-theme"
      ]
    },
    {
      "id": "color-bar",
      "label": "Color Bar",
      "family": "documentary",
      "description": "Playful and bright: saturated accents, rounded shapes, a gallery-led layout and an easy booking action.",
      "imageryNotes": "Color, shine and detail in bright, close photographs of nails and hair.",
      "suitableSubIndustries": [
        "hair-salon",
        "nail-salon"
      ],
      "prefersAttributes": [
        "phone",
        "rating",
        "bilingual"
      ],
      "suitableBrandTraits": [
        "playful",
        "youthful",
        "expressive",
        "popular",
        "visual",
        "bilingual",
        "energetic"
      ],
      "heroes": [
        "gallery",
        "asymmetric",
        "editorial-split",
        "image-right",
        "full-bleed"
      ],
      "navigation": [
        "solid",
        "floating",
        "centered-brand",
        "minimal",
        "transparent-overlay",
        "editorial"
      ],
      "typography": [
        "geometric",
        "grotesk",
        "humanist-sans",
        "serif-sans",
        "high-contrast-serif"
      ],
      "layoutRhythms": [
        "gallery",
        "asymmetric",
        "editorial",
        "narrative",
        "magazine",
        "wide-cinematic"
      ],
      "geometries": [
        "pill",
        "rounded",
        "organic",
        "editorial",
        "square"
      ],
      "imagery": [
        "collage",
        "portfolio",
        "macro-detail",
        "lifestyle",
        "environment-first",
        "editorial",
        "full-bleed"
      ],
      "motion": [
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "pop-orchid",
        "blush-clay"
      ],
      "ctaStyles": [
        "book-forward",
        "appointment-forward"
      ],
      "proofStyles": [
        "portfolio-proof",
        "review-led"
      ],
      "componentDialects": [
        "boutique",
        "kinetic",
        "warm-local",
        "luxury",
        "editorial"
      ],
      "sectionOrders": [
        [
          "hero",
          "gallery",
          "services",
          "reviews",
          "booking",
          "hours",
          "contact"
        ],
        [
          "hero",
          "treatments",
          "portfolio",
          "reviews",
          "hours",
          "contact"
        ]
      ],
      "requiredModules": [
        "booking",
        "gallery"
      ],
      "forbiddenPatterns": [
        "luxury-fashion-layout",
        "generic-saas"
      ]
    }
  ]
};
