import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildDemos, demoPath, formatReport, parseArgs, selectLeads } from "../src/cli/build-demos.js";
import { DIRECTIONS } from "../src/demo/directions/index.js";
import { checkDemoHtml } from "../src/demo/guardrails.js";

const CATEGORIES = {
  "auto-repair": { label: "Auto repair", vertical: "auto", serviceDefaults: ["Brakes"] },
  barber: { label: "Barber shop", vertical: "personal-care", serviceDefaults: ["Haircut"] },
};

function lead(id, extra = {}) {
  return {
    id,
    business: id.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
    category: "Auto repair",
    categoryKey: "auto-repair",
    city: "Dallas",
    state: "TX",
    phone: "214-555-0100",
    googleRating: 4.9,
    googleReviews: 88,
    outreach: { status: "New", history: [] },
    demo: { builtAt: "", template: "", palette: "", shareApproved: false },
    runId: "",
    ...extra,
  };
}

// Minimal stand in for createStore(): same load/saveLeads shape, in memory.
function fakeStore(leads) {
  const state = { leads, categories: CATEGORIES, settings: { demoDefaults: { conceptRibbon: true } } };
  const saves = [];
  return {
    saves,
    load: () => structuredClone(state),
    saveLeads: (next) => {
      saves.push(structuredClone(next));
      state.leads = structuredClone(next);
    },
  };
}

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kija-demos-"));
}

const NOW = new Date("2026-09-28T15:00:00.000Z");

test("parseArgs reads each selector and rejects bad input", () => {
  assert.equal(parseArgs([]).mode, "missing");
  assert.equal(parseArgs(["--all"]).mode, "all");
  assert.deepEqual([parseArgs(["--id", "x"]).mode, parseArgs(["--id", "x"]).value], ["id", "x"]);
  assert.deepEqual([parseArgs(["--run", "2026-09-28"]).mode, parseArgs(["--run", "2026-09-28"]).value], ["run", "2026-09-28"]);
  assert.ok(parseArgs(["--id"]).errors.length);
  assert.ok(parseArgs(["--all", "--missing"]).errors.length);
  assert.ok(parseArgs(["--bogus"]).errors.length);
  assert.equal(parseArgs(["--root", "somewhere"]).root, path.resolve("somewhere"));
});

test("builds demos, records direction, palette and variants, keeps shareApproved and outreach", async () => {
  const root = tempRoot();
  const store = fakeStore([
    lead("alpha-auto", { demo: { builtAt: "", template: "", palette: "", shareApproved: true } }),
    lead("beta-barber", { categoryKey: "barber", category: "Barber shop", runId: "2026-09-28" }),
  ]);
  const report = await buildDemos({ store, rootDir: root, selection: { mode: "all" }, now: NOW });
  assert.equal(report.ok, true);
  assert.equal(report.built.length, 2);
  assert.equal(store.saves.length, 1);
  const [a, b] = store.saves[0];
  assert.equal(a.demo.builtAt, NOW.toISOString());
  assert.ok(DIRECTIONS[a.demo.direction].suits.includes("auto-repair"), a.demo.direction);
  assert.equal(a.demo.template, a.demo.direction);
  assert.ok(DIRECTIONS[a.demo.direction].palettes.some((p) => p.key === a.demo.palette));
  for (const slot of ["hero", "services", "proof"]) assert.ok(DIRECTIONS[a.demo.direction].variants[slot].includes(a.demo.variants[slot]), slot);
  assert.equal(a.demo.shareApproved, true);
  assert.ok(a.demo.palette);
  assert.ok(DIRECTIONS[b.demo.direction].suits.includes("barber"), b.demo.direction);
  assert.deepEqual(a.outreach, { status: "New", history: [] }, "outreach untouched");
  for (const l of [a, b]) {
    const html = fs.readFileSync(demoPath(root, l.id), "utf8");
    assert.equal(checkDemoHtml(html, l).ok, true);
    assert.equal(fs.existsSync(`${demoPath(root, l.id)}.tmp`), false);
  }
  assert.match(formatReport(report, { mode: "all" }), /2 built, 0 failed/);
});

