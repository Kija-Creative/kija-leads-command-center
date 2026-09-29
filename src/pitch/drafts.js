// Outreach drafts for one lead: an email, a call script, a voicemail, a follow up
// text and notes for Jamey. These are text to copy. Nothing here sends anything,
// and nothing else in the system does either.
//
// Voice: a local designer who noticed something true, not a marketer. Trust
// first, one ask (a 15 minute look at the concept), no urgency, no claim of an
// existing relationship, no suggestion of any tie to Google.
//
// Compliance (research/compliance.md, not legal advice): the email names itself as
// a solicitation and carries the opt out line and Kija's postal address (CAN-SPAM);
// calls are dialed by hand inside the call window and limits; there are no cold
// texts; a suppressed business gets no drafts at all. When src/lib/compliance.js is
// installed, "ready" carries its email, call and text checks for this lead.

import { formatDollars } from "../lib/roi.js";
import {
  TEXAS_UNCONFIRMED,
  complianceOf,
  complianceRules,
  hasTextConsent,
  noTextLead,
  readiness,
  suppressed as isSuppressed,
} from "./compliance-link.js";
import {
  ADDRESS_PLACEHOLDER,
  PHONE_PLACEHOLDER,
  REQUEST_NOUNS,
  clean,
  cleanList,
  contactOf,
  formatCount,
  formatRating,
  requestKind,
  reviewsPhrase,
  stripDashes,
  wordCount,
} from "./shared.js";

export const EMAIL_WORD_LIMIT = 150;
export const SOLICITATION_LINE = "This email is a business solicitation from Kija Creative.";
export const OPT_OUT_LINE = "If you would rather not hear from me, reply \"no thanks\" and I will not contact you again.";
export const STUDIO_LINE = "Kija Creative, a design studio in Dallas";
// Required in every email (CAN-SPAM). Not counted toward the word limit, so the
// legal footer never crowds out the part of the message a person wrote.
export const EMAIL_FOOTER = `${SOLICITATION_LINE} ${OPT_OUT_LINE}`;
export const TEXT_STOP_LINE = "Reply STOP and I will not text again.";
export const FOLLOW_UP_LABEL = "Only after they reply or give consent";
export const MOBILE_LINE_NOTE = "This number is recorded as a mobile, so it may be the owner's personal cell. A personal cell can count as residential, so email first.";

