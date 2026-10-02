# Scaling to 150 to 200 qualified leads a week, including weak-website leads

Researched 2026-09-30. Facts fact-checked 2026-10-02 against the pages named in the source ledger at the end. A claim is used here only if its checker confirmed it or corrected it (the correction is what appears). Anything refuted, unreachable or never checked is under "Not verified" and is not relied on. Arithmetic and design choices are labelled as such. Terms readings are research notes, not legal advice.

Repo state read first: `research/places-api.md`, `research/compliance.md`, `WEEKLY_RUN.md`, `src/discovery/*`, `config/settings.json`, `workflows/weekly-research.js`, `src/lib/score.js`, `SPEC.md`.

## 0. The three things Jamey most needs to know

1. **The data side is cheap, but nobody has measured the yield, and the storage rules must change.** Google fees land between $0 and about $105 a month for discovery (section 2), depending on one number that does not exist yet: qualified leads per Places request. Two pilot weeks measure it. Separately, Google's terms allow storing only the place ID, so at this volume ratings and review counts cannot be written down. They must be fetched live by place ID and shown with Google Maps attribution. That touches about 20 files that read `googleRating` and `googleReviews`.
2. **The real limits are people and sending, not data.** About 30 to 34 team hours a week (planning assumptions), and a sending plan where 3 mailboxes at 35 emails a day gives exactly 525 sends, which is exactly 175 leads at 3 touches with zero headroom. `emailReady` already blocks every email until `settings.contact.address` is filled in. Cold outreach also sits against Google's guidance to mail only people who opted in, and against the Maps and Workspace acceptable use ban on "unsolicited mass email".
3. **"Deterministic demos for all" collides with your own decision on 2026-09-30.** `WEEKLY_RUN.md` step 9 says you rejected the template generator behind `npm run demos` for concepts. So this plan builds bespoke concepts only for Tier A (about 10 a week) and for replies, gives Tier B and C a pitch page without a demo, and treats a new lighter generator as an optional later phase that needs your approval of sample output first.

## 1. Recommended architecture

### 1.1 The funnel

```
Places Text Search (live, in memory)      about 450 requests a week, up to 9,000 places
  server filter minRating 4.5, local filter reviews, chains, suppression, known
      |                                   owned websites are KEPT now (they used to be dropped)
      +-- no website or third party only  -> lane "new-site"   (websiteGap 3 or 2)
      +-- owned website                   -> script site audit  -> lane "redesign"
                                              good site: reject, remember in rejected.json
                                              weak (gap 1) or critical (gap 2): candidate
  Overture match (optional, Phase 3)      storable name, phone, address, websites, socials
  contact email from the business's own pages (sourced, never guessed)
  score the stored 45 points, assign tier A, B or C
  agents confirm (light for C, six checks for A and B), humans review A and a random sample
  one to one outreach, pitch page for all, bespoke concept for Tier A and for replies
```

### 1.2 Sources

| Source | Role | Why |
|---|---|---|
| Google Places API (New), Text Search Enterprise | Find candidates, filter on rating and reviews, point at owned sites | Only reviewed source that has ratings, and its terms allow this use. Up to 20 places per request, up to 60 results across 3 pages per query (g5). `minRating` filters on Google's side, review count must be filtered locally (g6). |
| Google Place Details Enterprise by place ID | Live rating and review count at display time | Rating and review count must not be stored (section 1.3). |
| Business's own website | Audit target, and an independent source for name, phone, services, hours, email | Kija's own observation of a public page. |
| Overture Maps Places | Optional storable fact layer (Phase 3) | Free, CDLA Permissive 2.0 or Apache 2.0 (o1, o2), monthly releases (o7), about 81M places (o3), has `websites`, `socials`, `phones`, `emails`, `addresses`, `taxonomy`, `confidence` (o4). Overture itself warns of "duplicates, a high junk rate, and low property completeness" (o6), so a missing website field never proves there is no site. |
| Drop | Foursquare, Yelp, BBB, Data Axle/Salesgenie | Foursquare is already inside Overture (4.1M records, o3) and its own access needs an account or login (f4, f5). Yelp stores 24 hours at most, bars building a listings database and bars commercial use without consent (y1). BBB bars using its sites for sales and marketing (b1). Data Axle has no ratings and no published SMB prices (d1, d2); its free AWS dataset targets 5 to 250 employee growth firms with an unread EULA (d3). |

Also remove `bbb.org` as a lead source everywhere it is read: `WEEKLY_RUN.md` lines 141, 169, 241 and 260 and `research/compliance.md` line 156 (checker finding on b1).

### 1.3 Compliance model: exactly what is stored

Basis (all confirmed on 2026-10-02): place IDs may be cached (t1, t3). Places latitude and longitude may be cached up to 30 days, and nothing else from Places has a cache allowance (t2). Terms 3.2.3 bars copying and saving business names, addresses or reviews (t4), bars caching beyond the Service Specific Terms (t5), and bars creating content based on Google Maps Content (t6). Google Maps Content includes "places data (including business listings)" (t7). Rating and review count therefore have no storage allowance.

One caution from the checker (t6): that a derived value such as a score or a has-website flag is also covered is an inference, not Google's text. This plan takes the conservative reading and lists it for counsel.

| Value | Stored on a lead? | Rule |
|---|---|---|
| `placeId`, `placeIdCheckedAt` | Yes | Refresh at 12 months with a Place Details call that asks for the ID field only, which is free and uncapped (g3). Drop on NOT_FOUND. |
| Places name, address, phone, `websiteUri`, rating, review count, status, types, Maps URI | No | In memory for the run. Only the minimum pointer set already allowed in the transient `data/inbox/<runId>.candidates.json` (deleted by `npm run purge-places`). |
| Places latitude and longitude | No | Never requested. The field mask in `PLACES_FIELDS` has no `places.location`. |
| Rating and review count | No | Fetched live by place ID at display time, shown with Google Maps attribution, never written to disk or cached. |
| Has-website flag, "passed the rating filter" flag, full 100 point score | No | Derived from Places values. The 100 point total is computed at display time only. |
| Kija's site audit, `websiteGap`, `ticketValue`, `visualFit`, `tier`, `lane` | Yes | Kija's own measurements of the business's own public site and Kija's own judgement. `tier` is computed from the stored 45 points plus reachability, never from rating (section 1.6). |
| Overture fields and ID | Yes (Phase 3) | Keep the CDLA Permissive 2.0 text and the Foursquare copyright notice with the data (o2, checker note 8). |
| Contact email | Yes | Only from the business's own page, with the source URL. Never guessed. |

The domain of a site found through Places `websiteUri` is stored only after it is independently confirmed: the page itself shows the business name and the phone or city (`siteAudit.domainConfirmedBy = "site-self"`), or Overture lists it, or an agent found it by search, or a human confirmed it. A page that cannot confirm itself is `needs-human`. Whether this removes the Places taint is a counsel question (section 5).

Display rule (t9): attribution is the Google Maps logo whenever possible, with the text "Google Maps" acceptable where space is limited, inside the same visual container as the data. Use the text in list rows and the logo on the lead page.

Other Google rules that bind this design:
- Use one billing account and one project. Splitting usage to avoid fees is barred by 3.2.1(c)(ii)(1) "in a manner intended to: (1) avoid incurring Fees" (t8), and PSI terms bar circumventing documented limits (gapi-tos-2d).
- A person reading public Maps pages falls under the Maps end user terms, which bar anyone to "mass download or create bulk feeds of the content" (t10). So the live API lookup replaces hand reading Maps listings at this volume.
- Amend `WEEKLY_RUN.md` safety rules 7 and 8: rule 8 stays for hand reading (a handful of listings, only for Tier A), and a live API lookup by place ID is explicitly allowed for display.

