// assignDirections(leads, { directions, categories, reassign }) -> Map<id, Assignment>
//
// Picks a design direction, a palette and variant slots for every lead, so a
// batch of demos never reads as one template with a palette swap. Pure and
// deterministic: the same leads give the same answer on any machine.
//
// Rules, in order:
// 1. A choice already stored on lead.demo (direction, palette, variants) is
//    kept unless options.reassign. A stored palette that belongs to another
//    direction wins over the stored direction, because the app can only change
//    the palette. Stale keys (from the old vertical templates) are ignored.
// 2. A direction must suit the lead's category (its `suits` list). When none
//    does, any direction of the same vertical, then any direction, is allowed.
// 3. Among leads of the same vertical, the least used suitable direction wins,
//    so no two share a direction until every suitable direction is in use.
// 4. Ties go to the direction whose keywords match lead.demoConcept (premium,
//    European, heritage, bilingual, emergency, 24/7, editorial, bold, family,
//    old-school and each direction's own), then to a direction that lists the
//    category earlier in its suits (its home field), then to a stable hash.
// 5. No two leads anywhere share a signature (direction + palette + hero variant)
//    while unused combinations remain; services and proof variants and the hero
//    photo are spread the same way.

import { heroCandidates } from "./stock.js";
import { hashString, hasSpanish } from "./shared.js";

export const ASSIGN_VARIANT_SLOTS = ["hero", "services", "proof"];

// Slashes split words ("BMW/Audi", "before/after") but stay inside numbers ("24/7").
function normalizeText(text) {
  const plain = String(text || "").toLowerCase().replace(/(?<!\d)\/|\/(?!\d)/g, " ").replace(/[^a-z0-9/]+/g, " ");
  return ` ${plain.replace(/\s+/g, " ").trim()} `;
}

// How many of a direction's keywords the lead's concept line mentions.
export function keywordScore(lead, direction) {
  const words = Array.isArray(direction.keywords) ? direction.keywords : [];
  if (!words.length) return 0;
  const text = normalizeText(`${lead.demoConcept || ""} ${hasSpanish(lead) ? "bilingual" : ""}`);
  let score = 0;
  for (const w of words) {
    const k = normalizeText(w);
    if (k.trim() && text.includes(k)) score += 1;
  }
  return score;
}

function verticalOf(categoryKey, categories, fallbackMap) {
  const cat = categories && categories[categoryKey];
  return (cat && cat.vertical) || (fallbackMap && fallbackMap[categoryKey]) || "general";
}

export function directionVerticals(direction, categories, fallbackMap) {
  return [...new Set((direction.suits || []).map((k) => verticalOf(k, categories, fallbackMap)))];
}

// Directions a lead may use, best fit first: suits the category, else same vertical, else any.
export function suitableDirections(lead, directions, { categories, verticalMap } = {}) {
  const list = Object.values(directions);
  const key = lead && lead.categoryKey;
  const bySuit = list.filter((d) => (d.suits || []).includes(key));
  if (bySuit.length) return bySuit;
  const vertical = verticalOf(key, categories, verticalMap);
  const byVertical = list.filter((d) => directionVerticals(d, categories, verticalMap).includes(vertical));
  return byVertical.length ? byVertical : list;
}

function variantList(direction, slot) {
  const v = direction.variants && direction.variants[slot];
  return Array.isArray(v) && v.length ? v : ["default"];
}

function heroPhotoPool(lead, direction, vertical) {
  return heroCandidates({ categoryKey: lead.categoryKey, vertical, imagery: direction.imagery || {} });
}

// The stored choice, cleaned: only keys that still exist survive.
function storedChoice(lead, directions, allowed) {
  const demo = (lead && lead.demo) || {};
  const byPalette = demo.palette ? Object.values(directions).find((d) => d.palettes.some((p) => p.key === demo.palette)) : null;
  let direction = directions[demo.direction] || null;
  // The palette implies its direction (the app edits only the palette).
  if (byPalette && byPalette !== direction) direction = byPalette;
  if (direction && !allowed.includes(direction)) direction = null;
  if (!direction) return null;
  const palette = direction.palettes.some((p) => p.key === demo.palette) ? demo.palette : "";
  const stored = demo.variants && typeof demo.variants === "object" ? demo.variants : {};
  const variants = {};
  for (const slot of ASSIGN_VARIANT_SLOTS) {
    if (variantList(direction, slot).includes(stored[slot])) variants[slot] = stored[slot];
  }
  if (typeof stored.photo === "string") variants.photo = stored.photo;
  return { direction, palette, variants };
}

