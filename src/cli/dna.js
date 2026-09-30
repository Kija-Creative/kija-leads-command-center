// npm run dna -- (--id <id> | --all) [--unlock] [--lock] [--by <name>] [--dry-run] [--root <dir>]
//
// Produces Site DNA for leads before any frontend work: classify, infer brand traits from
// verified fields, score archetypes, select DNA, compare with recent sites and repair when too
// similar. Writes demos/<id>/SITE_DNA.json, lead.demo.dna (the snapshot) in data/leads.json and
// appends to data/site-dna-history.json.
//
// Locked DNA is kept unless --unlock. --lock locks what was produced (a person's approval).
// --all walks leads in pipeline order (addedAt, then id) so each lead is compared with the ones
// before it. This reads the clock once and passes it down. Nothing is published or sent.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  appendHistory,
  createEngine,
  latestForLead,
  loadHistory,
  lockRecord,
  saveHistory,
  snapshotOf,
} from "../design-intelligence/index.ts";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const USAGE = "Usage: npm run dna -- (--id <id> | --all) [--unlock] [--lock] [--by <name>] [--dry-run] [--root <dir>]";

export function parseDnaArgs(argv) {
  /** @type {{ mode: string, value: string, unlock: boolean, lock: boolean, by: string, dryRun: boolean, root: string, help: boolean, errors: string[] }} */
  const out = { mode: "", value: "", unlock: false, lock: false, by: "Jamey", dryRun: false, root: DEFAULT_ROOT, help: false, errors: [] };
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
    else if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--by") out.by = next() || out.by;
    else if (arg === "--root") {
      const v = next();
      if (v) out.root = path.resolve(v);
    } else out.errors.push(`Unknown argument "${arg}".`);
  }
  if (!out.help && selectors === 0) out.errors.push("Pick --id <id> or --all.");
  if (selectors > 1) out.errors.push("Pick one of --id or --all.");
  if (out.lock && out.unlock) out.errors.push("--lock and --unlock cannot be combined; unlock first, then lock the new DNA.");
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

// Selects (or keeps) DNA for the chosen leads. `store` is shaped like createStore(root).
export async function runDna({ root, store, selection, now, engine: given }) {
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
  let history = loadHistory(historyPath(root));
  let changedLeads = false;
  for (const lead of chosen) {
    const warnings = [];
    const existing = readRecord(root, lead.id, warnings);
    const result = engine.select(lead, { now: nowIso, history, existing, unlock: selection.unlock });
    warnings.push(...result.warnings);
    if (!result.ok || !result.record) {
      report.failed.push({ id: lead.id, business: lead.business, errors: result.errors, warnings });
      continue;
    }
    let record = result.record;
    const before = latestForLead(history, lead.id);
    if (!result.reused || !before || before.fingerprint !== record.fingerprint) {
      history = appendHistory(history, record, { event: record.overridden ? "override" : "select", now: nowIso });
    }
    if (selection.lock && !record.locked) {
      record = lockRecord(record, { by: selection.by, now: nowIso });
      history = appendHistory(history, record, { event: "lock", now: nowIso });
    }
    if (!selection.dryRun) {
      writeRecord(root, record);
      lead.demo = { shareApproved: false, ...(lead.demo || {}), dna: snapshotOf(record) };
      changedLeads = true;
    }
    report.done.push({ id: lead.id, business: lead.business, industry: record.dna.industry, archetype: record.dna.archetype, score: record.variation.score, valid: record.variation.valid, fingerprint: record.fingerprint, locked: record.locked, reused: result.reused, warnings, record });
  }
  if (!selection.dryRun) {
    if (changedLeads) await store.saveLeads(leads);
    saveHistory(historyPath(root), history);
  }
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
