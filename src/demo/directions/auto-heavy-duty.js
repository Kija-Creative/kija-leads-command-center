// Heavy duty and fleet (research/design-auto.md, direction 4): night shift at a
// truck stop. Operational, loud, no nonsense, for a driver on the shoulder or
// a fleet manager between loads. Hazard chevrons, huge condensed capitals, and
// a status board with the phone in big mono digits, hours from the record and
// the Google rating. Photos are duotoned black and hi vis; towing gets none,
// because the library has no tow trucks and an engine bench would misstate
// the trade. Road service leads with the call: the call panel beside the form
// is bigger than the form.

import {
  bookButton,
  callButton,
  faqBlock,
  formHeading,
  gallery,
  promiseLine,
  ratingProof,
  REQUEST_ID,
  serviceItems,
  servicesConfirm,
  shortCta,
  siteFooter,
  siteHeader,
  themesBlock,
  visitDetails,
} from "../blocks.js";
import { stepsFor } from "../copy.js";
import { esc, icon } from "../shared.js";

const PALETTES = [
  { key: "duty-night", name: "Night shift", vars: { bg: "#0d0f12", surface: "#1a1e24", ink: "#f5f5f2", muted: "#a3a9b1", line: "#2b3038", primary: "#ffb400", "on-primary": "#0d0f12", accent: "#ffb400", hot: "#ffb400", night: "#0d0f12", "on-night": "#f5f5f2", "night-muted": "#a3a9b1", "night-line": "#2b3038", board: "#07080a", glow: "rgb(255 180 0 / .22)" } },
  { key: "duty-hivis", name: "Hi vis", vars: { bg: "#121212", surface: "#1d1f22", ink: "#f4f4f4", muted: "#a6a9ad", line: "#3a3d42", primary: "#d4ff3a", "on-primary": "#111111", accent: "#d4ff3a", hot: "#d4ff3a", night: "#121212", "on-night": "#f4f4f4", "night-muted": "#a6a9ad", "night-line": "#3a3d42", board: "#0a0a0a", glow: "rgb(212 255 58 / .16)" } },
  { key: "duty-fleet", name: "Fleet blue", vars: { bg: "#f2f4f7", surface: "#ffffff", ink: "#0b1f3a", muted: "#4d5a6b", line: "#d5dbe3", primary: "#ff6a13", "on-primary": "#0b1f3a", accent: "#ff6a13", hot: "#b93f06", night: "#0b1f3a", "on-night": "#f2f4f7", "night-muted": "#a9b7c9", "night-line": "#1e3558", board: "#071528", glow: "rgb(255 106 19 / .24)" } },
];

// Road perspective for the no photo hero: shoulders, lane dashes, a glow at the horizon.
const ROAD = `<svg class="hd-road" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" fill="none" stroke-linecap="square">
<path d="M560 250L40 600M640 250L1160 600" stroke="currentColor" stroke-width="3" opacity=".55"/>
<path d="M580 250L300 600M620 250L900 600" stroke="currentColor" stroke-width="1.5" opacity=".25"/>
<path class="hd-road__dash" d="M600 250V600" stroke="var(--primary)" stroke-width="8" stroke-dasharray="26 34"/>
<path d="M0 250H1200" stroke="currentColor" stroke-width="1" opacity=".35"/>
</svg>`;

