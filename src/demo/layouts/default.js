// The shared default layout. Stub directions render with it until a builder
// replaces the stub with the direction's own layout, so every registered
// direction produces a complete, guardrail passing page from day one. It is
// also the reference for how a direction composes the building blocks.
//
// It reads only the standard palette tokens (bg, surface, ink, muted, line,
// primary, on-primary, accent) and two font tokens (--display, --body).

import {
  bookButton,
  callButton,
  faqBlock,
  formHeading,
  heroPhoto,
  promiseLine,
  ratingProof,
  REQUEST_ID,
  servicesConfirm,
  servicesList,
  shortCta,
  siteFooter,
  siteHeader,
  stepsBlock,
  themesBlock,
  visitDetails,
} from "../blocks.js";
import { esc } from "../shared.js";

export const DEFAULT_VARIANTS = {
  hero: ["split", "center"],
  services: ["list", "grid"],
  proof: ["strip", "figure"],
};

export const DEFAULT_CSS = `
:root{--radius:10px;--btn-radius:999px;--max:1180px;--ease:cubic-bezier(.22,1,.36,1)}
body{font-family:var(--body)}
.b-hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--line)}
.b-hd__in{display:flex;align-items:center;gap:1rem;min-height:4.25rem}
.b-brand{font-family:var(--display);font-weight:700;font-size:1.35rem;line-height:1;text-decoration:none;margin-right:auto;max-width:55vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.b-nav{display:none;gap:1.5rem;font-weight:600}
.b-nav a{text-decoration:none}
@media (min-width:980px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:.75rem}
.b-hd__tel{display:none;align-items:center;gap:.4rem;font-weight:700;text-decoration:none}
@media (min-width:760px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;padding:.65rem 1.15rem;border-radius:var(--btn-radius);background:var(--primary);color:var(--on-primary);font-weight:700;text-decoration:none}
.btn{display:inline-flex;align-items:center;gap:.55rem;padding:.95rem 1.4rem;border-radius:var(--btn-radius);font-weight:700;text-decoration:none;border:1.5px solid transparent;transition:transform .3s var(--ease)}
.btn:hover{transform:translateY(-2px)}
.btn-primary{background:var(--primary);color:var(--on-primary)}
.btn-ghost{border-color:currentColor}
.dl-hero{padding:clamp(3rem,7vw,6rem) 0}
.dl-hero__grid{display:grid;gap:clamp(2rem,5vw,4rem);align-items:center}
@media (min-width:960px){.dl-hero--split .dl-hero__grid{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)}}
.dl-hero--center{text-align:center}
.dl-hero--center .dl-ctas{justify-content:center}
.dl-hero--center .dl-lede{margin-inline:auto}
.dl-cat{color:var(--muted);font-weight:600}
.dl-name{margin-top:.75rem;font-family:var(--display);font-weight:800;line-height:.95;letter-spacing:-.02em;font-size:var(--nsize);overflow-wrap:break-word}
.name--xl{--nsize:clamp(3.2rem,9vw,6rem)}
.name--l{--nsize:clamp(2.8rem,7.5vw,5.2rem)}
.name--m{--nsize:clamp(2.4rem,6vw,4.4rem)}
.name--s{--nsize:clamp(2rem,5vw,3.6rem)}
.dl-lede{margin-top:1.25rem;font-size:clamp(1.15rem,2vw,1.4rem);max-width:34ch}
.dl-sub{margin-top:.75rem;color:var(--muted);max-width:48ch}
.dl-hero--center .dl-sub{margin-inline:auto}
.dl-ctas{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}
.dl-hero .b-photo{border-radius:var(--radius);aspect-ratio:4/3}
.dl-hero--center .b-photo{margin-top:3rem;aspect-ratio:21/9}
.dl-sec{padding:clamp(3.5rem,8vw,6.5rem) 0}
.dl-sec--alt{background:var(--surface)}
.dl-h2{font-family:var(--display);font-weight:700;font-size:clamp(2rem,4.5vw,3.2rem);line-height:1.05;letter-spacing:-.01em}
.dl-intro{margin-top:.75rem;color:var(--muted);max-width:52ch}
.b-rating{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem 1.5rem}
.b-rating__num{font-family:var(--display);font-weight:800;font-size:clamp(3rem,7vw,4.5rem);line-height:1}
.b-rating__side{display:grid;gap:.35rem}
.b-rating__count{font-weight:700}
.b-rating__cap{flex-basis:100%;color:var(--muted)}
.b-rating--figure{flex-direction:column;align-items:flex-start}
.b-svc{margin-top:2rem;display:grid;gap:0 3rem}
@media (min-width:820px){.b-svc{grid-template-columns:1fr 1fr}}
.b-svc--list .b-svc__item{padding:1rem 0;border-bottom:1px solid var(--line);font-weight:600;font-size:1.15rem}
.b-svc--grid{gap:1rem}
@media (min-width:820px){.b-svc--grid{grid-template-columns:repeat(3,1fr)}}
.b-svc--grid .b-svc__item{padding:1.25rem;border:1px solid var(--line);border-radius:var(--radius);background:var(--bg);font-weight:600}
.b-svc-confirm,.svc-note{margin-top:1.25rem;color:var(--muted);font-size:.95rem}
.b-themes{margin-top:2rem;display:flex;flex-wrap:wrap;gap:.75rem}
.b-themes li{padding:.6rem 1rem;border:1px solid var(--line);border-radius:999px;font-weight:600}
.b-themes__note{margin-top:1.25rem;color:var(--muted);font-size:.95rem}
.steps{display:grid;gap:1.5rem;margin-top:2.5rem}
@media (min-width:820px){.steps{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}}
.step-n{display:block;font-family:var(--display);font-weight:800;font-size:2.5rem;line-height:1;color:var(--accent,var(--primary));margin-bottom:.5rem}
.steps h3{font-size:1.2rem;margin-bottom:.3rem}
.steps p{color:var(--muted)}
.dl-req{display:grid;gap:2.5rem}
@media (min-width:980px){.dl-req{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}}
.dl-panel{padding:clamp(1.25rem,3vw,2.25rem);border:1px solid var(--line);border-radius:var(--radius);background:var(--bg)}
.dl-visit{display:grid;gap:2rem}
@media (min-width:900px){.dl-visit{grid-template-columns:1fr 1fr;gap:4rem}}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:.9rem 0;border-bottom:1px solid var(--line)}
.facts dt{color:var(--muted)}
.facts dd{margin:0;font-weight:700}
.b-visit__pending{margin-top:1.25rem;display:grid;gap:.4rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.25rem;font-weight:700}
.b-ft{border-top:1px solid var(--line);padding:3.5rem 0 2.5rem}
.b-ft__name{font-family:var(--display);font-weight:800;font-size:clamp(2rem,5vw,3.5rem);line-height:1}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;color:var(--muted)}
.b-ft__row a{color:var(--ink);font-weight:700}
.legal{margin-top:1.5rem;font-size:.85rem;color:var(--muted)}
.stock-credits{margin-top:.5rem}
`;

