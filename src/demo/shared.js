// Shared building blocks for every demo template: escaping, palette choice,
// i18n, icons, rating marks, the concept ribbon, the call bar and the page shell.
// Nothing here reads the clock or the disk, so renders are reproducible.

export const RIBBON_PREFIX = "Private concept by Kija Creative for ";
export const RIBBON_SUFFIX = ". Not the official website. Details to confirm with the owner.";
export const DEMO_SENT_MESSAGE = "This is a concept. Nothing was sent.";
export const DEMO_SENT_MESSAGE_ES = "Esto es un concepto. No se envió nada.";

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };

export function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

export function ribbonText(business) {
  return `${RIBBON_PREFIX}${business}${RIBBON_SUFFIX}`;
}

// FNV-1a, 32 bit. Stable across Node versions, which Math.random never is.
export function hashString(text) {
  let h = 0x811c9dc5;
  const s = String(text || "");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function pickPalette(lead, palettes) {
  const wanted = lead && lead.demo && lead.demo.palette;
  const chosen = palettes.find((p) => p.key === wanted);
  if (chosen) return chosen;
  return palettes[hashString(lead && lead.id ? lead.id : lead && lead.business) % palettes.length];
}

export function toDate(now, lead) {
  if (now instanceof Date && !Number.isNaN(now.getTime())) return now;
  if (typeof now === "string" && now) {
    const d = new Date(now);
    if (!Number.isNaN(d.getTime())) return d;
  }
  // Render stays pure: fall back to the lead's own date, never the clock.
  const fallback = new Date(`${(lead && lead.addedAt) || "2026-01-01"}T12:00:00.000Z`);
  return Number.isNaN(fallback.getTime()) ? new Date("2026-01-01T12:00:00.000Z") : fallback;
}

export function hasSpanish(lead) {
  const langs = Array.isArray(lead && lead.languages) ? lead.languages : [];
  return langs.some((l) => /^(spanish|espa(n|ñ)ol|es)$/i.test(String(l).trim()));
}

export function formatRating(rating) {
  const n = Number(rating);
  if (!Number.isFinite(n)) return "";
  // 5 shows as "5.0" like Google does; any recorded decimals are kept as is.
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}

export function formatReviews(count) {
  const n = Number(count);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US");
}

export function telHref(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return digits ? `tel:${digits}` : "";
}

export function cleanList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((s) => String(s || "").trim()).filter(Boolean);
}

export function resolveServices(lead, categories) {
  const own = cleanList(lead && lead.services);
  if (own.length) return { items: own, fromDefaults: false };
  const cat = categories && lead && categories[lead.categoryKey];
  const defaults = cleanList(cat && cat.serviceDefaults);
  return { items: defaults, fromDefaults: defaults.length > 0 };
}

export function placeLine(lead) {
  const parts = [lead.area, lead.city, lead.state].map((s) => String(s || "").trim()).filter(Boolean);
  return parts.join(", ");
}

export function cityState(lead) {
  return [lead.city, lead.state].map((s) => String(s || "").trim()).filter(Boolean).join(", ");
}

// Size step for the business name so long names never overflow the hero.
export function nameScale(name) {
  const longestWord = String(name || "").split(/\s+/).reduce((m, w) => Math.max(m, w.length), 0);
  const len = String(name || "").length;
  if (len <= 12 && longestWord <= 8) return "xl";
  if (len <= 22 && longestWord <= 11) return "l";
  if (len <= 34 && longestWord <= 13) return "m";
  return "s";
}

// Spanish labels for the category line when the page is toggled to ES.
export const CATEGORY_ES = {
  "auto-repair": "Taller mecánico",
  "auto-body-collision": "Hojalatería y pintura",
  "tire-shop": "Llantera",
  "muffler-exhaust": "Mofles y escapes",
  "diesel-truck-repair": "Diésel y camiones",
  "mobile-mechanic": "Mecánico a domicilio",
  "auto-detailing": "Detallado y polarizado",
  towing: "Grúas y asistencia vial",
  hvac: "Aire acondicionado y calefacción",
  plumbing: "Plomería",
  electrical: "Electricidad",
  septic: "Servicio de fosas sépticas",
  "garage-door": "Puertas de cochera",
  restoration: "Restauración por agua, fuego y moho",
  "appliance-repair": "Reparación de electrodomésticos",
  "pest-control": "Control de plagas",
  roofing: "Techos",
  concrete: "Concreto",
  fencing: "Cercas",
  pools: "Albercas",
  landscaping: "Jardinería",
  painting: "Pintura",
  "foundation-repair": "Reparación de cimientos",
  remodeling: "Remodelación",
  "tree-service": "Servicio de árboles",
  barber: "Barbería",
  "hair-salon": "Salón de belleza",
  "nail-salon": "Salón de uñas",
  tattoo: "Estudio de tatuajes",
  "pet-grooming": "Estética para mascotas",
  general: "Servicio local",
};

