import assert from "node:assert/strict";
import test from "node:test";
import { ESTIMATE_DISCLAIMER } from "../src/lib/roi.js";
import { checkPitchHtml, demoHref, plainConcept, PRICE_TO_CONFIRM, renderPitch } from "../src/pitch/render.js";
import { formatRating, pitchStats, reviewsPhrase, stripDashes } from "../src/pitch/shared.js";
import { CATEGORIES, DASHES, LEADS, NOW, PLACEHOLDER, fullBenchmarks, hasDash, leadById, settingsWith, visibleText } from "./pitch-fixtures.js";

function render(lead, { settings = settingsWith(), benchmarks = PLACEHOLDER } = {}) {
  return renderPitch(lead, { settings, benchmarks, categories: CATEGORIES, now: NOW });
}

const SAMPLE = ["gm-auto-care", "prime-time-septic", "adams-brothers-roof", "brownies", "papas-and-ninos", "rios-used-tires"];

test("every seed lead renders with placeholder benchmarks and passes the pitch guardrails", () => {
  const settings = settingsWith();
  for (const lead of LEADS) {
    const html = render(lead, { settings });
    const check = checkPitchHtml(html, lead, { settings });
    assert.deepEqual(check.errors, [], `${lead.id}: ${check.errors.join(" ")}`);
    assert.ok(html.startsWith("<!doctype html>"), lead.id);
    assert.ok(html.includes("<meta name=\"robots\" content=\"noindex, nofollow\">"), lead.id);
    assert.ok(html.includes("fonts.googleapis.com"), lead.id);
    assert.ok(!/<script\b/i.test(html), `${lead.id} should not need scripts`);
  }
});

test("sample leads render with a fuller sourced benchmark set", () => {
  const benchmarks = fullBenchmarks();
  for (const prefix of SAMPLE) {
    const lead = leadById(prefix);
    const html = render(lead, { benchmarks });
    assert.equal(checkPitchHtml(html, lead).ok, true, prefix);
  }
  const gm = leadById("gm-auto-care");
  const html = render(gm, { benchmarks });
  const text = visibleText(html);
  // Sourced auto repair numbers: $550 at 50% means 10 jobs for $2,500.
  assert.match(text, /At a typical \$550 repair order and 50% gross margin, the site pays for itself after 10 extra jobs/);
  assert.ok(html.includes("https://example.org/shop-survey"), "ticket source link");
  assert.ok(html.includes("Fixture Margin Study, 2024"), "margin source with year");
  assert.match(text, /rented leads from a lead marketplace/);
  assert.match(text, /subscription website plans commonly run about \$100 to \$400 a month/);
});

test("the section argument appears in order", () => {
  const html = render(leadById("gm-auto-care"));
  const order = ["You already earned the trust", "What a customer finds today", "The concept we built for you", "The math", "Own it. Do not rent it.", "Next step: a 15 minute walkthrough"];
  let at = -1;
  for (const heading of order) {
    const i = html.indexOf(heading);
    assert.ok(i > at, `${heading} should follow the previous section`);
    at = i;
  }
});

test("real rating, review count, city and research wording appear", () => {
  const lead = leadById("als-auto-repair");
  const text = visibleText(render(lead));
  assert.ok(text.includes(formatRating(lead.googleRating)));
  assert.ok(text.includes(reviewsPhrase(lead)));
  assert.ok(text.includes("Oak Cliff, Dallas, TX"), "area and city");
  assert.ok(text.includes(lead.websiteStatus), "website status sentence");
  assert.ok(text.includes("As listed when we checked on September 26, 2026."));
});

test("review themes render when present and are never invented when absent", () => {
  const lead = leadById("gm-auto-care");
  const without = visibleText(render(lead));
  assert.ok(!without.includes("Themes we noticed"), "no theme list without themes");
  assert.match(without, /We would rather hear it from you/);
  lead.reviewThemes = ["Honest pricing", "Fast turnaround"];
  const withThemes = visibleText(render(lead));
  assert.ok(withThemes.includes("Honest pricing") && withThemes.includes("Fast turnaround"));
  assert.ok(withThemes.includes("Themes we noticed reading your reviews, in our words."));
});

