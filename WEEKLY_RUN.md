# Weekly run playbook

This is the step by step routine a fresh Claude session follows every Monday morning to produce
the week's batch of leads for the Kija Lead Command Center. It assumes no memory of earlier
weeks: everything you need is in this file, `SPEC.md` and the data files. Work from the project
root (the folder that holds `SPEC.md`). Follow the steps in order.

The goal each week: about `weeklyQuota` (10) new, independently verified US local businesses
that have earned a strong Google reputation but have no credible website of their own, each
with a private homepage demo and a pitch page ready for Jamey to review. Quality beats count.
Returning six solid leads is a good week; returning ten with two weak ones is not.

## Safety rules (read first, no exceptions)

1. **Never contact a business.** No calls, texts, emails, DMs, chat widgets, reviews, comments,
   quote requests or messages of any kind. Nothing in this routine sends anything to anyone.
2. **Never submit a form on a business's site** or on any directory, and never type personal
   data into a site. Reading pages is fine. Clicking "Get a quote", "Book" or "Send" is not.
3. **Never publish a demo or pitch.** They stay in `demos/` and `pitches/` on this machine. Do
   not upload, host, share or link them anywhere. Only Jamey decides if one is ever shared.
4. **Never create accounts or sign in** anywhere, and never enter a password or API key into a
   website. If a page needs a login to see something, that source is unavailable: note it.
5. **Never bypass a CAPTCHA** or bot check. If one appears, stop using that source for this run,
   note it under "Blocked" in the final summary and continue with other sources.
6. **Never invent facts.** Ratings, review counts, phones, addresses, hours, services, years in
   business, licenses, awards, warranties and review themes come from a page you actually read,
   with that page's URL in `sources`. If you did not read it, leave the field empty.
7. **No em dashes or en dashes anywhere**, in any field, file, note or summary. Use a comma, a
   period or a colon. Plain hyphens inside words and numbers ("30-minute", "2-3") are fine.
8. Do not impersonate a business or imply Kija works with them. Do not print or copy the Places
   API key; only say whether it is present.
9. Read like a person, not a crawler: a handful of pages per business, no bulk downloading.

## Preconditions

1. You are in the project root. Run `node --version`: it must be v24 or later. There is no
   `npm install` step, ever.
2. Work out this week's `runId`: the date of this week's Monday, `YYYY-MM-DD`. `npm run plan`
   (step 1) prints it.
3. If `data/runs/<runId>.json` already exists, this week already ran. Stop and report that,
   unless Jamey asked for a rerun (ingest is idempotent, so a rerun is safe but repeats research).
4. `data/leads.json` must exist and contain leads. If it is missing or an empty array, run
   `npm run seed` once. Never pass `--force` during a weekly run.
5. Run `npm run check`. If it fails, note the failures for the final summary. Continue unless a
   data file cannot be parsed, in which case stop and report.
6. Tools: WebSearch and WebFetch are required. A browser (for example Claude in Chrome) is
   strongly preferred, because the Google Maps listing is the best source for the website field,
   rating and review count, and it does not render through WebFetch. The Places API key
   (`GOOGLE_PLACES_API_KEY` in the environment or `.env`) is optional.
7. If this session has not read them yet, read `SPEC.md` sections "Non negotiable rules", "Lead"
   and "Batch file". They are the contract the batch must meet.

Scheduling note: the Cowork scheduled task prompt can simply be "Open the kija-leads project and
follow WEEKLY_RUN.md from the top. Finish with the final summary." When the Claude Code Workflow
tool is available, the same week can run with parallel agents:
`Workflow({ scriptPath: "<root>/workflows/weekly-research.js", args: { root: "<root>", runId: "<runId>" } })`.
Every rule here still applies to every agent.

## Step 1: plan

Run `npm run plan` (or `npm run plan -- --date YYYY-MM-DD` for a specific week). It prints the
plan and writes `data/inbox/<runId>.plan.json` with:

- `metros`: this week's metros in rotation (each with `anchorCities` and `states`), plus the home
  metro `dallas-fort-worth` when `homeEveryWeek` is on.
