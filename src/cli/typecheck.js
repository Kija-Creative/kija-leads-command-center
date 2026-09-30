// npm run typecheck
//
// Runs tsc --noEmit in strict mode over the Design Intelligence Engine (tsconfig.json:
// src/design-intelligence, design-intelligence/**/*.ts and test/**/*.ts). This project never
// installs packages, so the compiler is borrowed, in this order, from:
//   1. ./node_modules
//   2. the KIJA_TOOLS_DIR environment variable (a node_modules folder, or a folder that has one)
//   3. ../kija-os/node_modules
// When none has TypeScript the script says so and exits 1; it never reports a pass it did not run.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Candidate node_modules folders, best first, without duplicates or missing folders.
export function toolDirs(root = PROJECT_ROOT, env = process.env) {
  const out = [path.join(root, "node_modules")];
  const extra = String(env.KIJA_TOOLS_DIR || "").trim();
  if (extra) {
    const abs = path.resolve(root, extra);
    out.push(path.basename(abs) === "node_modules" ? abs : path.join(abs, "node_modules"), abs);
  }
  out.push(path.resolve(root, "..", "kija-os", "node_modules"));
  return [...new Set(out)].filter((d) => fs.existsSync(d));
}

// The first candidate folder holding `rel` (a path inside node_modules), or null.
export function findInTools(rel, root = PROJECT_ROOT, env = process.env) {
  for (const dir of toolDirs(root, env)) {
    const file = path.join(dir, rel);
    if (fs.existsSync(file)) return { dir, file };
  }
  return null;
}

function packageVersion(dir, name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, name, "package.json"), "utf8")).version || "unknown";
  } catch {
    return "unknown";
  }
}

export function typecheck({ root = PROJECT_ROOT, env = process.env, stdio = "inherit" } = {}) {
  const tsc = findInTools(path.join("typescript", "bin", "tsc"), root, env);
  if (!tsc) {
    return {
      ok: false,
      ran: false,
      message: "Typecheck did not run: TypeScript was not found in ./node_modules, in KIJA_TOOLS_DIR or in ../kija-os/node_modules. Nothing was checked. Point KIJA_TOOLS_DIR at a node_modules folder that has typescript (this project never runs npm install).",
    };
  }
  const args = [tsc.file, "-p", path.join(root, "tsconfig.json"), "--pretty", "false"];
  // Node's type definitions come from the same place when the project has none of its own.
  if (!fs.existsSync(path.join(root, "node_modules", "@types", "node"))) {
    const types = findInTools(path.join("@types", "node", "package.json"), root, env);
    if (types) args.push("--typeRoots", path.join(types.dir, "@types"));
  }
  const version = packageVersion(tsc.dir, "typescript");
  const run = spawnSync(process.execPath, args, { cwd: root, stdio, encoding: "utf8" });
  const ok = run.status === 0;
  return {
    ok,
    ran: true,
    output: stdio === "inherit" ? "" : `${run.stdout || ""}${run.stderr || ""}`,
    message: ok
      ? `Typecheck passed: tsc ${version} (strict, noEmit) from ${tsc.dir}.`
      : `Typecheck failed: tsc ${version} from ${tsc.dir} reported errors (exit ${run.status}).`,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = typecheck();
  if (result.ok) console.log(result.message);
  else console.error(result.message);
  process.exitCode = result.ok ? 0 : 1;
}
