// Building blocks that directions compose. Each block owns the facts rules
// (sourced data only, the exact rating and review count, no claims, "to
// confirm" states instead of guesses) and emits plain semantic markup with
// b- prefixed classes. Directions own every visual decision: they add their own
// classes through `cls` and style the markup in their CSS.
//
// Every block takes the render ctx first. Text pairs are [english, spanish];
// ctx.t() turns a pair into bilingual markup when the lead lists Spanish.

import { faqFor, stepsFor } from "./copy.js";
import { directionsLink, factsList, faqList, footerLegal, reviewsText, servicesNote, stepsList, themesNote } from "./parts.js";
import { esc, icon, starsSvg } from "./shared.js";

export { directionsLink, factsList, faqList, footerLegal, reviewsText, servicesNote, stepsList, themesNote };

// render.js swaps this marker for the stock photo credit line (or nothing).
export const CREDITS_SLOT = "<!--kija-stock-credits-->";

// The id every Book and Request link points at; the request form lives there.
export const REQUEST_ID = "request";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function tp(ctx, pair) {
  return ctx.t(pair[0], pair[1]);
}

// Unique ids within one page (star clip paths, labels).
export function uid(ctx, prefix = "u") {
  ctx._uid = (ctx._uid || 0) + 1;
  return `${prefix}${ctx._uid}`;
}

// Who does the work, by trade, for chair placeholders and form labels.
export function roleFor(ctx) {
  switch (ctx.categoryKey) {
    case "barber": return { one: ["Barber", "Barbero"], many: ["Barbers", "Barberos"], any: ["Any barber", "Cualquier barbero"] };
    case "hair-salon": return { one: ["Stylist", "Estilista"], many: ["Stylists", "Estilistas"], any: ["Any stylist", "Cualquier estilista"] };
    case "nail-salon": return { one: ["Nail tech", "Técnica"], many: ["Nail techs", "Técnicas"], any: ["Any technician", "Cualquier técnica"] };
    case "tattoo": return { one: ["Artist", "Artista"], many: ["Artists", "Artistas"], any: ["Any artist", "Cualquier artista"] };
    case "pet-grooming": return { one: ["Groomer", "Groomer"], many: ["Groomers", "Groomers"], any: ["Any groomer", "Cualquier groomer"] };
    default: return { one: ["Team member", "Integrante"], many: ["Team", "Equipo"], any: ["Anyone", "Cualquiera"] };
  }
}

// A two or three word label for header buttons, by how the customer reaches out.
const SHORT_CTA = {
  booking: ["Book", "Reservar"],
  "photo-estimate": ["Get an estimate", "Presupuesto"],
  "repair-estimate": ["Get an estimate", "Presupuesto"],
  estimate: ["Get an estimate", "Presupuesto"],
  "tire-quote": ["Check my size", "Mi medida"],
  roadside: ["Get help", "Pedir ayuda"],
  emergency: ["Request service", "Pedir servicio"],
  request: ["Send a request", "Solicitud"],
};

export function shortCta(ctx) {
  if (ctx.kind === "booking" && ctx.categoryKey === "tattoo") return ["Start a piece", "Empezar"];
  return SHORT_CTA[ctx.kind] || SHORT_CTA.request;
}

// Buttons and click to call.

export function bookButton(ctx, { cls = "btn btn-primary", label, ico = "calendar", arrow = false } = {}) {
  const text = label ? tp(ctx, label) : ctx.copyOr("ctaPrimary", ctx.formCopy.cta);
  return `<a class="${esc(cls)}" href="#${REQUEST_ID}">${ico ? icon(ico) : ""}<span>${text}</span>${arrow ? `<span class="b-arrow" aria-hidden="true">${icon("arrow")}</span>` : ""}</a>`;
}

// A real tel: link. `number` shows the phone; `label` false shows only the number.
export function callButton(ctx, { cls = "btn btn-ghost", label = ["Call", "Llamar"], number = true, ico = "phone" } = {}) {
  if (!ctx.tel) return "";
  const text = label === false ? "" : ctx.copyOr("ctaSecondary", label);
  const num = number ? `${text ? " " : ""}${esc(ctx.phone)}` : "";
  return `<a class="${esc(cls)}" href="${esc(ctx.tel)}">${ico ? icon(ico) : ""}<span>${text}${num}</span></a>`;
}

