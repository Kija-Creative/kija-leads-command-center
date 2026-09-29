// Linen editorial: the soft salon (research/design-barber-salon.md, direction 5).
// Light, warm and considered. A light optical size serif set large with one
// italic phrase, photos held in tall arches and a wide dome, an italic marquee
// with four point sparkles, thin champagne rules, and outline pills that fill
// on hover. Warmth comes from the accent, the type and the photos; the page
// ground stays a quiet near white so the one deep band reads as a decision.
//
// Font note: the brief named Instrument Serif, which sits on the design skill's
// overused list, so the display face is Source Serif 4 at its display optical
// size (light, with a true italic). Figtree stays for body and UI.

import {
  bookButton,
  callButton,
  faqBlock,
  floatingBook,
  formHeading,
  heroPhoto,
  marquee,
  photoFrame,
  ratingProof,
  REQUEST_ID,
  roleFor,
  servicesConfirm,
  servicesList,
  siteFooter,
  siteHeader,
  teamPlaceholders,
  themesBlock,
  uid,
  visitDetails,
} from "../blocks.js";
import { esc } from "../shared.js";

const PALETTES = [
  { key: "linen-linen", name: "Linen", vars: { bg: "#f7f4ef", surface: "#ede6db", ink: "#1a1612", muted: "#5c544a", line: "#ddd2c1", primary: "#1a1612", "on-primary": "#fbf9f6", accent: "#a5824c", em: "#1a1612", deep: "#2b231c", "on-deep": "#f3ece2", "deep-muted": "#c7b9a6", wave1: "#e7dccb", wave2: "#d9c6a6" } },
  { key: "linen-clay", name: "Clay", vars: { bg: "#f5eee8", surface: "#ead9c9", ink: "#2a1d16", muted: "#694f41", line: "#dcc3ad", primary: "#9e4e2b", "on-primary": "#ffffff", accent: "#b4623d", em: "#9e4e2b", deep: "#7f3a1f", "on-deep": "#f8ede4", "deep-muted": "#ecc9b3", wave1: "#e6cdb8", wave2: "#d6a283" } },
  { key: "linen-sage", name: "Sage Room", vars: { bg: "#f3f3ee", surface: "#e2e6dc", ink: "#1d2320", muted: "#505a53", line: "#c9d2c2", primary: "#1d2320", "on-primary": "#ffffff", accent: "#6f8466", em: "#3f5238", deep: "#26332b", "on-deep": "#eef0ea", "deep-muted": "#b9c6b6", wave1: "#d3dccb", wave2: "#a9b99f" } },
];

// The four point sparkle used as separator, bullet and ornament.
const SPARK_PATH = "M12 0C12.9 7.1 16.9 11.1 24 12C16.9 12.9 12.9 16.9 12 24C11.1 16.9 7.1 12.9 0 12C7.1 11.1 11.1 7.1 12 0Z";
function spark(cls = "ln-spark") {
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${SPARK_PATH}" fill="currentColor"/></svg>`;
}

// The no photo image: soft layered gradients that read as waves of hair.
function waves(ctx, cls = "ln-waves") {
  const id = uid(ctx, "lnw");
  const lines = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const y = 30 + i * 30;
    return `<path d="M-20 ${y} C 30 ${y - 34}, 70 ${y + 38}, 120 ${y + 4} S 200 ${y - 30}, 230 ${y + 6}" fill="none" style="stroke:var(--accent)" stroke-width="${i % 3 === 0 ? 1.4 : 0.8}" opacity="${(0.55 - i * 0.04).toFixed(2)}"/>`;
  }).join("");
  return `<div class="${cls}" aria-hidden="true"><svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" focusable="false"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--wave1)"/><stop offset="1" style="stop-color:var(--wave2)"/></linearGradient></defs><rect width="200" height="260" fill="url(#${id})"/>${lines}</svg></div>`;
}

const HEADLINE = {
  "hair-salon": [["Your hair,", "Su cabello,"], ["your way.", "a su manera."]],
  "nail-salon": [["Your nails,", "Sus uñas,"], ["your color.", "su color."]],
};

