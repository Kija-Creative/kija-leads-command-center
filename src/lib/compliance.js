// Outreach guardrails: call windows and limits, the no cold texts rule, email readiness and
// suppression. Pure: now and every record come in as arguments; nothing here reads the clock.
// Research and sources: research/compliance.md. Not legal advice.

import { dedupeKey, nameStateKey, phoneDigits } from "./normalize.js";

// USPS code to IANA zone. Split states use the zone that covers most of the population:
// TX, KS, NE, ND, SD Central; FL, IN, KY, MI Eastern; TN Central; ID Mountain (Boise);
// OR Pacific. Arizona stays on standard time all year.
export const STATE_TIMEZONES = {
  AL: "America/Chicago",
  AK: "America/Anchorage",
  AZ: "America/Phoenix",
  AR: "America/Chicago",
  CA: "America/Los_Angeles",
  CO: "America/Denver",
  CT: "America/New_York",
  DE: "America/New_York",
  DC: "America/New_York",
  FL: "America/New_York",
  GA: "America/New_York",
  HI: "Pacific/Honolulu",
  ID: "America/Boise",
  IL: "America/Chicago",
  IN: "America/Indiana/Indianapolis",
  IA: "America/Chicago",
  KS: "America/Chicago",
  KY: "America/New_York",
  LA: "America/Chicago",
  ME: "America/New_York",
  MD: "America/New_York",
  MA: "America/New_York",
  MI: "America/Detroit",
  MN: "America/Chicago",
  MS: "America/Chicago",
  MO: "America/Chicago",
  MT: "America/Denver",
  NE: "America/Chicago",
  NV: "America/Los_Angeles",
  NH: "America/New_York",
  NJ: "America/New_York",
  NM: "America/Denver",
  NY: "America/New_York",
  NC: "America/New_York",
  ND: "America/Chicago",
  OH: "America/New_York",
  OK: "America/Chicago",
  OR: "America/Los_Angeles",
  PA: "America/New_York",
  RI: "America/New_York",
  SC: "America/New_York",
  SD: "America/Chicago",
  TN: "America/Chicago",
  TX: "America/Chicago",
  UT: "America/Denver",
  VT: "America/New_York",
  VA: "America/New_York",
  WA: "America/Los_Angeles",
  WV: "America/New_York",
  WI: "America/Chicago",
  WY: "America/Denver",
  PR: "America/Puerto_Rico",
};

const ZONE_NAMES = {
  "America/New_York": "Eastern",
  "America/Detroit": "Eastern",
  "America/Indiana/Indianapolis": "Eastern",
  "America/Chicago": "Central",
  "America/Denver": "Mountain",
  "America/Boise": "Mountain",
  "America/Phoenix": "Mountain",
  "America/Los_Angeles": "Pacific",
  "America/Anchorage": "Alaska",
  "Pacific/Honolulu": "Hawaii",
  "America/Puerto_Rico": "Atlantic",
};

// Area codes for states in noTextStates, so a Washington cell listed under an Oregon address
// is still caught (research/compliance.md T2: "a Washington area code or Washington address").
export const STATE_AREA_CODES = {
  WA: ["206", "253", "360", "425", "509", "564"],
};

export const DEFAULT_COMPLIANCE = {
  texasRegistration: "unknown",
  callWindow: { startHour: 9, endHour: 20, days: [1, 2, 3, 4, 5, 6] },
  maxCallsPerDay: 1,
  maxCallsTotal: 3,
  noColdTexts: true,
  noTextStates: ["WA"],
};

export const TEXAS_REGISTRATION_STATUSES = ["unknown", "registered", "exempt-confirmed"];
export const PHONE_LINE_TYPES = ["unknown", "landline", "mobile", "voip"];
// A suppressed lead may only sit at one of these; every other status is active outreach.
export const INACTIVE_OUTREACH_STATUSES = ["Won", "Lost", "Not a fit"];

export const TEXAS_UNCONFIRMED = "Texas phone solicitation status is unconfirmed. Check chapter 302 with an attorney before phone outreach.";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TEXT_CONSENT_RE = /\b(text|texts|texting|texted|sms)\b/i;
const formatters = new Map();

function formatterFor(timeZone) {
  if (!formatters.has(timeZone)) {
    formatters.set(timeZone, new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }));
  }
  return formatters.get(timeZone);
}

