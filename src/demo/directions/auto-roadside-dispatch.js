// Roadside dispatch (research/design-auto.md, direction 7). Calm under stress:
// big, bright and legible in sunlight on a cracked phone, with one job, which
// is getting the call. On a phone the first screen is the number in huge type
// on a pulsing call button, then a "What is happening?" chooser of big tiles
// that shows a short safety note and travels with the request. Reflective
// tape stripes, the phone repeated in every band, 56px tap targets. No script:
// the chooser is native radios read by :has(), tied to the request form
// through the form attribute.

import {
  faqBlock,
  formHeading,
  photoFrame,
  ratingProof,
  REQUEST_ID,
  servicesConfirm,
  servicesList,
  siteFooter,
  siteHeader,
  stepsBlock,
  themesBlock,
  uid,
  visitDetails,
} from "../blocks.js";
import { esc, icon } from "../shared.js";

const PALETTES = [
  { key: "dispatch-flare", name: "Flare", vars: { bg: "#fffaf5", surface: "#f4ebe1", ink: "#1c1c1c", muted: "#5a5046", line: "#e4d6c6", primary: "#ff5a1f", "on-primary": "#141414", accent: "#ff5a1f", dark: "#1c1c1c", "on-dark": "#fffaf5", "dark-muted": "#c9bdb1", "tape-a": "#ff5a1f", "tape-b": "#fffaf5", pick: "#1c1c1c", "on-pick": "#fffaf5" } },
  { key: "dispatch-beacon", name: "Beacon", vars: { bg: "#ffffff", surface: "#f3f4f6", ink: "#101418", muted: "#555e6a", line: "#dfe2e7", primary: "#ffc400", "on-primary": "#101418", accent: "#ffc400", dark: "#101418", "on-dark": "#ffffff", "dark-muted": "#b8c0ca", "tape-a": "#ffc400", "tape-b": "#101418", pick: "#101418", "on-pick": "#ffc400" } },
  { key: "dispatch-reflector", name: "Reflector", vars: { bg: "#ffffff", surface: "#eef2fb", ink: "#0b0b0f", muted: "#4f5360", line: "#dbe0ec", primary: "#0047ff", "on-primary": "#ffffff", accent: "#ff3b30", dark: "#0b0b0f", "on-dark": "#ffffff", "dark-muted": "#b9bdca", "tape-a": "#ff3b30", "tape-b": "#ffffff", pick: "#0047ff", "on-pick": "#ffffff" } },
];

// Tile glyphs, 2px square cap strokes on a 32 grid.
const GLYPHS = {
  flat: "<circle cx=\"16\" cy=\"16\" r=\"11\"/><circle cx=\"16\" cy=\"16\" r=\"4\"/><path d=\"M5 25h22\"/>",
  nostart: "<path d=\"M6 11h20v14H6z\"/><path d=\"M11 11V7h4v4M19 11V7h4v4\"/><path d=\"M17 14l-3 5h4l-3 5\"/>",
  locked: "<rect x=\"8\" y=\"14\" width=\"16\" height=\"12\"/><path d=\"M11 14v-4a5 5 0 0 1 10 0v4\"/><path d=\"M16 19v3\"/>",
  accident: "<path d=\"M16 4l13 23H3z\"/><path d=\"M16 12v7M16 23v1\"/>",
  tow: "<path d=\"M3 22h15l3-7h5l3 4v3h-3\"/><path d=\"M18 22V11l-8 6\"/><circle cx=\"9\" cy=\"24\" r=\"2.5\"/><circle cx=\"23\" cy=\"24\" r=\"2.5\"/>",
  gas: "<path d=\"M7 27V6h12v21M5 27h16\"/><path d=\"M10 10h6v5h-6z\"/><path d=\"M19 12h3l3 3v8a2 2 0 0 1-4 0v-4h-2\"/>",
  heat: "<path d=\"M16 4v15\"/><circle cx=\"16\" cy=\"23\" r=\"4\"/><path d=\"M20 8h4M20 12h3M20 16h4\"/>",
  warning: "<circle cx=\"16\" cy=\"16\" r=\"11\"/><path d=\"M16 10v7M16 21v1\"/>",
  air: "<circle cx=\"16\" cy=\"16\" r=\"11\"/><path d=\"M16 16l6-5\"/><path d=\"M9 21h14\"/>",
  battery: "<path d=\"M5 10h22v14H5z\"/><path d=\"M10 10V7M22 10V7\"/><path d=\"M9 17h5M20 15v4M18 17h4\"/>",
  noise: "<path d=\"M5 13h5l6-5v16l-6-5H5z\"/><path d=\"M21 11c2 2 2 8 0 10M25 8c4 4 4 12 0 16\"/>",
};

