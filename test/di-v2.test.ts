// IMPLEMENTATION-BRIEF-v2.md, Tests: the nine tests Jamey lists, numbered as he numbers them.
// Every business here is a labelled fixture (test/di-fixtures.ts), never a real lead.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { IndustryArchetype, IndustryProfile, SiteDNA, SiteDnaRecord } from "../src/design-intelligence/schema.ts";
import { appendHistory, emptyHistory, memoryHistoryRepository } from "../src/design-intelligence/history.ts";
import type { HistoryFile } from "../src/design-intelligence/history.ts";
import { loadIndustries, validateIndustryProfile } from "../src/design-intelligence/industries.ts";
import { roofing } from "../src/design-intelligence/industries/roofing.ts";
import { BRIEF_SHAPE, buildGenerationBrief } from "../src/design-intelligence/prompt-builder.ts";
import { isHighMotionArchetype, scoreArchetypes, SIMILARITY_PENALTY_CAP } from "../src/design-intelligence/select-archetype.ts";
import { exploreAnotherDirection, LOCKED_AXES, lockRecord, regenerateSiteDna, selectSiteDna } from "../src/design-intelligence/select-site-dna.ts";
import { buildSeed } from "../src/design-intelligence/seed.ts";
import { inferBrandTraits } from "../src/design-intelligence/traits.ts";
import { checkRecent, compareSiteDNA, validateAgainstHistory } from "../src/design-intelligence/variation.ts";
import { abcRoofing, bareRoofing, categories, energeticClinic, engineData, medicalFixture, NOW, pilatesBatch, pilatesFixture, roofingBatch, stormRoofing } from "./di-fixtures.ts";

function select(lead: Parameters<typeof selectSiteDna>[0], extra: Partial<Parameters<typeof selectSiteDna>[2]> = {}, data = engineData()): SiteDnaRecord {
  const r = selectSiteDna(lead, data, { now: NOW, ...extra });
  assert.ok(r.ok, r.errors.join(" "));
  assert.ok(r.record);
  return r.record as SiteDnaRecord;
}

function brief(record: SiteDnaRecord, lead: Parameters<typeof selectSiteDna>[0], history: HistoryFile = emptyHistory(), profile: IndustryProfile = roofing) {
  const archetype = profile.archetypes.find((a) => a.id === record.dna.archetype) as IndustryArchetype;
  return buildGenerationBrief({ lead, profile, archetype, dna: record.dna, facts: record.facts, assets: [], history, record });
}

// A DNA that differs from `base` on exactly the named dimensions (values outside any profile,
// which is fine for the pure comparison functions).
function variant(base: SiteDNA, dims: readonly string[]): SiteDNA {
  const next = structuredClone(base) as unknown as Record<string, unknown>;
  for (const d of dims) {
    if (d === "sectionOrder") next.sectionOrder = [...base.sectionOrder].reverse();
    else next[d] = `${String(next[d])}-changed`;
  }
  return next as unknown as SiteDNA;
}

test("v2 test 1: the same lead produces stable DNA", () => {
  const history = appendHistory(emptyHistory(), select(stormRoofing), { event: "select", now: NOW });
  const a = select(abcRoofing, { history });
  const b = select(abcRoofing, { history });
  assert.deepEqual(a.dna, b.dna);
  // The same history as a repository, as a file value and as a list of entries: same answer.
  assert.equal(select(abcRoofing, { history: memoryHistoryRepository(history) }).fingerprint, a.fingerprint);
  assert.equal(select(abcRoofing, { history: history.entries }).fingerprint, a.fingerprint);
  // The clock never moves the design; the seed is v2's leadId:businessName:domain:industry.
  assert.equal(select(abcRoofing, { history, now: "2027-06-01T00:00:00.000Z" }).fingerprint, a.fingerprint);
  assert.equal(a.dna.seed, buildSeed({ leadId: abcRoofing.id, business: abcRoofing.business, domain: "", industry: "roofing" }));
  assert.equal(a.dna.subIndustry, "roofing", "subIndustry is always populated");
  assert.equal(typeof a.dna.variationScore, "number");
  assert.equal(a.dna.locked, false);
});

