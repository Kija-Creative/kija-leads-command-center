// Maps the Google Sheet export (seed/sheet-*.json) into Lead and QueueItem records,
// and builds the placeholder benchmarks file. Pure: now comes in from the CLI.

import { hostname, normalizePhone, slugify } from "./normalize.js";
import { DEFAULT_THRESHOLDS } from "./score.js";
import { PLACEHOLDER_SOURCE } from "./roi.js";

// The sheet was created on this date; seeded records carry it as addedAt and checkedAt.
export const SHEET_DATE = "2026-09-26";
export const SEED_METRO = "dallas-fort-worth";

function sources(urls) {
  return (urls ?? []).map((url) => ({ url, label: hostname(url), checkedAt: SHEET_DATE }));
}

function uniqueId(base, taken) {
  let id = base;
  for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
  taken.add(id);
  return id;
}

function byAddedThenId(a, b) {
  return a.addedAt.localeCompare(b.addedAt) || a.id.localeCompare(b.id);
}

export function seedLead(row, { id, nowIso }) {
  return {
    id,
    business: row.business,
    category: row.category,
    categoryKey: row.categoryKey,
    city: row.city,
    area: row.area ?? "",
    state: row.state,
    metro: SEED_METRO,
    address: "",
    phone: normalizePhone(row.phone) || row.phone,
    googleRating: row.googleRating,
    googleReviews: row.googleReviews,
    ratingSource: "",
    googleMapsUrl: "",
    placeId: "",
    placesFetchedAt: "",
    websiteGap: row.websiteGap,
    ticketValue: row.ticketValue,
    visualFit: row.visualFit,
    websiteStatus: row.websiteStatus,
    presence: { facebook: "", instagram: "", yelp: "", booking: "", other: [] },
    confidence: row.confidence,
    whyKija: row.whyKija,
    pitchAngle: row.pitchAngle,
    demoConcept: row.demoConcept,
    services: [],
    reviewThemes: [],
    languages: row.languages ?? [],
    established: null,
    hours: "",
    demoCopy: {},
    sources: sources(row.sources),
    verification: {
      status: "needs-recheck",
      checkedAt: SHEET_DATE,
      checks: [{ check: "sheet import", result: row.websiteStatus, url: "" }],
      notes: "",
    },
    outreach: {
      status: row.status || "New",
      nextAction: row.nextAction ?? "",
      nextDate: row.nextDate ?? "",
      owner: "",
      notes: "",
      history: [
        { at: nowIso, by: "sheet-import", type: "created", text: "Imported from the Google Sheet Lead Pipeline tab." },
      ],
    },
    demo: { builtAt: "", template: "", palette: "", shareApproved: false },
    roiOverrides: {},
    addedAt: SHEET_DATE,
    origin: "sheet-import",
    runId: "",
  };
}

function queueReason(row, thresholds) {
  const bits = [];
  if (typeof row.googleRating === "number" && row.googleRating < thresholds.preferredRating) {
    bits.push(`Rating below ${thresholds.preferredRating}`);
  }
  if (typeof row.googleReviews === "number" && row.googleReviews < thresholds.preferredReviews) {
    bits.push(`Reviews below ${thresholds.preferredReviews}`);
  }
  return bits.length ? bits.join(", ") : "Needs verification before promotion";
}

export function seedQueueItem(row, { id, thresholds }) {
  return {
    id,
    candidate: row.candidate,
    category: row.category ?? "",
    categoryKey: row.categoryKey ?? "",
    city: row.city,
    state: row.state,
    metro: SEED_METRO,
    whyItMayFit: row.whyItMayFit ?? "",
    websiteStatus: row.websiteStatus ?? "",
    verificationNeeded: row.verificationNeeded ?? "",
    ownerContact: row.ownerContact ?? "",
    phone: normalizePhone(row.phone) || (row.phone ?? ""),
    googleRating: row.googleRating ?? null,
    googleReviews: row.googleReviews ?? null,
    sources: sources(row.sources),
    decision: row.decision || "Research",
    reason: queueReason(row, thresholds),
    lead: null,
    addedAt: SHEET_DATE,
    updatedAt: SHEET_DATE,
    runId: "",
  };
}

