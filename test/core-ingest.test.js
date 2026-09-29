import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ingestBatch } from "../src/lib/ingest.js";
import { dedupeKey } from "../src/lib/normalize.js";
import { scoreLead } from "../src/lib/score.js";
import { seedToData } from "../src/lib/seed.js";
import { validateLead, validateQueueItem, validateRejection } from "../src/lib/validate.js";

const read = (rel) => JSON.parse(fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));
const settings = read("config/settings.json");
const categories = read("config/categories.json");
const geography = read("config/geography.json");
const chains = read("config/chains.json");
const seed = read("seed/sheet-2026-09-28.json");
const NOW = "2026-10-05T14:00:00.000Z";
const RUN = "2026-10-05";

function baseState(overrides = {}) {
  const { leads, queue, rejected } = seedToData(seed, { now: "2026-09-28T12:00:00.000Z", thresholds: settings.thresholds });
  return { settings, categories, geography, chains, benchmarks: {}, leads, queue, rejected, ...overrides };
}

// Distinct, valid weekly leads. n picks the phone and name; score varies with reviews.
function lead(n, overrides = {}) {
  return {
    business: `Test Shop ${n} Auto Repair`,
    category: "Auto repair",
    categoryKey: "auto-repair",
    city: "Houston",
    state: "TX",
    metro: "houston",
    phone: `713-555-${String(1000 + n).slice(-4)}`,
    googleRating: 4.8,
    googleReviews: 40 + n * 10,
    ratingSource: "google-maps-observed",
    websiteGap: 3,
    ticketValue: 3,
    visualFit: 2,
    websiteStatus: "No owned website surfaced.",
    confidence: "High",
    whyKija: "Strong reviews and no owned site.",
    pitchAngle: "The reputation is already there; give it a home.",
    demoConcept: "Trust first repair site.",
    reviewThemes: ["Honest pricing", "Quick service"],
    sources: [`https://example.org/listing/${n}`],
    verification: {
      status: "verified",
      checkedAt: RUN,
      checks: [
        { check: "exact-name search", result: "No owned domain.", url: "" },
        { check: "phone search", result: "Directories only.", url: "" },
        { check: "Maps website field", result: "Blank.", url: "" },
      ],
      notes: "",
    },
    ...overrides,
  };
}

function batch(extra = {}) {
  return {
    runId: RUN,
    mode: "weekly",
    plan: { metros: ["houston"], categories: ["auto-repair"] },
    searched: [{ query: "auto repair houston", source: "google-maps", notes: "" }],
    leads: [],
    queue: [],
    rejected: [],
    reverify: [],
    notes: "",
    ...extra,
  };
}

test("new leads get the system fields, a created history entry and pass stored validation", () => {
  const { state, report } = ingestBatch({ batch: batch({ leads: [lead(1)] }), state: baseState(), now: NOW });
  assert.equal(report.counts.accepted, 1);
  const added = state.leads.find((l) => l.id === "test-shop-1-auto-repair-houston-tx");
  assert.ok(added);
  assert.equal(added.origin, "weekly-run");
  assert.equal(added.runId, RUN);
  assert.equal(added.addedAt, "2026-10-05");
  assert.equal(added.outreach.status, "New");
  assert.deepEqual(added.demo, { builtAt: "", template: "", palette: "", shareApproved: false });
  const score = scoreLead(added).total;
  assert.deepEqual(added.outreach.history, [
    { at: NOW, by: "weekly-run", type: "created", text: `Added by weekly run ${RUN} with score ${score}.` },
  ]);
  assert.deepEqual(added.sources, [{ url: "https://example.org/listing/1", label: "example.org", checkedAt: RUN }], "bare source urls become objects");
  const v = validateLead(added, { settings, categories, chains, geography, now: NOW, mode: "stored" });
  assert.equal(v.ok, true, v.errors.join(" | "));
  assert.equal(report.runId, RUN);
  assert.deepEqual(Object.keys(report.counts).sort(), ["accepted", "candidates", "duplicates", "errors", "queued", "rejected", "reverified"]);
});