// Desktop only floating Book pill (phones get the call bar).
export function floatingBook(ctx, { cls = "", label = ["Book now", "Reservar"] } = {}) {
  return `<a class="${cx("b-float", cls)}" href="#${REQUEST_ID}">${icon("calendar")}<span>${tp(ctx, label)}</span></a>`;
}

// Sticky header: wordmark, optional nav, optional phone, one primary action.
// nav: [{ href: "#services", label: ["Services", "Servicios"] }]
export function siteHeader(ctx, { cls = "", nav = [], phone = true, cta = null, ctaCls = "b-hd__cta", brand = "" } = {}) {
  const links = nav.length
    ? `<nav class="b-nav"${ctx.i18n.aria("Sections", "Secciones")}>${nav.map((n) => `<a href="${esc(n.href)}">${tp(ctx, n.label)}</a>`).join("")}</nav>`
    : "";
  const tel = phone && ctx.tel ? `<a class="b-hd__tel" href="${esc(ctx.tel)}">${icon("phone")}<span>${esc(ctx.phone)}</span></a>` : "";
  const book = `<a class="${esc(ctaCls)}" href="#${REQUEST_ID}">${tp(ctx, cta || ["Book", "Reservar"])}</a>`;
  return `<header class="${cx("b-hd", cls)}"><div class="wrap b-hd__in"><a class="b-brand" href="#top">${brand || ctx.name}</a>${links}<div class="b-hd__end">${ctx.langToggle}${tel}${book}</div></div></header>`;
}

// Rating proof. Every variant carries data-rating, data-reviews and the
// data-rating-num numeral, and says "Google reviews", which the guardrail checks.
// Variants: "strip" (numeral, stars, count in a row), "figure" (big numeral
// over stars and count), "numbers" (rating and count as two numerals),
// "chip" (small inline pill), "sticker" (round badge).
export function ratingProof(ctx, variant = "strip", { cls = "", caption = true } = {}) {
  const stars = starsSvg(ctx.rating, uid(ctx, "r"), "stars b-rating__stars");
  const num = `<span class="b-rating__num" data-rating-num>${esc(ctx.ratingText)}</span>`;
  const count = `<span class="b-rating__count">${reviewsText(ctx)}</span>`;
  const attrs = `data-rating="${esc(ctx.rating)}" data-reviews="${esc(ctx.reviews)}"`;
  const base = cx("b-rating", `b-rating--${variant}`, cls);
  if (variant === "numbers") {
    return `<div class="${base}" ${attrs}><div class="b-rating__cell">${num}<span class="b-rating__lbl">${ctx.t("Google rating", "Calificación en Google")}</span>${stars}</div><div class="b-rating__cell"><span class="b-rating__big">${esc(ctx.reviewsText)}</span><span class="b-rating__lbl">${ctx.t("Google reviews", "reseñas de Google")}</span></div></div>`;
  }
  if (variant === "chip") {
    return `<div class="${base}" ${attrs}>${stars}${num}<span class="b-rating__count">${reviewsText(ctx)}</span></div>`;
  }
  if (variant === "sticker") {
    return `<div class="${base}" ${attrs}>${num}${stars}<span class="b-rating__count">${reviewsText(ctx)}</span></div>`;
  }
  const cap = caption ? `<p class="b-rating__cap">${ctx.t(`Real reviews from Google, in ${ctx.cityRaw || "town"}.`, `Reseñas reales de Google, en ${ctx.cityRaw || "la zona"}.`)}</p>` : "";
  return `<div class="${base}" ${attrs}>${num}<div class="b-rating__side">${stars}${count}</div>${variant === "figure" ? cap : ""}</div>`;
}

// Services, numbered, never priced.
export function serviceItems(ctx) {
  return ctx.services.map((name, i) => ({ name, n: String(i + 1).padStart(2, "0"), html: esc(name) }));
}

// One line under every menu: no prices were given to us, and the list is the owner's call.
export function servicesConfirm(ctx, cls = "b-svc-confirm") {
  const line = ctx.vertical === "personal-care"
    ? ["Menu and prices to confirm with the shop.", "Menú y precios por confirmar con el negocio."]
    : ["Services and pricing to confirm with the owner.", "Servicios y precios por confirmar con el dueño."];
  return `<p class="${cls}">${tp(ctx, line)}</p>${servicesNote(ctx)}`;
}

