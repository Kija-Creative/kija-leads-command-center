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

// Extension (engine architect): the deterministic seed for a lead. Stable inputs only: lead id,
// business name, domain (or website, "" when the lead has none) and industry. The same lead in
// the same industry always gets the same seed on any machine.
export function buildSeed(input: {
  leadId: string;
  business: string;
  domain?: string;
  industry: string;
}): string {
  const text = [
    input.leadId,
    input.business.trim().toLowerCase(),
    String(input.domain || "").trim().toLowerCase(),
    input.industry,
  ].join("|");

  return `fnv1a-${hashString(text).toString(16).padStart(8, "0")}`;
}

// Extension: a fixed, seeded order of a list (a rotation, so every option keeps its neighbours).
// seededPick(items, seed, namespace) is always the first element of this order.
export function seededOrder<T>(
  items: readonly T[],
  seed: string,
  namespace: string
): T[] {
  if (items.length === 0) return [];
  const start = seededIndex(seed, namespace, items.length);
  return [...items.slice(start), ...items.slice(0, start)];
}
