// The salon and studio directions: linen editorial (hair and nail salons),
// swatch pop (nail salons), ink noir (tattoo studios, and barbers) and bath
// club (pet groomers). Every render must pass the guardrails, keep Book on the
// page in several places, show the rating near the top and again by the form,
// and use the flow the trade expects.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DIRECTIONS, validateDirection } from "../src/demo/directions/index.js";
import { checkDemoHtml, DASH_RE } from "../src/demo/guardrails.js";
import { renderDemo } from "../src/demo/render.js";
import { libraryPhoto } from "../src/demo/stock.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATEGORIES = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "categories.json"), "utf8"));
const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, "seed", "sheet-2026-09-28.json"), "utf8"));
const NOW = "2026-09-28T12:00:00.000Z";
const KEYS = ["salon-linen-editorial", "nail-swatch-pop", "tattoo-ink-noir", "pet-bath-club"];
// The design skill's overused list; the brief named some of these.
const OVERUSED = /Instrument\+Serif|Newsreader|Space\+Mono|Fraunces|Playfair|DM\+Serif|IBM\+Plex|Inter(?![a-z+])|Space\+Grotesk/;

function lead(categoryKey, extra = {}) {
  return {
    id: `studio-${categoryKey}-dallas-tx`,
    business: "Sample Studio",
    category: CATEGORIES[categoryKey].label,
    categoryKey,
    city: "Dallas",
    state: "TX",
    area: "Deep Ellum",
    phone: "214-555-0100",
    googleRating: 4.8,
    googleReviews: 211,
    services: [],
    reviewThemes: [],
    languages: [],
    demo: {},
    demoCopy: {},
    addedAt: "2026-09-26",
    ...extra,
  };
}

function rich(categoryKey) {
  return lead(categoryKey, {
    services: ["Signature service", "Second service", "Third service", "Fourth service"],
    reviewThemes: ["Careful detail work", "Easy to book"],
    hours: "Tue to Sat 10am to 7pm",
    address: "2800 Elm St",
    languages: ["English", "Spanish"],
  });
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

// The markup of one section, found by its id.
function section(html, id) {
  const at = html.indexOf(`id="${id}"`);
  if (at < 0) return "";
  const start = html.lastIndexOf("<section", at);
  return html.slice(start, html.indexOf("</section>", at) + "</section>".length);
}

function withoutScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/g, "");
}

test("the four studio directions are implemented, valid and use fonts off the overused list", () => {
  const palettes = new Set();
  for (const key of KEYS) {
    const d = DIRECTIONS[key];
    assert.equal(d.status, "implemented", key);
    assert.deepEqual(validateDirection(d).errors, [], key);
    assert.ok(d.palettes.length >= 3, `${key} has three or more palettes`);
    for (const p of d.palettes) {
      assert.ok(!palettes.has(p.key), `${p.key} is unique`);
      palettes.add(p.key);
    }
    for (const slot of ["hero", "services", "proof"]) assert.ok(d.variants[slot].length >= 2, `${key} has two ${slot} variants`);
    assert.doesNotMatch(d.fontsHref, OVERUSED, `${key} fonts`);
    assert.equal(d.callbar, "split", `${key} puts Call and Book side by side on phones`);
  }
});

test("every studio direction passes the guardrails for every category, palette and variant, in English and Spanish", () => {
  let count = 0;
  for (const key of KEYS) {
    const d = DIRECTIONS[key];
    for (const cat of d.suits) {
      for (const p of d.palettes) {
        for (const hero of d.variants.hero) {
          for (const services of d.variants.services) {
            for (const proof of d.variants.proof) {
              for (const l of [lead(cat), rich(cat)]) {
                const out = render(l, key, { palette: p.key, hero, services, proof });
                const label = `${key}/${cat}/${p.key}/${hero}/${services}/${proof}${l.languages.length ? " es" : ""}`;
                assert.equal(out.direction, key, label);
                assert.deepEqual(checkDemoHtml(out.html, l).errors, [], label);
                assert.equal(DASH_RE.test(out.html), false, `${label} has no dashes`);
                assert.doesNotMatch(out.html, /\$\d/, `${label} shows no prices`);
                count += 1;
              }
            }
          }
        }
      }
    }
  }
  assert.ok(count > 200, `rendered ${count} pages`);
});

