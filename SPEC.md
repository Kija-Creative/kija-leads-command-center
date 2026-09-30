# Kija Lead Command Center: build contract

This file is the contract every module is built against. If code and this file disagree, the
code is wrong or this file needs a deliberate edit. Read it fully before touching anything.

## What this is

A local web app plus a weekly research routine. Every Monday a Claude Cowork scheduled task
finds US local businesses that have earned strong Google reputations but have no credible
website of their own, verifies that claim independently, scores them with the exact Scoring
Rules below, and builds each qualified lead a private homepage demo and a pitch page that
explains the return on investment. Jamey (James White, Kija's Design Director) opens the app,
reviews the week, and decides who to contact. Nothing in this system ever contacts a business.

It replaces the Google Sheet "Kija Lead Command Center" (tabs Dashboard, Lead Pipeline,
Research Queue, Scoring Rules, Codex Handoff). The sheet's 20 leads and research queue are the
seed data in `seed/sheet-2026-09-28.json`. The sheet stays usable: `npm run export` writes a CSV
in the exact Lead Pipeline column order so rows can be pasted back.

## Non negotiable rules

1. **No em dashes or en dashes anywhere.** Not in code, comments, copy, generated HTML, commit
   messages or docs. Use a comma, a period, a colon, or restructure. Plain hyphens inside words
   and numbers ("30-minute", "2-3") are fine. `npm run check` fails on U+2014 or U+2013 in any
   tracked text file, in `data/`, `demos/`, `pitches/`.
2. **Nothing contacts a prospect.** No code sends email, SMS, calls, DMs or form posts to any
   business. Outreach text is generated as drafts to copy. There is no send button.
3. **Nothing is published.** Demos and pitches are local files. The server binds 127.0.0.1 only.
   A demo becomes shareable only when Jamey flips `demo.shareApproved` in the app, and even then
   the app only produces a file; Jamey chooses where it goes.
4. **Never invent facts about a real business.** Ratings, review counts, phone numbers, years in
   business, services, licenses, certifications, awards, warranties, insurance relationships and
   review text are either sourced (URL in `sources`) or absent. Templates must not add claims
   such as "licensed and insured", "family owned", "#1", "best in", "since 19xx", "certified",
   "warranty", "financing available" unless the lead record carries that fact. No fabricated
   testimonials, ever. Review content appears only as `reviewThemes` (short paraphrased themes
   the researcher read in real reviews, for example "Honest pricing"), never as quotes with
   names.
5. **Every score carries its explanation.** A score component is
   `{ key, label, points, max, detail }` where `detail` is a full sentence fit to render. The
   total is computed, never stored or hand entered.
6. **Outreach history is append only and ingest never touches it.** Weekly ingest may add leads
   and refresh research fields on existing ones; it never edits `outreach` except to append a
   history entry describing what the research run changed.
7. **A rule violation is a return value, not an exception.** Mutations and validators return
   `{ ok, errors, warnings }` with sentences a person can read.
8. **Time is injected.** Pure functions in `src/lib/` take `now` (an ISO string or Date) as an
   argument. Only CLI entry points and the server read the clock.
9. **Zero runtime dependencies.** Node 24 built-ins only (`node:http`, `node:fs`, `node:path`,
   `node:crypto`, `node:dns`, `node:test`, global `fetch`). No npm install step, ever. ESM
   (`"type": "module"`). Browser code is vanilla ES modules, no bundler, no framework.
10. **No secrets in source or UI.** `.env` holds `GOOGLE_PLACES_API_KEY` (optional). Only a
    presence boolean reaches the browser. `.env` is gitignored.

House style: 2 space indent, double quotes, semicolons, trailing commas in multiline literals.
UI copy is plain, direct, sentence case, no exclamation marks, no emoji. Every empty state says
what would put something there.

## Directory layout and ownership

```
package.json              scripts (see CLI)                                   core
README.md                 how to run                                          integrator
AGENTS.md                 rules for any agent session in this repo            integrator
WEEKLY_RUN.md             the weekly research playbook                        discovery
SPEC.md                   this file
.env.example / .gitignore                                                     core
seed/sheet-2026-09-28.json                                                    given
config/settings.json      quota, thresholds, offer, contact, geography mode   core
config/categories.json    category registry                                   core
config/geography.json     metro list for nationwide rotation                  core
config/chains.json        chain and franchise names for exclusion             core
data/leads.json           pipeline                                            core (seeded)
data/queue.json           research queue                                      core (seeded)
data/rejected.json        checked and rejected businesses                     core
data/suppression.json     businesses never contacted or ingested again        core (written by the app)
data/benchmarks.json      ROI benchmarks with sources (npm run seed installs research/benchmarks.json)  research
data/runs/<runId>.json    run reports                                         written by ingest
data/inbox/               batch files dropped by the weekly run
data/backups/             rotating backups written by store.js
src/lib/*.js              pure logic plus store.js file IO                    core
src/cli/*.js              command line entry points                           core, discovery
src/demo/**               demo site generator                                 demo
src/pitch/**              pitch page generator and outreach drafts            pitch
server/server.js          local HTTP server and JSON API                      app
app/**                    browser UI                                          app
workflows/weekly-research.js  Workflow tool script for the weekly run         discovery
research/*.md             research write ups                                  research
demos/<id>/index.html     generated
pitches/<id>/index.html   generated
exports/                  generated share files and CSV
test/*.test.js            node:test suites, one or more per module
```

A module owner only writes inside its own paths. Cross module needs go through the exported
functions listed below.

## Data model

All JSON files are UTF-8, 2 space indented, arrays sorted stably (leads by `addedAt` then `id`).

### Lead (`data/leads.json` is `Lead[]`)

```js
{
  id: "gm-auto-care-dallas-tx",       // slugify(`${business} ${city} ${state}`), unique, stable
  business: "GM AUTO CARE",            // exactly as the business presents itself
  category: "Auto Repair / Truck Repair", // display label
  categoryKey: "auto-repair",          // key in config/categories.json
  city: "Dallas",
  area: "",                            // optional neighborhood, e.g. "Oak Cliff"
  state: "TX",                         // USPS code
  metro: "dallas-fort-worth",          // key in config/geography.json, "" if outside all metros
  address: "",                         // optional, only if sourced
  phone: "972-681-4966",               // display format NNN-NNN-NNNN
  phoneLineType: "unknown",            // optional: "unknown" (default) | "landline" | "mobile" | "voip"; mobile may be residential under FCC rules
  googleRating: 4.9,                   // 0 to 5, one decimal
  googleReviews: 501,                  // integer
  ratingSource: "",                    // optional: "" | "google-maps-observed" (read by a person or agent from the public listing, dated in sources)
                                       //   | "secondary" (a mirror such as Birdeye) | "owner". "places-api" is an error on any stored lead.
                                       //   The legacy value "google-maps" reads as google-maps-observed and ingest stores the new name.
  googleMapsUrl: "",                   // optional
  placeId: "",                         // optional Google place id: the only Places field that may be stored
  placeIdCheckedAt: "",                // optional date the place id was last confirmed; refresh after 12 months (free IDs only Place Details call), drop on NOT_FOUND
  // placesFetchedAt is retired: accepted on read, dropped on every write (store.saveLeads, ingest).
  websiteGap: 3,                       // 1 weak own site, 2 very weak or third party only, 3 no credible owned site
  ticketValue: 3,                      // 1 low, 2 medium, 3 high
  visualFit: 2,                        // 1 limited, 2 good, 3 excellent
  websiteStatus: "No website surfaced; ...", // one sentence
  presence: {                          // optional, every value sourced
    facebook: "", instagram: "", yelp: "", booking: "", other: []
  },
  confidence: "High",                  // "High" | "Medium-High" | "Medium" | "Low"
  whyKija: "",                         // one or two sentences
  pitchAngle: "",                      // one sentence, trust first, never "you need a website"
  demoConcept: "",                     // one sentence
  services: [],                        // optional, sourced service names for the demo
  reviewThemes: [],                    // optional, 2 to 5 short paraphrased themes, no quotes
  languages: [],                       // optional, e.g. ["English", "Spanish"]
  established: null,                   // optional year, only if sourced
  hours: "",                           // optional, only if sourced
  demoCopy: {},                        // optional overrides: { headline, subhead, about, ctaPrimary, ctaSecondary }
  sources: [ { url: "", label: "", checkedAt: "2026-09-28" } ], // at least one for verified leads
  verification: {
    status: "verified",                // "verified" | "needs-recheck" | "unverified"
    checkedAt: "2026-09-28",
    checks: [ { check: "exact-name search", result: "No owned domain in first two pages.", url: "" } ],
    notes: ""
  },
  outreach: {
    status: "New",                     // see OUTREACH_STATUSES
    nextAction: "Build private homepage demo",
    nextDate: "",                      // "" or YYYY-MM-DD
    owner: "",                         // "" | "Jamey" | "Kiel" | "Max" (Jamey White, Kiel Jared, Max Miller)
    notes: "",
    history: [ { at: "2026-09-28T12:00:00.000Z", by: "sheet-import", type: "created", text: "" } ]
  },
  demo: { builtAt: "", template: "", palette: "", shareApproved: false },
  roiOverrides: {},                    // optional: { ticket, margin, price, jobsPerMonth }
  addedAt: "2026-09-28",
  origin: "sheet-import",              // "sheet-import" | "weekly-run" | "manual" | "queue-promotion"
  runId: ""                            // run that added it, "" for sheet import
}
```

`OUTREACH_STATUSES = ["New", "Research", "Demo Built", "Contacted", "Replied", "Meeting", "Won", "Lost", "Not a fit"]`
(the first seven are the sheet's stages). History `type` is one of `created`, `status`,
`note`, `call`, `email`, `meeting`, `research`, `demo`, `consent`, `suppressed`. `consent` records
that the prospect agreed to texts or follow up by a channel, and its `text` says which (only a
consent entry that mentions texts unlocks texting). `suppressed` records why the business is never
contacted again. Both need non-empty `text`. `call` entries are what the call limits count.

### Places rule (research/places-api.md, research/RESEARCH.md decisions 2 and 3)

From the Places API only place IDs may be persisted: `placeId`, plus `placeIdCheckedAt`, refreshed
after 12 months. No other Places response field (name, address, phone, website, rating, review
count, coordinates) is written to `data/`, `demos/`, `pitches/` or `exports/`, and none is used to
build demo or pitch content. Every stored lead fact comes from an independent source recorded in
`sources`. `validateLead` and `validateQueueItem` reject `ratingSource: "places-api"` in every
mode. Discovery candidate files (`data/inbox/*.candidates.json`) hold Places content and may
exist only for the length of a run: `npm run check` warns about any older than 1 day, and
`npm run purge-places` deletes them. `export` leaves the rating and review count blank for a
places-api record.

Seed import maps the sheet: `sources` strings become `{ url, label: hostname, checkedAt: "2026-09-26" }`,
`verification.status` is `"needs-recheck"` with one check `{ check: "sheet import", result: <websiteStatus> }`,
`metro` is `"dallas-fort-worth"`, `origin` `"sheet-import"`, `addedAt` `"2026-09-26"` (the sheet's creation date).

### Queue item (`data/queue.json` is `QueueItem[]`)

```js
{
  id, candidate, category, categoryKey, city, state, metro,
  whyItMayFit, websiteStatus, verificationNeeded, ownerContact, phone,
  googleRating, googleReviews,        // number or null
  sources: [ { url, label, checkedAt } ],
  decision: "Research",               // "Research" | "Promote" | "Drop"
  reason: "",                         // why it is here, e.g. "Rating below 4.7" or "Qualified overflow"
  lead: null,                         // optional partial Lead carried from a batch, used on promotion
  addedAt, updatedAt, runId
}
```

### Rejection (`data/rejected.json` is `Rejection[]`)

`{ key, business, city, state, phone, reason, evidenceUrl, rejectedAt, runId }`. `key` is
`dedupeKey(...)`. The weekly run skips anything whose key is here, in leads, in queue or in the
suppression list.

### Suppression (`data/suppression.json` is `Suppression[]`)

`{ key, business, city, state, phone, reason, addedAt, by }`. `key` is `dedupeKey(...)`, `addedAt`
an ISO date or timestamp, `by` who added it. Any request to stop, in any words and on any channel,
adds an entry the same day (CAN-SPAM, FCC 24-24). A suppressed business is treated like a
rejected one: ingest never adds it again (duplicates report `in: "suppressed"` with a warning),
`planWeek` lists it in `exclusions`, and its lead cannot move back to an active outreach status
(only `Won`, `Lost`, `Not a fit`). Matching is by key, phone digits or normalized name plus state.
A lead with a `suppressed` history entry counts as suppressed even without a list entry.
`npm run seed` writes `[]` when the file is missing and never replaces it, not even with `--force`.

### Batch file (written by the weekly run to `data/inbox/<runId>.json`)

```js
{
  runId: "2026-09-28",                // the Monday's date
  mode: "weekly",                     // "weekly" | "reverify" | "manual"
  plan: { metros: ["..."], categories: ["..."] },
  searched: [ { query: "", source: "", notes: "" } ],
  leads: [ /* Lead fields the researcher fills: everything except id, outreach, demo, addedAt, origin, runId */ ],
  queue: [ /* QueueItem fields except id, addedAt, updatedAt, runId */ ],
  rejected: [ /* Rejection fields except key, rejectedAt, runId */ ],
  reverify: [ { id: "", googleRating: 0, googleReviews: 0, websiteGap: 0, websiteStatus: "", confidence: "", ratingSource: "", phoneLineType: "", placeId: "", placeIdCheckedAt: "", verification: {}, sources: [], decision: "keep", reason: "" } ],
  // 0 and "" mean "not re-measured". ratingSource "places-api" is an error for that entry.
  // A retired placesFetchedAt in an entry is accepted and ignored.
  notes: ""
}
```

### Run report (`data/runs/<runId>.json`)

```js
{ runId, ingestedAt, mode, plan, counts: { candidates, accepted, queued, rejected, duplicates, reverified, errors },
  accepted: [ids], queued: [ids], duplicates: [ { business, matched } ], errors: [ { business, errors: [] } ],
  warnings: [ { business, warnings: [] } ], searched, notes }
```

### config/settings.json

```js
{
  weeklyQuota: 10,
  thresholds: {
    minRating: 4.5, preferredRating: 4.7,
    minReviews: 20, preferredReviews: 30, strongReviews: 75,
    minWebsiteGap: 2
  },
  geography: { mode: "nationwide-rotation", metrosPerWeek: 4, homeMetro: "dallas-fort-worth", homeEveryWeek: true, homeMaxLeads: 3, rotationStart: "2026-09-28" },
  categoriesPerWeek: 6,
  offer: {
    name: "Owned Website",
    price: 2500,                       // PLACEHOLDER until Jamey confirms, see priceConfirmed
    priceConfirmed: false,
    timelineDays: 14,
    includes: ["Custom designed homepage and service pages", "Mobile first build", "Call, estimate and booking paths", "Google Business Profile connection", "You own the domain, the site and the content"],
    ownershipLine: "You own it outright. No monthly rent to keep your own website.",
    optionalCare: { name: "Care plan", monthly: 0, description: "" }
  },
  contact: { name: "Jamey", title: "Design Director, Kija Creative", email: "james@kijacreative.com", phone: "", site: "https://kijacreative.com", address: "" },
  // address: Kija's physical mailing address for the email footer (CAN-SPAM). Empty means email
  // drafts are not ready to send (emailReady says so, validateSettings warns).
  compliance: {
    texasRegistration: "unknown",      // "unknown" | "registered" | "exempt-confirmed" (Tex. Bus. and Com. Code chapter 302)
    callWindow: { startHour: 9, endHour: 20, days: [1, 2, 3, 4, 5, 6] }, // business local time, calls from startHour up to endHour; 0 Sunday to 6 Saturday
    maxCallsPerDay: 1,
    maxCallsTotal: 3,                  // without a reply
    noColdTexts: true,
    noTextStates: ["WA"]               // never texted without recorded consent, by state or area code
  },
  demoDefaults: { conceptRibbon: true }
}
```

A settings file without `compliance` still validates (with a warning) and `complianceSettings`
fills the defaults above. When present, every field is validated.

### config/categories.json

`{ [categoryKey]: { label, vertical, ticketValueDefault, visualFitDefault, searchTerms: [], placesTypes: [], placesTypesReviewed: true, serviceDefaults: [], focusNote: "" } }`

`placesTypes` holds the exact Table A type for Places `includedType` (from the table in
`research/places-api.md` section 5), or `[]` for the 19 keys that are text query only.
`placesTypesReviewed` is true once those types were checked against the research. Typed keys:
auto-repair `car_repair`, tire-shop `tire_shop`, barber `barber_shop`, hair-salon `hair_salon`,
nail-salon `nail_salon`, tattoo `body_art_service`, pet-grooming `pet_care`, general `service`,
plumbing `plumber`, electrical `electrician`, roofing `roofing_contractor`, painting `painter`.

`vertical` selects the demo template: `auto`, `home-services`, `contractor`, `personal-care`,
`general`. Required keys (add more only with a reason):

| key | label | vertical | ticket | visual |
|---|---|---|---|---|
| auto-repair | Auto repair | auto | 3 | 2 |
| auto-body-collision | Auto body and collision | auto | 3 | 3 |
| tire-shop | Tire shop | auto | 2 | 2 |
| muffler-exhaust | Muffler and exhaust | auto | 2 | 3 |
| diesel-truck-repair | Diesel and truck repair | auto | 3 | 2 |
| mobile-mechanic | Mobile mechanic | auto | 2 | 2 |
| auto-detailing | Auto detailing and tint | auto | 2 | 3 |
| towing | Towing and roadside | auto | 2 | 1 |
| hvac | HVAC | home-services | 3 | 2 |
| plumbing | Plumbing | home-services | 3 | 2 |
| electrical | Electrical | home-services | 3 | 2 |
| septic | Septic service | home-services | 3 | 2 |
| garage-door | Garage door repair | home-services | 2 | 2 |
| restoration | Water, fire and mold restoration | home-services | 3 | 2 |
| appliance-repair | Appliance repair | home-services | 2 | 1 |
| pest-control | Pest control | home-services | 2 | 1 |
| roofing | Roofing | contractor | 3 | 3 |
| concrete | Concrete | contractor | 3 | 3 |
| fencing | Fencing | contractor | 3 | 3 |
| pools | Pool building and service | contractor | 3 | 3 |
| landscaping | Landscaping | contractor | 2 | 3 |
| painting | Painting | contractor | 2 | 3 |
| foundation-repair | Foundation repair | contractor | 3 | 2 |
| remodeling | Remodeling | contractor | 3 | 3 |
| tree-service | Tree service | contractor | 2 | 3 |
| barber | Barber shop | personal-care | 1 | 3 |
| hair-salon | Hair salon | personal-care | 2 | 3 |
| nail-salon | Nail salon | personal-care | 1 | 3 |
| tattoo | Tattoo studio | personal-care | 2 | 3 |
| pet-grooming | Pet grooming | personal-care | 1 | 3 |
| general | Local service | general | 2 | 2 |

The sheet's search themes (`seed.searchThemes`) become each matching category's `focusNote`.

### config/geography.json

`{ metros: [ { key, name, states: [], anchorCities: [], region } ] }` in rotation order. Include
the 50 largest US metros, interleaved by region (Northeast, Southeast, Midwest, Southwest,
West) so consecutive weeks spread across the country. `dallas-fort-worth` is the home metro.

### config/chains.json

`{ names: [] }`: at least 120 national and regional chains and franchises in the preferred
categories (Midas, Meineke, Jiffy Lube, Caliber Collision, Maaco, CARSTAR, Christian Brothers
Automotive, Roto-Rooter, Mr. Rooter, Benjamin Franklin Plumbing, One Hour Heating and Air
Conditioning, Mister Sparky, Aire Serv, ARS Rescue Rooter, Great Clips, Supercuts, Sport Clips,
Servpro, ServiceMaster, CertaPro Painters, and so on). Matching is case and punctuation
insensitive on the normalized name.

### data/benchmarks.json (research owns the numbers; code owns the shape)

```js
{
  updatedAt: "2026-09-28",
  consumerStats: [ { id, claim, value, year, source, url, verified: true, useInPitch: true, pitchPriority: 1, notes } ],
  // pitchPriority is optional: a whole number, unique, 1 is the most persuasive and leads the pitch.
  // Current order: bl-lcrs26-website-after-reviews, bl-csb26-walked-away, bl-lcrs26-read-reviews,
  // bl-csb26-mobile, bl-csb26-speed; the rest carry none.
  categories: {
    [categoryKey]: {
      ticket: { low, typical, high, unit, sources: [ { title, url, year, note } ] },
      grossMargin: { typical, sources: [] },     // fraction 0 to 1
      rentedLead: { low, high, platform, sources: [] } | null,   // what a rented lead costs; a low or high of 0 means unknown
      rentedCustomer: { typical, platform, sources: [] },        // optional: cost per paying customer
      notes: ""
    }
  },
  websiteMarket: { freelancer: { low, high }, agency: { low, high }, subscription: { lowMonthly, highMonthly }, sources: [] }
}
```

`rentedCustomer` is set only where research has a sourced figure: every home-services and
contractor key carries the SearchLight February 2026 LSA all category average of $233 per paying
customer (its source note says it is an all category average), except garage-door ($198) and
roofing (about $731), which have trade figures. `research/benchmarks.json` and
`data/benchmarks.json` hold the same values.

Until research lands, core writes a placeholder with every category present, `sources: []`, and
`"notes": "Placeholder, not researched"`. Code must treat missing sources as unverified and the
UI must say so next to the number.

## Library API (src/lib)

All pure except `store.js`. Each file default-free, named exports only.

`normalize.js`
- `slugify(text) -> string` lowercase ascii, hyphen separated, no leading or trailing hyphen.
- `normalizePhone(raw) -> string` returns `NNN-NNN-NNNN` for US numbers, "" when not parseable.
- `normalizeName(name) -> string` lowercase, strips punctuation, `&` to `and`, drops `inc llc co ltd the`.
- `dedupeKey({ business, city, state, phone }) -> string` phone digits if present, else `name|state`.
  Two records are duplicates when phone digits match, or normalized name plus state match.
- `isChain(name, chains) -> { chain: boolean, match: string }`.
- `hostname(url) -> string`.

`score.js`
- `SCORING_RULES` array mirroring the sheet: rating 30, reviews 25, websiteGap 20, ticketValue 15, visualFit 10.
- `scoreLead(lead) -> { total, parts: Part[], warnings: string[] }`
  - rating points = rating / 5 * 30
  - reviews points = min(reviews / 300, 1) * 25
  - gap points = gap / 3 * 20, ticket points = ticket / 3 * 15, visual points = visual / 3 * 10
  - `total = Math.round(sum of unrounded parts)`; each part's `points` rounded to one decimal for display
  - `detail` example: "4.9 stars earns 29.4 of 30. Trust already exists; Kija is converting it, not inventing it."
  - warnings for anything below the preferred standards (rating under 4.7, reviews under 30, gap under 2 ...)
- Test: every `sheetScore` in the seed must equal `scoreLead(...).total`.

`validate.js`
- `REQUIRED_LEAD_FIELDS` = business, category, categoryKey, city, state, googleRating, googleReviews, phone, websiteStatus, websiteGap, ticketValue, visualFit, confidence, whyKija, pitchAngle, demoConcept, sources.
- `HISTORY_TYPES`, `RATING_SOURCES` (`"", "google-maps-observed", "secondary", "owner"`),
  `LEGACY_RATING_SOURCES`, `PHONE_LINE_TYPES`, `RETIRED_LEAD_FIELDS` (`["placesFetchedAt"]`).
- `validateLead(lead, { settings, categories, chains, mode, now }) -> { ok, errors, warnings }`
  errors: missing required field, value out of range, unknown categoryKey, chain match, em or en
  dash in any string, websiteGap below `minWebsiteGap`, rating below `minRating`, reviews below
  `minReviews`, no sources (mode "weekly" requires at least 1 source and at least 3 verification checks),
  ratingSource "places-api" (any mode), unknown phoneLineType, malformed placeIdCheckedAt.
  warnings: below preferred thresholds, confidence Medium or Low, ratingSource "secondary", a place
  ID checked over 12 months ago; in stored mode also a place ID with no placeIdCheckedAt and a
  leftover placesFetchedAt.
- `validateQueueItem` (also rejects a places-api rating on the item or its carried lead), `validateBatch(batch) -> { ok, errors, warnings }`.
- `validateHistoryEntry(entry)`: `consent` and `suppressed` entries need text.
- `validateOutreachPatch(patch, { lead, suppression })`: a suppressed lead may only move to `Won`, `Lost` or `Not a fit`.
- `validateSettings(settings)` also checks contact.address and contact.email, and `validateCompliance(settings.compliance)`;
  warns while contact.address is empty and while texasRegistration is "unknown".
- `validateSuppression(list)`: key, business, reason, by and addedAt on each entry, keys unique.
- `validateCategories`: placesTypes are Table A names (`snake_case`), placesTypesReviewed is a boolean.
- `validateBenchmarks`: rentedLead low and high numbers with low at most high; rentedCustomer typical above 0, a platform, http sources; pitchPriority whole, 1 or more, unique.
- `findDashes(value) -> string[]` paths of strings containing U+2014 or U+2013 (deep walk).

`compliance.js` (pure; nothing reads the clock; research/compliance.md; not legal advice)
- `STATE_TIMEZONES`: USPS code to IANA zone for all 50 states, DC and PR. Split states use the zone
  covering most of the population (TX, KS, NE, ND, SD, TN Central; FL, IN, KY, MI Eastern; ID
  Mountain via America/Boise; OR Pacific). Arizona is America/Phoenix, no daylight saving.
- `DEFAULT_COMPLIANCE`, `complianceSettings(settings)` (settings.compliance over the defaults),
  `TEXAS_REGISTRATION_STATUSES`, `PHONE_LINE_TYPES`, `INACTIVE_OUTREACH_STATUSES`, `STATE_AREA_CODES` (WA).
- `localTimeFor(state, now) -> { timeZone, hour, minute, weekday, date, label } | null`, weekday 0
  Sunday to 6 Saturday, label like "10:42 AM Tuesday, Central". Null for an unknown state; throws on an invalid now.
- `callCheck({ lead, settings, now, suppression }) -> { ok, reasons, callsToday, callsTotal, localLabel }`.
  Not ok when: suppressed, no phone, unknown state, no now, outside the window days, local hour
  before startHour or at or after endHour, `callsToday >= maxCallsPerDay` (calls counted by the
  business's local date), `callsTotal >= maxCallsTotal`. Counts come from `outreach.history`
  entries of type `call`. texasRegistration "unknown" adds the sentence "Texas phone solicitation
  status is unconfirmed. Check chapter 302 with an attorney before phone outreach." without
  blocking; a mobile or unknown line adds "may be treated as residential; email first".
- `canText({ lead, settings, suppression }) -> { ok, reason }`: needs a `consent` history entry
  whose text mentions texts; never for a noTextStates number (by state or area code) without it;
  never when suppressed.
- `emailReady({ settings, lead, suppression }) -> { ok, reasons }`: needs contact.address and a
  valid contact.email; a suppressed lead is not ready.
- `suppressionFor(lead, suppression) -> entry | null`, `isSuppressed(lead, suppression)` (list or a
  `suppressed` history entry), `suppressionEntry(record, { reason, by, now })`.

`roi.js`
- `computeRoi({ lead, benchmark, offer, overrides }) -> { inputs, breakEven, scenarios, rentedLeadComparison, rentedCustomerComparison, sentences, assumptions }`
  - `ticket` = overrides.ticket ?? benchmark.ticket.typical ?? the category default in
    `CATEGORY_TICKET_DEFAULTS[lead.categoryKey]` (general when unknown); `margin` = overrides.margin ??
    benchmark.grossMargin.typical ?? 0.4. A ticket or margin of 0 or missing is unknown, never a real
    value. A fallback assumption has `origin: "default"`, `estimate: true` and a source starting
    "Estimate, not verified".
  - `price` = overrides.price ?? offer.price
  - `grossPerJob = ticket * margin`; `breakEven.jobs = ceil(price / grossPerJob)`; `breakEven.sentence`
    e.g. "At a typical $550 repair order and 50% gross margin, the site pays for itself after 10 extra jobs, about one a month for a year."
  - scenarios for 1, 3 and 5 extra jobs a month (or overrides.jobsPerMonth as the middle): monthly revenue,
    annual revenue, annual gross profit, payback in months (one decimal), return multiple (annual gross / price)
  - `rentedLeadComparison` when benchmark.rentedLead has a low and high above 0: "The site costs about the same as N rented leads."
  - `rentedCustomerComparison` when benchmark.rentedCustomer.typical is above 0: `{ typical, platform, customers, sentence }`,
    sentence "The site costs about the same as N customers rented through <platform>." It comes before the rented lead sentence.
  - With no price, breakEven.jobs is null and the sentence asks for a website price.
  - `assumptions` lists every input with its source title and url, or "Placeholder, not researched".
  - Integers for dollars (round to whole dollars). Never claim a guarantee. Sentences say "if" and "about".

`week.js`
- `runIdFor(now) -> "YYYY-MM-DD"` of the Monday of that week (local date given as ISO string; use UTC date math on the date part).
- `isoWeek(dateString) -> "2026-W40"`.
- `planWeek({ now, settings, geography, categories, leads, queue, rejected, suppression }) -> { runId, week, metros: Metro[], categories: string[], quota, homeMetro, exclusions: string[], excludedBusinesses: string[] }`
  (exclusions cover leads, queue, rejected and suppressed businesses)
  rotation: week index = whole weeks since `settings.geography.rotationStart`; metros are a sliding
  window of `metrosPerWeek` over the non-home metros; home metro added when `homeEveryWeek`.
  categories rotate the same way over category keys excluding `general`, `categoriesPerWeek` at a time,
  but always include at least one of auto, home-services and contractor verticals.

`store.js` (file IO; the only lib module allowed to touch disk)
- `createStore(rootDir) -> store` with `load()` returning `{ leads, queue, rejected, settings, categories, geography, chains, benchmarks, suppression }`,
  `saveLeads(leads)`, `saveQueue(queue)`, `saveRejected(rejected)`, `saveSettings(settings)`, `saveSuppression(list)`, `saveRun(report)`,
  `listRuns()`, `listCandidateFiles()` (`[{ name, rel, fetchedAt, mtimeMs }]` for `data/inbox/*.candidates.json`)
  and `removeCandidateFile(name)`. Writes are atomic (write `*.tmp` then rename) and copy the previous file to
  `data/backups/<name>-<timestamp>.json`, keeping the newest 30 per file. `saveLeads` and `saveQueue` drop the
  retired `placesFetchedAt` (also inside a queue item's `lead`). `candidateFileAgeDays(file, now)` ages a
  candidates file by its `fetchedAt`, else its file time.
- `ingestBatch({ batch, state, now }) -> { state: nextState, report }` (pure, lives in `ingest.js`
  under src/lib so it is testable). Rules:
  1. Validate every lead in weekly mode. Invalid leads go to `report.errors`, not to the queue.
  2. Dedupe against leads, queue, rejected and `state.suppression` by `dedupeKey`. Duplicates go to
     `report.duplicates` (`in` names where the match is); a suppressed match also adds a warning.
     Batch records lose the retired `placesFetchedAt`, and `ratingSource: "google-maps"` is stored as
     `google-maps-observed`. New leads get `phoneLineType: "unknown"` and `placeIdCheckedAt: ""` unless set.
  3. Leads that fail only threshold floors become queue items with a `reason`.
  4. Rank the rest by score; the top `weeklyQuota` become leads with outreach status `New`, `origin: "weekly-run"`, `runId`,
     one history entry `{ type: "created", by: "weekly-run", text: "Added by weekly run <runId> with score N." }`.
     The overflow becomes queue items with `reason: "Qualified overflow"` and the partial lead in `lead`.
  5. `reverify` entries update research fields on the matching lead (rating, reviews, websiteGap,
     websiteStatus, confidence, ratingSource, phoneLineType, placeId, placeIdCheckedAt, verification,
     sources merged by url) and append one `research`
     history entry listing what changed. `decision: "reject"` sets outreach status to `Not a fit` only if the
     current status is `New` or `Research`, and appends a history entry with the reason; later stages are
     never changed automatically, a warning is reported instead.
  6. Queue and rejected entries from the batch are added after dedupe.
  7. Idempotent: ingesting the same batch twice changes nothing the second time.

## CLI (package.json scripts)

| script | command | does |
|---|---|---|
| start | `node server/server.js` | serve the app on 127.0.0.1:4242 (PORT env overrides) |
| test | `node --test "test/**/*.test.js"` | all suites (Node 24 treats a bare `test/` as a file) |
| check | `node src/cli/check.js` | validate all data files (suppression included), dash scan, demo guardrail scan, pitch page checks; warns about a suppressed lead still in active outreach and about any `data/inbox/*.candidates.json` older than 1 day |
| seed | `node src/cli/import-seed.js` | build data/*.json from the seed, refuses if data/leads.json is non-empty unless `--force`; writes `data/suppression.json` only when missing |
| plan | `node src/cli/plan.js [--date YYYY-MM-DD]` | print and write `data/inbox/<runId>.plan.json` |
| ingest | `node src/cli/ingest.js <batch.json>` | ingest a batch, print the report, write the run report |
| demos | `node src/cli/build-demos.js [--run <runId> \| --id <id> \| --all \| --missing]` | render demos |
| pitches | `node src/cli/build-pitches.js [--run <runId> \| --id <id> \| --all \| --missing]` | render pitch pages |
| probe | `node src/cli/probe.js --name "" --city "" --state "" [--phone ""]` | domain probe, prints JSON evidence |
| discover | `node src/cli/discover-places.js --plan <plan.json> [--terms N] [--anchors N] [--pages N] [--max-requests N] [--max-monthly N] [--dry-run]` | Google Places discovery, needs key; writes `data/inbox/<runId>.candidates.json` (fixed path, there is no `--out`) and counts requests per month in `data/places-usage.json` (`{ "YYYY-MM": count }`); a run never goes past `--max-monthly` (default 900) and exits 1 when that guard is used up |
| purge-places | `node src/cli/purge-places.js [--older-than-days N] [--dry-run]` | delete `data/inbox/*.candidates.json` (all by default, or only those older than N days) and print what was removed |
| export | `node src/cli/export-csv.js` | `exports/lead-pipeline-<date>.csv` in sheet column order |

Sheet column order for export: Score, Business, Category, City, Google Rating, Reviews, Website
Gap (1-3), Ticket Value (1-3), Visual Fit (1-3), Phone, Website Status, Confidence, Why Kija,
Pitch Angle, Private Demo Concept, Outreach Status, Next Action, Next Date, Source 1, Source 2.
City exports as "City / Area" when area is set. Proper CSV quoting.

## Server API (server/server.js)

Binds 127.0.0.1. Reads files fresh on every request (the weekly run writes them from another
process). JSON responses. Mutations return `{ ok, errors, warnings, ...payload }` with status 200
for ok, 422 for rule violations, 404 for unknown ids.

- `GET /api/state` -> `{ leads: LeadView[], queue, runs: RunSummary[], settings, categories, geography, benchmarks, suppressionCount, env: { placesKey: boolean }, now }`
  where `LeadView` = Lead (without the retired `placesFetchedAt`) plus `score` (scoreLead result), `roi` (computeRoi result),
  `demoExists`, `pitchExists`, `drafts` (buildDrafts with `suppression` and `now`, see Pitch),
  `phoneLineType` (defaults to `"unknown"`), `suppressed` (the suppression entry or null) and
  `compliance: { checkedAt, suppressed, call, text, email }` (callCheck, canText and emailReady at the request time).
- `PATCH /api/leads/:id` body `{ outreach?: { status, nextAction, nextDate, owner, notes }, roiOverrides?, demo?: { shareApproved, palette }, phoneLineType? }`.
  A status change appends `{ type: "status", by: "Jamey", text: "New to Contacted" }`. Unknown status is 422.
  Outreach is checked with `validateOutreachPatch(outreach, { lead, suppression })`, so a suppressed lead
  can only move to `Won`, `Lost` or `Not a fit` (422 otherwise). `phoneLineType: "mobile"` returns a warning.
  Every write drops `placesFetchedAt`.
- `POST /api/leads/:id/history` body `{ type, text, by }` appends one entry. `consent` may be added by hand
  (refused on a suppressed lead); `suppressed` may not, only the suppress route writes it. A call logged
  outside the call window, or a contact entry on a suppressed lead, is saved with a warning.
- `POST /api/leads/:id/suppress` body `{ reason }` (required, no dashes, at most 500 characters) adds the
  business to `data/suppression.json` with `suppressionEntry`, sets status `Not a fit`, next action
  "Do not contact", clears the next date and appends one `suppressed` history entry. A second call
  changes nothing and returns a warning.
- `POST /api/leads/:id/demo` regenerates that lead's demo; `POST /api/leads/:id/pitch` its pitch page.
- `POST /api/leads/:id/export` writes `exports/<id>-concept.html`, refused (422) unless `demo.shareApproved`.
- `POST /api/queue/:id/decision` body `{ decision: "Promote" | "Drop" | "Research", reason }`. Promote runs
  `validateLead` in manual mode on the carried partial lead plus queue fields; failure is 422 with the errors.
  Drop moves it to rejected with the reason. Promoting a suppressed business is refused (422).
- `PUT /api/settings` body is a partial settings object merged over the current one, validated. A partial
  `compliance` lands on the defaults; unknown compliance keys are 422; a value looser than the research
  defaults returns a warning.
- `GET /api/export.csv` streams the CSV.
- Static: `/` and `/app/*` from `app/`, `/demos/<id>/` from `demos/<id>/index.html`, `/pitches/<id>/`, `/exports/*`.
  Path traversal is rejected. Unknown paths 404.

## Demo generator (src/demo)

`renderDemo(lead, { categories, settings, now, assignment?, leads? }) -> { html, template, direction, palette, variants, photos }`
in `src/demo/render.js`. `template` equals `direction` (kept for callers that read the old name);
`photos` lists the stock photo ids shown. `build-demos.js` computes the assignment over all leads,
writes `demos/<id>/index.html` and sets `lead.demo.builtAt`, `template`, `direction`, `palette` and
`variants` through the store.

Every demo is one HTML file (inline CSS and JS; Google Fonts and the stock photos below are its only
external requests). It must look like a premium, real small business site made by a top studio for that
specific business, modelled on the conventions of the strongest sites in its field (research/design-*.md),
never a clone of one site and never one template with a palette swap.

Directions. A direction is a complete visual language: layout skeleton, type pairing, palettes (at least
three), section treatments and photo treatment. Each is one file `src/demo/directions/<key>.js` exporting
`direction` (contract in `src/demo/directions/README.md`), registered in `src/demo/directions/index.js`,
which lists every key from the design briefs. A direction declares the category keys it `suits`, concept
`keywords`, `palettes` (keys unique across all directions), `variants` for the hero, services and proof
slots, `imagery` rules and `status` ("stub" renders the shared default layout, "implemented" its own).
Directions compose shared building blocks (`src/demo/blocks.js`: header, click to call, rating proof,
services, review themes, chair placeholders, photos and gallery, visit and hours, FAQ, footer with photo
credits) and the vertical request forms (`src/demo/forms.js`), so facts rules live in one place.
`TEMPLATE_INFO[vertical].palettes` lists every palette a lead of that vertical can be given; choosing one
in the app moves the lead to that palette's direction.

Assignment. `assignDirections(leads, { directions, categories, reassign }) -> Map<id, { direction, palette, variants, signature }>`
in `src/demo/assign.js`, pure and deterministic. A choice stored in `lead.demo` (direction, palette,
variants) is kept unless `reassign`; a stored palette names its direction; keys that no longer exist are
ignored. Otherwise a lead gets a direction that suits its category (else one of its vertical); among leads
of the same vertical the least used suitable direction wins, so none repeat until every suitable one is
used; ties go to `demoConcept` keywords (premium, European, heritage, bilingual, emergency, 24/7,
editorial, bold, family, old-school and each direction's own), then the category's home field, then a
stable hash. No two leads share a signature (direction, palette and hero variant) while unused
combinations remain. `variants.photo` holds the hero photo, spread so leads rarely share one.

Stock photos. A demo may show only photos listed in `src/demo/stock-library.json` (licensed, hand checked,
research/stock-photos.md), hotlinked from `images.unsplash.com` or `images.pexels.com`, chosen per lead from
the groups that fit its category and never showing another trade. Every `<img>` has alt text ending
", stock photo", width and height, `referrerpolicy="no-referrer"`, object-fit cropping and
`loading="lazy"` except the one hero. No photo of a person appears in a team section. The footer credits
every photographer shown, and the ribbon says so (below). Every direction also renders without photos.

Sections: sticky header with click to call, hero with the business name and a specific promise, a rating
proof block (real rating and review count with "Google reviews" wording) within one scroll of the hero,
services (no prices, "to confirm with the owner"), why customers choose them (from `reviewThemes`, or
omitted), how it works or visit/booking steps, a request form that fits the vertical (photo estimate for
body shops, emergency request for home services, estimate for contractors, booking for personal care with
a chair choice for barbers, an inquiry for tattoo studios and pet details for groomers), service area and
hours (only sourced facts, otherwise a clear "to confirm" line), FAQ that makes no factual claims about the
business, footer. Mobile sticky call bar (Call and Book side by side for booked trades). EN/ES toggle for
chrome when `languages` includes Spanish.

Guardrails the tests and `check` enforce on every generated demo:
- `<meta name="robots" content="noindex, nofollow">`
- a visible concept ribbon: "Private concept by Kija Creative for {business}. Not the official website. Details to confirm with the owner."
  When the demo shows stock photos it reads exactly: "Private concept by Kija Creative for {business}. Not the official website. Photos are stock placeholders. Details to confirm with the owner."
- every `<form>` has `data-demo-form` and no real action; submit shows "This is a concept. Nothing was sent."
- no dash characters U+2014 or U+2013
- no forbidden claim phrases unless backed by the lead record: licensed, insured, bonded, certified,
  award, #1, number one, best in, since, family owned, guarantee, warranty, financing (case insensitive)
- the rating and review count shown match the lead record exactly
- an `<img>` may only show a stock library photo (every `src` and `srcset` entry), with the alt, size,
  lazy loading and referrer rules above, and a `data-stock-credits` line naming each photographer shown;
  no `<picture>`, `<video>`, `<iframe>`, `<object>`, SVG `<image>`, remote CSS `url()` or data URL images;
  no external scripts or stylesheets other than Google Fonts; no tracking scripts or network calls

## Pitch pages and outreach drafts (src/pitch)

`renderPitch(lead, { settings, benchmarks, categories, now }) -> html` writes `pitches/<id>/index.html`.
Kija branded (near black `#0b0b0d`, plum `#210019`, magenta `#ae0f64`, green `#5dff92`,
League Gothic display, Hanken Grotesk body, Google Fonts). Printable to PDF from the browser
(print stylesheet, letter size, no dark ink flood on print). Sections:
1. "You already earned the trust": rating, reviews, what customers say (themes), in their city.
2. The gap today: what a searcher finds (websiteStatus, presence) and what is missing (a place to see services, request an estimate, book).
3. The concept: what the private demo does, with a link to `/demos/<id>/` when viewed through the app.
4. The math: `computeRoi` output, break even in plain words, the scenario table, every assumption with its source, and the line "These are estimates to adjust together, not a promise."
5. Own it: offer name, what is included, timeline, ownership line, price (shown only when `offer.priceConfirmed`, otherwise "Pricing to confirm").
6. Next step: a 15 minute walkthrough with the contact in settings.
Consumer statistics come only from `benchmarks.consumerStats` where `verified && useInPitch`,
led by those with a `pitchPriority` in ascending order.

`buildDrafts(lead, { settings, roi, categories, now, suppression, compliance }) -> { email: { subject, body }, callScript, voicemail, followUpText, notes, ready? }`
in `src/pitch/drafts.js`. `ready: { email, call, text }` is `emailReady`, `callCheck` and `canText` for the
lead at `now` whenever `src/lib/compliance.js` loads (`compliance` lets a test pass a stand in, or `null`).
A suppressed business gets empty drafts and a do not contact note. The follow up text is labelled for
use only after a reply or consent, and is empty for a no text state without recorded text consent. Trust first, specific to the business, short, no hype, no false
urgency, never implies an existing relationship or affiliation, email includes a clear opt out
line and Kija's contact block (CAN-SPAM), `notes` reminds that texting a mobile number needs prior
consent and that nothing is sent automatically.

## UI (app/)

Kija internal tool. Dark: near black canvas `#0b0b0d`, plum tint surfaces from `#210019`,
magenta `#ae0f64` primary actions, green `#5dff92` for positive signal (scores, verified).
League Gothic for display numerals and headings, Hanken Grotesk for everything else. Dense,
calm, readable; product register, not marketing. Keyboard reachable, visible focus, 4.5:1
contrast for text, works at 1280 wide and down to a 390 wide phone.

Views (hash router):
- `#/week` default. The latest run: when it ran, plan (metros, categories), counts, then this
  run's leads as cards sorted by score (business, category, city and state, rating and review
  count, score with the five part breakdown, website status, confidence, demo and pitch status,
  next action). Empty state explains the Monday task and how to run it now.
- `#/pipeline` every lead, table with sort and filters (status, state, metro, category, score
  range, run) plus a board grouped by outreach status. Counts per stage like the sheet dashboard.
- `#/lead/<id>` detail: facts, score breakdown with sentences, verification checks and sources
  with dates, presence, why Kija, pitch angle, demo concept, ROI calculator (editable ticket,
  margin, price, jobs per month, saved as roiOverrides, sources shown per default), demo preview
  with desktop/tablet/phone frames, buttons to open demo, open pitch, regenerate, approve for
  sharing, export share file; outreach drafts with copy buttons; status, next action, next date,
  owner, notes, append-only history timeline.
- `#/present/<id>` full screen presentation for a screen shared call: demo in a device frame with
  a toggle to the pitch page, keyboard shortcuts 1 2 3 for device sizes, Esc to leave.
- `#/queue` research queue with Promote, Keep researching, Drop (reason required).
- `#/runs` run history with each report.
- `#/coverage` state tile grid map of the US showing lead counts per state and which metros each
  run covered, plus the upcoming rotation.
- `#/settings` offer (price, confirmed toggle, includes), contact, quota, thresholds, geography
  mode; data source status (Places key present or not, never the key).
- Header: product name, latest run date, stage counts, export CSV.

## Tests

`npm test` (`node --test "test/**/*.test.js"`; one suite: `node --test test/core-compliance.test.js`)
must pass with no network access. Required coverage: every seed sheet score
reproduced; normalize and dedupe cases; validate errors and warnings including dashes and chains,
the Places rule, suppression and compliance settings; ingest idempotency, quota overflow to queue,
never touching outreach, reverify rules, suppressed businesses never ingested; week rotation
determinism and suppression exclusions; ROI arithmetic and sentences, the 0 or missing fallback and
the rented customer comparison; compliance call windows across DST boundaries, split state zones,
call limit counting by local date, the Washington text rule and email readiness; store atomic
write, backups, suppression and dropping retired fields (temp dir); check and purge-places over
candidates files; server API happy paths and 422s (start on an ephemeral port against a temp copy
of data); every template renders for a lead of each vertical and passes every guardrail; drafts
contain opt out and no dashes.
