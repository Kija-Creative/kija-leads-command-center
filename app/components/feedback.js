// Every mutation shows what the server said: errors, warnings, or a short confirmation.
// Inline next to the control that caused it, and as a toast so it is never missed.

import { h, fill } from "../lib/dom.js";

const TOAST_MS = 5200;

function list(items) {
  return items.length ? h("ul", null, items.map((t) => h("li", null, t))) : null;
}

export function toast(result, { success = "Saved." } = {}) {
  const host = document.getElementById("toasts");
  if (!host) return;
  const errors = result?.errors ?? [];
  const warnings = result?.warnings ?? [];
  const bad = result && result.ok === false;
  const kind = bad ? "is-error" : warnings.length ? "is-warning" : "";
  const title = bad
    ? errors.length > 1 ? `Not saved. ${errors.length} problems:` : "Not saved."
    : warnings.length ? `${success} ${warnings.length === 1 ? "One warning:" : `${warnings.length} warnings:`}` : success;
  const close = h("button", { type: "button", "aria-label": "Dismiss" }, "×");
  const el = h("div", { class: `toast ${kind}` }, h("div", null, h("strong", null, title), list(bad ? errors : warnings)), close);
  close.addEventListener("click", () => el.remove());
  host.append(el);
  // Errors stay until dismissed; they usually need reading.
  if (!bad) setTimeout(() => el.remove(), TOAST_MS + warnings.length * 2500);
  while (host.children.length > 4) host.firstElementChild.remove();
}

export function showFeedback(slot, result, { success = "Saved." } = {}) {
  if (!slot) return;
  const errors = result?.errors ?? [];
  const warnings = result?.warnings ?? [];
  const parts = [];
  if (result?.ok === false) parts.push(h("div", { class: "is-error" }, errors.length === 1 ? errors[0] : list(errors)));
  else parts.push(h("div", { class: "is-ok" }, success));
  if (warnings.length) parts.push(h("div", { class: "is-warning" }, warnings.length === 1 ? warnings[0] : list(warnings)));
  fill(slot, ...parts);
}

export function feedbackSlot() {
  return h("div", { class: "feedback", role: "status", "aria-live": "polite" });
}

// Runs an async mutation with a busy button, then reports. Returns the result.
export async function withBusy(button, fn) {
  if (button) {
    button.classList.add("is-busy");
    button.setAttribute("aria-busy", "true");
    button.disabled = true;
  }
  try {
    return await fn();
  } finally {
    if (button) {
      button.classList.remove("is-busy");
      button.removeAttribute("aria-busy");
      button.disabled = false;
    }
  }
}
