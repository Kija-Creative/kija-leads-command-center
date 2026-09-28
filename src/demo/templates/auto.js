// Auto: "service bay". Condensed shop signage type, a work order for the
// service list, a gauge that reads the real Google rating, and a line drawn
// vehicle. For repair, body, tire, exhaust, diesel, towing and detailing shops.

import { esc, icon, starsSvg } from "../shared.js";
import { directionsLink, factsList, faqList, footerLegal, reviewsText, servicesNote, stepsList, themesNote } from "../parts.js";

const PALETTES = [
  {
    key: "graphite",
    name: "Graphite and safety yellow",
    vars: { bg: "oklch(0.19 0.006 250)", surface: "oklch(0.235 0.008 250)", ink: "oklch(0.96 0.004 250)", muted: "oklch(0.79 0.01 250)", line: "oklch(0.37 0.01 250)", primary: "oklch(0.87 0.17 94)", "on-primary": "oklch(0.2 0.02 90)", accent: "oklch(0.7 0.19 35)", star: "oklch(0.87 0.17 94)", sheet: "oklch(0.96 0.004 250)", "on-sheet": "oklch(0.2 0.01 250)", "sheet-muted": "oklch(0.42 0.01 250)", "sheet-line": "oklch(0.84 0.006 250)" },
  },
  {
    key: "enamel",
    name: "White enamel and signal red",
    vars: { bg: "oklch(0.985 0 0)", surface: "oklch(0.945 0.004 25)", ink: "oklch(0.2 0.012 25)", muted: "oklch(0.43 0.012 25)", line: "oklch(0.86 0.008 25)", primary: "oklch(0.55 0.21 28)", "on-primary": "oklch(0.99 0 0)", accent: "oklch(0.55 0.21 28)", star: "oklch(0.55 0.21 28)", sheet: "oklch(0.2 0.012 25)", "on-sheet": "oklch(0.97 0.004 25)", "sheet-muted": "oklch(0.8 0.01 25)", "sheet-line": "oklch(0.36 0.01 25)" },
  },
  {
    key: "racing",
    name: "Racing green and brass",
    vars: { bg: "oklch(0.27 0.05 162)", surface: "oklch(0.31 0.055 162)", ink: "oklch(0.965 0.01 162)", muted: "oklch(0.83 0.03 162)", line: "oklch(0.43 0.05 162)", primary: "oklch(0.81 0.12 78)", "on-primary": "oklch(0.23 0.04 78)", accent: "oklch(0.81 0.12 78)", star: "oklch(0.81 0.12 78)", sheet: "oklch(0.965 0.008 162)", "on-sheet": "oklch(0.24 0.04 162)", "sheet-muted": "oklch(0.44 0.03 162)", "sheet-line": "oklch(0.85 0.02 162)" },
  },
  {
    key: "midnight",
    name: "Midnight and ice blue",
    vars: { bg: "oklch(0.155 0.012 265)", surface: "oklch(0.2 0.016 265)", ink: "oklch(0.965 0.006 250)", muted: "oklch(0.8 0.02 250)", line: "oklch(0.33 0.02 265)", primary: "oklch(0.8 0.11 225)", "on-primary": "oklch(0.18 0.03 250)", accent: "oklch(0.8 0.11 225)", star: "oklch(0.8 0.11 225)", sheet: "oklch(0.965 0.006 250)", "on-sheet": "oklch(0.18 0.02 265)", "sheet-muted": "oklch(0.42 0.02 265)", "sheet-line": "oklch(0.86 0.01 250)" },
  },
];

const PROMISE = {
  "repair-estimate": ["Tell us what it is doing. We will tell you what it needs.", "Cuéntenos qué le pasa. Le diremos qué necesita."],
  "photo-estimate": ["Send a few photos. Get a straight read on the damage.", "Mande unas fotos. Reciba una opinión clara del daño."],
  "tire-quote": ["Tell us your tire size. We will check what fits.", "Díganos la medida de su llanta. Revisamos qué le queda."],
  roadside: ["Broken down? Call first. Everything else can wait.", "¿Se descompuso? Llame primero. Lo demás puede esperar."],
};

