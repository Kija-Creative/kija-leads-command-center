// The home services and contractor directions (research/design-home-contractor.md):
// every one renders for every category it suits, in every palette and hero,
// in English and Spanish, and passes the guardrails; and each keeps the
// signature details its brief asks for.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DIRECTIONS, validateDirection } from "../src/demo/directions/index.js";
import { initials } from "../src/demo/directions/hs-fleet-livery.js";
import { checkDemoHtml } from "../src/demo/guardrails.js";
import { renderDemo } from "../src/demo/render.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATEGORIES = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "categories.json"), "utf8"));
const NOW = "2026-09-28T12:00:00.000Z";

const KEYS = [
  "hs-dispatch-triage",
  "hs-warm-modern",
  "hs-fleet-livery",
  "hs-field-guide",
  "hs-calm-response",
  "ct-dark-craft",
  "ct-site-survey",
  "ct-outdoor-living",
  "ct-local-crew",
];

function lead(categoryKey, extra = {}) {
  return {
    id: `hc-${categoryKey}-dallas-tx`,
    business: "Sample Shop",
    category: CATEGORIES[categoryKey] ? CATEGORIES[categoryKey].label : "Local service",
    categoryKey,
    city: "Dallas",
    state: "TX",
    phone: "214-555-0100",
    googleRating: 4.8,
    googleReviews: 127,
    services: [],
    reviewThemes: [],
    languages: [],
    demo: {},
    addedAt: "2026-09-26",
    ...extra,
  };
}

function render(l, key, { palette, hero, services, proof } = {}) {
  const d = DIRECTIONS[key];
  const assignment = {
    direction: key,
    palette: palette || d.palettes[0].key,
    variants: { hero: hero || d.variants.hero[0], services: services || d.variants.services[0], proof: proof || d.variants.proof[0], photo: "" },
  };
  return renderDemo(l, { categories: CATEGORIES, settings: {}, now: NOW, assignment });
}

function markup(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/g, " ");
}

