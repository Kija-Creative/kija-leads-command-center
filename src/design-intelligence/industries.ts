// Industry profiles: one typed module per industry in src/design-intelligence/industries/,
// discovered at runtime. Adding an industry is adding one file named <id>.ts that exports one
// IndustryProfile; nothing in the selection engine changes. Every profile is validated when it
// loads, with sentences that say what to fix.
//
// Lead classification comes from config/categories.json: each category carries "industry" and
// "subIndustry", so every category maps to exactly one profile.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  ATTRIBUTE_SIGNALS,
  BRAND_TRAITS,
  CONVERSION_KEYS,
  TREATMENT_AXES,
  GEOMETRY_STYLES,
  HERO_STYLES,
  IMAGERY_STYLES,
  LAYOUT_RHYTHMS,
  MOTION_STYLES,
  NAVIGATION_STYLES,
  TYPOGRAPHY_STYLES,
} from "./schema.ts";
import type {
  CategoryRegistry,
  Classification,
  IndustryArchetype,
  IndustryProfile,
  LeadRecord,
  MotionStyle,
  ValidationResult,
} from "./schema.ts";
import type { FamilyRegistry } from "./archetypes.ts";
import type { DialectRegistry } from "./component-dialects.ts";
import { dialectIdError, isDialectId } from "./component-dialects.ts";
import { paletteContrastErrors } from "./contrast.ts";
import { fontPairing, styleMeaning } from "./design-tokens.ts";
import { isModuleKey } from "./modules.ts";
import { isTrustSignalKey } from "./trust-signals.ts";
import { isPlainObject, isStringList, KEBAB_RE, PROJECT_ROOT, readJson, relative, unknownValues } from "./util.ts";

export const DEFAULT_INDUSTRIES_DIR = path.join(PROJECT_ROOT, "src", "design-intelligence", "industries");
export const DEFAULT_CATEGORIES_FILE = path.join(PROJECT_ROOT, "config", "categories.json");

export interface IndustryRegistry {
  profiles: Map<string, IndustryProfile>;
  files: Map<string, string>;   // industry id -> project relative file
  errors: string[];
  warnings: string[];
}

const AXIS_LISTS: readonly { key: keyof IndustryArchetype; vocab: readonly string[]; label: string }[] = [
  { key: "heroes", vocab: HERO_STYLES, label: "heroes" },
  { key: "navigation", vocab: NAVIGATION_STYLES, label: "navigation" },
  { key: "typography", vocab: TYPOGRAPHY_STYLES, label: "typography" },
  { key: "layoutRhythms", vocab: LAYOUT_RHYTHMS, label: "layoutRhythms" },
  { key: "geometries", vocab: GEOMETRY_STYLES, label: "geometries" },
  { key: "imagery", vocab: IMAGERY_STYLES, label: "imagery" },
  { key: "motion", vocab: MOTION_STYLES, label: "motion" },
];

const FREE_LISTS: readonly (keyof IndustryArchetype)[] = ["paletteFamilies", "ctaStyles", "proofStyles", "componentDialects"];
const TOKEN_NAMES = ["bg", "surface", "ink", "muted", "line", "primary", "on-primary", "accent"] as const;
const MOTION_ORDER: readonly MotionStyle[] = MOTION_STYLES;

export interface ProfileContext {
  file?: string;
  families?: FamilyRegistry;
  dialects?: DialectRegistry;
}

function checkModules(list: unknown, where: string, errors: string[]): void {
  if (!isStringList(list)) {
    errors.push(`${where} must be a list of module keys.`);
    return;
  }
  for (const k of list) {
    if (!isModuleKey(k)) errors.push(`${where} has "${k}", which is not a ModuleKey (schema.ts MODULE_KEYS). Add it there with a catalog entry in modules.ts, or use an existing key.`);
  }
}

