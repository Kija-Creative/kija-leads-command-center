// Bath club: the bright boutique groomer (research/design-barber-salon.md,
// direction 8). Happy, clean, a little fancy, and trustworthy for nervous
// owners. Soft blobs sit behind every image, bubbles float up between sections,
// the rating lives in a speech bubble, everything is 24px round, and the paw
// print appears exactly once (in the footer). A friendly grotesk carries the
// voice; no comic rounded display face.

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
  siteFooter,
  siteHeader,
  themesBlock,
  visitDetails,
} from "../blocks.js";
import { faqFor, stepsFor } from "../copy.js";
import { esc, icon } from "../shared.js";

const PALETTES = [
  { key: "bath-bubblegum", name: "Bubblegum", vars: { bg: "#fff7f0", surface: "#ffffff", ink: "#2a1b3d", muted: "#5e526b", line: "#f1e2d6", primary: "#ff6fa5", "on-primary": "#2a1b3d", accent: "#7cc8ff", accent3: "#ffd166", wash: "#ffd9e7", blob: "#ffa9c9", tint1: "#ffe8f0", tint2: "#e3f3ff", tint3: "#fff1cf" } },
  { key: "bath-sky", name: "Sky Bath", vars: { bg: "#f2f8ff", surface: "#ffffff", ink: "#10233f", muted: "#4c5b70", line: "#dbe7f5", primary: "#2f6fe0", "on-primary": "#ffffff", accent: "#ffbe0b", accent3: "#8ce0c4", wash: "#d2e5ff", blob: "#9dc4ff", tint1: "#e3efff", tint2: "#fff2c9", tint3: "#dbf5ec" } },
  { key: "bath-walnut", name: "Walnut Club", vars: { bg: "#faf6f0", surface: "#ffffff", ink: "#2b1d14", muted: "#63534a", line: "#eadfce", primary: "#7a4a2a", "on-primary": "#ffffff", accent: "#d9534f", accent3: "#f0c48e", wash: "#eedfcb", blob: "#dcc0a0", tint1: "#f4ebdf", tint2: "#fbe5e3", tint3: "#eee6da" } },
];

// Simple line icons for the service tiles, cycled in order.
const ICONS = [
  "<path d=\"M6 24h36v4a10 10 0 0 1-10 10H16A10 10 0 0 1 6 28z\"/><path d=\"M12 24V12a5 5 0 0 1 9-3\"/><path d=\"M14 38l-2 4M34 38l2 4\"/><circle cx=\"27\" cy=\"14\" r=\"2.5\"/><circle cx=\"33\" cy=\"9\" r=\"2\"/><circle cx=\"36\" cy=\"17\" r=\"3\"/>",
  "<circle cx=\"13\" cy=\"34\" r=\"6\"/><circle cx=\"35\" cy=\"34\" r=\"6\"/><path d=\"M17 30L34 8M31 30L14 8\"/>",
  "<rect x=\"8\" y=\"8\" width=\"32\" height=\"14\" rx=\"7\"/><path d=\"M13 22v6M18 22v8M23 22v6M28 22v8M33 22v6\"/><path d=\"M24 8V4\"/><path d=\"M20 36h8v8h-8z\"/>",
  "<path d=\"M10 10c8 2 14 8 16 16l-4 4c-8-2-14-8-16-16z\"/><path d=\"M26 26l12 12\"/><circle cx=\"38\" cy=\"38\" r=\"4\"/>",
  "<path d=\"M24 22c-6-8-16-8-16 0s10 8 16 0zM24 22c6-8 16-8 16 0s-10 8-16 0z\"/><circle cx=\"24\" cy=\"22\" r=\"3\"/><path d=\"M22 25l-4 14M26 25l4 14\"/>",
  "<path d=\"M24 6l4 12 12 4-12 4-4 12-4-12-12-4 12-4z\"/><path d=\"M38 34l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z\"/>",
];

// Pick the icon by what the service is, then fall back to the cycle.
const ICON_HINTS = [[/bath|wash|shampoo|spa/i, 0], [/nail|claw|paw/i, 3], [/shed|brush|comb|mat/i, 2], [/puppy|bow|bandana|first/i, 4], [/cut|groom|trim|style|shave|scissor/i, 1]];
function iconFor(name, i) {
  const hit = ICON_HINTS.find(([re]) => re.test(name));
  return hit ? hit[1] : i;
}

function svcIcon(i) {
  return `<svg class="pb-ico" viewBox="0 0 48 48" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[i % ICONS.length]}</svg>`;
}

