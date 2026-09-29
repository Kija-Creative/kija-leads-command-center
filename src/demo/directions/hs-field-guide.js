// Field guide (research/design-home-contractor.md, home services 4). A
// knowledgeable naturalist: reassuring and curious rather than alarming. The
// hero is a numbered specimen plate of fine line drawings (pests, a septic
// tank in section, an exploded washer, a tree down to its root flare) with
// small caps captions on hairline leaders. No photos of pests or damage, ever.
// Services become a "what are you seeing" grid of tinted illustrated tiles,
// and a paper grain from an SVG turbulence filter sits over the whole page.

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
import { stepsFor } from "../copy.js";
import { esc, icon } from "../shared.js";
import { hsBlurb, hsGlyph } from "./hs-dispatch-triage.js";

const PALETTES = [
  { key: "field-sage", name: "Sage paper", vars: { bg: "#eef1e8", surface: "#f8f9f4", ink: "#13302a", muted: "#4f6058", line: "#cfd8cb", primary: "#0f5a4a", "on-primary": "#ffffff", accent: "#c95a33", tint: "#dfe7d9", plate: "#f8f9f4", band: "#13302a", "on-band": "#eef1e8", "band-muted": "#b8c6bd", grain: "multiply" } },
  { key: "field-dune", name: "Dune", vars: { bg: "#f5efe4", surface: "#fbf8f2", ink: "#2a2118", muted: "#65574a", line: "#e2d6c3", primary: "#7a4b1e", "on-primary": "#ffffff", accent: "#2f6f62", tint: "#ece2d1", plate: "#fbf8f2", band: "#2a2118", "on-band": "#f5efe4", "band-muted": "#c9baa6", grain: "multiply" } },
  { key: "field-slate", name: "Chalk on slate", vars: { bg: "#14201d", surface: "#1b2a26", ink: "#eef2ea", muted: "#a8b5ad", line: "#2c3d38", primary: "#9fd8b4", "on-primary": "#10201b", accent: "#f2a65a", tint: "#20332e", plate: "#1b2a26", band: "#9fd8b4", "on-band": "#10201b", "band-muted": "#2d4a3f", grain: "screen" } },
];

