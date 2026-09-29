// Validators. A rule violation is a return value { ok, errors, warnings }, never an exception.
// Every message is a sentence a person can read. Pure: time comes in through ctx.now.

import { DEFAULT_THRESHOLDS } from "./score.js";
import { isChain, normalizePhone } from "./normalize.js";
import { INACTIVE_OUTREACH_STATUSES, isSuppressed, PHONE_LINE_TYPES, TEXAS_REGISTRATION_STATUSES } from "./compliance.js";

export const OUTREACH_STATUSES = ["New", "Research", "Demo Built", "Contacted", "Replied", "Meeting", "Won", "Lost", "Not a fit"];
// consent: the prospect agreed to texts or follow up by a channel, and the text says which.
// suppressed: the business asked not to be contacted, or Kija decided never to contact it.
export const HISTORY_TYPES = ["created", "status", "note", "call", "email", "meeting", "research", "demo", "consent", "suppressed"];
export const CONFIDENCE_LEVELS = ["High", "Medium-High", "Medium", "Low"];
export const VERIFICATION_STATUSES = ["verified", "needs-recheck", "unverified"];
export const LEAD_ORIGINS = ["sheet-import", "weekly-run", "manual", "queue-promotion"];
export const OWNERS = ["", "Jamey", "Kiel", "Daisy"];
// Where the stored rating and review count were read. "places-api" is never valid on a stored
// record: Google's terms let us keep only place IDs from Places (research/places-api.md).
export const RATING_SOURCES = ["", "google-maps-observed", "secondary", "owner"];
// Older records and playbooks wrote "google-maps"; it reads as google-maps-observed.
export const LEGACY_RATING_SOURCES = { "google-maps": "google-maps-observed" };
export const PLACES_RATING_SOURCE = "places-api";
export { PHONE_LINE_TYPES };
// Retired fields: accepted on read, dropped on write. placesFetchedAt belonged to the old
// 30 day Places cache rule; only place IDs are kept now (research/places-api.md).
export const RETIRED_LEAD_FIELDS = ["placesFetchedAt"];
export const QUEUE_DECISIONS = ["Research", "Promote", "Drop"];
export const BATCH_MODES = ["weekly", "reverify", "manual"];
export const REVERIFY_DECISIONS = ["keep", "reject"];
export const VERTICALS = ["auto", "home-services", "contractor", "personal-care", "general"];
// "stored" is for records already on disk: floors become warnings, because a reverify can
// lower a rating after the lead was accepted and that should not break npm run check.
export const VALIDATION_MODES = ["weekly", "manual", "stored"];

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA",
  "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR",
  "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "PR",
];

export const REQUIRED_LEAD_FIELDS = [
  "business", "category", "categoryKey", "city", "state", "googleRating", "googleReviews", "phone", "websiteStatus",
  "websiteGap", "ticketValue", "visualFit", "confidence", "whyKija", "pitchAngle", "demoConcept", "sources",
];