test("v2 test 2: a medical practice never selects a high motion kinetic archetype unless explicitly permitted", () => {
  assert.ok(validateIndustryProfile(medicalFixture).ok, validateIndustryProfile(medicalFixture).errors.join(" "));
  const kinetic = medicalFixture.archetypes.find((a) => a.id === "kinetic-clinic") as IndustryArchetype;
  assert.ok(isHighMotionArchetype(kinetic));
  const traits = inferBrandTraits(energeticClinic, { now: NOW }).map((t) => t.trait);
  assert.ok(traits.includes("energetic") && traits.includes("bold"), "the lead's wording fits the kinetic direction best");

  const r = select(energeticClinic);
  assert.notEqual(r.dna.archetype, "kinetic-clinic");
  const score = r.archetypeScores.find((s) => s.id === "kinetic-clinic");
  assert.ok(score && !score.appropriate);
  assert.match((score.notAppropriateBecause || []).join(" "), /high motion kinetic direction in the trust sensitive/);
  assert.ok(!["kinetic", "cinematic"].includes(r.dna.motion));
  assert.notEqual(r.dna.componentDialect, "kinetic");

  // Crowding the history with medical sites never pushes the choice onto the kinetic archetype.
  let history = emptyHistory();
  for (let i = 0; i < 8; i += 1) {
    const rec = select({ ...energeticClinic, id: `fixture-clinic-${i}`, business: `Example Clinic ${i} (fixture)` }, { history });
    assert.notEqual(rec.dna.archetype, "kinetic-clinic", `clinic ${i}`);
    history = appendHistory(history, rec, { event: "select", now: NOW });
  }

  // Explicit permission, on the archetype or for one run, is the only way in.
  const permitted: IndustryProfile = { ...medicalFixture, archetypes: medicalFixture.archetypes.map((a) => (a.id === "kinetic-clinic" ? { ...a, permitsHighMotion: true } : a)) };
  assert.equal(select(energeticClinic, {}, engineData([permitted])).dna.archetype, "kinetic-clinic");
  assert.equal(select(energeticClinic, { allowHighMotion: true }).dna.archetype, "kinetic-clinic");
});

test("v2 test 3: fewer than six meaningful differences fails", () => {
  const base = select(abcRoofing).dna;
  const five = variant(base, ["archetype", "navigation", "paletteFamily", "imagery", "motion"]);
  const r5 = compareSiteDNA(five, base);
  assert.equal(r5.differenceCount, 5);
  assert.equal(r5.cloneSignatureConflict, true, "hero, typography, geometry and sections all still match");
  assert.equal(r5.valid, false);
  const fiveSafe = variant(base, ["hero", "navigation", "paletteFamily", "imagery", "motion"]);
  const s5 = compareSiteDNA(fiveSafe, base);
  assert.equal(s5.differenceCount, 5);
  assert.equal(s5.cloneSignatureConflict, false);
  assert.equal(s5.valid, false, "five differences fail even without the clone signature");
  const six = variant(base, ["hero", "navigation", "paletteFamily", "imagery", "motion", "ctaStyle"]);
  assert.equal(compareSiteDNA(six, base).valid, true);
  // A palette change alone is one difference, never a new design.
  const palette = compareSiteDNA(variant(base, ["paletteFamily"]), base);
  assert.equal(palette.differenceCount, 1);
  assert.equal(palette.valid, false);
  // The same industry bar is stricter: six is not enough against a recent same industry site.
  const recent = checkRecent(six, [{ dna: base, sameIndustry: true }]);
  assert.equal(recent.valid, false);
  assert.equal(recent.comparisons[0].required, 7);
  assert.equal(checkRecent(six, [{ dna: base, sameIndustry: false }]).valid, true);
});

test("v2 test 4: the same hero, typography, geometry and section order fails against the previous site", () => {
  const previous = select(abcRoofing).dna;
  const others = ["archetype", "navigation", "paletteFamily", "layoutRhythm", "imagery", "motion", "ctaStyle", "proofStyle", "componentDialect"];
  const candidate = variant(previous, others);
  const r = compareSiteDNA(candidate, previous);
  assert.equal(r.differenceCount, 9, "nine of thirteen differ");
  assert.equal(r.cloneSignatureConflict, true);
  assert.equal(r.valid, false, "the hard clone rule fails it anyway");
  assert.deepEqual(r.matchingDimensions.sort(), ["geometry", "hero", "sectionOrder", "typography"]);
  assert.equal(validateAgainstHistory(candidate, [previous]).valid, false);
  // Selection never issues a clone of the previous site, in a crowded industry either.
  let history = emptyHistory();
  let last: SiteDNA | null = null;
  for (const lead of roofingBatch(8)) {
    const rec = select(lead, { history });
    if (last && rec.variation.valid) assert.equal(compareSiteDNA(rec.dna, last).cloneSignatureConflict, false);
    last = rec.dna;
    history = appendHistory(history, rec, { event: "select", now: NOW });
  }
});

