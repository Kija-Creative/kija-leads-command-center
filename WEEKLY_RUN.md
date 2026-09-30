# Weekly run playbook

This is the step by step routine a fresh Claude session follows every Monday morning to produce
the week's batch of leads for the Kija Lead Command Center. It assumes no memory of earlier
weeks: everything you need is in this file, `SPEC.md` and the data files. Work from the project
root (the folder that holds `SPEC.md`). Follow the steps in order.

The goal each week: about `weeklyQuota` (10) new, independently verified US local businesses
that have earned a strong Google reputation but have no credible website of their own, each
with a private homepage demo and a pitch page ready for Jamey to review. Quality beats count.
Returning six solid leads is a good week; returning ten with two weak ones is not.

The research rules below come from `research/places-api.md` (what Google's terms allow) and
`research/compliance.md` (outreach guardrails, chains, review integrity). Neither is legal advice.

## Safety rules (read first, no exceptions)

1. **Never contact a business.** No calls, texts, emails, DMs, chat widgets, reviews, comments,
   quote requests or messages of any kind. Never call or text a number to see if it works.
   Nothing in this routine sends anything to anyone.
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
   with that page's URL and the date you read it in `sources`. If you did not read it, leave the
   field empty.
7. **Every lead fact is independently sourced. Places output is a pointer, never a fact.** From
   the Google Places API only the place ID may be kept (`placeId`, with `placeIdCheckedAt`). Never
   copy a name, phone, rating, review count, address, hours, website or Maps URL from Places output
   or from `data/inbox/<runId>.candidates.json` into a lead, a queue item, a rejection or a note,
   and never build demo or pitch content from it. Google's terms forbid storing Places content and
   creating content from it (Maps Platform Terms 3.2.3, `research/places-api.md` section 6).
8. **Read Google Maps like a person.** Open one public listing at a time in a browser, at a human
   pace, and read what the page shows. Never bulk download, scrape or script Maps, and never read
   more than a handful of pages per business anywhere.
9. **The suppression list is absolute.** `data/suppression.json` lists businesses that asked not
   to be contacted or that Kija decided never to contact. Never research, queue, reject or add
   them again, and never name them in notes or the summary (a count is fine).
10. **Never register, park or reserve a domain**, least of all one containing the business's name.
11. **Review integrity concerns stay internal.** They lower confidence or send a candidate to the
    queue (step 3, check 6). They go only in `verification.checks` and `verification.notes`, never
    in `whyKija`, `pitchAngle`, `demoConcept`, `websiteStatus`, `reviewThemes`, `services` or
    `demoCopy`, and never as an accusation.
12. **Keep people out of it.** Do not record an owner's personal name, home address or personal
    social profiles in any field. For a service area business that works from a home, leave
    `address` empty.
13. **No em dashes or en dashes anywhere**, in any field, file, note or summary. Use a comma, a
    period or a colon. Plain hyphens inside words and numbers ("30-minute", "2-3") are fine.
14. Do not impersonate a business or imply Kija works with them. Do not print or copy the Places
    API key; only say whether it is present.
15. **Purge Places working data at the end of every run** (step 11), including a run that stops
    early or fails.

## Preconditions

1. You are in the project root. Run `node --version`: it must be v24 or later. There is no
   `npm install` step, ever.
2. Work out this week's `runId`: the date of this week's Monday, `YYYY-MM-DD`. `npm run plan`
   (step 1) prints it.
3. If `data/runs/<runId>.json` already exists, this week already ran. Run step 11 (purge), then
   stop and report that, unless Jamey asked for a rerun (ingest is idempotent, so a rerun is safe
   but repeats research).
4. `data/leads.json` must exist and contain leads. If it is missing or an empty array, run
   `npm run seed` once. Never pass `--force` during a weekly run.
5. Read `data/suppression.json` (a missing file means nobody is suppressed). Keep the list open:
   you check every candidate against it.
6. Run `npm run check`. If it fails, note the failures for the final summary. Continue unless a
   data file cannot be parsed, in which case stop and report.
7. Tools: WebSearch and WebFetch are required. A browser (for example Claude in Chrome) is
   strongly preferred, because the public Google Maps listing is the best source for the website
   field, rating and review count, and it does not render through WebFetch. The Places API key
   (`GOOGLE_PLACES_API_KEY` in the environment or `.env`) is optional.
8. If this session has not read them yet, read `SPEC.md` sections "Non negotiable rules", "Lead"
   and "Batch file". They are the contract the batch must meet.

Scheduling note: the Cowork scheduled task prompt can simply be "Open the kija-leads project and
follow WEEKLY_RUN.md from the top. Finish with the final summary." When the Claude Code Workflow
tool is available, the same week can run with parallel agents:
`Workflow({ scriptPath: "<root>/workflows/weekly-research.js", args: { root: "<root>", runId: "<runId>" } })`.
It starts at most `maxAgents` agents (default 14) and logs anything a cap leaves out. Every rule
here still applies to every agent.

## Step 1: plan

Run `npm run plan` (or `npm run plan -- --date YYYY-MM-DD` for a specific week). It prints the
plan and writes `data/inbox/<runId>.plan.json` with:

- `metros`: this week's metros in rotation (each with `anchorCities` and `states`), plus the home
  metro `dallas-fort-worth` when `homeEveryWeek` is on.
- `categories`: this week's category keys. Read each one's `label`, `searchTerms`, `focusNote`,
  `ticketValueDefault` and `visualFitDefault` in `config/categories.json`.
- `quota`: how many leads the week should produce.
- `exclusions`: dedupe keys of businesses already in leads, queue or rejected. Skip them, and
  skip everything on the suppression list too.

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

Run `npm run discover -- --plan data/inbox/<runId>.plan.json`. Add `--dry-run` first if you want
the searches, the request estimate and the monthly budget without calling anything.

**Budget guard.** Every request bills at Google's Text Search Enterprise rate, free for the first
1,000 a month and $35 per 1,000 after that. Discover counts requests per calendar month in
`data/places-usage.json` and never goes past `--max-monthly` (default 900). It prints the requests
used this month and the free calls left; put those numbers in the final summary. When the guard is
used up it refuses and calls nothing: use 2B for the rest of the month. The per run defaults are
modest (1 search term per category, 2 anchor cities per metro, at most 3 pages, at most 180
requests); `--terms`, `--anchors`, `--pages` and `--max-requests` change them, and anything a cap
skipped is printed. Never raise `--max-monthly` above 1,000 without Jamey's say so.

**The candidates file is transient working data.** `data/inbox/<runId>.candidates.json` exists
only for this run and is deleted in step 11. Each candidate is a pointer: `placeId`,
`placeIdCheckedAt`, `business`, `category`, `categoryKey`, `city`, `state`, `metro`,
`serviceArea` (a service area business with no storefront address), `websiteFlag` (`"none"`, or
`"third-party"` when Places saw only a page such as Facebook), `mapsUrl` (the public listing,
built from the place ID) and the `query` that found it. Discover already dropped places that are
closed, have an owned website, fall below the rating or review floors, sit outside the metro, are
suppressed, match a chain, or are already known.

For every pointer you keep:

- Confirm the business on independent public pages: open `mapsUrl` in a browser (one listing at a
  time), or find its Facebook, Yelp or BBB page. Take the name, city, state and phone as those
  pages show them and record the URLs.
- Carry only `placeId` and `placeIdCheckedAt` into the lead. Everything else is re-read in step 3.
- If you cannot confirm the business on an independent page, drop it.

An empty website field in Places is one signal among several. Every candidate still goes through
step 3. If discover prints that the key is missing, refuses on the monthly guard, or stops on an
API error, use 2B.

### 2B: web research (no key, or to add to Places results)

For each category search term and anchor city, try searches such as:

- `<search term> <anchor city> <ST>` and `<search term> near <anchor city> <ST> reviews`
- `<search term> <anchor city> <ST> "no website"` (directories that list missing websites)
- `<search term> <anchor city> facebook` (businesses whose only home is a Facebook page)
- With a browser, Google Maps directly, one results page at a time:
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
- an independent operator, not a chain or franchise (see "Chains" below);
- not in the plan's `exclusions` and **not on the suppression list** (phone digits, or name plus
  state);
