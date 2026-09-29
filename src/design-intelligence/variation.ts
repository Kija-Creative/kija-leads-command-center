// Site difference engine. Supplied by Jamey on 2026-09-29. The only change from the original is
// the import path "./schema.ts": Node's type stripping and TypeScript's nodenext resolution both
// need the explicit extension. Extend by adding exports; keep these semantics.
import type { SiteDNA } from "./schema.ts";

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
