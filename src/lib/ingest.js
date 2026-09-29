// Weekly batch ingest. Pure: takes the current state and returns the next one plus a report.
// Outreach on existing leads is never edited, except the documented reverify reject rule
// and appended history entries.

import { hostname, nameStateKey, normalizePhone, phoneDigits, slugify, dedupeKey } from "./normalize.js";
import { scoreLead } from "./score.js";
import { PHONE_LINE_TYPES } from "./compliance.js";
import {
  findDashes, isIsoDate, validateBatch, validateLead, validateQueueItem, validateRejection, CONFIDENCE_LEVELS,
  LEGACY_RATING_SOURCES, PLACES_RATING_SOURCE, RATING_SOURCES, RETIRED_LEAD_FIELDS,
} from "./validate.js";

const EMPTY_PRESENCE = { facebook: "", instagram: "", yelp: "", booking: "", other: [] };
// Fields the weekly run may not set on a new lead; the system owns them.
const SYSTEM_FIELDS = ["id", "outreach", "demo", "addedAt", "origin", "runId"];

function currentRatingSource(value) {
  return Object.hasOwn(LEGACY_RATING_SOURCES, value ?? "") ? LEGACY_RATING_SOURCES[value] : value;
}

// Retired fields (placesFetchedAt) are accepted in a batch and never written.
function dropRetired(record) {
  for (const f of RETIRED_LEAD_FIELDS) delete record[f];
  return record;
}
const EARLY_STAGES = ["New", "Research"];

function toIso(now) {
  const d = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(d.getTime())) throw new TypeError(`ingestBatch needs a valid now; got ${JSON.stringify(now)}.`);
  return d.toISOString();
}

