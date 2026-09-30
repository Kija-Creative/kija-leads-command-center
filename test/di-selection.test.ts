// Design Intelligence Engine: deterministic selection, industry restrictions, brand traits,
// variation scoring and repair, duplicate prevention, locking and override bounds.
import assert from "node:assert/strict";
import test from "node:test";
import type { IndustryArchetype, SiteDNA, SiteDnaRecord } from "../src/design-intelligence/schema.ts";
import { appendHistory, emptyHistory } from "../src/design-intelligence/history.ts";
import type { HistoryFile } from "../src/design-intelligence/history.ts";
import { roofing } from "../src/design-intelligence/industries/roofing.ts";
import { buildSeed, domainOf, hashString, seededOrder, seededPick, seedInput } from "../src/design-intelligence/seed.ts";
import { LOCKED_AXES, lockRecord, selectSiteDna, snapshotOf, validateOverride } from "../src/design-intelligence/select-site-dna.ts";
import { inferBrandTraits } from "../src/design-intelligence/traits.ts";
import { compareSiteDNA, dnaFingerprint, findDuplicate, validateAgainstHistory, variationScore } from "../src/design-intelligence/variation.ts";
import { abcRoofing, engineData, establishedRoofing, NOW, pilatesFixture, pilatesStudio, roofingBatch, stormRoofing } from "./di-fixtures.ts";

function select(lead: Parameters<typeof selectSiteDna>[0], history: HistoryFile = emptyHistory(), extra: Partial<Parameters<typeof selectSiteDna>[2]> = {}) {
  const r = selectSiteDna(lead, engineData(), { now: NOW, history, ...extra });
  assert.ok(r.ok, r.errors.join(" "));
  assert.ok(r.record);
  return r.record as SiteDnaRecord;
}

function allowed(archetype: IndustryArchetype, dna: SiteDNA): void {
  assert.ok(archetype.heroes.includes(dna.hero), `hero ${dna.hero}`);
  assert.ok(archetype.navigation.includes(dna.navigation), `navigation ${dna.navigation}`);
  assert.ok(archetype.typography.includes(dna.typography), `typography ${dna.typography}`);
  assert.ok(archetype.layoutRhythms.includes(dna.layoutRhythm), `layout ${dna.layoutRhythm}`);
  assert.ok(archetype.geometries.includes(dna.geometry), `geometry ${dna.geometry}`);
  assert.ok(archetype.imagery.includes(dna.imagery), `imagery ${dna.imagery}`);
  assert.ok(archetype.motion.includes(dna.motion), `motion ${dna.motion}`);
  assert.ok(archetype.paletteFamilies.includes(dna.paletteFamily), `palette ${dna.paletteFamily}`);
  assert.ok(archetype.ctaStyles.includes(dna.ctaStyle), `cta ${dna.ctaStyle}`);
  assert.ok(archetype.proofStyles.includes(dna.proofStyle), `proof ${dna.proofStyle}`);
  assert.ok(archetype.componentDialects.includes(dna.componentDialect), `dialect ${dna.componentDialect}`);
  assert.equal(dna.sectionOrder[0], "hero");
}

test("the seed is v2's leadId:businessName:domain:industry hashed with hashString", () => {
  const input = { leadId: "x", business: "ABC Roofing", domain: "abcroofing.example", industry: "roofing" };
  assert.equal(seedInput(input), "x:ABC Roofing:abcroofing.example:roofing");
  const a = buildSeed(input);
  assert.equal(a, `fnv1a-${hashString("x:ABC Roofing:abcroofing.example:roofing").toString(16).padStart(8, "0")}`);
  assert.equal(a, buildSeed({ ...input, business: "  ABC Roofing " }), "surrounding whitespace never moves the design");
  assert.notEqual(a, buildSeed({ ...input, industry: "construction" }));
  assert.notEqual(a, buildSeed({ ...input, domain: "" }));
  assert.match(a, /^fnv1a-[0-9a-f]{8}$/);
  assert.equal(domainOf({ website: "https://www.ABCRoofing.example/contact?x=1" }), "abcroofing.example");
  assert.equal(domainOf({ domain: "abc.example", website: "https://other.example" }), "abc.example");
  assert.equal(domainOf({}), "");
  const items = ["a", "b", "c", "d"];
  assert.equal(seededOrder(items, a, "n")[0], seededPick(items, a, "n"));
  assert.deepEqual([...seededOrder(items, a, "n")].sort(), items);
});

