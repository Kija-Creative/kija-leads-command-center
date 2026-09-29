// European specialist atelier (research/design-auto.md, direction 2): quiet
// expertise, the opposite of a coupon page. A near black or ivory field, the
// name in light wide tracked capitals, one serif italic word per heading, mono
// data labels, hairline rules and a visible column grid at section breaks.
// Services read as a numbered spec sheet. Photos are low key 21:9 plates
// pushed toward monochrome so the accent is the only color; without photos a
// hairline coupe sits under a slow spotlight.
//
// The brief named Instrument Sans, Instrument Serif and IBM Plex Mono, which
// the design skill lists as overused defaults, so this uses Encode Sans (its
// width axis gives the wide tracked caps), Bodoni Moda italic for the accent
// word and Azeret Mono for data.

import {
  bookButton,
  callButton,
  directionsLink,
  faqBlock,
  formHeading,
  heroPhoto,
  photoFrame,
  promiseLine,
  ratingProof,
  REQUEST_ID,
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
  { key: "atelier-graphite", name: "Graphite and brass", vars: { bg: "#111214", surface: "#1c1d20", ink: "#e9e6df", muted: "#a8a49c", line: "#2e3034", primary: "#b08d57", "on-primary": "#111214", accent: "#c7a56e", stage: "#0b0c0d", field: "#161719", spot: "rgb(214 186 138 / .20)", scheme: "dark" } },
  { key: "atelier-ivory", name: "Ivory and racing red", vars: { bg: "#f3f2ee", surface: "#ffffff", ink: "#16161a", muted: "#5c5a55", line: "#d9d6ce", primary: "#b3261e", "on-primary": "#ffffff", accent: "#b3261e", stage: "#e9e7e1", field: "#ffffff", spot: "rgb(179 38 30 / .10)", scheme: "light" } },
  { key: "atelier-petrol", name: "Slate and petrol", vars: { bg: "#0f1a1f", surface: "#16252c", ink: "#e8edee", muted: "#9eafb3", line: "#24363e", primary: "#c9a96e", "on-primary": "#0f1a1f", accent: "#58b3ba", stage: "#0a1317", field: "#122026", spot: "rgb(47 127 134 / .32)", scheme: "dark" } },
];

// The hero sentence with its single serif italic word, by request kind.
const PROMISE = {
  "repair-estimate": [["Tell us what you", "Cuéntenos lo que"], ["noticed", "notó"], [". We will tell you what it needs.", ". Le diremos qué necesita."]],
  "photo-estimate": [["Send a few photos of the paint. Get a", "Mande unas fotos de la pintura. Reciba una opinión"], ["straight", "clara"], [" read on the finish.", " del acabado."]],
};

// A generic coupe in one hairline, no maker's shape or badge.
const COUPE = `<svg class="ea-coupe" viewBox="0 0 1000 300" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
<ellipse class="ea-coupe__shadow" cx="512" cy="262" rx="440" ry="9" fill="currentColor" stroke="none"/>
<path d="M90 222C92 200 108 190 140 186L290 172C350 128 430 104 520 100H600C680 104 740 140 790 170L880 184C915 190 930 204 932 222V232C932 237 927 240 920 240H860A58 58 0 0 0 744 240H322A58 58 0 0 0 206 240H100C94 240 90 236 90 230Z"/>
<path d="M332 170C382 134 442 116 520 113H592C650 116 700 140 742 168Z"/><path d="M560 113V170"/>
<path d="M150 198C400 182 700 182 902 198" opacity=".55"/><path d="M560 172V232" opacity=".55"/>
<path d="M880 192L920 202M96 208L128 202" opacity=".8"/>
<circle cx="264" cy="240" r="49"/><circle cx="264" cy="240" r="33"/><circle cx="264" cy="240" r="5"/>
<circle cx="802" cy="240" r="49"/><circle cx="802" cy="240" r="33"/><circle cx="802" cy="240" r="5"/>
<path d="M264 207V221M264 259V273M231 240H245M283 240H297M802 207V221M802 259V273M769 240H783M821 240H835" opacity=".6"/>
</svg>`;

