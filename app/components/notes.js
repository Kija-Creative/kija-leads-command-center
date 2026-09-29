// Team notes: a shared scratchpad for Jamey, Kiel and Daisy. The week view shows every note
// with a This week / All notes toggle; a lead page shows the notes about that lead, with the
// same form prefilled to it. Each route answers with the whole list, so the panel re-renders
// from store.data.notes after every change.

import { feedbackSlot, showFeedback, toast, withBusy } from "./feedback.js";
import { api } from "../lib/api.js";
import { fill, h, nextId } from "../lib/dom.js";
import { formatDateTime, number, relativeTime } from "../lib/format.js";
import { byScore, latestRun, leadById, leads, notes as allNotes, OWNERS, setNotes } from "../lib/state.js";

export const NOTE_MAX_LENGTH = 4000;
const COUNTER_FROM = 3500;
const TICK_MS = 60000;
const AUTHOR_KEY = "kija-leads.note-author";
const SCOPE_KEY = "kija-leads.note-scope";

// Per browser conveniences. Storage can be blocked (private windows, cleared site data).
function remember(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // not remembered; the default applies next time
  }
}

function recall(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}

function modKey() {
  const p = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || "";
  return /mac|iphone|ipad/i.test(p) ? "Cmd" : "Ctrl";
}

function isSaveKey(e) {
  return e.key === "Enter" && (e.ctrlKey || e.metaKey);
}

// A plain yes or no dialog, styled like confirmWithReason.
function confirmDelete(note) {
  return new Promise((resolve) => {
    const titleId = nextId("dlg");
    const cancel = h("button", { type: "button", class: "btn btn-quiet" }, "Keep it");
    const ok = h("button", { type: "submit", class: "btn btn-danger-solid" }, "Delete note");
    const preview = note.text.length > 160 ? `${note.text.slice(0, 160).trimEnd()}...` : note.text;
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      dialog.close();
      dialog.remove();
      resolve(value);
    };
    const form = h(
      "form",
      {
        method: "dialog",
        onsubmit: (e) => {
          e.preventDefault();
          finish(true);
        },
      },
      h("h2", { id: titleId }, "Delete this note?"),
      h("p", { class: "dialog-body note-quote" }, preview),
      h("p", { class: "dialog-body" }, "It is removed for everyone. A copy stays in data/backups for a while."),
      h("div", { class: "form-actions" }, ok, cancel),
    );
    const dialog = h("dialog", { class: "confirm", "aria-labelledby": titleId }, form);
    cancel.addEventListener("click", () => finish(false));
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      finish(false);
    });
    document.body.append(dialog);
    dialog.showModal();
    cancel.focus();
  });
}

function leadLabel(l) {
  return `${l.business}, ${[l.city, l.state].filter(Boolean).join(" ")}`;
}

// This run's leads first, since those are the ones the week is about.
function leadOptions(selected, runId) {
  const sorted = [...leads()].sort((a, b) => String(a.business).localeCompare(String(b.business)));
  const option = (l) => h("option", { value: l.id, selected: l.id === selected }, leadLabel(l));
  const mine = runId ? sorted.filter((l) => l.runId === runId).sort(byScore) : [];
  const rest = runId ? sorted.filter((l) => l.runId !== runId) : sorted;
  return [
    h("option", { value: "", selected: !selected }, "No particular lead"),
    mine.length ? h("optgroup", { label: "This run" }, mine.map(option)) : null,
    mine.length ? h("optgroup", { label: "Everyone else" }, rest.map(option)) : rest.map(option),
  ];
}

function counter(textarea) {
  const el = h("span", { class: "note-counter", "aria-live": "polite" });
  const update = () => {
    const n = textarea.value.length;
    el.textContent = n >= COUNTER_FROM ? `${number(n)} of ${number(NOTE_MAX_LENGTH)}` : "";
    el.classList.toggle("is-over", n >= NOTE_MAX_LENGTH);
  };
  textarea.addEventListener("input", update);
  update();
  return el;
}

function timeEl(iso, prefix = "") {
  return h("time", { datetime: iso, title: formatDateTime(iso), dataset: { rel: iso, prefix } }, `${prefix}${relativeTime(iso)}`);
}

