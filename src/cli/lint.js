// npm run lint [-- <paths...>]
//
// ESLint over the project's JavaScript and TypeScript with a built in flat config (this project
// has no eslint.config file and never installs packages). ESLint, @eslint/js, globals and the
// TypeScript parser are borrowed from ./node_modules, KIJA_TOOLS_DIR or ../kija-os/node_modules,
// the same search as npm run typecheck. When ESLint is not found the script says so and exits 1;
// when the TypeScript parser is missing, .ts files are skipped with a notice (npm run typecheck
// still covers them).

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { toolDirs } from "./typecheck.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
// workflows/*.js are Workflow tool scripts (top level await and return inside a function body),
// not ES modules, so ESLint cannot parse them; they are left out on purpose.
const DEFAULT_TARGETS = ["src", "server", "app", "test", "design-intelligence"];
// The engine and its command line tools are held to errors for unused code; older modules get
// warnings so hygiene debt is visible without hiding real bugs among it.
const STRICT_FILES = ["src/design-intelligence/**", "design-intelligence/**", "src/cli/typecheck.js", "src/cli/lint.js", "src/cli/dna.js", "src/cli/brief.js", "src/cli/audit.js", "src/cli/build.js", "test/di-*"];
const IGNORES = ["workflows/**", "**/node_modules/**", ".design-references/**", "demos/**", "pitches/**", "exports/**", "test-output/**", "data/**", "research/**", "seed/**"];

// Resolves a package from the tool folders, also through the packages that bundle it.
function resolveFrom(dirs, request, via = []) {
  for (const dir of dirs) {
    const anchors = [path.join(dir, "..", "noop.js"), ...via.map((p) => path.join(dir, p, "package.json"))];
    for (const anchor of anchors) {
      try {
        return createRequire(anchor).resolve(request);
      } catch {
        // try the next anchor
      }
    }
  }
  return null;
}

async function load(file) {
  const mod = await import(pathToFileURL(file).href);
  return mod.default && Object.keys(mod).length <= 2 ? mod.default : mod;
}

export async function lint({ root = PROJECT_ROOT, env = process.env, targets = DEFAULT_TARGETS } = {}) {
  const dirs = toolDirs(root, env);
  const eslintFile = resolveFrom(dirs, "eslint");
  if (!eslintFile) {
    return { ok: false, ran: false, text: "Lint did not run: ESLint was not found in ./node_modules, in KIJA_TOOLS_DIR or in ../kija-os/node_modules. Nothing was checked." };
  }
  const { ESLint } = await import(pathToFileURL(eslintFile).href);
  const jsFile = resolveFrom(dirs, "@eslint/js", ["eslint"]);
  const globalsFile = resolveFrom(dirs, "globals", ["eslint", "@eslint/eslintrc"]);
  const tsFile = resolveFrom(dirs, "typescript-eslint", ["eslint-config-next"]) || resolveFrom(dirs, "@typescript-eslint/parser", ["eslint-config-next"]);
  const js = jsFile ? await load(jsFile) : null;
  const globals = globalsFile ? await load(globalsFile) : { node: {}, browser: {} };
  const ts = tsFile ? await load(tsFile) : null;
  const tsParser = ts ? ts.parser || ts : null;
  const notes = [];
  if (!js) notes.push("@eslint/js was not found, so only the project rules ran.");
  if (!tsParser) notes.push("The TypeScript parser was not found, so .ts files were skipped (npm run typecheck covers them).");

  const nodeGlobals = { ...(globals.node || {}), ...(globals.es2024 || globals.es2021 || {}) };
  const unusedOptions = { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" };
  const config = [
    { ignores: IGNORES },
    ...(js ? [js.configs.recommended] : []),
    { files: ["**/*.js", "**/*.mjs"], languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: nodeGlobals }, rules: { "no-unused-vars": ["warn", unusedOptions], "no-regex-spaces": "warn", "no-irregular-whitespace": ["error", { skipRegExps: true, skipStrings: true, skipTemplates: true }] } },
    { files: STRICT_FILES.filter((p) => !p.endsWith(".ts")), ignores: ["**/*.ts"], rules: { "no-unused-vars": ["error", unusedOptions] } },
    { files: ["app/**/*.js"], languageOptions: { globals: { ...(globals.browser || {}), ...nodeGlobals } } },
    ...(tsParser
      ? [{ files: ["**/*.ts"], languageOptions: { parser: tsParser, ecmaVersion: "latest", sourceType: "module", globals: nodeGlobals }, rules: { "no-unused-vars": "off", "no-undef": "off", "no-redeclare": "off", "no-dupe-class-members": "off" } }]
      : [{ ignores: ["**/*.ts"] }]),
    { rules: { "no-constant-condition": ["error", { checkLoops: false }], eqeqeq: ["error", "smart"], "no-var": "error", "prefer-const": "error" } },
  ];
  const eslint = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: config, errorOnUnmatchedPattern: false });
  const patterns = targets.map((t) => (/[*?]/.test(t) || /\.(js|mjs|ts)$/.test(t) ? t : `${t.replace(/[\\/]+$/, "")}/**/*.{js,mjs${tsParser ? ",ts" : ""}}`));
  const results = await eslint.lintFiles(patterns);
  const formatter = await eslint.loadFormatter("stylish");
  const errors = results.reduce((s, r) => s + r.errorCount, 0);
  const warnings = results.reduce((s, r) => s + r.warningCount, 0);
  const version = ESLint.version || "";
  const summary = `Lint ${errors ? "failed" : "passed"}: ESLint ${version} over ${results.length} files, ${errors} errors, ${warnings} warnings.`;
  return { ok: errors === 0, ran: true, errors, warnings, files: results.length, text: [String(await formatter.format(results)).trim(), ...notes, summary].filter(Boolean).join("\n") };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  lint({ targets: args.length ? args : DEFAULT_TARGETS }).then((r) => {
    if (r.ok) console.log(r.text);
    else console.error(r.text);
    process.exitCode = r.ok ? 0 : 1;
  }, (err) => {
    console.error(`lint failed: ${err.message}`);
    process.exitCode = 1;
  });
}
