// Home services: "dispatch". One sturdy newspaper grotesk in many weights, a
// hero that forks into "happening now" and "planning ahead", and a line drawn
// house with the systems running through it. HVAC, plumbing, septic, electrical.

import { esc, icon, starsSvg } from "../shared.js";
import { directionsLink, factsList, faqList, footerLegal, reviewsText, servicesNote, stepsList, themesNote } from "../parts.js";

const PALETTES = [
  {
    key: "ember",
    name: "Night shift and ember",
    vars: { bg: "oklch(0.175 0.012 45)", surface: "oklch(0.22 0.014 45)", ink: "oklch(0.965 0.006 60)", muted: "oklch(0.8 0.016 60)", line: "oklch(0.34 0.015 45)", primary: "oklch(0.7 0.19 42)", "on-primary": "oklch(0.16 0.02 42)", accent: "oklch(0.86 0.14 85)", band: "oklch(0.86 0.14 85)", "on-band": "oklch(0.2 0.03 60)", "band-muted": "oklch(0.33 0.04 60)", star: "oklch(0.2 0.03 60)" },
  },
  {
    key: "ultramarine",
    name: "Clean white and ultramarine",
    vars: { bg: "oklch(1 0 0)", surface: "oklch(0.965 0.012 265)", ink: "oklch(0.22 0.05 265)", muted: "oklch(0.45 0.04 265)", line: "oklch(0.88 0.02 265)", primary: "oklch(0.46 0.21 265)", "on-primary": "oklch(0.99 0 0)", accent: "oklch(0.88 0.16 95)", band: "oklch(0.46 0.21 265)", "on-band": "oklch(0.99 0 0)", "band-muted": "oklch(0.88 0.04 265)", star: "oklch(0.46 0.21 265)" },
  },
  {
    key: "spruce",
    name: "Deep spruce and coral",
    vars: { bg: "oklch(0.3 0.055 190)", surface: "oklch(0.345 0.06 190)", ink: "oklch(0.97 0.01 190)", muted: "oklch(0.85 0.03 190)", line: "oklch(0.46 0.055 190)", primary: "oklch(0.76 0.15 32)", "on-primary": "oklch(0.2 0.03 32)", accent: "oklch(0.86 0.1 185)", band: "oklch(0.76 0.15 32)", "on-band": "oklch(0.2 0.03 32)", "band-muted": "oklch(0.3 0.04 32)", star: "oklch(0.76 0.15 32)" },
  },
];

const PROMISE = {
  septic: ["When something backs up, start here.", "Cuando algo se tapa, empiece aquí."],
  plumbing: ["Leak, clog or no hot water? Start here.", "¿Fuga, tapón o sin agua caliente? Empiece aquí."],
  hvac: ["Too hot, too cold, or just not right? Start here.", "¿Mucho calor, mucho frío o algo no está bien? Empiece aquí."],
  electrical: ["Lights flickering or power out? Start here.", "¿Luces que parpadean o sin luz? Empiece aquí."],
  "garage-door": ["Door stuck, loud or off track? Start here.", "¿La puerta atorada, ruidosa o fuera de riel? Empiece aquí."],
  restoration: ["Water, fire or mold damage? Start here.", "¿Daño por agua, fuego o moho? Empiece aquí."],
  "appliance-repair": ["Washer, fridge or oven acting up? Start here.", "¿La lavadora, el refri o la estufa fallan? Empiece aquí."],
  "pest-control": ["Seeing pests where you should not? Start here.", "¿Ve plagas donde no debería? Empiece aquí."],
};
const PROMISE_DEFAULT = ["Something not working at home? Start with one call.", "¿Algo no funciona en casa? Empiece con una llamada."];

const STEPS = [
  { title: ["Call or send a request", "Llame o mande una solicitud"], body: ["Describe what you are seeing and where in the house.", "Describa lo que ve y en qué parte de la casa."] },
  { title: ["Talk it through", "Platíquelo"], body: ["Get a sense of the problem and the next step.", "Entienda el problema y el siguiente paso."] },
  { title: ["Schedule the visit", "Agende la visita"], body: ["Pick a time that works for the household.", "Elija un horario que le funcione a la casa."] },
];

