import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { checkDemoHtml, DASH_RE } from "../src/demo/guardrails.js";
import { renderDemo, resolveVertical, TEMPLATE_INFO, TEMPLATES } from "../src/demo/render.js";
import { formatRating, formatReviews, ribbonText, esc } from "../src/demo/shared.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, "seed", "sheet-2026-09-28.json"), "utf8"));
const NOW = "2026-09-28T12:00:00.000Z";

// Just enough of config/categories.json to map categoryKey to a template.
const CATEGORIES = {
  "auto-repair": { label: "Auto repair", vertical: "auto", serviceDefaults: ["Diagnostics and check engine lights", "Brakes", "Oil and fluid service", "Suspension and steering", "AC repair", "Engine and transmission work"] },
  "auto-body-collision": { label: "Auto body and collision", vertical: "auto", serviceDefaults: ["Collision repair", "Dent repair", "Paint and color matching", "Bumper repair", "Frame straightening"] },
  "tire-shop": { label: "Tire shop", vertical: "auto", serviceDefaults: ["New and used tires", "Flat repair", "Mounting and balancing", "Wheel alignment"] },
  "muffler-exhaust": { label: "Muffler and exhaust", vertical: "auto", serviceDefaults: ["Muffler repair", "Custom exhaust", "Catalytic converters", "Brakes"] },
  "diesel-truck-repair": { label: "Diesel and truck repair", vertical: "auto", serviceDefaults: ["Roadside repair", "Diesel engine repair", "Fleet maintenance", "Tire service"] },
  septic: { label: "Septic service", vertical: "home-services", serviceDefaults: ["Septic pumping", "Septic inspections", "Septic repair", "Aerobic system service"] },
  roofing: { label: "Roofing", vertical: "contractor", serviceDefaults: ["Roof repair", "Storm damage inspections", "Roof replacement", "Leak repair", "Gutters"] },
  barber: { label: "Barber shop", vertical: "personal-care", serviceDefaults: ["Haircut", "Fade", "Beard trim", "Hot towel shave", "Kids cut"] },
  general: { label: "Local service", vertical: "general", serviceDefaults: ["Consultations", "Repairs", "Installations"] },
};

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

const byName = (name) => leadFrom(SEED.leads.find((l) => l.business === name));

const FIXTURES = {
  auto: byName("GM AUTO CARE"),
  "home-services": byName("Prime Time Septic Pumping, Inc."),
  contractor: byName("Adams Brothers Roof Repair"),
  "personal-care": byName("Brownie's"),
  general: leadFrom(SEED.leads.find((l) => l.business === "Mustang Service Center"), { categoryKey: "general", category: "Local service" }),
};

function render(lead) {
  return renderDemo(lead, { categories: CATEGORIES, settings: { demoDefaults: { conceptRibbon: true } }, now: NOW });
}

test("each vertical renders with its own template and passes every guardrail", () => {
  for (const [vertical, lead] of Object.entries(FIXTURES)) {
    const out = render(lead);
    assert.equal(out.template, vertical, `${lead.business} should use ${vertical}`);
    assert.ok(TEMPLATES[vertical].palettes.some((p) => p.key === out.palette));
    const check = checkDemoHtml(out.html, lead);
    assert.deepEqual(check.errors, [], `${lead.business}: ${check.errors.join("; ")}`);
    assert.equal(check.ok, true);
  }
});

test("every seed lead renders and passes guardrails", () => {
  for (const row of SEED.leads) {
    const lead = leadFrom(row);
    const check = checkDemoHtml(render(lead).html, lead);
    assert.deepEqual(check.errors, [], `${lead.business}: ${check.errors.join("; ")}`);
  }
});

test("every template and palette combination passes guardrails", () => {
  for (const [vertical, lead] of Object.entries(FIXTURES)) {
    assert.ok(TEMPLATES[vertical].palettes.length >= 3, `${vertical} needs at least three palettes`);
    for (const p of TEMPLATES[vertical].palettes) {
      const out = render({ ...lead, demo: { ...lead.demo, palette: p.key } });
      assert.equal(out.palette, p.key);
      assert.equal(checkDemoHtml(out.html, lead).ok, true, `${vertical}/${p.key}`);
    }
  }
  assert.deepEqual(Object.keys(TEMPLATE_INFO).sort(), ["auto", "contractor", "general", "home-services", "personal-care"]);
});

