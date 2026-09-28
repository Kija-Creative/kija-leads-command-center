// npm run discover -- --plan data/inbox/<runId>.plan.json
//   [--terms 1] [--anchors 3] [--pages 3] [--max-requests 300] [--dry-run] [--out path]
//
// Google Places API (New) Text Search discovery for the weekly run. For each
// metro anchor city times category search term it pages through results (up
// to 3 pages of 20), keeps OPERATIONAL places with no website or only a third
// party one (flagged), rating and reviews at or above the settings floors,
// not a chain and not already in leads, queue or rejected. Writes
// data/inbox/<runId>.candidates.json. Candidates are starting points to verify,
// never finished leads.
//
// Google Maps Platform terms limit caching Places content: place IDs may be
// stored, but other content (names, ratings, review counts, phones, addresses,
// website fields) must be refreshed or deleted within 30 days. Every candidate
// carries placesFetchedAt and the file carries placesContentDeleteBy.
//
// Without GOOGLE_PLACES_API_KEY (environment or .env) it exits 0 and says the
// weekly run falls back to web research. The key is never printed or written.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { resolveSecret } from "../discovery/env.js";
import { planDiscovery, runDiscovery, DISCOVER_DEFAULTS } from "../discovery/discover.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const KEY_NAME = "GOOGLE_PLACES_API_KEY";

const USAGE = `Usage: npm run discover -- --plan data/inbox/<runId>.plan.json [options]
  --terms N         search terms per category (default ${DISCOVER_DEFAULTS.termsPerCategory})
  --anchors N       anchor cities per metro (default ${DISCOVER_DEFAULTS.anchorsPerMetro})
  --pages N         pages per search, 1 to 3 (default ${DISCOVER_DEFAULTS.maxPages})
  --max-requests N  hard cap on Places requests (default ${DISCOVER_DEFAULTS.maxRequests})
  --dry-run         print the searches and the request estimate, call nothing
  --out PATH        write somewhere other than data/inbox/<runId>.candidates.json`;

const NO_KEY_MESSAGE = `${KEY_NAME} is not set in the environment or in .env, so Places discovery was skipped.
Nothing was called. The weekly run falls back to web research: follow WEEKLY_RUN.md, step 2B.`;

async function readText(file) {
  try {
    return await fs.readFile(file, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

async function readJson(file, fallback, { required = false } = {}) {
  const text = await readText(file);
  if (text === null) {
    if (required) throw new Error(`Missing ${file}.`);
    return fallback;
  }
  try {
    return JSON.parse(text.replace(/^﻿/, ""));
  } catch (e) {
    throw new Error(`Could not parse ${file}: ${e.message}`);
  }
}

async function writeJsonAtomic(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tmp, file);
}

function intOption(values, name, fallback, min, max) {
  if (values[name] === undefined) return fallback;
  const n = Number(values[name]);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`--${name} must be a whole number from ${min} to ${max}.`);
  }
  return n;
}

// The plan file is planWeek output; accept it wrapped as { plan } too.
function unwrapPlan(raw) {
  if (raw && Array.isArray(raw.metros)) return raw;
  if (raw?.plan && Array.isArray(raw.plan.metros)) return { runId: raw.runId, ...raw.plan };
  throw new Error("The plan file has no metros list. Create it with npm run plan.");
}

function relative(root, file) {
  const rel = path.relative(root, file);
  return rel && !rel.startsWith("..") ? rel.split(path.sep).join("/") : file;
}

