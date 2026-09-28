// j and k selection over a list of leads, shared by the week list and the pipeline table.
// Enter or o opens the selected lead, p presents it.

import { store } from "../lib/state.js";

// items: [{ id, el, link }] in display order.
export function listNav(items, { navigate }) {
  let index = items.findIndex((it) => it.id === store.selectedId);
  store.order = items.map((it) => it.id);

  function paint({ focus = true } = {}) {
    items.forEach((it, i) => {
      it.el.classList.toggle("is-selected", i === index);
      if (it.el.tagName === "TR") it.el.setAttribute("aria-selected", String(i === index));
    });
    const it = items[index];
    if (!it) return;
    store.selectedId = it.id;
    it.el.scrollIntoView({ block: "nearest" });
    if (focus) it.link?.focus({ preventScroll: true });
  }

  // Selection follows focus too, so Tab and j/k agree.
  items.forEach((it, i) => {
    it.link?.addEventListener("focus", () => {
      index = i;
      paint({ focus: false });
    });
  });

  if (index >= 0) requestAnimationFrame(() => paint({ focus: false }));

  return function onKey(e) {
    if (!items.length) return false;
    if (e.key === "j") {
      index = Math.min(items.length - 1, index + 1);
      paint();
      return true;
    }
    if (e.key === "k") {
      index = Math.max(0, index < 0 ? 0 : index - 1);
      paint();
      return true;
    }
    const it = items[index];
    if (!it) return false;
    // Enter on a focused link or button already does its own thing.
    const onControl = ["A", "BUTTON", "SUMMARY"].includes(e.target?.tagName);
    if (e.key === "o" || (e.key === "Enter" && !onControl)) {
      navigate(`#/lead/${encodeURIComponent(it.id)}`);
      return true;
    }
    if (e.key === "p") {
      navigate(`#/present/${encodeURIComponent(it.id)}`);
      return true;
    }
    return false;
  };
}