const FAQ_BASE = [
  { q: ["What counts as an emergency?", "¿Qué cuenta como emergencia?"], a: ["Anything causing damage right now, or anything that feels unsafe. When in doubt, call and describe it.", "Cualquier cosa que esté causando daño ahora o que se sienta peligrosa. Si tiene duda, llame y descríbalo."] },
  { q: ["Can I get a quote before work starts?", "¿Me pueden dar precio antes de empezar?"], a: ["Ask when you call. A clear description and a few photos help.", "Pregunte cuando llame. Una descripción clara y unas fotos ayudan."] },
  { q: ["What should I have ready?", "¿Qué debo tener a la mano?"], a: ["Your address, what you are seeing or hearing, and when it started.", "Su dirección, lo que ve o escucha y cuándo empezó."] },
  { q: ["What if it feels dangerous?", "¿Y si se siente peligroso?"], a: ["If you smell gas or see sparks, get everyone out and call 911 first.", "Si huele a gas o ve chispas, salga de la casa con todos y llame primero al 911."] },
];
const FAQ_SEPTIC = { q: ["How often should a septic tank be pumped?", "¿Cada cuánto se debe vaciar una fosa séptica?"], a: ["It depends on the tank size and how many people live in the home. Ask for a recommendation for yours.", "Depende del tamaño de la fosa y de cuántas personas viven en la casa. Pida una recomendación para la suya."] };

function houseSvg(categoryKey) {
  const underground = categoryKey === "septic"
    ? `<path class="h-pipe" d="M150 292 V318 H262"/><path class="h-flow" d="M150 292 V318 H262"/><rect class="h-line" x="262" y="300" width="84" height="40" rx="18"/>`
    : `<path class="h-line" d="M296 292 V330 H340"/>`;
  return `<svg class="house" viewBox="0 0 360 350" aria-hidden="true" focusable="false"><g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path class="h-line h-draw" pathLength="1" d="M18 142 L180 30 L342 142"/>
<path class="h-line h-draw" pathLength="1" d="M52 120 V292 H308 V120"/>
<path class="h-line" d="M252 72 V40 H278 V90"/>
<path class="h-line" d="M52 206 H308"/>
<path class="h-line" d="M86 292 V246 H124 V292"/>
<rect class="h-line" x="230" y="224" width="44" height="68" rx="10"/>
<path class="h-line" d="M74 150 H170 M74 164 H170" stroke-dasharray="3 7"/>
<path class="h-pipe" d="M150 292 V236 H214 V180 H280 V132"/>
<path class="h-flow" d="M150 292 V236 H214 V180 H280 V132"/>
<circle class="h-dot" cx="280" cy="132" r="6"/>
<path class="h-ground" d="M0 292 H360"/>
${underground}
</g></svg>`;
}

