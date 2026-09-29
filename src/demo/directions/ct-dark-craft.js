// Dark craft editorial (research/design-home-contractor.md, contractors 1).
// Premium, architectural, quietly confident: the way the best high end
// roofing and design build sites read like an architecture studio. A full
// bleed dark field carries a material texture drawn per trade (standing seam,
// board formed concrete, water caustics, stone coursing, a layered hillside,
// tile), one very large serif line, a letterspaced eyebrow and a single
// outline button. Inside: a serif intro statement, a numbered service index,
// one bone colored band for the process, serif numerals for the rating, and
// the phone set as a giant serif line in the footer.

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
import { stepsFor } from "../copy.js";
import { esc, icon } from "../shared.js";

const PALETTES = [
  { key: "craft-charcoal", name: "Charcoal and tan", vars: { bg: "#1f2024", surface: "#2a2c31", ink: "#f1ede6", muted: "#b9b2a6", line: "#3a3c42", primary: "#b39a7b", "on-primary": "#1f2024", accent: "#e6c152", band: "#ece7df", "on-band": "#1f2024", "band-muted": "#5d574f", "band-line": "#d3ccc1", deep: "#161719" } },
  { key: "craft-iron", name: "Iron and copper", vars: { bg: "#16181a", surface: "#212427", ink: "#f3efe9", muted: "#b5ada3", line: "#33373b", primary: "#c47a4a", "on-primary": "#16181a", accent: "#e0b98f", band: "#e9e2d8", "on-band": "#16181a", "band-muted": "#5a524a", "band-line": "#d2c9bc", deep: "#0f1112" } },
  { key: "craft-forest", name: "Forest night and brass", vars: { bg: "#151c18", surface: "#1e2822", ink: "#eef0ea", muted: "#aab3aa", line: "#2f3b33", primary: "#c8a45c", "on-primary": "#151c18", accent: "#8fb39a", band: "#e8eadf", "on-band": "#151c18", "band-muted": "#525a50", "band-line": "#cfd3c4", deep: "#0e1410" } },
];

// Material textures, one per trade, drawn in SVG so they stand alone.
const TEXTURES = {
  roofing: `<defs><linearGradient id="dc-seam" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".45" stop-color="#fff" stop-opacity=".07"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset=".56" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><pattern id="dc-p" width="90" height="10" patternUnits="userSpaceOnUse" patternTransform="skewX(-8)"><rect width="90" height="10" fill="url(#dc-seam)"/></pattern></defs><rect width="1600" height="900" fill="url(#dc-p)"/><rect width="1600" height="900" fill="url(#dc-fade)"/>`,
  concrete: `<defs><filter id="dc-grain"><feTurbulence type="fractalNoise" baseFrequency=".012 .45" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .16 0"/></filter><pattern id="dc-p" width="1600" height="120" patternUnits="userSpaceOnUse"><rect width="1600" height="118" fill="#fff" fill-opacity=".02"/><rect y="118" width="1600" height="2" fill="#000" fill-opacity=".35"/><circle cx="220" cy="60" r="3" fill="#000" fill-opacity=".35"/><circle cx="1020" cy="60" r="3" fill="#000" fill-opacity=".35"/></pattern></defs><rect width="1600" height="900" filter="url(#dc-grain)"/><rect width="1600" height="900" fill="url(#dc-p)"/><rect width="1600" height="900" fill="url(#dc-fade)"/>`,
  pools: `<defs><filter id="dc-water"><feTurbulence type="turbulence" baseFrequency=".006 .014" numOctaves="2" seed="8"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 -2.2 1.35"/></filter></defs><rect width="1600" height="900" filter="url(#dc-water)" opacity=".22"/><rect width="1600" height="900" fill="url(#dc-fade)"/>`,
  "foundation-repair": `<defs><pattern id="dc-p" width="240" height="96" patternUnits="userSpaceOnUse"><path d="M0 1h240M0 49h240M1 0v48M121 48v48M181 0v48M61 48v48" stroke="#fff" stroke-opacity=".12" stroke-width="2" fill="none"/><rect x="4" y="4" width="174" height="42" fill="#fff" fill-opacity=".025"/><rect x="64" y="52" width="54" height="42" fill="#000" fill-opacity=".12"/></pattern></defs><rect width="1600" height="900" fill="url(#dc-p)"/><rect width="1600" height="900" fill="url(#dc-fade)"/>`,
  landscaping: `<path d="M0 620C220 540 420 580 640 520s460-120 960-60V900H0z" fill="#fff" fill-opacity=".04"/><path d="M0 700C260 640 520 700 800 640s520-80 800-40V900H0z" fill="#fff" fill-opacity=".05"/><path d="M0 780c300-40 600 10 900-30s500-20 700 0V900H0z" fill="#000" fill-opacity=".2"/><g stroke="#fff" stroke-opacity=".07" fill="none">${Array.from({ length: 14 }, (_, i) => `<path d="M0 ${300 + i * 26}C300 ${260 + i * 24} 700 ${340 + i * 22} 1000 ${280 + i * 26}S1450 ${250 + i * 24} 1600 ${270 + i * 25}"/>`).join("")}</g><rect width="1600" height="900" fill="url(#dc-fade)"/>`,
  remodeling: `<defs><pattern id="dc-p" width="120" height="60" patternUnits="userSpaceOnUse"><path d="M0 1h120M0 31h120M1 0v30M61 30v30" stroke="#fff" stroke-opacity=".1" stroke-width="2" fill="none"/></pattern></defs><rect width="1600" height="900" fill="url(#dc-p)"/><rect width="1600" height="900" fill="url(#dc-fade)"/>`,
};

