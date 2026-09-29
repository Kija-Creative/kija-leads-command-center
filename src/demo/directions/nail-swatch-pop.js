// Swatch pop: the color nail studio (research/design-barber-salon.md, direction 6).
// Playful, glossy sorbet and social media native. Every section is tinted a
// different sorbet, glossy polish swatches work as bullets, dividers and the
// hero's signature row, tiles are 20px rounded, and the rating card wears a
// thin chrome edge. Condensed caps carry the voice with one italic serif word.
//
// Font note: the brief named Archivo Narrow, Newsreader and Work Sans.
// Newsreader is on the design skill's overused list and Work Sans sits too
// close to Archivo, so this uses one Archivo family across widths (condensed
// for display, normal for body) plus Ibarra Real Nova italic for the accent word.

import {
  bookButton,
  callButton,
  faqBlock,
  floatingBook,
  formHeading,
  photoFrame,
  ratingProof,
  REQUEST_ID,
  serviceItems,
  servicesConfirm,
  servicesList,
  siteFooter,
  siteHeader,
  themesBlock,
  visitDetails,
} from "../blocks.js";
import { stepsFor } from "../copy.js";
import { esc, icon } from "../shared.js";

const PALETTES = [
  { key: "swatch-peach", name: "Peach Sorbet", vars: { bg: "#fff6f0", surface: "#ffffff", ink: "#0b1320", muted: "#4d525b", line: "#f0d9c9", primary: "#0b1320", "on-primary": "#ffffff", em: "#0b1320", t1: "#ffe4d3", t2: "#e3efe7", t3: "#fbe4ec", s1: "#ffb990", s2: "#b5d1c0", s3: "#f4bfd0", s4: "#0b1320", s5: "#ffd98a", s6: "#c3cff2", chrome1: "#ffffff", chrome2: "#c9ccd6", chrome3: "#f3d6c4" } },
  { key: "swatch-cherry", name: "Cherry Gloss", vars: { bg: "#fbf6f1", surface: "#ffffff", ink: "#1a0b10", muted: "#5e4d52", line: "#efdcd4", primary: "#c81f36", "on-primary": "#ffffff", em: "#c81f36", t1: "#fde6e8", t2: "#f5ebe1", t3: "#f7e1e6", s1: "#d7263d", s2: "#f7c6cf", s3: "#2b2b2b", s4: "#ead7c4", s5: "#8f1d2c", s6: "#f29aa8", chrome1: "#ffffff", chrome2: "#cfc6c8", chrome3: "#f2c9cf" } },
  { key: "swatch-lilac", name: "Lilac Chrome", vars: { bg: "#f7f5fc", surface: "#ffffff", ink: "#16132a", muted: "#524e69", line: "#e1dcf2", primary: "#16132a", "on-primary": "#ffffff", em: "#5b45d6", t1: "#ece7ff", t2: "#ffe7f2", t3: "#e0f5ef", s1: "#b9a8ff", s2: "#ff9ecf", s3: "#9fe3d6", s4: "#16132a", s5: "#ffd6a5", s6: "#dcd5ff", chrome1: "#ffffff", chrome2: "#c7c3dc", chrome3: "#e9dcff" } },
];

const SWATCHES = ["s1", "s2", "s3", "s4", "s5", "s6"];

function dot(i, cls = "sw-dot") {
  return `<span class="${cls}" style="--c:var(--${SWATCHES[i % SWATCHES.length]})" aria-hidden="true"></span>`;
}

function swatchRow(count, cls = "sw-row") {
  return `<div class="${cls}" aria-hidden="true">${Array.from({ length: count }, (_, i) => dot(i, `sw-dot sw-dot--${i}`)).join("")}</div>`;
}

// The no photo art: glossy polish bottles, each in one of the palette swatches.
function bottle(i, cls = "sw-bottle") {
  const c = SWATCHES[i % SWATCHES.length];
  return `<svg class="${cls}" viewBox="0 0 120 200" aria-hidden="true" focusable="false"><rect x="41" y="6" width="38" height="64" rx="7" style="fill:var(--ink)"/><rect x="47" y="12" width="7" height="50" rx="3.5" style="fill:#ffffff" opacity=".22"/><rect x="36" y="66" width="48" height="14" rx="4" style="fill:var(--ink)" opacity=".82"/><rect x="12" y="78" width="96" height="116" rx="28" style="fill:var(--${c})"/><rect x="12" y="78" width="96" height="116" rx="28" style="fill:none;stroke:var(--ink)" stroke-opacity=".12" stroke-width="2"/><rect x="25" y="94" width="13" height="74" rx="6.5" style="fill:#ffffff" opacity=".5"/><circle cx="31.5" cy="178" r="4" style="fill:#ffffff" opacity=".45"/></svg>`;
}