// 2px square cap icons by service keyword. No wrenches or gears.
const ICONS = [
  [/diesel|engine|motor|overhaul/i, "<path d=\"M5 8h10l3 3h2v6h-2l-3 3H7l-2-2H3v-6h2z\"/><path d=\"M8 5h6M11 5v3\"/>"],
  [/brake|air system|air brake/i, "<circle cx=\"12\" cy=\"12\" r=\"8\"/><circle cx=\"12\" cy=\"12\" r=\"2.5\"/><path d=\"M17 5l2-2M19 9h2\"/>"],
  [/tire|tyre|flat|wheel/i, "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4\"/>"],
  [/electric|battery|starter|alternator|jump|wiring/i, "<path d=\"M13 3L6 13h5l-1 8 7-10h-5z\"/>"],
  [/diagnos|inspect|scan|check/i, "<path d=\"M4 4h16v12H4z\"/><path d=\"M7 12l3-3 2 2 4-4\"/><path d=\"M9 20h6\"/>"],
  [/maint|oil|preventive|fluid|service interval/i, "<path d=\"M12 3c3 5 5 7.5 5 10.5a5 5 0 0 1-10 0C7 10.5 9 8 12 3z\"/>"],
  [/tow|winch|recover/i, "<path d=\"M3 17h11V9h4l3 4v4h-2\"/><path d=\"M14 13h7M3 17V7l6 6\"/><circle cx=\"7\" cy=\"18\" r=\"1.5\"/><circle cx=\"17\" cy=\"18\" r=\"1.5\"/>"],
  [/road|roadside|mobile|location|on site|your location/i, "<path d=\"M9 3L5 21M15 3l4 18\"/><path d=\"M12 5v2M12 11v2M12 17v2\"/>"],
  [/lock|key/i, "<rect x=\"5\" y=\"11\" width=\"14\" height=\"9\"/><path d=\"M8 11V7a4 4 0 0 1 8 0v4\"/>"],
  [/weld|fabricat|trailer|hitch/i, "<path d=\"M3 16h14v-6H3z\"/><path d=\"M17 13h4M6 16v3M14 16v3\"/>"],
];
const DEFAULT_ICON = "<path d=\"M4 4h16v16H4z\"/><path d=\"M8 12h8M12 8v8\"/>";

function svcIcon(name) {
  const hit = ICONS.find(([re]) => re.test(name));
  return `<svg class="hd-ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">${hit ? hit[1] : DEFAULT_ICON}</svg>`;
}

