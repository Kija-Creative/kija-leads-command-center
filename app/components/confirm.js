// A modal confirm that needs a written reason. Resolves to the trimmed reason, or null when
// the person cancels. Built on <dialog>, so focus is trapped and Esc cancels natively.

import { h, nextId } from "../lib/dom.js";

export function confirmWithReason({ title, body = [], label = "Reason", placeholder = "", confirmLabel = "Confirm", danger = false }) {
  return new Promise((resolve) => {
    const titleId = nextId("dlg");
    const fieldId = nextId("dlg");
    const errId = nextId("dlg");
    const reason = h("textarea", { id: fieldId, rows: "3", placeholder, "aria-required": "true", "aria-describedby": errId, maxlength: "500" });
    const err = h("p", { class: "dialog-error", id: errId, role: "alert" });
    const cancel = h("button", { type: "button", class: "btn btn-quiet" }, "Cancel");
    const ok = h("button", { type: "submit", class: `btn ${danger ? "btn-danger-solid" : "btn-primary"}` }, confirmLabel);
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
          const text = reason.value.trim();
          if (!text) {
            err.textContent = "Write the reason first. It is kept with the entry.";
            reason.setAttribute("aria-invalid", "true");
            reason.focus();
            return;
          }
          finish(text);
        },
      },
      h("h2", { id: titleId }, title),
      (Array.isArray(body) ? body : [body]).map((p) => h("p", { class: "dialog-body" }, p)),
      h("div", { class: "field" }, h("label", { for: fieldId }, label), reason),
      err,
      h("div", { class: "form-actions" }, ok, cancel),
    );
    const dialog = h("dialog", { class: "confirm", "aria-labelledby": titleId }, form);
    cancel.addEventListener("click", () => finish(null));
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      finish(null);
    });
    reason.addEventListener("input", () => {
      err.textContent = "";
      reason.removeAttribute("aria-invalid");
    });
    document.body.append(dialog);
    dialog.showModal();
    reason.focus();
  });
}
