# Design Intelligence Engine: implementation brief

Supplied by Jamey on 2026-09-29, kept verbatim as the source document for this system. The
companion rules are in `design-intelligence/SPEC-site-dna.md`, the supplied types are in
`src/design-intelligence/schema.ts`, `variation.ts` and `seed.ts`. Project content rules (never
state an unsourced fact about a real business) apply on top.

---

You are working inside my existing Lead Command Center.
I want you to IMPLEMENT, not merely propose, a permanent multi-industry website Design Intelligence Engine for automatically generated prospect websites.

The problem:
The Lead Command Center finds companies that need better websites. We then use AI coding agents to automatically generate website concepts for those leads.
I do NOT want these websites to look like the same template with different logos, colors, photos, or text.
A roofing company, dentist, lawyer, Pilates studio, restaurant, SaaS company, nonprofit, hotel, accountant, construction company, medical clinic, realtor, automotive company, etc. should look like it was intentionally designed for that particular industry and brand.
Even two businesses in the SAME industry should not automatically receive the same visual architecture.
The objective is:
WEBSITES THAT DO NOT LOOK TEMPLATE-GENERATED
Do not create a giant collection of hard-coded website templates.
Create a DESIGN INTELLIGENCE SYSTEM.

## Reference material

Use these repositories as design intelligence and implementation references if they are available locally:
waseemnasir2k26/skynet-site-system, veryCoolTimo/design-playbooks-skill, shadcn-ui/ui, htmlstreamofficial/preline, shadcn/originui, markmead/hyperui, magicuidesign/magicui, nolly-studio/cult-ui, kokonut-labs/kokonutui.

IMPORTANT:
Do not blindly copy third-party sites.
Do not copy copyrighted images, brand assets, testimonials, proprietary copy, logos, or entire layouts.
Extract principles, patterns, tokens, structural approaches and reusable open-source components according to their licenses.
Component libraries are INGREDIENTS, not the visual identity.

| Purpose | Repository |
|---|---|
| Industry website intelligence | https://github.com/waseemnasir2k26/skynet-site-system |
| 407-site design playbooks | https://github.com/veryCoolTimo/design-playbooks-skill |
| Accessible primitives | https://github.com/shadcn-ui/ui |
| Large alternative block library | https://github.com/htmlstreamofficial/preline |
| Different shadcn-style compositions | https://github.com/shadcn/originui |
| Tailwind alternatives | https://github.com/markmead/hyperui |
| Motion / high-design | https://github.com/magicuidesign/magicui |
| Experimental design-engineering | https://github.com/nolly-studio/cult-ui |
| Contemporary alternate components | https://github.com/kokonut-labs/kokonutui |

Local copies: `.design-references/skynet-site-system`, `.design-references/design-playbooks-skill`
(both MIT), and the design-playbooks skill installed at `~/.claude/design-library`.

## First: inspect this repository

Before changing architecture:

1. Inspect the existing application.
2. Identify its framework, routing, persistence/database, lead schema, current website-generation workflow and AI-generation workflow.
3. Preserve existing functionality.
4. Reuse existing conventions where reasonable.
5. Do not rewrite working systems simply to match this specification.
6. Adapt this architecture to the existing stack.
7. If this is already TypeScript, keep the Design Intelligence Engine strongly typed.

Then implement the system.

## Source-of-truth architecture

Create an appropriate equivalent of:

```
/docs/site-generation/
  SITE-DNA.md
  INDUSTRY-RULES.md
  DESIGN-PRINCIPLES.md
  REFERENCE-LIBRARIES.md
/src/design-intelligence/
  schema.ts
  industries.ts
  archetypes.ts
  component-dialects.ts
  select-site-dna.ts
  variation.ts
  prompt-builder.ts
  index.ts
/data/
  site-dna-history.json
```

If this repository already has a better organizational convention, use that instead.
The architecture matters more than the exact file paths.

## Site DNA

Every generated website MUST receive a Site DNA fingerprint before frontend generation begins.
Site DNA should include at minimum: industry, subIndustry, archetype, hero, navigation, typography, paletteFamily, layoutRhythm, geometry, imagery, motion, sectionOrder, ctaStyle, proofStyle, componentDialect, requiredModules, forbiddenPatterns, brandTraits.
Persist the Site DNA with the generated site.
A generated website must be reproducible from its Site DNA.

