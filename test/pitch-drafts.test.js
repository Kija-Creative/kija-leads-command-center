import assert from "node:assert/strict";
import test from "node:test";
import { ADDRESS_PLACEHOLDER, formatRating, roiFor, wordCount } from "../src/pitch/shared.js";
import { COMPLIANCE, TEXAS_UNCONFIRMED } from "../src/pitch/compliance-link.js";
import {
  EMAIL_FOOTER,
  EMAIL_WORD_LIMIT,
  FOLLOW_UP_LABEL,
  OPT_OUT_LINE,
  SOLICITATION_LINE,
  TEXT_STOP_LINE,
  buildDrafts,
  callRulesLine,
  dayRange,
  hourWords,
} from "../src/pitch/drafts.js";
import { CATEGORIES, DASHES, LEADS, NOW, PLACEHOLDER, fullBenchmarks, hasDash, leadById, settingsWith } from "./pitch-fixtures.js";

// Monday September 28, 2026 at 10:00 a.m. Central, inside the call window for Texas leads.
const MONDAY_MORNING = "2026-09-28T15:00:00.000Z";
// Sunday September 27, 2026 at noon Central.
const SUNDAY_NOON = "2026-09-27T17:00:00.000Z";
// Monday September 28, 2026 at 9:30 p.m. Central.
const MONDAY_LATE = "2026-09-29T02:30:00.000Z";
const ADDRESS = "123 Example St, Dallas, TX 75201";

function drafts(lead, { settings = settingsWith(), benchmarks = PLACEHOLDER, now = MONDAY_MORNING, suppression = [], compliance } = {}) {
  return buildDrafts(lead, { settings, roi: roiFor(lead, { settings, benchmarks }), categories: CATEGORIES, now, suppression, compliance });
}

function allText(d) {
  return [d.email.subject, d.email.body, d.callScript, d.voicemail, d.followUpText, d.notes].join("\n");
}

// The heaviest case: themes, a confirmed price and sourced ROI all switched on.
function heavy(lead) {
  const l = structuredClone(lead);
  l.reviewThemes = ["Honest pricing on every repair", "Fast turnaround even on busy days", "Explains the work clearly"];
  return drafts(l, { settings: settingsWith({ priceConfirmed: true }), benchmarks: fullBenchmarks() });
}

function messageWords(body) {
  return wordCount(body) - wordCount(EMAIL_FOOTER);
}

function withHistory(lead, entries) {
  const l = structuredClone(lead);
  l.outreach.history = [...l.outreach.history, ...entries];
  return l;
}

function compliancePatch(patch) {
  const s = settingsWith();
  s.compliance = { ...(s.compliance ?? {}), ...patch };
  return s;
}

test("compliance.js is installed for this pass", () => {
  assert.ok(COMPLIANCE, "src/lib/compliance.js should load");
  for (const name of ["callCheck", "canText", "emailReady"]) assert.equal(typeof COMPLIANCE[name], "function", name);
});

test("drafts have the documented shape, with ready when compliance.js is installed", () => {
  const d = drafts(leadById("gm-auto-care"));
  assert.deepEqual(Object.keys(d).sort(), ["callScript", "email", "followUpText", "notes", "ready", "voicemail"]);
  assert.deepEqual(Object.keys(d.email).sort(), ["body", "subject"]);
  for (const v of [d.email.subject, d.email.body, d.callScript, d.voicemail, d.followUpText, d.notes]) {
    assert.equal(typeof v, "string");
    assert.ok(v.length > 0);
  }
  assert.deepEqual(Object.keys(d.ready).sort(), ["call", "email", "text"]);

  const without = drafts(leadById("gm-auto-care"), { compliance: null });
  assert.deepEqual(Object.keys(without).sort(), ["callScript", "email", "followUpText", "notes", "voicemail"], "no ready block without the module");
});

