// Neighborhood service bay (research/design-auto.md, direction 1): the trusted
// shop down the street. Daylight, plain spoken, well kept. A utility bar with
// the phone and hours, a light split hero on a pegboard texture, symptom chips
// that tick the matching box in the request form (pure CSS: each chip is a
// label for a radio inside the form), and a local card printed like a paper
// repair order. Warm documentary photos in small rounded frames, and a line
// drawing of an open bay when there are none.

import {
  bookButton,
  callButton,
  directionsLink,
  faqBlock,
  formHeading,
  gallery,
  heroPhoto,
  promiseLine,
  ratingProof,
  REQUEST_ID,
  servicesConfirm,
  servicesList,
  shortCta,
  siteFooter,
  siteHeader,
  themesBlock,
  visitDetails,
} from "../blocks.js";
import { stepsFor } from "../copy.js";
import { esc, icon } from "../shared.js";

const PALETTES = [
  { key: "bay-apron", name: "Shop apron", vars: { bg: "#f5f5f2", surface: "#ffffff", ink: "#1b1b1b", muted: "#57524a", line: "#d9d5cc", primary: "#e4572e", "on-primary": "#111111", accent: "#e4572e", deep: "#16324f", "on-deep": "#f6f1e7", "deep-muted": "#b9c6d4", paper: "#fbf7ee", peg: "rgb(22 50 79 / .13)" } },
  { key: "bay-counter", name: "Parts counter", vars: { bg: "#ffffff", surface: "#eef0f2", ink: "#23262b", muted: "#5a6169", line: "#d9dde1", primary: "#c8102e", "on-primary": "#ffffff", accent: "#c8102e", deep: "#23262b", "on-deep": "#ffffff", "deep-muted": "#b8bec6", paper: "#ffffff", peg: "rgb(35 38 43 / .11)" } },
  { key: "bay-green", name: "Garage green", vars: { bg: "#f1f1ec", surface: "#ffffff", ink: "#141a16", muted: "#4f564f", line: "#d6d6cc", primary: "#d9a21b", "on-primary": "#141a16", accent: "#d9a21b", deep: "#1f3d2b", "on-deep": "#efeadf", "deep-muted": "#b7c7bb", paper: "#fbf8f0", peg: "rgb(31 61 43 / .14)" } },
];

// What people say when they call a neighborhood shop, by trade. Each value is
// a radio in the request form; the hero chips are labels for those radios.
const CONCERNS = {
  "auto-repair": [
    ["check-engine", "Check engine light", "Luz de check engine"],
    ["brakes", "Brakes squeal or grind", "Frenos que rechinan"],
    ["ac", "AC blowing warm", "El aire no enfría"],
    ["no-start", "Will not start", "No arranca"],
    ["noise", "A new noise", "Un ruido nuevo"],
    ["maintenance", "Oil and maintenance", "Aceite y mantenimiento"],
    ["other", "Something else", "Otra cosa"],
  ],
  "muffler-exhaust": [
    ["loud", "Loud exhaust", "Escape ruidoso"],
    ["rattle", "Rattle underneath", "Algo suena abajo"],
    ["check-engine", "Check engine light", "Luz de check engine"],
    ["smell", "Exhaust smell", "Olor a escape"],
    ["other", "Something else", "Otra cosa"],
  ],
  "tire-shop": [
    ["flat", "Flat or slow leak", "Ponchada o se baja"],
    ["replace", "Replace tires", "Cambiar llantas"],
    ["shake", "Shakes at speed", "Vibra en carretera"],
    ["rotation", "Rotation or balance", "Rotación o balanceo"],
    ["unsure", "Not sure", "No sé"],
  ],
};

// The roadside form (mobile mechanic) already asks what happened; the chips
// point at its own radios instead of adding a second question.
const ROADSIDE_ISSUES = [
  ["no-start", "Will not start", "No arranca"],
  ["tire", "Flat or blowout", "Llanta ponchada"],
  ["heat", "Overheating", "Se calienta"],
  ["warning", "Warning light", "Luz de aviso"],
  ["other", "Something else", "Otra cosa"],
];

const STARTED = [
  ["today", "Today", "Hoy"],
  ["week", "This week", "Esta semana"],
  ["while", "A while ago", "Hace tiempo"],
];

// The promise with one word marked by a hand drawn underline. Three pairs so
// each part survives the language toggle.
const PROMISE = {
  "repair-estimate": [["Tell us what it is", "Cuéntenos qué le"], ["doing", "pasa"], [". We will tell you what it needs.", ". Le diremos qué necesita."]],
  "tire-quote": [["Tell us your tire", "Díganos la"], ["size", "medida"], [". We will check what fits.", " de su llanta. Revisamos qué le queda."]],
  roadside: [["Broken down? Call", "¿Se descompuso? Llame"], ["first", "primero"], [". Everything else can wait.", ". Lo demás puede esperar."]],
};

