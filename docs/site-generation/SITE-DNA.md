# Site DNA: the Design Intelligence Engine

Every generated prospect site gets a Site DNA fingerprint before any frontend work. The DNA is
chosen by the engine in `src/design-intelligence/`, persisted with the site, compared with recent
sites, and checked again by the design audit after the site is built. This file is the contract
for everyone who writes industries, dialects, references or the renderer.

Source documents: `docs/site-generation/IMPLEMENTATION-BRIEF-v2.md` (Jamey's consolidated v2
specification, binding, wins where it differs), `docs/site-generation/IMPLEMENTATION-BRIEF.md`
(his v1 brief, verbatim) and `design-intelligence/SPEC-site-dna.md` (his rules, dialect example
and roofing example). Project content rules in `SPEC.md` and `AGENTS.md` win over every design
rule.

## 1. Inspection note (2026-09-29, before the engine was built)

- **Framework.** None. Node 24, zero runtime dependencies, ES modules, 2 space house style. The
  server is `server/server.js` on `node:http`, bound to 127.0.0.1:4242, reading files fresh on
  every request. The UI in `app/` is vanilla browser ES modules with a hash router (`#/week`,
  `#/pipeline`, `#/lead/<id>`, `#/present/<id>`, `#/queue`, `#/runs`, `#/coverage`,
  `#/settings`). No bundler, no framework, no TypeScript before this engine.
- **Routing.** Server API routes are a table in `server/server.js` (`GET /api/state`,
  `PATCH /api/leads/:id`, `POST /api/leads/:id/demo`, `/pitch`, `/export`, queue decisions,
  settings) plus static routes for `/app/*`, `/demos/<id>/`, `/pitches/<id>/`, `/exports/*`.
- **Persistence.** JSON files, no database. `src/lib/store.js` (`createStore(root)`) reads
  `data/*.json` and `config/*.json`, writes atomically and keeps rotating backups in
  `data/backups/`. Generated pages live in `demos/<id>/index.html` and `pitches/<id>/index.html`
  (both gitignored, private, never published).
- **Lead schema.** `SPEC.md` "Lead": id, business, category, categoryKey, city, area, state,
  metro, address, phone, googleRating, googleReviews, ratingSource, websiteGap, ticketValue,
  visualFit, websiteStatus, presence, confidence, whyKija, pitchAngle, demoConcept, services,
  reviewThemes, languages, established, hours, demoCopy, sources, verification, outreach
  (append only history), demo `{ builtAt, template, direction, palette, variants, shareApproved }`,
  roiOverrides, addedAt, origin, runId. Every fact is sourced or absent.
- **Website generation.** `src/demo/render.js` `renderDemo(lead, { categories, now, assignment })`
  renders one dependency free HTML file per lead from one of 25 design directions in
  `src/demo/directions/` (each a layout, type pairing, palettes and variants). `src/demo/assign.js`
  picked a direction, palette and variants per lead by least use within a vertical, concept
  keywords and a hash. `src/cli/build-demos.js` renders, runs `checkDemoHtml`
  (`src/demo/guardrails.js`: ribbon, claims, rating match, stock photos only, no dashes, no
  network) and records the choice on `lead.demo`. Result Jamey saw: 16 of 20 leads are auto shops
  sharing one skeleton with a palette change.
- **AI generation workflow.** No model is called from code. A Cowork scheduled task runs
  `WEEKLY_RUN.md` through the Workflow script `workflows/weekly-research.js`: plan, research
  agents with independent verification, a batch file, `npm run ingest`, then `npm run demos` and
  `npm run pitches`. Directions were hand built by Claude sessions from `research/design-*.md`.
  Agents therefore need a constrained, written brief; that is what `npm run brief` now produces.

What changed: this engine supersedes `assign.js` as the only source of a demo's design. The
renderer builds from `SITE_DNA.json`, not from a direction pick.

## 2. Pipeline (v2)

```
lead
  -> classifyLead          config/categories.json industry + subIndustry (never guessed from the name)
  -> businessAttributes    phone, address, hours, sourced services, bilingual, rating, booking link, established
  -> inferBrandTraits      verified fields only, each trait cites its field
  -> conversionObjective   the industry's conversions, reordered by attributes and traits
  -> scoreArchetypes       select-archetype.ts: suitability gate, then traits, conversion, business
                           type, imagery, verified attributes, a bounded recent similarity penalty;
                           the seed only breaks exact ties
  -> Site DNA candidates   every axis ordered by trait affinity, family preference, then seed
  -> variation check       global window (last 8, at least 6 of 13 differ) and same industry window
                           (last 4 of the industry, always compared, at least 7 differ), the hard
                           clone rule, duplicate prevention
  -> repair when too similar, in v2's order
  -> SiteDnaRecord         demos/<id>/SITE_DNA.json, lead.demo.dna, data/site-dna-history.json
  -> buildGenerationBrief  demos/<id>/BRIEF.md in v2's brief shape
  -> renderer              renderSite(record, lead, ctx)
  -> auditSite             { pass, warnings, failures, similarityIssues, requiredFixes }
```

