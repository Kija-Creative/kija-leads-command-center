import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ingestBatch } from "../src/lib/ingest.js";
import { scoreLead } from "../src/lib/score.js";
import { createStore } from "../src/lib/store.js";
import {
  DEFAULT_TRACK, categoriesOfTrack, defaultTracks, partnerFor, runKey, settingsForTrack, splitRunKey, trackOfCategory, trackOfLead, trackOfVertical,
} from "../src/lib/tracks.js";
import { validateLead, validateSettings, validateTracks } from "../src/lib/validate.js";
import { planWeek } from "../src/lib/week.js";

const read = (rel) => JSON.parse(fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));
const settings = read("config/settings.json");
const categories = read("config/categories.json");
const geography = read("config/geography.json");
const chains = read("config/chains.json");
const tracks = read("config/tracks.json");
const NOW = "2026-10-26T14:00:00.000Z";
const RUN = "2026-10-26";

function state(overrides = {}) {
  return { settings, categories, geography, chains, tracks, benchmarks: {}, leads: [], queue: [], rejected: [], ...overrides };
}

function restaurant(n, overrides = {}) {
  return {
    business: `Test Table ${n} Kitchen`,
    category: "Restaurant",
    categoryKey: "restaurant",
    city: "Houston",
    state: "TX",
    metro: "houston",
    phone: `713-555-${String(2000 + n).slice(-4)}`,
    googleRating: 4.8,
    googleReviews: 60 + n * 10,
    ratingSource: "google-maps-observed",
    websiteGap: 3,
    orderingGap: 3,
    visualFit: 3,
    websiteStatus: "No owned website surfaced.",
    confidence: "High",
    whyKija: "Strong reviews, no site and no ordering of its own.",
    pitchAngle: "Give the reviews a home and a way to order.",
    demoConcept: "Menu first concept.",
    reviewThemes: ["Fresh tortillas"],
    sources: [`https://example.org/restaurant/${n}`],
    verification: {
      status: "verified",
      checkedAt: RUN,
      checks: [
        { check: "exact-name search", result: "No owned domain.", url: "" },
        { check: "phone search", result: "Directories only.", url: "" },
        { check: "Maps website field", result: "Blank.", url: "" },
      ],
      notes: "",
    },
    ...overrides,
  };
}

function autoLead(n) {
  const { ticketValue, ...rest } = restaurant(n, { business: `Test Shop ${n} Auto Repair`, category: "Auto repair", categoryKey: "auto-repair", phone: `713-555-${String(3000 + n).slice(-4)}` });
  return { ...rest, ticketValue: 3 };
}

test("tracks.json is valid and every category belongs to exactly one track", () => {
  const r = validateTracks(tracks, categories);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(Object.keys(tracks), ["websites", "restaurants"]);
  assert.deepEqual(tracks, defaultTracks(), "the shipped file and the built in default say the same");
  for (const key of Object.keys(categories)) {
    const t = trackOfCategory(tracks, categories, key);
    assert.equal(t, categories[key].vertical === "restaurants" ? "restaurants" : "websites", key);
  }
  assert.deepEqual(categoriesOfTrack(tracks, categories, "restaurants").sort(), ["bakery", "bbq-smokehouse", "cafe", "mexican-restaurant", "pizzeria", "restaurant"]);
  assert.equal(trackOfVertical(tracks, "auto"), DEFAULT_TRACK);
  assert.equal(trackOfVertical(tracks, "nothing-known"), DEFAULT_TRACK);
});

test("the tracks validator names a vertical in two tracks, a missing default and an unlisted vertical", () => {
  const bad = validateTracks({ websites: { ...tracks.websites, verticals: [...tracks.websites.verticals, "restaurants"] }, restaurants: tracks.restaurants }, categories);
  assert.ok(bad.errors.some((e) => /restaurants is in both/.test(e)));
  assert.ok(validateTracks({ restaurants: tracks.restaurants }, categories).errors.some((e) => /must include the websites track/.test(e)));
  assert.ok(validateTracks({ websites: { ...tracks.websites, verticals: ["auto"] } }, categories).errors.some((e) => /not in any track/.test(e)));
});

test("a lead's track is its stored track or its category's", () => {
  const ctx = { tracks, categories };
  assert.equal(trackOfLead({ categoryKey: "pizzeria" }, ctx), "restaurants");
  assert.equal(trackOfLead({ categoryKey: "roofing" }, ctx), "websites");
  assert.equal(trackOfLead({ categoryKey: "roofing", track: "restaurants" }, ctx), "restaurants");
  assert.equal(trackOfLead({ categoryKey: "pizzeria", track: "unknown" }, ctx), "restaurants", "an unknown stored track falls back to the category");
});

