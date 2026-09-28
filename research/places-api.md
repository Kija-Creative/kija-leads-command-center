# Discovery data source: Google Places API (New) Text Search

Synthesized 2026-09-28 from the places research topic and its independent fact check. Every fact below carries a fact checker verdict of confirmed or corrected. Google pages were last updated 2026-09-24 unless noted. Readers: the engineer writing `src/cli/discover-places.js`, and the weekly research playbook (`WEEKLY_RUN.md`).

Terms interpretations in this file are research notes, not legal advice.

## 1. Recommendation

1. **Use Google Places API (New) Text Search as the only automated discovery source.** It is the only option reviewed whose terms allow this use at all.
2. **Every discovery request is billed at Text Search Enterprise**, because the fields we need (`websiteUri`, `rating`, `userRatingCount`, `nationalPhoneNumber`) are Enterprise fields. Price: $35.00 per 1,000 requests after 1,000 free requests a month per billing account.
3. **Expected Google bill: $0.** About 150 requests a week is about 650 a month (750 in a five week month), under the 1,000 free cap.
4. **Set `includePureServiceAreaBusinesses: true` on every request.** Without it the API returns only businesses with a physical location, which drops mobile mechanics and many contractors, the trades most likely to have no website.
5. **Persist only `places.id`.** The Maps Platform Terms forbid copying and saving business names, addresses or reviews. The only Places cache allowances are place IDs (indefinitely) and latitude and longitude (30 days). **SPEC.md's `placesFetchedAt` 30 day rule is wrong and must change** (section 6).
6. **Never build demo or pitch content from Places data.** Terms 3.2.3(c) says "Customer will not create content based on Google Maps Content." Lead facts used in demos and pitches must come from independent sources recorded in `sources`.
7. **Do not use Apify, Outscraper, SerpApi or Yelp** (section 8).

## 2. Request shape

```
POST https://places.googleapis.com/v1/places:searchText
Content-Type: application/json
X-Goog-Api-Key: <GOOGLE_PLACES_API_KEY from .env>
X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.businessStatus,places.googleMapsUri,places.primaryType,places.types,places.pureServiceAreaBusiness,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,nextPageToken
```

```json
{
  "textQuery": "auto repair shop",
  "includedType": "car_repair",
  "strictTypeFiltering": false,
  "includePureServiceAreaBusinesses": true,
  "minRating": 4.5,
  "pageSize": 20,
  "regionCode": "us",
  "languageCode": "en",
  "locationRestriction": {
    "rectangle": {
      "low":  { "latitude": 36.0, "longitude": -96.1 },
      "high": { "latitude": 36.3, "longitude": -95.7 }
    }
  }
}
```

Coordinates are placeholders. Build rectangles from `config/geography.json` anchor cities. Omit `includedType` (and `strictTypeFiltering`) for categories with no Table A type (section 5).

Second and third page: send the identical body plus `"pageToken": "<nextPageToken from previous response>"`.

### Parameter rules (all confirmed on the Text Search (New) page or the REST reference)

| Parameter | Rule | Source wording |
|---|---|---|
| Field mask | Required. Comma separated, no spaces. Wildcard `*` is discouraged in production. May also be sent as a `$fields` or `fields` URL parameter instead of the header. | "There is no default list of returned fields in the response. If you omit the field mask, the method returns an error." |
| `textQuery` | Required. Keep it categorical ("roofing contractor") and put geography in `locationRestriction`. A location named inside the text overrides `locationBias`. | |
| `includedType` | Exactly one Table A type. Table B types cannot be used. | "Only one type may be specified." and "You cannot use values in Table B as a filter." |
| `strictTypeFiltering` | Default false. When true only places matching `includedType` return. | "When set to true, only places that match the specified types specified by includedType are returned." |
| `locationRestriction` | Rectangle only. Categorical queries only. Cannot be combined with `locationBias`. | "Specifies an area to search for categorical queries only" |
| `locationBias` | Rectangle or circle. Circle radius 0 to 50,000 m. | "The radius must be between 0.0 and 50000.0, inclusive." |
| `pageSize` | 1 to 20, default 20. Values above 20 become 20. `maxResultCount` is deprecated and ignored when `pageSize` is set. | "If pageSize is 0 or unspecified, the API will return 20 results per page by default." |
| `pageToken` | Pass back `nextPageToken` (must be in the field mask). Everything else must match the first request, or the API returns INVALID_ARGUMENT. | "All parameters other than maxResultCount, pageSize, and pageToken must be the same as the previous request." |
| Results per query | Maximum 60 across all pages (3 pages of 20). To get more, split a metro into several rectangles or query variants. | "Text Search (New) returns a maximum of 60 results across all pages, although this limit is subject to change." |
| `minRating` | Server side filter, 0 to 5 in 0.5 steps, rounded up. Filters out results strictly below it. 4.5 matches `settings.thresholds.minRating` and does not change the SKU. | "Values are rounded up to the nearest 0.5." |
| `includePureServiceAreaBusinesses` | Must be true to include businesses without a storefront. If false, only businesses with a physical location return. | "Include pure service area businesses if the field is set to true." |