test("selection is deterministic: same lead and history give the same DNA", () => {
  const one = select(abcRoofing);
  const two = select(abcRoofing);
  assert.deepEqual(one.dna, two.dna);
  assert.equal(one.fingerprint, dnaFingerprint(one.dna));
  const later = selectSiteDna(abcRoofing, engineData(), { now: "2027-01-01T00:00:00.000Z" }).record as SiteDnaRecord;
  assert.equal(later.fingerprint, one.fingerprint, "the clock never changes the design");
});

test("brand traits come only from verified fields and cite the field", () => {
  const traits = inferBrandTraits(abcRoofing, { now: NOW });
  const names = traits.map((t) => t.trait);
  assert.ok(names.includes("premium"));
  assert.ok(names.includes("craftsmanship"));
  assert.ok(names.includes("highly-rated"));
  for (const t of traits) for (const e of t.evidence) assert.ok(["categoryKey", "city", "reviewThemes", "languages", "googleRating", "googleReviews", "demoConcept", "pitchAngle", "established"].includes(e.field));
  assert.ok(!names.includes("established"), "no established trait without a sourced year");

  const est = inferBrandTraits(establishedRoofing, { now: NOW }).map((t) => t.trait);
  assert.ok(est.includes("established"), "a sourced established year gives established");
  assert.ok(est.includes("heritage"), "38 years gives heritage");
  assert.ok(est.includes("family-owned"), "a review theme that says family owned is a source");

  const wordingOnly = inferBrandTraits({ ...stormRoofing, pitchAngle: "Decades of trust and a family feel." }, { now: NOW }).map((t) => t.trait);
  assert.ok(!wordingOnly.includes("established") && !wordingOnly.includes("heritage") && !wordingOnly.includes("family-owned"), "pitch wording never produces a claim trait");
  assert.ok(wordingOnly.includes("warm"));
});

test("archetypes are scored on trait fit first and stay inside the industry", () => {
  const premium = select(abcRoofing);
  assert.equal(premium.dna.archetype, "premium-residential");
  assert.equal(premium.archetypeScores[0].id, "premium-residential");
  const storm = select(stormRoofing);
  assert.equal(storm.dna.archetype, "blue-collar-modern");
  assert.equal(storm.dna.primaryConversion, "call", "the urgent-need trait puts the call first");
  for (const r of [premium, storm, select(establishedRoofing)]) {
    assert.equal(r.dna.industry, "roofing");
    const a = roofing.archetypes.find((x) => x.id === r.dna.archetype) as IndustryArchetype;
    allowed(a, r.dna);
    assert.ok(roofing.primaryConversions.includes(r.dna.primaryConversion));
    for (const m of [...roofing.requiredModules, ...a.requiredModules]) assert.ok(r.dna.requiredModules.includes(m));
    assert.ok(r.dna.palette && r.dna.fontPairing, "palette tokens and font pairing are resolved");
    assert.equal(r.dna.fontPairing?.typography, r.dna.typography);
  }
});

test("an excluded brand trait keeps an archetype away", () => {
  const r = select(pilatesStudio);
  assert.equal(r.dna.industry, "pilates-fixture");
  const perf = r.archetypeScores.find((s) => s.id === "modern-performance");
  assert.ok(perf && !perf.appropriate && perf.excludedBy.includes("calm"));
  assert.notEqual(r.dna.archetype, "modern-performance");
});

test("roofing and pilates DNA differ across the structural dimensions", () => {
  const roof = select(abcRoofing);
  const pil = select(pilatesStudio);
  const cmp = compareSiteDNA(pil.dna, roof.dna);
  assert.ok(cmp.differenceCount >= 6, `only ${cmp.differenceCount} differ`);
  assert.notDeepEqual(pil.dna.sectionOrder, roof.dna.sectionOrder);
  assert.equal(pil.dna.archetype, "boutique-editorial");
  assert.ok(pilatesFixture.archetypes[0].typography.includes(pil.dna.typography));
});

