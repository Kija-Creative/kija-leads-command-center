// ROI calculator. Recomputes in the browser with the same pure computeRoi the server and
// pitch pages use, so the numbers here always match what the pitch shows once saved.

import { benchmarkFor, computeRoi } from "/src/lib/roi.js";
import { api } from "../lib/api.js";
import { external, fill, h, nextId } from "../lib/dom.js";
import { dollars, one } from "../lib/format.js";
import { putLead, store } from "../lib/state.js";
import { feedbackSlot, showFeedback, toast, withBusy } from "./feedback.js";

const FIELDS = [
  { key: "ticket", label: "Typical ticket", prefix: "$", step: "10", min: "1" },
  { key: "margin", label: "Gross margin", suffix: "%", step: "1", min: "1", max: "100" },
  { key: "price", label: "Website price", prefix: "$", step: "50", min: "1" },
  { key: "jobsPerMonth", label: "Extra jobs a month", step: "0.5", min: "0.5" },
];

// Margin is a fraction in data and a percent on screen.
function toScreen(key, value) {
  if (value === null || value === undefined || value === "") return "";
  return key === "margin" ? String(Math.round(value * 1000) / 10) : String(value);
}

function fromScreen(key, text) {
  if (String(text).trim() === "") return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return key === "margin" ? n / 100 : n;
}

function sameNumber(a, b) {
  return a !== null && b !== null && Math.abs(a - b) < 1e-9;
}