test("--missing skips built demos whose file exists, --run and --id filter", async () => {
  const root = tempRoot();
  const store = fakeStore([lead("alpha-auto"), lead("beta-auto", { runId: "2026-10-05" })]);
  await buildDemos({ store, rootDir: root, selection: { mode: "id", value: "alpha-auto" }, now: NOW });
  const state = store.load();
  assert.deepEqual(selectLeads(state.leads, { mode: "missing" }, root).map((l) => l.id), ["beta-auto"]);
  assert.deepEqual(selectLeads(state.leads, { mode: "run", value: "2026-10-05" }, root).map((l) => l.id), ["beta-auto"]);

  fs.rmSync(demoPath(root, "alpha-auto"));
  assert.deepEqual(selectLeads(state.leads, { mode: "missing" }, root).map((l) => l.id), ["alpha-auto", "beta-auto"], "a deleted file counts as missing");

  const again = await buildDemos({ store, rootDir: root, selection: { mode: "missing" }, now: NOW });
  assert.equal(again.built.length, 2);
  const none = await buildDemos({ store, rootDir: root, selection: { mode: "missing" }, now: NOW });
  assert.equal(none.matched, 0);
  assert.match(formatReport(none, { mode: "missing" }), /Every lead already has a demo/);
});

test("the stored choice is reused on rebuild, and a lone rebuild keeps the batch varied", async () => {
  const root = tempRoot();
  const store = fakeStore([lead("alpha-auto", { demo: { palette: "bay-apron", shareApproved: false } })]);
  const report = await buildDemos({ store, rootDir: root, selection: { mode: "all" }, now: NOW });
  assert.equal(report.built[0].palette, "bay-apron");
  assert.equal(report.built[0].direction, "auto-neighborhood-bay", "the palette names its direction");
  const first = store.saves[0][0].demo;
  const again = await buildDemos({ store, rootDir: root, selection: { mode: "id", value: "alpha-auto" }, now: NOW });
  assert.deepEqual(again.built[0].variants, first.variants, "the stored variants are kept");

  // Building one lead of a batch picks the same direction as building them all.
  const batch = () => ["one-auto", "two-auto", "three-auto", "four-auto"].map((id) => lead(id));
  const all = fakeStore(batch());
  await buildDemos({ store: all, rootDir: tempRoot(), selection: { mode: "all" }, now: NOW });
  const solo = fakeStore(batch());
  await buildDemos({ store: solo, rootDir: tempRoot(), selection: { mode: "id", value: "three-auto" }, now: NOW });
  const pick = (st) => st.saves[0].find((l) => l.id === "three-auto").demo;
  assert.equal(pick(solo).direction, pick(all).direction);
  assert.equal(pick(solo).palette, pick(all).palette);
  assert.equal(new Set(all.saves[0].map((l) => l.demo.direction)).size, 4, "four auto repair leads, four directions");
});

test("an unknown id is a readable error, not a throw", async () => {
  const store = fakeStore([lead("alpha-auto")]);
  const report = await buildDemos({ store, rootDir: tempRoot(), selection: { mode: "id", value: "nope" }, now: NOW });
  assert.equal(report.ok, false);
  assert.match(report.errors[0], /No lead has the id "nope"/);
  assert.equal(store.saves.length, 0);
});

test("a lead that fails guardrails is reported and not written", async () => {
  const root = tempRoot();
  const dashed = lead("dash-auto", { business: `Dash ${String.fromCharCode(0x2014)} Auto` });
  const store = fakeStore([dashed, lead("fine-auto")]);
  const report = await buildDemos({ store, rootDir: root, selection: { mode: "all" }, now: NOW });
  assert.equal(report.ok, false);
  assert.equal(report.failed.length, 1);
  assert.equal(report.failed[0].id, "dash-auto");
  assert.ok(report.failed[0].errors.some((e) => e.includes("dash")));
  assert.equal(fs.existsSync(demoPath(root, "dash-auto")), false);
  assert.equal(fs.existsSync(demoPath(root, "fine-auto")), true);
  const saved = store.saves[0].find((l) => l.id === "dash-auto");
  assert.equal(saved.demo.builtAt, "", "a failed lead keeps its old demo record");
});
