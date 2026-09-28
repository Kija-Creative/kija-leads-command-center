// Week identity and the weekly rotation plan. Pure: callers pass now.

import { dedupeKey, nameStateKey, phoneDigits } from "./normalize.js";

const DAY_MS = 86400000;
const REQUIRED_VERTICALS = ["auto", "home-services", "contractor"];

// The calendar date (YYYY-MM-DD) that now refers to. An ISO string keeps its own date part,
// so "2026-09-28T23:30:00-05:00" is still the 28th; a Date uses the local calendar.
export function dateOf(now) {
  if (typeof now === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(now.trim());
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const d = new Date(now);
    if (!Number.isNaN(d.getTime())) return dateOf(d);
  } else if (now instanceof Date && !Number.isNaN(now.getTime())) {
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, "0");
    const da = String(now.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }
  throw new TypeError(`Cannot read a date from ${JSON.stringify(now)}.`);
}

function utcMs(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function runIdFor(now) {
  const ms = utcMs(dateOf(now));
  const dow = new Date(ms).getUTCDay(); // 0 Sunday
  const back = (dow + 6) % 7; // days since Monday
  return fromUtcMs(ms - back * DAY_MS);
}

export function isoWeek(dateString) {
  const ms = utcMs(dateOf(dateString));
  const dow = new Date(ms).getUTCDay() || 7;
  // The Thursday of this ISO week decides the ISO year.
  const thursday = new Date(ms + (4 - dow) * DAY_MS);
  const year = thursday.getUTCFullYear();
  const week = Math.ceil(((thursday.getTime() - Date.UTC(year, 0, 1)) / DAY_MS + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// Whole weeks from the rotation start Monday to the Monday of now. Negative before the start.
export function weekIndex(now, rotationStart) {
  const start = utcMs(runIdFor(rotationStart));
  const current = utcMs(runIdFor(now));
  return Math.floor((current - start) / (7 * DAY_MS));
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function windowAt(list, index, size) {
  if (list.length === 0 || size <= 0) return [];
  const count = Math.min(size, list.length);
  const start = mod(index * count, list.length);
  const out = [];
  for (let i = 0; i < count; i += 1) out.push(list[(start + i) % list.length]);
  return out;
}

// Round robin by vertical so a window of six naturally mixes auto, home services,
// contractors and personal care instead of six auto categories in a row.
export function categoryRotationOrder(categories) {
  const byVertical = new Map();
  for (const [key, c] of Object.entries(categories ?? {})) {
    if (key === "general") continue;
    const v = c?.vertical ?? "general";
    if (!byVertical.has(v)) byVertical.set(v, []);
    byVertical.get(v).push(key);
  }
  const verticalOrder = [...REQUIRED_VERTICALS, "personal-care"].filter((v) => byVertical.has(v));
  for (const v of byVertical.keys()) if (!verticalOrder.includes(v)) verticalOrder.push(v);
  const out = [];
  let added = true;
  for (let round = 0; added; round += 1) {
    added = false;
    for (const v of verticalOrder) {
      const keys = byVertical.get(v);
      if (round < keys.length) {
        out.push(keys[round]);
        added = true;
      }
    }
  }
  return out;
}

function pickCategories(categories, index, perWeek) {
  const order = categoryRotationOrder(categories);
  const chosen = windowAt(order, index, perWeek);
  if (chosen.length === 0) return chosen;
  const verticalOf = (k) => categories[k]?.vertical;
  const count = Math.min(perWeek, order.length);
  const start = mod(index * count, order.length);
  for (const v of REQUIRED_VERTICALS) {
    if (chosen.some((k) => verticalOf(k) === v)) continue;
    // Next category of the missing vertical after this window, in rotation order.
    let replacement = null;
    for (let i = 0; i < order.length && !replacement; i += 1) {
      const k = order[(start + count + i) % order.length];
      if (verticalOf(k) === v && !chosen.includes(k)) replacement = k;
    }
    if (!replacement) continue;
    // Drop from the end: first anything outside the required verticals, then a repeat vertical.
    const counts = (k) => chosen.filter((c) => verticalOf(c) === verticalOf(k)).length;
    let drop = -1;
    for (let i = chosen.length - 1; i >= 0 && drop < 0; i -= 1) {
      if (!REQUIRED_VERTICALS.includes(verticalOf(chosen[i]))) drop = i;
    }
    for (let i = chosen.length - 1; i >= 0 && drop < 0; i -= 1) {
      if (counts(chosen[i]) > 1) drop = i;
    }
    if (drop >= 0) chosen[drop] = replacement;
  }
  return chosen;
}

function knownBusinesses({ leads, queue, rejected }) {
  const keys = new Set();
  const names = [];
  const add = (record, business, where) => {
    if (!business && !record.key) return;
    if (business) {
      keys.add(dedupeKey({ business, city: record.city, state: record.state, phone: record.phone }));
      keys.add(nameStateKey({ business, state: record.state }));
    }
    if (record.key) keys.add(record.key);
    const digits = phoneDigits(record.phone);
    if (digits) keys.add(digits);
    if (business) {
      const place = [record.city, record.state].filter(Boolean).join(", ");
      names.push(`${business}${place ? `, ${place}` : ""} (${where})`);
    }
  };
  for (const l of leads ?? []) add(l, l.business, "lead");
  for (const q of queue ?? []) add(q, q.candidate ?? q.business, "queue");
  for (const r of rejected ?? []) add(r, r.business, "rejected");
  return { keys: [...keys].sort(), names: names.sort((a, b) => a.localeCompare(b)) };
}

export function planWeek({ now, settings, geography, categories, leads, queue, rejected } = {}) {
  const runId = runIdFor(now);
  const geo = settings?.geography ?? {};
  const index = weekIndex(runId, geo.rotationStart ?? runId);
  const metros = geography?.metros ?? [];
  const homeKey = geo.homeMetro ?? "";
  const home = metros.find((m) => m.key === homeKey) ?? null;
  const others = metros.filter((m) => m.key !== homeKey);

  let chosenMetros = [];
  if (geo.mode === "home-only") {
    chosenMetros = home ? [home] : [];
  } else {
    // The window advances by its own width each week, so consecutive weeks do not overlap.
    chosenMetros = windowAt(others, index, geo.metrosPerWeek ?? 4);
    if (geo.homeEveryWeek !== false && home) chosenMetros = [home, ...chosenMetros];
  }

  const chosenCategories = pickCategories(categories ?? {}, index, settings?.categoriesPerWeek ?? 6);
  const known = knownBusinesses({ leads, queue, rejected });

  return {
    runId,
    week: isoWeek(runId),
    weekIndex: index,
    metros: chosenMetros,
    categories: chosenCategories,
    quota: settings?.weeklyQuota ?? 10,
    homeMetro: homeKey,
    homeMaxLeads: geo.homeMaxLeads ?? null,
    exclusions: known.keys,
    excludedBusinesses: known.names,
  };
}