const DASH_RE = /[\u2013\u2014]/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const QUOTE_RE = /["\u201c\u201d\u00ab\u00bb]/;
// Google recommends refreshing place IDs older than 12 months.
export const PLACE_ID_MAX_AGE_DAYS = 365;
const PLACES_RULE = "Only place IDs may be kept from the Places API; read the rating from the public Google Maps listing (google-maps-observed), a secondary mirror or the owner.";

function result(errors, warnings, extra = {}) {
  return { ok: errors.length === 0, errors, warnings, ...extra };
}

function isBlank(v) {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function isIsoDate(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function isIsoTimestamp(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(new Date(value).getTime());
}

function isHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function toDate(now) {
  if (now instanceof Date) return now;
  if (typeof now === "string" && now) {
    const d = new Date(now.length === 10 ? `${now}T12:00:00Z` : now);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

// Deep walk; returns paths such as "whyKija" or "sources[1].label".
export function findDashes(value, path = "") {
  const hits = [];
  const walk = (v, p) => {
    if (typeof v === "string") {
      if (DASH_RE.test(v)) hits.push(p || "(value)");
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, `${p}[${i}]`));
    } else if (isPlainObject(v)) {
      for (const [k, item] of Object.entries(v)) {
        if (DASH_RE.test(k)) hits.push(p ? `${p}.${k} (key)` : `${k} (key)`);
        walk(item, p ? `${p}.${k}` : k);
      }
    }
  };
  walk(value, path);
  return hits;
}

// Line and column (1 based) of every U+2014 and U+2013 in a text file's contents.
export function dashLocations(text) {
  const hits = [];
  String(text ?? "").split("\n").forEach((line, i) => {
    for (let col = 0; col < line.length; col += 1) {
      const code = line.charCodeAt(col);
      if (code === 0x2014 || code === 0x2013) {
        hits.push({ line: i + 1, column: col + 1, char: code === 0x2014 ? "em dash (U+2014)" : "en dash (U+2013)" });
      }
    }
  });
  return hits;
}

function dashErrors(value, what) {
  return findDashes(value).map(
    (p) => `${what} field ${p} contains an em or en dash. Use a comma, a period or a colon instead.`,
  );
}

function thresholdsFrom(ctx) {
  return { ...DEFAULT_THRESHOLDS, ...(ctx?.settings?.thresholds ?? {}) };
}

function checkSources(sources, label, errors) {
  if (!Array.isArray(sources)) return;
  sources.forEach((s, i) => {
    const n = i + 1;
    if (!isPlainObject(s)) {
      errors.push(`${label} source ${n} must be an object with url, label and checkedAt.`);
      return;
    }
    if (!isHttpUrl(s.url)) errors.push(`${label} source ${n} needs a full http or https url.`);
    if (!isBlank(s.checkedAt) && !isIsoDate(s.checkedAt)) {
      errors.push(`${label} source ${n} checkedAt must be a date like 2026-09-28.`);
    }
  });
}

function checkScale(value, field, label, errors) {
  if (!Number.isInteger(value) || value < 1 || value > 3) {
    errors.push(`${label} ${field} must be a whole number from 1 to 3; it is ${JSON.stringify(value)}.`);
  }
}

function checkRatingReviews(rating, reviews, label, errors, { allowNull = false } = {}) {
  if (!(allowNull && rating === null) && rating !== undefined) {
    if (typeof rating !== "number" || !Number.isFinite(rating) || rating < 0 || rating > 5) {
      errors.push(`${label} googleRating must be a number from 0 to 5; it is ${JSON.stringify(rating)}.`);
    }
  }
  if (!(allowNull && reviews === null) && reviews !== undefined) {
    if (!Number.isInteger(reviews) || reviews < 0) {
      errors.push(`${label} googleReviews must be a whole number of 0 or more; it is ${JSON.stringify(reviews)}.`);
    }
  }
}

function checkPhone(phone, label, errors) {
  if (isBlank(phone)) return;
  const formatted = normalizePhone(phone);
  if (!formatted) {
    errors.push(`${label} phone ${JSON.stringify(phone)} is not a valid US number.`);
  } else if (formatted !== phone) {
    errors.push(`${label} phone must be written ${formatted}, in the NNN-NNN-NNNN format.`);
  }
}

function checkState(state, label, errors) {
  if (isBlank(state)) return;
  if (!US_STATES.includes(state)) errors.push(`${label} state ${JSON.stringify(state)} is not a two letter USPS code such as TX.`);
}

function checkOutreach(outreach, label, errors) {
  if (!isPlainObject(outreach)) {
    errors.push(`${label} outreach must be an object.`);
    return;
  }
  if (!OUTREACH_STATUSES.includes(outreach.status)) {
    errors.push(`${label} outreach status ${JSON.stringify(outreach.status)} is not one of: ${OUTREACH_STATUSES.join(", ")}.`);
  }
  if (!isBlank(outreach.nextDate) && !isIsoDate(outreach.nextDate)) {
    errors.push(`${label} next date must be empty or a date like 2026-10-05.`);
  }
  if (outreach.owner !== undefined && !OWNERS.includes(outreach.owner)) {
    errors.push(`${label} owner ${JSON.stringify(outreach.owner)} must be empty or one of Jamey, Kiel, Daisy.`);
  }
  if (!Array.isArray(outreach.history)) {
    errors.push(`${label} outreach history must be a list.`);
    return;
  }
  outreach.history.forEach((h, i) => {
    const n = i + 1;
    if (!isPlainObject(h)) {
      errors.push(`${label} history entry ${n} must be an object.`);
      return;
    }
    if (!HISTORY_TYPES.includes(h.type)) errors.push(`${label} history entry ${n} has unknown type ${JSON.stringify(h.type)}.`);
    if (!isIsoTimestamp(h.at)) errors.push(`${label} history entry ${n} needs an ISO timestamp in at.`);
    if (isBlank(h.by)) errors.push(`${label} history entry ${n} needs a by value saying who wrote it.`);
  });
}

// Validate a history entry before it is appended (server POST /api/leads/:id/history).
export function validateHistoryEntry(entry) {
  const errors = [];
  if (!isPlainObject(entry)) return result(["A history entry must be an object with type, text and by."], []);
  if (!HISTORY_TYPES.includes(entry.type)) {
    errors.push(`History type ${JSON.stringify(entry.type)} is not one of: ${HISTORY_TYPES.join(", ")}.`);
  }
  if (typeof entry.text !== "string") errors.push("History text must be a string.");
  else if (entry.type === "consent" && !entry.text.trim()) {
    errors.push("A consent entry must say what the owner agreed to and by which channel, for example: Agreed to texts at this number.");
  } else if (entry.type === "suppressed" && !entry.text.trim()) {
    errors.push("A suppressed entry must say why the business is never contacted again.");
  }
  if (isBlank(entry.by)) errors.push("A history entry needs a by value saying who wrote it.");
  errors.push(...dashErrors(entry, "History entry"));
  return result(errors, []);
}

// Validate an outreach patch (server PATCH /api/leads/:id). Only fields present are checked.
// ctx.lead and ctx.suppression let it refuse to move a suppressed lead back into active outreach.
export function validateOutreachPatch(patch, ctx = {}) {
  const errors = [];
  if (!isPlainObject(patch)) return result(["Outreach changes must be an object."], []);
  if (patch.status !== undefined && !OUTREACH_STATUSES.includes(patch.status)) {
    errors.push(`Status ${JSON.stringify(patch.status)} is not one of: ${OUTREACH_STATUSES.join(", ")}.`);
  } else if (patch.status !== undefined && ctx.lead && !INACTIVE_OUTREACH_STATUSES.includes(patch.status)
    && isSuppressed(ctx.lead, ctx.suppression)) {
    errors.push(`${ctx.lead.business || "This business"} is suppressed, so it cannot move back to ${patch.status}. It can only be ${INACTIVE_OUTREACH_STATUSES.join(", ")}.`);
  }
  if (patch.nextDate !== undefined && !isBlank(patch.nextDate) && !isIsoDate(patch.nextDate)) {
    errors.push("Next date must be empty or a date like 2026-10-05.");
  }
  if (patch.owner !== undefined && !OWNERS.includes(patch.owner)) {
    errors.push(`Owner ${JSON.stringify(patch.owner)} must be empty or one of Jamey, Kiel, Daisy.`);
  }
  for (const f of ["nextAction", "notes"]) {
    if (patch[f] !== undefined && typeof patch[f] !== "string") errors.push(`${f} must be text.`);
  }
  if (patch.history !== undefined) errors.push("History is append only; add entries through the history endpoint.");
  errors.push(...dashErrors(patch, "Outreach"));
  return result(errors, []);
}

export function validateRoiOverrides(overrides, label = "ROI") {
  const errors = [];
  if (overrides === undefined || overrides === null) return result(errors, []);
  if (!isPlainObject(overrides)) return result([`${label} overrides must be an object.`], []);
  for (const [key, value] of Object.entries(overrides)) {
    if (!["ticket", "margin", "price", "jobsPerMonth"].includes(key)) {
      errors.push(`${label} override ${key} is not one of ticket, margin, price, jobsPerMonth.`);
      continue;
    }
    if (value === null || value === "") continue; // cleared override
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      errors.push(`${label} override ${key} must be a positive number.`);
    } else if (key === "margin" && value > 1) {
      errors.push(`${label} override margin is a fraction from 0 to 1, for example 0.45 for 45%.`);
    }
  }
  return result(errors, []);
}

export function validateLead(lead, ctx = {}) {
  const errors = [];
  const warnings = [];
  const floors = [];
  const mode = ctx.mode ?? "manual";
  const t = thresholdsFrom(ctx);

  if (!isPlainObject(lead)) return result(["A lead must be an object."], [], { floors });
  const name = isBlank(lead.business) ? "This lead" : String(lead.business);

  if (!VALIDATION_MODES.includes(mode)) errors.push(`Validation mode ${JSON.stringify(mode)} is not one of ${VALIDATION_MODES.join(", ")}.`);

  for (const field of REQUIRED_LEAD_FIELDS) {
    if (field === "sources") {
      if (!Array.isArray(lead.sources)) errors.push(`${name} is missing required field sources (a list, empty only while unverified).`);
    } else if (isBlank(lead[field])) {
      errors.push(`${name} is missing required field ${field}.`);
    }
  }

  if (mode === "stored") {
    for (const field of ["id", "outreach", "demo", "addedAt", "origin", "verification"]) {
      if (isBlank(lead[field])) errors.push(`${name} is missing ${field}, which every stored lead carries.`);
    }
    if (typeof lead.runId !== "string") errors.push(`${name} runId must be text, "" for the sheet import.`);
  }

  // Types and ranges.
  for (const field of ["business", "category", "categoryKey", "city", "state", "websiteStatus", "whyKija", "pitchAngle", "demoConcept"]) {
    if (!isBlank(lead[field]) && typeof lead[field] !== "string") errors.push(`${name} ${field} must be text.`);
  }
  checkState(lead.state, name, errors);
  checkPhone(lead.phone, name, errors);
  if (!isBlank(lead.googleRating) || !isBlank(lead.googleReviews)) {
    checkRatingReviews(isBlank(lead.googleRating) ? undefined : lead.googleRating, isBlank(lead.googleReviews) ? undefined : lead.googleReviews, name, errors);
  }
  if (typeof lead.googleRating === "number" && Math.abs(Math.round(lead.googleRating * 10) - lead.googleRating * 10) > 1e-9) {
    warnings.push(`${name} googleRating ${lead.googleRating} has more than one decimal; Google shows one.`);
  }
  for (const field of ["websiteGap", "ticketValue", "visualFit"]) {
    if (!isBlank(lead[field])) checkScale(lead[field], field, name, errors);
  }
  if (!isBlank(lead.confidence) && !CONFIDENCE_LEVELS.includes(lead.confidence)) {
    errors.push(`${name} confidence ${JSON.stringify(lead.confidence)} is not one of: ${CONFIDENCE_LEVELS.join(", ")}.`);
  }

  if (!isBlank(lead.categoryKey) && ctx.categories && !Object.hasOwn(ctx.categories, lead.categoryKey)) {
    errors.push(`${name} category key ${JSON.stringify(lead.categoryKey)} is not in config/categories.json.`);
  }
  if (!isBlank(lead.metro) && ctx.geography?.metros && !ctx.geography.metros.some((m) => m.key === lead.metro)) {
    errors.push(`${name} metro ${JSON.stringify(lead.metro)} is not in config/geography.json; use "" for places outside every metro.`);
  }
  if (!isBlank(lead.googleMapsUrl) && !isHttpUrl(lead.googleMapsUrl)) {
    errors.push(`${name} googleMapsUrl must be a full http or https url.`);
  }
  if (lead.ratingSource === PLACES_RATING_SOURCE) {
    errors.push(`${name} ratingSource is places-api, which a stored lead may not carry. ${PLACES_RULE}`);
  } else if (lead.ratingSource !== undefined && !RATING_SOURCES.includes(lead.ratingSource)
    && !Object.hasOwn(LEGACY_RATING_SOURCES, lead.ratingSource)) {
    errors.push(`${name} ratingSource must be empty, google-maps-observed, secondary or owner.`);
  }
  if (lead.phoneLineType !== undefined && !PHONE_LINE_TYPES.includes(lead.phoneLineType)) {
    errors.push(`${name} phoneLineType must be one of: ${PHONE_LINE_TYPES.join(", ")}.`);
  }
  if (lead.placeId !== undefined && lead.placeId !== null && typeof lead.placeId !== "string") {
    errors.push(`${name} placeId must be text.`);
  }
  if (lead.established !== undefined && lead.established !== null) {
    const year = toDate(ctx.now)?.getUTCFullYear() ?? 2100;
    if (!Number.isInteger(lead.established) || lead.established < 1800 || lead.established > year) {
      errors.push(`${name} established must be null or a sourced four digit year.`);
    }
  }
  for (const field of ["services", "reviewThemes", "languages"]) {
    if (lead[field] !== undefined && (!Array.isArray(lead[field]) || lead[field].some((x) => typeof x !== "string"))) {
      errors.push(`${name} ${field} must be a list of text values.`);
    }
  }
  if (Array.isArray(lead.reviewThemes)) {
    lead.reviewThemes.forEach((theme, i) => {
      if (typeof theme === "string" && QUOTE_RE.test(theme)) {
        errors.push(`${name} review theme ${i + 1} looks like a quote. Themes are short paraphrases, never quotes.`);
      }
    });
    const count = lead.reviewThemes.length;
    if (count > 5) errors.push(`${name} has ${count} review themes; keep it to 2 to 5 short themes.`);
    else if (count === 1) warnings.push(`${name} has one review theme; 2 to 5 read better.`);
  }
  if (lead.presence !== undefined && !isPlainObject(lead.presence)) errors.push(`${name} presence must be an object.`);
  if (lead.demoCopy !== undefined && !isPlainObject(lead.demoCopy)) errors.push(`${name} demoCopy must be an object.`);
  if (lead.demo !== undefined) {
    if (!isPlainObject(lead.demo)) errors.push(`${name} demo must be an object.`);
    else if (typeof lead.demo.shareApproved !== "boolean") errors.push(`${name} demo.shareApproved must be true or false.`);
  }
  errors.push(...validateRoiOverrides(lead.roiOverrides, name).errors);
  if (lead.origin !== undefined && !LEAD_ORIGINS.includes(lead.origin)) {
    errors.push(`${name} origin must be one of: ${LEAD_ORIGINS.join(", ")}.`);
  }
  if (lead.addedAt !== undefined && !isIsoDate(lead.addedAt)) errors.push(`${name} addedAt must be a date like 2026-09-28.`);
  if (lead.id !== undefined && (typeof lead.id !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(lead.id))) {
    errors.push(`${name} id must be lowercase letters, digits and hyphens.`);
  }
  if (lead.outreach !== undefined) checkOutreach(lead.outreach, name, errors);

  // Sources and verification.
  checkSources(lead.sources, name, errors);
  const verification = lead.verification;
  const checks = Array.isArray(verification?.checks) ? verification.checks : [];
  if (verification !== undefined) {
    if (!isPlainObject(verification)) {
      errors.push(`${name} verification must be an object.`);
    } else {
      if (!VERIFICATION_STATUSES.includes(verification.status)) {
        errors.push(`${name} verification status must be verified, needs-recheck or unverified.`);
      }
      if (!isBlank(verification.checkedAt) && !isIsoDate(verification.checkedAt)) {
        errors.push(`${name} verification checkedAt must be a date like 2026-09-28.`);
      }
      if (verification.checks !== undefined && !Array.isArray(verification.checks)) {
        errors.push(`${name} verification checks must be a list.`);
      }
      checks.forEach((c, i) => {
        if (!isPlainObject(c) || isBlank(c.check) || isBlank(c.result)) {
          errors.push(`${name} verification check ${i + 1} needs a check and a result.`);
        } else if (!isBlank(c.url) && !isHttpUrl(c.url)) {
          errors.push(`${name} verification check ${i + 1} url must be a full http or https url.`);
        }
      });
    }
  }
  const sourceCount = Array.isArray(lead.sources) ? lead.sources.length : 0;
  if (Array.isArray(lead.sources) && sourceCount === 0) {
    if (mode === "weekly") errors.push(`${name} has no sources. A weekly lead needs at least one source url.`);
    else if (verification?.status === "verified") errors.push(`${name} is marked verified but has no sources.`);
    else warnings.push(`${name} has no sources yet; add one before contact.`);
  }
  if (mode === "weekly") {
    if (checks.length < 3) {
      errors.push(`${name} has ${checks.length} verification check${checks.length === 1 ? "" : "s"}. A weekly lead needs at least 3.`);
    }
    if (verification?.status !== "verified") {
      warnings.push(`${name} verification status is ${verification?.status ?? "missing"}, not verified.`);
    }
  }

  // Places: only the place ID is kept, refreshed after 12 months. placesFetchedAt is retired:
  // it is accepted on read and dropped on the next save.
  if (!isBlank(lead.placeIdCheckedAt)) {
    const checked = toDate(lead.placeIdCheckedAt);
    const now = toDate(ctx.now);
    if (!checked || !isIsoDate(String(lead.placeIdCheckedAt).slice(0, 10))) {
      errors.push(`${name} placeIdCheckedAt must be a date like 2026-09-28.`);
    } else if (now && !isBlank(lead.placeId) && (now.getTime() - checked.getTime()) / 86400000 > PLACE_ID_MAX_AGE_DAYS) {
      warnings.push(`${name} place ID was last checked ${lead.placeIdCheckedAt}, over 12 months ago. Refresh it with an IDs only Place Details call.`);
    }
  } else if (!isBlank(lead.placeId) && mode === "stored") {
    warnings.push(`${name} has a place ID with no placeIdCheckedAt; record when it was last confirmed.`);
  }
  if (!isBlank(lead.placesFetchedAt) && mode === "stored") {
    warnings.push(`${name} still carries the retired placesFetchedAt; it is dropped on the next save.`);
  }

  // Chains and dashes.
  if (!isBlank(lead.business) && ctx.chains) {
    const c = isChain(lead.business, ctx.chains);
    if (c.chain) errors.push(`${name} matches the chain or franchise "${c.match}" in config/chains.json. Kija pitches independents only.`);
  }
  errors.push(...dashErrors(lead, name));

  // Threshold floors. In stored mode they are warnings (see VALIDATION_MODES).
  const floorHits = [];
  if (typeof lead.googleRating === "number" && lead.googleRating < t.minRating) {
    floorHits.push(`Rating ${lead.googleRating.toFixed(1)} is below the ${t.minRating} floor.`);
  }
  if (Number.isInteger(lead.googleReviews) && lead.googleReviews < t.minReviews) {
    floorHits.push(`${lead.googleReviews} reviews is below the ${t.minReviews} review floor.`);
  }
  if (Number.isInteger(lead.websiteGap) && lead.websiteGap < t.minWebsiteGap) {
    floorHits.push(`Website gap ${lead.websiteGap} is below the minimum of ${t.minWebsiteGap}.`);
  }
  if (mode === "stored") {
    warnings.push(...floorHits.map((f) => `${name}: ${f}`));
  } else {
    floors.push(...floorHits);
    errors.push(...floorHits);
  }

  // Preferred standards and soft signals.
  if (typeof lead.googleRating === "number" && lead.googleRating >= t.minRating && lead.googleRating < t.preferredRating) {
    warnings.push(`${name} rating ${lead.googleRating.toFixed(1)} is below the preferred ${t.preferredRating}.`);
  }
  if (Number.isInteger(lead.googleReviews) && lead.googleReviews >= t.minReviews && lead.googleReviews < t.preferredReviews) {
    warnings.push(`${name} has ${lead.googleReviews} reviews, below the preferred ${t.preferredReviews}.`);
  }
  if (lead.confidence === "Medium" || lead.confidence === "Low") {
    warnings.push(`${name} confidence is ${lead.confidence}; recheck before building or contacting.`);
  }
  if (lead.ratingSource === "secondary") {
    warnings.push(`${name} rating comes from a secondary mirror; confirm it on Google Maps before contact.`);
  }

  return result(errors, warnings, { floors });
}

export function validateQueueItem(item, ctx = {}) {
  const errors = [];
  const warnings = [];
  const mode = ctx.mode ?? "manual";
  if (!isPlainObject(item)) return result(["A queue item must be an object."], []);
  const name = isBlank(item.candidate) ? "This queue item" : String(item.candidate);

  for (const field of ["candidate", "city", "state"]) {
    if (isBlank(item[field])) errors.push(`${name} is missing required field ${field}.`);
  }
  if (mode === "stored") {
    for (const field of ["id", "addedAt", "updatedAt"]) {
      if (isBlank(item[field])) errors.push(`${name} is missing required field ${field}.`);
    }
    for (const field of ["addedAt", "updatedAt"]) {
      if (!isBlank(item[field]) && !isIsoDate(item[field])) errors.push(`${name} ${field} must be a date like 2026-09-28.`);
    }
    if (typeof item.runId !== "string") errors.push(`${name} runId must be text, "" for the sheet import.`);
  }
  if (item.decision !== undefined && !QUEUE_DECISIONS.includes(item.decision)) {
    errors.push(`${name} decision must be Research, Promote or Drop.`);
  }
  checkState(item.state, name, errors);
  checkPhone(item.phone, name, errors);
  checkRatingReviews(item.googleRating, item.googleReviews, name, errors, { allowNull: true });
  if (!isBlank(item.categoryKey) && ctx.categories && !Object.hasOwn(ctx.categories, item.categoryKey)) {
    errors.push(`${name} category key ${JSON.stringify(item.categoryKey)} is not in config/categories.json.`);
  }
  if (item.sources !== undefined && !Array.isArray(item.sources)) errors.push(`${name} sources must be a list.`);
  checkSources(item.sources, name, errors);
  if (item.lead !== undefined && item.lead !== null && !isPlainObject(item.lead)) {
    errors.push(`${name} lead must be null or an object with the carried lead fields.`);
  }
  if (item.ratingSource === PLACES_RATING_SOURCE || item.lead?.ratingSource === PLACES_RATING_SOURCE) {
    errors.push(`${name} carries a places-api rating, which may not be stored. ${PLACES_RULE}`);
  }
  if (!isBlank(item.candidate) && ctx.chains) {
    const c = isChain(item.candidate, ctx.chains);
    if (c.chain) errors.push(`${name} matches the chain or franchise "${c.match}" in config/chains.json. Kija pitches independents only.`);
  }
  if (!Array.isArray(item.sources) || item.sources.length === 0) warnings.push(`${name} has no sources yet.`);
  errors.push(...dashErrors(item, name));
  return result(errors, warnings);
}

export function validateRejection(rejection, ctx = {}) {
  const errors = [];
  const mode = ctx.mode ?? "manual";
  if (!isPlainObject(rejection)) return result(["A rejection must be an object."], []);
  const name = isBlank(rejection.business) ? "This rejection" : String(rejection.business);
  for (const field of ["business", "reason"]) {
    if (isBlank(rejection[field])) errors.push(`${name} is missing required field ${field}.`);
  }
  if (mode === "stored") {
    if (isBlank(rejection.key)) errors.push(`${name} is missing its dedupe key.`);
    if (!isBlank(rejection.rejectedAt) && !isIsoDate(String(rejection.rejectedAt).slice(0, 10))) {
      errors.push(`${name} rejectedAt must be a date.`);
    }
  }
  checkState(rejection.state, name, errors);
  checkPhone(rejection.phone, name, errors);
  if (!isBlank(rejection.evidenceUrl) && !isHttpUrl(rejection.evidenceUrl)) {
    errors.push(`${name} evidenceUrl must be a full http or https url.`);
  }
  errors.push(...dashErrors(rejection, name));
  return result(errors, []);
}

// Structure of a weekly batch file. Each lead, queue item and rejection is validated
// on its own during ingest, so one bad record does not sink the batch.
export function validateBatch(batch) {
  const errors = [];
  const warnings = [];
  if (!isPlainObject(batch)) return result(["A batch must be a JSON object."], []);
  if (!isIsoDate(batch.runId)) errors.push("The batch runId must be a date like 2026-09-28 (the Monday of the run week).");
  const mode = batch.mode ?? "weekly";
  if (!BATCH_MODES.includes(mode)) errors.push(`The batch mode must be weekly, reverify or manual; it is ${JSON.stringify(batch.mode)}.`);
  if (mode === "weekly" && isIsoDate(batch.runId) && new Date(`${batch.runId}T00:00:00Z`).getUTCDay() !== 1) {
    warnings.push(`The weekly runId ${batch.runId} is not a Monday.`);
  }
  for (const field of ["leads", "queue", "rejected", "reverify", "searched"]) {
    if (batch[field] !== undefined && !Array.isArray(batch[field])) errors.push(`The batch ${field} must be a list.`);
  }
  if (batch.plan !== undefined && batch.plan !== null && !isPlainObject(batch.plan)) errors.push("The batch plan must be an object.");
  if (batch.notes !== undefined && typeof batch.notes !== "string") errors.push("The batch notes must be text.");
  if (Array.isArray(batch.reverify)) {
    batch.reverify.forEach((r, i) => {
      const n = i + 1;
      if (!isPlainObject(r) || isBlank(r.id)) {
        errors.push(`Reverify entry ${n} needs the id of an existing lead.`);
        return;
      }
      const decision = r.decision ?? "keep";
      if (!REVERIFY_DECISIONS.includes(decision)) errors.push(`Reverify entry ${n} (${r.id}) decision must be keep or reject.`);
      if (decision === "reject" && isBlank(r.reason)) errors.push(`Reverify entry ${n} (${r.id}) rejects the lead but gives no reason.`);
    });
  }
  // Records get their own dash checks in ingest; these parts land in the run report as is.
  errors.push(...dashErrors({ plan: batch.plan, searched: batch.searched, notes: batch.notes }, "Batch"));
  const total = ["leads", "queue", "rejected", "reverify"].reduce((n, f) => n + (Array.isArray(batch[f]) ? batch[f].length : 0), 0);
  if (total === 0) warnings.push("The batch has no leads, queue items, rejections or reverify entries.");
  if (mode === "weekly" && (!Array.isArray(batch.searched) || batch.searched.length === 0)) {
    warnings.push("The batch lists no searches, so the run report cannot show what was covered.");
  }
  return result(errors, warnings);
}

export function validateSettings(settings) {
  const errors = [];
  const warnings = [];
  if (!isPlainObject(settings)) return result(["Settings must be an object."], []);
  const posInt = (v) => Number.isInteger(v) && v > 0;
  if (!posInt(settings.weeklyQuota)) errors.push("Weekly quota must be a whole number above 0.");
  if (!posInt(settings.categoriesPerWeek)) errors.push("Categories per week must be a whole number above 0.");
  const t = settings.thresholds;
  if (!isPlainObject(t)) {
    errors.push("Settings need a thresholds object.");
  } else {
    for (const f of ["minRating", "preferredRating"]) {
      if (typeof t[f] !== "number" || t[f] < 0 || t[f] > 5) errors.push(`Threshold ${f} must be a number from 0 to 5.`);
    }
    for (const f of ["minReviews", "preferredReviews", "strongReviews"]) {
      if (!Number.isInteger(t[f]) || t[f] < 0) errors.push(`Threshold ${f} must be a whole number of 0 or more.`);
    }
    if (!Number.isInteger(t.minWebsiteGap) || t.minWebsiteGap < 1 || t.minWebsiteGap > 3) {
      errors.push("Threshold minWebsiteGap must be 1, 2 or 3.");
    }
    if (t.preferredRating < t.minRating) errors.push("The preferred rating cannot be below the minimum rating.");
    if (t.preferredReviews < t.minReviews) errors.push("Preferred reviews cannot be below minimum reviews.");
  }
  const g = settings.geography;
  if (!isPlainObject(g)) {
    errors.push("Settings need a geography object.");
  } else {
    if (!["nationwide-rotation", "home-only"].includes(g.mode)) errors.push("Geography mode must be nationwide-rotation or home-only.");
    if (!posInt(g.metrosPerWeek)) errors.push("Metros per week must be a whole number above 0.");
    if (isBlank(g.homeMetro)) errors.push("Geography needs a home metro key.");
    if (typeof g.homeEveryWeek !== "boolean") errors.push("homeEveryWeek must be true or false.");
    if (!Number.isInteger(g.homeMaxLeads) || g.homeMaxLeads < 0) errors.push("homeMaxLeads must be a whole number of 0 or more.");
    if (!isIsoDate(g.rotationStart)) errors.push("rotationStart must be a date like 2026-09-28.");
  }
  const o = settings.offer;
  if (!isPlainObject(o)) {
    errors.push("Settings need an offer object.");
  } else {
    if (isBlank(o.name)) errors.push("The offer needs a name.");
    if (typeof o.price !== "number" || !Number.isFinite(o.price) || o.price <= 0) errors.push("The offer price must be a number above 0.");
    if (typeof o.priceConfirmed !== "boolean") errors.push("priceConfirmed must be true or false.");
    if (!posInt(o.timelineDays)) errors.push("The offer timeline must be a whole number of days above 0.");
    if (!Array.isArray(o.includes) || o.includes.some((x) => typeof x !== "string")) errors.push("The offer includes must be a list of text.");
    if (o.priceConfirmed === false) warnings.push("The offer price is a placeholder until it is confirmed.");
  }
  const c = settings.contact;
  if (!isPlainObject(c)) {
    errors.push("Settings need a contact object.");
  } else {
    if (!isBlank(c.site) && !isHttpUrl(c.site)) errors.push("The contact site must be a full http or https url.");
    if (c.address !== undefined && typeof c.address !== "string") errors.push("The contact address must be text.");
    if (!isBlank(c.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c.email).trim())) errors.push("The contact email must be an email address.");
    if (isBlank(c.address)) warnings.push("The contact mailing address is empty, so email drafts are not ready to send.");
  }
  errors.push(...validateCompliance(settings.compliance).errors);
  if (settings.compliance === undefined) warnings.push("Settings have no compliance block, so the safe defaults apply.");
  else if (settings.compliance?.texasRegistration === "unknown") {
    warnings.push("Texas phone solicitation status is unconfirmed; calls show a chapter 302 reminder until it is resolved.");
  }
  errors.push(...dashErrors(settings, "Settings"));
  return result(errors, warnings);
}

// settings.compliance. Absent is allowed (the defaults in compliance.js apply); present must be whole.
export function validateCompliance(compliance) {
  const errors = [];
  if (compliance === undefined) return result(errors, []);
  if (!isPlainObject(compliance)) return result(["Compliance settings must be an object."], []);
  const c = compliance;
  if (!TEXAS_REGISTRATION_STATUSES.includes(c.texasRegistration)) {
    errors.push(`texasRegistration must be one of: ${TEXAS_REGISTRATION_STATUSES.join(", ")}.`);
  }
  const w = c.callWindow;
  if (!isPlainObject(w)) {
    errors.push("Compliance needs a callWindow object with startHour, endHour and days.");
  } else {
    const hour = (v) => Number.isInteger(v) && v >= 0 && v <= 24;
    if (!hour(w.startHour) || !hour(w.endHour)) errors.push("The call window hours must be whole numbers from 0 to 24.");
    else if (w.startHour >= w.endHour) errors.push("The call window must start before it ends.");
    if (!Array.isArray(w.days) || w.days.length === 0 || w.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)
      || new Set(w.days).size !== w.days.length) {
      errors.push("The call window days must be a list of distinct weekdays from 0 (Sunday) to 6 (Saturday).");
    }
  }
  for (const f of ["maxCallsPerDay", "maxCallsTotal"]) {
    if (!Number.isInteger(c[f]) || c[f] < 0) errors.push(`${f} must be a whole number of 0 or more.`);
  }
  if (Number.isInteger(c.maxCallsPerDay) && Number.isInteger(c.maxCallsTotal) && c.maxCallsPerDay > c.maxCallsTotal) {
    errors.push("maxCallsPerDay cannot be above maxCallsTotal.");
  }
  if (typeof c.noColdTexts !== "boolean") errors.push("noColdTexts must be true or false.");
  if (!Array.isArray(c.noTextStates) || c.noTextStates.some((s) => !US_STATES.includes(s))) {
    errors.push("noTextStates must be a list of USPS codes such as WA.");
  }
  return result(errors, []);
}

