// Collision and paint showroom (research/design-auto.md, direction 3): clean,
// bright and reassuring after a bad day, with paint booth clarity. The hero
// compares one door panel twice, warped reflection lines around a dent against
// straight parallel ones, on a slider that works with a pointer (hover or tap
// a column) and the keyboard (arrow keys on a radio group), all in CSS. A top
// view car diagram tags the damaged area on the photo estimate form: every
// zone is a label for the form's own "Where is the damage?" radio.

import {
  bookButton,
  callButton,
  faqBlock,
  formHeading,
  gallery,
  heroPhoto,
  promiseLine,
  ratingProof,
  REQUEST_ID,
  servicesConfirm,
  serviceItems,
  shortCta,
  siteFooter,
  siteHeader,
  themesBlock,
  uid,
  visitDetails,
} from "../blocks.js";
import { stepsFor } from "../copy.js";
import { esc, icon } from "../shared.js";

const PALETTES = [
  { key: "showroom-clearcoat", name: "Clearcoat", vars: { bg: "#fbfbfc", surface: "#ffffff", ink: "#0e1116", muted: "#4d5664", line: "#d5dbe5", primary: "#1f5eff", "on-primary": "#ffffff", accent: "#1f5eff", mist: "#e7ebf2", hero: "#fbfbfc", "on-hero": "#0e1116", "hero-muted": "#4d5664", "hero-line": "#d5dbe5", tape: "#efe3b8", "tape-ink": "#3a3320", panel: "#c9d4e6", "panel-2": "#8fa1bf", reflect: "#0e1116", mark: "#1f5eff" } },
  { key: "showroom-primer", name: "Primer", vars: { bg: "#f2f2f0", surface: "#ffffff", ink: "#2a2d31", muted: "#5d6369", line: "#d6d6d2", primary: "#d7263d", "on-primary": "#ffffff", accent: "#d7263d", mist: "#e5e5e2", hero: "#2a2d31", "on-hero": "#f2f2f0", "hero-muted": "#b9bdc2", "hero-line": "#454a50", tape: "#e9dfc3", "tape-ink": "#3a3320", panel: "#b5babf", "panel-2": "#7b8187", reflect: "#1d1f22", mark: "#d7263d" } },
  { key: "showroom-pearl", name: "Pearl and teal", vars: { bg: "#f6f7f5", surface: "#ffffff", ink: "#0b2a33", muted: "#48606a", line: "#d9dfdc", primary: "#0b2a33", "on-primary": "#ffffff", accent: "#0b7f80", mist: "#e5ecea", hero: "#f6f7f5", "on-hero": "#0b2a33", "hero-muted": "#48606a", "hero-line": "#d9dfdc", tape: "#ffe2a0", "tape-ink": "#3b2c05", panel: "#b9dcd9", "panel-2": "#5fa9a7", reflect: "#0b2a33", mark: "#ffb000" } },
];

// Reflection lines for the illustration, computed once. A dent at (330, 206)
// pushes the lines apart and ripples the ones that pass through it.
const DENT = { x: 330, y: 206 };
const LINE_YS = [82, 116, 150, 184, 206, 228, 262, 296];
function linePath(y, warped) {
  const pts = [];
  for (let x = 40; x <= 580; x += 10) {
    let yy = y;
    if (warped) {
      const g = Math.exp(-((x - DENT.x) ** 2) / (2 * 62 ** 2)) * Math.exp(-((y - DENT.y) ** 2) / (2 * 52 ** 2));
      const side = y === DENT.y ? 0 : Math.sign(y - DENT.y);
      yy = y + 30 * g * side + 9 * g * Math.sin((x - DENT.x) / 11);
    }
    pts.push(`${x} ${yy.toFixed(1)}`);
  }
  return `M${pts.join("L")}`;
}
const WARPED = LINE_YS.map((y) => linePath(y, true)).join("");
const STRAIGHT = LINE_YS.map((y) => linePath(y, false)).join("");
const DOOR = "M62 74Q62 44 92 42L468 34Q536 34 556 92L564 298Q564 324 538 324H92Q62 324 62 298Z";

function doorSvg(ctx, cls, warped) {
  const id = uid(ctx, "cs");
  const dent = warped ? `<ellipse cx="${DENT.x}" cy="${DENT.y}" rx="74" ry="46" fill="url(#${id}d)"/>` : `<path d="M110 70L250 60L180 320L90 320Z" fill="#fff" opacity=".22"/>`;
  return `<svg class="${cls}" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--panel)"/><stop offset="1" stop-color="var(--panel-2)"/></linearGradient><radialGradient id="${id}d"><stop offset="0" stop-color="#000" stop-opacity=".34"/><stop offset=".7" stop-color="#000" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient><clipPath id="${id}c"><path d="${DOOR}"/></clipPath></defs><rect width="600" height="360" fill="var(--mist)"/><path d="${DOOR}" fill="url(#${id}g)"/><g clip-path="url(#${id}c)">${dent}<path d="${warped ? WARPED : STRAIGHT}" fill="none" stroke="var(--reflect)" stroke-width="3" stroke-linecap="round" opacity=".78"/></g><path d="${DOOR}" fill="none" stroke="var(--reflect)" stroke-width="2.5" opacity=".5"/><path d="M66 150C230 140 420 138 560 146" fill="none" stroke="var(--reflect)" stroke-width="1.5" opacity=".35"/><rect x="452" y="164" width="64" height="14" rx="7" fill="none" stroke="var(--reflect)" stroke-width="2" opacity=".6"/></svg>`;
}

