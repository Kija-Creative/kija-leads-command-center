import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { assignDirections } from "../src/demo/assign.js";
import { DIRECTIONS, validateDirection } from "../src/demo/directions/index.js";
import { checkDemoHtml, DASH_RE } from "../src/demo/guardrails.js";
import { renderDemo } from "../src/demo/render.js";
import { isLibraryUrl, libraryPhoto } from "../src/demo/stock.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATEGORIES = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "categories.json"), "utf8"));
const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, "seed", "sheet-2026-09-28.json"), "utf8"));
const NOW = "2026-09-28T12:00:00.000Z";
const KEYS = ["auto-value-tire", "auto-gloss-studio", "auto-roadside-dispatch", "auto-fab-shop"];

function slug(text) {
  return String(text).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function sample(categoryKey, extra = {}) {
  return {
    id: `sample-${categoryKey}-irving-tx`,
    business: "Sample Shop",
    category: CATEGORIES[categoryKey].label,
    categoryKey,
    city: "Irving",
    state: "TX",
    phone: "972-555-0100",
    googleRating: 4.8,
    googleReviews: 155,
    services: [],
    reviewThemes: [],
    languages: [],
    demo: {},
    addedAt: "2026-09-26",
    ...extra,
  };
}

const RICH = {
  services: ["Tire sales", "Window tint", "Custom exhaust", "Flat repair", "Wheel alignment"],
  reviewThemes: ["Honest about what the car needs", "Quick on a busy day"],
  hours: "Mon to Sat 8am to 6pm",
  address: "1200 W Main St",
  area: "Oak Cliff",
  languages: ["English", "Spanish"],
};

function render(lead, key, { palette, hero, services, proof } = {}) {
  const d = DIRECTIONS[key];
  return renderDemo(lead, {
    categories: CATEGORIES,
    now: NOW,
    assignment: { direction: key, palette: palette || d.palettes[0].key, variants: { hero: hero || d.variants.hero[0], services: services || d.variants.services[0], proof: proof || d.variants.proof[0], photo: "" } },
  });
}

function markup(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/g, "");
}

test("the four auto-b directions are implemented, valid and distinct", () => {
  const fonts = new Set();
  for (const key of KEYS) {
    const d = DIRECTIONS[key];
    assert.equal(d.status, "implemented", key);
    assert.deepEqual(validateDirection(d).errors, [], key);
    assert.ok(d.palettes.length >= 3, key);
    for (const slot of ["hero", "services", "proof"]) assert.ok(d.variants[slot].length >= 1, `${key} ${slot}`);
    assert.ok(d.variants.hero.length >= 2, `${key} has two heroes so signatures stay unique`);
    assert.match(d.fontsHref, /^https:\/\/fonts\.googleapis\.com\/css2\?/);
    fonts.add(d.fontsHref);
  }
  assert.equal(fonts.size, KEYS.length, "each direction has its own type pairing");
});

test("every palette, variant and suited category renders and passes every guardrail, in English and Spanish", () => {
  for (const key of KEYS) {
    const d = DIRECTIONS[key];
    for (const cat of d.suits) {
      for (const p of d.palettes) {
        for (const hero of d.variants.hero) {
          for (const extra of [{}, RICH]) {
            const lead = sample(cat, extra);
            const services = d.variants.services[(d.palettes.indexOf(p)) % d.variants.services.length];
            const proof = d.variants.proof[d.variants.hero.indexOf(hero) % d.variants.proof.length];
            const { html, direction } = render(lead, key, { palette: p.key, hero, services, proof });
            const label = `${key}/${cat}/${p.key}/${hero}${extra === RICH ? "/rich" : ""}`;
            assert.equal(direction, key, label);
            assert.deepEqual(checkDemoHtml(html, lead).errors, [], label);
            assert.equal(DASH_RE.test(html), false, `${label}: no dashes`);
            assert.doesNotMatch(html, /\$\d/, `${label}: no prices`);
            assert.equal((html.match(/<form\b/g) || []).length, 1, `${label}: one request form`);
            assert.match(html, /<section[^>]+id="request"/, `${label}: the form lives in #request`);
            if (extra === RICH) {
              assert.ok(html.includes("data-lang=\"es\""), `${label}: Spanish toggle`);
              assert.ok(html.includes("Mon to Sat 8am to 6pm"), `${label}: sourced hours`);
            } else {
              assert.ok(html.includes("Hours to confirm with the owner."), `${label}: hours to confirm`);
              assert.equal(html.includes("class=\"b-themes"), false, `${label}: no themes block without themes`);
            }
          }
        }
      }
    }
  }
});

test("chooser radios belong to the request form, so a pick travels with the request", () => {
  for (const key of KEYS) {
    for (const cat of DIRECTIONS[key].suits) {
      const { html } = render(sample(cat), key);
      const formId = (html.match(/<form id="([^"]+)" class="req-form"/) || [])[1];
      assert.ok(formId, `${key}/${cat}: the request form has an id`);
      const owned = [...markup(html).matchAll(/<input[^>]+\sform="([^"]+)"/g)].map((m) => m[1]);
      assert.ok(owned.length >= 4, `${key}/${cat}: chooser inputs`);
      for (const f of owned) assert.equal(f, formId, `${key}/${cat}: input points at the form`);
    }
  }
});