// Specimen plates. Each is a 520 by 560 drawing with captions placed by
// coordinates; leaders run from the caption to the part.
const PLATES = {
  "pest-control": {
    title: ["Common household pests", "Plagas comunes de la casa"],
    art: `
<g transform="translate(120 120)"><ellipse cx="0" cy="0" rx="9" ry="8"/><ellipse cx="18" cy="2" rx="7" ry="6"/><ellipse cx="40" cy="4" rx="16" ry="11"/><path d="M-6-6c-8-10-16-12-22-10M-2-8c-2-12-8-18-14-20M14 6l-8 14-8 4M20 7l2 16 6 6M26 6l12 14 10 2"/></g>
<g transform="translate(360 150)"><ellipse cx="0" cy="0" rx="8" ry="7"/><path d="M6 2h52c6 0 8 4 8 6s-2 6-8 6H6z"/><path d="M8 -2c20-24 60-28 90-18-20 14-56 20-90 18zM8 -2c24-14 60-10 84 2"/><path d="M-4-4l-10-10M-2-6l-4-14M18 14l-6 12M34 14v12M50 14l6 12"/></g>
<g transform="translate(140 340)"><ellipse cx="0" cy="0" rx="6" ry="5"/><path d="M5 0h14M19-3c8 0 12 2 12 3s-4 3-12 3z"/><path d="M31 0c14 0 30 1 36 0"/><path d="M8-2c-4-26 4-44 20-52M8-2c10-22 26-30 44-30"/><path d="M-4 3c-8 4-12 12-14 22M2 4c-2 10 0 18 6 26M12 3c6 8 14 12 24 12M-5-2l-14 4"/></g>
<g transform="translate(360 380)"><ellipse cx="0" cy="0" rx="14" ry="12"/><circle cx="-18" cy="-2" r="7"/><path d="M-10-8c-12-18-26-22-38-18M-6-11c-4-16-10-24-20-28M6-10c6-18 16-26 28-28M10-6c16-8 30-6 40 2M10 6c16 8 28 20 32 34M4 10c6 16 6 30 0 42M-8 10c-6 14-16 22-28 26M-12 4c-14 4-26 12-32 22"/></g>`,
    labels: [
      [60, 70, 110, 108, ["Ant", "Hormiga"]],
      [300, 90, 360, 138, ["Termite swarmer", "Termita alada"]],
      [60, 270, 150, 306, ["Mosquito", "Mosquito"]],
      [300, 300, 350, 364, ["Spider", "Araña"]],
    ],
  },
  septic: {
    title: ["A septic tank, in section", "Una fosa séptica, en corte"],
    art: `
<path d="M20 170h480"/><path class="fg-hatch" d="M20 170h480v12H20z"/>
<path d="M80 150v-18h36v18M404 150v-18h36v18"/>
<rect x="70" y="220" width="380" height="250" rx="18"/>
<path d="M20 238h60M440 262h60"/><path d="M70 238h-4M444 262h6"/>
<path d="M130 220v150M390 220v160"/>
<path class="fg-dash" d="M70 262h380"/>
<path class="fg-dash" d="M70 400h380"/>
<path class="fg-stipple" d="M90 420h20M140 430h14M190 418h22M250 432h16M300 420h20M350 428h18M410 420h16M110 448h18M180 452h14M240 446h20M320 450h16M380 446h20"/>
<path d="M90 150v70M422 150v70"/>`,
    labels: [
      [20, 110, 98, 150, ["Access lid", "Tapa de acceso"]],
      [0, 205, 40, 238, ["Inlet from the house", "Entrada de la casa"]],
      [290, 110, 470, 262, ["Outlet to the drain field", "Salida al campo de drenaje"]],
      [300, 205, 260, 250, ["Scum layer", "Capa de natas"]],
      [180, 336, 300, 330, ["Liquid", "Líquido"]],
      [300, 520, 260, 438, ["Sludge", "Lodos"]],
    ],
  },
  "appliance-repair": {
    title: ["A front load washer, taken apart", "Una lavadora de carga frontal, desarmada"],
    art: `
<rect x="60" y="60" width="200" height="240" rx="10"/><path d="M60 110h200M82 84h40M200 80h36v10h-36z"/>
<circle cx="360" cy="190" r="86"/><circle cx="360" cy="190" r="70"/><path d="M360 120v-8M430 190h8M360 260v8M290 190h-8"/><path d="M322 160l10 6M388 160l-10 6M360 236v-12"/>
<circle cx="160" cy="220" r="62"/><circle cx="160" cy="220" r="48"/><path d="M200 196c8 10 8 36 0 48"/>
<path d="M300 330c30-6 70-6 100 0v70c-30 6-70 6-100 0z"/><path d="M400 350h36M436 342v16"/>
<ellipse cx="130" cy="430" rx="70" ry="22"/><ellipse cx="130" cy="430" rx="54" ry="14"/>
<path class="fg-dash" d="M160 282v38M360 276v48M130 408v-40"/>`,
    labels: [
      [20, 30, 70, 64, ["Cabinet and controls", "Gabinete y controles"]],
      [410, 70, 410, 120, ["Drum", "Tambor"]],
      [10, 310, 104, 246, ["Door and seal", "Puerta y empaque"]],
      [330, 470, 350, 402, ["Drain pump", "Bomba de desagüe"]],
      [30, 500, 90, 448, ["Drive belt", "Banda"]],
    ],
  },
  "tree-service": {
    title: ["A shade tree, crown to root flare", "Un árbol de sombra, de la copa a la raíz"],
    art: `
<path d="M260 470V300"/><path d="M246 470V300M274 470V300"/>
<path d="M260 300c-10-40-40-70-80-90M260 300c10-50 40-80 86-96M260 300V150M260 230c-30-20-60-24-90-20M260 210c26-20 54-26 86-22"/>
<path d="M260 60c-60 0-120 30-150 80-30 50-20 110 20 140 30 22 80 26 130 24 50 2 100-2 130-24 40-30 50-90 20-140-30-50-90-80-150-80z"/>
<path d="M216 470c-20 4-40 14-60 26M304 470c20 4 40 14 60 26M236 474c-8 10-12 20-12 30M284 474c8 10 12 20 12 30"/>
<path d="M60 470h400"/><path class="fg-hatch" d="M60 470h400v10H60z"/>
<path class="fg-dash" d="M110 320v160M410 320v160"/>`,
    labels: [
      [360, 30, 330, 80, ["Crown", "Copa"]],
      [20, 160, 176, 212, ["Scaffold limb", "Rama principal"]],
      [330, 380, 274, 380, ["Trunk", "Tronco"]],
      [20, 520, 196, 480, ["Root flare", "Base de la raíz"]],
      [340, 520, 410, 482, ["Drip line", "Línea de goteo"]],
    ],
  },
};

