// Checks for workflows/weekly-research.js. node --check cannot parse a Workflow
// script (top level await and return), so the static checks read the text, and
// the run tests compile the body as an async function and drive it with fake
// agent, parallel and pipeline hooks that follow the Workflow tool contract.
// Nothing here spawns a real agent.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, "workflows", "weekly-research.js");
const source = fs.readFileSync(FILE, "utf8");
const AsyncFunction = (async () => {}).constructor;
const DASH = String.fromCharCode(0x2014);
const DASHES = new RegExp(`[${String.fromCharCode(0x2013)}${DASH}]`);

function metaBlock() {
  const end = source.indexOf("\n};\n");
  assert.ok(end > 0, "meta block ends with };");
  return source.slice(0, end + 3);
}

function readMeta() {
  // The meta literal must stand alone: evaluate it with nothing in scope.
  return new Function(`${metaBlock().replace(/^export const meta =/, "return")}`)();
}

function compile() {
  const body = source.replace(/^export const meta/, "const meta");
  return new AsyncFunction("agent", "parallel", "pipeline", "phase", "log", "args", "budget", "workflow", "Date", "Math", body);
}

test("workflow starts with export const meta and has name, description and phases", () => {
  assert.ok(source.startsWith("export const meta = {"), "first line is export const meta");
  const meta = readMeta();
  assert.equal(meta.name, "kija-weekly-research");
  assert.ok(meta.description.length > 10);
  assert.deepEqual(meta.phases.map((p) => p.title), ["Plan", "Discover", "Verify", "Ingest", "Concepts", "Build"]);
  for (const p of meta.phases) assert.ok(p.detail);
});

