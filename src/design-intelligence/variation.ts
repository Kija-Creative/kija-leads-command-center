// Site difference engine. Supplied by Jamey on 2026-09-29. compareSiteDNA and
// validateAgainstHistory are unchanged except the import path "./schema.ts" (Node's type
// stripping and TypeScript's nodenext resolution both need the explicit extension). The exports
// after them, and the hashString import they use, are extensions. Keep these semantics.
import type { SiteDNA } from "./schema.ts";
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
