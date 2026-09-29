// Warm modern home (research/design-home-contractor.md, home services 2).
// Domestic and friendly, with product launch polish: a centered serif
// headline, one pill button and a text phone link, and a wide flat
// illustration of a house cut open to show the trade's system drawn in the
// accent (ducts, pipes, wiring, the door track, the kitchen). Soft 1px borders
// instead of shadows, 24 to 28px radius, and a small serif italic aside beside
// each section title. The quick home check is three toggles that suggest what
// to ask about, demo only, all CSS.

import {
  callButton,
  faqBlock,
  formHeading,
  ratingProof,
  REQUEST_ID,
  servicesConfirm,
  siteFooter,
  siteHeader,
  themesBlock,
  visitDetails,
} from "../blocks.js";
import { esc, icon } from "../shared.js";
import { hsBlurb, hsGlyph, hsGlyphKey } from "./hs-dispatch-triage.js";

const PALETTES = [
  { key: "warm-oat", name: "Oat and ember", vars: { bg: "#fbf7ef", surface: "#ffffff", ink: "#1d1b1b", muted: "#665f58", line: "#e8e0d3", primary: "#1d1b1b", "on-primary": "#fbf7ef", accent: "#ff7f5c", "accent-ink": "#a8401f", tint: "#ffe6dc", band: "#1f7a86", "on-band": "#ffffff", heat: "#ff7f5c", cool: "#2b95a3", roof: "#e9dccb", wall: "#fffdf8", ground: "#e6dccb" } },
  { key: "warm-mint", name: "Mint cream", vars: { bg: "#f4f7f0", surface: "#ffffff", ink: "#102a1e", muted: "#4f5e54", line: "#dde5d8", primary: "#1f5f3f", "on-primary": "#ffffff", accent: "#f2b134", "accent-ink": "#7a5200", tint: "#fdf0cf", band: "#1f5f3f", "on-band": "#f4f7f0", heat: "#ef8f3a", cool: "#3a8fb7", roof: "#d6e4d2", wall: "#fbfdf9", ground: "#dfe8d8" } },
  { key: "warm-lilac", name: "Dusk lilac", vars: { bg: "#f6f3f8", surface: "#ffffff", ink: "#231b2e", muted: "#625a6d", line: "#e4dcea", primary: "#5b3fd0", "on-primary": "#ffffff", accent: "#ffb38a", "accent-ink": "#9a4a1c", tint: "#ffe8da", band: "#231b2e", "on-band": "#f6f3f8", heat: "#ff9b6a", cool: "#6f8cff", roof: "#e4dcea", wall: "#fdfcfe", ground: "#e6e0ec" } },
];

// The house, shared by every trade: two floors, four rooms and a garage, in
// ink line work over two flat fills. Each trade adds its system on top.
const HOUSE_BASE = `
<path class="wm-ground" d="M0 386h1200v34H0z"/>
<g class="wm-tree"><circle cx="110" cy="286" r="58"/><circle cx="160" cy="316" r="40"/><path class="wm-line" d="M118 340v46M150 350v36"/></g>
<g class="wm-tree"><circle cx="1110" cy="300" r="50"/><circle cx="1068" cy="330" r="34"/><path class="wm-line" d="M1104 346v40M1070 360v26"/></g>
<path class="wm-roof" d="M236 168L512 44l276 124z"/>
<path class="wm-wall" d="M262 164h500v222H262z"/>
<path class="wm-roof" d="M748 232l132-54 132 54z"/>
<path class="wm-wall" d="M762 228h236v158H762z"/>
<path class="wm-line" d="M236 168L512 44l276 124M262 164v222h736V228M748 232l132-54 132 54M262 276h500M512 164v222M762 164v222"/>
<path class="wm-attic" d="M300 164l212-96 212 96"/>
<path class="wm-line wm-thin" d="M790 262h180v124M790 262v124M790 292h180M790 322h180M790 352h180"/>
<g class="wm-line wm-thin"><path d="M300 360h120v26M312 360v-22h96v22"/><path d="M300 250h100v-26H300zM300 224v-12h36v12"/><path d="M552 250h40v-50h-40zM600 250h26v-36M542 386v-60h52v60M548 346h40"/><path d="M660 386v-72h70v72M660 344h70M668 330h12"/></g>
<g class="wm-window"><rect x="330" y="186" width="54" height="40" rx="4"/><rect x="620" y="186" width="54" height="40" rx="4"/><rect x="440" y="300" width="46" height="36" rx="4"/></g>
`;

