// Fade lab: the bright modern studio (research/design-barber-salon.md, direction 2).
// Daytime, loud and friendly. A huge italic extra condensed headline, photos in
// rounded cards with chunky ink outlines and hard offset shadows, a tilted
// rating sticker, a bento row, checkerboard strips, and the volt color used
// only as a background under ink text.

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
import { esc, icon } from "../shared.js";

const PALETTES = [
  { key: "fl-chalk-volt", name: "Chalk and Volt", vars: { bg: "#f6f3ee", surface: "#ffffff", ink: "#111111", muted: "#524d47", line: "#111111", primary: "#e4ff3a", "on-primary": "#111111", accent: "#ff6b5a", "on-accent": "#111111", accent3: "#2145d6", "on-accent3": "#ffffff" } },
  { key: "fl-sky-court", name: "Sky Court", vars: { bg: "#eef4fb", surface: "#ffffff", ink: "#0d1b2a", muted: "#44546a", line: "#0d1b2a", primary: "#ffd23f", "on-primary": "#0d1b2a", accent: "#ff5fa2", "on-accent": "#0d1b2a", accent3: "#2f6bff", "on-accent3": "#ffffff" } },
  { key: "fl-mint-shop", name: "Mint Shop", vars: { bg: "#f3f7f2", surface: "#ffffff", ink: "#0f1a14", muted: "#4a574f", line: "#0f1a14", primary: "#3ddc84", "on-primary": "#0f1a14", accent: "#ff8a3d", "on-accent": "#0f1a14", accent3: "#6b4eff", "on-accent3": "#ffffff" } },
];

// Flat clipper on a color block: the no photo hero.
const CLIPPER_ART = `<div class="fl-art" aria-hidden="true"><svg viewBox="0 0 200 240" focusable="false"><g stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><rect x="62" y="30" width="76" height="30" rx="8" style="fill:var(--surface)"/><path d="M68 30V16M78 30V16M88 30V16M98 30V16M108 30V16M118 30V16M128 30V16" fill="none"/><rect x="66" y="56" width="68" height="150" rx="30" style="fill:var(--primary)"/><rect x="88" y="104" width="24" height="44" rx="12" style="fill:var(--surface)"/><path d="M100 206v22" fill="none"/></g></svg></div>`;

const HEADLINE = {
  barber: [["Look sharp.", "Luzca bien."], ["Book fast.", "Reserve rápido."]],
  "hair-salon": [["Fresh look.", "Look nuevo."], ["Book fast.", "Reserve rápido."]],
};