const FADE = "<linearGradient id=\"dc-fade\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#000\" stop-opacity=\".05\"/><stop offset=\".7\" stop-color=\"#000\" stop-opacity=\".35\"/><stop offset=\"1\" stop-color=\"#000\" stop-opacity=\".65\"/></linearGradient>";

// The texture is drawn once as a symbol; the hero and the hover swatches use it.
function textureDefs(ctx) {
  const body = TEXTURES[ctx.categoryKey] || TEXTURES.remodeling;
  return `<svg class="dc-defs" aria-hidden="true" focusable="false"><defs>${FADE}</defs><symbol id="dc-tex" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">${body}</symbol></svg>`;
}

function texture(cls = "dc-tex") {
  return `<svg class="${cls}" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><use href="#dc-tex" width="1600" height="900"/></svg>`;
}

const INTRO = {
  roofing: ["A roof is judged on the worst day of the year. The work that matters most is the part you never see: the underlayment, the flashing, every edge.", "Un techo se juzga en el peor día del año. Lo que más importa es lo que no se ve: la base, los tapajuntas, cada orilla."],
  remodeling: ["A good remodel starts long before demolition, with a plan for how the room will really be used.", "Una buena remodelación empieza mucho antes de demoler, con un plan de cómo se va a usar el cuarto de verdad."],
  pools: ["The best backyards are planned around how you want to spend an evening, then built around the water.", "Un buen patio se planea según cómo quiere pasar la tarde, y luego se construye alrededor del agua."],
  concrete: ["Concrete rewards preparation. The base, the forms and the finish decide how a slab looks years from now.", "El concreto premia la preparación. La base, las cimbras y el acabado deciden cómo se verá dentro de años."],
  "foundation-repair": ["Cracks and sticking doors are the house telling you something. The first step is understanding what.", "Las grietas y las puertas que se atoran son la casa diciéndole algo. El primer paso es entender qué."],
  landscaping: ["A landscape is a plan that grows. It starts with the site: the sun, the slope, the soil and how you use the yard.", "Un jardín es un plan que crece. Empieza con el terreno: el sol, la pendiente, la tierra y cómo usa el patio."],
};