// data/suppression.json: businesses that are never contacted or ingested again.
export function validateSuppression(list) {
  const errors = [];
  if (!Array.isArray(list)) return result(["The suppression list must be a list."], []);
  const keys = new Set();
  list.forEach((s, i) => {
    const label = `Suppression entry ${i + 1}${s?.business ? ` (${s.business})` : ""}`;
    if (!isPlainObject(s)) {
      errors.push(`${label} must be an object.`);
      return;
    }
    if (isBlank(s.key)) errors.push(`${label} needs its dedupe key.`);
    else if (keys.has(s.key)) errors.push(`${label} repeats the key ${s.key}.`);
    keys.add(s.key);
    if (isBlank(s.business)) errors.push(`${label} needs the business name.`);
    if (isBlank(s.reason)) errors.push(`${label} needs a reason.`);
    if (isBlank(s.by)) errors.push(`${label} needs a by value saying who added it.`);
    if (!isIsoDate(String(s.addedAt ?? "").slice(0, 10))) errors.push(`${label} addedAt must be a date or timestamp.`);
    checkState(s.state, label, errors);
    if (!isBlank(s.phone) && !normalizePhone(s.phone)) errors.push(`${label} phone is not a valid US number.`);
  });
  errors.push(...dashErrors(list, "Suppression"));
  return result(errors, []);
}

