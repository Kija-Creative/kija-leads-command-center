// Home Services industry profile (added 2026-10-23 so every category in config/categories.json that maps to
// "home-services" has a loaded profile). Modelled on roofing.ts: same vocabularies, same truth rule.
//
// Truth rule: licenses, insurance, certifications, warranties, awards, staff and years in business render
// as clearly labelled owner-to-confirm placeholders unless the lead record sources them.
import type { IndustryProfile } from "../schema.ts";

export const homeServices: IndustryProfile = {
  "id": "home-services",
  "label": "Home Services",
  "primaryConversions": [
    "call",
    "appointment",
    "request-estimate"
  ],
  "requiredModules": [
    "services",
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
  "description": "Septic, garage doors, restoration, appliance repair, pest control and other local home service businesses.",
  "subIndustries": {
    "septic": {
      "label": "Septic service",
      "schemaOrgType": "HomeAndConstructionBusiness"
    },
    "garage-door": {
      "label": "Garage door repair",
      "schemaOrgType": "HomeAndConstructionBusiness"
    },
    "restoration": {
      "label": "Water, fire and mold restoration",
      "schemaOrgType": "HomeAndConstructionBusiness"
    },
    "appliance-repair": {
      "label": "Appliance repair",
      "schemaOrgType": "HomeAndConstructionBusiness"
    },
    "pest-control": {
      "label": "Pest control",
      "schemaOrgType": "HomeAndConstructionBusiness"
    },
    "general-local-service": {
      "label": "Local service",
      "schemaOrgType": "LocalBusiness"
    }
  },
  "schemaOrgType": "HomeAndConstructionBusiness",
  "conversionLogic": "Homeowners search when something breaks or needs service, often urgently. They call first and book after, and they pick the business with a clear service list, a good Google rating, the service area they live in and fast response.",
  "imageryNotes": "Vans, technicians, tools and the work in context. Until the owner supplies photos, library stock of the trade only, captioned as placeholders. Never a photo that could pass for this company's technicians or a job it did.",
  "proofNotes": "Proof is the recorded Google rating and review count, paraphrased review themes and the recorded city as the service area. Licenses, insurance, response times, guarantees and years in business appear only as owner-to-confirm slots unless the lead record sources them.",
  "trustSensitive": true,
  "preferredTrustSignals": [
    "google-rating",
    "review-themes",
    "service-area",
    "licenses",
    "insurance-coverage",
    "warranty",
    "real-projects",
    "before-after",
    "years-in-business",
    "crew"
  ],
  "motionCeiling": "moderate",
  "palettes": {
    "dispatch-blue-orange": {
      "label": "Dispatch blue and orange",
      "tone": "light",
      "traits": [
        "fast",
        "reliable",
        "practical"
      ],
      "tokens": {
        "bg": "#f2f5f9",
        "surface": "#ffffff",
        "ink": "#0c1d36",
        "muted": "#475770",
        "line": "#d3dbe6",
        "primary": "#124a8c",
        "on-primary": "#ffffff",
        "accent": "#e8730c"
      }
    },
    "neighbor-sage": {
      "label": "Sage and brick",
      "tone": "light",
      "traits": [
        "local",
        "warm",
        "family-owned"
      ],
      "tokens": {
        "bg": "#f4f4ec",
        "surface": "#fffffa",
        "ink": "#1f2a22",
        "muted": "#525c50",
        "line": "#dcdcca",
        "primary": "#2f5d46",
        "on-primary": "#ffffff",
        "accent": "#b4532a"
      }
    },
    "specialist-slate": {
      "label": "Slate and mint",
      "tone": "light",
      "traits": [
        "specialist",
        "precise",
        "calm"
      ],
      "tokens": {
        "bg": "#f1f4f4",
        "surface": "#ffffff",
        "ink": "#14232a",
        "muted": "#4a5c63",
        "line": "#d2dcdd",
        "primary": "#0b5f6d",
        "on-primary": "#ffffff",
        "accent": "#7fd1b9"
      }
    }
  },
  "styleNotes": {
    "call-forward": "Tap to call is the primary action: the number is large in the header and hero and sits in a sticky mobile bar; the form or booking path is secondary.",
    "estimate-forward": "Request an estimate is the primary action in the header, the hero and after every proof section; the phone is the always visible fallback.",
    "appointment-forward": "Schedule a visit is the primary action, with the phone beside it; urgent jobs are pointed at the phone first.",
    "credential-strip": "A compact strip under the hero: recorded Google rating and review count, city and metro served. License, insurance and certification slots are labelled to confirm with the owner.",
    "review-led": "The recorded Google rating and review count lead the proof, followed by paraphrased review themes. No quotes, no names.",
    "before-after": "Before and after pairs as captioned placeholder slots until the owner supplies real pairs."
  },
  "archetypes": [
    {
      "id": "dispatch-ready",
      "label": "Dispatch Ready",
      "family": "industrial",
      "description": "Built for the urgent call: the phone and a short form always in reach, a clear service grid and a visible service area.",
      "imageryNotes": "Vans, technicians and the job in progress, shown plainly and cropped tight.",
      "suitableSubIndustries": [
        "septic",
        "garage-door",
        "restoration",
        "appliance-repair",
        "pest-control",
        "general-local-service"
      ],
      "prefersAttributes": [
        "phone",
        "hours",
        "address"
      ],
      "suitableBrandTraits": [
        "fast",
        "urgent-need",
        "reliable",
        "practical",
        "direct",
        "commercial"
      ],
      "heroes": [
        "utility",
        "conversion-form",
        "editorial-split",
        "image-right",
        "centered"
      ],
      "navigation": [
        "utility-bar",
        "conversion-heavy",
        "solid",
        "two-tier",
        "minimal"
      ],
      "typography": [
        "condensed-sans",
        "grotesk",
        "humanist-sans",
        "sans-only",
        "neo-grotesk"
      ],
      "layoutRhythms": [
        "modular",
        "conversion-heavy",
        "alternating",
        "documentary",
        "narrative"
      ],
      "geometries": [
        "square",
        "subtle-radius",
        "rounded",
        "architectural"
      ],
      "imagery": [
        "documentary",
        "project-gallery",
        "environment-first",
        "technical",
        "macro-detail",
        "before-after"
      ],
      "motion": [
        "none",
        "subtle"
      ],
      "paletteFamilies": [
        "dispatch-blue-orange",
        "neighbor-sage",
        "specialist-slate"
      ],
      "ctaStyles": [
        "call-forward",
        "estimate-forward",
        "appointment-forward"
      ],
      "proofStyles": [
        "credential-strip",
        "review-led",
        "before-after"
      ],
      "componentDialects": [
        "utility",
        "industrial",
        "warm-local",
        "clinical",
        "minimal"
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
        "luxury-fashion-layout"
      ]
    },
    {
      "id": "friendly-neighbor",
      "label": "Friendly Neighbor",
      "family": "documentary",
      "description": "Warm, local and plain-spoken: humanist type, soft greens, the owner's town and a calm booking action.",
      "imageryNotes": "Homes, porches and tidy work in natural light; people only as owner-to-confirm slots.",
      "suitableSubIndustries": [
        "septic",
        "garage-door",
        "restoration",
        "appliance-repair",
        "pest-control",
        "general-local-service"
      ],
      "prefersAttributes": [
        "rating",
        "phone",
        "bilingual"
      ],
      "suitableBrandTraits": [
        "local",
        "warm",
        "family-owned",
        "approachable",
        "community",
        "trusted",
        "bilingual"
      ],
      "heroes": [
        "editorial-split",
        "image-right",
        "utility",
        "conversion-form",
        "centered"
      ],
      "navigation": [
        "solid",
        "two-tier",
        "utility-bar",
        "conversion-heavy",
        "minimal"
      ],
      "typography": [
        "humanist-sans",
        "sans-only",
        "condensed-sans",
        "grotesk",
        "neo-grotesk"
      ],
      "layoutRhythms": [
        "alternating",
        "documentary",
        "modular",
        "conversion-heavy",
        "narrative"
      ],
      "geometries": [
        "rounded",
        "subtle-radius",
        "square",
        "architectural"
      ],
      "imagery": [
        "environment-first",
        "documentary",
        "project-gallery",
        "technical",
        "macro-detail",
        "before-after"
      ],
      "motion": [
        "subtle",
        "none"
      ],
      "paletteFamilies": [
        "neighbor-sage",
        "dispatch-blue-orange",
        "specialist-slate"
      ],
      "ctaStyles": [
        "appointment-forward",
        "call-forward",
        "estimate-forward"
      ],
      "proofStyles": [
        "review-led",
        "credential-strip",
        "before-after"
      ],
      "componentDialects": [
        "warm-local",
        "utility",
        "industrial",
        "clinical",
        "minimal"
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
    },
    {
      "id": "specialist-clean",
      "label": "Specialist Clean",
      "family": "editorial",
      "description": "Precise and calm for specialist work: cool neutrals, a grotesk type pairing, a step-by-step process and an estimate-led action.",
      "imageryNotes": "Equipment, clean workmanship and results in even light; technical detail over atmosphere.",
      "suitableSubIndustries": [
        "septic",
        "garage-door",
        "restoration",
        "appliance-repair",
        "pest-control",
        "general-local-service"
      ],
      "prefersAttributes": [
        "rating",
        "sourced-services"
      ],
      "suitableBrandTraits": [
        "specialist",
        "precise",
        "calm",
        "detail-oriented",
        "modern",
        "clinical"
      ],
      "heroes": [
        "editorial-split",
        "centered",
        "utility",
        "conversion-form",
        "image-right"
      ],
      "navigation": [
        "minimal",
        "solid",
        "utility-bar",
        "conversion-heavy",
        "two-tier"
      ],
      "typography": [
        "neo-grotesk",
        "grotesk",
        "condensed-sans",
        "humanist-sans",
        "sans-only"
      ],
      "layoutRhythms": [
        "modular",
        "narrative",
        "conversion-heavy",
        "alternating",
        "documentary"
      ],
      "geometries": [
        "subtle-radius",
        "architectural",
        "square",
        "rounded"
      ],
      "imagery": [
        "technical",
        "macro-detail",
        "before-after",
        "documentary",
        "project-gallery",
        "environment-first"
      ],
      "motion": [
        "subtle",
        "none"
      ],
      "paletteFamilies": [
        "specialist-slate",
        "dispatch-blue-orange",
        "neighbor-sage"
      ],
      "ctaStyles": [
        "estimate-forward",
        "appointment-forward",
        "call-forward"
      ],
      "proofStyles": [
        "credential-strip",
        "before-after",
        "review-led"
      ],
      "componentDialects": [
        "clinical",
        "minimal",
        "utility",
        "industrial",
        "warm-local"
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
        "estimate-form",
        "process"
      ],
      "forbiddenPatterns": [
        "neon-safety-theme",
        "generic-saas"
      ]
    }
  ]
};
