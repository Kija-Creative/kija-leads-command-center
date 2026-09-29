# Design brief: home services and contractors

Researched 2026-09-29 for the demo generator (`src/demo/templates/home-services.js`, `src/demo/templates/contractor.js`, `src/demo/templates/general.js`). Covers category keys `hvac`, `plumbing`, `electrical`, `septic`, `garage-door`, `restoration`, `appliance-repair`, `pest-control` (vertical `home-services`) and `roofing`, `concrete`, `fencing`, `pools`, `landscaping`, `painting`, `foundation-repair`, `remodeling`, `tree-service` (vertical `contractor`), plus `general`.

Why this exists: Jamey reviewed the generated demos and found they all look the same (one template per vertical, only the palette changes). This brief describes what strong real sites in these fields have in common and proposes nine directions (five home services, four contractor) that differ in layout, type and color. We model conventions, never a specific site: another company's copy, photos, logos, names and distinctive trade dress stay theirs. No em or en dashes are used in this file.

## How the references were read

Each site's homepage HTML and linked CSS were downloaded and parsed for `@font-face` and `font-family` declarations, hex color frequency, CSS custom properties, heading order and button labels. Hero and section order were then confirmed with a page read. Nothing was submitted, signed into or contacted. Fonts marked "custom" or "Typekit" are licensed faces; the directions below only use Google Fonts that play a similar role.

## References