// The no photo art: an original flat dog sitting pretty, with a bow.
const DOG = "<svg class=\"pb-dog\" viewBox=\"0 0 240 260\" aria-hidden=\"true\" focusable=\"false\"><g stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"stroke:var(--ink)\"><path d=\"M70 250c-6-50 4-92 50-104 46 12 56 54 50 104z\" style=\"fill:var(--surface)\"/><path d=\"M170 214c24-4 36-24 30-44\" style=\"fill:none\"/><path d=\"M96 250v-40M144 250v-40\" style=\"fill:none\"/><circle cx=\"120\" cy=\"96\" r=\"56\" style=\"fill:var(--surface)\"/><path d=\"M70 70c-24-6-34 30-22 58 10 22 26 10 28-6\" style=\"fill:var(--blob)\"/><path d=\"M170 70c24-6 34 30 22 58-10 22-26 10-28-6\" style=\"fill:var(--blob)\"/><ellipse cx=\"120\" cy=\"118\" rx=\"24\" ry=\"18\" style=\"fill:var(--surface)\"/><path d=\"M112 110h16l-8 9z\" style=\"fill:var(--ink)\"/><path d=\"M120 119v6c0 6-10 8-14 3M120 125c0 6 10 8 14 3\" style=\"fill:none\"/><circle cx=\"100\" cy=\"88\" r=\"5\" style=\"fill:var(--ink)\"/><circle cx=\"140\" cy=\"88\" r=\"5\" style=\"fill:var(--ink)\"/><path d=\"M84 150c20 10 52 10 72 0\" style=\"fill:none\"/><path d=\"M120 152l-18-12v24zM120 152l18-12v24z\" style=\"fill:var(--primary)\"/><circle cx=\"120\" cy=\"152\" r=\"5\" style=\"fill:var(--primary)\"/></g></svg>";

const PAW = "<svg class=\"pb-paw\" viewBox=\"0 0 48 48\" aria-hidden=\"true\" focusable=\"false\"><g style=\"fill:currentColor\"><ellipse cx=\"12\" cy=\"20\" rx=\"4.5\" ry=\"6\"/><ellipse cx=\"20\" cy=\"12\" rx=\"4.5\" ry=\"6\"/><ellipse cx=\"29\" cy=\"12\" rx=\"4.5\" ry=\"6\"/><ellipse cx=\"37\" cy=\"20\" rx=\"4.5\" ry=\"6\"/><path d=\"M24 23c-8 0-14 8-14 14 0 5 4 6 8 5 3-1 4-2 6-2s3 1 6 2c4 1 8 0 8-5 0-6-6-14-14-14z\"/></g></svg>";

// Floating props around the hero image: a comb, a bow, scissors and bubbles.
const PROPS = `<div class="pb-props" aria-hidden="true"><span class="pb-prop pb-prop--comb">${svcIcon(2)}</span><span class="pb-prop pb-prop--bow">${svcIcon(4)}</span><span class="pb-prop pb-prop--scissors">${svcIcon(1)}</span><span class="pb-bub pb-bub--1"></span><span class="pb-bub pb-bub--2"></span><span class="pb-bub pb-bub--3"></span><span class="pb-bub pb-bub--4"></span></div>`;

function bubbles(cls = "") {
  const sizes = [18, 34, 12, 48, 22, 14, 30, 10, 40, 16, 26];
  return `<div class="pb-fizz ${cls}" aria-hidden="true">${sizes.map((s, i) => `<span style="--s:${s}px;--x:${(i * 9.1 + 3).toFixed(1)}%;--d:${(i % 4) * 0.7}s"></span>`).join("")}</div>`;
}

const VACCINES = { q: ["Do I need my pet's vaccination records?", "¿Necesito el registro de vacunas de mi mascota?"], a: ["Many groomers ask for proof of current vaccines. Ask the shop what it needs before the first visit.", "Muchos groomers piden comprobante de vacunas al día. Pregunte al negocio qué necesita antes de la primera visita."] };

