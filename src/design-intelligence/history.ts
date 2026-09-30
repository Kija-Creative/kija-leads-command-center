// Site DNA history: data/site-dna-history.json. Every selection, override, lock change and build
// is appended; entries are never edited. The only removal is the cap: when the file holds more
// than `cap` entries (never below 50) the oldest are dropped.
//
// Comparison order is stable on purpose. A lead is compared only with the latest DNA of each
// lead that first appeared in the history before it did, so regenerating any lead gives the same
// answer instead of reacting to leads that came after it.
import fs from "node:fs";
import path from "node:path";
import type { SiteDNA, SiteDnaRecord, ValidationResult } from "./schema.ts";
import { isPlainObject, PROJECT_ROOT, readJson, relative, toIso, writeJsonAtomic } from "./util.ts";

export const DEFAULT_HISTORY_FILE = path.join(PROJECT_ROOT, "data", "site-dna-history.json");
export const MIN_HISTORY_CAP = 50;
export const DEFAULT_HISTORY_CAP = 500;

export const HISTORY_EVENTS = ["select", "regenerate", "explore", "override", "lock", "unlock", "build"] as const;
export type HistoryEvent = (typeof HISTORY_EVENTS)[number];

export interface HistoryEntry {
  id: string;                  // `${leadId}@${recordedAt}`
  leadId: string;
  business: string;
  industry: string;
  archetype: string;
  fingerprint: string;
  event: HistoryEvent;
  variationScore: number;
  recordedAt: string;
  dna: SiteDNA;
}

export interface HistoryFile {
  version: 1;
  cap: number;
  note: string;
  entries: HistoryEntry[];
}

export const HISTORY_NOTE = "Append only. Written by the Design Intelligence Engine (npm run dna, npm run brief, the demo build). Never edit entries by hand; the oldest are dropped only past the cap.";

export function emptyHistory(cap = DEFAULT_HISTORY_CAP): HistoryFile {
  return { version: 1, cap: Math.max(MIN_HISTORY_CAP, cap), note: HISTORY_NOTE, entries: [] };
}

export function validateHistory(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isPlainObject(value)) return { ok: false, errors: ["The Site DNA history must be an object with version, cap and entries."], warnings: [] };
  if (value.version !== 1) errors.push("The Site DNA history version must be 1.");
  if (typeof value.cap !== "number" || value.cap < MIN_HISTORY_CAP) errors.push(`The Site DNA history cap must be a number of at least ${MIN_HISTORY_CAP}.`);
  if (!Array.isArray(value.entries)) errors.push("The Site DNA history entries must be a list.");
  else value.entries.forEach((e: unknown, i: number) => {
    if (!isPlainObject(e) || typeof e.leadId !== "string" || typeof e.recordedAt !== "string" || !isPlainObject(e.dna)) {
      errors.push(`Site DNA history entry ${i + 1} needs leadId, recordedAt and dna.`);
    } else if (!(HISTORY_EVENTS as readonly unknown[]).includes(e.event)) {
      errors.push(`Site DNA history entry ${i + 1} has the unknown event "${String(e.event)}".`);
    }
  });
  return { ok: errors.length === 0, errors, warnings: [] };
}

// Reads the history; a missing file is an empty history. A malformed file throws, because
// silently starting over would lose the variation record.
export function loadHistory(file: string = DEFAULT_HISTORY_FILE): HistoryFile {
  if (!fs.existsSync(file)) return emptyHistory();
  const read = readJson(file);
  if (!read.ok) throw new Error(read.error);
  const check = validateHistory(read.value);
  if (!check.ok) throw new Error(`${relative(file)}: ${check.errors.join(" ")}`);
  return read.value as HistoryFile;
}

export function saveHistory(file: string, history: HistoryFile): void {
  writeJsonAtomic(file, history);
}

