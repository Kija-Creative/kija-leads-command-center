// Domain probe tests. Network is always injected: no DNS or HTTP leaves the process.

import { test } from "node:test";
import assert from "node:assert/strict";
import { candidateDomains, candidateLabels, cleanDomain, nameVariants } from "../src/discovery/domains.js";
import { detectParked, extractTitle, pageMentions, metaRefreshUrl } from "../src/discovery/parked.js";
import { probeBusiness } from "../src/discovery/probe.js";
import { main as probeMain } from "../src/cli/probe.js";
import { phoneDigits, formatPhone } from "../src/discovery/text.js";

const DASHES = /[\u2013\u2014]/;

function notFound() {
  return Promise.reject(Object.assign(new Error("getaddrinfo ENOTFOUND"), { code: "ENOTFOUND" }));
}

function fakeLookup(table) {
  const calls = [];
  const lookup = (host) => {
    calls.push(host);
    return table[host] ? Promise.resolve({ address: table[host], family: 4 }) : notFound();
  };
  return { lookup, calls };
}

// routes: { url: () => Response | throws }
function fakeFetch(routes) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    calls.push({ url, init });
    const route = routes[url];
    if (!route) throw Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNREFUSED" } });
    return route();
  };
  return { fetch, calls };
}

const html = (body, title = "") => `<!doctype html><html><head><title>${title}</title></head><body>${body}</body></html>`;

test("phone helpers keep US numbers only", () => {
  assert.equal(phoneDigits("(972) 681-4966"), "9726814966");
  assert.equal(phoneDigits("+1 972.681.4966"), "9726814966");
  assert.equal(phoneDigits("681-4966"), "");
  assert.equal(formatPhone("9726814966"), "972-681-4966");
});

test("candidate domains cover name variants, city, state and every TLD", () => {
  const domains = candidateDomains({ name: "GM AUTO CARE", city: "Dallas", state: "TX" });
  for (const d of [
    "gmautocare.com", "gmautocare.net", "gmautocare.biz", "gmautocare.us",
    "gmautocaredallas.com", "gmautocaretx.com", "gm-auto-care.com", "gmauto.com",
    "gmautocaredallastx.com",
  ]) {
    assert.ok(domains.includes(d), `expected ${d}`);
  }
  assert.equal(domains[0], "gmautocare.com", "the plain name on .com is checked first");
  assert.equal(new Set(domains).size, domains.length, "no duplicates");
  for (const d of domains) assert.match(d, /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.(com|net|biz|us)$/);
  // A two letter base is someone else's domain; it is never guessed.
  assert.ok(!domains.includes("gm.com"));
});

test("legal suffixes and generic words are both dropped and kept", () => {
  const septic = candidateDomains({ name: "Prime Time Septic Pumping, Inc.", city: "Terrell", state: "TX" });
  assert.ok(septic.includes("primetimesepticpumping.com"), "legal suffix dropped");
  assert.ok(septic.includes("primetimesepticpumpinginc.com"), "legal suffix kept");
  assert.ok(septic.includes("primetimeseptic.com"), "trailing generic word dropped");

  const als = candidateDomains({ name: "Al's Auto Repair Shop", city: "Dallas", state: "TX" });
  assert.ok(als.includes("alsautorepairshop.com"));
  assert.ok(als.includes("alsautorepair.com"), "shop dropped");
  assert.ok(als.includes("alautorepairshop.com"), "possessive without the s");
  assert.ok(als.includes("alsautorepairdallas.com"));
  assert.ok(!als.includes("als.com"), "too short to be a useful guess");

  const lr = candidateDomains({ name: "L & R Paint & Body Shop", city: "Dallas", state: "TX" });
  assert.ok(lr.includes("landrpaintandbodyshop.com"), "& spelled as and");
  assert.ok(lr.includes("lrpaintbodyshop.com"), "& dropped");

  const papas = candidateLabels({ name: "Papas and Ninos Bodyshop", city: "Dallas", state: "TX" });
  assert.ok(papas.primary.includes("papasandninos"));
  assert.ok(papas.primary.includes("papasninos"));
});

test("name variants start with the core name and cap is honored", () => {
  assert.deepEqual(nameVariants("The Parlor Barbershop")[0], ["parlor", "barbershop"]);
  assert.equal(candidateDomains({ name: "Al's Auto Repair Shop", city: "Dallas", state: "TX", max: 5 }).length, 5);
  assert.equal(cleanDomain("https://www.Example.com/path"), "example.com");
  assert.equal(cleanDomain("not a domain"), "");
});