const CSS = `
:root{--display:"Encode Sans",system-ui,sans-serif;--body:"Encode Sans",system-ui,sans-serif;--serif:"Bodoni Moda",Georgia,serif;--mono:"Azeret Mono",ui-monospace,monospace;--radius:0px;--btn-radius:0px;--max:1240px;--ease:cubic-bezier(.16,1,.3,1);--field-line:color-mix(in oklab,var(--ink) 28%,transparent);--lang-fg:var(--ink);--lang-on:var(--bg);color-scheme:var(--scheme)}
body{font-weight:400;font-size:1.0625rem;line-height:1.7;font-stretch:100%}

.ea-mono{font-family:var(--mono);font-size:.78rem;letter-spacing:.08em;text-transform:uppercase}
.ea-h2{font-family:var(--display);font-weight:300;font-stretch:118%;font-size:clamp(2.1rem,4.6vw,3.6rem);line-height:1.05;letter-spacing:-.005em}
.ea-h2 em,.ea-promise em{font-family:var(--serif);font-style:italic;font-weight:400;font-stretch:100%;letter-spacing:0;color:var(--accent)}

.b-hd{position:sticky;top:0;z-index:10;background:color-mix(in oklab,var(--bg) 92%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.b-hd__in{display:flex;align-items:center;gap:2rem;min-height:4.5rem}
.b-brand{margin-right:auto;font-weight:500;font-stretch:125%;font-size:.9rem;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60vw}
.b-nav{display:none;gap:2rem;font-family:var(--mono);font-size:.75rem;letter-spacing:.1em;text-transform:uppercase}
.b-nav a{text-decoration:none;color:var(--muted);transition:color .3s}
.b-nav a:hover{color:var(--ink)}
@media (min-width:1020px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:1.25rem}
.b-hd__tel{display:none;align-items:center;gap:.45rem;font-family:var(--mono);font-size:.85rem;text-decoration:none;font-variant-numeric:tabular-nums}
@media (min-width:760px){.b-hd__tel{display:inline-flex}}
.b-hd__tel .ico{display:none}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.6rem;padding:.5rem 1.1rem;border:1px solid var(--ink);font-family:var(--mono);font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;transition:background-color .4s var(--ease),color .4s var(--ease)}
.b-hd__cta:hover{background:var(--ink);color:var(--bg)}

.ea-grid{height:3rem;background:repeating-linear-gradient(90deg,var(--line) 0 1px,transparent 1px calc(100% / 12));border-inline:1px solid var(--line);border-inline-start:0}
.ea-grid--flip{transform:scaleY(-1)}

.ea-hero{position:relative;padding-top:clamp(3rem,8vw,6.5rem);overflow:hidden}
.ea-kicker{color:var(--muted)}
.ea-name{margin-top:1.5rem;font-weight:300;font-stretch:125%;text-transform:uppercase;letter-spacing:.045em;line-height:1;font-size:var(--nsize);overflow-wrap:break-word;animation:kj-fade .9s var(--ease) both}
.name--xl{--nsize:clamp(2.4rem,7.2vw,6rem)}
.name--l{--nsize:clamp(2.1rem,5.8vw,5rem)}
.name--m{--nsize:clamp(1.9rem,4.8vw,4rem)}
.name--s{--nsize:clamp(1.65rem,3.8vw,3.1rem)}
.ea-hero__row{display:grid;gap:2rem;margin-top:clamp(1.75rem,4vw,3rem);align-items:end}
@media (min-width:900px){.ea-hero__row{grid-template-columns:minmax(0,1fr) auto;gap:4rem}}
.ea-promise{max-width:34ch;font-weight:300;font-stretch:108%;font-size:clamp(1.3rem,2.3vw,1.75rem);line-height:1.35;animation:kj-fade .9s .15s var(--ease) both}
.ea-about{margin-top:1rem;max-width:56ch;color:var(--muted)}
.ea-ctas{display:flex;flex-wrap:wrap;align-items:center;gap:1.5rem}
.ea-btn{display:inline-flex;align-items:center;gap:.8rem;min-height:3.25rem;padding:.8rem 1.5rem;border:1px solid var(--ink);font-family:var(--mono);font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;transition:background-color .5s var(--ease),color .5s var(--ease),border-color .5s}
.ea-btn:hover{background:var(--primary);border-color:var(--primary);color:var(--on-primary)}
.ea-btn .b-arrow{display:inline-flex;transition:transform .5s var(--ease)}
.ea-btn:hover .b-arrow{transform:translateX(4px)}
.ea-tel{display:inline-flex;align-items:center;gap:.5rem;font-family:var(--mono);font-size:.95rem;text-decoration:none;font-variant-numeric:tabular-nums;border-bottom:1px solid var(--line);padding-bottom:.15rem;transition:border-color .4s}
.ea-tel:hover{border-color:var(--ink)}
.ea-tel .ico{width:1rem;height:1rem;color:var(--accent)}

.ea-stage{position:relative;margin-top:clamp(2.5rem,6vw,4.5rem);background:var(--stage);border-block:1px solid var(--line);overflow:hidden}
.ea-stage__in{position:relative;display:grid;place-items:center;aspect-ratio:21/9;max-height:28rem;width:100%}
@media (max-width:699.98px){.ea-stage__in{aspect-ratio:16/10}}
.ea-stage__spot{position:absolute;inset:-20% -10%;background:radial-gradient(ellipse 38% 55% at 50% 58%,var(--spot),transparent 70%);animation:ea-spot 14s ease-in-out infinite alternate}
@keyframes ea-spot{from{transform:translateX(-14%)}to{transform:translateX(14%)}}
.ea-stage__lines{position:absolute;inset:0;background:repeating-linear-gradient(90deg,color-mix(in oklab,var(--line) 70%,transparent) 0 1px,transparent 1px calc(100% / 12));opacity:.7}
.ea-coupe{position:relative;width:min(86%,62rem);height:auto;color:var(--ink);opacity:.92;stroke-dasharray:4200;animation:kj-draw 3.2s .3s var(--ease) both;--len:4200}
.ea-coupe__shadow{opacity:.12}
.ea-stage__cap{position:absolute;left:max(1rem,calc((100% - var(--max)) / 2));bottom:1rem;color:var(--muted)}
.ea-plate{position:relative;margin:0}
.ea-plate .b-photo{aspect-ratio:21/9;max-height:36rem;width:100%;background:var(--stage)}
@media (max-width:699.98px){.ea-plate .b-photo{aspect-ratio:16/10}}
.ea-plate img{filter:grayscale(1) contrast(1.12) brightness(.82)}
.ea-plate .b-photo::after{content:"";position:absolute;inset:0;background:var(--primary);mix-blend-mode:color;opacity:.12;pointer-events:none}
.ea-stage--plate .ea-plate .b-photo{max-height:27rem}
.ea-plate__cap{display:flex;justify-content:space-between;gap:1rem;padding:.75rem 0;color:var(--muted)}

.ea-spec{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid var(--line);margin-top:0}
@media (min-width:900px){.ea-spec{grid-template-columns:repeat(4,minmax(0,1fr))}}
.ea-spec .b-rating{display:contents}
.ea-spec .b-rating__cell,.ea-cell{display:grid;align-content:start;gap:.6rem;padding:1.5rem 1.25rem 1.75rem;border-bottom:1px solid var(--line)}
.ea-spec>*:not(:last-child),.ea-spec .b-rating__cell{border-right:1px solid var(--line)}
@media (max-width:899.98px){.ea-spec .b-rating__cell+.b-rating__cell,.ea-spec .ea-cell:last-child{border-right:0}}
.ea-spec .b-rating__lbl,.ea-cell__lbl{order:-1;font-family:var(--mono);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.ea-spec .b-rating__num,.ea-spec .b-rating__big{font-family:var(--mono);font-weight:400;font-size:clamp(2rem,4vw,2.9rem);line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.ea-spec .stars{width:5.5rem;height:1.1rem;color:var(--accent)}
.ea-cell__val{font-weight:400;font-stretch:108%;line-height:1.35}
.ea-cell__val.ea-soft{color:var(--muted)}

.ea-sec{padding:clamp(5rem,11vw,10rem) 0}
.ea-sec--alt{background:var(--surface)}
.ea-head{display:grid;gap:1.25rem}
@media (min-width:900px){.ea-head{grid-template-columns:minmax(0,1fr) minmax(0,26rem);align-items:end;gap:4rem}}
.ea-dek{color:var(--muted);max-width:52ch}

.b-svc{margin-top:clamp(2.5rem,5vw,4rem);border-top:1px solid var(--line);display:grid}
@media (min-width:900px){.ea-svc--grid .b-svc{grid-template-columns:1fr 1fr;column-gap:4rem;border-top:0}.ea-svc--grid .b-svc__item:nth-child(-n+2){border-top:1px solid var(--line)}}
.b-svc__item{display:grid;grid-template-columns:3.5rem minmax(0,1fr) auto;align-items:baseline;gap:1rem;padding:1.6rem 0;border-bottom:1px solid var(--line);transition:padding-left .6s var(--ease)}
.b-svc__item:hover{padding-left:.75rem}
.b-svc__n{font-family:var(--mono);font-size:.8rem;color:var(--accent)}
.b-svc__name{font-weight:300;font-stretch:112%;font-size:clamp(1.3rem,2.4vw,1.85rem);line-height:1.2}
.b-svc__dots{display:none}
.b-svc__tail{font-family:var(--mono);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);text-decoration:none;white-space:nowrap;transition:color .4s}
.b-svc__item:hover .b-svc__tail{color:var(--ink)}
.b-svc-confirm{margin-top:1.75rem;font-family:var(--mono);font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.svc-note{margin-top:.5rem;color:var(--muted);font-size:.9rem}

.ea-approach .b-themes{display:grid;margin-top:clamp(2.5rem,5vw,4rem)}
.ea-approach .b-themes li{display:grid;grid-template-columns:3.5rem 1fr;gap:1rem;padding:clamp(1.5rem,3vw,2.25rem) 0;border-top:1px solid var(--line);font-weight:300;font-stretch:112%;font-size:clamp(1.6rem,3.6vw,2.8rem);line-height:1.15;letter-spacing:-.005em}
.ea-approach .b-themes li::before{content:"";width:1.75rem;height:1px;margin-top:.62em;background:var(--accent)}
.ea-approach .b-themes li:last-child{border-bottom:1px solid var(--line)}
.b-themes__note{margin-top:1.5rem;font-family:var(--mono);font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}

.ea-line{position:relative;display:grid;gap:2.5rem;margin-top:clamp(3rem,6vw,4.5rem)}
@media (min-width:860px){.ea-line{grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:2.5rem}.ea-line::before{content:"";position:absolute;left:0;right:0;top:.35rem;border-top:1px solid var(--line)}}
.ea-line li{position:relative;display:grid;align-content:start;gap:.75rem;padding-left:1.75rem}
@media (min-width:860px){.ea-line li{padding:2rem 0 0}}
.ea-line li::before{content:"";position:absolute;left:0;top:.35rem;width:.7rem;height:.7rem;margin-top:-.3rem;border-radius:50%;background:var(--bg);border:1px solid var(--accent)}
@media (max-width:859.98px){.ea-line{border-left:1px solid var(--line);margin-left:.3rem}.ea-line li{padding-left:1.75rem}.ea-line li::before{left:-.38rem;top:.55rem}}
.ea-line .ea-mono{color:var(--accent)}
.ea-line h3{font-weight:400;font-stretch:112%;font-size:1.35rem;line-height:1.2}
.ea-line p{color:var(--muted);max-width:34ch}

.ea-req{display:grid;gap:3rem}
@media (min-width:980px){.ea-req{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:6rem}.ea-req__side{position:sticky;top:7rem;align-self:start}}
.ea-req__side .b-rating{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1rem;margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid var(--line)}
.ea-req__side .b-rating__num{font-family:var(--mono);font-size:1.6rem;line-height:1}
.ea-req__side .b-rating__side{display:flex;align-items:center;gap:.75rem}
.ea-req__side .stars{width:5.25rem;height:1.05rem;color:var(--accent)}
.ea-req__side .b-rating__count{font-family:var(--mono);font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.ea-req__side .ea-tel{margin-top:1.75rem}
.ea-form{padding:clamp(1.5rem,4vw,3rem);background:var(--field);border:1px solid var(--line)}
.ea-form__top{display:flex;justify-content:space-between;gap:1rem;margin-bottom:2rem;padding-bottom:1rem;border-bottom:1px solid var(--line);color:var(--muted)}
.f-label,.f-field legend{font-family:var(--mono);font-weight:400;font-size:.74rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.f-input{border:0;border-bottom:1px solid var(--field-line);border-radius:0;background:transparent;padding:.75rem 0;min-height:2.9rem}
.f-input:focus{border-bottom-color:var(--accent);outline:none}
.f-input:focus-visible{outline:none;box-shadow:0 1px 0 0 var(--accent)}
select.f-input{padding-right:2rem;background-position:calc(100% - .6rem) 55%,calc(100% - .25rem) 55%}
select.f-input option{background:var(--field);color:var(--ink)}
textarea.f-input{border:1px solid var(--field-line);padding:.75rem .9rem}
.f-chip>span{border-radius:0;border-color:var(--field-line);font-size:.9rem}
.f-chip input:checked+span{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.f-drop{border-radius:0;border-width:1px}
.f-submit{border-radius:0;background:transparent;color:var(--ink);border:1px solid var(--ink);font-family:var(--mono);font-weight:400;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;min-height:3.4rem;transition:background-color .5s var(--ease),color .5s var(--ease)}
.f-submit:hover{transform:none;filter:none;background:var(--primary);border-color:var(--primary);color:var(--on-primary)}
.f-status{border-width:1px;border-radius:0;font-weight:400}

.ea-visit{display:grid;gap:3rem}
@media (min-width:900px){.ea-visit{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:6rem}}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:8rem 1fr;gap:1rem;padding:1.15rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:1px solid var(--line)}
.facts dt{font-family:var(--mono);font-size:.74rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding-top:.25rem}
.facts dd{margin:0;font-stretch:108%}
.b-visit__pending{display:grid;gap:.5rem;margin-top:1.5rem;color:var(--muted);font-size:.95rem}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.75rem;font-family:var(--mono);font-size:.78rem;letter-spacing:.08em;text-transform:uppercase}

.ea-faq .faq{margin-top:0}
.faq details{border-color:var(--line);border-top-width:1px}
.faq details:last-child{border-bottom-width:1px}
.faq summary{font-weight:300;font-stretch:112%;font-size:clamp(1.15rem,2vw,1.4rem);padding:1.5rem 0}
.faq summary .ico{color:var(--accent)}
.faq details p{color:var(--muted)}

.ea-close{padding:clamp(5rem,11vw,9rem) 0;border-top:1px solid var(--line);text-align:center}
.ea-close .ea-h2{max-width:22ch;margin-inline:auto}
.ea-close .ea-ctas{justify-content:center;margin-top:2.5rem}

.b-ft{padding:3.5rem 0 2.5rem;border-top:1px solid var(--line);background:var(--stage)}
.b-ft__name{font-weight:400;font-stretch:125%;font-size:1rem;letter-spacing:.2em;text-transform:uppercase}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;font-family:var(--mono);font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.b-ft__row a{color:var(--ink)}
.legal{margin-top:2rem;font-size:.82rem;color:var(--muted)}
.stock-credits{margin-top:.4rem;color:var(--muted)}
.callbar{border-radius:0;background:var(--primary);color:var(--on-primary);font-family:var(--mono);font-weight:500;letter-spacing:.06em}
.stock-tag{border-radius:0;font-family:var(--mono);font-weight:400;letter-spacing:.04em}
.rv{transition:opacity .9s var(--ease)}
html.js .rv[data-rv-wait]{transform:none}
@media (max-width:759.98px){.b-brand{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.1}}
`;

