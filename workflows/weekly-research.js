export const meta = {
  name: "kija-weekly-research",
  description: "Kija Lead Command Center weekly run: plan, discover per metro, skeptic verification, ingest the batch, build demos and pitches",
  whenToUse: "Monday lead research for the Kija Lead Command Center, or when Jamey asks to run the week now. Pass args { root, runId }.",
  phases: [
    { title: "Plan", detail: "npm run plan, Places discovery when a key exists, stale research to recheck" },
    { title: "Discover", detail: "one agent per metro finds up to 8 candidates with evidence" },
    { title: "Verify", detail: "skeptic agents try to refute the no website claim with the five checks" },
    { title: "Ingest", detail: "write the batch file, npm run ingest, fix data until clean" },
    { title: "Build", detail: "demos, pitches, npm run check and npm test, then the summary" },
  ],
};

// How to invoke with Claude Code's Workflow tool:
//   Workflow({ scriptPath: "<root>/workflows/weekly-research.js", args: { root: "<root>", runId: "YYYY-MM-DD" } })
// root: the kija-leads project directory. runId: the Monday of the week; when
// omitted, the Plan agent takes it from npm run plan.
// Optional args: maxVerifyAgents (default 8, about 4 candidates each),
// maxReverify (default 8 stale leads and queue items), force (true reruns a
// week that already has data/runs/<runId>.json).
//
// This is WEEKLY_RUN.md run with parallel agents. Every rule in that playbook
// applies to every agent. The script has no clock and no filesystem, so all
// file work happens inside agents, and every cap below is logged.

const A = args || {};
const ROOT = typeof A.root === "string" ? A.root.trim().replace(/[\\/]+$/, "") : "";
if (!ROOT) {
  throw new Error("args.root is required, for example Workflow({ scriptPath, args: { root: \"<project dir>\", runId: \"2026-09-28\" } }).");
}
const REQUESTED_RUN_ID = typeof A.runId === "string" ? A.runId.trim() : "";
if (REQUESTED_RUN_ID && !/^\d{4}-\d{2}-\d{2}$/.test(REQUESTED_RUN_ID)) {
  throw new Error(`args.runId must look like YYYY-MM-DD, got "${REQUESTED_RUN_ID}".`);
}
const MAX_VERIFY_AGENTS = wholeNumber(A.maxVerifyAgents, 8, 1, 16);
const MAX_REVERIFY = wholeNumber(A.maxReverify, 8, 0, 24);
const FORCE = A.force === true;
const PER_VERIFY_AGENT = 4;
const PER_METRO = 8;
const REQUIRED_LEAD_FIELDS = [
  "business", "category", "categoryKey", "city", "state", "googleRating", "googleReviews", "phone",
  "websiteStatus", "websiteGap", "ticketValue", "visualFit", "confidence", "whyKija", "pitchAngle",
  "demoConcept", "sources",
];
const NAME_STOP = new Set(["inc", "llc", "co", "ltd", "the"]);

const SAFETY = [
  "Safety rules from WEEKLY_RUN.md, no exceptions:",
  "- Never contact a business: no calls, texts, emails, DMs, reviews, chats or form submissions of any kind.",
  "- Never submit a form on any site, never create an account or sign in, never bypass a CAPTCHA. If a CAPTCHA or login wall appears, stop using that source and say so.",
  "- Never publish, upload or share a demo or pitch. Everything stays in the project folder.",
  "- Never invent facts. Ratings, review counts, phones, services, years, licenses and review themes come from pages you actually read, with the URL in sources. If you did not read it, leave it out.",
  "- Never write an em dash or en dash character anywhere. Use commas, periods or colons.",
  "- If you use a browser, open your own tab and close only the tabs you opened.",
].join("\n");

// Schemas

const STR = { type: "string" };
const NUM = { type: "number" };
const INT = { type: "integer" };
const BOOL = { type: "boolean" };
const STRS = { type: "array", items: STR };
const NUM_OR_NULL = { type: ["number", "null"] };
const INT_OR_NULL = { type: ["integer", "null"] };

const SOURCE = {
  type: "object",
  properties: { url: STR, label: STR, checkedAt: STR },
  required: ["url", "label", "checkedAt"],
};
const CHECK = {
  type: "object",
  properties: { check: STR, result: STR, url: STR },
  required: ["check", "result", "url"],
};
const VERIFICATION = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["verified", "needs-recheck", "unverified"] },
    checkedAt: STR,
    checks: { type: "array", items: CHECK },
    notes: STR,
  },
  required: ["status", "checkedAt", "checks", "notes"],
};
const PRESENCE = {
  type: "object",
  properties: { facebook: STR, instagram: STR, yelp: STR, booking: STR, other: STRS },
  required: ["facebook", "instagram", "yelp", "booking", "other"],
};
const SCALE = { type: "integer", minimum: 1, maximum: 3 };
const LEAD = {
  type: "object",
  properties: {
    business: STR,
    category: STR,
    categoryKey: STR,
    city: STR,
    area: STR,
    state: STR,
    metro: STR,
    address: STR,
    phone: STR,
    googleRating: { type: "number", minimum: 0, maximum: 5 },
    googleReviews: { type: "integer", minimum: 0 },
    ratingSource: { type: "string", enum: ["", "google-maps", "places-api", "secondary"] },
    googleMapsUrl: STR,
    placeId: STR,
    placesFetchedAt: STR,
    websiteGap: SCALE,
    ticketValue: SCALE,
    visualFit: SCALE,
    websiteStatus: STR,
    presence: PRESENCE,
    confidence: { type: "string", enum: ["High", "Medium-High", "Medium", "Low"] },
    whyKija: STR,
    pitchAngle: STR,
    demoConcept: STR,
    services: STRS,
    reviewThemes: { type: "array", items: STR, maxItems: 5 },
    languages: STRS,
    established: INT_OR_NULL,
    hours: STR,
    sources: { type: "array", items: SOURCE },
    verification: VERIFICATION,
  },
  required: [
    "business", "category", "categoryKey", "city", "state", "metro", "phone", "googleRating",
    "googleReviews", "websiteStatus", "sources", "verification",
  ],
};