// Variants: "menu" (number, name, dotted leader, a tail link or word),
// "list" (plain rows), "chips" (pills), "grid" (tiles). `tail` is a pair.
export function servicesList(ctx, variant = "list", { cls = "", tail = ["Book", "Reservar"], link = true, numbered = variant === "menu" } = {}) {
  if (!ctx.services.length) return "";
  const items = serviceItems(ctx).map((s) => {
    const n = numbered ? `<span class="b-svc__n" aria-hidden="true">${s.n}</span>` : "";
    const name = `<span class="b-svc__name">${s.html}</span>`;
    if (variant === "menu") {
      const end = tail ? (link ? `<a class="b-svc__tail" href="#${REQUEST_ID}">${tp(ctx, tail)}</a>` : `<span class="b-svc__tail">${tp(ctx, tail)}</span>`) : "";
      return `<li class="b-svc__item rv">${n}${name}<span class="b-svc__dots" aria-hidden="true"></span>${end}</li>`;
    }
    if (variant === "chips") return `<li class="b-svc__item">${link ? `<a href="#${REQUEST_ID}">${s.html}</a>` : name}</li>`;
    return `<li class="b-svc__item rv">${n}${name}</li>`;
  });
  return `<ul class="${cx("b-svc", `b-svc--${variant}`, cls)}">${items.join("")}</ul>`;
}

// Review themes: short paraphrases, never quotes. Empty when the record has none.
export function themesBlock(ctx, { cls = "", variant = "list", note = true } = {}) {
  if (!ctx.themes.length) return "";
  return `<ul class="${cx("b-themes", `b-themes--${variant}`, cls)}">${ctx.themes.map((th) => `<li class="rv">${esc(th)}</li>`).join("")}</ul>${note ? themesNote(ctx, "b-themes__note themes-note") : ""}`;
}

// A decorative looping strip. Hidden from screen readers because the items
// appear elsewhere on the page. Reduced motion stops it.
export function marquee(ctx, items, { cls = "", sep = "<span class=\"b-marquee__sep\"></span>" } = {}) {
  if (!items.length) return "";
  const run = items.map((it) => `<span class="b-marquee__item">${it}</span>${sep}`).join("");
  return `<div class="${cx("b-marquee", cls)}" aria-hidden="true"><div class="b-marquee__track"><div class="b-marquee__run">${run}</div><div class="b-marquee__run">${run}</div></div></div>`;
}

const CHAIR_SVG = "<svg class=\"b-team__glyph\" viewBox=\"0 0 64 64\" aria-hidden=\"true\" focusable=\"false\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 8h24v18H20z\"/><path d=\"M16 30h32l-3 10H19z\"/><path d=\"M14 26v10M50 26v10\"/><path d=\"M32 40v12M22 56h20M26 52h12\"/></svg>";

// Team placeholders. We never have names or photos, so each card is a
// numbered chair that tells the owner what goes there. No stock faces, ever.
export function teamPlaceholders(ctx, { cls = "", count = 4, glyph = true, book = true } = {}) {
  const role = roleFor(ctx);
  const seat = ctx.categoryKey === "tattoo" || ctx.categoryKey === "pet-grooming" ? ["Station", "Estación"] : ["Chair", "Silla"];
  const cards = Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return `<li class="b-team__card rv"><div class="b-team__frame">${glyph ? CHAIR_SVG : ""}<span class="b-team__num" aria-hidden="true">${n}</span></div><p class="b-team__seat">${ctx.t(`${seat[0]} ${n}`, `${seat[1]} ${n}`)}</p><p class="b-team__who">${ctx.t(`${role.one[0]} name and specialty`, `Nombre y especialidad`)}</p>${book ? `<a class="b-team__book" href="#${REQUEST_ID}">${ctx.t(`Book chair ${n}`, `Reservar ${seat[1].toLowerCase()} ${n}`)}</a>` : ""}</li>`;
  });
  return `<ul class="${cx("b-team", cls)}">${cards.join("")}</ul><p class="b-team__note">${ctx.t(`Placeholders. The shop's own ${role.many[0].toLowerCase()}, with names, specialties and photos, go here.`, `Espacios de muestra. Aquí van los ${role.many[1].toLowerCase()} del negocio, con nombre, especialidad y foto.`)}</p>`;
}