**Repair order (v2).** 1 another appropriate archetype, 2 hero architecture, 3 typography
classification, 4 recompose the section order, 5 layout rhythm, 6 geometry, 7 imagery strategy,
8 component dialect, 9 navigation architecture (`REPAIR_ORDER` in `select-site-dna.ts`). Steps
are cumulative (step 4 may also change what steps 2 and 3 unlocked). Colour never changes alone:
motion, CTA, proof and palette only move in last resort steps together with every structural
axis (`LAST_RESORT_AXES`). If nothing inside the appropriate archetypes differs enough, the best
fit is returned with `variation.valid: false` and a warning for a person to resolve.

**Suitability first.** An archetype is not appropriate when a lead trait is in its
`excludedBrandTraits`; when it is a high motion kinetic direction (a kinetic dialect or family,
or only kinetic and cinematic motion) in a trust sensitive industry (`trustSensitive: true`, or
the ids medical, dental, law, finance, accounting, insurance) unless the archetype sets
`permitsHighMotion` or the run passes `allowHighMotion`; when "explore another direction" rules
out the current archetype; or when its trait fit is under half the best fit. Inappropriate
archetypes always rank below appropriate ones, so no penalty, seed or variation can make one win.
Trust sensitive industries without their own `motionCeiling` are capped at moderate motion.

**Archetype score** (appropriate ones, best first): trait fit x 10 + conversion fit x 2
(3 when the archetype leads with the primary conversion, 2 when it lists it or a CTA style
matches) + business type (+6 when `suitableSubIndustries` names the lead's sub-industry, -2 when
it names others) + imagery (only when the run passes available photos: a photography led
direction with no fitting photo -6, fewer than three -2; a type capable one with none +1) +
verified attributes (+2 for each `prefersAttributes` value the record has) - recent similarity
penalty (4, 3, 2, 1 for each of the last four same industry sites that used this archetype, most
recent first, plus 1 per other recent site, at most `SIMILARITY_PENALTY_CAP` = 8, below one unit of
trait fit). Every term is written to `record.archetypeScores`.

**Measurable difference.** Compared on 13 dimensions (archetype, hero, navigation, typography,
paletteFamily, layoutRhythm, geometry, imagery, motion, ctaStyle, proofStyle, componentDialect,
sectionOrder) through Jamey's `compareSiteDNA`. A candidate is valid when it differs on at least 6
from every site in the global window, on at least 7 (`SAME_INDUSTRY_MIN_DIFFERING`) from every
site in the same industry window, shares not all four of hero, section order, typography and
geometry with any of them, and is identical to no DNA anywhere in the history. The windows come
from the leads that first appeared in the history before this lead, so regenerating a lead gives
the same answer. The optional treatments v2 names (headerBehavior, buttonTreatment,
cardTreatment, backgroundTreatment, spacingDensity, contentDensity) are reported per comparison
(`optionalDiffering`, `optionalMatching`) and never counted toward the six. `variationScore` is the
minimum difference ratio across both windows (1 with nothing to compare; 6 of 13 is 0.462);
`industryScore` is the same over the industry window.

**Determinism.** `buildSeed` hashes exactly `${leadId}:${businessName}:${domain}:${industry}`
(values trimmed; `domainOf(lead)` is the domain, else the website host without www, else "")
with Jamey's `hashString` (FNV-1a). The seed only orders options of equal fit. No
`Math.random()`, no clock in the choice (`now` is only stamped on records).

## 3. File layout