test("settings lay a track's own quota and offer over the global ones; the default track is untouched", () => {
  assert.equal(settingsForTrack(settings, "websites"), settings);
  const r = settingsForTrack(settings, "restaurants");
  assert.equal(r.weeklyQuota, settings.tracks.restaurants.weeklyQuota);
  assert.equal(r.categoriesPerWeek, settings.tracks.restaurants.categoriesPerWeek);
  assert.equal(r.offer.name, "Website + Cliqbux");
  assert.equal(r.offer.price, null, "the price is a placeholder until it is confirmed");
  assert.equal(r.geography, settings.geography, "everything else is shared");
  assert.equal(partnerFor(settings, "restaurants").name, "Cliqbux");
  assert.equal(partnerFor(settings, "websites"), null);
});

test("the track settings validate, and a placeholder offer is a warning, not an error", () => {
  const ok = validateSettings(settings);
  assert.deepEqual(ok.errors, []);
  assert.ok(ok.warnings.some((w) => /Track restaurants offer price is a placeholder/.test(w)));
  assert.ok(ok.warnings.some((w) => /Cliqbux details are placeholders/.test(w)));
  const bad = structuredClone(settings);
  bad.tracks.restaurants.offer.priceConfirmed = true;
  bad.tracks.restaurants.partner.website = "not a url";
  bad.tracks.restaurants.weeklyQuota = 0;
  const errors = validateSettings(bad).errors.join(" | ");
  assert.match(errors, /marked confirmed but has no price/);
  assert.match(errors, /partner website must be a full http/);
  assert.match(errors, /weeklyQuota must be a whole number above 0/);
});

test("run keys keep the plain date for websites and add the track for the others", () => {
  assert.equal(runKey(RUN, "websites"), RUN);
  assert.equal(runKey(RUN), RUN);
  assert.equal(runKey(RUN, "restaurants"), `${RUN}.restaurants`);
  assert.deepEqual(splitRunKey(`${RUN}.restaurants`), { runId: RUN, track: "restaurants" });
  assert.deepEqual(splitRunKey(RUN), { runId: RUN, track: "websites" });
});

test("the restaurants plan rotates only restaurant categories with its own quota and partner", () => {
  const web = planWeek({ now: RUN, ...state() });
  assert.equal(web.track, "websites");
  assert.ok(web.categories.every((k) => categories[k].vertical !== "restaurants"), "website weeks never include restaurants");
  const plan = planWeek({ now: RUN, ...state(), track: "restaurants" });
  assert.equal(plan.track, "restaurants");
  assert.equal(plan.trackLabel, "Restaurants + Cliqbux");
  assert.equal(plan.partner.name, "Cliqbux");
  assert.equal(plan.runId, RUN);
  assert.equal(plan.quota, settings.tracks.restaurants.weeklyQuota);
  assert.equal(plan.categories.length, settings.tracks.restaurants.categoriesPerWeek);
  assert.ok(plan.categories.every((k) => categories[k].vertical === "restaurants"));
  const seen = new Set();
  for (let week = 0; week < 6; week += 1) {
    const day = new Date(Date.UTC(2026, 8, 28 + week * 7)).toISOString().slice(0, 10);
    planWeek({ now: day, ...state(), track: "restaurants" }).categories.forEach((k) => seen.add(k));
  }
  assert.equal(seen.size, 6, "every restaurant category comes up within a few weeks");
  assert.throws(() => planWeek({ now: RUN, ...state(), track: "bogus" }), /Unknown track/);
});

test("restaurants score on the ordering gap instead of the job ticket, websites are unchanged", () => {
  const l = { googleRating: 4.8, googleReviews: 150, websiteGap: 3, ticketValue: 1, orderingGap: 3, visualFit: 3 };
  const web = scoreLead(l);
  const rest = scoreLead(l, { track: "restaurants" });
  assert.deepEqual(web.parts.map((p) => p.key), ["rating", "reviews", "websiteGap", "ticketValue", "visualFit"]);
  assert.deepEqual(rest.parts.map((p) => p.key), ["rating", "reviews", "websiteGap", "orderingGap", "visualFit"]);
  assert.equal(rest.parts.find((p) => p.key === "orderingGap").points, 15);
  assert.equal(web.parts.find((p) => p.key === "ticketValue").points, 5);
  assert.ok(rest.total > web.total);
  assert.match(rest.parts.find((p) => p.key === "orderingGap").detail, /phone only or nothing/);
  assert.match(scoreLead({ ...l, orderingGap: undefined }, { track: "restaurants" }).warnings.join(" "), /Ordering gap is missing/);
});

