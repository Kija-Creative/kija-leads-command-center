// #/settings: offer, contact, weekly research and geography. Each section saves on its
// own as a partial update the server merges and validates. Secrets never reach this page;
// only whether the Places key is present.

import { feedbackSlot, showFeedback, toast, withBusy } from "../components/feedback.js";
import { api } from "../lib/api.js";
import { h, nextId } from "../lib/dom.js";
import { formatDay } from "../lib/format.js";
import { loadState, setSettings, store } from "../lib/state.js";

function field(label, input, { hint = "", span = false } = {}) {
  const id = input.id || nextId("st");
  input.id = id;
  return h("div", { class: `field${span ? " span-all" : ""}` }, h("label", { for: id }, label, hint ? h("span", { class: "hint" }, ` ${hint}`) : null), input);
}

function num(value, attrs = {}) {
  return h("input", { type: "number", inputmode: "decimal", value: value ?? "", ...attrs });
}

function text(value, attrs = {}) {
  return h("input", { type: "text", value: value ?? "", autocomplete: "off", ...attrs });
}

function toNumber(input) {
  const v = input.value.trim();
  return v === "" ? null : Number(v);
}

function sectionForm({ title, desc, fields, read, success = "Settings saved.", id, extra = null, onSaved = null }) {
  const slot = feedbackSlot();
  const save = h("button", { type: "submit", class: "btn btn-primary" }, "Save");
  return h(
    "form",
    {
      class: "panel",
      id,
      "aria-labelledby": id ? `${id}-title` : null,
      onsubmit: async (e) => {
        e.preventDefault();
        const res = await withBusy(save, () => api.putSettings(read()));
        showFeedback(slot, res, { success });
        toast(res, { success });
        if (res.ok) {
          setSettings(res.settings);
          onSaved?.(res.settings);
          // Scores, ROI and drafts depend on settings; pull fresh views from the server.
          await loadState({ quiet: true });
        }
      },
    },
    h("h2", { id: id ? `${id}-title` : null }, title),
    (Array.isArray(desc) ? desc : [desc]).map((d) => h("p", { class: "desc" }, d)),
    extra,
    h("div", { class: "form-grid" }, fields),
    h("div", { class: "form-actions" }, save),
    slot,
  );
}

const TEXAS_OPTIONS = [
  ["unknown", "Unknown, not confirmed"],
  ["registered", "Registered with the Texas Secretary of State"],
  ["exempt-confirmed", "Exempt, confirmed by an attorney"],
];
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const COMPLIANCE_DEFAULTS = {
  texasRegistration: "unknown",
  callWindow: { startHour: 9, endHour: 20, days: [1, 2, 3, 4, 5, 6] },
  maxCallsPerDay: 1,
  maxCallsTotal: 3,
  noColdTexts: true,
  noTextStates: ["WA"],
};

function hourLabel(hour) {
  if (hour === 0) return "Midnight";
  if (hour === 24) return "Midnight, end of day";
  if (hour === 12) return "Noon";
  return `${hour % 12} ${hour < 12 ? "a.m." : "p.m."}`;
}

function hourSelect(value) {
  return h("select", null, Array.from({ length: 25 }, (_, n) => h("option", { value: String(n), selected: n === value }, hourLabel(n))));
}

