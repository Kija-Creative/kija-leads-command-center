// The renderer contract: the module plan places every required module deterministically, the
// coverage check names what a renderer lacks, and the markers round trip through the audit.
import assert from "node:assert/strict";
import test from "node:test";
import type { SiteDnaRecord } from "../src/design-intelligence/schema.ts";
import { dnaAttributes, dnaRootCss, moduleAttributes, moduleFromMarker, moduleMarker } from "../src/design-intelligence/markers.ts";
import { coverageErrors, modulePlan, themeFor } from "../src/design-intelligence/renderer-contract.ts";
import { selectSiteDna } from "../src/design-intelligence/select-site-dna.ts";
import { dnaFingerprint } from "../src/design-intelligence/variation.ts";
import { abcRoofing, engineData, NOW } from "./di-fixtures.ts";

function record(): SiteDnaRecord {
  return selectSiteDna(abcRoofing, engineData(), { now: NOW }).record as SiteDnaRecord;
}

test("the module plan puts every required module somewhere, once", () => {
  const rec = record();
  const plan = modulePlan(rec.dna);
  assert.deepEqual(plan.sections.map((s) => s.key), rec.dna.sectionOrder);
  assert.deepEqual(plan.header, ["phone-cta"]);
  const placed = [...plan.header, ...plan.sections.flatMap((s) => [s.key, ...s.embedded])];
  for (const m of rec.dna.requiredModules) assert.equal(placed.filter((p) => p === m).length, 1, m);
  const closer = plan.sections.find((s) => s.embedded.includes("estimate-form"));
  assert.ok(closer && ["consultation", "estimate"].includes(closer.key));
});

test("the coverage check names every missing module and axis implementation", () => {
  const rec = record();
  const errors = coverageErrors(rec.dna, {}, {});
  assert.ok(errors.includes("The renderer has no module \"hero\"."));
  assert.ok(errors.includes(`The renderer has no hero implementation for "${rec.dna.hero}".`));
  assert.ok(errors.includes(`The renderer has no motion implementation for "${rec.dna.motion}".`));
});

test("markers carry the DNA and hide claim words from the guardrail", () => {
  const rec = record();
  const attrs = dnaAttributes(rec.dna);
  assert.ok(attrs.includes(`data-dna="${dnaFingerprint(rec.dna)}"`));
  assert.ok(attrs.includes(`data-dna-hero="${rec.dna.hero}"`));
  assert.equal(moduleAttributes(["services", "warranty"], 3), " data-module=\"services coverage-terms\" data-section=\"3\"");
  assert.equal(moduleFromMarker(moduleMarker("financing")), "financing");
  const css = dnaRootCss(rec.dna);
  assert.match(css, /--radius-control:/);
  assert.match(css, new RegExp(`--font-display:"${rec.dna.fontPairing?.display.family}"`));
  assert.equal(themeFor(rec.dna).palette.family, rec.dna.paletteFamily);
});