const PLACES_CANDIDATE = {
  type: "object",
  properties: {
    placeId: STR, business: STR, categoryKey: STR, city: STR, state: STR, metro: STR, phone: STR,
    googleRating: NUM_OR_NULL, googleReviews: INT_OR_NULL, googleMapsUrl: STR, websiteUri: STR,
    websiteFlag: STR, placesFetchedAt: STR,
  },
  required: ["placeId", "business", "categoryKey", "city", "state", "metro", "phone", "googleRating", "googleReviews"],
};
const RECHECK_TARGET = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["lead", "queue"] },
    id: STR, business: STR, categoryKey: STR, city: STR, state: STR, phone: STR, status: STR,
    googleRating: NUM_OR_NULL, googleReviews: INT_OR_NULL, websiteGap: INT_OR_NULL,
    websiteStatus: STR, confidence: STR, checkedAt: STR, placesFetchedAt: STR, reason: STR,
  },
  required: ["kind", "id", "business", "city", "state", "phone", "reason"],
};
const PLAN_SCHEMA = {
  type: "object",
  properties: {
    runId: STR,
    planPath: STR,
    alreadyRan: BOOL,
    placesKey: BOOL,
    placesNote: STR,
    quota: INT,
    homeMetro: STR,
    homeMaxLeads: INT,
    thresholds: {
      type: "object",
      properties: { minRating: NUM, preferredRating: NUM, minReviews: INT, preferredReviews: INT, minWebsiteGap: INT },
      required: ["minRating", "minReviews", "minWebsiteGap"],
    },
    metros: {
      type: "array",
      items: {
        type: "object",
        properties: { key: STR, name: STR, states: STRS, anchorCities: STRS, region: STR },
        required: ["key", "name", "states", "anchorCities"],
      },
    },
    categories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: STR, label: STR, vertical: STR, searchTerms: STRS, focusNote: STR,
          ticketValueDefault: INT, visualFitDefault: INT,
        },
        required: ["key", "label", "vertical", "searchTerms"],
      },
    },
    exclusions: STRS,
    placesCandidates: { type: "array", items: PLACES_CANDIDATE },
    recheck: { type: "array", items: RECHECK_TARGET },
    recheckOverflow: INT,
    notes: STR,
  },
  required: [
    "runId", "alreadyRan", "placesKey", "quota", "homeMetro", "homeMaxLeads", "thresholds", "metros",
    "categories", "exclusions", "placesCandidates", "recheck", "notes",
  ],
};

const CANDIDATE = {
  type: "object",
  properties: {
    business: STR, categoryKey: STR, city: STR, state: STR, phone: STR,
    googleRating: NUM, googleReviews: INT, ratingSource: STR, googleMapsUrl: STR, placeId: STR,
    websiteSeen: STR, whyItMayFit: STR,
    evidence: {
      type: "array",
      items: { type: "object", properties: { url: STR, note: STR }, required: ["url", "note"] },
    },
  },
  required: ["business", "categoryKey", "city", "state", "phone", "googleRating", "googleReviews", "whyItMayFit", "evidence"],
};
const SEARCHED = {
  type: "object",
  properties: { query: STR, source: STR, notes: STR },
  required: ["query", "source", "notes"],
};
const DISCOVER_SCHEMA = {
  type: "object",
  properties: {
    metro: STR,
    searched: { type: "array", items: SEARCHED },
    candidates: { type: "array", items: CANDIDATE, maxItems: PER_METRO },
    blocked: STRS,
    notes: STR,
  },
  required: ["metro", "searched", "candidates", "notes"],
};

const VERDICT = {
  type: "object",
  properties: {
    candidateId: STR,
    verdict: { type: "string", enum: ["qualified", "queue", "reject"] },
    reasons: { type: "array", items: STR, minItems: 1 },
    ownedDomain: STR,
    lead: LEAD,
    queue: {
      type: "object",
      properties: { whyItMayFit: STR, verificationNeeded: STR, reason: STR, ownerContact: STR },
      required: ["whyItMayFit", "verificationNeeded", "reason"],
    },
    reject: {
      type: "object",
      properties: { reason: STR, evidenceUrl: STR },
      required: ["reason", "evidenceUrl"],
    },
  },
  required: ["candidateId", "verdict", "reasons", "ownedDomain", "lead"],
};
const VERIFY_SCHEMA = {
  type: "object",
  properties: { results: { type: "array", items: VERDICT } },
  required: ["results"],
};

