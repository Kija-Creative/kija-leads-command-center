// Domain probe: guess the domains a business might own, check each with a DNS
// lookup and then one HTTPS GET (HTTP if HTTPS fails), following redirects by
// hand so the chain is visible. Network access is injected (lookup, fetch) so
// tests never touch the network. The probe only ever sends GET requests with
// no body: it never submits a form or posts anything to anyone.

import { candidateDomains, cleanDomain, PROBE_TLDS } from "./domains.js";
import { detectParked, extractTitle, metaRefreshUrl, pageMentions, isParkingHost } from "./parked.js";
import { hostOf, thirdPartyFor } from "./hosts.js";
import { isoDate, mapLimit, phoneDigits, plainText } from "./text.js";

export const PROBE_DEFAULTS = Object.freeze({
  concurrency: 4,
  lookupTimeoutMs: 4000,
  requestTimeoutMs: 8000,
  totalTimeoutMs: 45000,
  maxCandidates: 64,
  maxRedirects: 5,
  maxBytes: 400000,
  userAgent: "Mozilla/5.0 (compatible; KijaLeadProbe/1.0; one GET per domain, research only)",
});

function timeout(ms, message) {
  let timer;
  const promise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return { promise, clear: () => clearTimeout(timer) };
}

async function resolveHost(host, ctx) {
  if (ctx.signal.aborted) return null;
  const t = timeout(ctx.lookupTimeoutMs, "DNS lookup timed out");
  try {
    const result = await Promise.race([ctx.lookup(host), t.promise, ctx.aborted]);
    const address = Array.isArray(result) ? result[0]?.address : result?.address ?? (typeof result === "string" ? result : "");
    return address ? { host, address } : null;
  } catch {
    return null;
  } finally {
    t.clear();
  }
}

async function readBody(res, maxBytes) {
  if (res.body && typeof res.body.getReader === "function") {
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: false });
    let text = "";
    let bytes = 0;
    try {
      while (bytes < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        text += decoder.decode(value, { stream: true });
      }
    } finally {
      reader.cancel().catch(() => {});
    }
    return text + decoder.decode();
  }
  const text = typeof res.text === "function" ? await res.text() : "";
  return text.slice(0, maxBytes);
}

async function discardBody(res) {
  try {
    if (res.body && typeof res.body.cancel === "function") await res.body.cancel();
  } catch {
    // Nothing to clean up.
  }
}

// GET a URL and follow redirects by hand. Stops at parking and third party
// hosts without fetching them: the redirect itself is the evidence.
async function getPage(startUrl, ctx) {
  let url = startUrl;
  const redirects = [];
  for (let hop = 0; hop <= ctx.maxRedirects; hop++) {
    const signal = AbortSignal.any([ctx.signal, AbortSignal.timeout(ctx.requestTimeoutMs)]);
    const res = await ctx.fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": ctx.userAgent, Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5" },
      signal,
    });
    const location = res.headers?.get?.("location");
    if (res.status >= 300 && res.status < 400 && location) {
      await discardBody(res);
      let next;
      try {
        next = new URL(location, url);
      } catch {
        return { status: res.status, finalUrl: url, redirects, html: "", stoppedAt: "", error: `Bad redirect location: ${location}` };
      }
      if (next.protocol !== "https:" && next.protocol !== "http:") {
        return { status: res.status, finalUrl: url, redirects, html: "", stoppedAt: "", error: `Redirect to a non web URL: ${next.protocol}` };
      }
      redirects.push(next.href);
      const host = hostOf(next.href);
      if (isParkingHost(host) || thirdPartyFor(host)) {
        return { status: res.status, finalUrl: next.href, redirects, html: "", stoppedAt: host, error: "" };
      }
      url = next.href;
      continue;
    }
    const html = await readBody(res, ctx.maxBytes);
    return { status: res.status, finalUrl: url, redirects, html, stoppedAt: "", error: "" };
  }
  return { status: null, finalUrl: url, redirects, html: "", stoppedAt: "", error: `More than ${ctx.maxRedirects} redirects.` };
}

