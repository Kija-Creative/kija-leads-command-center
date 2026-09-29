// Outdoor living (research/design-home-contractor.md, contractors 3). Airy,
// aspirational and seasonal, the way the best landscape, pool and design
// build sites sell a way of spending an evening outside. A large 32px frame
// holds a layered landscape drawn per trade (or a stock photo), the headline
// is a soft display serif, and "Plan my project" leads to a planner: project,
// rough size and timing as chips with progress dots, then contact fields.
// Services sit in organic blob masks, the ideas gallery is labeled Ideas and
// never "our work", and the process follows a curving path.

import {
  callButton,
  faqBlock,
  formHeading,
  gallery,
  ratingProof,
  REQUEST_ID,
  servicesConfirm,
  siteFooter,
  siteHeader,
  themesBlock,
  visitDetails,
} from "../blocks.js";
import { esc, icon } from "../shared.js";
import { ctGlyph } from "./ct-local-crew.js";

const PALETTES = [
  { key: "outdoor-sage", name: "Sage and sand", vars: { bg: "#f5f3ec", surface: "#ffffff", ink: "#26301f", muted: "#5f6657", line: "#dfdccf", primary: "#3f5a36", "on-primary": "#ffffff", accent: "#d8ec8f", "accent-2": "#b9c9a0", sky: "#e4ecd9", hill1: "#c9d8b2", hill2: "#9fb88a", hill3: "#6f8f5e", hill4: "#3f5a36", water: "#b8d8d8", band: "#3f5a36", "on-band": "#f5f3ec", "band-muted": "#cdd7c2", season: "#d8ec8f", season2: "#c9a86a", season3: "#9fb88a", season4: "#3f5a36" } },
  { key: "outdoor-pool", name: "Pool blue", vars: { bg: "#f2f8f9", surface: "#ffffff", ink: "#0f2436", muted: "#4f6676", line: "#d5e6ea", primary: "#1f6f8b", "on-primary": "#ffffff", accent: "#7fd1d9", "accent-2": "#c4e7eb", sky: "#e2f1f4", hill1: "#cfe6df", hill2: "#a6cfc7", hill3: "#6fa9a8", hill4: "#1f6f8b", water: "#7fd1d9", band: "#0f2436", "on-band": "#f2f8f9", "band-muted": "#aac2d0", season: "#7fd1d9", season2: "#f1d8a8", season3: "#a6cfc7", season4: "#1f6f8b" } },
  { key: "outdoor-autumn", name: "Autumn canopy", vars: { bg: "#f7f1e8", surface: "#fffdf8", ink: "#2b1f14", muted: "#65564a", line: "#e7dccb", primary: "#8a3b12", "on-primary": "#ffffff", accent: "#c9a227", "accent-2": "#e7c9a0", sky: "#f3e6d3", hill1: "#e3c79a", hill2: "#c9954f", hill3: "#8a5a2b", hill4: "#33533a", water: "#b7cdc2", band: "#33533a", "on-band": "#f7f1e8", "band-muted": "#c9d3c6", season: "#c9a227", season2: "#8a3b12", season3: "#e3c79a", season4: "#33533a" } },
];

