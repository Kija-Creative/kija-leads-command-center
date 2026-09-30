# Design Intelligence Engine: consolidated specification (v2)

Supplied by Jamey White on 2026-09-29. This is the consolidated, binding version. Where it differs
from `IMPLEMENTATION-BRIEF.md` (v1), this version wins. Every enumeration, rule, archetype name,
section architecture and test below is Jamey's; repetitive prose is condensed, nothing is dropped.
The project's content rule applies on top: never state a fact about a real business that is not in
its lead record.

## Goal

Implement (not plan, not document only) a permanent multi-industry website Design Intelligence
Engine inside the Lead Command Center. Generated sites must not look like the same AI template:
not the same hero with a different image, three cards, centered headline, rounded rectangles,
navbar, CTA layout, testimonials, footer, font type, section order, bento layout, visual rhythm or
shadcn look with only colors, logos and copy changed. A roofer must not look like a dentist, a
dentist not like a law firm, a law firm not like a Pilates studio, a Pilates studio not like a SaaS
startup, a restaurant not like a manufacturer, and two roofing companies must not automatically
look alike either. The system creates deliberate, bounded, industry appropriate visual diversity:
websites that feel custom designed. We reuse engineering, not finished designs. The application
behaves like a design director selecting a visual language before the coding agent begins. No
directory of one hard coded template per industry.

## References

Research input, not dependencies: waseemnasir2k26/skynet-site-system (multi industry rules, niche
design systems, tokens, conversion patterns, anti-patterns, agent instructions; do not force its
structure) and veryCoolTimo/design-playbooks-skill (playbooks from hundreds of real sites; style
families, page types, patterns). Component and pattern references: shadcn-ui/ui, htmlstreamofficial/preline,
shadcn/originui, markmead/hyperui, magicuidesign/magicui, nolly-studio/cult-ui, kokonut-labs/kokonutui.
Do not install them all as dependencies; use packages only when beneficial; the engine must not
depend on any one library. Clone the two primary repos into `.design-references/` (gitignored); if
cloning fails, continue. Before copying source code from any reference, check its license; prefer
ideas, architecture, patterns, token concepts, layout strategies and permitted components; avoid
copying large chunks.

## Inspect first

Determine framework, language, routing, frontend and backend frameworks, database, ORM, lead
schema, website generation schema, AI model integration, prompt building, prospect workflow,
preview system, admin UI, directory structure, TypeScript conventions, tests, linting, build
tooling. Integrate into the existing architecture; do not replace what works. Keep the engine
strongly typed if TypeScript. Use existing database storage if appropriate, otherwise a clean
persistence layer that can later migrate to a database.

## Architecture (equivalent is fine)

```
docs/site-generation/  SITE-DNA.md  INDUSTRY-RULES.md  DESIGN-PRINCIPLES.md  REFERENCE-LIBRARIES.md
src/design-intelligence/
  schema.ts
  industries/ index.ts roofing.ts home-services.ts hvac.ts plumbing.ts electrical.ts construction.ts
    law.ts medical.ts dental.ts finance.ts accounting.ts insurance.ts real-estate.ts restaurant.ts
    hospitality.ts beauty-spa.ts barbershop.ts pilates-wellness.ts gym-fitness.ts saas-technology.ts
    ecommerce.ts nonprofit.ts education.ts architecture-interiors.ts industrial-manufacturing.ts
    automotive.ts photography-creative.ts
  archetypes.ts component-dialects.ts seed.ts select-archetype.ts select-site-dna.ts variation.ts
  history.ts prompt-builder.ts audit.ts index.ts
```

Every generated site gets a Site DNA fingerprint BEFORE frontend generation.

## SiteDNA (strongly typed)

Required: version, leadId, businessName, industry, subIndustry, archetype, brandTraits,
primaryConversion, hero, navigation, typography, paletteFamily, layoutRhythm, geometry, imagery,
motion, sectionOrder, ctaStyle, proofStyle, componentDialect, requiredModules, forbiddenPatterns,
referencesUsed, seed, variationScore, createdAt, locked.

Optional where useful: headerBehavior, footerStyle, backgroundTreatment, buttonTreatment,
cardTreatment, imageShape, iconStyle, spacingDensity, contentDensity, storytellingMode,
mobilePriority, localBusinessStrategy, seoStrategy, schemaType, trustSignals, conversionSecondary.