```
src/design-intelligence/
  schema.ts             Jamey's types plus vocabularies (v2 values, ComponentDialect, treatments,
                        TRUST_SIGNAL_KEYS), SiteDnaRecord, LeadDnaSnapshot, AuditResult
  seed.ts               hashString, seededIndex, seededPick (Jamey) + seedInput, buildSeed, domainOf, seededOrder
  variation.ts          compareSiteDNA, validateAgainstHistory (Jamey) + variationScore, findDuplicate,
                        checkCandidate, checkRecent (global and same industry), compareOptionalDimensions,
                        dnaFingerprint, SAME_INDUSTRY_MIN_DIFFERING
  design-tokens.ts      FONT_PAIRINGS, GEOMETRY_TOKENS, MOTION_RULES, axis meanings, trait
                        affinities, GLOBAL_FORBIDDEN_DEFAULTS, DETECTABLE_PATTERNS
  modules.ts            MODULE_CATALOG (label, job, truth kind, source fields), PAGE_LABELS
  trust-signals.ts      TRUST_SIGNALS (which lead fields may source each signal), trustSignalTruth
  contrast.ts           WCAG contrast, palette checks
  traits.ts             businessAttributes, inferBrandTraits
  industries.ts         loadIndustries, getIndustry, listIndustries, classifyLead, checkCategoryMapping
  industries/<id>.ts    one IndustryProfile per file (roofing.ts supplied by Jamey)
  archetypes.ts         base families loader (design-intelligence/archetypes/*.json)
  component-dialects.ts dialect loader, dialectParts, isDialectId and the DialectPrimitives contract
  references.ts         reference loader and selectReferences
  history.ts            HistoryRepository (jsonHistoryRepository, memoryHistoryRepository),
                        HistorySource, comparison pool and windows, append, cap, queries
  select-archetype.ts   scoreArchetypes, selectArchetype, isHighMotionArchetype, isTrustSensitive
  select-site-dna.ts    selectSiteDna, regenerateSiteDna, exploreAnotherDirection, overrideSiteDna,
                        lock, unlock, override bounds, snapshots, truth plan, LOCKED_AXES
  prompt-builder.ts     buildGenerationBrief, divergenceBlock, BRIEF_SHAPE, AUTHORITY_STATEMENT
  markers.ts            dnaAttributes, moduleAttributes, ctaAttribute, dnaRootCss, aliases
  renderer-contract.ts  RenderSite, ModuleRegistry, AxisImplementations, modulePlan, coverageErrors
  html.ts               the audit's HTML and CSS reader
  audit.ts              auditSite, auditSiteWithVisual, VisualSimilarityProvider, noopVisualSimilarity
  index.ts              public API and createEngine()
design-intelligence/
  archetypes/<family>.json          base families (editorial.json written as the pattern)
  components/<dialect>/dialect.json + primitives.ts   (editorial, editorial-luxury written)
  references/*.json                 references
data/site-dna-history.json          { version, cap, note, entries[] }
demos/<id>/SITE_DNA.json            the per-site record (a SiteDnaRecord, never a bare SiteDNA)
demos/<id>/BRIEF.md                 the generation brief
src/cli/dna.js brief.js audit.js build.js typecheck.js lint.js
test/di-*.test.ts                   engine tests (fixtures in di-fixtures.ts, di-page.ts);
                                    di-v2.test.ts holds v2's nine tests
```

JavaScript callers import only `src/design-intelligence/index.ts` (Node 24 strips the types).
TypeScript here uses erasable syntax only (no enums, namespaces or parameter properties) and
relative imports carry the `.ts` extension. Running `.ts` directly needs Node 22.18 or later
(`package.json` engines still says `>=22`).

## 4. Vocabularies (exact values)

The unions below are Jamey's v1 values plus the v2 additions (widened, nothing removed). Every
value has a meaning, and the tables are typed `Record<Union, ...>`, so a new value does not
compile until it has one.

- Hero: full-bleed, editorial-split, centered, search-first, cinematic, asymmetric, product-demo,
  utility, type-led, gallery, project-led, image-left, image-right, layered, minimal-copy,
  conversion-form, split-screen
- Navigation: transparent-overlay, solid, two-tier, utility-bar, minimal, editorial, mega-menu,
  sidebar, floating, centered-brand, conversion-heavy
- Typography: serif-sans, sans-only, condensed-sans, editorial-serif, humanist-sans, grotesk,
  geometric, mono-accent, high-contrast-serif, industrial-condensed, neo-grotesk, warm-serif (each
  has two or three Google Fonts pairings in `FONT_PAIRINGS`; none is Inter)
- Layout rhythm: editorial, dense-grid, wide-cinematic, alternating, modular, asymmetric, gallery,
  technical, narrative, conversion-heavy, catalog, magazine, portfolio, documentary
- Geometry: square, subtle-radius, rounded, pill, mixed, architectural, hard-edge, organic,
  editorial (tokens and the accepted --radius-control range in `GEOMETRY_TOKENS`)
- Imagery: full-bleed, documentary, project-gallery, product-ui, portfolio, cutout, technical,
  editorial, lifestyle, macro-detail, collage, before-after, people-first, environment-first,
  material-detail
- Motion: none, subtle, moderate, kinetic, cinematic (limits in `MOTION_RULES`)
- ComponentDialect (`COMPONENT_DIALECTS`): utility, editorial, clinical, luxury, industrial,
  technical, boutique, kinetic, commerce, portfolio, institutional, minimal, warm-local,
  architectural, documentary, performance. A dialect id (`DialectId`) is one of these or a
  compound of two, first parent first (`editorial-luxury`, `warm-local-boutique`). Any other value
  in an archetype's `componentDialects` or a `dialect.json` id is a load error.
- Treatments (optional, `TREATMENT_AXES`; archetype `treatments` lists, the industry's
  `treatments` as defaults):
  - headerBehaviors: static, sticky, sticky-condensing, hide-on-scroll, transparent-to-solid, sticky-mobile-bar
  - footerStyles: minimal, directory, contact-led, editorial, map-led, utility, oversized-type
  - backgroundTreatments: continuous-light, continuous-dark, tonal-shift, border-separated,
    dark-sections, full-bleed-imagery, material-texture, oversized-type, split-image,
    gallery-sequence, technical-grid, minimal-whitespace
  - buttonTreatments: solid-block, solid-soft, outline, underline-link, text-arrow, pill, oversized-block
  - cardTreatments: none, hairline-border, flat-tonal, image-led, spec-sheet, elevated, numbered-list
  - imageShapes: full-bleed, rectangle, landscape, portrait, square, arched, rounded, cutout, mixed-crop
  - iconStyles: none, line, solid, numerals, technical-glyph, hand-drawn
  - spacingDensities: compact, balanced, airy; contentDensities: sparse, balanced, dense
  - storytellingModes: direct-response, project-story, craft-story, founder-story, documentary,
    methodology, editorial-essay, product-led, place-led, menu-led, mission-led
  - mobilePriorities: call-first, book-first, form-first, menu-first, search-first, donate-first, content-first
  - localBusinessStrategies: service-area, single-location, multi-location, destination, regional, online-first
  - seoStrategies: local-service-pages, location-pages, practice-area-pages, condition-pages,
    menu-and-hours, listing-pages, portfolio-pages, product-pages, content-hub
