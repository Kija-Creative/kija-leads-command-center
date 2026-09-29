// Google Places API (New) Text Search helpers. Pure except searchTextPage,
// which takes an injected fetch. Reconciled with research/places-api.md.
//
// Terms (research/places-api.md section 6): the only Places value Kija may
// keep is the place ID. Maps Platform Terms 3.2.3(a) and (b) forbid copying
// and caching names, addresses, phones, ratings, review counts and the rest,
// and 3.2.3(c) forbids building content from them. So every Places response
// lives in memory for one run: it is filtered here, and only the minimum a
// researcher needs to find the business again (place ID, name, city, state,
// category, a website flag) goes into the transient candidates file, which is
// deleted when the run ends (npm run purge-places). Every lead fact is then
// re-established from an independent source recorded in `sources`.
//
// Request shape (research/places-api.md section 2): POST
// https://places.googleapis.com/v1/places:searchText with headers
// Content-Type, X-Goog-Api-Key and X-Goog-FieldMask. Body: textQuery,
// includedType plus strictTypeFiltering only for a Table A type,
// includePureServiceAreaBusinesses: true always, minRating in 0.5 steps,
// pageSize 20, regionCode, languageCode, and a locationRestriction rectangle
// when the metro has bounds. A page returns { places, nextPageToken }; at most
// 60 results across 3 pages, and every parameter except pageToken and
// pageSize must match the first call when paginating.

import { classifyWebsite } from "./hosts.js";
import { isoDate, phoneDigits } from "./text.js";

export { classifyWebsite };

export const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

// The research field mask, in its order. websiteUri, rating, userRatingCount
// and nationalPhoneNumber are Enterprise fields, so every request bills once
// at Text Search Enterprise; the Pro fields (types, pureServiceAreaBusiness)
// add nothing on top.
export const PLACES_FIELDS = Object.freeze([
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.businessStatus",
  "places.googleMapsUri",
  "places.primaryType",
  "places.types",
  "places.pureServiceAreaBusiness",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
]);

// nextPageToken is an Essentials (IDs Only) field and must be in the mask to paginate.
export const PLACES_FIELD_MASK = [...PLACES_FIELDS, "nextPageToken"].join(",");

// Any one of these raises the request to Enterprise + Atmosphere ($40 per
// 1,000) and pulls review content Kija must never use. Never request them.
export const ATMOSPHERE_FIELDS = Object.freeze([
  "places.reviews",
  "places.reviewSummary",
  "places.editorialSummary",
]);

export const PLACES_SKU = Object.freeze({
  name: "Text Search Enterprise",
  sku: "E967-44BC-B44D",
  freePerMonth: 1000,
  pricePerThousand: 35,
});

export const PLACES_MAX_PAGES = 3;
export const PLACES_PAGE_SIZE = 20;
export const PLACES_MAX_RESULTS = PLACES_MAX_PAGES * PLACES_PAGE_SIZE;

// research/places-api.md section 5. Only Table A types may be sent as
// includedType; categories with no Table A type send textQuery alone.
// config/categories.json placesTypes decides once placesTypesReviewed is true
// (SPEC); this map is the fallback for unreviewed config. strictTypeFiltering
// stays false, as in the research request shape: Places types independents
// loosely (a salon typed beauty_salon), and our own filter decides.
export const TABLE_A_BY_CATEGORY = Object.freeze({
  "auto-repair": { includedType: "car_repair", strictTypeFiltering: false },
  "tire-shop": { includedType: "tire_shop", strictTypeFiltering: false },
  barber: { includedType: "barber_shop", strictTypeFiltering: false },
  "hair-salon": { includedType: "hair_salon", strictTypeFiltering: false },
  "nail-salon": { includedType: "nail_salon", strictTypeFiltering: false },
  // Inferred from the type name; confirm with one test query before relying on it.
  tattoo: { includedType: "body_art_service", strictTypeFiltering: false },
  // Broad type, research says non strict.
  "pet-grooming": { includedType: "pet_care", strictTypeFiltering: false },
  // Very broad: the textQuery does the work.
  general: { includedType: "service", strictTypeFiltering: false },
  plumbing: { includedType: "plumber", strictTypeFiltering: false },
  electrical: { includedType: "electrician", strictTypeFiltering: false },
  roofing: { includedType: "roofing_contractor", strictTypeFiltering: false },
  painting: { includedType: "painter", strictTypeFiltering: false },
});

