// Score display: the computed total set large, and a five segment bar. Each segment's width
// is that rule's share of 100 points and its fill is what the lead earned, so the bar reads
// as both weight and attainment. Segment tooltips carry the part's detail sentence.

import { h } from "../lib/dom.js";
import { one } from "../lib/format.js";

const STRONG = 80;

function segment(part, { interactive }) {
  const ratio = part.max ? Math.max(0, Math.min(1, part.points / part.max)) : 0;
  const fill = h("i", { style: { width: `${(ratio * 100).toFixed(1)}%` } });
  const label = `${part.label}: ${one(part.points)} of ${part.max}. ${part.detail}`;
  const cls = `score-seg${ratio < 0.6 ? " is-low" : ""}`;
  const style = { flex: `${part.max} 1 0` };
  if (!interactive) return h("span", { class: cls, style, title: label }, fill);
  return h(
    "span",
    { class: cls, style, tabindex: "0", role: "img", "aria-label": label },
    fill,
    h("span", { class: "tip", "aria-hidden": "true" }, h("b", null, `${part.label}, ${one(part.points)} of ${part.max}`), part.detail),
  );
}

export function scoreBar(score, { interactive = true } = {}) {
  return h(
    "div",
    { class: "score-bar", role: interactive ? "group" : null, "aria-label": interactive ? "Score breakdown" : null, "aria-hidden": interactive ? null : "true" },
    (score?.parts ?? []).map((p) => segment(p, { interactive })),
  );
}

export function scoreBlock(score, { size = "", interactive = true, label = true } = {}) {
  const total = score?.total ?? 0;
  return h(
    "div",
    { class: `score${size ? ` score-${size}` : ""}` },
    h(
      "div",
      { class: `score-num${total >= STRONG ? " is-strong" : ""}`, "aria-label": label ? `Score ${total} of 100` : null },
      String(total),
      label ? h("small", { "aria-hidden": "true" }, "/100") : null,
    ),
    scoreBar(score, { interactive }),
  );
}

// Expanded view: every part with its meter and full sentence.
export function scoreParts(score) {
  return h(
    "ol",
    { class: "parts" },
    (score?.parts ?? []).map((p) =>
      h(
        "li",
        { class: "part" },
        h("span", { class: "part-label" }, p.label),
        h("span", { class: "part-meter", "aria-hidden": "true" }, h("i", { style: { width: `${p.max ? (p.points / p.max) * 100 : 0}%` } })),
        h("span", { class: "part-points" }, one(p.points), h("small", null, ` / ${p.max}`)),
        h("p", { class: "part-detail" }, p.detail),
      ),
    ),
  );
}
