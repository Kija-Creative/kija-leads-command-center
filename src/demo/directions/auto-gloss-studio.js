// Gloss studio (research/design-auto.md, direction 6). After hours in a
// detail studio: black, reflections, precise, paint treated like jewellery.
// A generic car profile with one strip light sweeping across it, glass cards,
// the services as four big tiles with a hover reflection, a finish chooser that
// renders the paint it names, and a tint shade preview for shops that list
// tint. No script: choosers are native radios read by :has(), and they belong
// to the request form through the form attribute so the choice travels with it.

import {
  callButton,
  faqBlock,
  floatingBook,
  formHeading,
  photoFrame,
  ratingProof,
  REQUEST_ID,
  servicesConfirm,
  servicesNote,
  shortCta,
  siteFooter,
  siteHeader,
  stepsBlock,
  themesBlock,
  uid,
  visitDetails,
} from "../blocks.js";
import { esc, icon } from "../shared.js";

const PALETTES = [
  { key: "gloss-obsidian", name: "Obsidian and ice", vars: { bg: "#07080a", surface: "#111317", ink: "#e8f1ff", muted: "#9aa4b2", line: "#23262c", primary: "#7cc4ff", "on-primary": "#07080a", accent: "#7cc4ff", glow: "#bfe3ff", paint: "#173556", "paint-deep": "#060d17" } },
  { key: "gloss-lime", name: "Black and chrome lime", vars: { bg: "#0a0a0a", surface: "#141414", ink: "#f2f2f2", muted: "#a3abb4", line: "#2a2a2a", primary: "#d9ff3f", "on-primary": "#0a0a0a", accent: "#9aa3ad", glow: "#f4ffd0", paint: "#2b2f34", "paint-deep": "#07080a" } },
  { key: "gloss-candy", name: "Candy", vars: { bg: "#0d0a12", surface: "#17121f", ink: "#f5f0ff", muted: "#aea5bb", line: "#2c2536", primary: "#ff2e88", "on-primary": "#0d0a12", accent: "#ff2e88", glow: "#ffd1e6", paint: "#5c0f37", "paint-deep": "#12030b" } },
];

// Finishes drawn with gradients only. `bg` is the swatch and the big preview.
const HI = "radial-gradient(120% 75% at 28% 18%,rgb(255 255 255 / .9) 0 5%,rgb(255 255 255 / .18) 16%,transparent 34%)";
const BASE = "linear-gradient(165deg,color-mix(in oklab,var(--paint) 80%,#fff 20%) 0%,var(--paint) 38%,var(--paint-deep) 100%)";
const FINISHES = {
  gloss: `${HI},linear-gradient(100deg,transparent 58%,rgb(255 255 255 / .22) 60%,transparent 64%),${BASE}`,
  satin: `radial-gradient(150% 95% at 30% 15%,rgb(255 255 255 / .32),transparent 58%),${BASE}`,
  matte: `linear-gradient(165deg,color-mix(in oklab,var(--paint) 88%,#fff 12%),var(--paint) 70%)`,
  metallic: `${HI},radial-gradient(rgb(255 255 255 / .45) .6px,transparent 1.3px) 0 0/5px 5px,${BASE}`,
  pearl: `${HI},linear-gradient(125deg,rgb(255 255 255 / .0) 10%,rgb(214 200 255 / .45) 38%,rgb(255 214 236 / .4) 55%,rgb(200 248 255 / .45) 75%,transparent 92%),${BASE}`,
  clean: `radial-gradient(circle at 20% 30%,rgb(255 255 255 / .8) 0 2px,transparent 3px),radial-gradient(circle at 60% 55%,rgb(255 255 255 / .7) 0 3px,transparent 4px),radial-gradient(circle at 80% 20%,rgb(255 255 255 / .75) 0 2px,transparent 3px) 0 0/38px 34px,radial-gradient(circle,rgb(255 255 255 / .55) 0 1.5px,transparent 2.5px) 0 0/17px 15px,${HI},${BASE}`,
};

// The chooser changes with the trade: a detail customer picks a finish, a
// body shop customer says what their paint is (it matters for the match), and
// a mobile customer says where the car is.
const CHOOSERS = {
  "auto-detailing": {
    nav: ["Finish", "Acabado"],
    title: ["Pick your", "Elija su"], em: ["finish", "acabado"],
    lede: ["Tell the studio the look you are after. It is a starting point for the conversation, not a package.", "Dígale al estudio qué look busca. Es un punto de partida para platicar, no un paquete."],
    legend: ["Finish", "Acabado"],
    options: [
      { key: "gloss", label: ["Deep gloss", "Brillo profundo"], note: ["Sharp reflections, wet look.", "Reflejos nítidos, efecto mojado."] },
      { key: "satin", label: ["Satin", "Satinado"], note: ["Soft sheen, quieter reflections.", "Brillo suave, reflejos discretos."] },
      { key: "matte", label: ["Matte", "Mate"], note: ["No shine, even color.", "Sin brillo, color parejo."] },
      { key: "clean", label: ["Just clean", "Solo limpio"], note: ["Washed, dried, water beading off.", "Lavado, secado, el agua resbala."] },
    ],
  },
  "auto-body-collision": {
    nav: ["Paint", "Pintura"],
    title: ["What is your", "¿Cómo es su"], em: ["paint?", "pintura?"],
    lede: ["Paint type changes how a repair is matched and blended. Pick the closest one; the shop confirms in person.", "El tipo de pintura cambia cómo se iguala y difumina. Elija la más parecida; el taller la confirma en persona."],
    legend: ["Paint type", "Tipo de pintura"],
    options: [
      { key: "gloss", label: ["Solid", "Sólida"], note: ["One even color, no sparkle.", "Un solo color, sin destellos."] },
      { key: "metallic", label: ["Metallic", "Metálica"], note: ["Fine sparkle in the light.", "Destellos finos con la luz."] },
      { key: "pearl", label: ["Pearl", "Perla"], note: ["Color shifts at an angle.", "El color cambia según el ángulo."] },
      { key: "matte", label: ["Matte", "Mate"], note: ["Flat, no shine.", "Plana, sin brillo."] },
    ],
  },
  "mobile-mechanic": {
    nav: ["Where", "Dónde"],
    title: ["Where is", "¿Dónde está"], em: ["the car?", "el carro?"],
    lede: ["A mobile visit starts with where the car is parked. Pick one and add the details in the request.", "Una visita a domicilio empieza por dónde está el carro. Elija uno y agregue detalles en la solicitud."],
    legend: ["Where", "Dónde"],
    options: [
      { key: "gloss", label: ["At home", "En casa"], note: ["Driveway or street parking.", "Cochera o en la calle."] },
      { key: "satin", label: ["At work", "En el trabajo"], note: ["A parking lot or garage.", "Un estacionamiento."] },
      { key: "metallic", label: ["Somewhere else", "En otro lugar"], note: ["Share it in the request.", "Compártalo en la solicitud."] },
      { key: "clean", label: ["Not sure yet", "Todavía no sé"], note: ["The shop can talk it through.", "El taller lo platica con usted."] },
    ],
  },
};

