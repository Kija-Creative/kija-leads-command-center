// Fab shop (research/design-auto.md, direction 8). Craftsmen who bend metal:
// painted sign and poster energy, a little rough, proud of the work. The name
// is set like a hand lettered shop sign on grained stock, a mandrel bent pipe
// draws itself across the hero, and a stamped badge carries the city and the
// Google rating. Inside: a black menu board, sound and symptom tags that travel
// with the request, a hand drawn process path, review themes as rubber stamps,
// weld bead dividers and torn paper edges. Photos run black and white with one
// spot color. No script: the tags are native radios read by :has(), tied to the
// request form through the form attribute.

import {
  faqBlock,
  formHeading,
  photoFrame,
  ratingProof,
  REQUEST_ID,
  servicesConfirm,
  servicesList,
  siteFooter,
  siteHeader,
  themesBlock,
  uid,
  visitDetails,
} from "../blocks.js";
import { stepsFor } from "../copy.js";
import { esc, icon } from "../shared.js";

const PALETTES = [
  { key: "fab-sign", name: "Shop sign", vars: { bg: "#f3ecdc", surface: "#e9dfc8", ink: "#151515", muted: "#554d3c", line: "#cfc2a6", primary: "#c1272d", "on-primary": "#ffffff", accent: "#c8a97e", hero: "#f3ecdc", "on-hero": "#151515", board: "#151515", "on-board": "#f3ecdc", "board-muted": "#bdb198", stamp: "#c1272d", badge: "#c1272d", ticket: "#fbf7ee", steel: "#8d949c", "steel-hi": "#e7eaed", heat: "#b9783f" } },
  { key: "fab-steel", name: "Blued steel", vars: { bg: "#1d2430", surface: "#252e3c", ink: "#eee8dc", muted: "#b9b2a5", line: "#3b4657", primary: "#d08a4c", "on-primary": "#11151c", accent: "#3c6e91", hero: "#1d2430", "on-hero": "#eee8dc", board: "#11151c", "on-board": "#eee8dc", "board-muted": "#a8a295", stamp: "#d08a4c", badge: "#d08a4c", ticket: "#eee8dc", steel: "#7f95a8", "steel-hi": "#e8f0f6", heat: "#3c6e91" } },
  { key: "fab-olive", name: "Olive drab", vars: { bg: "#f1ebdd", surface: "#e6dec9", ink: "#1a1a17", muted: "#4f4f3c", line: "#cfc6ad", primary: "#e86a1c", "on-primary": "#1a1a17", accent: "#4b5320", hero: "#4b5320", "on-hero": "#f1ebdd", board: "#1a1a17", "on-board": "#f1ebdd", "board-muted": "#bfb8a2", stamp: "#c24f0d", badge: "#f1ebdd", ticket: "#faf6ec", steel: "#9aa0a0", "steel-hi": "#eef0ee", heat: "#e86a1c" } },
];

// What the car or truck is doing, as the customer would say it. Symptoms,
// never services: picking one says nothing about what the shop offers.
const SYMPTOMS = {
  "muffler-exhaust": [
    { key: "rattle", label: ["Rattle underneath", "Ruido abajo"] },
    { key: "loud", label: ["Loud exhaust", "Escape ruidoso"] },
    { key: "cel", label: ["Check engine light", "Luz de motor"] },
    { key: "smell", label: ["Smells like exhaust", "Huele a escape"] },
    { key: "tick", label: ["Hissing or ticking", "Silbido o tic tic"] },
    { key: "hanging", label: ["Something hanging", "Algo colgando"] },
  ],
  "diesel-truck-repair": [
    { key: "nostart", label: ["Will not start", "No arranca"] },
    { key: "smoke", label: ["Blowing smoke", "Echa humo"] },
    { key: "loud", label: ["Loud exhaust", "Escape ruidoso"] },
    { key: "derate", label: ["Warning light or derate", "Luz de aviso o pierde fuerza"] },
    { key: "leak", label: ["Leaking", "Tiene fuga"] },
    { key: "other", label: ["Something else", "Otra cosa"] },
  ],
  default: [
    { key: "squeal", label: ["Squeals when braking", "Rechina al frenar"] },
    { key: "cel", label: ["Check engine light", "Luz de motor"] },
    { key: "clunk", label: ["Rattle or clunk", "Golpeteo"] },
    { key: "ac", label: ["AC blows warm", "El aire no enfría"] },
    { key: "leak", label: ["Leak under the car", "Fuga debajo"] },
    { key: "smell", label: ["Strange smell", "Olor raro"] },
  ],
};

