// renderDemo(lead, { categories, settings, now, assignment, leads }) -> { html, template, direction, palette, variants, photos }
// Pure: no clock, no disk, no src/lib imports. The caller passes `now`.
//
// Each lead renders with a design direction (src/demo/directions). Which one,
// with which palette and variants, comes from assignDirections: pass
// `assignment` (one entry of its result) to use a batch wide choice, or `leads`
// to compute it over a whole list; alone, the lead's stored lead.demo choice or
// a deterministic pick is used.

import { assignDirections } from "./assign.js";
import { CREDITS_SLOT } from "./blocks.js";
import { promiseFor, monthYear } from "./copy.js";
import { DIRECTION_LIST, DIRECTIONS, CATEGORY_VERTICALS, directionsForVertical } from "./directions/index.js";
import { formCopyFor, formKindFor, nextDays, requestForm } from "./forms.js";
import {
  callBar,
  CATEGORY_ES,
  cityState,
  cleanList,
  createI18n,
  documentShell,
  esc,
  formatRating,
  formatReviews,
  hasSpanish,
  langToggle,
  nameScale,
  pageScript,
  placeLine,
  resolveServices,
  ribbonHtml,
  telHref,
  toDate,
  varsCss,
} from "./shared.js";
import { createPhotoSet, creditsHtml } from "./stock.js";

export { DIRECTIONS, DIRECTION_LIST };

const VERTICALS = ["auto", "home-services", "contractor", "personal-care", "general"];
const VERTICAL_LABELS = { auto: "Auto", "home-services": "Home services", contractor: "Contractors", "personal-care": "Personal care", general: "Local service" };

// For the app and server: the palettes a lead of each vertical can be given.
// Palette keys are unique across directions, so a palette names its direction.
export const TEMPLATE_INFO = Object.fromEntries(VERTICALS.map((v) => [v, {
  key: v,
  label: VERTICAL_LABELS[v],
  palettes: directionsForVertical(v).flatMap((d) => d.palettes.map((p) => ({ key: p.key, name: `${d.label}: ${p.name}`, direction: d.key }))),
}]));

// For the app: every direction with its status, suits and palettes.
export const DIRECTION_INFO = Object.fromEntries(DIRECTION_LIST.map((d) => [d.key, {
  key: d.key,
  label: d.label,
  status: d.status,
  suits: [...d.suits],
  palettes: d.palettes.map((p) => ({ key: p.key, name: p.name })),
  variants: { hero: [...d.variants.hero], services: [...d.variants.services], proof: [...d.variants.proof] },
}]));

const COPY_KEYS = ["headline", "subhead", "about", "ctaPrimary", "ctaSecondary"];

export function resolveVertical(lead, categories) {
  const cat = categories && lead && categories[lead.categoryKey];
  const vertical = cat && cat.vertical;
  return VERTICALS.includes(vertical) ? vertical : "general";
}

function safeMapsUrl(lead) {
  const url = String(lead.googleMapsUrl || "").trim();
  if (/^https:\/\//i.test(url)) return url;
  const address = String(lead.address || "").trim();
  if (!address) return "";
  const q = [address, lead.city, lead.state].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function assignmentFor(lead, { assignment, leads, categories }) {
  if (assignment && DIRECTIONS[assignment.direction]) return assignment;
  const pool = Array.isArray(leads) && leads.some((l) => l && l.id === lead.id) ? leads : [lead];
  const map = assignDirections(pool, { directions: DIRECTIONS, categories, verticalMap: CATEGORY_VERTICALS });
  return map.get(lead.id) || [...map.values()][pool.indexOf(lead)] || [...map.values()][0];
}

// Keeps photo credits exact: the marker becomes the credit line, and a
// direction that forgot the marker still gets the line inside its footer.
function placeCredits(body, credits) {
  if (body.includes(CREDITS_SLOT)) return body.split(CREDITS_SLOT).join(credits);
  if (!credits) return body;
  const at = body.lastIndexOf("</footer>");
  return at >= 0 ? `${body.slice(0, at)}${credits}${body.slice(at)}` : `${body}<footer class="stock-foot">${credits}</footer>`;
}

export function renderDemo(lead, options = {}) {
  const { categories = {}, settings = {}, now } = options;
  const date = toDate(now, lead);
  const vertical = resolveVertical(lead, categories);
  const choice = assignmentFor(lead, { assignment: options.assignment, leads: options.leads, categories });
  const dir = DIRECTIONS[choice.direction];
  const palette = dir.palettes.find((p) => p.key === choice.palette) || dir.palettes[0];
  const variants = { ...choice.variants };
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
    formCopy: formCopyFor(kind, lead.categoryKey),
    name: esc(lead.business),
    nameRaw: String(lead.business || ""),
    nameScale: nameScale(lead.business),
    categoryT: i18n.t(categoryLabel, CATEGORY_ES[lead.categoryKey]),
    placeRaw: placeLine(lead),
    cityState: cityState(lead),
    cityRaw: String(lead.city || "").trim(),
    stateRaw: String(lead.state || "").trim(),
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
    promise: promiseFor({ vertical, kind, categoryKey: lead.categoryKey || "" }),
    now: date,
    year: date.getUTCFullYear(),
    monthYear: monthYear(date),
    days: nextDays(date),
    direction: dir,
    palette,
    variants,
    photos: createPhotoSet({ lead, categoryKey: lead.categoryKey || "", vertical, imagery: dir.imagery || {}, heroId: variants.photo || "" }),
    langToggle: "",
  };
  ctx.langToggle = langToggle(i18n);
  ctx.form = requestForm(kind, ctx);

  const out = dir.render(ctx);
  const used = ctx.photos.used;
  const body = placeCredits(out.body, creditsHtml(used, i18n));
  const ribbon = ribbonHtml(lead, i18n, { photos: used.length > 0 });
  const where = ctx.placeRaw || ctx.cityState;
  const bar = callBar(ctx, { mode: dir.callbar === "split" ? "split" : "call", bookLabel: dir.callbarBook || ["Book", "Reservar"] });

  const html = documentShell({
    lang: "en",
    title: `${lead.business} | ${categoryLabel} in ${ctx.cityState}`,
    description: `${categoryLabel} in ${where}. ${ctx.ratingText} stars from ${ctx.reviewsText} Google reviews.`,
    fontsHref: dir.fontsHref,
    css: `${varsCss(palette.vars)}${out.css}`,
    body: `${ribbon}\n${body}\n${bar}`,
    // The body reserves the call bar's space only when there is a call bar.
    bodyClass: bar ? "has-callbar" : "",
    script: pageScript(i18n.dict),
    comment: `Private concept by Kija Creative. Direction ${dir.key} (${dir.status}), palette ${palette.key}, hero ${variants.hero}, services ${variants.services}, proof ${variants.proof}, rendered ${date.toISOString()}. Ribbon setting ${settings && settings.demoDefaults && settings.demoDefaults.conceptRibbon === false ? "off, shown anyway by guardrail" : "on"}.`,
  });

  return {
    html,
    template: dir.key,
    direction: dir.key,
    palette: palette.key,
    variants,
    photos: used.map((p) => p.id),
  };
}
