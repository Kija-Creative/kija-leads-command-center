// Editorial dialect primitives: the worked example for dialect authors.
//
// Contract (src/design-intelligence/component-dialects.ts DialectPrimitives):
// - export `primitives` with dialect, css, button, sectionHeading, card, field, placeholder
// - every text input is plain text and is escaped here; `icon` and `media` are trusted markup
// - no colour, font or radius literals: everything reads the :root tokens that dnaRootCss(dna)
//   declares (--bg --surface --ink --muted --line --primary --on-primary --accent,
//   --radius-control --radius-surface --radius-media, --font-display --font-body)
// - classes are prefixed dx- so a direction's own CSS can sit beside them
// - behaviour follows shadcn Form (labelled fields, described hints, aria-invalid ready) and
//   the owner-to-confirm rule (placeholder carries data-placeholder)
import type {
  ButtonInput,
  CardInput,
  DialectPrimitives,
  FieldInput,
  HeadingInput,
  PlaceholderInput,
  PrimitiveTheme,
} from "../../../src/design-intelligence/component-dialects.ts";
import { ctaAttribute, escapeHtml, moduleAttributes, PLACEHOLDER_ATTRIBUTE } from "../../../src/design-intelligence/markers.ts";

function attrs(extra: Record<string, string> | undefined): string {
  if (!extra) return "";
  return Object.entries(extra).map(([k, v]) => ` ${escapeHtml(k)}="${escapeHtml(v)}"`).join("");
}

function css(theme: PrimitiveTheme): string {
  const quick = Math.min(theme.motion.maxDurationMs, 200);
  const reveal = theme.motion.maxDurationMs === 0 || !theme.motion.scrollReveal ? 0 : Math.min(theme.motion.maxDurationMs, 240);
  return `
.dx-btn{display:inline-flex;align-items:center;gap:.6em;min-height:48px;padding:.75em 1.4em;border:1px solid var(--ink);border-radius:var(--radius-control);font:600 1rem/1.2 var(--font-body);letter-spacing:.01em;text-decoration:none;color:var(--ink);background:transparent;transition:color ${quick}ms ease,background-color ${quick}ms ease,border-color ${quick}ms ease}
.dx-btn--primary{background:var(--primary);border-color:var(--primary);color:var(--on-primary)}
.dx-btn--primary:hover{background:var(--ink);border-color:var(--ink);color:var(--bg)}
.dx-btn--secondary:hover{background:var(--ink);color:var(--bg)}
.dx-btn--quiet{border-color:transparent;padding-inline:0;background:none;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.3em}
.dx-btn--quiet:hover{text-decoration-thickness:2px}
.dx-btn:focus-visible,.dx-field__input:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.dx-heading{max-width:62rem;margin:0 0 clamp(1.5rem,4vw,3rem)}
.dx-heading--center{margin-inline:auto;text-align:center}
.dx-heading__eyebrow{display:block;margin:0 0 .9rem;padding-top:.9rem;border-top:1px solid var(--line);font:600 .78rem/1.3 var(--font-body);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.dx-heading__title{margin:0;font:500 clamp(2rem,1.2rem + 3.2vw,3.6rem)/1.05 var(--font-display);letter-spacing:-.01em;color:var(--ink)}
.dx-heading__intro{max-width:38rem;margin:1rem 0 0;font:400 1.08rem/1.6 var(--font-body);color:var(--muted)}
.dx-card{padding-top:1.1rem;border-top:1px solid var(--ink)}
.dx-card__media{margin:0 0 1rem;border-radius:var(--radius-media);overflow:hidden}
.dx-card__meta{margin:0 0 .5rem;font:600 .78rem/1.3 var(--font-body);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.dx-card__title{margin:0 0 .5rem;font:500 1.45rem/1.2 var(--font-display);color:var(--ink)}
.dx-card__body{margin:0;font:400 1rem/1.6 var(--font-body);color:var(--muted)}
.dx-field{display:grid;gap:.4rem;margin:0 0 1.1rem}
.dx-field__label{font:600 .9rem/1.3 var(--font-body);color:var(--ink)}
.dx-field__hint{font:400 .85rem/1.4 var(--font-body);color:var(--muted)}
.dx-field__input{min-height:48px;padding:.7rem .2rem;border:0;border-bottom:1px solid var(--ink);border-radius:0;background:transparent;font:400 1rem/1.4 var(--font-body);color:var(--ink)}
textarea.dx-field__input{min-height:7rem;resize:vertical}
.dx-placeholder{padding:1.2rem 1.4rem;border:1px dashed var(--muted);border-radius:var(--radius-surface);background:var(--surface)}
.dx-placeholder__tag{display:inline-block;margin:0 0 .5rem;font:600 .72rem/1.3 var(--font-body);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.dx-placeholder__title{margin:0 0 .35rem;font:500 1.15rem/1.3 var(--font-display);color:var(--ink)}
.dx-placeholder__body{margin:0;font:400 .95rem/1.5 var(--font-body);color:var(--muted)}
.dx-reveal{transition:opacity ${reveal}ms ease,transform ${reveal}ms ease}
@media (prefers-reduced-motion: reduce){.dx-btn,.dx-reveal{transition:none}}
`;
}

