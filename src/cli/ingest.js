// npm run ingest -- data/inbox/<runId>.json [--dry-run] [--json]
// Ingests a weekly batch, saves leads, queue and rejected, and writes data/runs/<runId>.json.
// Ingesting the same batch again changes nothing and keeps the first run report.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { ingestBatch } from "../lib/ingest.js";
import { createStore, RUNS_DIR } from "../lib/store.js";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const USAGE = "Usage: npm run ingest -- <batch.json> [--dry-run] [--json] [--root <dir>]";

function summarize(report, say) {
  const c = report.counts;
  say(`Run ${report.runId} (${report.mode}): ${c.candidates} candidates, ${c.accepted} accepted, ${c.queued} queued, ${c.rejected} rejected, ${c.duplicates} duplicates, ${c.reverified} reverified, ${c.errors} with errors.`);
  if (report.accepted.length) say(`Accepted: ${report.accepted.join(", ")}.`);
  if (report.queued.length) say(`Queued: ${report.queued.join(", ")}.`);
  for (const d of report.duplicates) say(`Duplicate: ${d.business} matches ${d.in} ${d.matched}.`);
  for (const e of report.errors) {
    say(`Not ingested, ${e.business}:`);
    for (const line of e.errors) say(`  ${line}`);
  }
  for (const w of report.warnings) {
    say(`Warning, ${w.business}:`);
    for (const line of w.warnings) say(`  ${line}`);
  }
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const out = deps.stdout ?? process.stdout;
  const err = deps.stderr ?? process.stderr;
  const say = (line = "") => out.write(`${line}\n`);

  let values;
  let positionals;
  try {
    ({ values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        "dry-run": { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        root: { type: "string" },
        help: { type: "boolean", short: "h" },
      },
      strict: true,
    }));
  } catch (e) {
    err.write(`${e.message}\n${USAGE}\n`);
    return 2;
  }
  if (values.help) {
    say(USAGE);
    return 0;
  }
  if (positionals.length !== 1) {
    err.write(`Give exactly one batch file.\n${USAGE}\n`);
    return 2;
  }

  const root = path.resolve(values.root ?? deps.root ?? PROJECT_ROOT);
  const store = createStore(root);
  const batchPath = path.resolve(root, positionals[0]);
  let batch;
  try {
    batch = JSON.parse(fs.readFileSync(batchPath, "utf8").replace(/^\ufeff/, ""));
  } catch (e) {
    err.write(`Cannot read the batch ${positionals[0]}: ${e.message}\n`);
    return 1;
  }

  const now = deps.now ? new Date(deps.now) : new Date();
  const { state: next, report } = ingestBatch({ batch, state: store.load(), now });
  const batchInvalid = report.errors.some((e) => e.business === "(batch)");

  if (values.json) say(JSON.stringify(report, null, 2));
  else summarize(report, say);

  if (batchInvalid) {
    err.write("The batch itself is invalid, so nothing was ingested.\n");
    return 1;
  }
  if (values["dry-run"]) {
    if (!values.json) say("Dry run: nothing was written.");
    return 0;
  }

  if (report.changed) {
    store.saveLeads(next.leads);
    store.saveQueue(next.queue);
    store.saveRejected(next.rejected);
  }
  const existing = store.readRun(report.runId);
  if (report.changed || !existing) {
    store.saveRun(report);
    if (!values.json) say(`Wrote ${RUNS_DIR}/${report.runId}.json.`);
  } else if (!values.json) {
    say(`Nothing changed, so the run report from ${existing.ingestedAt} was kept.`);
  }
  return 0;
}

function isEntryPoint() {
  if (!process.argv[1]) return false;
  const self = fileURLToPath(import.meta.url);
  const entry = path.resolve(process.argv[1]);
  return process.platform === "win32" ? self.toLowerCase() === entry.toLowerCase() : self === entry;
}

if (isEntryPoint()) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (e) => {
      process.stderr.write(`ingest failed: ${e?.message || e}\n`);
      process.exitCode = 1;
    },
  );
}
