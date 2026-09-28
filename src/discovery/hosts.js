// Host lists used to judge a website field or a redirect target. A business
// whose "website" is one of these does not own a site: that is websiteGap 2
// territory (third party only), not a reason to drop the lead.

const THIRD_PARTY = [
  // social profiles
  ["facebook.com", "social", "Facebook"],
  ["fb.com", "social", "Facebook"],
  ["fb.me", "social", "Facebook"],
  ["instagram.com", "social", "Instagram"],
  ["tiktok.com", "social", "TikTok"],
  ["x.com", "social", "X"],
  ["twitter.com", "social", "X"],
  ["youtube.com", "social", "YouTube"],
  ["linkedin.com", "social", "LinkedIn"],
  ["nextdoor.com", "social", "Nextdoor"],
  // directories and review sites
  ["yelp.com", "directory", "Yelp"],
  ["yellowpages.com", "directory", "Yellow Pages"],
  ["bbb.org", "directory", "BBB"],
  ["mapquest.com", "directory", "MapQuest"],
  ["manta.com", "directory", "Manta"],
  ["angi.com", "directory", "Angi"],
  ["homeadvisor.com", "directory", "HomeAdvisor"],
  ["thumbtack.com", "directory", "Thumbtack"],
  ["houzz.com", "directory", "Houzz"],
  ["porch.com", "directory", "Porch"],
  ["repairpal.com", "directory", "RepairPal"],
  ["carfax.com", "directory", "Carfax"],
  ["birdeye.com", "directory", "Birdeye"],
  ["alignable.com", "directory", "Alignable"],
  // free builder subdomains and hosted pages
  ["square.site", "builder", "Square Online"],
  ["business.site", "builder", "Google Business Profile site"],
  ["sites.google.com", "builder", "Google Sites"],
  ["g.page", "google", "Google Business Profile"],
  ["goo.gl", "google", "Google short link"],
  ["maps.app.goo.gl", "google", "Google Maps link"],
  ["google.com", "google", "Google"],
  ["wixsite.com", "builder", "Wix subdomain"],
  ["weebly.com", "builder", "Weebly subdomain"],
  ["godaddysites.com", "builder", "GoDaddy subdomain"],
  ["webflow.io", "builder", "Webflow subdomain"],
  ["carrd.co", "builder", "Carrd"],
  ["mystrikingly.com", "builder", "Strikingly subdomain"],
  ["site123.me", "builder", "Site123 subdomain"],
  ["jimdosite.com", "builder", "Jimdo subdomain"],
  ["wordpress.com", "builder", "WordPress.com subdomain"],
  ["blogspot.com", "builder", "Blogger"],
  ["ueniweb.com", "builder", "Ueni"],
  ["yolasite.com", "builder", "Yola subdomain"],
  // link in bio
  ["linktr.ee", "link-in-bio", "Linktree"],
  ["linkin.bio", "link-in-bio", "Link in bio"],
  ["lnk.bio", "link-in-bio", "Lnk.bio"],
  ["beacons.ai", "link-in-bio", "Beacons"],
  // booking and payments
  ["squareup.com", "booking", "Square"],
  ["booksy.com", "booking", "Booksy"],
  ["fresha.com", "booking", "Fresha"],
  ["vagaro.com", "booking", "Vagaro"],
  ["styleseat.com", "booking", "StyleSeat"],
  ["schedulicity.com", "booking", "Schedulicity"],
  ["glossgenius.com", "booking", "GlossGenius"],
  ["setmore.com", "booking", "Setmore"],
  ["calendly.com", "booking", "Calendly"],
  ["acuityscheduling.com", "booking", "Acuity"],
  ["genbook.com", "booking", "Genbook"],
  ["mindbodyonline.com", "booking", "Mindbody"],
  ["housecallpro.com", "booking", "Housecall Pro"],
  ["getjobber.com", "booking", "Jobber"],
].map(([host, kind, label]) => ({ host, kind, label }));

export const THIRD_PARTY_HOSTS = Object.freeze(THIRD_PARTY);

export function hostOf(url) {
  const text = String(url ?? "").trim();
  if (!text) return "";
  try {
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
    return parsed.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return "";
  }
}

export function hostMatches(host, suffix) {
  return host === suffix || host.endsWith(`.${suffix}`);
}

// The third party platform a host belongs to, or null.
export function thirdPartyFor(host) {
  const h = String(host ?? "").toLowerCase().replace(/^www\./, "");
  if (!h) return null;
  // Longest suffix first so sites.google.com wins over google.com.
  let best = null;
  for (const entry of THIRD_PARTY_HOSTS) {
    if (hostMatches(h, entry.host) && (!best || entry.host.length > best.host.length)) best = entry;
  }
  return best;
}

// Classify a Places websiteUri (or any website field):
// "none" when empty, "third-party" for the hosts above, else "owned".
export function classifyWebsite(uri) {
  const host = hostOf(uri);
  if (!host) return { kind: "none", host: "", platform: "", platformKind: "" };
  const tp = thirdPartyFor(host);
  if (tp) return { kind: "third-party", host, platform: tp.label, platformKind: tp.kind };
  return { kind: "owned", host, platform: "", platformKind: "" };
}
