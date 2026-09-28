import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  dedupeKey, hostname, isChain, nameStateKey, normalizeName, normalizePhone, phoneDigits, sameBusiness, slugify,
} from "../src/lib/normalize.js";

const chains = JSON.parse(fs.readFileSync(new URL("../config/chains.json", import.meta.url), "utf8"));
const seed = JSON.parse(fs.readFileSync(new URL("../seed/sheet-2026-09-28.json", import.meta.url), "utf8"));

test("slugify makes stable lowercase ascii ids", () => {
  assert.equal(slugify("GM AUTO CARE Dallas TX"), "gm-auto-care-dallas-tx");
  assert.equal(slugify("Al's Auto Repair Shop Dallas TX"), "als-auto-repair-shop-dallas-tx");
  assert.equal(slugify("24/7 Diesel Repair & Road Service Dallas TX"), "24-7-diesel-repair-road-service-dallas-tx");
  assert.equal(slugify("Prime Time Septic Pumping, Inc. Terrell TX"), "prime-time-septic-pumping-inc-terrell-tx");
  assert.equal(slugify(`Pe${String.fromCharCode(0xf1)}a Caf${String.fromCharCode(0xe9)}`), "pena-cafe");
  assert.equal(slugify(`Brownie${String.fromCharCode(0x2019)}s`), "brownies");
  assert.equal(slugify("  --Hello, World!--  "), "hello-world");
  assert.equal(slugify(""), "");
  assert.equal(slugify(null), "");
});

test("normalizePhone returns NNN-NNN-NNNN or empty", () => {
  assert.equal(normalizePhone("(214) 946-4100"), "214-946-4100");
  assert.equal(normalizePhone("+1 214.946.4100"), "214-946-4100");
  assert.equal(normalizePhone("2149464100"), "214-946-4100");
  assert.equal(normalizePhone("1-214-946-4100"), "214-946-4100");
  assert.equal(normalizePhone("214-946-4100 ext 12"), "214-946-4100");
  assert.equal(normalizePhone("214 946 4100 x5"), "214-946-4100");
  assert.equal(normalizePhone(2149464100), "214-946-4100");
  assert.equal(normalizePhone("946-4100"), "");
  assert.equal(normalizePhone("014-946-4100"), "", "area codes never start with 0");
  assert.equal(normalizePhone("214-146-4100"), "", "exchanges never start with 1");
  assert.equal(normalizePhone("call us"), "");
  assert.equal(normalizePhone(""), "");
  assert.equal(normalizePhone(undefined), "");
  assert.equal(phoneDigits("(972) 681-4966"), "9726814966");
});

test("normalizeName folds case, punctuation, ampersands and legal suffixes", () => {
  assert.equal(normalizeName("Prime Time Septic Pumping, Inc."), "prime time septic pumping");
  assert.equal(normalizeName("L & R Paint & Body Shop"), "l and r paint and body shop");
  assert.equal(normalizeName("L&R Paint and Body Shop"), "l and r paint and body shop");
  assert.equal(normalizeName("The Parlor Barbershop"), "parlor barbershop");
  assert.equal(normalizeName("Brownie's"), "brownies");
  assert.equal(normalizeName("A & B Muffler Co."), "a and b muffler");
  assert.equal(normalizeName("Smith Roofing LLC"), "smith roofing");
  assert.equal(normalizeName("Acme Ltd"), "acme");
  assert.equal(normalizeName("  MOST   FAMOUS   CUTZ "), "most famous cutz");
});

test("dedupeKey uses phone digits, else name and state", () => {
  assert.equal(dedupeKey({ business: "GM AUTO CARE", city: "Dallas", state: "TX", phone: "972-681-4966" }), "9726814966");
  assert.equal(dedupeKey({ business: "GM Auto Care, LLC", city: "Dallas", state: "tx", phone: "" }), "gm auto care|TX");
  assert.equal(dedupeKey({ business: "GM Auto Care", state: "TX", phone: "not a phone" }), "gm auto care|TX");
  assert.equal(nameStateKey({ business: "The Parlor Barbershop", state: "TX" }), "parlor barbershop|TX");
});

test("sameBusiness matches on phone digits or on name plus state", () => {
  const a = { business: "Bee's Auto Body", state: "TX", phone: "214-388-3888" };
  assert.ok(sameBusiness(a, { business: "Bees Collision", state: "TX", phone: "(214) 388-3888" }), "phone match");
  assert.ok(sameBusiness(a, { business: "BEES AUTO BODY", state: "TX", phone: "214-000-0000" }), "name and state match");
  assert.ok(!sameBusiness(a, { business: "Bee's Auto Body", state: "OK", phone: "405-555-0100" }), "same name in another state");
  assert.ok(sameBusiness({ candidate: "L & R Paint & Body Shop", state: "TX" }, { business: "L&R Paint and Body Shop", state: "TX" }));
  assert.ok(!sameBusiness(a, null));
});

test("isChain matches normalized chain names and avoids obvious false positives", () => {
  assert.deepEqual(isChain("Midas Auto Service Experts", chains), { chain: true, match: "Midas" });
  assert.equal(isChain("MEINEKE CAR CARE CENTER #123", chains).match, "Meineke");
  assert.equal(isChain("Mr. Rooter Plumbing of Dallas", chains).chain, true);
  assert.equal(isChain("Roto Rooter Plumbing and Water Cleanup", chains).match, "Roto-Rooter");
  assert.equal(isChain("One Hour Heating & Air Conditioning of Plano", chains).chain, true);
  assert.equal(isChain("Dallas Benjamin Franklin Plumbing", chains).chain, true, "long names match anywhere");
  assert.equal(isChain("Caliber Collision", chains).chain, true);
  assert.equal(isChain("GREAT CLIPS", chains).chain, true);
  assert.equal(isChain("Quick Fix Auto", chains).chain, false, "short chain names only match as a prefix");
  assert.equal(isChain("Midtown Auto Repair", chains).chain, false, "whole words only");
  assert.deepEqual(isChain("", chains), { chain: false, match: "" });
  assert.equal(isChain("Midas Touch Detailing", { names: ["Midas"], allow: ["Midas Touch Detailing"] }).chain, false, "allow list wins");
  assert.equal(isChain("Jiffy Lube", ["Jiffy Lube"]).chain, true, "a plain array works too");
});

test("no seed lead or queue item is flagged as a chain", () => {
  for (const l of seed.leads) assert.equal(isChain(l.business, chains).chain, false, l.business);
  for (const q of seed.queue) assert.equal(isChain(q.candidate, chains).chain, false, q.candidate);
});

test("hostname extracts a bare host", () => {
  assert.equal(hostname("https://www.bbb.org/us/tx/dallas/profile/x"), "bbb.org");
  assert.equal(hostname("https://reviews.birdeye.com/papas-and-ninos-bodyshop-166619692947680"), "reviews.birdeye.com");
  assert.equal(hostname("maps.apple.com/place?place-id=1"), "maps.apple.com");
  assert.equal(hostname("not a url"), "");
  assert.equal(hostname(""), "");
});