const UNDERLINE = "<svg class=\"nb-mark__line\" viewBox=\"0 0 120 14\" preserveAspectRatio=\"none\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M3 9.5C22 4.5 44 3.8 64 6.2S101 11.8 117 5\" pathLength=\"1\"/></svg>";

// No photo art: an open bay door, a two post lift and a car raised on it.
const BAY_ART = `<svg class="nb-art" viewBox="0 0 520 340" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M20 322h480"/><path d="M40 322V92l220-62 220 62v230"/><path d="M78 322V120h364v202"/>
<path d="M78 132h364M78 146h364M78 160h364" opacity=".55"/>
<path d="M118 322V176M402 322V176"/><path d="M110 176h16M394 176h16"/><path d="M118 238h54M402 238h-54"/>
<path d="M146 236v-6q0-8 10-10l64-10q34-28 78-30h40q34 2 58 26l32 6q12 3 12 16v8q0 4-6 4h-56a22 22 0 0 0-44 0H206a22 22 0 0 0-44 0h-12q-4 0-4-4z"/>
<circle cx="184" cy="234" r="17"/><circle cx="184" cy="234" r="6"/><circle cx="356" cy="234" r="17"/><circle cx="356" cy="234" r="6"/>
<path d="M236 206q26-20 58-22h32q24 2 42 18z" opacity=".7"/><path d="M300 184v22" opacity=".7"/>
<path d="M458 206h26v78h-26z" opacity=".5"/><path d="M466 222h10M466 238h10M466 254h10" opacity=".5"/>
</svg>`;