- a category from this week's plan, or clearly one of the categories in `config/categories.json`;
- no obvious owned website on the listing itself.

Drop anything that fails. Anything promising but just short (for example 4.6 stars with 200
reviews) can still be checked and go to the queue.

**Chains** (`research/compliance.md` section 7):

- Compare the whole normalized name, or its start, with `config/chains.json`. Never match on a
  word inside a name. Franchise locations add a suffix ("Mr. Rooter Plumbing of North Dallas"), and
  a prefix match catches them.
- Spot check any match before rejecting: some chain names are generic (Classic Collision, Premier
  Pools & Spas, Oil Changers, Garage Experts, Club Car Wash, Brake Check, City Looks, Style America,
  Groundworks, California Pools) and an independent can share them.
- Watch for "a franchise of", "locations nationwide" or the same brand in many cities. Private
  equity roll ups often keep local names; they almost always have websites, so check 1 drops them.
- **Network badges and host brands are not chains.** NAPA AutoCare Center, AAA Approved Auto
  Repair, Tire Pros, Point S, Bosch Car Service, ACDelco, Goodyear independent dealers, salon suite
  hosts (Sola Salon Studios, Phenix Salon Suites, MY SALON Suite, Salon Lofts, Image Studios, Salons
  by JC: a stylist inside is independent, the suite location itself is a chain), HVAC and plumbing
  dealer programs (Carrier, Lennox, Trane, Ruud, Nexstar) and roofing credentials (GAF, Owens
  Corning, CertainTeed). Note them, check whether a network page is a credible owned site, and
  never repeat a credential in any field unless a source in `sources` states it.

