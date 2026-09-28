import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  dashLocations, findDashes, OUTREACH_STATUSES, REQUIRED_LEAD_FIELDS, validateBatch, validateBenchmarks,
  validateCategories, validateChains, validateGeography, validateHistoryEntry, validateLead, validateOutreachPatch,
  validateQueueItem, validateRejection, validateRoiOverrides, validateSettings,
} from "../src/lib/validate.js";
import { seedToData } from "../src/lib/seed.js";

const read = (rel) => JSON.parse(fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));
const settings = read("config/settings.json");
const categories = read("config/categories.json");
const geography = read("config/geography.json");
const chains = read("config/chains.json");
const seed = read("seed/sheet-2026-09-28.json");
const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);
const ctx = { settings, categories, chains, geography, now: "2026-09-28" };

function weeklyLead(overrides = {}) {
  return {
    business: "Ortega Brothers Auto Repair",
    category: "Auto repair",
    categoryKey: "auto-repair",
    city: "Houston",
    state: "TX",
    metro: "houston",
    phone: "713-555-0142",
    googleRating: 4.9,
    googleReviews: 212,
    ratingSource: "google-maps",
    websiteGap: 3,
    ticketValue: 3,
    visualFit: 2,
    websiteStatus: "No owned website surfaced in exact name, phone and Maps checks.",
    confidence: "High",
    whyKija: "A strong review base with no owned place to send searchers.",
    pitchAngle: "Customers already vouch for the shop; give them a place to book.",
    demoConcept: "Trust first repair site with services, reviews and an estimate request.",
    reviewThemes: ["Honest pricing", "Fast turnaround"],
    sources: [{ url: "https://example.org/listing/ortega", label: "example.org", checkedAt: "2026-09-28" }],
    verification: {
      status: "verified",
      checkedAt: "2026-09-28",
      checks: [
        { check: "exact-name search", result: "No owned domain in the first two pages.", url: "" },
        { check: "phone search", result: "Only directory listings.", url: "" },
        { check: "Maps website field", result: "Blank.", url: "" },
      ],
      notes: "",
    },
    ...overrides,
  };
}

test("OUTREACH_STATUSES and REQUIRED_LEAD_FIELDS match the spec", () => {
  assert.deepEqual(OUTREACH_STATUSES, ["New", "Research", "Demo Built", "Contacted", "Replied", "Meeting", "Won", "Lost", "Not a fit"]);
  assert.deepEqual(REQUIRED_LEAD_FIELDS, [
    "business", "category", "categoryKey", "city", "state", "googleRating", "googleReviews", "phone", "websiteStatus",
    "websiteGap", "ticketValue", "visualFit", "confidence", "whyKija", "pitchAngle", "demoConcept", "sources",
  ]);
});

test("a complete weekly lead passes with no warnings", () => {
  const r = validateLead(weeklyLead(), { ...ctx, mode: "weekly" });
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.ok, true);
});

test("every missing required field is its own readable error", () => {
  for (const field of REQUIRED_LEAD_FIELDS) {
    const lead = weeklyLead();
    delete lead[field];
    const r = validateLead(lead, { ...ctx, mode: "weekly" });
    assert.equal(r.ok, false, field);
    assert.ok(r.errors.some((e) => e.includes(`required field ${field}`)), `${field}: ${r.errors.join(" | ")}`);
  }
});

test("out of range and malformed values are errors", () => {
  const cases = [
    [{ googleRating: 5.2 }, /googleRating must be a number from 0 to 5/],
    [{ googleReviews: -3 }, /googleReviews must be a whole number/],
    [{ googleReviews: 12.5 }, /googleReviews must be a whole number/],
    [{ websiteGap: 4 }, /websiteGap must be a whole number from 1 to 3/],
    [{ ticketValue: 0 }, /ticketValue must be a whole number from 1 to 3/],
    [{ visualFit: "3" }, /visualFit must be a whole number from 1 to 3/],
    [{ confidence: "Great" }, /confidence "Great" is not one of/],
    [{ state: "Texas" }, /not a two letter USPS code/],
    [{ phone: "(713) 555-0142" }, /must be written 713-555-0142/],
    [{ phone: "555-0142" }, /is not a valid US number/],
    [{ categoryKey: "car-wash" }, /category key "car-wash" is not in config\/categories\.json/],
    [{ metro: "atlantis" }, /metro "atlantis" is not in config\/geography\.json/],
    [{ ratingSource: "yelp" }, /ratingSource must be empty/],
    [{ sources: [{ url: "not a url", label: "", checkedAt: "2026-09-28" }] }, /needs a full http or https url/],
    [{ established: 1776 }, /established must be null or a sourced four digit year/],
    [{ roiOverrides: { margin: 45 } }, /margin is a fraction from 0 to 1/],
  ];
  for (const [patch, pattern] of cases) {
    const r = validateLead(weeklyLead(patch), { ...ctx, mode: "weekly" });
    assert.equal(r.ok, false, JSON.stringify(patch));
    assert.ok(r.errors.some((e) => pattern.test(e)), `${JSON.stringify(patch)}: ${r.errors.join(" | ")}`);
  }
});