export function roiCalculator(lead) {
  const data = store.data;
  const benchmark = benchmarkFor(data.benchmarks, lead.categoryKey);
  const offer = data.settings?.offer ?? {};
  const defaults = computeRoi({ lead, benchmark, offer, overrides: {} }).inputs;
  const defaultOf = { ticket: defaults.ticket, margin: defaults.margin, price: defaults.price, jobsPerMonth: defaults.jobsPerMonth };
  let saved = { ...(lead.roiOverrides ?? {}) };
  const inputs = {};
  const sourceSlots = {};
  const out = h("div", { class: "roi-out", "aria-live": "polite" });
  const dirtyNote = h("span", { class: "dirty-note" });
  const slot = feedbackSlot();

  function currentOverrides() {
    const o = {};
    for (const f of FIELDS) {
      const v = fromScreen(f.key, inputs[f.key].value);
      if (v === undefined) continue;
      if (v !== null && !sameNumber(v, defaultOf[f.key])) o[f.key] = v;
    }
    return o;
  }

  function invalidFields() {
    return FIELDS.filter((f) => {
      const bad = fromScreen(f.key, inputs[f.key].value) === undefined || (f.key === "margin" && Number(inputs[f.key].value) > 100);
      inputs[f.key].setAttribute("aria-invalid", String(bad));
      return bad;
    });
  }

  // A saved number equal to the default counts as no override.
  function isDirty(o) {
    for (const f of FIELDS) {
      const now = o[f.key] ?? null;
      const was = saved[f.key] !== undefined && !sameNumber(saved[f.key], defaultOf[f.key]) ? saved[f.key] : null;
      if (now === null && was === null) continue;
      if (now === null || was === null || !sameNumber(now, was)) return true;
    }
    return false;
  }

  function renderSources(roi, o) {
    for (const a of roi.assumptions) {
      const target = sourceSlots[a.key];
      if (!target) continue;
      if (o[a.key] !== undefined) {
        fill(target, h("span", { class: "chip" }, "Your number"), `Default ${a.key === "margin" ? `${Math.round(defaultOf.margin * 100)}%` : a.key === "jobsPerMonth" ? one(defaultOf.jobsPerMonth) : dollars(defaultOf[a.key])}`);
        continue;
      }
      if (a.key === "jobsPerMonth") {
        fill(target, a.source);
        continue;
      }
      if (a.verified) {
        fill(target, h("span", { class: "chip chip-good" }, "Sourced"), a.url ? external(a.url, a.source) : a.source);
        continue;
      }
      // A bare placeholder needs only the chip; anything else keeps its source text.
      const placeholder = /not researched/i.test(a.source);
      fill(
        target,
        h("span", { class: "chip chip-warn" }, a.key === "price" ? "Price not confirmed" : "Placeholder, not researched"),
        placeholder ? null : a.url ? external(a.url, a.source) : a.source,
      );
    }
  }

  function recompute() {
    const bad = invalidFields();
    const o = currentOverrides();
    const roi = computeRoi({ lead, benchmark, offer, overrides: o });
    renderSources(roi, o);
    dirtyNote.textContent = isDirty(o) ? "Unsaved changes" : "";
    if (bad.length) {
      fill(out, h("p", { class: "feedback" }, h("span", { class: "is-error" }, `${bad.map((f) => f.label).join(", ")} must be a positive number${bad.some((f) => f.key === "margin") ? ", margin at most 100%" : ""}.`)));
      return;
    }
    if (roi.breakEven.jobs === null) {
      fill(out, h("div", { class: "empty" }, h("p", null, roi.breakEven.sentence)));
      return;
    }
    const table = h(
      "table",
      { class: "roi-table" },
      h("caption", { class: "visually-hidden" }, "Scenarios for extra jobs a month"),
      h("thead", null, h("tr", null, ["Extra jobs a month", "Monthly revenue", "Annual revenue", "Annual gross profit", "Pays back in", "Return"].map((t) => h("th", { scope: "col" }, t)))),
      h(
        "tbody",
        null,
        roi.scenarios.map((s) =>
          h(
            "tr",
            { class: s.label === "middle" ? "is-middle" : "" },
            h("td", null, `${one(s.jobsPerMonth)} a month`),
            h("td", null, dollars(s.monthlyRevenue)),
            h("td", null, dollars(s.annualRevenue)),
            h("td", null, dollars(s.annualGrossProfit)),
            h("td", null, `${one(s.paybackMonths)} mo`),
            h("td", null, `${one(s.returnMultiple)}x`),
          ),
        ),
      ),
    );
    fill(
      out,
      h(
        "div",
        { class: "breakeven" },
        h("span", { class: "big" }, String(roi.breakEven.jobs)),
        h("span", { class: "big-label" }, `extra ${roi.breakEven.jobs === 1 ? "job pays" : "jobs pay"} for the site at ${dollars(roi.inputs.grossPerJob)} gross each`),
      ),
      h("p", { class: "sentence" }, roi.breakEven.sentence),
      h("div", { class: "table-scroll", style: { overflowX: "auto" } }, table),
      roi.rentedLeadComparison ? h("p", { class: "sentence" }, roi.rentedLeadComparison.sentence) : null,
      h(
        "ul",
        { class: "assumptions", "aria-label": "Assumptions" },
        roi.assumptions.map((a) =>
          h(
            "li",
            null,
            h("span", { class: "k" }, `${a.label}: ${a.display}`),
            a.url ? external(a.url, a.source) : h("span", { class: "faint" }, a.source),
          ),
        ),
      ),
      h("p", { class: "disclaimer" }, roi.disclaimer),
    );
  }

  const fields = FIELDS.map((f) => {
    const id = nextId("roi");
    const value = saved[f.key] ?? defaultOf[f.key];
    const input = h("input", {
      id,
      type: "number",
      inputmode: "decimal",
      step: f.step,
      min: f.min,
      max: f.max,
      value: toScreen(f.key, value),
      "aria-describedby": `${id}-src`,
      oninput: recompute,
    });
    inputs[f.key] = input;
    const src = h("div", { class: "source", id: `${id}-src` });
    sourceSlots[f.key] = src;
    const wrapped = f.prefix
      ? h("div", { class: "input-affix pre" }, h("b", { "aria-hidden": "true" }, f.prefix), input)
      : f.suffix
        ? h("div", { class: "input-affix post" }, input, h("b", { "aria-hidden": "true" }, f.suffix))
        : input;
    return h("div", { class: "field" }, h("label", { for: id }, f.label), wrapped, src);
  });

  const save = h("button", { type: "submit", class: "btn btn-primary btn-small" }, "Save numbers");
  const reset = h("button", { type: "button", class: "btn btn-quiet btn-small" }, "Use defaults");

  async function persist(body, button, success) {
    const res = await withBusy(button, () => api.patchLead(lead.id, { roiOverrides: body }));
    showFeedback(slot, res, { success });
    toast(res, { success });
    if (res.ok && res.lead) {
      saved = { ...(res.lead.roiOverrides ?? {}) };
      putLead(res.lead);
      recompute();
    }
  }

  const form = h(
    "form",
    {
      class: "roi-inputs",
      onsubmit: (e) => {
        e.preventDefault();
        if (invalidFields().length) return;
        const o = currentOverrides();
        const body = {};
        for (const f of FIELDS) body[f.key] = o[f.key] ?? null;
        persist(body, save, "ROI numbers saved for this lead.");
      },
    },
    fields,
    h("div", { class: "form-actions", style: { marginTop: "4px" } }, save, reset, dirtyNote),
    slot,
  );

  reset.addEventListener("click", () => {
    for (const f of FIELDS) inputs[f.key].value = toScreen(f.key, defaultOf[f.key]);
    recompute();
    if (Object.keys(saved).length) persist({ ticket: null, margin: null, price: null, jobsPerMonth: null }, reset, "Back to the default numbers.");
  });

  const el = h("div", { class: "panel roi" }, form, out);
  recompute();
  return el;
}