// A visit, the way a good shop explains it. Advice to the customer, never a
// promise from the shop.
const VISIT = [
  { title: ["Bring it by", "Tráigalo"], body: ["Pull in or call first. Say what it is doing and when.", "Llegue o llame antes. Diga qué hace y cuándo."] },
  { title: ["Get a look", "Revisión"], body: ["It goes up on the lift so the problem can be seen.", "Se sube al elevador para ver el problema."] },
  { title: ["Hear the plan", "El plan"], body: ["Ask what it needs and what it costs before you say yes.", "Pregunte qué necesita y cuánto cuesta antes de decir que sí."] },
  { title: ["Drive it home", "A casa"], body: ["Listen for the difference on the way out.", "Escuche la diferencia al salir."] },
];

// Torn paper edge: a fixed jag pattern, so every render is identical.
const JAG = [0, 1.4, 0.4, 2.1, 0.8, 1.6, 0.2, 1.9, 1.1, 0.5, 2.3, 0.9, 1.5, 0.3, 1.8, 0.7, 2, 1.2, 0.4, 1.7];
function tornEdge(top) {
  const pts = [];
  const n = 40;
  for (let i = 0; i <= n; i += 1) pts.push(`${((i / n) * 100).toFixed(2)}% ${top ? JAG[i % JAG.length].toFixed(1) : (100 - JAG[(i + 7) % JAG.length] * 1).toFixed(1)}%`);
  return pts;
}
const TORN = `polygon(${[...tornEdge(true), ...tornEdge(false).reverse()].join(",")})`;