// Trade systems over the house. Stroke color comes from the class.
const SYSTEMS = {
  hvac: `
<rect class="wm-sys-fill" x="176" y="344" width="58" height="42" rx="6"/><circle class="wm-sys" cx="205" cy="365" r="13"/>
<path class="wm-sys" d="M234 360h28M262 360V150h170"/>
<rect class="wm-sys-fill" x="432" y="122" width="72" height="34" rx="6"/>
<path class="wm-cool" d="M504 139h210M600 139v70M350 150v58M690 139v70M560 276v-20h-60v20"/>
<path class="wm-heat" d="M432 130h-120v146M312 276v8"/>
<g class="wm-cool wm-thin"><path d="M338 212h24M588 212h24M678 212h24"/><path d="M342 220c4 6 12 6 16 0M592 220c4 6 12 6 16 0M682 220c4 6 12 6 16 0"/></g>
<g class="wm-heat wm-thin"><path d="M300 286c6-6 12 6 18 0"/></g>`,
  plumbing: `
<rect class="wm-sys-fill" x="720" y="316" width="30" height="70" rx="12"/>
<path class="wm-sys" d="M700 420v-34M700 386V300h-40M700 300v-60h-100v10M700 240h20v76"/>
<path class="wm-cool" d="M735 316V260h-50v-20"/>
<path class="wm-sys wm-dash" d="M640 330v70h-200l-60 20"/>
<path class="wm-sys" d="M586 250v-30M612 250v-36"/>
<g class="wm-sys wm-thin"><path d="M700 408l-12 8M700 408l12 8"/></g>`,
  electrical: `
<rect class="wm-sys-fill" x="966" y="290" width="22" height="34" rx="3"/>
<path class="wm-sys" d="M977 290V250H762M740 250V176H300M512 176v10M396 176v6M640 176v6M977 324v36h-10"/>
<path class="wm-sys" d="M740 250v34H300v6M396 284v8M640 284v8"/>
<g class="wm-glow"><circle cx="396" cy="192" r="9"/><circle cx="640" cy="192" r="9"/><circle cx="396" cy="300" r="9"/><circle cx="640" cy="300" r="9"/></g>
<rect class="wm-sys-fill" x="940" y="344" width="20" height="30" rx="4"/>
<path class="wm-sys wm-thin" d="M950 374v8c0 6 8 6 8 0"/>`,
  "garage-door": `
<rect class="wm-sys-fill wm-soft" x="790" y="262" width="180" height="124"/>
<path class="wm-sys" d="M790 262h180v124M790 262v124M790 292h180M790 322h180M790 352h180"/>
<path class="wm-sys" d="M784 386V246h16M976 386V246h-16M800 246h160"/>
<path class="wm-sys wm-spring" d="M820 240c4-8 8 8 12 0s8 8 12 0 8 8 12 0 8 8 12 0M900 240c4-8 8 8 12 0s8 8 12 0 8 8 12 0 8 8 12 0"/>
<rect class="wm-sys-fill" x="856" y="232" width="48" height="16" rx="4"/>`,
  "appliance-repair": `
<rect class="wm-sys-fill" x="660" y="314" width="70" height="72" rx="4"/>
<path class="wm-sys" d="M660 344h70M668 330h12"/>
<rect class="wm-sys-fill" x="542" y="326" width="52" height="60" rx="4"/>
<path class="wm-sys" d="M548 346h40M556 336h4M566 336h4M576 336h4"/>
<rect class="wm-sys-fill" x="892" y="330" width="46" height="56" rx="4"/><circle class="wm-sys" cx="915" cy="360" r="13"/>
<rect class="wm-sys-fill" x="838" y="330" width="46" height="56" rx="4"/><circle class="wm-sys" cx="861" cy="360" r="13"/>
<g class="wm-sys wm-thin"><path d="M620 300l10-10M740 300l-10-10M912 318v-10M864 318v-10"/></g>`,
  general: `
<path class="wm-sys" d="M236 168L512 44l276 124M748 232l132-54 132 54"/>
<g class="wm-glow"><rect x="330" y="186" width="54" height="40" rx="4"/><rect x="620" y="186" width="54" height="40" rx="4"/><rect x="440" y="300" width="46" height="36" rx="4"/></g>
<g class="wm-sys wm-thin"><circle cx="390" cy="120" r="14"/><path d="M384 120l5 5 8-10"/><circle cx="880" cy="206" r="14"/><path d="M874 206l5 5 8-10"/></g>`,
};

const CAPTIONS = {
  hvac: ["Illustration: the system from the outdoor unit to every room.", "Ilustración: el sistema de la unidad exterior a cada cuarto."],
  plumbing: ["Illustration: supply lines, the water heater and the drain to the street.", "Ilustración: tuberías, el boiler y el drenaje a la calle."],
  electrical: ["Illustration: the panel, the circuits and every light and outlet.", "Ilustración: el centro de carga, los circuitos y cada luz y contacto."],
  "garage-door": ["Illustration: the door, its springs, the track and the opener.", "Ilustración: la puerta, sus resortes, el riel y el motor."],
  "appliance-repair": ["Illustration: the kitchen and the laundry, the usual suspects.", "Ilustración: la cocina y el cuarto de lavado, los sospechosos de siempre."],
  general: ["Illustration: the whole house, one room at a time.", "Ilustración: toda la casa, un cuarto a la vez."],
};

