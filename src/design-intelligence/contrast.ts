// WCAG 2.x contrast for palette tokens. Used when an industry profile loads (every palette must
// pass before any site uses it) and by the audit on the tokens a page actually declares.

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

// Accepts #rgb, #rrggbb, #rrggbbaa (alpha ignored), rgb() and rgba(). Returns null otherwise.
export function parseColor(value: string): Rgb | null {
  const v = String(value || "").trim().toLowerCase();
  let m = v.match(/^#([0-9a-f]{3})$/);
  if (m) {
    const [r, g, b] = m[1].split("").map((c) => parseInt(c + c, 16));
    return { r, g, b };
  }
  m = v.match(/^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/);
  if (m) {
    return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16) };
  }
  m = v.match(/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/);
  if (m) return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
  return null;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(rgb: Rgb): number {
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

// Contrast ratio between two colours, or null when either cannot be parsed.
export function contrastRatio(a: string, b: string): number | null {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return null;
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

// The pairs every palette must pass at AA for normal text (4.5:1).
export const CONTRAST_PAIRS: readonly { fg: string; bg: string; label: string }[] = [
  { fg: "ink", bg: "bg", label: "body text on the page background" },
  { fg: "ink", bg: "surface", label: "body text on surfaces" },
  { fg: "muted", bg: "bg", label: "secondary text on the page background" },
  { fg: "on-primary", bg: "primary", label: "button text on the primary colour" },
];

export const AA_NORMAL = 4.5;

// Contrast failures for a token map, as sentences. `where` names the palette in the sentence.
export function paletteContrastErrors(tokens: Record<string, string>, where: string): string[] {
  const errors: string[] = [];
  for (const pair of CONTRAST_PAIRS) {
    const fg = tokens[pair.fg];
    const bg = tokens[pair.bg];
    if (!fg || !bg) continue;
    const ratio = contrastRatio(fg, bg);
    if (ratio === null) {
      errors.push(`${where}: the ${pair.fg} or ${pair.bg} token is not a colour the engine can read (${fg}, ${bg}).`);
    } else if (ratio < AA_NORMAL) {
      errors.push(`${where}: ${pair.label} (${pair.fg} ${fg} on ${pair.bg} ${bg}) is ${ratio}:1, below the WCAG AA 4.5:1 minimum.`);
    }
  }
  return errors;
}