const CSS = `
:root{--display:"Saira Condensed","Arial Narrow",sans-serif;--body:"Saira",system-ui,sans-serif;--mono:"Share Tech Mono",ui-monospace,monospace;--radius:2px;--btn-radius:2px;--max:1240px;--ease:cubic-bezier(.22,1,.36,1);--field:var(--surface);--field-line:color-mix(in oklab,var(--ink) 30%,transparent);--callbar-h:4rem;--callbar-radius:4px;--lang-fg:var(--primary);--lang-on:var(--night)}
body{font-size:1.0625rem;line-height:1.6}

.hd-mono{font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase;font-variant-numeric:tabular-nums}
.hd-hazard{position:relative;z-index:1;height:12px;background:repeating-linear-gradient(-45deg,var(--primary) 0 14px,var(--night) 14px 28px)}
.hd-h2{font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:clamp(2.4rem,6vw,4.5rem);line-height:.92;letter-spacing:.005em}
.hd-dek{max-width:54ch;color:var(--muted)}
.hd-dark{background:var(--night);color:var(--on-night)}
.hd-dark .hd-dek{color:var(--night-muted)}

.b-hd{position:sticky;top:0;z-index:10;background:var(--night);color:var(--on-night);border-bottom:1px solid var(--night-line)}
.b-hd__in{display:flex;align-items:center;gap:1.5rem;min-height:4.25rem}
.b-brand{margin-right:auto;font-family:var(--display);font-weight:800;font-size:1.45rem;text-transform:uppercase;letter-spacing:.02em;line-height:1;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60vw}
.b-nav{display:none;gap:1.75rem;font-family:var(--display);font-weight:700;font-size:1.05rem;text-transform:uppercase;letter-spacing:.04em}
.b-nav a{text-decoration:none;color:var(--night-muted)}
.b-nav a:hover{color:var(--on-night)}
@media (min-width:1080px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:1rem}
.b-hd__tel{display:none;align-items:center;gap:.5rem;padding:.35rem .75rem;border:1px solid var(--night-line);background:var(--board);color:var(--primary);font-family:var(--mono);font-size:1.15rem;letter-spacing:.04em;text-decoration:none;font-variant-numeric:tabular-nums}
@media (min-width:760px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.75rem;padding:.5rem 1.1rem;background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:800;font-size:1.1rem;text-transform:uppercase;letter-spacing:.04em;text-decoration:none}

.hd-btn{display:inline-flex;align-items:center;justify-content:center;gap:.65rem;min-height:3.5rem;padding:.8rem 1.5rem;border:2px solid transparent;font-family:var(--display);font-weight:800;font-size:1.25rem;text-transform:uppercase;letter-spacing:.03em;text-decoration:none;transition:transform .25s var(--ease),background-color .2s,color .2s}
.hd-btn:hover{transform:translateY(-2px)}
.hd-btn--call{background:var(--primary);color:var(--on-primary);font-size:clamp(1.3rem,2.4vw,1.6rem);min-height:4rem;padding-inline:1.75rem}
.hd-btn--call span{font-variant-numeric:tabular-nums}
.hd-btn--line{border-color:currentColor}
.hd-btn--line:hover{background:var(--on-night);color:var(--night)}

.hd-hero{position:relative;overflow:hidden;background:var(--night);color:var(--on-night)}
.hd-hero__bg{position:absolute;inset:0;overflow:hidden}
.hd-hero__bg .b-photo{position:absolute;inset:0;--photo-bg:var(--night)}
.hd-hero__bg img{filter:grayscale(1) contrast(1.3) brightness(.95)}
.hd-hero__bg .b-photo::after{content:"";position:absolute;inset:0;background:var(--primary);mix-blend-mode:multiply;opacity:.9}
.hd-hero__bg::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,var(--night) 0,color-mix(in oklab,var(--night) 88%,transparent) 36%,color-mix(in oklab,var(--night) 18%,transparent) 100%),linear-gradient(0deg,var(--night),transparent 40%)}
@media (max-width:979.98px){.hd-hero__bg::after{background:linear-gradient(0deg,var(--night) 30%,color-mix(in oklab,var(--night) 70%,transparent))}}
.hd-hero__bg--road{color:var(--night-muted);background:radial-gradient(ellipse 60% 40% at 50% 42%,var(--glow),transparent 70%)}
.hd-hero__bg--road::after{display:none}
.hd-road{position:absolute;left:0;right:0;bottom:0;width:100%;height:58%;-webkit-mask-image:linear-gradient(transparent,#000 45%);mask-image:linear-gradient(transparent,#000 45%);opacity:.8}
.hd-road__dash{animation:hd-road 1.4s linear infinite}
@keyframes hd-road{to{stroke-dashoffset:-60}}
.hd-hero__grid{position:relative;display:grid;gap:clamp(2rem,5vw,3.5rem);padding:clamp(2.5rem,6vw,5rem) 0 clamp(3rem,7vw,5.5rem)}
@media (min-width:980px){.hd-hero--board .hd-hero__grid{grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);align-items:end}}
.hd-eyebrow{display:inline-flex;align-items:center;gap:.6rem;color:var(--primary);font-size:.9rem}
.hd-eyebrow::before{content:"";width:.6rem;height:.6rem;background:var(--primary)}
.hd-name{margin-top:1rem;font-family:var(--display);font-weight:800;text-transform:uppercase;line-height:.86;letter-spacing:.005em;font-size:var(--nsize);overflow-wrap:break-word}
.name--xl{--nsize:clamp(3.4rem,12vw,6rem)}
.name--l{--nsize:clamp(3rem,10vw,6rem)}
.name--m{--nsize:clamp(2.6rem,8vw,5.4rem)}
.name--s{--nsize:clamp(2.2rem,6.2vw,4.4rem)}
.hd-promise{margin-top:1.25rem;max-width:30ch;font-family:var(--display);font-weight:700;font-size:clamp(1.4rem,2.6vw,2rem);line-height:1.1;text-transform:uppercase;letter-spacing:.01em;color:var(--on-night)}
.hd-about{margin-top:1rem;max-width:52ch;color:var(--night-muted)}
.hd-ctas{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}

.hd-board{background:var(--board);border:1px solid var(--night-line);box-shadow:0 0 0 1px rgb(0 0 0 / .4),0 30px 60px -30px rgb(0 0 0 / .8);color:var(--on-night);font-family:var(--mono)}
.hd-board__top{display:flex;justify-content:space-between;gap:1rem;padding:.7rem 1rem;border-bottom:1px solid var(--night-line);font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;color:var(--night-muted)}
.hd-board__top b{display:inline-flex;align-items:center;gap:.45rem;font-weight:400;color:var(--primary)}
.hd-board__top b::before{content:"";width:.5rem;height:.5rem;border-radius:50%;background:var(--primary);box-shadow:0 0 10px var(--primary);animation:hd-blink 2.4s steps(2,jump-none) infinite}
@keyframes hd-blink{50%{opacity:.25}}
.hd-board dl{margin:0}
.hd-board__row{display:grid;grid-template-columns:5.5rem 1fr;gap:1rem;align-items:baseline;padding:.85rem 1rem;border-bottom:1px dashed var(--night-line)}
.hd-board__row:last-child{border-bottom:0}
.hd-board dt{font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:var(--night-muted)}
.hd-board dd{margin:0;font-size:1.05rem;text-transform:uppercase;letter-spacing:.04em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.hd-board dd.hd-soft{color:var(--night-muted)}
.hd-board__tel{display:block;color:var(--primary);font-size:clamp(1.9rem,4.2vw,2.6rem);line-height:1.05;letter-spacing:.02em;text-decoration:none;text-shadow:0 0 18px var(--glow)}
.hd-board .b-rating{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem .75rem}
.hd-board .b-rating__num{font-size:1.5rem;color:var(--primary)}
.hd-board .stars{width:5.25rem;height:1.05rem;color:var(--primary)}
.hd-board .b-rating__count{font-size:.9rem;color:var(--on-night)}
.hd-hero--road .hd-board{display:grid;margin-top:.5rem}
.hd-hero--road .hd-board dl{display:grid}
@media (min-width:900px){.hd-hero--road .hd-board dl{grid-template-columns:1.35fr 1fr 1fr 1.2fr}.hd-hero--road .hd-board__row{grid-template-columns:1fr;gap:.35rem;border-bottom:0;border-right:1px dashed var(--night-line);padding:1rem 1.25rem}.hd-hero--road .hd-board__row:last-child{border-right:0}}

.hd-sec{padding:clamp(4rem,9vw,7rem) 0}
.hd-sec--panel{background:var(--surface)}
.hd-head{display:grid;gap:1rem;max-width:48rem}
.hd-kicker{color:var(--hot);font-size:.9rem}

.hd-svc{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;margin-top:3rem;background:var(--line);border:1px solid var(--line)}
@media (min-width:720px){.hd-svc{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (min-width:1080px){.hd-svc{grid-template-columns:repeat(4,minmax(0,1fr))}}
.hd-svc li{display:grid;gap:.9rem;align-content:start;min-height:9.5rem;padding:1.25rem 1.1rem;background:var(--bg);transition:background-color .2s}
.hd-svc li:hover{background:var(--surface)}
.hd-svc__top{display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem}
.hd-svc__code{font-family:var(--mono);font-size:.8rem;color:var(--muted)}
.hd-ico{width:2rem;height:2rem;color:var(--hot)}
.hd-svc__name{font-family:var(--display);font-weight:700;font-size:1.35rem;line-height:1.05;text-transform:uppercase;letter-spacing:.01em}
.hd-svc--ledger{grid-template-columns:1fr;background:transparent;border:0;border-top:2px solid var(--ink);gap:0}
@media (min-width:860px){.hd-svc--ledger{grid-template-columns:1fr 1fr;column-gap:3rem}}
.hd-svc--ledger li{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:1rem;min-height:0;padding:1rem 0;border-bottom:1px solid var(--line);background:transparent}
.hd-svc--ledger li:hover{background:transparent}
.hd-svc--ledger .hd-svc__top{display:contents}
.hd-svc--ledger .hd-ico{width:1.6rem;height:1.6rem;order:-1}
.hd-svc--ledger .hd-svc__code{order:3}
.b-svc-confirm{margin-top:1.5rem;font-family:var(--mono);font-size:.85rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
.svc-note{margin-top:.35rem;color:var(--muted);font-size:.9rem}

.hd-split{display:grid;gap:1px;background:var(--night-line)}
@media (min-width:900px){.hd-split{grid-template-columns:1fr 1fr}}
.hd-split__cell{display:grid;gap:1rem;align-content:start;padding:clamp(2.5rem,6vw,4.5rem) clamp(1rem,4vw,3.5rem);background:var(--night)}
.hd-split__cell:nth-child(2){background:var(--board)}
.hd-split .hd-h2{font-size:clamp(2rem,4.6vw,3.4rem)}
.hd-split p{max-width:44ch;color:var(--night-muted)}
.hd-split .hd-btn{justify-self:start;margin-top:.75rem}
.hd-split .hd-kicker{color:var(--primary)}

.hd-steps{display:grid;gap:0;margin-top:3rem;border-top:2px solid var(--ink)}
@media (min-width:860px){.hd-steps{grid-template-columns:repeat(var(--n),minmax(0,1fr))}}
.hd-steps li{display:grid;align-content:start;grid-template-columns:auto 1fr;gap:1.25rem;padding:1.75rem 0;border-bottom:1px solid var(--line)}
@media (min-width:860px){.hd-steps li{grid-template-columns:1fr;padding:2rem 2rem 2rem 0;border-bottom:0;border-right:1px solid var(--line)}.hd-steps li+li{padding-left:2rem}.hd-steps li:last-child{border-right:0}}
.hd-steps .hd-step__n{font-family:var(--display);font-weight:800;font-size:clamp(3.5rem,7vw,5.5rem);line-height:.8;color:var(--hot)}
.hd-steps h3{font-family:var(--display);font-weight:800;font-size:1.7rem;text-transform:uppercase;line-height:1}
.hd-steps p{margin-top:.5rem;color:var(--muted);max-width:32ch}

.hd-themes .b-themes{display:grid;gap:1px;margin-top:2.5rem;background:var(--line);border:1px solid var(--line)}
@media (min-width:760px){.hd-themes .b-themes{grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))}}
.hd-themes .b-themes li{padding:1.5rem 1.25rem;background:var(--surface);font-family:var(--display);font-weight:700;font-size:1.5rem;line-height:1.1;text-transform:uppercase}
.hd-themes .b-themes li::before{content:"";display:block;width:1.5rem;height:4px;margin-bottom:.9rem;background:var(--hot)}
.b-themes__note{margin-top:1rem;font-family:var(--mono);font-size:.82rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}

.hd-yard .b-gallery{display:grid;gap:1px;margin-top:2.5rem;grid-template-columns:1fr;background:var(--night-line)}
@media (min-width:760px){.hd-yard .b-gallery{grid-template-columns:1.4fr 1fr}}
.hd-yard .b-gallery__tile{position:relative;aspect-ratio:16/10;--photo-bg:var(--night)}
.hd-yard .b-gallery__tile img{filter:grayscale(1) contrast(1.25) brightness(.7)}
.hd-yard .b-gallery__tile::after{content:"";position:absolute;inset:0;background:var(--primary);mix-blend-mode:multiply;opacity:.85;pointer-events:none}
.hd-yard .b-gallery__empty{display:grid;place-items:center;background:var(--board);color:var(--night-muted);font-family:var(--mono);text-transform:uppercase}
.hd-yard .stock-tag{z-index:2}

.hd-req{display:grid;gap:2rem}
@media (min-width:980px){.hd-req{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:3rem;align-items:start}.hd-callpanel{position:sticky;top:6rem}}
.hd-callpanel{display:grid;gap:1.25rem;align-content:start;padding:clamp(1.75rem,4vw,3rem);background:var(--primary);color:var(--on-primary)}
.hd-callpanel .hd-h2{font-size:clamp(2.6rem,6.5vw,5rem)}
.hd-callpanel p{max-width:40ch;font-weight:600}
.hd-callpanel__tel{display:block;padding:1rem 0;border-block:3px solid currentColor;font-family:var(--mono);font-size:clamp(2.4rem,7.5vw,4.4rem);line-height:1;letter-spacing:.02em;text-decoration:none;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.hd-callpanel__tel:hover{background:var(--on-primary);color:var(--primary)}
.hd-callpanel .hd-mono{font-size:.85rem}
.hd-form{padding:clamp(1.25rem,3vw,2rem);background:var(--surface);border:1px solid var(--line)}
.hd-form__top{margin-bottom:1.25rem;font-family:var(--display);font-weight:800;font-size:1.5rem;text-transform:uppercase;line-height:1}
.hd-form__top+p{margin:-.75rem 0 1.25rem;color:var(--muted);font-size:.95rem}
.hd-helper{display:grid;gap:.4rem;margin-bottom:1.5rem;padding:1rem;border:1px dashed var(--field-line);font-size:.95rem}
.hd-helper b{font-family:var(--display);font-size:1.15rem;text-transform:uppercase;letter-spacing:.02em}
.hd-helper ul{display:grid;gap:.2rem;color:var(--muted)}
.hd-helper li::before{content:"> ";font-family:var(--mono);color:var(--hot)}
.hd-helper label{justify-self:start;margin-top:.35rem;font-weight:600;text-decoration:underline;text-underline-offset:.2em;cursor:pointer}
.f-label,.f-field legend{font-family:var(--display);font-weight:700;font-size:1.05rem;text-transform:uppercase;letter-spacing:.03em}
.f-input{border-radius:2px;background:var(--bg);font-family:var(--mono);font-size:1.05rem;letter-spacing:.02em}
.f-chip>span{border-radius:2px;font-weight:600}
.f-chip input:checked+span{background:var(--primary);color:var(--on-primary);border-color:var(--primary)}
.f-submit{border-radius:2px;min-height:3.5rem;font-family:var(--display);font-weight:800;font-size:1.2rem;text-transform:uppercase;letter-spacing:.03em;background:var(--ink);color:var(--bg)}
.f-status{border-width:2px}

.hd-visit{display:grid;gap:3rem}
@media (min-width:900px){.hd-visit{grid-template-columns:1fr 1fr;gap:5rem}}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:2px solid var(--ink)}
.facts dt{font-family:var(--mono);font-size:.85rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding-top:.15rem}
.facts dd{margin:0;font-weight:600}
.b-visit__pending{display:grid;gap:.4rem;margin-top:1.25rem;color:var(--muted)}
.b-visit__pending li::before,.hd-area li::before{content:"// ";font-family:var(--mono);color:var(--hot)}
.hd-area{display:grid;gap:.4rem;margin-top:.4rem;color:var(--muted)}
.dir{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.5rem;font-weight:700}
.faq details{border-color:var(--line)}
.faq summary{font-family:var(--display);font-weight:700;font-size:1.35rem;text-transform:uppercase;letter-spacing:.01em}
.faq summary .ico{color:var(--hot)}

.b-ft{background:var(--night);color:var(--on-night);padding:3.5rem 0 2.5rem}
.b-ft__name{font-family:var(--display);font-weight:800;font-size:clamp(2rem,5vw,3.2rem);text-transform:uppercase;line-height:.9}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.5rem 2rem;margin-top:1rem;font-family:var(--mono);text-transform:uppercase;letter-spacing:.04em;color:var(--night-muted)}
.b-ft__row a{color:var(--primary)}
.legal{margin-top:1.75rem;font-size:.85rem;color:var(--night-muted)}
.stock-credits{margin-top:.4rem;color:var(--night-muted)}
.callbar{background:var(--primary);color:var(--on-primary);font-family:var(--display);font-weight:800;font-size:1.3rem;text-transform:uppercase;letter-spacing:.03em}
.callbar .ico{width:1.5rem;height:1.5rem}
@media (max-width:759.98px){.b-brand{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.1}}
`;