// Layered scenes, 1200 by 520, drawn back to front.
const SCENES = {
  landscaping: `<rect width="1200" height="520" class="ol-sky"/><circle cx="930" cy="130" r="64" class="ol-sun"/><path class="ol-l1" d="M0 300C200 230 360 260 560 220s420-60 640 10V520H0z"/><path class="ol-l2" d="M0 360c180-50 380-20 560-50s380-70 640-20V520H0z"/><g class="ol-l3">${[140, 230, 980, 1060].map((x, i) => `<ellipse cx="${x}" cy="${330 - (i % 2) * 18}" rx="${38 + (i % 2) * 10}" ry="${58 + (i % 2) * 12}"/><rect x="${x - 3}" y="${370 - (i % 2) * 18}" width="6" height="40" rx="2"/>`).join("")}</g><path class="ol-l3" d="M0 420c220-40 460-10 700-30s360-30 500-10V520H0z"/><path class="ol-path" d="M520 520c30-60 110-90 180-110"/><path class="ol-l4" d="M0 470c260-20 520 0 760-10s320-10 440 0V520H0z"/>`,
  pools: `<rect width="1200" height="520" class="ol-sky"/><circle cx="210" cy="120" r="58" class="ol-sun"/><path class="ol-l1" d="M0 260c220-40 440-20 640-40s380-30 560 0V520H0z"/><rect x="0" y="300" width="1200" height="40" class="ol-l2"/><path class="ol-water" d="M60 350h1080l40 120H20z"/><g class="ol-ripple">${[372, 396, 420, 444].map((y) => `<path d="M${120 + (y % 3) * 40} ${y}c40-8 80 8 120 0s80-8 120 0M${620 + (y % 2) * 60} ${y + 6}c40-8 80 8 120 0s80-8 120 0"/>`).join("")}</g><path class="ol-l4" d="M0 470h1200v50H0z"/><g class="ol-l3"><ellipse cx="1060" cy="250" rx="46" ry="74"/><ellipse cx="1130" cy="270" rx="34" ry="56"/></g>`,
  "tree-service": `<rect width="1200" height="520" class="ol-sky"/><path class="ol-l1" d="M0 330c240-40 480-10 700-30s340-20 500 0V520H0z"/><g class="ol-l3"><circle cx="560" cy="200" r="130"/><circle cx="450" cy="250" r="90"/><circle cx="680" cy="250" r="96"/></g><path class="ol-trunk" d="M560 470V260M560 330l-60-50M560 360l70-60"/><g class="ol-l2"><circle cx="160" cy="300" r="70"/><circle cx="1030" cy="290" r="80"/></g><path class="ol-trunk ol-trunk--sm" d="M160 470V330M1030 470V330"/><path class="ol-l4" d="M0 460c300-20 600 0 900-10s220 0 300 0V520H0z"/>`,
  painting: `<rect width="1200" height="520" class="ol-sky"/><g transform="translate(600 470)">${["season4", "hill3", "hill2", "season2", "accent", "season3", "hill1"].map((c, i) => `<rect x="-40" y="-400" width="80" height="400" rx="12" transform="rotate(${-54 + i * 18})" style="fill:var(--${c})" class="ol-swatch"/>`).join("")}<circle r="22" class="ol-pin"/></g>`,
  fencing: `<rect width="1200" height="520" class="ol-sky"/><circle cx="960" cy="120" r="56" class="ol-sun"/><path class="ol-l1" d="M0 280c240-40 480-20 700-40s340-30 500 0V520H0z"/><path class="ol-l2" d="M0 350c260-30 520-10 760-30s300-20 440 0V520H0z"/><g class="ol-fence">${Array.from({ length: 22 }, (_, i) => `<rect x="${30 + i * 54}" y="${330 - Math.round(Math.sin(i / 3) * 10)}" width="10" height="80" rx="2"/>`).join("")}<path d="M20 350c380-20 780-20 1160-4M20 380c380-20 780-20 1160-4"/></g><path class="ol-l4" d="M0 440c300-20 600 0 900-10s220 0 300 0V520H0z"/>`,
};

const CAPTION = ["Illustration", "Ilustración"];

// Size choices in the trade's own units, as rough ranges without numbers.
const SIZES = {
  landscaping: [["A bed or two", "Una o dos jardineras"], ["Front or back yard", "Patio delantero o trasero"], ["The whole property", "Todo el terreno"]],
  pools: [["Repair or refresh", "Reparar o renovar"], ["A new pool", "Una alberca nueva"], ["Pool and backyard", "Alberca y patio"]],
  "tree-service": [["One tree", "Un árbol"], ["A few trees", "Unos árboles"], ["A lot or a whole yard", "Un lote o todo el patio"]],
  painting: [["One room or a door", "Un cuarto o una puerta"], ["Several rooms", "Varios cuartos"], ["Whole house, inside or out", "Toda la casa, adentro o afuera"]],
  fencing: [["A repair or a gate", "Una reparación o un portón"], ["One side of the yard", "Un lado del patio"], ["The whole yard", "Todo el patio"]],
};

function season(ctx) {
  const m = ctx.now.getUTCMonth();
  if (m >= 2 && m <= 4) return ["Spring", "Primavera"];
  if (m >= 5 && m <= 7) return ["Summer", "Verano"];
  if (m >= 8 && m <= 10) return ["Fall", "Otoño"];
  return ["Winter", "Invierno"];
}

const PROCESS = [
  [["Walk the site", "Recorrer el lugar"], ["Look at the space together, the sun, the slope and how you use it.", "Ver el espacio juntos, el sol, la pendiente y cómo lo usa."]],
  [["Shape the plan", "Dar forma al plan"], ["Options for layout and materials, with a scope you can react to.", "Opciones de diseño y materiales, con un alcance para comentar."]],
  [["Price and schedule", "Precio y agenda"], ["A written estimate and a start date that suits the season.", "Un presupuesto por escrito y una fecha que vaya con la temporada."]],
  [["Build and enjoy", "Construir y disfrutar"], ["The work gets done, then a walk through before it is yours.", "Se hace el trabajo y luego un recorrido antes de entregarlo."]],
];