const CSS = `
:root{--display:"Alfa Slab One",Rockwell,Georgia,serif;--body:"Libre Franklin",system-ui,sans-serif;--radius:4px;--btn-radius:4px;--chip-radius:3px;--max:1220px;--ease:cubic-bezier(.22,1,.36,1);--field:var(--ticket);--field-line:color-mix(in oklab,#151515 35%,transparent);--star:currentColor;--lang-fg:var(--ink);--lang-on:var(--bg);--bead:radial-gradient(circle at 50% 50%,var(--steel-hi) 0 1.5px,var(--steel) 2.5px,color-mix(in oklab,var(--steel) 55%,#000) 4.5px,transparent 5px) 0 50%/8px 10px repeat-x}
body{font-size:1.0625rem;line-height:1.6}
.fb-caps{font-family:var(--body);font-weight:800;text-transform:uppercase;letter-spacing:.08em}
.fb-slab{font-family:var(--display);font-weight:400;line-height:.95;letter-spacing:.005em}

.b-hd{position:sticky;top:0;z-index:10;background:var(--board);color:var(--on-board)}
.b-hd__in{display:flex;align-items:center;gap:1rem;min-height:4.25rem}
.b-brand{margin-right:auto;font-family:var(--display);font-size:1.4rem;line-height:1;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:62vw}
.b-hd__end{display:flex;align-items:center;gap:.75rem}
.b-hd__tel{display:none;align-items:center;gap:.45rem;font-weight:800;letter-spacing:.04em;text-decoration:none}
@media (min-width:760px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.75rem;padding:0 1.1rem;border-radius:var(--btn-radius);background:var(--primary);color:var(--on-primary);font-weight:800;font-size:.85rem;text-transform:uppercase;letter-spacing:.08em;text-decoration:none}
.b-hd .lang{--lang-fg:var(--on-board);--lang-on:var(--board);border-radius:3px}

.fb-grain{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.22;mix-blend-mode:multiply}
.fb-hero{position:relative;overflow:hidden;background:var(--hero);color:var(--on-hero);padding:clamp(2.5rem,6vw,5rem) 0 clamp(3.5rem,8vw,6.5rem);isolation:isolate}
.fb-hero__grid{position:relative;z-index:2;display:grid;gap:clamp(2rem,5vw,3.5rem);grid-template-columns:minmax(0,1fr)}
@media (min-width:960px){.fb-hero--poster .fb-hero__grid{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);align-items:center}.fb-hero--sign .fb-hero__grid{grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:3rem}.fb-hero--sign .fb-badge{position:relative;right:auto;top:auto;width:14rem}}
.fb-hero--sign .fb-sign{padding:clamp(1.25rem,3vw,2.25rem);border:3px solid currentColor;outline:1.5px solid currentColor;outline-offset:6px}
.fb-sign{position:relative;container-type:inline-size}
.fb-trade{display:flex;flex-wrap:wrap;gap:.35rem 1rem;font-size:.8rem}
.fb-trade span+span::before{content:"";display:inline-block;width:.5rem;height:.5rem;margin-right:1rem;border-radius:50%;background:var(--primary);vertical-align:.1em}
.fb-name{margin-top:1rem;font-size:min(6rem,calc(100cqi / (var(--nl) * .74)));color:var(--on-hero);text-wrap:balance;overflow-wrap:anywhere;text-shadow:3px 3px 0 color-mix(in oklab,var(--primary) 85%,transparent)}
.fb-rule{display:block;height:10px;margin-top:1.25rem;max-width:32rem;background:var(--bead)}
.fb-promise{margin-top:1.25rem;max-width:32ch;font-size:clamp(1.15rem,2vw,1.4rem);font-weight:600;line-height:1.35}
.fb-about{margin-top:.75rem;max-width:48ch;opacity:.85}
.fb-ctas{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}
.fb-btn{display:inline-flex;align-items:center;gap:.6rem;min-height:3.4rem;padding:0 1.4rem;border-radius:var(--btn-radius);font-weight:800;font-size:.95rem;text-transform:uppercase;letter-spacing:.08em;text-decoration:none;border:2px solid currentColor;transition:transform .25s var(--ease),box-shadow .25s var(--ease)}
.fb-btn:hover{transform:translate(-2px,-2px);box-shadow:4px 4px 0 currentColor}
@media (max-width:599.98px){.fb-btn--extra{display:none}}
.fb-btn--red{background:var(--primary);color:var(--on-primary);border-color:var(--primary)}
.fb-btn--red:hover{box-shadow:4px 4px 0 var(--on-hero)}
.fb-pipe{position:relative;z-index:1;margin:clamp(1.5rem,4vw,2.5rem) calc(50% - 50vw) 0;width:100vw;height:clamp(8rem,15vw,13rem)}
.fb-pipe svg{width:100%;height:100%;overflow:visible}
.fb-pipe path{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:var(--len);animation:kj-draw 2.6s var(--ease) .25s both}
.fb-pipe__out{stroke:color-mix(in oklab,var(--steel) 45%,#000);stroke-width:30}
.fb-pipe__body{stroke:var(--steel);stroke-width:24}
.fb-pipe__heat{stroke:var(--heat);stroke-width:24;stroke-opacity:.35}
.fb-pipe__hi{stroke:var(--steel-hi);stroke-width:4;stroke-opacity:.8;transform:translateY(-6px)}
.fb-pipe__bead{fill:none;stroke:var(--steel-hi);stroke-width:5;stroke-dasharray:2 5;opacity:0;animation:kj-fade .6s ease 2.4s both}
.fb-badge{position:absolute;z-index:3;right:clamp(0rem,3vw,2rem);top:clamp(-1rem,1vw,1rem);width:clamp(9.5rem,17vw,12.5rem);aspect-ratio:1;transform:rotate(-11deg);color:var(--badge);animation:fb-stamp .7s var(--ease) .9s both}
@keyframes fb-stamp{from{opacity:0;transform:rotate(-11deg) scale(1.5)}to{opacity:1;transform:rotate(-11deg) scale(1)}}
.fb-badge>svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.fb-badge__ring{font-family:var(--body);font-weight:800;font-size:13px;letter-spacing:.2em;text-transform:uppercase;fill:currentColor}
.fb-badge .b-rating{position:absolute;inset:22%;display:grid;place-items:center;align-content:center;gap:.1rem;text-align:center}
.fb-badge .b-rating__num{font-family:var(--display);font-size:clamp(2rem,4vw,2.9rem);line-height:.9}
.fb-badge .stars{width:4.5rem;height:.9rem;color:currentColor}
.fb-badge .b-rating__count{font-weight:800;font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;line-height:1.15}
@media (max-width:959.98px){.fb-badge{position:relative;right:auto;top:auto;margin:1.5rem 0 0 auto;width:9.5rem}}
.fb-hero--poster .fb-badge{right:auto;left:-1.5rem;top:auto;bottom:-1.5rem}
@media (max-width:959.98px){.fb-hero--poster .fb-badge{left:auto;bottom:auto;margin-top:-4rem;margin-right:.5rem}}
.fb-shot{position:relative;margin:0}
.fb-shot__frame{position:relative;aspect-ratio:4/5;clip-path:${TORN};background:var(--board)}
.fb-shot__frame .b-photo{position:absolute;inset:0}
.fb-shot__frame img{filter:grayscale(1) contrast(1.35) brightness(1.05)}
.fb-shot .stock-tag{left:auto;right:.75rem;bottom:auto;top:1.75rem}
.fb-shot__frame::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,color-mix(in oklab,var(--primary) 55%,transparent),transparent 45%);mix-blend-mode:multiply;pointer-events:none}
@media (max-width:959.98px){.fb-shot__frame{aspect-ratio:4/3}}

.fb-bead{height:12px;background:var(--bead);background-color:var(--bg)}
.fb-sec{position:relative;padding:clamp(4rem,9vw,7rem) 0}
.fb-sec--alt{background:var(--surface)}
.fb-h2{font-family:var(--display);font-weight:400;font-size:clamp(2.3rem,5.5vw,4.2rem);line-height:.98}
.fb-h2 em{font-style:normal;color:var(--primary)}
.fb-lede{margin-top:1rem;max-width:54ch;color:var(--muted);font-size:1.08rem}
.fb-head{display:grid;gap:1rem;align-items:end}
@media (min-width:900px){.fb-head{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:3.5rem}.fb-head .fb-lede{margin:0}}

.fb-board{position:relative;background:var(--board);color:var(--on-board);padding:clamp(5rem,10vw,8rem) 0;clip-path:${TORN};margin-block:-1.5rem}
.fb-board .fb-h2{color:var(--on-board)}
.fb-board .fb-lede{color:var(--board-muted)}
.fb-board__frame{margin-top:2.5rem;padding:clamp(1rem,3vw,2rem) clamp(1rem,3.5vw,2.5rem);border:2px solid color-mix(in oklab,var(--on-board) 30%,transparent);outline:1px solid color-mix(in oklab,var(--on-board) 15%,transparent);outline-offset:6px}
.b-svc{display:grid;gap:0 3.5rem}
.fb-svc--split .b-svc{grid-template-columns:minmax(0,1fr)}
@media (min-width:900px){.fb-svc--split .b-svc{grid-template-columns:1fr 1fr}}
.b-svc__item{display:flex;align-items:baseline;gap:1rem;padding:1.05rem 0;border-bottom:1px dashed color-mix(in oklab,var(--on-board) 25%,transparent);font-weight:800;font-size:clamp(1rem,1.8vw,1.2rem);text-transform:uppercase;letter-spacing:.08em;line-height:1.3}
.b-svc__n{font-family:var(--display);font-size:1.3rem;letter-spacing:0;color:var(--primary);min-width:2.2ch}
.b-svc__dots{flex:1;min-width:1.5rem;border-bottom:3px dotted color-mix(in oklab,var(--on-board) 40%,transparent);transform:translateY(-.3rem)}
.b-svc__tail{font-size:.8rem;letter-spacing:.12em;color:var(--on-board);text-underline-offset:.3em;white-space:nowrap}
.b-svc-confirm{margin-top:1.75rem;font-weight:600;color:var(--on-board)}
.svc-note{margin-top:.35rem;color:var(--board-muted);font-size:.95rem}

.fb-tags{border:0;margin:2.5rem 0 0;padding:0;display:flex;flex-wrap:wrap;gap:.9rem}
.fb-tag{position:relative;display:inline-flex}
.fb-tag:nth-child(odd){transform:rotate(-1.5deg)}
.fb-tag:nth-child(even){transform:rotate(1.2deg)}
.fb-tag input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}
.fb-tag>span{display:inline-flex;align-items:center;gap:.6rem;min-height:3.5rem;padding:.4rem 1.2rem .4rem 2.2rem;border:2px solid var(--ink);border-radius:3px 26px 26px 3px;background:var(--ticket);color:#151515;font-weight:800;font-size:.95rem;text-transform:uppercase;letter-spacing:.07em;position:relative;transition:background-color .2s,color .2s,transform .25s var(--ease)}
.fb-tag>span::before{content:"";position:absolute;left:.8rem;top:50%;width:.6rem;height:.6rem;margin-top:-.3rem;border-radius:50%;border:2px solid #151515;background:var(--bg)}
.fb-tag:hover>span{transform:translateY(-2px)}
.fb-tag input:checked+span{background:var(--primary);color:var(--on-primary);border-color:var(--primary)}
.fb-tag input:checked+span::before{border-color:currentColor}
.fb-tag input:focus-visible+span{outline:3px solid var(--primary);outline-offset:3px}
.fb-tagnote{margin-top:1.5rem;color:var(--muted)}

.fb-path{position:relative;margin-top:3rem}
.fb-path__line{position:absolute;left:0;right:0;top:0;width:100%;height:3.25rem;pointer-events:none;color:var(--primary)}
.fb-path__line path{fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-dasharray:2 10}
.fb-path ol{position:relative;display:grid;gap:2.5rem 2rem;grid-template-columns:minmax(0,1fr)}
@media (min-width:900px){.fb-path ol{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media (max-width:899.98px){.fb-path__line{display:none}.fb-path li{padding-left:4.25rem}.fb-path li .fb-step-n{position:absolute;left:0;top:0}}
.fb-path li{position:relative}
.fb-step-n{display:grid;place-items:center;width:3.25rem;height:3.25rem;border:2px solid var(--ink);border-radius:50%;background:var(--bg);font-family:var(--display);font-size:1.5rem}
.fb-path h3{margin-top:.85rem;font-family:var(--display);font-weight:400;font-size:1.6rem;line-height:1}
@media (max-width:899.98px){.fb-path h3{margin-top:.2rem}}
.fb-path p{margin-top:.4rem;color:var(--muted)}

.b-themes{display:flex;flex-wrap:wrap;gap:1.25rem 1.5rem;margin-top:2.5rem;align-items:center}
.b-themes li{padding:.8rem 1.2rem;border:3px double var(--stamp);outline:2px solid var(--stamp);outline-offset:3px;color:var(--stamp);font-weight:800;text-transform:uppercase;letter-spacing:.1em;font-size:.95rem;line-height:1.25;max-width:22rem;mix-blend-mode:multiply}
.b-themes li:nth-child(3n+1){transform:rotate(-3deg)}
.b-themes li:nth-child(3n+2){transform:rotate(2deg)}
.b-themes li:nth-child(3n){transform:rotate(-1deg)}
.b-themes__note{margin-top:1.75rem;color:var(--muted);font-size:.95rem}

.fb-floor{display:grid;gap:.75rem;margin-top:2.5rem;grid-template-columns:repeat(2,minmax(0,1fr))}
@media (min-width:900px){.fb-floor{grid-template-columns:1.3fr 1fr 1fr}.fb-floor>:first-child{grid-row:span 2}}
.fb-floor .b-photo{aspect-ratio:4/3;border:2px solid var(--ink)}
@media (min-width:900px){.fb-floor .b-photo{aspect-ratio:auto;min-height:15rem}.fb-floor>:first-child{min-height:31rem}}
@media (max-width:899.98px){.fb-floor>:first-child{grid-column:span 2}}
.fb-floor .b-photo img{filter:grayscale(1) contrast(1.3);transition:filter .5s}
.fb-floor .b-photo:hover img{filter:grayscale(.2) contrast(1.15) sepia(.25)}
.fb-floor-note{margin-top:1rem;color:var(--muted);font-size:.95rem}

.fb-req{display:grid;gap:2.5rem}
@media (min-width:980px){.fb-req{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:4rem}.fb-req__side{position:sticky;top:6rem;align-self:start}}
.fb-ticket{position:relative;padding:clamp(1.5rem,3.5vw,2.5rem);padding-top:clamp(2.5rem,4vw,3rem);background:var(--ticket);color:#151515;border-radius:2px;box-shadow:0 1px 0 rgb(0 0 0 / .08),0 24px 50px -28px rgb(0 0 0 / .55);--field-line:rgb(21 21 21 / .35);--muted:#57503f;--ink:#151515;--bg:#fbf7ee}
.fb-ticket::before{content:"";position:absolute;left:0;right:0;top:0;height:12px;background:radial-gradient(circle at 50% 0,var(--page-bg) 5px,transparent 5.5px) 0 0/18px 12px repeat-x}
.fb-ticket__head{display:flex;justify-content:space-between;gap:1rem;margin-bottom:1.75rem;padding-bottom:.9rem;border-bottom:2px solid #151515;font-size:.78rem}
.fb-picked{display:none;margin-top:1.5rem;padding:.9rem 1.1rem;border:2px dashed var(--primary);color:var(--ink);font-weight:600}
.fb-picked b{font-weight:800;text-transform:uppercase;letter-spacing:.06em}
html:has(.fb-tags input:checked) .fb-picked{display:block}
.fb-o{display:none}
.f-label,.f-field legend{font-weight:800;font-size:.82rem;text-transform:uppercase;letter-spacing:.08em;color:#151515}
.f-input{border-width:2px;border-radius:2px;background:#fff;color:#151515}
.f-chip>span{border-width:2px;border-radius:3px;font-weight:600;color:#151515}
.f-chip input:checked+span{background:#151515;color:#fbf7ee;border-color:#151515}
.f-submit{min-height:3.4rem;border-radius:var(--btn-radius);background:var(--primary);color:var(--on-primary);font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:.95rem}
.fb-ticket .f-status{color:#151515}

.fb-visit{display:grid;gap:2.5rem}
@media (min-width:900px){.fb-visit{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:4.5rem}}
.fb-visit .fb-btn{margin-top:1.75rem}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7.5rem 1fr;gap:1rem;padding:1rem 0;border-bottom:2px solid var(--ink)}
.facts div:first-child{border-top:2px solid var(--ink)}
.facts dt{font-weight:800;font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;padding-top:.2rem}
.facts dd{margin:0;font-weight:600;font-size:1.1rem}
.b-visit__pending{display:grid;gap:.4rem;margin-top:1.25rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.5rem;min-height:3rem;margin-top:1rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;font-size:.9rem}
.faq details{border-color:var(--ink)}
.faq summary{font-weight:800;font-size:1.1rem}

.fb-close{position:relative;overflow:hidden;background:var(--primary);color:var(--on-primary);padding:clamp(4rem,9vw,6.5rem) 0;isolation:isolate}
.fb-close .fb-h2{color:inherit;max-width:16ch}
.fb-close__tel{display:inline-block;margin-top:1.25rem;font-family:var(--display);font-size:clamp(2.6rem,9vw,6rem);line-height:1;color:inherit;text-decoration:none;white-space:nowrap}
.fb-close__tel:hover{text-decoration:underline;text-decoration-thickness:4px}
.fb-close .fb-ctas{margin-top:1.75rem}

.b-ft{background:var(--board);color:var(--on-board);padding:3.5rem 0 2.5rem}
.b-ft__name{font-family:var(--display);font-size:clamp(2rem,5vw,3.25rem);line-height:1}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;color:var(--board-muted)}
.b-ft__row a{color:var(--on-board);font-weight:600}
.legal{margin-top:1.5rem;font-size:.85rem;color:var(--board-muted)}
.stock-credits{margin-top:.5rem;color:var(--board-muted)}
.callbar{background:var(--primary);color:var(--on-primary);border-radius:var(--btn-radius);font-weight:800;letter-spacing:.04em}
`;