const STEPS = {
  "repair-estimate": [
    { title: ["Call or send a request", "Llame o mande una solicitud"], body: ["Tell the shop what the car is doing and when it started.", "Dígale al taller qué hace el carro y cuándo empezó."] },
    { title: ["Get a clear plan", "Reciba un plan claro"], body: ["Ask what it needs and what it costs before you say yes.", "Pregunte qué necesita y cuánto cuesta antes de decir que sí."] },
    { title: ["Back on the road", "De vuelta al camino"], body: ["Pick up your car and get on with your day.", "Recoja su carro y siga con su día."] },
  ],
  "photo-estimate": [
    { title: ["Send photos", "Mande fotos"], body: ["Wide shots and close ups of the damage, taken in daylight.", "Fotos amplias y de cerca del daño, con luz de día."] },
    { title: ["Get a starting number", "Reciba un número inicial"], body: ["A first estimate based on what the photos show.", "Un primer presupuesto con base en lo que muestran las fotos."] },
    { title: ["Bring it in", "Tráigalo"], body: ["Schedule the repair and a final look in person.", "Agende la reparación y una revisión final en persona."] },
  ],
  "tire-quote": [
    { title: ["Send your size", "Mande su medida"], body: ["It is printed on the sidewall of the tire.", "Viene impresa en el costado de la llanta."] },
    { title: ["Hear what fits", "Sepa qué le queda"], body: ["Talk through options for your size and budget.", "Platique opciones para su medida y presupuesto."] },
    { title: ["Stop by", "Pase al taller"], body: ["Come in for the install and get back on the road.", "Venga para la instalación y vuelva al camino."] },
  ],
  roadside: [
    { title: ["Call", "Llame"], body: ["Say where you are and what happened.", "Diga dónde está y qué pasó."] },
    { title: ["Stay safe", "Manténgase a salvo"], body: ["Pull off the road and turn your hazards on.", "Oríllese y prenda las intermitentes."] },
    { title: ["Get the next step", "Siga el siguiente paso"], body: ["Talk through a repair on the spot or at the shop.", "Platique si se arregla ahí mismo o en el taller."] },
  ],
};

const FAQ_APPOINTMENT = { q: ["Do I need an appointment?", "¿Necesito cita?"], a: ["Call ahead to check today's schedule and the quickest way in.", "Llame antes para revisar la agenda del día y la forma más rápida de atenderle."] };

const FAQ = {
  "repair-estimate": [
    { q: ["Can I get a price before any work starts?", "¿Me pueden dar precio antes de empezar?"], a: ["Ask for one. Call or send the request form and say you would like a quote first.", "Pídalo. Llame o mande el formulario y diga que quiere un presupuesto primero."] },
    FAQ_APPOINTMENT,
    { q: ["What should I have ready when I call?", "¿Qué debo tener a la mano cuando llame?"], a: ["The year, make and model, what the car is doing, and when it started. A short video of a noise helps.", "Año, marca y modelo, qué hace el carro y cuándo empezó. Un video corto del ruido ayuda."] },
  ],
  "photo-estimate": [
    { q: ["What photos help most?", "¿Qué fotos ayudan más?"], a: ["One wide shot of the whole side in daylight, then close ups of each damaged area.", "Una foto amplia de todo el lado con luz de día y luego de cerca de cada daño."] },
    { q: ["Is a photo estimate final?", "¿El presupuesto con fotos es final?"], a: ["Photos give a starting point. Expect the final number after an in person look.", "Las fotos dan un punto de partida. El número final viene después de revisarlo en persona."] },
    { q: ["What should I have ready?", "¿Qué debo tener a la mano?"], a: ["Your vehicle details and, if you filed a claim, the claim number.", "Los datos de su vehículo y, si abrió un reclamo, el número de reclamo."] },
  ],
  "tire-quote": [
    { q: ["Where do I find my tire size?", "¿Dónde encuentro la medida?"], a: ["On the sidewall, a code like 225/65R17. It is also on a sticker inside the driver door.", "En el costado de la llanta, un código como 225/65R17. También viene en una etiqueta en la puerta del conductor."] },
    FAQ_APPOINTMENT,
    { q: ["Can I bring my own tires?", "¿Puedo traer mis propias llantas?"], a: ["Ask when you call so the shop can plan for it.", "Pregunte cuando llame para que el taller lo tenga en cuenta."] },
  ],
  roadside: [
    { q: ["What should I say when I call?", "¿Qué digo cuando llame?"], a: ["Where you are, what you are driving, and what happened. Then wait somewhere safe.", "Dónde está, qué maneja y qué pasó. Luego espere en un lugar seguro."] },
    { q: ["Can the repair happen where I am?", "¿Se puede reparar donde estoy?"], a: ["It depends on the problem. Describe it on the phone and ask.", "Depende del problema. Descríbalo por teléfono y pregunte."] },
    { q: ["What if I cannot talk right now?", "¿Y si no puedo hablar ahora?"], a: ["Send the short form with your location and a number to reach you.", "Mande el formulario corto con su ubicación y un número para localizarle."] },
  ],
};

