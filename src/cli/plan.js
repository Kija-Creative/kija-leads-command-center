// npm run plan [-- --date YYYY-MM-DD]
// Prints this week's rotation and writes data/inbox/<runId>.plan.json for the weekly run.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createStore, INBOX_DIR } from "../lib/store.js";
import { isIsoDate } from "../lib/validate.js";
import { dateOf, planWeek } from "../lib/week.js";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const USAGE = "Usage: npm run plan [-- --date YYYY-MM-DD] [--json] [--root <dir>]";

export async function main(argv = process.argv.slice(2), deps = {}) {
  const out = deps.stdout ?? process.stdout;
  const err = deps.stderr ?? process.stderr;
  const say = (line = "") => out.write(`${line}\n`);

  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        date: { type: "string" },
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
  if (values.date !== undefined && !isIsoDate(values.date)) {
    err.write(`--date must be a date like 2026-09-28; got ${JSON.stringify(values.date)}.\n`);
    return 2;
  }

  const root = path.resolve(values.root ?? deps.root ?? PROJECT_ROOT);
  const store = createStore(root);
  const clock = deps.now ? new Date(deps.now) : new Date();
  const date = values.date ?? dateOf(clock);
  const state = store.load();
  const plan = planWeek({ now: date, ...state });

  const file = {
    ...plan,
    generatedAt: clock.toISOString(),
    thresholds: state.settings.thresholds,
    categoryDetails: plan.categories.map((key) => {
      const c = state.categories[key] ?? {};
      return { key, label: c.label ?? key, vertical: c.vertical ?? "", searchTerms: c.searchTerms ?? [], placesTypes: c.placesTypes ?? [], focusNote: c.focusNote ?? "" };
    }),
    chainsFile: "config/chains.json",
  };
  const rel = `${INBOX_DIR}/${plan.runId}.plan.json`;
  store.writeJson(rel, file, { backup: false });

  if (values.json) {
    say(JSON.stringify(file, null, 2));
    return 0;
  }
  const home = plan.metros.find((m) => m.key === plan.homeMetro);
  say(`Week ${plan.week}, run ${plan.runId} (rotation week ${plan.weekIndex}).`);
  say(`Metros: ${plan.metros.map((m) => `${m.name} (${m.states.join(", ")})`).join("; ") || "none"}.`);
  if (home) say(`Home metro ${home.name} is included, capped at ${plan.homeMaxLeads ?? "no"} new leads.`);
  say(`Categories: ${file.categoryDetails.map((c) => c.label).join(", ") || "none"}.`);
  say(`Quota: ${plan.quota} new leads. ${plan.excludedBusinesses.length} known businesses are excluded.`);
  say(`Wrote ${rel}.`);
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
      process.stderr.write(`plan failed: ${e?.message || e}\n`);
      process.exitCode = 1;
    },
  );
}