const RECHECK_RESULT = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["lead", "queue"] },
    id: STR,
    decision: { type: "string", enum: ["keep", "reject"] },
    recommendation: { type: "string", enum: ["Promote", "Research", "Drop", ""] },
    reason: STR,
    googleRating: NUM,
    googleReviews: INT,
    websiteGap: SCALE,
    websiteStatus: STR,
    confidence: { type: "string", enum: ["High", "Medium-High", "Medium", "Low"] },
    verification: VERIFICATION,
    sources: { type: "array", items: SOURCE },
  },
  required: ["kind", "id", "decision", "reason", "googleRating", "googleReviews", "websiteGap", "websiteStatus", "confidence", "verification", "sources"],
};
const RECHECK_SCHEMA = {
  type: "object",
  properties: { results: { type: "array", items: RECHECK_RESULT } },
  required: ["results"],
};

const COUNTS = {
  type: "object",
  properties: { candidates: INT, accepted: INT, queued: INT, rejected: INT, duplicates: INT, reverified: INT, errors: INT },
  required: ["candidates", "accepted", "queued", "rejected", "duplicates", "reverified", "errors"],
};
const INGEST_SCHEMA = {
  type: "object",
  properties: {
    batchPath: STR,
    attempts: INT,
    ok: BOOL,
    counts: COUNTS,
    accepted: STRS,
    queued: STRS,
    fixes: STRS,
    unresolved: STRS,
    notes: STR,
  },
  required: ["batchPath", "attempts", "ok", "counts", "accepted", "queued", "fixes", "unresolved", "notes"],
};
const STEP = {
  type: "object",
  properties: { ok: BOOL, detail: STR },
  required: ["ok", "detail"],
};
const BUILD_SCHEMA = {
  type: "object",
  properties: {
    demos: STEP,
    pitches: STEP,
    check: STEP,
    tests: STEP,
    topLeads: {
      type: "array",
      items: {
        type: "object",
        properties: { id: STR, business: STR, city: STR, state: STR, score: INT, why: STR },
        required: ["id", "business", "city", "state", "score", "why"],
      },
    },
    summary: STR,
  },
  required: ["demos", "pitches", "check", "tests", "topLeads", "summary"],
};

// Plain helpers (no clock, no randomness, no IO)

function wholeNumber(value, fallback, min, max) {
  const n = Number(value);
  if (value === undefined || value === null || !Number.isInteger(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function digitsOf(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") return d.slice(1);
  return d.length === 10 ? d : "";
}

function squashName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !NAME_STOP.has(w))
    .join("");
}

function nameKey(name, state) {
  return `${squashName(name)}|${String(state || "").trim().toUpperCase()}`;
}

// The rating and review parts of the SPEC score, used only to decide which
// candidates get verified first; score.js stays the authority.
function reputationPoints(c) {
  return (Number(c.googleRating) / 5) * 30 + Math.min(Number(c.googleReviews) / 300, 1) * 25;
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function names(items, max = 6) {
  const list = items.map((c) => c.business || c.candidate || c.id);
  const shown = list.slice(0, max).join("; ");
  return list.length > max ? `${shown}; and ${list.length - max} more` : shown;
}

// Replace dash characters so a stray one never fails validation. Digit ranges
// keep a hyphen, anything else becomes a comma.
let dashFixes = 0;
function scrubDashes(value) {
  if (typeof value === "string") {
    if (!/[\u2013\u2014]/.test(value)) return value;
    dashFixes++;
    return value
      .replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, "$1-$2")
      .replace(/\s*[\u2013\u2014]+\s*/g, ", ")
      .replace(/,\s*,/g, ",")
      .replace(/^,\s*/, "");
  }
  if (Array.isArray(value)) return value.map(scrubDashes);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = scrubDashes(v);
    return out;
  }
  return value;
}

function exclusionIndex(exclusions) {
  const phones = new Set();
  const namesByState = new Set();
  for (const raw of exclusions || []) {
    const text = String(raw || "");
    const d = digitsOf(text);
    if (d && /^[\d\s().+-]+$/.test(text)) phones.add(d);
    const bar = text.lastIndexOf("|");
    if (bar > 0) namesByState.add(nameKey(text.slice(0, bar), text.slice(bar + 1)));
  }
  return { phones, namesByState };
}

function isExcluded(index, c) {
  const d = digitsOf(c.phone);
  if (d && index.phones.has(d)) return "phone";
  if (index.namesByState.has(nameKey(c.business, c.state))) return "name";
  return "";
}

function json(value) {
  return JSON.stringify(value, null, 2);
}

function categoryBrief(categories, keys) {
  return categories
    .filter((c) => !keys || keys.includes(c.key))
    .map((c) => `- ${c.key} (${c.label}, ${c.vertical} vertical; ticket default ${c.ticketValueDefault ?? "see config"}, visual default ${c.visualFitDefault ?? "see config"}): search terms ${(c.searchTerms || []).join(", ") || c.label}.${c.focusNote ? ` Focus: ${c.focusNote}` : ""}`)
    .join("\n");
}

function missingLeadFields(lead) {
  return REQUIRED_LEAD_FIELDS.filter((f) => {
    const v = lead ? lead[f] : undefined;
    if (v === undefined || v === null) return true;
    if (typeof v === "string") return !v.trim();
    if (Array.isArray(v)) return v.length === 0;
    return false;
  });
}