test("price is hidden unless priceConfirmed, and shown when confirmed", () => {
  const lead = leadById("gm-auto-care");
  const hidden = render(lead, { settings: settingsWith({ price: 2750, priceConfirmed: false }) });
  assert.ok(!hidden.includes("$2,750"), "unconfirmed price must not appear");
  assert.ok(hidden.includes(PRICE_TO_CONFIRM));
  assert.equal(checkPitchHtml(hidden, lead, { settings: settingsWith({ price: 2750, priceConfirmed: false }) }).warnings.length, 0);

  const shown = render(lead, { settings: settingsWith({ price: 2750, priceConfirmed: true }) });
  assert.ok(shown.includes("$2,750"), "confirmed price appears");
  assert.ok(!shown.includes(PRICE_TO_CONFIRM));
});

test("an unconfirmed price never leaks through the care plan either", () => {
  const settings = settingsWith({ priceConfirmed: false, optionalCare: { name: "Care plan", monthly: 49, description: "Updates and hosting" } });
  const html = render(leadById("gm-auto-care"), { settings });
  assert.ok(!html.includes("$49"));
  assert.ok(visibleText(html).includes("Optional: Care plan. Updates and hosting."));
});

test("unverified numbers are labelled estimate, sourced ones are not", () => {
  const lead = leadById("gm-auto-care");
  const placeholder = render(lead);
  const rows = placeholder.match(/<ul class="assumptions">[\s\S]*?<\/ul>/)[0];
  const ticketRow = rows.match(/<li><span class="a-label">Typical ticket[\s\S]*?<\/li>/)[0];
  const marginRow = rows.match(/<li><span class="a-label">Gross margin[\s\S]*?<\/li>/)[0];
  assert.match(ticketRow, /class="badge">Estimate</);
  assert.match(marginRow, /class="badge">Estimate</);
  assert.match(ticketRow, /not yet backed by a published source/);
  assert.match(placeholder, /class="be-copy">[\s\S]*?class="badge">Estimate</, "break even is labelled");

  const full = render(lead, { benchmarks: fullBenchmarks() });
  const fullRows = full.match(/<ul class="assumptions">[\s\S]*?<\/ul>/)[0];
  const fullTicket = fullRows.match(/<li><span class="a-label">Typical ticket[\s\S]*?<\/li>/)[0];
  assert.ok(!/class="badge">Estimate</.test(fullTicket), "sourced ticket has no estimate badge");
  assert.ok(full.includes(ESTIMATE_DISCLAIMER));
  assert.ok(placeholder.includes(ESTIMATE_DISCLAIMER));
});

test("consumer stats render only when verified and useInPitch, at most three, with year and source", () => {
  const lead = leadById("gm-auto-care");
  const none = visibleText(render(lead));
  assert.ok(!none.includes("How people choose a local business"), "no stats block without stats");

  const text = visibleText(render(lead, { benchmarks: fullBenchmarks() }));
  assert.ok(text.includes("of shoppers read reviews before choosing a local business"));
  assert.ok(text.includes("Fixture Consumer Survey, 2025"));
  assert.ok(text.includes("Fixture Compare Study, 2023"));
  assert.ok(!text.includes("UNVERIFIED STAT"));
  assert.ok(!text.includes("NOT FOR PITCH"));
  assert.ok(!text.includes("FOURTH APPROVED"), "capped at three");
  assert.equal(pitchStats(fullBenchmarks()).length, 3);

  const noYear = fullBenchmarks();
  noYear.consumerStats = [{ ...noYear.consumerStats[0], year: null }];
  assert.equal(pitchStats(noYear).length, 0, "a stat without a year is not cited");
});

test("no dash characters in any rendered pitch, even when research fields carry them", () => {
  for (const lead of LEADS) assert.ok(!hasDash(render(lead, { benchmarks: fullBenchmarks() })), lead.id);
  const dirty = leadById("gm-auto-care");
  dirty.websiteStatus = `No site ${DASHES[0]} only a directory`;
  dirty.demoConcept = `Pages 2${DASHES[1]}3 deep`;
  dirty.reviewThemes = [`Fair ${DASHES[0]} fast`];
  const html = render(dirty);
  assert.ok(!hasDash(html));
  assert.ok(html.includes("No site, only a directory."));
  assert.ok(html.includes("Pages 2-3 deep."));
  assert.equal(stripDashes(`a ${DASHES[0]} b`), "a, b");
});

