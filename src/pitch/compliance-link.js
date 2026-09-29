// The pitch module's link to src/lib/compliance.js, which core owns. It loads once,
// lazily, so drafts and pitch pages still build while that file is missing; drafts
// then carry no "ready" block and fall back to the conservative rules below.
// Pure apart from that one import: nothing here reads the clock or the disk.

import { dedupeKey, phoneDigits } from "../lib/normalize.js";

let loaded = null;
try {
  loaded = await import("../lib/compliance.js");
} catch (err) {
  // Only a missing compliance.js is tolerated. A broken one should fail loudly.
  if (err?.code !== "ERR_MODULE_NOT_FOUND" || !String(err?.message ?? "").includes("compliance.js")) throw err;
}

export const COMPLIANCE = loaded;

// options.compliance: undefined uses the loaded module, null means "not installed"
// (tests use it), an object stands in for the module.
export function complianceOf(option) {
  if (option === null) return null;
  if (option && typeof option === "object") return option;
  return COMPLIANCE;
}

export const TEXAS_UNCONFIRMED = "Texas phone solicitation status is unconfirmed. Check chapter 302 with an attorney before phone outreach.";

// Same defaults as settings.compliance in SPEC, so an older settings file still gets the safe rules.
export const DEFAULT_RULES = {
  texasRegistration: "unknown",
  callWindow: { startHour: 9, endHour: 20, days: [1, 2, 3, 4, 5, 6] },
  maxCallsPerDay: 1,
  maxCallsTotal: 3,
  noColdTexts: true,
  noTextStates: ["WA"],
};

// Washington area codes, so a Washington cell listed under another state's address is caught.
const LOCAL_AREA_CODES = { WA: ["206", "253", "360", "425", "509", "564"] };
const TEXT_CONSENT_RE = /\b(text|texts|texting|texted|sms)\b/i;

export function complianceRules(settings) {
  const c = settings?.compliance ?? {};
  const win = { ...DEFAULT_RULES.callWindow, ...(c.callWindow ?? {}) };
  return {
    ...DEFAULT_RULES,
    ...c,
    callWindow: {
      startHour: Number.isFinite(Number(win.startHour)) ? Number(win.startHour) : DEFAULT_RULES.callWindow.startHour,
      endHour: Number.isFinite(Number(win.endHour)) ? Number(win.endHour) : DEFAULT_RULES.callWindow.endHour,
      days: Array.isArray(win.days) ? win.days.map(Number).filter((d) => d >= 0 && d <= 6) : DEFAULT_RULES.callWindow.days,
    },
    maxCallsPerDay: Number(c.maxCallsPerDay) > 0 ? Number(c.maxCallsPerDay) : DEFAULT_RULES.maxCallsPerDay,
    maxCallsTotal: Number(c.maxCallsTotal) > 0 ? Number(c.maxCallsTotal) : DEFAULT_RULES.maxCallsTotal,
    noTextStates: Array.isArray(c.noTextStates) ? c.noTextStates.map((s) => String(s).toUpperCase()) : DEFAULT_RULES.noTextStates,
    texasRegistration: ["unknown", "registered", "exempt-confirmed"].includes(c.texasRegistration) ? c.texasRegistration : "unknown",
  };
}

function history(lead) {
  return Array.isArray(lead?.outreach?.history) ? lead.outreach.history : [];
}

// Suppressed by the list or by a "suppressed" history entry. The module's rule
// (which also matches phone digits and name plus state) wins when it is present.
export function suppressed(lead, suppression, mod = COMPLIANCE) {
  if (typeof mod?.isSuppressed === "function") return Boolean(mod.isSuppressed(lead, suppression));
  if (history(lead).some((h) => h?.type === "suppressed")) return true;
  const list = Array.isArray(suppression) ? suppression : [];
  if (!list.length || !lead) return false;
  const key = dedupeKey(lead);
  const digits = phoneDigits(lead.phone);
  return list.some((s) => s && (s.key === key || (digits && phoneDigits(s.phone) === digits)));
}

// A recorded "consent" history entry that mentions texts.
export function hasTextConsent(lead) {
  return history(lead).some((h) => h?.type === "consent" && TEXT_CONSENT_RE.test(String(h.text ?? "")));
}

// A lead whose state, or whose phone's area code, is in noTextStates.
export function noTextLead(lead, states, mod = COMPLIANCE) {
  const list = (Array.isArray(states) ? states : DEFAULT_RULES.noTextStates).map((s) => String(s).toUpperCase());
  const state = String(lead?.state ?? "").trim().toUpperCase();
  if (list.includes(state)) return true;
  const codes = mod?.STATE_AREA_CODES ?? LOCAL_AREA_CODES;
  const area = phoneDigits(lead?.phone).slice(0, 3);
  return Boolean(area) && list.some((s) => (codes[s] ?? []).includes(area));
}

// callCheck, canText and emailReady for one lead, or null when compliance.js is not
// installed. A check that throws becomes a failed result with the error as its reason.
export function readiness(mod, { lead, settings, now, suppression }) {
  if (!mod) return null;
  const args = { lead, settings, now, suppression };
  const run = (name, fallback) => {
    if (typeof mod[name] !== "function") return fallback(`The ${name} check is missing from src/lib/compliance.js.`);
    try {
      return mod[name](args);
    } catch (err) {
      return fallback(`The ${name} check failed: ${err?.message ?? err}`);
    }
  };
  return {
    email: run("emailReady", (reason) => ({ ok: false, reasons: [reason] })),
    call: run("callCheck", (reason) => ({ ok: false, reasons: [reason], callsToday: 0, callsTotal: 0, localLabel: "" })),
    text: run("canText", (reason) => ({ ok: false, reason })),
  };
}
