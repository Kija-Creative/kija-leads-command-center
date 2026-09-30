// Team notes: text normalization, the pure helpers, validateNote and the store round trip.
// Store tests write to a temp directory, never the real data/.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  cleanNoteText,
  createNote,
  editNote,
  latestRunId,
  normalizeFreeText,
  NOTE_MAX_LENGTH,
  noteId,
  notesForLead,
  notesForRun,
  sortNotesForFile,
  sortNotesNewestFirst,
} from "../src/lib/notes.js";
import { createStore } from "../src/lib/store.js";
import { findDashes, validateNote, validateNotes } from "../src/lib/validate.js";

const PROJECT = new URL("../", import.meta.url);
const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);
const NOW = "2026-09-29T15:00:00.000Z";
const LEADS = [{ id: "gm-auto-care-dallas-tx" }, { id: "other-lead-tx" }];

function note(overrides = {}) {
  return createNote({ id: "note-1", text: "Kiel is calling GM on Thursday.", author: "Jamey", leadId: "", runId: "2026-09-28", now: NOW, ...overrides });
}

test("normalizeFreeText turns em dashes into a comma and en dashes into a hyphen", () => {
  assert.equal(normalizeFreeText(`call back ${EM} later`), "call back, later");
  assert.equal(normalizeFreeText(`call back${EM}later`), "call back, later");
  assert.equal(normalizeFreeText(`open 9${EN}5`), "open 9-5");
  assert.equal(normalizeFreeText(`Mon ${EN} Fri`), "Mon - Fri");
  assert.equal(normalizeFreeText(`wait, ${EM} ok`), "wait, ok");
  assert.equal(normalizeFreeText(`${EM} starts with a dash`), "starts with a dash");
  assert.equal(normalizeFreeText(`ends with a dash ${EM}`), "ends with a dash");
  assert.equal(normalizeFreeText(`two${EM}${EM}dashes`), "two, dashes");
  assert.equal(normalizeFreeText(`line one ${EM}\nline two`), "line one\nline two");
  assert.equal(normalizeFreeText("windows\r\nline"), "windows\nline");
  assert.equal(normalizeFreeText("plain text, untouched"), "plain text, untouched");
  assert.equal(normalizeFreeText(42), 42, "non strings pass through for the validator");
  assert.deepEqual(findDashes(normalizeFreeText(`a ${EM} b ${EN} c`)), []);
  assert.equal(cleanNoteText(`  padded ${EM} note  `), "padded, note");
});

test("createNote trims, normalizes and stamps both times; editNote changes only text and updatedAt", () => {
  const n = note({ text: `  Owner prefers mornings ${EM} before 10  `, author: " Kiel ", leadId: " gm-auto-care-dallas-tx " });
  assert.deepEqual(n, {
    id: "note-1",
    text: "Owner prefers mornings, before 10",
    author: "Kiel",
    leadId: "gm-auto-care-dallas-tx",
    runId: "2026-09-28",
    createdAt: NOW,
    updatedAt: NOW,
  });
  const later = "2026-09-29T16:30:00.000Z";
  const e = editNote(n, { text: `Owner prefers mornings${EN}afternoons are busy` }, later);
  assert.equal(e.text, "Owner prefers mornings-afternoons are busy");
  assert.equal(e.updatedAt, later);
  assert.equal(e.createdAt, NOW);
  assert.equal(e.author, "Kiel");
  assert.equal(e.leadId, "gm-auto-care-dallas-tx");
  assert.equal(n.text, "Owner prefers mornings, before 10", "the original is not mutated");
  assert.throws(() => createNote({ id: "x", text: "hi", now: "not a date" }), /now must be/);
});

test("note ids, ordering and filters", () => {
  assert.equal(noteId(NOW, "A1b2-C3d4"), "note-20260929150000-a1b2c3d4");
  assert.equal(noteId(NOW, ""), "note-20260929150000-0");
  const a = note({ id: "a", now: "2026-09-28T10:00:00.000Z", runId: "2026-09-21" });
  const b = note({ id: "b", now: "2026-09-29T10:00:00.000Z", leadId: "gm-auto-care-dallas-tx" });
  const c = note({ id: "c", now: "2026-09-29T10:00:00.000Z" });
  assert.deepEqual(sortNotesNewestFirst([a, b, c]).map((n) => n.id), ["c", "b", "a"]);
  assert.deepEqual(sortNotesForFile([c, a, b]).map((n) => n.id), ["a", "b", "c"]);
  assert.deepEqual(notesForLead([a, b, c], "gm-auto-care-dallas-tx").map((n) => n.id), ["b"]);
  assert.deepEqual(notesForLead([a, b, c], ""), [], "an empty lead id matches nothing");
  assert.deepEqual(notesForRun([a, b, c], "2026-09-28").map((n) => n.id), ["c", "b"]);
  assert.equal(latestRunId([{ runId: "2026-09-28" }, { runId: "2026-09-21" }]), "2026-09-28");
  assert.equal(latestRunId([]), "");
  assert.equal(latestRunId(undefined), "");
  assert.deepEqual(sortNotesNewestFirst(null), []);
});