function grain(ctx) {
  const id = uid(ctx, "fb-g");
  return `<svg class="fb-grain" aria-hidden="true" focusable="false"><filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#${id})"/></svg>`;
}

// A mandrel bent exhaust run: long straights and smooth constant radius bends,
// drawn as outline, body, heat tint and highlight so it reads as tube.
function pipe() {
  const d = "M-40 120 H300 C360 120 380 120 400 80 C420 40 440 40 500 40 H760 C820 40 840 40 860 80 C880 120 900 130 960 130 H1460";
  const len = 1700;
  const tint = "M400 80 C420 40 440 40 500 40 H560";
  const tint2 = "M760 40 C820 40 840 40 860 80";
  return `<div class="fb-pipe" aria-hidden="true"><svg viewBox="0 0 1440 170" preserveAspectRatio="xMidYMid slice" focusable="false"><path class="fb-pipe__out" style="--len:${len}" d="${d}"/><path class="fb-pipe__body" style="--len:${len}" d="${d}"/><path class="fb-pipe__heat" style="--len:200" d="${tint}"/><path class="fb-pipe__heat" style="--len:160" d="${tint2}"/><path class="fb-pipe__hi" style="--len:${len}" d="${d}"/><path class="fb-pipe__bead" d="M560 26 V54 M740 26 V54 M300 106 V134"/></svg></div>`;
}