// v2 treatments: every list optional, every value from its vocabulary (schema.ts TREATMENT_AXES).
function checkTreatments(value: unknown, where: string, errors: string[]): void {
  if (value === undefined) return;
  if (!isPlainObject(value)) {
    errors.push(`${where} treatments must be an object of lists (headerBehaviors, footerStyles, ...).`);
    return;
  }
  const known = new Set<string>(TREATMENT_AXES.map((t) => t.list));
  for (const k of Object.keys(value)) if (!known.has(k)) errors.push(`${where} treatments has "${k}", which is not one of: ${[...known].join(", ")}.`);
  for (const t of TREATMENT_AXES) {
    const list = value[t.list];
    if (list === undefined) continue;
    if (!isStringList(list) || !list.length) {
      errors.push(`${where} treatments.${t.list} must be a non empty list.`);
      continue;
    }
    for (const v of unknownValues(list, t.vocab)) errors.push(`${where} treatments.${t.list} has "${v}", which is not one of: ${t.vocab.join(", ")}.`);
  }
}

function validateArchetype(a: unknown, index: number, profile: Record<string, unknown>, ctx: ProfileContext, errors: string[], warnings: string[]): void {
  const pid = String(profile.id);
  if (!isPlainObject(a)) {
    errors.push(`Industry "${pid}" archetype ${index + 1} must be an object.`);
    return;
  }
  const name = `Industry "${pid}" archetype "${typeof a.id === "string" ? a.id : index + 1}"`;
  if (typeof a.id !== "string" || !KEBAB_RE.test(a.id)) errors.push(`${name} needs a lowercase hyphenated id.`);
  if (typeof a.label !== "string" || !a.label.trim()) errors.push(`${name} needs a label.`);
  if (!isStringList(a.suitableBrandTraits) || !a.suitableBrandTraits.length) errors.push(`${name} needs a non empty suitableBrandTraits list; archetypes are scored on trait fit first.`);
  else for (const t of unknownValues(a.suitableBrandTraits, BRAND_TRAITS)) errors.push(`${name} lists the brand trait "${t}", which is not in schema.ts BRAND_TRAITS.`);
  if (a.excludedBrandTraits !== undefined) {
    if (!isStringList(a.excludedBrandTraits)) errors.push(`${name} excludedBrandTraits must be a list of brand traits.`);
    else for (const t of unknownValues(a.excludedBrandTraits, BRAND_TRAITS)) errors.push(`${name} excludes the brand trait "${t}", which is not in schema.ts BRAND_TRAITS.`);
  }
  for (const { key, vocab, label } of AXIS_LISTS) {
    const list = a[key];
    if (!isStringList(list) || !list.length) {
      errors.push(`${name} needs at least one ${label} value.`);
      continue;
    }
    for (const v of unknownValues(list, vocab)) errors.push(`${name} ${label} has "${v}", which is not one of: ${vocab.join(", ")}.`);
    if (new Set(list).size !== list.length) errors.push(`${name} ${label} lists a value twice.`);
  }
  for (const key of FREE_LISTS) {
    const list = a[key];
    if (!isStringList(list) || !list.length) {
      errors.push(`${name} needs at least one ${String(key)} value.`);
      continue;
    }
    for (const v of list) if (!KEBAB_RE.test(v)) errors.push(`${name} ${String(key)} value "${v}" must be lowercase and hyphenated.`);
  }
  if (isStringList(a.componentDialects)) {
    for (const d of a.componentDialects) if (!isDialectId(d)) errors.push(dialectIdError(d, name));
  }
  if (typeof a.description !== "string" || !a.description.trim()) warnings.push(`${name} has no description; v2 lists it on every archetype and the brief quotes it.`);
  if (a.suitableSubIndustries !== undefined) {
    if (!isStringList(a.suitableSubIndustries)) errors.push(`${name} suitableSubIndustries must be a list of sub-industry ids.`);
    else if (isPlainObject(profile.subIndustries)) {
      for (const sub of a.suitableSubIndustries) if (!(sub in profile.subIndustries)) warnings.push(`${name} suits the sub-industry "${sub}", which the profile's subIndustries does not describe.`);
    }
  }
  if (a.prefersAttributes !== undefined) {
    if (!isStringList(a.prefersAttributes)) errors.push(`${name} prefersAttributes must be a list.`);
    else for (const v of unknownValues(a.prefersAttributes, ATTRIBUTE_SIGNALS)) errors.push(`${name} prefersAttributes has "${v}", which is not one of: ${ATTRIBUTE_SIGNALS.join(", ")}.`);
  }
  if (a.imageryDemand !== undefined && !["low", "medium", "high"].includes(String(a.imageryDemand))) errors.push(`${name} imageryDemand must be low, medium or high.`);
  if (a.permitsHighMotion !== undefined && typeof a.permitsHighMotion !== "boolean") errors.push(`${name} permitsHighMotion must be true or false.`);
  checkTreatments(a.treatments, name, errors);
  const palettes = isPlainObject(profile.palettes) ? profile.palettes : {};
  if (isStringList(a.paletteFamilies)) {
    for (const fam of a.paletteFamilies) {
      if (!isPlainObject(palettes[fam])) errors.push(`${name} names the palette family "${fam}", but the profile's palettes has no tokens for it. Add palettes["${fam}"] with label, tone and tokens (${TOKEN_NAMES.join(", ")}).`);
    }
  }
  const notes = isPlainObject(profile.styleNotes) ? (profile.styleNotes as Record<string, string>) : undefined;
  for (const key of ["ctaStyles", "proofStyles"] as const) {
    const list = a[key];
    if (!isStringList(list)) continue;
    for (const v of list) {
      if (styleMeaning(v, notes).startsWith("Apply \"")) warnings.push(`${name} ${key} "${v}" has no styleNotes entry and no generic meaning; the brief will not explain it.`);
    }
  }
  if (isStringList(a.componentDialects) && ctx.dialects) {
    for (const d of a.componentDialects) {
      if (!ctx.dialects.dialects.has(d)) warnings.push(`${name} uses the dialect "${d}", which has no design-intelligence/components/${d}/dialect.json yet.`);
    }
  }
  if (!Array.isArray(a.sectionOrders) || !a.sectionOrders.length) {
    errors.push(`${name} needs at least one section order.`);
  } else {
    a.sectionOrders.forEach((order: unknown, i: number) => {
      const where = `${name} section order ${i + 1}`;
      checkModules(order, where, errors);
      if (!isStringList(order)) return;
      if (order[0] !== "hero") errors.push(`${where} must start with "hero".`);
      if (new Set(order).size !== order.length) errors.push(`${where} lists a module twice.`);
      if (order.length < 4) errors.push(`${where} has ${order.length} sections; a site needs at least four.`);
    });
  }
  checkModules(a.requiredModules, `${name} requiredModules`, errors);
  if (!isStringList(a.forbiddenPatterns)) errors.push(`${name} forbiddenPatterns must be a list.`);
  if (a.family !== undefined) {
    if (typeof a.family !== "string" || !KEBAB_RE.test(a.family)) errors.push(`${name} family must be a base family id such as "editorial".`);
    else if (ctx.families && !ctx.families.families.has(a.family)) warnings.push(`${name} belongs to the family "${a.family}", which has no design-intelligence/archetypes/${a.family}.json yet.`);
  }
  if (a.primaryConversions !== undefined) {
    const own = isStringList(profile.primaryConversions) ? profile.primaryConversions : [];
    if (!isStringList(a.primaryConversions)) errors.push(`${name} primaryConversions must be a list.`);
    else for (const c of unknownValues(a.primaryConversions, own)) errors.push(`${name} leads with the conversion "${c}", which the industry's primaryConversions does not list.`);
  }
  if (a.fontPairings !== undefined) {
    if (!isStringList(a.fontPairings)) errors.push(`${name} fontPairings must be a list of pairing ids.`);
    else {
      for (const id of a.fontPairings) {
        const p = fontPairing(id);
        if (!p) errors.push(`${name} prefers the font pairing "${id}", which design-tokens.ts FONT_PAIRINGS does not define.`);
        else if (isStringList(a.typography) && !a.typography.includes(p.typography)) errors.push(`${name} prefers the font pairing "${id}" (${p.typography}), but its typography list does not allow ${p.typography}.`);
      }
    }
  }
  const ceiling = profile.motionCeiling;
  if (typeof ceiling === "string" && isStringList(a.motion)) {
    const max = MOTION_ORDER.indexOf(ceiling as MotionStyle);
    for (const mo of a.motion) {
      if (MOTION_ORDER.indexOf(mo as MotionStyle) > max) errors.push(`${name} allows motion "${mo}", above the industry's motionCeiling "${ceiling}".`);
    }
  }
  if (profile.trustSensitive === true && isStringList(a.motion) && a.motion.some((mo) => mo === "kinetic" || mo === "cinematic")) {
    warnings.push(`${name} allows kinetic or cinematic motion in a trust sensitive industry; motion is capped at moderate there and a kinetic direction is set aside unless permitsHighMotion is true.`);
  }
}

