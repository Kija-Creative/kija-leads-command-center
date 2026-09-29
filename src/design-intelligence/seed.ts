// Deterministic selection. Supplied by Jamey on 2026-09-29 (FNV-1a). The seed only chooses among
// options that are already valid for the business; suitability is decided before this runs.
// Never use Math.random() for a design decision.

export function hashString(input: string): number {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function seededIndex(
  seed: string,
  namespace: string,
  length: number
): number {
  if (length <= 0) {
    throw new Error("Cannot select from an empty collection");
  }

  return hashString(`${seed}:${namespace}`) % length;
}

export function seededPick<T>(
  items: readonly T[],
  seed: string,
  namespace: string
): T {
  return items[seededIndex(seed, namespace, items.length)];
}