// The stamped badge: the city around the ring, the real rating in the middle.
function badge(ctx) {
  const ring = uid(ctx, "fb-r");
  const city = esc((ctx.cityRaw || ctx.placeRaw || "").toUpperCase());
  // The ring always reads all the way round; short city names repeat once.
  const unit = `${city} · <tspan${ctx.i18n.ti("GOOGLE RATING", "EN GOOGLE")}>GOOGLE RATING</tspan> · `;
  const ringText = city.length <= 10 ? `${unit}${unit}` : unit;
  return `<div class="fb-badge"><svg viewBox="0 0 200 200" aria-hidden="true" focusable="false"><defs><path id="${ring}" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0"/></defs><circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" stroke-width="2"/><text class="fb-badge__ring"><textPath href="#${ring}" startOffset="0" textLength="484" lengthAdjust="spacing">${ringText}</textPath></text></svg>${ratingProof(ctx, "sticker")}</div>`;
}

function withFormId(ctx, id) {
  return ctx.form.replace("<form class=\"req-form\"", `<form id="${id}" class="req-form"`);
}

function nameLen(ctx) {
  const words = ctx.nameRaw.trim().split(/\s+/).filter(Boolean);
  const longest = words.reduce((m, w) => Math.max(m, w.length), 1);
  const len = ctx.nameRaw.length;
  return Math.max(longest, len > 12 ? Math.ceil(len / 2) + 1 : len, 6);
}