// What the driver is facing, by trade. Each note is generic road safety and
// ends with the call; none of it says what the business does.
const SITUATIONS = {
  flat: { label: ["Flat tire", "Llanta ponchada"], note: ["Get as far off the road as you can and put your hazards on. Do not change a tire on the traffic side.", "Oríllese lo más que pueda y prenda las intermitentes. No cambie una llanta del lado del tráfico."] },
  blowout: { glyph: "flat", label: ["Flat or blowout", "Llanta ponchada o reventada"], note: ["Ease off, steer straight and slow down gently, then get fully off the road with hazards on.", "Suelte el acelerador, mantenga el volante derecho y frene suave. Luego oríllese con las intermitentes."] },
  nostart: { label: ["Will not start", "No arranca"], note: ["Hazards on. If you are in a lane, get out on the side away from traffic and wait somewhere safe.", "Intermitentes prendidas. Si está en un carril, salga por el lado contrario al tráfico y espere en un lugar seguro."] },
  locked: { label: ["Locked out", "Se quedó afuera"], note: ["Wait in a safe, well lit spot near the vehicle. Have your ID handy.", "Espere en un lugar seguro e iluminado cerca del vehículo. Tenga su identificación a la mano."] },
  accident: { label: ["Accident", "Choque"], note: ["If anyone is hurt or a lane is blocked, call 911 first. Then move somewhere safe and take photos.", "Si hay heridos o un carril bloqueado, llame primero al 911. Luego póngase a salvo y tome fotos."] },
  tow: { label: ["Need a tow", "Necesito grúa"], note: ["Note exactly where you are: highway, exit, mile marker or cross streets. Keep the hazards on.", "Anote dónde está exactamente: carretera, salida, milla o calles. Mantenga las intermitentes."] },
  gas: { label: ["Out of gas", "Sin gasolina"], note: ["Coast as far off the road as you can. Do not walk along a highway shoulder.", "Oríllese lo más que pueda. No camine por el acotamiento de la carretera."] },
  heat: { label: ["Overheating", "Se calienta"], note: ["Pull over and shut the engine off. Never open a hot radiator or coolant cap.", "Oríllese y apague el motor. Nunca abra el radiador o el tapón del anticongelante en caliente."] },
  warning: { label: ["Warning light", "Luz de aviso"], note: ["If a light is flashing or the engine loses power, pull over somewhere safe and note what it shows.", "Si una luz parpadea o el motor pierde fuerza, oríllese en un lugar seguro y anote lo que marca."] },
  derate: { glyph: "warning", label: ["Warning light or derate", "Luz de aviso o pérdida de potencia"], note: ["If the truck derates or a light is flashing, get somewhere safe and write down the code if you can see it.", "Si el camión pierde potencia o una luz parpadea, póngase a salvo y anote el código si lo ve."] },
  air: { label: ["Air or brake warning", "Aviso de aire o frenos"], note: ["Stop somewhere safe. Do not keep driving on low air pressure.", "Deténgase en un lugar seguro. No siga manejando con poca presión de aire."] },
  battery: { label: ["Dead battery", "Batería descargada"], note: ["Turn off lights and accessories. Have the year, make and model ready for the call.", "Apague luces y accesorios. Tenga a la mano año, marca y modelo para la llamada."] },
  noise: { label: ["Strange noise", "Ruido raro"], note: ["If it is grinding, loud or getting worse, pull over and stop driving it.", "Si rechina, suena fuerte o empeora, oríllese y deje de manejarlo."] },
};

const SETS = {
  towing: ["flat", "nostart", "locked", "accident", "tow", "gas"],
  "diesel-truck-repair": ["nostart", "blowout", "heat", "derate", "air", "tow"],
  "mobile-mechanic": ["nostart", "battery", "flat", "warning", "noise", "heat"],
};

const WAIT = [
  { title: ["Hazards on", "Intermitentes"], body: ["Make the vehicle easy to see, day or night.", "Que el vehículo se vea bien, de día o de noche."] },
  { title: ["Away from traffic", "Lejos del tráfico"], body: ["Wait off the road, behind a barrier if there is one.", "Espere fuera del camino, detrás de una barrera si hay."] },
  { title: ["Share where you are", "Diga dónde está"], body: ["Exit, mile marker, cross streets or a landmark.", "Salida, milla, calles o un punto de referencia."] },
  { title: ["Keep the phone close", "El teléfono cerca"], body: ["Charged and with the ringer on for the callback.", "Con carga y con timbre para la llamada de regreso."] },
];