### 1.4 Discovery request plan

Formula: `requests per week = metros x categories x areas x pages`. The 60 result cap per query means dense pairs need several areas; today no metro has `bounds` in `config/geography.json`, so areas are anchor cities.

| Setting | Today | Proposed pilot | Note |
|---|---|---|---|
| `geography.metrosPerWeek` | 4 | 15 | 50 metros, so all covered about every 3.3 weeks per category slice |
| `categoriesPerWeek` | 6 | 10 | 31 categories, so all covered about every 3 weeks |
| `anchorsPerMetro` | 2 | 1 | raise after measuring saturation |
| `termsPerCategory` | 1 | 1 | raise to 2 if supply runs thin |
| `maxPages` | 3 | 3 | |
| `maxRequests` per run | 180 | 450 | 15 x 10 x 1 x 3 |
| `--max-monthly` | 900 | 900 until Jamey signs off | WEEKLY_RUN rule: never above 1,000 without Jamey's say so |

A full sweep of 50 metros x 31 categories x 3 pages is 4,650 requests, about 10 weeks at 450 a week. Supply is finite (checker note 4): 1,550 combinations x at most 60 results is at most 93,000 slots, and the same places recur each cycle, so the `known` drop rate rises over time. New supply after the first cycle comes from new listings, second search terms and extra areas. The pilot measures this.

Every request keeps `includePureServiceAreaBusinesses: true` and `minRating`; the existing `buildSearchBody` already does this.

Funnel yield is unmeasured, so no yield number is used anywhere in this plan. The pilot logs, per stage: places returned, dropped by each existing counter, owned sites audited, verdict counts, and leads per request.

### 1.5 Automated verification and website audit

All scripts, zero model usage, built like `probe.js` (injected `fetch`, `tls`, `dns`; GET and HEAD only; never a form, never a POST).

**Stage 1, light audit (at most 4 requests per site).** `robots.txt` first, then the homepage with manual redirects, an HTTP to HTTPS check, and a TLS check with `tls.connect({ servername, rejectUnauthorized: false })` reading `authorized`, `authorizationError` and `getPeerCertificate().valid_to` (node-tls, corrected: with the default `rejectUnauthorized: true` a bad certificate raises an error instead of giving a socket, and `servername` must be set for SNI). Sites that pass K1 to K4 are rejected here as good.

**Stage 2, deep audit** only for sites that failed at least one core check: broken link and image sample (at most 40 same-site URLs), stylesheet sampling, copyright year, search basics, information fields.

**Stage 3, PSI** only for the shortlist (section 3, K5).

Politeness (rfc9309, corrected): "These rules are not a form of access authorization", but follow them. An explicit disallow means `needs-human`. A 5xx or network failure on `robots.txt` is treated as complete disallow, also `needs-human`. A 4xx means no restrictions. Cache a copy for at most 24 hours. At most 25 requests per site, 1 request per second per host, a User-Agent naming Kija and kijacreative.com, and an HTML read cap of 3 MB, because a Wix template page measured 1.6 MB (fp-wix-observed, with the caveat that it was a Wix-owned template, not a customer site) and `PROBE_DEFAULTS.maxBytes` is 400,000.

Time arithmetic (formula, not a measurement): `sites x requests per site x 1 s / concurrency`. For example 5,000 sites x 15 requests x 1 s / 16 concurrent hosts is about 78 minutes.

Other automated checks that replace agent work:
- Existing `detectParked`, `probeBusiness` domain guesses, `isChain`, suppression and known index (all already in `src/discovery`).
- Contact email extraction from the business's own homepage and contact path: `mailto:` links and visible addresses, with the page URL recorded.
- Re-probe immediately before any send (checker note 8: in the last check two own-site "drops" were domains registered after the leads were found).

### 1.6 Scoring changes

The 100 point score stays: rating 30, reviews 25, websiteGap 20, ticket 15, visual 10. Split in two:

- **Stored 45 points:** `websiteGap` (20), `ticketValue` (15), `visualFit` (10). Computed any time from the stored lead.
- **Live 55 points:** rating (30) and reviews (25), computed at display time from a live lookup. `scoreLead` returns `total: null` when no live reputation is supplied.

`websiteGap` redefined with objective rules (this resolves the conflict between `WEEKLY_RUN.md`, which calls gap 1 "not a lead", and `SPEC.md`, which calls it "weak own site"):

| Gap | Meaning | How decided |
|---|---|---|
| 3 | No credible owned site | Unchanged: nothing live, or only parked, expired or for sale, and the Places `websiteUri` empty. |
| 2 | Third party only (unchanged), or an owned site with a critical failure | Down on two checks at least 24 hours apart; invalid or expired certificate; Flash main content; no viewport plus no tap to call plus legacy layout; a single page with no internal links and no contact path. |
| 1 | An owned site that works but fails the rubric | At least 6 points and at least one confirmed core failure (section 3), and the good-site guard did not trip. |
| reject | Good site | Passes K1 to K4 and K5 passes or is unknown, or under 6 points. Goes to `rejected.json` with the domain as `evidenceUrl`. |

Set `thresholds.minWebsiteGap` to 1 (`validateSettings` already accepts 1 to 3). A gap 1 lead earns 20/3, about 6.7 points, against 20 for gap 3 (arithmetic), so it ranks below an otherwise equal no-website lead, which is the intended order.

Tier (stored, never from rating): `tier` is chosen from the stored 45 points plus reachability. Tier A is the top weekly slice by stored points that also has a sourced email or a business line. Ties break by a seeded rotation, not by reputation. The live 55 points are for the human choosing who to call first.

New `lane`: `new-site` (gap 3, or gap 2 third party only) and `redesign` (any owned site, gap 1 or 2). Pitch copy, offer wording and email templates differ by lane. Add an optional `settings.lanes` quota; default no quota until the pilot shows the mix.

### 1.7 What agents do versus what scripts do

| Work | Who | Notes |
|---|---|---|
| Plan, Text Search, filters, chain, suppression, known | Script | Exists, extend. |
| Site audit, PSI, rubric verdict, email extraction | Script | New. |
| Overture import and match | Script | Phase 3. Needs an outside tool once a month (section 1.9). |
| Stored 45 point score, tier, lane, batch assembly, ingest, check, test | Script | Batch built from structured agent results, not hand written JSON. |
| Pitch page, email draft, QA sample draw, send plan | Script | Templated. |
| Live reputation display | Script (server endpoint) | Section 6. |
| Tier C light confirmation | Agent, 10 leads per agent | Confirms identity on one independent page, confirms an owned site does not exist for new-site leads (several searches), flags suspected chains or wrong categories. Does not read Google Maps listing pages. A redesign lead with a self-confirming audit needs no agent. |
| Tier A and B six check verification | Agent, 4 leads per agent | Existing checks in `WEEKLY_RUN.md` step 3. Review integrity checks (`compliance.md` section 8) need review text, which is a forbidden field to fetch, so only Tier A gets them, by a person reading a handful of listings. Tier B gets them on reply. Tier C skips them and outreach for Tier C never cites reviews. |
| Bespoke concept | Agent, one per lead | Tier A and replies only, per `docs/site-generation/CONCEPT-BUILD.md`. |
| Real phone confirmation of findings | Human | Tier A and B before using a finding in outreach. |
| Weekly sample review | Human | Section 1.10. |

Agent count by arithmetic (not a measurement): Tier A 10 / 4 = 3, Tier B 35 / 4 = 9, Tier C at most 130 / 10 = 13, plus about 3 coordinators and at most 5 bespoke builders, so about 33 at the upper end. The earlier "88 agents today" and "about 40 after" figures are not derivable from the code and are not used.

