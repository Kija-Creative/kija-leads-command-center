import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { benchmarkFor, computeRoi, ESTIMATE_DISCLAIMER, formatDollars, PLACEHOLDER_SOURCE } from "../src/lib/roi.js";
import { placeholderBenchmarks } from "../src/lib/seed.js";

const categories = JSON.parse(fs.readFileSync(new URL("../config/categories.json", import.meta.url), "utf8"));
const DASHES = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
const offer = { name: "Owned Website", price: 2500, priceConfirmed: false };
const sourced = {
  ticket: { low: 200, typical: 550, high: 1500, unit: "repair order", sources: [{ title: "Repair cost survey 2026", url: "https://example.org/survey", year: 2026, note: "" }] },
  grossMargin: { typical: 0.5, sources: [{ title: "Shop margin study", url: "https://example.org/margin", year: 2025 }] },
  rentedLead: null,
  notes: "",
};

test("break even matches the SPEC example exactly", () => {
  const r = computeRoi({ lead: {}, benchmark: sourced, offer });
  assert.equal(r.inputs.ticket, 550);
  assert.equal(r.inputs.margin, 0.5);
  assert.equal(r.inputs.price, 2500);
  assert.equal(r.inputs.grossPerJob, 275);
  assert.equal(r.breakEven.jobs, 10);
  assert.equal(r.breakEven.sentence, "At a typical $550 repair order and 50% gross margin, the site pays for itself after 10 extra jobs, about one a month for a year.");
  assert.equal(r.disclaimer, ESTIMATE_DISCLAIMER);
});

test("scenarios for 1, 3 and 5 extra jobs a month", () => {
  const r = computeRoi({ lead: {}, benchmark: sourced, offer });
  assert.deepEqual(r.scenarios.map((s) => [s.jobsPerMonth, s.monthlyRevenue, s.annualRevenue, s.annualGrossProfit, s.paybackMonths, s.returnMultiple]), [
    [1, 550, 6600, 3300, 9.1, 1.3],
    [3, 1650, 19800, 9900, 3, 4],
    [5, 2750, 33000, 16500, 1.8, 6.6],
  ]);
  assert.deepEqual(r.scenarios.map((s) => s.label), ["low", "middle", "high"]);
  assert.equal(r.scenarios[1].sentence, "If the site brings in about 3 extra jobs a month, that is about $1,650 a month in revenue and about $9,900 a year in gross profit, so it would pay for itself in about 3 months.");
  for (const s of r.scenarios) {
    for (const k of ["monthlyRevenue", "annualRevenue", "annualGrossProfit"]) assert.ok(Number.isInteger(s[k]), `${k} is whole dollars`);
  }
});

test("overrides replace benchmark inputs and jobsPerMonth becomes the middle scenario", () => {
  const r = computeRoi({ lead: {}, benchmark: sourced, offer, overrides: { ticket: 800, margin: 0.4, price: 3200, jobsPerMonth: 6 } });
  assert.equal(r.inputs.grossPerJob, 320);
  assert.equal(r.breakEven.jobs, 10);
  assert.match(r.breakEven.sentence, /^At a \$800 repair order and 40% gross margin/);
  assert.deepEqual(r.scenarios.map((s) => s.jobsPerMonth), [2, 6, 10]);
  for (const key of ["ticket", "margin", "price", "jobsPerMonth"]) {
    assert.equal(r.assumptions.find((a) => a.key === key).origin, "override", key);
  }
});

test("lead.roiOverrides are used when no overrides are passed", () => {
  const r = computeRoi({ lead: { roiOverrides: { ticket: 1000 } }, benchmark: sourced, offer });
  assert.equal(r.inputs.ticket, 1000);
  assert.equal(r.breakEven.jobs, 5);
});

test("margin falls back to 40% and missing sources read as placeholders", () => {
  const placeholder = placeholderBenchmarks(categories, { updatedAt: "2026-09-28" }).categories["auto-repair"];
  const r = computeRoi({ lead: {}, benchmark: { ...placeholder, grossMargin: undefined }, offer });
  assert.equal(r.inputs.margin, 0.4);
  const ticket = r.assumptions.find((a) => a.key === "ticket");
  assert.equal(ticket.source, PLACEHOLDER_SOURCE);
  assert.equal(ticket.verified, false);
  assert.match(r.assumptions.find((a) => a.key === "margin").source, /Default 40% margin, placeholder, not researched/);
  assert.match(r.assumptions.find((a) => a.key === "price").source, /placeholder price until confirmed/);
  assert.equal(r.unverified, true);
});

