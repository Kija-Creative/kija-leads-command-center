# Concept build standard

How every prospect website concept is built, for the weekly run and for any rebuild. It is the
process that produced the showcase concepts Jamey approved (Most Famous Cutz, GM AUTO CARE and
the rest in `demos/*/`). The old template generator (`npm run demos` with the rating gauge card and
"Tell us what it is doing" hero) is retired for concepts: Jamey rejected that look on 2026-09-30.

Binding reading first: `CLAUDE.md`, the top section of `AGENTS.md`,
`docs/site-generation/IMPLEMENTATION-BRIEF-v2.md` (Jamey's spec; it wins on design),
`design-intelligence/SPEC-site-dna.md`, `src/design-intelligence/schema.ts`. The quality bar is
the existing showcase concepts: open two of them (`index.html`, `SITE_DNA.json`, `RESEARCH.md`,
`DESIGN-TOKENS.md`, `SOURCES.md`) before starting, then match or beat them while looking nothing
like them.

## 1. Plan the Site DNA first

Classify industry and subIndustry, derive brand traits only from the lead record, choose an
archetype appropriate to the business (suitability first), then every axis from the v2
vocabularies, with the section order built from the industry's conversion architecture. Prove the
variation rules with the engine before building: import `compareSiteDNA` from
`src/design-intelligence/variation.ts` (Node 24 runs `.ts` directly) and check the new DNA against
every existing `demos/*/SITE_DNA.json`: at least 6 of 13 dimensions different from any recent
site, at least 7 from any site in the same industry, and never a clone signature (same hero,
typography, geometry and section order). Fix by changing composition, typography, geometry,
imagery or hero, never palette alone. Write `demos/<id>/SITE_DNA.json` (SiteDNA plus
`reasoningSummary`, `variationScore`, `locked: false`, `status`).

Gates before building: a business whose own public content shows it operates only in Spanish is
not built (Kija has no Spanish speaker; judge by the language of its own listing text, posts and
review replies, never its name). A listing named with a search phrase rather than a trade name
needs its real name found first. A lead on hold (status Research for a legitimacy check) is not
built.

## 2. Hard rules

- Never state a fact about the business that is not in its record in `data/leads.json`. No
  invented prices, years, awards, licenses, warranties, insurance, staff names, testimonials or
  review quotes. Missing details are clearly labelled owner-to-confirm placeholders. Review
  content only as paraphrased themes from the record, or the rating and review count exactly as
  recorded.
- Private concept: `<meta name="robots" content="noindex, nofollow">` and the ribbon "Private
  concept by Kija Creative for {business}. Not the official website. Photos are stock
  placeholders. Details to confirm with the owner." Forms are demo only (`data-demo-form`, no
  action, on submit "This is a concept. Nothing was sent."). Photos only from
  `src/demo/stock-library.json` (caption as placeholders, credit photographers); add photos only
  under `research/stock-photos.md`. No other external requests except Google Fonts. No em or en
  dashes. Never contact the business, publish, deploy or submit a form anywhere.
- One self contained HTML file. `data-dna` attributes for every axis on the root, `data-module` on
  every section, JSON-LD of the most specific schema.org type with sourced fields only (never
  aggregateRating), LCP 2.5 s or less, no layout shift, 48 px tap targets, keyboard usable with
  visible focus, WCAG AA contrast, reduced motion respected, works at 390 wide.

## 3. Build from the JSON, code and GitHub sources

A. Code sources: real component and block files from shadcn-ui/ui, htmlstreamofficial/preline,
shadcn/originui, markmead/hyperui, magicuidesign/magicui, nolly-studio/cult-ui and
kokonut-labs/kokonutui, plus open source landing pages or templates for the industry found on
GitHub. Only repositories whose LICENSE you opened and that is MIT, Apache 2.0, BSD or ISC. Read
files read only (WebFetch on github.com or raw.githubusercontent.com); never clone, install or run
them; never copy images, logos, brand names, testimonials or copy.

B. Port their structure and accessible behavior into vanilla HTML, CSS and JS, restyled completely
to the Site DNA so no source's default look survives. Credit every port in a comment with its URL
and license and list them in `demos/<id>/SOURCES.md`.

C. skynet-site-system (`.design-references/skynet-site-system/SKILL.md`, `design-tokens.md`,
`case-studies.md`): a competitor teardown of 8 to 12 real competitors in or near the business's
city (palette, fonts, hero, CTA, sameness gaps) saved as `RESEARCH.md`; a token lock from its
niche table fitted to the DNA (one accent, two at most, never Inter as the body default) saved as
`DESIGN-TOKENS.md`; 4 to 6 niche fit signatures (light for trades); its performance and SEO
guardrails. Not adopted: its fixed funnel order, testimonial carousels, invented trust signals,
email capture, exit intent, its badge, and its Phase 8 (no repo, deploy or pitch).

D. design-playbooks (`.design-references/design-playbooks-skill/skill/SKILL.md`; Python is not
installed, so query `catalog.json` with node; view reference sites live): a style code from the
DNA, the home page and style playbooks as constraints, 2 to 4 reference profiles spread across
palettes and not already anchored on by another concept (check every `demos/*/SITE_DNA.json`
`referencesUsed`), tokens from ONE primary reference with the hue shifted, never averaged, never a
one to one copy.

E. Verify loop: the built-in browser only draws the top of long pages reliably, so capture full
pages with headless Edge (`msedge.exe --headless=new --disable-gpu --hide-scrollbars
--virtual-time-budget=6000 --window-size=1440,3400 --screenshot=<png> <url>`, and again at
390x2600) and read the images; use the built-in browser for interactions. Compare against the
references and competitors, list mismatches, fix, re-check once. Run `checkDemoHtml` from
`src/demo/guardrails.js` on the file and the lead record and fix every failure.

## 4. Deliverables

In `demos/<id>/`: `index.html`, `showcase.html` (identical copy), `SITE_DNA.json` (status
"built", with `codeSources`, `referencesUsed`, `reasoningSummary`), `RESEARCH.md`,
`DESIGN-TOKENS.md`, `SOURCES.md`. Report the DNA, the sources ported with licenses, references and
competitors used, signatures, the guardrail result, and what makes it distinct.