test("ready carries exactly what emailReady, callCheck and canText return", () => {
  const settings = settingsWith({}, { address: ADDRESS });
  const lead = leadById("gm-auto-care");
  const d = drafts(lead, { settings });
  assert.deepEqual(d.ready.email, COMPLIANCE.emailReady({ settings, lead, suppression: [] }));
  assert.deepEqual(d.ready.call, COMPLIANCE.callCheck({ lead, settings, now: MONDAY_MORNING, suppression: [] }));
  assert.deepEqual(d.ready.text, COMPLIANCE.canText({ lead, settings, suppression: [] }));
});

test("a stand in compliance module is used as given, and a check that throws becomes a failed result", () => {
  const fake = {
    emailReady: () => ({ ok: true, reasons: [] }),
    callCheck: () => {
      throw new Error("boom");
    },
    canText: () => ({ ok: true, reason: "Consent recorded." }),
  };
  const d = drafts(leadById("gm-auto-care"), { compliance: fake });
  assert.deepEqual(d.ready.email, { ok: true, reasons: [] });
  assert.equal(d.ready.call.ok, false);
  assert.match(d.ready.call.reasons[0], /callCheck check failed: boom/);
  assert.equal(d.ready.text.ok, true);
});

test("email readiness: not ready without Kija's postal address, ready with it", () => {
  const lead = leadById("gm-auto-care");
  const missing = drafts(lead);
  assert.equal(missing.ready.email.ok, false);
  assert.ok(missing.ready.email.reasons.some((r) => /mailing address/.test(r)));
  const ready = drafts(lead, { settings: settingsWith({}, { address: ADDRESS }) });
  assert.equal(ready.ready.email.ok, true, ready.ready.email.reasons.join(" "));
});

test("every email names itself a business solicitation and carries the opt out line and Kija's contact block", () => {
  for (const lead of LEADS) {
    const { body } = drafts(lead).email;
    assert.ok(body.includes(SOLICITATION_LINE), lead.id);
    assert.ok(body.includes(OPT_OUT_LINE), lead.id);
    assert.ok(body.includes("Design Director, Kija Creative"), lead.id);
    assert.ok(body.includes("james@kijacreative.com"), lead.id);
    assert.ok(body.includes("https://kijacreative.com"), lead.id);
    assert.ok(body.includes(ADDRESS_PLACEHOLDER), lead.id);
    assert.ok(body.trimEnd().endsWith(EMAIL_FOOTER), `${lead.id}: the footer closes the email`);
    assert.equal(body.split(SOLICITATION_LINE).length, 2, `${lead.id}: one solicitation line`);
  }
});

test("a mailing address in settings replaces the placeholder", () => {
  const settings = settingsWith({}, { address: ADDRESS, phone: "214-555-0100" });
  const d = buildDrafts(leadById("gm-auto-care"), { settings, roi: null, now: MONDAY_MORNING });
  assert.ok(d.email.body.includes(ADDRESS));
  assert.ok(!d.email.body.includes(ADDRESS_PLACEHOLDER));
  assert.ok(!d.notes.includes(ADDRESS_PLACEHOLDER));
  assert.ok(d.voicemail.includes("214-555-0100"));
});

test("email messages stay under the word limit, even with themes and a confirmed price", () => {
  for (const lead of LEADS) {
    const plain = drafts(lead).email.body;
    const full = heavy(lead).email.body;
    assert.ok(messageWords(plain) < EMAIL_WORD_LIMIT, `${lead.id}: ${messageWords(plain)} words`);
    assert.ok(messageWords(full) < EMAIL_WORD_LIMIT, `${lead.id} heavy: ${messageWords(full)} words`);
    assert.ok(full.includes(EMAIL_FOOTER), `${lead.id}: the footer is never dropped to fit`);
  }
  const long = { ...leadById("gm-auto-care"), business: "The Extremely Long Named Family Automotive Repair Collision Tire And Diesel Service Center Of North Texas" };
  assert.ok(messageWords(heavy(long).email.body) < EMAIL_WORD_LIMIT, "optional lines drop to fit");
  assert.ok(heavy(leadById("gm-auto-care")).email.body.includes("By my rough math"), "a short email keeps the ROI line");
});

