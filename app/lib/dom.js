// Tiny DOM builder. Text always goes in through textContent, never innerHTML, because lead
// data comes from research on third party sites.

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") el.className = value;
      else if (key === "text") el.textContent = value;
      else if (key === "dataset") Object.assign(el.dataset, value);
      else if (key === "style" && typeof value === "object") Object.assign(el.style, value);
      else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2).toLowerCase(), value);
      else if (key === "value" && ("value" in el)) el.value = value;
      else if (key === "checked" || key === "selected" || key === "disabled") el[key] = Boolean(value);
      else if (value === true) el.setAttribute(key, "");
      else el.setAttribute(key, String(value));
    }
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false || child === "") continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

// Replaces a node's children.
export function fill(el, ...children) {
  el.replaceChildren();
  return append(el, children);
}

export function svg(markup) {
  // Only for the app's own static icon markup, never data.
  const t = document.createElement("template");
  t.innerHTML = markup.trim();
  return t.content.firstChild;
}

export function external(href, label, attrs = {}) {
  return h("a", { href, target: "_blank", rel: "noopener noreferrer", class: "ext", ...attrs }, label);
}

// Duck typed, because events forwarded from a same origin iframe carry another realm's Element.
export function isTyping(target) {
  if (!target || typeof target.tagName !== "string") return false;
  const tag = target.tagName.toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

let uid = 0;
export function nextId(prefix = "f") {
  uid += 1;
  return `${prefix}-${uid}`;
}
