// v2 infrastructure: the HistoryRepository seam (JSON file and memory, never a path), the
// visual similarity provider seam of the audit, the optional DNA treatments and trust signals,
// the v2 dialect vocabulary, the v2 repair order, and the dna and build command line tools.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { LeadRecord, SiteDnaRecord } from "../src/design-intelligence/schema.ts";
import { COMPONENT_DIALECTS, TREATMENT_AXES } from "../src/design-intelligence/schema.ts";
import { auditSite, auditSiteWithVisual, noopVisualSimilarity } from "../src/design-intelligence/audit.ts";
import type { VisualSimilarityProvider } from "../src/design-intelligence/audit.ts";
import { dialectParts, isDialectId } from "../src/design-intelligence/component-dialects.ts";
import { emptyHistory, jsonHistoryRepository, loadHistory, memoryHistoryRepository, toHistoryFile } from "../src/design-intelligence/history.ts";
import type { HistorySource } from "../src/design-intelligence/history.ts";
import { validateIndustryProfile } from "../src/design-intelligence/industries.ts";
import { roofing } from "../src/design-intelligence/industries/roofing.ts";
import { LAST_RESORT_AXES, REPAIR_ORDER, selectSiteDna } from "../src/design-intelligence/select-site-dna.ts";
import { createEngine } from "../src/design-intelligence/index.ts";
import { parseDnaArgs, readRecord, runDna } from "../src/cli/dna.js";
import { formatBuildReport, parseBuildArgs, runBuild } from "../src/cli/build.js";
import { abcRoofing, engineData, NOW, pilatesStudio, roofingBatch, stormRoofing } from "./di-fixtures.ts";
import { fixturePage } from "./di-page.ts";

function tmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kija-di-v2-"));
}

function select(lead: LeadRecord, history?: HistorySource): SiteDnaRecord {
  const r = selectSiteDna(lead, engineData(), { now: NOW, history });
  assert.ok(r.ok && r.record, r.errors.join(" "));
  return r.record as SiteDnaRecord;
}

function memoryStore(leads: LeadRecord[]) {
  const state = { leads: structuredClone(leads) };
  return {
    state,
    load: () => ({ leads: structuredClone(state.leads) }),
    saveLeads: (next: LeadRecord[]) => {
      state.leads = structuredClone(next);
    },
  };
}

