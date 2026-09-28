// #/queue: candidates that need a decision. Promote runs full lead validation on the
// server; Drop needs a reason and remembers the business so the weekly run skips it.

import { feedbackSlot, showFeedback, toast, withBusy } from "../components/feedback.js";
import { api } from "../lib/api.js";
import { external, fill, h, nextId } from "../lib/dom.js";
import { formatDay, number, rating } from "../lib/format.js";
import { categoryLabel, CONFIDENCE_LEVELS, putLead, putQueueItem, removeQueueItem, store } from "../lib/state.js";

const SCALES = {
  websiteGap: ["Website gap", { 1: "1, weak own site", 2: "2, very weak or third party only", 3: "3, no credible owned site" }],
  ticketValue: ["Ticket value", { 1: "1, low", 2: "2, medium", 3: "3, high" }],
  visualFit: ["Visual fit", { 1: "1, limited", 2: "2, good", 3: "3, excellent" }],
};

function scaleSelect(key, value) {
  const [label, words] = SCALES[key];
  const id = nextId("qp");
  const sel = h(
    "select",
    { id, name: key },
    h("option", { value: "", selected: !value }, "Choose"),
    [1, 2, 3].map((n) => h("option", { value: String(n), selected: Number(value) === n }, words[n])),
  );
  return { field: h("div", { class: "field" }, h("label", { for: id }, label), sel), read: () => (sel.value ? Number(sel.value) : null) };
}

function textField(key, label, value, { area = false, span = false } = {}) {
  const id = nextId("qp");
  const input = area ? h("textarea", { id, name: key, rows: "2" }) : h("input", { id, name: key, autocomplete: "off" });
  input.value = value ?? "";
  return { field: h("div", { class: `field${span ? " span-all" : ""}` }, h("label", { for: id }, label), input), read: () => input.value.trim() };
}

function promoteForm(item, done) {
  const carried = item.lead ?? {};
  const cat = store.data.categories?.[item.categoryKey] ?? {};
  const gap = scaleSelect("websiteGap", carried.websiteGap);
  const ticket = scaleSelect("ticketValue", carried.ticketValue ?? cat.ticketValueDefault);
  const visual = scaleSelect("visualFit", carried.visualFit ?? cat.visualFitDefault);
  const confId = nextId("qp");
  const conf = h("select", { id: confId }, h("option", { value: "" }, "Choose"), CONFIDENCE_LEVELS.map((c) => h("option", { value: c, selected: c === carried.confidence }, c)));
  const status = textField("websiteStatus", "Website status", carried.websiteStatus ?? item.websiteStatus, { span: true });
  const why = textField("whyKija", "Why Kija", carried.whyKija ?? item.whyItMayFit, { area: true, span: true });
  const angle = textField("pitchAngle", "Pitch angle", carried.pitchAngle, { area: true, span: true });
  const concept = textField("demoConcept", "Demo concept", carried.demoConcept, { area: true, span: true });
  const note = textField("reason", "Note for the history", "", { span: true });
  const slot = feedbackSlot();
  const submit = h("button", { type: "submit", class: "btn btn-primary" }, "Promote to pipeline");
  return h(
    "form",
    {
      class: "queue-form",
      onsubmit: async (e) => {
        e.preventDefault();
        const lead = {
          websiteGap: gap.read(),
          ticketValue: ticket.read(),
          visualFit: visual.read(),
          confidence: conf.value || null,
          websiteStatus: status.read(),
          whyKija: why.read(),
          pitchAngle: angle.read(),
          demoConcept: concept.read(),
        };
        for (const [k, v] of Object.entries(lead)) if (v === null || v === "") delete lead[k];
        const res = await withBusy(submit, () => api.queueDecision(item.id, { decision: "Promote", reason: note.read(), lead }));
        showFeedback(slot, res, { success: "Promoted." });
        if (res.ok) {
          toast(res, { success: `${item.candidate} is now in the pipeline as New.` });
          if (res.lead) putLead(res.lead);
          removeQueueItem(item.id);
          done();
        }
      },
    },
    h("p", { class: "muted small", style: { marginBottom: "12px" } }, "The lead is checked against every rule before it is added. Fill in what the research supports; leave nothing invented."),
    h("div", { class: "form-grid" }, gap.field, ticket.field, visual.field, h("div", { class: "field" }, h("label", { for: confId }, "Confidence"), conf), status.field, why.field, angle.field, concept.field, note.field),
    h("div", { class: "form-actions" }, submit, h("button", { type: "button", class: "btn btn-quiet", onclick: () => done(false) }, "Cancel")),
    slot,
  );
}