- TrustSignalKey (`TRUST_SIGNAL_KEYS`, for `preferredTrustSignals`): google-rating, review-themes,
  verified-reviews, service-area, locations, hours, phone, services, team, credentials,
  certifications, licenses, insurance-coverage, years-in-business, awards, press, real-projects,
  before-after, warranty, financing, crew, manufacturer-certifications, attorneys, education,
  bar-admissions, practice-experience, case-experience, consultation-structure, providers,
  insurance-accepted, hospital-affiliation, patient-process, technology, regulatory-disclosures,
  process, resources, food, menu, chef, environment, amenities, instructors, coaches,
  methodology, studio, schedule, community, class-descriptions, portfolio, client-list, impact,
  transparency, programs, equipment, capabilities, industries-served, product-reviews,
  return-policy. Only google-rating, verified-reviews, review-themes, service-area, locations,
  hours, phone, services and years-in-business can be sourced from a lead record; every other
  signal is always an owner-to-confirm slot.
- AttributeSignal (`ATTRIBUTE_SIGNALS`, for `prefersAttributes`): phone, address, hours,
  booking-link, rating, reviews, sourced-services, established-year, bilingual
- BrandTrait (`BRAND_TRAITS`): established, heritage, practical, reliable, commercial, direct,
  premium, craftsmanship, residential, architectural, high-end, local, energetic, hardworking,
  family-owned, straightforward, bilingual, community, urgent-need, fast, value, trusted,
  highly-rated, popular, emerging, warm, approachable, personal, calm, precise, clinical,
  specialist, modern, bold, editorial, expressive, playful, luxury, boutique, minimal, organic,
  performance, technical, innovative, institutional, documentary, grassroots, cinematic, artistic,
  detail-oriented, old-school, visual, traditional, community-oriented, high-energy, industrial,
  youthful, creative, working-class
- ConversionKey (`CONVERSION_KEYS`): call, request-estimate, inspection, quote, book, appointment,
  consultation, reserve, order, check-availability, tour, valuation, search, intro-offer,
  membership, demo, signup, purchase, donate, volunteer, rfq, enroll, visit, contact
- ModuleKey (`MODULE_KEYS`, each with a job and truth kind in `MODULE_CATALOG`): hero, phone-cta,
  estimate-form, estimate, quote, emergency, emergency-or-estimate, contact, faq, process, services,
  service-area, locations, hours, availability, reviews, ratings, trust-strip, why-us, about, story,
  team, gallery, pricing, booking, appointment, consultation, project-proof, projects,
  selected-projects, project-gallery, before-after, craftsmanship, materials, credentials,
  warranty, financing, crew, brand-position, testimonial-story, practice-areas, attorneys,
  experience, case-studies, providers, conditions, insurance, patient-info, patient-comfort,
  first-visit, property-search, featured-properties, neighborhoods, agent, valuation, tour, menu,
  reservation, order, food-gallery, rooms, experiences, amenities, treatments, results, portfolio,
  intro-offer, classes, methodology, schedule, instructors, memberships, community, product-demo,
  use-cases, integrations, signup, client-logos, product-discovery, product-detail, merchandising,
  cart, checkout, mission, impact, programs, stories, volunteer, donate, transparency, work,
  philosophy, studio, capabilities, industries-served, equipment, certifications, rfq, admissions,
  events, disclosures

A new value is added in `schema.ts` (and, for a module, a catalog entry in `modules.ts`); loaders
reject unknown values with a sentence (an unknown trust signal is a warning and renders as an
owner-to-confirm slot).

Traits are inferred only from: categoryKey (1), city (1, "local"), reviewThemes (2), languages
(2, "bilingual"), googleRating and googleReviews bands (1 to 2), demoConcept wording (3),
pitchAngle wording (2), and a sourced established year (3, "established"; 25 years or more also
"heritage"). "family-owned" needs a review theme that says so. Wording such as "decades of trust"
never produces a claim trait.

## 5. Industries and categories

Industries are discovered from `src/design-intelligence/industries/*.ts` at runtime (files starting
with `_`, `.d.ts`, tests and an `index.ts` re-export module are skipped). `config/categories.json`
gives every category an `industry` and `subIndustry`:

