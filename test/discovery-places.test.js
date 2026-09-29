// Places discovery tests with a fake fetch returning canned Text Search pages.
// Core normalize functions are injected with SPEC semantics so these tests do
// not depend on src/lib. Nothing here touches the network or the real data/.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildKnownIndex,
  buildSearchBody,
  buildSearchJobs,
  classifyWebsite,
  filterPlaces,
  includedTypeFor,
  knownMatch,
  mapsUrlFor,
  metroRectangles,
  parseAddress,
  parseAnchor,
  requestMinRating,
  suppressedMatch,
  typeMismatchNote,
  ATMOSPHERE_FIELDS,
  CANDIDATE_FIELDS,
  PLACES_ENDPOINT,
  PLACES_FIELD_MASK,
  PLACES_MAX_RESULTS,
  TABLE_A_BY_CATEGORY,
  TABLE_A_TYPES,
} from "../src/discovery/places.js";
import { runDiscovery, planDiscovery, DISCOVER_DEFAULTS } from "../src/discovery/discover.js";
import { addUsage, budgetFor, budgetSentence, cleanUsage, monthKey, overFreeCapWarning } from "../src/discovery/budget.js";
import { parseDotenv, resolveSecret } from "../src/discovery/env.js";
import { main as discoverMain } from "../src/cli/discover-places.js";

const DASHES = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);

// SPEC semantics: lowercase, strip punctuation, & to and, drop inc llc co ltd the.
function normalizeName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]+/g, "")
    .split(/\s+/)
    .filter((w) => w && !["inc", "llc", "co", "ltd", "the"].includes(w))
    .join(" ");
}
function dedupeKey({ business, state, phone }) {
  const digits = String(phone ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return digits.length === 10 ? digits : `${normalizeName(business)}|${String(state ?? "").toUpperCase()}`;
}
const CHAINS = ["midas", "jiffy lube", "meineke"];
function isChain(name) {
  const n = normalizeName(name);
  const match = CHAINS.find((c) => n === c || n.startsWith(`${c} `));
  return { chain: Boolean(match), match: match ?? "" };
}
const deps = { normalizeName, dedupeKey, isChain };

const settings = { weeklyQuota: 10, thresholds: { minRating: 4.5, preferredRating: 4.7, minReviews: 20, preferredReviews: 30, strongReviews: 75, minWebsiteGap: 2 } };
const categories = {
  "auto-repair": { label: "Auto repair", vertical: "auto", searchTerms: ["auto repair", "mechanic"], placesTypes: ["car_repair"] },
  hvac: { label: "HVAC", vertical: "home-services", searchTerms: ["hvac repair"], placesTypes: ["general_contractor"] },
  plumbing: { label: "Plumbing", vertical: "home-services", searchTerms: [], placesTypes: ["plumber"] },
};
const geography = {
  metros: [
    { key: "dallas-fort-worth", name: "Dallas Fort Worth", states: ["TX"], anchorCities: ["Dallas", "Fort Worth", "Arlington", "Plano"], region: "Southwest" },
    { key: "new-york", name: "New York", states: ["NY", "NJ"], anchorCities: ["New York", "Newark, NJ"], region: "Northeast" },
  ],
};

function place(id, over = {}) {
  return {
    id,
    displayName: { text: `Shop ${id}`, languageCode: "en" },
    formattedAddress: "100 Main St, Dallas, TX 75201, USA",
    businessStatus: "OPERATIONAL",
    googleMapsUri: `https://maps.google.com/?cid=${id}`,
    primaryType: "car_repair",
    types: ["car_repair", "point_of_interest"],
    pureServiceAreaBusiness: false,
    nationalPhoneNumber: `(214) 555-${String(1000 + Number(id.replace(/\D/g, "") || 0)).slice(-4)}`,
    rating: 4.8,
    userRatingCount: 120,
    ...over,
  };
}

test("anchors parse with or without a state", () => {
  assert.deepEqual(parseAnchor("Newark, NJ", geography.metros[1]), { city: "Newark", state: "NJ" });
  assert.deepEqual(parseAnchor("New York", geography.metros[1]), { city: "New York", state: "" }, "no state guess in a multi state metro");
  assert.deepEqual(parseAnchor("Plano", geography.metros[0]), { city: "Plano", state: "TX" });
});

test("search jobs are area times category term, area first, with notes for what was skipped", () => {
  const plan = { runId: "2026-09-28", metros: geography.metros, categories: ["auto-repair", "hvac", "tattoo"] };
  const { jobs, notes } = buildSearchJobs({ plan, categories, geography, termsPerCategory: 1, anchorsPerMetro: 3 });
  // DFW: 3 anchors, NY: 2 anchors, 2 known categories, 1 term each.
  assert.equal(jobs.length, (3 + 2) * 2);
  assert.equal(jobs[0].textQuery, "auto repair in Dallas, TX");
  assert.equal(jobs[0].includedType, "car_repair");
  assert.equal(jobs[0].strictTypeFiltering, false);
  assert.equal(jobs[1].textQuery, "hvac repair in Dallas, TX");
  assert.equal(jobs[1].includedType, undefined, "no Table A type for hvac");
  assert.equal(jobs[2].textQuery, "auto repair in New York (New York)", "second metro comes before the second DFW anchor; no state guess");
  assert.deepEqual(jobs[2].metroStates, ["NY", "NJ"]);
  assert.ok(jobs.some((j) => j.textQuery === "hvac repair in Newark, NJ"));
  assert.ok(notes.some((n) => /tattoo/.test(n)), "unknown category noted");
  assert.ok(notes.some((n) => /Plano/.test(n)), "anchor cap noted");
  assert.ok(notes.some((n) => /mechanic/.test(n)), "term cap noted");
  assert.ok(notes.some((n) => /"City, ST"/.test(n)), "bare anchors in a multi state metro noted");
  assert.ok(notes.some((n) => /No bounds in config\/geography\.json/.test(n)), "missing bounds noted");
  assert.ok(notes.some((n) => /hvac: config general_contractor is not a Table A type, so it is never sent/.test(n)), "Table B config type noted");

  // Plans may list metro keys; categories without searchTerms fall back to the label.
  const byKey = buildSearchJobs({ plan: { metros: ["new-york"], categories: ["plumbing"] }, categories, geography });
  assert.deepEqual(byKey.jobs.map((j) => j.textQuery), ["Plumbing in New York (New York)", "Plumbing in Newark, NJ"]);
  assert.ok(byKey.jobs.every((j) => j.includedType === "plumber"));
});

test("metros with bounds send a categorical textQuery and a locationRestriction rectangle", () => {
  const rect = { low: { latitude: 32.6, longitude: -97.0 }, high: { latitude: 33.0, longitude: -96.6 } };
  const geo = {
    metros: [
      { ...geography.metros[0], bounds: [rect, { low: { latitude: 33, longitude: -96 }, high: { latitude: 32, longitude: -95 } }] },
    ],
  };
  assert.equal(metroRectangles(geo.metros[0]).length, 1, "an inverted rectangle is ignored");
  const { jobs, notes } = buildSearchJobs({ plan: { metros: ["dallas-fort-worth"], categories: ["auto-repair"] }, categories, geography: geo });
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].textQuery, "auto repair", "geography lives in the restriction, not the text");
  assert.equal(jobs[0].state, "TX");
  assert.deepEqual(jobs[0].locationRestriction, { rectangle: rect });
  assert.ok(!notes.some((n) => /No bounds/.test(n)));
  const body = buildSearchBody(jobs[0], { minRating: 4.5 });
  assert.deepEqual(body.locationRestriction, { rectangle: rect });
  assert.equal(body.locationBias, undefined, "never combined with locationBias");
});

