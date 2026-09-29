import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { assignDirections, keywordScore, suitableDirections } from "../src/demo/assign.js";
import { DIRECTIONS } from "../src/demo/directions/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, "seed", "sheet-2026-09-28.json"), "utf8"));
const CATEGORIES = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "categories.json"), "utf8"));

function slug(text) {
  return String(text).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// The 20 seed leads as they sit in the pipeline, with the old template palettes still stored.
const LEADS = SEED.leads.map((row) => ({ ...row, id: slug(`${row.business} ${row.city} ${row.state}`), addedAt: "2026-09-26", demo: { builtAt: "2026-09-28T18:21:21.517Z", template: "auto", palette: "graphite", shareApproved: false } }));
const byName = (name) => LEADS.find((l) => l.business === name);

function assign(leads, opts = {}) {
  return assignDirections(leads, { directions: DIRECTIONS, categories: CATEGORIES, ...opts });
}

test("every seed lead gets a direction that suits its category, and no two share a signature", () => {
  const map = assign(LEADS);
  assert.equal(map.size, 20);
  const sigs = new Set();
  for (const lead of LEADS) {
    const a = map.get(lead.id);
    const d = DIRECTIONS[a.direction];
    assert.ok(d.suits.includes(lead.categoryKey), `${lead.business}: ${a.direction} suits ${lead.categoryKey}`);
    assert.ok(d.palettes.some((p) => p.key === a.palette));
    for (const slot of ["hero", "services", "proof"]) assert.ok(d.variants[slot].includes(a.variants[slot]), `${lead.business} ${slot}`);
    assert.equal(a.signature, `${a.direction}/${a.palette}/${a.variants.hero}`);
    sigs.add(a.signature);
  }
  assert.equal(sigs.size, 20, "20 distinct signatures");
});

test("same vertical leads never share a direction while a suitable one is unused", () => {
  const map = assign(LEADS);
  const byVertical = new Map();
  for (const lead of LEADS) {
    const v = CATEGORIES[lead.categoryKey].vertical;
    if (!byVertical.has(v)) byVertical.set(v, new Map());
    const counts = byVertical.get(v);
    const key = map.get(lead.id).direction;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  for (const lead of LEADS) {
    const counts = byVertical.get(CATEGORIES[lead.categoryKey].vertical);
    const mine = map.get(lead.id).direction;
    if (counts.get(mine) < 2) continue;
    for (const d of suitableDirections(lead, DIRECTIONS, { categories: CATEGORIES })) {
      assert.ok((counts.get(d.key) || 0) >= 1, `${lead.business} shares ${mine} while ${d.key} is unused`);
    }
  }
  // The auto leads spread across the auto directions instead of one template.
  const auto = LEADS.filter((l) => CATEGORIES[l.categoryKey].vertical === "auto").map((l) => map.get(l.id).direction);
  assert.ok(new Set(auto).size >= 7, `auto leads use ${new Set(auto).size} directions`);
});

test("assignment is deterministic and does not depend on input order", () => {
  const a = assign(LEADS);
  const b = assign([...LEADS].reverse());
  for (const lead of LEADS) assert.deepEqual(b.get(lead.id), a.get(lead.id), lead.business);
  assert.deepEqual([...assign(LEADS).entries()], [...a.entries()]);
});

test("demo concept keywords break ties toward the right direction", () => {
  const map = assign(LEADS);
  assert.equal(map.get(byName("Top Tier Auto Repair").id).direction, "auto-euro-atelier", "dark premium European");
  assert.equal(map.get(byName("Most Famous Cutz").id).direction, "barber-cover-story", "bold editorial");
  assert.equal(map.get(byName("Brownie's").id).direction, "barber-after-hours", "old-school with history");
  assert.equal(map.get(byName("A & B Muffler Shop").id).direction, "auto-fab-shop", "custom exhaust and welding");
  assert.ok(keywordScore({ demoConcept: "24/7 roadside" }, DIRECTIONS["auto-heavy-duty"]) >= 2, "24/7 survives normalization");
  assert.ok(keywordScore({ demoConcept: "BMW/Mercedes" }, DIRECTIONS["auto-euro-atelier"]) >= 2, "slashes split words");
  assert.equal(keywordScore({ demoConcept: "", languages: ["Spanish"] }, DIRECTIONS["auto-value-tire"]), 1, "Spanish counts as bilingual");
});

test("stored choices are kept unless reassign, and a stored palette names its direction", () => {
  const cutz = byName("Most Famous Cutz");
  const stored = { ...cutz, demo: { direction: "barber-fade-lab", palette: "fl-mint-shop", variants: { hero: "stacked", services: "tiles", proof: "band", photo: "barber-lineup-clipper-comb" }, shareApproved: false } };
  const leads = LEADS.map((l) => (l.id === cutz.id ? stored : l));
  const kept = assign(leads).get(cutz.id);
  assert.deepEqual(kept, { direction: "barber-fade-lab", palette: "fl-mint-shop", variants: { hero: "stacked", services: "tiles", proof: "band", photo: "barber-lineup-clipper-comb" }, signature: "barber-fade-lab/fl-mint-shop/stacked" });
  assert.deepEqual(assign(leads, { reassign: true }).get(cutz.id), assign(LEADS).get(cutz.id), "reassign ignores the stored choice");

  // The app changes only the palette: a palette from another direction moves the lead there.
  const moved = assign([{ ...cutz, demo: { direction: "barber-fade-lab", palette: "mono-concrete" } }]).get(cutz.id);
  assert.equal(moved.direction, "barber-gallery-mono");
  assert.equal(moved.palette, "mono-concrete");

  // A partial choice keeps what is valid and fills the rest.
  const partial = assign([{ ...cutz, demo: { direction: "barber-after-hours", variants: { hero: "nope" } } }]).get(cutz.id);
  assert.equal(partial.direction, "barber-after-hours");
  assert.ok(DIRECTIONS["barber-after-hours"].variants.hero.includes(partial.variants.hero));

  // Old template palettes and directions that do not fit the vertical are ignored.
  assert.ok(DIRECTIONS[assign([{ ...cutz, demo: { palette: "mint", template: "personal-care" } }]).get(cutz.id).direction].suits.includes("barber"));
  assert.ok(DIRECTIONS[assign([{ ...cutz, demo: { direction: "auto-fab-shop", palette: "fab-sign" } }]).get(cutz.id).direction].suits.includes("barber"));
});

test("new leads spread around stored ones", () => {
  const cutz = byName("Most Famous Cutz");
  const fixed = { ...cutz, demo: { direction: "barber-cover-story", palette: "cover-blood-orange", variants: { hero: "cover" } } };
  const twin = { ...cutz, id: "second-cutz-dallas-tx", business: "Second Cutz" };
  const map = assign([fixed, twin]);
  assert.equal(map.get(fixed.id).direction, "barber-cover-story");
  assert.notEqual(map.get(twin.id).direction, "barber-cover-story");
});

test("a category no direction lists falls back to its vertical, then to any direction", () => {
  const odd = { id: "odd", business: "Odd", categoryKey: "unknown-key", demoConcept: "" };
  const a = assign([odd]).get("odd");
  assert.ok(DIRECTIONS[a.direction]);
  const fake = { ...CATEGORIES, "boat-repair": { vertical: "auto" } };
  const boat = assignDirections([{ id: "b", categoryKey: "boat-repair" }], { directions: DIRECTIONS, categories: fake }).get("b");
  assert.equal(fake[DIRECTIONS[boat.direction].suits[0]].vertical, "auto");
  assert.equal(assignDirections([], { directions: DIRECTIONS }).size, 0);
});