function inc(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function signatureOf(dirKey, paletteKey, hero) {
  return `${dirKey}/${paletteKey}/${hero}`;
}

export function assignDirections(leads, options = {}) {
  const { directions = {}, categories = {}, reassign = false, verticalMap = {} } = options;
  const list = (Array.isArray(leads) ? leads : []).filter((l) => l && typeof l === "object");
  const out = new Map();
  if (!Object.keys(directions).length) return out;

  const byVertical = new Map(); // vertical -> Map(direction -> count)
  const signatures = new Map();
  const paletteUse = new Map();
  const heroUse = new Map();
  const slotUse = new Map();
  const photoUse = new Map();

  const info = list.map((lead, index) => {
    const vertical = verticalOf(lead.categoryKey, categories, verticalMap);
    const allowed = suitableDirections(lead, directions, { categories, verticalMap });
    const stored = reassign ? null : storedChoice(lead, directions, allowed);
    return { lead, index, vertical, allowed, stored, seed: String(lead.id || lead.business || index) };
  });

  function record(item, choice) {
    const { direction, palette, variants } = choice;
    if (!byVertical.has(item.vertical)) byVertical.set(item.vertical, new Map());
    inc(byVertical.get(item.vertical), direction.key);
    inc(signatures, signatureOf(direction.key, palette, variants.hero));
    inc(paletteUse, `${direction.key}/${palette}`);
    inc(heroUse, `${direction.key}/${variants.hero}`);
    for (const slot of ["services", "proof"]) inc(slotUse, `${direction.key}/${slot}/${variants[slot]}`);
    if (variants.photo) inc(photoUse, variants.photo);
    out.set(item.lead.id, {
      direction: direction.key,
      palette,
      variants: { ...variants },
      signature: signatureOf(direction.key, palette, variants.hero),
    });
  }

  function complete(item, direction, partial) {
    const variants = { ...partial.variants };
    let palette = partial.palette;
    const heroes = variantList(direction, "hero");
    if (!palette || !variants.hero) {
      // Every palette and hero pair, least used first, then by hash.
      const combos = [];
      for (const p of direction.palettes) {
        for (const h of heroes) {
          if (palette && p.key !== palette) continue;
          if (variants.hero && h !== variants.hero) continue;
          combos.push({
            p: p.key,
            h,
            sig: signatures.get(signatureOf(direction.key, p.key, h)) || 0,
            pu: paletteUse.get(`${direction.key}/${p.key}`) || 0,
            hu: heroUse.get(`${direction.key}/${h}`) || 0,
            tie: hashString(`${item.seed}|${p.key}|${h}`),
          });
        }
      }
      combos.sort((a, b) => a.sig - b.sig || a.pu - b.pu || a.hu - b.hu || a.tie - b.tie);
      palette = combos[0].p;
      variants.hero = combos[0].h;
    }
    for (const slot of ["services", "proof"]) {
      if (variants[slot]) continue;
      const options = variantList(direction, slot).map((v) => ({ v, n: slotUse.get(`${direction.key}/${slot}/${v}`) || 0, tie: hashString(`${item.seed}|${slot}|${v}`) }));
      options.sort((a, b) => a.n - b.n || a.tie - b.tie);
      variants[slot] = options[0].v;
    }
    const pool = heroPhotoPool(item.lead, direction, item.vertical);
    if (!pool.some((p) => p.id === variants.photo)) {
      if (pool.length) {
        const ranked = pool.map((p, i) => ({ id: p.id, n: photoUse.get(p.id) || 0, i, tie: hashString(`${item.seed}|photo|${p.id}`) }));
        // Category fit comes first in the pool, so it breaks ties before the hash.
        ranked.sort((a, b) => a.n - b.n || a.i - b.i || a.tie - b.tie);
        variants.photo = ranked[0].id;
      } else {
        variants.photo = "";
      }
    }
    return { direction, palette, variants };
  }

  // Stored choices are placed first so new leads spread around them.
  for (const item of info) {
    if (item.stored) record(item, complete(item, item.stored.direction, item.stored));
  }

  // The rest: most constrained first, then the clearest keyword match, then id.
  const open = info.filter((i) => !i.stored);
  for (const item of open) {
    item.best = Math.max(0, ...item.allowed.map((d) => keywordScore(item.lead, d)));
  }
  open.sort((a, b) => a.allowed.length - b.allowed.length || b.best - a.best || String(a.lead.addedAt || "").localeCompare(String(b.lead.addedAt || "")) || a.seed.localeCompare(b.seed));

  for (const item of open) {
    const counts = byVertical.get(item.vertical) || new Map();
    const ranked = item.allowed.map((d, i) => ({
      d,
      n: counts.get(d.key) || 0,
      k: keywordScore(item.lead, d),
      // A category listed first in suits is the direction's home field.
      r: (d.suits || []).includes(item.lead.categoryKey) ? d.suits.indexOf(item.lead.categoryKey) : 99,
      i,
      tie: hashString(`${item.seed}|${d.key}`),
    }));
    ranked.sort((a, b) => a.n - b.n || b.k - a.k || a.r - b.r || a.tie - b.tie);
    const direction = ranked[0].d;
    record(item, complete(item, direction, { palette: "", variants: {} }));
  }
  return out;
}