Controlled values:
- HERO: full-bleed, editorial-split, centered, search-first, cinematic, asymmetric, product-demo, utility, type-led, gallery, project-led, image-left, image-right, layered, minimal-copy, conversion-form, split-screen
- NAVIGATION: transparent-overlay, solid, two-tier, utility-bar, minimal, editorial, mega-menu, sidebar, floating, centered-brand, conversion-heavy
- TYPOGRAPHY: serif-sans, sans-only, condensed-sans, editorial-serif, humanist-sans, grotesk, geometric, mono-accent, high-contrast-serif, industrial-condensed, neo-grotesk, warm-serif
- LAYOUT RHYTHM: editorial, dense-grid, wide-cinematic, alternating, modular, asymmetric, gallery, technical, narrative, conversion-heavy, catalog, magazine, portfolio, documentary
- GEOMETRY: square, subtle-radius, rounded, pill, mixed, architectural, hard-edge, organic, editorial
- IMAGERY: full-bleed, documentary, project-gallery, product-ui, portfolio, cutout, technical, editorial, lifestyle, macro-detail, collage, before-after, people-first, environment-first, material-detail
- MOTION: none, subtle, moderate, kinetic, cinematic
- COMPONENT DIALECT: utility, editorial, clinical, luxury, industrial, technical, boutique, kinetic, commerce, portfolio, institutional, minimal, warm-local, architectural, documentary, performance

## Industries (initial support, at least)

home-services, roofing, hvac, plumbing, electrical, construction, law, medical, dental, finance,
accounting, insurance, real-estate, restaurant, hospitality, beauty-spa, barbershop,
pilates-wellness, gym-fitness, saas-technology, ecommerce, nonprofit, education,
architecture-interiors, industrial-manufacturing, automotive, photography-creative.
Adding an industry later primarily means adding a profile; the selection engine is not rewritten.

IndustryProfile: id, label, primaryConversions, requiredModules, preferredTrustSignals,
defaultForbiddenPatterns, archetypes.
Archetype: id, label, description, suitableBrandTraits, heroes, navigation, typography,
layoutRhythms, geometries, imagery, motion, paletteFamilies, ctaStyles, proofStyles,
componentDialects, sectionOrders, requiredModules, forbiddenPatterns.
Never one look per industry: at least THREE strong archetypes for important industries.

### Archetypes by industry

- ROOFING / HOME SERVICES
  1. Industrial Utility. Traits: established, practical, reliable, commercial, working-class, direct. Strong sans or condensed type, square or subtle-radius geometry, high contrast, project imagery, crews, equipment, straightforward hierarchy, obvious phone and estimate CTA, little decorative animation. Palettes: steel + safety orange, navy + white, charcoal + amber, black + industrial red.
  2. Premium Residential. Traits: premium, craftsmanship, architectural, high-end residential, detail-oriented. Large architectural photography, warmer neutrals, more whitespace, editorial layouts, sophisticated type, material details, craftsmanship storytelling, restrained motion. Palettes: cream + charcoal, stone + bronze, warm white + copper, deep green + limestone.
  3. Blue-Collar Modern. Traits: local, hardworking, family-owned, energetic, straightforward. Bold type, crew photography, job-site imagery, high contrast, strong local personality, collage or before/after layouts, strong conversion actions. Palettes: black + safety yellow, navy + red, charcoal + orange.
