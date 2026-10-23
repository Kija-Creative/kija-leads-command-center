// Plumbing industry profile (added 2026-10-23 so every category in config/categories.json that maps to
// "plumbing" has a loaded profile). Modelled on roofing.ts: same vocabularies, same truth rule.
//
// Truth rule: licenses, insurance, certifications, warranties, awards, staff and years in business render
// as clearly labelled owner-to-confirm placeholders unless the lead record sources them.
import type { IndustryProfile } from "../schema.ts";

export const plumbing: IndustryProfile = {
  "id": "plumbing",
  "label": "Plumbing",
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
  "description": "Residential plumbing: repairs, drains, water heaters, remodels and emergency calls.",
  "subIndustries": {
    "plumbing": {
      "label": "Plumber",
      "schemaOrgType": "Plumber"
    }
  },
  "schemaOrgType": "Plumber",
  "conversionLogic": "Homeowners call a plumber when water is where it should not be, and book planned work such as water heaters and remodels. They choose on speed, the Google rating, licensing and a clear service area, so the phone leads and trust is visible.",
  "imageryNotes": "Fixtures, pipes, water heaters and technicians at work. Until the owner supplies photos, library stock of plumbing work only, captioned as placeholders. Never a photo that could pass for this company's technicians.",
  "proofNotes": "Proof is the recorded Google rating and review count, paraphrased review themes and the recorded city as the service area. Licenses, insurance, guarantees and years in business appear only as owner-to-confirm slots unless the lead record sources them.",
  "trustSensitive": true,
  "preferredTrustSignals": [
    "google-rating",
    "review-themes",
    "service-area",
    "licenses",
    "insurance-coverage",
    "warranty",
    "real-projects",
    "crew",
    "years-in-business",
    "financing"
  ],
  "motionCeiling": "moderate",
  "palettes": {
    "night-call-navy": {
      "label": "Night call navy and aqua",
      "tone": "dark",
      "traits": [
        "urgent-need",
        "fast",
        "bold"
      ],
      "tokens": {
        "bg": "#0f1824",
        "surface": "#182333",
        "ink": "#eef3f7",
        "muted": "#aebccb",
        "line": "#2d3b4e",
        "primary": "#4fd1e8",
        "on-primary": "#0f1824",
        "accent": "#ffb347"
      }
    },
    "pipe-blue-copper": {
      "label": "Pipe blue and copper",
      "tone": "light",
      "traits": [
        "reliable",
        "practical",
        "trusted"
      ],
      "tokens": {
        "bg": "#f2f6f9",
        "surface": "#ffffff",
        "ink": "#0b1f33",
        "muted": "#44586c",
        "line": "#d1dde7",
        "primary": "#0d5a8f",
        "on-primary": "#ffffff",
        "accent": "#b8622c"
      }
    },
    "hometown-brick": {
      "label": "Hometown brick and cream",
      "tone": "light",
      "traits": [
        "local",
        "family-owned",
        "warm"
      ],
      "tokens": {
        "bg": "#f7f1e6",
        "surface": "#fffcf4",
        "ink": "#2a1f1a",
        "muted": "#62544a",
        "line": "#e3d7c2",
        "primary": "#9c3b22",
        "on-primary": "#ffffff",
        "accent": "#1f4d63"
      }
    }
  },
  "styleNotes": {
    "call-now": "Call now dominates on mobile and in the hero, with a short line on what happens when you call.",
    "call-forward": "Tap to call is the primary action: the number is large in the header and hero and sits in a sticky mobile bar; the form or booking path is secondary.",
    "estimate-forward": "Request an estimate is the primary action in the header, the hero and after every proof section; the phone is the always visible fallback.",
    "appointment-forward": "Schedule a visit is the primary action, with the phone beside it; urgent jobs are pointed at the phone first.",
    "review-led": "The recorded Google rating and review count lead the proof, followed by paraphrased review themes. No quotes, no names.",
    "credential-strip": "A compact strip under the hero: recorded Google rating and review count, city and metro served. License, insurance and certification slots are labelled to confirm with the owner.",
    "project-proof": "Proof through finished work: a captioned project set (type, area) built for the owner's photos, stock stand-ins captioned as placeholders."
  },
  "archetypes": [
    {
      "id": "twenty-four-seven-responder",
      "label": "24/7 Responder",
      "family": "documentary",
      "description": "For the burst pipe: a dark ground, a huge phone number, a short path to a call and plain statements of what happens next.",
      "imageryNotes": "Technicians, vans and fixtures in honest light; functional, never staged.",
      "suitableSubIndustries": [
        "plumbing"
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
        "practical"
      ],
      "heroes": [
        "conversion-form",
        "type-led",
        "utility",
        "editorial-split",
        "image-right"
      ],
      "navigation": [
        "conversion-heavy",
        "solid",
        "utility-bar",
        "two-tier"
      ],
      "typography": [
        "condensed-sans",
        "industrial-condensed",
        "grotesk",
        "humanist-sans",
        "sans-only"
      ],
      "layoutRhythms": [
        "conversion-heavy",
        "alternating",
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
        "documentary",
        "technical",
        "project-gallery",
        "macro-detail",
        "environment-first"
      ],
      "motion": [
        "subtle",
        "none"
      ],
      "paletteFamilies": [
        "night-call-navy"
      ],
      "ctaStyles": [
        "call-now",
        "call-forward",
        "estimate-forward",
        "appointment-forward"
      ],
      "proofStyles": [
        "review-led",
        "credential-strip",
        "project-proof"
      ],
      "componentDialects": [
        "utility",
        "documentary",
        "industrial",
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
      "id": "clean-tech",
      "label": "Clean Tech",
      "family": "industrial",
      "description": "Orderly and credentialed: a clear services grid, license and insurance slots up front, squared geometry and a visible estimate path.",
      "imageryNotes": "Fixtures, pipework and clean installs in even light; technical rather than atmospheric.",
      "suitableSubIndustries": [
        "plumbing"
      ],
      "prefersAttributes": [
        "phone",
        "address",
        "sourced-services"
      ],
      "suitableBrandTraits": [
        "reliable",
        "practical",
        "trusted",
        "precise",
        "established",
        "commercial"
      ],
      "heroes": [
        "utility",
        "editorial-split",
        "conversion-form",
        "type-led",
        "image-right"
      ],
      "navigation": [
        "utility-bar",
        "two-tier",
        "conversion-heavy",
        "solid"
      ],
      "typography": [
        "grotesk",
        "condensed-sans",
        "industrial-condensed",
        "humanist-sans",
        "sans-only"
      ],
      "layoutRhythms": [
        "modular",
        "technical",
        "conversion-heavy",
        "alternating",
        "documentary"
      ],
      "geometries": [
        "square",
        "subtle-radius",
        "hard-edge",
        "rounded"
      ],
      "imagery": [
        "technical",
        "project-gallery",
        "macro-detail",
        "documentary",
        "environment-first"
      ],
      "motion": [
        "none",
        "subtle"
      ],
      "paletteFamilies": [
        "pipe-blue-copper",
        "hometown-brick"
      ],
      "ctaStyles": [
        "estimate-forward",
        "call-forward",
        "call-now",
        "appointment-forward"
      ],
      "proofStyles": [
        "credential-strip",
        "project-proof",
        "review-led"
      ],
      "componentDialects": [
        "industrial",
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
        "estimate-form",
        "service-area"
      ],
      "forbiddenPatterns": [
        "cinematic-3d",
        "luxury-fashion-layout"
      ]
    },
    {
      "id": "hometown-plumber",
      "label": "Hometown Plumber",
      "family": "documentary",
      "description": "Friendly and local: warm neutrals, humanist type, the owner's town front and center and a calm booking action.",
      "imageryNotes": "Homes, kitchens and tidy installs in natural light; people only as owner-to-confirm slots.",
      "suitableSubIndustries": [
        "plumbing"
      ],
      "prefersAttributes": [
        "rating",
        "phone",
        "bilingual"
      ],
      "suitableBrandTraits": [
        "local",
        "family-owned",
        "warm",
        "approachable",
        "community",
        "trusted",
        "bilingual"
      ],
      "heroes": [
        "editorial-split",
        "image-right",
        "conversion-form",
        "type-led",
        "utility"
      ],
      "navigation": [
        "solid",
        "two-tier",
        "conversion-heavy",
        "utility-bar"
      ],
      "typography": [
        "humanist-sans",
        "sans-only",
        "condensed-sans",
        "industrial-condensed",
        "grotesk"
      ],
      "layoutRhythms": [
        "alternating",
        "documentary",
        "conversion-heavy",
        "modular",
        "technical"
      ],
      "geometries": [
        "rounded",
        "subtle-radius",
        "hard-edge",
        "square"
      ],
      "imagery": [
        "environment-first",
        "documentary",
        "technical",
        "project-gallery",
        "macro-detail"
      ],
      "motion": [
        "subtle",
        "none"
      ],
      "paletteFamilies": [
        "hometown-brick",
        "pipe-blue-copper"
      ],
      "ctaStyles": [
        "appointment-forward",
        "call-forward",
        "call-now",
        "estimate-forward"
      ],
      "proofStyles": [
        "review-led",
        "credential-strip",
        "project-proof"
      ],
      "componentDialects": [
        "warm-local",
        "utility",
        "documentary",
        "industrial"
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