function clone(v) {
  return v === undefined ? undefined : structuredClone(v);
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function coerceSources(sources, checkedAt) {
  if (!Array.isArray(sources)) return sources;
  return sources.map((s) => {
    if (typeof s === "string") return { url: s, label: hostname(s), checkedAt };
    if (s && typeof s === "object") {
      return { url: s.url ?? "", label: s.label || hostname(s.url), checkedAt: s.checkedAt || checkedAt };
    }
    return s;
  });
}

function tidyPhone(phone) {
  if (typeof phone !== "string" && typeof phone !== "number") return phone;
  return normalizePhone(phone) || String(phone);
}

function tidyState(state) {
  return typeof state === "string" ? state.trim().toUpperCase() : state;
}

// Light, lossless tidying so a researcher's "(214) 946-4100" or bare source urls pass.
function prepareLead(raw, runId) {
  const lead = clone(raw) ?? {};
  for (const f of SYSTEM_FIELDS) delete lead[f];
  if (lead.phone !== undefined) lead.phone = tidyPhone(lead.phone);
  if (lead.state !== undefined) lead.state = tidyState(lead.state);
  if (lead.ratingSource !== undefined) lead.ratingSource = currentRatingSource(lead.ratingSource);
  lead.sources = coerceSources(lead.sources, runId);
  return dropRetired(lead);
}

function prepareQueueItem(raw, runId) {
  const item = clone(raw) ?? {};
  for (const f of ["id", "addedAt", "updatedAt", "runId"]) delete item[f];
  if (item.candidate === undefined && item.business !== undefined) {
    item.candidate = item.business;
    delete item.business;
  }
  if (item.phone !== undefined) item.phone = tidyPhone(item.phone);
  if (item.state !== undefined) item.state = tidyState(item.state);
  item.sources = coerceSources(item.sources ?? [], runId);
  if (item.lead && typeof item.lead === "object") {
    dropRetired(item.lead);
    if (item.lead.ratingSource !== undefined) item.lead.ratingSource = currentRatingSource(item.lead.ratingSource);
  }
  return dropRetired(item);
}

function prepareRejection(raw) {
  const r = clone(raw) ?? {};
  for (const f of ["key", "rejectedAt", "runId"]) delete r[f];
  if (r.phone !== undefined) r.phone = tidyPhone(r.phone);
  if (r.state !== undefined) r.state = tidyState(r.state);
  return r;
}

// Phone and name|state index over everything already known, for the duplicate rule.
function createIndex() {
  const phones = new Map();
  const names = new Map();
  return {
    add(record, where, id) {
      const business = record.business ?? record.candidate;
      const entry = { in: where, id };
      const digits = phoneDigits(record.phone);
      if (digits && !phones.has(digits)) phones.set(digits, entry);
      if (business) {
        const k = nameStateKey({ business, state: record.state });
        if (!names.has(k)) names.set(k, entry);
      }
      // Rejections may carry only a key.
      if (record.key) {
        if (/^\d{10}$/.test(record.key)) {
          if (!phones.has(record.key)) phones.set(record.key, entry);
        } else if (!names.has(record.key)) {
          names.set(record.key, entry);
        }
      }
    },
    find(record) {
      const digits = phoneDigits(record.phone);
      if (digits && phones.has(digits)) return phones.get(digits);
      const business = record.business ?? record.candidate;
      if (!business) return null;
      return names.get(nameStateKey({ business, state: record.state })) ?? null;
    },
  };
}

function uniqueId(base, taken) {
  const root = base || "lead";
  let id = root;
  for (let n = 2; taken.has(id); n += 1) id = `${root}-${n}`;
  taken.add(id);
  return id;
}

function buildLead(prepared, { id, runId, today, nowIso, score }) {
  const lead = {
    id,
    business: prepared.business,
    category: prepared.category,
    categoryKey: prepared.categoryKey,
    city: prepared.city,
    area: prepared.area ?? "",
    state: prepared.state,
    metro: prepared.metro ?? "",
    address: prepared.address ?? "",
    phone: prepared.phone,
    googleRating: prepared.googleRating,
    googleReviews: prepared.googleReviews,
    ratingSource: prepared.ratingSource ?? "",
    googleMapsUrl: prepared.googleMapsUrl ?? "",
    phoneLineType: prepared.phoneLineType ?? "unknown",
    placeId: prepared.placeId ?? "",
    placeIdCheckedAt: prepared.placeIdCheckedAt ?? "",
    websiteGap: prepared.websiteGap,
    ticketValue: prepared.ticketValue,
    visualFit: prepared.visualFit,
    websiteStatus: prepared.websiteStatus,
    presence: { ...EMPTY_PRESENCE, ...(prepared.presence ?? {}) },
    confidence: prepared.confidence,
    whyKija: prepared.whyKija,
    pitchAngle: prepared.pitchAngle,
    demoConcept: prepared.demoConcept,
    services: prepared.services ?? [],
    reviewThemes: prepared.reviewThemes ?? [],
    languages: prepared.languages ?? [],
    established: prepared.established ?? null,
    hours: prepared.hours ?? "",
    demoCopy: prepared.demoCopy ?? {},
    sources: prepared.sources ?? [],
    verification: prepared.verification ?? { status: "unverified", checkedAt: "", checks: [], notes: "" },
    outreach: {
      status: "New",
      nextAction: "Build private homepage demo",
      nextDate: "",
      owner: "",
      notes: "",
      history: [
        { at: nowIso, by: "weekly-run", type: "created", text: `Added by weekly run ${runId} with score ${score}.` },
      ],
    },
    demo: { builtAt: "", template: "", palette: "", shareApproved: false },
    roiOverrides: prepared.roiOverrides ?? {},
    addedAt: today,
    origin: "weekly-run",
    runId,
  };
  // Keep any extra researcher fields (for example notes) without letting them shadow system fields.
  for (const [k, v] of Object.entries(prepared)) if (!(k in lead)) lead[k] = v;
  return lead;
}

function queueItemFromLead(prepared, { id, reason, verificationNeeded, runId, today }) {
  return {
    id,
    candidate: prepared.business,
    category: prepared.category ?? "",
    categoryKey: prepared.categoryKey ?? "",
    city: prepared.city ?? "",
    state: prepared.state ?? "",
    metro: prepared.metro ?? "",
    whyItMayFit: prepared.whyKija ?? "",
    websiteStatus: prepared.websiteStatus ?? "",
    verificationNeeded,
    ownerContact: "",
    phone: prepared.phone ?? "",
    googleRating: prepared.googleRating ?? null,
    googleReviews: prepared.googleReviews ?? null,
    sources: prepared.sources ?? [],
    decision: "Research",
    reason,
    lead: prepared,
    addedAt: today,
    updatedAt: today,
    runId,
  };
}

function byAddedThenId(a, b) {
  return String(a.addedAt).localeCompare(String(b.addedAt)) || String(a.id).localeCompare(String(b.id));
}

function byRejectedThenKey(a, b) {
  return String(a.rejectedAt).localeCompare(String(b.rejectedAt)) || String(a.key).localeCompare(String(b.key));
}

function describeValue(v) {
  if (v === "" || v === undefined || v === null) return "blank";
  return typeof v === "string" ? `"${v}"` : String(v);
}

function mergeSources(existing, incoming) {
  const out = (existing ?? []).map((s) => ({ ...s }));
  let added = 0;
  let refreshed = 0;
  for (const s of incoming ?? []) {
    if (!s?.url) continue;
    const i = out.findIndex((x) => x.url === s.url);
    if (i < 0) {
      out.push({ ...s });
      added += 1;
    } else if (!deepEqual({ ...out[i], ...s }, out[i])) {
      out[i] = { ...out[i], ...s };
      refreshed += 1;
    }
  }
  return { sources: out, added, refreshed };
}

function reverifyErrors(entry, lead) {
  const errors = [];
  const name = lead?.business ?? entry.id;
  if (entry.googleRating !== undefined && entry.googleRating !== null) {
    if (typeof entry.googleRating !== "number" || entry.googleRating < 0 || entry.googleRating > 5) {
      errors.push(`${name} reverify googleRating must be a number from 0 to 5.`);
    }
  }
  if (entry.googleReviews !== undefined && entry.googleReviews !== null && (!Number.isInteger(entry.googleReviews) || entry.googleReviews < 0)) {
    errors.push(`${name} reverify googleReviews must be a whole number of 0 or more.`);
  }
  if (entry.websiteGap !== undefined && entry.websiteGap !== null && entry.websiteGap !== 0
    && (!Number.isInteger(entry.websiteGap) || entry.websiteGap < 1 || entry.websiteGap > 3)) {
    errors.push(`${name} reverify websiteGap must be 1, 2 or 3.`);
  }
  if (entry.confidence && !CONFIDENCE_LEVELS.includes(entry.confidence)) {
    errors.push(`${name} reverify confidence must be one of: ${CONFIDENCE_LEVELS.join(", ")}.`);
  }
  if (entry.ratingSource === PLACES_RATING_SOURCE) {
    errors.push(`${name} reverify ratingSource is places-api, which may not be stored. Only place IDs may be kept from the Places API; reread the rating on the public Google Maps listing and send google-maps-observed.`);
  } else if (entry.ratingSource && !RATING_SOURCES.includes(currentRatingSource(entry.ratingSource))) {
    errors.push(`${name} reverify ratingSource must be google-maps-observed, secondary or owner.`);
  }
  if (entry.placeIdCheckedAt && !isIsoDate(String(entry.placeIdCheckedAt).slice(0, 10))) {
    errors.push(`${name} reverify placeIdCheckedAt must be a date like 2026-09-28.`);
  }
  if (entry.placeId !== undefined && entry.placeId !== null && typeof entry.placeId !== "string") {
    errors.push(`${name} reverify placeId must be text.`);
  }
  if (entry.phoneLineType && !PHONE_LINE_TYPES.includes(entry.phoneLineType)) {
    errors.push(`${name} reverify phoneLineType must be one of: ${PHONE_LINE_TYPES.join(", ")}.`);
  }
  return errors;
}

// 0 and "" in a reverify entry mean "not re-measured", matching the batch template.
function provided(v) {
  return v !== undefined && v !== null && v !== "" && v !== 0;
}

function applyReverify(rawEntry, lead, { runId, nowIso }) {
  // placesFetchedAt is retired: accepted in the entry, never applied.
  const entry = dropRetired({ ...rawEntry, ratingSource: currentRatingSource(rawEntry.ratingSource) });
  const next = dropRetired(clone(lead));
  const changes = [];
  const fields = [
    ["googleRating", "rating"],
    ["googleReviews", "reviews"],
    ["websiteGap", "website gap"],
    ["websiteStatus", "website status"],
    ["confidence", "confidence"],
    ["ratingSource", "rating source"],
    ["phoneLineType", "phone line type"],
    // A refreshed place ID (free IDs only Place Details call) and the date it was confirmed.
    ["placeId", "place ID"],
    ["placeIdCheckedAt", "place ID check date"],
  ];
  for (const [field, label] of fields) {
    const value = entry[field];
    // A real review count of 0 is allowed when a rating is also sent.
    const has = field === "googleReviews" ? value !== undefined && value !== null && (value !== 0 || provided(entry.googleRating)) : provided(value);
    if (has && !deepEqual(next[field], value)) {
      changes.push(`${label} ${describeValue(next[field])} to ${describeValue(value)}`);
      next[field] = value;
    }
  }
  if (entry.verification && typeof entry.verification === "object" && Object.keys(entry.verification).length > 0) {
    const merged = { ...(next.verification ?? {}), ...clone(entry.verification) };
    if (!deepEqual(merged, next.verification)) {
      const before = next.verification?.status;
      changes.push(before !== merged.status
        ? `verification ${describeValue(before)} to ${describeValue(merged.status)}`
        : "verification checks refreshed");
      next.verification = merged;
    }
  }
  if (Array.isArray(entry.sources) && entry.sources.length > 0) {
    const m = mergeSources(next.sources, coerceSources(entry.sources, runId));
    if (m.added || m.refreshed) {
      const bits = [];
      if (m.added) bits.push(`${m.added} source${m.added === 1 ? "" : "s"} added`);
      if (m.refreshed) bits.push(`${m.refreshed} source${m.refreshed === 1 ? "" : "s"} rechecked`);
      changes.push(bits.join(", "));
      next.sources = m.sources;
    }
  }
  if (changes.length > 0) {
    next.outreach.history.push({
      at: nowIso,
      by: "weekly-run",
      type: "research",
      text: `Reverify ${runId}: ${changes.join("; ")}.`,
    });
  }
  return { next, changes };
}

export function ingestBatch({ batch, state, now }) {
  const nowIso = toIso(now);
  const today = nowIso.slice(0, 10);
  const settings = state?.settings ?? {};
  const thresholds = settings.thresholds;
  const ctx = { settings, categories: state?.categories, chains: state?.chains, geography: state?.geography, now: nowIso };

  const b = batch ?? {};
  const report = {
    runId: b.runId ?? "",
    ingestedAt: nowIso,
    mode: b.mode ?? "weekly",
    plan: b.plan ?? null,
    counts: { candidates: 0, accepted: 0, queued: 0, rejected: 0, duplicates: 0, reverified: 0, errors: 0 },
    accepted: [],
    queued: [],
    rejected: [],
    reverified: [],
    duplicates: [],
    errors: [],
    warnings: [],
    searched: Array.isArray(b.searched) ? b.searched : [],
    notes: typeof b.notes === "string" ? b.notes : "",
    changed: false,
  };

  const unchanged = { ...state, leads: state?.leads ?? [], queue: state?.queue ?? [], rejected: state?.rejected ?? [] };
  const vb = validateBatch(b);
  if (vb.warnings.length) report.warnings.push({ business: "(batch)", warnings: vb.warnings });
  if (!vb.ok) {
    report.errors.push({ business: "(batch)", errors: vb.errors });
    report.counts.errors = 1;
    return { state: unchanged, report };
  }

  const runId = b.runId;
  const batchLeads = b.leads ?? [];
  const batchQueue = b.queue ?? [];
  const batchRejected = b.rejected ?? [];
  report.counts.candidates = batchLeads.length + batchQueue.length + batchRejected.length;

  const leads = unchanged.leads.map((l) => l);
  const queue = unchanged.queue.map((q) => q);
  const rejected = unchanged.rejected.map((r) => r);
  const leadIds = new Set(leads.map((l) => l.id));
  const queueIds = new Set(queue.map((q) => q.id));

  const index = createIndex();
  for (const l of leads) index.add(l, "leads", l.id);
  for (const q of queue) index.add(q, "queue", q.id);
  for (const r of rejected) index.add(r, "rejected", r.key);
  // Suppressed businesses are never ingested again, the same as rejected ones.
  for (const s of Array.isArray(state?.suppression) ? state.suppression : []) index.add(s, "suppressed", s.key);

  const warn = (business, warnings) => {
    if (warnings.length) report.warnings.push({ business, warnings });
  };
  const fail = (business, errors) => {
    report.errors.push({ business, errors });
    report.counts.errors += 1;
  };
  const duplicate = (business, hit) => {
    report.duplicates.push({ business, matched: hit.id, in: hit.in });
    report.counts.duplicates += 1;
    if (hit.in === "suppressed") warn(business, [`${business} is on the suppression list, so it is never ingested again.`]);
  };
  const addQueue = (item) => {
    queue.push(item);
    report.queued.push(item.id);
    report.counts.queued += 1;
  };

  // 1 to 3: validate, dedupe, split floor failures from qualified leads.
  const qualified = [];
  batchLeads.forEach((raw, i) => {
    const prepared = prepareLead(raw, runId);
    const business = prepared.business || `Lead ${i + 1}`;
    const v = validateLead(prepared, { ...ctx, mode: "weekly" });
    const hard = v.errors.filter((e) => !v.floors.includes(e));
    if (hard.length > 0) {
      fail(business, v.errors);
      return;
    }
    const hit = index.find(prepared);
    if (hit) {
      duplicate(business, hit);
      return;
    }
    index.add(prepared, "batch", business);
    warn(business, v.warnings);
    if (v.floors.length > 0) {
      const id = uniqueId(slugify(`${prepared.business} ${prepared.city} ${prepared.state}`), queueIds);
      addQueue(queueItemFromLead(prepared, {
        id,
        reason: v.floors.join(" "),
        verificationNeeded: `Recheck before promotion: ${v.floors.join(" ")}`,
        runId,
        today,
      }));
      return;
    }
    qualified.push({ prepared, score: scoreLead(prepared, { thresholds }).total });
  });

  // 4: rank, fill the quota (minus anything this run already added), overflow to the queue.
  qualified.sort((a, b2) => b2.score - a.score
    || (b2.prepared.googleReviews ?? 0) - (a.prepared.googleReviews ?? 0)
    || (b2.prepared.googleRating ?? 0) - (a.prepared.googleRating ?? 0)
    || String(a.prepared.business).localeCompare(String(b2.prepared.business)));
  const quota = Number.isInteger(settings.weeklyQuota) ? settings.weeklyQuota : 10;
  const thisRun = leads.filter((l) => l.runId === runId && l.origin === "weekly-run");
  let room = Math.max(0, quota - thisRun.length);
  const homeKey = settings.geography?.homeMetro ?? "";
  const homeMax = settings.geography?.homeMaxLeads;
  let homeRoom = Number.isInteger(homeMax) ? Math.max(0, homeMax - thisRun.filter((l) => l.metro === homeKey).length) : Infinity;

  for (const { prepared, score } of qualified) {
    const isHome = homeKey !== "" && prepared.metro === homeKey;
    if (room > 0 && (!isHome || homeRoom > 0)) {
      const id = uniqueId(slugify(`${prepared.business} ${prepared.city} ${prepared.state}`), leadIds);
      leads.push(buildLead(prepared, { id, runId, today, nowIso, score }));
      report.accepted.push(id);
      report.counts.accepted += 1;
      room -= 1;
      if (isHome) homeRoom -= 1;
    } else {
      const capped = room > 0 && isHome;
      const id = uniqueId(slugify(`${prepared.business} ${prepared.city} ${prepared.state}`), queueIds);
      addQueue(queueItemFromLead(prepared, {
        id,
        reason: "Qualified overflow",
        verificationNeeded: capped
          ? `Qualified with score ${score}, held because the home metro cap of ${homeMax} was reached. Promote when there is room.`
          : `Qualified with score ${score}, over the weekly quota of ${quota}. Promote when there is room.`,
        runId,
        today,
      }));
      if (capped) warn(prepared.business, [`${prepared.business} was held in the queue because the home metro cap of ${homeMax} was reached.`]);
    }
  }

  // 6: queue and rejected entries from the batch, after dedupe.
  batchQueue.forEach((raw, i) => {
    const item = prepareQueueItem(raw, runId);
    const business = item.candidate || `Queue item ${i + 1}`;
    const v = validateQueueItem(item, { ...ctx, mode: "manual" });
    if (!v.ok) {
      fail(business, v.errors);
      return;
    }
    const hit = index.find(item);
    if (hit) {
      duplicate(business, hit);
      return;
    }
    index.add(item, "batch", business);
    warn(business, v.warnings);
    const id = uniqueId(slugify(`${item.candidate} ${item.city} ${item.state}`), queueIds);
    addQueue({
      id,
      candidate: item.candidate,
      category: item.category ?? "",
      categoryKey: item.categoryKey ?? "",
      city: item.city,
      state: item.state,
      metro: item.metro ?? "",
      whyItMayFit: item.whyItMayFit ?? "",
      websiteStatus: item.websiteStatus ?? "",
      verificationNeeded: item.verificationNeeded ?? "",
      ownerContact: item.ownerContact ?? "",
      phone: item.phone ?? "",
      googleRating: item.googleRating ?? null,
      googleReviews: item.googleReviews ?? null,
      sources: item.sources,
      decision: item.decision ?? "Research",
      reason: item.reason || "Needs more research",
      lead: item.lead ?? null,
      addedAt: today,
      updatedAt: today,
      runId,
    });
  });

  batchRejected.forEach((raw, i) => {
    const r = prepareRejection(raw);
    const business = r.business || `Rejection ${i + 1}`;
    const v = validateRejection(r, { mode: "manual" });
    if (!v.ok) {
      fail(business, v.errors);
      return;
    }
    const hit = index.find(r);
    if (hit) {
      duplicate(business, hit);
      if (hit.in === "leads" || hit.in === "queue") {
        warn(business, [`${business} matches existing ${hit.in === "leads" ? "lead" : "queue item"} ${hit.id}, so the rejection was not recorded. Review it in the app instead.`]);
      }
      return;
    }
    const key = dedupeKey(r);
    index.add({ ...r, key }, "batch", key);
    rejected.push({
      key,
      business: r.business,
      city: r.city ?? "",
      state: r.state ?? "",
      phone: r.phone ?? "",
      reason: r.reason,
      evidenceUrl: r.evidenceUrl ?? "",
      rejectedAt: today,
      runId,
    });
    report.rejected.push(key);
    report.counts.rejected += 1;
  });

  // 5: reverify existing leads.
  for (const entry of b.reverify ?? []) {
    const at = leads.findIndex((l) => l.id === entry.id);
    if (at < 0) {
      fail(entry.id, [`No lead with id ${entry.id} exists, so the reverify entry was skipped.`]);
      continue;
    }
    const current = leads[at];
    const errs = reverifyErrors(entry, current);
    const dashCheck = findDashes(entry).map((p) => `${current.business} reverify field ${p} contains an em or en dash. Use a comma, a period or a colon instead.`);
    if (errs.length || dashCheck.length) {
      fail(current.business, [...errs, ...dashCheck]);
      continue;
    }
    const { next, changes } = applyReverify(entry, current, { runId, nowIso });
    let changed = changes.length > 0;
    if ((entry.decision ?? "keep") === "reject") {
      const status = next.outreach.status;
      if (EARLY_STAGES.includes(status)) {
        next.outreach.status = "Not a fit";
        next.outreach.history.push({
          at: nowIso,
          by: "weekly-run",
          type: "status",
          text: `${status} to Not a fit. Reverify ${runId}: ${entry.reason}`,
        });
        changed = true;
      } else if (status !== "Not a fit") {
        warn(current.business, [`${current.business} is at stage ${status}, so the reverify reject was not applied. Review it by hand: ${entry.reason}`]);
      }
    }
    if (changed) {
      leads[at] = next;
      report.reverified.push(next.id);
      report.counts.reverified += 1;
      const after = validateLead(next, { ...ctx, mode: "stored" });
      warn(next.business, after.warnings.filter((w) => /floor|minimum/.test(w)));
    }
  }

  leads.sort(byAddedThenId);
  queue.sort(byAddedThenId);
  rejected.sort(byRejectedThenKey);

  const c = report.counts;
  report.changed = c.accepted + c.queued + c.rejected + c.reverified > 0;
  if (!report.changed) return { state: unchanged, report };
  return { state: { ...state, leads, queue, rejected }, report };
}