const CSS = `
:root{--display:"Bricolage Grotesque",system-ui,sans-serif;--body:"Nunito Sans",system-ui,sans-serif;--radius:16px;--card:24px;--btn-radius:999px;--max:1220px;--ease:cubic-bezier(.22,1,.36,1);--field:#ffffff;--field-line:color-mix(in oklab,var(--ink) 18%,transparent);--callbar-bg:var(--surface);--callbar-ink:var(--ink);--lang-fg:var(--ink);--lang-on:var(--surface);--star:var(--ink);--blobr:44% 56% 58% 42%/48% 44% 56% 52%}
body{font-size:1.0625rem;line-height:1.65}
.pb-h2{font-family:var(--display);font-weight:800;font-size:clamp(2.4rem,5.6vw,4.25rem);line-height:.98;letter-spacing:-.035em;font-optical-sizing:auto}
.pb-h2 mark,.pb-h1 mark{background:linear-gradient(transparent 58%,var(--accent3) 58%,var(--accent3) 92%,transparent 92%);color:inherit;padding:0 .08em;border-radius:.2em}
.pb-lede{margin-top:1rem;max-width:46ch;color:var(--muted);font-size:1.08rem}
.pb-sec{position:relative;padding:clamp(4rem,9vw,7.5rem) 0}
.pb-sec--t1{background:var(--tint1)}.pb-sec--t2{background:var(--tint2)}.pb-sec--t3{background:var(--tint3)}
.pb-head{display:grid;gap:1rem;margin-bottom:2.75rem}
@media (min-width:900px){.pb-head{grid-template-columns:minmax(0,1fr) minmax(0,25rem);align-items:end}.pb-head .pb-lede{margin:0}}
.pb-ico{width:100%;height:100%}

.b-hd{position:sticky;top:0;z-index:10;background:color-mix(in oklab,var(--bg) 94%,transparent);border-bottom:1px solid var(--line)}
.b-hd__in{display:flex;align-items:center;gap:1.25rem;min-height:4.5rem}
.b-brand{margin-right:auto;font-family:var(--display);font-weight:800;font-size:1.5rem;letter-spacing:-.03em;line-height:1;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:64vw}
.b-nav{display:none;gap:.35rem}
.b-nav a{padding:.5rem .95rem;border-radius:999px;font-weight:600;text-decoration:none;transition:background-color .25s}
.b-nav a:hover{background:var(--tint1)}
@media (min-width:1020px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:.8rem}
.b-hd__tel{display:none;align-items:center;gap:.4rem;font-weight:700;text-decoration:none}
@media (min-width:860px){.b-hd__tel{display:inline-flex}}
.b-hd__cta,.pb-btn{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;border-radius:999px;font-weight:700;text-decoration:none;border:2px solid transparent;transition:transform .35s var(--ease),box-shadow .35s var(--ease),background-color .25s}
.b-hd__cta{padding:.6rem 1.25rem;background:var(--primary);color:var(--on-primary)}
.b-hd__cta:hover,.pb-btn:hover{transform:translateY(-2px)}
.pb-btn{min-height:3.5rem;padding:.85rem 1.7rem;font-size:1.05rem}
.pb-btn .ico{width:1.1rem;height:1.1rem}
.pb-btn--main{background:var(--primary);color:var(--on-primary)}
.pb-btn--soft{background:var(--surface);color:var(--ink);border-color:var(--line)}

.pb-hero{position:relative;overflow:hidden;background:var(--wash);padding:clamp(2.5rem,6vw,5rem) 0 clamp(4rem,8vw,6.5rem)}
.pb-hero__grid{display:grid;gap:3rem;align-items:center}
@media (min-width:940px){.pb-hero--blob .pb-hero__grid{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:3.5rem}}
.pb-pill{display:inline-flex;flex-wrap:wrap;align-items:center;gap:.25rem .6rem;padding:.45rem 1rem;border-radius:999px;background:var(--surface);font-weight:600;font-size:.95rem}
.pb-pill span+span{color:var(--muted);font-weight:500}
.pb-h1{margin-top:1.4rem;font-family:var(--display);font-weight:800;font-size:clamp(3rem,7.4vw,5.75rem);line-height:.95;letter-spacing:-.04em;animation:kj-rise 1s var(--ease) both}
.pb-h1 mark{display:inline}
.pb-intro{margin-top:1.4rem;max-width:40ch;font-size:1.125rem;color:var(--muted)}
.pb-ctas{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}
.pb-media{position:relative;width:min(100%,34rem);justify-self:center;aspect-ratio:1;isolation:isolate}
.pb-media::before{content:"";position:absolute;inset:-3% -5% -1% 2%;z-index:-1;border-radius:var(--blobr);background:var(--blob);animation:pb-morph 14s ease-in-out infinite alternate}
@keyframes pb-morph{to{border-radius:58% 42% 44% 56%/52% 58% 42% 48%;transform:rotate(8deg)}}
.pb-frame{position:absolute;inset:8%;overflow:hidden;border-radius:48% 52% 50% 50%/54% 50% 50% 46%;background:var(--surface)}
.pb-frame>.b-photo{position:absolute;inset:0}
.pb-frame img{filter:saturate(1.06) brightness(1.03)}
.pb-frame--art{display:grid;place-items:end center;background:var(--tint2)}
.pb-dog{width:74%;height:auto}
.pb-cap{position:absolute;right:14%;bottom:6%;z-index:3;padding:.25rem .65rem;border-radius:999px;background:rgb(255 255 255 / .92);color:var(--ink);font-size:.72rem;font-weight:700}
.pb-props{position:absolute;inset:0;z-index:2;pointer-events:none}
.pb-prop{position:absolute;display:grid;place-items:center;width:clamp(3rem,7vw,4.25rem);aspect-ratio:1;padding:.7rem;border-radius:50%;background:var(--surface);color:var(--ink);box-shadow:0 14px 28px -16px rgb(0 0 0 / .4);animation:pb-float 6s ease-in-out infinite}
.pb-prop--comb{left:-2%;top:12%}
.pb-prop--bow{right:-3%;top:4%;background:var(--accent3);animation-delay:-2s}
.pb-prop--scissors{right:2%;bottom:18%;background:var(--accent);animation-delay:-4s}
.pb-bub{position:absolute;border-radius:50%;background:radial-gradient(circle at 32% 30%,#ffffff 0 14%,rgb(255 255 255 / .35) 34%,rgb(255 255 255 / .12) 70%);box-shadow:inset 0 0 0 1.5px rgb(255 255 255 / .8);animation:pb-float 7s ease-in-out infinite}
.pb-bub--1{width:2.4rem;height:2.4rem;left:10%;bottom:6%}
.pb-bub--2{width:1.2rem;height:1.2rem;left:4%;bottom:22%;animation-delay:-3s}
.pb-bub--3{width:1.6rem;height:1.6rem;right:18%;top:-2%;animation-delay:-1s}
.pb-bub--4{width:.9rem;height:.9rem;right:10%;top:20%;animation-delay:-5s}
@keyframes pb-float{50%{transform:translateY(-10px)}}
.pb-say{position:absolute;z-index:3;left:-4%;bottom:4%;transform:rotate(-4deg)}
.pb-say .b-rating{position:relative;display:grid;gap:.1rem;padding:.9rem 1.2rem 1rem;border-radius:22px;background:var(--surface);box-shadow:4px 5px 0 var(--ink);text-align:left}
.pb-say .b-rating::after{content:"";position:absolute;left:1.6rem;bottom:-.55rem;width:1.2rem;height:1.2rem;background:var(--surface);transform:rotate(45deg);border-radius:3px}
.pb-say .b-rating__num{font-family:var(--display);font-weight:800;font-size:2.4rem;line-height:1;letter-spacing:-.03em}
.pb-say .stars{width:6rem;height:1.2rem}
.pb-say .b-rating__count{font-weight:700;font-size:.9rem}
@media (max-width:939.98px){.pb-hero--blob .pb-media{width:min(88%,26rem)}.pb-say{left:-6%}}

.pb-hero--tub{text-align:center}
.pb-hero--tub .pb-ctas{justify-content:center}
.pb-hero--tub .pb-h1,.pb-hero--tub .pb-intro{margin-inline:auto}
.pb-hero--tub .pb-h1{max-width:14ch}
.pb-hero--tub .pb-media{margin-top:clamp(2.5rem,5vw,3.5rem);width:min(100%,46rem);aspect-ratio:16/10}
.pb-hero--tub .pb-frame{inset:6% 10%;border-radius:40% 40% 44% 44%/48% 48% 52% 52%}
.pb-hero--tub .pb-say{left:2%;bottom:-2%}
@media (max-width:759.98px){.pb-hero--tub .pb-media{aspect-ratio:1}.pb-hero--tub .pb-frame{inset:8%}}

.pb-fizz{position:relative;height:5rem;overflow:hidden;pointer-events:none}
.pb-fizz span{position:absolute;left:var(--x);bottom:-10px;width:var(--s);height:var(--s);border-radius:50%;background:radial-gradient(circle at 32% 30%,#ffffff 0 12%,transparent 16%),color-mix(in oklab,var(--accent) 38%,transparent);box-shadow:inset 0 0 0 1.5px color-mix(in oklab,var(--accent) 70%,transparent);animation:pb-rise 9s ease-in infinite;animation-delay:var(--d)}
@keyframes pb-rise{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(-5rem);opacity:0}}
.pb-fizz--t1{background:var(--tint1)}.pb-fizz--t2{background:var(--tint2)}.pb-fizz--t3{background:var(--tint3)}.pb-fizz--bg{background:var(--bg)}
html:not(.js) .pb-fizz span{opacity:1;bottom:20%}

.pb-proof{display:grid;gap:1.25rem;align-items:stretch}
@media (min-width:880px){.pb-proof{grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr)}}
.pb-card{position:relative;padding:clamp(1.5rem,4vw,2.5rem);border-radius:var(--card);background:var(--surface);border:1.5px solid var(--line)}
.pb-proof .b-rating{display:flex;flex-wrap:wrap;align-items:flex-end;gap:.5rem 1.25rem}
.pb-proof .b-rating__num{font-family:var(--display);font-weight:800;font-size:clamp(5.5rem,13vw,8.5rem);line-height:.82;letter-spacing:-.05em}
.pb-proof .b-rating__side{display:grid;gap:.4rem;padding-bottom:.4rem}
.pb-proof .stars{width:7.5rem;height:1.5rem}
.pb-proof .b-rating__count{font-weight:700;font-size:1.05rem}
.pb-proof .b-rating__cap{flex-basis:100%;color:var(--muted);font-size:.95rem}
.pb-card--words{background:var(--tint3);border-color:transparent}
.pb-card--words .pb-h2{font-size:clamp(1.9rem,3.8vw,2.8rem)}
.b-themes{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.25rem}
.b-themes li{padding:.55rem 1rem;border-radius:999px;background:var(--surface);font-weight:700}
.b-themes__note{margin-top:.8rem;font-size:.9rem;color:var(--muted)}
.pb-proof--bubble{display:block}
.pb-proof--bubble .pb-card{max-width:52rem;margin-inline:auto;text-align:center;border-radius:40px}
.pb-proof--bubble .pb-card::after{content:"";position:absolute;left:50%;bottom:-1rem;width:2rem;height:2rem;margin-left:-1rem;background:var(--surface);transform:rotate(45deg);border-radius:5px}
.pb-proof--bubble .b-rating{justify-content:center}
.pb-proof--bubble .b-themes{justify-content:center}
.pb-proof--bubble .b-themes li{background:var(--tint1)}

.pb-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.9rem}
@media (min-width:900px){.pb-tiles{grid-template-columns:repeat(3,minmax(0,1fr));gap:1.25rem}}
.pb-tile{display:grid;gap:1.1rem;align-content:space-between;height:100%;min-height:12.5rem;padding:clamp(1.1rem,2.6vw,1.6rem);border-radius:var(--card);background:var(--surface);text-decoration:none;transition:transform .35s var(--ease),box-shadow .35s var(--ease)}
.pb-tile:hover{transform:translateY(-4px)}
.pb-tile__ico{display:grid;place-items:center;width:clamp(3.5rem,7vw,4.5rem);aspect-ratio:1;padding:.85rem;border-radius:var(--blobr);background:var(--tint1);color:var(--ink);transition:border-radius .6s var(--ease),transform .5s var(--ease)}
.pb-tiles li:nth-child(3n+2) .pb-tile__ico{background:var(--tint2)}.pb-tiles li:nth-child(3n) .pb-tile__ico{background:var(--tint3)}
.pb-tile:hover .pb-tile__ico{border-radius:50%;transform:rotate(-6deg)}
.pb-tile__name{font-family:var(--display);font-weight:700;font-size:clamp(1.25rem,2.4vw,1.6rem);line-height:1.1;letter-spacing:-.02em;overflow-wrap:anywhere}
.pb-tile__go{display:inline-flex;align-items:center;gap:.4rem;font-weight:700;font-size:.95rem;color:var(--muted)}
.pb-tile__go .ico{width:1rem;height:1rem;transition:transform .3s var(--ease)}
.pb-tile:hover .pb-tile__go .ico{transform:translateX(4px)}
.pb-rows{display:grid;gap:.6rem}
@media (min-width:860px){.pb-rows{grid-template-columns:1fr 1fr;gap:.75rem}}
.pb-row{display:flex;align-items:center;gap:1rem;padding:.7rem 1.25rem .7rem .7rem;border-radius:999px;background:var(--surface);text-decoration:none;transition:transform .3s var(--ease)}
.pb-row:hover{transform:translateX(4px)}
.pb-row .pb-tile__ico{width:3.25rem;padding:.65rem;border-radius:50%}
.pb-row .pb-tile__name{flex:1;font-size:1.25rem}
.pb-row .ico{width:1.1rem;height:1.1rem;color:var(--muted)}
.b-svc-confirm{margin-top:1.5rem;font-weight:700}
.svc-note{margin-top:.35rem;font-size:.9rem;color:var(--muted)}

.pb-steps{position:relative;display:grid;gap:1rem}
@media (min-width:900px){.pb-steps{grid-template-columns:repeat(4,minmax(0,1fr));gap:1.25rem}.pb-steps::before{content:"";position:absolute;left:8%;right:8%;top:2.4rem;border-top:3px dotted color-mix(in oklab,var(--ink) 25%,transparent)}}
.pb-steps li{position:relative;display:grid;grid-template-columns:auto 1fr;gap:.2rem 1.1rem;align-items:start;padding:1.35rem;border-radius:var(--card);background:var(--surface)}
@media (min-width:900px){.pb-steps li{grid-template-columns:1fr;gap:.9rem;padding:1.5rem;background:transparent}}
.pb-steps .pb-n{display:grid;place-items:center;grid-row:span 2;width:3.4rem;height:3.4rem;border-radius:50%;background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:800;font-size:1.5rem;box-shadow:0 0 0 6px var(--bg)}
@media (min-width:900px){.pb-steps .pb-n{grid-row:auto;width:4.8rem;height:4.8rem;font-size:2rem;box-shadow:0 0 0 10px var(--bg)}}
.pb-steps h3{font-family:var(--display);font-weight:700;font-size:1.45rem;line-height:1.1;letter-spacing:-.02em}
.pb-steps p{color:var(--muted)}

.pb-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
@media (min-width:900px){.pb-gallery{grid-template-columns:repeat(4,minmax(0,1fr));gap:1.5rem}.pb-gallery>:nth-child(even){transform:translateY(2.5rem)}}
.pb-shot{position:relative;aspect-ratio:4/5;isolation:isolate}
.pb-shot::before{content:"";position:absolute;inset:4% -2% -2% 4%;z-index:-1;border-radius:var(--blobr);background:var(--blob);opacity:.8}
.pb-shot:nth-child(2)::before{background:var(--accent);opacity:.45;border-radius:56% 44% 42% 58%/46% 54% 46% 54%}
.pb-shot:nth-child(3)::before{background:var(--accent3);opacity:.9}
.pb-shot__in{position:absolute;inset:0;overflow:hidden;border-radius:46% 54% 44% 56%/42% 44% 56% 58%;background:var(--surface)}
.pb-shot:nth-child(2) .pb-shot__in{border-radius:38% 62% 56% 44%/50% 40% 60% 50%}
.pb-shot:nth-child(3) .pb-shot__in{border-radius:54% 46% 40% 60%/44% 56% 44% 56%}
.pb-shot__in>.b-photo{position:absolute;inset:0}
.pb-shot__in--art{display:grid;place-items:end center;background:var(--tint2)}
.pb-shot__in--art .pb-dog{width:70%}
.pb-shot__in--flip .pb-dog{transform:scaleX(-1)}
.pb-shot__ico{align-self:center;width:44%;color:var(--ink);opacity:.8}
.pb-shot:nth-child(2) .pb-shot__in--art{background:var(--tint1)}.pb-shot:nth-child(4) .pb-shot__in--art{background:var(--surface)}
.pb-shot__empty{position:absolute;left:50%;bottom:10%;z-index:1;transform:translateX(-50%);white-space:nowrap;padding:.3rem .8rem;border-radius:999px;background:var(--surface);font-weight:700;font-size:.8125rem}
.pb-gallery-note{margin-top:clamp(1.5rem,4vw,4rem);font-size:.9rem;color:var(--muted)}

.pb-req{display:grid;gap:2.5rem}
@media (min-width:980px){.pb-req{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem}.pb-req__side{position:sticky;top:6.5rem;align-self:start}}
.pb-req__side .b-rating{display:inline-flex;align-items:center;gap:.55rem;margin-top:1.75rem;padding:.6rem 1.05rem;border-radius:999px;background:var(--surface);font-weight:700}
.pb-req__side .b-rating__num{font-family:var(--display);font-weight:800;font-size:1.4rem;line-height:1}
.pb-req__side .stars{width:5.25rem;height:1.05rem}
.pb-req__side .pb-btn{margin-top:1.25rem}
.pb-panel{padding:clamp(1.5rem,3.5vw,2.5rem);border-radius:calc(var(--card) + 4px);background:var(--surface)}
.f-input{border-radius:16px}
.f-chip>span{font-weight:600}
.f-chip.day>span{border-radius:16px}
.f-chip input:checked+span{background:var(--primary);color:var(--on-primary);border-color:var(--primary)}
.f-submit{border-radius:999px;background:var(--primary);color:var(--on-primary)}
.f-status{border-width:2px;border-radius:16px}

.pb-visit{display:grid;gap:2rem}
@media (min-width:900px){.pb-visit{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:4rem;align-items:start}}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:.95rem 0;border-bottom:2px dotted var(--line)}
.facts dt{color:var(--muted);font-weight:600}
.facts dd{margin:0;font-weight:700}
.b-visit__pending{display:grid;gap:.4rem;margin-top:1.25rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.25rem;font-weight:700}

.pb-faq .faq{display:grid;gap:.6rem}
.pb-faq .faq details{border:0;border-radius:20px;background:var(--surface);padding:0 1.25rem}
.pb-faq .faq details:last-child{border:0}
.pb-faq .faq summary{font-family:var(--display);font-weight:700;font-size:1.15rem;letter-spacing:-.01em}

.pb-close{position:relative;overflow:hidden;padding:clamp(4.5rem,10vw,7.5rem) 0;background:var(--wash);text-align:center}
.pb-close .pb-h2{font-size:clamp(2.6rem,7vw,5rem);max-width:15ch;margin-inline:auto}
.pb-close .pb-lede{margin-inline:auto}
.pb-close .pb-ctas{justify-content:center}
.pb-close .pb-bub{animation-duration:9s}
.pb-close .pb-bub--1{left:8%;bottom:18%;width:3.5rem;height:3.5rem}
.pb-close .pb-bub--2{left:16%;top:18%}
.pb-close .pb-bub--3{right:10%;top:22%;width:2.6rem;height:2.6rem}
.pb-close .pb-bub--4{right:18%;bottom:20%;width:1.4rem;height:1.4rem}

.b-ft{padding:3.5rem 0 2.5rem;background:var(--ink);color:#ffffff}
.b-ft__name{display:flex;align-items:center;gap:.6rem;font-family:var(--display);font-weight:800;font-size:clamp(2rem,5vw,3.25rem);letter-spacing:-.035em;line-height:1}
.pb-paw{flex:none;width:.8em;height:.8em;color:var(--primary)}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;color:rgb(255 255 255 / .8)}
.b-ft__row a{color:#ffffff;font-weight:700}
.legal{margin-top:2rem;font-size:.85rem;color:rgb(255 255 255 / .72)}
.stock-credits{margin-top:.5rem;color:rgb(255 255 255 / .72)}
.b-float{background:var(--primary);color:var(--on-primary)}
.callbar--split{border:1px solid var(--line)}
.callbar--split .cb-book{background:var(--primary);color:var(--on-primary)}
`;