test("ingesting the same batch twice changes nothing the second time", () => {
  const b = batch({
    leads: [lead(1), lead(2), lead(3, { googleRating: 4.3 })],
    queue: [{ candidate: "Maybe Plumbing", city: "Houston", state: "TX", phone: "713-555-7001", googleRating: 4.9, googleReviews: 18, sources: ["https://example.org/maybe"], whyItMayFit: "Young but strong." }],
    rejected: [{ business: "Has A Site Roofing", city: "Houston", state: "TX", phone: "713-555-7002", reason: "Owns hasasiteroofing.com.", evidenceUrl: "https://hasasiteroofing.com" }],
    reverify: [{ id: "gm-auto-care-dallas-tx", googleReviews: 520, sources: ["https://example.org/gm-recheck"], decision: "keep" }],
  });
  const first = ingestBatch({ batch: b, state: baseState(), now: NOW });
  assert.equal(first.report.changed, true);
  assert.equal(first.report.counts.accepted, 2);
  assert.equal(first.report.counts.queued, 2);
  assert.equal(first.report.counts.rejected, 1);
  assert.equal(first.report.counts.reverified, 1);

  const second = ingestBatch({ batch: b, state: first.state, now: "2026-10-05T15:30:00.000Z" });
  assert.equal(second.report.changed, false);
  assert.deepEqual(second.state.leads, first.state.leads);
  assert.deepEqual(second.state.queue, first.state.queue);
  assert.deepEqual(second.state.rejected, first.state.rejected);
  assert.equal(second.report.counts.accepted, 0);
  assert.equal(second.report.counts.reverified, 0);
  assert.equal(second.report.counts.duplicates, 5, "leads, queue item and rejection all match now");
});

test("quota overflow goes to the queue as Qualified overflow, ranked by score", () => {
  const leads = Array.from({ length: 12 }, (_, i) => lead(i + 1));
  const { state, report } = ingestBatch({ batch: batch({ leads }), state: baseState(), now: NOW });
  assert.equal(report.counts.accepted, 10);
  assert.equal(report.counts.queued, 2);
  // Scores rise with n, so shops 1 and 2 are the overflow.
  const overflow = state.queue.filter((q) => q.runId === RUN);
  assert.deepEqual(overflow.map((q) => q.candidate).sort(), ["Test Shop 1 Auto Repair", "Test Shop 2 Auto Repair"]);
  for (const q of overflow) {
    assert.equal(q.reason, "Qualified overflow");
    assert.equal(q.decision, "Research");
    assert.equal(q.lead.business, q.candidate, "the partial lead rides along for promotion");
    assert.equal(validateQueueItem(q, { categories, chains, mode: "stored" }).ok, true);
  }
});

test("the quota counts leads this run already added", () => {
  const firstHalf = ingestBatch({ batch: batch({ leads: Array.from({ length: 8 }, (_, i) => lead(i + 1)) }), state: baseState(), now: NOW });
  assert.equal(firstHalf.report.counts.accepted, 8);
  const more = ingestBatch({ batch: batch({ leads: Array.from({ length: 4 }, (_, i) => lead(i + 20)) }), state: firstHalf.state, now: NOW });
  assert.equal(more.report.counts.accepted, 2);
  assert.equal(more.report.counts.queued, 2);
});

test("the home metro cap holds extra home leads in the queue with a warning", () => {
  const home = Array.from({ length: 5 }, (_, i) => lead(i + 1, { city: "Dallas", metro: "dallas-fort-worth", phone: `214-555-${String(2000 + i)}` }));
  const { report, state } = ingestBatch({ batch: batch({ leads: home }), state: baseState(), now: NOW });
  assert.equal(report.counts.accepted, settings.geography.homeMaxLeads);
  assert.equal(report.counts.queued, 5 - settings.geography.homeMaxLeads);
  assert.ok(report.warnings.some((w) => w.warnings.some((t) => /home metro cap of 3/.test(t))));
  assert.ok(state.queue.filter((q) => q.runId === RUN).every((q) => q.reason === "Qualified overflow"));
});

test("leads failing only threshold floors become queue items with the reason", () => {
  const { state, report } = ingestBatch({ batch: batch({ leads: [lead(1, { googleRating: 4.3 }), lead(2, { googleReviews: 12, websiteGap: 1 })] }), state: baseState(), now: NOW });
  assert.equal(report.counts.accepted, 0);
  assert.equal(report.counts.queued, 2);
  const q1 = state.queue.find((q) => q.candidate === "Test Shop 1 Auto Repair");
  assert.equal(q1.reason, "Rating 4.3 is below the 4.5 floor.");
  const q2 = state.queue.find((q) => q.candidate === "Test Shop 2 Auto Repair");
  assert.equal(q2.reason, "12 reviews is below the 20 review floor. Website gap 1 is below the minimum of 2.");
});