const TINT = [
  { key: "70", dark: 0.22, label: ["Light", "Claro"] },
  { key: "50", dark: 0.42, label: ["Medium", "Medio"] },
  { key: "35", dark: 0.6, label: ["Dark", "Oscuro"] },
  { key: "20", dark: 0.78, label: ["Darker", "Más oscuro"] },
  { key: "5", dark: 0.94, label: ["Limo", "Limosina"] },
];

const CSS = `
:root{--display:"Unbounded",system-ui,sans-serif;--body:"Onest",system-ui,sans-serif;--radius:18px;--btn-radius:999px;--chip-radius:999px;--max:1240px;--ease:cubic-bezier(.16,1,.3,1);--glass:rgb(255 255 255 / .055);--glass-line:rgb(255 255 255 / .13);--field:rgb(255 255 255 / .04);--field-line:rgb(255 255 255 / .16);--star:var(--primary);--callbar-bg:var(--surface);--callbar-ink:var(--ink);--lang-fg:var(--ink);--lang-on:var(--bg)}
body{font-size:1.0625rem;line-height:1.7}
.gs-wide{font-family:var(--display);font-weight:400;font-size:.7rem;letter-spacing:.32em;text-transform:uppercase}

.b-hd{position:sticky;top:0;z-index:10;background:rgb(0 0 0 / .55);-webkit-backdrop-filter:blur(16px) saturate(1.4);backdrop-filter:blur(16px) saturate(1.4);border-bottom:1px solid var(--glass-line)}
.b-hd__in{display:flex;align-items:center;gap:1.5rem;min-height:4.25rem}
.b-brand{margin-right:auto;font-family:var(--display);font-weight:500;font-size:.95rem;letter-spacing:.14em;text-transform:uppercase;line-height:1.2;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60vw}
.b-nav{display:none;gap:2rem;font-size:.95rem;color:var(--muted)}
.b-nav a{text-decoration:none;transition:color .3s}
.b-nav a:hover{color:var(--ink)}
@media (min-width:1040px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:1rem}
.b-hd__tel{display:none;align-items:center;gap:.45rem;font-weight:500;text-decoration:none;color:var(--muted)}
.b-hd__tel:hover{color:var(--ink)}
@media (min-width:860px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.6rem;padding:0 1.2rem;border:1px solid var(--primary);border-radius:999px;color:var(--primary);font-weight:500;text-decoration:none;transition:background-color .3s,color .3s}
.b-hd__cta:hover{background:var(--primary);color:var(--on-primary)}

.gs-hero{position:relative;overflow:hidden;min-height:min(92svh,56rem);display:grid;align-content:center;padding:clamp(3rem,7vw,6rem) 0 clamp(8rem,14vw,11rem);background:radial-gradient(90% 60% at 50% 105%,color-mix(in oklab,var(--primary) 16%,transparent),transparent 70%),radial-gradient(60% 50% at 50% 0%,rgb(255 255 255 / .05),transparent 70%),var(--bg);isolation:isolate}
.gs-hero__in{position:relative;z-index:2;container-type:inline-size}
.gs-kicker{display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;color:var(--muted)}
.gs-kicker span+span::before{content:"";display:inline-block;width:1.5rem;height:1px;margin-right:1.5rem;vertical-align:middle;background:currentColor;opacity:.5}
.gs-name{margin-top:1.5rem;font-family:var(--display);font-weight:700;text-transform:uppercase;letter-spacing:-.01em;line-height:1;font-size:min(5.25rem,calc(100cqi / (var(--nl) * .86)));overflow-wrap:anywhere;animation:gs-in 1.2s var(--ease) both}
@media (max-width:599.98px){.gs-kicker{flex-direction:column;gap:.35rem}.gs-kicker span+span::before{display:none}.gs-name{font-size:min(2.6rem,calc(100cqi / (var(--nl) * .86)))}}
@keyframes gs-in{from{opacity:0;letter-spacing:.12em;filter:blur(8px)}to{opacity:1;letter-spacing:-.01em;filter:none}}
.gs-promise{margin-top:1.5rem;max-width:36ch;font-size:clamp(1.15rem,2vw,1.4rem);line-height:1.45;color:color-mix(in oklab,var(--ink) 88%,transparent)}
.gs-about{margin-top:.75rem;max-width:52ch;color:var(--muted)}
.gs-ctas{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2.25rem}
.gs-btn{display:inline-flex;align-items:center;gap:.6rem;min-height:3.4rem;padding:0 1.7rem;border-radius:999px;font-weight:500;text-decoration:none;border:1px solid transparent;transition:transform .5s var(--ease),background-color .3s,color .3s,box-shadow .5s var(--ease)}
.gs-btn:hover{transform:translateY(-2px)}
.gs-btn--solid{background:var(--primary);color:var(--on-primary);box-shadow:0 0 0 0 color-mix(in oklab,var(--primary) 40%,transparent)}
.gs-btn--solid:hover{box-shadow:0 10px 40px -8px color-mix(in oklab,var(--primary) 60%,transparent)}
.gs-btn--glass{background:var(--glass);border-color:var(--glass-line);color:var(--ink);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.gs-btn--glass:hover{border-color:color-mix(in oklab,var(--ink) 40%,transparent)}

.gs-car{position:relative;z-index:1;margin:clamp(2rem,5vw,3.5rem) auto 0;width:min(100%,62rem)}
.gs-car svg{width:100%;height:auto;overflow:visible}
.gs-car__body{fill:url(#gs-paint)}
.gs-car__glass{fill:#050607;stroke:rgb(255 255 255 / .18);stroke-width:1}
.gs-car__line{fill:none;stroke:rgb(255 255 255 / .22);stroke-width:1.2}
.gs-car__rim{fill:none;stroke:var(--glow);stroke-opacity:.55;stroke-width:1.4}
.gs-car__edge{fill:none;stroke:var(--glow);stroke-width:1.6;stroke-dasharray:var(--len);stroke-dashoffset:0;animation:kj-draw 2.4s var(--ease) .2s both}
.gs-sweep{transform-box:view-box;animation:gs-sweep 9s var(--ease) .6s infinite}
@keyframes gs-sweep{0%{transform:translateX(-340px)}28%{transform:translateX(1080px)}100%{transform:translateX(1080px)}}
.gs-floor{opacity:.18}

.gs-hero--photo{align-content:end;padding-top:clamp(8rem,20vw,14rem);background:var(--bg)}
.gs-hero__photo{position:absolute;inset:0;z-index:0}
.gs-hero__photo .b-photo{position:absolute;inset:0;--photo-bg:var(--bg)}
.gs-hero__photo img{filter:saturate(.8) contrast(1.12) brightness(.8)}
.gs-hero__photo::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,var(--bg) 0%,color-mix(in oklab,var(--bg) 82%,transparent) 36%,transparent 72%),linear-gradient(0deg,var(--bg) 0%,transparent 45%)}
.gs-hero__photo .stock-tag{left:auto;right:1rem;bottom:auto;top:1rem}
.gs-hero--photo .gs-hero__in{max-width:var(--max)}
.gs-streak{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(105deg,transparent 40%,rgb(255 255 255 / .09) 48%,rgb(255 255 255 / .16) 50%,rgb(255 255 255 / .09) 52%,transparent 60%);background-size:260% 100%;background-repeat:no-repeat;animation:gs-streak 9s var(--ease) .6s infinite;mix-blend-mode:screen}
@keyframes gs-streak{0%{background-position:120% 0}28%{background-position:-20% 0}100%{background-position:-20% 0}}
@media (max-width:759.98px){.gs-hero__photo::after{background:linear-gradient(0deg,var(--bg) 18%,color-mix(in oklab,var(--bg) 70%,transparent) 55%,color-mix(in oklab,var(--bg) 25%,transparent))}}

.gs-glass{background:var(--glass);border:1px solid var(--glass-line);border-radius:var(--radius);-webkit-backdrop-filter:blur(20px) saturate(1.4);backdrop-filter:blur(20px) saturate(1.4)}
.gs-proof{position:relative;z-index:3;margin-top:calc(clamp(8rem,14vw,11rem) * -1 + 1.5rem)}
.gs-proof .gs-glass{display:grid;gap:1.25rem;padding:clamp(1.25rem,3vw,2rem);max-width:40rem;margin-left:auto}
@media (min-width:700px){.gs-proof .gs-glass{grid-template-columns:auto 1fr;align-items:center;gap:2rem}}
.gs-proof .b-rating{display:flex;align-items:center;gap:1.25rem}
.gs-proof .b-rating__num{font-family:var(--display);font-weight:500;font-size:clamp(3rem,6vw,4rem);line-height:1;letter-spacing:-.02em}
.gs-proof .b-rating__side{display:grid;gap:.3rem}
.gs-proof .b-rating__count{color:var(--muted)}
.gs-proof__line{color:var(--muted);font-size:.98rem}
.gs-proof--line{margin-top:0;padding:2.25rem 0;border-block:1px solid var(--line)}
.gs-proof--line .gs-glass{max-width:none;margin:0;background:none;border:0;padding:0;-webkit-backdrop-filter:none;backdrop-filter:none}

.gs-sec{position:relative;padding:clamp(5rem,11vw,9rem) 0}
.gs-sec--surface{background:var(--surface)}
.gs-h2{font-family:var(--display);font-weight:500;font-size:clamp(2rem,4.8vw,3.6rem);line-height:1.08;letter-spacing:-.02em;text-transform:uppercase}
.gs-h2 em{font-style:normal;color:var(--primary)}
.gs-lede{margin-top:1.25rem;max-width:52ch;color:var(--muted);font-size:1.08rem}
.gs-head{display:grid;gap:1rem;align-items:end}
@media (min-width:920px){.gs-head{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:4rem}.gs-head .gs-lede{margin:0}}

.gs-tiles{display:grid;gap:1rem;margin-top:3.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,15.5rem),1fr))}
.gs-tile{position:relative;display:flex;flex-direction:column;justify-content:space-between;min-height:clamp(16rem,30vw,22rem);padding:1.5rem;border-radius:var(--radius);border:1px solid var(--line);background:radial-gradient(120% 70% at 20% 0%,rgb(255 255 255 / .07),transparent 60%),linear-gradient(180deg,var(--surface),var(--bg));overflow:hidden;text-decoration:none;isolation:isolate;transition:border-color .5s var(--ease),transform .6s var(--ease)}
.gs-tile::after{content:"";position:absolute;inset:-20%;z-index:-1;background:linear-gradient(115deg,transparent 40%,rgb(255 255 255 / .12) 49%,rgb(255 255 255 / .2) 50%,rgb(255 255 255 / .12) 51%,transparent 60%);transform:translateX(-70%);transition:transform 1.1s var(--ease)}
.gs-tile:hover{border-color:color-mix(in oklab,var(--primary) 55%,transparent);transform:translateY(-4px)}
.gs-tile:hover::after{transform:translateX(70%)}
.gs-tile__n{color:var(--primary)}
.gs-tile__name{display:block;font-family:var(--display);font-weight:500;font-size:clamp(1.2rem,2vw,1.55rem);line-height:1.2;letter-spacing:-.01em}
.gs-tile__go{display:flex;align-items:center;gap:.5rem;margin-top:1rem;color:var(--muted);font-size:.95rem}
.gs-tile:hover .gs-tile__go{color:var(--ink)}
.gs-more{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.25rem}
.gs-more li{padding:.55rem 1.1rem;border:1px solid var(--line);border-radius:999px;color:var(--muted)}
.gs-svc--list .gs-tiles{grid-template-columns:1fr;gap:0}
.gs-svc--list .gs-tile{flex-direction:row;align-items:center;gap:2rem;min-height:0;padding:1.6rem .25rem;border-radius:0;border-width:0 0 1px;background:none}
.gs-svc--list .gs-tile:first-child{border-top-width:1px}
.gs-svc--list .gs-tile:hover{transform:none}
.gs-svc--list .gs-tile>span:last-child{flex:1;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.5rem 1.5rem}
.gs-svc--list .gs-tile__name{font-size:clamp(1.3rem,2.6vw,2rem)}
.gs-svc--list .gs-tile__go{margin:0}
.b-svc-confirm{margin-top:1.5rem;color:var(--muted)}
.svc-note{margin-top:.35rem;color:var(--muted);font-size:.95rem}

.gs-choose{display:grid;gap:2.5rem;margin-top:3.5rem}
@media (min-width:960px){.gs-choose{grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:3.5rem;align-items:center}}
.gs-preview{position:relative;aspect-ratio:16/10;border-radius:44% 44% 16% 16% / 30% 30% 12% 12%;overflow:hidden;box-shadow:0 40px 80px -30px rgb(0 0 0 / .9),inset 0 1px 0 rgb(255 255 255 / .25);background:var(--paint)}
.gs-preview__face{position:absolute;inset:0;transition:opacity .6s var(--ease)}
.gs-preview__face{opacity:0}
.gs-preview__cap{position:absolute;left:1.25rem;bottom:1.1rem;z-index:2;padding:.45rem .9rem;border-radius:999px;background:rgb(0 0 0 / .55);color:#fff;font-size:.9rem;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.gs-o{display:none}
@supports not selector(:has(*)){.gs-o--def{display:inline}.gs-preview__face--def{opacity:1}}
.gs-opts{border:0;margin:0;padding:0;display:grid;gap:.75rem}
.gs-opts legend{margin-bottom:.75rem;padding:0;color:var(--muted)}
.gs-opt{position:relative;display:grid;grid-template-columns:3.5rem 1fr;gap:1rem;align-items:center;padding:.85rem 1rem;min-height:4.25rem;border:1px solid var(--line);border-radius:14px;cursor:pointer;transition:border-color .4s var(--ease),background-color .4s var(--ease)}
.gs-opt input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}
.gs-opt:hover{border-color:color-mix(in oklab,var(--ink) 30%,transparent)}
.gs-opt:has(input:checked){border-color:var(--primary);background:color-mix(in oklab,var(--primary) 8%,transparent)}
.gs-opt:has(input:focus-visible){outline:3px solid var(--primary);outline-offset:2px}
.gs-opt__sw{width:3.5rem;height:3.5rem;border-radius:50%;box-shadow:inset 0 1px 0 rgb(255 255 255 / .3),0 6px 16px -6px rgb(0 0 0 / .8)}
.gs-opt__txt b{display:block;font-family:var(--display);font-weight:500;font-size:1rem;letter-spacing:.02em}
.gs-opt__txt small{display:block;color:var(--muted);font-size:.92rem;line-height:1.4}

.gs-tint{margin-top:5rem;display:grid;gap:2rem;padding:clamp(1.5rem,4vw,3rem)}
@media (min-width:960px){.gs-tint{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:3rem;align-items:center}}
.gs-tint__svg{width:100%;height:auto}
.gs-tint__film{fill:#050608;fill-opacity:var(--tint,.22);transition:fill-opacity .6s var(--ease)}
.gs-steps{border:0;margin:1.5rem 0 0;padding:0}
.gs-steps legend{padding:0;color:var(--muted);margin-bottom:.75rem}
.gs-track{position:relative;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.4rem;padding:.4rem;border:1px solid var(--line);border-radius:999px;background:linear-gradient(90deg,rgb(255 255 255 / .08),rgb(0 0 0 / .6))}
.gs-step{position:relative;display:grid;place-items:center;min-height:3.25rem;border-radius:999px;cursor:pointer;text-align:center;line-height:1.1}
.gs-step input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}
.gs-step b{font-family:var(--display);font-weight:500;font-size:.95rem}
.gs-step small{display:block;font-size:.72rem;color:var(--muted)}
.gs-step:has(input:checked){background:var(--primary);color:var(--on-primary)}
.gs-step:has(input:checked) small{color:inherit;opacity:.8}
.gs-step:has(input:focus-visible){outline:3px solid var(--primary);outline-offset:2px}
.gs-tint__note{margin-top:1rem;color:var(--muted);font-size:.92rem}

.gs-gallery{display:grid;gap:.75rem;margin-top:3.5rem;grid-template-columns:repeat(2,minmax(0,1fr))}
@media (min-width:860px){.gs-gallery{grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:15rem}.gs-gallery>:first-child{grid-column:span 2;grid-row:span 2}}
.gs-gallery .b-photo{border-radius:14px;aspect-ratio:1;isolation:isolate}
@media (min-width:860px){.gs-gallery .b-photo{aspect-ratio:auto}}
.gs-gallery .b-photo img{filter:saturate(.85) contrast(1.1) brightness(.9);transition:transform 1.2s var(--ease),filter .6s}
.gs-gallery .b-photo:hover img{transform:scale(1.04);filter:saturate(1) contrast(1.05)}
.gs-gallery .b-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 40%,rgb(255 255 255 / .14) 50%,transparent 60%);transform:translateX(-80%);transition:transform 1.2s var(--ease);pointer-events:none}
.gs-gallery .b-photo:hover::after{transform:translateX(80%)}
.gs-swatch{border-radius:14px;min-height:10rem;aspect-ratio:1;display:flex;align-items:flex-end;padding:1rem;box-shadow:inset 0 1px 0 rgb(255 255 255 / .2)}
@media (min-width:860px){.gs-swatch{aspect-ratio:auto}}
.gs-swatch span{padding:.35rem .75rem;border-radius:999px;background:rgb(0 0 0 / .55);color:#fff;font-size:.85rem}
.gs-gallery-note{margin-top:1.25rem;color:var(--muted);font-size:.95rem}

.b-themes{display:grid;gap:0;margin-top:3rem}
.b-themes li{padding:1.5rem 0;border-top:1px solid var(--line);font-family:var(--display);font-weight:400;font-size:clamp(1.3rem,2.8vw,2.1rem);line-height:1.25;letter-spacing:-.01em}
.b-themes li:last-child{border-bottom:1px solid var(--line)}
.b-themes__note{margin-top:1rem;color:var(--muted);font-size:.95rem}

.steps{display:grid;gap:1rem;margin-top:3.5rem;counter-reset:st}
@media (min-width:860px){.steps{grid-template-columns:repeat(auto-fit,minmax(0,1fr))}}
.steps li{padding:1.5rem;border-radius:var(--radius);border:1px solid var(--line);background:linear-gradient(180deg,rgb(255 255 255 / .03),transparent)}
.step-n{display:block;font-family:var(--display);font-weight:500;font-size:.8rem;letter-spacing:.3em;color:var(--primary);margin-bottom:2.5rem}
.steps h3{font-family:var(--display);font-weight:500;font-size:1.15rem;line-height:1.25}
.steps p{margin-top:.5rem;color:var(--muted)}

.gs-req{display:grid;gap:2.5rem}
@media (min-width:1000px){.gs-req{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:4.5rem}.gs-req__side{position:sticky;top:6.5rem;align-self:start}}
.gs-req .gs-glass{padding:clamp(1.25rem,3.5vw,2.5rem)}
.gs-picked{display:inline-flex;align-items:center;gap:.75rem;margin-top:2rem;padding:.6rem 1.1rem .6rem .6rem;border:1px solid var(--line);border-radius:999px}
.gs-picked i{width:2.2rem;height:2.2rem;border-radius:50%;flex:none}
.gs-picked small{display:block;color:var(--muted);font-size:.8rem;line-height:1.2}
.gs-picked b{font-weight:500}
.f-label,.f-field legend{font-weight:500;color:var(--ink)}
.f-input{border-width:1px;border-radius:12px;color:var(--ink)}
.f-input:focus{border-color:var(--primary);outline:none;box-shadow:0 0 0 3px color-mix(in oklab,var(--primary) 30%,transparent)}
select.f-input option{background:var(--surface);color:var(--ink)}
.f-chip>span{border-width:1px}
.f-chip input:checked+span{background:var(--primary);color:var(--on-primary);border-color:var(--primary)}
.f-drop{border-width:1px;border-radius:14px}
.f-submit{min-height:3.4rem;border-radius:999px;background:var(--primary);color:var(--on-primary);font-weight:500}
.f-status{border-width:1px;border-radius:12px}

.gs-visit{display:grid;gap:2.5rem}
@media (min-width:920px){.gs-visit{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:5rem}}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:8rem 1fr;gap:1rem;padding:1.1rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:1px solid var(--line)}
.facts dt{color:var(--muted)}
.facts dd{margin:0}
.b-visit__pending{display:grid;gap:.4rem;margin-top:1.25rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.5rem;min-height:3rem;margin-top:1rem;color:var(--primary)}
.faq details{border-color:var(--line)}
.faq summary{font-family:var(--display);font-weight:400;font-size:clamp(1.02rem,1.8vw,1.2rem);letter-spacing:.01em}

.gs-close{position:relative;overflow:hidden;text-align:center;padding:clamp(6rem,14vw,11rem) 0;background:radial-gradient(70% 90% at 50% 120%,color-mix(in oklab,var(--primary) 22%,transparent),transparent 70%),var(--bg)}
.gs-close .gs-h2{max-width:18ch;margin-inline:auto}
.gs-close__tel{display:inline-block;margin-top:1.75rem;font-family:var(--display);font-weight:500;font-size:clamp(1.8rem,5vw,3.2rem);letter-spacing:.02em;text-decoration:none}
.gs-close__tel:hover{color:var(--primary)}
.gs-close .gs-ctas{justify-content:center}

.b-ft{border-top:1px solid var(--line);padding:3.5rem 0 2.5rem}
.b-ft__name{font-family:var(--display);font-weight:500;font-size:clamp(1.3rem,3vw,1.9rem);letter-spacing:.1em;text-transform:uppercase;line-height:1.2}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;color:var(--muted)}
.b-ft__row a{color:var(--ink)}
.legal{margin-top:1.5rem;font-size:.85rem;color:var(--muted)}
.stock-credits{margin-top:.5rem}
.b-float{background:var(--primary);color:var(--on-primary);font-weight:500}
.callbar--split{border:1px solid var(--glass-line);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
.callbar--split .cb-book{background:var(--primary);color:var(--on-primary)}
`;

