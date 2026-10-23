// Construction industry profile (added 2026-10-23 so every category in config/categories.json that maps to
// "construction" has a loaded profile). Modelled on roofing.ts: same vocabularies, same truth rule.
//
// Truth rule: licenses, insurance, certifications, warranties, awards, staff and years in business render
// as clearly labelled owner-to-confirm placeholders unless the lead record sources them.
import type { IndustryProfile } from "../schema.ts";

export const construction: IndustryProfile = {
  "id": "construction",
  "label": "Construction",
  "primaryConversions": [
    "request-estimate",
    "call",
    "consultation"
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
  "description": "Concrete, fencing, pools, painting, foundation repair and remodeling contractors.",
  "subIndustries": {
    "concrete": {
      "label": "Concrete contractor",
      "schemaOrgType": "GeneralContractor"
    },
    "fencing": {
      "label": "Fencing contractor",
      "schemaOrgType": "GeneralContractor"
    },
    "pools": {
      "label": "Pool builder and service",
      "schemaOrgType": "GeneralContractor"
    },
    "painting": {
      "label": "Painting contractor",
      "schemaOrgType": "HousePainter"
    },
    "foundation-repair": {
      "label": "Foundation repair",
      "schemaOrgType": "GeneralContractor"
    },
    "remodeling": {
      "label": "Remodeling contractor",
      "schemaOrgType": "GeneralContractor"
    }
  },
  "schemaOrgType": "GeneralContractor",
  "conversionLogic": "Owners hire a contractor for a planned job and compare estimates. They decide on finished work near them, the Google rating, how clear the estimate process is and what happens if something goes wrong (warranty and insurance, to confirm with the owner).",
  "imageryNotes": "Finished jobs, work in progress, materials and crews. Until the owner supplies photos, library stock of the trade only, captioned as placeholders for the owner's projects. Never a photo that could pass for this company's crew or a job it did.",
  "proofNotes": "Proof is the recorded Google rating and review count, paraphrased review themes, the recorded city as the service area and project imagery captioned as placeholders. Licenses, insurance, warranties and years in business appear only as owner-to-confirm slots unless the lead record sources them.",
  "trustSensitive": true,
  "preferredTrustSignals": [
    "real-projects",
    "google-rating",
    "review-themes",
    "licenses",
    "insurance-coverage",
    "warranty",
    "service-area",
    "before-after",
    "crew",
    "financing"
  ],
  "motionCeiling": "moderate",
  "palettes": {
    "slab-grey-orange": {
      "label": "Slab grey and hi-vis orange",
      "tone": "light",
      "traits": [
        "practical",
        "hardworking",
        "commercial"
      ],
      "tokens": {
        "bg": "#eeeeec",
        "surface": "#ffffff",
        "ink": "#1d1f21",
        "muted": "#4c5054",
        "line": "#d2d3d4",
        "primary": "#b23c06",
        "on-primary": "#ffffff",
        "accent": "#1d1f21"
      }
    },
    "timber-oak": {
      "label": "Warm timber and oak",
      "tone": "light",
      "traits": [
        "craftsmanship",
        "residential",
        "premium"
      ],
      "tokens": {
        "bg": "#f5f1ea",
        "surface": "#fffcf7",
        "ink": "#241f1a",
        "muted": "#5d554a",
        "line": "#e1d8c8",
        "primary": "#7a4a22",
        "on-primary": "#ffffff",
        "accent": "#a8895a"
      }
    },
    "plan-blue": {
      "label": "Blueprint blue and sand",
      "tone": "light",
      "traits": [
        "precise",
        "reliable",
        "established"
      ],
      "tokens": {
        "bg": "#f3f4f6",
        "surface": "#ffffff",
        "ink": "#0e1c33",
        "muted": "#4a5568",
        "line": "#d6dbe3",
        "primary": "#1d4a8a",
        "on-primary": "#ffffff",
        "accent": "#c9a45a"
      }
    }
  },
  "styleNotes": {
    "estimate-forward": "Request an estimate is the primary action in the header, the hero and after every proof section; the phone is the always visible fallback.",
    "call-forward": "Tap to call is the primary action: the number is large in the header and hero and sits in a sticky mobile bar; the form or booking path is secondary.",
    "consultation": "A calm consultation request with a short form; no urgency language.",
    "bold-estimate": "Oversized estimate CTA blocks in the display face with the phone beside them; direct and impossible to miss.",
    "call-now": "Call now dominates on mobile and in the hero, with a short line on what happens when you call.",
    "credential-strip": "A compact strip under the hero: recorded Google rating and review count, city and metro served. License, insurance and certification slots are labelled to confirm with the owner.",
    "project-proof": "Proof through finished work: a captioned project set (type, area) built for the owner's photos, stock stand-ins captioned as placeholders.",
    "craftsmanship-proof": "Proof through detail: close images of the work with plain captions about how good work is done, not claims about this company.",
    "review-led": "The recorded Google rating and review count lead the proof, followed by paraphrased review themes. No quotes, no names.",
    "crew-led": "Proof through the crew, as owner-to-confirm team slots with roles; never stock faces presented as the team.",
    "before-after": "Before and after pairs as captioned placeholder slots until the owner supplies real pairs."
  },
  "archetypes": [
    {
      "id": "structural-trade",
      "label": "Structural Trade",
      "family": "industrial",
      "description": "Plain, sturdy and exact: condensed headings, square geometry, spec-sheet cards and a visible estimate path.",
      "imageryNotes": "Forms, rebar, slabs and finished surfaces shot plainly; technical detail over atmosphere.",
      "suitableSubIndustries": [
        "concrete",
        "fencing",
        "pools",
        "painting",
        "foundation-repair",
        "remodeling"
      ],
      "prefersAttributes": [
        "phone",
        "address",
        "sourced-services"
      ],
      "suitableBrandTraits": [
        "practical",
        "hardworking",
        "commercial",
        "reliable",
        "established",
        "direct"
      ],
      "heroes": [
        "utility",
        "editorial-split",
        "full-bleed",
        "type-led"
      ],
      "navigation": [
        "utility-bar",
        "two-tier",
        "transparent-overlay",
        "minimal",
        "solid"
      ],
      "typography": [
        "condensed-sans",
        "mono-accent",
        "serif-sans",
        "grotesk",
        "sans-only"
      ],
      "layoutRhythms": [
        "modular",
        "technical",
        "editorial",
        "wide-cinematic",
        "alternating",
        "asymmetric"
      ],
      "geometries": [
        "square",
        "hard-edge",
        "architectural",
        "subtle-radius",
        "mixed"
      ],
      "imagery": [
        "project-gallery",
        "technical",
        "documentary",
        "full-bleed",
        "material-detail",
        "before-after",
        "collage"
      ],
      "motion": [
        "none",
        "subtle",
        "moderate"
      ],
      "paletteFamilies": [
        "slab-grey-orange",
        "timber-oak",
        "plan-blue"
      ],
      "ctaStyles": [
        "estimate-forward",
        "call-forward",
        "consultation",
        "bold-estimate",
        "call-now"
      ],
      "proofStyles": [
        "credential-strip",
        "project-proof",
        "craftsmanship-proof",
        "review-led",
        "crew-led",
        "before-after"
      ],
      "componentDialects": [
        "industrial",
        "technical",
        "architectural",
        "editorial",
        "utility",
        "documentary"
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
        "estimate-form",
        "service-area"
      ],
      "forbiddenPatterns": [
        "cinematic-3d",
        "luxury-fashion-layout"
      ]
    },
    {
      "id": "craft-build",
      "label": "Craft Build",
      "family": "editorial",
      "description": "Finished work as architecture: large project photography, warm neutrals, a serif and sans pairing and a consultation-led action.",
      "imageryNotes": "Large, calm photographs of finished remodels, fences and outdoor builds; the home as architecture.",
      "suitableSubIndustries": [
        "concrete",
        "fencing",
        "pools",
        "painting",
        "foundation-repair",
        "remodeling"
      ],
      "prefersAttributes": [
        "rating",
        "sourced-services"
      ],
      "suitableBrandTraits": [
        "craftsmanship",
        "residential",
        "premium",
        "architectural",
        "detail-oriented",
        "high-end"
      ],
      "heroes": [
        "full-bleed",
        "editorial-split",
        "utility",
        "type-led"
      ],
      "navigation": [
        "transparent-overlay",
        "minimal",
        "utility-bar",
        "two-tier",
        "solid"
      ],
      "typography": [
        "serif-sans",
        "grotesk",
        "condensed-sans",
        "mono-accent",
        "sans-only"
      ],
      "layoutRhythms": [
        "editorial",
        "wide-cinematic",
        "modular",
        "technical",
        "alternating",
        "asymmetric"
      ],
      "geometries": [
        "architectural",
        "subtle-radius",
        "square",
        "hard-edge",
        "mixed"
      ],
      "imagery": [
        "full-bleed",
        "project-gallery",
        "material-detail",
        "technical",
        "documentary",
        "before-after",
        "collage"
      ],
      "motion": [
        "subtle",
        "moderate",
        "none"
      ],
      "paletteFamilies": [
        "timber-oak",
        "slab-grey-orange",
        "plan-blue"
      ],
      "ctaStyles": [
        "consultation",
        "estimate-forward",
        "call-forward",
        "bold-estimate",
        "call-now"
      ],
      "proofStyles": [
        "craftsmanship-proof",
        "project-proof",
        "credential-strip",
        "review-led",
        "crew-led",
        "before-after"
      ],
      "componentDialects": [
        "architectural",
        "editorial",
        "industrial",
        "technical",
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
    },
    {
      "id": "crew-direct",
      "label": "Crew Direct",
      "family": "documentary",
      "description": "Local, direct and energetic: bold type, the crew and trucks front and center, and a straightforward estimate action.",
      "imageryNotes": "Crews on site, trucks, before and after: documentary and energetic, never glossy.",
      "suitableSubIndustries": [
        "concrete",
        "fencing",
        "pools",
        "painting",
        "foundation-repair",
        "remodeling"
      ],
      "prefersAttributes": [
        "phone",
        "rating",
        "reviews"
      ],
      "suitableBrandTraits": [
        "local",
        "family-owned",
        "straightforward",
        "energetic",
        "working-class",
        "hardworking"
      ],
      "heroes": [
        "type-led",
        "full-bleed",
        "utility",
        "editorial-split"
      ],
      "navigation": [
        "solid",
        "utility-bar",
        "two-tier",
        "transparent-overlay",
        "minimal"
      ],
      "typography": [
        "condensed-sans",
        "sans-only",
        "mono-accent",
        "serif-sans",
        "grotesk"
      ],
      "layoutRhythms": [
        "alternating",
        "asymmetric",
        "modular",
        "technical",
        "editorial",
        "wide-cinematic"
      ],
      "geometries": [
        "square",
        "mixed",
        "hard-edge",
        "architectural",
        "subtle-radius"
      ],
      "imagery": [
        "documentary",
        "before-after",
        "collage",
        "project-gallery",
        "technical",
        "full-bleed",
        "material-detail"
      ],
      "motion": [
        "subtle",
        "moderate",
        "none"
      ],
      "paletteFamilies": [
        "plan-blue",
        "slab-grey-orange",
        "timber-oak"
      ],
      "ctaStyles": [
        "bold-estimate",
        "call-now",
        "estimate-forward",
        "call-forward",
        "consultation"
      ],
      "proofStyles": [
        "review-led",
        "crew-led",
        "before-after",
        "credential-strip",
        "project-proof",
        "craftsmanship-proof"
      ],
      "componentDialects": [
        "utility",
        "documentary",
        "industrial",
        "technical",
        "architectural",
        "editorial"
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
    }
  ]
};