const CSS = `
:root{--display:"Archivo","Archivo Fallback",sans-serif;--body:"Public Sans",system-ui,sans-serif;--radius:6px;--btn-radius:6px;--max:1200px;--ease:cubic-bezier(.22,1,.36,1);--field:#fff;--field-line:color-mix(in oklab,var(--ink) 22%,transparent);--chip-radius:6px;--lang-fg:var(--ink);--lang-on:var(--bg)}
body{font-family:var(--body);font-size:1.0625rem;line-height:1.6}
h1,h2,h3{font-family:var(--display);font-stretch:118%}
.nb-peg{background-color:var(--bg);background-image:radial-gradient(circle,var(--peg) 2.2px,transparent 2.8px);background-size:24px 24px;background-position:12px 12px}

.nb-util{background:var(--deep);color:var(--on-deep);font-size:.875rem}
.nb-util__in{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem 1.5rem;min-height:2.5rem;padding:.35rem 0}
.nb-util__item{display:inline-flex;align-items:center;gap:.4rem;color:var(--deep-muted)}
.nb-util__item .ico{width:1rem;height:1rem;color:var(--on-deep)}
.nb-util a{color:var(--on-deep);font-weight:600;text-decoration:none}
.nb-util__tel{margin-left:auto}
@media (max-width:759.98px){.nb-util__hide{display:none}.nb-util__tel{margin-left:0}}

.b-hd{position:sticky;top:0;z-index:10;background:var(--surface);border-bottom:1px solid var(--line)}
.b-hd__in{display:flex;align-items:center;gap:1.25rem;min-height:4.25rem}
.b-brand{margin-right:auto;font-family:var(--display);font-weight:800;font-stretch:125%;font-size:1.15rem;letter-spacing:-.01em;line-height:1.05;text-decoration:none;text-transform:uppercase;max-width:62vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.b-nav{display:none;gap:1.75rem;font-weight:600;font-size:.95rem}
.b-nav a{text-decoration:none;color:var(--muted)}
.b-nav a:hover{color:var(--ink)}
@media (min-width:1000px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:.9rem}
.b-hd__tel{display:none;align-items:center;gap:.4rem;font-weight:700;text-decoration:none}
@media (min-width:760px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.75rem;padding:.55rem 1.1rem;border-radius:var(--btn-radius);background:var(--primary);color:var(--on-primary);font-weight:700;text-decoration:none}

.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;min-height:3.25rem;padding:.85rem 1.35rem;border-radius:var(--btn-radius);font-weight:700;text-decoration:none;border:2px solid transparent;transition:transform .3s var(--ease),background-color .2s,color .2s}
.nb-btn:hover{transform:translateY(-2px)}
.nb-btn--go{background:var(--primary);color:var(--on-primary)}
.nb-btn--line{border-color:var(--ink);color:var(--ink);background:var(--surface)}
.nb-btn--line:hover{background:var(--ink);color:var(--surface)}
.nb-btn .b-arrow{display:inline-flex}

.nb-hero{position:relative;padding:clamp(2.5rem,6vw,5rem) 0 clamp(3rem,7vw,5.5rem);border-bottom:1px solid var(--line)}
.nb-hero__grid{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(2.25rem,5vw,4rem);align-items:start}
@media (min-width:980px){.nb-hero__grid{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);align-items:center}}
.nb-eyebrow{display:inline-flex;align-items:center;gap:.5rem;padding:.35rem .75rem;border-radius:999px;background:var(--surface);border:1px solid var(--line);font-weight:600;font-size:.9rem;color:var(--muted)}
.nb-eyebrow .ico{width:1rem;height:1rem;color:var(--accent)}
.nb-name{margin-top:1rem;font-weight:800;font-stretch:125%;line-height:.94;letter-spacing:-.02em;text-transform:uppercase;font-size:var(--nsize);overflow-wrap:break-word}
.name--xl{--nsize:clamp(2.6rem,8.4vw,5.6rem)}
.name--l{--nsize:clamp(2.3rem,6.6vw,4.6rem)}
.name--m{--nsize:clamp(2rem,5.4vw,3.8rem)}
.name--s{--nsize:clamp(1.75rem,4.4vw,3rem)}
.nb-hero .b-rating--chip{display:inline-flex;align-items:center;gap:.5rem;margin-top:1rem;font-weight:700}
.nb-hero .b-rating--chip .stars{width:5.5rem;height:1.1rem;color:var(--accent)}
.nb-hero .b-rating--chip .b-rating__count{font-weight:500;color:var(--muted)}
@media (min-width:980px){.nb-hero__copy>.b-rating--chip{display:none}}
.nb-promise{margin-top:1.25rem;max-width:30ch;font-family:var(--display);font-weight:600;font-stretch:112%;font-size:clamp(1.35rem,2.4vw,1.85rem);line-height:1.2;letter-spacing:-.01em}
.nb-mark{position:relative;display:inline-block;white-space:nowrap}
.nb-mark__line{position:absolute;left:-2%;right:-2%;bottom:-.3em;width:104%;height:.42em;overflow:visible}
.nb-mark__line path{fill:none;stroke:var(--accent);stroke-width:3.5;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:0;animation:nb-draw 1.1s .45s var(--ease) both}
@keyframes nb-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
.nb-about{margin-top:1rem;max-width:52ch;color:var(--muted)}
.nb-ask{margin-top:2rem}
.nb-ask__q{font-weight:700;font-size:.95rem}
.nb-chips{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.7rem}
.nb-chip{flex:none;display:inline-flex;align-items:center;gap:.45rem;min-height:2.75rem;padding:.55rem .95rem;border:1.5px solid var(--field-line);border-radius:6px;background:var(--surface);font-weight:600;font-size:.95rem;cursor:pointer;user-select:none;transition:background-color .2s,border-color .2s,color .2s,transform .2s var(--ease)}
.nb-chip::before{content:"";width:.7rem;height:.7rem;border-radius:2px;border:1.5px solid currentColor;transition:background-color .2s}
.nb-chip:hover{border-color:var(--ink);transform:translateY(-1px)}
@media (max-width:759.98px){.nb-chips{flex-wrap:nowrap;overflow-x:auto;margin-inline:-1rem;padding:0 1rem .35rem;scroll-snap-type:x proximity;scrollbar-width:none}.nb-chips::-webkit-scrollbar{display:none}.nb-chip{scroll-snap-align:start}.b-brand{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:1rem}}
.nb-ctas{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.75rem}
.nb-picked{display:none;margin-top:.75rem;font-size:.9rem;font-weight:600;color:var(--muted)}

.nb-card{position:relative;filter:drop-shadow(0 18px 30px rgb(0 0 0 / .12)) drop-shadow(0 2px 3px rgb(0 0 0 / .08))}
.nb-ro{position:relative;padding:1.75rem clamp(1.25rem,3vw,2rem) 1.5rem;background:var(--paper);color:var(--ink);-webkit-mask:radial-gradient(circle 6px at 50% 0,#0000 97%,#000 100%) 0 0/18px 100% repeat-x;mask:radial-gradient(circle 6px at 50% 0,#0000 97%,#000 100%) 0 0/18px 100% repeat-x;border-radius:0 0 6px 6px}
@media (min-width:980px){.nb-hero--card .nb-card{transform:rotate(1.2deg)}}
.nb-ro__top{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;padding-bottom:.75rem;border-bottom:2px solid var(--ink)}
.nb-ro__top{flex-wrap:wrap}.nb-ro__title{white-space:nowrap;font-family:var(--display);font-weight:800;font-stretch:125%;text-transform:uppercase;font-size:1.05rem;letter-spacing:.02em}
.nb-ro__date{font-size:.85rem;color:var(--muted);font-variant-numeric:tabular-nums}
.nb-ro .b-rating{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem 1rem;padding:1rem 0;border-bottom:1.5px dashed var(--line)}
.nb-ro .b-rating__num{font-family:var(--display);font-weight:800;font-stretch:112%;font-size:3.25rem;line-height:.9;letter-spacing:-.02em}
.nb-ro .b-rating__side{display:grid;gap:.25rem}
.nb-ro .stars{width:6.5rem;height:1.3rem;color:var(--accent)}
.nb-ro .b-rating__count{font-weight:600}
.nb-ro .b-rating--figure{flex-direction:column;align-items:flex-start}
.nb-ro .b-rating__cap{flex-basis:100%;font-size:.875rem;color:var(--muted)}
.nb-ro__facts{margin:0}
.nb-ro__facts div{display:grid;grid-template-columns:4.75rem 1fr;gap:.75rem;padding:.7rem 0;border-bottom:1.5px dashed var(--line)}
.nb-ro__facts dt{font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);padding-top:.15rem}
.nb-ro__facts dd{margin:0;font-weight:600}
.nb-ro__facts dd.nb-soft{font-weight:500;color:var(--muted)}
.nb-ro .dir{display:inline-flex;align-items:center;gap:.4rem;margin-top:.9rem;font-weight:700;font-size:.95rem}
.nb-ro__call{display:flex;width:100%;margin-top:1.1rem}
.nb-ro__sig{display:flex;align-items:flex-end;gap:.75rem;margin-top:1.1rem;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.nb-ro__sig::after{content:"";flex:1;border-bottom:1px solid var(--muted);transform:translateY(-.3em)}

.nb-hero--photo .nb-side{position:relative}
.nb-hero--photo .b-photo{aspect-ratio:4/3;border-radius:6px;box-shadow:0 22px 40px -22px rgb(0 0 0 / .45)}
.nb-hero--photo .b-photo img{filter:sepia(.12) saturate(1.05) contrast(1.02)}
.nb-hero--photo .stock-tag{left:auto;right:.6rem;top:.6rem;bottom:auto}
.nb-hero--photo .nb-card{margin:-2.5rem auto 0;width:calc(100% - 1.5rem)}
@media (min-width:980px){.nb-hero--photo .nb-card{position:relative;margin:-5.5rem 0 0 -2.5rem;width:21rem}}
.nb-hero--photo .nb-ro__sig{display:none}
.nb-hero--photo .nb-noart{display:grid;place-items:center;aspect-ratio:4/3;border-radius:6px;background:var(--surface);color:var(--deep);border:1px solid var(--line)}
.nb-hero--photo .nb-noart .nb-art{width:84%}

.nb-sec{padding:clamp(4rem,9vw,7rem) 0}
.nb-sec--white{background:var(--surface)}
.nb-sec--deep{background:var(--deep);color:var(--on-deep)}
.nb-head{display:grid;gap:.9rem;max-width:44rem}
.nb-h2{font-weight:800;font-size:clamp(2rem,4.6vw,3.3rem);line-height:1;letter-spacing:-.02em}
.nb-lede{color:var(--muted);max-width:56ch}
.nb-sec--deep .nb-lede{color:var(--deep-muted)}

.b-svc{margin-top:2.5rem}
.b-svc--list{display:grid;gap:0 3.5rem}
@media (min-width:820px){.b-svc--list{grid-template-columns:1fr 1fr}}
.b-svc--list .b-svc__item{display:flex;align-items:center;gap:.9rem;padding:1.05rem 0;border-bottom:1.5px solid var(--line);font-weight:600;font-size:1.15rem}
.b-svc--list .b-svc__item::before{content:"";flex:none;width:.6rem;height:.6rem;border-radius:50%;background:var(--accent)}
.b-svc--chips{display:flex;flex-wrap:wrap;gap:1.25rem .9rem;padding-top:.5rem}
.b-svc--chips .b-svc__item a{position:relative;display:inline-flex;align-items:center;gap:.6rem;min-height:3rem;padding:.7rem 1.1rem .7rem 2.1rem;border:1.5px solid var(--ink);border-radius:4px 14px 14px 4px;background:var(--paper);font-weight:700;text-decoration:none;box-shadow:3px 3px 0 var(--peg);transition:transform .25s var(--ease),box-shadow .25s}
.b-svc--chips .b-svc__item a::before{content:"";position:absolute;left:.75rem;top:50%;width:.55rem;height:.55rem;margin-top:-.275rem;border-radius:50%;border:1.5px solid var(--ink);background:var(--bg)}
.b-svc--chips .b-svc__item:nth-child(3n+1) a{transform:rotate(-1.2deg)}
.b-svc--chips .b-svc__item:nth-child(3n+2) a{transform:rotate(.8deg)}
.b-svc--chips .b-svc__item a:hover{transform:translateY(-3px) rotate(0);box-shadow:5px 6px 0 var(--peg)}
.b-svc-confirm{margin-top:1.75rem;font-weight:600;color:var(--muted);font-size:.95rem}
.svc-note{margin-top:.35rem;color:var(--muted);font-size:.9rem}

.nb-themes .b-themes{display:grid;gap:1rem;margin-top:2.5rem}
@media (min-width:760px){.nb-themes .b-themes{grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))}}
.nb-themes .b-themes li{position:relative;padding:1.6rem 1.35rem 1.35rem;background:var(--paper);border:1px solid var(--line);border-radius:4px;font-family:var(--display);font-weight:700;font-stretch:112%;font-size:1.3rem;line-height:1.2;box-shadow:0 10px 24px -18px rgb(0 0 0 / .5)}
.nb-themes .b-themes li::before{content:"";position:absolute;top:.6rem;left:50%;width:.7rem;height:.7rem;margin-left:-.35rem;border-radius:50%;background:var(--accent);box-shadow:0 2px 0 rgb(0 0 0 / .2)}
.nb-themes .b-themes li:nth-child(even){transform:rotate(.6deg)}
.nb-themes .b-themes li:nth-child(odd){transform:rotate(-.5deg)}
.b-themes__note{margin-top:1.5rem;color:var(--muted);font-size:.9rem}

.nb-steps{display:grid;gap:1.25rem;margin-top:3rem;counter-reset:st}
@media (min-width:860px){.nb-steps{grid-template-columns:repeat(3,minmax(0,1fr));gap:2rem}}
.nb-steps li{position:relative;display:grid;align-content:start;grid-template-columns:3.25rem 1fr;gap:1rem;align-items:start}
@media (min-width:860px){.nb-steps li{grid-template-columns:1fr;gap:1.1rem}.nb-steps li:not(:last-child)::after{content:"";position:absolute;top:1.6rem;left:4.25rem;right:-1rem;border-top:2px dashed color-mix(in oklab,var(--on-deep) 35%,transparent)}}
.nb-steps .nb-step__n{display:grid;place-items:center;width:3.25rem;height:3.25rem;border-radius:50%;background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:800;font-size:1.35rem}
.nb-steps h3{font-weight:800;font-size:1.4rem;line-height:1.1;letter-spacing:-.01em}
.nb-steps p{margin-top:.4rem;color:var(--deep-muted);max-width:34ch}

.nb-bay .b-gallery{display:grid;gap:1rem;margin-top:2.5rem;grid-template-columns:1fr}
@media (min-width:700px){.nb-bay .b-gallery{grid-template-columns:repeat(3,minmax(0,1fr))}}
.nb-bay .b-gallery__tile{aspect-ratio:4/3;border-radius:6px;overflow:hidden}
.nb-bay .b-gallery__tile img{filter:sepia(.12) saturate(1.05);transition:transform .8s var(--ease)}
.nb-bay .b-gallery__tile:hover img{transform:scale(1.03)}
.nb-bay .b-gallery__empty{display:grid;place-items:center;background:var(--surface);border:1.5px dashed var(--field-line);color:var(--muted);font-weight:600}
.nb-bay__note{margin-top:1rem;font-size:.9rem;color:var(--muted)}

.nb-req{display:grid;gap:2.5rem}
@media (min-width:980px){.nb-req{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem;align-items:start}.nb-req__side{position:sticky;top:6rem}}
.nb-req__list{display:grid;gap:.7rem;margin-top:1.75rem}
.nb-req__list li{display:flex;gap:.65rem;align-items:flex-start;font-weight:600}
.nb-req__list .ico{margin-top:.2rem;color:var(--accent)}
.nb-req__side .nb-btn{margin-top:1.75rem}
.nb-form{padding:clamp(1.25rem,3.5vw,2.25rem);background:var(--paper);border:1px solid var(--line);border-top:6px solid var(--deep);border-radius:0 0 6px 6px;box-shadow:0 24px 50px -30px rgb(0 0 0 / .4)}
.nb-form__top{display:flex;justify-content:space-between;gap:1rem;margin-bottom:1.5rem;padding-bottom:.9rem;border-bottom:2px solid var(--ink);font-family:var(--display);font-weight:800;font-stretch:125%;text-transform:uppercase;font-size:.95rem}
.nb-form__top span+span{font-family:var(--body);font-weight:500;text-transform:none;font-stretch:100%;color:var(--muted)}
.f-input{border-radius:4px;background:#fff}
.f-chip>span{font-weight:600}
.f-chip input:checked+span{background:var(--deep);color:var(--on-deep);border-color:var(--deep)}
.f-submit{border-radius:6px;min-height:3.4rem}
.f-status{border-width:2px}

.nb-visit{display:grid;gap:3rem;align-items:center}
@media (min-width:900px){.nb-visit{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:5rem}}
.nb-visit__art{color:var(--deep);max-width:34rem}
.nb-art{width:100%;height:auto}
.facts{margin:1.75rem 0 0}
.facts div{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:.95rem 0;border-bottom:1.5px solid var(--line)}
.facts div:first-child{border-top:1.5px solid var(--line)}
.facts dt{font-weight:700;font-size:.85rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);padding-top:.15rem}
.facts dd{margin:0;font-weight:600}
.b-visit__pending{display:grid;gap:.45rem;margin-top:1.25rem;color:var(--muted)}
.b-visit__pending li{display:flex;gap:.5rem}
.b-visit__pending li::before{content:"";flex:none;width:.5rem;height:.5rem;margin-top:.6rem;border-radius:1px;background:var(--accent)}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-weight:700}

.nb-faq .faq{margin-top:2rem;max-width:52rem}
.faq summary{font-family:var(--display);font-weight:700;font-stretch:112%;font-size:1.2rem}
.faq details{border-color:var(--line)}

.nb-close{padding:clamp(4rem,9vw,6.5rem) 0;background:var(--primary);color:var(--on-primary)}
.nb-close__in{display:grid;gap:1.5rem;justify-items:start}
.nb-close__q{font-family:var(--display);font-weight:800;font-stretch:118%;font-size:clamp(1.6rem,3.6vw,2.6rem);line-height:1.05;letter-spacing:-.01em}
.nb-close__tel{font-family:var(--display);font-weight:800;font-stretch:125%;font-size:clamp(2.4rem,8vw,5.5rem);line-height:.95;letter-spacing:-.02em;text-decoration:none;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.nb-close__tel:hover{text-decoration:underline;text-decoration-thickness:4px;text-underline-offset:.12em}
.nb-close .nb-btn{background:var(--ink);color:var(--bg)}

.b-ft{background:var(--deep);color:var(--on-deep);padding:3.5rem 0 2.5rem}
.b-ft__name{font-family:var(--display);font-weight:800;font-stretch:125%;text-transform:uppercase;font-size:clamp(1.6rem,4vw,2.4rem);line-height:1}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;color:var(--deep-muted)}
.b-ft__row a{color:var(--on-deep);font-weight:700}
.legal{margin-top:1.75rem;font-size:.85rem;color:var(--deep-muted)}
.stock-credits{margin-top:.5rem;color:var(--deep-muted)}
.callbar{border-radius:8px;background:var(--primary);color:var(--on-primary)}
`;

