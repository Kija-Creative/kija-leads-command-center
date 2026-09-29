// Outreach guardrails through the API: compliance per lead view, do not contact, consent,
// phone line type and the compliance settings. Each test runs the server on an ephemeral port
// against a temp copy of config plus data built from the seed; the real data/ is never touched.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createServer } from "../server/server.js";
import { placeholderBenchmarks, seedToData } from "../src/lib/seed.js";

const PROJECT = new URL("../", import.meta.url);
// A Monday, 10:00 AM in Dallas (CDT is UTC-5).
const MONDAY = "2026-09-28T15:00:00.000Z";
// A Sunday, 10:00 AM in Dallas.
const SUNDAY = "2026-09-27T15:00:00.000Z";
const GM = "gm-auto-care-dallas-tx";
const TEXAS = "Texas phone solicitation status is unconfirmed. Check chapter 302 with an attorney before phone outreach.";
const COMPLIANCE = {
  texasRegistration: "unknown",
  callWindow: { startHour: 9, endHour: 20, days: [1, 2, 3, 4, 5, 6] },
  maxCallsPerDay: 1,
  maxCallsTotal: 3,
  noColdTexts: true,
  noTextStates: ["WA"],
};

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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kija-compliance-"));
  fs.mkdirSync(path.join(root, "config"));
  fs.mkdirSync(path.join(root, "data", "runs"), { recursive: true });
  for (const f of ["categories.json", "geography.json", "chains.json"]) {
    fs.copyFileSync(new URL(`config/${f}`, PROJECT), path.join(root, "config", f));
  }
  const settings = JSON.parse(fs.readFileSync(new URL("config/settings.json", PROJECT), "utf8"));
  // Pin the parts these tests depend on, whatever the real settings say today.
  settings.compliance = structuredClone(COMPLIANCE);
  settings.contact = { ...settings.contact, email: "james@kijacreative.com", address: "" };
  const write = (rel, value) => fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`);
  write("config/settings.json", settings);
  const seed = JSON.parse(fs.readFileSync(new URL("seed/sheet-2026-09-28.json", PROJECT), "utf8"));
  const categories = JSON.parse(fs.readFileSync(path.join(root, "config", "categories.json"), "utf8"));
  const data = seedToData(seed, { now: MONDAY, thresholds: settings.thresholds });
  write("data/leads.json", data.leads);
  write("data/queue.json", data.queue);
  write("data/rejected.json", data.rejected);
  write("data/benchmarks.json", placeholderBenchmarks(categories, { updatedAt: "2026-09-28" }));
  return root;
}

const readJson = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const writeJson = (root, rel, value) => fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`);