## Industries

Create initial support for at least: home-services, roofing, hvac, plumbing, electrical, construction, law, medical, dental, finance, accounting, insurance, real-estate, restaurant, hospitality, beauty-spa, barbershop, pilates-wellness, gym-fitness, saas-technology, ecommerce, nonprofit, education, architecture-interiors, industrial-manufacturing, automotive, photography-creative.
The schema must support adding new industries without modifying the selection engine.

## Multiple archetypes per industry

Do NOT define one appearance for each industry.
Every industry needs multiple APPROPRIATE design archetypes.

ROOFING / HOME SERVICES
1. Industrial Utility: functional, high trust, strong sans serif, squared geometry, obvious phone/estimate actions, project photography, low motion
2. Premium Residential: architectural photography, warmer neutral palette, larger whitespace, sophisticated typography, craftsmanship presentation, higher-end residential feel
3. Blue-Collar Modern: bold typography, high contrast, real crew/job-site imagery, energetic layouts, straightforward CTA treatment

LAW: 1. Institutional Editorial 2. Modern Minimal 3. Cinematic Prestige
DENTAL: 1. Clinical Modern 2. Warm Family 3. Boutique Cosmetic
MEDICAL: 1. Clinical Authority 2. Human / Family Care 3. Boutique Specialist
RESTAURANT: 1. Fine Dining Editorial 2. Neighborhood Warm 3. Contemporary Culinary
PILATES / WELLNESS: 1. Boutique Editorial 2. Organic Minimal 3. Modern Performance
GYM / FITNESS: 1. Athletic Kinetic 2. Industrial Training 3. Premium Performance
REAL ESTATE: 1. Luxury Editorial 2. Modern Brokerage 3. Neighborhood Lifestyle
SAAS / TECHNOLOGY: 1. Product Minimal 2. Technical Dark 3. Expressive Innovation
BEAUTY / SPA: 1. Editorial Luxury 2. Organic Wellness 3. Contemporary Beauty
FINANCE: 1. Institutional Precision 2. Private Wealth 3. Modern Fintech
CONSTRUCTION: 1. Industrial Capability 2. Architectural Premium 3. Field-Proven Contractor
HOTEL / HOSPITALITY: 1. Cinematic Luxury 2. Boutique Editorial 3. Destination Lifestyle
NONPROFIT: 1. Documentary Human 2. Institutional Trust 3. Grassroots Energy
ARCHITECTURE / INTERIORS: 1. Gallery Minimal 2. Editorial Architectural 3. Material / Experimental

Create sensible equivalents for the remaining industries.

## Bounded variation

Variation must NOT mean random design.
Use: INDUSTRY → BUSINESS ATTRIBUTES → BRAND TRAITS → CONVERSION OBJECTIVE → APPROPRIATE ARCHETYPES → SITE DNA → FRONTEND
Never choose a style simply because it has not been used recently if that style is inappropriate for the business.
Industry suitability comes first.
Variation happens inside the set of appropriate choices.

## Site difference engine

Keep a history of recently generated Site DNA fingerprints.
Compare every new candidate against recent websites.
Evaluate at minimum: hero, navigation, typography, paletteFamily, layoutRhythm, geometry, imagery, motion, sectionOrder, ctaStyle, proofStyle, componentDialect, archetype.
A site should differ from recently generated sites across at least SIX meaningful visual dimensions.
Also apply this hard rule:
Do not allow two consecutive sites to share ALL FOUR of: hero architecture, section-order architecture, typography classification, geometry system.
If a candidate is too similar:
1. Try another appropriate archetype.
2. Recompose section architecture.
3. Change typography classification.
4. Change hero architecture.
5. Change layout rhythm.
6. Change imagery treatment.
7. Change geometry.
8. Change component dialect.
Do NOT merely change colors.

## Deterministic selection

Do not use uncontrolled Math.random() design decisions.
Create a deterministic seed based on stable lead information such as: lead ID, business name, domain, industry.
Use the seed only to choose between already-valid design possibilities.
This allows regeneration to remain stable.
Brand attributes and industry suitability should carry greater weight than the seed.

