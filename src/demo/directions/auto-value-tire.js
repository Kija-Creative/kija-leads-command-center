// Bold value tire shop (research/design-auto.md, direction 5). The corner sign
// you can read at 40 mph: one saturated color field with tread behind stacked
// heavy italic caps, a big drawn tire whose sidewall spells the size the
// visitor picks, and a call button as big as the finder. Inside, bright blocks,
// tread strip dividers and 3 degree slanted edges. No script: the finder is
// native radios, and :has() shows the picked size on the sidewall and again
// beside the quote form. The radios belong to the request form through the
// form attribute, so the pick travels with the request.

import {
  bookButton,
  callButton,
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
  { key: "tire-yellow", name: "Yellow line", vars: { flood: "#ffd400", "on-flood": "#111111", bg: "#ffffff", surface: "#f3f3f1", ink: "#111111", muted: "#4a4a4a", line: "#dcdcd8", primary: "#e10600", "on-primary": "#ffffff", accent: "#ffd400", "on-accent": "#111111", black: "#111111", "on-black": "#ffffff", "black-muted": "#b9b9b9", rubber: "#1b1b1b", wall: "#f4f4f4", edge: "#111111", call: "#e10600", "on-call": "#ffffff" } },
  { key: "tire-lime", name: "Rubber and lime", vars: { flood: "#b6f000", "on-flood": "#111111", bg: "#151515", surface: "#202020", ink: "#f7f7f7", muted: "#b4b4b4", line: "#343434", primary: "#b6f000", "on-primary": "#111111", accent: "#b6f000", "on-accent": "#111111", black: "#0c0c0c", "on-black": "#f7f7f7", "black-muted": "#a8a8a8", rubber: "#141414", wall: "#b6f000", edge: "#b6f000", call: "#b6f000", "on-call": "#111111" } },
  { key: "tire-sale", name: "Sale red", vars: { flood: "#d71920", "on-flood": "#ffffff", bg: "#ffffff", surface: "#fff3d6", ink: "#1a1a1a", muted: "#574c3b", line: "#eadfc8", primary: "#1a1a1a", "on-primary": "#ffffff", accent: "#ffc629", "on-accent": "#1a1a1a", black: "#1a1a1a", "on-black": "#ffffff", "black-muted": "#c2b9aa", rubber: "#1c1c1c", wall: "#ffc629", edge: "#1a1a1a", call: "#ffc629", "on-call": "#1a1a1a" } },
];

const WIDTHS = ["195", "205", "215", "225", "235", "245", "255", "265", "275"];
const ASPECTS = ["40", "45", "50", "55", "60", "65", "70", "75"];
const RIMS = ["15", "16", "17", "18", "19", "20", "22"];
const DEFAULT_SIZE = { w: "225", a: "65", r: "17" };

// What the car is doing, for shops whose request is a repair estimate. These
// describe the customer's problem, never a service the shop is said to offer.
const SYMPTOMS = {
  "muffler-exhaust": [
    { key: "loud", label: ["Loud exhaust", "Escape ruidoso"] },
    { key: "rattle", label: ["Rattle underneath", "Ruido abajo"] },
    { key: "cel", label: ["Check engine light", "Luz de motor"] },
    { key: "smell", label: ["Smells like fumes", "Huele a gases"] },
    { key: "hanging", label: ["Something hanging", "Algo colgando"] },
    { key: "other", label: ["Something else", "Otra cosa"] },
  ],
  default: [
    { key: "cel", label: ["Check engine light", "Luz de motor"] },
    { key: "brakes", label: ["Brakes squeal", "Frenos rechinan"] },
    { key: "ac", label: ["AC blows warm", "El aire no enfría"] },
    { key: "start", label: ["Will not start", "No arranca"] },
    { key: "noise", label: ["New noise", "Ruido nuevo"] },
    { key: "other", label: ["Something else", "Otra cosa"] },
  ],
};