test("rating and review count appear exactly as recorded", () => {
  for (const lead of Object.values(FIXTURES)) {
    const { html } = render(lead);
    assert.match(html, new RegExp(`data-rating="${lead.googleRating}"`));
    assert.match(html, new RegExp(`data-reviews="${lead.googleReviews}"`));
    assert.ok(html.includes(`${formatReviews(lead.googleReviews)} Google reviews`), `${lead.business} review count`);
    assert.ok(html.includes(`>${formatRating(lead.googleRating)}<`), `${lead.business} rating numeral`);
  }
  assert.equal(formatRating(5), "5.0");
  assert.equal(formatRating(4.9), "4.9");
  assert.equal(formatReviews(1234), "1,234");
});

test("a changed rating is caught by the guardrail", () => {
  const lead = FIXTURES.auto;
  const { html } = render(lead);
  const check = checkDemoHtml(html, { ...lead, googleRating: 4.2 });
  assert.equal(check.ok, false);
  assert.ok(check.errors.some((e) => /Rating shown as 4\.9/.test(e)));
});

test("no em or en dash anywhere in any render", () => {
  for (const row of SEED.leads) {
    const { html } = render(leadFrom(row));
    assert.equal(DASH_RE.test(html), false, row.business);
  }
});

test("the concept ribbon, robots meta and demo only forms are present", () => {
  for (const lead of Object.values(FIXTURES)) {
    const { html } = render(lead);
    assert.ok(html.includes('<meta name="robots" content="noindex, nofollow">'));
    assert.ok(html.includes(esc(ribbonText(lead.business))));
    assert.ok(html.includes("data-ribbon-hide"), "ribbon can be hidden for a presentation");
    const forms = html.match(/<form\b[^>]*>/g) || [];
    assert.ok(forms.length >= 1);
    for (const f of forms) {
      assert.match(f, /data-demo-form/);
      assert.doesNotMatch(f, /\saction=/);
    }
    assert.ok(html.includes("This is a concept. Nothing was sent."));
    assert.doesNotMatch(html, /<script[^>]+src=/);
    assert.doesNotMatch(html, /<img[^>]+src="http/);
  }
});

test("request forms fit the vertical", () => {
  const kind = (lead) => render(lead).html.match(/data-form-kind="([^"]+)"/)[1];
  assert.equal(kind(FIXTURES.auto), "repair-estimate");
  assert.equal(kind(byName("Papas and Ninos Bodyshop")), "photo-estimate");
  assert.equal(kind(byName("Rios Used Tires")), "tire-quote");
  assert.equal(kind(byName("24/7 Diesel Repair & Road Service")), "roadside");
  assert.equal(kind(FIXTURES["home-services"]), "emergency");
  assert.equal(kind(FIXTURES.contractor), "estimate");
  assert.equal(kind(FIXTURES["personal-care"]), "booking");
  assert.equal(kind(FIXTURES.general), "request");

  const body = render(byName("Papas and Ninos Bodyshop")).html;
  assert.match(body, /type="file"[^>]*accept="image\/\*"/);
  const booking = render(FIXTURES["personal-care"]).html;
  assert.equal((booking.match(/name="day"/g) || []).length, 7);
  assert.ok(booking.includes('value="2026-09-29"'), "booking days start the day after now");
  assert.match(render(FIXTURES["home-services"]).html, /data-urgent/);
});

test("Spanish toggle appears only for leads that list Spanish", () => {
  const spanish = [byName("Papas and Ninos Bodyshop"), byName("Rios Used Tires")];
  for (const lead of spanish) {
    const { html } = render(lead);
    assert.ok(html.includes('data-lang="es"'), lead.business);
    assert.ok(html.includes("data-i18n="));
    assert.ok(html.includes("No es el sitio oficial"));
    assert.ok(html.includes("Esto es un concepto. No se envió nada."));
    assert.equal(checkDemoHtml(html, lead).ok, true);
  }
  for (const lead of Object.values(FIXTURES)) {
    const { html } = render(lead);
    assert.equal(html.includes('data-lang="es"'), false, lead.business);
    assert.equal(html.includes("data-i18n="), false, lead.business);
  }
  const es = render({ ...FIXTURES["home-services"], languages: ["English", "Spanish"] });
  assert.ok(es.html.includes('data-lang="es"'));
  assert.equal(checkDemoHtml(es.html, FIXTURES["home-services"]).ok, true);
});