## Step 3: verification (six checks)

Every candidate gets all six checks before it can be a lead, and every check is recorded in
`verification.checks` as `{ check, result, url }`. `result` is a full sentence saying what you
found. `url` is the page you read ("" if the check has no single page). Use these exact `check`
names so records stay comparable. Your stance is a skeptic's: you are trying to **refute** "this
business has no credible website". Nothing a discovery step or Places handed you counts as a
fact until you read it yourself.

1. **`exact-name search`**: search `"<Business Name>" <City> <ST>` and read the first two pages of
   results. Also search the phone number in quotes (`"972-681-4966"`). Note any domain that
   looks owned by the business and open it.
2. **`maps listing`**: open the business's public Google Maps listing in a browser, one listing
   at a time (a Places pointer's `mapsUrl` opens it), and read the Website field (or its absence),
   the rating, the review count, the category, the address and the hours. Record the listing URL
   in `googleMapsUrl` and in `sources` with today's `checkedAt`, write the date in the result (for
   example "Read on 2026-09-28: 4.9 from 212 reviews, no website field."), and set
   `ratingSource: "google-maps-observed"`. Without a browser, read a mirror such as Birdeye
   (`"secondary"`), or the business's own page that states its Google rating (`"owner"`); both cap
   confidence at Medium-High. `"places-api"` is never a valid `ratingSource`, and a number from
   the candidates file is never a reading.
3. **`domain probe`**: run
   `npm run probe -- --name "<Business Name>" --city "<City>" --state <ST> --phone "<NNN-NNN-NNNN>"`
   and add `--extra "<domain>"` for any domain you saw in search. It guesses likely domains,
   checks DNS, sends one GET to each that resolves, and prints JSON evidence. Paste its `check`
   object into `verification.checks`. If it reports `owned-domain-found` or
   `possible-owned-domain`, open that site and judge it (step 4, websiteGap). Never register or
   reserve a domain it reports as free.