- LAW: Institutional Editorial, Modern Minimal, Cinematic Prestige. Prioritize consultation, practice areas, attorney credibility, relevant experience, process, locations, FAQ. Avoid generic SaaS design, playful startup visuals, overly rounded interfaces, unnecessary animation.
- DENTAL: Clinical Modern, Warm Family, Boutique Cosmetic. Prioritize booking, services, dentists/team, comfort, technology where relevant, insurance, financing, reviews, first visit.
- MEDICAL: Clinical Authority, Human / Family Care, Boutique Specialist. Prioritize appointment, providers, conditions, services, insurance, patient information, locations, FAQ. Restrained motion; clarity and trust beat novelty.
- RESTAURANT: Fine Dining Editorial, Neighborhood Warm, Contemporary Culinary. Prioritize menu, reservation, ordering where relevant, food, chef/story, location, hours, gallery. Avoid generic SaaS feature cards.
- PILATES / WELLNESS: Boutique Editorial, Organic Minimal, Modern Performance. Prioritize intro offer, methodology, classes, schedule, instructors, memberships, studio, community. Boutique Pilates must NOT automatically look like a gym.
- GYM / FITNESS: Athletic Kinetic, Industrial Training, Premium Performance. Prioritize trial, schedule, programs, coaches, membership, results, community. More motion allowed than legal or medical.
- REAL ESTATE: Luxury Editorial, Modern Brokerage, Neighborhood Lifestyle. Prioritize property search, featured listings, neighborhoods, agents, valuation, tour/contact. Photography is extremely important.
- SAAS / TECHNOLOGY: Product Minimal, Technical Dark, Expressive Innovation. Prioritize product understanding, demo, screenshots, use cases, integrations, proof, pricing, signup. One of the few industries where product UI, bento layouts, gradients and AI era patterns may sometimes fit, never by blind default.
- BEAUTY / SPA: Editorial Luxury, Organic Wellness, Contemporary Beauty. Prioritize booking, treatments, pricing, results, team, reviews. Use material, skin, environment and product imagery intelligently.
- FINANCE: Institutional Precision, Private Wealth, Modern Fintech. Prioritize credibility, services, process, expertise, resources, consultation. Avoid gimmicks.
- CONSTRUCTION: Industrial Capability, Architectural Premium, Field-Proven Contractor. Prioritize capabilities, projects, services, credentials, process, equipment, RFQ/contact.
- HOSPITALITY: Cinematic Luxury, Boutique Editorial, Destination Lifestyle. Prioritize availability, rooms, amenities, experiences, gallery, location, booking.
- NONPROFIT: Documentary Human, Institutional Trust, Grassroots Energy. Prioritize mission, impact, programs, stories, volunteer, donate, transparency.
- ARCHITECTURE / INTERIORS: Gallery Minimal, Editorial Architectural, Material Experimental. Prioritize work, projects, philosophy, services, studio, contact. Portfolio and photography dominate; avoid SaaS layouts.
- INDUSTRIAL / MANUFACTURING: Technical Capability, Industrial Authority, Engineering Modern. Prioritize capabilities, industries served, equipment, process, certifications, projects, RFQ.
- AUTOMOTIVE: suitable archetypes such as Performance Dark, Premium Dealership, Utility Automotive. Prioritize by business type: inventory, service, financing, trade-in, appointments, vehicle details, contact.
- PHOTOGRAPHY / CREATIVE: Portfolio Minimal, Editorial Art Direction, Bold Experimental. Prioritize work, projects, services, about, inquiry. Imagery becomes the interface.
- All remaining industries get equivalent multi-archetype systems.

## Bounded variation

INDUSTRY → BUSINESS TYPE → VERIFIED BUSINESS ATTRIBUTES → BRAND TRAITS → PRIMARY CONVERSION →
APPROPRIATE ARCHETYPES → SITE DNA → VARIATION CHECK → FRONTEND GENERATION. Suitability first;
variation only inside appropriate choices. A conservative accounting firm never gets brutalism
because the last accounting firm was traditional.

Traits come from verified lead information only (established, premium, local, family-owned,
modern, traditional, technical, community-oriented, high-energy, luxury, clinical, approachable,
architectural, industrial, craftsmanship, youthful, specialist, boutique, commercial, residential,
performance, minimal, creative). Never hallucinate traits; with too little information use
conservative industry defaults.

## Deterministic seed

No uncontrolled Math.random() for design decisions. Seed from stable lead data, for example
`${leadId}:${businessName}:${domain}:${industry}`, hashed with FNV-1a (hashString, seededIndex,
seededPick as supplied). The seed only chooses among already valid options and never overrides
suitability; regenerating the same lead generally gives the same direction.

## Persistence and history

Persist every generated Site DNA; keep at least the previous 50; queryable by all sites,
industry and archetype. Use the database if appropriate, otherwise a simple repository or storage
abstraction. The comparison engine must NOT be tightly coupled to a JSON file.

## Measurable difference