export function validateCategories(categories) {
  const errors = [];
  if (!isPlainObject(categories)) return result(["Categories must be an object keyed by category key."], []);
  for (const [key, c] of Object.entries(categories)) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key)) errors.push(`Category key ${JSON.stringify(key)} must be lowercase and hyphenated.`);
    if (!isPlainObject(c)) {
      errors.push(`Category ${key} must be an object.`);
      continue;
    }
    if (isBlank(c.label)) errors.push(`Category ${key} needs a label.`);
    if (!VERTICALS.includes(c.vertical)) errors.push(`Category ${key} vertical must be one of: ${VERTICALS.join(", ")}.`);
    for (const f of ["ticketValueDefault", "visualFitDefault"]) checkScale(c[f], f, `Category ${key}`, errors);
    for (const f of ["searchTerms", "placesTypes", "serviceDefaults"]) {
      if (!Array.isArray(c[f])) errors.push(`Category ${key} ${f} must be a list.`);
    }
    // Places includedType takes exactly one Table A type; [] means text query only.
    if (Array.isArray(c.placesTypes) && c.placesTypes.some((t) => typeof t !== "string" || !/^[a-z]+(_[a-z]+)*$/.test(t))) {
      errors.push(`Category ${key} placesTypes must be Table A type names such as car_repair.`);
    }
    if (c.placesTypesReviewed !== undefined && typeof c.placesTypesReviewed !== "boolean") {
      errors.push(`Category ${key} placesTypesReviewed must be true or false.`);
    }
    if (typeof c.focusNote !== "string") errors.push(`Category ${key} focusNote must be text.`);
  }
  if (!Object.hasOwn(categories, "general")) errors.push("Categories must include the general fallback.");
  errors.push(...dashErrors(categories, "Categories"));
  return result(errors, []);
}