function plateSvg(ctx, n) {
  const p = PLATES[ctx.categoryKey] || PLATES["pest-control"];
  const t = ctx.t;
  const labels = p.labels.map(([x, y, tx, ty, lab]) => {
    const w = Math.round(lab[0].length * 8.6);
    const sx = Math.max(x, Math.min(tx, x + w));
    const sy = ty < y ? y - 15 : y + 6;
    return `<path class="fg-leader" d="M${x} ${y + 6}H${x + w}M${sx} ${sy}L${tx} ${ty}"/><circle class="fg-dot" cx="${tx}" cy="${ty}" r="2.5"/><text class="fg-cap" x="${x}" y="${y}">${esc(lab[0]).toUpperCase()}</text>`;
  }).join("");
  return `<figure class="fg-plate"><div class="fg-plate__top"><span>${t(`Plate ${n}`, `Lámina ${n}`)}</span><span>${esc(ctx.cityState)}</span></div><svg viewBox="-10 0 540 560" role="img"${ctx.i18n.aria(`Line drawing: ${p.title[0]}`, `Dibujo: ${p.title[1]}`)} focusable="false"><g class="fg-art">${p.art}</g><g class="fg-labels">${labels}</g></svg><figcaption>${t(p.title[0], p.title[1])}. <em>${t("An illustration, for reference.", "Ilustración de referencia.")}</em></figcaption></figure>`;
}

// Tree service glyphs; the other trades use the shared home services set.
const TREE_GLYPHS = [
  [/trim|prun/i, "<path d=\"M12 21V11\"/><path d=\"M12 11C8 11 5 8.5 5 5.5 8 5.5 12 7 12 11zM12 13c3.5 0 6-2.2 6-5-3 0-6 1.5-6 5z\"/><path d=\"M16 17l4 4M20 17l-4 4\"/>"],
  [/remov|fell/i, "<path d=\"M4 19l12-12\"/><path d=\"M16 7c1-3 4-4 5-3s0 4-3 5\"/><path d=\"M3 21h18M5 16l3 3\"/>"],
  [/stump/i, "<ellipse cx=\"12\" cy=\"10\" rx=\"7\" ry=\"3\"/><path d=\"M5 10v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6\"/><path d=\"M12 10v.1M9.5 10c0-1 1-2 2.5-2\"/>"],
  [/storm/i, "<path d=\"M7 15h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.5 1.5A3.3 3.3 0 0 0 7 15z\"/><path d=\"M11 17l-2 4h4l-2 3\"/>"],
  [/clear|lot|brush/i, "<path d=\"M3 20h18\"/><path d=\"M6 20v-5M6 15c-2 0-3-1.5-3-3 2 0 3 1.5 3 3zM6 15c2 0 3-1.5 3-3-2 0-3 1.5-3 3z\"/><path d=\"M14 20v-3h6v3\"/>"],
];

function glyph(ctx, name) {
  if (ctx.categoryKey === "tree-service") {
    const hit = TREE_GLYPHS.find(([re]) => re.test(name));
    if (hit) return `<svg class="hs-glyph" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${hit[1]}</svg>`;
  }
  return hsGlyph(name, { stroke: 1.3 });
}

function blurb(ctx, name) {
  if (ctx.categoryKey === "tree-service") return ["Describe the tree, where it stands and what worries you.", "Describa el árbol, dónde está y qué le preocupa."];
  return hsBlurb(name);
}

