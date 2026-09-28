// Personal care: "the chair". A high contrast Didone over a friendly grotesk,
// a rotating rating seal, a menu board with dotted leaders, and booking at the
// center of everything. Barbers, salons, nails, tattoo, pet grooming.

import { esc, icon, starsSvg } from "../shared.js";
import { directionsLink, factsList, faqList, footerLegal, reviewsText, servicesNote, themesNote } from "../parts.js";

const PALETTES = [
  {
    key: "oxblood",
    name: "Oxblood and blush",
    vars: { bg: "oklch(0.27 0.085 18)", surface: "oklch(0.315 0.095 18)", ink: "oklch(0.955 0.022 15)", muted: "oklch(0.85 0.04 15)", line: "oklch(0.45 0.08 18)", primary: "oklch(0.88 0.07 15)", "on-primary": "oklch(0.25 0.085 18)", accent: "oklch(0.88 0.07 15)", star: "oklch(0.88 0.07 15)", board: "oklch(0.955 0.022 15)", "on-board": "oklch(0.25 0.085 18)", "board-muted": "oklch(0.45 0.07 18)", "board-line": "oklch(0.25 0.085 18 / .35)" },
  },
  {
    key: "mint",
    name: "Parlor mint and red",
    vars: { bg: "oklch(0.92 0.05 170)", surface: "oklch(0.88 0.06 170)", ink: "oklch(0.2 0.03 170)", muted: "oklch(0.38 0.03 170)", line: "oklch(0.2 0.03 170 / .22)", primary: "oklch(0.52 0.2 25)", "on-primary": "oklch(0.99 0 0)", accent: "oklch(0.52 0.2 25)", star: "oklch(0.52 0.2 25)", board: "oklch(0.2 0.03 170)", "on-board": "oklch(0.95 0.03 170)", "board-muted": "oklch(0.8 0.04 170)", "board-line": "oklch(0.95 0.03 170 / .3)" },
  },
  {
    key: "noir",
    name: "Noir and violet",
    vars: { bg: "oklch(0.15 0 0)", surface: "oklch(0.2 0 0)", ink: "oklch(0.97 0 0)", muted: "oklch(0.8 0 0)", line: "oklch(0.33 0 0)", primary: "oklch(0.72 0.19 305)", "on-primary": "oklch(0.15 0.02 305)", accent: "oklch(0.72 0.19 305)", star: "oklch(0.72 0.19 305)", board: "oklch(0.2 0 0)", "on-board": "oklch(0.97 0 0)", "board-muted": "oklch(0.78 0 0)", "board-line": "oklch(0.97 0 0 / .25)" },
  },
];

const PROMISE = {
  barber: ["Sit down. Look sharp. Book your chair.", "Siéntese. Salga impecable. Reserve su silla."],
  "hair-salon": ["Book the chair. Leave feeling like yourself.", "Reserve su silla. Salga sintiéndose usted."],
  "nail-salon": ["Pick your set. Pick your time. Done.", "Elija su diseño. Elija su hora. Listo."],
  tattoo: ["Bring the idea. Book the consult.", "Traiga la idea. Reserve su consulta."],
  "pet-grooming": ["Book the groom. Bring the good dog.", "Reserve el baño. Traiga a su perrito."],
};
const PROMISE_DEFAULT = ["Book your time in a few taps.", "Reserve su hora en unos toques."];

const STEPS = {
  default: [
    { title: ["Pick a service", "Elija un servicio"], body: ["Choose from the menu or ask for something else.", "Escoja del menú o pida otra cosa."] },
    { title: ["Choose a time", "Elija un horario"], body: ["Pick a day and the part of the day that works.", "Elija un día y la hora que le funcione."] },
    { title: ["Take a seat", "Tome asiento"], body: ["Show up, sit back, and leave looking right.", "Llegue, relájese y salga como quiere."] },
  ],
  tattoo: [
    { title: ["Share your idea", "Comparta su idea"], body: ["Size, placement and a few reference images.", "Tamaño, lugar y unas imágenes de referencia."] },
    { title: ["Book the consult", "Reserve la consulta"], body: ["Talk it through and settle the design.", "Platíquelo y definan el diseño."] },
    { title: ["Sit for it", "Su sesión"], body: ["Come in rested and ready on the day.", "Venga descansado y listo ese día."] },
  ],
  "pet-grooming": [
    { title: ["Pick a service", "Elija un servicio"], body: ["Choose from the menu or ask about your breed.", "Escoja del menú o pregunte por su raza."] },
    { title: ["Choose a time", "Elija un horario"], body: ["Pick a day that works for drop off.", "Elija un día para dejarlo."] },
    { title: ["Pick up a clean pup", "Recoja a su mascota"], body: ["Come back at pick up time.", "Regrese a la hora de recogerlo."] },
  ],
};