// Validates one profile. `ctx.file` lets the id be checked against the file name.
export function validateIndustryProfile(value: unknown, ctx: ProfileContext = {}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const where = ctx.file ? relative(ctx.file) : "An industry profile";
  if (!isPlainObject(value)) return { ok: false, errors: [`${where} must export an IndustryProfile object.`], warnings };
  const name = typeof value.id === "string" ? `Industry "${value.id}"` : where;
  if (typeof value.id !== "string" || !KEBAB_RE.test(value.id)) errors.push(`${name} needs a lowercase hyphenated id.`);
  if (ctx.file && typeof value.id === "string") {
    const base = path.basename(ctx.file).replace(/\.(ts|js|mjs)$/, "");
    if (base !== value.id) errors.push(`${where} exports the industry "${value.id}"; the file must be named ${value.id}.ts.`);
  }
  if (typeof value.label !== "string" || !value.label.trim()) errors.push(`${name} needs a label.`);
  if (!isStringList(value.primaryConversions) || !value.primaryConversions.length) errors.push(`${name} needs at least one primary conversion.`);
  else for (const c of unknownValues(value.primaryConversions, CONVERSION_KEYS)) errors.push(`${name} lists the conversion "${c}", which is not in schema.ts CONVERSION_KEYS.`);
  checkModules(value.requiredModules, `${name} requiredModules`, errors);
  if (!isStringList(value.defaultForbiddenPatterns)) errors.push(`${name} defaultForbiddenPatterns must be a list.`);
  if (value.motionCeiling !== undefined && !(MOTION_STYLES as readonly unknown[]).includes(value.motionCeiling)) errors.push(`${name} motionCeiling must be one of: ${MOTION_STYLES.join(", ")}.`);
  if (value.subIndustries !== undefined) {
    if (!isPlainObject(value.subIndustries)) errors.push(`${name} subIndustries must be an object keyed by sub-industry id.`);
    else for (const [k, v] of Object.entries(value.subIndustries)) {
      if (!KEBAB_RE.test(k)) errors.push(`${name} sub-industry key "${k}" must be lowercase and hyphenated.`);
      if (!isPlainObject(v) || typeof v.label !== "string") errors.push(`${name} sub-industry "${k}" needs a label.`);
    }
  }
  if (value.preferredTrustSignals !== undefined) {
    if (!isStringList(value.preferredTrustSignals)) errors.push(`${name} preferredTrustSignals must be a list of trust signal keys.`);
    else for (const t of value.preferredTrustSignals) if (!isTrustSignalKey(t)) warnings.push(`${name} prefers the trust signal "${t}", which is not in schema.ts TRUST_SIGNAL_KEYS; it renders as an owner-to-confirm slot.`);
  } else {
    warnings.push(`${name} has no preferredTrustSignals; v2 lists them on every profile (schema.ts TRUST_SIGNAL_KEYS). Conservative defaults are used.`);
  }
  checkTreatments(value.treatments, name, errors);
  if (value.palettes !== undefined && !isPlainObject(value.palettes)) errors.push(`${name} palettes must be an object keyed by palette family.`);
  if (isPlainObject(value.palettes)) {
    for (const [fam, p] of Object.entries(value.palettes)) {
      const pw = `${name} palette "${fam}"`;
      if (!KEBAB_RE.test(fam)) errors.push(`${pw} key must be lowercase and hyphenated.`);
      if (!isPlainObject(p) || typeof p.label !== "string" || (p.tone !== "light" && p.tone !== "dark") || !isPlainObject(p.tokens)) {
        errors.push(`${pw} must be { label, tone: "light" | "dark", tokens }.`);
        continue;
      }
      const tokens = p.tokens as Record<string, unknown>;
      const missing = TOKEN_NAMES.filter((t) => typeof tokens[t] !== "string");
      if (missing.length) errors.push(`${pw} is missing the token${missing.length > 1 ? "s" : ""} ${missing.join(", ")}.`);
      errors.push(...paletteContrastErrors(tokens as Record<string, string>, pw));
    }
  }
  if (!Array.isArray(value.archetypes) || value.archetypes.length < 2) {
    errors.push(`${name} needs at least two archetypes; every industry keeps several appropriate design directions.`);
  } else {
    if (value.archetypes.length < 3) warnings.push(`${name} has only two archetypes; the brief asks for three per industry.`);
    const ids = new Set<string>();
    value.archetypes.forEach((a: unknown, i: number) => {
      validateArchetype(a, i, value, ctx, errors, warnings);
      const id = isPlainObject(a) ? a.id : undefined;
      if (typeof id === "string") {
        if (ids.has(id)) errors.push(`${name} uses the archetype id "${id}" twice.`);
        ids.add(id);
      }
    });
    if (isPlainObject(value.palettes)) {
      const used = new Set(value.archetypes.flatMap((a: unknown) => (isPlainObject(a) && isStringList(a.paletteFamilies) ? a.paletteFamilies : [])));
      for (const fam of Object.keys(value.palettes)) if (!used.has(fam)) warnings.push(`${name} defines the palette "${fam}", which no archetype uses.`);
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

function looksLikeProfile(v: unknown): boolean {
  return isPlainObject(v) && typeof v.id === "string" && Array.isArray(v.archetypes);
}

// The profile a module exports: `default`, `profile`, or the one named export shaped like a
// profile (roofing.ts exports `roofing`).
export function profileFromModule(mod: Record<string, unknown>): { profile: unknown; error: string } {
  if (looksLikeProfile(mod.default)) return { profile: mod.default, error: "" };
  if (looksLikeProfile(mod.profile)) return { profile: mod.profile, error: "" };
  const found = [...new Set(Object.values(mod).filter(looksLikeProfile))];
  if (found.length === 1) return { profile: found[0], error: "" };
  if (!found.length) return { profile: null, error: "exports no IndustryProfile (export const <name>: IndustryProfile = { id, label, archetypes, ... })." };
  return { profile: null, error: `exports ${found.length} industry profiles; one file holds one industry.` };
}

let activeRegistry: IndustryRegistry | null = null;

function isProfileFile(name: string): boolean {
  if (name.startsWith("_") || name.startsWith(".")) return false;
  if (name.endsWith(".d.ts") || /\.test\.(ts|js)$/.test(name)) return false;
  // An index module that re-exports the profiles (IMPLEMENTATION-BRIEF-v2.md) is not a profile.
  if (/^index\.(ts|js|mjs)$/.test(name)) return false;
  return /\.(ts|js|mjs)$/.test(name);
}

// Loads and validates every industry module in `dir`. Invalid profiles are left out and their
// errors reported; the rest still load. The registry loaded from the default folder becomes the
// active one used by getIndustry and classifyLead when no registry is passed.
export async function loadIndustries(dir: string = DEFAULT_INDUSTRIES_DIR, ctx: Omit<ProfileContext, "file"> = {}): Promise<IndustryRegistry> {
  const registry: IndustryRegistry = { profiles: new Map(), files: new Map(), errors: [], warnings: [] };
  let names: string[];
  try {
    names = fs.readdirSync(dir).filter(isProfileFile).sort();
  } catch (err) {
    registry.errors.push(`The industries folder ${relative(dir)} could not be read (${(err as Error).message}).`);
    return registry;
  }
  for (const n of names) {
    const file = path.join(dir, n);
    let mod: Record<string, unknown>;
    try {
      mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
    } catch (err) {
      registry.errors.push(`${relative(file)} failed to load: ${(err as Error).message}`);
      continue;
    }
    const { profile, error } = profileFromModule(mod);
    if (error) {
      registry.errors.push(`${relative(file)} ${error}`);
      continue;
    }
    const check = validateIndustryProfile(profile, { ...ctx, file });
    registry.warnings.push(...check.warnings);
    if (!check.ok) {
      registry.errors.push(...check.errors);
      continue;
    }
    const p = profile as IndustryProfile;
    if (registry.profiles.has(p.id)) {
      registry.errors.push(`${relative(file)} declares the industry "${p.id}", already loaded from ${registry.files.get(p.id)}.`);
      continue;
    }
    registry.profiles.set(p.id, p);
    registry.files.set(p.id, relative(file));
  }
  if (path.resolve(dir) === path.resolve(DEFAULT_INDUSTRIES_DIR)) activeRegistry = registry;
  return registry;
}

function requireRegistry(registry?: IndustryRegistry): IndustryRegistry {
  const r = registry || activeRegistry;
  if (!r) throw new Error("No industry registry is loaded; await loadIndustries() first or pass a registry.");
  return r;
}

export function getIndustry(id: string, registry?: IndustryRegistry): IndustryProfile | undefined {
  return requireRegistry(registry).profiles.get(id);
}

export function getArchetype(profile: IndustryProfile, id: string): IndustryArchetype | undefined {
  return profile.archetypes.find((a) => a.id === id);
}

export function listIndustries(registry?: IndustryRegistry): { id: string; label: string; file: string; archetypes: { id: string; label: string }[] }[] {
  const r = requireRegistry(registry);
  return [...r.profiles.values()]
    .map((p) => ({ id: p.id, label: p.label, file: r.files.get(p.id) || "", archetypes: p.archetypes.map((a) => ({ id: a.id, label: a.label })) }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

let cachedCategories: CategoryRegistry | null = null;

export function loadCategories(file: string = DEFAULT_CATEGORIES_FILE): CategoryRegistry {
  if (file === DEFAULT_CATEGORIES_FILE && cachedCategories) return cachedCategories;
  const read = readJson(file);
  if (!read.ok) throw new Error(read.error);
  const cats = read.value as CategoryRegistry;
  if (file === DEFAULT_CATEGORIES_FILE) cachedCategories = cats;
  return cats;
}

// Every category must name exactly one loaded industry. Returns sentences per problem.
export function checkCategoryMapping(categories: CategoryRegistry, registry?: IndustryRegistry): ValidationResult {
  const r = requireRegistry(registry);
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const [key, c] of Object.entries(categories)) {
    if (typeof c.industry !== "string" || !c.industry) errors.push(`Category "${key}" has no industry; add "industry" and "subIndustry" in config/categories.json.`);
    else if (!r.profiles.has(c.industry)) errors.push(`Category "${key}" maps to the industry "${c.industry}", which has no profile yet (src/design-intelligence/industries/${c.industry}.ts).`);
    if (typeof c.subIndustry !== "string" || !c.subIndustry) errors.push(`Category "${key}" has no subIndustry.`);
    else if (typeof c.industry === "string" && r.profiles.has(c.industry)) {
      const subs = r.profiles.get(c.industry)?.subIndustries;
      if (subs && !subs[c.subIndustry]) warnings.push(`Category "${key}" uses the sub-industry "${c.subIndustry}", which the ${c.industry} profile does not describe.`);
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

// Industry and sub-industry for a lead, from its categoryKey. Unknown categories fall back to
// "general" with a warning. Never guesses from the business name.
export function classifyLead(lead: LeadRecord, opts: { categories?: CategoryRegistry; registry?: IndustryRegistry } = {}): Classification {
  const categories = opts.categories || loadCategories();
  const r = requireRegistry(opts.registry);
  const warnings: string[] = [];
  let key = String(lead.categoryKey || "");
  if (!categories[key]) {
    warnings.push(`The lead's categoryKey "${key}" is not in config/categories.json; the general category is used.`);
    key = "general";
  }
  const cat = categories[key];
  const out: Classification = { ok: false, errors: [], warnings, industry: "", subIndustry: "", categoryKey: key, reason: "" };
  if (!cat) {
    out.errors.push("config/categories.json has no general category to fall back on.");
    return out;
  }
  if (!cat.industry || !cat.subIndustry) {
    out.errors.push(`Category "${key}" has no industry mapping; add "industry" and "subIndustry" in config/categories.json.`);
    return out;
  }
  out.industry = cat.industry;
  out.subIndustry = cat.subIndustry;
  if (!r.profiles.has(cat.industry)) {
    out.errors.push(`Category "${key}" maps to the industry "${cat.industry}", which has no loaded profile; add src/design-intelligence/industries/${cat.industry}.ts.`);
    return out;
  }
  out.ok = true;
  out.reason = `Classified as ${r.profiles.get(cat.industry)?.label} (${cat.industry}, sub-industry ${cat.subIndustry}) from categoryKey "${key}".`;
  return out;
}