// What to write down before calling. General, useful anywhere.
const NOTES = {
  "pest-control": [
    ["Where you see them, and at what time of day.", "Dónde los ve y a qué hora del día."],
    ["Roughly how many, and whether it is getting worse.", "Más o menos cuántos, y si va en aumento."],
    ["A photo from a safe distance, if you can.", "Una foto desde una distancia segura, si puede."],
    ["Kids, pets or anyone sensitive in the home.", "Niños, mascotas o alguien sensible en la casa."],
  ],
  septic: [
    ["When the tank was last pumped, if you know.", "Cuándo se vació la fosa por última vez, si lo sabe."],
    ["Where the lid is, or a rough idea of where the tank sits.", "Dónde está la tapa, o más o menos dónde está la fosa."],
    ["Which drains are slow, and since when.", "Qué drenajes están lentos y desde cuándo."],
    ["Any wet ground or odor in the yard.", "Suelo mojado u olor en el patio."],
  ],
  "appliance-repair": [
    ["Brand and model number, from the label inside the door or on the back.", "Marca y número de modelo, de la etiqueta dentro de la puerta o atrás."],
    ["What it does, or does not do, and since when.", "Qué hace o qué no hace, y desde cuándo."],
    ["Any error code on the display.", "Cualquier código de error en la pantalla."],
    ["Whether it runs on gas or electric.", "Si funciona con gas o con luz."],
  ],
  "tree-service": [
    ["Roughly how tall it is, and how close to the house or lines.", "Más o menos qué tan alto es y qué tan cerca está de la casa o los cables."],
    ["Any cracks, lean or dead limbs you can see.", "Grietas, inclinación o ramas secas que se vean."],
    ["Access for equipment: gates, fences, slopes.", "Acceso para el equipo: portones, cercas, pendientes."],
    ["Photos from a few angles.", "Fotos desde varios ángulos."],
  ],
};

