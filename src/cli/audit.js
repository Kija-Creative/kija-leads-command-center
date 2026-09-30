// npm run audit -- (--id <id> | --all) [--root <dir>]
//
// The design audit (brief, Quality Control) over generated demos: demos/<id>/index.html against
// demos/<id>/SITE_DNA.json and the Site DNA history. Stores the result on the record and on
// lead.demo.dna, prints every flag as a sentence and exits 1 when any audited page fails.
// A lead with no Site DNA or no page is listed as skipped with the reason.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createEngine, loadHistory, snapshotOf } from "../design-intelligence/index.ts";
import { historyPath, parseDnaArgs, pipelineOrder, readRecord, writeRecord } from "./dna.js";

const USAGE = "Usage: npm run audit -- (--id <id> | --all) [--root <dir>]";

export async function runAudit({ root, store, selection, now, engine: given }) {
  const nowIso = (now instanceof Date ? now : new Date(now)).toISOString();
  const engine = given || (await createEngine({ root }));
  const state = await store.load();
  const leads = Array.isArray(state.leads) ? state.leads : [];
  const chosen = selection.mode === "id" ? leads.filter((l) => l.id === selection.value) : pipelineOrder(leads);
  /** @type {{ ok: boolean, audited: { id: string, business: string, audit: import("../design-intelligence/schema.ts").AuditResult }[], skipped: { id: string, reason: string }[], errors: string[] }} */
  const report = { ok: true, audited: [], skipped: [], errors: [] };
  if (selection.mode === "id" && !chosen.length) {
    report.ok = false;
    report.errors.push(`No lead has the id "${selection.value}".`);
    return report;
  }
  const history = loadHistory(historyPath(root));
  let changed = false;
  for (const lead of chosen) {
    const warnings = [];
    const record = readRecord(root, lead.id, warnings);
    const page = path.join(root, "demos", lead.id, "index.html");
    if (!record) {
      report.skipped.push({ id: lead.id, reason: `No Site DNA yet; run npm run dna -- --id ${lead.id}.${warnings.length ? ` ${warnings.join(" ")}` : ""}` });
      continue;
    }
    if (!fs.existsSync(page)) {
      report.skipped.push({ id: lead.id, reason: "No demos/<id>/index.html to audit yet; build the demo first." });
      continue;
    }
    if (!engine.registry.profiles.has(record.dna.industry)) {
      report.skipped.push({ id: lead.id, reason: `The industry profile "${record.dna.industry}" is not loaded, so the page cannot be audited.` });
      continue;
    }
    const audit = engine.audit(fs.readFileSync(page, "utf8"), record, { history, lead, now: nowIso });
    const updated = { ...record, audit, updatedAt: nowIso };
    writeRecord(root, updated);
    lead.demo = { shareApproved: false, ...(lead.demo || {}), dna: snapshotOf(updated) };
    changed = true;
    report.audited.push({ id: lead.id, business: lead.business, audit });
    if (!audit.pass) report.ok = false;
  }
  if (changed) await store.saveLeads(leads);
  if (selection.mode === "id" && report.skipped.length) report.ok = false;
  return report;
}

export function formatAuditReport(report) {
  const lines = [];
  for (const a of report.audited) {
    lines.push(`  ${a.audit.pass ? "pass" : "fail"}    ${a.id}  score ${a.audit.score}`);
    for (const f of a.audit.flags) lines.push(`          ${f.severity} [${f.check}] ${f.message}`);
  }
  for (const s of report.skipped) lines.push(`  skipped ${s.id}  ${s.reason}`);
  for (const e of report.errors) lines.push(`  error   ${e}`);
  const failed = report.audited.filter((a) => !a.audit.pass).length;
  lines.push(`Design audit: ${report.audited.length} audited, ${failed} failed, ${report.skipped.length} skipped.`);
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
  const report = await runAudit({ root: args.root, store: createStore(args.root), selection: args, now: new Date() });
  const text = formatAuditReport(report);
  if (report.ok) console.log(text);
  else console.error(text);
  return report.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then((code) => {
    process.exitCode = code;
  }, (err) => {
    console.error(`audit failed: ${err.message}`);
    process.exitCode = 1;
  });
}