test("a chain or franchise name is an error", () => {
  const r = validateLead(weeklyLead({ business: "Meineke Car Care Center" }), { ...ctx, mode: "weekly" });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /matches the chain or franchise "Meineke"/.test(e)), r.errors.join(" | "));
});

test("an em or en dash in any string is an error naming the path", () => {
  const top = validateLead(weeklyLead({ whyKija: `Great reviews ${EM} no site.` }), { ...ctx, mode: "weekly" });
  assert.ok(top.errors.some((e) => /field whyKija contains an em or en dash/.test(e)), top.errors.join(" | "));
  const nested = validateLead(weeklyLead({ sources: [{ url: "https://example.org/a", label: `Directory ${EN} listing`, checkedAt: "2026-09-28" }] }), { ...ctx, mode: "weekly" });
  assert.ok(nested.errors.some((e) => e.includes("sources[0].label")), nested.errors.join(" | "));
  const hyphen = validateLead(weeklyLead({ whyKija: "A 30-minute drive and 2-3 day turnaround." }), { ...ctx, mode: "weekly" });
  assert.equal(hyphen.ok, true, "plain hyphens are fine");
});

test("findDashes walks objects and arrays and returns paths", () => {
  const value = { a: "fine", b: [`x ${EM} y`, { c: `2${EN}3` }], d: { e: { f: EM } }, g: 12, h: null };
  assert.deepEqual(findDashes(value), ["b[0]", "b[1].c", "d.e.f"]);
  assert.deepEqual(findDashes("plain - hyphen"), []);
  assert.deepEqual(findDashes(`top ${EM}`), ["(value)"]);
  assert.deepEqual(dashLocations(`ok\nbad ${EM} here\n${EN}`), [
    { line: 2, column: 5, char: "em dash (U+2014)" },
    { line: 3, column: 1, char: "en dash (U+2013)" },
  ]);
});

test("threshold floors are errors reported in floors, and warnings in stored mode", () => {
  const low = weeklyLead({ googleRating: 4.3, googleReviews: 12, websiteGap: 1 });
  const r = validateLead(low, { ...ctx, mode: "weekly" });
  assert.equal(r.ok, false);
  assert.deepEqual(r.floors, [
    "Rating 4.3 is below the 4.5 floor.",
    "12 reviews is below the 20 review floor.",
    "Website gap 1 is below the minimum of 2.",
  ]);
  for (const f of r.floors) assert.ok(r.errors.includes(f));
  const stored = validateLead({ ...low, ...storedFields() }, { ...ctx, mode: "stored" });
  assert.equal(stored.ok, true, stored.errors.join(" | "));
  assert.equal(stored.floors.length, 0);
  assert.ok(stored.warnings.some((w) => w.includes("below the 4.5 floor")));
});

function storedFields() {
  return {
    id: "ortega-brothers-auto-repair-houston-tx",
    outreach: { status: "New", nextAction: "", nextDate: "", owner: "", notes: "", history: [{ at: "2026-09-28T12:00:00.000Z", by: "weekly-run", type: "created", text: "" }] },
    demo: { builtAt: "", template: "", palette: "", shareApproved: false },
    addedAt: "2026-09-28",
    origin: "weekly-run",
    runId: "2026-09-28",
  };
}