test("invalid leads go to report.errors, not the queue", () => {
  const { state, report } = ingestBatch({
    batch: batch({ leads: [lead(1, { whyKija: undefined }), lead(2, { business: "Jiffy Lube Houston" }), lead(3, { googleRating: 4.2, confidence: "Great" })] }),
    state: baseState(),
    now: NOW,
  });
  assert.equal(report.counts.errors, 3);
  assert.equal(report.counts.queued, 0);
  assert.equal(state.queue.length, baseState().queue.length);
  assert.ok(report.errors[0].errors.some((e) => /required field whyKija/.test(e)));
  assert.ok(report.errors[1].errors.some((e) => /chain or franchise/.test(e)));
});

test("duplicates of leads, queue, rejected and earlier batch rows are skipped and reported", () => {
  const state = baseState({
    rejected: [{ key: "7135559999", business: "Old Reject", city: "Houston", state: "TX", phone: "713-555-9999", reason: "Owns a site.", evidenceUrl: "", rejectedAt: "2026-09-28", runId: "2026-09-28" }],
  });
  const b = batch({
    leads: [
      lead(1, { business: "Totally Different Name", phone: "(972) 681-4966" }), // GM AUTO CARE phone
      lead(2, { business: "P V Auto Services", city: "Dallas", metro: "dallas-fort-worth" }), // queue name and state
      lead(3, { phone: "713-555-9999" }), // rejected key
      lead(4),
      lead(4, { business: "Test Shop 4 Auto Repair" }), // same as previous row
    ],
  });
  const { report } = ingestBatch({ batch: b, state, now: NOW });
  assert.equal(report.counts.accepted, 1);
  assert.deepEqual(report.duplicates.map((d) => [d.in, d.matched]), [
    ["leads", "gm-auto-care-dallas-tx"],
    ["queue", "p-v-auto-services-dallas-tx"],
    ["rejected", "7135559999"],
    ["batch", "Test Shop 4 Auto Repair"],
  ]);
});

test("ingest never touches outreach on existing leads except appending history", () => {
  const state = baseState();
  const target = state.leads.find((l) => l.id === "gm-auto-care-dallas-tx");
  target.outreach = {
    status: "Contacted",
    nextAction: "Follow up call",
    nextDate: "2026-10-08",
    owner: "Jamey",
    notes: "Owner asked for Thursday.",
    history: [
      ...target.outreach.history,
      { at: "2026-10-01T15:00:00.000Z", by: "Jamey", type: "status", text: "New to Contacted" },
    ],
  };
  const before = structuredClone(target.outreach);
  const b = batch({
    leads: [lead(1, { business: "GM AUTO CARE", city: "Dallas", metro: "dallas-fort-worth", phone: "972-681-4966", googleReviews: 999 })],
    reverify: [{ id: "gm-auto-care-dallas-tx", googleRating: 4.8, googleReviews: 530, decision: "reject", reason: "Now has an owned site." }],
  });
  const { state: next, report } = ingestBatch({ batch: b, state, now: NOW });
  const after = next.leads.find((l) => l.id === "gm-auto-care-dallas-tx");
  const { history: historyAfter, ...restAfter } = after.outreach;
  const { history: historyBefore, ...restBefore } = before;
  assert.deepEqual(restAfter, restBefore, "status, next action, date, owner and notes are unchanged");
  assert.deepEqual(historyAfter.slice(0, historyBefore.length), historyBefore, "history is append only");
  assert.equal(historyAfter.length, historyBefore.length + 1);
  assert.equal(historyAfter.at(-1).type, "research");
  assert.equal(after.googleReviews, 530, "research fields do refresh");
  assert.equal(report.duplicates.length, 1, "the duplicate lead row did not overwrite anything");
  assert.ok(report.warnings.some((w) => w.warnings.some((t) => /at stage Contacted, so the reverify reject was not applied/.test(t))));
  assert.deepEqual(state.leads.find((l) => l.id === "gm-auto-care-dallas-tx").outreach, before, "the input state was not mutated");
});