Never just tell the AI "make this different". Compare the candidate against recent DNA on
archetype, hero, navigation, typography, paletteFamily, layoutRhythm, geometry, imagery, motion,
sectionOrder, ctaStyle, proofStyle, componentDialect (optionally headerBehavior, buttonTreatment,
cardTreatment, backgroundTreatment, spacingDensity, contentDensity). A new site differs from recent
sites on at least SIX meaningful dimensions (tiny cosmetic differences do not count). Hard rule:
two consecutive sites may never share ALL FOUR of hero architecture, section order architecture,
typography classification and geometry system; if all four match the candidate fails. Return
valid, differenceCount, differenceRatio, matchingDimensions, differingDimensions,
cloneSignatureConflict.

When a candidate fails, in this order: 1 another appropriate archetype, 2 hero architecture,
3 typography classification, 4 recompose section order, 5 layout rhythm, 6 geometry, 7 imagery
strategy, 8 component dialect, 9 navigation architecture. Never solve similarity by palette alone.
Compare against recent global sites but give extra attention to recent sites in the same industry
(a new roofing site is strongly compared against the last few roofing sites).

## Conversion architecture (no universal Hero, Logo Strip, Features, Three Cards, Testimonials, CTA, FAQ)

- HOME SERVICES / ROOFING / HVAC / PLUMBING / ELECTRICAL: phone, estimate, emergency availability where relevant, services, service area, reviews, warranty, financing, projects, credentials, process. Architectures: Hero, Immediate CTA, Trust/Rating, Services, Projects, Why Us, Process, Reviews, Service Area, Warranty, Estimate; or Hero, Services, Emergency/Availability, Before After, Crew, Credentials, Reviews, Financing, Service Area, Contact.
- LAW: Hero, Consultation, Practice Areas, Attorneys, Experience/Relevant Proof, Process, Testimonials if verified, Locations, FAQ, Consultation CTA.
- MEDICAL: Hero, Appointment, Services/Conditions, Providers, Patient Experience, Insurance, Locations, Patient Resources, FAQ, Appointment CTA.
- DENTAL: Hero, Book, Services, Dentist/Team, Technology/Comfort, New Patient, Insurance/Financing, Reviews, Location, Booking.
- REAL ESTATE: Hero/Property Search, Featured Properties, Neighborhoods, Agent/Brokerage, Lifestyle/Community, Seller Valuation, Testimonials, Tour/Contact.
- RESTAURANT: Hero, Reservation/Order, Menu Highlights, Food Imagery, Story/Chef, Environment, Reviews if verified, Hours, Location, Reservation.
- HOTEL: Hero, Availability, Rooms, Amenities, Experiences, Gallery, Location, Reviews, Booking.
- BEAUTY / SPA: Hero, Book, Treatments, Results, Pricing, Experience, Team, Reviews, Location, Booking.
- PILATES / WELLNESS: Hero, Intro Offer, Methodology, Classes, Studio, Schedule, Instructors, Membership, Community, CTA.
- GYM / FITNESS: Hero, Trial, Programs, Results, Schedule, Coaches, Facility, Membership, Testimonials, Join.
- SAAS: Hero, Product Demonstration, Problems/Use Cases, Product Features, Screenshots, Integrations, Customer Proof, Pricing, FAQ, Signup/Demo.
- ECOMMERCE: Discovery, Categories, Products, Product Details, Merchandising, Reviews, Cart, Checkout (do not randomize checkout UX).
- NONPROFIT: Mission, Impact, Programs, Stories, Current Initiatives, Volunteer, Donate, Transparency, Contact.
- ARCHITECTURE / CREATIVE: Work, Selected Projects, Project Details, Philosophy, Services, Studio, Process, Contact.
- INDUSTRIAL / MANUFACTURING: Capabilities, Industries, Equipment, Process, Certifications, Projects, Technical Information, RFQ.

## Component dialects

