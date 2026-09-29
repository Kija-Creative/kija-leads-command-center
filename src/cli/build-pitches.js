// npm run pitches -- [--run <runId> | --id <id> | --all | --missing] [--root <dir>]
//
// Renders pitch pages to pitches/<id>/index.html. Every page must pass
// checkPitchHtml before it is written; a failure is reported and that file is
// left untouched. Leads are read, never written: whether a pitch exists is the
// file itself. This reads the clock once and passes it down. Nothing here
// publishes or sends anything. A business on the suppression list gets no pitch
// page; an existing one is left for Jamey to delete, since deleting is his call.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { suppressed } from "../pitch/compliance-link.js";
import { checkPitchHtml, renderPitch } from "../pitch/render.js";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const USAGE = "Usage: node src/cli/build-pitches.js [--run <runId> | --id <id> | --all | --missing] [--root <dir>]\nWith no selector it builds --missing: leads whose pitches/<id>/index.html does not exist yet.";

export function parseArgs(argv) {
  const out = { mode: "missing", value: "", root: DEFAULT_ROOT, help: false, errors: [] };
  let selectors = 0;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg === "--all" || arg === "--missing") {
      out.mode = arg.slice(2);
      selectors += 1;
    } else if (arg === "--run" || arg === "--id") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) out.errors.push(`${arg} needs a value.`);
      else {
        out.mode = arg.slice(2);
        out.value = value;
        i += 1;
      }
      selectors += 1;
    } else if (arg === "--root") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) out.errors.push("--root needs a directory.");
      else {
        out.root = path.resolve(value);
        i += 1;
      }
    } else out.errors.push(`Unknown argument "${arg}".`);
  }
  if (selectors > 1) out.errors.push("Pick one of --run, --id, --all or --missing.");
  return out;
}

// Lead ids are slugs; anything else would let a hand edited id escape pitches/.
function safeId(id) {
  return typeof id === "string" && /^[a-z0-9][a-z0-9-]*$/.test(id);
}

export function pitchPath(rootDir, id) {
  return path.join(rootDir, "pitches", id, "index.html");
}

export function selectLeads(leads, { mode, value }, rootDir) {
  const list = Array.isArray(leads) ? leads : [];
  if (mode === "all") return list;
  if (mode === "id") return list.filter((l) => l.id === value);
  if (mode === "run") return list.filter((l) => l.runId === value);
  return list.filter((l) => !safeId(l.id) || !fs.existsSync(pitchPath(rootDir, l.id)));
}

function writeAtomic(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, file);
}

// Builds the selected pitch pages. `store` is anything shaped like createStore();
// sync and async load are both accepted.
export async function buildPitches({ store, rootDir, selection, now }) {
  const nowIso = (now instanceof Date ? now : new Date(now)).toISOString();
  const state = await store.load();
  const leads = Array.isArray(state.leads) ? state.leads : [];
  const chosen = selectLeads(leads, selection, rootDir);
  const suppression = Array.isArray(state.suppression) ? state.suppression : [];
  const report = { ok: true, built: [], failed: [], skipped: [], matched: chosen.length, errors: [], warnings: [] };

  if (selection.mode === "id" && !chosen.length) {
    report.ok = false;
    report.errors.push(`No lead has the id "${selection.value}".`);
    return report;
  }

  const options = { settings: state.settings || {}, benchmarks: state.benchmarks || {}, categories: state.categories || {}, now: nowIso };
  for (const lead of chosen) {
    if (!safeId(lead.id)) {
      report.failed.push({ id: String(lead.id), business: lead.business, errors: ["The lead id is not a safe folder name, so no pitch was written."] });
      continue;
    }
    if (suppressed(lead, suppression)) {
      const exists = fs.existsSync(pitchPath(rootDir, lead.id));
      report.skipped.push({
        id: lead.id,
        business: lead.business,
        reason: `On the suppression list, so no pitch page is built.${exists ? " An older pitch page is still in pitches/; delete it if they asked." : ""}`,
      });
      continue;
    }
    let html;
    try {
      html = renderPitch(lead, options);
    } catch (err) {
      report.failed.push({ id: lead.id, business: lead.business, errors: [`Render failed: ${err.message}`] });
      continue;
    }
    const check = checkPitchHtml(html, lead, { settings: options.settings });
    if (!check.ok) {
      report.failed.push({ id: lead.id, business: lead.business, errors: check.errors });
      continue;
    }
    for (const w of check.warnings) report.warnings.push(`${lead.id}: ${w}`);
    const file = pitchPath(rootDir, lead.id);
    writeAtomic(file, html);
    report.built.push({ id: lead.id, business: lead.business, file: path.relative(rootDir, file).split(path.sep).join("/") });
  }

  if (report.failed.length) report.ok = false;
  return report;
}

export function formatReport(report, selection) {
  const lines = [];
  const label = selection.mode === "run" || selection.mode === "id" ? `--${selection.mode} ${selection.value}` : `--${selection.mode}`;
  if (report.errors.length) return report.errors.join("\n");
  if (!report.matched) {
    return selection.mode === "missing" ? "Every lead already has a pitch page. Use --all to rebuild them." : `No leads matched ${label}.`;
  }
  for (const b of report.built) lines.push(`  built   ${b.id}  ${b.file}`);
  for (const f of report.failed) {
    lines.push(`  failed  ${f.id}`);
    for (const e of f.errors) lines.push(`          ${e}`);
  }
  for (const k of report.skipped ?? []) lines.push(`  skipped ${k.id}  ${k.reason}`);
  for (const w of report.warnings) lines.push(`  warning ${w}`);
  const skipped = report.skipped?.length ? `, ${report.skipped.length} skipped` : "";
  lines.push(`Pitches (${label}): ${report.built.length} built, ${report.failed.length} failed${skipped}, ${report.matched} matched.`);
  if (report.built.length) lines.push("Pitch pages are private files. Nothing was published or sent.");
  return lines.join("\n");
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const log = deps.log ?? console.log;
  const error = deps.error ?? console.error;
  const args = parseArgs(argv);
  if (args.help) {
    log(USAGE);
    return 0;
  }
  if (args.errors.length) {
    error(`${args.errors.join("\n")}\n${USAGE}`);
    return 2;
  }
  let store = deps.store;
  if (!store) {
    const { createStore } = await import("../lib/store.js");
    store = createStore(args.root);
  }
  const report = await buildPitches({ store, rootDir: args.root, selection: args, now: deps.now ?? new Date() });
  const text = formatReport(report, args);
  if (report.ok) log(text);
  else error(text);
  return report.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then((code) => {
    process.exitCode = code;
  }, (err) => {
    console.error(`build-pitches failed: ${err.message}`);
    process.exitCode = 1;
  });
}