**Data shape consequence:** pure service area businesses come back without `formattedAddress` ("businesses without a physical service address don't include the formattedAddress field"). The in-memory candidate shape must allow a missing address. `places.pureServiceAreaBusiness` (a Pro field, free to add since the request is already Enterprise) tells you which ones they are.

## 3. Field masks and SKUs

A request is billed once, at the highest SKU of any field in its mask: "You are then billed at the highest SKU applicable to your request." (Places API Usage and Billing.)

| SKU | Trigger fields (Text Search) |
|---|---|
| Text Search Essentials (IDs Only), SKU 635D-A9DD-C520 | `places.id`, `places.name`, `places.attributions`, `places.consumerAlert`, `places.movedPlace`, `places.movedPlaceId`, `nextPageToken` |
| Text Search Pro, SKU 4FDA-34B1-A910 | includes `places.displayName`, `places.formattedAddress`, `places.businessStatus`, `places.googleMapsUri`, `places.primaryType`, `places.types`, `places.location`, `places.pureServiceAreaBusiness` |
| Text Search Enterprise, SKU E967-44BC-B44D | includes `places.nationalPhoneNumber`, `places.internationalPhoneNumber`, `places.rating`, `places.userRatingCount`, `places.websiteUri`, opening hours, `places.priceLevel` |
| Text Search Enterprise + Atmosphere, SKU 120C-BEC3-B48F | adds `places.reviews`, `places.reviewSummary`, `places.editorialSummary` and similar. **Do not request these.** Any one of them raises the request to $40.00 per 1,000. |

Billable event for Text Search Enterprise (SKU details page): "Successful request for Enterprise fields". Each `pageToken` call is a separate request, so each page of up to 20 places is one billable event. (The page does not state the per page point explicitly; it follows from per request billing.)

## 4. Prices and free caps

Source: Google Maps Platform core services pricing list, last updated 2026-09-24. USD per 1,000 billable events. Free caps are per SKU, per calendar month, aggregated across all projects on the billing account.

| SKU | Free cap / month | Cap to 100,000 | 100,001 to 500,000 | 500,001 to 1,000,000 | 1,000,001 to 5,000,000 | 5,000,000+ |
|---|---|---|---|---|---|---|
| Text Search Essentials (IDs Only) | Unlimited | free | | | | |
| Text Search Pro | 5,000 | $32.00 | $25.60 | $19.20 | $9.60 | $2.40 |
| **Text Search Enterprise** | **1,000** | **$35.00** | $28.00 | $21.00 | $10.50 | $2.63 |
| Text Search Enterprise + Atmosphere | 1,000 | $40.00 | $32.00 | $24.00 | $12.00 | $3.40 |
| Place Details Enterprise (SKU 2D9A-3DE0-3766) | 1,000 | $20.00 | $16.00 | $12.00 | $6.00 | $1.51 |
| Place Details Essentials (IDs Only) | Unlimited | free | | | | |

Verbatim pricing rows: "Places API Text Search Enterprise E967-44BC-B44D 1,000 $35.00 $28.00 $21.00 $10.50 $2.63" and "Places API Place Details Enterprise 2D9A-3DE0-3766 1,000 $20.00 $16.00 $12.00 $6.00 $1.51".