function emptyRecord(domain) {
  return {
    domain,
    resolves: false,
    host: "",
    address: "",
    url: "",
    status: null,
    finalUrl: "",
    redirects: [],
    title: "",
    textChars: 0,
    mentionsPhone: false,
    mentionsName: false,
    mentionsCity: false,
    parked: false,
    parkedReasons: [],
    thirdParty: "",
    classification: "unresolved",
    error: "",
  };
}

function classify(record) {
  if (!record.resolves) return "unresolved";
  if (record.thirdParty) return "third-party";
  if (record.parked) return "parked";
  if (record.status === null) return "no-response";
  if (record.status >= 400) return "http-error";
  if (record.mentionsPhone) return "live-phone-match";
  if (record.mentionsName) return "live-name-match";
  return "live-unrelated";
}

export async function checkDomain(domain, ctx) {
  const record = emptyRecord(domain);
  const resolved = (await resolveHost(domain, ctx)) || (await resolveHost(`www.${domain}`, ctx));
  if (!resolved) {
    if (ctx.signal.aborted) record.error = "Stopped at the total time limit.";
    return record;
  }
  record.resolves = true;
  record.host = resolved.host;
  record.address = resolved.address;

  let page = null;
  for (const scheme of ["https", "http"]) {
    record.url = `${scheme}://${resolved.host}/`;
    try {
      page = await getPage(record.url, ctx);
      break;
    } catch (err) {
      record.error = ctx.signal.aborted ? "Stopped at the total time limit." : `${scheme.toUpperCase()} request failed: ${err?.cause?.code || err?.name || "error"}.`;
      if (ctx.signal.aborted) break;
    }
  }
  if (page) {
    record.error = page.error;
    record.status = page.status;
    record.finalUrl = page.finalUrl;
    record.redirects = page.redirects;
    record.title = extractTitle(page.html);
    record.textChars = plainText(page.html).length;
    const refresh = metaRefreshUrl(page.html, page.finalUrl);
    const chain = refresh ? [...page.redirects, refresh] : page.redirects;
    if (refresh) record.redirects = chain;
    const tp = [page.finalUrl, ...chain].map((u) => thirdPartyFor(hostOf(u))).find(Boolean);
    record.thirdParty = tp ? tp.host : "";
    const parked = detectParked({ finalUrl: page.finalUrl, redirects: chain, html: page.html });
    record.parked = parked.parked;
    record.parkedReasons = parked.reasons;
    const mentions = pageMentions(page.html, { name: ctx.name, phone: ctx.phone, city: ctx.city });
    record.mentionsPhone = mentions.mentionsPhone;
    record.mentionsName = mentions.mentionsName;
    record.mentionsCity = mentions.mentionsCity;
  }
  record.classification = classify(record);
  return record;
}

function list(items, max = 3) {
  const shown = items.slice(0, max).join(", ");
  return items.length > max ? `${shown} and ${items.length - max} more` : shown;
}

function summarize({ name, city, results, skipped, totalTimeoutMs }) {
  const checked = results.length;
  const resolved = results.filter((r) => r.resolves);
  const live = resolved.filter((r) => r.status !== null && r.status < 400 && !r.thirdParty);
  const parked = resolved.filter((r) => r.parked);
  const thirdParty = resolved.filter((r) => r.thirdParty);
  const phoneMatches = resolved.filter((r) => r.classification === "live-phone-match");
  const nameMatches = resolved.filter((r) => r.classification === "live-name-match");
  const counts = {
    checked,
    skipped: skipped.length,
    resolved: resolved.length,
    live: live.length,
    parked: parked.length,
    thirdParty: thirdParty.length,
    phoneMatches: phoneMatches.length,
    nameMatches: nameMatches.length,
  };

  const seconds = totalTimeoutMs % 1000 === 0 ? totalTimeoutMs / 1000 : (totalTimeoutMs / 1000).toFixed(1);
  const tail = skipped.length
    ? ` ${skipped.length} more were not checked before the ${seconds} second limit.`
    : "";
  if (phoneMatches.length) {
    const best = phoneMatches[0];
    return {
      counts,
      verdict: "owned-domain-found",
      result: `Domain probe found ${best.domain} live and showing the business phone${best.mentionsName ? " and name" : ""}. Treat it as an owned website and inspect it before scoring.${tail}`,
      url: best.finalUrl || best.url,
    };
  }
  if (nameMatches.length) {
    const best = nameMatches[0];
    return {
      counts,
      verdict: "possible-owned-domain",
      result: `Domain probe found ${best.domain} live and naming "${name}" but not showing the phone${city ? `, and the page ${best.mentionsCity ? "does" : "does not"} mention ${city}` : ""}. Open it and confirm whether it belongs to this business.${tail}`,
      url: best.finalUrl || best.url,
    };
  }
  const parts = [`${resolved.length} resolve`, `${live.length} serve a page`];
  if (parked.length) parts.push(`${parked.length} look parked or for sale`);
  if (thirdParty.length) parts.push(`${thirdParty.length} forward to a third party profile (${list(thirdParty.map((r) => `${r.domain} to ${r.thirdParty}`))})`);
  return {
    counts,
    verdict: "no-owned-domain-found",
    result: `Domain probe checked ${checked} guessed domains for "${name}": ${parts.join(", ")}, and none shows the business phone or name.${tail}`,
    url: "",
  };
}