// A generic coupe in profile: no badges, no maker cues. The strip light is a
// gradient band clipped to the body that sweeps across it on load and again
// every few seconds.
function carSvg(ctx) {
  const clip = uid(ctx, "gs-clip");
  const sweep = uid(ctx, "gs-sw");
  const fade = uid(ctx, "gs-fade");
  const mask = uid(ctx, "gs-mask");
  const body = "M58 196 C56 176 70 164 104 158 L236 146 C288 110 346 86 432 82 C522 80 590 102 652 138 L736 150 C766 155 782 170 782 190 L782 204 L716 204 A60 60 0 0 0 596 204 L266 204 A60 60 0 0 0 146 204 L58 204 Z";
  const glass = "M276 144 C316 114 360 96 432 94 C504 93 556 110 604 138 L446 142 L446 96 L438 96 L438 142 Z";
  const car = `<path class="gs-car__body" d="${body}"/><path class="gs-car__glass" d="${glass}"/><path class="gs-car__line" d="M104 170 C300 156 520 150 748 162"/><path class="gs-car__line" d="M438 146 L436 200 M606 150 L610 196"/><path class="gs-car__line" d="M600 140 l22 -4 l4 10 l-24 2z"/><g><circle cx="206" cy="204" r="50" fill="#050506"/><circle class="gs-car__rim" cx="206" cy="204" r="34"/><circle class="gs-car__rim" cx="206" cy="204" r="8"/><circle cx="656" cy="204" r="50" fill="#050506"/><circle class="gs-car__rim" cx="656" cy="204" r="34"/><circle class="gs-car__rim" cx="656" cy="204" r="8"/></g>`;
  return `<div class="gs-car" aria-hidden="true"><svg viewBox="0 0 840 330" focusable="false"><defs>
<linearGradient id="gs-paint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:color-mix(in oklab,var(--paint) 82%,#fff)"/><stop offset=".42" style="stop-color:var(--paint)"/><stop offset="1" style="stop-color:var(--paint-deep)"/></linearGradient>
<linearGradient id="${sweep}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="${clip}"><path d="${body}"/></clipPath>
<linearGradient id="${fade}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="${mask}"><rect x="0" y="254" width="840" height="120" fill="url(#${fade})"/></mask></defs>
<ellipse cx="430" cy="256" rx="400" ry="16" fill="#000" opacity=".8"/>
<g class="gs-floor" mask="url(#${mask})"><g transform="translate(0 508) scale(1 -1)">${car}</g></g>
${car}
<path class="gs-car__edge" style="--len:1500" d="M104 158 L236 146 C288 110 346 86 432 82 C522 80 590 102 652 138 L736 150"/>
<g clip-path="url(#${clip})"><rect class="gs-sweep" x="0" y="60" width="150" height="160" fill="url(#${sweep})" opacity=".55" transform="translate(-340 0)"/></g>
</svg></div>`;
}