test("request body matches the research shape: Table A type, service area businesses, minRating, page size, region", () => {
  const typed = buildSearchBody({ textQuery: "auto repair in Dallas, TX", includedType: "car_repair", strictTypeFiltering: false }, { minRating: 4.7 });
  assert.deepEqual(typed, {
    textQuery: "auto repair in Dallas, TX",
    includedType: "car_repair",
    strictTypeFiltering: false,
    includePureServiceAreaBusinesses: true,
    minRating: 4.5,
    pageSize: 20,
    regionCode: "us",
    languageCode: "en",
  });
  assert.deepEqual(Object.keys(typed), ["textQuery", "includedType", "strictTypeFiltering", "includePureServiceAreaBusinesses", "minRating", "pageSize", "regionCode", "languageCode"]);

  const untyped = buildSearchBody({ textQuery: "hvac repair in Dallas, TX" }, { minRating: 4.5 });
  assert.equal(untyped.includedType, undefined);
  assert.equal(untyped.strictTypeFiltering, undefined, "strictTypeFiltering only rides with a Table A type");
  assert.equal(untyped.includePureServiceAreaBusinesses, true);
  // A Table B or unknown type is never sent, even if a job carries one.
  const tableB = buildSearchBody({ textQuery: "remodeling", includedType: "general_contractor", strictTypeFiltering: true }, {});
  assert.equal(tableB.includedType, undefined);
  assert.equal(tableB.strictTypeFiltering, undefined);
  assert.equal(tableB.includePureServiceAreaBusinesses, true);

  assert.equal(buildSearchBody({ textQuery: "x" }, { pageToken: "abc" }).pageToken, "abc");
  assert.equal(requestMinRating(4.5), 4.5);
  assert.equal(requestMinRating(4.7), 4.5, "rounded down so the server never rounds 4.7 up to 5");
  assert.equal(requestMinRating(undefined), undefined);
  assert.equal(PLACES_MAX_RESULTS, 60);
});

