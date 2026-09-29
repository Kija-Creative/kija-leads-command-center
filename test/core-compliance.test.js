import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  callCheck, canText, complianceSettings, DEFAULT_COMPLIANCE, emailReady, isSuppressed, localTimeFor, STATE_TIMEZONES,
  suppressionEntry, suppressionFor, TEXAS_UNCONFIRMED,
} from "../src/lib/compliance.js";
import { US_STATES } from "../src/lib/validate.js";

const settings = JSON.parse(fs.readFileSync(new URL("../config/settings.json", import.meta.url), "utf8"));
const DASHES = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
const withAddress = { ...settings, contact: { ...settings.contact, address: "123 Main St, Dallas, TX 75201" } };
const registered = { ...settings, compliance: { ...settings.compliance, texasRegistration: "registered" } };

function lead(overrides = {}) {
  return {
    business: "Ortega Brothers Auto Repair",
    city: "Houston",
    state: "TX",
    phone: "713-555-0142",
    phoneLineType: "landline",
    outreach: { status: "Demo Built", history: [{ at: "2026-09-28T12:00:00.000Z", by: "weekly-run", type: "created", text: "" }] },
    ...overrides,
  };
}

function withHistory(entries, overrides = {}) {
  const l = lead(overrides);
  l.outreach = { ...l.outreach, history: [...l.outreach.history, ...entries] };
  return l;
}

const call = (at) => ({ at, by: "Jamey", type: "call", text: "No answer." });

test("the settings file carries the compliance block and complianceSettings fills defaults", () => {
  assert.deepEqual(settings.compliance, DEFAULT_COMPLIANCE);
  assert.equal(settings.contact.address, "");
  assert.deepEqual(complianceSettings({}), DEFAULT_COMPLIANCE);
  const partial = complianceSettings({ compliance: { maxCallsTotal: 2, callWindow: { endHour: 18 } } });
  assert.equal(partial.maxCallsTotal, 2);
  assert.deepEqual(partial.callWindow, { startHour: 9, endHour: 18, days: [1, 2, 3, 4, 5, 6] });
  assert.deepEqual(partial.noTextStates, ["WA"]);
});

test("STATE_TIMEZONES covers all 50 states and DC with valid zones", () => {
  const needed = US_STATES.filter((s) => s !== "PR");
  assert.equal(needed.length, 51);
  for (const s of needed) {
    assert.ok(STATE_TIMEZONES[s], s);
    assert.doesNotThrow(() => new Intl.DateTimeFormat("en-US", { timeZone: STATE_TIMEZONES[s] }), s);
  }
});

test("split states use the zone that covers most people", () => {
  const expected = {
    TX: "America/Chicago", FL: "America/New_York", TN: "America/Chicago", KY: "America/New_York",
    IN: "America/Indiana/Indianapolis", MI: "America/Detroit", ID: "America/Boise", OR: "America/Los_Angeles",
    KS: "America/Chicago", NE: "America/Chicago", ND: "America/Chicago", SD: "America/Chicago", AZ: "America/Phoenix",
  };
  for (const [s, zone] of Object.entries(expected)) assert.equal(STATE_TIMEZONES[s], zone, s);
});

test("localTimeFor gives the wall clock and a readable label", () => {
  const t = localTimeFor("TX", "2026-10-06T15:42:00.000Z");
  assert.deepEqual(t, { timeZone: "America/Chicago", hour: 10, minute: 42, weekday: 2, date: "2026-10-06", label: "10:42 AM Tuesday, Central" });
  assert.equal(localTimeFor("ny", new Date("2026-10-06T16:05:00.000Z")).label, "12:05 PM Tuesday, Eastern");
  assert.equal(localTimeFor("HI", "2026-10-06T10:00:00.000Z").label, "12:00 AM Tuesday, Hawaii");
  assert.equal(localTimeFor("CA", "2026-10-06T04:30:00.000Z").weekday, 1, "late evening Pacific is still Monday");
  assert.equal(localTimeFor("ZZ", "2026-10-06T15:42:00.000Z"), null);
  assert.throws(() => localTimeFor("TX", "not a date"), /valid now/);
});