Free caps replaced the old credit on March 1, 2025: "Google has replaced the USD $200 monthly recurring credit with a free monthly usage threshold for each Core Services SKU." Caveats: there is no plain Text Search Essentials SKU (only IDs Only, which is unlimited); the 10,000 Essentials cap applies to other SKUs such as Place Details Essentials. The Places Usage and Billing page still carries a stale sentence about a $200 credit ending February 28, 2025. Cite the pricing page and the March 2025 page, not that sentence.

### Cost estimate

| Item | Value |
|---|---|
| Planned Text Search Enterprise requests | about 150 a week (assumption: about 50 query variants x 3 pages, for 4 metros x 6 categories) |
| Requests a month | 150 x 52 / 12 = about 650; 750 in a five week month |
| Places touched | at most 20 per request, so at most 3,000 a week |
| Cost with free cap | $0 |
| Cost above the cap | $0.035 per request |
| Cost of the same volume without any cap | about $22.75 a month |
| Live rating lookups by place ID | Place Details Enterprise, separate 1,000 free a month |

A two stage design (free IDs-only search, then Place Details per ID) costs more, because each Place Details call covers one place while one Text Search page covers 20.

**Budget guard for `discover-places.js`:** count Text Search requests per calendar month in `data/runs/` and stop at 900. Keep a separate counter for Place Details Enterprise and stop at 900. Set a Cloud budget alert at $1. Keep one billing account and one project: Terms 3.2.1(c)(ii)(1) bars using the Services "in a manner intended to: (1) avoid incurring Fees", and splitting usage to multiply free caps reads as that (interpretation, not legal advice).

## 5. Table A types per category key

Types marked (2026) were added in the February 12, 2026 release: "Types with an asterisk (*) were added as part of the February 12, 2026 release." (Place Types (New) page.)

The Automotive Table A group is exactly: car_dealer, car_rental, car_repair, car_wash, ebike_charging_station, electric_vehicle_charging_station, gas_station, parking, parking_garage, parking_lot, rest_stop, tire_shop, truck_dealer. No body shop, muffler, diesel, mechanic, detailing or towing type exists anywhere on the page.