const BRING = {
  barber: ["A photo of the cut you want helps.", "Una foto del corte que quiere ayuda."],
  "hair-salon": ["A photo of the look you want helps.", "Una foto del look que quiere ayuda."],
  "nail-salon": ["Inspiration photos for the set you want.", "Fotos de inspiración del diseño que quiere."],
  tattoo: ["Reference images, plus the size and placement you have in mind.", "Imágenes de referencia y el tamaño y lugar que tiene en mente."],
  "pet-grooming": ["Vaccination records and any notes about coat or temperament.", "El registro de vacunas y cualquier nota sobre el pelo o el carácter."],
};

function faqFor(key) {
  return [
    { q: ["Do you take walk ins?", "¿Atienden sin cita?"], a: ["Call to check. Booking ahead is the surest way to get the time you want.", "Llame para confirmar. Reservar antes es la forma más fácil de conseguir su horario."] },
    { q: ["How do I change a booking?", "¿Cómo cambio mi cita?"], a: ["Call with as much notice as you can.", "Llame con toda la anticipación que pueda."] },
    { q: ["What should I bring?", "¿Qué debo traer?"], a: BRING[key] || ["Just yourself and any questions you have.", "Solo usted y sus preguntas."] },
  ];
}

// The seal rotates slowly; its ring text is chrome, the numbers are the record.
function sealHtml(ctx) {
  const en = `Rated ${ctx.ratingText} on Google  ·  ${ctx.reviewsText} Google reviews  ·  `;
  const es = `Calificación ${ctx.ratingText} en Google  ·  ${ctx.reviewsText} reseñas de Google  ·  `;
  return `<div class="seal" data-rating="${esc(ctx.rating)}" data-reviews="${esc(ctx.reviews)}"><svg class="seal-ring" viewBox="0 0 220 220" aria-hidden="true" focusable="false"><defs><path id="seal-path" d="M110 110 m-88 0 a88 88 0 1 1 176 0 a88 88 0 1 1 -176 0"/></defs><circle cx="110" cy="110" r="106" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="110" cy="110" r="70" fill="none" stroke="currentColor" stroke-width="1"/><text class="seal-text"><textPath href="#seal-path" textLength="548" lengthAdjust="spacing"${ctx.i18n.ti(en, es)}>${esc(en)}</textPath></text></svg><div class="seal-core"><span class="seal-num">${esc(ctx.ratingText)}</span>${starsSvg(ctx.rating, "seal")}</div><p class="sr-only">${reviewsText(ctx)}</p></div>`;
}