test("v2 test 5: locked DNA survives regeneration", () => {
  const locked = lockRecord(select(abcRoofing), { by: "Jamey", now: NOW });
  const history = appendHistory(emptyHistory(), locked, { event: "lock", now: NOW });
  // The copy changes (new wording, new phone): facts evolve, the locked axes do not.
  const changed = { ...abcRoofing, phone: "214-555-0199", demoConcept: "Bold storm response site with an emergency call CTA and crew photos." };
  const again = regenerateSiteDna(changed, engineData(), { now: NOW, history, existing: locked });
  assert.ok(again.ok && again.record, again.errors.join(" "));
  const rec = again.record as SiteDnaRecord;
  for (const k of LOCKED_AXES) assert.deepEqual(rec.dna[k], locked.dna[k], `${k} is locked`);
  assert.equal(rec.dna.fontPairing?.id, locked.dna.fontPairing?.id);
  assert.equal(rec.dna.industry, locked.dna.industry);
  assert.equal(rec.dna.primaryConversion, locked.dna.primaryConversion);
  assert.equal(rec.locked, true);
  assert.equal(rec.lockedBy, "Jamey");
  assert.ok(rec.truth.facts.some((f) => f.field === "phone" && f.value === "214-555-0199"), "facts are refreshed");
  // Inside the lock a regeneration may only move the free axes.
  assert.notEqual(rec.fingerprint, locked.fingerprint);
  // A plain run keeps the locked DNA as it is.
  const plain = selectSiteDna(changed, engineData(), { now: NOW, history, existing: locked });
  assert.ok(plain.ok && plain.reused);
  assert.equal(plain.record?.fingerprint, locked.fingerprint);
  // Exploring and overriding need an unlock first.
  const explore = exploreAnotherDirection(changed, engineData(), { now: NOW, history, existing: locked });
  assert.equal(explore.ok, false);
  assert.match(explore.errors[0], /locked by Jamey; unlock it before exploring another direction/);
  assert.equal(selectSiteDna(changed, engineData(), { now: NOW, history, existing: locked, override: { by: "Jamey", fields: { hero: "asymmetric" } } }).ok, false);
  // Unlocked, regenerate keeps industry and conversion and moves at least six dimensions,
  // deterministically; explore moves to another appropriate archetype.
  const open = select(abcRoofing);
  const regen = select(abcRoofing, { existing: open, regenerate: true });
  assert.equal(regen.dna.industry, open.dna.industry);
  assert.equal(regen.dna.primaryConversion, open.dna.primaryConversion);
  assert.ok(compareSiteDNA(regen.dna, open.dna).differenceCount >= 6);
  assert.equal(select(abcRoofing, { existing: open, regenerate: true }).fingerprint, regen.fingerprint, "regeneration is deterministic");
  const explored = select(abcRoofing, { existing: open, explore: true });
  assert.notEqual(explored.dna.archetype, open.dna.archetype);
  assert.ok(explored.archetypeScores.find((s) => s.id === explored.dna.archetype)?.appropriate);
});

