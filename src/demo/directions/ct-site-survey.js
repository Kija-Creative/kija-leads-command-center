// Site survey (research/design-home-contractor.md, contractors 2). Precise,
// honest, engineered: a job sheet and a technical drawing. Grid paper behind
// everything, a line drawing per trade in the hero (slab section, fence
// elevation, footing and pier, floor plan fragment) with dimension lines and
// generic callouts, the rating set as a spec line, services as a spec table,
// a five column process, the request styled as a job sheet and a drawing
// title block in the footer. Square corners throughout.

import {
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

const PALETTES = [
  { key: "survey-white", name: "Survey white and safety orange", vars: { bg: "#fafaf7", surface: "#ffffff", ink: "#15171a", muted: "#5c6066", line: "#d9d8d0", primary: "#ff5a1f", "on-primary": "#15171a", accent: "#1b4dff", grid: "#ecebe4", "grid-major": "#dedcd2", mark: "#c2410c", band: "#15171a", "on-band": "#fafaf7", "band-muted": "#a9adb3" } },
  { key: "survey-concrete", name: "Concrete and lime", vars: { bg: "#e9e9e6", surface: "#f5f5f3", ink: "#1a1c1e", muted: "#55585c", line: "#c9c9c3", primary: "#c6f432", "on-primary": "#1a1c1e", accent: "#3a3d42", grid: "#dcdcd8", "grid-major": "#cfcfca", mark: "#1a1c1e", band: "#1a1c1e", "on-band": "#c6f432", "band-muted": "#b5b8ad" } },
  { key: "survey-cyanotype", name: "Cyanotype", vars: { bg: "#0f2f57", surface: "#143866", ink: "#e8f0fb", muted: "#a9c0de", line: "#2a5689", primary: "#ffd84d", "on-primary": "#0f2f57", accent: "#8fc1ff", grid: "#15375f", "grid-major": "#1d4577", mark: "#ffd84d", band: "#ffd84d", "on-band": "#0f2f57", "band-muted": "#3b4f6d" } },
];

// Drawings are 560 by 440. Callouts: [x, y, targetX, targetY, label].
// Dimension lines: [x1, y1, x2, y2, label]. No numbers: sizes are the owner's.
const DRAWINGS = {
  concrete: {
    title: ["Typical slab section", "Corte típico de losa"],
    art: `<path class="ss-hatch" d="M40 300h480v90H40z"/><path d="M40 300h480M40 390h480"/><path class="ss-fill" d="M40 220h480v50H40z"/><path d="M40 220h480v50H40zM40 270h480"/><path class="ss-thin" d="M40 280h480M40 290h480"/>${Array.from({ length: 12 }, (_, i) => `<circle class="ss-dot" cx="${70 + i * 38}" cy="248" r="4"/>`).join("")}<path class="ss-thin" d="M40 206l30-14M520 206l-30-14"/>`,
    callouts: [[120, 120, 150, 222, ["Finished surface", "Superficie terminada"]], [330, 120, 298, 248, ["Reinforcement", "Refuerzo"]], [380, 176, 420, 276, ["Vapor barrier", "Barrera de vapor"]], [60, 420, 110, 330, ["Compacted base", "Base compactada"]]],
    dims: [[536, 220, 536, 270, ["Thickness per plan", "Espesor según plan"]]],
  },
  fencing: {
    title: ["Fence elevation, one bay", "Alzado de cerca, un tramo"],
    art: `<path d="M20 330h520"/><path class="ss-hatch" d="M20 330h520v70H20z"/><path class="ss-fill" d="M70 110h26v290H70zM454 110h26v290h-26z"/><path d="M70 110h26v290H70zM454 110h26v290h-26z"/><path d="M96 150h358v14H96zM96 270h358v14H96z"/>${Array.from({ length: 12 }, (_, i) => `<path class="ss-thin" d="M${104 + i * 29} 128v196l0 0h22V128l-11-10z"/>`).join("")}<path class="ss-dash" d="M58 330v70h50v-70M442 330v70h50v-70"/>`,
    callouts: [[150, 60, 110, 118, ["Post", "Poste"]], [260, 60, 290, 150, ["Rail", "Riel"]], [380, 60, 360, 190, ["Picket", "Tabla"]], [220, 425, 84, 380, ["Footing below grade", "Base bajo el nivel"]]],
    dims: [[40, 110, 40, 330, ["Height", "Altura"]], [83, 96, 467, 96, ["Post spacing", "Separación"]]],
  },
  "foundation-repair": {
    title: ["Footing and pier, in section", "Zapata y pila, en corte"],
    art: `<path d="M20 170h520"/><path class="ss-fill" d="M80 120h400v50H80z"/><path d="M80 120h400v50H80z"/><path class="ss-fill" d="M130 170h60v40h-60zM370 170h60v40h-60z"/><path d="M130 170h60v40h-60zM370 170h60v40h-60z"/><path class="ss-hatch" d="M20 170h520v250H20z"/><path d="M150 210v170M170 210v170M390 210v170M410 210v170"/><path d="M140 380h40M380 380h40"/><path class="ss-dash" d="M20 360h520"/><path class="ss-thin" d="M250 110l20-30 10 40 16-50"/>`,
    callouts: [[250, 60, 290, 120, ["Slab or grade beam", "Losa o viga de liga"]], [30, 60, 160, 190, ["Footing", "Zapata"]], [440, 260, 400, 300, ["Pier", "Pila"]], [240, 415, 300, 360, ["Stable soil", "Suelo firme"]]],
    dims: [[510, 170, 510, 380, ["Depth per engineer", "Profundidad según ingeniero"]]],
  },
  remodeling: {
    title: ["Floor plan fragment", "Fragmento de planta"],
    art: `<path class="ss-wall" d="M60 80h440v290H60z"/><path class="ss-gap" d="M200 370h80M500 160v90"/><path class="ss-thin" d="M200 370a80 80 0 0 1 80-80"/><path class="ss-thin" d="M280 370v-80"/><path class="ss-fill" d="M160 170h240v70H160z"/><path d="M160 170h240v70H160z"/><path class="ss-thin" d="M60 110h440M90 80v30M150 80v30M210 80v30M270 80v30M330 80v30M390 80v30M450 80v30"/><path class="ss-thin" d="M500 170h10v70h-10"/>`,
    callouts: [[20, 40, 110, 96, ["Counters", "Cubiertas"]], [410, 290, 360, 210, ["Island", "Isla"]], [30, 420, 230, 340, ["Door swing", "Abatimiento de puerta"]], [410, 130, 505, 205, ["Window", "Ventana"]]],
    dims: [[60, 400, 500, 400, ["Room width", "Ancho del cuarto"]], [530, 80, 530, 370, ["Depth", "Fondo"]]],
  },
  general: {
    title: ["Site plan sketch", "Croquis del terreno"],
    art: `<path class="ss-dash" d="M40 60h480v330H40z"/><path class="ss-fill" d="M150 130h220v150H150z"/><path class="ss-wall" d="M150 130h220v150H150z"/><path class="ss-thin" d="M260 280v110M230 390h60"/><circle class="ss-thin" cx="470" cy="110" r="22"/><path d="M470 84v52M470 84l-8 14M470 84l8 14"/>`,
    callouts: [[380, 180, 330, 200, ["Structure", "Construcción"]], [60, 30, 100, 60, ["Property line", "Lindero"]], [300, 420, 262, 360, ["Access", "Acceso"]], [410, 170, 470, 132, ["North", "Norte"]]],
    dims: [[150, 110, 370, 110, ["Footprint", "Huella"]]],
  },
};

function dimLine([x1, y1, x2, y2, label], t) {
  const vertical = x1 === x2;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const ticks = vertical
    ? `M${x1 - 8} ${y1}h16M${x2 - 8} ${y2}h16`
    : `M${x1} ${y1 - 8}v16M${x2} ${y2 - 8}v16`;
  const text = vertical
    ? `<text class="ss-dim__txt" x="${x1}" y="${my}" transform="rotate(-90 ${x1} ${my})" text-anchor="middle" dy="-8">${esc(label[0]).toUpperCase()}</text>`
    : `<text class="ss-dim__txt" x="${mx}" y="${y1}" text-anchor="middle" dy="-8">${esc(label[0]).toUpperCase()}</text>`;
  return `<g class="ss-dim"><path d="M${x1} ${y1}L${x2} ${y2}${ticks}" marker-start="url(#ss-arrow)" marker-end="url(#ss-arrow)"/>${text}</g>`;
}

function drawing(ctx) {
  const d = DRAWINGS[ctx.categoryKey] || DRAWINGS.general;
  const calls = d.callouts.map(([x, y, tx, ty, lab], i) => {
    const n = String(i + 1).padStart(2, "0");
    return `<g class="ss-call"><path d="M${x + 14} ${y + 4}L${tx} ${ty}"/><circle cx="${tx}" cy="${ty}" r="3"/><circle class="ss-call__tag" cx="${x}" cy="${y}" r="13"/><text class="ss-call__n" x="${x}" y="${y + 4}" text-anchor="middle">${n}</text></g>`;
  }).join("");
  const legend = d.callouts.map(([, , , , lab], i) => `<li><span>${String(i + 1).padStart(2, "0")}</span>${ctx.t(lab[0], lab[1])}</li>`).join("");
  const dims = d.dims.map((dm) => dimLine(dm)).join("");
  return `<figure class="ss-drawing"><div class="ss-drawing__bar"><span>${ctx.t("Fig. 01", "Fig. 01")}</span><span>${ctx.t(d.title[0], d.title[1])}</span><span>${ctx.t("Not to scale", "Sin escala")}</span></div><svg viewBox="0 0 560 440" role="img"${ctx.i18n.aria(`Technical illustration: ${d.title[0]}`, `Ilustración técnica: ${d.title[1]}`)} focusable="false"><defs><pattern id="ss-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path class="ss-hatchline" d="M0 0v10"/></pattern><marker id="ss-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1L10 5L0 9z" class="ss-arrowhead"/></marker></defs><g class="ss-art">${d.art}</g>${dims}${calls}</svg><ol class="ss-legend">${legend}</ol><figcaption>${ctx.t("Illustration of a typical detail, for reference. Every job gets its own plan.", "Ilustración de un detalle típico, de referencia. Cada trabajo tiene su propio plan.")}</figcaption></figure>`;
}

const LINES = [
  [/driveway/i, ["Excavation, base and a finish that handles the traffic.", "Excavación, base y un acabado para el tránsito."]],
  [/patio|stamp/i, ["Layout, forms, finish and the joints that control cracking.", "Trazo, cimbra, acabado y juntas para controlar grietas."]],
  [/sidewalk/i, ["Grade, forms and a surface that drains.", "Nivel, cimbra y una superficie que drena."]],
  [/slab|foundation/i, ["Base, reinforcement and thickness set to the plan.", "Base, refuerzo y espesor según el plan."]],
  [/inspect/i, ["A walk through with notes and photos of what was found.", "Un recorrido con notas y fotos de lo encontrado."]],
  [/pier|beam/i, ["Support under the structure, assessed before anything is quoted.", "El soporte bajo la estructura, evaluado antes de cotizar."]],
  [/drain/i, ["Moving water away from the foundation.", "Alejar el agua de los cimientos."]],
  [/crack|repair/i, ["Finding the cause first, then the right repair.", "Encontrar la causa primero y luego la reparación correcta."]],
  [/gate/i, ["Hung to swing true and latch clean.", "Colgada para abrir derecho y cerrar bien."]],
  [/chain/i, ["Galvanized runs for yards, pets and property lines.", "Tramos galvanizados para patios, mascotas y linderos."]],
  [/iron|metal/i, ["Metal panels and posts set for the long run.", "Paneles y postes de metal para durar."]],
  [/privacy|wood|fence/i, ["Posts, rails and boards measured and set in a straight line.", "Postes, rieles y tablas medidos y alineados."]],
  [/kitchen/i, ["Layout, cabinets, counters and the trades behind the walls.", "Distribución, gabinetes, cubiertas y los oficios detrás de los muros."]],
  [/bath/i, ["Waterproofing, tile and fixtures, in the right order.", "Impermeabilización, azulejo y muebles, en el orden correcto."]],
  [/floor|tile/i, ["Subfloor prep, then the finish surface.", "Preparar el firme y luego la superficie final."]],
  [/addition|whole|renovation/i, ["Scope on paper first, then the build in phases.", "El alcance en papel primero, luego la obra por etapas."]],
  [/consult|estimate/i, ["A first conversation about scope and budget.", "Una primera plática sobre alcance y presupuesto."]],
  [/install/i, ["Measured, set and checked before sign off.", "Medido, instalado y revisado antes de entregar."]],
];

function lineFor(name) {
  const hit = LINES.find(([re]) => re.test(name));
  return hit ? hit[1] : ["Ask about scope, materials and timing.", "Pregunte por alcance, materiales y tiempos."];
}

const PROCESS = [
  [["Scope", "Alcance"], ["Walk the site and write down what the job actually is.", "Recorrer el lugar y anotar qué es el trabajo en realidad."]],
  [["Quote", "Cotización"], ["A written price for that scope, line by line.", "Un precio por escrito para ese alcance, partida por partida."]],
  [["Schedule", "Agenda"], ["A start date, with weather and materials planned in.", "Una fecha de inicio, con el clima y los materiales considerados."]],
  [["Build", "Obra"], ["The work, done to the plan that was agreed.", "El trabajo, hecho según el plan acordado."]],
  [["Walkthrough", "Recorrido final"], ["Check it together against the scope before sign off.", "Revisarlo juntos contra el alcance antes de entregar."]],
];

const CSS = `
:root{--display:"Archivo",system-ui,sans-serif;--body:"Archivo",system-ui,sans-serif;--mono:"Martian Mono",ui-monospace,monospace;--radius:0px;--btn-radius:0px;--chip-radius:0px;--max:1240px;--ease:cubic-bezier(.22,1,.36,1);--field:var(--surface);--field-line:var(--line);--star:var(--mark);--lang-fg:var(--ink);--lang-on:var(--bg);--callbar-radius:0px}
body{font-size:1.0625rem;line-height:1.6;font-variation-settings:"wdth" 100;background-color:var(--bg);background-image:linear-gradient(var(--grid-major) 1px,transparent 1px),linear-gradient(90deg,var(--grid-major) 1px,transparent 1px),linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:120px 120px,120px 120px,24px 24px,24px 24px}
.ss-mono{font-family:var(--mono);font-size:.72rem;font-weight:400;letter-spacing:.02em;text-transform:uppercase;font-variation-settings:"wdth" 85}

.b-hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1.5px solid var(--ink)}
.b-hd__in{display:flex;align-items:stretch;gap:0;min-height:4rem}
.b-brand{display:flex;align-items:center;margin-right:auto;padding-right:1.25rem;font-weight:700;font-size:1.2rem;font-variation-settings:"wdth" 85;letter-spacing:-.01em;text-decoration:none;max-width:55vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.b-nav{display:none}
@media (min-width:1040px){.b-nav{display:flex}.b-nav a{display:flex;align-items:center;padding:0 1.1rem;border-left:1.5px solid var(--ink);font-family:var(--mono);font-size:.72rem;text-transform:uppercase;text-decoration:none;font-variation-settings:"wdth" 85}.b-nav a:hover{background:var(--ink);color:var(--bg)}}
.b-hd__end{display:flex;align-items:stretch}
.b-hd__end .lang{align-self:center;margin-right:.75rem}
.b-hd__tel{display:none;align-items:center;gap:.4rem;padding:0 1.1rem;border-left:1.5px solid var(--ink);font-family:var(--mono);font-size:.82rem;text-decoration:none}
@media (min-width:720px){.b-hd__tel{display:flex}}
.b-hd__cta{display:flex;align-items:center;padding:0 1.2rem;background:var(--primary);color:var(--on-primary);border-left:1.5px solid var(--ink);font-weight:700;text-decoration:none}

.ss-hero{padding:clamp(2.5rem,5vw,4rem) 0 clamp(3rem,6vw,5rem);border-bottom:1.5px solid var(--ink)}
.ss-hero__grid{display:grid;gap:2.5rem;align-items:start}
@media (min-width:980px){.ss-hero__grid{grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:3.5rem}}
.ss-tag{display:inline-flex;flex-wrap:wrap;border:1.5px solid var(--ink);background:var(--surface)}
.ss-tag span{padding:.35rem .6rem}
.ss-tag span+span{border-left:1.5px solid var(--ink)}
.ss-h1{margin-top:1.5rem;font-weight:700;font-variation-settings:"wdth" 80;font-size:clamp(2.6rem,6vw,5rem);line-height:.95;letter-spacing:-.02em;max-width:14ch;text-transform:none}
.ss-sub{margin-top:1.25rem;max-width:40ch;font-size:1.15rem;color:var(--muted)}
.ss-ctas{display:flex;flex-wrap:wrap;margin-top:2rem;border:1.5px solid var(--ink);width:fit-content;max-width:100%}
.ss-btn{display:inline-flex;align-items:center;gap:.6rem;min-height:3.4rem;padding:0 1.3rem;font-weight:700;text-decoration:none;background:var(--surface);transition:background-color .2s,color .2s}
.ss-btn:hover{background:var(--ink);color:var(--bg)}
.ss-btn--pri{background:var(--primary);color:var(--on-primary)}
.ss-btn+.ss-btn{border-left:1.5px solid var(--ink)}
.ss-btn span{font-variant-numeric:tabular-nums}
.ss-drawing{margin:0;border:1.5px solid var(--ink);background:var(--surface)}
.ss-drawing__bar{display:grid;grid-template-columns:auto 1fr auto;border-bottom:1.5px solid var(--ink);font-family:var(--mono);font-size:.68rem;text-transform:uppercase;font-variation-settings:"wdth" 85}
.ss-drawing__bar span{padding:.45rem .6rem}
.ss-drawing__bar span+span{border-left:1.5px solid var(--ink)}
.ss-drawing svg{display:block;width:100%;height:auto;padding:.5rem}
.ss-art path,.ss-art circle{fill:none;stroke:var(--ink);stroke-width:2;stroke-linejoin:round}
.ss-art .ss-thin{stroke-width:1.2}
.ss-art .ss-dash{stroke-dasharray:6 5;stroke-width:1.2}
.ss-art .ss-fill{fill:color-mix(in oklab,var(--ink) 8%,transparent);stroke:none}
.ss-art .ss-hatch{fill:url(#ss-hatch);stroke:none}
.ss-hatchline{stroke:var(--muted);stroke-width:1}
.ss-art .ss-wall{stroke-width:7}
.ss-art .ss-gap{stroke:var(--surface);stroke-width:9}
.ss-art .ss-dot{fill:var(--ink);stroke:none}
.ss-dim path{fill:none;stroke:var(--accent);stroke-width:1.2}
.ss-arrowhead{fill:var(--accent)}
.ss-dim__txt{fill:var(--accent);font-family:var(--mono);font-size:10px;letter-spacing:.04em}
.ss-call path{fill:none;stroke:var(--mark);stroke-width:1.2}
.ss-call circle{fill:var(--mark)}
.ss-call .ss-call__tag{fill:var(--surface);stroke:var(--mark);stroke-width:1.5}
.ss-call__n{fill:var(--mark);font-family:var(--mono);font-size:10px;font-weight:500}
.ss-legend{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));border-top:1.5px solid var(--ink)}
.ss-legend li{display:flex;gap:.5rem;padding:.45rem .6rem;font-size:.88rem;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
.ss-legend span{font-family:var(--mono);font-size:.68rem;color:var(--mark);padding-top:.15rem}
.ss-drawing figcaption{padding:.5rem .6rem;border-top:1.5px solid var(--ink);font-size:.82rem;color:var(--muted)}
.ss-drawing--photo .b-photo{aspect-ratio:560/440;position:relative}
.ss-drawing--photo img{filter:grayscale(1) contrast(1.35)}
.ss-drawing--photo .b-photo::after{content:"";position:absolute;inset:0;background-image:linear-gradient(color-mix(in oklab,var(--accent) 45%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in oklab,var(--accent) 45%,transparent) 1px,transparent 1px);background-size:40px 40px;mix-blend-mode:multiply;pointer-events:none}

.ss-spec{background:var(--band);color:var(--on-band)}
.ss-spec__in{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 0;padding:0}
.ss-spec__in>*{padding:1rem 1.25rem 1rem 0;margin-right:1.25rem;border-right:1px solid color-mix(in oklab,var(--on-band) 30%,transparent)}
.ss-spec__in>*:last-child{border-right:0}
.ss-spec .b-rating{display:flex;align-items:center;gap:.75rem}
.ss-spec .b-rating__num{font-weight:700;font-size:2rem;line-height:1;font-variation-settings:"wdth" 80}
.ss-spec .b-rating__side{display:flex;align-items:center;gap:.75rem}
.ss-spec .b-rating__count{font-family:var(--mono);font-size:.72rem;text-transform:uppercase}
.ss-spec .stars{width:6rem;height:1.2rem;color:var(--on-band)}
.ss-spec .ss-mono{color:var(--band-muted)}

.ss-sec{padding:clamp(3.75rem,8vw,6.5rem) 0;border-bottom:1.5px solid var(--ink)}
.ss-sec--paper{background:var(--bg)}
.ss-head{display:grid;gap:.75rem;margin-bottom:2.25rem}
@media (min-width:900px){.ss-head{grid-template-columns:8rem minmax(0,1fr) minmax(0,22rem);align-items:end;gap:2rem}}
.ss-head__idx{font-family:var(--mono);font-size:.72rem;text-transform:uppercase;color:var(--mark);font-variation-settings:"wdth" 85}
.ss-h2{font-weight:700;font-variation-settings:"wdth" 82;font-size:clamp(2rem,4.2vw,3.3rem);line-height:.98;letter-spacing:-.015em}
.ss-lede{color:var(--muted)}
.ss-lede--gap{margin-top:1rem;max-width:40ch}

.ss-table{border:1.5px solid var(--ink);background:var(--surface)}
.ss-table__head,.ss-table li{display:grid;grid-template-columns:4.5rem minmax(0,1fr);align-items:center}
@media (min-width:860px){.ss-table__head,.ss-table li{grid-template-columns:5.5rem minmax(0,1fr) minmax(0,1.3fr) 10rem}}
.ss-table__head{background:var(--ink);color:var(--bg);font-family:var(--mono);font-size:.66rem;text-transform:uppercase;font-variation-settings:"wdth" 85}
.ss-table__head span,.ss-table li>*{padding:.9rem 1rem}
.ss-table__head span:nth-child(n+3){display:none}
@media (min-width:860px){.ss-table__head span:nth-child(n+3){display:block}}
.ss-table li{border-top:1px solid var(--line);transition:background-color .2s}
.ss-table li:hover{background:color-mix(in oklab,var(--primary) 12%,var(--surface))}
.ss-table .ss-idx{font-family:var(--mono);font-size:.75rem;color:var(--mark);align-self:stretch;border-right:1px solid var(--line)}
.ss-table h3{font-weight:700;font-size:1.15rem;font-variation-settings:"wdth" 90}
.ss-table p{color:var(--muted);font-size:.95rem;grid-column:2;padding-top:0 !important}
.ss-table a{grid-column:2;padding-top:0 !important;font-family:var(--mono);font-size:.72rem;text-transform:uppercase;text-underline-offset:.3em}
@media (min-width:860px){.ss-table p,.ss-table a{grid-column:auto;padding-top:.9rem !important}.ss-table a{justify-self:end}}
.b-svc-confirm{margin-top:1.25rem;font-family:var(--mono);font-size:.72rem;text-transform:uppercase;color:var(--muted)}
.svc-note{margin-top:.3rem;color:var(--muted);font-size:.9rem}

.ss-cols{display:grid;border:1.5px solid var(--ink);background:var(--surface)}
@media (min-width:900px){.ss-cols{grid-template-columns:repeat(5,minmax(0,1fr))}}
.ss-cols li{position:relative;padding:1.25rem 1.25rem 1.5rem;border-top:1px solid var(--line)}
.ss-cols li:first-child{border-top:0}
@media (min-width:900px){.ss-cols li{border-top:0;border-left:1px solid var(--line)}.ss-cols li:first-child{border-left:0}}
.ss-cols .step-n{display:block;font-weight:700;font-size:3rem;line-height:1;font-variation-settings:"wdth" 75;color:var(--mark)}
.ss-cols h3{margin-top:.75rem;font-weight:700;font-size:1.2rem}
.ss-cols p{margin-top:.35rem;color:var(--muted);font-size:.95rem}
.ss-cols li::after{content:"";position:absolute;top:1.25rem;right:1.25rem;width:.8rem;height:.8rem;border:1.5px solid var(--ink)}

.ss-why .b-themes{display:grid;border:1.5px solid var(--ink);background:var(--surface);counter-reset:th}
.ss-why .b-themes li{display:flex;gap:1rem;padding:1rem 1.1rem;border-top:1px solid var(--line);font-weight:600;font-size:1.1rem;counter-increment:th}
.ss-why .b-themes li:first-child{border-top:0}
.ss-why .b-themes li::before{content:"R-" counter(th,decimal-leading-zero);font-family:var(--mono);font-size:.72rem;color:var(--mark);padding-top:.3rem;font-weight:400}
.b-themes__note{margin-top:.9rem;font-size:.9rem;color:var(--muted)}

.ss-sheet{display:grid;gap:2.5rem;align-items:start}
@media (min-width:980px){.ss-sheet{grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:3.5rem}}
.ss-sheet__card{border:1.5px solid var(--ink);background:var(--surface)}
.ss-sheet__top{display:grid;grid-template-columns:1fr auto auto;border-bottom:1.5px solid var(--ink)}
.ss-sheet__top span{padding:.6rem .75rem}
.ss-sheet__top span+span{border-left:1.5px solid var(--ink)}
.ss-sheet__body{padding:clamp(1rem,3vw,1.75rem)}
.f-label,.f-field legend{font-family:var(--mono);font-size:.7rem;font-weight:400;text-transform:uppercase;letter-spacing:.02em;font-variation-settings:"wdth" 85}
.f-input{border-width:1.5px;border-color:var(--ink);border-radius:0;background:var(--bg)}
.f-input:focus{outline:none;box-shadow:inset 0 -3px 0 var(--primary)}
.f-chip>span{border-width:1.5px;border-color:var(--ink);border-radius:0}
.f-chip input:checked+span{background:var(--primary);color:var(--on-primary);border-color:var(--ink)}
.f-drop{border-radius:0;border-color:var(--ink);border-width:1.5px}
.f-previews img{border-radius:0}
.f-submit{border-radius:0;border:1.5px solid var(--ink);min-height:3.4rem}
.f-status{border-radius:0;font-family:var(--mono);font-size:.8rem}
.f-urgent{border-radius:0}

.ss-area{display:grid;gap:2.5rem}
@media (min-width:900px){.ss-area{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4rem}}
.ss-coord{margin-top:1.5rem;border:1.5px solid var(--ink);background:var(--surface)}
.ss-coord div{display:grid;grid-template-columns:8rem 1fr;border-top:1px solid var(--line)}
.ss-coord div:first-child{border-top:0}
.ss-coord span{padding:.7rem .8rem}
.ss-coord span:first-child{border-right:1px solid var(--line)}
.facts{margin:0;border:1.5px solid var(--ink);background:var(--surface)}
.facts div{display:grid;grid-template-columns:8rem minmax(0,1fr);border-top:1px solid var(--line)}
.facts div:first-child{border-top:0}
.facts dt{padding:.75rem .8rem;border-right:1px solid var(--line);font-family:var(--mono);font-size:.68rem;text-transform:uppercase;color:var(--muted)}
.facts dd{margin:0;padding:.75rem .8rem;font-weight:600}
.b-visit__pending{display:grid;gap:.35rem;margin-top:1rem;color:var(--muted);font-size:.95rem}
.dir{display:inline-flex;align-items:center;gap:.45rem;margin-top:1rem;font-weight:700}

.faq{border:1.5px solid var(--ink);background:var(--surface)}
.faq details{border-top:1px solid var(--line);padding:0 1rem}
.faq details:first-child{border-top:0}
.faq details:last-child{border-bottom:0}
.faq summary{font-weight:700}

.b-ft{background:var(--bg);padding:3rem 0}
.ss-title{display:grid;border:1.5px solid var(--ink);background:var(--surface);margin-bottom:1.5rem}
@media (min-width:760px){.ss-title{grid-template-columns:2fr 1fr 1fr 1fr}}
.ss-title div{padding:.7rem .8rem;border-top:1px solid var(--line)}
.ss-title div:first-child{border-top:0}
@media (min-width:760px){.ss-title div{border-top:0;border-left:1px solid var(--line)}.ss-title div:first-child{border-left:0}}
.ss-title dt{font-family:var(--mono);font-size:.62rem;text-transform:uppercase;color:var(--muted)}
.ss-title dd{margin:.2rem 0 0;font-weight:700}
.b-ft__name{font-weight:700;font-size:1.4rem;font-variation-settings:"wdth" 82}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.4rem 2rem;margin-top:.5rem;font-family:var(--mono);font-size:.75rem;text-transform:uppercase;color:var(--muted)}
.legal{margin-top:1.25rem;font-size:.85rem;color:var(--muted)}
.callbar{border-radius:0;border:1.5px solid var(--ink);box-shadow:4px 4px 0 var(--ink)}
.b-float{border-radius:0;border:1.5px solid var(--ink);box-shadow:4px 4px 0 var(--ink)}
@media (max-width:479.98px){.b-brand{max-width:80vw}}
@media (max-width:479.98px){.ss-ctas{width:100%}.ss-btn{flex:1 1 100%;justify-content:center}.ss-btn+.ss-btn{border-left:0;border-top:1.5px solid var(--ink)}}
`;

function render(ctx) {
  const t = ctx.t;
  const photoHero = ctx.variants.hero === "photo";
  const estimate = ctx.kind === "estimate";
  const verbPair = estimate ? ["Request an estimate", "Pedir presupuesto"] : ctx.kind === "emergency" ? ["Request service", "Pedir servicio"] : ["Send a request", "Enviar solicitud"];
  const verb = ctx.copyOr("ctaPrimary", verbPair);

  const header = siteHeader(ctx, {
    cta: estimate ? ["Estimate", "Presupuesto"] : ["Request", "Solicitud"],
    nav: [
      ...(ctx.services.length ? [{ href: "#services", label: ["Services", "Servicios"] }] : []),
      { href: "#process", label: ["Process", "Proceso"] },
      { href: `#${REQUEST_ID}`, label: ["Job sheet", "Hoja de trabajo"] },
      { href: "#area", label: ["Area", "Zona"] },
    ],
  });

  const pic = photoHero ? ctx.photos.hero() : null;
  const visual = pic
    ? `<figure class="ss-drawing ss-drawing--photo"><div class="ss-drawing__bar"><span>${t("Fig. 01", "Fig. 01")}</span><span>${ctx.categoryT}</span><span>${t("Stock photo", "Foto de archivo")}</span></div><div class="b-photo">${ctx.photos.img(pic, { hero: true, sizes: "(min-width: 980px) 50vw, 100vw", width: 1200 })}</div><figcaption>${t("Stock photo, a placeholder for the owner's own job photos.", "Foto de archivo, en lugar de las fotos de trabajos del dueño.")}</figcaption></figure>`
    : drawing(ctx);

  const copy = `<div><p class="ss-tag ss-mono"><span>${ctx.name}</span><span>${esc(ctx.cityState || ctx.placeRaw)}</span></p><h1 class="ss-h1">${ctx.copyOr("headline", ctx.promise)}</h1><p class="ss-sub">${ctx.about || t("Scope it, write it down, then build it. It starts with a short request.", "Definir el alcance, ponerlo por escrito y construir. Empieza con una solicitud corta.")}</p><div class="ss-ctas"><a class="ss-btn ss-btn--pri" href="#${REQUEST_ID}">${verb}${icon("arrow")}</a>${ctx.tel ? `<a class="ss-btn" href="${esc(ctx.tel)}">${icon("phone")}<span>${esc(ctx.phone)}</span></a>` : ""}</div></div>`;
  const hero = `<section class="ss-hero" id="top"><div class="wrap ss-hero__grid">${copy}${visual}</div></section>`;

  const spec = `<section class="ss-spec" aria-label="Google rating"><div class="wrap ss-spec__in"><span class="ss-mono">${t("Spec", "Dato")}</span>${ratingProof(ctx, "strip")}<span class="ss-mono">${t(`Google, ${ctx.cityRaw || "local"}`, `Google, ${ctx.cityRaw || "local"}`)}</span></div></section>`;

  const services = ctx.services.length
    ? `<section class="ss-sec ss-sec--paper" id="services"><div class="wrap"><div class="ss-head"><span class="ss-head__idx">${t("Sheet 02", "Hoja 02")}</span><h2 class="ss-h2">${t("Scope of work", "Alcance del trabajo")}</h2><p class="ss-lede">${t("What they take on. Pick a line and it goes on your job sheet.", "Lo que hacen. Elija una línea y va a su hoja de trabajo.")}</p></div><div class="ss-table"><div class="ss-table__head" aria-hidden="true"><span>${t("Item", "Partida")}</span><span>${t("Service", "Servicio")}</span><span>${t("Covers", "Incluye")}</span><span></span></div><ul>${ctx.services.map((s, i) => { const l = lineFor(s); return `<li class="rv"><span class="ss-idx">S-${String(i + 1).padStart(2, "0")}</span><h3>${esc(s)}</h3><p>${t(l[0], l[1])}</p><a href="#${REQUEST_ID}">${t("Ask about this", "Preguntar")}</a></li>`; }).join("")}</ul></div>${servicesConfirm(ctx)}</div></section>`
    : "";

  const process = `<section class="ss-sec" id="process"><div class="wrap"><div class="ss-head"><span class="ss-head__idx">${t("Sheet 03", "Hoja 03")}</span><h2 class="ss-h2">${t("Five steps, in order", "Cinco pasos, en orden")}</h2><p class="ss-lede">${t("How a job like this usually runs. Details to confirm with the owner.", "Cómo suele ir un trabajo así. Detalles por confirmar con el dueño.")}</p></div><ol class="ss-cols">${PROCESS.map((p, i) => `<li class="rv"><span class="step-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><h3>${t(p[0][0], p[0][1])}</h3><p>${t(p[1][0], p[1][1])}</p></li>`).join("")}</ol></div></section>`;

  const themes = themesBlock(ctx);
  const why = themes ? `<section class="ss-sec ss-sec--paper ss-why"><div class="wrap"><div class="ss-head"><span class="ss-head__idx">${t("Sheet 04", "Hoja 04")}</span><h2 class="ss-h2">${t("Why customers call", "Por qué llaman los clientes")}</h2><p class="ss-lede">${t("Recurring notes from Google reviews.", "Notas que se repiten en reseñas de Google.")}</p></div>${themes}</div></section>` : "";

  const form = formHeading(ctx);
  const request = `<section class="ss-sec" id="${REQUEST_ID}"><div class="wrap ss-sheet"><div><span class="ss-head__idx">${t("Sheet 05", "Hoja 05")}</span><h2 class="ss-h2">${form.title}</h2><p class="ss-lede ss-lede--gap">${form.intro}</p></div><div class="ss-sheet__card"><div class="ss-sheet__top ss-mono"><span>${t("Job sheet", "Hoja de trabajo")}</span><span>${t("No.", "Núm.")} ____</span><span>${esc(ctx.cityRaw || ctx.placeRaw)}</span></div><div class="ss-sheet__body">${ctx.form}</div></div></div></section>`;

  const area = `<section class="ss-sec ss-sec--paper" id="area"><div class="wrap ss-area"><div><span class="ss-head__idx">${t("Sheet 06", "Hoja 06")}</span><h2 class="ss-h2">${t("Service area", "Zona de servicio")}</h2><div class="ss-coord"><div><span class="ss-mono">${t("Base", "Base")}</span><span>${esc(ctx.placeRaw)}</span></div><div><span class="ss-mono">${t("Coverage", "Cobertura")}</span><span>${t("Towns served to confirm with the owner", "Zonas por confirmar con el dueño")}</span></div></div></div>${visitDetails(ctx)}</div></section>`;

  const faq = `<section class="ss-sec" id="faq"><div class="wrap ss-area"><div><span class="ss-head__idx">${t("Sheet 07", "Hoja 07")}</span><h2 class="ss-h2">${t("Questions", "Preguntas")}</h2></div>${faqBlock(ctx)}</div></section>`;

  const month = ctx.monthYear;
  const titleBlock = `<dl class="ss-title"><div><dt>${t("Project", "Proyecto")}</dt><dd>${t(`Website concept for ${ctx.nameRaw}`, `Concepto de sitio para ${ctx.nameRaw}`)}</dd></div><div><dt>${t("Sheet", "Hoja")}</dt><dd>${t("Concept sheet 01", "Hoja de concepto 01")}</dd></div><div><dt>${t("Date", "Fecha")}</dt><dd>${t(month[0], month[1])}</dd></div><div><dt>${t("Scale", "Escala")}</dt><dd>${t("Not to scale", "Sin escala")}</dd></div></dl>`;
  const footer = siteFooter(ctx).replace("<div class=\"wrap\">", `<div class="wrap">${titleBlock}`);

  return {
    css: CSS,
    body: `${header}<main>${hero}${spec}${services}${process}${why}${request}${area}${faq}</main>${footer}`,
  };
}

export const direction = {
  key: "ct-site-survey",
  label: "Site survey",
  status: "implemented",
  suits: ["concrete", "fencing", "foundation-repair", "remodeling", "general"],
  keywords: ["precise", "technical", "survey", "engineered", "foundation"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..100,400..800&family=Martian+Mono:wdth,wght@75..100,400..500&display=swap",
  palettes: PALETTES,
  variants: { hero: ["drawing", "photo"], services: ["table"], proof: ["spec"] },
  imagery: { photos: true, people: ["none", "hands"], heroPeople: ["none"], heroPrefer: /fence|kitchen|concrete/ },
  callbar: "call",
  render,
};
