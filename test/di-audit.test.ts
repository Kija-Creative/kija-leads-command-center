// Design audit: a page built to the renderer contract passes; each Quality Control item of the
// brief is flagged with a sentence when the page departs from it.
import assert from "node:assert/strict";
import test from "node:test";
import type { AuditResult, SiteDnaRecord } from "../src/design-intelligence/schema.ts";
import { auditSite } from "../src/design-intelligence/audit.ts";
import { appendHistory, emptyHistory } from "../src/design-intelligence/history.ts";
import { roofing } from "../src/design-intelligence/industries/roofing.ts";
import { selectSiteDna } from "../src/design-intelligence/select-site-dna.ts";
import { abcRoofing, engineData, NOW, stormRoofing } from "./di-fixtures.ts";
import { fixturePage } from "./di-page.ts";
import type { PageOptions } from "./di-page.ts";

function record(lead = abcRoofing): SiteDnaRecord {
  const r = selectSiteDna(lead, engineData(), { now: NOW });
  assert.ok(r.ok && r.record);
  return r.record as SiteDnaRecord;
}

function run(rec: SiteDnaRecord, o: PageOptions = {}, lead = abcRoofing, history = emptyHistory()): AuditResult {
  return auditSite({ html: fixturePage(rec, o), record: rec, profile: roofing, history, lead, now: NOW });
}

function errorsOf(a: AuditResult, check: string): string[] {
  return a.flags.filter((f) => f.check === check && f.severity === "error").map((f) => f.message);
}

test("a page built to the contract passes the audit", () => {
  for (const lead of [abcRoofing, stormRoofing]) {
    const rec = record(lead);
    const a = run(rec, {}, lead);
    assert.equal(a.pass, true, a.flags.filter((f) => f.severity === "error").map((f) => `${f.check}: ${f.message}`).join("\n"));
    assert.ok(a.score >= 80, `score ${a.score}`);
    assert.equal(a.fingerprint, rec.fingerprint);
    assert.equal(a.checks.length, 10);
  }
});

test("too similar to recent sites is flagged", () => {
  const rec = record();
  const twin = { ...rec, leadId: "fixture-other", business: "Other (fixture)", dna: { ...rec.dna, leadId: "fixture-other" } };
  const history = appendHistory(emptyHistory(), twin, { event: "select", now: NOW });
  const a = run(rec, {}, abcRoofing, history);
  assert.equal(a.pass, false);
  assert.ok(errorsOf(a, "similarity").some((m) => /identical|shares hero|only \d+ of 13/.test(m)));
});

test("a missing required module and a wrong section order are flagged", () => {
  const rec = record();
  const a = run(rec, { dropModule: "service-area" });
  assert.ok(errorsOf(a, "required-modules").some((m) => /"service-area" \(Service area\) is missing/.test(m)));
  const b = run(rec, { dropModule: rec.dna.sectionOrder[2] });
  assert.ok(errorsOf(b, "required-modules").some((m) => /sections render as/.test(m)));
});

test("forbidden patterns that dominate are flagged", () => {
  const rec = record();
  const a = run(rec, {
    extraCss: [
      ".btn{border-radius:999px}.cta-button{border-radius:9999px}",
      ".hero-glow{background:radial-gradient(circle,#7c3aed,#2563eb)}",
      ".panel{backdrop-filter:blur(12px)}",
      ".bg{background:linear-gradient(90deg,#6d28d9,#2563eb)}",
      "body{font-family:Inter,sans-serif}",
    ].join("\n"),
    extraBody: `<div class="features">${[1, 2, 3].map((i) => `<div class="feature-card"><h3>Feature ${i}</h3><p>Text</p></div>`).join("")}</div><div class="bento-grid"></div>`,
  });
  const msgs = errorsOf(a, "forbidden-patterns").join("\n");
  assert.match(msgs, /Pill radius/);
  assert.match(msgs, /Radial gradient/);
  assert.match(msgs, /backdrop-filter/);
  assert.match(msgs, /blue to purple gradient/);
  assert.match(msgs, /Inter is the main typeface/);
  assert.match(msgs, /Three identical feature cards/);
  assert.match(msgs, /bento grid/);
});

