import assert from "node:assert/strict";
import test from "node:test";
import { ESTIMATE_DISCLAIMER } from "../src/lib/roi.js";
import { checkPitchHtml, demoHref, plainConcept, PRICE_TO_CONFIRM, renderPitch } from "../src/pitch/render.js";
import fs from "node:fs";
import path from "node:path";
import {
  formatRating,
  normalizeUnitText,
  perUnit,
  pitchStats,
  plainPlatform,
  reviewsPhrase,
  roiFor,
  statCite,
  statHeadline,
  statSentence,
  statTopic,
  stripDashes,
  titleYear,
  unitParts,
} from "../src/pitch/shared.js";
import { CATEGORIES, DASHES, LEADS, NOW, PLACEHOLDER, ROOT, fullBenchmarks, hasDash, leadById, settingsWith, visibleText } from "./pitch-fixtures.js";

// The real research numbers, read only.
const RESEARCH = JSON.parse(fs.readFileSync(path.join(ROOT, "research", "benchmarks.json"), "utf8"));

function stat(id, claim, value, extra = {}) {
  return { id, claim, value, year: 2026, source: "Fixture Survey 2026", url: "https://example.org/s", verified: true, useInPitch: true, notes: "", ...extra };
}

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
  assert.match(text, /At a typical \$550 per repair order and 50% gross margin, the site pays for itself after 10 extra jobs/);
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

