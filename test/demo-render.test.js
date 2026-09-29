import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { assignDirections } from "../src/demo/assign.js";
import { CATEGORY_VERTICALS, DIRECTION_LIST, DIRECTIONS, validateDirection } from "../src/demo/directions/index.js";
import { checkDemoHtml, DASH_RE } from "../src/demo/guardrails.js";
import { DIRECTION_INFO, renderDemo, resolveVertical, TEMPLATE_INFO } from "../src/demo/render.js";
import { esc, formatRating, formatReviews, ribbonText } from "../src/demo/shared.js";
import { isLibraryUrl, libraryPhoto } from "../src/demo/stock.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, "seed", "sheet-2026-09-28.json"), "utf8"));
// The real category registry, read only.
const CATEGORIES = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "categories.json"), "utf8"));
const NOW = "2026-09-28T12:00:00.000Z";

function slug(text) {
  return String(text).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function leadFrom(row, extra = {}) {
  return {
    ...row,
    id: slug(`${row.business} ${row.city} ${row.state}`),
    area: row.area || "",
    address: "",
    hours: "",
    services: [],
    reviewThemes: [],
    languages: row.languages || [],
    demoCopy: {},
    demo: { builtAt: "", template: "", palette: "", shareApproved: false },
    addedAt: "2026-09-26",
    ...extra,
  };
}

const SEED_LEADS = SEED.leads.map((row) => leadFrom(row));
const byName = (name) => SEED_LEADS.find((l) => l.business === name);

function sample(categoryKey, extra = {}) {
  return {
    id: `sample-${categoryKey}-dallas-tx`,
    business: "Sample Shop",
    category: CATEGORIES[categoryKey] ? CATEGORIES[categoryKey].label : "Local service",
    categoryKey,
    city: "Dallas",
    state: "TX",
    phone: "214-555-0100",
    googleRating: 4.9,
    googleReviews: 312,
    services: [],
    reviewThemes: [],
    languages: [],
    demo: {},
    addedAt: "2026-09-26",
    ...extra,
  };
}

function render(lead, options = {}) {
  return renderDemo(lead, { categories: CATEGORIES, settings: { demoDefaults: { conceptRibbon: true } }, now: NOW, ...options });
}

function forced(directionKey, { palette, hero, services, proof } = {}) {
  const d = DIRECTIONS[directionKey];
  return {
    direction: d.key,
    palette: palette || d.palettes[0].key,
    variants: { hero: hero || d.variants.hero[0], services: services || d.variants.services[0], proof: proof || d.variants.proof[0], photo: "" },
  };
}

function errorsOf(html, lead) {
  return checkDemoHtml(html, lead).errors;
}

test("the registry lists every direction from the briefs, each a valid direction", () => {
  const keys = DIRECTION_LIST.map((d) => d.key);
  assert.equal(keys.length, 25);
  assert.equal(new Set(keys).size, keys.length, "keys are unique");
  for (const d of DIRECTION_LIST) {
    assert.ok(fs.existsSync(path.join(ROOT, "src", "demo", "directions", `${d.key}.js`)), `${d.key} has its own file`);
    assert.deepEqual(validateDirection(d).errors, [], d.key);
    assert.ok(d.palettes.length >= 3, `${d.key} has at least three palettes`);
  }
  const palettes = DIRECTION_LIST.flatMap((d) => d.palettes.map((p) => p.key));
  assert.equal(new Set(palettes).size, palettes.length, "palette keys are unique across directions, so a palette names its direction");
  for (const key of palettes) assert.match(key, /^[a-z0-9]+(-[a-z0-9]+)+$/);
  for (const key of ["barber-after-hours", "barber-fade-lab", "barber-cover-story", "barber-gallery-mono"]) {
    assert.equal(DIRECTIONS[key].status, "implemented", key);
  }
  for (const cat of Object.keys(CATEGORIES)) {
    assert.ok(DIRECTION_LIST.some((d) => d.suits.includes(cat)), `some direction suits ${cat}`);
  }
});

test("every direction renders for a lead of every category it suits, in every palette and hero, and passes every guardrail", () => {
  for (const d of DIRECTION_LIST) {
    for (const cat of d.suits) {
      for (const p of d.palettes) {
        for (const hero of d.variants.hero) {
          const lead = sample(cat);
          const out = render(lead, { assignment: forced(d.key, { palette: p.key, hero }) });
          assert.equal(out.direction, d.key);
          assert.equal(out.palette, p.key);
          assert.deepEqual(errorsOf(out.html, lead), [], `${d.key}/${p.key}/${hero} for ${cat}`);
        }
      }
    }
  }
});

test("every service and proof variant, rich records and Spanish pass too", () => {
  for (const d of DIRECTION_LIST) {
    const cat = d.suits[0];
    const rich = sample(cat, {
      services: ["Custom thing one", "Custom thing two", "Custom thing three"],
      reviewThemes: ["Honest pricing", "Explains the work"],
      hours: "Mon to Fri 8am to 6pm",
      address: "123 Main St",
      languages: ["English", "Spanish"],
    });
    for (const services of d.variants.services) {
      for (const proof of d.variants.proof) {
        for (const lead of [sample(cat), rich]) {
          const out = render(lead, { assignment: forced(d.key, { services, proof }) });
          assert.deepEqual(errorsOf(out.html, lead), [], `${d.key} services ${services} proof ${proof}${lead === rich ? " rich" : ""}`);
        }
      }
    }
  }
});

test("every seed lead renders with the batch assignment, passes guardrails and is written to test-output", () => {
  const map = assignDirections(SEED_LEADS, { directions: DIRECTIONS, categories: CATEGORIES });
  const out = path.join(ROOT, "test-output");
  fs.mkdirSync(out, { recursive: true });
  for (const lead of SEED_LEADS) {
    const result = render(lead, { assignment: map.get(lead.id) });
    assert.equal(result.direction, map.get(lead.id).direction);
    assert.deepEqual(errorsOf(result.html, lead), [], lead.business);
    assert.equal(DASH_RE.test(result.html), false, lead.business);
    const file = path.join(out, `demo-${lead.id}.html`);
    fs.writeFileSync(file, result.html, "utf8");
    assert.ok(fs.statSync(file).size > 10000);
  }
  // A render given the whole batch reaches the same choice as the explicit assignment.
  const cutz = byName("Most Famous Cutz");
  assert.equal(render(cutz, { leads: SEED_LEADS }).direction, map.get(cutz.id).direction);
});

test("Most Famous Cutz gets a photo led barber direction with booking, chairs and a gallery", () => {
  const lead = byName("Most Famous Cutz");
  const map = assignDirections(SEED_LEADS, { directions: DIRECTIONS, categories: CATEGORIES });
  const out = render(lead, { assignment: map.get(lead.id) });
  assert.equal(out.direction, "barber-cover-story", "the editorial brief and concept point at the cover story");
  assert.ok(out.photos.length >= 4, "hero and gallery photos");
  assert.match(out.html, /<img[^>]+data-hero/);
  assert.ok((out.html.match(/href="#request"/g) || []).length >= 4, "Book appears in many places");
  assert.match(out.html, /class="b-float"/, "floating Book pill");
  assert.match(out.html, /class="callbar callbar--split"/, "phone bar with Call and Book");
  assert.ok(out.html.includes("Chair 01") && out.html.includes("Chair 04"), "chair placeholders");
  assert.ok(out.html.includes("Placeholders. The shop&#39;s own barbers"), "placeholders say they are placeholders");
  assert.ok(out.html.includes("Menu and prices to confirm with the shop."));
  assert.ok(out.html.includes("Walk in policy to confirm with the shop."));
  assert.doesNotMatch(out.html, /\$\d/, "no prices");
  assert.match(out.html, /data-form-flavor="barber"/);
  assert.ok(out.html.includes("Any barber"));
});

test("rating and review count appear exactly as recorded", () => {
  for (const d of DIRECTION_LIST) {
    const lead = sample(d.suits[0], { googleRating: 4.7, googleReviews: 1234 });
    const { html } = render(lead, { assignment: forced(d.key) });
    assert.match(html, /data-rating="4.7"/, d.key);
    assert.match(html, /data-reviews="1234"/, d.key);
    assert.ok(html.includes(`${formatReviews(1234)} Google reviews`), `${d.key} review count`);
    assert.ok(html.includes(`>${formatRating(4.7)}<`), `${d.key} rating numeral`);
    assert.ok(checkDemoHtml(html, { ...lead, googleRating: 4.2 }).errors.some((e) => /Rating shown as 4\.7/.test(e)));
  }
  assert.equal(formatRating(5), "5.0");
  assert.equal(formatReviews(1234), "1,234");
});

test("the concept ribbon, robots meta and demo only forms are present", () => {
  for (const d of DIRECTION_LIST) {
    const lead = sample(d.suits[0]);
    const { html, photos } = render(lead, { assignment: forced(d.key) });
    assert.ok(html.includes("<meta name=\"robots\" content=\"noindex, nofollow\">"));
    assert.ok(html.includes(esc(ribbonText(lead.business, { photos: photos.length > 0 }))), d.key);
    assert.ok(html.includes("data-ribbon-hide"));
    const forms = html.match(/<form\b[^>]*>/g) || [];
    assert.ok(forms.length >= 1, d.key);
    for (const f of forms) {
      assert.match(f, /data-demo-form/);
      assert.doesNotMatch(f, /\saction=/);
    }
    assert.ok(html.includes("This is a concept. Nothing was sent."));
    assert.doesNotMatch(html, /<script[^>]+src=/);
  }
});

test("request forms fit the vertical and the trade", () => {
  const kind = (lead) => render(lead).html.match(/data-form-kind="([^"]+)"/)[1];
  const flavor = (lead) => (render(lead).html.match(/data-form-flavor="([^"]+)"/) || [])[1];
  assert.equal(kind(byName("GM AUTO CARE")), "repair-estimate");
  assert.equal(kind(byName("Papas and Ninos Bodyshop")), "photo-estimate");
  assert.equal(kind(byName("Rios Used Tires")), "tire-quote");
  assert.equal(kind(byName("24/7 Diesel Repair & Road Service")), "roadside");
  assert.equal(kind(byName("Prime Time Septic Pumping, Inc.")), "emergency");
  assert.equal(kind(byName("Adams Brothers Roof Repair")), "estimate");
  assert.equal(kind(byName("Brownie's")), "booking");
  assert.equal(kind(sample("general")), "request");
  assert.equal(flavor(sample("barber")), "barber");
  assert.equal(flavor(sample("tattoo")), "tattoo");
  assert.equal(flavor(sample("pet-grooming")), "pet");

  assert.match(render(byName("Papas and Ninos Bodyshop")).html, /type="file"[^>]*accept="image\/\*"/);
  const booking = render(byName("Brownie's")).html;
  assert.equal((booking.match(/name="day"/g) || []).length, 7);
  assert.ok(booking.includes("value=\"2026-09-29\""), "booking days start the day after now");
  assert.match(booking, /name="person"/, "barbers can pick a chair");
  const tattoo = render(sample("tattoo")).html;
  assert.match(tattoo, /name="placement"/);
  assert.match(tattoo, /name="ink"/);
  assert.ok(tattoo.includes("Start a custom piece"));
  const pet = render(sample("pet-grooming")).html;
  for (const f of ["pet", "breed", "size", "first"]) assert.match(pet, new RegExp(`name="${f}"`), f);
  assert.match(render(byName("Prime Time Septic Pumping, Inc.")).html, /data-urgent/);
});

