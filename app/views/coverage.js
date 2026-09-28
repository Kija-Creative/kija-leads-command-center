// #/coverage: where the leads are, which metros each run searched, and the rotation ahead.
// The upcoming rotation is computed in the browser with the same pure planWeek the CLI uses.

import { planWeek, runIdFor } from "/src/lib/week.js";
import { STATE_NAMES, tileMap } from "../components/tilemap.js";
import { fill, h } from "../lib/dom.js";
import { addDays, formatDay } from "../lib/format.js";
import { byScore, categoryLabel, leads, store } from "../lib/state.js";

const UPCOMING_WEEKS = 6;

function metroOf(ref) {
  const metros = store.data.geography?.metros ?? [];
  if (ref && typeof ref === "object") return metros.find((m) => m.key === ref.key) ?? ref;
  return metros.find((m) => m.key === ref || m.name === ref) ?? null;
}

function upcomingPlans() {
  const data = store.data;
  const ran = new Set((data.runs ?? []).map((r) => r.runId));
  const start = runIdFor(data.now ?? new Date().toISOString());
  const plans = [];
  for (let i = 0; plans.length < UPCOMING_WEEKS && i < UPCOMING_WEEKS + 2; i += 1) {
    const monday = addDays(start, i * 7);
    if (ran.has(monday)) continue;
    try {
      plans.push(planWeek({ now: monday, settings: data.settings, geography: data.geography, categories: data.categories, leads: [], queue: [], rejected: [] }));
    } catch {
      break;
    }
  }
  return plans;
}