// The pitch passes categories for the vertical; drafts only need the request
// noun, so a missing categories map falls back by categoryKey alone.
const VERTICAL_BY_KEY = {
  "auto-repair": "auto", "auto-body-collision": "auto", "tire-shop": "auto", "muffler-exhaust": "auto",
  "diesel-truck-repair": "auto", "mobile-mechanic": "auto", "auto-detailing": "auto", towing: "auto",
  hvac: "home-services", plumbing: "home-services", electrical: "home-services", septic: "home-services",
  "garage-door": "home-services", restoration: "home-services", "appliance-repair": "home-services", "pest-control": "home-services",
  roofing: "contractor", concrete: "contractor", fencing: "contractor", pools: "contractor", landscaping: "contractor",
  painting: "contractor", "foundation-repair": "contractor", remodeling: "contractor", "tree-service": "contractor",
  barber: "personal-care", "hair-salon": "personal-care", "nail-salon": "personal-care", tattoo: "personal-care", "pet-grooming": "personal-care",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const COUNT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

function lowerFirst(text) {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function upperFirst(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function joinAnd(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function countWord(n) {
  return COUNT_WORDS[n] ?? String(n);
}

// 9 is "9 a.m.", 20 is "8 p.m.", 12 is "noon".
export function hourWords(hour) {
  const h = Number(hour);
  if (h === 0 || h === 24) return "midnight";
  if (h === 12) return "noon";
  return `${h % 12} ${h < 12 ? "a.m." : "p.m."}`;
}

// [1, 2, 3, 4, 5, 6] is "Monday to Saturday"; a broken run is listed.
export function dayRange(days) {
  const sorted = [...new Set((Array.isArray(days) ? days : []).map(Number).filter((d) => d >= 0 && d <= 6))].sort((a, b) => a - b);
  if (sorted.length === 7) return "any day of the week";
  if (!sorted.length) return "no day of the week";
  const run = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (run && sorted.length >= 3) return `${DAY_NAMES[sorted[0]]} to ${DAY_NAMES[sorted[sorted.length - 1]]}`;
  return joinAnd(sorted.map((d) => DAY_NAMES[d]));
}

// The calling rules as one paragraph for the top of the call script.
export function callRulesLine(rules) {
  const { startHour, endHour, days } = rules.callWindow;
  const perDay = rules.maxCallsPerDay;
  const total = rules.maxCallsTotal;
  return [
    "Before you dial: Calls are dialed by a person, one number at a time. No autodialer, no recorded or AI voice, no voicemail drops.",
    `Call only between ${hourWords(startHour)} and ${hourWords(endHour)} in the prospect's local time, ${dayRange(days)}, at most ${countWord(perDay)} ${perDay === 1 ? "call" : "calls"} a day and ${countWord(total)} in total without a reply.`,
    "Stop at the first no. The call only books the walkthrough; never close a sale on the phone.",
  ].join(" ");
}

function gapLine(gap) {
  if (gap >= 3) return "When I looked for a website of your own, I could not find one.";
  if (gap === 2) return "When I looked for a website of your own, I only found third party pages.";
  return "Your current site does not show much of that reputation yet.";
}

function gapSpoken(gap) {
  if (gap >= 3) return "I could not find a website of your own";
  if (gap === 2) return "the only pages I could find for you belong to other sites";
  return "your current site does not show much of that reputation yet";
}

function contactBlock(c) {
  const reach = [c.email, c.phone].filter(Boolean).join(" | ");
  return [c.name, c.title, reach, c.site, c.address].filter(Boolean).join("\n");
}

// Assembles the email from required and optional parts, dropping optional
// parts (least important first) until the message fits the word limit. The limit
// counts greeting through signature; the required footer is extra.
function composeEmail(parts) {
  const optional = ["roi", "themes"];
  const active = new Set(optional);
  const build = () => {
    const rep = parts.reputation + (active.has("themes") && parts.themes ? ` ${parts.themes}` : "");
    const paragraphs = [
      parts.greeting,
      rep,
      parts.intro,
      active.has("roi") && parts.roi ? parts.roi : "",
      parts.ask,
      parts.signature,
      EMAIL_FOOTER,
    ].filter(Boolean);
    return paragraphs.join("\n\n");
  };
  const footerWords = wordCount(EMAIL_FOOTER);
  let body = build();
  for (const key of optional) {
    if (wordCount(body) - footerWords < EMAIL_WORD_LIMIT) break;
    active.delete(key);
    body = build();
  }
  return body;
}

// What a suppressed business gets: no text to copy, only the reason.
function suppressedDrafts(business, ready) {
  const out = {
    email: { subject: "", body: "" },
    callScript: "",
    voicemail: "",
    followUpText: "",
    notes: stripDashes([
      `Do not contact ${business || "this business"}. It is on the suppression list, so no email, call or text goes to it again, and no drafts are written.`,
      "Nothing is sent automatically. If this is a mistake, fix the suppression list first; never work around it.",
    ].join("\n")),
  };
  if (ready) out.ready = ready;
  return out;
}

export function buildDrafts(lead, { settings = {}, roi = null, categories = null, now, suppression = [], compliance } = {}) {
  if (!lead || typeof lead !== "object") throw new TypeError("buildDrafts needs a lead.");
  const mod = complianceOf(compliance);
  const rules = complianceRules(settings);
  const ready = readiness(mod, { lead, settings, now, suppression });
  const business = clean(lead.business);
  if (isSuppressed(lead, suppression, mod)) return suppressedDrafts(business, ready);

  const c = contactOf(settings);
  const offer = settings?.offer ?? {};
  const priceConfirmed = Boolean(offer.priceConfirmed);
  const rating = formatRating(lead.googleRating);
  const reviews = reviewsPhrase(lead);
  const gap = Number(lead.websiteGap) || 0;
  const vertical = categories?.[lead.categoryKey]?.vertical ?? VERTICAL_BY_KEY[lead.categoryKey] ?? "general";
  const requestNoun = REQUEST_NOUNS[requestKind(vertical, lead.categoryKey)];
  const themes = cleanList(lead.reviewThemes).slice(0, 2).map(lowerFirst);
  const jobs = roi?.breakEven?.jobs;
  const price = Number(offer.price) > 0 ? formatDollars(offer.price) : "";
  const callback = c.phone || PHONE_PLACEHOLDER;
  const texasUnknown = rules.texasRegistration === "unknown";
  const texasLine = mod?.TEXAS_UNCONFIRMED || TEXAS_UNCONFIRMED;
  const lineType = lead.phoneLineType || "unknown";

  const subject = `A private homepage concept for ${business}`;
  const body = composeEmail({
    greeting: `Hi ${business} team,`,
    reputation: `${formatCount(lead.googleReviews)} Google reviews at ${rating} stars means a lot of customers have gone out of their way to vouch for you.`,
    themes: themes.length ? `Your reviews keep coming back to ${joinAnd(themes)}.` : "",
    intro: `I'm ${c.name} at ${STUDIO_LINE}. ${gapLine(gap)} So I made a private concept homepage for ${business} that puts your reviews first and makes ${requestNoun} easy. It is not published anywhere.`,
    roi: priceConfirmed && jobs ? `By my rough math, about ${jobs} extra ${jobs === 1 ? "job" : "jobs"} would cover the cost.` : "",
    ask: "Would you be open to a 15 minute look at it, by phone or screen share?",
    signature: contactBlock(c),
  });

  const costAnswer = priceConfirmed && price
    ? `The ${clean(offer.name) || "site"} is ${price}, and you own it outright.${jobs ? ` At the typical numbers we used, about ${jobs} extra jobs would cover it, but we would run that with their real numbers.` : ""}`
    : "Pricing depends on what they need, and it is better set together than guessed. That is part of the 15 minutes.";

  const callScript = [
    texasUnknown ? `Check first: ${texasLine}` : "",
    callRulesLine(rules),
    lineType === "mobile" ? `Line type: ${MOBILE_LINE_NOTE}` : "",
    `Opening: Hi, is this the owner or manager of ${business}? My name is ${c.name}, with ${STUDIO_LINE}, and I'm calling about a homepage concept I made for your business. Do you have a minute, or is there a better time to call?`,
    `Why you are calling: I came across ${business} and saw ${reviews} at ${rating} stars. ${upperFirst(gapSpoken(gap))}, so I put together a private concept homepage to show what your own site could look like.`,
    "The ask: Would you be open to a 15 minute look at it, by phone or screen share? There is no cost to look.",
    `If they ask what it costs: ${costAnswer}`,
    "If they ask where you found them: Their number and reviews are listed publicly online. Kija is an independent studio and is not affiliated with Google.",
    "If they say yes: Book a time, then send the email draft so they have the details in writing.",
    "If they say no: Thank them and end the call. Do not call again. If they ask not to be contacted, in any words, add them to the suppression list the same day; it covers email and texts too. Log it in the lead history.",
  ].filter(Boolean).join("\n\n");

  const voicemail = `Hi, this is ${c.name} with ${STUDIO_LINE}, calling for ${business}. Your ${reviews} at ${rating} stars caught my attention, and I put together a private concept homepage for you. If a 15 minute look sounds useful, call me back at ${callback}${c.email ? ` or email ${c.email}` : ""}. Again, ${c.name} at Kija Creative, ${callback}. Thanks.`;

  // No cold texts. A no text state (Washington) without recorded consent gets no text at all;
  // anywhere else the text is kept but labelled, for after the owner replies or agrees.
  const textConsent = ready?.text ? Boolean(ready.text.ok) : hasTextConsent(lead);
  const blockedState = !textConsent && noTextLead(lead, rules.noTextStates, mod);
  const followUpText = blockedState
    ? ""
    : `[${FOLLOW_UP_LABEL}]\n\nHi, it's ${c.name} from Kija Creative. Thanks for getting back to me about the concept homepage for ${business}. Would [day and time] work for the 15 minute walkthrough? ${TEXT_STOP_LINE}`;

  const localLabel = clean(ready?.call?.localLabel);
  const notes = [
    "Nothing is sent automatically. These are drafts: check every fact, then copy and send them yourself.",
    texasUnknown ? `${texasLine} Until that is settled, a call only books the walkthrough and never closes a sale.` : "",
    c.address === ADDRESS_PLACEHOLDER ? `Replace ${ADDRESS_PLACEHOLDER} with Kija's physical mailing address before sending (add contact.address in settings). Commercial email needs it.` : "",
    c.email ? "" : "Add a reply email address to the contact in settings so the opt out line works.",
    "Keep the solicitation line, the opt out line and the contact block in any email you send. Any request to stop, in any words, goes on the suppression list the same day and covers every channel.",
    `Calls are by hand only, ${hourWords(rules.callWindow.startHour)} to ${hourWords(rules.callWindow.endHour)} in their local time, ${dayRange(rules.callWindow.days)}, at most ${countWord(rules.maxCallsPerDay)} a day and ${countWord(rules.maxCallsTotal)} in total without a reply.${localLabel ? ` Their local time when these drafts were made: ${localLabel}.` : ""}`,
    lineType === "mobile" ? MOBILE_LINE_NOTE : "",
    lineType === "unknown" ? "The phone line type is not recorded. It may be the owner's personal cell, which can count as residential, so email first when you can." : "",
    "Leave the voicemail yourself, live, and count it as that day's call. Never use a recorded message or a voicemail drop.",
    blockedState
      ? "There is no follow up text: this is a Washington number or address, and Washington bars commercial texts without consent given in advance. Record their consent in the lead history first."
      : `Use the follow up text only after the owner has replied or agreed to be texted. Texting a mobile number needs prior consent.${textConsent ? "" : " Record that consent in the lead history before you text."} Delete the bracketed label and fill in [day and time] before sending.`,
    c.phone ? "" : `Add a phone number to the contact in settings so the voicemail has a real callback number instead of ${PHONE_PLACEHOLDER}.`,
    priceConfirmed ? "" : "The price is not confirmed in settings, so these drafts do not quote one.",
    lead.verification?.status && lead.verification.status !== "verified"
      ? `This lead is marked ${lead.verification.status}. Recheck the rating, review count and website status before reaching out.`
      : "",
    "The drafts claim no existing relationship and no tie to Google. Keep it that way if you edit them.",
  ].filter(Boolean).join("\n");

  const out = {
    email: { subject: stripDashes(subject), body: stripDashes(body) },
    callScript: stripDashes(callScript),
    voicemail: stripDashes(voicemail),
    followUpText: stripDashes(followUpText),
    notes: stripDashes(notes),
  };
  if (ready) out.ready = ready;
  return out;
}
