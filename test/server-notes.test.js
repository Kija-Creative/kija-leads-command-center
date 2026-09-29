// Team notes API. Each test starts the server on an ephemeral port against a temp copy of
// config plus data built from the seed; the repo's real data/ is never touched.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createServer } from "../server/server.js";
import { placeholderBenchmarks, seedToData } from "../src/lib/seed.js";

const PROJECT = new URL("../", import.meta.url);
const NOW = "2026-09-29T15:00:00.000Z";
const GM = "gm-auto-care-dallas-tx";
const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);
const DASHES = new RegExp(`[${EN}${EM}]`);

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

function tempRoot({ run = true, notes = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kija-notes-server-"));
  fs.mkdirSync(path.join(root, "config"));
  fs.mkdirSync(path.join(root, "data", "runs"), { recursive: true });
  for (const f of ["settings.json", "categories.json", "geography.json", "chains.json"]) {
    fs.copyFileSync(new URL(`config/${f}`, PROJECT), path.join(root, "config", f));
  }
  const seed = JSON.parse(fs.readFileSync(new URL("seed/sheet-2026-09-28.json", PROJECT), "utf8"));
  const settings = JSON.parse(fs.readFileSync(path.join(root, "config", "settings.json"), "utf8"));
  const categories = JSON.parse(fs.readFileSync(path.join(root, "config", "categories.json"), "utf8"));
  const data = seedToData(seed, { now: "2026-09-28T15:00:00.000Z", thresholds: settings.thresholds });
  const write = (rel, value) => fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`);
  write("data/leads.json", data.leads);
  write("data/queue.json", data.queue);
  write("data/rejected.json", data.rejected);
  write("data/benchmarks.json", placeholderBenchmarks(categories, { updatedAt: "2026-09-28" }));
  if (notes) write("data/notes.json", []);
  if (run) {
    write("data/runs/2026-09-21.json", { runId: "2026-09-21", ingestedAt: "2026-09-21T15:00:00.000Z", mode: "weekly", counts: {} });
    write("data/runs/2026-09-28.json", { runId: "2026-09-28", ingestedAt: "2026-09-28T15:00:00.000Z", mode: "weekly", counts: {} });
  }
  return root;
}

const readJson = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));

async function start(options = {}) {
  const root = options.root ?? tempRoot(options);
  let clock = Date.parse(NOW);
  const server = createServer({
    root,
    // One minute per request, so created and updated times differ.
    now: () => new Date((clock += 60000)),
    loaders: NO_MODULES,
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

test("POST /api/notes saves a normalized note with the latest run id, and state lists notes newest first", async (t) => {
  const s = await start();
  t.after(s.close);
  const empty = await s.call("GET", "/api/state");
  assert.deepEqual(empty.json.notes, []);

  const first = await s.call("POST", "/api/notes", { text: `  Kiel takes GM ${EM} call Thursday ${EN} Friday  `, author: "Kiel", leadId: GM });
  assert.equal(first.status, 200, first.text);
  assert.equal(first.json.ok, true);
  const n = first.json.note;
  assert.equal(n.text, "Kiel takes GM, call Thursday - Friday");
  assert.equal(n.author, "Kiel");
  assert.equal(n.leadId, GM);
  assert.equal(n.runId, "2026-09-28", "the latest run at the time of writing");
  assert.match(n.id, /^note-\d{14}-[a-z0-9]+$/);
  assert.equal(n.createdAt, n.updatedAt);
  assert.deepEqual(Object.keys(n).sort(), ["author", "createdAt", "id", "leadId", "runId", "text", "updatedAt"]);

  const second = await s.call("POST", "/api/notes", { text: "Price question for Jamey.", author: "", leadId: "" });
  assert.equal(second.status, 200, second.text);
  const minimal = await s.call("POST", "/api/notes", { text: "Only text is required." });
  assert.equal(minimal.status, 200, minimal.text);
  assert.equal(minimal.json.note.author, "");
  assert.equal(minimal.json.note.leadId, "");
  assert.deepEqual(minimal.json.notes.map((x) => x.id), [minimal.json.note.id, second.json.note.id, n.id]);

  const state = await s.call("GET", "/api/state");
  assert.deepEqual(state.json.notes.map((x) => x.id), [minimal.json.note.id, second.json.note.id, n.id], "newest first");
  const file = readJson(s.root, "data/notes.json");
  assert.deepEqual(file.map((x) => x.id), [n.id, second.json.note.id, minimal.json.note.id], "the file is oldest first");
  assert.ok(!DASHES.test(fs.readFileSync(path.join(s.root, "data/notes.json"), "utf8")));
});

test("a note without any run gets an empty run id, and a missing notes file reads as empty", async (t) => {
  const s = await start({ run: false, notes: false });
  t.after(s.close);
  const state = await s.call("GET", "/api/state");
  assert.equal(state.status, 200, state.text);
  assert.deepEqual(state.json.notes, []);
  const r = await s.call("POST", "/api/notes", { text: "Before the first run." });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.note.runId, "");
  assert.equal(readJson(s.root, "data/notes.json").length, 1);
});

test("POST /api/notes answers 422 with a sentence on bad input and writes nothing", async (t) => {
  const s = await start();
  t.after(s.close);
  const before = fs.readFileSync(path.join(s.root, "data/notes.json"), "utf8");
  const cases = [
    [{ text: "" }, /Write something/],
    [{ text: "   \n  " }, /Write something/],
    [{}, /must be text/],
    [{ text: 7 }, /must be text/],
    [{ text: "x".repeat(4001) }, /4,000 characters/],
    [{ text: "ok", leadId: "no-such-lead" }, /No lead has the id "no-such-lead"/],
    [{ text: "ok", author: "Someone" }, /Jamey, Kiel, Daisy/],
    [{ text: "ok", runId: "1999-01-01" }, /runId cannot be set/],
  ];
  for (const [body, re] of cases) {
    const r = await s.call("POST", "/api/notes", body);
    assert.equal(r.status, 422, `${JSON.stringify(body).slice(0, 60)}: ${r.text}`);
    assert.equal(r.json.ok, false);
    assert.ok(r.json.errors.some((e) => re.test(e) && /[.]$/.test(e)), `${re} in ${r.json.errors.join(" ")}`);
  }
  const notObject = await s.call("POST", "/api/notes", [1, 2]);
  assert.equal(notObject.status, 400);
  assert.equal(fs.readFileSync(path.join(s.root, "data/notes.json"), "utf8"), before, "nothing was written");
});

test("PATCH /api/notes/:id edits only the text and keeps who, what and when", async (t) => {
  const s = await start();
  t.after(s.close);
  const made = (await s.call("POST", "/api/notes", { text: "First draft", author: "Daisy", leadId: GM })).json.note;
  const r = await s.call("PATCH", `/api/notes/${made.id}`, { text: `Second draft ${EM} better` });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.note.text, "Second draft, better");
  assert.equal(r.json.note.author, "Daisy");
  assert.equal(r.json.note.leadId, GM);
  assert.equal(r.json.note.createdAt, made.createdAt);
  assert.ok(r.json.note.updatedAt > made.createdAt);
  assert.equal(readJson(s.root, "data/notes.json")[0].text, "Second draft, better");

  const same = await s.call("PATCH", `/api/notes/${made.id}`, { text: "  Second draft, better " });
  assert.equal(same.status, 200);
  assert.equal(same.json.note.updatedAt, r.json.note.updatedAt, "unchanged text is not a new edit");

  const empty = await s.call("PATCH", `/api/notes/${made.id}`, { text: " " });
  assert.equal(empty.status, 422);
  assert.match(empty.json.errors[0], /Write something/);
  const long = await s.call("PATCH", `/api/notes/${made.id}`, { text: "y".repeat(4001) });
  assert.equal(long.status, 422);
  const noText = await s.call("PATCH", `/api/notes/${made.id}`, {});
  assert.equal(noText.status, 422);
  assert.match(noText.json.errors[0], /new text/);
  const other = await s.call("PATCH", `/api/notes/${made.id}`, { text: "ok", author: "Kiel" });
  assert.equal(other.status, 422);
  assert.match(other.json.errors[0], /author cannot be set/);
  const unknown = await s.call("PATCH", "/api/notes/note-missing", { text: "ok" });
  assert.equal(unknown.status, 404);
  assert.match(unknown.json.errors[0], /No note has the id/);
  assert.equal(readJson(s.root, "data/notes.json")[0].text, "Second draft, better");
});

test("DELETE /api/notes/:id removes the note and keeps a backup", async (t) => {
  const s = await start();
  t.after(s.close);
  const a = (await s.call("POST", "/api/notes", { text: "Keep me" })).json.note;
  const b = (await s.call("POST", "/api/notes", { text: "Delete me" })).json.note;
  const r = await s.call("DELETE", `/api/notes/${b.id}`);
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.removed, b.id);
  assert.deepEqual(r.json.notes.map((n) => n.id), [a.id]);
  assert.deepEqual(readJson(s.root, "data/notes.json").map((n) => n.id), [a.id]);
  const backups = fs.readdirSync(path.join(s.root, "data", "backups")).filter((f) => f.startsWith("notes-"));
  assert.ok(backups.length >= 1, "the previous file was backed up");
  const again = await s.call("DELETE", `/api/notes/${b.id}`);
  assert.equal(again.status, 404);
  const wrong = await s.call("GET", `/api/notes/${a.id}`);
  assert.equal(wrong.status, 405);
  assert.match(wrong.headers.get("allow"), /PATCH/);
  assert.match(wrong.headers.get("allow"), /DELETE/);
  const list = await s.call("GET", "/api/notes");
  assert.equal(list.status, 405);
  assert.match(list.headers.get("allow"), /POST/);
});

test("notes routes refuse another origin, a foreign host and non JSON bodies", async (t) => {
  const s = await start();
  t.after(s.close);
  const made = (await s.call("POST", "/api/notes", { text: "Guarded" })).json.note;
  const before = fs.readFileSync(path.join(s.root, "data/notes.json"), "utf8");
  const evil = { Origin: "https://example.com" };
  assert.equal((await s.call("POST", "/api/notes", { text: "x" }, evil)).status, 403);
  assert.equal((await s.call("PATCH", `/api/notes/${made.id}`, { text: "x" }, evil)).status, 403);
  assert.equal((await s.call("DELETE", `/api/notes/${made.id}`, undefined, evil)).status, 403);
  assert.equal((await s.call("POST", "/api/notes", { text: "x" }, { Origin: "null" })).status, 403);
  const local = await s.call("PATCH", `/api/notes/${made.id}`, { text: "Guarded, edited" }, { Origin: s.base });
  assert.equal(local.status, 200, local.text);

  const form = await fetch(`${s.base}/api/notes`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "text=hi" });
  assert.equal(form.status, 415);
  assert.equal((await s.call("POST", "/api/notes", "{not json")).status, 400);
  assert.equal((await s.call("POST", "/api/notes", { text: "z".repeat(300 * 1024) })).status, 413);

  // DNS rebinding: a request addressed to another host name is refused before routing.
  const { request } = await import("node:http");
  const port = new URL(s.base).port;
  const status = await new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path: "/api/notes", method: "POST", headers: { Host: "evil.example", "Content-Type": "application/json" } }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on("error", reject);
    req.end(JSON.stringify({ text: "rebound" }));
  });
  assert.equal(status, 403);
  const after = readJson(s.root, "data/notes.json");
  assert.equal(after.length, 1);
  assert.equal(after[0].text, "Guarded, edited");
  assert.notEqual(before, fs.readFileSync(path.join(s.root, "data/notes.json"), "utf8"));
});

test("typed outreach notes and history text are normalized instead of refused", async (t) => {
  const s = await start();
  t.after(s.close);
  const patch = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { notes: `call back ${EM} after lunch` } });
  assert.equal(patch.status, 200, patch.text);
  assert.equal(patch.json.lead.outreach.notes, "call back, after lunch");
  const hist = await s.call("POST", `/api/leads/${GM}/history`, { type: "note", text: `Owner out ${EN} back Monday ${EM} try then`, by: "Kiel" });
  assert.equal(hist.status, 200, hist.text);
  assert.equal(hist.json.lead.outreach.history.at(-1).text, "Owner out - back Monday, try then");
  const next = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { nextAction: `call ${EM} later` } });
  assert.equal(next.status, 422, "structured fields still refuse dashes");
  assert.ok(!DASHES.test(fs.readFileSync(path.join(s.root, "data/leads.json"), "utf8")));
});
