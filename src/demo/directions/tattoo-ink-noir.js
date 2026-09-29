// Ink noir: the black studio with a flash sheet (research/design-barber-salon.md,
// direction 7). Serious craft, a gallery at night. Wide tracked display caps,
// mono labels in brackets, black and white grainy photos in thin frames, and an
// original flash sheet of simple line motifs (dagger, rose, swallow, star,
// heart, moon) drawn here, never traced from any studio. The signal color is
// used only on the primary button and the stars. Buttons are hard squares.
//
// Font note: the brief named Space Mono, which is on the design skill's
// overused list, so the mono is Chivo Mono. Bebas Neue stays for display.

import {
  bookButton,
  callButton,
  faqBlock,
  floatingBook,
  formHeading,
  photoFrame,
  ratingProof,
  REQUEST_ID,
  roleFor,
  serviceItems,
  servicesConfirm,
  servicesList,
  shortCta,
  siteFooter,
  siteHeader,
  teamPlaceholders,
  themesBlock,
  uid,
  visitDetails,
} from "../blocks.js";
import { faqFor, stepsFor } from "../copy.js";
import { esc, icon } from "../shared.js";

const PALETTES = [
  { key: "noir-bone", name: "Bone and Black", vars: { bg: "#0b0b0b", surface: "#141414", ink: "#ededed", muted: "#a3a3a3", line: "#2c2c2c", primary: "#ededed", "on-primary": "#0b0b0b", frame: "#ededed", motif: "#8a8a8a", deep: "#050505", "photo-dim": ".62" } },
  { key: "noir-red", name: "Red Flash", vars: { bg: "#0b0b0b", surface: "#161212", ink: "#efe9df", muted: "#a39a90", line: "#2f2222", primary: "#d11f2e", "on-primary": "#ffffff", frame: "#efe9df", motif: "#8f857b", deep: "#060404", "photo-dim": ".6" } },
  { key: "noir-cobalt", name: "Cobalt Stencil", vars: { bg: "#0c0d12", surface: "#151722", ink: "#ecebe6", muted: "#9496a2", line: "#262a40", primary: "#3a4bff", "on-primary": "#ffffff", frame: "#ecebe6", motif: "#7f8292", deep: "#07080c", "photo-dim": ".6" } },
  { key: "noir-flash", name: "Flash Sheet", vars: { bg: "#efe7d6", surface: "#e6dcc6", ink: "#111111", muted: "#4f493e", line: "#cbbd9f", primary: "#c2272d", "on-primary": "#ffffff", frame: "#111111", motif: "#3a352d", deep: "#111111", "photo-dim": ".78" } },
];

// Five point nautical star, computed so the points are exact.
function starPath() {
  const outer = [];
  const inner = [];
  for (let i = 0; i < 5; i += 1) {
    const a = (-90 + i * 72) * (Math.PI / 180);
    const b = (-54 + i * 72) * (Math.PI / 180);
    outer.push([50 + 40 * Math.cos(a), 52 + 40 * Math.sin(a)]);
    inner.push([50 + 16 * Math.cos(b), 52 + 16 * Math.sin(b)]);
  }
  const f = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  const ring = outer.map((p, i) => `${i ? "L" : "M"}${f(p)} L${f(inner[i])}`).join(" ");
  const spokes = outer.map((p) => `M50 52 L${f(p)}`).join(" ");
  return `${ring} Z ${spokes}`;
}

// Original line motifs for the flash sheet. Stroke only, currentColor.
const MOTIFS = {
  dagger: "<circle cx=\"50\" cy=\"10\" r=\"4\"/><path d=\"M46 14h8v22h-8zM46 20h8M46 26h8M46 32h8\"/><path d=\"M30 36q20 7 40 0v5q-20 7-40 0z\"/><path d=\"M44 42h12v36l-6 16-6-16z\"/><path d=\"M50 44v44\"/>",
  rose: "<path d=\"M50 30c-20 0-24 22-12 32 8 8 20 8 26 0 12-12 6-32-14-32z\"/><path d=\"M50 40c-8 0-10 10-4 14 6 4 12-2 10-8-2-4-8-3-8 1\"/><path d=\"M38 62c-2 8 4 14 12 14s14-6 12-14\"/><path d=\"M50 76v18\"/><path d=\"M50 86c-10-6-18-2-20 2 8 4 16 2 20-2zM50 82c10-6 18-2 20 2-8 4-16 2-20-2z\"/>",
  swallow: "<path d=\"M12 38c16-6 30-2 38 6 8-10 20-16 36-14-10 6-16 12-18 18 6 2 12 8 14 16-10-6-20-8-26-6-2 10-8 18-18 22 4-10 6-18 4-24-10-2-22-8-30-18z\"/><circle cx=\"56\" cy=\"44\" r=\"1.6\"/><path d=\"M40 52l-8 4M44 56l-6 6\"/>",
  star: "",
  heart: "<path d=\"M50 84C20 62 14 44 24 32s22-6 26 4c4-10 16-16 26-4s4 30-26 52z\"/><path d=\"M10 50h80l-5 8 5 8H10l5-8z\"/><path d=\"M34 36l6 6M30 42l6 6\"/>",
  moon: "<path d=\"M60 16a34 34 0 1 0 0 68 26 26 0 1 1 0-68z\"/><path d=\"M76 26v8M72 30h8M82 58v6M79 61h6\"/><circle cx=\"70\" cy=\"46\" r=\"1.4\"/>",
};
MOTIFS.star = `<path d="${starPath()}"/>`;
const MOTIF_KEYS = ["dagger", "rose", "swallow", "star", "heart", "moon"];