test("page mentions find the phone in any common format and the name", () => {
  const phone = "972-681-4966";
  const name = "GM AUTO CARE";
  assert.deepEqual(pageMentions(html("Call (972) 681-4966 today"), { name, phone }), { mentionsPhone: true, mentionsName: false, mentionsCity: false });
  assert.equal(pageMentions(html("Serving Grand Prairie since the start"), { city: "Grand Prairie" }).mentionsCity, true);
  assert.equal(pageMentions(html("Serving Grand Rapids"), { city: "Grand Prairie" }).mentionsCity, false);
  assert.equal(pageMentions(html("<a href=\"tel:+19726814966\">Call</a>"), { phone }).mentionsPhone, true);
  assert.equal(pageMentions(html("972.681.4966"), { phone }).mentionsPhone, true);
  assert.equal(pageMentions(html("972-681-49661"), { phone }).mentionsPhone, false, "longer digit runs do not match");
  assert.equal(pageMentions(html("Welcome to GM Auto Care of Dallas"), { name }).mentionsName, true);
  assert.equal(pageMentions(html("<h1>GMAutoCare</h1>"), { name }).mentionsName, true);
  assert.equal(pageMentions(html("GM Auto Parts Warehouse"), { name }).mentionsName, false);
  assert.equal(pageMentions(html("L &amp; R Paint &amp; Body Shop"), { name: "L & R Paint & Body Shop" }).mentionsName, true);
});

test("parked detection flags parking hosts, sale phrases and landers, not real pages", () => {
  assert.equal(detectParked({ finalUrl: "https://www.sedoparking.com/gmautocare.net" }).parked, true);
  assert.equal(detectParked({ finalUrl: "https://gmautocare.net/", redirects: ["https://www.hugedomains.com/domain_profile.cfm?d=gmautocare.net"] }).parked, true);
  const sale = detectParked({ finalUrl: "https://x.com/", html: html("This domain is for sale. Make an offer.") });
  assert.equal(sale.parked, true);
  assert.equal(sale.reasons.length, 1, "overlapping phrases are reported once");
  assert.equal(detectParked({ finalUrl: "https://x.com/", html: "<script>window.location.href=\"/lander\"</script>" }).parked, true);
  assert.equal(detectParked({ finalUrl: "https://x.com/", html: html("<script src=\"https://img1.wsimg.com/parking-lander/static/js/main.js\"></script>") }).parked, true);
  assert.equal(detectParked({ finalUrl: "https://x.com/", html: html("Coming soon") }).parked, true, "thin placeholder");
  const real = html(`<h1>GM Auto Care</h1><p>${"Brakes, engines, diagnostics and more. ".repeat(60)}</p><p>Coming soon: Saturday hours.</p>`);
  assert.equal(detectParked({ finalUrl: "https://gmautocare.com/", html: real }).parked, false, "a real page that says coming soon is not parked");
  assert.equal(detectParked({ finalUrl: "https://gmautocare.com/", html: html("") }).parked, false, "empty pages may be JavaScript sites");
  assert.equal(extractTitle("<title> GM &amp; Sons </title>"), "GM & Sons");
  assert.equal(metaRefreshUrl("<meta http-equiv=\"refresh\" content=\"0;url=https://www.facebook.com/x\">", "https://a.com/"), "https://www.facebook.com/x");
});

test("probe reports owned, parked, third party and unrelated domains with GET only", async () => {
  const { lookup } = fakeLookup({
    "gmautocare.com": "203.0.113.10",
    "gmautocare.net": "203.0.113.11",
    "gmautocaretx.com": "203.0.113.12",
    "gmauto.com": "203.0.113.13",
  });
  const { fetch, calls } = fakeFetch({
    "https://gmautocare.com/": () => new Response(null, { status: 301, headers: { location: "https://www.gmautocare.com/" } }),
    "https://www.gmautocare.com/": () => new Response(html("<h1>GM Auto Care</h1><p>Call 972-681-4966</p>", "GM Auto Care | Dallas mechanic"), { status: 200 }),
    "https://gmautocare.net/": () => new Response(null, { status: 302, headers: { location: "https://www.sedoparking.com/gmautocare.net" } }),
    "https://gmautocaretx.com/": () => new Response(null, { status: 302, headers: { location: "https://www.facebook.com/gmautocare" } }),
    // HTTPS fails, HTTP answers.
    "http://gmauto.com/": () => new Response(html("GM Auto Parts Warehouse, open daily", "GM Auto Parts"), { status: 200 }),
  });

  const evidence = await probeBusiness({
    name: "GM AUTO CARE", city: "Dallas", state: "TX", phone: "972-681-4966", lookup, fetch, now: "2026-09-28T12:00:00Z",
  });

  assert.equal(evidence.verdict, "owned-domain-found");
  assert.equal(evidence.checkedAt, "2026-09-28");
  assert.equal(evidence.check.check, "domain probe");
  assert.equal(evidence.check.url, "https://www.gmautocare.com/");
  assert.match(evidence.check.result, /gmautocare\.com live and showing the business phone and name/);
  assert.equal(evidence.complete, true);

  const by = Object.fromEntries(evidence.findings.map((f) => [f.domain, f]));
  assert.equal(by["gmautocare.com"].classification, "live-phone-match");
  assert.equal(by["gmautocare.com"].title, "GM Auto Care | Dallas mechanic");
  assert.deepEqual(by["gmautocare.com"].redirects, ["https://www.gmautocare.com/"]);
  assert.equal(by["gmautocare.net"].classification, "parked");
  assert.equal(by["gmautocaretx.com"].classification, "third-party");
  assert.equal(by["gmautocaretx.com"].thirdParty, "facebook.com");
  assert.equal(by["gmauto.com"].classification, "live-unrelated");
  assert.equal(by["gmauto.com"].url, "http://gmauto.com/");
  assert.equal(evidence.counts.resolved, 4);
  assert.ok(evidence.unresolved.includes("gmautocare.biz"));

  // Only GET, no body, redirects handled by hand; parking and social hosts never fetched.
  for (const call of calls) {
    assert.equal(call.init.method, "GET");
    assert.equal(call.init.body, undefined);
    assert.equal(call.init.redirect, "manual");
  }
  assert.ok(!calls.some((c) => /sedoparking|facebook/.test(c.url)));
  assert.ok(!DASHES.test(JSON.stringify(evidence)));
});

