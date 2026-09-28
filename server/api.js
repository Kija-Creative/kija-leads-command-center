// JSON API handlers. Each reads the data files fresh, applies one change, and answers
// { ok, errors, warnings, ...payload }: 200 when ok, 422 for a rule violation, 404 for an
// unknown id. Nothing here contacts a business or publishes anything.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createStore } from "../src/lib/store.js";
import { scoreLead } from "../src/lib/score.js";
import { leadsToCsv } from "../src/lib/csv.js";
import { dedupeKey, sameBusiness, slugify } from "../src/lib/normalize.js";
import { dateOf } from "../src/lib/week.js";
import {
  HISTORY_TYPES,
  QUEUE_DECISIONS,
  validateHistoryEntry,
  validateLead,
  validateOutreachPatch,
  validateRejection,
  validateRoiOverrides,
  validateSettings,
} from "../src/lib/validate.js";
import { HttpError } from "./http.js";
import { tryLoad } from "./modules.js";
import { demoFile, leadView, pitchFile, stateView } from "./views.js";

const OUTREACH_FIELDS = ["status", "nextAction", "nextDate", "owner", "notes"];
const DEMO_FIELDS = ["shareApproved", "palette"];
const PATCH_FIELDS = ["outreach", "roiOverrides", "demo"];
// Entries the app writes itself; a person adds the rest by hand.
const SYSTEM_HISTORY_TYPES = ["created", "status"];
const MANUAL_HISTORY_TYPES = HISTORY_TYPES.filter((t) => !SYSTEM_HISTORY_TYPES.includes(t));
const LEAD_SYSTEM_FIELDS = ["id", "outreach", "demo", "addedAt", "origin", "runId", "score", "roi", "drafts", "demoExists", "pitchExists"];
const CONTACT_STAGES = ["Contacted", "Replied", "Meeting"];
// Built from char codes so this file itself never contains the characters it rejects.
const DASH_RE = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
const ACTOR = "Jamey";

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function unprocessable(errors, warnings = []) {
  return new HttpError(422, errors, { warnings });
}

function requireObject(body, what) {
  if (!isPlainObject(body)) throw new HttpError(400, `${what} must be a JSON object.`);
}

function writeAtomic(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, file);
}

function fileExists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

