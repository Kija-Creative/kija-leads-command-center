// Stock photos for demos. The only images a demo may show are the licensed,
// hand checked photos in stock-library.json (see research/stock-photos.md).
// The library is imported as a module so rendering never reads the disk.
// Photos are hotlinked from the two library hosts; everything else stays refused.

import library from "./stock-library.json" with { type: "json" };
import { esc, hashString } from "./shared.js";

export const STOCK = library;
export const STOCK_PHOTOS = Array.isArray(library.photos) ? library.photos : [];
export const STOCK_HOSTS = ["images.unsplash.com", "images.pexels.com"];

// Which library groups fit each category, best first (research/stock-photos.md section 3).
const GROUPS_BY_CATEGORY = {
  barber: ["barber"],
  "hair-salon": ["salon"],
  "nail-salon": ["salon"],
  tattoo: ["salon"],
  "pet-grooming": ["salon"],
  "auto-body-collision": ["collision", "auto"],
  "auto-detailing": ["collision", "auto"],
};
const GROUPS_BY_VERTICAL = {
  auto: ["auto"],
  "home-services": ["home"],
  contractor: ["contractor"],
  "personal-care": ["salon"],
  general: [],
};

// A photo must show this trade. Shared groups (salon, home, contractor) hold
// several trades, and a nail photo on a hair salon or a condenser on a septic
// company would misstate what the business does. Neutral scenes (a clean room,
// an unbranded van) stand in for trades the library does not cover.
const CATEGORY_FIT = {
  "hair-salon": /salon-interior|shampoo|color|foil/,
  "nail-salon": /manicure|nail/,
  tattoo: /tattoo/,
  "pet-grooming": /dog/,
  hvac: /hvac|living/,
  plumbing: /plumbing|living/,
  electrical: /electrical|living/,
  septic: /van|living/,
  "garage-door": /van|living/,
  restoration: /living/,
  "appliance-repair": /living|van/,
  "pest-control": /living|van/,
  roofing: /roof/,
  concrete: /concrete/,
  fencing: /fence/,
  pools: /pool/,
  landscaping: /yard|hedge/,
  painting: /paint-roller/,
  remodeling: /kitchen/,
  "tree-service": /hedge|yard/,
  "foundation-repair": /concrete/,
};

// Inside a group that fits, these subjects go first.
const CATEGORY_PREFER = {
  "diesel-truck-repair": /diesel|semi/,
  "tire-shop": /tire|lift/,
  "muffler-exhaust": /under|lift/,
  "auto-detailing": /polish|detail|wipe|finish/,
  "auto-body-collision": /bodywork|spray|booth|finish/,
  "mobile-mechanic": /engine|electrical/,
};

export function photoGroupsFor(categoryKey, vertical) {
  return GROUPS_BY_CATEGORY[categoryKey] || GROUPS_BY_VERTICAL[vertical] || [];
}

export function libraryPhoto(id) {
  return STOCK_PHOTOS.find((p) => p.id === id) || null;
}

// A photo is identified by host and path; size parameters may change.
export function photoKey(url) {
  try {
    const u = new URL(String(url).trim());
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return "";
  }
}

const LIBRARY_KEYS = new Map(STOCK_PHOTOS.map((p) => [photoKey(p.url), p]));

export function isLibraryUrl(url) {
  const key = photoKey(url);
  if (!key) return false;
  const host = new URL(key).host;
  return STOCK_HOSTS.includes(host) && LIBRARY_KEYS.has(key);
}

export function photoForUrl(url) {
  return LIBRARY_KEYS.get(photoKey(url)) || null;
}

// Only the size parameters change; the path always stays the library's.
export function sizedUrl(photo, width) {
  const u = new URL(photo.url);
  u.searchParams.set("w", String(width));
  return u.toString();
}

function heightFor(photo, width) {
  const w = Number(photo.sourceWidth) || 3;
  const h = Number(photo.sourceHeight) || 2;
  return Math.round((width * h) / w);
}

// Photos for a lead: the groups that fit its category, only subjects that show
// its trade, the people rule applied, and preferred subjects first.
export function candidatePhotos({ categoryKey, vertical, people, groups } = {}) {
  const use = groups && groups.length ? groups : photoGroupsFor(categoryKey, vertical);
  const allowed = Array.isArray(people) && people.length ? people : ["none", "hands", "partial"];
  const must = CATEGORY_FIT[categoryKey];
  const hint = CATEGORY_PREFER[categoryKey];
  const out = [];
  for (const g of use) {
    const inGroup = STOCK_PHOTOS.filter((p) => p.group === g && allowed.includes(p.people || "none") && (!must || must.test(p.id)));
    const fit = hint ? inGroup.filter((p) => hint.test(p.id)) : [];
    const rest = inGroup.filter((p) => !fit.includes(p));
    out.push(...fit, ...rest);
  }
  return out;
}

