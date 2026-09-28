import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { leadsToCsv, SHEET_COLUMNS, csvCell } from "../src/lib/csv.js";
import { scoreLead } from "../src/lib/score.js";
import { isPlaceholderBenchmarks, placeholderBenchmarks, seedToData, SHEET_DATE } from "../src/lib/seed.js";
import { validateBenchmarks } from "../src/lib/validate.js";

const read = (rel) => JSON.parse(fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));
const seed = read("seed/sheet-2026-09-28.json");
const categories = read("config/categories.json");
const NOW = "2026-09-28T12:00:00.000Z";

test("the seed maps to 20 leads and 5 queue items per the spec", () => {
  const { leads, queue, rejected } = seedToData(seed, { now: NOW });
  assert.equal(leads.length, 20);
  assert.equal(queue.length, 5);
  assert.deepEqual(rejected, []);
  assert.equal(new Set(leads.map((l) => l.id)).size, 20);
  assert.equal(SHEET_DATE, "2026-09-26");

  const gm = leads.find((l) => l.id === "gm-auto-care-dallas-tx");
  assert.ok(gm, "ids are slugify(business city state)");
  assert.equal(gm.metro, "dallas-fort-worth");
  assert.equal(gm.origin, "sheet-import");
  assert.equal(gm.addedAt, "2026-09-26");
  assert.equal(gm.runId, "");
  assert.deepEqual(gm.sources, [
    { url: "https://radiatorrepairhub.com/business/gm-auto-care-6580908f-1a7a-4960-bc90-7f3c4e53bbf0", label: "radiatorrepairhub.com", checkedAt: "2026-09-26" },
    { url: "https://stackkly.com/locations/texas/dallas/truck-repair/gm-auto-care", label: "stackkly.com", checkedAt: "2026-09-26" },
  ]);
  assert.deepEqual(gm.verification, {
    status: "needs-recheck",
    checkedAt: "2026-09-26",
    checks: [{ check: "sheet import", result: gm.websiteStatus, url: "" }],
    notes: "",
  });
  assert.equal(gm.outreach.status, "New");
  assert.equal(gm.outreach.nextAction, "Build private homepage demo");
  assert.deepEqual(gm.outreach.history, [{ at: NOW, by: "sheet-import", type: "created", text: "Imported from the Google Sheet Lead Pipeline tab." }]);
  assert.deepEqual(gm.demo, { builtAt: "", template: "", palette: "", shareApproved: false });
  assert.ok(!("sheetScore" in gm), "the score is computed, never stored");
  assert.ok(!("status" in gm) && !("nextAction" in gm), "sheet outreach columns move under outreach");

  const fenix = leads.find((l) => l.business === "Fenix Auto Body Shop");
  assert.equal(fenix.outreach.status, "Research");
  assert.deepEqual(fenix.sources, []);
  assert.equal(leads.filter((l) => l.business === "Fenix Auto Body Shop").length, 1);
  assert.equal(leads.find((l) => l.business === "Al's Auto Repair Shop").area, "Oak Cliff");
  assert.deepEqual(leads.find((l) => l.business === "Papas and Ninos Bodyshop").languages, ["English", "Spanish"]);

  for (const lead of leads) {
    const row = seed.leads.find((r) => r.business === lead.business);
    assert.equal(scoreLead(lead).total, row.sheetScore, `${lead.business} keeps its sheet score`);
  }
});

test("seed queue items carry the sheet fields and a reason", () => {
  const { queue } = seedToData(seed, { now: NOW });
  const pv = queue.find((q) => q.id === "p-v-auto-services-dallas-tx");
  assert.equal(pv.candidate, "P V Auto Services");
  assert.equal(pv.googleRating, 4.6);
  assert.equal(pv.reason, "Rating below 4.7");
  assert.equal(pv.decision, "Research");
  assert.equal(pv.lead, null);
  assert.equal(pv.metro, "dallas-fort-worth");
  assert.equal(pv.sources[0].label, "radiatorrepairhub.com");
  assert.equal(queue.find((q) => q.candidate === "The Parlor Barbershop").ownerContact, "Manny");
  assert.equal(queue.find((q) => q.candidate === "Fort Worth Mobile Mechanic").reason, "Needs verification before promotion");
});

test("placeholder benchmarks cover every category and say they are not researched", () => {
  const b = placeholderBenchmarks(categories, { updatedAt: "2026-09-28" });
  assert.deepEqual(Object.keys(b.categories).sort(), Object.keys(categories).sort());
  for (const [key, c] of Object.entries(b.categories)) {
    assert.ok(c.ticket.typical > 0 && c.ticket.low <= c.ticket.typical && c.ticket.typical <= c.ticket.high, key);
    assert.deepEqual(c.ticket.sources, []);
    assert.equal(c.grossMargin.typical, 0.4);
    assert.equal(c.rentedLead, null);
    assert.equal(c.notes, "Placeholder, not researched");
  }
  assert.deepEqual(b.consumerStats, []);
  assert.deepEqual(b.websiteMarket.sources, []);
  const v = validateBenchmarks(b, { categories });
  assert.deepEqual(v.errors, []);
  assert.equal(isPlaceholderBenchmarks(b), true);
  const researched = structuredClone(b);
  researched.categories.hvac.ticket.sources.push({ title: "Survey", url: "https://example.org", year: 2026, note: "" });
  assert.equal(isPlaceholderBenchmarks(researched), false);
});

test("CSV export uses the sheet column order with proper quoting", () => {
  assert.deepEqual(SHEET_COLUMNS, [
    "Score", "Business", "Category", "City", "Google Rating", "Reviews", "Website Gap (1-3)", "Ticket Value (1-3)",
    "Visual Fit (1-3)", "Phone", "Website Status", "Confidence", "Why Kija", "Pitch Angle", "Private Demo Concept",
    "Outreach Status", "Next Action", "Next Date", "Source 1", "Source 2",
  ]);
  const { leads } = seedToData(seed, { now: NOW });
  const csv = leadsToCsv(leads);
  const lines = csv.split("\r\n");
  assert.equal(lines[0], SHEET_COLUMNS.join(","));
  assert.equal(lines.at(-1), "", "ends with a line break");
  assert.equal(lines.length, 22);
  assert.ok(lines[1].startsWith("96,GM AUTO CARE,"), "highest score first");
  const als = lines.find((l) => l.includes("Al's Auto Repair Shop"));
  assert.ok(als.startsWith("95,Al's Auto Repair Shop,Auto Repair,Dallas / Oak Cliff,4.8,308,3,3,2,214-946-4100,"));
  assert.ok(als.endsWith(",New,Build private homepage demo,,https://txinspectors.net/business/tx/dallas/als-auto-repair-shop/,https://www.bbb.org/us/tx/dallas/profile/auto-repair/als-auto-repair-shop-0875-90014396"));
  assert.ok(lines.find((l) => l.includes("Fenix")).endsWith(",Research,Final website verification,,,"), "missing sources are empty cells");

  assert.equal(csvCell("plain"), "plain");
  assert.equal(csvCell("a, b"), "\"a, b\"");
  assert.equal(csvCell("say \"hi\""), "\"say \"\"hi\"\"\"");
  assert.equal(csvCell("two\nlines"), "\"two\nlines\"");
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(4.9), "4.9");
});
