// Read models the API returns: a Lead plus everything computed from it. Scores and ROI are
// always computed here, never stored.

import fs from "node:fs";
import path from "node:path";
import { scoreLead } from "../src/lib/score.js";
import { benchmarkFor, computeRoi } from "../src/lib/roi.js";
import { callCheck, canText, emailReady, isSuppressed, PHONE_LINE_TYPES, suppressionFor } from "../src/lib/compliance.js";

export { PHONE_LINE_TYPES, suppressionFor };

export function demoFile(root, id) {
  return path.join(root, "demos", id, "index.html");
}

export function pitchFile(root, id) {
  return path.join(root, "pitches", id, "index.html");
}

function exists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

// callCheck, canText and emailReady for one lead at the request time, so the lead page can
// say whether a call is appropriate right now and which drafts are ready.
export function complianceView(lead, state, { now }) {
  const settings = state.settings ?? {};
  const suppression = Array.isArray(state.suppression) ? state.suppression : [];
  const safe = (fn, fallback) => {
    try {
      return fn();
    } catch (err) {
      // One bad record should not take the whole pipeline down; the lead says why instead.
      return fallback(`The compliance check failed: ${err?.message ?? err}`);
    }
  };
  return {
    checkedAt: now,
    suppressed: isSuppressed(lead, suppression),
    call: safe(() => callCheck({ lead, settings, now, suppression }), (msg) => ({ ok: false, reasons: [msg], callsToday: 0, callsTotal: 0, localLabel: "" })),
    text: safe(() => canText({ lead, settings, suppression }), (msg) => ({ ok: false, reason: msg })),
    email: safe(() => emailReady({ settings, lead, suppression }), (msg) => ({ ok: false, reasons: [msg] })),
  };
}

// drafts is buildDrafts from src/pitch/drafts.js, or null while that module is missing.
export function leadView(lead, state, { root, buildDrafts = null, now = new Date().toISOString() }) {
  const settings = state.settings ?? {};
  const score = scoreLead(lead, { thresholds: settings.thresholds });
  const roi = computeRoi({
    lead,
    benchmark: benchmarkFor(state.benchmarks, lead.categoryKey),
    offer: settings.offer,
    overrides: lead.roiOverrides ?? {},
  });
  let drafts = null;
  if (typeof buildDrafts === "function") {
    try {
      drafts = buildDrafts(lead, { settings, roi, categories: state.categories, suppression: state.suppression ?? [], now }) ?? null;
    } catch {
      // A drafts failure should not take the whole pipeline down; the lead shows no drafts.
      drafts = null;
    }
  }
  const { placesFetchedAt: _retired, ...rest } = lead;
  return {
    ...rest,
    phoneLineType: PHONE_LINE_TYPES.includes(lead.phoneLineType) ? lead.phoneLineType : "unknown",
    score,
    roi,
    demoExists: exists(demoFile(root, lead.id)),
    pitchExists: exists(pitchFile(root, lead.id)),
    drafts,
    suppressed: suppressionFor(lead, state.suppression),
    compliance: complianceView(lead, state, { now }),
  };
}

function countList(value) {
  return Array.isArray(value) ? value.length : 0;
}

// Runs are small, so the summary carries the whole report plus derived counts the list shows.
export function runSummary(report) {
  const counts = report?.counts ?? {};
  return {
    ...report,
    counts: {
      candidates: counts.candidates ?? 0,
      accepted: counts.accepted ?? countList(report?.accepted),
      queued: counts.queued ?? countList(report?.queued),
      rejected: counts.rejected ?? countList(report?.rejected),
      duplicates: counts.duplicates ?? countList(report?.duplicates),
      reverified: counts.reverified ?? countList(report?.reverified),
      errors: counts.errors ?? countList(report?.errors),
    },
  };
}

export function stateView(state, runs, { root, buildDrafts, placesKey, now, templates }) {
  return {
    leads: (state.leads ?? []).map((lead) => leadView(lead, state, { root, buildDrafts, now })),
    queue: state.queue ?? [],
    runs: (runs ?? []).map(runSummary),
    rejectedCount: countList(state.rejected),
    suppressionCount: countList(state.suppression),
    settings: state.settings,
    categories: state.categories,
    geography: state.geography,
    benchmarks: state.benchmarks,
    templates: templates ?? null,
    modules: { drafts: typeof buildDrafts === "function" },
    env: { placesKey: Boolean(placesKey) },
    now,
  };
}