export function validateGeography(geography) {
  const errors = [];
  if (!isPlainObject(geography) || !Array.isArray(geography.metros)) return result(["Geography must be an object with a metros list."], []);
  const keys = new Set();
  geography.metros.forEach((m, i) => {
    const label = `Metro ${i + 1}${m?.key ? ` (${m.key})` : ""}`;
    if (!isPlainObject(m)) {
      errors.push(`${label} must be an object.`);
      return;
    }
    if (isBlank(m.key)) errors.push(`${label} needs a key.`);
    else if (keys.has(m.key)) errors.push(`${label} key is used twice.`);
    keys.add(m.key);
    if (isBlank(m.name)) errors.push(`${label} needs a name.`);
    if (!Array.isArray(m.states) || m.states.length === 0 || m.states.some((s) => !US_STATES.includes(s))) {
      errors.push(`${label} states must be a list of USPS codes.`);
    }
    if (!Array.isArray(m.anchorCities) || m.anchorCities.length === 0) errors.push(`${label} needs anchor cities.`);
    if (isBlank(m.region)) errors.push(`${label} needs a region.`);
  });
  errors.push(...dashErrors(geography, "Geography"));
  return result(errors, []);
}

export function validateChains(chains) {
  const errors = [];
  const warnings = [];
  if (!isPlainObject(chains) || !Array.isArray(chains.names)) return result(["Chains must be an object with a names list."], []);
  if (chains.names.some((n) => typeof n !== "string" || !n.trim())) errors.push("Every chain name must be non-empty text.");
  if (chains.names.length < 120) warnings.push(`The chain list has ${chains.names.length} names; the spec asks for at least 120.`);
  errors.push(...dashErrors(chains, "Chains"));
  return result(errors, warnings);
}