function cutaway(ctx) {
  const key = SYSTEMS[ctx.categoryKey] ? ctx.categoryKey : "general";
  const cap = CAPTIONS[key];
  return `<figure class="wm-art"><svg viewBox="0 0 1200 420" role="img"${ctx.i18n.aria(cap[0], cap[1])} focusable="false" preserveAspectRatio="xMidYMax meet">${HOUSE_BASE}<g class="wm-system">${SYSTEMS[key]}</g></svg><figcaption>${ctx.t(cap[0], cap[1])}</figcaption></figure>`;
}

// Yes or no questions that point at a service, by glyph. General wording.
const CHECKS = {
  cool: ["Does the house struggle to cool on hot afternoons?", "¿La casa batalla para enfriar en las tardes de calor?"],
  heat: ["Are some rooms cold while the heat is on?", "¿Hay cuartos fríos con la calefacción prendida?"],
  unit: ["Do repairs on the system keep adding up?", "¿Las reparaciones del equipo se siguen acumulando?"],
  gauge: ["Has it been a while since anyone looked at the system?", "¿Hace tiempo que nadie revisa el equipo?"],
  thermostat: ["Is the thermostat hard to read or set?", "¿El termostato es difícil de leer o programar?"],
  duct: ["Is there dust around the vents?", "¿Hay polvo alrededor de las rejillas?"],
  leak: ["Any damp spots under sinks or on ceilings?", "¿Manchas húmedas bajo los lavabos o en los techos?"],
  drain: ["Does any drain empty slowly?", "¿Algún drenaje se vacía lento?"],
  tank: ["Does the hot water run out early?", "¿El agua caliente se acaba pronto?"],
  faucet: ["Is a toilet running or a faucet dripping?", "¿Una taza corre o una llave gotea?"],
  sewer: ["Do several drains back up at once?", "¿Se tapan varios drenajes a la vez?"],
  pipes: ["Is the water pressure weak or the water off color?", "¿La presión es baja o el agua sale de otro color?"],
  panel: ["Do breakers trip more than they should?", "¿Las pastillas se botan más de la cuenta?"],
  outlet: ["Is an outlet dead or warm to the touch?", "¿Un contacto no sirve o se siente tibio?"],
  bulb: ["Is there a room that never has enough light?", "¿Hay un cuarto que nunca tiene suficiente luz?"],
  fan: ["Is there a room that could use a ceiling fan?", "¿Hay un cuarto que necesita ventilador de techo?"],
  bolt: ["Do lights flicker or dim?", "¿Las luces parpadean o bajan?"],
  plug: ["Is an electric car in the plans?", "¿Tiene planes de un carro eléctrico?"],
  door: ["Does the door stick, grind or sag?", "¿La puerta se atora, rechina o se cae?"],
  spring: ["Does the door feel heavy to lift by hand?", "¿La puerta se siente pesada al subirla a mano?"],
  opener: ["Does the opener hum, reverse or ignore the remote?", "¿El motor zumba, se regresa o no hace caso?"],
  roller: ["Is the door noisy or crooked on its track?", "¿La puerta hace ruido o va chueca en el riel?"],
  fridge: ["Is the fridge warmer than it used to be?", "¿El refri enfría menos que antes?"],
  washer: ["Does the washer leave clothes soaking wet?", "¿La lavadora deja la ropa empapada?"],
  oven: ["Does the oven take longer to heat up?", "¿El horno tarda más en calentar?"],
  dishwasher: ["Do dishes come out with spots or food?", "¿Los trastes salen con manchas o comida?"],
  ice: ["Has the ice maker slowed down?", "¿La fábrica de hielo ya casi no hace hielo?"],
  calendar: ["Is a regular check overdue?", "¿Ya toca una revisión regular?"],
};

function homeChecks(ctx) {
  const out = [];
  for (const s of ctx.services) {
    const q = CHECKS[hsGlyphKey(s)];
    if (q && !out.some((o) => o.q === q)) out.push({ s, q });
    if (out.length === 3) break;
  }
  for (const s of ctx.services) {
    if (out.length === 3) break;
    if (!out.some((o) => o.s === s)) out.push({ s, q: [`Is ${s.toLowerCase()} on your list this season?`, `¿Tiene pendiente ${s.toLowerCase()} esta temporada?`] });
  }
  return out;
}

const STEPS = [
  { title: ["Tell us what is going on", "Cuéntenos qué pasa"], body: ["Call, or send a few lines about the problem and the room it is in.", "Llame, o mande unas líneas sobre el problema y el cuarto donde está."] },
  { title: ["Pick a time", "Elija un horario"], body: ["Settle on a visit window that suits the household.", "Acuerden un horario de visita que le funcione a la casa."] },
  { title: ["Hear the options", "Conozca las opciones"], body: ["Someone looks at it in person and talks through the choices before work starts.", "Alguien lo revisa en persona y platica las opciones antes de empezar."] },
];

