// Calm response (research/design-home-contractor.md, home services 5). Steady
// and clear in a bad moment: crisis support, not an ad. A dark hero with a
// plain headline and an oversized call button, beside it a "Right now" card of
// four general safety steps. Then a vertical timeline of what usually happens
// next, labeled as the typical process. Hyperlegible type, one serif italic
// reassurance line per section, and no motion beyond a focus ring.

import {
  callButton,
  faqBlock,
  formHeading,
  ratingProof,
  REQUEST_ID,
  servicesConfirm,
  siteFooter,
  siteHeader,
  themesBlock,
  visitDetails,
} from "../blocks.js";
import { esc, icon } from "../shared.js";
import { hsBlurb, hsGlyph, whileYouWait } from "./hs-dispatch-triage.js";

const PALETTES = [
  { key: "calm-slate", name: "Slate and signal", vars: { bg: "#f3f5f7", surface: "#ffffff", ink: "#16202a", muted: "#55616d", line: "#d8dee4", primary: "#c43f0b", "on-primary": "#ffffff", accent: "#2b7a9b", hero: "#1c2a36", "on-hero": "#f3f5f7", "hero-muted": "#aebbc7", "hero-line": "#33475a", card: "#ffffff", "card-ink": "#16202a", band: "#1c2a36", "on-band": "#f3f5f7" } },
  { key: "calm-water", name: "Deep water", vars: { bg: "#0f1b24", surface: "#162633", ink: "#e8eef3", muted: "#9db0bf", line: "#243a4b", primary: "#45b3e0", "on-primary": "#0b1620", accent: "#ffcf5c", hero: "#0b1620", "on-hero": "#e8eef3", "hero-muted": "#9db0bf", "hero-line": "#23394a", card: "#162633", "card-ink": "#e8eef3", band: "#45b3e0", "on-band": "#0b1620" } },
  { key: "calm-clay", name: "Smoke and clay", vars: { bg: "#f4f1ee", surface: "#ffffff", ink: "#221c1a", muted: "#62564f", line: "#e2d9d1", primary: "#b8452a", "on-primary": "#ffffff", accent: "#5f7d6e", hero: "#2b2523", "on-hero": "#f4f1ee", "hero-muted": "#c3b7ae", "hero-line": "#4a403b", card: "#ffffff", "card-ink": "#221c1a", band: "#2b2523", "on-band": "#f4f1ee" } },
];

// What usually happens next, by trade. Typical practice, not a promise.
const STAGES = {
  restoration: [
    [["Assess", "Evaluar"], ["Someone looks at what got wet or damaged, and how far it spread.", "Alguien revisa qué se mojó o dañó y hasta dónde llegó."]],
    [["Protect", "Proteger"], ["Stop the source, move belongings and keep the damage from growing.", "Detener la fuente, mover pertenencias y evitar que el daño crezca."]],
    [["Dry or clean", "Secar o limpiar"], ["Water comes out, air moves and surfaces get cleaned until it is dry.", "Se saca el agua, se mueve el aire y se limpian las superficies hasta que seque."]],
    [["Repair", "Reparar"], ["Once it is dry and clean, the rooms get put back together.", "Cuando todo está seco y limpio, se reparan los cuartos."]],
  ],
  plumbing: [
    [["Assess", "Evaluar"], ["Find where the water is coming from and what it has reached.", "Encontrar de dónde viene el agua y hasta dónde llegó."]],
    [["Stop the source", "Detener la fuente"], ["Shut off the line or clear the blockage so it stops getting worse.", "Cerrar la línea o destapar para que no empeore."]],
    [["Repair", "Reparar"], ["Fix the pipe, fixture or drain, with the options explained first.", "Arreglar el tubo, el mueble o el drenaje, con las opciones explicadas antes."]],
    [["Check and tidy", "Revisar y limpiar"], ["Run the water, check for leaks and clean up the work area.", "Abrir el agua, revisar fugas y limpiar el área de trabajo."]],
  ],
  septic: [
    [["Assess", "Evaluar"], ["Find where the backup is and how full the system is.", "Encontrar dónde está el tapón y qué tan lleno está el sistema."]],
    [["Relieve", "Aliviar"], ["Pump the tank or clear the line so the house can drain again.", "Vaciar la fosa o destapar la línea para que la casa drene otra vez."]],
    [["Find the cause", "Buscar la causa"], ["Look at baffles, lines and the drain field for what caused it.", "Revisar deflectores, líneas y el campo de drenaje para ver qué lo causó."]],
    [["Repair", "Reparar"], ["Talk through repairs, if any are needed, before work starts.", "Platicar reparaciones, si hacen falta, antes de empezar."]],
  ],
  electrical: [
    [["Make it safe", "Hacerlo seguro"], ["Power to the problem circuit gets shut off first.", "Primero se corta la corriente del circuito con problema."]],
    [["Find the fault", "Encontrar la falla"], ["Trace the circuit to the outlet, switch, fixture or panel at fault.", "Seguir el circuito hasta el contacto, apagador, lámpara o centro de carga que falla."]],
    [["Repair", "Reparar"], ["Replace or fix what failed, with the options explained first.", "Cambiar o arreglar lo que falló, con las opciones explicadas antes."]],
    [["Test", "Probar"], ["Power goes back on and every affected point gets tested.", "Se regresa la corriente y se prueba cada punto afectado."]],
  ],
};