test("value tire: the sidewall spells the picked size for tire shops, a symptom for repair shops", () => {
  const tire = render(sample("tire-shop"), "auto-value-tire").html;
  assert.match(tire, /<textPath[^>]*>[\s\S]*?vt-o--def[^>]*>225<\/tspan>/, "sidewall shows the default width");
  for (const name of ["width", "aspect", "rim"]) assert.match(tire, new RegExp(`name="${name}"`), name);
  assert.match(tire, /html:has\(#[\w-]+:checked\) \.vt-o-[\w-]+\{display:inline\}/, "CSS shows the checked size");
  assert.ok(tire.includes("How to read"), "size explainer");
  assert.match(tire, /type="file"[^>]*name="sidewall"/, "sidewall photo fallback");
  const repair = render(sample("auto-repair"), "auto-value-tire").html;
  assert.match(repair, /name="symptom"/);
  assert.equal(repair.includes("name=\"width\""), false, "no tire finder on a repair shop");
  assert.ok(render(sample("tire-shop", { languages: ["Spanish"] }), "auto-value-tire").html.includes("Se habla español"));
  assert.equal(tire.includes("Se habla español"), false, "only when the record lists Spanish");
});

test("gloss studio: the finish chooser fits the trade and tint shows only when tint is a service", () => {
  const detail = render(sample("auto-detailing"), "auto-gloss-studio").html;
  assert.ok(detail.includes("Pick your"));
  assert.match(detail, /name="tint"/, "detailing defaults include window tint");
  const body = render(sample("auto-body-collision"), "auto-gloss-studio").html;
  assert.ok(body.includes("What is your"), "body shops ask about the paint");
  assert.equal(body.includes("name=\"tint\""), false);
  assert.equal(render(sample("auto-detailing", { services: ["Ceramic coating", "Interior detailing"] }), "auto-gloss-studio").html.includes("name=\"tint\""), false);
  assert.ok(render(sample("mobile-mechanic"), "auto-gloss-studio").html.includes("Where is"));
  assert.match(detail, /class="callbar callbar--split"/);
});

test("roadside dispatch: call first, a situation chooser with a note for every tile, and no photos for towing", () => {
  for (const cat of DIRECTIONS["auto-roadside-dispatch"].suits) {
    const { html } = render(sample(cat), "auto-roadside-dispatch");
    const body = markup(html);
    const tiles = [...body.matchAll(/name="situation" value="([\w-]+)"/g)].map((m) => m[1]);
    assert.equal(tiles.length, 6, cat);
    for (const k of tiles) assert.ok(body.includes(`rd-note rd-note--${k}"`), `${cat}: a note for ${k}`);
    const main = body.slice(body.indexOf("<main>"));
    assert.ok(main.indexOf("class=\"rd-call\"") < main.indexOf("rd-chooser"), `${cat}: the call button comes before the chooser`);
    assert.ok((body.match(/href="tel:\+19725550100"/g) || []).length >= 6, `${cat}: the phone repeats in every band`);
  }
  const towing = render(sample("towing"), "auto-roadside-dispatch");
  assert.deepEqual(towing.photos, [], "the library has no tow trucks");
  assert.ok(render(sample("diesel-truck-repair"), "auto-roadside-dispatch").photos.length > 0);
  const area = render(sample("towing", { area: "Oak Cliff" }), "auto-roadside-dispatch").html;
  assert.ok(area.includes("Oak Cliff") && area.includes("Service area to confirm with the owner."));
});

test("fab shop: menu board, symptom tags, a stamped badge with the city and the exact rating", () => {
  const { html } = render(sample("muffler-exhaust"), "auto-fab-shop");
  assert.match(html, /class="fb-board/);
  assert.match(html, /name="symptom"/);
  assert.match(html, /class="fb-badge"[\s\S]*?IRVING[\s\S]*?data-rating-num>4\.8</);
  assert.match(html, /fb-pipe__body/);
  const themed = render(sample("muffler-exhaust", { reviewThemes: ["Straight answers"] }), "auto-fab-shop").html;
  assert.ok(themed.includes("Straight answers"));
  const withMap = render(sample("muffler-exhaust", { address: "1 Main St" }), "auto-fab-shop").html;
  assert.ok(withMap.includes("Bring it by"), "directions CTA when there is a map link");
});

test("photos are library photos of the trade, credited, never repeated", () => {
  for (const key of KEYS) {
    for (const cat of DIRECTIONS[key].suits) {
      for (const hero of DIRECTIONS[key].variants.hero) {
        const { html, photos } = render(sample(cat), key, { hero });
        const tags = markup(html).match(/<img\b[^>]*>/g) || [];
        assert.equal(tags.length, photos.length, `${key}/${cat}/${hero}`);
        assert.equal(new Set(photos).size, photos.length);
        for (const tag of tags) assert.ok(isLibraryUrl(tag.match(/\ssrc="([^"]+)"/)[1].replace(/&amp;/g, "&")));
        for (const id of photos) {
          const p = libraryPhoto(id);
          assert.notEqual(p.people, "face", `${key}: no faces`);
          if (cat !== "diesel-truck-repair" && key !== "auto-roadside-dispatch") assert.doesNotMatch(id, /diesel|semi/, `${key}/${cat}: no trucks on a car shop`);
        }
      }
    }
  }
});

test("seed leads assigned to these directions render and pass, deterministically", () => {
  const leads = SEED.leads.map((row) => ({ ...row, id: slug(`${row.business} ${row.city} ${row.state}`), demo: {}, addedAt: "2026-09-26" }));
  const map = assignDirections(leads, { directions: DIRECTIONS, categories: CATEGORIES });
  let count = 0;
  for (const lead of leads) {
    const a = map.get(lead.id);
    if (!KEYS.includes(a.direction)) continue;
    count += 1;
    const first = renderDemo(lead, { categories: CATEGORIES, now: NOW, assignment: a });
    assert.deepEqual(checkDemoHtml(first.html, lead).errors, [], lead.business);
    assert.equal(renderDemo(lead, { categories: CATEGORIES, now: NOW, assignment: a }).html, first.html, `${lead.business}: deterministic`);
  }
  assert.ok(count >= 1, "at least one seed lead lands on an auto-b direction");
});