const CSS = `
:root{--display:"Young Serif",Georgia,serif;--body:"Onest",system-ui,sans-serif;--aside:"Gelasio",Georgia,serif;--radius:14px;--btn-radius:999px;--chip-radius:999px;--max:1180px;--ease:cubic-bezier(.22,1,.36,1);--field:var(--surface);--field-line:var(--line);--star:var(--accent-ink);--lang-fg:var(--ink);--lang-on:var(--bg)}
body{font-size:1.0625rem;line-height:1.65}
.wm-aside{font-family:var(--aside);font-style:italic;font-weight:400;color:var(--muted);font-size:1.05rem;line-height:1.4}

.b-hd{position:sticky;top:0;z-index:10;background:color-mix(in oklab,var(--bg) 90%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.b-hd__in{display:flex;align-items:center;gap:1.25rem;min-height:4.5rem}
.b-brand{margin-right:auto;font-family:var(--display);font-size:1.3rem;line-height:1.1;text-decoration:none;max-width:55vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.b-nav{display:none;gap:1.75rem;font-weight:500;font-size:.98rem}
.b-nav a{text-decoration:none;color:var(--muted)}
.b-nav a:hover{color:var(--ink)}
@media (min-width:1020px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:1rem}
.b-hd__tel{display:none;align-items:center;gap:.4rem;font-weight:600;text-decoration:none}
@media (min-width:720px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.75rem;padding:0 1.25rem;border-radius:999px;background:var(--primary);color:var(--on-primary);font-weight:600;text-decoration:none;transition:transform .3s var(--ease)}
.b-hd__cta:hover{transform:translateY(-1px)}

.wm-hero{position:relative;padding:clamp(2.5rem,5vw,4rem) 0 0;overflow:hidden}
.wm-hero__copy{text-align:center;display:grid;justify-items:center}
.wm-where{display:inline-flex;align-items:center;gap:.5rem;padding:.4rem .9rem;border:1px solid var(--line);border-radius:999px;background:var(--surface);font-size:.92rem;font-weight:500;color:var(--muted)}
.wm-where b{color:var(--ink);font-weight:600}
.wm-h1{margin-top:1.1rem;font-family:var(--display);font-weight:400;font-size:clamp(2.5rem,5.4vw,4.4rem);line-height:1.02;letter-spacing:-.02em;max-width:15ch}
.wm-sub{margin-top:1.25rem;max-width:46ch;color:var(--muted);font-size:1.15rem}
.wm-ctas{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:1rem 1.5rem;margin-top:2rem}
.wm-pill{display:inline-flex;align-items:center;gap:.6rem;min-height:3.4rem;padding:0 1.6rem;border-radius:999px;background:var(--primary);color:var(--on-primary);font-weight:600;font-size:1.05rem;text-decoration:none;transition:transform .35s var(--ease),box-shadow .35s var(--ease)}
.wm-pill:hover{transform:translateY(-2px);box-shadow:0 10px 24px -14px var(--primary)}
.wm-pill .b-arrow{display:inline-flex;transition:transform .35s var(--ease)}
.wm-pill:hover .b-arrow{transform:translateX(3px)}
.wm-tel{display:inline-flex;align-items:center;gap:.45rem;font-weight:600;text-decoration:underline;text-decoration-color:color-mix(in oklab,var(--ink) 30%,transparent);text-underline-offset:.3em}
.wm-hero .b-rating{display:inline-flex;align-items:center;gap:.55rem;margin-top:1.5rem;padding:.45rem .95rem;border-radius:999px;background:var(--tint);font-size:.92rem;font-weight:500}
.wm-hero .b-rating__num{font-weight:700}
.wm-hero .stars{width:5.25rem;height:1.05rem}
.wm-art{margin:clamp(2rem,5vw,3.5rem) 0 0;position:relative}
.wm-art svg{width:100%;height:auto}
.wm-art figcaption{position:absolute;right:0;bottom:3rem;max-width:18rem;padding:.5rem .9rem;border-radius:12px;background:var(--surface);border:1px solid var(--line);font-family:var(--aside);font-style:italic;font-size:.9rem;color:var(--muted)}
@media (max-width:759.98px){.wm-art figcaption{position:static;margin:.5rem auto 0;max-width:none;background:none;border:0;text-align:center}.wm-art{margin-inline:-1rem}}
.wm-hero--side .wm-hero__grid{display:grid;gap:2rem;align-items:end}
@media (min-width:980px){.wm-hero--side .wm-hero__grid{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)}.wm-hero--side .wm-hero__copy{text-align:left;justify-items:start;padding-bottom:4rem}.wm-hero--side .wm-ctas{justify-content:flex-start}.wm-hero--side .wm-art figcaption{bottom:1rem}}
.wm-ground{fill:var(--ground)}
.wm-tree circle{fill:color-mix(in oklab,var(--band) 22%,var(--bg))}
.wm-roof{fill:var(--roof)}
.wm-wall{fill:var(--wall)}
.wm-window rect{fill:color-mix(in oklab,var(--cool) 16%,var(--wall));stroke:var(--ink);stroke-width:2.5}
.wm-line,.wm-line path{fill:none;stroke:var(--ink);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.wm-thin,.wm-thin path{stroke-width:2}
.wm-attic{fill:none;stroke:var(--ink);stroke-width:1.5;stroke-dasharray:4 7;opacity:.45}
.wm-system .wm-sys,.wm-system .wm-sys path{fill:none;stroke:var(--accent-ink);stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
.wm-system .wm-thin,.wm-system .wm-thin path{stroke-width:2.5}
.wm-system .wm-sys-fill{fill:var(--accent);stroke:var(--ink);stroke-width:2.5}
.wm-system .wm-soft{fill:color-mix(in oklab,var(--accent) 35%,var(--wall))}
.wm-system .wm-dash{stroke-dasharray:10 8}
.wm-system .wm-cool,.wm-system .wm-cool path{fill:none;stroke:var(--cool);stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
.wm-system .wm-heat,.wm-system .wm-heat path{fill:none;stroke:var(--heat);stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
.wm-system .wm-glow circle,.wm-system .wm-glow rect{fill:var(--accent);stroke:var(--ink);stroke-width:2.5}
.wm-system{animation:kj-fade 1.2s .25s var(--ease) both}
.wm-why__themes{margin-top:2rem}
@media (min-width:900px){.wm-why--solo .wrap{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:3rem}.wm-why--solo .wm-head{margin:0}}
.wm-why .b-rating{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem 1.5rem}
.wm-why .b-rating__num{font-family:var(--display);font-size:clamp(3.5rem,8vw,5.5rem);line-height:1}
.wm-why .b-rating__side{display:grid;gap:.3rem}
.wm-why .b-rating__count{font-weight:600}
.wm-why .b-rating__cap{flex-basis:100%;font-family:var(--aside);font-style:italic;color:var(--muted)}

.wm-sec{padding:clamp(4rem,9vw,7rem) 0}
.wm-sec--tint{background:var(--surface);border-block:1px solid var(--line)}
.wm-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:.5rem 1.25rem;margin-bottom:clamp(2rem,4vw,3rem)}
.wm-h2{font-family:var(--display);font-weight:400;font-size:clamp(2rem,4.2vw,3.2rem);line-height:1.05;letter-spacing:-.015em;max-width:20ch}
.wm-head .wm-aside{max-width:30ch}

.wm-steps{display:grid;gap:1rem;counter-reset:st}
@media (min-width:860px){.wm-steps{grid-template-columns:repeat(3,minmax(0,1fr));gap:1.25rem}}
.wm-steps li{position:relative;padding:1.75rem 1.75rem 2rem;border:1px solid var(--line);border-radius:28px;background:var(--surface)}
.wm-steps .step-n{display:grid;place-items:center;width:3rem;height:3rem;border-radius:50%;background:var(--tint);color:var(--accent-ink);font-family:var(--display);font-size:1.4rem}
.wm-steps h3{margin-top:1.25rem;font-family:var(--display);font-weight:400;font-size:1.5rem;line-height:1.15}
.wm-steps p{margin-top:.5rem;color:var(--muted)}
.wm-steps li:nth-child(2){background:var(--tint);border-color:transparent}
.wm-steps li:nth-child(2) .step-n{background:var(--surface)}

.wm-svc{display:grid;gap:1rem;grid-template-columns:1fr}
@media (min-width:640px){.wm-svc{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:980px){.wm-svc{grid-template-columns:repeat(3,minmax(0,1fr))}.wm-svc li:last-child:nth-child(3n){grid-column:span 2}.wm-svc li:last-child:nth-child(3n+2){grid-column:1/-1}}
@media (min-width:640px) and (max-width:979.98px){.wm-svc li:last-child:nth-child(even){grid-column:1/-1}}
.wm-svc li{display:grid;align-content:start;gap:.75rem;padding:1.5rem;border:1px solid var(--line);border-radius:24px;background:var(--bg);transition:border-color .3s,transform .4s var(--ease)}
.wm-svc li:hover{border-color:var(--ink);transform:translateY(-3px)}
.wm-svc li:first-child{grid-column:1/-1;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:1.25rem;background:var(--tint);border-color:transparent}
@media (max-width:640px){.wm-svc li:first-child{grid-template-columns:auto minmax(0,1fr)}.wm-svc li:first-child .wm-svc__go{grid-column:1/-1}}
.wm-ico{display:grid;place-items:center;width:3.25rem;height:3.25rem;border-radius:50%;background:var(--tint);color:var(--accent-ink)}
.wm-svc li:first-child .wm-ico{background:var(--surface);width:4rem;height:4rem}
.wm-ico .hs-glyph{width:1.5rem;height:1.5rem}
.wm-svc h3{font-family:var(--display);font-weight:400;font-size:1.35rem;line-height:1.15}
.wm-svc p{color:var(--muted);font-size:.98rem}
.wm-svc__go{justify-self:start;display:inline-flex;align-items:center;gap:.35rem;font-weight:600;font-size:.95rem;text-underline-offset:.3em}
.b-svc-confirm{margin-top:1.5rem;color:var(--muted);font-size:.95rem}
.svc-note{margin-top:.3rem;color:var(--muted);font-size:.92rem}

.wm-why .b-themes{display:grid;gap:0}
.wm-why .b-themes li{display:flex;gap:1rem;align-items:baseline;padding:1.1rem 0;border-top:1px solid var(--line);font-family:var(--display);font-size:clamp(1.4rem,2.6vw,2rem);line-height:1.2}
.wm-why .b-themes li:last-child{border-bottom:1px solid var(--line)}
.wm-why .b-themes li::before{content:"";flex:none;width:.7rem;height:.7rem;border-radius:50%;background:var(--accent);transform:translateY(-.2rem)}
.b-themes__note{margin-top:1rem;font-family:var(--aside);font-style:italic;color:var(--muted)}

.wm-check{display:grid;gap:2rem;align-items:start}
@media (min-width:900px){.wm-check{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:3rem}}
.wm-toggles{display:grid;gap:.75rem}
.wm-toggle{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;align-items:center;padding:1.1rem 1.25rem;border:1px solid var(--line);border-radius:20px;background:var(--bg);cursor:pointer;font-weight:500}
.wm-toggle input{position:absolute;opacity:0;width:1px;height:1px}
.wm-switch{position:relative;width:3.1rem;height:1.8rem;border-radius:999px;background:var(--line);transition:background-color .3s var(--ease)}
.wm-switch::after{content:"";position:absolute;top:.2rem;left:.2rem;width:1.4rem;height:1.4rem;border-radius:50%;background:var(--surface);box-shadow:0 1px 3px rgb(0 0 0 / .2);transition:transform .35s var(--ease)}
.wm-toggle input:checked~.wm-switch{background:var(--primary)}
.wm-toggle input:checked~.wm-switch::after{transform:translateX(1.3rem)}
.wm-toggle input:focus-visible~.wm-switch{outline:3px solid var(--primary);outline-offset:2px}
.wm-toggle:has(input:checked){border-color:var(--ink)}
.wm-result{padding:1.5rem;border-radius:24px;background:var(--band);color:var(--on-band)}
.wm-result h3{font-family:var(--display);font-weight:400;font-size:1.5rem}
.wm-result ul{display:grid;gap:.5rem;margin-top:1rem}
.wm-result li{display:none;align-items:center;gap:.6rem;font-weight:500}
.wm-result li .ico{flex:none}
.wm-result .wm-none{display:block;opacity:.85}
${[0, 1, 2].map((i) => `body:has(#wm-q-${i}:checked) .wm-result [data-q="${i}"]{display:flex}`).join("")}
body:has(.wm-toggle input:checked) .wm-result .wm-none{display:none}
.wm-result .wm-pill{margin-top:1.25rem;background:var(--on-band);color:var(--band)}
.wm-demo{margin-top:.9rem;font-size:.88rem;opacity:.85}
.wm-room{position:relative;margin-top:1rem;border-radius:28px;overflow:hidden;aspect-ratio:16/10}
.wm-room .b-photo{height:100%}

.wm-req{display:grid;gap:2.5rem;align-items:start}
@media (min-width:980px){.wm-req{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}.wm-req__side{position:sticky;top:7rem}}
.wm-req__side p{margin-top:1rem;color:var(--muted);max-width:40ch}
.wm-req__side .wm-tel{margin-top:1.5rem}
.wm-formcard{padding:clamp(1.25rem,3.5vw,2.5rem);border:1px solid var(--line);border-radius:28px;background:var(--surface)}
.f-input{border-width:1px;border-radius:14px;background:var(--bg)}
.f-input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 4px color-mix(in oklab,var(--primary) 16%,transparent)}
.f-chip>span{border-width:1px;background:var(--bg)}
.f-chip input:checked+span{background:var(--primary);color:var(--on-primary);border-color:var(--primary)}
.f-submit{border-radius:999px;padding-inline:1.8rem;min-height:3.4rem}
.f-status{border-width:1px;border-radius:16px}
.f-drop{border-radius:18px}