const CSS = `
:root{--display:"Sofia Sans Extra Condensed","Arial Narrow",sans-serif;--body:"Albert Sans",system-ui,sans-serif;--radius:14px;--card:28px;--btn-radius:999px;--max:1240px;--ease:cubic-bezier(.22,1,.36,1);--hard:4px 4px 0 var(--ink);--field:#ffffff;--field-line:var(--ink);--callbar-bg:var(--ink);--callbar-ink:var(--surface);--star:var(--ink);--check:repeating-conic-gradient(var(--ink) 0 25%,transparent 0 50%) 0 0/22px 22px}
body{font-size:1.0625rem;line-height:1.6}
.b-hd{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:2px solid var(--ink)}
.b-hd__in{display:flex;align-items:center;gap:1.25rem;min-height:4.25rem}
.b-brand{margin-right:auto;font-family:var(--display);font-style:italic;font-weight:900;font-size:1.9rem;text-transform:uppercase;letter-spacing:.005em;line-height:1;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:72vw}
.b-nav{display:none;gap:.5rem}
.b-nav a{padding:.45rem .9rem;border-radius:999px;font-weight:600;text-decoration:none;transition:background-color .2s}
.b-nav a:hover{background:var(--surface);box-shadow:inset 0 0 0 2px var(--ink)}
@media (min-width:1000px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:.75rem}
.b-hd__tel{display:none;align-items:center;gap:.4rem;font-weight:700;text-decoration:none}
@media (min-width:760px){.b-hd__tel{display:inline-flex}}
.b-hd__cta,.fl-btn{display:inline-flex;align-items:center;gap:.55rem;border:2px solid var(--ink);border-radius:999px;font-weight:700;text-decoration:none;box-shadow:var(--hard);transition:transform .2s var(--ease),box-shadow .2s var(--ease)}
.b-hd__cta{padding:.55rem 1.15rem;background:var(--primary);color:var(--on-primary)}
.b-hd__cta:hover,.fl-btn:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--ink)}
.b-hd__cta:active,.fl-btn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink)}
.fl-btn{min-height:3.5rem;padding:.8rem 1.6rem;font-size:1.05rem}
.fl-btn--volt{background:var(--primary);color:var(--on-primary)}
.fl-btn--ink{background:var(--ink);color:var(--surface)}
.fl-check{height:22px;background:var(--check);border-block:2px solid var(--ink)}

.fl-hero{padding:clamp(2rem,5vw,4.5rem) 0 clamp(3rem,6vw,5rem)}
.fl-hero__grid{display:grid;gap:clamp(2rem,4vw,3.5rem);align-items:center}
@media (min-width:960px){.fl-hero--split .fl-hero__grid{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr)}}
.fl-tag{display:inline-flex;align-items:center;gap:.6rem;padding:.4rem .9rem .4rem .45rem;border:2px solid var(--ink);border-radius:999px;background:var(--surface);font-weight:700}
.fl-tag i{display:inline-block;width:1.4rem;height:1.4rem;border-radius:50%;background:var(--accent);border:2px solid var(--ink)}
.fl-h1{margin-top:1.25rem;font-family:var(--display);font-style:italic;font-weight:900;text-transform:uppercase;line-height:.84;letter-spacing:-.005em;font-size:clamp(4.25rem,11.5vw,8.75rem)}
.fl-hero--stacked .fl-h1{font-size:clamp(4.25rem,13vw,10rem)}
.fl-h1 span{display:block}
.fl-hl{display:inline-block !important;margin-top:.08em;padding:0 .12em .02em;background:var(--primary);color:var(--on-primary);border:2px solid var(--ink);border-radius:.12em;box-shadow:var(--hard);transform:rotate(-1.5deg)}
.fl-name{margin-top:1.5rem;font-family:var(--display);font-weight:800;font-size:clamp(1.6rem,3vw,2.2rem);text-transform:uppercase;line-height:1}
.fl-sub{margin-top:.75rem;max-width:44ch;color:var(--muted);font-size:1.1rem}
.fl-ctas{display:flex;flex-wrap:wrap;gap:.9rem;margin-top:2rem}
.fl-media{position:relative}
.fl-card{position:relative;border:2px solid var(--ink);border-radius:var(--card);overflow:hidden;box-shadow:8px 8px 0 var(--ink);background:var(--accent3);aspect-ratio:4/5}
.fl-hero--stacked .fl-card{aspect-ratio:16/9}
@media (max-width:959.98px){.fl-card,.fl-hero--stacked .fl-card{aspect-ratio:4/3}}
.fl-card .b-photo{position:absolute;inset:0}
.fl-card img{filter:saturate(1.12) contrast(1.05)}
.fl-card::after{content:"";position:absolute;right:0;top:0;width:88px;height:88px;background:var(--check);border-left:2px solid var(--ink);border-bottom:2px solid var(--ink);border-bottom-left-radius:18px;background-color:var(--surface)}
.fl-art{position:absolute;inset:0;display:grid;place-items:center;color:var(--ink)}
.fl-art svg{width:52%;height:auto;transform:rotate(-12deg)}
.fl-media .b-rating--sticker{position:absolute;left:-1rem;bottom:-1.5rem;z-index:2;display:grid;place-content:center;justify-items:center;gap:.1rem;width:9.5rem;aspect-ratio:1;border-radius:50%;background:var(--accent);color:var(--on-accent);border:2px solid var(--ink);box-shadow:var(--hard);transform:rotate(-10deg);text-align:center}
.fl-media .b-rating--sticker .b-rating__num{font-family:var(--display);font-style:italic;font-weight:900;font-size:3.4rem;line-height:.85}
.fl-media .b-rating--sticker .stars{width:5.25rem;height:1.05rem;color:currentColor}
.fl-media .b-rating--sticker .b-rating__count{font-size:.75rem;font-weight:700;line-height:1.15;max-width:7rem}
@media (max-width:959.98px){.fl-media .b-rating--sticker{left:auto;right:.5rem;bottom:-1.25rem;width:8rem}.fl-media .b-rating--sticker .b-rating__num{font-size:2.8rem}}

.fl-sec{padding:clamp(4rem,9vw,7rem) 0}
.fl-sec--white{background:var(--surface);border-block:2px solid var(--ink)}
.fl-h2{font-family:var(--display);font-style:italic;font-weight:900;text-transform:uppercase;font-size:clamp(3rem,7.5vw,5.5rem);line-height:.86}
.fl-lede{margin-top:1rem;max-width:52ch;color:var(--muted);font-size:1.1rem}
.fl-head{display:grid;gap:1rem;align-items:end}
@media (min-width:900px){.fl-head{grid-template-columns:minmax(0,1fr) minmax(0,26rem)}.fl-head .fl-lede{margin:0}}

.fl-bento{display:grid;gap:1rem;padding:clamp(2.5rem,5vw,4rem) 0}
@media (min-width:880px){.fl-bento{grid-template-columns:1.1fr 1fr 1fr}}
.fl-tile{display:grid;align-content:space-between;gap:1.5rem;min-height:15rem;padding:1.75rem;border:2px solid var(--ink);border-radius:var(--card);box-shadow:var(--hard)}
.fl-tile h3{font-family:var(--display);font-style:italic;font-weight:900;text-transform:uppercase;font-size:clamp(2.2rem,4vw,3rem);line-height:.9}
.fl-tile p{font-weight:500}
.fl-tile--volt{background:var(--primary);color:var(--on-primary)}
.fl-tile--a2{background:var(--accent);color:var(--on-accent)}
.fl-tile--a3{background:var(--accent3);color:var(--on-accent3)}
.fl-tile .fl-btn{justify-self:start;background:var(--surface);color:var(--ink)}
.fl-tile .b-rating{display:grid;gap:.4rem}
.fl-tile .b-rating__num{font-family:var(--display);font-style:italic;font-weight:900;font-size:clamp(5rem,9vw,7rem);line-height:.8}
.fl-tile .b-rating__side{display:grid;gap:.4rem}
.fl-tile .stars{width:7.5rem;height:1.5rem;color:currentColor}
.fl-tile .b-rating__count{font-weight:700;font-size:1.1rem}
.fl-band{background:var(--accent);color:var(--on-accent);border-block:2px solid var(--ink);padding:clamp(2.5rem,5vw,3.5rem) 0}
.fl-band .b-rating{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 2.5rem}
.fl-band .b-rating__num{font-family:var(--display);font-style:italic;font-weight:900;font-size:clamp(6rem,14vw,9rem);line-height:.8}
.fl-band .b-rating__side{display:grid;gap:.4rem}
.fl-band .stars{width:9rem;height:1.8rem;color:currentColor}
.fl-band .b-rating__count{font-family:var(--display);font-weight:800;font-size:clamp(1.8rem,3vw,2.4rem);text-transform:uppercase}
.fl-band .b-themes{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.75rem}
.fl-band .b-themes li{padding:.45rem 1rem;border:2px solid var(--ink);border-radius:999px;background:var(--surface);color:var(--ink);font-weight:700}
.fl-band .b-themes__note{margin-top:1rem;font-size:.9rem}
.fl-themes .b-themes{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:2rem}
.fl-themes .b-themes li{padding:.6rem 1.1rem;border:2px solid var(--ink);border-radius:999px;background:var(--surface);font-weight:700;font-size:1.1rem;box-shadow:var(--hard)}
.fl-themes .b-themes li:nth-child(3n+1){background:var(--primary);color:var(--on-primary)}
.b-themes__note{margin-top:1.25rem;color:var(--muted);font-size:.9rem}

.b-svc{margin-top:2.75rem}
.b-svc--chips{display:flex;flex-wrap:wrap;gap:.8rem}
.b-svc--chips a{display:inline-flex;align-items:center;padding:.9rem 1.5rem;border:2px solid var(--ink);border-radius:999px;background:var(--surface);color:var(--ink);font-family:var(--display);font-style:italic;font-weight:800;font-size:clamp(1.6rem,3vw,2.2rem);text-transform:uppercase;line-height:1;text-decoration:none;box-shadow:var(--hard);transition:transform .2s var(--ease),background-color .2s}
.b-svc--chips li:nth-child(4n+1) a{background:var(--primary);color:var(--on-primary)}
.b-svc--chips li:nth-child(4n+3) a{background:var(--accent);color:var(--on-accent)}
.b-svc--chips a:hover{transform:translate(-2px,-2px) rotate(-1deg)}
.b-svc--grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:1rem}
.b-svc--grid .b-svc__item{display:grid;align-content:space-between;gap:2.5rem;min-height:11rem;padding:1.5rem;border:2px solid var(--ink);border-radius:var(--card);background:var(--surface);box-shadow:var(--hard)}
.b-svc--grid .b-svc__item:nth-child(3n+1){background:var(--primary);color:var(--on-primary)}
.b-svc--grid .b-svc__item:nth-child(3n+2){background:var(--accent);color:var(--on-accent)}
.b-svc--grid .b-svc__n{font-weight:700}
.b-svc--grid .b-svc__name{font-family:var(--display);font-style:italic;font-weight:900;text-transform:uppercase;font-size:clamp(2rem,3.4vw,2.6rem);line-height:.9}
.b-svc-confirm{margin-top:1.75rem;font-weight:600}
.svc-note{margin-top:.3rem;color:var(--muted);font-size:.9rem}

.fl-steps{display:grid;gap:1rem;margin-top:3rem}
@media (min-width:820px){.fl-steps{grid-template-columns:repeat(3,minmax(0,1fr))}}
.fl-steps li{padding:1.75rem;border:2px solid var(--ink);border-radius:var(--card);background:var(--surface);box-shadow:var(--hard)}
.fl-steps .step-n{display:grid;place-items:center;width:3.25rem;height:3.25rem;border:2px solid var(--ink);border-radius:50%;background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:900;font-size:1.8rem}
.fl-steps h3{margin-top:1.25rem;font-family:var(--display);font-style:italic;font-weight:900;text-transform:uppercase;font-size:2.1rem;line-height:.95}
.fl-steps p{margin-top:.5rem;color:var(--muted)}

.b-team{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-top:3rem}
@media (min-width:900px){.b-team{grid-template-columns:repeat(4,minmax(0,1fr))}}
.b-team__card{display:grid;align-content:start;gap:.3rem;padding:1rem;border:2px solid var(--ink);border-radius:var(--card);background:var(--surface);box-shadow:var(--hard)}
.b-team__card:nth-child(4n+1){background:var(--primary);color:var(--on-primary)}
.b-team__card:nth-child(4n+2){background:var(--accent);color:var(--on-accent)}
.b-team__card:nth-child(4n+3){background:var(--accent3);color:var(--on-accent3)}
.b-team__frame{position:relative;display:grid;place-items:center;aspect-ratio:1;border:2px solid currentColor;border-radius:20px;background:color-mix(in oklab,currentColor 8%,transparent)}
.b-team__glyph{width:38%;height:auto;stroke-width:2.5}
.b-team__num{position:absolute;right:.6rem;top:.2rem;font-family:var(--display);font-style:italic;font-weight:900;font-size:2.4rem}
.b-team__seat{margin-top:.75rem;font-family:var(--display);font-style:italic;font-weight:900;text-transform:uppercase;font-size:1.9rem;line-height:.9}
.b-team__who{font-size:.9rem;font-weight:500}
.b-team__book{justify-self:start;margin-top:.5rem;padding:.35rem .8rem;border:2px solid currentColor;border-radius:999px;color:inherit;font-weight:700;font-size:.9rem;text-decoration:none}
.b-team__note{margin-top:1.75rem;color:var(--muted);max-width:62ch}

.fl-gal .b-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-top:3rem}
@media (min-width:860px){.fl-gal .b-gallery{grid-template-columns:repeat(3,minmax(0,1fr))}}
.fl-gal .b-gallery__tile{position:relative;aspect-ratio:1;border:2px solid var(--ink);border-radius:var(--card);overflow:hidden;box-shadow:var(--hard)}
.fl-gal .b-gallery__tile img{filter:saturate(1.1);transition:transform .6s var(--ease)}
.fl-gal .b-gallery__tile:hover img{transform:scale(1.05)}
.fl-gal .b-gallery__empty{display:grid;place-items:center;background:var(--check),var(--surface);font-weight:700}
.fl-gal .b-gallery__empty span{padding:.4rem .8rem;border:2px solid var(--ink);border-radius:999px;background:var(--surface)}

.fl-book{background:var(--primary);color:var(--on-primary);border-block:2px solid var(--ink)}
.fl-book__grid{display:grid;gap:2.5rem}
@media (min-width:980px){.fl-book__grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}.fl-book__side{position:sticky;top:6rem;align-self:start}}
.fl-book .fl-lede{color:inherit}
.fl-book .b-rating--chip{display:inline-flex;align-items:center;gap:.6rem;margin-top:1.75rem;padding:.5rem 1rem;border:2px solid var(--ink);border-radius:999px;background:var(--surface);color:var(--ink);font-weight:700}
.fl-book .b-rating__num{font-family:var(--display);font-style:italic;font-weight:900;font-size:1.6rem;line-height:1}
.fl-book .stars{width:5.25rem;height:1.05rem}
.fl-book .fl-btn{margin-top:1rem}
.fl-panel{padding:clamp(1.25rem,3vw,2.25rem);border:2px solid var(--ink);border-radius:var(--card);background:var(--surface);color:var(--ink);box-shadow:8px 8px 0 var(--ink)}
.f-input{border-width:2px}
.f-chip>span{border-width:2px;border-color:var(--ink);font-weight:600}
.f-chip.day>span{border-radius:14px}
.f-chip input:checked+span{background:var(--primary);color:var(--on-primary);border-color:var(--ink);box-shadow:3px 3px 0 var(--ink)}
.f-submit{background:var(--ink);color:var(--surface);border-radius:999px;border:2px solid var(--ink);box-shadow:4px 4px 0 var(--accent)}
.f-status{border-width:2px}

.fl-visit{display:grid;gap:1.5rem}
@media (min-width:900px){.fl-visit{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:3rem}}
.fl-box{padding:clamp(1.25rem,3vw,2rem);border:2px solid var(--ink);border-radius:var(--card);background:var(--surface);box-shadow:var(--hard)}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:.9rem 0;border-bottom:2px dashed color-mix(in oklab,var(--ink) 25%,transparent)}
.facts dt{color:var(--muted);font-weight:600}
.facts dd{margin:0;font-weight:700}
.b-visit__pending{display:grid;gap:.4rem;margin-top:1.25rem;color:var(--muted);font-weight:500}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.25rem;font-weight:700}

.fl-faq .faq{display:grid;gap:.75rem}
.fl-faq .faq details{border:2px solid var(--ink);border-radius:20px;background:var(--surface);padding:0 1.25rem;box-shadow:var(--hard)}
.fl-faq .faq details:last-child{border-bottom:2px solid var(--ink)}
.fl-faq .faq summary{font-weight:700;font-size:1.15rem}
.fl-faq .faq details[open]{background:color-mix(in oklab,var(--primary) 35%,var(--surface))}

.b-ft{padding:3.5rem 0 2.5rem;background:var(--ink);color:var(--surface)}
.b-ft__name{font-family:var(--display);font-style:italic;font-weight:900;text-transform:uppercase;font-size:clamp(3rem,9vw,6rem);line-height:.85}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;opacity:.85}
.b-ft__row a{color:inherit;font-weight:700}
.legal{margin-top:2rem;font-size:.85rem;opacity:.8}
.stock-credits{margin-top:.5rem;color:inherit;opacity:.8}
.b-float{background:var(--primary);color:var(--on-primary);border:2px solid var(--ink);box-shadow:var(--hard)}
.callbar--split{border:2px solid var(--ink)}
.callbar--split .cb-book{color:var(--on-primary)}
`;

