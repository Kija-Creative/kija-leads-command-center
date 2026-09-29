export const meta = {
  name: "kija-weekly-research",
  description: "Kija Lead Command Center weekly run: plan, discover per metro, skeptic verification from independent sources, ingest the batch, build demos and pitches, purge Places working data",
  whenToUse: "Monday lead research for the Kija Lead Command Center, or when Jamey asks to run the week now. Pass args { root, runId }.",
  phases: [
    { title: "Plan", detail: "npm run plan, the suppression list, Places discovery under the monthly guard, stale research to recheck" },
    { title: "Discover", detail: "one agent per metro finds up to 8 candidates confirmed on independent public pages" },
    { title: "Verify", detail: "skeptic agents re-read every fact and try to refute the no website claim" },
    { title: "Ingest", detail: "write the batch file, npm run ingest, fix data until clean" },
    { title: "Build", detail: "demos, pitches, npm run check and npm test, purge the Places working file, then the summary" },
  ],
};

// How to invoke with Claude Code's Workflow tool:
//   Workflow({ scriptPath: "<root>/workflows/weekly-research.js", args: { root: "<root>", runId: "YYYY-MM-DD" } })
// root: the kija-leads project directory. runId: the Monday of the week; when
// omitted, the Plan agent takes it from npm run plan.
// Optional args: maxAgents (default 14, every agent this run starts, plan,
// ingest and build included), maxVerifyAgents (default 8, about 4 candidates
// each), maxReverify (default 8 stale leads and queue items), force (true
// reruns a week that already has data/runs/<runId>.json).
//
// This is WEEKLY_RUN.md run with parallel agents. Every rule in that playbook
// applies to every agent. The script has no clock and no filesystem, so all
// file work happens inside agents, and every cap below is logged.
//
// Google Places rule (research/places-api.md): only placeId may travel from
// Places into the batch. Places candidates reach the discover agents as
// pointers (place ID, name, city, category); every lead fact is re-read from
// an independent public page, and the Build step purges the candidates file.

const A = args || {};
const ROOT = typeof A.root === "string" ? A.root.trim().replace(/[\\/]+$/, "") : "";
if (!ROOT) {
  throw new Error("args.root is required, for example Workflow({ scriptPath, args: { root: \"<project dir>\", runId: \"2026-09-28\" } }).");
}
const REQUESTED_RUN_ID = typeof A.runId === "string" ? A.runId.trim() : "";
if (REQUESTED_RUN_ID && !/^\d{4}-\d{2}-\d{2}$/.test(REQUESTED_RUN_ID)) {
  throw new Error(`args.runId must look like YYYY-MM-DD, got "${REQUESTED_RUN_ID}".`);
}
const MAX_AGENTS = wholeNumber(A.maxAgents, 14, 5, 60);
const MAX_VERIFY_AGENTS = wholeNumber(A.maxVerifyAgents, 8, 1, 16);
const MAX_REVERIFY = wholeNumber(A.maxReverify, 8, 0, 24);
const FORCE = A.force === true;
const FIXED_AGENTS = 3; // plan, ingest, build
const PER_VERIFY_AGENT = 4;
const PER_METRO = 8;
const PURGE = "npm run purge-places";
const REQUIRED_LEAD_FIELDS = [
  "business", "category", "categoryKey", "city", "state", "googleRating", "googleReviews", "phone",
  "websiteStatus", "websiteGap", "ticketValue", "visualFit", "confidence", "whyKija", "pitchAngle",
  "demoConcept", "sources",
];
const RATING_SOURCES = ["google-maps-observed", "secondary", "owner"];
const PHONE_LINE_TYPES = ["unknown", "landline", "mobile", "voip"];
// Fields that feed demos, pitches and outreach drafts. Review integrity
// concerns never appear in them.
const OUTREACH_FIELDS = ["whyKija", "pitchAngle", "demoConcept", "websiteStatus", "reviewThemes", "services", "demoCopy"];
const REVIEW_WORDS = /\b(fake|fraud\w*|manipulat\w*|incentiv\w*|astroturf\w*|suspicious|paid reviews?|bought reviews?|review (bursts?|spikes?|patterns?|freeze|warning))\b/i;
const NAME_STOP = new Set(["inc", "llc", "co", "ltd", "the"]);

const SAFETY = [
  "Safety rules from WEEKLY_RUN.md, no exceptions:",
  "- Never contact a business: no calls, texts, emails, DMs, reviews, chats, quote requests or form submissions of any kind. Never call or text a number to test it.",
  "- Never submit a form or type anything into a business's site or a directory, never create an account or sign in, never bypass a CAPTCHA. If a CAPTCHA or login wall appears, stop using that source and say so.",
  "- Never register, reserve or buy a domain, and never publish, upload or share a demo or pitch. Everything stays in the project folder.",
  "- Never invent facts. Ratings, review counts, phones, services, years, licenses and review themes come from independent public pages you actually read, with the URL and date in sources. If you did not read it, leave it out.",
  "- Google Places output is a pointer, never a fact: only placeId may be carried into any file or answer. Never copy a name, phone, rating, review count, address, website or Maps URL from Places output into a lead. Read Google Maps listings in a browser one at a time at a human pace; never bulk scrape.",
  "- Businesses on the suppression list (data/suppression.json) are never researched, queued or added again.",
  "- Review integrity concerns go only in verification checks and notes, never in whyKija, pitchAngle, demoConcept, websiteStatus, reviewThemes, services or demoCopy, and never as an accusation.",
  "- Never write an em dash or en dash character anywhere. Use commas, periods or colons.",
  "- If you use a browser, open your own tab and close only the tabs you opened.",
].join("\n");

const CHAIN_RULES = [
  "Chains (research/compliance.md section 7): compare whole normalized names or name prefixes with config/chains.json, never substrings, and spot check a match before treating it as a chain (generic names such as Classic Collision, Brake Check or Oil Changers can be independents).",
  "Franchise locations add a city or owner suffix (\"Mr. Rooter Plumbing of North Dallas\"); a prefix match catches them.",
  "Network badges and host brands are not chains: NAPA AutoCare, AAA Approved, Tire Pros, Point S, Bosch Car Service, Goodyear dealers, Sola Salon Studios, Phenix Salon Suites and other salon suites (a stylist inside is independent), Carrier, Lennox, Trane, Ruud dealer programs, GAF, Owens Corning, CertainTeed credentials. Note them and check whether a network page is a credible owned site.",
].join("\n");