const WAVE = "<svg class=\"cr-wave\" viewBox=\"0 0 1440 60\" preserveAspectRatio=\"none\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M0 38c120-18 240-18 360 0s240 18 360 0 240-18 360 0 240 18 360 0\"/></svg>";

const CSS = `
:root{--display:"Atkinson Hyperlegible Next",system-ui,sans-serif;--body:"Atkinson Hyperlegible Next",system-ui,sans-serif;--mono:"Atkinson Hyperlegible Mono",ui-monospace,monospace;--serif:"Source Serif 4",Georgia,serif;--radius:8px;--btn-radius:8px;--chip-radius:8px;--max:1160px;--field:var(--surface);--field-line:var(--line);--star:var(--accent);--lang-fg:var(--ink);--lang-on:var(--bg);--callbar-radius:10px;--urgent-bg:var(--primary);--urgent-ink:var(--on-primary)}
body{font-size:1.09rem;line-height:1.65}
*,*::before,*::after{transition:none !important}
.cr-mono{font-family:var(--mono);font-weight:500;font-size:.8rem;letter-spacing:.04em;text-transform:uppercase}
.cr-calm{font-family:var(--serif);font-style:italic;font-weight:500;font-size:1.15rem;line-height:1.45;color:var(--muted)}

.b-hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--line)}
.b-hd__in{display:flex;align-items:center;gap:1.25rem;min-height:4.4rem}
.b-brand{margin-right:auto;font-weight:700;font-size:1.2rem;line-height:1.15;text-decoration:none;max-width:52vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.b-nav{display:none;gap:1.5rem;font-size:.98rem}
.b-nav a{text-decoration:none;color:var(--muted)}
.b-nav a:hover{color:var(--ink);text-decoration:underline}
@media (min-width:1040px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:.9rem}
.b-hd__tel{display:none;align-items:center;gap:.5rem;min-height:2.8rem;padding:0 1rem;border-radius:8px;background:var(--primary);color:var(--on-primary);font-weight:700;text-decoration:none}
@media (min-width:640px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.8rem;padding:0 1rem;border-radius:8px;border:1.5px solid var(--ink);font-weight:600;text-decoration:none}
@media (max-width:639.98px){.b-hd__cta{background:var(--primary);color:var(--on-primary);border-color:var(--primary)}}

.cr-hero{position:relative;background:var(--hero);color:var(--on-hero);padding:clamp(2.75rem,6vw,5rem) 0 clamp(4rem,8vw,6rem)}
.cr-hero__grid{display:grid;gap:2.5rem;align-items:start}
@media (min-width:960px){.cr-hero--side .cr-hero__grid{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:4rem}}
@media (min-width:960px){.cr-hero--wide .cr-copy{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:4rem;align-items:end}.cr-hero--wide .cr-sub{margin-top:0}}
.cr-where{color:var(--hero-muted)}
.cr-where b{color:var(--on-hero);font-weight:500}
.cr-h1{margin-top:1rem;font-weight:700;font-size:clamp(2.3rem,5vw,3.8rem);line-height:1.05;letter-spacing:-.02em;max-width:18ch}
.cr-sub{margin-top:1.1rem;max-width:44ch;color:var(--hero-muted);font-size:1.15rem}
.cr-hero .cr-calm{color:var(--hero-muted);margin-top:1.5rem}
.cr-bigcall{display:flex;align-items:center;gap:1rem;width:min(100%,30rem);min-height:4.5rem;margin-top:2rem;padding:.75rem 1.5rem;border-radius:10px;background:var(--primary);color:var(--on-primary);text-decoration:none;box-shadow:0 0 0 4px color-mix(in oklab,var(--primary) 30%,transparent)}
.cr-bigcall .ico{width:1.8rem;height:1.8rem}
.cr-bigcall span{display:grid;line-height:1.15}
.cr-bigcall small{font-size:.92rem;font-weight:500;opacity:.9}
.cr-bigcall b{font-size:clamp(1.6rem,3.6vw,2.1rem);font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.cr-req-link{display:inline-flex;align-items:center;gap:.45rem;margin-top:1.1rem;color:var(--on-hero);font-weight:600;text-underline-offset:.3em}
.cr-hero .b-rating{display:flex;align-items:center;gap:.55rem;margin-top:1.5rem;color:var(--hero-muted);font-size:.98rem}
.cr-hero .b-rating__num{font-weight:700;color:var(--on-hero)}
.cr-hero .stars{width:5.5rem;height:1.1rem}
.cr-now{background:var(--card);color:var(--card-ink);border-radius:10px;border-top:4px solid var(--accent);padding:1.5rem 1.5rem 1.25rem}
.cr-now h2{display:flex;align-items:center;gap:.6rem;font-size:1.35rem;font-weight:700}
.cr-now h2 .ico{color:var(--accent)}
.cr-now ol{display:grid;gap:0;margin-top:1rem;counter-reset:n}
.cr-hero--wide .cr-now ol{grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));column-gap:2rem}
.cr-now li{display:grid;grid-template-columns:2rem minmax(0,1fr);gap:.75rem;padding:.85rem 0;border-top:1px solid var(--line);counter-increment:n}
.cr-now li::before{content:counter(n);display:grid;place-items:center;width:1.9rem;height:1.9rem;border-radius:50%;border:1.5px solid var(--accent);font-family:var(--mono);font-size:.85rem;font-weight:500}
.cr-now__note{margin-top:.75rem;font-size:.9rem;color:var(--muted)}
.cr-wave{position:absolute;left:0;right:0;bottom:1.25rem;width:100%;height:2.5rem}
.cr-wave path{fill:none;stroke:var(--accent);stroke-width:1.5;vector-effect:non-scaling-stroke;opacity:.7}
.cr-room{position:relative;margin-top:2.5rem;aspect-ratio:21/7;border-radius:10px;overflow:hidden}
.cr-room .b-photo{height:100%;--photo-bg:var(--hero)}
.cr-room img{filter:grayscale(.85) contrast(.95) brightness(1.02);opacity:.85}
@media (max-width:759.98px){.cr-room{aspect-ratio:16/9}}

.cr-strip{background:var(--surface);border-bottom:1px solid var(--line)}
.cr-strip__in{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 2.5rem;padding:1.4rem 0}
.cr-strip .b-rating{display:flex;align-items:center;gap:1rem}
.cr-strip .b-rating__num{font-size:2.6rem;font-weight:700;line-height:1}
.cr-strip .b-rating__side{display:grid;gap:.2rem}
.cr-strip .b-rating__count{font-weight:600}
.cr-strip p{color:var(--muted);max-width:48ch}

.cr-sec{padding:clamp(3.75rem,8vw,6rem) 0}
.cr-sec--alt{background:var(--surface);border-block:1px solid var(--line)}
.cr-cols{display:grid;gap:2rem}
@media (min-width:900px){.cr-cols{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem}.cr-cols>.cr-head{position:sticky;top:6.5rem;align-self:start}}
.cr-head{display:grid;gap:.9rem;margin-bottom:2rem;max-width:40rem}
.cr-cols .cr-head{margin-bottom:0}
.cr-h2{font-weight:700;font-size:clamp(1.9rem,3.6vw,2.7rem);line-height:1.1;letter-spacing:-.015em}
.cr-lede{color:var(--muted)}

.cr-time{position:relative;display:grid;gap:0}
.cr-time::before{content:"";position:absolute;left:.95rem;top:.5rem;bottom:.5rem;width:2px;background:var(--line)}
.cr-time li{position:relative;display:grid;grid-template-columns:2rem minmax(0,1fr);gap:1.25rem;padding:0 0 2.25rem}
.cr-time li:last-child{padding-bottom:0}
.cr-time__dot{position:relative;z-index:1;display:grid;place-items:center;width:2rem;height:2rem;border-radius:50%;background:var(--bg);border:2px solid var(--accent);color:var(--accent)}
.cr-time__dot::after{content:"";width:.6rem;height:.6rem;border-radius:50%;background:currentColor}
.cr-time .cr-mono{color:var(--muted)}
.cr-time h3{margin-top:.2rem;font-size:1.4rem;font-weight:700}
.cr-time p{margin-top:.3rem;color:var(--muted);max-width:52ch}
.cr-time__label{margin-top:1.5rem;padding:.75rem 1rem;border-radius:8px;background:var(--surface);border:1px solid var(--line);font-size:.95rem;color:var(--muted)}

.cr-svc{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:10px;overflow:hidden}
@media (min-width:700px){.cr-svc{grid-template-columns:1fr 1fr}}
.cr-svc li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.4rem 1rem;padding:1.5rem;background:var(--card);color:var(--card-ink)}
.cr-svc .hs-glyph{grid-row:span 2;width:1.8rem;height:1.8rem;color:var(--accent)}
.cr-svc h3{font-size:1.2rem;font-weight:700}
.cr-svc p{color:var(--muted);font-size:.98rem}
.cr-also{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1rem}
.cr-also li{padding:.45rem .85rem;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--card-ink)}
.cr-also__lbl{margin-top:1.5rem;color:var(--muted)}
.b-svc-confirm{margin-top:1.25rem;color:var(--muted);font-size:.95rem}
.svc-note{margin-top:.3rem;color:var(--muted);font-size:.92rem}

.cr-why .b-themes{display:grid;gap:.75rem}
.cr-why .b-themes li{display:grid;grid-template-columns:1.5rem minmax(0,1fr);gap:.75rem;font-size:1.2rem;font-weight:600}
.cr-why .b-themes li::before{content:"";width:.7rem;height:.7rem;margin-top:.55rem;border-radius:50%;background:var(--accent)}
.b-themes__note{margin-top:1rem;color:var(--muted);font-size:.92rem}

.cr-formcard{padding:clamp(1.25rem,3.5vw,2.25rem);border-radius:10px;background:var(--card);color:var(--card-ink);border:1px solid var(--line);border-top:4px solid var(--accent)}
.f-input{border-width:1.5px;border-radius:8px;background:var(--bg);min-height:3.25rem}
.f-input:focus{outline:3px solid var(--primary);outline-offset:1px}
.f-label,.f-field legend{font-weight:700;font-size:1rem}
.f-chip>span{border-width:1.5px;border-radius:8px;padding:.8rem 1.1rem;background:var(--bg)}
.f-chip input:checked+span{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.f-submit{border-radius:8px;min-height:3.6rem;font-size:1.08rem}
.f-urgent{border-radius:8px;font-size:1.05rem}
.f-status{border-width:1.5px;border-radius:8px}

.cr-area{display:grid;gap:2rem}
@media (min-width:900px){.cr-area{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4rem}}
.cr-area__place{margin-top:1rem;font-size:1.6rem;font-weight:700}
.cr-area__tbc{margin-top:.5rem;color:var(--muted)}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem minmax(0,1fr);gap:1rem;padding:.9rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:1px solid var(--line)}
.facts dt{font-family:var(--mono);font-size:.8rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);padding-top:.2rem}
.facts dd{margin:0;font-weight:600}
.b-visit__pending{display:grid;gap:.35rem;margin-top:1rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.45rem;margin-top:1.25rem;font-weight:600}

.faq details{border-top-width:1px}
.faq details:last-child{border-bottom-width:1px}
.faq summary{font-weight:700;font-size:1.1rem}
.faq summary .ico{transition:none}
.faq details p{color:var(--ink)}

.b-ft{background:var(--band);color:var(--on-band);padding:3rem 0}
.b-ft__name{font-weight:700;font-size:1.4rem}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.4rem 2rem;margin-top:.6rem;opacity:.9}
.b-ft__row a{font-weight:700}
.legal{margin-top:1.5rem;font-size:.88rem;opacity:.85}
.stock-credits{color:inherit;opacity:.85}
.callbar{border-radius:10px;font-size:1.05rem}
@media (max-width:479.98px){.b-brand{max-width:80vw}}
`;