function headline(ctx) {
  const lines = HEADLINE[ctx.categoryKey] || HEADLINE.barber;
  const city = ctx.cityRaw ? `<span class="fl-hl">${esc(ctx.cityRaw)}.</span>` : "";
  if (ctx.copy.headline) return `<h1 class="fl-h1"><span>${esc(ctx.copy.headline)}</span>${city}</h1>`;
  return `<h1 class="fl-h1">${lines.map((l) => `<span>${ctx.t(l[0], l[1])}</span>`).join("")}${city}</h1>`;
}

function render(ctx) {
  const t = ctx.t;
  const stacked = ctx.variants.hero === "stacked";
  const role = roleFor(ctx);
  const nav = [
    ctx.services.length ? { href: "#menu", label: ["Services", "Servicios"] } : null,
    { href: "#chairs", label: role.many },
    { href: "#visit", label: ["Visit", "Visítenos"] },
  ].filter(Boolean);
  const header = siteHeader(ctx, { nav, cta: ["Book now", "Reservar"] });
  const volt = (label) => bookButton(ctx, { cls: "fl-btn fl-btn--volt", ico: "calendar", label });
  const call = callButton(ctx, { cls: "fl-btn fl-btn--ink", label: false });
  const photo = heroPhoto(ctx, { sizes: stacked ? "100vw" : "(min-width: 960px) 45vw, 100vw" });

  const media = `<div class="fl-media"><div class="fl-card">${photo || CLIPPER_ART}</div>${ratingProof(ctx, "sticker")}</div>`;
  const sub = ctx.about || t("Pick a service, pick a chair, pick a time. The shop confirms it.", "Elija servicio, silla y horario. La barbería lo confirma.");
  const hero = `<section class="fl-hero fl-hero--${stacked ? "stacked" : "split"}" id="top"><div class="wrap fl-hero__grid"><div>
<p class="fl-tag"><i aria-hidden="true"></i>${ctx.categoryT}, ${esc(ctx.cityState)}</p>
${headline(ctx)}
<p class="fl-name">${ctx.name}</p>
<p class="fl-sub">${sub}</p>
<div class="fl-ctas">${volt(ctx.copy.ctaPrimary ? null : ["Book now", "Reservar"])}${call}</div>
</div>${media}</div></section>`;

  const hoursLine = ctx.hours ? esc(ctx.hours) : t("Hours to confirm with the shop.", "Horario por confirmar con el negocio.");
  const proof = ctx.variants.proof === "band"
    ? `<section class="fl-band" aria-label="Google rating"><div class="wrap">${ratingProof(ctx, "strip")}${themesBlock(ctx)}</div></section>`
    : `<section aria-label="Google rating"><div class="wrap fl-bento">
<div class="fl-tile fl-tile--volt"><h3>${t("Book online", "Reserve en línea")}</h3><p>${t("Choose a service and a time in under a minute.", "Elija servicio y horario en menos de un minuto.")}</p>${bookButton(ctx, { cls: "fl-btn", ico: "arrow", label: ["Pick a time", "Elegir horario"] })}</div>
<div class="fl-tile fl-tile--a2">${ratingProof(ctx, "strip")}</div>
<div class="fl-tile fl-tile--a3"><h3>${esc(ctx.cityRaw || ctx.cityState)}</h3><p>${hoursLine}</p><a class="fl-btn" href="#visit">${icon("pin")}<span>${t("Find the shop", "Cómo llegar")}</span></a></div>
</div></section>`;
  const themes = ctx.variants.proof !== "band" && ctx.themes.length
    ? `<section class="fl-sec fl-themes"><div class="wrap"><h2 class="fl-h2">${t("What people say", "Lo que dice la gente")}</h2>${themesBlock(ctx)}</div></section>`
    : "";

  const services = ctx.services.length
    ? `<div class="fl-check" aria-hidden="true"></div><section class="fl-sec fl-sec--white" id="menu"><div class="wrap"><div class="fl-head"><h2 class="fl-h2">${t("The menu", "El menú")}</h2><p class="fl-lede">${t("Tap a service to book it.", "Toque un servicio para reservarlo.")}</p></div>${servicesList(ctx, ctx.variants.services === "tiles" ? "grid" : "chips", { numbered: ctx.variants.services === "tiles" })}${servicesConfirm(ctx)}</div></section>`
    : "";

  const steps = stepsFor(ctx);
  const how = `<section class="fl-sec"><div class="wrap"><h2 class="fl-h2">${t("How it works", "Cómo funciona")}</h2><ol class="fl-steps">${steps.map((s, i) => `<li class="rv"><span class="step-n" aria-hidden="true">${i + 1}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  const team = `<section class="fl-sec fl-sec--white" id="chairs"><div class="wrap"><div class="fl-head"><h2 class="fl-h2">${t("Pick your chair", "Elija su silla")}</h2><p class="fl-lede">${t(`Book with your ${role.one[0].toLowerCase()} or grab the next open chair.`, `Reserve con su ${role.one[1].toLowerCase()} o tome la siguiente silla libre.`)}</p></div>${teamPlaceholders(ctx)}</div></section>`;

  const gal = `<section class="fl-sec fl-gal" id="gallery"><div class="wrap"><h2 class="fl-h2">${t("Fresh cuts", "Cortes recientes")}</h2>${gallery(ctx, { count: 6, sizes: "(min-width: 860px) 30vw, 50vw", width: 800 })}</div></section>`;

  const form = formHeading(ctx);
  const request = `<section class="fl-sec fl-book" id="${REQUEST_ID}"><div class="wrap fl-book__grid"><div class="fl-book__side"><h2 class="fl-h2">${form.title}</h2><p class="fl-lede">${form.intro}</p>${ratingProof(ctx, "chip")}<div>${callButton(ctx, { cls: "fl-btn fl-btn--ink", label: ["Or call", "O llame al"] })}</div></div><div class="fl-panel">${ctx.form}</div></div></section>`;

  const visit = `<section class="fl-sec" id="visit"><div class="wrap fl-visit"><div><h2 class="fl-h2">${t("Come through", "Venga")}</h2><p class="fl-lede">${esc(ctx.placeRaw)}</p></div><div class="fl-box">${visitDetails(ctx)}</div></div></section>`;

  const faq = `<section class="fl-sec fl-sec--white fl-faq" id="faq"><div class="wrap fl-visit"><h2 class="fl-h2">${t("Quick answers", "Respuestas rápidas")}</h2>${faqBlock(ctx)}</div></section>`;

  return {
    css: CSS,
    body: `${header}<main>${hero}${proof}${themes}${services}${how}${team}${gal}${request}${visit}${faq}</main><div class="fl-check" aria-hidden="true"></div>${siteFooter(ctx)}${floatingBook(ctx)}`,
  };
}

export const direction = {
  key: "barber-fade-lab",
  label: "Fade lab: bright modern studio",
  status: "implemented",
  suits: ["barber", "hair-salon"],
  keywords: ["bold", "family", "kids", "modern", "fun", "friendly", "fresh", "neighborhood"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Sofia+Sans+Extra+Condensed:ital,wght@0,800;1,800;1,900&family=Albert+Sans:wght@400;500;600;700&display=swap",
  palettes: PALETTES,
  variants: { hero: ["split", "stacked"], services: ["chips", "tiles"], proof: ["bento", "band"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /fade|lineup|clipper|color|foil/ },
  callbar: "split",
  render,
};