async function start({ now = MONDAY, root = tempRoot() } = {}) {
  let clock = now;
  const server = createServer({
    root,
    now: () => new Date(clock),
    loaders: NO_MODULES,
    placesKey: () => false,
    log: () => {},
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, url, body) => {
    const res = await fetch(`${base}${url}`, {
      method,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // not JSON
    }
    return { status: res.status, text, json };
  };
  const lead = async (id = GM) => (await call("GET", "/api/state")).json.leads.find((l) => l.id === id);
  return {
    root,
    call,
    lead,
    setNow: (value) => {
      clock = value;
    },
    close: () => new Promise((resolve) => server.close(resolve)).then(() => fs.rmSync(root, { recursive: true, force: true })),
  };
}

test("every lead view carries callCheck, canText and emailReady at the request time", async (t) => {
  const s = await start();
  t.after(s.close);
  const state = (await s.call("GET", "/api/state")).json;
  for (const l of state.leads) {
    assert.ok(l.compliance, `${l.id} has compliance`);
    assert.equal(l.compliance.checkedAt, MONDAY);
    assert.equal(typeof l.compliance.call.ok, "boolean");
    assert.ok(Array.isArray(l.compliance.call.reasons));
    assert.equal(typeof l.compliance.text.ok, "boolean");
    assert.equal(typeof l.compliance.email.ok, "boolean");
    assert.equal(l.suppressed, null);
    assert.equal(l.phoneLineType, "unknown", "missing line type reads as unknown");
    assert.ok(!("placesFetchedAt" in l));
  }
  const gm = state.leads.find((l) => l.id === GM);
  assert.equal(gm.compliance.call.ok, true, gm.compliance.call.reasons.join(" "));
  assert.equal(gm.compliance.call.localLabel, "10:00 AM Monday, Central");
  assert.equal(gm.compliance.call.callsToday, 0);
  assert.equal(gm.compliance.call.callsTotal, 0);
  assert.ok(gm.compliance.call.reasons.includes(TEXAS), "Texas reminder while registration is unknown");
  assert.equal(gm.compliance.text.ok, false, "no cold texts");
  assert.equal(gm.compliance.email.ok, false, "no mailing address yet");
  assert.ok(gm.compliance.email.reasons.some((r) => /mailing address/.test(r)));
});

test("the call check follows the request clock: Sunday is outside the window", async (t) => {
  const s = await start({ now: SUNDAY });
  t.after(s.close);
  const gm = await s.lead();
  assert.equal(gm.compliance.call.ok, false);
  assert.match(gm.compliance.call.localLabel, /Sunday, Central/);
  assert.ok(gm.compliance.call.reasons.some((r) => /Sunday/.test(r)));

  // Logging a call is never blocked, but a call outside the rules is flagged at once.
  const logged = await s.call("POST", `/api/leads/${GM}/history`, { type: "call", text: "Called the shop line." });
  assert.equal(logged.status, 200, logged.text);
  assert.ok(logged.json.warnings.some((w) => /call check did not pass/.test(w)), logged.text);

  s.setNow(MONDAY);
  const monday = await s.lead();
  assert.equal(monday.compliance.call.callsTotal, 1);
  assert.equal(monday.compliance.call.callsToday, 0, "Sunday's call is not today's");
  await s.call("POST", `/api/leads/${GM}/history`, { type: "call", text: "No answer." });
  const after = await s.lead();
  assert.equal(after.compliance.call.callsToday, 1);
  assert.equal(after.compliance.call.ok, false, "one call a day");
});

test("POST suppress adds the business, closes the lead and is idempotent", async (t) => {
  const s = await start();
  t.after(s.close);
  const before = readJson(s.root, "data/leads.json").find((l) => l.id === GM);

  const noReason = await s.call("POST", `/api/leads/${GM}/suppress`, {});
  assert.equal(noReason.status, 422);
  assert.match(noReason.json.errors[0], /Say why/);
  const dash = await s.call("POST", `/api/leads/${GM}/suppress`, { reason: `Asked us to stop ${String.fromCharCode(0x2014)} politely` });
  assert.equal(dash.status, 422);
  const extra = await s.call("POST", `/api/leads/${GM}/suppress`, { reason: "x", status: "Won" });
  assert.equal(extra.status, 422);
  assert.ok(!fs.existsSync(path.join(s.root, "data/suppression.json")) || readJson(s.root, "data/suppression.json").length === 0, "nothing written on a refusal");
  const unknown = await s.call("POST", "/api/leads/no-such-lead/suppress", { reason: "Owner asked." });
  assert.equal(unknown.status, 404);

  const r = await s.call("POST", `/api/leads/${GM}/suppress`, { reason: "Owner asked not to be contacted" });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.ok, true);
  const list = readJson(s.root, "data/suppression.json");
  assert.equal(list.length, 1);
  assert.equal(list[0].key, "9726814966");
  assert.equal(list[0].business, "GM AUTO CARE");
  assert.equal(list[0].state, "TX");
  assert.equal(list[0].reason, "Owner asked not to be contacted");
  assert.equal(list[0].by, "Jamey");
  assert.match(list[0].addedAt, /^2026-09-28/);
  assert.deepEqual(r.json.suppression, list[0]);

  const lead = r.json.lead;
  assert.equal(lead.outreach.status, "Not a fit");
  assert.equal(lead.outreach.nextDate, "");
  assert.equal(lead.outreach.history.length, before.outreach.history.length + 1);
  const last = lead.outreach.history.at(-1);
  assert.equal(last.type, "suppressed");
  assert.equal(last.by, "Jamey");
  assert.equal(last.at, MONDAY);
  assert.match(last.text, /Owner asked not to be contacted\. Status New to Not a fit\./);
  assert.ok(lead.suppressed);
  assert.equal(lead.compliance.suppressed, true);
  assert.equal(lead.compliance.call.ok, false);
  assert.equal(lead.compliance.text.ok, false);
  assert.equal(lead.compliance.email.ok, false);

  const leadsAfter = fs.readFileSync(path.join(s.root, "data/leads.json"), "utf8");
  const again = await s.call("POST", `/api/leads/${GM}/suppress`, { reason: "Asked again" });
  assert.equal(again.status, 200, again.text);
  assert.ok(again.json.warnings.some((w) => /already on the do not contact list/.test(w)));
  assert.equal(readJson(s.root, "data/suppression.json").length, 1, "no second entry");
  assert.equal(readJson(s.root, "data/suppression.json")[0].reason, "Owner asked not to be contacted", "the first reason is kept");
  assert.equal(fs.readFileSync(path.join(s.root, "data/leads.json"), "utf8"), leadsAfter, "the lead is not touched again");
});

test("a suppressed lead cannot move back to active outreach or record consent", async (t) => {
  const s = await start();
  t.after(s.close);
  await s.call("POST", `/api/leads/${GM}/suppress`, { reason: "Owner said stop." });
  for (const status of ["New", "Research", "Demo Built", "Contacted", "Replied", "Meeting"]) {
    const r = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { status } });
    assert.equal(r.status, 422, `${status} is refused`);
    assert.ok(r.json.errors.some((e) => /cannot move back to/.test(e) && e.endsWith(".")), r.text);
  }
  const lost = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { status: "Lost" } });
  assert.equal(lost.status, 200, lost.text);
  const notes = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { status: "Lost", notes: "Keep off every list." } });
  assert.equal(notes.status, 200, "saving other fields at a closed status still works");
  const consent = await s.call("POST", `/api/leads/${GM}/history`, { type: "consent", text: "Agreed to texts." });
  assert.equal(consent.status, 422);
  assert.match(consent.json.errors.join(" "), /do not contact list/);
  const note = await s.call("POST", `/api/leads/${GM}/history`, { type: "note", text: "Owner called to confirm." });
  assert.equal(note.status, 200);
  const call = await s.call("POST", `/api/leads/${GM}/history`, { type: "call", text: "Returned their call." });
  assert.equal(call.status, 200);
  assert.ok(call.json.warnings.some((w) => /do not contact list/.test(w)));
});

