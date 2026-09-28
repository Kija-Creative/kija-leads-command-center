import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { main as seedMain } from "../src/cli/import-seed.js";
import { main as planMain } from "../src/cli/plan.js";
import { main as ingestMain } from "../src/cli/ingest.js";
import { main as exportMain } from "../src/cli/export-csv.js";
import { main as checkMain, checkDemos, checkPitches } from "../src/cli/check.js";

const PROJECT = new URL("../", import.meta.url);
const EM = String.fromCharCode(0x2014);

function tempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kija-cli-"));
  for (const dir of ["config", "seed", "data"]) fs.mkdirSync(path.join(root, dir));
  for (const f of ["settings.json", "categories.json", "geography.json", "chains.json"]) {
    fs.copyFileSync(new URL(`config/${f}`, PROJECT), path.join(root, "config", f));
  }
  fs.copyFileSync(new URL("seed/sheet-2026-09-28.json", PROJECT), path.join(root, "seed", "sheet-2026-09-28.json"));
  return root;
}

function capture() {
  const chunks = { out: "", err: "" };
  return {
    chunks,
    deps: (extra = {}) => ({
      stdout: { write: (s) => { chunks.out += s; } },
      stderr: { write: (s) => { chunks.err += s; } },
      ...extra,
    }),
  };
}

const readJson = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));

test("seed builds the data files once and refuses to overwrite without --force", async () => {
  const root = tempProject();
  const c = capture();
  assert.equal(await seedMain([], c.deps({ root, now: "2026-09-28T12:00:00.000Z" })), 0, c.chunks.err);
  assert.equal(readJson(root, "data/leads.json").length, 20);
  assert.equal(readJson(root, "data/queue.json").length, 5);
  assert.deepEqual(readJson(root, "data/rejected.json"), []);
  const bench = readJson(root, "data/benchmarks.json");
  assert.equal(bench.categories.hvac.notes, "Placeholder, not researched");
  assert.equal(bench.updatedAt, "2026-09-28");

  const again = capture();
  assert.equal(await seedMain([], again.deps({ root })), 1);
  assert.match(again.chunks.err, /already has 20 leads/);

  // Researched benchmarks survive a forced re-seed.
  bench.categories.hvac.ticket.sources.push({ title: "Survey", url: "https://example.org/s", year: 2026, note: "" });
  fs.writeFileSync(path.join(root, "data", "benchmarks.json"), JSON.stringify(bench, null, 2));
  const forced = capture();
  assert.equal(await seedMain(["--force"], forced.deps({ root, now: "2026-09-29T12:00:00.000Z" })), 0);
  assert.match(forced.chunks.out, /kept the existing data\/benchmarks\.json/);
  assert.equal(readJson(root, "data/benchmarks.json").categories.hvac.ticket.sources.length, 1);
  assert.ok(fs.readdirSync(path.join(root, "data", "backups")).some((f) => f.startsWith("leads-")), "the forced seed backed up the old leads");
});

test("check passes on seeded data, fails on a dash, and treats missing guardrails as a warning", async () => {
  const root = tempProject();
  await seedMain([], capture().deps({ root, now: "2026-09-28T12:00:00.000Z" }));
  const ok = capture();
  assert.equal(await checkMain([], ok.deps({ root, now: "2026-09-28T12:00:00.000Z" })), 0, ok.chunks.out);
  assert.match(ok.chunks.out, /Check passed/);

  // A demo with no loadable guardrails module is skipped with a warning, not a failure.
  fs.mkdirSync(path.join(root, "demos", "gm-auto-care-dallas-tx"), { recursive: true });
  fs.writeFileSync(path.join(root, "demos", "gm-auto-care-dallas-tx", "index.html"), "<!doctype html><title>x</title>");
  const missing = capture();
  const code = await checkMain([], missing.deps({ root, now: "2026-09-28T12:00:00.000Z", importGuardrails: async () => { throw new Error("Cannot find module"); } }));
  assert.equal(code, 0, missing.chunks.out);
  assert.match(missing.chunks.out, /could not be loaded, so 1 demo was not scanned/);

  // Guardrail errors fail the check.
  const failing = await checkDemos(root, readJson(root, "data/leads.json"), {
    importGuardrails: async () => ({ checkDemoHtml: () => ({ ok: false, errors: ["The concept ribbon is missing."], warnings: [] }) }),
  });
  assert.deepEqual(failing.errors, ["demos/gm-auto-care-dallas-tx/index.html: The concept ribbon is missing."]);
  assert.equal(failing.scanned, 1);

  fs.writeFileSync(path.join(root, "data", "inbox-note.txt"), `Rechecked Monday ${EM} fine.\n`);
  const dashed = capture();
  assert.equal(await checkMain([], dashed.deps({ root, importGuardrails: async () => ({ checkDemoHtml: () => ({ ok: true, errors: [], warnings: [] }) }) })), 1);
  assert.match(dashed.chunks.out, /data\/inbox-note\.txt:1:18 contains an em dash \(U\+2014\)/);
});

