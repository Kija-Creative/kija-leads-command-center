// Local crew (research/design-home-contractor.md, contractors 4). Friendly,
// direct and local, with softened shapes: the conversion formula strong
// regional roofing and fencing sites share. A split hero names the trade and
// the city, with a white request card (three fields, one big button)
// overlapping flat category art on the brand color. Then a rating band with
// an accent star row, services as cards, a five stop process track, a pin
// cluster for the service area, and the phone set huge in the final band.

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
import { DEMO_SENT_MESSAGE, DEMO_SENT_MESSAGE_ES, esc, icon } from "../shared.js";
import { hsGlyph } from "./hs-dispatch-triage.js";

const PALETTES = [
  { key: "crew-storm", name: "Storm navy and red", vars: { bg: "#ffffff", surface: "#f3f6fb", ink: "#0c1d3b", muted: "#4b5a74", line: "#dbe2ee", primary: "#d7261e", "on-primary": "#ffffff", accent: "#ffb703", brand: "#0c1d3b", "on-brand": "#ffffff", "brand-2": "#1b3566", "art-a": "#ffffff", "art-b": "#8fa6cf", band: "#0c1d3b", "on-band": "#ffffff", "band-muted": "#b6c3db", "pri-text": "#c0211a" } },
  { key: "crew-slate", name: "Slate and orange", vars: { bg: "#fbfaf8", surface: "#ffffff", ink: "#22262b", muted: "#5d636b", line: "#e5e2dc", primary: "#f07c1e", "on-primary": "#1b1d20", accent: "#f07c1e", brand: "#2f3a45", "on-brand": "#fbfaf8", "brand-2": "#3d4b59", "art-a": "#fbfaf8", "art-b": "#9fb0bf", band: "#2f3a45", "on-band": "#fbfaf8", "band-muted": "#c4ccd4", "pri-text": "#2f7d6d" } },
  { key: "crew-shingle", name: "Shingle and sky", vars: { bg: "#f6f8fa", surface: "#ffffff", ink: "#13202c", muted: "#50606f", line: "#dde4ea", primary: "#1a6fc0", "on-primary": "#ffffff", accent: "#ffb703", brand: "#1a6fc0", "on-brand": "#ffffff", "brand-2": "#2f82d1", "art-a": "#ffffff", "art-b": "#13202c", band: "#13202c", "on-band": "#f6f8fa", "band-muted": "#b3c1ce", "pri-text": "#1a6fc0" } },
];

const NOUN = {
  roofing: ["roofing", "techos"],
  fencing: ["fence", "cercas"],
  painting: ["painting", "pintura"],
  "tree-service": ["tree", "árboles"],
  concrete: ["concrete", "concreto"],
  "garage-door": ["garage door", "puertas de cochera"],
};

// Flat category art: sky is the brand field, the scene sits on a ground band.
const ART = {
  roofing: `<circle class="lc-sun" cx="470" cy="90" r="38"/>
<path class="lc-b" d="M60 360V250l160-120 160 120v110z"/>
<path class="lc-a" d="M30 262L220 112l190 150-22 20L220 150 52 282z"/>
<g class="lc-shingle"><path d="M88 238h264M112 214h216M138 194h164M162 174h116M188 154h64"/><path d="M110 238v-24M150 238v-24M190 238v-24M230 238v-24M270 238v-24M310 238v-24M130 214v-20M170 214v-20M210 214v-20M250 214v-20M290 214v-20M160 194v-20M200 194v-20M240 194v-20M280 194v-20"/></g>
<rect class="lc-a" x="180" y="290" width="80" height="70" rx="4"/><rect class="lc-c" x="96" y="276" width="50" height="40" rx="4"/><rect class="lc-c" x="294" y="276" width="50" height="40" rx="4"/>
<path class="lc-ladder" d="M400 360l40-190M430 360l40-190M405 336h30M411 306h30M418 276h30M424 246h30M431 216h30M437 190h30"/>`,
  fencing: `<circle class="lc-sun" cx="480" cy="92" r="36"/>
<g class="lc-a">${Array.from({ length: 11 }, (_, i) => `<path d="M${40 + i * 48} 360v-150l18-22 18 22v150z"/>`).join("")}</g>
<path class="lc-c" d="M30 240h540v16H30zM30 316h540v16H30z"/>
<path class="lc-b" d="M20 222h14v140H20zM566 222h14v140h-14z"/>`,
  painting: `<rect class="lc-b" x="60" y="120" width="420" height="240" rx="6"/>
<path class="lc-a" d="M60 120h250c0 40-20 60-20 110s24 70 24 130H60z"/>
<path class="lc-stroke" d="M300 150c-14 40 16 60 0 100s14 60 4 100"/>
<g transform="translate(360 150) rotate(18)"><rect class="lc-c" x="0" y="0" width="110" height="36" rx="10"/><path class="lc-ink" d="M110 18h22v70H56v40"/><rect class="lc-ink" x="48" y="126" width="16" height="60" rx="6"/></g>`,
  "tree-service": `<circle class="lc-sun" cx="480" cy="90" r="36"/>
<path class="lc-trunk" d="M200 360V250M200 280l-40-40M200 300l44-44"/>
<circle class="lc-a" cx="200" cy="170" r="92"/><circle class="lc-a" cx="130" cy="220" r="56"/><circle class="lc-a" cx="276" cy="214" r="60"/>
<ellipse class="lc-c" cx="420" cy="350" rx="60" ry="16"/><path class="lc-c" d="M360 350v-40c0-9 27-16 60-16s60 7 60 16v40"/><ellipse class="lc-b" cx="420" cy="310" rx="60" ry="16"/><ellipse class="lc-ring" cx="420" cy="310" rx="36" ry="9"/><ellipse class="lc-ring" cx="420" cy="310" rx="16" ry="4"/>`,
  concrete: `<circle class="lc-sun" cx="480" cy="92" r="36"/>
<path class="lc-a" d="M40 360l120-150h360l40 150z"/>
<path class="lc-b" d="M40 360h520v24H40z"/>
<path class="lc-joint" d="M220 210l-50 150M330 210l-10 150M440 210l40 150M100 285h440"/>
<g transform="translate(250 250) rotate(-12)"><path class="lc-c" d="M0 30l110-30 10 20-110 30z"/><path class="lc-ink" d="M60 12l-6-40h-24"/></g>`,
  "garage-door": `<path class="lc-b" d="M70 360V180l230-90 230 90v180z"/>
<rect class="lc-a" x="140" y="200" width="320" height="160" rx="4"/>
<path class="lc-joint" d="M140 240h320M140 280h320M140 320h320"/>
<path class="lc-c" d="M280 346h40v8h-40z"/>`,
};

