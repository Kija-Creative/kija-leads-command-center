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

test("seed writes an empty suppression list once and never replaces it", async () => {
  const root = tempProject();
  await seedMain([], capture().deps({ root, now: "2026-09-28T12:00:00.000Z" }));
  assert.deepEqual(readJson(root, "data/suppression.json"), []);
  const entry = { key: "9726814966", business: "GM AUTO CARE", city: "Dallas", state: "TX", phone: "972-681-4966", reason: "Asked not to be contacted.", addedAt: "2026-09-29T15:00:00.000Z", by: "Jamey" };
  fs.writeFileSync(path.join(root, "data", "suppression.json"), JSON.stringify([entry], null, 2));
  assert.equal(await seedMain(["--force"], capture().deps({ root, now: "2026-09-30T12:00:00.000Z" })), 0);
  assert.deepEqual(readJson(root, "data/suppression.json"), [entry], "an opt out survives a forced re-seed");
});

test("check validates the suppression list and flags a suppressed lead still in outreach", async () => {
  const root = tempProject();
  await seedMain([], capture().deps({ root, now: "2026-09-28T12:00:00.000Z" }));
  const entry = { key: "9726814966", business: "GM AUTO CARE", city: "Dallas", state: "TX", phone: "972-681-4966", reason: "Asked not to be contacted.", addedAt: "2026-09-29T15:00:00.000Z", by: "Jamey" };
  fs.writeFileSync(path.join(root, "data", "suppression.json"), JSON.stringify([entry], null, 2));
  const warned = capture();
  assert.equal(await checkMain([], warned.deps({ root, now: "2026-09-30T12:00:00.000Z" })), 0, warned.chunks.out);
  assert.match(warned.chunks.out, /GM AUTO CARE \(gm-auto-care-dallas-tx\) is suppressed but still at New/);
  fs.writeFileSync(path.join(root, "data", "suppression.json"), JSON.stringify([{ ...entry, reason: "" }], null, 2));
  const bad = capture();
  assert.equal(await checkMain([], bad.deps({ root, now: "2026-09-30T12:00:00.000Z" })), 1);
  assert.match(bad.chunks.out, /data\/suppression\.json: Suppression entry 1 \(GM AUTO CARE\) needs a reason/);
});

test("check fails a stored places-api rating and drops placesFetchedAt on the next save", async () => {
  const root = tempProject();
  await seedMain([], capture().deps({ root, now: "2026-09-28T12:00:00.000Z" }));
  const leads = readJson(root, "data/leads.json");
  assert.ok(leads.every((l) => !Object.hasOwn(l, "placesFetchedAt")), "seeded leads never carry the retired field");
  assert.ok(leads.every((l) => l.phoneLineType === "unknown" && l.placeIdCheckedAt === ""));
  leads[0].ratingSource = "places-api";
  fs.writeFileSync(path.join(root, "data", "leads.json"), JSON.stringify(leads, null, 2));
  const c = capture();
  assert.equal(await checkMain([], c.deps({ root, now: "2026-09-28T12:00:00.000Z" })), 1);
  assert.match(c.chunks.out, /ratingSource is places-api, which a stored lead may not carry/);
});

test("check warns about stale candidates files and purge-places removes them", async () => {
  const { main: purgeMain } = await import("../src/cli/purge-places.js");
  const root = tempProject();
  await seedMain([], capture().deps({ root, now: "2026-09-28T12:00:00.000Z" }));
  const inbox = path.join(root, "data", "inbox");
  fs.mkdirSync(inbox, { recursive: true });
  const write = (name, fetchedAt) => fs.writeFileSync(path.join(inbox, name), JSON.stringify({ runId: "x", fetchedAt, candidates: [] }));
  write("2026-09-21.candidates.json", "2026-09-21T10:00:00.000Z");
  write("2026-09-28.candidates.json", "2026-09-28T10:00:00.000Z");
  fs.writeFileSync(path.join(inbox, "2026-09-28.plan.json"), "{}");
  fs.writeFileSync(path.join(inbox, "broken.candidates.json"), "{");
  fs.utimesSync(path.join(inbox, "broken.candidates.json"), new Date("2026-09-20T00:00:00Z"), new Date("2026-09-20T00:00:00Z"));

  const now = "2026-09-28T18:00:00.000Z";
  const checked = capture();
  assert.equal(await checkMain([], checked.deps({ root, now })), 0, checked.chunks.out);
  assert.match(checked.chunks.out, /data\/inbox\/2026-09-21\.candidates\.json holds Places content older than 1 day\. Only place IDs may be kept; run npm run purge-places\./);
  assert.match(checked.chunks.out, /broken\.candidates\.json holds Places content/, "an unreadable file is aged by its file time");
  assert.doesNotMatch(checked.chunks.out, /2026-09-28\.candidates\.json holds/);

  const dry = capture();
  assert.equal(await purgeMain(["--older-than-days", "1", "--dry-run"], dry.deps({ root, now })), 0);
  assert.match(dry.chunks.out, /Would remove data\/inbox\/2026-09-21\.candidates\.json \(7 days old\)\./);
  assert.equal(fs.readdirSync(inbox).length, 4, "a dry run removes nothing");

  const older = capture();
  assert.equal(await purgeMain(["--older-than-days", "1"], older.deps({ root, now })), 0);
  assert.match(older.chunks.out, /Removed 2 candidates files, kept 1 newer\./);
  assert.deepEqual(fs.readdirSync(inbox).sort(), ["2026-09-28.candidates.json", "2026-09-28.plan.json"]);

  const all = capture();
  assert.equal(await purgeMain([], all.deps({ root, now })), 0);
  assert.match(all.chunks.out, /Removed data\/inbox\/2026-09-28\.candidates\.json \(under a day old\)\./);
  assert.deepEqual(fs.readdirSync(inbox), ["2026-09-28.plan.json"], "only candidates files are purged");

  const none = capture();
  assert.equal(await purgeMain([], none.deps({ root, now })), 0);
  assert.match(none.chunks.out, /nothing to purge/);
  assert.equal(await purgeMain(["--older-than-days", "soon"], capture().deps({ root })), 2);
});
