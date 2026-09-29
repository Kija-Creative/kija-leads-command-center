// Contractor: "elevation". Wide set Archivo over a working serif, a drenched
// hero with an elevation drawing that highlights the trade, a scope of work
// sheet and a drawing title block for a footer. Roofing, concrete, fencing, pools.

import { esc, icon, starsSvg } from "../shared.js";
import { directionsLink, factsList, faqList, footerLegal, reviewsText, servicesNote, themesNote } from "../parts.js";

const PALETTES = [
  {
    key: "blueprint",
    name: "Blueprint and highlighter",
    vars: { bg: "oklch(1 0 0)", surface: "oklch(0.965 0.01 255)", ink: "oklch(0.22 0.04 255)", muted: "oklch(0.45 0.03 255)", line: "oklch(0.87 0.015 255)", primary: "oklch(0.45 0.13 255)", "on-primary": "oklch(0.99 0 0)", accent: "oklch(0.86 0.15 90)", band: "oklch(0.34 0.1 255)", "on-band": "oklch(0.985 0.005 255)", "band-muted": "oklch(0.87 0.04 255)", "band-line": "oklch(0.62 0.08 255)", "band-btn": "oklch(0.86 0.15 90)", "on-band-btn": "oklch(0.22 0.04 255)", star: "oklch(0.86 0.15 90)" },
  },
  {
    key: "clay",
    name: "Fired clay and charcoal",
    vars: { bg: "oklch(0.975 0 0)", surface: "oklch(0.94 0.008 40)", ink: "oklch(0.23 0.02 40)", muted: "oklch(0.44 0.02 40)", line: "oklch(0.86 0.012 40)", primary: "oklch(0.5 0.13 38)", "on-primary": "oklch(0.99 0 0)", accent: "oklch(0.5 0.13 38)", band: "oklch(0.5 0.13 38)", "on-band": "oklch(0.99 0.003 40)", "band-muted": "oklch(0.94 0.03 40)", "band-line": "oklch(0.72 0.09 40)", "band-btn": "oklch(0.2 0.02 40)", "on-band-btn": "oklch(0.99 0 0)", star: "oklch(0.99 0.003 40)" },
  },
  {
    key: "slate",
    name: "Slate and survey lime",
    vars: { bg: "oklch(0.22 0.01 250)", surface: "oklch(0.26 0.012 250)", ink: "oklch(0.96 0.005 250)", muted: "oklch(0.8 0.01 250)", line: "oklch(0.37 0.012 250)", primary: "oklch(0.9 0.19 125)", "on-primary": "oklch(0.22 0.03 125)", accent: "oklch(0.9 0.19 125)", band: "oklch(0.27 0.012 250)", "on-band": "oklch(0.96 0.005 250)", "band-muted": "oklch(0.8 0.01 250)", "band-line": "oklch(0.46 0.012 250)", "band-btn": "oklch(0.9 0.19 125)", "on-band-btn": "oklch(0.22 0.03 125)", star: "oklch(0.9 0.19 125)" },
  },
];

const PROMISE = {
  roofing: ["Before the next storm, get eyes on your roof.", "Antes de la próxima tormenta, revise su techo."],
  concrete: ["Concrete work starts with a clear estimate.", "El trabajo de concreto empieza con un presupuesto claro."],
  fencing: ["A good fence starts with a clear estimate.", "Una buena cerca empieza con un presupuesto claro."],
  pools: ["The backyard you want starts with a conversation.", "El patio que quiere empieza con una plática."],
  landscaping: ["A yard you love starts with a walk around it.", "Un jardín que le encante empieza con un recorrido."],
  painting: ["A fresh coat starts with a clear estimate.", "Una mano de pintura nueva empieza con un presupuesto claro."],
  "foundation-repair": ["Cracks and sticking doors are worth a look. Start here.", "Grietas y puertas que se atoran merecen una revisión. Empiece aquí."],
  remodeling: ["The room you keep picturing starts with a plan.", "El cuarto que se imagina empieza con un plan."],
  "tree-service": ["Worried about a big tree? Start with an estimate.", "¿Le preocupa un árbol grande? Empiece con un presupuesto."],
};
const PROMISE_DEFAULT = ["Big projects start with a clear estimate.", "Los proyectos grandes empiezan con un presupuesto claro."];