const CSS = `
:root{--display:"Schibsted Grotesk",system-ui,sans-serif;--body:"Schibsted Grotesk",system-ui,sans-serif;--radius:14px;--btn-radius:999px;--max:1200px;--ease:cubic-bezier(.16,1,.3,1)}
body{font-size:1.075rem;line-height:1.62}
.hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--line)}
.hd-in{display:flex;align-items:center;gap:1rem;min-height:4.5rem}
.brand{font-weight:850;font-size:1.15rem;letter-spacing:-.01em;text-decoration:none;margin-right:auto;line-height:1.1;max-width:60vw}
.hd-call{display:none;align-items:center;gap:.6rem;padding:.7rem 1.1rem;border-radius:999px;background:var(--primary);color:var(--on-primary);font-weight:750;text-decoration:none}
@media (min-width:640px){.hd-call{display:inline-flex}}
.live{position:relative;width:.6rem;height:.6rem;border-radius:50%;background:currentColor}
.live::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px solid currentColor;animation:live 2s var(--ease) infinite}
@keyframes live{from{transform:scale(.5);opacity:1}to{transform:scale(1.8);opacity:0}}

.hero{padding:clamp(2.5rem,6vw,5.5rem) 0 clamp(3rem,6vw,5rem)}
.hero-grid{display:grid;gap:clamp(2rem,5vw,3.5rem)}
@media (min-width:980px){.hero-grid{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);align-items:center}}
.hero-cat{font-weight:600;color:var(--muted)}
.name{margin-top:1rem;font-weight:900;letter-spacing:-.035em;line-height:.92;font-size:var(--nsize);overflow-wrap:break-word;animation:kj-rise .9s var(--ease) both}
.name--xl{--nsize:clamp(3.4rem,10vw,6rem)}
.name--l{--nsize:clamp(2.9rem,8vw,5.2rem)}
.name--m{--nsize:clamp(2.4rem,6.4vw,4.4rem)}
.name--s{--nsize:clamp(2.1rem,5.2vw,3.6rem)}
.promise{margin-top:1.5rem;font-size:clamp(1.3rem,2.3vw,1.7rem);font-weight:500;line-height:1.3;max-width:30ch;animation:kj-rise .9s .1s var(--ease) both}
.sub{margin-top:1rem;color:var(--muted);max-width:50ch;animation:kj-rise .9s .18s var(--ease) both}
.about{margin-top:1rem;max-width:58ch}

.fork{display:grid;gap:.75rem;animation:kj-rise 1s .2s var(--ease) both}
.fork-now{position:relative;display:grid;gap:.35rem;padding:clamp(1.5rem,3vw,2.25rem);border-radius:var(--radius);background:var(--primary);color:var(--on-primary);text-decoration:none;overflow:hidden;transition:transform .35s var(--ease)}
.fork-now:hover{transform:translateY(-3px)}
.fork-now small{display:flex;align-items:center;gap:.6rem;font-size:1rem;font-weight:700}
.fork-now strong{font-size:clamp(2.1rem,5vw,3.2rem);font-weight:900;letter-spacing:-.03em;line-height:1}
.fork-now span.go{display:inline-flex;align-items:center;gap:.4rem;font-weight:650}
.fork-now::after{content:"";position:absolute;right:-3rem;top:-3rem;width:12rem;height:12rem;border-radius:50%;border:2px solid currentColor;opacity:.18}
.fork-later{display:grid;gap:.3rem;padding:1.4rem clamp(1.5rem,3vw,2.25rem);border-radius:var(--radius);border:1.5px solid var(--line);text-decoration:none;transition:border-color .2s,background-color .2s}
.fork-later:hover{border-color:var(--ink)}
.fork-later strong{font-size:1.3rem;font-weight:800;letter-spacing:-.01em;display:flex;justify-content:space-between;align-items:center;gap:1rem}
.fork-later span{color:var(--muted)}

.proof{background:var(--band);color:var(--on-band);--star:var(--on-band)}
.proof-in{display:grid;gap:1.5rem 3rem;padding:clamp(2rem,4vw,3rem) 0;align-items:center}
@media (min-width:760px){.proof-in{grid-template-columns:auto auto 1fr}}
.proof-num{font-size:clamp(4.5rem,11vw,7.5rem);font-weight:900;letter-spacing:-.05em;line-height:.8}
.proof-meta{display:grid;gap:.4rem}
.proof-meta b{font-size:1.2rem}
.proof-line{color:var(--band-muted);max-width:40ch}
.proof .stars{width:9rem;height:1.8rem}

.sec{padding:clamp(4rem,9vw,7rem) 0}
.h2{font-weight:850;letter-spacing:-.03em;font-size:clamp(2.2rem,5vw,3.6rem);line-height:1}
.lede{margin-top:1rem;color:var(--muted);max-width:48ch}
.svc-grid{display:grid;gap:3rem}
@media (min-width:920px){.svc-grid{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:5rem;align-items:start}.svc-art{position:sticky;top:7rem}}
.house{width:100%;max-width:26rem;margin-top:2.5rem}
.h-line{stroke:var(--muted);stroke-width:2}
.h-draw{stroke-dasharray:1;animation:kj-draw 2s .2s var(--ease) both;--len:1}
.h-pipe{stroke:var(--line);stroke-width:9}
.h-flow{stroke:var(--primary);stroke-width:3;stroke-dasharray:6 14;animation:flow 1.6s linear infinite}
@keyframes flow{to{stroke-dashoffset:-40}}
.h-dot{fill:var(--primary)}
.h-ground{stroke:var(--ink);stroke-width:2}
.svc-list li{border-bottom:1px solid var(--line)}
.svc-list li:first-child{border-top:1px solid var(--line)}
.svc-list a{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1.25rem .25rem;text-decoration:none;font-size:clamp(1.2rem,2.2vw,1.55rem);font-weight:650;letter-spacing:-.015em;transition:padding .35s var(--ease),color .2s}
.svc-list a:hover{padding-left:.9rem;color:var(--primary)}
.svc-list .ico{color:var(--muted);transition:transform .35s var(--ease)}
.svc-list a:hover .ico{transform:translateX(4px);color:var(--primary)}
.svc-note{margin-top:1.25rem;color:var(--muted);font-size:.95rem}

.themes{background:var(--surface)}
.themes-list{display:grid;gap:1rem 3rem;margin-top:2.5rem}
@media (min-width:760px){.themes-list{grid-template-columns:1fr 1fr}}
.themes-list li{display:flex;gap:1rem;align-items:baseline;font-size:clamp(1.35rem,2.6vw,1.9rem);font-weight:750;letter-spacing:-.02em;line-height:1.2;padding:1rem 0;border-bottom:1.5px solid var(--line)}
.themes-list .ico{color:var(--primary);width:1.4rem;height:1.4rem;transform:translateY(.2rem)}
.themes-note{margin-top:1.75rem;color:var(--muted);font-size:.95rem}

.steps{display:grid;gap:1.5rem;margin-top:3rem;position:relative}
@media (min-width:860px){.steps{grid-template-columns:repeat(3,1fr);gap:2.5rem}.steps::before{content:"";position:absolute;left:1.6rem;right:10%;top:1.6rem;height:2px;background:var(--line)}}
.steps li{position:relative}
.step-n{position:relative;display:grid;place-items:center;width:3.2rem;height:3.2rem;border-radius:50%;background:var(--primary);color:var(--on-primary);font-weight:850;font-size:1.25rem;margin-bottom:1.25rem}
.steps h3{font-size:1.35rem;font-weight:800;letter-spacing:-.015em;margin-bottom:.35rem}
.steps p{color:var(--muted);max-width:30ch}

.req-grid{display:grid;gap:2.5rem}
@media (min-width:980px){.req-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem}.req-side{position:sticky;top:7rem;align-self:start}}
.req-panel{padding:clamp(1.25rem,3vw,2.25rem);border-radius:var(--radius);background:var(--surface)}
.req-side p{margin-top:1rem;color:var(--muted);max-width:40ch}
.req-call{display:inline-flex;align-items:center;gap:.6rem;margin-top:1.5rem;font-size:1.6rem;font-weight:850;letter-spacing:-.02em;color:var(--primary);text-decoration:none}

.area-grid{display:grid;gap:2rem}
@media (min-width:900px){.area-grid{grid-template-columns:1fr 1fr;gap:4rem}}
.area-big{font-size:clamp(1.6rem,3.4vw,2.4rem);font-weight:800;letter-spacing:-.025em;line-height:1.15;margin-top:1.25rem;max-width:22ch}
.area-note{margin-top:1rem;color:var(--muted)}
.facts{margin:0;display:grid}
.facts div{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:1.1rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:1px solid var(--line)}
.facts dt{color:var(--muted);font-weight:600}
.facts dd{margin:0;font-weight:700}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-weight:700}

.faq-grid{display:grid;gap:2rem}
@media (min-width:900px){.faq-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem}}

.ft{background:var(--surface);padding:3.5rem 0 2.5rem}
.ft-in{display:grid;gap:1.5rem}
.ft-name{font-weight:900;letter-spacing:-.035em;font-size:clamp(2rem,5vw,3.4rem);line-height:1}
.ft-call{font-size:clamp(1.6rem,4vw,2.6rem);font-weight:850;letter-spacing:-.02em;color:var(--primary);text-decoration:none}
.ft-row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;color:var(--muted);font-size:.95rem}
`;