// Line drawn vehicles. pathLength="1" lets the stroke draw in on load.
function carSvg(kind) {
  const damage = kind === "photo-estimate"
    ? `<path class="v-hot" pathLength="1" d="M452 100 L560 104 Q590 110 600 126 L604 140"/><circle class="v-hot" cx="556" cy="121" r="11"/><path class="v-hot" d="M556 104v6M556 132v6M539 121h6M567 121h6"/>`
    : "";
  const tread = kind === "tire-quote"
    ? [150, 500].map((cx) => Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * 24;
      const y1 = 150 + Math.sin(a) * 24;
      const x2 = cx + Math.cos(a) * 30;
      const y2 = 150 + Math.sin(a) * 30;
      return `<path class="v-hot" d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
    }).join("")).join("")
    : "";
  return `<svg class="vehicle" viewBox="0 0 640 196" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path class="v-draw" pathLength="1" d="M110 150 L44 150 Q30 150 30 136 L30 118 Q30 106 44 103 L100 92 L160 60 Q176 52 196 50 L330 48 Q356 48 378 60 L440 92 L560 102 Q596 108 604 124 L608 138 Q608 150 594 150 L540 150 A40 40 0 0 0 460 150 L190 150 A40 40 0 0 0 110 150 Z"/>
<path class="v-draw" pathLength="1" d="M176 88 L206 62 L298 60 L298 88 Z M314 88 L314 60 L350 60 Q364 60 376 68 L406 88 Z"/>
<path class="v-draw" pathLength="1" d="M112 100 L452 100 M306 60 L306 146"/>
<circle class="v-wheel" cx="150" cy="150" r="30"/><circle class="v-wheel" cx="150" cy="150" r="14"/>
<circle class="v-wheel" cx="500" cy="150" r="30"/><circle class="v-wheel" cx="500" cy="150" r="14"/>
${damage}${tread}
<path class="v-ground" d="M0 182 L640 182"/>
</g></svg>`;
}

function truckSvg() {
  return `<svg class="vehicle" viewBox="0 0 640 196" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path class="v-draw" pathLength="1" d="M20 138 L20 40 L290 40 L290 138 Z"/>
<path class="v-draw" pathLength="1" d="M300 150 L300 62 Q300 52 310 52 L402 52 L422 30 L470 30 Q479 30 481 39 L492 92 L562 98 Q592 102 598 120 L602 150 L562 150 A34 34 0 0 0 494 150 L400 150 A34 34 0 0 0 332 150 Z"/>
<path class="v-draw" pathLength="1" d="M430 40 L468 40 L477 82 L430 82 Z M410 52 L410 12"/>
<circle class="v-wheel" cx="366" cy="152" r="26"/><circle class="v-wheel" cx="528" cy="152" r="26"/>
<circle class="v-wheel" cx="84" cy="152" r="22"/><circle class="v-wheel" cx="140" cy="152" r="22"/>
<path class="v-hot" d="M606 110 L632 104 M606 124 L636 124 M606 138 L632 144"/>
<path class="v-ground" d="M0 182 L640 182"/>
</g></svg>`;
}

// Gauge that reads the actual rating: the needle and the lit arc stop at rating / 5.
function gaugeSvg(rating) {
  const frac = Math.max(0, Math.min(1, Number(rating) / 5));
  const angle = (frac * 180 - 90).toFixed(1);
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = Math.PI - (i / 10) * Math.PI;
    const r1 = i % 2 === 0 ? 62 : 67;
    return `<path d="M${(100 + Math.cos(a) * r1).toFixed(1)} ${(100 - Math.sin(a) * r1).toFixed(1)}L${(100 + Math.cos(a) * 72).toFixed(1)} ${(100 - Math.sin(a) * 72).toFixed(1)}"/>`;
  }).join("");
  return `<svg class="gauge" viewBox="0 0 200 112" aria-hidden="true" focusable="false"><g fill="none" stroke-linecap="round">
<path class="g-track" d="M20 100 A80 80 0 0 1 180 100" stroke-width="8"/>
<path class="g-lit" d="M20 100 A80 80 0 0 1 180 100" stroke-width="8" pathLength="100" stroke-dasharray="${(frac * 100).toFixed(1)} 100"/>
<g class="g-ticks" stroke-width="1.6">${ticks}</g>
<g class="g-needle" style="--a:${angle}deg"><path d="M100 100 L100 34" stroke-width="3"/></g>
<circle cx="100" cy="100" r="7" class="g-hub"/>
</g></svg>`;
}

function mapSvg() {
  return `<svg class="mapart" viewBox="0 0 400 260" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-linecap="round">
<g class="m-grid" stroke-width="1.2"><path d="M0 60H400M0 130H400M0 200H400M70 0V260M160 0V260M250 0V260M340 0V260"/></g>
<path class="m-road" stroke-width="7" d="M0 238 C120 200 180 150 230 120 S340 40 400 22"/>
<circle class="m-pulse" cx="205" cy="130" r="26"/>
<path class="m-pin" stroke-width="2.4" d="M205 150 s-20 -19 -20 -34 a20 20 0 0 1 40 0 c0 15 -20 34 -20 34z"/><circle class="m-pin" cx="205" cy="116" r="6" stroke-width="2.4"/>
</g></svg>`;
}

const CSS = `
:root{--display:"Big Shoulders Display",Impact,"Arial Narrow",sans-serif;--stencil:"Big Shoulders Stencil Display","Big Shoulders Display",Impact,sans-serif;--body:"Barlow",system-ui,sans-serif;--radius:3px;--btn-radius:3px;--chip-radius:3px;--max:1240px;--ease:cubic-bezier(.22,1,.36,1)}
body{font-size:1.0625rem;line-height:1.62}
.hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--line)}
.hd-in{display:flex;align-items:center;gap:1.5rem;min-height:4.25rem}
.brand{font-family:var(--display);font-weight:800;font-size:1.45rem;letter-spacing:.02em;text-transform:uppercase;text-decoration:none;line-height:1;margin-right:auto;max-width:60vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nav{display:none;gap:1.75rem;font-weight:600;font-size:.95rem}
.nav a{text-decoration:none;position:relative;padding:.25rem 0}
.nav a::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:2px;background:var(--primary);transform:scaleX(0);transform-origin:left;transition:transform .35s var(--ease)}
.nav a:hover::after{transform:scaleX(1)}
@media (min-width:900px){.nav{display:flex}}
.hd-act{display:flex;align-items:center;gap:.75rem}
.btn-call{display:none;align-items:center;gap:.5rem;padding:.6rem 1rem;background:var(--primary);color:var(--on-primary);font-family:var(--stencil);font-weight:800;font-size:1.3rem;letter-spacing:.03em;text-decoration:none;border-radius:var(--radius);line-height:1}
@media (min-width:600px){.btn-call{display:inline-flex}}