// Hero candidates for a direction: its people rule for heroes, and the
// subjects it asks for (imagery.heroPrefer, a RegExp on the photo id) first.
export function heroCandidates({ categoryKey, vertical, imagery = {} } = {}) {
  if (imagery.photos === false) return [];
  const pool = candidatePhotos({ categoryKey, vertical, people: imagery.heroPeople || imagery.people, groups: imagery.groups });
  const want = imagery.heroPrefer instanceof RegExp ? imagery.heroPrefer : null;
  if (!want) return pool;
  return [...pool.filter((p) => want.test(p.id)), ...pool.filter((p) => !want.test(p.id))];
}

// Deterministic rotation of a list, seeded by the lead id.
export function rotate(list, seed) {
  if (!list.length) return [];
  const start = hashString(seed) % list.length;
  return [...list.slice(start), ...list.slice(0, start)];
}

// The ", stock photo" ending is the disclosure screen readers get.
export function stockAlt(photo) {
  const alt = String(photo.alt || photo.subject || "Photo").trim().replace(/[.,;]+$/, "");
  return `${alt}, stock photo`;
}

// One library photo as an <img>. The hero loads eagerly; every other photo is lazy.
export function imgTag(photo, { hero = false, width = 1600, sizes = "100vw", cls = "", position = "" } = {}) {
  const widths = [800, 1200, 1600].filter((w) => w <= Math.max(width, 800));
  const srcset = widths.map((w) => `${esc(sizedUrl(photo, w))} ${w}w`).join(", ");
  const focus = position || photo.focus || "50% 50%";
  const load = hero ? " fetchpriority=\"high\" data-hero" : " loading=\"lazy\"";
  return `<img${cls ? ` class="${esc(cls)}"` : ""} src="${esc(sizedUrl(photo, width))}" srcset="${srcset}" sizes="${esc(sizes)}" width="${width}" height="${heightFor(photo, width)}" alt="${esc(stockAlt(photo))}"${load} decoding="async" referrerpolicy="no-referrer" data-stock="${esc(photo.id)}" style="object-fit:cover;object-position:${esc(focus)}">`;
}

// Per render: hands out photos without repeats and remembers what was shown,
// so the ribbon and the footer credits list exactly the photos on the page.
export function createPhotoSet({ lead, categoryKey, vertical, imagery = {}, heroId = "" }) {
  const seed = (lead && (lead.id || lead.business)) || "demo";
  const enabled = imagery.photos !== false;
  const pool = enabled ? rotate(candidatePhotos({ categoryKey, vertical, people: imagery.people, groups: imagery.groups }), seed) : [];
  const used = [];
  const taken = new Set();
  const heroPool = enabled ? heroCandidates({ categoryKey, vertical, imagery }) : [];
  const preferred = heroId && heroPool.find((p) => p.id === heroId);

  function take(photo) {
    if (!photo) return null;
    taken.add(photo.id);
    return photo;
  }
  const set = {
    enabled,
    used,
    // The hero photo: the assigned one when it fits, else the first by rotation.
    hero() {
      if (!enabled) return null;
      if (preferred && !taken.has(preferred.id)) return take(preferred);
      return take(heroPool.find((p) => !taken.has(p.id)) || null);
    },
    // The next unused photo, optionally filtered (for example by people or subject).
    next(filter) {
      if (!enabled) return null;
      const fits = pool.filter((p) => !taken.has(p.id) && (!filter || filter(p)));
      return take(fits[0] || null);
    },
    many(count, filter) {
      const out = [];
      for (let i = 0; i < count; i += 1) {
        const p = set.next(filter);
        if (!p) break;
        out.push(p);
      }
      return out;
    },
    // Markup for a photo; registers it for the credits.
    img(photo, opts) {
      if (!photo) return "";
      if (!used.includes(photo)) used.push(photo);
      return imgTag(photo, opts);
    },
  };
  return set;
}

const SOURCE_NAMES = { unsplash: ["Unsplash", "https://unsplash.com"], pexels: ["Pexels", "https://www.pexels.com"] };

function joinNames(names) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

// "Stock photos: A and B on Unsplash; C on Pexels." in page order, grouped by source.
export function creditsHtml(photos, i18n) {
  if (!photos || !photos.length) return "";
  const bySource = new Map();
  for (const p of photos) {
    const src = SOURCE_NAMES[p.source] ? p.source : "unsplash";
    if (!bySource.has(src)) bySource.set(src, []);
    const list = bySource.get(src);
    const name = /^https:\/\//.test(p.photographerUrl || "")
      ? `<a href="${esc(p.photographerUrl)}" rel="noopener noreferrer" target="_blank">${esc(p.photographer)}</a>`
      : esc(p.photographer);
    if (!list.includes(name)) list.push(name);
  }
  const parts = [...bySource.entries()].map(([src, names]) => `${joinNames(names)} ${i18n.t("on", "en")} <a href="${SOURCE_NAMES[src][1]}" rel="noopener noreferrer" target="_blank">${SOURCE_NAMES[src][0]}</a>`);
  return `<p class="stock-credits" data-stock-credits>${i18n.t("Stock photos:", "Fotos de archivo:")} ${parts.join("; ")}.</p>`;
}