test("Book shows in the header, hero, floating pill and closing band, and every Book link opens the form on the page", () => {
  for (const key of KEYS) {
    for (const cat of DIRECTIONS[key].suits) {
      for (const hero of DIRECTIONS[key].variants.hero) {
        const { html } = render(lead(cat), key, { hero });
        const label = `${key}/${cat}/${hero}`;
        assert.ok((html.match(/href="#request"/g) || []).length >= 5, `${label} links to the form often`);
        assert.match(html, /class="b-hd__cta" href="#request"/, `${label} header Book`);
        assert.match(html, /class="b-float" href="#request"/, `${label} floating Book`);
        assert.match(html, /class="callbar callbar--split"/, `${label} phone bar`);
        assert.match(html, /id="request"[\s\S]*data-demo-form/, `${label} form lives in the request section`);
        const heroHtml = section(html, "top");
        assert.match(heroHtml, /href="#request"/, `${label} hero Book`);
        assert.match(heroHtml, /href="tel:\+12145550100"/, `${label} hero Call`);
        assert.ok(html.lastIndexOf("href=\"#request\"") > html.indexOf(`id="request"`), `${label} Book again after the form`);
      }
    }
  }
});

test("the rating sits within one scroll of the hero and repeats beside the form", () => {
  for (const key of KEYS) {
    for (const cat of DIRECTIONS[key].suits) {
      for (const proof of DIRECTIONS[key].variants.proof) {
        const { html } = render(rich(cat), key, { proof });
        const label = `${key}/${cat}/${proof}`;
        const first = html.indexOf("data-rating=");
        const firstService = html.search(/id="(menu|styles)"/);
        assert.ok(first > 0 && first < firstService, `${label} rating comes before the services`);
        assert.match(section(html, "request"), /data-rating="4.8"/, `${label} rating beside the form`);
      }
    }
  }
});

test("team sections are placeholders, never stock faces, and no page shows a face photo", () => {
  for (const key of KEYS) {
    for (const cat of DIRECTIONS[key].suits) {
      const out = render(rich(cat), key);
      const team = section(out.html, "team");
      if (team) {
        assert.doesNotMatch(team, /<img\b/, `${key}/${cat} team has no photos`);
        assert.match(team, /Placeholders\./, `${key}/${cat} team says it is a placeholder`);
      }
      for (const id of out.photos) assert.notEqual(libraryPhoto(id).people, "face", `${key}/${cat} shows ${id}`);
    }
  }
});

test("photos match the trade: nails show nails, groomers show dogs, tattoo studios show tattoo work", () => {
  const fit = { "hair-salon": /salon-interior|color|foil|shampoo/, "nail-salon": /manicure|nail/, tattoo: /tattoo/, "pet-grooming": /dog/, barber: /^barber-/ };
  for (const key of KEYS) {
    for (const cat of DIRECTIONS[key].suits) {
      const out = render(rich(cat), key);
      assert.ok(out.photos.length >= 1, `${key}/${cat} shows at least the hero photo`);
      for (const id of out.photos) assert.match(id, fit[cat], `${key}/${cat} photo ${id}`);
      assert.match(out.html, /<img[^>]+data-hero/, `${key}/${cat} hero photo loads first`);
    }
  }
});

test("linen editorial: a consultation callout before booking, stylist chairs, and the italic phrase survives Spanish", () => {
  const hair = render(rich("hair-salon"), "salon-linen-editorial").html;
  assert.ok(hair.includes("Start with a consultation."));
  assert.ok(hair.indexOf("id=\"consult\"") < hair.indexOf("id=\"request\""), "the callout comes before the form");
  assert.ok(hair.includes("Chair 01") && hair.includes("Chair 04"));
  assert.match(hair, /<em><span data-i18n="[^"]+">your way\.<\/span><\/em>/, "the italic phrase is its own translated piece");
  assert.match(hair, /data-form-flavor="salon"/);
  const nails = render(lead("nail-salon"), "salon-linen-editorial").html;
  assert.ok(nails.includes("Bring your inspiration."), "nail studios get the inspiration callout");
  assert.ok(nails.includes("Book your set"), "a nail studio books a set, not a chair");
  for (const hero of ["arch", "portal"]) {
    const framed = render(lead("hair-salon"), "salon-linen-editorial", { hero }).html;
    assert.match(framed, hero === "arch" ? /class="ln-arch"/ : /class="ln-dome"/, `${hero} hero frame`);
  }
});

test("swatch pop: services as swatch cards, add ons from the lead's own services inside the booking form", () => {
  const out = render(rich("nail-salon"), "nail-swatch-pop");
  const form = section(out.html, "request");
  assert.equal((form.match(/name="addon"/g) || []).length, 4, "one add on per sourced service");
  assert.ok(form.indexOf("name=\"addon\"") < form.indexOf("class=\"f-submit\""), "add ons sit before the submit");
  assert.ok(form.includes("Signature service"));
  assert.match(section(out.html, "menu"), /class="sw-card" href="#request"/);
  const bare = render(lead("nail-salon", { services: ["Only one"] }), "nail-swatch-pop");
  assert.equal(bare.html.includes("name=\"addon\""), false, "no add ons for a single service");
  assert.deepEqual(checkDemoHtml(bare.html, lead("nail-salon", { services: ["Only one"] })).errors, []);
  const hair = render(lead("hair-salon"), "nail-swatch-pop").html;
  assert.ok(hair.includes("Book your chair"), "a hair salon books a chair");
});