function bottles(start, count, cls = "sw-bottles") {
  return `<div class="${cls}" aria-hidden="true">${Array.from({ length: count }, (_, i) => bottle(start + i)).join("")}</div>`;
}

const HEADLINE = {
  "nail-salon": [["Pick your", "Elija su"], ["color", "color"], ["Book your set.", "Reserve su cita."]],
  "hair-salon": [["Walk out", "Salga"], ["glowing", "radiante"], ["Book your chair.", "Reserve su silla."]],
};

const CSS = `
:root{--display:"Archivo","Arial Narrow",sans-serif;--body:"Archivo",system-ui,sans-serif;--serif:"Ibarra Real Nova",Georgia,serif;--radius:14px;--tile:20px;--btn-radius:999px;--max:1240px;--ease:cubic-bezier(.22,1,.36,1);--field:#ffffff;--field-line:color-mix(in oklab,var(--ink) 20%,transparent);--callbar-bg:var(--ink);--callbar-ink:#ffffff;--lang-fg:var(--ink);--lang-on:var(--bg);--star:var(--ink);--chrome:linear-gradient(135deg,var(--chrome1) 0%,var(--chrome2) 22%,var(--chrome1) 42%,var(--chrome3) 60%,var(--chrome2) 80%,var(--chrome1) 100%)}
body{font-size:1.0625rem;line-height:1.6;font-stretch:100%}
.sw-cond{font-family:var(--display);font-stretch:70%;font-weight:800;text-transform:uppercase;letter-spacing:-.005em;line-height:.9}
.sw-h2{font-family:var(--display);font-stretch:70%;font-weight:800;text-transform:uppercase;font-size:clamp(2.6rem,6.2vw,4.75rem);line-height:.9;letter-spacing:-.005em}
.sw-h2 em,.sw-h1 em{font-family:var(--serif);font-style:italic;font-weight:600;text-transform:none;font-stretch:100%;letter-spacing:-.01em;color:var(--em);font-size:1.08em;line-height:.8}
.sw-lede{margin-top:1rem;max-width:46ch;color:var(--muted);font-size:1.08rem}
.sw-sec{position:relative;padding:clamp(4rem,9vw,7.5rem) 0}
.sw-sec--t1{background:var(--t1)}
.sw-sec--t2{background:var(--t2)}
.sw-sec--t3{background:var(--t3)}
.sw-head{display:grid;gap:1rem;margin-bottom:2.75rem}
@media (min-width:900px){.sw-head{grid-template-columns:minmax(0,1fr) minmax(0,24rem);align-items:end}.sw-head .sw-lede{margin:0}}

.sw-dot{display:inline-block;flex:none;width:var(--d,1rem);height:var(--d,1rem);border-radius:50%;background:radial-gradient(circle at 32% 26%,rgb(255 255 255 / .9) 0 7%,rgb(255 255 255 / 0) 24%),radial-gradient(circle at 68% 82%,rgb(0 0 0 / .2),rgb(0 0 0 / 0) 58%),var(--c);box-shadow:inset 0 -.12em .3em rgb(0 0 0 / .14),0 .5em 1em -.5em color-mix(in oklab,var(--c) 60%,#000)}

.b-hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--line)}
.b-hd__in{display:flex;align-items:center;gap:1.25rem;min-height:4.25rem}
.b-brand{margin-right:auto;font-family:var(--display);font-stretch:70%;font-weight:800;font-size:1.75rem;text-transform:uppercase;letter-spacing:.005em;line-height:1;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:64vw}
.b-nav{display:none;gap:.4rem}
.b-nav a{padding:.5rem .95rem;border-radius:999px;font-weight:600;font-size:.95rem;text-decoration:none;transition:background-color .25s}
.b-nav a:hover{background:var(--t1)}
@media (min-width:1000px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:.8rem}
.b-hd__tel{display:none;align-items:center;gap:.4rem;font-weight:600;text-decoration:none}
@media (min-width:860px){.b-hd__tel{display:inline-flex}}
.b-hd__cta,.sw-btn{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;border-radius:999px;font-weight:700;text-decoration:none;border:2px solid var(--ink);transition:transform .3s var(--ease),box-shadow .3s var(--ease),background-color .25s,color .25s}
.b-hd__cta{padding:.55rem 1.2rem;background:var(--ink);color:#ffffff}
.b-hd__cta:hover,.sw-btn:hover{transform:translateY(-2px)}
.sw-btn{min-height:3.5rem;padding:.85rem 1.7rem;font-size:1.05rem}
.sw-btn--ink{background:var(--primary);border-color:var(--primary);color:var(--on-primary)}
.sw-btn--line{background:var(--surface);color:var(--ink)}
.sw-btn .ico{width:1.1rem;height:1.1rem}

.sw-hero{position:relative;background:var(--t1);padding:clamp(2.5rem,6vw,5rem) 0 0}
.sw-hero__grid{display:grid;gap:2.5rem;align-items:center}
@media (min-width:940px){.sw-hero--field .sw-hero__grid{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:4rem}}
.sw-kicker{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem .75rem;font-weight:600}
.sw-kicker .sw-dot{--d:.85rem}
.sw-kicker span+span{color:var(--muted);font-weight:500}
.sw-h1{margin-top:1.25rem;font-family:var(--display);font-stretch:68%;font-weight:800;text-transform:uppercase;font-size:clamp(3.4rem,8.6vw,6rem);line-height:.88;letter-spacing:-.008em;word-spacing:.08em;animation:kj-rise 1s var(--ease) both}
.sw-h1 .sw-l2{display:block}
.sw-intro{margin-top:1.4rem;max-width:40ch;font-size:1.125rem;color:var(--muted)}
.sw-ctas{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}
.sw-hero .b-rating--chip{display:inline-flex;align-items:center;gap:.55rem;margin-top:1.5rem;padding:.5rem .95rem;border-radius:999px;background:var(--surface);font-weight:600;font-size:.95rem}
.sw-hero .b-rating--chip .b-rating__num{font-family:var(--display);font-stretch:70%;font-weight:800;font-size:1.35rem;line-height:1}
.sw-hero .stars{width:5.5rem;height:1.1rem}
.sw-shot{position:relative;border-radius:var(--tile);overflow:hidden;aspect-ratio:4/5;background:var(--surface);transform:rotate(1.5deg)}
.sw-shot>.b-photo{position:absolute;inset:0}
.sw-shot img{filter:saturate(1.08) brightness(1.03)}
.sw-shot--art{display:grid;place-items:center;background:var(--surface)}
.sw-bottles{display:flex;align-items:flex-end;justify-content:center;gap:6%;width:100%;padding:0 12% 4%}
.sw-bottles .sw-bottle{width:28%;height:auto;filter:drop-shadow(0 18px 18px rgb(0 0 0 / .18))}
.sw-bottles .sw-bottle:nth-child(2){width:34%;transform:translateY(-6%)}
.sw-cap{position:absolute;left:.75rem;bottom:.75rem;z-index:1;padding:.3rem .65rem;border-radius:999px;background:rgb(255 255 255 / .9);color:var(--ink);font-size:.75rem;font-weight:600}
@media (max-width:939.98px){.sw-hero--field .sw-shot{aspect-ratio:5/4}}
.sw-row{position:relative;z-index:2;display:flex;justify-content:center;gap:clamp(.5rem,2vw,1.5rem);margin-top:clamp(2.5rem,5vw,4rem);transform:translateY(50%);margin-bottom:0}
.sw-row .sw-dot{--d:clamp(3.25rem,10vw,7.5rem);animation:kj-rise .9s var(--ease) both}
.sw-row .sw-dot--1{animation-delay:.06s}.sw-row .sw-dot--2{animation-delay:.12s}.sw-row .sw-dot--3{animation-delay:.18s}.sw-row .sw-dot--4{animation-delay:.24s}.sw-row .sw-dot--5{animation-delay:.3s}.sw-row .sw-dot--6{animation-delay:.36s}
@media (max-width:559.98px){.sw-row .sw-dot--5,.sw-row .sw-dot--6{display:none}}
.sw-after-row{padding-top:calc(clamp(3.25rem,10vw,7.5rem) / 2 + clamp(3rem,6vw,5rem))}

.sw-hero--row{text-align:center}
.sw-hero--row .sw-kicker,.sw-hero--row .sw-ctas{justify-content:center}
.sw-hero--row .sw-h1,.sw-hero--row .sw-intro{margin-inline:auto}
.sw-hero--row .sw-h1{max-width:none;font-size:clamp(3.2rem,7.6vw,5.5rem)}
.sw-hero--row .sw-row{align-items:center}
.sw-pdot{position:relative;flex:none;width:clamp(8rem,24vw,15rem);aspect-ratio:1;border-radius:50%;overflow:hidden;background:var(--surface);box-shadow:0 0 0 6px var(--surface),0 24px 50px -24px rgb(0 0 0 / .5)}
.sw-pdot>.b-photo{position:absolute;inset:0}
.sw-pdot .sw-bottle{width:42%;height:auto;margin:16% auto 0}
@media (max-width:559.98px){.sw-hero--row .sw-row .sw-dot--3,.sw-hero--row .sw-row .sw-dot--4{display:none}}

.sw-proof{display:grid;gap:1.25rem}
@media (min-width:880px){.sw-proof{grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);align-items:stretch}}
.sw-chrome{padding:3px;border-radius:calc(var(--tile) + 3px);background:var(--chrome)}
.sw-chrome__in{height:100%;padding:clamp(1.5rem,4vw,2.5rem);border-radius:var(--tile);background:var(--surface)}
.sw-proof .b-rating{display:flex;flex-wrap:wrap;align-items:flex-end;gap:.5rem 1.5rem}
.sw-proof .b-rating__num{font-family:var(--display);font-stretch:68%;font-weight:800;font-size:clamp(6rem,15vw,9.5rem);line-height:.8;letter-spacing:-.01em}
.sw-proof .b-rating__side{display:grid;gap:.5rem;padding-bottom:.5rem}
.sw-proof .stars{width:8rem;height:1.6rem}
.sw-proof .b-rating__count{font-weight:700;font-size:1.1rem}
.sw-proof__words{display:grid;align-content:space-between;gap:1.5rem;padding:clamp(1.5rem,4vw,2.5rem);border-radius:var(--tile);background:var(--t3)}
.sw-proof__words .sw-h2{font-size:clamp(2rem,4vw,3rem)}
.b-themes{display:flex;flex-wrap:wrap;gap:.5rem}
.b-themes li{display:inline-flex;align-items:center;gap:.5rem;padding:.55rem 1rem;border-radius:999px;background:var(--surface);font-weight:600}
.b-themes li::before{content:"";width:.75rem;height:.75rem;border-radius:50%;background:var(--s1)}
.b-themes li:nth-child(2)::before{background:var(--s2)}.b-themes li:nth-child(3)::before{background:var(--s3)}.b-themes li:nth-child(4)::before{background:var(--s5)}
.b-themes__note{margin-top:.75rem;font-size:.9rem;color:var(--muted)}
.sw-proof--sticker{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:2rem 4rem;text-align:center}
.sw-proof--sticker .sw-chrome{border-radius:50%;padding:4px;transform:rotate(-5deg)}
.sw-proof--sticker .b-rating{display:grid;place-content:center;justify-items:center;gap:.35rem;width:clamp(15rem,34vw,19rem);aspect-ratio:1;border-radius:50%;background:var(--surface)}
.sw-proof--sticker .b-rating__num{font-size:clamp(5rem,11vw,7rem)}
.sw-proof--sticker .b-rating__count{max-width:10rem;text-align:center;line-height:1.3}
.sw-proof--sticker .sw-proof__words{background:transparent;padding:0;max-width:26rem;justify-items:center}
@media (min-width:880px){.sw-proof--sticker{justify-content:flex-start;text-align:left}.sw-proof--sticker .sw-proof__words{justify-items:start}}

.sw-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}
@media (min-width:900px){.sw-cards{grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}}
@media (min-width:1180px){.sw-cards:has(>li:nth-child(4):last-child),.sw-cards:has(>li:nth-child(8):last-child){grid-template-columns:repeat(4,minmax(0,1fr))}}
.sw-card{position:relative;display:grid;gap:1.5rem;align-content:space-between;height:100%;min-height:12rem;padding:clamp(1.1rem,2.5vw,1.5rem);border-radius:var(--tile);background:var(--surface);text-decoration:none;transition:transform .35s var(--ease),box-shadow .35s var(--ease)}
.sw-card:hover{transform:translate(-2px,-4px);box-shadow:4px 6px 0 var(--ink)}
.sw-card .sw-dot{--d:clamp(3rem,6vw,4.25rem);transition:transform .5s var(--ease)}
.sw-card:hover .sw-dot{transform:scale(1.08) rotate(-8deg)}
.sw-card__name{font-family:var(--display);font-stretch:70%;font-weight:800;font-size:clamp(1.35rem,2.6vw,2.1rem);overflow-wrap:anywhere;line-height:.95;text-transform:uppercase}
.sw-card__go{display:inline-flex;align-items:center;gap:.4rem;font-weight:700;font-size:.95rem}
.sw-card__go .ico{width:1rem;height:1rem;transition:transform .3s var(--ease)}
.sw-card:hover .sw-card__go .ico{transform:translateX(4px)}
.b-svc{display:grid;gap:0}
@media (min-width:900px){.b-svc--menu{grid-template-columns:1fr 1fr;column-gap:3rem}}
.b-svc__item{display:flex;align-items:center;gap:1rem;padding:1.1rem 0;border-bottom:2px dotted color-mix(in oklab,var(--ink) 30%,transparent)}
.b-svc__item::before{content:"";flex:none;width:2.1rem;height:2.1rem;border-radius:50%;background:radial-gradient(circle at 32% 26%,rgb(255 255 255 / .9) 0 7%,rgb(255 255 255 / 0) 24%),var(--c,var(--s1));box-shadow:inset 0 -3px 7px rgb(0 0 0 / .14)}
.b-svc__item:nth-child(6n+2){--c:var(--s2)}.b-svc__item:nth-child(6n+3){--c:var(--s3)}.b-svc__item:nth-child(6n+4){--c:var(--s4)}.b-svc__item:nth-child(6n+5){--c:var(--s5)}.b-svc__item:nth-child(6n){--c:var(--s6)}
.b-svc__name{font-family:var(--display);font-stretch:70%;font-weight:800;font-size:clamp(1.6rem,3vw,2.2rem);line-height:1;text-transform:uppercase}
.b-svc__dots{flex:1}
.b-svc__tail{padding:.4rem .9rem;border-radius:999px;background:var(--surface);font-weight:700;font-size:.875rem;text-decoration:none}
.b-svc-confirm{margin-top:1.5rem;font-weight:600}
.svc-note{margin-top:.35rem;font-size:.9rem;color:var(--muted)}

.sw-steps{display:grid;gap:1rem;counter-reset:st}
@media (min-width:860px){.sw-steps{grid-template-columns:repeat(3,minmax(0,1fr));gap:1.5rem}}
.sw-steps li{display:grid;grid-template-columns:auto 1fr;gap:.25rem 1.25rem;align-items:start;padding:1.5rem;border-radius:var(--tile);background:var(--surface)}
@media (min-width:860px){.sw-steps li{grid-template-columns:1fr;gap:1rem;padding:2rem}}
.sw-steps .sw-dot{--d:4rem;display:grid;place-items:center;grid-row:span 2;font-family:var(--display);font-stretch:70%;font-weight:800;font-size:1.9rem;color:var(--ink)}
@media (min-width:860px){.sw-steps .sw-dot{grid-row:auto}}
.sw-steps .sw-dot[data-dark]{color:#ffffff}
.sw-steps h3{font-family:var(--display);font-stretch:70%;font-weight:800;font-size:1.8rem;line-height:1;text-transform:uppercase}
.sw-steps p{color:var(--muted)}

.sw-masonry{columns:2;column-gap:1rem}
@media (min-width:860px){.sw-masonry{columns:3;column-gap:1.25rem}}
.sw-tile{position:relative;display:block;break-inside:avoid;margin-bottom:1rem;border-radius:var(--tile);overflow:hidden;background:var(--surface)}
@media (min-width:860px){.sw-tile{margin-bottom:1.25rem}}
.sw-tile>.b-photo{position:absolute;inset:0}
.sw-tile--a{aspect-ratio:4/5}.sw-tile--b{aspect-ratio:1}.sw-tile--c{aspect-ratio:3/4}.sw-tile--d{aspect-ratio:5/4}
.sw-tile__empty{position:absolute;left:.75rem;bottom:.75rem;z-index:1;padding:.3rem .7rem;border-radius:999px;background:var(--surface);font-weight:700;font-size:.8125rem}
.sw-fan{position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:8%;place-items:center;padding:12% 12% 3.5rem}
.sw-fan .sw-dot{width:auto;height:100%;max-width:100%;aspect-ratio:1}
.sw-tile--art{display:grid;place-items:center;padding-bottom:2.5rem}
.sw-tile--art .sw-bottles{padding:0 16%}
.sw-tile--one .sw-bottles .sw-bottle{width:46%;transform:none}
.sw-tile--tint1{background:var(--t1)}.sw-tile--tint2{background:var(--t2)}
.sw-gallery-note{margin-top:.75rem;font-size:.9rem;color:var(--muted)}

.sw-req{display:grid;gap:2.5rem}
@media (min-width:980px){.sw-req{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem}.sw-req__side{position:sticky;top:6.5rem;align-self:start}}
.sw-req__side .b-rating{display:inline-flex;align-items:center;gap:.55rem;margin-top:1.75rem;padding:.55rem 1rem;border-radius:999px;background:var(--surface);font-weight:600}
.sw-req__side .b-rating__num{font-family:var(--display);font-stretch:70%;font-weight:800;font-size:1.4rem;line-height:1}
.sw-req__side .stars{width:5.25rem;height:1.05rem}
.sw-req__side .sw-btn{margin-top:1.25rem}
.sw-panel{padding:clamp(1.5rem,3.5vw,2.5rem);border-radius:calc(var(--tile) + 6px);background:var(--surface)}
.f-input{border-radius:14px}
.f-chip>span{font-weight:600}
.f-chip.day>span{border-radius:16px}
.f-chip input:checked+span{background:var(--ink);color:#ffffff;border-color:var(--ink)}
.sw-addons .f-chip input:checked+span{background:var(--t1);color:var(--ink);border-color:var(--ink)}
.sw-addons .f-chip>span::before{content:"";width:.7rem;height:.7rem;border-radius:50%;background:var(--s1)}
.sw-addons .f-chip:nth-child(6n+2)>span::before{background:var(--s2)}.sw-addons .f-chip:nth-child(6n+3)>span::before{background:var(--s3)}.sw-addons .f-chip:nth-child(6n+4)>span::before{background:var(--s4)}.sw-addons .f-chip:nth-child(6n+5)>span::before{background:var(--s5)}.sw-addons .f-chip:nth-child(6n)>span::before{background:var(--s6)}
.f-submit{border-radius:999px;background:var(--primary);color:var(--on-primary)}
.f-status{border-width:2px;border-radius:16px}

.sw-visit{display:grid;gap:2rem}
@media (min-width:900px){.sw-visit{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:4rem;align-items:start}}
.sw-box{padding:clamp(1.25rem,3vw,2rem);border-radius:var(--tile);background:var(--surface)}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:.95rem 0;border-bottom:2px dotted color-mix(in oklab,var(--ink) 22%,transparent)}
.facts dt{color:var(--muted);font-weight:600}
.facts dd{margin:0;font-weight:700}
.b-visit__pending{display:grid;gap:.4rem;margin-top:1.25rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.25rem;font-weight:700}

.sw-faq .faq{display:grid;gap:.6rem}
.sw-faq .faq details{border:0;border-radius:var(--tile);background:var(--surface);padding:0 1.25rem}
.sw-faq .faq details:last-child{border:0}
.sw-faq .faq summary{font-weight:700;font-size:1.1rem}
.sw-faq .faq details[open] summary .ico{color:var(--em)}

.b-ft{position:relative;padding:0 0 2.75rem;background:var(--ink);color:#ffffff}
.b-ft .sw-row{margin:0 0 clamp(2rem,5vw,3.5rem);transform:translateY(-50%)}
.b-ft .sw-row .sw-dot{--d:clamp(2.75rem,7vw,5rem);animation:none}
.b-ft__name{font-family:var(--display);font-stretch:68%;font-weight:800;text-transform:uppercase;font-size:clamp(2.75rem,8vw,5.5rem);line-height:.88}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;color:rgb(255 255 255 / .8)}
.b-ft__row a{color:#ffffff;font-weight:700}
.legal{margin-top:2rem;font-size:.85rem;color:rgb(255 255 255 / .72)}
.stock-credits{margin-top:.5rem;color:rgb(255 255 255 / .72)}
.b-float{background:var(--primary);color:var(--on-primary);border:2px solid var(--primary)}
.callbar--split .cb-book{background:var(--primary);color:var(--on-primary)}
.sw-ft-gap{height:clamp(2.5rem,6vw,4rem);background:var(--t2)}
`;

