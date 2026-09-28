# Kija Lead Command Center: research index

Synthesized 2026-09-28 from six research topics, each independently fact checked. A claim is used only when its verdict is confirmed or corrected (then the corrected value, quote and URL). Refuted and unchecked claims are listed under "Do not use" in the topic files. No em or en dashes are used anywhere in these files.

## Files

| File | For | Contents |
|---|---|---|
| [places-api.md](places-api.md) | Engineer on `src/cli/discover-places.js`; weekly playbook | Discovery recommendation, request shape, field masks and SKUs, prices and free caps, Table A types per category, storage and caching terms, attribution, alternatives |
| [consumer-stats.md](consumer-stats.md) | Pitch copy, `src/pitch` | Every usable consumer stat with exact wording, year, source and a "safe to show an owner" verdict; do not use list |
| [benchmarks.md](benchmarks.md) | ROI model, `computeRoi` | Per category ticket, margin and rented lead with reasoning; website market prices |
| [compliance.md](compliance.md) | Drafts, call scripts, demos, validator | Outreach rules (email, calls, texts, Texas registration, demos), chain matching, fake review signals. Not legal advice |
| [chains-extra.json](chains-extra.json) | `config/chains.json` | `{ "names": [...] }`, 355 chain and franchise names |
| [benchmarks.json](benchmarks.json) | `data/benchmarks.json` | SPEC shape: 41 consumer stats, 31 categories, website market |

## Topic summaries and claim counts

| Topic | Summary | Usable | Rejected |
|---|---|---|---|
| Discovery data sources | Google Places API (New) Text Search is the only licensed option. Every useful request is Text Search Enterprise ($35 per 1,000 after 1,000 free a month), so about 650 requests a month costs $0. Service area businesses need `includePureServiceAreaBusinesses: true`. Only place IDs may be stored. Scrapers (Apify, Outscraper, SerpApi) breach Google's end user terms; Yelp forbids direct marketing | 52 | 1 (outscraper-price, refuted) |
| Consumer behavior stats | BrightLocal 2026 surveys carry the pitch: 97% read reviews, 54% check the website after positive reviews, 52% of recent searchers walked away from a business they looked at, 73% of searches start on a phone. The no-website penalty has only vendor evidence (DreamHost, GoDaddy). No reliable national no-website rate exists | 38 (plus 3 confirmed blocklist entries) | 0 |
| Tickets: auto and personal care | Sourced tickets for all 14 keys from CCC, Tekmetric, Monro, Modern Tire Dealer, Fullbay, Squire, KIM Report and marketplaces. Margins assume shops that pay staff | 60 | 0 |
| Tickets: home services and contractors | Consumer cost guides (HomeAdvisor, HomeGuide) for tickets; IRS SOI, NAHB, Rollins, Davey, BrightView for margins. Blended tickets replaced by sourced single-job averages | 66 | 4 (3 refuted, 1 unchecked) |
| Rented lead costs and website prices | LSA charges per lead by auction and moves into Performance Max from August 2026. About $233 per paying customer on LSA and $472 on Google Ads (SearchLight). Websites: freelancers $1,000 to $5,000, agencies mostly under $10,000, subscriptions $79 to $500 a month | 69 | 0 |
| Outreach guardrails, chains, review fraud | CAN-SPAM applies to B2B. Personal cells may count as residential. No cold texts. Texas chapter 302 probably covers calls from Dallas. Demos stay private with a disclaimer. 355 chain names. Review signals lower confidence, never accuse | 89 | 0 |
| **Total** | | **374** | **5** |

## Key decisions for the app

1. **Discovery is Google Places Text Search only**, with the field mask in `places-api.md`, `includePureServiceAreaBusinesses: true`, `minRating: 4.5`, up to 3 pages per query, and a budget guard that stops at 900 requests a month.
2. **Persist only place IDs from Places.** Change the SPEC `placesFetchedAt` 30 day rule: place IDs are kept indefinitely and refreshed after 12 months; no other Places field is written to disk. Every lead fact comes from an independent source.
3. **Never build demo or pitch content from Places data** (Terms 3.2.3(c)). Show the Google rating only live, with "Google Maps" attribution, or leave it out of exports. Jamey decides which.
4. **Add a Google Maps notice** in Settings or About, and never plot Places content on the coverage tile map.
5. **Benchmarks lean low on purpose.** Home services typicals are single-job sourced averages (HVAC $320, not a $1,000 blend). Unverified values have empty sources and notes starting "Estimate, not verified:", and the UI must label them. `rentedLead` is null where unknown; no margin is 0.
6. **Pitch the cost per paying customer**, not just cost per lead: about $233 per LSA customer (SearchLight, February 2026).
7. **Consumer stats carry source and year inline.** Never state a national percentage of businesses without websites.
8. **Email is the default channel.** Add `settings.contact.postalAddress` (blocks drafts while empty), an ad line, an opt out line and a suppression list.
9. **Calls are manual only**, 9 a.m. to 8 p.m. local, Monday to Saturday, at most 1 a day and 3 total. Add `phoneLineType` and treat mobiles as possibly residential.
10. **No cold texts.** `followUpText` only with recorded consent; never Washington numbers without it.
11. **Texas registration flag** (`settings.compliance.texasRegistration`) stays `unknown` until an attorney decides between the 302.059(1) exemption and registering ($200 fee, $10,000 security).
12. **Demos stay private**: password protected or expiring links, a disclaimer inside exported files, no prospect-name domains, no copied logos, photos or review text, deletion on request.
13. **Chain matching** by whole name or prefix, never substring; network badges and salon suite hosts are warnings, not exclusions.
14. **Review signals** lower confidence or queue a lead; they never appear in outreach.

## Process notes

- Sources that could not be opened are named in each file (Outscraper pages, CourtListener docket, gated PartsTech, Fullbay 2023, Skimmer and Birdeye reports, Upwork, eCFR, some FCC pages).
- During compliance research, one sec.gov download sent James's email address in the User-Agent header because SEC asks for a contact. Later requests used a generic placeholder. No forms were submitted, no accounts were created, and nobody was contacted.
- Nothing here is legal advice.