| categories | industry | subIndustry |
|---|---|---|
| auto-repair, auto-body-collision, tire-shop, muffler-exhaust, diesel-truck-repair, mobile-mechanic, auto-detailing, towing | automotive | auto-repair, collision, tires, exhaust, diesel-fleet, mobile-mechanic, detailing, towing |
| hvac / plumbing / electrical | hvac / plumbing / electrical | same as the key |
| septic, garage-door, restoration, appliance-repair, pest-control, general | home-services | same as the key, general-local-service |
| roofing | roofing | roofing |
| concrete, fencing, pools, painting, foundation-repair, remodeling | construction | same as the key |
| landscaping, tree-service | landscaping | same as the key |
| barber | barbershop | barber |
| hair-salon, nail-salon | beauty-spa | same as the key |
| tattoo | tattoo | tattoo |
| pet-grooming | pet-grooming | pet-grooming |

Profiles needed for today's 20 leads: automotive (16 leads), barbershop (2), home-services (1),
roofing (1, done). v2's full list also needs hvac, plumbing, electrical, construction, law,
medical, dental, finance, accounting, insurance, real-estate, restaurant, hospitality, beauty-spa,
pilates-wellness, gym-fitness, saas-technology, ecommerce, nonprofit, education,
architecture-interiors, industrial-manufacturing, photography-creative, plus landscaping, tattoo
and pet-grooming for our categories.

### How to add an industry

Create `src/design-intelligence/industries/<id>.ts` (file name equals the id). Nothing else
changes (v2 test 9 proves it); `npm run typecheck` and the loader tell you what is wrong.

```ts
import type { IndustryProfile } from "../schema.ts";

export const automotive: IndustryProfile = {
  id: "automotive",
  label: "Automotive",
  primaryConversions: ["call", "request-estimate", "book"],        // CONVERSION_KEYS, best first
  requiredModules: ["services", "reviews", "hours", "locations"],  // MODULE_KEYS
  preferredTrustSignals: ["google-rating", "review-themes", "services", "hours", "locations", "certifications", "warranty"], // v2, TRUST_SIGNAL_KEYS
  defaultForbiddenPatterns: ["generic-saas-bento", "fake-dashboard-ui"],
  subIndustries: { "auto-repair": { label: "Auto repair", schemaOrgType: "AutoRepair" }, collision: { label: "Collision", schemaOrgType: "AutoBodyShop" } },
  schemaOrgType: "AutoRepair",
  conversionLogic: "How customers choose, one or two sentences.",
  imageryNotes: "What the photography must show.",
  proofNotes: "What counts as proof, and what may never be claimed.",
  trustSensitive: true,            // optional: health, law, finance, home access (restrained motion)
  motionCeiling: "moderate",       // optional: no archetype may exceed it (load error)
  treatments: { localBusinessStrategies: ["single-location"], seoStrategies: ["local-service-pages"] }, // optional defaults
  palettes: {                      // required tokens for every paletteFamily named below
    "garage-steel": { label: "Garage steel", tone: "light", traits: ["practical"], tokens: { bg: "#f2f3f1", surface: "#ffffff", ink: "#15191d", muted: "#4a535c", line: "#d3d7da", primary: "#a84300", "on-primary": "#ffffff", accent: "#f2b705" } },
  },
  styleNotes: { "call-forward": "What this CTA style means here." }, // every ctaStyle and proofStyle
  archetypes: [                    // at least two; v2 asks for three strong ones
    {
      id: "neighborhood-bay",
      label: "Neighborhood Bay",
      description: "One or two sentences.",                      // v2 Archetype field (warning when missing)
      family: "documentary",                                      // design-intelligence/archetypes/<family>.json
      suitableBrandTraits: ["local", "trusted", "warm"],          // BRAND_TRAITS
      excludedBrandTraits: ["luxury"],                            // optional
      primaryConversions: ["call"],                               // optional, subset of the industry's
      suitableSubIndustries: ["auto-repair"],                     // optional, business type fit
      prefersAttributes: ["phone", "hours", "rating"],            // optional, ATTRIBUTE_SIGNALS
      imageryDemand: "medium",                                    // optional: low | medium | high (derived otherwise)
      permitsHighMotion: false,                                   // optional: only for a deliberate kinetic direction
      heroes: ["utility", "editorial-split"],
      navigation: ["utility-bar", "solid"],
      typography: ["grotesk", "humanist-sans"],
      layoutRhythms: ["modular", "alternating"],
      geometries: ["subtle-radius", "square"],
      imagery: ["documentary", "technical"],
      motion: ["none", "subtle"],
      paletteFamilies: ["garage-steel"],
      ctaStyles: ["call-forward"],
      proofStyles: ["review-led"],
      componentDialects: ["utility"],                             // DialectId values
      sectionOrders: [["hero", "ratings", "services", "why-us", "process", "hours", "contact"]], // start with hero, 4+ sections, no repeats
      requiredModules: ["phone-cta"],
      forbiddenPatterns: ["luxury-fashion-layout"],
      treatments: {                                               // optional v2 treatments
        headerBehaviors: ["sticky-mobile-bar"],
        buttonTreatments: ["solid-block"],
        cardTreatments: ["hairline-border", "spec-sheet"],
        spacingDensities: ["compact", "balanced"],
        mobilePriorities: ["call-first"],
      },
    },
  ],
};
```