test("reverify updates research fields, merges sources by url and records one research entry", () => {
  const state = baseState();
  const b = batch({
    reverify: [{
      id: "als-auto-repair-shop-dallas-tx",
      googleRating: 4.9,
      googleReviews: 320,
      websiteGap: 3,
      websiteStatus: "Rechecked: still no owned website.",
      confidence: "High",
      verification: { status: "verified", checkedAt: RUN, checks: [{ check: "exact-name search", result: "None.", url: "" }] },
      sources: [
        "https://txinspectors.net/business/tx/dallas/als-auto-repair-shop/",
        { url: "https://example.org/als", label: "example.org" },
      ],
      decision: "keep",
      reason: "",
    }],
  });
  const { state: next, report } = ingestBatch({ batch: b, state, now: NOW });
  const als = next.leads.find((l) => l.id === "als-auto-repair-shop-dallas-tx");
  assert.equal(als.googleRating, 4.9);
  assert.equal(als.googleReviews, 320);
  assert.equal(als.websiteStatus, "Rechecked: still no owned website.");
  assert.equal(als.verification.status, "verified");
  assert.equal(als.sources.length, 3, "one new url added, the known one merged");
  assert.equal(als.sources.find((s) => s.url.includes("txinspectors")).checkedAt, RUN, "the rechecked url gets the new date");
  const entry = als.outreach.history.at(-1);
  assert.equal(entry.type, "research");
  assert.equal(entry.by, "weekly-run");
  assert.match(entry.text, /^Reverify 2026-10-05: rating 4\.8 to 4\.9; reviews 308 to 320; website status /);
  assert.match(entry.text, /verification "needs-recheck" to "verified"/);
  assert.match(entry.text, /1 source added, 1 source rechecked\.$/);
  assert.equal(als.outreach.status, "New");
  assert.deepEqual(report.reverified, ["als-auto-repair-shop-dallas-tx"]);

  const again = ingestBatch({ batch: b, state: next, now: NOW });
  assert.equal(again.report.counts.reverified, 0);
  assert.deepEqual(again.state.leads, next.leads);
});

test("reverify never stores a places-api rating and drops the retired placesFetchedAt", () => {
  const state = baseState();
  for (const id of ["als-auto-repair-shop-dallas-tx", "gm-auto-care-dallas-tx"]) {
    Object.assign(state.leads.find((l) => l.id === id), { ratingSource: "places-api", placesFetchedAt: "2026-09-01" });
  }
  const b = batch({
    reverify: [
      { id: "als-auto-repair-shop-dallas-tx", googleRating: 4.8, ratingSource: "places-api", placesFetchedAt: RUN, decision: "keep", reason: "" },
      { id: "gm-auto-care-dallas-tx", googleRating: 4.9, ratingSource: "google-maps", placeId: "ChIJgm", placeIdCheckedAt: RUN, decision: "keep", reason: "" },
      { id: "top-tier-auto-repair-dallas-tx", placesFetchedAt: "October 5", phoneLineType: "landline", decision: "keep", reason: "" },
    ],
  });
  const { state: next, report } = ingestBatch({ batch: b, state, now: NOW });
  assert.ok(report.errors.some((e) => e.errors.some((t) => /ratingSource is places-api, which may not be stored/.test(t))));
  const als = next.leads.find((l) => l.id === "als-auto-repair-shop-dallas-tx");
  assert.equal(als.ratingSource, "places-api", "the rejected entry changed nothing");
  const gm = next.leads.find((l) => l.id === "gm-auto-care-dallas-tx");
  assert.equal(gm.ratingSource, "google-maps-observed", "the legacy google-maps value is stored under its new name");
  assert.equal(gm.placeId, "ChIJgm");
  assert.equal(gm.placeIdCheckedAt, RUN);
  assert.equal(Object.hasOwn(gm, "placesFetchedAt"), false, "the retired field is dropped when the lead changes");
  assert.match(gm.outreach.history.at(-1).text, /rating source "places-api" to "google-maps-observed"/);
  const tt = next.leads.find((l) => l.id === "top-tier-auto-repair-dallas-tx");
  assert.equal(tt.phoneLineType, "landline");
  assert.ok(!report.errors.some((e) => e.errors.some((t) => /placesFetchedAt/.test(t))), "a retired field is accepted, not an error");
});

test("suppressed businesses are never ingested again", () => {
  const state = baseState({
    suppression: [
      { key: "7135551001", business: "Test Shop 1 Auto Repair", city: "Houston", state: "TX", phone: "713-555-1001", reason: "Asked not to be contacted.", addedAt: "2026-10-01T15:00:00.000Z", by: "Jamey" },
      { key: "test shop 2 auto repair|TX", business: "Test Shop 2 Auto Repair", city: "Houston", state: "TX", phone: "", reason: "Owner said no.", addedAt: "2026-10-01T15:00:00.000Z", by: "Jamey" },
    ],
  });
  const { state: next, report } = ingestBatch({
    batch: batch({
      leads: [lead(1), lead(2, { phone: "713-555-9902" }), lead(3)],
      queue: [{ candidate: "Test Shop 1 Auto Repair", city: "Houston", state: "TX", phone: "(713) 555-1001", sources: [] }],
      rejected: [{ business: "Test Shop 2 Auto Repair", state: "TX", reason: "Has a site." }],
    }),
    state,
    now: NOW,
  });
  assert.deepEqual(report.accepted, ["test-shop-3-auto-repair-houston-tx"]);
  assert.equal(report.duplicates.filter((d) => d.in === "suppressed").length, 4);
  assert.ok(report.warnings.some((w) => w.warnings.some((t) => /on the suppression list/.test(t))));
  assert.equal(next.queue.length, state.queue.length);
  assert.equal(next.rejected.length, 0);
});