const CSS = `
:root{--display:"Kanit","Arial Narrow",sans-serif;--body:"Rubik",system-ui,sans-serif;--radius:4px;--btn-radius:6px;--chip-radius:6px;--max:1240px;--ease:cubic-bezier(.22,1,.36,1);--slant:clamp(1.5rem,5.2vw,4.5rem);--hard:6px 6px 0 var(--edge);--field:var(--bg);--field-line:color-mix(in oklab,var(--ink) 35%,transparent);--star:currentColor;--lang-fg:var(--ink);--lang-on:var(--bg)}
body{font-size:1.0625rem;line-height:1.6}
.vt-caps{font-family:var(--display);font-style:italic;font-weight:800;text-transform:uppercase;letter-spacing:-.01em;line-height:.9}

.b-hd{position:sticky;top:0;z-index:10;background:var(--black);color:var(--on-black)}
.b-hd__in{display:flex;align-items:center;gap:1rem;min-height:4.25rem}
.b-brand{margin-right:auto;font-family:var(--display);font-style:italic;font-weight:800;font-size:1.45rem;text-transform:uppercase;line-height:1;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:58vw}
.b-hd__end{display:flex;align-items:center;gap:.6rem}
.b-hd__tel{display:none;align-items:center;gap:.45rem;min-height:2.75rem;padding:0 1rem;border-radius:var(--btn-radius);background:var(--flood);color:var(--on-flood);font-family:var(--display);font-weight:600;font-size:1.05rem;text-decoration:none}
@media (min-width:760px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.75rem;padding:0 1rem;border:2px solid currentColor;border-radius:var(--btn-radius);font-family:var(--display);font-weight:600;text-decoration:none}
.b-hd .lang{--lang-fg:var(--flood);--lang-on:var(--on-flood);flex-direction:row-reverse;font-family:var(--display);font-size:.95rem;border-width:2px;border-radius:var(--btn-radius)}
.b-hd .lang button{min-width:2.75rem;min-height:2.3rem;border-radius:3px}
.vt-habla{display:none;font-family:var(--display);font-weight:600;font-size:.9rem;color:var(--black-muted)}
@media (min-width:1000px){.vt-habla{display:inline}}

.vt-hero{position:relative;z-index:1;margin-bottom:calc(var(--slant) * -1);overflow:hidden;background:var(--flood);color:var(--on-flood);clip-path:polygon(0 0,100% 0,100% calc(100% - var(--slant)),0 100%);padding:clamp(2rem,5vw,4rem) 0 calc(var(--slant) + clamp(2.5rem,5vw,4rem))}
.vt-tread-bg{position:absolute;inset:0;width:100%;height:100%;color:var(--on-flood);opacity:.07;pointer-events:none}
.vt-hero__grid{position:relative;display:grid;gap:clamp(1.5rem,4vw,3rem);grid-template-columns:minmax(0,1fr);grid-template-areas:"copy" "tire" "finder"}
@media (min-width:960px){.vt-hero__grid{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);grid-template-areas:"copy tire" "finder finder";align-items:center}}
.vt-copy{grid-area:copy;container-type:inline-size;min-width:0}
.vt-where{display:inline-flex;flex-wrap:wrap;gap:.25rem .75rem;align-items:center;font-family:var(--display);font-weight:600;font-size:1.05rem;text-transform:uppercase;letter-spacing:.02em}
.vt-where b{padding:.15rem .6rem;background:var(--on-flood);color:var(--flood);border-radius:3px;font-weight:600}
.vt-name{margin-top:.9rem;font-size:min(6rem,calc(100cqi / (var(--lw) * .66)));overflow-wrap:anywhere}
.vt-name--stack span{display:block}
@media (max-width:599.98px){.vt-name{font-size:min(3.6rem,calc(100cqi / (var(--lw) * .66)))}}
.vt-promise{margin-top:1.1rem;max-width:30ch;font-size:clamp(1.15rem,2vw,1.4rem);font-weight:500;line-height:1.35}
.vt-about{margin-top:.75rem;max-width:48ch}
.vt-tire{position:relative;justify-self:center;width:min(100%,34rem);aspect-ratio:1}
.vt-tire-wrap{grid-area:tire;position:relative;display:grid;min-width:0}
@media (max-width:959.98px){.vt-tire-wrap .vt-tire{width:min(86%,26rem)}}
.vt-tire svg{width:100%;height:100%;overflow:visible}
.vt-tire__spin{transform-origin:200px 200px;animation:vt-roll 1.4s var(--ease) both}
@keyframes vt-roll{from{transform:translateX(-60px) rotate(-200deg);opacity:0}to{transform:none;opacity:1}}
@media (min-width:960px){.vt-tire-wrap .vt-tire{justify-self:end;width:min(88%,31rem);margin-right:-1rem}}
.vt-sw{font-family:var(--display);font-weight:600;text-transform:uppercase;fill:var(--wall);letter-spacing:.06em}
.vt-sw--name{font-size:20px}
.vt-sw--size{font-family:var(--display);font-style:italic;font-weight:800;font-size:33px;letter-spacing:.04em}
.vt-sw--word{font-size:26px}
.vt-o{display:none}
@supports not selector(:has(*)){.vt-o--def{display:inline}}

.vt-sticker{position:absolute;left:0;top:50%;margin-top:-4.75rem;z-index:2;display:grid;place-items:center;align-content:center;gap:.15rem;width:9.5rem;aspect-ratio:1;padding:1rem;border-radius:50%;background:var(--black);color:var(--on-black);text-align:center;transform:rotate(-9deg);box-shadow:5px 5px 0 color-mix(in oklab,var(--black) 35%,transparent);outline:2px dashed color-mix(in oklab,var(--on-black) 45%,transparent);outline-offset:-9px}
.vt-sticker .b-rating__num{font-family:var(--display);font-style:italic;font-weight:800;font-size:2.9rem;line-height:.9}
.vt-sticker .stars{width:5.5rem;height:1.1rem;color:var(--flood)}
.vt-sticker .b-rating__count{font-family:var(--display);font-weight:600;font-size:.82rem;line-height:1.1;text-transform:uppercase;max-width:7rem}
@media (max-width:959.98px){.vt-sticker{width:8rem;left:0;top:auto;bottom:0;margin-top:0}.vt-sticker .b-rating__num{font-size:2.4rem}}

.vt-finder{grid-area:finder;display:grid;gap:0;background:var(--black);color:var(--on-black);border-radius:var(--radius);box-shadow:8px 8px 0 color-mix(in oklab,var(--black) 30%,transparent);overflow:hidden}
@media (min-width:960px){.vt-finder{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)}}
.vt-finder__pick{padding:clamp(1.25rem,3vw,2rem);display:grid;gap:1rem;min-width:0}
.vt-finder__title{font-size:clamp(1.6rem,3vw,2.2rem)}
.vt-row{border:0;margin:0;padding:0;min-width:0;display:grid;gap:.45rem}
.vt-row legend{padding:0;font-family:var(--display);font-weight:600;font-size:.95rem;text-transform:uppercase;letter-spacing:.04em;color:var(--black-muted)}
.vt-opts{display:flex;gap:.4rem;overflow-x:auto;scroll-snap-type:x proximity;padding:.15rem .1rem .45rem;scrollbar-width:thin}
.vt-opt{position:relative;flex:none;scroll-snap-align:start}
.vt-opt input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}
.vt-opt>span{display:grid;place-items:center;min-width:3.4rem;min-height:3rem;padding:0 .8rem;border:2px solid color-mix(in oklab,var(--on-black) 28%,transparent);border-radius:var(--chip-radius);font-family:var(--display);font-weight:600;font-size:1.15rem;line-height:1.1;transition:background-color .15s,color .15s,border-color .15s,transform .2s var(--ease)}
.vt-opt:hover>span{border-color:var(--on-black)}
.vt-opt input:checked+span{background:var(--flood);color:var(--on-flood);border-color:var(--flood);transform:translateY(-2px)}
.vt-opt input:focus-visible+span{outline:3px solid var(--flood);outline-offset:2px}
.vt-opts--words{flex-wrap:wrap;overflow:visible}
.vt-opts--words .vt-opt>span{font-size:1rem;text-transform:uppercase;padding:0 1rem}
.vt-readout{display:flex;flex-wrap:wrap;align-items:baseline;gap:.25rem 1rem}
.vt-readout__size{font-size:clamp(2.2rem,5vw,3.2rem);color:var(--flood)}
.vt-readout__hint{color:var(--black-muted);font-size:.95rem}
.vt-finder__go{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center}
.vt-btn{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;min-height:3.5rem;padding:0 1.5rem;border-radius:var(--btn-radius);font-family:var(--display);font-weight:600;font-size:1.15rem;text-decoration:none;border:2px solid transparent;transition:transform .2s var(--ease),filter .2s}
.vt-btn:hover{transform:translateY(-2px);filter:brightness(1.05)}
.vt-btn--flood{background:var(--flood);color:var(--on-flood)}
.vt-btn--ink{background:var(--black);color:var(--on-black)}
.vt-btn--line{border-color:currentColor;color:inherit}
.vt-snap{position:relative;display:inline-flex;align-items:center;gap:.5rem;min-height:3rem;padding:0 .25rem;font-weight:500;text-decoration:underline;text-underline-offset:.2em;cursor:pointer}
.vt-snap input{position:absolute;inset:0;opacity:0;cursor:pointer}
.vt-snap:focus-within{outline:3px solid var(--flood);outline-offset:2px}
.vt-snap-previews{display:flex;gap:.4rem}
.vt-snap-previews:empty{display:none}
.vt-snap-previews img{width:3.5rem;height:3.5rem;object-fit:cover;border-radius:3px}
.vt-call{display:grid;align-content:center;gap:.35rem;padding:clamp(1.5rem,3vw,2.25rem);background:var(--call);color:var(--on-call);text-decoration:none;min-height:9rem;transition:filter .2s}
.vt-call:hover{filter:brightness(1.07)}
.vt-call__lbl{display:flex;align-items:center;gap:.5rem;font-family:var(--display);font-weight:600;font-size:1.1rem;text-transform:uppercase;letter-spacing:.03em}
.vt-call__num{font-size:clamp(2.3rem,5.5vw,3.6rem);white-space:nowrap;font-variant-numeric:tabular-nums}
.vt-call__sub{font-size:.95rem;opacity:.92}
.vt-hero--shop .vt-shot{grid-area:tire;align-self:stretch;position:relative;margin:0;min-height:26rem;border:3px solid var(--on-flood);border-radius:var(--radius);box-shadow:var(--hard);overflow:hidden;background:var(--black)}
.vt-hero--shop .vt-shot .b-photo{position:absolute;inset:0}
.vt-hero--shop .vt-shot img{filter:grayscale(1) contrast(1.25);mix-blend-mode:luminosity}
.vt-hero--shop .vt-shot::after{content:"";position:absolute;inset:0;background:var(--flood);mix-blend-mode:multiply;opacity:.55;pointer-events:none}
.vt-hero--shop .vt-tire--mini{position:absolute;left:-2.5rem;bottom:-2.5rem;width:13rem;z-index:1}
.vt-hero--shop .vt-sticker{left:auto;top:auto;margin-top:0;bottom:1rem;right:1rem}
.vt-hero--shop .vt-shot .stock-tag{left:auto;right:.6rem;bottom:auto;top:.6rem}
@media (max-width:959.98px){.vt-hero--shop .vt-shot{min-height:17rem}.vt-hero--shop .vt-tire--mini{width:9.5rem;left:-1.25rem;bottom:-1.5rem}}

.vt-band{background:var(--black);color:var(--on-black);padding:1.5rem 0}
.vt-band .b-rating{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1.5rem}
.vt-band .b-rating__num{font-family:var(--display);font-style:italic;font-weight:800;font-size:clamp(3rem,7vw,4.5rem);line-height:.9;color:var(--flood)}
.vt-band .b-rating__side{display:grid;gap:.2rem}
.vt-band .stars{color:var(--flood)}
.vt-band .b-rating__count{font-family:var(--display);font-weight:600;font-size:1.25rem;text-transform:uppercase}
.vt-band .b-rating__cap{color:var(--black-muted)}

.vt-strip{height:28px;color:var(--black);background:var(--flood)}
.vt-strip svg{display:block;width:100%;height:100%}

.vt-sec{position:relative;padding:clamp(4rem,9vw,7rem) 0}
.vt-sec--alt{background:var(--surface)}
.vt-sec--black{background:var(--black);color:var(--on-black)}
.vt-sec--flood{background:var(--flood);color:var(--on-flood)}
.vt-sec--slant{clip-path:polygon(0 var(--slant),100% 0,100% calc(100% - var(--slant)),0 100%);padding-block:calc(var(--slant) + clamp(3rem,7vw,5.5rem))}
.vt-sec--slant{z-index:1;margin-block:calc(var(--slant) * -1)}
.vt-sec--slant+.vt-sec,.vt-hero+.vt-sec{padding-top:calc(var(--slant) + clamp(4rem,9vw,7rem))}
.vt-sec:has(+ .vt-sec--slant){padding-bottom:calc(var(--slant) + clamp(4rem,9vw,7rem))}
.vt-hero+.vt-band{padding-top:calc(var(--slant) + 1.5rem)}
.vt-h2{font-size:clamp(2.4rem,6vw,4.75rem);line-height:1.04}
.vt-h2 mark{display:inline-block;margin-top:.08em;padding:.02em .16em .06em;line-height:.95}
.vt-h2 mark{background:var(--flood);color:var(--on-flood)}
.vt-sec--flood .vt-h2 mark,.vt-sec--black .vt-h2 mark{background:var(--on-flood);color:var(--flood)}
.vt-sec--black .vt-h2 mark{background:var(--flood);color:var(--on-flood)}
.vt-lede{margin-top:1rem;max-width:56ch;font-size:1.1rem}
.vt-sec--alt .vt-lede,.vt-sec:not(.vt-sec--black):not(.vt-sec--flood) .vt-lede{color:var(--muted)}
.vt-sec--black .vt-lede{color:var(--black-muted)}
.vt-head{display:grid;gap:1rem;align-items:end}
@media (min-width:900px){.vt-head{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)}.vt-head .vt-lede{margin:0}}

.vt-read{margin-top:3rem;display:grid;gap:2rem;align-items:center}
@media (min-width:960px){.vt-read{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:4rem}}
.vt-read__code{position:relative;padding:clamp(1.5rem,4vw,2.5rem) clamp(1rem,3vw,2rem);background:var(--rubber);color:#f4f4f4;border-radius:var(--radius);overflow:hidden}
.vt-read__code::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 10px,rgb(255 255 255 / .035) 10px 12px);pointer-events:none}
.vt-code{position:relative;display:flex;align-items:flex-end;justify-content:center;flex-wrap:nowrap;font-size:clamp(2.6rem,7vw,4.5rem)}
.vt-seg{display:grid;justify-items:center;gap:.35rem}
.vt-seg small{font-family:var(--body);font-style:normal;font-weight:500;font-size:.8rem;letter-spacing:.06em;color:#bdbdbd;text-transform:none}
.vt-seg b{font-weight:800;line-height:1;padding:0 .04em}
.vt-seg--hi b{color:var(--wall)}
.vt-seg i{display:grid;place-items:center;width:1.6rem;height:1.6rem;border-radius:50%;background:#f4f4f4;color:#111;font-family:var(--display);font-style:normal;font-weight:600;font-size:.85rem}
.vt-seg--sep i{visibility:hidden}
.vt-seg--gap{width:.35em}
.vt-read__list{display:grid;gap:0;counter-reset:rd}
.vt-read__list li{display:grid;grid-template-columns:3.5rem 1fr;gap:1rem;padding:1rem 0;border-bottom:2px solid var(--line)}
.vt-read__list li:first-child{border-top:2px solid var(--line)}
.vt-read__list b{font-family:var(--display);font-style:italic;font-weight:800;font-size:1.9rem;line-height:1}
.vt-read__list h3{font-family:var(--display);font-weight:600;font-size:1.25rem;line-height:1.2}
.vt-read__list p{color:var(--muted)}
.vt-read__note{margin-top:1.25rem;color:var(--muted)}

.b-svc{margin-top:3rem;display:grid;gap:.75rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))}
.b-svc__item{position:relative;display:flex;align-items:flex-end;min-height:9rem;padding:1.25rem;border-radius:var(--radius);font-family:var(--display);font-style:italic;font-weight:800;font-size:clamp(1.5rem,2.6vw,2rem);line-height:1;text-transform:uppercase;background:var(--bg);color:var(--ink);border:3px solid var(--edge);box-shadow:var(--hard);transition:transform .25s var(--ease),box-shadow .25s var(--ease)}
.b-svc__item:hover{transform:translate(-3px,-3px);box-shadow:9px 9px 0 var(--edge)}
.b-svc__item:nth-child(4n+1){background:var(--flood);color:var(--on-flood)}
.b-svc__item:nth-child(4n+2){background:var(--black);color:var(--on-black)}
.b-svc__item:nth-child(4n+3){background:var(--accent);color:var(--on-accent)}
.b-svc__n{position:absolute;top:1rem;left:1.25rem;font-size:1rem;font-style:normal;font-weight:600;opacity:.75}
.vt-svc--rows .b-svc{grid-template-columns:1fr;gap:0}
.vt-svc--rows .b-svc__item{min-height:0;padding:1.1rem 1.25rem 1.1rem 4.5rem;box-shadow:none;border-width:0 0 3px;border-radius:0;font-size:clamp(1.6rem,3.6vw,2.6rem)}
.vt-svc--rows .b-svc__item:first-child{border-top-width:3px}
.vt-svc--rows .b-svc__item:hover{transform:translateX(6px);box-shadow:none}
.vt-svc--rows .b-svc__n{top:50%;transform:translateY(-50%)}
.b-svc-confirm{margin-top:2rem;font-weight:500}
.svc-note{margin-top:.35rem;color:var(--muted);font-size:.95rem}

.vt-shots{display:grid;gap:1rem;margin-top:3rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))}
.vt-shots .b-photo{aspect-ratio:4/3;border:3px solid var(--on-black);border-radius:var(--radius);box-shadow:6px 6px 0 var(--flood)}
.vt-shots .b-photo img{filter:saturate(1.3) contrast(1.12)}
.vt-shots-note{margin-top:1.25rem;color:var(--black-muted);font-size:.95rem}

.vt-before{display:grid;gap:1rem;margin-top:3rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))}
.vt-before li{padding:1.5rem;border:3px solid var(--edge);border-radius:var(--radius);background:var(--bg)}
.vt-before b{display:block;font-family:var(--display);font-style:italic;font-weight:800;font-size:3rem;line-height:1;color:var(--primary)}
.vt-before h3{margin-top:.5rem;font-family:var(--display);font-weight:600;font-size:1.35rem;line-height:1.2}
.vt-before p{margin-top:.35rem;color:var(--muted)}

.vt-visit{display:grid;gap:2.5rem}
@media (min-width:960px){.vt-visit{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4rem;align-items:start}}
.vt-visit .vt-btn{margin-top:2rem}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:1rem 0;border-bottom:2px solid color-mix(in oklab,currentColor 25%,transparent)}
.facts div:first-child{border-top:2px solid color-mix(in oklab,currentColor 25%,transparent)}
.facts dt{font-family:var(--display);font-weight:600;text-transform:uppercase;letter-spacing:.03em;opacity:.8}
.facts dd{margin:0;font-weight:500;font-size:1.1rem}
.b-visit__pending{display:grid;gap:.4rem;margin-top:1.25rem}
.vt-sec--black .b-visit__pending{color:var(--black-muted)}
.dir{display:inline-flex;align-items:center;gap:.5rem;min-height:3rem;margin-top:1rem;font-weight:500;color:inherit}

.b-themes{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:2rem}
.b-themes li{padding:.7rem 1.1rem;border-radius:var(--chip-radius);background:var(--on-flood);color:var(--flood);font-family:var(--display);font-weight:600;font-size:1.15rem}
.b-themes__note{margin-top:1rem;font-size:.95rem;opacity:.85}

.vt-quote{display:grid;gap:2.5rem}
@media (min-width:980px){.vt-quote{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}.vt-quote__side{position:sticky;top:6rem;align-self:start}}
.vt-picked{display:inline-flex;flex-wrap:wrap;align-items:baseline;gap:.35rem .75rem;margin-top:1.5rem;padding:.8rem 1.1rem;border-radius:var(--radius);background:var(--flood);color:var(--on-flood)}
.vt-picked b{font-family:var(--display);font-style:italic;font-weight:800;font-size:1.9rem;line-height:1;text-transform:uppercase}
.vt-picked small{font-size:.9rem}
.vt-panel{padding:clamp(1.25rem,3.5vw,2.5rem);border:3px solid var(--edge);border-radius:var(--radius);background:var(--bg);box-shadow:var(--hard)}
.f-label,.f-field legend{font-family:var(--display);font-weight:600;font-size:1rem;text-transform:uppercase;letter-spacing:.03em}
.f-input{border-width:2px}
.f-chip input:checked+span{background:var(--flood);color:var(--on-flood);border-color:var(--flood)}
.f-submit{min-height:3.5rem;border-radius:var(--btn-radius);background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:600;font-size:1.15rem}

.vt-faq .faq summary{font-family:var(--display);font-weight:600;font-size:clamp(1.2rem,2.2vw,1.45rem)}
.vt-faq .faq details{border-color:var(--line)}
.vt-faq-grid{display:grid;gap:2rem}
@media (min-width:900px){.vt-faq-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}}

.vt-close{text-align:left}
.vt-close .vt-h2{max-width:14ch}
.vt-close__num{display:inline-block;margin-top:1.5rem;font-size:clamp(3rem,11vw,7.5rem);line-height:.9;color:inherit;text-decoration:none;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.vt-close__num:hover{text-decoration:underline;text-decoration-thickness:4px;text-underline-offset:.1em}
.vt-close__go{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}

.b-ft{background:var(--black);color:var(--on-black);padding:3.5rem 0 2.5rem}
.b-ft__name{font-family:var(--display);font-style:italic;font-weight:800;font-size:clamp(2rem,5vw,3.25rem);text-transform:uppercase;line-height:.95}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;color:var(--black-muted)}
.b-ft__row a{color:var(--on-black);font-weight:500}
.legal{margin-top:1.5rem;font-size:.85rem;color:var(--black-muted)}
.stock-credits{margin-top:.5rem;color:var(--black-muted)}
.callbar{background:var(--call);color:var(--on-call);font-family:var(--display);font-weight:600;font-size:1.15rem;border-radius:var(--btn-radius)}
`;