export function createApi({ root, now, loaders, env }) {
  const clock = () => {
    const d = now();
    return d instanceof Date ? d : new Date(d);
  };
  const openStore = () => createStore(root, { now: clock });

  async function draftsFn() {
    const { mod } = await tryLoad(loaders, "drafts");
    return typeof mod?.buildDrafts === "function" ? mod.buildDrafts : null;
  }

  async function view(lead, state) {
    return leadView(lead, state, { root, buildDrafts: await draftsFn() });
  }

  function findLeadOr404(leads, id) {
    const lead = leads.find((l) => l.id === id);
    if (!lead) throw new HttpError(404, `No lead has the id "${id}".`);
    return lead;
  }

  // Read fresh, change one lead, write. Returns the changed lead.
  function changeLead(store, id, mutate) {
    let changed = null;
    store.updateLeads((leads) => {
      const idx = leads.findIndex((l) => l.id === id);
      if (idx < 0) throw new HttpError(404, `No lead has the id "${id}".`);
      const next = structuredClone(leads[idx]);
      mutate(next);
      leads[idx] = next;
      changed = next;
      return leads;
    });
    return changed;
  }

  function appendHistory(lead, entry) {
    lead.outreach = lead.outreach ?? { status: "New", nextAction: "", nextDate: "", owner: "", notes: "", history: [] };
    if (!Array.isArray(lead.outreach.history)) lead.outreach.history = [];
    lead.outreach.history.push({ at: clock().toISOString(), by: ACTOR, ...entry });
  }

  async function getState() {
    const store = openStore();
    const state = store.load();
    const runs = store.listRuns();
    const buildDrafts = await draftsFn();
    const renderMod = (await tryLoad(loaders, "demoRender")).mod;
    const pitchMod = (await tryLoad(loaders, "pitch")).mod;
    const pitchBuildMod = (await tryLoad(loaders, "pitchBuild")).mod;
    const demoMod = (await tryLoad(loaders, "demoBuild")).mod;
    const body = stateView(state, runs, {
      root,
      buildDrafts,
      placesKey: env.placesKey(),
      now: clock().toISOString(),
      templates: renderMod?.TEMPLATE_INFO ?? null,
    });
    body.modules = {
      drafts: Boolean(buildDrafts),
      pitch: typeof pitchBuildMod?.buildPitches === "function" || typeof pitchMod?.renderPitch === "function",
      demo: typeof demoMod?.buildDemos === "function",
    };
    return body;
  }

  async function knownPalettes(lead, categories) {
    const { mod } = await tryLoad(loaders, "demoRender");
    if (!mod?.TEMPLATE_INFO) return null;
    const vertical = typeof mod.resolveVertical === "function" ? mod.resolveVertical(lead, categories) : categories?.[lead.categoryKey]?.vertical;
    const info = mod.TEMPLATE_INFO[vertical];
    return info ? info.palettes.map((p) => p.key) : null;
  }

  async function patchLead(id, body) {
    requireObject(body, "The change");
    const store = openStore();
    const state = store.load();
    const current = findLeadOr404(state.leads, id);
    const errors = [];
    const warnings = [];

    const unknown = Object.keys(body).filter((k) => !PATCH_FIELDS.includes(k));
    if (unknown.length) errors.push(`Only outreach, roiOverrides and demo can be changed here; ${unknown.join(", ")} cannot.`);
    if (Object.keys(body).length === 0) errors.push("The change is empty. Send outreach, roiOverrides or demo.");

    const outreach = body.outreach;
    if (outreach !== undefined) {
      if (!isPlainObject(outreach)) errors.push("Outreach changes must be an object.");
      else {
        const extra = Object.keys(outreach).filter((k) => !OUTREACH_FIELDS.includes(k) && k !== "history");
        if (extra.length) errors.push(`Outreach can change ${OUTREACH_FIELDS.join(", ")}; ${extra.join(", ")} cannot be set.`);
        errors.push(...validateOutreachPatch(outreach).errors);
      }
    }
    if (body.roiOverrides !== undefined) errors.push(...validateRoiOverrides(body.roiOverrides).errors);

    const demo = body.demo;
    if (demo !== undefined) {
      if (!isPlainObject(demo)) errors.push("Demo changes must be an object.");
      else {
        const extra = Object.keys(demo).filter((k) => !DEMO_FIELDS.includes(k));
        if (extra.length) errors.push(`Demo can change shareApproved and palette; ${extra.join(", ")} cannot be set here.`);
        if (demo.shareApproved !== undefined && typeof demo.shareApproved !== "boolean") errors.push("shareApproved must be true or false.");
        if (demo.palette !== undefined) {
          if (typeof demo.palette !== "string" || (demo.palette !== "" && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(demo.palette))) {
            errors.push("Palette must be a palette key such as \"ember\", or empty to let the generator choose.");
          } else if (demo.palette !== "") {
            const palettes = await knownPalettes(current, state.categories);
            if (palettes && !palettes.includes(demo.palette)) {
              errors.push(`Palette "${demo.palette}" is not one of this template's palettes: ${palettes.join(", ")}.`);
            }
          }
        }
        if (demo.shareApproved === true && !current.demo?.shareApproved && !fileExists(demoFile(root, id))) {
          errors.push("Build the demo before approving it for sharing.");
        }
      }
    }
    if (errors.length) throw unprocessable(errors);

    const today = dateOf(clock());
    const updated = changeLead(store, id, (lead) => {
      if (isPlainObject(outreach)) {
        const o = lead.outreach ?? (lead.outreach = { status: "New", nextAction: "", nextDate: "", owner: "", notes: "", history: [] });
        const before = o.status;
        for (const f of OUTREACH_FIELDS) {
          if (outreach[f] === undefined) continue;
          o[f] = typeof outreach[f] === "string" && f !== "notes" ? outreach[f].trim() : outreach[f];
        }
        if (outreach.status !== undefined && outreach.status !== before) {
          appendHistory(lead, { type: "status", text: `${before || "No status"} to ${outreach.status}` });
          if (CONTACT_STAGES.includes(outreach.status) && lead.verification?.status !== "verified") {
            warnings.push(`${lead.business} is not marked verified. Recheck the listing and website before any contact.`);
          }
          if (outreach.status === "Demo Built" && !fileExists(demoFile(root, id))) {
            warnings.push("The status says Demo Built, but no demo file exists yet.");
          }
        }
        if (outreach.nextDate && outreach.nextDate < today) warnings.push(`The next date ${outreach.nextDate} is already in the past.`);
      }
      if (isPlainObject(body.roiOverrides)) {
        const merged = { ...(isPlainObject(lead.roiOverrides) ? lead.roiOverrides : {}) };
        for (const [k, v] of Object.entries(body.roiOverrides)) {
          if (v === null || v === "") delete merged[k];
          else merged[k] = v;
        }
        lead.roiOverrides = merged;
      }
      if (isPlainObject(demo)) {
        const d = lead.demo ?? (lead.demo = { builtAt: "", template: "", palette: "", shareApproved: false });
        if (demo.shareApproved !== undefined && demo.shareApproved !== Boolean(d.shareApproved)) {
          d.shareApproved = demo.shareApproved;
          appendHistory(lead, {
            type: "demo",
            text: demo.shareApproved ? "Demo approved for sharing." : "Share approval withdrawn.",
          });
        }
        if (demo.palette !== undefined && demo.palette !== (d.palette ?? "")) {
          d.palette = demo.palette;
          if (d.builtAt) warnings.push("Rebuild the demo to apply the new palette.");
        }
      }
    });
    return { ok: true, errors: [], warnings, lead: await view(updated, state) };
  }

  async function addHistory(id, body) {
    requireObject(body, "A history entry");
    const store = openStore();
    const state = store.load();
    findLeadOr404(state.leads, id);
    const entry = {
      type: body.type,
      text: typeof body.text === "string" ? body.text.trim() : body.text,
      by: typeof body.by === "string" && body.by.trim() ? body.by.trim() : ACTOR,
    };
    const errors = [...validateHistoryEntry(entry).errors];
    if (SYSTEM_HISTORY_TYPES.includes(entry.type)) {
      errors.push(`The app writes ${entry.type} entries itself. Add one of: ${MANUAL_HISTORY_TYPES.join(", ")}.`);
    }
    if (typeof entry.text === "string" && !entry.text) errors.push("Write what happened before adding the entry.");
    const extra = Object.keys(body).filter((k) => !["type", "text", "by"].includes(k));
    if (extra.length) errors.push(`A history entry has type, text and by only; ${extra.join(", ")} cannot be set.`);
    if (errors.length) throw unprocessable(errors);
    const updated = changeLead(store, id, (lead) => {
      appendHistory(lead, { by: entry.by, type: entry.type, text: entry.text });
    });
    return { ok: true, errors: [], warnings: [], lead: await view(updated, state) };
  }

  async function regenerateDemo(id) {
    const store = openStore();
    const state = store.load();
    findLeadOr404(state.leads, id);
    const { mod, error } = await tryLoad(loaders, "demoBuild");
    if (typeof mod?.buildDemos !== "function") {
      throw new HttpError(503, `The demo generator is ${error || "unavailable"} (src/cli/build-demos.js), so the demo was not rebuilt.`);
    }
    const report = await mod.buildDemos({ store, rootDir: root, selection: { mode: "id", value: id }, now: clock() });
    if (!report.ok) {
      const errors = [...(report.errors ?? [])];
      for (const f of report.failed ?? []) errors.push(...(f.errors ?? []).map((e) => `Guardrail: ${e}`));
      throw unprocessable(errors.length ? errors : ["The demo did not pass its guardrails, so it was not written."], report.warnings ?? []);
    }
    const built = (report.built ?? [])[0];
    const updated = changeLead(store, id, (lead) => {
      const detail = built ? ` with the ${built.template} template, ${built.palette} palette` : "";
      appendHistory(lead, { type: "demo", text: `Demo rebuilt${detail}. It is a private file; nothing was published.` });
    });
    return { ok: true, errors: [], warnings: report.warnings ?? [], lead: await view(updated, store.load()), built: built ?? null };
  }

  // Prefers the pitch module's own builder, which runs its guardrails; falls back to
  // renderPitch plus a dash check when only the renderer is present.
  async function regeneratePitch(id) {
    const store = openStore();
    const state = store.load();
    const lead = findLeadOr404(state.leads, id);
    const built = await tryLoad(loaders, "pitchBuild");
    if (typeof built.mod?.buildPitches === "function") {
      const report = await built.mod.buildPitches({ store, rootDir: root, selection: { mode: "id", value: id }, now: clock() });
      if (!report.ok) {
        const errors = [...(report.errors ?? [])];
        for (const f of report.failed ?? []) errors.push(...(f.errors ?? []).map((e) => `Guardrail: ${e}`));
        throw unprocessable(errors.length ? errors : ["The pitch page did not pass its guardrails, so it was not written."], report.warnings ?? []);
      }
      return { ok: true, errors: [], warnings: report.warnings ?? [], lead: await view(lead, state), file: `pitches/${id}/index.html` };
    }
    const { mod, error } = await tryLoad(loaders, "pitch");
    if (typeof mod?.renderPitch !== "function") {
      throw new HttpError(503, `Pitch pages are ${error || "unavailable"} (src/pitch/render.js), so nothing was rebuilt.`);
    }
    let html;
    try {
      const out = await mod.renderPitch(lead, {
        settings: state.settings,
        benchmarks: state.benchmarks,
        categories: state.categories,
        now: clock().toISOString(),
      });
      html = typeof out === "string" ? out : out?.html;
    } catch (err) {
      throw unprocessable([`The pitch page could not be rendered: ${err.message}`]);
    }
    if (typeof html !== "string" || !html.trim()) throw unprocessable(["The pitch renderer returned no HTML, so nothing was written."]);
    if (DASH_RE.test(html)) throw unprocessable(["The pitch page contains an em or en dash, so it was not written."]);
    const warnings = [];
    if (typeof mod.checkPitchHtml === "function") {
      const check = mod.checkPitchHtml(html, lead, { settings: state.settings });
      if (!check.ok) throw unprocessable(check.errors.map((e) => `Guardrail: ${e}`));
      warnings.push(...(check.warnings ?? []));
    }
    writeAtomic(pitchFile(root, id), html);
    return { ok: true, errors: [], warnings, lead: await view(lead, state), file: `pitches/${id}/index.html` };
  }

  async function exportShare(id) {
    const store = openStore();
    const state = store.load();
    const lead = findLeadOr404(state.leads, id);
    if (!lead.demo?.shareApproved) {
      throw unprocessable(["Approve the demo for sharing first. Nothing was exported."]);
    }
    const source = demoFile(root, id);
    if (!fileExists(source)) throw unprocessable(["Build the demo before exporting a share file."]);
    const html = fs.readFileSync(source, "utf8");
    const warnings = [];
    const { mod } = await tryLoad(loaders, "guardrails");
    if (typeof mod?.checkDemoHtml === "function") {
      const check = mod.checkDemoHtml(html, lead);
      if (!check.ok) throw unprocessable(check.errors.map((e) => `Guardrail: ${e}`));
    } else {
      warnings.push("The demo guardrails could not be loaded, so the share file was not rechecked.");
    }
    const name = `${id}-concept.html`;
    writeAtomic(path.join(root, "exports", name), html);
    const updated = changeLead(store, id, (l) => {
      appendHistory(l, { type: "demo", text: `Share file written to exports/${name}. Nothing was sent; where it goes is Jamey's call.` });
    });
    return { ok: true, errors: [], warnings, file: `exports/${name}`, url: `/exports/${name}`, lead: await view(updated, state) };
  }

  function buildPromotedLead(item, extra, { today, taken }) {
    const carried = isPlainObject(item.lead) ? item.lead : {};
    const strip = (obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => !LEAD_SYSTEM_FIELDS.includes(k)));
    const research = {
      business: item.candidate,
      category: item.category,
      categoryKey: item.categoryKey,
      city: item.city,
      state: item.state,
      metro: item.metro ?? "",
      phone: item.phone,
      googleRating: item.googleRating,
      googleReviews: item.googleReviews,
      websiteStatus: item.websiteStatus,
      whyKija: item.whyItMayFit,
      sources: Array.isArray(item.sources) ? item.sources : [],
      ...strip(carried),
      ...strip(extra),
    };
    const base = slugify(`${research.business ?? ""} ${research.city ?? ""} ${research.state ?? ""}`) || "lead";
    let id = base;
    for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
    const notes = [item.verificationNeeded, research.verification?.notes].filter(Boolean).join(" ");
    return {
      id,
      business: research.business,
      category: research.category,
      categoryKey: research.categoryKey,
      city: research.city,
      area: research.area ?? "",
      state: research.state,
      metro: research.metro ?? "",
      address: research.address ?? "",
      phone: research.phone,
      googleRating: research.googleRating,
      googleReviews: research.googleReviews,
      ratingSource: research.ratingSource ?? "",
      googleMapsUrl: research.googleMapsUrl ?? "",
      placeId: research.placeId ?? "",
      placesFetchedAt: research.placesFetchedAt ?? "",
      websiteGap: research.websiteGap,
      ticketValue: research.ticketValue,
      visualFit: research.visualFit,
      websiteStatus: research.websiteStatus,
      presence: { facebook: "", instagram: "", yelp: "", booking: "", other: [], ...(isPlainObject(research.presence) ? research.presence : {}) },
      confidence: research.confidence,
      whyKija: research.whyKija,
      pitchAngle: research.pitchAngle,
      demoConcept: research.demoConcept,
      services: research.services ?? [],
      reviewThemes: research.reviewThemes ?? [],
      languages: research.languages ?? [],
      established: research.established ?? null,
      hours: research.hours ?? "",
      demoCopy: research.demoCopy ?? {},
      sources: research.sources,
      verification: {
        status: "unverified",
        checkedAt: "",
        checks: [],
        ...(isPlainObject(research.verification) ? research.verification : {}),
        notes,
      },
      outreach: {
        status: "New",
        nextAction: "Build private homepage demo",
        nextDate: "",
        owner: "",
        notes: "",
        history: [],
      },
      demo: { builtAt: "", template: "", palette: "", shareApproved: false },
      roiOverrides: isPlainObject(research.roiOverrides) ? research.roiOverrides : {},
      addedAt: today,
      origin: "queue-promotion",
      runId: typeof item.runId === "string" ? item.runId : "",
    };
  }

  async function queueDecision(id, body) {
    requireObject(body, "A queue decision");
    const store = openStore();
    const state = store.load();
    const item = state.queue.find((q) => q.id === id);
    if (!item) throw new HttpError(404, `No research queue item has the id "${id}".`);
    const decision = body.decision;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!QUEUE_DECISIONS.includes(decision)) {
      throw unprocessable([`Decision ${JSON.stringify(decision)} is not one of: ${QUEUE_DECISIONS.join(", ")}.`]);
    }
    if (body.reason !== undefined && typeof body.reason !== "string") throw unprocessable(["The reason must be text."]);
    if (DASH_RE.test(reason)) throw unprocessable(["The reason contains an em or en dash. Use a comma, a period or a colon instead."]);
    if (body.lead !== undefined && decision !== "Promote") throw unprocessable(["Lead fields are only used when promoting."]);
    if (body.lead !== undefined && !isPlainObject(body.lead)) throw unprocessable(["Lead fields must be an object."]);

    const now = clock();
    const today = dateOf(now);

    if (decision === "Research") {
      const queue = state.queue.map((q) => (q.id === id ? { ...q, decision: "Research", reason: reason || q.reason, updatedAt: today } : q));
      store.saveQueue(queue);
      return { ok: true, errors: [], warnings: [], item: queue.find((q) => q.id === id) };
    }

    if (decision === "Drop") {
      if (!reason) throw unprocessable(["Say why it is being dropped. The reason is kept with the rejection."]);
      const rejection = {
        key: dedupeKey({ business: item.candidate, city: item.city, state: item.state, phone: item.phone }),
        business: item.candidate,
        city: item.city ?? "",
        state: item.state ?? "",
        phone: item.phone ?? "",
        reason,
        evidenceUrl: item.sources?.[0]?.url ?? "",
        rejectedAt: today,
        runId: typeof item.runId === "string" ? item.runId : "",
      };
      const v = validateRejection(rejection, { mode: "stored" });
      if (!v.ok) throw unprocessable(v.errors);
      const warnings = [];
      const rejected = [...state.rejected];
      if (rejected.some((r) => r.key === rejection.key)) {
        warnings.push(`${item.candidate} was already in the rejected list, so only the queue item was removed.`);
      } else {
        rejected.push(rejection);
      }
      store.saveRejected(rejected);
      store.saveQueue(state.queue.filter((q) => q.id !== id));
      return { ok: true, errors: [], warnings, removed: id, rejection };
    }

    // Promote.
    const taken = new Set(state.leads.map((l) => l.id));
    const candidate = buildPromotedLead(item, body.lead ?? {}, { today, taken });
    const v = validateLead(candidate, {
      settings: state.settings,
      categories: state.categories,
      chains: state.chains,
      geography: state.geography,
      mode: "manual",
      now: now.toISOString(),
    });
    const errors = [...v.errors];
    const dupe = state.leads.find((l) => sameBusiness(l, candidate));
    if (dupe) errors.push(`${candidate.business} matches the existing lead ${dupe.business} (${dupe.id}).`);
    if (errors.length) throw unprocessable(errors, v.warnings);

    const total = scoreLead(candidate, { thresholds: state.settings?.thresholds }).total;
    candidate.outreach.history.push({
      at: now.toISOString(),
      by: ACTOR,
      type: "created",
      text: `Promoted from the research queue with score ${total}.${reason ? ` ${reason}` : ""}`,
    });
    store.updateLeads((leads) => {
      if (leads.some((l) => l.id === candidate.id)) throw new HttpError(409, `A lead with the id ${candidate.id} appeared while promoting. Reload and try again.`);
      return [...leads, candidate];
    });
    store.saveQueue(state.queue.filter((q) => q.id !== id));
    return { ok: true, errors: [], warnings: v.warnings, removed: id, lead: await view(candidate, state) };
  }

  function mergeSettings(current, patch) {
    const out = structuredClone(current);
    for (const [k, v] of Object.entries(patch)) {
      if (isPlainObject(v) && isPlainObject(out[k])) out[k] = mergeSettings(out[k], v);
      else out[k] = structuredClone(v);
    }
    return out;
  }

  async function putSettings(body) {
    requireObject(body, "Settings");
    const store = openStore();
    const state = store.load();
    const current = state.settings;
    const known = new Set([...Object.keys(current), "weeklyQuota", "thresholds", "geography", "categoriesPerWeek", "offer", "contact", "demoDefaults"]);
    const unknown = Object.keys(body).filter((k) => !known.has(k));
    if (unknown.length) throw unprocessable([`Unknown setting ${unknown.join(", ")}. Settings are ${[...known].join(", ")}.`]);
    const merged = mergeSettings(current, body);
    const v = validateSettings(merged);
    const errors = [...v.errors];
    const home = merged.geography?.homeMetro;
    const metros = state.geography?.metros ?? [];
    if (home && metros.length && !metros.some((m) => m.key === home)) errors.push(`Home metro "${home}" is not in config/geography.json.`);
    if (errors.length) throw unprocessable(errors, v.warnings);
    store.saveSettings(merged);
    return { ok: true, errors: [], warnings: v.warnings, settings: merged };
  }

  function csv() {
    const state = openStore().load();
    return { text: leadsToCsv(state.leads, { thresholds: state.settings?.thresholds }), date: dateOf(clock()) };
  }

  return { getState, patchLead, addHistory, regenerateDemo, regeneratePitch, exportShare, queueDecision, putSettings, csv };
}