// "Words <em>word</em> words" with every part translatable on its own.
function withAccent(ctx, [a, b, c]) {
  return `${ctx.t(a[0], a[1])} <em>${ctx.t(b[0], b[1])}</em>${c ? ctx.t(c[0], c[1]) : ""}`;
}

function h2(ctx, parts, id = "") {
  return `<h2 class="ea-h2"${id ? ` id="${id}"` : ""}>${withAccent(ctx, parts)}</h2>`;
}

// The repair intake adds mileage under the vehicle, as a specialist asks.
function intakeForm(ctx) {
  if (ctx.kind !== "repair-estimate") return ctx.form;
  const mileage = `<div class="f-field"><label class="f-label" for="rq-mileage">${ctx.t("Mileage", "Kilometraje o millaje")}</label><input class="f-input" id="rq-mileage" name="mileage" type="text" inputmode="numeric"${ctx.i18n.placeholder("Roughly, from the dash", "Aproximado, del tablero")}></div>`;
  return ctx.form.replace(/(<input class="f-input" id="rq-vehicle"[^>]*><\/div>)/, `$1${mileage}`);
}

function plate(ctx, photo, n, { hero = false } = {}) {
  if (!photo) return "";
  const frame = photoFrame(ctx, photo, { hero, sizes: "100vw", width: 1600 });
  return `<figure class="ea-plate${hero ? "" : " rv"}">${frame.replace(/^<figure class="b-photo">([\s\S]*)<\/figure>$/, "<div class=\"b-photo\">$1</div>")}<figcaption class="wrap ea-plate__cap ea-mono"><span>${ctx.t(`Plate ${n}`, `Lámina ${n}`)}</span><span>${ctx.t("Stock photo. The shop's own work goes here.", "Foto de archivo. Aquí va el trabajo del taller.")}</span></figcaption></figure>`;
}