function toDate(now) {
  const d = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(d.getTime())) throw new TypeError(`A valid now is required; got ${JSON.stringify(now)}.`);
  return d;
}

function partsIn(timeZone, date) {
  const parts = {};
  for (const p of formatterFor(timeZone).formatToParts(date)) parts[p.type] = p.value;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    weekday: WEEKDAYS.indexOf(parts.weekday),
  };
}

function clock12(hour, minute) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

function hourWords(hour) {
  if (hour === 0 || hour === 24) return "midnight";
  if (hour === 12) return "noon";
  return `${hour % 12} ${hour < 12 ? "a.m." : "p.m."}`;
}

function dayList(days) {
  const names = [...days].sort((a, b) => a - b).map((d) => WEEKDAYS[d]).filter(Boolean);
  if (names.length === 7) return "every day";
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function stateOf(lead) {
  return String(lead?.state ?? "").trim().toUpperCase();
}

export function timeZoneFor(state) {
  return STATE_TIMEZONES[String(state ?? "").trim().toUpperCase()] ?? null;
}

// Local wall clock for a state at now. Null when the state has no known zone.
export function localTimeFor(state, now) {
  const timeZone = timeZoneFor(state);
  if (!timeZone) return null;
  const p = partsIn(timeZone, toDate(now));
  const zone = ZONE_NAMES[timeZone] ?? timeZone;
  return {
    timeZone,
    hour: p.hour,
    minute: p.minute,
    weekday: p.weekday,
    date: p.date,
    label: `${clock12(p.hour, p.minute)} ${WEEKDAYS[p.weekday]}, ${zone}`,
  };
}

// settings.compliance over the defaults, so older settings files still get the safe rules.
export function complianceSettings(settings) {
  const c = settings?.compliance ?? {};
  return {
    ...DEFAULT_COMPLIANCE,
    ...c,
    callWindow: { ...DEFAULT_COMPLIANCE.callWindow, ...(c.callWindow ?? {}) },
    noTextStates: Array.isArray(c.noTextStates) ? c.noTextStates : DEFAULT_COMPLIANCE.noTextStates,
  };
}

function history(lead) {
  return Array.isArray(lead?.outreach?.history) ? lead.outreach.history : [];
}

// The suppression entry that covers this lead, or null. Matches by dedupe key, phone digits or
// name plus state, the same rule as duplicates, so a reformatted phone still matches.
export function suppressionFor(lead, suppression) {
  if (!lead || !Array.isArray(suppression) || suppression.length === 0) return null;
  const digits = phoneDigits(lead.phone);
  const nameKey = lead.business ? nameStateKey({ business: lead.business, state: lead.state }) : "";
  const key = dedupeKey(lead);
  for (const s of suppression) {
    if (!s) continue;
    if (s.key && (s.key === key || (digits && s.key === digits) || (nameKey && s.key === nameKey))) return s;
    if (digits && phoneDigits(s.phone) === digits) return s;
    if (nameKey && s.business && nameStateKey({ business: s.business, state: s.state }) === nameKey) return s;
  }
  return null;
}

// Suppressed by the list or by a "suppressed" history entry on the lead itself.
export function isSuppressed(lead, suppression) {
  return Boolean(suppressionFor(lead, suppression)) || history(lead).some((h) => h?.type === "suppressed");
}

function suppressedSentence(lead, suppression) {
  const s = suppressionFor(lead, suppression);
  const why = s?.reason ? ` Reason: ${String(s.reason).replace(/\.?$/, ".")}` : "";
  return `${lead?.business || "This business"} is on the suppression list, so it is never contacted again.${why}`;
}

function sameLocalDate(at, timeZone, today) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return false;
  return partsIn(timeZone, d).date === today;
}