const CSS = `
:root{--display:"Sofia Sans Extra Condensed","Arial Narrow",sans-serif;--body:"Sofia Sans",system-ui,sans-serif;--radius:10px;--btn-radius:12px;--chip-radius:10px;--max:1240px;--ease:cubic-bezier(.22,1,.36,1);--tape:repeating-linear-gradient(-45deg,var(--tape-a) 0 16px,var(--tape-b) 16px 32px);--field:#ffffff;--field-line:color-mix(in oklab,var(--ink) 28%,transparent);--star:currentColor;--lang-fg:var(--ink);--lang-on:var(--bg)}
body{font-size:1.125rem;line-height:1.55}
.rd-num{font-family:var(--display);font-weight:900;font-variant-numeric:tabular-nums;letter-spacing:.005em;line-height:.9}
.rd-caps{font-family:var(--display);font-weight:800;text-transform:uppercase;letter-spacing:.01em;line-height:.92}

.b-hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:2px solid var(--ink)}
.b-hd::after{content:"";position:absolute;left:0;right:0;bottom:-8px;height:6px;background:var(--tape)}
.b-hd__in{display:flex;align-items:center;gap:.75rem;min-height:4.25rem}
.b-brand{margin-right:auto;font-family:var(--display);font-weight:900;font-size:1.6rem;text-transform:uppercase;line-height:1;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.b-hd__end{display:flex;align-items:center;gap:.6rem;flex:none}
.b-hd__tel{display:inline-flex;align-items:center;gap:.4rem;min-height:3rem;padding:0 .9rem;border-radius:var(--btn-radius);background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:900;font-size:1.35rem;font-variant-numeric:tabular-nums;text-decoration:none;white-space:nowrap}
@media (max-width:420px){.b-hd__tel{font-size:1.15rem;padding:0 .65rem}.b-hd__tel .ico{display:none}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:3rem;padding:0 1rem;border:2px solid var(--ink);border-radius:var(--btn-radius);font-weight:600;text-decoration:none}
@media (max-width:759.98px){.b-hd__cta{display:none}}

.rd-hero{position:relative;padding:clamp(1.75rem,5vw,4.5rem) 0 clamp(3rem,7vw,5.5rem);overflow:hidden}
.rd-hero::before{content:"";position:absolute;right:-8rem;top:-3rem;width:26rem;height:10rem;background:var(--tape);transform:rotate(-24deg);opacity:.9;pointer-events:none}
@media (max-width:759.98px){.rd-hero::before{width:12rem;height:4rem;right:-6rem;top:-1.75rem}}
.rd-hero__grid{position:relative;display:grid;gap:clamp(1.5rem,4vw,3rem);grid-template-columns:minmax(0,1fr)}
@media (min-width:980px){.rd-hero--split .rd-hero__grid{grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);align-items:start}}
.rd-where{font-weight:600;color:var(--muted)}
.rd-name{margin-top:.4rem;font-size:clamp(2.6rem,7vw,5.5rem);max-width:14ch;overflow-wrap:anywhere}
.rd-promise{margin-top:.9rem;max-width:30ch;font-size:clamp(1.2rem,2vw,1.45rem);font-weight:600;line-height:1.3}
.rd-about{margin-top:.6rem;max-width:48ch;color:var(--muted)}
.rd-call{position:relative;isolation:isolate;display:grid;gap:.25rem;margin-top:1.5rem;padding:1.25rem 1.4rem 1.4rem;border-radius:calc(var(--radius) + 6px);background:var(--primary);color:var(--on-primary);text-decoration:none;box-shadow:0 18px 40px -18px color-mix(in oklab,var(--primary) 80%,#000)}
.rd-call::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;box-shadow:0 0 0 0 color-mix(in oklab,var(--primary) 55%,transparent);animation:rd-pulse 2.4s var(--ease) infinite}
@keyframes rd-pulse{0%{box-shadow:0 0 0 0 color-mix(in oklab,var(--primary) 55%,transparent)}70%{box-shadow:0 0 0 22px color-mix(in oklab,var(--primary) 0%,transparent)}100%{box-shadow:0 0 0 0 transparent}}
.rd-call__lbl{display:flex;align-items:center;gap:.5rem;font-weight:600;font-size:1.1rem}
.rd-call__lbl .ico{width:1.4rem;height:1.4rem}
.rd-call__num{font-size:clamp(3.4rem,14vw,6rem);white-space:nowrap}
.rd-call__sub{font-weight:600;opacity:.85}
.rd-call:hover{filter:brightness(1.05)}
.rd-proof{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem 1.25rem;margin-top:1.25rem}
.rd-proof .b-rating{display:inline-flex;align-items:center;gap:.6rem;min-height:3.5rem;padding:.4rem 1rem;border:2px solid var(--ink);border-radius:var(--btn-radius);background:var(--bg)}
.rd-proof .b-rating__num{font-family:var(--display);font-weight:900;font-size:2rem;line-height:1}
.rd-proof .stars{width:6rem;height:1.2rem;color:var(--ink)}
.rd-proof .b-rating__count{font-weight:600}
.rd-proof a{font-weight:600;min-height:3.5rem;display:inline-flex;align-items:center;text-underline-offset:.2em}

.rd-chooser{border:2px solid var(--ink);border-radius:calc(var(--radius) + 6px);background:var(--bg);overflow:hidden}
.rd-chooser__head{display:flex;align-items:baseline;justify-content:space-between;gap:1rem;padding:1rem 1.25rem;background:var(--dark);color:var(--on-dark)}
.rd-chooser__head h2{font-size:clamp(1.8rem,3.4vw,2.4rem)}
.rd-chooser__head span{color:var(--dark-muted);font-size:.95rem}
.rd-tiles{border:0;margin:0;padding:.75rem;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem}
@media (min-width:620px){.rd-tiles{grid-template-columns:repeat(3,minmax(0,1fr))}}
.rd-tile{position:relative;display:grid;align-content:space-between;gap:.75rem;min-height:7.25rem;padding:1rem;border:2px solid var(--line);border-radius:var(--radius);background:var(--surface);cursor:pointer;transition:background-color .2s,border-color .2s,color .2s,transform .25s var(--ease)}
.rd-tile input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}
.rd-tile svg{width:2.25rem;height:2.25rem;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:square;stroke-linejoin:miter}
.rd-tile b{font-family:var(--display);font-weight:800;font-size:1.55rem;line-height:1;text-transform:uppercase}
.rd-tile:hover{border-color:var(--ink);transform:translateY(-2px)}
.rd-tile:has(input:checked){background:var(--pick);color:var(--on-pick);border-color:var(--pick)}
.rd-tile:has(input:focus-visible){outline:3px solid var(--ink);outline-offset:2px}
.rd-notes{padding:0 .75rem .75rem}
.rd-note{display:none;gap:.75rem;padding:1rem 1.1rem;border-radius:var(--radius);background:color-mix(in oklab,var(--primary) 14%,var(--bg));border:2px dashed color-mix(in oklab,var(--ink) 35%,transparent)}
.rd-note--none{display:grid}
.rd-note p{font-weight:600}
.rd-note small{display:block;font-weight:600;text-transform:uppercase;letter-spacing:.06em;font-size:.8rem;color:var(--muted)}
.rd-note a{display:inline-flex;align-items:center;gap:.5rem;min-height:3.5rem;padding:0 1.1rem;justify-self:start;border-radius:var(--btn-radius);background:var(--dark);color:var(--on-dark);font-family:var(--display);font-weight:900;font-size:1.5rem;font-variant-numeric:tabular-nums;text-decoration:none}
.rd-note a[href^="#"]{font-family:var(--body);font-size:1rem;font-weight:600}
html:has(.rd-tiles input:checked) .rd-note--none{display:none}

.rd-hero--board .rd-callband{display:grid;gap:1rem}
@media (min-width:980px){.rd-hero--board .rd-callband{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);align-items:end;gap:3rem}.rd-hero--board .rd-call{margin-top:0}}
.rd-hero--board .rd-lower{display:grid;gap:1.5rem;margin-top:clamp(1.5rem,4vw,3rem)}
@media (min-width:980px){.rd-hero--board .rd-lower{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);align-items:stretch}}

.rd-area{position:relative;display:grid;place-items:center;align-content:center;gap:.5rem;padding:1rem 1rem 1.1rem;min-height:20rem;border:2px solid var(--ink);border-radius:calc(var(--radius) + 6px);background:var(--surface);overflow:hidden}
.rd-area svg{width:100%;height:100%;max-height:26rem}
.rd-ring{fill:none;stroke:var(--ink);stroke-width:1.5}
.rd-ring--dash{stroke-dasharray:4 7}
.rd-ring--pulse{stroke:var(--primary);stroke-width:3;transform-box:fill-box;transform-origin:center;animation:rd-ring 3.2s var(--ease) infinite}
@keyframes rd-ring{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.35);opacity:0}}
.rd-area__city{font-family:var(--display);font-weight:900;font-size:34px;text-transform:uppercase;fill:var(--ink)}
.rd-area__lbl{font-family:var(--body);font-weight:600;font-size:14px;fill:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.rd-area__note{font-size:.95rem;color:var(--muted);text-align:center}

.rd-tape{height:14px;background:var(--tape)}
.rd-sec{position:relative;padding:clamp(3.5rem,8vw,6rem) 0}
.rd-sec--alt{background:var(--surface)}
.rd-sec--dark{background:var(--dark);color:var(--on-dark)}
.rd-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:1rem 2rem}
.rd-h2{font-size:clamp(2.4rem,6vw,4.4rem)}
.rd-lede{margin-top:.75rem;max-width:52ch;color:var(--muted)}
.rd-sec--dark .rd-lede{color:var(--dark-muted)}
.rd-sec__call{display:inline-flex;align-items:center;gap:.5rem;min-height:3.5rem;padding:0 1.1rem;border:2px solid currentColor;border-radius:var(--btn-radius);font-family:var(--display);font-weight:900;font-size:1.45rem;font-variant-numeric:tabular-nums;text-decoration:none;white-space:nowrap}
.rd-sec__call:hover{background:var(--ink);color:var(--bg)}
.rd-sec--dark .rd-sec__call:hover{background:var(--on-dark);color:var(--dark)}

.b-svc{display:grid;gap:0 3rem;margin-top:2.5rem;counter-reset:svc}
@media (min-width:820px){.b-svc{grid-template-columns:1fr 1fr}}
.b-svc__item{display:flex;align-items:center;gap:1rem;min-height:4.25rem;padding:.75rem 0;border-bottom:2px solid var(--line);font-family:var(--display);font-weight:800;font-size:clamp(1.55rem,3vw,2rem);text-transform:uppercase;line-height:1}
.b-svc__item::before{content:"";flex:none;width:.85rem;height:.85rem;background:var(--primary);border:2px solid var(--ink)}
.b-svc-confirm{margin-top:1.5rem;font-weight:600}
.svc-note{margin-top:.35rem;color:var(--muted);font-size:1rem}
.rd-svc--chips .b-svc{display:flex;flex-wrap:wrap;gap:.6rem}
.rd-svc--chips .b-svc__item{min-height:3.5rem;padding:.5rem 1.1rem;border:2px solid var(--ink);border-radius:var(--btn-radius);font-size:1.5rem}

.rd-wait{display:grid;gap:1rem;margin-top:2.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))}
.rd-wait li{position:relative;padding:1.5rem 1.25rem 1.25rem;border-radius:var(--radius);background:color-mix(in oklab,var(--on-dark) 7%,transparent);border:2px solid color-mix(in oklab,var(--on-dark) 18%,transparent)}
.rd-wait li::before{content:"";position:absolute;left:0;right:0;top:0;height:8px;border-radius:var(--radius) var(--radius) 0 0;background:var(--tape)}
.rd-wait b{display:block;font-family:var(--display);font-weight:900;font-size:2.75rem;line-height:1;color:var(--primary)}
.rd-wait h3{margin-top:.5rem;font-family:var(--display);font-weight:800;font-size:1.7rem;text-transform:uppercase;line-height:1}
.rd-wait p{margin-top:.4rem;color:var(--dark-muted)}
.rd-wait-note{margin-top:1.5rem;font-weight:600}

.rd-photos{display:grid;gap:.75rem;margin-top:2.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))}
.rd-photos .b-photo{aspect-ratio:16/10;border-radius:var(--radius);border:2px solid var(--ink)}
.rd-photos .b-photo img{filter:saturate(1.08) contrast(1.05) brightness(1.05)}

.b-themes{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:2rem}
.b-themes li{display:inline-flex;align-items:center;gap:.6rem;min-height:3.5rem;padding:.5rem 1.1rem;border-radius:var(--btn-radius);background:var(--bg);border:2px solid var(--ink);font-weight:600}
.b-themes li::before{content:"";width:.6rem;height:.6rem;border-radius:50%;background:var(--primary)}
.b-themes__note{margin-top:1rem;color:var(--muted);font-size:1rem}

.steps{display:grid;gap:1rem;margin-top:2.5rem}
@media (min-width:820px){.steps{grid-template-columns:repeat(3,minmax(0,1fr))}}
.steps li{padding:1.25rem;border:2px solid var(--ink);border-radius:var(--radius);background:var(--bg)}
.step-n{display:grid;place-items:center;width:3rem;height:3rem;border-radius:50%;background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:900;font-size:1.8rem;margin-bottom:.9rem}
.steps h3{font-family:var(--display);font-weight:800;font-size:1.7rem;text-transform:uppercase;line-height:1}
.steps p{margin-top:.35rem;color:var(--muted)}

.rd-req{display:grid;gap:2rem}
@media (min-width:980px){.rd-req{grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:3.5rem}.rd-req__side{position:sticky;top:6rem;align-self:start}}
.rd-req .rd-call{margin-top:1.5rem}
.rd-picked{display:none;margin-top:1.25rem;padding:.9rem 1.1rem;border-radius:var(--radius);background:var(--pick);color:var(--on-pick);font-weight:600}
.rd-picked b{font-family:var(--display);font-weight:800;font-size:1.6rem;text-transform:uppercase}
html:has(.rd-tiles input:checked) .rd-picked{display:block}
.rd-o{display:none}
.rd-panel{padding:clamp(1.25rem,3vw,2rem);border:2px solid var(--ink);border-radius:calc(var(--radius) + 6px);background:var(--bg)}
.f-label,.f-field legend{font-weight:600;font-size:1.02rem}
.f-input{min-height:3.5rem;border-width:2px;border-radius:var(--radius);font-size:1.1rem}
.f-chip>span{min-height:3.5rem;padding:.6rem 1.1rem;border-width:2px;font-weight:600}
.f-chip input:checked+span{background:var(--pick);color:var(--on-pick);border-color:var(--pick)}
.f-submit{min-height:3.5rem;border-radius:var(--btn-radius);background:var(--dark);color:var(--on-dark);font-weight:600;font-size:1.1rem}

.rd-visit{display:grid;gap:2rem}
@media (min-width:900px){.rd-visit{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:4rem}}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:1rem 0;border-bottom:2px solid var(--line)}
.facts div:first-child{border-top:2px solid var(--line)}
.facts dt{color:var(--muted);font-weight:600}
.facts dd{margin:0;font-weight:600;font-size:1.15rem}
.b-visit__pending{display:grid;gap:.4rem;margin-top:1.25rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.5rem;min-height:3.5rem;margin-top:.75rem;font-weight:600}

.faq summary{min-height:3.5rem;font-weight:600;font-size:1.15rem}

.rd-close{background:var(--primary);color:var(--on-primary);padding:clamp(3.5rem,8vw,6rem) 0}
.rd-close .rd-h2{max-width:16ch}
.rd-close__num{display:inline-block;margin-top:1rem;font-size:clamp(3.6rem,15vw,9rem);color:inherit;text-decoration:none;white-space:nowrap}
.rd-close__num:hover{text-decoration:underline;text-decoration-thickness:6px;text-underline-offset:.08em}
.rd-close p{margin-top:.75rem;font-weight:600}

.b-ft{background:var(--dark);color:var(--on-dark);padding:3.5rem 0 2.5rem}
.b-ft__name{font-family:var(--display);font-weight:900;font-size:clamp(2.2rem,5vw,3.4rem);text-transform:uppercase;line-height:.95}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;color:var(--dark-muted)}
.b-ft__row a{color:var(--on-dark);font-weight:600}
.legal{margin-top:1.5rem;font-size:.85rem;color:var(--dark-muted)}
.stock-credits{margin-top:.5rem;color:var(--dark-muted)}
.callbar{background:var(--primary);color:var(--on-primary);border-radius:var(--btn-radius);font-family:var(--display);font-weight:900;font-size:1.6rem;font-variant-numeric:tabular-nums}
:root{--callbar-h:4rem}
`;