const BLOBS = [
  "62% 38% 55% 45% / 48% 58% 42% 52%",
  "44% 56% 38% 62% / 58% 42% 58% 42%",
  "55% 45% 62% 38% / 40% 55% 45% 60%",
  "38% 62% 50% 50% / 62% 38% 62% 38%",
];

const CSS = `
:root{--display:"Gilda Display",Georgia,serif;--body:"Figtree",system-ui,sans-serif;--radius:14px;--btn-radius:999px;--chip-radius:999px;--max:1220px;--ease:cubic-bezier(.22,1,.36,1);--field:var(--bg);--field-line:var(--line);--star:var(--primary);--lang-fg:var(--ink);--lang-on:var(--bg)}
body{font-size:1.0625rem;line-height:1.65}
.ol-eyebrow{font-weight:600;font-size:.82rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}

.b-hd{position:sticky;top:0;z-index:10;background:color-mix(in oklab,var(--bg) 92%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.b-hd__in{display:flex;align-items:center;gap:1.25rem;min-height:4.5rem}
.b-brand{margin-right:auto;font-family:var(--display);font-size:1.5rem;line-height:1.1;text-decoration:none;max-width:55vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.b-nav{display:none;gap:1.75rem;font-weight:500}
.b-nav a{text-decoration:none;color:var(--muted)}
.b-nav a:hover{color:var(--ink)}
@media (min-width:1040px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:1rem}
.b-hd__tel{display:none;align-items:center;gap:.4rem;font-weight:600;text-decoration:none}
@media (min-width:740px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.75rem;padding:0 1.25rem;border-radius:999px;background:var(--primary);color:var(--on-primary);font-weight:600;text-decoration:none}
.ol-strip{display:flex;height:6px}
.ol-strip i{flex:1}
.ol-strip i:nth-child(1){background:var(--season)}
.ol-strip i:nth-child(2){background:var(--season2)}
.ol-strip i:nth-child(3){background:var(--season3)}
.ol-strip i:nth-child(4){background:var(--season4)}
.ol-swatches{display:flex;gap:0;overflow-x:auto;scrollbar-width:none}
.ol-swatches a{flex:1 0 auto;display:flex;align-items:center;justify-content:center;min-height:2.4rem;padding:0 1rem;font-size:.85rem;font-weight:600;text-decoration:none;color:var(--ink)}
.ol-swatches a:nth-child(1){background:var(--season)}
.ol-swatches a:nth-child(2){background:var(--accent-2)}
.ol-swatches a:nth-child(3){background:var(--season3)}
.ol-swatches a:nth-child(4){background:var(--season4);color:var(--on-primary)}
.ol-swatches a:hover{text-decoration:underline;text-underline-offset:.3em}

.ol-hero{padding:clamp(2.5rem,6vw,4.5rem) 0 clamp(2rem,4vw,3rem)}
.ol-hero__top{display:grid;gap:1.5rem 3rem;align-items:end}
@media (min-width:960px){.ol-hero__top{grid-template-columns:minmax(0,1.3fr) minmax(0,.7fr)}}
.ol-h1{margin-top:1rem;font-family:var(--display);font-weight:400;font-size:clamp(2.6rem,5.6vw,4.8rem);line-height:1.05;letter-spacing:-.01em;max-width:15ch}
.ol-sub{color:var(--muted);font-size:1.15rem;max-width:34ch}
.ol-ctas{display:flex;flex-wrap:wrap;gap:.75rem 1.25rem;align-items:center;margin-top:1.5rem}
.ol-btn{display:inline-flex;align-items:center;gap:.6rem;min-height:3.3rem;padding:0 1.5rem;border-radius:999px;background:var(--primary);color:var(--on-primary);font-weight:600;text-decoration:none;transition:transform .35s var(--ease),box-shadow .35s var(--ease)}
.ol-btn:hover{transform:translateY(-2px);box-shadow:0 12px 24px -16px var(--primary)}
.ol-link{display:inline-flex;align-items:center;gap:.45rem;font-weight:600;text-underline-offset:.3em}
.ol-frame{position:relative;margin-top:clamp(2rem,4vw,3rem);border-radius:32px;overflow:hidden;background:var(--sky);aspect-ratio:1200/520}
@media (max-width:759.98px){.ol-frame{aspect-ratio:4/3;border-radius:24px}}
.ol-frame>svg{position:absolute;inset:0;width:100%;height:100%}
.ol-frame .b-photo,.ol-frame>img{position:absolute;inset:0;height:100%;width:100%}
.ol-frame__tag{position:absolute;left:1rem;bottom:1rem;padding:.35rem .8rem;border-radius:999px;background:color-mix(in oklab,var(--surface) 88%,transparent);font-size:.82rem;font-weight:500}
.ol-frame .b-rating{position:absolute;right:1rem;top:1rem;display:flex;align-items:center;gap:.5rem;padding:.55rem 1rem;border-radius:999px;background:var(--surface);box-shadow:0 10px 30px -16px rgb(0 0 0 / .35);font-size:.92rem}
.ol-frame .b-rating__num{font-weight:700}
.ol-frame .stars{width:5.25rem;height:1.05rem}
.ol-sky{fill:var(--sky)}
.ol-sun{fill:var(--accent);opacity:.85}
.ol-l1,.ol-l1 *{fill:var(--hill1)}
.ol-l2,.ol-l2 *{fill:var(--hill2)}
.ol-l3,.ol-l3 *{fill:var(--hill3)}
.ol-l4{fill:var(--hill4)}
.ol-water{fill:var(--water)}
.ol-ripple path{fill:none;stroke:var(--surface);stroke-width:3;stroke-linecap:round;opacity:.8}
.ol-path{fill:none;stroke:var(--accent-2);stroke-width:26;stroke-linecap:round}
.ol-trunk{fill:none;stroke:var(--hill4);stroke-width:22;stroke-linecap:round}
.ol-trunk--sm{stroke-width:12}
.ol-fence rect{fill:var(--surface)}
.ol-fence path{fill:none;stroke:var(--surface);stroke-width:8}
.ol-swatch{stroke:var(--surface);stroke-width:4}
.ol-pin{fill:var(--surface)}

.ol-proof{padding:1.5rem 0 clamp(3rem,6vw,4.5rem)}
.ol-proof__in{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 2.5rem;padding:1.25rem 1.5rem;border-radius:24px;background:var(--surface);border:1px solid var(--line)}
.ol-proof .b-rating{display:flex;align-items:center;gap:1rem}
.ol-proof .b-rating__num{font-family:var(--display);font-size:3rem;line-height:1}
.ol-proof .b-rating__side{display:grid;gap:.2rem}
.ol-proof .b-rating__count{font-weight:600}
.ol-proof p{color:var(--muted);max-width:42ch}

.ol-sec{padding:clamp(4rem,8vw,6.5rem) 0}
.ol-sec--tint{background:var(--surface)}
.ol-head{display:grid;gap:.9rem;max-width:44rem;margin-bottom:2.75rem}
.ol-h2{font-family:var(--display);font-weight:400;font-size:clamp(2.2rem,4.6vw,3.6rem);line-height:1.05}
.ol-lede{color:var(--muted);max-width:54ch}

.ol-cards{display:grid;gap:2rem 1.5rem;grid-template-columns:repeat(auto-fill,minmax(min(100%,15rem),1fr))}
.ol-card{display:grid;gap:1rem;justify-items:start;text-decoration:none}
.ol-blob{position:relative;display:grid;place-items:center;width:100%;aspect-ratio:1;overflow:hidden;background:var(--accent-2);color:var(--ink);transition:border-radius .8s var(--ease)}
.ol-card:hover .ol-blob{border-radius:50% !important}
.ol-blob .hs-glyph{width:34%;height:34%}
.ol-blob img{position:absolute;inset:0;width:100%;height:100%}
.ol-card:nth-child(3n+2) .ol-blob{background:color-mix(in oklab,var(--accent) 55%,var(--surface))}
.ol-card:nth-child(3n) .ol-blob{background:var(--hill1)}
.ol-card h3{font-family:var(--display);font-weight:400;font-size:1.6rem;line-height:1.1}
.ol-card span.ol-link{font-size:.95rem;color:var(--primary)}
.b-svc-confirm{margin-top:2rem;color:var(--muted);font-size:.95rem}
.svc-note{margin-top:.3rem;color:var(--muted);font-size:.92rem}

.ol-planner{display:grid;gap:2.5rem;align-items:start}
@media (min-width:980px){.ol-planner{grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr);gap:4rem}.ol-planner__side{position:sticky;top:7rem}}
.ol-dots{display:flex;gap:.5rem;margin-top:1.5rem}
.ol-dots i{width:.75rem;height:.75rem;border-radius:50%;background:var(--line);transition:background-color .3s,transform .3s var(--ease)}
#${REQUEST_ID}:has([name="project"]:checked) .ol-dots i:nth-child(1),#${REQUEST_ID}:has([name="scale"]:checked) .ol-dots i:nth-child(2),#${REQUEST_ID}:has([name="timeline"]:checked) .ol-dots i:nth-child(3),#${REQUEST_ID}:has(#rq-name:not(:placeholder-shown)) .ol-dots i:nth-child(4){background:var(--primary);transform:scale(1.15)}
.ol-dots__lbl{margin-top:.6rem;font-size:.88rem;color:var(--muted)}
.ol-card--form{padding:clamp(1.25rem,3.5vw,2.5rem);border-radius:32px;background:var(--surface);border:1px solid var(--line)}
.ol-card--form .f-field:has(#rq-service),.ol-card--form .f-field:has(#rq-size){display:none}
.ol-card--form fieldset legend{display:flex;align-items:center;gap:.6rem;font-family:var(--display);font-weight:400;font-size:1.35rem}
.ol-card--form fieldset:has([name="project"]) legend::before,.ol-card--form fieldset:has([name="scale"]) legend::before,.ol-card--form fieldset:has([name="timeline"]) legend::before{display:grid;place-items:center;width:1.9rem;height:1.9rem;border-radius:50%;background:var(--accent-2);font-family:var(--body);font-size:.9rem;font-weight:700}
.ol-card--form fieldset:has([name="project"]) legend::before{content:"1"}
.ol-card--form fieldset:has([name="scale"]) legend::before{content:"2"}
.ol-card--form fieldset:has([name="timeline"]) legend::before{content:"3"}
.ol-contact{display:flex;align-items:center;gap:.6rem;font-family:var(--display);font-size:1.35rem;padding-top:1rem;border-top:1px solid var(--line)}
.ol-contact::before{content:"4";display:grid;place-items:center;width:1.9rem;height:1.9rem;border-radius:50%;background:var(--accent-2);font-family:var(--body);font-size:.9rem;font-weight:700}
.f-input{border-width:1px;border-radius:14px}
.f-input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 4px color-mix(in oklab,var(--primary) 16%,transparent)}
.f-chip>span{border-width:1px;background:var(--bg);padding:.7rem 1.1rem}
.f-chip input:checked+span{background:var(--primary);color:var(--on-primary);border-color:var(--primary)}
.f-drop{border-radius:20px;border-width:1.5px}
.f-submit{border-radius:999px;min-height:3.4rem;padding-inline:1.8rem}
.f-status{border-width:1px;border-radius:16px}

.ol-ideas .b-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
@media (min-width:860px){.ol-ideas .b-gallery{grid-template-columns:1.3fr 1fr 1fr;grid-template-rows:14rem 14rem}.ol-ideas .b-gallery__tile:first-child{grid-row:span 2}}
.ol-ideas .b-gallery__tile{border-radius:28px;min-height:12rem}
.ol-ideas .b-gallery__tile img{height:100%}
.ol-ideas .b-gallery__empty{display:grid;place-items:center;border:1.5px dashed var(--line);background:var(--bg);color:var(--muted);font-family:var(--display);font-size:1.2rem;text-align:center;padding:1rem}
.ol-ideas__note{margin-top:1rem;color:var(--muted);font-size:.92rem}

.ol-path-wrap{position:relative}
.ol-curve{display:none}
@media (min-width:900px){.ol-curve{display:block;width:100%;height:120px}.ol-curve path{fill:none;stroke:var(--primary);stroke-width:2;stroke-dasharray:2 10;stroke-linecap:round}.ol-curve circle{fill:var(--surface);stroke:var(--primary);stroke-width:3}}
.ol-stops{display:grid;gap:1.75rem}
@media (min-width:900px){.ol-stops{grid-template-columns:repeat(4,minmax(0,1fr));gap:2rem;margin-top:-1rem}}
.ol-stops li{display:grid;gap:.4rem}
.ol-stops .step-n{font-family:var(--display);font-size:2.4rem;line-height:1;color:var(--primary)}
.ol-stops h3{font-family:var(--display);font-weight:400;font-size:1.5rem;line-height:1.15}
.ol-stops p{color:var(--muted)}
@media (min-width:900px){.ol-stops li:nth-child(even){padding-top:2.5rem}}

.ol-why{display:grid;gap:2rem}
@media (min-width:900px){.ol-why{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}}
.ol-why .b-themes{display:flex;flex-wrap:wrap;gap:.75rem}
.ol-why .b-themes li{padding:.9rem 1.3rem;border-radius:999px;background:var(--bg);font-family:var(--display);font-size:1.3rem;line-height:1.2}
.b-themes__note{margin-top:1rem;color:var(--muted);font-size:.92rem}

.ol-area{display:grid;gap:2.5rem}
@media (min-width:900px){.ol-area{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4rem}}
.ol-area__place{margin-top:1rem;font-family:var(--display);font-size:clamp(1.8rem,3.5vw,2.6rem);line-height:1.1}
.ol-area__tbc{margin-top:.6rem;color:var(--muted)}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem minmax(0,1fr);gap:1rem;padding:.9rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:1px solid var(--line)}
.facts dt{color:var(--muted)}
.facts dd{margin:0;font-weight:600}
.b-visit__pending{display:grid;gap:.35rem;margin-top:1rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.45rem;margin-top:1.25rem;font-weight:600}

.faq details{border-top-width:1px}
.faq details:last-child{border-bottom-width:1px}
.faq summary{font-family:var(--display);font-weight:400;font-size:1.35rem}

.ol-final{padding:0 0 clamp(4rem,8vw,6rem)}
.ol-final__card{position:relative;overflow:hidden;display:grid;gap:1.25rem;justify-items:center;text-align:center;padding:clamp(3.5rem,8vw,6rem) 1.5rem;border-radius:32px;background:var(--band);color:var(--on-band)}
.ol-final__card svg{position:absolute;left:0;right:0;bottom:0;width:100%;height:40%;opacity:.25}
.ol-final__card svg path{fill:var(--on-band)}
.ol-final__card>*:not(svg){position:relative}
.ol-final h2{font-family:var(--display);font-weight:400;font-size:clamp(2.4rem,5vw,4rem);line-height:1.05;max-width:16ch}
.ol-final .ol-btn{background:var(--on-band);color:var(--band)}
.ol-final .ol-link{color:var(--on-band)}

.b-ft{padding:3rem 0;border-top:1px solid var(--line)}
.b-ft__name{font-family:var(--display);font-size:1.8rem}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.4rem 2rem;margin-top:.5rem;color:var(--muted)}
.legal{margin-top:1.5rem;color:var(--muted);font-size:.88rem}
@media (max-width:479.98px){.b-brand{max-width:80vw}}
@media (max-width:599.98px){.ol-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:1.5rem 1rem}.ol-card h3{font-size:1.25rem}.ol-card{gap:.6rem}}
`;