function render(ctx) {
  const t = ctx.t;
  const poster = ctx.variants.hero === "poster";
  const formId = "fb-form";
  const form = formHeading(ctx);
  const extra = [];
  const diesel = ctx.categoryKey === "diesel-truck-repair";

  const header = siteHeader(ctx, { cta: ["Get an estimate", "Presupuesto"] });

  const bringBy = ctx.mapsUrl
    ? `<a class="fb-btn fb-btn--red" href="${esc(ctx.mapsUrl)}" rel="noopener noreferrer" target="_blank">${icon("pin")}<span>${t("Bring it by", "Tráigalo")}</span></a>`
    : `<a class="fb-btn fb-btn--red" href="#${REQUEST_ID}"><span>${ctx.copyOr("ctaPrimary", ctx.formCopy.cta)}</span>${icon("arrow")}</a>`;
  const call = ctx.tel ? `<a class="fb-btn" href="${esc(ctx.tel)}">${icon("phone")}<span>${ctx.copyOr("ctaSecondary", ["Call", "Llame"])} ${esc(ctx.phone)}</span></a>` : "";
  const ask = ctx.mapsUrl ? `<a class="fb-btn fb-btn--extra" href="#${REQUEST_ID}"><span>${ctx.copyOr("ctaPrimary", ctx.formCopy.cta)}</span></a>` : "";

  const sign = `<div class="fb-sign"><p class="fb-trade fb-caps"><span>${ctx.categoryT}</span><span>${esc(ctx.placeRaw)}</span></p><h1 class="fb-name fb-slab" style="--nl:${nameLen(ctx)}">${ctx.name}</h1><span class="fb-rule" aria-hidden="true"></span><p class="fb-promise">${ctx.copyOr("headline", ctx.promise)}</p>${ctx.about ? `<p class="fb-about">${ctx.about}</p>` : ""}<div class="fb-ctas">${bringBy}${call}${ask}</div></div>`;

  const heroShot = poster ? ctx.photos.hero() : null;
  const hero = heroShot
    ? `<section class="fb-hero fb-hero--poster" id="top">${grain(ctx)}<div class="wrap fb-hero__grid">${sign}<figure class="fb-shot"><div class="fb-shot__frame">${photoFrame(ctx, heroShot, { hero: true, sizes: "(min-width: 960px) 45vw, 100vw", tag: true })}</div>${badge(ctx)}</figure></div><div class="wrap">${pipe()}</div></section>`
    : `<section class="fb-hero fb-hero--sign" id="top">${grain(ctx)}<div class="wrap fb-hero__grid">${sign}${badge(ctx)}</div><div class="wrap">${pipe()}</div></section>`;

  const split = ctx.variants.services === "split" ? "split" : "board";
  const services = ctx.services.length
    ? `<section class="fb-board fb-svc--${split}" id="services">${grain(ctx)}<div class="wrap"><div class="fb-head"><h2 class="fb-h2">${t("The", "El")} <em>${t("menu board", "menú")}</em></h2><p class="fb-lede">${t("No prices on the board. Ask about any of it and get a straight answer.", "Sin precios en el pizarrón. Pregunte por lo que sea y reciba una respuesta directa.")}</p></div><div class="fb-board__frame">${servicesList(ctx, "menu", { tail: ["Ask", "Pregunte"], numbered: true })}${servicesConfirm(ctx)}</div></div></section>`
    : "";

  // Sound and symptom tags.
  const list = SYMPTOMS[ctx.categoryKey] || SYMPTOMS.default;
  const gid = uid(ctx, "fb");
  const tags = list.map((o) => {
    const id = `${gid}-${o.key}`;
    extra.push(`html:has(#${id}:checked) .fb-o-${o.key}{display:inline}`);
    return `<label class="fb-tag"><input type="radio" name="symptom" value="${o.key}" id="${id}" form="${formId}"><span>${t(o.label[0], o.label[1])}</span></label>`;
  }).join("");
  const shows = list.map((o) => `<span class="fb-o fb-o-${o.key}"${ctx.i18n.ti(o.label[0], o.label[1])}>${esc(o.label[0])}</span>`).join("");
  const symptoms = `<section class="fb-sec" id="symptoms"><div class="wrap"><div class="fb-head"><h2 class="fb-h2">${t("What is it", "¿Qué está")} <em>${t("doing?", "haciendo?")}</em></h2><p class="fb-lede">${diesel ? t("Pick the closest one. It goes along with your request, so the first call starts in the right place.", "Elija el más parecido. Va con su solicitud y la primera llamada empieza en el lugar correcto.") : t("Pick the sound or the symptom. It goes along with your request, so the first call starts in the right place.", "Elija el ruido o el síntoma. Va con su solicitud y la primera llamada empieza en el lugar correcto.")}</p></div><fieldset class="fb-tags"><legend class="sr-only">${t("What is it doing?", "¿Qué está haciendo?")}</legend>${tags}</fieldset><p class="fb-tagnote">${t("A short video of the noise helps too. Bring it or mention it when you call.", "Un video corto del ruido también ayuda. Tráigalo o menciónelo al llamar.")}</p></div></section>`;

  // Process: four steps for a shop visit, the road call steps for diesel.
  const steps = diesel ? stepsFor(ctx) : VISIT;
  const how = `<section class="fb-sec fb-sec--alt"><div class="wrap"><h2 class="fb-h2">${t("How a", "Cómo es una")} <em>${t("visit goes", "visita")}</em></h2><div class="fb-path"><svg class="fb-path__line" viewBox="0 0 1000 52" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M40 26 C120 0 200 52 290 26 S460 0 540 26 S710 52 790 26 S930 8 985 26"/><path d="M972 16 l14 10 l-15 8"/></svg><ol>${steps.map((s, i) => `<li class="rv"><span class="fb-step-n" aria-hidden="true">${i + 1}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></div></section>`;

  const themes = ctx.themes.length
    ? `<section class="fb-sec"><div class="wrap"><h2 class="fb-h2">${t("Stamped by", "Sellado por")} <em>${t("customers", "los clientes")}</em></h2>${themesBlock(ctx)}</div></section>`
    : "";

  // Shop floor photos: the trade's own work only, black and white.
  const fit = diesel ? null : (p) => !/diesel|semi/.test(p.id);
  const shots = ctx.photos.many(3, fit);
  const floor = shots.length
    ? `<div class="fb-bead" aria-hidden="true"></div><section class="fb-sec${themes ? " fb-sec--alt" : ""}"><div class="wrap"><h2 class="fb-h2">${t("From the", "Desde el")} <em>${t("shop floor", "taller")}</em></h2><div class="fb-floor">${shots.map((p, i) => photoFrame(ctx, p, { cls: "rv", sizes: i === 0 ? "(min-width: 900px) 42vw, 100vw" : "(min-width: 900px) 29vw, 50vw", width: i === 0 ? 1200 : 800, tag: true })).join("")}</div><p class="fb-floor-note">${t("Stock photos stand in for the shop's own work.", "Fotos de archivo en lugar del trabajo del taller.")}</p></div></section>`
    : "";

  const request = `<section class="fb-sec${themes && !shots.length ? " fb-sec--alt" : ""}" id="${REQUEST_ID}" style="--page-bg:var(--bg)"><div class="wrap fb-req"><div class="fb-req__side"><h2 class="fb-h2">${form.title}</h2><p class="fb-lede">${form.intro}</p><p class="fb-picked">${t("What it is doing", "Qué está haciendo")}: <b>${shows}</b></p>${ctx.tel ? `<div class="fb-ctas"><a class="fb-btn" href="${esc(ctx.tel)}">${icon("phone")}<span>${t("Or call", "O llame al")} ${esc(ctx.phone)}</span></a></div>` : ""}</div><div class="fb-ticket"><p class="fb-ticket__head fb-caps" aria-hidden="true"><span>${esc(ctx.nameRaw)}</span><span>${t("Work order", "Orden de trabajo")}</span></p>${withFormId(ctx, formId)}</div></div></section>`;

  const visit = `<div class="fb-bead" aria-hidden="true"></div><section class="fb-sec fb-sec--alt" id="visit"><div class="wrap fb-visit"><div><h2 class="fb-h2">${t("Pull", "Pase")} <em>${t("on in", "al taller")}</em></h2><p class="fb-lede">${t("Call ahead if you can, so the shop knows you are coming.", "Llame antes si puede, para que el taller sepa que va.")}</p>${ctx.mapsUrl ? `<a class="fb-btn fb-btn--red" href="${esc(ctx.mapsUrl)}" rel="noopener noreferrer" target="_blank">${icon("pin")}<span>${t("Get directions", "Cómo llegar")}</span></a>` : ""}</div>${visitDetails(ctx)}</div></section>`;

  const faq = `<section class="fb-sec" id="faq"><div class="wrap fb-visit"><h2 class="fb-h2">${t("Shop", "Preguntas")} <em>${t("talk", "del taller")}</em></h2>${faqBlock(ctx)}</div></section>`;

  const close = `<section class="fb-close">${grain(ctx)}<div class="wrap"><h2 class="fb-h2">${diesel ? t("Tell the shop what it is doing.", "Dígale al taller qué le pasa.") : t("Hear something? Bring it by.", "¿Oye algo? Tráigalo.")}</h2>${ctx.tel ? `<a class="fb-close__tel" href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}<div class="fb-ctas"><a class="fb-btn" href="#${REQUEST_ID}"><span>${ctx.copyOr("ctaPrimary", ctx.formCopy.cta)}</span>${icon("arrow")}</a></div></div></section>`;

  return {
    css: `${CSS}\n${extra.join("\n")}`,
    body: `${header}<main>${hero}${services}${symptoms}${how}${themes}${floor}${request}${visit}${faq}${close}</main>${siteFooter(ctx)}`,
  };
}

export const direction = {
  key: "auto-fab-shop",
  label: "Fab shop",
  status: "implemented",
  suits: ["muffler-exhaust", "auto-repair", "diesel-truck-repair"],
  keywords: ["heritage", "custom", "welding", "exhaust", "gallery", "old-school", "fabrication", "craft"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Libre+Franklin:wght@400;600;800&display=swap",
  palettes: PALETTES,
  variants: { hero: ["sign", "poster"], services: ["board", "split"], proof: ["stamp"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /shop-bay|under|wrench|head-rebuild/ },
  callbar: "call",
  render,
};