test("drafts carry the business name and its real rating and review count", () => {
  for (const lead of LEADS) {
    const d = drafts(lead);
    const rating = formatRating(lead.googleRating);
    assert.ok(d.email.subject.includes(lead.business), lead.id);
    assert.ok(d.email.body.includes(lead.business), lead.id);
    assert.ok(d.email.body.includes(`${lead.googleReviews.toLocaleString("en-US")} Google reviews at ${rating} stars`), lead.id);
    assert.ok(d.callScript.includes(lead.business) && d.callScript.includes(rating), lead.id);
    assert.ok(d.voicemail.includes(lead.business) && d.voicemail.includes(rating), lead.id);
  }
});

test("the email leads with reputation and makes one ask", () => {
  const { body } = drafts(leadById("prime-time-septic")).email;
  const paragraphs = body.split("\n\n");
  assert.match(paragraphs[1], /^275 Google reviews at 5\.0 stars/);
  assert.equal((body.match(/\?/g) || []).length, 1, "exactly one question");
  assert.match(body, /15 minute look/);
  assert.equal(drafts(leadById("prime-time-septic")).email.subject, "A private homepage concept for Prime Time Septic Pumping, Inc.", "the subject describes the content");
});

test("drafts never say guarantee, never imply a relationship or a Google affiliation, and carry no false urgency", () => {
  const banned = [/guarantee/i, /as we discussed/i, /following up on our/i, /partner(ed)? with google/i, /google partner/i, /on behalf of google/i, /certified by google/i, /limited time/i, /act now/i, /only \d+ spots/i, /expires/i, /!/, /^(re|fwd):/im];
  for (const lead of LEADS) {
    for (const d of [drafts(lead), heavy(lead)]) {
      const text = allText(d);
      for (const re of banned) assert.ok(!re.test(text), `${lead.id} matched ${re}`);
    }
  }
});

test("no dash characters in any draft, even when research fields carry them", () => {
  for (const lead of LEADS) assert.ok(!hasDash(allText(heavy(lead))), lead.id);
  const dirty = { ...leadById("gm-auto-care"), business: `GM ${DASHES[0]} Auto`, reviewThemes: [`Fair ${DASHES[1]} fast`] };
  assert.ok(!hasDash(allText(drafts(dirty))));
});

