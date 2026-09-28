// Google Places API (New) Text Search helpers. Pure except searchTextPage,
// which takes an injected fetch.
//
// Terms note: Google Maps Platform terms limit caching of Places content.
// Place IDs may be stored indefinitely. Other Places content (names, ratings,
// review counts, phones, addresses, website fields) must be refreshed or
// deleted within 30 days of fetching, so every candidate carries
// placesFetchedAt and the candidates file carries placesContentDeleteBy.
//
// Request shape (checked against developers.google.com, Text Search (New)):
// POST https://places.googleapis.com/v1/places:searchText with headers
// Content-Type: application/json, X-Goog-Api-Key and X-Goog-FieldMask, and a
// JSON body { textQuery, pageSize (1 to 20), pageToken, regionCode,
// languageCode, minRating (0.5 steps), includePureServiceAreaBusinesses }.
// A page returns { places: [], nextPageToken }. Text Search returns at most 60
// results across 3 pages, and every parameter except pageToken and pageSize
// must match the first call when paginating.

import { classifyWebsite } from "./hosts.js";
import { addDays, formatPhone, isoDate, phoneDigits } from "./text.js";

export { classifyWebsite };

export const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

// Only the fields the lead record needs. websiteUri, rating, userRatingCount
// and nationalPhoneNumber bill at the Text Search Enterprise SKU.
export const PLACES_FIELDS = Object.freeze([
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.businessStatus",
  "places.googleMapsUri",
  "places.primaryType",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
]);

// Google's pagination example lists nextPageToken in the field mask, so it is
// here too; it bills at the IDs Only tier.
export const PLACES_FIELD_MASK = [...PLACES_FIELDS, "nextPageToken"].join(",");

export const PLACES_MAX_PAGES = 3;
export const PLACES_PAGE_SIZE = 20;

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

function resolveMetros(plan, geography) {
  const byKey = new Map((geography?.metros ?? []).map((m) => [m.key, m]));
  return (plan?.metros ?? [])
    .map((m) => (typeof m === "string" ? byKey.get(m) : m))
    .filter(Boolean);
}

function resolveCategoryKeys(plan) {
  return (plan?.categories ?? []).map((c) => (typeof c === "string" ? c : c?.key)).filter(Boolean);
}

