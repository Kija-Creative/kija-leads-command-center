// #/runs: every ingested run, newest first, each with its full report.

import { h } from "../lib/dom.js";
import { formatDateTime, formatDay } from "../lib/format.js";
import { leadById, store } from "../lib/state.js";
import { planNames, runCounts } from "./week.js";

function idList(ids, { linkLeads = false } = {}) {
  if (!Array.isArray(ids) || !ids.length) return h("p", { class: "faint small" }, "None.");
  return h(
    "ul",
    null,
    ids.map((id) => {
      const key = typeof id === "string" ? id : id?.id ?? id?.business ?? "";
      const lead = linkLeads ? leadById(key) : null;
      return h("li", null, lead ? h("a", { href: `#/lead/${encodeURIComponent(key)}` }, lead.business) : key);
    }),
  );
}

function namedList(items, render) {
  if (!Array.isArray(items) || !items.length) return h("p", { class: "faint small" }, "None.");
  return h("ul", null, items.map((x) => h("li", null, render(x))));
}

function runBlock(run, open) {
  const c = run.counts ?? {};
  const metros = planNames(run.plan?.metros, "metro");
  const cats = planNames(run.plan?.categories, "category");
  return h(
    "details",
    { class: "panel run", open },
    h(
      "summary",
      null,
      h("div", null, h("h2", null, `Week of ${formatDay(run.runId, { year: true })}`), h("p", { class: "muted" }, `${run.mode ?? "weekly"} run, ingested ${formatDateTime(run.ingestedAt)}`)),
      h(
        "div",
        { class: "run-counts" },
        h("span", null, h("b", null, String(c.accepted ?? 0)), "accepted"),
        h("span", null, h("b", null, String(c.queued ?? 0)), "queued"),
        h("span", null, h("b", null, String(c.rejected ?? 0)), "rejected"),
        c.errors ? h("span", { style: { color: "var(--danger)" } }, h("b", null, String(c.errors)), "errors") : null,
      ),
    ),
    h(
      "div",
      { class: "run-body" },
      runCounts(run),
      h(
        "div",
        { class: "two-col" },
        h("div", null, h("h3", null, "Metros"), metros.length ? h("p", null, metros.join(", ")) : h("p", { class: "faint small" }, "Not recorded.")),
        h("div", null, h("h3", null, "Categories"), cats.length ? h("p", null, cats.join(", ")) : h("p", { class: "faint small" }, "Not recorded.")),
      ),
      h(
        "div",
        { class: "two-col" },
        h("div", null, h("h3", null, "Accepted"), idList(run.accepted, { linkLeads: true })),
        h("div", null, h("h3", null, "Queued"), idList(run.queued)),
      ),
      h(
        "div",
        { class: "two-col" },
        h("div", null, h("h3", null, "Duplicates"), namedList(run.duplicates, (d) => `${d.business} matched ${d.matched}${d.in ? ` in ${d.in}` : ""}`)),
        h("div", null, h("h3", null, "Reverified"), idList(run.reverified, { linkLeads: true })),
      ),
      h("div", null, h("h3", null, "Errors"), namedList(run.errors, (e) => [h("strong", null, e.business || "Unnamed"), h("ul", null, (e.errors ?? []).map((t) => h("li", null, t)))])),
      h("div", null, h("h3", null, "Warnings"), namedList(run.warnings, (w) => [h("strong", null, w.business || "Batch"), h("ul", null, (w.warnings ?? []).map((t) => h("li", null, t)))])),
      h(
        "div",
        null,
        h("h3", null, "Searches"),
        Array.isArray(run.searched) && run.searched.length
          ? h(
            "div",
            { class: "table-wrap" },
            h(
              "table",
              { class: "data" },
              h("thead", null, h("tr", null, h("th", { scope: "col" }, "Query"), h("th", { scope: "col" }, "Source"), h("th", { scope: "col" }, "Notes"))),
              h("tbody", null, run.searched.map((s) => h("tr", null, h("td", null, s.query), h("td", null, s.source), h("td", null, s.notes)))),
            ),
          )
          : h("p", { class: "faint small" }, "The batch listed no searches."),
      ),
      run.notes ? h("div", null, h("h3", null, "Notes"), h("p", { class: "prose" }, run.notes)) : null,
    ),
  );
}

export function render() {
  const runs = store.data.runs ?? [];
  const el = h(
    "div",
    null,
    h(
      "header",
      { class: "page-head" },
      h("div", null, h("h1", { class: "page-title", tabindex: "-1" }, "Runs"), h("p", { class: "page-sub" }, runs.length ? `${runs.length} ${runs.length === 1 ? "run" : "runs"} ingested.` : "No runs yet.")),
    ),
    runs.length
      ? h("div", { class: "runs" }, runs.map((r, i) => runBlock(r, i === 0)))
      : h(
        "div",
        { class: "empty" },
        h("h2", null, "No run reports yet"),
        h(
          "p",
          null,
          "Each Monday the Cowork task writes a batch to data/inbox and ingests it with npm run ingest. Every ingest writes a report to data/runs, and it shows up here with what was searched, accepted, queued, rejected and why.",
        ),
      ),
  );
  return { el, title: "Runs" };
}
