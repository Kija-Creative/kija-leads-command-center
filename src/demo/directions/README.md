# Direction contract

A direction is one complete visual language for demo sites: layout skeleton, type pairing,
palettes, section treatments and photo treatment. Each lives in its own file here and is
registered in `index.js`, which already imports every key from the design briefs
(`research/design-*.md`). To build a direction, replace its file. Do not edit `index.js`,
`../render.js`, `../blocks.js`, `../assign.js` or another direction's file; if a shared block
needs a change, ask the architect.

Reference implementations: `barber-after-hours.js`, `barber-fade-lab.js`,
`barber-cover-story.js`, `barber-gallery-mono.js`. The shared default layout that stubs use is
`../layouts/default.js`.

## Exports

```js
export const direction = {
  key: "auto-fab-shop",            // the file name, lowercase hyphenated
  label: "Fab shop",               // shown in the app
  status: "implemented",           // "stub" until the file is built, then "implemented"
  suits: ["muffler-exhaust", "auto-repair", "diesel-truck-repair"], // from the brief; first entry is the home field
  keywords: ["heritage", "custom"], // words in lead.demoConcept that should pull a lead here
  fontsHref: "https://fonts.googleapis.com/css2?family=...&display=swap", // Google Fonts only
  palettes: [ { key: "fab-sign", name: "Shop sign", vars: { bg, surface, ink, muted, line, primary, "on-primary", ... } } ], // 3 or more
  variants: { hero: ["a", "b"], services: ["a"], proof: ["a"] }, // 1 or more each; 2 heroes keep signatures unique
  imagery: { photos: true, people: ["none", "hands"], heroPeople: ["none"], heroPrefer: /roof|fence/ },
  callbar: "call",                 // "call" (one phone pill) or "split" (Call and Book, for booked trades)
  render(ctx) { return { css, body }; },
};
```

- Palette keys must be unique across all directions and hyphenated (`fab-sign`, not `sign`),
  because a palette key alone tells assignment which direction it belongs to. Required tokens:
  `bg surface ink muted line primary on-primary`. Add any others the direction needs (the
  barber files add `flood`, `accent3`, `photo-filter`, ...). Body text 4.5:1 on its background.
- `imagery.photos: false` means no stock photos. `people` limits which library photos may be
  used at all (`none hands partial face`); home and contractor directions use
  `["none", "hands"]`. `heroPeople` narrows the hero. `heroPrefer` is a RegExp on photo ids that
  puts matching photos first for the hero.
- `render(ctx)` must be pure (no clock, no disk, no randomness) and return `{ css, body }`.
  `body` is everything inside `<body>` except the ribbon, the call bar and the page script,
  which `render.js` adds. `css` is appended after the shared `BASE_CSS` (`../shared.js`) and
  the palette's custom properties, so a direction restyles every shared class freely.

## What ctx carries

Facts (already escaped where marked html; raw values are for logic only):

| field | meaning |
|---|---|
| `lead` | the raw lead record |
| `name` (html), `nameRaw`, `nameScale` | business name; scale is `xl l m s` by length |
| `categoryKey`, `vertical`, `categoryT` (html) | category, vertical, translated category label |
| `placeRaw`, `cityState`, `cityRaw`, `stateRaw` | place strings (escape before use) |
| `phone`, `tel` | display phone and `tel:` href, both "" when absent |
| `rating`, `reviews`, `ratingText`, `reviewsText` | exact record values and their display forms |
| `services`, `servicesFromDefaults` | sourced services, or category defaults (then labelled) |
| `themes` | paraphrased review themes, may be empty |
| `hours`, `address`, `mapsUrl` | sourced only, "" when absent |
| `copy`, `about` (html), `copyOr(key, [en, es])` | owner approved demoCopy wins over chrome copy |
| `promise` | `[en, es]` promise line for the category (`../copy.js`) |
| `kind`, `formCopy`, `form` (html) | request form kind, its title/intro/cta pairs, the form markup |
| `now`, `year`, `monthYear`, `days` | injected render date and derived values |
| `direction`, `palette`, `variants` | this direction, the chosen palette, `{ hero, services, proof, photo }` |
| `photos` | the photo set: `hero()`, `next(filter)`, `many(n, filter)`, `img(photo, opts)`, `used` |
| `i18n`, `t(en, es)`, `langToggle` (html) | bilingual chrome; `t` returns escaped markup |