test("ink noir: a custom piece inquiry, the four step process, aftercare and generic age questions for studios", () => {
  const tattoo = render(rich("tattoo"), "tattoo-ink-noir");
  const html = tattoo.html;
  for (const f of ["placement", "size", "ink", "person"]) assert.match(section(html, "request"), new RegExp(`name="${f}"`), f);
  assert.ok(html.includes("Start a custom piece"));
  assert.equal((section(html, "process").match(/<li class="rv">/g) || []).length, 4, "inquiry, consult, session, aftercare");
  assert.ok(html.includes("General guidance only. The studio"), "aftercare is labelled as general guidance");
  assert.ok(html.includes("Is there an age requirement?"), "age and ID language stays generic, in the FAQ");
  assert.ok(html.includes("Ask for station 01"), "studios book a station");
  assert.equal(html.includes("Book chair 01"), false);
  assert.match(html, /"[^"]+":\["Ask for station 01","Reservar estación 01"\]/, "the language toggle keeps the station label");
  // The same direction on a barber reads as a barbershop.
  const brownies = SEED.leads.find((l) => l.business === "Brownie's");
  const barberLead = { ...brownies, id: "brownies-dallas-tx", services: [], reviewThemes: [], languages: [], demo: {}, demoCopy: {}, addedAt: "2026-09-26" };
  const barber = render(barberLead, "tattoo-ink-noir", { hero: "sheet" }).html;
  assert.deepEqual(checkDemoHtml(barber, barberLead).errors, []);
  assert.ok(barber.includes("Book your chair"));
  assert.equal(barber.includes("Start a custom piece"), false);
  assert.equal(barber.includes("General guidance only"), false, "no tattoo aftercare on a barbershop");
  assert.ok(barber.includes("Book chair 01"));
});

test("bath club: the pet booking request, a four step first visit, vaccine and temperament questions, one paw print", () => {
  const out = render(rich("pet-grooming"), "pet-bath-club");
  const html = out.html;
  for (const f of ["pet", "breed", "size", "first"]) assert.match(section(html, "request"), new RegExp(`name="${f}"`), f);
  assert.equal((section(html, "first-visit").match(/<li class="rv">/g) || []).length, 4);
  assert.ok(html.includes("Do I need my pet&#39;s vaccination records?"));
  assert.ok(html.includes("What if my dog is nervous?"));
  assert.equal((withoutScripts(html).match(/class="pb-paw"/g) || []).length, 1, "the paw print appears once");
  assert.match(html, /class="pb-say"><div class="b-rating b-rating--sticker"/, "the rating rides in the hero speech bubble");
  const icons = section(html, "menu");
  assert.ok(icons.includes("Signature service"));
});

test("owner copy wins in every studio direction", () => {
  for (const key of KEYS) {
    const cat = DIRECTIONS[key].suits[0];
    const l = lead(cat, { demoCopy: { headline: "Owner headline here", about: "Owner about text here", ctaPrimary: "Ring the studio" } });
    const { html } = render(l, key);
    for (const text of ["Owner headline here", "Owner about text here", "Ring the studio"]) assert.ok(html.includes(text), `${key}: ${text}`);
    assert.deepEqual(checkDemoHtml(html, l).errors, [], key);
  }
});

test("studio renders are deterministic and escape lead text", () => {
  for (const key of KEYS) {
    const cat = DIRECTIONS[key].suits[0];
    const l = lead(cat, { business: "Jo's <b>Studio</b> & Co", services: ["<i>Cut</i>", "Two"] });
    const a = render(l, key).html;
    assert.equal(a, render(l, key).html, key);
    assert.equal(a.includes("<b>Studio</b>"), false, key);
    assert.ok(a.includes("Jo&#39;s &lt;b&gt;Studio&lt;/b&gt; &amp; Co"), key);
    assert.ok(a.includes("&lt;i&gt;Cut&lt;/i&gt;"), key);
  }
});

test("a lead with no phone still renders a complete page", () => {
  for (const key of KEYS) {
    const cat = DIRECTIONS[key].suits[0];
    const l = lead(cat, { phone: "" });
    const { html } = render(l, key);
    assert.deepEqual(checkDemoHtml(html, l).errors, [], key);
    assert.equal(html.includes("href=\"tel:"), false, key);
    assert.match(html, /href="#request"/, key);
  }
});