.hero{position:relative;overflow:hidden;padding:clamp(2.5rem,6vw,5rem) 0 0}
.hero-grid{display:grid;gap:clamp(2rem,5vw,4rem);align-items:end}
@media (min-width:980px){.hero-grid{grid-template-columns:minmax(0,1.55fr) minmax(0,1fr)}}
.hero-cat{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;font-weight:600;color:var(--muted);margin-bottom:1.25rem}
.hero-cat .ico{color:var(--primary)}
.name{font-family:var(--display);font-weight:900;text-transform:uppercase;line-height:.86;letter-spacing:-.005em;overflow-wrap:break-word;font-size:var(--nsize)}
.name--xl{--nsize:clamp(4.2rem,15vw,9rem)}
.name--l{--nsize:clamp(3.4rem,11vw,7.4rem)}
.name--m{--nsize:clamp(2.9rem,8.6vw,6rem)}
.name--s{--nsize:clamp(2.4rem,6.6vw,4.8rem)}
.name span{display:block;animation:kj-rise .9s var(--ease) both}
.promise{margin-top:1.5rem;font-size:clamp(1.35rem,2.4vw,1.8rem);font-weight:600;line-height:1.25;max-width:32ch;animation:kj-rise .9s .12s var(--ease) both}
.sub{margin-top:.9rem;color:var(--muted);max-width:52ch;animation:kj-rise .9s .2s var(--ease) both}
.about{margin-top:1rem;max-width:60ch}
.ctas{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem;animation:kj-rise .9s .28s var(--ease) both}
.btn{display:inline-flex;align-items:center;gap:.6rem;padding:1rem 1.4rem;border-radius:var(--radius);font-weight:700;text-decoration:none;border:2px solid transparent;transition:transform .3s var(--ease),background-color .2s,color .2s}
.btn:hover{transform:translateY(-2px)}
.btn-primary{background:var(--primary);color:var(--on-primary)}
.btn-ghost{border-color:currentColor}
.btn-ghost:hover{background:var(--ink);color:var(--bg);border-color:var(--ink)}