// One sentence per service, describing the kind of work, never this business.
const LINES = [
  [/repair|leak|crack/i, ["Finding the cause first, then fixing it properly.", "Encontrar la causa primero y luego arreglarlo bien."]],
  [/replace|new construction|construction|install/i, ["Planned from the structure up, with materials chosen for the house.", "Planeado desde la estructura, con materiales escogidos para la casa."]],
  [/inspect/i, ["A careful look, with photos and a plain explanation of what was found.", "Una revisión cuidadosa, con fotos y una explicación clara."]],
  [/storm/i, ["A look after the weather, documented before anything is touched.", "Una revisión después del clima, documentada antes de tocar nada."]],
  [/gutter|drain/i, ["Moving water away from the house the way it should.", "Llevar el agua lejos de la casa como debe ser."]],
  [/kitchen/i, ["Layout, storage and light, planned around how you cook.", "Distribución, espacio y luz, planeados según cómo cocina."]],
  [/bath/i, ["Tile, fixtures and the details that hold up to water.", "Azulejo, muebles y los detalles que aguantan el agua."]],
  [/floor|tile/i, ["Surfaces that suit the room and the way it gets used.", "Superficies que van con el cuarto y con su uso."]],
  [/addition|whole home|renovation/i, ["More room, or a whole house rethought, one decision at a time.", "Más espacio, o toda la casa replanteada, una decisión a la vez."]],
  [/resurfac|remodel/i, ["New surfaces and finishes on the structure you already have.", "Superficies y acabados nuevos sobre la estructura que ya tiene."]],
  [/weekly|service|maintenance|cleanup|lawn/i, ["Regular care so it stays the way it was meant to look.", "Cuidado regular para que se mantenga como debe verse."]],
  [/equipment/i, ["Pumps, filters and heaters, diagnosed and repaired.", "Bombas, filtros y calentadores, revisados y reparados."]],
  [/design/i, ["A plan on paper first, so the yard is built once.", "Un plan en papel primero, para construir el patio una sola vez."]],
  [/sod|irrigation|hardscape/i, ["Grading, water and the built parts of the yard.", "Nivelación, riego y las partes construidas del patio."]],
  [/driveway|patio|sidewalk|slab|stamp/i, ["Excavation, base, forms and a finish that suits the house.", "Excavación, base, cimbra y un acabado que vaya con la casa."]],
  [/pier|beam|foundation/i, ["Support under the house, assessed and planned carefully.", "El soporte bajo la casa, evaluado y planeado con cuidado."]],
];

function lineFor(name) {
  const hit = LINES.find(([re]) => re.test(name));
  return hit ? hit[1] : ["Ask about scope, materials and timing.", "Pregunte por el alcance, los materiales y los tiempos."];
}

