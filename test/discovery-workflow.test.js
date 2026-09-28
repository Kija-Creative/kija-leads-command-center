// Checks for workflows/weekly-research.js. node --check cannot parse a Workflow
// script (top level await and return), so the static checks read the text, and
// the run test compiles the body as an async function and drives it with fake
// agent, parallel and pipeline hooks. Nothing here spawns a real agent.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, "workflows", "weekly-research.js");
const source = fs.readFileSync(FILE, "utf8");
const AsyncFunction = (async () => {}).constructor;

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
  assert.deepEqual(meta.phases.map((p) => p.title), ["Plan", "Discover", "Verify", "Ingest", "Build"]);
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
  assert.ok(!/[\u2013\u2014]/.test(source), "no em or en dash characters");
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

// Fakes

function fullLead(c, over = {}) {
  const checks = ["exact-name search", "maps listing", "domain probe", "social and third party", "status, chain and sanity"]
    .map((check) => ({ check, result: `${check} found no owned website.`, url: "https://www.google.com/maps/place/x" }));
  return {
    business: c.business, category: c.category, categoryKey: c.categoryKey, city: c.city, area: "", state: c.state,
    metro: c.metro, address: "", phone: c.phone, googleRating: c.googleRating, googleReviews: c.googleReviews,
    ratingSource: "google-maps", googleMapsUrl: "https://www.google.com/maps/place/x", placeId: "", placesFetchedAt: "",
    websiteGap: 3, ticketValue: 3, visualFit: 2, websiteStatus: "No owned website surfaced in five checks.",
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
  ratingSource: "google-maps", googleMapsUrl: "", placeId: "", websiteSeen: "", whyItMayFit: "Strong reviews, no site.",
  evidence: [{ url: `https://www.example-directory.com/${business.replace(/\W+/g, "-").toLowerCase()}`, note: "Directory listing" }],
  ...over,
});

const PLAN = {
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
  placesCandidates: [],
  recheck: [
    { kind: "lead", id: "top-tier-auto-repair-dallas-tx", business: "Top Tier Auto Repair", city: "Dallas", state: "TX", phone: "469-608-5410", reason: "needs-recheck from sheet import" },
    { kind: "queue", id: "q-parlor", business: "The Parlor Barbershop", city: "Dallas", state: "TX", phone: "469-677-0690", reason: "Verify live profile" },
  ],
  recheckOverflow: 3,
  notes: "",
};

const DISCOVER = {
  "dallas-fort-worth": [
    cand("Alpha Auto", "214-555-0001", 4.9, 300),
    cand("Bravo Auto", "214-555-0002", 4.8, 100),
    cand("GM AUTO CARE", "(972) 681-4966", 4.9, 501), // known by phone
    cand("Al's Auto Repair Shop", "", 4.8, 308), // known by name and state
  ],
  chicago: [
    cand("Alpha Auto Chicago Listing", "214-555-0001", 4.9, 120, { city: "Chicago", state: "IL" }), // same phone as Alpha
    cand("Echo Garage", "312-555-0005", 5, 50, { city: "Chicago", state: "IL" }),
    cand("Foxtrot Motors", "312-555-0006", 4.7, 40, { city: "Chicago", state: "IL" }),
    cand("Golf Repair", "312-555-0007", 4.6, 25, { city: "Chicago", state: "IL", whyItMayFit: "Solid \u2014 but fewer reviews." }),
  ],
};

function between(text, start, end) {
  const i = text.indexOf(start);
  const j = text.indexOf(end, i + start.length);
  return text.slice(i + start.length, j).trim();
}