function motif(i, cls = "nx-motif") {
  const key = MOTIF_KEYS[i % MOTIF_KEYS.length];
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${MOTIFS[key]}</svg>`;
}

// Film grain as an inline SVG filter, so nothing loads from anywhere.
function grain(ctx) {
  const id = uid(ctx, "nxg");
  return `<svg class="nx-grain" aria-hidden="true" focusable="false"><filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#${id})"/></svg>`;
}

// The flash wall behind a hero with no photo: motifs scattered on a grid.
function flashWall() {
  const cells = Array.from({ length: 24 }, (_, i) => `<span>${motif(i + Math.floor(i / 6) * 2)}</span>`).join("");
  return `<div class="nx-wall" aria-hidden="true">${cells}</div>`;
}

const AFTERCARE = [
  ["Follow your artist's aftercare first. They know the piece and your skin.", "Siga primero los cuidados de su artista. Conoce la pieza y su piel."],
  ["Keep it clean and let it breathe while it heals.", "Manténgalo limpio y déjelo respirar mientras sana."],
  ["Skip pools, baths and long soaks until it has healed.", "Evite albercas, tinas y remojos largos hasta que sane."],
  ["Keep it out of strong sun, and ask before putting any product on it.", "Protéjalo del sol fuerte y pregunte antes de ponerle cualquier producto."],
];

