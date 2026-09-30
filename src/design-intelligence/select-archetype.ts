// Archetype selection as its own entry point (IMPLEMENTATION-BRIEF-v2.md names this file). The
// scoring itself lives in select-site-dna.ts (scoreArchetypes) so the pipeline and this helper can
// never disagree: trait fit first, then conversion fit, the seed only for ties, excluded traits
// and weak fits marked not appropriate.
import type { ArchetypeScore, ConversionObjective, IndustryProfile, TraitSummary } from "./schema.ts";
import { scoreArchetypes } from "./select-site-dna.ts";

// The best appropriate archetype and the full ranking, for the app and for tests.
export function selectArchetype(profile: IndustryProfile, traits: readonly TraitSummary[], conversion: ConversionObjective, seed: string): { best: ArchetypeScore; ranking: ArchetypeScore[] } {
  const ranking = scoreArchetypes(profile, traits, conversion, seed);
  return { best: ranking.find((s) => s.appropriate) || ranking[0], ranking };
}
