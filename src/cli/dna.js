// npm run dna -- (--id <id> | --all) [--unlock] [--lock] [--regenerate] [--explore]
//                 [--set <field>=<value> ...] [--by <name>] [--dry-run] [--root <dir>]
//
// Produces Site DNA for leads before any frontend work: classify, infer brand traits from
// verified fields, score archetypes, select DNA, compare with recent sites and repair when too
// similar. Writes demos/<id>/SITE_DNA.json, lead.demo.dna (the snapshot) in data/leads.json and
// appends to data/site-dna-history.json.
//
// Locked DNA keeps its locked axes unless --unlock. --lock locks what was produced (a person's
// approval). --regenerate picks another valid combination (facts, industry and conversion kept;
// inside a lock only the free axes move). --explore picks a different appropriate archetype.
// --set overrides one field inside the industry and archetype bounds (repeatable, one lead).
// --all walks leads in pipeline order (addedAt, then id) so each lead is compared with the ones
// before it. History goes through a HistoryRepository: the JSON file, or memory on a dry run.
// This reads the clock once and passes it down. Nothing is published or sent.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  createEngine,
  jsonHistoryRepository,
  loadHistory,
  lockRecord,
  memoryHistoryRepository,
  snapshotOf,
} from "../design-intelligence/index.ts";
import { candidatePhotos } from "../demo/stock.js";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const USAGE = "Usage: npm run dna -- (--id <id> | --all) [--unlock] [--lock] [--regenerate] [--explore] [--set <field>=<value> ...] [--by <name>] [--dry-run] [--root <dir>]";

// Fields --set may override. sectionOrder takes a comma separated list of module keys.
export const SET_FIELDS = ["archetype", "paletteFamily", "typography", "hero", "layoutRhythm", "navigation", "geometry", "imagery", "motion", "ctaStyle", "proofStyle", "componentDialect", "primaryConversion", "fontPairing", "industry", "sectionOrder"];

export function parseDnaArgs(argv) {
  /** @type {{ mode: string, value: string, unlock: boolean, lock: boolean, regenerate: boolean, explore: boolean, set: Record<string, string | string[]>, by: string, dryRun: boolean, root: string, help: boolean, errors: string[] }} */
  const out = { mode: "", value: "", unlock: false, lock: false, regenerate: false, explore: false, set: {}, by: "Jamey", dryRun: false, root: DEFAULT_ROOT, help: false, errors: [] };
  let selectors = 0;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const v = argv[i + 1];
      if (!v || v.startsWith("--")) {
        out.errors.push(`${arg} needs a value.`);
        return "";
      }
      i += 1;
      return v;
    };
    if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg === "--all") {
      out.mode = "all";
      selectors += 1;
    } else if (arg === "--id") {
      out.mode = "id";
      out.value = next();
      selectors += 1;
    } else if (arg === "--unlock") out.unlock = true;
    else if (arg === "--lock") out.lock = true;
    else if (arg === "--regenerate") out.regenerate = true;
    else if (arg === "--explore") out.explore = true;
    else if (arg === "--set") {
      const v = next();
      const eq = v.indexOf("=");
      const key = eq > 0 ? v.slice(0, eq).trim() : "";
      const val = eq > 0 ? v.slice(eq + 1).trim() : "";
      if (v && (!key || !val)) out.errors.push(`--set needs <field>=<value>, got "${v}".`);
      else if (key && !SET_FIELDS.includes(key)) out.errors.push(`--set cannot change "${key}"; it takes one of: ${SET_FIELDS.join(", ")}.`);
      else if (key) out.set[key] = key === "sectionOrder" ? val.split(",").map((m) => m.trim()).filter(Boolean) : val;
    } else if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--by") out.by = next() || out.by;
    else if (arg === "--root") {
      const v = next();
      if (v) out.root = path.resolve(v);
    } else out.errors.push(`Unknown argument "${arg}".`);
  }
  if (!out.help && selectors === 0) out.errors.push("Pick --id <id> or --all.");
  if (selectors > 1) out.errors.push("Pick one of --id or --all.");
  if (out.lock && out.unlock) out.errors.push("--lock and --unlock cannot be combined; unlock first, then lock the new DNA.");
  const intents = [out.regenerate, out.explore, Object.keys(out.set).length > 0].filter(Boolean).length;
  if (intents > 1) out.errors.push("Pick one of --regenerate, --explore or --set.");
  if (Object.keys(out.set).length && out.mode === "all") out.errors.push("--set overrides one lead; use --id <id>.");
  return out;
}

export function recordPath(root, id) {
  return path.join(root, "demos", id, "SITE_DNA.json");
}

export function historyPath(root) {
  return path.join(root, "data", "site-dna-history.json");
}

// The stored record for a lead, or null when absent or unreadable (a warning explains which).
export function readRecord(root, id, warnings = []) {
  const file = recordPath(root, id);
  if (!fs.existsSync(file)) return null;
  try {
    const rec = JSON.parse(fs.readFileSync(file, "utf8"));
    if (rec && rec.version === 1 && rec.leadId === id && rec.dna) return rec;
    warnings.push(`demos/${id}/SITE_DNA.json is not a Site DNA record for this lead; it is ignored.`);
  } catch (err) {
    warnings.push(`demos/${id}/SITE_DNA.json could not be read (${err.message}); it is ignored.`);
  }
  return null;
}

export function writeRecord(root, record) {
  const file = recordPath(root, record.leadId);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, file);
  return file;
}

export function pipelineOrder(leads) {
  return [...leads].sort((a, b) => String(a.addedAt || "").localeCompare(String(b.addedAt || "")) || String(a.id).localeCompare(String(b.id)));
}

