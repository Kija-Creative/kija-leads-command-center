// npm run build [-- --root <dir>] [--skip <step,...>]
//
// The whole local build, in order: Site DNA for every lead (npm run dna -- --all), a frontend
// generation brief for every lead with DNA (BRIEF.md), demos (npm run demos -- --all), pitch
// pages (npm run pitches -- --all), the design audit of every demo against its DNA, then the
// repo checks (npm run check) and the typecheck. There is no bundler: the engine runs as
// TypeScript under Node's type stripping and every page is one static HTML file.
//
// Every step runs even when an earlier one fails, so one report shows everything that needs
// attention; the exit code is 1 when any step failed. Steps: dna, briefs, demos, pitches, audit,
// check, typecheck. This reads the clock once and passes it down. Nothing is published or sent.

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const BUILD_STEPS = ["dna", "briefs", "demos", "pitches", "audit", "check", "typecheck"];
const USAGE = `Usage: npm run build [-- --root <dir>] [--skip <step,...>]\nSteps, in order: ${BUILD_STEPS.join(", ")}.`;

export function parseBuildArgs(argv) {
  const out = { root: DEFAULT_ROOT, skip: [], help: false, errors: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      const v = argv[i + 1];
      if (!v || v.startsWith("--")) {
        out.errors.push(`${arg} needs a value.`);
        return "";
      }
      i += 1;
      return v;
    };
    if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg === "--root") {
      const v = value();
      if (v) out.root = path.resolve(v);
    } else if (arg === "--skip") {
      for (const s of value().split(",").map((x) => x.trim()).filter(Boolean)) {
        if (!BUILD_STEPS.includes(s)) out.errors.push(`--skip names "${s}", which is not a step (${BUILD_STEPS.join(", ")}).`);
        else out.skip.push(s);
      }
    } else out.errors.push(`Unknown argument "${arg}".`);
  }
  return out;
}

// A sink that keeps what a step prints, for the report.
function capture() {
  const lines = [];
  return { lines, stream: { write: (t) => lines.push(...String(t).replace(/\n$/, "").split("\n")) } };
}

// Runs the build. Tests inject the store, the engine and the clock.
/** @param {{ root: string, skip?: string[], now: string | Date, store?: any, engine?: any }} args */
export async function runBuild({ root, skip = [], now, store: givenStore, engine: givenEngine }) {
  const nowDate = now instanceof Date ? now : new Date(now);
  const { createStore } = await import("../lib/store.js");
  const store = givenStore || createStore(root);
  const { createEngine } = await import("../design-intelligence/index.ts");
  const engine = givenEngine || (await createEngine({ root }));
  const steps = [];
  const run = async (name, fn) => {
    if (skip.includes(name)) {
      steps.push({ name, ok: true, skipped: true, summary: "skipped", lines: [] });
      return;
    }
    try {
      const r = await fn();
      steps.push({ name, skipped: false, ...r });
    } catch (err) {
      steps.push({ name, ok: false, skipped: false, summary: `failed: ${err.message}`, lines: [] });
    }
  };

  await run("dna", async () => {
    const { formatDnaReport, runDna } = await import("./dna.js");
    const selection = { mode: "all", value: "", unlock: false, lock: false, regenerate: false, explore: false, set: {}, dryRun: false, by: "Jamey" };
    const report = await runDna({ root, store, selection, now: nowDate, engine });
    return { ok: report.ok, summary: `${report.done.length} produced, ${report.failed.length} failed`, lines: formatDnaReport(report, selection).split("\n") };
  });

  await run("briefs", async () => {
    const { runBrief } = await import("./brief.js");
    const { readRecord } = await import("./dna.js");
    const state = await store.load();
    const leads = Array.isArray(state.leads) ? state.leads : [];
    const lines = [];
    let written = 0;
    let failed = 0;
    for (const lead of leads) {
      if (!readRecord(root, lead.id)) continue;
      const r = await runBrief({ root, store, id: lead.id, now: nowDate, engine });
      if (r.ok) written += 1;
      else {
        failed += 1;
        lines.push(`  failed  ${lead.id}  ${r.errors.join(" ")}`);
      }
    }
    lines.push(`Briefs: ${written} written, ${failed} failed (only leads with Site DNA get a brief).`);
    return { ok: failed === 0, summary: `${written} written, ${failed} failed`, lines };
  });

  await run("demos", async () => {
    const { buildDemos, formatReport } = await import("./build-demos.js");
    const selection = { mode: "all", value: "" };
    const report = await buildDemos({ store, rootDir: root, selection, now: nowDate });
    return { ok: report.ok, summary: `${report.built.length} built, ${report.failed.length} failed`, lines: formatReport(report, selection).split("\n") };
  });

  await run("pitches", async () => {
    const { buildPitches, formatReport } = await import("./build-pitches.js");
    const selection = { mode: "all", value: "" };
    const report = await buildPitches({ store, rootDir: root, selection, now: nowDate });
    return { ok: report.ok, summary: `${report.built.length} built, ${report.failed.length} failed`, lines: formatReport(report, selection).split("\n") };
  });

  await run("audit", async () => {
    const { formatAuditReport, runAudit } = await import("./audit.js");
    const report = await runAudit({ root, store, selection: { mode: "all" }, now: nowDate, engine });
    const failed = report.audited.filter((a) => !a.audit.pass).length;
    return { ok: report.ok, summary: `${report.audited.length} audited, ${failed} failed, ${report.skipped.length} skipped`, lines: formatAuditReport(report).split("\n") };
  });

  await run("check", async () => {
    const { main } = await import("./check.js");
    const out = capture();
    const code = await main(["--root", root], { stdout: out.stream, stderr: out.stream, now: nowDate.toISOString() });
    return { ok: code === 0, summary: out.lines[out.lines.length - 1] || `exit ${code}`, lines: out.lines };
  });

  await run("typecheck", async () => {
    const { typecheck } = await import("./typecheck.js");
    // The code is typechecked where it lives; --root only moves the data.
    const r = typecheck({ stdio: "pipe" });
    return { ok: r.ok, summary: r.message, lines: [...String(r.output || "").trim().split("\n").filter(Boolean), r.message] };
  });

  return { ok: steps.every((s) => s.ok), steps };
}

export function formatBuildReport(report) {
  const lines = [];
  for (const s of report.steps) {
    lines.push(`${s.skipped ? "skip" : s.ok ? "ok  " : "FAIL"}  ${s.name.padEnd(9)} ${s.summary}`);
    if (!s.ok) for (const l of s.lines.slice(0, 60)) lines.push(`      ${l}`);
  }
  const failed = report.steps.filter((s) => !s.ok).map((s) => s.name);
  lines.push(failed.length ? `Build failed: ${failed.join(", ")}.` : "Build passed. Everything stays on this machine; nothing was published or sent.");
  return lines.join("\n");
}

async function main() {
  const args = parseBuildArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    return 0;
  }
  if (args.errors.length) {
    console.error(`${args.errors.join("\n")}\n${USAGE}`);
    return 2;
  }
  const report = await runBuild({ root: args.root, skip: args.skip, now: new Date() });
  const text = formatBuildReport(report);
  if (report.ok) console.log(text);
  else console.error(text);
  return report.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then((code) => {
    process.exitCode = code;
  }, (err) => {
    console.error(`build failed: ${err.message}`);
    process.exitCode = 1;
  });
}
