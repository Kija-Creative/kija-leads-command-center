import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { categoryRotationOrder, dateOf, isoWeek, planWeek, runIdFor, weekIndex } from "../src/lib/week.js";
import { seedToData } from "../src/lib/seed.js";

const read = (rel) => JSON.parse(fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));
const settings = read("config/settings.json");
const categories = read("config/categories.json");
const geography = read("config/geography.json");
const seed = read("seed/sheet-2026-09-28.json");
const { leads, queue } = seedToData(seed, { now: "2026-09-28T12:00:00.000Z" });
const base = { settings, geography, categories, leads, queue, rejected: [] };

test("runIdFor returns the Monday of the week", () => {
  assert.equal(runIdFor("2026-09-28"), "2026-09-28");
  assert.equal(runIdFor("2026-10-01"), "2026-09-28");
  assert.equal(runIdFor("2026-10-04"), "2026-09-28", "Sunday belongs to the week that started Monday");
  assert.equal(runIdFor("2026-10-05T08:00:00-05:00"), "2026-10-05", "the date part of an ISO string is used as is");
  assert.equal(runIdFor("2026-10-04T23:30:00-05:00"), "2026-09-28");
  assert.equal(runIdFor("2027-01-01"), "2026-12-28", "across a year boundary");
  assert.equal(runIdFor("2024-03-01"), "2024-02-26", "across a leap day");
  assert.equal(runIdFor(new Date(2026, 9, 7, 9, 0)), "2026-10-05", "a Date uses the local calendar date");
  assert.throws(() => runIdFor("someday"), /Cannot read a date/);
});

test("isoWeek follows ISO 8601", () => {
  assert.equal(isoWeek("2026-09-28"), "2026-W40");
  assert.equal(isoWeek("2026-10-04"), "2026-W40");
  assert.equal(isoWeek("2026-01-01"), "2026-W01");
  assert.equal(isoWeek("2027-01-01"), "2026-W53");
  assert.equal(isoWeek("2021-01-03"), "2020-W53");
  assert.equal(isoWeek("2024-12-30"), "2025-W01");
  assert.equal(dateOf("2026-09-28T01:00:00Z"), "2026-09-28");
});

test("weekIndex counts whole weeks from the rotation start", () => {
  assert.equal(weekIndex("2026-09-28", "2026-09-28"), 0);
  assert.equal(weekIndex("2026-10-04", "2026-09-28"), 0);
  assert.equal(weekIndex("2026-10-05", "2026-09-28"), 1);
  assert.equal(weekIndex("2027-09-27", "2026-09-28"), 52);
  assert.equal(weekIndex("2026-09-21", "2026-09-28"), -1);
});

test("planWeek is deterministic and the same all week", () => {
  const a = planWeek({ now: "2026-10-05", ...base });
  const b = planWeek({ now: "2026-10-05", ...base });
  const sunday = planWeek({ now: "2026-10-11", ...base });
  assert.deepEqual(a, b);
  assert.deepEqual(sunday, a);
  assert.equal(a.runId, "2026-10-05");
  assert.equal(a.week, "2026-W41");
  assert.equal(a.quota, settings.weeklyQuota);
  assert.equal(a.homeMetro, "dallas-fort-worth");
});

test("metros slide over the non-home metros with the home metro every week", () => {
  const others = geography.metros.filter((m) => m.key !== "dallas-fort-worth").map((m) => m.key);
  const w0 = planWeek({ now: "2026-09-28", ...base });
  assert.deepEqual(w0.metros.map((m) => m.key), ["dallas-fort-worth", ...others.slice(0, 4)]);
  const w1 = planWeek({ now: "2026-10-05", ...base });
  assert.deepEqual(w1.metros.map((m) => m.key), ["dallas-fort-worth", ...others.slice(4, 8)]);
  assert.ok(w0.metros[1].anchorCities.length >= 3, "full Metro objects are returned");

  // Over enough weeks every metro is covered, and consecutive weeks never repeat a rotation metro.
  const seen = new Set();
  let previous = null;
  for (let week = 0; week < 13; week += 1) {
    const day = new Date(Date.UTC(2026, 8, 28 + week * 7)).toISOString().slice(0, 10);
    const plan = planWeek({ now: day, ...base });
    assert.equal(plan.metros.length, 5);
    assert.equal(plan.metros[0].key, "dallas-fort-worth");
    const rotating = plan.metros.slice(1).map((m) => m.key);
    if (previous) assert.equal(rotating.filter((k) => previous.includes(k)).length, 0, `week ${week} overlaps the week before`);
    rotating.forEach((k) => seen.add(k));
    previous = rotating;
  }
  assert.equal(seen.size, others.length);
});