const CSS = `
:root{--display:"Bodoni Moda",Didot,"Bodoni 72",Georgia,serif;--body:"Karla",system-ui,sans-serif;--radius:0px;--btn-radius:999px;--max:1200px;--ease:cubic-bezier(.22,1,.36,1)}
body{font-size:1.075rem;line-height:1.65}
.hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--line)}
.hd-in{display:flex;align-items:center;gap:1rem;min-height:4.5rem}
.brand{font-family:var(--display);font-style:italic;font-weight:600;font-size:1.5rem;text-decoration:none;margin-right:auto;line-height:1;max-width:55vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hd-book{display:inline-flex;align-items:center;gap:.4rem;padding:.65rem 1.2rem;border-radius:999px;background:var(--primary);color:var(--on-primary);font-weight:700;text-decoration:none}
.hd-tel{display:none;align-items:center;gap:.4rem;font-weight:700;text-decoration:none}
@media (min-width:700px){.hd-tel{display:inline-flex}}

.hero{position:relative;overflow:hidden;padding:clamp(3rem,7vw,6rem) 0 clamp(3.5rem,7vw,6rem)}
.pole{position:absolute;left:0;top:0;bottom:0;width:clamp(10px,1.4vw,18px);background:repeating-linear-gradient(-45deg,var(--primary) 0 10px,var(--bg) 10px 20px,var(--ink) 20px 30px,var(--bg) 30px 40px);background-size:100% 56.57px;animation:pole 2.4s linear infinite}
@keyframes pole{to{background-position:0 56.57px}}
.hero-grid{display:grid;gap:clamp(2.5rem,6vw,4rem);align-items:center}
@media (min-width:960px){.hero-grid{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)}}
.hero-cat{font-weight:500;color:var(--muted);letter-spacing:.01em}
.name{margin-top:1rem;font-family:var(--display);font-weight:800;line-height:.9;letter-spacing:-.025em;font-size:var(--nsize);overflow-wrap:break-word;font-variation-settings:"opsz" 96;animation:kj-rise 1s var(--ease) both}
.name--xl{--nsize:clamp(4rem,13vw,8.5rem)}
.name--l{--nsize:clamp(3.2rem,9.5vw,6.6rem)}
.name--m{--nsize:clamp(2.7rem,7.4vw,5.2rem)}
.name--s{--nsize:clamp(2.3rem,5.8vw,4.2rem)}
.name em{font-style:italic;font-weight:500}
.promise{margin-top:1.5rem;font-size:clamp(1.3rem,2.4vw,1.75rem);font-weight:500;line-height:1.3;max-width:28ch;animation:kj-rise 1s .12s var(--ease) both}
.sub{margin-top:1rem;color:var(--muted);max-width:48ch;animation:kj-rise 1s .2s var(--ease) both}
.about{margin-top:1rem;max-width:58ch}
.ctas{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem;animation:kj-rise 1s .28s var(--ease) both}
.btn{display:inline-flex;align-items:center;gap:.55rem;padding:1rem 1.5rem;border-radius:999px;font-weight:700;text-decoration:none;border:1.5px solid transparent;transition:transform .35s var(--ease),background-color .2s,color .2s}
.btn:hover{transform:translateY(-2px)}
.btn-primary{background:var(--primary);color:var(--on-primary)}
.btn-ghost{border-color:currentColor}
.btn-ghost:hover{background:var(--ink);color:var(--bg)}

.seal{position:relative;width:min(100%,21rem);aspect-ratio:1;margin-inline:auto;color:var(--ink);animation:kj-fade 1.2s .3s var(--ease) both}
.seal-ring{width:100%;height:100%;animation:spin 40s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.seal-text{font-family:var(--body);font-size:12.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;fill:currentColor}
.seal-core{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:.35rem;--star:var(--primary)}
.seal-num{font-family:var(--display);font-weight:800;font-size:clamp(3.6rem,8vw,4.8rem);line-height:.9}
.seal .stars{width:6rem;height:1.2rem}
.proof-line{margin-top:1.25rem;text-align:center;font-weight:700}

.sec{padding:clamp(4rem,9vw,7.5rem) 0}
.h2{font-family:var(--display);font-weight:700;font-size:clamp(2.4rem,5.6vw,4.2rem);line-height:1;letter-spacing:-.02em}
.h2 em{font-style:italic;font-weight:500}
.board{margin-top:2.75rem;background:var(--board);color:var(--on-board);padding:clamp(1.5rem,4vw,3rem);outline:1.5px solid var(--board);outline-offset:6px}
.menu{display:grid;gap:0 3.5rem}
@media (min-width:860px){.menu{grid-template-columns:1fr 1fr}}
.menu li{display:flex;align-items:baseline;gap:.75rem;padding:1rem 0;border-bottom:1px solid var(--board-line)}
.menu .nm{font-family:var(--display);font-size:clamp(1.25rem,2.3vw,1.6rem);font-weight:600;line-height:1.2}
.menu .dots{flex:1;min-width:1.5rem;border-bottom:2px dotted var(--board-muted);transform:translateY(-.3rem)}
.menu a{font-weight:700;font-size:.9rem;text-decoration:none;white-space:nowrap;display:inline-flex;gap:.3rem;align-items:center}
.menu a:hover{text-decoration:underline;text-underline-offset:.25em}
.svc-note{margin-top:1.5rem;color:var(--board-muted);font-size:.95rem}

.themes-list{margin-top:2.5rem;display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;font-family:var(--display);font-style:italic;font-size:clamp(1.8rem,4.6vw,3.4rem);line-height:1.15}
.themes-list li{display:inline-flex;align-items:center;gap:1.5rem}
.themes-list li:not(:last-child)::after{content:"";width:.5rem;height:.5rem;background:var(--primary);transform:rotate(45deg)}
.themes-note{margin-top:2rem;color:var(--muted);font-size:.95rem}
.themes{background:var(--surface)}

.steps{display:grid;gap:2rem;margin-top:3rem}
@media (min-width:820px){.steps{grid-template-columns:repeat(3,1fr);gap:3rem}}
.step-n{display:block;font-family:var(--display);font-style:italic;font-weight:500;font-size:4.5rem;line-height:.9;color:var(--primary);margin-bottom:.5rem}
.steps h3{font-family:var(--display);font-size:1.6rem;font-weight:700;margin-bottom:.4rem}
.steps p{color:var(--muted);max-width:30ch}

.req-grid{display:grid;gap:2.5rem}
@media (min-width:980px){.req-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem}.req-side{position:sticky;top:7rem;align-self:start}}
.req-side p{margin-top:1rem;color:var(--muted);max-width:40ch}
.req-panel{padding:clamp(1.25rem,3vw,2.5rem);border:1.5px solid var(--line)}
.req-call{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-weight:700;font-size:1.25rem}

.visit-grid{display:grid;gap:2.5rem}
@media (min-width:900px){.visit-grid{grid-template-columns:1fr 1fr;gap:4rem}}
.hours-big{margin-top:1.5rem;font-family:var(--display);font-size:clamp(1.6rem,3.4vw,2.4rem);line-height:1.2}
.visit-note{margin-top:1rem;color:var(--muted)}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:1px solid var(--line)}
.facts dt{color:var(--muted)}
.facts dd{margin:0;font-weight:700}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-weight:700}

.faq-grid{display:grid;gap:2rem}
@media (min-width:900px){.faq-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem}}
.faq summary{font-family:var(--display);font-size:1.3rem;font-weight:600}

.ft{border-top:1px solid var(--line);padding:4rem 0 2.5rem;text-align:center}
.ft-name{font-family:var(--display);font-style:italic;font-weight:600;font-size:clamp(2.6rem,7vw,5rem);line-height:1;overflow-wrap:break-word}
.ft-row{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem 2rem;margin-top:1.5rem;color:var(--muted)}
.ft-row a{color:var(--ink);font-weight:700}
.legal{margin-top:2rem;font-size:.85rem;color:var(--muted)}
`;

