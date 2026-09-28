import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { scoreLead, SCORING_RULES, DEFAULT_THRESHOLDS } from "../src/lib/score.js";

const seed = JSON.parse(fs.readFileSync(new URL("../seed/sheet-2026-09-28.json", import.meta.url), "utf8"));
const DASHES = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);

test("every seed sheetScore is reproduced exactly by scoreLead", () => {
  assert.equal(seed.leads.length, 20);
  for (const lead of seed.leads) {
    assert.equal(scoreLead(lead).total, lead.sheetScore, `${lead.business} scored ${scoreLead(lead).total}, sheet says ${lead.sheetScore}`);
  }
});

test("scoring rules mirror the sheet and add to 100", () => {
  assert.deepEqual(SCORING_RULES.map((r) => [r.key, r.max]), [
    ["rating", 30], ["reviews", 25], ["websiteGap", 20], ["ticketValue", 15], ["visualFit", 10],
  ]);
  assert.equal(SCORING_RULES.reduce((n, r) => n + r.max, 0), 100);
  for (const r of SCORING_RULES) {
    assert.ok(r.label && r.formula && r.why && r.scale, `${r.key} has label, formula, why and scale`);
  }
});

test("every part carries key, label, points, max and a full sentence detail", () => {
  for (const lead of seed.leads) {
    const { parts } = scoreLead(lead);
    assert.deepEqual(parts.map((p) => p.key), SCORING_RULES.map((r) => r.key));
    for (const p of parts) {
      assert.equal(typeof p.label, "string");
      assert.equal(p.max, SCORING_RULES.find((r) => r.key === p.key).max);
      assert.equal(Math.round(p.points * 10) / 10, p.points, "points are rounded to one decimal");
      assert.ok(p.points >= 0 && p.points <= p.max);
      assert.match(p.detail, /^[A-Z0-9].{20,}\.$/, `detail reads as a sentence: ${p.detail}`);
      assert.doesNotMatch(p.detail, DASHES);
    }
  }
});

test("detail wording matches the SPEC example", () => {
  const gm = seed.leads.find((l) => l.business === "GM AUTO CARE");
  const { parts, total } = scoreLead(gm);
  assert.equal(total, 96);
  assert.equal(parts[0].detail, "4.9 stars earns 29.4 of 30. Trust already exists; Kija is converting it, not inventing it.");
  assert.equal(parts[1].points, 25);
  assert.match(parts[1].detail, /^501 Google reviews earns 25 of 25\. That is at or past the 300 review cap/);
  assert.equal(parts[4].points, 6.7);
  assert.match(parts[4].detail, /^Visual fit 2 of 3 \(good\) earns 6\.7 of 10\./);
});

test("total rounds the sum of unrounded parts, not the rounded parts", () => {
  // 27 + 1.75 + 20 + 15 + 6.667 = 70.42, rounds to 70; the rounded parts 27 + 1.8 + 20 + 15 + 6.7 sum to 70.5.
  const r = scoreLead({ googleRating: 4.5, googleReviews: 21, websiteGap: 3, ticketValue: 3, visualFit: 2 });
  assert.equal(r.total, 70);
  assert.equal(Math.round(r.parts.reduce((n, p) => n + p.points, 0) * 10) / 10, 70.5);
});

test("warnings flag anything below the preferred standards", () => {
  const base = { googleRating: 4.9, googleReviews: 120, websiteGap: 3, ticketValue: 3, visualFit: 3 };
  assert.deepEqual(scoreLead(base).warnings, []);
  assert.match(scoreLead({ ...base, googleRating: 4.6 }).warnings.join(" "), /Rating 4\.6 is below the preferred 4\.7\./);
  assert.match(scoreLead({ ...base, googleReviews: 24 }).warnings.join(" "), /24 reviews is below the preferred 30\./);
  assert.match(scoreLead({ ...base, websiteGap: 1 }).warnings.join(" "), /Website gap 1 is below 2/);
});

test("custom thresholds change warnings but never the score", () => {
  const lead = { googleRating: 4.8, googleReviews: 50, websiteGap: 3, ticketValue: 2, visualFit: 2 };
  const strict = scoreLead(lead, { thresholds: { ...DEFAULT_THRESHOLDS, preferredRating: 4.9, preferredReviews: 60 } });
  assert.equal(strict.total, scoreLead(lead).total);
  assert.equal(strict.warnings.length, 2);
});

test("missing or bad numbers score 0 with a warning instead of throwing", () => {
  const r = scoreLead({ googleRating: "n/a", websiteGap: 3, ticketValue: 3, visualFit: 3 });
  assert.equal(r.parts[0].points, 0);
  assert.equal(r.parts[1].points, 0);
  assert.equal(r.total, 45);
  assert.ok(r.warnings.some((w) => /Google rating is missing or not a number/.test(w)));
  assert.ok(r.warnings.some((w) => /review count is missing/.test(w)));
  assert.doesNotThrow(() => scoreLead(undefined));
  const clamped = scoreLead({ googleRating: 7, googleReviews: 10, websiteGap: 5, ticketValue: 3, visualFit: 3 });
  assert.equal(clamped.parts[0].points, 30);
  assert.equal(clamped.parts[2].points, 20);
  assert.ok(clamped.warnings.some((w) => /clamped/.test(w)));
});