function headline(ctx) {
  if (ctx.copy.headline) return `<h1 class="pb-h1">${esc(ctx.copy.headline)}</h1>`;
  return `<h1 class="pb-h1">${ctx.t("Book the groom.", "Reserve el baño.")} <mark>${ctx.t("Bring the good dog.", "Traiga a su perrito.")}</mark></h1>`;
}

function render(ctx) {
  const t = ctx.t;
  const tub = ctx.variants.hero === "tub";
  const nav = [
    ctx.services.length ? { href: "#menu", label: ["Services", "Servicios"] } : null,
    { href: "#first-visit", label: ["First visit", "Primera visita"] },
    { href: "#gallery", label: ["Gallery", "Galería"] },
    { href: "#visit", label: ["Visit", "Visítenos"] },
  ].filter(Boolean);
  const header = siteHeader(ctx, { nav, cta: ["Book a groom", "Reservar"] });
  const main = (label, ico = "calendar") => bookButton(ctx, { cls: "pb-btn pb-btn--main", ico, label });
  const soft = (label = ["Call", "Llamar"]) => callButton(ctx, { cls: "pb-btn pb-btn--soft", label, number: false });

  const heroImg = ctx.photos.hero();
  const pill = `<p class="pb-pill"><span>${ctx.name}</span><span>${ctx.categoryT}, ${esc(ctx.placeRaw)}</span></p>`;
  const intro = ctx.about || t("Tell the groomer about your pet and pick a day. First visits take a little longer, and nervous pups are welcome to say so.", "Cuéntele al groomer sobre su mascota y elija un día. La primera visita toma un poco más, y puede avisar si su perrito es nervioso.");
  const ctas = `<div class="pb-ctas">${main(ctx.copy.ctaPrimary ? null : ["Book a groom", "Reserve un baño"])}${soft()}</div>`;
  const frame = heroImg
    ? `<div class="pb-frame">${photoFrame(ctx, heroImg, { hero: true, sizes: tub ? "(min-width: 760px) 40rem, 90vw" : "(min-width: 940px) 32rem, 88vw", width: 1200 })}</div><span class="pb-cap">${t("Stock photo", "Foto de archivo")}</span>`
    : `<div class="pb-frame pb-frame--art">${DOG}</div>`;
  const media = `<div class="pb-media">${frame}${PROPS}<div class="pb-say">${ratingProof(ctx, "sticker")}</div></div>`;
  const hero = tub
    ? `<section class="pb-hero pb-hero--tub" id="top"><div class="wrap">${pill}${headline(ctx)}<p class="pb-intro">${intro}</p>${ctas}${media}</div></section>`
    : `<section class="pb-hero pb-hero--blob" id="top"><div class="wrap pb-hero__grid"><div>${pill}${headline(ctx)}<p class="pb-intro">${intro}</p>${ctas}</div>${media}</div></section>`;

  const bubble = ctx.variants.proof === "bubble";
  const words = `<div class="pb-card pb-card--words"><h2 class="pb-h2">${t("What owners say", "Lo que dicen los dueños")} <mark>${t("on Google", "en Google")}</mark></h2>${themesBlock(ctx) || `<p class="pb-lede">${t("The rating and the review count come straight from the groomer's Google listing.", "La calificación y las reseñas vienen del perfil de Google del groomer.")}</p>`}</div>`;
  const proof = bubble
    ? `<section class="pb-sec" aria-label="Google rating"><div class="wrap pb-proof pb-proof--bubble"><div class="pb-card"><h2 class="pb-h2">${t("What owners say", "Lo que dicen los dueños")} <mark>${t("on Google", "en Google")}</mark></h2>${ratingProof(ctx, "figure")}${themesBlock(ctx)}</div></div></section>`
    : `<section class="pb-sec" aria-label="Google rating"><div class="wrap pb-proof"><div class="pb-card">${ratingProof(ctx, "figure")}</div>${words}</div></section>`;

  const rows = ctx.variants.services === "rows";
  const items = serviceItems(ctx);
  const svc = rows
    ? `<ul class="pb-rows">${items.map((s, i) => `<li class="rv"><a class="pb-row" href="#${REQUEST_ID}"><span class="pb-tile__ico">${svcIcon(iconFor(s.name, i))}</span><span class="pb-tile__name">${s.html}</span>${icon("arrow")}</a></li>`).join("")}</ul>`
    : `<ul class="pb-tiles">${items.map((s, i) => `<li class="rv"><a class="pb-tile" href="#${REQUEST_ID}"><span class="pb-tile__ico">${svcIcon(iconFor(s.name, i))}</span><span class="pb-tile__name">${s.html}</span><span class="pb-tile__go">${t("Book this", "Reservar")}${icon("arrow")}</span></a></li>`).join("")}</ul>`;
  const menu = ctx.services.length
    ? `${bubbles("pb-fizz--bg")}<section class="pb-sec pb-sec--t2" id="menu"><div class="wrap"><div class="pb-head"><h2 class="pb-h2">${t("The", "El")} <mark>${t("spa menu", "menú")}</mark></h2><p class="pb-lede">${t("Tap a service to book it. Coat, size and temperament notes help the groomer plan the time.", "Toque un servicio para reservarlo. Las notas del pelo, tamaño y carácter ayudan a planear el tiempo.")}</p></div>${svc}${servicesConfirm(ctx)}</div></section>`
    : "";

  const steps = stepsFor(ctx);
  const first = `<section class="pb-sec" id="first-visit"><div class="wrap"><div class="pb-head"><h2 class="pb-h2">${t("Your", "Su")} <mark>${t("first visit", "primera visita")}</mark></h2><p class="pb-lede">${t("New here? This is how a first groom usually goes, so nothing is a surprise for you or your pet.", "¿Primera vez? Así suele ir la primera visita, para que nada les sorprenda ni a usted ni a su mascota.")}</p></div><ol class="pb-steps">${steps.map((s, i) => `<li class="rv"><span class="pb-n" aria-hidden="true">${i + 1}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  // Four blob framed tiles; the library fills what it can, the dog stands in for the rest.
  const shots = ctx.photos.many(4);
  const tiles = [0, 1, 2, 3].map((i) => {
    const p = shots[i];
    if (p) return `<div class="pb-shot rv"><div class="pb-shot__in">${photoFrame(ctx, p, { sizes: "(min-width: 900px) 24vw, 50vw", width: 800 })}</div></div>`;
    const art = i % 2 === 0 ? DOG : `<span class="pb-shot__ico">${svcIcon(i === 1 ? 0 : 4)}</span>`;
    return `<div class="pb-shot"><div class="pb-shot__in pb-shot__in--art${i === 2 ? " pb-shot__in--flip" : ""}">${art}</div><span class="pb-shot__empty">${t("Your work goes here", "Aquí va su trabajo")}</span></div>`;
  }).join("");
  const gallery = `${bubbles("pb-fizz--bg")}<section class="pb-sec pb-sec--t3" id="gallery"><div class="wrap"><div class="pb-head"><h2 class="pb-h2">${t("Fresh from", "Recién salidos")} <mark>${t("the tub", "del baño")}</mark></h2><p class="pb-lede">${t("The groomer's own before and afters go here: fluffy, trimmed and very pleased with themselves.", "Aquí van los antes y después del groomer: esponjados, recortados y muy contentos.")}</p></div><div class="pb-gallery">${tiles}</div>${shots.length ? `<p class="pb-gallery-note">${t("Stock photos stand in for the groomer's own work.", "Fotos de archivo en lugar del trabajo del groomer.")}</p>` : ""}</div></section>`;

  const form = formHeading(ctx);
  const request = `<section class="pb-sec pb-sec--t1" id="${REQUEST_ID}"><div class="wrap pb-req"><div class="pb-req__side"><h2 class="pb-h2">${form.title}</h2><p class="pb-lede">${form.intro}</p>${ratingProof(ctx, "chip")}<div>${soft(["Or call", "O llame"])}</div></div><div class="pb-panel">${ctx.form}</div></div></section>`;

  const visit = `<section class="pb-sec" id="visit"><div class="wrap pb-visit"><div><h2 class="pb-h2">${t("Drop off", "Dónde")} <mark>${t("and pick up", "dejarlo")}</mark></h2><p class="pb-lede">${esc(ctx.placeRaw)}</p></div><div class="pb-card">${visitDetails(ctx)}</div></div></section>`;

  const base = faqFor(ctx);
  const faqItems = [base[0], VACCINES, ...base.slice(1)];
  const faq = `<section class="pb-sec pb-sec--t2 pb-faq" id="faq"><div class="wrap pb-visit"><div><h2 class="pb-h2">${t("Good", "Buenas")} <mark>${t("questions", "preguntas")}</mark></h2><p class="pb-lede">${t("Nervous pet or a first groom? Say so when you book.", "¿Mascota nerviosa o primer baño? Dígalo al reservar.")}</p></div>${faqBlock(ctx, { items: faqItems })}</div></section>`;

  const close = `<section class="pb-close"><span class="pb-bub pb-bub--1" aria-hidden="true"></span><span class="pb-bub pb-bub--2" aria-hidden="true"></span><span class="pb-bub pb-bub--3" aria-hidden="true"></span><span class="pb-bub pb-bub--4" aria-hidden="true"></span><div class="wrap"><h2 class="pb-h2">${t("Ready for a", "¿Listo para un")} <mark>${t("fresh groom?", "baño nuevo?")}</mark></h2><p class="pb-lede">${t("Pick a day. The groomer confirms the time with you.", "Elija un día. El groomer le confirma la hora.")}</p><div class="pb-ctas">${main(["Book a groom", "Reserve un baño"])}${soft()}</div></div></section>`;

  const footer = siteFooter(ctx).replace("<p class=\"b-ft__name\">", `<p class="b-ft__name">${PAW}`);

  return {
    css: CSS,
    body: `${header}<main>${hero}${proof}${menu}${first}${gallery}${request}${visit}${faq}${close}</main>${footer}${floatingBook(ctx, { label: ["Book a groom", "Reservar"] })}`,
  };
}

export const direction = {
  key: "pet-bath-club",
  label: "Bath club: bright boutique groomer",
  status: "implemented",
  suits: ["pet-grooming"],
  keywords: ["family", "boutique", "friendly", "happy"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Nunito+Sans:wght@400;600;700&display=swap",
  palettes: PALETTES,
  variants: { hero: ["blob", "tub"], services: ["tiles", "rows"], proof: ["card", "bubble"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /dog/ },
  callbar: "split",
  render,
};