// leadId: "" for the week view, or the lead whose page this is.
export function notesPanel({ leadId = "" } = {}) {
  const forLead = Boolean(leadId);
  const lead = forLead ? leadById(leadId) : null;
  const run = latestRun();
  const runId = run?.runId ?? "";
  let scope = forLead ? "lead" : recall(SCOPE_KEY, "week") === "all" ? "all" : "week";
  // An edit in progress survives a re-render of the list.
  let editing = null;

  const titleId = nextId("notes");
  const fieldId = nextId("note");
  const authorId = nextId("note");
  const aboutId = nextId("note");
  const hintId = nextId("note");

  const textarea = h("textarea", {
    id: fieldId,
    rows: "3",
    maxlength: String(NOTE_MAX_LENGTH),
    "aria-describedby": hintId,
    placeholder: forLead
      ? `What should the team know about ${lead?.business ?? "this lead"}? A call outcome, a detail to confirm, who is following up.`
      : "Leave a note for the team: who is taking which lead, what a prospect said, what to check before Monday.",
  });
  const savedAuthor = recall(AUTHOR_KEY, "");
  const author = h(
    "select",
    { id: authorId },
    OWNERS.map((o) => h("option", { value: o, selected: o === (OWNERS.includes(savedAuthor) ? savedAuthor : "") }, o || "No name")),
  );
  author.addEventListener("change", () => remember(AUTHOR_KEY, author.value));
  const about = h("select", { id: aboutId }, leadOptions(leadId, runId));
  const submit = h("button", { type: "submit", class: "btn btn-primary" }, "Add note");
  const slot = feedbackSlot();

  const form = h(
    "form",
    {
      class: "note-form",
      novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        const text = textarea.value.trim();
        if (!text) {
          showFeedback(slot, { ok: false, errors: ["Write something before adding the note."] });
          textarea.setAttribute("aria-invalid", "true");
          textarea.focus();
          return;
        }
        const res = await withBusy(submit, () => api.addNote({ text, author: author.value, leadId: about.value }));
        if (!res.ok) {
          showFeedback(slot, res);
          toast(res);
          return;
        }
        fill(slot);
        textarea.value = "";
        textarea.dispatchEvent(new Event("input"));
        if (!forLead) about.value = "";
        // A new note belongs to this run, so make sure it is visible.
        if (scope === "week" && res.note?.runId !== runId) setScope("all");
        setNotes(res.notes);
        renderList();
        textarea.focus();
      },
    },
    h("label", { class: "visually-hidden", for: fieldId }, forLead ? "Note about this lead" : "Note for the team"),
    textarea,
    h(
      "div",
      { class: "note-form-row" },
      h("div", { class: "field" }, h("label", { for: authorId }, "From"), author),
      h("div", { class: "field note-about" }, h("label", { for: aboutId }, "About a lead"), about),
      submit,
    ),
    h("p", { class: "note-hint", id: hintId }, h("kbd", null, modKey()), " ", h("kbd", null, "Enter"), " also adds it.", counter(textarea)),
    slot,
  );
  textarea.addEventListener("keydown", (e) => {
    if (isSaveKey(e)) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  textarea.addEventListener("input", () => {
    textarea.removeAttribute("aria-invalid");
    if (slot.firstChild) fill(slot);
  });

  const count = h("span", { class: "count" });
  const scopeButtons = forLead
    ? null
    : h(
      "div",
      { class: "segmented", role: "group", "aria-label": "Which notes to show" },
      [["week", "This week"], ["all", "All notes"]].map(([value, label]) =>
        h("button", { type: "button", "aria-pressed": String(scope === value), dataset: { scope: value }, onclick: () => setScope(value, { render: true }) }, label),
      ),
    );

  function setScope(value, { render = false } = {}) {
    scope = value;
    remember(SCOPE_KEY, value);
    for (const b of scopeButtons?.querySelectorAll("button") ?? []) b.setAttribute("aria-pressed", String(b.dataset.scope === value));
    if (render) renderList();
  }

  const list = h("div", { class: "note-list-wrap" });

  function visible() {
    const every = allNotes();
    if (forLead) return every.filter((n) => n.leadId === leadId);
    if (scope === "week") return every.filter((n) => (n.runId ?? "") === runId);
    return every;
  }

  function emptyState() {
    if (forLead) {
      return h(
        "div",
        { class: "note-empty" },
        h("p", null, "No notes about this lead yet."),
        h("p", { class: "faint" }, "Use a note for what the record does not hold: what the owner said on a call, a detail to confirm, who is taking the follow up. The whole team sees it here and on This week."),
      );
    }
    if (scope === "week" && allNotes().length) {
      return h(
        "div",
        { class: "note-empty" },
        h("p", null, run ? "No notes since this run came in." : "No notes yet this week."),
        h("p", { class: "faint" }, "Older notes are under All notes. A note added now belongs to this week."),
      );
    }
    return h(
      "div",
      { class: "note-empty" },
      h("p", null, "No team notes yet."),
      h("p", { class: "faint" }, "Notes are for the three of you: who is taking which lead, what a prospect said, what to check before the next Monday run. Pick a lead to pin a note to its page too. Nothing here is ever sent to a business."),
    );
  }

  function leadChip(note) {
    if (!note.leadId || forLead) return null;
    const l = leadById(note.leadId);
    if (!l) return h("span", { class: "chip chip-muted no-dot", title: note.leadId }, "Lead no longer in the pipeline");
    return h("a", { class: "chip no-dot note-lead", href: `#/lead/${encodeURIComponent(l.id)}`, title: `Open ${l.business}` }, l.business);
  }

  function editForm(note) {
    const box = h("textarea", { rows: "3", maxlength: String(NOTE_MAX_LENGTH), "aria-label": "Edit the note" });
    box.value = editing.text;
    const save = h("button", { type: "submit", class: "btn btn-primary btn-small" }, "Save");
    const cancel = h("button", { type: "button", class: "btn btn-quiet btn-small" }, "Cancel");
    const fb = feedbackSlot();
    const stop = () => {
      editing = null;
      renderList();
      document.querySelector(`[data-note-edit="${CSS.escape(note.id)}"]`)?.focus();
    };
    const f = h(
      "form",
      {
        class: "note-edit",
        novalidate: true,
        onsubmit: async (e) => {
          e.preventDefault();
          const text = box.value.trim();
          if (!text) {
            showFeedback(fb, { ok: false, errors: ["A note cannot be empty. Delete it instead if it is no longer needed."] });
            box.focus();
            return;
          }
          const res = await withBusy(save, () => api.editNote(note.id, { text }));
          if (!res.ok) {
            showFeedback(fb, res);
            toast(res);
            return;
          }
          setNotes(res.notes);
          stop();
        },
      },
      box,
      h("div", { class: "row" }, save, cancel, h("span", { class: "note-hint" }, h("kbd", null, modKey()), " ", h("kbd", null, "Enter"), " saves, ", h("kbd", null, "Esc"), " cancels"), counter(box)),
      fb,
    );
    box.addEventListener("input", () => {
      editing.text = box.value;
    });
    box.addEventListener("keydown", (e) => {
      if (isSaveKey(e)) {
        e.preventDefault();
        f.requestSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        stop();
      }
    });
    cancel.addEventListener("click", stop);
    queueMicrotask(() => {
      box.focus();
      box.setSelectionRange(box.value.length, box.value.length);
    });
    return f;
  }

  function item(note) {
    const isEditing = editing?.id === note.id;
    const edited = note.updatedAt && note.updatedAt !== note.createdAt;
    const editBtn = h("button", { type: "button", class: "btn btn-quiet btn-small", dataset: { noteEdit: note.id }, "aria-label": "Edit note" }, "Edit");
    const delBtn = h("button", { type: "button", class: "btn btn-quiet btn-small note-delete", "aria-label": "Delete note" }, "Delete");
    editBtn.addEventListener("click", () => {
      editing = { id: note.id, text: note.text };
      renderList();
    });
    delBtn.addEventListener("click", async () => {
      if (!(await confirmDelete(note))) {
        delBtn.focus();
        return;
      }
      const res = await withBusy(delBtn, () => api.deleteNote(note.id));
      toast(res, { success: "Note deleted." });
      if (!res.ok) return;
      if (editing?.id === note.id) editing = null;
      setNotes(res.notes);
      renderList();
      textarea.focus({ preventScroll: true });
    });
    return h(
      "li",
      { class: `note${isEditing ? " is-editing" : ""}` },
      h(
        "div",
        { class: "note-meta" },
        h("span", { class: `note-author${note.author ? "" : " is-anon"}` }, note.author || "No name"),
        timeEl(note.createdAt),
        edited ? h("span", { class: "faint", title: `Edited ${formatDateTime(note.updatedAt)}` }, "edited") : null,
        leadChip(note),
        h("span", { class: "spacer" }),
        isEditing ? null : h("span", { class: "note-actions" }, editBtn, delBtn),
      ),
      isEditing ? editForm(note) : h("p", { class: "note-text" }, note.text),
    );
  }

  function renderList() {
    const shown = visible();
    count.textContent = String(shown.length);
    fill(list, shown.length ? h("ol", { class: "note-list", "aria-labelledby": titleId }, shown.map(item)) : emptyState());
  }

  // Relative times drift while the page is open; refresh them until the panel leaves the page.
  const timer = setInterval(() => {
    if (!el.isConnected) {
      clearInterval(timer);
      return;
    }
    for (const t of el.querySelectorAll("time[data-rel]")) t.textContent = `${t.dataset.prefix ?? ""}${relativeTime(t.dataset.rel)}`;
  }, TICK_MS);

  const el = h(
    "section",
    { class: `notes panel${forLead ? " notes-lead" : ""}`, "aria-labelledby": titleId },
    h("div", { class: "notes-head" }, h("h2", { class: "notes-title", id: titleId }, "Team notes", count), scopeButtons),
    form,
    list,
  );
  renderList();
  return el;
}
