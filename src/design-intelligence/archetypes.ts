// Base archetype families: design-intelligence/archetypes/<id>.json. A family (editorial,
// industrial, clinical, luxury, ...) is the cross-industry design language an industry
// archetype belongs to. The industry archetype's allowed lists stay authoritative; the family
// adds principles for the brief, a motion ceiling and a tie-break preference among values the
// archetype already allows.
import fs from "node:fs";
import path from "node:path";
import {
  BRAND_TRAITS,
  GEOMETRY_STYLES,
  HERO_STYLES,
  IMAGERY_STYLES,
  LAYOUT_RHYTHMS,
  MOTION_STYLES,
  NAVIGATION_STYLES,
  TYPOGRAPHY_STYLES,
} from "./schema.ts";
import type {
  GeometryStyle,
  HeroStyle,
  ImageryStyle,
  LayoutRhythm,
  MotionStyle,
  NavigationStyle,
  TypographyStyle,
  ValidationResult,
} from "./schema.ts";
import { isPlainObject, isStringList, KEBAB_RE, PROJECT_ROOT, readJson, relative, unknownValues } from "./util.ts";

export interface AxisPreference<T extends string> {
  preferred: T[];
  notes: string;
}

export interface BaseArchetype {
  id: string;
  label: string;
  summary: string;
  character: string[];
  suitableBrandTraits: string[];
  heroes: AxisPreference<HeroStyle>;
  navigation: AxisPreference<NavigationStyle>;
  typography: AxisPreference<TypographyStyle>;
  layout: AxisPreference<LayoutRhythm>;
  geometry: AxisPreference<GeometryStyle>;
  imagery: AxisPreference<ImageryStyle>;
  motion: { ceiling: MotionStyle; notes: string };
  defaultDialects: string[];
  principles: string[];
  forbiddenPatterns: string[];
  references: string[];
}

export interface FamilyRegistry {
  families: Map<string, BaseArchetype>;
  errors: string[];
  warnings: string[];
}

export const DEFAULT_ARCHETYPES_DIR = path.join(PROJECT_ROOT, "design-intelligence", "archetypes");

const AXES: readonly { key: "heroes" | "navigation" | "typography" | "layout" | "geometry" | "imagery"; vocab: readonly string[] }[] = [
  { key: "heroes", vocab: HERO_STYLES },
  { key: "navigation", vocab: NAVIGATION_STYLES },
  { key: "typography", vocab: TYPOGRAPHY_STYLES },
  { key: "layout", vocab: LAYOUT_RHYTHMS },
  { key: "geometry", vocab: GEOMETRY_STYLES },
  { key: "imagery", vocab: IMAGERY_STYLES },
];

// Shape and vocabulary check for one family. Sentences, never throws.
export function validateBaseArchetype(value: unknown, where = "An archetype family"): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isPlainObject(value)) return { ok: false, errors: [`${where} must be a JSON object.`], warnings };
  const name = typeof value.id === "string" ? `Archetype family "${value.id}"` : where;
  if (typeof value.id !== "string" || !KEBAB_RE.test(value.id)) errors.push(`${name} needs a lowercase hyphenated id.`);
  for (const f of ["label", "summary"]) {
    if (typeof value[f] !== "string" || !String(value[f]).trim()) errors.push(`${name} needs a ${f}.`);
  }
  for (const f of ["character", "suitableBrandTraits", "defaultDialects", "principles", "forbiddenPatterns", "references"]) {
    if (!isStringList(value[f])) errors.push(`${name} ${f} must be a list of text values.`);
  }
  if (isStringList(value.suitableBrandTraits)) {
    for (const t of unknownValues(value.suitableBrandTraits, BRAND_TRAITS)) errors.push(`${name} lists the brand trait "${t}", which is not in the BrandTrait vocabulary (schema.ts BRAND_TRAITS).`);
  }
  if (isStringList(value.principles) && value.principles.length < 3) warnings.push(`${name} has fewer than three principles; the brief quotes them to the building agent.`);
  for (const { key, vocab } of AXES) {
    const axis = value[key];
    if (!isPlainObject(axis) || !isStringList(axis.preferred) || typeof axis.notes !== "string") {
      errors.push(`${name} ${key} must be { "preferred": [...], "notes": "..." }.`);
      continue;
    }
    if (!axis.preferred.length) errors.push(`${name} ${key}.preferred needs at least one value.`);
    for (const v of unknownValues(axis.preferred, vocab)) errors.push(`${name} ${key}.preferred has "${v}", which is not one of: ${vocab.join(", ")}.`);
  }
  const motion = value.motion;
  if (!isPlainObject(motion) || typeof motion.ceiling !== "string" || !(MOTION_STYLES as readonly string[]).includes(motion.ceiling) || typeof motion.notes !== "string") {
    errors.push(`${name} motion must be { "ceiling": one of ${MOTION_STYLES.join(", ")}, "notes": "..." }.`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

// Loads every *.json family in the folder. A missing folder is an empty registry with a warning.
export function loadArchetypeFamilies(dir: string = DEFAULT_ARCHETYPES_DIR): FamilyRegistry {
  const registry: FamilyRegistry = { families: new Map(), errors: [], warnings: [] };
  let names: string[];
  try {
    names = fs.readdirSync(dir).filter((n) => n.endsWith(".json")).sort();
  } catch {
    registry.warnings.push(`No archetype family folder at ${relative(dir)}; briefs will carry no family principles.`);
    return registry;
  }
  for (const n of names) {
    const file = path.join(dir, n);
    const read = readJson(file);
    if (!read.ok) {
      registry.errors.push(read.error);
      continue;
    }
    const check = validateBaseArchetype(read.value, relative(file));
    registry.warnings.push(...check.warnings);
    if (!check.ok) {
      registry.errors.push(...check.errors);
      continue;
    }
    const family = read.value as BaseArchetype;
    if (`${family.id}.json` !== n) {
      registry.errors.push(`${relative(file)} holds the family "${family.id}"; the file must be named ${family.id}.json.`);
      continue;
    }
    registry.families.set(family.id, family);
  }
  return registry;
}

// Preferred values of a family for one DNA axis, for ordering ties inside an archetype.
export function familyPreference(family: BaseArchetype | undefined, axis: string): readonly string[] {
  if (!family) return [];
  switch (axis) {
    case "hero":
      return family.heroes.preferred;
    case "navigation":
      return family.navigation.preferred;
    case "typography":
      return family.typography.preferred;
    case "layoutRhythm":
      return family.layout.preferred;
    case "geometry":
      return family.geometry.preferred;
    case "imagery":
      return family.imagery.preferred;
    case "componentDialect":
      return family.defaultDialects;
    default:
      return [];
  }
}