function render(ctx) {
  const t = ctx.t;
  const wide = ctx.variants.hero === "wide";
  const verbPair = ctx.kind === "estimate" ? ["Request an estimate", "Pedir presupuesto"] : ["Send a request", "Enviar solicitud"];
  const verb = ctx.copyOr("ctaPrimary", verbPair);

  const header = siteHeader(ctx, {
    cta: ["Send a request", "Enviar solicitud"],
    nav: [
      { href: "#next", label: ["What happens next", "Qué sigue"] },
      ...(ctx.services.length ? [{ href: "#services", label: ["Services", "Servicios"] }] : []),
      { href: "#area", label: ["Area and hours", "Zona y horario"] },
    ],
  });

  const big = ctx.tel
    ? `<a class="cr-bigcall" href="${esc(ctx.tel)}">${icon("phone")}<span><small>${ctx.copyOr("ctaSecondary", ["Call now", "Llame ahora"])}</small><b>${esc(ctx.phone)}</b></span></a>`
    : `<a class="cr-bigcall" href="#${REQUEST_ID}">${icon("arrow")}<span><small>${t("Start here", "Empiece aquí")}</small><b>${verb}</b></span></a>`;

  const steps = whileYouWait(ctx);
  const now = `<aside class="cr-now"${ctx.i18n.aria("Right now", "Ahora mismo")}><h2>${icon("check")}${t("Right now", "Ahora mismo")}</h2><ol>${steps.map((s) => `<li><span>${t(s[0], s[1])}</span></li>`).join("")}</ol><p class="cr-now__note">${t("General safety guidance, not instructions from the business. If anyone is in danger, call 911.", "Guía general de seguridad, no instrucciones del negocio. Si alguien está en peligro, llame al 911.")}</p></aside>`;

  const copy = `<div class="cr-copy"><div><p class="cr-where cr-mono"><b>${ctx.name}</b> · ${esc(ctx.cityState || ctx.placeRaw)}</p><h1 class="cr-h1">${ctx.copyOr("headline", ctx.promise)}</h1></div><div><p class="cr-sub">${ctx.about || t("Take a breath. One call is enough to get the next step started.", "Respire. Una llamada basta para empezar el siguiente paso.")}</p>${big}${ctx.tel ? `<a class="cr-req-link" href="#${REQUEST_ID}">${t("Cannot talk right now?", "¿No puede hablar ahora?")} ${verb}${icon("arrow")}</a>` : ""}${ratingProof(ctx, "chip")}</div></div>`;

  const room = wide ? ctx.photos.next((p) => /living|room/.test(p.id)) : null;
  const roomHtml = room ? `<div class="cr-room">${ctx.photos.img(room, { sizes: "100vw", width: 1600 })}<span class="stock-tag">${t("Stock photo", "Foto de archivo")}</span></div>` : "";
  const hero = `<section class="cr-hero cr-hero--${wide ? "wide" : "side"}" id="top"><div class="wrap"><div class="cr-hero__grid">${copy}${now}</div>${roomHtml}</div>${WAVE}</section>`;

  const strip = `<section class="cr-strip" aria-label="Google rating"><div class="wrap cr-strip__in">${ratingProof(ctx, "strip")}<p>${t(`From Google reviews left by customers in and around ${ctx.cityRaw || "town"}.`, `De reseñas de Google de clientes de ${ctx.cityRaw || "la zona"} y alrededores.`)}</p></div></section>`;

  const stages = STAGES[ctx.categoryKey] || STAGES.restoration;
  const next = `<section class="cr-sec" id="next"><div class="wrap cr-cols"><div class="cr-head"><h2 class="cr-h2">${t("What usually happens next", "Qué suele pasar después")}</h2><p class="cr-calm">${t("Knowing the order of things makes the day easier.", "Saber el orden de las cosas hace el día más fácil.")}</p></div><div><ol class="cr-time">${stages.map((s, i) => `<li><span class="cr-time__dot" aria-hidden="true"></span><div><span class="cr-mono">${t(`Stage ${i + 1} of ${stages.length}`, `Etapa ${i + 1} de ${stages.length}`)}</span><h3>${t(s[0][0], s[0][1])}</h3><p>${t(s[1][0], s[1][1])}</p></div></li>`).join("")}</ol><p class="cr-time__label">${t("The typical process for this kind of job. Details to confirm with the owner.", "El proceso típico para este tipo de trabajo. Detalles por confirmar con el dueño.")}</p></div></div></section>`;

  const four = ctx.services.slice(0, 4);
  const rest = ctx.services.slice(4);
  const services = ctx.services.length
    ? `<section class="cr-sec cr-sec--alt" id="services"><div class="wrap"><div class="cr-head"><h2 class="cr-h2">${t("What they handle", "Qué atienden")}</h2><p class="cr-calm">${t("If you are not sure which one it is, that is fine. Describe it.", "Si no sabe cuál es, está bien. Descríbalo.")}</p></div><ul class="cr-svc">${four.map((s) => { const b = hsBlurb(s); return `<li>${hsGlyph(s, { stroke: 1.6 })}<h3>${esc(s)}</h3><p>${t(b[0], b[1])}</p></li>`; }).join("")}</ul>${rest.length ? `<p class="cr-also__lbl cr-mono">${t("Also", "También")}</p><ul class="cr-also">${rest.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}${servicesConfirm(ctx)}</div></section>`
    : "";

  const themes = themesBlock(ctx);
  const why = themes ? `<section class="cr-sec cr-why"><div class="wrap cr-cols"><div class="cr-head"><h2 class="cr-h2">${t("Why customers call", "Por qué llaman los clientes")}</h2><p class="cr-calm">${t("In their words, summarized.", "En sus palabras, resumido.")}</p></div><div>${themes}</div></div></section>`
    : "";

  const form = formHeading(ctx);
  const request = `<section class="cr-sec ${themes ? "cr-sec--alt" : ""}" id="${REQUEST_ID}"><div class="wrap cr-cols"><div class="cr-head"><h2 class="cr-h2">${form.title}</h2><p class="cr-lede">${form.intro}</p><p class="cr-calm">${t("If it is happening right now, calling is the quickest way.", "Si está pasando ahora, llamar es lo más rápido.")}</p>${callButton(ctx, { cls: "cr-req-link", label: ["Call", "Llamar"] })}</div><div class="cr-formcard">${ctx.form}</div></div></section>`;

  const area = `<section class="cr-sec ${themes ? "" : "cr-sec--alt"}" id="area"><div class="wrap cr-area"><div><h2 class="cr-h2">${t("Service area and hours", "Zona y horario")}</h2><p class="cr-area__place">${esc(ctx.placeRaw)}</p><p class="cr-area__tbc">${t("The towns they cover and when they answer are to confirm with the owner.", "Las zonas que cubren y cuándo contestan están por confirmar con el dueño.")}</p></div>${visitDetails(ctx)}</div></section>`;

  const faq = `<section class="cr-sec" id="faq"><div class="wrap cr-cols"><div class="cr-head"><h2 class="cr-h2">${t("Questions people ask", "Preguntas frecuentes")}</h2><p class="cr-calm">${t("There are no silly questions on a bad day.", "En un mal día no hay preguntas tontas.")}</p></div>${faqBlock(ctx)}</div></section>`;

  return {
    css: CSS,
    body: `${header}<main>${hero}${strip}${next}${services}${why}${request}${area}${faq}</main>${siteFooter(ctx)}`,
  };
}

export const direction = {
  key: "hs-calm-response",
  label: "Calm response",
  status: "implemented",
  suits: ["restoration", "plumbing", "septic", "electrical"],
  keywords: ["emergency", "24/7", "storm", "damage", "emergency-first", "urgent"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;600;700&family=Atkinson+Hyperlegible+Mono:wght@500&family=Source+Serif+4:ital,wght@1,500&display=swap",
  palettes: PALETTES,
  variants: { hero: ["side", "wide"], services: ["block"], proof: ["strip"] },
  imagery: { photos: true, people: ["none"], heroPeople: ["none"], heroPrefer: /living/ },
  callbar: "call",
  render,
};