// One search job per metro anchor city times category search term.
// Jobs are ordered anchor first so a request cap trims depth, not whole metros.
export function buildSearchJobs({ plan, categories, geography, termsPerCategory = 1, anchorsPerMetro = 3 }) {
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
    catTerms.push({ key, label: cat.label ?? key, terms: terms.slice(0, termsPerCategory) });
  }

  const jobs = [];
  const maxAnchors = Math.max(0, ...metros.map((m) => (m.anchorCities ?? []).length));
  for (const metro of metros) {
    const anchors = metro.anchorCities ?? [];
    const bare = anchors.slice(0, anchorsPerMetro).filter((a) => !parseAnchor(a, metro).state);
    if (bare.length) {
      notes.push(`Metro "${metro.key}" spans ${metro.states.join(", ")}, so ${bare.join("; ")} were searched by metro name. Writing anchors as "City, ST" in config/geography.json makes these searches exact.`);
    }
    if (anchors.length > anchorsPerMetro) {
      notes.push(`Metro "${metro.key}": searched ${anchorsPerMetro} of ${anchors.length} anchor cities (${anchors.slice(anchorsPerMetro).join("; ")} not searched).`);
    }
  }
  for (let a = 0; a < Math.min(maxAnchors, anchorsPerMetro); a++) {
    for (const metro of metros) {
      const anchor = (metro.anchorCities ?? [])[a];
      if (!anchor) continue;
      const { city, state } = parseAnchor(anchor, metro);
      for (const cat of catTerms) {
        for (const term of cat.terms) {
          jobs.push({
            metro: metro.key,
            metroStates: (metro.states ?? []).map((s) => String(s).toUpperCase()),
            city,
            state,
            categoryKey: cat.key,
            categoryLabel: cat.label,
            term,
            textQuery: textQueryFor(term, city, state, metro),
          });
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
    sku: "Text Search Enterprise (websiteUri, rating, userRatingCount and nationalPhoneNumber are requested)",
  };
}

// Places only accepts minRating in 0.5 steps; round down so our own filter
// stays the one that decides.
export function requestMinRating(minRating) {
  const value = Number(minRating);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.min(5, Math.floor(value * 2) / 2);
}

export function buildSearchBody(job, { minRating, pageToken } = {}) {
  const body = {
    textQuery: job.textQuery,
    pageSize: PLACES_PAGE_SIZE,
    regionCode: "US",
    languageCode: "en",
    // Mobile mechanics, plumbers and roofers often list no storefront.
    includePureServiceAreaBusinesses: true,
  };
  const rating = requestMinRating(minRating);
  if (rating !== undefined) body.minRating = rating;
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

// Known businesses from leads, queue and rejected. `deps` supplies the core
// normalize functions: normalizeName(name) and dedupeKey(record).
export function buildKnownIndex({ leads = [], queue = [], rejected = [] }, deps) {
  const index = { phones: new Set(), names: new Set(), keys: new Set() };
  const add = ({ business, city, state, phone, key }) => {
    const digits = phoneDigits(phone);
    if (digits) index.phones.add(digits);
    const name = business ? deps.normalizeName(business) : "";
    if (name) index.names.add(`${name}|${stateOf(state)}`);
    if (business) index.keys.add(deps.dedupeKey({ business, city, state, phone }));
    if (key) index.keys.add(String(key));
  };
  for (const l of leads) add({ business: l.business, city: l.city, state: l.state, phone: l.phone });
  for (const q of queue) add({ business: q.candidate ?? q.business, city: q.city, state: q.state, phone: q.phone });
  for (const r of rejected) add({ business: r.business, city: r.city, state: r.state, phone: r.phone, key: r.key });
  return index;
}

// Which rule makes this record a known business: "phone", "name", "key" or "".
// SPEC: duplicates when phone digits match, or normalized name plus state match.
export function knownMatch(index, { business, city, state, phone }, deps) {
  const digits = phoneDigits(phone);
  if (digits && index.phones.has(digits)) return "phone";
  const name = business ? deps.normalizeName(business) : "";
  if (name && index.names.has(`${name}|${stateOf(state)}`)) return "name";
  if (business && index.keys.has(deps.dedupeKey({ business, city, state, phone }))) return "key";
  return "";
}

function placeName(place) {
  return String(place?.displayName?.text ?? "").trim();
}

// Keep OPERATIONAL places with no website (or a third party one, flagged),
// rating and reviews at or above the floors, not a chain, not already known.
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
    chain: 0,
    known: 0,
  };
  const notes = { chain: [], known: [] };
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
    const address = parseAddress(place.formattedAddress);
    const state = address.state || hit.job.state;
    const city = address.city || hit.job.city;
    // Text Search can wander (another state, or Canada for "Vancouver").
    const metroStates = hit.job.metroStates ?? [];
    if (!state || (metroStates.length && !metroStates.includes(state))) {
      dropped.outsideMetro++;
      continue;
    }
    const chain = deps.isChain(name);
    if (chain?.chain) {
      dropped.chain++;
      notes.chain.push(`${name} (matches ${chain.match})`);
      continue;
    }
    const record = { business: name, city, state, phone: place.nationalPhoneNumber ?? "" };
    const match = knownMatch(knownIndex, record, deps);
    if (match) {
      dropped.known++;
      notes.known.push(`${name}, ${city} ${state} (same ${match})`);
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
    kept.push({ hit, website, city, state });
  }
  return { kept, dropped, notes };
}

// SPEC scoring points for rating and reviews only, used to order candidates.
export function reputationPoints(rating, reviews) {
  return (Number(rating) / 5) * 30 + Math.min(Number(reviews) / 300, 1) * 25;
}

// Shape one kept place into a candidate for the weekly researcher.
export function toCandidate({ hit, website, city, state }, { runId, fetchedAt, categories, deps }) {
  const place = hit.place;
  const phone = formatPhone(place.nationalPhoneNumber);
  const business = placeName(place);
  const categoryKey = hit.job.categoryKey;
  return {
    placeId: place.id,
    fetchedAt,
    placesFetchedAt: isoDate(fetchedAt),
    runId,
    business,
    category: categories?.[categoryKey]?.label ?? hit.job.categoryLabel ?? categoryKey,
    categoryKey,
    city,
    state,
    metro: hit.job.metro,
    address: String(place.formattedAddress ?? ""),
    phone,
    googleRating: place.rating ?? null,
    googleReviews: place.userRatingCount ?? null,
    ratingSource: "places-api",
    googleMapsUrl: String(place.googleMapsUri ?? ""),
    primaryType: String(place.primaryType ?? ""),
    websiteUri: String(place.websiteUri ?? ""),
    websiteFlag: website.kind === "third-party" ? "third-party" : "none",
    websitePlatform: website.platform,
    dedupeKey: deps.dedupeKey({ business, city, state, phone }),
    reputationPoints: Math.round(reputationPoints(place.rating ?? 0, place.userRatingCount ?? 0) * 10) / 10,
    status: "unverified",
    nextStep: "Run the five verification checks in WEEKLY_RUN.md before this becomes a lead. Places data is a starting point, not proof of no website.",
    evidence: {
      source: "google-places-text-search",
      query: hit.job.textQuery,
      page: hit.page,
      position: hit.position,
      fetchedAt,
      raw: place,
    },
  };
}

export function placesDeleteBy(fetchedAt) {
  return addDays(isoDate(fetchedAt), 30);
}
