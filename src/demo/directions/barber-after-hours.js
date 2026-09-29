// After hours: the dark classic shop (research/design-barber-salon.md, direction 1).
// Late evening in a well kept shop: warm light, leather and brass. A full bleed
// warm duotone photo hero with the name in compressed caps, a brass board menu
// with dotted leaders, numbered chairs for the owner's barbers, a warm gallery
// strip and booking that stays on the page. Brass is the one loud decision.

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
  { key: "ah-brass-smoke", name: "Brass and Smoke", vars: { bg: "#0f0d0b", surface: "#1a1612", ink: "#f2eadf", muted: "#b3a796", line: "#3a3129", primary: "#c9a15a", "on-primary": "#0f0d0b", accent: "#c9a15a", deep: "#3a3129", star: "#c9a15a" } },
  { key: "ah-oxblood-leather", name: "Oxblood Leather", vars: { bg: "#120a0a", surface: "#1f1212", ink: "#f4e9dc", muted: "#bba596", line: "#3b2020", primary: "#b0392e", "on-primary": "#f4e9dc", accent: "#d8b27a", deep: "#3b2020", star: "#d8b27a" } },
  { key: "ah-emerald-club", name: "Emerald Club", vars: { bg: "#0b1110", surface: "#13201c", ink: "#efe8da", muted: "#a3b1a8", line: "#2a3a33", primary: "#caa35e", "on-primary": "#0b1110", accent: "#caa35e", deep: "#1f5a47", star: "#caa35e" } },
];

// A brass line drawing of a barber chair: the no photo hero.
const CHAIR_ART = `<svg class="ah-art" viewBox="0 0 200 240" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="78" y="18" width="44" height="26" rx="8"/><path d="M90 44v8M110 44v8"/><path d="M68 52h64l-5 70H73z"/><path d="M76 62h48M75 76h50M74 90h52M74 104h52" opacity=".45"/><path d="M52 98h22v26M126 98h22v26"/><path d="M56 122h88l-7 22H63z"/><path d="M100 144v42"/><path d="M92 150h16v30H92z"/><path d="M84 170l-22 16h44"/><path d="M66 206h68M78 196h44M100 186v10"/></svg>`;

// Film grain, drawn in the page: no image request.
const GRAIN = "<svg class=\"ah-grain\" aria-hidden=\"true\" focusable=\"false\"><filter id=\"ah-grain-f\"><feTurbulence type=\"fractalNoise\" baseFrequency=\".85\" numOctaves=\"2\" stitchTiles=\"stitch\"/><feColorMatrix type=\"saturate\" values=\"0\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(#ah-grain-f)\"/></svg>";

const ROMAN = ["i", "ii", "iii", "iv", "v"];

