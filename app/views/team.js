// Admin panel on Settings: who can sign in, their role, and password resets. Admins only;
// the server enforces this too.

import { feedbackSlot, showFeedback, toast, withBusy } from "../components/feedback.js";
import { api } from "../lib/api.js";
import { h } from "../lib/dom.js";

export function teamPanel(me) {
  const list = h("div", { class: "team-list" });
  const slot = feedbackSlot();

  async function patch(key, body, success) {
    const res = await api.patchUser(key, body);
    showFeedback(slot, res, { success });
    toast(res, { success });
    if (res.ok) draw(res.users);
  }

  function draw(users) {
    list.replaceChildren(
      ...users.map((u) => {
        const self = u.key === me.key;
        const role = h(
          "select",
          { "aria-label": `Role for ${u.name}`, disabled: self, onchange: () => patch(u.key, { role: role.value }, `${u.name} is now ${role.value}.`) },
          ["admin", "employee"].map((r) => h("option", { value: r, selected: r === u.role }, r === "admin" ? "Admin" : "Employee")),
        );
        return h(
          "div",
          { class: "row team-row" },
          h("strong", null, u.name),
          h("span", { class: "faint small" }, u.key),
          role,
          u.mustChange ? h("span", { class: "chip chip-warn" }, "Temporary password") : null,
          u.active ? null : h("span", { class: "chip chip-warn" }, "Disabled"),
          h(
            "button",
            {
              type: "button",
              class: "btn btn-quiet",
              onclick: async () => {
                const pw = window.prompt(`Temporary password for ${u.name} (10 or more characters). They must change it at sign in.`);
                if (pw) await patch(u.key, { password: pw }, `Password reset for ${u.name}.`);
              },
            },
            "Reset password",
          ),
          self ? null : h("button", { type: "button", class: "btn btn-quiet", onclick: () => patch(u.key, { active: !u.active }, `${u.name} ${u.active ? "disabled" : "enabled"}.`) }, u.active ? "Disable" : "Enable"),
        );
      }),
    );
  }

  const key = h("input", { id: "tm-key", type: "text", autocomplete: "off", placeholder: "Login name, e.g. Sam" });
  const name = h("input", { id: "tm-name", type: "text", autocomplete: "off", placeholder: "Full name" });
  const role = h("select", { id: "tm-role" }, h("option", { value: "employee" }, "Employee"), h("option", { value: "admin" }, "Admin"));
  const pw = h("input", { id: "tm-pw", type: "text", autocomplete: "off", placeholder: "Temporary password" });
  const add = h("button", { type: "submit", class: "btn btn-primary" }, "Add login");

  api.users().then((res) => {
    if (res.ok) draw(res.users);
    else showFeedback(slot, res, {});
  });

  return h(
    "section",
    { class: "panel panel-pad", "aria-labelledby": "st-team" },
    h("h2", { id: "st-team" }, "Team logins"),
    h("p", { class: "desc" }, "Admins can change settings and manage logins. Employees work leads, notes and the queue. Everyone picks their own password at first sign in."),
    list,
    h(
      "form",
      {
        class: "row team-add",
        onsubmit: async (e) => {
          e.preventDefault();
          const res = await withBusy(add, () => api.addUser({ key: key.value, name: name.value, role: role.value, password: pw.value }));
          showFeedback(slot, res, { success: "Login added." });
          if (res.ok) {
            draw(res.users);
            key.value = name.value = pw.value = "";
          }
        },
      },
      key,
      name,
      role,
      pw,
      add,
    ),
    slot,
  );
}
