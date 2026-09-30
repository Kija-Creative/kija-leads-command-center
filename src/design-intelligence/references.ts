// Design references: design-intelligence/references/*.json. A reference records what was learned
// from a research source (a design-playbooks profile, a skynet-site-system niche rule, one of
// our research/design-*.md briefs): principles and conventions, never copy, photos, logos or a
// layout to clone. Selection only picks references that fit the DNA's industry or archetype, and
// never averages unrelated references together.
import fs from "node:fs";
import path from "node:path";
import type { ReferenceUse, ValidationResult } from "./schema.ts";
import { isPlainObject, isStringList, KEBAB_RE, PROJECT_ROOT, readJson, relative } from "./util.ts";

export const REFERENCE_SOURCES = ["design-playbooks", "skynet-site-system", "kija-research", "other"] as const;
export type ReferenceSource = (typeof REFERENCE_SOURCES)[number];

export interface DesignReference {
  id: string;
  title: string;
  source: ReferenceSource;
  path: string;              // e.g. ".design-references/design-playbooks-skill/profiles/sites/x.md"
  license: string;           // e.g. "MIT (repository); site content belongs to its owner"
  industries: string[];      // industry ids, or ["*"] for cross-industry principles
  archetypes: string[];      // "<industry>/<archetype>" or a bare archetype id
  families: string[];        // base family ids
  dialects: string[];
  takeaways: string[];       // principles in our own words, one sentence each
  avoid?: string[];          // what not to take from it
}

export interface ReferenceRegistry {
  references: DesignReference[];
  errors: string[];
  warnings: string[];
}

export const DEFAULT_REFERENCES_DIR = path.join(PROJECT_ROOT, "design-intelligence", "references");

export function validateReference(value: unknown, where = "A reference"): ValidationResult {
  const errors: string[] = [];
  if (!isPlainObject(value)) return { ok: false, errors: [`${where} must be a JSON object.`], warnings: [] };
  const name = typeof value.id === "string" ? `Reference "${value.id}"` : where;
  if (typeof value.id !== "string" || !KEBAB_RE.test(value.id)) errors.push(`${name} needs a lowercase hyphenated id.`);
  for (const f of ["title", "path", "license"]) {
    if (typeof value[f] !== "string" || !String(value[f]).trim()) errors.push(`${name} needs a ${f}.`);
  }
  if (!(REFERENCE_SOURCES as readonly unknown[]).includes(value.source)) errors.push(`${name} source must be one of: ${REFERENCE_SOURCES.join(", ")}.`);
  for (const f of ["industries", "archetypes", "families", "dialects", "takeaways"]) {
    if (!isStringList(value[f])) errors.push(`${name} ${f} must be a list of text values.`);
  }
  if (isStringList(value.takeaways) && !value.takeaways.length) errors.push(`${name} needs at least one takeaway; a reference with nothing learned is not a reference.`);
  if (value.avoid !== undefined && !isStringList(value.avoid)) errors.push(`${name} avoid must be a list of text values.`);
  return { ok: errors.length === 0, errors, warnings: [] };
}

// A file holds one reference object or { "references": [ ... ] }.
export function loadReferences(dir: string = DEFAULT_REFERENCES_DIR): ReferenceRegistry {
  const registry: ReferenceRegistry = { references: [], errors: [], warnings: [] };
  let names: string[];
  try {
    names = fs.readdirSync(dir).filter((n) => n.endsWith(".json")).sort();
  } catch {
    registry.warnings.push(`No reference folder at ${relative(dir)}; Site DNA will list no references.`);
    return registry;
  }
  const seen = new Set<string>();
  for (const n of names) {
    const file = path.join(dir, n);
    const read = readJson(file);
    if (!read.ok) {
      registry.errors.push(read.error);
      continue;
    }
    const list = isPlainObject(read.value) && Array.isArray(read.value.references) ? read.value.references : [read.value];
    list.forEach((item: unknown, i: number) => {
      const check = validateReference(item, `${relative(file)} entry ${i + 1}`);
      if (!check.ok) {
        registry.errors.push(...check.errors);
        return;
      }
      const ref = item as DesignReference;
      if (seen.has(ref.id)) {
        registry.errors.push(`Reference id "${ref.id}" is used twice (again in ${relative(file)}).`);
        return;
      }
      seen.add(ref.id);
      registry.references.push(ref);
    });
  }
  return registry;
}

export interface ReferenceQuery {
  industry: string;
  archetype: string;
  family?: string;
  dialect?: string;
  preferred?: string[];
  limit?: number;
}

// References appropriate to the DNA, best first: archetype match 4, industry match 3, family 2,
// dialect 1, listed by the industry profile 2. A reference must match the industry or the
// archetype (or be marked "*" cross-industry and match the family) to be used at all.
export function selectReferences(references: readonly DesignReference[], q: ReferenceQuery): ReferenceUse[] {
  const preferred = new Set(q.preferred || []);
  const scored = references.map((r) => {
    const archetypeHit = r.archetypes.includes(`${q.industry}/${q.archetype}`) || r.archetypes.includes(q.archetype);
    const industryHit = r.industries.includes(q.industry);
    const familyHit = Boolean(q.family) && r.families.includes(String(q.family));
    const dialectHit = Boolean(q.dialect) && r.dialects.includes(String(q.dialect));
    const crossIndustry = r.industries.includes("*");
    const eligible = archetypeHit || industryHit || (crossIndustry && familyHit);
    const score = (archetypeHit ? 4 : 0) + (industryHit ? 3 : 0) + (familyHit ? 2 : 0) + (dialectHit ? 1 : 0) + (preferred.has(r.id) ? 2 : 0);
    return { r, score, eligible };
  });
  return scored
    .filter((s) => s.eligible)
    .sort((a, b) => b.score - a.score || a.r.id.localeCompare(b.r.id))
    .slice(0, q.limit ?? 4)
    .map(({ r }) => ({ id: r.id, title: r.title, source: r.source, path: r.path, takeaways: [...r.takeaways] }));
}
