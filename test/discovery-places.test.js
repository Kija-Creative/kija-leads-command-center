// Places discovery tests with a fake fetch returning canned Text Search pages.
// Core normalize functions are injected with SPEC semantics so these tests do
// not depend on src/lib.

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
  knownMatch,
  parseAddress,
  parseAnchor,
  requestMinRating,
  PLACES_ENDPOINT,
  PLACES_FIELD_MASK,
} from "../src/discovery/places.js";
import { runDiscovery, planDiscovery } from "../src/discovery/discover.js";
import { parseDotenv, resolveSecret } from "../src/discovery/env.js";
import { main as discoverMain } from "../src/cli/discover-places.js";

const DASHES = /[\u2013\u2014]/;

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
  "auto-repair": { label: "Auto repair", vertical: "auto", searchTerms: ["auto repair", "mechanic"] },
  hvac: { label: "HVAC", vertical: "home-services", searchTerms: ["hvac repair"] },
  plumbing: { label: "Plumbing", vertical: "home-services", searchTerms: [] },
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

test("search jobs are anchor city times category term, anchor first, with notes for what was skipped", () => {
  const plan = { runId: "2026-09-28", metros: geography.metros, categories: ["auto-repair", "hvac", "tattoo"] };
  const { jobs, notes } = buildSearchJobs({ plan, categories, geography, termsPerCategory: 1, anchorsPerMetro: 3 });
  // DFW: 3 anchors, NY: 2 anchors, 2 known categories, 1 term each.
  assert.equal(jobs.length, (3 + 2) * 2);
  assert.equal(jobs[0].textQuery, "auto repair in Dallas, TX");
  assert.equal(jobs[1].textQuery, "hvac repair in Dallas, TX");
  assert.equal(jobs[2].textQuery, "auto repair in New York (New York)", "second metro comes before the second DFW anchor; no state guess");
  assert.deepEqual(jobs[2].metroStates, ["NY", "NJ"]);
  assert.ok(jobs.some((j) => j.textQuery === "hvac repair in Newark, NJ"));
  assert.ok(notes.some((n) => /tattoo/.test(n)), "unknown category noted");
  assert.ok(notes.some((n) => /Plano/.test(n)), "anchor cap noted");
  assert.ok(notes.some((n) => /mechanic/.test(n)), "term cap noted");
  assert.ok(notes.some((n) => /"City, ST"/.test(n)), "bare anchors in a multi state metro noted");

  // Plans may list metro keys; categories without searchTerms fall back to the label.
  const byKey = buildSearchJobs({ plan: { metros: ["new-york"], categories: ["plumbing"] }, categories, geography });
  assert.deepEqual(byKey.jobs.map((j) => j.textQuery), ["Plumbing in New York (New York)", "Plumbing in Newark, NJ"]);
});