## Industry-specific conversion architecture

Section architecture must depend on how customers choose that kind of company.
DO NOT use this same generic structure everywhere: Hero, Logo strip, Three cards, Testimonials, CTA, FAQ.

- HOME SERVICES: call, estimate, availability, services, reviews, warranty, financing, service area, projects
- LAW: consultation, practice areas, attorney credibility, relevant experience, process, locations, FAQ
- MEDICAL: appointment, providers, conditions/services, insurance, patient information, locations, FAQ
- DENTAL: booking, services, dentist/team, patient comfort, insurance/financing, reviews, first visit
- REAL ESTATE: property search, featured properties, neighborhoods, agent credibility, valuation/tour
- RESTAURANT: menu, reservation/order, food, story, location, hours
- HOTEL: availability, rooms, experiences, amenities, gallery, location
- BEAUTY / SPA: booking, treatments, pricing, results, team, reviews
- PILATES / FITNESS: introductory offer, classes, methodology, schedule, instructors, memberships
- SAAS: product understanding, demonstration, use cases, integrations, proof, pricing, signup/demo
- ECOMMERCE: discovery, product detail, merchandising, reviews, cart, checkout
- NONPROFIT: mission, impact, programs, stories, volunteer, donate, transparency
- ARCHITECTURE / CREATIVE: work, individual projects, philosophy, services, studio, contact
- INDUSTRIAL / MANUFACTURING: capabilities, industries served, equipment/process, certifications, projects, RFQ

Define equivalent conversion logic for every supported industry.

## Design axes

Use controlled vocabularies where helpful (see `src/design-intelligence/schema.ts`): HERO, NAVIGATION, TYPOGRAPHY, LAYOUT RHYTHM, GEOMETRY, IMAGERY, MOTION. Do not force these enums if the current application's architecture makes another representation cleaner.

## Component dialects

Create component dialects rather than a single global UI appearance.
Potential dialects: utility, editorial, clinical, luxury, industrial, technical, boutique, kinetic, commerce, portfolio, institutional, minimal.
Component libraries may supply functionality and patterns. shadcn/ui: behavioral primitives, accessibility, forms, dialogs. Preline: alternative blocks, navigation, forms and structural patterns. Origin UI: alternate component compositions. HyperUI: marketing and commerce structures. Magic UI: motion-forward technology/creative experiences. Cult UI: expressive interactions. KokonutUI: additional contemporary components.
IMPORTANT: Never let importing a component dictate the website's visual identity. Restyle components according to Site DNA.

## Anti-AI-design rules

Do not default to: Inter everywhere, purple/blue gradient backgrounds, glowing blobs, glassmorphism, three feature cards, Bento grids, excessive pill buttons, giant rounded rectangles, generic dashboard screenshots, centered hero on every site, identical section rhythm, identical navbars, identical testimonial cards, generic icon grids, same border radius throughout every project.
These techniques are not banned globally. They are banned as DEFAULTS. Use them only when Site DNA actually calls for them.

## Typography

Typography is one of the strongest differentiation systems. Do not simply swap between similar geometric sans fonts. Different archetypes should permit materially different typography: editorial serif + grotesk, condensed display + humanist sans, single neo-grotesk, high-contrast serif + restrained sans, technical grotesk + mono accent, warm serif + humanist sans. Maintain readability and performance.

## Imagery

Image strategy must also be part of Site DNA. Roofing: real roofs, crews, details, materials, transformations. Medical: providers, patient environment, facilities, human care. Restaurant: food macro photography, chef, environment, ingredients. Architecture: projects dominate the interface. Pilates: human movement, studio, reformers, close material details. Industrial: equipment, plant, process, fabrication, technical details. Law: people, city/context, office or restrained conceptual imagery.
Avoid generic stock imagery whenever better business-specific imagery is available.
Never fabricate a representation of the actual business.

## Truthfulness

Never fabricate: reviews, ratings, customer counts, years in business, awards, licenses, certifications, case results, medical outcomes, financial performance, project quantities, testimonials, media mentions.
Use placeholders clearly identified as placeholders when information is unavailable.

## Design references

