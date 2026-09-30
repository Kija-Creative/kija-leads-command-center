// Component dialects: design-intelligence/components/<dialect>/dialect.json plus the dialect's
// primitives module (primitives.ts). A dialect is how buttons, cards, headings, form fields and
// placeholder slots look and behave for one design language. Behaviour may follow shadcn,
// Radix, Preline and the other libraries; appearance always comes from the Site DNA tokens.
// A compound dialect ("editorial-luxury") extends parents: it inherits their lists and the
// first parent's primitives unless it ships its own.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { FontPairing, ResolvedPalette, SiteDNA, ValidationResult } from "./schema.ts";
import type { GeometryTokens, MotionRules } from "./design-tokens.ts";
import { isPlainObject, isStringList, KEBAB_RE, PROJECT_ROOT, readJson, relative, uniq } from "./util.ts";

export interface DialectDefinition {
  id: string;
  label: string;
  summary: string;
  extends?: string[];
  allowed: string[];            // human readable, as in SPEC-site-dna.md
  forbidden: string[];          // human readable, as in SPEC-site-dna.md
  forbiddenPatterns: string[];  // machine keys the audit can check (design-tokens.ts DETECTABLE_PATTERNS)
  behaviors: string[];          // behaviour sources, e.g. "shadcn Dialog behavior"
  primitives?: string;          // module path relative to the dialect folder, default "primitives.ts"
}

// What every primitive receives: the full visual system, so a primitive never picks a colour,
// font or radius of its own.
export interface PrimitiveTheme {
  dna: SiteDNA;
  palette: ResolvedPalette;
  fonts: FontPairing;
  geometry: GeometryTokens;
  motion: MotionRules;
}

export interface ButtonInput {
  label: string;                // plain text; primitives escape it
  href: string;
  variant: "primary" | "secondary" | "quiet";
  cta?: string;                 // ConversionKey, rendered as data-cta
  icon?: string;                // optional inline SVG markup (trusted, from src/demo/shared.js icon())
  attrs?: Record<string, string>;
}

export interface HeadingInput {
  title: string;
  level: 2 | 3;
  eyebrow?: string;
  intro?: string;
  align?: "start" | "center";
  id?: string;
}

export interface CardInput {
  title: string;
  body: string;
  meta?: string;
  media?: string;               // trusted <img> markup from the stock helpers
  level?: 3 | 4;
}

export interface FieldInput {
  id: string;
  name: string;
  label: string;
  type: "text" | "tel" | "email" | "date" | "time" | "textarea" | "select" | "file";
  required?: boolean;
  hint?: string;
  options?: string[];
  autocomplete?: string;
}

export interface PlaceholderInput {
  module: string;               // ModuleKey the slot stands in for
  title: string;
  body: string;                 // e.g. "Warranty details: to confirm with the owner."
}

export interface DialectPrimitives {
  dialect: string;
  css(theme: PrimitiveTheme): string;           // dialect base CSS, scoped to .dx-* classes
  button(input: ButtonInput): string;
  sectionHeading(input: HeadingInput): string;
  card(input: CardInput): string;
  field(input: FieldInput): string;
  placeholder(input: PlaceholderInput): string; // carries data-placeholder="owner-to-confirm"
}

export const PRIMITIVE_FUNCTIONS = ["css", "button", "sectionHeading", "card", "field", "placeholder"] as const;

export interface ResolvedDialect {
  id: string;
  label: string;
  summary: string;
  parents: string[];
  allowed: string[];
  forbidden: string[];
  forbiddenPatterns: string[];
  behaviors: string[];
  primitivesPath: string;       // project relative path, "" when none
  primitives: DialectPrimitives | null;
}

export interface DialectRegistry {
  dialects: Map<string, ResolvedDialect>;
  errors: string[];
  warnings: string[];
}

export const DEFAULT_COMPONENTS_DIR = path.join(PROJECT_ROOT, "design-intelligence", "components");

export function validateDialect(value: unknown, where = "A dialect"): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isPlainObject(value)) return { ok: false, errors: [`${where} must be a JSON object.`], warnings };
  const name = typeof value.id === "string" ? `Dialect "${value.id}"` : where;
  if (typeof value.id !== "string" || !KEBAB_RE.test(value.id)) errors.push(`${name} needs a lowercase hyphenated id.`);
  for (const f of ["label", "summary"]) {
    if (typeof value[f] !== "string" || !String(value[f]).trim()) errors.push(`${name} needs a ${f}.`);
  }
  for (const f of ["allowed", "forbidden", "forbiddenPatterns", "behaviors"]) {
    if (!isStringList(value[f])) errors.push(`${name} ${f} must be a list of text values.`);
  }
  if (value.extends !== undefined && !isStringList(value.extends)) errors.push(`${name} extends must be a list of dialect ids.`);
  if (value.primitives !== undefined && typeof value.primitives !== "string") errors.push(`${name} primitives must be a module path relative to its folder.`);
  if (isStringList(value.allowed) && !value.allowed.length && !isStringList(value.extends)) warnings.push(`${name} allows nothing; the brief will give the builder no component guidance.`);
  return { ok: errors.length === 0, errors, warnings };
}