test("v2 test 6: recent same industry sites influence diversity", () => {
  // (a) The archetype score carries a bounded penalty for what the last few roofing sites used.
  const traits = inferBrandTraits(abcRoofing, { now: NOW });
  const conversion = { primary: "request-estimate", secondary: "call", reason: "" };
  const plain = scoreArchetypes(roofing, traits, conversion, "seed");
  const recent = Array.from({ length: 4 }, () => ({ industry: "roofing", archetype: "premium-residential" }));
  const crowded = scoreArchetypes(roofing, traits, conversion, "seed", { recentSameIndustry: recent });
  const p0 = plain.find((s) => s.id === "premium-residential");
  const p1 = crowded.find((s) => s.id === "premium-residential");
  assert.ok(p0 && p1);
  assert.equal(p1.similarityPenalty, Math.min(SIMILARITY_PENALTY_CAP, 4 + 3 + 2 + 1));
  assert.ok(p1.score < p0.score);
  // Between equally fitting archetypes the penalty decides; it never revives an inappropriate one.
  const tie: IndustryProfile = { ...roofing, archetypes: roofing.archetypes.map((a) => ({ ...a, suitableBrandTraits: ["local"], excludedBrandTraits: a.id === "blue-collar-modern" ? ["local"] : [] })) };
  const local = inferBrandTraits(bareRoofing, { now: NOW });
  const noHistory = scoreArchetypes(tie, local, conversion, "seed");
  const first = noHistory[0].id;
  const other = noHistory.find((s) => s.appropriate && s.id !== first)?.id as string;
  const withHistory = scoreArchetypes(tie, local, conversion, "seed", { recentSameIndustry: [{ industry: "roofing", archetype: first }] });
  assert.equal(withHistory[0].id, other, "the recent archetype steps aside for an equally fitting one");
  const allPenalised = scoreArchetypes(tie, local, conversion, "seed", { recentSameIndustry: [first, other, first, other].map((archetype) => ({ industry: "roofing", archetype })) });
  assert.equal(allPenalised.find((s) => s.id === "blue-collar-modern")?.appropriate, false);
  assert.notEqual(allPenalised[0].id, "blue-collar-modern");

  // (b) A roofing site older than the global window is still compared, at the stricter bar.
  let history = emptyHistory();
  const firstRoofer = select(abcRoofing, { history });
  history = appendHistory(history, firstRoofer, { event: "select", now: NOW });
  for (const studio of pilatesBatch(10)) history = appendHistory(history, select(studio, { history }), { event: "select", now: NOW });
  const twin = { ...abcRoofing, id: "fixture-abc-roofing-twin", business: "ABC Roofing Twin (fixture)" };
  const second = select(twin, { history });
  const vsFirst = second.variation.comparisons.find((c) => c.leadId === abcRoofing.id);
  assert.ok(vsFirst, "the earlier roofer is in the comparison set although ten sites came after it");
  assert.equal(vsFirst.sameIndustry, true);
  assert.equal(vsFirst.required, 7);
  assert.ok(compareSiteDNA(second.dna, firstRoofer.dna).differenceCount >= 7);
  assert.equal(second.variation.industryComparedWith, 1);
  // Without the industry window the old roofer falls out of the global window entirely.
  const blind = select(twin, { history, industryLookback: 0 });
  assert.ok(!blind.variation.comparisons.some((c) => c.leadId === abcRoofing.id));
});

test("v2 test 7: prompt generation never invents unavailable trust signals", () => {
  const rec = select(bareRoofing);
  const { markdown, json } = brief(rec, bareRoofing);
  const sourced = json.trustSignals.filter((t) => t.status === "sourced").map((t) => t.signal);
  // Only what the record holds: the service area (city) and nothing else.
  assert.deepEqual(sourced, ["service-area"]);
  for (const t of json.trustSignals) {
    if (t.status !== "sourced") assert.equal(t.value, "", `${t.signal} carries no value`);
  }
  for (const signal of ["google-rating", "licenses", "warranty", "financing", "manufacturer-certifications", "crew", "real-projects"]) {
    assert.equal(json.trustSignals.find((t) => t.signal === signal)?.status, "placeholder", signal);
  }
  const sourcedLine = markdown.split("\n").find((l) => l.startsWith("Trust signals this industry leans on.")) as string;
  assert.ok(sourcedLine && !/rating|licen|warrant|financ|certif|crew|projects/i.test(sourcedLine), sourcedLine);
  const unsourcedLine = markdown.split("\n").find((l) => l.startsWith("Not in the record, so owner-to-confirm slots")) as string;
  for (const label of ["real projects", "google rating and review count", "licenses", "coverage on the work", "payment options", "the crew"]) assert.ok(unsourcedLine.includes(label), label);
  assert.ok(!/\| Google rating \|/.test(markdown), "no rating row without a recorded rating");
  assert.ok(!/\b[0-5]\.[0-9] from \d+/.test(markdown), "no invented rating");
  assert.ok(!/\bsince (19|20)\d\d\b|\d+ years/i.test(markdown), "no invented tenure");
  // With a recorded rating the value is stated exactly as recorded.
  const rated = brief(select(abcRoofing), abcRoofing);
  assert.equal(rated.json.trustSignals.find((t) => t.signal === "google-rating")?.value, "4.9 from 212 Google reviews");
});