// The roadside form: ids on the location field stay as they are; a unit
// number field joins it for trucks.
function roadForm(ctx) {
  if (ctx.categoryKey !== "diesel-truck-repair") return ctx.form;
  const unit = `<div class="f-field"><label class="f-label" for="rq-unit">${ctx.t("Unit or trailer number", "Número de unidad o caja")}</label><input class="f-input" id="rq-unit" name="unit" type="text" autocapitalize="characters"${ctx.i18n.placeholder("Optional, for fleet trucks", "Opcional, para flotillas")}></div>`;
  return ctx.form.replace(/(<input class="f-input" id="rq-where"[^>]*><\/div>)/, `$1${unit}`);
}

function board(ctx) {
  const t = ctx.t;
  const rows = [];
  if (ctx.tel) rows.push(`<div class="hd-board__row"><dt>${t("Call", "Llame")}</dt><dd><a class="hd-board__tel" href="${esc(ctx.tel)}">${esc(ctx.phone)}</a></dd></div>`);
  rows.push(ctx.hours
    ? `<div class="hd-board__row"><dt>${t("Hours", "Horario")}</dt><dd>${esc(ctx.hours)}</dd></div>`
    : `<div class="hd-board__row"><dt>${t("Open", "Abierto")}</dt><dd class="hd-soft">${t("Call to confirm", "Llame para confirmar")}</dd></div>`);
  rows.push(`<div class="hd-board__row"><dt>${t("Base", "Base")}</dt><dd>${esc(ctx.placeRaw)}</dd></div>`);
  rows.push(`<div class="hd-board__row"><dt>Google</dt><dd>${ratingProof(ctx, "chip")}</dd></div>`);
  return `<aside class="hd-board"${ctx.i18n.aria("Road service board", "Tablero de servicio")}><p class="hd-board__top"><span>${t("Road service board", "Tablero de servicio")}</span><b>${esc(ctx.cityRaw || ctx.stateRaw || "")}</b></p><dl>${rows.join("")}</dl></aside>`;
}

