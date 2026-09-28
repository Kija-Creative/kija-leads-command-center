// #/pipeline: every lead. A sortable, filterable table, or a board by outreach stage.
// Filters live in the hash so a filtered view survives reloads and the back button.

import { statusChip, confidenceChip, demoChip } from "../components/chips.js";
import { listNav } from "../components/listnav.js";
import { scoreBlock } from "../components/score.js";
import { fill, h } from "../lib/dom.js";
import { formatDay, number, place, rating } from "../lib/format.js";
import { byScore, categoryLabel, leads, metroName, OUTREACH_STATUSES, stageCounts, store } from "../lib/state.js";

const SORTS = {
  score: (a, b) => (a.score?.total ?? 0) - (b.score?.total ?? 0),
  business: (a, b) => String(a.business).localeCompare(String(b.business)),
  city: (a, b) => place(a).localeCompare(place(b)),
  rating: (a, b) => (a.googleRating ?? 0) - (b.googleRating ?? 0),
  reviews: (a, b) => (a.googleReviews ?? 0) - (b.googleReviews ?? 0),
  status: (a, b) => OUTREACH_STATUSES.indexOf(a.outreach?.status) - OUTREACH_STATUSES.indexOf(b.outreach?.status),
  nextDate: (a, b) => String(a.outreach?.nextDate || "9999").localeCompare(String(b.outreach?.nextDate || "9999")),
  added: (a, b) => String(a.addedAt).localeCompare(String(b.addedAt)),
};
const DEFAULT_DIR = { score: "desc", rating: "desc", reviews: "desc", added: "desc" };

function uniq(values) {
  return [...new Set(values.filter((v) => v !== undefined && v !== null))];
}

function select(id, label, value, options, onChange) {
  return h(
    "div",
    { class: "field" },
    h("label", { for: id }, label),
    h(
      "select",
      { id, onchange: (e) => onChange(e.target.value) },
      options.map(([v, text]) => h("option", { value: v, selected: v === value }, text)),
    ),
  );
}