Shared functionality expressed differently per Site DNA:
- UTILITY: clear, direct, high conversion, minimal decoration (many home services)
- EDITORIAL: typographic hierarchy, whitespace, image led compositions, asymmetry where appropriate (architecture, hospitality, luxury, law)
- CLINICAL: clarity, accessibility, soft restraint, calm hierarchy (medical, dental)
- LUXURY: space, materiality, large imagery, restrained interface, premium typography
- INDUSTRIAL: harder geometry, bold hierarchy, technical credibility, equipment and capability imagery
- TECHNICAL: grids, specification like structure, diagrams, data, engineering presentation
- BOUTIQUE: refined type, warm spacing, human imagery, small business personality
- KINETIC: movement, high energy hierarchy, motion, bold type
- COMMERCE: product first, transactional clarity, filtering, categories, product modules
- PORTFOLIO: minimal chrome, projects dominate, image forward
- INSTITUTIONAL: authority, clear hierarchy, formal trust, restrained expression
- MINIMAL: extreme clarity, reduced decoration, spacing and type do the work
- plus warm-local, architectural, documentary, performance

Library roles: shadcn/ui for forms, dialogs, sheets, accessible primitives, menus, interaction;
Preline for alternate blocks, navigation, forms, marketing structures; Origin UI for alternate
compositions; HyperUI for marketing, commerce and service business structures; Magic UI for
motion, technology and creative experiences; Cult UI for expressive or experimental UI; KokonutUI
for contemporary alternates. Restyle to the Site DNA; never let a library's default appearance
take over.

## Anti-template defaults

Not globally banned, banned as unthoughtful defaults: Inter everywhere, purple to blue gradients,
glowing blurred blobs, glassmorphism, three feature cards, generic bento grids, pill buttons
everywhere, 20px radius everywhere, floating dashboard mockups, a centered hero every time, small
eyebrow plus huge centered headline every time, identical navbars, identical testimonials, logo
strips for businesses with no legitimate logos, generic icon grids, fake numerical statistics,
the same section rhythm, footer architecture, card component, pricing card style, alternating
left right sections and FAQ placement.

## Typography

Typography materially contributes to identity; never just swap similar geometric sans fonts.
Combinations: editorial serif + grotesk, condensed display + humanist sans, single neo-grotesk,
high contrast serif + restrained sans, technical grotesk + mono accent, warm serif + humanist sans,
industrial condensed + neutral sans, fashion like serif + clean grotesk. Avoid loading many
families; keep performance.

## Palette families (semantic, each with multiple actual palettes)

steel-safety, navy-industrial, charcoal-construction, warm-architectural, cream-copper,
clinical-blue, clinical-green, family-dental, cosmetic-neutral, legal-navy, legal-oxblood,
legal-stone, private-wealth, fintech-modern, restaurant-dark-editorial,
restaurant-warm-neighborhood, wellness-natural, pilates-stone, fitness-dark-performance,
luxury-hospitality, nonprofit-documentary, technical-manufacturing. Sites sharing a family need not
share identical colors.

## Imagery (part of Site DNA)

Roofing: real roofs, crews, materials, details, before/after, job sites, architecture. Medical:
providers, facilities, human care, real environment, patients only where appropriate and
authorized. Dental: team, office, treatment environment, human warmth, technology. Restaurant:
food macro, ingredients, chef, interior, service, atmosphere. Architecture: projects dominate,
materials, details, drawings. Pilates: human movement, reformers, studio, alignment, materials,
community. Gym: training, movement, equipment, facility, coaches. Industrial: equipment, process,
fabrication, plant, technical details, workers. Law: people, office, local context, city,
restrained conceptual imagery. Real estate: properties, neighborhood, architecture, lifestyle,
agent. Beauty: skin, treatment, studio, materials, products, human detail. Never fabricate imagery
of the actual business; concept imagery is structured so it is never presented as documented
reality.

## Truthfulness

Never fabricate testimonials, reviews, ratings, customer counts, years in business, awards,
licenses, certifications, legal, medical or financial outcomes, project counts, media mentions,
partner or brand logos, Google ratings, BBB accreditation, "trusted by 10,000 customers", "25
years experience" or similar unless verified. Missing information: neutral placeholder, omit the
module, or mark it as needing verified content.

Trust signals by industry: home services (real projects, verified Google ratings, verified
licenses, warranty, service area, financing, crew, certifications); law (attorneys, education, bar
admissions, practice experience, case experience only if verified, consultation structure);
medical (providers, credentials, insurance, verified hospital affiliation, patient process,
locations); finance (credentials, process, regulatory disclosures, team, services, education);
restaurant (food, menu, chef, verified reviews, verified press, location); Pilates (instructors,
methodology, studio, schedule, community, class descriptions).