// Marks a form's existing radios with ids so labels elsewhere can tick them.
function tagRadios(form, name, prefix) {
  const re = new RegExp(`<input type="radio" name="${name}" value="([^"]*)"`, "g");
  return form.replace(re, (_, v) => `<input type="radio" id="${prefix}-${v}" name="${name}" value="${v}"`);
}

function chipFieldset(ctx, { name, prefix, legend, options }) {
  const items = options.map(([v, en, es]) => `<label class="f-chip"><input type="radio" id="${prefix}-${v}" name="${name}" value="${v}"><span>${ctx.t(en, es)}</span></label>`).join("");
  return `<fieldset class="f-field"><legend>${ctx.t(legend[0], legend[1])}</legend><div class="f-chips">${items}</div></fieldset>`;
}

// The request form with the concern question first, and the list of
// [id, en, es] the hero chips point at.
function concernForm(ctx) {
  if (ctx.kind === "roadside") {
    return { form: tagRadios(ctx.form, "issue", "rq-issue"), options: ROADSIDE_ISSUES.map(([v, en, es]) => [`rq-issue-${v}`, en, es]) };
  }
  const list = CONCERNS[ctx.categoryKey] || CONCERNS["auto-repair"];
  const legend = ctx.kind === "tire-quote" ? ["What do you need?", "¿Qué necesita?"] : ["Which sounds closest?", "¿Cuál se parece más?"];
  let extra = chipFieldset(ctx, { name: "concern", prefix: "rq-concern", legend, options: list });
  if (ctx.kind === "repair-estimate") extra += chipFieldset(ctx, { name: "started", prefix: "rq-started", legend: ["When did it start?", "¿Cuándo empezó?"], options: STARTED });
  const form = ctx.form.replace(/(<form\b[^>]*>)/, `$1\n${extra}`);
  return { form, options: list.map(([v, en, es]) => [`rq-concern-${v}`, en, es]) };
}