test("the call script sets the calling rules: by hand, in the window, within the limits, stop at the first no", () => {
  const { callScript } = drafts(leadById("gm-auto-care"));
  assert.match(callScript, /Calls are dialed by a person/);
  assert.match(callScript, /No autodialer, no recorded or AI voice, no voicemail drops/);
  assert.match(callScript, /between 9 a\.m\. and 8 p\.m\. in the prospect's local time, Monday to Saturday/);
  assert.match(callScript, /at most one call a day and three in total/);
  assert.match(callScript, /Stop at the first no/);
  assert.match(callScript, /never close a sale on the phone/);
  assert.match(callScript, /Opening: [^\n]*Kija Creative[^\n]*calling about a homepage concept/, "the opening gives name, studio and purpose");
  assert.ok(callScript.indexOf("Before you dial") < callScript.indexOf("Opening:"), "rules come before the script");
});

test("the call rules follow settings.compliance", () => {
  const settings = compliancePatch({ callWindow: { startHour: 10, endHour: 18, days: [1, 2, 3, 4, 5] }, maxCallsPerDay: 2, maxCallsTotal: 4 });
  const { callScript } = drafts(leadById("gm-auto-care"), { settings });
  assert.match(callScript, /between 10 a\.m\. and 6 p\.m\. in the prospect's local time, Monday to Friday, at most two calls a day and four in total/);
  assert.equal(hourWords(12), "noon");
  assert.equal(hourWords(20), "8 p.m.");
  assert.equal(dayRange([1, 3, 5]), "Monday, Wednesday and Friday");
  assert.equal(dayRange([0, 1, 2, 3, 4, 5, 6]), "any day of the week");
  assert.match(callRulesLine({ callWindow: { startHour: 9, endHour: 20, days: [1, 2, 3, 4, 5, 6] }, maxCallsPerDay: 1, maxCallsTotal: 3 }), /Monday to Saturday/);
});

test("call readiness follows the prospect's local time and the call limits", () => {
  const lead = leadById("gm-auto-care");
  const open = drafts(lead, { now: MONDAY_MORNING }).ready.call;
  assert.equal(open.ok, true, open.reasons.join(" "));
  assert.equal(open.localLabel, "10:00 AM Monday, Central");
  assert.equal(drafts(lead, { now: SUNDAY_NOON }).ready.call.ok, false, "never on Sunday");
  assert.equal(drafts(lead, { now: MONDAY_LATE }).ready.call.ok, false, "never after 8 p.m.");
  const calledToday = withHistory(lead, [{ at: "2026-09-28T14:00:00.000Z", by: "Jamey", type: "call", text: "No answer." }]);
  const today = drafts(calledToday).ready.call;
  assert.equal(today.ok, false);
  assert.equal(today.callsToday, 1);
  const three = withHistory(lead, ["2026-09-21", "2026-09-23", "2026-09-25"].map((d) => ({ at: `${d}T15:00:00.000Z`, by: "Jamey", type: "call", text: "No answer." })));
  const total = drafts(three).ready.call;
  assert.equal(total.ok, false);
  assert.equal(total.callsTotal, 3);
  assert.ok(drafts(lead).notes.includes("Their local time when these drafts were made: 10:00 AM Monday, Central."));
  const noClock = buildDrafts(lead, { settings: settingsWith() }).ready.call;
  assert.equal(noClock.ok, false, "without now the window cannot be checked");
});

test("the Texas chapter 302 flag shows while registration is unknown and not once it is settled", () => {
  const unknown = drafts(leadById("gm-auto-care"));
  assert.ok(unknown.notes.includes(TEXAS_UNCONFIRMED));
  assert.ok(unknown.callScript.includes(`Check first: ${TEXAS_UNCONFIRMED}`));
  assert.ok(unknown.ready.call.reasons.includes(TEXAS_UNCONFIRMED));
  const legacy = settingsWith();
  delete legacy.compliance;
  assert.ok(drafts(leadById("gm-auto-care"), { settings: legacy }).notes.includes(TEXAS_UNCONFIRMED), "missing settings count as unknown");
  for (const status of ["registered", "exempt-confirmed"]) {
    const settled = drafts(leadById("gm-auto-care"), { settings: compliancePatch({ texasRegistration: status }) });
    assert.ok(!settled.notes.includes("chapter 302"), status);
    assert.ok(!settled.callScript.includes("chapter 302"), status);
  }
});

test("a mobile number is flagged as a possible personal cell", () => {
  const mobile = { ...leadById("gm-auto-care"), phoneLineType: "mobile" };
  const d = drafts(mobile);
  assert.match(d.callScript, /Line type: [^\n]*may be the owner's personal cell/);
  assert.match(d.notes, /may be the owner's personal cell/);
  const landline = drafts({ ...leadById("gm-auto-care"), phoneLineType: "landline" });
  assert.ok(!/personal cell/.test(landline.callScript));
  assert.ok(!/personal cell/.test(landline.notes));
  assert.match(drafts(leadById("gm-auto-care")).notes, /line type is not recorded/, "unknown line type gets a softer note");
});

test("the follow up text is labelled for after a reply or consent", () => {
  const d = drafts(leadById("gm-auto-care"));
  assert.ok(d.followUpText.startsWith(`[${FOLLOW_UP_LABEL}]`));
  assert.equal(FOLLOW_UP_LABEL, "Only after they reply or give consent");
  assert.ok(d.followUpText.includes(TEXT_STOP_LINE));
  assert.ok(d.followUpText.includes("Kija Creative"));
  assert.equal(d.ready.text.ok, false, "no consent recorded, so texting is not ready");
});

test("Washington numbers get no follow up text without recorded consent", () => {
  const wa = { ...leadById("gm-auto-care"), city: "Seattle", state: "WA", phone: "206-555-0142" };
  const d = drafts(wa);
  assert.equal(d.followUpText, "");
  assert.match(d.notes, /Washington bars commercial texts without consent/);
  assert.equal(d.ready.text.ok, false);

  const waAreaCode = { ...leadById("gm-auto-care"), city: "Portland", state: "OR", phone: "360-555-0142" };
  assert.equal(drafts(waAreaCode).followUpText, "", "a Washington area code counts too");

  const consented = withHistory(wa, [{ at: "2026-09-28T16:00:00.000Z", by: "Jamey", type: "consent", text: "Owner said to text this number about the walkthrough." }]);
  const ok = drafts(consented);
  assert.equal(ok.ready.text.ok, true);
  assert.ok(ok.followUpText.startsWith(`[${FOLLOW_UP_LABEL}]`), "with consent the text is back, still labelled");
  assert.equal(drafts(wa, { compliance: null }).followUpText, "", "the fallback rule holds without compliance.js");
});

test("a suppressed business gets no drafts at all", () => {
  const lead = leadById("gm-auto-care");
  const suppression = [{ key: "9726814966", business: lead.business, city: lead.city, state: lead.state, phone: lead.phone, reason: "Asked not to be contacted.", addedAt: NOW, by: "Jamey" }];
  for (const d of [drafts(lead, { suppression }), drafts(withHistory(lead, [{ at: NOW, by: "Jamey", type: "suppressed", text: "Asked us to stop." }]))]) {
    assert.equal(d.email.subject, "");
    assert.equal(d.email.body, "");
    assert.equal(d.callScript, "");
    assert.equal(d.voicemail, "");
    assert.equal(d.followUpText, "");
    assert.match(d.notes, /Do not contact GM AUTO CARE\. It is on the suppression list/);
    assert.equal(d.ready.email.ok, false);
    assert.equal(d.ready.call.ok, false);
    assert.equal(d.ready.text.ok, false);
  }
  const fallback = drafts(lead, { suppression, compliance: null });
  assert.equal(fallback.email.body, "", "the fallback matches the suppression key without compliance.js");
});

test("notes say nothing is sent automatically, the text needs consent and opt outs cover every channel", () => {
  const d = drafts(leadById("gm-auto-care"));
  assert.match(d.notes, /Nothing is sent automatically/);
  assert.match(d.notes, /only after the owner has replied or agreed to be texted/);
  assert.match(d.notes, /prior consent/);
  assert.match(d.notes, /suppression list the same day and covers every channel/);
  assert.match(d.notes, /Never use a recorded message or a voicemail drop/);
  assert.match(d.notes, /needs-recheck/, "flags an unverified lead");
});

test("price appears in drafts only when confirmed", () => {
  const lead = leadById("gm-auto-care");
  const hidden = drafts(lead, { settings: settingsWith({ price: 2750, priceConfirmed: false }) });
  assert.ok(!allText(hidden).includes("$2,750"));
  assert.match(hidden.notes, /price is not confirmed/);
  const shown = drafts(lead, { settings: settingsWith({ price: 2750, priceConfirmed: true }) });
  assert.ok(shown.callScript.includes("$2,750"));
});

test("drafts work without roi, categories or compliance.js", () => {
  const d = buildDrafts(leadById("adams-brothers-roof"), { settings: settingsWith(), compliance: null });
  assert.ok(d.email.body.includes("estimate requests"), "contractor falls back by category key");
  assert.ok(d.callScript.includes("Calls are dialed by a person"));
  assert.ok(d.notes.includes(TEXAS_UNCONFIRMED));
  assert.throws(() => buildDrafts(null, {}), /needs a lead/);
});