function researchForm(item, done) {
  const note = textField("reason", "What still needs checking", "", { span: true });
  const slot = feedbackSlot();
  const submit = h("button", { type: "submit", class: "btn" }, "Keep researching");
  return h(
    "form",
    {
      class: "queue-form",
      onsubmit: async (e) => {
        e.preventDefault();
        const res = await withBusy(submit, () => api.queueDecision(item.id, { decision: "Research", reason: note.read() }));
        showFeedback(slot, res, { success: "Kept in the queue." });
        toast(res, { success: `${item.candidate} stays in the queue.` });
        if (res.ok) {
          putQueueItem(res.item);
          done();
        }
      },
    },
    h("div", { class: "form-grid" }, note.field),
    h("p", { class: "faint small", style: { marginTop: "6px" } }, "Optional. A note replaces the reason shown on this item."),
    h("div", { class: "form-actions" }, submit, h("button", { type: "button", class: "btn btn-quiet", onclick: () => done(false) }, "Cancel")),
    slot,
  );
}

function dropForm(item, done) {
  const id = nextId("qd");
  const reason = h("textarea", { id, rows: "2", required: true, placeholder: "For example: has a working website at a different name" });
  const slot = feedbackSlot();
  const submit = h("button", { type: "submit", class: "btn btn-danger" }, "Drop and remember");
  return h(
    "form",
    {
      class: "queue-form",
      onsubmit: async (e) => {
        e.preventDefault();
        const res = await withBusy(submit, () => api.queueDecision(item.id, { decision: "Drop", reason: reason.value.trim() }));
        showFeedback(slot, res, { success: "Dropped." });
        if (!res.ok) reason.setAttribute("aria-invalid", "true");
        if (res.ok) {
          toast(res, { success: `${item.candidate} was dropped. The weekly run will skip it.` });
          removeQueueItem(item.id);
          store.data.rejectedCount = (store.data.rejectedCount ?? 0) + 1;
          done();
        }
      },
    },
    h("div", { class: "field" }, h("label", { for: id }, "Why drop it ", h("span", { class: "hint" }, "required")), reason),
    h("p", { class: "faint small", style: { marginTop: "6px" } }, "Dropped businesses go to data/rejected.json with this reason, so no future run brings them back."),
    h("div", { class: "form-actions" }, submit, h("button", { type: "button", class: "btn btn-quiet", onclick: () => done(false) }, "Cancel")),
    slot,
  );
}