test("check runs the pitch checks over pitches/<id>/index.html", async () => {
  const root = tempProject();
  await seedMain([], capture().deps({ root, now: "2026-09-28T12:00:00.000Z" }));
  fs.mkdirSync(path.join(root, "pitches", "gm-auto-care-dallas-tx"), { recursive: true });
  fs.writeFileSync(path.join(root, "pitches", "gm-auto-care-dallas-tx", "index.html"), "<!doctype html><title>x</title>");
  const leads = readJson(root, "data/leads.json");
  const failing = await checkPitches(root, leads, readJson(root, "config/settings.json"), {
    importPitch: async () => ({ checkPitchHtml: () => ({ ok: false, errors: ["The pitch page is missing the estimates disclaimer."], warnings: [] }) }),
  });
  assert.deepEqual(failing.errors, ["pitches/gm-auto-care-dallas-tx/index.html: The pitch page is missing the estimates disclaimer."]);
  assert.equal(failing.scanned, 1);
  // The real pitch checks fail a page with no robots tag and no disclaimer.
  const c = capture();
  assert.equal(await checkMain([], c.deps({ root, now: "2026-09-28T12:00:00.000Z" })), 1);
  assert.ok(c.chunks.out.includes("pitches/gm-auto-care-dallas-tx/index.html: The pitch page is missing the noindex"), c.chunks.out);
});

test("seed installs research/benchmarks.json when it validates", async () => {
  const root = tempProject();
  fs.mkdirSync(path.join(root, "research"));
  fs.copyFileSync(new URL("research/benchmarks.json", PROJECT), path.join(root, "research", "benchmarks.json"));
  const c = capture();
  assert.equal(await seedMain([], c.deps({ root, now: "2026-09-28T12:00:00.000Z" })), 0, c.chunks.err);
  assert.ok(c.chunks.out.includes("installed research/benchmarks.json"), c.chunks.out);
  assert.deepEqual(readJson(root, "data/benchmarks.json"), readJson(root, "research/benchmarks.json"));
});

test("check reports invalid records with the file they live in", async () => {
  const root = tempProject();
  await seedMain([], capture().deps({ root, now: "2026-09-28T12:00:00.000Z" }));
  const leads = readJson(root, "data/leads.json");
  leads[0].outreach.status = "Closed";
  leads[1].id = leads[2].id;
  fs.writeFileSync(path.join(root, "data", "leads.json"), JSON.stringify(leads, null, 2));
  const c = capture();
  assert.equal(await checkMain([], c.deps({ root })), 1);
  assert.match(c.chunks.out, /data\/leads\.json: .*outreach status "Closed" is not one of/);
  assert.match(c.chunks.out, /is used by more than one lead/);
});

test("plan writes the inbox plan file for a given date", async () => {
  const root = tempProject();
  await seedMain([], capture().deps({ root, now: "2026-09-28T12:00:00.000Z" }));
  const c = capture();
  assert.equal(await planMain(["--date", "2026-10-07"], c.deps({ root, now: "2026-10-07T12:00:00.000Z" })), 0, c.chunks.err);
  const plan = readJson(root, "data/inbox/2026-10-05.plan.json");
  assert.equal(plan.runId, "2026-10-05");
  assert.equal(plan.week, "2026-W41");
  assert.equal(plan.metros[0].key, "dallas-fort-worth");
  assert.equal(plan.categoryDetails.length, plan.categories.length);
  assert.ok(plan.exclusions.includes("9726814966"));
  assert.match(c.chunks.out, /Wrote data\/inbox\/2026-10-05\.plan\.json\./);
  assert.equal(await planMain(["--date", "Oct 7"], capture().deps({ root })), 2);
});