// Probe a business. Returns JSON evidence; `check` is ready to paste into
// verification.checks.
export async function probeBusiness({
  name,
  city = "",
  state = "",
  phone = "",
  extraDomains = [],
  lookup,
  fetch: fetchImpl,
  now,
  ...overrides
}) {
  if (!name || !String(name).trim()) throw new Error("probeBusiness needs a business name.");
  if (typeof lookup !== "function") throw new Error("probeBusiness needs a lookup function.");
  if (typeof fetchImpl !== "function") throw new Error("probeBusiness needs a fetch function.");
  const opts = { ...PROBE_DEFAULTS, ...overrides };

  const generated = candidateDomains({ name, city, state, max: opts.maxCandidates });
  const extras = extraDomains.map(cleanDomain).filter(Boolean);
  const domains = [...new Set([...extras, ...generated])];

  const controller = new AbortController();
  let rejectAborted;
  const aborted = new Promise((_, reject) => {
    rejectAborted = reject;
  });
  aborted.catch(() => {});
  const deadline = setTimeout(() => {
    controller.abort();
    rejectAborted(new Error("Total time limit reached"));
  }, opts.totalTimeoutMs);

  const ctx = {
    ...opts,
    name,
    city,
    phone,
    lookup,
    fetch: fetchImpl,
    signal: controller.signal,
    aborted,
  };

  let records;
  try {
    records = await mapLimit(domains, opts.concurrency, async (domain) => {
      if (controller.signal.aborted) return { domain, skipped: true };
      try {
        const record = await checkDomain(domain, ctx);
        // A lookup cut short by the deadline is unknown, not "does not resolve".
        if (!record.resolves && controller.signal.aborted) return { domain, skipped: true };
        return record;
      } catch (err) {
        const record = emptyRecord(domain);
        record.error = `Probe error: ${err?.message || String(err)}`;
        return record;
      }
    });
  } finally {
    clearTimeout(deadline);
  }

  const skipped = records.filter((r) => r.skipped).map((r) => r.domain);
  const results = records.filter((r) => !r.skipped);
  const summary = summarize({ name, city, results, skipped, totalTimeoutMs: opts.totalTimeoutMs });

  return {
    tool: "kija-domain-probe",
    checkedAt: now ? isoDate(now) : "",
    business: { name, city, state, phone, phoneDigits: phoneDigits(phone) },
    method: {
      tlds: [...PROBE_TLDS],
      requests: "DNS lookup, then one GET per resolving domain (HTTPS first, HTTP if HTTPS fails), redirects followed by hand up to 5 hops. Nothing but GET is ever sent.",
      concurrency: opts.concurrency,
      totalTimeoutMs: opts.totalTimeoutMs,
      extraDomains: extras,
    },
    candidates: domains.length,
    complete: skipped.length === 0,
    counts: summary.counts,
    verdict: summary.verdict,
    check: { check: "domain probe", result: summary.result, url: summary.url },
    findings: results.filter((r) => r.resolves),
    unresolved: results.filter((r) => !r.resolves).map((r) => r.domain),
    skipped,
  };
}