test("home metro is left out when homeEveryWeek is false, and home-only mode uses only it", () => {
  const noHome = planWeek({ now: "2026-09-28", ...base, settings: { ...settings, geography: { ...settings.geography, homeEveryWeek: false } } });
  assert.equal(noHome.metros.length, 4);
  assert.ok(!noHome.metros.some((m) => m.key === "dallas-fort-worth"));
  const homeOnly = planWeek({ now: "2026-09-28", ...base, settings: { ...settings, geography: { ...settings.geography, mode: "home-only" } } });
  assert.deepEqual(homeOnly.metros.map((m) => m.key), ["dallas-fort-worth"]);
});

test("categories rotate, skip general and always cover auto, home services and contractors", () => {
  const order = categoryRotationOrder(categories);
  assert.ok(!order.includes("general"));
  assert.equal(order.length, Object.keys(categories).length - 1);
  const covered = new Set();
  for (let week = 0; week < 60; week += 1) {
    const day = new Date(Date.UTC(2026, 8, 28 + week * 7)).toISOString().slice(0, 10);
    const plan = planWeek({ now: day, ...base });
    assert.equal(plan.categories.length, settings.categoriesPerWeek);
    assert.equal(new Set(plan.categories).size, plan.categories.length, "no repeats within a week");
    const verticals = new Set(plan.categories.map((k) => categories[k].vertical));
    for (const v of ["auto", "home-services", "contractor"]) assert.ok(verticals.has(v), `week ${week} has ${v}`);
    plan.categories.forEach((k) => covered.add(k));
  }
  assert.equal(covered.size, order.length, "every category comes up in rotation");

  // With a tiny window the fix-up still forces the three required verticals in.
  const small = planWeek({ now: "2026-09-28", ...base, settings: { ...settings, categoriesPerWeek: 3 } });
  assert.deepEqual(new Set(small.categories.map((k) => categories[k].vertical)), new Set(["auto", "home-services", "contractor"]));
});

test("exclusions list every known business by phone and by name and state", () => {
  const rejected = [{ key: "5125550100", business: "Rejected Roofing", city: "Austin", state: "TX", phone: "512-555-0100", reason: "Has a site." }];
  const plan = planWeek({ now: "2026-09-28", ...base, rejected });
  assert.ok(plan.exclusions.includes("9726814966"), "GM AUTO CARE phone");
  assert.ok(plan.exclusions.includes("gm auto care|TX"), "GM AUTO CARE name and state");
  assert.ok(plan.exclusions.includes("p v auto services|TX"), "queue items are excluded");
  assert.ok(plan.exclusions.includes("5125550100"), "rejections are excluded");
  assert.deepEqual(plan.exclusions, [...plan.exclusions].sort());
  assert.ok(plan.excludedBusinesses.includes("GM AUTO CARE, Dallas, TX (lead)"));
  assert.equal(plan.excludedBusinesses.length, leads.length + queue.length + 1);
});

test("suppressed businesses are excluded like rejected ones", () => {
  const suppression = [{ key: "3035550199", business: "Quiet Plumbing", city: "Denver", state: "CO", phone: "303-555-0199", reason: "Opted out.", addedAt: "2026-09-20", by: "Jamey" }];
  const plan = planWeek({ now: "2026-09-28", ...base, suppression });
  assert.ok(plan.exclusions.includes("3035550199"));
  assert.ok(plan.exclusions.includes("quiet plumbing|CO"));
  assert.ok(plan.excludedBusinesses.includes("Quiet Plumbing, Denver, CO (suppressed)"));
});

test("planning before the rotation start still works", () => {
  const plan = planWeek({ now: "2026-09-14", ...base });
  assert.equal(plan.weekIndex, -2);
  assert.equal(plan.metros.length, 5);
  assert.equal(plan.categories.length, settings.categoriesPerWeek);
});
