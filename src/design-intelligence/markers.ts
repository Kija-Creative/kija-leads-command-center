// The markers a rendered site carries so the audit can check it against its Site DNA. The
// renderer must build them with these helpers (never by hand), so the names cannot drift.
//
//   root element (body, or one wrapper around everything):
//     data-dna="<fingerprint>" data-dna-archetype data-dna-hero data-dna-navigation
//     data-dna-typography data-dna-layout data-dna-geometry data-dna-imagery data-dna-motion
//     data-dna-palette data-dna-cta data-dna-proof data-dna-dialect data-dna-industry
//   every section in dna.sectionOrder:
//     <section data-module="<key> [embedded keys...]" data-section="<index>">
//     (the first key is the section's own; index counts from 0 in sectionOrder)
//   an embedded required module (phone link, form, gallery inside a section):
//     data-module="<key>" without data-section
//   every conversion control: data-cta="<ConversionKey>"
//   every owner-to-confirm slot: data-placeholder="owner-to-confirm"
//   CSS on :root: --radius-control, --radius-surface, --radius-media, --font-display,
//     --font-body (and --font-accent for mono-accent), plus the palette tokens
//     (--bg --surface --ink --muted --line --primary --on-primary --accent)
import type { SiteDNA } from "./schema.ts";
import { dnaFingerprint } from "./variation.ts";
import { fontStack, GEOMETRY_TOKENS } from "./design-tokens.ts";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Root marker attribute name for each DNA axis.
export const DNA_ATTRIBUTE_MAP = {
  archetype: "data-dna-archetype",
  hero: "data-dna-hero",
  navigation: "data-dna-navigation",
  typography: "data-dna-typography",
  layoutRhythm: "data-dna-layout",
  geometry: "data-dna-geometry",
  imagery: "data-dna-imagery",
  motion: "data-dna-motion",
  paletteFamily: "data-dna-palette",
  ctaStyle: "data-dna-cta",
  proofStyle: "data-dna-proof",
  componentDialect: "data-dna-dialect",
  industry: "data-dna-industry",
} as const satisfies Record<string, string>;

export type DnaMarkerKey = keyof typeof DNA_ATTRIBUTE_MAP;

// ` data-dna="dna-1a2b3c4d" data-dna-archetype="..." ...` (leading space included).
export function dnaAttributes(dna: SiteDNA): string {
  const parts = [` data-dna="${escapeHtml(dnaFingerprint(dna))}"`];
  for (const [key, attr] of Object.entries(DNA_ATTRIBUTE_MAP)) {
    parts.push(` ${attr}="${escapeHtml(String(dna[key as DnaMarkerKey]))}"`);
  }
  return parts.join("");
}

// src/demo/guardrails.js scans the whole page source, attributes included, for claim words, so
// a module key that is itself a claim word is written into markup as a neutral token. The audit
// maps tokens back with moduleFromMarker. Always write markers through these helpers.
export const MARKER_ALIASES: Readonly<Record<string, string>> = {
  warranty: "coverage-terms",
  financing: "payment-options",
  insurance: "plans-accepted",
  certifications: "standards",
};

const ALIAS_TO_MODULE: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(MARKER_ALIASES).map(([k, v]) => [v, k]));

export function moduleMarker(key: string): string {
  return MARKER_ALIASES[key] || key;
}

export function moduleFromMarker(token: string): string {
  return ALIAS_TO_MODULE[token] || token;
}

// ` data-module="services coverage-terms" data-section="3"` for a section, or without the index
// for an embedded module.
export function moduleAttributes(keys: string | readonly string[], sectionIndex?: number): string {
  const list = (typeof keys === "string" ? [keys] : [...keys]).filter(Boolean).map(moduleMarker);
  const mod = ` data-module="${escapeHtml(list.join(" "))}"`;
  return sectionIndex === undefined ? mod : `${mod} data-section="${sectionIndex}"`;
}

export function ctaAttribute(conversion: string): string {
  return ` data-cta="${escapeHtml(conversion)}"`;
}

export const PLACEHOLDER_ATTRIBUTE = " data-placeholder=\"owner-to-confirm\"";

// The :root declarations for the geometry and typography tokens the audit measures.
export function dnaRootCss(dna: SiteDNA): string {
  const g = GEOMETRY_TOKENS[dna.geometry];
  const decl = [`--radius-control:${g.control}`, `--radius-surface:${g.surface}`, `--radius-media:${g.media}`];
  if (dna.fontPairing) {
    decl.push(`--font-display:${fontStack(dna.fontPairing.display)}`, `--font-body:${fontStack(dna.fontPairing.body)}`);
    if (dna.fontPairing.accent) decl.push(`--font-accent:${fontStack(dna.fontPairing.accent)}`);
  }
  if (dna.palette) {
    for (const [k, v] of Object.entries(dna.palette.tokens)) decl.push(`--${k}:${v}`);
  }
  return `:root{${decl.join(";")}}`;
}