test("weekly mode needs a source and three verification checks; manual mode warns", () => {
  const noSources = validateLead(weeklyLead({ sources: [] }), { ...ctx, mode: "weekly" });
  assert.ok(noSources.errors.some((e) => /has no sources\. A weekly lead needs at least one source url\./.test(e)));
  const twoChecks = weeklyLead();
  twoChecks.verification.checks.pop();
  const r = validateLead(twoChecks, { ...ctx, mode: "weekly" });
  assert.ok(r.errors.some((e) => /has 2 verification checks\. A weekly lead needs at least 3\./.test(e)), r.errors.join(" | "));
  const manual = validateLead(weeklyLead({ sources: [], verification: { status: "needs-recheck", checkedAt: "", checks: [], notes: "" } }), { ...ctx, mode: "manual" });
  assert.equal(manual.ok, true, manual.errors.join(" | "));
  assert.ok(manual.warnings.some((w) => /has no sources yet/.test(w)));
  const verifiedNoSource = validateLead(weeklyLead({ sources: [] }), { ...ctx, mode: "manual" });
  assert.ok(verifiedNoSource.errors.some((e) => /marked verified but has no sources/.test(e)));
});

test("warnings cover preferred thresholds, soft confidence and secondary ratings", () => {
  const r = validateLead(weeklyLead({ googleRating: 4.6, googleReviews: 25, confidence: "Medium", ratingSource: "secondary" }), { ...ctx, mode: "weekly" });
  assert.equal(r.ok, true, r.errors.join(" | "));
  const text = r.warnings.join(" | ");
  assert.match(text, /rating 4\.6 is below the preferred 4\.7/);
  assert.match(text, /25 reviews, below the preferred 30/);
  assert.match(text, /confidence is Medium/);
  assert.match(text, /secondary mirror/);
  const low = validateLead(weeklyLead({ confidence: "Low" }), { ...ctx, mode: "weekly" });
  assert.ok(low.warnings.some((w) => /confidence is Low/.test(w)));
  for (const w of r.warnings) assert.match(w, /\.$/, "warnings are sentences");
});

test("review themes are paraphrases, never quotes", () => {
  const quoted = validateLead(weeklyLead({ reviewThemes: ["\"Best shop in town\" says Mike", "Fair prices"] }), { ...ctx, mode: "weekly" });
  assert.ok(quoted.errors.some((e) => /looks like a quote/.test(e)));
  const curly = validateLead(weeklyLead({ reviewThemes: [`${String.fromCharCode(0x201c)}Great${String.fromCharCode(0x201d)}`, "Fair prices"] }), { ...ctx, mode: "weekly" });
  assert.equal(curly.ok, false);
  const many = validateLead(weeklyLead({ reviewThemes: ["a", "b", "c", "d", "e", "f"] }), { ...ctx, mode: "weekly" });
  assert.ok(many.errors.some((e) => /keep it to 2 to 5/.test(e)));
});

test("Places derived data older than 30 days is an error", () => {
  const fresh = validateLead(weeklyLead({ ratingSource: "places-api", placesFetchedAt: "2026-09-20" }), { ...ctx, mode: "weekly" });
  assert.equal(fresh.ok, true, fresh.errors.join(" | "));
  const stale = validateLead(weeklyLead({ ratingSource: "places-api", placesFetchedAt: "2026-08-01" }), { ...ctx, mode: "weekly" });
  assert.ok(stale.errors.some((e) => /older than 30 days/.test(e)));
});

test("stored mode requires the system fields", () => {
  const r = validateLead(weeklyLead(), { ...ctx, mode: "stored" });
  for (const f of ["id", "outreach", "demo", "addedAt", "origin"]) {
    assert.ok(r.errors.some((e) => e.includes(`missing ${f}`)), f);
  }
  const bad = validateLead({ ...weeklyLead(), ...storedFields(), outreach: { ...storedFields().outreach, status: "Closed" } }, { ...ctx, mode: "stored" });
  assert.ok(bad.errors.some((e) => /outreach status "Closed" is not one of/.test(e)));
});

test("every seed lead and queue item validates in stored mode", () => {
  const { leads, queue } = seedToData(seed, { now: "2026-09-28T12:00:00.000Z", thresholds: settings.thresholds });
  for (const lead of leads) {
    const r = validateLead(lead, { ...ctx, mode: "stored" });
    assert.equal(r.ok, true, `${lead.business}: ${r.errors.join(" | ")}`);
  }
  for (const item of queue) {
    const r = validateQueueItem(item, { ...ctx, mode: "stored" });
    assert.equal(r.ok, true, `${item.candidate}: ${r.errors.join(" | ")}`);
  }
});

