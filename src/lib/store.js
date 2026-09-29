// File IO for the data and config JSON. The only lib module that touches disk.
// Writes are atomic (temp file then rename) and back up the previous version first.
// Every call reads fresh from disk, because the weekly run writes from another process.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { RETIRED_LEAD_FIELDS } from "./validate.js";

export const FILES = {
  settings: "config/settings.json",
  categories: "config/categories.json",
  geography: "config/geography.json",
  chains: "config/chains.json",
  leads: "data/leads.json",
  queue: "data/queue.json",
  rejected: "data/rejected.json",
  benchmarks: "data/benchmarks.json",
  suppression: "data/suppression.json",
  notes: "data/notes.json",
};

export const BACKUP_DIR = "data/backups";
export const RUNS_DIR = "data/runs";
export const INBOX_DIR = "data/inbox";
export const BACKUPS_KEPT = 30;

// What load() returns for benchmarks before research has written the file.
export function emptyBenchmarks() {
  return { updatedAt: "", consumerStats: [], categories: {}, websiteMarket: null, notes: "Placeholder, not researched" };
}

const OPTIONAL = {
  geography: () => ({ metros: [] }),
  chains: () => ({ names: [], allow: [] }),
  leads: () => [],
  queue: () => [],
  rejected: () => [],
  benchmarks: emptyBenchmarks,
  suppression: () => [],
  notes: () => [],
};

export { RETIRED_LEAD_FIELDS };

export function stripRetired(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return record;
  if (!RETIRED_LEAD_FIELDS.some((f) => Object.hasOwn(record, f))) return record;
  const out = { ...record };
  for (const f of RETIRED_LEAD_FIELDS) delete out[f];
  return out;
}

function stripQueueItem(item) {
  const next = stripRetired(item);
  if (next?.lead && typeof next.lead === "object") {
    const lead = stripRetired(next.lead);
    return lead === next.lead ? next : { ...next, lead };
  }
  return next;
}

export const CANDIDATES_SUFFIX = ".candidates.json";
// An interrupted discovery write leaves <name>.candidates.json.tmp, which holds Places content too.
const CANDIDATES_TMP_SUFFIX = `${CANDIDATES_SUFFIX}.tmp`;

function isCandidatesName(name) {
  return name.endsWith(CANDIDATES_SUFFIX) || name.endsWith(CANDIDATES_TMP_SUFFIX);
}

// Age in days of a discovery candidates file: its own fetchedAt when readable, else the file time.
export function candidateFileAgeDays(file, now) {
  const at = Date.parse(file?.fetchedAt ?? "");
  const from = Number.isNaN(at) ? file?.mtimeMs : at;
  const t = (now instanceof Date ? now : new Date(now)).getTime();
  if (typeof from !== "number" || Number.isNaN(from) || Number.isNaN(t)) return Infinity;
  return (t - from) / 86400000;
}

const STAMP_RE = "(\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z)(?:-(\\d+))?";

function escapeRe(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Windows can briefly lock a file (antivirus, an editor, another reader); retry the rename.
function renameWithRetry(from, to) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      fs.renameSync(from, to);
      return;
    } catch (err) {
      if (attempt >= 10 || !["EPERM", "EACCES", "EBUSY"].includes(err.code)) {
        try {
          fs.rmSync(from, { force: true });
        } catch {
          // leave the temp file; *.tmp is gitignored
        }
        throw err;
      }
      sleepSync(25 * (attempt + 1));
    }
  }
}