test("validateNote accepts a good note and refuses empty, long, unknown lead and bad author", () => {
  assert.deepEqual(validateNote(note(), { leads: LEADS }), { ok: true, errors: [], warnings: [] });
  assert.ok(validateNote(note({ leadId: "gm-auto-care-dallas-tx" }), { leads: LEADS }).ok);
  assert.ok(validateNote(note({ author: "" }), { leads: LEADS }).ok, "a note may have no name");
  assert.ok(validateNote(note({ text: "x".repeat(NOTE_MAX_LENGTH) }), { leads: LEADS }).ok, "exactly the limit is fine");

  const empty = validateNote(note({ text: "   " }), { leads: LEADS });
  assert.equal(empty.ok, false);
  assert.match(empty.errors[0], /Write something/);

  const long = validateNote(note({ text: "x".repeat(NOTE_MAX_LENGTH + 1) }), { leads: LEADS });
  assert.equal(long.ok, false);
  assert.match(long.errors[0], /4,000 characters; this one has 4,001/);

  const lead = validateNote(note({ leadId: "no-such-lead" }), { leads: LEADS });
  assert.equal(lead.ok, false);
  assert.match(lead.errors[0], /No lead has the id "no-such-lead"/);

  const who = validateNote(note({ author: "Someone" }), { leads: LEADS });
  assert.equal(who.ok, false);
  assert.match(who.errors[0], /Jamey, Kiel, Max/);

  assert.match(validateNote({ ...note(), text: 12 }).errors[0], /must be text/);
  assert.match(validateNote({ ...note(), leadId: null }).errors[0], /lead id, or empty/);
  assert.match(validateNote({ ...note(), createdAt: "yesterday" }).errors[0], /ISO timestamp/);
  assert.match(validateNote({ ...note(), pinned: true }).errors[0], /pinned is not a note field/);
  assert.match(validateNote(null).errors[0], /must be an object/);
  // The server normalizes first, so a raw dash here means that step was skipped.
  assert.ok(validateNote({ ...note(), text: `a ${EM} b` }).errors.some((e) => /em or en dash/.test(e)));
  // Without a lead list, the lead id is not checked (an edit after the lead was removed).
  assert.ok(validateNote(note({ leadId: "gone" })).ok);
});

test("validateNotes checks every note and duplicate ids, and warns about removed leads", () => {
  const list = [note({ id: "a" }), note({ id: "b", leadId: "gone-lead" })];
  const ok = validateNotes(list, { leads: LEADS });
  assert.equal(ok.ok, true);
  assert.match(ok.warnings[0], /gone-lead/);
  const dupe = validateNotes([note({ id: "a" }), note({ id: "a" })]);
  assert.equal(dupe.ok, false);
  assert.match(dupe.errors[0], /used more than once/);
  assert.equal(validateNotes({}).ok, false);
});

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kija-notes-"));
  fs.mkdirSync(path.join(root, "config"));
  for (const f of ["settings.json", "categories.json", "geography.json", "chains.json"]) {
    fs.copyFileSync(new URL(`config/${f}`, PROJECT), path.join(root, "config", f));
  }
  return root;
}

function steppingClock(start = Date.UTC(2026, 8, 29, 12, 0, 0)) {
  let t = start;
  return () => new Date((t += 1000));
}

test("store loads [] without data/notes.json and saveNotes round trips oldest first with backups", (t) => {
  const root = tempRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const store = createStore(root, { now: steppingClock() });
  assert.deepEqual(store.load().notes, []);

  const newer = note({ id: "b", now: "2026-09-29T10:00:00.000Z" });
  const older = note({ id: "a", now: "2026-09-28T10:00:00.000Z" });
  const first = store.saveNotes([newer, older]);
  assert.equal(first.written, true);
  assert.equal(first.backup, null, "no backup for the first write");
  assert.deepEqual(store.load().notes.map((n) => n.id), ["a", "b"]);
  const text = fs.readFileSync(path.join(root, "data", "notes.json"), "utf8");
  assert.match(text, /^\[\n  \{/);
  assert.ok(text.endsWith("\n"));

  assert.equal(store.saveNotes([older, newer]).written, false, "identical content is not rewritten");
  const second = store.saveNotes([older]);
  assert.equal(second.written, true);
  assert.ok(second.backup && fs.existsSync(second.backup));
  assert.match(path.basename(second.backup), /^notes-\d{4}-\d{2}-\d{2}T/);
  assert.equal(JSON.parse(fs.readFileSync(second.backup, "utf8")).length, 2);

  const next = store.updateNotes((list) => [...list, note({ id: "c", now: "2026-09-29T11:00:00.000Z" })]);
  assert.deepEqual(next.map((n) => n.id), ["a", "c"]);
  assert.deepEqual(store.load().notes.map((n) => n.id), ["a", "c"]);
  const leftovers = fs.readdirSync(path.join(root, "data")).filter((f) => f.endsWith(".tmp"));
  assert.deepEqual(leftovers, [], "the atomic write leaves no temp file");
  assert.throws(() => store.saveNotes({}), /notes must be an array/);
});

test("data/notes.json in the repo is a valid list with no dashes", () => {
  const file = new URL("data/notes.json", PROJECT);
  const list = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.ok(Array.isArray(list));
  const v = validateNotes(list);
  assert.deepEqual(v.errors, []);
});