const STEPS = [
  { title: ["Request an estimate", "Pida un presupuesto"], body: ["Share the project, a rough size and your timing.", "Comparta el proyecto, un tamaño aproximado y sus tiempos."] },
  { title: ["Talk it through", "Platíquelo"], body: ["Go over options, and ask about a visit to measure.", "Revisen opciones y pregunte por una visita para medir."] },
  { title: ["Plan and price", "Plan y precio"], body: ["A scope and a price you can compare.", "Un alcance y un precio que puede comparar."] },
  { title: ["Build", "Obra"], body: ["The work gets scheduled and done.", "El trabajo se agenda y se hace."] },
];

const FAQ_BASE = [
  { q: ["How does an estimate work?", "¿Cómo funciona un presupuesto?"], a: ["Share the project and a rough size. The usual next step is a visit to measure and talk through options.", "Comparta el proyecto y un tamaño aproximado. Lo normal después es una visita para medir y platicar opciones."] },
  { q: ["What should I have ready?", "¿Qué debo tener a la mano?"], a: ["Photos of the area, rough measurements if you have them, and your timeline.", "Fotos del área, medidas aproximadas si las tiene y sus tiempos."] },
  { q: ["How soon can work start?", "¿Qué tan pronto pueden empezar?"], a: ["It depends on the project and the season. Ask when you request an estimate.", "Depende del proyecto y la temporada. Pregunte cuando pida su presupuesto."] },
];
const FAQ_ROOF = { q: ["Should a roof get a look after a storm?", "¿Conviene revisar el techo después de una tormenta?"], a: ["If you see missing shingles, leaks or dents, it is worth a look. Take photos from the ground and call.", "Si ve tejas faltantes, goteras o golpes, vale la pena revisarlo. Tome fotos desde el suelo y llame."] };

// The trade gets drawn in the accent color on top of the same elevation.
function tradeLayer(key) {
  switch (key) {
    case "roofing":
      return `<path class="e-hot e-draw" pathLength="1" d="M262 156 L540 38 L818 156"/><path class="e-hot" d="M330 126 L352 117 M400 97 L422 88 M470 67 L492 58 M610 67 L632 76 M680 97 L702 106 M750 126 L772 135" stroke-width="3"/>`;
    case "fencing":
      return `<path class="e-hot e-draw" pathLength="1" d="M40 250 H1160 M40 270 H1160"/>${Array.from({ length: 23 }, (_, i) => `<path class="e-hot" d="M${60 + i * 48} 236 V290"/>`).join("")}`;
    case "pools":
      return `<path class="e-hot e-draw" pathLength="1" d="M860 290 V320 Q860 334 874 334 H1110 Q1124 334 1124 320 V290"/><path class="e-hot" d="M880 304 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0" stroke-width="2"/>`;
    case "concrete":
      return `<path class="e-hot e-draw" pathLength="1" d="M800 280 H1160 V298 H800 Z"/>${Array.from({ length: 12 }, (_, i) => `<path class="e-hot" d="M${812 + i * 30} 298 L${830 + i * 30} 280" stroke-width="1.5"/>`).join("")}`;
    case "landscaping":
    case "tree-service":
      return `<path class="e-hot" d="M1030 290 V200"/><circle class="e-hot e-draw" pathLength="1" cx="1030" cy="150" r="62"/><circle class="e-hot" cx="140" cy="230" r="40"/><path class="e-hot" d="M140 290 V270"/>`;
    case "painting":
      return `${Array.from({ length: 14 }, (_, i) => `<path class="e-hot" d="M${300 + i * 34} 290 L${340 + i * 34} 160" stroke-width="1.5"/>`).join("")}`;
    case "foundation-repair":
      return `<path class="e-hot e-draw" pathLength="1" d="M290 290 V318 H790 V290"/><path class="e-hot" d="M520 296 l12 8 -8 7 12 9" stroke-width="2.4"/>`;
    default:
      return `<path class="e-hot e-draw" pathLength="1" d="M300 160 H780 V290 H300 Z"/>`;
  }
}

