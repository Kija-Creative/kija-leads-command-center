// Page analysis for the domain probe: title, whether the page names the
// business or shows its phone, and a parked or placeholder guess. It is a
// guess by design; the reasons are reported so a person can judge.

import { decodeEntities, matchText, phoneDigits, plainText, coreWords } from "./text.js";
import { hostOf, hostMatches } from "./hosts.js";

export const PARKING_HOSTS = Object.freeze([
  "sedoparking.com", "sedo.com", "parkingcrew.net", "bodis.com", "above.com", "afternic.com",
  "dan.com", "hugedomains.com", "buydomains.com", "domainmarket.com", "undeveloped.com",
  "parklogic.com", "parkingpage.namecheap.com", "uniregistry.com", "epik.com", "atom.com",
  "squadhelp.com", "brandbucket.com", "sav.com", "dynadot.com", "namebright.com",
  "smartname.com", "domainnamesales.com", "efty.com", "perfectdomain.com", "voodoo.com",
  "skenzo.com", "fabulous.com", "rookmedia.net", "trafficz.com", "domainsponsor.com",
  "parked.com", "internettraffic.com", "searchnut.com", "cashparking.com", "domainlore.com",
  "spaceship.com", "porkbun.com", "namecheap.com", "godaddy.com", "domainagents.com",
  "domainnameshop.com", "parkingcrew.com", "adsense-parking.com",
]);

// Phrases that on their own mean the domain is parked, for sale or expired.
const STRONG_PHRASES = [
  "this domain is for sale", "this domain may be for sale", "the domain name is for sale",
  "domain is for sale", "buy this domain", "make an offer on this domain", "this domain has expired",
  "domain has expired", "this domain is parked", "domain is parked", "parked free",
  "courtesy of godaddy", "future home of something quite cool", "this web page is parked",
  "inquire about this domain", "get this domain", "this domain name has been registered",
  "parked domain name", "domain may be available", "is parked free of charge",
  "renew this domain", "this domain is registered", "domain registered and parked",
];

// Phrases that suggest a placeholder only when the page is otherwise thin.
const WEAK_PHRASES = [
  "related searches", "sponsored listings", "coming soon", "under construction",
  "website coming soon", "default web page", "index of", "welcome to nginx",
  "apache2 ubuntu default page", "it works", "account suspended", "this account has been suspended",
  "site not found", "domain not configured", "there is no website configured at this address",
  "web hosting", "hosting provider", "launching soon",
];

const THIN_PAGE_CHARS = 1500;

export function isParkingHost(host) {
  const h = String(host ?? "").toLowerCase();
  return PARKING_HOSTS.some((p) => hostMatches(h, p));
}

export function extractTitle(html) {
  const m = String(html ?? "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).replace(/\s+/g, " ").trim().slice(0, 200) : "";
}

// A meta refresh target, if the page has one.
export function metaRefreshUrl(html, baseUrl) {
  const m = String(html ?? "").match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["'][^"']*url=([^"'>\s]+)/i);
  if (!m) return "";
  try {
    return new URL(decodeEntities(m[1]), baseUrl).href;
  } catch {
    return "";
  }
}

// Does the page show this phone number, name this business, or name its city?
export function pageMentions(html, { name = "", phone = "", city = "" } = {}) {
  const source = String(html ?? "");
  const digits = phoneDigits(phone);
  let mentionsPhone = false;
  if (digits) {
    const re = /(?:\+?1[\s.-]?)?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})(?!\d)/g;
    for (const m of source.matchAll(re)) {
      if (`${m[1]}${m[2]}${m[3]}` === digits) {
        mentionsPhone = true;
        break;
      }
    }
  }

  let mentionsName = false;
  const words = coreWords(name);
  const text = words.length || city ? matchText(plainText(source)) : "";
  const cityPhrase = matchText(city).trim();
  // A same name business elsewhere is common; the city tells them apart.
  const mentionsCity = Boolean(cityPhrase) && text.includes(` ${cityPhrase} `);
  if (words.length) {
    const phrase = ` ${words.join(" ")} `;
    const squashed = words.join("");
    const noAnd = words.filter((w) => w !== "and");
    mentionsName = text.includes(phrase)
      || (noAnd.length > 1 && text.includes(` ${noAnd.join(" ")} `))
      // Logos and headings often run words together: "GMAutoCare".
      || (squashed.length >= 6 && text.replace(/ /g, "").includes(squashed));
  }
  return { mentionsPhone, mentionsName, mentionsCity };
}

// Parked or placeholder guess from the final URL, redirect chain and body.
export function detectParked({ finalUrl = "", redirects = [], html = "" } = {}) {
  const reasons = [];
  for (const url of [...redirects, finalUrl]) {
    const host = hostOf(url);
    if (host && isParkingHost(host)) {
      const reason = `Lands on ${host}, a domain parking or sales host.`;
      if (!reasons.includes(reason)) reasons.push(reason);
    }
  }
  const source = String(html ?? "");
  for (const m of source.matchAll(/<(?:script|iframe|frame)[^>]+src=["']([^"']+)["']/gi)) {
    const host = hostOf(m[1]);
    if (host && isParkingHost(host)) {
      const reason = `Loads a script or frame from ${host}, a parking service.`;
      if (!reasons.includes(reason)) reasons.push(reason);
    }
  }
  if (/wsimg\.com\/parking-lander|location\.(?:href|replace)\s*[=(]\s*["']\/lander/i.test(source)) {
    reasons.push("Uses the GoDaddy parking lander.");
  }

  const text = plainText(source);
  const lowered = matchText(text);
  for (const phrase of STRONG_PHRASES) {
    // Skip a phrase already covered by a longer match ("domain is for sale").
    if (reasons.some((r) => r.includes(phrase))) continue;
    if (lowered.includes(` ${matchText(phrase).trim()} `)) reasons.push(`Page says "${phrase}".`);
  }
  if (text.length < THIN_PAGE_CHARS) {
    for (const phrase of WEAK_PHRASES) {
      if (lowered.includes(` ${matchText(phrase).trim()} `)) {
        reasons.push(`Thin page (${text.length} characters of text) says "${phrase}".`);
      }
    }
  }
  // An almost empty 200 is not called parked: it may be a site rendered by
  // JavaScript. The probe reports textChars so a person can open it.
  return { parked: reasons.length > 0, reasons };
}