test("a suppressed business cannot be promoted from the queue", async (t) => {
  const s = await start();
  t.after(s.close);
  const item = readJson(s.root, "data/queue.json").find((q) => q.candidate === "The Parlor Barbershop");
  writeJson(s.root, "data/suppression.json", [
    { key: "4696770690", business: "The Parlor Barbershop", city: "Dallas", state: "TX", phone: "469-677-0690", reason: "Owner asked not to be contacted.", addedAt: MONDAY, by: "Jamey" },
  ]);
  const lead = { websiteGap: 3, ticketValue: 1, visualFit: 3, confidence: "High", pitchAngle: "Give regulars one place to book.", demoConcept: "Warm barbershop site with booking." };
  const r = await s.call("POST", `/api/queue/${item.id}/decision`, { decision: "Promote", lead });
  assert.equal(r.status, 422);
  assert.ok(r.json.errors.some((e) => /do not contact list/.test(e)), r.text);
  assert.equal(readJson(s.root, "data/leads.json").length, 20);
});

test("consent can be recorded by hand and opens the text follow up", async (t) => {
  const s = await start();
  t.after(s.close);
  const bySystem = await s.call("POST", `/api/leads/${GM}/history`, { type: "suppressed", text: "x" });
  assert.equal(bySystem.status, 422, "suppressed entries come only from the suppress route");
  assert.match(bySystem.json.errors.join(" "), /Do not contact/);
  const r = await s.call("POST", `/api/leads/${GM}/history`, { type: "consent", text: "Owner agreed to texts at this number on the call." });
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(r.json.lead.outreach.history.at(-1), { at: MONDAY, by: "Jamey", type: "consent", text: "Owner agreed to texts at this number on the call." });
  assert.equal(r.json.lead.compliance.text.ok, true, r.json.lead.compliance.text.reason);
});

