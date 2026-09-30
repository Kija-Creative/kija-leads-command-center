// Prompt generation: the brief spells out every DNA axis, the truth rules and the divergence
// block in the exact form of the implementation brief's example.
import assert from "node:assert/strict";
import test from "node:test";
import type { IndustryArchetype, SiteDnaRecord } from "../src/design-intelligence/schema.ts";
import { appendHistory, emptyHistory } from "../src/design-intelligence/history.ts";
import { roofing } from "../src/design-intelligence/industries/roofing.ts";
import { buildGenerationBrief, divergenceBlock } from "../src/design-intelligence/prompt-builder.ts";
import type { StockAsset } from "../src/design-intelligence/prompt-builder.ts";
import { selectSiteDna } from "../src/design-intelligence/select-site-dna.ts";
import { abcRoofing, engineData, NOW, stormRoofing } from "./di-fixtures.ts";

const ASSETS: StockAsset[] = [
  { id: "roof-shingle-detail", subject: "Asphalt shingles, close up", alt: "Asphalt shingles, stock photo", caption: "Stock placeholder: asphalt shingles. To be replaced with the owner's own photo.", photographer: "Example Photographer", orientation: "landscape", people: "none" },
];

function pair() {
  let history = emptyHistory();
  const first = selectSiteDna(abcRoofing, engineData(), { now: NOW, history }).record as SiteDnaRecord;
  history = appendHistory(history, first, { event: "select", now: NOW });
  const second = selectSiteDna(stormRoofing, engineData(), { now: NOW, history }).record as SiteDnaRecord;
  history = appendHistory(history, second, { event: "select", now: NOW });
  return { first, second, history };
}

function brief(record: SiteDnaRecord, history = emptyHistory()) {
  const archetype = roofing.archetypes.find((a) => a.id === record.dna.archetype) as IndustryArchetype;
  return buildGenerationBrief({ lead: record.leadId === abcRoofing.id ? abcRoofing : stormRoofing, profile: roofing, archetype, dna: record.dna, facts: record.facts, assets: ASSETS, history, record });
}

test("the brief names every DNA axis with its concrete meaning", () => {
  const { second, history } = pair();
  const { markdown, json } = brief(second, history);
  for (const v of [second.dna.hero, second.dna.navigation, second.dna.typography, second.dna.layoutRhythm, second.dna.geometry, second.dna.imagery, second.dna.motion, second.dna.paletteFamily, second.dna.ctaStyle, second.dna.proofStyle, second.dna.componentDialect]) {
    assert.ok(markdown.includes(`\`${v}\``), `axis value ${v} is spelled out`);
  }
  assert.equal(json.axes.length, 11);
  assert.ok(json.axes.every((a) => a.meaning.length > 20));
  assert.equal(json.sections.length, second.dna.sectionOrder.length);
  assert.ok(json.sections.every((s) => s.job.length > 10));
  assert.match(markdown, /https:\/\/fonts\.googleapis\.com\/css2\?family=/);
  assert.ok(markdown.includes(second.dna.fontPairing?.display.family as string));
  assert.match(markdown, /--radius-control: /);
  assert.match(markdown, /prefers-reduced-motion/);
  assert.match(markdown, /schema\.org type: `RoofingContractor`/);
  assert.match(markdown, /LCP 2\.5s or less, INP 200ms or less, CLS 0\.1 or less/);
  assert.ok(markdown.includes("roof-shingle-detail"));
  assert.ok(markdown.includes("Stock placeholder: asphalt shingles"));
  assert.ok(json.palette.contrast.every((c) => (c.ratio as number) >= 4.5));
});

test("the brief carries the exact facts and the placeholder list", () => {
  const { first } = pair();
  const { markdown, json } = brief(first);
  assert.ok(markdown.includes("| Google rating | 4.9 |"));
  assert.ok(markdown.includes("| Google review count | 212 |"));
  assert.ok(markdown.includes("`warranty`"));
  assert.ok(json.truth.placeholders.includes("warranty"));
  assert.match(markdown, /Never state or imply:/);
  assert.match(markdown, /headed "Coverage on the work" on the page|Coverage on the work: to confirm with the owner/);
  assert.ok(!/make .* a nice website/i.test(markdown), "never a vague prompt");
  const dash = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
  assert.ok(!dash.test(markdown) && !dash.test(JSON.stringify(json)));
});

test("the divergence block has the exact form of the brief's example", () => {
  const { first, second, history } = pair();
  const { markdown, json } = brief(second, history);
  const block = json.divergence.text;
  assert.ok(block.startsWith("RECENT ROOFING WEBSITE DNA\n\nPrevious site:\n"));
  assert.ok(block.includes(`Archetype: ${first.archetypeLabel}\nHero: ${first.dna.hero}\nTypography: ${first.dna.typography}\nLayout: ${first.dna.layoutRhythm}\nGeometry: ${first.dna.geometry}\nImagery: ${first.dna.imagery}\nNavigation: ${first.dna.navigation}\nMotion: ${first.dna.motion}\n\nYOU MAY NOT reproduce this combination.\n\nCurrent target:\n${second.archetypeLabel}\n\nRequired divergence:\n`));
  const required = block.split("Required divergence:\n")[1].split("\n");
  assert.ok(required.length >= 6, `${required.length} required dimensions`);
  for (const r of required) assert.ok(["Hero architecture", "Typography family", "Section composition", "Geometry", "Navigation architecture", "Photography treatment", "Layout rhythm", "Motion level", "Component dialect", "CTA treatment", "Proof treatment", "Palette family", "Archetype"].includes(r), r);
  assert.ok(markdown.includes("```\nRECENT ROOFING WEBSITE DNA"));
});

test("the divergence block says so when the industry has no history yet", () => {
  const { first } = pair();
  const { text, required } = divergenceBlock(first.dna, roofing, []);
  assert.match(text, /^RECENT ROOFING WEBSITE DNA\n\nNo previous roofing site in the history\./);
  assert.deepEqual(required, []);
});
