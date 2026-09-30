// Command line tools of the engine, against a temp root and an in-memory store: npm run dna
// (select, persist, lock, keep locked), npm run brief, npm run audit, and the typecheck and lint
// tool resolution. Nothing touches the real data/ or demos/.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { LeadRecord, SiteDnaRecord } from "../src/design-intelligence/schema.ts";
import { createEngine, loadHistory, LOCKED_AXES } from "../src/design-intelligence/index.ts";
import { formatDnaReport, parseDnaArgs, readRecord, runDna } from "../src/cli/dna.js";
import { runBrief, stockAssetsFor } from "../src/cli/brief.js";
import { runAudit } from "../src/cli/audit.js";
import { toolDirs, typecheck } from "../src/cli/typecheck.js";
import { abcRoofing, NOW, stormRoofing } from "./di-fixtures.ts";
import { fixturePage } from "./di-page.ts";

function memoryStore(leads: LeadRecord[]) {
  const state = { leads: structuredClone(leads), saved: 0 };
  return {
    state,
    load: () => ({ leads: structuredClone(state.leads) }),
    saveLeads: (next: LeadRecord[]) => {
      state.leads = structuredClone(next);
      state.saved += 1;
    },
  };
}

function tmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kija-di-cli-"));
}

test("npm run dna arguments are parsed with readable errors", () => {
  assert.deepEqual(parseDnaArgs([]).errors, ["Pick --id <id> or --all."]);
  assert.ok(parseDnaArgs(["--id"]).errors.includes("--id needs a value."));
  assert.ok(parseDnaArgs(["--all", "--lock", "--unlock"]).errors.some((e) => /cannot be combined/.test(e)));
  const ok = parseDnaArgs(["--all", "--lock", "--by", "Kiel"]);
  assert.deepEqual([ok.mode, ok.lock, ok.by, ok.errors.length], ["all", true, "Kiel", 0]);
});

test("npm run dna writes SITE_DNA.json, lead.demo.dna and history, and keeps locked DNA", async () => {
  const root = tmp();
  const engine = await createEngine();
  const store = memoryStore([abcRoofing, stormRoofing]);
  const first = await runDna({ root, store, selection: { mode: "all", unlock: false, lock: false, dryRun: false }, now: NOW, engine });
  assert.ok(first.ok, first.failed.map((f: { errors: string[] }) => f.errors.join(" ")).join("\n"));
  assert.equal(first.done.length, 2);
  const rec = readRecord(root, abcRoofing.id) as SiteDnaRecord;
  assert.equal(rec.leadId, abcRoofing.id);
  const snap = (store.state.leads[0].demo as Record<string, unknown>).dna as { fingerprint: string; locked: boolean };
  assert.equal(snap.fingerprint, rec.fingerprint);
  assert.equal(snap.locked, false);
  assert.equal(loadHistory(path.join(root, "data", "site-dna-history.json")).entries.length, 2);
  assert.match(formatDnaReport(first, { dryRun: false }), /Site DNA: 2 produced, 0 failed/);

  const locked = await runDna({ root, store, selection: { mode: "id", value: abcRoofing.id, unlock: false, lock: true, by: "Jamey", dryRun: false }, now: NOW, engine });
  assert.ok(locked.done[0].locked);
  const lockedRec = readRecord(root, abcRoofing.id) as SiteDnaRecord;
  assert.equal(lockedRec.lockedBy, "Jamey");

  // A changed concept line would change the DNA, but the lock holds it.
  store.state.leads[0].demoConcept = "Bold storm response site with an emergency call CTA and crew photos.";
  store.state.leads[0].pitchAngle = "Hardworking local crew; make the call one tap.";
  store.state.leads[0].reviewThemes = [];
  const again = await runDna({ root, store, selection: { mode: "id", value: abcRoofing.id, unlock: false, lock: false, dryRun: false }, now: "2026-10-01T00:00:00.000Z", engine });
  assert.ok(again.done[0].reused);
  const keptRec = readRecord(root, abcRoofing.id) as SiteDnaRecord;
  assert.equal(keptRec.fingerprint, lockedRec.fingerprint);
  for (const k of LOCKED_AXES) assert.deepEqual(keptRec.dna[k], lockedRec.dna[k], k);
  assert.equal(keptRec.locked, true);
  const unlocked = await runDna({ root, store, selection: { mode: "id", value: abcRoofing.id, unlock: true, lock: false, dryRun: false }, now: "2026-10-01T00:00:00.000Z", engine });
  assert.equal(unlocked.done[0].locked, false);
  assert.equal(unlocked.done[0].reused, false);
  assert.notEqual(unlocked.done[0].record.dna.archetype, lockedRec.dna.archetype, "unlocking lets the new wording choose again");
  fs.rmSync(root, { recursive: true, force: true });
});

test("npm run brief writes BRIEF.md and SITE_DNA.json for one lead", async () => {
  const root = tmp();
  const engine = await createEngine();
  const store = memoryStore([abcRoofing]);
  const report = await runBrief({ root, store, id: abcRoofing.id, now: NOW, engine });
  assert.ok(report.ok, report.errors.join("\n"));
  const md = fs.readFileSync(path.join(root, "demos", abcRoofing.id, "BRIEF.md"), "utf8");
  assert.match(md, /^# Frontend generation brief: ABC Roofing \(fixture\)/);
  assert.match(md, /RECENT ROOFING WEBSITE DNA/);
  assert.ok(fs.existsSync(path.join(root, "demos", abcRoofing.id, "SITE_DNA.json")));
  const assets = stockAssetsFor(abcRoofing, engine.categories);
  assert.ok(assets.every((a: { id: string; caption: string }) => /roof/.test(a.id) && /Stock placeholder/.test(a.caption)), "only roofing photos, captioned as placeholders");
  fs.rmSync(root, { recursive: true, force: true });
});

test("npm run audit stores the result and skips leads without a page", async () => {
  const root = tmp();
  const engine = await createEngine();
  const store = memoryStore([abcRoofing, stormRoofing]);
  await runDna({ root, store, selection: { mode: "all", unlock: false, lock: false, dryRun: false }, now: NOW, engine });
  const rec = readRecord(root, abcRoofing.id) as SiteDnaRecord;
  fs.writeFileSync(path.join(root, "demos", abcRoofing.id, "index.html"), fixturePage(rec));
  const report = await runAudit({ root, store, selection: { mode: "all" }, now: NOW, engine });
  assert.equal(report.audited.length, 1);
  assert.equal(report.audited[0].audit.pass, true, report.audited[0].audit.flags.map((f: { message: string }) => f.message).join("\n"));
  assert.match(report.skipped[0].reason, /No demos\/<id>\/index\.html/);
  assert.equal((readRecord(root, abcRoofing.id) as SiteDnaRecord).audit?.pass, true);
  const snap = (store.state.leads.find((l) => l.id === abcRoofing.id)?.demo as Record<string, { auditPass: boolean }>).dna;
  assert.equal(snap.auditPass, true);
  fs.rmSync(root, { recursive: true, force: true });
});

test("typecheck says clearly when TypeScript is not found instead of passing", () => {
  const root = tmp();
  assert.deepEqual(toolDirs(root, {}), []);
  const r = typecheck({ root, env: {}, stdio: "pipe" });
  assert.equal(r.ok, false);
  assert.equal(r.ran, false);
  assert.match(r.message, /Typecheck did not run: TypeScript was not found/);
  fs.rmSync(root, { recursive: true, force: true });
});