.ticket{position:relative;background:var(--sheet);color:var(--on-sheet);padding:1.5rem 1.5rem 1.75rem;border-radius:var(--radius);animation:kj-rise 1s .25s var(--ease) both;--star:var(--on-sheet)}
.ticket::before{content:"";position:absolute;left:0;right:0;top:-7px;height:14px;background:radial-gradient(circle at 7px 0,transparent 6px,var(--sheet) 6.5px) 0 7px/14px 14px repeat-x}
.ticket-top{display:flex;justify-content:space-between;gap:1rem;font-size:.85rem;font-weight:700;color:var(--sheet-muted);border-bottom:1.5px dashed var(--sheet-line);padding-bottom:.75rem}
.gauge{width:100%;max-width:16rem;margin:1.25rem auto .25rem}
.g-track{stroke:var(--sheet-line)}
.g-lit{stroke:var(--accent);stroke-dashoffset:0;animation:g-fill 1.4s .5s var(--ease) both}
@keyframes g-fill{from{stroke-dasharray:0 100}}
.g-ticks{stroke:var(--sheet-muted)}
.g-needle{stroke:var(--on-sheet);transform-origin:100px 100px;transform-box:view-box;transform:rotate(var(--a));animation:g-swing 1.6s .5s var(--ease) both}
@keyframes g-swing{from{transform:rotate(-90deg)}}
.g-hub{fill:var(--on-sheet)}
.ticket-score{display:flex;align-items:baseline;justify-content:center;gap:.4rem;font-family:var(--stencil);line-height:.9}
.ticket-score .big{font-size:clamp(4rem,9vw,5.5rem);font-weight:800}
.ticket-score .of{font-family:var(--body);font-weight:600;font-size:1rem;color:var(--sheet-muted)}
.ticket .stars{margin:.75rem auto 0}
.ticket-count{text-align:center;font-weight:700;font-size:1.1rem;margin-top:.6rem}
.ticket-foot{text-align:center;font-size:.85rem;color:var(--sheet-muted);margin-top:.25rem}

