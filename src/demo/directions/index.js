// The direction registry. Every direction key from the design briefs has one
// file here, and this is the only file that lists them. Builders replace a
// direction's own file and never need to edit this one.
// Contract for a direction file: src/demo/directions/README.md.

import { direction as barberAfterHours } from "./barber-after-hours.js";
import { direction as barberCoverStory } from "./barber-cover-story.js";
import { direction as barberFadeLab } from "./barber-fade-lab.js";
import { direction as barberGalleryMono } from "./barber-gallery-mono.js";
import { direction as salonLinenEditorial } from "./salon-linen-editorial.js";
import { direction as nailSwatchPop } from "./nail-swatch-pop.js";
import { direction as tattooInkNoir } from "./tattoo-ink-noir.js";
import { direction as petBathClub } from "./pet-bath-club.js";
import { direction as autoNeighborhoodBay } from "./auto-neighborhood-bay.js";
import { direction as autoEuroAtelier } from "./auto-euro-atelier.js";
import { direction as autoCollisionShowroom } from "./auto-collision-showroom.js";
import { direction as autoHeavyDuty } from "./auto-heavy-duty.js";
import { direction as autoValueTire } from "./auto-value-tire.js";
import { direction as autoGlossStudio } from "./auto-gloss-studio.js";
import { direction as autoRoadsideDispatch } from "./auto-roadside-dispatch.js";
import { direction as autoFabShop } from "./auto-fab-shop.js";
import { direction as hsDispatchTriage } from "./hs-dispatch-triage.js";
import { direction as hsWarmModern } from "./hs-warm-modern.js";
import { direction as hsFleetLivery } from "./hs-fleet-livery.js";
import { direction as hsFieldGuide } from "./hs-field-guide.js";
import { direction as hsCalmResponse } from "./hs-calm-response.js";
import { direction as ctDarkCraft } from "./ct-dark-craft.js";
import { direction as ctSiteSurvey } from "./ct-site-survey.js";
import { direction as ctOutdoorLiving } from "./ct-outdoor-living.js";
import { direction as ctLocalCrew } from "./ct-local-crew.js";

// Order is the registry order used for display; assignment does not depend on it
// beyond a stable tiebreak.
export const DIRECTION_LIST = [
  barberAfterHours,
  barberFadeLab,
  barberCoverStory,
  barberGalleryMono,
  salonLinenEditorial,
  nailSwatchPop,
  tattooInkNoir,
  petBathClub,
  autoNeighborhoodBay,
  autoEuroAtelier,
  autoCollisionShowroom,
  autoHeavyDuty,
  autoValueTire,
  autoGlossStudio,
  autoRoadsideDispatch,
  autoFabShop,
  hsDispatchTriage,
  hsWarmModern,
  hsFleetLivery,
  hsFieldGuide,
  hsCalmResponse,
  ctDarkCraft,
  ctSiteSurvey,
  ctOutdoorLiving,
  ctLocalCrew,
];

export const DIRECTIONS = Object.fromEntries(DIRECTION_LIST.map((d) => [d.key, d]));

// The SPEC's category table, for callers that have no categories.json at hand
// (the app's palette list). A passed categories object always wins.
export const CATEGORY_VERTICALS = {
  "auto-repair": "auto",
  "auto-body-collision": "auto",
  "tire-shop": "auto",
  "muffler-exhaust": "auto",
  "diesel-truck-repair": "auto",
  "mobile-mechanic": "auto",
  "auto-detailing": "auto",
  towing: "auto",
  hvac: "home-services",
  plumbing: "home-services",
  electrical: "home-services",
  septic: "home-services",
  "garage-door": "home-services",
  restoration: "home-services",
  "appliance-repair": "home-services",
  "pest-control": "home-services",
  roofing: "contractor",
  concrete: "contractor",
  fencing: "contractor",
  pools: "contractor",
  landscaping: "contractor",
  painting: "contractor",
  "foundation-repair": "contractor",
  remodeling: "contractor",
  "tree-service": "contractor",
  barber: "personal-care",
  "hair-salon": "personal-care",
  "nail-salon": "personal-care",
  tattoo: "personal-care",
  "pet-grooming": "personal-care",
  general: "general",
};

const KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const REQUIRED_TOKENS = ["bg", "surface", "ink", "muted", "line", "primary", "on-primary"];

// Shape check for one direction. Returns readable sentences, never throws.
export function validateDirection(d) {
  const errors = [];
  const name = d && d.key ? `Direction "${d.key}"` : "A direction";
  if (!d || typeof d !== "object") return { ok: false, errors: ["A direction file must export `direction` as an object."] };
  if (!KEY_RE.test(String(d.key || ""))) errors.push(`${name} needs a lowercase hyphenated key.`);
  if (!d.label) errors.push(`${name} needs a label.`);
  if (!Array.isArray(d.suits) || !d.suits.length) errors.push(`${name} needs a non empty suits list of category keys.`);
  for (const k of d.suits || []) if (!CATEGORY_VERTICALS[k]) errors.push(`${name} suits unknown category "${k}".`);
  if (typeof d.fontsHref !== "string" || !/^https:\/\/fonts\.googleapis\.com\//.test(d.fontsHref)) errors.push(`${name} needs a Google Fonts fontsHref.`);
  if (!Array.isArray(d.palettes) || d.palettes.length < 3) errors.push(`${name} needs at least three palettes.`);
  for (const p of d.palettes || []) {
    if (!KEY_RE.test(String(p.key || "")) || !String(p.key).includes("-")) errors.push(`${name} palette "${p.key}" needs a hyphenated key such as "brass-smoke".`);
    if (!p.name) errors.push(`${name} palette "${p.key}" needs a name.`);
    for (const tok of REQUIRED_TOKENS) if (!p.vars || !p.vars[tok]) errors.push(`${name} palette "${p.key}" is missing the ${tok} token.`);
  }
  for (const slot of ["hero", "services", "proof"]) {
    const list = d.variants && d.variants[slot];
    if (!Array.isArray(list) || !list.length) errors.push(`${name} needs at least one ${slot} variant.`);
  }
  if (typeof d.render !== "function") errors.push(`${name} needs a render(ctx) function.`);
  if (!["stub", "implemented"].includes(d.status)) errors.push(`${name} status must be "stub" or "implemented".`);
  if (d.callbar && !["call", "split"].includes(d.callbar)) errors.push(`${name} callbar must be "call" or "split".`);
  return { ok: errors.length === 0, errors };
}

// The directions each vertical can use, for the app's palette picker.
export function directionsForVertical(vertical, categories) {
  return DIRECTION_LIST.filter((d) => d.suits.some((k) => ((categories && categories[k] && categories[k].vertical) || CATEGORY_VERTICALS[k]) === vertical));
}
