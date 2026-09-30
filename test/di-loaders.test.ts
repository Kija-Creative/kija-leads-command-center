// Loaders: industry modules discovered at runtime and validated with sentences, the category
// mapping, base archetype families, component dialects (compounds included) and history.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { SiteDnaRecord } from "../src/design-intelligence/schema.ts";
import { BRAND_TRAITS, GEOMETRY_STYLES, MODULE_KEYS } from "../src/design-intelligence/schema.ts";
import { loadArchetypeFamilies } from "../src/design-intelligence/archetypes.ts";
import { loadDialects } from "../src/design-intelligence/component-dialects.ts";
import { FONT_PAIRINGS, GEOMETRY_TOKENS, MOTION_RULES } from "../src/design-intelligence/design-tokens.ts";
import { appendHistory, comparisonPool, emptyHistory, latestPerLead, loadHistory, MIN_HISTORY_CAP, queryHistory, saveHistory } from "../src/design-intelligence/history.ts";
import { checkCategoryMapping, classifyLead, getIndustry, listIndustries, loadCategories, loadIndustries, validateIndustryProfile } from "../src/design-intelligence/industries.ts";
import { roofing } from "../src/design-intelligence/industries/roofing.ts";
import { MODULE_CATALOG } from "../src/design-intelligence/modules.ts";
import { selectReferences } from "../src/design-intelligence/references.ts";
import type { DesignReference } from "../src/design-intelligence/references.ts";
import { selectSiteDna } from "../src/design-intelligence/select-site-dna.ts";
import { abcRoofing, engineData, NOW, pilatesFixture, roofingBatch } from "./di-fixtures.ts";

function tmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kija-di-"));
}

test("the real industries folder loads roofing with no errors", async () => {
  const reg = await loadIndustries();
  assert.ok(reg.profiles.has("roofing"));
  const roofingErrors = reg.errors.filter((e) => /roofing/.test(e));
  assert.deepEqual(roofingErrors, []);
  assert.equal(getIndustry("roofing")?.label, "Roofing");
  assert.ok(listIndustries().some((i) => i.id === "roofing" && i.archetypes.length === 3));
});

