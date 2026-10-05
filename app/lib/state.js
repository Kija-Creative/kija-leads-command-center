// Client side copy of /api/state. Loaded once, then patched from each mutation's response
// so the page never refetches everything after a small change.

import { api } from "./api.js";

export const OUTREACH_STATUSES = ["New", "Research", "Demo Built", "Contacted", "Replied", "Meeting", "Won", "Lost", "Not a fit"];
// The sheet dashboard's seven stages; the last two are closed outcomes.
export const SHEET_STAGES = OUTREACH_STATUSES.slice(0, 7);
export const OWNERS = ["", "Jamey", "Kiel", "Max", "Kyia"];

// Display names for the stored keys above.
export const TEAM_NAMES = { Jamey: "Jamey White", Kiel: "Kiel Jared", Max: "Max Miller", Kyia: "Kyia Brocken" };
export const teamName = (key) => TEAM_NAMES[key] || key || "";
export const CONFIDENCE_LEVELS = ["High", "Medium-High", "Medium", "Low"];
export const MANUAL_HISTORY_TYPES = ["note", "call", "email", "meeting", "research", "demo", "consent"];
// "mobile" may be a personal cell, which the FCC can treat as residential.
export const PHONE_LINE_TYPES = [
  ["unknown", "Not known yet"],
  ["landline", "Business landline"],
  ["mobile", "Mobile"],
  ["voip", "VoIP"],
];

// Who is signed in; null while logins are off.
export const session = { user: null, authEnabled: false };
export const isAdmin = () => !session.authEnabled || session.user?.role === "admin";

export const store = {
  data: null,
  loadedAt: null,
  error: null,
  // Last list order the person looked at, for j and k on the detail view.
  order: [],
  selectedId: null,
};

const listeners = new Set();

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(reason) {
  for (const fn of listeners) fn(reason);
}

// quiet: refresh the data without re-rendering the current view (the header still updates).
export async function loadState({ quiet = false } = {}) {
  const res = await api.state();
  if (!res.ok || !Array.isArray(res.leads)) {
    store.error = res.errors?.[0] ?? "The data could not be loaded.";
    emit("error");
    return false;
  }
  store.data = res;
  store.error = null;
  store.loadedAt = new Date();
  emit(quiet ? "refresh" : "load");
  return true;
}

export function leads() {
  return store.data?.leads ?? [];
}

export function leadById(id) {
  return leads().find((l) => l.id === id) ?? null;
}

export function putLead(view) {
  if (!view || !store.data) return;
  const list = store.data.leads;
  const idx = list.findIndex((l) => l.id === view.id);
  if (idx >= 0) list[idx] = view;
  else list.push(view);
  emit("lead");
}

export function removeQueueItem(id) {
  if (!store.data) return;
  store.data.queue = store.data.queue.filter((q) => q.id !== id);
  emit("queue");
}

export function putQueueItem(item) {
  if (!store.data || !item) return;
  const idx = store.data.queue.findIndex((q) => q.id === item.id);
  if (idx >= 0) store.data.queue[idx] = item;
  emit("queue");
}

export function setSettings(settings) {
  if (!store.data || !settings) return;
  store.data.settings = settings;
  emit("settings");
}

// Team notes, newest first as the server sends them.
export function notes() {
  return Array.isArray(store.data?.notes) ? store.data.notes : [];
}

// Every notes route answers with the whole list, so the copy is replaced, not patched.
export function setNotes(list) {
  if (!store.data || !Array.isArray(list)) return;
  store.data.notes = list;
  emit("notes");
}

export function latestRun() {
  return store.data?.runs?.[0] ?? null;
}

export function stageCounts(list = leads()) {
  const counts = Object.fromEntries(OUTREACH_STATUSES.map((s) => [s, 0]));
  for (const l of list) {
    const s = l.outreach?.status;
    if (s in counts) counts[s] += 1;
  }
  return counts;
}

export function categoryLabel(key) {
  return store.data?.categories?.[key]?.label ?? key;
}

export function metroName(key) {
  const m = store.data?.geography?.metros?.find((x) => x.key === key || x.name === key);
  return m?.name ?? key;
}

export function byScore(a, b) {
  return (b.score?.total ?? 0) - (a.score?.total ?? 0) || String(a.business).localeCompare(String(b.business));
}