const CSS = `
:root{--display:"Antonio","Arial Narrow",sans-serif;--body:"Archivo",system-ui,sans-serif;--serif:"Libre Caslon Text",Georgia,serif;--radius:12px;--btn-radius:999px;--max:1200px;--ease:cubic-bezier(.22,1,.36,1);--rule:color-mix(in oklab,var(--accent) 38%,transparent);--field:var(--surface);--field-line:color-mix(in oklab,var(--ink) 18%,transparent);--callbar-bg:var(--surface);--callbar-ink:var(--ink);--lang-fg:var(--accent);--lang-on:var(--bg)}
body{font-size:1.0625rem;line-height:1.7}
em{font-family:var(--serif);font-style:italic;font-weight:400;text-transform:none;letter-spacing:0}
.b-hd{position:sticky;top:0;z-index:10;background:color-mix(in oklab,var(--bg) 90%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid var(--rule)}
.b-hd__in{display:flex;align-items:center;gap:1.5rem;min-height:4.25rem}
.b-brand{margin-right:auto;font-family:var(--display);font-weight:700;font-size:1.4rem;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:72vw}
.b-nav{display:none;gap:1.75rem;font-size:.95rem}
.b-nav a{color:var(--muted);text-decoration:none;transition:color .2s}
.b-nav a:hover{color:var(--ink)}
@media (min-width:1000px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:.9rem}
.b-hd__tel{display:none;align-items:center;gap:.45rem;font-weight:500;text-decoration:none;color:var(--muted)}
.b-hd__tel:hover{color:var(--ink)}
@media (min-width:760px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;padding:.6rem 1.2rem;border-radius:999px;background:var(--primary);color:var(--on-primary);font-weight:600;text-decoration:none;transition:filter .2s}
.b-hd__cta:hover{filter:brightness(1.08)}

.ah-hero{position:relative;isolation:isolate;overflow:hidden;display:grid;align-items:end;min-height:min(88svh,54rem);background:radial-gradient(90% 70% at 50% 30%,color-mix(in oklab,var(--accent) 22%,var(--bg)) 0,var(--bg) 70%)}
.ah-hero .b-photo{position:absolute;inset:0;z-index:-3;--photo-bg:var(--bg)}
.ah-hero .b-photo img{filter:sepia(.5) saturate(.7) brightness(.52) contrast(1.1)}
.ah-art{position:absolute;z-index:-3;left:50%;top:10%;width:min(58vw,26rem);height:auto;transform:translateX(-50%);color:var(--accent);opacity:.55}
.ah-shade{position:absolute;inset:0;z-index:-2;background:radial-gradient(110% 85% at 50% 38%,transparent 0,color-mix(in oklab,var(--bg) 45%,transparent) 55%,var(--bg) 100%),linear-gradient(to bottom,color-mix(in oklab,var(--bg) 35%,transparent) 0,transparent 30%,transparent 55%,var(--bg) 100%)}
.ah-grain{position:absolute;inset:0;z-index:-1;width:100%;height:100%;opacity:.08;mix-blend-mode:overlay;pointer-events:none}
.ah-hero__in{padding:clamp(6rem,18vh,11rem) 0 clamp(2.5rem,7vh,4.5rem);text-align:center}
@media (max-width:759.98px){.ah-hero{min-height:auto}.ah-hero__in{padding:5.5rem 0 3rem}.b-brand{font-size:1.2rem}}
.ah-hero--anchored .ah-hero__in{text-align:left}
.ah-kicker{font-family:var(--serif);font-style:italic;font-size:clamp(1.1rem,1.8vw,1.35rem);color:var(--accent)}
.ah-name{margin-top:.6rem;font-family:var(--display);font-weight:700;text-transform:uppercase;line-height:.9;letter-spacing:.005em;font-size:var(--nsize);overflow-wrap:break-word;text-wrap:balance;animation:kj-rise 1.1s var(--ease) both}
.name--xl{--nsize:clamp(4rem,13vw,7.5rem)}
.name--l{--nsize:clamp(3.4rem,10.5vw,6.75rem)}
.name--m{--nsize:clamp(2.8rem,8vw,5.5rem)}
.name--s{--nsize:clamp(2.3rem,6.2vw,4.4rem)}
.ah-city{margin-top:1rem;font-family:var(--display);font-weight:600;font-size:clamp(.9rem,1.5vw,1.1rem);letter-spacing:.32em;text-transform:uppercase;color:var(--muted)}
.ah-promise{margin:1.5rem auto 0;max-width:34ch;font-size:clamp(1.1rem,1.9vw,1.35rem);line-height:1.5;animation:kj-rise 1.1s .12s var(--ease) both}
.ah-about{margin:1rem auto 0;max-width:52ch;color:var(--muted)}
.ah-hero--anchored .ah-promise,.ah-hero--anchored .ah-about{margin-left:0}
.ah-ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:.75rem;margin-top:2.25rem;animation:kj-rise 1.1s .22s var(--ease) both}
.ah-hero--anchored .ah-ctas{justify-content:flex-start}
.ah-btn{display:inline-flex;align-items:center;gap:.8rem;min-height:3.5rem;padding:.45rem .5rem .45rem 1.5rem;border-radius:999px;font-weight:600;text-decoration:none;transition:transform .35s var(--ease),background-color .25s,filter .25s}
.ah-btn:hover{transform:translateY(-2px)}
.ah-btn--book{background:var(--primary);color:var(--on-primary)}
.ah-btn--book:hover{filter:brightness(1.08)}
.ah-btn .b-arrow{display:grid;place-items:center;width:2.6rem;height:2.6rem;border-radius:50%;background:var(--on-primary);color:var(--primary);transition:transform .35s var(--ease)}
.ah-btn:hover .b-arrow{transform:translateX(3px)}
.ah-btn--tel{padding:.45rem 1.5rem;gap:.55rem;color:var(--ink);background:color-mix(in oklab,var(--ink) 9%,transparent);border:1px solid color-mix(in oklab,var(--ink) 24%,transparent);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.ah-btn--tel:hover{background:color-mix(in oklab,var(--ink) 16%,transparent)}
.ah-hero .b-rating--chip{display:inline-flex;align-items:center;gap:.6rem;margin-top:1.75rem;padding:.5rem 1rem;border-radius:999px;border:1px solid var(--rule);font-size:.95rem;color:var(--muted)}
.ah-hero .b-rating--chip .b-rating__num{font-family:var(--display);font-weight:700;font-size:1.2rem;color:var(--ink)}
.ah-hero .b-rating--chip .stars{width:5.5rem;height:1.1rem}
.stars{color:var(--star)}

.ah-sec{padding:clamp(4.5rem,10vw,8rem) 0;border-top:1px solid var(--rule)}
.ah-sec--surface{background:var(--surface)}
.ah-h2{font-family:var(--display);font-weight:700;text-transform:uppercase;font-size:clamp(2.5rem,6vw,4.25rem);line-height:.95;letter-spacing:.005em}
.ah-h2 em{color:var(--accent);font-size:.82em;letter-spacing:0}
.ah-lede{margin-top:1rem;max-width:52ch;color:var(--muted)}
.ah-head{display:grid;gap:1rem;align-items:end}
@media (min-width:900px){.ah-head{grid-template-columns:minmax(0,1fr) minmax(0,26rem)}.ah-head .ah-lede{margin:0}}

.ah-proof{padding:clamp(3.5rem,8vw,6rem) 0;border-top:1px solid var(--rule)}
.ah-proof .b-rating{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1rem 2.5rem;text-align:left}
.ah-proof .b-rating__num{font-family:var(--display);font-weight:700;font-size:clamp(5.5rem,14vw,9rem);line-height:.8;color:var(--accent)}
.ah-proof .b-rating__side{display:grid;gap:.6rem}
.ah-proof .stars{width:9rem;height:1.8rem}
.ah-proof .b-rating__count{font-family:var(--display);font-weight:600;font-size:clamp(1.4rem,2.6vw,1.9rem);letter-spacing:.06em;text-transform:uppercase}
.ah-proof .b-rating__cap{font-family:var(--serif);font-style:italic;color:var(--muted)}
.ah-proof--split .wrap{display:grid;gap:2.5rem;align-items:center}
@media (min-width:900px){.ah-proof--split .wrap{grid-template-columns:auto minmax(0,1fr);gap:5rem}.ah-proof--split .b-rating{justify-content:flex-start}}
.ah-themes{padding-top:2rem}
.ah-proof .b-themes,.ah-themes .b-themes{display:grid;gap:.25rem}
.ah-proof .b-themes li,.ah-themes .b-themes li{font-family:var(--serif);font-style:italic;font-size:clamp(1.35rem,2.6vw,1.9rem);line-height:1.35}
.ah-proof .b-themes li::before,.ah-themes .b-themes li::before{content:"";display:inline-block;width:.45em;height:1px;margin:0 .6em .3em 0;background:var(--accent)}
.b-themes__note{margin-top:1rem;font-size:.9rem;color:var(--muted)}

.b-svc{display:grid;gap:0 4.5rem;margin-top:3rem}
@media (min-width:880px){.ah-menu--board .b-svc{grid-template-columns:1fr 1fr}}
.ah-menu--single .b-svc{max-width:46rem}
.b-svc__item{display:flex;align-items:baseline;gap:1rem;padding:1.15rem 0;border-bottom:1px solid var(--rule)}
.b-svc__name{font-family:var(--display);font-weight:600;font-size:clamp(1.35rem,2.4vw,1.8rem);letter-spacing:.03em;text-transform:uppercase;line-height:1.15}
.b-svc__dots{flex:1;min-width:1.5rem;border-bottom:2px dotted color-mix(in oklab,var(--accent) 55%,transparent);transform:translateY(-.4rem)}
.b-svc__tail{font-family:var(--serif);font-style:italic;color:var(--accent);white-space:nowrap}
.b-svc-confirm{margin-top:1.75rem;font-family:var(--serif);font-style:italic;color:var(--muted)}
.svc-note{margin-top:.4rem;font-size:.9rem;color:var(--muted)}

.b-team{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-top:3rem}
@media (min-width:900px){.b-team{grid-template-columns:repeat(4,minmax(0,1fr));gap:1.25rem}}
.b-team__card{display:grid;gap:.35rem}
.b-team__frame{position:relative;display:grid;place-items:center;aspect-ratio:4/5;border:1px solid var(--rule);border-radius:var(--radius);background:linear-gradient(180deg,color-mix(in oklab,var(--accent) 8%,var(--surface)),var(--surface));color:var(--accent);overflow:hidden}
.b-team__glyph{width:42%;height:auto;opacity:.8}
.b-team__num{position:absolute;right:.75rem;bottom:.2rem;font-family:var(--display);font-weight:700;font-size:4rem;line-height:1;color:transparent;-webkit-text-stroke:1px color-mix(in oklab,var(--accent) 70%,transparent)}
.b-team__seat{margin-top:.6rem;font-family:var(--display);font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-size:1.15rem}
.b-team__who{font-size:.9rem;color:var(--muted)}
.b-team__book{justify-self:start;margin-top:.25rem;font-size:.9rem;font-weight:600;color:var(--accent);text-underline-offset:.25em}
.b-team__note{margin-top:1.75rem;font-family:var(--serif);font-style:italic;color:var(--muted);max-width:60ch}

.ah-strip .b-gallery{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(14rem,1fr);gap:.75rem;margin-top:3rem;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:.5rem;scrollbar-width:thin}
.b-gallery__tile{position:relative;aspect-ratio:4/5;border-radius:var(--radius);overflow:hidden;scroll-snap-align:start}
.b-gallery__tile img{filter:sepia(.3) saturate(.85) brightness(.92) contrast(1.05);transition:transform .8s var(--ease),filter .5s}
.b-gallery__tile:hover img{transform:scale(1.04);filter:sepia(.15) saturate(.95) brightness(.95)}
.b-gallery__empty{display:grid;place-items:center;border:1px dashed var(--rule);color:var(--muted);font-family:var(--serif);font-style:italic;text-align:center;padding:1rem}

.ah-steps{display:grid;gap:2rem;margin-top:3rem;counter-reset:s}
@media (min-width:820px){.ah-steps{grid-template-columns:repeat(3,minmax(0,1fr));gap:3rem}}
.ah-steps li{padding-top:1.25rem;border-top:1px solid var(--rule)}
.ah-steps .step-n{display:block;font-family:var(--serif);font-style:italic;font-size:2.25rem;line-height:1;color:var(--accent)}
.ah-steps h3{margin-top:.75rem;font-family:var(--display);font-weight:600;text-transform:uppercase;letter-spacing:.04em;font-size:1.5rem}
.ah-steps p{margin-top:.35rem;color:var(--muted);max-width:32ch}

.ah-book{display:grid;gap:3rem}
@media (min-width:980px){.ah-book{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:5rem}.ah-book__side{position:sticky;top:6.5rem;align-self:start}}
.ah-book__side .b-rating--chip{display:inline-flex;align-items:center;gap:.6rem;margin-top:2rem;color:var(--muted)}
.ah-book__side .b-rating--chip .b-rating__num{font-family:var(--display);font-weight:700;font-size:1.6rem;color:var(--ink)}
.ah-book__side .ah-btn--tel{margin-top:1.5rem}
.ah-panel{padding:clamp(1.25rem,3vw,2.5rem);border:1px solid var(--rule);border-radius:calc(var(--radius) + 6px);background:var(--bg)}
.f-chip input:checked+span{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.f-submit{background:var(--primary);color:var(--on-primary);border-radius:999px}
.f-status{color:var(--accent)}

.ah-visit{display:grid;gap:3rem}
@media (min-width:900px){.ah-visit{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:5rem}}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7.5rem 1fr;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--rule)}
.facts div:first-child{border-top:1px solid var(--rule)}
.facts dt{color:var(--muted)}
.facts dd{margin:0;font-weight:500}
.b-visit__pending{display:grid;gap:.5rem;margin-top:1.5rem;font-family:var(--serif);font-style:italic;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-weight:600;color:var(--accent)}

.faq details{border-color:var(--rule)}
.faq summary{font-family:var(--display);font-weight:600;font-size:1.3rem;letter-spacing:.03em;text-transform:uppercase}
.faq summary .ico{color:var(--accent)}

.ah-close{position:relative;overflow:hidden;padding:clamp(5rem,12vw,9rem) 0;text-align:center;border-top:1px solid var(--rule);background:radial-gradient(70% 90% at 50% 100%,color-mix(in oklab,var(--accent) 16%,var(--bg)) 0,var(--bg) 70%)}
.ah-close .ah-h2{font-size:clamp(3rem,9vw,6.5rem)}
.ah-close .ah-ctas{margin-top:2.5rem}

.b-ft{padding:4rem 0 2.5rem;border-top:1px solid var(--rule);text-align:center}
.b-ft__name{font-family:var(--display);font-weight:700;text-transform:uppercase;letter-spacing:.04em;font-size:clamp(2rem,5vw,3rem);line-height:1}
.b-ft__row{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem 2rem;margin-top:1rem;color:var(--muted)}
.b-ft__row a{color:var(--ink);font-weight:600}
.legal{margin-top:2rem;font-size:.85rem;color:var(--muted)}
.stock-credits{margin-top:.5rem}
.b-float{background:var(--primary);color:var(--on-primary);border:1px solid color-mix(in oklab,var(--on-primary) 20%,transparent)}
`;

