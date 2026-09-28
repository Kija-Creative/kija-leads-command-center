import assert from "node:assert/strict";
import test from "node:test";
import { checkDemoHtml, visibleText } from "../src/demo/guardrails.js";
import { renderDemo } from "../src/demo/render.js";

const CATEGORIES = { "auto-repair": { label: "Auto repair", vertical: "auto", serviceDefaults: ["Brakes", "Diagnostics"] } };

const LEAD = {
  id: "test-shop-dallas-tx",
  business: "Test Shop",
  category: "Auto repair",
  categoryKey: "auto-repair",
  city: "Dallas",
  state: "TX",
  phone: "214-555-0100",
  googleRating: 4.8,
  googleReviews: 120,
  services: [],
  reviewThemes: [],
  languages: [],
  demo: {},
};

const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);

function good(lead = LEAD) {
  return renderDemo(lead, { categories: CATEGORIES, settings: {}, now: "2026-09-28T12:00:00.000Z" }).html;
}

// Inject text into the visible body so each check sees it as page copy.
function withText(html, text) {
  return html.replace("<main>", `<main><p>${text}</p>`);
}

function errorsFor(html, lead = LEAD) {
  return checkDemoHtml(html, lead).errors;
}

test("a clean render passes", () => {
  const result = checkDemoHtml(good(), LEAD);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.deepEqual(result.warnings, []);
});

test("robots meta is required", () => {
  const html = good().replace('<meta name="robots" content="noindex, nofollow">', "");
  assert.ok(errorsFor(html).some((e) => e.includes("robots")));
});

test("the ribbon must be present, exact and visible", () => {
  const altered = good().replace("Not the official website.", "The official website.");
  assert.ok(errorsFor(altered).some((e) => e.includes("concept ribbon text")));
  const hidden = good().replace("data-kija-ribbon", "data-kija-ribbon hidden");
  assert.ok(errorsFor(hidden).some((e) => e.includes("visible")));
  const missing = good().replace("data-kija-ribbon", "data-x");
  assert.ok(errorsFor(missing).some((e) => e.includes("data-kija-ribbon")));
});

test("forms must be demo only", () => {
  const withAction = good().replace("<form class=\"req-form\" data-demo-form", "<form class=\"req-form\" action=\"https://example.com/lead\" data-demo-form");
  assert.ok(errorsFor(withAction).some((e) => e.includes("action")));
  const unmarked = good().replace("data-demo-form data-form-kind", "data-form-kind");
  assert.ok(errorsFor(unmarked).some((e) => e.includes("data-demo-form")));
  const noNotice = good().split("This is a concept. Nothing was sent.").join("Thanks.");
  assert.ok(errorsFor(noNotice).some((e) => e.includes("Nothing was sent")));
});

test("dash characters and dash entities fail", () => {
  assert.ok(errorsFor(withText(good(), `Fast ${EM} friendly`)).some((e) => e.includes("dash")));
  assert.ok(errorsFor(withText(good(), `Mon ${EN} Fri`)).some((e) => e.includes("dash")));
  assert.ok(errorsFor(withText(good(), "Fast &mdash; friendly")).some((e) => e.includes("dash")));
  assert.equal(errorsFor(withText(good(), "A 30-minute check, 2-3 days")).length, 0, "plain hyphens are fine");
});

test("unbacked claim phrases fail", () => {
  const claims = [
    "Licensed and insured",
    "Fully bonded",
    "ASE certified techs",
    "Award winning service",
    "The #1 shop in town",
    "Number one in Dallas",
    "Best in Dallas",
    "Serving Dallas since 1998",
    "Over 30 years of experience",
    "Two decades on this corner",
    "Family owned and operated",
    "Satisfaction guaranteed",
    "Lifetime warranty",
    "Financing available",
    "We work with every insurance company",
    "Negocio familiar",
    "Garantía total",
    "El mejor taller",
    "Desde 1998",
    "Financiamiento disponible",
  ];
  for (const claim of claims) {
    const errors = errorsFor(withText(good(), claim));
    assert.ok(errors.some((e) => e.startsWith("Unbacked claim")), `should flag: ${claim}`);
  }
});

