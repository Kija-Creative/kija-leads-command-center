// Fleet livery (research/design-home-contractor.md, home services 3). The
// established local service brand, with the van as identity, done with
// discipline: a full bleed brand field, two diagonal livery stripes running
// off the right edge, a monogram badge generated from the name's initials,
// the name in huge condensed caps and the phone set as a plate. The stripes
// come back as section dividers, the rating sits on a scoreboard, and the
// request lives in a "call or schedule online" split band.

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
  uid,
  visitDetails,
} from "../blocks.js";
import { stepsFor } from "../copy.js";
import { esc, icon } from "../shared.js";
import { hsBlurb, hsGlyph } from "./hs-dispatch-triage.js";

const PALETTES = [
  { key: "livery-navy", name: "Fleet navy and safety yellow", vars: { bg: "#ffffff", surface: "#eef2f8", ink: "#0b1630", muted: "#4a5670", line: "#d6deea", primary: "#ffc629", "on-primary": "#0b1630", accent: "#0f2a5c", band: "#0f2a5c", "on-band": "#ffffff", fleet: "#0f2a5c", "on-fleet": "#ffffff", "fleet-muted": "#b9c6de", stripe: "#ffc629", "on-stripe": "#0b1630", stripe2: "#ffffff", board: "#0b1630", "on-board": "#ffc629" } },
  { key: "livery-firebrick", name: "Firebrick and cream", vars: { bg: "#fff6e5", surface: "#ffffff", ink: "#1c1512", muted: "#5e514a", line: "#ecdcc0", primary: "#b3261e", "on-primary": "#ffffff", accent: "#1f3a5f", band: "#1f3a5f", "on-band": "#fff6e5", fleet: "#b3261e", "on-fleet": "#fff6e5", "fleet-muted": "#f6d3c6", stripe: "#1f3a5f", "on-stripe": "#fff6e5", stripe2: "#fff6e5", board: "#1c1512", "on-board": "#fff6e5" } },
  { key: "livery-green", name: "Truck green", vars: { bg: "#ffffff", surface: "#e9f3ec", ink: "#0b1f14", muted: "#466152", line: "#cfe2d5", primary: "#f2c14e", "on-primary": "#0b1f14", accent: "#0f5132", band: "#0f5132", "on-band": "#ffffff", fleet: "#0f5132", "on-fleet": "#ffffff", "fleet-muted": "#b8d6c3", stripe: "#f2c14e", "on-stripe": "#0b1f14", stripe2: "#ffffff", board: "#0b1f14", "on-board": "#f2c14e" } },
];

const SKIP = /^(and|the|of|inc\.?|llc\.?|co\.?|company|&|services?)$/i;

