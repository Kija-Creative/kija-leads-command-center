// Entry point: one fetch of /api/state, a hash router, the header, and keyboard shortcuts.
// Views own their DOM and patch local state from each mutation's response.

import { toast } from "./components/feedback.js";
import { fill, h, isTyping } from "./lib/dom.js";
import { formatDay, formatTime } from "./lib/format.js";
import { latestRun, loadState, onChange, SHEET_STAGES, stageCounts, store } from "./lib/state.js";
import * as coverage from "./views/coverage.js";
import * as lead from "./views/lead.js";
import * as pipeline from "./views/pipeline.js";
import * as present from "./views/present.js";
import * as queue from "./views/queue.js";
import * as runs from "./views/runs.js";
import * as settings from "./views/settings.js";
import * as week from "./views/week.js";

const ROUTES = [
  { name: "week", re: /^\/(?:week)?$/, mod: week },
  { name: "pipeline", re: /^\/pipeline$/, mod: pipeline },
  { name: "lead", re: /^\/lead\/([^/]+)$/, mod: lead },
  { name: "present", re: /^\/present\/([^/]+)$/, mod: present },
  { name: "queue", re: /^\/queue$/, mod: queue },
  { name: "runs", re: /^\/runs$/, mod: runs },
  { name: "coverage", re: /^\/coverage$/, mod: coverage },
  { name: "settings", re: /^\/settings$/, mod: settings },
];

const NAV_FOR = { lead: "pipeline", present: "pipeline" };
const GO = { w: "#/week", p: "#/pipeline", q: "#/queue", r: "#/runs", c: "#/coverage", s: "#/settings" };

const main = document.getElementById("main");
let current = null;

function parseHash() {
  const raw = location.hash.replace(/^#/, "") || "/week";
  const [path, qs = ""] = raw.split("?");
  return { path: path || "/week", query: new URLSearchParams(qs) };
}

function navigate(hash) {
  if (location.hash === hash) renderRoute();
  else location.hash = hash;
}

// Updates the hash query without a re-render or a new history entry.
function setQuery(params) {
  const { path } = parseHash();
  const qs = new URLSearchParams(params).toString();
  history.replaceState(null, "", `#${path}${qs ? `?${qs}` : ""}`);
}

function notFound(path) {
  return {
    title: "Not found",
    el: h(
      "div",
      { class: "empty" },
      h("h1", { class: "page-title", tabindex: "-1" }, "Nothing here"),
      h("p", null, `There is no view at #${path}.`),
      h("div", { class: "form-actions" }, h("a", { class: "btn", href: "#/week" }, "Go to this week")),
    ),
  };
}

function loadError(message) {
  return h(
    "div",
    { class: "empty", role: "alert" },
    h("h1", { class: "page-title", tabindex: "-1" }, "The data did not load"),
    h("p", null, message),
    h("p", null, "The app reads data/leads.json and the other files through the local server. If the server stopped, run npm start again. If a data file is missing, npm run seed rebuilds it."),
    h("div", { class: "form-actions" }, h("button", { type: "button", class: "btn btn-primary", onclick: () => reload() }, "Try again")),
  );
}

function renderRoute({ preserve = false } = {}) {
  if (!store.data) {
    if (store.error) fill(main, loadError(store.error));
    return;
  }
  const { path, query } = parseHash();
  let route = null;
  let match = null;
  for (const r of ROUTES) {
    match = r.re.exec(path);
    if (match) {
      route = r;
      break;
    }
  }
  const scrollY = window.scrollY;
  const active = document.activeElement;
  const focusId = preserve && main.contains(active) ? active.id : "";
  current?.view?.destroy?.();

  let params = [];
  try {
    params = match ? match.slice(1).map((p) => decodeURIComponent(p)) : [];
  } catch {
    route = null;
  }
  const ctx = { params, query, navigate, setQuery, rerender: () => renderRoute({ preserve: true }) };
  let view;
  try {
    view = route ? route.mod.render(ctx) : notFound(path);
  } catch (err) {
    console.error(err);
    view = { title: "Error", el: loadError(`This view hit a problem: ${err.message}`) };
  }
  fill(main, view.el);
  current = { name: route?.name ?? "", view };
  document.body.classList.toggle("presenting", route?.name === "present");
  document.title = `${view.title} · Lead Command Center`;
  const navName = NAV_FOR[route?.name] ?? route?.name;
  for (const a of document.querySelectorAll("[data-nav]")) {
    if (a.dataset.nav === navName) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  if (preserve) {
    window.scrollTo(0, scrollY);
    if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
  } else {
    window.scrollTo(0, 0);
    main.querySelector("h1")?.focus({ preventScroll: true });
  }
}

function renderHeader() {
  const runEl = document.getElementById("topbar-run");
  const stagesEl = document.getElementById("topbar-stages");
  if (!store.data) return;
  const run = latestRun();
  runEl.textContent = `${run ? `Last run ${formatDay(run.runId)}` : "No weekly run yet"}${store.loadedAt ? `, loaded ${formatTime(store.loadedAt)}` : ""}`;
  const counts = stageCounts();
  fill(
    stagesEl,
    SHEET_STAGES.map((s) =>
      h("a", { class: `stage-count${counts[s] ? "" : " is-zero"}`, href: `#/pipeline?status=${encodeURIComponent(s)}`, title: `${counts[s]} at ${s}` }, h("b", null, String(counts[s])), s),
    ),
  );
  const q = document.querySelector('[data-nav="queue"]');
  if (q) {
    q.querySelector(".nav-count")?.remove();
    const n = store.data.queue?.length ?? 0;
    if (n) q.append(h("span", { class: "nav-count", "aria-label": `${n} waiting` }, String(n)));
  }
}

async function reload() {
  const ok = await loadState();
  if (ok) toast({ ok: true, warnings: [] }, { success: "Reloaded from disk." });
  else if (store.data) toast({ ok: false, errors: [store.error], warnings: [] });
}

onChange((reason) => {
  renderHeader();
  if (reason === "load") renderRoute({ preserve: Boolean(current) });
  // A failed reload keeps showing the last good data; only a failed first load replaces the view.
  if (reason === "error" && !store.data) renderRoute();
});

// Keyboard: g then a letter moves between views; views get the rest first.
let pendingG = false;
let pendingTimer = 0;

document.addEventListener("keydown", (e) => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  const help = document.getElementById("help");
  // A modal owns the keyboard while it is open.
  if (help.open || document.querySelector("dialog[open]")) return;
  if (isTyping(e.target)) {
    if (e.key === "Escape") e.target.blur();
    return;
  }
  if (pendingG) {
    pendingG = false;
    clearTimeout(pendingTimer);
    if (GO[e.key]) {
      e.preventDefault();
      navigate(GO[e.key]);
      return;
    }
  }
  if (current?.view?.onKey?.(e)) {
    e.preventDefault();
    return;
  }
  if (e.key === "g") {
    pendingG = true;
    pendingTimer = setTimeout(() => {
      pendingG = false;
    }, 1200);
    return;
  }
  if (e.key === "?") {
    e.preventDefault();
    help.showModal();
    return;
  }
  if (e.key === "r" && current?.name !== "present") {
    e.preventDefault();
    reload();
  }
});

document.getElementById("help-open").addEventListener("click", () => document.getElementById("help").showModal());
document.getElementById("help-close").addEventListener("click", () => document.getElementById("help").close());
document.getElementById("reload").addEventListener("click", () => reload());
window.addEventListener("hashchange", () => renderRoute());

loadState();