test("probe says so plainly when nothing owned turns up", async () => {
  const { lookup } = fakeLookup({ "rioslusedtires.com": "203.0.113.20", "riosusedtires.com": "203.0.113.21" });
  const { fetch } = fakeFetch({
    "https://riosusedtires.com/": () => new Response(html("This domain may be for sale. Inquire about this domain."), { status: 200 }),
  });
  const evidence = await probeBusiness({ name: "Rios Used Tires", city: "Irving", state: "TX", phone: "972-871-7635", lookup, fetch, now: "2026-09-28" });
  assert.equal(evidence.verdict, "no-owned-domain-found");
  assert.equal(evidence.check.url, "");
  assert.match(evidence.check.result, /1 resolve/);
  assert.match(evidence.check.result, /1 look parked or for sale/);
  assert.match(evidence.check.result, /none shows the business phone or name/);
});

test("probe names a possible match when only the name appears", async () => {
  const { lookup } = fakeLookup({ "brownies.com": "203.0.113.30" });
  const { fetch } = fakeFetch({
    "https://brownies.com/": () => new Response(html(`<h1>Brownie's</h1><p>${"Fresh baked every morning. ".repeat(80)}</p>`), { status: 200 }),
  });
  const evidence = await probeBusiness({ name: "Brownie's", city: "Dallas", state: "TX", phone: "214-526-9207", lookup, fetch, now: "2026-09-28" });
  assert.equal(evidence.verdict, "possible-owned-domain");
  assert.match(evidence.check.result, /the page does not mention Dallas\. Open it and confirm/);
});

test("probe never runs more than four lookups at once", async () => {
  let inFlight = 0;
  let peak = 0;
  const lookup = async () => {
    inFlight++;
    peak = Math.max(peak, inFlight);
    await new Promise((r) => setTimeout(r, 5));
    inFlight--;
    throw Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" });
  };
  const evidence = await probeBusiness({ name: "Top Tier Auto Repair", city: "Dallas", state: "TX", lookup, fetch: async () => { throw new Error("no fetch expected"); }, now: "2026-09-28", maxCandidates: 12 });
  assert.ok(peak <= 4, `peak concurrency ${peak}`);
  assert.ok(peak >= 2, "work actually runs in parallel");
  assert.equal(evidence.unresolved.length, 12);
  assert.equal(evidence.verdict, "no-owned-domain-found");
});

test("probe stops at the total time limit and reports what it skipped", async () => {
  const hang = () => new Promise(() => {});
  const started = process.hrtime.bigint();
  const evidence = await probeBusiness({
    name: "Bee's Auto Body", city: "Dallas", state: "TX", lookup: hang, fetch: hang, now: "2026-09-28",
    totalTimeoutMs: 80, lookupTimeoutMs: 5000,
  });
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  assert.ok(ms < 2000, `finished in ${ms} ms`);
  assert.equal(evidence.complete, false);
  assert.equal(evidence.skipped.length, evidence.candidates);
  assert.match(evidence.check.result, /not checked before the 0\.1 second limit/);
});

test("probe CLI prints JSON evidence and rejects missing names", async () => {
  let printed = "";
  const stdout = { write: (s) => { printed += s; } };
  const stderr = { write: () => {} };
  const { lookup } = fakeLookup({});
  const code = await probeMain(
    ["--name", "Fenix Auto Body Shop", "--city", "Dallas", "--state", "tx", "--phone", "469-897-1144", "--extra", "fenixcollisiondfw.com", "--max", "8"],
    { lookup, fetch: async () => { throw new Error("unused"); }, stdout, stderr, now: "2026-09-28" },
  );
  assert.equal(code, 0);
  const evidence = JSON.parse(printed);
  assert.equal(evidence.business.state, "TX");
  assert.equal(evidence.candidates, 9, "8 guesses plus the extra domain");
  assert.equal(evidence.unresolved[0], "fenixcollisiondfw.com", "extra domains are checked first");
  assert.equal(evidence.check.check, "domain probe");

  assert.equal(await probeMain(["--city", "Dallas"], { stdout, stderr }), 2);
  assert.equal(await probeMain(["--name", "X", "--bogus"], { stdout, stderr }), 2);
});
