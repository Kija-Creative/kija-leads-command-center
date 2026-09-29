# Design research: auto vertical demos

Researched 2026-09-29 for the demo generator (`src/demo/templates/auto.js` and whatever replaces it). Covers the category keys `auto-repair`, `auto-body-collision`, `tire-shop`, `muffler-exhaust`, `diesel-truck-repair`, `mobile-mechanic`, `auto-detailing`, `towing`.

Why: Jamey reviewed the current demos. 16 of 20 leads are auto shops and all of them render one "service bay" template (Big Shoulders plus Barlow, work order ticket, gauge, line drawn car) with only a palette swap. His direction: make each demo look like the strongest real sites in that business's field. We model the conventions strong sites share. We never clone one site: copy, photos, logos and distinctive trade dress belong to their owners.

Method: homepage HTML and CSS of about 40 sites were downloaded with curl and read for Google Fonts links, `font-family` declarations, hex frequency, heading order and button labels. Layouts were confirmed with a page reader. Browser tools were not used. No forms were submitted and no one was contacted.

## Honest read of the field

- Most independent repair shop sites are built on shop marketing platforms (Kukui, Autoshop Solutions, Tekmetric partners) or WordPress page builders. They share one look: blue or red on white, Montserrat or Open Sans, a photo slider, a coupon block, an ASE badge row, a long SEO text wall. The "best of" listicles (Freshy, CyberOptik, Zarla) mostly rank these. They are useful for conventions, not for design quality.
- Genuinely well designed work in this field clusters in four places: premium detailing and paint protection studios, custom and restoration builders, national chains with in house teams, and a few independents that commissioned real branding. Awwwards' cars category has almost no repair shops; the service businesses listed there are a detailer and a car wash.
- Many hex counts below include WordPress block editor presets (`#cf2e2e`, `#ff6900`, `#fcb900`, `#7bdcb5`, `#0693e3`, `#9b51e0`). Those are not the brand; they are ignored.

## References