test("DST boundaries: fall back and spring forward move the local hour", () => {
  // DST ends Sunday November 1, 2026. 14:00 UTC is 9 AM CDT on Friday and 8 AM CST on Monday.
  assert.equal(localTimeFor("TX", "2026-10-30T14:00:00.000Z").hour, 9);
  assert.equal(localTimeFor("TX", "2026-11-02T14:00:00.000Z").hour, 8);
  assert.equal(localTimeFor("TX", "2026-11-01T06:30:00.000Z").hour, 1, "first 1 AM, still daylight time");
  assert.equal(localTimeFor("TX", "2026-11-01T07:30:00.000Z").hour, 1, "second 1 AM, standard time");
  assert.equal(callCheck({ lead: lead(), settings: registered, now: "2026-10-30T14:00:00.000Z" }).ok, true);
  const monday = callCheck({ lead: lead(), settings: registered, now: "2026-11-02T14:00:00.000Z" });
  assert.equal(monday.ok, false);
  assert.ok(monday.reasons.some((r) => /8:00 AM for this business\. Calls are only made from 9 a\.m\. to 8 p\.m\. local time\./.test(r)), monday.reasons.join(" | "));
  // DST starts Sunday March 8, 2026. 14:30 UTC is 8:30 AM CST on Friday and 9:30 AM CDT on Monday.
  assert.equal(callCheck({ lead: lead(), settings: registered, now: "2026-03-06T14:30:00.000Z" }).ok, false);
  assert.equal(callCheck({ lead: lead(), settings: registered, now: "2026-03-09T14:30:00.000Z" }).ok, true);
  assert.equal(localTimeFor("TX", "2026-03-08T08:30:00.000Z").hour, 3, "2 AM is skipped");
  // Arizona does not observe daylight saving time.
  assert.equal(localTimeFor("AZ", "2026-03-06T16:30:00.000Z").hour, 9);
  assert.equal(localTimeFor("AZ", "2026-03-09T16:30:00.000Z").hour, 9);
  assert.equal(localTimeFor("CO", "2026-03-09T16:30:00.000Z").hour, 10);
});

test("the call window is 9 a.m. up to 8 p.m. local, Monday to Saturday", () => {
  const at = (iso) => callCheck({ lead: lead(), settings: registered, now: iso });
  assert.equal(at("2026-10-06T13:59:00.000Z").ok, false, "8:59 AM Central");
  assert.equal(at("2026-10-06T14:00:00.000Z").ok, true, "9:00 AM Central");
  assert.equal(at("2026-10-07T00:59:00.000Z").ok, true, "7:59 PM Central");
  assert.equal(at("2026-10-07T01:00:00.000Z").ok, false, "8:00 PM Central");
  assert.equal(at("2026-10-10T17:00:00.000Z").ok, true, "Saturday noon");
  const sunday = at("2026-10-11T17:00:00.000Z");
  assert.equal(sunday.ok, false);
  assert.ok(sunday.reasons.some((r) => /It is Sunday for this business\. Calls are only made Monday, Tuesday, Wednesday, Thursday, Friday and Saturday\./.test(r)), sunday.reasons.join(" | "));
  assert.equal(sunday.localLabel, "12:00 PM Sunday, Central");
  // The window follows the lead's state, not Kija's: 9:30 AM Central is 7:30 AM Pacific.
  assert.equal(callCheck({ lead: lead({ state: "CA", phone: "213-555-0100" }), settings: registered, now: "2026-10-06T14:30:00.000Z" }).ok, false);
  const custom = { ...registered, compliance: { ...registered.compliance, callWindow: { startHour: 10, endHour: 17, days: [2] } } };
  assert.equal(callCheck({ lead: lead(), settings: custom, now: "2026-10-06T14:30:00.000Z" }).ok, false, "before 10");
  assert.equal(callCheck({ lead: lead(), settings: custom, now: "2026-10-06T15:30:00.000Z" }).ok, true);
});