export function render({ query, setQuery, navigate }) {
  const all = leads();
  const f = {
    q: query.get("q") ?? "",
    status: query.get("status") ?? "",
    state: query.get("state") ?? "",
    metro: query.get("metro") ?? "",
    category: query.get("category") ?? "",
    min: query.get("min") ?? "",
    max: query.get("max") ?? "",
    run: query.get("run") ?? "",
    sort: SORTS[query.get("sort")] ? query.get("sort") : "score",
    dir: query.get("dir") === "asc" || query.get("dir") === "desc" ? query.get("dir") : null,
    view: query.get("view") === "board" ? "board" : "table",
  };

  const results = h("div");
  const strip = h("div", { class: "stage-strip", role: "group", "aria-label": "Filter by outreach stage" });
  const countLine = h("p", { class: "muted small", "aria-live": "polite" });
  let onKey = () => false;

  function commit() {
    const params = {};
    for (const [k, v] of Object.entries(f)) {
      if (v === "" || v === null) continue;
      if (k === "sort" && v === "score") continue;
      if (k === "view" && v === "table") continue;
      params[k] = v;
    }
    setQuery(params);
    draw();
  }

  function matches(l, { ignoreStatus = false } = {}) {
    if (!ignoreStatus && f.status && l.outreach?.status !== f.status) return false;
    if (f.state && l.state !== f.state) return false;
    if (f.metro && (l.metro || "") !== (f.metro === "none" ? "" : f.metro)) return false;
    if (f.category && l.categoryKey !== f.category) return false;
    if (f.run && (f.run === "sheet" ? l.runId : l.runId !== f.run)) return false;
    const total = l.score?.total ?? 0;
    if (f.min !== "" && total < Number(f.min)) return false;
    if (f.max !== "" && total > Number(f.max)) return false;
    if (f.q) {
      const hay = `${l.business} ${l.category} ${l.city} ${l.area} ${l.state} ${l.phone} ${l.outreach?.nextAction ?? ""}`.toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  }

  function sorted(list) {
    const dir = f.dir ?? DEFAULT_DIR[f.sort] ?? "asc";
    const cmp = SORTS[f.sort];
    return [...list].sort((a, b) => (dir === "desc" ? -cmp(a, b) : cmp(a, b)) || byScore(a, b));
  }

  function drawStrip() {
    const counts = stageCounts(all.filter((l) => matches(l, { ignoreStatus: true })));
    fill(
      strip,
      OUTREACH_STATUSES.map((s) =>
        h(
          "button",
          {
            type: "button",
            class: counts[s] ? "" : "is-zero",
            "aria-pressed": String(f.status === s),
            onclick: () => {
              f.status = f.status === s ? "" : s;
              statusSelect.value = f.status;
              commit();
            },
          },
          h("b", null, String(counts[s])),
          s,
        ),
      ),
    );
  }

  function sortHeader(key, label, cls = "") {
    const active = f.sort === key;
    const dir = f.dir ?? DEFAULT_DIR[key] ?? "asc";
    return h(
      "th",
      { scope: "col", class: cls, "aria-sort": active ? (dir === "asc" ? "ascending" : "descending") : null },
      h(
        "button",
        {
          type: "button",
          onclick: () => {
            if (f.sort === key) f.dir = dir === "asc" ? "desc" : "asc";
            else {
              f.sort = key;
              f.dir = null;
            }
            commit();
          },
        },
        label,
        active ? h("span", { class: "arrow", "aria-hidden": "true" }, dir === "asc" ? "▲" : "▼") : null,
      ),
    );
  }

  function drawTable(list) {
    const items = list.map((l) => {
      const link = h("a", { href: `#/lead/${encodeURIComponent(l.id)}` }, l.business);
      const tr = h(
        "tr",
        { dataset: { id: l.id } },
        h("td", { class: "score-cell" }, scoreBlock(l.score, { interactive: false, label: false })),
        h("td", { class: "biz" }, link, h("span", null, l.category || categoryLabel(l.categoryKey))),
        h("td", { class: "hide-sm" }, place(l)),
        h("td", { class: "num hide-sm" }, rating(l.googleRating)),
        h("td", { class: "num hide-md" }, number(l.googleReviews)),
        h("td", { class: "num hide-md", title: "Website gap, ticket value, visual fit" }, `${l.websiteGap} ${l.ticketValue} ${l.visualFit}`),
        h("td", null, statusChip(l.outreach?.status)),
        h("td", { class: "hide-sm" }, l.outreach?.nextAction || h("span", { class: "faint" }, "None")),
        h("td", { class: "hide-md" }, l.outreach?.nextDate ? formatDay(l.outreach.nextDate) : ""),
        h("td", { class: "hide-md" }, confidenceChip(l.confidence)),
        h("td", { class: "hide-md" }, demoChip(l)),
      );
      return { el: tr, link, id: l.id };
    });
    const table = h(
      "table",
      { class: "data" },
      h("caption", { class: "visually-hidden" }, "Leads, sortable by column"),
      h(
        "thead",
        null,
        h(
          "tr",
          null,
          sortHeader("score", "Score"),
          sortHeader("business", "Business"),
          sortHeader("city", "Location", "hide-sm"),
          sortHeader("rating", "Rating", "num hide-sm"),
          sortHeader("reviews", "Reviews", "num hide-md"),
          h("th", { scope: "col", class: "num hide-md", title: "Website gap, ticket value, visual fit, each 1 to 3" }, "Gap Tkt Vis"),
          sortHeader("status", "Status"),
          h("th", { scope: "col", class: "hide-sm" }, "Next action"),
          sortHeader("nextDate", "Next date", "hide-md"),
          h("th", { scope: "col", class: "hide-md" }, "Confidence"),
          h("th", { scope: "col", class: "hide-md" }, "Demo"),
        ),
      ),
      h("tbody", null, items.map((i) => i.el)),
    );
    onKey = listNav(items, { navigate });
    return h("div", { class: "table-wrap" }, table);
  }

  function drawBoard(list) {
    const cols = OUTREACH_STATUSES.map((s) => {
      const inCol = list.filter((l) => l.outreach?.status === s);
      return h(
        "section",
        { class: "board-col", "aria-label": `${s}, ${inCol.length}` },
        h("h3", null, s, h("b", null, String(inCol.length))),
        inCol.length
          ? h(
            "ul",
            null,
            inCol.map((l) =>
              h(
                "li",
                null,
                h(
                  "a",
                  { class: "board-card", href: `#/lead/${encodeURIComponent(l.id)}` },
                  h("div", { class: "top" }, h("strong", null, l.business), h("span", { class: "n" }, String(l.score?.total ?? ""))),
                  h("p", null, place(l)),
                  l.outreach?.nextAction ? h("p", null, l.outreach.nextAction) : null,
                ),
              ),
            ),
          )
          : h("p", { class: "board-empty" }, "Nothing at this stage."),
      );
    });
    store.order = OUTREACH_STATUSES.flatMap((s) => list.filter((l) => l.outreach?.status === s).map((l) => l.id));
    onKey = () => false;
    return h("div", { class: "board" }, cols);
  }

  function draw() {
    drawStrip();
    const list = sorted(all.filter((l) => matches(l)));
    countLine.textContent = list.length === all.length ? `${all.length} leads` : `${list.length} of ${all.length} leads match`;
    if (!all.length) {
      fill(results, h("div", { class: "empty" }, h("h2", null, "No leads yet"), h("p", null, "Leads arrive from the Monday run (npm run ingest) or the one time sheet import (npm run seed). Promoted research queue items land here too.")));
      return;
    }
    if (!list.length) {
      store.order = [];
      onKey = () => false;
      fill(
        results,
        h(
          "div",
          { class: "empty" },
          h("h2", null, "No leads match these filters"),
          h("p", null, "Loosen a filter, or clear them all."),
          h("div", { class: "form-actions" }, h("button", { type: "button", class: "btn", onclick: clearAll }, "Clear filters")),
        ),
      );
      return;
    }
    fill(results, f.view === "board" ? drawBoard(list) : drawTable(list));
  }

  function clearAll() {
    Object.assign(f, { q: "", status: "", state: "", metro: "", category: "", min: "", max: "", run: "" });
    search.value = "";
    statusSelect.value = "";
    for (const el of [stateSel, metroSel, catSel, runSel]) el.querySelector("select").value = "";
    minInput.value = "";
    maxInput.value = "";
    commit();
  }

  const search = h("input", {
    id: "pl-q",
    type: "search",
    placeholder: "Business, city, phone",
    value: f.q,
    autocomplete: "off",
    oninput: (e) => {
      f.q = e.target.value.trim();
      commit();
    },
  });
  const statusSelect = h(
    "select",
    { id: "pl-status", onchange: (e) => { f.status = e.target.value; commit(); } },
    [["", "Any status"], ...OUTREACH_STATUSES.map((s) => [s, s])].map(([v, t]) => h("option", { value: v, selected: v === f.status }, t)),
  );
  const states = uniq(all.map((l) => l.state)).sort();
  const metros = uniq(all.map((l) => l.metro || "none"));
  const cats = uniq(all.map((l) => l.categoryKey)).sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b)));
  const runIds = uniq([...(store.data.runs ?? []).map((r) => r.runId), ...all.map((l) => l.runId).filter(Boolean)]).sort().reverse();

  const stateSel = select("pl-state", "State", f.state, [["", "Any state"], ...states.map((s) => [s, s])], (v) => { f.state = v; commit(); });
  const metroSel = select("pl-metro", "Metro", f.metro, [["", "Any metro"], ...metros.map((m) => [m, m === "none" ? "Outside every metro" : metroName(m)])], (v) => { f.metro = v; commit(); });
  const catSel = select("pl-category", "Category", f.category, [["", "Any category"], ...cats.map((c) => [c, categoryLabel(c)])], (v) => { f.category = v; commit(); });
  const runSel = select("pl-run", "Run", f.run, [["", "Any run"], ["sheet", "Sheet import"], ...runIds.map((r) => [r, `Week of ${formatDay(r, { year: true })}`])], (v) => { f.run = v; commit(); });
  const scoreInput = (id, value, key, placeholder) =>
    h("input", {
      id,
      type: "number",
      min: "0",
      max: "100",
      inputmode: "numeric",
      placeholder,
      value,
      style: { width: "5.5rem" },
      oninput: (e) => {
        f[key] = e.target.value;
        commit();
      },
    });
  const minInput = scoreInput("pl-min", f.min, "min", "0");
  const maxInput = scoreInput("pl-max", f.max, "max", "100");

  const viewSwitch = h(
    "div",
    { class: "segmented", role: "group", "aria-label": "Layout" },
    ["table", "board"].map((v) =>
      h(
        "button",
        {
          type: "button",
          "aria-pressed": String(f.view === v),
          title: "Switch with b",
          onclick: (e) => {
            f.view = v;
            for (const b of e.currentTarget.parentElement.children) b.setAttribute("aria-pressed", String(b === e.currentTarget));
            commit();
          },
        },
        v === "table" ? "Table" : "Board",
      ),
    ),
  );

  const el = h(
    "div",
    null,
    h(
      "header",
      { class: "page-head" },
      h("div", null, h("h1", { class: "page-title", tabindex: "-1" }, "Pipeline"), countLine),
      h("div", { class: "row" }, viewSwitch, h("a", { class: "btn", href: "/api/export.csv", download: true }, "Export CSV")),
    ),
    strip,
    h(
      "div",
      { class: "toolbar", role: "search" },
      h("div", { class: "field field-search" }, h("label", { for: "pl-q" }, "Search ", h("span", { class: "hint" }, "press /")), search),
      h("div", { class: "field" }, h("label", { for: "pl-status" }, "Status"), statusSelect),
      stateSel,
      metroSel,
      catSel,
      runSel,
      h("div", { class: "field" }, h("span", { id: "pl-score-label" }, "Score range"), h("div", { class: "row", role: "group", "aria-labelledby": "pl-score-label" }, h("label", { class: "visually-hidden", for: "pl-min" }, "Minimum score"), minInput, h("span", { class: "faint", "aria-hidden": "true" }, "to"), h("label", { class: "visually-hidden", for: "pl-max" }, "Maximum score"), maxInput)),
    ),
    results,
  );

  draw();

  return {
    el,
    title: "Pipeline",
    onKey(e) {
      if (e.key === "/") {
        search.focus();
        search.select();
        return true;
      }
      if (e.key === "b") {
        f.view = f.view === "board" ? "table" : "board";
        for (const b of viewSwitch.children) b.setAttribute("aria-pressed", String(b.textContent.toLowerCase() === f.view));
        commit();
        return true;
      }
      return onKey(e);
    },
  };
}
