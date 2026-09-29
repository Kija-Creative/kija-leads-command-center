// Places discovery run: plan in, transient candidates file object out.
// Network access is the injected fetch; the caller (src/cli/discover-places.js)
// does file IO and keeps the monthly request count.
//
// Google Maps Platform terms: only place IDs may be stored. Every Places
// response stays in memory; the returned file holds place IDs plus the
// minimum needed to research each business, and is deleted when the run ends
// (npm run purge-places). See research/places-api.md section 6.

import {
  buildKnownIndex,
  buildSearchBody,
  buildSearchJobs,
  estimateRequests,
  filterPlaces,
  reputationPoints,
  searchTextPage,
  toCandidate,
  PLACES_FILE_NOTICE,
  PLACES_MAX_PAGES,
  PLACES_PURGE_COMMAND,
} from "./places.js";
import { mapLimit } from "./text.js";

// About 150 requests a week keeps a month under the 900 guard and Google's
// 1,000 free (research/places-api.md section 4): 5 metros x 6 categories x
// 2 areas is 60 searches, 60 to 180 requests.
export const DISCOVER_DEFAULTS = Object.freeze({
  termsPerCategory: 1,
  anchorsPerMetro: 2,
  maxPages: PLACES_MAX_PAGES,
  maxRequests: 180,
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
// budget: { remaining } from src/discovery/budget.js; the run never sends more.
// onRequest(): called once per request sent, so the caller can count usage.
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
  budget = null,
  onRequest = () => {},
  log = () => {},
}) {
  if (!apiKey) throw new Error("runDiscovery needs an API key; the CLI handles the no key case.");
  const fetchedAt = (now instanceof Date ? now : new Date(now)).toISOString();
  const { jobs, notes, opts, estimate } = planDiscovery({ plan, categories, geography, options });

  const monthlyRoom = Number.isFinite(budget?.remaining) ? Math.max(0, budget.remaining) : Infinity;
  const cap = Math.min(opts.maxRequests, monthlyRoom);
  const capLabel = cap < opts.maxRequests ? `monthly guard (${monthlyRoom} left this month)` : "per run cap";
  if (cap < opts.maxRequests) log(`The monthly guard allows ${monthlyRoom} more requests, below the per run cap of ${opts.maxRequests}.`);

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
    const room = Math.max(0, cap - requests);
    const allowed = todo.slice(0, room);
    if (allowed.length < todo.length) {
      const skipped = todo.slice(allowed.length);
      // A capped search cannot resume later, so it is done and counted once.
      for (const i of skipped) progress[i].done = true;
      cappedSearches += skipped.length;
      log(`Request cap of ${cap} reached (${capLabel}): page ${page} and later skipped for ${skipped.length} searches.`);
    }
    await mapLimit(allowed, opts.concurrency, async (i) => {
      if (fatal) return;
      const job = jobs[i];
      const body = buildSearchBody(job, {
        minRating: settings?.thresholds?.minRating,
        pageToken: page > 1 ? progress[i].token : "",
      });
      requests++;
      onRequest();
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

  // Strongest reputations first within a metro. The ordering uses Places
  // rating and review count in memory; neither value is written.
  const metroOrder = new Map(jobs.map((j, i) => [j.metro, i]).reverse());
  const ordered = kept
    .map((k) => ({ k, points: reputationPoints(k.hit.place.rating ?? 0, k.hit.place.userRatingCount ?? 0) }))
    .sort((a, b) => (metroOrder.get(a.k.hit.job.metro) ?? 0) - (metroOrder.get(b.k.hit.job.metro) ?? 0)
      || b.points - a.points
      || a.k.hit.jobIndex - b.k.hit.jobIndex
      || a.k.hit.page - b.k.hit.page
      || a.k.hit.position - b.k.hit.position);
  const candidates = ordered.map(({ k }) => toCandidate(k, { fetchedAt, categories }));

  const searched = jobs.map((job, i) => ({
    query: job.textQuery,
    source: "google-places-api",
    notes: progress[i].error
      ? `Error: ${progress[i].error}`
      : `${progress[i].pages} page${progress[i].pages === 1 ? "" : "s"}, ${progress[i].places} places returned.`,
  }));

  return {
    notice: PLACES_FILE_NOTICE,
    deleteAfterRun: true,
    purgeCommand: PLACES_PURGE_COMMAND,
    runId: plan?.runId ?? "",
    source: "google-places-text-search",
    fetchedAt,
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
      serviceArea: candidates.filter((c) => c.serviceArea).length,
      dropped,
    },
    notes: [
      ...notes,
      ...dropNotes.suppressed.map((n) => `Suppressed: ${n}`),
      ...dropNotes.chain.map((n) => `Chain, spot check before relying on it: ${n}`),
      ...dropNotes.known.map((n) => `Already known: ${n}`),
    ],
    fatal,
    errors,
    searched,
    candidates,
  };
}