export function seedToData(seed, { now, thresholds } = {}) {
  const nowIso = (now instanceof Date ? now : new Date(now)).toISOString();
  const t = { ...DEFAULT_THRESHOLDS, ...(thresholds ?? {}) };
  const leadIds = new Set();
  const leads = (seed?.leads ?? []).map((row) => seedLead(row, {
    id: uniqueId(slugify(`${row.business} ${row.city} ${row.state}`), leadIds),
    nowIso,
  }));
  const queueIds = new Set();
  const queue = (seed?.queue ?? []).map((row) => seedQueueItem(row, {
    id: uniqueId(slugify(`${row.candidate} ${row.city} ${row.state}`), queueIds),
    thresholds: t,
  }));
  return { leads: leads.sort(byAddedThenId), queue: queue.sort(byAddedThenId), rejected: [] };
}

// Rough, conservative typical tickets so the UI has numbers before research lands.
// None of these are researched; every entry says so and carries no sources.
const PLACEHOLDER_TICKETS = {
  "auto-repair": [150, 400, 1200, "repair order"],
  "auto-body-collision": [500, 1800, 6000, "repair"],
  "tire-shop": [100, 300, 900, "visit"],
  "muffler-exhaust": [150, 350, 1500, "job"],
  "diesel-truck-repair": [300, 900, 4000, "repair"],
  "mobile-mechanic": [100, 300, 800, "visit"],
  "auto-detailing": [100, 250, 800, "service"],
  towing: [75, 150, 400, "tow"],
  hvac: [150, 450, 8000, "service call"],
  plumbing: [150, 400, 3000, "job"],
  electrical: [150, 400, 3000, "job"],
  septic: [300, 500, 5000, "service"],
  "garage-door": [150, 300, 1500, "job"],
  restoration: [1000, 3000, 15000, "job"],
  "appliance-repair": [100, 200, 500, "repair"],
  "pest-control": [100, 200, 600, "treatment"],
  roofing: [400, 3000, 15000, "job"],
  concrete: [1000, 3000, 12000, "project"],
  fencing: [1000, 3000, 8000, "project"],
  pools: [500, 2000, 60000, "job"],
  landscaping: [200, 1000, 10000, "project"],
  painting: [500, 2500, 8000, "project"],
  "foundation-repair": [1000, 4000, 12000, "repair"],
  remodeling: [2000, 8000, 60000, "project"],
  "tree-service": [200, 800, 3000, "job"],
  barber: [20, 35, 60, "visit"],
  "hair-salon": [40, 90, 250, "visit"],
  "nail-salon": [25, 50, 100, "visit"],
  tattoo: [80, 250, 1000, "session"],
  "pet-grooming": [40, 75, 150, "groom"],
  general: [100, 300, 1000, "job"],
};

export function placeholderBenchmarks(categories, { updatedAt } = {}) {
  const out = {};
  for (const key of Object.keys(categories ?? {})) {
    const [low, typical, high, unit] = PLACEHOLDER_TICKETS[key] ?? PLACEHOLDER_TICKETS.general;
    out[key] = {
      ticket: { low, typical, high, unit, sources: [] },
      grossMargin: { typical: 0.4, sources: [] },
      rentedLead: null,
      notes: PLACEHOLDER_SOURCE,
    };
  }
  return {
    updatedAt: updatedAt ?? "",
    notes: `${PLACEHOLDER_SOURCE}. Written by npm run seed so the UI has numbers; the research module replaces it with sourced values.`,
    consumerStats: [],
    categories: out,
    websiteMarket: {
      freelancer: { low: 1000, high: 5000 },
      agency: { low: 5000, high: 25000 },
      subscription: { lowMonthly: 50, highMonthly: 300 },
      sources: [],
      notes: PLACEHOLDER_SOURCE,
    },
  };
}

// True when a benchmarks file is still the untouched placeholder, so re-seeding may replace it.
export function isPlaceholderBenchmarks(benchmarks) {
  if (!benchmarks || typeof benchmarks !== "object") return true;
  const cats = Object.values(benchmarks.categories ?? {});
  const anySourced = cats.some((c) => (c?.ticket?.sources?.length ?? 0) > 0 || (c?.grossMargin?.sources?.length ?? 0) > 0
    || (c?.rentedLead?.sources?.length ?? 0) > 0);
  const statsSourced = (benchmarks.consumerStats ?? []).length > 0;
  const marketSourced = (benchmarks.websiteMarket?.sources?.length ?? 0) > 0;
  return !anySourced && !statsSourced && !marketSourced;
}
