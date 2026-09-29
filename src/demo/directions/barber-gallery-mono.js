// Gallery mono: minimal monochrome studio (research/design-barber-salon.md, direction 4).
// Calm and architectural: strict black and white photography with wide margins,
// the name in very wide spaced caps, hard square buttons, thin rules, and an
// index column of small mono labels down the left like a gallery wall. On a
// phone the name, rating and Book come before the image, so the first screen
// always has an action.

import {
  bookButton,
  callButton,
  faqBlock,
  floatingBook,
  formHeading,
  gallery,
  heroPhoto,
  ratingProof,
  REQUEST_ID,
  roleFor,
  servicesConfirm,
  servicesList,
  siteFooter,
  siteHeader,
  teamPlaceholders,
  themesBlock,
  visitDetails,
} from "../blocks.js";
import { stepsFor } from "../copy.js";
import { esc } from "../shared.js";

const PALETTES = [
  { key: "mono-gallery-white", name: "Gallery White", vars: { bg: "#ffffff", surface: "#f2f2f2", ink: "#111111", muted: "#5e5e5e", line: "#e0e0e0", primary: "#111111", "on-primary": "#ffffff", accent: "#404040", tile: "#e9e9e9", "photo-filter": "grayscale(1) contrast(.92) brightness(1.04)" } },
  { key: "mono-concrete", name: "Concrete", vars: { bg: "#e9e7e3", surface: "#dcd9d3", ink: "#1b1b1b", muted: "#5c5852", line: "#c9c5be", primary: "#1b1b1b", "on-primary": "#e9e7e3", accent: "#8a857d", tile: "#d3cfc8", "photo-filter": "grayscale(1) contrast(.9) brightness(1.02)" } },
  { key: "mono-midnight", name: "Midnight", vars: { bg: "#0e0f11", surface: "#17191c", ink: "#ececec", muted: "#9a9fa6", line: "#2a2d31", primary: "#ececec", "on-primary": "#0e0f11", accent: "#5c6168", tile: "#1d2023", "photo-filter": "grayscale(1) contrast(.95) brightness(.78)" } },
];

// Flat gray planes: mirrors, a counter and two chairs. The no photo hero.
const ROOM_ART = `<svg class="gm-art" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="1200" height="600" fill="var(--surface)" style="fill:var(--surface)"/><path d="M0 430L1200 430L1200 600L0 600Z" style="fill:var(--tile)"/><rect x="170" y="90" width="230" height="250" style="fill:var(--bg);opacity:.7"/><rect x="480" y="90" width="230" height="250" style="fill:var(--bg);opacity:.7"/><rect x="790" y="90" width="230" height="250" style="fill:var(--bg);opacity:.7"/><rect x="140" y="350" width="920" height="16" style="fill:var(--accent);opacity:.45"/><g style="fill:var(--accent);opacity:.7"><rect x="250" y="380" width="70" height="60"/><rect x="238" y="440" width="94" height="16"/><rect x="280" y="456" width="10" height="44"/><rect x="250" y="500" width="70" height="8"/><rect x="560" y="380" width="70" height="60"/><rect x="548" y="440" width="94" height="16"/><rect x="590" y="456" width="10" height="44"/><rect x="560" y="500" width="70" height="8"/><rect x="870" y="380" width="70" height="60"/><rect x="858" y="440" width="94" height="16"/><rect x="900" y="456" width="10" height="44"/><rect x="870" y="500" width="70" height="8"/></g></svg>`;

