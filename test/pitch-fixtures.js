// Shared fixtures for the pitch tests: seed leads, config, placeholder benchmarks
// and a fuller, sourced benchmark set. Read only; nothing here touches data/.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { placeholderBenchmarks, seedToData } from "../src/lib/seed.js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const NOW = "2026-09-28T12:00:00.000Z";

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

export const SEED = readJson("seed/sheet-2026-09-28.json");
export const CATEGORIES = readJson("config/categories.json");
export const BASE_SETTINGS = readJson("config/settings.json");
export const LEADS = seedToData(SEED, { now: NOW }).leads;

export function settingsWith(offer = {}, contact = {}) {
  const s = structuredClone(BASE_SETTINGS);
  s.offer = { ...s.offer, price: 2500, priceConfirmed: false, ...offer };
  s.contact = { ...s.contact, ...contact };
  return s;
}

export function leadById(prefix) {
  const lead = LEADS.find((l) => l.id.startsWith(prefix));
  if (!lead) throw new Error(`No seed lead starts with ${prefix}`);
  return structuredClone(lead);
}

export const PLACEHOLDER = placeholderBenchmarks(CATEGORIES, { updatedAt: "2026-09-28" });

// A fuller benchmark set with sources, consumer stats in every state, a rented
// lead cost and a website market line.
export function fullBenchmarks() {
  const b = structuredClone(PLACEHOLDER);
  b.categories["auto-repair"] = {
    ticket: { low: 150, typical: 550, high: 1500, unit: "repair order", sources: [{ title: "Fixture Shop Survey", url: "https://example.org/shop-survey", year: 2025, note: "" }] },
    grossMargin: { typical: 0.5, sources: [{ title: "Fixture Margin Study", url: "https://example.org/margins", year: 2024, note: "" }] },
    rentedLead: { low: 40, high: 80, platform: "a lead marketplace", sources: [{ title: "Fixture Lead Prices", url: "https://example.org/lead-prices", year: 2025 }] },
    notes: "",
  };
  b.consumerStats = [
    { id: "s1", claim: "of shoppers read reviews before choosing a local business", value: "87%", year: 2025, source: "Fixture Consumer Survey", url: "https://example.org/consumer", verified: true, useInPitch: true, notes: "" },
    { id: "s2", claim: "of searchers visit a business website before calling", value: "56%", year: 2024, source: "Fixture Search Study", url: "https://example.org/search", verified: true, useInPitch: true, notes: "" },
    { id: "s3", claim: "UNVERIFIED STAT should never render", value: "99%", year: 2025, source: "Nobody", url: "", verified: false, useInPitch: true, notes: "" },
    { id: "s4", claim: "NOT FOR PITCH stat should never render", value: "98%", year: 2025, source: "Somebody", url: "", verified: true, useInPitch: false, notes: "" },
    { id: "s5", claim: "of people compare two or more businesses", value: "64%", year: 2023, source: "Fixture Compare Study", url: "https://example.org/compare", verified: true, useInPitch: true, notes: "" },
    { id: "s6", claim: "FOURTH APPROVED stat is over the limit", value: "12%", year: 2023, source: "Fixture Extra", url: "https://example.org/extra", verified: true, useInPitch: true, notes: "" },
  ];
  b.websiteMarket = {
    freelancer: { low: 1000, high: 5000 },
    agency: { low: 5000, high: 25000 },
    subscription: { lowMonthly: 100, highMonthly: 400 },
    sources: [{ title: "Fixture Market Report", url: "https://example.org/market", year: 2025 }],
  };
  return b;
}

// Both dash characters, built from char codes so this file never contains them.
export const DASHES = [String.fromCharCode(0x2014), String.fromCharCode(0x2013)];

export function hasDash(text) {
  return DASHES.some((d) => String(text).includes(d)) || /&(?:mdash|ndash);|&#821[12];/i.test(String(text));
}

export function visibleText(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ");
}
