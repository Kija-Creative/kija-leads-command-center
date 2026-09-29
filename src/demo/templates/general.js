// General: "storefront". A chunky friendly serif, an awning edged hero in the
// brand color, and a window sticker that carries the real rating. For any
// local service without a vertical of its own.

import { esc, icon, starsSvg } from "../shared.js";
import { directionsLink, factsList, faqList, footerLegal, reviewsText, servicesNote, stepsList, themesNote } from "../parts.js";

const PALETTES = [
  {
    key: "tomato",
    name: "Tomato awning",
    vars: { bg: "oklch(1 0 0)", surface: "oklch(0.96 0.012 30)", ink: "oklch(0.22 0.02 30)", muted: "oklch(0.45 0.02 30)", line: "oklch(0.88 0.012 30)", primary: "oklch(0.5 0.19 32)", "on-primary": "oklch(0.99 0 0)", accent: "oklch(0.5 0.19 32)", band: "oklch(0.5 0.19 32)", "on-band": "oklch(0.99 0.004 30)", "band-muted": "oklch(0.93 0.03 30)", sticker: "oklch(0.99 0 0)", "on-sticker": "oklch(0.22 0.02 30)", star: "oklch(0.5 0.19 32)" },
  },
  {
    key: "ink",
    name: "Navy ink and marigold",
    vars: { bg: "oklch(0.985 0.004 255)", surface: "oklch(0.95 0.012 255)", ink: "oklch(0.21 0.04 262)", muted: "oklch(0.44 0.03 262)", line: "oklch(0.88 0.015 262)", primary: "oklch(0.47 0.16 258)", "on-primary": "oklch(0.99 0 0)", accent: "oklch(0.84 0.14 80)", band: "oklch(0.28 0.08 262)", "on-band": "oklch(0.985 0.004 255)", "band-muted": "oklch(0.86 0.03 262)", sticker: "oklch(0.84 0.14 80)", "on-sticker": "oklch(0.21 0.04 262)", star: "oklch(0.21 0.04 262)" },
  },
  {
    key: "sage",
    name: "Deep sage and apricot",
    vars: { bg: "oklch(0.975 0.008 150)", surface: "oklch(0.94 0.018 150)", ink: "oklch(0.22 0.03 150)", muted: "oklch(0.42 0.03 150)", line: "oklch(0.86 0.02 150)", primary: "oklch(0.42 0.08 152)", "on-primary": "oklch(0.99 0 0)", accent: "oklch(0.8 0.12 65)", band: "oklch(0.4 0.07 152)", "on-band": "oklch(0.985 0.006 150)", "band-muted": "oklch(0.9 0.03 150)", sticker: "oklch(0.8 0.12 65)", "on-sticker": "oklch(0.22 0.03 150)", star: "oklch(0.22 0.03 150)" },
  },
];

const STEPS = [
  { title: ["Reach out", "Comuníquese"], body: ["Call or send a quick request.", "Llame o mande una solicitud rápida."] },
  { title: ["Talk it through", "Platíquelo"], body: ["Share what you need and when.", "Comparta qué necesita y cuándo."] },
  { title: ["Get it done", "Listo"], body: ["Settle the details and set a time.", "Definan los detalles y el horario."] },
];

const FAQ = [
  { q: ["How do I get started?", "¿Cómo empiezo?"], a: ["Call or send a request with a few details.", "Llame o mande una solicitud con unos detalles."] },
  { q: ["What should I have ready?", "¿Qué debo tener a la mano?"], a: ["What you need, where, and when. Photos help if it is something worth seeing.", "Qué necesita, dónde y cuándo. Las fotos ayudan si es algo que conviene ver."] },
  { q: ["Can I get a price first?", "¿Me pueden dar precio primero?"], a: ["Ask when you call. The more detail you share, the clearer the answer.", "Pregunte cuando llame. Entre más detalles comparta, más clara la respuesta."] },
];