test("request body asks for the US, service area businesses and a 0.5 step minRating", () => {
  const body = buildSearchBody({ textQuery: "hvac repair in Dallas, TX" }, { minRating: 4.7 });
  assert.deepEqual(body, {
    textQuery: "hvac repair in Dallas, TX",
    pageSize: 20,
    regionCode: "US",
    languageCode: "en",
    includePureServiceAreaBusinesses: true,
    minRating: 4.5,
  });
  assert.equal(buildSearchBody({ textQuery: "x" }, { pageToken: "abc" }).pageToken, "abc");
  assert.equal(requestMinRating(4.5), 4.5);
  assert.equal(requestMinRating(undefined), undefined);
  assert.equal(
    PLACES_FIELD_MASK,
    "places.id,places.displayName,places.formattedAddress,places.businessStatus,places.googleMapsUri,places.primaryType,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,nextPageToken",
  );
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

test("filter keeps operational, websiteless, well reviewed, independent, unknown places", () => {
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
  ].map((p, position) => ({ place: p, job, page: 1, position }));

  const state = {
    leads: [
      { business: "GM AUTO CARE", city: "Dallas", state: "TX", phone: "972-681-4966" },
      { business: "Al's Auto Repair Shop", city: "Dallas", state: "TX", phone: "214-946-4100" },
    ],
    queue: [{ candidate: "The Parlor Barbershop", city: "Dallas", state: "TX", phone: "" }],
    rejected: [{ key: "4698971144", business: "Fenix Auto Body Shop", city: "Dallas", state: "TX", phone: "469-897-1144" }],
  };
  const knownIndex = buildKnownIndex(state, deps);
  assert.equal(knownMatch(knownIndex, { business: "gm auto care", state: "tx", phone: "" }, deps), "name");

  const { kept, dropped, notes } = filterPlaces({ hits, thresholds: settings.thresholds, knownIndex, deps });
  assert.deepEqual(kept.map((k) => k.hit.place.id), ["p1", "p4", "p12"]);
  assert.equal(kept[1].website.kind, "third-party");
  assert.equal(kept[2].city, "Fort Worth");
  assert.deepEqual(dropped, {
    missingIdOrName: 0,
    duplicateInRun: 2,
    notOperational: 2,
    ownedWebsite: 1,
    lowRating: 1,
    fewReviews: 1,
    outsideMetro: 0,
    chain: 1,
    known: 4,
  });
  assert.ok(notes.chain[0].includes("Midas"));
});

test("places outside the metro's states are dropped", () => {
  const job = { metro: "portland", metroStates: ["OR", "WA"], city: "Vancouver", state: "", categoryKey: "auto-repair", textQuery: "auto repair in Vancouver (Portland)" };
  const hits = [
    place("v1", { formattedAddress: "123 Main St, Vancouver, WA 98660, USA" }),
    place("v2", { formattedAddress: "800 Granville St, Vancouver, BC V6Z 1K3, Canada" }),
    place("v3", { formattedAddress: "9 Oak Ave, Boise, ID 83702, USA" }),
    place("v4", { formattedAddress: "" }),
  ].map((p, position) => ({ place: p, job, page: 1, position }));
  const { kept, dropped } = filterPlaces({ hits, thresholds: settings.thresholds, knownIndex: buildKnownIndex({}, deps), deps });
  assert.deepEqual(kept.map((k) => [k.hit.place.id, k.state]), [["v1", "WA"]]);
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

test("runDiscovery paginates up to 3 pages, sends the exact headers and writes candidate evidence", async () => {
  const { fetch, calls } = cannedPlaces();
  const plan = { runId: "2026-09-28", metros: ["dallas-fort-worth"], categories: ["auto-repair"] };
  const file = await runDiscovery({
    plan, settings, categories, geography, state: {}, deps,
    apiKey: "test-key-123", fetch, now: "2026-09-28T13:00:00.000Z",
    options: { anchorsPerMetro: 2, concurrency: 1 },
  });

  // Two searches: Dallas pages 3 times (a 4th token is ignored), Fort Worth once.
  assert.equal(calls.length, 4);
  for (const call of calls) {
    assert.equal(call.url, PLACES_ENDPOINT);
    assert.equal(call.init.method, "POST");
    assert.equal(call.init.headers["X-Goog-Api-Key"], "test-key-123");
    assert.equal(call.init.headers["X-Goog-FieldMask"], PLACES_FIELD_MASK);
    assert.equal(call.init.headers["Content-Type"], "application/json");
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
  assert.equal(file.placesContentDeleteBy, "2026-10-28");
  assert.match(file.terms, /30 days/);

  const c = file.candidates.find((x) => x.placeId === "d1a");
  assert.equal(c.fetchedAt, "2026-09-28T13:00:00.000Z");
  assert.equal(c.placesFetchedAt, "2026-09-28");
  assert.equal(c.ratingSource, "places-api");
  assert.equal(c.phone, "214-555-1001");
  assert.equal(c.metro, "dallas-fort-worth");
  assert.equal(c.category, "Auto repair");
  assert.equal(c.status, "unverified");
  assert.equal(c.evidence.raw.id, "d1a");
  assert.equal(c.evidence.query, "auto repair in Dallas, TX");
  assert.equal(file.candidates[0].googleReviews, 300, "stronger reputations first");
  assert.equal(file.searched.length, 2);
  assert.match(file.searched[0].notes, /3 pages/);
  assert.ok(!JSON.stringify(file).includes("test-key-123"), "the key never lands in the file");
  assert.ok(!DASHES.test(JSON.stringify(file)));
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

test("the request cap trims pages evenly and is reported", async () => {
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
  assert.ok(logs.some((l) => /Request cap of 2 reached/.test(l)));
  const est = planDiscovery({ plan, categories, geography, options: { anchorsPerMetro: 1, maxRequests: 2 } }).estimate;
  assert.deepEqual([est.searches, est.minRequests, est.maxRequests], [2, 2, 2]);
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
    assert.equal(await fs.stat(path.join(root, "data", "inbox", "2026-09-28.candidates.json")).catch(() => null), null);
    assert.equal(await discoverMain([], { env: {}, stdout: out.stream, stderr: out.stream }), 2, "--plan is required");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("discover CLI with a key from .env writes the candidates file and a count summary", async () => {
  const root = await tempRoot();
  try {
    await fs.writeFile(path.join(root, ".env"), "GOOGLE_PLACES_API_KEY=file-key-xyz\n");
    const { fetch, calls } = cannedPlaces();
    const out = capture();
    const code = await discoverMain(["--plan", "data/inbox/2026-09-28.plan.json", "--root", root, "--anchors", "2"], {
      env: {}, stdout: out.stream, stderr: out.stream, fetch, now: new Date("2026-09-28T13:00:00Z"),
      normalize: { normalizeName, dedupeKey, isChain: (name) => isChain(name) },
    });
    assert.equal(code, 0);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].init.headers["X-Goog-Api-Key"], "file-key-xyz");
    assert.match(out.text, /Estimated Places requests: 2 to 6/);
    assert.match(out.text, /Kept: 2/);
    assert.ok(!out.text.includes("file-key-xyz"), "the key is never printed");
    const file = JSON.parse(await fs.readFile(path.join(root, "data", "inbox", "2026-09-28.candidates.json"), "utf8"));
    assert.equal(file.runId, "2026-09-28");
    assert.equal(file.candidates.length, 2);
    assert.ok(file.candidates.every((c) => c.placeId && c.fetchedAt && c.placesFetchedAt && c.evidence.raw));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("discover CLI dry run prints the estimate without a key or any request", async () => {
  const root = await tempRoot();
  try {
    const out = capture();
    const code = await discoverMain(["--plan", "data/inbox/2026-09-28.plan.json", "--root", root, "--dry-run"], {
      env: {}, stdout: out.stream, stderr: out.stream, fetch: () => { throw new Error("must not be called"); },
    });
    assert.equal(code, 0);
    assert.match(out.text, /3 searches/);
    assert.match(out.text, /hvac repair in Arlington, TX/);
    assert.match(out.text, /Dry run: nothing was called/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
