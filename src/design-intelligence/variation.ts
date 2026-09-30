// Site difference engine. Supplied by Jamey on 2026-09-29. compareSiteDNA and
// validateAgainstHistory are unchanged except the import path "./schema.ts" (Node's type
// stripping and TypeScript's nodenext resolution both need the explicit extension). The exports
// after them, and the hashString and OPTIONAL_DIMENSIONS imports they use, are extensions. Keep
// these semantics.
import type { SiteDNA } from "./schema.ts";
import { OPTIONAL_DIMENSIONS } from "./schema.ts";
import { hashString } from "./seed.ts";

const DIMENSIONS = [
  "archetype",
  "hero",
  "navigation",
  "typography",
  "paletteFamily",
  "layoutRhythm",
  "geometry",
  "imagery",
  "motion",
  "ctaStyle",
  "proofStyle",
  "componentDialect",
] as const;

export interface VariationResult {
  valid: boolean;
  differenceCount: number;
  differenceRatio: number;
  matchingDimensions: string[];
  differingDimensions: string[];
  cloneSignatureConflict: boolean;
}

function sameSectionOrder(a: string[], b: string[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function compareSiteDNA(
  candidate: SiteDNA,
  previous: SiteDNA
): VariationResult {
  const differingDimensions: string[] = [];
  const matchingDimensions: string[] = [];

  for (const dimension of DIMENSIONS) {
    if (candidate[dimension] === previous[dimension]) {
      matchingDimensions.push(dimension);
    } else {
      differingDimensions.push(dimension);
    }
  }

  if (sameSectionOrder(candidate.sectionOrder, previous.sectionOrder)) {
    matchingDimensions.push("sectionOrder");
  } else {
    differingDimensions.push("sectionOrder");
  }

  const differenceCount = differingDimensions.length;

  const cloneSignatureConflict =
    candidate.hero === previous.hero &&
    candidate.typography === previous.typography &&
    candidate.geometry === previous.geometry &&
    sameSectionOrder(candidate.sectionOrder, previous.sectionOrder);

  return {
    valid: differenceCount >= 6 && !cloneSignatureConflict,
    differenceCount,
    differenceRatio:
      differenceCount /
      (differingDimensions.length + matchingDimensions.length),
    matchingDimensions,
    differingDimensions,
    cloneSignatureConflict,
  };
}

export function validateAgainstHistory(
  candidate: SiteDNA,
  history: SiteDNA[],
  lookback = 8
) {
  const recent = history.slice(-lookback);

  const comparisons = recent.map((site) => ({
    site,
    result: compareSiteDNA(candidate, site),
  }));

  const conflicts = comparisons.filter(
    ({ result }) => !result.valid
  );

  return {
    valid: conflicts.length === 0,
    conflicts,
    comparisons,
  };
}

// ---------------------------------------------------------------------------------------------
// Extensions (engine architect). Jamey's compareSiteDNA and validateAgainstHistory above keep
// their semantics; everything here builds on them.
// ---------------------------------------------------------------------------------------------

// The variation score: the minimum differenceRatio across the comparison set (1 when there is
// nothing to compare against). 6 of 13 dimensions is 0.46, the brief's floor.
export function variationScore(
  candidate: SiteDNA,
  history: SiteDNA[],
  lookback = 8
): number {
  const recent = history.slice(-lookback);
  if (recent.length === 0) return 1;

  let min = 1;
  for (const site of recent) {
    const ratio = compareSiteDNA(candidate, site).differenceRatio;
    if (ratio < min) min = ratio;
  }

  return Math.round(min * 1000) / 1000;
}

// The brief's floor as a ratio: six differing dimensions out of thirteen.
export const MIN_DIFFERING_DIMENSIONS = 6;
export const DIMENSION_COUNT = DIMENSIONS.length + 1;

// Two DNAs are identical when every compared dimension, section order included, matches.
export function isIdenticalDNA(a: SiteDNA, b: SiteDNA): boolean {
  return compareSiteDNA(a, b).differenceCount === 0;
}

// Duplicate prevention: the first history entry identical to the candidate, or null. Unlike the
// lookback check this scans the whole history, so a DNA can never be issued twice.
export function findDuplicate(
  candidate: SiteDNA,
  history: SiteDNA[]
): SiteDNA | null {
  for (const site of history) {
    if (isIdenticalDNA(candidate, site)) return site;
  }
  return null;
}

// A candidate is acceptable when it passes validateAgainstHistory over the comparison set and
// duplicates nothing in the full history.
export function checkCandidate(
  candidate: SiteDNA,
  comparisonSet: SiteDNA[],
  fullHistory: SiteDNA[] = comparisonSet
) {
  const result = validateAgainstHistory(candidate, comparisonSet, comparisonSet.length);
  const duplicate = findDuplicate(candidate, fullHistory);

  return {
    valid: result.valid && duplicate === null,
    duplicate,
    score: variationScore(candidate, comparisonSet, comparisonSet.length),
    comparisons: result.comparisons,
    conflicts: result.conflicts,
  };
}

// A short stable fingerprint of the compared dimensions, for data-dna markers and history.
export function dnaFingerprint(dna: SiteDNA): string {
  const parts = [
    ...DIMENSIONS.map((d) => `${d}=${String(dna[d])}`),
    `sectionOrder=${dna.sectionOrder.join(",")}`,
  ];
  return `dna-${hashString(parts.join("|")).toString(16).padStart(8, "0")}`;
}

export const COMPARED_DIMENSIONS: readonly string[] = [...DIMENSIONS, "sectionOrder"];

// ---------------------------------------------------------------------------------------------
// v2: global and same industry comparison (IMPLEMENTATION-BRIEF-v2.md, Measurable difference).
// Every comparison runs through Jamey's compareSiteDNA and validateAgainstHistory; the same
// industry window adds a stricter bar on top, so a new roofing site is held harder against the
// last few roofing sites than against a recent dentist.
// ---------------------------------------------------------------------------------------------

export const SAME_INDUSTRY_MIN_DIFFERING = 7;

export interface ComparisonTarget {
  dna: SiteDNA;
  sameIndustry: boolean;   // inside the same industry window
}

export interface RecentComparison {
  site: SiteDNA;
  result: VariationResult;
  sameIndustry: boolean;
  required: number;          // differing dimensions this comparison needs
  valid: boolean;            // Jamey's rule and, for the same industry, the stricter bar
  optional: { differing: string[]; matching: string[] };
}

// The optional treatments both DNAs define, split into differing and matching. Reported beside
// the thirteen dimensions and never counted toward them: they are finer grained than the
// meaningful differences the brief counts.
export function compareOptionalDimensions(a: SiteDNA, b: SiteDNA): { differing: string[]; matching: string[] } {
  const differing: string[] = [];
  const matching: string[] = [];
  for (const d of OPTIONAL_DIMENSIONS) {
    if (a[d] === undefined || b[d] === undefined) continue;
    if (a[d] === b[d]) matching.push(d);
    else differing.push(d);
  }
  return { differing, matching };
}

export function checkRecent(
  candidate: SiteDNA,
  targets: readonly ComparisonTarget[],
  fullHistory: readonly SiteDNA[] = [],
  opts: { minDiffering?: number; industryMinDiffering?: number } = {}
) {
  const min = Math.max(MIN_DIFFERING_DIMENSIONS, opts.minDiffering ?? MIN_DIFFERING_DIMENSIONS);
  const industryMin = Math.max(min, opts.industryMinDiffering ?? SAME_INDUSTRY_MIN_DIFFERING);
  const base = validateAgainstHistory(candidate, targets.map((t) => t.dna), targets.length);
  const comparisons: RecentComparison[] = base.comparisons.map(({ site, result }, i) => {
    const sameIndustry = targets[i].sameIndustry;
    const required = sameIndustry ? industryMin : min;
    return {
      site,
      result,
      sameIndustry,
      required,
      valid: result.valid && result.differenceCount >= required,
      optional: compareOptionalDimensions(candidate, site),
    };
  });
  const duplicate = findDuplicate(candidate, [...fullHistory]);
  const ratio = (list: readonly RecentComparison[]) => (list.length ? Math.round(Math.min(...list.map((c) => c.result.differenceRatio)) * 1000) / 1000 : 1);
  const industry = comparisons.filter((c) => c.sameIndustry);
  return {
    valid: comparisons.every((c) => c.valid) && duplicate === null,
    duplicate,
    score: ratio(comparisons),
    industryScore: ratio(industry),
    minDiffering: min,
    industryMinDiffering: industryMin,
    comparisons,
    conflicts: comparisons.filter((c) => !c.valid),
  };
}
