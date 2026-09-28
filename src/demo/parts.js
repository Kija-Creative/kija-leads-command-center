// Markup fragments reused across templates. Templates own the styling; these
// own the facts rules: sourced data only, empty sections simply do not render.

import { esc, icon } from "./shared.js";

export function faqList(ctx, items) {
  return `<div class="faq">${items
    .map((it) => `<details><summary>${ctx.t(it.q[0], it.q[1])}${icon("plus")}</summary><p>${ctx.t(it.a[0], it.a[1])}</p></details>`)
    .join("")}</div>`;
}

// Visit facts as a definition list. Address and hours appear only when recorded.
export function factsList(ctx, cls = "facts") {
  const rows = [];
  rows.push([ctx.t("Based in", "Ubicación"), esc(ctx.placeRaw)]);
  if (ctx.address) rows.push([ctx.t("Address", "Dirección"), esc(ctx.address)]);
  if (ctx.hours) rows.push([ctx.t("Hours", "Horario"), esc(ctx.hours)]);
  if (ctx.tel) rows.push([ctx.t("Phone", "Teléfono"), `<a href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>`]);
  return `<dl class="${cls}">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
}

export function directionsLink(ctx, cls = "dir") {
  if (!ctx.mapsUrl) return "";
  return `<a class="${cls}" href="${esc(ctx.mapsUrl)}" rel="noopener noreferrer" target="_blank">${icon("pin")}<span>${ctx.t("Open in Google Maps", "Abrir en Google Maps")}</span></a>`;
}

export function servicesNote(ctx, cls = "svc-note") {
  if (!ctx.servicesFromDefaults) return "";
  return `<p class="${cls}">${ctx.t("Typical services for this kind of business. The final list comes from the owner.", "Servicios típicos para este tipo de negocio. La lista final la confirma el dueño.")}</p>`;
}

export function themesNote(ctx, cls = "themes-note") {
  return `<p class="${cls}">${ctx.t("Paraphrased from what customers say in Google reviews.", "Resumido de lo que dicen los clientes en reseñas de Google.")}</p>`;
}

export function reviewsText(ctx) {
  return ctx.t(`${ctx.reviewsText} Google reviews`, `${ctx.reviewsText} reseñas de Google`);
}

export function footerLegal(ctx) {
  const stop = /[.!?]$/.test(String(ctx.lead.business || "").trim()) ? "" : ".";
  return `<p class="legal">&copy; ${ctx.year} ${ctx.name}${stop} ${ctx.t("Website concept by Kija Creative.", "Concepto de sitio web por Kija Creative.")}</p>`;
}

export function stepsList(ctx, steps, cls = "steps") {
  return `<ol class="${cls}">${steps
    .map((s, i) => `<li class="rv"><span class="step-n" aria-hidden="true">${i + 1}</span><h3>${ctx.t(s.title[0], s.title[1])}</h3><p>${ctx.t(s.body[0], s.body[1])}</p></li>`)
    .join("")}</ol>`;
}