test("reverify reject moves New or Research to Not a fit and leaves later stages alone", () => {
  const state = baseState();
  state.leads.find((l) => l.id === "mustang-service-center-dallas-tx").outreach.status = "Meeting";
  const b = batch({
    reverify: [
      { id: "fenix-auto-body-shop-dallas-tx", decision: "reject", reason: "An owned site went live at fenixautobody.com." },
      { id: "brownies-dallas-tx", decision: "reject", reason: "Closed permanently." },
      { id: "mustang-service-center-dallas-tx", decision: "reject", reason: "Now a franchise." },
      { id: "no-such-lead", decision: "keep" },
    ],
  });
  const { state: next, report } = ingestBatch({ batch: b, state, now: NOW });
  const fenix = next.leads.find((l) => l.id === "fenix-auto-body-shop-dallas-tx");
  assert.equal(fenix.outreach.status, "Not a fit");
  assert.deepEqual(fenix.outreach.history.at(-1), {
    at: NOW, by: "weekly-run", type: "status", text: "Research to Not a fit. Reverify 2026-10-05: An owned site went live at fenixautobody.com.",
  });
  assert.equal(next.leads.find((l) => l.id === "brownies-dallas-tx").outreach.status, "Not a fit");
  const mustang = next.leads.find((l) => l.id === "mustang-service-center-dallas-tx");
  assert.equal(mustang.outreach.status, "Meeting");
  assert.equal(mustang.outreach.history.length, 1, "no history entry when nothing changed");
  assert.ok(report.warnings.some((w) => w.business === "Mustang Service Center"));
  assert.ok(report.errors.some((e) => e.errors.some((t) => /No lead with id no-such-lead exists/.test(t))));

  const again = ingestBatch({ batch: b, state: next, now: NOW });
  assert.equal(again.report.changed, false, "Not a fit is not rejected twice");
});

test("queue and rejected entries from the batch are added after dedupe", () => {
  const b = batch({
    queue: [
      { candidate: "Young Fence Co", city: "Houston", state: "TX", phone: "(713) 555-7100", googleRating: 5, googleReviews: 14, sources: ["https://example.org/young"], reason: "Too few reviews yet" },
      { candidate: "P V Auto Services", city: "Dallas", state: "TX", phone: "214-828-9690" },
    ],
    rejected: [
      { business: "Owned Site Plumbing", city: "Houston", state: "TX", phone: "713-555-7200", reason: "Owns ownedsiteplumbing.com.", evidenceUrl: "https://ownedsiteplumbing.com" },
      { business: "Brownie's", city: "Dallas", state: "TX", phone: "214-526-9207", reason: "Has a site." },
    ],
  });
  const { state, report } = ingestBatch({ batch: b, state: baseState(), now: NOW });
  const young = state.queue.find((q) => q.candidate === "Young Fence Co");
  assert.equal(young.phone, "713-555-7100");
  assert.equal(young.reason, "Too few reviews yet");
  assert.equal(young.addedAt, "2026-10-05");
  assert.equal(young.runId, RUN);
  assert.equal(validateQueueItem(young, { categories, chains, mode: "stored" }).ok, true);
  const rej = state.rejected.find((r) => r.business === "Owned Site Plumbing");
  assert.equal(rej.key, dedupeKey(rej));
  assert.equal(rej.rejectedAt, "2026-10-05");
  assert.equal(validateRejection(rej, { mode: "stored" }).ok, true);
  assert.equal(report.counts.duplicates, 2);
  assert.ok(report.warnings.some((w) => w.warnings.some((t) => /matches existing lead brownies-dallas-tx/.test(t))));
});

test("an invalid batch changes nothing", () => {
  const state = baseState();
  const { state: next, report } = ingestBatch({ batch: { runId: "last monday", leads: [lead(1)] }, state, now: NOW });
  assert.equal(next.leads, state.leads);
  assert.equal(report.changed, false);
  assert.equal(report.errors[0].business, "(batch)");
});

test("leads, queue and rejected stay sorted by date then id", () => {
  const { state } = ingestBatch({ batch: batch({ leads: [lead(1), lead(2)] }), state: baseState(), now: NOW });
  const keys = state.leads.map((l) => `${l.addedAt}|${l.id}`);
  assert.deepEqual(keys, [...keys].sort());
  assert.equal(state.leads.at(-1).addedAt, "2026-10-05");
});