// Appends one entry for the record and returns a new history (the input is not mutated).
export function appendHistory(history: HistoryFile, record: SiteDnaRecord, opts: { event: HistoryEvent; now: string | Date; cap?: number }): HistoryFile {
  const recordedAt = toIso(opts.now);
  const cap = Math.max(MIN_HISTORY_CAP, opts.cap ?? history.cap ?? DEFAULT_HISTORY_CAP);
  const entry: HistoryEntry = {
    id: `${record.leadId}@${recordedAt}`,
    leadId: record.leadId,
    business: record.business,
    industry: record.dna.industry,
    archetype: record.dna.archetype,
    fingerprint: record.fingerprint,
    event: opts.event,
    variationScore: record.variation.score,
    recordedAt,
    dna: record.dna,
  };
  const entries = [...history.entries, entry];
  return { version: 1, cap, note: history.note || HISTORY_NOTE, entries: entries.length > cap ? entries.slice(entries.length - cap) : entries };
}

// ---------------------------------------------------------------------------------------------
// The storage seam (v2: "a simple repository or storage abstraction; the comparison engine must
// NOT be tightly coupled to a JSON file"). Selection, the prompt builder and the audit take a
// HistorySource: a repository, a HistoryFile value or a plain list of entries, never a path. A
// database replaces the JSON file by implementing HistoryRepository; nothing else changes.
// ---------------------------------------------------------------------------------------------

export interface HistoryRepository {
  readonly kind: string;                      // "json-file", "memory", or a database's name
  append(record: SiteDnaRecord, opts: { event: HistoryEvent; now: string | Date }): HistoryEntry;
  all(): HistoryEntry[];                      // every entry, oldest first
  recent(n: number): HistoryEntry[];          // the latest n entries, oldest first
  byIndustry(industry: string, n?: number): HistoryEntry[];   // oldest first; the latest n when given
  byArchetype(archetype: string, n?: number): HistoryEntry[];
  latestPerLead(): HistoryEntry[];            // one entry per lead, ordered by first appearance
  snapshot(): HistoryFile;                    // the whole history as a value (a copy)
}

export type HistorySource = HistoryFile | HistoryRepository | readonly HistoryEntry[];

function lastN<T>(items: readonly T[], n?: number): T[] {
  if (n === undefined) return [...items];
  return n <= 0 ? [] : items.slice(-n);
}

function repositoryOver(kind: string, get: () => HistoryFile, set: (h: HistoryFile) => void): HistoryRepository {
  return {
    kind,
    append(record, opts) {
      const next = appendHistory(get(), record, opts);
      set(next);
      return next.entries[next.entries.length - 1];
    },
    all: () => [...get().entries],
    recent: (n) => lastN(get().entries, n),
    byIndustry: (industry, n) => lastN(queryHistory(get(), { industry }), n),
    byArchetype: (archetype, n) => lastN(queryHistory(get(), { archetype }), n),
    latestPerLead: () => latestPerLead(get()),
    snapshot: () => structuredClone(get()),
  };
}

// In memory, for tests and dry runs. Starts from a copy of `initial` (a HistoryFile or entries).
export function memoryHistoryRepository(initial: HistoryFile | readonly HistoryEntry[] = emptyHistory(), cap = DEFAULT_HISTORY_CAP): HistoryRepository {
  let state: HistoryFile = Array.isArray(initial)
    ? { ...emptyHistory(cap), entries: structuredClone([...initial]) }
    : structuredClone(initial as HistoryFile);
  return repositoryOver("memory", () => state, (h) => {
    state = h;
  });
}

// data/site-dna-history.json. Reads the file once, writes it atomically on every append, so a
// crash never leaves a half written history and the cap (at least 50) is enforced on disk.
export function jsonHistoryRepository(file: string = DEFAULT_HISTORY_FILE): HistoryRepository {
  let state: HistoryFile | null = null;
  const get = () => {
    if (!state) state = loadHistory(file);
    return state;
  };
  return repositoryOver("json-file", get, (h) => {
    saveHistory(file, h);
    state = h;
  });
}

function isRepository(value: unknown): value is HistoryRepository {
  return isPlainObject(value) && typeof value.all === "function" && typeof value.append === "function" && typeof value.snapshot === "function";
}