// The photos that fit a lead, for archetype scoring: a photography led direction needs some.
export function availableImagery(lead, categories) {
  const cat = (categories && categories[lead.categoryKey]) || {};
  return { stockPhotos: candidatePhotos({ categoryKey: lead.categoryKey, vertical: cat.vertical, people: ["none", "hands", "partial"] }).length, ownerPhotos: 0 };
}

// The history event a run records for one lead.
function eventFor(selection, existing) {
  if (selection.set && Object.keys(selection.set).length) return "override";
  if (selection.explore) return "explore";
  if (selection.regenerate) return "regenerate";
  if (selection.unlock && existing && existing.locked) return "unlock";
  return "select";
}

// Selects (or keeps) DNA for the chosen leads. `store` is shaped like createStore(root).
// `history` may be a HistoryRepository to use instead of the JSON file (tests, dry runs).
/** @param {{ root: string, store: any, selection: any, now: string | Date, engine?: any, history?: import("../design-intelligence/history.ts").HistoryRepository }} args */
export async function runDna({ root, store, selection, now, engine: given, history: givenHistory }) {
  const nowIso = (now instanceof Date ? now : new Date(now)).toISOString();
  const engine = given || (await createEngine({ root }));
  const state = await store.load();
  const leads = Array.isArray(state.leads) ? state.leads : [];
  /** @type {{ ok: boolean, done: { id: string, business: string, industry: string, archetype: string, score: number, valid: boolean, fingerprint: string, locked: boolean, reused: boolean, warnings: string[], record: import("../design-intelligence/schema.ts").SiteDnaRecord }[], failed: { id: string, business: string, errors: string[], warnings: string[] }[], errors: string[], warnings: string[] }} */
  const report = { ok: true, done: [], failed: [], errors: [...engine.errors], warnings: [...engine.warnings] };
  const chosen = selection.mode === "id" ? leads.filter((l) => l.id === selection.value) : pipelineOrder(leads);
  if (selection.mode === "id" && !chosen.length) {
    report.ok = false;
    report.errors.push(`No lead has the id "${selection.value}".`);
    return report;
  }
  // The JSON repository writes the history on every append; a dry run works on a copy in memory.
  const history = givenHistory || (selection.dryRun ? memoryHistoryRepository(loadHistory(historyPath(root))) : jsonHistoryRepository(historyPath(root)));
  const set = selection.set || {};
  const override = Object.keys(set).length ? { by: selection.by || "Jamey", at: nowIso, fields: { ...set } } : undefined;
  let changedLeads = false;
  for (const lead of chosen) {
    const warnings = [];
    const existing = readRecord(root, lead.id, warnings);
    const result = engine.select(lead, {
      now: nowIso,
      history,
      existing,
      unlock: Boolean(selection.unlock),
      regenerate: Boolean(selection.regenerate),
      explore: Boolean(selection.explore),
      override,
      imagery: availableImagery(lead, engine.categories),
    });
    warnings.push(...result.warnings);
    if (!result.ok || !result.record) {
      report.failed.push({ id: lead.id, business: lead.business, errors: result.errors, warnings });
      continue;
    }
    let record = result.record;
    const own = history.all().filter((e) => e.leadId === lead.id);
    const before = own.length ? own[own.length - 1] : null;
    if (!result.reused || !before || before.fingerprint !== record.fingerprint) {
      history.append(record, { event: eventFor(selection, existing), now: nowIso });
    }
    if (selection.lock && !record.locked) {
      record = lockRecord(record, { by: selection.by, now: nowIso });
      history.append(record, { event: "lock", now: nowIso });
    }
    if (!selection.dryRun) {
      writeRecord(root, record);
      lead.demo = { shareApproved: false, ...(lead.demo || {}), dna: snapshotOf(record) };
      changedLeads = true;
    }
    report.done.push({ id: lead.id, business: lead.business, industry: record.dna.industry, archetype: record.dna.archetype, score: record.variation.score, valid: record.variation.valid, fingerprint: record.fingerprint, locked: record.locked, reused: result.reused, warnings, record });
  }
  if (!selection.dryRun && changedLeads) await store.saveLeads(leads);
  if (report.failed.length) report.ok = false;
  return report;
}

export function formatDnaReport(report, selection) {
  const lines = [];
  for (const d of report.done) {
    lines.push(`  dna     ${d.id}  ${d.industry}/${d.archetype}  variation ${d.score}${d.valid ? "" : " (too similar, needs a person)"}  ${d.fingerprint}${d.locked ? "  locked" : ""}${d.reused ? "  kept" : ""}`);
    for (const w of d.warnings) lines.push(`          ${w}`);
  }
  for (const f of report.failed) {
    lines.push(`  failed  ${f.id}`);
    for (const e of f.errors) lines.push(`          ${e}`);
  }
  for (const e of report.errors) lines.push(`  error   ${e}`);
  lines.push(`Site DNA: ${report.done.length} produced, ${report.failed.length} failed${selection.dryRun ? " (dry run, nothing written)" : ""}.`);
  if (report.done.length && !selection.dryRun) lines.push("Written to demos/<id>/SITE_DNA.json, lead.demo.dna and data/site-dna-history.json. Nothing was published or sent.");
  return lines.join("\n");
}

async function main() {
  const args = parseDnaArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    return 0;
  }
  if (args.errors.length) {
    console.error(`${args.errors.join("\n")}\n${USAGE}`);
    return 2;
  }
  const { createStore } = await import("../lib/store.js");
  const report = await runDna({ root: args.root, store: createStore(args.root), selection: args, now: new Date() });
  const text = formatDnaReport(report, args);
  if (report.ok) console.log(text);
  else console.error(text);
  return report.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then((code) => {
    process.exitCode = code;
  }, (err) => {
    console.error(`dna failed: ${err.message}`);
    process.exitCode = 1;
  });
}