test("field mask is the research mask and never asks for Atmosphere fields", () => {
  assert.equal(
    PLACES_FIELD_MASK,
    "places.id,places.displayName,places.formattedAddress,places.businessStatus,places.googleMapsUri,places.primaryType,places.types,places.pureServiceAreaBusiness,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,nextPageToken",
  );
  assert.ok(!/\s/.test(PLACES_FIELD_MASK), "no spaces");
  assert.ok(!PLACES_FIELD_MASK.includes("*"), "no wildcard");
  for (const f of ATMOSPHERE_FIELDS) assert.ok(!PLACES_FIELD_MASK.split(",").includes(f), f);
});

test("Table A mapping follows research section 5", () => {
  assert.deepEqual(includedTypeFor("auto-repair"), { includedType: "car_repair", strictTypeFiltering: false });
  assert.equal(includedTypeFor("tire-shop").includedType, "tire_shop");
  assert.equal(includedTypeFor("pet-grooming").includedType, "pet_care");
  for (const key of ["hvac", "auto-body-collision", "auto-detailing", "remodeling", "pools", "landscaping", "towing", "mobile-mechanic"]) {
    assert.equal(includedTypeFor(key), null, key);
  }
  for (const entry of Object.values(TABLE_A_BY_CATEGORY)) assert.ok(TABLE_A_TYPES.has(entry.includedType), entry.includedType);
  assert.ok(!TABLE_A_TYPES.has("general_contractor"), "Table B type is not a request type");
  assert.equal(typeMismatchNote(["auto-repair", "plumbing"], categories), "", "matching config is quiet");
  assert.match(typeMismatchNote(["tire-shop"], { "tire-shop": { placesTypes: ["car_repair"] } }), /tire-shop: placesTypes not reviewed, sent tire_shop from the research table/);

  // Reviewed config decides (SPEC), but only a Table A type is ever sent.
  assert.deepEqual(includedTypeFor("auto-body-collision", { placesTypes: ["car_repair"], placesTypesReviewed: true }), { includedType: "car_repair", strictTypeFiltering: false });
  assert.equal(includedTypeFor("auto-repair", { placesTypes: [], placesTypesReviewed: true }), null);
  assert.equal(includedTypeFor("remodeling", { placesTypes: ["general_contractor"], placesTypesReviewed: true }), null);
  assert.equal(includedTypeFor("hair-salon", { placesTypes: ["hair_salon", "beauty_salon"], placesTypesReviewed: true }).includedType, "hair_salon", "exactly one type is sent");
  assert.equal(typeMismatchNote(["pet-grooming"], { "pet-grooming": { placesTypes: ["pet_care"], placesTypesReviewed: true } }), "");
});

test("website classification separates owned sites from third party pages", () => {
  assert.equal(classifyWebsite("").kind, "none");
  assert.equal(classifyWebsite(undefined).kind, "none");
  assert.equal(classifyWebsite("https://www.gmautocare.com/").kind, "owned");
  for (const uri of [
    "https://www.facebook.com/gmautocare", "http://m.facebook.com/x", "https://instagram.com/x",
    "https://www.yelp.com/biz/x", "https://gm-auto.square.site/", "https://gmauto.business.site",
    "https://linktr.ee/gm", "https://sites.google.com/view/gm", "https://www.fresha.com/a/x",
  ]) {
    assert.equal(classifyWebsite(uri).kind, "third-party", uri);
  }
  assert.equal(classifyWebsite("https://sites.google.com/view/gm").platform, "Google Sites");
});

test("addresses parse city and state, service area listings fall back", () => {
  assert.deepEqual(parseAddress("100 Main St, Dallas, TX 75201, USA"), { city: "Dallas", state: "TX", zip: "75201" });
  assert.deepEqual(parseAddress("Grand Prairie, TX, USA"), { city: "Grand Prairie", state: "TX", zip: "" });
  assert.deepEqual(parseAddress(""), { city: "", state: "", zip: "" });
});

