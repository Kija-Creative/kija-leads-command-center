export const meta = {
  name: "csv-concepts",
  description: "Build a private concept site for each lead imported from the 2026-10-02 report, to CONCEPT-BUILD.md, in six sequential lanes, then audit variation and run pitches and checks",
  phases: [{ title: "Concepts", detail: "six lanes, each building its leads one after another" }, { title: "Audit", detail: "variation audit across all new concepts, pitches, check, test" }],
};
const ROOT = args.root;
const LANES = args.lanes;
const SAFETY = [
  "Rules that override everything: never contact a business (no email, calls, texts, DMs, form submissions). Never publish, upload or share a concept. Never create accounts, sign in or bypass a CAPTCHA. Never invent a fact about a business: only what is in its record in data/leads.json. Never write an em dash or en dash anywhere. Never run npm install and never run npm run demos. Do not edit code or config. Never write to data/leads.json, data/queue.json or data/rejected.json. Other agents are building other leads in parallel in the same folder: only touch demos/<your id>/ and read the rest.",
].join(" ");
const RESULT = {
  type: "object",
  properties: {
    id: { type: "string" },
    ok: { type: "boolean", description: "built and passes checkDemoHtml" },
    skipped: { type: "string", description: "reason if gated and not built, else empty" },
    report: { type: "string", description: "DNA, sources ported with licenses, references, competitors, guardrail result, what makes it distinct. Short." },
  },
  required: ["id", "ok", "skipped", "report"],
};
phase("Concepts");
const lanes = await parallel(LANES.map((ids, li) => async () => {
  const out = [];
  for (const id of ids) {
    const r = await agent([
      `You are a concept builder for the Kija Lead Command Center. Project root: ${ROOT}. Lead id: ${id} (record in data/leads.json).`,
      `Read ${ROOT}/docs/site-generation/CONCEPT-BUILD.md completely and do sections 1 to 4 for this lead: plan its Site DNA first and prove the variation rules with compareSiteDNA against every existing demos/*/SITE_DNA.json (including the ones other lanes have just written), then build the concept exactly as the standard says.`,
      "This lead came from Jamey's 2026-10-02 report (see verification.notes). If websiteGap is 1 the business has a weak existing website: build it as a redesign concept, use the site problems in the record as the brief, never say anything about the current site that the record does not state, and use the trade name where the listing name is keyword stuffed. Apply the gates (Spanish only content, search phrase names, hold); if gated, do not build and say why.",
      "Place every factual claim from the record only; everything else is a clearly labelled owner-to-confirm placeholder. Skip nothing in the deliverables list.",
      SAFETY,
    ].join("\n"), { label: `lane${li + 1}:${id}`, phase: "Concepts", schema: RESULT, effort: "high" });
    out.push(r ?? { id, ok: false, skipped: "agent failed", report: "" });
  }
  return out;
}));
const all = lanes.filter(Boolean).flat();
log(`Built ${all.filter((r) => r.ok).length} of ${all.length}.`);
phase("Audit");
const audit = await agent([
  `You are the audit step. Project root: ${ROOT}.`,
  `New concepts for these lead ids were just built in parallel: ${all.filter((r) => r.ok).map((r) => r.id).join(", ")}.`,
  "Following CONCEPT-BUILD.md section 1, run compareSiteDNA (src/design-intelligence/variation.ts, Node runs .ts directly) across ALL demos/*/SITE_DNA.json pairs involving a new concept. Where a pair fails the variation rules (fewer than 6 of 13 dimensions different, fewer than 7 in the same industry, or a clone signature), rebuild the later concept's composition, typography, geometry, imagery or hero (never palette alone) until it passes, and re-run checkDemoHtml. Then run from the project root: npm run pitches -- --run csv-2026-10-02 (if that flag selects nothing, run npm run pitches -- --id <id> for each new lead), npm run check, npm test. Report the failing pairs fixed, any remaining failures and the check and test results.",
  SAFETY,
].join("\n"), { label: "audit", phase: "Audit", schema: { type: "object", properties: { fixed: { type: "string" }, remaining: { type: "string" }, check: { type: "string" }, test: { type: "string" } }, required: ["fixed", "remaining", "check", "test"] }, effort: "high" });
return { built: all, audit };