Rules: never print a fact that is not in ctx; never state a claim (licensed, insured, since,
years, family owned, guarantee, warranty, financing, best, #1, awards); never quote a review;
never invent names, prices or policies. A missing fact gets a "to confirm" line, which
`visitDetails` already does. Keep italics as separate `t()` calls so they survive the
language toggle: `` `${t("The", "El")} <em>${t("menu", "menú")}</em>` ``.

## Building blocks (`../blocks.js`)

Every block returns html with `b-` classes and takes `cls` for your own class.

- `siteHeader(ctx, { nav, cta, phone, ctaCls })`: wordmark, nav, phone, one Book or Request button.
- `bookButton(ctx, { cls, label, ico, arrow })`, `callButton(ctx, { cls, label, number, ico })`,
  `floatingBook(ctx, { label })` (desktop pill), `shortCta(ctx)` (a header label pair).
- `ratingProof(ctx, variant, { cls, caption })`: `strip figure numbers chip sticker`. The only
  way to show the rating: it carries `data-rating`, `data-reviews`, `data-rating-num` and the
  words "Google reviews" that the guardrail checks. Show it within one scroll of the hero.
- `servicesList(ctx, variant, { tail, link, numbered })`: `menu list chips grid`;
  `servicesConfirm(ctx)` adds "Menu and prices to confirm" and the defaults note. No prices.
- `themesBlock(ctx, { variant })`: "" when the lead has no themes.
- `teamPlaceholders(ctx, { count, glyph, book })`: numbered chairs with a placeholder note. No
  stock faces in a team section, ever.
- `heroPhoto(ctx, opts)`, `photoFrame(ctx, photo, { hero, sizes, width, tag, position })`,
  `gallery(ctx, { count, sizes, width, tag, filter })`: library photos only; a gallery fills
  missing photos with "Your work goes here" tiles. Always design a no photo fallback (SVG).
- `visitDetails(ctx)`, `faqBlock(ctx, { items })`, `stepsBlock(ctx)`, `formHeading(ctx)`,
  `promiseLine(ctx)`, `marquee(ctx, items)`, `roleFor(ctx)`, `uid(ctx)`.
- `siteFooter(ctx)`: name, place, phone, legal line and the photo credit slot. If you write
  your own footer, include `CREDITS_SLOT` inside it.
- `REQUEST_ID` ("request"): the section that holds `ctx.form` must use this id; every Book link
  points at it.
- `../copy.js`: `promiseFor`, `stepsFor`, `faqFor`, `monthYear` for chrome copy that is safe.

Motion: add class `rv` to items that should reveal on scroll; the page script and `BASE_CSS`
handle it with a failsafe, reduced motion and print. Never hide content in CSS without the
`html.js .rv[data-rv-wait]` marker, and do not use `animation-timeline`.

## Registering CSS

Return it from `render` as a string. Put font tokens in `:root` (`--display`, `--body`, plus
your own), style the shared classes (`.b-hd`, `.b-rating`, `.b-svc`, `.facts`, `.faq`, `.f-input`,
`.f-chip>span`, `.f-submit`, `.b-ft`, `.b-float`, `.callbar--split`, ...) and prefix your own
classes with a short direction prefix (`ah-`, `cv-`, `fl-`, `gm-`). No remote `url()`, no data
URL images, no `<picture>`, `<video>`, `<iframe>` or scripts. Mobile works at 375px wide with
the first screen showing the name, the rating or an action.

## Checks

`npm test` renders every direction for every category it suits, in every palette and hero
variant, in English and Spanish, and runs `checkDemoHtml` on each. Preview a lead with a forced
choice: `renderDemo(lead, { categories, now, assignment: { direction, palette, variants } })`.