// Table A groups the research checked (Automotive and Services). A type
// outside this list is never sent.
export const TABLE_A_TYPES = Object.freeze(new Set([
  "car_dealer", "car_rental", "car_repair", "car_wash", "ebike_charging_station",
  "electric_vehicle_charging_station", "gas_station", "parking", "parking_garage", "parking_lot",
  "rest_stop", "tire_shop", "truck_dealer",
  "aircraft_rental_service", "association_or_organization", "astrologer", "barber_shop",
  "beautician", "beauty_salon", "body_art_service", "catering_service", "cemetery",
  "chauffeur_service", "child_care_agency", "consultant", "courier_service", "electrician",
  "employment_agency", "florist", "food_delivery", "foot_care", "funeral_home", "hair_care",
  "hair_salon", "insurance_agency", "laundry", "lawyer", "locksmith", "makeup_artist",
  "marketing_consultant", "moving_company", "nail_salon", "non_profit_organization", "painter",
  "pet_boarding_service", "pet_care", "plumber", "psychic", "real_estate_agency",
  "roofing_contractor", "service", "shipping_service", "storage", "summer_camp_organizer",
  "tailor", "telecommunications_service_provider", "tour_agency", "tourist_information_center",
  "travel_agency", "veterinary_care",
]));

function configuredTypes(category) {
  return Array.isArray(category?.placesTypes) ? category.placesTypes.filter(Boolean).map(String) : [];
}

// { includedType, strictTypeFiltering } for a category, or null to send
// textQuery only. Reviewed config wins; the first Table A type in it is sent
// (Places takes exactly one). A Table B or unknown type is never sent.
export function includedTypeFor(categoryKey, category) {
  const research = TABLE_A_BY_CATEGORY[categoryKey];
  let type = "";
  if (category?.placesTypesReviewed === true) {
    type = configuredTypes(category).find((t) => TABLE_A_TYPES.has(t)) ?? "";
  } else {
    type = research?.includedType ?? "";
  }
  if (!type || !TABLE_A_TYPES.has(type)) return null;
  return { includedType: type, strictTypeFiltering: research?.includedType === type ? research.strictTypeFiltering : false };
}

// One note on planned categories whose config types were not sent as is, so
// config can be corrected deliberately.
export function typeMismatchNote(keys, categories) {
  const diffs = [];
  for (const key of keys) {
    const category = categories?.[key];
    const configured = configuredTypes(category);
    const invalid = configured.filter((t) => !TABLE_A_TYPES.has(t));
    const sent = includedTypeFor(key, category)?.includedType ?? "";
    if (invalid.length) {
      diffs.push(`${key}: config ${invalid.join(" and ")} is not a Table A type, so it is never sent (sent ${sent || "no includedType"})`);
    } else if (category?.placesTypesReviewed !== true && (configured[0] ?? "") !== sent) {
      diffs.push(`${key}: placesTypes not reviewed, sent ${sent || "no includedType"} from the research table`);
    }
  }
  if (!diffs.length) return "";
  return `includedType notes (research/places-api.md section 5): ${diffs.join("; ")}.`;
}

// "Dallas, TX", or a bare city in a single state metro. A bare city in a
// multi state metro (Newark in the New York metro) gets no state: guessing
// the first state would search "Newark, NY", a different town.
export function parseAnchor(anchor, metro) {
  const text = String(anchor ?? "").trim();
  const m = text.match(/^(.*?),\s*([A-Za-z]{2})$/);
  if (m) return { city: m[1].trim(), state: m[2].toUpperCase() };
  const states = metro?.states ?? [];
  return { city: text, state: states.length === 1 ? String(states[0]).toUpperCase() : "" };
}

export function textQueryFor(term, city, state, metro) {
  if (state) return `${term} in ${city}, ${state}`;
  return `${term} in ${city} (${metro?.name ?? metro?.key ?? ""})`;
}