function button(input: ButtonInput): string {
  const cta = input.cta ? ctaAttribute(input.cta) : "";
  const icon = input.icon ? `<span class="dx-btn__icon" aria-hidden="true">${input.icon}</span>` : "";
  return `<a class="dx-btn dx-btn--${input.variant}" href="${escapeHtml(input.href)}"${cta}${attrs(input.attrs)}>${icon}<span>${escapeHtml(input.label)}</span></a>`;
}

function sectionHeading(input: HeadingInput): string {
  const tag = `h${input.level}`;
  const id = input.id ? ` id="${escapeHtml(input.id)}"` : "";
  const eyebrow = input.eyebrow ? `<span class="dx-heading__eyebrow">${escapeHtml(input.eyebrow)}</span>` : "";
  const intro = input.intro ? `<p class="dx-heading__intro">${escapeHtml(input.intro)}</p>` : "";
  return `<div class="dx-heading${input.align === "center" ? " dx-heading--center" : ""}">${eyebrow}<${tag} class="dx-heading__title"${id}>${escapeHtml(input.title)}</${tag}>${intro}</div>`;
}

function card(input: CardInput): string {
  const tag = `h${input.level || 3}`;
  const media = input.media ? `<figure class="dx-card__media">${input.media}</figure>` : "";
  const meta = input.meta ? `<p class="dx-card__meta">${escapeHtml(input.meta)}</p>` : "";
  return `<article class="dx-card">${media}${meta}<${tag} class="dx-card__title">${escapeHtml(input.title)}</${tag}><p class="dx-card__body">${escapeHtml(input.body)}</p></article>`;
}

function field(input: FieldInput): string {
  const id = escapeHtml(input.id);
  const hintId = input.hint ? `${id}-hint` : "";
  const described = hintId ? ` aria-describedby="${hintId}"` : "";
  const required = input.required ? " required" : "";
  const auto = input.autocomplete ? ` autocomplete="${escapeHtml(input.autocomplete)}"` : "";
  const common = `id="${id}" name="${escapeHtml(input.name)}" class="dx-field__input"${described}${required}${auto}`;
  let control: string;
  if (input.type === "textarea") control = `<textarea ${common}></textarea>`;
  else if (input.type === "select") control = `<select ${common}>${(input.options || []).map((o) => `<option>${escapeHtml(o)}</option>`).join("")}</select>`;
  else control = `<input type="${input.type}" ${common}>`;
  const hint = input.hint ? `<span class="dx-field__hint" id="${hintId}">${escapeHtml(input.hint)}</span>` : "";
  return `<div class="dx-field"><label class="dx-field__label" for="${id}">${escapeHtml(input.label)}</label>${control}${hint}</div>`;
}

function placeholder(input: PlaceholderInput): string {
  return `<div class="dx-placeholder"${moduleAttributes(input.module)}${PLACEHOLDER_ATTRIBUTE}><span class="dx-placeholder__tag">To confirm with the owner</span><p class="dx-placeholder__title">${escapeHtml(input.title)}</p><p class="dx-placeholder__body">${escapeHtml(input.body)}</p></div>`;
}

export const primitives: DialectPrimitives = {
  dialect: "editorial",
  css,
  button,
  sectionHeading,
  card,
  field,
  placeholder,
};