4. **`social and third party`**: look for Facebook, Instagram, Yelp, booking platforms (Square,
   Fresha, Booksy, Vagaro, StyleSeat) and link in bio pages. Read the website field on each (for
   example Facebook's About section and the Instagram bio link), because that is often where an
   owned domain hides. Record profile URLs in `presence`.
5. **`status, chain and sanity`**: one check covering three things. Operating status (not closed
   permanently or temporarily, recent reviews or posts). Chain or franchise (the Chains rules in
   the quick screen). A published phone: take it from the business's own public listings (its
   Maps listing, Facebook page, Yelp or BBB page), never from Places output, and look for the same
   number on at least two independent sources. You never call it: "reachable" means consistently
   published, not tested. Set `phoneLineType`: `"mobile"` when a listing suggests a personal cell
   (for example "call or text my cell", a number labeled mobile, a one person business run from a
   home), otherwise `"unknown"`. Never guess `"landline"` or `"voip"`, and never use a carrier
   lookup service. A mobile may count as a residential line under FCC rules, which is why this is
   recorded.
6. **`review integrity`** (`research/compliance.md` section 8). Read the newest reviews and the
   rating spread like a careful customer.
   - **Hard stops** (reject or queue, never a lead): a warning banner that fake reviews were
     removed, or a review freeze; fake listing signs (a keyword stuffed name, a virtual office or
     residential address for a claimed storefront, near identical profiles sharing a phone, a
     sudden unrelated category change); reviews that mention an incentive ("got 10% off for
     leaving this").
   - **Signals**: a burst (over a third of all reviews in one 30 day window with no visible
     cause); thin accounts (over half of the 10 newest 5 star reviewers have 1 or 2 reviews, no
     photos, no Local Guide level); almost no 2 to 4 star reviews, or only 5s and 1s; generic
     praise, repeated phrasing, similar lengths, services the business does not list, or many
     reviews naming one staff member; reviewers far from the metro; identical canned owner
     replies or replies offering rewards; a sharp mismatch with Yelp, Facebook or BBB, or a Yelp
     consumer alert; hundreds of reviews on a profile that looks months old.
   - **Two or more signals lower confidence one step; three or more send the candidate to the
     queue.** The thresholds are Kija heuristics, not sourced rules.
   - Positive signals: reviewer photos of the real shop or work, a steady flow over years,
     specific varied detail, a few critical reviews with calm replies, ratings that roughly agree
     across platforms.
   - Write what you saw in the result sentence. These are risk signals, not findings about the
     business: they stay in `verification`, never in an outreach field.

For a candidate that came from a Places pointer, set `placeId` and `placeIdCheckedAt` from the
pointer. Leave both `""` otherwise. Never write `placesFetchedAt`; it is retired.

Set `verification.status` to `"verified"` only when all six were completed, and
`verification.checkedAt` to today's date. Put anything unresolved in `verification.notes`.

### Confidence rubric

- **High**: all six checks completed; rating and review count read on the public Maps listing
  this week (`google-maps-observed`); no owned domain in search or the probe; the phone matches on
  at least two independent sources; clearly operating and independent; at most one review signal.
- **Medium-High**: all six completed with one soft spot, for example the rating came from a mirror
  or the owner's page, the phone appears on only one source, a parked or expired domain once used
  by the business exists, the third party presence is borderline, or two review signals lowered
  it from High.
- **Medium**: one check could not be completed (Maps listing unreadable, sources disagree on the
  rating or review count, identity partly unclear), or review signals lowered it from
  Medium-High. Medium goes to the **queue**, with the open question in `verificationNeeded`.
- **Low**: identity unclear, several checks incomplete, three or more review signals, or a hard
  stop. Queue or reject, never a lead.

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
short. Every fact must be sourced from a page you read, never from Places output.

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
  "Same day turnaround". Never quotes, never reviewer names, never invented, never anything about
  review integrity. If you could not read reviews, leave it empty.
- **`languages`**: only when the listing, reviews or their pages show service in that language.
- **`established`**, **`hours`**, **`address`**, **`area`**: only when read on a source. For a
  service area business that works from a home address, leave `address` empty.
- **`presence`**: the business's profile URLs you found (facebook, instagram, yelp, booking,
  other), never an owner's personal profile.