const REVIEW_RULES = [
  "Review integrity (research/compliance.md section 8). Record it as a sixth check named \"review integrity\" and in reviewSignals:",
  "- Hard stops, never qualified (reject or queue): a fake review warning banner or review freeze; fake listing signs (keyword stuffed name, a virtual office or residential address for a claimed storefront, near identical profiles sharing a phone, a sudden unrelated category change); reviews that mention an incentive.",
  "- Signals: a burst (over a third of all reviews in one 30 day window with no visible cause); thin accounts (over half of the 10 newest 5 star reviewers have 1 or 2 reviews and no photos); almost no 2 to 4 star reviews, or only 5s and 1s; generic or repeated wording, or many reviews naming one staff member; reviewers far from the metro; identical canned owner replies or replies offering rewards; a sharp mismatch with Yelp, Facebook or BBB, or a Yelp consumer alert; hundreds of reviews on a profile that looks months old.",
  "- Two or more signals lower confidence one step; three or more send the candidate to the queue. Positive signals: reviewer photos of the real shop, a steady flow over years, specific varied detail, a few critical reviews with calm replies.",
  "- These are risk signals, not findings about the business. Keep them in verification only.",
].join("\n");

const PHONE_RULES = [
  "Phone: take it from the business's own public listings (its Maps listing, Facebook page, Yelp or BBB page), never from Places output. High confidence needs the same number on two independent sources.",
  "phoneLineType: \"mobile\" when a listing suggests a personal cell (for example \"call or text my cell\", a number labeled mobile, a one person business run from a home); otherwise \"unknown\". Never guess landline or voip, and never use a carrier lookup service.",
].join("\n");

// Schemas

const STR = { type: "string" };
const NUM = { type: "number" };
const INT = { type: "integer" };
const BOOL = { type: "boolean" };
const STRS = { type: "array", items: STR };
const NUM_OR_NULL = { type: ["number", "null"] };
const INT_OR_NULL = { type: ["integer", "null"] };
const RATING_SOURCE = { type: "string", enum: ["", ...RATING_SOURCES] };

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
const REVIEW_SIGNALS = {
  type: "object",
  properties: { hardStop: BOOL, signals: { type: "integer", minimum: 0 }, notes: STR },
  required: ["hardStop", "signals", "notes"],
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
    phoneLineType: { type: "string", enum: PHONE_LINE_TYPES },
    googleRating: { type: "number", minimum: 0, maximum: 5 },
    googleReviews: { type: "integer", minimum: 0 },
    ratingSource: RATING_SOURCE,
    googleMapsUrl: STR,
    placeId: STR,
    placeIdCheckedAt: STR,
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
    "business", "category", "categoryKey", "city", "state", "metro", "phone", "phoneLineType", "googleRating",
    "googleReviews", "ratingSource", "websiteStatus", "sources", "verification",
  ],
};

// Places candidates as the Plan agent relays them: pointers only.
const PLACES_CANDIDATE = {
  type: "object",
  properties: {
    placeId: STR, placeIdCheckedAt: STR, business: STR, categoryKey: STR, city: STR, state: STR, metro: STR,
    mapsUrl: STR, websiteFlag: STR, serviceArea: BOOL,
  },
  required: ["placeId", "business", "categoryKey", "metro"],
};
const SUPPRESSED = {
  type: "object",
  properties: { key: STR, business: STR, city: STR, state: STR, phone: STR },
  required: ["key", "business"],
};
const RECHECK_TARGET = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["lead", "queue"] },
    id: STR, business: STR, categoryKey: STR, city: STR, state: STR, phone: STR, status: STR,
    googleRating: NUM_OR_NULL, googleReviews: INT_OR_NULL, websiteGap: INT_OR_NULL,
    websiteStatus: STR, confidence: STR, checkedAt: STR, ratingSource: STR, placeId: STR, placeIdCheckedAt: STR, reason: STR,
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
    suppressed: { type: "array", items: SUPPRESSED },
    placesCandidates: { type: "array", items: PLACES_CANDIDATE },
    recheck: { type: "array", items: RECHECK_TARGET },
    recheckOverflow: INT,
    notes: STR,
  },
  required: [
    "runId", "alreadyRan", "placesKey", "quota", "homeMetro", "homeMaxLeads", "thresholds", "metros",
    "categories", "exclusions", "suppressed", "placesCandidates", "recheck", "notes",
  ],
};

const CANDIDATE = {
  type: "object",
  properties: {
    business: STR, categoryKey: STR, city: STR, state: STR, phone: STR,
    googleRating: NUM_OR_NULL, googleReviews: INT_OR_NULL, ratingSource: RATING_SOURCE, ratingCheckedAt: STR,
    googleMapsUrl: STR, placeId: STR, websiteSeen: STR, whyItMayFit: STR,
    evidence: {
      type: "array",
      items: { type: "object", properties: { url: STR, note: STR }, required: ["url", "note"] },
    },
  },
  required: ["business", "categoryKey", "city", "state", "phone", "googleRating", "googleReviews", "ratingSource", "whyItMayFit", "evidence"],
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
    reviewSignals: REVIEW_SIGNALS,
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
  required: ["candidateId", "verdict", "reasons", "ownedDomain", "reviewSignals", "lead"],
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
    ratingSource: RATING_SOURCE,
    websiteGap: SCALE,
    websiteStatus: STR,
    confidence: { type: "string", enum: ["High", "Medium-High", "Medium", "Low"] },
    reviewSignals: REVIEW_SIGNALS,
    verification: VERIFICATION,
    sources: { type: "array", items: SOURCE },
  },
  required: ["kind", "id", "decision", "reason", "googleRating", "googleReviews", "ratingSource", "websiteGap", "websiteStatus", "confidence", "reviewSignals", "verification", "sources"],
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
    purge: STEP,
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
  required: ["demos", "pitches", "check", "tests", "purge", "topLeads", "summary"],
};

// Plain helpers (no clock, no randomness, no IO)