// The callout before booking: a consultation for color and extensions at a
// salon, inspiration photos at a nail studio. Advice, never a house policy.
const CALLOUT = {
  "hair-salon": {
    title: [["Color or extensions?", "¿Color o extensiones?"], ["Start with a consultation.", "Empiece con una consulta."]],
    body: ["It is the usual first step for color and extension work: a short conversation about your hair, its history and the look you want. Ask for one when you book.", "Es el primer paso habitual para color y extensiones: una plática corta sobre su cabello, su historial y el look que busca. Pídala al reservar."],
    cta: ["Ask for a consultation", "Pedir una consulta"],
  },
  "nail-salon": {
    title: [["Planning nail art?", "¿Piensa en un diseño?"], ["Bring your inspiration.", "Traiga su inspiración."]],
    body: ["Photos of sets you love help plan the shape, the length and the time it takes. Mention it when you book.", "Las fotos de diseños que le gustan ayudan a planear la forma, el largo y el tiempo. Menciónelo al reservar."],
    cta: ["Book a set", "Reservar"],
  },
};

const CSS = `
:root{--display:"Source Serif 4",Georgia,serif;--body:"Figtree",system-ui,sans-serif;--radius:12px;--btn-radius:999px;--max:1220px;--ease:cubic-bezier(.22,1,.36,1);--field:color-mix(in oklab,var(--bg) 55%,#ffffff);--field-line:color-mix(in oklab,var(--ink) 22%,transparent);--callbar-bg:var(--surface);--callbar-ink:var(--ink);--lang-fg:var(--ink);--lang-on:var(--bg);--star:var(--ink);--chip-radius:999px;--rule:color-mix(in oklab,var(--accent) 55%,transparent)}
body{font-size:1.0625rem;line-height:1.65}
.ln-spark{width:1em;height:1em;flex:none;color:var(--accent)}
.ln-serif{font-family:var(--display);font-weight:300;letter-spacing:-.02em;font-optical-sizing:auto}
.ln-h2{font-family:var(--display);font-weight:300;font-size:clamp(2.4rem,5.4vw,4.25rem);line-height:1.02;letter-spacing:-.02em}
.ln-h2 em,.ln-h1 em{font-style:italic;color:var(--em)}
.ln-lede{margin-top:1.1rem;max-width:44ch;color:var(--muted);font-size:1.08rem}
.ln-sec{padding:clamp(4.5rem,10vw,8.5rem) 0}
.ln-sec--surface{background:var(--surface)}
.ln-rule{height:1px;background:var(--rule);border:0;margin:0}

.b-hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--line)}
.b-hd__in{display:flex;align-items:center;gap:1.5rem;min-height:4.5rem}
.b-brand{margin-right:auto;font-family:var(--display);font-weight:400;font-size:1.55rem;letter-spacing:-.015em;line-height:1;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:62vw}
.b-nav{display:none;gap:1.9rem;font-size:.95rem;font-weight:500}
.b-nav a{text-decoration:none;padding:.3rem 0;background:linear-gradient(currentColor,currentColor) 0 100%/0 1px no-repeat;transition:background-size .45s var(--ease)}
.b-nav a:hover{background-size:100% 1px}
@media (min-width:1000px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:1rem}
.b-hd__tel{display:none;align-items:center;gap:.45rem;font-weight:500;text-decoration:none;font-variant-numeric:tabular-nums}
@media (min-width:860px){.b-hd__tel{display:inline-flex}}
.b-hd__cta,.ln-btn{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;border:1px solid var(--ink);border-radius:999px;font-weight:500;text-decoration:none;transition:background-color .35s var(--ease),color .35s var(--ease),border-color .35s var(--ease)}
.b-hd__cta{padding:.6rem 1.3rem;color:var(--ink)}
.b-hd__cta:hover{background:var(--ink);color:var(--bg)}
.ln-btn{min-height:3.25rem;padding:.8rem 1.6rem;font-size:1rem}
.ln-btn .ico{width:1.05rem;height:1.05rem}
.ln-btn--solid{background:var(--primary);border-color:var(--primary);color:var(--on-primary)}
.ln-btn--solid:hover{background:transparent;color:var(--primary)}
.ln-btn--line{color:inherit;border-color:currentColor}
.ln-btn--line:hover{background:var(--ink);border-color:var(--ink);color:var(--bg)}

.ln-hero{position:relative;padding:clamp(2.25rem,5vw,4.5rem) 0 clamp(3.5rem,7vw,6rem);overflow:hidden}
.ln-hero__grid{display:grid;gap:2.75rem}
@media (min-width:920px){.ln-hero--arch .ln-hero__grid{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(3rem,6vw,6.5rem);align-items:end}}
.ln-name{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem .7rem;font-size:.98rem;color:var(--muted)}
.ln-name strong{color:var(--ink);font-weight:600}
.ln-name .ln-spark{width:.8rem;height:.8rem}
.ln-h1{margin-top:1.4rem;font-family:var(--display);font-weight:300;font-size:clamp(3.1rem,7.6vw,6rem);line-height:.98;letter-spacing:-.025em;animation:kj-rise 1.2s var(--ease) both}
.ln-h1 em{display:block;font-weight:300}
.ln-intro{margin-top:1.5rem;max-width:40ch;font-size:1.125rem;color:var(--muted)}
.ln-ctas{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2.1rem}
.ln-hero .b-rating{display:inline-flex;flex-wrap:wrap;align-items:center;gap:.5rem .8rem;margin-top:2.25rem;padding-top:1.1rem;border-top:1px solid var(--rule)}
.ln-hero .b-rating__num{font-family:var(--display);font-weight:400;font-size:1.9rem;line-height:1;letter-spacing:-.02em}
.ln-hero .stars{width:5.75rem;height:1.15rem}
.ln-hero .b-rating__count{font-size:.95rem;color:var(--muted)}
.ln-media{position:relative;justify-self:end;width:min(100%,32rem)}
@media (max-width:919.98px){.ln-hero--arch .ln-media{width:86%}}
.ln-arch{position:relative;aspect-ratio:3/4;max-height:min(46rem,calc(100svh - 9rem));border-radius:999px 999px 0 0;overflow:hidden;background:var(--surface);animation:kj-fade 1.4s var(--ease) .15s both}
.ln-arch>.b-photo,.ln-arch>.ln-waves{position:absolute;inset:0}
.ln-arch img,.ln-dome img,.ln-tile img,.ln-capsule img{filter:saturate(.86) sepia(.08) contrast(.97)}
.ln-arch::after,.ln-dome::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle,rgb(0 0 0 / .05) .6px,transparent 1px) 0 0/3px 3px}
.ln-waves{background:var(--surface)}
.ln-waves svg{width:100%;height:100%}
.ln-media>.ln-spark{position:absolute;z-index:2;left:-1.6rem;top:14%;width:3.25rem;height:3.25rem;animation:ln-turn 22s linear infinite}
.ln-media>.ln-spark--sm{left:auto;right:-.6rem;top:auto;bottom:10%;width:1.5rem;height:1.5rem;animation-duration:30s;animation-direction:reverse}
@keyframes ln-turn{to{transform:rotate(360deg)}}
.ln-cap{position:absolute;z-index:2;right:0;bottom:0;padding:.35rem .7rem;background:var(--bg);font-size:.75rem;color:var(--muted);border-top-left-radius:10px}

.ln-hero--portal{text-align:center}
.ln-hero--portal .ln-name{justify-content:center}
.ln-hero--portal .ln-h1{margin-inline:auto;max-width:14ch}
.ln-hero--portal .ln-h1 em{display:inline}
.ln-hero--portal .ln-intro{margin-inline:auto}
.ln-hero--portal .ln-ctas{justify-content:center}
.ln-dome{position:relative;margin-top:clamp(2.5rem,5vw,4rem);aspect-ratio:4/3;border-radius:50% 50% 0 0/100% 100% 0 0;overflow:hidden;background:var(--surface)}
@media (min-width:760px){.ln-dome{aspect-ratio:21/9}}
.ln-dome>.b-photo,.ln-dome>.ln-waves{position:absolute;inset:0}
.ln-dome__foot{position:relative;display:flex;justify-content:center;margin-top:-1.6rem}
.ln-hero--portal .ln-dome__foot .b-rating{margin:0;padding:.75rem 1.4rem;border:1px solid var(--line);border-radius:999px;background:var(--bg)}

.ln-marquee{padding:1.15rem 0;border-block:1px solid var(--rule);--marquee-s:60s}
.ln-marquee .b-marquee__run{display:inline-flex;align-items:center}
.ln-marquee .b-marquee__item{padding:0 1.5rem;font-family:var(--display);font-style:italic;font-weight:300;font-size:clamp(1.6rem,3.4vw,2.6rem);line-height:1.2;letter-spacing:-.015em}
.ln-marquee .ln-spark{width:1.1rem;height:1.1rem}

.ln-proof{display:grid;gap:2.5rem;align-items:center}
@media (min-width:900px){.ln-proof{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:5rem}}
.ln-proof .b-rating{display:grid;gap:1rem;justify-items:start}
.ln-proof .b-rating__num{font-family:var(--display);font-weight:300;font-size:clamp(7rem,17vw,11.5rem);line-height:.8;letter-spacing:-.04em}
.ln-proof .b-rating__side{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1rem}
.ln-proof .stars{width:7rem;height:1.4rem}
.ln-proof .b-rating__count{font-weight:500}
.ln-proof .b-rating__cap{color:var(--muted);font-size:.95rem}
.ln-proof__words .ln-h2{font-size:clamp(2rem,4vw,3.1rem)}
.b-themes{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem 0;margin-top:1.75rem}
.b-themes li{display:inline-flex;align-items:center;font-family:var(--display);font-style:italic;font-weight:300;font-size:clamp(1.35rem,2.4vw,1.8rem);line-height:1.3}
.b-themes li+li::before{content:"";width:.55rem;height:.55rem;margin:0 1rem;background:var(--accent);clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)}
.b-themes__note{margin-top:1rem;font-size:.9rem;color:var(--muted)}
.ln-proof--line{display:block;text-align:center}
.ln-proof--line .b-rating{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:1rem 1.75rem}
.ln-proof--line .b-rating__num{font-size:clamp(5rem,12vw,8rem)}
.ln-proof--line .b-rating__side{justify-content:center}
.ln-proof--line .b-themes{justify-content:center}
.ln-proof--line .ln-h2{margin-bottom:2.5rem}

.ln-menu{display:grid;gap:3rem}
@media (min-width:960px){.ln-menu{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:5rem}.ln-menu__head{position:sticky;top:7rem;align-self:start}}
.ln-menu--photo .ln-menu__head .ln-capsule{margin-top:2.5rem}
.ln-capsule{position:relative;width:min(100%,19rem);aspect-ratio:3/5;border-radius:999px;overflow:hidden;background:var(--surface)}
.ln-capsule>.b-photo,.ln-capsule>.ln-waves{position:absolute;inset:0}
@media (max-width:959.98px){.ln-capsule{width:min(62%,15rem);aspect-ratio:3/4}}
.b-svc{display:grid;gap:0}
.b-svc__item{display:flex;align-items:baseline;gap:1rem;padding:1.35rem 0;border-bottom:1px solid var(--rule)}
.b-svc__item:first-child{border-top:1px solid var(--rule)}
.b-svc__name{font-family:var(--display);font-weight:300;font-size:clamp(1.7rem,3.4vw,2.5rem);line-height:1.1;letter-spacing:-.02em}
.b-svc__dots{flex:1;min-width:1rem}
.b-svc__tail{flex:none;padding:.4rem .95rem;border:1px solid var(--line);border-radius:999px;font-size:.875rem;font-weight:500;text-decoration:none;transition:background-color .3s,color .3s,border-color .3s}
.b-svc__tail:hover{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.b-svc-confirm{margin-top:1.5rem;font-size:.95rem;color:var(--muted)}
.svc-note{margin-top:.35rem;font-size:.9rem;color:var(--muted)}

.ln-callout{position:relative;display:grid;gap:2rem;padding:clamp(2.25rem,5vw,4rem);border:1px solid var(--rule);border-radius:clamp(2rem,6vw,5rem) clamp(2rem,6vw,5rem) 0 0;background:var(--bg)}
@media (min-width:900px){.ln-callout{grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:4rem;align-items:end}}
.ln-callout .ln-h2{font-size:clamp(2.2rem,4.6vw,3.6rem)}
.ln-callout .ln-h2 em{display:block}
.ln-callout p{color:var(--muted);max-width:46ch}
.ln-callout .ln-btn{margin-top:1.5rem}
.ln-callout>.ln-spark{position:absolute;right:clamp(2.5rem,8vw,6rem);top:-1.15rem;width:2.3rem;height:2.3rem;padding:0 .35rem;background:var(--bg);box-sizing:content-box}

.ln-head{display:grid;gap:1rem;margin-bottom:3rem}
@media (min-width:900px){.ln-head{grid-template-columns:minmax(0,1fr) minmax(0,26rem);align-items:end}.ln-head .ln-lede{margin:0}}
.b-team{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2rem 1rem}
@media (min-width:900px){.b-team{grid-template-columns:repeat(4,minmax(0,1fr));gap:2rem 1.5rem}}
.b-team__frame{position:relative;display:grid;place-items:center;aspect-ratio:3/4;border-radius:999px 999px 0 0;border:1px solid var(--rule);background:linear-gradient(165deg,var(--wave1),var(--bg) 75%);color:var(--accent)}
.b-team__glyph{width:34%;height:auto}
.b-team__num{position:absolute;left:50%;bottom:1rem;transform:translateX(-50%);font-family:var(--display);font-style:italic;font-size:1.1rem;color:var(--muted)}
.b-team__seat{margin-top:1rem;font-family:var(--display);font-weight:400;font-size:1.45rem;letter-spacing:-.015em;line-height:1.1}
.b-team__who{margin-top:.2rem;font-size:.9rem;color:var(--muted)}
.b-team__book{display:inline-block;margin-top:.6rem;font-weight:500;font-size:.95rem;text-underline-offset:.3em;text-decoration-thickness:1px}
.b-team__note{margin-top:2.5rem;max-width:60ch;font-size:.95rem;color:var(--muted)}

.ln-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
@media (min-width:860px){.ln-gallery{grid-template-columns:1fr 1.15fr 1fr;grid-template-rows:auto auto;gap:1.5rem}.ln-g1{grid-row:span 2}.ln-g4{grid-column:3;grid-row:1/span 2;margin-top:5rem}.ln-g2,.ln-g3{grid-column:2}}
.ln-tile{position:relative;overflow:hidden;background:var(--surface);aspect-ratio:1}
.ln-tile>.b-photo,.ln-tile>.ln-waves{position:absolute;inset:0}
.ln-tile--arch{aspect-ratio:3/4.2;border-radius:999px 999px 0 0}
.ln-tile--rect{border-radius:var(--radius)}
@media (min-width:860px){.ln-g2,.ln-g3{aspect-ratio:5/4}}
@media (max-width:859.98px){.ln-tile{aspect-ratio:3/4}.ln-tile--arch{aspect-ratio:3/4}}
.ln-tile__empty{position:absolute;inset:auto 0 0 0;z-index:1;padding:.9rem;text-align:center;font-family:var(--display);font-style:italic;font-size:1.05rem;color:var(--ink)}
.ln-gallery-note{margin-top:1.5rem;font-size:.9rem;color:var(--muted)}

.ln-req{display:grid;gap:3rem}
@media (min-width:980px){.ln-req{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:5rem}.ln-req__side{position:sticky;top:7rem;align-self:start}}
.ln-req__side .b-rating{display:inline-flex;align-items:center;gap:.6rem;margin-top:2rem;padding:.65rem 1.1rem;border:1px solid var(--line);border-radius:999px}
.ln-req__side .b-rating__num{font-family:var(--display);font-size:1.4rem;line-height:1}
.ln-req__side .stars{width:5.25rem;height:1.05rem}
.ln-req__side .b-rating__count{font-size:.9rem;color:var(--muted)}
.ln-req__side .ln-btn{margin-top:1.25rem}
.ln-panel{padding:clamp(1.5rem,3.5vw,2.75rem);border:1px solid var(--line);border-radius:28px;background:var(--bg)}
.f-input{border-radius:12px;border-width:1px}
.f-chip>span{border-width:1px}
.f-chip.day>span{border-radius:14px}
.f-chip input:checked+span{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.f-submit{border-radius:999px;background:var(--primary);color:var(--on-primary);font-weight:600}
.f-status{border-width:1px;border-radius:14px}

.ln-visit{display:grid;gap:2.5rem}
@media (min-width:900px){.ln-visit{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:5rem}}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7.5rem 1fr;gap:1rem;padding:1.1rem 0;border-bottom:1px solid var(--rule)}
.facts div:first-child{border-top:1px solid var(--rule)}
.facts dt{color:var(--muted);font-size:.95rem}
.facts dd{margin:0;font-weight:500}
.b-visit__pending{display:grid;gap:.45rem;margin-top:1.5rem;color:var(--muted);font-size:.95rem}
.b-visit__pending li{display:flex;gap:.6rem}
.b-visit__pending li::before{content:"";flex:none;width:.5rem;height:.5rem;margin-top:.55rem;background:var(--accent);clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-weight:500;text-underline-offset:.3em}

.ln-faq .faq details{border-color:var(--rule)}
.ln-faq .faq summary{font-family:var(--display);font-weight:400;font-size:clamp(1.25rem,2.2vw,1.6rem);letter-spacing:-.01em;padding:1.35rem 0}
.ln-faq .faq summary .ico{color:var(--accent)}

.ln-close{position:relative;padding:clamp(5rem,11vw,9rem) 0;background:var(--deep);color:var(--on-deep);text-align:center;overflow:hidden}
.ln-close .ln-h2{font-size:clamp(3rem,8.5vw,6rem);max-width:14ch;margin-inline:auto}
.ln-close .ln-h2 em{color:inherit}
.ln-close p{margin:1.25rem auto 0;max-width:44ch;color:var(--deep-muted)}
.ln-close .ln-ctas{justify-content:center}
.ln-close .ln-btn--solid{background:var(--on-deep);border-color:var(--on-deep);color:var(--deep)}
.ln-close .ln-btn--solid:hover{background:transparent;color:var(--on-deep)}
.ln-close .ln-btn--line:hover{background:var(--on-deep);border-color:var(--on-deep);color:var(--deep)}
.ln-close>.ln-spark{position:absolute;color:var(--deep-muted);opacity:.5}
.ln-close>.ln-spark:nth-of-type(1){left:8%;top:22%;width:2.5rem;height:2.5rem}
@media (max-width:759.98px){.ln-close>.ln-spark:nth-of-type(1){left:1rem;top:1.75rem;width:1.75rem;height:1.75rem}}
.ln-close>.ln-spark:nth-of-type(2){right:10%;bottom:20%;width:1.5rem;height:1.5rem}

.b-ft{padding:4rem 0 2.75rem;border-top:1px solid var(--rule)}
.b-ft__name{font-family:var(--display);font-weight:300;font-size:clamp(2.2rem,5vw,3.4rem);letter-spacing:-.025em;line-height:1}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;color:var(--muted)}
.b-ft__row a{color:var(--ink);font-weight:500}
.legal{margin-top:2rem;font-size:.85rem;color:var(--muted)}
.stock-credits{margin-top:.5rem}
.b-float{border:1px solid var(--primary);background:var(--primary);color:var(--on-primary);font-weight:600;box-shadow:none}
.callbar--split{border:1px solid var(--line)}
.callbar--split .cb-book{background:var(--primary);color:var(--on-primary)}
`;