function render(ctx) {
  const t = ctx.t;
  const promise = ctx.copyOr("headline", PROMISE[ctx.categoryKey] || PROMISE_DEFAULT);
  const sub = ctx.copyOr("subhead", [
    `${ctx.ratingText} stars from ${ctx.reviewsText} Google reviews. Call or send a request, whichever is easier.`,
    `${ctx.ratingText} estrellas en ${ctx.reviewsText} reseñas de Google. Llame o mande una solicitud, lo que le sea más fácil.`,
  ]);
  const ctaPrimary = ctx.copyOr("ctaPrimary", ["Happening right now?", "¿Está pasando ahora?"]);
  const ctaSecondary = ctx.copyOr("ctaSecondary", ["Planning ahead?", "¿Está planeando?"]);
  const faq = ctx.categoryKey === "septic" ? [FAQ_BASE[0], FAQ_SEPTIC, FAQ_BASE[1], FAQ_BASE[2]] : FAQ_BASE;

  const header = `<header class="hd"><div class="wrap hd-in"><a class="brand" href="#top">${ctx.name}</a>${ctx.langToggle}${ctx.tel ? `<a class="hd-call" href="${esc(ctx.tel)}"><span class="live" aria-hidden="true"></span>${t("Call", "Llamar")} ${esc(ctx.phone)}</a>` : ""}</div></header>`;

  const fork = `<div class="fork">${ctx.tel ? `<a class="fork-now" href="${esc(ctx.tel)}"><small><span class="live" aria-hidden="true"></span>${ctaPrimary}</small><strong>${esc(ctx.phone)}</strong><span class="go">${t("Tap to call", "Toque para llamar")}${icon("arrow")}</span></a>` : ""}<a class="fork-later" href="#request"><strong>${ctaSecondary}${icon("arrow")}</strong><span>${t("Send a request and pick a time to talk.", "Mande una solicitud y elija cuándo hablar.")}</span></a></div>`;

  const hero = `<section class="hero" id="top"><div class="wrap hero-grid"><div>
<p class="hero-cat">${ctx.categoryT}, ${esc(ctx.placeRaw)}</p>
<h1 class="name name--${ctx.nameScale}">${ctx.name}</h1>
<p class="promise">${promise}</p>
<p class="sub">${sub}</p>
${ctx.about ? `<p class="about">${ctx.about}</p>` : ""}
</div>${fork}</div></section>`;

  const proof = `<section class="proof" data-rating="${esc(ctx.rating)}" data-reviews="${esc(ctx.reviews)}"${ctx.i18n.aria("Google rating", "Calificación en Google")}><div class="wrap proof-in"><p class="proof-num">${esc(ctx.ratingText)}</p><div class="proof-meta">${starsSvg(ctx.rating, "proof")}<b>${reviewsText(ctx)}</b></div><p class="proof-line">${t("Thank you to every customer who took the time to leave one.", "Gracias a cada cliente que se tomó el tiempo de dejar una.")}</p></div></section>`;

  const services = ctx.services.length
    ? `<section class="sec" id="services"><div class="wrap svc-grid"><div class="svc-art"><h2 class="h2">${t("Services", "Servicios")}</h2><p class="lede">${t("Call about any of these, or describe something else.", "Llame por cualquiera de estos o describa otra cosa.")}</p>${houseSvg(ctx.categoryKey)}</div><div><ul class="svc-list">${ctx.services.map((s) => `<li class="rv"><a href="#request"><span>${esc(s)}</span>${icon("arrow")}</a></li>`).join("")}</ul>${servicesNote(ctx)}</div></div></section>`
    : "";

  const themes = ctx.themes.length
    ? `<section class="sec themes"><div class="wrap"><h2 class="h2">${t("What customers mention", "Lo que mencionan los clientes")}</h2><ul class="themes-list">${ctx.themes.map((th) => `<li class="rv">${icon("check")}<span>${esc(th)}</span></li>`).join("")}</ul>${themesNote(ctx)}</div></section>`
    : "";

  const steps = `<section class="sec"><div class="wrap"><h2 class="h2">${t("How it works", "Cómo funciona")}</h2>${stepsList(ctx, STEPS)}</div></section>`;

  const request = `<section class="sec" id="request"><div class="wrap req-grid"><div class="req-side"><h2 class="h2">${t(ctx.formCopy.title[0], ctx.formCopy.title[1])}</h2><p>${t(ctx.formCopy.intro[0], ctx.formCopy.intro[1])}</p>${ctx.tel ? `<a class="req-call" href="${esc(ctx.tel)}">${icon("phone")}${esc(ctx.phone)}</a>` : ""}</div><div class="req-panel">${ctx.form}</div></div></section>`;

  const area = `<section class="sec" id="visit"><div class="wrap area-grid"><div><h2 class="h2">${t("Service area", "Zona de servicio")}</h2><p class="area-big">${t(`Based in ${ctx.placeRaw}.`, `Con base en ${ctx.placeRaw}.`)}</p><p class="area-note">${t("Call to confirm your address is in range.", "Llame para confirmar que su dirección está dentro de la zona.")}</p>${directionsLink(ctx)}</div>${factsList(ctx)}</div></section>`;

  const faqSec = `<section class="sec" id="faq"><div class="wrap faq-grid"><h2 class="h2">${t("Before you call", "Antes de llamar")}</h2>${faqList(ctx, faq)}</div></section>`;

  const footer = `<footer class="ft"><div class="wrap ft-in"><p class="ft-name">${ctx.name}</p>${ctx.tel ? `<a class="ft-call" href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}<div class="ft-row"><span>${ctx.categoryT}, ${esc(ctx.placeRaw)}</span>${footerLegal(ctx)}</div></div></footer>`;

  return { css: CSS, body: `${header}<main>${hero}${proof}${services}${themes}${steps}${request}${area}${faqSec}</main>${footer}` };
}

export const template = {
  key: "home-services",
  label: "Dispatch",
  fontsHref: "https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:ital,wght@0,400..900;1,400..900&display=swap",
  palettes: PALETTES,
  render,
};