// Contractor service glyphs for the cards; garage doors use the home set.
const CT_GLYPHS = [
  [/pool construction|pool remodel|resurfac/i, "<path d=\"M3 8h18v10H3z\"/><path d=\"M3 13c2 0 2-1.5 4.5-1.5S9.5 13 12 13s2-1.5 4.5-1.5S19 13 21 13\"/><path d=\"M7 8V4h3\"/>"],
  [/weekly|pool service|clean/i, "<path d=\"M3 16c2 0 2-1.5 4.5-1.5S9.5 16 12 16s2-1.5 4.5-1.5S19 16 21 16M3 20c2 0 2-1.5 4.5-1.5S9.5 20 12 20s2-1.5 4.5-1.5S19 20 21 20\"/><path d=\"M14 3v9M11 12h6\"/>"],
  [/equipment|pump|filter/i, "<rect x=\"4\" y=\"8\" width=\"9\" height=\"12\" rx=\"2\"/><path d=\"M13 12h5v4h-5M18 14h3M8.5 8V5h4\"/>"],
  [/leak detect/i, "<circle cx=\"10.5\" cy=\"10.5\" r=\"6\"/><path d=\"M15 15l5.5 5.5\"/><path d=\"M10.5 7.5c1.2 1.7 1.9 2.8 1.9 3.6a1.9 1.9 0 0 1-3.8 0c0-.8.7-1.9 1.9-3.6z\"/>"],
  [/lawn|sod|mow/i, "<path d=\"M3 20h18\"/><path d=\"M5 20v-5M8 20v-7M11 20v-5M14 20v-8M17 20v-5M20 20v-6\"/>"],
  [/irrigat|sprinkler/i, "<path d=\"M12 21v-8\"/><path d=\"M12 13c-3-1-5-3-6-6M12 13c3-1 5-3 6-6M12 13V5\"/><path d=\"M9 21h6\"/>"],
  [/hardscape|paver|wall/i, "<path d=\"M3 7h8v5H3zM13 7h8v5h-8zM3 14h5v5H3zM10 14h11v5H10z\"/>"],
  [/landscape design|design/i, "<path d=\"M4 20c0-6 4-10 8-10s8 4 8 10\"/><path d=\"M12 10V4M9 6l3-2 3 2\"/><circle cx=\"7\" cy=\"17\" r=\"1.2\"/><circle cx=\"16\" cy=\"16\" r=\"1.2\"/>"],
  [/seasonal|cleanup|leaf/i, "<path d=\"M5 19C5 10 11 4.5 20 4.5c0 9-5.5 14.5-15 14.5z\"/><path d=\"M5 19l8-8\"/>"],
  [/storm|hail|wind/i, "<path d=\"M7 15h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.5 1.5A3.3 3.3 0 0 0 7 15z\"/><path d=\"M11 17l-2 4h4l-2 3\"/>"],
  [/inspect/i, "<circle cx=\"10.5\" cy=\"10.5\" r=\"6\"/><path d=\"M15 15l5.5 5.5M7.5 11l2 2 3.5-4\"/>"],
  [/leak/i, "<path d=\"M3 11L12 4l9 7\"/><path d=\"M12 13c1.6 2.2 2.5 3.6 2.5 4.7a2.5 2.5 0 0 1-5 0c0-1.1.9-2.5 2.5-4.7z\"/>"],
  [/gutter/i, "<path d=\"M3 7h18l-2 4H5z\"/><path d=\"M17 11v9M15 20h4\"/>"],
  [/roof|shingle|construction/i, "<path d=\"M2.5 13L12 5l9.5 8\"/><path d=\"M5 11v9h14v-9M7 14h10M8 17h8\"/>"],
  [/gate/i, "<path d=\"M4 21V5M20 21V5M4 8h16M4 18h16M8 8l8 10M16 8l-8 10\"/>"],
  [/chain/i, "<path d=\"M4 21V6M20 21V6M4 6h16\"/><path d=\"M4 9l3 3-3 3M8 9l4 4 4-4M16 9l4 4\"/>"],
  [/iron|metal/i, "<path d=\"M4 21V7M20 21V7M8 21V7M12 21V7M16 21V7M3 18h18M3 10h18\"/><path d=\"M4 7l0-2M8 7l0-2M12 7V5M16 7V5M20 7V5\"/>"],
  [/fence|privacy|wood/i, "<path d=\"M4 21V7l2-2 2 2v14M10 21V7l2-2 2 2v14M16 21V7l2-2 2 2v14M3 10h18M3 17h18\"/>"],
  [/cabinet/i, "<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"1\"/><path d=\"M12 4v16M9.5 11v2M14.5 11v2\"/>"],
  [/drywall|repair/i, "<rect x=\"3\" y=\"4\" width=\"18\" height=\"14\" rx=\"1\"/><path d=\"M9 9h6v5H9z\"/><path d=\"M12 18v3\"/>"],
  [/stain/i, "<path d=\"M5 5h9v5H5z\"/><path d=\"M14 7h3v4h-7v3\"/><path d=\"M9 14h2v7H9z\"/>"],
  [/paint|interior|exterior|commercial/i, "<rect x=\"3\" y=\"3\" width=\"14\" height=\"6\" rx=\"2\"/><path d=\"M17 6h3v6h-9v3\"/><rect x=\"9.5\" y=\"15\" width=\"3\" height=\"6\" rx=\"1\"/>"],
  [/trim|prun/i, "<path d=\"M12 21V11\"/><path d=\"M12 11C8 11 5 8.5 5 5.5 8 5.5 12 7 12 11zM12 13c3.5 0 6-2.2 6-5-3 0-6 1.5-6 5z\"/>"],
  [/stump/i, "<ellipse cx=\"12\" cy=\"10\" rx=\"7\" ry=\"3\"/><path d=\"M5 10v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6\"/>"],
  [/remov|clear/i, "<path d=\"M4 19l12-12\"/><path d=\"M16 7c1-3 4-4 5-3s0 4-3 5\"/><path d=\"M3 21h18\"/>"],
  [/driveway/i, "<path d=\"M8 21l2-18h4l2 18\"/><path d=\"M12 6v2M12 11v2M12 16v2\"/>"],
  [/patio|stamp/i, "<path d=\"M3 18l3-10h12l3 10z\"/><path d=\"M9.5 8l-1 10M14.5 8l1 10M4.5 13h15\"/>"],
  [/sidewalk/i, "<path d=\"M6 21L9 3h6l3 18\"/><path d=\"M7.2 14h9.6M8.3 8h7.4\"/>"],
  [/slab|foundation/i, "<path d=\"M3 13l9-4 9 4-9 4z\"/><path d=\"M3 13v3l9 4 9-4v-3\"/>"],
  [/concrete/i, "<path d=\"M3 13l9-4 9 4-9 4z\"/><path d=\"M12 9V4M9 5l3-2 3 2\"/>"],
];