function render(ctx) {
  const t = ctx.t;
  const hero = ctx.variants.hero === "plate" ? "plate" : "spot";
  const svc = ctx.variants.services === "grid" ? "grid" : "sheet";
  const nav = [
    ctx.services.length ? { href: "#services", label: ["Services", "Servicios"] } : null,
    { href: "#visit-steps", label: ["The visit", "La visita"] },
    { href: "#location", label: ["Location", "Ubicación"] },
  ].filter(Boolean);
  const header = siteHeader(ctx, { nav, cta: ["Book service", "Agendar servicio"] });

  const promise = ctx.copy.headline || !PROMISE[ctx.kind] ? promiseLine(ctx) : withAccent(ctx, PROMISE[ctx.kind]);
  const tel = ctx.tel ? `<a class="ea-tel" href="${esc(ctx.tel)}">${icon("phone")}<span>${esc(ctx.phone)}</span></a>` : "";
  const book = bookButton(ctx, { cls: "ea-btn", ico: "", arrow: true });

  let visual;
  if (hero === "plate") {
    const photo = ctx.photos.hero();
    visual = photo ? `<div class="ea-stage ea-stage--plate">${plate(ctx, photo, "01", { hero: true })}</div>` : "";
  } else {
    visual = "";
  }
  if (!visual) {
    visual = `<div class="ea-stage" aria-hidden="true"><div class="ea-stage__in"><div class="ea-stage__spot"></div><div class="ea-stage__lines"></div>${COUPE}</div><p class="ea-stage__cap ea-mono">${t("Illustration", "Ilustración")}</p></div>`;
  }

  const hoursCell = ctx.hours
    ? `<div class="ea-cell"><span class="ea-cell__val">${esc(ctx.hours)}</span><span class="ea-cell__lbl">${t("Hours", "Horario")}</span></div>`
    : `<div class="ea-cell"><span class="ea-cell__val ea-soft">${t("To confirm with the shop", "Por confirmar con el taller")}</span><span class="ea-cell__lbl">${t("Opening times", "Horario de atención")}</span></div>`;
  const placeCell = `<div class="ea-cell"><span class="ea-cell__val">${esc(ctx.placeRaw)}</span><span class="ea-cell__lbl">${t("Workshop", "Taller")}</span></div>`;
  const spec = `<div class="wrap"><div class="ea-spec">${ratingProof(ctx, "numbers")}${hoursCell}${placeCell}</div></div>`;

  const heroHtml = `<section class="ea-hero ea-hero--${hero}" id="top"><div class="wrap">
<p class="ea-mono ea-kicker">${ctx.categoryT} / ${esc(ctx.placeRaw)}</p>
<h1 class="ea-name name--${ctx.nameScale}">${ctx.name}</h1>
<div class="ea-hero__row"><div><p class="ea-promise">${promise}</p>${ctx.about ? `<p class="ea-about">${ctx.about}</p>` : ""}</div><div class="ea-ctas">${book}${tel}</div></div>
</div>${visual}${spec}</section>`;

  const services = ctx.services.length
    ? `<section class="ea-sec ea-svc--${svc}" id="services"><div class="wrap"><div class="ea-head">${h2(ctx, [["The service", "La hoja de"], ["sheet", "servicio"], null])}<p class="ea-dek">${t("Choose a line to start an intake. The shop confirms scope and price before any work.", "Elija una línea para empezar la solicitud. El taller confirma alcance y precio antes de trabajar.")}</p></div>${servicesList(ctx, "menu", { tail: ["Enquire", "Consultar"], link: true, numbered: true })}${servicesConfirm(ctx)}</div></section>`
    : "";

  // A second plate between sections, only when the library has one to give.
  const second = ctx.photos.enabled ? plate(ctx, ctx.photos.next(), hero === "plate" ? "02" : "01") : "";
  const band = second ? `<div class="ea-band">${second}</div>` : "";

  const approach = ctx.themes.length
    ? `<section class="ea-sec ea-sec--alt ea-approach"><div class="wrap"><div class="ea-grid" aria-hidden="true"></div><div style="margin-top:clamp(2.5rem,5vw,4rem)">${h2(ctx, [["What drivers", "Lo que"], ["notice", "notan"], [" here", " los clientes"]])}</div>${themesBlock(ctx)}</div></section>`
    : "";

  const steps = stepsFor(ctx);
  const visitSteps = `<section class="ea-sec" id="visit-steps"><div class="wrap"><div class="ea-grid" aria-hidden="true"></div><div class="ea-head" style="margin-top:clamp(2.5rem,5vw,4rem)">${h2(ctx, [["How a visit", "Cómo es una"], ["runs", "visita"], null])}<p class="ea-dek">${t("Every step is explained before the next one starts.", "Cada paso se explica antes de empezar el siguiente.")}</p></div><ol class="ea-line" style="--n:${steps.length}">${steps.map((s, i) => `<li class="rv"><span class="ea-mono">${t(`Step ${String(i + 1).padStart(2, "0")}`, `Paso ${String(i + 1).padStart(2, "0")}`)}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  const fh = formHeading(ctx);
  const request = `<section class="ea-sec ea-sec--alt" id="${REQUEST_ID}"><div class="wrap ea-req"><div class="ea-req__side">${h2(ctx, [["Service", "Solicitud de"], ["intake", "servicio"], null])}<p class="ea-dek" style="margin-top:1.25rem">${fh.intro}</p>${ratingProof(ctx, "strip")}${tel}</div><div class="ea-form"><p class="ea-form__top ea-mono" aria-hidden="true"><span>${fh.title}</span><span>${esc(ctx.cityState)}</span></p>${intakeForm(ctx)}</div></div></section>`;

  const location = `<section class="ea-sec" id="location"><div class="wrap"><div class="ea-grid" aria-hidden="true"></div><div class="ea-visit" style="margin-top:clamp(2.5rem,5vw,4rem)"><div>${h2(ctx, [["Find the", "Cómo"], ["workshop", "llegar"], null])}<p class="ea-dek" style="margin-top:1.25rem">${t("Call ahead so the right bay is ready when you arrive.", "Llame antes para que el espacio esté listo cuando llegue.")}</p></div>${visitDetails(ctx)}</div></div></section>`;

  const faq = `<section class="ea-sec ea-sec--alt ea-faq" id="faq"><div class="wrap ea-visit"><div>${h2(ctx, [["Before you", "Antes de"], ["call", "llamar"], null])}</div>${faqBlock(ctx)}</div></section>`;

  const close = `<section class="ea-close"><div class="wrap"><p class="ea-mono ea-kicker">${ctx.name}</p><p class="ea-h2" style="margin-top:1.25rem">${withAccent(ctx, [["Book the car in,", "Agende su carro,"], ["unhurried", "sin prisas"], [".", "."]])}</p><div class="ea-ctas">${bookButton(ctx, { cls: "ea-btn", ico: "", arrow: true, label: ["Book service", "Agendar servicio"] })}${tel}</div></div></section>`;

  return {
    css: CSS,
    body: `${header}<main>${heroHtml}${services}${band}${approach}${visitSteps}${request}${location}${faq}${close}</main>${siteFooter(ctx)}`,
  };
}

export const direction = {
  key: "auto-euro-atelier",
  label: "European specialist atelier",
  status: "implemented",
  suits: ["auto-repair", "auto-detailing", "muffler-exhaust"],
  keywords: ["premium", "european", "bmw", "mercedes", "audi", "porsche", "specialist", "luxury", "dark premium"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@400;500&family=Bodoni+Moda:ital,opsz,wght@1,6..96,400&family=Encode+Sans:wdth,wght@75..125,300..600&display=swap",
  palettes: PALETTES,
  variants: { hero: ["spot", "plate"], services: ["sheet", "grid"], proof: ["cells"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /engine-bay|engine-wrench|electrical|finish|polish|booth/ },
  callbar: "call",
  render,
};