const CSS = `
:root{--display:"Bebas Neue","Oswald",Impact,sans-serif;--body:"Chivo Mono",ui-monospace,Menlo,monospace;--mono:"Chivo Mono",ui-monospace,Menlo,monospace;--radius:0px;--btn-radius:0px;--callbar-radius:0px;--chip-radius:0px;--max:1240px;--ease:cubic-bezier(.22,1,.36,1);--track:.18em;--field:var(--surface);--field-line:color-mix(in oklab,var(--ink) 28%,transparent);--callbar-bg:var(--surface);--callbar-ink:var(--ink);--lang-fg:var(--ink);--lang-on:var(--bg);--star:var(--primary);--focus:var(--ink);--fr:color-mix(in oklab,var(--frame) 42%,transparent)}
body{font-size:.98rem;line-height:1.75;letter-spacing:-.005em}
.nx-br{font-family:var(--mono);font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase}
.nx-br::before{content:"[ "}.nx-br::after{content:" ]"}
.nx-h2{font-family:var(--display);font-weight:400;font-size:clamp(2.8rem,7vw,5.25rem);line-height:.92;letter-spacing:.06em;text-transform:uppercase}
.nx-lede{margin-top:1rem;max-width:52ch;color:var(--muted)}
.nx-sec{position:relative;padding:clamp(4.5rem,10vw,8rem) 0;border-top:1px solid var(--line)}
.nx-sec--surface{background:var(--surface)}
.nx-head{display:grid;gap:1.25rem;margin-bottom:3rem}
@media (min-width:900px){.nx-head{grid-template-columns:minmax(0,1fr) minmax(0,26rem);align-items:end}.nx-head .nx-lede{margin:0}}
.nx-head .nx-br{color:var(--muted)}
.nx-motif{display:block;width:100%;height:auto;color:var(--motif)}
.nx-grain{position:absolute;inset:0;width:100%;height:100%;opacity:.16;mix-blend-mode:overlay;pointer-events:none}

.b-hd{position:sticky;top:0;z-index:10;background:color-mix(in oklab,var(--bg) 94%,transparent);border-bottom:1px solid var(--line)}
.b-hd__in{display:flex;align-items:center;gap:1.5rem;min-height:4.25rem}
.b-brand{margin-right:auto;font-family:var(--display);font-size:1.6rem;letter-spacing:.14em;line-height:1;text-transform:uppercase;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:64vw}
.b-nav{display:none;gap:1.75rem;font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase}
.b-nav a{text-decoration:none;color:var(--muted);transition:color .2s}
.b-nav a:hover{color:var(--ink)}
@media (min-width:1040px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:1rem}
.b-hd__tel{display:none;align-items:center;gap:.45rem;font-size:.875rem;text-decoration:none}
@media (min-width:860px){.b-hd__tel{display:inline-flex}}
.b-hd__cta,.nx-btn{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;border:1px solid var(--ink);border-radius:0;font-family:var(--mono);font-weight:700;font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;transition:background-color .25s,color .25s,border-color .25s}
.b-hd__cta{padding:.6rem 1rem;background:var(--primary);border-color:var(--primary);color:var(--on-primary)}
.nx-btn{min-height:3.4rem;padding:.9rem 1.5rem}
.nx-btn .ico{width:1rem;height:1rem}
.nx-btn--solid{background:var(--primary);border-color:var(--primary);color:var(--on-primary)}
.nx-btn--solid:hover{filter:brightness(1.12)}
.nx-btn--line{color:var(--ink);border-color:var(--fr)}
.nx-btn--line:hover{border-color:var(--ink);background:var(--ink);color:var(--bg)}
.lang{border-radius:0}.lang button{border-radius:0}

.nx-hero{position:relative;overflow:hidden;background:var(--deep);color:#f2f0ea}
.nx-hero--full{display:grid;align-items:center;min-height:min(92svh,56rem)}
.nx-hero__bg{position:absolute;inset:0}
.nx-hero__bg>.b-photo{position:absolute;inset:0;--photo-bg:var(--deep)}
.nx-hero__bg img{filter:grayscale(1) contrast(1.3) brightness(var(--photo-dim));transform:scale(1.04);animation:nx-settle 2.4s var(--ease) both}
@keyframes nx-settle{from{transform:scale(1.12)}to{transform:scale(1.04)}}
.nx-hero__bg::after{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 45%,transparent 30%,rgb(0 0 0 / .72) 100%)}
.nx-hero__frame{position:absolute;inset:clamp(.75rem,2vw,1.5rem);border:1px solid rgb(242 240 234 / .35);pointer-events:none;z-index:1}
.nx-hero__in{position:relative;z-index:2;padding:clamp(4rem,10vw,7rem) 0;text-align:center}
.nx-hero .nx-br{color:rgb(242 240 234 / .82)}
.nx-name{margin:1.25rem auto 0;font-family:var(--display);font-weight:400;line-height:.9;letter-spacing:var(--track);text-transform:uppercase;padding-left:var(--track);font-size:var(--nsz);max-width:15ch;overflow-wrap:break-word;animation:kj-rise 1.1s var(--ease) both}
.nx-n--xl{--nsz:clamp(3.8rem,12vw,8.5rem)}.nx-n--l{--nsz:clamp(3.2rem,9.5vw,7rem)}.nx-n--m{--nsz:clamp(2.7rem,7.5vw,5.6rem)}.nx-n--s{--nsz:clamp(2.3rem,6vw,4.6rem)}
.nx-promise{margin:1.5rem auto 0;max-width:40ch;font-size:1.05rem;color:rgb(242 240 234 / .86)}
.nx-ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:.75rem;margin-top:2.25rem}
.nx-hero--full .nx-btn--line{color:#f2f0ea;border-color:rgb(242 240 234 / .5)}
.nx-hero--full .nx-btn--line:hover{background:#f2f0ea;color:#0b0b0b}
.nx-cap{position:absolute;right:clamp(1.25rem,3vw,2.25rem);bottom:clamp(1.1rem,3vw,2rem);z-index:2;font-size:.6875rem;letter-spacing:.08em;text-transform:uppercase;color:rgb(242 240 234 / .7)}
.nx-wall{position:absolute;inset:-4%;display:grid;grid-template-columns:repeat(6,1fr);gap:4vw;padding:4vw;opacity:.16;color:#f2f0ea;transform:rotate(-4deg)}
.nx-wall .nx-motif{color:inherit}
@media (max-width:759.98px){.nx-wall{grid-template-columns:repeat(4,1fr)}}

.nx-hero--sheet{background:var(--bg);color:var(--ink);padding:clamp(3rem,7vw,5.5rem) 0}
.nx-hero--sheet .nx-grid{display:grid;gap:3rem;align-items:center}
@media (min-width:960px){.nx-hero--sheet .nx-grid{grid-template-columns:minmax(0,1fr) minmax(0,.95fr);gap:4.5rem}}
.nx-hero--sheet .nx-hero__in{padding:0;text-align:left}
.nx-hero--sheet .nx-br{color:var(--muted)}
.nx-hero--sheet .nx-name{margin-left:0;padding-left:0}
.nx-hero--sheet .nx-promise{margin-left:0;color:var(--muted)}
.nx-hero--sheet .nx-ctas{justify-content:flex-start}
.nx-sheet{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;padding:1px;border:1px solid var(--fr);background:var(--fr)}
.nx-sheet>*{position:relative;background:var(--bg)}
.nx-sheet__photo{grid-column:1/span 2;grid-row:1/span 2;aspect-ratio:1;overflow:hidden}
.nx-sheet__photo>.b-photo{position:absolute;inset:0}
.nx-sheet__photo img{filter:grayscale(1) contrast(1.25) brightness(.9)}
.nx-sheet__cell{display:grid;place-items:center;aspect-ratio:1;padding:18%}
.nx-sheet__cell .nx-motif{color:var(--ink)}
.nx-sheet__cell .nx-br{position:absolute;left:.5rem;top:.35rem;font-size:.625rem;color:var(--muted)}
.nx-sheet__photo .nx-br{position:absolute;left:.6rem;bottom:.45rem;z-index:1;font-size:.625rem;color:#f2f0ea}

.nx-strip{border-block:1px solid var(--line);background:var(--bg)}
.nx-strip .b-rating{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.75rem 1.75rem;padding:1.4rem 0;font-family:var(--mono);text-transform:uppercase;letter-spacing:.06em}
.nx-strip .b-rating::before{content:"[ Google ]";font-size:.8125rem;color:var(--muted)}
.nx-strip .b-rating__num{font-family:var(--display);font-size:2.6rem;line-height:1;letter-spacing:.06em}
.nx-strip .b-rating__side{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1.25rem}
.nx-strip .stars{width:6.5rem;height:1.3rem}
.nx-strip .b-rating__count{font-size:.875rem}
.nx-strip .b-themes{display:flex;flex-wrap:wrap;justify-content:center;gap:.4rem 1.5rem;padding:0 0 1.4rem;margin-top:-.25rem}
.nx-strip .b-themes li{font-size:.8125rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.nx-strip .b-themes li::before{content:"[ ";opacity:.6}.nx-strip .b-themes li::after{content:" ]";opacity:.6}
.nx-strip .b-themes__note{padding-bottom:1.25rem;text-align:center;font-size:.75rem;color:var(--muted)}
.nx-numbers .b-rating{display:grid;gap:2rem}
@media (min-width:760px){.nx-numbers .b-rating{grid-template-columns:1fr 1fr;gap:0}.nx-numbers .b-rating__cell+.b-rating__cell{border-left:1px solid var(--line);padding-left:3rem}}
.nx-numbers .b-rating__cell{display:grid;gap:.6rem;align-content:start}
.nx-numbers .b-rating__num,.nx-numbers .b-rating__big{font-family:var(--display);font-size:clamp(6.5rem,17vw,11rem);line-height:.8;letter-spacing:.04em}
.nx-numbers .b-rating__lbl{order:-1;font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.nx-numbers .b-rating__lbl::before{content:"[ "}.nx-numbers .b-rating__lbl::after{content:" ]"}
.nx-numbers .stars{width:8rem;height:1.6rem}
.nx-numbers .b-themes{display:flex;flex-wrap:wrap;gap:.4rem 1.5rem;margin-top:2.5rem;padding-top:1.25rem;border-top:1px solid var(--line)}
.nx-numbers .b-themes li{font-size:.875rem;letter-spacing:.06em;text-transform:uppercase}
.nx-numbers .b-themes li::before{content:"[ ";color:var(--muted)}.nx-numbers .b-themes li::after{content:" ]";color:var(--muted)}
.nx-numbers .b-themes__note{margin-top:.75rem;font-size:.8125rem;color:var(--muted)}

.nx-styles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;border:1px solid var(--line);background:var(--line)}
@media (min-width:900px){.nx-styles{grid-template-columns:repeat(3,minmax(0,1fr))}}
.nx-style{position:relative;display:grid;gap:1rem;align-content:space-between;min-height:15rem;padding:clamp(1rem,2.5vw,1.75rem);background:var(--bg);text-decoration:none;transition:background-color .3s}
.nx-style:hover{background:var(--surface)}
.nx-style .nx-motif{width:clamp(3.5rem,8vw,5.5rem);transition:color .3s,transform .5s var(--ease)}
.nx-style:hover .nx-motif{color:var(--ink);transform:rotate(-6deg)}
.nx-style__name{font-family:var(--display);font-size:clamp(1.7rem,3vw,2.3rem);line-height:.95;letter-spacing:.06em;text-transform:uppercase;overflow-wrap:anywhere}
.nx-style__go{display:flex;justify-content:space-between;align-items:center;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.nx-style__go .ico{width:1rem;height:1rem}
.b-svc{display:grid}
.b-svc__item{display:flex;align-items:baseline;gap:1.25rem;padding:1.25rem 0;border-bottom:1px solid var(--line)}
.b-svc__item:first-child{border-top:1px solid var(--line)}
.b-svc__n{font-size:.8125rem;color:var(--muted)}
.b-svc__n::before{content:"[ "}.b-svc__n::after{content:" ]"}
.b-svc__name{font-family:var(--display);font-size:clamp(2rem,4.5vw,3.25rem);line-height:1;letter-spacing:.06em;text-transform:uppercase}
.b-svc__dots{flex:1;border-bottom:1px dashed var(--line);transform:translateY(-.4rem)}
.b-svc__tail{font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase;text-underline-offset:.3em}
.b-svc-confirm{margin-top:1.5rem;font-size:.875rem;color:var(--muted)}
.svc-note{margin-top:.35rem;font-size:.8125rem;color:var(--muted)}

.b-team{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2rem 1rem}
@media (min-width:900px){.b-team{grid-template-columns:repeat(4,minmax(0,1fr));gap:2rem 1.25rem}}
.b-team__frame{position:relative;display:grid;place-items:center;aspect-ratio:3/4;border:1px solid var(--fr);background:var(--surface);padding:24%}
.b-team__frame .nx-motif{opacity:.7}
.b-team__num{position:absolute;left:.6rem;top:.45rem;font-size:.75rem;color:var(--muted)}
.b-team__num::before{content:"[ "}.b-team__num::after{content:" ]"}
.b-team__seat{margin-top:.9rem;font-family:var(--display);font-size:1.8rem;letter-spacing:.08em;line-height:1;text-transform:uppercase}
.b-team__who{margin-top:.25rem;font-size:.8125rem;color:var(--muted)}
.b-team__book{display:inline-block;margin-top:.6rem;font-size:.8125rem;letter-spacing:.06em;text-transform:uppercase;text-underline-offset:.3em}
.b-team__note{margin-top:2.25rem;max-width:62ch;font-size:.875rem;color:var(--muted)}

.nx-work{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
@media (min-width:900px){.nx-work{grid-template-columns:repeat(4,minmax(0,1fr))}}
.nx-work__tile{position:relative;aspect-ratio:4/5;border:1px solid var(--fr);padding:.5rem;background:var(--surface)}
.nx-work__tile .b-photo{position:absolute;inset:.5rem}
.nx-work__tile img{filter:grayscale(1) contrast(1.2)}
.nx-work-note{margin-top:1.25rem;font-size:.8125rem;color:var(--muted)}

.nx-steps{display:grid;gap:0;border-top:1px solid var(--line)}
@media (min-width:900px){.nx-steps{grid-template-columns:repeat(var(--n,4),minmax(0,1fr));border-top:0}}
.nx-steps li{position:relative;padding:1.75rem 0;border-bottom:1px solid var(--line)}
@media (min-width:900px){.nx-steps li{padding:0 2rem 0 0;border-bottom:0}.nx-steps li::before{content:"";display:block;height:1px;margin-bottom:1.75rem;background:var(--line)}.nx-steps li:first-child::before{background:var(--ink)}}
.nx-steps .nx-br{color:var(--muted)}
.nx-steps h3{margin-top:.6rem;font-family:var(--display);font-weight:400;font-size:2rem;line-height:1;letter-spacing:.06em;text-transform:uppercase}
.nx-steps p{margin-top:.5rem;color:var(--muted);font-size:.9rem}

.nx-req{display:grid;gap:3rem}
@media (min-width:980px){.nx-req{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem}.nx-req__side{position:sticky;top:6.5rem;align-self:start}}
.nx-req__side .b-rating{display:inline-flex;flex-wrap:wrap;align-items:center;gap:.6rem;margin-top:2rem;padding:.6rem .9rem;border:1px solid var(--line);font-size:.8125rem;text-transform:uppercase;letter-spacing:.06em}
.nx-req__side .b-rating__num{font-family:var(--display);font-size:1.6rem;line-height:1;letter-spacing:.06em}
.nx-req__side .stars{width:5.5rem;height:1.1rem}
.nx-req__side .nx-btn{margin-top:1.25rem}
.nx-panel{padding:clamp(1.25rem,3.5vw,2.5rem);border:1px solid var(--fr);background:var(--bg)}
.nx-panel__label{display:flex;justify-content:space-between;gap:1rem;margin-bottom:1.75rem;padding-bottom:1rem;border-bottom:1px dashed var(--line);color:var(--muted)}
.f-label,.f-field legend{font-family:var(--mono);font-weight:700;font-size:.8125rem;letter-spacing:.06em;text-transform:uppercase}
.f-input{border-radius:0;border-width:1px}
.f-chip>span{border-width:1px;border-radius:0;font-size:.875rem}
.f-chip.day>span{border-radius:0}
.f-chip input:checked+span{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.f-submit{border-radius:0;background:var(--primary);color:var(--on-primary);font-family:var(--mono);font-weight:700;font-size:.875rem;letter-spacing:.08em;text-transform:uppercase}
.f-status{border-radius:0;border-width:1px}

.nx-visit{display:grid;gap:2.5rem}
@media (min-width:900px){.nx-visit{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:5rem}}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7.5rem 1fr;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:1px solid var(--line)}
.facts dt{font-size:.8125rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding-top:.1rem}
.facts dd{margin:0;font-weight:700}
.b-visit__pending{display:grid;gap:.45rem;margin-top:1.5rem;font-size:.875rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-size:.875rem;letter-spacing:.06em;text-transform:uppercase}

.nx-care{display:grid;gap:3rem}
@media (min-width:900px){.nx-care{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:5rem}}
.nx-care__list{display:grid;gap:0;margin-top:2rem;counter-reset:care}
.nx-care__list li{display:grid;grid-template-columns:auto 1fr;gap:1rem;padding:1rem 0;border-top:1px solid var(--line);font-size:.95rem}
.nx-care__list .nx-br{color:var(--muted);padding-top:.15rem}
.nx-care__note{margin-top:1.25rem;font-size:.8125rem;color:var(--muted)}
.faq details{border-color:var(--line)}
.faq summary{font-family:var(--display);font-weight:400;font-size:clamp(1.4rem,2.6vw,1.8rem);letter-spacing:.05em;text-transform:uppercase;line-height:1.1}
.faq details p{color:var(--muted);font-size:.95rem}

.nx-close{position:relative;overflow:hidden;padding:clamp(5rem,11vw,8.5rem) 0;background:var(--deep);color:#f2f0ea;text-align:center}
.nx-close .nx-h2{font-size:clamp(3rem,9vw,6rem);letter-spacing:var(--track);padding-left:var(--track)}
.nx-close .nx-promise{margin-top:1rem}
.nx-close .nx-btn--line{color:#f2f0ea;border-color:rgb(242 240 234 / .5)}
.nx-close .nx-btn--line:hover{background:#f2f0ea;color:#0b0b0b}
.nx-close .nx-wall{opacity:.1}
.nx-close__in{position:relative}
.nx-care__faq{margin-top:2rem}

.b-ft{padding:3.5rem 0 2.5rem;background:var(--bg);border-top:1px solid var(--line)}
.b-ft__name{font-family:var(--display);font-size:clamp(2.4rem,6vw,3.75rem);letter-spacing:.14em;line-height:1;text-transform:uppercase}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;font-size:.8125rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.b-ft__row a{color:var(--ink)}
.legal{margin-top:2rem;font-size:.75rem;color:var(--muted)}
.stock-credits{margin-top:.5rem;font-size:.75rem}
.b-float{border-radius:0;background:var(--primary);color:var(--on-primary);font-family:var(--mono);font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase;box-shadow:none;border:1px solid var(--primary)}
.callbar--split{border:1px solid var(--line);box-shadow:none}
.callbar--split .cb-book{background:var(--primary);color:var(--on-primary)}
`;