function elevationSvg(key) {
  return `<svg class="elev" viewBox="0 0 1200 340" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false"><g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path class="e-line e-draw" pathLength="1" d="M262 156 L540 38 L818 156"/>
<path class="e-line e-draw" pathLength="1" d="M300 140 V290 H780 V140"/>
<path class="e-line" d="M780 190 L1000 190 L1000 290"/><path class="e-line" d="M760 176 L1020 176"/>
<path class="e-line" d="M820 290 V214 H980 V290 M820 238 H980 M820 262 H980"/>
<path class="e-line" d="M500 290 V206 H580 V290"/>
<rect class="e-line" x="350" y="190" width="90" height="62"/><rect class="e-line" x="640" y="190" width="90" height="62"/>
<path class="e-line" d="M395 190 V252 M685 190 V252"/>
<path class="e-dim" d="M262 18 H818 M262 10 V26 M818 10 V26 M1180 38 V290 M1172 38 H1188 M1172 290 H1188"/>
${tradeLayer(key)}
<path class="e-ground" d="M0 290 H1200"/>
</g></svg>`;
}

const CSS = `
:root{--display:"Archivo",system-ui,sans-serif;--body:"Source Serif 4",Georgia,serif;--radius:2px;--btn-radius:2px;--chip-radius:2px;--max:1240px;--ease:cubic-bezier(.19,1,.22,1)}
body{font-size:1.1rem;line-height:1.6}
.wide{font-family:var(--display);font-stretch:125%;font-variation-settings:"wdth" 125}
.hd{position:sticky;top:0;z-index:10;background:var(--band);color:var(--on-band);border-bottom:1px solid var(--band-line);--lang-fg:var(--on-band);--lang-on:var(--band)}
.hd-in{display:flex;align-items:center;gap:1.5rem;min-height:4.25rem}
.brand{font-weight:800;font-size:.95rem;text-transform:uppercase;letter-spacing:.04em;text-decoration:none;margin-right:auto;line-height:1.15;max-width:55vw}
.nav{display:none;gap:1.75rem;font-family:var(--display);font-weight:600;font-size:.9rem}
.nav a{text-decoration:none}
.nav a:hover{text-decoration:underline;text-underline-offset:.3em}
@media (min-width:960px){.nav{display:flex}}
.hd-call{display:none;align-items:center;gap:.5rem;padding:.6rem 1rem;border:1.5px solid currentColor;font-family:var(--display);font-weight:700;text-decoration:none;font-size:.95rem}
.hd-call:hover{background:var(--on-band);color:var(--band)}
@media (min-width:640px){.hd-call{display:inline-flex}}

.hero{background:var(--band);color:var(--on-band);padding-top:clamp(2.5rem,6vw,5rem);overflow:hidden;--line:var(--band-line);--muted:var(--band-muted)}
.hero-cat{font-family:var(--display);font-weight:600;font-size:.95rem;color:var(--band-muted);display:flex;gap:.75rem;flex-wrap:wrap}
.name{margin-top:1.25rem;font-weight:800;text-transform:uppercase;line-height:.95;letter-spacing:-.01em;font-size:var(--nsize);overflow-wrap:break-word;animation:kj-rise .9s var(--ease) both}
.name--xl{--nsize:clamp(2.8rem,9vw,6rem)}
.name--l{--nsize:clamp(2.4rem,6.8vw,4.8rem)}
.name--m{--nsize:clamp(2rem,5.4vw,3.9rem)}
.name--s{--nsize:clamp(1.8rem,4.4vw,3.2rem)}
.hero-mid{display:grid;gap:2rem;margin-top:clamp(1.75rem,4vw,3rem);align-items:end}
@media (min-width:900px){.hero-mid{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)}}
.promise{font-style:italic;font-size:clamp(1.5rem,3vw,2.3rem);line-height:1.2;max-width:26ch;animation:kj-rise .9s .12s var(--ease) both}
.sub{margin-top:1rem;color:var(--band-muted);max-width:50ch}
.about{margin-top:1rem;max-width:58ch}
.ctas{display:flex;flex-wrap:wrap;gap:.75rem;animation:kj-rise .9s .22s var(--ease) both}
@media (min-width:900px){.ctas{justify-content:flex-end}}
.btn{display:inline-flex;align-items:center;gap:.6rem;padding:1rem 1.4rem;font-family:var(--display);font-weight:700;text-decoration:none;border:1.5px solid transparent;transition:transform .35s var(--ease),background-color .2s,color .2s}
.btn:hover{transform:translateY(-2px)}
.btn-solid{background:var(--band-btn);color:var(--on-band-btn)}
.btn-line{border-color:currentColor}
.btn-line:hover{background:var(--on-band);color:var(--band)}
.hero-foot{position:relative;margin-top:clamp(2rem,5vw,3rem)}
.elev{width:100%;height:auto;display:block}
.e-line{stroke:var(--on-band);stroke-width:2;opacity:.85}
.e-draw{stroke-dasharray:1;animation:kj-draw 2.4s .35s var(--ease) both;--len:1}
.e-hot{stroke:var(--star);stroke-width:3.2}
.e-dim{stroke:var(--band-muted);stroke-width:1.2;opacity:.8}
.e-ground{stroke:var(--on-band);stroke-width:2.4}
.callout{display:grid;gap:.4rem;padding:1.25rem 0 2rem;border-top:1.5px solid var(--band-line)}
@media (min-width:900px){.callout{position:absolute;left:0;top:4%;width:17rem;border-top:0;padding:0}.callout::after{content:"";position:absolute;left:100%;top:1.15rem;width:clamp(2rem,8vw,7rem);height:1.5px;background:var(--band-muted)}}
.callout-num{font-family:var(--display);font-stretch:125%;font-variation-settings:"wdth" 125;font-weight:800;font-size:clamp(2.8rem,5vw,3.8rem);line-height:.9}
.callout b{font-family:var(--display);font-weight:600}
.callout .stars{margin-top:.2rem}

.sec{padding:clamp(4rem,9vw,7.5rem) 0}
.h2{font-family:var(--display);font-stretch:125%;font-variation-settings:"wdth" 125;font-weight:800;text-transform:uppercase;font-size:clamp(1.9rem,4.4vw,3.2rem);line-height:1;letter-spacing:-.01em}
.lede{margin-top:1rem;color:var(--muted);max-width:50ch}
.scope{margin-top:2.75rem;border:1.5px solid var(--ink)}
.scope li{display:grid;grid-template-columns:4.5rem 1fr auto;align-items:center;border-bottom:1px solid var(--line)}
.scope li:last-child{border-bottom:0}
.scope .code{align-self:stretch;display:grid;place-items:center;border-right:1px solid var(--line);font-family:var(--display);font-weight:700;font-size:.85rem;color:var(--muted)}
.scope .nm{padding:1.15rem 1.25rem;font-family:var(--display);font-weight:650;font-size:clamp(1.05rem,2vw,1.3rem)}
.scope a{display:inline-flex;align-items:center;gap:.4rem;padding:0 1.25rem;font-family:var(--display);font-weight:600;font-size:.88rem;color:var(--primary);white-space:nowrap}
@media (max-width:600px){.scope li{grid-template-columns:3rem 1fr}.scope a{grid-column:2;padding:0 1.25rem 1rem}}
.svc-note{margin-top:1rem;color:var(--muted);font-size:.95rem}

.themes{background:var(--surface)}
.themes-list{margin-top:2.5rem;display:grid;gap:.25rem}
.themes-list li{display:flex;gap:1rem;align-items:baseline;font-style:italic;font-size:clamp(1.6rem,3.6vw,2.6rem);line-height:1.2;padding:.6rem 0}
.themes-list .ico{flex:none;color:var(--primary);width:1.5rem;height:1.5rem}
.themes-note{margin-top:1.75rem;color:var(--muted);font-size:.95rem}

.steps{display:grid;gap:2rem;margin-top:3rem}
@media (min-width:860px){.steps{grid-template-columns:repeat(4,1fr);gap:0;border-top:1.5px solid var(--ink);background:linear-gradient(var(--ink),var(--ink)) 0 0/1.5px 14px no-repeat}}
.steps li{position:relative;padding-right:1.5rem}
@media (min-width:860px){.steps li{padding-top:1.75rem}.steps li::after{content:"";position:absolute;right:0;top:-1.5px;width:1.5px;height:14px;background:var(--ink)}}
.step-n{display:block;font-family:var(--display);font-stretch:125%;font-variation-settings:"wdth" 125;font-weight:800;font-size:2.6rem;line-height:1;color:var(--primary);margin-bottom:.75rem}
.steps h3{font-family:var(--display);font-weight:700;font-size:1.2rem;margin-bottom:.35rem}
.steps p{color:var(--muted);max-width:28ch}

.req{background:var(--band);color:var(--on-band);--ink:var(--on-band);--muted:var(--band-muted);--line:var(--band-line);--primary:var(--band-btn);--on-primary:var(--on-band-btn);--bg:var(--band)}
.req-grid{display:grid;gap:2.5rem}
@media (min-width:980px){.req-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem}.req-side{position:sticky;top:6.5rem;align-self:start}}
.req-side p{margin-top:1rem;color:var(--band-muted);max-width:40ch}
.req-call{display:inline-flex;align-items:center;gap:.6rem;margin-top:1.5rem;font-family:var(--display);font-weight:800;font-size:1.5rem;text-decoration:none}
.req .f-label,.req legend{font-family:var(--display);font-weight:650}

.area-grid{display:grid;gap:2rem}
@media (min-width:900px){.area-grid{grid-template-columns:1fr 1fr;gap:4rem}}
.area-big{margin-top:1.25rem;font-style:italic;font-size:clamp(1.5rem,3vw,2.2rem);line-height:1.2}
.area-note{margin-top:1rem;color:var(--muted)}
.facts{margin:0;border:1.5px solid var(--ink)}
.facts div{display:grid;grid-template-columns:8rem 1fr;border-bottom:1px solid var(--line)}
.facts div:last-child{border-bottom:0}
.facts dt{padding:1rem;border-right:1px solid var(--line);font-family:var(--display);font-weight:600;font-size:.88rem;color:var(--muted)}
.facts dd{margin:0;padding:1rem;font-family:var(--display);font-weight:600}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-family:var(--display);font-weight:700}

.faq-grid{display:grid;gap:2rem}
@media (min-width:900px){.faq-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem}}
.faq summary{font-family:var(--display);font-weight:650}

.ft{padding:3rem 0}
.tblock{display:grid;border:1.5px solid var(--ink);font-family:var(--display)}
@media (min-width:760px){.tblock{grid-template-columns:2fr 1fr 1fr}}
.tblock>div{padding:1rem 1.25rem;border-bottom:1px solid var(--line)}
@media (min-width:760px){.tblock>div{border-bottom:0;border-right:1px solid var(--line)}.tblock>div:last-child{border-right:0}.tblock .tb-name{grid-row:span 2;border-right:1px solid var(--line)}.tblock .tb-2{border-top:1px solid var(--line)}}
.tblock small{display:block;font-size:.75rem;font-weight:600;color:var(--muted);margin-bottom:.3rem}
.tb-name strong{display:block;font-stretch:125%;font-variation-settings:"wdth" 125;font-weight:800;text-transform:uppercase;font-size:clamp(1.3rem,3vw,2rem);line-height:1.05}
.tblock a{font-weight:700}
.ft .legal{margin-top:1.25rem;color:var(--muted);font-size:.85rem}
`;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function render(ctx) {
  const t = ctx.t;
  const promise = ctx.copyOr("headline", PROMISE[ctx.categoryKey] || PROMISE_DEFAULT);
  const sub = ctx.copyOr("subhead", [
    `Rated ${ctx.ratingText} stars across ${ctx.reviewsText} Google reviews. Tell us about the project and get a clear next step.`,
    `Calificación de ${ctx.ratingText} estrellas en ${ctx.reviewsText} reseñas de Google. Cuéntenos del proyecto y reciba un siguiente paso claro.`,
  ]);
  const ctaPrimary = ctx.copyOr("ctaPrimary", ctx.formCopy.cta);
  const ctaSecondary = ctx.copyOr("ctaSecondary", ["Call", "Llamar"]);
  const faq = ctx.categoryKey === "roofing" ? [FAQ_ROOF, ...FAQ_BASE] : FAQ_BASE;
  const d = ctx.now;
  const dateEn = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  const dateEs = `${d.getUTCDate()} de ${MONTHS_ES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;

  const header = `<header class="hd"><div class="wrap hd-in"><a class="brand wide" href="#top">${ctx.name}</a><nav class="nav"${ctx.i18n.aria("Sections", "Secciones")}>${ctx.services.length ? `<a href="#services">${t("Scope", "Alcance")}</a>` : ""}<a href="#process">${t("Process", "Proceso")}</a><a href="#request">${t("Estimate", "Presupuesto")}</a></nav>${ctx.langToggle}${ctx.tel ? `<a class="hd-call" href="${esc(ctx.tel)}">${icon("phone")}${esc(ctx.phone)}</a>` : ""}</div></header>`;

  const hero = `<section class="hero" id="top"><div class="wrap">
<p class="hero-cat"><span>${ctx.categoryT}</span><span aria-hidden="true">/</span><span>${esc(ctx.placeRaw)}</span></p>
<h1 class="name wide name--${ctx.nameScale}">${ctx.name}</h1>
<div class="hero-mid"><div><p class="promise">${promise}</p><p class="sub">${sub}</p>${ctx.about ? `<p class="about">${ctx.about}</p>` : ""}</div>
<div class="ctas"><a class="btn btn-solid" href="#request">${ctaPrimary}${icon("arrow")}</a>${ctx.tel ? `<a class="btn btn-line" href="${esc(ctx.tel)}">${icon("phone")}${ctaSecondary} ${esc(ctx.phone)}</a>` : ""}</div></div>
<div class="hero-foot"><div class="callout" data-rating="${esc(ctx.rating)}" data-reviews="${esc(ctx.reviews)}"><span class="callout-num" data-rating-num>${esc(ctx.ratingText)}</span>${starsSvg(ctx.rating, "callout")}<b>${reviewsText(ctx)}</b></div>${elevationSvg(ctx.categoryKey)}</div>
</div></section>`;

  const services = ctx.services.length
    ? `<section class="sec" id="services"><div class="wrap"><h2 class="h2">${t("Scope of work", "Alcance del trabajo")}</h2><p class="lede">${t("Pick the closest match when you request an estimate, or describe something else.", "Elija la opción más cercana al pedir su presupuesto o describa otra cosa.")}</p>
<ol class="scope">${ctx.services.map((s, i) => `<li class="rv"><span class="code" aria-hidden="true">${String.fromCharCode(65 + Math.floor(i / 9))}${(i % 9) + 1}</span><span class="nm">${esc(s)}</span><a href="#request">${t("Estimate", "Presupuesto")}${icon("arrow")}</a></li>`).join("")}</ol>${servicesNote(ctx)}</div></section>`
    : "";

  const themes = ctx.themes.length
    ? `<section class="sec themes"><div class="wrap"><h2 class="h2">${t("What clients point out", "Lo que destacan los clientes")}</h2><ul class="themes-list">${ctx.themes.map((th) => `<li class="rv">${icon("check")}<span>${esc(th)}</span></li>`).join("")}</ul>${themesNote(ctx)}</div></section>`
    : "";

  const steps = `<section class="sec" id="process"><div class="wrap"><h2 class="h2">${t("How a project runs", "Cómo avanza un proyecto")}</h2><ol class="steps">${STEPS.map((s, i) => `<li class="rv"><span class="step-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  const request = `<section class="sec req" id="request"><div class="wrap req-grid"><div class="req-side"><h2 class="h2">${t(ctx.formCopy.title[0], ctx.formCopy.title[1])}</h2><p>${t(ctx.formCopy.intro[0], ctx.formCopy.intro[1])}</p>${ctx.tel ? `<a class="req-call" href="${esc(ctx.tel)}">${icon("phone")}${esc(ctx.phone)}</a>` : ""}</div><div>${ctx.form}</div></div></section>`;

  const area = `<section class="sec" id="visit"><div class="wrap area-grid"><div><h2 class="h2">${t("Service area", "Zona de servicio")}</h2><p class="area-big">${t(`Based in ${ctx.placeRaw}.`, `Con base en ${ctx.placeRaw}.`)}</p><p class="area-note">${t("Ask when you call whether your address is in range.", "Pregunte al llamar si su dirección está dentro de la zona.")}</p>${directionsLink(ctx)}</div>${factsList(ctx)}</div></section>`;

  const faqSec = `<section class="sec" id="faq"><div class="wrap faq-grid"><h2 class="h2">${t("Questions", "Preguntas")}</h2>${faqList(ctx, faq)}</div></section>`;

  const footer = `<footer class="ft"><div class="wrap"><div class="tblock"><div class="tb-name"><small>${t("Project", "Proyecto")}</small><strong>${ctx.name}</strong></div><div><small>${t("Location", "Ubicación")}</small>${esc(ctx.placeRaw)}</div><div><small>${t("Phone", "Teléfono")}</small>${ctx.tel ? `<a href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}</div><div class="tb-2"><small>${t("Drawn by", "Dibujado por")}</small>Kija Creative</div><div class="tb-2"><small>${t("Date", "Fecha")}</small>${t(dateEn, dateEs)}</div></div>${footerLegal(ctx)}</div></footer>`;

  return { css: CSS, body: `${header}<main>${hero}${services}${themes}${steps}${request}${area}${faqSec}</main>${footer}` };
}

export const template = {
  key: "contractor",
  label: "Elevation",
  fontsHref: "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&display=swap",
  palettes: PALETTES,
  render,
};
