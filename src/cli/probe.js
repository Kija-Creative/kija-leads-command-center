// npm run probe -- --name "GM AUTO CARE" --city "Dallas" --state TX [--phone "972-681-4966"]
//   [--extra "gmautocaretx.com,example.net"] [--max 64] [--timeout 45]
//
// Guesses the domains a business might own and checks each: DNS lookup, then
// one GET. Prints JSON evidence; its `check` object pastes straight into a
// lead's verification.checks. Only GET requests are ever sent: no forms, no
// posts, nothing that contacts the business.

import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { probeBusiness, PROBE_DEFAULTS } from "../discovery/probe.js";

const USAGE = `Usage: npm run probe -- --name "Business" --city "City" --state ST [--phone "NNN-NNN-NNNN"]
  --extra   comma separated domains to check first (for example one seen in search results)
  --max     most guessed domains to check (default ${PROBE_DEFAULTS.maxCandidates})
  --timeout total seconds before stopping (default ${PROBE_DEFAULTS.totalTimeoutMs / 1000})`;

function defaultLookup(host) {
  return dns.promises.lookup(host);
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const out = deps.stdout ?? process.stdout;
  const err = deps.stderr ?? process.stderr;
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        name: { type: "string" },
        city: { type: "string", default: "" },
        state: { type: "string", default: "" },
        phone: { type: "string", default: "" },
        extra: { type: "string", default: "" },
        max: { type: "string" },
        timeout: { type: "string" },
        help: { type: "boolean", short: "h" },
      },
      strict: true,
    }));
  } catch (e) {
    err.write(`${e.message}\n${USAGE}\n`);
    return 2;
  }
  if (values.help) {
    out.write(`${USAGE}\n`);
    return 0;
  }
  if (!values.name || !values.name.trim()) {
    err.write(`--name is required.\n${USAGE}\n`);
    return 2;
  }
  const overrides = {};
  if (values.max !== undefined) {
    const max = Number(values.max);
    if (!Number.isInteger(max) || max < 1) {
      err.write("--max must be a whole number of 1 or more.\n");
      return 2;
    }
    overrides.maxCandidates = max;
  }
  if (values.timeout !== undefined) {
    const seconds = Number(values.timeout);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      err.write("--timeout must be a number of seconds above 0.\n");
      return 2;
    }
    overrides.totalTimeoutMs = Math.round(seconds * 1000);
  }

  const evidence = await probeBusiness({
    name: values.name.trim(),
    city: values.city.trim(),
    state: values.state.trim().toUpperCase(),
    phone: values.phone.trim(),
    extraDomains: values.extra.split(",").map((d) => d.trim()).filter(Boolean),
    lookup: deps.lookup ?? defaultLookup,
    fetch: deps.fetch ?? globalThis.fetch,
    now: deps.now ?? new Date(),
    ...overrides,
  });
  out.write(`${JSON.stringify(evidence, null, 2)}\n`);
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
      process.stderr.write(`probe failed: ${e?.stack || e}\n`);
      process.exitCode = 1;
    },
  );
}