// Picked chips look pressed, and the hero confirms the pick is in the form.
function pickedCss(options) {
  if (!options.length) return "";
  const on = options.map(([id]) => `:root:has(#${id}:checked) .nb-chip[for="${id}"]`).join(",");
  const any = options.map(([id]) => `:root:has(#${id}:checked) .nb-picked`).join(",");
  return `${on}{background:var(--deep);color:var(--on-deep);border-color:var(--deep)}${options.map(([id]) => `:root:has(#${id}:checked) .nb-chip[for="${id}"]::before`).join(",")}{background:var(--accent);border-color:var(--accent)}${any}{display:block}`;
}

function promiseHtml(ctx) {
  if (ctx.copy.headline) return promiseLine(ctx);
  const parts = PROMISE[ctx.kind];
  if (!parts) return promiseLine(ctx);
  const [a, mark, b] = parts;
  return `${ctx.t(a[0], a[1])} <span class="nb-mark">${ctx.t(mark[0], mark[1])}${UNDERLINE}</span>${ctx.t(b[0], b[1])}`;
}

function repairOrder(ctx, { proof, sig = true }) {
  const t = ctx.t;
  const hoursRow = ctx.hours
    ? `<div><dt>${t("Hours", "Horario")}</dt><dd>${esc(ctx.hours)}</dd></div>`
    : `<div><dt>${t("Open", "Abierto")}</dt><dd class="nb-soft">${t("Hours to confirm. Call first.", "Horario por confirmar. Llame antes.")}</dd></div>`;
  const where = ctx.address ? `${esc(ctx.address)}, ${esc(ctx.cityState)}` : esc(ctx.placeRaw);
  const call = callButton(ctx, { cls: "nb-btn nb-btn--go nb-ro__call", label: ["Call", "Llamar"] });
  return `<div class="nb-card"><div class="nb-ro">
<div class="nb-ro__top"><span class="nb-ro__title">${t("Repair order", "Orden de servicio")}</span><span class="nb-ro__date">${t(ctx.monthYear[0], ctx.monthYear[1])}</span></div>
${ratingProof(ctx, proof, { caption: true })}
<dl class="nb-ro__facts"><div><dt>${t("Shop", "Taller")}</dt><dd>${ctx.name}</dd></div>${hoursRow}<div><dt>${t("Where", "Dónde")}</dt><dd>${where}</dd></div></dl>
${directionsLink(ctx, "dir")}
${call || bookButton(ctx, { cls: "nb-btn nb-btn--go nb-ro__call", ico: "arrow", label: shortCta(ctx) })}
${sig ? `<p class="nb-ro__sig" aria-hidden="true">${t("Customer", "Cliente")}</p>` : ""}
</div></div>`;
}

function render(ctx) {
  const t = ctx.t;
  const hero = ctx.variants.hero === "photo" ? "photo" : "card";
  const proof = ctx.variants.proof === "figure" ? "figure" : "strip";
  const svcVariant = ctx.variants.services === "tags" ? "chips" : "list";
  const { form, options } = concernForm(ctx);

  const util = `<div class="nb-util"><div class="wrap nb-util__in">
<span class="nb-util__item">${icon("pin")}<span>${esc(ctx.address || ctx.placeRaw)}</span></span>
<span class="nb-util__item nb-util__hide">${icon("clock")}<span>${ctx.hours ? esc(ctx.hours) : t("Hours to confirm", "Horario por confirmar")}</span></span>
${ctx.tel ? `<a class="nb-util__item nb-util__tel" href="${esc(ctx.tel)}">${icon("phone")}<span>${esc(ctx.phone)}</span></a>` : ""}
</div></div>`;

  const nav = [
    ctx.services.length ? { href: "#services", label: ["Services", "Servicios"] } : null,
    { href: "#how", label: ["How it works", "Cómo funciona"] },
    { href: "#visit", label: ["Visit", "Visítenos"] },
  ].filter(Boolean);
  const header = siteHeader(ctx, { nav, cta: shortCta(ctx), phone: false });

  const chips = options.map(([id, en, es]) => `<label class="nb-chip" for="${id}">${t(en, es)}</label>`).join("");
  const askQ = ctx.kind === "tire-quote" ? ["What do you need?", "¿Qué necesita?"] : ctx.kind === "roadside" ? ["What happened?", "¿Qué pasó?"] : ["What is it doing?", "¿Qué está haciendo?"];
  const copy = `<div class="nb-hero__copy">
<p class="nb-eyebrow">${icon("pin")}<span>${ctx.categoryT}, ${esc(ctx.placeRaw)}</span></p>
<h1 class="nb-name name--${ctx.nameScale}">${ctx.name}</h1>
${ratingProof(ctx, "chip")}
<p class="nb-promise">${promiseHtml(ctx)}</p>
${ctx.about ? `<p class="nb-about">${ctx.about}</p>` : ""}
<div class="nb-ask"><p class="nb-ask__q" id="nb-ask">${t(askQ[0], askQ[1])}</p><div class="nb-chips" aria-hidden="true">${chips}</div><p class="nb-picked" aria-hidden="true">${t("Added to your request below.", "Agregado a su solicitud abajo.")}</p></div>
<div class="nb-ctas">${bookButton(ctx, { cls: "nb-btn nb-btn--go", ico: "", arrow: true })}${callButton(ctx, { cls: "nb-btn nb-btn--line" })}</div>
</div>`;

  let side;
  if (hero === "photo") {
    const photo = heroPhoto(ctx, { sizes: "(min-width: 980px) 42vw, 100vw", tag: true, width: 1200 });
    side = `<div class="nb-side">${photo || `<div class="nb-noart">${BAY_ART}</div>`}${repairOrder(ctx, { proof, sig: false })}</div>`;
  } else {
    side = `<div class="nb-side">${repairOrder(ctx, { proof })}</div>`;
  }
  const heroHtml = `<section class="nb-hero nb-hero--${hero} nb-peg" id="top"><div class="wrap nb-hero__grid">${copy}${side}</div></section>`;

  const services = ctx.services.length
    ? `<section class="nb-sec nb-sec--white" id="services"><div class="wrap"><div class="nb-head"><h2 class="nb-h2">${t("What the shop works on", "En qué trabaja el taller")}</h2><p class="nb-lede">${t("Tap one to start a request, or call and describe it in your own words.", "Toque uno para empezar una solicitud, o llame y descríbalo con sus palabras.")}</p></div>${servicesList(ctx, svcVariant, { link: true, numbered: false })}${servicesConfirm(ctx)}</div></section>`
    : "";

  const themes = ctx.themes.length
    ? `<section class="nb-sec nb-peg nb-themes"><div class="wrap"><div class="nb-head"><h2 class="nb-h2">${t("What customers mention", "Lo que mencionan los clientes")}</h2></div>${themesBlock(ctx)}</div></section>`
    : "";

  const steps = stepsFor(ctx);
  const how = `<section class="nb-sec nb-sec--deep" id="how"><div class="wrap"><div class="nb-head"><h2 class="nb-h2">${t("How a visit works", "Cómo es una visita")}</h2><p class="nb-lede">${t("No mystery, start to finish. Ask anything along the way.", "Sin misterio, de principio a fin. Pregunte lo que quiera.")}</p></div><ol class="nb-steps">${steps.map((s, i) => `<li class="rv"><span class="nb-step__n" aria-hidden="true">${i + 1}</span><div><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></div></li>`).join("")}</ol></div></section>`;

  const shots = ctx.photos.enabled
    ? `<section class="nb-sec nb-bay"><div class="wrap"><div class="nb-head"><h2 class="nb-h2">${t("In the bay", "En el taller")}</h2></div>${gallery(ctx, { count: 3, tag: true, sizes: "(min-width: 700px) 33vw, 100vw", width: 800 })}<p class="nb-bay__note">${t("Stock photos for now. The shop's own bays and crew go here.", "Fotos de archivo por ahora. Aquí van el taller y el equipo reales.")}</p></div></section>`
    : "";

  const fh = formHeading(ctx);
  const request = `<section class="nb-sec nb-sec--white" id="${REQUEST_ID}"><div class="wrap nb-req"><div class="nb-req__side"><h2 class="nb-h2">${fh.title}</h2><p class="nb-lede" style="margin-top:1rem">${fh.intro}</p><ul class="nb-req__list"><li>${icon("check")}<span>${t("Pick what it is doing", "Elija qué está haciendo")}</span></li><li>${icon("check")}<span>${t("Add the car", "Agregue el vehículo")}</span></li><li>${icon("check")}<span>${t("Leave a number for the callback", "Deje un número para regresarle la llamada")}</span></li></ul>${callButton(ctx, { cls: "nb-btn nb-btn--line", label: ["Rather talk? Call", "¿Prefiere hablar? Llame al"] })}</div><div class="nb-form"><p class="nb-form__top" aria-hidden="true"><span>${t("Service request", "Solicitud de servicio")}</span><span>${esc(ctx.nameRaw)}</span></p>${form}</div></div></section>`;

  const visit = `<section class="nb-sec nb-peg" id="visit"><div class="wrap nb-visit"><div><h2 class="nb-h2">${t("Hours and where to find us", "Horario y dónde estamos")}</h2><p class="nb-lede" style="margin-top:1rem">${t(`Serving drivers in and around ${ctx.cityRaw || "the area"}.`, `Atendiendo a conductores en ${ctx.cityRaw || "la zona"} y alrededores.`)}</p>${visitDetails(ctx)}</div><div class="nb-visit__art">${BAY_ART}</div></div></section>`;

  const faq = `<section class="nb-sec nb-sec--white nb-faq" id="faq"><div class="wrap"><h2 class="nb-h2">${t("Good questions", "Buenas preguntas")}</h2>${faqBlock(ctx)}</div></section>`;

  const close = `<section class="nb-close"><div class="wrap nb-close__in"><p class="nb-close__q">${t("Car acting up? Call the shop.", "¿El carro falla? Llame al taller.")}</p>${ctx.tel ? `<a class="nb-close__tel" href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}${bookButton(ctx, { cls: "nb-btn", ico: "", arrow: true, label: shortCta(ctx) })}</div></section>`;

  return {
    css: CSS + pickedCss(options),
    body: `${util}${header}<main>${heroHtml}${services}${themes}${how}${shots}${request}${visit}${faq}${close}</main>${siteFooter(ctx)}`,
  };
}

export const direction = {
  key: "auto-neighborhood-bay",
  label: "Neighborhood service bay",
  status: "implemented",
  suits: ["auto-repair", "tire-shop", "muffler-exhaust", "mobile-mechanic"],
  keywords: ["neighborhood", "family", "heritage", "owner", "local", "trust", "high trust"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@112..125,600..800&family=Public+Sans:wght@400;500;600;700&display=swap",
  palettes: PALETTES,
  variants: { hero: ["card", "photo"], services: ["columns", "tags"], proof: ["strip", "figure"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /shop-bay|tire-change|under-lift|underside/ },
  callbar: "call",
  render,
};