test("Spanish toggle appears only for leads that list Spanish, in every direction", () => {
  for (const d of DIRECTION_LIST) {
    const cat = d.suits[0];
    const es = sample(cat, { languages: ["English", "Spanish"] });
    const { html } = render(es, { assignment: forced(d.key) });
    assert.ok(html.includes("data-lang=\"es\""), d.key);
    assert.ok(html.includes("data-i18n="), d.key);
    assert.ok(html.includes("No es el sitio oficial"), d.key);
    assert.ok(html.includes("Esto es un concepto. No se envió nada."), d.key);
    assert.equal(checkDemoHtml(html, es).ok, true, d.key);
    const en = render(sample(cat), { assignment: forced(d.key) }).html;
    assert.equal(en.includes("data-lang=\"es\""), false, d.key);
    assert.equal(en.includes("data-i18n="), false, d.key);
  }
  for (const name of ["Papas and Ninos Bodyshop", "Rios Used Tires"]) {
    assert.ok(render(byName(name)).html.includes("data-lang=\"es\""), name);
  }
});

test("missing optional facts do not render, and show a to confirm state instead", () => {
  for (const d of DIRECTION_LIST) {
    const lead = sample(d.suits[0]);
    const { html } = render(lead, { assignment: forced(d.key) });
    assert.equal(html.includes("<dt>Hours</dt>"), false, `${d.key} hours`);
    assert.equal(html.includes("<dt>Address</dt>"), false, `${d.key} address`);
    assert.equal(html.includes("class=\"b-themes"), false, `${d.key} themes`);
    assert.equal(html.includes("Open in Google Maps"), false, `${d.key} map link`);
    assert.ok(html.includes("Hours to confirm with the owner."), `${d.key} hours to confirm`);
  }
  const bare = sample("unknown-key");
  const out = render(bare);
  assert.equal(resolveVertical(bare, CATEGORIES), "general");
  assert.equal(out.html.includes("id=\"menu\"") || out.html.includes("id=\"services\""), false, "no services section without services");
  assert.equal(checkDemoHtml(out.html, bare).ok, true);
});

