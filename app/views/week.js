// #/week: the latest run. When it ran, what it covered, what it found, the team's notes
// beside that summary, then its leads.

import { leadCard } from "../components/leadcard.js";
import { listNav } from "../components/listnav.js";
import { notesPanel } from "../components/notes.js";
import { h } from "../lib/dom.js";
import { formatDateTime, formatDay } from "../lib/format.js";
import { byScore, categoryLabel, latestRun, leads, metroName } from "../lib/state.js";

const COUNT_LABELS = [
  ["candidates", "Candidates"],
  ["accepted", "Accepted"],
  ["queued", "Queued"],
  ["rejected", "Rejected"],
  ["duplicates", "Duplicates"],
  ["reverified", "Reverified"],
  ["errors", "Errors"],
];

export function planNames(list, kind) {
  return (Array.isArray(list) ? list : []).map((x) => {
    if (x && typeof x === "object") return x.name ?? x.label ?? x.key ?? "";
    return kind === "metro" ? metroName(x) : categoryLabel(x);
  });
}

export function runCounts(run, { compact = false } = {}) {
  const counts = run.counts ?? {};
  return h(
    "dl",
    { class: "stats" },
    COUNT_LABELS.filter(([k]) => !compact || counts[k]).map(([k, label]) =>
      h(
        "div",
        { class: `stat${counts[k] ? "" : " is-zero"}${k === "errors" && counts[k] ? " is-bad" : ""}` },
        h("dt", null, label),
        h("dd", null, String(counts[k] ?? 0)),
      ),
    ),
  );
}

function howToRun() {
  return h(
    "div",
    { class: "empty" },
    h("h2", null, "No weekly run has been ingested yet"),
    h(
      "p",
      null,
      "Every Monday a Claude Cowork scheduled task opens this project and follows WEEKLY_RUN.md: it plans the week's metros and categories, researches and verifies businesses with strong Google reviews and no real website, then ingests the batch. The run's report and leads appear here.",
    ),
    h(
      "ol",
      null,
      h("li", null, "To run it now, start a Claude session in this project and ask it to follow ", h("code", null, "WEEKLY_RUN.md"), " from the top."),
      h("li", null, "Or step by step: ", h("code", null, "npm run plan"), " prints this week's plan, research writes ", h("code", null, "data/inbox/<runId>.json"), ", then ", h("code", null, "npm run ingest -- data/inbox/<runId>.json"), "."),
      h("li", null, "Build demos and pitch pages with ", h("code", null, "npm run demos -- --missing"), " and ", h("code", null, "npm run pitches -- --missing"), ", then press ", h("kbd", null, "r"), " here to reload."),
    ),
  );
}

// The run summary and the team notes side by side on wide screens; stacked, notes second,
// on narrow ones so they still sit above the lead cards.
function weekTop(...summary) {
  return h("div", { class: "week-top" }, h("div", { class: "week-summary" }, summary), notesPanel());
}

export function render({ navigate }) {
  const run = latestRun();
  const all = leads();
  const parts = [];
  let list = [];

  if (run) {
    list = all.filter((l) => l.runId === run.runId).sort(byScore);
    const metros = planNames(run.plan?.metros, "metro");
    const cats = planNames(run.plan?.categories, "category");
    parts.push(
      h(
        "header",
        { class: "page-head" },
        h(
          "div",
          null,
          h("h1", { class: "page-title", tabindex: "-1" }, `Week of ${formatDay(run.runId, { year: true })}`),
          h("p", { class: "page-sub" }, `Ingested ${formatDateTime(run.ingestedAt)}, ${run.mode ?? "weekly"} run. ${list.length ? `${list.length} ${list.length === 1 ? "lead" : "leads"} added.` : ""}`),
        ),
        h("a", { class: "btn", href: "#/runs" }, "Full run report"),
      ),
      weekTop(
        runCounts(run),
        h(
          "div",
          { class: "plan" },
          h("div", null, h("h3", null, "Metros searched"), metros.length ? h("ul", null, metros.map((m) => h("li", null, m))) : h("p", { class: "faint" }, "The batch did not record its metros.")),
          h("div", null, h("h3", null, "Categories"), cats.length ? h("ul", null, cats.map((c) => h("li", null, c))) : h("p", { class: "faint" }, "The batch did not record its categories.")),
        ),
        run.notes ? h("p", { class: "prose muted", style: { marginTop: "16px" } }, run.notes) : null,
      ),
    );
  } else {
    list = all.filter((l) => !l.runId).sort(byScore);
    parts.push(
      h(
        "header",
        { class: "page-head" },
        h("div", null, h("h1", { class: "page-title", tabindex: "-1" }, "This week"), h("p", { class: "page-sub" }, "Waiting on the first Monday run.")),
      ),
      weekTop(howToRun()),
    );
  }

  const items = list.map(leadCard);
  const heading = run
    ? h("h2", { class: "section-title" }, "This run's leads", h("span", { class: "count" }, String(list.length)))
    : h("h2", { class: "section-title" }, "From the sheet import", h("span", { class: "count" }, String(list.length)));
  const hint = items.length ? h("p", { class: "shortcut-hint" }, h("kbd", null, "j"), " ", h("kbd", null, "k"), " to move, ", h("kbd", null, "o"), " to open, ", h("kbd", null, "p"), " to present") : null;

  parts.push(
    h(
      "section",
      { class: "section", "aria-labelledby": "week-leads" },
      h("div", { class: "section-head", id: "week-leads" }, heading, hint),
      items.length
        ? h("ol", { class: "lead-list" }, items.map((i) => i.el))
        : h(
          "div",
          { class: "empty" },
          h("h3", null, run ? "This run added no new leads" : "No sheet leads yet"),
          h(
            "p",
            null,
            run
              ? "Everything it found went to the research queue, was a duplicate, or failed validation. The counts above and the run report say which."
              : "Run npm run seed to load the Google Sheet's 20 leads and research queue.",
          ),
        ),
    ),
  );

  const onKey = listNav(items, { navigate });
  const title = run ? `Week of ${formatDay(run.runId)}` : "This week";
  return { el: h("div", null, parts), title, onKey };
}
