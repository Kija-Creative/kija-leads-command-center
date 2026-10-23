// Electrical industry profile (added 2026-10-23 so every category in config/categories.json that maps to
// "electrical" has a loaded profile). Modelled on roofing.ts: same vocabularies, same truth rule.
//
// Truth rule: licenses, insurance, certifications, warranties, awards, staff and years in business render
// as clearly labelled owner-to-confirm placeholders unless the lead record sources them.
import type { IndustryProfile } from "../schema.ts";

export const electrical: IndustryProfile = {
  "id": "electrical",
  "label": "Electrical",
  "primaryConversions": [
    "call",
    "request-estimate",
    "appointment"
  ],
  "requiredModules": [
    "services",
    "service-area",
    "reviews",
    "contact",
    "credentials"
  ],
  "defaultForbiddenPatterns": [
    "generic-saas-bento",
    "fake-dashboard-ui",
    "excessive-glassmorphism",
    "unrelated-tech-gradients"
  ],
  "description": "Residential and light commercial electricians: repairs, panels, lighting, EV chargers and emergency calls.",
  "subIndustries": {
    "electrical": {
      "label": "Electrician",
      "schemaOrgType": "Electrician"
    }
  },
  "schemaOrgType": "Electrician",
  "conversionLogic": "Homeowners call an electrician when something fails or a safety concern appears, and request an estimate for planned work such as panels, lighting and chargers. Licensing, insurance and the Google rating decide trust, so they stay visible and honest.",
  "imageryNotes": "Panels, wiring, fixtures and technicians at work, shown plainly and safely. Until the owner supplies photos, library stock of electrical work only, captioned as placeholders. Never a photo that could pass for this company's technicians.",
  "proofNotes": "Proof is the recorded Google rating and review count, paraphrased review themes and the recorded city as the service area. License numbers, insurance, certifications and years in business appear only as owner-to-confirm slots unless the lead record sources them.",
  "trustSensitive": true,
  "preferredTrustSignals": [
    "google-rating",
    "review-themes",
    "licenses",
    "insurance-coverage",
    "service-area",
    "warranty",
    "certifications",
    "years-in-business",
    "crew",
    "real-projects"
  ],
  "motionCeiling": "subtle",
  "palettes": {
    "volt-navy": {
      "label": "Navy and volt yellow",
      "tone": "light",
      "traits": [
        "technical",
        "precise",
        "reliable"
      ],
      "tokens": {
        "bg": "#f3f5f8",
        "surface": "#ffffff",
        "ink": "#0d1b30",
        "muted": "#46526a",
        "line": "#d3d9e3",
        "primary": "#12335f",
        "on-primary": "#ffffff",
        "accent": "#f5c400"
      }
    },
    "breaker-black": {
      "label": "Breaker black and amber",
      "tone": "dark",
      "traits": [
        "urgent-need",
        "fast",
        "bold"
      ],
      "tokens": {
        "bg": "#121315",
        "surface": "#1c1e21",
        "ink": "#f5f3ee",
        "muted": "#b9b6ae",
        "line": "#34373b",
        "primary": "#ffb81c",
        "on-primary": "#121315",
        "accent": "#f5f3ee"
      }
    },
    "porch-light": {
      "label": "Porch light cream and teal",
      "tone": "light",
      "traits": [
        "warm",
        "family-owned",
        "local"
      ],
      "tokens": {
        "bg": "#f7f3e9",
        "surface": "#fffdf6",
        "ink": "#1d2b2b",
        "muted": "#51605d",
        "line": "#ddd7c3",
        "primary": "#0f5d63",
        "on-primary": "#ffffff",
        "accent": "#e0a526"
      }
    }
  },
  "styleNotes": {
    "estimate-forward": "Request an estimate is the primary action in the header, the hero and after every proof section; the phone is the always visible fallback.",
    "call-forward": "Tap to call is the primary action: the number is large in the header and hero and sits in a sticky mobile bar; the form or booking path is secondary.",
    "call-now": "Call now dominates on mobile and in the hero, with a short line on what happens when you call.",
    "appointment-forward": "Schedule a visit is the primary action, with the phone beside it; urgent jobs are pointed at the phone first.",
    "credential-strip": "A compact strip under the hero: recorded Google rating and review count, city and metro served. License, insurance and certification slots are labelled to confirm with the owner.",
    "project-proof": "Proof through finished work: a captioned project set (type, area) built for the owner's photos, stock stand-ins captioned as placeholders.",
    "review-led": "The recorded Google rating and review count lead the proof, followed by paraphrased review themes. No quotes, no names."
  },
  "archetypes": [
    {
      "id": "licensed-technical",
      "label": "Licensed Technical",
      "family": "industrial",
      "description": "Exact and credentialed: engineered type, a grid of services, license and insurance slots up front and low motion.",
      "imageryNotes": "Panels, conduit and clean installs, close and well lit; technical rather than atmospheric.",
      "suitableSubIndustries": [
        "electrical"
      ],
      "prefersAttributes": [
        "phone",
        "address",
        "sourced-services"
      ],
      "suitableBrandTraits": [
        "technical",
        "precise",
        "reliable",
        "established",
        "commercial",
        "detail-oriented"
      ],
      "heroes": [
        "utility",
        "editorial-split",
        "conversion-form",
        "type-led",
        "image-left"
      ],
      "navigation": [
        "utility-bar",
        "two-tier",
        "conversion-heavy",
        "solid"
      ],
      "typography": [
        "mono-accent",
        "grotesk",
        "condensed-sans",
        "industrial-condensed",
        "humanist-sans",
        "serif-sans"
      ],
      "layoutRhythms": [
        "technical",
        "modular",
        "conversion-heavy",
        "alternating",
        "narrative"
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
        "volt-navy",
        "porch-light"
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
        "technical",
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
        "credentials"
      ],
      "forbiddenPatterns": [
        "cinematic-3d",
        "luxury-fashion-layout"
      ]
    },
    {
      "id": "emergency-response",
      "label": "Emergency Response",
      "family": "documentary",
      "description": "When the power is out: a dark ground, a huge phone number, a short path to a call and plain statements of what happens next.",
      "imageryNotes": "Technicians, vans and panels at night and in daylight; honest and functional.",
      "suitableSubIndustries": [
        "electrical"
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
        "image-left"
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
        "mono-accent",
        "grotesk",
        "humanist-sans",
        "serif-sans"
      ],
      "layoutRhythms": [
        "conversion-heavy",
        "alternating",
        "technical",
        "modular",
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
        "project-gallery",
        "macro-detail",
        "environment-first"
      ],
      "motion": [
        "none",
        "subtle"
      ],
      "paletteFamilies": [
        "breaker-black"
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
        "technical",
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
      "id": "family-electrician",
      "label": "Family Electrician",
      "family": "editorial",
      "description": "Friendly and local: warm neutrals, a humanist type pairing, the owner's town front and center and a calm estimate request.",
      "imageryNotes": "Homes, fixtures and tidy installs in natural light; people only as owner-to-confirm slots.",
      "suitableSubIndustries": [
        "electrical"
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
        "trusted",
        "approachable",
        "community",
        "bilingual"
      ],
      "heroes": [
        "editorial-split",
        "image-left",
        "utility",
        "conversion-form",
        "type-led"
      ],
      "navigation": [
        "solid",
        "two-tier",
        "utility-bar",
        "conversion-heavy"
      ],
      "typography": [
        "humanist-sans",
        "serif-sans",
        "mono-accent",
        "grotesk",
        "condensed-sans",
        "industrial-condensed"
      ],
      "layoutRhythms": [
        "alternating",
        "narrative",
        "technical",
        "modular",
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
        "project-gallery",
        "technical",
        "macro-detail"
      ],
      "motion": [
        "subtle",
        "none"
      ],
      "paletteFamilies": [
        "porch-light",
        "volt-navy"
      ],
      "ctaStyles": [
        "appointment-forward",
        "call-forward",
        "estimate-forward",
        "call-now"
      ],
      "proofStyles": [
        "review-led",
        "credential-strip",
        "project-proof"
      ],
      "componentDialects": [
        "warm-local",
        "utility",
        "technical",
        "industrial",
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
        "estimate-form"
      ],
      "forbiddenPatterns": [
        "luxury-fashion-layout",
        "cinematic-3d"
      ]
    }
  ]
};