Local transcript measurements (checker-corrected, c30): completed research agents in this project averaged 50 turns and 6.3M cache-read tokens (up to 8.7M) over 10 to 18 minutes. The build agents in run `wf_728b5ac4` used 8.6M to 21.1M cache-read tokens over 10 to 35 minutes. These are cache-read counts, not a plan usage unit, and Anthropic publishes no numeric plan limits on the pages read. Savings from running Tier B and C on Sonnet are not demonstrated (in this project Sonnet verifiers used about the same turns and cache reads as Opus verifiers), so tiers differ by task size, not by a claimed model discount. Measure with `/usage` during the ramp.

### 1.8 Demos

- Tier A: bespoke concept per `CONCEPT-BUILD.md`, cap 5 a week to start (`maxConceptAgents` is already a workflow arg, default 10).
- Tier B and C: pitch page and email draft, no demo.
- On a reply: bespoke concept within one business day, capped by a weekly setting (assumption: 8).
- Optional Phase 5: a lighter generator on top of the Site DNA system (`npm run dna`), only after Jamey approves five sample outputs. Until then, `npm run demos` stays retired for concepts per `WEEKLY_RUN.md` step 9.

### 1.9 The Monday run shape

Usage facts (confirmed): subagents draw on the same plan usage (c23). A workflow pauses at a usage limit only in an interactive claude.ai signed in session, only if the reset is within 24 hours, with `autoContinueAtUsageLimit` on and Claude Code v2.1.271 or later, and at most twice; background sessions and `claude -p` do not pause and the affected agent fails (c24, corrected). Defaults: 16 concurrent agents, 1,000 agents per run, an advisory warning above 25 agents (c25). Whether a Desktop scheduled task counts as interactive is unverified, so assume it does not.

So split into resumable stages, each writing its result to disk, and treat the existence of a stage output file as "done":

| When | Stage | Mode |
|---|---|---|
| Mon early | `npm run weekly:prepare`: plan, discover, stage 1 and 2 audit, email extraction, score, tier, assemble pointers | Script. Prefer an OS scheduler or the existing Monday task running one command, so a usage limit cannot interrupt it. |
| Mon | Tier C confirmation, chunks of 5 agents (50 leads) each, one output file per chunk | `workflows/weekly-confirm.js`. A limit loses at most one chunk. |
| Tue | Recheck of any site that was down Monday (the 24 hour rule). Tier A and B six checks. QA sample drawn. | `workflows/weekly-verify.js` plus script. |
| Tue to Wed | Human: review Tier A, review QA sample, phone confirm findings for A and B | People. |
| Wed | Tier A bespoke concepts. Pitch pages and email drafts built. | `workflows/weekly-concepts.js` (extracted from the current workflow) plus script. |
| Wed on | Sending begins within the ramp (section 4). Purge candidates file the same day the run's last agent finishes. | Script. |

### 1.10 Pilot and gates

- **Pilot 1 (no outreach):** 450 requests, full logging, audit everything kept, 50 sites hand labelled by Jamey and Kiel (feature vector plus label only, never the third party HTML), measure seconds per site and PSI call time.
- **Pilot 2:** a different 15 metros and a second search term. Measure the `known` drop rate to see saturation.
- **Gate to scale:** projected qualified leads a week at an affordable request ceiling, and at least 90% agreement between the rubric and the hand labels on "worth pitching or not" (a Kija threshold, not sourced).
- **If yield is short:** raise requests (section 2), add a second search term, add areas for dense metros, or change `minReviews`. Each is Jamey's call.

**Weekly sample review (replaces the earlier 22 lead rule, whose math was wrong).** Draw 40 random leads from Tiers B and C. A "failure" is a lead where a person finds the stated finding or fact false, or the business is closed, a chain, or the wrong place. Hold the Tier C send and fix the cause if 5 or more of the 40 fail. By binomial arithmetic (my calculation, sampling from 150 to 190 is slightly sharper):

| True error rate | Chance the hold triggers (5 or more of 40) | Chance of at least one failure in 40 |
|---|---|---|
| 3% | 0.7% | 71% |
| 5% | 4.8% | 87% |
| 10% | 37.1% | 98.5% |
| 15% | 73.7% | 99.9% |

A 22 lead sample with a hold at 3 triggers only 38% of the time at a 10% true rate, so it was dropped. The independent check on 2026-09-30 found 2 of 20 leads (10%, not 2 of 12) with a working own site, and part of that was freshness drift (c29, corrected).

## 2. Monthly cost

Prices (confirmed on the Google pricing page, last updated 2026-09-28):

| SKU | Free a month | Price per 1,000 after (first tier) |
|---|---|---|
| Text Search Enterprise `E967-44BC-B44D` | 1,000 | $35.00 (g1) |
| Nearby Search Enterprise `772E-9975-BE34` | 1,000 | $35.00, so no saving (g4) |
| Place Details Enterprise `2D9A-3DE0-3766` | 1,000 | $20.00 (g2) |
| Text Search and Place Details, IDs Only | unlimited | free (g3) |

Each request bills once at the highest SKU in its field mask (g8). Tier usage aggregates across all projects on a billing account (g1).

**Discovery (Text Search), my arithmetic: `max(0, requests - 1000) x $0.035`.** Month length matters: 4.33 weeks average, 5 weeks worst case.

| Requests a week | Average month | Cost | 5 week month | Cost |
|---|---|---|---|---|
| 200 | 866 | $0 | 1,000 | $0 (no room for retries) |
| 300 | 1,299 | $10.47 | 1,500 | $17.50 |
| 450 | 1,949 | $33.22 | 2,250 | $43.75 |
| 600 | 2,598 | $55.93 | 3,000 | $70.00 |
| 800 | 3,464 | $86.24 | 4,000 | $105.00 |

**Live ratings (Place Details Enterprise), `max(0, lookups - 1000) x $0.02`.** Lookups scale with page views, not leads: 1,000 is free, 2,600 is $32, 5,000 is $80. The design caps lookups by fetching only when a lead page is opened, never on list views, and by a monthly guard (`data/places-details-usage.json`, default 900).

**Other lines**

| Item | Cost | Status |
|---|---|---|
| Overture data | $0 license (o1, o2) | Needs DuckDB or the Python client run monthly, both free per the quickstart (o10). Neither is on this machine. US-only file size is not measured (the whole world is 10.996 GB across 16 files, o9). |
| PageSpeed Insights | No price found on the pages read | Quota unverified. A keyless call returned HTTP 429 with a daily quota of 0 on 2026-10-02 (psi-keyless-observed, a point-in-time observation of a shared project), so treat a key as required. CrUX API is free at 150 queries a minute per project (crux-api). |
| Outreach email via GHL LC Email | $0.675 per 1,000 sent, $2.50 per 1,000 verifications (c17) | 2,275 sends a month is about $1.54. Only applies if GHL sends. |
| Workspace mailboxes and the new domain | Not researched | Jamey to price. |
| Claude plan usage | Included in the plan | No numeric limit published; measure. |

**Planning range:** discovery $0 to $105 a month, live lookups $0 to about $80, so $0 to about $185 only if both run at their upper bounds. The expected case after the pilot is likely $0 to $45. Recommendation: keep the guard at 900 (free) for the pilot, then set it to the pilot's measured need, with a Google Cloud budget alert at the chosen ceiling (alert feature not researched here).

## 3. Website quality rubric