test("filter keeps operational, websiteless, well reviewed, independent, unknown, unsuppressed places", () => {
  const job = { metro: "dallas-fort-worth", city: "Dallas", state: "TX", categoryKey: "auto-repair", textQuery: "auto repair in Dallas, TX" };
  const hits = [
    place("p1"),
    place("p1"), // same place from a second search
    place("p2", { businessStatus: "CLOSED_PERMANENTLY" }),
    place("p3", { websiteUri: "https://www.shop3.com/" }),
    place("p4", { websiteUri: "https://www.facebook.com/shop4" }),
    place("p5", { rating: 4.4 }),
    place("p6", { userRatingCount: 19 }),
    place("p7", { displayName: { text: "Midas" } }),
    place("p8", { nationalPhoneNumber: "(972) 681-4966" }), // phone already a lead
    place("p9", { displayName: { text: "Al's Auto Repair Shop, LLC" }, nationalPhoneNumber: "(214) 000-0000" }), // name plus state already a lead
    place("p10", { businessStatus: "CLOSED_TEMPORARILY" }),
    place("p11", { nationalPhoneNumber: "(214) 555-1001" }), // same phone as p1, second listing
    place("p12", { formattedAddress: "Fort Worth, TX, USA", rating: 4.5, userRatingCount: 20 }), // exactly at the floors
    place("p13", { displayName: { text: "Parlor Barbershop" }, nationalPhoneNumber: "" }), // queue item by name
    place("p14", { nationalPhoneNumber: "469-897-1144" }), // rejected
    place("p15", { nationalPhoneNumber: "(214) 555-7777" }), // suppressed by phone
    place("p16", { nationalPhoneNumber: "" }), // place ID already stored on a lead
    place("p17", { formattedAddress: undefined, pureServiceAreaBusiness: true, nationalPhoneNumber: "(214) 555-1717" }), // service area, no address
  ].map((p, position) => ({ place: p, job, page: 1, position }));

  const state = {
    leads: [
      { business: "GM AUTO CARE", city: "Dallas", state: "TX", phone: "972-681-4966" },
      { business: "Al's Auto Repair Shop", city: "Dallas", state: "TX", phone: "214-946-4100" },
      { business: "Stored Id Garage", city: "Dallas", state: "TX", phone: "214-222-3333", placeId: "p16" },
    ],
    queue: [{ candidate: "The Parlor Barbershop", city: "Dallas", state: "TX", phone: "" }],
    rejected: [{ key: "4698971144", business: "Fenix Auto Body Shop", city: "Dallas", state: "TX", phone: "469-897-1144" }],
    suppression: [{ key: "2145557777", business: "Asked To Stop Auto", city: "Dallas", state: "TX", phone: "214-555-7777", reason: "Asked not to be contacted.", addedAt: "2026-09-20", by: "Jamey" }],
  };
  const knownIndex = buildKnownIndex(state, deps);
  assert.equal(knownMatch(knownIndex, { business: "gm auto care", state: "tx", phone: "" }, deps), "name");
  assert.equal(knownMatch(knownIndex, { business: "Other", state: "TX", phone: "", placeId: "p16" }, deps), "place ID");
  assert.equal(suppressedMatch(knownIndex, { business: "Asked To Stop Auto", state: "TX", phone: "" }, deps), "name");
  assert.equal(knownMatch(knownIndex, { business: "Asked To Stop Auto", state: "TX", phone: "" }, deps), "", "suppression has its own index");

  const { kept, dropped, notes } = filterPlaces({ hits, thresholds: settings.thresholds, knownIndex, deps });
  assert.deepEqual(kept.map((k) => k.hit.place.id), ["p1", "p4", "p12", "p17"]);
  assert.equal(kept[1].website.kind, "third-party");
  assert.equal(kept[2].city, "Fort Worth");
  assert.equal(kept[3].serviceArea, true);
  assert.equal(kept[3].state, "TX", "service area listing takes the search state");
  assert.deepEqual(dropped, {
    missingIdOrName: 0,
    duplicateInRun: 2,
    notOperational: 2,
    ownedWebsite: 1,
    lowRating: 1,
    fewReviews: 1,
    outsideMetro: 0,
    suppressed: 1,
    chain: 1,
    known: 5,
  });
  assert.ok(notes.chain[0].includes("Midas"));
  assert.ok(notes.suppressed[0].includes("same phone"));
});