test("call limits count call history entries, per local day and in total", () => {
  const now = "2026-10-06T15:00:00.000Z"; // 10 AM Tuesday Central
  const fresh = callCheck({ lead: lead(), settings: registered, now });
  assert.deepEqual({ ok: fresh.ok, callsToday: fresh.callsToday, callsTotal: fresh.callsTotal }, { ok: true, callsToday: 0, callsTotal: 0 });

  const today = callCheck({ lead: withHistory([call("2026-10-06T14:10:00.000Z"), { at: "2026-10-06T14:20:00.000Z", by: "Jamey", type: "note", text: "" }]), settings: registered, now });
  assert.equal(today.ok, false);
  assert.equal(today.callsToday, 1);
  assert.ok(today.reasons.some((r) => /1 call was already logged today; the limit is 1 a day\./.test(r)));

  // 11:30 PM Central on Monday is Tuesday in UTC but yesterday for the business.
  const lateMonday = callCheck({ lead: withHistory([call("2026-10-06T04:30:00.000Z")]), settings: registered, now });
  assert.equal(lateMonday.callsToday, 0);
  assert.equal(lateMonday.ok, true);

  const three = callCheck({ lead: withHistory([call("2026-09-29T15:00:00.000Z"), call("2026-10-01T15:00:00.000Z"), call("2026-10-02T15:00:00.000Z")]), settings: registered, now });
  assert.equal(three.ok, false);
  assert.equal(three.callsTotal, 3);
  assert.ok(three.reasons.some((r) => /3 calls are already logged; the limit is 3 in total/.test(r)));
});

test("Texas registration unknown adds a reason but does not block by itself", () => {
  const now = "2026-10-06T15:00:00.000Z";
  const r = callCheck({ lead: lead(), settings, now });
  assert.equal(r.ok, true);
  assert.ok(r.reasons.includes(TEXAS_UNCONFIRMED));
  assert.equal(TEXAS_UNCONFIRMED, "Texas phone solicitation status is unconfirmed. Check chapter 302 with an attorney before phone outreach.");
  assert.ok(!callCheck({ lead: lead(), settings: registered, now }).reasons.includes(TEXAS_UNCONFIRMED));
  const exempt = { ...settings, compliance: { ...settings.compliance, texasRegistration: "exempt-confirmed" } };
  assert.ok(!callCheck({ lead: lead(), settings: exempt, now }).reasons.includes(TEXAS_UNCONFIRMED));
});

test("mobile or unknown lines are flagged as possibly residential; missing phone, state or now blocks", () => {
  const now = "2026-10-06T15:00:00.000Z";
  const mobile = callCheck({ lead: lead({ phoneLineType: "mobile" }), settings: registered, now });
  assert.equal(mobile.ok, true);
  assert.ok(mobile.reasons.some((r) => /may be treated as residential; email first/.test(r)));
  assert.ok(callCheck({ lead: lead({ phoneLineType: undefined }), settings: registered, now }).reasons.some((r) => /line type is unknown/.test(r)));
  assert.deepEqual(callCheck({ lead: lead(), settings: registered, now }).reasons, []);
  assert.equal(callCheck({ lead: lead({ phone: "" }), settings: registered, now }).ok, false);
  const noState = callCheck({ lead: lead({ state: "" }), settings: registered, now });
  assert.equal(noState.ok, false);
  assert.equal(noState.localLabel, "");
  const noNow = callCheck({ lead: lead(), settings: registered });
  assert.equal(noNow.ok, false);
  assert.ok(noNow.reasons.some((r) => /current time was not given/.test(r)));
});

test("suppression blocks calls, texts and email, by list or by history", () => {
  const now = "2026-10-06T15:00:00.000Z";
  const suppression = [{ key: "7135550142", business: "Ortega Brothers Auto Repair", city: "Houston", state: "TX", phone: "713-555-0142", reason: "Asked not to be contacted", addedAt: "2026-10-01", by: "Jamey" }];
  const c = callCheck({ lead: lead(), settings: registered, now, suppression });
  assert.equal(c.ok, false);
  assert.ok(c.reasons[0].includes("is on the suppression list") && c.reasons[0].endsWith("Reason: Asked not to be contacted."), c.reasons[0]);
  const consented = withHistory([{ at: "2026-10-02T15:00:00.000Z", by: "Jamey", type: "consent", text: "Owner said to text him." }]);
  assert.equal(canText({ lead: consented, settings, suppression }).ok, false);
  assert.equal(emailReady({ settings: withAddress, lead: lead(), suppression }).ok, false);

  const byHistory = withHistory([{ at: "2026-10-02T15:00:00.000Z", by: "Jamey", type: "suppressed", text: "Opted out by phone." }]);
  assert.equal(isSuppressed(byHistory, []), true);
  assert.equal(callCheck({ lead: byHistory, settings: registered, now }).ok, false);

  // Matching survives a reformatted phone and a name only entry.
  assert.ok(suppressionFor(lead({ phone: "(713) 555-0142" }), suppression));
  assert.ok(suppressionFor(lead({ phone: "" }), [{ key: "ortega brothers auto repair|TX", business: "Ortega Brothers Auto Repair", state: "TX" }]));
  assert.equal(suppressionFor(lead({ phone: "214-555-0000", state: "OK" }), suppression), null);
  assert.equal(isSuppressed(lead(), undefined), false);
});

