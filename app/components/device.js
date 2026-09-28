// A device frame holding a same origin page at a real viewport width (desktop 1280,
// tablet 820, phone 390), scaled down to fit its container so the page lays out exactly as
// it would on that device.

import { h } from "../lib/dom.js";

export const DEVICES = {
  desktop: { key: "desktop", label: "Desktop", width: 1280, height: 800, pad: 0, top: 28, shortcut: "1" },
  tablet: { key: "tablet", label: "Tablet", width: 820, height: 1180, pad: 18, top: 0, shortcut: "2" },
  phone: { key: "phone", label: "Phone", width: 390, height: 844, pad: 12, top: 0, shortcut: "3" },
};

export function deviceSwitch(current, onPick) {
  const buttons = Object.values(DEVICES).map((d) =>
    h(
      "button",
      {
        type: "button",
        "aria-pressed": String(d.key === current),
        title: `${d.label}, ${d.width} wide (${d.shortcut})`,
        onclick: () => onPick(d.key),
      },
      `${d.label} ${d.width}`,
    ),
  );
  const el = h("div", { class: "segmented", role: "group", "aria-label": "Device size" }, buttons);
  return {
    el,
    set(key) {
      Object.values(DEVICES).forEach((d, i) => buttons[i].setAttribute("aria-pressed", String(d.key === key)));
    },
  };
}

// options: { src, device, title, maxHeight: () => number, onKey }
export function deviceFrame({ src, device = "desktop", title = "Page preview", maxHeight, onKey, stageClass = "device-stage" }) {
  let current = DEVICES[device] ? device : "desktop";
  const iframe = h("iframe", { title, src, loading: "lazy", referrerpolicy: "no-referrer" });
  const top = h("div", { class: "device-top", "aria-hidden": "true" }, h("i"), h("i"), h("i"), h("span", null, "Private concept preview"));
  const shell = h("div", { class: "device" }, top, iframe);
  const holder = h("div", { style: { position: "relative", flex: "none" } }, shell);
  const size = h("span", { class: "device-size", "aria-hidden": "true" });
  const stage = h("div", { class: stageClass }, holder, size);

  function layout() {
    const d = DEVICES[current];
    shell.className = `device device-${d.key}`;
    top.style.display = d.top ? "flex" : "none";
    iframe.style.width = `${d.width}px`;
    iframe.style.height = `${d.height}px`;
    const outerW = d.width + d.pad * 2;
    const outerH = d.height + d.pad * 2 + d.top;
    const stageStyle = getComputedStyle(stage);
    const availW = stage.clientWidth - parseFloat(stageStyle.paddingLeft) - parseFloat(stageStyle.paddingRight);
    const availH = typeof maxHeight === "function" ? maxHeight() : Infinity;
    const scale = Math.max(0.1, Math.min(1, availW / outerW, availH / outerH));
    shell.style.width = `${outerW}px`;
    shell.style.height = `${outerH}px`;
    shell.style.transform = `scale(${scale})`;
    holder.style.width = `${Math.floor(outerW * scale)}px`;
    holder.style.height = `${Math.floor(outerH * scale)}px`;
    size.textContent = `${d.label} ${d.width} wide, shown at ${Math.round(scale * 100)}%`;
  }

  // Same origin, so shortcuts keep working after a click inside the page.
  iframe.addEventListener("load", () => {
    if (!onKey) return;
    try {
      iframe.contentWindow.addEventListener("keydown", onKey);
    } catch {
      // not same origin; the shortcuts work once focus returns to the app
    }
  });

  const ro = new ResizeObserver(() => layout());
  ro.observe(stage);
  requestAnimationFrame(layout);

  return {
    el: stage,
    iframe,
    setDevice(key) {
      if (!DEVICES[key]) return;
      current = key;
      layout();
    },
    setSrc(next, nextTitle) {
      if (nextTitle) iframe.title = nextTitle;
      if (iframe.getAttribute("src") !== next) iframe.setAttribute("src", next);
    },
    reload() {
      try {
        iframe.contentWindow.location.reload();
      } catch {
        iframe.setAttribute("src", iframe.getAttribute("src"));
      }
    },
    layout,
    destroy() {
      ro.disconnect();
    },
  };
}