// Contractor service glyphs, shared with the other ct- directions.
export function ctGlyph(ctx, name, { stroke = 1.8 } = {}) {
  if (ctx.vertical === "home-services") return hsGlyph(name, { stroke });
  const hit = CT_GLYPHS.find(([re]) => re.test(name));
  const body = hit ? hit[1] : "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M8.5 12.5l2.3 2.3 4.7-5.3\"/>";
  return `<svg class="hs-glyph" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

function glyph(ctx, name) {
  return ctGlyph(ctx, name);
}

const PROCESS = [
  [["Request", "Solicitud"], ["Send the short form or call with the address and what you need.", "Mande el formulario corto o llame con la dirección y lo que necesita."]],
  [["A look in person", "Una revisión"], ["Someone comes out to see the job and measure.", "Alguien va a ver el trabajo y a medir."]],
  [["A clear estimate", "Un presupuesto claro"], ["The scope and the price in writing, with time to ask questions.", "El alcance y el precio por escrito, con tiempo para preguntar."]],
  [["Scheduling", "Agenda"], ["Pick a start date that works around your week.", "Elija una fecha de inicio que le acomode."]],
  [["The work and a walkthrough", "El trabajo y un recorrido"], ["The job gets done and you walk it together at the end.", "Se hace el trabajo y lo recorren juntos al final."]],
];

const CSS = `
:root{--display:"Red Hat Display",system-ui,sans-serif;--body:"Red Hat Text",system-ui,sans-serif;--radius:12px;--btn-radius:999px;--chip-radius:999px;--max:1200px;--ease:cubic-bezier(.22,1,.36,1);--field:var(--bg);--field-line:var(--line);--star:var(--accent);--lang-fg:var(--ink);--lang-on:var(--bg);--shadow:0 18px 40px -18px rgb(12 29 59 / .35),0 2px 6px rgb(12 29 59 / .06)}
body{font-size:1.0625rem;line-height:1.6}

.b-hd{position:sticky;top:0;z-index:10;background:var(--bg);box-shadow:0 1px 0 var(--line)}
.b-hd__in{display:flex;align-items:center;gap:1.25rem;min-height:4.5rem}
.b-brand{margin-right:auto;font-family:var(--display);font-weight:900;font-size:1.3rem;letter-spacing:-.01em;line-height:1.1;text-decoration:none;max-width:52vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.b-nav{display:none;gap:1.6rem;font-weight:500}
.b-nav a{text-decoration:none}
.b-nav a:hover{color:var(--pri-text)}
@media (min-width:1040px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:1rem}
.b-hd__tel{display:none;align-items:center;gap:.45rem;font-family:var(--display);font-weight:700;font-size:1.1rem;text-decoration:none}
@media (min-width:720px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.8rem;padding:0 1.25rem;border-radius:999px;background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:700;text-decoration:none;box-shadow:0 6px 14px -8px var(--primary)}

.lc-hero{position:relative;padding:clamp(2.5rem,6vw,4.5rem) 0 clamp(3rem,6vw,5rem);overflow:hidden}
.lc-hero::before{content:"";position:absolute;inset:0 0 0 auto;width:min(48%,40rem);background:var(--brand);border-bottom-left-radius:48px}
@media (max-width:979.98px){.lc-hero::before{display:none}}
.lc-hero__grid{position:relative;display:grid;gap:2.5rem;align-items:center}
@media (min-width:980px){.lc-hero__grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4rem}}
.lc-city{display:inline-flex;align-items:center;gap:.5rem;padding:.4rem .85rem;border-radius:999px;background:var(--surface);font-weight:500;font-size:.95rem;color:var(--muted)}
.lc-city .ico{color:var(--pri-text)}
.lc-h1{margin-top:1.1rem;font-family:var(--display);font-weight:900;font-size:clamp(2.6rem,5.8vw,4.6rem);line-height:1;letter-spacing:-.025em;max-width:13ch}
.lc-sub{margin-top:1.1rem;font-size:1.2rem;color:var(--muted);max-width:36ch}
.lc-name{margin-top:.5rem;font-weight:500}
.lc-hero .b-rating{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;margin-top:1.75rem}
.lc-hero .b-rating__num{font-family:var(--display);font-weight:900;font-size:1.4rem}
.lc-hero .stars{width:7rem;height:1.4rem}
.lc-hero .b-rating__count{color:var(--muted);font-weight:500}
.lc-tel{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-family:var(--display);font-weight:700;font-size:1.2rem;text-decoration:none}
.lc-tel .ico{color:var(--pri-text)}
.lc-stage{position:relative;padding-bottom:3rem}
@media (max-width:979.98px){.lc-stage{padding:1.25rem 1.25rem 0;border-radius:28px;background:var(--brand)}}
.lc-art{position:relative;border-radius:24px;overflow:hidden;background:var(--brand-2)}
.lc-art svg{display:block;width:100%;height:auto}
.lc-art>img{display:block;width:100%;aspect-ratio:600/440;height:auto}
.lc-art .stock-tag{top:.75rem;bottom:auto}
.lc-art .b-photo img{filter:saturate(1.15) contrast(1.05)}
.lc-a{fill:var(--art-a)}
.lc-b{fill:var(--art-b)}
.lc-c{fill:var(--accent)}
.lc-sun{fill:var(--accent);opacity:.9}
.lc-ground{fill:color-mix(in oklab,var(--art-b) 70%,var(--brand))}
.lc-shingle path,.lc-joint,.lc-ring{fill:none;stroke:var(--brand);stroke-width:3;stroke-linecap:round}
.lc-ladder,.lc-trunk{fill:none;stroke:var(--accent);stroke-width:8;stroke-linecap:round}
.lc-trunk{stroke:var(--art-b);stroke-width:14}
.lc-stroke{fill:none;stroke:var(--accent);stroke-width:26;stroke-linecap:round;opacity:.9}
.lc-ink{fill:none;stroke:var(--ink);stroke-width:8;stroke-linejoin:round}
rect.lc-ink{fill:var(--ink);stroke:none}
.lc-card{position:relative;z-index:2;margin:-7rem 1rem 0 auto;width:min(100%,24rem);padding:1.5rem;border-radius:22px;background:var(--surface);color:var(--ink);box-shadow:var(--shadow)}
@media (max-width:979.98px){.lc-card{margin:-2.5rem auto 0;width:auto;transform:translateY(1.5rem)}}
.lc-card h2{font-family:var(--display);font-weight:900;font-size:1.45rem;line-height:1.1}
.lc-card p.lc-card__intro{margin-top:.35rem;color:var(--muted);font-size:.95rem}
.lc-quick{display:grid;gap:.75rem;margin-top:1.1rem}
.lc-quick .f-input{min-height:3.1rem;border-radius:12px}
.lc-quick .f-submit{justify-self:stretch;border-radius:999px;min-height:3.5rem;font-family:var(--display);font-size:1.1rem}
.lc-card__note{margin-top:.7rem;font-size:.82rem;color:var(--muted);text-align:center}
.lc-hero--photo .lc-art{background:var(--brand)}

.lc-band{background:var(--band);color:var(--on-band)}
.lc-band__in{display:grid;gap:1.25rem 3rem;align-items:center;padding:2rem 0}
@media (min-width:860px){.lc-band__in{grid-template-columns:auto minmax(0,1fr) auto}}
.lc-band .b-rating{display:flex;align-items:center;gap:1.25rem}
.lc-band .b-rating__num{font-family:var(--display);font-weight:900;font-size:3.6rem;line-height:1;letter-spacing:-.02em}
.lc-band .b-rating__side{display:grid;gap:.3rem}
.lc-band .stars{width:8.5rem;height:1.7rem;color:var(--accent)}
.lc-band .b-rating__count{font-weight:500}
.lc-band p{color:var(--band-muted);max-width:42ch}
.lc-band__cta{display:inline-flex;align-items:center;gap:.5rem;min-height:3.25rem;padding:0 1.4rem;border-radius:999px;background:var(--on-band);color:var(--band);font-family:var(--display);font-weight:700;text-decoration:none}

.lc-sec{padding:clamp(4rem,8vw,6.5rem) 0}
.lc-sec--alt{background:var(--surface)}
.lc-head{display:grid;gap:.75rem;max-width:44rem;margin-bottom:2.5rem}
.lc-head--center{margin-inline:auto;text-align:center;justify-items:center}
.lc-h2{font-family:var(--display);font-weight:900;font-size:clamp(2.1rem,4.4vw,3.3rem);line-height:1.02;letter-spacing:-.02em}
.lc-lede{color:var(--muted);max-width:52ch}
.lc-lede--gap{margin-top:.9rem}

.lc-cards{display:grid;gap:1.25rem;grid-template-columns:1fr}
@media (min-width:640px){.lc-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:980px){.lc-cards{grid-template-columns:repeat(3,minmax(0,1fr))}}
.lc-cards li{display:grid;grid-template-rows:auto 1fr;border-radius:20px;background:var(--surface);box-shadow:0 1px 0 var(--line),0 10px 30px -22px rgb(0 0 0 / .45);overflow:hidden;transition:transform .4s var(--ease),box-shadow .4s var(--ease)}
.lc-sec--alt .lc-cards li{background:var(--bg)}
.lc-cards li:hover{transform:translateY(-4px);box-shadow:0 1px 0 var(--line),0 22px 40px -24px rgb(0 0 0 / .5)}
.lc-cards__art{position:relative;display:grid;place-items:center;height:8.5rem;background:var(--brand);color:var(--on-brand)}
.lc-cards__art::after{content:"";position:absolute;right:-2rem;bottom:-2rem;width:7rem;height:7rem;border-radius:50%;background:var(--brand-2)}
.lc-cards__art .hs-glyph{position:relative;z-index:1;width:3rem;height:3rem}
.lc-cards__body{display:grid;align-content:start;gap:.5rem;padding:1.35rem 1.4rem 1.5rem}
.lc-cards h3{font-family:var(--display);font-weight:700;font-size:1.3rem;line-height:1.15}
.lc-cards a{justify-self:start;display:inline-flex;align-items:center;gap:.35rem;margin-top:.25rem;font-weight:600;color:var(--pri-text);text-decoration:none}
.lc-cards a .ico{transition:transform .3s var(--ease)}
.lc-cards a:hover .ico{transform:translateX(3px)}
@media (max-width:639.98px){.lc-cards li{grid-template-rows:none;grid-template-columns:5.5rem minmax(0,1fr)}.lc-cards__art{height:auto;min-height:5.5rem}.lc-cards__art .hs-glyph{width:2rem;height:2rem}.lc-cards__art::after{display:none}.lc-cards__body{padding:1rem 1.1rem;align-content:center}}
.b-svc-confirm{margin-top:1.5rem;color:var(--muted);font-size:.95rem}
.svc-note{margin-top:.3rem;color:var(--muted);font-size:.92rem}

.lc-track{position:relative;display:grid;gap:1.75rem}
@media (min-width:900px){.lc-track{grid-template-columns:repeat(5,minmax(0,1fr));gap:1.5rem}.lc-track::before{content:"";position:absolute;left:10%;right:10%;top:1.6rem;height:4px;border-radius:4px;background:repeating-linear-gradient(90deg,var(--line) 0 14px,transparent 14px 22px)}}
@media (max-width:899.98px){.lc-track::before{content:"";position:absolute;left:1.55rem;top:1rem;bottom:1rem;width:4px;background:var(--line);border-radius:4px}}
.lc-track li{position:relative;display:grid;gap:.5rem;grid-template-columns:3.25rem minmax(0,1fr)}
@media (min-width:900px){.lc-track li{grid-template-columns:1fr;justify-items:center;text-align:center}}
.lc-track .step-n{position:relative;z-index:1;display:grid;place-items:center;width:3.25rem;height:3.25rem;border-radius:50%;background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:900;font-size:1.3rem;box-shadow:0 0 0 6px var(--bg)}
.lc-sec--alt .lc-track .step-n{box-shadow:0 0 0 6px var(--surface)}
.lc-track h3{font-family:var(--display);font-weight:700;font-size:1.15rem;line-height:1.2}
.lc-track p{color:var(--muted);font-size:.95rem}
@media (max-width:899.98px){.lc-track h3,.lc-track p{grid-column:2}.lc-track .step-n{grid-row:span 2}}

.lc-why{display:grid;gap:2rem}
@media (min-width:900px){.lc-why{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}}
.lc-why .b-themes{display:grid;gap:.75rem}
.lc-why .b-themes li{display:flex;gap:.8rem;align-items:center;padding:1rem 1.2rem;border-radius:16px;background:var(--surface);font-family:var(--display);font-weight:700;font-size:1.15rem}
.lc-why .b-themes li::before{content:"";flex:none;width:1.4rem;height:1.4rem;border-radius:50%;background:var(--accent) radial-gradient(circle,var(--ink) 0 2px,transparent 2.5px)}
.b-themes__note{margin-top:1rem;color:var(--muted);font-size:.92rem}

.lc-req{display:grid;gap:2.5rem;align-items:start}
@media (min-width:980px){.lc-req{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}.lc-req__side{position:sticky;top:6.5rem}}
.lc-req__side .lc-lede{margin-top:1rem}
.lc-formcard{padding:clamp(1.25rem,3.5vw,2.25rem);border-radius:24px;background:var(--surface);box-shadow:var(--shadow)}
.f-input{border-width:1.5px;border-radius:12px}
.f-input:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 4px color-mix(in oklab,var(--brand) 18%,transparent)}
.f-chip input:checked+span{background:var(--brand);color:var(--on-brand);border-color:var(--brand)}
.f-drop{border-radius:16px}
.f-submit{border-radius:999px;font-family:var(--display);min-height:3.4rem}
.f-status{border-radius:14px}