function headline(ctx) {
  if (ctx.copy.headline) return `<h1 class="sw-h1">${esc(ctx.copy.headline)}</h1>`;
  const [a, b, c] = HEADLINE[ctx.categoryKey] || HEADLINE["nail-salon"];
  return `<h1 class="sw-h1">${ctx.t(a[0], a[1])} <em>${ctx.t(b[0], b[1])}</em><span class="sw-l2">${ctx.t(c[0], c[1])}</span></h1>`;
}

// Services as swatch cards: each one its own polish color, each a link to book.
function swatchCards(ctx) {
  return `<ul class="sw-cards">${serviceItems(ctx).map((s, i) => `<li class="rv"><a class="sw-card" href="#${REQUEST_ID}">${dot(i)}<span class="sw-card__name">${s.html}</span><span class="sw-card__go">${ctx.t("Book this", "Reservar")}${icon("arrow")}</span></a></li>`).join("")}</ul>`;
}

// Add ons ride inside the shared booking form: the lead's own services as
// optional extras, so nothing is invented. Placed just before the submit.
function withAddons(ctx) {
  if (ctx.services.length < 2) return ctx.form;
  const chips = ctx.services.map((s, i) => `<label class="f-chip"><input type="checkbox" name="addon" value="addon-${i + 1}"><span>${esc(s)}</span></label>`).join("");
  const field = `<fieldset class="f-field sw-addons"><legend>${ctx.t("Add to your visit", "Agregue a su visita")}</legend><div class="f-chips">${chips}</div><p class="f-hint">${ctx.t("Optional. Final details are settled with the salon.", "Opcional. Los detalles finales se ven con el salón.")}</p></fieldset>\n`;
  const at = ctx.form.indexOf("<button class=\"f-submit\"");
  return at < 0 ? ctx.form : `${ctx.form.slice(0, at)}${field}${ctx.form.slice(at)}`;
}