function wholeNumber(value, fallback, min, max) {
  const n = Number(value);
  if (value === undefined || value === null || !Number.isInteger(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function list(value) {
  return Array.isArray(value) ? value.filter((x) => x !== null && x !== undefined) : [];
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
// candidates get verified first; score.js stays the authority. A candidate
// whose rating nobody has read yet sorts after the rated ones.
function reputationPoints(c) {
  const rating = Number(c && c.googleRating);
  const reviews = Number(c && c.googleReviews);
  if (c.googleRating === null || c.googleReviews === null || !Number.isFinite(rating) || !Number.isFinite(reviews)) return -1;
  return (rating / 5) * 30 + Math.min(reviews / 300, 1) * 25;
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function names(items, max = 6) {
  const all = list(items).map((c) => c.business || c.candidate || c.key || c.id || "unnamed");
  const shown = all.slice(0, max).join("; ");
  return all.length > max ? `${shown}; and ${all.length - max} more` : shown;
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

// Dedupe keys from the plan (phone digits or name|state) plus suppression
// entries (key, phone and name|state), each in its own index.
function recordIndex(keys, records) {
  const phones = new Set();
  const namesByState = new Set();
  const addKey = (raw) => {
    const text = String(raw || "");
    const d = digitsOf(text);
    if (d && /^[\d\s().+-]+$/.test(text)) phones.add(d);
    const bar = text.lastIndexOf("|");
    if (bar > 0) namesByState.add(nameKey(text.slice(0, bar), text.slice(bar + 1)));
  };
  for (const k of list(keys)) addKey(k);
  for (const r of list(records)) {
    addKey(r.key);
    const d = digitsOf(r.phone);
    if (d) phones.add(d);
    if (r.business) namesByState.add(nameKey(r.business, r.state));
  }
  return { phones, namesByState };
}

function matchesIndex(index, c) {
  if (!c) return "";
  const d = digitsOf(c.phone);
  if (d && index.phones.has(d)) return "phone";
  const name = c.business || c.candidate;
  if (name && index.namesByState.has(nameKey(name, c.state))) return "name";
  return "";
}

function json(value) {
  return JSON.stringify(value, null, 2);
}

function categoryBrief(categories, keys) {
  return list(categories)
    .filter((c) => !keys || keys.includes(c.key))
    .map((c) => `- ${c.key} (${c.label}, ${c.vertical} vertical; ticket default ${c.ticketValueDefault ?? "see config"}, visual default ${c.visualFitDefault ?? "see config"}): search terms ${list(c.searchTerms).join(", ") || c.label}.${c.focusNote ? ` Focus: ${c.focusNote}` : ""}`)
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

// Strings in the fields that feed demos, pitches and drafts.
function outreachText(lead) {
  const parts = [];
  const walk = (v) => {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  for (const f of OUTREACH_FIELDS) walk(lead ? lead[f] : undefined);
  return parts.join(" \n ");
}

function hostLabel(url) {
  return String(url || "").replace(/^[a-z]+:\/\//i, "").split(/[/?#]/)[0].replace(/^www\./i, "");
}

// Queue sources built from discovery evidence carry the run date, known once
// the plan step reports the runId.
let runDate = REQUESTED_RUN_ID;

function toQueueItem(c, lead, fields) {
  const l = lead || {};
  const evidence = list(c.evidence);
  return {
    candidate: l.business || c.business,
    category: l.category || c.categoryLabel || c.categoryKey,
    categoryKey: l.categoryKey || c.categoryKey,
    city: l.city || c.city || "",
    state: l.state || c.state || "",
    metro: l.metro || c.metro || "",
    whyItMayFit: fields.whyItMayFit || c.whyItMayFit || "",
    websiteStatus: l.websiteStatus || (c.websiteSeen ? `Listing shows ${c.websiteSeen}.` : "Not verified yet."),
    verificationNeeded: fields.verificationNeeded || "Run the verification checks in WEEKLY_RUN.md.",
    ownerContact: fields.ownerContact || "",
    phone: l.phone || c.phone || "",
    googleRating: l.googleRating ?? c.googleRating ?? null,
    googleReviews: l.googleReviews ?? c.googleReviews ?? null,
    sources: (list(l.sources).length ? list(l.sources) : evidence.map((e) => ({ url: e.url, label: hostLabel(e.url), checkedAt: runDate })))
      .filter((s) => s && s.url),
    decision: "Research",
    reason: fields.reason,
    lead: lead || null,
  };
}

// Agent accounting: every agent this run starts goes through here.
let agentsStarted = 0;
function run(prompt, opts) {
  agentsStarted++;
  return agent(prompt, opts);
}

// Phase: Plan

phase("Plan");
log(`Agent budget: at most ${MAX_AGENTS} agents this run (plan, ingest and build take ${FIXED_AGENTS}).`);
const plan = await run(
  [
    `You are the Plan step of the Kija Lead Command Center weekly run. Project root: ${ROOT}.`,
    `Read ${ROOT}/WEEKLY_RUN.md, sections "Safety rules", "Preconditions" and "Step 1", and follow them. Work from the project root.`,
    "",
    `1. Run: npm run plan${REQUESTED_RUN_ID ? ` -- --date ${REQUESTED_RUN_ID}` : ""}. Read the plan file it writes (data/inbox/<runId>.plan.json). Return its runId, path, metros (key, name, states, anchorCities, region), quota, homeMetro and exclusions exactly as written.`,
    "2. alreadyRan: true if data/runs/<runId>.json already exists.",
    "3. From config/settings.json return thresholds and geography.homeMaxLeads. From config/categories.json return, for each planned category key: label, vertical, searchTerms, focusNote, ticketValueDefault, visualFitDefault.",
    "4. suppressed: every entry in data/suppression.json (key, business, city, state, phone). A missing file means an empty list.",
    `5. placesKey: whether GOOGLE_PLACES_API_KEY is set in the environment or in .env. Report true or false only. Never print, copy or log the key. If it is set${FORCE ? "" : " and alreadyRan is false"}, run: npm run discover -- --plan data/inbox/<runId>.plan.json. It prints the monthly Places budget and refuses when the monthly guard is used up; that is expected, say so. Read data/inbox/<runId>.candidates.json and return each candidate with only these fields: placeId, placeIdCheckedAt, business, categoryKey, city, state, metro, mapsUrl, websiteFlag, serviceArea. That file is transient Places data: copy nothing else from it, never save it elsewhere, and leave it for the Build step to purge. Put the request count and the budget lines (used this month, free calls left) in placesNote. If discover fails, say why in placesNote and return an empty list.`,
    FORCE ? null : `   If alreadyRan is true, do not run discover; run ${PURGE} so no Places working file is left behind.`,
    `6. recheck, at most ${MAX_REVERIFY} items, oldest first: leads in data/leads.json whose outreach.status is "New" or "Research" and whose verification.status is "needs-recheck", or whose verification.checkedAt is more than 30 days before the runId, or whose ratingSource is "places-api" or who still carry a placesFetchedAt value (the rating must be re-read from the public listing). Kind "lead", with id, business, categoryKey, city, state, phone, outreach status, current googleRating, googleReviews, websiteGap, websiteStatus, confidence, checkedAt, ratingSource, placeId, placeIdCheckedAt and the reason it is stale; add "place ID older than 12 months" to the reason when placeIdCheckedAt is over a year before the runId. Then queue items in data/queue.json with decision "Research" whose updatedAt is more than 14 days before the runId (kind "queue", id, candidate as business, city, state, phone, and verificationNeeded as reason). Skip anything on the suppression list. Put the number left out by the cap in recheckOverflow.`,
    "Change no files except what npm run plan, npm run discover and the purge write. Put anything surprising in notes.",
    "",
    SAFETY,
  ].filter((line) => line !== null).join("\n"),
  { label: "plan", phase: "Plan", schema: PLAN_SCHEMA },
);
if (!plan) {
  const summary = `The Plan agent failed, so week ${REQUESTED_RUN_ID || "(unknown)"} did not run. Run npm run plan by hand and check the output, then run ${PURGE} in case discovery wrote a Places working file.`;
  log(summary);
  return { runId: REQUESTED_RUN_ID, failed: true, summary, agents: { max: MAX_AGENTS, started: agentsStarted } };
}

const RUN_ID = plan.runId || REQUESTED_RUN_ID;
runDate = RUN_ID;
const METROS = list(plan.metros);
const CATEGORIES = list(plan.categories);
const EXCLUSIONS = list(plan.exclusions);
const SUPPRESSED_LIST = list(plan.suppressed);
const PLACES_CANDIDATES = list(plan.placesCandidates).filter((p) => p.placeId);
const RECHECK_ALL = list(plan.recheck);
log(`Run ${RUN_ID}: ${METROS.length} metros (${METROS.map((m) => m.key).join(", ")}), ${CATEGORIES.length} categories (${CATEGORIES.map((c) => c.key).join(", ")}), quota ${plan.quota}.`);
log(plan.placesKey ? `Places key present. ${plan.placesNote || ""} ${PLACES_CANDIDATES.length} Places candidates (pointers only).` : "No Places key: discovery is web research only.");
if (SUPPRESSED_LIST.length) log(`Suppression list: ${SUPPRESSED_LIST.length} businesses are never researched or added.`);
if (plan.recheckOverflow) log(`Recheck cap: ${plan.recheckOverflow} stale leads or queue items left for next week (cap ${MAX_REVERIFY}).`);

if (plan.alreadyRan && !FORCE) {
  const summary = `Run ${RUN_ID} already has a run report at data/runs/${RUN_ID}.json, so nothing was redone. Pass force: true to research the week again (ingest is idempotent).`;
  log(summary);
  return { runId: RUN_ID, alreadyRan: true, summary, agents: { max: MAX_AGENTS, started: agentsStarted } };
}

const THRESHOLDS = plan.thresholds || { minRating: 4.5, minReviews: 20, minWebsiteGap: 2 };
const HOME = plan.homeMetro || "";
const HOME_MAX = Number.isInteger(plan.homeMaxLeads) ? plan.homeMaxLeads : 3;
const dropped = [];
function drop(message) {
  dropped.push(message);
  log(message);
}
const excl = recordIndex(EXCLUSIONS, []);
const supp = recordIndex([], SUPPRESSED_LIST);
const RECHECK = RECHECK_ALL.filter((r) => !matchesIndex(supp, r));
if (RECHECK.length < RECHECK_ALL.length) log(`Suppressed: ${RECHECK_ALL.length - RECHECK.length} stale items are on the suppression list and are not rechecked.`);

// Agents left after plan, ingest and build. Discovery takes one per metro but
// leaves at least one for verification.
let agentsLeft = MAX_AGENTS - FIXED_AGENTS;
const discoverRoom = Math.max(1, agentsLeft - 1);
const metrosToSearch = CATEGORIES.length ? METROS.slice(0, discoverRoom) : [];
if (!CATEGORIES.length) drop("The plan has no categories, so discovery was skipped.");
if (CATEGORIES.length && METROS.length > metrosToSearch.length) {
  drop(`Agent cap: searched ${metrosToSearch.length} of ${METROS.length} metros (max ${MAX_AGENTS} agents); ${METROS.slice(metrosToSearch.length).map((m) => m.key).join(", ")} not searched this week.`);
}
agentsLeft -= metrosToSearch.length;

// Phase: Discover

phase("Discover");
const discoveries = metrosToSearch.length
  ? await pipeline(metrosToSearch, (prev, metro) => {
    const places = PLACES_CANDIDATES.filter((p) => p.metro === metro.key);
    const isHome = metro.key === HOME;
    return run(
      [
        `You are the discovery researcher for one metro in the Kija Lead Command Center weekly run ${RUN_ID}. Project root: ${ROOT}.`,
        `Read ${ROOT}/WEEKLY_RUN.md, sections "Safety rules", "Step 2" (discovery) and "Quick screen", and follow them. Do not do the full verification; skeptic agents do that next.`,
        "",
        `Metro: ${metro.name} (key ${metro.key}), states ${list(metro.states).join(", ")}, anchor cities: ${list(metro.anchorCities).join("; ")}.${isHome ? ` This is the home metro: at most ${HOME_MAX} of its businesses can become leads this week, so favor the very strongest.` : ""}`,
        "Categories this week:",
        categoryBrief(CATEGORIES),
        "",
        `Find up to ${PER_METRO} candidates across these categories: independent local businesses with a Google rating of at least ${THRESHOLDS.minRating} (prefer ${THRESHOLDS.preferredRating ?? 4.7}), at least ${THRESHOLDS.minReviews} Google reviews (prefer ${THRESHOLDS.preferredReviews ?? 30}), no credible website of their own as far as you can tell, and not a chain or franchise. Spread across categories and anchor cities when quality allows. Quality over count: return fewer rather than weak ones.`,
        "Directories and aggregators that say \"no website\" are leads to check, never proof.",
        "googleRating and googleReviews: what you read yourself on the public Google Maps listing (ratingSource \"google-maps-observed\", ratingCheckedAt the date you read it) or on a mirror such as Birdeye (\"secondary\"). If you did not read them, return null with ratingSource \"\"; the verifier re-reads them anyway. Never \"places-api\".",
        CHAIN_RULES,
        PHONE_RULES,
        places.length
          ? [
            "Google Places returned these pointers for this metro. They are not facts. Only placeId may be carried forward, in the placeId field. For each one you keep, confirm the business on independent public pages (open its mapsUrl in a browser, one listing at a time at a human pace, or find its Facebook, Yelp or BBB page), take the name, city, state and phone as those pages show them, and put those URLs in evidence. If you cannot confirm it independently, leave it out. websiteFlag \"third-party\" means Places saw a third party page such as Facebook; check it.",
            json(places),
          ].join("\n")
          : "No Places pointers for this metro: use WebSearch, WebFetch and a browser if one is available.",
        "",
        `Skip anything already known. These are dedupe keys from the plan (phone digits, or normalized name|state):\n${json(EXCLUSIONS)}`,
        SUPPRESSED_LIST.length ? `Never return a business on the suppression list:\n${json(SUPPRESSED_LIST.map((s) => ({ business: s.business, city: s.city || "", state: s.state || "", phone: s.phone || "" })))}` : "The suppression list is empty.",
        "",
        "Record every search you ran in searched (query, source, notes). For each candidate give evidence URLs you actually opened, what the listing shows as a website in websiteSeen (\"\" if none), and one sentence whyItMayFit. Anything that blocked you (CAPTCHA, login wall) goes in blocked.",
        "",
        SAFETY,
      ].join("\n"),
      { label: `discover:${metro.key}`, phase: "Discover", schema: DISCOVER_SCHEMA },
    );
  })
  : [];

const searched = [];
const pool = [];
metrosToSearch.forEach((metro, i) => {
  const d = discoveries ? discoveries[i] : null;
  if (!d) {
    drop(`Discovery failed for ${metro.key}; it contributes no candidates this week.`);
    return;
  }
  searched.push(...list(d.searched));
  if (list(d.blocked).length) log(`${metro.key} blocked sources: ${list(d.blocked).join("; ")}`);
  const found = list(d.candidates).filter((c) => c.business);
  if (found.length > PER_METRO) drop(`${metro.key}: kept ${PER_METRO} of ${found.length} candidates; dropped ${names(found.slice(PER_METRO))}.`);
  for (const c of found.slice(0, PER_METRO)) {
    const cat = CATEGORIES.find((x) => x.key === c.categoryKey);
    pool.push({ ...c, evidence: list(c.evidence), metro: metro.key, categoryLabel: cat ? cat.label : c.categoryKey });
  }
});
if (plan.placesKey) searched.push({ query: "Places Text Search per plan", source: "google-places-api", notes: plan.placesNote || "" });

// Dedupe across metros by phone digits and by normalized name plus state,
// strongest read reputation first (unread ones keep discovery order after
// them), merging evidence into the survivor.
pool.sort((a, b) => reputationPoints(b) - reputationPoints(a));
const byPhone = new Map();
const byName = new Map();
const unique = [];
const duplicates = [];
const excluded = [];
const suppressedSkipped = [];
for (const c of pool) {
  if (matchesIndex(supp, c)) {
    suppressedSkipped.push(c);
    continue;
  }
  if (matchesIndex(excl, c)) {
    excluded.push(c);
    continue;
  }
  const d = digitsOf(c.phone);
  const n = nameKey(c.business, c.state);
  const twin = (d && byPhone.get(d)) || byName.get(n);
  if (twin) {
    duplicates.push(c);
    const urls = new Set(twin.evidence.map((e) => e.url));
    for (const e of c.evidence) if (!urls.has(e.url)) twin.evidence.push(e);
    if (!twin.placeId && c.placeId) twin.placeId = c.placeId;
    continue;
  }
  unique.push(c);
  if (d) byPhone.set(d, c);
  byName.set(n, c);
}
// Suppression is logged, not added to the batch notes, so a suppressed name
// never lands in the batch or the run report.
if (suppressedSkipped.length) log(`Suppressed: ${suppressedSkipped.length} candidates skipped because they are on the suppression list (${names(suppressedSkipped)}).`);
if (duplicates.length) drop(`Dedupe: ${duplicates.length} duplicate candidates merged (${names(duplicates)}).`);
if (excluded.length) drop(`Already known: ${excluded.length} candidates skipped because they match leads, queue or rejected (${names(excluded)}).`);
unique.forEach((c, i) => {
  c.candidateId = `c${i + 1}`;
});

// Split the remaining agents: one recheck agent is reserved when stale items
// exist, verification gets the rest up to maxVerifyAgents, rechecks take any
// room left after that.
const verifyNeed = Math.ceil(unique.length / PER_VERIFY_AGENT);
const recheckNeed = Math.ceil(RECHECK.length / PER_VERIFY_AGENT);
const recheckReserve = recheckNeed > 0 && agentsLeft >= 2 ? 1 : 0;
const verifyAgents = Math.max(0, Math.min(verifyNeed, MAX_VERIFY_AGENTS, agentsLeft - recheckReserve));
const recheckAgents = Math.max(0, Math.min(recheckNeed, agentsLeft - verifyAgents));
agentsLeft -= verifyAgents + recheckAgents;

const verifyCap = verifyAgents * PER_VERIFY_AGENT;
const toVerify = unique.slice(0, verifyCap);
const unverified = unique.slice(verifyCap);
if (unverified.length) {
  const limit = verifyAgents < Math.min(verifyNeed, MAX_VERIFY_AGENTS) ? `the ${MAX_AGENTS} agent cap` : `maxVerifyAgents ${MAX_VERIFY_AGENTS}`;
  drop(`Verification cap: ${unverified.length} of ${unique.length} candidates not verified this run (cap ${verifyCap} = ${verifyAgents} agents x ${PER_VERIFY_AGENT}, set by ${limit}); they go to the research queue as unverified overflow: ${names(unverified)}.`);
}
const recheckItems = RECHECK.slice(0, recheckAgents * PER_VERIFY_AGENT);
if (RECHECK.length > recheckItems.length) {
  drop(`Agent cap: ${RECHECK.length - recheckItems.length} of ${RECHECK.length} stale items not rechecked this run (${recheckAgents} recheck agents): ${names(RECHECK.slice(recheckItems.length))}.`);
}
log(`Discovery: ${pool.length} found, ${unique.length} unique and new, ${toVerify.length} to verify with ${verifyAgents} agents, ${recheckItems.length} rechecks with ${recheckAgents} agents.`);

// Phase: Verify

phase("Verify");
const verifyBatches = chunk(toVerify, PER_VERIFY_AGENT);
const recheckBatches = chunk(recheckItems, PER_VERIFY_AGENT);

function verifyPrompt(batch) {
  const keys = [...new Set(batch.map((c) => c.categoryKey))];
  return [
    `You are a skeptic verifier for the Kija Lead Command Center weekly run ${RUN_ID}. Project root: ${ROOT}.`,
    `Read ${ROOT}/WEEKLY_RUN.md, sections "Safety rules", "Step 3" (the checks), "Confidence rubric", "Step 4" (scoring fields) and "Step 5" (writing fields), and follow them exactly.`,
    "",
    "Your job is to REFUTE the claim \"this business has no credible website of its own\" for each candidate below. Try hard to find an owned domain: exact name plus city searches (read the first two pages), the phone number in quotes, the Google Maps listing website field, Facebook About, Instagram bio, Yelp, BBB and booking pages, and the domain probe:",
    "  npm run probe -- --name \"<business>\" --city \"<city>\" --state <ST> --phone \"<phone>\" (add --extra with any domain you saw). Paste its check object into verification.checks.",
    "Only when every check fails to find a credible owned site, and the business is operating, independent, reachable by a consistent published phone and has a sane review pattern, is it qualified. When in doubt, choose queue, not qualified.",
    "",
    "Every lead fact is independently sourced. The screen values below came from discovery and are not facts:",
    `- Re-read the rating and review count yourself: open the public Google Maps listing in a browser, one listing at a time at a human pace (ratingSource "google-maps-observed", the listing URL in sources with checkedAt ${RUN_ID}, and the date you read it in the maps listing check result), or a secondary mirror such as Birdeye ("secondary", caps confidence at Medium-High), or the business's own published page ("owner"). "places-api" is never valid.`,
    PHONE_RULES,
    "- placeId: keep the given placeId (the only Places value allowed in a lead) and placeIdCheckedAt as given; leave both \"\" when there is none. Never write placesFetchedAt.",
    "",
    CHAIN_RULES,
    "",
    REVIEW_RULES,
    "",
    `Thresholds: rating at least ${THRESHOLDS.minRating}, reviews at least ${THRESHOLDS.minReviews}, websiteGap at least ${THRESHOLDS.minWebsiteGap}. Only High and Medium-High confidence can be qualified.`,
    "Categories:",
    categoryBrief(CATEGORIES, keys),
    "",
    "For every candidate return one result with its candidateId and:",
    "- verdict: qualified (passes everything), queue (promising but a check is unresolved, a threshold is missed, confidence is Medium, or review signals send it there) or reject (owned credible website, closed, chain or franchise, a review integrity hard stop, identity unclear or not a fit). Reasons are full sentences.",
    "- ownedDomain: any domain you believe the business owns, \"\" if none.",
    "- reviewSignals: { hardStop, signals (how many signals you counted), notes }.",
    "- lead: the Lead fields from SPEC.md, filled per WEEKLY_RUN.md. For qualified and queue fill every field you can source, including all six Step 3 checks (review integrity is the sixth) in verification.checks, websiteGap, ticketValue and visualFit with reasons in verification.notes, whyKija, pitchAngle (trust first, never \"you need a website\"), demoConcept, sources, and services, reviewThemes, languages, hours only when you read them. For reject fill at least the identity fields, websiteStatus, sources and the checks you ran.",
    "- queue: whyItMayFit, verificationNeeded, reason (for queue verdicts).",
    "- reject: reason and evidenceUrl (for reject verdicts).",
    `Use the date you ran the checks (normally ${RUN_ID}) for checkedAt. Keep metro as given.`,
    "",
    `Candidates:\n${json(batch.map((c) => ({
      candidateId: c.candidateId, business: c.business, categoryKey: c.categoryKey, category: c.categoryLabel,
      city: c.city, state: c.state, metro: c.metro, phone: c.phone, screenRating: c.googleRating ?? null,
      screenReviews: c.googleReviews ?? null, screenRatingSource: c.ratingSource || "", googleMapsUrl: c.googleMapsUrl || "",
      placeId: c.placeId || "", websiteSeen: c.websiteSeen || "", whyItMayFit: c.whyItMayFit, evidence: c.evidence,
    })))}`,
    "",
    SAFETY,
  ].join("\n");
}

function recheckPrompt(batch) {
  return [
    `You recheck stale research for the Kija Lead Command Center weekly run ${RUN_ID}. Project root: ${ROOT}.`,
    `Read ${ROOT}/WEEKLY_RUN.md, sections "Safety rules", "Step 3" and "Step 7" (reverify), and follow them.`,
    "For each item below, rerun the checks as a skeptic: re-read the rating and review count yourself on the public Google Maps listing in a browser, one listing at a time at a human pace (ratingSource \"google-maps-observed\") or on a mirror (\"secondary\"); send 0 and \"\" when you could not re-read them. Has an owned website appeared, is the business still operating and independent? Record every check in verification.checks with today's results, including review integrity.",
    "- kind lead: decision keep, or reject when it is no longer a fit (owned credible site found, closed, chain, a review integrity hard stop). Return current googleRating, googleReviews, ratingSource, websiteGap, websiteStatus, confidence, reviewSignals, verification and sources (the pages you read now). recommendation is \"\". Never send placesFetchedAt.",
    "- kind queue: decision keep, plus recommendation Promote (now qualifies), Research (still unresolved) or Drop (not a fit) with the reason. Queue decisions are Jamey's in the app; you only recommend.",
    "",
    REVIEW_RULES,
    "",
    `Items:\n${json(batch)}`,
    "",
    SAFETY,
  ].join("\n");
}

const verifyThunks = verifyBatches.map((batch, i) => () =>
  run(verifyPrompt(batch), { label: `verify:${i + 1}`, phase: "Verify", schema: VERIFY_SCHEMA, effort: "high" }));
const recheckThunks = recheckBatches.map((batch, i) => () =>
  run(recheckPrompt(batch), { label: `recheck:${i + 1}`, phase: "Verify", schema: RECHECK_SCHEMA, effort: "high" }));
// parallel() keeps positions and puts null where a thunk failed, so no filtering here.
const verifiedRaw = verifyThunks.length + recheckThunks.length ? await parallel([...verifyThunks, ...recheckThunks]) : [];
const verified = Array.isArray(verifiedRaw) ? verifiedRaw : [];
const verifyResults = verifyThunks.map((_, i) => verified[i] || null);
const recheckResults = recheckThunks.map((_, i) => verified[verifyThunks.length + i] || null);

const leads = [];
const queue = [];
const rejected = [];
const downgraded = [];
const suppressedAfterVerify = [];
const lowered = [];

function holdForQueue(c, lead, problems) {
  downgraded.push(`${c.business}: ${problems.join("; ")}`);
  queue.push(toQueueItem(c, lead, {
    whyItMayFit: (lead && lead.whyKija) || c.whyItMayFit,
    verificationNeeded: `Fix before promotion: ${problems.join("; ")}.`,
    reason: `Held by workflow guard: ${problems.join("; ")}`,
  }));
}

verifyResults.forEach((res, i) => {
  const batch = verifyBatches[i];
  if (!res) {
    drop(`Verify agent ${i + 1} failed; ${names(batch)} go to the queue as unverified.`);
    for (const c of batch) queue.push(toQueueItem(c, null, { reason: "Unverified: verification agent failed this run" }));
    return;
  }
  const seen = new Set();
  for (const r of list(res.results)) {
    const c = batch.find((x) => x.candidateId === r.candidateId);
    if (!c || seen.has(r.candidateId)) continue;
    seen.add(r.candidateId);
    const lead = r.lead ? { ...r.lead } : null;
    let placesRating = false;
    const reasons = list(r.reasons).join(" ");
    const signals = r.reviewSignals || { hardStop: false, signals: 0, notes: "" };
    if (lead) {
      lead.metro = lead.metro || c.metro;
      // placeId is the one Places value a lead may keep; placesFetchedAt is retired.
      if (!lead.placeId && c.placeId) lead.placeId = c.placeId;
      if (lead.placeId && !lead.placeIdCheckedAt) {
        const pointer = PLACES_CANDIDATES.find((p) => p.placeId === lead.placeId);
        if (pointer && pointer.placeIdCheckedAt) lead.placeIdCheckedAt = pointer.placeIdCheckedAt;
      }
      if (!lead.placeId) lead.placeIdCheckedAt = "";
      delete lead.placesFetchedAt;
      if (!PHONE_LINE_TYPES.includes(lead.phoneLineType)) lead.phoneLineType = "unknown";
      // A rating taken from Places is Places content: it never reaches the
      // batch, not even inside a queued partial lead.
      if (lead.ratingSource === "places-api") {
        delete lead.googleRating;
        delete lead.googleReviews;
        lead.ratingSource = "";
        placesRating = true;
      }
    }
    // A suppressed business is never ingested, not even as a rejection.
    if (matchesIndex(supp, lead) || matchesIndex(supp, c)) {
      suppressedAfterVerify.push(c);
      continue;
    }
    if (r.verdict === "reject") {
      rejected.push({
        business: (lead && lead.business) || c.business,
        city: (lead && lead.city) || c.city,
        state: (lead && lead.state) || c.state,
        phone: (lead && lead.phone) || c.phone,
        reason: (r.reject && r.reject.reason) || reasons,
        evidenceUrl: (r.reject && r.reject.evidenceUrl) || (r.ownedDomain ? `https://${r.ownedDomain}` : ((lead && list(lead.sources)[0] && list(lead.sources)[0].url) || "")),
      });
      continue;
    }
    if (r.verdict === "queue") {
      queue.push(toQueueItem(c, lead, {
        whyItMayFit: r.queue && r.queue.whyItMayFit,
        verificationNeeded: r.queue && r.queue.verificationNeeded,
        ownerContact: r.queue && r.queue.ownerContact,
        reason: (r.queue && r.queue.reason) || reasons,
      }));
      continue;
    }
    // Qualified: guard the rules a skeptic can slip on before ingest sees it.
    const problems = [];
    const missing = missingLeadFields(lead);
    if (missing.length) problems.push(`missing ${missing.join(", ")}`);
    const checks = list(lead && lead.verification && lead.verification.checks);
    if (checks.length < 6) problems.push(`only ${checks.length} of the six verification checks recorded`);
    if (placesRating) {
      problems.push("the rating came from the Places API, which a lead may not store; re-read it on the public Maps listing or a mirror");
    } else if (lead && !RATING_SOURCES.includes(lead.ratingSource)) {
      problems.push(`rating source is "${lead.ratingSource || ""}"; re-read the rating on the public Maps listing or a mirror and record google-maps-observed, secondary or owner`);
    }
    if (lead && !list(lead.sources).some((s) => s.url && s.checkedAt)) problems.push("no dated source");
    if (lead && (lead.confidence === "Low" || lead.confidence === "Medium")) problems.push(`confidence is ${lead.confidence}, and only High and Medium-High become leads`);
    if (r.ownedDomain && lead && lead.websiteGap === 3) problems.push(`an owned domain (${r.ownedDomain}) was found but websiteGap is 3`);
    if (signals.hardStop) problems.push("a review integrity hard stop was recorded");
    else if (Number(signals.signals) >= 3) problems.push(`${signals.signals} review integrity signals were recorded`);
    if (lead && REVIEW_WORDS.test(outreachText(lead))) problems.push("review integrity wording appears in a field that feeds outreach; keep it in verification only");
    if (problems.length) {
      holdForQueue(c, lead, problems);
      continue;
    }
    if (Number(signals.signals) >= 2 && lead.confidence === "High") {
      lead.confidence = "Medium-High";
      lead.verification = { ...lead.verification, notes: `${lead.verification.notes || ""} Confidence lowered one step for ${signals.signals} review integrity signals.`.trim() };
      lowered.push(c.business);
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
if (lowered.length) log(`Review signals: confidence lowered to Medium-High for ${lowered.join("; ")}.`);
if (suppressedAfterVerify.length) log(`Suppressed after verification: ${names(suppressedAfterVerify)} matched the suppression list and were left out of the batch.`);

// The weekly quota and the home metro cap are applied by ingest, which ranks
// with the real scoreLead and queues the overflow; just report what to expect.
const homeQualified = leads.filter((l) => l.metro === HOME).length;
if (homeQualified > HOME_MAX) {
  log(`Home metro: ${homeQualified} ${HOME} leads qualified; ingest keeps the top ${HOME_MAX} and queues the rest as qualified overflow.`);
}
if (Number.isInteger(plan.quota) && leads.length > plan.quota) {
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
  for (const r of list(res.results)) {
    if (!r.id) continue;
    const signals = r.reviewSignals || { hardStop: false, signals: 0, notes: "" };
    if (r.kind === "lead") {
      if (signals.hardStop && r.decision === "keep") {
        drop(`Recheck: ${r.id} kept although a review integrity hard stop was recorded; Jamey should review it before any outreach.`);
      }
      let confidence = r.confidence;
      if (Number(signals.signals) >= 2 && confidence === "High") confidence = "Medium-High";
      reverify.push({
        id: r.id,
        // A reading with no valid independent source counts as not re-measured.
        googleRating: RATING_SOURCES.includes(r.ratingSource) ? r.googleRating : 0,
        googleReviews: RATING_SOURCES.includes(r.ratingSource) ? r.googleReviews : 0,
        ratingSource: RATING_SOURCES.includes(r.ratingSource) ? r.ratingSource : "",
        websiteGap: r.websiteGap,
        websiteStatus: r.websiteStatus,
        confidence,
        verification: r.verification,
        sources: list(r.sources),
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
  plan: { metros: METROS.map((m) => m.key), categories: CATEGORIES.map((c) => c.key) },
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
const ingest = await run(
  [
    `You are the ingest step of the Kija Lead Command Center weekly run ${RUN_ID}. Project root: ${ROOT}.`,
    `Read ${ROOT}/WEEKLY_RUN.md, sections "Safety rules", "Step 6" (batch file) and "Step 8" (ingest), and the Batch file section of ${ROOT}/SPEC.md.`,
    "",
    `1. Write the JSON between the markers below, exactly as given, to ${ROOT}/data/inbox/${RUN_ID}.json (UTF-8, 2 space indent). Do not add, drop or reword anything at this stage.`,
    `2. Run from the project root: npm run ingest -- data/inbox/${RUN_ID}.json. Read the report it prints and data/runs/${RUN_ID}.json.`,
    "3. If the report lists errors, fix them by correcting the data in the batch file: reread the independent source page and correct a wrong value, remove an optional fact you cannot source, rewrite a sentence that breaks a rule, or move a lead that cannot be made valid into queue with a reason. Never edit code, config, thresholds, chains or validators, never edit data/leads.json, data/queue.json or data/suppression.json by hand, never copy a value from a Places candidates file, and never invent a fact to satisfy a rule. Rerun ingest after each fix (it is idempotent) until the report shows no errors, at most 5 attempts.",
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
const ingestCounts = ingest && ingest.counts ? ingest.counts : null;
if (!ingest) drop(`Ingest agent failed. The batch was not ingested; rerun npm run ingest -- data/inbox/${RUN_ID}.json by hand.`);
else if (ingestCounts) log(`Ingest: ${ingestCounts.accepted} accepted, ${ingestCounts.queued} queued, ${ingestCounts.duplicates} duplicates, ${ingestCounts.errors} errors after ${ingest.attempts} attempts.`);

// Phase: Build

phase("Build");
const build = await run(
  [
    `You are the build and report step of the Kija Lead Command Center weekly run ${RUN_ID}. Project root: ${ROOT}.`,
    `Read ${ROOT}/WEEKLY_RUN.md, sections "Step 9", "Step 10", "Step 11" and "Final summary".`,
    "",
    `Run from the project root, in order: npm run demos -- --run ${RUN_ID}; npm run pitches -- --run ${RUN_ID}; npm run check; npm test; and last, always, even if an earlier step failed: ${PURGE}. The purge deletes the transient Places candidates file; Google's terms allow keeping place IDs only.`,
    "Report each with ok and a one or two sentence detail. If check or tests fail because of data from this run, fix the data in the batch file and reingest as WEEKLY_RUN.md describes; never change code to make a check pass, report code failures instead.",
    `Read data/runs/${RUN_ID}.json and data/leads.json and list this run's leads by score (the app's scoreLead total, as the demos and pitch pages show it) in topLeads.`,
    "Then write summary: the final summary exactly as the \"Final summary\" section describes, plain text, no dashes. Include these facts from the workflow:",
    json({
      runId: RUN_ID,
      metros: METROS.map((m) => m.key),
      categories: CATEGORIES.map((c) => c.key),
      placesKey: plan.placesKey,
      placesNote: plan.placesNote || "",
      placesPointers: PLACES_CANDIDATES.length,
      discovered: pool.length,
      uniqueNew: unique.length,
      verified: toVerify.length,
      suppressedSkipped: suppressedSkipped.length + suppressedAfterVerify.length,
      ingest: ingest ? { counts: ingestCounts, unresolved: list(ingest.unresolved), fixes: list(ingest.fixes) } : "ingest failed",
      capsAndDrops: dropped,
      queueRecommendations,
    }),
    "",
    SAFETY,
  ].join("\n"),
  { label: "build", phase: "Build", schema: BUILD_SCHEMA, effort: "low" },
);
if (!build) drop(`Build agent failed: run npm run demos, npm run pitches, npm run check, npm test and ${PURGE} by hand.`);
else if (!build.purge || !build.purge.ok) drop(`The Places working file was not purged: run ${PURGE} by hand.`);

const fallback = [
  `Week ${RUN_ID}: ${pool.length} candidates found across ${METROS.length} metros, ${unique.length} new, ${toVerify.length} verified.`,
  ingestCounts ? `Ingest accepted ${ingestCounts.accepted}, queued ${ingestCounts.queued}, errors ${ingestCounts.errors}.` : "Ingest did not complete.",
  dropped.length ? `Caps and drops: ${dropped.join(" ")}` : "",
].filter(Boolean).join(" ");

return {
  runId: RUN_ID,
  summary: build && build.summary ? build.summary : fallback,
  plan: {
    metros: METROS.map((m) => m.key),
    categories: CATEGORIES.map((c) => c.key),
    placesKey: plan.placesKey,
  },
  counts: {
    discovered: pool.length,
    duplicates: duplicates.length,
    alreadyKnown: excluded.length,
    suppressed: suppressedSkipped.length + suppressedAfterVerify.length,
    unique: unique.length,
    verified: toVerify.length,
    unverifiedOverflow: unverified.length,
    qualified: leads.length,
    queued: queue.length,
    rejected: rejected.length,
    rechecked: reverify.length + queueRecommendations.length,
  },
  agents: { max: MAX_AGENTS, started: agentsStarted },
  purged: Boolean(build && build.purge && build.purge.ok),
  dropped,
  queueRecommendations,
  ingest,
  build,
};