const CSS = `
:root{--display:"Young Serif",Georgia,serif;--body:"Albert Sans",system-ui,sans-serif;--radius:10px;--btn-radius:999px;--max:1180px;--ease:cubic-bezier(.22,1,.36,1)}
body{font-size:1.075rem;line-height:1.65}
.hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--line)}
.hd-in{display:flex;align-items:center;gap:1.25rem;min-height:4.25rem}
.brand{font-family:var(--display);font-size:1.3rem;text-decoration:none;margin-right:auto;line-height:1.1;max-width:58vw}
.nav{display:none;gap:1.5rem;font-weight:600;font-size:.95rem}
.nav a{text-decoration:none}
.nav a:hover{color:var(--primary)}
@media (min-width:920px){.nav{display:flex}}
.hd-call{display:none;align-items:center;gap:.5rem;padding:.65rem 1.1rem;border-radius:999px;background:var(--primary);color:var(--on-primary);font-weight:700;text-decoration:none}
@media (min-width:620px){.hd-call{display:inline-flex}}

.hero{position:relative;background:var(--band);color:var(--on-band);padding:clamp(3rem,7vw,6rem) 0 clamp(4.5rem,9vw,7rem);--lang-fg:var(--on-band);--lang-on:var(--band)}
.hero::after{content:"";position:absolute;left:0;right:0;bottom:-17px;height:18px;background:radial-gradient(circle at 18px 0,var(--band) 17.5px,transparent 18px) 0 0/36px 18px repeat-x}
.hero-grid{display:grid;gap:clamp(2.5rem,6vw,4rem);align-items:center}
@media (min-width:940px){.hero-grid{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)}}
.hero-cat{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;font-weight:600;color:var(--band-muted)}
.name{margin-top:1rem;font-family:var(--display);font-weight:400;line-height:.98;letter-spacing:-.02em;font-size:var(--nsize);overflow-wrap:break-word;animation:kj-rise .9s var(--ease) both}
.name--xl{--nsize:clamp(3.6rem,11vw,7rem)}
.name--l{--nsize:clamp(3rem,8.4vw,5.6rem)}
.name--m{--nsize:clamp(2.5rem,6.6vw,4.6rem)}
.name--s{--nsize:clamp(2.2rem,5.4vw,3.8rem)}
.promise{margin-top:1.5rem;font-size:clamp(1.3rem,2.4vw,1.75rem);font-weight:500;line-height:1.3;max-width:30ch;animation:kj-rise .9s .12s var(--ease) both}
.sub{margin-top:1rem;color:var(--band-muted);max-width:48ch;animation:kj-rise .9s .2s var(--ease) both}
.about{margin-top:1rem;max-width:58ch}
.ctas{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem;animation:kj-rise .9s .28s var(--ease) both}
.btn{display:inline-flex;align-items:center;gap:.55rem;padding:1rem 1.5rem;border-radius:999px;font-weight:700;text-decoration:none;border:1.5px solid transparent;transition:transform .35s var(--ease),background-color .2s,color .2s}
.btn:hover{transform:translateY(-2px)}
.btn-light{background:var(--on-band);color:var(--band)}
.btn-line{border-color:currentColor}
.btn-line:hover{background:var(--on-band);color:var(--band)}

.sticker{position:relative;display:grid;place-content:center;justify-items:center;gap:.4rem;width:min(100%,19rem);aspect-ratio:1;margin-inline:auto;border-radius:50%;background:var(--sticker);color:var(--on-sticker);text-align:center;transform:rotate(-7deg);box-shadow:0 18px 40px -18px rgb(0 0 0 / .45);animation:stick 1.1s .25s var(--ease) both}
.sticker::before{content:"";position:absolute;inset:.8rem;border-radius:50%;border:1.5px dashed currentColor;opacity:.45}
@keyframes stick{from{opacity:0;transform:rotate(-18deg) scale(.86)}to{opacity:1;transform:rotate(-7deg)}}
.sticker small{font-weight:700;font-size:.85rem}
.sticker-num{font-family:var(--display);font-size:clamp(3.8rem,8vw,4.8rem);line-height:.9}
.sticker b{font-size:1rem;max-width:12ch;line-height:1.25}

.sec{padding:clamp(4.5rem,9vw,7.5rem) 0}
.h2{font-family:var(--display);font-weight:400;font-size:clamp(2.2rem,5vw,3.6rem);line-height:1.05;letter-spacing:-.015em}
.lede{margin-top:1rem;color:var(--muted);max-width:48ch}
.svc{display:grid;gap:0 3.5rem;margin-top:2.5rem;counter-reset:svc}
@media (min-width:820px){.svc{grid-template-columns:1fr 1fr}}
.svc li{display:flex;gap:1.25rem;align-items:baseline;padding:1.25rem 0;border-bottom:1px solid var(--line)}
.svc .n{font-family:var(--display);color:var(--primary);font-size:1.2rem;min-width:2rem}
.svc .nm{font-size:clamp(1.15rem,2vw,1.4rem);font-weight:600;line-height:1.3}
.svc-note{margin-top:1.25rem;color:var(--muted);font-size:.95rem}

.themes{background:var(--surface)}
.themes-list{margin-top:2.5rem;display:grid;gap:0}
.themes-list li{font-family:var(--display);font-size:clamp(1.6rem,3.8vw,2.8rem);line-height:1.15;padding:1rem 0;border-bottom:1px solid var(--line);display:flex;gap:1rem;align-items:baseline}
.themes-list .ico{color:var(--primary);width:1.4rem;height:1.4rem;flex:none}
.themes-note{margin-top:1.75rem;color:var(--muted);font-size:.95rem}

.steps{display:grid;gap:2rem;margin-top:3rem}
@media (min-width:820px){.steps{grid-template-columns:repeat(3,1fr);gap:3rem}}
.steps li{padding-top:1.5rem;border-top:3px solid var(--ink)}
.step-n{display:block;font-family:var(--display);font-size:3rem;line-height:1;color:var(--primary);margin-bottom:.75rem}
.steps h3{font-size:1.3rem;font-weight:700;margin-bottom:.35rem}
.steps p{color:var(--muted);max-width:30ch}

.req-grid{display:grid;gap:2.5rem}
@media (min-width:980px){.req-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem}.req-side{position:sticky;top:6.5rem;align-self:start}}
.req-side p{margin-top:1rem;color:var(--muted);max-width:40ch}
.req-panel{padding:clamp(1.25rem,3vw,2.25rem);border-radius:var(--radius);background:var(--surface)}
.req-call{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-family:var(--display);font-size:1.6rem;color:var(--primary);text-decoration:none}

.visit-grid{display:grid;gap:2.5rem}
@media (min-width:900px){.visit-grid{grid-template-columns:1fr 1fr;gap:4rem}}
.visit-big{margin-top:1.25rem;font-family:var(--display);font-size:clamp(1.5rem,3vw,2.2rem);line-height:1.2}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:1px solid var(--line)}
.facts dt{color:var(--muted);font-weight:600}
.facts dd{margin:0;font-weight:700}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-weight:700}

.faq-grid{display:grid;gap:2rem}
@media (min-width:900px){.faq-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem}}

.ft{background:var(--band);color:var(--on-band);padding:4rem 0 2.5rem}
.ft-name{font-family:var(--display);font-size:clamp(2.2rem,6vw,4.2rem);line-height:1;overflow-wrap:break-word}
.ft-row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem 2rem;margin-top:1.75rem;color:var(--band-muted)}
.ft-row a{color:var(--on-band);font-weight:700}
.legal{font-size:.85rem}
`;