export function callCheck({ lead, settings, now, suppression } = {}) {
  const c = complianceSettings(settings);
  const reasons = [];
  let ok = true;
  const calls = history(lead).filter((h) => h?.type === "call");
  const callsTotal = calls.length;
  let local = null;
  let badNow = false;
  try {
    local = localTimeFor(stateOf(lead), now);
  } catch {
    badNow = true;
  }
  const callsToday = local ? calls.filter((h) => sameLocalDate(h.at, local.timeZone, local.date)).length : 0;

  if (isSuppressed(lead, suppression)) {
    ok = false;
    reasons.push(suppressedSentence(lead, suppression));
  }
  if (!phoneDigits(lead?.phone)) {
    ok = false;
    reasons.push("There is no phone number on this lead.");
  }
  if (badNow) {
    ok = false;
    reasons.push("The current time was not given, so the call window cannot be checked.");
  } else if (!local) {
    ok = false;
    reasons.push(`The state ${JSON.stringify(lead?.state ?? "")} has no known time zone, so the local time cannot be checked.`);
  } else {
    const { startHour, endHour, days } = c.callWindow;
    if (!days.includes(local.weekday)) {
      ok = false;
      reasons.push(`It is ${WEEKDAYS[local.weekday]} for this business. Calls are only made ${dayList(days)}.`);
    }
    if (local.hour < startHour || local.hour >= endHour) {
      ok = false;
      reasons.push(`It is ${clock12(local.hour, local.minute)} for this business. Calls are only made from ${hourWords(startHour)} to ${hourWords(endHour)} local time.`);
    }
  }
  if (callsToday >= c.maxCallsPerDay) {
    ok = false;
    reasons.push(`${callsToday} call${callsToday === 1 ? " was" : "s were"} already logged today; the limit is ${c.maxCallsPerDay} a day.`);
  }
  if (callsTotal >= c.maxCallsTotal) {
    ok = false;
    reasons.push(`${callsTotal} calls are already logged; the limit is ${c.maxCallsTotal} in total without a reply.`);
  }
  if (c.texasRegistration === "unknown") reasons.push(TEXAS_UNCONFIRMED);
  const line = lead?.phoneLineType ?? "unknown";
  if (line === "mobile" || line === "unknown" || !PHONE_LINE_TYPES.includes(line)) {
    reasons.push(line === "mobile"
      ? "This number is a mobile and may be treated as residential; email first."
      : "The line type is unknown, so it may be a mobile treated as residential; email first.");
  }
  return { ok, reasons, callsToday, callsTotal, localLabel: local?.label ?? "" };
}

function consentEntries(lead) {
  return history(lead).filter((h) => h?.type === "consent");
}

function isNoTextState(lead, states) {
  const list = (states ?? []).map((s) => String(s).toUpperCase());
  if (list.includes(stateOf(lead))) return true;
  const area = phoneDigits(lead?.phone).slice(0, 3);
  return Boolean(area) && list.some((s) => (STATE_AREA_CODES[s] ?? []).includes(area));
}

export function canText({ lead, settings, suppression } = {}) {
  const c = complianceSettings(settings);
  if (isSuppressed(lead, suppression)) return { ok: false, reason: suppressedSentence(lead, suppression) };
  const consents = consentEntries(lead);
  const textConsent = consents.find((h) => TEXT_CONSENT_RE.test(String(h.text ?? "")));
  if (textConsent) return { ok: true, reason: `Consent to texts was recorded on ${String(textConsent.at ?? "").slice(0, 10) || "an earlier date"}.` };
  if (isNoTextState(lead, c.noTextStates)) {
    return { ok: false, reason: "This is a no text state number (Washington law), so it is never texted without recorded consent." };
  }
  if (consents.length > 0) {
    return { ok: false, reason: "The recorded consent does not mention texts, so the follow up text stays hidden." };
  }
  return { ok: false, reason: "No consent to texts is recorded. Cold texts are never sent." };
}

export function emailReady({ settings, lead, suppression } = {}) {
  const reasons = [];
  const contact = settings?.contact ?? {};
  if (lead && isSuppressed(lead, suppression)) reasons.push(suppressedSentence(lead, suppression));
  if (typeof contact.address !== "string" || !contact.address.trim()) {
    reasons.push("Add Kija's mailing address in settings; every commercial email must carry a valid postal address.");
  }
  if (typeof contact.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
    reasons.push("Add a reply email address in settings so the opt out line works.");
  }
  return { ok: reasons.length === 0, reasons };
}

// A suppression entry for a lead or record, for store.saveSuppression.
export function suppressionEntry(record, { reason, by, now }) {
  return {
    key: dedupeKey(record),
    business: record.business ?? record.candidate ?? "",
    city: record.city ?? "",
    state: record.state ?? "",
    phone: record.phone ?? "",
    reason: reason ?? "",
    addedAt: toDate(now).toISOString(),
    by: by ?? "",
  };
}