- **`phoneLineType`**: from check 5, `"mobile"` or `"unknown"`.
- **`sources`**: at least one entry `{ url, label, checkedAt }`, where `label` is the hostname and
  `checkedAt` the date you read it. Include the Maps listing (or the mirror) and every page a fact
  came from.
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
    { "query": "auto repair in Phoenix, AZ", "source": "google-maps", "notes": "Read the first results page by hand; 3 candidates." }
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
      "phoneLineType": "unknown",
      "googleRating": 4.9,
      "googleReviews": 212,
      "ratingSource": "google-maps-observed",
      "googleMapsUrl": "https://www.google.com/maps/place/...",
      "placeId": "",
      "placeIdCheckedAt": "",
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
          { "check": "maps listing", "result": "Read on 2026-09-28: 4.9 from 212 reviews and no website field.", "url": "https://www.google.com/maps/place/..." },
          { "check": "domain probe", "result": "Domain probe checked 48 guessed domains ...", "url": "" },
          { "check": "social and third party", "result": "No Facebook, Instagram or booking page found.", "url": "" },
          { "check": "status, chain and sanity", "result": "Operating with reviews this month, independent, phone matches on the Maps listing and Yelp.", "url": "" },
          { "check": "review integrity", "result": "Reviews spread over six years with photos and a few calm replies to critical ones; no signals.", "url": "" }
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

- **`leads`**: passed all six checks, High or Medium-High, at or above every floor. Include every
  qualifier, even beyond the quota or the home metro cap: ingest ranks them by score, keeps the top
  `weeklyQuota` with at most `homeMaxLeads` from the home metro, and moves the rest to the queue
  as "Qualified overflow" with the full lead carried for promotion.
- **`queue`**: promising but unresolved: Medium confidence, sources that disagree, just under a
  floor, review signals that sent it here, or not verified this week. Say exactly what is missing
  in `verificationNeeded`. Carry a partial lead in `lead` when you have one.
- **`rejected`**: checked and not a fit, so later weeks skip it: a working owned site
  (`evidenceUrl` is the site), closed, a chain or franchise, a review integrity hard stop, or a
  lead generation listing rather than a real operator.
- **Suppressed businesses go nowhere**: not in leads, queue, rejected, `searched` notes or `notes`.
- **`searched`**: every search, including the ones that found nothing. Notes carry counts and
  what you did, never Places content.
- **`reverify`**: step 7.

## Step 7: reverify stale leads and queue items

Do this research before ingesting, because its results go in the same batch file. Skip anything
on the suppression list.

Stale **leads** (at most 8 a week, oldest first): outreach status `New` or `Research` and any of:
`verification.status` is `"needs-recheck"` (every sheet import starts that way),
`verification.checkedAt` is more than 30 days old, `ratingSource` is `"places-api"`, or the lead
still carries a `placesFetchedAt` value (a retired field). Rerun the six checks, re-read the
rating and review count yourself on the public Maps listing (or a mirror), and add one entry per
lead:

```json
{ "id": "gm-auto-care-dallas-tx", "googleRating": 4.9, "googleReviews": 512, "ratingSource": "google-maps-observed",
  "websiteGap": 3, "websiteStatus": "...", "confidence": "High",
  "verification": { "status": "verified", "checkedAt": "2026-09-28", "checks": [], "notes": "" },
  "sources": [], "decision": "keep", "reason": "Still no owned site; review count up 11." }
```

Send `0` and `""` for a value you could not re-read. Never send `placesFetchedAt`; ingest drops it.
Use `"decision": "reject"` when the business now has a credible owned site, has closed, turned out
to be a chain, or shows a review integrity hard stop. Ingest then sets it to `Not a fit` only if
outreach is still `New` or `Research`; later stages are never changed automatically.

Place IDs may be kept indefinitely, but Google recommends refreshing one older than 12 months.
List every lead whose `placeIdCheckedAt` is more than a year old in the final summary under
"Place IDs to refresh". The refresh is a free IDs only Place Details call and is not automated
yet; never refresh anything else from Places.

Stale **queue items**: decision `Research` and `updatedAt` more than 14 days old. Recheck the
open question in `verificationNeeded`. Do not add them to `leads`: queue decisions are Jamey's, in
the app's queue view. Put a recommendation (Promote, Keep researching or Drop) with the evidence
in the final summary.

