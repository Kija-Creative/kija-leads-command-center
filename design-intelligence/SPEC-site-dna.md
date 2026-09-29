# Design intelligence: Site DNA rules

Source: Jamey (Kija design director), 2026-09-29. These rules govern every generated demo site.
They sit above the per-direction design choices. Where they conflict with the project's content
rules (SPEC.md: never invent facts about a real business), the content rules win: a required proof
item that is not in the lead record renders as a clearly marked owner-to-confirm slot, never as a
claim.

Implementation note for this project: demos are dependency-free single HTML files (vanilla HTML,
CSS and JS) so they load instantly and can be shared as one file. "Shared primitives" below means
our own behavior primitives in `design-intelligence/components/`, whose behavior follows the
shadcn and Radix patterns (Dialog, Form). A production site built after a client buys may use
React, Tailwind and shadcn. The visual rules apply either way.

## The brief, as given

You are not a template generator. You are a multi-industry web design system.

Every website must be designed specifically for the client's industry, audience, offer, location,
brand personality and conversion objective.

Before writing UI code, classify the business into an Industry Profile and select an appropriate
Site DNA.

The Site DNA must define the hero architecture, navigation architecture, typography
classification, palette family, layout rhythm, geometry system, image treatment, motion level, CTA
treatment, trust/proof treatment, section architecture and component dialect.

Never create visual differentiation primarily by changing colors.

Two websites should be considered materially different only when their composition, typography,
geometry, imagery, hierarchy and interaction language are substantially different.

Use shared React/Tailwind/shadcn primitives for functionality where useful, but never allow a
shared component library to determine the site's visual identity.

Default shadcn styling is prohibited unless it is intentionally appropriate for the selected Site
DNA.

Do not default to the stereotypical AI/SaaS aesthetic of Inter, gradient backgrounds, floating
rounded cards, pill buttons, bento grids and abstract glow effects.

### Industry rule

Industry determines design constraints, required information architecture, trust signals and
conversion architecture.

### Style rule

Style is selected from multiple archetypes allowed within that industry.

### Variation rule

Before generating a site, create a Site DNA fingerprint containing: industry, archetype, hero,
navigation, typography, palette, layout rhythm, geometry, image treatment, motion, section order,
CTA treatment, proof treatment, component dialect.

Compare this Site DNA against recently generated websites.

A new site must differ from recent sites on at least six major visual dimensions.

Never reuse the combination of hero architecture, section sequence, typography classification and
geometry system on consecutive websites.

### Variation must be bounded

Do not randomly apply styles inappropriate to an industry merely to create differentiation.

A law firm may vary between institutional editorial, modern minimal and cinematic prestige.
A home-services business may vary between industrial utility, premium residential and blue-collar
modern. A medical practice may vary between clinical modern, family approachable and boutique
specialist. A restaurant may vary between fine-dining editorial, neighborhood warm and
contemporary culinary. A fitness business may vary between athletic kinetic, boutique editorial
and wellness minimal.

Each industry should maintain multiple appropriate visual archetypes.

### Component rule

Component libraries are ingredient sources, not templates.

Behavior may come from shadcn, Preline, Origin UI, HyperUI, Magic UI, Cult UI, Kokonut UI or
another approved library.

Visual styling must be transformed according to the selected Site DNA.

### Industry conversion rule

Design the information architecture around how customers actually select that type of business.

- Home services prioritize calling, quote requests, service availability, reviews, warranties and service areas.
- Law prioritizes consultation, practice areas, attorneys, evidence of experience and locations.
- Medical prioritizes appointments, providers, conditions/services, insurance and patient information.
- Real estate prioritizes search, properties, neighborhoods, agents and tours.
- Restaurants prioritize menu, reservations or ordering, food imagery, hours and location.
- Hospitality prioritizes availability, rooms, amenities, location and imagery.
- Beauty prioritizes services, pricing, portfolio/results and booking.
- Fitness prioritizes introductory offers, schedule, classes, coaches and membership.
- SaaS prioritizes product demonstration, use cases, integrations, social proof and pricing.
- Ecommerce prioritizes product discovery, product information and frictionless purchasing rather than decorative landing-page effects.
- Nonprofits prioritize mission, impact, programs, stories and donation/volunteering.

### Portfolio rule

Photography, architecture, interiors and creative companies should not inherit SaaS card layouts.
Let imagery, typography and negative space become the interface.

### Trust rule

Industries involving health, law, finance, home access or substantial financial decisions should
favor clarity, legitimacy and evidence over novelty.

### Motion rule

Motion intensity must be industry appropriate. Medical, legal and finance generally receive
restrained motion. Creative, hospitality, sports and technology may receive more expressive
motion. Motion must never delay access to information or primary conversion actions.

### Content rule

Never fabricate awards, ratings, testimonials, case results, certifications, years in business,
customer counts or statistics.

### SEO rule

Local businesses receive location/service architecture and the most specific applicable schema
type.

### Performance rule

Target Core Web Vitals of LCP <= 2.5 seconds, INP <= 200 milliseconds and CLS <= 0.1.

### Accessibility rule

Maintain keyboard usability, visible focus states, appropriate target sizes, semantic markup and
WCAG-compliant contrast.

### Final design review

Before marking a site complete, compare it visually against the previous generated sites. If it
could plausibly be mistaken for the same template with a different logo, industry or color
palette, redesign it.

## Component dialect example, as given

```
componentDialect: editorial-luxury

Allowed:
- shadcn Dialog behavior
- shadcn Form behavior
- custom typography
- custom button treatment
- custom card treatment
- custom header
- custom section compositions

Forbidden:
- default shadcn card appearance
- generic SaaS bento grids
- gradient blobs
- pill buttons everywhere
```

## Folder structure, as given

```
/design-intelligence
    /industries
        law.json dental.json hvac.json roofing.json construction.json real-estate.json
        restaurant.json hotel.json spa.json pilates.json gym.json finance.json nonprofit.json
        education.json automotive.json ecommerce.json saas.json
    /archetypes
        editorial.json cinematic.json industrial.json clinical.json luxury.json kinetic.json
        documentary.json technical.json boutique.json
    /components
        editorial/ industrial/ luxury/ utility/ clinical/ ecommerce/ kinetic/
    /references
    /site-dna-history
```

Our lead categories also need profiles the list does not name (plumbing, electrical and other home
services, barbers and beauty, tattoo, pet grooming, landscaping and other contractors). They are
added alongside, and every category in `config/categories.json` maps to exactly one profile.

## Site DNA example, as given (roofing)

```
Industry: Roofing
Business type: Local service
Primary conversion: Call / estimate
Brand position: Established practical contractor

Archetype: Premium Residential
Hero: Split photographic
Typography: Heavy grotesk + neutral sans
Palette: Warm off-white / charcoal / construction orange
Geometry: 4px radius
Motion: Subtle
Photography: Large real project imagery
Navigation: Utility bar + conventional nav
Primary CTA: Request Estimate
Secondary CTA: Call Now

Required proof: Google rating, service areas, warranty, licenses, project gallery

Forbidden: SaaS bento, neon gradient, glassmorphism, rounded pill cards, cinematic 3D
```

Applied to our content rules: the Google rating comes from the lead record; service areas only as
the recorded city and metro unless more is sourced; warranty and licenses render as labelled slots
("Warranty details: to confirm with the owner") unless the lead record sources them; the project
gallery uses licensed stock photos captioned as placeholders for the owner's own projects; "Large
real project imagery" means the layout is built for the owner's real photos and ships with stock
stand-ins until they are supplied. "Established" is a brand position, never a claim of years.