// A radio group of the finder. Each radio belongs to the request form (form
// attribute), and `tspans` gets the markup that shows the choice.
function optionGroup(ctx, { name, legend, options, formId, words = false }) {
  const gid = uid(ctx, "vt");
  const rules = [];
  const items = options.map((o) => {
    const id = `${gid}-${o.key}`;
    rules.push({ id, cls: `vt-o-${gid}-${o.key}` });
    const text = Array.isArray(o.label) ? ctx.t(o.label[0], o.label[1]) : esc(o.label);
    return `<label class="vt-opt"><input type="radio" name="${esc(name)}" value="${esc(o.key)}" id="${id}"${formId ? ` form="${formId}"` : ""}${o.checked ? " checked" : ""}><span>${text}</span></label>`;
  }).join("");
  const html = `<fieldset class="vt-row"><legend>${legend}</legend><div class="vt-opts${words ? " vt-opts--words" : ""}">${items}</div></fieldset>`;
  // Markup that shows only the checked option: in SVG as tspans, in HTML as spans.
  const show = (tag = "tspan") => options.map((o, i) => {
    const lbl = Array.isArray(o.label) ? o.label : [o.label, o.label];
    const i18n = Array.isArray(o.label) ? ctx.i18n.ti(lbl[0], lbl[1]) : "";
    return `<${tag} class="vt-o vt-o-${gid}-${o.key}${o.checked ? " vt-o--def" : ""}"${i18n}>${esc(lbl[0])}</${tag}>`;
  }).join("");
  const css = rules.map((r) => `html:has(#${r.id}:checked) .${r.cls}{display:inline}`).join("\n");
  return { html, show, css };
}