const STOPS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function slider(ctx) {
  const t = ctx.t;
  const hits = STOPS.map((i) => `<label class="cs-hit" for="cs-ba-${i}" style="left:${i * 10 - 5}%"></label>`).join("");
  const radios = STOPS.map((i) => `<label class="cs-stop"><input type="radio" name="cs-ba" id="cs-ba-${i}" value="${i * 10}"${i === 5 ? " checked" : ""}><span class="sr-only">${t(`${i * 10} percent after`, `${i * 10} por ciento después`)}</span></label>`).join("");
  return `<figure class="cs-ba">
<div class="cs-ba__stage">${doorSvg(ctx, "cs-ba__layer", true)}${doorSvg(ctx, "cs-ba__layer cs-ba__after", false)}<span class="cs-ba__rule" aria-hidden="true"><span class="cs-ba__knob">${icon("arrow")}${icon("arrow")}</span></span><span class="cs-ba__tag cs-ba__tag--b" aria-hidden="true">${t("Before", "Antes")}</span><span class="cs-ba__tag cs-ba__tag--a" aria-hidden="true">${t("After", "Después")}</span><div class="cs-ba__hits" aria-hidden="true">${hits}</div></div>
<fieldset class="cs-ba__stops"><legend class="sr-only">${t("Compare before and after. Use the arrow keys.", "Compare antes y después. Use las flechas.")}</legend>${radios}</fieldset>
<figcaption class="cs-ba__cap">${t("Illustration. Reflection lines show a dent, and show when a panel is straight again.", "Ilustración. Las líneas de reflejo muestran un golpe, y cuando el panel vuelve a quedar derecho.")}</figcaption>
</figure>`;
}

function sliderCss() {
  const set = STOPS.map((i) => `.cs-ba:has([id="cs-ba-${i}"]:checked){--pos:${i * 10}%}`).join("");
  const hover = STOPS.map((i) => `.cs-ba:has(.cs-hit:nth-child(${i}):hover){--pos:${i * 10}%}`).join("");
  return `${set}@media (hover:hover){${hover}}`;
}

// Top view of a generic car for tagging damage.
const CAR_TOP = `<svg class="cs-car__svg" viewBox="0 0 200 400" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
<path d="M60 22Q100 8 140 22Q170 32 172 72L176 330Q174 380 140 388Q100 396 60 388Q26 380 24 330L28 72Q30 32 60 22Z" fill="var(--surface)"/>
<path d="M48 122Q100 102 152 122L146 156Q100 144 54 156Z"/><path d="M54 300Q100 312 146 300L152 332Q100 348 48 332Z"/>
<rect x="56" y="162" width="88" height="132" rx="10"/><path d="M70 40Q100 32 130 40M62 70L70 118M138 70L130 118" opacity=".5"/>
<path d="M24 136L10 130V146L24 150M176 136L190 130V146L176 150" /><path d="M20 84V122M180 84V122M20 282V320M180 282V320" stroke-width="7" opacity=".35"/>
</svg>`;

const ZONES = [
  ["front", ["Front", "Frente"]],
  ["top", ["Roof or hood", "Techo o cofre"]],
  ["driver", ["Driver side", "Lado del conductor"]],
  ["passenger", ["Passenger side", "Lado del pasajero"]],
  ["rear", ["Rear", "Atrás"]],
];

function tagArea(form) {
  return form.replace(/<input type="radio" name="area" value="([^"]*)"/g, (_, v) => `<input type="radio" id="rq-area-${v}" name="area" value="${v}"`);
}