test("places outside the metro's states are dropped; service area listings with no state stay", () => {
  const job = { metro: "portland", metroStates: ["OR", "WA"], city: "", state: "", categoryKey: "auto-repair", textQuery: "auto repair" };
  const hits = [
    place("v1", { formattedAddress: "123 Main St, Vancouver, WA 98660, USA" }),
    place("v2", { formattedAddress: "800 Granville St, Vancouver, BC V6Z 1K3, Canada" }),
    place("v3", { formattedAddress: "9 Oak Ave, Boise, ID 83702, USA" }),
    place("v4", { formattedAddress: "" }),
    place("v5", { formattedAddress: undefined, pureServiceAreaBusiness: true }),
  ].map((p, position) => ({ place: p, job, page: 1, position }));
  const { kept, dropped } = filterPlaces({ hits, thresholds: settings.thresholds, knownIndex: buildKnownIndex({}, deps), deps });
  assert.deepEqual(kept.map((k) => [k.hit.place.id, k.state]), [["v1", "WA"], ["v5", ""]]);
  assert.equal(dropped.outsideMetro, 3);
});

// Canned Text Search: "auto repair in Dallas, TX" pages forever (tokens t1..t9),
// every other query returns one page.
function cannedPlaces({ failWith } = {}) {
  const calls = [];
  const fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, init, body });
    if (failWith) return new Response(JSON.stringify({ error: { code: failWith, message: "API key not valid. Please pass a valid API key.", status: "INVALID_ARGUMENT" } }), { status: failWith });
    if (body.textQuery === "auto repair in Dallas, TX") {
      const page = body.pageToken ? Number(body.pageToken.slice(1)) + 1 : 1;
      return Response.json({
        places: [place(`d${page}a`), place(`d${page}b`, { websiteUri: "https://owned.example.com" })],
        nextPageToken: `t${page}`,
      });
    }
    return Response.json({
      places: [place(`x${calls.length}`, {
        formattedAddress: "5 Elm St, Fort Worth, TX 76102, USA",
        nationalPhoneNumber: `(817) 555-${1000 + calls.length}`,
        rating: 5,
        userRatingCount: 300,
      })],
    });
  };
  return { fetch, calls };
}

test("runDiscovery paginates up to 3 pages, sends the exact headers and keeps only pointers", async () => {
  const { fetch, calls } = cannedPlaces();
  let counted = 0;
  const plan = { runId: "2026-09-28", metros: ["dallas-fort-worth"], categories: ["auto-repair"] };
  const file = await runDiscovery({
    plan, settings, categories, geography, state: {}, deps,
    apiKey: "test-key-123", fetch, now: "2026-09-28T13:00:00.000Z",
    options: { anchorsPerMetro: 2, concurrency: 1 },
    onRequest: () => { counted++; },
  });

  // Two searches: Dallas pages 3 times (a 4th token is ignored), Fort Worth once.
  assert.equal(calls.length, 4);
  assert.equal(counted, 4, "every request is reported for the monthly count");
  for (const call of calls) {
    assert.equal(call.url, PLACES_ENDPOINT);
    assert.equal(call.init.method, "POST");
    assert.equal(call.init.headers["X-Goog-Api-Key"], "test-key-123");
    assert.equal(call.init.headers["X-Goog-FieldMask"], PLACES_FIELD_MASK);
    assert.equal(call.init.headers["Content-Type"], "application/json");
    assert.equal(call.body.includePureServiceAreaBusinesses, true, "every request includes service area businesses");
    assert.equal(call.body.minRating, 4.5);
    assert.equal(call.body.includedType, "car_repair");
  }
  const dallas = calls.filter((c) => c.body.textQuery === "auto repair in Dallas, TX");
  assert.deepEqual(dallas.map((c) => c.body.pageToken), [undefined, "t1", "t2"]);
  // Every parameter except pageToken matches the first call.
  const strip = ({ pageToken, ...rest }) => rest;
  assert.deepEqual(strip(dallas[2].body), strip(dallas[0].body));

  assert.equal(file.counts.requests, 4);
  assert.equal(file.counts.placesReturned, 7);
  assert.equal(file.counts.dropped.ownedWebsite, 3);
  assert.equal(file.candidates.length, 4);
  assert.equal(Object.keys(file)[0], "notice", "the transient notice leads the file");
  assert.match(file.notice, /Delete this file when the run ends: npm run purge-places/);
  assert.match(file.notice, /Only placeId may be copied/);
  assert.equal(file.deleteAfterRun, true);
  assert.equal(file.placesContentDeleteBy, undefined, "the retired 30 day field is gone");

  for (const c of file.candidates) {
    assert.deepEqual(Object.keys(c), [...CANDIDATE_FIELDS], "candidates carry only the pointer fields");
  }
  const c = file.candidates.find((x) => x.placeId === "d1a");
  assert.equal(c.placeIdCheckedAt, "2026-09-28");
  assert.equal(c.business, "Shop d1a");
  assert.equal(c.metro, "dallas-fort-worth");
  assert.equal(c.category, "Auto repair");
  assert.equal(c.status, "unverified");
  assert.equal(c.websiteFlag, "none");
  assert.equal(c.mapsUrl, mapsUrlFor("d1a", "Shop d1a"));
  assert.match(c.mapsUrl, /query_place_id=d1a$/);
  assert.equal(file.candidates[0].placeId, "x2", "stronger reputations first, decided in memory");

  // No Places value other than the place ID and the pointer name lands in the file.
  const text = JSON.stringify(file);
  for (const leak of ["555-1001", "555-1002", "(214) 555", "(817) 555", "maps.google.com/?cid", "100 Main St", "5 Elm St", "75201", "point_of_interest", "owned.example.com", "\"raw\"", "placesFetchedAt"]) {
    assert.ok(!text.includes(leak), `file does not contain ${leak}`);
  }
  const candidateText = JSON.stringify(file.candidates);
  for (const key of ["googleMapsUri", "userRatingCount", "rating", "googleRating", "googleReviews", "phone", "address", "websiteUri", "primaryType", "types", "evidence", "ratingSource"]) {
    assert.ok(!candidateText.includes(`"${key}":`), `candidates do not carry ${key}`);
  }
  assert.equal(file.searched.length, 2);
  assert.match(file.searched[0].notes, /3 pages/);
  assert.ok(!text.includes("test-key-123"), "the key never lands in the file");
  assert.ok(!DASHES.test(text));
});