// The tint preview: the same car's side glass, darkened by the chosen shade.
function tintSvg(ctx) {
  const glass = "M160 150 C220 96 300 62 420 58 C540 56 620 84 700 138 L438 146 L438 64 L424 64 L424 146 Z";
  return `<svg class="gs-tint__svg" viewBox="0 0 860 220" aria-hidden="true" focusable="false"><path d="M40 210 C40 180 70 162 120 156 C200 90 300 44 430 40 C560 38 650 76 740 140 C790 150 820 172 820 200 L820 210 Z" fill="url(#gs-paint)"/><path d="${glass}" fill="#d8e2ec" opacity=".85"/><g fill="#3a4148" opacity=".9"><rect x="300" y="96" width="46" height="60" rx="14"/><rect x="560" y="100" width="40" height="52" rx="12"/><circle cx="250" cy="150" r="30" fill="none" stroke="#3a4148" stroke-width="8"/></g><path class="gs-tint__film" d="${glass}"/><path d="${glass}" fill="none" stroke="rgb(255 255 255 / .3)" stroke-width="2"/><path d="M190 128 C300 80 420 70 560 78" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/></svg>`;
}

// Only photos of this trade's own work: a detailer's grid shows polish and
// interiors, not a stripped body shell or an engine rebuild.
function galleryFit(ctx) {
  if (ctx.categoryKey === "auto-detailing") return (p) => /polish|wipe|interior|finish|microfiber/.test(p.id);
  if (ctx.categoryKey === "auto-body-collision") return (p) => p.group === "collision";
  return null;
}