test("texts need recorded consent that mentions texts; Washington never without it", () => {
  const cold = canText({ lead: lead(), settings });
  assert.deepEqual(cold, { ok: false, reason: "No consent to texts is recorded. Cold texts are never sent." });
  const emailOnly = canText({ lead: withHistory([{ at: "2026-10-02T15:00:00.000Z", by: "Jamey", type: "consent", text: "Asked for a follow up by email." }]), settings });
  assert.equal(emailOnly.ok, false);
  assert.match(emailOnly.reason, /does not mention texts/);
  const ok = canText({ lead: withHistory([{ at: "2026-10-02T15:00:00.000Z", by: "Jamey", type: "consent", text: "Owner agreed to texts at this number." }]), settings });
  assert.equal(ok.ok, true);
  assert.match(ok.reason, /2026-10-02/);

  const wa = lead({ state: "WA", city: "Seattle", phone: "206-555-0100" });
  const waCold = canText({ lead: wa, settings });
  assert.equal(waCold.ok, false);
  assert.match(waCold.reason, /Washington/);
  const waEmailOnly = canText({ lead: withHistory([{ at: "2026-10-02T15:00:00.000Z", by: "Jamey", type: "consent", text: "Email is fine." }], { state: "WA", phone: "206-555-0100" }), settings });
  assert.match(waEmailOnly.reason, /Washington/);
  const waConsent = canText({ lead: withHistory([{ at: "2026-10-02T15:00:00.000Z", by: "Jamey", type: "consent", text: "Said to text him." }], { state: "WA", phone: "206-555-0100" }), settings });
  assert.equal(waConsent.ok, true, "recorded consent allows a Washington text");
  // A Washington area code listed under an Oregon address is still a Washington cell.
  assert.match(canText({ lead: lead({ state: "OR", phone: "360-555-0100" }), settings }).reason, /Washington/);
});

test("email is ready only with Kija's mailing address and reply email", () => {
  const empty = emailReady({ settings, lead: lead() });
  assert.equal(empty.ok, false);
  assert.ok(empty.reasons.some((r) => /mailing address/.test(r)));
  assert.deepEqual(emailReady({ settings: withAddress, lead: lead() }), { ok: true, reasons: [] });
  assert.deepEqual(emailReady({ settings: withAddress }), { ok: true, reasons: [] }, "a lead is optional");
  const noEmail = emailReady({ settings: { ...withAddress, contact: { ...withAddress.contact, email: "" } } });
  assert.ok(noEmail.reasons.some((r) => /reply email/.test(r)));
});

test("suppressionEntry builds a list entry keyed by dedupeKey", () => {
  const e = suppressionEntry(lead(), { reason: "Asked not to be contacted.", by: "Jamey", now: "2026-10-06T15:00:00.000Z" });
  assert.deepEqual(e, { key: "7135550142", business: "Ortega Brothers Auto Repair", city: "Houston", state: "TX", phone: "713-555-0142", reason: "Asked not to be contacted.", addedAt: "2026-10-06T15:00:00.000Z", by: "Jamey" });
});

test("every sentence is a sentence with no dashes", () => {
  const now = "2026-10-11T03:00:00.000Z";
  const results = [
    ...callCheck({ lead: withHistory([call("2026-10-10T15:00:00.000Z"), call("2026-10-08T15:00:00.000Z"), call("2026-10-09T15:00:00.000Z")], { phoneLineType: "mobile" }), settings, now }).reasons,
    canText({ lead: lead(), settings }).reason,
    canText({ lead: lead({ state: "WA" }), settings }).reason,
    ...emailReady({ settings: { contact: {} } }).reasons,
  ];
  assert.ok(results.length >= 7);
  for (const r of results) {
    assert.match(r, /\.$/, r);
    assert.doesNotMatch(r, DASHES);
  }
});