const CSS = `
:root{--display:"Alegreya",Georgia,serif;--body:"Public Sans",system-ui,sans-serif;--radius:4px;--btn-radius:999px;--chip-radius:999px;--max:1200px;--ease:cubic-bezier(.22,1,.36,1);--field:var(--surface);--field-line:var(--line);--star:var(--primary);--lang-fg:var(--ink);--lang-on:var(--bg)}
body{font-size:1.0625rem;line-height:1.65;position:relative}
.fg-sc{font-family:var(--body);font-weight:600;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase}
.fg-grain{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:40;opacity:.07;mix-blend-mode:var(--grain)}

.b-hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--line)}
.b-hd__in{display:flex;align-items:center;gap:1.25rem;min-height:4.4rem}
.b-brand{margin-right:auto;font-family:var(--display);font-weight:600;font-size:1.45rem;line-height:1.1;text-decoration:none;max-width:55vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.b-nav{display:none;gap:1.6rem;font-size:.95rem}
.b-nav a{text-decoration:none;color:var(--muted)}
.b-nav a:hover{color:var(--ink)}
@media (min-width:1020px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:1rem}
.b-hd__tel{display:none;align-items:center;gap:.4rem;font-weight:600;text-decoration:none}
@media (min-width:720px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.7rem;padding:0 1.15rem;border-radius:999px;background:var(--primary);color:var(--on-primary);font-weight:600;font-size:.95rem;text-decoration:none}

.fg-hero{padding:clamp(2.5rem,6vw,5rem) 0 clamp(3rem,6vw,5rem)}
.fg-hero__grid{display:grid;gap:clamp(2rem,5vw,4.5rem);align-items:center}
@media (min-width:960px){.fg-hero__grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.fg-hero--mirror .fg-plate{order:-1}}
.fg-kicker{display:flex;flex-wrap:wrap;gap:.4rem 1rem;color:var(--muted)}
.fg-kicker b{color:var(--ink);font-weight:600}
.fg-h1{margin-top:1rem;font-family:var(--display);font-weight:500;font-size:clamp(2.6rem,5.6vw,4.6rem);line-height:1;letter-spacing:-.015em;max-width:15ch}
.fg-sub{margin-top:1.25rem;max-width:42ch;font-size:1.15rem;color:var(--muted)}
.fg-ctas{display:flex;flex-wrap:wrap;gap:.75rem 1.25rem;align-items:center;margin-top:2rem}
.fg-btn{display:inline-flex;align-items:center;gap:.55rem;min-height:3.3rem;padding:0 1.5rem;border-radius:999px;background:var(--primary);color:var(--on-primary);font-weight:600;text-decoration:none;transition:transform .3s var(--ease)}
.fg-btn:hover{transform:translateY(-2px)}
.fg-btn--line{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--ink)}
.fg-plate{margin:0;padding:1.1rem 1.1rem 1.25rem;background:var(--plate);border:1px solid var(--line);box-shadow:0 0 0 6px var(--bg),0 0 0 7px var(--line)}
.fg-plate__top{display:flex;justify-content:space-between;gap:1rem;padding-bottom:.6rem;border-bottom:1px solid var(--line);font-family:var(--display);font-style:italic;color:var(--muted)}
.fg-plate svg{width:100%;height:auto;margin-top:.5rem}
.fg-art,.fg-art path,.fg-art rect,.fg-art circle,.fg-art ellipse{fill:none;stroke:var(--ink);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.fg-art .fg-dash{stroke-dasharray:4 5;stroke:var(--muted)}
.fg-art .fg-hatch{stroke:none;fill:color-mix(in oklab,var(--ink) 14%,transparent)}
.fg-art .fg-stipple{stroke:var(--muted);stroke-dasharray:1 5;stroke-width:2.2}
.fg-leader{fill:none;stroke:var(--accent);stroke-width:.8}
.fg-dot{fill:var(--accent)}
.fg-cap{fill:var(--ink);font-family:var(--body);font-weight:600;font-size:12.5px;letter-spacing:.1em}
.fg-plate figcaption{margin-top:.6rem;padding-top:.6rem;border-top:1px solid var(--line);font-family:var(--display);font-size:1.05rem}
.fg-plate figcaption em{color:var(--muted)}
.fg-hero .b-rating{display:inline-flex;align-items:center;gap:.55rem;margin-top:1.5rem;font-size:.95rem;color:var(--muted)}
.fg-hero .b-rating__num{font-weight:700;color:var(--ink)}
.fg-hero .stars{width:5.25rem;height:1.05rem}

.fg-strip{border-block:1px solid var(--line);background:var(--surface)}
.fg-strip__in{display:grid;gap:1rem 3rem;padding:1.5rem 0;align-items:center}
@media (min-width:860px){.fg-strip__in{grid-template-columns:auto minmax(0,1fr)}}
.fg-strip .b-rating{display:flex;align-items:center;gap:1.25rem}
.fg-strip .b-rating__num{font-family:var(--display);font-weight:500;font-size:3.4rem;line-height:1}
.fg-strip .b-rating__side{display:grid;gap:.25rem}
.fg-strip .b-rating__count{font-weight:600}
.fg-strip p{font-family:var(--display);font-style:italic;font-size:1.2rem;color:var(--muted)}

.fg-sec{padding:clamp(3.75rem,8vw,6.5rem) 0}
.fg-sec--alt{background:var(--surface);border-block:1px solid var(--line)}
.fg-head{display:grid;gap:.8rem;max-width:46rem;margin-bottom:2.5rem}
.fg-h2{font-family:var(--display);font-weight:500;font-size:clamp(2rem,4vw,3rem);line-height:1.05;letter-spacing:-.01em}
.fg-h2 em{font-weight:400;color:var(--muted)}
.fg-lede{color:var(--muted);max-width:56ch}

.fg-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,19rem),1fr));gap:1.5rem 2rem}
.fg-tile{display:grid;grid-template-columns:8rem minmax(0,1fr);gap:1rem;align-items:start;text-decoration:none}
@media (max-width:420px){.fg-tile{grid-template-columns:6rem minmax(0,1fr)}}
.fg-tile__art{position:relative;display:grid;place-items:center;aspect-ratio:1;border-radius:4px;background:var(--tint);color:var(--ink);transition:background-color .3s}
.fg-tile__art .hs-glyph{width:52%;height:52%}
.fg-tile__art span{position:absolute;left:.45rem;top:.35rem;font-family:var(--display);font-style:italic;font-size:.85rem;color:var(--muted)}
.fg-tile:hover .fg-tile__art{background:color-mix(in oklab,var(--primary) 18%,var(--tint))}
.fg-tile h3{font-family:var(--display);font-weight:600;font-size:1.3rem;line-height:1.15}
.fg-tile p{margin-top:.35rem;color:var(--muted);font-size:.95rem}
.fg-tile .fg-sc{display:inline-block;margin-top:.5rem;color:var(--primary)}
.b-svc-confirm{margin-top:1.5rem;color:var(--muted);font-size:.95rem}
.svc-note{margin-top:.3rem;color:var(--muted);font-size:.92rem}

.fg-steps{display:grid;gap:1.5rem}
@media (min-width:860px){.fg-steps{grid-template-columns:repeat(3,minmax(0,1fr));gap:2.5rem}}
.fg-steps li{padding-top:1.25rem;border-top:1px solid var(--ink)}
.fg-steps .step-n{font-family:var(--display);font-style:italic;font-size:1.1rem;color:var(--muted)}
.fg-steps h3{margin-top:.5rem;font-family:var(--display);font-weight:600;font-size:1.5rem;line-height:1.15}
.fg-steps p{margin-top:.4rem;color:var(--muted)}

.fg-notes{display:grid;gap:2rem}
@media (min-width:900px){.fg-notes{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}}
.fg-notes ol{display:grid;gap:0;counter-reset:n}
.fg-notes li{display:grid;grid-template-columns:2.5rem minmax(0,1fr);gap:1rem;padding:1.1rem 0;border-bottom:1px solid var(--line);counter-increment:n;font-size:1.08rem}
.fg-notes li:first-child{border-top:1px solid var(--line)}
.fg-notes li::before{content:counter(n,lower-roman) ".";font-family:var(--display);font-style:italic;color:var(--accent);font-size:1.15rem}
.fg-notes__foot{margin-top:1rem;font-size:.92rem;color:var(--muted)}

.fg-why .b-themes{display:grid;gap:.25rem}
.fg-why .b-themes li{font-family:var(--display);font-size:clamp(1.4rem,2.6vw,1.9rem);line-height:1.25}
.fg-why .b-themes li::before{content:"\\2766";margin-right:.6rem;color:var(--accent);font-size:.8em}
.b-themes__note{margin-top:1rem;color:var(--muted);font-size:.92rem}

.fg-req{display:grid;gap:2.5rem;align-items:start}
@media (min-width:980px){.fg-req{grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr);gap:4rem}.fg-req__side{position:sticky;top:6.5rem}}
.fg-req__side p{margin-top:1rem;color:var(--muted);max-width:40ch}
.fg-req__side .fg-btn{margin-top:1.5rem}
.fg-formcard{padding:clamp(1.25rem,3.5vw,2.25rem);background:var(--plate);border:1px solid var(--line)}
.f-input{border-width:1px;border-radius:4px;background:var(--bg)}
.f-input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--primary) 20%,transparent)}
.f-chip>span{border-width:1px;background:var(--bg)}
.f-chip input:checked+span{background:var(--primary);color:var(--on-primary);border-color:var(--primary)}
.f-submit{border-radius:999px}
.f-status{border-width:1px}

.fg-area{display:grid;gap:2.5rem}
@media (min-width:900px){.fg-area{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4rem}}
.fg-area__place{margin-top:1.25rem;font-family:var(--display);font-size:clamp(1.8rem,3.5vw,2.6rem);line-height:1.1}
.fg-area__tbc{margin-top:.75rem;color:var(--muted)}
.fg-photo{position:relative;margin-top:1.75rem;aspect-ratio:3/2;border:1px solid var(--line);padding:.6rem;background:var(--plate)}
.fg-photo .b-photo{height:100%}
.fg-photo img{filter:grayscale(.6) sepia(.25) contrast(.95);opacity:.9}
.fg-photo .stock-tag{left:1.1rem;bottom:1.1rem}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem minmax(0,1fr);gap:1rem;padding:.9rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:1px solid var(--line)}
.facts dt{font-family:var(--body);font-weight:600;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding-top:.3rem}
.facts dd{margin:0}
.b-visit__pending{display:grid;gap:.35rem;margin-top:1rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.45rem;margin-top:1.25rem;font-weight:600}

.faq details{border-top-width:1px}
.faq details:last-child{border-bottom-width:1px}
.faq summary{font-family:var(--display);font-weight:600;font-size:1.25rem}

.b-ft{background:var(--band);color:var(--on-band);padding:3rem 0}
.b-ft__name{font-family:var(--display);font-weight:600;font-size:1.8rem}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.4rem 2rem;margin-top:.6rem;color:var(--band-muted)}
.b-ft__row a{color:var(--on-band)}
.legal{margin-top:1.5rem;color:var(--band-muted);font-size:.88rem}
.stock-credits{color:var(--band-muted)}
.callbar{font-weight:600}
@media (max-width:479.98px){.b-brand{max-width:80vw}}
`;