test("runDiscovery stops on a fatal API error without burning requests", async () => {
  const { fetch, calls } = cannedPlaces({ failWith: 403 });
  const plan = { runId: "2026-09-28", metros: ["dallas-fort-worth", "new-york"], categories: ["auto-repair", "hvac"] };
  const file = await runDiscovery({
    plan, settings, categories, geography, state: {}, deps, apiKey: "k", fetch, now: "2026-09-28T13:00:00Z",
    options: { concurrency: 1 },
  });
  assert.equal(calls.length, 1);
  assert.match(file.fatal, /Places returned 403/);
  assert.equal(file.candidates.length, 0);
});

test("the request cap and the monthly guard trim pages evenly and are reported", async () => {
  const { fetch, calls } = cannedPlaces();
  const logs = [];
  const plan = { runId: "2026-09-28", metros: ["dallas-fort-worth"], categories: ["auto-repair", "hvac"] };
  const file = await runDiscovery({
    plan, settings, categories, geography, state: {}, deps, apiKey: "k", fetch, now: "2026-09-28T13:00:00Z",
    options: { anchorsPerMetro: 1, maxRequests: 2, concurrency: 1 },
    log: (l) => logs.push(l),
  });
  assert.equal(calls.length, 2, "page 1 of both searches, no page 2");
  assert.equal(file.counts.cappedSearches, 1);
  assert.ok(logs.some((l) => /Request cap of 2 reached \(per run cap\)/.test(l)));
  const est = planDiscovery({ plan, categories, geography, options: { anchorsPerMetro: 1, maxRequests: 2 } }).estimate;
  assert.deepEqual([est.searches, est.minRequests, est.maxRequests], [2, 2, 2]);
  assert.match(est.sku, /Text Search Enterprise, SKU E967-44BC-B44D/);

  const guarded = cannedPlaces();
  const guardLogs = [];
  const capped = await runDiscovery({
    plan, settings, categories, geography, state: {}, deps, apiKey: "k", fetch: guarded.fetch, now: "2026-09-28T13:00:00Z",
    options: { anchorsPerMetro: 1, concurrency: 1 }, budget: { remaining: 1 },
    log: (l) => guardLogs.push(l),
  });
  assert.equal(guarded.calls.length, 1, "the monthly guard wins over the per run cap");
  assert.equal(capped.counts.requests, 1);
  assert.ok(guardLogs.some((l) => /monthly guard/.test(l)));
});

