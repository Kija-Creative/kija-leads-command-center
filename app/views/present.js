// #/present/<id>: full screen presentation for a screen shared call. The demo sits in a
// device frame at real width; t switches to the pitch page. 1 2 3 pick the device, Esc leaves.

import { deviceFrame, deviceSwitch, DEVICES } from "../components/device.js";
import { fill, h, isTyping } from "../lib/dom.js";
import { leadById } from "../lib/state.js";

export function render({ params, query, setQuery, navigate }) {
  const id = params[0];
  const lead = leadById(id);
  const back = `#/lead/${encodeURIComponent(id)}`;
  if (!lead) {
    return {
      title: "Present",
      el: h(
        "div",
        { class: "present" },
        h("div", { class: "present-bar" }, h("h1", null, "Nothing to present"), h("a", { class: "btn", href: "#/pipeline" }, "Back to the pipeline")),
        h("div", { class: "present-stage" }, h("div", { class: "empty present-empty" }, h("p", null, `No lead has the id "${id}".`))),
      ),
    };
  }

  let show = query.get("show") === "pitch" ? "pitch" : "demo";
  let device = DEVICES[query.get("device")] ? query.get("device") : "desktop";
  const stageHost = h("div", { style: { display: "contents" } });
  let frame = null;

  const srcFor = (which) => `/${which === "pitch" ? "pitches" : "demos"}/${encodeURIComponent(id)}/`;
  const existsFor = (which) => (which === "pitch" ? lead.pitchExists : lead.demoExists);

  const modeButtons = ["demo", "pitch"].map((m) =>
    h("button", { type: "button", "aria-pressed": String(show === m), onclick: () => setShow(m) }, m === "demo" ? "Demo" : "Pitch"),
  );
  const modeSwitch = h("div", { class: "segmented", role: "group", "aria-label": "What to show (t)" }, modeButtons);
  const sizes = deviceSwitch(device, (key) => setDevice(key));

  function sync() {
    setQuery({ ...(show === "pitch" ? { show } : {}), ...(device !== "desktop" ? { device } : {}) });
  }

  function onFrameKey(e) {
    if (isTyping(e.target)) return;
    if (handle(e)) e.preventDefault();
  }

  function drawStage() {
    frame?.destroy();
    frame = null;
    if (!existsFor(show)) {
      const what = show === "pitch" ? "pitch page" : "demo";
      const cmd = show === "pitch" ? `npm run pitches -- --id ${id}` : `npm run demos -- --id ${id}`;
      fill(
        stageHost,
        h(
          "div",
          { class: "present-stage" },
          h(
            "div",
            { class: "empty present-empty" },
            h("h2", null, `No ${what} for ${lead.business} yet`),
            h("p", null, "Build it from the lead page, or run ", h("code", null, cmd), ", then come back. Press ", h("kbd", null, "t"), " to switch."),
          ),
        ),
      );
      return;
    }
    let ref = null;
    ref = deviceFrame({
      src: srcFor(show),
      device,
      title: show === "pitch" ? `Pitch page for ${lead.business}` : `Private demo for ${lead.business}`,
      stageClass: "present-stage",
      maxHeight: () => (ref ? ref.el.clientHeight - 40 : window.innerHeight - 120),
      onKey: onFrameKey,
    });
    frame = ref;
    fill(stageHost, frame.el);
  }

  function setShow(m) {
    if (m === show) return;
    show = m;
    modeButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(["demo", "pitch"][i] === show)));
    sync();
    drawStage();
  }

  function setDevice(key) {
    device = key;
    sizes.set(key);
    frame?.setDevice(key);
    sync();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  function handle(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return false;
    if (e.key === "1") setDevice("desktop");
    else if (e.key === "2") setDevice("tablet");
    else if (e.key === "3") setDevice("phone");
    else if (e.key === "t") setShow(show === "demo" ? "pitch" : "demo");
    else if (e.key === "f") toggleFullscreen();
    else if (e.key === "Escape") navigate(back);
    else return false;
    return true;
  }

  const el = h(
    "div",
    { class: "present" },
    h(
      "div",
      { class: "present-bar" },
      h("h1", { tabindex: "-1" }, lead.business),
      h("span", { class: "chip no-dot" }, "Private concept"),
      h("span", { class: "spacer" }),
      modeSwitch,
      sizes.el,
      h("button", { type: "button", class: "btn btn-small", onclick: toggleFullscreen, title: "Full screen (f)" }, "Full screen"),
      h("a", { class: "btn btn-small btn-quiet", href: back }, "Leave"),
      h("span", { class: "hint" }, h("kbd", null, "1"), h("kbd", null, "2"), h("kbd", null, "3"), " size, ", h("kbd", null, "t"), " demo or pitch, ", h("kbd", null, "Esc"), " leave"),
    ),
    stageHost,
  );
  drawStage();

  return {
    el,
    title: `Presenting ${lead.business}`,
    onKey: handle,
    destroy() {
      frame?.destroy();
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    },
  };
}