function headline(ctx) {
  if (ctx.copy.headline) return `<h1 class="ln-h1">${esc(ctx.copy.headline)}</h1>`;
  const [a, b] = HEADLINE[ctx.categoryKey] || HEADLINE["hair-salon"];
  return `<h1 class="ln-h1">${ctx.t(a[0], a[1])} <em>${ctx.t(b[0], b[1])}</em></h1>`;
}

// Photo inside a shaped frame, or the waves when the library has none left.
function shaped(ctx, photo, cls, { hero = false, sizes = "50vw", width = 1200, caption = false } = {}) {
  const inner = photo ? photoFrame(ctx, photo, { hero, sizes, width }) : waves(ctx);
  const cap = photo && caption ? `<span class="ln-cap">${ctx.t("Stock photo", "Foto de archivo")}</span>` : "";
  return `<div class="${cls}">${inner}${cap}</div>`;
}

function render(ctx) {
  const t = ctx.t;
  const role = roleFor(ctx);
  const portal = ctx.variants.hero === "portal";
  const nails = ctx.categoryKey === "nail-salon";
  // What the visitor books: a chair at a hair salon, a set at a nail studio.
  const seat = nails ? ["set", "cita"] : ["chair", "silla"];
  const bookSeat = [`Book your ${seat[0]}`, `Reserve su ${seat[1]}`];
  const nav = [
    ctx.services.length ? { href: "#menu", label: ["Services", "Servicios"] } : null,
    { href: "#team", label: role.many },
    { href: "#gallery", label: ["Gallery", "Galería"] },
    { href: "#visit", label: ["Visit", "Visítenos"] },
  ].filter(Boolean);
  const header = siteHeader(ctx, { nav, cta: ["Book", "Reservar"] });
  const solid = (label, ico = "") => bookButton(ctx, { cls: "ln-btn ln-btn--solid", ico, label });
  const callPill = (label = ["Call", "Llamar"]) => callButton(ctx, { cls: "ln-btn ln-btn--line", label, number: false });

  const heroImg = ctx.photos.hero();
  const intro = ctx.about || t("Pick a service and a time that suits you. The salon confirms before it is final.", "Elija un servicio y un horario que le acomode. El salón confirma antes de que quede fijo.");
  const nameLine = `<p class="ln-name"><strong>${ctx.name}</strong>${spark()}<span>${ctx.categoryT}, ${esc(ctx.placeRaw)}</span></p>`;
  const ctas = `<div class="ln-ctas">${solid(ctx.copy.ctaPrimary ? null : bookSeat)}${callPill()}</div>`;
  const chip = ratingProof(ctx, "chip");

  const hero = portal
    ? `<section class="ln-hero ln-hero--portal" id="top"><div class="wrap">${nameLine}${headline(ctx)}<p class="ln-intro">${intro}</p>${ctas}
${shaped(ctx, heroImg, "ln-dome", { hero: true, sizes: "100vw", width: 1600 })}<div class="ln-dome__foot">${chip}</div></div></section>`
    : `<section class="ln-hero ln-hero--arch" id="top"><div class="wrap ln-hero__grid"><div>${nameLine}${headline(ctx)}<p class="ln-intro">${intro}</p>${ctas}${chip}</div>
<div class="ln-media">${spark()}${shaped(ctx, heroImg, "ln-arch", { hero: true, sizes: "(min-width: 920px) 34vw, 86vw", width: 1200, caption: true })}${spark("ln-spark ln-spark--sm")}</div></div></section>`;

  const ticker = ctx.services.length ? marquee(ctx, ctx.services.map(esc), { cls: "ln-marquee", sep: spark() }) : "";

  const line = ctx.variants.proof === "line";
  const proofWords = `<div class="ln-proof__words"><h2 class="ln-h2">${t("What clients say", "Lo que dicen")} <em>${t("on Google", "en Google")}</em></h2>${themesBlock(ctx) || `<p class="ln-lede">${t("The rating and the count come straight from the salon's Google reviews.", "La calificación y el número vienen directo de las reseñas de Google del salón.")}</p>`}</div>`;
  const proof = line
    ? `<section class="ln-sec" aria-label="Google rating"><div class="wrap ln-proof ln-proof--line"><h2 class="ln-h2">${t("Straight from", "Directo de")} <em>Google</em></h2>${ratingProof(ctx, "strip")}${themesBlock(ctx)}</div></section>`
    : `<section class="ln-sec" aria-label="Google rating"><div class="wrap ln-proof">${ratingProof(ctx, "figure")}${proofWords}</div></section>`;

  const photoMenu = ctx.variants.services === "photo";
  const menu = ctx.services.length
    ? `<section class="ln-sec ln-sec--surface" id="menu"><div class="wrap ln-menu${photoMenu ? " ln-menu--photo" : ""}"><div class="ln-menu__head"><h2 class="ln-h2">${t("On the", "En el")} <em>${t("menu", "menú")}</em></h2><p class="ln-lede">${t("Choose a service to book it. Timing and details are settled with the salon.", "Elija un servicio para reservarlo. Los tiempos y detalles se ven con el salón.")}</p>${photoMenu ? shaped(ctx, ctx.photos.next(), "ln-capsule", { sizes: "(min-width: 960px) 19rem, 60vw", width: 800 }) : ""}</div><div>${servicesList(ctx, "menu", { tail: ["Book", "Reservar"], link: true, numbered: false })}${servicesConfirm(ctx)}</div></div></section>`
    : "";

  const c = CALLOUT[ctx.categoryKey] || CALLOUT["hair-salon"];
  const callout = `<section class="ln-sec" id="consult"><div class="wrap"><div class="ln-callout">${spark()}<h2 class="ln-h2">${t(c.title[0][0], c.title[0][1])} <em>${t(c.title[1][0], c.title[1][1])}</em></h2><div><p>${t(c.body[0], c.body[1])}</p>${solid(c.cta, "calendar")}</div></div></div></section>`;

  const team = `<section class="ln-sec ln-sec--surface" id="team"><div class="wrap"><div class="ln-head"><h2 class="ln-h2">${t("The", "Los")} <em>${t(role.many[0].toLowerCase(), role.many[1].toLowerCase())}</em></h2><p class="ln-lede">${t(`Book with a favorite ${role.one[0].toLowerCase()}, or choose ${role.any[0].toLowerCase()} for the first open time.`, `Reserve con su ${role.one[1].toLowerCase()} favorito o elija ${role.any[1].toLowerCase()} para el primer horario libre.`)}</p></div>${teamPlaceholders(ctx)}</div></section>`;

  // Two arches and two rectangles; the library fills what it can and the
  // waves stand in for the salon's own photos.
  const shots = ctx.photos.many(4);
  const shapes = ["ln-tile ln-tile--arch ln-g1", "ln-tile ln-tile--rect ln-g2", "ln-tile ln-tile--rect ln-g3", "ln-tile ln-tile--arch ln-g4"];
  const tiles = shapes.map((cls, i) => {
    const p = shots[i];
    if (p) return `<div class="${cls} rv">${photoFrame(ctx, p, { sizes: "(min-width: 860px) 33vw, 50vw", width: 800 })}</div>`;
    return `<div class="${cls}">${waves(ctx)}<span class="ln-tile__empty">${t("Your work goes here", "Aquí va su trabajo")}</span></div>`;
  }).join("");
  const gallery = `<section class="ln-sec" id="gallery"><div class="wrap"><div class="ln-head"><h2 class="ln-h2">${t("In the", "En la")} <em>${t("chair", "silla")}</em></h2><p class="ln-lede">${nails ? t("The salon's own photos go here: finished sets, nail art and the room itself.", "Aquí van las fotos del salón: diseños terminados, nail art y el lugar.") : t("The salon's own photos go here: fresh color, finished cuts and the room itself.", "Aquí van las fotos del salón: color recién hecho, cortes terminados y el lugar.")}</p></div><div class="ln-gallery">${tiles}</div>${shots.length ? `<p class="ln-gallery-note">${t("Stock photos stand in for the salon's own work.", "Fotos de archivo en lugar del trabajo del salón.")}</p>` : ""}</div></section>`;

  const form = formHeading(ctx);
  const request = `<section class="ln-sec ln-sec--surface" id="${REQUEST_ID}"><div class="wrap ln-req"><div class="ln-req__side"><h2 class="ln-h2">${form.title}</h2><p class="ln-lede">${form.intro}</p>${ratingProof(ctx, "chip")}<div>${callPill(["Or call", "O llame"])}</div></div><div class="ln-panel">${ctx.form}</div></div></section>`;

  const visit = `<section class="ln-sec" id="visit"><div class="wrap ln-visit"><div><h2 class="ln-h2">${t("Find the", "Encuentre el")} <em>${t("salon", "salón")}</em></h2><p class="ln-lede">${esc(ctx.placeRaw)}</p></div>${visitDetails(ctx)}</div></section>`;

  const faq = `<section class="ln-sec ln-sec--surface ln-faq" id="faq"><div class="wrap ln-visit"><h2 class="ln-h2">${t("Good to", "Bueno")} <em>${t("know", "saber")}</em></h2>${faqBlock(ctx)}</div></section>`;

  const close = `<section class="ln-close">${spark()}${spark()}<div class="wrap"><h2 class="ln-h2">${t("Book your", "Reserve su")} <em>${t(seat[0], seat[1])}</em></h2><p>${t("Pick a service and a time. The salon confirms it with you.", "Elija un servicio y un horario. El salón se lo confirma.")}</p><div class="ln-ctas">${solid(["Book now", "Reservar"])}${callPill()}</div></div></section>`;

  return {
    css: CSS,
    body: `${header}<main>${hero}${ticker}${proof}${menu}${callout}${team}${gallery}${request}${visit}${faq}${close}</main>${siteFooter(ctx)}${floatingBook(ctx, { label: [bookSeat[0], "Reservar"] })}`,
  };
}

export const direction = {
  key: "salon-linen-editorial",
  label: "Linen editorial: soft salon",
  status: "implemented",
  suits: ["hair-salon", "nail-salon"],
  keywords: ["editorial", "premium", "soft", "organic", "luxury"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;1,8..60,300;1,8..60,400&family=Figtree:wght@400;500;600&display=swap",
  palettes: PALETTES,
  variants: { hero: ["arch", "portal"], services: ["list", "photo"], proof: ["figure", "line"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /foil|color|salon-interior|polish|manicure/ },
  callbar: "split",
  render,
};