function render(ctx) {
  const t = ctx.t;
  const variant = ctx.variants.hero === "road" ? "road" : "board";
  const ledger = ctx.variants.services === "ledger";
  // The library shows repair bays and trucks, never a tow rig, so towing shows none.
  const usePhotos = ctx.photos.enabled && ctx.categoryKey !== "towing";

  const nav = [
    ctx.services.length ? { href: "#services", label: ["Services", "Servicios"] } : null,
    { href: "#road-call", label: ["Road calls", "Llamadas"] },
    { href: "#fleets", label: ["Fleets", "Flotillas"] },
    { href: "#area", label: ["Area", "Zona"] },
  ].filter(Boolean);
  const header = siteHeader(ctx, { nav, cta: shortCta(ctx) });

  const photo = variant === "board" && usePhotos ? ctx.photos.hero() : null;
  const bg = photo
    ? `<div class="hd-hero__bg"><figure class="b-photo">${ctx.photos.img(photo, { hero: true, sizes: "100vw", width: 1600 })}</figure></div>`
    : `<div class="hd-hero__bg hd-hero__bg--road">${ROAD}</div>`;
  const call = callButton(ctx, { cls: "hd-btn hd-btn--call", label: ["Call", "Llame al"] });
  const copy = `<div>
<p class="hd-mono hd-eyebrow">${ctx.categoryT} / ${esc(ctx.cityState)}</p>
<h1 class="hd-name name--${ctx.nameScale}">${ctx.name}</h1>
<p class="hd-promise">${promiseLine(ctx)}</p>
${ctx.about ? `<p class="hd-about">${ctx.about}</p>` : ""}
<div class="hd-ctas">${call}${bookButton(ctx, { cls: "hd-btn hd-btn--line", ico: "", arrow: true })}</div>
${variant === "road" ? board(ctx) : ""}
</div>`;
  const heroHtml = `<section class="hd-hero hd-hero--${variant}" id="top"><div class="hd-hazard" aria-hidden="true"></div>${bg}<div class="wrap hd-hero__grid">${copy}${variant === "board" ? board(ctx) : ""}</div>${photo ? `<p class="sr-only">${t("Background: stock photo.", "Fondo: foto de archivo.")}</p>` : ""}</section>`;

  const items = serviceItems(ctx).map((s) => `<li class="rv"><div class="hd-svc__top"><span class="hd-svc__code">${t(`SVC ${s.n}`, `SRV ${s.n}`)}</span>${svcIcon(s.name)}</div><span class="hd-svc__name">${s.html}</span></li>`).join("");
  const services = ctx.services.length
    ? `<section class="hd-sec" id="services"><div class="wrap"><div class="hd-head"><h2 class="hd-h2">${t("Services", "Servicios")}</h2></div><ul class="b-svc hd-svc${ledger ? " hd-svc--ledger" : ""}">${items}</ul>${servicesConfirm(ctx)}</div></section>`
    : "";

  const split = `<section class="hd-dark" id="fleets"><div class="hd-hazard" aria-hidden="true"></div><div class="hd-split">
<div class="hd-split__cell"><p class="hd-mono hd-kicker">${t("For drivers", "Para choferes")}</p><h2 class="hd-h2">${t("On the shoulder right now?", "¿Está orillado ahora?")}</h2><p>${t("Call first. Say where you are, what you drive and what happened, then wait somewhere safe with the hazards on.", "Llame primero. Diga dónde está, qué maneja y qué pasó, y espere en un lugar seguro con las intermitentes.")}</p>${callButton(ctx, { cls: "hd-btn hd-btn--call", label: ["Call", "Llame al"] })}</div>
<div class="hd-split__cell"><p class="hd-mono hd-kicker">${t("For fleets", "Para flotillas")}</p><h2 class="hd-h2">${t("Running a fleet?", "¿Maneja una flotilla?")}</h2><p>${t("Ask how the shop works with fleets: unit records, scheduling and billing are worth settling before the next breakdown.", "Pregunte cómo trabaja el taller con flotillas: vale la pena acordar registros, horarios y cobro antes de la próxima falla.")}</p>${bookButton(ctx, { cls: "hd-btn hd-btn--line", ico: "", arrow: true, label: ["Ask about fleets", "Preguntar por flotillas"] })}</div>
</div></section>`;

  const steps = stepsFor(ctx);
  const road = `<section class="hd-sec" id="road-call"><div class="wrap"><div class="hd-head"><h2 class="hd-h2">${t("How a road call works", "Cómo funciona una llamada")}</h2></div><ol class="hd-steps" style="--n:${steps.length}">${steps.map((s, i) => `<li class="rv"><span class="hd-step__n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><div><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></div></li>`).join("")}</ol></div></section>`;

  const themes = ctx.themes.length
    ? `<section class="hd-sec hd-sec--panel hd-themes"><div class="wrap"><div class="hd-head"><h2 class="hd-h2">${t("What drivers mention", "Lo que mencionan los choferes")}</h2></div>${themesBlock(ctx)}</div></section>`
    : "";

  const yard = usePhotos
    ? `<section class="hd-sec hd-dark hd-yard"><div class="wrap"><div class="hd-head"><h2 class="hd-h2">${t("Bays, trucks, crew", "Taller, camiones, equipo")}</h2><p class="hd-dek">${t("Stock photos for now. The shop's own trucks and bays go here.", "Fotos de archivo por ahora. Aquí van los camiones y el taller reales.")}</p></div>${gallery(ctx, { count: 2, tag: true, sizes: "(min-width: 760px) 50vw, 100vw", width: 1200 })}</div></section>`
    : "";

  const fh = formHeading(ctx);
  const helper = ctx.kind === "roadside"
    ? `<div class="hd-helper"><b>${t("Not sure where you are?", "¿No sabe dónde está?")}</b><ul><li>${t("The nearest mile marker or exit number", "El marcador de milla o la salida más cercana")}</li><li>${t("The highway and the direction you were headed", "La carretera y hacia dónde iba")}</li><li>${t("A business or cross street you can see", "Un negocio o una calle que pueda ver")}</li></ul><label for="rq-where">${t("Type it in the form", "Escríbalo en el formulario")}</label></div>`
    : "";
  const callPanel = `<div class="hd-callpanel"><p class="hd-mono">${t("Fastest way", "La forma más rápida")}</p><h2 class="hd-h2">${fh.title}</h2><p>${fh.intro}</p>${ctx.tel ? `<a class="hd-callpanel__tel" href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : ""}<p class="hd-mono">${t("Tap to call. Say where you are first.", "Toque para llamar. Diga primero dónde está.")}</p></div>`;
  const request = `<section class="hd-sec hd-sec--panel" id="${REQUEST_ID}"><div class="wrap hd-req">${callPanel}<div class="hd-form"><p class="hd-form__top">${t("Cannot talk?", "¿No puede hablar?")}</p><p>${t("Send this instead. Keep your phone on.", "Mande esto. Mantenga su teléfono prendido.")}</p>${helper}${roadForm(ctx)}</div></div></section>`;

  const area = `<section class="hd-sec" id="area"><div class="wrap hd-visit"><div class="hd-head"><h2 class="hd-h2">${t("Hours and service area", "Horario y zona de servicio")}</h2><p class="hd-dek">${t(`Based in ${ctx.cityRaw || "the area"}.`, `Con base en ${ctx.cityRaw || "la zona"}.`)}</p><ul class="hd-area"><li>${t("Service area and road call range to confirm with the owner.", "Zona de servicio y alcance por confirmar con el dueño.")}</li></ul></div>${visitDetails(ctx)}</div></section>`;
  const faq = `<section class="hd-sec hd-sec--panel" id="faq"><div class="wrap hd-visit"><h2 class="hd-h2">${t("Questions", "Preguntas")}</h2>${faqBlock(ctx)}</div></section>`;

  return {
    css: CSS,
    body: `${header}<main>${heroHtml}${services}${split}${road}${themes}${yard}${request}${area}${faq}</main><div class="hd-hazard" aria-hidden="true"></div>${siteFooter(ctx)}`,
  };
}

export const direction = {
  key: "auto-heavy-duty",
  label: "Heavy duty and fleet",
  status: "implemented",
  suits: ["diesel-truck-repair", "towing", "mobile-mechanic"],
  keywords: ["24/7", "fleet", "diesel", "roadside", "truck", "semi", "emergency", "service radius"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@700;800&family=Saira:wght@400;600&family=Share+Tech+Mono&display=swap",
  palettes: PALETTES,
  variants: { hero: ["board", "road"], services: ["grid", "ledger"], proof: ["chip"] },
  imagery: { photos: true, people: ["none", "hands", "partial"], heroPrefer: /diesel|semi|under/ },
  callbar: "call",
  render,
};