test("an industry is one file: discovered at runtime, validated with sentences", async () => {
  const dir = tmp();
  const good = { ...pilatesFixture, id: "pilates-wellness" };
  fs.writeFileSync(path.join(dir, "pilates-wellness.ts"), `export const pilates = ${JSON.stringify(good)};\n`);
  const bad = { ...pilatesFixture, id: "bad-one", archetypes: [{ ...pilatesFixture.archetypes[0], heroes: ["spinning-globe"], paletteFamilies: ["no-tokens"] }, pilatesFixture.archetypes[1]] };
  fs.writeFileSync(path.join(dir, "bad-one.ts"), `export default ${JSON.stringify(bad)};\n`);
  fs.writeFileSync(path.join(dir, "wrong-name.ts"), `export const profile = ${JSON.stringify({ ...pilatesFixture, id: "something-else" })};\n`);
  fs.writeFileSync(path.join(dir, "_helper.ts"), "export const notAProfile = 1;\n");
  const lowContrast = { ...pilatesFixture, id: "low-contrast", palettes: { ...pilatesFixture.palettes, "linen-clay": { label: "Faint", tone: "light", tokens: { bg: "#ffffff", surface: "#ffffff", ink: "#cccccc", muted: "#dddddd", line: "#eeeeee", primary: "#ffee00", "on-primary": "#ffffff", accent: "#000000" } } } };
  fs.writeFileSync(path.join(dir, "low-contrast.ts"), `export const x = ${JSON.stringify(lowContrast)};\n`);
  fs.writeFileSync(path.join(dir, "index.ts"), "export * from \"./pilates-wellness.ts\";\n");
  // A trust sensitive industry with a motion ceiling may not carry a kinetic archetype.
  const calm = { ...pilatesFixture, id: "calm-clinic", motionCeiling: "subtle" };
  fs.writeFileSync(path.join(dir, "calm-clinic.ts"), `export const x = ${JSON.stringify(calm)};\n`);
  const reg = await loadIndustries(dir);
  assert.deepEqual([...reg.profiles.keys()], ["pilates-wellness"]);
  assert.match(reg.errors.join("\n"), /archetype "modern-performance" allows motion "kinetic", above the industry's motionCeiling "subtle"/);
  assert.ok(!reg.errors.some((e) => /index\.ts/.test(e)), "an index module is not read as a profile");
  const text = reg.errors.join("\n");
  assert.match(text, /archetype "boutique-editorial" heroes has "spinning-globe", which is not one of: full-bleed/);
  assert.match(text, /names the palette family "no-tokens", but the profile's palettes has no tokens for it/);
  assert.match(text, /exports the industry "something-else"; the file must be named something-else\.ts/);
  assert.match(text, /below the WCAG AA 4\.5:1 minimum/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("the supplied roofing profile validates and every vocabulary value is known", () => {
  const check = validateIndustryProfile(roofing, { file: "roofing.ts" });
  assert.deepEqual(check.errors, []);
  for (const a of roofing.archetypes) {
    for (const t of a.suitableBrandTraits) assert.ok((BRAND_TRAITS as readonly string[]).includes(t), t);
    for (const order of a.sectionOrders) for (const m of order) assert.ok((MODULE_KEYS as readonly string[]).includes(m), m);
  }
  for (const k of MODULE_KEYS) assert.ok(MODULE_CATALOG[k].job.length > 10, `${k} has a job`);
  for (const p of FONT_PAIRINGS) assert.ok(!/^Inter$/.test(p.display.family) && !/^Inter$/.test(p.body.family));
  assert.deepEqual(Object.keys(GEOMETRY_TOKENS).sort(), [...GEOMETRY_STYLES].sort());
});

test("every category maps to one industry and sub-industry", async () => {
  const cats = loadCategories();
  for (const [key, c] of Object.entries(cats)) {
    assert.ok(typeof c.industry === "string" && c.industry, `${key} industry`);
    assert.ok(typeof c.subIndustry === "string" && c.subIndustry, `${key} subIndustry`);
  }
  const reg = await loadIndustries();
  const mapping = checkCategoryMapping(cats, reg);
  // Profiles other than roofing are written by other authors; the mapping names what is missing.
  for (const e of mapping.errors) assert.match(e, /has no profile yet \(src\/design-intelligence\/industries\/[a-z-]+\.ts\)/);
  const roof = classifyLead(abcRoofing, { categories: cats, registry: reg });
  assert.ok(roof.ok);
  assert.equal(roof.industry, "roofing");
  const unknown = classifyLead({ ...abcRoofing, categoryKey: "moon-base" }, { categories: engineData().categories, registry: engineData().registry });
  assert.match(unknown.warnings[0], /"moon-base" is not in config\/categories\.json; the general category is used/);
});

test("the editorial family and dialects load; the compound inherits primitives", async () => {
  const fam = loadArchetypeFamilies();
  assert.deepEqual(fam.errors, []);
  assert.ok(fam.families.get("editorial")?.principles.length);
  const d = await loadDialects();
  assert.deepEqual(d.errors, []);
  const editorial = d.dialects.get("editorial");
  const compound = d.dialects.get("editorial-luxury");
  assert.ok(editorial?.primitives);
  assert.ok(compound?.primitives, "editorial-luxury uses editorial primitives until it has its own");
  assert.deepEqual(compound?.parents, ["editorial", "luxury"]);
  for (const item of ["shadcn Dialog behavior", "shadcn Form behavior", "custom typography", "custom button treatment", "custom card treatment", "custom header", "custom section compositions"]) assert.ok(compound?.allowed.includes(item), item);
  for (const item of ["default shadcn card appearance", "generic SaaS bento grids", "gradient blobs", "pill buttons everywhere"]) assert.ok(compound?.forbidden.includes(item), item);
  const p = editorial?.primitives;
  assert.ok(p);
  assert.match(p.button({ label: "Request an estimate", href: "#request", variant: "primary", cta: "request-estimate" }), /data-cta="request-estimate"/);
  assert.match(p.placeholder({ module: "warranty", title: "Coverage on the work", body: "To confirm with the owner." }), /data-module="coverage-terms" data-placeholder="owner-to-confirm"/);
  assert.match(p.field({ id: "ph", name: "phone", label: "Phone", type: "tel" }), /<label class="dx-field__label" for="ph">Phone<\/label>/);
  const rec = selectSiteDna(abcRoofing, engineData(), { now: NOW }).record as SiteDnaRecord;
  const palette = rec.dna.palette;
  const fonts = rec.dna.fontPairing;
  assert.ok(palette && fonts);
  const css = p.css({ dna: rec.dna, palette, fonts, geometry: GEOMETRY_TOKENS[rec.dna.geometry], motion: MOTION_RULES[rec.dna.motion] });
  assert.ok(!/#[0-9a-f]{3,6}\b/i.test(css), "primitives never hard code a colour");
  assert.match(css, /prefers-reduced-motion/);
});

test("history is append only with a cap and answers queries", () => {
  let h = emptyHistory(10);
  assert.equal(h.cap, MIN_HISTORY_CAP, "the cap never goes below 50");
  const records: SiteDnaRecord[] = [];
  for (const lead of roofingBatch(3)) {
    const r = selectSiteDna(lead, engineData(), { now: NOW, history: h }).record as SiteDnaRecord;
    records.push(r);
    h = appendHistory(h, r, { event: "select", now: NOW });
  }
  const before = JSON.stringify(h.entries[0]);
  h = appendHistory(h, records[0], { event: "lock", now: "2026-09-30T00:00:00.000Z" });
  assert.equal(JSON.stringify(h.entries[0]), before, "entries are never edited");
  assert.equal(queryHistory(h).length, 4);
  assert.equal(queryHistory(h, { industry: "roofing" }).length, 4);
  assert.equal(queryHistory(h, { archetype: records[1].dna.archetype }).length, h.entries.filter((e) => e.archetype === records[1].dna.archetype).length);
  assert.deepEqual(latestPerLead(h).map((e) => e.leadId), records.map((r) => r.leadId), "ordered by first appearance");
  assert.deepEqual(comparisonPool(h, records[1].leadId).predecessors.map((e) => e.leadId), [records[0].leadId]);
  let big = emptyHistory(50);
  for (let i = 0; i < 60; i += 1) big = appendHistory(big, { ...records[0], leadId: `x-${i}` }, { event: "build", now: NOW });
  assert.equal(big.entries.length, 50);
  assert.equal(big.entries[0].leadId, "x-10", "the oldest drop past the cap");
  const dir = tmp();
  const file = path.join(dir, "data", "site-dna-history.json");
  saveHistory(file, h);
  assert.deepEqual(loadHistory(file), h);
  assert.equal(loadHistory(path.join(dir, "missing.json")).entries.length, 0);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("references are chosen only when they fit the industry or archetype", () => {
  const refs: DesignReference[] = [
    { id: "roof-premium", title: "Premium roofing conventions", source: "kija-research", path: "research/design-home-contractor.md", license: "Kija research notes", industries: ["roofing"], archetypes: ["roofing/premium-residential"], families: ["editorial"], dialects: ["editorial"], takeaways: ["Lead with finished roofs at large size."] },
    { id: "saas-dark", title: "Dark SaaS", source: "design-playbooks", path: ".design-references/design-playbooks-skill/playbooks/styles/dark-tech.md", license: "MIT", industries: ["saas-technology"], archetypes: [], families: ["technical"], dialects: [], takeaways: ["Dark UI."] },
    { id: "editorial-any", title: "Editorial layouts", source: "design-playbooks", path: ".design-references/design-playbooks-skill/playbooks/styles/elegant-serif.md", license: "MIT", industries: ["*"], archetypes: [], families: ["editorial"], dialects: [], takeaways: ["Type carries hierarchy."] },
  ];
  const picked = selectReferences(refs, { industry: "roofing", archetype: "premium-residential", family: "editorial", dialect: "editorial" });
  assert.deepEqual(picked.map((r) => r.id), ["roof-premium", "editorial-any"]);
  const r = selectSiteDna(abcRoofing, { ...engineData(), references: refs }, { now: NOW }).record as SiteDnaRecord;
  assert.ok(r.dna.referencesUsed.includes("roof-premium"));
  assert.ok(!r.dna.referencesUsed.includes("saas-dark"));
});