test("a restaurant lead needs the ordering gap and no ticket value; a website lead still needs the ticket", () => {
  const ctx = { settings, categories, tracks, chains, geography, mode: "weekly", now: NOW };
  const stored = (o = {}) => ({ ...restaurant(1, o), sources: [{ url: "https://example.org/restaurant/1", label: "example.org", checkedAt: RUN }] });
  assert.deepEqual(validateLead(stored(), ctx).errors, []);
  const { orderingGap, ...noGap } = stored();
  assert.match(validateLead(noGap, ctx).errors.join(" "), /missing required field orderingGap/);
  const { ticketValue, ...noTicket } = { ...autoLead(1), sources: stored().sources };
  assert.match(validateLead(noTicket, ctx).errors.join(" "), /missing required field ticketValue/);
  assert.match(validateLead(stored({ track: "nope" }), ctx).errors.join(" "), /track "nope" is not in config\/tracks.json/);
});

test("a restaurant batch fills the restaurant quota, tags the track and keeps its own run", () => {
  const batch = { runId: RUN, track: "restaurants", mode: "weekly", searched: [{ metro: "houston", category: "restaurant" }], leads: [1, 2, 3, 4, 5, 6, 7].map((n) => restaurant(n)) };
  const { state: next, report } = ingestBatch({ batch, state: state(), now: NOW });
  assert.deepEqual(report.errors, []);
  assert.equal(report.track, "restaurants");
  assert.equal(report.counts.accepted, settings.tracks.restaurants.weeklyQuota);
  assert.equal(report.counts.queued, 7 - settings.tracks.restaurants.weeklyQuota, "the overflow goes to the queue");
  assert.ok(next.leads.every((l) => l.track === "restaurants"));
  assert.ok(next.leads.every((l) => l.ticketValue === categories.restaurant.ticketValueDefault), "the ticket takes the category default");
  assert.ok(next.leads.every((l) => /score \d+/.test(l.outreach.history[0].text)));
  const again = ingestBatch({ batch, state: next, now: NOW });
  assert.equal(again.report.counts.accepted, 0);
  assert.equal(again.report.counts.duplicates, 7, "the accepted leads and the queued overflow both match");
});

test("website leads and restaurant leads cannot be ingested in each other's batch", () => {
  const wrongTrack = ingestBatch({ batch: { runId: RUN, mode: "weekly", searched: [{}], leads: [restaurant(1)] }, state: state(), now: NOW });
  assert.equal(wrongTrack.report.counts.accepted, 0);
  assert.match(wrongTrack.report.errors[0].errors.join(" "), /belongs to the restaurants track, but this batch is for the websites track/);
  const wrongBatch = ingestBatch({ batch: { runId: RUN, track: "restaurants", mode: "weekly", searched: [{}], leads: [autoLead(1)] }, state: state(), now: NOW });
  assert.equal(wrongBatch.report.counts.accepted, 0);
  assert.match(wrongBatch.report.errors[0].errors.join(" "), /belongs to the websites track, but this batch is for the restaurants track/);
  const unknown = ingestBatch({ batch: { runId: RUN, track: "bogus", mode: "weekly", searched: [{}], leads: [restaurant(1)] }, state: state(), now: NOW });
  assert.match(unknown.report.errors[0].errors.join(" "), /batch track "bogus" is not in config\/tracks.json/);
});

test("each track counts its own quota on the same Monday", () => {
  const first = ingestBatch({ batch: { runId: RUN, track: "restaurants", mode: "weekly", searched: [{}], leads: [1, 2, 3, 4, 5].map((n) => restaurant(n)) }, state: state(), now: NOW });
  assert.equal(first.report.counts.accepted, 5);
  const web = ingestBatch({ batch: { runId: RUN, mode: "weekly", searched: [{}], leads: [1, 2, 3].map((n) => autoLead(n)) }, state: first.state, now: NOW });
  assert.equal(web.report.counts.accepted, 3, "restaurant leads from the same run do not use up the website quota");
  assert.equal(web.report.track, "websites");
});

test("run reports are stored per track, and old reports read as the websites track", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kija-tracks-"));
  try {
    const store = createStore(root);
    store.saveRun({ runId: RUN, track: "websites", ingestedAt: "a", counts: {} });
    store.saveRun({ runId: RUN, track: "restaurants", ingestedAt: "b", counts: {} });
    store.saveRun({ runId: "2026-10-19", ingestedAt: "c", counts: {} });
    assert.ok(fs.existsSync(path.join(root, "data", "runs", `${RUN}.json`)));
    assert.ok(fs.existsSync(path.join(root, "data", "runs", `${RUN}.restaurants.json`)));
    assert.equal(store.readRun(RUN).ingestedAt, "a");
    assert.equal(store.readRun(RUN, "restaurants").ingestedAt, "b");
    const runs = store.listRuns();
    assert.equal(runs.length, 3);
    assert.equal(runs.find((r) => r.runId === "2026-10-19").track, "websites");
    assert.deepEqual(runs.filter((r) => r.runId === RUN).map((r) => r.track).sort(), ["restaurants", "websites"]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