test("v2 test 8: the prompt builder contains the Site DNA, required modules and forbidden patterns", () => {
  let history = emptyHistory();
  const first = select(abcRoofing, { history });
  history = appendHistory(history, first, { event: "select", now: NOW });
  const rec = select(stormRoofing, { history });
  const { markdown, json } = brief(rec, stormRoofing, history);
  // v2's shape, in order, after the authority statement.
  const headings = markdown.split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3));
  assert.deepEqual(headings.slice(0, BRIEF_SHAPE.length), [...BRIEF_SHAPE]);
  assert.deepEqual(json.shape.map((s) => s.heading), [...BRIEF_SHAPE]);
  assert.match(markdown, /SITE DNA IS THE VISUAL AUTHORITY\. .*may not be ignored/);
  assert.ok(markdown.indexOf("SITE DNA IS THE VISUAL AUTHORITY") < markdown.indexOf("## BUSINESS"));
  // The DNA itself.
  assert.ok(markdown.includes(rec.fingerprint));
  for (const v of [rec.dna.hero, rec.dna.navigation, rec.dna.typography, rec.dna.layoutRhythm, rec.dna.geometry, rec.dna.imagery, rec.dna.motion, rec.dna.paletteFamily, rec.dna.ctaStyle, rec.dna.proofStyle, rec.dna.componentDialect, rec.dna.primaryConversion, rec.dna.archetype, rec.dna.industry]) {
    assert.ok(markdown.includes(`\`${v}\``), `DNA value ${v}`);
  }
  const order = rec.dna.sectionOrder.map((m) => markdown.indexOf(`. \`${m}\` (`));
  assert.ok(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), "sections listed in DNA order");
  // Required modules and forbidden patterns.
  const required = markdown.slice(markdown.indexOf("## REQUIRED"), markdown.indexOf("## AVOID"));
  for (const m of rec.dna.requiredModules) assert.ok(required.includes(`\`${m}\``), `required ${m}`);
  const avoid = markdown.slice(markdown.indexOf("## AVOID"), markdown.indexOf("## TRUTH RULES"));
  for (const f of rec.dna.forbiddenPatterns) assert.ok(avoid.includes(`\`${f}\``), `forbidden ${f}`);
  // Divergence, truth, references and code sources are all still there.
  assert.ok(markdown.includes("```\nRECENT ROOFING WEBSITE DNA"));
  for (const h of ["## TRUTH RULES", "## DIVERGENCE FROM RECENT SITES", "## REFERENCES", "## CODE SOURCES", "## MARKERS THE AUDIT READS"]) assert.ok(markdown.includes(h), h);
  assert.match(markdown, /shadcn\/ui: forms, dialogs/);
  assert.match(markdown, /design-playbooks-skill/);
  const dash = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
  assert.ok(!dash.test(markdown));
});

test("v2 test 9: adding an industry profile does not require changing the selection engine", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kija-di-v2-"));
  const bakery: IndustryProfile = {
    ...pilatesFixture,
    id: "bakery-fixture",
    label: "Bakery (fixture)",
    primaryConversions: ["order", "visit"],
    requiredModules: ["menu", "hours", "locations"],
    preferredTrustSignals: ["food", "menu", "hours", "locations", "google-rating"],
    subIndustries: { bakery: { label: "Bakery", schemaOrgType: "Bakery" } },
    schemaOrgType: "Bakery",
    archetypes: pilatesFixture.archetypes.map((a) => ({ ...a, sectionOrders: [["hero", "menu", "story", "hours", "locations", "contact"]], requiredModules: ["menu"] })),
  };
  fs.writeFileSync(path.join(dir, "bakery-fixture.ts"), `export const bakery = ${JSON.stringify(bakery)};\n`);
  const reg = await loadIndustries(dir);
  assert.deepEqual(reg.errors, []);
  assert.ok(reg.profiles.has("bakery-fixture"));
  const lead = { ...abcRoofing, id: "fixture-bakery-dallas-tx", business: "Example Bakery (fixture)", category: "Bakery", categoryKey: "bakery", demoConcept: "Boutique editorial bakery site with a calm menu." };
  const data = { registry: reg, categories: { ...categories, bakery: { label: "Bakery", vertical: "food", industry: "bakery-fixture", subIndustry: "bakery", serviceDefaults: ["Bread", "Pastry"] } } };
  const r = selectSiteDna(lead, data, { now: NOW });
  assert.ok(r.ok && r.record, r.errors.join(" "));
  assert.equal(r.record.dna.industry, "bakery-fixture");
  assert.equal(r.record.dna.subIndustry, "bakery");
  assert.equal(r.record.dna.schemaType, "Bakery");
  assert.ok(bakery.archetypes.some((a) => a.id === r.record?.dna.archetype));
  assert.ok(r.record.dna.trustSignals?.includes("menu"));
  // The engine's own code never names the new industry.
  const engineDir = path.join(import.meta.dirname, "..", "src", "design-intelligence");
  for (const f of fs.readdirSync(engineDir).filter((n) => n.endsWith(".ts"))) {
    assert.ok(!fs.readFileSync(path.join(engineDir, f), "utf8").includes("bakery-fixture"), f);
  }
  fs.rmSync(dir, { recursive: true, force: true });
});