function withFormId(ctx, id) {
  return ctx.form.replace("<form class=\"req-form\"", `<form id="${id}" class="req-form"`);
}

function nameLen(ctx) {
  const words = ctx.nameRaw.trim().split(/\s+/).filter(Boolean);
  const longest = words.reduce((m, w) => Math.max(m, w.length), 1);
  const len = ctx.nameRaw.length;
  // Long names run on two lines, so size them by half the length.
  return Math.max(longest, len > 14 ? Math.ceil(len / 2) + 1 : len, 6);
}

function render(ctx) {
  const t = ctx.t;
  const photoHero = ctx.variants.hero === "photo";
  const formId = "gs-form";
  const form = formHeading(ctx);
  const extra = [];
  const book = (cls = "gs-btn gs-btn--solid", label = null) => `<a class="${cls}" href="#${REQUEST_ID}"><span>${label ? t(label[0], label[1]) : ctx.copyOr("ctaPrimary", ctx.formCopy.cta)}</span>${icon("arrow")}</a>`;
  const call = callButton(ctx, { cls: "gs-btn gs-btn--glass", label: ["Call", "Llamar"] });

  const nav = [
    ctx.services.length ? { href: "#services", label: ["Services", "Servicios"] } : null,
    { href: "#choose", label: (CHOOSERS[ctx.categoryKey] || CHOOSERS["auto-detailing"]).nav },
    { href: "#visit", label: ["Visit", "Visita"] },
  ].filter(Boolean);
  const header = siteHeader(ctx, { nav, cta: shortCta(ctx) });

  const heroShot = photoHero ? ctx.photos.hero() : null;
  const kicker = `<p class="gs-kicker gs-wide"><span>${ctx.categoryT}</span><span>${esc(ctx.placeRaw)}</span></p>`;
  const copy = `${kicker}<h1 class="gs-name" style="--nl:${nameLen(ctx)}">${ctx.name}</h1><p class="gs-promise">${ctx.copyOr("headline", ctx.promise)}</p>${ctx.about ? `<p class="gs-about">${ctx.about}</p>` : ""}<div class="gs-ctas">${book()}${call}</div>`;
  const hero = heroShot
    ? `<section class="gs-hero gs-hero--photo" id="top"><div class="gs-hero__photo">${photoFrame(ctx, heroShot, { hero: true, sizes: "100vw", tag: true })}</div><div class="gs-streak" aria-hidden="true"></div><div class="wrap gs-hero__in">${copy}</div></section>`
    : `<section class="gs-hero gs-hero--profile" id="top"><div class="wrap gs-hero__in">${copy}</div>${carSvg(ctx)}</section>`;
  // Without a photo the car still needs the paint gradient defined once.
  const paintDefs = heroShot ? `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="gs-paint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:color-mix(in oklab,var(--paint) 82%,#fff)"/><stop offset=".42" style="stop-color:var(--paint)"/><stop offset="1" style="stop-color:var(--paint-deep)"/></linearGradient></defs></svg>` : "";

  const glassProof = ctx.variants.proof !== "line";
  const proof = `<div class="gs-proof${glassProof ? "" : " gs-proof--line"}"><div class="wrap"><div class="gs-glass">${ratingProof(ctx, "strip")}<p class="gs-proof__line">${t(`Real ratings from Google, left by customers in ${ctx.cityRaw || "the area"}.`, `Calificaciones reales de Google, de clientes en ${ctx.cityRaw || "la zona"}.`)}</p></div></div></div>`;

  // Services: the first four as big tiles, the rest as quiet chips.
  const list = ctx.services;
  const top = list.slice(0, 4);
  const rest = list.slice(4);
  const tiles = top.map((s, i) => `<a class="gs-tile rv" href="#${REQUEST_ID}"><span class="gs-tile__n gs-wide">${String(i + 1).padStart(2, "0")}</span><span><span class="gs-tile__name">${esc(s)}</span><span class="gs-tile__go">${t("Ask about this", "Preguntar")}${icon("arrow")}</span></span></a>`).join("");
  const services = list.length
    ? `<section class="gs-sec gs-svc--${ctx.variants.services === "list" ? "list" : "tiles"}" id="services"><div class="wrap"><div class="gs-head"><h2 class="gs-h2">${t("The", "El")} <em>${t("work", "trabajo")}</em></h2><p class="gs-lede">${t("Pick what the car needs and ask about it. Every job starts with a look at the paint in person.", "Elija lo que necesita el carro y pregunte. Cada trabajo empieza revisando la pintura en persona.")}</p></div><div class="gs-tiles">${tiles}</div>${rest.length ? `<ul class="gs-more">${rest.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}<p class="b-svc-confirm">${t("Services and pricing to confirm with the owner.", "Servicios y precios por confirmar con el dueño.")}</p>${servicesNote(ctx)}</div></section>`
    : "";

  // The chooser.
  const chooser = CHOOSERS[ctx.categoryKey] || CHOOSERS["auto-detailing"];
  const cid = uid(ctx, "gs-f");
  const opts = chooser.options.map((o, i) => {
    const id = `${cid}-${o.key}`;
    extra.push(`html:has(#${id}:checked) .gs-preview__face--${o.key}{opacity:1}`, `html:has(#${id}:checked) .gs-o-${cid}-${o.key}{display:inline}`);
    return `<label class="gs-opt"><input type="radio" name="finish" value="${o.key}" id="${id}" form="${formId}"${i === 0 ? " checked" : ""}><span class="gs-opt__sw" style="background:${FINISHES[o.key]}" aria-hidden="true"></span><span class="gs-opt__txt"><b>${t(o.label[0], o.label[1])}</b><small>${t(o.note[0], o.note[1])}</small></span></label>`;
  }).join("");
  const shows = (tag) => chooser.options.map((o, i) => `<${tag} class="gs-o gs-o-${cid}-${o.key}${i === 0 ? " gs-o--def" : ""}"${ctx.i18n.ti(o.label[0], o.label[1])}>${esc(o.label[0])}</${tag}>`).join("");
  const faces = chooser.options.map((o, i) => `<span class="gs-preview__face gs-preview__face--${o.key}${i === 0 ? " gs-preview__face--def" : ""}" style="background:${FINISHES[o.key]}"></span>`).join("");

  // The tint shade preview, only for studios whose services include tint.
  let tint = "";
  if (ctx.services.some((s) => /tint|polarizad/i.test(s))) {
    const tid = uid(ctx, "gs-t");
    const steps = TINT.map((s, i) => {
      const id = `${tid}-${s.key}`;
      extra.push(`html:has(#${id}:checked) .gs-tint__film{--tint:${s.dark}}`);
      return `<label class="gs-step"><input type="radio" name="tint" value="${s.key}" id="${id}" form="${formId}"${i === 0 ? " checked" : ""}><span><b>${s.key}%</b><small>${t(s.label[0], s.label[1])}</small></span></label>`;
    }).join("");
    tint = `<div class="gs-tint gs-glass"><div>${tintSvg(ctx)}</div><div><h3 class="gs-h2" style="font-size:clamp(1.5rem,3vw,2.2rem)">${t("Preview a", "Vea un")} <em>${t("shade", "tono")}</em></h3><fieldset class="gs-steps"><legend>${t("Share of light the film lets through", "Luz que deja pasar la película")}</legend><div class="gs-track">${steps}</div></fieldset><p class="gs-tint__note">${t("A rough preview only. Tint limits differ by state and by window, so ask the studio what fits your car.", "Solo una vista aproximada. Los límites de polarizado cambian por estado y por ventana; pregunte al estudio qué le queda a su carro.")}</p></div></div>`;
  }

  const choose = `<section class="gs-sec gs-sec--surface" id="choose"><div class="wrap"><div class="gs-head"><h2 class="gs-h2">${t(chooser.title[0], chooser.title[1])} <em>${t(chooser.em[0], chooser.em[1])}</em></h2><p class="gs-lede">${t(chooser.lede[0], chooser.lede[1])}</p></div><div class="gs-choose"><div class="gs-preview" aria-hidden="true">${faces}<span class="gs-preview__cap">${shows("span")}</span></div><fieldset class="gs-opts"><legend>${t(chooser.legend[0], chooser.legend[1])}</legend>${opts}</fieldset></div>${tint}</div></section>`;

  // Gallery: photos when the library has them, else painted swatches.
  const shots = ctx.photos.many(5, galleryFit(ctx));
  const swatchNames = [["Deep gloss", "Brillo profundo"], ["Metallic", "Metálico"], ["Pearl", "Perla"], ["Satin", "Satinado"], ["Beading", "Efecto perla de agua"]];
  const swatchKeys = ["gloss", "metallic", "pearl", "satin", "clean"];
  const tilesG = shots.length
    ? shots.map((p, i) => photoFrame(ctx, p, { cls: "rv", sizes: i === 0 ? "(min-width: 860px) 50vw, 50vw" : "(min-width: 860px) 25vw, 50vw", width: i === 0 ? 1200 : 800, tag: true })).join("")
    : swatchKeys.map((k, i) => `<div class="gs-swatch rv" style="background:${FINISHES[k]}"><span>${t(swatchNames[i][0], swatchNames[i][1])}</span></div>`).join("");
  const gallery = `<section class="gs-sec" id="work"><div class="wrap"><div class="gs-head"><h2 class="gs-h2">${t("Under the", "Bajo la")} <em>${t("lights", "luz")}</em></h2><p class="gs-lede">${shots.length ? t("Stock photos stand in here. The studio's own before and after shots go in this grid.", "Aquí van fotos de archivo. En esta cuadrícula van las fotos de antes y después del estudio.") : t("Finish studies. The studio's own before and after shots go in this grid.", "Estudios de acabado. En esta cuadrícula van las fotos de antes y después del estudio.")}</p></div><div class="gs-gallery">${tilesG}</div></div></section>`;

  const themes = ctx.themes.length
    ? `<section class="gs-sec gs-sec--surface"><div class="wrap"><h2 class="gs-h2">${t("What customers", "Lo que notan")} <em>${t("notice", "los clientes")}</em></h2>${themesBlock(ctx)}</div></section>`
    : "";

  const how = `<section class="gs-sec"><div class="wrap"><h2 class="gs-h2">${t("How it", "Cómo")} <em>${t("goes", "funciona")}</em></h2>${stepsBlock(ctx)}</div></section>`;

  const picked = `<p class="gs-picked" aria-live="polite"><i style="background:${FINISHES[chooser.options[0].key]}" aria-hidden="true"></i><span><small>${t(chooser.legend[0], chooser.legend[1])}</small><b>${shows("span")}</b></span></p>`;
  const request = `<section class="gs-sec gs-sec--surface" id="${REQUEST_ID}"><div class="wrap gs-req"><div class="gs-req__side"><h2 class="gs-h2">${form.title}</h2><p class="gs-lede">${form.intro}</p>${picked}</div><div class="gs-glass">${withFormId(ctx, formId)}</div></div></section>`;

  const visit = `<section class="gs-sec" id="visit"><div class="wrap gs-visit"><div><h2 class="gs-h2">${t("Hours and", "Horario y")} <em>${t("area", "zona")}</em></h2><p class="gs-lede">${t("Drop off and mobile options to confirm with the studio.", "Opciones de entrega y a domicilio por confirmar con el estudio.")}</p></div>${visitDetails(ctx)}</div></section>`;

  const faq = `<section class="gs-sec gs-sec--surface" id="faq"><div class="wrap gs-visit"><h2 class="gs-h2">${t("Good", "Buenas")} <em>${t("questions", "preguntas")}</em></h2>${faqBlock(ctx)}</div></section>`;

  const close = `<section class="gs-close"><div class="wrap"><h2 class="gs-h2">${t("Bring it in", "Tráigalo")} <em>${t("under the lights", "bajo la luz")}</em></h2>${ctx.tel ? `<a class="gs-close__tel" href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}<div class="gs-ctas">${book()}</div></div></section>`;

  return {
    css: `${CSS}\n${extra.join("\n")}`,
    body: `${header}${paintDefs}<main>${hero}${proof}${services}${choose}${gallery}${themes}${how}${request}${visit}${faq}${close}</main>${siteFooter(ctx)}${floatingBook(ctx, { label: shortCta(ctx) })}`,
  };
}

export const direction = {
  key: "auto-gloss-studio",
  label: "Gloss studio",
  status: "implemented",
  suits: ["auto-detailing", "auto-body-collision", "mobile-mechanic"],
  keywords: ["premium", "dark", "high-impact", "high impact", "gloss", "ceramic", "bold", "detail"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;700&family=Onest:wght@400;500&display=swap",
  palettes: PALETTES,
  variants: { hero: ["profile", "photo"], services: ["tiles", "list"], proof: ["glass", "line"] },
  imagery: { photos: true, people: ["none", "hands"], heroPrefer: /polish|finish|wipe|booth|spray|engine-bay/ },
  callbar: "split",
  callbarBook: ["Request", "Solicitar"],
  render,
};