The Services Table A group (corrected by the fact checker; it is much larger than the researcher's list): aircraft_rental_service, association_or_organization, astrologer, barber_shop, beautician, beauty_salon, body_art_service, catering_service, cemetery, chauffeur_service, child_care_agency, consultant, courier_service, electrician, employment_agency, florist, food_delivery, foot_care, funeral_home, hair_care, hair_salon, insurance_agency, laundry, lawyer, locksmith, makeup_artist, marketing_consultant, moving_company, nail_salon, non_profit_organization, painter, pet_boarding_service, pet_care, plumber, psychic, real_estate_agency, roofing_contractor, service, shipping_service, storage, summer_camp_organizer, tailor, telecommunications_service_provider, tour_agency, tourist_information_center, travel_agency, veterinary_care. There is no HVAC, pest, landscaping, fencing, concrete, septic, garage door, restoration, appliance, tree, remodeling or pool service type. The only pool type is swimming_pool in the Sports group, which is a facility.

| categoryKey | includedType | textQuery variants | Notes |
|---|---|---|---|
| auto-repair | `car_repair` | "auto repair shop", "mechanic" | |
| auto-body-collision | none | "auto body shop", "collision repair" | Optional: `car_repair` non strict as a bias. Untested. |
| tire-shop | `tire_shop` (2026) | "tire shop", "used tires" | |
| muffler-exhaust | none | "muffler shop", "exhaust repair" | |
| diesel-truck-repair | none | "diesel repair", "truck repair" | `truck_dealer` is not a repair type. |
| mobile-mechanic | none | "mobile mechanic" | Service area businesses must be on. |
| auto-detailing | none | "auto detailing", "window tint" | `car_wash` is a different business. Do not use. |
| towing | none | "towing service" | |
| barber | `barber_shop` | "barber shop" | |
| hair-salon | `hair_salon` | "hair salon" | `hair_care` and `beauty_salon` also exist. |
| nail-salon | `nail_salon` | "nail salon" | |
| tattoo | `body_art_service` | "tattoo shop" | Mapping inferred from the type name. Run one test query before relying on it. |
| pet-grooming | `pet_care` (2026), non strict | "dog grooming" | Broad type. `pet_boarding_service` also exists. |
| general | `service` (2026) | per theme | Very broad. Rely on textQuery. |
| hvac | none | "HVAC contractor", "air conditioning repair" | |
| plumbing | `plumber` | "plumber" | |
| electrical | `electrician` | "electrician" | |
| septic | none | "septic service" | |
| garage-door | none | "garage door repair" | |
| restoration | none | "water damage restoration" | |
| appliance-repair | none | "appliance repair" | |
| pest-control | none | "pest control" | |
| roofing | `roofing_contractor` | "roofing contractor" | |
| concrete | none | "concrete contractor" | |
| fencing | none | "fence contractor" | |
| pools | none | "pool service", "pool builder" | `swimming_pool` is a facility. Do not use. |
| landscaping | none | "landscaping" | `garden_center` is a store. |
| painting | `painter` | "house painter" | |
| foundation-repair | none | "foundation repair" | |
| remodeling | none | "remodeling contractor" | `general_contractor` is Table B, response only: "Values from Table B may NOT be used as part of a request". Useful as an in-memory post filter on `types`. |
| tree-service | none | "tree service" | |

**textQuery only (19 keys):** auto-body-collision, muffler-exhaust, diesel-truck-repair, mobile-mechanic, auto-detailing, towing, hvac, septic, garage-door, restoration, appliance-repair, pest-control, concrete, fencing, pools, landscaping, foundation-repair, remodeling, tree-service.

**Future category candidates** with exact Table A types (not in the current 31 keys): locksmith, moving_company, catering_service, florist, laundry, tailor, pet_boarding_service, makeup_artist, foot_care.

## 6. Storage, caching and content terms (quoted)

| Rule | Source | Wording |
|---|---|---|
| No scraping or storing | Maps Platform Terms 3.2.3(a) (last modified August 26, 2026) | "Customer will not export, extract, or otherwise scrape Google Maps Content for use outside the Services", example (iii): "copy and save business names, addresses, or user reviews". Google Maps Content includes "places data (including business listings)". |
| No caching | Terms 3.2.3(b) | "Customer will not cache Google Maps Content except as expressly permitted under the Maps Service Specific Terms." |
| Place IDs may be kept | Service Specific Terms (last modified June 10, 2026), General Terms section 3 | "Customer may cache (a) place_id from Places API, Directions API, Geolocation API and Routes API". Places policies page: "You can therefore store place ID values indefinitely." |
| Coordinates only, 30 days | Service Specific Terms 14.3 | "Customer may temporarily cache latitude and longitude values from the Places API for up to 30 consecutive calendar days, after which Customer must delete the cached latitude and longitude values." No other Places field has a cache allowance. |
| Refresh old place IDs | Place IDs page | "Google recommends refreshing place IDs if they are more than 12 months old." Refresh free with a Place Details request for the `id` field only (IDs Only SKU, unlimited). NOT_FOUND means obsolete. |
| No content built from Places data | Terms 3.2.3(c) (added by the fact checker) | "Customer will not create content based on Google Maps Content." Directly relevant to demo homepages and pitch pages. |
| No listings or ad products | Terms 3.2.3(d)(iii) | "use the Google Maps Core Services in a listings or directory service or to create or augment an advertising product". Private sales lead lists are not named, but 3.2.3(c) and the end user terms below also bind. |
| No non-Google maps | Terms 3.2.3(e); Service Specific Terms 14.2 | "display or use Places content on a non-Google Map"; "Customer must not use Google Maps Content from the Places API in conjunction with a non-Google map." Places content may be used with no map at all (SST 14.1). |
| No spam | Maps Platform AUP (last modified June 23, 2026) | "to generate, distribute, publish or facilitate unsolicited mass email, promotions, advertisements, or other solicitations (\"spam\");" |
| End user terms | Google Maps Additional Terms (last modified January 27, 2026), Prohibited Conduct | "mass download or create bulk feeds of the content (or let anyone else do so);" and a ban on building a "business listings database, mailing list, or telemarketing list" for a substitute service. |

### What this means for the code

1. Keep Places response objects in memory for the length of the run only.
2. Persist per candidate only: `placeId`, the query, metro, category, run id and the reason it passed or failed. Never write `displayName`, `formattedAddress`, `nationalPhoneNumber`, `websiteUri`, `rating`, `userRatingCount` or coordinates from an API response to `data/`, `demos/`, `pitches/` or `exports/`.
3. The researcher re-establishes every lead fact (name, phone, address, services, hours, owned website status) from independent sources and records each URL in `sources`, as SPEC rule 4 already requires.
4. Replace SPEC's `placesFetchedAt` field comment with: "place IDs may be kept indefinitely; refresh with a free IDs-only Place Details call when older than 12 months; drop on NOT_FOUND. No other Places field is stored."
5. Dedupe against `data/leads.json`, `data/queue.json`, `data/rejected.json` and a stored list of seen place IDs.
6. Never plot Places content on the coverage tile map. Show only counts from Kija's own records there.

## 7. Attribution and app notice

- Terms 3.2.2(b): "Customer will display all attribution that (i) Google provides through the Services ... Customer will not modify, obscure, or delete such attribution."
- Places policies: "You must follow Google Maps attribution requirements when displaying Content from Google Maps Platform APIs in your app or website." and "Attribution should take the form of the Google Maps logo whenever possible. In cases where space is limited, the text Google Maps is acceptable." Place it in the same container as the data. Not needed on a Google Map where it is already visible.
- Terms 3.2.2(a)(i): the app's terms must "notify users that the Customer Application includes Google Maps features and content" and state that use is subject to the Google Maps End User Additional Terms and the Google Privacy Policy. For an internal tool: a short notice with both links in Settings or About.
- **Showing the Google rating:** fetch rating and review count live at render time with Place Details Enterprise by `placeId`, show "Google Maps" beside them, and do not save them. Embedding the numbers in a static exported share file is a gray area. Options for Jamey: refetch at export with attribution, or leave the numbers out of exports and phrase the pitch without them.

## 8. Alternatives compared

| Service | Price (verified) | Fields | No website filter | Terms and risk | Verdict |
|---|---|---|---|---|---|
| Google Places API (New) Text Search | $35.00 per 1,000 after 1,000 free a month | websiteUri, rating, userRatingCount, phone | No server filter; check `websiteUri` in memory | Licensed use, with the storage limits above | **Use** |
| Apify Google Maps Scraper (compass/crawler-google-places) | Per 1,000 places: Free $4.00 ($5 a month credit, up to 1,250 places), Starter $3.00 ($19 a month), Scale $2.00 ($199), Business $1.50 ($999). Filters add $1.00 per 1,000 each on Free and Starter, $0.75 Scale, $0.53 Business: "Final price = places scraped * filter price * number of filters." | website, totalScore, reviewsCount | Yes: `website: "withoutWebsite"` ("Scrape only places without a website"); only checks the Maps website field, so a Facebook-only listing counts as having a website. Star filter is a post filter charged on every scraped place. | Scrapes Google Maps, which the Maps end user terms forbid ("or let anyone else do so"). Apify's FAQ: "you should also factor in Google's Terms of Use". | Do not use |
| Outscraper | **Pricing not verified** (every outscraper.com page returned 403; the only figures come from a competitor page). | name, full_address, phone, site, rating, reviews (official GitHub example) | Maps scraper API: no (quick filters are UI only, staff answer May 25, 2026). Corrected: the separate Businesses database API exposes `has_website`, `rating`, `reviews`, `has_phone`, `business_statuses`, `area_service`, `verified` (official outscraper-python SDK: "has_website: Optional[bool] = None"). | Scraped Google Maps data, same risk as Apify | Do not use |
| SerpApi Google Maps API | Free 250 searches a month; Starter $25 for 1,000; Developer $75 for 5,000; Production $150 for 15,000; Big Data $275 for 30,000. "responses with 100 results or empty result sets will both count as 1 search." Cached, errored and failed searches not counted. | rating, reviews, website; pages by `start` in steps of 20, recommended max 100 | No; `rating` is only a preferred minimum | Legal terms (updated August 27, 2026) exclude Free, Starter and Developer from the U.S. Legal Shield, although the pricing page shows it on all plans. Google sued SerpApi on December 19, 2025 (N.D. Cal., 4:25-cv-10826). Per SerpApi's own posts (a party, docket not opened): dismissed July 20, 2026; amended complaint August 10, 2026 (Maps and Shopping theories dropped); second motion to dismiss August 25, 2026. Status on September 28, 2026 unverified. | Do not use |
| Yelp Places API | 30 day trial with 5,000 calls; Base $229 a month plus $5.91 per extra 1,000; Enhanced $299 plus $6.57; Premium $643 plus $14.13. Business email required. | Yelp rating and count (not Google's). `attributes.BusinessUrl` only on Enhanced and Premium, so website detection needs $299 a month or more. | No | Terms (updated September 22, 2026): 24 hour storage cap (5(a)); no "create your own database of business listing information" (5(b)); no commercial use without written consent (5(d)); no "direct marketing and/or telemarketing activities" (5(p)). | Ruled out |

## 9. Known limits and open items

- A missing `websiteUri` does not prove there is no website. Owners often list a Facebook or booking page, or leave the field blank. The owned-domain probe (`npm run probe`) and an exact-name search stay mandatory.
- Test once before relying on them: the `body_art_service` to tattoo mapping and the `car_repair` bias for auto subcategories.
- Outscraper pricing and the Google v. SerpApi status on 2026-09-28 are unverified.
- Whether Apify filter fees count places the filter removes is unknown.

## Sources

- Text Search (New): https://developers.google.com/maps/documentation/places/web-service/text-search
- places.searchText reference: https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchText
- Places API usage and billing: https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
- SKU details: https://developers.google.com/maps/billing-and-pricing/sku-details
- Core services pricing list: https://developers.google.com/maps/billing-and-pricing/pricing
- March 2025 changes: https://developers.google.com/maps/billing-and-pricing/march-2025
- Place Types (New): https://developers.google.com/maps/documentation/places/web-service/place-types
- Place IDs: https://developers.google.com/maps/documentation/places/web-service/place-id
- Places policies and attributions: https://developers.google.com/maps/documentation/places/web-service/policies
- Maps Platform Terms of Service: https://cloud.google.com/maps-platform/terms
- Service Specific Terms: https://cloud.google.com/maps-platform/terms/maps-service-terms
- Acceptable Use Policy: https://cloud.google.com/maps-platform/terms/aup
- Google Maps Additional Terms: https://www.google.com/help/terms_maps/
- Apify actor and pricing: https://apify.com/compass/crawler-google-places and https://apify.com/compass/crawler-google-places/pricing
- Outscraper community answer: https://community.outscraper.com/t/quick-filters-website-phone-operational-verified-available-in-async-maps-api/854
- Outscraper Businesses API schema: https://raw.githubusercontent.com/outscraper/outscraper-python/master/outscraper/schema/businesses.py
- Outscraper MCP example: https://raw.githubusercontent.com/outscraper/outscraper-mcp-server/main/examples/01-business-discovery.md
- SerpApi pricing, Maps docs, legal: https://serpapi.com/pricing, https://serpapi.com/google-maps-api, https://serpapi.com/legal
- Google blog on SerpApi lawsuit: https://blog.google/innovation-and-ai/technology/safety-security/serpapi-lawsuit/
- SerpApi blog, second motion: https://serpapi.com/blog/google-tried-again-were-moving-to-dismiss-their-claims-a-second-time/
- Yelp Places API: https://business.yelp.com/data/products/places-api/
- Yelp API Terms: https://terms.yelp.com/developers/api_terms/
- Yelp Business Details reference: https://docs.developer.yelp.com/reference/v3_business_info

## Do not use

- **outscraper-price** (refuted): "500 free, then about $3 per 1,000 up to 100,000 and $1 per 1,000 after". Could not be confirmed from any Outscraper page; the only source is a competitor (Scrap.io).