function queueItem(item, rerender) {
  const formHost = h("div");
  let open = "";
  const buttons = {};
  const setOpen = (which) => {
    open = open === which ? "" : which;
    for (const [k, b] of Object.entries(buttons)) b.setAttribute("aria-expanded", String(open === k));
    const done = (changed = true) => {
      open = "";
      fill(formHost);
      for (const b of Object.values(buttons)) b.setAttribute("aria-expanded", "false");
      if (changed) rerender();
      else buttons[which]?.focus();
    };
    fill(formHost, open === "promote" ? promoteForm(item, done) : open === "research" ? researchForm(item, done) : open === "drop" ? dropForm(item, done) : null);
    formHost.querySelector("select, input, textarea")?.focus();
  };
  buttons.promote = h("button", { type: "button", class: "btn btn-small btn-primary", "aria-expanded": "false", onclick: () => setOpen("promote") }, "Promote");
  buttons.research = h("button", { type: "button", class: "btn btn-small", "aria-expanded": "false", onclick: () => setOpen("research") }, "Keep researching");
  buttons.drop = h("button", { type: "button", class: "btn btn-small btn-danger", "aria-expanded": "false", onclick: () => setOpen("drop") }, "Drop");

  const proof = item.googleRating === null || item.googleRating === undefined
    ? h("span", { class: "faint" }, "No rating recorded")
    : h("span", { class: "rating" }, h("span", { class: "star", "aria-hidden": "true" }, "★ "), h("b", null, rating(item.googleRating)), item.googleReviews !== null && item.googleReviews !== undefined ? ` from ${number(item.googleReviews)} Google reviews` : "");
  const block = (label, text) => (text ? h("div", null, h("h4", null, label), h("p", null, text)) : null);
  const sources = Array.isArray(item.sources) ? item.sources : [];

  return h(
    "li",
    { class: "panel queue-item" },
    h(
      "div",
      { class: "queue-top" },
      h(
        "div",
        null,
        h("h3", null, item.candidate),
        h("p", { class: "lead-meta" }, item.category || categoryLabel(item.categoryKey), h("span", { class: "sep", "aria-hidden": "true" }, "/"), [item.city, item.state].filter(Boolean).join(", "), h("span", { class: "sep", "aria-hidden": "true" }, "/"), proof),
      ),
      h("div", { class: "chips" }, item.reason ? h("span", { class: "chip chip-warn" }, item.reason) : null, h("span", { class: "chip chip-muted" }, `Added ${formatDay(item.addedAt)}${item.runId ? `, run ${item.runId}` : ""}`)),
    ),
    h(
      "div",
      { class: "queue-body" },
      block("Why it may fit", item.whyItMayFit),
      block("Website status", item.websiteStatus),
      block("Verification needed", item.verificationNeeded),
      block("Owner contact", item.ownerContact),
      block("Phone", item.phone),
      h("div", null, h("h4", null, "Sources"), sources.length ? h("ul", { class: "sources" }, sources.map((s) => h("li", null, external(s.url, s.label || s.url)))) : h("p", { class: "faint" }, "None yet")),
    ),
    h("div", { class: "queue-actions" }, buttons.promote, buttons.research, buttons.drop),
    formHost,
  );
}

export function render({ rerender }) {
  const queue = store.data.queue ?? [];
  const reasons = {};
  for (const q of queue) reasons[q.reason || "No reason recorded"] = (reasons[q.reason || "No reason recorded"] ?? 0) + 1;
  const list = [...queue].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)) || String(a.candidate).localeCompare(String(b.candidate)));

  const el = h(
    "div",
    null,
    h(
      "header",
      { class: "page-head" },
      h(
        "div",
        null,
        h("h1", { class: "page-title", tabindex: "-1" }, "Research queue"),
        h("p", { class: "page-sub" }, queue.length ? `${queue.length} ${queue.length === 1 ? "candidate needs" : "candidates need"} a decision. ${store.data.rejectedCount ?? 0} businesses are on the rejected list.` : "Nothing waiting."),
      ),
    ),
    queue.length
      ? h("div", { class: "chips", style: { marginBottom: "16px" } }, Object.entries(reasons).map(([r, n]) => h("span", { class: "chip no-dot" }, `${r}: ${n}`)))
      : null,
    queue.length
      ? h("ul", { class: "queue-list" }, list.map((item) => queueItem(item, rerender)))
      : h(
        "div",
        { class: "empty" },
        h("h2", null, "The research queue is empty"),
        h(
          "p",
          null,
          "The weekly run puts a candidate here when it falls below a threshold floor, still needs verification, or overflows the weekly quota. Each one waits for you to promote it, keep researching, or drop it.",
        ),
      ),
  );
  return { el, title: "Research queue" };
}
