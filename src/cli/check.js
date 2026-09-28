// npm run check
// Validates every data and config file, scans for em and en dashes, runs the demo
// guardrails over demos/<id>/index.html and the pitch checks over pitches/<id>/index.html.
// Exit code 1 on any error.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { sameBusiness } from "../lib/normalize.js";
import { createStore, FILES, RUNS_DIR } from "../lib/store.js";
import {
  dashLocations,
  validateBenchmarks,
  validateCategories,
  validateChains,
  validateGeography,
  validateLead,
  validateQueueItem,
  validateRejection,
  validateSettings,
} from "../lib/validate.js";
import { dateOf } from "../lib/week.js";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const GUARDRAILS_URL = new URL("../demo/guardrails.js", import.meta.url);
const PITCH_URL = new URL("../pitch/render.js", import.meta.url);
const USAGE = "Usage: npm run check [-- --root <dir>]";

// Never scanned: VCS internals, installs, rotating backups and generated share files.
const SKIP_DIRS = new Set([".git", "node_modules", "data/backups", "exports", "test-output"]);
const BINARY_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".zip", ".gz", ".woff", ".woff2", ".ttf", ".otf", ".mp4", ".mov", ".webm", ".mp3"]);
const MAX_DASH_REPORTS_PER_FILE = 5;

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function walk(root, relDir, out) {
  let entries;
  try {
    entries = fs.readdirSync(path.join(root, relDir), { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const rel = relDir ? `${relDir}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(rel)) walk(root, rel, out);
    } else if (e.isFile()) {
      out.add(rel);
    }
  }
}

// Tracked files plus files git would track (not ignored), then data/, demos/ and pitches/.
// Outside a git checkout, walk the tree instead.
export function filesToScan(root) {
  const files = new Set();
  let fromGit = false;
  try {
    const listing = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const top = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    // Only trust git when root is the repository itself, not a folder inside another repo.
    if (path.resolve(top).toLowerCase() === path.resolve(root).toLowerCase()) {
      for (const f of listing.split("\0")) if (f) files.add(f);
      fromGit = true;
    }
  } catch {
    // no git, or not a repository
  }
  if (!fromGit) walk(root, "", files);
  for (const dir of ["data", "demos", "pitches"]) walk(root, dir, files);
  return [...files]
    .filter((f) => ![...SKIP_DIRS].some((d) => f === d || f.startsWith(`${d}/`)))
    .filter((f) => !f.endsWith(".tmp"))
    .sort();
}

export function scanDashes(root, files) {
  const errors = [];
  for (const rel of files) {
    if (BINARY_EXT.has(path.extname(rel).toLowerCase())) continue;
    let buf;
    try {
      buf = fs.readFileSync(path.join(root, rel));
    } catch {
      continue; // deleted since listing
    }
    if (buf.subarray(0, 8000).includes(0)) continue;
    const hits = dashLocations(buf.toString("utf8"));
    for (const h of hits.slice(0, MAX_DASH_REPORTS_PER_FILE)) {
      errors.push(`${rel}:${h.line}:${h.column} contains an ${h.char}. Use a comma, a period or a colon instead.`);
    }
    if (hits.length > MAX_DASH_REPORTS_PER_FILE) {
      errors.push(`${rel} has ${hits.length - MAX_DASH_REPORTS_PER_FILE} more em or en dashes.`);
    }
  }
  return errors;
}

function collect(target, label, r) {
  for (const e of r.errors) target.errors.push(`${label}: ${e}`);
  for (const w of r.warnings ?? []) target.warnings.push(`${label}: ${w}`);
}

export function checkData(root, { now } = {}) {
  const found = { errors: [], warnings: [] };
  const store = createStore(root);
  let state;
  try {
    state = store.load();
  } catch (e) {
    found.errors.push(e.message);
    return { ...found, state: null };
  }
  const { settings, categories, geography, chains, benchmarks, leads, queue, rejected } = state;

  collect(found, FILES.settings, validateSettings(settings));
  collect(found, FILES.categories, validateCategories(categories));
  collect(found, FILES.geography, validateGeography(geography));
  const home = settings?.geography?.homeMetro;
  if (home && !(geography?.metros ?? []).some((m) => m.key === home)) {
    found.errors.push(`${FILES.geography}: the home metro ${home} from settings is not in the metro list.`);
  }
  collect(found, FILES.chains, validateChains(chains));
  if (!fs.existsSync(store.path(FILES.benchmarks))) {
    found.warnings.push(`${FILES.benchmarks} is missing, so every ROI number shows as not researched. Run npm run seed to write the placeholder.`);
  } else {
    collect(found, FILES.benchmarks, validateBenchmarks(benchmarks, { categories }));
  }

  const ctx = { settings, categories, chains, geography, now, mode: "stored" };
  if (!Array.isArray(leads)) {
    found.errors.push(`${FILES.leads} must be a list of leads.`);
  } else {
    const ids = new Set();
    leads.forEach((lead, i) => {
      collect(found, FILES.leads, validateLead(lead, ctx));
      if (lead?.id) {
        if (ids.has(lead.id)) found.errors.push(`${FILES.leads}: the id ${lead.id} is used by more than one lead.`);
        ids.add(lead.id);
      }
      for (let j = 0; j < i; j += 1) {
        if (sameBusiness(lead, leads[j])) {
          found.errors.push(`${FILES.leads}: ${lead.business} (${lead.id}) duplicates ${leads[j].business} (${leads[j].id}) by phone or name and state.`);
        }
      }
    });
  }
  if (!Array.isArray(queue)) {
    found.errors.push(`${FILES.queue} must be a list of queue items.`);
  } else {
    const ids = new Set();
    for (const item of queue) {
      collect(found, FILES.queue, validateQueueItem(item, ctx));
      if (item?.id) {
        if (ids.has(item.id)) found.errors.push(`${FILES.queue}: the id ${item.id} is used by more than one queue item.`);
        ids.add(item.id);
      }
      const lead = Array.isArray(leads) ? leads.find((l) => sameBusiness(l, item)) : null;
      if (lead) found.warnings.push(`${FILES.queue}: ${item.candidate} is also a pipeline lead (${lead.id}).`);
    }
  }
  if (!Array.isArray(rejected)) {
    found.errors.push(`${FILES.rejected} must be a list of rejections.`);
  } else {
    for (const r of rejected) collect(found, FILES.rejected, validateRejection(r, ctx));
  }

  let runFiles = [];
  try {
    runFiles = fs.readdirSync(store.path(RUNS_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    // no runs yet
  }
  for (const f of runFiles) {
    const rel = `${RUNS_DIR}/${f}`;
    try {
      const run = store.readJson(rel);
      if (!run || typeof run.runId !== "string" || typeof run.counts !== "object") {
        found.errors.push(`${rel} is not a run report: it needs runId and counts.`);
      }
    } catch (e) {
      found.errors.push(e.message);
    }
  }
  return { ...found, state };
}

function listPages(root, folder) {
  const dir = path.join(root, folder);
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, "index.html")))
    .map((e) => e.name)
    .sort();
}

// The guardrails module belongs to the demo module and may not exist yet; that is a warning.
export async function checkDemos(root, leads, { importGuardrails = () => import(GUARDRAILS_URL.href) } = {}) {
  const found = { errors: [], warnings: [], scanned: 0 };
  const ids = listPages(root, "demos");
  if (ids.length === 0) return found;
  let guard;
  try {
    guard = await importGuardrails();
  } catch (e) {
    found.warnings.push(`The demo guardrails (src/demo/guardrails.js) could not be loaded, so ${ids.length} demo${ids.length === 1 ? " was" : "s were"} not scanned: ${e.message}`);
    return found;
  }
  const fn = guard?.checkDemoHtml ?? guard?.checkDemo ?? guard?.validateDemo;
  if (typeof fn !== "function") {
    found.warnings.push("src/demo/guardrails.js has no checkDemoHtml export, so the demos were not scanned.");
    return found;
  }
  for (const id of ids) {
    const rel = `demos/${id}/index.html`;
    const lead = (leads ?? []).find((l) => l.id === id);
    if (!lead) {
      found.warnings.push(`${rel} has no matching lead in data/leads.json, so it was not scanned.`);
      continue;
    }
    const html = fs.readFileSync(path.join(root, "demos", id, "index.html"), "utf8");
    let r;
    try {
      r = await fn(html, lead);
    } catch (e) {
      found.errors.push(`${rel}: the guardrail check threw: ${e.message}`);
      continue;
    }
    found.scanned += 1;
    const errs = Array.isArray(r) ? r : r?.errors ?? [];
    for (const e of errs) found.errors.push(`${rel}: ${e}`);
    for (const w of Array.isArray(r) ? [] : r?.warnings ?? []) found.warnings.push(`${rel}: ${w}`);
  }
  return found;
}

// Same idea for pitch pages: checkPitchHtml lives in the pitch module.
export async function checkPitches(root, leads, settings, { importPitch = () => import(PITCH_URL.href) } = {}) {
  const found = { errors: [], warnings: [], scanned: 0 };
  const ids = listPages(root, "pitches");
  if (ids.length === 0) return found;
  let fn;
  try {
    fn = (await importPitch())?.checkPitchHtml;
  } catch (e) {
    found.warnings.push(`The pitch checks (src/pitch/render.js) could not be loaded, so ${ids.length} pitch page${ids.length === 1 ? " was" : "s were"} not scanned: ${e.message}`);
    return found;
  }
  if (typeof fn !== "function") {
    found.warnings.push("src/pitch/render.js has no checkPitchHtml export, so the pitch pages were not scanned.");
    return found;
  }
  for (const id of ids) {
    const rel = `pitches/${id}/index.html`;
    const lead = (leads ?? []).find((l) => l.id === id);
    if (!lead) {
      found.warnings.push(`${rel} has no matching lead in data/leads.json, so it was not scanned.`);
      continue;
    }
    const html = fs.readFileSync(path.join(root, "pitches", id, "index.html"), "utf8");
    let r;
    try {
      r = await fn(html, lead, { settings });
    } catch (e) {
      found.errors.push(`${rel}: the pitch check threw: ${e.message}`);
      continue;
    }
    found.scanned += 1;
    for (const e of r?.errors ?? []) found.errors.push(`${rel}: ${e}`);
    for (const w of r?.warnings ?? []) found.warnings.push(`${rel}: ${w}`);
  }
  return found;
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const out = deps.stdout ?? process.stdout;
  const err = deps.stderr ?? process.stderr;
  const say = (line = "") => out.write(`${line}\n`);

  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
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

  const root = path.resolve(values.root ?? deps.root ?? PROJECT_ROOT);
  const now = dateOf(deps.now ? new Date(deps.now) : new Date());
  const data = checkData(root, { now });
  const files = filesToScan(root);
  const dashErrors = scanDashes(root, files);
  const demos = await checkDemos(root, data.state?.leads, deps);
  const pitches = await checkPitches(root, data.state?.leads, data.state?.settings, deps);

  const errors = [...data.errors, ...dashErrors, ...demos.errors, ...pitches.errors];
  const warnings = [...data.warnings, ...demos.warnings, ...pitches.warnings];
  for (const w of warnings) say(`warning  ${w}`);
  for (const e of errors) say(`error    ${e}`);
  const scope = `${files.length} files scanned for dashes, ${demos.scanned} demo${demos.scanned === 1 ? "" : "s"} checked against the guardrails, ${pitches.scanned} pitch page${pitches.scanned === 1 ? "" : "s"} checked`;
  if (errors.length) {
    say(`Check failed: ${errors.length} error${errors.length === 1 ? "" : "s"}, ${warnings.length} warning${warnings.length === 1 ? "" : "s"} (${scope}).`);
    return 1;
  }
  say(`Check passed with ${warnings.length} warning${warnings.length === 1 ? "" : "s"} (${scope}).`);
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
      process.stderr.write(`check failed: ${e?.message || e}\n`);
      process.exitCode = 1;
    },
  );
}