export function render({ query } = {}) {
  const data = store.data;
  const s = data.settings ?? {};
  const offer = s.offer ?? {};
  const care = offer.optionalCare ?? {};
  const contact = s.contact ?? {};
  const t = s.thresholds ?? {};
  const g = s.geography ?? {};

  // Offer
  const oName = text(offer.name);
  const oPrice = num(offer.price, { min: "1", step: "50" });
  const oConfirmed = h("input", { type: "checkbox", checked: Boolean(offer.priceConfirmed), id: nextId("st") });
  const oDays = num(offer.timelineDays, { min: "1", step: "1" });
  const oIncludes = h("textarea", { rows: "5" });
  oIncludes.value = (offer.includes ?? []).join("\n");
  const oOwn = text(offer.ownershipLine);
  const cName = text(care.name);
  const cMonthly = num(care.monthly, { min: "0", step: "5" });
  const cDesc = text(care.description);

  const offerForm = sectionForm({
    title: "Offer",
    desc: "What the pitch pages sell. The price shows on pitches only once it is confirmed; until then they say pricing is to confirm, and the ROI math marks it as a placeholder.",
    fields: [
      field("Offer name", oName),
      field("Price", oPrice, { hint: "dollars" }),
      h("div", { class: "field", style: { alignSelf: "end" } }, h("label", { class: "check", for: oConfirmed.id }, oConfirmed, "Price confirmed")),
      field("Timeline", oDays, { hint: "days" }),
      field("What is included", oIncludes, { hint: "one per line", span: true }),
      field("Ownership line", oOwn, { span: true }),
      field("Care plan name", cName),
      field("Care plan monthly", cMonthly, { hint: "0 hides it" }),
      field("Care plan description", cDesc, { span: true }),
    ],
    read: () => ({
      offer: {
        name: oName.value.trim(),
        price: toNumber(oPrice),
        priceConfirmed: oConfirmed.checked,
        timelineDays: toNumber(oDays),
        includes: oIncludes.value.split("\n").map((x) => x.trim()).filter(Boolean),
        ownershipLine: oOwn.value.trim(),
        optionalCare: { name: cName.value.trim(), monthly: toNumber(cMonthly) ?? 0, description: cDesc.value.trim() },
      },
    }),
    success: "Offer saved.",
  });

  // Contact
  const kName = text(contact.name);
  const kTitle = text(contact.title);
  const kEmail = h("input", { type: "email", value: contact.email ?? "", autocomplete: "off" });
  const kPhone = h("input", { type: "tel", value: contact.phone ?? "", autocomplete: "off" });
  const kSite = h("input", { type: "url", value: contact.site ?? "", autocomplete: "off" });
  const kAddress = text(contact.address, { id: "st-address", placeholder: "Street or PO box, city, state, ZIP" });
  const contactForm = sectionForm({
    title: "Contact",
    desc: [
      "Who the pitch pages and drafts point to. Drafts leave a placeholder for anything empty here, so nothing goes out with a made up number or address.",
      "CAN-SPAM requires a valid physical postal address in every commercial email: a street address, a USPS PO box or a registered private mailbox. Until one is here, the email copy buttons stay off.",
    ],
    id: "st-contact",
    fields: [
      field("Name", kName),
      field("Title", kTitle),
      field("Email", kEmail),
      field("Phone", kPhone),
      field("Website", kSite),
      field("Mailing address", kAddress, { span: true, hint: contact.address ? "in every email footer" : "required before any email draft is ready to send" }),
    ],
    read: () => ({
      contact: { name: kName.value.trim(), title: kTitle.value.trim(), email: kEmail.value.trim(), phone: kPhone.value.trim(), site: kSite.value.trim(), address: kAddress.value.trim() },
    }),
    success: "Contact saved.",
  });

  // Weekly research and thresholds
  const wQuota = num(s.weeklyQuota, { min: "1", step: "1" });
  const wCats = num(s.categoriesPerWeek, { min: "1", step: "1" });
  const tMinR = num(t.minRating, { min: "0", max: "5", step: "0.1" });
  const tPrefR = num(t.preferredRating, { min: "0", max: "5", step: "0.1" });
  const tMinRev = num(t.minReviews, { min: "0", step: "1" });
  const tPrefRev = num(t.preferredReviews, { min: "0", step: "1" });
  const tStrong = num(t.strongReviews, { min: "0", step: "1" });
  const tGap = h("select", null, [1, 2, 3].map((n) => h("option", { value: String(n), selected: n === t.minWebsiteGap }, String(n))));
  const researchForm = sectionForm({
    title: "Weekly research",
    desc: "How many leads a Monday run aims for, and the floors a lead must clear. Below a floor, a candidate goes to the research queue instead of the pipeline.",
    fields: [
      field("Weekly quota", wQuota, { hint: "leads" }),
      field("Categories per week", wCats),
      field("Minimum rating", tMinR),
      field("Preferred rating", tPrefR),
      field("Minimum reviews", tMinRev),
      field("Preferred reviews", tPrefRev),
      field("Strong reviews", tStrong),
      field("Minimum website gap", tGap, { hint: "1 to 3" }),
    ],
    read: () => ({
      weeklyQuota: toNumber(wQuota),
      categoriesPerWeek: toNumber(wCats),
      thresholds: {
        minRating: toNumber(tMinR),
        preferredRating: toNumber(tPrefR),
        minReviews: toNumber(tMinRev),
        preferredReviews: toNumber(tPrefRev),
        strongReviews: toNumber(tStrong),
        minWebsiteGap: Number(tGap.value),
      },
    }),
    success: "Research settings saved.",
  });

  // Geography
  const metros = data.geography?.metros ?? [];
  const gMode = h(
    "select",
    null,
    [["nationwide-rotation", "Nationwide rotation"], ["home-only", "Home metro only"]].map(([v, l]) => h("option", { value: v, selected: v === g.mode }, l)),
  );
  const gPer = num(g.metrosPerWeek, { min: "1", step: "1" });
  const gHome = h("select", null, metros.map((m) => h("option", { value: m.key, selected: m.key === g.homeMetro }, m.name)));
  const gEvery = h("input", { type: "checkbox", checked: Boolean(g.homeEveryWeek), id: nextId("st") });
  const gMax = num(g.homeMaxLeads, { min: "0", step: "1" });
  const gStart = h("input", { type: "date", value: g.rotationStart ?? "" });
  const geoForm = sectionForm({
    title: "Geography",
    desc: `The rotation walks ${metros.length} metros in an order that alternates regions, a few each week. The home metro can join every week with a cap so most effort goes nationwide.`,
    fields: [
      field("Mode", gMode),
      field("Metros per week", gPer),
      field("Home metro", gHome),
      h("div", { class: "field", style: { alignSelf: "end" } }, h("label", { class: "check", for: gEvery.id }, gEvery, "Home metro every week")),
      field("Home metro cap", gMax, { hint: "leads a week" }),
      field("Rotation start", gStart, { hint: "a Monday" }),
    ],
    read: () => ({
      geography: {
        mode: gMode.value,
        metrosPerWeek: toNumber(gPer),
        homeMetro: gHome.value,
        homeEveryWeek: gEvery.checked,
        homeMaxLeads: toNumber(gMax),
        rotationStart: gStart.value,
      },
    }),
    success: "Geography saved.",
  });

  // Compliance
  const comp = { ...COMPLIANCE_DEFAULTS, ...(s.compliance ?? {}), callWindow: { ...COMPLIANCE_DEFAULTS.callWindow, ...(s.compliance?.callWindow ?? {}) } };
  const cTexas = h("select", { id: "st-texas" }, TEXAS_OPTIONS.map(([v, l]) => h("option", { value: v, selected: v === comp.texasRegistration }, l)));
  const cStart = hourSelect(comp.callWindow.startHour);
  const cEnd = hourSelect(comp.callWindow.endHour);
  const cDays = WEEKDAY_NAMES.map((name, n) => h("input", { type: "checkbox", id: nextId("st"), checked: comp.callWindow.days.includes(n), value: String(n) }));
  const cPerDay = num(comp.maxCallsPerDay, { min: "0", step: "1" });
  const cTotal = num(comp.maxCallsTotal, { min: "0", step: "1" });
  const cNoCold = h("input", { type: "checkbox", id: nextId("st"), checked: comp.noColdTexts !== false });
  const cStates = text((comp.noTextStates ?? []).join(", "), { placeholder: "WA" });
  const texasChip = (value) => (value === "unknown" || !value
    ? h("span", { class: "chip chip-warn" }, "Unconfirmed")
    : h("span", { class: "chip chip-good" }, value === "registered" ? "Registered" : "Exempt, confirmed"));
  let texasStatus = texasChip(comp.texasRegistration);
  const complianceForm = sectionForm({
    title: "Outreach compliance",
    id: "st-compliance",
    desc: "The rules the lead page checks before a call, an email or a text. The defaults are the strictest of the federal and state rules in the research: calls 9 a.m. to 8 p.m. in the business's local time, Monday to Saturday, one a day and three in total without a reply, and no cold texts.",
    extra: h(
      "div",
      { class: "legal-note" },
      h("div", { class: "row" }, h("strong", null, "Texas chapter 302"), texasStatus),
      h(
        "p",
        null,
        "Texas probably requires a seller that makes sales calls from a Texas location to register with the Secretary of State, whatever state the prospect is in: $200 to file, a $10,000 security, renewed each year. Kija calls from Dallas, so it likely applies. The plausible exemption covers calls that only book a face to face presentation and never close a sale on the call. Whether a video or screen share walkthrough counts as face to face is an open question for an attorney.",
      ),
      h("p", null, "Leave this at Unknown until an attorney confirms registration or the exemption. While it is Unknown, every call check and call script carries a reminder, and a call only books the walkthrough."),
      h("p", { class: "legal-flag" }, "Not legal advice. Summarized from research/compliance.md."),
    ),
    fields: [
      field("Texas registration", cTexas, { span: true }),
      field("Calls from", cStart, { hint: "their local time" }),
      field("Calls until", cEnd),
      field("Calls a day", cPerDay, { hint: "per business" }),
      field("Calls in total", cTotal, { hint: "without a reply" }),
      h(
        "fieldset",
        { class: "field span-all day-set" },
        h("legend", null, "Call days"),
        h("div", { class: "row" }, cDays.map((box, n) => h("label", { class: "check", for: box.id }, box, WEEKDAY_NAMES[n].slice(0, 3)))),
      ),
      h("div", { class: "field", style: { alignSelf: "end" } }, h("label", { class: "check", for: cNoCold.id }, cNoCold, "No cold texts")),
      field("Never text without consent in", cStates, { hint: "state codes, comma separated" }),
    ],
    read: () => ({
      compliance: {
        texasRegistration: cTexas.value,
        callWindow: {
          startHour: Number(cStart.value),
          endHour: Number(cEnd.value),
          days: cDays.filter((b) => b.checked).map((b) => Number(b.value)),
        },
        maxCallsPerDay: toNumber(cPerDay),
        maxCallsTotal: toNumber(cTotal),
        noColdTexts: cNoCold.checked,
        noTextStates: cStates.value.split(/[\s,]+/).map((x) => x.trim().toUpperCase()).filter(Boolean),
      },
    }),
    success: "Compliance settings saved.",
    onSaved: (next) => {
      const chip = texasChip(next?.compliance?.texasRegistration);
      texasStatus.replaceWith(chip);
      texasStatus = chip;
    },
  });

  // About and the Google Maps notice (research/RESEARCH.md decisions 2 to 4).
  const about = h(
    "section",
    { class: "panel panel-pad", "aria-labelledby": "st-about" },
    h("h2", { id: "st-about" }, "About"),
    h("p", { class: "desc" }, "The Kija Lead Command Center runs only on this machine. Nothing in it contacts a business or publishes anything; drafts are copied and sent by a person."),
    h("h3", { class: "about-head" }, "Google Maps data"),
    h(
      "ul",
      { class: "about-list" },
      h("li", null, "Discovery may use the Google Places API to find candidates."),
      h("li", null, "Only place IDs are stored from it, and they are rechecked after 12 months. No other Places data is written to disk or used in demos or pitch pages; every stored fact about a business comes from an independent source listed on the lead."),
      h("li", null, "Ratings and review counts are recorded from the public Google Maps listing, on the date shown with each lead."),
      h("li", null, "Google Maps is a trademark of Google LLC. Kija Creative is not affiliated with or endorsed by Google."),
    ),
  );

  // Data sources, read only
  const b = data.benchmarks ?? {};
  const cats = Object.values(b.categories ?? {});
  const sourced = cats.filter((c) => Array.isArray(c?.ticket?.sources) && c.ticket.sources.length).length;
  const stats = (b.consumerStats ?? []).filter((x) => x.verified && x.useInPitch).length;
  const m = data.modules ?? {};
  const ok = (yes, good, bad) => h("span", { class: `chip ${yes ? "chip-good" : "chip-warn"}` }, yes ? good : bad);
  const status = h(
    "section",
    { class: "panel panel-pad", "aria-labelledby": "st-sources" },
    h("h2", { id: "st-sources" }, "Data sources"),
    h("p", { class: "desc" }, "Read only. Keys stay in .env on this machine; the app only learns whether one is present."),
    h(
      "ul",
      { class: "status-list" },
      h("li", null, ok(data.env?.placesKey, "Present", "Not set"), "Google Places API key", h("span", { class: "faint small" }, data.env?.placesKey ? "npm run discover can use Places." : "Optional. Discovery falls back to web research.")),
      h("li", null, ok(sourced > 0, `${sourced} of ${cats.length} sourced`, "Placeholder, not researched"), "ROI benchmarks", h("span", { class: "faint small" }, b.updatedAt ? `Updated ${formatDay(b.updatedAt, { year: true })}` : "")),
      h("li", null, ok(stats > 0, `${stats} verified`, "None verified"), "Consumer statistics for pitches"),
      h("li", null, ok(m.demo !== false, "Installed", "Missing"), "Demo generator"),
      h("li", null, ok(m.pitch !== false, "Installed", "Missing"), "Pitch pages"),
      h("li", null, ok(m.drafts !== false, "Installed", "Missing"), "Outreach drafts"),
    ),
  );

  const el = h(
    "div",
    null,
    h("header", { class: "page-head" }, h("div", null, h("h1", { class: "page-title", tabindex: "-1" }, "Settings"), h("p", { class: "page-sub" }, "Saved to config/settings.json. The weekly run reads these each Monday."))),
    h("div", { class: "settings" }, offerForm, contactForm, complianceForm, researchForm, geoForm, status, about),
  );
  // Deep links from the lead page: #/settings?focus=address or ?focus=compliance. Runs after the
  // router's own heading focus.
  const focus = query?.get?.("focus");
  if (focus === "address" || focus === "compliance") {
    setTimeout(() => {
      const target = focus === "address" ? kAddress : cTexas;
      target.scrollIntoView({ block: "center" });
      target.focus({ preventScroll: true });
    }, 0);
  }
  return { el, title: "Settings" };
}