test("never uses the word guarantee and never claims Google affiliation", () => {
  for (const lead of LEADS) {
    const html = render(lead, { benchmarks: fullBenchmarks(), settings: settingsWith({ priceConfirmed: true }) });
    assert.ok(!/guarantee/i.test(html), lead.id);
    assert.ok(visibleText(html).includes("not affiliated with Google"), lead.id);
  }
});

test("links to the private demo relatively, through the app server", () => {
  const lead = leadById("gm-auto-care");
  const html = render(lead);
  assert.equal(demoHref(lead), "../../demos/gm-auto-care-dallas-tx/");
  assert.ok(html.includes("href=\"../../demos/gm-auto-care-dallas-tx/\""));
});

test("the gap section adapts to the website gap and the concept to the vertical", () => {
  const gap3 = visibleText(render(leadById("gm-auto-care")));
  assert.ok(gap3.includes("No website of their own"));
  assert.ok(gap3.includes("What they cannot do yet"));
  const gap2 = visibleText(render(leadById("most-famous-cutz")));
  assert.ok(gap2.includes("Third party pages only"));
  assert.ok(gap2.includes("request an appointment time"), "booking for personal care");
  const body = visibleText(render(leadById("papas-and-ninos")));
  assert.ok(body.includes("send photos of the damage to start an estimate"));
  assert.ok(body.includes("English and Spanish"), "bilingual lead mentions the toggle");
  const weak = leadById("gm-auto-care");
  weak.websiteGap = 1;
  assert.ok(visibleText(render(weak)).includes("What your site could do better"));
});

test("presence links render only when sourced as http urls", () => {
  const lead = leadById("rios-used-tires");
  lead.presence = { facebook: "https://facebook.com/example", instagram: "javascript:alert(1)", yelp: "", booking: "", other: [{ url: "https://maps.apple.com/x", label: "Apple Maps" }] };
  const html = render(lead);
  assert.ok(html.includes("href=\"https://facebook.com/example\""));
  assert.ok(!html.includes("javascript:"));
  assert.ok(visibleText(html).includes("a listing on Apple Maps"));
});

test("business names are escaped", () => {
  const lead = leadById("l-r-paint");
  const html = render(lead);
  assert.ok(html.includes("L &amp; R Paint &amp; Body Shop"));
  const evil = { ...leadById("gm-auto-care"), business: "<script>x</script>" };
  assert.ok(!render(evil).includes("<script>x"));
});

test("print stylesheet targets letter paper on a light page", () => {
  const html = render(leadById("gm-auto-care"));
  assert.match(html, /@page \{ size: letter;/);
  assert.match(html, /@media print \{[\s\S]*body \{ background: #fff;/);
  assert.match(html, /\.page-start \{ break-before: page;/);
  assert.match(html, /prefers-reduced-motion: reduce/);
});

test("missing ticket falls back to a conversation, not invented math", () => {
  const benchmarks = structuredClone(PLACEHOLDER);
  delete benchmarks.categories["auto-repair"];
  delete benchmarks.categories.general;
  const lead = leadById("gm-auto-care");
  const html = render(lead, { benchmarks });
  assert.equal(checkPitchHtml(html, lead).ok, true);
  assert.ok(visibleText(html).includes("We would rather run these numbers with your real average job"));
  assert.ok(!html.includes("class=\"scen\""));
});

test("render is deterministic for the same inputs", () => {
  const lead = leadById("prime-time-septic");
  assert.equal(render(lead), render(lead));
  assert.ok(render(lead).includes("Prepared for Prime Time Septic Pumping, Inc., September 28, 2026"));
});

test("plainConcept trades researcher shorthand for plain words", () => {
  assert.equal(plainConcept("Estimate CTA, hours/map and 24/7 calls"), "Estimate button, hours and map and 24/7 calls");
  assert.equal(plainConcept("BMW/Mercedes/Audi service CTAs"), "BMW, Mercedes and Audi service buttons");
});

test("renderPitch refuses a lead without an id", () => {
  assert.throws(() => renderPitch({}, {}), /needs a lead with an id/);
});
