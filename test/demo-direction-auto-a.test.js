// Auto directions, group a: neighborhood bay, euro atelier, collision
// showroom and heavy duty. Every combination renders and passes the
// guardrails, and each direction's own CSS only interactions point at real
// inputs inside the demo form.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DIRECTIONS, validateDirection } from "../src/demo/directions/index.js";
import { checkDemoHtml, DASH_RE } from "../src/demo/guardrails.js";
import { renderDemo } from "../src/demo/render.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATEGORIES = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "categories.json"), "utf8"));
const NOW = "2026-09-28T12:00:00.000Z";
const KEYS = ["auto-neighborhood-bay", "auto-euro-atelier", "auto-collision-showroom", "auto-heavy-duty"];

function sample(categoryKey, extra = {}) {
  return {
    id: `sample-${categoryKey}-dallas-tx`,
    business: "Sample Shop",
    category: CATEGORIES[categoryKey] ? CATEGORIES[categoryKey].label : "Local service",
    categoryKey,
    city: "Dallas",
    state: "TX",
    phone: "214-555-0100",
    googleRating: 4.8,
    googleReviews: 211,
    services: [],
    reviewThemes: [],
    languages: [],
    demo: {},
    addedAt: "2026-09-26",
    ...extra,
  };
}

function rich(categoryKey) {
  return sample(categoryKey, {
    area: "Oak Cliff",
    services: ["Brake work", "Diagnostics", "Exhaust and welding", "Tire repair"],
    reviewThemes: ["Explains the problem before fixing it", "Fair about the bill"],
    hours: "Mon to Fri 8am to 6pm",
    address: "123 Main St",
    languages: ["English", "Spanish"],
  });
}

function render(key, lead, { palette, hero, services, proof } = {}) {
  const d = DIRECTIONS[key];
  const assignment = {
    direction: key,
    palette: palette || d.palettes[0].key,
    variants: { hero: hero || d.variants.hero[0], services: services || d.variants.services[0], proof: proof || d.variants.proof[0], photo: "" },
  };
  return renderDemo(lead, { categories: CATEGORIES, settings: { demoDefaults: { conceptRibbon: true } }, now: NOW, assignment });
}

function body(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
}

function formOf(html) {
  const m = html.match(/<form\b[\s\S]*?<\/form>/);
  assert.ok(m, "the page has a request form");
  return m[0];
}