function toQueueItem(c, lead, fields) {
  const l = lead || {};
  return {
    candidate: l.business || c.business,
    category: l.category || c.categoryLabel || c.categoryKey,
    categoryKey: l.categoryKey || c.categoryKey,
    city: l.city || c.city,
    state: l.state || c.state,
    metro: l.metro || c.metro || "",
    whyItMayFit: fields.whyItMayFit || c.whyItMayFit || "",
    websiteStatus: l.websiteStatus || (c.websiteSeen ? `Listing shows ${c.websiteSeen}.` : "Not verified yet."),
    verificationNeeded: fields.verificationNeeded || "Run the five verification checks in WEEKLY_RUN.md.",
    ownerContact: fields.ownerContact || "",
    phone: l.phone || c.phone,
    googleRating: l.googleRating ?? c.googleRating ?? null,
    googleReviews: l.googleReviews ?? c.googleReviews ?? null,
    sources: (l.sources && l.sources.length ? l.sources : (c.evidence || []).map((e) => ({ url: e.url, label: hostLabel(e.url), checkedAt: runDate })))
      .filter((s) => s && s.url),
    decision: "Research",
    reason: fields.reason,
    lead: lead || null,
  };
}

function hostLabel(url) {
  return String(url || "").replace(/^[a-z]+:\/\//i, "").split(/[/?#]/)[0].replace(/^www\./i, "");
}

// Queue sources built from discovery evidence carry the run date, known once
// the plan step reports the runId.
let runDate = REQUESTED_RUN_ID;

// Phase: Plan

phase("Plan");
const plan = await agent(
  [
    `You are the Plan step of the Kija Lead Command Center weekly run. Project root: ${ROOT}.`,
    `Read ${ROOT}/WEEKLY_RUN.md, sections "Preconditions" and "Step 1", and follow them. Work from the project root.`,
    "",
    `1. Run: npm run plan${REQUESTED_RUN_ID ? ` -- --date ${REQUESTED_RUN_ID}` : ""}. Read the plan file it writes (data/inbox/<runId>.plan.json). Return its runId, path, metros (key, name, states, anchorCities, region), quota, homeMetro and exclusions exactly as written.`,
    "2. alreadyRan: true if data/runs/<runId>.json already exists.",
    "3. From config/settings.json return thresholds and geography.homeMaxLeads. From config/categories.json return, for each planned category key: label, vertical, searchTerms, focusNote, ticketValueDefault, visualFitDefault.",
    `4. placesKey: whether GOOGLE_PLACES_API_KEY is set in the environment or in .env. Report true or false only. Never print, copy or log the key. If it is set${FORCE ? "" : " and alreadyRan is false"}, run: npm run discover -- --plan data/inbox/<runId>.plan.json and read data/inbox/<runId>.candidates.json. Return every candidate in the compact placesCandidates shape (placeId, business, categoryKey, city, state, metro, phone, googleRating, googleReviews, googleMapsUrl, websiteUri, websiteFlag, placesFetchedAt). Put the printed count summary and request count in placesNote. If discover fails, say why in placesNote and return an empty list.`,
    `5. recheck, at most ${MAX_REVERIFY} items, oldest first: leads in data/leads.json whose outreach.status is "New" or "Research" and whose verification.status is "needs-recheck", or whose verification.checkedAt or placesFetchedAt is more than 30 days before the runId (kind "lead", with id, business, categoryKey, city, state, phone, outreach status, current googleRating, googleReviews, websiteGap, websiteStatus, confidence, checkedAt, placesFetchedAt and the reason it is stale); then queue items in data/queue.json with decision "Research" whose updatedAt is more than 14 days before the runId (kind "queue", id, candidate as business, city, state, phone, and verificationNeeded as reason). Put the number left out by the cap in recheckOverflow.`,
    "Change no files except what npm run plan and npm run discover write. Put anything surprising in notes.",
    "",
    SAFETY,
  ].join("\n"),
  { label: "plan", phase: "Plan", schema: PLAN_SCHEMA },
);
if (!plan) throw new Error("The Plan agent failed, so the week cannot run. Run npm run plan by hand and check the output.");

const RUN_ID = plan.runId || REQUESTED_RUN_ID;
runDate = RUN_ID;
log(`Run ${RUN_ID}: ${plan.metros.length} metros (${plan.metros.map((m) => m.key).join(", ")}), ${plan.categories.length} categories (${plan.categories.map((c) => c.key).join(", ")}), quota ${plan.quota}.`);
log(plan.placesKey ? `Places key present. ${plan.placesNote || ""} ${plan.placesCandidates.length} Places candidates.` : "No Places key: discovery is web research only.");
if (plan.recheckOverflow) log(`Recheck cap: ${plan.recheckOverflow} stale leads or queue items left for next week (cap ${MAX_REVERIFY}).`);

if (plan.alreadyRan && !FORCE) {
  const summary = `Run ${RUN_ID} already has a run report at data/runs/${RUN_ID}.json, so nothing was redone. Pass force: true to research the week again (ingest is idempotent).`;
  log(summary);
  return { runId: RUN_ID, alreadyRan: true, summary };
}

const THRESHOLDS = plan.thresholds;
const HOME = plan.homeMetro;
const HOME_MAX = Number.isInteger(plan.homeMaxLeads) ? plan.homeMaxLeads : 3;
const dropped = [];
function drop(message) {
  dropped.push(message);
  log(message);
}

// Phase: Discover

phase("Discover");
const discoveries = await pipeline(plan.metros, (metro) => {
  const places = plan.placesCandidates.filter((p) => p.metro === metro.key);
  const isHome = metro.key === HOME;
  return agent(
    [
      `You are the discovery researcher for one metro in the Kija Lead Command Center weekly run ${RUN_ID}. Project root: ${ROOT}.`,
      `Read ${ROOT}/WEEKLY_RUN.md, sections "Step 2" (discovery) and "Quick screen", and follow them. Do not do the full five check verification; skeptic agents do that next.`,
      "",
      `Metro: ${metro.name} (key ${metro.key}), states ${metro.states.join(", ")}, anchor cities: ${metro.anchorCities.join("; ")}.${isHome ? ` This is the home metro: at most ${HOME_MAX} of its businesses can become leads this week, so favor the very strongest.` : ""}`,
      "Categories this week:",
      categoryBrief(plan.categories),
      "",
      `Find up to ${PER_METRO} candidates across these categories: independent local businesses with a Google rating of at least ${THRESHOLDS.minRating} (prefer ${THRESHOLDS.preferredRating ?? 4.7}), at least ${THRESHOLDS.minReviews} Google reviews (prefer ${THRESHOLDS.preferredReviews ?? 30}), no credible website of their own as far as you can tell, and not a chain or franchise (config/chains.json). Spread across categories and anchor cities when quality allows. Quality over count: return fewer rather than weak ones.`,
      "Directories and aggregators that say \"no website\" are leads to check, never proof. Read the rating and review count from the Google Maps listing when you can; otherwise say where they came from in ratingSource (\"google-maps\", \"places-api\" or \"secondary\").",
      places.length
        ? `Google Places already returned these candidates for this metro (screen them first, they still need your quick screen):\n${json(places)}`
        : "No Places candidates for this metro: use WebSearch, WebFetch and a browser if one is available.",
      "",
      `Skip anything already known. These are dedupe keys from the plan (phone digits, or normalized name|state):\n${json(plan.exclusions)}`,
      "",
      "Record every search you ran in searched (query, source, notes). For each candidate give evidence URLs you actually opened, what the listing shows as a website in websiteSeen (\"\" if none), and one sentence whyItMayFit. Anything that blocked you (CAPTCHA, login wall) goes in blocked.",
      "",
      SAFETY,
    ].join("\n"),
    { label: `discover:${metro.key}`, phase: "Discover", schema: DISCOVER_SCHEMA },
  );
});

const searched = [];
const pool = [];
discoveries.forEach((d, i) => {
  const metro = plan.metros[i];
  if (!d) {
    drop(`Discovery failed for ${metro.key}; it contributes no candidates this week.`);
    return;
  }
  searched.push(...(d.searched || []));
  if ((d.blocked || []).length) log(`${metro.key} blocked sources: ${d.blocked.join("; ")}`);
  const found = d.candidates || [];
  if (found.length > PER_METRO) drop(`${metro.key}: kept ${PER_METRO} of ${found.length} candidates; dropped ${names(found.slice(PER_METRO))}.`);
  for (const c of found.slice(0, PER_METRO)) {
    const cat = plan.categories.find((x) => x.key === c.categoryKey);
    pool.push({ ...c, metro: metro.key, categoryLabel: cat ? cat.label : c.categoryKey });
  }
});
if (plan.placesKey) searched.push({ query: "Places Text Search per plan", source: "google-places-api", notes: plan.placesNote || "" });

// Dedupe across metros by phone digits and by normalized name plus state,
// strongest reputation first, merging evidence into the survivor.
pool.sort((a, b) => reputationPoints(b) - reputationPoints(a) || a.business.localeCompare(b.business));
const excl = exclusionIndex(plan.exclusions);
const byPhone = new Map();
const byName = new Map();
const unique = [];
const duplicates = [];
const excluded = [];
for (const c of pool) {
  const why = isExcluded(excl, c);
  if (why) {
    excluded.push(c);
    continue;
  }
  const d = digitsOf(c.phone);
  const n = nameKey(c.business, c.state);
  const twin = (d && byPhone.get(d)) || byName.get(n);
  if (twin) {
    duplicates.push(c);
    const urls = new Set(twin.evidence.map((e) => e.url));
    for (const e of c.evidence || []) if (!urls.has(e.url)) twin.evidence.push(e);
    continue;
  }
  unique.push(c);
  if (d) byPhone.set(d, c);
  byName.set(n, c);
}
if (duplicates.length) drop(`Dedupe: ${duplicates.length} duplicate candidates merged (${names(duplicates)}).`);
if (excluded.length) drop(`Already known: ${excluded.length} candidates skipped because they match leads, queue or rejected (${names(excluded)}).`);
unique.forEach((c, i) => {
  c.candidateId = `c${i + 1}`;
});

const verifyCap = MAX_VERIFY_AGENTS * PER_VERIFY_AGENT;
const toVerify = unique.slice(0, verifyCap);
const unverified = unique.slice(verifyCap);
if (unverified.length) {
  drop(`Verification cap: ${unverified.length} of ${unique.length} candidates not verified this run (cap ${verifyCap} = ${MAX_VERIFY_AGENTS} agents x ${PER_VERIFY_AGENT}); they go to the research queue as unverified overflow: ${names(unverified)}.`);
}
log(`Discovery: ${pool.length} found, ${unique.length} unique and new, ${toVerify.length} to verify.`);

// Phase: Verify

phase("Verify");
const verifyBatches = chunk(toVerify, PER_VERIFY_AGENT);
const recheckBatches = chunk(plan.recheck || [], PER_VERIFY_AGENT);

function verifyPrompt(batch) {
  const keys = [...new Set(batch.map((c) => c.categoryKey))];
  return [
    `You are a skeptic verifier for the Kija Lead Command Center weekly run ${RUN_ID}. Project root: ${ROOT}.`,
    `Read ${ROOT}/WEEKLY_RUN.md, sections "Step 3" (the five checks), "Confidence rubric", "Step 4" (scoring fields) and "Step 5" (writing fields), and follow them exactly.`,
    "",
    "Your job is to REFUTE the claim \"this business has no credible website of its own\" for each candidate below. Try hard to find an owned domain: exact name plus city searches (read the first two pages), the phone number in quotes, the Google Maps listing website field, Facebook About, Instagram bio, Yelp, BBB and booking pages, and the domain probe:",
    `  npm run probe -- --name "<business>" --city "<city>" --state <ST> --phone "<phone>" (add --extra with any domain you saw). Paste its check object into verification.checks.`,
    "Only when all five checks fail to find a credible owned site, and the business is operating, independent, reachable by a consistent published phone and has a sane review pattern, is it qualified. When in doubt, choose queue, not qualified.",
    "",
    `Thresholds: rating at least ${THRESHOLDS.minRating}, reviews at least ${THRESHOLDS.minReviews}, websiteGap at least ${THRESHOLDS.minWebsiteGap}.`,
    "Categories:",
    categoryBrief(plan.categories, keys),
    "",
    "For every candidate return one result with its candidateId and:",
    "- verdict: qualified (passes everything), queue (promising but a check is unresolved or a threshold is missed) or reject (owned credible website, closed, chain or franchise, fake looking reviews, identity unclear or not a fit). Reasons are full sentences.",
    "- ownedDomain: any domain you believe the business owns, \"\" if none.",
    "- lead: the Lead fields from SPEC.md, filled per WEEKLY_RUN.md. For qualified and queue fill every field you can source, including all five checks in verification.checks, websiteGap, ticketValue and visualFit with reasons in verification.notes, whyKija, pitchAngle (trust first, never \"you need a website\"), demoConcept, sources, and services, reviewThemes, languages, hours only when you read them. For reject fill at least the identity fields, websiteStatus, sources and the checks you ran.",
    "- queue: whyItMayFit, verificationNeeded, reason (for queue verdicts).",
    "- reject: reason and evidenceUrl (for reject verdicts).",
    `Use the date you ran the checks (normally ${RUN_ID}) for checkedAt. Keep metro as given.`,
    "",
    `Candidates:\n${json(batch.map((c) => ({
      candidateId: c.candidateId, business: c.business, categoryKey: c.categoryKey, category: c.categoryLabel,
      city: c.city, state: c.state, metro: c.metro, phone: c.phone, googleRating: c.googleRating,
      googleReviews: c.googleReviews, ratingSource: c.ratingSource || "", googleMapsUrl: c.googleMapsUrl || "",
      placeId: c.placeId || "", websiteSeen: c.websiteSeen || "", whyItMayFit: c.whyItMayFit, evidence: c.evidence,
    })))}`,
    "",
    SAFETY,
  ].join("\n");
}

function recheckPrompt(batch) {
  return [
    `You recheck stale research for the Kija Lead Command Center weekly run ${RUN_ID}. Project root: ${ROOT}.`,
    `Read ${ROOT}/WEEKLY_RUN.md, sections "Step 3" and "Step 7" (reverify), and follow them.`,
    "For each item below, rerun the five checks as a skeptic: is the rating and review count current (read the Google Maps listing directly when you can), has an owned website appeared, is the business still operating and independent? Record every check in verification.checks with today's results.",
    "- kind lead: decision keep, or reject when it is no longer a fit (owned credible site found, closed, chain). Return current googleRating, googleReviews, websiteGap, websiteStatus, confidence, verification and sources (merged: the pages you read now). recommendation is \"\".",
    "- kind queue: decision keep, plus recommendation Promote (now qualifies), Research (still unresolved) or Drop (not a fit) with the reason. Queue decisions are Jamey's in the app; you only recommend.",
    "",
    `Items:\n${json(batch)}`,
    "",
    SAFETY,
  ].join("\n");
}

const verifyThunks = verifyBatches.map((batch, i) => () =>
  agent(verifyPrompt(batch), { label: `verify:${i + 1}`, phase: "Verify", schema: VERIFY_SCHEMA, effort: "high" }));
const recheckThunks = recheckBatches.map((batch, i) => () =>
  agent(recheckPrompt(batch), { label: `recheck:${i + 1}`, phase: "Verify", schema: RECHECK_SCHEMA, effort: "high" }));
const verified = await parallel([...verifyThunks, ...recheckThunks]);
const verifyResults = verified.slice(0, verifyThunks.length);
const recheckResults = verified.slice(verifyThunks.length);

const leads = [];
const queue = [];
const rejected = [];
const downgraded = [];

verifyResults.forEach((res, i) => {
  const batch = verifyBatches[i];
  if (!res) {
    drop(`Verify agent ${i + 1} failed; ${names(batch)} go to the queue as unverified.`);
    for (const c of batch) queue.push(toQueueItem(c, null, { reason: "Unverified: verification agent failed this run" }));
    return;
  }
  const seen = new Set();
  for (const r of res.results || []) {
    const c = batch.find((x) => x.candidateId === r.candidateId);
    if (!c || seen.has(r.candidateId)) continue;
    seen.add(r.candidateId);
    const lead = r.lead ? { ...r.lead } : null;
    if (lead) {
      lead.metro = lead.metro || c.metro;
      if (!lead.placeId && c.placeId) lead.placeId = c.placeId;
      const fromPlaces = plan.placesCandidates.find((p) => p.placeId && p.placeId === lead.placeId);
      if (fromPlaces && !lead.placesFetchedAt && lead.ratingSource === "places-api") lead.placesFetchedAt = fromPlaces.placesFetchedAt || "";
    }
    if (r.verdict === "reject") {
      rejected.push({
        business: (lead && lead.business) || c.business,
        city: (lead && lead.city) || c.city,
        state: (lead && lead.state) || c.state,
        phone: (lead && lead.phone) || c.phone,
        reason: (r.reject && r.reject.reason) || r.reasons.join(" "),
        evidenceUrl: (r.reject && r.reject.evidenceUrl) || (r.ownedDomain ? `https://${r.ownedDomain}` : ((lead && lead.sources && lead.sources[0] && lead.sources[0].url) || "")),
      });
      continue;
    }
    if (r.verdict === "queue") {
      queue.push(toQueueItem(c, lead, {
        whyItMayFit: r.queue && r.queue.whyItMayFit,
        verificationNeeded: r.queue && r.queue.verificationNeeded,
        ownerContact: r.queue && r.queue.ownerContact,
        reason: (r.queue && r.queue.reason) || r.reasons.join(" "),
      }));
      continue;
    }
    // Qualified: guard the rules a skeptic can slip on before ingest sees it.
    const problems = [];
    const missing = missingLeadFields(lead);
    if (missing.length) problems.push(`missing ${missing.join(", ")}`);
    const checks = (lead && lead.verification && lead.verification.checks) || [];
    if (checks.length < 5) problems.push(`only ${checks.length} of the five verification checks recorded`);
    if (lead && lead.confidence === "Low") problems.push("confidence is Low");
    if (r.ownedDomain && lead && lead.websiteGap === 3) problems.push(`an owned domain (${r.ownedDomain}) was found but websiteGap is 3`);
    if (problems.length) {
      downgraded.push(`${c.business}: ${problems.join("; ")}`);
      queue.push(toQueueItem(c, lead, {
        whyItMayFit: (lead && lead.whyKija) || c.whyItMayFit,
        verificationNeeded: `Fix before promotion: ${problems.join("; ")}.`,
        reason: `Held by workflow guard: ${problems.join("; ")}`,
      }));
      continue;
    }
    leads.push(lead);
  }
  const missed = batch.filter((c) => !seen.has(c.candidateId));
  if (missed.length) {
    drop(`Verify agent ${i + 1} returned no result for ${names(missed)}; they go to the queue as unverified.`);
    for (const c of missed) queue.push(toQueueItem(c, null, { reason: "Unverified: no verification result this run" }));
  }
});
if (downgraded.length) drop(`Guard: ${downgraded.length} qualified results held in the queue: ${downgraded.join(" | ")}`);

// The weekly quota and the home metro cap are applied by ingest, which ranks
// with the real scoreLead and queues the overflow; just report what to expect.
const homeQualified = leads.filter((l) => l.metro === HOME).length;
if (homeQualified > HOME_MAX) {
  log(`Home metro: ${homeQualified} ${HOME} leads qualified; ingest keeps the top ${HOME_MAX} and queues the rest as qualified overflow.`);
}
if (leads.length > plan.quota) {
  log(`Quota: ${leads.length} leads qualified; ingest keeps the top ${plan.quota} by score and queues the rest as qualified overflow.`);
}

for (const c of unverified) {
  queue.push(toQueueItem(c, null, { reason: "Unverified overflow: verification capacity reached this run" }));
}

const reverify = [];
const queueRecommendations = [];
recheckResults.forEach((res, i) => {
  if (!res) {
    drop(`Recheck agent ${i + 1} failed; ${names(recheckBatches[i])} stay stale until next week.`);
    return;
  }
  for (const r of res.results || []) {
    if (r.kind === "lead") {
      reverify.push({
        id: r.id,
        googleRating: r.googleRating,
        googleReviews: r.googleReviews,
        websiteGap: r.websiteGap,
        websiteStatus: r.websiteStatus,
        confidence: r.confidence,
        verification: r.verification,
        sources: r.sources,
        decision: r.decision,
        reason: r.reason,
      });
    } else {
      queueRecommendations.push({ id: r.id, recommendation: r.recommendation || "Research", reason: r.reason });
    }
  }
});

const batchFile = scrubDashes({
  runId: RUN_ID,
  mode: "weekly",
  plan: { metros: plan.metros.map((m) => m.key), categories: plan.categories.map((c) => c.key) },
  searched,
  leads,
  queue,
  rejected,
  reverify,
  notes: [
    `Weekly workflow run. ${pool.length} candidates found, ${unique.length} unique and new, ${toVerify.length} verified by skeptic agents.`,
    dropped.length ? `Caps and drops: ${dropped.join(" ")}` : "No caps were hit.",
    plan.notes || "",
  ].filter(Boolean).join(" "),
});
if (dashFixes) log(`Replaced dash characters in ${dashFixes} strings before ingest.`);
log(`Batch: ${leads.length} qualified leads, ${queue.length} queue items, ${rejected.length} rejections, ${reverify.length} lead rechecks.`);

// Phase: Ingest

phase("Ingest");
const ingest = await agent(
  [
    `You are the ingest step of the Kija Lead Command Center weekly run ${RUN_ID}. Project root: ${ROOT}.`,
    `Read ${ROOT}/WEEKLY_RUN.md, sections "Step 6" (batch file) and "Step 8" (ingest), and the Batch file section of ${ROOT}/SPEC.md.`,
    "",
    `1. Write the JSON between the markers below, exactly as given, to ${ROOT}/data/inbox/${RUN_ID}.json (UTF-8, 2 space indent). Do not add, drop or reword anything at this stage.`,
    `2. Run from the project root: npm run ingest -- data/inbox/${RUN_ID}.json. Read the report it prints and data/runs/${RUN_ID}.json.`,
    "3. If the report lists errors, fix them by correcting the data in the batch file: reread the source page and correct a wrong value, remove an optional fact you cannot source, rewrite a sentence that breaks a rule, or move a lead that cannot be made valid into queue with a reason. Never edit code, config, thresholds, chains or validators, never edit data/leads.json or data/queue.json by hand, and never invent a fact to satisfy a rule. Rerun ingest after each fix (it is idempotent) until the report shows no errors, at most 5 attempts.",
    "4. Return the final report counts, accepted and queued ids, every fix you made (one sentence each), and anything left unresolved.",
    "",
    "BATCH_JSON_START",
    json(batchFile),
    "BATCH_JSON_END",
    "",
    SAFETY,
  ].join("\n"),
  { label: "ingest", phase: "Ingest", schema: INGEST_SCHEMA },
);
if (!ingest) drop(`Ingest agent failed. The batch was not ingested; rerun npm run ingest -- data/inbox/${RUN_ID}.json by hand.`);
else log(`Ingest: ${ingest.counts.accepted} accepted, ${ingest.counts.queued} queued, ${ingest.counts.duplicates} duplicates, ${ingest.counts.errors} errors after ${ingest.attempts} attempts.`);

// Phase: Build

phase("Build");
const build = await agent(
  [
    `You are the build and report step of the Kija Lead Command Center weekly run ${RUN_ID}. Project root: ${ROOT}.`,
    `Read ${ROOT}/WEEKLY_RUN.md, sections "Step 9", "Step 10" and "Final summary".`,
    "",
    `Run from the project root, in order: npm run demos -- --run ${RUN_ID}; npm run pitches -- --run ${RUN_ID}; npm run check; npm test.`,
    "Report each with ok and a one or two sentence detail. If check or tests fail because of data from this run, fix the data in the batch file and reingest as WEEKLY_RUN.md describes; never change code to make a check pass, report code failures instead.",
    `Read data/runs/${RUN_ID}.json and data/leads.json and list this run's leads by score (the app's scoreLead total, as the demos and pitch pages show it) in topLeads.`,
    "Then write summary: the final summary exactly as the \"Final summary\" section describes, plain text, no dashes. Include these facts from the workflow:",
    json({
      runId: RUN_ID,
      metros: plan.metros.map((m) => m.key),
      categories: plan.categories.map((c) => c.key),
      placesKey: plan.placesKey,
      placesNote: plan.placesNote || "",
      discovered: pool.length,
      uniqueNew: unique.length,
      verified: toVerify.length,
      ingest: ingest ? { counts: ingest.counts, unresolved: ingest.unresolved, fixes: ingest.fixes } : "ingest failed",
      capsAndDrops: dropped,
      queueRecommendations,
    }),
    "",
    SAFETY,
  ].join("\n"),
  { label: "build", phase: "Build", schema: BUILD_SCHEMA, effort: "low" },
);
if (!build) drop("Build agent failed: run npm run demos, npm run pitches, npm run check and npm test by hand.");

const fallback = [
  `Week ${RUN_ID}: ${pool.length} candidates found across ${plan.metros.length} metros, ${unique.length} new, ${toVerify.length} verified.`,
  ingest ? `Ingest accepted ${ingest.counts.accepted}, queued ${ingest.counts.queued}, errors ${ingest.counts.errors}.` : "Ingest did not complete.",
  dropped.length ? `Caps and drops: ${dropped.join(" ")}` : "",
].filter(Boolean).join(" ");

return {
  runId: RUN_ID,
  summary: build ? build.summary : fallback,
  plan: {
    metros: plan.metros.map((m) => m.key),
    categories: plan.categories.map((c) => c.key),
    placesKey: plan.placesKey,
  },
  counts: {
    discovered: pool.length,
    duplicates: duplicates.length,
    alreadyKnown: excluded.length,
    unique: unique.length,
    verified: toVerify.length,
    unverifiedOverflow: unverified.length,
    qualified: leads.length,
    queued: queue.length,
    rejected: rejected.length,
    rechecked: reverify.length + queueRecommendations.length,
  },
  dropped,
  queueRecommendations,
  ingest,
  build,
};