function formatDropped(dropped) {
  const labels = {
    notOperational: "not operational",
    ownedWebsite: "with an owned website",
    lowRating: "below the rating floor",
    fewReviews: "below the review floor",
    outsideMetro: "outside the metro's states",
    chain: "chains or franchises",
    known: "already in leads, queue or rejected",
    duplicateInRun: "duplicates within this run",
    missingIdOrName: "missing an id or name",
  };
  const parts = Object.entries(dropped)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${labels[k] ?? k}`);
  return parts.length ? parts.join(", ") : "none";
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
        plan: { type: "string" },
        root: { type: "string" },
        terms: { type: "string" },
        anchors: { type: "string" },
        pages: { type: "string" },
        "max-requests": { type: "string" },
        "dry-run": { type: "boolean", default: false },
        out: { type: "string" },
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
  if (!values.plan) {
    err.write(`--plan is required.\n${USAGE}\n`);
    return 2;
  }

  let options;
  try {
    options = {
      termsPerCategory: intOption(values, "terms", DISCOVER_DEFAULTS.termsPerCategory, 1, 10),
      anchorsPerMetro: intOption(values, "anchors", DISCOVER_DEFAULTS.anchorsPerMetro, 1, 20),
      maxPages: intOption(values, "pages", DISCOVER_DEFAULTS.maxPages, 1, 3),
      maxRequests: intOption(values, "max-requests", DISCOVER_DEFAULTS.maxRequests, 1, 5000),
    };
  } catch (e) {
    err.write(`${e.message}\n`);
    return 2;
  }

  const root = path.resolve(values.root ?? deps.root ?? PROJECT_ROOT);
  const dryRun = values["dry-run"];
  const env = deps.env ?? process.env;
  const secret = resolveSecret(KEY_NAME, env, await readText(path.join(root, ".env")));
  if (!secret.value && !dryRun) {
    say(NO_KEY_MESSAGE);
    return 0;
  }

  const planPath = path.resolve(root, values.plan);
  const plan = unwrapPlan(await readJson(planPath, null, { required: true }));
  const [settings, categories, geography, chains, leads, queue, rejected] = await Promise.all([
    readJson(path.join(root, "config", "settings.json"), null, { required: true }),
    readJson(path.join(root, "config", "categories.json"), null, { required: true }),
    readJson(path.join(root, "config", "geography.json"), { metros: [] }),
    readJson(path.join(root, "config", "chains.json"), { names: [] }),
    readJson(path.join(root, "data", "leads.json"), []),
    readJson(path.join(root, "data", "queue.json"), []),
    readJson(path.join(root, "data", "rejected.json"), []),
  ]);

  const runId = plan.runId || path.basename(planPath).replace(/\.plan\.json$/, "");
  const { jobs, notes, estimate } = planDiscovery({ plan, categories, geography, options });
  const metroCount = new Set(jobs.map((j) => j.metro)).size;
  const catCount = new Set(jobs.map((j) => j.categoryKey)).size;

  say(`Places discovery for run ${runId}`);
  say(`Plan: ${metroCount} metros, ${catCount} categories, up to ${options.anchorsPerMetro} anchor cities per metro and ${options.termsPerCategory} search term per category: ${jobs.length} searches.`);
  say(`Estimated Places requests: ${estimate.minRequests} to ${estimate.maxRequests} (${options.maxPages} pages at most per search, cap ${options.maxRequests}), billed as ${estimate.sku}.`);
  for (const note of notes) say(`Note: ${note}`);

  if (dryRun) {
    for (const job of jobs) say(`  ${job.metro}: ${job.textQuery}`);
    say("Dry run: nothing was called.");
    return 0;
  }
  if (!jobs.length) {
    say("No searches to run. Check that the plan lists metros and categories that exist in config.");
    return 1;
  }

  // Core normalize functions, loaded only when there is real work to do.
  const normalize = deps.normalize ?? (await import("../lib/normalize.js"));
  const discoveryDeps = {
    normalizeName: (name) => normalize.normalizeName(name),
    dedupeKey: (record) => normalize.dedupeKey(record),
    isChain: (name) => normalize.isChain(name, chains),
  };

  const file = await runDiscovery({
    plan: { ...plan, runId },
    settings,
    categories,
    geography,
    state: { leads, queue, rejected },
    deps: discoveryDeps,
    apiKey: secret.value,
    fetch: deps.fetch ?? globalThis.fetch,
    now: deps.now ?? new Date(),
    options,
    log: (line) => say(line),
  });

  const outPath = values.out ? path.resolve(root, values.out) : path.join(root, "data", "inbox", `${runId}.candidates.json`);
  await writeJsonAtomic(outPath, file);

  const c = file.counts;
  say(`Requests made: ${c.requests}. Places returned: ${c.placesReturned}. Kept: ${c.kept} (${c.thirdPartyFlagged} with only a third party website, flagged).`);
  say(`Dropped: ${formatDropped(c.dropped)}.`);
  if (file.errors.length) say(`Errors: ${file.errors.length} requests failed. See "errors" in the file.`);
  say(`Wrote ${relative(root, outPath)}. Places content in it must be refreshed or deleted by ${file.placesContentDeleteBy}.`);
  say("Next: every candidate still needs the five verification checks in WEEKLY_RUN.md before it can be a lead.");
  if (file.fatal) {
    err.write(`Places discovery stopped early: ${file.fatal}\n`);
    return 1;
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
      process.stderr.write(`discover failed: ${e?.message || e}\n`);
      process.exitCode = 1;
    },
  );
}
