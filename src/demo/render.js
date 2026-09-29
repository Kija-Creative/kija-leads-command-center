// renderDemo(lead, { categories, settings, now }) -> { html, template, palette }
// Pure: no clock, no disk, no src/lib imports. The caller passes `now`.

import { formKindFor, FORM_COPY, nextDays, requestForm } from "./forms.js";
import {
  callBar,
  CATEGORY_ES,
  cityState,
  createI18n,
  documentShell,
  esc,
  formatRating,
  formatReviews,
  hasSpanish,
  langToggle,
  nameScale,
  pageScript,
  pickPalette,
  placeLine,
  resolveServices,
  ribbonHtml,
  telHref,
  toDate,
  varsCss,
  cleanList,
} from "./shared.js";
import { template as auto } from "./templates/auto.js";
import { template as contractor } from "./templates/contractor.js";
import { template as general } from "./templates/general.js";
import { template as homeServices } from "./templates/home-services.js";
import { template as personalCare } from "./templates/personal-care.js";

export const TEMPLATES = {
  auto,
  "home-services": homeServices,
  contractor,
  "personal-care": personalCare,
  general,
};

// For the app: which palettes each template offers, so Jamey can pick one.
export const TEMPLATE_INFO = Object.fromEntries(
  Object.values(TEMPLATES).map((tpl) => [tpl.key, { key: tpl.key, label: tpl.label, palettes: tpl.palettes.map((p) => ({ key: p.key, name: p.name })) }]),
);

const COPY_KEYS = ["headline", "subhead", "about", "ctaPrimary", "ctaSecondary"];

export function resolveVertical(lead, categories) {
  const cat = categories && lead && categories[lead.categoryKey];
  const vertical = cat && cat.vertical;
  return TEMPLATES[vertical] ? vertical : "general";
}

function safeMapsUrl(lead) {
  const url = String(lead.googleMapsUrl || "").trim();
  if (/^https:\/\//i.test(url)) return url;
  const address = String(lead.address || "").trim();
  if (!address) return "";
  const q = [address, lead.city, lead.state].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function renderDemo(lead, options = {}) {
  const { categories = {}, settings = {}, now } = options;
  const date = toDate(now, lead);
  const vertical = resolveVertical(lead, categories);
  const tpl = TEMPLATES[vertical];
  const palette = pickPalette(lead, tpl.palettes);
  const i18n = createI18n(hasSpanish(lead));
  const { items: services, fromDefaults } = resolveServices(lead, categories);
  const cat = (categories && categories[lead.categoryKey]) || {};
  const categoryLabel = String(lead.category || cat.label || "Local service").trim();

  const rawCopy = lead.demoCopy && typeof lead.demoCopy === "object" ? lead.demoCopy : {};
  const copy = {};
  for (const k of COPY_KEYS) copy[k] = typeof rawCopy[k] === "string" ? rawCopy[k].trim() : "";

  const kind = formKindFor(vertical, lead.categoryKey);
  const phone = String(lead.phone || "").trim();

  const ctx = {
    lead,
    i18n,
    t: i18n.t.bind(i18n),
    vertical,
    categoryKey: lead.categoryKey || "",
    kind,
    formCopy: FORM_COPY[kind],
    name: esc(lead.business),
    nameScale: nameScale(lead.business),
    categoryT: i18n.t(categoryLabel, CATEGORY_ES[lead.categoryKey]),
    placeRaw: placeLine(lead),
    cityState: cityState(lead),
    cityRaw: String(lead.city || "").trim(),
    phone,
    tel: telHref(phone),
    rating: String(lead.googleRating),
    reviews: String(lead.googleReviews),
    ratingText: formatRating(lead.googleRating),
    reviewsText: formatReviews(lead.googleReviews),
    services,
    servicesFromDefaults: fromDefaults,
    themes: cleanList(lead.reviewThemes),
    hours: String(lead.hours || "").trim(),
    address: String(lead.address || "").trim(),
    mapsUrl: safeMapsUrl(lead),
    copy,
    about: copy.about ? esc(copy.about) : "",
    // Owner approved copy wins over template copy, and is never machine translated.
    copyOr(key, pair) {
      return copy[key] ? esc(copy[key]) : i18n.t(pair[0], pair[1]);
    },
    now: date,
    year: date.getUTCFullYear(),
    days: nextDays(date),
    palette,
    langToggle: "",
  };
  ctx.langToggle = langToggle(i18n);
  ctx.form = requestForm(kind, ctx);

  const { css, body } = tpl.render(ctx);
  const ribbon = ribbonHtml(lead, i18n);
  const where = ctx.placeRaw || ctx.cityState;
  const bar = callBar(ctx);

  const html = documentShell({
    lang: "en",
    title: `${lead.business} | ${categoryLabel} in ${ctx.cityState}`,
    description: `${categoryLabel} in ${where}. ${ctx.ratingText} stars from ${ctx.reviewsText} Google reviews.`,
    fontsHref: tpl.fontsHref,
    css: `${varsCss(palette.vars)}${css}`,
    body: `${ribbon}\n${body}\n${bar}`,
    // The body reserves the call bar's space only when there is a call bar.
    bodyClass: bar ? "has-callbar" : "",
    script: pageScript(i18n.dict),
    comment: `Private concept by Kija Creative. Template ${tpl.key}, palette ${palette.key}, rendered ${date.toISOString()}. Ribbon setting ${settings && settings.demoDefaults && settings.demoDefaults.conceptRibbon === false ? "off, shown anyway by guardrail" : "on"}.`,
  });

  return { html, template: tpl.key, palette: palette.key };
}