function render(ctx) {
  const t = ctx.t;
  const promise = ctx.copyOr("headline", [`Right here in ${ctx.cityRaw}. Start with a call.`, `Aquí mismo en ${ctx.cityRaw}. Empiece con una llamada.`]);
  const sub = ctx.copyOr("subhead", [
    `${ctx.ratingText} stars from ${ctx.reviewsText} Google reviews. Call, or send a request and pick a time to talk.`,
    `${ctx.ratingText} estrellas en ${ctx.reviewsText} reseñas de Google. Llame o mande una solicitud y elija cuándo hablar.`,
  ]);
  const ctaPrimary = ctx.copyOr("ctaPrimary", ["Call", "Llamar"]);
  const ctaSecondary = ctx.copyOr("ctaSecondary", ctx.formCopy.cta);

  const header = `<header class="hd"><div class="wrap hd-in"><a class="brand" href="#top">${ctx.name}</a><nav class="nav"${ctx.i18n.aria("Sections", "Secciones")}>${ctx.services.length ? `<a href="#services">${t("Services", "Servicios")}</a>` : ""}<a href="#request">${t("Request", "Solicitud")}</a><a href="#visit">${t("Visit", "Visítenos")}</a></nav>${ctx.langToggle}${ctx.tel ? `<a class="hd-call" href="${esc(ctx.tel)}">${icon("phone")}${esc(ctx.phone)}</a>` : ""}</div></header>`;

  const hero = `<section class="hero" id="top"><div class="wrap hero-grid"><div>
<p class="hero-cat">${icon("pin")}<span>${ctx.categoryT}, ${esc(ctx.placeRaw)}</span></p>
<h1 class="name name--${ctx.nameScale}">${ctx.name}</h1>
<p class="promise">${promise}</p>
<p class="sub">${sub}</p>
${ctx.about ? `<p class="about">${ctx.about}</p>` : ""}
<div class="ctas">${ctx.tel ? `<a class="btn btn-light" href="${esc(ctx.tel)}">${icon("phone")}${ctaPrimary} ${esc(ctx.phone)}</a>` : ""}<a class="btn btn-line" href="#request">${ctaSecondary}${icon("arrow")}</a></div>
</div><div class="sticker" data-rating="${esc(ctx.rating)}" data-reviews="${esc(ctx.reviews)}"><small>${t("Google rating", "Calificación en Google")}</small><span class="sticker-num" data-rating-num>${esc(ctx.ratingText)}</span>${starsSvg(ctx.rating, "sticker")}<b>${reviewsText(ctx)}</b></div></div></section>`;

  const services = ctx.services.length
    ? `<section class="sec" id="services"><div class="wrap"><h2 class="h2">${t("How we can help", "Cómo podemos ayudar")}</h2><ol class="svc">${ctx.services.map((s, i) => `<li class="rv"><span class="n" aria-hidden="true">${i + 1}</span><span class="nm">${esc(s)}</span></li>`).join("")}</ol>${servicesNote(ctx)}</div></section>`
    : "";

  const themes = ctx.themes.length
    ? `<section class="sec themes"><div class="wrap"><h2 class="h2">${t("What people mention", "Lo que menciona la gente")}</h2><ul class="themes-list">${ctx.themes.map((th) => `<li class="rv">${icon("check")}<span>${esc(th)}</span></li>`).join("")}</ul>${themesNote(ctx)}</div></section>`
    : "";

  const steps = `<section class="sec"><div class="wrap"><h2 class="h2">${t("How it works", "Cómo funciona")}</h2>${stepsList(ctx, STEPS)}</div></section>`;

  const request = `<section class="sec" id="request"><div class="wrap req-grid"><div class="req-side"><h2 class="h2">${t(ctx.formCopy.title[0], ctx.formCopy.title[1])}</h2><p>${t(ctx.formCopy.intro[0], ctx.formCopy.intro[1])}</p>${ctx.tel ? `<a class="req-call" href="${esc(ctx.tel)}">${icon("phone")}${esc(ctx.phone)}</a>` : ""}</div><div class="req-panel">${ctx.form}</div></div></section>`;

  const visit = `<section class="sec" id="visit"><div class="wrap visit-grid"><div><h2 class="h2">${t("Visit", "Visítenos")}</h2><p class="visit-big">${t(`Based in ${ctx.placeRaw}.`, `Con base en ${ctx.placeRaw}.`)}</p>${directionsLink(ctx)}</div>${factsList(ctx)}</div></section>`;

  const faqSec = `<section class="sec" id="faq"><div class="wrap faq-grid"><h2 class="h2">${t("Questions", "Preguntas")}</h2>${faqList(ctx, FAQ)}</div></section>`;

  const footer = `<footer class="ft"><div class="wrap"><p class="ft-name">${ctx.name}</p><div class="ft-row"><span>${ctx.categoryT}, ${esc(ctx.placeRaw)}</span>${ctx.tel ? `<a href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}</div><div class="ft-row">${footerLegal(ctx)}</div></div></footer>`;

  return { css: CSS, body: `${header}<main>${hero}${services}${themes}${steps}${request}${visit}${faqSec}</main>${footer}` };
}

export const template = {
  key: "general",
  label: "Storefront",
  fontsHref: "https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700&family=Young+Serif&display=swap",
  palettes: PALETTES,
  render,
};