test("a batch of same-industry leads is kept apart by the repair order", () => {
  let history = emptyHistory();
  const records: SiteDnaRecord[] = [];
  for (const lead of roofingBatch(10)) {
    const r = select(lead, history);
    records.push(r);
    history = appendHistory(history, r, { event: "select", now: NOW });
  }
  const valid = records.filter((r) => r.variation.valid);
  assert.ok(valid.length >= 8, `${valid.length} of 10 valid`);
  for (let i = 1; i < records.length; i += 1) {
    const prev = records[i - 1].dna;
    const cur = records[i].dna;
    const cmp = compareSiteDNA(cur, prev);
    if (records[i].variation.valid) {
      assert.ok(cmp.differenceCount >= 6);
      assert.ok(!cmp.cloneSignatureConflict, "consecutive sites never share hero, sections, typography and geometry");
    }
    // Never only a colour change.
    assert.ok(cmp.differingDimensions.some((d) => d !== "paletteFamily"));
  }
  const repaired = records.filter((r) => r.variation.repairs.length);
  assert.ok(repaired.length > 0, "repairs happen in a crowded industry");
  for (const r of repaired) assert.ok(r.variation.repairs.every((s) => !/palette/i.test(s) || /last resort/i.test(s)), "the palette never changes as a repair on its own");
});

test("repairs follow the brief's order: another archetype first", () => {
  const first = select(abcRoofing);
  // A different fixture lead whose history already holds ABC's exact DNA under another id.
  const twin = { ...abcRoofing, id: "fixture-abc-roofing-twin", business: "ABC Roofing Twin (fixture)" };
  const history = appendHistory(emptyHistory(), first, { event: "select", now: NOW });
  const r = select(twin, history);
  assert.ok(r.variation.valid);
  assert.ok(r.variation.repairs.length > 0);
  assert.match(r.variation.repairs[0], /another appropriate archetype|Other appropriate archetypes|Recomposed|Changed/);
  assert.ok(compareSiteDNA(r.dna, first.dna).differenceCount >= 6);
});

test("variation score is the minimum difference ratio and duplicates are always invalid", () => {
  const a = select(abcRoofing).dna;
  const b = select(stormRoofing).dna;
  assert.equal(variationScore(a, []), 1);
  const ratio = compareSiteDNA(a, b).differenceRatio;
  assert.equal(variationScore(a, [b]), Math.round(ratio * 1000) / 1000);
  assert.equal(variationScore(a, [b, a]), 0);
  assert.equal(findDuplicate(a, [b, { ...a, leadId: "other" }])?.leadId, "other");
  assert.equal(findDuplicate(a, [b]), null);
  const v = validateAgainstHistory(a, [a]);
  assert.equal(v.valid, false);
  assert.equal(v.conflicts[0].result.cloneSignatureConflict, true);
});

test("selection never issues a DNA identical to any earlier entry", () => {
  let history = emptyHistory();
  const seen = new Set<string>();
  for (const lead of roofingBatch(14)) {
    const r = select(lead, history);
    assert.ok(!seen.has(r.fingerprint) || !r.variation.valid, "a valid DNA is never a duplicate");
    if (r.variation.valid) assert.equal(r.variation.duplicateOf, null);
    seen.add(r.fingerprint);
    history = appendHistory(history, r, { event: "select", now: NOW });
  }
});

test("regeneration is stable: a lead is compared only with leads that came before it", () => {
  let history = emptyHistory();
  const batch = roofingBatch(5);
  const firstPass = batch.map((lead) => {
    const r = select(lead, history);
    history = appendHistory(history, r, { event: "select", now: NOW });
    return r.fingerprint;
  });
  const again = batch.map((lead) => select(lead, history).fingerprint);
  assert.deepEqual(again, firstPass);
});

test("locked DNA comes back with its locked axes unless unlocked", () => {
  const record = lockRecord(select(abcRoofing), { by: "Jamey", now: NOW });
  const history = appendHistory(emptyHistory(), { ...select(stormRoofing) }, { event: "select", now: NOW });
  const kept = selectSiteDna(abcRoofing, engineData(), { now: NOW, history, existing: record });
  assert.ok(kept.ok && kept.reused && kept.record);
  assert.equal(kept.record.fingerprint, record.fingerprint);
  assert.deepEqual(LOCKED_AXES.map((k) => kept.record?.dna[k]), LOCKED_AXES.map((k) => record.dna[k]));
  assert.equal(kept.record.locked, true);
  assert.equal(kept.record.dna.locked, true);
  assert.equal(kept.record.lockedBy, "Jamey");
  const unlocked = selectSiteDna(abcRoofing, engineData(), { now: NOW, history, existing: record, unlock: true });
  assert.ok(unlocked.ok && !unlocked.reused && unlocked.record && !unlocked.record.locked);
  const blocked = selectSiteDna(abcRoofing, engineData(), { now: NOW, existing: record, override: { by: "Jamey", fields: { hero: "asymmetric" } } });
  assert.equal(blocked.ok, false);
  assert.match(blocked.errors[0], /locked by Jamey; unlock it before overriding/);
});