.lc-area{display:grid;gap:2.5rem;align-items:center}
@media (min-width:900px){.lc-area{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4rem}}
.lc-map{position:relative;border-radius:24px;overflow:hidden;background:var(--surface)}
.lc-map svg{display:block;width:100%;height:auto}
.lc-map .lc-grid{fill:none;stroke:var(--line);stroke-width:2}
.lc-map .lc-road{fill:none;stroke:var(--bg);stroke-width:10;stroke-linecap:round}
.lc-map .lc-zone{fill:color-mix(in oklab,var(--brand) 12%,transparent);stroke:var(--brand);stroke-width:2;stroke-dasharray:6 8}
.lc-map .lc-pin{fill:var(--primary)}
.lc-map .lc-pin--sm{fill:var(--brand)}
.lc-map .lc-pinhole{fill:var(--surface)}
.lc-map__label{position:absolute;left:50%;top:58%;transform:translateX(-50%);padding:.45rem .95rem;border-radius:999px;background:var(--bg);box-shadow:var(--shadow);font-family:var(--display);font-weight:700;white-space:nowrap}
.lc-towns{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.25rem}
.lc-towns li{padding:.5rem .95rem;border-radius:999px;background:var(--surface);font-weight:500}
.lc-towns li.is-home{background:var(--brand);color:var(--on-brand)}
.lc-towns li.is-tbc{background:transparent;border:1.5px dashed var(--line);color:var(--muted)}
.facts{margin:1.5rem 0 0}
.facts div{display:grid;grid-template-columns:7rem minmax(0,1fr);gap:1rem;padding:.8rem 0;border-bottom:1px solid var(--line)}
.facts dt{color:var(--muted)}
.facts dd{margin:0;font-weight:500}
.b-visit__pending{display:grid;gap:.35rem;margin-top:1rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.45rem;margin-top:1.25rem;font-weight:600}