// One library photo in a frame. `tag` adds the small "Stock photo" corner label.
export function photoFrame(ctx, photo, { cls = "", hero = false, sizes = "100vw", width = 1600, tag = false, position = "" } = {}) {
  if (!photo) return "";
  const label = tag ? `<span class="stock-tag">${ctx.t("Stock photo. Your work goes here.", "Foto de archivo. Aquí va su trabajo.")}</span>` : "";
  return `<figure class="${cx("b-photo", cls)}">${ctx.photos.img(photo, { hero, sizes, width, position })}${label}</figure>`;
}

// The hero photo chosen for this lead, or "" when the direction or group has none.
export function heroPhoto(ctx, opts = {}) {
  return photoFrame(ctx, ctx.photos.hero(), { ...opts, hero: true });
}

// A gallery of distinct library photos. When the library runs short the
// remaining tiles are empty frames that say what goes there.
export function gallery(ctx, { cls = "", count = 6, sizes = "(min-width: 760px) 33vw, 50vw", width = 800, tag = true, filter = null, tileCls = "" } = {}) {
  const photos = ctx.photos.many(count, filter);
  const tiles = photos.map((p) => photoFrame(ctx, p, { cls: cx("b-gallery__tile", tileCls, "rv"), sizes, width, tag }));
  for (let i = photos.length; i < count; i += 1) {
    tiles.push(`<div class="${cx("b-gallery__tile", "b-gallery__empty", tileCls)}"><span>${ctx.t("Your work goes here", "Aquí va su trabajo")}</span></div>`);
  }
  return `<div class="${cx("b-gallery", cls)}">${tiles.join("")}</div>`;
}

// Visit facts: only what the record carries, then clear "to confirm" lines for
// the rest. Personal care adds the walk in policy line, never a policy.
export function visitDetails(ctx, { cls = "", walkIn = ctx.vertical === "personal-care", map = true } = {}) {
  const pending = [];
  if (!ctx.hours) pending.push(["Hours to confirm with the owner. Call before you come in.", "Horario por confirmar con el dueño. Llame antes de venir."]);
  if (!ctx.address) pending.push(["Street address to confirm with the owner.", "Dirección por confirmar con el dueño."]);
  if (walkIn) pending.push(["Walk in policy to confirm with the shop.", "Política de atención sin cita por confirmar."]);
  const lines = pending.map((p) => `<li>${tp(ctx, p)}</li>`).join("");
  return `<div class="${cx("b-visit", cls)}">${factsList(ctx, "facts b-visit__facts")}${lines ? `<ul class="b-visit__pending">${lines}</ul>` : ""}${map ? directionsLink(ctx, "dir b-visit__map") : ""}</div>`;
}

export function faqBlock(ctx, { cls = "", items = null } = {}) {
  const list = faqList(ctx, items || faqFor(ctx));
  return cls ? list.replace("<div class=\"faq\">", `<div class="faq ${esc(cls)}">`) : list;
}

export function stepsBlock(ctx, { cls = "steps", steps = null } = {}) {
  return stepsList(ctx, steps || stepsFor(ctx), cls);
}

// Title and intro for the request form, as bilingual markup.
export function formHeading(ctx) {
  return { title: tp(ctx, ctx.formCopy.title), intro: tp(ctx, ctx.formCopy.intro), cta: tp(ctx, ctx.formCopy.cta) };
}

// The promise line: owner approved headline copy first, then chrome copy.
export function promiseLine(ctx, fallback) {
  return ctx.copyOr("headline", fallback || ctx.promise);
}

export function siteFooter(ctx, { cls = "", name = true, extra = "" } = {}) {
  const place = `<span>${ctx.categoryT}, ${esc(ctx.placeRaw)}</span>`;
  const tel = ctx.tel ? `<a href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : "";
  return `<footer class="${cx("b-ft", cls)}"><div class="wrap">${name ? `<p class="b-ft__name">${ctx.name}</p>` : ""}<div class="b-ft__row">${place}${tel}</div>${extra}${footerLegal(ctx)}${CREDITS_SLOT}</div></footer>`;
}