export function validateBenchmarks(benchmarks, ctx = {}) {
  const errors = [];
  const warnings = [];
  if (!isPlainObject(benchmarks)) return result(["Benchmarks must be an object."], []);
  if (!isPlainObject(benchmarks.categories)) errors.push("Benchmarks need a categories object.");
  if (benchmarks.consumerStats !== undefined && !Array.isArray(benchmarks.consumerStats)) errors.push("consumerStats must be a list.");
  const priorities = new Map();
  (Array.isArray(benchmarks.consumerStats) ? benchmarks.consumerStats : []).forEach((s, i) => {
    const label = `Consumer stat ${i + 1}${s?.id ? ` (${s.id})` : ""}`;
    if (s?.verified && !isHttpUrl(s.url)) errors.push(`${label} is marked verified but has no source url.`);
    // Optional: 1 is the most persuasive stat and leads the pitch.
    if (s?.pitchPriority !== undefined && s?.pitchPriority !== null) {
      if (!Number.isInteger(s.pitchPriority) || s.pitchPriority < 1) {
        errors.push(`${label} pitchPriority must be a whole number of 1 or more.`);
      } else if (priorities.has(s.pitchPriority)) {
        errors.push(`${label} pitchPriority ${s.pitchPriority} is also used by ${priorities.get(s.pitchPriority)}.`);
      } else {
        priorities.set(s.pitchPriority, s.id ?? `stat ${i + 1}`);
        if (!(s.verified && s.useInPitch)) warnings.push(`${label} has a pitchPriority but is not verified for pitch use, so it is never shown.`);
      }
    }
  });
  let unsourced = 0;
  for (const [key, b] of Object.entries(benchmarks.categories ?? {})) {
    if (ctx.categories && !Object.hasOwn(ctx.categories, key)) warnings.push(`Benchmark category ${key} is not in config/categories.json.`);
    const ticket = b?.ticket;
    if (!isPlainObject(ticket) || typeof ticket.typical !== "number" || ticket.typical <= 0) {
      errors.push(`Benchmark ${key} needs ticket.typical as a positive number.`);
    } else if (!Array.isArray(ticket.sources) || ticket.sources.length === 0) {
      unsourced += 1;
    }
    const margin = b?.grossMargin?.typical;
    if (margin !== undefined && margin !== null && (typeof margin !== "number" || margin <= 0 || margin > 1)) {
      errors.push(`Benchmark ${key} grossMargin.typical must be a fraction from 0 to 1.`);
    }
    const rented = b?.rentedLead;
    if (rented !== undefined && rented !== null) {
      if (!isPlainObject(rented)) errors.push(`Benchmark ${key} rentedLead must be null or an object with low, high and platform.`);
      else {
        const num = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
        if (!num(rented.low) || !num(rented.high)) errors.push(`Benchmark ${key} rentedLead low and high must be numbers of 0 or more.`);
        else if (rented.low > rented.high) errors.push(`Benchmark ${key} rentedLead low is above high.`);
        if (rented.sources !== undefined && !Array.isArray(rented.sources)) errors.push(`Benchmark ${key} rentedLead sources must be a list.`);
      }
    }
    // Optional cost per paying customer, for the "customers rented through" comparison.
    const customer = b?.rentedCustomer;
    if (customer !== undefined && customer !== null) {
      if (!isPlainObject(customer)) {
        errors.push(`Benchmark ${key} rentedCustomer must be null or an object with typical, platform and sources.`);
      } else {
        if (typeof customer.typical !== "number" || !Number.isFinite(customer.typical) || customer.typical <= 0) {
          errors.push(`Benchmark ${key} rentedCustomer.typical must be a positive number of dollars per paying customer.`);
        }
        if (isBlank(customer.platform) || typeof customer.platform !== "string") errors.push(`Benchmark ${key} rentedCustomer needs a platform.`);
        if (!Array.isArray(customer.sources)) {
          errors.push(`Benchmark ${key} rentedCustomer sources must be a list.`);
        } else if (customer.sources.length === 0) {
          warnings.push(`Benchmark ${key} rentedCustomer has no sources and will show as not researched.`);
        } else {
          customer.sources.forEach((s, i) => {
            if (!isPlainObject(s) || !isHttpUrl(s.url)) errors.push(`Benchmark ${key} rentedCustomer source ${i + 1} needs a full http or https url.`);
          });
        }
      }
    }
  }
  if (ctx.categories) {
    for (const key of Object.keys(ctx.categories)) {
      if (!Object.hasOwn(benchmarks.categories ?? {}, key)) warnings.push(`Benchmarks have no entry for category ${key}.`);
    }
  }
  if (unsourced > 0) warnings.push(`${unsourced} benchmark ticket value${unsourced === 1 ? " has" : "s have"} no sources and will show as not researched.`);
  errors.push(...dashErrors(benchmarks, "Benchmarks"));
  return result(errors, warnings);
}