function render(ctx) {
  const t = ctx.t;
  const photoHero = ctx.variants.hero === "photo";
  const consult = ["pools", "landscaping"].includes(ctx.categoryKey);
  const verbPair = ["Plan my project", "Planear mi proyecto"];
  const verb = ctx.copyOr("ctaPrimary", verbPair);
  const s = season(ctx);

  const header = siteHeader(ctx, {
    cta: consult ? ["Plan my project", "Planear"] : ["Get an estimate", "Presupuesto"],
    nav: [
      ...(ctx.services.length ? [{ href: "#services", label: ["What we do", "Qué hacemos"] }] : []),
      { href: `#${REQUEST_ID}`, label: ["Planner", "Planeador"] },
      { href: "#ideas", label: ["Ideas", "Ideas"] },
      { href: "#area", label: ["Area", "Zona"] },
    ],
  });
  const strip = ctx.categoryKey === "painting"
    ? `<nav class="ol-swatches"${ctx.i18n.aria("Sections", "Secciones")}><a href="#services">${t("Services", "Servicios")}</a><a href="#${REQUEST_ID}">${t("Planner", "Planeador")}</a><a href="#ideas">${t("Ideas", "Ideas")}</a><a href="#area">${t("Area", "Zona")}</a></nav>`
    : `<div class="ol-strip" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`;

  const pic = photoHero ? ctx.photos.hero() : null;
  const scene = SCENES[ctx.categoryKey] || SCENES.landscaping;
  const frameInner = pic
    ? `${ctx.photos.img(pic, { hero: true, sizes: "100vw", width: 1600 })}<span class="ol-frame__tag">${t("Stock photo", "Foto de archivo")}</span>`
    : `<svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" role="img"${ctx.i18n.aria(CAPTION[0], CAPTION[1])} focusable="false">${scene}</svg><span class="ol-frame__tag">${t(CAPTION[0], CAPTION[1])}</span>`;
  const hero = `<section class="ol-hero" id="top"><div class="wrap"><div class="ol-hero__top"><div><p class="ol-eyebrow">${ctx.name} · ${esc(ctx.cityState || ctx.placeRaw)}</p><h1 class="ol-h1">${ctx.copyOr("headline", ctx.promise)}</h1></div><div><p class="ol-sub">${ctx.about || t(`${s[0]} is a good time to start planning. Tell them what you have in mind.`, `${s[1]} es buen momento para empezar a planear. Cuénteles qué tiene en mente.`)}</p><div class="ol-ctas"><a class="ol-btn" href="#${REQUEST_ID}">${verb}${icon("arrow")}</a>${callButton(ctx, { cls: "ol-link", label: ["Call", "Llame al"], ico: "phone" })}</div></div></div><div class="ol-frame">${frameInner}${ratingProof(ctx, "chip")}</div></div></section>`;

  const proof = `<section class="ol-proof" aria-label="Google rating"><div class="wrap"><div class="ol-proof__in">${ratingProof(ctx, "strip")}<p>${t(`From Google reviews by customers around ${ctx.cityRaw || "the area"}.`, `De reseñas de Google de clientes de ${ctx.cityRaw || "la zona"}.`)}</p></div></div></section>`;

  const services = ctx.services.length
    ? `<section class="ol-sec ol-sec--tint" id="services"><div class="wrap"><div class="ol-head"><h2 class="ol-h2">${t("What we do", "Qué hacemos")}</h2><p class="ol-lede">${t("Pick one to start the planner, or bring an idea that does not fit a box.", "Elija uno para empezar el planeador, o traiga una idea que no quepa en una caja.")}</p></div><ul class="ol-cards">${ctx.services.map((sv, i) => { const inner = ctGlyph(ctx, sv, { stroke: 1.4 }); return `<li class="rv"><a class="ol-card" href="#${REQUEST_ID}"><span class="ol-blob" style="border-radius:${BLOBS[i % BLOBS.length]}">${inner}</span><h3>${esc(sv)}</h3><span class="ol-link">${t("Plan this", "Planear esto")}${icon("arrow")}</span></a></li>`; }).join("")}</ul>${servicesConfirm(ctx)}</div></section>`
    : "";

  // The planner: project and size chips join the estimate form's own timing,
  // photo and contact fields. Dots light up as each step is answered.
  const sizes = SIZES[ctx.categoryKey] || SIZES.landscaping;
  const chip = (name, v, pair) => `<label class="f-chip"><input type="radio" name="${name}" value="${esc(v)}"><span>${t(pair[0], pair[1])}</span></label>`;
  const projectField = ctx.services.length
    ? `<fieldset class="f-field"><legend>${t("What is the project?", "¿Cuál es el proyecto?")}</legend><div class="f-chips">${ctx.services.map((sv) => `<label class="f-chip"><input type="radio" name="project" value="${esc(sv)}"><span>${esc(sv)}</span></label>`).join("")}${chip("project", "other", ["Something else", "Otra cosa"])}</div></fieldset>`
    : "";
  const sizeField = `<fieldset class="f-field"><legend>${t("Roughly how big?", "¿Más o menos de qué tamaño?")}</legend><div class="f-chips">${sizes.map((z, i) => chip("scale", `size-${i + 1}`, z)).join("")}${chip("scale", "unsure", ["Not sure yet", "Todavía no sé"])}</div></fieldset>`;
  const formHtml = ctx.form
    .replace(/<form\b([^>]*)>/, (m) => `${m}\n${projectField}${sizeField}`)
    .replace("<div class=\"f-row\"><div class=\"f-field\"><label class=\"f-label\" for=\"rq-name\">", `<p class="ol-contact">${t("Where to reach you", "Dónde localizarle")}</p><div class="f-row"><div class="f-field"><label class="f-label" for="rq-name">`);
  const form = formHeading(ctx);
  const planner = `<section class="ol-sec" id="${REQUEST_ID}"><div class="wrap ol-planner"><div class="ol-planner__side"><p class="ol-eyebrow">${t("Project planner", "Planeador de proyecto")}</p><h2 class="ol-h2">${t("Plan my project", "Planear mi proyecto")}</h2><p class="ol-lede">${form.intro}</p><div class="ol-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div><p class="ol-dots__lbl">${t("Project, size, timing, then where to reach you.", "Proyecto, tamaño, tiempos y dónde localizarle.")}</p></div><div class="ol-card--form">${formHtml}</div></div></section>`;

  const ideas = `<section class="ol-sec ol-sec--tint ol-ideas" id="ideas"><div class="wrap"><div class="ol-head"><h2 class="ol-h2">${t("Ideas", "Ideas")}</h2><p class="ol-lede">${t("Inspiration to react to, not projects by this business. Their own work goes here.", "Inspiración para comentar, no proyectos de este negocio. Aquí va su propio trabajo.")}</p></div>${gallery(ctx, { count: 5, tag: true, sizes: "(min-width: 860px) 33vw, 50vw", width: 800, filter: (p) => p.people === "none" })}</div></section>`;

  const process = `<section class="ol-sec" id="process"><div class="wrap"><div class="ol-head"><h2 class="ol-h2">${t("From first walk to first evening outside", "Del primer recorrido a la primera tarde afuera")}</h2><p class="ol-lede">${t("How a project like this usually unfolds. Details to confirm with the owner.", "Cómo suele desarrollarse un proyecto así. Detalles por confirmar con el dueño.")}</p></div><div class="ol-path-wrap"><svg class="ol-curve" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M40 90C220 90 220 30 400 30S580 90 760 90 940 30 1160 30"/><circle cx="40" cy="90" r="9"/><circle cx="400" cy="30" r="9"/><circle cx="760" cy="90" r="9"/><circle cx="1160" cy="30" r="9"/></svg><ol class="ol-stops">${PROCESS.map((p, i) => `<li class="rv"><span class="step-n" aria-hidden="true">${i + 1}</span><h3>${t(p[0][0], p[0][1])}</h3><p>${t(p[1][0], p[1][1])}</p></li>`).join("")}</ol></div></div></section>`;

  const themes = themesBlock(ctx);
  const why = themes ? `<section class="ol-sec ol-sec--tint"><div class="wrap ol-why"><div class="ol-head"><h2 class="ol-h2">${t("Why customers call", "Por qué llaman los clientes")}</h2></div><div>${themes}</div></div></section>` : "";

  const area = `<section class="ol-sec ${themes ? "" : "ol-sec--tint"}" id="area"><div class="wrap ol-area"><div><p class="ol-eyebrow">${t("Service area", "Zona de servicio")}</p><p class="ol-area__place">${esc(ctx.placeRaw)}</p><p class="ol-area__tbc">${t("The towns they work in are to confirm with the owner.", "Las zonas donde trabajan están por confirmar con el dueño.")}</p></div>${visitDetails(ctx)}</div></section>`;

  const faq = `<section class="ol-sec" id="faq"><div class="wrap ol-why"><div class="ol-head"><h2 class="ol-h2">${t("Questions", "Preguntas")}</h2></div>${faqBlock(ctx)}</div></section>`;

  const final = `<section class="ol-final"><div class="wrap"><div class="ol-final__card"><svg viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 120C200 60 400 100 600 70s400-60 600 0V200H0z"/></svg><h2>${t("Let's plan the space you keep picturing.", "Planeemos el espacio que se imagina.")}</h2><a class="ol-btn" href="#${REQUEST_ID}">${verb}${icon("arrow")}</a>${callButton(ctx, { cls: "ol-link", label: ["Or call", "O llame al"], ico: "phone" })}</div></div></section>`;

  return {
    css: CSS,
    body: `${header}${strip}<main>${hero}${proof}${services}${planner}${ideas}${process}${why}${area}${faq}${final}</main>${siteFooter(ctx)}`,
  };
}

export const direction = {
  key: "ct-outdoor-living",
  label: "Outdoor living",
  status: "implemented",
  suits: ["landscaping", "pools", "tree-service", "painting", "fencing"],
  keywords: ["outdoor", "seasonal", "gallery", "design", "backyard"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Gilda+Display&family=Figtree:wght@400;500;600;700&display=swap",
  palettes: PALETTES,
  variants: { hero: ["scene", "photo"], services: ["blobs"], proof: ["strip"] },
  imagery: { photos: true, people: ["none", "hands"], heroPeople: ["none"], heroPrefer: /pool|yard|fence|paint/ },
  callbar: "split",
  callbarBook: ["Plan", "Planear"],
  render,
};