function render(ctx) {
  const t = ctx.t;
  const key = ctx.categoryKey;
  const promise = ctx.copyOr("headline", PROMISE[key] || PROMISE_DEFAULT);
  const sub = ctx.copyOr("subhead", [
    `${ctx.ratingText} stars from ${ctx.reviewsText} Google reviews in ${ctx.cityState}.`,
    `${ctx.ratingText} estrellas en ${ctx.reviewsText} reseñas de Google en ${ctx.cityState}.`,
  ]);
  const ctaPrimary = ctx.copyOr("ctaPrimary", ctx.formCopy.cta);
  const ctaSecondary = ctx.copyOr("ctaSecondary", ["Call", "Llamar"]);
  const steps = STEPS[key] || STEPS.default;

  const header = `<header class="hd"><div class="wrap hd-in"><a class="brand" href="#top">${ctx.name}</a>${ctx.langToggle}${ctx.tel ? `<a class="hd-tel" href="${esc(ctx.tel)}">${icon("phone")}${esc(ctx.phone)}</a>` : ""}<a class="hd-book" href="#request">${icon("calendar")}${t("Book", "Reservar")}</a></div></header>`;

  const hero = `<section class="hero" id="top">${key === "barber" ? "<div class=\"pole\" aria-hidden=\"true\"></div>" : ""}<div class="wrap hero-grid"><div>
<p class="hero-cat">${ctx.categoryT}, ${esc(ctx.placeRaw)}</p>
<h1 class="name name--${ctx.nameScale}">${ctx.name}</h1>
<p class="promise">${promise}</p>
<p class="sub">${sub}</p>
${ctx.about ? `<p class="about">${ctx.about}</p>` : ""}
<div class="ctas"><a class="btn btn-primary" href="#request">${icon("calendar")}${ctaPrimary}</a>${ctx.tel ? `<a class="btn btn-ghost" href="${esc(ctx.tel)}">${icon("phone")}${ctaSecondary} ${esc(ctx.phone)}</a>` : ""}</div>
</div><div>${sealHtml(ctx)}<p class="proof-line" aria-hidden="true">${reviewsText(ctx)}</p></div></div></section>`;

  const services = ctx.services.length
    ? `<section class="sec" id="services"><div class="wrap"><h2 class="h2">${t("The menu", "El menú")}</h2><div class="board"><ul class="menu">${ctx.services.map((s) => `<li class="rv"><span class="nm">${esc(s)}</span><span class="dots" aria-hidden="true"></span><a href="#request">${t("Book", "Reservar")}${icon("arrow")}</a></li>`).join("")}</ul>${servicesNote(ctx)}</div></div></section>`
    : "";

  const themes = ctx.themes.length
    ? `<section class="sec themes"><div class="wrap"><h2 class="h2">${t("What clients say", "Lo que dicen los clientes")}</h2><ul class="themes-list">${ctx.themes.map((th) => `<li class="rv">${esc(th)}</li>`).join("")}</ul>${themesNote(ctx)}</div></section>`
    : "";

  const stepsSec = `<section class="sec"><div class="wrap"><h2 class="h2">${t("Your visit", "Su visita")}</h2><ol class="steps">${steps.map((s, i) => `<li class="rv"><span class="step-n" aria-hidden="true">${i + 1}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  const request = `<section class="sec" id="request"><div class="wrap req-grid"><div class="req-side"><h2 class="h2">${t(ctx.formCopy.title[0], ctx.formCopy.title[1])}</h2><p>${t(ctx.formCopy.intro[0], ctx.formCopy.intro[1])}</p>${ctx.tel ? `<a class="req-call" href="${esc(ctx.tel)}">${icon("phone")}${esc(ctx.phone)}</a>` : ""}</div><div class="req-panel">${ctx.form}</div></div></section>`;

  const visit = `<section class="sec" id="visit"><div class="wrap visit-grid"><div><h2 class="h2">${t("Find the chair", "Encuéntrenos")}</h2>${ctx.hours ? `<p class="hours-big">${esc(ctx.hours)}</p>` : `<p class="visit-note">${t("Call for today's hours.", "Llame para confirmar el horario de hoy.")}</p>`}${directionsLink(ctx)}</div>${factsList(ctx)}</div></section>`;

  const faqSec = `<section class="sec" id="faq"><div class="wrap faq-grid"><h2 class="h2">${t("Before you book", "Antes de reservar")}</h2>${faqList(ctx, faqFor(key))}</div></section>`;

  const footer = `<footer class="ft"><div class="wrap"><p class="ft-name">${ctx.name}</p><div class="ft-row"><span>${ctx.categoryT}, ${esc(ctx.placeRaw)}</span>${ctx.tel ? `<a href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}</div>${footerLegal(ctx)}</div></footer>`;

  return { css: CSS, body: `${header}<main>${hero}${services}${themes}${stepsSec}${request}${visit}${faqSec}</main>${footer}` };
}

export const template = {
  key: "personal-care",
  label: "The chair",
  fontsHref: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Karla:wght@400;500;700&display=swap",
  palettes: PALETTES,
  render,
};