test("innocent words in normal copy pass", () => {
  const fine = [
    "Ever since you called, we have been ready.",
    "Pick the best time for you.",
    "Tell us what it is doing.",
    "Colors like #1a1a1a live in CSS.",
    "Mande su medida.",
    "Espere en un lugar seguro.",
    "Funcionan mejor con luz de día.",
  ];
  for (const text of fine) {
    assert.deepEqual(errorsFor(withText(good(), text)), [], text);
  }
});

test("claims backed by the lead record pass", () => {
  const warrantyLead = { ...LEAD, services: ["Warranty repair work"] };
  assert.deepEqual(errorsFor(withText(good(warrantyLead), "Warranty repair work"), warrantyLead), []);

  const since = { ...LEAD, established: 1998 };
  assert.deepEqual(errorsFor(withText(good(since), "Serving Dallas since 1998"), since), []);
  assert.ok(errorsFor(withText(good(since), "Serving Dallas since 1988"), since).some((e) => e.includes("since 1988")), "the year must match");
  assert.deepEqual(errorsFor(withText(good(since), "More than 25 years in business"), since), []);

  const named = { ...LEAD, business: "Number One Tires" };
  assert.deepEqual(errorsFor(good(named), named), []);

  const themed = { ...LEAD, reviewThemes: ["Family owned feel"] };
  assert.deepEqual(errorsFor(good(themed), themed), []);
});

test("rating and review numbers must match the record", () => {
  const html = good();
  assert.ok(errorsFor(html, { ...LEAD, googleRating: 4.7 }).some((e) => e.includes("Rating shown as 4.8")));
  assert.ok(errorsFor(html, { ...LEAD, googleReviews: 121 }).some((e) => e.includes("Review count shown as 120")));
  const inflated = withText(html, "Over 500 Google reviews");
  assert.ok(errorsFor(inflated).some((e) => e.includes("500 Google reviews")));
  const stars = withText(html, "Rated 5 stars");
  assert.ok(errorsFor(stars).some((e) => e.includes("5 stars")));
  const noProof = html.replace(/data-rating="[^"]*"/g, "").replace(/data-reviews="[^"]*"/g, "");
  const errs = errorsFor(noProof);
  assert.ok(errs.some((e) => e.includes("data-rating")));
  assert.ok(errs.some((e) => e.includes("data-reviews")));
  const noWording = html.split("Google reviews").join("reviews on the web");
  assert.ok(errorsFor(noWording).some((e) => e.includes("Google reviews")));
});

test("external assets, trackers, network calls and quotes fail", () => {
  const html = good();
  assert.ok(errorsFor(withText(html, "<img src=\"https://other-shop.com/logo.png\" alt=\"\">")).some((e) => e.includes("image")));
  assert.ok(errorsFor(html.replace("</body>", "<script src=\"https://cdn.example.com/x.js\"></script></body>")).some((e) => e.includes("external script")));
  assert.ok(errorsFor(html.replace("</head>", "<link rel=\"stylesheet\" href=\"https://cdn.example.com/x.css\"></head>")).some((e) => e.includes("other than Google Fonts")));
  assert.ok(errorsFor(html.replace("</body>", "<script>gtag('config','G-1')</script></body>")).some((e) => e.includes("tracking")));
  assert.ok(errorsFor(html.replace("</body>", "<script>fetch('/x')</script></body>")).some((e) => e.includes("network")));
  assert.ok(errorsFor(withText(html, "<iframe src=\"https://maps.example.com\"></iframe>")).some((e) => e.includes("iframe")));
  assert.ok(errorsFor(html.replace("</style>", "body{background:url(https://example.com/bg.png)}</style>")).some((e) => e.includes("url()")));
  assert.ok(errorsFor(withText(html, "<blockquote>Great shop</blockquote>")).some((e) => e.includes("quote")));
});

test("visibleText drops styles and tags but keeps script text", () => {
  const text = visibleText("<style>.a{}</style><p>Hi &amp; bye</p><script>var s=\"hola\"</script>");
  assert.match(text, /Hi & bye/);
  assert.match(text, /hola/);
  assert.doesNotMatch(text, /\.a\{/);
});