test("missing optional fields do not render empty sections", () => {
  for (const lead of Object.values(FIXTURES)) {
    const { html } = render(lead);
    assert.equal(html.includes("<dt>Hours</dt>"), false, `${lead.business} hours`);
    assert.equal(html.includes("<dt>Address</dt>"), false, `${lead.business} address`);
    assert.equal(html.includes('class="themes-list"'), false, `${lead.business} themes`);
    assert.equal(html.includes("Open in Google Maps"), false, `${lead.business} map link`);
  }
  const bare = { ...FIXTURES.general, categoryKey: "unknown-key" };
  const noServices = render(bare);
  assert.equal(noServices.template, "general");
  assert.equal(noServices.html.includes('id="services"'), false);
  assert.equal(checkDemoHtml(noServices.html, bare).ok, true);
});

test("optional facts render when the record has them", () => {
  for (const lead of Object.values(FIXTURES)) {
    const rich = {
      ...lead,
      hours: "Mon to Fri 8am to 6pm",
      address: "123 Main St",
      reviewThemes: ["Honest pricing", "Explains the work"],
      services: ["Custom thing one", "Custom thing two"],
    };
    const { html } = render(rich);
    assert.ok(html.includes("Mon to Fri 8am to 6pm"), `${lead.business} hours`);
    assert.ok(html.includes("123 Main St"));
    assert.ok(html.includes("Honest pricing"));
    assert.ok(html.includes("Custom thing one"));
    assert.equal(html.includes("Typical services for this kind of business"), false, "own services are not labelled as defaults");
    assert.ok(html.includes("https://www.google.com/maps/search/?api=1&amp;query=123%20Main%20St"));
    assert.equal(checkDemoHtml(html, rich).ok, true, `${lead.business}: ${checkDemoHtml(html, rich).errors}`);
  }
  const defaults = render(FIXTURES.auto).html;
  assert.ok(defaults.includes("Typical services for this kind of business"), "category defaults are labelled neutrally");
});

test("demoCopy overrides replace template copy", () => {
  const lead = { ...FIXTURES.auto, demoCopy: { headline: "Fixed right the first visit, or we talk it through", subhead: "Owner approved subhead", about: "Owner approved about text", ctaPrimary: "Ring the shop" } };
  const { html } = render(lead);
  assert.ok(html.includes("Fixed right the first visit, or we talk it through"));
  assert.ok(html.includes("Owner approved subhead"));
  assert.ok(html.includes("Owner approved about text"));
  assert.ok(html.includes("Ring the shop"));
  assert.equal(html.includes("Tell us what it is doing."), false);
});

test("lead text is escaped", () => {
  const lead = { ...FIXTURES.general, business: "Joe's <script>alert(1)</script> & Sons", services: ["<b>Bold</b>"], reviewThemes: ["\"Quoted\" & fast"] };
  const { html } = render(lead);
  assert.equal(html.includes("<script>alert(1)"), false);
  assert.ok(html.includes("Joe&#39;s &lt;script&gt;alert(1)&lt;/script&gt; &amp; Sons"));
  assert.ok(html.includes("&lt;b&gt;Bold&lt;/b&gt;"));
  assert.equal(checkDemoHtml(html, lead).ok, true);
});

test("renders are deterministic and the palette follows the lead", () => {
  const a = render(FIXTURES.contractor);
  const b = render(FIXTURES.contractor);
  assert.equal(a.html, b.html);
  const other = TEMPLATES.contractor.palettes.find((p) => p.key !== a.palette);
  const c = render({ ...FIXTURES.contractor, demo: { palette: other.key } });
  assert.equal(c.palette, other.key);
  const unknown = render({ ...FIXTURES.contractor, demo: { palette: "not-a-palette" } });
  assert.equal(unknown.palette, a.palette, "an unknown palette falls back to the hashed choice");
  assert.equal(resolveVertical({ categoryKey: "roofing" }, CATEGORIES), "contractor");
  assert.equal(resolveVertical({ categoryKey: "nope" }, CATEGORIES), "general");
});

test("writes sample renders for review", () => {
  const out = path.join(ROOT, "test-output");
  fs.mkdirSync(out, { recursive: true });
  const samples = [byName("GM AUTO CARE"), byName("Papas and Ninos Bodyshop"), byName("Prime Time Septic Pumping, Inc."), byName("Adams Brothers Roof Repair"), byName("Brownie's"), FIXTURES.general];
  for (const lead of samples) {
    const file = path.join(out, `demo-${lead.id}.html`);
    fs.writeFileSync(file, render(lead).html, "utf8");
    assert.ok(fs.statSync(file).size > 10000);
  }
});