test("optional facts render when the record has them", () => {
  for (const d of DIRECTION_LIST) {
    const rich = sample(d.suits[0], {
      hours: "Mon to Fri 8am to 6pm",
      address: "123 Main St",
      reviewThemes: ["Honest pricing", "Explains the work"],
      services: ["Custom thing one", "Custom thing two"],
    });
    const { html } = render(rich, { assignment: forced(d.key) });
    assert.ok(html.includes("Mon to Fri 8am to 6pm"), `${d.key} hours`);
    assert.ok(html.includes("123 Main St"), `${d.key} address`);
    assert.ok(html.includes("Honest pricing"), `${d.key} themes`);
    assert.ok(html.includes("Custom thing one"), `${d.key} services`);
    assert.equal(html.includes("Typical services for this kind of business"), false, "own services are not labelled as defaults");
    assert.ok(html.includes("https://www.google.com/maps/search/?api=1&amp;query=123%20Main%20St"), d.key);
    assert.deepEqual(errorsOf(html, rich), [], d.key);
  }
  assert.ok(render(byName("GM AUTO CARE")).html.includes("Typical services for this kind of business"), "category defaults are labelled neutrally");
});

test("demoCopy overrides replace direction copy in every direction", () => {
  for (const d of DIRECTION_LIST) {
    const lead = sample(d.suits[0], { demoCopy: { headline: "Owner approved headline", about: "Owner approved about text", ctaPrimary: "Ring the shop" } });
    const { html } = render(lead, { assignment: forced(d.key) });
    for (const text of ["Owner approved headline", "Owner approved about text", "Ring the shop"]) assert.ok(html.includes(text), `${d.key}: ${text}`);
  }
});

