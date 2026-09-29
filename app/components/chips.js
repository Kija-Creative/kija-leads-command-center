// Quiet status chips. Color appears only when the chip carries a state worth noticing.

import { h } from "../lib/dom.js";
import { formatDay } from "../lib/format.js";

export function confidenceChip(confidence) {
  const cls = confidence === "High" ? "chip-good" : confidence === "Medium-High" ? "" : confidence ? "chip-warn" : "chip-muted";
  return h("span", { class: `chip ${cls}`, title: "Research confidence" }, `${confidence || "No"} confidence`);
}

const VERIFICATION = {
  verified: ["chip-good", "Verified"],
  "needs-recheck": ["chip-warn", "Needs recheck"],
  unverified: ["chip-muted", "Unverified"],
};

export function verificationChip(verification) {
  const [cls, label] = VERIFICATION[verification?.status] ?? ["chip-muted", "Unverified"];
  const when = verification?.checkedAt ? ` ${formatDay(verification.checkedAt)}` : "";
  return h("span", { class: `chip ${cls}`, title: `Verification${when ? `, checked${when}` : ""}` }, label);
}

export function demoChip(lead) {
  if (!lead.demoExists) return h("span", { class: "chip chip-muted" }, "No demo");
  if (lead.demo?.shareApproved) return h("span", { class: "chip chip-good" }, "Demo approved to share");
  return h("span", { class: "chip" }, "Demo built");
}

export function pitchChip(lead) {
  return lead.pitchExists ? h("span", { class: "chip" }, "Pitch ready") : h("span", { class: "chip chip-muted" }, "No pitch");
}

export function statusChip(status) {
  return h("span", { class: "chip chip-status" }, status || "No status");
}

export const ESTIMATE_TIP = "Not verified. No source is recorded for this default, so treat it as a starting point to adjust with the owner, not a researched figure.";

// A default with no sources. Focusable so the explanation is reachable without a mouse.
export function estimateChip(tip = ESTIMATE_TIP) {
  return h("span", { class: "chip chip-warn has-tip", tabindex: "0", "aria-label": `Estimate. ${tip}`, "data-tip": tip }, "Estimate");
}

export function sourceChip(verified) {
  return verified ? h("span", { class: "chip chip-good" }, "Sourced") : estimateChip();
}
