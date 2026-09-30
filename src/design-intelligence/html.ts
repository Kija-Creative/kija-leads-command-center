// A small, dependency free HTML and CSS reader for the design audit. It is forgiving (demo pages
// are generated, not hand written) and only as deep as the audit needs: an element tree with
// attributes, the text of <style> blocks, and CSS rules with their @media context.

export interface HtmlNode {
  tag: string;
  attrs: Record<string, string>;
  children: HtmlNode[];
  parent: HtmlNode | null;
  text: string;          // direct text of this element
}

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const RAW = new Set(["script", "style", "textarea", "title"]);
const TOKEN_RE = /<!--[\s\S]*?-->|<!doctype[^>]*>|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>|([^<]+)|</gi;
const ATTR_RE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

function decode(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function parseAttrs(src: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of src.matchAll(ATTR_RE)) {
    const name = m[1].toLowerCase();
    out[name] = decode(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return out;
}

export function parseHtml(html: string): HtmlNode {
  const root: HtmlNode = { tag: "#document", attrs: {}, children: [], parent: null, text: "" };
  let current = root;
  const src = String(html || "");
  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(src))) {
    const [whole, closing, rawTag, rawAttrs, selfClose, text] = m;
    if (text !== undefined) {
      current.text += decode(text);
      continue;
    }
    if (!rawTag) continue;
    const tag = rawTag.toLowerCase();
    if (closing) {
      let n: HtmlNode | null = current;
      while (n && n.tag !== tag) n = n.parent;
      if (n && n.parent) current = n.parent;
      continue;
    }
    const node: HtmlNode = { tag, attrs: parseAttrs(rawAttrs || ""), children: [], parent: current, text: "" };
    current.children.push(node);
    if (RAW.has(tag)) {
      const end = src.toLowerCase().indexOf(`</${tag}`, TOKEN_RE.lastIndex);
      const stop = end < 0 ? src.length : end;
      node.text = src.slice(TOKEN_RE.lastIndex, stop);
      const close = end < 0 ? src.length : src.indexOf(">", end) + 1;
      TOKEN_RE.lastIndex = close > 0 ? close : src.length;
      continue;
    }
    if (VOID.has(tag) || selfClose || whole.endsWith("/>")) continue;
    current = node;
  }
  return root;
}

export function walk(node: HtmlNode, fn: (n: HtmlNode) => void): void {
  for (const c of node.children) {
    fn(c);
    walk(c, fn);
  }
}

export function findAll(root: HtmlNode, test: (n: HtmlNode) => boolean): HtmlNode[] {
  const out: HtmlNode[] = [];
  walk(root, (n) => {
    if (test(n)) out.push(n);
  });
  return out;
}

export function textOf(node: HtmlNode): string {
  if (node.tag === "script" || node.tag === "style") return "";
  return `${node.text} ${node.children.map(textOf).join(" ")}`.replace(/\s+/g, " ").trim();
}

export function hasAncestor(node: HtmlNode, test: (n: HtmlNode) => boolean): boolean {
  let p = node.parent;
  while (p) {
    if (test(p)) return true;
    p = p.parent;
  }
  return false;
}

export function contains(node: HtmlNode, test: (n: HtmlNode) => boolean): boolean {
  if (test(node)) return true;
  return node.children.some((c) => contains(c, test));
}

// Tag structure two levels deep, for "identical card" detection.
export function skeleton(node: HtmlNode, depth = 2): string {
  if (depth === 0) return node.tag;
  return `${node.tag}(${node.children.map((c) => skeleton(c, depth - 1)).join(",")})`;
}

export function classList(node: HtmlNode): string[] {
  return String(node.attrs.class || "").split(/\s+/).filter(Boolean);
}

export interface CssRule {
  selector: string;
  body: string;
  media: string | null;
}

export function styleText(root: HtmlNode): string {
  return findAll(root, (n) => n.tag === "style").map((n) => n.text).join("\n");
}

// Flat list of rules; rules inside @media carry its condition. Comments are dropped.
export function cssRules(css: string): CssRule[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, " ");
  const out: CssRule[] = [];
  const parse = (text: string, media: string | null) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf("{", i);
      if (open < 0) break;
      const selector = text.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < text.length && depth > 0) {
        if (text[j] === "{") depth += 1;
        else if (text[j] === "}") depth -= 1;
        j += 1;
      }
      const body = text.slice(open + 1, j - 1);
      if (/^@media/i.test(selector)) parse(body, selector.replace(/^@media\s*/i, ""));
      else if (/^@(supports|layer|container)/i.test(selector)) parse(body, media);
      else if (!/^@/.test(selector)) out.push({ selector, body, media });
      i = j;
    }
  };
  parse(src, null);
  return out;
}

export function declarations(body: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const part of body.split(";")) {
    const at = part.indexOf(":");
    if (at < 0) continue;
    out.set(part.slice(0, at).trim().toLowerCase(), part.slice(at + 1).trim());
  }
  return out;
}

// Custom properties declared on :root or html (the last declaration wins, like the cascade).
export function rootTokens(rules: readonly CssRule[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const r of rules) {
    if (r.media) continue;
    if (!/(^|,)\s*(:root|html)\s*(,|$)/.test(r.selector)) continue;
    for (const [k, v] of declarations(r.body)) if (k.startsWith("--")) out.set(k, v);
  }
  return out;
}

// A CSS length in px (rem and em at 16px, % of 999 treated as fully round). NaN when unknown.
export function lengthPx(value: string): number {
  const v = String(value || "").trim().split(/\s+/)[0];
  if (v === "0") return 0;
  const m = v.match(/^(-?\d*\.?\d+)(px|rem|em|%)?$/);
  if (!m) return Number.NaN;
  const n = Number(m[1]);
  if (m[2] === "rem" || m[2] === "em") return n * 16;
  if (m[2] === "%") return n >= 50 ? 100000 : Number.NaN;
  return n;
}

// Durations in ms found in a transition or animation value.
export function durationsMs(value: string): number[] {
  return [...String(value).matchAll(/(\d*\.?\d+)(ms|s)\b/g)].map((m) => (m[2] === "s" ? Number(m[1]) * 1000 : Number(m[1])));
}