// Any history source as a HistoryFile value. A path is refused on purpose.
export function toHistoryFile(source: HistorySource | null | undefined): HistoryFile {
  if (source === null || source === undefined) return emptyHistory();
  if (typeof source === "string") throw new TypeError("The comparison engine takes a HistoryRepository, a HistoryFile or a list of entries, never a file path. Use jsonHistoryRepository(file).");
  if (Array.isArray(source)) return { ...emptyHistory(), entries: [...(source as readonly HistoryEntry[])] };
  if (isRepository(source)) return source.snapshot();
  return source as HistoryFile;
}

export function historyEntries(source: HistorySource | null | undefined): HistoryEntry[] {
  return [...toHistoryFile(source).entries];
}

export interface HistoryQuery {
  industry?: string;
  archetype?: string;
  leadId?: string;
}

// All entries, or those matching industry, archetype and lead, oldest first.
export function queryHistory(history: HistoryFile, q: HistoryQuery = {}): HistoryEntry[] {
  return history.entries.filter((e) =>
    (!q.industry || e.industry === q.industry) &&
    (!q.archetype || e.archetype === q.archetype) &&
    (!q.leadId || e.leadId === q.leadId));
}

// The latest entry of each lead, ordered by when each lead first appeared.
export function latestPerLead(history: HistoryFile): HistoryEntry[] {
  const first = new Map<string, number>();
  const latest = new Map<string, HistoryEntry>();
  history.entries.forEach((e, i) => {
    if (!first.has(e.leadId)) first.set(e.leadId, i);
    latest.set(e.leadId, e);
  });
  return [...latest.values()].sort((a, b) => (first.get(a.leadId) ?? 0) - (first.get(b.leadId) ?? 0));
}

export function latestForLead(history: HistoryFile, leadId: string): HistoryEntry | null {
  for (let i = history.entries.length - 1; i >= 0; i -= 1) {
    if (history.entries[i].leadId === leadId) return history.entries[i];
  }
  return null;
}

export interface ComparisonPool {
  predecessors: HistoryEntry[];  // latest DNA of each lead that appeared before this one, in order
  others: SiteDNA[];             // every DNA of every other lead, for duplicate prevention
}

export function comparisonPool(history: HistoryFile, leadId: string): ComparisonPool {
  const latest = latestPerLead(history);
  const position = latest.findIndex((e) => e.leadId === leadId);
  const predecessors = position >= 0 ? latest.slice(0, position) : latest;
  const others = history.entries.filter((e) => e.leadId !== leadId).map((e) => e.dna);
  return { predecessors, others };
}

// v2 comparison windows. The global window is the last `lookback` sites of any industry; the
// industry window is the last `industryLookback` sites of the same industry, kept in the
// comparison even when they are older than the global window, and held to the stricter same
// industry bar (variation.ts SAME_INDUSTRY_MIN_DIFFERING).
export const DEFAULT_LOOKBACK = 8;
export const DEFAULT_INDUSTRY_LOOKBACK = 4;

export interface ComparisonWindows {
  set: HistoryEntry[];           // global and industry windows together, oldest first, no repeats
  global: HistoryEntry[];
  sameIndustry: HistoryEntry[];
}

export function comparisonWindows(predecessors: readonly HistoryEntry[], industry: string, lookback = DEFAULT_LOOKBACK, industryLookback = DEFAULT_INDUSTRY_LOOKBACK): ComparisonWindows {
  const global = lookback > 0 ? predecessors.slice(-lookback) : [];
  const sameIndustry = industryLookback > 0 ? predecessors.filter((e) => e.industry === industry).slice(-industryLookback) : [];
  const keep = new Set([...global, ...sameIndustry]);
  return { set: predecessors.filter((e) => keep.has(e)), global, sameIndustry };
}

// The comparison set alone (both windows), oldest first, the most recent site last.
export function comparisonSet(predecessors: readonly HistoryEntry[], industry: string, lookback = DEFAULT_LOOKBACK, industryLookback = DEFAULT_INDUSTRY_LOOKBACK): HistoryEntry[] {
  return comparisonWindows(predecessors, industry, lookback, industryLookback).set;
}
