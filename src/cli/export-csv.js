// npm run export
// Writes exports/lead-pipeline-<date>.csv in the sheet's Lead Pipeline column order.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { leadsToCsv } from "../lib/csv.js";
import { createStore } from "../lib/store.js";
import { isIsoDate } from "../lib/validate.js";
import { dateOf } from "../lib/week.js";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const USAGE = "Usage: npm run export [-- --date YYYY-MM-DD] [--root <dir>]";

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
  const { leads, settings } = store.load();
  const date = values.date ?? dateOf(deps.now ? new Date(deps.now) : new Date());
  const csv = leadsToCsv(leads, { thresholds: settings.thresholds });

  const dir = path.join(root, "exports");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `lead-pipeline-${date}.csv`);
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, csv, "utf8");
  fs.renameSync(tmp, file);
  say(`Wrote exports/lead-pipeline-${date}.csv with ${leads.length} leads.`);
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
      process.stderr.write(`export failed: ${e?.message || e}\n`);
      process.exitCode = 1;
    },
  );
}
