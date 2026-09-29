// npm run purge-places [-- --older-than-days N] [--dry-run]
// Deletes discovery candidate files (data/inbox/*.candidates.json). They hold Places content,
// and Google's terms let us keep only place IDs (research/places-api.md), so they go once the
// run has used them. By default every candidates file is removed.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { candidateFileAgeDays, createStore, INBOX_DIR } from "../lib/store.js";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const USAGE = "Usage: npm run purge-places [-- --older-than-days N] [--dry-run] [--root <dir>]";

function ageText(days) {
  if (!Number.isFinite(days)) return "age unknown";
  if (days < 1) return "under a day old";
  const whole = Math.floor(days);
  return `${whole} day${whole === 1 ? "" : "s"} old`;
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
        "older-than-days": { type: "string" },
        "dry-run": { type: "boolean", default: false },
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
  let minAge = null;
  if (values["older-than-days"] !== undefined) {
    minAge = Number(values["older-than-days"]);
    if (!/^\d+(\.\d+)?$/.test(values["older-than-days"]) || !Number.isFinite(minAge)) {
      err.write(`--older-than-days must be a number of days such as 1; got ${JSON.stringify(values["older-than-days"])}.\n`);
      return 2;
    }
  }

  const root = path.resolve(values.root ?? deps.root ?? PROJECT_ROOT);
  const store = createStore(root);
  const now = deps.now ? new Date(deps.now) : new Date();
  const files = store.listCandidateFiles();
  const doomed = files.filter((f) => minAge === null || candidateFileAgeDays(f, now) > minAge);
  const kept = files.length - doomed.length;

  if (doomed.length === 0) {
    say(files.length === 0
      ? `No candidates files in ${INBOX_DIR}, so there is nothing to purge.`
      : `No candidates file is older than ${minAge} day${minAge === 1 ? "" : "s"}; kept ${kept}.`);
    return 0;
  }
  for (const f of doomed) {
    if (!values["dry-run"]) store.removeCandidateFile(f.name);
    say(`${values["dry-run"] ? "Would remove" : "Removed"} ${f.rel} (${ageText(candidateFileAgeDays(f, now))}).`);
  }
  const verb = values["dry-run"] ? "Dry run: would remove" : "Removed";
  say(`${verb} ${doomed.length} candidates file${doomed.length === 1 ? "" : "s"}${kept ? `, kept ${kept} newer` : ""}. Place IDs already on leads are kept.`);
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
      process.stderr.write(`purge-places failed: ${e?.message || e}\n`);
      process.exitCode = 1;
    },
  );
}