// Background tread: directional chevron blocks, as an inline SVG pattern.
function treadPattern(ctx, cls) {
  const id = uid(ctx, "vt-tr");
  return `<svg class="${cls}" aria-hidden="true" focusable="false" preserveAspectRatio="none"><defs><pattern id="${id}" width="64" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)"><path d="M0 0h14l18 22-18 22H0l18-22z M34 0h14l18 22-18 22H34l18-22z" fill="currentColor"/></pattern></defs><rect width="100%" height="100%" fill="url(#${id})"/></svg>`;
}

function treadStrip(ctx) {
  const id = uid(ctx, "vt-st");
  return `<div class="vt-strip" aria-hidden="true"><svg focusable="false" preserveAspectRatio="none"><defs><pattern id="${id}" width="36" height="28" patternUnits="userSpaceOnUse"><path d="M2 0h12l10 14-10 14H2l10-14z" fill="currentColor"/><rect x="26" y="0" width="4" height="28" fill="currentColor" opacity=".35"/></pattern></defs><rect width="100%" height="100%" fill="url(#${id})"/></svg></div>`;
}

// The drawn tire. The top arc carries the name, the bottom arc the live pick.
function tireSvg(ctx, bottom, { cls = "vt-tire", words = false } = {}) {
  const top = uid(ctx, "vt-arc");
  const low = uid(ctx, "vt-arc");
  const rim = uid(ctx, "vt-rim");
  const notches = Array.from({ length: 56 }, (_, i) => `<rect x="194" y="6" width="12" height="16" rx="2" transform="rotate(${(i * 360) / 56} 200 200)"/>`).join("");
  const spokes = Array.from({ length: 6 }, (_, i) => `<path d="M188 128 L212 128 L206 176 L194 176 Z" transform="rotate(${i * 60} 200 200)"/>`).join("");
  const lugs = Array.from({ length: 5 }, (_, i) => {
    const a = ((i * 72 - 90) * Math.PI) / 180;
    return `<circle cx="${(200 + Math.cos(a) * 17).toFixed(1)}" cy="${(200 + Math.sin(a) * 17).toFixed(1)}" r="3.6"/>`;
  }).join("");
  const name = esc(ctx.nameRaw.toUpperCase());
  // The top arc is about 470 units long; long names shrink to fit it.
  const nameSize = Math.min(22, 470 / (Math.max(ctx.nameRaw.length, 1) * 0.72)).toFixed(1);
  return `<div class="${cls}" aria-hidden="true"><svg viewBox="0 0 400 400" focusable="false"><defs><radialGradient id="${rim}" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#f2f2f2"/><stop offset=".55" stop-color="#b9bcc0"/><stop offset="1" stop-color="#6c7075"/></radialGradient><path id="${top}" d="M42 200 A158 158 0 0 1 358 200"/><path id="${low}" d="M18 200 A182 182 0 0 0 382 200"/></defs>
<g class="vt-tire__spin"><circle cx="200" cy="200" r="194" fill="var(--rubber)"/><g fill="var(--rubber)" stroke="color-mix(in oklab,var(--rubber) 70%,#fff)" stroke-width="1">${notches}</g>
<circle cx="200" cy="200" r="190" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="4"/>
<circle cx="200" cy="200" r="148" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="2"/>
<text class="vt-sw vt-sw--name" style="font-size:${nameSize}px"><textPath href="#${top}" startOffset="50%" text-anchor="middle">${name}</textPath></text>
<text class="vt-sw vt-sw--size${words ? " vt-sw--word" : ""}"><textPath href="#${low}" startOffset="50%" text-anchor="middle">${bottom}</textPath></text>
<circle cx="200" cy="200" r="124" fill="#0c0c0c"/><circle cx="200" cy="200" r="116" fill="url(#${rim})"/><circle cx="200" cy="200" r="104" fill="#2a2c2f"/>
<g fill="url(#${rim})">${spokes}</g><circle cx="200" cy="200" r="30" fill="url(#${rim})" stroke="#2a2c2f" stroke-width="3"/><g fill="#2a2c2f">${lugs}</g><circle cx="200" cy="200" r="7" fill="#2a2c2f"/></g></svg></div>`;
}

