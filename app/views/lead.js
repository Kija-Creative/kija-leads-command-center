// #/lead/<id>: everything about one lead, and every action Jamey takes on it.
// Sections rebuild from the server's response after each change; the ROI calculator keeps
// its own state so a save elsewhere never wipes numbers being tried out.

import { callCheck } from "/src/lib/compliance.js";
import { confidenceChip, demoChip, pitchChip, statusChip, verificationChip } from "../components/chips.js";
import { confirmWithReason } from "../components/confirm.js";
import { deviceFrame, deviceSwitch } from "../components/device.js";
import { feedbackSlot, showFeedback, toast, withBusy } from "../components/feedback.js";
import { notesPanel } from "../components/notes.js";
import { ratingText } from "../components/leadcard.js";
import { roiCalculator } from "../components/roi.js";
import { scoreBlock, scoreParts } from "../components/score.js";
import { api } from "../lib/api.js";
import { external, fill, h, nextId } from "../lib/dom.js";
import { formatDateTime, formatDay, number, place, rating } from "../lib/format.js";
import {
  byScore,
  categoryLabel,
  leadById,
  leads,
  MANUAL_HISTORY_TYPES,
  metroName,
  OUTREACH_STATUSES,
  OWNERS,
  PHONE_LINE_TYPES,
  putLead,
  store,
} from "../lib/state.js";

const GAP_WORDS = { 1: "weak own site", 2: "very weak or third party only", 3: "no credible owned site" };
const TICKET_WORDS = { 1: "low", 2: "medium", 3: "high" };
const VISUAL_WORDS = { 1: "limited", 2: "good", 3: "excellent" };
const ORIGINS = { "sheet-import": "Sheet import", "weekly-run": "Weekly run", manual: "Added by hand", "queue-promotion": "Promoted from the queue" };
// ratingSource values. "places-api" is invalid for stored leads (research/places-api.md) and
// "google-maps" is the older spelling of google-maps-observed.
const RATING_SOURCES = {
  "google-maps-observed": "Read from the public Google Maps listing",
  "google-maps": "Read from the public Google Maps listing",
  secondary: "From a secondary mirror, confirm on Google Maps",
  owner: "Given by the owner",
  "places-api": "From the Places API, which may not be stored. Recheck on the public listing",
};
const CLOCK_MS = 30000;
const CLOSED_STATUSES = ["Won", "Lost", "Not a fit"];
const TEXAS_RE = /Texas phone solicitation/;
const ADDRESS_RE = /mailing address|postal address/i;
const CONSENT_CHANNELS = [
  ["texts", "Texts", "Agreed to follow up by text."],
  ["email", "Email", "Agreed to follow up by email."],
  ["call", "A call back", "Agreed to a follow up call."],
];

// The date the rating was read, from the Maps source when there is one.
function ratingCheckedAt(lead) {
  const sources = Array.isArray(lead.sources) ? lead.sources : [];
  const maps = sources.find((s) => s.url && (s.url === lead.googleMapsUrl || /google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(s.url)));
  return maps?.checkedAt || lead.verification?.checkedAt || "";
}

function ratingNote(lead) {
  const from = lead.ratingSource ? RATING_SOURCES[lead.ratingSource] ?? lead.ratingSource : "";
  const when = ratingCheckedAt(lead);
  if (!from) return when ? `Checked ${formatDay(when, { year: true })}` : null;
  return when ? `${from}, ${formatDay(when, { year: true })}` : from;
}

// "10:42 AM Tuesday, Central" to its clock time and the rest.
function splitLocal(label) {
  const m = /^(\d{1,2}:\d{2} [AP]M) (.+)$/.exec(String(label ?? ""));
  return m ? [m[1], m[2]] : [String(label ?? ""), ""];
}

async function copyText(text, what) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = h("textarea", { style: { position: "fixed", opacity: "0" } });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  toast({ ok: true, warnings: [] }, { success: `${what} copied. Nothing was sent.` });
}

function copyButton(text, what) {
  return h("button", { type: "button", class: "btn btn-small", onclick: () => copyText(text, what) }, "Copy");
}

function fact(label, value, { big = false, note = null } = {}) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length)) return null;
  return h("div", null, h("dt", null, label), h("dd", { class: big ? "big" : null }, Array.isArray(value) ? value.join(", ") : value), note ? h("dd", { class: "faint small" }, note) : null);
}

function scale(value, words) {
  return value ? `${value} of 3, ${words[value] ?? ""}` : "";
}

function section(title, body, { id, aside = null } = {}) {
  const hid = id ?? nextId("sec");
  return h("section", { "aria-labelledby": hid }, h("div", { class: "section-head" }, h("h2", { class: "section-title", id: hid }, title), aside), body);
}