function coordinate(point) {
  const latitude = Number(point?.latitude);
  const longitude = Number(point?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

// A { low, high } rectangle with low south west of high, or null.
export function normalizeRectangle(rect) {
  const source = rect?.rectangle ?? rect;
  const low = coordinate(source?.low);
  const high = coordinate(source?.high);
  if (!low || !high || low.latitude >= high.latitude || low.longitude >= high.longitude) return null;
  return { low, high };
}

// Optional metro.bounds in config/geography.json: one rectangle or a list.
// These are Kija's own coordinates, never Places coordinates.
export function metroRectangles(metro) {
  const raw = metro?.bounds;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list.map(normalizeRectangle).filter(Boolean);
}

function resolveMetros(plan, geography) {
  const byKey = new Map((geography?.metros ?? []).map((m) => [m.key, m]));
  // A plan metro object wins over config, but still picks up config bounds.
  return (plan?.metros ?? [])
    .map((m) => {
      if (typeof m === "string") return byKey.get(m);
      const known = byKey.get(m?.key);
      return known ? { ...known, ...m } : m;
    })
    .filter(Boolean);
}

function resolveCategoryKeys(plan) {
  return (plan?.categories ?? []).map((c) => (typeof c === "string" ? c : c?.key)).filter(Boolean);
}

// Search areas for one metro: bounds rectangles when config has them (the
// research shape: categorical textQuery plus locationRestriction), otherwise
// anchor cities named in the textQuery.
function metroAreas(metro) {
  const states = (metro.states ?? []).map((s) => String(s).toUpperCase());
  const rectangles = metroRectangles(metro);
  if (rectangles.length) {
    return {
      bounded: true,
      areas: rectangles.map((rectangle, i) => ({
        label: `${metro.name ?? metro.key} area ${i + 1}`,
        city: "",
        state: states.length === 1 ? states[0] : "",
        rectangle,
      })),
    };
  }
  return {
    bounded: false,
    areas: (metro.anchorCities ?? []).map((anchor) => ({ label: anchor, ...parseAnchor(anchor, metro), rectangle: null })),
  };
}

// One search job per metro area (rectangle or anchor city) times category
// search term. Jobs are ordered area first so a request cap trims depth, not
// whole metros.
export function buildSearchJobs({ plan, categories, geography, termsPerCategory = 1, anchorsPerMetro = 2 }) {
  const metros = resolveMetros(plan, geography);
  const keys = resolveCategoryKeys(plan);
  const notes = [];
  const missingMetros = (plan?.metros ?? []).length - metros.length;
  if (missingMetros > 0) notes.push(`${missingMetros} plan metros were not found in config/geography.json and were skipped.`);

  const catTerms = [];
  for (const key of keys) {
    const cat = categories?.[key];
    if (!cat) {
      notes.push(`Category "${key}" is not in config/categories.json and was skipped.`);
      continue;
    }
    const terms = (cat.searchTerms?.length ? cat.searchTerms : [cat.label ?? key]).filter(Boolean);
    if (terms.length > termsPerCategory) {
      notes.push(`Category "${key}": used ${termsPerCategory} of ${terms.length} search terms (${terms.slice(termsPerCategory).join(", ")} not searched).`);
    }
    catTerms.push({ key, label: cat.label ?? key, terms: terms.slice(0, termsPerCategory), type: includedTypeFor(key, cat) });
  }
  const typeNote = typeMismatchNote(catTerms.map((c) => c.key), categories);
  if (typeNote) notes.push(typeNote);

  const plans = metros.map((metro) => ({ metro, ...metroAreas(metro) }));
  const unbounded = [];
  for (const { metro, bounded, areas } of plans) {
    if (!bounded) {
      unbounded.push(metro.key);
      const bare = areas.slice(0, anchorsPerMetro).filter((a) => !a.state).map((a) => a.label);
      if (bare.length) {
        notes.push(`Metro "${metro.key}" spans ${(metro.states ?? []).join(", ")}, so ${bare.join("; ")} were searched by metro name. Writing anchors as "City, ST" in config/geography.json makes these searches exact.`);
      }
    }
    if (areas.length > anchorsPerMetro) {
      notes.push(`Metro "${metro.key}": searched ${anchorsPerMetro} of ${areas.length} ${bounded ? "areas" : "anchor cities"} (${areas.slice(anchorsPerMetro).map((a) => a.label).join("; ")} not searched).`);
    }
  }
  if (unbounded.length) {
    notes.push(`No bounds in config/geography.json for ${unbounded.join(", ")}, so the city is named in textQuery. research/places-api.md prefers a categorical textQuery with a locationRestriction rectangle; add bounds to a metro to switch.`);
  }

  const jobs = [];
  const maxAreas = Math.max(0, ...plans.map((p) => p.areas.length));
  for (let a = 0; a < Math.min(maxAreas, anchorsPerMetro); a++) {
    for (const { metro, areas } of plans) {
      const area = areas[a];
      if (!area) continue;
      for (const cat of catTerms) {
        for (const term of cat.terms) {
          const job = {
            metro: metro.key,
            metroStates: (metro.states ?? []).map((s) => String(s).toUpperCase()),
            area: area.label,
            city: area.city,
            state: area.state,
            categoryKey: cat.key,
            categoryLabel: cat.label,
            term,
            textQuery: area.rectangle ? term : textQueryFor(term, area.city, area.state, metro),
          };
          if (cat.type) Object.assign(job, cat.type);
          if (area.rectangle) job.locationRestriction = { rectangle: area.rectangle };
          jobs.push(job);
        }
      }
    }
  }
  return { jobs, notes };
}

export function estimateRequests(jobCount, { maxPages = PLACES_MAX_PAGES, maxRequests = Infinity } = {}) {
  const pages = Math.min(Math.max(1, maxPages), PLACES_MAX_PAGES);
  return {
    searches: jobCount,
    minRequests: Math.min(jobCount, maxRequests),
    maxRequests: Math.min(jobCount * pages, maxRequests),
    cap: Number.isFinite(maxRequests) ? maxRequests : null,
    sku: `${PLACES_SKU.name}, SKU ${PLACES_SKU.sku}, one billable request per page (websiteUri, rating, userRatingCount and nationalPhoneNumber are Enterprise fields)`,
  };
}

// Places accepts minRating in 0.5 steps and rounds up; round down first so
// the server never drops a place our own floor would keep (4.7 would become 5.0).
export function requestMinRating(minRating) {
  const value = Number(minRating);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.min(5, Math.floor(value * 2) / 2);
}

// Key order follows the research request shape. Pages 2 and 3 send the same
// body plus pageToken.
export function buildSearchBody(job, { minRating, pageToken } = {}) {
  const body = { textQuery: job.textQuery };
  if (job.includedType && TABLE_A_TYPES.has(job.includedType)) {
    body.includedType = job.includedType;
    body.strictTypeFiltering = job.strictTypeFiltering === true;
  }
  // Without it Places returns only storefronts, dropping mobile mechanics and
  // many contractors, the trades most likely to have no website.
  body.includePureServiceAreaBusinesses = true;
  const rating = requestMinRating(minRating);
  if (rating !== undefined) body.minRating = rating;
  body.pageSize = PLACES_PAGE_SIZE;
  body.regionCode = "us";
  body.languageCode = "en";
  const rectangle = normalizeRectangle(job.locationRestriction);
  if (rectangle) body.locationRestriction = { rectangle };
  if (pageToken) body.pageToken = pageToken;
  return body;
}

// One Text Search request. Never throws: returns { places, nextPageToken } or
// { error, status, fatal }. The key is scrubbed from any error text.
export async function searchTextPage({ fetch: fetchImpl, apiKey, body, timeoutMs = 15000 }) {
  const scrub = (text) => String(text ?? "").split(apiKey).join("[key]").slice(0, 300);
  let res;
  try {
    res = await fetchImpl(PLACES_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": PLACES_FIELD_MASK,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    return { error: `Request failed: ${scrub(err?.cause?.code || err?.name || err?.message)}.`, status: null, fatal: false };
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message = scrub(data?.error?.message || res.statusText || "no message");
    // Bad key, API not enabled, billing off or quota exhausted: stop, do not burn requests.
    const fatal = [400, 401, 403, 429].includes(res.status);
    return { error: `Places returned ${res.status}: ${message}`, status: res.status, fatal };
  }
  return {
    places: Array.isArray(data?.places) ? data.places : [],
    nextPageToken: typeof data?.nextPageToken === "string" ? data.nextPageToken : "",
  };
}

// "123 Main St, Dallas, TX 75201, USA" -> { city: "Dallas", state: "TX", zip: "75201" }.
export function parseAddress(formattedAddress) {
  const parts = String(formattedAddress ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const m = parts[i].match(/^([A-Z]{2})(?:\s+(\d{5})(?:-\d{4})?)?$/);
    if (m && i > 0 && !/^\d/.test(parts[i - 1])) {
      return { city: parts[i - 1], state: m[1], zip: m[2] ?? "" };
    }
  }
  return { city: "", state: "", zip: "" };
}

function stateOf(value) {
  return String(value ?? "").trim().toUpperCase();
}

function emptyIndex() {
  return { phones: new Set(), names: new Set(), keys: new Set(), placeIds: new Set() };
}

function addRecord(index, { business, city, state, phone, key, placeId }, deps) {
  const digits = phoneDigits(phone);
  if (digits) index.phones.add(digits);
  const name = business ? deps.normalizeName(business) : "";
  if (name) index.names.add(`${name}|${stateOf(state)}`);
  if (business) index.keys.add(deps.dedupeKey({ business, city, state, phone }));
  if (key) index.keys.add(String(key));
  if (placeId) index.placeIds.add(String(placeId));
}

function matchIn(index, { business, city, state, phone, placeId }, deps) {
  if (placeId && index.placeIds.has(String(placeId))) return "place ID";
  const digits = phoneDigits(phone);
  if (digits && index.phones.has(digits)) return "phone";
  const name = business ? deps.normalizeName(business) : "";
  if (name && index.names.has(`${name}|${stateOf(state)}`)) return "name";
  if (business && index.keys.has(deps.dedupeKey({ business, city, state, phone }))) return "key";
  return "";
}

// Known businesses from leads, queue and rejected, plus the suppression list
// (data/suppression.json) in its own index: a suppressed business is never
// discovered again. Stored place IDs match too. `deps` supplies the core
// normalize functions: normalizeName(name) and dedupeKey(record).
export function buildKnownIndex({ leads = [], queue = [], rejected = [], suppression = [] }, deps) {
  const index = emptyIndex();
  index.suppressed = emptyIndex();
  for (const l of leads ?? []) addRecord(index, { business: l.business, city: l.city, state: l.state, phone: l.phone, placeId: l.placeId }, deps);
  for (const q of queue ?? []) {
    addRecord(index, { business: q.candidate ?? q.business, city: q.city, state: q.state, phone: q.phone, placeId: q.placeId ?? q.lead?.placeId }, deps);
  }
  for (const r of rejected ?? []) addRecord(index, { business: r.business, city: r.city, state: r.state, phone: r.phone, key: r.key, placeId: r.placeId }, deps);
  for (const s of suppression ?? []) {
    addRecord(index.suppressed, { business: s.business, city: s.city, state: s.state, phone: s.phone, key: s.key, placeId: s.placeId }, deps);
  }
  return index;
}

// Which rule makes this record a known business: "place ID", "phone", "name",
// "key" or "". SPEC: duplicates when phone digits match, or normalized name
// plus state match.
export function knownMatch(index, record, deps) {
  return matchIn(index, record, deps);
}

export function suppressedMatch(index, record, deps) {
  return index?.suppressed ? matchIn(index.suppressed, record, deps) : "";
}

function placeName(place) {
  return String(place?.displayName?.text ?? "").trim();
}

// Keep OPERATIONAL places with no website (or a third party one, flagged),
// rating and reviews at or above the floors, inside the metro, not suppressed,
// not a chain, not already known. Everything here happens in memory.
// hits: [{ place, job, page, position }]. deps: { normalizeName, dedupeKey, isChain(name) }.
export function filterPlaces({ hits, thresholds = {}, knownIndex, deps }) {
  const minRating = Number(thresholds.minRating ?? 0);
  const minReviews = Number(thresholds.minReviews ?? 0);
  const dropped = {
    missingIdOrName: 0,
    duplicateInRun: 0,
    notOperational: 0,
    ownedWebsite: 0,
    lowRating: 0,
    fewReviews: 0,
    outsideMetro: 0,
    suppressed: 0,
    chain: 0,
    known: 0,
  };
  const notes = { chain: [], known: [], suppressed: [] };
  const seenIds = new Set();
  const seenPhones = new Set();
  const seenNames = new Set();
  const kept = [];

  for (const hit of hits) {
    const place = hit.place ?? {};
    const name = placeName(place);
    const id = String(place.id ?? "");
    if (!id || !name) {
      dropped.missingIdOrName++;
      continue;
    }
    if (seenIds.has(id)) {
      dropped.duplicateInRun++;
      continue;
    }
    seenIds.add(id);

    if (place.businessStatus !== "OPERATIONAL") {
      dropped.notOperational++;
      continue;
    }
    const website = classifyWebsite(place.websiteUri);
    if (website.kind === "owned") {
      dropped.ownedWebsite++;
      continue;
    }
    const rating = Number(place.rating ?? 0);
    const reviews = Number(place.userRatingCount ?? 0);
    if (!(rating >= minRating)) {
      dropped.lowRating++;
      continue;
    }
    if (!(reviews >= minReviews)) {
      dropped.fewReviews++;
      continue;
    }
    // Pure service area businesses come back without formattedAddress.
    const serviceArea = place.pureServiceAreaBusiness === true;
    const address = parseAddress(place.formattedAddress);
    const state = address.state || hit.job.state || "";
    const city = address.city || hit.job.city || "";
    // Text Search can wander (another state, or Canada for "Vancouver").
    const metroStates = hit.job.metroStates ?? [];
    const inMetro = state ? !metroStates.length || metroStates.includes(state) : serviceArea;
    if (!inMetro) {
      dropped.outsideMetro++;
      continue;
    }
    const record = { business: name, city, state, phone: place.nationalPhoneNumber ?? "", placeId: id };
    const suppressed = suppressedMatch(knownIndex, record, deps);
    if (suppressed) {
      dropped.suppressed++;
      notes.suppressed.push(`${name} (same ${suppressed})`);
      continue;
    }
    const chain = deps.isChain(name);
    if (chain?.chain) {
      dropped.chain++;
      notes.chain.push(`${name} (matches ${chain.match})`);
      continue;
    }
    const match = knownMatch(knownIndex, record, deps);
    if (match) {
      dropped.known++;
      const where = [city, state].filter(Boolean).join(" ");
      notes.known.push(where ? `${name}, ${where} (same ${match})` : `${name} (same ${match})`);
      continue;
    }
    // The same business can surface under two listings or two searches.
    const digits = phoneDigits(record.phone);
    const nameKey = `${deps.normalizeName(name)}|${stateOf(state)}`;
    if ((digits && seenPhones.has(digits)) || seenNames.has(nameKey)) {
      dropped.duplicateInRun++;
      continue;
    }
    if (digits) seenPhones.add(digits);
    seenNames.add(nameKey);
    kept.push({ hit, website, city, state, serviceArea });
  }
  return { kept, dropped, notes };
}

// SPEC scoring points for rating and reviews only, used in memory to order
// candidates. The value itself is never written.
export function reputationPoints(rating, reviews) {
  return (Number(rating) / 5) * 30 + Math.min(Number(reviews) / 300, 1) * 25;
}

// A public Maps URL built from the storable place ID (Maps URLs search
// action), so the researcher can open the listing without a stored Places URI.
export function mapsUrlFor(placeId, business) {
  const query = encodeURIComponent(String(business ?? "").trim() || "business");
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${encodeURIComponent(String(placeId ?? ""))}`;
}

// The only keys a candidate may carry. Rating, review count, phone, address,
// website address, Maps URI, types and the raw response never leave memory.
export const CANDIDATE_FIELDS = Object.freeze([
  "placeId", "placeIdCheckedAt", "business", "category", "categoryKey", "city", "state", "metro",
  "serviceArea", "websiteFlag", "mapsUrl", "query", "status", "nextStep",
]);

export const CANDIDATE_NEXT_STEP = "Pointer only. Re-establish every fact (name, phone, rating, review count, website status) from independent public pages recorded in sources, then run the verification checks in WEEKLY_RUN.md. Only placeId may be copied into the batch.";

// Shape one kept place into a transient candidate: placeId plus the minimum a
// researcher needs to find the business again.
export function toCandidate({ hit, website, city, state, serviceArea }, { fetchedAt, categories }) {
  const place = hit.place;
  const business = placeName(place);
  const categoryKey = hit.job.categoryKey;
  return {
    placeId: String(place.id),
    placeIdCheckedAt: isoDate(fetchedAt),
    business,
    category: categories?.[categoryKey]?.label ?? hit.job.categoryLabel ?? categoryKey,
    categoryKey,
    city,
    state,
    metro: hit.job.metro,
    serviceArea: Boolean(serviceArea),
    websiteFlag: website.kind === "third-party" ? "third-party" : "none",
    mapsUrl: mapsUrlFor(place.id, business),
    query: hit.job.textQuery,
    status: "unverified",
    nextStep: CANDIDATE_NEXT_STEP,
  };
}

export const PLACES_PURGE_COMMAND = "npm run purge-places";

export const PLACES_FILE_NOTICE = `Transient working data from the Google Places API. Delete this file when the run ends: ${PLACES_PURGE_COMMAND}. Only placeId may be copied out of it. Names, cities and website flags are pointers for research, not lead facts: every stored fact comes from an independent source recorded in sources (Maps Platform Terms 3.2.3, research/places-api.md section 6).`;
