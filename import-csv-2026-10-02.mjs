import fs from "node:fs";
import { createStore } from "./src/lib/store.js";
import { validateLead } from "./src/lib/validate.js";
import { slugify, sameBusiness } from "./src/lib/normalize.js";
import { scoreLead } from "./src/lib/score.js";

const file = process.argv[2];
const text = fs.readFileSync(file, "utf8").replace(/^\ufeff/, "");
function parse(t) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const [head, ...body] = parse(text);
const recs = body.filter((r) => r.length > 5).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));

const keyFor = (c) => {
  const s = c.toLowerCase();
  if (/muffler|exhaust/.test(s)) return "muffler-exhaust";
  if (/diesel|truck repair/.test(s)) return "diesel-truck-repair";
  if (/collision|body|paint|dent/.test(s)) return "auto-body-collision";
  if (/upholstery/.test(s)) return "auto-body-collision";
  if (/auto repair|auto mechanic/.test(s)) return "auto-repair";
  if (/roof/.test(s)) return "roofing";
  if (/barber/.test(s)) return "barber";
  if (/salon|hair/.test(s)) return "hair-salon";
  if (/landscap/.test(s)) return "landscaping";
  if (/tree/.test(s)) return "tree-service";
  if (/hvac/.test(s)) return "hvac";
  if (/plumb/.test(s)) return "plumbing";
  if (/electric/.test(s)) return "electrical";
  if (/fenc/.test(s)) return "fencing";
  if (/pool/.test(s)) return "pools";
  throw new Error("no category for " + c);
};
const store = createStore(process.cwd());
const state = store.load();
const today = "2026-10-02";
const runId = "csv-2026-10-02";
const nowIso = "2026-10-02T12:00:00.000Z";
const out = [], problems = [], dupes = [];
const existing = state.leads.slice();
for (const r of recs) {
  const mapsUrl = r["Source 1"];
  const placeId = (/place_id:([\w-]+)/.exec(mapsUrl) || [])[1] ?? "";
  const siteUrl = r["Source 2"] || r["Website URL"];
  const sources = [{ url: mapsUrl, label: "google.com", checkedAt: today }];
  if (siteUrl) { try { sources.push({ url: siteUrl, label: new URL(siteUrl).hostname, checkedAt: today }); } catch {} }
  if (r["Website URL"] && r["Website URL"] !== siteUrl) { try { sources.push({ url: r["Website URL"], label: new URL(r["Website URL"]).hostname, checkedAt: today }); } catch {} }
  const weak = r["Group"] === "Weak website";
  const notes = [
    `Imported from Jamey's lead report kija-new-leads-2026-10-02 (${r["Group"]}, rank ${r["Rank in group"]}, ${r["Batch"]}).`,
    r["Site problems"] && `Site problems: ${r["Site problems"]}.`,
    r["English-speaking evidence"] && `English evidence: ${r["English-speaking evidence"]}`,
    r["Notes"] && `Report notes: ${r["Notes"]}`,
    "Not yet independently re-run through the six weekly checks; the weekly reverify will do that.",
  ].filter(Boolean).join(" ");
  const lead = {
    id: slugify(`${r.Business} ${r.City} ${"TX"}`),
    business: r.Business, category: r.Category, categoryKey: keyFor(r.Category),
    city: r.City, area: "", state: "TX", metro: "dallas-fort-worth",
    address: r.Address, phone: r.Phone, phoneLineType: "unknown",
    googleRating: Number(r["Google Rating"]), googleReviews: Number(r.Reviews),
    ratingSource: "", googleMapsUrl: mapsUrl, placeId, placeIdCheckedAt: placeId ? today : "",
    websiteGap: Number(r["Website Gap (1-3)"]), ticketValue: Number(r["Ticket Value (1-3)"]), visualFit: Number(r["Visual Fit (1-3)"]),
    websiteStatus: r["Website Status"],
    presence: { facebook: "", instagram: "", yelp: "", booking: "", other: [] },
    confidence: r.Confidence, whyKija: r["Why Kija"], pitchAngle: r["Pitch Angle"], demoConcept: r["Private Demo Concept"],
    services: [], reviewThemes: [], languages: [], established: null, hours: "", demoCopy: {}, sources,
    verification: { status: "needs-recheck", checkedAt: today, checks: [{ check: "lead report import", result: `Taken from Jamey's report dated ${today}, which lists ${r["Website Status"]}.`, url: mapsUrl }], notes },
    outreach: { status: "New", nextAction: r["Next Action"] || "Build private homepage demo", nextDate: "", owner: "", notes: "", history: [{ at: nowIso, by: "csv-import", type: "created", text: `Added from lead report kija-new-leads-2026-10-02 (${r["Group"]}, ${r["Batch"]}).` }] },
    demo: { builtAt: "", template: "", palette: "", shareApproved: false },
    roiOverrides: {}, addedAt: today, origin: "manual", runId,
  };
  const v = validateLead(lead, { settings: state.settings, categories: state.categories, chains: state.chains, mode: "stored", now: nowIso });
  if (!v.ok) { problems.push([r.Business, v.errors]); continue; }
  if (existing.find((l) => l.id === lead.id || sameBusiness?.(l, lead))) { dupes.push(r.Business); continue; }
  existing.push(lead); out.push(lead);
}
console.log("parsed", recs.length, "new", out.length, "dupes", dupes, "problems", JSON.stringify(problems, null, 1));
if (process.argv[3] === "--write" && !problems.length) { store.saveLeads(existing); console.log("written", existing.length); }