test("validateQueueItem and validateRejection report readable errors", () => {
  const item = { candidate: "Worth Automotive", city: "Fort Worth", state: "TX", phone: "214-757-9811", googleRating: null, googleReviews: null, sources: [], decision: "Maybe" };
  const r = validateQueueItem(item, ctx);
  assert.ok(r.errors.some((e) => /decision must be Research, Promote or Drop/.test(e)));
  assert.ok(r.warnings.some((w) => /no sources yet/.test(w)));
  assert.equal(validateQueueItem({ ...item, decision: "Research" }, ctx).ok, true);
  assert.equal(validateQueueItem({ ...item, decision: "Research", candidate: "Great Clips" }, ctx).ok, false);
  assert.equal(validateQueueItem({ ...item, decision: "Research" }, { ...ctx, mode: "stored" }).ok, false, "stored needs id and dates");

  assert.equal(validateRejection({ business: "Some Shop", reason: "Has an owned site at someshop.com.", state: "TX", phone: "", evidenceUrl: "https://someshop.com" }).ok, true);
  const bad = validateRejection({ business: "Some Shop", reason: `Owned site ${EM} active` });
  assert.ok(bad.errors.some((e) => /dash/.test(e)));
  assert.ok(validateRejection({ business: "X" }).errors.some((e) => /required field reason/.test(e)));
});

test("validateBatch checks structure and dashes in the parts that land in the run report", () => {
  assert.equal(validateBatch({ runId: "2026-09-28", mode: "weekly", leads: [], searched: [{ query: "q", source: "s", notes: "" }] }).ok, true);
  const cases = [
    [{ runId: "Sept 28" }, /runId must be a date/],
    [{ runId: "2026-09-28", mode: "daily" }, /mode must be weekly, reverify or manual/],
    [{ runId: "2026-09-28", leads: {} }, /leads must be a list/],
    [{ runId: "2026-09-28", reverify: [{ id: "x", decision: "reject" }] }, /rejects the lead but gives no reason/],
    [{ runId: "2026-09-28", reverify: [{ decision: "keep" }] }, /needs the id of an existing lead/],
    [{ runId: "2026-09-28", notes: `Slow week ${EM} rain.` }, /field notes contains an em or en dash/],
    [{ runId: "2026-09-28", searched: [{ query: `hvac ${EN} dallas` }] }, /searched\[0\]\.query/],
  ];
  for (const [batch, pattern] of cases) {
    const r = validateBatch(batch);
    assert.equal(r.ok, false, JSON.stringify(batch));
    assert.ok(r.errors.some((e) => pattern.test(e)), r.errors.join(" | "));
  }
  assert.ok(validateBatch({ runId: "2026-09-29", mode: "weekly" }).warnings.some((w) => /not a Monday/.test(w)));
  assert.equal(validateBatch(null).ok, false);
});

test("config files validate", () => {
  for (const [name, r] of [
    ["settings", validateSettings(settings)],
    ["categories", validateCategories(categories)],
    ["geography", validateGeography(geography)],
    ["chains", validateChains(chains)],
  ]) {
    assert.deepEqual(r.errors, [], `${name}: ${r.errors.join(" | ")}`);
  }
  const broken = validateSettings({ ...settings, weeklyQuota: 0, offer: { ...settings.offer, price: -1 } });
  assert.ok(broken.errors.some((e) => /Weekly quota/.test(e)));
  assert.ok(broken.errors.some((e) => /offer price/.test(e)));
});

test("categories.json has every key from the spec table with the right vertical, ticket and visual", () => {
  const table = [
    ["auto-repair", "auto", 3, 2], ["auto-body-collision", "auto", 3, 3], ["tire-shop", "auto", 2, 2],
    ["muffler-exhaust", "auto", 2, 3], ["diesel-truck-repair", "auto", 3, 2], ["mobile-mechanic", "auto", 2, 2],
    ["auto-detailing", "auto", 2, 3], ["towing", "auto", 2, 1], ["hvac", "home-services", 3, 2],
    ["plumbing", "home-services", 3, 2], ["electrical", "home-services", 3, 2], ["septic", "home-services", 3, 2],
    ["garage-door", "home-services", 2, 2], ["restoration", "home-services", 3, 2], ["appliance-repair", "home-services", 2, 1],
    ["pest-control", "home-services", 2, 1], ["roofing", "contractor", 3, 3], ["concrete", "contractor", 3, 3],
    ["fencing", "contractor", 3, 3], ["pools", "contractor", 3, 3], ["landscaping", "contractor", 2, 3],
    ["painting", "contractor", 2, 3], ["foundation-repair", "contractor", 3, 2], ["remodeling", "contractor", 3, 3],
    ["tree-service", "contractor", 2, 3], ["barber", "personal-care", 1, 3], ["hair-salon", "personal-care", 2, 3],
    ["nail-salon", "personal-care", 1, 3], ["tattoo", "personal-care", 2, 3], ["pet-grooming", "personal-care", 1, 3],
    ["general", "general", 2, 2],
  ];
  assert.deepEqual(Object.keys(categories).sort(), table.map((t) => t[0]).sort());
  for (const [key, vertical, ticket, visual] of table) {
    const c = categories[key];
    assert.equal(c.vertical, vertical, key);
    assert.equal(c.ticketValueDefault, ticket, key);
    assert.equal(c.visualFitDefault, visual, key);
    assert.ok(c.serviceDefaults.length >= 4 && c.serviceDefaults.length <= 8, `${key} has 4 to 8 service defaults`);
    assert.ok(Array.isArray(c.searchTerms) && Array.isArray(c.placesTypes));
    if (key !== "general") assert.ok(c.searchTerms.length > 0, `${key} has search terms`);
  }
  for (const theme of seed.searchThemes) {
    assert.ok(categories[theme.categoryKey].focusNote.includes(theme.whyItMayFit), `${theme.categoryKey} carries its sheet theme`);
  }
});