const CSS = `
:root{--display:"Gloock",Georgia,serif;--body:"Manrope",system-ui,sans-serif;--radius:2px;--btn-radius:999px;--chip-radius:999px;--max:1240px;--ease:cubic-bezier(.22,1,.36,1);--field:var(--surface);--field-line:var(--line);--star:var(--accent);--lang-fg:var(--ink);--lang-on:var(--bg)}
body{font-size:1.0625rem;line-height:1.7;font-weight:400}
.dc-eyebrow{font-family:var(--body);font-weight:600;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}

.b-hd{position:absolute;left:0;right:0;z-index:10;background:transparent;color:var(--ink)}
.b-hd__in{display:flex;align-items:center;gap:1.5rem;min-height:5rem;border-bottom:1px solid color-mix(in oklab,var(--ink) 18%,transparent)}
.b-brand{margin-right:auto;font-family:var(--display);font-size:1.4rem;line-height:1.1;text-decoration:none;max-width:55vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.b-nav{display:none;gap:2rem;font-size:.9rem;font-weight:500;letter-spacing:.02em}
.b-nav a{text-decoration:none;color:var(--muted)}
.b-nav a:hover{color:var(--ink)}
@media (min-width:1060px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:1.25rem}
.b-hd__tel{display:none;align-items:center;gap:.45rem;font-weight:500;text-decoration:none;font-variant-numeric:tabular-nums}
@media (min-width:760px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.75rem;padding:0 1.25rem;border-radius:999px;border:1px solid var(--primary);color:var(--ink);font-weight:600;font-size:.92rem;text-decoration:none;transition:background-color .3s,color .3s}
.b-hd__cta:hover{background:var(--primary);color:var(--on-primary)}

.dc-hero{position:relative;min-height:min(92vh,56rem);display:grid;align-items:end;background:var(--deep);overflow:hidden;isolation:isolate}
.dc-tex{position:absolute;inset:0;width:100%;height:100%;z-index:-1;color:var(--ink)}
.dc-tex rect[filter],.dc-tex filter+rect{fill:var(--ink)}
.dc-hero__photo{position:absolute;inset:0;z-index:-1;background:var(--primary)}
.dc-hero__photo .b-photo{height:100%;--photo-bg:var(--primary)}
.dc-hero__photo img{filter:grayscale(1) contrast(1.15) brightness(.9);mix-blend-mode:multiply}
.dc-hero__photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in oklab,var(--deep) 55%,transparent) 0%,transparent 35%,color-mix(in oklab,var(--deep) 88%,transparent) 88%)}
.dc-hero__in{padding:9rem 0 clamp(3rem,7vw,5.5rem)}
.dc-h1{margin-top:1.25rem;font-family:var(--display);font-weight:400;font-size:clamp(2.8rem,7vw,6rem);line-height:.98;letter-spacing:-.02em;max-width:16ch}
.dc-hero__row{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 2rem;margin-top:2.5rem}
.dc-out{display:inline-flex;align-items:center;gap:.75rem;min-height:3.4rem;padding:0 1.6rem;border-radius:999px;border:1px solid var(--primary);color:var(--ink);font-weight:600;text-decoration:none;transition:background-color .35s var(--ease),color .35s var(--ease)}
.dc-out:hover{background:var(--primary);color:var(--on-primary)}
.dc-out .ico{transition:transform .35s var(--ease)}
.dc-out:hover .ico{transform:translateX(4px)}
.dc-tel{font-weight:500;text-decoration:none;font-variant-numeric:tabular-nums;border-bottom:1px solid var(--line);padding-bottom:.15rem}
.dc-hero .b-rating{display:inline-flex;align-items:center;gap:.6rem;margin-left:auto;color:var(--muted);font-size:.92rem}
.dc-hero .b-rating__num{font-family:var(--display);font-size:1.5rem;color:var(--ink)}
.dc-hero .stars{width:5.5rem;height:1.1rem}
@media (max-width:759.98px){.dc-hero .b-rating{margin-left:0}}
.dc-hero .stock-tag{left:auto;right:1rem;bottom:1rem}

.dc-sec{padding:clamp(4.5rem,10vw,8.5rem) 0}
.dc-sec--surface{background:var(--surface)}
.dc-intro p{font-family:var(--display);font-size:clamp(1.8rem,3.8vw,3.1rem);line-height:1.18;letter-spacing:-.01em;max-width:28ch}
.dc-intro p em{font-style:normal;color:var(--primary)}
.dc-intro .dc-eyebrow{display:block;margin-bottom:1.75rem}
.dc-head{display:grid;gap:1rem;margin-bottom:3rem}
@media (min-width:900px){.dc-head{grid-template-columns:minmax(0,1fr) minmax(0,24rem);align-items:end}}
.dc-h2{font-family:var(--display);font-weight:400;font-size:clamp(2.2rem,4.6vw,3.8rem);line-height:1.02;letter-spacing:-.015em}
.dc-lede{color:var(--muted);max-width:48ch}
.dc-h2--gap{margin-top:1rem}
.dc-proof__fig{margin-top:1.5rem}
.dc-intro p.dc-about{margin-top:2rem;font-family:var(--body);font-size:1.1rem;line-height:1.7;max-width:56ch}
.dc-defs{position:absolute;width:0;height:0;overflow:hidden}

.dc-index{border-top:1px solid var(--line)}
.dc-index li{position:relative;display:grid;grid-template-columns:3.5rem minmax(0,1fr);gap:.4rem 1.5rem;padding:1.6rem 0;border-bottom:1px solid var(--line)}
@media (min-width:900px){.dc-index li{grid-template-columns:5rem minmax(0,1.1fr) minmax(0,1fr) 6rem;align-items:center}}
.dc-index .dc-n{font-family:var(--display);font-size:1.1rem;color:var(--primary)}
.dc-index h3{font-family:var(--display);font-weight:400;font-size:clamp(1.6rem,3vw,2.4rem);line-height:1.1}
.dc-index p{color:var(--muted);grid-column:2}
@media (min-width:900px){.dc-index p{grid-column:auto}}
.dc-swatch{display:none}
@media (min-width:900px){.dc-swatch{display:block;justify-self:end;width:5rem;height:3.5rem;border-radius:2px;overflow:hidden;background:var(--deep);opacity:0;transform:translateX(-8px);transition:opacity .4s var(--ease),transform .4s var(--ease)}.dc-swatch svg{width:100%;height:100%}.dc-index li:hover .dc-swatch{opacity:1;transform:none}}
.dc-index li::after{content:"";position:absolute;left:0;bottom:-1px;height:1px;width:0;background:var(--primary);transition:width .6s var(--ease)}
.dc-index li:hover::after{width:100%}
.b-svc-confirm{margin-top:1.75rem;color:var(--muted);font-size:.92rem}
.svc-note{margin-top:.3rem;color:var(--muted);font-size:.9rem}

.dc-wide{position:relative;margin:0;aspect-ratio:21/9;background:var(--primary);overflow:hidden}
@media (max-width:759.98px){.dc-wide{aspect-ratio:4/3}}
.dc-wide .b-photo{height:100%;--photo-bg:var(--primary)}
.dc-wide img{filter:grayscale(1) contrast(1.2);mix-blend-mode:multiply}
.dc-wide .stock-tag{left:auto;right:1rem}

.dc-bone{background:var(--band);color:var(--on-band)}
.dc-bone .dc-eyebrow,.dc-bone .dc-lede{color:var(--band-muted)}
.dc-steps{display:grid;gap:2rem;border-top:1px solid var(--band-line);padding-top:2rem}
@media (min-width:860px){.dc-steps{grid-template-columns:repeat(4,minmax(0,1fr));gap:2.5rem}}
.dc-steps .step-n{font-family:var(--display);font-size:3.5rem;line-height:1;color:var(--on-band)}
.dc-steps h3{margin-top:1rem;font-weight:700;font-size:1.1rem}
.dc-steps p{margin-top:.4rem;color:var(--band-muted)}

.dc-proof{display:grid;gap:3rem}
@media (min-width:900px){.dc-proof{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:5rem;align-items:start}}
.dc-proof .b-rating{display:grid;gap:1rem;justify-items:start}
.dc-proof .b-rating__num{font-family:var(--display);font-size:clamp(6rem,14vw,10rem);line-height:.85;letter-spacing:-.03em}
.dc-proof .b-rating__side{display:flex;align-items:center;gap:1rem}
.dc-proof .stars{width:7rem;height:1.4rem}
.dc-proof .b-rating__count{color:var(--muted)}
.dc-proof .b-rating__cap{color:var(--muted);font-size:.92rem}
.dc-proof .b-themes{display:grid;gap:0}
.dc-proof .b-themes li{padding:1.25rem 0;border-bottom:1px solid var(--line);font-family:var(--display);font-size:clamp(1.5rem,2.8vw,2.2rem);line-height:1.2}
.dc-proof .b-themes li:first-child{border-top:1px solid var(--line)}
.b-themes__note{margin-top:1rem;color:var(--muted);font-size:.9rem}
.dc-proof__empty{font-family:var(--display);font-size:clamp(1.5rem,2.8vw,2.2rem);line-height:1.25;color:var(--muted);max-width:22ch}

.dc-area{display:grid;gap:2.5rem}
@media (min-width:900px){.dc-area{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:5rem}}
.dc-area__place{margin-top:1.25rem;font-family:var(--display);font-size:clamp(1.8rem,3.5vw,2.8rem);line-height:1.1}
.dc-area__tbc{margin-top:.75rem;color:var(--muted)}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:8rem minmax(0,1fr);gap:1rem;padding:1rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:1px solid var(--line)}
.facts dt{font-weight:600;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding-top:.3rem}
.facts dd{margin:0}
.b-visit__pending{display:grid;gap:.35rem;margin-top:1rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.45rem;margin-top:1.25rem;font-weight:600}

.dc-req{display:grid;gap:3rem;align-items:start}
@media (min-width:980px){.dc-req{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:5rem}.dc-req__side{position:sticky;top:3rem}}
.dc-req__side .dc-lede{margin-top:1.25rem}
.dc-form{padding:clamp(1.25rem,3.5vw,2.5rem);background:var(--bg);border:1px solid var(--line)}
.f-input{border-width:1px;border-radius:2px;background:var(--surface);color:var(--ink)}
.f-input:focus{outline:none;border-color:var(--primary)}
.f-label,.f-field legend{font-weight:600;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.f-chip>span{border-width:1px}
.f-chip input:checked+span{background:var(--primary);color:var(--on-primary);border-color:var(--primary)}
.f-drop{border-width:1px;border-radius:2px}
.f-submit{border-radius:999px;background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1px var(--primary);min-height:3.4rem;padding-inline:1.8rem}
.f-submit:hover{background:var(--primary);color:var(--on-primary);filter:none}
.f-status{border-width:1px;border-radius:2px}
select.f-input option{background:var(--surface);color:var(--ink)}

.faq details{border-top:1px solid var(--line)}
.faq details:last-child{border-bottom:1px solid var(--line)}
.faq summary{font-family:var(--display);font-weight:400;font-size:1.4rem}

.b-ft{background:var(--deep);padding:clamp(4rem,8vw,6rem) 0 2.5rem;border-top:1px solid var(--line)}
.dc-ft__tel{display:block;font-family:var(--display);font-size:clamp(3rem,11vw,8.5rem);line-height:.95;letter-spacing:-.03em;text-decoration:none;font-variant-numeric:tabular-nums;white-space:nowrap}
.dc-ft__tel:hover{color:var(--primary)}
.dc-ft__label{margin-bottom:1.25rem}
.b-ft__name{margin-top:3rem;font-family:var(--display);font-size:1.5rem}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.4rem 2rem;margin-top:.5rem;color:var(--muted)}
.legal{margin-top:1.5rem;color:var(--muted);font-size:.85rem}
.b-float{background:var(--primary);color:var(--on-primary)}
.callbar{background:var(--primary);color:var(--on-primary)}
@media (max-width:479.98px){.b-brand{max-width:80vw}}
@media (max-width:759.98px){.dc-hero{min-height:0}.dc-hero__in{padding-top:8rem}}
`;

