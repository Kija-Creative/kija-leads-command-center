// Public API of the Design Intelligence Engine. JavaScript callers (the renderer, the CLIs, the
// server) import from this file only: import { createEngine } from "../design-intelligence/index.ts".
//
//   const engine = await createEngine();                    // loads everything, validates it
//   const { record } = engine.select(lead, { now, history }); // Site DNA before any frontend work
//   const { markdown } = engine.brief(record, lead, { assets, history });
//   const audit = engine.audit(html, record, { history, lead, now });
import path from "node:path";
import type { AuditResult, CategoryRegistry, LeadRecord, SiteDnaRecord } from "./schema.ts";
import { DEFAULT_ARCHETYPES_DIR, loadArchetypeFamilies } from "./archetypes.ts";
import type { FamilyRegistry } from "./archetypes.ts";
import { auditSite } from "./audit.ts";
import { DEFAULT_COMPONENTS_DIR, loadDialects } from "./component-dialects.ts";
import type { DialectRegistry } from "./component-dialects.ts";
import type { HistoryEntry, HistoryFile } from "./history.ts";
import { DEFAULT_CATEGORIES_FILE, DEFAULT_INDUSTRIES_DIR, getArchetype, loadCategories, loadIndustries } from "./industries.ts";
import type { IndustryRegistry } from "./industries.ts";
import { buildGenerationBrief } from "./prompt-builder.ts";
import type { BriefJson, StockAsset } from "./prompt-builder.ts";
import { DEFAULT_REFERENCES_DIR, loadReferences } from "./references.ts";
import type { DesignReference } from "./references.ts";
import { selectSiteDna } from "./select-site-dna.ts";
import type { SelectOptions, SelectResult } from "./select-site-dna.ts";
import { PROJECT_ROOT } from "./util.ts";

export * from "./schema.ts";
export * from "./seed.ts";
export * from "./variation.ts";
export * from "./design-tokens.ts";
export * from "./contrast.ts";
export * from "./modules.ts";
export * from "./markers.ts";
export * from "./traits.ts";
export * from "./industries.ts";
export * from "./archetypes.ts";
export * from "./component-dialects.ts";
export * from "./references.ts";
export * from "./history.ts";
export * from "./select-site-dna.ts";
export * from "./select-archetype.ts";
export * from "./prompt-builder.ts";
export * from "./audit.ts";
export * from "./renderer-contract.ts";
export * from "./html.ts";
export { PROJECT_ROOT } from "./util.ts";

export interface EngineOptions {
  root?: string;               // project root; folders below default from it
  industriesDir?: string;
  archetypesDir?: string;
  componentsDir?: string;
  referencesDir?: string;
  categoriesFile?: string;
  categories?: CategoryRegistry;
}

export interface Engine {
  root: string;
  registry: IndustryRegistry;
  families: FamilyRegistry;
  dialects: DialectRegistry;
  references: DesignReference[];
  categories: CategoryRegistry;
  errors: string[];
  warnings: string[];
  select(lead: LeadRecord, options: SelectOptions): SelectResult;
  brief(record: SiteDnaRecord, lead: LeadRecord, opts: { assets?: StockAsset[]; history: HistoryFile | HistoryEntry[] }): { markdown: string; json: BriefJson };
  audit(html: string, record: SiteDnaRecord, opts: { history?: HistoryFile | HistoryEntry[]; lead?: LeadRecord; now?: string | Date }): AuditResult;
}

// Loads industries, families, dialects, references and categories. Problems in the data come
// back as sentences in errors and warnings; profiles that fail validation are left out.
export async function createEngine(opts: EngineOptions = {}): Promise<Engine> {
  const root = opts.root ? path.resolve(opts.root) : PROJECT_ROOT;
  const under = (...p: string[]) => path.join(root, ...p);
  const families = loadArchetypeFamilies(opts.archetypesDir || (opts.root ? under("design-intelligence", "archetypes") : DEFAULT_ARCHETYPES_DIR));
  const dialects = await loadDialects(opts.componentsDir || (opts.root ? under("design-intelligence", "components") : DEFAULT_COMPONENTS_DIR));
  const registry = await loadIndustries(opts.industriesDir || DEFAULT_INDUSTRIES_DIR, { families, dialects });
  const refs = loadReferences(opts.referencesDir || (opts.root ? under("design-intelligence", "references") : DEFAULT_REFERENCES_DIR));
  const categories = opts.categories || loadCategories(opts.categoriesFile || (opts.root ? under("config", "categories.json") : DEFAULT_CATEGORIES_FILE));
  const data = { registry, categories, families, dialects, references: refs.references };
  return {
    root,
    ...data,
    errors: [...families.errors, ...dialects.errors, ...registry.errors, ...refs.errors],
    warnings: [...families.warnings, ...dialects.warnings, ...registry.warnings, ...refs.warnings],
    select(lead, options) {
      return selectSiteDna(lead, data, options);
    },
    brief(record, lead, o) {
      const profile = registry.profiles.get(record.dna.industry);
      if (!profile) throw new Error(`No loaded industry profile "${record.dna.industry}" for ${record.business}.`);
      const archetype = getArchetype(profile, record.dna.archetype);
      if (!archetype) throw new Error(`The ${profile.label} profile has no archetype "${record.dna.archetype}".`);
      return buildGenerationBrief({
        lead,
        profile,
        archetype,
        dna: record.dna,
        facts: record.facts,
        assets: o.assets || [],
        history: o.history,
        record,
        family: archetype.family ? families.families.get(archetype.family) : undefined,
        dialect: dialects.dialects.get(record.dna.componentDialect),
      });
    },
    audit(html, record, o) {
      const profile = registry.profiles.get(record.dna.industry);
      if (!profile) throw new Error(`No loaded industry profile "${record.dna.industry}" for ${record.business}.`);
      return auditSite({ html, record, profile, history: o.history, lead: o.lead, now: o.now });
    },
  };
}
