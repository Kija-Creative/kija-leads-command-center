// npm run demos -- [--run <runId> | --id <id> | --all | --missing] [--root <dir>]
//
// Renders private homepage demos to demos/<id>/index.html. Every page must
// pass checkDemoHtml before it is written; a failure is reported and that file
// is left untouched. Successful builds record lead.demo.builtAt, template and
// palette through the store. This reads the clock once and passes it down.
// Nothing here publishes or sends anything.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkDemoHtml } from "../demo/guardrails.js";
import { renderDemo } from "../demo/render.js";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const USAGE = "Usage: node src/cli/build-demos.js [--run <runId> | --id <id> | --all | --missing] [--root <dir>]\nWith no selector it builds --missing: leads with no demo yet, or whose demo file is gone.";

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
      if (!value) out.errors.push("--root needs a directory.");
      else {
        out.root = path.resolve(value);
        i += 1;
      }
    } else out.errors.push(`Unknown argument "${arg}".`);
  }
  if (selectors > 1) out.errors.push("Pick one of --run, --id, --all or --missing.");
  return out;
}

export function demoPath(rootDir, id) {
  return path.join(rootDir, "demos", id, "index.html");
}

export function selectLeads(leads, { mode, value }, rootDir) {
  const list = Array.isArray(leads) ? leads : [];
  if (mode === "all") return list;
  if (mode === "id") return list.filter((l) => l.id === value);
  if (mode === "run") return list.filter((l) => l.runId === value);
  return list.filter((l) => !(l.demo && l.demo.builtAt) || !fs.existsSync(demoPath(rootDir, l.id)));
}

function writeAtomic(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, file);
}

// Builds the selected demos. `store` is anything shaped like createStore(); both
// sync and async load/saveLeads are accepted.
export async function buildDemos({ store, rootDir, selection, now }) {
  const nowIso = (now instanceof Date ? now : new Date(now)).toISOString();
  const state = await store.load();
  const leads = Array.isArray(state.leads) ? state.leads : [];
  const chosen = selectLeads(leads, selection, rootDir);
  const report = { ok: true, built: [], failed: [], matched: chosen.length, errors: [], warnings: [] };

  if (selection.mode === "id" && !chosen.length) {
    report.ok = false;
    report.errors.push(`No lead has the id "${selection.value}".`);
    return report;
  }

  for (const lead of chosen) {
    let result;
    try {
      result = renderDemo(lead, { categories: state.categories || {}, settings: state.settings || {}, now: nowIso });
    } catch (err) {
      report.failed.push({ id: lead.id, business: lead.business, errors: [`Render failed: ${err.message}`] });
      continue;
    }
    const check = checkDemoHtml(result.html, lead);
    if (!check.ok) {
      report.failed.push({ id: lead.id, business: lead.business, errors: check.errors });
      continue;
    }
    const file = demoPath(rootDir, lead.id);
    writeAtomic(file, result.html);
    // Keeps shareApproved and anything else the app stored on lead.demo.
    lead.demo = { shareApproved: false, ...(lead.demo || {}), builtAt: nowIso, template: result.template, palette: result.palette };
    report.built.push({ id: lead.id, business: lead.business, template: result.template, palette: result.palette, file: path.relative(rootDir, file).split(path.sep).join("/") });
  }

  if (report.built.length) await store.saveLeads(leads);
  if (report.failed.length) report.ok = false;
  return report;
}

export function formatReport(report, selection) {
  const lines = [];
  const label = selection.mode === "run" || selection.mode === "id" ? `--${selection.mode} ${selection.value}` : `--${selection.mode}`;
  if (report.errors.length) return report.errors.join("\n");
  if (!report.matched) {
    lines.push(selection.mode === "missing" ? "Every lead already has a demo. Use --all to rebuild them." : `No leads matched ${label}.`);
    return lines.join("\n");
  }
  for (const b of report.built) lines.push(`  built   ${b.id}  ${b.template}/${b.palette}  ${b.file}`);
  for (const f of report.failed) {
    lines.push(`  failed  ${f.id}`);
    for (const e of f.errors) lines.push(`          ${e}`);
  }
  lines.push(`Demos (${label}): ${report.built.length} built, ${report.failed.length} failed guardrails, ${report.matched} matched.`);
  if (report.built.length) lines.push("Demos are private files. Nothing was published or sent.");
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    return 0;
  }
  if (args.errors.length) {
    console.error(`${args.errors.join("\n")}\n${USAGE}`);
    return 2;
  }
  const { createStore } = await import("../lib/store.js");
  const store = createStore(args.root);
  const report = await buildDemos({ store, rootDir: args.root, selection: args, now: new Date() });
  const text = formatReport(report, args);
  if (report.ok) console.log(text);
  else console.error(text);
  return report.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then((code) => {
    process.exitCode = code;
  }, (err) => {
    console.error(`build-demos failed: ${err.message}`);
    process.exitCode = 1;
  });
}