test("lead text is escaped in every direction", () => {
  for (const d of DIRECTION_LIST) {
    const lead = sample(d.suits[0], { business: "Joe's <script>alert(1)</script> & Sons", services: ["<b>Bold</b>", "Two", "Three"], reviewThemes: ["\"Quoted\" & fast"] });
    const { html } = render(lead, { assignment: forced(d.key) });
    assert.equal(html.includes("<script>alert(1)"), false, d.key);
    assert.ok(html.includes("Joe&#39;s &lt;script&gt;alert(1)&lt;/script&gt; &amp; Sons"), d.key);
    assert.ok(html.includes("&lt;b&gt;Bold&lt;/b&gt;"), d.key);
    assert.deepEqual(errorsOf(html, lead), [], d.key);
  }
});

test("photos come only from the stock library, disclosed, sized and credited", () => {
  let withPhotos = 0;
  for (const lead of SEED_LEADS) {
    const { html, photos } = render(lead);
    const tags = html.replace(/<script\b[\s\S]*?<\/script>/g, "").match(/<img\b[^>]*>/g) || [];
    assert.equal(tags.length, photos.length, `${lead.business}: one tag per photo`);
    if (tags.length) withPhotos += 1;
    const heroes = tags.filter((t) => /\sdata-hero\b/.test(t));
    assert.ok(heroes.length <= 1);
    for (const tag of tags) {
      assert.ok(isLibraryUrl(tag.match(/\ssrc="([^"]+)"/)[1].replace(/&amp;/g, "&")), tag.slice(0, 80));
      assert.match(tag, /alt="[^"]+, stock photo"/);
      assert.match(tag, /\swidth="\d+" height="\d+"/);
      assert.match(tag, /referrerpolicy="no-referrer"/);
      if (!/data-hero/.test(tag)) assert.match(tag, /loading="lazy"/);
      assert.match(tag, /object-fit:cover/);
    }
    for (const id of photos) assert.ok(html.includes(esc(libraryPhoto(id).photographer)), `${lead.business} credits ${id}`);
    assert.equal(new Set(photos).size, photos.length, "no photo repeats on a page");
    if (photos.length) assert.ok(html.includes(esc(ribbonText(lead.business, { photos: true }))));
  }
  assert.ok(withPhotos >= 18, "photo led demos across the seed");
  // A lead with no photo group (general) shows none and keeps the plain ribbon.
  const general = sample("general");
  const out = render(general);
  assert.deepEqual(out.photos, []);
  assert.ok(out.html.includes(esc(ribbonText(general.business))));
});

test("no two seed leads share a hero photo while the group has enough", () => {
  const map = assignDirections(SEED_LEADS, { directions: DIRECTIONS, categories: CATEGORIES });
  const barberHeroes = SEED_LEADS.filter((l) => l.categoryKey === "barber").map((l) => map.get(l.id).variants.photo);
  assert.equal(new Set(barberHeroes).size, barberHeroes.length);
  const collision = SEED_LEADS.filter((l) => l.categoryKey === "auto-body-collision").map((l) => map.get(l.id).variants.photo);
  assert.equal(new Set(collision).size, collision.length);
});

test("renders are deterministic and follow the stored choice", () => {
  const lead = byName("Adams Brothers Roof Repair");
  assert.equal(render(lead).html, render(lead).html);
  const first = render(lead);
  const other = DIRECTIONS[first.direction].palettes.find((p) => p.key !== first.palette);
  const chosen = render({ ...lead, demo: { ...lead.demo, direction: first.direction, palette: other.key } });
  assert.equal(chosen.palette, other.key);
  const legacy = render({ ...lead, demo: { palette: "slate", template: "contractor" } });
  assert.equal(legacy.direction, first.direction, "an old template palette is ignored");
});

test("the app gets palettes per vertical and a direction list", () => {
  assert.deepEqual(Object.keys(TEMPLATE_INFO).sort(), ["auto", "contractor", "general", "home-services", "personal-care"]);
  for (const [vertical, info] of Object.entries(TEMPLATE_INFO)) {
    assert.ok(info.palettes.length >= 3, vertical);
    for (const p of info.palettes) {
      const d = DIRECTIONS[p.direction];
      assert.ok(d.palettes.some((x) => x.key === p.key));
      assert.ok(d.suits.some((k) => CATEGORY_VERTICALS[k] === vertical));
    }
  }
  assert.equal(Object.keys(DIRECTION_INFO).length, DIRECTION_LIST.length);
});