function render(ctx) {
  const t = ctx.t;
  const consult = ["pools", "remodeling", "landscaping"].includes(ctx.categoryKey);
  const verbPair = consult ? ["Request a consultation", "Pedir una consulta"] : ["Request an estimate", "Pedir presupuesto"];
  const verb = ctx.copyOr("ctaPrimary", verbPair);
  const out = (cls = "dc-out") => `<a class="${cls}" href="#${REQUEST_ID}"><span>${verb}</span>${icon("arrow")}</a>`;

  const header = siteHeader(ctx, {
    cta: consult ? ["Consultation", "Consulta"] : ["Estimate", "Presupuesto"],
    nav: [
      ...(ctx.services.length ? [{ href: "#services", label: ["Services", "Servicios"] }] : []),
      { href: "#process", label: ["Process", "Proceso"] },
      { href: "#area", label: ["Area", "Zona"] },
    ],
  });

  const duotone = ctx.variants.hero === "duotone";
  const heroPic = duotone ? ctx.photos.hero() : null;
  const media = heroPic
    ? `<div class="dc-hero__photo">${ctx.photos.img(heroPic, { hero: true, sizes: "100vw", width: 1600 })}</div><span class="stock-tag">${t("Stock photo", "Foto de archivo")}</span>`
    : texture();
  const hero = `<section class="dc-hero" id="top">${media}<div class="wrap dc-hero__in"><p class="dc-eyebrow">${ctx.name} · ${esc(ctx.cityState || ctx.placeRaw)}</p><h1 class="dc-h1">${ctx.copyOr("headline", ctx.promise)}</h1><div class="dc-hero__row">${out()}${ctx.tel ? `<a class="dc-tel" href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}${ratingProof(ctx, "chip")}</div></div></section>`;

  const intro = INTRO[ctx.categoryKey] || INTRO.remodeling;
  const introSec = `<section class="dc-sec dc-intro"><div class="wrap"><span class="dc-eyebrow">${ctx.categoryT}</span><p>${t(intro[0], intro[1])}</p>${ctx.about ? `<p class="dc-lede dc-about">${ctx.about}</p>` : ""}</div></section>`;

  const swatch = `<span class="dc-swatch" aria-hidden="true">${texture("dc-sw")}</span>`;
  const services = ctx.services.length
    ? `<section class="dc-sec dc-sec--surface" id="services"><div class="wrap"><div class="dc-head"><div><span class="dc-eyebrow">${t("Services", "Servicios")}</span><h2 class="dc-h2 dc-h2--gap">${t("The work", "El trabajo")}</h2></div><p class="dc-lede">${t("Each project starts with a conversation about scope, materials and timing.", "Cada proyecto empieza con una plática sobre alcance, materiales y tiempos.")}</p></div><ol class="dc-index">${ctx.services.map((s, i) => { const l = lineFor(s); return `<li class="rv"><span class="dc-n">${String(i + 1).padStart(2, "0")}</span><h3>${esc(s)}</h3><p>${t(l[0], l[1])}</p>${swatch}</li>`; }).join("")}</ol>${servicesConfirm(ctx)}</div></section>`
    : "";

  const widePic = ctx.photos.next((p) => p.people === "none");
  const wide = widePic ? `<figure class="dc-wide">${ctx.photos.img(widePic, { sizes: "100vw", width: 1600 })}<span class="stock-tag">${t("Stock photo. Their own projects go here.", "Foto de archivo. Aquí van sus proyectos.")}</span></figure>` : "";

  const steps = stepsFor(ctx);
  const process = `<section class="dc-sec dc-bone" id="process"><div class="wrap"><div class="dc-head"><div><span class="dc-eyebrow">${t("Process", "Proceso")}</span><h2 class="dc-h2 dc-h2--gap">${t("How a project runs", "Cómo avanza un proyecto")}</h2></div><p class="dc-lede">${t("The usual order of things. Details to confirm with the owner.", "El orden de siempre. Detalles por confirmar con el dueño.")}</p></div><ol class="dc-steps">${steps.map((s, i) => `<li class="rv"><span class="step-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  const themes = themesBlock(ctx);
  const proof = `<section class="dc-sec"><div class="wrap dc-proof"><div><span class="dc-eyebrow">${t("On Google", "En Google")}</span><div class="dc-proof__fig">${ratingProof(ctx, "figure")}</div></div><div>${themes || `<p class="dc-proof__empty">${t("When you talk, ask to see recent projects like yours.", "Cuando platiquen, pida ver proyectos recientes como el suyo.")}</p>`}</div></div></section>`;

  const area = `<section class="dc-sec dc-sec--surface" id="area"><div class="wrap dc-area"><div><span class="dc-eyebrow">${t("Service area", "Zona de servicio")}</span><p class="dc-area__place">${esc(ctx.placeRaw)}</p><p class="dc-area__tbc">${t("The towns they work in are to confirm with the owner.", "Las zonas donde trabajan están por confirmar con el dueño.")}</p></div>${visitDetails(ctx)}</div></section>`;

  const form = formHeading(ctx);
  const request = `<section class="dc-sec" id="${REQUEST_ID}"><div class="wrap dc-req"><div class="dc-req__side"><span class="dc-eyebrow">${t(verbPair[0], verbPair[1])}</span><h2 class="dc-h2 dc-h2--gap">${form.title}</h2><p class="dc-lede">${form.intro}</p></div><div class="dc-form">${ctx.form}</div></div></section>`;

  const faq = `<section class="dc-sec dc-sec--surface" id="faq"><div class="wrap dc-area"><div><span class="dc-eyebrow">${t("Questions", "Preguntas")}</span><h2 class="dc-h2 dc-h2--gap">${t("Before you call", "Antes de llamar")}</h2></div>${faqBlock(ctx)}</div></section>`;

  const telBlock = ctx.tel ? `<p class="dc-eyebrow dc-ft__label">${t("Call to talk it through", "Llame para platicarlo")}</p><a class="dc-ft__tel" href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : "";
  const footer = siteFooter(ctx).replace("<div class=\"wrap\">", `<div class="wrap">${telBlock}`);

  return {
    css: CSS,
    body: `${textureDefs(ctx)}${header}<main>${hero}${introSec}${services}${wide}${process}${proof}${area}${request}${faq}</main>${footer}`,
  };
}

export const direction = {
  key: "ct-dark-craft",
  label: "Dark craft editorial",
  status: "implemented",
  suits: ["roofing", "remodeling", "pools", "concrete", "foundation-repair", "landscaping"],
  keywords: ["premium", "editorial", "luxury", "design", "architectural", "craft", "high-end"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Gloock&family=Manrope:wght@400;500;600;700&display=swap",
  palettes: PALETTES,
  variants: { hero: ["texture", "duotone"], services: ["index"], proof: ["figure"] },
  imagery: { photos: true, people: ["none"], heroPeople: ["none"], heroPrefer: /shakes|pool|kitchen|concrete|yard/ },
  callbar: "call",
  render,
};