.wm-area{display:grid;gap:2rem}
@media (min-width:900px){.wm-area{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:3rem}}
.wm-area__map{position:relative;border-radius:28px;background:var(--tint);min-height:15rem;display:grid;place-items:center;overflow:hidden}
.wm-area__map svg{width:100%;height:100%;position:absolute;inset:0}
.wm-area__map .wm-ring{fill:none;stroke:var(--accent-ink);stroke-width:1.5;stroke-dasharray:3 6;opacity:.6}
.wm-area__map .wm-pin{fill:var(--primary)}
.wm-area__label{position:relative;padding:.6rem 1.1rem;border-radius:999px;background:var(--surface);border:1px solid var(--line);font-weight:600;transform:translateY(3.2rem)}
.wm-area__tbc{margin-top:1rem;font-family:var(--aside);font-style:italic;color:var(--muted)}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem minmax(0,1fr);gap:1rem;padding:.9rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:1px solid var(--line)}
.facts dt{color:var(--muted)}
.facts dd{margin:0;font-weight:600}
.b-visit__pending{display:grid;gap:.35rem;margin-top:1rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.45rem;margin-top:1.25rem;font-weight:600}

.faq details{border-top-width:1px}
.faq details:last-child{border-bottom-width:1px}
.faq summary{font-weight:600}
.wm-faq{display:grid;gap:2rem}
@media (min-width:900px){.wm-faq{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}}