function glyph(key) {
  return `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">${GLYPHS[key] || GLYPHS.warning}</svg>`;
}

function withFormId(ctx, id) {
  return ctx.form.replace("<form class=\"req-form\"", `<form id="${id}" class="req-form"`);
}

// The number link used in every band.
function telLink(ctx, cls, label = true) {
  if (!ctx.tel) return "";
  return `<a class="${cls}" href="${esc(ctx.tel)}">${icon("phone")}<span>${label ? `${ctx.t("Call", "Llame al")} ` : ""}${esc(ctx.phone)}</span></a>`;
}

function serviceArea(ctx) {
  const city = esc((ctx.cityRaw || ctx.placeRaw || "").toUpperCase());
  const area = esc(String(ctx.lead.area || "").trim());
  const ringLabel = `<text class="rd-area__lbl" x="200" y="${area ? 92 : 104}" text-anchor="middle"${ctx.i18n.ti("Based in", "Con base en")}>Based in</text>`;
  return `<div class="rd-area"><svg viewBox="0 0 400 300" aria-hidden="true" focusable="false"><circle class="rd-ring rd-ring--dash" cx="200" cy="150" r="138"/><circle class="rd-ring rd-ring--dash" cx="200" cy="150" r="104"/><circle class="rd-ring" cx="200" cy="150" r="68"/><circle class="rd-ring rd-ring--pulse" cx="200" cy="150" r="68"/><circle cx="200" cy="150" r="7" fill="var(--primary)" stroke="var(--ink)" stroke-width="2"/>${ringLabel}<text class="rd-area__city" x="200" y="${area ? 196 : 200}" text-anchor="middle">${city}</text>${area ? `<text class="rd-area__lbl" x="200" y="222" text-anchor="middle">${area}</text>` : ""}</svg><p class="rd-area__note">${ctx.t("Service area to confirm with the owner.", "Zona de servicio por confirmar con el dueño.")}</p></div>`;
}