test("the history repository answers v2's queries and keeps at least 50", () => {
  const dir = tmp();
  const file = path.join(dir, "data", "site-dna-history.json");
  const json = jsonHistoryRepository(file);
  const memory = memoryHistoryRepository();
  for (const repo of [json, memory]) {
    for (const lead of [...roofingBatch(3), pilatesStudio]) repo.append(select(lead, repo), { event: "select", now: NOW });
    assert.equal(repo.all().length, 4);
    assert.deepEqual(repo.recent(2).map((e) => e.leadId), ["fixture-roofer-3-dallas-tx", pilatesStudio.id]);
    assert.equal(repo.byIndustry("roofing").length, 3);
    assert.equal(repo.byIndustry("roofing", 2).length, 2);
    const archetype = repo.all()[0].archetype;
    assert.ok(repo.byArchetype(archetype).every((e) => e.archetype === archetype));
    assert.equal(repo.latestPerLead().length, 4);
    assert.equal(repo.snapshot().entries.length, 4);
  }
  // The JSON repository writes through; the memory one never touches disk.
  assert.equal(loadHistory(file).entries.length, 4);
  assert.equal(json.kind, "json-file");
  assert.equal(memory.kind, "memory");
  // The cap never drops below 50.
  const big = memoryHistoryRepository(emptyHistory(10));
  const rec = select(abcRoofing);
  for (let i = 0; i < 60; i += 1) big.append({ ...rec, leadId: `x-${i}` }, { event: "build", now: NOW });
  assert.equal(big.all().length, 50);
  // The comparison engine never takes a path.
  assert.throws(() => toHistoryFile(file as unknown as HistorySource), /never a file path/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("the repair order is v2's and the palette never moves alone", () => {
  assert.deepEqual([...REPAIR_ORDER], ["hero", "typography", "sectionOrder", "layoutRhythm", "geometry", "imagery", "componentDialect", "navigation"]);
  assert.equal(LAST_RESORT_AXES[LAST_RESORT_AXES.length - 1], "paletteFamily");
  const first = select(abcRoofing);
  const twin = { ...abcRoofing, id: "fixture-abc-twin-2", business: "ABC Twin (fixture)" };
  const repo = memoryHistoryRepository();
  repo.append(first, { event: "select", now: NOW });
  const r = select(twin, repo);
  assert.ok(r.variation.valid);
  const steps = r.variation.repairs.join(" ");
  assert.ok(!/palette/i.test(steps) || /last resort/i.test(steps));
});

test("the DNA carries v2's optional treatments, trust signals and always a sub-industry", () => {
  const r = select(abcRoofing);
  const archetype = roofing.archetypes.find((a) => a.id === r.dna.archetype);
  assert.ok(archetype?.treatments);
  for (const t of TREATMENT_AXES) {
    const allowed = (archetype.treatments[t.list] || roofing.treatments?.[t.list]) as readonly string[] | undefined;
    const value = (r.dna as unknown as Record<string, unknown>)[t.field];
    if (allowed) assert.ok(allowed.includes(String(value)), `${t.field} ${String(value)}`);
  }
  assert.equal(r.dna.localBusinessStrategy, "service-area");
  assert.equal(r.dna.mobilePriority, "form-first", "the mobile priority follows the estimate conversion");
  assert.equal(select(stormRoofing).dna.mobilePriority, "call-first");
  assert.deepEqual(r.dna.trustSignals, roofing.preferredTrustSignals);
  assert.equal(r.dna.conversionSecondary, r.dna.secondaryConversion);
  assert.ok(r.truth.trustSignals && r.truth.trustSignals.length === roofing.preferredTrustSignals?.length);
  const override = selectSiteDna(abcRoofing, engineData(), { now: NOW, override: { by: "Jamey", fields: { industry: "pilates-fixture" } } });
  assert.ok(override.ok && override.record);
  assert.equal(override.record.dna.subIndustry, "pilates", "an overridden industry gets one of its own sub-industries");
  assert.ok(override.warnings.some((w) => /sub-industry "roofing" comes from the lead's category/.test(w)));
});

test("component dialects are the sixteen v2 dialects or a compound of two", () => {
  assert.equal(COMPONENT_DIALECTS.length, 16);
  assert.deepEqual(dialectParts("editorial-luxury"), ["editorial", "luxury"]);
  assert.deepEqual(dialectParts("warm-local-boutique"), ["warm-local", "boutique"]);
  assert.deepEqual(dialectParts("warm-local"), ["warm-local"]);
  assert.equal(isDialectId("shadcn-default"), false);
  const bad = { ...roofing, archetypes: roofing.archetypes.map((a, i) => (i === 0 ? { ...a, componentDialects: ["glassy"] } : a)) };
  const check = validateIndustryProfile(bad);
  assert.equal(check.ok, false);
  assert.match(check.errors.join(" "), /component dialect "glassy", which is not one of the v2 dialects/);
  const badTreatment = { ...roofing, treatments: { buttonTreatments: ["wobbly"] } } as unknown;
  assert.match(validateIndustryProfile(badTreatment).errors.join(" "), /treatments\.buttonTreatments has "wobbly"/);
});

test("the audit exposes a visual similarity provider, a no op by default", async () => {
  const rec = select(abcRoofing);
  const html = fixturePage(rec);
  const plain = auditSite({ html, record: rec, profile: roofing, lead: abcRoofing, now: NOW });
  assert.equal(plain.visual?.ran, false);
  assert.match(plain.visual?.note || "", /No visual similarity provider is configured/);
  for (const k of ["pass", "warnings", "failures", "similarityIssues", "requiredFixes"] as const) assert.ok(k in plain, k);
  const viaNoop = await auditSiteWithVisual({ html, record: rec, profile: roofing, lead: abcRoofing, now: NOW, visual: noopVisualSimilarity });
  assert.equal(viaNoop.pass, plain.pass);
  const history = memoryHistoryRepository();
  history.append(select(stormRoofing), { event: "select", now: NOW });
  const fake: VisualSimilarityProvider = {
    id: "fake-hash",
    kind: "image-hash",
    threshold: 0.9,
    available: () => true,
    compare: (input) => input.previous.map((p) => ({ leadId: p.leadId, business: p.business, similarity: 0.95, note: "same hero crop" })),
  };
  const flagged = await auditSiteWithVisual({ html, record: rec, profile: roofing, lead: abcRoofing, now: NOW, history, visual: fake });
  assert.equal(flagged.visual?.ran, true);
  assert.equal(flagged.pass, false);
  assert.ok(flagged.similarityIssues.some((m) => /visually very similar to Example Storm Roofing \(fixture\) \(image-hash similarity 0\.95/.test(m)));
});

test("npm run dna takes --regenerate, --explore and --set with readable errors", async () => {
  const set = parseDnaArgs(["--id", "x", "--set", "hero=asymmetric", "--set", "sectionOrder=hero, services,contact"]);
  assert.deepEqual(set.errors, []);
  assert.deepEqual(set.set, { hero: "asymmetric", sectionOrder: ["hero", "services", "contact"] });
  assert.match(parseDnaArgs(["--id", "x", "--set", "colour=red"]).errors[0], /--set cannot change "colour"/);
  assert.match(parseDnaArgs(["--all", "--set", "hero=asymmetric"]).errors.join(" "), /--set overrides one lead/);
  assert.match(parseDnaArgs(["--id", "x", "--regenerate", "--explore"]).errors.join(" "), /Pick one of --regenerate, --explore or --set/);

  const root = tmp();
  const engine = await createEngine();
  const store = memoryStore([abcRoofing]);
  const history = memoryHistoryRepository();
  const base = { mode: "id", value: abcRoofing.id, unlock: false, lock: false, dryRun: false };
  const first = await runDna({ root, store, selection: base, now: NOW, engine, history });
  assert.ok(first.ok);
  const before = readRecord(root, abcRoofing.id) as SiteDnaRecord;
  const regen = await runDna({ root, store, selection: { ...base, regenerate: true }, now: NOW, engine, history });
  assert.ok(regen.ok, regen.failed.map((f: { errors: string[] }) => f.errors.join(" ")).join(" "));
  const after = readRecord(root, abcRoofing.id) as SiteDnaRecord;
  assert.notEqual(after.fingerprint, before.fingerprint);
  assert.equal(history.all()[history.all().length - 1].event, "regenerate");
  const over = await runDna({ root, store, selection: { ...base, set: { hero: "asymmetric", archetype: "premium-residential" } }, now: NOW, engine, history });
  assert.ok(over.ok, over.failed.map((f: { errors: string[] }) => f.errors.join(" ")).join(" "));
  assert.equal((readRecord(root, abcRoofing.id) as SiteDnaRecord).dna.hero, "asymmetric");
  assert.equal(history.all()[history.all().length - 1].event, "override");
  fs.rmSync(root, { recursive: true, force: true });
});

test("npm run build runs its steps in order and reports each one", async () => {
  assert.deepEqual(parseBuildArgs(["--skip", "demos,typecheck"]).skip, ["demos", "typecheck"]);
  assert.match(parseBuildArgs(["--skip", "deploy"]).errors[0], /"deploy", which is not a step/);
  const root = tmp();
  const engine = await createEngine();
  const store = memoryStore([abcRoofing, stormRoofing]);
  const report = await runBuild({ root, skip: ["demos", "pitches", "audit", "check", "typecheck"], now: NOW, store, engine });
  assert.deepEqual(report.steps.map((s: { name: string }) => s.name), ["dna", "briefs", "demos", "pitches", "audit", "check", "typecheck"]);
  assert.ok(report.ok, formatBuildReport(report));
  assert.ok(fs.existsSync(path.join(root, "demos", abcRoofing.id, "BRIEF.md")));
  assert.ok(fs.existsSync(path.join(root, "data", "site-dna-history.json")));
  assert.match(formatBuildReport(report), /Build passed\. Everything stays on this machine/);
  fs.rmSync(root, { recursive: true, force: true });
});
