import assert from "node:assert/strict";
import test from "node:test";
import { ADDRESS_PLACEHOLDER, formatRating, roiFor, wordCount } from "../src/pitch/shared.js";
import { buildDrafts, EMAIL_WORD_LIMIT, OPT_OUT_LINE, TEXT_STOP_LINE } from "../src/pitch/drafts.js";
import { CATEGORIES, DASHES, LEADS, PLACEHOLDER, fullBenchmarks, hasDash, leadById, settingsWith } from "./pitch-fixtures.js";

function drafts(lead, { settings = settingsWith(), benchmarks = PLACEHOLDER } = {}) {
  return buildDrafts(lead, { settings, roi: roiFor(lead, { settings, benchmarks }), categories: CATEGORIES });
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

test("drafts have the documented shape", () => {
  const d = drafts(leadById("gm-auto-care"));
  assert.deepEqual(Object.keys(d).sort(), ["callScript", "email", "followUpText", "notes", "voicemail"]);
  assert.deepEqual(Object.keys(d.email).sort(), ["body", "subject"]);
  for (const v of [d.email.subject, d.email.body, d.callScript, d.voicemail, d.followUpText, d.notes]) {
    assert.equal(typeof v, "string");
    assert.ok(v.length > 0);
  }
});

test("every email contains the opt out line and Kija's contact block with the address placeholder", () => {
  for (const lead of LEADS) {
    const { body } = drafts(lead).email;
    assert.ok(body.includes(OPT_OUT_LINE), lead.id);
    assert.ok(body.includes("Design Director, Kija Creative"), lead.id);
    assert.ok(body.includes("james@kijacreative.com"), lead.id);
    assert.ok(body.includes("https://kijacreative.com"), lead.id);
    assert.ok(body.includes(ADDRESS_PLACEHOLDER), lead.id);
  }
});

test("a mailing address in settings replaces the placeholder", () => {
  const settings = settingsWith({}, { address: "123 Example St, Dallas, TX 75201", phone: "214-555-0100" });
  const d = buildDrafts(leadById("gm-auto-care"), { settings, roi: null });
  assert.ok(d.email.body.includes("123 Example St, Dallas, TX 75201"));
  assert.ok(!d.email.body.includes(ADDRESS_PLACEHOLDER));
  assert.ok(!d.notes.includes(ADDRESS_PLACEHOLDER));
  assert.ok(d.voicemail.includes("214-555-0100"));
});

test("email bodies stay under the word limit, even with themes and a confirmed price", () => {
  for (const lead of LEADS) {
    const plain = drafts(lead).email.body;
    const full = heavy(lead).email.body;
    assert.ok(wordCount(plain) < EMAIL_WORD_LIMIT, `${lead.id}: ${wordCount(plain)} words`);
    assert.ok(wordCount(full) < EMAIL_WORD_LIMIT, `${lead.id} heavy: ${wordCount(full)} words`);
  }
  const long = { ...leadById("gm-auto-care"), business: "The Extremely Long Named Family Automotive Repair Collision Tire And Diesel Service Center Of North Texas" };
  assert.ok(wordCount(heavy(long).email.body) < EMAIL_WORD_LIMIT, "optional lines drop to fit");
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
});

test("drafts never say guarantee, never imply a relationship or a Google affiliation, and carry no false urgency", () => {
  const banned = [/guarantee/i, /as we discussed/i, /following up on our/i, /partner(ed)? with google/i, /google partner/i, /on behalf of google/i, /limited time/i, /act now/i, /only \d+ spots/i, /expires/i, /!/];
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

test("notes say nothing is sent automatically and the text needs consent", () => {
  const d = drafts(leadById("gm-auto-care"));
  assert.match(d.notes, /Nothing is sent automatically/);
  assert.match(d.notes, /only after the owner has replied or agreed to be texted/);
  assert.match(d.notes, /prior consent/);
  assert.match(d.notes, /needs-recheck/, "flags an unverified lead");
  assert.ok(d.followUpText.includes(TEXT_STOP_LINE));
});

test("price appears in drafts only when confirmed", () => {
  const lead = leadById("gm-auto-care");
  const hidden = drafts(lead, { settings: settingsWith({ price: 2750, priceConfirmed: false }) });
  assert.ok(!allText(hidden).includes("$2,750"));
  assert.match(hidden.notes, /price is not confirmed/);
  const shown = drafts(lead, { settings: settingsWith({ price: 2750, priceConfirmed: true }) });
  assert.ok(shown.callScript.includes("$2,750"));
});

test("drafts work without roi or categories", () => {
  const d = buildDrafts(leadById("adams-brothers-roof"), { settings: settingsWith() });
  assert.ok(d.email.body.includes("estimate requests"), "contractor falls back by category key");
  assert.throws(() => buildDrafts(null, {}), /needs a lead/);
});