function diagramCss() {
  const all = [...ZONES.map(([v]) => v), "unsure"];
  const on = all.map((v) => `:root:has(#rq-area-${v}:checked) :is(.cs-zone--${v},.cs-pick--${v})`).join(",");
  const any = all.map((v) => `:root:has(#rq-area-${v}:checked) .cs-tagged`).join(",");
  return `${on}{background:color-mix(in oklab,var(--mark) 26%,transparent);border-color:var(--mark);border-style:solid;color:var(--ink)}${all.map((v) => `:root:has(#rq-area-${v}:checked) .cs-pick--${v}::before`).join(",")}{background:var(--mark);border-color:var(--mark)}${any}{visibility:visible}`;
}

// A panel icon per kind of service, drawn as simple strokes.
const ICONS = [
  [/dent|hail|ding/i, "<path d=\"M4 6h16v12H4z\"/><circle cx=\"12\" cy=\"12\" r=\"3.2\"/><path d=\"M12 6v2.8M12 15.2V18\"/>"],
  [/paint|refinish|color|colour|clear/i, "<path d=\"M6 4h8v5H6z\"/><path d=\"M10 9v3h6v8h-3\"/><path d=\"M14 6h3l2 2\"/><path d=\"M19 12v.01M21 10v.01M21 14v.01\"/>"],
  [/bumper/i, "<path d=\"M3 10q0-3 3-3h12q3 0 3 3v4H3z\"/><path d=\"M6 14v3M18 14v3M8 11h8\"/>"],
  [/frame|straight|unibody|structural/i, "<path d=\"M5 4v16M19 4v16M5 8h14M5 16h14\"/><path d=\"M9 12h6\"/>"],
  [/glass|windshield|window|tint/i, "<path d=\"M4 17L7 7h10l3 10z\"/><path d=\"M9 15l3-6M13 15l2-4\"/>"],
  [/polish|correct|ceramic|coat|wax|buff|detail|wash|headlight|interior/i, "<path d=\"M12 3v4M12 17v4M3 12h4M17 12h4\"/><path d=\"M12 8l1.4 2.6L16 12l-2.6 1.4L12 16l-1.4-2.6L8 12l2.6-1.4z\"/>"],
  [/scratch|scuff/i, "<path d=\"M4 6h16v12H4z\"/><path d=\"M7 15l5-6M10 16l6-7\"/>"],
];
const PANEL = "<path d=\"M5 5h11l3 4v10H5z\"/><path d=\"M5 11h14\"/>";

function svcIcon(name) {
  const hit = ICONS.find(([re]) => re.test(name));
  return `<svg class="cs-svc__ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${hit ? hit[1] : PANEL}</svg>`;
}

// Generic advice for the minutes after a crash. It says nothing about the shop.
const CHECKLIST = [
  ["Check that everyone is okay. Call 911 if anyone is hurt.", "Revise que todos estén bien. Llame al 911 si hay heridos."],
  ["Move somewhere safe if the car can drive, and turn on the hazards.", "Muévase a un lugar seguro si el carro avanza, y prenda las intermitentes."],
  ["Take photos of both cars, the scene and any road signs.", "Tome fotos de los dos carros, del lugar y de las señales."],
  ["Swap names and contact details with the other driver.", "Intercambie nombres y datos de contacto con el otro conductor."],
  ["Write down where and when it happened while it is fresh.", "Anote dónde y cuándo pasó mientras lo recuerda bien."],
];

const CSS = `
:root{--display:"Schibsted Grotesk",system-ui,sans-serif;--body:"Schibsted Grotesk",system-ui,sans-serif;--mono:"Geist Mono",ui-monospace,monospace;--radius:12px;--btn-radius:999px;--max:1220px;--ease:cubic-bezier(.22,1,.36,1);--field:#fff;--field-line:color-mix(in oklab,var(--ink) 20%,transparent);--lang-fg:var(--on-hero);--lang-on:var(--hero)}
@property --pos{syntax:"<percentage>";inherits:true;initial-value:50%}
body{font-weight:400;font-size:1.0625rem;line-height:1.6}

.cs-mono{font-family:var(--mono);font-weight:500;font-size:.78rem;letter-spacing:.04em;text-transform:uppercase}
.cs-tape{display:inline-block;padding:.3rem .8rem .28rem;background:var(--tape);color:var(--tape-ink);font-family:var(--mono);font-weight:500;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;transform:rotate(-1.4deg);clip-path:polygon(2% 0,98% 4%,100% 50%,97% 100%,1% 96%,0 48%);box-shadow:inset 0 0 0 999px rgb(255 255 255 / .08)}
.cs-h2{font-family:var(--display);font-weight:800;font-size:clamp(2rem,4.6vw,3.4rem);line-height:1;letter-spacing:-.03em}
.cs-dek{color:var(--muted);max-width:54ch}

.b-hd{position:sticky;top:0;z-index:10;background:color-mix(in oklab,var(--hero) 94%,transparent);color:var(--on-hero);backdrop-filter:saturate(1.4) blur(12px);-webkit-backdrop-filter:saturate(1.4) blur(12px);border-bottom:1px solid var(--hero-line)}
.b-hd__in{display:flex;align-items:center;gap:1.5rem;min-height:4.25rem}
.b-brand{margin-right:auto;font-weight:800;font-size:1.2rem;letter-spacing:-.02em;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:58vw}
.b-nav{display:none;gap:1.75rem;font-weight:500;font-size:.95rem}
.b-nav a{text-decoration:none;color:var(--hero-muted);transition:color .2s}
.b-nav a:hover{color:var(--on-hero)}
@media (min-width:1020px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:1rem}
.b-hd__tel{display:none;align-items:center;gap:.4rem;font-weight:500;text-decoration:none}
@media (min-width:760px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.75rem;padding:.55rem 1.2rem;border-radius:999px;background:var(--primary);color:var(--on-primary);font-weight:600;text-decoration:none;box-shadow:0 0 0 1px color-mix(in oklab,var(--on-hero) 18%,transparent)}

.cs-btn{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;min-height:3.25rem;padding:.85rem 1.5rem;border-radius:999px;font-weight:600;text-decoration:none;border:1.5px solid transparent;transition:transform .3s var(--ease),box-shadow .3s var(--ease),background-color .2s}
.cs-btn:hover{transform:translateY(-2px)}
.cs-btn--go{background:var(--primary);color:var(--on-primary);box-shadow:0 12px 28px -14px var(--primary)}
.cs-btn--line{border-color:currentColor}
.cs-btn .ico{width:1.1rem;height:1.1rem}

.cs-hero{background:var(--hero);color:var(--on-hero);padding:clamp(2.5rem,6vw,5rem) 0 clamp(3rem,7vw,5.5rem);overflow:hidden}
.cs-hero__grid{display:grid;gap:clamp(2.5rem,5vw,4rem);align-items:center}
@media (min-width:980px){.cs-hero__grid{grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr)}}
.cs-name{margin-top:1.25rem;font-weight:800;line-height:.95;letter-spacing:-.035em;font-size:var(--nsize);overflow-wrap:break-word}
.name--xl{--nsize:clamp(2.8rem,8vw,5.75rem)}
.name--l{--nsize:clamp(2.5rem,6.6vw,4.8rem)}
.name--m{--nsize:clamp(2.2rem,5.4vw,4rem)}
.name--s{--nsize:clamp(1.9rem,4.4vw,3.2rem)}
.cs-promise{margin-top:1.25rem;max-width:30ch;font-size:clamp(1.25rem,2.2vw,1.6rem);line-height:1.3;font-weight:500;letter-spacing:-.01em}
.cs-about{margin-top:1rem;max-width:52ch;color:var(--hero-muted)}
.cs-ctas{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}
.cs-hero .b-rating--chip{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-weight:600}
.cs-hero .b-rating--chip .stars{width:5.5rem;height:1.1rem;color:var(--mark)}
.cs-hero .b-rating--chip .b-rating__count{color:var(--hero-muted);font-weight:400}
@media (min-width:980px){.cs-hero .b-rating--chip{display:none}}

.cs-ba{margin:0;padding:clamp(.75rem,1.5vw,1rem);border-radius:20px;background:var(--surface);color:var(--ink);box-shadow:0 30px 60px -34px rgb(10 20 40 / .5),0 0 0 1px var(--line)}
.cs-ba__stage{position:relative;aspect-ratio:5/3;border-radius:12px;overflow:hidden;touch-action:manipulation}
.cs-ba__layer{position:absolute;inset:0;width:100%;height:100%}
.cs-ba__after{clip-path:inset(0 0 0 var(--pos));transition:clip-path .45s var(--ease)}
.cs-ba__rule{position:absolute;top:0;bottom:0;left:var(--pos);width:2px;margin-left:-1px;background:var(--surface);box-shadow:0 0 0 1px rgb(0 0 0 / .12);transition:left .45s var(--ease);pointer-events:none}
.cs-ba__knob{position:absolute;top:50%;left:50%;display:flex;gap:0;align-items:center;justify-content:center;width:2.9rem;height:2.9rem;margin:-1.45rem 0 0 -1.45rem;border-radius:50%;background:var(--surface);color:var(--ink);box-shadow:0 6px 16px rgb(0 0 0 / .22)}
.cs-ba__knob .ico{width:.9rem;height:.9rem}
.cs-ba__knob .ico:first-child{transform:scaleX(-1)}
.cs-ba__tag{position:absolute;top:.75rem;padding:.25rem .6rem;border-radius:999px;background:rgb(255 255 255 / .85);color:#111;font-family:var(--mono);font-weight:500;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase}
.cs-ba__tag--b{left:.75rem}
.cs-ba__tag--a{right:.75rem}
.cs-ba__hits{position:absolute;inset:0}
.cs-hit{position:absolute;top:0;bottom:0;width:10%;cursor:ew-resize}
.cs-ba__stops{display:flex;justify-content:space-between;align-items:center;margin:.9rem .25rem .1rem;padding:0 4%;border:0}
.cs-stop{position:relative;display:grid;place-items:center;width:1.75rem;height:1.75rem;cursor:pointer}
.cs-stop input{position:absolute;inset:0;margin:0;opacity:0;cursor:pointer}
.cs-stop::before{content:"";width:.4rem;height:.4rem;border-radius:50%;background:var(--line);transition:transform .25s var(--ease),background-color .2s}
.cs-stop:hover::before{background:var(--muted)}
.cs-stop:has(input:checked)::before{transform:scale(1.9);background:var(--accent)}
.cs-stop:has(input:focus-visible){outline:3px solid var(--accent);outline-offset:1px;border-radius:50%}
.cs-ba__cap{margin:.4rem .25rem 0;font-size:.85rem;color:var(--muted)}

.cs-hero--booth .b-photo{aspect-ratio:4/3;border-radius:20px;box-shadow:0 30px 60px -34px rgb(10 20 40 / .55)}
.cs-hero--booth .b-photo img{filter:saturate(1.02) brightness(1.04)}
.cs-sec--compare .cs-ba{max-width:52rem;margin:2.5rem auto 0}

.cs-proof{background:var(--surface);border-bottom:1px solid var(--line)}
.cs-proof__in{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem 2.5rem;padding:1.35rem 0}
.cs-proof .b-rating{display:flex;align-items:center;gap:1rem}
.cs-proof .b-rating__num{font-weight:800;font-size:2.4rem;line-height:1;letter-spacing:-.03em}
.cs-proof .b-rating__side{display:grid;gap:.15rem}
.cs-proof .stars{width:6rem;height:1.2rem;color:var(--mark)}
.cs-proof .b-rating__count{font-weight:600}
.cs-proof__facts{display:flex;flex-wrap:wrap;gap:.5rem 2rem;color:var(--muted);font-size:.95rem}
.cs-proof__facts span{display:inline-flex;align-items:center;gap:.4rem}
.cs-proof__facts .ico{width:1rem;height:1rem;color:var(--accent)}

.cs-sec{padding:clamp(4rem,9vw,7rem) 0}
.cs-sec--mist{background:var(--mist)}
.cs-head{display:grid;gap:1rem;max-width:46rem}
.cs-head .cs-tape{justify-self:start}

.cs-diagram{display:grid;gap:2.5rem}
@media (min-width:900px){.cs-diagram{grid-template-columns:minmax(0,20rem) minmax(0,1fr);grid-template-areas:"car head" "car side";align-content:center;gap:2rem 6rem}.cs-diagram__head{grid-area:head;align-self:end}.cs-car{grid-area:car}.cs-diagram__side{grid-area:side;align-self:start}}
.cs-car{position:relative;width:min(100%,13rem);aspect-ratio:1/2;margin-inline:auto;color:var(--ink)}
@media (min-width:900px){.cs-car{width:min(100%,18rem)}}
.cs-car__svg{position:absolute;inset:0;width:100%;height:100%}
.cs-zone{position:absolute;display:grid;place-items:center;padding:.25rem;border:1.5px dashed color-mix(in oklab,var(--ink) 35%,transparent);border-radius:12px;background:transparent;font-family:var(--mono);font-weight:500;font-size:.68rem;letter-spacing:.04em;text-transform:uppercase;text-align:center;line-height:1.2;color:var(--muted);cursor:pointer;transition:background-color .2s,border-color .2s,color .2s}
.cs-zone:hover{background:color-mix(in oklab,var(--mark) 12%,transparent);color:var(--ink)}
.cs-zone--front{left:22%;right:22%;top:3%;height:19%}
.cs-zone--rear{left:22%;right:22%;bottom:3%;height:15%}
.cs-zone--top{left:30%;right:30%;top:40%;height:34%}
.cs-zone--driver{left:-16%;width:28%;top:30%;height:46%}
.cs-zone--passenger{right:-16%;width:28%;top:30%;height:46%}
.cs-zone--driver,.cs-zone--passenger{background:color-mix(in oklab,var(--mist) 80%,transparent);z-index:1}
.cs-diagram__side{display:grid;gap:1.25rem;justify-items:start}
.cs-diagram__list{display:flex;flex-wrap:wrap;gap:.5rem}
.cs-pick{display:inline-flex;align-items:center;gap:.5rem;min-height:2.75rem;padding:.55rem 1rem;border:1.5px solid var(--field-line);border-radius:999px;background:var(--surface);font-weight:500;cursor:pointer;transition:border-color .2s,background-color .2s}
.cs-pick::before{content:"";width:.65rem;height:.65rem;border-radius:50%;border:1.5px solid currentColor;transition:background-color .2s}
.cs-pick:hover{border-color:var(--ink)}
.cs-tagged{visibility:hidden;font-weight:600;color:var(--accent)}

.cs-steps{position:relative;display:grid;gap:1.5rem;margin-top:3rem}
@media (min-width:860px){.cs-steps{grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:1.5rem}.cs-steps::before{content:"";position:absolute;top:1.25rem;left:1.25rem;right:1.25rem;height:2px;background:linear-gradient(90deg,var(--accent),var(--line))}}
.cs-steps li{position:relative;display:grid;align-content:start;grid-template-columns:2.5rem 1fr;gap:1rem;align-items:start}
@media (min-width:860px){.cs-steps li{grid-template-columns:1fr;gap:1.25rem}}
.cs-steps .cs-step__n{position:relative;display:grid;place-items:center;width:2.5rem;height:2.5rem;border-radius:50%;background:var(--surface);border:2px solid var(--accent);font-family:var(--mono);font-weight:500;font-size:.85rem;color:var(--ink)}
.cs-steps li:first-child .cs-step__n{background:var(--accent);color:#fff}
.cs-steps h3{font-weight:700;font-size:1.3rem;letter-spacing:-.02em;line-height:1.15}
.cs-steps p{margin-top:.35rem;color:var(--muted);max-width:32ch}

.cs-svc{display:grid;grid-template-columns:1fr;gap:1px;margin-top:3rem;background:var(--line);border:1px solid var(--line);border-radius:16px;overflow:hidden}
@media (min-width:560px){.cs-svc{grid-template-columns:1fr 1fr}}@media (min-width:960px){.cs-svc{grid-template-columns:repeat(3,1fr)}}
.cs-svc li{display:grid;grid-template-columns:auto 1fr;gap:1rem;align-items:center;padding:1.5rem 1.4rem;background:var(--surface);transition:background-color .25s}
.cs-svc li:hover{background:var(--mist)}
.cs-svc__ico{width:2.6rem;height:2.6rem;padding:.55rem;border-radius:12px;background:var(--mist);color:var(--accent)}
.cs-svc__name{font-weight:600;font-size:1.1rem;line-height:1.25}
.cs-svc__n{grid-column:1/-1;font-family:var(--mono);font-size:.72rem;color:var(--muted);margin-bottom:-.5rem;order:-1}
.b-svc-confirm{margin-top:1.5rem;color:var(--muted);font-size:.95rem}
.svc-note{margin-top:.35rem;color:var(--muted);font-size:.9rem}

.cs-after{display:grid;gap:2.5rem}
@media (min-width:900px){.cs-after{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:5rem}}
.cs-check{counter-reset:ck;display:grid;gap:0;border-top:1.5px solid var(--ink)}
.cs-check li{display:grid;grid-template-columns:2rem 1fr;gap:1rem;padding:1.1rem 0;border-bottom:1px solid var(--line);font-weight:500;font-size:1.08rem}
.cs-check li::before{content:"";width:1.35rem;height:1.35rem;margin-top:.15rem;border:1.5px solid var(--ink);border-radius:5px}
.cs-check__note{margin-top:1rem;font-size:.9rem;color:var(--muted)}

.cs-themes .b-themes{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}
.cs-themes .b-themes li{padding:.75rem 1.2rem;border-radius:999px;background:var(--surface);border:1px solid var(--line);font-weight:600}
.b-themes__note{margin-top:1rem;font-size:.9rem;color:var(--muted)}

.cs-booth .b-gallery{display:grid;grid-template-columns:1fr;gap:1rem;margin-top:2.5rem}
@media (min-width:760px){.cs-booth .b-gallery{grid-template-columns:1.3fr 1fr 1fr}}
.cs-booth .b-gallery__tile{aspect-ratio:4/3;border-radius:16px;overflow:hidden}
@media (min-width:760px){.cs-booth .b-gallery{grid-auto-rows:clamp(14rem,24vw,20rem)}.cs-booth .b-gallery__tile{aspect-ratio:auto}}
.cs-booth .b-gallery__empty{display:grid;place-items:center;background:var(--mist);color:var(--muted);font-family:var(--mono);font-size:.8rem;text-transform:uppercase}

.cs-req{display:grid;gap:2.5rem}
@media (min-width:980px){.cs-req{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem;align-items:start}.cs-req__side{position:sticky;top:6rem}}
.cs-req__side ul{display:grid;gap:.6rem;margin-top:1.5rem}
.cs-req__side li{display:flex;gap:.6rem;align-items:flex-start}
.cs-req__side li .ico{margin-top:.2rem;color:var(--accent)}
.cs-req__side .cs-btn{margin-top:1.75rem}
.cs-form{padding:clamp(1.25rem,3.5vw,2.5rem);border-radius:20px;background:var(--surface);box-shadow:0 30px 60px -40px rgb(10 20 40 / .5),0 0 0 1px var(--line)}
.f-input{border-radius:10px}
.f-drop{border-radius:14px;background:var(--mist)}
.f-chip input:checked+span{background:var(--accent);color:#fff;border-color:var(--accent)}
.f-submit{border-radius:999px;min-height:3.4rem}

.cs-visit{display:grid;gap:3rem}
@media (min-width:900px){.cs-visit{grid-template-columns:1fr 1fr;gap:5rem}}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7.5rem 1fr;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:1px solid var(--line)}
.facts dt{font-family:var(--mono);font-weight:500;font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);padding-top:.2rem}
.facts dd{margin:0;font-weight:500}
.b-visit__pending{display:grid;gap:.4rem;margin-top:1.25rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-weight:600}
.faq details{border-color:var(--line)}
.faq summary{font-weight:600;font-size:1.12rem}

.cs-close{padding:clamp(4rem,9vw,6.5rem) 0;background:var(--hero);color:var(--on-hero);border-top:1px solid var(--hero-line)}
.cs-close__in{display:grid;gap:2rem;align-items:end}
@media (min-width:900px){.cs-close__in{grid-template-columns:1fr auto}}
.cs-close .cs-h2{max-width:18ch}
.cs-close__tel{display:block;margin-top:1rem;font-weight:800;font-size:clamp(2rem,6vw,3.75rem);letter-spacing:-.03em;line-height:1;text-decoration:none;font-variant-numeric:tabular-nums}

.b-ft{padding:3.5rem 0 2.5rem;background:var(--surface);border-top:1px solid var(--line)}
.b-ft__name{font-weight:800;font-size:clamp(1.6rem,4vw,2.3rem);letter-spacing:-.03em;line-height:1}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;color:var(--muted)}
.b-ft__row a{color:var(--ink);font-weight:600}
.legal{margin-top:1.75rem;font-size:.85rem;color:var(--muted)}
.stock-credits{margin-top:.4rem}
.callbar{background:var(--primary);color:var(--on-primary)}
@media (max-width:759.98px){.b-brand{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.1}}
`;

function render(ctx) {
  const t = ctx.t;
  const hero = ctx.variants.hero === "booth" ? "booth" : "compare";
  const form = tagArea(ctx.form);
  const hasArea = form.includes("id=\"rq-area-front\"");
  const nav = [
    hasArea ? { href: "#damage", label: ["Estimate", "Presupuesto"] } : null,
    { href: "#process", label: ["Process", "Proceso"] },
    ctx.services.length ? { href: "#services", label: ["Services", "Servicios"] } : null,
    { href: "#visit", label: ["Visit", "Visítenos"] },
  ].filter(Boolean);
  const header = siteHeader(ctx, { nav, cta: shortCta(ctx) });

  const photo = hero === "booth" ? heroPhoto(ctx, { sizes: "(min-width: 980px) 50vw, 100vw", tag: true, width: 1200 }) : "";
  const visual = photo || slider(ctx);
  const heroHtml = `<section class="cs-hero cs-hero--${photo ? "booth" : "compare"}" id="top"><div class="wrap cs-hero__grid"><div>
<span class="cs-tape">${ctx.categoryT} / ${esc(ctx.cityState)}</span>
<h1 class="cs-name name--${ctx.nameScale}">${ctx.name}</h1>
<p class="cs-promise">${promiseLine(ctx)}</p>
${ctx.about ? `<p class="cs-about">${ctx.about}</p>` : ""}
<div class="cs-ctas">${bookButton(ctx, { cls: "cs-btn cs-btn--go", ico: "camera" })}${callButton(ctx, { cls: "cs-btn cs-btn--line" })}</div>
${ratingProof(ctx, "chip")}
</div>${visual}</div></section>`;

  const facts = [
    `<span>${icon("pin")}${esc(ctx.placeRaw)}</span>`,
    `<span>${icon("clock")}${ctx.hours ? esc(ctx.hours) : t("Hours to confirm", "Horario por confirmar")}</span>`,
  ].join("");
  const proof = `<section class="cs-proof" aria-label="Google rating"><div class="wrap cs-proof__in">${ratingProof(ctx, ctx.variants.proof === "figure" ? "figure" : "strip", { caption: false })}<p class="cs-proof__facts">${facts}</p></div></section>`;

  const compare = photo
    ? `<section class="cs-sec cs-sec--compare"><div class="wrap"><div class="cs-head" style="margin-inline:auto;text-align:center;justify-items:center"><span class="cs-tape">${t("Read the reflections", "Lea los reflejos")}</span><h2 class="cs-h2">${t("A straight panel reflects straight lines", "Un panel derecho refleja líneas derechas")}</h2></div>${slider(ctx)}</div></section>`
    : "";

  const zones = ZONES.map(([v, l]) => `<label class="cs-zone cs-zone--${v}" for="rq-area-${v}">${t(l[0], l[1])}</label>`).join("");
  const picks = [...ZONES, ["unsure", ["Not sure", "No sé"]]].map(([v, l]) => `<label class="cs-pick cs-pick--${v}" for="rq-area-${v}">${t(l[0], l[1])}</label>`).join("");
  const damage = hasArea
    ? `<section class="cs-sec cs-sec--mist" id="damage"><div class="wrap cs-diagram"><div class="cs-head cs-diagram__head"><span class="cs-tape">${t("Step one", "Primer paso")}</span><h2 class="cs-h2">${t("Tap where it is damaged", "Toque dónde está el daño")}</h2><p class="cs-dek">${t("Your pick goes straight onto the photo estimate below, so the shop knows where to look first.", "Su elección pasa directo al presupuesto con fotos de abajo, para que el taller sepa dónde mirar primero.")}</p></div><div class="cs-car" aria-hidden="true">${CAR_TOP}${zones}</div><div class="cs-diagram__side"><div class="cs-diagram__list" aria-hidden="true">${picks}</div><p class="cs-tagged" aria-hidden="true">${icon("check")} ${t("Tagged on your estimate.", "Marcado en su presupuesto.")}</p>${bookButton(ctx, { cls: "cs-btn cs-btn--go", ico: "camera", label: ["Next, add photos", "Luego, agregue fotos"] })}</div></div></section>`
    : "";

  const steps = stepsFor(ctx);
  const process = `<section class="cs-sec" id="process"><div class="wrap"><div class="cs-head"><h2 class="cs-h2">${t("The repair, step by step", "La reparación, paso a paso")}</h2><p class="cs-dek">${t("Ask anything at any step. Every repair is different, so the shop sets timing with you.", "Pregunte lo que quiera en cada paso. Cada reparación es distinta, así que el taller acuerda los tiempos con usted.")}</p></div><ol class="cs-steps" style="--n:${steps.length}">${steps.map((s, i) => `<li class="rv"><span class="cs-step__n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><div><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></div></li>`).join("")}</ol></div></section>`;

  const services = ctx.services.length
    ? `<section class="cs-sec cs-sec--mist" id="services"><div class="wrap"><div class="cs-head"><h2 class="cs-h2">${t("What the shop repairs", "Lo que repara el taller")}</h2></div><ul class="b-svc cs-svc">${serviceItems(ctx).map((s) => `<li class="b-svc__item rv">${svcIcon(s.name)}<span class="b-svc__name cs-svc__name">${s.html}</span></li>`).join("")}</ul>${servicesConfirm(ctx)}</div></section>`
    : "";

  const themes = ctx.themes.length
    ? `<section class="cs-sec cs-themes"><div class="wrap"><div class="cs-head"><h2 class="cs-h2">${t("What customers mention", "Lo que mencionan los clientes")}</h2></div>${themesBlock(ctx)}</div></section>`
    : "";

  const after = `<section class="cs-sec${ctx.themes.length ? " cs-sec--mist" : ""}"><div class="wrap cs-after"><div class="cs-head"><h2 class="cs-h2">${t("Just had a collision?", "¿Acaba de chocar?")}</h2><p class="cs-dek">${t("A short checklist for the first few minutes. Then send photos when you are ready.", "Una lista corta para los primeros minutos. Luego mande fotos cuando esté listo.")}</p></div><div><ul class="cs-check">${CHECKLIST.map((c) => `<li class="rv">${t(c[0], c[1])}</li>`).join("")}</ul><p class="cs-check__note">${t("General guidance, not legal advice.", "Guía general, no es asesoría legal.")}</p></div></div></section>`;

  const booth = ctx.photos.enabled
    ? `<section class="cs-sec cs-booth"><div class="wrap"><div class="cs-head"><h2 class="cs-h2">${t("In the booth", "En la cabina")}</h2><p class="cs-dek">${t("Stock photos for now. The shop's own before and after pairs go here, shot from the same angle.", "Fotos de archivo por ahora. Aquí van los antes y después del taller, desde el mismo ángulo.")}</p></div>${gallery(ctx, { count: 3, tag: true, sizes: "(min-width: 760px) 33vw, 100vw", width: 800 })}</div></section>`
    : "";

  const fh = formHeading(ctx);
  const request = `<section class="cs-sec cs-sec--mist" id="${REQUEST_ID}"><div class="wrap cs-req"><div class="cs-req__side"><span class="cs-tape">${t("Photo estimate", "Presupuesto con fotos")}</span><h2 class="cs-h2" style="margin-top:1rem">${fh.title}</h2><p class="cs-dek" style="margin-top:1rem">${fh.intro}</p><ul><li>${icon("camera")}<span>${t("One wide shot, then close ups, in daylight", "Una foto amplia y luego de cerca, con luz de día")}</span></li><li>${icon("check")}<span>${t("Photos stay on your device in this concept", "En este concepto las fotos se quedan en su equipo")}</span></li></ul>${callButton(ctx, { cls: "cs-btn cs-btn--line", label: ["Or call", "O llame al"] })}</div><div class="cs-form">${form}</div></div></section>`;

  const visit = `<section class="cs-sec" id="visit"><div class="wrap cs-visit"><div class="cs-head"><h2 class="cs-h2">${t("Hours and location", "Horario y ubicación")}</h2><p class="cs-dek">${t("Bring the car by for a final look in person.", "Traiga el carro para una revisión final en persona.")}</p></div>${visitDetails(ctx)}</div></section>`;
  const faq = `<section class="cs-sec cs-sec--mist" id="faq"><div class="wrap cs-visit"><h2 class="cs-h2">${t("Questions", "Preguntas")}</h2>${faqBlock(ctx)}</div></section>`;
  const close = `<section class="cs-close"><div class="wrap cs-close__in"><div><h2 class="cs-h2">${t("Start with a few photos.", "Empiece con unas fotos.")}</h2>${ctx.tel ? `<a class="cs-close__tel" href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}</div><div class="cs-ctas">${bookButton(ctx, { cls: "cs-btn cs-btn--go", ico: "camera", label: ["Get an estimate", "Pedir presupuesto"] })}</div></div></section>`;

  return {
    css: CSS + sliderCss() + (hasArea ? diagramCss() : ""),
    body: `${header}<main>${heroHtml}${proof}${compare}${damage}${process}${services}${themes}${after}${booth}${request}${visit}${faq}${close}</main>${siteFooter(ctx)}`,
  };
}

export const direction = {
  key: "auto-collision-showroom",
  label: "Collision and paint showroom",
  status: "implemented",
  suits: ["auto-body-collision", "auto-detailing"],
  keywords: ["before/after", "before after", "collision", "estimate", "insurance", "photo", "clean", "damage"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@500&family=Schibsted+Grotesk:wght@400;500;600;700;800&display=swap",
  palettes: PALETTES,
  variants: { hero: ["compare", "booth"], services: ["panels"], proof: ["strip", "figure"] },
  imagery: { photos: true, people: ["none", "hands"], heroPeople: ["none", "hands"], heroPrefer: /booth|spray|finish|polish|wipe/ },
  callbar: "call",
  render,
};
