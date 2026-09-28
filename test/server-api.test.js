// Server API tests. Each test starts the server on an ephemeral port against a temp copy of
// config plus data built from the seed; the repo's real data/ is never touched.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createServer } from "../server/server.js";
import { SHEET_COLUMNS } from "../src/lib/csv.js";
import { placeholderBenchmarks, seedToData } from "../src/lib/seed.js";

const PROJECT = new URL("../", import.meta.url);
const NOW = "2026-09-28T15:00:00.000Z";
const GM = "gm-auto-care-dallas-tx";

function missing(name) {
  return () => {
    const err = new Error(`Cannot find module ${name}`);
    err.code = "ERR_MODULE_NOT_FOUND";
    throw err;
  };
}

const NO_MODULES = {
  demoBuild: missing("build-demos"),
  demoRender: missing("render"),
  guardrails: missing("guardrails"),
  pitchBuild: missing("build-pitches"),
  pitch: missing("pitch"),
  drafts: missing("drafts"),
};

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kija-server-"));
  fs.mkdirSync(path.join(root, "config"));
  fs.mkdirSync(path.join(root, "data", "runs"), { recursive: true });
  for (const f of ["settings.json", "categories.json", "geography.json", "chains.json"]) {
    fs.copyFileSync(new URL(`config/${f}`, PROJECT), path.join(root, "config", f));
  }
  const seed = JSON.parse(fs.readFileSync(new URL("seed/sheet-2026-09-28.json", PROJECT), "utf8"));
  const settings = JSON.parse(fs.readFileSync(path.join(root, "config", "settings.json"), "utf8"));
  const categories = JSON.parse(fs.readFileSync(path.join(root, "config", "categories.json"), "utf8"));
  const data = seedToData(seed, { now: NOW, thresholds: settings.thresholds });
  const write = (rel, value) => fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`);
  write("data/leads.json", data.leads);
  write("data/queue.json", data.queue);
  write("data/rejected.json", data.rejected);
  write("data/benchmarks.json", placeholderBenchmarks(categories, { updatedAt: "2026-09-28" }));
  write("data/runs/2026-09-28.json", {
    runId: "2026-09-28",
    ingestedAt: NOW,
    mode: "weekly",
    plan: { metros: ["dallas-fort-worth", "new-york"], categories: ["auto-repair", "hvac"] },
    counts: { candidates: 3, accepted: 0, queued: 1, rejected: 1, duplicates: 1, reverified: 0, errors: 0 },
    accepted: [],
    queued: [],
    duplicates: [{ business: "GM AUTO CARE", matched: GM }],
    errors: [],
    warnings: [],
    searched: [{ query: "auto repair Dallas", source: "web", notes: "" }],
    notes: "",
  });
  return root;
}

const readJson = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));

async function start(options = {}) {
  const root = options.root ?? tempRoot();
  const server = createServer({
    root,
    now: () => new Date(NOW),
    loaders: { ...NO_MODULES, ...(options.loaders ?? {}) },
    placesKey: () => false,
    log: () => {},
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, url, body, headers = {}) => {
    const res = await fetch(`${base}${url}`, {
      method,
      headers: body === undefined ? headers : { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // not JSON
    }
    return { status: res.status, headers: res.headers, text, json };
  };
  return { root, base, call, close: () => new Promise((resolve) => server.close(resolve)).then(() => fs.rmSync(root, { recursive: true, force: true })) };
}

test("GET /api/state returns leads with score, roi, file flags and drafts", async (t) => {
  const s = await start({
    loaders: { drafts: async () => ({ buildDrafts: (lead) => ({ email: { subject: `Hi ${lead.business}`, body: "Opt out line." }, callScript: "", voicemail: "", followUpText: "", notes: "" }) }) },
  });
  t.after(s.close);
  const r = await s.call("GET", "/api/state");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type"), /application\/json/);
  assert.equal(r.headers.get("cache-control"), "no-store");
  const body = r.json;
  for (const key of ["leads", "queue", "runs", "settings", "categories", "geography", "benchmarks", "env", "now"]) {
    assert.ok(key in body, `state has ${key}`);
  }
  assert.equal(body.leads.length, 20);
  assert.equal(body.queue.length, 5);
  assert.deepEqual(body.env, { placesKey: false });
  assert.equal(body.now, NOW);
  assert.equal(body.runs.length, 1);
  assert.equal(body.runs[0].runId, "2026-09-28");
  const gm = body.leads.find((l) => l.id === GM);
  assert.equal(gm.score.total, 96);
  assert.equal(gm.score.parts.length, 5);
  for (const p of gm.score.parts) {
    assert.deepEqual(Object.keys(p).sort(), ["detail", "key", "label", "max", "points"]);
    assert.match(p.detail, /\.$/);
  }
  assert.equal(typeof gm.roi.breakEven.jobs, "number");
  assert.equal(gm.roi.disclaimer, "These are estimates to adjust together, not a promise.");
  assert.equal(gm.demoExists, false);
  assert.equal(gm.pitchExists, false);
  assert.equal(gm.drafts.email.subject, "Hi GM AUTO CARE");
  assert.equal(body.modules.drafts, true);
  assert.equal(body.modules.pitch, false);
});

test("drafts are null and modules say so while the pitch module is missing", async (t) => {
  const s = await start();
  t.after(s.close);
  const r = await s.call("GET", "/api/state");
  assert.equal(r.json.leads[0].drafts, null);
  assert.deepEqual(r.json.modules, { drafts: false, pitch: false, demo: false });
});

test("PATCH a status change appends one status history entry and keeps the rest", async (t) => {
  const s = await start();
  t.after(s.close);
  const before = readJson(s.root, "data/leads.json").find((l) => l.id === GM);
  const r = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { status: "Contacted", nextAction: "Follow up Thursday", nextDate: "2026-10-01" } });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.ok, true);
  const history = r.json.lead.outreach.history;
  assert.equal(history.length, before.outreach.history.length + 1);
  assert.deepEqual(history[0], before.outreach.history[0]);
  assert.deepEqual(history.at(-1), { at: NOW, by: "Jamey", type: "status", text: "New to Contacted" });
  assert.ok(r.json.warnings.some((w) => /not marked verified/.test(w)), "warns that the lead is not verified");
  assert.equal(typeof r.json.lead.score.total, "number");
  const saved = readJson(s.root, "data/leads.json").find((l) => l.id === GM);
  assert.equal(saved.outreach.status, "Contacted");
  assert.equal(saved.outreach.nextDate, "2026-10-01");
  assert.equal(saved.outreach.history.length, before.outreach.history.length + 1);
  assert.equal(saved.score, undefined, "computed fields are never stored");

  const same = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { status: "Contacted" } });
  assert.equal(same.json.lead.outreach.history.length, history.length, "no entry when the status does not change");
});

test("PATCH rejects an unknown status, history edits and unknown fields with 422", async (t) => {
  const s = await start();
  t.after(s.close);
  const before = fs.readFileSync(path.join(s.root, "data/leads.json"), "utf8");
  const bad = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { status: "Closed" } });
  assert.equal(bad.status, 422);
  assert.equal(bad.json.ok, false);
  assert.ok(bad.json.errors.some((e) => /Closed/.test(e) && /not one of/.test(e)));
  const hist = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { history: [] } });
  assert.equal(hist.status, 422);
  assert.ok(hist.json.errors.some((e) => /append only/.test(e)));
  const extra = await s.call("PATCH", `/api/leads/${GM}`, { googleRating: 5 });
  assert.equal(extra.status, 422);
  const dash = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { notes: `call back ${String.fromCharCode(0x2014)} later` } });
  assert.equal(dash.status, 422);
  assert.equal(fs.readFileSync(path.join(s.root, "data/leads.json"), "utf8"), before, "nothing was written");
  const unknown = await s.call("PATCH", "/api/leads/no-such-lead", { outreach: { status: "New" } });
  assert.equal(unknown.status, 404);
  assert.match(unknown.json.errors[0], /No lead has the id/);
});

test("PATCH roiOverrides merges, clears with null and validates", async (t) => {
  const s = await start();
  t.after(s.close);
  const set = await s.call("PATCH", `/api/leads/${GM}`, { roiOverrides: { ticket: 900, jobsPerMonth: 2 } });
  assert.equal(set.status, 200, set.text);
  assert.equal(set.json.lead.roi.inputs.ticket, 900);
  assert.deepEqual(set.json.lead.roiOverrides, { ticket: 900, jobsPerMonth: 2 });
  const clear = await s.call("PATCH", `/api/leads/${GM}`, { roiOverrides: { ticket: null } });
  assert.deepEqual(clear.json.lead.roiOverrides, { jobsPerMonth: 2 });
  const bad = await s.call("PATCH", `/api/leads/${GM}`, { roiOverrides: { margin: 45 } });
  assert.equal(bad.status, 422);
  assert.ok(bad.json.errors.some((e) => /fraction/.test(e)));
});

test("POST history appends manual entries only", async (t) => {
  const s = await start();
  t.after(s.close);
  const ok = await s.call("POST", `/api/leads/${GM}/history`, { type: "call", text: "Left a voicemail with the front desk.", by: "Jamey" });
  assert.equal(ok.status, 200, ok.text);
  assert.deepEqual(ok.json.lead.outreach.history.at(-1), { at: NOW, by: "Jamey", type: "call", text: "Left a voicemail with the front desk." });
  const status = await s.call("POST", `/api/leads/${GM}/history`, { type: "status", text: "New to Won", by: "Jamey" });
  assert.equal(status.status, 422);
  const empty = await s.call("POST", `/api/leads/${GM}/history`, { type: "note", text: "  " });
  assert.equal(empty.status, 422);
  const unknownType = await s.call("POST", `/api/leads/${GM}/history`, { type: "sms", text: "hi" });
  assert.equal(unknownType.status, 422);
  const missingLead = await s.call("POST", "/api/leads/nope/history", { type: "note", text: "x" });
  assert.equal(missingLead.status, 404);
});

test("queue Drop needs a reason and moves the item to rejected", async (t) => {
  const s = await start();
  t.after(s.close);
  const queue = readJson(s.root, "data/queue.json");
  const item = queue.find((q) => q.candidate === "P V Auto Services");
  const noReason = await s.call("POST", `/api/queue/${item.id}/decision`, { decision: "Drop" });
  assert.equal(noReason.status, 422);
  assert.equal(readJson(s.root, "data/queue.json").length, 5);
  const drop = await s.call("POST", `/api/queue/${item.id}/decision`, { decision: "Drop", reason: "Rating trend is going down." });
  assert.equal(drop.status, 200, drop.text);
  assert.equal(drop.json.removed, item.id);
  const after = readJson(s.root, "data/queue.json");
  assert.equal(after.length, 4);
  assert.ok(!after.some((q) => q.id === item.id));
  const rejected = readJson(s.root, "data/rejected.json");
  assert.equal(rejected.length, 1);
  assert.deepEqual(rejected[0], {
    key: "2148289690",
    business: "P V Auto Services",
    city: "Dallas",
    state: "TX",
    phone: "214-828-9690",
    reason: "Rating trend is going down.",
    evidenceUrl: item.sources[0].url,
    rejectedAt: "2026-09-28",
    runId: "",
  });
  const unknown = await s.call("POST", "/api/queue/nope/decision", { decision: "Drop", reason: "x" });
  assert.equal(unknown.status, 404);
  const badDecision = await s.call("POST", `/api/queue/${after[0].id}/decision`, { decision: "Delete" });
  assert.equal(badDecision.status, 422);
});

test("queue Research keeps the item and records the note", async (t) => {
  const s = await start();
  t.after(s.close);
  const item = readJson(s.root, "data/queue.json")[0];
  const r = await s.call("POST", `/api/queue/${item.id}/decision`, { decision: "Research", reason: "Waiting on the live review count." });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.item.decision, "Research");
  assert.equal(r.json.item.reason, "Waiting on the live review count.");
  assert.equal(r.json.item.updatedAt, "2026-09-28");
  assert.equal(readJson(s.root, "data/queue.json").length, 5);
});

test("queue Promote validates in manual mode and adds a lead only when it passes", async (t) => {
  const s = await start();
  t.after(s.close);
  const item = readJson(s.root, "data/queue.json").find((q) => q.candidate === "The Parlor Barbershop");
  const bare = await s.call("POST", `/api/queue/${item.id}/decision`, { decision: "Promote" });
  assert.equal(bare.status, 422);
  assert.ok(bare.json.errors.some((e) => /websiteGap/.test(e)), bare.text);
  assert.ok(bare.json.errors.some((e) => /pitchAngle/.test(e)));
  assert.equal(readJson(s.root, "data/leads.json").length, 20, "nothing added on failure");

  const lead = { websiteGap: 3, ticketValue: 1, visualFit: 3, confidence: "Medium", pitchAngle: "Give regulars one place to book.", demoConcept: "Warm barbershop site with booking." };
  const ok = await s.call("POST", `/api/queue/${item.id}/decision`, { decision: "Promote", reason: "Verified on Maps.", lead });
  assert.equal(ok.status, 200, ok.text);
  assert.equal(ok.json.lead.id, "the-parlor-barbershop-dallas-tx");
  assert.equal(ok.json.lead.origin, "queue-promotion");
  assert.equal(ok.json.lead.outreach.status, "New");
  assert.equal(ok.json.lead.outreach.history.length, 1);
  assert.equal(ok.json.lead.outreach.history[0].type, "created");
  assert.match(ok.json.lead.outreach.history[0].text, /Promoted from the research queue with score \d+\. Verified on Maps\./);
  assert.equal(typeof ok.json.lead.score.total, "number");
  assert.ok(ok.json.warnings.some((w) => /confidence is Medium/.test(w)));
  const leads = readJson(s.root, "data/leads.json");
  assert.equal(leads.length, 21);
  const saved = leads.find((l) => l.id === "the-parlor-barbershop-dallas-tx");
  assert.equal(saved.business, "The Parlor Barbershop");
  assert.equal(saved.phone, "469-677-0690");
  assert.equal(saved.demo.shareApproved, false);
  assert.ok(!readJson(s.root, "data/queue.json").some((q) => q.id === item.id));
});

test("queue Promote refuses a chain and a duplicate of an existing lead", async (t) => {
  const s = await start();
  t.after(s.close);
  const queue = readJson(s.root, "data/queue.json");
  queue[0].lead = { business: "GM AUTO CARE", phone: "972-681-4966" };
  fs.writeFileSync(path.join(s.root, "data/queue.json"), JSON.stringify(queue, null, 2));
  const lead = { websiteGap: 3, ticketValue: 3, visualFit: 3, confidence: "High", pitchAngle: "a", demoConcept: "b" };
  const dupe = await s.call("POST", `/api/queue/${queue[0].id}/decision`, { decision: "Promote", lead });
  assert.equal(dupe.status, 422);
  assert.ok(dupe.json.errors.some((e) => /matches the existing lead/.test(e)), dupe.text);
});

test("PUT settings merges a partial object and validates the result", async (t) => {
  const s = await start();
  t.after(s.close);
  const before = readJson(s.root, "config/settings.json");
  const r = await s.call("PUT", "/api/settings", { offer: { price: 3000 }, thresholds: { preferredReviews: 40 } });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.settings.offer.price, 3000);
  assert.equal(r.json.settings.offer.name, before.offer.name);
  assert.deepEqual(r.json.settings.offer.includes, before.offer.includes);
  assert.equal(r.json.settings.thresholds.preferredReviews, 40);
  assert.equal(r.json.settings.thresholds.minRating, before.thresholds.minRating);
  assert.ok(r.json.warnings.some((w) => /placeholder/.test(w)));
  const saved = readJson(s.root, "config/settings.json");
  assert.equal(saved.offer.price, 3000);
  assert.deepEqual(saved.geography, before.geography);

  const state = await s.call("GET", "/api/state");
  assert.equal(state.json.leads[0].roi.inputs.price, 3000, "ROI reads the new price");

  const bad = await s.call("PUT", "/api/settings", { weeklyQuota: 0 });
  assert.equal(bad.status, 422);
  const unknown = await s.call("PUT", "/api/settings", { secretKey: "x" });
  assert.equal(unknown.status, 422);
  const home = await s.call("PUT", "/api/settings", { geography: { homeMetro: "atlantis" } });
  assert.equal(home.status, 422);
  assert.equal(readJson(s.root, "config/settings.json").weeklyQuota, before.weeklyQuota);
});

test("share export is refused until the demo exists and is approved", async (t) => {
  const s = await start({ loaders: { guardrails: async () => ({ checkDemoHtml: () => ({ ok: true, errors: [], warnings: [] }) }) } });
  t.after(s.close);
  const early = await s.call("POST", `/api/leads/${GM}/export`);
  assert.equal(early.status, 422);
  assert.match(early.json.errors[0], /Approve the demo/);
  const approveNoDemo = await s.call("PATCH", `/api/leads/${GM}`, { demo: { shareApproved: true } });
  assert.equal(approveNoDemo.status, 422);
  assert.ok(approveNoDemo.json.errors.some((e) => /Build the demo/.test(e)));

  fs.mkdirSync(path.join(s.root, "demos", GM), { recursive: true });
  fs.writeFileSync(path.join(s.root, "demos", GM, "index.html"), "<!doctype html><title>Concept</title><p>Private concept</p>");
  const approve = await s.call("PATCH", `/api/leads/${GM}`, { demo: { shareApproved: true } });
  assert.equal(approve.status, 200, approve.text);
  assert.equal(approve.json.lead.demo.shareApproved, true);
  assert.equal(approve.json.lead.demoExists, true);
  assert.equal(approve.json.lead.outreach.history.at(-1).text, "Demo approved for sharing.");

  const out = await s.call("POST", `/api/leads/${GM}/export`);
  assert.equal(out.status, 200, out.text);
  assert.equal(out.json.file, `exports/${GM}-concept.html`);
  assert.ok(fs.existsSync(path.join(s.root, "exports", `${GM}-concept.html`)));
  const served = await s.call("GET", out.json.url);
  assert.equal(served.status, 200);
  assert.match(served.headers.get("content-type"), /text\/html/);
  assert.match(served.text, /Private concept/);
});

test("export refuses a demo that fails its guardrails", async (t) => {
  const s = await start({ loaders: { guardrails: async () => ({ checkDemoHtml: () => ({ ok: false, errors: ["The concept ribbon text is missing."], warnings: [] }) }) } });
  t.after(s.close);
  fs.mkdirSync(path.join(s.root, "demos", GM), { recursive: true });
  fs.writeFileSync(path.join(s.root, "demos", GM, "index.html"), "<p>x</p>");
  await s.call("PATCH", `/api/leads/${GM}`, { demo: { shareApproved: true } });
  const out = await s.call("POST", `/api/leads/${GM}/export`);
  assert.equal(out.status, 422);
  assert.match(out.json.errors[0], /ribbon/);
  assert.ok(!fs.existsSync(path.join(s.root, "exports", `${GM}-concept.html`)));
});

test("demo and pitch regeneration answer 503 with a sentence while the modules are missing", async (t) => {
  const s = await start();
  t.after(s.close);
  const demo = await s.call("POST", `/api/leads/${GM}/demo`);
  assert.equal(demo.status, 503);
  assert.match(demo.json.errors[0], /demo generator is not installed yet/);
  const pitch = await s.call("POST", `/api/leads/${GM}/pitch`);
  assert.equal(pitch.status, 503);
  assert.match(pitch.json.errors[0], /Pitch pages are not installed yet/);
  const unknown = await s.call("POST", "/api/leads/nope/demo");
  assert.equal(unknown.status, 404);
});

test("demo regeneration uses the demo builder and logs a demo history entry", async (t) => {
  let seen = null;
  const s = await start({
    loaders: {
      demoBuild: async () => ({
        buildDemos: async ({ store, rootDir, selection }) => {
          seen = selection;
          fs.mkdirSync(path.join(rootDir, "demos", selection.value), { recursive: true });
          fs.writeFileSync(path.join(rootDir, "demos", selection.value, "index.html"), "<p>demo</p>");
          const state = store.load();
          const lead = state.leads.find((l) => l.id === selection.value);
          lead.demo = { ...lead.demo, builtAt: NOW, template: "auto", palette: "ember" };
          store.saveLeads(state.leads);
          return { ok: true, built: [{ id: lead.id, template: "auto", palette: "ember" }], failed: [], errors: [], warnings: [] };
        },
      }),
    },
  });
  t.after(s.close);
  const r = await s.call("POST", `/api/leads/${GM}/demo`);
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(seen, { mode: "id", value: GM });
  assert.equal(r.json.lead.demoExists, true);
  assert.equal(r.json.lead.demo.template, "auto");
  assert.equal(r.json.lead.outreach.history.at(-1).type, "demo");
  assert.match(r.json.lead.outreach.history.at(-1).text, /auto template, ember palette/);
});

test("pitch regeneration writes the page through the pitch builder", async (t) => {
  const s = await start({
    loaders: {
      pitch: async () => ({
        renderPitch: (lead) => `<!doctype html><meta name="robots" content="noindex, nofollow"><h1>${lead.business}</h1>`,
      }),
    },
  });
  t.after(s.close);
  const r = await s.call("POST", `/api/leads/${GM}/pitch`);
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.lead.pitchExists, true);
  const page = await s.call("GET", `/pitches/${GM}/`);
  assert.equal(page.status, 200);
  assert.match(page.text, /GM AUTO CARE/);
});

test("GET /api/export.csv has the sheet columns in order and one row per lead", async (t) => {
  const s = await start();
  t.after(s.close);
  const r = await s.call("GET", "/api/export.csv");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type"), /text\/csv/);
  assert.match(r.headers.get("content-disposition"), /attachment; filename="lead-pipeline-2026-09-28\.csv"/);
  const lines = r.text.trimEnd().split("\r\n");
  assert.equal(lines[0], SHEET_COLUMNS.join(","));
  assert.equal(lines.length, 21);
  assert.match(lines[1], /^96,GM AUTO CARE,/);
});

test("requests from another origin or host, oversized bodies and bad JSON are refused", async (t) => {
  const s = await start();
  t.after(s.close);
  const origin = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { status: "Won" } }, { Origin: "https://example.com" });
  assert.equal(origin.status, 403);
  const local = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { notes: "ok" } }, { Origin: s.base });
  assert.equal(local.status, 200, local.text);
  const big = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { notes: "x".repeat(300 * 1024) } });
  assert.equal(big.status, 413);
  const badJson = await s.call("PATCH", `/api/leads/${GM}`, "{not json");
  assert.equal(badJson.status, 400);
  const notJson = await s.call("PATCH", `/api/leads/${GM}`, undefined, { "Content-Type": "text/plain" });
  assert.equal(notJson.status, 422, "an empty body reads as an empty change");
  const form = await fetch(`${s.base}/api/leads/${GM}`, { method: "PATCH", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "outreach=1" });
  assert.equal(form.status, 415);
  const method = await s.call("DELETE", `/api/leads/${GM}`);
  assert.equal(method.status, 405);
  assert.match(method.headers.get("allow"), /PATCH/);
  const route = await s.call("GET", "/api/nothing");
  assert.equal(route.status, 404);
  assert.equal(route.json.ok, false);
  assert.equal(readJson(s.root, "data/leads.json").find((l) => l.id === GM).outreach.status, "New");
});
