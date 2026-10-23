// Business tracks. A track is a separate line of work with its own weekly run, quota, offer,
// scoring and pipeline: "websites" (the original Kija offer) and "restaurants" (the combined
// website plus Cliqbux offer). A category belongs to a track through its vertical, so the
// categories file stays the single place that says what a business is. Pure.

export const DEFAULT_TRACK = "websites";

// What config/tracks.json holds when the file is missing; the shipped file says the same.
export function defaultTracks() {
  return {
    websites: {
      label: "Websites",
      short: "Websites",
      description: "Local service businesses that need an owned website: auto, home services, contractors and personal care.",
      verticals: ["auto", "home-services", "contractor", "personal-care", "general"],
      requiredVerticals: ["auto", "home-services", "contractor"],
      scoring: "website",
    },
    restaurants: {
      label: "Restaurants + Cliqbux",
      short: "Restaurants",
      description: "Restaurants and food businesses pitched as a combined offer with Cliqbux, our software partner: an owned website plus Cliqbux.",
      verticals: ["restaurants"],
      requiredVerticals: [],
      scoring: "restaurant",
    },
  };
}

export function trackIds(tracks) {
  return Object.keys(tracks ?? defaultTracks());
}

export function isTrack(tracks, id) {
  return typeof id === "string" && Object.hasOwn(tracks ?? defaultTracks(), id);
}

// The track a vertical belongs to; an unlisted vertical falls back to the default track.
export function trackOfVertical(tracks, vertical) {
  const all = tracks ?? defaultTracks();
  for (const [id, t] of Object.entries(all)) {
    if (Array.isArray(t?.verticals) && t.verticals.includes(vertical)) return id;
  }
  return DEFAULT_TRACK;
}

export function trackOfCategory(tracks, categories, categoryKey) {
  return trackOfVertical(tracks, categories?.[categoryKey]?.vertical);
}

// "website" or "restaurant": which scoring rules and required fields a track uses.
export function scoringOfTrack(tracks, track) {
  return (tracks ?? defaultTracks())[track]?.scoring ?? "website";
}

// A lead's track: its stored track when that is a known one, otherwise the category's.
export function trackOfLead(lead, { tracks, categories } = {}) {
  if (isTrack(tracks, lead?.track)) return lead.track;
  return trackOfCategory(tracks, categories, lead?.categoryKey);
}

// Category keys that belong to a track, in file order.
export function categoriesOfTrack(tracks, categories, track) {
  return Object.keys(categories ?? {}).filter((k) => trackOfCategory(tracks, categories, k) === track);
}

// The settings that apply to one track: the global settings with that track's own quota,
// categories per week and offer laid over them. The default track uses the global ones as is.
export function settingsForTrack(settings, track) {
  const base = settings ?? {};
  if (!track || track === DEFAULT_TRACK) return base;
  const own = base.tracks?.[track] ?? {};
  const merged = { ...base };
  if (Number.isInteger(own.weeklyQuota)) merged.weeklyQuota = own.weeklyQuota;
  if (Number.isInteger(own.categoriesPerWeek)) merged.categoriesPerWeek = own.categoriesPerWeek;
  if (own.offer && typeof own.offer === "object") merged.offer = own.offer;
  if (own.thresholds && typeof own.thresholds === "object") merged.thresholds = { ...base.thresholds, ...own.thresholds };
  return merged;
}

// The partner a track is run with (Cliqbux for restaurants), or null.
export function partnerFor(settings, track) {
  const p = settings?.tracks?.[track]?.partner;
  return p && typeof p === "object" ? p : null;
}

// Run files: the default track keeps the plain date (every existing run), the others add the
// track so two tracks can run on the same Monday without sharing a file.
export function runKey(runId, track) {
  return !track || track === DEFAULT_TRACK ? runId : `${runId}.${track}`;
}

export function splitRunKey(key) {
  const m = /^(\d{4}-\d{2}-\d{2})(?:\.([a-z0-9-]+))?$/.exec(String(key ?? ""));
  return m ? { runId: m[1], track: m[2] ?? DEFAULT_TRACK } : { runId: String(key ?? ""), track: DEFAULT_TRACK };
}