test("budget helpers count by calendar month and report free calls left", () => {
  assert.equal(monthKey("2026-09-28T13:00:00Z"), "2026-09");
  assert.deepEqual(cleanUsage({ "2026-09": 12, junk: 3, "2026-08": -1, "2026-07": "4" }), { "2026-09": 12, "2026-07": 4 });
  assert.deepEqual(budgetFor({ usage: { "2026-09": 850, "2026-08": 999 }, now: "2026-09-28T00:00:00Z" }), {
    month: "2026-09", used: 850, maxMonthly: 900, remaining: 50, freeRemaining: 150,
  });
  assert.equal(budgetFor({ usage: { "2026-09": 950 }, now: "2026-09-02T00:00:00Z" }).remaining, 0);
  assert.equal(budgetFor({ usage: null, now: "2026-10-01T00:00:00Z" }).used, 0, "a new month starts at zero");
  assert.deepEqual(addUsage({ "2026-09": 5 }, "2026-10", 3), { "2026-09": 5, "2026-10": 3 });
  assert.match(budgetSentence(budgetFor({ usage: { "2026-09": 100 }, now: "2026-09-28T00:00:00Z" })), /800 requests left under the monthly guard, 900 free calls left of Google's 1,000 a month/);
  assert.equal(overFreeCapWarning(900), "");
  assert.match(overFreeCapWarning(1200), /200 requests could bill/);
  assert.equal(DISCOVER_DEFAULTS.maxRequests, 180);
});

test(".env parsing and secret resolution prefer the environment", () => {
  assert.deepEqual(parseDotenv("# c\nGOOGLE_PLACES_API_KEY=\"abc\"\nexport OTHER=x # note\nBAD LINE\n"), { GOOGLE_PLACES_API_KEY: "abc", OTHER: "x" });
  assert.deepEqual(resolveSecret("K", { K: "env" }, "K=file"), { value: "env", from: "environment" });
  assert.deepEqual(resolveSecret("K", { K: " " }, "K=file"), { value: "file", from: ".env" });
  assert.deepEqual(resolveSecret("K", {}, null), { value: "", from: "" });
});

async function tempRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "kija-discover-"));
  await fs.mkdir(path.join(root, "config"), { recursive: true });
  await fs.mkdir(path.join(root, "data", "inbox"), { recursive: true });
  const write = (rel, value) => fs.writeFile(path.join(root, rel), JSON.stringify(value, null, 2));
  await write("config/settings.json", settings);
  await write("config/categories.json", categories);
  await write("config/geography.json", geography);
  await write("config/chains.json", { names: CHAINS });
  await write("data/leads.json", []);
  await write("data/queue.json", []);
  await write("data/rejected.json", []);
  await write("data/inbox/2026-09-28.plan.json", { runId: "2026-09-28", week: "2026-W40", metros: [geography.metros[0]], categories: ["hvac"], quota: 10, homeMetro: "dallas-fort-worth", exclusions: [] });
  return root;
}

function capture() {
  let text = "";
  return { stream: { write: (s) => { text += s; } }, get text() { return text; } };
}

const readJsonFile = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const exists = async (file) => Boolean(await fs.stat(file).catch(() => null));