| # | Site | Type | Type system (from CSS) | Color (from CSS) | What to learn |
|---|---|---|---|---|---|
| 1 | [ESOTERIC Auto Detail](https://www.esotericdetail.com/) (Columbus and Cleveland) | Detailing, PPF, tint | Montserrat, Roboto, Bebas Neue for display | `#212121` and `#232323` dark, `#ec0928` red, white | Dark theme that makes paint read as gloss. Services as three hero products (PPF, ceramic, tint). Gallery organised by vehicle model. "Begin your project" as the primary CTA, estimate and phone repeated mid page |
| 2 | [Kindig-It Design](https://www.kindigit.com/) (Salt Lake City) | Custom builds | Thunder (tall condensed) for everything display, Neuerational secondary | Black, white, cream `#f5efdf`, red accent | Full bleed, high contrast vehicle photography, all caps condensed headers against sentence case body, a shop timeline, crew faces |
| 3 | [Singer Vehicle Design](https://singervehicledesign.com/) | Restoration | Roboto, light weights | Warm neutrals `#dfdedb`, `#d6cb99`, `#e6e6e6`, slate `#54595f` | Restraint. Short philosophical headings, huge whitespace, photography does the talking. The template for the "specialist" register |
| 4 | [Crash Champions](https://www.crashchampions.com/) | Collision chain | Montserrat | Red `#e51c22`, white, pale tints | Location finder hero, repair experience told in two phases (at the center, back on the road), "Book an appointment" and "Repair status" as the two header actions |
| 5 | [Mundy's Collision Center](https://www.mundyscollision.com/) (Lawrenceville GA) | Independent collision | Passion One display, Source Sans Pro body | Charcoal `#27282d`, white, blue link `#2ea3f2` | Independent that punches above its size: full width hero with transparent header that fixes on scroll, a 4 step repair process, "Our work" gallery, estimate and schedule as paired CTAs |
| 6 | [Les Schwab](https://www.lesschwab.com/) | Tire chain | Sans in Tailwind build | Yellow `#fff200`, black, red `#ff0000` | Tire finder with three equal paths (vehicle, tire size, plate). Local store card with address, hours, phone, map and "Book an appointment". Benefits as a four icon row |
| 7 | [Love's Truck Care](https://www.loves.com/en/truck-care) | Truck service chain | Futura, Muli | Black, white, red `#ff0000`, yellow `#fee934` | Six icon value grid, eight photo service cards, a separate fleet solutions band, 24/7 roadside as its own card. Operational, not decorative |
| 8 | [Barnett's Towing](https://www.barnettstowing.com/) (Tucson) | Independent towing | Aktiv Grotesk condensed and extended, Social Gothic, Nexa Rust (distressed) | Blue and white, desert photography | "24 hour emergency" phone in the header, hero with "Call for tow" beside "Read our reviews", services split by duty class, a downloadable "how to choose a tow provider" checklist |
| 9 | [Wrench](https://wrench.com/) | Mobile mechanic | System sans | Red `#ef3340`, slate `#363946`, `#f5f5f5` | "Peace of mind, delivered" promise, quote flow built from vehicle, service and location, symptom entry points ("Car won't start?"), mechanic profiles, fleet callout |
| 10 | [MagnaFlow](https://www.magnaflow.com/) | Exhaust brand | Interstate, Interstate Condensed | Yellow `#fde022`, black `#090909`, cream `#fffef2` | Vehicle led hero, one loud accent on black, condensed industrial type. The exhaust world looks like motorsport signage, not a clinic |
| 11 | [Ottohaus of Charleston](https://www.ottohausofcharleston.com/) | European independent | Theme sans | Rust `#a73a10`, tan `#ae895d`, charcoal `#3e3e3e` | A European specialist that avoids the default blue: earthy leather and rust tones, "specializing in German auto repair" as the lead line, "Call for service" as the only CTA |
| 12 | [Dana Bros Auto and Diesel](https://www.danabros.com/) (Mesa AZ) | Independent repair and diesel | Exo 2 display, Poppins body | Near white `#f4f4f4`, ink `#191919`, teal `#68ccd1` | "Shop by vehicle" make buttons, diesel specialist and fleet sections, appointment CTA repeated at the end |

Also read and set aside: Caliber Collision (Akkurat, Poppins, Barlow Condensed 800, Maison Neue Extended; page is client rendered), Discount Tire (Lato, blue `#1d62b1`), Firestone (Avenir plus a display face, red `#fe0000`), Big O Tires (Factoria, Gotham, red and yellow), XPEL (Mattone plus Neue Haas Grotesk), YourMechanic, Honk, Take 5, Rush Truck Centers, Classic Collision, Calgary Car Detail (on Awwwards, but a long SEO text wall), Speeders Car Wash (Awwwards), Borla, Euro Car Doctor, EuroCar Service Seattle (Michroma, Syncopate), Lanzante (Oxanium), Emory Motorsports, Autosport Designs.

## Conventions strong sites share

Section order that recurs, top to bottom:

1. Utility bar or header with the phone as a tappable button, hours or "open now", and one primary action (book, estimate, call for tow). Towing and road service put "24 hour" in the header only when it is true.
2. Hero with a specific promise in plain words and two CTAs: the action and the proof (call plus reviews, estimate plus our work).
3. Proof immediately under the hero: rating and review count, then brands or certifications (we can show only the Google rating and count).
4. An entry point that matches how the customer thinks: symptoms for repair, damage photos for body, tire size for tires, "where are you and what happened" for towing, finish and protection level for detailing.
5. Services as a scannable grid or list, 6 to 8 items, each one line.
6. Process in 3 to 5 steps. Collision sites always have it; good repair sites describe the visit (drop off, call with findings, approve, pick up).
7. Why us, told as specifics. Weak sites list adjectives.
8. Work gallery or before and after (body, detailing, custom). Repair shops rarely have one; they show the bays and the crew.
9. Local block: address, hours, map link, service area, parking or drop off notes.
10. FAQ, then a closing CTA band that repeats the primary action, then footer with NAP.

Visual conventions:

- Condensed or wide display type in caps for signage energy; a quiet sans for body. The strongest sites commit to one register (industrial signage, quiet specialist, glossy studio) instead of mixing.
- One loud accent against black, charcoal or white. Yellow and red dominate chains; premium work uses warm neutrals, brass, rust or one electric accent.
- Real work photography beats stock: bays, lifts, hands, paint booths, trucks at night. Premium sites use low key, detail crops; retail sites use bright product cutouts.
- Sticky call on mobile everywhere.
- Spanish is common in Dallas area shops and is treated as a first class toggle, not a footnote.

## Conversion patterns that work

- **Two action hero**: primary action plus a proof link. The phone is the primary action for towing, road service and small independents; estimate or booking for body, detailing and tires.
- **Symptom first**: chips like "Check engine light", "Brakes squeal", "AC blows warm", "Won't start" that prefill the request. Wrench and YourMechanic both lead with this.
- **Photo estimate**: upload wide shot then close ups, plus a tap to mark damaged panels on a car diagram. Converts on body, dent, paint and detailing.
- **Tire size finder**: width, aspect, rim, with a sidewall diagram teaching how to read the size, then "request a quote". Les Schwab also offers vehicle and plate; we should offer size and "not sure, send a photo of the sidewall".
- **Dispatch form** for towing and road service: what happened, where you are, vehicle, callback number, with the call button bigger than the form.
- **Local store card**: address, hours, open now, directions link, call. Put it high on mobile.
- **Fleet callout** as its own band on diesel and repair sites that serve trucks. Only mention fleets as a question ("Running a fleet? Ask about a maintenance schedule"), never as an offering unless sourced.
- **Process strip** reduces fear of the unknown bill (collision and repair).
- **Closing band** that repeats the action with the phone number big.

## What makes a site in this field look cheap or generic

- The shop platform look: blue and white, Montserrat or Open Sans, rotating slider, wrench and gear icons, coupon grid, a paragraph of city name SEO copy.
- Stock photos of a smiling mechanic with a thumbs up, a handshake over a clipboard, a model in a clean jumpsuit, or a car on a white void.
- Checkered flags, flames, lens flare, chrome bevel text, gear and piston clip art, carbon fibre textures.
- Car maker logo walls. They are trademarks and they date instantly.
- Tiny phone numbers, chat widgets that cover the call button, autoplay video with sound, low contrast text over busy photos.
- Adjective soup ("quality service you can trust", "honest and reliable").
- Every lead in a city on the same template with a new palette. That is exactly what Jamey flagged.
- Claims we cannot back: ASE certified, warranties like 24 months or 24,000 miles, "since 19xx", family owned, lifetime guarantee, financing, "free estimate", awards, "#1". The demo guardrail rejects licensed, insured, bonded, certified, award, #1, number one, best in, since, family owned, guarantee, warranty and financing unless the lead record backs them. Note that "since" is blocked even in innocent phrasing ("since it started"), so template copy must avoid the word.

## Constraints from this repo that shape every direction

- Demos are one self contained HTML file, Google Fonts allowed, no other external requests. `guardrails.js` currently rejects any `<img>`, media tag or image data URL. So every direction below ships a complete **no photo mode** built from CSS, inline SVG and type. Stock photography is an optional layer that needs a deliberate SPEC and guardrail change (for example an allow list of licensed stock files bundled with Kija's assets, with the license recorded). Until then, treat the photo notes as art direction for later.
- If stock is enabled: licensed stock only (for example Unsplash or Pexels license, or paid stock), no visible business signage, no readable plates, no car maker badges in focus, no people presented as the business's staff. Caption nothing as "our shop" or "our team".
- Facts come only from the lead: business, city, area, phone, rating, review count, hours, address, services, reviewThemes, languages, established. No invented prices, years, credentials, warranties, turnaround times, staff names or reviews.
- Rating block must show the exact rating and count with "Google reviews" wording.

## Directions

Eight directions. Each one differs in layout skeleton, type family and color logic, not just palette. Suggested selection: map by category first, then use name and services keywords (for example "euro", "german", "import", "BMW", "diesel", "truck", "custom", "performance", "tint", "ceramic", "mobile", "tow"), then hash the id among the eligible directions so two neighbours in one city rarely match.

### 1. Neighborhood service bay (`auto-neighborhood-bay`)

- **Suits**: auto-repair, tire-shop, muffler-exhaust, mobile-mechanic
- **Mood**: the shop down the street you would send your mother to. Warm, plain spoken, well kept, daylight.
- **Hero**: light background. Left column: area and category eyebrow, the business name set big in wide Archivo, a one line promise, then a row of symptom chips ("Check engine light", "Brakes", "AC", "Won't start", "Oil change", "Something else") that scroll to and prefill the request form. Right column: a stacked local card: Google rating and count, hours with a computed open now badge (only when hours are sourced), address with directions link, call button.
- **Section order**: utility bar (hours, address, phone) / hero with symptom chips and local card / services as a two column list with one line each / "What customers mention" from reviewThemes / how a visit works (call or request, bring it in, hear what it needs, decide, pick up) / request form (vehicle year make model, what it is doing, when it started, callback) / hours and service area / FAQ / closing call band / footer.
- **Typography**: Archivo (variable, wdth 112 to 125) at 800 for display and the name, Archivo 600 for labels; Public Sans 400 and 600 for body. Name sized by length, tight leading 0.9, no all caps for long names.
- **Palettes**: Shop apron: navy `#16324F`, cream `#F6F1E7`, signal orange `#E4572E`, ink `#1B1B1B`, line `#D9D0BF`. Parts counter: white `#FFFFFF`, graphite `#23262B`, tool red `#C8102E`, steel `#8A939C`, fog `#EEF0F2`. Garage green: forest `#1F3D2B`, bone `#EFEADF`, mustard `#D9A21B`, ink `#141A16`.
- **Imagery**: warm documentary photos of work in progress: hands on a wrench, a lift with a car up, a bay door open to daylight, natural color with a slight warm grade, 4:3 crops in rounded 6px frames. No photo mode: a pegboard dot pattern (radial gradient) behind the local card and an SVG line drawing of an open bay door with a car on a lift.
- **Signature details**: pegboard dot texture; symptom chips that prefill the form; the local card as a paper repair order with a perforated edge; open now badge driven by sourced hours; hand drawn underline SVG under one word of the promise.

### 2. European specialist atelier (`auto-euro-atelier`)

- **Suits**: auto-repair (European, import, performance signals), auto-detailing, muffler-exhaust (performance)
- **Mood**: quiet expertise. Gallery calm, engineering precision, the opposite of a coupon page.
- **Hero**: full bleed, near black or ivory. The name in large light weight type with wide tracking, a small mono eyebrow ("Independent service, Dallas"), a single sentence promise with one word in Instrument Serif italic, one primary CTA as a thin outlined button plus the phone as a text link. Below, a hairline rule and three spec style cells: Google rating, review count, hours.
- **Section order**: minimal header (name, three links, call) / hero / spec cells / services as a numbered spec sheet (01 to 06, hairline rules, mono labels, one line each) / an editorial "approach" block made of reviewThemes set as large pull statements (paraphrased, no quotes) / visit steps as a horizontal timeline / request form styled as a service intake sheet (make, model, mileage, what you have noticed) / location and hours / FAQ / footer.
- **Typography**: Instrument Sans (wdth 75 to 100) 400 and 600, display at 300 to 400 very large; Instrument Serif italic 400 for single accent words; IBM Plex Mono 400 for labels, numbers and the phone.
- **Palettes**: Graphite and brass: `#111214`, `#1C1D20`, text `#E9E6DF`, brass `#B08D57`, line `#2E3034`. Ivory and racing red: `#F4F1EA`, ink `#16161A`, red `#B3261E`, stone `#8C8A84`. Slate and petrol: `#0F1A1F`, text `#E8EDEE`, petrol `#2F7F86`, champagne `#C9A96E`.
- **Imagery**: low key studio photography: light raking across a fender, a wheel and caliper detail, an engine bay in shadow, no badges readable, desaturated to near monochrome with the accent as the only color. Wide 21:9 crops. No photo mode: a hairline SVG coupe profile (generic, no marque features) lit by a slow radial spotlight gradient that follows scroll.
- **Signature details**: numbered spec sheet services; mono data labels; hairline grid that shows at section breaks; one serif italic word per heading; slow 900ms fades only, no bounce; generous 160px section spacing on desktop.

### 3. Collision and paint showroom (`auto-collision-showroom`)

- **Suits**: auto-body-collision, auto-detailing (paint correction)
- **Mood**: clean, bright, reassuring after a bad day. Clinical like a paint booth, clear like an insurance form done right.
- **Hero**: split. Left: promise ("Send photos. Get a straight read on the damage."), primary "Start a photo estimate", secondary call. Right: a before and after slider. No photo mode draws the same car door panel twice in SVG: left side with warped reflection lines and a dent shadow, right side with straight parallel reflection lines (the reflection line test paint shops use). The handle drags with pointer and keyboard.
- **Section order**: header with "Get an estimate" and call / hero with reflection line slider / rating strip / "Tap where it is damaged" top view car diagram whose panels tag the estimate form / repair process as a 4 or 5 step stepper (photos and estimate, inspection, parts and repair, paint and refinish, final check and pickup, worded as what happens, no timelines) / services grid with small panel icons / "After a collision" generic checklist (safety, photos, exchange info, call your insurer, which shop you use is your choice) / photo estimate form / hours and location / FAQ / footer.
- **Typography**: Schibsted Grotesk 800 for display, 500 for UI, 400 for body; Geist Mono 500 for step numbers and panel labels.
- **Palettes**: Clearcoat: `#FBFBFC`, ink `#0E1116`, electric blue `#1F5EFF`, mist `#E7EBF2`, line `#D5DBE5`. Primer: charcoal `#2A2D31`, primer gray `#9AA0A6`, candy red `#D7263D`, off white `#F2F2F0`. Pearl and teal: `#F6F7F5`, deep teal `#0B2A33`, teal `#0FA3A3`, amber `#FFB000`.
- **Imagery**: high key, color true shop photos: paint booth light, spray mist, masking tape lines, a polished panel reflecting booth lights, before and after pairs shot from the same angle. No photo mode: reflection line SVGs, a paint chip swatch strip, the panel diagram.
- **Signature details**: reflection line before and after slider; clickable car diagram feeding the form; progress stepper; masking tape label style for section eyebrows; photo previews stay on device (existing behaviour).

### 4. Heavy duty and fleet (`auto-heavy-duty`)

- **Suits**: diesel-truck-repair, towing (heavy duty), mobile-mechanic (road service)
- **Mood**: night shift at a truck stop. Operational, loud, no nonsense. Built for a driver on the shoulder or a fleet manager at a desk.
- **Hero**: dark full bleed. Hazard chevron band across the top edge. Huge condensed caps name, a road service line, and a dispatch panel on the right that reads like a status board: phone in large mono digits, hours (or "24 hours" only if sourced), service area city, Google rating. Primary "Call road service" (if road service is sourced) or "Call the shop"; secondary "Request service".
- **Section order**: header with a mono phone readout / hero with dispatch panel / services as a dense 3 or 4 column grid with SVG icons (engine, air brakes, electrical, PM, tires, road service, only sourced or category defaults) / "For drivers" and "For fleets" split band (fleet side is a question, not an offer) / how a road call works (call, share unit and location, tech assessment, back on the road) / request form (unit or vehicle, location or mile marker, problem, callback) / hours and service area / FAQ / footer.
- **Typography**: Saira Condensed 700 and 800 for display in caps; Saira 400 and 600 for body; Share Tech Mono 400 for the phone, unit fields and status readouts.
- **Palettes**: Night shift: `#0D0F12`, panel `#1A1E24`, hi vis amber `#FFB400`, text `#F5F5F2`, line `#2B3038`. Hi vis: `#121212`, lime `#D4FF3A`, gray `#3A3D42`, white `#F4F4F4`. Fleet blue: navy `#0B1F3A`, light `#F2F4F7`, safety orange `#FF6A13`, steel `#7D8794`.
- **Imagery**: dusk and night photography: a tractor trailer under sodium or LED light, open bay doors glowing, wet asphalt, visible grain; hard contrast. Treatment: duotone black and amber if stock is used. No photo mode: hazard chevrons, a road perspective SVG (two converging lane lines and dashed center) under the hero, amber glow gradients.
- **Signature details**: hazard stripe dividers; status board dispatch panel with tabular mono numbers; "tap to copy my location" helper that fills the form only on the device; big thumb sized call bar on mobile; icons drawn at 2px stroke with square caps.

### 5. Bold value tire shop (`auto-value-tire`)

- **Suits**: tire-shop, muffler-exhaust, auto-repair (quick service shops)
- **Mood**: busy, bright, bilingual, fast. The sign on the corner you can read at 40 mph.
- **Hero**: saturated color field with a tread pattern SVG repeating behind stacked heavy italic caps. Center or right: a big SVG tire whose sidewall text runs on a circular `textPath` spelling the size the visitor enters. A tire size finder sits in the hero: width, aspect, rim selects plus "Not sure? Send a photo of your sidewall". Call button as big as the finder.
- **Section order**: header with Spanish toggle given equal weight and call / hero with finder / rating sticker / "How to read your tire size" explainer with the sidewall diagram labelled (width, aspect ratio, construction, rim diameter) / services as bright blocks (new and used only if sourced) / "Walk in or call ahead" visit block using sourced hours only / quote request form / map link and hours / FAQ / footer.
- **Typography**: Kanit 800 italic for display and prices style numbers (there are no prices, used for size and rating digits); Kanit 600 for labels; Rubik 400 and 500 for body.
- **Palettes**: Yellow line: yellow `#FFD400`, black `#111111`, white `#FFFFFF`, red `#E10600`. Rubber and lime: `#151515`, `#2B2B2B`, lime `#B6F000`, white `#F7F7F7`. Sale red: red `#D71920`, cream `#FFF7E6`, ink `#1A1A1A`, gold `#FFC629`.
- **Imagery**: product style tire and wheel photography cut out on flat color, tread macros, a tire changer in action; punchy, saturated, hard shadows. No photo mode: the textPath sidewall, tread strip dividers, a wheel and lug nut SVG.
- **Signature details**: sidewall `textPath` that updates live from the finder; tread strip section dividers; slanted 3 degree section edges; sticker style rating badge with a rotated edge; Spanish first when `languages` includes Spanish.

### 6. Gloss studio (`auto-gloss-studio`)

- **Suits**: auto-detailing, auto-body-collision (paint and refinish), mobile-mechanic (mobile detail)
- **Mood**: after hours studio. Black, reflections, precise. Paint as jewellery.
- **Hero**: black. A generic car profile silhouette in SVG with a single light streak gradient that sweeps across it on load and on scroll, like a studio strip light. Wide display type for the name, promise below, CTAs "Request a booking" and call.
- **Section order**: header / hero with light sweep / rating in a glass card / care levels as four large tiles (wash and decon, correct, protect, tint, or the sourced services) with hover reflections, no prices / tint shade visualizer: a slider that darkens an SVG side window through common shade labels (the page states no legal limits and no claim) / "Pick your finish" chooser (gloss, satin, matte, just clean) that prefills the form / gallery (optional stock) or paint swatch grid / booking request (vehicle size, services, drop off or mobile only if sourced) / hours and area / FAQ / footer.
- **Typography**: Unbounded 500 and 700 for display (wide, geometric); DM Sans 400 and 500 for body; Unbounded 400 at small sizes for labels with 0.12em tracking.
- **Palettes**: Obsidian and ice: `#07080A`, `#14161A`, ice `#E8F1FF`, accent `#7CC4FF`, line `#23262C`. Black and chrome lime: `#0A0A0A`, lime `#D9FF3F`, chrome `#9AA3AD`, white `#F2F2F2`. Candy: `#0D0A12`, magenta `#FF2E88`, lilac `#F5F0FF`, gray `#6F6A78`.
- **Imagery**: dark studio photography: water beading macro, foam, a polisher on a panel under LED strips, reflections of light bars in paint; black with one color light. Full bleed with a black gradient to text. No photo mode: light sweep gradients, beading dots pattern, the tint visualizer.
- **Signature details**: animated light sweep (CSS gradient on a mask, respects reduced motion); tint shade slider; glass cards with backdrop blur; hover reflection on tiles; ultra wide letterspaced labels.

### 7. Roadside dispatch (`auto-roadside-dispatch`)

- **Suits**: towing, mobile-mechanic, diesel-truck-repair (road service)
- **Mood**: calm under stress. Big, bright, legible in sunlight on a cracked phone. One job: get the call.
- **Hero**: the whole first screen on mobile is a call button with the number in huge type, then a "What is happening?" chooser of large tap tiles (flat tire, won't start, locked out, accident, need a tow, out of gas), each mapping to a sourced service or a category default. Picking a tile shows a short "while you wait" safety note and a prefilled request. Desktop: split with the chooser left and a service area panel right.
- **Section order**: header with phone always visible / hero call plus situation chooser / rating / services list / "While you wait" safety checklist (generic: hazards on, stay clear of traffic, share location with the dispatcher) / service area panel: abstract concentric rings around the sourced city and area names, no invented radius / request form (what happened, where, vehicle, callback) / hours (24 hours only if sourced) / FAQ / footer.
- **Typography**: Sofia Sans Extra Condensed 800 and 900 for display and the phone; Sofia Sans 400 and 600 for body; tabular numbers on for the phone.
- **Palettes**: Flare: orange `#FF5A1F`, warm white `#FFFAF5`, ink `#1C1C1C`, sand `#F1E6DA`. Beacon: yellow `#FFC400`, black `#101418`, white `#FFFFFF`, gray `#5B6470`. Reflector: white `#FFFFFF`, blue `#0047FF`, red `#FF3B30`, ink `#0B0B0F`.
- **Imagery**: daylight roadside and flatbed photography, strobes and reflective tape, motion blur of traffic; bright and honest. No photo mode: reflective tape diagonal stripes, a beacon pulse animation behind the call button (reduced motion aware), icon tiles.
- **Signature details**: situation chooser that prefills and reveals a safety note; pulse ring on the call button; reflective tape stripes; phone number repeated in every section band; minimum 56px tap targets.

### 8. Fab shop (`auto-fab-shop`)

- **Suits**: muffler-exhaust, auto-repair (custom and performance), diesel-truck-repair (custom work)
- **Mood**: craftsmen who bend metal. Poster and shop sign energy, a little rough, proud of the work.
- **Hero**: cream paper background with subtle grain. The name in a heavy slab set like a painted shop sign, an SVG of a mandrel bent exhaust pipe drawing itself across the hero (stroke dash animation), a stamped circular badge holding the city and "Google rating" digits, CTAs "Bring it by" (directions) and call.
- **Section order**: header / hero with pipe drawing / services as a numbered shop menu board (black board, cream lettering) / "What it's doing" sound and symptom chips (rattle, loud exhaust, check engine, smell) that prefill the form / process as a hand drawn arrow path (look, quote, fabricate or repair, drive it) / reviewThemes as stamped labels / request form / hours and address / FAQ / footer.
- **Typography**: Alfa Slab One 400 for display; Libre Franklin 400, 600 and 800 for body and labels; Libre Franklin 800 in caps with 0.08em tracking for menu board rows.
- **Palettes**: Shop sign: cream `#F3ECDC`, black `#151515`, red `#C1272D`, kraft `#C8A97E`. Blued steel: `#1D2430`, heat blue `#3C6E91`, bronze `#B9783F`, paper `#EEE8DC`. Olive drab: olive `#4B5320`, cream `#F1EBDD`, safety orange `#E86A1C`, black `#1A1A17`.
- **Imagery**: gritty close ups: welds, heat tinted stainless, a pipe bender, sparks, worn floor; warm, contrasty, grain. Black and white with the accent spot color works well. No photo mode: the self drawing pipe SVG, weld bead dotted borders, paper grain via an SVG turbulence filter, stamped badge.
- **Signature details**: self drawing pipe line; menu board services; stamped circular badge; weld bead borders; torn paper section edges via clip path.

## Direction by category (starting point)

| Category | Default | Alternates |
|---|---|---|
| auto-repair | Neighborhood service bay | European atelier (import or performance signals, or high review counts), Fab shop, Heavy duty (truck signals) |
| auto-body-collision | Collision showroom | Gloss studio |
| tire-shop | Bold value tire | Neighborhood service bay |
| muffler-exhaust | Fab shop | Bold value tire, European atelier (performance) |
| diesel-truck-repair | Heavy duty and fleet | Roadside dispatch, Fab shop |
| mobile-mechanic | Roadside dispatch | Neighborhood service bay, Heavy duty |
| auto-detailing | Gloss studio | European atelier, Collision showroom |
| towing | Roadside dispatch | Heavy duty and fleet |

Rule of thumb for the current batch: no two auto leads in the same city should share a direction unless there are more leads than eligible directions, and palettes should differ between any two that do.

## Implementation notes for the generator

- Each direction is its own template module with its own CSS skeleton and section components; palettes are data. Sharing `parts.js` helpers (facts, FAQ, steps, footer) is fine, sharing layout CSS is what made every demo look alike.
- Load only the weights listed; one Google Fonts request per demo with `display=swap`.
- All interactive pieces (symptom chips, panel diagram, size finder, tint slider, situation chooser, before and after) are vanilla JS in the existing single page script, keyboard operable, and never send anything.
- Respect `prefers-reduced-motion` for the light sweep, pipe drawing, pulse ring and slider hints.
- Copy for every direction must pass the claim guardrail, including the word "since".
