// npm run brief -- --id <id> [--root <dir>]
//
// Writes the constrained frontend generation brief for one lead: demos/<id>/BRIEF.md (for the
// building agent and for Jamey) and demos/<id>/SITE_DNA.json. The brief is built from the lead's
// Site DNA; when the lead has none yet, DNA is selected first exactly as npm run dna does (and
// recorded in data/site-dna-history.json and lead.demo.dna). Locked DNA is always kept.
// Nothing is published or sent.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createEngine, loadHistory } from "../design-intelligence/index.ts";
import { candidatePhotos } from "../demo/stock.js";
import { parseDnaArgs, readRecord, recordPath, runDna, historyPath, writeRecord } from "./dna.js";

const USAGE = "Usage: npm run brief -- --id <id> [--root <dir>]";

// The stock photos a lead's page may use, with the caption each one must carry.
export function stockAssetsFor(lead, categories) {
  const cat = (categories && categories[lead.categoryKey]) || {};
  return candidatePhotos({ categoryKey: lead.categoryKey, vertical: cat.vertical, people: ["none", "hands", "partial"] }).map((p) => ({
    id: p.id,
    subject: p.subject,
    alt: `${String(p.alt || p.subject).replace(/[.,;]+$/, "")}, stock photo`,
    caption: `Stock placeholder: ${p.subject}. To be replaced with the owner's own photo.`,
    photographer: p.photographer,
    orientation: p.orientation,
    people: p.people || "none",
    url: p.url,
  }));
}

export function briefPath(root, id) {
  return path.join(root, "demos", id, "BRIEF.md");
}

export async function runBrief({ root, store, id, now, engine: given }) {
  const engine = given || (await createEngine({ root }));
  const report = { ok: true, errors: [], warnings: [...engine.warnings], files: [], record: null };
  let record = readRecord(root, id, report.warnings);
  if (!record) {
    const dna = await runDna({ root, store, selection: { mode: "id", value: id, unlock: false, lock: false, dryRun: false }, now, engine });
    report.warnings.push(...dna.done.flatMap((d) => d.warnings));
    if (!dna.ok || !dna.done.length) {
      report.ok = false;
      report.errors.push(...dna.errors, ...dna.failed.flatMap((f) => f.errors));
      return report;
    }
    record = dna.done[0].record;
  }
  const state = await store.load();
  const lead = (state.leads || []).find((l) => l.id === id);
  if (!lead) {
    report.ok = false;
    report.errors.push(`No lead has the id "${id}".`);
    return report;
  }
  const history = loadHistory(historyPath(root));
  const { markdown } = engine.brief(record, lead, { assets: stockAssetsFor(lead, engine.categories), history });
  const file = briefPath(root, id);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.tmp`, `${markdown}\n`, "utf8");
  fs.renameSync(`${file}.tmp`, file);
  writeRecord(root, record);
  report.files.push(path.relative(root, file).split(path.sep).join("/"), path.relative(root, recordPath(root, id)).split(path.sep).join("/"));
  report.record = record;
  return report;
}

async function main() {
  const args = parseDnaArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    return 0;
  }
  if (args.mode !== "id") args.errors.push("npm run brief takes --id <id>.");
  const errors = args.errors.filter((e) => !e.startsWith("Pick --id"));
  if (errors.length) {
    console.error(`${errors.join("\n")}\n${USAGE}`);
    return 2;
  }
  const { createStore } = await import("../lib/store.js");
  const report = await runBrief({ root: args.root, store: createStore(args.root), id: args.value, now: new Date() });
  if (!report.ok) {
    console.error(report.errors.join("\n"));
    return 1;
  }
  console.log(`Brief for ${report.record.business}: ${report.record.industryLabel}, ${report.record.archetypeLabel}, variation ${report.record.variation.score}.`);
  for (const f of report.files) console.log(`  wrote   ${f}`);
  console.log("The brief is a private file. Nothing was published or sent.");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then((code) => {
    process.exitCode = code;
  }, (err) => {
    console.error(`brief failed: ${err.message}`);
    process.exitCode = 1;
  });
}