- `categories`: this week's category keys. Read each one's `label`, `searchTerms`, `focusNote`,
  `ticketValueDefault` and `visualFitDefault` in `config/categories.json`.
- `quota`: how many leads the week should produce.
- `exclusions`: dedupe keys of businesses already in leads, queue or rejected. Skip them.

Also read `config/settings.json`: `thresholds` (minRating 4.5, preferredRating 4.7, minReviews
20, preferredReviews 30, minWebsiteGap 2) and `geography.homeMaxLeads` (ingest accepts at most
that many home metro leads per week, so spend most of the effort outside the home metro).

Aim to verify about twice the quota (around 20 candidates) so the week still fills after
rejections.

## Step 2: discovery

Work **one metro at a time**. For each metro cover every category of the week at least once,
spread across its anchor cities, and stop that metro at 8 candidates. Record every search you run
(query, source, short notes) for the batch's `searched` list.

### 2A: with a Places key

Run `npm run discover -- --plan data/inbox/<runId>.plan.json`. Add `--dry-run` to that command
first if you want the searches and the request estimate without calling anything. It writes
`data/inbox/<runId>.candidates.json`: operational places with no website, or only a third party
one (flagged `websiteFlag: "third-party"`), at or above the rating and review floors, not chains
and not already known. It prints the request count; include it in the final summary. Every
request bills at Google's Text Search Enterprise rate, so the defaults are modest (1 search term
per category, 3 anchor cities per metro, at most 300 requests); `--terms`, `--anchors`, `--pages`
and `--max-requests` change them, and anything a cap skipped is printed.

Places candidates are **starting points, not verified leads**. An empty website field in Places
is one signal among five. Every candidate still goes through step 3. Google's terms allow storing
place IDs, but other Places content must be refreshed or deleted within 30 days, so keep
`placeId` and `placesFetchedAt` on any lead built from a Places candidate.

If discover prints that the key is missing, or stops on an API error, use 2B.

### 2B: web research (no key, or to add to Places results)

For each category search term and anchor city, try searches such as:

- `<search term> <anchor city> <ST>` and `<search term> near <anchor city> <ST> reviews`
- `<search term> <anchor city> <ST> "no website"` (directories that list missing websites)
- `<search term> <anchor city> facebook` (businesses whose only home is a Facebook page)
- With a browser, Google Maps directly:
  `https://www.google.com/maps/search/<search term>+in+<anchor city>+<ST>`. Scan the results for
  listings with a high rating and plenty of reviews but no "Website" button.

Some metros span several states (New York, Chicago, Philadelphia, Portland and others list more
than one in `states`). Confirm each anchor city's state before you search it: Newark is in New
Jersey, Vancouver in the Portland metro is in Washington.

Directories and aggregators are **leads only, never proof**. Their "no website" labels are often
stale. Treat all of these as places to find names, never as evidence that no site exists:
autorepairestimate.ai, radiatorrepairhub.com, txinspectors.net, stackkly.com, reviews.birdeye.com,
yellowpages.com, allbiz.com, chamberofcommerce.com, autotechiq.com, autorepairscore.com,
bbb.org, cityof.com, findaloco.com, barbershopdirectories.com, septictankhub.com,
waterdamagerepair.io, manta.com, mapquest.com, nextdoor.com, yelp.com and Apple Maps. A rating or
review count read only from a mirror such as Birdeye is `ratingSource: "secondary"`.

### Quick screen

Before spending time on full verification, a candidate must look like:

- rating at least `minRating` (prefer `preferredRating` or higher) and at least `minReviews`
  reviews (prefer `preferredReviews` or more);
- an independent operator, not a chain or franchise (compare against `config/chains.json`, and
  watch for "a franchise of", "locations nationwide" or the same brand in many cities);
- not in the plan's `exclusions`;
- a category from this week's plan, or clearly one of the categories in `config/categories.json`;
- no obvious owned website on the listing itself.

Drop anything that fails. Anything promising but just short (for example 4.6 stars with 200
reviews) can still be checked and go to the queue.

## Step 3: verification (the five mandatory checks)