const CSS = `
:root{--display:"Geist",system-ui,sans-serif;--body:"Geist",system-ui,sans-serif;--mono:"Geist Mono",ui-monospace,monospace;--wide:"Syncopate","Geist",sans-serif;--radius:0px;--btn-radius:0px;--chip-radius:0px;--callbar-radius:0px;--max:1240px;--ease:cubic-bezier(.22,1,.36,1);--field:transparent;--field-line:var(--line);--callbar-bg:var(--bg);--callbar-ink:var(--ink);--star:var(--ink);--lang-fg:var(--ink);--lang-on:var(--bg)}
body{font-weight:400;font-size:1.0625rem;line-height:1.7}
.lang{border-radius:0}.lang button{border-radius:0}
@media (max-width:759.98px){.b-brand{letter-spacing:.2em;font-size:.75rem}}
.gm-label{font-family:var(--mono);font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}

.b-hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--line)}
.b-hd__in{display:flex;align-items:center;gap:1.5rem;min-height:4.5rem}
.b-brand{margin-right:auto;font-family:var(--wide);font-weight:700;font-size:.875rem;letter-spacing:.32em;text-transform:uppercase;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:72vw}
.b-nav{display:none;gap:2rem;font-family:var(--mono);font-size:.75rem;letter-spacing:.16em;text-transform:uppercase}
.b-nav a{text-decoration:none;color:var(--muted);transition:color .2s}
.b-nav a:hover{color:var(--ink)}
@media (min-width:1000px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:1rem}
.b-hd__tel{display:none;align-items:center;gap:.45rem;font-family:var(--mono);font-size:.8125rem;text-decoration:none}
@media (min-width:760px){.b-hd__tel{display:inline-flex}}
.b-hd__cta,.gm-btn{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;border:1px solid var(--ink);font-family:var(--mono);font-size:.8125rem;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;transition:background-color .25s,color .25s}
.b-hd__cta{padding:.7rem 1.2rem;background:var(--primary);color:var(--on-primary)}
.b-hd__cta:hover{background:transparent;color:var(--ink)}
.gm-btn{min-height:3.25rem;padding:.9rem 1.6rem}
.gm-btn--solid{background:var(--primary);color:var(--on-primary)}
.gm-btn--solid:hover{background:transparent;color:var(--ink)}
.gm-btn--line{color:var(--ink)}
.gm-btn--line:hover{background:var(--ink);color:var(--bg)}

.gm-hero{display:grid}
.gm-hero__media{position:relative;overflow:hidden;background:var(--surface)}
.gm-hero__media .b-photo{position:absolute;inset:0;--photo-bg:var(--surface)}
.gm-hero__media img,.gm-sheet img{filter:var(--photo-filter)}
.gm-art{position:absolute;inset:0;width:100%;height:100%}
.gm-hero__copy{padding:clamp(2rem,5vw,3.5rem) 0}
.gm-word{font-family:var(--wide);font-weight:700;text-transform:uppercase;letter-spacing:.4em;margin-right:-.4em;line-height:1.35;font-size:clamp(1.3rem,calc((min(100vw,var(--max)) - 4rem) / (var(--wl) * 1.45)),4.25rem);overflow-wrap:anywhere}
.gm-meta{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 2rem;margin-top:1.5rem}
.gm-meta .b-rating{display:inline-flex;align-items:center;gap:.6rem;font-family:var(--mono);font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase}
.gm-meta .b-rating__num{font-family:var(--display);font-weight:600;font-size:1.25rem;letter-spacing:0}
.gm-meta .stars{width:5.5rem;height:1.1rem}
.gm-ctas{display:flex;flex-wrap:wrap;gap:.75rem;margin-left:auto}
.gm-hero--full .gm-hero__media{min-height:60svh}
@media (min-width:900px){
  .gm-hero--full{grid-template-areas:"s";min-height:min(86svh,54rem)}
  .gm-hero--full>*{grid-area:s}
  .gm-hero--full .gm-hero__media{min-height:0}
  .gm-hero--full .gm-hero__media::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,transparent 45%,var(--bg) 97%)}
  .gm-hero--full .gm-hero__copy{position:relative;z-index:1;align-self:end}
}
.gm-hero--framed .gm-hero__media{width:min(100% - 2rem,var(--max));margin:0 auto clamp(2rem,5vw,4rem);aspect-ratio:16/9}
@media (min-width:760px){.gm-hero--framed .gm-hero__media{width:min(100% - 4rem,var(--max))}}
@media (max-width:759.98px){.gm-hero--framed .gm-hero__media{aspect-ratio:4/3}}

.gm-sec{padding:clamp(4.5rem,11vw,10rem) 0;border-top:1px solid var(--line)}
.gm-sec--surface{background:var(--surface)}
.gm-grid{display:grid;gap:1.5rem 3rem}
@media (min-width:900px){.gm-grid{grid-template-columns:13rem minmax(0,1fr)}}
.gm-h2{font-family:var(--display);font-weight:300;font-size:clamp(2.1rem,4.6vw,3.6rem);line-height:1.08;letter-spacing:-.025em;max-width:22ch}
.gm-h2 b{font-weight:600}
.gm-p{margin-top:1.25rem;max-width:56ch;color:var(--muted)}

.gm-intro{text-align:center}
.gm-intro .gm-h2{margin-inline:auto;max-width:26ch}
.gm-intro .gm-p{margin-inline:auto}

.gm-proof .b-rating{display:flex;flex-wrap:wrap;align-items:flex-end;gap:1.5rem 3rem}
.gm-proof .b-rating__num{font-family:var(--display);font-weight:300;font-size:clamp(6rem,15vw,11rem);line-height:.8;letter-spacing:-.05em}
.gm-proof .b-rating__side{display:grid;gap:.6rem;padding-bottom:.6rem}
.gm-proof .stars{width:8rem;height:1.6rem}
.gm-proof .b-rating__count{font-family:var(--mono);font-size:.8125rem;letter-spacing:.16em;text-transform:uppercase}
.gm-proof .b-rating__cap{flex-basis:100%;color:var(--muted)}
.gm-proof--inline .b-rating{justify-content:center;text-align:center}
.gm-proof .b-themes{display:grid;gap:0;margin-top:3rem;border-top:1px solid var(--line)}
.gm-proof .b-themes li{padding:1rem 0;border-bottom:1px solid var(--line);font-size:clamp(1.2rem,2.2vw,1.5rem);font-weight:300}
.b-themes__note{margin-top:1rem;font-family:var(--mono);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}

.b-svc{display:grid;gap:0 3rem;margin-top:2.5rem}
@media (min-width:760px){.gm-svc--columns .b-svc{grid-template-columns:1fr 1fr}}
.b-svc__item{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;padding:1.35rem 0;border-top:1px solid var(--line)}
.gm-svc--rows .b-svc__item{padding:1.75rem 0}
.gm-svc--rows .b-svc__name{font-size:clamp(1.6rem,3.2vw,2.4rem)}
.b-svc__name{font-weight:400;font-size:clamp(1.15rem,2vw,1.4rem);letter-spacing:-.01em}
.b-svc__dots{display:none}
.b-svc__tail{font-family:var(--mono);font-size:.75rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);text-decoration:none}
.b-svc__tail:hover{color:var(--ink)}
.b-svc-confirm{margin-top:2rem;font-family:var(--mono);font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.svc-note{margin-top:.5rem;color:var(--muted);font-size:.9rem}

.b-team{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2rem 1rem;margin-top:2.5rem}
@media (min-width:900px){.b-team{grid-template-columns:repeat(4,minmax(0,1fr));gap:1.5rem}}
.b-team__frame{position:relative;display:grid;place-items:center;aspect-ratio:3/4;background:var(--tile);color:var(--accent)}
.b-team__glyph{width:34%;height:auto;stroke-width:1}
.b-team__num{position:absolute;left:.75rem;bottom:.5rem;font-family:var(--mono);font-size:.75rem;letter-spacing:.16em}
.b-team__seat{margin-top:1rem;font-weight:600}
.b-team__who{font-size:.9rem;color:var(--muted)}
.b-team__book{display:inline-block;margin-top:.6rem;font-family:var(--mono);font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;text-underline-offset:.35em}
.b-team__note{margin-top:2rem;color:var(--muted);max-width:60ch}

.gm-sheet .b-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-top:2.5rem}
@media (min-width:900px){.gm-sheet .b-gallery{grid-template-columns:1.3fr 1fr 1fr;grid-auto-rows:clamp(12rem,20vw,17rem);gap:1.25rem}.gm-sheet .b-gallery__tile:first-child{grid-row:span 2}.gm-sheet .b-gallery__tile:nth-child(4),.gm-sheet .b-gallery__tile:nth-child(6){grid-column:span 2}}
.gm-sheet .b-gallery__tile{position:relative;aspect-ratio:1;overflow:hidden}
@media (min-width:900px){.gm-sheet .b-gallery__tile{aspect-ratio:auto}}
.gm-sheet .b-gallery__tile img{transition:transform 1.2s var(--ease)}
.gm-sheet .b-gallery__tile:hover img{transform:scale(1.03)}
.gm-sheet .b-gallery__empty{display:grid;place-items:center;background:var(--tile);font-family:var(--mono);font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.stock-tag{border-radius:0;font-family:var(--mono);font-weight:400;letter-spacing:.08em;text-transform:uppercase;font-size:.625rem}

.gm-steps{display:grid;gap:0;margin-top:2.5rem;border-top:1px solid var(--line)}
@media (min-width:820px){.gm-steps{grid-template-columns:repeat(3,minmax(0,1fr))}.gm-steps li+li{border-left:1px solid var(--line);padding-left:2rem}}
.gm-steps li{padding:1.75rem 1.5rem 1.75rem 0}
.gm-steps .step-n{font-family:var(--mono);font-size:.75rem;letter-spacing:.16em;color:var(--muted)}
.gm-steps h3{margin-top:1rem;font-weight:600;font-size:1.2rem}
.gm-steps p{margin-top:.4rem;color:var(--muted)}

.gm-book .b-rating{display:inline-flex;align-items:center;gap:.6rem;margin-top:2rem;font-family:var(--mono);font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase}
.gm-book .b-rating__num{font-family:var(--display);font-weight:600;font-size:1.25rem}
.gm-book .stars{width:5.5rem;height:1.1rem}
.gm-panel{margin-top:2.5rem;padding:clamp(1.25rem,3vw,2.5rem);border:1px solid var(--line);background:var(--bg)}
.f-label,.f-field legend{font-family:var(--mono);font-weight:400;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase}
.f-input{border-width:0 0 1px;padding-left:0;padding-right:0;background:transparent}
select.f-input{padding-right:2rem}
.f-chip>span{border-width:1px}
.f-chip input:checked+span{background:var(--ink);color:var(--bg)}
.f-submit{border-radius:0;font-family:var(--mono);font-weight:400;font-size:.8125rem;letter-spacing:.14em;text-transform:uppercase;padding:1.1rem 1.75rem}
.f-status{border-width:1px;font-weight:400}

.gm-visit{margin-top:2rem}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:8rem 1fr;gap:1rem;padding:1.1rem 0;border-top:1px solid var(--line)}
.facts dt{font-family:var(--mono);font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding-top:.25rem}
.facts dd{margin:0}
.b-visit__pending{display:grid;gap:.4rem;margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--line);color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-family:var(--mono);font-size:.8125rem;letter-spacing:.1em;text-transform:uppercase}

.faq details{border-color:var(--line);border-top-width:1px}
.faq details:last-child{border-bottom-width:1px}
.faq summary{font-weight:400;font-size:1.15rem}

.b-ft{padding:5rem 0 3rem;border-top:1px solid var(--line)}
.b-ft__name{font-family:var(--wide);font-weight:700;text-transform:uppercase;letter-spacing:.35em;font-size:clamp(1rem,2.4vw,1.6rem);line-height:1.4}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2.5rem;margin-top:1.25rem;font-family:var(--mono);font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.b-ft__row a{color:var(--ink)}
.legal{margin-top:2.5rem;font-size:.8125rem;color:var(--muted)}
.stock-credits{margin-top:.5rem}
.b-float{border-radius:0;background:var(--primary);color:var(--on-primary);font-family:var(--mono);font-weight:400;font-size:.8125rem;letter-spacing:.14em;text-transform:uppercase;box-shadow:none}
.callbar--split{border-top:1px solid var(--line);box-shadow:none}
`;

