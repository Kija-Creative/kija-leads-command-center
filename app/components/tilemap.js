// US state tile grid: every state one square, in the familiar tile map arrangement.
// Fill shows lead count; a magenta edge marks states a run has covered, a dashed edge the
// upcoming rotation.

import { h } from "../lib/dom.js";

// [code, column, row] on an 11 by 8 grid.
export const TILES = [
  ["AK", 0, 0], ["ME", 10, 0],
  ["VT", 9, 1], ["NH", 10, 1],
  ["WA", 0, 2], ["ID", 1, 2], ["MT", 2, 2], ["ND", 3, 2], ["MN", 4, 2], ["IL", 5, 2], ["WI", 6, 2], ["MI", 7, 2], ["NY", 8, 2], ["RI", 9, 2], ["MA", 10, 2],
  ["OR", 0, 3], ["NV", 1, 3], ["WY", 2, 3], ["SD", 3, 3], ["IA", 4, 3], ["IN", 5, 3], ["OH", 6, 3], ["PA", 7, 3], ["NJ", 8, 3], ["CT", 9, 3],
  ["CA", 0, 4], ["UT", 1, 4], ["CO", 2, 4], ["NE", 3, 4], ["MO", 4, 4], ["KY", 5, 4], ["WV", 6, 4], ["VA", 7, 4], ["MD", 8, 4], ["DE", 9, 4],
  ["AZ", 1, 5], ["NM", 2, 5], ["KS", 3, 5], ["AR", 4, 5], ["TN", 5, 5], ["NC", 6, 5], ["SC", 7, 5], ["DC", 8, 5],
  ["OK", 3, 6], ["LA", 4, 6], ["MS", 5, 6], ["AL", 6, 6], ["GA", 7, 6],
  ["HI", 0, 7], ["TX", 3, 7], ["FL", 8, 7], ["PR", 10, 7],
];

export const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska",
  NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", PR: "Puerto Rico",
};

// counts: { [code]: n }, covered and upcoming: Set of codes, home: Set of codes.
export function tileMap({ counts, covered, upcoming, home, selected, onPick }) {
  const max = Math.max(1, ...Object.values(counts));
  const tiles = TILES.map(([code, col, row]) => {
    const n = counts[code] ?? 0;
    // Square root keeps one lead visible next to a state with twenty.
    const strength = n ? 0.22 + 0.6 * Math.sqrt(n / max) : 0;
    const bits = [];
    bits.push(n ? `${n} ${n === 1 ? "lead" : "leads"}` : "no leads");
    if (covered.has(code)) bits.push("covered by a run");
    if (upcoming.has(code)) bits.push("in the upcoming rotation");
    if (home.has(code)) bits.push("home metro");
    const cls = ["tile", n ? "" : "is-zero", covered.has(code) ? "is-covered" : "", upcoming.has(code) ? "is-upcoming" : "", home.has(code) ? "is-home" : ""]
      .filter(Boolean)
      .join(" ");
    return h(
      "button",
      {
        type: "button",
        class: cls,
        style: {
          gridColumn: String(col + 1),
          gridRow: String(row + 1),
          background: n ? `color-mix(in oklch, var(--positive) ${Math.round(strength * 100)}%, var(--surface-1))` : "",
          color: n && strength > 0.55 ? "#0b0b0d" : "",
        },
        "aria-pressed": String(selected === code),
        "aria-label": `${STATE_NAMES[code] ?? code}: ${bits.join(", ")}`,
        title: `${STATE_NAMES[code] ?? code}: ${bits.join(", ")}`,
        onclick: () => onPick(code),
      },
      h("span", { class: "code" }, code),
      h("span", { class: "n", style: { color: n && strength > 0.55 ? "#0b0b0d" : "" } }, n ? String(n) : ""),
    );
  });
  return h("div", { class: "tilemap", role: "group", "aria-label": "Leads by state" }, tiles);
}
