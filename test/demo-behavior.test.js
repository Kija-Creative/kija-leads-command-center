import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { checkDemoHtml } from "../src/demo/guardrails.js";
import { DIRECTION_LIST, renderDemo } from "../src/demo/render.js";
import { formatRating } from "../src/demo/shared.js";

const NOW = "2026-09-28T12:00:00.000Z";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// The real category registry, read only.
const CATEGORIES = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "categories.json"), "utf8"));

function lead(categoryKey, extra = {}) {
  return {
    id: `sample-${categoryKey}-dallas-tx`,
    business: "Sample Shop",
    category: CATEGORIES[categoryKey].label,
    categoryKey,
    city: "Dallas",
    state: "TX",
    phone: "214-555-0100",
    googleRating: 4.9,
    googleReviews: 312,
    services: [],
    reviewThemes: ["Honest pricing", "Explains the work"],
    languages: [],
    demo: {},
    ...extra,
  };
}

// One render per direction, each for a category the direction suits.
function forced(d, palette) {
  return { direction: d.key, palette: palette || d.palettes[0].key, variants: { hero: d.variants.hero[0], services: d.variants.services[0], proof: d.variants.proof[0], photo: "" } };
}
const ONE_PER_DIRECTION = DIRECTION_LIST.map((d) => ({ name: d.key, key: d.suits[0], assignment: forced(d) }));

function render(l, assignment) {
  return renderDemo(l, { categories: CATEGORIES, settings: {}, now: NOW, assignment });
}

function pageScriptOf(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const main = scripts.find((s) => s.startsWith("(function(){"));
  assert.ok(main, "the page script is present");
  return main;
}

function css(html) {
  return [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
}

// Just enough DOM for the page script: attributes, rects, listeners.
class FakeEl {
  constructor(top = 0) {
    this.top = top;
    this.attrs = new Map();
    this.listeners = {};
  }
  setAttribute(k, v) { this.attrs.set(k, String(v)); }
  removeAttribute(k) { this.attrs.delete(k); }
  hasAttribute(k) { return this.attrs.has(k); }
  getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null; }
  getBoundingClientRect() { return { top: this.top }; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  fire(type) { for (const fn of this.listeners[type] || []) fn({ preventDefault() {} }); }
}

// Runs the real page script. `io` picks the IntersectionObserver behavior:
// "none" (not supported), "silent" (never fires) or "live" (fires on demand).
function runPage(html, { viewport = 800, rvTops = [100, 400, 1200, 2400, 3600], io = "silent", reduce = false, storage = {} } = {}) {
  const timers = [];
  const observers = [];
  const winListeners = {};
  const rvs = rvTops.map((top) => new FakeEl(top));
  const bar = new FakeEl(0);
  const footer = new FakeEl(4000);
  const submit = new FakeEl(3000);
  const ribbon = new FakeEl(0);
  const hideBtn = new FakeEl(0);
  const root = { lang: "en", clientHeight: viewport, classes: new Set(), classList: null };
  root.classList = { add: (c) => root.classes.add(c) };
  const hasBar = html.includes("class=\"callbar\"");
  const all = {
    ".rv": rvs,
    "footer,.f-submit,[data-demo-status]": [footer, submit],
    "[data-ribbon-hide]": [hideBtn],
  };
  const one = {
    ".callbar": hasBar ? bar : null,
    "[data-kija-ribbon]": ribbon,
  };
  const document = {
    documentElement: root,
    querySelector: (sel) => (sel in one ? one[sel] : null),
    querySelectorAll: (sel) => all[sel] || [],
    getElementById: () => null,
  };
  class FakeIO {
    constructor(cb) {
      this.cb = cb;
      this.targets = new Set();
      observers.push(this);
    }
    observe(el) { this.targets.add(el); }
    unobserve(el) { this.targets.delete(el); }
    disconnect() { this.targets.clear(); }
    emit(el, isIntersecting) { if (this.targets.has(el)) this.cb([{ target: el, isIntersecting }]); }
  }
  const window = {
    innerHeight: viewport,
    matchMedia: (q) => ({ matches: reduce && /reduce/.test(q) }),
    addEventListener: (type, fn) => { (winListeners[type] ||= []).push(fn); },
  };
  if (io !== "none") window.IntersectionObserver = FakeIO;
  const context = {
    window,
    document,
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    localStorage: { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = v; } },
    URL: { createObjectURL: () => "" },
    Set,
    Array,
    Object,
    JSON,
    String,
  };
  if (io !== "none") context.IntersectionObserver = FakeIO;
  vm.runInNewContext(pageScriptOf(html), context);
  const waiting = () => rvs.filter((el) => el.hasAttribute("data-rv-wait")).map((el) => el.top);
  return {
    rvs, bar, footer, submit, ribbon, hideBtn, root, timers, observers, waiting,
    fireWindow: (type) => { for (const fn of winListeners[type] || []) fn(); },
    runTimers: (ms) => { for (const t of timers.filter((x) => x.ms <= ms)) t.fn(); },
  };
}