function backupName(rel) {
  return rel.replace(/\\/g, "/").replace(/^(data|config)\//, "").replace(/\.json$/i, "").replace(/\//g, "-");
}

function byAddedThenId(a, b) {
  return String(a?.addedAt ?? "").localeCompare(String(b?.addedAt ?? "")) || String(a?.id ?? "").localeCompare(String(b?.id ?? ""));
}

function byAddedThenKey(a, b) {
  return String(a?.addedAt ?? "").localeCompare(String(b?.addedAt ?? "")) || String(a?.key ?? "").localeCompare(String(b?.key ?? ""));
}

// Team notes are kept oldest first in the file; the API serves them newest first.
function byCreatedThenId(a, b) {
  return String(a?.createdAt ?? "").localeCompare(String(b?.createdAt ?? "")) || String(a?.id ?? "").localeCompare(String(b?.id ?? ""));
}

function byRejectedThenKey(a, b) {
  return String(a?.rejectedAt ?? "").localeCompare(String(b?.rejectedAt ?? "")) || String(a?.key ?? "").localeCompare(String(b?.key ?? ""));
}

export function createStore(rootDir, { now = () => new Date(), keepBackups = BACKUPS_KEPT } = {}) {
  const root = path.resolve(rootDir);
  const abs = (rel) => {
    const file = path.resolve(root, rel);
    if (file !== root && !file.startsWith(root + path.sep)) throw new Error(`Refusing to touch ${rel}: it is outside the project.`);
    return file;
  };

  function readJson(rel, fallback) {
    const file = abs(rel);
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch (err) {
      if (err.code === "ENOENT" && fallback !== undefined) return typeof fallback === "function" ? fallback() : structuredClone(fallback);
      if (err.code === "ENOENT") {
        const hint = rel.startsWith("data/") ? "Run npm run seed, or restore it from data/backups." : "Restore it from git or data/backups.";
        throw new Error(`${rel} is missing. ${hint}`);
      }
      throw new Error(`Cannot read ${rel}: ${err.message}`);
    }
    try {
      return JSON.parse(text.replace(/^\ufeff/, ""));
    } catch (err) {
      throw new Error(`${rel} is not valid JSON: ${err.message}`);
    }
  }

  function pruneBackups(name) {
    const dir = abs(BACKUP_DIR);
    const re = new RegExp(`^${escapeRe(name)}-${STAMP_RE}\\.json$`);
    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return;
    }
    const mine = entries
      .map((f) => ({ f, m: re.exec(f) }))
      .filter((x) => x.m)
      .sort((a, b) => a.m[1].localeCompare(b.m[1]) || Number(a.m[2] ?? 0) - Number(b.m[2] ?? 0));
    for (const { f } of mine.slice(0, Math.max(0, mine.length - keepBackups))) {
      fs.rmSync(path.join(dir, f), { force: true });
    }
  }

  function backup(rel) {
    const name = backupName(rel);
    const dir = abs(BACKUP_DIR);
    fs.mkdirSync(dir, { recursive: true });
    const stamp = now().toISOString().replace(/[:.]/g, "-");
    let target = path.join(dir, `${name}-${stamp}.json`);
    for (let n = 1; fs.existsSync(target); n += 1) target = path.join(dir, `${name}-${stamp}-${n}.json`);
    fs.copyFileSync(abs(rel), target);
    pruneBackups(name);
    return target;
  }

  // Returns { written, path, backup }. Identical content is not rewritten, so repeated
  // idempotent runs do not churn backups.
  function writeJson(rel, value, { backup: keepBackup = true } = {}) {
    const file = abs(rel);
    const text = `${JSON.stringify(value, null, 2)}\n`;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    let previous = null;
    try {
      previous = fs.readFileSync(file, "utf8");
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    if (previous === text) return { written: false, path: file, backup: null };
    const backupPath = previous !== null && keepBackup ? backup(rel) : null;
    const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
    fs.writeFileSync(tmp, text, "utf8");
    renameWithRetry(tmp, file);
    return { written: true, path: file, backup: backupPath };
  }

  function requireArray(value, what) {
    if (!Array.isArray(value)) throw new TypeError(`${what} must be an array.`);
    return value;
  }

  function load() {
    const out = {};
    for (const [key, rel] of Object.entries(FILES)) out[key] = readJson(rel, OPTIONAL[key]);
    return out;
  }

  function saveLeads(leads) {
    return writeJson(FILES.leads, requireArray(leads, "leads").map(stripRetired).sort(byAddedThenId));
  }

  function saveQueue(queue) {
    return writeJson(FILES.queue, requireArray(queue, "queue").map(stripQueueItem).sort(byAddedThenId));
  }

  function saveSuppression(list) {
    return writeJson(FILES.suppression, [...requireArray(list, "suppression")].sort(byAddedThenKey));
  }

  // Discovery candidates in data/inbox (they hold Places content, which must not linger).
  function listCandidateFiles() {
    let names;
    try {
      names = fs.readdirSync(abs(INBOX_DIR)).filter(isCandidatesName).sort();
    } catch {
      return [];
    }
    return names.map((name) => {
      const rel = `${INBOX_DIR}/${name}`;
      let mtimeMs = NaN;
      let fetchedAt = "";
      try {
        mtimeMs = fs.statSync(abs(rel)).mtimeMs;
      } catch {
        // removed since the listing
      }
      try {
        const body = JSON.parse(fs.readFileSync(abs(rel), "utf8").replace(/^\ufeff/, ""));
        if (typeof body?.fetchedAt === "string") fetchedAt = body.fetchedAt;
      } catch {
        // unreadable files are still listed so they can be purged
      }
      return { name, rel, fetchedAt, mtimeMs };
    });
  }

  function removeCandidateFile(name) {
    if (typeof name !== "string" || !isCandidatesName(name) || /[\\/]/.test(name)) {
      throw new Error(`${JSON.stringify(name)} is not a candidates file in ${INBOX_DIR}.`);
    }
    fs.rmSync(abs(`${INBOX_DIR}/${name}`), { force: true });
  }

  function saveNotes(list) {
    return writeJson(FILES.notes, [...requireArray(list, "notes")].sort(byCreatedThenId));
  }

  // Read fresh, change, write, like updateLeads.
  function updateNotes(mutate) {
    const notes = readJson(FILES.notes, OPTIONAL.notes);
    const next = mutate(notes) ?? notes;
    saveNotes(next);
    return next;
  }

  function saveRejected(rejected) {
    return writeJson(FILES.rejected, [...requireArray(rejected, "rejected")].sort(byRejectedThenKey));
  }

  function saveSettings(settings) {
    return writeJson(FILES.settings, settings);
  }

  function saveBenchmarks(benchmarks) {
    return writeJson(FILES.benchmarks, benchmarks);
  }

  function runPath(runId) {
    if (typeof runId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(runId)) {
      throw new Error(`Run id ${JSON.stringify(runId)} is not a safe file name.`);
    }
    return `${RUNS_DIR}/${runId}.json`;
  }

  function saveRun(report) {
    return writeJson(runPath(report?.runId), report);
  }

  function readRun(runId) {
    return readJson(runPath(runId), null);
  }

  // Newest first.
  function listRuns() {
    let files;
    try {
      files = fs.readdirSync(abs(RUNS_DIR)).filter((f) => f.endsWith(".json"));
    } catch {
      return [];
    }
    const runs = [];
    for (const f of files) {
      try {
        runs.push(readJson(`${RUNS_DIR}/${f}`));
      } catch {
        // A half written or hand edited report should not break the app; check.js reports it.
      }
    }
    return runs.sort((a, b) => String(b.runId).localeCompare(String(a.runId)) || String(b.ingestedAt).localeCompare(String(a.ingestedAt)));
  }

  // Read fresh, change, write: keeps the window for a lost update small.
  function updateLeads(mutate) {
    const leads = readJson(FILES.leads, OPTIONAL.leads);
    const next = mutate(leads) ?? leads;
    saveLeads(next);
    return next;
  }

  return {
    root,
    path: abs,
    readJson,
    writeJson,
    load,
    saveLeads,
    saveQueue,
    saveRejected,
    saveSettings,
    saveBenchmarks,
    saveSuppression,
    saveNotes,
    updateNotes,
    listCandidateFiles,
    removeCandidateFile,
    saveRun,
    readRun,
    listRuns,
    updateLeads,
  };
}