export function render({ query, setQuery }) {
  const all = leads();
  const counts = {};
  for (const l of all) if (l.state) counts[l.state] = (counts[l.state] ?? 0) + 1;

  const covered = new Set();
  const coveredBy = {};
  for (const run of store.data.runs ?? []) {
    for (const ref of run.plan?.metros ?? []) {
      const m = metroOf(ref);
      for (const s of m?.states ?? []) {
        covered.add(s);
        (coveredBy[s] ??= new Set()).add(run.runId);
      }
    }
  }

  const plans = upcomingPlans();
  const upcoming = new Set();
  for (const p of plans) for (const m of p.metros) for (const s of m.states ?? []) upcoming.add(s);
  const homeKey = store.data.settings?.geography?.homeMetro;
  const home = new Set(metroOf(homeKey)?.states ?? []);

  let selected = query.get("state") ?? "";
  const mapHost = h("div");
  const side = h("div");

  function drawMap() {
    fill(mapHost, tileMap({ counts, covered, upcoming, home, selected, onPick: pick }));
  }

  function pick(code) {
    selected = selected === code ? "" : code;
    setQuery(selected ? { state: selected } : {});
    drawMap();
    drawSide();
    mapHost.querySelector(`[aria-pressed="true"]`)?.focus();
  }

  function rotationList() {
    if (!plans.length) {
      return h("div", { class: "empty" }, h("p", null, "No rotation to show. Check the geography settings and config/geography.json."));
    }
    return h(
      "ol",
      { class: "rotation" },
      plans.map((p) =>
        h(
          "li",
          null,
          h("div", { class: "wk" }, formatDay(p.runId), h("small", null, p.week)),
          h(
            "div",
            null,
            h("div", null, p.metros.map((m) => m.name).join(", ") || "No metros"),
            h("div", { class: "cats" }, p.categories.map(categoryLabel).join(", ")),
          ),
        ),
      ),
    );
  }

  function drawSide() {
    if (!selected) {
      fill(
        side,
        h("h2", { class: "section-title", style: { marginBottom: "10px" } }, "Upcoming rotation"),
        h("p", { class: "muted small", style: { marginBottom: "12px" } }, `${store.data.settings?.geography?.metrosPerWeek ?? 4} metros a week${store.data.settings?.geography?.homeEveryWeek ? ", plus the home metro every week" : ""}. Pick a state to see its leads.`),
        rotationList(),
      );
      return;
    }
    const inState = all.filter((l) => l.state === selected).sort(byScore);
    const metros = (store.data.geography?.metros ?? []).filter((m) => (m.states ?? []).includes(selected));
    const runs = [...(coveredBy[selected] ?? [])].sort().reverse();
    const next = plans.find((p) => p.metros.some((m) => (m.states ?? []).includes(selected)));
    fill(
      side,
      h("div", { class: "section-head" }, h("h2", { class: "section-title" }, STATE_NAMES[selected] ?? selected, h("span", { class: "count" }, `${inState.length} ${inState.length === 1 ? "lead" : "leads"}`)), h("button", { type: "button", class: "btn btn-small btn-quiet", onclick: () => pick(selected) }, "Show rotation")),
      inState.length
        ? h("ul", { class: "sources", style: { marginBottom: "16px" } }, inState.map((l) => h("li", null, h("a", { href: `#/lead/${encodeURIComponent(l.id)}` }, l.business), h("span", { class: "date" }, `${l.city}, score ${l.score?.total ?? ""}`))))
        : h("p", { class: "muted small", style: { marginBottom: "16px" } }, "No leads in this state yet."),
      h("h3", { class: "label", style: { marginBottom: "4px" } }, "Metros in the rotation"),
      metros.length ? h("p", { class: "small" }, metros.map((m) => m.name).join(", ")) : h("p", { class: "muted small" }, "None. No top 50 metro touches this state, so runs reach it only by chance."),
      h("h3", { class: "label", style: { margin: "14px 0 4px" } }, "Covered by runs"),
      h("p", { class: "small" }, runs.length ? runs.map((r) => `Week of ${formatDay(r, { year: true })}`).join(", ") : "Not covered by an ingested run yet."),
      next ? h("p", { class: "small muted", style: { marginTop: "8px" } }, `Next in the rotation the week of ${formatDay(next.runId, { year: true })}.`) : null,
    );
  }

  drawMap();
  drawSide();

  const runsList = (store.data.runs ?? []).map((r) => {
    const names = (r.plan?.metros ?? []).map((ref) => metroOf(ref)?.name ?? (typeof ref === "string" ? ref : ref?.key)).filter(Boolean);
    return h("li", null, h("div", { class: "wk" }, formatDay(r.runId), h("small", null, `${r.counts?.accepted ?? 0} accepted`)), h("div", null, names.join(", ") || h("span", { class: "faint" }, "No metros recorded")));
  });

  const el = h(
    "div",
    null,
    h(
      "header",
      { class: "page-head" },
      h(
        "div",
        null,
        h("h1", { class: "page-title", tabindex: "-1" }, "Coverage"),
        h("p", { class: "page-sub" }, `${all.length} leads across ${Object.keys(counts).length} ${Object.keys(counts).length === 1 ? "state" : "states"}. ${covered.size ? `Runs have searched ${covered.size} states.` : "No run has searched yet; the first Monday run starts the rotation."}`),
      ),
    ),
    h(
      "div",
      { class: "coverage" },
      h(
        "div",
        null,
        mapHost,
        h(
          "div",
          { class: "legend" },
          h("span", null, h("i", { class: "l-leads" }), "Leads, darker is more"),
          h("span", null, h("i", { class: "l-covered" }), "Covered by a run"),
          h("span", null, h("i", { class: "l-upcoming" }), `In the next ${UPCOMING_WEEKS} weeks`),
          h("span", null, h("i", { style: { position: "relative" } }, h("b", { style: { position: "absolute", top: "3px", right: "3px", width: "5px", height: "5px", borderRadius: "50%", background: "var(--magenta)" } })), "Home metro"),
        ),
      ),
      h("div", { class: "panel panel-pad" }, side),
    ),
    h(
      "section",
      { class: "section" },
      h("div", { class: "section-head" }, h("h2", { class: "section-title" }, "Metros each run covered")),
      runsList.length ? h("ol", { class: "rotation" }, runsList) : h("div", { class: "empty" }, h("p", null, "Each ingested run records the metros it searched. They appear here after the first Monday run.")),
    ),
  );
  return { el, title: "Coverage" };
}