Load checks (errors unless noted): id and file name, every vocabulary value (dialect ids and
treatment values included), palette tokens present and WCAG AA (ink and muted on bg, ink on
surface, on-primary on primary at 4.5:1), section orders, module keys, conversions, font pairing
ids, attribute signals, imageryDemand, the motion ceiling. Warnings: no preferredTrustSignals, an
unknown trust signal, an archetype without a description, a dialect or family without a folder
yet, a style without a note, only two archetypes, a kinetic option in a trust sensitive industry.

## 6. Base archetype families and dialects

A family (`design-intelligence/archetypes/<id>.json`, see `editorial.json`) is a cross-industry
design language: `id, label, summary, character[], suitableBrandTraits[], heroes, navigation,
typography, layout, geometry, imagery` (each `{ preferred[], notes }`), `motion { ceiling, notes }`,
`defaultDialects[], principles[], forbiddenPatterns[], references[]`. Families break ties among
values the industry archetype already allows, cap motion, and add principles to the brief. A
family with id `kinetic` marks its archetypes as high motion. Named by roofing and still to write:
industrial, documentary (plus cinematic, clinical, luxury, kinetic, technical, boutique per
SPEC-site-dna.md).

A dialect is `design-intelligence/components/<id>/dialect.json`:
`{ id, label, summary, extends?, allowed[], forbidden[], forbiddenPatterns[], behaviors[], primitives? }`
plus `primitives.ts` exporting `primitives: DialectPrimitives` with `dialect`, `css(theme)`,
`button(input)`, `sectionHeading(input)`, `card(input)`, `field(input)`, `placeholder(input)`.
The id must be a DialectId (one of the sixteen, or a compound of two). Primitives read only the
:root tokens (no colour, font or radius literals), prefix classes `dx-`, escape their text,
include `:focus-visible` and reduced motion, and write markers through `markers.ts`. They should
honour `theme.dna.buttonTreatment`, `cardTreatment` and `iconStyle` when the DNA carries them. A
compound (`editorial-luxury`, exactly as in SPEC-site-dna.md) lists `extends`, inherits its
parents' lists and the first parent's primitives. Written: editorial, editorial-luxury. Named by
roofing and still to write: industrial, utility, luxury.

References (`design-intelligence/references/*.json`, one object or `{ references: [] }`):
`{ id, title, source: "design-playbooks" | "skynet-site-system" | "kija-research" | "other", path,
license, industries[] ("*" for cross-industry), archetypes[] ("<industry>/<archetype>"),
families[], dialects[], takeaways[] (our words), avoid[]? }`. Only references matching the
industry or archetype (or cross-industry with a matching family) are used, at most four.

## 7. Per-site record, history, locking and regeneration

`SiteDnaRecord` (demos/<id>/SITE_DNA.json): version, leadId, business, industryLabel,
archetypeLabel, dna (the full `SiteDNA`: v2's required fields including `subIndustry` (always
populated), `variationScore` and `locked`, plus `fontPairing`, the resolved `palette`,
`secondaryConversion` and `conversionSecondary`, `schemaType`, `trustSignals`, the treatments the
archetype defines, `mobilePriority` and `fingerprint`), fingerprint, classification, attributes,
brandTraits (with evidence), conversion, archetypeScores (with every scoring term), variation
`{ score, industryScore, valid, comparedWith, industryComparedWith, minDiffering,
industryMinDiffering, lookback, industryLookback, duplicateOf, comparisons[] (with sameIndustry,
required, optionalDiffering), repairs[], candidatesChecked }`, reasoningSummary[],
referencesUsed[], truth `{ facts[], sources[], modules[], placeholders[], neverClaim[],
trustSignals[{ signal, label, status, value, note }] }`, facts, locked, lockedBy, lockedAt,
overridden, override, audit, createdAt, updatedAt.

`lead.demo.dna` holds `LeadDnaSnapshot` (file, fingerprint, industry, archetype, variation score
and validity, lock fields, overridden, audit pass and score, updatedAt and the full `dna`), so a
lock survives when the gitignored `demos/` folder is gone.

**History.** Selection, the brief and the audit take a `HistorySource`: a `HistoryRepository`
(`jsonHistoryRepository(file)` for data/site-dna-history.json, written atomically on every append;
`memoryHistoryRepository()` for tests and dry runs), a `HistoryFile` value or a list of entries.
A path is refused. The repository answers `append`, `all`, `recent(n)`, `byIndustry(id, n?)`,
`byArchetype(id, n?)`, `latestPerLead` and `snapshot`; the cap is at least 50 (default 500).
Events: select, regenerate, explore, override, lock, unlock, build.

**Locking** (`lockRecord(record, { by, now })`). A locked DNA keeps `LOCKED_AXES`: archetype,
typography (and its font pairing), palette family, layout rhythm, geometry, hero, section order
and component dialect. A plain run rebuilds the record around them with fresh facts, traits,
truth and copy (`reused` stays true while the fingerprint is unchanged). Overriding or exploring a
locked DNA is refused with a sentence; `unlock` lets it choose again.

