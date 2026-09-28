// One lead in a list: score and breakdown, identity, proof, website status, research
// quality chips, demo and pitch state, and the next action.

import { h } from "../lib/dom.js";
import { formatDay, number, place, rating } from "../lib/format.js";
import { categoryLabel } from "../lib/state.js";
import { confidenceChip, demoChip, pitchChip, statusChip, verificationChip } from "./chips.js";
import { scoreBlock, scoreParts } from "./score.js";

export function ratingText(lead) {
  return h(
    "span",
    { class: "rating" },
    h("span", { class: "star", "aria-hidden": "true" }, "★ "),
    h("b", null, rating(lead.googleRating)),
    ` from ${number(lead.googleReviews)} Google ${lead.googleReviews === 1 ? "review" : "reviews"}`,
  );
}

export function leadCard(lead) {
  const href = `#/lead/${encodeURIComponent(lead.id)}`;
  const link = h("a", { href }, lead.business);
  const next = lead.outreach?.nextAction;
  const nextDate = lead.outreach?.nextDate;
  const el = h(
    "li",
    { class: "lead-item", dataset: { id: lead.id } },
    scoreBlock(lead.score),
    h(
      "div",
      null,
      h("h3", null, link),
      h(
        "p",
        { class: "lead-meta" },
        lead.category || categoryLabel(lead.categoryKey),
        h("span", { class: "sep", "aria-hidden": "true" }, "/"),
        place(lead),
        h("span", { class: "sep", "aria-hidden": "true" }, "/"),
        ratingText(lead),
      ),
      h("p", { class: "lead-status" }, lead.websiteStatus),
      h("div", { class: "chips" }, confidenceChip(lead.confidence), verificationChip(lead.verification), demoChip(lead), pitchChip(lead)),
      h("details", { class: "breakdown" }, h("summary", null, "Score breakdown"), scoreParts(lead.score)),
    ),
    h(
      "div",
      { class: "lead-side" },
      statusChip(lead.outreach?.status),
      next ? h("div", null, h("div", { class: "next-label" }, nextDate ? `Next, ${formatDay(nextDate)}` : "Next action"), h("div", { class: "next" }, next)) : h("div", { class: "faint" }, "No next action set"),
      h(
        "div",
        { class: "row" },
        h("a", { class: "btn btn-small", href }, "Open"),
        h("a", { class: "btn btn-small btn-quiet", href: `#/present/${encodeURIComponent(lead.id)}`, title: "Present (p)" }, "Present"),
      ),
    ),
  );
  return { el, link, id: lead.id };
}