function ids(html) {
  return [...markup(html).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
}

// WCAG relative luminance contrast, for the palette checks.
function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

test("the nine home services and contractor directions are implemented and valid", () => {
  for (const key of KEYS) {
    const d = DIRECTIONS[key];
    assert.ok(d, key);
    assert.equal(d.status, "implemented", key);
    assert.deepEqual(validateDirection(d).errors, [], key);
    assert.ok(d.palettes.length >= 3, `${key} palettes`);
    assert.ok(d.variants.hero.length >= 2, `${key} has two heroes so signatures stay unique`);
  }
  const fonts = KEYS.map((k) => DIRECTIONS[k].fontsHref);
  assert.equal(new Set(fonts).size, fonts.length, "every direction has its own type pairing");
});

test("every direction renders for every category it suits, in every palette and hero, English and Spanish, and passes every guardrail", () => {
  for (const key of KEYS) {
    const d = DIRECTIONS[key];
    for (const cat of d.suits) {
      for (const p of d.palettes) {
        for (const hero of d.variants.hero) {
          for (const languages of [[], ["English", "Spanish"]]) {
            const l = lead(cat, { languages });
            const { html } = render(l, key, { palette: p.key, hero });
            const where = `${key}/${cat}/${p.key}/${hero}/${languages.length ? "es" : "en"}`;
            assert.deepEqual(checkDemoHtml(html, l).errors, [], where);
            const dupes = ids(html).filter((id, i, all) => all.indexOf(id) !== i);
            assert.deepEqual(dupes, [], `${where}: ids are unique`);
            assert.equal((markup(html).match(new RegExp("\\sid=\"request\"", "g")) || []).length, 1, `${where}: one request section`);
            for (const m of markup(html).matchAll(/href="#([a-z0-9-]+)"/g)) {
              assert.ok(ids(html).includes(m[1]), `${where}: link #${m[1]} has a target`);
            }
          }
        }
      }
    }
  }
});

test("rich records with themes, hours, address and own services pass in every direction and variant", () => {
  for (const key of KEYS) {
    const d = DIRECTIONS[key];
    for (const services of d.variants.services) {
      for (const proof of d.variants.proof) {
        const l = lead(d.suits[0], {
          hours: "Mon to Fri 7am to 6pm",
          address: "400 Elm St",
          reviewThemes: ["Explains the options clearly", "Cleans up after the job"],
          services: ["First custom service", "Second custom service", "Third custom service"],
          languages: ["Spanish"],
        });
        const { html } = render(l, key, { services, proof });
        assert.deepEqual(checkDemoHtml(html, l).errors, [], `${key}/${services}/${proof}`);
        assert.ok(html.includes("Explains the options clearly"), `${key} themes`);
        assert.ok(html.includes("400 Elm St"), `${key} address`);
      }
    }
  }
});

test("palettes keep body text, muted text and buttons readable", () => {
  for (const key of KEYS) {
    for (const p of DIRECTIONS[key].palettes) {
      const v = p.vars;
      assert.ok(contrast(v.ink, v.bg) >= 4.5, `${p.key} ink on bg`);
      assert.ok(contrast(v.ink, v.surface) >= 4.5, `${p.key} ink on surface`);
      assert.ok(contrast(v.muted, v.bg) >= 4.5, `${p.key} muted on bg`);
      assert.ok(contrast(v["on-primary"], v.primary) >= 4.5, `${p.key} button text`);
      if (v.band && v["on-band"]) assert.ok(contrast(v["on-band"], v.band) >= 4.5, `${p.key} band text`);
    }
  }
});

test("dispatch triage: every picker chip points at a radio inside the request form", () => {
  const { html } = render(lead("plumbing"), "hs-dispatch-triage");
  const form = html.match(/<form id="dt-form"[\s\S]*?<\/form>/);
  assert.ok(form, "the request form carries the picker id");
  const labels = [...html.matchAll(/<label class="dt-chip" for="(dt-pb-\d)"/g)].map((m) => m[1]);
  assert.equal(labels.length, 6, "six chips from the services");
  for (const id of labels) assert.match(form[0], new RegExp(`name="problem" id="${id}"`), id);
  assert.match(html, /While you wait/);
  assert.match(html, /General guidance only, not instructions from the business/);
  assert.match(html, /data-urgent/, "the emergency form keeps its urgency choice");
});

test("warm modern draws the trade's system into the house cutaway", () => {
  const marks = { hvac: "wm-cool", plumbing: "wm-dash", electrical: "wm-glow", "garage-door": "wm-spring", "appliance-repair": "wm-sys-fill", general: "wm-glow" };
  for (const [cat, mark] of Object.entries(marks)) {
    const { html } = render(lead(cat), "hs-warm-modern");
    assert.match(html, /class="wm-art"/, cat);
    assert.ok(html.includes(mark), `${cat} system drawn`);
  }
  const hvac = render(lead("hvac"), "hs-warm-modern").html;
  assert.equal((hvac.match(/id="wm-q-\d"/g) || []).length, 3, "three home check toggles");
  assert.match(hvac, /Nothing is saved or sent/);
});

test("fleet livery builds a monogram from the name", () => {
  assert.equal(initials("Prime Time Septic Pumping, Inc."), "PTS");
  assert.equal(initials("A & B Plumbing"), "ABP");
  assert.equal(initials("The Drain Co."), "D");
  assert.equal(initials("Hermanos Garcia Home Services and Repair"), "HGH");
  assert.equal(initials("Zed"), "Z");
  const { html } = render(lead("septic", { business: "Prime Time Septic Pumping, Inc." }), "hs-fleet-livery");
  assert.ok((html.match(/class="fl-badge"/g) || []).length >= 2, "badge in header and footer");
  assert.match(html, /class="fl-plate"/, "the phone as a plate");
});

test("field guide shows a line drawn plate and never a photo of a pest", () => {
  for (const cat of DIRECTIONS["hs-field-guide"].suits) {
    const { html, photos } = render(lead(cat), "hs-field-guide");
    assert.match(html, /class="fg-plate"/, cat);
    assert.match(html, /An illustration, for reference/, cat);
    for (const id of photos) assert.doesNotMatch(id, /pest|bug|mold|damage/, `${cat}: ${id}`);
  }
});

test("calm response puts a large call first and labels the steps as general guidance", () => {
  for (const cat of DIRECTIONS["hs-calm-response"].suits) {
    const { html } = render(lead(cat), "hs-calm-response");
    assert.match(html, /<a class="cr-bigcall" href="tel:\+12145550100">/, cat);
    assert.match(html, /General safety guidance, not instructions from the business/, cat);
    assert.match(html, /The typical process for this kind of job/, cat);
  }
});

test("dark craft draws its material once and sets the phone large in the footer", () => {
  for (const cat of DIRECTIONS["ct-dark-craft"].suits) {
    const { html } = render(lead(cat), "ct-dark-craft");
    assert.equal((html.match(/<symbol id="dc-tex"/g) || []).length, 1, cat);
    assert.match(html, /<a class="dc-ft__tel" href="tel:/, cat);
  }
});

test("site survey has a drawing, a job sheet and the concept title block", () => {
  for (const cat of DIRECTIONS["ct-site-survey"].suits) {
    const l = lead(cat, { languages: ["Spanish"] });
    const { html } = render(l, "ct-site-survey");
    assert.match(html, /class="ss-drawing"/, cat);
    assert.ok(html.includes("Concept sheet 01"), cat);
    assert.ok(html.includes("Job sheet"), cat);
    assert.deepEqual(checkDemoHtml(html, l).errors, [], cat);
  }
});

test("outdoor living puts the planner chips inside the estimate form and labels the gallery Ideas", () => {
  const { html } = render(lead("landscaping"), "ct-outdoor-living");
  const form = html.match(/<form\b[\s\S]*?<\/form>/)[0];
  assert.match(form, /name="project"/);
  assert.match(form, /name="scale"/);
  assert.match(form, /name="timeline"/);
  assert.match(html, /<h2 class="ol-h2">Ideas<\/h2>/);
  assert.match(html, /not projects by this business/);
  assert.doesNotMatch(html, /our (work|projects)/i);
});

test("local crew: the hero card is its own demo form and the page keeps one request form kind", () => {
  const l = lead("roofing");
  const { html } = render(l, "ct-local-crew");
  const forms = html.match(/<form\b[^>]*>/g) || [];
  assert.equal(forms.length, 2, "hero card plus the full estimate form");
  for (const f of forms) assert.match(f, /data-demo-form/);
  assert.equal((html.match(/data-form-kind=/g) || []).length, 1);
  assert.equal((markup(html).match(/data-demo-status/g) || []).length, 2, "each form answers with the concept notice");
  assert.ok(html.includes("Request an inspection"), "roofing asks for an inspection");
  assert.match(html, /class="lc-final__tel"/);
});

test("categories without matching stock photos still render complete pages with art", () => {
  for (const [key, cat] of [["ct-dark-craft", "concrete"], ["ct-site-survey", "foundation-repair"], ["ct-local-crew", "concrete"], ["hs-dispatch-triage", "electrical"]]) {
    const d = DIRECTIONS[key];
    for (const hero of d.variants.hero) {
      const l = lead(cat);
      const { html } = render(l, key, { hero });
      assert.deepEqual(checkDemoHtml(html, l).errors, [], `${key}/${cat}/${hero}`);
      assert.match(html, /<svg[^>]+viewBox="0 0 (1600 900|560 440|600 440|24 24)"/, `${key}: art stands in for the photo`);
    }
  }
});