test("a scenario cell that happens to equal the unconfirmed price is not flagged, a leaked price is", () => {
  const settings = settingsWith({ price: 2500, priceConfirmed: false });
  const lead = { ...leadById("gm-auto-care"), roiOverrides: { ticket: 500 } };
  const html = render(lead, { settings });
  assert.ok(html.includes("<td>$2,500</td>"), "5 jobs at $500 is $2,500 of revenue in the table");
  assert.deepEqual(checkPitchHtml(html, lead, { settings }).warnings, []);
  const leaked = html.replace("</main>", "<p>Only $2,500.</p></main>");
  assert.equal(checkPitchHtml(leaked, lead, { settings }).warnings.length, 1);
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

test("a missing ticket uses the labelled category estimate, and a missing price falls back to a conversation", () => {
  const benchmarks = structuredClone(PLACEHOLDER);
  delete benchmarks.categories["auto-repair"];
  delete benchmarks.categories.general;
  const lead = leadById("gm-auto-care");
  const html = render(lead, { benchmarks });
  assert.equal(checkPitchHtml(html, lead).ok, true);
  const ticketRow = html.match(/<li><span class="a-label">Typical ticket[\s\S]*?<\/li>/)[0];
  assert.match(ticketRow, /class="badge">Estimate</, "the fallback ticket is labelled an estimate");

  const noPrice = render(lead, { settings: settingsWith({ price: 0 }) });
  assert.equal(checkPitchHtml(noPrice, lead).ok, true);
  assert.ok(visibleText(noPrice).includes("We would rather run these numbers with your real average job"));
  assert.ok(!noPrice.includes("class=\"scen\""));
});

test("ticket units read per unit once, in the sentence and the assumptions", () => {
  assert.deepEqual(unitParts("per repair order"), { full: "repair order", short: "repair order" });
  assert.deepEqual(unitParts("repair order"), { full: "repair order", short: "repair order" });
  assert.deepEqual(unitParts("per new customer first job (repair visit typical; replacement is the high)"), { full: "new customer first job", short: "new customer first job" });
  assert.deepEqual(unitParts("per new customer, first year of service"), { full: "new customer, first year of service", short: "new customer" });
  assert.deepEqual(unitParts(""), { full: "job", short: "job" });
  assert.equal(perUnit("per haircut"), "per haircut");
  assert.equal(normalizeUnitText("At a typical $550 per repair order and 50% gross margin", { ticket: 550, unit: "per repair order" }), "At a typical $550 per repair order and 50% gross margin");
  assert.equal(normalizeUnitText("At a typical $550 repair order and", { ticket: 550, unit: "repair order" }), "At a typical $550 per repair order and");
  assert.equal(normalizeUnitText("$550 per per repair order", { ticket: 550, unit: "per repair order" }), "$550 per repair order");

  const benchmarks = fullBenchmarks();
  benchmarks.categories["auto-repair"].ticket.unit = "per repair order";
  const lead = leadById("gm-auto-care");
  const html = render(lead, { benchmarks });
  const text = visibleText(html);
  assert.ok(!/per per/i.test(html), "no doubled unit anywhere");
  assert.match(text, /Typical ticket \$550 per repair order /);
  assert.match(text, /At a typical \$550 per repair order and 50% gross margin/);

  benchmarks.categories["auto-repair"].ticket.unit = "per new customer first job (repair visit typical; replacement is the high)";
  const long = visibleText(render(lead, { benchmarks }));
  assert.ok(!long.includes("replacement is the high"), "researcher notes stay off the owner's page");
  assert.match(long, /At a typical \$550 per new customer first job and 50% gross margin/);
});

test("with the real research benchmarks no pitch doubles a unit and every page passes", () => {
  for (const lead of LEADS) {
    const html = render(lead, { benchmarks: RESEARCH });
    const check = checkPitchHtml(html, lead);
    assert.deepEqual(check.errors, [], `${lead.id}: ${check.errors.join(" ")}`);
    assert.ok(!/per per/i.test(html), lead.id);
    assert.ok(!/\(\d+% in 20\d\d\)/.test(visibleText(html)), `${lead.id}: stat comparisons stay out of the headline`);
    assert.equal((html.match(/<strong class="stat-val">/g) || []).length, 3, `${lead.id}: three stats`);
  }
});

test("stats pick by pitchPriority, lowest first, and prefer different topics", () => {
  const b = { consumerStats: [
    stat("a", "Nearly all consumers read online reviews for local businesses.", "97% read reviews"),
    stat("b", "About two in five consumers always read reviews.", "41% always (29% in 2025)"),
    stat("c", "Most positive reviews make people more likely to use a business.", "85% more likely"),
    stat("d", "After reading positive reviews, the most common next step is checking the business website.", "54% check the website (32% in 2019)", { pitchPriority: 1 }),
    stat("e", "Most local business searches start on a phone.", "73% mobile, 19% computer", { pitchPriority: 2 }),
    stat("f", "Half of recent local searchers decided not to contact a business they looked at.", "52%", { pitchPriority: 3 }),
  ] };
  assert.deepEqual(pitchStats(b).map((s) => s.id), ["d", "e", "f"], "priority first");

  const noPriority = { consumerStats: b.consumerStats.map(({ pitchPriority, ...rest }) => rest) };
  assert.deepEqual(pitchStats(noPriority).map((s) => s.id), ["a", "d", "e"], "one review stat, then other topics, in file order");
  assert.equal(statTopic(noPriority.consumerStats[3]), "website", "a website stat that mentions reviews is a website stat");

  const mixed = { consumerStats: [stat("p", "Nearly all consumers read reviews.", "97%", { pitchPriority: 1 }), stat("q", "Two in five always read reviews.", "41%", { pitchPriority: 2 }), stat("r", "Most searches start on a phone.", "73%")] };
  assert.deepEqual(pitchStats(mixed).map((s) => s.id), ["p", "r", "q"], "a second review stat waits behind a different topic");

  const allReviews = { consumerStats: b.consumerStats.slice(0, 3) };
  assert.equal(pitchStats(allReviews).length, 3, "fills from the same topic only when nothing else is left");
  assert.equal(pitchStats(b, 2).length, 2, "a number is still the limit");
  const topical = { consumerStats: [stat("x", "One.", "1%", { topic: "t" }), stat("y", "Two.", "2%", { topic: "t" }), stat("z", "Three.", "3%", { topic: "u" })] };
  assert.deepEqual(pitchStats(topical, 2).map((s) => s.id), ["x", "z"], "a stat's own topic wins");
});

test("a star threshold stat shows only when the lead clears it", () => {
  const b = { consumerStats: [stat("stars", "About a third of consumers will only use a business rated 4.5 stars or higher.", "31% only use 4.5+ stars (17% in 2025)")] };
  assert.equal(pitchStats(b, { lead: { googleRating: 4.8 } }).length, 1);
  assert.equal(pitchStats(b, { lead: { googleRating: 4.4 } }).length, 0);
  assert.equal(pitchStats(b).length, 0, "without a lead it is left out");
  const explicit = { consumerStats: [stat("m", "Something about ratings.", "10%", { minRating: 4.9 })] };
  assert.equal(pitchStats(explicit, { lead: { googleRating: 4.8 } }).length, 0);
});

test("each stat renders as a clean number, one plain sentence, and its source and year", () => {
  assert.equal(statHeadline("41% always (29% in 2025)"), "41%");
  assert.equal(statHeadline("31% only use 4.5+ stars (17% in 2025); 68% require 4+ stars"), "31%");
  assert.equal(statHeadline("150%+ near me now"), "150%+");
  assert.equal(statHeadline("Over 2 billion a month (calls, directions)"), "Over 2 billion");
  assert.equal(statHeadline("36,207,130"), "36,207,130");
  assert.equal(statHeadline("Qualitative, 20 searches"), "");
  assert.equal(statSentence({ claim: "of shoppers read reviews", value: "87%" }), "87% of shoppers read reviews.");
  assert.equal(statSentence({ claim: "Most searches start on a phone", value: "73% mobile" }), "Most searches start on a phone.");
  assert.equal(statCite({ source: "BrightLocal, Local Consumer Review Survey 2026", year: 2026 }), "BrightLocal, Local Consumer Review Survey 2026");
  assert.equal(statCite({ source: "Fixture Study", year: 2024 }), "Fixture Study, 2024");

  const b = fullBenchmarks();
  b.consumerStats = [stat("b", "About two in five consumers always read reviews when browsing for businesses.", "41% always (29% in 2025)", { source: "BrightLocal, Local Consumer Review Survey 2026 (1,002 US adults)" })];
  const html = render(leadById("gm-auto-care"), { benchmarks: b });
  assert.match(html, /<strong class="stat-val">41%<\/strong>/);
  assert.ok(!html.includes("29% in 2025"), "the comparison does not ride along");
  const text = visibleText(html);
  assert.ok(text.includes("About two in five consumers always read reviews when browsing for businesses."));
  assert.ok(text.includes("BrightLocal, Local Consumer Review Survey 2026 (1,002 US adults)"));
  assert.ok(!text.includes("(1,002 US adults), 2026"), "the year is not repeated");
});

test("the cost per paying customer leads the comparison, with the rented lead line after it", () => {
  const benchmarks = fullBenchmarks();
  benchmarks.categories["auto-repair"].rentedCustomer = { typical: 250, platform: "Google Local Services Ads", sources: [{ title: "Fixture Customer Cost", url: "https://example.org/customer", year: 2026 }] };
  const lead = leadById("gm-auto-care");
  const roi = roiFor(lead, { settings: settingsWith(), benchmarks });
  assert.ok(roi.rentedCustomerComparison, "computeRoi returns the customer comparison");
  const html = render(lead, { benchmarks });
  const customerAt = html.indexOf("class=\"rented rented-customer\"");
  const leadAt = html.indexOf("class=\"rented-lead\"");
  assert.ok(customerAt > 0, "customer line renders");
  assert.ok(leadAt > customerAt, "lead line follows it");
  assert.ok(visibleText(html).includes(roi.rentedCustomerComparison.sentence));
  const customerLine = html.slice(customerAt, html.indexOf("</p>", customerAt));
  assert.ok(!/class="badge"/.test(customerLine), "a sourced customer cost carries no estimate badge");
  assert.ok(visibleText(html).includes("Counted per lead instead, the same money buys about 42 rented leads from a lead marketplace at about $40 to $80 each, and not every lead becomes a paying customer."));

  // Without the customer figure, the rented lead sentence stands alone.
  const plain = render(lead, { benchmarks: fullBenchmarks() });
  assert.ok(!plain.includes("rented-customer"));
  assert.ok(plain.includes("class=\"rented rented-lead\""));
});

test("platform names and source titles read plainly", () => {
  assert.equal(plainPlatform("Google LSA (SearchLight drain and sewer, stand-in)"), "Google Local Services Ads");
  assert.equal(plainPlatform("Google Search Ads (LocaliQ automotive medians, not LSA)"), "Google Search Ads");
  assert.equal(plainPlatform("Google LSA"), "Google Local Services Ads");
  assert.equal(titleYear("Tekmetric Auto Repair Industry Index, September 2023", 2023), "Tekmetric Auto Repair Industry Index, September 2023");
  assert.equal(titleYear("Fixture Shop Survey", 2025), "Fixture Shop Survey, 2025");
  for (const prefix of ["gm-auto-care", "prime-time-septic", "adams-brothers-roof"]) {
    const text = visibleText(render(leadById(prefix), { benchmarks: RESEARCH }));
    const math = text.slice(text.indexOf("The math"), text.indexOf("Every number we used"));
    assert.ok(!/stand-in|medians|not LSA/.test(math), `${prefix}: no researcher notes in the comparison`);
    assert.ok(!/(\b20\d\d\b), \1\b/.test(text), `${prefix}: no year printed twice`);
  }
});

test("a precomputed roi with a customer comparison is used as given", () => {
  const lead = leadById("gm-auto-care");
  const settings = settingsWith();
  const roi = roiFor(lead, { settings, benchmarks: fullBenchmarks() });
  roi.rentedCustomerComparison = { typical: 233, platform: "Google Local Services Ads", customers: 11, sentence: "The site costs about the same as 11 customers rented through Google Local Services Ads." };
  const html = renderPitch(lead, { settings, benchmarks: fullBenchmarks(), categories: CATEGORIES, now: NOW, roi });
  assert.ok(visibleText(html).includes("The site costs about the same as 11 customers rented through Google Local Services Ads."));
  assert.match(html, /rented-customer">[^<]*<span class="badge">Estimate</, "no rentedCustomer assumption means it is labelled an estimate");
});

test("the pitch never uses Places data: a places-api rating fails the check, and the rating carries its dated line", () => {
  const lead = leadById("gm-auto-care");
  const html = render(lead);
  assert.ok(visibleText(html).includes("As listed when we checked on September 26, 2026."));
  assert.ok(!html.includes("place_id") && !html.includes("placeId"));
  const places = { ...lead, ratingSource: "places-api" };
  const check = checkPitchHtml(render(places), places);
  assert.equal(check.ok, false);
  assert.ok(check.errors.some((e) => /Places API/.test(e)));
  for (const source of ["google-maps-observed", "secondary", "owner", ""]) {
    const l = { ...lead, ratingSource: source };
    assert.equal(checkPitchHtml(render(l), l).ok, true, source);
  }
});

test("the pitch check refuses a doubled unit and any implied tie to Google", () => {
  const lead = leadById("gm-auto-care");
  const html = render(lead);
  assert.ok(checkPitchHtml(html.replace("</main>", "<p>$550 per per repair order</p></main>"), lead).errors.some((e) => /per per/.test(e)));
  assert.ok(checkPitchHtml(html.replace("</main>", "<p>A Google Partner studio</p></main>"), lead).errors.some((e) => /tie to Google/.test(e)));
  assert.equal(checkPitchHtml(html, lead).ok, true);
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
