import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createStore, emptyBenchmarks, BACKUPS_KEPT } from "../src/lib/store.js";

const PROJECT = new URL("../", import.meta.url);

function tempRoot({ config = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kija-store-"));
  if (config) {
    fs.mkdirSync(path.join(root, "config"));
    for (const f of ["settings.json", "categories.json", "geography.json", "chains.json"]) {
      fs.copyFileSync(new URL(`config/${f}`, PROJECT), path.join(root, "config", f));
    }
  }
  return root;
}

// A clock that moves one second per call, so every backup gets its own timestamp.
function steppingClock(start = Date.UTC(2026, 8, 28, 12, 0, 0)) {
  let t = start;
  return () => new Date((t += 1000));
}

function backups(root, prefix) {
  const dir = path.join(root, "data", "backups");
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.startsWith(`${prefix}-`)).sort() : [];
}

test("load tolerates missing data files and a missing benchmarks.json", () => {
  const root = tempRoot();
  fs.rmSync(path.join(root, "config", "chains.json"));
  const s = createStore(root).load();
  assert.deepEqual(s.leads, []);
  assert.deepEqual(s.queue, []);
  assert.deepEqual(s.rejected, []);
  assert.deepEqual(s.benchmarks, emptyBenchmarks());
  assert.deepEqual(s.chains, { names: [], allow: [] });
  assert.equal(s.settings.weeklyQuota, 10);
  assert.ok(s.categories["auto-repair"]);
  assert.ok(s.geography.metros.length > 0);
});

test("load explains a missing settings file or invalid JSON", () => {
  const bare = tempRoot({ config: false });
  assert.throws(() => createStore(bare).load(), /config\/settings\.json is missing/);
  const root = tempRoot();
  fs.mkdirSync(path.join(root, "data"));
  fs.writeFileSync(path.join(root, "data", "leads.json"), "[ not json");
  assert.throws(() => createStore(root).load(), /data\/leads\.json is not valid JSON/);
});

test("saves are atomic, sorted, 2 space JSON with a trailing newline", () => {
  const root = tempRoot();
  const store = createStore(root, { now: steppingClock() });
  const leads = [
    { id: "b-shop", addedAt: "2026-09-28" },
    { id: "a-shop", addedAt: "2026-09-28" },
    { id: "z-shop", addedAt: "2026-09-26" },
  ];
  const r = store.saveLeads(leads);
  assert.equal(r.written, true);
  assert.equal(r.backup, null, "nothing to back up on the first write");
  const text = fs.readFileSync(path.join(root, "data", "leads.json"), "utf8");
  assert.ok(text.endsWith("]\n"));
  assert.ok(text.includes("\n  {\n    \"id\": \"z-shop\""));
  assert.deepEqual(JSON.parse(text).map((l) => l.id), ["z-shop", "a-shop", "b-shop"]);
  assert.deepEqual(leads.map((l) => l.id), ["b-shop", "a-shop", "z-shop"], "the caller's array is not reordered");
  assert.deepEqual(fs.readdirSync(path.join(root, "data")).filter((f) => f.endsWith(".tmp")), [], "no temp files are left behind");
  assert.throws(() => store.saveLeads({}), /leads must be an array/);
});

test("each overwrite backs up the previous file, identical writes are skipped", () => {
  const root = tempRoot();
  const store = createStore(root, { now: steppingClock() });
  store.saveQueue([{ id: "one", addedAt: "2026-09-26" }]);
  const second = store.saveQueue([{ id: "one", addedAt: "2026-09-26" }, { id: "two", addedAt: "2026-09-27" }]);
  assert.equal(second.written, true);
  assert.ok(second.backup.endsWith(".json"));
  assert.match(path.basename(second.backup), /^queue-2026-09-28T12-00-\d{2}-000Z\.json$/);
  assert.deepEqual(JSON.parse(fs.readFileSync(second.backup, "utf8")), [{ id: "one", addedAt: "2026-09-26" }], "the backup holds the previous content");
  const same = store.saveQueue([{ id: "two", addedAt: "2026-09-27" }, { id: "one", addedAt: "2026-09-26" }]);
  assert.equal(same.written, false, "same content after sorting is not rewritten");
  assert.equal(backups(root, "queue").length, 1);
});

test("backups keep the newest 30 per file and leave other files alone", () => {
  const root = tempRoot();
  const store = createStore(root, { now: steppingClock() });
  store.saveRejected([]);
  store.saveSettings({ ...store.load().settings, weeklyQuota: 11 });
  for (let i = 0; i < BACKUPS_KEPT + 6; i += 1) {
    store.saveLeads([{ id: `lead-${String(i).padStart(2, "0")}`, addedAt: "2026-09-28" }]);
  }
  const kept = backups(root, "leads");
  assert.equal(kept.length, BACKUPS_KEPT);
  // The oldest surviving backup holds lead-05: backups of lead-00 to lead-04 were pruned.
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, "data", "backups", kept[0]), "utf8"))[0].id, "lead-05");
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, "data", "backups", kept.at(-1)), "utf8"))[0].id, `lead-${BACKUPS_KEPT + 4}`);
  assert.equal(backups(root, "settings").length, 1, "settings has its own backup");
  assert.equal(backups(root, "rejected").length, 0);
});

test("same second backups get a counter instead of overwriting", () => {
  const root = tempRoot();
  const frozen = () => new Date("2026-09-28T12:00:00.000Z");
  const store = createStore(root, { now: frozen });
  store.saveLeads([{ id: "a", addedAt: "2026-09-28" }]);
  store.saveLeads([{ id: "b", addedAt: "2026-09-28" }]);
  store.saveLeads([{ id: "c", addedAt: "2026-09-28" }]);
  assert.deepEqual(backups(root, "leads"), ["leads-2026-09-28T12-00-00-000Z-1.json", "leads-2026-09-28T12-00-00-000Z.json"]);
});

test("runs are saved by runId and listed newest first", () => {
  const root = tempRoot();
  const store = createStore(root, { now: steppingClock() });
  store.saveRun({ runId: "2026-09-28", ingestedAt: "2026-09-28T13:00:00.000Z", counts: {} });
  store.saveRun({ runId: "2026-10-05", ingestedAt: "2026-10-05T13:00:00.000Z", counts: {} });
  fs.writeFileSync(path.join(root, "data", "runs", "broken.json"), "{");
  assert.deepEqual(store.listRuns().map((r) => r.runId), ["2026-10-05", "2026-09-28"], "unreadable reports are skipped");
  assert.equal(store.readRun("2026-09-28").ingestedAt, "2026-09-28T13:00:00.000Z");
  assert.equal(store.readRun("2026-12-28"), null);
  assert.throws(() => store.saveRun({ runId: "../escape" }), /not a safe file name/);
  assert.deepEqual(createStore(tempRoot()).listRuns(), []);
});

test("writeJson refuses paths outside the project and updateLeads reads fresh", () => {
  const root = tempRoot();
  const store = createStore(root, { now: steppingClock() });
  assert.throws(() => store.writeJson("../outside.json", {}), /outside the project/);
  store.saveLeads([{ id: "a", addedAt: "2026-09-28", outreach: { status: "New" } }]);
  const next = store.updateLeads((leads) => {
    leads[0].outreach.status = "Research";
    return leads;
  });
  assert.equal(next[0].outreach.status, "Research");
  assert.equal(store.load().leads[0].outreach.status, "Research");
  store.saveBenchmarks({ updatedAt: "2026-09-28", categories: {} });
  assert.equal(store.load().benchmarks.updatedAt, "2026-09-28");
});