## Performance, accessibility, local SEO

Avoid huge unoptimized hero media, needless animation libraries, large dependency chains, layout
shift, overloaded JS and needless client components; optimize and lazy load images; mobile first.
Accessibility: semantic markup, keyboard access, visible focus, target sizes, contrast, form
labels, alt text strategy, screen reader appropriate navigation, reduced motion, usable mobile.
Local businesses: service areas, locations, NAP, localized content, proper headings, metadata,
structured data with the most specific schema type (not LocalBusiness for everything); never
fabricate facts for SEO.

## Selection engine

selectSiteDNA(lead, history): classify industry; determine primary conversion; derive verified
brand traits; load the profile; score appropriate archetypes; select the best archetype with
deterministic variation; select valid hero, navigation, typography, palette family, layout rhythm,
geometry, imagery, motion, section architecture, CTA style, proof style, component dialect; build
the candidate; compare against recent history; if too similar, try alternate valid combinations;
return approved DNA. Archetype scoring uses industry suitability, business type, brand traits,
primary conversion, available imagery, verified characteristics, recent design history (a recent
similarity penalty) and seed based variation; recent similarity influences selection but never
lets an inappropriate design win.

## Locking and regeneration

A human approval sets locked = true. Regeneration then preserves archetype, typography, palette
family, layout rhythm, geometry, hero architecture, section architecture and component dialect
unless intentionally unlocked; copy and content may still evolve. "Regenerate DNA" is not full
randomization: it preserves verified facts, industry and conversion objective, chooses another
valid archetype or combination, avoids recent similarity and stays deterministic when appropriate.
An optional "explore another direction" intentionally uses a different appropriate archetype.

## Prompt builder

Converts lead data, verified facts, industry profile, selected archetype, Site DNA, available
assets and conversion objective into a detailed brief, never "make a beautiful roofing site".
Example shape: BUSINESS, INDUSTRY, ARCHETYPE, PRIMARY CONVERSION, BRAND TRAITS, DESIGN LANGUAGE,
HERO, TYPOGRAPHY, LAYOUT, GEOMETRY, IMAGERY, MOTION, PALETTE, COMPONENT DIALECT, SECTION ORDER,
REQUIRED, AVOID. The brief states that Site DNA is the visual authority; the building agent may
not silently ignore it. Persist DNA before generation. After generation, audit against the DNA.

## UI

Show industry, subindustry, archetype, brand traits, primary conversion, Site DNA summary,
variation score, design references, lock status. Actions: Generate DNA, Regenerate DNA, Lock DNA,
Unlock DNA, Generate Website; potentially Change Archetype, Override Palette Family, Override
Typography, Override Hero, Override Layout Rhythm, and Explore another direction. Humans direct the
system; no black box.

## Section types, backgrounds, mobile

Final sites are assembled from Site DNA and reusable primitives, never rigid templates
(no roofer-template.tsx and the like, except as loose compositional helpers). Reusable section
types where beneficial: HeroFullBleed, HeroEditorialSplit, HeroUtility, HeroSearch, ProjectGallery,
BeforeAfter, ServiceGrid, ServiceEditorialList, TeamEditorial, TeamGrid, ReviewCarousel,
ReviewEditorial, ProcessTimeline, ProcessHorizontal, CTAFullBleed, CTASplit, AppointmentPanel,
EstimatePanel, NeighborhoodGrid, PropertySearch, MenuEditorial, ClassSchedule, InstructorProfiles,
CapabilityGrid, TechnicalSpecifications; each accepts Site DNA and dialect styling and is never
visually fixed. No white, gray, white, gray alternation: archetypes control full bleed imagery,
continuous editorial backgrounds, border separated sections, dark sections, tonal shifts, material
textures, oversized typographic sections, split image sections, gallery sequences, dense technical
grids, minimal whitespace layouts. Site DNA survives mobile: mobile CTA priority, strong hierarchy,
no heading overflow, simplified animation, preserved identity, usable navigation.

## Automatic design audit

