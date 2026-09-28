// npm run seed [-- --force] [--seed seed/sheet-2026-09-28.json]
// Builds data/leads.json, data/queue.json and data/rejected.json from the sheet export,
// and installs research/benchmarks.json (or the placeholder when research is missing) as
// data/benchmarks.json, unless data/benchmarks.json already holds researched values.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createStore, FILES } from "../lib/store.js";
import { isPlaceholderBenchmarks, placeholderBenchmarks, seedToData } from "../lib/seed.js";
import { validateBenchmarks, validateLead, validateQueueItem } from "../lib/validate.js";
import { dateOf } from "../lib/week.js";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const USAGE = "Usage: npm run seed [-- --force] [--seed <file>] [--root <dir>]";

function newestSeed(root) {
  const dir = path.join(root, "seed");
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^sheet-.*\.json$/.test(f)).sort() : [];
  return files.length ? path.join(dir, files[files.length - 1]) : null;
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
        force: { type: "boolean", default: false },
        seed: { type: "string" },
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
  const store = createStore(root);
  const now = deps.now ? new Date(deps.now) : new Date();

  const existing = store.readJson(FILES.leads, []);
  if (Array.isArray(existing) && existing.length > 0 && !values.force) {
    err.write(`data/leads.json already has ${existing.length} leads, so nothing was changed. Run npm run seed -- --force to replace them; the current files are backed up to data/backups/ first.\n`);
    return 1;
  }

  const seedPath = values.seed ? path.resolve(root, values.seed) : newestSeed(root);
  if (!seedPath || !fs.existsSync(seedPath)) {
    err.write("No seed file found. Expected seed/sheet-<date>.json.\n");
    return 1;
  }
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const state = store.load();
  const { leads, queue, rejected } = seedToData(seed, { now, thresholds: state.settings.thresholds });

  // Refuse to write records that would fail npm run check.
  const ctx = { settings: state.settings, categories: state.categories, chains: state.chains, geography: state.geography, now: now.toISOString(), mode: "stored" };
  const problems = [];
  for (const lead of leads) {
    const v = validateLead(lead, ctx);
    if (!v.ok) problems.push(...v.errors);
  }
  for (const item of queue) {
    const v = validateQueueItem(item, ctx);
    if (!v.ok) problems.push(...v.errors);
  }
  if (problems.length) {
    err.write(`The seed did not validate, so nothing was written:\n${problems.map((p) => `  ${p}`).join("\n")}\n`);
    return 1;
  }

  store.saveLeads(leads);
  store.saveQueue(queue);
  const rejectedPath = store.path(FILES.rejected);
  if (values.force || !fs.existsSync(rejectedPath)) store.saveRejected(rejected);

  let benchmarkNote = "kept the existing data/benchmarks.json (it has researched sources)";
  const benchmarksPath = store.path(FILES.benchmarks);
  const current = fs.existsSync(benchmarksPath) ? store.readJson(FILES.benchmarks) : null;
  if (!current || isPlaceholderBenchmarks(current)) {
    // research/benchmarks.json is the research module's sourced file; use it when it validates.
    const researchPath = path.join(root, "research", "benchmarks.json");
    let researched = null;
    if (fs.existsSync(researchPath)) {
      try {
        const candidate = JSON.parse(fs.readFileSync(researchPath, "utf8"));
        if (validateBenchmarks(candidate, { categories: state.categories }).ok) researched = candidate;
      } catch {
        researched = null;
      }
    }
    if (researched) {
      store.saveBenchmarks(researched);
      benchmarkNote = "installed research/benchmarks.json as data/benchmarks.json";
    } else {
      store.saveBenchmarks(placeholderBenchmarks(state.categories, { updatedAt: dateOf(now) }));
      benchmarkNote = "wrote the placeholder data/benchmarks.json (not researched)";
    }
  }

  say(`Imported ${leads.length} leads and ${queue.length} queue items from ${path.relative(root, seedPath).split(path.sep).join("/")}.`);
  say(`Also ${benchmarkNote}.`);
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
      process.stderr.write(`seed failed: ${e?.message || e}\n`);
      process.exitCode = 1;
    },
  );
}
