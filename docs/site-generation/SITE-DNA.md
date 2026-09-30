# Site DNA: the Design Intelligence Engine

Every generated prospect site gets a Site DNA fingerprint before any frontend work. The DNA is
chosen by the engine in `src/design-intelligence/`, persisted with the site, compared with recent
sites, and checked again by the design audit after the site is built. This file is the contract
for everyone who writes industries, dialects, references or the renderer.

Source documents: `docs/site-generation/IMPLEMENTATION-BRIEF.md` (Jamey's brief, verbatim) and
`design-intelligence/SPEC-site-dna.md` (his rules, dialect example and roofing example). Project
content rules in `SPEC.md` and `AGENTS.md` win over every design rule.

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
renderer (next author) builds from `SITE_DNA.json`, not from a direction pick.

## 2. Pipeline

```
lead
  -> classifyLead          config/categories.json industry + subIndustry (never guessed from the name)
  -> businessAttributes    phone, address, hours, sourced services, bilingual, rating, booking link, established
  -> inferBrandTraits      verified fields only, each trait cites its field
  -> conversionObjective   the industry's conversions, reordered by attributes and traits
  -> scoreArchetypes       trait fit first (x10), then conversion fit, seed only for ties
  -> Site DNA candidates   every axis ordered by trait affinity, family preference, then seed
  -> variation check       validateAgainstHistory + duplicate prevention
  -> repair when too similar, in the brief's order
  -> SiteDnaRecord         demos/<id>/SITE_DNA.json, lead.demo.dna, data/site-dna-history.json
  -> buildGenerationBrief  demos/<id>/BRIEF.md
  -> renderer              renderSite(record, lead, ctx)
  -> auditSite             pass, flags, score
```

Repair order (exactly the brief's): 1 another appropriate archetype, 2 recompose the section
order, 3 typography, 4 hero, 5 layout rhythm, 6 imagery, 7 geometry, 8 component dialect. Steps
are cumulative (step 4 may also change what steps 2 and 3 unlocked). Colour never changes alone:
navigation, motion, CTA, proof and palette only move in a last resort step together with all
structural axes. If nothing inside the appropriate archetypes differs enough, the best fit is
returned with `variation.valid: false` and a warning for a person to resolve.

Open decision: `IMPLEMENTATION-BRIEF-v2.md` lists a different order (archetype, hero, typography,
section order, layout, geometry, imagery, dialect, navigation). The engine follows the v1 order
above as instructed for this build; switching is one constant (`REPAIR_ORDER` in
`select-site-dna.ts`) and Jamey should confirm which order wins.

"Appropriate" archetypes: not excluded by `excludedBrandTraits`, and trait fit at least half the
best fit (all archetypes when no trait fits). Variation never reaches an inappropriate archetype.

Variation rules: compared on 13 dimensions (archetype, hero, navigation, typography, paletteFamily,
layoutRhythm, geometry, imagery, motion, ctaStyle, proofStyle, componentDialect, sectionOrder).
A candidate is valid when it differs on at least 6 from every site in the comparison set, shares
not all four of hero, section order, typography and geometry with any of them, and is identical
to no DNA anywhere in the history. The comparison set is the last 8 sites overall plus the last 8
of the same industry, taken from the leads that first appeared in the history before this lead,
so regenerating a lead gives the same answer. `variationScore` is the minimum difference ratio
across the set (1 with nothing to compare; 6 of 13 is 0.462).

Determinism: `buildSeed({ leadId, business, domain, industry })` (FNV-1a) only orders options of
equal fit. No `Math.random()`, no clock in the choice (`now` is only stamped on records).

## 3. File layout

```
src/design-intelligence/
  schema.ts             Jamey's types plus vocabularies, SiteDnaRecord, LeadDnaSnapshot, AuditResult
  seed.ts               hashString, seededIndex, seededPick (Jamey) + buildSeed, seededOrder
  variation.ts          compareSiteDNA, validateAgainstHistory (Jamey) + variationScore,
                        findDuplicate, checkCandidate, dnaFingerprint
  design-tokens.ts      FONT_PAIRINGS, GEOMETRY_TOKENS, MOTION_RULES, axis meanings, trait
                        affinities, GLOBAL_FORBIDDEN_DEFAULTS, DETECTABLE_PATTERNS
  modules.ts            MODULE_CATALOG (label, job, truth kind, source fields), PAGE_LABELS
  contrast.ts           WCAG contrast, palette checks
  traits.ts             businessAttributes, inferBrandTraits
  industries.ts         loadIndustries, getIndustry, listIndustries, classifyLead, checkCategoryMapping
  industries/<id>.ts    one IndustryProfile per file (roofing.ts supplied by Jamey)
  archetypes.ts         base families loader (design-intelligence/archetypes/*.json)
  component-dialects.ts dialect loader and the DialectPrimitives contract
  references.ts         reference loader and selectReferences
  history.ts            data/site-dna-history.json: append, cap, query, comparison pool, and the
                        HistoryRepository seam (jsonHistoryRepository) so a database can replace it
  select-site-dna.ts    selectSiteDna, lock, unlock, override bounds, snapshots, truth plan
  select-archetype.ts   selectArchetype (the ranking the pipeline uses)
  prompt-builder.ts     buildGenerationBrief, divergenceBlock
  markers.ts            dnaAttributes, moduleAttributes, ctaAttribute, dnaRootCss, aliases
  renderer-contract.ts  RenderSite, ModuleRegistry, AxisImplementations, modulePlan, coverageErrors
  html.ts               the audit's HTML and CSS reader
  audit.ts              auditSite
  index.ts              public API and createEngine()
design-intelligence/
  archetypes/<family>.json          base families (editorial.json written as the pattern)
  components/<dialect>/dialect.json + primitives.ts   (editorial, editorial-luxury written)
  references/*.json                 references (next author)
data/site-dna-history.json          { version, cap, note, entries[] }
demos/<id>/SITE_DNA.json            the per-site record
demos/<id>/BRIEF.md                 the generation brief
src/cli/dna.js brief.js audit.js typecheck.js lint.js
test/di-*.test.ts                   engine tests (fixtures in di-fixtures.ts, di-page.ts)
```

JavaScript callers import only `src/design-intelligence/index.ts` (Node 24 strips the types).
TypeScript here uses erasable syntax only (no enums, namespaces or parameter properties) and
relative imports carry the `.ts` extension.

## 4. Vocabularies (exact values)

The unions below are Jamey's v1 values plus the v2 additions from
`IMPLEMENTATION-BRIEF-v2.md` (widened, nothing removed). Every value has a meaning, and the
tables are typed `Record<Union, ...>`, so a new value does not compile until it has one.

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
- Component dialects are free ids (kebab case) with a folder each; v2 names utility, editorial,
  clinical, luxury, industrial, technical, boutique, kinetic, commerce, portfolio, institutional,
  minimal, warm-local, architectural, documentary, performance.
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
  intro-offer, classes, methodology, schedule, instructors, memberships, product-demo, use-cases,
  integrations, signup, client-logos, product-discovery, product-detail, merchandising, cart,
  checkout, mission, impact, programs, stories, volunteer, donate, transparency, work, philosophy,
  studio, capabilities, industries-served, equipment, certifications, rfq, admissions, events,
  disclosures

A new value is added in `schema.ts` (and, for a module, a catalog entry in `modules.ts`); loaders
reject unknown values with a sentence.

Traits are inferred only from: categoryKey (1), city (1, "local"), reviewThemes (2), languages
(2, "bilingual"), googleRating and googleReviews bands (1 to 2), demoConcept wording (3),
pitchAngle wording (2), and a sourced established year (3, "established"; 25 years or more also
"heritage"). "family-owned" needs a review theme that says so. Wording such as "decades of trust"
never produces a claim trait.

## 5. Industries and categories

Industries are discovered from `src/design-intelligence/industries/*.ts` at runtime (files starting
with `_`, `.d.ts` and tests are skipped). `config/categories.json` gives every category an
`industry` and `subIndustry`:

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
roofing (1, done). The brief's full list also needs hvac, plumbing, electrical, construction,
law, medical, dental, finance, accounting, insurance, real-estate, restaurant, hospitality,
beauty-spa, pilates-wellness, gym-fitness, saas-technology, ecommerce, nonprofit, education,
architecture-interiors, industrial-manufacturing, photography-creative, plus landscaping, tattoo
and pet-grooming for our categories.

### How to add an industry

Create `src/design-intelligence/industries/<id>.ts` (file name equals the id). Nothing else
changes; `npm run typecheck` and the loader tell you what is wrong.

```ts
import type { IndustryProfile } from "../schema.ts";

export const automotive: IndustryProfile = {
  id: "automotive",
  label: "Automotive",
  primaryConversions: ["call", "request-estimate", "book"],        // CONVERSION_KEYS, best first
  requiredModules: ["services", "reviews", "hours", "locations"],  // MODULE_KEYS
  defaultForbiddenPatterns: ["generic-saas-bento", "fake-dashboard-ui"],
  subIndustries: { "auto-repair": { label: "Auto repair", schemaOrgType: "AutoRepair" }, collision: { label: "Collision", schemaOrgType: "AutoBodyShop" } },
  schemaOrgType: "AutoRepair",
  conversionLogic: "How customers choose, one or two sentences.",
  imageryNotes: "What the photography must show.",
  proofNotes: "What counts as proof, and what may never be claimed.",
  trustSensitive: true,            // optional: health, law, finance, home access
  motionCeiling: "moderate",       // optional: no archetype may exceed it (load error)
  palettes: {                      // required tokens for every paletteFamily named below
    "garage-steel": { label: "Garage steel", tone: "light", traits: ["practical"], tokens: { bg: "#f2f3f1", surface: "#ffffff", ink: "#15191d", muted: "#4a535c", line: "#d3d7da", primary: "#a84300", "on-primary": "#ffffff", accent: "#f2b705" } },
  },
  styleNotes: { "call-forward": "What this CTA style means here." }, // every ctaStyle and proofStyle
  archetypes: [                    // at least two (three per the brief)
    {
      id: "neighborhood-bay",
      label: "Neighborhood Bay",
      family: "documentary",       // design-intelligence/archetypes/<family>.json
      description: "One or two sentences.",
      suitableBrandTraits: ["local", "trusted", "warm"],          // BRAND_TRAITS
      excludedBrandTraits: ["luxury"],                            // optional
      primaryConversions: ["call"],                               // optional, subset of the industry's
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
      componentDialects: ["utility"],
      sectionOrders: [["hero", "ratings", "services", "why-us", "process", "hours", "contact"]], // start with hero, 4+ sections, no repeats
      requiredModules: ["phone-cta"],
      forbiddenPatterns: ["luxury-fashion-layout"],
    },
  ],
};
```

Load checks (errors unless noted): id and file name, every vocabulary value, palette tokens
present and WCAG AA (ink and muted on bg, ink on surface, on-primary on primary at 4.5:1),
section orders, module keys, conversions, font pairing ids, the motion ceiling. Warnings: a
dialect or family without a folder yet, a style without a note, only two archetypes.

## 6. Base archetype families and dialects

A family (`design-intelligence/archetypes/<id>.json`, see `editorial.json`) is a cross-industry
design language: `id, label, summary, character[], suitableBrandTraits[], heroes, navigation,
typography, layout, geometry, imagery` (each `{ preferred[], notes }`), `motion { ceiling, notes }`,
`defaultDialects[], principles[], forbiddenPatterns[], references[]`. Families break ties among
values the industry archetype already allows, cap motion, and add principles to the brief. Named
by roofing and still to write: industrial, documentary (plus cinematic, clinical, luxury, kinetic,
technical, boutique per SPEC-site-dna.md).

A dialect is `design-intelligence/components/<id>/dialect.json`:
`{ id, label, summary, extends?, allowed[], forbidden[], forbiddenPatterns[], behaviors[], primitives? }`
plus `primitives.ts` exporting `primitives: DialectPrimitives` with `dialect`, `css(theme)`,
`button(input)`, `sectionHeading(input)`, `card(input)`, `field(input)`, `placeholder(input)`.
Primitives read only the :root tokens (no colour, font or radius literals), prefix classes `dx-`,
escape their text, include `:focus-visible` and reduced motion, and write markers through
`markers.ts`. A compound (`editorial-luxury`, exactly as in SPEC-site-dna.md) lists `extends`,
inherits its parents' lists and the first parent's primitives. Written: editorial,
editorial-luxury. Named by roofing and still to write: industrial, utility, luxury.

References (`design-intelligence/references/*.json`, one object or `{ references: [] }`):
`{ id, title, source: "design-playbooks" | "skynet-site-system" | "kija-research" | "other", path,
license, industries[] ("*" for cross-industry), archetypes[] ("<industry>/<archetype>"),
families[], dialects[], takeaways[] (our words), avoid[]? }`. Only references matching the
industry or archetype (or cross-industry with a matching family) are used, at most four.

## 7. Per-site record (demos/<id>/SITE_DNA.json)

`SiteDnaRecord`: version, leadId, business, industryLabel, archetypeLabel, dna (the full
`SiteDNA` including `fontPairing`, resolved `palette`, `secondaryConversion`, `fingerprint`),
fingerprint, classification, attributes, brandTraits (with evidence), conversion,
archetypeScores, variation `{ score, valid, comparedWith, lookback, industryLookback,
duplicateOf, comparisons[], repairs[], candidatesChecked }`, reasoningSummary[], referencesUsed[],
truth `{ facts[], sources[], modules[{ module, status, note }], placeholders[], neverClaim[] }`,
facts, locked, lockedBy, lockedAt, overridden, override, audit, createdAt, updatedAt.

`lead.demo.dna` holds `LeadDnaSnapshot` (file, fingerprint, industry, archetype, variation score
and validity, lock fields, overridden, audit pass and score, updatedAt and the full `dna`), so a
lock survives when the gitignored `demos/` folder is gone.

Locking: `lockRecord(record, { by, now })`; a locked record is returned unchanged unless
`unlock`; overriding a locked record is refused with a sentence. Override:
`selectSiteDna(lead, engine, { now, override: { by, fields } })`; every field must be inside the
industry and archetype bounds (a human may also reorder exactly the sections of an allowed order),
overrides may add forbidden patterns and required modules but never remove them, and the record
is stored with `overridden: true`.

## 8. Renderer contract

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
- Truth: a module with status placeholder renders `primitives.placeholder` or carries
  `data-placeholder="owner-to-confirm"`, headed with `pageLabel(key)` ("Coverage on the work",
  "Payment options", ...). Placeholder copy must avoid every guardrail claim word. The rating proof
  still follows `src/demo/guardrails.js` (data-rating, data-reviews, "Google reviews").
- CTAs: `ctaAttribute(conversion)` on every conversion control; the primary conversion in the hero
  and in the closing section; a `tel:` link with `data-cta="call"` whenever the industry converts
  by call and the record has a phone.
- Motion within `MOTION_RULES[dna.motion]`, a `prefers-reduced-motion: reduce` rule whenever
  motion is not none, `:focus-visible` styles, 44px phone targets, viewport meta, width media
  queries, landmarks, one h1, labelled inputs, alt text.

## 9. Audit

`auditSite({ html, record, profile, history, lead?, now? })` returns `{ pass, score, flags[],
checks[], checkedAt, fingerprint }`. Checks: similarity (validateAgainstHistory and duplicates),
required-modules (markers, section order, placeholders), forbidden-patterns (pill buttons on most
button rules, bento, radial or blurred glow, blue to purple gradients, backdrop-filter, Inter as
the body face, three identical feature cards, identical testimonial cards, dashboard UI),
cta-architecture, dna-fidelity (markers, fingerprint, radius and font tokens, fonts request,
durations, keyframes, reduced motion, palette tokens), fabricated-trust and guardrails
(`checkDemoHtml` reused), responsive, accessibility (lang, landmarks, headings, alt, labels,
computed AA contrast of the declared tokens, focus-visible, 44px phone links),
component-library-look (shadcn and Preline default signatures). An error fails the page; score is
100 minus 15 per error and 5 per warning. The result also lists `failures`, `warnings`,
`similarityIssues` and `requiredFixes` (one fix per failure), as the v2 brief asks. Screenshot
similarity is not built; the audit is structured so an image hash check can be added as another
check id.

## 10. Commands

- `npm run dna -- --id <id> | --all [--unlock] [--lock] [--by <name>] [--dry-run]`
- `npm run brief -- --id <id>` writes `demos/<id>/BRIEF.md` and `SITE_DNA.json`
- `npm run audit -- --id <id> | --all`
- `npm run typecheck` (tsc strict, noEmit, borrowed from ./node_modules, KIJA_TOOLS_DIR or
  ../kija-os/node_modules; says so and exits 1 when none is found)
- `npm run lint` (ESLint with a built in flat config, same tool search; workflows/*.js are
  Workflow scripts and are not linted)
- `npm test` runs `test/**/*.test.js` and `test/**/*.test.ts`

## 11. Examples (fixtures, from the tests)

ABC Roofing (fixture), premium residential wording, first in the history:

```
Industry: roofing (Roofing contractor, RoofingContractor)
Archetype: Premium Residential (trait fit: premium, craftsmanship, residential, architectural, high-end)
Primary conversion: request-estimate, secondary call
Hero: full-bleed          Navigation: transparent-overlay
Typography: serif-sans (Newsreader + Public Sans)
Palette: warm-architectural   Layout: editorial   Geometry: architectural
Imagery: project-gallery      Motion: subtle      Dialect: luxury
Sections: hero > selected-projects > craftsmanship > services > materials > process > testimonial-story > consultation
CTA: project-estimate     Proof: project-story
Placeholders: materials, testimonial-story, warranty
Variation score: 1 (nothing earlier)
```

Example Storm Roofing (fixture), storm and crew wording, second:

```
Archetype: Blue-Collar Modern
Primary conversion: call (urgent-need trait), secondary request-estimate
Hero: full-bleed          Navigation: utility-bar
Typography: condensed-sans (Oswald + Source Sans 3)
Palette: navy-red   Layout: alternating   Geometry: square
Imagery: documentary      Motion: subtle   Dialect: industrial
Sections: hero > ratings > services > crew > before-after > process > reviews > estimate
CTA: call-now   Proof: crew-led
Placeholders: crew, warranty
Variation score: 0.846 (differs from ABC on 11 of 13 dimensions)
```

Example Reformer Studio (fixture), boutique Pilates, third:

```
Industry: pilates-fixture (a test profile until pilates-wellness.ts exists)
Archetype: Boutique Editorial
Primary conversion: intro-offer, secondary book
Hero: editorial-split     Navigation: minimal
Typography: serif-sans (DM Serif Display + Work Sans)
Palette: linen-clay   Layout: editorial   Geometry: architectural
Imagery: editorial        Motion: subtle   Dialect: editorial
Sections: hero > intro-offer > methodology > classes > instructors > schedule > reviews > booking
CTA: intro-offer-book   Proof: instructor-story
Placeholders: intro-offer, instructors, schedule
Variation score: 0.692
```