Before a site is complete: used Site DNA; too similar to recent sites; correct industry
architecture; required modules present; forbidden patterns dominating; typography, hero, geometry
and imagery match DNA; section order approximately follows DNA; primary CTA obvious; looks like an
unmodified shadcn or Tailwind demo; fabricated trust information; responsive behavior;
accessibility basics; resembles the template of another recent business. Return pass, warnings,
failures, similarity issues, required fixes. Architect for later screenshot based visual
similarity (page screenshot, visual embedding or image hash, compare with previous sites, flag very
similar layouts); not required now unless screenshot infrastructure exists.

## Tests (at minimum)

1 same lead produces stable DNA; 2 industry restrictions (a medical practice never selects an
inappropriate high motion kinetic archetype unless explicitly permitted); 3 variation (fewer than
six meaningful differences fails); 4 hard clone rule (same hero + typography + geometry + section
order fails against the previous site); 5 locked DNA survives regeneration; 6 recent same industry
sites influence diversity; 7 truthfulness (prompt generation never invents unavailable trust
signals); 8 prompt builder contains Site DNA, required modules and forbidden patterns; 9 adding an
industry profile does not require changing the selection engine.

## Documentation and agent files

SITE-DNA.md (what it is, selection, locking, regeneration), INDUSTRY-RULES.md (profiles,
archetypes, conversion architecture), DESIGN-PRINCIPLES.md (bounded variation, anti-template rules,
dialects, truthfulness), REFERENCE-LIBRARIES.md (which repos, dependency or reference only, license
notes). Update AGENTS.md and CLAUDE.md carefully with the permanent rules.

## Phases

1 inspect; 2 schema; 3 industry profiles and archetypes; 4 deterministic seed; 5 selection engine;
6 variation and clone prevention; 7 persistence and history; 8 prompt builder; 9 connect to the
generation workflow; 10 admin UI; 11 quality audit; 12 tests; 13 lint, tests, typecheck and build;
14 fix errors caused by the changes. Do not stop after one phase. Only surface a true blocker.
Keep it understandable: industry profiles + archetype scoring + deterministic selection + Site
DNA + history comparison + prompt builder + audit; no massive class hierarchies, plugin systems,
distributed services, unneeded dependencies or orchestration frameworks.

## Demonstration

Three FAKE leads: DEMO 1 a premium residential roofing company; DEMO 2 a family-owned local
roofing company; DEMO 3 a boutique Pilates studio. Generate Site DNA for all three; the two roofers
differ on at least six meaningful dimensions; Pilates differs substantially from both. For each
show industry, archetype, brand traits, primary conversion, hero, navigation, typography, palette
family, layout rhythm, geometry, imagery, motion, section order, CTA style, proof style, component
dialect and the variation result, then the frontend generation brief from the prompt builder.
Reference directions given: Roofer 1 Premium Residential (full-bleed, transparent-overlay,
serif-sans, warm-architectural, editorial, architectural, project-gallery, subtle,
project-estimate, project-story, editorial; Hero, Projects, Craftsmanship, Services, Materials,
Process, Warranty, Reviews if verified, Estimate). Roofer 2 Blue-Collar Modern (type-led split,
utility-bar, condensed-sans, charcoal-orange, modular/asymmetric, square, documentary/before-after,
moderate, call-now/bold-estimate, crew-led + reviews, utility/industrial; Hero, Rating/Trust,
Services, Crew, Before/After, Process, Reviews, Service Area, Estimate). Pilates Boutique Editorial
(asymmetric, minimal, warm-serif + humanist-sans, stone/warm-neutral, editorial/narrative,
subtle-radius, lifestyle/movement/studio, subtle, intro-offer, instructor/studio/methodology,
boutique; Hero, Intro Offer, Methodology, Studio, Classes, Instructors, Schedule, Membership,
Community, Book).

## Final report (no giant essay)

1 what you built; 2 files and areas changed; 3 how Site DNA works; 4 how to add a new industry;
5 how to generate, regenerate and lock DNA; 6 how website generation now uses DNA; 7 demo outputs
for the two roofers and the Pilates studio; 8 test and build results; 9 real limitations or
follow up items.

If a generated site could reasonably be described as "the same template with different colors and
content", the system has failed. The objective: appropriate, intentional, conversion aware,
industry specific, brand specific, visually distinct website generation.