test("ingest saves the batch once and keeps the first run report on a repeat", async () => {
  const root = tempProject();
  await seedMain([], capture().deps({ root, now: "2026-09-28T12:00:00.000Z" }));
  const batch = {
    runId: "2026-10-05",
    mode: "weekly",
    plan: { metros: ["houston"], categories: ["plumbing"] },
    searched: [{ query: "plumber houston", source: "google-maps", notes: "" }],
    leads: [{
      business: "Bayou City Plumbing Works",
      category: "Plumbing",
      categoryKey: "plumbing",
      city: "Houston",
      state: "TX",
      metro: "houston",
      phone: "713-555-0199",
      googleRating: 4.9,
      googleReviews: 140,
      websiteGap: 3,
      ticketValue: 3,
      visualFit: 2,
      websiteStatus: "No owned website surfaced.",
      confidence: "High",
      whyKija: "Emergency calls with no owned landing page.",
      pitchAngle: "Customers already trust the crew; make the emergency call one tap.",
      demoConcept: "Emergency first plumbing site.",
      sources: ["https://example.org/bayou"],
      verification: { status: "verified", checkedAt: "2026-10-05", checks: [{ check: "a", result: "b" }, { check: "c", result: "d" }, { check: "e", result: "f" }], notes: "" },
    }],
    queue: [],
    rejected: [],
    reverify: [],
    notes: "",
  };
  fs.mkdirSync(path.join(root, "data", "inbox"), { recursive: true });
  fs.writeFileSync(path.join(root, "data", "inbox", "2026-10-05.json"), JSON.stringify(batch, null, 2));

  const first = capture();
  assert.equal(await ingestMain(["data/inbox/2026-10-05.json"], first.deps({ root, now: "2026-10-05T14:00:00.000Z" })), 0, first.chunks.err);
  assert.match(first.chunks.out, /1 accepted/);
  assert.equal(readJson(root, "data/leads.json").length, 21);
  const report = readJson(root, "data/runs/2026-10-05.json");
  assert.deepEqual(report.accepted, ["bayou-city-plumbing-works-houston-tx"]);

  const second = capture();
  assert.equal(await ingestMain(["data/inbox/2026-10-05.json"], second.deps({ root, now: "2026-10-05T18:00:00.000Z" })), 0);
  assert.match(second.chunks.out, /Nothing changed, so the run report from 2026-10-05T14:00:00\.000Z was kept\./);
  assert.equal(readJson(root, "data/leads.json").length, 21);
  assert.equal(readJson(root, "data/runs/2026-10-05.json").ingestedAt, "2026-10-05T14:00:00.000Z");

  fs.writeFileSync(path.join(root, "data", "inbox", "bad.json"), JSON.stringify({ runId: "soon" }));
  const bad = capture();
  assert.equal(await ingestMain(["data/inbox/bad.json"], bad.deps({ root })), 1);
  assert.match(bad.chunks.err, /nothing was ingested/);
  assert.equal(await ingestMain([], capture().deps({ root })), 2);

  const check = capture();
  assert.equal(await checkMain([], check.deps({ root, now: "2026-10-05T18:00:00.000Z" })), 0, check.chunks.out);
});

test("export writes the dated CSV", async () => {
  const root = tempProject();
  await seedMain([], capture().deps({ root, now: "2026-09-28T12:00:00.000Z" }));
  const c = capture();
  assert.equal(await exportMain(["--date", "2026-09-28"], c.deps({ root })), 0, c.chunks.err);
  const csv = fs.readFileSync(path.join(root, "exports", "lead-pipeline-2026-09-28.csv"), "utf8");
  assert.ok(csv.startsWith("Score,Business,Category,City,"));
  assert.equal(csv.split("\r\n").length, 22);
  assert.match(c.chunks.out, /with 20 leads/);
});