test("geography.json lists 50 metros interleaved by region with dallas-fort-worth as home", () => {
  const metros = geography.metros;
  assert.equal(metros.length, 50);
  assert.ok(metros.some((m) => m.key === "dallas-fort-worth"));
  for (const m of metros) {
    assert.ok(m.anchorCities.length >= 3 && m.anchorCities.length <= 6, `${m.key} has 3 to 6 anchor cities`);
    assert.ok(["Northeast", "Southeast", "Midwest", "Southwest", "West"].includes(m.region), m.key);
  }
  const rotation = metros.filter((m) => m.key !== settings.geography.homeMetro);
  // Any four consecutive metros in the first 30 cover four different regions.
  for (let i = 0; i + 4 <= 30; i += 1) {
    const regions = new Set(rotation.slice(i, i + 4).map((m) => m.region));
    assert.equal(regions.size, 4, `metros ${i} to ${i + 3} span four regions`);
  }
});

test("chains.json has at least 120 names including the ones the spec lists", () => {
  assert.ok(chains.names.length >= 120);
  for (const n of ["Midas", "Meineke", "Jiffy Lube", "Caliber Collision", "Maaco", "CARSTAR", "Christian Brothers Automotive",
    "Roto-Rooter", "Mr. Rooter", "Benjamin Franklin Plumbing", "One Hour Heating and Air Conditioning", "Mister Sparky",
    "Aire Serv", "ARS Rescue Rooter", "Great Clips", "Supercuts", "Sport Clips", "Servpro", "ServiceMaster", "CertaPro Painters"]) {
    assert.ok(chains.names.includes(n), n);
  }
});

test("benchmarks validator treats missing sources as a warning, bad numbers as errors", () => {
  const ok = validateBenchmarks({ categories: { general: { ticket: { typical: 300, sources: [] }, grossMargin: { typical: 0.4, sources: [] } } } });
  assert.equal(ok.ok, true);
  assert.ok(ok.warnings.some((w) => /no sources/.test(w)));
  const bad = validateBenchmarks({ categories: { general: { ticket: { typical: 0 }, grossMargin: { typical: 40 } } } });
  assert.equal(bad.errors.length, 2);
});

test("patch, history and override validators for the server", () => {
  assert.equal(validateOutreachPatch({ status: "Contacted", nextDate: "2026-10-05", owner: "Jamey" }).ok, true);
  assert.ok(validateOutreachPatch({ status: "Closed" }).errors[0].includes("not one of"));
  assert.ok(validateOutreachPatch({ nextDate: "Friday" }).errors[0].includes("Next date"));
  assert.ok(validateOutreachPatch({ history: [] }).errors[0].includes("append only"));
  assert.equal(validateHistoryEntry({ type: "call", text: "Left a voicemail.", by: "Jamey" }).ok, true);
  assert.equal(validateHistoryEntry({ type: "sms", text: "", by: "Jamey" }).ok, false);
  assert.equal(validateRoiOverrides({ ticket: 600, margin: 0.45, price: 3000, jobsPerMonth: 4 }).ok, true);
  assert.equal(validateRoiOverrides({ ticket: -5 }).ok, false);
  assert.equal(validateRoiOverrides({ ticket: null }).ok, true, "null clears an override");
});