function nameStack(ctx) {
  const words = ctx.nameRaw.trim().split(/\s+/).filter(Boolean);
  const longest = words.reduce((m, w) => Math.max(m, w.length), 1);
  // Up to three words stack like a sign; longer names wrap as a block.
  const stack = words.length <= 3 ? " vt-name--stack" : "";
  return `<h1 class="vt-name vt-caps${stack}" style="--lw:${Math.max(longest, 5)}">${words.map((w) => `<span>${esc(w)}</span>`).join(" ")}</h1>`;
}

function withFormId(ctx, id) {
  return ctx.form.replace("<form class=\"req-form\"", `<form id="${id}" class="req-form"`);
}

function render(ctx) {
  const t = ctx.t;
  const tires = ctx.kind === "tire-quote";
  const shop = ctx.variants.hero === "shop";
  const formId = "vt-form";
  const form = formHeading(ctx);
  const extraCss = [];

  // The finder: a size for tire shops, a symptom for repair and exhaust shops.
  let pick;
  let bottom;
  let readout;
  let picked;
  if (tires) {
    const w = optionGroup(ctx, { name: "width", legend: t("Width", "Ancho"), formId, options: WIDTHS.map((v) => ({ key: v, label: v, checked: v === DEFAULT_SIZE.w })) });
    const a = optionGroup(ctx, { name: "aspect", legend: t("Aspect ratio", "Perfil"), formId, options: ASPECTS.map((v) => ({ key: v, label: v, checked: v === DEFAULT_SIZE.a })) });
    const r = optionGroup(ctx, { name: "rim", legend: t("Rim", "Rin"), formId, options: RIMS.map((v) => ({ key: v, label: v, checked: v === DEFAULT_SIZE.r })) });
    extraCss.push(w.css, a.css, r.css);
    pick = `${w.html}${a.html}${r.html}`;
    bottom = `${w.show()}/${a.show()}R${r.show()}`;
    readout = `<p class="vt-readout"><span class="vt-readout__size vt-caps">${w.show("span")}/${a.show("span")}R${r.show("span")}</span><span class="vt-readout__hint">${t("Match the numbers on your sidewall.", "Compare con los números del costado.")}</span></p>`;
    picked = `<p class="vt-picked"><small>${t("Size from the finder", "Medida del buscador")}</small><b>${w.show("span")}/${a.show("span")}R${r.show("span")}</b></p>`;
  } else {
    const list = SYMPTOMS[ctx.categoryKey] || SYMPTOMS.default;
    const s = optionGroup(ctx, { name: "symptom", legend: t("Pick the closest one", "Elija el más parecido"), formId, words: true, options: list.map((o, i) => ({ ...o, checked: i === 0 })) });
    extraCss.push(s.css);
    pick = s.html;
    bottom = s.show();
    readout = "";
    picked = `<p class="vt-picked"><small>${t("From the picker", "Del selector")}</small><b>${s.show("span")}</b></p>`;
  }

  const photoInput = tires
    ? `<label class="vt-snap">${icon("camera")}<span>${t("Not sure? Snap the sidewall", "¿No sabe? Tómele foto al costado")}</span><input type="file" accept="image/*" name="sidewall" form="${formId}" data-photo-input="vt-snaps" aria-describedby="vt-snap-note"></label><span class="vt-snap-previews" id="vt-snaps" aria-live="polite"></span><span class="sr-only" id="vt-snap-note">${t("Photos stay on your device in this concept.", "En este concepto las fotos se quedan en su equipo.")}</span>`
    : "";
  const callBlock = ctx.tel
    ? `<a class="vt-call" href="${esc(ctx.tel)}"><span class="vt-call__lbl">${icon("phone")}${ctx.copyOr("ctaSecondary", tires ? ["Call for your size", "Llame por su medida"] : ["Call the shop", "Llame al taller"])}</span><span class="vt-call__num vt-caps">${esc(ctx.phone)}</span><span class="vt-call__sub">${t("Calling is the fastest way to check.", "Llamar es lo más rápido para confirmar.")}</span></a>`
    : "";
  const finder = `<div class="vt-finder"><div class="vt-finder__pick"><h2 class="vt-finder__title vt-caps">${tires ? t("Find your size", "Busque su medida") : t("What is it doing?", "¿Qué está haciendo?")}</h2>${pick}${readout}<div class="vt-finder__go">${bookButton(ctx, { cls: "vt-btn vt-btn--flood", ico: "", arrow: true, label: tires ? ["Check this size", "Revisar esta medida"] : ["Send this to the shop", "Mandar al taller"] })}${photoInput}</div></div>${callBlock}</div>`;

  const proofVariant = ctx.variants.proof === "band" ? "band" : "sticker";
  const sticker = proofVariant === "sticker" ? ratingProof(ctx, "sticker", { cls: "vt-sticker" }) : "";
  const tire = tireSvg(ctx, bottom, { cls: shop ? "vt-tire vt-tire--mini" : "vt-tire", words: !tires });
  const heroShot = shop ? ctx.photos.hero() : null;
  const art = shop && heroShot
    ? `<div class="vt-shot">${photoFrame(ctx, heroShot, { hero: true, sizes: "(min-width: 960px) 45vw, 100vw", tag: true })}${tire}${sticker}</div>`
    : `<div class="vt-tire-wrap" style="grid-area:tire;position:relative">${tire}${sticker}</div>`;

  const habla = ctx.i18n.enabled ? `<span class="vt-habla" lang="es">Se habla español</span>` : "";
  const header = siteHeader(ctx, { cta: tires ? ["Check my size", "Mi medida"] : ["Get a quote", "Cotizar"], brand: `${ctx.name}` }).replace("<div class=\"b-hd__end\">", `<div class="b-hd__end">${habla}`);

  const hero = `<section class="vt-hero vt-hero--${shop ? "shop" : "stack"}" id="top">${treadPattern(ctx, "vt-tread-bg")}<div class="wrap vt-hero__grid">
<div class="vt-copy"><p class="vt-where"><b>${ctx.categoryT}</b><span>${esc(ctx.placeRaw)}</span></p>${nameStack(ctx)}<p class="vt-promise">${ctx.copyOr("headline", ctx.promise)}</p>${ctx.about ? `<p class="vt-about">${ctx.about}</p>` : ""}</div>
${art}
${finder}
</div></section>`;

  const band = proofVariant === "band" ? `<section class="vt-band" aria-label="Google rating"><div class="wrap">${ratingProof(ctx, "strip", { cls: "vt-rating" })}</div></section>` : "";

  // Teaching the size code is what the best tire sites do; repair shops get
  // the three things worth having ready before the call instead.
  const seg = (code, n, unit, hi) => `<span class="vt-seg${hi ? " vt-seg--hi" : ""}"><small>${unit}</small><b>${code}</b><i>${n}</i></span>`;
  const sizeCode = `<div class="vt-read__code" aria-hidden="true"><div class="vt-code vt-caps">${seg("225", 1, "mm")}<span class="vt-seg vt-seg--sep"><small>&nbsp;</small><b>/</b><i>&nbsp;</i></span>${seg("65", 2, "%", true)}${seg("R", 3, "&nbsp;")}${seg("17", 4, "in", true)}<span class="vt-seg vt-seg--gap"></span>${seg("98H", 5, "&nbsp;")}</div></div>`;
  const explainer = tires
    ? `<section class="vt-sec"><div class="wrap"><div class="vt-head"><h2 class="vt-h2 vt-caps">${t("How to read", "Cómo leer")} <mark>${t("your size", "su medida")}</mark></h2><p class="vt-lede">${t("The size is molded into the sidewall. Read it left to right and you have everything the shop needs to check what fits.", "La medida viene grabada en el costado. Léala de izquierda a derecha y tiene todo lo que el taller necesita para ver qué le queda.")}</p></div>
<div class="vt-read">${sizeCode}
<ol class="vt-read__list"><li><b>1</b><div><h3>${t("Width", "Ancho")}</h3><p>${t("Tread width in millimeters, sidewall to sidewall.", "Ancho de la llanta en milímetros, de costado a costado.")}</p></div></li><li><b>2</b><div><h3>${t("Aspect ratio", "Perfil")}</h3><p>${t("Sidewall height as a percent of the width.", "Altura del costado como porcentaje del ancho.")}</p></div></li><li><b>3</b><div><h3>${t("Construction", "Construcción")}</h3><p>${t("R means radial, which is most tires on the road.", "R significa radial, como la mayoría de las llantas.")}</p></div></li><li><b>4</b><div><h3>${t("Rim", "Rin")}</h3><p>${t("The wheel diameter in inches.", "El diámetro del rin en pulgadas.")}</p></div></li><li><b>5</b><div><h3>${t("Load and speed", "Carga y velocidad")}</h3><p>${t("Worth reading out on the phone too.", "También conviene decirlo por teléfono.")}</p></div></li></ol></div>
<p class="vt-read__note">${t("The same size is printed on a sticker inside the driver door.", "La misma medida viene en una etiqueta dentro de la puerta del conductor.")}</p></div></section>`
    : `<section class="vt-sec"><div class="wrap"><div class="vt-head"><h2 class="vt-h2 vt-caps">${t("Before", "Antes de")} <mark>${t("you call", "llamar")}</mark></h2><p class="vt-lede">${t("Three things make the first call quick and the quote clear.", "Tres cosas hacen la primera llamada rápida y el presupuesto claro.")}</p></div><ol class="vt-before"><li class="rv"><b>1</b><h3>${t("What it is doing", "Qué está haciendo")}</h3><p>${t("A noise, a smell, a light on the dash.", "Un ruido, un olor, una luz en el tablero.")}</p></li><li class="rv"><b>2</b><h3>${t("When it happens", "Cuándo pasa")}</h3><p>${t("Cold starts, braking, turning, at highway speed.", "Al arrancar en frío, al frenar, al dar vuelta, en carretera.")}</p></li><li class="rv"><b>3</b><h3>${t("Year, make and model", "Año, marca y modelo")}</h3><p>${t("And about how long it has been going on.", "Y más o menos cuánto tiempo lleva así.")}</p></li></ol></div></section>`;

  const services = ctx.services.length
    ? `${treadStrip(ctx)}<section class="vt-sec vt-sec--alt vt-svc--${ctx.variants.services === "rows" ? "rows" : "blocks"}" id="services"><div class="wrap"><div class="vt-head"><h2 class="vt-h2 vt-caps">${t("What the", "Lo que hace")} <mark>${t("shop does", "el taller")}</mark></h2><p class="vt-lede">${t("Tap any one to ask about it.", "Toque cualquiera para preguntar.")}</p></div>${servicesList(ctx, "grid", { numbered: true })}${servicesConfirm(ctx)}</div></section>`
    : "";

  // A semi truck says diesel shop; keep it off tire and repair pages.
  const shots = ctx.photos.many(3, (p) => !/diesel|semi/.test(p.id));
  const bay = shots.length
    ? `<section class="vt-sec vt-sec--black vt-sec--slant"><div class="wrap"><h2 class="vt-h2 vt-caps">${t("In", "En")} <mark>${t("the bay", "el taller")}</mark></h2><div class="vt-shots">${shots.map((p) => photoFrame(ctx, p, { cls: "rv", sizes: "(min-width: 900px) 33vw, 100vw", width: 800, tag: true })).join("")}</div><p class="vt-shots-note">${t("Stock photos stand in for the shop's own.", "Fotos de archivo en lugar de las del taller.")}</p></div></section>`
    : "";

  const themes = ctx.themes.length
    ? `<section class="vt-sec vt-sec--flood"><div class="wrap"><h2 class="vt-h2 vt-caps">${t("What customers", "Lo que dicen")} <mark>${t("keep saying", "los clientes")}</mark></h2>${themesBlock(ctx)}</div></section>`
    : "";

  const visit = `<section class="vt-sec${themes ? "" : " vt-sec--flood"}" id="visit"><div class="wrap vt-visit"><div><h2 class="vt-h2 vt-caps">${t("Walk in or", "¿Pasa directo o")} <mark>${t("call ahead?", "llama antes?")}</mark></h2><p class="vt-lede">${t("Calling first is the surest way to know what is on hand for your car today.", "Llamar antes es la forma más segura de saber qué hay para su carro hoy.")}</p>${callButton(ctx, { cls: "vt-btn vt-btn--ink", label: ["Call", "Llame al"] })}</div>${visitDetails(ctx)}</div></section>`;

  const steps = stepsFor(ctx);
  const quote = `<section class="vt-sec vt-sec--alt" id="${REQUEST_ID}"><div class="wrap vt-quote"><div class="vt-quote__side"><h2 class="vt-h2 vt-caps">${form.title}</h2><p class="vt-lede">${form.intro}</p>${picked}<ol class="vt-before" style="grid-template-columns:1fr;margin-top:2rem">${steps.map((s, i) => `<li><b>${i + 1}</b><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div><div class="vt-panel">${withFormId(ctx, formId)}</div></div></section>`;

  const faq = `<section class="vt-sec vt-faq" id="faq"><div class="wrap vt-faq-grid"><h2 class="vt-h2 vt-caps">${t("Quick", "Preguntas")} <mark>${t("answers", "rápidas")}</mark></h2>${faqBlock(ctx)}</div></section>`;

  const close = `${treadStrip(ctx)}<section class="vt-sec vt-sec--flood vt-close"><div class="wrap"><h2 class="vt-h2 vt-caps">${tires ? t("Know your size? Call it in.", "¿Sabe su medida? Llame.") : t("Tell the shop what it is doing.", "Dígale al taller qué le pasa.")}</h2>${ctx.tel ? `<a class="vt-close__num vt-caps" href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}<div class="vt-close__go">${bookButton(ctx, { cls: "vt-btn vt-btn--ink", ico: "", arrow: true })}</div></div></section>`;

  return {
    css: `${CSS}\n${extraCss.join("\n")}`,
    body: `${header}<main>${hero}${band}${explainer}${services}${bay}${themes}${visit}${quote}${faq}${close}</main>${siteFooter(ctx)}`,
  };
}

export const direction = {
  key: "auto-value-tire",
  label: "Bold value tire shop",
  status: "implemented",
  suits: ["tire-shop", "muffler-exhaust", "auto-repair"],
  keywords: ["bilingual", "value", "bold", "conversion", "quote", "tire", "used", "availability"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,600;0,800;1,800&family=Rubik:wght@400;500&display=swap",
  palettes: PALETTES,
  variants: { hero: ["stack", "shop"], services: ["blocks", "rows"], proof: ["sticker", "band"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /tire|lift|shop-bay|under/ },
  callbar: "call",
  render,
};