// i18n: template chrome carries both languages; the page script swaps text.
// Lead facts (name, services, themes, hours) are never translated.
export function createI18n(enabled) {
  const dict = {};
  let n = 0;
  const key = (en, es) => {
    const k = `t${(n += 1).toString(36)}`;
    dict[k] = [String(en), String(es)];
    return k;
  };
  const on = (es) => enabled && es !== null && es !== undefined && es !== "";
  return {
    enabled,
    dict,
    // Text node wrapped in a span when bilingual.
    t(en, es) {
      if (!on(es)) return esc(en);
      return `<span data-i18n="${key(en, es)}">${esc(en)}</span>`;
    },
    // Attribute only, for elements whose text is written by the caller (option, button).
    ti(en, es) {
      return on(es) ? ` data-i18n="${key(en, es)}"` : "";
    },
    placeholder(en, es) {
      const base = ` placeholder="${esc(en)}"`;
      return on(es) ? `${base} data-i18n-ph="${key(en, es)}"` : base;
    },
    aria(en, es) {
      const base = ` aria-label="${esc(en)}"`;
      return on(es) ? `${base} data-i18n-aria="${key(en, es)}"` : base;
    },
  };
}

// Inline icons, drawn as simple strokes so they inherit currentColor.
const ICON_PATHS = {
  phone: "<path d=\"M5 3.5h3.2l1.6 4.2-2.1 1.4a11 11 0 0 0 7.2 7.2l1.4-2.1 4.2 1.6V19a1.5 1.5 0 0 1-1.5 1.5A16.5 16.5 0 0 1 3.5 5 1.5 1.5 0 0 1 5 3.5z\"/>",
  arrow: "<path d=\"M4 12h15M13 6l6 6-6 6\"/>",
  pin: "<path d=\"M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z\"/><circle cx=\"12\" cy=\"9.8\" r=\"2.3\"/>",
  clock: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 7.5V12l3 2\"/>",
  camera: "<path d=\"M4 8h3.2l1.6-2.5h6.4L16.8 8H20v11H4z\"/><circle cx=\"12\" cy=\"13.2\" r=\"3.3\"/>",
  check: "<path d=\"M5 12.5l4.2 4.2L19 7\"/>",
  alert: "<path d=\"M12 3.5l9 16H3z\"/><path d=\"M12 10v4.5M12 17.2v.3\"/>",
  calendar: "<rect x=\"4\" y=\"5.5\" width=\"16\" height=\"14\" rx=\"1.5\"/><path d=\"M4 10h16M8.5 3.5v4M15.5 3.5v4\"/>",
  close: "<path d=\"M6 6l12 12M18 6L6 18\"/>",
  plus: "<path d=\"M12 5v14M5 12h14\"/>",
};