.wm-final{padding:clamp(1rem,3vw,2rem) 0 clamp(4rem,8vw,6rem)}
.wm-final__card{display:grid;gap:1.5rem;justify-items:center;text-align:center;padding:clamp(3rem,7vw,5rem) 1.5rem;border-radius:32px;background:var(--band);color:var(--on-band)}
.wm-final h2{font-family:var(--display);font-weight:400;font-size:clamp(2.2rem,5vw,3.8rem);line-height:1.05;max-width:18ch}
.wm-final .wm-pill{background:var(--on-band);color:var(--band)}
.wm-final .wm-tel{color:var(--on-band);text-decoration-color:color-mix(in oklab,var(--on-band) 45%,transparent);font-size:1.15rem}

.b-ft{padding:3rem 0;border-top:1px solid var(--line)}
.b-ft__name{font-family:var(--display);font-size:1.5rem}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.4rem 2rem;margin-top:.6rem;color:var(--muted)}
.legal{margin-top:1.5rem;color:var(--muted);font-size:.88rem}
.stock-credits{margin-top:.4rem}
.b-float{border-radius:999px}
@media (max-width:479.98px){.b-brand{max-width:80vw}}
@media (max-width:759.98px){.wm-art{overflow:hidden}.wm-art svg{width:150%;max-width:none;margin-left:-25%}}
`;

function render(ctx) {
  const t = ctx.t;
  const side = ctx.variants.hero === "side";
  const verbPair = ctx.kind === "emergency" ? ["Request a visit", "Pedir una visita"] : ["Send a request", "Enviar solicitud"];
  const verb = ctx.copyOr("ctaPrimary", verbPair);
  const pill = (label = verb) => `<a class="wm-pill" href="#${REQUEST_ID}"><span>${label}</span><span class="b-arrow" aria-hidden="true">${icon("arrow")}</span></a>`;
  const tel = (cls = "wm-tel") => callButton(ctx, { cls, label: ["Or call", "O llame al"] });

  const header = siteHeader(ctx, {
    cta: verbPair,
    nav: [
      ...(ctx.services.length ? [{ href: "#services", label: ["Services", "Servicios"] }] : []),
      { href: "#check", label: ["Home check", "Revisión"] },
      { href: "#area", label: ["Area", "Zona"] },
      { href: "#faq", label: ["Questions", "Preguntas"] },
    ],
  });

  const heroCopy = `<div class="wm-hero__copy"><p class="wm-where"><b>${ctx.name}</b><span>${esc(ctx.cityState || ctx.placeRaw)}</span></p><h1 class="wm-h1">${ctx.copyOr("headline", ctx.promise)}</h1><p class="wm-sub">${ctx.about || t("Tell them what is going on at home and pick a time that suits you.", "Cuénteles qué pasa en casa y elija un horario que le quede.")}</p><div class="wm-ctas">${pill()}${tel()}</div>${ratingProof(ctx, "chip")}</div>`;
  const hero = `<section class="wm-hero wm-hero--${side ? "side" : "center"}" id="top"><div class="wrap ${side ? "wm-hero__grid" : ""}">${heroCopy}${cutaway(ctx)}</div></section>`;

  const proof = ctx.variants.proof === "figure" ? "figure" : "strip";
  const steps = `<section class="wm-sec wm-sec--tint"><div class="wrap"><div class="wm-head"><h2 class="wm-h2">${t("Three steps, no guesswork", "Tres pasos, sin adivinar")}</h2><p class="wm-aside">${t("how a visit usually goes", "cómo suele ser una visita")}</p></div><ol class="wm-steps">${STEPS.map((s, i) => `<li class="rv"><span class="step-n" aria-hidden="true">${i + 1}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  const services = ctx.services.length
    ? `<section class="wm-sec" id="services"><div class="wrap"><div class="wm-head"><h2 class="wm-h2">${t("What they can help with", "En qué le pueden ayudar")}</h2><p class="wm-aside">${t("pick the closest, or just describe it", "elija lo más cercano, o solo descríbalo")}</p></div><ul class="wm-svc">${ctx.services.map((s) => { const b = hsBlurb(s); return `<li class="rv"><span class="wm-ico">${hsGlyph(s, { stroke: 1.8 })}</span><div><h3>${esc(s)}</h3><p>${t(b[0], b[1])}</p></div><a class="wm-svc__go" href="#${REQUEST_ID}">${t("Ask about this", "Preguntar")}${icon("arrow")}</a></li>`; }).join("")}</ul>${servicesConfirm(ctx)}</div></section>`
    : "";

  const themes = themesBlock(ctx);
  const why = `<section class="wm-sec wm-sec--tint wm-why${themes ? "" : " wm-why--solo"}"><div class="wrap"><div class="wm-head"><h2 class="wm-h2">${t("Why neighbors call", "Por qué llaman los vecinos")}</h2><p class="wm-aside">${t(`in ${ctx.cityRaw || "the area"}, on Google`, `en ${ctx.cityRaw || "la zona"}, en Google`)}</p></div>${ratingProof(ctx, proof)}${themes ? `<div class="wm-why__themes">${themes}</div>` : ""}</div></section>`;

  const checks = homeChecks(ctx);
  const room = ctx.photos.next((p) => /living|room/.test(p.id));
  const roomHtml = room ? `<div class="wm-room">${ctx.photos.img(room, { sizes: "(min-width: 900px) 45vw, 100vw", width: 1200 })}<span class="stock-tag">${t("Stock photo", "Foto de archivo")}</span></div>` : "";
  const check = checks.length
    ? `<section class="wm-sec" id="check"><div class="wrap"><div class="wm-head"><h2 class="wm-h2">${t("Quick home check", "Revisión rápida de la casa")}</h2><p class="wm-aside">${t("three questions, thirty seconds", "tres preguntas, treinta segundos")}</p></div><div class="wm-check"><div class="wm-toggles">${checks.map((c, i) => `<label class="wm-toggle"><span>${t(c.q[0], c.q[1])}</span><input type="checkbox" id="wm-q-${i}"><span class="wm-switch" aria-hidden="true"></span></label>`).join("")}${roomHtml}</div><div class="wm-result" aria-live="polite"><h3>${t("Worth asking about", "Vale la pena preguntar por")}</h3><ul><li class="wm-none">${t("Flip a switch and a suggestion shows up here.", "Mueva un interruptor y aquí aparece una sugerencia.")}</li>${checks.map((c, i) => `<li data-q="${i}">${icon("check")}<span>${esc(c.s)}</span></li>`).join("")}</ul>${pill()}<p class="wm-demo">${t("A demo of the idea. Nothing is saved or sent.", "Una muestra de la idea. No se guarda ni se envía nada.")}</p></div></div></div></section>`
    : "";

  const form = formHeading(ctx);
  const request = `<section class="wm-sec wm-sec--tint" id="${REQUEST_ID}"><div class="wrap wm-req"><div class="wm-req__side"><h2 class="wm-h2">${form.title}</h2><p>${form.intro}</p>${tel()}</div><div class="wm-formcard">${ctx.form}</div></div></section>`;

  const area = `<section class="wm-sec" id="area"><div class="wrap"><div class="wm-head"><h2 class="wm-h2">${t("Where they work", "Dónde trabajan")}</h2><p class="wm-aside">${t("and when to call", "y cuándo llamar")}</p></div><div class="wm-area"><div><div class="wm-area__map" aria-hidden="true"><svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice"><circle class="wm-ring" cx="200" cy="120" r="60"/><circle class="wm-ring" cx="200" cy="120" r="110"/><circle class="wm-ring" cx="200" cy="120" r="160"/><path class="wm-pin" d="M200 132s-18-17-18-31a18 18 0 0 1 36 0c0 14-18 31-18 31z"/><circle cx="200" cy="101" r="6" fill="var(--surface)"/></svg><span class="wm-area__label">${esc(ctx.cityRaw || ctx.placeRaw)}</span></div><p class="wm-area__tbc">${t("Nearby towns they cover to confirm with the owner.", "Las zonas cercanas que cubren, por confirmar con el dueño.")}</p></div>${visitDetails(ctx)}</div></div></section>`;

  const faq = `<section class="wm-sec wm-sec--tint" id="faq"><div class="wrap wm-faq"><div class="wm-head"><h2 class="wm-h2">${t("Good questions", "Buenas preguntas")}</h2><p class="wm-aside">${t("asked before every visit", "antes de cada visita")}</p></div>${faqBlock(ctx)}</div></section>`;

  const final = `<section class="wm-final"><div class="wrap"><div class="wm-final__card"><h2>${t("Let's get the house back to normal.", "Volvamos la casa a la normalidad.")}</h2>${pill()}${tel()}</div></div></section>`;

  return {
    css: CSS,
    body: `${header}<main>${hero}${steps}${services}${why}${check}${request}${area}${faq}${final}</main>${siteFooter(ctx)}`,
  };
}

export const direction = {
  key: "hs-warm-modern",
  label: "Warm modern home",
  status: "implemented",
  suits: ["hvac", "electrical", "appliance-repair", "plumbing", "garage-door", "general"],
  keywords: ["family", "friendly", "modern", "home", "clean"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Young+Serif&family=Onest:wght@400;500;600;700&family=Gelasio:ital,wght@1,400&display=swap",
  palettes: PALETTES,
  variants: { hero: ["center", "side"], services: ["cards"], proof: ["strip", "figure"] },
  imagery: { photos: true, people: ["none"], heroPeople: ["none"], heroPrefer: /living/ },
  callbar: "call",
  render,
};