export function render({ params, navigate }) {
  const id = params[0];
  let lead = leadById(id);
  if (!lead) {
    return {
      title: "Lead not found",
      el: h(
        "div",
        { class: "empty" },
        h("h1", { class: "page-title", tabindex: "-1" }, "No lead with that id"),
        h("p", null, `Nothing in data/leads.json has the id "${id}". It may have been renamed by a reimport, or the link is old.`),
        h("div", { class: "form-actions" }, h("a", { class: "btn", href: "#/pipeline" }, "Back to the pipeline")),
      ),
    };
  }

  const order = store.order.length && store.order.includes(id) ? store.order : [...leads()].sort(byScore).map((l) => l.id);
  store.selectedId = id;
  const pos = order.indexOf(id);
  const prevId = pos > 0 ? order[pos - 1] : null;
  const nextLeadId = pos >= 0 && pos < order.length - 1 ? order[pos + 1] : null;

  const mounts = {
    head: h("div"),
    readiness: h("div"),
    drafts: h("div"),
    outreach: h("div"),
    actions: h("div"),
    history: h("div"),
    preview: h("div"),
    research: h("div"),
  };
  let frame = null;
  let device = "desktop";
  // The call check reruns in the browser on a timer, so the prospect's local time and the
  // call window stay current while the page is open.
  let clockMount = null;
  const clockTimer = setInterval(() => {
    if (clockMount?.isConnected) fill(clockMount, callBlock(liveCall() ?? lead.compliance?.call ?? null));
  }, CLOCK_MS);

  function liveCall() {
    try {
      return callCheck({ lead, settings: store.data.settings ?? {}, now: new Date(), suppression: lead.suppressed ? [lead.suppressed] : [] });
    } catch {
      return null;
    }
  }

  function callLimits() {
    const c = store.data.settings?.compliance ?? {};
    return { perDay: c.maxCallsPerDay ?? 1, total: c.maxCallsTotal ?? 3 };
  }

  function callBlock(call) {
    if (!call) return h("p", { class: "muted small" }, "The call check is not available. It appears once src/lib/compliance.js is installed.");
    const [time, zone] = splitLocal(call.localLabel);
    const reasons = Array.isArray(call.reasons) ? call.reasons : [];
    const texas = reasons.filter((r) => TEXAS_RE.test(r));
    const other = reasons.filter((r) => !TEXAS_RE.test(r));
    const limits = callLimits();
    const suppressed = Boolean(lead.compliance?.suppressed || lead.suppressed);
    const verdict = suppressed ? ["chip-bad", "Do not contact"] : call.ok ? ["chip-good", "OK to call now"] : ["chip-bad", "Do not call now"];
    return [
      h(
        "div",
        { class: "ready-clock" },
        h("div", null, h("span", { class: "ready-kicker" }, "Their local time"), h("span", { class: "ready-time" }, time || "Unknown"), h("span", { class: "ready-zone" }, zone || "No time zone for this state")),
        h("span", { class: `chip ${verdict[0]}` }, verdict[1]),
      ),
      other.length ? h("ul", { class: `ready-reasons${call.ok ? " is-advisory" : ""}` }, other.map((r) => h("li", null, r))) : null,
      h(
        "dl",
        { class: "ready-counts" },
        h("div", null, h("dt", null, "Calls today"), h("dd", null, `${call.callsToday ?? 0} of ${limits.perDay}`)),
        h("div", null, h("dt", null, "Calls in total"), h("dd", null, `${call.callsTotal ?? 0} of ${limits.total}`)),
      ),
      texas.length
        ? h("div", { class: "notice notice-warn" }, texas[0], " ", h("a", { href: "#/settings?focus=compliance" }, "Texas status in Settings"), h("span", { class: "faint" }, " Not legal advice."))
        : null,
    ];
  }

  // Rebuild the named sections from the latest copy of the lead, keeping focus if it was inside.
  function refresh(names) {
    lead = leadById(id) ?? lead;
    const active = document.activeElement;
    const focusId = active?.id;
    const wasInside = names.some((n) => mounts[n].contains(active));
    for (const name of names) {
      if (name === "preview") frame?.destroy();
      fill(mounts[name], builders[name]());
    }
    if (wasInside && focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
  }

  // Toast, store the returned lead, rebuild sections, then show the reply inline in the
  // section that asked (its rebuilt slot when it was rebuilt). Returns the slot used.
  function applyResult(res, success, names, { mount, slot }) {
    toast(res, { success });
    if (res.ok && res.lead) {
      putLead(res.lead);
      refresh(names);
    }
    const target = res.ok && names.includes(mount) ? mounts[mount].querySelector(".feedback") : slot;
    showFeedback(target, res, { success });
    return target;
  }

  const builders = {
    head() {
      const phone = lead.phone
        ? h("span", { class: "copy-line" }, lead.phone, h("button", { type: "button", class: "btn btn-quiet btn-small", onclick: () => copyText(lead.phone, "Phone number") }, "Copy"))
        : null;
      return h(
        "header",
        { class: "lead-head" },
        h(
          "div",
          null,
          h("h1", { class: "lead-title", tabindex: "-1" }, lead.business),
          h("p", { class: "lead-sub" }, h("span", null, lead.category || categoryLabel(lead.categoryKey)), h("span", null, place(lead)), ratingText(lead), phone),
          h("div", { class: "chips" }, statusChip(lead.outreach?.status), confidenceChip(lead.confidence), verificationChip(lead.verification), demoChip(lead), pitchChip(lead)),
        ),
        scoreBlock(lead.score),
      );
    },

    readiness() {
      const c = lead.compliance ?? {};
      const slot = feedbackSlot();
      const entry = lead.suppressed ?? null;
      const suppressed = Boolean(c.suppressed || entry);
      clockMount = h("div", { class: "ready-call" });
      fill(clockMount, callBlock(liveCall() ?? c.call ?? null));

      const email = c.email ?? null;
      const emailReasons = email?.reasons ?? [];
      const addressMissing = !String(store.data.settings?.contact?.address ?? "").trim() || emailReasons.some((r) => ADDRESS_RE.test(r));
      const emailLine = h(
        "div",
        { class: "ready-line" },
        h("div", { class: "ready-line-head" }, h("span", { class: "ready-label" }, "Email"), email ? h("span", { class: `chip ${email.ok ? "chip-good" : "chip-warn"}` }, email.ok ? "Ready to send" : "Not ready") : h("span", { class: "chip chip-muted" }, "Not checked")),
        email && !email.ok && emailReasons.length ? h("ul", { class: "ready-reasons" }, emailReasons.map((r) => h("li", null, r))) : null,
        email && !email.ok && addressMissing && !suppressed ? h("a", { class: "small", href: "#/settings?focus=address" }, "Add the mailing address in Settings") : null,
      );

      const text = c.text ?? null;
      const textLine = h(
        "div",
        { class: "ready-line" },
        h("div", { class: "ready-line-head" }, h("span", { class: "ready-label" }, "Texts"), h("span", { class: `chip ${text?.ok ? "chip-good" : "chip-muted"}` }, text?.ok ? "Follow up text allowed" : "No texts")),
        text?.reason ? h("p", { class: "muted small" }, text.reason) : null,
      );

      const lineType = lead.phoneLineType || "unknown";
      const line = h("select", { id: "lr-line", disabled: suppressed }, PHONE_LINE_TYPES.map(([v, label]) => h("option", { value: v, selected: v === lineType }, label)));
      line.addEventListener("change", async () => {
        const res = await withBusy(line, () => api.patchLead(id, { phoneLineType: line.value }));
        if (!res.ok) line.value = lineType;
        applyResult(res, "Phone line type saved.", ["readiness", "drafts"], { mount: "readiness", slot });
      });
      const lineHint = lineType === "landline" || lineType === "voip"
        ? "A business line. Calls inside the window are fine."
        : "May be the owner's personal cell, which the FCC can treat as residential. Email first.";

      if (suppressed) {
        return h(
          "section",
          { class: "panel readiness is-suppressed", "aria-labelledby": "lr-title" },
          h("h2", { class: "rail-title", id: "lr-title" }, "Outreach readiness"),
          h(
            "div",
            { class: "notice notice-bad", role: "note" },
            h("strong", null, "Do not contact."),
            ` ${lead.business} is on the do not contact list${entry?.addedAt ? ` since ${formatDay(entry.addedAt, { year: true })}` : ""}. No calls, emails or texts, and it is never ingested again.`,
            entry?.reason ? h("p", { class: "small", style: { margin: "6px 0 0" } }, `Reason: ${entry.reason}`) : null,
          ),
          slot,
        );
      }

      // Record consent: what the owner agreed to, in their words. A text consent opens the
      // follow up text; the others are logged for the record.
      const channel = h("select", { id: "lr-channel" }, CONSENT_CHANNELS.map(([v, label]) => h("option", { value: v }, label)));
      const said = h("textarea", { id: "lr-said", rows: "2", placeholder: "For example: on the call, the owner said to text this number" });
      const record = h("button", { type: "submit", class: "btn btn-small", id: "lr-record" }, "Record consent");
      const consentForm = h(
        "form",
        {
          class: "stack",
          onsubmit: async (e) => {
            e.preventDefault();
            const what = said.value.trim();
            if (!what) {
              showFeedback(slot, { ok: false, errors: ["Write what the owner said, and where, before recording consent."], warnings: [] });
              said.focus();
              return;
            }
            const lead0 = CONSENT_CHANNELS.find(([v]) => v === channel.value)?.[2] ?? "";
            const res = await withBusy(record, () => api.addHistory(id, { type: "consent", text: `${lead0} ${what}`, by: "Jamey" }));
            applyResult(res, "Consent recorded in the history.", ["readiness", "history", "drafts"], { mount: "readiness", slot });
          },
        },
        h("div", { class: "field" }, h("label", { for: "lr-channel" }, "They agreed to"), channel),
        h("div", { class: "field" }, h("label", { for: "lr-said" }, "What they said, and where"), said),
        h("div", { class: "form-actions" }, record, h("span", { class: "faint small" }, "Logged, never sent.")),
      );

      const dnc = h("button", { type: "button", class: "btn btn-small btn-danger", id: "lr-dnc" }, "Do not contact");
      dnc.addEventListener("click", async () => {
        const reason = await confirmWithReason({
          title: `Do not contact ${lead.business}`,
          body: [
            "This adds the business to the do not contact list, sets the lead to Not a fit and logs it in the history. It covers every channel: no calls, emails or texts, and the weekly run never adds it again.",
            "It cannot be moved back to an active status from the app.",
          ],
          label: "Why",
          placeholder: "For example: owner asked not to be contacted, on the call",
          confirmLabel: "Add to do not contact",
          danger: true,
        });
        if (!reason) {
          dnc.focus();
          return;
        }
        const res = await withBusy(dnc, () => api.suppress(id, { reason }));
        applyResult(res, "Added to the do not contact list. Nothing was sent.", ["head", "readiness", "outreach", "history", "drafts"], { mount: "readiness", slot });
      });

      return h(
        "section",
        { class: "panel readiness", "aria-labelledby": "lr-title" },
        h("h2", { class: "rail-title", id: "lr-title" }, "Outreach readiness"),
        clockMount,
        emailLine,
        textLine,
        h("div", { class: "field ready-field" }, h("label", { for: "lr-line" }, "Phone line type"), line, h("p", { class: "faint small ready-hint" }, lineHint)),
        h("details", { class: "disclose ready-consent" }, h("summary", null, "Record consent"), consentForm),
        h("div", { class: "ready-dnc" }, dnc, h("span", { class: "faint small" }, "Any request to stop, in any words, belongs here the same day.")),
        slot,
      );
    },

    drafts() {
      const drafts = lead.drafts;
      if (!drafts) {
        return h(
          "div",
          { class: "empty" },
          h("p", null, store.data.modules?.drafts === false ? "Outreach drafts appear here once the pitch module (src/pitch/drafts.js) is installed." : "No drafts could be written for this lead."),
        );
      }
      const c = lead.compliance ?? {};
      const email = c.email ?? drafts.ready?.email ?? null;
      const emailOk = email ? Boolean(email.ok) : true;
      const emailWhy = email && !email.ok ? (email.reasons ?? []).join(" ") || "The email is not ready to send." : "";
      const textOk = Boolean((c.text ?? drafts.ready?.text)?.ok);
      const call = liveCall() ?? c.call ?? null;
      const gated = (text, what, ok, why) => {
        const b = h("button", { type: "button", class: "btn btn-small", disabled: !ok, title: ok ? null : why, "aria-describedby": ok ? null : "ld-email-why" }, what === "Subject" ? "Copy" : "Copy body");
        if (ok) b.addEventListener("click", () => copyText(text, what === "Subject" ? "Subject" : "Email body"));
        return b;
      };
      const emailPanel = drafts.email && (drafts.email.subject || drafts.email.body)
        ? h(
          "div",
          { class: "panel draft" },
          h("div", { class: "draft-head" }, h("h3", null, "Email"), h("div", { class: "row" }, gated(drafts.email.subject ?? "", "Subject", emailOk, emailWhy), gated(drafts.email.body ?? "", "Email body", emailOk, emailWhy))),
          emailOk
            ? null
            : h(
              "p",
              { class: "draft-block", id: "ld-email-why" },
              h("span", { class: "chip chip-warn" }, "Not ready to send"),
              ` ${emailWhy}`,
              ADDRESS_RE.test(emailWhy) ? [" ", h("a", { href: "#/settings?focus=address" }, "Add it in Settings")] : null,
            ),
          h("p", { class: "subject" }, drafts.email.subject),
          h("pre", null, drafts.email.body),
        )
        : null;
      const callChip = call ? h("span", { class: `chip ${call.ok ? "chip-good" : "chip-bad"}` }, call.ok ? "OK to call now" : "Do not call now") : null;
      const others = [
        ["Call script", drafts.callScript, callChip],
        ["Voicemail", drafts.voicemail, null],
        ["Follow up text", textOk ? drafts.followUpText : "", null],
      ]
        .filter(([, text]) => text)
        .map(([label, text, chip]) => h("div", { class: "panel draft" }, h("div", { class: "draft-head" }, h("h3", null, label), h("div", { class: "row" }, chip, copyButton(text, label))), h("pre", null, text)));
      const textHidden = !textOk && !c.suppressed && drafts.followUpText !== undefined
        ? h("p", { class: "muted small" }, `The follow up text is hidden. ${(c.text?.reason ?? "No consent to texts is recorded.")} Record consent in Outreach readiness once the owner agrees.`)
        : null;
      return h(
        "div",
        { class: "drafts" },
        h("p", { class: "notice" }, "Drafts to copy and send yourself. Nothing in this app sends anything."),
        emailPanel,
        others,
        textHidden,
        drafts.notes
          ? h("div", { class: "notice" }, h("strong", null, "Before sending"), h("ul", null, String(drafts.notes).split(/\n+/).filter(Boolean).map((n) => h("li", null, n))))
          : null,
      );
    },

    research() {
      const v = lead.verification ?? {};
      const presence = lead.presence ?? {};
      const presenceLinks = [
        ["Facebook", presence.facebook],
        ["Instagram", presence.instagram],
        ["Yelp", presence.yelp],
        ["Booking", presence.booking],
        ...(Array.isArray(presence.other) ? presence.other.map((o) => [typeof o === "string" ? "Other" : o.label ?? "Other", typeof o === "string" ? o : o.url]) : []),
      ].filter(([, url]) => url);
      const checks = Array.isArray(v.checks) ? v.checks : [];
      const sources = Array.isArray(lead.sources) ? lead.sources : [];
      return h(
        "div",
        null,
        section(
          "Verification",
          h(
            "div",
            { class: "stack" },
            h("div", { class: "row" }, verificationChip(v), v.checkedAt ? h("span", { class: "muted small" }, `Checked ${formatDay(v.checkedAt, { year: true })}`) : h("span", { class: "muted small" }, "Not checked yet")),
            checks.length
              ? h(
                "ul",
                { class: "checks" },
                checks.map((c) => h("li", null, h("span", { class: "what" }, c.check), h("span", { class: "res" }, c.result, c.url ? [" ", external(c.url, "evidence")] : null))),
              )
              : h("p", { class: "muted" }, "No verification checks recorded. The weekly run records at least three per lead: exact name search, Maps listing and a domain probe."),
            v.notes ? h("p", { class: "prose muted" }, v.notes) : null,
          ),
        ),
        section(
          "Sources",
          sources.length
            ? h(
              "ul",
              { class: "sources" },
              sources.map((s) => h("li", null, external(s.url, s.label || s.url), s.checkedAt ? h("span", { class: "date" }, `checked ${formatDay(s.checkedAt, { year: true })}`) : null)),
            )
            : h("div", { class: "empty" }, h("p", null, "No sources yet. Add at least one page that shows the rating, reviews and missing website before contacting this business.")),
        ),
        section(
          "Presence",
          presenceLinks.length
            ? h("ul", { class: "sources" }, presenceLinks.map(([label, url]) => h("li", null, h("span", { class: "muted" }, label), external(url, url.replace(/^https?:\/\/(www\.)?/, "")))))
            : h("p", { class: "muted" }, "No social or booking profiles recorded. The research run adds them when it finds them."),
        ),
      );
    },

    outreach() {
      const o = lead.outreach ?? {};
      const slot = feedbackSlot();
      // A business on the do not contact list can only sit at a closed status.
      const closedOnly = Boolean(lead.compliance?.suppressed || lead.suppressed);
      const statusSel = h(
        "select",
        { id: "lo-status", name: "status" },
        OUTREACH_STATUSES.map((s) => h("option", { value: s, selected: s === o.status, disabled: closedOnly && !CLOSED_STATUSES.includes(s) && s !== o.status }, s)),
      );
      const nextAction = h("input", { id: "lo-next", name: "nextAction", value: o.nextAction ?? "", autocomplete: "off" });
      const nextDate = h("input", { id: "lo-date", name: "nextDate", type: "date", value: o.nextDate ?? "" });
      const owner = h("select", { id: "lo-owner", name: "owner" }, OWNERS.map((w) => h("option", { value: w, selected: w === (o.owner ?? "") }, w || "Unassigned")));
      const notes = h("textarea", { id: "lo-notes", name: "notes", rows: "4" });
      notes.value = o.notes ?? "";
      const save = h("button", { type: "submit", class: "btn btn-primary", id: "lo-save" }, "Save outreach");
      const dirty = h("span", { class: "dirty-note" });
      const read = () => ({ status: statusSel.value, nextAction: nextAction.value, nextDate: nextDate.value, owner: owner.value, notes: notes.value });
      const initial = JSON.stringify(read());
      const form = h(
        "form",
        {
          class: "panel",
          "aria-labelledby": "lo-title",
          oninput: () => {
            dirty.textContent = JSON.stringify(read()) === initial ? "" : "Unsaved changes";
          },
          onsubmit: async (e) => {
            e.preventDefault();
            const res = await withBusy(save, () => api.patchLead(id, { outreach: read() }));
            applyResult(res, "Outreach saved.", ["head", "readiness", "outreach", "history", "drafts"], { mount: "outreach", slot });
          },
        },
        h("h2", { class: "rail-title", id: "lo-title" }, "Outreach"),
        h(
          "div",
          { class: "stack" },
          h("div", { class: "field" }, h("label", { for: "lo-status" }, "Status"), statusSel),
          h("div", { class: "field" }, h("label", { for: "lo-next" }, "Next action"), nextAction),
          h(
            "div",
            { class: "form-grid", style: { gridTemplateColumns: "1fr 1fr" } },
            h("div", { class: "field" }, h("label", { for: "lo-date" }, "Next date"), nextDate),
            h("div", { class: "field" }, h("label", { for: "lo-owner" }, "Owner"), owner),
          ),
          h("div", { class: "field" }, h("label", { for: "lo-notes" }, "Notes"), notes),
        ),
        h("div", { class: "form-actions" }, save, dirty),
        slot,
      );
      return form;
    },

    actions() {
      const d = lead.demo ?? {};
      const modules = store.data.modules ?? {};
      const slot = feedbackSlot();
      const demoHref = `/demos/${encodeURIComponent(id)}/`;
      const pitchHref = `/pitches/${encodeURIComponent(id)}/`;
      const buildDemo = h("button", { type: "button", class: "btn btn-small", id: "la-demo", disabled: modules.demo === false }, lead.demoExists ? "Rebuild demo" : "Build demo");
      const buildPitch = h("button", { type: "button", class: "btn btn-small", id: "la-pitch", disabled: modules.pitch === false }, lead.pitchExists ? "Rebuild pitch" : "Build pitch");
      const approve = h("input", { type: "checkbox", id: "la-approve", checked: Boolean(d.shareApproved), disabled: !lead.demoExists && !d.shareApproved });
      const exportBtn = h("button", { type: "button", class: "btn btn-small", id: "la-export", disabled: !d.shareApproved }, "Export share file");

      const vertical = store.data.categories?.[lead.categoryKey]?.vertical;
      const palettes = store.data.templates?.[vertical]?.palettes ?? store.data.templates?.general?.palettes ?? [];
      const palette = palettes.length
        ? h(
          "select",
          { id: "la-palette" },
          h("option", { value: "", selected: !d.palette }, "Chosen by the generator"),
          palettes.map((p) => h("option", { value: p.key, selected: p.key === d.palette }, p.name ?? p.key)),
        )
        : null;

      buildDemo.addEventListener("click", async () => {
        const res = await withBusy(buildDemo, () => api.buildDemo(id));
        applyResult(res, "Demo built. It is a private file.", ["head", "actions", "history", "preview"], { mount: "actions", slot });
      });
      buildPitch.addEventListener("click", async () => {
        const res = await withBusy(buildPitch, () => api.buildPitch(id));
        applyResult(res, "Pitch page built. It is a private file.", ["head", "actions"], { mount: "actions", slot });
      });
      approve.addEventListener("change", async () => {
        const want = approve.checked;
        const res = await api.patchLead(id, { demo: { shareApproved: want } });
        const msg = want ? "Approved for sharing. Export makes a file; nothing is sent." : "Share approval withdrawn.";
        if (!res.ok) approve.checked = !want;
        applyResult(res, msg, ["head", "actions", "history"], { mount: "actions", slot });
      });
      exportBtn.addEventListener("click", async () => {
        const res = await withBusy(exportBtn, () => api.exportShare(id));
        const msg = res.file ? `Wrote ${res.file}. Where it goes is your call.` : "Share file written.";
        const after = applyResult(res, msg, ["actions", "history"], { mount: "actions", slot });
        if (res.ok && res.url) after.append(h("div", null, h("a", { href: res.url, target: "_blank", rel: "noopener" }, "Open the share file")));
      });
      palette?.addEventListener("change", async () => {
        const res = await api.patchLead(id, { demo: { palette: palette.value } });
        applyResult(res, "Palette saved.", ["actions"], { mount: "actions", slot });
      });

      const unavailable = [];
      if (modules.demo === false) unavailable.push("The demo generator is not installed, so demos cannot be built from here.");
      if (modules.pitch === false) unavailable.push("The pitch module is not installed yet, so pitch pages cannot be built from here.");

      return h(
        "div",
        { class: "panel" },
        h("h2", { class: "rail-title" }, "Demo and pitch"),
        h(
          "div",
          { class: "row" },
          lead.demoExists ? h("a", { class: "btn btn-small", href: demoHref, target: "_blank", rel: "noopener" }, "Open demo") : null,
          lead.pitchExists ? h("a", { class: "btn btn-small", href: pitchHref, target: "_blank", rel: "noopener" }, "Open pitch") : null,
          h("a", { class: "btn btn-small btn-primary", href: `#/present/${encodeURIComponent(id)}`, title: "Present (p)" }, "Present"),
        ),
        h("div", { class: "row", style: { marginTop: "8px" } }, buildDemo, buildPitch),
        palette ? h("div", { class: "field", style: { marginTop: "14px" } }, h("label", { for: "la-palette" }, "Demo palette"), palette) : null,
        h(
          "div",
          { style: { marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--line)" } },
          h("label", { class: "check", for: "la-approve" }, approve, "Approved for sharing"),
          h(
            "p",
            { class: "muted small", style: { margin: "6px 0 10px" } },
            lead.demoExists
              ? "Approval only allows a share file to be written to exports. Nothing is published or sent."
              : "Build the demo first. Approval only allows a share file to be written to exports.",
          ),
          exportBtn,
        ),
        unavailable.length ? h("div", { class: "notice", style: { marginTop: "12px" } }, unavailable.join(" ")) : null,
        h("div", { style: { marginTop: "10px" } }, slot),
      );
    },

    history() {
      const history = [...(lead.outreach?.history ?? [])].reverse();
      const slot = feedbackSlot();
      const type = h("select", { id: "lh-type" }, MANUAL_HISTORY_TYPES.map((t) => h("option", { value: t }, t[0].toUpperCase() + t.slice(1))));
      const text = h("textarea", { id: "lh-text", rows: "2", placeholder: "What happened" });
      const add = h("button", { type: "submit", class: "btn btn-small", id: "lh-add" }, "Add to history");
      const form = h(
        "form",
        {
          style: { marginTop: "12px", paddingTop: "14px", borderTop: "1px solid var(--line)" },
          onsubmit: async (e) => {
            e.preventDefault();
            const res = await withBusy(add, () => api.addHistory(id, { type: type.value, text: text.value, by: "Jamey" }));
            applyResult(res, "History entry added.", ["readiness", "history", "drafts"], { mount: "history", slot });
            if (res.ok) document.getElementById("lh-text")?.focus();
          },
        },
        h("div", { class: "form-grid", style: { gridTemplateColumns: "8rem 1fr" } }, h("div", { class: "field" }, h("label", { for: "lh-type" }, "Type"), type), h("div", { class: "field" }, h("label", { for: "lh-text" }, "Entry"), text)),
        h("div", { class: "form-actions", style: { marginTop: "10px" } }, add, h("span", { class: "faint small" }, "History is append only.")),
        slot,
      );
      return h(
        "div",
        { class: "panel" },
        h("h2", { class: "rail-title" }, "History"),
        history.length
          ? h(
            "ol",
            { class: "timeline", reversed: true },
            history.map((e) =>
              h(
                "li",
                { class: `t-${e.type}` },
                h("span"),
                h("div", null, h("div", { class: "what" }, h("span", { class: "type" }, e.type), e.text), h("div", { class: "when" }, `${formatDateTime(e.at)}, ${e.by}`)),
              ),
            ),
          )
          : h("p", { class: "muted small" }, "Nothing yet. Status changes and demo builds are logged here automatically."),
        form,
      );
    },

    preview() {
      if (!lead.demoExists) {
        frame = null;
        return h(
          "div",
          { class: "empty" },
          h("h3", null, "No demo yet"),
          h("p", null, `Build it with Build demo, or run npm run demos -- --id ${id}. Demos are private files in demos/${id}/ and never published.`),
        );
      }
      const sw = deviceSwitch(device, (key) => {
        device = key;
        sw.set(key);
        frame.setDevice(key);
      });
      frame = deviceFrame({
        src: `/demos/${encodeURIComponent(id)}/`,
        device,
        title: `Private demo for ${lead.business}`,
        maxHeight: () => Math.min(720, window.innerHeight * 0.8),
      });
      return h(
        "div",
        null,
        h("div", { class: "device-bar" }, sw.el, h("span", { class: "faint small" }, lead.demo?.template ? `${lead.demo.template} template, ${lead.demo.palette} palette, built ${formatDay(lead.demo.builtAt)}` : "")),
        frame.el,
      );
    },
  };

  for (const name of Object.keys(mounts)) fill(mounts[name], builders[name]());

  const facts = h(
    "dl",
    { class: "facts" },
    fact("Google rating", rating(lead.googleRating), { big: true, note: ratingNote(lead) }),
    fact("Google reviews", number(lead.googleReviews), { big: true }),
    fact("Website gap", scale(lead.websiteGap, GAP_WORDS)),
    fact("Ticket value", scale(lead.ticketValue, TICKET_WORDS)),
    fact("Visual fit", scale(lead.visualFit, VISUAL_WORDS)),
    fact("Metro", lead.metro ? metroName(lead.metro) : "Outside every metro"),
    fact("Address", lead.address),
    fact("Hours", lead.hours),
    fact("Established", lead.established ? String(lead.established) : ""),
    fact("Languages", lead.languages),
    fact("Services", lead.services),
    fact("Review themes", lead.reviewThemes),
    fact("Google Maps", lead.googleMapsUrl ? external(lead.googleMapsUrl, "Listing") : ""),
    fact("Added", `${formatDay(lead.addedAt, { year: true })}, ${ORIGINS[lead.origin] ?? lead.origin}`, { note: lead.runId ? `Run ${lead.runId}` : null }),
  );

  const scoreWarnings = lead.score?.warnings ?? [];
  const main = h(
    "div",
    { class: "lead-main" },
    section(
      "The case",
      h(
        "div",
        { class: "quote-block" },
        h("div", null, h("h3", null, "Website status"), h("p", null, lead.websiteStatus)),
        h("div", null, h("h3", null, "Why Kija"), h("p", null, lead.whyKija)),
        h("div", null, h("h3", null, "Pitch angle"), h("p", null, lead.pitchAngle)),
        h("div", null, h("h3", null, "Demo concept"), h("p", null, lead.demoConcept)),
      ),
    ),
    // Team notes about this lead, with the add form prefilled to it.
    notesPanel({ leadId: id }),
    section("Facts", facts),
    section(
      "Score",
      h("div", { class: "stack" }, scoreParts(lead.score), scoreWarnings.length ? h("div", { class: "notice" }, h("strong", null, "Below the preferred standards"), h("ul", null, scoreWarnings.map((w) => h("li", null, w)))) : null),
      { aside: h("span", { class: "faint small" }, "Computed from the record, never stored") },
    ),
    mounts.research,
    section("Return on investment", roiCalculator(lead), { aside: h("span", { class: "faint small" }, "Recalculates as you type") }),
    section("Demo preview", mounts.preview),
    section("Outreach drafts", mounts.drafts),
  );

  const el = h(
    "div",
    null,
    h(
      "nav",
      { class: "crumbs", "aria-label": "Breadcrumb" },
      h("a", { href: "#/pipeline" }, "Pipeline"),
      h("span", { "aria-hidden": "true" }, "/"),
      h("span", { "aria-current": "page" }, lead.business),
      h("span", { class: "spacer" }),
      prevId ? h("a", { href: `#/lead/${encodeURIComponent(prevId)}`, title: "Previous lead (k)" }, "Previous") : null,
      nextLeadId ? h("a", { href: `#/lead/${encodeURIComponent(nextLeadId)}`, title: "Next lead (j)" }, "Next") : null,
      h("span", { class: "shortcut-hint" }, h("kbd", null, "j"), " ", h("kbd", null, "k"), " move, ", h("kbd", null, "p"), " present"),
    ),
    mounts.head,
    h("div", { class: "lead-layout" }, main, h("aside", { class: "lead-rail", "aria-label": "Outreach and actions" }, mounts.readiness, mounts.outreach, mounts.actions, mounts.history)),
  );

  return {
    el,
    title: lead.business,
    onKey(e) {
      if (e.key === "j" && nextLeadId) {
        navigate(`#/lead/${encodeURIComponent(nextLeadId)}`);
        return true;
      }
      if (e.key === "k" && prevId) {
        navigate(`#/lead/${encodeURIComponent(prevId)}`);
        return true;
      }
      if (e.key === "p") {
        navigate(`#/present/${encodeURIComponent(id)}`);
        return true;
      }
      return false;
    },
    destroy() {
      clearInterval(clockTimer);
      frame?.destroy();
    },
  };
}