// The shared placeholders say "Book chair 01"; a studio books a station. The
// dictionary entry is updated too, so the language toggle keeps the new label.
function relabelSeats(ctx, html) {
  const dict = ctx.i18n.dict;
  return html.replace(/(<a class="b-team__book"[^>]*>)(?:<span data-i18n="([^"]+)">)?Book chair (\d\d)/g, (m, open, key, n) => {
    if (key && dict[key]) dict[key] = [`Ask for station ${n}`, dict[key][1]];
    return `${open}${key ? `<span data-i18n="${key}">` : ""}Ask for station ${n}`;
  });
}

function render(ctx) {
  const t = ctx.t;
  const tattoo = ctx.categoryKey === "tattoo";
  const sheet = ctx.variants.hero === "sheet";
  const role = roleFor(ctx);
  const cta = shortCta(ctx);
  const nav = [
    ctx.services.length ? { href: "#styles", label: tattoo ? ["Work", "Trabajo"] : ["Services", "Servicios"] } : null,
    { href: "#team", label: role.many },
    { href: "#process", label: tattoo ? ["Process", "Proceso"] : ["Booking", "Reservas"] },
    { href: "#visit", label: ["Visit", "Visítenos"] },
  ].filter(Boolean);
  const header = siteHeader(ctx, { nav, cta });
  const primaryLabel = ctx.copy.ctaPrimary ? null : ctx.formCopy.title;
  const solid = (label, ico = "arrow") => bookButton(ctx, { cls: "nx-btn nx-btn--solid", ico: "", label, arrow: ico === "arrow" });
  const callSq = (label = ["Call", "Llamar"]) => callButton(ctx, { cls: "nx-btn nx-btn--line", label, number: !label });

  const heroImg = ctx.photos.hero();
  const place = `<p class="nx-br">${esc(ctx.cityState || ctx.placeRaw)}</p>`;
  const name = `<h1 class="nx-name nx-n--${ctx.nameScale}">${ctx.name}</h1>`;
  const promise = `<p class="nx-promise">${ctx.copyOr("headline", ctx.promise)}</p>`;
  const about = ctx.about ? `<p class="nx-promise">${ctx.about}</p>` : "";
  const ctas = `<div class="nx-ctas">${solid(primaryLabel)}${callSq()}</div>`;

  let hero;
  if (sheet) {
    const cells = [0, 1, 2, 3, 4].map((i) => `<div class="nx-sheet__cell"><span class="nx-br">${String(i + 2).padStart(2, "0")}</span>${motif(i + 1)}</div>`);
    const photoCell = heroImg
      ? `<div class="nx-sheet__photo">${photoFrame(ctx, heroImg, { hero: true, sizes: "(min-width: 960px) 30vw, 66vw", width: 1200 })}<span class="nx-br">${t("Stock photo", "Foto de archivo")}</span></div>`
      : `<div class="nx-sheet__photo nx-sheet__cell"><span class="nx-br">01</span>${motif(0)}</div>`;
    hero = `<section class="nx-hero nx-hero--sheet" id="top"><div class="wrap nx-grid"><div class="nx-hero__in">${place}${name}${promise}${about}${ctas}</div>
<div class="nx-sheet">${photoCell}${cells[0]}${cells[1]}${cells[2]}${cells[3]}${cells[4]}</div></div></section>`;
  } else {
    const bg = heroImg ? photoFrame(ctx, heroImg, { hero: true, sizes: "100vw", width: 1600 }) : flashWall();
    hero = `<section class="nx-hero nx-hero--full" id="top"><div class="nx-hero__bg">${bg}</div>${grain(ctx)}<div class="nx-hero__frame" aria-hidden="true"></div><div class="wrap nx-hero__in">${place}${name}${promise}${about}${ctas}</div>${heroImg ? `<span class="nx-cap">${t("Stock photo", "Foto de archivo")}</span>` : ""}</div></section>`;
  }

  const numbers = ctx.variants.proof === "numbers";
  const proof = numbers
    ? `<section class="nx-sec nx-numbers" aria-label="Google rating"><div class="wrap">${ratingProof(ctx, "numbers")}${themesBlock(ctx)}</div></section>`
    : `<section class="nx-strip" aria-label="Google rating"><div class="wrap">${ratingProof(ctx, "strip")}${themesBlock(ctx)}</div></section>`;

  const tail = tattoo ? ["Inquire", "Consultar"] : ["Book", "Reservar"];
  const grid = ctx.variants.services !== "list";
  const styles = grid
    ? `<ul class="nx-styles">${serviceItems(ctx).map((s, i) => `<li><a class="nx-style rv" href="#${REQUEST_ID}"><span class="nx-br">${s.n}</span>${motif(i)}<span class="nx-style__name">${s.html}</span><span class="nx-style__go"><span>${t(tail[0], tail[1])}</span>${icon("arrow")}</span></a></li>`).join("")}</ul>`
    : servicesList(ctx, "menu", { tail, link: true, numbered: true });
  const menu = ctx.services.length
    ? `<section class="nx-sec" id="styles"><div class="wrap"><div class="nx-head"><h2 class="nx-h2">${tattoo ? t("What the studio does", "Lo que hace el estudio") : t("The menu", "El menú")}</h2><p class="nx-lede">${tattoo ? t("Pick what fits your idea and send it in. The artist takes it from there at the consultation.", "Elija lo que va con su idea y envíela. El artista sigue desde ahí en la consulta.") : t("Pick a service and a time. The shop confirms it with you.", "Elija un servicio y un horario. La barbería se lo confirma.")}</p></div>${styles}${servicesConfirm(ctx)}</div></section>`
    : "";

  // Chair placeholders carry a flash motif in place of the chair glyph.
  let seat = 0;
  const seats = teamPlaceholders(ctx, { glyph: false });
  const team = (tattoo ? relabelSeats(ctx, seats) : seats).replace(/<div class="b-team__frame">/g, () => `<div class="b-team__frame">${motif(seat++ + 2)}`);
  const teamSec = `<section class="nx-sec nx-sec--surface" id="team"><div class="wrap"><div class="nx-head"><h2 class="nx-h2">${t(`The ${role.many[0].toLowerCase()}`, role.many[1])}</h2><p class="nx-lede">${tattoo ? t("Choose an artist whose work matches your idea, or leave it open and the studio will suggest one.", "Elija un artista cuyo trabajo vaya con su idea, o déjelo abierto y el estudio le sugiere uno.") : t(`Book with your ${role.one[0].toLowerCase()}, or take the next open chair.`, `Reserve con su ${role.one[1].toLowerCase()} o tome la siguiente silla libre.`)}</p></div>${team}</div></section>`;

  // A work strip only when the library still has photos after the hero.
  const shots = ctx.photos.many(4);
  const work = shots.length >= 2
    ? `<section class="nx-sec" id="work"><div class="wrap"><div class="nx-head"><h2 class="nx-h2">${t("Recent work", "Trabajo reciente")}</h2><p class="nx-lede">${t("Stock photos stand in for the shop's own work, which goes here.", "Fotos de archivo en lugar del trabajo del negocio, que va aquí.")}</p></div><div class="nx-work">${shots.map((p) => `<div class="nx-work__tile rv">${photoFrame(ctx, p, { sizes: "(min-width: 900px) 24vw, 50vw", width: 800 })}</div>`).join("")}</div></div></section>`
    : "";

  const steps = stepsFor(ctx);
  const process = `<section class="nx-sec${work ? " nx-sec--surface" : ""}" id="process"><div class="wrap"><div class="nx-head"><h2 class="nx-h2">${tattoo ? t("How a custom piece works", "Cómo funciona una pieza") : t("How booking works", "Cómo reservar")}</h2><p class="nx-lede">${tattoo ? t("Four steps from an idea to healed skin. Nothing is final until the consultation.", "Cuatro pasos de la idea a la piel sanada. Nada es final hasta la consulta.") : t("Three steps, and the shop confirms before anything is final.", "Tres pasos, y la barbería confirma antes de que sea final.")}</p></div><ol class="nx-steps" style="--n:${steps.length}">${steps.map((s, i) => `<li class="rv"><span class="nx-br">${String(i + 1).padStart(2, "0")}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  const form = formHeading(ctx);
  const request = `<section class="nx-sec${work ? "" : " nx-sec--surface"}" id="${REQUEST_ID}"><div class="wrap nx-req"><div class="nx-req__side"><h2 class="nx-h2">${form.title}</h2><p class="nx-lede">${form.intro}</p>${ratingProof(ctx, "chip")}<div>${callSq(["Or call", "O llame"])}</div></div><div class="nx-panel"><p class="nx-panel__label" aria-hidden="true"><span class="nx-br">${tattoo ? t("Inquiry", "Consulta") : t("Booking", "Reserva")}</span><span class="nx-br">${esc(ctx.nameRaw)}</span></p>${ctx.form}</div></div></section>`;

  const visit = `<section class="nx-sec" id="visit"><div class="wrap nx-visit"><div><h2 class="nx-h2">${t("Find the", "Encuentre el")} ${tattoo ? t("studio", "estudio") : t("shop", "local")}</h2><p class="nx-lede">${esc(ctx.placeRaw)}</p></div>${visitDetails(ctx)}</div></section>`;

  const careList = `<ol class="nx-care__list">${AFTERCARE.map((a, i) => `<li><span class="nx-br">${String(i + 1).padStart(2, "0")}</span><span>${t(a[0], a[1])}</span></li>`).join("")}</ol><p class="nx-care__note">${t("General guidance only. The studio's own aftercare instructions come first.", "Solo guía general. Las indicaciones del estudio van primero.")}</p>`;
  const care = tattoo
    ? `<section class="nx-sec nx-sec--surface" id="faq"><div class="wrap nx-care"><div><h2 class="nx-h2">${t("Aftercare", "Cuidados")}</h2>${careList}</div><div><h2 class="nx-h2">${t("Questions", "Preguntas")}</h2><div class="nx-care__faq">${faqBlock(ctx, { items: faqFor(ctx) })}</div></div></div></section>`
    : `<section class="nx-sec nx-sec--surface" id="faq"><div class="wrap nx-visit"><h2 class="nx-h2">${t("Questions", "Preguntas")}</h2>${faqBlock(ctx)}</div></section>`;

  const close = `<section class="nx-close">${flashWall()}<div class="wrap nx-close__in"><h2 class="nx-h2">${tattoo ? t("Bring the idea", "Traiga la idea") : t("Take a seat", "Tome asiento")}</h2><p class="nx-promise">${tattoo ? t("Send it in. The studio follows up to book the consultation.", "Envíela. El estudio le contacta para reservar la consulta.") : t("Pick a time. The shop confirms it with you.", "Elija un horario. La barbería se lo confirma.")}</p><div class="nx-ctas">${solid(ctx.formCopy.title)}${callSq()}</div></div></section>`;

  return {
    css: CSS,
    body: `${header}<main>${hero}${proof}${menu}${teamSec}${work}${process}${request}${visit}${care}${close}</main>${siteFooter(ctx)}${floatingBook(ctx, { label: cta })}`,
  };
}

export const direction = {
  key: "tattoo-ink-noir",
  label: "Ink noir: black studio with flash sheet",
  status: "implemented",
  suits: ["tattoo", "barber"],
  keywords: ["custom", "gallery", "dark", "art", "premium"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Chivo+Mono:wght@400;700&display=swap",
  palettes: PALETTES,
  variants: { hero: ["full", "sheet"], services: ["grid", "list"], proof: ["strip", "numbers"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /tattoo|razor-detail|tools|clipper/ },
  callbar: "split",
  render,
};