.faq details{border-top-width:1px}
.faq details:last-child{border-bottom-width:1px}
.faq summary{font-family:var(--display);font-weight:700;font-size:1.12rem}

.lc-final{padding:clamp(1rem,3vw,2rem) 0 clamp(4rem,8vw,6rem)}
.lc-final__card{position:relative;overflow:hidden;display:grid;gap:1.25rem;justify-items:center;text-align:center;padding:clamp(3rem,7vw,5rem) 1.25rem;border-radius:32px;background:var(--brand);color:var(--on-brand)}
.lc-final__card::after{content:"";position:absolute;width:22rem;height:22rem;right:-6rem;top:-8rem;border-radius:50%;background:var(--brand-2);z-index:0}
.lc-final__card>*{position:relative;z-index:1}
.lc-final__tel{font-family:var(--display);font-weight:900;font-size:clamp(2.6rem,9vw,6rem);line-height:1;letter-spacing:-.03em;text-decoration:none;font-variant-numeric:tabular-nums;white-space:nowrap}
.lc-final__tel:hover{text-decoration:underline;text-decoration-thickness:4px;text-underline-offset:.1em}
.lc-final p{max-width:40ch;opacity:.9}
.lc-final .lc-band__cta{background:var(--primary);color:var(--on-primary)}

