// A minimal page built exactly to the renderer contract (markers.ts), used to prove the audit
// passes a faithful page and flags each kind of departure. It is a test fixture, not a design.
import type { SiteDnaRecord } from "../src/design-intelligence/schema.ts";
import { fontsHref } from "../src/design-intelligence/design-tokens.ts";
import { ctaAttribute, dnaAttributes, dnaRootCss, escapeHtml, moduleAttributes, PLACEHOLDER_ATTRIBUTE } from "../src/design-intelligence/markers.ts";
import { pageLabel } from "../src/design-intelligence/modules.ts";
import { DEMO_SENT_MESSAGE, ribbonText } from "../src/demo/shared.js";

export interface PageOptions {
  extraCss?: string;
  extraBody?: string;
  dropModule?: string;
  rootAttrs?: string;
  headExtra?: string;
  lang?: boolean;
  viewport?: boolean;
}

export function fixturePage(record: SiteDnaRecord, o: PageOptions = {}): string {
  const dna = record.dna;
  const f = record.facts;
  const tel = `tel:${f.phone.replace(/[^0-9]/g, "")}`;
  const embedded = dna.requiredModules.filter((m) => !dna.sectionOrder.includes(m) && m !== o.dropModule);
  const placeholders = new Set(record.truth.placeholders);
  const hosts = new Map<string, string[]>();
  const last = dna.sectionOrder[dna.sectionOrder.length - 1];
  for (const m of embedded) {
    if (m === "phone-cta") continue;
    hosts.set(last, [...(hosts.get(last) || []), m]);
  }
  const slot = (m: string) => `<div${moduleAttributes(m)}${PLACEHOLDER_ATTRIBUTE}><p class="slot">${escapeHtml(pageLabel(m))}: to confirm with the owner.</p></div>`;
  const sections = dna.sectionOrder.filter((m) => m !== o.dropModule).map((m, i) => {
    const inner: string[] = [];
    if (m === "hero") {
      inner.push(`<h1>${escapeHtml(f.business)}</h1><p>Roof work in ${escapeHtml(f.city)}.</p>`);
      inner.push(`<a class="btn btn-primary" href="#request"${ctaAttribute(dna.primaryConversion)}>Start here</a>`);
    } else {
      inner.push(`<h2>${escapeHtml(pageLabel(m))}</h2>`);
    }
    if (m === "ratings" || m === "reviews" || m === "trust-strip") inner.push(`<p data-rating="${f.googleRating}" data-reviews="${f.googleReviews}"><span data-rating-num>${f.googleRating}</span> from ${f.googleReviews} Google reviews</p>`);
    if (placeholders.has(m)) inner.push(`<div${PLACEHOLDER_ATTRIBUTE}><p>${escapeHtml(pageLabel(m))}: to confirm with the owner.</p></div>`);
    for (const e of hosts.get(m) || []) {
      if (e === "estimate-form") {
        inner.push(`<form data-demo-form${moduleAttributes("estimate-form")}><label for="nm">Name</label><input id="nm" name="name" type="text"><label for="ph">Phone</label><input id="ph" name="phone" type="tel"><button class="btn" type="submit">Send</button></form><p hidden>${DEMO_SENT_MESSAGE}</p>`);
      } else if (e === "reviews") {
        inner.push(`<div${moduleAttributes(e)}><p data-rating="${f.googleRating}" data-reviews="${f.googleReviews}"><span data-rating-num>${f.googleRating}</span> from ${f.googleReviews} Google reviews</p></div>`);
      } else if (placeholders.has(e)) inner.push(slot(e));
      else inner.push(`<div${moduleAttributes(e)}><p>${escapeHtml(pageLabel(e))}.</p></div>`);
    }
    if (m === last) inner.push(`<a class="btn btn-primary" href="#request"${ctaAttribute(dna.primaryConversion)}>Start here</a>`);
    return `<section${moduleAttributes(m, i)}>${inner.join("")}</section>`;
  }).join("\n");
  const css = [
    dnaRootCss(dna),
    "body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font-body)}",
    `.btn{display:inline-flex;min-height:48px;padding:12px 20px;border-radius:var(--radius-control);background:var(--primary);color:var(--on-primary);transition:background-color 150ms ease}`,
    ".call{display:inline-flex;min-height:48px}",
    "a:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid var(--accent)}",
    "@media (min-width: 760px){main{max-width:72rem;margin:0 auto}}",
    "@media (prefers-reduced-motion: reduce){*{transition:none}}",
    o.extraCss || "",
  ].join("\n");
  const ribbon = ribbonText(f.business, { photos: false });
  return `<!doctype html>
<html${o.lang === false ? "" : " lang=\"en\""}>
<head>
<meta charset="utf-8">
${o.viewport === false ? "" : "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"}
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(f.business)}</title>
<link rel="stylesheet" href="${escapeHtml(dna.fontPairing ? fontsHref(dna.fontPairing) : "")}">
<style>${css}</style>
${o.headExtra || ""}
</head>
<body${o.rootAttrs ?? dnaAttributes(dna)}>
<div data-kija-ribbon><p>${escapeHtml(ribbon)}</p></div>
<header><a href="/">${escapeHtml(f.business)}</a><nav><a href="#request">Request</a></nav><a class="call" href="${tel}"${ctaAttribute("call")}${o.dropModule === "phone-cta" ? "" : moduleAttributes("phone-cta")}>${escapeHtml(f.phone)}</a></header>
<main>
${sections}
${o.extraBody || ""}
</main>
<footer><p>${escapeHtml(f.business)}, ${escapeHtml(f.city)}</p></footer>
</body>
</html>`;
}