export function validatePrimitives(mod: unknown, where: string): ValidationResult {
  const errors: string[] = [];
  const p = isPlainObject(mod) ? mod.primitives : undefined;
  if (!isPlainObject(p)) return { ok: false, errors: [`${where} must export \`primitives\` (a DialectPrimitives object).`], warnings: [] };
  for (const fn of PRIMITIVE_FUNCTIONS) {
    if (typeof p[fn] !== "function") errors.push(`${where} primitives.${fn} must be a function.`);
  }
  if (typeof p.dialect !== "string") errors.push(`${where} primitives.dialect must name the dialect.`);
  return { ok: errors.length === 0, errors, warnings: [] };
}

// Loads every dialect folder, then resolves compounds. Async because primitives are modules.
export async function loadDialects(dir: string = DEFAULT_COMPONENTS_DIR): Promise<DialectRegistry> {
  const registry: DialectRegistry = { dialects: new Map(), errors: [], warnings: [] };
  let folders: string[];
  try {
    folders = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    registry.warnings.push(`No component dialect folder at ${relative(dir)}; briefs will carry no dialect lists.`);
    return registry;
  }
  const raw = new Map<string, { def: DialectDefinition; primitives: DialectPrimitives | null; primitivesPath: string }>();
  for (const folder of folders) {
    const file = path.join(dir, folder, "dialect.json");
    if (!fs.existsSync(file)) {
      registry.warnings.push(`${relative(path.join(dir, folder))} has no dialect.json, so it is skipped.`);
      continue;
    }
    const read = readJson(file);
    if (!read.ok) {
      registry.errors.push(read.error);
      continue;
    }
    const check = validateDialect(read.value, relative(file));
    registry.warnings.push(...check.warnings);
    if (!check.ok) {
      registry.errors.push(...check.errors);
      continue;
    }
    const def = read.value as DialectDefinition;
    if (def.id !== folder) {
      registry.errors.push(`${relative(file)} declares the dialect "${def.id}"; its folder must be named ${def.id}.`);
      continue;
    }
    const modFile = path.join(dir, folder, def.primitives || "primitives.ts");
    let primitives: DialectPrimitives | null = null;
    let primitivesPath = "";
    if (fs.existsSync(modFile)) {
      try {
        const mod: unknown = await import(pathToFileURL(modFile).href);
        const pcheck = validatePrimitives(mod, relative(modFile));
        if (pcheck.ok) {
          primitives = (mod as { primitives: DialectPrimitives }).primitives;
          primitivesPath = relative(modFile);
        } else {
          registry.errors.push(...pcheck.errors);
        }
      } catch (err) {
        registry.errors.push(`${relative(modFile)} failed to load: ${(err as Error).message}`);
      }
    } else if (def.primitives) {
      registry.errors.push(`${relative(file)} names primitives "${def.primitives}", but that file does not exist.`);
    }
    raw.set(def.id, { def, primitives, primitivesPath });
  }

  for (const [id, { def, primitives, primitivesPath }] of raw) {
    const parents = def.extends || [];
    const lists = { allowed: [...def.allowed], forbidden: [...def.forbidden], forbiddenPatterns: [...def.forbiddenPatterns], behaviors: [...def.behaviors] };
    let prim = primitives;
    let primPath = primitivesPath;
    for (const parentId of parents) {
      const parent = raw.get(parentId);
      if (!parent) {
        registry.warnings.push(`Dialect "${id}" extends "${parentId}", which has no folder yet; only its own lists apply.`);
        continue;
      }
      if (parent.def.extends && parent.def.extends.length) {
        registry.errors.push(`Dialect "${id}" extends "${parentId}", which is itself a compound; compounds may only extend base dialects.`);
        continue;
      }
      lists.allowed.push(...parent.def.allowed);
      lists.forbidden.push(...parent.def.forbidden);
      lists.forbiddenPatterns.push(...parent.def.forbiddenPatterns);
      lists.behaviors.push(...parent.def.behaviors);
      if (!prim && parent.primitives) {
        prim = parent.primitives;
        primPath = parent.primitivesPath;
      }
    }
    if (!prim) registry.warnings.push(`Dialect "${id}" has no primitives module yet; the renderer falls back to its own markup.`);
    registry.dialects.set(id, {
      id,
      label: def.label,
      summary: def.summary,
      parents,
      allowed: uniq(lists.allowed),
      forbidden: uniq(lists.forbidden),
      forbiddenPatterns: uniq(lists.forbiddenPatterns),
      behaviors: uniq(lists.behaviors),
      primitivesPath: primPath,
      primitives: prim,
    });
  }
  return registry;
}