test("discover CLI without a key exits 0, calls nothing and points to web research", async () => {
  const root = await tempRoot();
  try {
    const out = capture();
    const code = await discoverMain(["--plan", "data/inbox/2026-09-28.plan.json", "--root", root], {
      env: {}, stdout: out.stream, stderr: out.stream,
      fetch: () => { throw new Error("must not be called"); },
    });
    assert.equal(code, 0);
    assert.match(out.text, /GOOGLE_PLACES_API_KEY is not set/);
    assert.match(out.text, /falls back to web research/);
    assert.equal(await exists(path.join(root, "data", "inbox", "2026-09-28.candidates.json")), false);
    assert.equal(await exists(path.join(root, "data", "places-usage.json")), false);
    assert.equal(await discoverMain([], { env: {}, stdout: out.stream, stderr: out.stream }), 2, "--plan is required");
    assert.equal(await discoverMain(["--plan", "x", "--out", "elsewhere.json"], { env: {}, stdout: out.stream, stderr: out.stream }), 2, "no --out: the file stays where purge finds it");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("discover CLI with a key writes the candidates file, counts usage and prints free calls left", async () => {
  const root = await tempRoot();
  try {
    await fs.writeFile(path.join(root, ".env"), "GOOGLE_PLACES_API_KEY=file-key-xyz\n");
    await fs.writeFile(path.join(root, "data", "places-usage.json"), JSON.stringify({ "2026-08": 640, "2026-09": 100 }));
    await fs.writeFile(path.join(root, "data", "suppression.json"), JSON.stringify([
      { key: "8175551002", business: "Stop Shop", city: "Fort Worth", state: "TX", phone: "817-555-1002", reason: "Asked to stop.", addedAt: "2026-09-01", by: "Jamey" },
    ]));
    const { fetch, calls } = cannedPlaces();
    const out = capture();
    const code = await discoverMain(["--plan", "data/inbox/2026-09-28.plan.json", "--root", root, "--anchors", "3"], {
      env: {}, stdout: out.stream, stderr: out.stream, fetch, now: new Date("2026-09-28T13:00:00Z"),
      normalize: { normalizeName, dedupeKey, isChain: (name) => isChain(name) },
    });
    assert.equal(code, 0, out.text);
    assert.equal(calls.length, 3);
    assert.equal(calls[0].init.headers["X-Goog-Api-Key"], "file-key-xyz");
    assert.match(out.text, /Estimated Places requests: 3 to 9/);
    assert.match(out.text, /Places budget for 2026-09: 100 of 900 requests used, 800 requests left under the monthly guard, 900 free calls left/);
    assert.match(out.text, /Places budget for 2026-09: 103 of 900 requests used, 797 requests left under the monthly guard, 897 free calls left/);
    assert.match(out.text, /Kept: 2/, "the suppressed business is not kept");
    assert.match(out.text, /1 on the suppression list/);
    assert.match(out.text, /npm run purge-places/);
    assert.ok(!out.text.includes("file-key-xyz"), "the key is never printed");
    assert.deepEqual(await readJsonFile(path.join(root, "data", "places-usage.json")), { "2026-08": 640, "2026-09": 103 });
    const file = await readJsonFile(path.join(root, "data", "inbox", "2026-09-28.candidates.json"));
    assert.equal(file.runId, "2026-09-28");
    assert.equal(file.candidates.length, 2);
    assert.ok(file.candidates.every((c) => c.placeId && c.placeIdCheckedAt === "2026-09-28" && Object.keys(c).length === CANDIDATE_FIELDS.length));
    // Nothing else in data/ was written.
    assert.deepEqual((await fs.readdir(path.join(root, "data"))).sort(), ["inbox", "leads.json", "places-usage.json", "queue.json", "rejected.json", "suppression.json"]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("discover CLI refuses to pass the monthly guard and caps the run at what is left", async () => {
  const root = await tempRoot();
  try {
    const usagePath = path.join(root, "data", "places-usage.json");
    await fs.writeFile(usagePath, JSON.stringify({ "2026-09": 900 }));
    const refused = cannedPlaces();
    const out = capture();
    const run = (extra = []) => discoverMain(["--plan", "data/inbox/2026-09-28.plan.json", "--root", root, "--anchors", "3", ...extra], {
      env: { GOOGLE_PLACES_API_KEY: "k" }, stdout: out.stream, stderr: out.stream, now: new Date("2026-09-28T13:00:00Z"),
      normalize: { normalizeName, dedupeKey, isChain: (name) => isChain(name) },
      fetch: refused.fetch,
    });
    assert.equal(await run(), 1);
    assert.equal(refused.calls.length, 0, "nothing is called once the guard is used up");
    assert.match(out.text, /monthly guard of 900 Places requests is used up for 2026-09/);
    assert.match(out.text, /100 free calls left/);
    assert.equal(await exists(path.join(root, "data", "inbox", "2026-09-28.candidates.json")), false);

    // One request left under the guard: the run makes exactly one.
    await fs.writeFile(usagePath, JSON.stringify({ "2026-09": 899 }));
    assert.equal(await run(), 0);
    assert.equal(refused.calls.length, 1);
    assert.deepEqual(await readJsonFile(usagePath), { "2026-09": 900 });

    // A higher guard is allowed but warned about above the free cap.
    const warn = capture();
    await discoverMain(["--plan", "data/inbox/2026-09-28.plan.json", "--root", root, "--dry-run", "--max-monthly", "1500"], {
      env: {}, stdout: warn.stream, stderr: warn.stream, now: new Date("2026-09-28T13:00:00Z"),
    });
    assert.match(warn.text, /Warning: --max-monthly 1500 is above Google's free 1,000 a month/);
    assert.equal(await discoverMain(["--plan", "x", "--max-monthly", "0"], { env: {}, stdout: warn.stream, stderr: warn.stream }), 2);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("discover CLI dry run prints the estimate and budget without a key or any request", async () => {
  const root = await tempRoot();
  try {
    const out = capture();
    const code = await discoverMain(["--plan", "data/inbox/2026-09-28.plan.json", "--root", root, "--dry-run"], {
      env: {}, stdout: out.stream, stderr: out.stream, now: new Date("2026-09-28T13:00:00Z"),
      fetch: () => { throw new Error("must not be called"); },
    });
    assert.equal(code, 0);
    assert.match(out.text, /2 searches/, "two anchor cities by default");
    assert.match(out.text, /hvac repair in Fort Worth, TX/);
    assert.match(out.text, /Places budget for 2026-09: 0 of 900 requests used/);
    assert.match(out.text, /Dry run: nothing was called/);
    assert.equal(await exists(path.join(root, "data", "places-usage.json")), false, "a dry run writes nothing");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