test("sourced assumptions carry their title and url", () => {
  const r = computeRoi({ lead: {}, benchmark: sourced, offer: { ...offer, priceConfirmed: true } });
  const ticket = r.assumptions.find((a) => a.key === "ticket");
  assert.equal(ticket.source, "Repair cost survey 2026");
  assert.equal(ticket.url, "https://example.org/survey");
  assert.equal(ticket.verified, true);
  assert.equal(r.assumptions.find((a) => a.key === "margin").url, "https://example.org/margin");
  assert.equal(r.unverified, false);
  assert.deepEqual(r.assumptions.map((a) => a.key), ["ticket", "margin", "price", "jobsPerMonth"]);
});

test("rented lead comparison appears only with a benchmark for it", () => {
  const withRented = { ...sourced, rentedLead: { low: 50, high: 100, platform: "Angi", sources: [] } };
  const r = computeRoi({ lead: {}, benchmark: withRented, offer });
  assert.equal(r.rentedLeadComparison.leads, 33);
  assert.equal(r.rentedLeadComparison.sentence, "The site costs about the same as 33 rented leads from Angi, at about $50 to $100 each.");
  assert.ok(r.sentences.includes(r.rentedLeadComparison.sentence));
  assert.equal(r.assumptions.find((a) => a.key === "rentedLead").source, PLACEHOLDER_SOURCE);
  assert.equal(computeRoi({ lead: {}, benchmark: sourced, offer }).rentedLeadComparison, null);
});

test("sentences hedge, never promise and never use dashes", () => {
  const benchmarks = placeholderBenchmarks(categories, {});
  for (const key of Object.keys(categories)) {
    for (const overrides of [{}, { jobsPerMonth: 1 }, { ticket: 20000 }, { ticket: 25, margin: 0.9 }]) {
      const r = computeRoi({ lead: { categoryKey: key }, benchmark: benchmarkFor(benchmarks, key), offer, overrides });
      assert.ok(r.sentences.length >= 4, key);
      for (const s of r.sentences) {
        assert.match(s, /\babout\b|\bif\b/i, `${key}: ${s}`);
        assert.doesNotMatch(s, /guarantee|promise|will earn|will make/i, `${key}: ${s}`);
        assert.doesNotMatch(s, DASHES);
        assert.match(s, /\.$/);
      }
    }
  }
});

test("break even pace wording covers small, monthly and weekly paces", () => {
  const pace = (ticket) => computeRoi({ lead: {}, benchmark: { ticket: { typical: ticket, unit: "job", sources: [] }, grossMargin: { typical: 0.5 } }, offer }).breakEven.sentence;
  assert.match(pace(10000), /after about one extra job\.$/);
  assert.match(pace(1250), /after 4 extra jobs, about one every three months for a year\.$/);
  // The stated pace must reach the count: 8 jobs is one a month, never one every two months.
  assert.match(pace(625), /after 8 extra jobs, about one a month for a year\.$/);
  assert.match(pace(1000), /after 5 extra jobs, about one every two months for a year\.$/);
  assert.match(pace(200), /after 25 extra jobs, about 2 a month for a year\.$/);
  assert.match(pace(35), /after 143 extra jobs, about 3 a week for a year\.$/);
});

test("missing ticket or price degrades to a readable sentence", () => {
  const r = computeRoi({ lead: {}, benchmark: null, offer });
  assert.equal(r.breakEven.jobs, null);
  assert.deepEqual(r.scenarios, []);
  assert.match(r.breakEven.sentence, /^Add a typical ticket value/);
  const noPrice = computeRoi({ lead: {}, benchmark: sourced, offer: {} });
  assert.match(noPrice.breakEven.sentence, /^Add a website price/);
  assert.doesNotThrow(() => computeRoi());
});

test("benchmarkFor falls back to general and formatDollars groups thousands", () => {
  const b = { categories: { general: { ticket: { typical: 300 } }, hvac: { ticket: { typical: 450 } } } };
  assert.equal(benchmarkFor(b, "hvac").ticket.typical, 450);
  assert.equal(benchmarkFor(b, "tattoo").ticket.typical, 300);
  assert.equal(benchmarkFor({}, "hvac"), null);
  assert.equal(formatDollars(1234567.4), "$1,234,567");
  assert.equal(formatDollars(999), "$999");
  assert.equal(formatDollars(0), "$0");
});
