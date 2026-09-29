// Cover story: the shop as a magazine cover (research/design-barber-salon.md,
// direction 3, recommended for Most Famous Cutz). One saturated flood, the
// business name as the masthead, a mono issue line, cover lines that carry the
// real rating, and a black and white photo printed into the flood. Inside, the
// pages are black or paper: the numbers, the contents (services), the cast
// (chairs for the owner's barbers), a contact sheet, and booking on a card.

import {
  bookButton,
  callButton,
  faqBlock,
  floatingBook,
  formHeading,
  gallery,
  heroPhoto,
  marquee,
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

const INK = "#0a0a0a";

const PALETTES = [
  { key: "cover-blood-orange", name: "Blood Orange", vars: { flood: "#ff5a1f", "on-flood": INK, bg: "#ffffff", surface: "#f4efe6", ink: INK, muted: "#4a4038", line: "#dcd4c8", primary: INK, "on-primary": "#ffffff", accent: "#ff5a1f", black: INK, "on-black": "#ffffff", "black-muted": "#b5aca3" } },
  { key: "cover-dallas-red", name: "Dallas Red", vars: { flood: "#e1261c", "on-flood": "#0b0b0b", bg: "#ffffff", surface: "#f5f0e8", ink: "#0b0b0b", muted: "#4d3f3a", line: "#ddd4ca", primary: "#0b0b0b", "on-primary": "#ffffff", accent: "#e1261c", black: "#0b0b0b", "on-black": "#ffffff", "black-muted": "#b3aaa4" } },
  { key: "cover-electric-cobalt", name: "Electric Cobalt", vars: { flood: "#2438ff", "on-flood": "#ffffff", bg: "#f5f3ee", surface: "#ffffff", ink: INK, muted: "#474652", line: "#d9d6ce", primary: INK, "on-primary": "#ffffff", accent: "#2438ff", black: INK, "on-black": "#ffffff", "black-muted": "#aeb0c4" } },
  { key: "cover-acid-lime", name: "Acid Lime", vars: { flood: "#d7ff3d", "on-flood": "#0b0b0b", bg: "#ffffff", surface: "#f4f1ea", ink: "#0b0b0b", muted: "#3f4536", line: "#dcdcd0", primary: "#0b0b0b", "on-primary": "#ffffff", accent: "#ff4fa0", black: "#0b0b0b", "on-black": "#ffffff", "black-muted": "#b2b6a4" } },
];

// The no photo cover image: a clipper silhouette printed as halftone dots.
const HALFTONE_ART = `<div class="cv-art" aria-hidden="true"><svg viewBox="0 0 200 260" focusable="false"><defs><pattern id="cv-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="2.4" fill="currentColor"/></pattern><pattern id="cv-dots-fine" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.2" fill="currentColor"/></pattern></defs><rect width="200" height="260" fill="url(#cv-dots-fine)" opacity=".35"/><rect x="62" y="58" width="76" height="170" rx="34" fill="url(#cv-dots)"/><rect x="54" y="34" width="92" height="32" rx="8" fill="currentColor"/><path d="M58 34V18M68 34V18M78 34V18M88 34V18M98 34V18M108 34V18M118 34V18M128 34V18M138 34V18" stroke="currentColor" stroke-width="5"/><rect x="88" y="112" width="24" height="46" rx="12" fill="currentColor"/></svg></div>`;

const ISSUE = {
  barber: ["The barber issue", "Edición barbería"],
  "hair-salon": ["The salon issue", "Edición salón"],
  tattoo: ["The studio issue", "Edición estudio"],
};

const CSS = `
:root{--display:"Noto Serif Display",Georgia,serif;--body:"Schibsted Grotesk",system-ui,sans-serif;--mono:"Courier Prime","Courier New",monospace;--radius:0px;--btn-radius:999px;--max:1240px;--ease:cubic-bezier(.22,1,.36,1);--field:#ffffff;--field-line:color-mix(in oklab,var(--ink) 30%,transparent);--callbar-bg:var(--black);--callbar-ink:var(--on-black);--lang-fg:var(--on-flood);--lang-on:var(--flood);--star:currentColor}
body{font-size:1.0625rem;line-height:1.6}
.cv-mono{font-family:var(--mono);text-transform:uppercase;letter-spacing:.06em}

.b-hd{position:sticky;top:0;z-index:10;background:var(--flood);color:var(--on-flood);border-bottom:1.5px solid var(--on-flood)}
.b-hd__in{display:flex;align-items:center;gap:1rem;min-height:4rem}
.b-brand{margin-right:auto;font-family:var(--display);font-weight:800;font-size:1.4rem;letter-spacing:-.02em;line-height:1;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:72vw}
.b-hd__end{display:flex;align-items:center;gap:.9rem}
.b-hd__tel{display:none;align-items:center;gap:.4rem;font-family:var(--mono);font-weight:700;text-decoration:none}
@media (min-width:860px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;padding:.6rem 1.2rem;border-radius:999px;background:var(--black);color:var(--on-black);font-weight:600;text-decoration:none}

.cv-cover{background:var(--flood);color:var(--on-flood);overflow:hidden}
.cv-cover__in{container-type:inline-size;padding:1.25rem 0 clamp(2.5rem,6vw,4.5rem)}
.cv-issue{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.25rem 1.5rem;padding-bottom:.75rem;border-bottom:1.5px solid currentColor;font-family:var(--mono);font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase}
.cv-mast{position:relative;z-index:2;margin-top:clamp(.75rem,2vw,1.5rem);font-family:var(--display);font-weight:800;line-height:.86;letter-spacing:-.035em;font-size:clamp(3.5rem,calc(var(--mh) * 1cqi),10.5rem);overflow-wrap:break-word;text-wrap:balance;animation:kj-rise 1.1s var(--ease) both}
.cv-mast em{font-style:italic;font-weight:600;letter-spacing:-.03em}
.cv-body{display:grid;gap:2rem;margin-top:clamp(1.5rem,3vw,2.5rem)}
@media (min-width:880px){.cv-cover--cover .cv-body{grid-template-columns:minmax(0,1fr) minmax(0,.9fr);gap:3rem;align-items:end}.cv-cover--cover .cv-frame{margin-top:calc(clamp(3.5rem,calc(var(--mh) * 1cqi),10.5rem) * -.55)}}
.cv-lines{display:grid;gap:0;align-content:end}
.cv-copy{display:grid;align-content:space-between;gap:2rem}
.cv-promise{font-family:var(--display);font-style:italic;font-weight:500;font-size:clamp(1.6rem,3.2vw,2.6rem);line-height:1.1;letter-spacing:-.02em;max-width:18ch}
.cv-lines>li{display:flex;gap:.9rem;align-items:baseline;padding:1rem 0;border-top:1.5px solid currentColor}
.cv-lines .ico{flex:none;width:1.1rem;height:1.1rem;transform:translateY(.15rem)}
.cv-line__big{font-family:var(--display);font-weight:700;font-size:clamp(1.6rem,3vw,2.3rem);line-height:1.1;letter-spacing:-.02em}
.cv-line__big em{font-weight:500}
.cv-lines .b-rating{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1rem}
.cv-lines .b-rating__num{font-family:var(--display);font-weight:800;font-size:clamp(2.6rem,5vw,3.6rem);line-height:.9;letter-spacing:-.03em}
.cv-lines .b-rating__count{font-family:var(--mono);font-size:.95rem;text-transform:uppercase;letter-spacing:.06em}
.cv-lines .stars{width:6.5rem;height:1.3rem;color:var(--on-flood)}
.cv-lines a{color:inherit;text-underline-offset:.2em;text-decoration-thickness:1.5px}
.cv-ctas{display:flex;flex-wrap:wrap;gap:.75rem;padding-top:1.25rem;border-top:1.5px solid currentColor}
.cv-btn{display:inline-flex;align-items:center;gap:.55rem;min-height:3.25rem;padding:.8rem 1.5rem;border-radius:999px;font-weight:600;text-decoration:none;border:1.5px solid currentColor;transition:transform .3s var(--ease),background-color .2s,color .2s}
.cv-btn:hover{transform:translateY(-2px)}
.cv-btn--solid{background:var(--black);color:var(--on-black);border-color:var(--black)}
.cv-btn--line{color:inherit}
.cv-btn--line:hover{background:var(--on-flood);color:var(--flood)}
.cv-frame{position:relative;z-index:1;margin:0;border:2px solid var(--on-flood);aspect-ratio:4/5;background:var(--flood);overflow:hidden}
.cv-frame .b-photo{position:absolute;inset:0;--photo-bg:var(--flood)}
.cv-frame img{filter:grayscale(1) contrast(1.3) brightness(1.08);mix-blend-mode:multiply}
.cv-frame::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(circle,color-mix(in oklab,var(--flood) 70%,#000) .8px,transparent 1.25px);background-size:4px 4px;mix-blend-mode:multiply;opacity:.55}
.cv-cover--banner .cv-frame{aspect-ratio:5/2}
.cv-flag{position:absolute;left:1rem;bottom:1rem;z-index:2;display:inline-flex;align-items:center;gap:.6rem;padding:.55rem 1rem;border:2px solid var(--on-flood);border-radius:999px;background:var(--flood);color:var(--on-flood)}
.cv-flag .b-rating__num{font-family:var(--display);font-weight:800;font-size:1.6rem;line-height:1}
.cv-flag .b-rating__count{font-family:var(--mono);font-size:.8125rem;text-transform:uppercase;letter-spacing:.06em}
.cv-flag .stars{width:5.5rem;height:1.1rem;color:var(--on-flood)}
@media (min-width:880px){.cv-cover--banner .cv-copy{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);column-gap:3rem;align-items:start}.cv-cover--banner .cv-ctas{grid-column:2}}
@media (max-width:879.98px){.cv-cover--banner .cv-frame{aspect-ratio:4/3}}
.cv-art{position:absolute;inset:0;display:grid;place-items:center;color:var(--on-flood)}
.cv-art svg{width:70%;height:auto}
.cv-caption{position:absolute;right:.6rem;bottom:.5rem;z-index:2;font-family:var(--mono);font-size:.6875rem;letter-spacing:.06em;text-transform:uppercase;background:var(--flood);color:var(--on-flood);padding:.15rem .4rem}

.cv-sec{position:relative;padding:clamp(4.5rem,10vw,8rem) 0}
.cv-sec--paper{background:var(--bg);color:var(--ink)}
.cv-sec--alt{background:var(--surface);color:var(--ink)}
.cv-sec--black{background:var(--black);color:var(--on-black)}
.cv-folio{position:absolute;top:1.25rem;right:max(1rem,calc((100% - var(--max)) / 2));font-family:var(--mono);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;opacity:.75}
.cv-h2{font-family:var(--display);font-weight:800;font-size:clamp(2.6rem,6.5vw,5rem);line-height:.95;letter-spacing:-.03em}
.cv-h2 em{font-weight:500}
.cv-dek{margin-top:1rem;max-width:54ch;color:var(--muted)}
.cv-sec--black .cv-dek{color:var(--black-muted)}
.cv-head{display:grid;gap:1rem;align-items:end}
@media (min-width:900px){.cv-head{grid-template-columns:minmax(0,1fr) minmax(0,24rem)}.cv-head .cv-dek{margin:0}}

.cv-numbers .b-rating{display:grid;gap:2.5rem;margin-top:3rem}
@media (min-width:820px){.cv-numbers .b-rating{grid-template-columns:1fr 1fr;gap:0}.cv-numbers .b-rating__cell+.b-rating__cell{border-left:1.5px solid color-mix(in oklab,var(--on-black) 30%,transparent);padding-left:3rem}}
.cv-numbers .b-rating__cell{display:grid;gap:.75rem;align-content:start}
.cv-numbers .b-rating__num,.cv-numbers .b-rating__big{font-family:var(--display);font-weight:800;font-size:clamp(6rem,17vw,12rem);line-height:.8;letter-spacing:-.045em;color:var(--flood)}
.cv-numbers .b-rating__lbl{order:-1;font-family:var(--mono);font-size:.875rem;letter-spacing:.08em;text-transform:uppercase;color:var(--black-muted)}
.cv-numbers .stars{width:9rem;height:1.8rem;color:var(--flood)}
.cv-numbers .b-themes{display:flex;flex-wrap:wrap;gap:.25rem 2rem;margin-top:3.5rem;padding-top:1.5rem;border-top:1.5px solid color-mix(in oklab,var(--on-black) 30%,transparent)}
.cv-numbers .b-themes li{font-family:var(--display);font-style:italic;font-weight:500;font-size:clamp(1.4rem,2.8vw,2rem)}
.cv-numbers .b-themes__note{margin-top:1rem;font-family:var(--mono);font-size:.8125rem;color:var(--black-muted)}

.b-svc{display:grid;gap:0 4rem;margin-top:3rem;counter-reset:svc}
@media (min-width:900px){.cv-contents--index .b-svc{grid-template-columns:1fr 1fr}}
.b-svc__item{display:flex;align-items:baseline;gap:1.25rem;padding:1.25rem 0;border-bottom:1.5px solid var(--ink)}
.b-svc__item:first-child{border-top:1.5px solid var(--ink)}
@media (min-width:900px){.cv-contents--index .b-svc__item:nth-child(2){border-top:1.5px solid var(--ink)}}
.b-svc__n{font-family:var(--mono);font-size:.9rem;min-width:2ch}
.b-svc__name{font-family:var(--display);font-weight:700;font-size:clamp(1.6rem,3.2vw,2.5rem);line-height:1.1;letter-spacing:-.02em}
.b-svc__dots{flex:1;min-width:1rem;border-bottom:1.5px dotted color-mix(in oklab,var(--ink) 45%,transparent);transform:translateY(-.45rem)}
.b-svc__tail{font-family:var(--mono);font-size:.875rem;text-transform:uppercase;letter-spacing:.06em;color:var(--ink);white-space:nowrap;text-underline-offset:.25em}
.b-svc-confirm{margin-top:1.5rem;font-family:var(--mono);font-size:.875rem;text-transform:uppercase;letter-spacing:.04em}
.svc-note{margin-top:.4rem;color:var(--muted);font-size:.9rem}

.cv-marquee{background:var(--flood);color:var(--on-flood);border-block:1.5px solid var(--on-flood);padding:1rem 0;--marquee-s:42s}
.cv-marquee .b-marquee__item{font-family:var(--display);font-style:italic;font-weight:500;font-size:clamp(1.8rem,4vw,3rem);line-height:1.1;padding:0 1.25rem;letter-spacing:-.02em}
.cv-marquee .b-marquee__sep{align-self:center;width:.6rem;height:.6rem;border-radius:50%;background:currentColor}
.b-marquee__run{display:inline-flex;align-items:center}

.b-team{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.5rem 1rem;margin-top:3rem}
@media (min-width:900px){.b-team{grid-template-columns:repeat(4,minmax(0,1fr))}}
.b-team__frame{position:relative;display:grid;place-items:center;aspect-ratio:4/5;border:1.5px solid var(--ink);background:repeating-linear-gradient(135deg,transparent 0 10px,color-mix(in oklab,var(--ink) 7%,transparent) 10px 11px),var(--bg);color:var(--ink)}
.b-team__glyph{width:38%;height:auto}
.b-team__num{position:absolute;left:.6rem;top:.4rem;font-family:var(--mono);font-size:.8rem}
.b-team__seat{margin-top:.75rem;font-family:var(--display);font-weight:700;font-size:1.5rem;letter-spacing:-.02em;line-height:1.1}
.b-team__who{font-family:var(--mono);font-size:.8125rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
.b-team__book{display:inline-block;margin-top:.5rem;font-weight:600;text-underline-offset:.25em}
.b-team__note{margin-top:2rem;max-width:62ch;color:var(--muted)}

.cv-sheet .b-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;margin-top:3rem;counter-reset:frame}
@media (min-width:820px){.cv-sheet .b-gallery{grid-template-columns:repeat(3,minmax(0,1fr))}}
.cv-sheet .b-gallery__tile{position:relative;aspect-ratio:1;border:1.5px solid color-mix(in oklab,var(--on-black) 70%,transparent);counter-increment:frame}
.cv-sheet .b-gallery__tile img{filter:grayscale(1) contrast(1.1);transition:filter .4s}
.cv-sheet .b-gallery__tile:hover img{filter:grayscale(.2) contrast(1.05)}
.cv-sheet .b-gallery__tile::after{content:counter(frame,decimal-leading-zero) "A";position:absolute;left:.5rem;bottom:.4rem;font-family:var(--mono);font-size:.75rem;color:var(--flood);letter-spacing:.06em}
.cv-sheet .b-gallery__empty{display:grid;place-items:center;color:var(--black-muted);font-family:var(--mono);font-size:.8rem;text-transform:uppercase;text-align:center;padding:1rem}
.cv-sheet-note{margin-top:1.25rem;font-family:var(--mono);font-size:.8125rem;text-transform:uppercase;letter-spacing:.04em;color:var(--black-muted)}

.cv-steps{display:grid;gap:1.5rem;margin-top:3rem}
@media (min-width:820px){.cv-steps{grid-template-columns:repeat(3,minmax(0,1fr));gap:2.5rem}}
.cv-steps li{padding-top:1rem;border-top:1.5px solid var(--ink)}
.cv-steps .step-n{font-family:var(--mono);font-size:.875rem}
.cv-steps h3{margin-top:.5rem;font-family:var(--display);font-weight:700;font-size:1.75rem;letter-spacing:-.02em;line-height:1.1}
.cv-steps p{margin-top:.4rem;color:var(--muted)}

.cv-book{display:grid;gap:3rem}
@media (min-width:980px){.cv-book{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4.5rem}.cv-book__side{position:sticky;top:6rem;align-self:start}}
.cv-book__side .b-rating{display:inline-flex;align-items:center;gap:.6rem;margin-top:2rem;padding:.6rem 1rem;border:1.5px solid var(--ink);border-radius:999px}
.cv-book__side .b-rating__num{font-family:var(--display);font-weight:800;font-size:1.5rem;line-height:1}
.cv-book__side .stars{width:5.5rem;height:1.1rem}
.cv-book__side .cv-btn{margin-top:1.25rem}
.cv-card{position:relative;padding:clamp(1.5rem,3.5vw,2.75rem);border:2px solid var(--ink);background:#fff;box-shadow:10px 10px 0 var(--flood)}
.cv-card__label{display:flex;justify-content:space-between;gap:1rem;margin:0 calc(clamp(1.5rem,3.5vw,2.75rem) * -1) 2rem;padding:0 clamp(1.5rem,3.5vw,2.75rem) 1rem;border-bottom:1.5px dashed color-mix(in oklab,var(--ink) 40%,transparent);font-family:var(--mono);font-size:.8125rem;text-transform:uppercase;letter-spacing:.08em}
.f-input{border-radius:0}
.f-chip>span{border-radius:999px}
.f-chip.day>span{border-radius:0}
.f-chip input:checked+span{background:var(--flood);color:var(--on-flood);border-color:var(--ink)}
.f-submit{background:var(--black);color:var(--on-black);border-radius:999px}
.f-status{border-width:2px}

.cv-visit{display:grid;gap:3rem}
@media (min-width:900px){.cv-visit{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:5rem}}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7.5rem 1fr;gap:1rem;padding:1rem 0;border-bottom:1.5px solid var(--ink)}
.facts div:first-child{border-top:1.5px solid var(--ink)}
.facts dt{font-family:var(--mono);font-size:.875rem;text-transform:uppercase;letter-spacing:.04em;padding-top:.15rem}
.facts dd{margin:0;font-weight:600}
.b-visit__pending{display:grid;gap:.4rem;margin-top:1.5rem;font-family:var(--mono);font-size:.875rem;text-transform:uppercase;letter-spacing:.03em;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-weight:600}

.cv-letters .faq details{border-color:var(--ink)}
.cv-letters .faq summary{font-family:var(--display);font-weight:700;font-size:clamp(1.3rem,2.4vw,1.7rem);letter-spacing:-.01em;justify-content:flex-start}
.cv-letters .faq summary::before{content:"Q.";font-style:italic;font-weight:500;margin-right:.35rem;color:var(--muted)}
.cv-letters .faq summary .ico{margin-left:auto}
.cv-letters .faq details p{color:var(--ink);font-size:1.05rem}
.cv-letters .faq details p::before{content:"A. ";font-family:var(--display);font-style:italic}

.cv-close{background:var(--flood);color:var(--on-flood);padding:clamp(4rem,9vw,7rem) 0;border-top:1.5px solid var(--on-flood)}
.cv-close .cv-mast{font-size:clamp(3rem,calc(var(--mh) * .8cqi),8rem);animation:none}
.cv-close .wrap{container-type:inline-size}
.cv-close .cv-ctas{margin-top:2rem}

.b-ft{background:var(--black);color:var(--on-black);padding:3.5rem 0 2.5rem}
.b-ft__name{font-family:var(--display);font-weight:800;font-size:clamp(2rem,5vw,3rem);letter-spacing:-.03em;line-height:1}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;font-family:var(--mono);text-transform:uppercase;font-size:.875rem;letter-spacing:.04em;color:var(--black-muted)}
.b-ft__row a{color:var(--on-black)}
.legal{margin-top:2rem;font-size:.85rem;color:var(--black-muted)}
.stock-credits{margin-top:.5rem;color:var(--black-muted)}
.b-float{background:var(--black);color:var(--on-black);border:1.5px solid var(--on-black)}
.callbar--split .cb-book{background:var(--flood);color:var(--on-flood)}
`;

// The masthead: every word roman, the last one italic when there are two or more.
function masthead(ctx, tag = "h1", cls = "cv-mast") {
  const words = ctx.nameRaw.trim().split(/\s+/).filter(Boolean);
  const inner = words.length > 1 ? `${words.slice(0, -1).map(esc).join(" ")} <em>${esc(words[words.length - 1])}</em>` : esc(ctx.nameRaw);
  return `<${tag} class="${cls}" style="--mh:${mastSize(ctx)}">${inner}</${tag}>`;
}

// Size so the name spans the cover: about 1.75 times the width per character.
function mastSize(ctx) {
  return Math.max(4, Math.min(20, 175 / Math.max(ctx.nameRaw.length, 1))).toFixed(2);
}

function folio(n) {
  return `<span class="cv-folio" aria-hidden="true">p. ${n}</span>`;
}

function insideLine(ctx) {
  if (!ctx.servicesFromDefaults && ctx.services.length >= 3) {
    const [a, b, c] = ctx.services.map(esc);
    return ctx.t(`Inside: ${a}, ${b} and ${c}`, `Adentro: ${a}, ${b} y ${c}`);
  }
  const who = roleFor(ctx).many;
  return ctx.t(`Inside: the menu, the ${who[0].toLowerCase()} and how to book`, `Adentro: el menú, los ${who[1].toLowerCase()} y cómo reservar`);
}

function render(ctx) {
  const t = ctx.t;
  const variant = ctx.variants.hero === "banner" ? "banner" : "cover";
  const month = ctx.monthYear;
  const issue = ISSUE[ctx.categoryKey] || ["The local issue", "Edición local"];
  const photo = heroPhoto(ctx, { sizes: variant === "banner" ? "100vw" : "(min-width: 880px) 45vw, 100vw" });
  // The banner puts the rating on the photo so it is on the first screen.
  const flag = variant === "banner" ? ratingProof(ctx, "chip", { cls: "cv-flag" }) : "";
  const frame = `<div class="cv-frame">${photo || HALFTONE_ART}${flag}${photo ? `<span class="cv-caption">${t("Stock photo", "Foto de archivo")}</span>` : ""}</div>`;
  const header = siteHeader(ctx, { cta: ["Book", "Reservar"] });
  const bookSolid = (label) => bookButton(ctx, { cls: "cv-btn cv-btn--solid", ico: "", arrow: false, label });
  const callLine = callButton(ctx, { cls: "cv-btn cv-btn--line", label: false });

  const lines = `<div class="cv-copy"><p class="cv-promise">${ctx.copyOr("headline", ctx.promise)}</p><ul class="cv-lines">
${variant === "banner" ? "" : `<li>${ratingProof(ctx, "chip")}</li>`}
<li>${icon("arrow")}<span class="cv-line__big">${insideLine(ctx)}</span></li>
<li>${icon("arrow")}<span class="cv-line__big"><a href="#chairs">${t("Meet the", "Conozca al")} <em>${t("cast", "elenco")}</em></a></span></li>
${ctx.about ? `<li><span>${ctx.about}</span></li>` : ""}
</ul><div class="cv-ctas">${bookSolid(ctx.copy.ctaPrimary ? null : ["Book now", "Reservar"])}${callLine}</div></div>`;

  const hero = `<section class="cv-cover cv-cover--${variant}" id="top"><div class="wrap cv-cover__in" style="--mh:${mastSize(ctx)}">
<p class="cv-issue"><span>${esc(ctx.cityState)}</span><span>${t(month[0], month[1])}</span><span>${t(issue[0], issue[1])}</span></p>
${masthead(ctx)}
<div class="cv-body">${variant === "banner" ? `${frame}${lines}` : `${lines}${frame}`}</div>
</div></section>`;

  const numbers = `<section class="cv-sec cv-sec--black cv-numbers" aria-label="Google rating">${folio("04")}<div class="wrap"><h2 class="cv-h2">${t("The", "Los")} <em>${t("numbers", "números")}</em></h2>${ratingProof(ctx, "numbers")}${themesBlock(ctx)}</div></section>`;

  const index = ctx.variants.services === "index" ? "index" : "contents";
  const contents = ctx.services.length
    ? `<section class="cv-sec cv-sec--paper cv-contents cv-contents--${index}" id="menu">${folio("12")}<div class="wrap"><div class="cv-head"><h2 class="cv-h2">${t("In this", "En esta")} <em>${t("issue", "edición")}</em></h2><p class="cv-dek">${t("The menu, service by service. Pick one and choose a time at the back of the issue.", "El menú, servicio por servicio. Elija uno y un horario al final de la edición.")}</p></div>${servicesList(ctx, "menu", { tail: ["Book", "Reservar"], link: true, numbered: true })}${servicesConfirm(ctx)}</div></section>`
    : "";

  const ticker = ctx.services.length ? marquee(ctx, ctx.services.map(esc), { cls: "cv-marquee" }) : "";

  const role = roleFor(ctx);
  const cast = `<section class="cv-sec cv-sec--alt" id="chairs">${folio("18")}<div class="wrap"><div class="cv-head"><h2 class="cv-h2">${t("The", "El")} <em>${t("cast", "elenco")}</em></h2><p class="cv-dek">${t(`Pick a chair. Book with your ${role.one[0].toLowerCase()}, or take ${role.any[0].toLowerCase()}.`, `Elija una silla. Reserve con su ${role.one[1].toLowerCase()} o con ${role.any[1].toLowerCase()}.`)}</p></div>${teamPlaceholders(ctx)}</div></section>`;

  const sheet = `<section class="cv-sec cv-sec--black cv-sheet" id="gallery">${folio("24")}<div class="wrap"><h2 class="cv-h2">${t("Contact", "Hoja de")} <em>${t("sheet", "contactos")}</em></h2>${gallery(ctx, { count: 6, tag: false, sizes: "(min-width: 820px) 30vw, 50vw", width: 800 })}<p class="cv-sheet-note">${t("Stock photos stand in for the shop's own work.", "Fotos de archivo en lugar del trabajo del negocio.")}</p></div></section>`;

  const steps = stepsFor(ctx);
  const how = `<section class="cv-sec cv-sec--paper">${folio("28")}<div class="wrap"><h2 class="cv-h2">${t("How to", "Cómo")} <em>${t("book", "reservar")}</em></h2><ol class="cv-steps">${steps.map((s, i) => `<li class="rv"><span class="step-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  const form = formHeading(ctx);
  const request = `<section class="cv-sec cv-sec--alt" id="${REQUEST_ID}">${folio("30")}<div class="wrap cv-book"><div class="cv-book__side"><h2 class="cv-h2">${form.title}</h2><p class="cv-dek">${form.intro}</p>${ratingProof(ctx, "chip")}<div>${callButton(ctx, { cls: "cv-btn cv-btn--line", label: ["Or call", "O llame al"] })}</div></div><div class="cv-card"><p class="cv-card__label" aria-hidden="true"><span>${esc(ctx.nameRaw)}</span><span>${t("Reservation card", "Tarjeta de reserva")}</span></p>${ctx.form}</div></div></section>`;

  const visit = `<section class="cv-sec cv-sec--paper" id="visit"><div class="wrap cv-visit"><div><h2 class="cv-h2">${t("Where to", "Dónde")} <em>${t("find us", "encontrarnos")}</em></h2><p class="cv-dek">${esc(ctx.placeRaw)}</p></div>${visitDetails(ctx)}</div></section>`;

  const letters = `<section class="cv-sec cv-sec--alt cv-letters" id="faq"><div class="wrap cv-visit"><h2 class="cv-h2"><em>${t("Letters", "Cartas")}</em></h2>${faqBlock(ctx)}</div></section>`;

  const close = `<section class="cv-close"><div class="wrap">${masthead(ctx, "p")}<div class="cv-ctas">${bookSolid(["Book your chair", "Reserve su silla"])}${callButton(ctx, { cls: "cv-btn cv-btn--line", label: false })}</div></div></section>`;

  return {
    css: CSS,
    body: `${header}<main>${hero}${numbers}${contents}${ticker}${cast}${sheet}${how}${request}${visit}${letters}${close}</main>${siteFooter(ctx)}${floatingBook(ctx)}`,
  };
}

export const direction = {
  key: "barber-cover-story",
  label: "Cover story: editorial street magazine",
  status: "implemented",
  suits: ["barber", "hair-salon", "tattoo"],
  keywords: ["editorial", "bold", "fashion", "magazine", "gallery", "review wall", "street"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Noto+Serif+Display:ital,wght@0,700;0,800;1,500;1,600&family=Courier+Prime:wght@400;700&family=Schibsted+Grotesk:wght@400;500;600&display=swap",
  palettes: PALETTES,
  variants: { hero: ["cover", "banner"], services: ["contents", "index"], proof: ["numbers"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /fade|lineup|razor|beard|foil|tattoo/ },
  callbar: "split",
  render,
};