.vehicle-wrap{margin-top:clamp(2rem,5vw,3.5rem);color:var(--muted);position:relative}
.vehicle{width:100%;height:auto;max-height:15rem}
.v-draw{stroke-dasharray:1;stroke-dashoffset:0;animation:kj-draw 2.2s .3s var(--ease) both;--len:1}
.v-wheel{stroke-width:2.2}
.v-hot{stroke:var(--accent);stroke-width:2.4;stroke-dasharray:6 6}
.v-ground{stroke-dasharray:2 10;opacity:.7}
.stripe{height:10px;background:repeating-linear-gradient(-45deg,var(--primary) 0 14px,transparent 14px 28px);opacity:.9}

.sec{padding:clamp(4rem,9vw,7.5rem) 0}
.h2{font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:clamp(2.6rem,6vw,4.4rem);line-height:.92;letter-spacing:.005em}
.svc-head{display:grid;gap:1rem;margin-bottom:2.5rem}
@media (min-width:860px){.svc-head{grid-template-columns:1fr 1fr;align-items:end}}
.svc-note{color:var(--muted);max-width:44ch;font-size:.95rem}
.order{border-top:2px solid var(--ink);counter-reset:ln}
.order li{display:grid;grid-template-columns:3.2rem 1fr auto;align-items:center;gap:1rem;padding:1.1rem 0;border-bottom:1px solid var(--line)}
.order .ln{font-family:var(--stencil);font-weight:800;font-size:1.35rem;color:var(--primary)}
.order .nm{font-size:clamp(1.15rem,2.1vw,1.45rem);font-weight:600;line-height:1.25}
.order a{display:inline-flex;align-items:center;gap:.35rem;font-weight:600;font-size:.9rem;color:var(--muted);text-decoration:none;white-space:nowrap}
.order a:hover{color:var(--ink)}
.order a .ico{transition:transform .3s var(--ease)}
.order li:hover a .ico{transform:translateX(4px)}
@media (max-width:560px){.order li{grid-template-columns:2.4rem 1fr}.order a{grid-column:2}}

.themes{background:var(--surface)}
.themes-list{display:flex;flex-wrap:wrap;gap:.25rem .9rem;margin-top:2.5rem;font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:clamp(2rem,5.4vw,4rem);line-height:1}
.themes-list li{display:inline-flex;align-items:center;gap:.9rem}
.themes-list li:not(:last-child)::after{content:"/";color:var(--primary);font-weight:600}
.themes-note{margin-top:2rem;color:var(--muted);font-size:.95rem}

.steps{display:grid;gap:2rem;margin-top:3rem;counter-reset:s}
@media (min-width:820px){.steps{grid-template-columns:repeat(3,1fr);gap:0}}
.steps li{position:relative;padding:1.5rem 1.5rem 0 0}
@media (min-width:820px){.steps li{border-top:2px solid var(--line);padding-top:2rem}.steps li::before{content:"";position:absolute;top:-2px;left:0;width:3.5rem;height:2px;background:var(--primary)}}
.step-n{display:block;font-family:var(--stencil);font-weight:800;font-size:4.5rem;line-height:.8;color:var(--primary);margin-bottom:1rem}
.steps h3{font-size:1.35rem;font-weight:700;line-height:1.2;margin-bottom:.4rem}
.steps p{color:var(--muted);max-width:32ch}

