// Barbershop industry profile (added 2026-10-23 so every category in config/categories.json that maps to
// "barbershop" has a loaded profile). Modelled on roofing.ts: same vocabularies, same truth rule.
//
// Truth rule: licenses, insurance, certifications, warranties, awards, staff and years in business render
// as clearly labelled owner-to-confirm placeholders unless the lead record sources them.
import type { IndustryProfile } from "../schema.ts";

export const barbershop: IndustryProfile = {
  "id": "barbershop",
  "label": "Barbershop",
  "primaryConversions": [
    "book",
    "call",
    "visit"
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
  "description": "Neighborhood barbershops: cuts, fades, shaves and walk-in or booked chair time.",
  "subIndustries": {
    "barber": {
      "label": "Barber shop",
      "schemaOrgType": "BarberShop"
    }
  },
  "schemaOrgType": "BarberShop",
  "conversionLogic": "Customers choose a barber on the look of the work, the Google rating and how easy it is to get in the chair. They book or walk in, so the hours, the address and the recorded booking link matter more than any copy.",
  "imageryNotes": "Cuts, fades and the shop itself: chairs, mirrors, clippers and the street. Until the owner supplies photos, library stock of barbershop details only, captioned as placeholders; never faces presented as this shop's barbers or clients.",
  "proofNotes": "Proof is the recorded Google rating and review count, paraphrased review themes, the hours and address, and a gallery of work as owner-to-confirm photo slots. Prices, barber names, awards and years open appear only when the lead record sources them.",
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
    "pole-cream-navy": {
      "label": "Cream, barber navy and red",
      "tone": "light",
      "traits": [
        "heritage",
        "traditional",
        "old-school"
      ],
      "tokens": {
        "bg": "#f5f0e6",
        "surface": "#fffcf5",
        "ink": "#14213d",
        "muted": "#4f5668",
        "line": "#ddd4c0",
        "primary": "#b3202a",
        "on-primary": "#ffffff",
        "accent": "#14213d"
      }
    },
    "chair-black-gold": {
      "label": "Chair black and brass",
      "tone": "dark",
      "traits": [
        "modern",
        "bold",
        "premium"
      ],
      "tokens": {
        "bg": "#121212",
        "surface": "#1d1d1d",
        "ink": "#f3efe6",
        "muted": "#b8b2a4",
        "line": "#363636",
        "primary": "#d6a84a",
        "on-primary": "#121212",
        "accent": "#f3efe6"
      }
    },
    "block-concrete-lime": {
      "label": "Concrete and street lime",
      "tone": "light",
      "traits": [
        "community",
        "youthful",
        "energetic"
      ],
      "tokens": {
        "bg": "#ececea",
        "surface": "#ffffff",
        "ink": "#161616",
        "muted": "#4b4b48",
        "line": "#d0d0cc",
        "primary": "#1c1c1c",
        "on-primary": "#d7ff3f",
        "accent": "#d7ff3f"
      }
    }
  },
  "styleNotes": {
    "book-forward": "Book an appointment is the primary action. Use the recorded booking link when the lead has one; otherwise a request form and the phone, never an invented booking system.",
    "walk-in-or-book": "Show the recorded hours and address beside a book or call action, so a walk-in customer and a planned one both have a clear next step.",
    "call-now": "Call now dominates on mobile and in the hero, with a short line on what happens when you call.",
    "review-led": "The recorded Google rating and review count lead the proof, followed by paraphrased review themes. No quotes, no names.",
    "portfolio-proof": "Proof through the work itself: a grid of finished results as owner-to-confirm photo slots, with stock stand-ins clearly captioned as placeholders."
  },
  "archetypes": [
    {
      "id": "classic-barbershop",
      "label": "Classic Barbershop",
      "family": "editorial",
      "description": "Heritage and craft: a serif and sans pairing, warm paper tones, a barber-pole accent and a calm, confident layout.",
      "imageryNotes": "Chairs, straight razors, tile and mirrors in warm light; the craft of the cut.",
      "suitableSubIndustries": [
        "barber"
      ],
      "prefersAttributes": [
        "rating",
        "hours"
      ],
      "suitableBrandTraits": [
        "heritage",
        "traditional",
        "old-school",
        "craftsmanship",
        "established",
        "personal"
      ],
      "heroes": [
        "editorial-split",
        "centered",
        "full-bleed",
        "gallery",
        "type-led",
        "asymmetric"
      ],
      "navigation": [
        "centered-brand",
        "solid",
        "transparent-overlay",
        "minimal",
        "conversion-heavy"
      ],
      "typography": [
        "serif-sans",
        "high-contrast-serif",
        "grotesk",
        "neo-grotesk",
        "condensed-sans"
      ],
      "layoutRhythms": [
        "editorial",
        "narrative",
        "gallery",
        "portfolio",
        "asymmetric",
        "alternating"
      ],
      "geometries": [
        "editorial",
        "subtle-radius",
        "square",
        "architectural",
        "hard-edge",
        "mixed"
      ],
      "imagery": [
        "editorial",
        "macro-detail",
        "portfolio",
        "full-bleed",
        "documentary",
        "collage",
        "people-first"
      ],
      "motion": [
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "pole-cream-navy",
        "block-concrete-lime"
      ],
      "ctaStyles": [
        "book-forward",
        "walk-in-or-book",
        "call-now"
      ],
      "proofStyles": [
        "review-led",
        "portfolio-proof"
      ],
      "componentDialects": [
        "editorial",
        "boutique",
        "portfolio",
        "luxury",
        "kinetic",
        "utility"
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
        "hours",
        "booking"
      ],
      "forbiddenPatterns": [
        "neon-safety-theme",
        "generic-saas"
      ]
    },
    {
      "id": "modern-cuts-studio",
      "label": "Modern Cuts Studio",
      "family": "editorial",
      "description": "Dark, sharp and image-led: large photography of the work, tight type, and a booking action that is always visible.",
      "imageryNotes": "Close, high contrast photographs of fades and line-ups; the work is the headline.",
      "suitableSubIndustries": [
        "barber"
      ],
      "prefersAttributes": [
        "rating",
        "reviews",
        "booking-link"
      ],
      "suitableBrandTraits": [
        "modern",
        "bold",
        "premium",
        "visual",
        "detail-oriented",
        "high-end"
      ],
      "heroes": [
        "full-bleed",
        "gallery",
        "editorial-split",
        "centered",
        "type-led",
        "asymmetric"
      ],
      "navigation": [
        "transparent-overlay",
        "minimal",
        "centered-brand",
        "solid",
        "conversion-heavy"
      ],
      "typography": [
        "grotesk",
        "neo-grotesk",
        "serif-sans",
        "high-contrast-serif",
        "condensed-sans"
      ],
      "layoutRhythms": [
        "gallery",
        "portfolio",
        "editorial",
        "narrative",
        "asymmetric",
        "alternating"
      ],
      "geometries": [
        "square",
        "architectural",
        "editorial",
        "subtle-radius",
        "hard-edge",
        "mixed"
      ],
      "imagery": [
        "portfolio",
        "macro-detail",
        "full-bleed",
        "editorial",
        "documentary",
        "collage",
        "people-first"
      ],
      "motion": [
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "chair-black-gold"
      ],
      "ctaStyles": [
        "book-forward",
        "walk-in-or-book",
        "call-now"
      ],
      "proofStyles": [
        "portfolio-proof",
        "review-led"
      ],
      "componentDialects": [
        "portfolio",
        "luxury",
        "editorial",
        "boutique",
        "kinetic",
        "utility"
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
          "gallery",
          "services",
          "reviews",
          "about",
          "booking",
          "contact"
        ]
      ],
      "requiredModules": [
        "portfolio",
        "booking"
      ],
      "forbiddenPatterns": [
        "cheap-coupon-layout",
        "delicate-luxury-serif"
      ]
    },
    {
      "id": "neighborhood-cutz",
      "label": "Neighborhood Cutz",
      "family": "documentary",
      "description": "Loud, local and proud: oversized type, a street-level palette, community first and the walk-in message front and center.",
      "imageryNotes": "The block, the chairs and the crowd waiting; documentary and lively, never staged.",
      "suitableSubIndustries": [
        "barber"
      ],
      "prefersAttributes": [
        "phone",
        "hours",
        "bilingual"
      ],
      "suitableBrandTraits": [
        "community",
        "grassroots",
        "energetic",
        "youthful",
        "bilingual",
        "local",
        "high-energy",
        "popular"
      ],
      "heroes": [
        "type-led",
        "asymmetric",
        "editorial-split",
        "centered",
        "full-bleed",
        "gallery"
      ],
      "navigation": [
        "solid",
        "conversion-heavy",
        "centered-brand",
        "transparent-overlay",
        "minimal"
      ],
      "typography": [
        "condensed-sans",
        "grotesk",
        "serif-sans",
        "high-contrast-serif",
        "neo-grotesk"
      ],
      "layoutRhythms": [
        "asymmetric",
        "alternating",
        "editorial",
        "narrative",
        "gallery",
        "portfolio"
      ],
      "geometries": [
        "hard-edge",
        "mixed",
        "editorial",
        "subtle-radius",
        "square",
        "architectural"
      ],
      "imagery": [
        "documentary",
        "collage",
        "people-first",
        "editorial",
        "macro-detail",
        "portfolio",
        "full-bleed"
      ],
      "motion": [
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "block-concrete-lime",
        "pole-cream-navy"
      ],
      "ctaStyles": [
        "walk-in-or-book",
        "call-now",
        "book-forward"
      ],
      "proofStyles": [
        "review-led",
        "portfolio-proof"
      ],
      "componentDialects": [
        "kinetic",
        "utility",
        "editorial",
        "boutique",
        "portfolio",
        "luxury"
      ],
      "sectionOrders": [
        [
          "hero",
          "services",
          "gallery",
          "reviews",
          "hours",
          "booking",
          "contact"
        ],
        [
          "hero",
          "ratings",
          "portfolio",
          "team",
          "hours",
          "contact"
        ]
      ],
      "requiredModules": [
        "hours",
        "phone-cta"
      ],
      "forbiddenPatterns": [
        "luxury-fashion-layout",
        "delicate-luxury-serif"
      ]
    }
  ]
};