// A heading with one italic serif word, kept as two i18n pieces so the italic survives the language toggle.
function h2(ctx, lead, word, tag = "h2") {
  return `<${tag} class="ah-h2">${ctx.t(lead[0], lead[1])} <em>${ctx.t(word[0], word[1])}</em></${tag}>`;
}

function promise(ctx) {
  if (!ctx.servicesFromDefaults && ctx.services.length >= 3) {
    const [a, b, c] = ctx.services.map(esc);
    return ctx.copy.headline ? esc(ctx.copy.headline) : ctx.t(`${a}, ${b} and ${c}. Booked in a minute.`, `${a}, ${b} y ${c}. Reserve en un minuto.`);
  }
  return ctx.copyOr("headline", ctx.promise);
}

function render(ctx) {
  const t = ctx.t;
  const anchored = ctx.variants.hero === "anchored";
  const photo = heroPhoto(ctx, { sizes: "100vw" });
  const nav = [
    ctx.services.length ? { href: "#menu", label: ["Menu", "Menú"] } : null,
    { href: "#chairs", label: roleFor(ctx).many },
    { href: "#visit", label: ["Visit", "Visítenos"] },
  ].filter(Boolean);
  const header = siteHeader(ctx, { nav, cta: ["Book now", "Reservar"] });
  const book = (label) => bookButton(ctx, { cls: "ah-btn ah-btn--book", ico: "", arrow: true, label });
  const call = callButton(ctx, { cls: "ah-btn ah-btn--tel", label: false });

  const hero = `<section class="ah-hero${anchored ? " ah-hero--anchored" : ""}" id="top">${photo || CHAIR_ART}<div class="ah-shade" aria-hidden="true"></div>${GRAIN}<div class="wrap ah-hero__in">
<p class="ah-kicker">${ctx.categoryT}</p>
<h1 class="ah-name name--${ctx.nameScale}">${ctx.name}</h1>
<p class="ah-city">${esc(ctx.placeRaw)}</p>
<p class="ah-promise">${promise(ctx)}</p>
${ctx.about ? `<p class="ah-about">${ctx.about}</p>` : ""}
<div class="ah-ctas">${book(ctx.copy.ctaPrimary ? null : ["Book now", "Reservar"])}${call}</div>
${ratingProof(ctx, "chip")}
</div></section>`;

  const split = ctx.variants.proof === "split" && ctx.themes.length;
  const proof = `<section class="ah-proof${split ? " ah-proof--split" : ""}" aria-label="Google rating"><div class="wrap">${ratingProof(ctx, "figure", { caption: !split })}${split ? `<div>${themesBlock(ctx)}</div>` : ""}</div></section>`;
  const themes = !split && ctx.themes.length
    ? `<section class="ah-sec"><div class="wrap">${h2(ctx, ["What clients", "Lo que dicen"], ["mention", "los clientes"])}<div class="ah-themes">${themesBlock(ctx)}</div></div></section>`
    : "";

  const board = ctx.variants.services === "single" ? "single" : "board";
  const menu = ctx.services.length
    ? `<section class="ah-sec ah-menu ah-menu--${board}" id="menu"><div class="wrap"><div class="ah-head">${h2(ctx, ["The", "El"], ["menu", "menú"])}<p class="ah-lede">${t("Every cut is booked by service. Pick one here and choose a time below.", "Cada corte se reserva por servicio. Elija uno aquí y un horario abajo.")}</p></div>${servicesList(ctx, "menu", { tail: ["ask", "pregunte"], link: false, numbered: false })}${servicesConfirm(ctx)}</div></section>`
    : "";

  const team = `<section class="ah-sec ah-sec--surface" id="chairs"><div class="wrap"><div class="ah-head">${h2(ctx, ["Pick your", "Elija su"], ["chair", "silla"])}<p class="ah-lede">${t("Book with a favorite or take the next open chair.", "Reserve con su favorito o tome la siguiente silla libre.")}</p></div>${teamPlaceholders(ctx)}</div></section>`;

  const strip = `<section class="ah-sec ah-strip" id="gallery"><div class="wrap">${h2(ctx, ["From the", "Desde la"], ["chair", "silla"])}${gallery(ctx, { count: 5, sizes: "(min-width: 760px) 22vw, 70vw", width: 800 })}</div></section>`;

  const steps = stepsFor(ctx);
  const how = `<section class="ah-sec ah-sec--surface"><div class="wrap">${h2(ctx, ["How booking", "Cómo se"], ["works", "reserva"])}<ol class="ah-steps">${steps.map((s, i) => `<li class="rv"><span class="step-n" aria-hidden="true">${ROMAN[i] || i + 1}.</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  const form = formHeading(ctx);
  const request = `<section class="ah-sec" id="${REQUEST_ID}"><div class="wrap ah-book"><div class="ah-book__side"><h2 class="ah-h2">${form.title}</h2><p class="ah-lede">${form.intro}</p>${ratingProof(ctx, "chip")}${callButton(ctx, { cls: "ah-btn ah-btn--tel", label: ["Or call", "O llame al"] })}</div><div class="ah-panel">${ctx.form}</div></div></section>`;

  const visit = `<section class="ah-sec ah-sec--surface" id="visit"><div class="wrap ah-visit"><div>${h2(ctx, ["Find the", "Encuentre la"], ["shop", "barbería"])}<p class="ah-lede">${esc(ctx.placeRaw)}</p></div>${visitDetails(ctx)}</div></section>`;

  const faq = `<section class="ah-sec" id="faq"><div class="wrap ah-visit"><div>${h2(ctx, ["Before you", "Antes de"], ["come in", "venir"])}</div>${faqBlock(ctx)}</div></section>`;

  const close = `<section class="ah-close"><div class="wrap">${h2(ctx, ["Ready when", "Listos cuando"], ["you are", "usted diga"], "p")}<div class="ah-ctas">${book(["Book now", "Reservar"])}${call}</div></div></section>`;

  return {
    css: CSS,
    body: `${header}<main>${hero}${proof}${menu}${themes}${team}${strip}${how}${request}${visit}${faq}${close}</main>${siteFooter(ctx)}${floatingBook(ctx)}`,
  };
}

export const direction = {
  key: "barber-after-hours",
  label: "After hours: dark classic shop",
  status: "implemented",
  suits: ["barber", "tattoo"],
  keywords: ["heritage", "old-school", "old school", "classic", "vintage", "history", "premium", "traditional"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Antonio:wght@600;700&family=Archivo:wght@400;500;600&family=Libre+Caslon+Text:ital@1&display=swap",
  palettes: PALETTES,
  variants: { hero: ["centered", "anchored"], services: ["board", "single"], proof: ["strip", "split"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /interior|hot-towel|fade-from-behind|tools|styling-stations|tattoo/ },
  callbar: "split",
  render,
};