.req{background:var(--surface)}
.req-grid{display:grid;gap:2.5rem}
@media (min-width:980px){.req-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}}
.req-side p{margin-top:1rem;color:var(--muted);max-width:40ch}
.req-call{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.75rem;font-family:var(--stencil);font-size:2rem;font-weight:800;text-decoration:none;color:var(--primary)}
.req-panel{background:var(--bg);padding:clamp(1.25rem,3vw,2.25rem);border:1px solid var(--line);border-radius:var(--radius)}
@media (min-width:980px){.req-side{position:sticky;top:6rem;align-self:start}}

.visit-grid{display:grid;gap:2.5rem;align-items:center}
@media (min-width:900px){.visit-grid{grid-template-columns:1fr 1fr;gap:4rem}}
.facts{margin:2rem 0 0;display:grid;gap:0}
.facts div{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--line)}
.facts dt{font-weight:700;color:var(--muted)}
.facts dd{margin:0;font-weight:600}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-weight:700}
.mapart{width:100%;color:var(--line)}
.m-road{stroke:var(--surface)}
.m-pin{stroke:var(--primary)}
.m-pulse{stroke:var(--primary);stroke-width:1.5;transform-origin:205px 130px;transform-box:view-box;animation:m-pulse 2.6s var(--ease) infinite}
@keyframes m-pulse{from{transform:scale(.4);opacity:1}to{transform:scale(2.2);opacity:0}}

.faq-grid{display:grid;gap:2rem}
@media (min-width:900px){.faq-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}}

.ft{border-top:1px solid var(--line);padding:3.5rem 0 2.5rem}
.ft-name{font-family:var(--display);font-weight:900;text-transform:uppercase;font-size:clamp(2.4rem,7vw,5rem);line-height:.9;overflow-wrap:break-word}
.ft-row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem 2rem;margin-top:2rem;color:var(--muted)}
.ft-row a{color:var(--ink);font-weight:700}
.legal{font-size:.85rem}
`;

function render(ctx) {
  const kind = ctx.kind;
  const promise = ctx.copyOr("headline", PROMISE[kind] || PROMISE["repair-estimate"]);
  const sub = ctx.copyOr("subhead", [
    `${ctx.ratingText} stars across ${ctx.reviewsText} Google reviews.`,
    `${ctx.ratingText} estrellas en ${ctx.reviewsText} reseñas de Google.`,
  ]);
  const ctaPrimary = ctx.copyOr("ctaPrimary", kind === "roadside" ? ["Call now", "Llamar ahora"] : ["Call the shop", "Llamar al taller"]);
  const ctaSecondary = ctx.copyOr("ctaSecondary", ctx.formCopy.cta);
  const svcTitle = kind === "photo-estimate" ? ["In the booth", "En la cabina"] : ["On the lift", "En la rampa"];
  const vehicle = kind === "roadside" ? truckSvg() : carSvg(kind);
  const t = ctx.t;

  const header = `<header class="hd"><div class="wrap hd-in"><a class="brand" href="#top">${ctx.name}</a><nav class="nav"${ctx.i18n.aria("Sections", "Secciones")}>${ctx.services.length ? `<a href="#services">${t("Services", "Servicios")}</a>` : ""}<a href="#request">${t(ctx.formCopy.title[0], ctx.formCopy.title[1])}</a><a href="#visit">${t("Visit", "Visítenos")}</a></nav><div class="hd-act">${ctx.langToggle}${ctx.tel ? `<a class="btn-call" href="${esc(ctx.tel)}">${icon("phone")}<span>${esc(ctx.phone)}</span></a>` : ""}</div></div></header>`;

  const hero = `<section class="hero" id="top"><div class="wrap"><div class="hero-grid"><div class="hero-copy">