Pure function `rate(auditEvidence) -> { verdict, points, coreFailures, coreUnknown, findings }`. Each core check is pass, fail or unknown. Unknown never counts as fail. A builder fingerprint never costs points (Web Almanac 2025: mobile Core Web Vitals pass rates Duda 85%, Wix 74%, Weebly 47%, WordPress 45%, almanac-cms-cwv).

**Core checks**

| Id | Check | How | Points |
|---|---|---|---|
| K1 | Secure | HTTPS connects with a valid certificate, and `http://` redirects to `https://` | No HTTPS 3. Invalid or expired certificate: critical. HTTP serves a page without redirecting 1. Mixed content (`http://` script, link, img or iframe on an HTTPS page) 1. K1 fails on no HTTPS, a bad certificate, or no redirect. |
| K2 | Mobile ready | `<meta name="viewport">` whose content includes `width=` (lh-viewport) | Missing 3. Flash (`.swf`, `application/x-shockwave-flash`, `<object>`, `<embed>`) is critical (flash-eol: blocked since 2021-01-12). Legacy layout markers (nested tables, `<font>`, `<center>`, `<frameset>`, `<table width>` of 760 or more) add 1 but are not a K2 failure alone. |
| K3 | Tap to call | A `tel:` link exists | Phone shown as text with no `tel:` link 2. No phone on the homepage 2. Count one. Word the finding about the page code: Apple documents iOS Safari phone detection as on by default (mdn-tel counterpoint), so a plain number can still be tappable on an iPhone. |
| K4 | Contact path | A form with an email, tel or textarea field, a `mailto:`, a booking host from `hosts.js`, or a link matching `contact`, `quote`, `estimate`, `book`, `schedule`, `appointment` | None 2. |
| K5 | Speed (shortlist only) | PSI mobile, categories performance | CrUX p75 in the poor band (LCP above 4000 ms, CLS above 0.25, INP above 500 ms, psi-lab-field) 3. With no field data: two mobile lab runs both under 50 with LCP above 4000 ms 2; if the two disagree run a third and use the median (lh-variability, corrected: a median of 2 is not a median). Total transfer above 5,000 KiB adds 1 (Kija's own threshold on transfer size, lh-byte-weight, corrected). PSI not run: unknown. |

Missing field data is not a signal: CrUX covers only discoverable, sufficiently popular pages with an undisclosed threshold (crux-eligibility). PSI says it plans to stop including real world CrUX data and points to the CrUX API (c27), so field data should come from the CrUX API directly, which needs its own key (crux-api).

**Neglect and search basics**

| Check | Rule | Points |
|---|---|---|
| Copyright year | Highest year on the page, skipped when a `getFullYear` script sits near it. 3 or more years old 1, 6 or more 2 | 1 to 2 |
| Broken links and images | HEAD then GET on 405, up to 40 same-site URLs. Count 404, 410 and DNS failure. 403, 429 and 5xx are unknown. 2 or more broken | 2 |
| Title | Missing, empty or generic (Home, Untitled, Welcome, the bare domain). Google: "Make sure every page on your site has a title" (gsc-title) | 1 |
| Meta description | Missing or empty content (lh-meta-description) | 1 |
| Search basics cap | | 2 |

**Information only, never points:** builder fingerprint, `Last-Modified` (RFC 9110 leaves how it is set to the server, rfc9110-lastmod), LocalBusiness JSON-LD (Google guarantees no feature, gsc-localbusiness), Google Business Profile link, WordPress generator version. The old-WordPress points idea is dropped: generator tags are often hidden, WordPress.org says only the latest version is officially supported but courtesy backports exist (wp-supported, wp-hardening, corrected), and it needs a maintained release table. Write your own fingerprint regexes: the public pattern file is GPL-3.0 (fp-patterns).

**Verdict order**
1. Parked, expired or for sale: gap 3 (existing `detectParked`).
2. Down on two checks at least 24 hours apart: critical, gap 2.
3. Critical flags (bad certificate, Flash, no viewport plus no `tel:` plus legacy layout, single page with no internal links plus K4 fail): gap 2.
4. Needs-human: two or more core checks unknown, a script rendered shell (under 500 characters of text plus SPA markers), a 403 to bots, or a robots restriction or failure.
5. Good-site guard: K1 to K4 pass and K5 passes or is unknown: reject, whatever the other points.
6. Weak: at least 6 points (`siteAudit.weakScoreMin`) and at least one confirmed core failure: gap 1. Example: HTTP only (3), a 2019 copyright (2), no meta description (1) is 6.
7. Otherwise reject.

The threshold of 6 and every weight are Kija heuristics, to be tuned on the 50 hand labelled sites.

**Evidence and pitch rules**
- State at most 3 observed, dated facts tied to getting in touch, with the device or "in the page code". Good: "the phone number is not a tap to call link". Bad: "your site is outdated" or "broken".
- Tier C outreach uses only script verifiable page code facts (no `tel:` link, no viewport tag, served over HTTP). Tier A and B findings get a real phone check first.
- Offer a self check: `https://pagespeed.web.dev/analysis?url=<encoded>` (the `/report?url=` form redirects there, psi-public-report). It runs a fresh test, so numbers will differ.
- Never: scores as grades, loss or revenue claims, security scares, ranking promises (gsc-page-experience: "Google Search always seeks to show the most relevant content, even if the page experience is sub-par"), or criticism of their platform. Keep P1 to P3 and D1 to D8 from `compliance.md`.
- Chrome: Google announced Chrome would ask before the first visit to a public HTTP site, planned for Chrome 154 (chrome-https-default, corrected). Chrome 154 reached stable on 2026-09-22 and its release notes list "Ask before HTTP on by default". Staged rollout share and Android or iOS scope are unverified, so word it as "Chrome 154 lists this behaviour" and confirm on a real phone before using it.
- Show-safe context stats: BrightLocal 2026 part 3 (1,227 US recent local searchers, 2026-07-15): "Missing or incorrect information" 20% and "Unclear pricing or no offers" 32% as reasons not to contact; "professional-looking website" 20% is a top three share and ranks 9 of 10, not a deciding factor (bl-csb26-decisions, corrected). The 73% mobile figure is on BrightLocal's Channels page, not part 3 (checker note 10). Only 48% of mobile sites pass Core Web Vitals (almanac-cwv).
- Internal only, or labelled with year and sample: Google/SOASTA 113% (a neural net model, not observed bounce, soasta-2017) and 123% (same 2017 model, google-2018-benchmarks); DoubleClick 53% (about 3,700 opted in sites, March 2016, doubleclick-2016); Deloitte 2020 (37 large brand sites, 2019 data, the 8.4% appears only in image alt text, deloitte-2020). Never use "1 s to 3 s raises bounce 32%" (not found in the primary text, dnu-32pct).
- No primary source measures what a weak site costs a local business in revenue. Never state a loss.

**PSI data handling.** Google APIs Terms 5(e) bar building databases or permanent copies of API content unless the owner or law permits, and tie caching to the cache header (gapi-tos-5e, corrected; the header was not checked). So store only a minimal dated summary (category scores, lab LCP, CLS, TBT, total bytes, and CrUX p75 values), never the `lighthouseResult` JSON, and rerun before a pitch. The 30 day expiry is a Kija choice, not sourced. CrUX datasets are CC BY 4.0 (crux-license, corrected: it says nothing about PSI output, and the attribution must include a license link and a note of modification).

## 4. Outreach operating model and deliverability

### 4.1 Model

- **Channels:** one to one email for every lead with a sourced address; live calls by a person for Tier A and B with a business line (`phoneLineType`), inside the existing call window; no cold texts (existing rule T1).
- **Sender:** 3 Workspace mailboxes (one per person) on a separate, clearly Kija branded outreach domain whose site points to kijacreative.com so the sender stays accurately identified. GHL's own cold email advice is a separate sub-account and domain, validated lists, and small slow batches, and "Never use your primary sending domain for cold outreach" (c20). GHL is the CRM and task queue, not the bulk sender.
- **No GHL bulk campaigns.** Reasons: GHL calls cold outreach "generally not recommended" (c20); its dedicated domain warm-up advances only when "the full daily limit for the current stage is reached" and stage 1 is 1,000 a day (c19), so a 35 a day sender never moves; its two ramp pages describe different agency cohorts and which applies to Kija is unverified (c18, corrected); and Google's Maps AUP ban applies (4.3).
- **Touches:** first email plus 2 follow-ups, spaced over about 2 to 3 weeks. A reply, an opt out or a bounce ends the sequence.
- **Messages:** human reviewed before each batch, personalised line from the audit finding or business category, no Google rating or review numbers by default (section 5).

### 4.2 Capacity arithmetic

3 mailboxes x 35 a day x 5 days = 525 sends a week = 175 leads x 3 touches. There is no headroom, and 200 leads x 3 = 600 does not fit. The 35 a day cap is a Kija heuristic, not a provider limit: Workspace allows 2,000 messages a day per user and blocks sending for up to 24 hours beyond it (c16). To reach 200 leads either use 4 mailboxes, send 2 touches to Tier C, or accept about 175.

Ramp (Kija heuristic, per mailbox per day): week 1 at 10, week 2 at 20, week 3 at 30, week 4 at 35. Weekly sends 150, 300, 450, 525, so the lead intake you can actually contact is about 50, 100, 150, 175. Do not ingest more than the sends can cover; excess waits. Move up a step only if the sample review did not hold, hard bounces were 3 or fewer per mailbox per week, and replies are answered within one business day. Lead decay is real: re-probe before sending.

### 4.3 Deliverability requirements (all confirmed unless marked)

| Rule | Detail |
|---|---|
| Gmail, all senders | SPF or DKIM, TLS, valid forward and reverse DNS, spam rate below 0.3% in Postmaster Tools (c1). Scope is mail to personal Gmail accounts (c5). |
| Gmail, over 5,000 a day | SPF and DKIM, DMARC, one click unsubscribe (c2). Counts the primary domain and subdomains together, and bulk status never expires (c3). Kija is far below this. |
| Gmail spam rate | Keep below 0.1% and never reach 0.3% (c4). The lost mitigation support is stated for bulk senders only. At about 2,275 emails a month, 0.3% is about 7 spam reports. |
| Gmail opt in guidance | "Make sure recipients opt in to get messages from you", and start low and increase slowly (c6). Cold outreach is in tension with this. |
| Postmaster | "Data might be missing if the total number of messages for a given day is too low" (c7), so expect empty dashboards. |
| Yahoo | All senders: SPF or DKIM, spam rate below 0.3%. Bulk: SPF and DKIM, DMARC at least p=none, one click unsubscribe, honor unsubscribes within 2 days (c8). Yahoo "will not specify a volume threshold" (c9), so Kija may count. |
| Microsoft | For domains sending over 5,000 a day to Outlook.com consumer addresses: SPF, DKIM, DMARC (at least p=none). After May 5, 2025 non compliant mail is routed to Junk. No rejection date on the page (c10, corrected). |
| CAN-SPAM | "The law makes no exception for business-to-business email" (c11). Valid postal address, opt out honored within 10 business days and working for 30 days after sending (c12), clear ad disclosure, accurate headers and subject (`compliance.md` E1 to E9). Up to $53,088 per email, and promoter and sender can both be liable (c13; the FTC said amounts stay unchanged during 2026). |
| Maps and Workspace AUP | The shared Google AUP bars using services "to generate, distribute, publish or facilitate unsolicited mass email" (c14, corrected: this is the shared cloud.google.com/terms/aup, and the same clause binds Workspace mailboxes). Whether human reviewed one to one cold mail at 105 a day is "mass" is a legal judgment the page does not answer. |
| Google end user terms | The bar on a "business listings database, mailing list, or telemarketing list" applies only to datasets used in a service that substitutes for Google Maps (c15, corrected). The binding API limits are Terms 3.2.3. |
| Kija DNS today (c28, corrected) | Mail is on Google Workspace. SPF reaches `_spf.google.com` only through a nested include (GoDaddy managed). DMARC is `p=none` with reports to kiel@. No DKIM key at the default `google._domainkey` selector, but another selector may exist: confirm in the Admin console. The new outreach domain needs its own SPF, DKIM and DMARC. |
| Authentication target | SPF, DKIM and DMARC at `p=none` on day one (meets every minimum above), move to quarantine after 4 clean weeks (heuristic). |
| Unsubscribe | Body opt out line and same day suppression. Adding a one click `List-Unsubscribe` header needs a sending tool that supports it; plain Workspace one to one mail does not add it. Yahoo's no threshold statement means this cannot be ruled out as applicable. Risk accepted at this volume, Jamey's call. |

### 4.4 Monitoring and stop rules

Spam complaints are largely unobservable at this volume: Postmaster may be blank (c7), and the Gmail feedback loop is for large volume senders (checker note 3). So use observable triggers (Kija heuristics): pause one mailbox for 48 hours at 4 or more hard bounces in a week (2% of a 175 send week is 3.5); pause on any bounce code naming a block or reputation problem; pause on 3 or more angry or opt out replies in a week; review all mail after any pause. Verify addresses before sending: GHL's verification price is $2.50 per 1,000 (c17), whether it can be used without GHL sending is unverified. Apply suppression the same day (rule E6) and for any channel (C7).

### 4.5 Contact data is a second ceiling

0 of 20 current leads have any email field, and one lead check noted a business with no business email or contact form (checker note 7). Businesses chosen for having no website are the least likely to publish an email. So Tier C volume may be capped by contact data rather than agents. Redesign lane leads usually have a contact page, which fits email better. Calls stay the main channel for no-website leads, which makes the Texas chapter 302 decision urgent (`texasRegistration` is `unknown`). Also needed: `phoneLineType` filled for calls (`compliance.md` C5).

### 4.6 Team capacity (planning assumptions, to measure in the pilot)

Minutes: first email 3, follow-up 1.5, call attempt 5 (at most 3), walkthrough 45, bespoke review 20, real phone check 1, sample check 1.

| Work | Count | Minutes each | Total |
|---|---|---|---|
| Tier A (email, 2 follow-ups, 3 calls, concept review) | 8 | 41 | 328 |
| Tier B (email, 2 follow-ups, 2 calls) | 30 | 16 | 480 |
| Tier C (email, 2 follow-ups) | 140 | 6 | 840 |
| Walkthroughs | 4 | 45 | 180 |
| Real phone checks for A and B | 38 | 1 | 38 |
| Sample review | 40 | 1 | 40 |
| **Total** | | | **1,906 minutes, about 32 hours, about 10.6 hours each** |

Reply handling is extra and unmeasured. Owners: assign one person to sample review and one to reply handling (decision below).

## 5. Decisions only Jamey can make

1. **Google Cloud project, billing and a Places API key.** Create one project with one billing account, enable Places API (New), create a key stored as `GOOGLE_PLACES_API_KEY` in `.env`, and restrict it to the APIs used. Billing needs your card, which an agent must not enter. Also set the monthly ceiling (`--max-monthly`; WEEKLY_RUN requires your say so above 1,000) and a Cloud budget alert.
2. **PageSpeed and CrUX keys** in the same project (`PAGESPEED_API_KEY`, `CRUX_API_KEY`), then read the real quota from the Cloud Console Quotas page (it is not published in the docs read).
3. **Accept the compliance model**: live ratings, no stored ratings, no stored 100 point total. And whether to get counsel's view or Google's written confirmation on (a) derived values, (b) storing a placeId to Overture ID link, (c) using Places name and phone as in-memory match keys against Overture, (d) storing a domain first learned from `websiteUri`, (e) whether outreach copy may cite a rating or review count. Default in this plan: it does not.
4. **Outreach route**: Workspace mailboxes on a separate domain (recommended), or GHL with a dedicated sub-account and sending domain. Choose and buy the domain, create the mailboxes, and confirm DKIM in the Admin console. Prices for domain and mailboxes were not researched.
5. **Postal address** for `settings.contact.address`: a street address, a USPS registered PO box or a registered private mailbox (c12). Without it `emailReady` blocks every draft. Also `settings.contact.phone`.
6. **Texas chapter 302**: attorney decision before calling at this volume (`compliance.md` open items), and Florida commercial telephone seller licensing (not researched).
7. **Redesign lane offer**: name, price and promise. `settings.offer` is the "Owned Website" at $2,500 with `priceConfirmed: false`; a redesign is a different pitch.
8. **Demo policy** given your 2026-09-30 rejection: approve the Tier A only plan (default), or approve a lighter generator after seeing five samples.
9. **Quotas**: tier sizes, lane mix, the DFW cap (`homeMaxLeads` 3), ramp pace, and `maxConceptAgents`.
10. **Install a monthly Overture tool** (DuckDB or the Python `overturemaps` client) on the machine that runs the import.
11. **Hand label 50 sites with Kiel** to calibrate the rubric, and assign owners for sample review and replies.
12. **Scheduling**: whether stage 1 runs from an OS scheduler or the existing Monday task.

## 6. Implementation plan

Repo facts that shape this: zero dependency Node, tests with `node --test`, the `audit` npm script already exists (the design audit, `src/cli/audit.js`), so the new site audit is `site-audit`. `settings` writes are whitelisted in `server/api.js` around line 681, so every new settings key must be added there and in `validateSettings`.

### Phase 0: prerequisites (no code)
Decisions 1, 2, 5 and 11 above. Nothing below needs them except the live Places runs.

### Phase 1: website audit and the redesign lane
New files:
- `src/discovery/audit-checks.js`: pure functions over HTML strings and response metadata: `checkViewport`, `findTelLinks`, `findContactPath`, `copyrightYear`, `searchBasics`, `legacyMarkers`, `flashMarkers`, `mixedContent`, `fingerprintBuilder` (own regexes), `isScriptShell`.
- `src/discovery/audit.js`: `auditSite({ url, fetch, tls, lookup, robots, now, settings })` implementing stages 1 and 2, injected I/O, GET and HEAD only, per host rate limit, robots handling per section 1.5. Returns the evidence object.
- `src/discovery/site-rubric.js`: `rate(evidence, settings.siteAudit)` returning `{ verdict, gap, points, coreFailures, coreUnknown, findings }`, with the order in section 3. Exports `RUBRIC_VERSION`.
- `src/discovery/psi.js`: `runPsi({ url, key, fetch })` and `summarizePsi(response)` that returns only the minimal summary. Verify audit ids and `loadingExperience.metrics` key names on the first live response (not fetched in this research, no key). CrUX API fallback in `crux.js`.
- `src/cli/site-audit.js`: `npm run site-audit -- --domain x.com [--name --phone --city --state] [--psi] [--json]`, and `--batch data/inbox/<runId>.candidates.json [--out data/inbox/<runId>.audit.json] [--concurrency 16]`. Output includes a `check` object ready for `verification.checks`, like `probe`. Exit 2 on bad args.
- `package.json`: add `"site-audit": "node src/cli/site-audit.js"`.

Changed files:
- `src/discovery/places.js`: `filterPlaces` stops dropping `kind === "owned"`; replace `dropped.ownedWebsite` with `keptOwned` (count). `kept` entries carry `website: { kind, host }`. `toCandidate` adds `websiteFlag: "owned"` and `siteUrl` (origin only) for owned sites; update `CANDIDATE_FIELDS` and `CANDIDATE_NEXT_STEP`, and extend `PLACES_FILE_NOTICE` to say the site origin is transient working data. Update the header comment.
- `src/discovery/discover.js`: new counts (`ownedKept`), keep `reputationPoints` ordering in memory only.
- `src/discovery/probe.js`: `PROBE_DEFAULTS.userAgent` names Kija and kijacreative.com; add `probeBatch` (concurrency, shared `AbortSignal`).
- `src/lib/score.js`: `scoreLead(lead, { thresholds, reputation })`, `parts` always includes the three stored parts, adds rating and reviews parts only when `reputation` is given, `total` is `null` otherwise, and adds `storedPoints` (max 45). `GAP_WORDS` for 1 becomes "owned site with a confirmed weakness". Drop the warning "Website gap below minimum" when the lead has a `siteAudit.verdict` of `weak`.
- `src/lib/validate.js`: lead fields below, `validateSettings` for new keys, reject `ratingSource: "live"` with stored `googleRating` or `googleReviews`.
- `src/lib/ingest.js`: accept and merge `siteAudit`, `lane`, `tier`, `contactEmail`, `contactEmailSource`; `quota` fallback stays; remove the 10 lead assumption at line 459.
- `config/settings.json` and `server/api.js` whitelist: new keys (below).
- `WEEKLY_RUN.md`: step 2A (owned sites are kept and audited), step 4 gap ladder (replace the gap 1 "not a lead" text), safety rules 7 and 8, remove `bbb.org` mentions.
- `SPEC.md`: the lead schema and the Places rule.

New lead schema fields:
```
lane: "new-site" | "redesign"
tier: "A" | "B" | "C"
ratingSource: "live"            // new allowed value: rating and reviews are not stored
googleRating / googleReviews: absent when ratingSource is "live"
siteAudit: {
  domain, url, checkedAt, auditVersion, rubricVersion,
  verdict: "none" | "third-party" | "good" | "weak" | "critical" | "needs-human",
  points,                       // number
  coreFailures: ["K3", "K4"],   // ids
  coreUnknown: [],
  checks: { k1..k5: { status: "pass"|"fail"|"unknown", detail, evidence } },
  info: { builder, lastModified, localBusinessSchema, gbpLink },
  psi: { checkedAt, runs, mobilePerf, lcpMs, cls, tbtMs, totalBytes, crux } | null,
  domainConfirmedBy: "site-self" | "overture" | "search" | "human",
  humanConfirmed: { at, by, device, findings: [] } | null
}
contactEmail, contactEmailSource, contactEmailCheckedAt   // sourced only
overtureId, overtureRelease                               // Phase 3
```

New settings keys:
```
weeklyQuota: 175
tiers: { A: { perWeek: 10 }, B: { perWeek: 35 }, C: { perWeek: 130 } }
thresholds.minWebsiteGap: 1
geography.metrosPerWeek: 15
categoriesPerWeek: 10
discovery: { termsPerCategory: 1, anchorsPerMetro: 1, maxPages: 3, maxRequestsPerRun: 450, maxMonthlyRequests: 900 }
siteAudit: { weakScoreMin: 6, maxRequestsPerSite: 25, perHostDelayMs: 1000, maxHtmlBytes: 3000000, staleCopyrightYears: [3, 6], brokenMin: 2, brokenSample: 40, psi: { enabled: false, strategy: "mobile", runs: 2, maxPerWeek: 400, resultMaxAgeDays: 30 } }
reputation: { liveLookups: true, maxMonthlyLookups: 900 }
outreach: { mailboxes: 3, rampPerMailboxPerDay: [10, 20, 30, 35], followUps: 2, pauseHardBouncesPerMailboxWeek: 4 }
qa: { sampleSize: 40, holdAtFailures: 5 }
lanes: { minNewSite: 0, minRedesign: 0 }
demo: { conceptsPerWeekTierA: 5, conceptsOnReplyPerWeek: 8 }
```
`psi.maxPerWeek: 400` is a placeholder until the real quota is read.

Tests (add to `test/`, all with injected fetch, tls and dns, no network):
- `discovery-audit-checks.test.js`: one fixture per check, including edge cases (viewport without `width=`, `getFullYear` copyright, `tel:` versus text phone, JS shell, Flash, nested tables).
- `discovery-audit.test.js`: robots disallow, robots 5xx means needs-human, 4xx allowed, redirect chains, HTTP only, expired certificate via a fake `tls`, request and per host rate caps, 3 MB cap, never POST.
- `discovery-rubric.test.js`: the verdict table end to end, good-site guard wins over points, unknown never fails, builder never scores, example of 6 points, down twice rule.
- `discovery-psi.test.js`: summary keeps only the allowed keys, no `lighthouseResult` stored, 429 handled.
- `discovery-places.test.js`: owned sites kept and counted, candidates carry `siteUrl` only for owned, no rating or phone in any written file, `CANDIDATE_FIELDS` frozen set.
- `core-score.test.js`: `total` is null without reputation, 45 stored points, gap 1 now scores without a warning when audited.
- `core-validate.test.js` and `core-ingest.test.js`: new fields, `live` rule, `contactEmailSource` required with `contactEmail`.
- A leak test: run discover with a fixture response containing every Places field and assert none of rating, review count, phone, address or website URI appears in any file other than the candidates file.

### Phase 2: live reputation and compliance model
New files:
- `src/discovery/reputation.js`: `fetchReputation({ placeId, apiKey, fetch })` calls Place Details for `rating` and `userRatingCount` only, returns `{ rating, reviews, fetchedAt, attribution: "Google Maps" }`, never writes, scrubs the key from errors. The endpoint shape and header names must be confirmed against the Place Details (New) page; they were not opened in this research.
- Extend `src/discovery/budget.js` with a second counter file `data/places-details-usage.json` (same `{ "YYYY-MM": count }` shape, default 900).
- `src/cli/reputation.js`: `npm run reputation -- --id <leadId>` prints and writes nothing.
- `server/api.js`: `GET /api/leads/:id/reputation` with `Cache-Control: no-store`, guarded by the details budget.
- `app/components/attribution.js`: renders the logo (asset supplied by Jamey from Google's attribution guidance) or the text "Google Maps" in the same container.
- `app/views/lead.js`: reputation panel with live fetch on open, total score shown only when fetched; `app/views/pipeline.js`, `queue.js`, `week.js`, `leadcard.js`: show the stored 45 points and tier, no ratings in list rows.

Changed: `src/lib/csv.js` and the export leave rating blank for `live` leads (the existing places-api rule); `src/pitch/render.js` and `drafts.js` stop printing Google counts for `live` leads unless a setting allows; `src/demo/*` and `src/design-intelligence/*` read `googleRating` and `googleReviews` in about 20 files (list from `grep`), so make each tolerate absence; `workflows/weekly-research.js` `REQUIRED_LEAD_FIELDS` drops `googleRating` and `googleReviews` for `live` leads.

Tests: `discovery-reputation.test.js` (field mask exactly rating and user rating count, no disk writes, budget refusal), `server-api.test.js` (no-store header, budget), `pitch-*.test.js` (no counts by default), `demo-guardrails.test.js` (tolerates absent rating).

### Phase 3: Overture facts (optional, measure first)
- Monthly, outside the repo, produce one newline JSON or GeoJSON sequence file per metro with a bounding box from `config/geography.json` using the Python `overturemaps download --bbox ... --type=place` (o10) or DuckDB. Confirm the output format on the first run. Pin the release (`2026-09-23.1` now; `2026-12-16` is reserved for a breaking schema change, o7) and use `taxonomy` and `basic_category` because `categories` was removed (o8).
- `src/discovery/overture.js`: load, normalize, `matchCandidate({ name, phone, city, state, metroKey })`. Match by exact phone digits, then normalized name plus city inside the metro bounds. Never use Places coordinates (they are not requested).
- `src/cli/overture-import.js`: `npm run overture:import -- --release 2026-09-23.1 --file <path> --metro <key>`, writes `data/overture/<release>/<metro>.ndjson`, `MANIFEST.json` and the license notice. Add `data/overture/` to `.gitignore`.
- Measure the match rate and the share of matched records with a website before adopting. Treat low confidence and missing `websites` as unknown (o5, corrected: confidence 0 means certain the place does not exist; missing means unknown).

### Phase 4: tiers, staged workflows, QA and outreach
- `src/lib/tier.js`: `assignTiers(leads, settings)` using the stored 45 points and reachability, seeded rotation tie break. Tests for determinism and quotas.
- `src/cli/weekly-prepare.js` and `package.json` script `weekly:prepare`: plan, discover, `site-audit --batch`, email extraction, score, tier, write `data/inbox/<runId>.stage1.json` (kept) and the transient candidates file (purged).
- `src/cli/build-batch.js`: assemble the ingest batch from stage 1 plus agent outputs, so agents return JSON per lead rather than hand writing batch files.
- Split `workflows/weekly-research.js` into `weekly-confirm.js`, `weekly-verify.js`, `weekly-concepts.js`, keeping the Places rule text and `PER_VERIFY_AGENT`. Each reads and writes `data/inbox/<runId>.<stage>.<chunk>.json` and skips a chunk whose output exists. Update `test/discovery-workflow.test.js`.
- `src/cli/qa-sample.js`: `npm run qa-sample -- --run <runId> --n 40`, writes a review sheet and records outcomes; the hold rule is enforced in the week view.
- `src/pitch/drafts.js`: email templates per lane, at most 3 audit facts, ad disclosure line, opt out line, postal address block (block when `settings.contact.address` is empty, already enforced by `emailReady`), no Google counts by default. Tests: `pitch-drafts.test.js`.
- `src/cli/send-plan.js` and `app/views/outreach.js`: today's allowed sends per mailbox from the ramp, touches due, suppression, bounce and pause log (`outreach.history` types already include `email`).
- `src/lib/compliance.js`: add the hard bounce pause check and a `contactEmail` source requirement.
- `npm run check`: warn on missing Overture notice, any PSI raw blob, any lead with `ratingSource: "live"` that still has stored rating fields, and any candidates file older than a day (exists).

### Phase 5 (optional): lighter concept generator
Only if Jamey approves samples. Build on `src/design-intelligence` and `npm run dna`, not on the retired template generator.

### Order of work and acceptance
1. Phase 1 behind `site-audit` with `psi.enabled: false`, run Pilot 1.
2. Hand label 50 sites, tune `weakScoreMin`, reach the 90% agreement gate.
3. Phase 2 before any Tier B or C lead is stored without a rating.
4. Pilot 2, then Phases 3 and 4 as the numbers justify.
5. Acceptance: `npm test` and `npm run check` pass, the leak test passes, a dry run prints the request estimate and both budgets, and a full pilot produces a `stage1.json` whose leads carry no Places value other than `placeId`.

## 7. Not verified

Not confirmed by any fact check, so nothing above relies on them:
- Qualified leads per Places request, the share of owned sites that fail the rubric, and the Overture match rate. All unmeasured (`data/places-usage.json` does not exist yet).
- The default Places queries per minute (the page says only "The rate limit per minute is per API method per project", g7).
- PSI quota and price. The 25,000 a day and 400 per 100 seconds figures come from a third party that contradicts itself (psi-quota-unverified). PSI's Cache-Control header, and live PSI response key names (no key).
- US only Overture size and the share of small businesses with a website filled in.
- The Place Details (New) endpoint shape and the Google logo asset rules (not opened).
- Legal readings: derived values under 3.2.3(c), the splitting of free caps under 3.2.1(c), Yelp commercial license scope, Data Axle and AWS EULAs, whether one to one cold mail at this volume is "mass" under the AUP, Texas chapter 302, Florida licensing.
- Microsoft's rejection date for Outlook.com, whether GHL logs one to one Workspace sends or adds a one click unsubscribe header, GHL's anti spam policy for cold mail, and which GHL ramp cohort Kija's account is in.
- Whether a Desktop scheduled task counts as an interactive session for the workflow usage limit pause; numeric Claude plan limits; plan usage per agent.
- Chrome 154 staged rollout share and Android or iOS scope.
- Prices for the outreach domain and Workspace mailboxes.
- Monthly Overture per metro file sizes.
- Whether the FTC treats address harvesting as an aggravated violation (reported by the checker, quote not captured); the rule "never guess addresses" stands as a Kija rule regardless.

Corrections applied from fact checks: Text Search pages show "Last updated 2026-09-28", not 09-24; an IDs only response cannot be matched to Overture; the "derived values are covered" point is an inference; 20% "professional-looking website" is not a deciding factor; Salesgenie "5 exports" removed; Yelp paid plans are a commercial license for consumer facing display; Chrome 154 shipped 2026-09-22; a median of 2 runs is not a median; 5,000 KiB is Kija's threshold; the 2 of 12 lead error rate is 2 of 20.

## 8. Source ledger (opened 2026-10-02 by the fact checkers, claims dated 2026-09-30)

| Id | Fact | Short wording | URL |
|---|---|---|---|
| g1, g2, g3, g4, g8 | Prices, free caps, billing rule | "billed at the highest SKU applicable to your request" | https://developers.google.com/maps/billing-and-pricing/pricing and https://developers.google.com/maps/documentation/places/web-service/usage-and-billing |
| g5, g6 | 60 results, minRating | "maximum of 60 results across all pages" | https://developers.google.com/maps/documentation/places/web-service/text-search |
| t1, t2 | Cache allowances (Service Specific Terms, modified June 10, 2026) | "may cache (a) place_id from Places API"; lat/lng "for up to 30 consecutive calendar days" | https://cloud.google.com/maps-platform/terms/maps-service-terms |
| t4, t5, t6, t7, t8 | 3.2.3 and 3.2.1 (Maps Platform Terms, modified August 26, 2026) | "will not create content based on Google Maps Content" | https://cloud.google.com/maps-platform/terms |
| t3, t9 | place_id storage, attribution | "Attribution should take the form of the Google Maps logo whenever possible." | https://developers.google.com/maps/documentation/places/web-service/policies |
| t10, c15 | End user terms (modified January 27, 2026) | "mass download or create bulk feeds of the content" | https://www.google.com/help/terms_maps/ |
| o1 to o10 | Overture license, size, fields, cadence | "published under the CDLA Permissive 2.0 and Apache 2.0 licenses" | https://docs.overturemaps.org/guides/places/ and https://docs.overturemaps.org/schema/reference/places/place/ and https://docs.overturemaps.org/release-calendar/ and https://docs.overturemaps.org/getting-data/ |
| o2 | CDLA text | "may use, modify, and share the Data" | https://cdla.dev/permissive-2-0/ |
| f1 to f5 | Foursquare | gated access; Places Portal sign up | https://docs.foursquare.com/data-products/docs/access-fsq-os-places |
| y1, y2 | Yelp terms and prices (terms updated September 22, 2026) | storage "more than 24 hours" barred | https://terms.yelp.com/developers/api_terms/ |
| b1 | BBB | "Use the Sites for sales and marketing purposes;" | https://www.bbb.org/terms-of-use |
| d1, d2, d3 | Data Axle, Salesgenie | prices "Starting at $99/ month"; no SMB prices | https://www.salesgenie.com/product/packages-overview/ |
| psi-key, psi-params, psi-lab-field | PSI API | "a key is recommended for frequent, automated queries" | https://developers.google.com/speed/docs/insights/v5/get-started and https://developers.google.com/speed/docs/insights/v5/about |
| gapi-tos-5e, gapi-tos-2d | Google APIs Terms (modified November 9, 2021) | "will not attempt to circumvent, such limitations" | https://developers.google.com/terms |
| crux-api, crux-license, crux-eligibility | CrUX | "150 queries per minute per Google Cloud project" | https://developer.chrome.com/docs/crux/api and https://developer.chrome.com/docs/crux/methodology |
| almanac-cms-cwv, almanac-cwv | HTTP Archive Web Almanac 2025 | "48% for mobile websites" | https://almanac.httparchive.org/en/2025/cms and https://almanac.httparchive.org/en/2025/performance |
| chrome-https-default | Chrome HTTPS by default (post 2025-10-28; Chrome 154 stable 2026-09-22) | "ask for the user's permission before the first access to any public site without HTTPS" | https://blog.google/security/https-by-defau/ and https://developer.chrome.com/release-notes/154 |
| lh-viewport, lh-byte-weight, lh-meta-description | Lighthouse | viewport content includes "width=" | https://developer.chrome.com/docs/lighthouse/best-practices/viewport |
| rfc9309 | robots.txt | "These rules are not a form of access authorization." | https://www.rfc-editor.org/rfc/rfc9309.html |
| node-tls | Node 24 TLS | "does not enable the SNI extension by default" | https://nodejs.org/docs/latest-v24.x/api/tls.html |
| c1 to c7 | Gmail sender rules | "Keep spam rates reported in Postmaster Tools below 0.3%." | https://support.google.com/a/answer/81126 and https://support.google.com/a/answer/14229414 and https://support.google.com/a/answer/9981691 |
| c8, c9 | Yahoo | "We will not specify a volume threshold." | https://senders.yahooinc.com/best-practices/ and https://senders.yahooinc.com/faqs/ |
| c10 | Microsoft | "For domains sending over 5,000 emails per day" | https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem-outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-senders/4399730 |
| c11, c12, c13 | CAN-SPAM | "The law makes no exception for business-to-business email." | https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business |
| c14 | Shared Google AUP (modified June 23, 2026) | "facilitate unsolicited mass email" | https://cloud.google.com/terms/aup |
| c16 | Workspace limits | 2,000 messages a day per user | https://knowledge.workspace.google.com/admin/gmail/gmail-sending-limits-in-google-workspace |
| c17 to c22 | GHL | "the full daily limit for the current stage is reached" | https://help.gohighlevel.com/support/solutions/articles/48001220605-what-is-lc-email- and /155000005242 and /155000001021 and /155000007790 and /48001226115 and /155000006941 (all under https://help.gohighlevel.com/support/solutions/articles/) |
| c23 to c26 | Claude Code usage and workflows | "The subagent's own requests still draw on your usage." | https://code.claude.com/docs/en/costs and https://code.claude.com/docs/en/workflows and https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work |
| c28, c29, c30 | Local observations (DNS via 8.8.8.8, run data, transcripts) | n/a | `dns:kijacreative.com`, `data/runs/2026-09-30.json`, session transcripts |
| bl-csb26-decisions, soasta-2017, google-2018-benchmarks, doubleclick-2016, deloitte-2020, dnu-32pct | Pitch evidence | see section 3 | https://www.brightlocal.com/research/consumer-search-behavior-decisions/ and the Think with Google and web.dev pages named in the quality research |