**Regenerate** (`regenerateSiteDna`, `npm run dna -- --regenerate`): keeps facts, industry and
the conversion objective, and picks another valid combination deterministically: it must differ
from the lead's current DNA on at least six dimensions, pass both windows, and never return to a
DNA this lead has had before (relaxed to "not identical" with a warning when nothing else fits).
Under a lock only the free axes (navigation, imagery, motion, CTA, proof) move.

**Explore another direction** (`exploreAnotherDirection`, `--explore`): the same, with the current
archetype ruled out; an error sentence when no other archetype is appropriate.

**Override** (`overrideSiteDna`, `--set <field>=<value>`): archetype, palette family, typography,
hero, layout rhythm and every other axis must be inside the industry and archetype bounds (a human
may also reorder exactly the sections of an allowed order); overrides may add forbidden patterns
and required modules but never remove them; the record is stored with `overridden: true`, and a
too similar override is kept with a warning because a person chose it.

## 8. Generation brief (npm run brief)

`buildGenerationBrief` opens with `AUTHORITY_STATEMENT` ("SITE DNA IS THE VISUAL AUTHORITY ...
may not be ignored"), then v2's shape exactly, each a `## ` heading in `BRIEF_SHAPE` order:
BUSINESS, INDUSTRY, ARCHETYPE, PRIMARY CONVERSION, BRAND TRAITS, DESIGN LANGUAGE, HERO, TYPOGRAPHY,
LAYOUT, GEOMETRY, IMAGERY, MOTION, PALETTE, COMPONENT DIALECT, SECTION ORDER, REQUIRED, AVOID. After
them: TRUTH RULES (the recorded facts table, sources, sourced trust signals with their exact
values, the unsourced ones as owner-to-confirm, never claim), DIVERGENCE FROM RECENT SITES (the
RECENT <INDUSTRY> WEBSITE DNA block in the exact form of the v1 example), REFERENCES (selected
references and how design-playbooks and skynet are used), CODE SOURCES (library roles: behaviour
only, restyled to the DNA), PERFORMANCE AND ACCESSIBILITY, MARKERS THE AUDIT READS. The JSON twin
carries `authority`, `shape[]`, `axes[]`, `treatments[]`, `trustSignals[]`, `codeSources[]` and
`referenceFlow[]` beside everything else.

## 9. Renderer contract

`renderSite(record, lead, ctx) -> html` (`RenderSite` in `renderer-contract.ts`):

- Root element: `dnaAttributes(dna)` (data-dna fingerprint plus data-dna-archetype, -hero,
  -navigation, -typography, -layout, -geometry, -imagery, -motion, -palette, -cta, -proof,
  -dialect, -industry). First CSS: `dnaRootCss(dna)` (radius, font and palette tokens).
- Fonts: exactly `fontsHref(dna.fontPairing)`; `--font-display` and `--font-body` only.
- Sections: `modulePlan(dna)` gives each section of `dna.sectionOrder` its index and the required
  modules embedded in it, and puts `phone-cta` in the header. Each section is
  `<section moduleAttributes([key, ...embedded], index)>`; each embedded module element carries
  `moduleAttributes(key)`. Claim word keys are written as neutral tokens
  (warranty `coverage-terms`, financing `payment-options`, insurance `plans-accepted`,
  certifications `standards`) because the guardrail scans the whole source.
- `ModuleRegistry` (Partial<Record<ModuleKey, ModuleRenderer>>) renders each module from
  `ModuleRenderInput { key, index, embedded, truth, record, lead, ctx }`.
- `AxisImplementations` has one implementation per vocabulary value for hero, navigation,
  typography, layoutRhythm, geometry, imagery and motion. `coverageErrors(dna, modules, axes)`
  lists what is missing; a renderer must return none for every DNA it accepts.
- v2 treatments: when the DNA carries headerBehavior, footerStyle, backgroundTreatment,
  buttonTreatment, cardTreatment, imageShape, iconStyle, spacingDensity, contentDensity or
  mobilePriority, the page follows them (they are optional, so a renderer must work without
  them). Never a white, grey, white, grey section alternation.
- Truth: a module with status placeholder renders `primitives.placeholder` or carries
  `data-placeholder="owner-to-confirm"`, headed with `pageLabel(key)` ("Coverage on the work",
  "Payment options", ...). Placeholder copy must avoid every guardrail claim word. Trust signals
  come only from `record.truth.trustSignals` entries with status sourced, stated exactly as their
  `value`. The rating proof still follows `src/demo/guardrails.js` (data-rating, data-reviews,
  "Google reviews").
- CTAs: `ctaAttribute(conversion)` on every conversion control; the primary conversion in the hero
  and in the closing section; a `tel:` link with `data-cta="call"` whenever the industry converts
  by call and the record has a phone.
- Motion within `MOTION_RULES[dna.motion]`, a `prefers-reduced-motion: reduce` rule whenever
  motion is not none, `:focus-visible` styles, 44px phone targets, viewport meta, width media
  queries, landmarks, one h1, labelled inputs, alt text.
- Write `SITE_DNA.json` only through `writeRecord` in `src/cli/dna.js` (a `SiteDnaRecord`). A bare
  `SiteDNA` in that file is ignored with a warning and overwritten by the next `npm run dna`.

## 10. Audit

`auditSite({ html, record, profile, history, lead?, now? })` returns v2's `{ pass, warnings,
failures, similarityIssues, requiredFixes }` plus `score, flags[], checks[], checkedAt,
fingerprint, visual`. Checks: similarity (both windows, the stricter same industry bar, the clone
rule, duplicates), required-modules (markers, section order, placeholders), forbidden-patterns
(pill buttons on most button rules, bento, radial or blurred glow, blue to purple gradients,
backdrop-filter, Inter as the body face, three identical feature cards, identical testimonial
cards, dashboard UI), cta-architecture, dna-fidelity (markers, fingerprint, radius and font tokens,
fonts request, durations, keyframes, reduced motion, palette tokens), fabricated-trust and
guardrails (`checkDemoHtml` reused), responsive, accessibility (lang, landmarks, headings, alt,
labels, computed AA contrast of the declared tokens, focus-visible, 44px phone links),
component-library-look (shadcn and Preline default signatures). An error fails the page; score is
100 minus 15 per error and 5 per warning.

Visual similarity: `auditSiteWithVisual({ ..., visual })` takes a `VisualSimilarityProvider`
`{ id, kind: "screenshot" | "embedding" | "image-hash", threshold, available(), compare(input) }`
where `input` carries the page, its DNA and the recent sites of both windows. A match at or above
the threshold is a similarity failure. The default `noopVisualSimilarity` never runs and says so
in `result.visual.note`; this project has no screenshot infrastructure yet.

## 11. Commands

- `npm run dna -- --id <id> | --all [--unlock] [--lock] [--regenerate] [--explore] [--set <field>=<value> ...] [--by <name>] [--dry-run]`
  (`--set` takes archetype, paletteFamily, typography, hero, layoutRhythm, navigation, geometry,
  imagery, motion, ctaStyle, proofStyle, componentDialect, primaryConversion, fontPairing,
  industry, sectionOrder as a comma list; one lead only)
- `npm run brief -- --id <id>` writes `demos/<id>/BRIEF.md` and `SITE_DNA.json`
- `npm run audit -- --id <id> | --all`
- `npm run build [-- --root <dir>] [--skip <step,...>]`: dna for every lead, briefs, demos,
  pitches, the audit, `npm run check` and the typecheck, in that order; every step runs and the
  report names each failure; exit 1 when any step failed. There is no bundler.
- `npm run typecheck` (tsc strict, noEmit, borrowed from ./node_modules, KIJA_TOOLS_DIR or
  ../kija-os/node_modules; says so and exits 1 when none is found)
- `npm run lint` (ESLint with a built in flat config, same tool search; workflows/*.js are
  Workflow scripts and are not linted)
- `npm test` runs `test/**/*.test.js` and `test/**/*.test.ts`

## 12. Demonstration (v2, three fake leads, from the fixtures)

Run in order through one history, with six fitting stock photos each.

DEMO 1, ABC Roofing (fixture), premium residential:

```
Industry: roofing (Roofing contractor, RoofingContractor)
Archetype: Premium Residential   Traits: high-end, premium, residential, craftsmanship, architectural
Primary conversion: request-estimate, secondary call   Mobile: form-first
Hero: full-bleed   Navigation: transparent-overlay   Typography: serif-sans (Newsreader + Public Sans)
Palette: warm-architectural   Layout: editorial   Geometry: architectural
Imagery: project-gallery   Motion: subtle   Dialect: luxury
Sections: hero > projects > craftsmanship > services > materials > process > warranty > reviews > estimate
CTA: project-estimate   Proof: project-story
Variation: 1 (first site)
```

DEMO 2, Example Family Roofing (fixture), family-owned local roofer:

```
Archetype: Blue-Collar Modern   Traits: local, community, fast, hardworking, straightforward, bold
Primary conversion: request-estimate, secondary call
Hero: type-led   Navigation: utility-bar   Typography: condensed-sans (Big Shoulders Display + IBM Plex Sans)
Palette: navy-red   Layout: alternating   Geometry: square
Imagery: documentary   Motion: subtle   Dialect: utility
Sections: hero > ratings > services > crew > before-after > process > reviews > estimate
CTA: bold-estimate   Proof: crew-led
Variation: 0.923, differs from DEMO 1 on 12 of 13 (same industry bar 7)
```

DEMO 3, Example Reformer Studio (fixture), boutique Pilates (fixture profile until
pilates-wellness.ts exists):

```
Archetype: Boutique Editorial   Traits: boutique, calm, editorial, minimal, approachable, premium
Primary conversion: intro-offer, secondary book
Hero: editorial-split   Navigation: minimal   Typography: serif-sans (Playfair Display + Source Sans 3)
Palette: sage-stone   Layout: editorial   Geometry: architectural
Imagery: editorial   Motion: subtle   Dialect: boutique
Sections: hero > intro-offer > methodology > studio > classes > instructors > schedule > memberships > community > booking
CTA: intro-offer-book   Proof: instructor-story
Variation: 0.692, differs from DEMO 1 on 9 and from DEMO 2 on 12 of 13
```