function duplicateIds(html) {
  const ids = [...body(html).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  return ids.filter((id, i) => ids.indexOf(id) !== i);
}

test("the four auto directions are implemented, valid and distinct", () => {
  const fonts = new Set();
  for (const key of KEYS) {
    const d = DIRECTIONS[key];
    assert.ok(d, key);
    assert.equal(d.status, "implemented", key);
    assert.deepEqual(validateDirection(d).errors, [], key);
    assert.ok(d.palettes.length >= 3, `${key} palettes`);
    assert.ok(d.variants.hero.length >= 2, `${key} has two heroes so signatures stay unique`);
    assert.equal(fonts.has(d.fontsHref), false, `${key} has its own type`);
    fonts.add(d.fontsHref);
    // The design skill's overused list, which the brief named for the atelier.
    assert.doesNotMatch(d.fontsHref, /Instrument\+Sans|Instrument\+Serif|IBM\+Plex|Montserrat|Open\+Sans/, key);
  }
});

test("every auto direction renders for each category it suits, in every palette and variant, and passes the guardrails", () => {
  for (const key of KEYS) {
    const d = DIRECTIONS[key];
    for (const cat of d.suits) {
      for (const palette of d.palettes) {
        for (const hero of d.variants.hero) {
          for (const services of d.variants.services) {
            for (const proof of d.variants.proof) {
              for (const lead of [sample(cat), rich(cat)]) {
                const { html, direction } = render(key, lead, { palette: palette.key, hero, services, proof });
                const label = `${key}/${cat}/${palette.key}/${hero}/${services}/${proof}${lead.hours ? " rich" : ""}`;
                assert.equal(direction, key);
                assert.deepEqual(checkDemoHtml(html, lead).errors, [], label);
                assert.equal(DASH_RE.test(html), false, label);
                assert.deepEqual(duplicateIds(html), [], `${label}: ids are unique`);
                assert.doesNotMatch(body(html), /\$\s?\d/, `${label}: no prices`);
              }
            }
          }
        }
      }
    }
  }
});

test("a lead with no phone still renders a complete page with no call bar", () => {
  for (const key of KEYS) {
    for (const cat of DIRECTIONS[key].suits) {
      const lead = sample(cat, { phone: "" });
      for (const hero of DIRECTIONS[key].variants.hero) {
        const { html } = render(key, lead, { hero });
        assert.deepEqual(checkDemoHtml(html, lead).errors, [], `${key}/${cat}/${hero}`);
        assert.doesNotMatch(html, /href="tel:/, `${key}/${cat}`);
        assert.match(html, /id="request"/);
      }
    }
  }
});

test("neighborhood bay: every hero symptom chip ticks a radio inside the request form", () => {
  for (const cat of DIRECTIONS["auto-neighborhood-bay"].suits) {
    const { html } = render("auto-neighborhood-bay", sample(cat));
    const form = formOf(html);
    const targets = [...body(html).matchAll(/<label class="nb-chip" for="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(targets.length >= 5, `${cat}: symptom chips`);
    for (const id of targets) assert.match(form, new RegExp(`<input type="radio" id="${id}"`), `${cat}: ${id} is a radio in the form`);
    // The picked chip lights up through :has on the same id.
    assert.match(html, new RegExp(`:root:has\\(#${targets[0]}:checked\\) \\.nb-chip\\[for="${targets[0]}"\\]`), cat);
    assert.match(html, /class="nb-ro"/, `${cat}: the local card is a repair order`);
  }
  // Mobile mechanics use the roadside form's own question instead of adding one.
  const mobile = formOf(render("auto-neighborhood-bay", sample("mobile-mechanic")).html);
  assert.equal((mobile.match(/name="concern"/g) || []).length, 0);
  assert.match(mobile, /id="rq-issue-no-start"/);
});

test("euro atelier: a spec sheet, one accent word per heading and a mileage field for repairs", () => {
  const { html } = render("auto-euro-atelier", rich("auto-repair"));
  const h2s = [...body(html).matchAll(/<h2 class="ea-h2"[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1]);
  assert.ok(h2s.length >= 4);
  for (const h of h2s) assert.equal((h.match(/<em>/g) || []).length, 1, h);
  assert.match(formOf(html), /id="rq-mileage"/);
  assert.match(body(html), /class="b-svc__n" aria-hidden="true">01</);
  const detailing = render("auto-euro-atelier", sample("auto-detailing")).html;
  assert.doesNotMatch(formOf(detailing), /rq-mileage/, "mileage belongs to the repair intake only");
  assert.match(detailing, /data-form-kind="photo-estimate"/);
  // The no photo hero draws the coupe; the plate hero shows a library photo.
  assert.match(render("auto-euro-atelier", sample("auto-repair"), { hero: "spot" }).html, /class="ea-coupe"/);
  assert.match(render("auto-euro-atelier", sample("auto-repair"), { hero: "plate" }).html, /<img[^>]+data-hero/);
});

test("collision showroom: the damage diagram tags the form, and the slider works without a script", () => {
  for (const cat of DIRECTIONS["auto-collision-showroom"].suits) {
    for (const hero of DIRECTIONS["auto-collision-showroom"].variants.hero) {
      const { html } = render("auto-collision-showroom", sample(cat), { hero });
      const form = formOf(html);
      const zones = [...body(html).matchAll(/<label class="cs-(?:zone|pick) [^"]+" for="([^"]+)"/g)].map((m) => m[1]);
      assert.ok(zones.length >= 6, `${cat}/${hero}: damage zones`);
      for (const id of zones) assert.match(form, new RegExp(`id="${id}" name="area"`), `${cat}: ${id}`);
      const stops = body(html).match(/name="cs-ba"/g) || [];
      assert.equal(stops.length, 9, `${cat}/${hero}: nine slider stops`);
      assert.equal((body(html).match(/name="cs-ba" id="cs-ba-\d" value="\d+" checked/g) || []).length, 1, "one stop starts checked");
      assert.match(html, /@property --pos/);
      assert.match(html, /Illustration\. Reflection lines/, "the slider says it is an illustration, not the shop's work");
    }
  }
  const booth = render("auto-collision-showroom", sample("auto-body-collision"), { hero: "booth" });
  assert.match(booth.html, /<img[^>]+data-hero/);
  assert.ok(booth.photos.length >= 2);
});

test("heavy duty: the call leads, trucks get a unit field, and towing shows no photos", () => {
  const diesel = render("auto-heavy-duty", rich("diesel-truck-repair"));
  assert.match(diesel.html, /class="hd-board"/);
  assert.match(diesel.html, /class="hd-board__tel" href="tel:\+12145550100"/);
  assert.match(diesel.html, /class="hd-callpanel__tel" href="tel:/);
  assert.match(formOf(diesel.html), /id="rq-unit"/);
  assert.match(diesel.html, /Running a fleet\?/, "fleet service is phrased as a question");
  assert.match(body(diesel.html), /<label for="rq-where">/, "the location helper points at the where field");
  for (const hero of DIRECTIONS["auto-heavy-duty"].variants.hero) {
    const tow = render("auto-heavy-duty", sample("towing"), { hero });
    assert.deepEqual(tow.photos, [], `towing/${hero}: no photos`);
    assert.match(tow.html, /class="hd-road"/);
    assert.doesNotMatch(formOf(tow.html), /rq-unit/);
  }
});

test("owner approved copy replaces the auto directions' own promise, about and primary action", () => {
  for (const key of KEYS) {
    for (const hero of DIRECTIONS[key].variants.hero) {
      const lead = sample(DIRECTIONS[key].suits[0], { demoCopy: { headline: "Owner approved headline", about: "Owner approved about text", ctaPrimary: "Ring the shop" } });
      const { html } = render(key, lead, { hero });
      for (const text of ["Owner approved headline", "Owner approved about text", "Ring the shop"]) assert.ok(html.includes(text), `${key}/${hero}: ${text}`);
      assert.deepEqual(checkDemoHtml(html, lead).errors, [], `${key}/${hero}`);
    }
  }
});

test("the Spanish toggle covers the auto directions' own chrome", () => {
  for (const key of KEYS) {
    const lead = rich(DIRECTIONS[key].suits[0]);
    const { html } = render(key, lead);
    assert.match(html, /data-lang="es"/, key);
    assert.ok((html.match(/data-i18n="/g) || []).length > 40, `${key}: chrome is bilingual`);
  }
});