<p class="hero-cat">${icon("pin")}<span>${ctx.categoryT}</span><span aria-hidden="true">/</span><span>${esc(ctx.placeRaw)}</span></p>
<h1 class="name name--${ctx.nameScale}"><span>${ctx.name}</span></h1>
<p class="promise">${promise}</p>
<p class="sub">${sub}</p>
${ctx.about ? `<p class="about">${ctx.about}</p>` : ""}
<div class="ctas">${ctx.tel ? `<a class="btn btn-primary" href="${esc(ctx.tel)}">${icon("phone")}${ctaPrimary}</a>` : ""}<a class="btn btn-ghost" href="#request">${ctaSecondary}${icon("arrow")}</a></div>
</div>
<aside class="ticket" data-rating="${esc(ctx.rating)}" data-reviews="${esc(ctx.reviews)}"${ctx.i18n.aria("Google rating", "Calificación en Google")}>
<div class="ticket-top"><span>${t("Google rating", "Calificación en Google")}</span><span>${esc(ctx.cityState)}</span></div>
${gaugeSvg(ctx.rating)}
<p class="ticket-score"><span class="big">${esc(ctx.ratingText)}</span><span class="of">${t("out of 5", "de 5")}</span></p>
${starsSvg(ctx.rating, "hero")}
<p class="ticket-count">${reviewsText(ctx)}</p>
</aside></div>
<div class="vehicle-wrap">${vehicle}</div></div><div class="stripe" aria-hidden="true"></div></section>`;

  const services = ctx.services.length
    ? `<section class="sec" id="services"><div class="wrap"><div class="svc-head"><h2 class="h2">${t(svcTitle[0], svcTitle[1])}</h2>${servicesNote(ctx)}</div>
<ol class="order">${ctx.services.map((s, i) => `<li class="rv"><span class="ln" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><span class="nm">${esc(s)}</span><a href="#request">${t("Ask for a quote", "Pedir precio")}${icon("arrow")}</a></li>`).join("")}</ol></div></section>`
    : "";

  const themes = ctx.themes.length
    ? `<section class="sec themes"><div class="wrap"><h2 class="h2">${t("What customers mention most", "Lo que más mencionan los clientes")}</h2><ul class="themes-list">${ctx.themes.map((th) => `<li class="rv">${esc(th)}</li>`).join("")}</ul>${themesNote(ctx)}</div></section>`
    : "";

  const steps = `<section class="sec"><div class="wrap"><h2 class="h2">${t("How it works", "Cómo funciona")}</h2>${stepsList(ctx, STEPS[kind] || STEPS["repair-estimate"])}</div></section>`;

  const request = `<section class="sec req" id="request"><div class="wrap req-grid"><div class="req-side"><h2 class="h2">${t(ctx.formCopy.title[0], ctx.formCopy.title[1])}</h2><p>${t(ctx.formCopy.intro[0], ctx.formCopy.intro[1])}</p>${ctx.tel ? `<p>${t("Rather talk it through?", "¿Prefiere platicarlo?")}</p><a class="req-call" href="${esc(ctx.tel)}">${icon("phone")}${esc(ctx.phone)}</a>` : ""}</div><div class="req-panel">${ctx.form}</div></div></section>`;

  const visit = `<section class="sec" id="visit"><div class="wrap visit-grid"><div><h2 class="h2">${t("Where to find us", "Dónde encontrarnos")}</h2>${factsList(ctx)}${directionsLink(ctx)}</div>${mapSvg()}</div></section>`;

  const faq = `<section class="sec" id="faq"><div class="wrap faq-grid"><h2 class="h2">${t("Good questions", "Buenas preguntas")}</h2>${faqList(ctx, FAQ[kind] || FAQ["repair-estimate"])}</div></section>`;

  const footer = `<footer class="ft"><div class="wrap"><p class="ft-name">${ctx.name}</p><div class="ft-row"><span>${ctx.categoryT}, ${esc(ctx.placeRaw)}</span>${ctx.tel ? `<a href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}</div><div class="ft-row">${footerLegal(ctx)}</div></div></footer>`;

  return { css: CSS, body: `${header}<main>${hero}${services}${themes}${steps}${request}${visit}${faq}</main>${footer}` };
}

export const template = {
  key: "auto",
  label: "Service bay",
  fontsHref: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Big+Shoulders+Display:wght@600;800;900&family=Big+Shoulders+Stencil+Display:wght@800&display=swap",
  palettes: PALETTES,
  render,
};
