// Team notes: free text the team leaves on the week view or on a lead. Pure: ids and time
// come in from the caller. Validation lives in validate.js (validateNote).

import { NOTE_AUTHORS, NOTE_MAX_LENGTH } from "./validate.js";

export { NOTE_AUTHORS, NOTE_MAX_LENGTH };

// Built from char codes so this file never contains the characters it replaces.
const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);
const EM_RE = new RegExp(`[ \\t]*${EM}+[ \\t]*`, "g");
const EN_RE = new RegExp(EN, "g");

// People type freely, so human free text is normalized on save rather than rejected: an em
// dash becomes ", " and an en dash becomes "-". Keeps npm run check clean without nagging.
export function normalizeFreeText(text) {
  if (typeof text !== "string") return text;
  let out = text.replace(/\r\n?/g, "\n").replace(EN_RE, "-");
  if (out.includes(EM)) {
    out = out
      .replace(EM_RE, ", ")
      // "wait, , ok" or "wait,, ok" from a comma typed next to the dash.
      .replace(/,(?:[ \t]*,)+/g, ",")
      // A dash that opened or closed a line leaves a stray comma there.
      .replace(/^, /gm, "")
      .replace(/,[ \t]*$/gm, "");
  }
  return out;
}

// Trimmed, normalized note text. Non strings pass through for the validator to reject.
export function cleanNoteText(text) {
  return typeof text === "string" ? normalizeFreeText(text).trim() : text;
}

function iso(now) {
  const d = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(d.getTime())) throw new TypeError(`now must be a date or ISO string, got ${JSON.stringify(now)}.`);
  return d.toISOString();
}

function asText(value) {
  return typeof value === "string" ? value.trim() : value;
}

// A new note from what a person typed. runId is the latest run at the time of writing.
export function createNote({ id, text, author = "", leadId = "", runId = "", now }) {
  const at = iso(now);
  return {
    id,
    text: cleanNoteText(text),
    author: asText(author ?? ""),
    leadId: asText(leadId ?? ""),
    runId: typeof runId === "string" ? runId : "",
    createdAt: at,
    updatedAt: at,
  };
}

// Only the text changes on an edit; who wrote it, what it is about and when stay put.
export function editNote(note, { text }, now) {
  return { ...note, text: cleanNoteText(text), updatedAt: iso(now) };
}

// A fresh note id. random is injected so tests get stable ids.
export function noteId(now, random) {
  const stamp = iso(now).replace(/\D/g, "").slice(0, 14);
  const tail = String(random ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "0";
  return `note-${stamp}-${tail}`;
}

// Newest first, ties broken by id so the order is stable.
export function sortNotesNewestFirst(list) {
  return [...(Array.isArray(list) ? list : [])].sort(
    (a, b) => String(b?.createdAt ?? "").localeCompare(String(a?.createdAt ?? "")) || String(b?.id ?? "").localeCompare(String(a?.id ?? "")),
  );
}

// Oldest first, the order data/notes.json is kept in.
export function sortNotesForFile(list) {
  return sortNotesNewestFirst(list).reverse();
}

export function notesForLead(list, leadId) {
  return sortNotesNewestFirst(list).filter((n) => leadId && n.leadId === leadId);
}

export function notesForRun(list, runId) {
  return sortNotesNewestFirst(list).filter((n) => (n.runId ?? "") === (runId ?? ""));
}

// Runs come newest first from store.listRuns().
export function latestRunId(runs) {
  const first = Array.isArray(runs) ? runs.find((r) => r && typeof r.runId === "string" && r.runId) : null;
  return first ? first.runId : "";
}