test("PATCH phoneLineType validates, saves and feeds the call check", async (t) => {
  const s = await start();
  t.after(s.close);
  const bad = await s.call("PATCH", `/api/leads/${GM}`, { phoneLineType: "cell" });
  assert.equal(bad.status, 422);
  assert.match(bad.json.errors[0], /unknown, landline, mobile, voip/);
  const mobile = await s.call("PATCH", `/api/leads/${GM}`, { phoneLineType: "mobile" });
  assert.equal(mobile.status, 200, mobile.text);
  assert.equal(mobile.json.lead.phoneLineType, "mobile");
  assert.ok(mobile.json.warnings.some((w) => /residential/.test(w)));
  assert.ok(mobile.json.lead.compliance.call.reasons.some((r) => /mobile/.test(r)));
  assert.equal(readJson(s.root, "data/leads.json").find((l) => l.id === GM).phoneLineType, "mobile");
  const land = await s.call("PATCH", `/api/leads/${GM}`, { phoneLineType: "landline" });
  assert.equal(land.status, 200);
  assert.ok(!land.json.lead.compliance.call.reasons.some((r) => /residential/.test(r)));
});

test("a write drops the retired placesFetchedAt field", async (t) => {
  const s = await start();
  t.after(s.close);
  const leads = readJson(s.root, "data/leads.json");
  leads.find((l) => l.id === GM).placesFetchedAt = "2026-09-01";
  writeJson(s.root, "data/leads.json", leads);
  const r = await s.call("PATCH", `/api/leads/${GM}`, { outreach: { notes: "Checked the listing by hand." } });
  assert.equal(r.status, 200, r.text);
  assert.ok(!("placesFetchedAt" in r.json.lead));
  assert.ok(!("placesFetchedAt" in readJson(s.root, "data/leads.json").find((l) => l.id === GM)));
});

test("PUT settings validates the compliance block and the mailing address", async (t) => {
  const s = await start();
  t.after(s.close);
  const registered = await s.call("PUT", "/api/settings", { compliance: { texasRegistration: "registered" } });
  assert.equal(registered.status, 200, registered.text);
  assert.equal(registered.json.settings.compliance.texasRegistration, "registered");
  assert.deepEqual(registered.json.settings.compliance.callWindow, COMPLIANCE.callWindow, "a partial change keeps the rest");
  assert.equal(readJson(s.root, "config/settings.json").compliance.texasRegistration, "registered");
  const gm = await s.lead();
  assert.ok(!gm.compliance.call.reasons.includes(TEXAS), "the Texas reminder goes once registration is confirmed");

  const bad = [
    { texasRegistration: "maybe" },
    { callWindow: { startHour: 20, endHour: 9 } },
    { callWindow: { days: [1, 9] } },
    { maxCallsPerDay: 4, maxCallsTotal: 3 },
    { noColdTexts: "yes" },
    { noTextStates: ["Washington"] },
    { autoDial: true },
  ];
  for (const compliance of bad) {
    const r = await s.call("PUT", "/api/settings", { compliance });
    assert.equal(r.status, 422, JSON.stringify(compliance));
    assert.ok(r.json.errors.length > 0);
  }
  assert.equal(readJson(s.root, "config/settings.json").compliance.texasRegistration, "registered", "refusals write nothing");

  const loose = await s.call("PUT", "/api/settings", { compliance: { maxCallsPerDay: 2, callWindow: { days: [0, 1, 2, 3, 4, 5, 6] }, noTextStates: [] } });
  assert.equal(loose.status, 200, loose.text);
  assert.ok(loose.json.warnings.some((w) => /one call a day|research default of one/.test(w)));
  assert.ok(loose.json.warnings.some((w) => /Sunday/.test(w)));
  assert.ok(loose.json.warnings.some((w) => /Washington/.test(w)));

  const badAddress = await s.call("PUT", "/api/settings", { contact: { address: "Dallas" } });
  assert.equal(badAddress.status, 422);
  assert.match(badAddress.json.errors.join(" "), /mailing address/);
  const address = await s.call("PUT", "/api/settings", { contact: { address: "PO Box 1234, Dallas, TX 75201" } });
  assert.equal(address.status, 200, address.text);
  assert.equal(address.json.settings.contact.address, "PO Box 1234, Dallas, TX 75201");
  assert.equal(address.json.settings.contact.email, "james@kijacreative.com", "the rest of contact is kept");
  const ready = await s.lead();
  assert.equal(ready.compliance.email.ok, true, ready.compliance.email.reasons.join(" "));
});

test("compliance.js is served to the browser with its one import", async (t) => {
  const s = await start();
  t.after(s.close);
  const r = await s.call("GET", "/src/lib/compliance.js");
  assert.equal(r.status, 200);
  assert.match(r.text, /export function callCheck/);
  const dep = await s.call("GET", "/src/lib/normalize.js");
  assert.equal(dep.status, 200);
});