## Step 8: ingest

Run `npm run ingest -- data/inbox/<runId>.json`. It validates every lead in weekly mode, dedupes
against leads, queue, rejected and the suppression list, queues threshold misses, keeps the top
`weeklyQuota` by score, applies reverify entries, prints a report and writes
`data/runs/<runId>.json`.

If the report lists **errors**, fix the data, never the rules:

- Allowed: reread the independent source and correct a wrong value, remove an optional fact you
  cannot source, rewrite a sentence that uses a forbidden claim or a dash, add a missing check or
  source you actually have, or move a lead that cannot be made valid into `queue` with a reason.
- Not allowed: editing `config/settings.json` thresholds, `config/chains.json`, anything in
  `src/`, or `data/leads.json`, `data/queue.json` and `data/suppression.json` by hand; copying a
  value from the Places candidates file; inventing a fact to satisfy a rule.

Then run ingest again. It is idempotent: leads accepted on the first pass show up as duplicates on
the second, which is expected. Repeat until there are no errors. Read the warnings too (below
preferred thresholds, Medium confidence, secondary ratings, place IDs to refresh) and make sure
each one is deliberate.

## Step 9: concepts and pitches

Build every accepted lead's concept to `docs/site-generation/CONCEPT-BUILD.md`: plan its Site DNA
and prove the variation rules first (section 1), then build it from the GitHub code sources with
the skynet-site-system and design-playbooks flows (sections 2 to 4). One builder per lead. Never
run `npm run demos` for a concept: Jamey rejected that old template generator on 2026-09-30.
Then run `npm run pitches -- --run <runId>` for the pitch pages. Concepts carry a "Private
concept by Kija Creative" ribbon and `noindex`, and their forms send nothing. You may look at them
through the local app (`npm start`, then `http://127.0.0.1:4242/`), which only listens on this
machine. Never upload or share them.

If a reverified lead changed a lot (rating, review count, website status), rebuild its concept to
the same standard and run `npm run pitches -- --id <id>`.

## Step 10: check and test

Run `npm run check` and `npm test`. `check` validates every data file, scans for dash characters
and checks every demo against the guardrails. If a failure comes from this run's data, fix the
batch file, ingest again and rebuild the affected pages. Never change code to make a check pass.
If a failure is in code, leave it and report it.

## Step 11: purge Places working data

Run `npm run purge-places`. It deletes every `data/inbox/*.candidates.json`, the transient
Places working files, and `npm run check` warns about any that are left. `data/places-usage.json` holds request counts only and stays.
Run it at the end of **every** run: after a full run, a run with no Places key, a run that
stopped early, a week that already ran, or a failed step. Then confirm no `*.candidates.json` is
left in `data/inbox/`. If the purge fails, say so in the final summary.

## Final summary

End the run with this summary, plain text, no dashes. It is what Jamey reads first.

```
Kija lead run <runId> (<ISO week>)
Metros: <keys>. Categories: <keys>.
Discovery: <n> candidates found (Places: <yes, n requests this run, n of 900 used this month, n free calls left | no key | monthly guard used up>), <n> fully verified.
Result: <n> new leads, <n> queued, <n> rejected, <n> duplicates, <n> leads rechecked, <n> suppressed businesses skipped.

New leads by score:
1. <Business>, <City> <ST>: score <n>. <rating> stars from <n> Google reviews. <one line why>.
2. ...

Queue: <notable items and why they wait>.
Queue recommendations: <id>: Promote | Keep researching | Drop, <evidence>.
Rechecks: <id>: kept | rejected, <what changed>. Place IDs to refresh: <ids or none>.
Blocked or incomplete: <CAPTCHAs, unreadable sources, caps hit, anything skipped>.
Checks: npm run check <passed | failed: reason>. npm test <passed | failed: reason>.
Places working file purged: <yes | no, reason>.

Next for Jamey: open the app (npm start, http://127.0.0.1:4242/#/week), review each demo and
pitch, and decide who to contact. Nothing was sent to anyone and nothing was published.
```
