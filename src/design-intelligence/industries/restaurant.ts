// Restaurant industry profile (added 2026-10-23 so every category in config/categories.json that maps to
// "restaurant" has a loaded profile). Modelled on roofing.ts: same vocabularies, same truth rule.
//
// Truth rule: licenses, insurance, certifications, warranties, awards, staff and years in business render
// as clearly labelled owner-to-confirm placeholders unless the lead record sources them.
import type { IndustryProfile } from "../schema.ts";

export const restaurant: IndustryProfile = {
  "id": "restaurant",
  "label": "Restaurant",
  "primaryConversions": [
    "order",
    "reserve",
    "call",
    "visit"
  ],
  "requiredModules": [
    "menu",
    "hours",
    "locations",
    "reviews",
    "contact"
  ],
  "defaultForbiddenPatterns": [
    "generic-saas-bento",
    "fake-dashboard-ui",
    "excessive-glassmorphism",
    "unrelated-tech-gradients"
  ],
  "description": "Independent restaurants, taquerias, pizzerias, barbecue, cafes and bakeries, including the Restaurants + Cliqbux track.",
  "subIndustries": {
    "restaurant": {
      "label": "Restaurant",
      "schemaOrgType": "Restaurant"
    },
    "mexican": {
      "label": "Mexican restaurant and taqueria",
      "schemaOrgType": "Restaurant"
    },
    "pizza": {
      "label": "Pizzeria",
      "schemaOrgType": "Restaurant"
    },
    "bbq": {
      "label": "BBQ and smokehouse",
      "schemaOrgType": "Restaurant"
    },
    "cafe": {
      "label": "Cafe and coffee shop",
      "schemaOrgType": "CafeOrCoffeeShop"
    },
    "bakery": {
      "label": "Bakery",
      "schemaOrgType": "Bakery"
    }
  },
  "schemaOrgType": "Restaurant",
  "conversionLogic": "Diners decide on the menu, the photos of the food, the Google rating and how easy it is to order or get a table. They want the hours, the address and the menu in one tap, and an online order or reservation path that is the restaurant's own.",
  "imageryNotes": "Food, the room and the counter. Until the owner supplies photos, library stock of food and dining rooms only, captioned as placeholders. Never a photo that could pass for this restaurant's dishes or staff.",
  "proofNotes": "Proof is the recorded Google rating and review count, paraphrased review themes, the hours and address, and food photography as owner-to-confirm slots. Menu items, prices, awards, chef names and years open appear only when the lead record sources them.",
  "trustSensitive": false,
  "preferredTrustSignals": [
    "google-rating",
    "review-themes",
    "hours",
    "locations",
    "menu",
    "food",
    "environment",
    "years-in-business"
  ],
  "motionCeiling": "moderate",
  "palettes": {
    "tablecloth-cream": {
      "label": "Tablecloth cream and brick",
      "tone": "light",
      "traits": [
        "warm",
        "family-owned",
        "local"
      ],
      "tokens": {
        "bg": "#f8f1e4",
        "surface": "#fffaf0",
        "ink": "#2a1d14",
        "muted": "#6a5a4b",
        "line": "#e3d6bf",
        "primary": "#a63d21",
        "on-primary": "#ffffff",
        "accent": "#2f5d3a"
      }
    },
    "fire-and-charcoal": {
      "label": "Charcoal and open flame",
      "tone": "dark",
      "traits": [
        "bold",
        "energetic",
        "popular"
      ],
      "tokens": {
        "bg": "#141312",
        "surface": "#1f1d1b",
        "ink": "#f6efe4",
        "muted": "#bdb3a4",
        "line": "#38342f",
        "primary": "#ff6a2b",
        "on-primary": "#141312",
        "accent": "#ffd166"
      }
    },
    "ink-wine": {
      "label": "Ink and wine",
      "tone": "dark",
      "traits": [
        "premium",
        "editorial",
        "artistic"
      ],
      "tokens": {
        "bg": "#17121a",
        "surface": "#221a26",
        "ink": "#f4ece6",
        "muted": "#bfb2b9",
        "line": "#3a2e3f",
        "primary": "#d9a35b",
        "on-primary": "#17121a",
        "accent": "#8d3b57"
      }
    }
  },
  "styleNotes": {
    "order-forward": "Order online is the primary action in the header and hero, linked to the restaurant's own ordering when the owner supplies it; the phone is the visible fallback. Never a third-party platform link presented as the restaurant's own.",
    "visit-forward": "Visit is the primary action: the address, hours and directions are impossible to miss, with a call link beside them.",
    "call-forward": "Tap to call is the primary action: the number is large in the header and hero and sits in a sticky mobile bar; the form or booking path is secondary.",
    "reserve-forward": "Reserve a table is the primary action, with the phone beside it; shown only as a request form until the owner confirms a booking system.",
    "review-led": "The recorded Google rating and review count lead the proof, followed by paraphrased review themes. No quotes, no names.",
    "menu-proof": "Proof through the menu and the food: menu sections as owner-to-confirm slots with library stand-ins captioned as placeholders; no dishes or prices unless the owner supplies them."
  },
  "archetypes": [
    {
      "id": "neighborhood-table",
      "label": "Neighborhood Table",
      "family": "documentary",
      "description": "Warm and local: soft paper tones, humanist type, the menu and hours up front and an order or visit action that is easy to find.",
      "imageryNotes": "The dining room, the counter and the food in natural light; people only as owner-to-confirm slots.",
      "suitableSubIndustries": [
        "restaurant",
        "mexican",
        "pizza",
        "bbq",
        "cafe",
        "bakery"
      ],
      "prefersAttributes": [
        "phone",
        "hours",
        "rating"
      ],
      "suitableBrandTraits": [
        "warm",
        "family-owned",
        "local",
        "community",
        "approachable",
        "bilingual",
        "personal",
        "trusted"
      ],
      "heroes": [
        "editorial-split",
        "image-right",
        "type-led",
        "full-bleed",
        "cinematic"
      ],
      "navigation": [
        "solid",
        "two-tier",
        "conversion-heavy",
        "transparent-overlay",
        "minimal"
      ],
      "typography": [
        "humanist-sans",
        "serif-sans",
        "condensed-sans",
        "grotesk",
        "high-contrast-serif"
      ],
      "layoutRhythms": [
        "alternating",
        "documentary",
        "asymmetric",
        "conversion-heavy",
        "editorial",
        "wide-cinematic"
      ],
      "geometries": [
        "rounded",
        "subtle-radius",
        "hard-edge",
        "mixed",
        "editorial",
        "square"
      ],
      "imagery": [
        "environment-first",
        "lifestyle",
        "documentary",
        "macro-detail",
        "collage",
        "full-bleed",
        "editorial"
      ],
      "motion": [
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "tablecloth-cream"
      ],
      "ctaStyles": [
        "order-forward",
        "visit-forward",
        "call-forward",
        "reserve-forward"
      ],
      "proofStyles": [
        "review-led",
        "menu-proof"
      ],
      "componentDialects": [
        "warm-local",
        "boutique",
        "kinetic",
        "utility",
        "luxury",
        "editorial"
      ],
      "sectionOrders": [
        [
          "hero",
          "menu",
          "food-gallery",
          "about",
          "reviews",
          "hours",
          "locations",
          "contact"
        ],
        [
          "hero",
          "ratings",
          "menu",
          "gallery",
          "reviews",
          "hours",
          "locations",
          "contact"
        ]
      ],
      "requiredModules": [
        "menu",
        "hours",
        "locations"
      ],
      "forbiddenPatterns": [
        "luxury-fashion-layout",
        "cinematic-3d"
      ]
    },
    {
      "id": "counter-service-bold",
      "label": "Counter Service Bold",
      "family": "documentary",
      "description": "Loud, fast and hungry: oversized type, a dark ground, the order button first and big food photography.",
      "imageryNotes": "Close, high contrast food shots and the counter in action; energetic, never staged.",
      "suitableSubIndustries": [
        "restaurant",
        "mexican",
        "pizza",
        "bbq",
        "cafe",
        "bakery"
      ],
      "prefersAttributes": [
        "phone",
        "rating",
        "reviews"
      ],
      "suitableBrandTraits": [
        "bold",
        "energetic",
        "popular",
        "fast",
        "youthful",
        "value",
        "high-energy",
        "highly-rated"
      ],
      "heroes": [
        "type-led",
        "full-bleed",
        "editorial-split",
        "image-right",
        "cinematic"
      ],
      "navigation": [
        "conversion-heavy",
        "solid",
        "two-tier",
        "transparent-overlay",
        "minimal"
      ],
      "typography": [
        "condensed-sans",
        "grotesk",
        "humanist-sans",
        "serif-sans",
        "high-contrast-serif"
      ],
      "layoutRhythms": [
        "asymmetric",
        "conversion-heavy",
        "alternating",
        "documentary",
        "editorial",
        "wide-cinematic"
      ],
      "geometries": [
        "hard-edge",
        "mixed",
        "rounded",
        "subtle-radius",
        "editorial",
        "square"
      ],
      "imagery": [
        "macro-detail",
        "collage",
        "full-bleed",
        "environment-first",
        "lifestyle",
        "documentary",
        "editorial"
      ],
      "motion": [
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "fire-and-charcoal",
        "ink-wine"
      ],
      "ctaStyles": [
        "order-forward",
        "call-forward",
        "visit-forward",
        "reserve-forward"
      ],
      "proofStyles": [
        "review-led",
        "menu-proof"
      ],
      "componentDialects": [
        "kinetic",
        "utility",
        "warm-local",
        "boutique",
        "luxury",
        "editorial"
      ],
      "sectionOrders": [
        [
          "hero",
          "order",
          "menu",
          "food-gallery",
          "reviews",
          "hours",
          "locations",
          "contact"
        ],
        [
          "hero",
          "ratings",
          "order",
          "menu",
          "reviews",
          "locations",
          "hours",
          "contact"
        ]
      ],
      "requiredModules": [
        "order",
        "menu",
        "hours"
      ],
      "forbiddenPatterns": [
        "delicate-luxury-serif",
        "generic-saas"
      ]
    },
    {
      "id": "chef-table-editorial",
      "label": "Chef's Table Editorial",
      "family": "editorial",
      "description": "Refined and image-led: a dark ground, a high contrast serif, large photography and a reservation-led action.",
      "imageryNotes": "Plated dishes and the room at dusk, composed like a magazine spread; owner photos replace the stand-ins.",
      "suitableSubIndustries": [
        "restaurant",
        "mexican",
        "pizza",
        "bbq",
        "cafe",
        "bakery"
      ],
      "prefersAttributes": [
        "rating",
        "sourced-services"
      ],
      "suitableBrandTraits": [
        "premium",
        "editorial",
        "artistic",
        "craftsmanship",
        "boutique",
        "luxury",
        "detail-oriented",
        "high-end"
      ],
      "heroes": [
        "full-bleed",
        "cinematic",
        "editorial-split",
        "image-right",
        "type-led"
      ],
      "navigation": [
        "transparent-overlay",
        "minimal",
        "solid",
        "two-tier",
        "conversion-heavy"
      ],
      "typography": [
        "high-contrast-serif",
        "serif-sans",
        "humanist-sans",
        "condensed-sans",
        "grotesk"
      ],
      "layoutRhythms": [
        "editorial",
        "wide-cinematic",
        "alternating",
        "documentary",
        "asymmetric",
        "conversion-heavy"
      ],
      "geometries": [
        "editorial",
        "square",
        "rounded",
        "subtle-radius",
        "hard-edge",
        "mixed"
      ],
      "imagery": [
        "editorial",
        "full-bleed",
        "macro-detail",
        "environment-first",
        "lifestyle",
        "documentary",
        "collage"
      ],
      "motion": [
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "ink-wine",
        "fire-and-charcoal"
      ],
      "ctaStyles": [
        "reserve-forward",
        "visit-forward",
        "order-forward",
        "call-forward"
      ],
      "proofStyles": [
        "menu-proof",
        "review-led"
      ],
      "componentDialects": [
        "luxury",
        "editorial",
        "warm-local",
        "boutique",
        "kinetic",
        "utility"
      ],
      "sectionOrders": [
        [
          "hero",
          "story",
          "menu",
          "food-gallery",
          "reviews",
          "reservation",
          "hours",
          "locations"
        ],
        [
          "hero",
          "food-gallery",
          "menu",
          "about",
          "reviews",
          "reservation",
          "hours",
          "contact"
        ]
      ],
      "requiredModules": [
        "menu",
        "reservation",
        "hours"
      ],
      "forbiddenPatterns": [
        "cheap-coupon-layout",
        "neon-safety-theme"
      ]
    }
  ]
};