function render(ctx) {
  const t = ctx.t;
  const row = ctx.variants.hero === "row";
  const book = ctx.categoryKey === "hair-salon" ? ["Book your chair", "Reserve su silla"] : ["Book your set", "Reserve su cita"];
  const nav = [
    ctx.services.length ? { href: "#menu", label: ["Services", "Servicios"] } : null,
    { href: "#gallery", label: ["Gallery", "Galería"] },
    { href: "#visit", label: ["Visit", "Visítenos"] },
  ].filter(Boolean);
  const header = siteHeader(ctx, { nav, cta: ["Book", "Reservar"] });
  const ink = (label, ico = "calendar") => bookButton(ctx, { cls: "sw-btn sw-btn--ink", ico, label });
  const callPill = (label = ["Call", "Llamar"]) => callButton(ctx, { cls: "sw-btn sw-btn--line", label, number: false });

  const heroImg = ctx.photos.hero();
  const kicker = `<p class="sw-kicker">${dot(0)}<span>${ctx.name}</span><span>${ctx.categoryT}, ${esc(ctx.placeRaw)}</span></p>`;
  const intro = ctx.about || t("Pick a service, pick a time, bring your inspiration. The salon confirms your booking.", "Elija servicio y horario, traiga su inspiración. El salón confirma su cita.");
  const ctas = `<div class="sw-ctas">${ink(ctx.copy.ctaPrimary ? null : book)}${callPill()}</div>`;
  const chip = ratingProof(ctx, "chip");
  const photoTag = `<span class="sw-cap">${t("Stock photo", "Foto de archivo")}</span>`;

  let hero;
  if (row) {
    const center = `<div class="sw-pdot">${heroImg ? photoFrame(ctx, heroImg, { hero: true, sizes: "(min-width: 760px) 15rem, 8rem", width: 800 }) : bottle(0)}</div>`;
    const dots = Array.from({ length: 4 }, (_, i) => dot(i + 1, `sw-dot sw-dot--${i + 1}`));
    hero = `<section class="sw-hero sw-hero--row" id="top"><div class="wrap">${kicker}${headline(ctx)}<p class="sw-intro">${intro}</p>${ctas}${chip}
<div class="sw-row">${dots[0]}${dots[1]}${center}${dots[2]}${dots[3]}</div></div></section>`;
  } else {
    const shot = heroImg
      ? `<div class="sw-shot">${photoFrame(ctx, heroImg, { hero: true, sizes: "(min-width: 940px) 40vw, 100vw", width: 1200 })}${photoTag}</div>`
      : `<div class="sw-shot sw-shot--art">${bottles(0, 3)}</div>`;
    hero = `<section class="sw-hero sw-hero--field" id="top"><div class="wrap"><div class="sw-hero__grid"><div>${kicker}${headline(ctx)}<p class="sw-intro">${intro}</p>${ctas}${chip}</div>${shot}</div>
${swatchRow(6)}</div></section>`;
  }

  const sticker = ctx.variants.proof === "sticker";
  const words = `<div class="sw-proof__words"><h2 class="sw-h2">${t("Straight from", "Directo de")} <em>Google</em></h2>${themesBlock(ctx) || `<p class="sw-lede">${t("The rating and the review count come from the salon's Google listing.", "La calificación y las reseñas vienen del perfil de Google del salón.")}</p>`}</div>`;
  const proof = sticker
    ? `<section class="sw-sec sw-after-row" aria-label="Google rating"><div class="wrap sw-proof sw-proof--sticker"><div class="sw-chrome">${ratingProof(ctx, "sticker")}</div>${words}</div></section>`
    : `<section class="sw-sec sw-after-row" aria-label="Google rating"><div class="wrap sw-proof"><div class="sw-chrome"><div class="sw-chrome__in">${ratingProof(ctx, "strip")}</div></div>${words}</div></section>`;

  const cards = ctx.variants.services !== "list";
  const menu = ctx.services.length
    ? `<section class="sw-sec sw-sec--t2" id="menu"><div class="wrap"><div class="sw-head"><h2 class="sw-h2">${t("The", "El")} <em>${t("menu", "menú")}</em></h2><p class="sw-lede">${t("Tap a service to book it. Add extras when you pick your time.", "Toque un servicio para reservarlo. Agregue extras al elegir su horario.")}</p></div>${cards ? swatchCards(ctx) : servicesList(ctx, "menu", { tail: ["Book", "Reservar"], link: true, numbered: false })}${servicesConfirm(ctx)}</div></section>`
    : "";

  const steps = stepsFor(ctx);
  const how = `<section class="sw-sec"><div class="wrap"><div class="sw-head"><h2 class="sw-h2">${t("Your", "Su")} <em>${t("visit", "visita")}</em>${t(", step by step", ", paso a paso")}</h2><p class="sw-lede">${t("Most of it happens on your phone, before you sit down.", "Casi todo pasa en su teléfono, antes de sentarse.")}</p></div><ol class="sw-steps">${steps.map((s, i) => `<li class="rv"><span class="sw-dot" style="--c:var(--${SWATCHES[i]})"${SWATCHES[i] === "s4" ? " data-dark" : ""} aria-hidden="true">${i + 1}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  // Masonry: library photos first, then designed stand ins for the salon's own sets.
  const shots = ctx.photos.many(3);
  const shapes = ["sw-tile--a", "sw-tile--b", "sw-tile--c", "sw-tile--d", "sw-tile--b", "sw-tile--a"];
  const empty = t("Your work goes here", "Aquí va su trabajo");
  const fillers = [
    (cls) => `<div class="sw-tile ${cls} sw-tile--tint1"><div class="sw-fan" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => dot(i)).join("")}</div><span class="sw-tile__empty">${empty}</span></div>`,
    (cls, i) => `<div class="sw-tile ${cls} sw-tile--art sw-tile--one sw-tile--tint2">${bottles(i, 1)}<span class="sw-tile__empty">${empty}</span></div>`,
    (cls, i) => `<div class="sw-tile ${cls} sw-tile--art" style="background:var(--surface)">${bottles(i + 2, 3)}<span class="sw-tile__empty">${empty}</span></div>`,
  ];
  const tiles = shapes.map((cls, i) => {
    const p = shots[i];
    if (p) return `<div class="sw-tile ${cls} rv">${photoFrame(ctx, p, { sizes: "(min-width: 860px) 30vw, 50vw", width: 800 })}</div>`;
    return fillers[i % 3](cls, i);
  }).join("");
  const nails = ctx.categoryKey !== "hair-salon";
  const galleryTitle = nails ? [["Fresh", "Diseños"], ["sets", "recientes"]] : [["Fresh", "Color"], ["color", "reciente"]];
  const galleryLede = nails
    ? ["The salon's own nail art goes here, straight from its camera roll.", "Aquí va el nail art del salón, directo de su galería."]
    : ["The salon's own color and cuts go here, straight from its camera roll.", "Aquí van el color y los cortes del salón, directo de su galería."];
  const gallery = `<section class="sw-sec sw-sec--t3" id="gallery"><div class="wrap"><div class="sw-head"><h2 class="sw-h2">${t(galleryTitle[0][0], galleryTitle[0][1])} <em>${t(galleryTitle[1][0], galleryTitle[1][1])}</em></h2><p class="sw-lede">${t(galleryLede[0], galleryLede[1])}</p></div><div class="sw-masonry">${tiles}</div>${shots.length ? `<p class="sw-gallery-note">${t("Stock photos stand in for the salon's own work.", "Fotos de archivo en lugar del trabajo del salón.")}</p>` : ""}</div></section>`;

  const form = formHeading(ctx);
  const request = `<section class="sw-sec sw-sec--t1" id="${REQUEST_ID}"><div class="wrap sw-req"><div class="sw-req__side"><h2 class="sw-h2">${form.title}</h2><p class="sw-lede">${form.intro}</p>${ratingProof(ctx, "chip")}<div>${callPill(["Or call", "O llame"])}</div></div><div class="sw-panel">${withAddons(ctx)}</div></div></section>`;

  const visit = `<section class="sw-sec" id="visit"><div class="wrap sw-visit"><div><h2 class="sw-h2">${t("Come", "Venga")} <em>${t("by", "a vernos")}</em></h2><p class="sw-lede">${esc(ctx.placeRaw)}</p><div class="sw-ctas">${ink(book)}</div></div><div class="sw-box">${visitDetails(ctx)}</div></div></section>`;

  const faq = `<section class="sw-sec sw-sec--t2 sw-faq" id="faq"><div class="wrap sw-visit"><h2 class="sw-h2">${t("Quick", "Preguntas")} <em>${t("answers", "rápidas")}</em></h2>${faqBlock(ctx)}</div></section>`;

  const footer = siteFooter(ctx).replace("<div class=\"wrap\">", `<div class="wrap">${swatchRow(6)}`);

  return {
    css: CSS,
    body: `${header}<main>${hero}${proof}${menu}${how}${gallery}${request}${visit}${faq}<div class="sw-ft-gap" aria-hidden="true"></div></main>${footer}${floatingBook(ctx, { label: [book[0], "Reservar"] })}`,
  };
}

export const direction = {
  key: "nail-swatch-pop",
  label: "Swatch pop: color nail studio",
  status: "implemented",
  suits: ["nail-salon", "hair-salon"],
  keywords: ["bold", "color", "playful", "fun", "social"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=Ibarra+Real+Nova:ital,wght@1,500;1,600&display=swap",
  palettes: PALETTES,
  variants: { hero: ["field", "row"], services: ["cards", "list"], proof: ["card", "sticker"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /polish|manicure|color|foil/ },
  callbar: "split",
  render,
};