// Two or three initials for the monogram, from the words that carry the name.
export function initials(name) {
  const words = String(name || "").replace(/[^A-Za-z0-9&\s'.]/g, " ").split(/\s+/).filter(Boolean);
  const main = words.filter((w) => !SKIP.test(w));
  const pick = (main.length ? main : words).map((w) => w.replace(/[^A-Za-z0-9]/g, "")).filter(Boolean);
  const letters = pick.slice(0, pick.length >= 3 && pick[2].length > 3 ? 3 : 2).map((w) => w[0].toUpperCase()).join("");
  return letters || "K";
}

// The monogram badge: a double ring with the name set around it.
function badge(ctx, cls = "fl-badge") {
  const id = uid(ctx, "fl-ring");
  const one = `${ctx.nameRaw} · ${ctx.cityState || ctx.placeRaw} · `.toUpperCase();
  const ring = one.length < 30 ? one + one : one;
  const fs = Math.max(10, Math.min(18, 578 / (ring.length * 0.6))).toFixed(1);
  const mono = initials(ctx.nameRaw);
  const size = mono.length > 2 ? 64 : 84;
  return `<svg class="${cls}" viewBox="0 0 240 240" aria-hidden="true" focusable="false"><defs><path id="${id}" d="M120 120m-92 0a92 92 0 1 1 184 0a92 92 0 1 1-184 0"/></defs><circle cx="120" cy="120" r="116" class="fl-badge__disc"/><circle cx="120" cy="120" r="108" class="fl-badge__ring"/><circle cx="120" cy="120" r="74" class="fl-badge__ring"/><text class="fl-badge__txt" style="font-size:${fs}px" textLength="572" lengthAdjust="spacing"><textPath href="#${id}">${esc(ring)}</textPath></text><text x="120" y="${120 + size * 0.36}" text-anchor="middle" class="fl-badge__mono" style="font-size:${size}px">${esc(mono)}</text></svg>`;
}

const STRIPES = `<svg class="fl-stripes" viewBox="0 0 800 600" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false"><path class="fl-s1" d="M420 600L760 0h120L540 600z"/><path class="fl-s2" d="M580 600L920 0h60L640 600z"/></svg>`;
const DIVIDER = `<div class="fl-divider" aria-hidden="true"><span></span><span></span></div>`;

function plate(ctx, cls = "fl-plate") {
  if (!ctx.tel) return "";
  return `<a class="${cls}" href="${esc(ctx.tel)}"><span class="fl-plate__tab">${ctx.t("Call", "Llame")}</span><span class="fl-plate__num">${esc(ctx.phone)}</span></a>`;
}

const CSS = `
:root{--display:"Sofia Sans Condensed","Arial Narrow",sans-serif;--body:"Sofia Sans",system-ui,sans-serif;--radius:4px;--btn-radius:4px;--chip-radius:4px;--max:1220px;--ease:cubic-bezier(.22,1,.36,1);--field:var(--bg);--field-line:var(--line);--star:var(--primary);--lang-fg:var(--on-fleet);--lang-on:var(--fleet)}
body{font-size:1.0625rem;line-height:1.6}
.fl-caps{font-family:var(--display);font-weight:900;text-transform:uppercase;letter-spacing:.005em;line-height:.9}

.fl-util{background:var(--board);color:color-mix(in oklab,var(--on-board) 80%,var(--board));font-size:.88rem}
.fl-util__in{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.25rem 1.5rem;padding:.45rem 0}
.fl-util a{color:var(--on-board);font-weight:700;text-decoration:none}

.b-hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:4px solid var(--stripe)}
.b-hd__in{display:flex;align-items:center;gap:1rem;min-height:4.5rem}
.b-brand{display:flex;align-items:center;gap:.7rem;margin-right:auto;text-decoration:none;min-width:0}
.b-brand .fl-badge{width:2.9rem;height:2.9rem;flex:none}
.b-brand__name{font-family:var(--display);font-weight:900;text-transform:uppercase;font-size:1.45rem;line-height:.95;letter-spacing:.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:42vw}
.b-nav{display:none;gap:1.5rem;font-weight:700}
.b-nav a{text-decoration:none}
.b-nav a:hover{text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:.4em;text-decoration-color:var(--stripe)}
@media (min-width:1060px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:.9rem}
.b-hd__tel{display:none;align-items:center;gap:.45rem;font-family:var(--display);font-weight:800;font-size:1.35rem;text-decoration:none}
@media (min-width:740px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.85rem;padding:0 1.2rem;border-radius:4px;background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:800;font-size:1.15rem;text-transform:uppercase;letter-spacing:.02em;text-decoration:none}

.fl-badge__disc{fill:var(--fleet)}
.fl-badge__ring{fill:none;stroke:var(--stripe);stroke-width:3}
.fl-badge__txt{fill:var(--on-fleet);font-family:var(--display);font-weight:800;letter-spacing:.06em}
.fl-badge__mono{fill:var(--on-fleet);font-family:var(--display);font-weight:900;letter-spacing:-.01em}

.fl-hero{position:relative;overflow:hidden;background:var(--fleet);color:var(--on-fleet);isolation:isolate}
.fl-stripes{position:absolute;inset:0;width:100%;height:100%;z-index:-1}
.fl-s1{fill:var(--stripe)}
.fl-s2{fill:var(--stripe2)}
@media (max-width:759.98px){.fl-stripes{opacity:.35}}
.fl-hero__in{position:relative;display:grid;gap:2rem;padding:clamp(3rem,7vw,6rem) 0 clamp(3rem,7vw,5.5rem)}
@media (min-width:980px){.fl-hero--badge .fl-hero__in{grid-template-columns:minmax(0,1.4fr) minmax(0,.6fr);align-items:center}}
.fl-kicker{display:inline-flex;align-items:center;gap:.6rem;font-weight:700;color:var(--fleet-muted)}
.fl-kicker::before{content:"";width:2.5rem;height:4px;background:var(--stripe)}
.fl-name{margin-top:1rem;font-family:var(--display);font-weight:900;text-transform:uppercase;line-height:.84;letter-spacing:-.005em;font-size:var(--fs);max-width:12ch;overflow-wrap:break-word}
.fl-name.name--xl{--fs:clamp(4rem,12vw,6rem)}
.fl-name.name--l{--fs:clamp(3.4rem,9.5vw,6rem)}
.fl-name.name--m{--fs:clamp(2.8rem,7.5vw,5.4rem)}
.fl-name.name--s{--fs:clamp(2.3rem,6vw,4.4rem)}
.fl-promise{margin-top:1.25rem;font-size:clamp(1.15rem,2vw,1.4rem);font-weight:500;max-width:34ch}
.fl-ctas{display:flex;flex-wrap:wrap;align-items:center;gap:1rem;margin-top:2rem}
.fl-plate{display:inline-flex;align-items:stretch;border:3px solid var(--on-fleet);border-radius:10px;overflow:hidden;text-decoration:none;background:var(--fleet);color:var(--on-fleet);transition:transform .3s var(--ease)}
.fl-plate:hover{transform:translateY(-2px)}
.fl-plate__tab{display:grid;place-items:center;padding:0 .8rem;background:var(--stripe);color:var(--on-stripe);font-family:var(--display);font-weight:900;text-transform:uppercase;font-size:1rem;letter-spacing:.06em;writing-mode:vertical-rl;transform:rotate(180deg)}
.fl-plate__num{padding:.35rem 1.1rem .2rem;white-space:nowrap;font-family:var(--display);font-weight:900;font-size:clamp(1.7rem,4.5vw,3rem);line-height:1.05;letter-spacing:.02em;font-variant-numeric:tabular-nums}
.fl-btn{display:inline-flex;align-items:center;gap:.55rem;min-height:3.4rem;padding:0 1.5rem;border-radius:4px;background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:800;font-size:1.3rem;text-transform:uppercase;letter-spacing:.02em;text-decoration:none;transition:transform .3s var(--ease)}
.fl-btn:hover{transform:translateY(-2px)}
.fl-btn--line{background:transparent;color:inherit;box-shadow:inset 0 0 0 3px currentColor}
.fl-hero .fl-btn{background:var(--stripe);color:var(--on-stripe)}
.fl-hero .b-rating{display:inline-flex;align-items:center;gap:.6rem;margin-top:1.75rem;font-weight:700}
.fl-hero .stars{width:6rem;height:1.2rem;color:var(--stripe)}
.fl-hero__badge{justify-self:center;width:min(19rem,70vw)}
.fl-hero__badge .fl-badge{width:100%;height:auto;filter:drop-shadow(0 18px 30px rgb(0 0 0 / .25))}
.fl-hero__badge .fl-badge__disc{fill:var(--fleet)}
@media (max-width:979.98px){.fl-hero__badge{display:none}}
.fl-van{position:absolute;inset:0;z-index:-2}
.fl-van .b-photo{height:100%;--photo-bg:var(--fleet)}
.fl-van img{filter:grayscale(1) contrast(1.25) brightness(.85);opacity:.2}
.fl-van .stock-tag{left:auto;right:.75rem;bottom:.75rem}

.fl-board{background:var(--board);color:var(--on-board)}
.fl-board__in{display:grid;gap:1.5rem 3rem;padding:2rem 0;align-items:center}
@media (min-width:860px){.fl-board__in{grid-template-columns:auto minmax(0,1fr) auto}}
.fl-board .b-rating{display:flex;flex-wrap:wrap;gap:1rem}
.fl-board .b-rating__cell{display:grid;grid-template-columns:auto auto;align-items:center;gap:.2rem 1rem}
.fl-board .b-rating__num,.fl-board .b-rating__big{grid-row:span 2;padding:.1rem .7rem 0;border:2px solid color-mix(in oklab,var(--on-board) 35%,transparent);border-radius:6px;background:color-mix(in oklab,var(--on-board) 8%,var(--board));font-family:var(--display);font-weight:900;font-size:clamp(3rem,7vw,4.4rem);line-height:1;font-variant-numeric:tabular-nums;background-image:linear-gradient(transparent calc(50% - 1px),color-mix(in oklab,var(--board) 80%,transparent) calc(50% - 1px),color-mix(in oklab,var(--board) 80%,transparent) calc(50% + 1px),transparent calc(50% + 1px))}
.fl-board .b-rating__lbl{font-family:var(--display);font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:1rem;color:#fff}
.fl-board .stars{width:6.5rem;height:1.3rem;color:var(--on-board)}
.fl-board__note{color:color-mix(in oklab,#fff 78%,var(--board));max-width:40ch}
.fl-board .fl-plate{border-color:var(--on-board);background:transparent;color:#fff}
.fl-board .fl-plate__tab{background:var(--on-board);color:var(--board)}
.fl-board .fl-plate__num{font-size:1.9rem}

.fl-divider{display:flex;gap:10px;height:14px;overflow:hidden;background:var(--bg)}
.fl-divider span{flex:1;background:repeating-linear-gradient(-60deg,var(--stripe) 0 22px,transparent 22px 44px)}
.fl-divider span+span{flex:.35;background:repeating-linear-gradient(-60deg,var(--fleet) 0 22px,transparent 22px 44px)}

.fl-sec{padding:clamp(3.75rem,8vw,6.5rem) 0}
.fl-sec--alt{background:var(--surface)}
.fl-h2{font-family:var(--display);font-weight:900;text-transform:uppercase;font-size:clamp(2.4rem,5.5vw,4rem);line-height:.9;letter-spacing:.005em;max-width:16ch}
.fl-lede{margin-top:1rem;color:var(--muted);max-width:52ch}
.fl-head{display:grid;gap:0 3rem;align-items:end;margin-bottom:2.75rem}
@media (min-width:900px){.fl-head{grid-template-columns:minmax(0,1fr) minmax(0,26rem)}.fl-head .fl-lede{margin:0}}

.fl-tiles{display:grid;grid-template-columns:1fr;gap:0;padding:1px}
@media (min-width:560px){.fl-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:900px){.fl-tiles{grid-template-columns:repeat(3,minmax(0,1fr))}}
.fl-tiles li{display:grid;align-content:start;gap:.6rem;margin:-1px 0 0 -1px;padding:1.6rem 1.5rem 1.5rem;background:var(--bg);border:2px solid var(--line);transition:background-color .25s}
.fl-tiles li:hover{background:var(--surface)}
.fl-tile__ico{display:grid;place-items:center;width:3.5rem;height:3.5rem;border-radius:4px;background:var(--fleet);color:var(--stripe)}
.fl-tile__ico .hs-glyph{width:1.8rem;height:1.8rem}
.fl-tiles h3{margin-top:.5rem;font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:1.6rem;line-height:.95}
.fl-tiles p{color:var(--muted);font-size:.98rem}
.fl-tiles a{justify-self:start;margin-top:.25rem;font-weight:700;text-decoration-thickness:2px;text-underline-offset:.3em;text-decoration-color:var(--stripe)}
.b-svc-confirm{margin-top:1.25rem;color:var(--muted);font-size:.95rem}
.svc-note{margin-top:.3rem;color:var(--muted);font-size:.92rem}

.fl-split{display:grid;background:var(--fleet);color:var(--on-fleet)}
@media (min-width:980px){.fl-split{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)}}
.fl-split__call{position:relative;display:grid;align-content:center;gap:1.5rem;padding:clamp(3rem,6vw,5rem) max(1rem,calc((100vw - var(--max)) / 2)) clamp(3rem,6vw,5rem) max(1rem,calc((100vw - var(--max)) / 2));overflow:hidden;isolation:isolate}
.fl-split__call::before,.fl-split__call::after{content:"";position:absolute;z-index:-1;top:-2rem;bottom:-2rem;transform:skewX(-14deg)}
.fl-split__call::before{right:3.5rem;width:3.25rem;background:var(--stripe)}
.fl-split__call::after{right:1.5rem;width:1.1rem;background:var(--stripe2)}
@media (min-width:980px){.fl-split__call{padding-right:9rem}}
@media (max-width:979.98px){.fl-split__call{padding-right:6rem}.fl-split__call::before{right:2.25rem;width:1.6rem}.fl-split__call::after{right:1rem;width:.6rem}}
.fl-split__call p{max-width:34ch;color:var(--fleet-muted)}
.fl-split__form{padding:clamp(2.5rem,5vw,4rem) max(1rem,calc((100vw - var(--max)) / 2)) clamp(2.5rem,5vw,4rem) clamp(1rem,4vw,3.5rem);background:var(--bg);color:var(--ink)}
@media (max-width:979.98px){.fl-split__form{padding-left:max(1rem,calc((100vw - var(--max)) / 2))}}
.fl-split__form .fl-lede{margin-bottom:2rem}
.fl-h3{font-size:clamp(1.9rem,4vw,2.6rem)}
.f-input{border-width:2px;border-radius:4px;background:var(--bg)}
.f-input:focus{outline:none;border-color:var(--ink)}
.f-label,.f-field legend{font-weight:700}
.f-chip>span{border-width:2px;border-radius:4px;font-weight:600}
.f-chip input:checked+span{background:var(--fleet);color:var(--on-fleet);border-color:var(--fleet)}
.f-submit{border-radius:4px;background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:800;font-size:1.3rem;text-transform:uppercase;letter-spacing:.02em;min-height:3.4rem}
.f-status{border-width:2px;border-radius:4px}

.fl-steps{display:grid;gap:1.5rem;counter-reset:st}
@media (min-width:860px){.fl-steps{grid-template-columns:repeat(3,minmax(0,1fr));gap:2rem}}
.fl-steps li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.4rem 1.1rem;align-items:start}
.fl-steps .step-n{grid-row:span 2;display:grid;place-items:center;width:3.4rem;height:3.4rem;border-radius:50%;background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:900;font-size:1.9rem}
.fl-steps h3{font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:1.55rem;line-height:1;padding-top:.4rem}
.fl-steps p{color:var(--muted)}

.fl-why .b-themes{display:flex;flex-wrap:wrap;gap:.6rem}
.fl-why .b-themes li{padding:.6rem 1rem;border-radius:4px;background:var(--fleet);color:var(--on-fleet);font-weight:700}
.b-themes__note{margin-top:1rem;color:var(--muted);font-size:.92rem}

.fl-area{display:grid;gap:2.5rem}
@media (min-width:900px){.fl-area{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4rem}}
.fl-towns{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.5rem}
.fl-towns li{padding:.55rem 1rem;border:2px solid var(--ink);border-radius:999px;font-weight:700}
.fl-towns li.is-home{background:var(--fleet);border-color:var(--fleet);color:var(--on-fleet)}
.fl-towns li.is-tbc{border-style:dashed;border-color:var(--muted);color:var(--muted);font-weight:500}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem minmax(0,1fr);gap:1rem;padding:.9rem 0;border-bottom:2px solid var(--line)}
.facts div:first-child{border-top:2px solid var(--line)}
.facts dt{font-family:var(--display);font-weight:800;text-transform:uppercase;letter-spacing:.04em}
.facts dd{margin:0}
.b-visit__pending{display:grid;gap:.35rem;margin-top:1rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.45rem;margin-top:1.25rem;font-weight:700}

.faq details{border-top-width:2px}
.faq details:last-child{border-bottom-width:2px}
.faq summary{font-weight:700;font-size:1.12rem}

.fl-final{position:relative;overflow:hidden;background:var(--fleet);color:var(--on-fleet);isolation:isolate}
.fl-final__in{display:grid;gap:1.5rem;justify-items:start;padding:clamp(4rem,8vw,6rem) 0}
.fl-final .fl-h2{max-width:18ch}
.fl-final .fl-btn{background:var(--stripe);color:var(--on-stripe)}

.b-ft{background:var(--board);color:#fff;padding:3rem 0}
.b-ft .wrap{display:grid;gap:.4rem}
.fl-ft__brand{display:flex;align-items:center;gap:1rem}
.fl-ft__brand .fl-badge{width:4rem;height:4rem}
.b-ft__name{font-family:var(--display);font-weight:900;text-transform:uppercase;font-size:2rem;line-height:.9}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.4rem 2rem;margin-top:1rem;color:color-mix(in oklab,#fff 75%,var(--board))}
.b-ft__row a{color:var(--on-board);font-weight:700}
.legal{margin-top:1.25rem;color:color-mix(in oklab,#fff 70%,var(--board));font-size:.88rem}
.stock-credits{color:color-mix(in oklab,#fff 70%,var(--board))}
.callbar{border-radius:6px;font-family:var(--display);font-weight:800;font-size:1.25rem;text-transform:uppercase;letter-spacing:.02em}
@media (max-width:479.98px){.b-brand__name{max-width:62vw}}
@media (max-width:559.98px){.fl-tiles li{grid-template-columns:3.5rem minmax(0,1fr);column-gap:1rem;padding:1.1rem}.fl-tile__ico{grid-row:span 3}.fl-tiles h3{margin-top:0}}
`;

function render(ctx) {
  const t = ctx.t;
  const badgeHero = ctx.variants.hero === "badge";
  const verbPair = ["Schedule service", "Agendar servicio"];
  const verb = ctx.copyOr("ctaPrimary", verbPair);
  const sched = (cls = "fl-btn") => `<a class="${cls}" href="#${REQUEST_ID}">${verb}</a>`;

  const util = `<div class="fl-util"><div class="wrap fl-util__in"><span>${t(`Based in ${ctx.placeRaw}`, `Con base en ${ctx.placeRaw}`)}${ctx.hours ? ` · ${esc(ctx.hours)}` : ""}</span>${ctx.tel ? `<a href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}</div></div>`;
  const brand = `${badge(ctx)}<span class="b-brand__name">${ctx.name}</span>`;
  const header = siteHeader(ctx, {
    brand,
    cta: ["Schedule", "Agendar"],
    nav: [
      ...(ctx.services.length ? [{ href: "#services", label: ["Services", "Servicios"] }] : []),
      { href: `#${REQUEST_ID}`, label: ["Call or schedule", "Llame o agende"] },
      { href: "#area", label: ["Service area", "Zona"] },
    ],
  });

  const van = badgeHero ? null : ctx.photos.next((p) => /van/.test(p.id));
  const vanHtml = van ? `<div class="fl-van">${ctx.photos.img(van, { sizes: "100vw", width: 1600 })}<span class="stock-tag">${t("Stock photo", "Foto de archivo")}</span></div>` : "";
  const hero = `<section class="fl-hero fl-hero--${badgeHero ? "badge" : "stripes"}" id="top">${vanHtml}${STRIPES}<div class="wrap fl-hero__in"><div><p class="fl-kicker">${ctx.categoryT} · ${esc(ctx.cityState || ctx.placeRaw)}</p><h1 class="fl-name name--${ctx.nameScale}">${ctx.name}</h1><p class="fl-promise">${ctx.copyOr("headline", ctx.promise)}</p>${ctx.about ? `<p class="fl-promise">${ctx.about}</p>` : ""}<div class="fl-ctas">${plate(ctx)}${sched()}</div>${ratingProof(ctx, "chip")}</div>${badgeHero ? `<div class="fl-hero__badge">${badge(ctx)}</div>` : ""}</div></section>`;

  const board = `<section class="fl-board" aria-label="Google rating"><div class="wrap fl-board__in">${ratingProof(ctx, "numbers")}<p class="fl-board__note">${t(`The scoreboard, straight from Google reviews left by customers around ${ctx.cityRaw || "town"}.`, `El marcador, directo de las reseñas de Google de clientes de ${ctx.cityRaw || "la zona"}.`)}</p>${plate(ctx)}</div></section>`;

  const services = ctx.services.length
    ? `<section class="fl-sec" id="services"><div class="wrap"><div class="fl-head"><h2 class="fl-h2">${t("What the trucks roll out for", "Para qué salen las camionetas")}</h2><p class="fl-lede">${t("Pick the closest match and schedule it, or call and describe what is going on.", "Elija lo más parecido y agéndelo, o llame y describa qué pasa.")}</p></div><ul class="fl-tiles">${ctx.services.map((s) => { const b = hsBlurb(s); return `<li class="rv"><span class="fl-tile__ico">${hsGlyph(s, { stroke: 2.4 })}</span><h3>${esc(s)}</h3><p>${t(b[0], b[1])}</p><a href="#${REQUEST_ID}">${t("Schedule this", "Agendar esto")}</a></li>`; }).join("")}</ul>${servicesConfirm(ctx)}</div></section>`
    : "";

  const form = formHeading(ctx);
  const split = `<section class="fl-split" id="${REQUEST_ID}"><div class="fl-split__call"><h2 class="fl-h2">${t("Call or schedule online", "Llame o agende en línea")}</h2><p>${t("Happening right now? Calling is fastest. Planning ahead? Send the form and pick a time to be called back.", "¿Está pasando ahora? Llamar es lo más rápido. ¿Está planeando? Mande el formulario y elija cuándo le llamen.")}</p>${plate(ctx)}</div><div class="fl-split__form"><h3 class="fl-h2 fl-h3">${form.title}</h3><p class="fl-lede">${form.intro}</p>${ctx.form}</div></section>`;

  const steps = stepsFor(ctx);
  const how = `<section class="fl-sec"><div class="wrap"><div class="fl-head"><h2 class="fl-h2">${t("How it works", "Cómo funciona")}</h2><p class="fl-lede">${t("The usual order of things. Details to confirm with the owner.", "El orden de siempre. Detalles por confirmar con el dueño.")}</p></div><ol class="fl-steps">${steps.map((s, i) => `<li class="rv"><span class="step-n" aria-hidden="true">${i + 1}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  const themes = themesBlock(ctx);
  const why = themes ? `<section class="fl-sec fl-sec--alt fl-why"><div class="wrap"><div class="fl-head"><h2 class="fl-h2">${t("Why customers call", "Por qué llaman")}</h2></div>${themes}</div></section>` : "";

  const area = `<section class="fl-sec ${themes ? "" : "fl-sec--alt"}" id="area"><div class="wrap fl-area"><div><h2 class="fl-h2">${t("Service area", "Zona de servicio")}</h2><p class="fl-lede">${t(`The shop is based in ${ctx.placeRaw}. The towns the trucks cover are to confirm with the owner.`, `El negocio está en ${ctx.placeRaw}. Las zonas que cubren están por confirmar con el dueño.`)}</p><ul class="fl-towns"><li class="is-home">${esc(ctx.cityRaw || ctx.placeRaw)}</li><li class="is-tbc">${t("More towns to confirm", "Más zonas por confirmar")}</li></ul></div>${visitDetails(ctx)}</div></section>`;

  const faq = `<section class="fl-sec" id="faq"><div class="wrap fl-area"><h2 class="fl-h2">${t("Questions", "Preguntas")}</h2>${faqBlock(ctx)}</div></section>`;

  const final = `<section class="fl-final">${STRIPES}<div class="wrap fl-final__in"><h2 class="fl-h2">${ctx.copyOr("headline", ctx.promise)}</h2><div class="fl-ctas">${plate(ctx)}${sched()}</div></div></section>`;

  const footer = siteFooter(ctx, { name: false, extra: "" }).replace("<div class=\"wrap\">", `<div class="wrap"><div class="fl-ft__brand">${badge(ctx)}<p class="b-ft__name">${ctx.name}</p></div>`);

  return {
    css: CSS,
    body: `${util}${header}<main>${hero}${board}${DIVIDER}${services}${split}${how}${why}${DIVIDER}${area}${faq}${final}</main>${footer}`,
  };
}

export const direction = {
  key: "hs-fleet-livery",
  label: "Fleet livery",
  status: "implemented",
  suits: ["plumbing", "hvac", "septic", "garage-door", "electrical", "pest-control"],
  keywords: ["heritage", "established", "bold", "family", "fleet", "van"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Sofia+Sans+Condensed:wght@800;900&family=Sofia+Sans:wght@400;500;700&display=swap",
  palettes: PALETTES,
  variants: { hero: ["stripes", "badge"], services: ["tiles"], proof: ["scoreboard"] },
  imagery: { photos: true, people: ["none"], heroPeople: ["none"], heroPrefer: /van/ },
  callbar: "call",
  render,
};