export function renderDefault(ctx) {
  const t = ctx.t;
  const hero = ctx.variants.hero === "center" ? "center" : "split";
  const photo = heroPhoto(ctx, { sizes: hero === "center" ? "100vw" : "(min-width: 960px) 50vw, 100vw", tag: true });
  const sub = ctx.copyOr("subhead", [
    `${ctx.ratingText} stars from ${ctx.reviewsText} Google reviews in ${ctx.cityState}.`,
    `${ctx.ratingText} estrellas en ${ctx.reviewsText} reseñas de Google en ${ctx.cityState}.`,
  ]);
  const nav = [
    ctx.services.length ? { href: "#services", label: ["Services", "Servicios"] } : null,
    { href: "#visit", label: ["Visit", "Visítenos"] },
  ].filter(Boolean);
  const form = formHeading(ctx);

  const header = siteHeader(ctx, { nav, cta: shortCta(ctx) });
  const heroHtml = `<section class="dl-hero dl-hero--${hero}" id="top"><div class="wrap dl-hero__grid"><div>
<p class="dl-cat">${ctx.categoryT}, ${esc(ctx.placeRaw)}</p>
<h1 class="dl-name name--${ctx.nameScale}">${ctx.name}</h1>
<p class="dl-lede">${promiseLine(ctx)}</p>
<p class="dl-sub">${sub}</p>
${ctx.about ? `<p class="dl-sub">${ctx.about}</p>` : ""}
<div class="dl-ctas">${bookButton(ctx)}${callButton(ctx)}</div>
</div>${photo}</div></section>`;
  const proof = `<section class="dl-sec dl-sec--alt"><div class="wrap">${ratingProof(ctx, ctx.variants.proof === "figure" ? "figure" : "strip")}</div></section>`;
  const services = ctx.services.length
    ? `<section class="dl-sec" id="services"><div class="wrap"><h2 class="dl-h2">${t("Services", "Servicios")}</h2>${servicesList(ctx, ctx.variants.services === "grid" ? "grid" : "list")}${servicesConfirm(ctx)}</div></section>`
    : "";
  const themes = ctx.themes.length
    ? `<section class="dl-sec dl-sec--alt"><div class="wrap"><h2 class="dl-h2">${t("What customers mention", "Lo que mencionan los clientes")}</h2>${themesBlock(ctx)}</div></section>`
    : "";
  const steps = `<section class="dl-sec"><div class="wrap"><h2 class="dl-h2">${t("How it works", "Cómo funciona")}</h2>${stepsBlock(ctx)}</div></section>`;
  const request = `<section class="dl-sec dl-sec--alt" id="${REQUEST_ID}"><div class="wrap dl-req"><div><h2 class="dl-h2">${form.title}</h2><p class="dl-intro">${form.intro}</p></div><div class="dl-panel">${ctx.form}</div></div></section>`;
  const visit = `<section class="dl-sec" id="visit"><div class="wrap dl-visit"><h2 class="dl-h2">${t("Visit and hours", "Visita y horario")}</h2>${visitDetails(ctx)}</div></section>`;
  const faq = `<section class="dl-sec dl-sec--alt" id="faq"><div class="wrap"><h2 class="dl-h2">${t("Questions", "Preguntas")}</h2>${faqBlock(ctx)}</div></section>`;

  return { css: DEFAULT_CSS, body: `${header}<main>${heroHtml}${proof}${services}${themes}${steps}${request}${visit}${faq}</main>${siteFooter(ctx)}` };
}

// A stub direction: the brief's identity (fonts, palettes, keywords, suits)
// on the shared default layout. Builders replace the whole file.
export function stubDirection({ key, label, suits, keywords = [], fonts, palettes, imagery = {}, callbar = "call" }) {
  return {
    key,
    label,
    status: "stub",
    suits,
    keywords,
    fontsHref: fonts.href,
    palettes,
    variants: DEFAULT_VARIANTS,
    imagery: { photos: true, people: ["none", "hands", "partial"], ...imagery },
    callbar,
    render(ctx) {
      const out = renderDefault(ctx);
      return { css: `:root{--display:${fonts.display};--body:${fonts.body}}${out.css}`, body: out.body };
    },
  };
}