When design-playbooks-skill is available: use it for pattern discovery and design-reference reasoning. Do not average unrelated reference palettes together. Select references that are appropriate to the Site DNA.
When skynet-site-system is available: use its niche rules, design tokens, conversion observations and anti-patterns as RESEARCH INPUT. Do not blindly inherit its fixed funnel order or force its Editorial/Cinematic/Bold system onto every site. Our Site DNA system is the higher-level authority.

## Per-site output

Before frontend generation, produce and persist something equivalent to SITE_DNA.json containing: lead identifier, business, industry, subindustry, archetype, brand traits, primary conversion, hero, navigation, typography, palette family, layout rhythm, geometry, imagery, motion, section order, CTA treatment, proof treatment, component dialect, required modules, forbidden patterns, references used, variation score, reasoning summary.
The reasoning summary should be concise and should explain design decisions without exposing private chain-of-thought.

## Prompt builder

Create a prompt-builder function that converts lead data + industry profile + selected archetype + Site DNA + business facts + available assets into a structured frontend-generation brief. The generated brief should tell the website-building agent WHAT design system to execute. It should not leave the agent to invent a generic appearance.

## History

Persist at least the previous 50 Site DNA fingerprints. History must be queryable by: all sites, industry, archetype. Use existing database storage instead of JSON if this application already has appropriate persistent storage.

## Admin / command center UI

Where appropriate in the existing Lead Command Center, expose: Industry, Selected archetype, Site DNA, Variation score, Primary conversion, Design references, Regenerate DNA, Lock DNA, Generate website. Allow a human to override Site DNA before generation. Do not make the system a black box.

## Locking

Support locking Site DNA. Once a human approves a design direction, subsequent regeneration should preserve locked DNA unless explicitly unlocked.

## Quality control

Before marking a generated website complete, run an automatic design audit. Fail or flag a website when: it is too similar to recent sites; required industry modules are missing; forbidden patterns dominate the design; the CTA architecture does not fit the industry; the design ignores Site DNA; content fabricates trust signals; responsive behavior is broken; accessibility fundamentals fail; the layout obviously looks like an unmodified component-library demo.

## Implementation requirements

Write clean production-quality code. Add tests for: deterministic DNA selection, industry restrictions, variation scoring, duplicate prevention, Site DNA locking, history comparison, prompt generation. Do not leave the main system as pseudocode. Do not stop after creating documentation. Implement it into the application.

After implementation:
1. Run the project's tests.
2. Run lint/typechecking.
3. Fix failures caused by your changes.
4. Give me a concise summary of what was created.
5. Tell me exactly where the industry profiles live.
6. Tell me exactly how to add a new industry.
7. Tell me how the website generator consumes Site DNA.
8. Show me one example DNA for a roofing company.
9. Show me a substantially different DNA for another roofing company.
10. Show me one example DNA for a boutique Pilates studio to demonstrate cross-industry differentiation.

Do not ask me to make routine implementation decisions. Inspect the existing project and make strong reasonable choices.

## Pipeline, as given

```
LEAD
  ↓
Business classification
  ↓
Industry = roofing
  ↓
Brand traits inferred from VERIFIED lead data
  ↓
Allowed archetypes scored
  ↓
Premium Residential selected
  ↓
Site DNA generated
  ↓
Compare against last sites
  ↓
Difference threshold passes
  ↓
SITE_DNA.json locked
  ↓
Generation prompt constructed
  ↓
Claude/Codex builds site
  ↓
Design audit
  ↓
Screenshot / prospect review
```

## What the generation prompt must replace, as given

A vague prompt such as:

> "Make ABC Roofing a nice website."

must never reach the building agent. The prompt builder produces a constrained brief instead, including a divergence block like this one:

```
RECENT ROOFING WEBSITE DNA

Previous site:
Archetype: Premium Residential
Hero: full-bleed
Typography: serif-sans
Layout: editorial
Geometry: architectural
Imagery: project-gallery
Navigation: transparent-overlay
Motion: subtle

YOU MAY NOT reproduce this combination.

Current target:
Blue-Collar Modern

Required divergence:
Hero architecture
Typography family
Section composition
Geometry
Navigation architecture
Photography treatment
```

"ABC Roofing" is used in this project only as a clearly labelled example business (fixture), never as a real lead.
