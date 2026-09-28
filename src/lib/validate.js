// Validators. A rule violation is a return value { ok, errors, warnings }, never an exception.
// Every message is a sentence a person can read. Pure: time comes in through ctx.now.

import { DEFAULT_THRESHOLDS } from "./score.js";
import { isChain, normalizePhone } from "./normalize.js";

export const OUTREACH_STATUSES = ["New", "Research", "Demo Built", "Contacted", "Replied", "Meeting", "Won", "Lost", "Not a fit"];
export const HISTORY_TYPES = ["created", "status", "note", "call", "email", "meeting", "research", "demo"];
export const CONFIDENCE_LEVELS = ["High", "Medium-High", "Medium", "Low"];
export const VERIFICATION_STATUSES = ["verified", "needs-recheck", "unverified"];
export const LEAD_ORIGINS = ["sheet-import", "weekly-run", "manual", "queue-promotion"];
export const OWNERS = ["", "Jamey", "Kiel", "Daisy"];
export const RATING_SOURCES = ["", "google-maps", "places-api", "secondary"];
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
const PLACES_MAX_AGE_DAYS = 30;

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
  if (isBlank(entry.by)) errors.push("A history entry needs a by value saying who wrote it.");
  errors.push(...dashErrors(entry, "History entry"));
  return result(errors, []);
}

// Validate an outreach patch (server PATCH /api/leads/:id). Only fields present are checked.
export function validateOutreachPatch(patch) {
  const errors = [];
  if (!isPlainObject(patch)) return result(["Outreach changes must be an object."], []);
  if (patch.status !== undefined && !OUTREACH_STATUSES.includes(patch.status)) {
    errors.push(`Status ${JSON.stringify(patch.status)} is not one of: ${OUTREACH_STATUSES.join(", ")}.`);
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
  if (lead.ratingSource !== undefined && !RATING_SOURCES.includes(lead.ratingSource)) {
    errors.push(`${name} ratingSource must be empty, google-maps, places-api or secondary.`);
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

  // Places data may only be cached for 30 days.
  if (!isBlank(lead.placesFetchedAt)) {
    const fetched = toDate(lead.placesFetchedAt);
    const now = toDate(ctx.now);
    if (!fetched) {
      errors.push(`${name} placesFetchedAt must be an ISO date.`);
    } else if (now && (now.getTime() - fetched.getTime()) / 86400000 > PLACES_MAX_AGE_DAYS) {
      errors.push(`${name} has Places data from ${lead.placesFetchedAt}, older than ${PLACES_MAX_AGE_DAYS} days. Refresh it or clear placesFetchedAt and the Places derived fields.`);
    }
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
  if (!isPlainObject(c)) errors.push("Settings need a contact object.");
  else if (!isBlank(c.site) && !isHttpUrl(c.site)) errors.push("The contact site must be a full http or https url.");
  errors.push(...dashErrors(settings, "Settings"));
  return result(errors, warnings);
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
  (benchmarks.consumerStats ?? []).forEach((s, i) => {
    if (s?.verified && !isHttpUrl(s.url)) errors.push(`Consumer stat ${i + 1} is marked verified but has no source url.`);
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