export function icon(name, cls = "ico") {
  const body = ICON_PATHS[name] || "";
  return `<svg class="${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

const STAR = "M12 2.8l2.75 5.9 6.45.75-4.8 4.4 1.3 6.35L12 17l-5.7 3.2 1.3-6.35-4.8-4.4 6.45-.75z";

// Five stars with a fill clipped to the real rating, labelled for screen readers.
export function starsSvg(rating, idSuffix, cls = "stars") {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const width = (r / 5) * 120;
  const id = `starclip-${idSuffix}`;
  const stars = [0, 1, 2, 3, 4].map((i) => `<path transform="translate(${i * 24} 0)" d="${STAR}"/>`).join("");
  return `<svg class="${cls}" viewBox="0 0 120 24" width="120" height="24" role="img" aria-label="Rated ${esc(formatRating(rating))} out of 5"><defs><clipPath id="${id}"><rect x="0" y="0" width="${width.toFixed(2)}" height="24"/></clipPath></defs><g class="stars-empty" fill="none" stroke="currentColor" stroke-width="1.2">${stars}</g><g class="stars-fill" fill="currentColor" clip-path="url(#${id})">${stars}</g></svg>`;
}

// Palette tokens become custom properties on :root.
export function varsCss(vars) {
  const body = Object.entries(vars).map(([k, v]) => `--${k}:${v}`).join(";");
  return `:root{${body}}`;
}

export function langToggle(i18n) {
  if (!i18n.enabled) return "";
  return `<div class="lang" role="group"${i18n.aria("Language", "Idioma")}><button type="button" data-lang="en" aria-pressed="true" lang="en">EN</button><button type="button" data-lang="es" aria-pressed="false" lang="es">ES</button></div>`;
}

export function ribbonHtml(lead, i18n) {
  const es = i18n.enabled
    ? `<p class="kr-es" lang="es">Concepto privado de Kija Creative para ${esc(lead.business)}. No es el sitio oficial. Detalles por confirmar con el dueño.</p>`
    : "";
  return `<aside class="kija-ribbon" data-kija-ribbon aria-label="Concept notice"><div class="kr-inner"><p class="kr-text">${esc(ribbonText(lead.business))}</p>${es}<button type="button" class="kr-hide" data-ribbon-hide>${icon("close", "kr-ico")}<span>Hide for presentation</span></button></div></aside>`;
}

export function callBar(ctx) {
  if (!ctx.tel) return "";
  return `<a class="callbar" href="${esc(ctx.tel)}">${icon("phone")}<span>${ctx.t("Call", "Llamar")} ${esc(ctx.phone)}</span></a>`;
}

export function fontsLink(href) {
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${esc(href)}">`;
}

// CSS every template shares. Templates set the custom properties and restyle freely.
export const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;scroll-behavior:smooth;scroll-padding-top:5.5rem}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--body);font-size:1.0625rem;line-height:1.6;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
img,svg{display:block;max-width:100%}
a{color:inherit}
h1,h2,h3{margin:0;text-wrap:balance}
p{margin:0;text-wrap:pretty}
ul,ol{margin:0;padding:0;list-style:none}
button,input,select,textarea{font:inherit;color:inherit}
:focus-visible{outline:3px solid var(--focus,var(--primary));outline-offset:3px}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.ico{width:1.15em;height:1.15em;flex:none}
.wrap{width:min(100% - 2rem,var(--max,1180px));margin-inline:auto}
@media (min-width:760px){.wrap{width:min(100% - 4rem,var(--max,1180px))}}
.stars{width:7.5rem;height:1.5rem;color:var(--star,var(--primary))}
.stars-empty{opacity:.45}

