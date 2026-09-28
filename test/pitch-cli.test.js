import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { main, parseArgs, pitchPath, selectLeads } from "../src/cli/build-pitches.js";
import { BASE_SETTINGS, CATEGORIES, LEADS, PLACEHOLDER, hasDash } from "./pitch-fixtures.js";

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kija-pitch-"));
  fs.mkdirSync(path.join(root, "config"), { recursive: true });
  fs.mkdirSync(path.join(root, "data"), { recursive: true });
  const leads = structuredClone(LEADS);
  leads[0].runId = "2026-10-05";
  leads[1].runId = "2026-10-05";
  fs.writeFileSync(path.join(root, "config", "settings.json"), JSON.stringify(BASE_SETTINGS));
  fs.writeFileSync(path.join(root, "config", "categories.json"), JSON.stringify(CATEGORIES));
  fs.writeFileSync(path.join(root, "data", "leads.json"), JSON.stringify(leads));
  fs.writeFileSync(path.join(root, "data", "benchmarks.json"), JSON.stringify(PLACEHOLDER));
  return { root, leads };
}

async function run(argv) {
  const out = [];
  const err = [];
  const code = await main(argv, { log: (t) => out.push(t), error: (t) => err.push(t), now: new Date("2026-09-28T12:00:00.000Z") });
  return { code, out: out.join("\n"), err: err.join("\n") };
}

test("parseArgs accepts one selector and rejects combinations", () => {
  assert.equal(parseArgs([]).mode, "missing");
  assert.deepEqual([parseArgs(["--id", "x"]).mode, parseArgs(["--id", "x"]).value], ["id", "x"]);
  assert.equal(parseArgs(["--run", "2026-09-28"]).value, "2026-09-28");
  assert.equal(parseArgs(["--all"]).mode, "all");
  assert.ok(parseArgs(["--all", "--missing"]).errors.length);
  assert.ok(parseArgs(["--id"]).errors.length);
  assert.ok(parseArgs(["--bogus"]).errors.length);
});

test("--id writes one pitch page and leaves data untouched", async (t) => {
  const { root, leads } = tempRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const before = fs.readFileSync(path.join(root, "data", "leads.json"), "utf8");
  const id = leads.find((l) => l.id.startsWith("gm-auto-care")).id;
  const r = await run(["--id", id, "--root", root]);
  assert.equal(r.code, 0, r.err);
  const file = pitchPath(root, id);
  assert.ok(fs.existsSync(file));
  const html = fs.readFileSync(file, "utf8");
  assert.ok(html.includes("GM AUTO CARE"));
  assert.ok(!hasDash(html));
  assert.equal(fs.readFileSync(path.join(root, "data", "leads.json"), "utf8"), before, "leads.json is not rewritten");
  assert.match(r.out, /Nothing was published or sent/);
});

test("--missing builds only what is absent, then reports nothing to do", async (t) => {
  const { root, leads } = tempRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const first = await run(["--root", root]);
  assert.equal(first.code, 0, first.err);
  for (const lead of leads) assert.ok(fs.existsSync(pitchPath(root, lead.id)), lead.id);
  const second = await run(["--missing", "--root", root]);
  assert.equal(second.code, 0);
  assert.match(second.out, /Every lead already has a pitch page/);
  fs.rmSync(path.dirname(pitchPath(root, leads[3].id)), { recursive: true });
  assert.deepEqual(selectLeads(leads, { mode: "missing" }, root).map((l) => l.id), [leads[3].id]);
});

test("--run selects that run's leads and --all rebuilds everything", async (t) => {
  const { root, leads } = tempRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const r = await run(["--run", "2026-10-05", "--root", root]);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /2 built/);
  assert.ok(fs.existsSync(pitchPath(root, leads[0].id)));
  assert.ok(!fs.existsSync(pitchPath(root, leads[5].id)));
  const all = await run(["--all", "--root", root]);
  assert.match(all.out, new RegExp(`${leads.length} built`));
});

test("an unknown id or bad arguments fail with a readable message", async (t) => {
  const { root } = tempRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const r = await run(["--id", "no-such-lead", "--root", root]);
  assert.equal(r.code, 1);
  assert.match(r.err, /No lead has the id "no-such-lead"/);
  const bad = await run(["--all", "--id", "x"]);
  assert.equal(bad.code, 2);
  assert.match(bad.err, /Pick one of/);
});

test("a lead id that is not a safe folder name is refused", async (t) => {
  const { root, leads } = tempRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  leads.push({ ...leads[0], id: "../escape" });
  fs.writeFileSync(path.join(root, "data", "leads.json"), JSON.stringify(leads));
  const r = await run(["--id", "../escape", "--root", root]);
  assert.equal(r.code, 1);
  assert.match(r.err, /not a safe folder name/);
  assert.ok(!fs.existsSync(path.join(root, "escape")));
});
