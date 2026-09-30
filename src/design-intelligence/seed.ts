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

// Extension: the deterministic seed for a lead, exactly as IMPLEMENTATION-BRIEF-v2.md gives it:
// `${leadId}:${businessName}:${domain}:${industry}` hashed with hashString (FNV-1a). Stable
// inputs only; the domain is "" when the lead has none. Surrounding whitespace is trimmed so a
// stray space in the record never moves the design. The same lead in the same industry always
// gets the same seed on any machine.
export function seedInput(input: {
  leadId: string;
  business: string;
  domain?: string;
  industry: string;
}): string {
  const leadId = input.leadId.trim();
  const businessName = input.business.trim();
  const domain = String(input.domain || "").trim();
  const industry = input.industry.trim();
  return `${leadId}:${businessName}:${domain}:${industry}`;
}

export function buildSeed(input: {
  leadId: string;
  business: string;
  domain?: string;
  industry: string;
}): string {
  return `fnv1a-${hashString(seedInput(input)).toString(16).padStart(8, "0")}`;
}

// The domain part of the seed: the lead's domain, else the host of its website, lowercased and
// without "www.", or "" when the lead has neither.
export function domainOf(lead: { domain?: unknown; website?: unknown }): string {
  const raw = String(lead.domain || lead.website || "").trim().toLowerCase();
  if (!raw) return "";
  const host = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//, "").split(/[/?#]/)[0];
  return host.replace(/^www\./, "");
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