const GRAIN = "<svg class=\"fg-grain\" aria-hidden=\"true\" focusable=\"false\"><filter id=\"fg-noise\"><feTurbulence type=\"fractalNoise\" baseFrequency=\".9\" numOctaves=\"2\" stitchTiles=\"stitch\"/><feColorMatrix type=\"saturate\" values=\"0\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(#fg-noise)\"/></svg>";

function render(ctx) {
  const t = ctx.t;
  const mirror = ctx.variants.hero === "mirror";
  const estimate = ctx.kind === "estimate";
  const verbPair = estimate ? ["Request an estimate", "Pedir presupuesto"] : ["Request a visit", "Pedir una visita"];
  const verb = ctx.copyOr("ctaPrimary", verbPair);
  const req = (cls = "fg-btn") => `<a class="${cls}" href="#${REQUEST_ID}">${verb}${icon("arrow")}</a>`;

  const header = siteHeader(ctx, {
    cta: verbPair,
    nav: [
      ...(ctx.services.length ? [{ href: "#seeing", label: ["What are you seeing", "Qué está viendo"] }] : []),
      { href: "#notes", label: ["Before you call", "Antes de llamar"] },
      { href: "#area", label: ["Area", "Zona"] },
    ],
  });

  const copy = `<div><p class="fg-kicker fg-sc"><b>${ctx.name}</b><span>${ctx.categoryT}</span><span>${esc(ctx.cityState || ctx.placeRaw)}</span></p><h1 class="fg-h1">${ctx.copyOr("headline", ctx.promise)}</h1><p class="fg-sub">${ctx.about || t("Tell them what you are seeing. A calm, clear answer is the first step.", "Cuénteles qué está viendo. Una respuesta clara y tranquila es el primer paso.")}</p><div class="fg-ctas">${callButton(ctx, { cls: "fg-btn", label: ["Call", "Llamar"] })}${req(ctx.tel ? "fg-btn fg-btn--line" : "fg-btn")}</div>${ratingProof(ctx, "chip")}</div>`;
  const hero = `<section class="fg-hero fg-hero--${mirror ? "mirror" : "plate"}" id="top"><div class="wrap fg-hero__grid">${copy}${plateSvg(ctx, "I")}</div></section>`;

  const strip = `<section class="fg-strip" aria-label="Google rating"><div class="wrap fg-strip__in">${ratingProof(ctx, "strip")}<p>${t(`Field notes from ${ctx.cityRaw || "the area"}: what customers say on Google.`, `Notas de campo de ${ctx.cityRaw || "la zona"}: lo que dicen los clientes en Google.`)}</p></div></section>`;

  const tiles = ctx.services.length
    ? `<section class="fg-sec" id="seeing"><div class="wrap"><div class="fg-head"><h2 class="fg-h2">${t("What are you", "¿Qué está")} <em>${t("seeing?", "viendo?")}</em></h2><p class="fg-lede">${t("Find the closest match. Each one opens the request with the details that help.", "Busque lo más parecido. Cada uno lleva a la solicitud con los detalles que ayudan.")}</p></div><ul class="fg-tiles">${ctx.services.map((s, i) => { const b = blurb(ctx, s); return `<li class="rv"><a class="fg-tile" href="#${REQUEST_ID}"><span class="fg-tile__art">${glyph(ctx, s)}<span>${t(`fig. ${i + 1}`, `fig. ${i + 1}`)}</span></span><span><h3>${esc(s)}</h3><p>${t(b[0], b[1])}</p><span class="fg-sc">${t("Ask about this", "Preguntar")}</span></span></a></li>`; }).join("")}</ul>${servicesConfirm(ctx)}</div></section>`
    : "";

  const steps = stepsFor(ctx);
  const how = `<section class="fg-sec fg-sec--alt"><div class="wrap"><div class="fg-head"><h2 class="fg-h2">${t("How it", "Cómo")} <em>${t("works", "funciona")}</em></h2><p class="fg-lede">${t("The usual order of things. Details to confirm with the owner.", "El orden de siempre. Detalles por confirmar con el dueño.")}</p></div><ol class="fg-steps">${steps.map((s, i) => `<li class="rv"><span class="step-n">${t(`Step ${["one", "two", "three", "four", "five"][i]}`, `Paso ${["uno", "dos", "tres", "cuatro", "cinco"][i]}`)}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  const notes = NOTES[ctx.categoryKey] || NOTES["pest-control"];
  const noteSec = `<section class="fg-sec" id="notes"><div class="wrap fg-notes"><div class="fg-head"><h2 class="fg-h2">${t("What to note", "Qué anotar")} <em>${t("before you call", "antes de llamar")}</em></h2><p class="fg-lede">${t("A few observations make the first conversation quicker and clearer.", "Unas observaciones hacen la primera plática más rápida y clara.")}</p></div><div><ol>${notes.map((n) => `<li class="rv">${t(n[0], n[1])}</li>`).join("")}</ol><p class="fg-notes__foot">${t("General guidance, not instructions from the business. If anything feels unsafe, keep your distance and call.", "Guía general, no instrucciones del negocio. Si algo se siente peligroso, aléjese y llame.")}</p></div></div></section>`;

  const themes = themesBlock(ctx);
  const why = themes ? `<section class="fg-sec fg-sec--alt fg-why"><div class="wrap fg-notes"><div class="fg-head"><h2 class="fg-h2">${t("Why customers", "Por qué llaman")} <em>${t("call", "los clientes")}</em></h2></div><div>${themes}</div></div></section>` : "";

  const form = formHeading(ctx);
  const request = `<section class="fg-sec ${themes ? "" : "fg-sec--alt"}" id="${REQUEST_ID}"><div class="wrap fg-req"><div class="fg-req__side"><h2 class="fg-h2">${form.title}</h2><p>${form.intro}</p>${callButton(ctx, { cls: "fg-btn fg-btn--line", label: ["Or call", "O llame al"] })}</div><div class="fg-formcard">${ctx.form}</div></div></section>`;

  const photo = ctx.photos.next((p) => /yard|living|hedge/.test(p.id));
  const photoHtml = photo ? `<div class="fg-photo">${ctx.photos.img(photo, { sizes: "(min-width: 900px) 45vw, 100vw", width: 1200 })}<span class="stock-tag">${t("Stock photo", "Foto de archivo")}</span></div>` : "";
  const area = `<section class="fg-sec ${themes ? "fg-sec--alt" : ""}" id="area"><div class="wrap fg-area"><div><h2 class="fg-h2">${t("Service", "Zona de")} <em>${t("area", "servicio")}</em></h2><p class="fg-area__place">${esc(ctx.placeRaw)}</p><p class="fg-area__tbc">${t("The towns they cover are to confirm with the owner.", "Las zonas que cubren están por confirmar con el dueño.")}</p>${photoHtml}</div>${visitDetails(ctx)}</div></section>`;

  const faq = `<section class="fg-sec" id="faq"><div class="wrap fg-notes"><div class="fg-head"><h2 class="fg-h2">${t("Common", "Preguntas")} <em>${t("questions", "comunes")}</em></h2></div>${faqBlock(ctx)}</div></section>`;

  return {
    css: CSS,
    body: `${GRAIN}${header}<main>${hero}${strip}${tiles}${how}${noteSec}${why}${request}${area}${faq}</main>${siteFooter(ctx)}`,
  };
}

export const direction = {
  key: "hs-field-guide",
  label: "Field guide",
  status: "implemented",
  suits: ["pest-control", "septic", "appliance-repair", "tree-service"],
  keywords: ["knowledgeable", "guide", "naturalist", "curious"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,500;0,600;1,400&family=Public+Sans:wght@400;500;600&display=swap",
  palettes: PALETTES,
  variants: { hero: ["plate", "mirror"], services: ["tiles"], proof: ["strip"] },
  imagery: { photos: true, people: ["none"], heroPeople: ["none"], heroPrefer: /yard|living/ },
  callbar: "call",
  render,
};