test("CTA architecture that does not fit the industry is flagged", () => {
  const rec = record();
  const html = fixturePage(rec).replace(new RegExp(`data-cta="${rec.dna.primaryConversion}"`, "g"), "data-cta=\"signup\"");
  const a = auditSite({ html, record: rec, profile: roofing, lead: abcRoofing, now: NOW });
  assert.ok(errorsOf(a, "cta-architecture").some((m) => /hero has no/.test(m)));
  assert.ok(a.flags.some((f) => f.check === "cta-architecture" && /"signup" is not a conversion Roofing uses/.test(f.message)));
});

test("a page that ignores its DNA is flagged", () => {
  const rec = record();
  const wrongGeometry = rec.dna.geometry === "square" || rec.dna.geometry === "architectural" ? "24px" : "0px";
  const a = run(rec, { extraCss: `:root{--radius-control:${wrongGeometry};--font-display:"Inter", sans-serif}.x{transition:opacity 3s}` });
  const msgs = errorsOf(a, "dna-fidelity").join("\n");
  assert.match(msgs, /--radius-control is/);
  assert.match(msgs, /--font-display is/);
  assert.match(msgs, /3000ms transition or animation exceeds/);
  const b = run(rec, { rootAttrs: " data-dna=\"dna-00000000\"" });
  assert.ok(errorsOf(b, "dna-fidelity").some((m) => /data-dna="dna-00000000" but its Site DNA fingerprint/.test(m)));
  assert.ok(errorsOf(b, "dna-fidelity").some((m) => /missing data-dna-hero/.test(m)));
  const c = run(rec, { rootAttrs: "" });
  assert.ok(errorsOf(c, "dna-fidelity").some((m) => /no data-dna root marker/.test(m)));
});

test("fabricated trust signals are flagged through the demo guardrails", () => {
  const rec = record();
  const a = run(rec, { extraBody: "<p>Licensed and insured, family owned since 1998. Rated 5.0 from 900 Google reviews.</p>" });
  const msgs = errorsOf(a, "fabricated-trust").join("\n");
  assert.match(msgs, /Unbacked claim "Licensed"/i);
  assert.match(msgs, /since 1998/);
  assert.match(msgs, /900/);
  const html = fixturePage(rec).replace(/<div data-module="coverage-terms" data-placeholder="owner-to-confirm">/, "<div data-module=\"coverage-terms\">");
  const b = auditSite({ html, record: rec, profile: roofing, lead: abcRoofing, now: NOW });
  assert.ok(errorsOf(b, "fabricated-trust").some((m) => /"warranty" module must render as a labelled owner-to-confirm placeholder/.test(m)));
});

test("responsive and accessibility fundamentals are flagged", () => {
  const rec = record();
  const a = run(rec, { viewport: false, lang: false, extraCss: ".wrap{width:1200px}", extraBody: "<input name=\"loose\" type=\"text\"><img src=\"x.jpg\"><h4>Skip</h4>" });
  assert.ok(errorsOf(a, "responsive").some((m) => /no <meta name="viewport"/.test(m)));
  assert.ok(errorsOf(a, "responsive").some((m) => /Fixed widths wider than a phone/.test(m)));
  const acc = errorsOf(a, "accessibility").join("\n");
  assert.match(acc, /no lang attribute/);
  assert.match(acc, /no label \(first: loose\)/);
  assert.match(acc, /no alt attribute/);
  assert.ok(a.flags.some((f) => /jumps from h2 to h4/.test(f.message)));
  const low = run(rec, { extraCss: ":root{--ink:#777777;--bg:#888888}" });
  assert.ok(errorsOf(low, "accessibility").some((m) => /below WCAG AA/.test(m)));
  const noFocus = auditSite({ html: fixturePage(rec).replace(/:focus-visible/g, ":hover"), record: rec, profile: roofing, lead: abcRoofing, now: NOW });
  assert.ok(errorsOf(noFocus, "accessibility").some((m) => /No :focus-visible style/.test(m)));
});

test("an unmodified component library look is flagged", () => {
  const rec = record();
  const a = run(rec, { extraBody: "<div class=\"rounded-lg border bg-card text-card-foreground shadow-sm\" data-slot=\"card\"><p class=\"text-muted-foreground\">x</p></div>" });
  assert.ok(errorsOf(a, "component-library-look").some((m) => /unmodified component library demo/.test(m)));
});

test("the score drops 15 per error and 5 per warning", () => {
  const rec = record();
  const a = run(rec, { viewport: false });
  const errors = a.flags.filter((f) => f.severity === "error").length;
  const warnings = a.flags.length - errors;
  assert.equal(a.score, Math.max(0, 100 - errors * 15 - warnings * 5));
});
