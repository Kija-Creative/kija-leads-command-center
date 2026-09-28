// Places discovery run: plan in, candidates file object out. Network access is
// the injected fetch; the caller (src/cli/discover-places.js) does file IO.
//
// Google Maps Platform terms: place IDs may be stored; other Places content in
// the candidates file must be refreshed or deleted within 30 days, which is
// why the file carries placesFetchedAt on every candidate and a delete-by date.

import {
  buildKnownIndex,
  buildSearchBody,
  buildSearchJobs,
  estimateRequests,
  filterPlaces,
  placesDeleteBy,
  searchTextPage,
  toCandidate,
  PLACES_MAX_PAGES,
} from "./places.js";
import { mapLimit } from "./text.js";

export const DISCOVER_DEFAULTS = Object.freeze({
  termsPerCategory: 1,
  anchorsPerMetro: 3,
  maxPages: PLACES_MAX_PAGES,
  maxRequests: 300,
  concurrency: 4,
});

export function planDiscovery({ plan, categories, geography, options = {} }) {
  const opts = { ...DISCOVER_DEFAULTS, ...options };
  opts.maxPages = Math.min(Math.max(1, Number(opts.maxPages) || 1), PLACES_MAX_PAGES);
  const { jobs, notes } = buildSearchJobs({
    plan,
    categories,
    geography,
    termsPerCategory: opts.termsPerCategory,
    anchorsPerMetro: opts.anchorsPerMetro,
  });
  return { jobs, notes, opts, estimate: estimateRequests(jobs.length, opts) };
}

// deps: { normalizeName(name), dedupeKey(record), isChain(name) -> { chain, match } }
export async function runDiscovery({
  plan,
  settings,
  categories,
  geography,
  state = {},
  deps,
  apiKey,
  fetch: fetchImpl,
  now,
  options = {},
  log = () => {},
}) {
  if (!apiKey) throw new Error("runDiscovery needs an API key; the CLI handles the no key case.");
  const fetchedAt = (now instanceof Date ? now : new Date(now)).toISOString();
  const { jobs, notes, opts, estimate } = planDiscovery({ plan, categories, geography, options });

  const progress = jobs.map(() => ({ pages: 0, places: 0, token: "", done: false, error: "" }));
  const hits = [];
  const errors = [];
  let requests = 0;
  let fatal = "";
  let cappedSearches = 0;

  // Breadth first: page 1 of every search, then page 2, then page 3, so a
  // request cap trims depth evenly instead of starving the last metros.
  for (let page = 1; page <= opts.maxPages && !fatal; page++) {
    const todo = [];
    progress.forEach((p, i) => {
      if (page === 1 || (!p.done && p.token)) todo.push(i);
    });
    const room = Math.max(0, opts.maxRequests - requests);
    const allowed = todo.slice(0, room);
    if (allowed.length < todo.length) {
      const skipped = todo.slice(allowed.length);
      // A capped search cannot resume later, so it is done and counted once.
      for (const i of skipped) progress[i].done = true;
      cappedSearches += skipped.length;
      log(`Request cap of ${opts.maxRequests} reached: page ${page} and later skipped for ${skipped.length} searches.`);
    }
    await mapLimit(allowed, opts.concurrency, async (i) => {
      if (fatal) return;
      const job = jobs[i];
      const body = buildSearchBody(job, {
        minRating: settings?.thresholds?.minRating,
        pageToken: page > 1 ? progress[i].token : "",
      });
      requests++;
      const result = await searchTextPage({ fetch: fetchImpl, apiKey, body });
      if (result.error) {
        progress[i].error = result.error;
        progress[i].done = true;
        errors.push({ query: job.textQuery, page, error: result.error });
        if (result.fatal && !fatal) fatal = result.error;
        return;
      }
      progress[i].pages++;
      progress[i].places += result.places.length;
      result.places.forEach((place, position) => hits.push({ place, job, jobIndex: i, page, position }));
      progress[i].token = result.nextPageToken;
      if (!result.nextPageToken) progress[i].done = true;
    });
  }
  if (fatal) log(`Stopped early: ${fatal}`);
  const moreAvailable = progress.filter((p) => !p.done && p.token).length;
  if (moreAvailable) log(`${moreAvailable} searches still had more results after ${opts.maxPages} pages.`);

  // Concurrency scrambles arrival order; sort so the output is deterministic.
  hits.sort((a, b) => a.jobIndex - b.jobIndex || a.page - b.page || a.position - b.position);

  const knownIndex = buildKnownIndex(state, deps);
  const { kept, dropped, notes: dropNotes } = filterPlaces({
    hits,
    thresholds: settings?.thresholds ?? {},
    knownIndex,
    deps,
  });

  const metroOrder = new Map(jobs.map((j, i) => [j.metro, i]).reverse());
  const candidates = kept
    .map((k) => toCandidate(k, { runId: plan?.runId ?? "", fetchedAt, categories, deps }))
    .sort((a, b) => (metroOrder.get(a.metro) ?? 0) - (metroOrder.get(b.metro) ?? 0)
      || b.reputationPoints - a.reputationPoints
      || a.business.localeCompare(b.business));

  const searched = jobs.map((job, i) => ({
    query: job.textQuery,
    source: "google-places-api",
    notes: progress[i].error
      ? `Error: ${progress[i].error}`
      : `${progress[i].pages} page${progress[i].pages === 1 ? "" : "s"}, ${progress[i].places} places returned.`,
  }));

  return {
    runId: plan?.runId ?? "",
    source: "google-places-text-search",
    fetchedAt,
    placesContentDeleteBy: placesDeleteBy(fetchedAt),
    terms: "Google Maps Platform terms: place IDs may be stored. Other Places content in this file must be refreshed or deleted within 30 days of fetchedAt.",
    plan: {
      metros: [...new Set(jobs.map((j) => j.metro))],
      categories: [...new Set(jobs.map((j) => j.categoryKey))],
    },
    options: { ...opts },
    estimate,
    counts: {
      searches: jobs.length,
      requests,
      cappedSearches,
      placesReturned: hits.length,
      kept: candidates.length,
      thirdPartyFlagged: candidates.filter((c) => c.websiteFlag === "third-party").length,
      dropped,
    },
    notes: [...notes, ...dropNotes.chain.map((n) => `Chain: ${n}`), ...dropNotes.known.map((n) => `Already known: ${n}`)],
    fatal,
    errors,
    searched,
    candidates,
  };
}