Every candidate gets all five checks before it can be a lead, and every check is recorded in
`verification.checks` as `{ check, result, url }`. `result` is a full sentence saying what you
found. `url` is the page you read ("" if the check has no single page). Use these exact `check`
names so records stay comparable. Your stance is a skeptic's: you are trying to **refute** "this
business has no credible website".

1. **`exact-name search`**: search `"<Business Name>" <City> <ST>` and read the first two pages of
   results. Also search the phone number in quotes (`"972-681-4966"`). Note any domain that
   looks owned by the business and open it.
2. **`maps listing`**: open the business's Google Maps listing and read, directly when a browser
   is available: the Website field (or its absence), the rating, the review count, the category,
   the address and hours. Record the listing URL in `googleMapsUrl` and set `ratingSource` to
   `"google-maps"`. Without a browser, use the Places data (`"places-api"`) or, last resort, a
   mirror (`"secondary"`, which caps confidence at Medium-High).
3. **`domain probe`**: run
   `npm run probe -- --name "<Business Name>" --city "<City>" --state <ST> --phone "<NNN-NNN-NNNN>"`
   and add `--extra "<domain>"` for any domain you saw in search. It guesses likely domains,
   checks DNS, sends one GET to each that resolves, and prints JSON evidence. Paste its `check`
   object into `verification.checks`. If it reports `owned-domain-found` or
   `possible-owned-domain`, open that site and judge it (step 4, websiteGap).