test("a lock stored on the lead survives a missing SITE_DNA.json", () => {
  const record = lockRecord(select(abcRoofing), { by: "Jamey", now: NOW });
  const lead = { ...abcRoofing, demoConcept: "Bold storm response site", demo: { shareApproved: false, dna: snapshotOf(record) } };
  const r = selectSiteDna(lead, engineData(), { now: NOW });
  assert.ok(r.ok && r.reused && r.record);
  assert.equal(r.record.fingerprint, record.fingerprint);
  for (const k of LOCKED_AXES) assert.deepEqual(r.record.dna[k], record.dna[k], k);
  assert.equal(r.record.dna.fontPairing?.id, record.dna.fontPairing?.id);
  assert.equal(r.record.locked, true);
  assert.notDeepEqual(r.record.dna.brandTraits, record.dna.brandTraits, "copy and traits refresh from the lead");
});

test("a human override inside the bounds is stored with overridden true", () => {
  const r = selectSiteDna(abcRoofing, engineData(), { now: NOW, override: { by: "Jamey", fields: { archetype: "premium-residential", hero: "asymmetric", navigation: "utility-bar", typography: "grotesk", geometry: "subtle-radius", paletteFamily: "charcoal-stone" } } });
  assert.ok(r.ok, r.errors.join(" "));
  const rec = r.record as SiteDnaRecord;
  assert.equal(rec.overridden, true);
  assert.equal(rec.override?.by, "Jamey");
  assert.equal(rec.dna.hero, "asymmetric");
  assert.equal(rec.dna.navigation, "utility-bar");
  assert.equal(rec.dna.typography, "grotesk");
  assert.equal(rec.dna.fontPairing?.typography, "grotesk");
  assert.equal(rec.dna.palette?.family, "charcoal-stone");
});

test("an override outside the bounds is an error with a sentence", () => {
  const out = selectSiteDna(abcRoofing, engineData(), { now: NOW, override: { by: "Jamey", fields: { archetype: "premium-residential", hero: "product-demo", geometry: "pill" } } });
  assert.equal(out.ok, false);
  assert.ok(out.errors.some((e) => /Hero architecture "product-demo" is outside the Premium Residential bounds for Roofing; allowed: full-bleed, editorial-split, asymmetric\./.test(e)));
  assert.ok(out.errors.some((e) => /Geometry "pill" is outside/.test(e)));
  const archetype = roofing.archetypes[0];
  assert.match(validateOverride({ by: "Jamey", fields: { sectionOrder: ["services", "hero"] } }, roofing, archetype).errors[0], /section order is outside/);
  assert.match(validateOverride({ by: "Jamey", fields: { sectionOrder: ["hero", "made-up"] } }, roofing, archetype).errors[0], /unknown modules: made-up/);
  assert.match(validateOverride({ by: "", fields: {} }, roofing, archetype).errors[0], /needs the name/);
  assert.ok(validateOverride({ by: "Jamey", fields: { sectionOrder: [...archetype.sectionOrders[0]].reverse().sort((a, b) => (a === "hero" ? -1 : b === "hero" ? 1 : 0)) } }, roofing, archetype).ok, "a human may reorder the same sections");
  const bad = selectSiteDna(abcRoofing, engineData(), { now: NOW, override: { by: "Jamey", fields: { archetype: "luxury-yacht" } } });
  assert.equal(bad.ok, false);
  assert.match(bad.errors[0], /not one of Roofing's/);
});

test("the record carries the truth plan and a concise reasoning summary", () => {
  const r = select(abcRoofing);
  assert.ok(r.truth.placeholders.includes("warranty"), "warranty is never claimed");
  assert.ok(r.truth.facts.some((f) => f.field === "googleRating" && f.value === "4.9"));
  const services = r.truth.modules.find((m) => m.module === "services");
  assert.equal(services?.status, "to-confirm", "category default services are labelled to confirm");
  assert.ok(r.reasoningSummary.length >= 5 && r.reasoningSummary.length <= 12);
  assert.ok(r.reasoningSummary.some((l) => /demoConcept/.test(l)), "traits cite their field");
  const dash = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
  assert.ok(!dash.test(JSON.stringify(r)));
});