| # | Site | Field | Why it is strong | Type (measured) | Color (measured) |
|---|---|---|---|---|---|
| 1 | [Klindworth Roofing](https://klindworthroofing.com/) | Roofing, The Woodlands TX | Awwwards Honorable Mention (April 2024, by Fhoke). Reads like an architecture studio, not a roofer: all black sections, one big serif line per section, projects named by client surname | Larken (serif display, Typekit) + Satoshi | #24262b charcoal, #ac9376 warm tan, #ede9e2 bone band, #e6c152 gold stars |
| 2 | [Cedar Springs Landscapes](https://cedarsprings.net/) | Landscaping, Oakville ON | Listed in the Awwwards landscaping gallery. Projects get evocative lowercase names with location, budget and timeline; one CTA ("Start Your Backyard Resort") repeated | ITC Blair (wide caps) + Akzidenz Grotesk Next Extended and Pro + Epilogue | #212123 near black, #606065 gray, white; photography carries all color |
| 3 | [Fixed Today](https://fixedtoday.com.au/) | Plumbing, Sydney | Listed in the Awwwards plumbing gallery. Problem first: a picker asks which problem you have (blocked drains, hot water, leaks, burst pipes, toilets, gas, emergency) before anything else, then explains the visit step by step and what to do while you wait | Geist throughout | #0e1820 ink, #047857 green, #e6b800 yellow, #ee3623 red, lots of white |
| 4 | [Jetson Home](https://www.jetsonhome.com/) | HVAC (heat pumps) | Direct to consumer HVAC that feels like a product launch: illustrated house in the hero, one CTA ("Get an Instant Price") repeated, three step process, a comparison table | mnkyJane (custom rounded grotesk) | #fbfaf1 cream, #113823 and #0f1f0d deep greens, #3cd567 green, #ff3737 red |
| 5 | [Quilt](https://www.quilt.com/) | HVAC (heat pumps) | Warm, calm, domestic. Design tokens name "heat" and "cool" colors explicitly, a serif and sans pair from the same family, room by room framing | Quilt Sans + Quilt Serif (custom) | #fef9f3 page, #1d1b1b brand ink, #ff8368 heat, #2293a1 cool, #d8f4f7 and #fff3d2 tints |
| 6 | [Morris-Jenkins](https://www.morrisjenkins.com/) | HVAC and plumbing, Charlotte NC | Best in class example of the classic local service brand: navy and yellow livery, heavy caps headings, service tiles, "Call or Schedule Online" band, phone repeated | Montserrat ExtraBold + Open Sans | #14377d navy, #ffcd00 yellow, #e7ecf2 cool gray |
| 7 | [Pestie](https://pestie.com/) | Pest control | Refuses to look like pest control: editorial serif, friendly real life photos, a pest library as a grid of illustrated icons on tinted tiles, comparison with traditional service | Tiempos Headline + Neue Haas Unica (Typekit) | #00bc88 mint, #004c40 deep teal, #ff8660 coral, #f7f6f1 paper |
| 8 | [Yardzen](https://yardzen.com/) | Landscape design and build | Outdoor lifestyle carousel hero, packages, before and after, quiz CTA ("Take Our Quiz"), comparison table | Arsenal + Roboto + Roboto Mono | #3b482f olive, #626e58 sage, #d6f18b lime, #bfc2aa stone |
| 9 | [One Nation Exteriors](https://www.onenationexteriors.com/) | Roofing, Twin Cities MN | Hook Agency's showcase of the conversion formula: friendly local headline, inspection request in the hero, neighbors reviews, a named five step process | Rubik + Overpass | #df0101 red, #103264 and #011752 navy |
| 10 | [SavATree](https://www.savatree.com/) | Tree, shrub and lawn care | Warm naturalist tone, green on parchment, local arborist profiles, "Request a Consultation" repeated | Perfectly Nineties (serif) + F37 Zagma | #1b5c34 forest, #e7e1ce and #f3f0e7 parchment, #e87d34 orange |
| 11 | [Anthony and Sylvan Pools](https://www.anthonysylvan.com/) | Pools | Consultation led: "Book a Consultation", pool building process, image gallery, "Life with a Pool" | Figtree | #112337 deep navy, #6dc3cd aqua, #c4e7eb pale aqua |
| 12 | [Block Renovation](https://www.blockrenovation.com/) | Remodeling | Warm neutral renovation brand: soft greige surfaces, coral accent, "Why homeowners choose", costs and contractors near you | Polar + Fakt (licensed) | #efebe9 greige, #ff7c55 coral, #f7c4b4 blush, #b0a59a stone |

Also read as convention checks (large independents, not directions): [Parker and Sons](https://www.parkerandsons.com/) (Phoenix, blue #004b7a and red CTA #bd2c2c, "Schedule Now" plus phone), [Frank Gay Services](https://www.frankgayservices.com/) (Orlando, co-headline + Plus Jakarta Sans, #003348 and #ff6a39), [Bill Howe](https://www.billhowe.com/) (San Diego, #2e3192 and #ed2124, "Book Now" x6), [Clean Cut Roofing](https://www.cleancutroofing.com/) (Roboto Slab, orange #f89728), [Puetz Construction](https://www.puetzconstruction.com/) (Hook Agency, softened curved shapes, navy #182c53 and red #c01931), [Sweeten](https://sweeten.com/) (Inter, #0d1522 and #0da2f5), and the Neighborly chain template shared by [Mr. Rooter](https://www.mrrooter.com/) and [Rainbow Restoration](https://www.rainbowrestores.com/) (Inter, Tailwind grays, blue #1c64f2).

## What nearly every strong site in the field does

1. **Phone number in the header, always visible, as a real `tel:` link**, next to one primary button ("Schedule Now", "Book Now", "Request a Quote"). The phone is repeated in the hero, a mid page band and the footer. On mobile it becomes a sticky bottom call bar.
2. **Hero states the service and the place in plain words** ("Your Local Plumbers and HVAC Techs", "Friendly Minnesota Roofing Experts"), then a two button pair: call and request. The best add one proof line under the buttons (Google rating and count).
3. **Proof sits directly under the hero**: a rating strip or review band. Weak sites bury it.
4. **Services as a grid of six to nine tiles**, one word or short phrase each (Cooling, Heating, Plumbing, Drains), each with an icon or photo and a link.
5. **"Why choose us" as three to six short points** with icons. Strong sites make these specific; weak sites say "quality, service, value".
6. **A named, numbered process** of three to five steps ("We Make It Easy", "The ONE and Only Way", "What happens during a plumbing visit").
7. **Service area block** with a list of towns and often a simple map.
8. **FAQ accordion** near the bottom.
9. **Final CTA band** that repeats the phone and the request button, then a footer with name, phone, area and hours.
10. Contractors add **projects or a gallery** (named projects on the best sites), **an estimate or inspection request** in or near the hero, and **consultation** language for high ticket work (pools, landscaping, remodeling).

Typical section order, home services: utility bar, header, hero with two CTAs, rating strip, services grid, why choose, process, reviews, service area, FAQ, final CTA, footer.
Typical section order, contractors: header, hero with estimate CTA (or form), proof, services, projects, process, reviews, service area, FAQ, estimate form, footer.

Items that are common but that our demos must leave out unless the lead record carries the fact: membership plans, coupons and promo prices, financing, warranties and guarantees, awards and badges, license and insurance claims, "since 19xx", years in business, staff names and photos, testimonials. The rating strip uses only the sourced `googleRating` and `googleReviews` with "Google reviews" wording, and "why choose" comes from `reviewThemes`.

## Conversion patterns that work

- **Two doors in the hero**: a call button showing the actual number, and a request button. Never more than two primary actions.
- **Problem picker** (Fixed Today): chips for the most common problems (built from `services` or the category's `serviceDefaults`). Picking one prefills the request form and scrolls to it. Works for plumbing, HVAC, electrical, appliance repair, garage door, septic, pest control.
- **Emergency request form**, short: name, phone, ZIP, what is happening (prefilled by the picker), "how urgent" radio. Shows "This is a concept. Nothing was sent." on submit.
- **Inspection or estimate card inside the hero** (One Nation, Puetz): three fields and one button, overlapping the hero image. Best for roofing, fencing, painting, tree service, concrete.
- **Short multi step estimator** (Yardzen quiz): project type, rough size, timing, then contact fields. Best for landscaping, pools, remodeling, painting.
- **Photo upload** on estimate forms ("Add photos of the area"). The input is visual only in the demo.
- **Sticky mobile call bar** with call and request.
- **"What to do while you wait"** (Fixed Today): general safety steps for the emergency categories. These are general guidance, not claims about the business, and must be worded that way.
- **Repeat one CTA label everywhere** (Jetson repeats "Get an Instant Price", SavATree repeats "Request a Consultation"). Pick one verb per demo.

## What makes a site in this field look cheap or generic

- A stock technician in a uniform giving a thumbs up, or a smiling family on a couch. Any stock person implies staff or customers who do not exist.
- Clip art wrench, drop, flame or house logos; Font Awesome icons for everything.
- Bootstrap default colors (#007bff, #28a745, #dc3545) and Open Sans or Montserrat by default with no hierarchy.
- All caps headings on every section, centered text everywhere, identical card grids repeated down the page.
- Coupon starbursts, "limited time" banners, autoplay carousels and chat popups competing with the phone.
- Badge walls (BBB, Angi, "Best of") and "Serving since" lines. For us these are also invented facts.
- Walls of SEO text ("Reliable Plumber Sydney Experts, Prompt, Affordable and Near You") and city name stuffing in headings.
- Three or more competing CTAs in the hero ("Call", "Book", "Chat", "Get Quote", "Financing").
- The same layout for every business with only the color changed. This is exactly Jamey's complaint.

## Design directions

Nine directions. Every direction is Google Fonts, CSS and inline SVG only, and looks finished with no photos. Where a direction has a photo slot, the SVG art is the default and a licensed stock photo is optional (see Photography rules). Each direction differs in hero structure, service layout, proof layout and type system, not just palette. Palettes are given as token sets matching the template `vars` shape (bg, surface, ink, muted, line, primary, on-primary, accent, band, on-band); convert to oklch when implementing.

### Home services

#### 1. Dispatch triage (`hs-dispatch-triage`)

- **Suits**: plumbing, hvac, electrical, appliance-repair, garage-door, septic
- **Mood**: calm, fast, competent. A dispatcher's screen, not an ad. Pattern from Fixed Today.
- **Hero**: split. Left: H1 names the problem in the customer's words ("Leak, clog or no hot water?"), business name and city above it as a small label, call button with the real number, rating line. Right: a white "What are you seeing?" card with six chips from `services`; picking one updates a line ("Got it: water heater. Tell us a bit more.") and scrolls to the request form with the chip prefilled.
- **Section order**: header with phone, hero with picker, rating strip, how a visit works (4 steps), services as a two column list with one line each, why customers call (reviewThemes), while you wait (safety steps for the category), request form (emergency), service area and hours, FAQ, footer, sticky call bar.
- **Typography**: Geist 400, 500, 600, 800 for everything (H1 800 at clamp(2.4rem, 5vw, 4.2rem), tight -0.02em tracking); Geist Mono 400 and 500 for small labels, step numbers and form field hints.
- **Palettes**:
  - Paper and signal: bg #f6f5f1, surface #ffffff, ink #111418, muted #5b616b, line #dcdad3, primary #e8480c, on-primary #ffffff, accent #1f6f5c, band #111418, on-band #f6f5f1
  - Night line: bg #0e1216, surface #161c22, ink #eef1f4, muted #9aa4af, line #26303a, primary #ffb020, on-primary #111418, accent #4cc3a5, band #ffb020, on-band #111418
  - Clean blue: bg #ffffff, surface #f1f4f9, ink #0d1b2e, muted #51607a, line #d9e0ea, primary #1847d6, on-primary #ffffff, accent #ffd23f, band #0d1b2e, on-band #ffffff
- **Imagery**: none required. Icons are single weight inline SVG (2px stroke) drawn per chip. Optional stock slot: a tight close up of the fixture or equipment type (a valve, a condenser coil, a breaker panel), duotone ink and bg.
- **Signature details**: mono status labels ("STEP 2 OF 4"), chips with a pressed state, a thin progress rail on the form, "While you wait" checklist with checkboxes the visitor can tick, no rounded corners over 8px.

#### 2. Warm modern home (`hs-warm-modern`)

- **Suits**: hvac, electrical, appliance-repair, plumbing, garage-door, general
- **Mood**: domestic, friendly, product launch polish. Patterns from Jetson and Quilt.
- **Hero**: centered serif headline on cream, one pill CTA and a text phone link under it, rating chip. Below the fold line: a wide inline SVG house cutaway (rooms, roof line, and the category's system drawn in the accent color: ducts for hvac, pipes for plumbing, wiring for electrical, the door track for garage door, appliances for appliance repair).
- **Section order**: header, hero with house cutaway, three steps (large numbered rounded cards), services as rounded cards with tinted icon circles, why neighbors call (reviewThemes as short lines), a "quick home check" (three yes or no toggles that suggest which service to ask about, demo only), request form, service area, FAQ, final band, footer.
- **Typography**: Fraunces (opsz 9..144, weights 500 and 600, SOFT 100 for display, italic 400 for accents) + Figtree 400, 500, 600, 700 for body and UI.
- **Palettes**:
  - Oat and ember: bg #fbf7ef, surface #ffffff, ink #1d1b1b, muted #6f6a64, line #e8e0d3, primary #1d1b1b, on-primary #fbf7ef, accent #ff7f5c, band #2b95a3, on-band #ffffff
  - Mint cream: bg #f4f7f0, surface #ffffff, ink #102a1e, muted #56655b, line #dde5d8, primary #1f5f3f, on-primary #ffffff, accent #f2b134, band #1f5f3f, on-band #f4f7f0
  - Dusk lilac: bg #f6f3f8, surface #ffffff, ink #231b2e, muted #675e72, line #e4dcea, primary #5b3fd0, on-primary #ffffff, accent #ffb38a, band #231b2e, on-band #f6f3f8
- **Imagery**: illustration first. The cutaway uses 2 to 3 flat fills from the palette plus ink line work. Optional stock slot: bright, softly lit interiors with no people, cropped in large radius (28px) frames.
- **Signature details**: pill buttons, 24 to 28px card radius, a warm and cool color pair (heat and cool tokens for hvac), soft 1px borders instead of shadows, a small serif italic aside next to each section title.

#### 3. Fleet livery (`hs-fleet-livery`)

- **Suits**: plumbing, hvac, septic, garage-door, electrical, pest-control
- **Mood**: established local brand, the service van as identity. The classic Morris-Jenkins or Parker and Sons model, done with discipline.
- **Hero**: full bleed brand color field with two diagonal livery stripes (CSS gradients) running off the right edge, a generated monogram badge (initials in a circle or shield, inline SVG), huge condensed caps business name, one line promise, and the phone number set as a display element (it is the biggest thing after the name). Two buttons: call and schedule.
- **Section order**: utility bar (area, hours only if sourced), header, livery hero, rating scoreboard band (big number, stars, review count), services as a 3 by 2 tile grid with bold filled icons, "Call or schedule online" split band, how it works (3 steps), service area as a list of town chips, FAQ, final livery band, footer.
- **Typography**: Sofia Sans Condensed 800 and 900 (display, uppercase, +0.01em) + Sofia Sans 400, 500, 700 (body and buttons).
- **Palettes**:
  - Fleet navy and safety yellow: bg #ffffff, surface #eef2f8, ink #0b1630, muted #4a5670, line #d6deea, primary #ffc629, on-primary #0b1630, accent #0f2a5c, band #0f2a5c, on-band #ffffff
  - Firebrick and cream: bg #fff6e5, surface #ffffff, ink #1c1512, muted #5e514a, line #ecdcc0, primary #b3261e, on-primary #ffffff, accent #1f3a5f, band #b3261e, on-band #fff6e5
  - Truck green: bg #ffffff, surface #e9f3ec, ink #0b1f14, muted #466152, line #cfe2d5, primary #f2c14e, on-primary #0b1f14, accent #0f5132, band #0f5132, on-band #ffffff
- **Imagery**: no photos needed; the stripes and badge are the identity. Optional stock slot: a clean, unbranded service van or truck side panel with no lettering, used as a duotone under the stripes.
- **Signature details**: livery stripes reused as section dividers, monogram badge in header and footer, condensed caps only for headings (body stays sentence case), phone number styled as a license plate style lockup.

#### 4. Field guide (`hs-field-guide`)

- **Suits**: pest-control, septic, appliance-repair, tree-service
- **Mood**: knowledgeable naturalist, reassuring, curious. Pestie's editorial calm plus a specimen plate.
- **Hero**: split. Left: serif headline, short plain subhead, call and request buttons. Right: an inline SVG specimen plate: fine line drawings (ant, spider, cockroach, mosquito, termite, rodent for pest control; tank cross section with inlet, baffle and outlet for septic; an exploded washer or fridge for appliance repair; a tree with root flare and canopy for tree service) with small caps captions and hairline leader lines.
- **Section order**: header, hero plate, rating strip, "What are you seeing?" grid of illustrated tiles (each a service, tinted background), how it works (3 steps), what to note before you call (general checklist), why customers call (reviewThemes), request form, service area, FAQ, footer.
- **Typography**: Newsreader (opsz 6..72, 500 and 600 display, italic 400 for captions) + Public Sans 400, 500, 600 for body and UI; captions in Public Sans 600 small caps at 0.08em.
- **Palettes**:
  - Sage paper: bg #eef1e8, surface #f8f9f4, ink #13302a, muted #56675f, line #cfd8cb, primary #0f5a4a, on-primary #ffffff, accent #e9744a, band #13302a, on-band #eef1e8
  - Dune: bg #f5efe4, surface #fbf8f2, ink #2a2118, muted #6b5c4b, line #e2d6c3, primary #7a4b1e, on-primary #ffffff, accent #2f6f62, band #2a2118, on-band #f5efe4
  - Chalk on slate: bg #14201d, surface #1b2a26, ink #eef2ea, muted #a8b5ad, line #2c3d38, primary #9fd8b4, on-primary #10201b, accent #f2a65a, band #9fd8b4, on-band #10201b
- **Imagery**: line illustration only; no photos of pests or damage (they read as alarming and cheap). Optional stock slot: a calm exterior of a house or yard, muted with a paper tone overlay.
- **Signature details**: plate numbering ("Plate 1"), hairline leader lines to captions, tinted tiles at 128px with a single illustration each, a paper grain made with an SVG turbulence filter at very low opacity.

#### 5. Calm response (`hs-calm-response`)

- **Suits**: restoration, plumbing, septic, electrical
- **Mood**: steady and clear in a bad moment. Crisis support, not an ad.
- **Hero**: dark band. Headline "Water, fire or mold damage? Start with a call." with a very large call button, and beside it a "Right now" card with four general safety steps (for example: if it is safe, shut off the water at the main; stay out of rooms with sagging ceilings; keep clear of outlets near standing water; take photos for your own records). The copy says these are general safety steps.
- **Section order**: header with phone, dark hero with right now card, rating strip, what usually happens next (a vertical timeline with 4 generic stages: assess, protect, dry or clean, repair; labeled as the typical process, details to confirm with the owner), services as a two by two block with plain text and an icon, why customers call (reviewThemes), emergency request form with a "how urgent" choice, service area and hours, FAQ, footer, sticky call bar.
- **Typography**: IBM Plex Sans 400, 500, 600, 700 (headings 600, not heavier) + IBM Plex Serif 500 italic for the one line reassurance under each section title; IBM Plex Mono 500 for timeline step labels.
- **Palettes**:
  - Slate and signal: bg #f3f5f7, surface #ffffff, ink #16202a, muted #55616d, line #d8dee4, primary #d9480f, on-primary #ffffff, accent #2b7a9b, band #1c2a36, on-band #f3f5f7
  - Deep water: bg #0f1b24, surface #162633, ink #e8eef3, muted #9db0bf, line #243a4b, primary #45b3e0, on-primary #0b1620, accent #ffcf5c, band #45b3e0, on-band #0b1620
  - Smoke and clay: bg #f4f1ee, surface #ffffff, ink #221c1a, muted #62564f, line #e2d9d1, primary #b8452a, on-primary #ffffff, accent #5f7d6e, band #2b2523, on-band #f4f1ee
- **Imagery**: no disaster photos. An SVG water line or a single thin horizon wave in the hero. Optional stock slot: a dry, clean, sunlit empty room (the after state), desaturated.
- **Signature details**: vertical timeline rail with mono step labels, one oversized call button (min 64px tall), the "Right now" card with a thin accent top border, no animation beyond a subtle focus ring.

### Contractors

#### 6. Dark craft editorial (`ct-dark-craft`)

- **Suits**: roofing, remodeling, pools, concrete, foundation-repair, landscaping
- **Mood**: premium, architectural, quietly confident. The Klindworth and Cedar Springs model.
- **Hero**: full bleed dark field with a material texture (CSS or SVG: standing seam lines for roofing, board formed concrete for concrete, water caustics for pools, stone coursing for foundation, a layered hillside for landscaping), a one line serif headline set very large ("Roofing and repairs"), business name and city as a small letterspaced eyebrow, one outline CTA "Request an estimate" and the phone as text.
- **Section order**: header, material hero, large serif intro statement (two or three lines about the work, no claims), services as a numbered editorial list (01, 02, 03 with a hairline between, service name in serif, one sentence in sans), a bone colored band for how a project runs (4 steps horizontal), proof (rating in serif numerals, reviewThemes as short serif lines without quote marks), service area, estimate form with photo upload, footer with a giant serif phone number.
- **Typography**: Gloock 400 (display serif, headlines at clamp(2.8rem, 7vw, 6.5rem), -0.02em) + Manrope 400, 500, 600, 700 (body; eyebrows in Manrope 600 uppercase at 0.14em).
- **Palettes**:
  - Charcoal and tan: bg #1f2024, surface #2a2c31, ink #f1ede6, muted #b9b2a6, line #3a3c42, primary #b39a7b, on-primary #1f2024, accent #e6c152, band #ece7df, on-band #1f2024
  - Iron and copper: bg #16181a, surface #212427, ink #f3efe9, muted #b5ada3, line #33373b, primary #c47a4a, on-primary #16181a, accent #e0b98f, band #e9e2d8, on-band #16181a
  - Forest night and brass: bg #151c18, surface #1e2822, ink #eef0ea, muted #aab3aa, line #2f3b33, primary #c8a45c, on-primary #151c18, accent #8fb39a, band #e8eadf, on-band #151c18
- **Imagery**: the strongest direction for stock. Close ups of material and craft (metal seams, slate, poured concrete, tile, water surface, stone), never people or whole houses that could be mistaken for the business's work. Treatment: duotone (ink to primary) via an SVG feColorMatrix filter or `mix-blend-mode: luminosity` over the bg, full bleed, 21:9 crops. With no photo, the texture SVG stands alone.
- **Signature details**: numbered service index with hairlines, a bone band as the one light section, serif numerals for the rating, a wide letterspaced eyebrow above every title, hover on a service reveals a small texture swatch.

#### 7. Site survey (`ct-site-survey`)

- **Suits**: concrete, fencing, foundation-repair, remodeling, general
- **Mood**: precise, honest, engineered. A job sheet and a technical drawing.
- **Hero**: grid paper background (CSS linear gradients at 24px). Left: H1 with business name as a mono label above it. Right: an inline SVG technical drawing per category with dimension lines and callouts: slab section (subgrade, base, reinforcement, slab) for concrete; fence elevation (posts, rails, pickets) for fencing; foundation section with footing and pier for foundation repair; a floor plan fragment for remodeling. Callouts are generic part names, never measurements claimed for a real job.
- **Section order**: header, drawing hero, rating strip styled as a spec line, services as a spec table (mono index, service name, one line, "Ask about this" link), process as five numbered columns (scope, quote, schedule, build, walkthrough), why customers call (reviewThemes), estimate form styled as a job sheet (project type, rough size in sq ft or linear ft, timing, photos, contact), service area, FAQ, footer.
- **Typography**: Instrument Sans (wdth 75..100, weights 400 to 700; headings at wdth 85, weight 700) + IBM Plex Mono 400, 500 for labels, indexes and form hints.
- **Palettes**:
  - Survey white and safety orange: bg #fafaf7, surface #ffffff, ink #15171a, muted #5c6066, line #e7e6df, primary #ff5a1f, on-primary #ffffff, accent #1b4dff, band #15171a, on-band #fafaf7
  - Concrete and lime: bg #e9e9e6, surface #f5f5f3, ink #1a1c1e, muted #5a5d61, line #d2d2cd, primary #c6f432, on-primary #1a1c1e, accent #3a3d42, band #1a1c1e, on-band #c6f432
  - Cyanotype: bg #0f2f57, surface #143866, ink #e8f0fb, muted #a9c0de, line #1d4577, primary #ffd84d, on-primary #0f2f57, accent #8fc1ff, band #ffd84d, on-band #0f2f57
- **Imagery**: drawings only by default. Optional stock slot: a top down or straight on detail (a fresh slab edge, a fence line, a framed wall), converted to high contrast grayscale with the grid overlaid.
- **Signature details**: grid paper, dimension arrows, mono indexes, a title block in the footer corner (business name, city, "Concept sheet 01"), square corners throughout.

#### 8. Outdoor living (`ct-outdoor-living`)

- **Suits**: landscaping, pools, tree-service, painting, fencing
- **Mood**: airy, aspirational, seasonal. Yardzen, SavATree and pool builder cues.
- **Hero**: large rounded frame (32px radius) holding a layered SVG landscape (rolling hills, tree silhouettes, a water ripple band for pools, a paint swatch fan for painting) or an optional stock photo; headline in a soft display serif; CTA "Plan my project" opens a three step chip estimator (project type from `services`, rough size, timing) that ends in the contact fields.
- **Section order**: header, framed hero, rating strip, what we do (soft cards with organic blob masks), the planner (estimator), ideas gallery (inspiration only, labeled "Ideas", never "our work"), process along a curving SVG path (4 stops), why customers call (reviewThemes), service area, FAQ, final band, footer.
- **Typography**: Gilda Display 400 (headlines, generous 1.05 line height) + Figtree 400, 500, 600 (body and UI); section eyebrows in Figtree 600 at 0.1em.
- **Palettes**:
  - Sage and sand: bg #f5f3ec, surface #ffffff, ink #26301f, muted #6a7061, line #dfdccf, primary #3f5a36, on-primary #ffffff, accent #d8ec8f, band #3f5a36, on-band #f5f3ec
  - Pool blue: bg #f2f8f9, surface #ffffff, ink #0f2436, muted #4f6676, line #d5e6ea, primary #1f6f8b, on-primary #ffffff, accent #7fd1d9, band #0f2436, on-band #f2f8f9
  - Autumn canopy: bg #f7f1e8, surface #fffdf8, ink #2b1f14, muted #6e5d4c, line #e7dccb, primary #8a3b12, on-primary #ffffff, accent #c9a227, band #33533a, on-band #f7f1e8
- **Imagery**: illustration by default; this is the direction where stock lifestyle photos help most (lawns, planting beds, pool water, tree canopy, a freshly painted door in the painting palette), no people, soft natural light, rounded frames, never labeled as the business's projects.
- **Signature details**: blob masks, the curving process path, chip estimator with a progress dots row, a seasonal color strip under the header, painting leads get a swatch row of the palette colors as a navigation motif.

#### 9. Local crew (`ct-local-crew`)

- **Suits**: roofing, fencing, painting, tree-service, concrete, garage-door
- **Mood**: friendly, direct, local. The Hook Agency formula (One Nation, Puetz) with softened shapes.
- **Hero**: split. Left: friendly headline naming the service and city ("Roofing for {city} homes"), one supporting line, rating stars right under it. Right: a white request card overlapping the hero art (three fields and a big button "Request an inspection" for roofing, "Request an estimate" otherwise). Hero art is an SVG of the category (roof pitch lines and shingles, fence run, paint roller stroke, tree and stump, driveway slab) on a brand color field.
- **Section order**: header, hero with card, rating band, services as photo or illustration cards (3 across), our process as a five stop numbered track, why customers call (reviewThemes), service area with an SVG pin cluster and town list, FAQ, final CTA with the phone set huge, footer, sticky call bar.
- **Typography**: Red Hat Display 700 and 900 (headlines, sentence case) + Red Hat Text 400, 500 (body and UI).
- **Palettes**:
  - Storm navy and red: bg #ffffff, surface #f3f6fb, ink #0c1d3b, muted #4b5a74, line #dbe2ee, primary #d7261e, on-primary #ffffff, accent #ffb703, band #0c1d3b, on-band #ffffff
  - Slate and orange: bg #fbfaf8, surface #ffffff, ink #22262b, muted #5d636b, line #e5e2dc, primary #f07c1e, on-primary #1b1d20, accent #2f7d6d, band #2f3a45, on-band #fbfaf8
  - Shingle and sky: bg #f6f8fa, surface #ffffff, ink #13202c, muted #50606f, line #dde4ea, primary #1e7fd8, on-primary #ffffff, accent #ffb703, band #13202c, on-band #f6f8fa
- **Imagery**: SVG category art by default. Optional stock slot: exterior details at eye level (a roof edge against sky, a new fence line, a painted porch), bright and saturated, 16px radius, no people, no visible branding.
- **Signature details**: request card that overlaps the hero edge, 16 to 24px radius and soft shadows, a numbered process track with a connecting line, star row in the accent color, a huge phone in the final band.

## Direction picker

| Category | Directions (first is the default) |
|---|---|
| hvac | Warm modern home, Dispatch triage, Fleet livery |
| plumbing | Dispatch triage, Fleet livery, Calm response, Warm modern home |
| electrical | Warm modern home, Dispatch triage, Fleet livery, Calm response |
| septic | Field guide, Fleet livery, Calm response, Dispatch triage |
| garage-door | Fleet livery, Dispatch triage, Warm modern home, Local crew |
| restoration | Calm response |
| appliance-repair | Dispatch triage, Field guide, Warm modern home |
| pest-control | Field guide, Fleet livery |
| roofing | Local crew, Dark craft editorial |
| concrete | Site survey, Dark craft editorial, Local crew |
| fencing | Site survey, Local crew, Outdoor living |
| pools | Outdoor living, Dark craft editorial |
| landscaping | Outdoor living, Dark craft editorial |
| painting | Outdoor living, Local crew |
| foundation-repair | Site survey, Dark craft editorial |
| remodeling | Dark craft editorial, Site survey |
| tree-service | Outdoor living, Field guide, Local crew |
| general | Warm modern home, Site survey |

Pick deterministically by hashing the lead id across the category's list (as palettes are picked today), and let `lead.demo.template` override. Two leads in the same category in the same run should get different directions when the list allows it; restoration has one direction, so it varies by palette.

## Photography rules for optional stock

- Only licensed stock (for example Unsplash or Pexels license) with the source URL and photographer recorded next to the asset. Never a photo taken from the business's Google profile, social accounts or another company's site.
- No people. A stock person implies staff or customers who do not exist.
- No whole houses, finished projects or vans that could be read as this business's work or fleet, unless the caption says it is an illustration. Prefer materials, details, textures and empty rooms.
- No visible logos, lettering or license plates.
- Treatment per direction: duotone full bleed (Dark craft), grayscale with grid (Site survey), soft natural in rounded frames (Outdoor living), bright saturated detail (Local crew), desaturated after state (Calm response), paper tone overlay (Field guide), none needed (Dispatch triage, Fleet livery, Warm modern).
- `alt` text describes the image and ends with "stock photo".
- Every direction must render complete with the photo slot empty; the SVG art is the fallback, not a gray box.
- SPEC note: `SPEC.md` currently says a demo makes no external requests except the Google Fonts link and needs no images. Stock photos would therefore have to be inlined (data URIs, keep the 16MB guard in mind and compress to about 150KB each) or SPEC needs a deliberate edit to allow local asset files next to `demos/<id>/index.html`.

## Copy guardrails for these directions

- The demo guardrail list (licensed, insured, bonded, certified, award, #1, number one, best in, since, family owned, guarantee, warranty, financing) applies to template chrome too. Words to avoid in headings even though they are common in the field: "trusted", "premier", "experts" (implied claims), "same day", "24/7", "fast response" and any response time unless sourced.
- Process steps, "while you wait" safety steps and FAQ answers describe general practice and what the visitor can do, never what this business promises.
- Project names (Cedar Springs, Klindworth) are a strong pattern but would be invented facts; use service names from the lead record as gallery titles, and label galleries "Ideas".
- Rating proof uses only `googleRating` and `googleReviews` with "Google reviews" wording; omit the block when absent.