// Team notes (data/notes.json). Text is normalized before this runs (notes.js), so a dash
// here means the caller skipped cleanNoteText.
export const NOTE_AUTHORS = OWNERS;
export const NOTE_MAX_LENGTH = 4000;
export const NOTE_FIELDS = ["id", "text", "author", "leadId", "runId", "createdAt", "updatedAt"];

// ctx.leads, when given, is the pipeline a leadId must point into.
export function validateNote(note, ctx = {}) {
  const errors = [];
  if (!isPlainObject(note)) return result(["A note must be an object with text, author and leadId."], []);
  if (typeof note.text !== "string") errors.push("The note text must be text.");
  else {
    const text = note.text.trim();
    if (!text) errors.push("Write something before saving the note.");
    else if (text.length > NOTE_MAX_LENGTH) {
      errors.push(`Keep a note to ${NOTE_MAX_LENGTH.toLocaleString("en-US")} characters; this one has ${text.length.toLocaleString("en-US")}.`);
    }
  }
  if (!NOTE_AUTHORS.includes(note.author)) {
    errors.push(`Author ${JSON.stringify(note.author)} must be empty or one of ${NOTE_AUTHORS.filter(Boolean).join(", ")}.`);
  }
  if (typeof note.leadId !== "string") errors.push("The lead a note is about must be a lead id, or empty.");
  else if (note.leadId && Array.isArray(ctx.leads) && !ctx.leads.some((l) => l?.id === note.leadId)) {
    errors.push(`No lead has the id "${note.leadId}", so the note cannot be about it.`);
  }
  if (note.runId !== undefined && typeof note.runId !== "string") errors.push("The run id on a note must be text.");
  if (note.id !== undefined && (typeof note.id !== "string" || !note.id.trim())) errors.push("A note id must be non-empty text.");
  for (const f of ["createdAt", "updatedAt"]) {
    if (note[f] !== undefined && !isIsoTimestamp(note[f])) errors.push(`The note ${f} must be an ISO timestamp.`);
  }
  const extra = Object.keys(note).filter((k) => !NOTE_FIELDS.includes(k));
  if (extra.length) errors.push(`A note has ${NOTE_FIELDS.join(", ")} only; ${extra.join(", ")} is not a note field.`);
  errors.push(...dashErrors(note, "Note"));
  return result(errors, []);
}

// Every stored note, plus unique ids. Notes about a lead that was later removed only warn.
export function validateNotes(list, ctx = {}) {
  if (!Array.isArray(list)) return result(["data/notes.json must be a list of notes."], []);
  const errors = [];
  const warnings = [];
  const ids = new Set();
  list.forEach((note, i) => {
    const v = validateNote(note, {});
    errors.push(...v.errors.map((e) => `Note ${i + 1}: ${e}`));
    if (isPlainObject(note)) {
      if (!note.id) errors.push(`Note ${i + 1} has no id.`);
      else if (ids.has(note.id)) errors.push(`The note id ${note.id} is used more than once.`);
      else ids.add(note.id);
      if (note.leadId && Array.isArray(ctx.leads) && !ctx.leads.some((l) => l?.id === note.leadId)) {
        warnings.push(`Note ${note.id || i + 1} is about "${note.leadId}", which is no longer in the pipeline.`);
      }
    }
  });
  return result(errors, warnings);
}