function render(ctx) {
  const t = ctx.t;
  const board = ctx.variants.hero === "board";
  const formId = "rd-form";
  const form = formHeading(ctx);
  const extra = [];

  const header = siteHeader(ctx, { cta: ["Send a request", "Mandar solicitud"] });

  const callBig = (lbl) => (ctx.tel
    ? `<a class="rd-call" href="${esc(ctx.tel)}"><span class="rd-call__lbl">${icon("phone")}${ctx.copyOr("ctaSecondary", lbl)}</span><span class="rd-call__num rd-num">${esc(ctx.phone)}</span><span class="rd-call__sub">${t("Tap to call. Say where you are and what happened.", "Toque para llamar. Diga dónde está y qué pasó.")}</span></a>`
    : `<a class="rd-call" href="#${REQUEST_ID}"><span class="rd-call__lbl">${ctx.copyOr("ctaPrimary", ctx.formCopy.cta)}</span></a>`);

  // The chooser.
  const set = SETS[ctx.categoryKey] || SETS.towing;
  const gid = uid(ctx, "rd");
  const tiles = set.map((k) => {
    const s = SITUATIONS[k];
    const id = `${gid}-${k}`;
    extra.push(`html:has(#${id}:checked) .rd-note--${k}{display:grid}`, `html:has(#${id}:checked) .rd-o-${k}{display:inline}`);
    return `<label class="rd-tile"><input type="radio" name="situation" value="${k}" id="${id}" form="${formId}">${glyph(s.glyph || k)}<b>${t(s.label[0], s.label[1])}</b></label>`;
  }).join("");
  const noteCall = ctx.tel ? `<a href="${esc(ctx.tel)}">${icon("phone")}<span>${esc(ctx.phone)}</span></a>` : `<a href="#${REQUEST_ID}">${t("Send a request", "Mandar solicitud")}</a>`;
  const notes = set.map((k) => {
    const s = SITUATIONS[k];
    return `<div class="rd-note rd-note--${k}" role="status"><small>${t("While you wait", "Mientras espera")}</small><p>${t(s.note[0], s.note[1])}</p>${noteCall}</div>`;
  }).join("");
  const none = `<div class="rd-note rd-note--none"><small>${t("Tap what is happening", "Toque lo que pasa")}</small><p>${t("You get a quick safety note, and your pick goes with the request. Calling is still fastest.", "Verá un consejo rápido de seguridad y su selección va con la solicitud. Llamar sigue siendo lo más rápido.")}</p></div>`;
  const chooser = `<div class="rd-chooser"><div class="rd-chooser__head"><h2 class="rd-caps">${t("What is happening?", "¿Qué está pasando?")}</h2><span>${t("Pick one", "Elija uno")}</span></div><fieldset class="rd-tiles"><legend class="sr-only">${t("What is happening?", "¿Qué está pasando?")}</legend>${tiles}</fieldset><div class="rd-notes">${none}${notes}</div></div>`;
  const shows = set.map((k) => `<span class="rd-o rd-o-${k}"${ctx.i18n.ti(SITUATIONS[k].label[0], SITUATIONS[k].label[1])}>${esc(SITUATIONS[k].label[0])}</span>`).join("");

  const proof = `<div class="rd-proof">${ratingProof(ctx, "chip")}<a href="#${REQUEST_ID}">${ctx.copyOr("ctaPrimary", ["Cannot talk? Send your location", "¿No puede hablar? Mande su ubicación"])}</a></div>`;
  const intro = `<p class="rd-where">${ctx.categoryT}, ${esc(ctx.placeRaw)}</p><h1 class="rd-name rd-caps">${ctx.name}</h1><p class="rd-promise">${ctx.copyOr("headline", ctx.promise)}</p>${ctx.about ? `<p class="rd-about">${ctx.about}</p>` : ""}`;

  const hero = board
    ? `<section class="rd-hero rd-hero--board" id="top"><div class="wrap"><div class="rd-callband"><div>${intro}</div><div>${callBig(["Call now", "Llame ahora"])}${proof}</div></div><div class="rd-lower">${chooser}${serviceArea(ctx)}</div></div></section>`
    : `<section class="rd-hero rd-hero--split" id="top"><div class="wrap rd-hero__grid"><div>${intro}${callBig(["Call now", "Llame ahora"])}${proof}</div>${chooser}</div></section>`;

  const sectionCall = (dark = false) => telLink(ctx, "rd-sec__call", !dark);

  const variant = ctx.variants.services === "chips" ? "chips" : "list";
  const services = ctx.services.length
    ? `<section class="rd-sec rd-svc--${variant}" id="services"><div class="wrap"><div class="rd-head"><div><h2 class="rd-h2 rd-caps">${t("What to call about", "Por qué llamar")}</h2><p class="rd-lede">${t("If yours is not on the list, call and ask.", "Si lo suyo no está en la lista, llame y pregunte.")}</p></div>${sectionCall()}</div>${servicesList(ctx, "list", { numbered: false })}${servicesConfirm(ctx)}</div></section>`
    : "";

  const wait = `<div class="rd-tape" aria-hidden="true"></div><section class="rd-sec rd-sec--dark"><div class="wrap"><div class="rd-head"><div><h2 class="rd-h2 rd-caps">${t("While you wait", "Mientras espera")}</h2><p class="rd-lede">${t("General road safety, wherever you are stuck.", "Seguridad general en el camino, donde sea que esté.")}</p></div>${sectionCall(true)}</div><ol class="rd-wait">${WAIT.map((w, i) => `<li class="rv"><b>${i + 1}</b><h3>${t(w.title[0], w.title[1])}</h3><p>${t(w.body[0], w.body[1])}</p></li>`).join("")}</ol><p class="rd-wait-note">${t("If anyone is hurt or in danger, call 911 first.", "Si alguien está herido o en peligro, llame primero al 911.")}</p></div></section><div class="rd-tape" aria-hidden="true"></div>`;

  // Engine and truck photos fit road service and mobile repair. Nothing in the
  // library shows a tow truck, so towing pages stay photo free.
  const shots = ctx.categoryKey === "towing" ? [] : ctx.photos.many(2);
  const photos = shots.length
    ? `<div class="rd-photos">${shots.map((p) => photoFrame(ctx, p, { cls: "rv", sizes: "(min-width: 820px) 50vw, 100vw", width: 1200, tag: true })).join("")}</div>`
    : "";
  const how = `<section class="rd-sec rd-sec--alt"><div class="wrap"><div class="rd-head"><h2 class="rd-h2 rd-caps">${t("How a call goes", "Cómo va la llamada")}</h2>${sectionCall()}</div>${stepsBlock(ctx)}${photos}</div></section>`;

  const area = board ? "" : `<section class="rd-sec" id="area"><div class="wrap rd-visit"><div><h2 class="rd-h2 rd-caps">${t("Where they are based", "Dónde están")}</h2><p class="rd-lede">${t("Call to check whether they reach you where you are.", "Llame para saber si llegan hasta donde está.")}</p>${ctx.tel ? `<p style="margin-top:1.5rem">${sectionCall()}</p>` : ""}</div>${serviceArea(ctx)}</div></section>`;

  const themes = ctx.themes.length
    ? `<section class="rd-sec rd-sec--alt"><div class="wrap"><h2 class="rd-h2 rd-caps">${t("What customers mention", "Lo que mencionan los clientes")}</h2>${themesBlock(ctx)}</div></section>`
    : "";

  const request = `<section class="rd-sec${themes ? "" : " rd-sec--alt"}" id="${REQUEST_ID}"><div class="wrap rd-req"><div class="rd-req__side"><h2 class="rd-h2 rd-caps">${form.title}</h2><p class="rd-lede">${form.intro}</p><p class="rd-picked">${t("You picked", "Eligió")}: <b>${shows}</b></p>${callBig(["Calling is fastest", "Llamar es lo más rápido"])}</div><div class="rd-panel">${withFormId(ctx, formId)}</div></div></section>`;

  const visit = `<section class="rd-sec rd-sec--alt" id="visit"><div class="wrap rd-visit"><div><h2 class="rd-h2 rd-caps">${t("Hours", "Horario")}</h2><p class="rd-lede">${t("Call ahead to check, especially late at night or on a weekend.", "Llame antes para confirmar, sobre todo de noche o en fin de semana.")}</p></div>${visitDetails(ctx)}</div></section>`;

  const faq = `<section class="rd-sec" id="faq"><div class="wrap rd-visit"><div><h2 class="rd-h2 rd-caps">${t("Questions", "Preguntas")}</h2>${ctx.tel ? `<p style="margin-top:1.5rem">${sectionCall()}</p>` : ""}</div>${faqBlock(ctx)}</div></section>`;

  const close = ctx.tel
    ? `<section class="rd-close"><div class="wrap"><h2 class="rd-h2 rd-caps">${t("Stuck right now?", "¿Varado ahora mismo?")}</h2><a class="rd-close__num rd-num" href="${esc(ctx.tel)}">${esc(ctx.phone)}</a><p>${t("Say where you are and what happened.", "Diga dónde está y qué pasó.")}</p></div></section>`
    : "";

  return {
    css: `${CSS}\n${extra.join("\n")}`,
    body: `${header}<main>${hero}${services}${wait}${how}${area}${themes}${request}${visit}${faq}${close}</main>${siteFooter(ctx)}`,
  };
}

export const direction = {
  key: "auto-roadside-dispatch",
  label: "Roadside dispatch",
  status: "implemented",
  suits: ["towing", "mobile-mechanic", "diesel-truck-repair"],
  keywords: ["24/7", "emergency", "roadside", "mobile-first", "mobile first", "call now", "tow"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Sofia+Sans+Extra+Condensed:wght@800;900&family=Sofia+Sans:wght@400;600&display=swap",
  palettes: PALETTES,
  variants: { hero: ["split", "board"], services: ["list", "chips"], proof: ["chip"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /diesel|semi|engine|electrical/ },
  callbar: "call",
  render,
};