.b-ft{padding:3rem 0;background:var(--band);color:var(--on-band)}
.b-ft__name{font-family:var(--display);font-weight:900;font-size:1.5rem}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.4rem 2rem;margin-top:.6rem;color:var(--band-muted)}
.b-ft__row a{color:var(--on-band);font-weight:600}
.legal{margin-top:1.5rem;color:var(--band-muted);font-size:.88rem}
.stock-credits{color:var(--band-muted)}
.callbar--split .cb-book{background:var(--primary);color:var(--on-primary)}
.callbar--split{--callbar-bg:var(--band);--callbar-ink:var(--on-band)}
@media (max-width:479.98px){.b-brand{max-width:80vw}}
`;

function verbFor(ctx) {
  if (ctx.categoryKey === "roofing") return ["Request an inspection", "Pedir una inspección"];
  if (ctx.kind === "estimate") return ["Request an estimate", "Pedir presupuesto"];
  return ["Request a visit", "Pedir una visita"];
}

// The hero card: its own short demo form, three fields and one button.
function quickCard(ctx, verbPair) {
  const i = ctx.i18n;
  const t = ctx.t;
  const f = (id, label, type, ac, ph) => `<div class="f-field"><label class="f-label" for="${id}">${label}</label><input class="f-input" id="${id}" name="${id}" type="${type}" autocomplete="${ac}"${type === "tel" ? " inputmode=\"tel\"" : ""}${i.placeholder(ph[0], ph[1])}></div>`;
  return `<div class="lc-card"><h2>${t(verbPair[0], verbPair[1])}</h2><p class="lc-card__intro">${t("Three quick details and they call you back.", "Tres datos rápidos y le regresan la llamada.")}</p><form class="lc-quick" data-demo-form novalidate${i.aria("Quick request", "Solicitud rápida")}>${f("lc-name", t("Name", "Nombre"), "text", "name", ["First and last", "Nombre y apellido"])}${f("lc-phone", t("Phone", "Teléfono"), "tel", "tel", ["Best number", "Mejor número"])}${f("lc-zip", t("Address or ZIP", "Dirección o código postal"), "text", "postal-code", ["Where the job is", "Dónde es el trabajo"])}<button class="f-submit" type="submit">${ctx.copyOr("ctaPrimary", verbPair)}${icon("arrow")}</button><p class="f-status" data-demo-status tabindex="-1" role="status" hidden>${t(DEMO_SENT_MESSAGE, DEMO_SENT_MESSAGE_ES)}</p></form><p class="lc-card__note">${t("Want to add photos? Use the full form below.", "¿Quiere agregar fotos? Use el formulario completo abajo.")}</p></div>`;
}

function artFor(ctx) {
  const key = ART[ctx.categoryKey] ? ctx.categoryKey : "roofing";
  return `<svg viewBox="0 0 600 440" role="img"${ctx.i18n.aria("Illustration", "Ilustración")} focusable="false"><rect class="lc-ground" x="0" y="360" width="600" height="80"/>${ART[key]}</svg>`;
}

function render(ctx) {
  const t = ctx.t;
  const photoHero = ctx.variants.hero === "photo";
  const verbPair = verbFor(ctx);
  const noun = NOUN[ctx.categoryKey] || ["home", "hogar"];
  const city = ctx.cityRaw || ctx.placeRaw;

  const header = siteHeader(ctx, {
    cta: verbPair,
    nav: [
      ...(ctx.services.length ? [{ href: "#services", label: ["Services", "Servicios"] }] : []),
      { href: "#process", label: ["Our process", "El proceso"] },
      { href: "#area", label: ["Service area", "Zona"] },
      { href: "#faq", label: ["FAQ", "Preguntas"] },
    ],
  });

  const photo = photoHero ? ctx.photos.hero() : null;
  const art = photo ? `<div class="lc-art">${ctx.photos.img(photo, { hero: true, sizes: "(min-width: 980px) 45vw, 100vw", width: 1200 })}<span class="stock-tag">${t("Stock photo", "Foto de archivo")}</span></div>` : `<div class="lc-art">${artFor(ctx)}</div>`;
  const copy = `<div><p class="lc-city">${icon("pin")}<span>${ctx.categoryT} · ${esc(ctx.cityState || ctx.placeRaw)}</span></p><h1 class="lc-h1">${ctx.copyOr("headline", [`Your ${city} ${noun[0]} crew.`, `Su equipo de ${noun[1]} en ${city}.`])}</h1><p class="lc-sub">${t(ctx.promise[0], ctx.promise[1])}</p><p class="lc-name">${ctx.name}${ctx.about ? `. ${ctx.about}` : ""}</p>${ratingProof(ctx, "chip")}${ctx.tel ? `<a class="lc-tel" href="${esc(ctx.tel)}">${icon("phone")}<span>${t("Or call", "O llame al")} ${esc(ctx.phone)}</span></a>` : ""}</div>`;
  const stage = `<div class="lc-stage">${art}${quickCard(ctx, verbPair)}</div>`;
  const hero = `<section class="lc-hero lc-hero--${photo ? "photo" : "art"}" id="top"><div class="wrap lc-hero__grid">${copy}${stage}</div></section>`;

  const band = `<section class="lc-band" aria-label="Google rating"><div class="wrap lc-band__in">${ratingProof(ctx, "strip")}<p>${t(`What neighbors around ${city} say on Google.`, `Lo que dicen los vecinos de ${city} en Google.`)}</p><a class="lc-band__cta" href="#${REQUEST_ID}">${t(verbPair[0], verbPair[1])}${icon("arrow")}</a></div></section>`;

  const services = ctx.services.length
    ? `<section class="lc-sec" id="services"><div class="wrap"><div class="lc-head"><h2 class="lc-h2">${t("What the crew takes on", "Lo que hace el equipo")}</h2><p class="lc-lede">${t("Pick one to start a request, or tell them about the job in your own words.", "Elija uno para empezar una solicitud, o cuénteles del trabajo con sus palabras.")}</p></div><ul class="lc-cards">${ctx.services.map((s) => `<li class="rv"><div class="lc-cards__art" aria-hidden="true">${glyph(ctx, s)}</div><div class="lc-cards__body"><h3>${esc(s)}</h3><a href="#${REQUEST_ID}">${t("Ask about this", "Preguntar")}${icon("arrow")}</a></div></li>`).join("")}</ul>${servicesConfirm(ctx)}</div></section>`
    : "";

  const process = `<section class="lc-sec lc-sec--alt" id="process"><div class="wrap"><div class="lc-head lc-head--center"><h2 class="lc-h2">${t("Our process, start to finish", "El proceso, de principio a fin")}</h2><p class="lc-lede">${t("How a job like this usually runs. Details to confirm with the owner.", "Cómo suele ir un trabajo así. Detalles por confirmar con el dueño.")}</p></div><ol class="lc-track">${PROCESS.map((p, i) => `<li class="rv"><span class="step-n" aria-hidden="true">${i + 1}</span><h3>${t(p[0][0], p[0][1])}</h3><p>${t(p[1][0], p[1][1])}</p></li>`).join("")}</ol></div></section>`;

  const themes = themesBlock(ctx);
  const why = themes ? `<section class="lc-sec"><div class="wrap lc-why"><div class="lc-head"><h2 class="lc-h2">${t("Why customers call", "Por qué llaman los clientes")}</h2><p class="lc-lede">${t("The things that come up again and again in their Google reviews.", "Lo que se repite una y otra vez en sus reseñas de Google.")}</p></div><div>${themes}</div></div></section>` : "";

  const pins = [[140, 90], [300, 70], [360, 170], [110, 190], [250, 210]].map(([x, y]) => `<path class="lc-pin--sm" d="M${x} ${y + 10}s-9-8.5-9-15.5a9 9 0 0 1 18 0c0 7-9 15.5-9 15.5z"/><circle class="lc-pinhole" cx="${x}" cy="${y - 5}" r="3"/>`).join("");
  const area = `<section class="lc-sec ${themes ? "lc-sec--alt" : ""}" id="area"><div class="wrap lc-area"><div class="lc-map" aria-hidden="true"><svg viewBox="0 0 480 300"><path class="lc-grid" d="M0 60h480M0 120h480M0 180h480M0 240h480M80 0v300M160 0v300M240 0v300M320 0v300M400 0v300"/><path class="lc-road" d="M-10 220C80 200 140 120 240 130s160-60 250-90M60 310C100 230 200 200 250 150"/><ellipse class="lc-zone" cx="240" cy="140" rx="170" ry="105"/>${pins}<path class="lc-pin" d="M240 158s-18-17-18-31a18 18 0 0 1 36 0c0 14-18 31-18 31z"/><circle class="lc-pinhole" cx="240" cy="127" r="6"/></svg><span class="lc-map__label">${esc(city)}</span></div><div><h2 class="lc-h2">${t("Service area", "Zona de servicio")}</h2><p class="lc-lede lc-lede--gap">${t(`Based in ${ctx.placeRaw}. The neighborhoods and towns they cover are to confirm with the owner.`, `Con base en ${ctx.placeRaw}. Las colonias y zonas que cubren están por confirmar con el dueño.`)}</p><ul class="lc-towns"><li class="is-home">${esc(city)}</li><li class="is-tbc">${t("Nearby towns to confirm", "Zonas cercanas por confirmar")}</li></ul>${visitDetails(ctx)}</div></div></section>`;

  const form = formHeading(ctx);
  const request = `<section class="lc-sec ${themes ? "" : "lc-sec--alt"}" id="${REQUEST_ID}"><div class="wrap lc-req"><div class="lc-req__side"><h2 class="lc-h2">${ctx.categoryKey === "roofing" ? t(verbPair[0], verbPair[1]) : form.title}</h2><p class="lc-lede">${form.intro}</p>${ctx.tel ? `<a class="lc-tel" href="${esc(ctx.tel)}">${icon("phone")}<span>${t("Or call", "O llame al")} ${esc(ctx.phone)}</span></a>` : ""}</div><div class="lc-formcard">${ctx.form}</div></div></section>`;

  const faq = `<section class="lc-sec" id="faq"><div class="wrap lc-why"><div class="lc-head"><h2 class="lc-h2">${t("Questions, answered", "Preguntas, respondidas")}</h2></div>${faqBlock(ctx)}</div></section>`;

  const final = `<section class="lc-final"><div class="wrap"><div class="lc-final__card"><p>${t("Talk to the crew", "Hable con el equipo")}</p>${ctx.tel ? `<a class="lc-final__tel" href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}<a class="lc-band__cta" href="#${REQUEST_ID}">${ctx.copyOr("ctaPrimary", verbPair)}${icon("arrow")}</a></div></div></section>`;

  return {
    css: CSS,
    body: `${header}<main>${hero}${band}${services}${process}${why}${area}${request}${faq}${final}</main>${siteFooter(ctx)}`,
  };
}

export const direction = {
  key: "ct-local-crew",
  label: "Local crew",
  status: "implemented",
  suits: ["roofing", "fencing", "painting", "tree-service", "concrete", "garage-door"],
  keywords: ["storm", "emergency", "family", "local", "repair-first", "damage", "crew", "inspection"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@700;900&family=Red+Hat+Text:wght@400;500;600&display=swap",
  palettes: PALETTES,
  variants: { hero: ["art", "photo"], services: ["cards"], proof: ["strip"] },
  imagery: { photos: true, people: ["none", "hands"], heroPeople: ["none"], heroPrefer: /roof|fence|paint|yard|hedge/ },
  callbar: "split",
  callbarBook: ["Estimate", "Presupuesto"],
  render,
};