function section(label, body, { id = "", cls = "" } = {}) {
  return `<section class="gm-sec${cls ? ` ${cls}` : ""}"${id ? ` id="${id}"` : ""}><div class="wrap gm-grid"><p class="gm-label">${label}</p><div>${body}</div></div></section>`;
}

function render(ctx) {
  const t = ctx.t;
  const full = ctx.variants.hero !== "framed";
  const role = roleFor(ctx);
  const nav = [
    ctx.services.length ? { href: "#menu", label: ["Services", "Servicios"] } : null,
    { href: "#chairs", label: role.many },
    { href: "#visit", label: ["Visit", "Visítenos"] },
  ].filter(Boolean);
  const header = siteHeader(ctx, { nav, cta: ["Book", "Reservar"] });
  const solid = (label) => bookButton(ctx, { cls: "gm-btn gm-btn--solid", ico: "", label });
  const line = callButton(ctx, { cls: "gm-btn gm-btn--line", label: false, ico: "" });
  const photo = heroPhoto(ctx, { sizes: full ? "100vw" : "(min-width: 1240px) 1240px, 100vw" });

  const copy = `<div class="wrap gm-hero__copy"><h1 class="gm-word" style="--wl:${Math.max(ctx.nameRaw.length, 6)}">${ctx.name}</h1><div class="gm-meta"><span class="gm-label">${ctx.categoryT} / ${esc(ctx.cityState)}</span>${ratingProof(ctx, "chip")}<div class="gm-ctas">${solid(ctx.copy.ctaPrimary ? null : ["Book an appointment", "Reservar una cita"])}${line}</div></div></div>`;
  const media = `<div class="gm-hero__media">${photo || ROOM_ART}</div>`;
  // Phones read the copy first, so the first screen has the name, rating and Book;
  // wide screens lay the name over the photo (full) or above it (framed).
  const hero = `<section class="gm-hero gm-hero--${full ? "full" : "framed"}" id="top">${copy}${media}</section>`;

  const intro = `<section class="gm-sec gm-intro"><div class="wrap"><p class="gm-h2">${ctx.copyOr("headline", ctx.promise)}</p><p class="gm-p">${ctx.about || t(`${ctx.cityRaw ? `In ${ctx.cityRaw}. ` : ""}Choose the service, the chair and the hour. The shop confirms each request.`, `${ctx.cityRaw ? `En ${ctx.cityRaw}. ` : ""}Elija el servicio, la silla y la hora. El negocio confirma cada solicitud.`)}</p></div></section>`;

  const proofCls = ctx.variants.proof === "inline" ? "gm-proof gm-proof--inline" : "gm-proof";
  const proof = section(t("Google", "Google"), `${ratingProof(ctx, "figure")}${themesBlock(ctx)}`, { cls: proofCls });

  const rows = ctx.variants.services === "rows" ? "rows" : "columns";
  const menu = ctx.services.length
    ? section(t("Services", "Servicios"), `<h2 class="gm-h2">${t("The menu, without the noise.", "El menú, sin ruido.")}</h2><div class="gm-svc--${rows}">${servicesList(ctx, "menu", { tail: ["Book", "Reservar"], link: true, numbered: false })}</div>${servicesConfirm(ctx)}`, { id: "menu" })
    : "";

  const team = section(t(role.many[0], role.many[1]), `<h2 class="gm-h2">${t("Four chairs. Your choice of who sits behind them.", "Cuatro sillas. Usted elige quién le atiende.")}</h2>${teamPlaceholders(ctx)}`, { id: "chairs", cls: "gm-sec--surface" });

  const sheet = section(t("Work", "Trabajo"), `<h2 class="gm-h2">${t("From the studio.", "Desde el estudio.")}</h2>${gallery(ctx, { count: 6, sizes: "(min-width: 900px) 33vw, 50vw", width: 800 })}`, { id: "gallery", cls: "gm-sheet" });

  const steps = stepsFor(ctx);
  const how = section(t("Booking", "Reservas"), `<h2 class="gm-h2">${t("Three steps, then the chair.", "Tres pasos y a la silla.")}</h2><ol class="gm-steps">${steps.map((s, i) => `<li class="rv"><span class="step-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol>`, { cls: "gm-sec--surface" });

  const form = formHeading(ctx);
  const request = section(t("Appointments", "Citas"), `<h2 class="gm-h2">${form.title}</h2><p class="gm-p">${form.intro}</p>${ratingProof(ctx, "chip")}<div class="gm-panel">${ctx.form}</div>`, { id: REQUEST_ID, cls: "gm-book" });

  const visit = section(t("Visit", "Visita"), `<h2 class="gm-h2">${esc(ctx.placeRaw)}</h2><div class="gm-visit">${visitDetails(ctx)}</div>`, { id: "visit", cls: "gm-sec--surface" });

  const faq = section(t("Questions", "Preguntas"), faqBlock(ctx), { id: "faq" });

  return {
    css: CSS,
    body: `${header}<main>${hero}${intro}${proof}${menu}${team}${sheet}${how}${request}${visit}${faq}</main>${siteFooter(ctx)}${floatingBook(ctx, { label: ["Book", "Reservar"] })}`,
  };
}

export const direction = {
  key: "barber-gallery-mono",
  label: "Gallery mono: minimal monochrome",
  status: "implemented",
  suits: ["barber", "hair-salon", "tattoo"],
  keywords: ["premium", "minimal", "appointment", "luxury", "gallery", "calm", "studio", "clean"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Syncopate:wght@700&family=Geist:wght@300;400;600&family=Geist+Mono:wght@400&display=swap",
  palettes: PALETTES,
  variants: { hero: ["full", "framed"], services: ["columns", "rows"], proof: ["figure", "inline"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /interior|tools|razor-detail|backwash|tattoo/ },
  callbar: "split",
  render,
};
