// Outreach drafts for one lead: an email, a call script, a voicemail, a follow up
// text and notes for Jamey. These are text to copy. Nothing here sends anything,
// and nothing else in the system does either.
//
// Voice: a local designer who noticed something true, not a marketer. Trust
// first, one ask (a 15 minute look at the concept), no urgency, no claim of an
// existing relationship, no suggestion of any tie to Google.

import { formatDollars } from "../lib/roi.js";
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
export const OPT_OUT_LINE = "If you would rather not hear from me, reply \"no thanks\" and I will not contact you again.";
export const STUDIO_LINE = "Kija Creative, a design studio in Dallas";
export const TEXT_STOP_LINE = "Reply STOP and I will not text again.";

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

function lowerFirst(text) {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function joinAnd(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
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
// parts (least important first) until the body fits the word limit.
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
      OPT_OUT_LINE,
    ].filter(Boolean);
    return paragraphs.join("\n\n");
  };
  let body = build();
  for (const key of optional) {
    if (wordCount(body) < EMAIL_WORD_LIMIT) break;
    active.delete(key);
    body = build();
  }
  return body;
}

export function buildDrafts(lead, { settings = {}, roi = null, categories = null } = {}) {
  if (!lead || typeof lead !== "object") throw new TypeError("buildDrafts needs a lead.");
  const c = contactOf(settings);
  const offer = settings?.offer ?? {};
  const priceConfirmed = Boolean(offer.priceConfirmed);
  const business = clean(lead.business);
  const rating = formatRating(lead.googleRating);
  const reviews = reviewsPhrase(lead);
  const gap = Number(lead.websiteGap) || 0;
  const vertical = categories?.[lead.categoryKey]?.vertical ?? VERTICAL_BY_KEY[lead.categoryKey] ?? "general";
  const requestNoun = REQUEST_NOUNS[requestKind(vertical, lead.categoryKey)];
  const themes = cleanList(lead.reviewThemes).slice(0, 2).map(lowerFirst);
  const jobs = roi?.breakEven?.jobs;
  const price = Number(offer.price) > 0 ? formatDollars(offer.price) : "";
  const callback = c.phone || PHONE_PLACEHOLDER;

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
    `Opening: Hi, is this the owner or manager of ${business}? My name is ${c.name}, with ${STUDIO_LINE}. Do you have a minute, or is there a better time to call?`,
    `Why you are calling: I came across ${business} and saw ${reviews} at ${rating} stars. ${gapSpoken(gap).charAt(0).toUpperCase()}${gapSpoken(gap).slice(1)}, so I put together a private concept homepage to show what your own site could look like.`,
    "The ask: Would you be open to a 15 minute look at it, by phone or screen share? There is no cost to look.",
    `If they ask what it costs: ${costAnswer}`,
    "If they ask where you found them: Their number and reviews are listed publicly online. Kija is an independent studio and is not affiliated with Google.",
    "If they say yes: Book a time, then send the email draft so they have the details in writing.",
    "If they say no: Thank them, ask whether they would prefer not to be contacted again, and log it in the lead history.",
  ].join("\n\n");

  const voicemail = `Hi, this is ${c.name} with ${STUDIO_LINE}, calling for ${business}. Your ${reviews} at ${rating} stars caught my attention, and I put together a private concept homepage for you. If a 15 minute look sounds useful, call me back at ${callback}${c.email ? ` or email ${c.email}` : ""}. Again, ${c.name} at Kija Creative, ${callback}. Thanks.`;

  const followUpText = `Hi, it's ${c.name} from Kija Creative. Thanks for getting back to me about the concept homepage for ${business}. Would [day and time] work for the 15 minute walkthrough? ${TEXT_STOP_LINE}`;

  const notes = [
    "Nothing is sent automatically. These are drafts: check every fact, then copy and send them yourself.",
    "Use the follow up text only after the owner has replied or agreed to be texted. Texting a mobile number needs prior consent.",
    "Keep the opt out line and the contact block in any email you send, and honor an opt out right away.",
    c.address === ADDRESS_PLACEHOLDER ? `Replace ${ADDRESS_PLACEHOLDER} with Kija's physical mailing address before sending (add contact.address in settings). Commercial email needs it.` : "",
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
  return out;
}