function harness() {
  const calls = [];
  const logs = [];
  const phases = [];
  let batch = null;
  const agent = async (prompt, opts = {}) => {
    calls.push({ label: opts.label, phase: opts.phase, effort: opts.effort, hasSchema: Boolean(opts.schema), prompt });
    assert.ok(/Never contact a business/.test(prompt), `${opts.label} prompt carries the safety rules`);
    const label = opts.label || "";
    if (label === "plan") return structuredClone(PLAN);
    if (label.startsWith("discover:")) {
      const key = label.slice("discover:".length);
      return { metro: key, searched: [{ query: `auto repair ${key}`, source: "websearch", notes: "" }], candidates: DISCOVER[key], blocked: [], notes: "" };
    }
    if (label.startsWith("verify:")) {
      const batchIn = JSON.parse(between(prompt, "Candidates:\n", "\n\nSafety rules"));
      return {
        results: batchIn.map((c) => {
          if (c.business === "Foxtrot Motors") {
            return { candidateId: c.candidateId, verdict: "reject", reasons: ["Owns foxtrotmotors.com, a working site."], ownedDomain: "foxtrotmotors.com", lead: fullLead(c), reject: { reason: "Owned working website.", evidenceUrl: "https://foxtrotmotors.com/" } };
          }
          if (c.business === "Echo Garage") {
            const lead = fullLead(c);
            lead.verification.checks = lead.verification.checks.slice(0, 3);
            return { candidateId: c.candidateId, verdict: "qualified", reasons: ["No site found."], ownedDomain: "", lead };
          }
          return { candidateId: c.candidateId, verdict: "qualified", reasons: ["All five checks came up empty."], ownedDomain: "", lead: fullLead(c, { whyKija: "Big reviews \u2014 no owned site." }) };
        }),
      };
    }
    if (label.startsWith("recheck:")) {
      const verification = { status: "verified", checkedAt: "2026-09-28", checks: [], notes: "" };
      return {
        results: [
          { kind: "lead", id: "top-tier-auto-repair-dallas-tx", decision: "keep", recommendation: "", reason: "Still no site.", googleRating: 5, googleReviews: 61, websiteGap: 3, websiteStatus: "No owned site.", confidence: "High", verification, sources: [] },
          { kind: "queue", id: "q-parlor", decision: "keep", recommendation: "Promote", reason: "Profile verified, 101 reviews.", googleRating: 4.9, googleReviews: 101, websiteGap: 2, websiteStatus: "Facebook only.", confidence: "High", verification, sources: [] },
        ],
      };
    }
    if (label === "ingest") {
      batch = JSON.parse(between(prompt, "BATCH_JSON_START", "BATCH_JSON_END"));
      return { batchPath: "data/inbox/2026-09-28.json", attempts: 1, ok: true, counts: { candidates: 1, accepted: 1, queued: 3, rejected: 1, duplicates: 0, reverified: 1, errors: 0 }, accepted: ["alpha-auto-dallas-tx"], queued: [], fixes: [], unresolved: [], notes: "" };
    }
    if (label === "build") {
      return { demos: { ok: true, detail: "1 built." }, pitches: { ok: true, detail: "1 built." }, check: { ok: true, detail: "Clean." }, tests: { ok: true, detail: "All pass." }, topLeads: [], summary: "Week 2026-09-28 summary." };
    }
    throw new Error(`unexpected agent ${label}`);
  };
  const parallel = (thunks) => Promise.all(thunks.map((t) => Promise.resolve().then(t).catch(() => null)));
  const pipeline = (items, ...stages) => Promise.all(items.map(async (item, i) => {
    let value = item;
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

test("workflow run dedupes across metros, caps verification, guards verdicts and builds the batch", async () => {
  const h = harness();
  const result = await h.run({ root: "C:/kija-leads", runId: "2026-09-28", maxVerifyAgents: 1 });

  assert.deepEqual(h.phases, ["Plan", "Discover", "Verify", "Ingest", "Build"]);
  assert.deepEqual(h.calls.map((c) => c.label), ["plan", "discover:dallas-fort-worth", "discover:chicago", "verify:1", "recheck:1", "ingest", "build"]);
  assert.ok(h.calls.every((c) => c.hasSchema), "every agent returns structured output");
  assert.equal(h.calls.find((c) => c.label === "verify:1").effort, "high");
  assert.ok(h.calls.find((c) => c.label === "plan").prompt.includes("npm run plan -- --date 2026-09-28"));
  assert.ok(h.calls.find((c) => c.label === "build").prompt.includes("npm run demos -- --run 2026-09-28"));

  // 8 found: Alpha's Chicago listing is a phone duplicate, GM and Al's are known.
  assert.equal(result.counts.discovered, 8);
  assert.equal(result.counts.duplicates, 1);
  assert.equal(result.counts.alreadyKnown, 2);
  assert.equal(result.counts.unique, 5);
  // One verify agent x 4: the weakest reputation (Golf Repair) overflows.
  assert.equal(result.counts.verified, 4);
  assert.equal(result.counts.unverifiedOverflow, 1);

  const b = h.batch;
  assert.equal(b.runId, "2026-09-28");
  assert.equal(b.mode, "weekly");
  assert.deepEqual(b.plan, { metros: ["dallas-fort-worth", "chicago"], categories: ["auto-repair"] });
  // Both home metro qualifiers go to ingest, which applies the quota and home cap with the real score.
  assert.deepEqual(b.leads.map((l) => l.business), ["Alpha Auto", "Bravo Auto"], "Echo is held by the guard");
  const reasons = Object.fromEntries(b.queue.map((q) => [q.candidate, q.reason]));
  assert.match(reasons["Echo Garage"], /only 3 of the five verification checks/);
  assert.match(reasons["Golf Repair"], /Unverified overflow/);
  assert.ok(b.queue.find((q) => q.candidate === "Echo Garage").lead, "a held lead is carried for promotion");
  assert.equal(b.queue.length, 2);
  assert.equal(b.queue.find((q) => q.candidate === "Golf Repair").sources[0].label, "example-directory.com");
  assert.deepEqual(b.rejected.map((r) => [r.business, r.evidenceUrl]), [["Foxtrot Motors", "https://foxtrotmotors.com/"]]);
  assert.deepEqual(b.reverify.map((r) => [r.id, r.decision]), [["top-tier-auto-repair-dallas-tx", "keep"]]);
  assert.equal(b.searched.length, 2);
  assert.ok(!/[\u2013\u2014]/.test(JSON.stringify(b)), "dash characters are scrubbed before ingest");
  assert.equal(b.leads[0].whyKija, "Big reviews, no owned site.");

  assert.deepEqual(result.queueRecommendations, [{ id: "q-parlor", recommendation: "Promote", reason: "Profile verified, 101 reviews." }]);
  assert.equal(result.summary, "Week 2026-09-28 summary.");
  for (const needle of ["Verification cap", "Dedupe", "Already known", "Home metro: 2 dallas-fort-worth leads qualified", "Guard", "Recheck cap"]) {
    assert.ok(h.logs.some((l) => l.includes(needle)), `logged: ${needle}`);
  }
});

test("workflow stops early when the week already ran and requires a root", async () => {
  const h = harness();
  PLAN.alreadyRan = true;
  try {
    const result = await h.run({ root: "C:/kija-leads", runId: "2026-09-28" });
    assert.equal(result.alreadyRan, true);
    assert.match(result.summary, /already has a run report/);
    assert.deepEqual(h.calls.map((c) => c.label), ["plan"]);
  } finally {
    PLAN.alreadyRan = false;
  }
  await assert.rejects(() => harness().run({ runId: "2026-09-28" }), /args\.root is required/);
  await assert.rejects(() => harness().run({ root: "x", runId: "Sept 28" }), /YYYY-MM-DD/);
});