test("meta is a pure literal: no variables, calls, spreads or interpolation", () => {
  const block = metaBlock();
  assert.ok(!/\$\{/.test(block), "no template interpolation");
  assert.ok(!/\.\.\./.test(block), "no spreads");
  assert.ok(!/`/.test(block), "no template literals");
  assert.ok(!/\b[A-Za-z_]\w*\s*\(/.test(block.replace(/"(?:[^"\\]|\\.)*"/g, "\"\"")), "no function calls");
});

test("workflow is plain JavaScript with no clock, randomness, imports or dashes", () => {
  const code = source.replace(/"(?:[^"\\]|\\.)*"/g, "\"\"").replace(/\/\/.*$/gm, "");
  assert.ok(!/Date\.now\s*\(/.test(source), "no Date.now()");
  assert.ok(!/Math\.random\s*\(/.test(source), "no Math.random()");
  assert.ok(!/new\s+Date\s*\(\s*\)/.test(source), "no argless new Date()");
  assert.ok(!/^\s*import\s/m.test(source) && !/\brequire\s*\(/.test(code), "no imports or require");
  assert.ok(!/\b(interface|enum|namespace|declare)\s+[A-Z]\w*/.test(code), "no TypeScript declarations");
  assert.ok(!/^\s*type\s+\w+\s*=/m.test(code), "no type aliases");
  assert.ok(!/\bas\s+(const|string|number|boolean|any|unknown)\b/.test(code), "no type assertions");
  assert.ok(!/[)\w]\s*:\s*(string|number|boolean|any|void|unknown|never)(\[\])?\s*[,)=;{]/.test(code), "no type annotations");
  assert.ok(!/<(string|number|any|T)>/.test(code), "no generics");
  assert.ok(!DASHES.test(source), "no em or en dash characters");
});

test("workflow body compiles and every phase() title is declared in meta", () => {
  assert.doesNotThrow(() => compile());
  const meta = readMeta();
  const titles = new Set(meta.phases.map((p) => p.title));
  const used = [...source.matchAll(/\bphase\("([^"]+)"\)/g)].map((m) => m[1]);
  const tagged = [...source.matchAll(/phase: "([^"]+)"/g)].map((m) => m[1]);
  assert.ok(used.length >= 5);
  for (const t of [...used, ...tagged]) assert.ok(titles.has(t), `phase "${t}" is in meta.phases`);
});

test("workflow schemas follow the Places data rule and the new lead fields", () => {
  assert.ok(!/placesFetchedAt:\s/.test(source), "no schema or object property named placesFetchedAt");
  assert.ok(!/"places-api"\s*[,\]]/.test(source.replace(/RATING_SOURCES = \[[^\]]*\]/, "")), "places-api is not an allowed rating source");
  assert.match(source, /const RATING_SOURCES = \["google-maps-observed", "secondary", "owner"\];/);
  assert.match(source, /phoneLineType: \{ type: "string", enum: PHONE_LINE_TYPES \}/);
  assert.match(source, /npm run purge-places/);
  assert.match(source, /reviewSignals: REVIEW_SIGNALS/);
});

// Fakes

function fullLead(c, over = {}) {
  const checks = ["exact-name search", "maps listing", "domain probe", "social and third party", "status, chain and sanity", "review integrity"]
    .map((check) => ({ check, result: `${check} found nothing against this business.`, url: "https://www.google.com/maps/place/x" }));
  return {
    business: c.business, category: c.category, categoryKey: c.categoryKey, city: c.city, area: "", state: c.state,
    metro: c.metro, address: "", phone: c.phone, phoneLineType: "unknown", googleRating: c.screenRating ?? 4.8, googleReviews: c.screenReviews ?? 80,
    ratingSource: "google-maps-observed", googleMapsUrl: "https://www.google.com/maps/place/x", placeId: "", placeIdCheckedAt: "",
    websiteGap: 3, ticketValue: 3, visualFit: 2, websiteStatus: "No owned website surfaced in six checks.",
    presence: { facebook: "", instagram: "", yelp: "", booking: "", other: [] },
    confidence: "High", whyKija: "Strong reviews and no owned site.", pitchAngle: "Customers already trust this shop.",
    demoConcept: "Trust first repair site.", services: [], reviewThemes: [], languages: [], established: null, hours: "",
    sources: [{ url: "https://www.google.com/maps/place/x", label: "google.com", checkedAt: "2026-09-28" }],
    verification: { status: "verified", checkedAt: "2026-09-28", checks, notes: "" },
    ...over,
  };
}

const cand = (business, phone, rating, reviews, over = {}) => ({
  business, categoryKey: "auto-repair", city: "Dallas", state: "TX", phone, googleRating: rating, googleReviews: reviews,
  ratingSource: rating === null ? "" : "google-maps-observed", ratingCheckedAt: "2026-09-28", googleMapsUrl: "", placeId: "", websiteSeen: "", whyItMayFit: "Strong reviews, no site.",
  evidence: [{ url: `https://www.example-directory.com/${business.replace(/\W+/g, "-").toLowerCase()}`, note: "Directory listing" }],
  ...over,
});
const chi = { city: "Chicago", state: "IL" };
const CLEAN = { hardStop: false, signals: 0, notes: "" };

function basePlan(over = {}) {
  return {
    runId: "2026-09-28",
    planPath: "data/inbox/2026-09-28.plan.json",
    alreadyRan: false,
    placesKey: false,
    placesNote: "",
    quota: 10,
    homeMetro: "dallas-fort-worth",
    homeMaxLeads: 1,
    thresholds: { minRating: 4.5, preferredRating: 4.7, minReviews: 20, preferredReviews: 30, minWebsiteGap: 2 },
    metros: [
      { key: "dallas-fort-worth", name: "Dallas Fort Worth", states: ["TX"], anchorCities: ["Dallas", "Fort Worth"], region: "Southwest" },
      { key: "chicago", name: "Chicago", states: ["IL"], anchorCities: ["Chicago"], region: "Midwest" },
    ],
    categories: [{ key: "auto-repair", label: "Auto repair", vertical: "auto", searchTerms: ["auto repair"], focusNote: "", ticketValueDefault: 3, visualFitDefault: 2 }],
    exclusions: ["9726814966", "als auto repair shop|TX"],
    suppressed: [{ key: "2145550099", business: "Stop Auto", city: "Dallas", state: "TX", phone: "214-555-0099" }],
    placesCandidates: [],
    recheck: [
      { kind: "lead", id: "top-tier-auto-repair-dallas-tx", business: "Top Tier Auto Repair", city: "Dallas", state: "TX", phone: "469-608-5410", reason: "needs-recheck from sheet import" },
      { kind: "queue", id: "q-parlor", business: "The Parlor Barbershop", city: "Dallas", state: "TX", phone: "469-677-0690", reason: "Verify live profile" },
    ],
    recheckOverflow: 3,
    notes: "",
    ...over,
  };
}

// Verdicts by business name; anything unlisted is a clean qualified lead.
function verdictFor(c, verdicts) {
  const make = verdicts[c.business];
  if (make) return make(c);
  return { candidateId: c.candidateId, verdict: "qualified", reasons: ["All six checks came up empty."], ownedDomain: "", reviewSignals: CLEAN, lead: fullLead(c) };
}

function between(text, start, end) {
  const i = text.indexOf(start);
  const j = text.indexOf(end, i + start.length);
  return text.slice(i + start.length, j).trim();
}

function harness({ plan = basePlan(), discover = {}, verdicts = {}, fail = [], firstPrev = "item" } = {}) {
  const calls = [];
  const logs = [];
  const phases = [];
  let batch = null;
  const agent = async (prompt, opts = {}) => {
    calls.push({ label: opts.label, phase: opts.phase, effort: opts.effort, hasSchema: Boolean(opts.schema), prompt });
    assert.ok(/Never contact a business/.test(prompt), `${opts.label} prompt carries the safety rules`);
    const label = opts.label || "";
    // The contract: agent() returns null when the subagent fails.
    if (fail.includes(label)) return null;
    if (label === "plan") return plan === null ? null : structuredClone(plan);
    if (label.startsWith("discover:")) {
      const key = label.slice("discover:".length);
      return { metro: key, searched: [{ query: `auto repair ${key}`, source: "websearch", notes: "" }], candidates: discover[key] ?? [], blocked: [], notes: "" };
    }
    if (label.startsWith("verify:")) {
      const batchIn = JSON.parse(between(prompt, "Candidates:\n", "\n\nSafety rules"));
      return { results: batchIn.map((c) => verdictFor(c, verdicts)) };
    }
    if (label.startsWith("recheck:")) {
      const verification = { status: "verified", checkedAt: "2026-09-28", checks: [], notes: "" };
      return {
        results: [
          { kind: "lead", id: "top-tier-auto-repair-dallas-tx", decision: "keep", recommendation: "", reason: "Still no site.", googleRating: 5, googleReviews: 61, ratingSource: "google-maps-observed", websiteGap: 3, websiteStatus: "No owned site.", confidence: "High", reviewSignals: { hardStop: false, signals: 2, notes: "Burst in August." }, verification, sources: [] },
          { kind: "queue", id: "q-parlor", decision: "keep", recommendation: "Promote", reason: "Profile verified, 101 reviews.", googleRating: 4.9, googleReviews: 101, ratingSource: "google-maps-observed", websiteGap: 2, websiteStatus: "Facebook only.", confidence: "High", reviewSignals: CLEAN, verification, sources: [] },
        ],
      };
    }
    if (label === "ingest") {
      batch = JSON.parse(between(prompt, "BATCH_JSON_START", "BATCH_JSON_END"));
      return { batchPath: "data/inbox/2026-09-28.json", attempts: 1, ok: true, counts: { candidates: 1, accepted: 1, queued: 3, rejected: 1, duplicates: 0, reverified: 1, errors: 0 }, accepted: ["alpha-auto-dallas-tx"], queued: [], fixes: [], unresolved: [], notes: "" };
    }
    if (label === "concept-plan") {
      assert.ok(prompt.includes("CONCEPT-BUILD.md"), "the concept planner follows the concept build standard");
      return { leadIds: ["alpha-auto-dallas-tx"], skipped: [], proof: "all pairs differ on 9 or more of 13 dimensions" };
    }
    if (label.startsWith("concept:")) {
      assert.ok(prompt.includes("CONCEPT-BUILD.md") && /Never run npm run demos/.test(prompt), "concept builders follow the standard and never use the old generator");
      return { ok: true, report: "Built to the concept build standard." };
    }
    if (label === "build") {
      return { demos: { ok: true, detail: "1 built." }, pitches: { ok: true, detail: "1 built." }, check: { ok: true, detail: "Clean." }, tests: { ok: true, detail: "All pass." }, purge: { ok: true, detail: "Purged 1 Places working file." }, topLeads: [], summary: "Week 2026-09-28 summary." };
    }
    throw new Error(`unexpected agent ${label}`);
  };
  // A barrier: failed thunks become null, the call never rejects.
  const parallel = (thunks) => Promise.all(thunks.map((t) => Promise.resolve().then(t).catch(() => null)));
  // Stages get (prevResult, originalItem, index); a throwing stage drops the item to null.
  const pipeline = (items, ...stages) => Promise.all(items.map(async (item, i) => {
    let value = firstPrev === "item" ? item : null;
    try {
      for (const stage of stages) value = await stage(value, item, i);
      return value;
    } catch {
      return null;
    }
  }));
  const ClockFreeDate = function () { throw new Error("Date is not available in a workflow script"); };
  ClockFreeDate.now = () => { throw new Error("Date.now is not available in a workflow script"); };
  const NoRandomMath = Object.create(Math, { random: { value: () => { throw new Error("Math.random is not available"); } } });
  return {
    calls, logs, phases,
    get batch() { return batch; },
    run: (args) => compile()(agent, parallel, pipeline, (t) => phases.push(t), (m) => logs.push(m), args, { total: null, spent: () => 0, remaining: () => Infinity }, null, ClockFreeDate, NoRandomMath),
  };
}

const DISCOVER_A = {
  "dallas-fort-worth": [
    cand("Alpha Auto", "214-555-0001", 4.9, 300),
    cand("Bravo Auto", "214-555-0002", 4.8, 100),
    cand("GM AUTO CARE", "(972) 681-4966", 4.9, 501), // known by phone
    cand("Al's Auto Repair Shop", "", 4.8, 308), // known by name and state
    cand("Stop Auto", "(214) 555-0099", 4.8, 90), // on the suppression list
  ],
  chicago: [
    cand("Alpha Auto Chicago Listing", "214-555-0001", 4.9, 120, chi), // same phone as Alpha
    cand("Echo Garage", "312-555-0005", 5, 50, chi),
    cand("Foxtrot Motors", "312-555-0006", 4.7, 40, chi),
    cand("Golf Repair", "312-555-0007", 4.6, 25, { ...chi, whyItMayFit: `Solid ${DASH} but fewer reviews.` }),
  ],
};
const VERDICTS_A = {
  "Foxtrot Motors": (c) => ({ candidateId: c.candidateId, verdict: "reject", reasons: ["Owns foxtrotmotors.com, a working site."], ownedDomain: "foxtrotmotors.com", reviewSignals: CLEAN, lead: fullLead(c), reject: { reason: "Owned working website.", evidenceUrl: "https://foxtrotmotors.com/" } }),
  "Echo Garage": (c) => {
    const lead = fullLead(c);
    lead.verification.checks = lead.verification.checks.slice(0, 3);
    return { candidateId: c.candidateId, verdict: "qualified", reasons: ["No site found."], ownedDomain: "", reviewSignals: CLEAN, lead };
  },
  "Alpha Auto": (c) => ({ candidateId: c.candidateId, verdict: "qualified", reasons: ["All six checks came up empty."], ownedDomain: "", reviewSignals: CLEAN, lead: fullLead(c, { whyKija: `Big reviews ${DASH} no owned site.` }) }),
};

test("workflow run dedupes across metros, skips suppressed, caps verification, guards verdicts and builds the batch", async () => {
  const h = harness({ discover: DISCOVER_A, verdicts: VERDICTS_A });
  const result = await h.run({ root: "C:/kija-leads", runId: "2026-09-28", maxVerifyAgents: 1 });

  assert.deepEqual(h.phases, ["Plan", "Discover", "Verify", "Ingest", "Concepts", "Build"]);
  assert.deepEqual(h.calls.map((c) => c.label), ["plan", "discover:dallas-fort-worth", "discover:chicago", "verify:1", "recheck:1", "ingest", "concept-plan", "concept:1", "build"]);
  assert.ok(h.calls.every((c) => c.hasSchema), "every agent returns structured output");
  assert.equal(h.calls.find((c) => c.label === "verify:1").effort, "high");
  assert.ok(h.calls.find((c) => c.label === "plan").prompt.includes("npm run plan -- --date 2026-09-28"));
  assert.ok(h.calls.find((c) => c.label === "plan").prompt.includes("data/suppression.json"));
  const build = h.calls.find((c) => c.label === "build").prompt;
  assert.ok(!build.includes("npm run demos -- --run"), "the old template generator is retired for concepts");
  assert.ok(build.includes("npm run pitches -- --run 2026-09-28"));
  assert.ok(build.indexOf("npm run purge-places") > build.indexOf("npm test"), "purge runs last");
  assert.deepEqual(result.agents, { max: 14, started: 7, concepts: { max: 10, started: 2 } });
  assert.equal(result.purged, true);

  // 9 found: Alpha's Chicago listing is a phone duplicate, GM and Al's are known, Stop Auto is suppressed.
  assert.equal(result.counts.discovered, 9);
  assert.equal(result.counts.duplicates, 1);
  assert.equal(result.counts.alreadyKnown, 2);
  assert.equal(result.counts.suppressed, 1);
  assert.equal(result.counts.unique, 5);
  // One verify agent x 4: the weakest reputation (Golf Repair) overflows.
  assert.equal(result.counts.verified, 4);
  assert.equal(result.counts.unverifiedOverflow, 1);

  const verifyPrompt = h.calls.find((c) => c.label === "verify:1").prompt;
  assert.ok(!verifyPrompt.includes("Stop Auto"), "a suppressed business never reaches verification");
  assert.match(verifyPrompt, /one listing at a time at a human pace/);
  assert.match(verifyPrompt, /"places-api" is never valid/);
  assert.match(verifyPrompt, /review integrity/);
  assert.match(verifyPrompt, /never substrings/);
  assert.match(verifyPrompt, /phoneLineType: "mobile" when a listing suggests a personal cell/);
  assert.ok(verifyPrompt.includes("\"screenRating\": 4.9"), "discovery values reach the verifier as screen values to re-read");

  const b = h.batch;
  assert.equal(b.runId, "2026-09-28");
  assert.equal(b.mode, "weekly");
  assert.deepEqual(b.plan, { metros: ["dallas-fort-worth", "chicago"], categories: ["auto-repair"] });
  // Both home metro qualifiers go to ingest, which applies the quota and home cap with the real score.
  assert.deepEqual(b.leads.map((l) => l.business), ["Alpha Auto", "Bravo Auto"], "Echo is held by the guard");
  const reasons = Object.fromEntries(b.queue.map((q) => [q.candidate, q.reason]));
  assert.match(reasons["Echo Garage"], /only 3 of the six verification checks/);
  assert.match(reasons["Golf Repair"], /Unverified overflow/);
  assert.ok(b.queue.find((q) => q.candidate === "Echo Garage").lead, "a held lead is carried for promotion");
  assert.equal(b.queue.length, 2);
  assert.equal(b.queue.find((q) => q.candidate === "Golf Repair").sources[0].label, "example-directory.com");
  assert.deepEqual(b.rejected.map((r) => [r.business, r.evidenceUrl]), [["Foxtrot Motors", "https://foxtrotmotors.com/"]]);
  assert.deepEqual(b.reverify.map((r) => [r.id, r.decision, r.ratingSource, r.confidence]), [["top-tier-auto-repair-dallas-tx", "keep", "google-maps-observed", "Medium-High"]], "two review signals lower a recheck from High");
  assert.equal(b.searched.length, 2);
  assert.ok(!DASHES.test(JSON.stringify(b)), "dash characters are scrubbed before ingest");
  assert.equal(b.leads[0].whyKija, "Big reviews, no owned site.");
  assert.ok(!JSON.stringify(b).includes("Stop Auto"));

  assert.deepEqual(result.queueRecommendations, [{ id: "q-parlor", recommendation: "Promote", reason: "Profile verified, 101 reviews." }]);
  assert.equal(result.summary, "Week 2026-09-28 summary.");
  for (const needle of ["Agent budget: at most 14", "Verification cap", "Suppressed: 1", "Dedupe", "Already known", "Home metro: 2 dallas-fort-worth leads qualified", "Guard", "Recheck cap", "Suppression list: 1"]) {
    assert.ok(h.logs.some((l) => l.includes(needle)), `logged: ${needle}`);
  }
});

test("workflow carries only placeId from Places and enforces rating source, review and suppression guards", async () => {
  const pointer = {
    placeId: "ChIJ-hotel", placeIdCheckedAt: "2026-09-28", business: "Hotel Auto", categoryKey: "auto-repair", city: "Chicago", state: "IL",
    metro: "chicago", mapsUrl: "https://www.google.com/maps/search/?api=1&query=Hotel%20Auto&query_place_id=ChIJ-hotel", websiteFlag: "none", serviceArea: false,
  };
  const stale = [...basePlan().recheck, { kind: "lead", id: "stop-auto-dallas-tx", business: "Stop Auto", city: "Dallas", state: "TX", phone: "214-555-0099", reason: "needs-recheck" }];
  const plan = basePlan({ placesKey: true, placesNote: "3 requests made. 897 free calls left this month.", placesCandidates: [pointer], recheck: stale });
  const discover = {
    "dallas-fort-worth": [
      cand("Alpha Auto", "214-555-0001", 4.9, 300),
      cand("Kilo Care", "214-555-0011", 4.9, 200),
      cand("Lima Lube", "214-555-0012", 4.8, 150),
    ],
    chicago: [
      // Confirmed on independent pages by discovery; rating not read yet.
      cand("Hotel Auto", "312-555-0008", null, null, { ...chi, placeId: "ChIJ-hotel", evidence: [{ url: "https://www.facebook.com/hotelauto", note: "Facebook page with name and phone" }] }),
      cand("India Auto", "312-555-0009", 4.8, 90, chi),
      cand("Juliet Shop", "312-555-0010", 4.9, 120, chi),
      cand("Mike Motors", "312-555-0013", 4.7, 60, chi),
    ],
  };
  const verdicts = {
    "Alpha Auto": (c) => ({ candidateId: c.candidateId, verdict: "qualified", reasons: ["Clean."], ownedDomain: "", reviewSignals: CLEAN, lead: fullLead(c, { placesFetchedAt: "2026-09-01" }) }),
    "Hotel Auto": (c) => ({ candidateId: c.candidateId, verdict: "qualified", reasons: ["Clean."], ownedDomain: "", reviewSignals: CLEAN, lead: fullLead(c, { googleRating: 4.9, googleReviews: 140, placeId: "" }) }),
    "India Auto": (c) => ({ candidateId: c.candidateId, verdict: "qualified", reasons: ["Clean."], ownedDomain: "", reviewSignals: CLEAN, lead: fullLead(c, { ratingSource: "places-api", googleRating: 4.6, googleReviews: 88 }) }),
    "Juliet Shop": (c) => ({ candidateId: c.candidateId, verdict: "qualified", reasons: ["Clean."], ownedDomain: "", reviewSignals: { hardStop: false, signals: 2, notes: "Burst and thin accounts." }, lead: fullLead(c) }),
    "Kilo Care": (c) => ({ candidateId: c.candidateId, verdict: "qualified", reasons: ["Clean."], ownedDomain: "", reviewSignals: { hardStop: true, signals: 1, notes: "Review freeze banner." }, lead: fullLead(c) }),
    "Lima Lube": (c) => ({ candidateId: c.candidateId, verdict: "qualified", reasons: ["Clean."], ownedDomain: "", reviewSignals: CLEAN, lead: fullLead(c, { pitchAngle: "Real customers vouch for you, unlike the fake reviews nearby." }) }),
    // The verifier found the real phone on the business's own page, and it is suppressed.
    "Mike Motors": (c) => ({ candidateId: c.candidateId, verdict: "qualified", reasons: ["Clean."], ownedDomain: "", reviewSignals: CLEAN, lead: fullLead(c, { phone: "214-555-0099" }) }),
  };
  const h = harness({ plan, discover, verdicts, firstPrev: "null" });
  const result = await h.run({ root: "C:/kija-leads", runId: "2026-09-28" });

  // The first pipeline stage reads the original item, not prevResult.
  const chicagoPrompt = h.calls.find((c) => c.label === "discover:chicago").prompt;
  assert.match(chicagoPrompt, /Metro: Chicago \(key chicago\)/);
  assert.match(chicagoPrompt, /Only placeId may be carried forward/);
  assert.ok(chicagoPrompt.includes("ChIJ-hotel"));
  assert.ok(!h.calls.find((c) => c.label === "discover:dallas-fort-worth").prompt.includes("ChIJ-hotel"), "pointers go to their own metro only");
  assert.ok(chicagoPrompt.includes("Stop Auto"), "discovery sees the suppression list");

  const b = h.batch;
  assert.deepEqual(b.leads.map((l) => l.business).sort(), ["Alpha Auto", "Hotel Auto", "Juliet Shop"]);
  const hotel = b.leads.find((l) => l.business === "Hotel Auto");
  assert.equal(hotel.placeId, "ChIJ-hotel", "the place ID is the one Places value carried");
  assert.equal(hotel.placeIdCheckedAt, "2026-09-28");
  assert.equal(hotel.ratingSource, "google-maps-observed");
  assert.equal(hotel.googleReviews, 140, "the rating is the verifier's own reading");
  const alpha = b.leads.find((l) => l.business === "Alpha Auto");
  assert.equal(alpha.placesFetchedAt, undefined, "the retired field is dropped");
  assert.equal(alpha.placeIdCheckedAt, "");
  const juliet = b.leads.find((l) => l.business === "Juliet Shop");
  assert.equal(juliet.confidence, "Medium-High", "two review signals lower High one step");
  assert.match(juliet.verification.notes, /lowered one step/);
  assert.ok(!/integrity|lowered/i.test(juliet.whyKija + juliet.pitchAngle + juliet.websiteStatus), "the lowering note stays out of outreach fields");

  const reasons = Object.fromEntries(b.queue.map((q) => [q.candidate, q.reason]));
  assert.match(reasons["India Auto"], /rating came from the Places API/);
  const india = b.queue.find((q) => q.candidate === "India Auto");
  assert.equal(india.googleRating, 4.8, "the queue keeps the independently read discovery value, not the Places one");
  assert.equal(india.googleReviews, 90);
  assert.equal(india.lead.googleRating, undefined, "the Places rating is stripped from the carried lead");
  assert.equal(india.lead.ratingSource, "");
  assert.match(reasons["Kilo Care"], /hard stop/);
  assert.match(reasons["Lima Lube"], /field that feeds outreach/);
  assert.equal(b.queue.length, 3);
  assert.ok(!JSON.stringify(b).includes("Mike Motors"), "a business found to be suppressed is left out entirely");
  assert.ok(!JSON.stringify(b).includes("placesFetchedAt"));
  assert.equal(result.counts.suppressed, 1);
  assert.ok(h.logs.some((l) => l.includes("Suppressed after verification: Mike Motors")));
  assert.ok(h.logs.some((l) => l.includes("confidence lowered to Medium-High for Juliet Shop")));
  assert.ok(h.logs.some((l) => l.includes("1 Places candidates (pointers only)")));
  assert.ok(!h.calls.find((c) => c.label === "recheck:1").prompt.includes("stop-auto-dallas-tx"), "a suppressed lead is never rechecked");
  assert.ok(h.logs.some((l) => l.includes("1 stale items are on the suppression list")));
  // 7 to verify: two verify agents, one recheck agent.
  assert.deepEqual(h.calls.map((c) => c.label), ["plan", "discover:dallas-fort-worth", "discover:chicago", "verify:1", "verify:2", "recheck:1", "ingest", "concept-plan", "concept:1", "build"]);
});

test("workflow keeps every run within maxAgents and logs what the cap drops", async () => {
  const h = harness({ discover: DISCOVER_A, verdicts: VERDICTS_A });
  const result = await h.run({ root: "C:/kija-leads", runId: "2026-09-28", maxAgents: 5 });
  const research = h.calls.filter((c) => c.phase !== "Concepts");
  assert.ok(research.length <= 5, `started ${research.length} research agents`);
  assert.deepEqual(research.map((c) => c.label), ["plan", "discover:dallas-fort-worth", "verify:1", "ingest", "build"]);
  assert.deepEqual(result.agents, { max: 5, started: 5, concepts: { max: 10, started: 2 } });
  assert.ok(h.logs.some((l) => /Agent cap: searched 1 of 2 metros \(max 5 agents\); chicago not searched/.test(l)));
  assert.ok(h.logs.some((l) => /Agent cap: 2 of 2 stale items not rechecked/.test(l)));
  assert.equal(h.batch.reverify.length, 0);

  // Values below the floor are raised to the minimum a run needs.
  const tiny = harness({ discover: DISCOVER_A, verdicts: VERDICTS_A });
  await tiny.run({ root: "C:/kija-leads", runId: "2026-09-28", maxAgents: 1 });
  assert.equal(tiny.calls.filter((c) => c.phase !== "Concepts").length, 5);
});

test("workflow handles null results from every kind of agent", async () => {
  const h = harness({ discover: DISCOVER_A, verdicts: VERDICTS_A, fail: ["discover:chicago", "verify:1", "recheck:1", "ingest", "build"] });
  const result = await h.run({ root: "C:/kija-leads", runId: "2026-09-28" });
  assert.equal(result.counts.unique, 2, "only the Dallas metro contributed");
  assert.deepEqual(h.batch, null, "ingest failed, so the fake never captured a batch");
  assert.match(result.summary, /Ingest did not complete/);
  assert.equal(result.purged, false);
  for (const needle of ["Discovery failed for chicago", "Verify agent 1 failed", "Recheck agent 1 failed", "Ingest agent failed", "Build agent failed", "npm run purge-places"]) {
    assert.ok(h.logs.some((l) => l.includes(needle)), `logged: ${needle}`);
  }

  const noPlan = harness({ plan: null });
  const failed = await noPlan.run({ root: "C:/kija-leads", runId: "2026-09-28" });
  assert.equal(failed.failed, true);
  assert.match(failed.summary, /Plan agent failed/);
  assert.match(failed.summary, /npm run purge-places/);
  assert.deepEqual(noPlan.calls.map((c) => c.label), ["plan"]);

  const empty = harness({ plan: basePlan({ metros: [], recheck: [] }) });
  const none = await empty.run({ root: "C:/kija-leads", runId: "2026-09-28" });
  assert.equal(none.counts.discovered, 0);
  assert.deepEqual(empty.calls.map((c) => c.label), ["plan", "ingest", "concept-plan", "concept:1", "build"]);
});

test("workflow stops early when the week already ran and requires a root", async () => {
  const h = harness({ plan: basePlan({ alreadyRan: true }) });
  const result = await h.run({ root: "C:/kija-leads", runId: "2026-09-28" });
  assert.equal(result.alreadyRan, true);
  assert.match(result.summary, /already has a run report/);
  assert.deepEqual(h.calls.map((c) => c.label), ["plan"]);
  assert.match(h.calls[0].prompt, /If alreadyRan is true, do not run discover; run npm run purge-places/);
  const forced = harness({ plan: basePlan({ alreadyRan: true }) });
  await forced.run({ root: "C:/kija-leads", runId: "2026-09-28", force: true });
  assert.ok(!/If alreadyRan is true, do not run discover/.test(forced.calls[0].prompt));
  assert.ok(forced.calls.length > 1, "force reruns the week");
  await assert.rejects(() => harness().run({ runId: "2026-09-28" }), /args\.root is required/);
  await assert.rejects(() => harness().run({ root: "x", runId: "Sept 28" }), /YYYY-MM-DD/);
});

test("workflow builds every accepted lead's concept to the standard, never with the old generator, within its own cap", async () => {
  const src = source;
  assert.ok(!/npm run demos -- --run ${RUN_ID}/.test(src), "the build step no longer runs the old template generator");
  const h = harness({ discover: DISCOVER_A, verdicts: VERDICTS_A });
  const result = await h.run({ root: "C:/kija-leads", runId: "2026-09-28", maxConceptAgents: 0 });
  assert.equal(h.calls.filter((c) => c.phase === "Concepts").length, 0, "maxConceptAgents 0 builds no concepts");
  assert.equal(result.agents.concepts.started, 0);
  const failing = harness({ discover: DISCOVER_A, verdicts: VERDICTS_A, fail: ["concept:1"] });
  await failing.run({ root: "C:/kija-leads", runId: "2026-09-28" });
  assert.ok(failing.logs.some((l) => l.includes("Concept build failed for alpha-auto-dallas-tx")), "a failed concept is logged, never replaced by the old generator");
});
