// Sign in and first-time password screens. Shown in place of the app until a session exists.

import { feedbackSlot, showFeedback, withBusy } from "../components/feedback.js";
import { api } from "../lib/api.js";
import { fill, h } from "../lib/dom.js";

function shell(title, sub, form) {
  return h("div", { class: "login" }, h("div", { class: "panel panel-pad login-card" }, h("h1", { class: "page-title", tabindex: "-1" }, title), h("p", { class: "desc" }, sub), form));
}

export function showLogin(main, onDone) {
  const slot = feedbackSlot();
  const name = h("input", { id: "lg-name", name: "name", type: "text", autocomplete: "username", autocapitalize: "off", required: true });
  const pass = h("input", { id: "lg-pass", name: "password", type: "password", autocomplete: "current-password", required: true });
  const go = h("button", { type: "submit", class: "btn btn-primary" }, "Sign in");
  const form = h(
    "form",
    {
      onsubmit: async (e) => {
        e.preventDefault();
        const res = await withBusy(go, () => api.login({ name: name.value, password: pass.value }));
        if (!res.ok) {
          pass.value = "";
          showFeedback(slot, res, {});
          return;
        }
        onDone(res.user);
      },
    },
    h("div", { class: "field" }, h("label", { for: "lg-name" }, "Name"), name),
    h("div", { class: "field" }, h("label", { for: "lg-pass" }, "Password"), pass),
    h("div", { class: "form-actions" }, go),
    slot,
  );
  fill(main, shell("Sign in", "Lead Command Center. Use the name and password Jamey gave you.", form));
  name.focus();
}

// A person with a temporary password must choose their own before anything else loads.
export function showChangePassword(main, { forced = false, onDone }) {
  const slot = feedbackSlot();
  const cur = h("input", { id: "pw-cur", type: "password", autocomplete: "current-password", required: true });
  const next = h("input", { id: "pw-new", type: "password", autocomplete: "new-password", minlength: "10", required: true });
  const again = h("input", { id: "pw-again", type: "password", autocomplete: "new-password", minlength: "10", required: true });
  const go = h("button", { type: "submit", class: "btn btn-primary" }, "Save password");
  const form = h(
    "form",
    {
      onsubmit: async (e) => {
        e.preventDefault();
        if (next.value !== again.value) {
          showFeedback(slot, { ok: false, errors: ["The two new passwords do not match."], warnings: [] }, {});
          return;
        }
        const res = await withBusy(go, () => api.changePassword({ current: cur.value, next: next.value }));
        if (!res.ok) {
          showFeedback(slot, res, {});
          return;
        }
        onDone(res.user);
      },
    },
    h("div", { class: "field" }, h("label", { for: "pw-cur" }, forced ? "Temporary password" : "Current password"), cur),
    h("div", { class: "field" }, h("label", { for: "pw-new" }, "New password", h("span", { class: "hint" }, " at least 10 characters")), next),
    h("div", { class: "field" }, h("label", { for: "pw-again" }, "New password again"), again),
    h("div", { class: "form-actions" }, go, forced ? null : h("a", { class: "btn", href: "#/week" }, "Cancel")),
    slot,
  );
  fill(main, shell(forced ? "Choose your password" : "Change password", forced ? "You are using a temporary password. Pick your own to continue." : "Your other sessions will be signed out.", form));
  cur.focus();
}