.kija-ribbon{position:relative;z-index:30;background:#111114;color:#f4f4f6;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:.8125rem;line-height:1.45}
.kija-ribbon[data-hidden]{display:none}
.kr-inner{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem 1rem;padding:.55rem 1rem;max-width:1400px;margin-inline:auto}
.kr-text,.kr-es{flex:1 1 20rem}
.kr-es{display:none;color:#c9c9d1}
html[lang="es"] .kr-es{display:block}
.kr-hide{display:inline-flex;align-items:center;gap:.35rem;background:transparent;border:1px solid #55555f;color:#f4f4f6;border-radius:999px;padding:.25rem .7rem;cursor:pointer;font-size:.75rem}
.kr-hide:hover{background:#26262c}
.kr-ico{width:.9rem;height:.9rem}

.lang{display:inline-flex;border:1.5px solid currentColor;border-radius:999px;padding:2px;gap:2px;font-size:.75rem;font-weight:700;letter-spacing:.04em}
.lang button{border:0;background:transparent;border-radius:999px;padding:.3rem .55rem;cursor:pointer;line-height:1}
.lang button[aria-pressed="true"]{background:var(--lang-fg,var(--ink));color:var(--lang-on,var(--bg))}

.callbar{position:fixed;z-index:20;left:.75rem;right:.75rem;bottom:.75rem;display:flex;align-items:center;justify-content:center;gap:.6rem;padding:1rem 1.25rem;border-radius:var(--callbar-radius,999px);background:var(--primary);color:var(--on-primary);font-weight:700;text-decoration:none;box-shadow:0 10px 30px -8px rgb(0 0 0 / .45);transform:translateY(0);transition:transform .4s cubic-bezier(.22,1,.36,1)}
.callbar .ico{width:1.25rem;height:1.25rem}
@media (min-width:860px){.callbar{display:none}}
@media (max-width:859px){body{padding-bottom:5.5rem}}

.req-form{display:grid;gap:1.25rem}
.f-row{display:grid;gap:1.25rem}
@media (min-width:620px){.f-row{grid-template-columns:1fr 1fr}}
.f-field{display:grid;gap:.45rem;min-width:0;border:0;margin:0;padding:0}
.f-label,.f-field legend{font-weight:650;font-size:.95rem;padding:0}
.f-hint{font-size:.85rem;color:var(--muted)}
.f-input{width:100%;padding:.85rem .95rem;border:1.5px solid var(--field-line,var(--line));background:var(--field,transparent);border-radius:var(--radius,6px);color:var(--ink);min-height:3rem;transition:border-color .2s}
.f-input:hover{border-color:var(--muted)}
.f-input::placeholder{color:var(--muted);opacity:1}
textarea.f-input{min-height:7rem;resize:vertical}
select.f-input{appearance:none;background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),linear-gradient(135deg,currentColor 50%,transparent 50%);background-position:calc(100% - 1.2rem) 55%,calc(100% - .85rem) 55%;background-size:.35rem .35rem;background-repeat:no-repeat;padding-right:2.5rem}
.f-chips{display:flex;flex-wrap:wrap;gap:.5rem}
.f-chip{position:relative;display:inline-flex}
.f-chip input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}
.f-chip span{display:inline-flex;align-items:center;gap:.35rem;padding:.6rem 1rem;border:1.5px solid var(--field-line,var(--line));border-radius:var(--chip-radius,999px);font-size:.95rem;line-height:1.2;transition:background-color .2s,color .2s,border-color .2s}
.f-chip input:checked+span{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.f-chip input:focus-visible+span{outline:3px solid var(--focus,var(--primary));outline-offset:2px}
.f-chip.day span{flex-direction:column;align-items:flex-start;gap:0;min-width:4.4rem;border-radius:var(--radius,6px)}
.f-chip.day b{font-size:1.25rem;line-height:1.1}
.f-drop{position:relative;display:grid;place-items:center;gap:.4rem;text-align:center;padding:1.75rem 1rem;border:2px dashed var(--field-line,var(--line));border-radius:var(--radius,6px);background:var(--field,transparent);transition:border-color .2s,background-color .2s}
.f-drop:hover,.f-drop:focus-within{border-color:var(--primary)}
.f-drop input{position:absolute;inset:0;opacity:0;cursor:pointer}
.f-drop .ico{width:2rem;height:2rem;color:var(--primary)}
.f-drop strong{font-size:1rem}
.f-previews{display:grid;grid-template-columns:repeat(auto-fill,minmax(5.5rem,1fr));gap:.5rem}
.f-previews:empty{display:none}
.f-previews img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--radius,6px)}
.f-urgent{display:none;align-items:center;gap:.75rem;flex-wrap:wrap;padding:1rem;border-radius:var(--radius,6px);background:var(--urgent-bg,var(--primary));color:var(--urgent-ink,var(--on-primary))}
.f-urgent a{font-weight:800;white-space:nowrap}
.req-form:has(input[data-urgent]:checked) .f-urgent{display:flex}
.f-submit{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;justify-self:start;border:0;cursor:pointer;padding:1rem 1.6rem;border-radius:var(--btn-radius,var(--radius,6px));background:var(--primary);color:var(--on-primary);font-weight:750;font-size:1.02rem;transition:transform .25s cubic-bezier(.22,1,.36,1),filter .2s}
.f-submit:hover{transform:translateY(-2px);filter:brightness(1.06)}
.f-submit .ico{transition:transform .3s cubic-bezier(.22,1,.36,1)}
.f-submit:hover .ico{transform:translateX(3px)}
.f-status{padding:1rem 1.1rem;border-radius:var(--radius,6px);border:1.5px solid currentColor;font-weight:650}
.f-status:focus{outline:none}
.f-note{font-size:.85rem;color:var(--muted)}

.faq details{border-top:1.5px solid var(--line)}
.faq details:last-child{border-bottom:1.5px solid var(--line)}
.faq summary{display:flex;justify-content:space-between;gap:1rem;align-items:center;cursor:pointer;padding:1.15rem 0;font-weight:650;font-size:1.08rem;list-style:none}
.faq summary::-webkit-details-marker{display:none}
.faq summary .ico{transition:transform .35s cubic-bezier(.22,1,.36,1)}
.faq details[open] summary .ico{transform:rotate(45deg)}
.faq details p{padding:0 0 1.25rem;max-width:62ch;color:var(--muted)}

@keyframes kj-rise{from{opacity:0;transform:translateY(.6em)}to{opacity:1;transform:none}}
@keyframes kj-fade{from{opacity:0}to{opacity:1}}
@keyframes kj-draw{from{stroke-dashoffset:var(--len,1200)}to{stroke-dashoffset:0}}
@supports (animation-timeline:view()){
  .rv{animation:kj-rise linear both;animation-timeline:view();animation-range:entry 0% cover 22%}
}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;animation-delay:0s !important;transition-duration:.01ms !important}
  .rv{animation:none !important}
}
@media print{.kija-ribbon{background:#fff;color:#000;border-bottom:1px solid #000}.kr-hide,.callbar{display:none}}
`;

// The one page script: ribbon, demo forms, local photo previews, language toggle.
// It never makes a network request.
// Built from char codes so no raw separator characters live in this file.
const LINE_SEP = new RegExp(String.fromCharCode(0x2028), "g");
const PARA_SEP = new RegExp(String.fromCharCode(0x2029), "g");

export function pageScript(dict) {
  const json = JSON.stringify(dict || {})
    .replace(/</g, "\\u003c")
    .replace(LINE_SEP, "\\u2028")
    .replace(PARA_SEP, "\\u2029");
  return `(function(){
var root=document.documentElement;root.classList.add("js");
var ribbon=document.querySelector("[data-kija-ribbon]");
document.querySelectorAll("[data-ribbon-hide]").forEach(function(b){b.addEventListener("click",function(){if(ribbon){ribbon.setAttribute("data-hidden","")}})});
document.querySelectorAll("form[data-demo-form]").forEach(function(form){
  form.addEventListener("submit",function(ev){ev.preventDefault();var s=form.querySelector("[data-demo-status]");if(s){s.hidden=false;s.focus()}});
});
document.querySelectorAll("input[data-photo-input]").forEach(function(input){
  var out=document.getElementById(input.getAttribute("data-photo-input"));
  input.addEventListener("change",function(){
    if(!out){return}
    out.textContent="";
    Array.prototype.slice.call(input.files||[],0,6).forEach(function(file){
      if(!/^image\\//.test(file.type)){return}
      var img=document.createElement("img");img.alt="";img.src=URL.createObjectURL(file);out.appendChild(img);
    });
  });
});
var dict=${json};
var keys=Object.keys(dict);
if(!keys.length){return}
function apply(lang){
  var i=lang==="es"?1:0;
  root.lang=lang;
  document.querySelectorAll("[data-i18n]").forEach(function(el){var d=dict[el.getAttribute("data-i18n")];if(d){el.textContent=d[i]}});
  document.querySelectorAll("[data-i18n-ph]").forEach(function(el){var d=dict[el.getAttribute("data-i18n-ph")];if(d){el.setAttribute("placeholder",d[i])}});
  document.querySelectorAll("[data-i18n-aria]").forEach(function(el){var d=dict[el.getAttribute("data-i18n-aria")];if(d){el.setAttribute("aria-label",d[i])}});
  document.querySelectorAll("[data-lang]").forEach(function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-lang")===lang))});
  try{localStorage.setItem("kija-demo-lang",lang)}catch(e){}
}
document.querySelectorAll("[data-lang]").forEach(function(b){b.addEventListener("click",function(){apply(b.getAttribute("data-lang"))})});
var saved=null;try{saved=localStorage.getItem("kija-demo-lang")}catch(e){}
if(saved==="es"){apply("es")}
})();`;
}

export function documentShell({ lang = "en", title, description, fontsHref, css, body, script, comment }) {
  return `<!doctype html>
<html lang="${esc(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${comment ? `<!-- ${esc(comment)} -->\n` : ""}${fontsLink(fontsHref)}
<style>${BASE_CSS}${css}</style>
</head>
<body>
${body}
<script>${script}</script>
</body>
</html>
`;
}