4. **`social and third party`**: look for Facebook, Instagram, Yelp, booking platforms (Square,
   Fresha, Booksy, Vagaro, StyleSeat) and link in bio pages. Read the website field on each (for
   example Facebook's About section and the Instagram bio link), because that is often where an
   owned domain hides. Record profile URLs in `presence`.
5. **`status, chain and sanity`**: one check covering four things. Operating status (not closed
   permanently or temporarily, recent reviews or posts). Chain or franchise (name and branding,
   `config/chains.json`). Review pattern sanity (reviews spread over months or years, not a burst
   of same day five star reviews, not generic one line reviews from new accounts). A reachable
   published phone (the same number on at least two independent sources). You never call it:
   "reachable" means consistently published, not tested.

Set `verification.status` to `"verified"` only when all five were completed, and
`verification.checkedAt` to today's date. Put anything unresolved in `verification.notes`.

### Confidence rubric

- **High**: all five checks completed; rating and review count read from the Maps listing or the
  Places API this week; no owned domain in search or the probe; the phone matches on at least two
  independent sources; clearly operating and independent.
- **Medium-High**: all five completed with one soft spot, for example the rating came from a
  mirror, the phone appears on only one source, a parked or expired domain once used by the
  business exists, or the third party presence is borderline.
- **Medium**: one check could not be completed (Maps listing unreadable, sources disagree on the
  rating or review count, identity partly unclear). Medium goes to the **queue**, with the open
  question in `verificationNeeded`.
- **Low**: identity unclear, several checks incomplete, or review patterns look manufactured.
  Queue or reject, never a lead.

Only High and Medium-High candidates become leads.

## Step 4: scoring fields

The score is computed by the app from the Scoring Rules (rating 30, reviews 25, websiteGap 20,
ticketValue 15, visualFit 10). You only supply honest inputs. Never adjust a field to move a
score.

- **`websiteGap`** (1 to 3):
  - `3`: no credible owned site. Nothing in search, the probe finds nothing live that belongs to
    them (or only parked, expired or unrelated domains), and the Maps website field is empty.
  - `2`: third party presence only (Facebook, Instagram, Yelp, a booking page, Square Online, an
    old Google `business.site` page, a builder subdomain such as `wixsite.com`), or an owned
    domain that is very weak: a single page with no services, broken on phones, no way to call
    or request an estimate, or plainly abandoned.
  - `1`: an owned site that works, even if dated. That is below `minWebsiteGap`: it is not a lead.
    Put it in `rejected` with the domain as `evidenceUrl` so later weeks skip it.
- **`ticketValue`** (1 low, 2 medium, 3 high): start from the category's `ticketValueDefault`.
  Change it only for a specific, sourced reason (fleet and diesel engine work, European vehicles,
  full remodels raise it; a used tire shop with small tickets lowers it).
- **`visualFit`** (1 limited, 2 good, 3 excellent): start from the category's `visualFitDefault`.
  Raise it when the work is visual and provable (before and after bodywork, custom exhaust,
  pools, a barber with a strong photo feed); lower it when there is little to show.

Record the reasons in `verification.notes`, one short sentence per field, for example:
"websiteGap 2: Facebook page is the only web presence. ticketValue 3: category default.
visualFit 3 over default 2: custom exhaust and welding photos on Facebook."

## Step 5: writing fields

Write for Jamey, who will read these before deciding whether to reach out. Plain, specific,
short. Every fact must be sourced.

- **`websiteStatus`**: one sentence on what a searcher finds today, for example "No owned website
  surfaced in search or the domain probe; the Facebook page is the only web presence."
- **`whyKija`**: one or two sentences on why this business is a strong fit for Kija, grounded in
  facts: review volume, ticket size, visual work, bilingual customers, a gap that costs calls.
- **`pitchAngle`**: one sentence, **trust first**. Start from what they already earned, then the
  missing piece. Never "you need a website", never shame, no urgency, no guarantees.
  Good: "Your 275 five star reviews already sell the work; an owned site turns that trust into
  booked pumping calls." Bad: "You need a website to compete in 2026."
- **`demoConcept`**: one sentence describing the private demo: its design direction, the main
  conversion path (photo estimate, emergency call, booking, quote request) and the proof it
  leads with.
- **`services`**: only service names you read on their Maps listing, Facebook page, Yelp page or
  another source in `sources`. Leave it empty rather than guess.
- **`reviewThemes`**: 2 to 5 short themes paraphrased after reading at least 10 real reviews
  (Maps or Yelp), each a few words, for example "Honest pricing", "Explains the repair",
  "Same day turnaround". Never quotes, never reviewer names, never invented. If you could not
  read reviews, leave it empty.
- **`languages`**: only when the listing, reviews or their pages show service in that language.
- **`established`**, **`hours`**, **`address`**, **`area`**: only when read on a source. For a
  service area business that works from a home address, leave `address` empty.
- **`presence`**: the profile URLs you found (facebook, instagram, yelp, booking, other).
- **`sources`**: at least one entry `{ url, label, checkedAt }`, where `label` is the hostname.
  Include the Maps listing and every page a fact came from.
- **Forbidden claims**: never write licensed, insured, bonded, certified, award, #1, number one,
  best in, since, family owned, guarantee, warranty or financing in any field unless a source in
  `sources` states it. The demo templates enforce the same rule.

## Step 6: batch file

Write `data/inbox/<runId>.json` in the exact shape of "Batch file" in `SPEC.md`. `leads` hold
Lead fields except `id`, `outreach`, `demo`, `addedAt`, `origin` and `runId` (ingest adds those).
Skeleton, with an invented example business for shape only:

```json
{
  "runId": "2026-09-28",
  "mode": "weekly",
  "plan": { "metros": ["dallas-fort-worth", "phoenix"], "categories": ["auto-repair", "hvac"] },
  "searched": [
    { "query": "auto repair in Phoenix, AZ", "source": "google-maps", "notes": "Read the first 40 results; 3 candidates." }
  ],
  "leads": [
    {
      "business": "Example Auto Works",
      "category": "Auto repair",
      "categoryKey": "auto-repair",
      "city": "Phoenix",
      "area": "",
      "state": "AZ",
      "metro": "phoenix",
      "address": "",
      "phone": "602-555-0100",
      "googleRating": 4.9,
      "googleReviews": 212,
      "ratingSource": "google-maps",
      "googleMapsUrl": "https://www.google.com/maps/place/...",
      "placeId": "",
      "placesFetchedAt": "",
      "websiteGap": 3,
      "ticketValue": 3,
      "visualFit": 2,
      "websiteStatus": "No owned website surfaced in search, on the Maps listing or in the domain probe.",
      "presence": { "facebook": "", "instagram": "", "yelp": "", "booking": "", "other": [] },
      "confidence": "High",
      "whyKija": "Over 200 Google reviews prove the trust, but searchers have nowhere to see services or request an estimate.",
      "pitchAngle": "Customers already vouch for this shop; an owned site turns that reputation into estimate requests.",
      "demoConcept": "Clean neighborhood mechanic site with review proof, service grid and a mobile first estimate request.",
      "services": [],
      "reviewThemes": [],
      "languages": [],
      "established": null,
      "hours": "",
      "sources": [ { "url": "https://www.google.com/maps/place/...", "label": "google.com", "checkedAt": "2026-09-28" } ],
      "verification": {
        "status": "verified",
        "checkedAt": "2026-09-28",
        "checks": [
          { "check": "exact-name search", "result": "No owned domain in the first two pages for the name or the phone.", "url": "" },
          { "check": "maps listing", "result": "Listing shows 4.9 from 212 reviews and no website field.", "url": "https://www.google.com/maps/place/..." },
          { "check": "domain probe", "result": "Domain probe checked 48 guessed domains ...", "url": "" },
          { "check": "social and third party", "result": "No Facebook, Instagram or booking page found.", "url": "" },
          { "check": "status, chain and sanity", "result": "Operating with reviews this month, independent, reviews spread over six years, phone matches on two sources.", "url": "" }
        ],
        "notes": "websiteGap 3: nothing owned found. ticketValue 3: category default. visualFit 2: category default."
      },
      "demoCopy": {}
    }
  ],
  "queue": [
    {
      "candidate": "Example Tire Center", "category": "Tire shop", "categoryKey": "tire-shop",
      "city": "Phoenix", "state": "AZ", "metro": "phoenix",
      "whyItMayFit": "4.8 stars from 90 reviews and a Facebook only presence.",
      "websiteStatus": "Facebook page only.", "verificationNeeded": "Maps listing would not load; confirm the rating and the website field.",
      "ownerContact": "", "phone": "602-555-0101", "googleRating": 4.8, "googleReviews": 90,
      "sources": [ { "url": "https://www.facebook.com/...", "label": "facebook.com", "checkedAt": "2026-09-28" } ],
      "decision": "Research", "reason": "Maps listing unreadable this run", "lead": null
    }
  ],
  "rejected": [
    { "business": "Example Plumbing Co", "city": "Phoenix", "state": "AZ", "phone": "602-555-0102", "reason": "Owns a working site with services and a booking form.", "evidenceUrl": "https://exampleplumbing.example/" }
  ],
  "reverify": [],
  "notes": ""
}
```

What goes where:

- **`leads`**: passed all five checks, High or Medium-High, at or above every floor. Include every
  qualifier, even beyond the quota or the home metro cap: ingest ranks them by score, keeps the top
  `weeklyQuota` with at most `homeMaxLeads` from the home metro, and moves the rest to the queue
  as "Qualified overflow" with the full lead carried for promotion.
- **`queue`**: promising but unresolved: Medium confidence, sources that disagree, just under a
  floor, or not verified this week. Say exactly what is missing in `verificationNeeded`. Carry a
  partial lead in `lead` when you have one.
- **`rejected`**: checked and not a fit, so later weeks skip it: a working owned site
  (`evidenceUrl` is the site), closed, a chain or franchise, suspicious reviews, or a lead
  generation listing rather than a real operator.
- **`searched`**: every search, including the ones that found nothing.
- **`reverify`**: step 7.

## Step 7: reverify stale leads and queue items

Do this research before ingesting, because its results go in the same batch file.

Stale **leads** (at most 8 a week, oldest first): outreach status `New` or `Research` and any of:
`verification.status` is `"needs-recheck"` (every sheet import starts that way),
`verification.checkedAt` is more than 30 days old, or `placesFetchedAt` is more than 30 days old
(Google's caching limit on Places content). Rerun the five checks and add one entry per lead:

```json
{ "id": "gm-auto-care-dallas-tx", "googleRating": 4.9, "googleReviews": 512, "websiteGap": 3,
  "websiteStatus": "...", "confidence": "High", "verification": { "status": "verified", "checkedAt": "2026-09-28", "checks": [], "notes": "" },
  "sources": [], "decision": "keep", "reason": "Still no owned site; review count up 11." }
```

Use `"decision": "reject"` when the business now has a credible owned site, has closed or turned
out to be a chain. Ingest then sets it to `Not a fit` only if outreach is still `New` or
`Research`; later stages are never changed automatically. For a lead whose rating came from the
Places API and is over 30 days old, reread the rating and count directly on the Maps listing and
send `"ratingSource": "google-maps"` in the reverify entry; ingest then clears `placesFetchedAt`.
If you refreshed it from the Places API instead, send `"ratingSource": "places-api"` and
`"placesFetchedAt": "<today>"`. If you cannot do either, list that lead id in the final summary as
"Places fields need refresh".

Stale **queue items**: decision `Research` and `updatedAt` more than 14 days old. Recheck the
open question in `verificationNeeded`. Do not add them to `leads`: queue decisions are Jamey's, in
the app's queue view. Put a recommendation (Promote, Keep researching or Drop) with the evidence
in the final summary.

## Step 8: ingest

Run `npm run ingest -- data/inbox/<runId>.json`. It validates every lead in weekly mode, dedupes
against leads, queue and rejected, queues threshold misses, keeps the top `weeklyQuota` by score,
applies reverify entries, prints a report and writes `data/runs/<runId>.json`.

If the report lists **errors**, fix the data, never the rules:

- Allowed: reread the source and correct a wrong value, remove an optional fact you cannot
  source, rewrite a sentence that uses a forbidden claim or a dash, add a missing check or source
  you actually have, or move a lead that cannot be made valid into `queue` with a reason.
- Not allowed: editing `config/settings.json` thresholds, `config/chains.json`, anything in
  `src/`, or `data/leads.json` and `data/queue.json` by hand; inventing a fact to satisfy a rule.

Then run ingest again. It is idempotent: leads accepted on the first pass show up as duplicates on
the second, which is expected. Repeat until there are no errors. Read the warnings too (below
preferred thresholds, Medium confidence, secondary ratings) and make sure each one is deliberate.

## Step 9: demos and pitches

Run `npm run demos -- --run <runId>`, then `npm run pitches -- --run <runId>`. This builds a
private demo in `demos/<id>/index.html` and a pitch page in `pitches/<id>/index.html` for each lead
added this run. Demos carry a "Private concept by Kija Creative" ribbon and `noindex`, and their
forms send nothing. You may look at them through the local app (`npm start`, then
`http://127.0.0.1:4242/`), which only listens on this machine. Never upload or share them.

If a reverified lead changed a lot (rating, review count, website status), rebuild its pages with
`npm run demos -- --id <id>` and `npm run pitches -- --id <id>`.

## Step 10: check and test

Run `npm run check` and `npm test`. `check` validates every data file, scans for dash characters
and checks every demo against the guardrails. If a failure comes from this run's data, fix the
batch file, ingest again and rebuild the affected pages. Never change code to make a check pass.
If a failure is in code, leave it and report it.

## Final summary

End the run with this summary, plain text, no dashes. It is what Jamey reads first.

```
Kija lead run <runId> (<ISO week>)
Metros: <keys>. Categories: <keys>.
Discovery: <n> candidates found (Places: <yes, n requests | no key>), <n> fully verified.
Result: <n> new leads, <n> queued, <n> rejected, <n> duplicates, <n> leads rechecked.

New leads by score:
1. <Business>, <City> <ST>: score <n>. <rating> stars from <n> Google reviews. <one line why>.
2. ...

Queue: <notable items and why they wait>.
Queue recommendations: <id>: Promote | Keep researching | Drop, <evidence>.
Rechecks: <id>: kept | rejected, <what changed>. Places fields need refresh: <ids or none>.
Blocked or incomplete: <CAPTCHAs, unreadable sources, caps hit, anything skipped>.
Checks: npm run check <passed | failed: reason>. npm test <passed | failed: reason>.

Next for Jamey: open the app (npm start, http://127.0.0.1:4242/#/week), review each demo and
pitch, and decide who to contact. Nothing was sent to anyone and nothing was published.
```