test("reveal content is visible by default: no CSS hides it without the script", () => {
  for (const { name: key, key: cat, assignment } of ONE_PER_DIRECTION) {
    const { html } = render(lead(cat), assignment);
    const styles = css(html);
    assert.doesNotMatch(styles, /animation-timeline/, `${key}: no scroll timeline that leaves content at opacity 0`);
    for (const m of styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/\.rv\b/.test(m[1]) || !/opacity\s*:\s*0(?![.\d])/.test(m[2])) continue;
      assert.match(m[1], /html\.js \.rv\[data-rv-wait\]/, `${key}: only the script's marker may hide a reveal item (${m[1].trim()})`);
    }
    assert.doesNotMatch(html.replace(/<script>[\s\S]*?<\/script>/g, ""), /<[a-z][^>]*\sdata-rv-wait/, `${key}: no element starts hidden in the markup`);
    assert.match(styles, /html:not\(\.js\) \*[^{]*\{animation:none !important\}/, `${key}: without the script nothing animates`);
    assert.match(styles, /@media print\{[\s\S]*?\.rv,html\.js \.rv\[data-rv-wait\]\{opacity:1 !important/, `${key}: print shows every item`);
    assert.match(styles, /@media \(prefers-reduced-motion:reduce\)\{[\s\S]*?html\.js \.rv\[data-rv-wait\]\{opacity:1;transform:none\}/, `${key}: reduced motion shows every item`);
  }
});

test("the script hides only items below the fold, and a failsafe reveals them after 1.2 seconds", () => {
  const { html } = render(lead("auto-repair"));
  const page = runPage(html, { viewport: 800, io: "silent" });
  assert.ok(page.root.classes.has("js"));
  assert.deepEqual(page.waiting(), [1200, 2400, 3600], "items on the first screen are never hidden");
  const failsafe = page.timers.find((t) => t.ms === 1200);
  assert.ok(failsafe, "a 1.2 second failsafe is scheduled");
  page.runTimers(1200);
  assert.deepEqual(page.waiting(), [], "the failsafe reveals everything even if the observer never fired");
});

test("an observer that fires reveals items as they scroll in", () => {
  const { html } = render(lead("roofing"));
  const page = runPage(html, { io: "live" });
  const io = page.observers[0];
  io.emit(page.rvs[2], true);
  assert.deepEqual(page.waiting(), [2400, 3600]);
});

test("a tall viewport, a missing observer or reduced motion hides nothing", () => {
  const { html } = render(lead("barber"));
  assert.deepEqual(runPage(html, { viewport: 5000 }).waiting(), [], "tall viewport: everything starts on screen");
  assert.deepEqual(runPage(html, { io: "none" }).waiting(), [], "no IntersectionObserver: nothing is hidden");
  assert.deepEqual(runPage(html, { reduce: true }).waiting(), [], "prefers-reduced-motion: nothing is hidden");
  assert.deepEqual(runPage(html, { viewport: 0 }).waiting(), [], "a zero height frame hides nothing");
});

test("beforeprint reveals everything", () => {
  const { html } = render(lead("general"));
  const page = runPage(html);
  assert.ok(page.waiting().length > 0);
  page.fireWindow("beforeprint");
  assert.deepEqual(page.waiting(), []);
});

test("the rating numeral is static text, the js class is set before paint and print stops motion", () => {
  for (const { name, key, assignment } of ONE_PER_DIRECTION) {
    for (const rating of [4.5, 4.9, 5]) {
      const { html } = render(lead(key, { googleRating: rating }), assignment);
      assert.ok(html.includes(`data-rating-num>${formatRating(rating)}<`), `${name}: the numeral is static text for ${rating}`);
    }
    const { html } = render(lead(key), assignment);
    assert.match(css(html), /@media print\{\s*\*,\*::before,\*::after\{animation:none !important;transition:none !important\}/, name);
    assert.match(html, /<head>[\s\S]*<script>document\.documentElement\.classList\.add\("js"\)<\/script>[\s\S]*<\/head>/, `${name}: the js class is set before first paint`);
  }
});

test("the mobile call bar shows only under 760px and reserves its own height", () => {
  for (const { name: key, key: cat, assignment } of ONE_PER_DIRECTION) {
    const { html } = render(lead(cat), assignment);
    const styles = css(html);
    assert.match(html, /<body class="has-callbar">/, key);
    assert.match(styles, /\.callbar\{display:none;position:fixed;[^}]*height:var\(--callbar-h\)/, `${key}: hidden by default with a fixed height`);
    assert.match(styles, /@media \(max-width:759\.98px\)\{\s*\.callbar\{display:flex\}\s*body\.has-callbar\{padding-bottom:calc\(var\(--callbar-h\) \+ 2 \* var\(--callbar-gap\)/, `${key}: shown under 760px with matching bottom padding`);
    assert.doesNotMatch(styles, /min-width:860px\)\{\.callbar|max-width:859px/, `${key}: the old 860px breakpoint is gone`);
    for (const m of styles.matchAll(/@media \((max|min)-width:(\d+(?:\.\d+)?)px\)\{[^@]*?\.callbar\{display:flex/g)) {
      assert.equal(m[1], "max");
      assert.ok(Number(m[2]) < 760, `${key}: the call bar never shows at 760px or wider`);
    }
  }
  const noPhone = render(lead("general", { phone: "" })).html;
  assert.doesNotMatch(noPhone, /class="callbar"/);
  assert.match(noPhone, /<body>/, "no padding is reserved when there is no call bar");
});

test("the call bar tucks away while the footer or the form submit is on screen", () => {
  const { html } = render(lead("plumbing"));
  const page = runPage(html, { io: "live" });
  const tuck = page.observers.find((o) => o.targets.has(page.footer));
  assert.ok(tuck && tuck.targets.has(page.submit), "the footer and the submit button are watched");
  tuck.emit(page.submit, true);
  assert.equal(page.bar.hasAttribute("data-tucked"), true);
  tuck.emit(page.submit, false);
  assert.equal(page.bar.hasAttribute("data-tucked"), false);
  tuck.emit(page.footer, true);
  assert.equal(page.bar.hasAttribute("data-tucked"), true);
});

test("an exported share file shows the ribbon on every load; hiding lasts only for the current view", () => {
  const l = lead("auto-body-collision", { demo: { shareApproved: true } });
  const { html } = render(l);
  // The export writes the built demo byte for byte, so the file is this html.
  const shareFile = String(html);
  assert.equal(checkDemoHtml(shareFile, l).ok, true);
  const storage = { "kija-demo-lang": "en", "kija-ribbon": "hidden" };
  const first = runPage(shareFile, { storage });
  assert.equal(first.ribbon.hasAttribute("data-hidden"), false, "visible on load");
  first.hideBtn.fire("click");
  assert.equal(first.ribbon.hasAttribute("data-hidden"), true, "Hide for presentation works");
  assert.deepEqual(Object.keys(storage).sort(), ["kija-demo-lang", "kija-ribbon"], "hiding stores nothing");
  const reload = runPage(shareFile, { storage });
  assert.equal(reload.ribbon.hasAttribute("data-hidden"), false, "a reload shows it again");
  assert.match(css(shareFile), /@media print\{[\s\S]*?\.kija-ribbon,\.kija-ribbon\[data-hidden\]\{display:block/, "print always shows it");
});

test("the guardrail rejects a share file whose ribbon is hidden on load", () => {
  const l = lead("roofing");
  const { html } = render(l);
  const byCss = html.replace("</style>", ".kija-ribbon{display:none}</style>");
  assert.ok(checkDemoHtml(byCss, l).errors.some((e) => e.includes("CSS rule")));
  const byStyle = html.replace("data-kija-ribbon", "data-kija-ribbon style=\"display:none\"");
  assert.ok(checkDemoHtml(byStyle, l).errors.some((e) => e.includes("visible when the page loads")));
  const byScript = html.replace("</body>", "<script>var ribbon=document.querySelector(\"[data-kija-ribbon]\");ribbon.setAttribute(\"data-hidden\",\"\");</script></body>");
  assert.ok(checkDemoHtml(byScript, l).errors.some((e) => e.includes("page script")));
});

test("every claim on the forbidden list is caught unless the record backs it", () => {
  const base = lead("auto-repair", { reviewThemes: [] });
  const { html } = render(base);
  const inject = (text) => html.replace("<main>", `<main><p>${text}</p>`);
  const claims = [
    "Serving Dallas since 19",
    "Proudly here since 20",
    "Since 19xx",
    "Serving since 2011",
    "Est. 2004",
    "Family owned",
    "Family-owned shop",
    "A family business",
    "Licensed technicians",
    "Fully insured",
    "Bonded crews",
    "Certified mechanics",
    "12 month warranty",
    "Work guaranteed",
    "Our guarantee",
    "Financing available",
    "Easy finance",
    "Award winning",
    "The #1 shop",
    "Number one in town",
    "Number 1 in Dallas",
    "Best in Texas",
  ];
  for (const claim of claims) {
    const errors = checkDemoHtml(inject(claim), base).errors;
    assert.ok(errors.some((e) => e.startsWith("Unbacked claim")), `should flag: ${claim}`);
  }
  const backed = [
    [{ established: 2011 }, "Serving since 2011"],
    [{ established: 2004 }, "Est. 2004"],
    [{ services: ["Licensed inspections"] }, "Licensed inspections"],
    [{ services: ["Warranty repairs"] }, "Warranty repairs"],
    [{ reviewThemes: ["Family owned feel"] }, "Family owned feel"],
    [{ business: "Best in Town Tires" }, "Best in Town Tires"],
  ];
  for (const [extra, text] of backed) {
    const l = { ...base, ...extra };
    const errors = checkDemoHtml(render(l).html.replace("<main>", `<main><p>${text}</p>`), l).errors;
    assert.deepEqual(errors, [], `backed by the record: ${text}`);
  }
  assert.ok(checkDemoHtml(inject("Serving since 2011"), { ...base, established: 1999 }).errors.some((e) => e.includes("since 2011")), "the year must match");
});

test("demoCopy cannot vouch for its own claims", () => {
  const l = lead("roofing", { demoCopy: { headline: "Licensed and insured roofers" } });
  const errors = checkDemoHtml(render(l).html, l).errors;
  assert.ok(errors.some((e) => e.includes("Licensed")));
  assert.ok(errors.some((e) => e.includes("insured")));
});

test("no direction states a forbidden claim for a bare record, in any palette, category or language", () => {
  for (const d of DIRECTION_LIST) {
    for (const key of d.suits) {
      for (const p of d.palettes) {
        for (const languages of [[], ["English", "Spanish"]]) {
          const l = lead(key, { reviewThemes: [], services: [], languages });
          const { errors } = checkDemoHtml(render(l, forced(d, p.key)).html, l);
          assert.deepEqual(errors, [], `${d.key}/${key}/${p.key}/${languages.join("+") || "en"}`);
        }
      }
    }
  }
  // Every category also passes with the direction assignment picks for it.
  for (const key of Object.keys(CATEGORIES)) {
    const l = lead(key, { reviewThemes: [], services: [] });
    assert.deepEqual(checkDemoHtml(render(l).html, l).errors, [], key);
  }
});

test("nothing is copied from another business", () => {
  for (const key of Object.keys(CATEGORIES)) {
    const { html } = render(lead(key));
    const markup = html.replace(/<script>[\s\S]*?<\/script>/g, "");
    assert.doesNotMatch(markup, /<(?:picture|video|image|object|embed)\b/i, `${key}: no logos or media`);
    for (const m of markup.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)) assert.match(m[1], /^https:\/\/images\.(?:unsplash|pexels)\.com\//, `${key}: library photos only`);
    assert.doesNotMatch(html, /data:image\//i, `${key}: no embedded images`);
    assert.doesNotMatch(markup, /<(?:blockquote|q|cite)\b/i, `${key}: no review quotes`);
  }
  const l = lead("general");
  const { html } = render(l);
  const inject = (text) => html.replace("<main>", `<main>${text}`);
  assert.ok(checkDemoHtml(inject("<img src=\"logo.png\" alt=\"\">"), l).errors.some((e) => e.includes("stock library")), "even a local image is refused");
  assert.ok(checkDemoHtml(inject("<svg><image href=\"x.png\"/></svg>"), l).errors.some((e) => e.includes("image or media tag")));
  assert.ok(checkDemoHtml(html.replace("</style>", ".x{background:url(data:image/png;base64,AAAA)}</style>"), l).errors.some((e) => e.includes("data URL")));
  assert.ok(checkDemoHtml(inject("<p><q>Best shop ever</q></p>"), l).errors.some((e) => e.includes("quotation")));
  assert.ok(checkDemoHtml(inject("<p>\"They fixed my car the same day and charged less\"</p>"), l).errors.some((e) => e.includes("quoted text")));
  assert.ok(checkDemoHtml(inject(`<p>${String.fromCharCode(0x201c)}Friendly staff who really care${String.fromCharCode(0x201d)}</p>`), l).errors.some((e) => e.includes("quoted text")));
});

test("the rating shown equals the lead record exactly, in text, labels and numerals", () => {
  for (const { key, assignment } of ONE_PER_DIRECTION) {
    for (const rating of [4.5, 4.7, 4.9, 5]) {
      const l = lead(key, { googleRating: rating });
      const { html } = render(l, assignment);
      assert.deepEqual(checkDemoHtml(html, l).errors, [], `${key} ${rating}`);
      const numerals = [...html.matchAll(/data-rating-num>([^<]*)</g)].map((m) => m[1]);
      assert.ok(numerals.length >= 1, `${key}: a rating numeral is marked`);
      for (const n of numerals) assert.equal(n, formatRating(rating));
      assert.ok(checkDemoHtml(html, { ...l, googleRating: rating === 5 ? 4.9 : 5 }).errors.length > 0, "a different record fails");
    }
  }
  const l = lead("barber");
  const { html } = render(l);
  const numeral = html.replace("data-rating-num>4.9<", "data-rating-num>5.0<");
  assert.ok(checkDemoHtml(numeral, l).errors.some((e) => e.includes("rating numeral")));
  const label = html.replace("aria-label=\"Rated 4.9 out of 5\"", "aria-label=\"Rated 5.0 out of 5\"");
  assert.ok(checkDemoHtml(label, l).errors.some((e) => e.startsWith("Label")));
  const meta = html.replace("4.9 stars from 312 Google reviews.\"", "4.9 stars from 900 Google reviews.\"");
  assert.ok(checkDemoHtml(meta, l).errors.some((e) => e.includes("900 Google reviews")));
});
