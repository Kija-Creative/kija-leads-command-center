# Design research: barber, salon and studio demos

Researched 2026-09-29 for the demo generator (`src/demo/templates/personal-care.js` and whatever replaces it). Covers the category keys `barber`, `hair-salon`, `nail-salon`, `tattoo`, `pet-grooming`.

Why: Jamey reviewed the current demos and flagged Most Famous Cutz (Dallas barber, 4.9 stars, 165 Google reviews, demo concept "bold editorial barber site"). The current demo renders the shared personal care template with the `mint` palette: a pale mint background, Bodoni Moda display, Karla body and a red accent. That reads as a spa or a boutique florist, not a Dallas fade shop. There is no photography or image stand in, so the page is type on a tint. His direction: make each demo look like the strongest real sites in that business's field. We model the conventions strong sites share. We never clone one site: copy, photos, logos and distinctive trade dress belong to their owners.

Method: pages were opened in the built in browser at desktop width (800px pane) and phone width (375 x 812), scrolled and screenshotted. Fonts, heading order, button colors and background colors were read from computed styles with a small inspection script. Listicles (Nanoglobals, Zarla) were read with WebFetch to find candidates. Some domains refused to load in the browser (Schorem, Persons of Interest, Paintbox, Sundays, Varnish Lane, Olive and June); they are not cited. No forms were submitted, nothing was booked, no one was contacted.

## Honest read of the field

- Most independent barbershop sites are Squarespace or Wix templates, or a Booksy, Fresha or Square page with no owned site at all. Nanoglobals reviewed about a hundred and found nearly 80 percent on Squarespace. The typical look is a dark photo slider, a gold accent, Montserrat, a "Book Now" that leaves the site. Kutinfed, a Dallas shop, is a fair example of the local baseline: red chairs photo hero, four unrelated accent colors (red, sky blue, gold, green), Lato plus Roboto plus Roboto Slab, and a press logo in the middle of the page. It works, it is not designed.
- Genuinely strong work clusters in three places: independents in Austin, Miami, Toronto and London that commissioned a brand and a Webflow or Framer build, a few multi city chains with in house teams, and award gallery entries (Awwwards featured Rendezvous Barbers and Porem Barbershop; Framer Awards nominated Bryant Barbers).
- Salons, nail studios, tattoo shops and groomers follow the same split. The well designed ones treat the site like a fashion or retail brand; the rest are booking widgets with a logo.
- The reference sites lean heavily on claims we cannot make: "Miami's best", "voted #1 every year", "since 2006", "award winning", press logos. Our demos cannot use any of that. The design has to carry the premium feel on its own, with the real Google rating and review count as the only proof.

## References

| # | Site | Type | Type system (computed) | Color (computed) | What to learn |
|---|---|---|---|---|---|
| 1 | [Barber & Co](https://www.barberandco.us/) (Miami) | Independent barber, 2 locations | GT America Compressed 500 uppercase display (80px h1, 56px h2), Bitter body, Inter UI | Black `#000000`, white, brass pill `#cd9a4f` | Dark full bleed photo hero with a centered compressed uppercase headline, a one line service promise, two pills (Book Now with an arrow chip, phone number as a dark pill). A floating Book Now pill stays bottom right on desktop. On phone the header collapses and a bottom tab bar appears (Home, Services, Book Now), app style. "Popular services" as a short named list. Vintage gilt frame around a portrait is their trade dress; do not copy it |
| 2 | [Birds Barbershop](https://birdsbarbershop.com/) (Austin) | Independent barber group | Zing Rust (italic condensed brush) display at 90 to 100px, Source Sans 3 body | Warm off white `#f7f1ea`, ink `#111111`, chartreuse `#e8fe59`, coral, cobalt | The bright, loud, friendly register. Photo hero with a two word italic condensed headline and two pill CTAs (white and chartreuse). Directly under: a bento row of rounded color cards (each one fact plus a small illustration), then alternating photo and color cards. Checkerboard strip as a motif. Service list as short names ("skin fade", "buzz cut", "kid cut"). Their illustrations and "Haircuts for all y'all" voice are theirs |
| 3 | [Rendezvous Barbers](https://www.myrendezvous.ca/) (Toronto), design by Ebda, featured on Awwwards | Barber group, 5 locations | GT Super Text (book serif) at 86 to 98px with tight negative tracking (about -5 percent), roman and italic mixed in one headline; GT Alpina Typewriter for small copy; GT Walsheim UI | Flood orange `#ff622b`, black, white | The editorial register. The whole first screen is one saturated color with a huge serif sentence, a small inset video thumbnail, and a typewriter paragraph in caps. Then a black band with a full width portrait, then a white "Locations" title set enormous in italic. Floating black Book Now pill. Phone keeps the same idea: the headline just wraps to six lines. Proves a barbershop can look like a magazine without a single gold accent |
| 4 | [Bryant Barbers](https://bryantbarbers.co.uk/) (Maidstone), Framer Awards nominee | Independent barber | Sk-Modernist Bold, very wide letter spacing (25px on a 48px wordmark), Sk-Modernist Mono for eyebrow labels, Inter body | Monochrome: white, `#404040`, black, gray photo overlays | The minimal gallery register. Letter spaced wordmark laid over the photo, small mono eyebrow labels ("BARBERS IN MAIDSTONE") over centered sentence case headings, count up stats, a sticky white "Book appointment" button top right. Weak point: on phone the first screen is only a photo and a cookie bar, no headline or action. Our version must put name, rating and Book above the fold on phone |
| 5 | [Fellow Barber](https://www.fellowbarber.com/) (NYC, LA, SF) | Chain | Neue Haas Grotesk Text body, Reckless (serif) for headings | White, bone `#ebe6de`, ink `#363636`, bottle green accent | Calm retail polish: square black Book Now in the header, video of the shop, product row. Booking goes per city (Boulevard). Useful for restraint and a serif plus grotesk pairing, not for layout |
| 6 | [Legends Barbershop](https://www.legends-barber.com/) (Framer build) | Barber group | Clash Display 600 at 80 to 86px, Instrument Sans, Inter | Light gray `#f2f2f2`, ink `#111111`, video hero | Big confident grotesk headings, rounded 24px media cards, a "Haircut preview" and "Services and styles" gallery. Illustrates the bold sans register for fade culture |
| 7 | [Spoke & Weal](https://spokeandweal.com/) (10 salons) | Hair salon group | Instrument Serif 400 display (Google Font) with negative tracking, Inter body | Near black `#0a0a0a`, linen `#faf7f2`, sand `#f2ede3`, champagne sparkle accent | The salon editorial register: serif headline, "What we do best" service list, press row, closing "Book your chair." band, and an italic city marquee separated by four point sparkles. Weak point: a full screen preloader ("EST. 2013" and a counter) blocks the first seconds on phone; do not do that |
| 8 | [Nine Zero One](https://ninezeroonesalon.com/) (Los Angeles) | Independent salon | Custom display fonts, Helvetica UI | Warm plaster interior photo, black, white, cream `#f5ebdf` | Full bleed interior photo as the whole hero, the room's color becomes the brand. White square "Book appointment" button on the photo. Shows the value of warm, environmental photography over stock faces |
| 9 | [Chillhouse](https://chillhouse.com/) (NYC) | Nail brand and studio | Suisse Int'l Condensed 600 uppercase, Suisse Works serif and italic, Sofia Pro body | Cream `#f8f7f2`, peach `#fac8a8`, deep peach `#ffb990`, mint `#b5d1c0`, ink `#010b13` | Nail world color logic: pastel sorbet tints on cream, one macro hand photo, condensed caps mixed with a serif italic word ("Well PLAYED"). Now retail heavy, so use it for color and type, not structure |
| 10 | [Bang Bang](https://www.bangbangforever.com/) (NYC) | Tattoo studio | Bebas Neue tracked very wide (12px on 18px), Space Mono and Droid Sans Mono body (all Google or close) | Black `#000000`, `#151515`, gray text `#a8a8a8`, bone `#ededed` | Tattoo register: black and white grainy photography, a stacked monogram, a wide tracked name, address in mono. Hours and location as plain facts in caps. Artists as the main navigation |
| 11 | [London Dog Grooming Co.](https://www.londondoggroomingcompany.co.uk/) | Independent groomer | Inter 700 at 72px with -3px tracking, Lato | White, ink `#101010`, red `#ff3d3d`, blush `#ffdede` | Boutique grooming: groomed dogs photographed like retail product, a product row, "Grooming packages", "Puppy orientation". Proves a groomer can look premium rather than cartoonish |
| 12 | [Pink Dog](https://pinkdogusa.com/) | Independent groomer | Amiri serif caps | Charcoal `#252525`, hot pink `#ed217d`, purple `#833ca3`, putty `#f3f4ee` | Cutout dog on a dark field with hand held comb and scissors and a speech bubble sticker. The cutout plus props idea is useful and cheap to build in SVG; the execution (serif caps, slider arrows) is dated |

Also looked at and set aside: Kutinfed (Dallas; the local baseline described above), The Scotch Pine (Seattle; stock Squarespace, pale gray text on white), Logan Parlor (Chicago; generic theme, gold pill buttons), Blind Barber (now a fragrance store). Candidate lists: [Nanoglobals, 20 barbershop sites](https://nanoglobals.com/barbershop-websites/), [Zarla barbershop examples](https://www.zarla.com/guides/barbershop-website-examples), [Zarla pet grooming examples](https://www.zarla.com/guides/pet-grooming-website-examples).

## Conventions strong sites share

Section order that recurs on barber sites, top to bottom:

1. Header: wordmark left, two or three links, one Book button right. Phone number visible on desktop in the header or the hero.
2. Hero that fills the first screen: photo (or a color flood), the name or a short promise set very large, and two actions: Book and Call.
3. Proof right after the hero. Strong sites use press, awards or review quotes. We have only the real Google rating and count, so that block has to be designed as a feature (big numeral, stars, "165 Google reviews"), not a footnote.
4. Services as a short named menu (fade, taper, beard, line up, kids, hot towel), often with a duration. Prices appear on many real sites; we have none, so the menu shows names only and one line: menu and prices to confirm with the shop.
5. The team: barber cards with portrait, first name, specialty and an individual Book link. We have no names or photos, so this becomes a designed placeholder (chair numbers, silhouettes) that tells the owner what goes there.
6. Gallery of cuts, usually a tight square grid or a horizontal strip.
7. Visit: address, hours, map, walk in policy. Only sourced facts; otherwise a clear "to confirm" state.
8. Closing Book band, then footer with socials.

Salon, nail and tattoo sites follow the same order with two swaps: the team section becomes the main navigation (clients choose a stylist or artist first), and a consultation step appears before booking for color, extensions, custom tattoos and first grooms.

Visual conventions:

- One loud decision per site. Barber & Co is black and brass, Birds is chartreuse, Rendezvous is orange and serif, Bryant is monochrome and spacing. None of them mixes more than one accent family. The current demo's pastel tint plus red accent plus Bodoni is three decisions that fight.
- Display type is huge. h1 sizes observed: 80px, 86px, 100px on desktop. The headline is the layout.
- Condensed uppercase sans (compressed grotesk) is the default barber voice; serif display is the salon default; wide tracked caps plus mono is the tattoo default. Crossing these on purpose (a serif barber like Rendezvous) reads as editorial; crossing them by accident (Bodoni on a fade shop) reads as a template.
- Photography is warm and environmental (chairs, mirrors, hands at work, backs of heads, clippers), often darkened for text. Faces are real staff. Nothing looks like generic stock.
- Buttons are pills or hard squares, never both. Booking is a filled button; the phone is a secondary button, not a text link.
- Motion is limited to a video hero, a marquee, and hover states. Blocking preloaders hurt (Spoke & Weal on phone).

## Conversion patterns that work

- Book appears in at least four places: header, hero, a floating pill (desktop, bottom right, Barber & Co and Rendezvous) and a closing band.
- Phone layout: a bottom bar with Call and Book side by side (Barber & Co uses an app style tab bar). This also satisfies the spec's mobile sticky call bar.
- Booking stays on the page. Birds and Scissors & Scotch open booking in a modal instead of redirecting (Nanoglobals). In the demo that means the concept booking form opens in place: service, preferred barber ("Any barber" as the default), day, time window, name, phone. Submit shows the required concept notice.
- Walk ins: barber sites state the policy near the hero or the hours ("Walk ins welcome" or "Appointment only"). We never state either unless sourced; show a neutral "Walk in policy to confirm" line inside the visit block.
- Salons and tattoo studios use a consultation or inquiry form instead of instant booking: for tattoo, placement, size, style, color or black and gray, and a note that reference images are shared at consultation. For groomers, pet name, breed, size, coat notes, and first visit yes or no.
- Rating proof sits within one scroll of the hero and repeats near the booking form.

## What to avoid (reads cheap or generic)

- Pastel tint plus a Didone serif on a barber shop (the current Most Famous Cutz demo).
- Default gold on black with a script logo and Montserrat. It is the whole of the template market.
- Four accent colors and three font families (Kutinfed).
- Photo sliders with arrows, cookie style full screen preloaders, auto playing carousels of stock faces.
- Barber pole clip art, crossed razors clip art, mustache icons, blackletter everywhere.
- Fake density: "20+ years", "10,000 cuts", "voted best", press logos, star ratings on service cards, quoted testimonials. All forbidden for us anyway.
- A first phone screen with no name, no rating and no action (Bryant on phone).
- Light gray body text on white (Scotch Pine uses 60 percent gray at 13px).
- For groomers: cartoon paw prints on every surface and Comic style rounded fonts. For nail salons: glitter backgrounds and lipstick pink on everything.

## Photography without photos of the business

Spec note: `SPEC.md` says demos are one self contained file with "no images required" and no external requests besides Google Fonts. Every direction below renders fully with inline SVG, CSS gradients and grain, and treats stock photos as optional. If Jamey approves stock, the generator should use licensed images (Unsplash or Pexels license) saved locally in the repo and inlined, never hotlinked, and keep these rules:

- Subjects are generic and cannot be mistaken for the business: tools on a counter, an empty chair, a towel, hands at work cropped at the wrist, the back of a head with a fresh fade, a mirror reflection with no face. Never a face presented as one of their barbers, stylists or artists.
- Treat every stock photo in the direction's style (duotone, black and white, darkened) so that it reads as mood, not as their shop.
- Each photo carries a small corner tag, "Stock photo. Your work goes here." so the owner sees what to replace.
- SVG fallbacks per direction are described below (halftone clipper silhouette, chair line drawing, swatches, stencil flash, cutout dog shape).

## Design directions

Eight directions, four for barbers and four for salons and studios. Each differs in layout, type and color, not only palette. All fonts are on Google Fonts. None uses League Gothic or Hanken Grotesk, which are Kija's own pitch page fonts, and none reuses the auto template's Big Shoulders or Barlow.

### 1. `barber-after-hours`: dark classic shop

Suits: barber, tattoo. Mood: late evening in a well kept shop, warm light, leather and brass, confident and quiet.

- Hero: full bleed dark image area (stock chair or tools in warm duotone, or an SVG of a chair in brass line work over a radial warm glow and film grain). Centered compressed uppercase headline, the business name on one line and the city on the next. One line promise from the service list. Two pills: brass Book Now with an arrow chip, dark translucent phone pill. Rating chip under the pills.
- Section order: header, hero, rating strip (big 4.9 numeral, five brass stars, "165 Google reviews"), service menu, barbers placeholder, gallery strip, how booking works (3 steps), booking form, visit and hours, FAQ, closing Book band, footer.
- Typography: Antonio 600 and 700 uppercase for display (tight, 0.01em tracking, 88 to 120px hero on desktop, 56px on phone), Archivo 400 and 500 body at 17px, Fraunces italic 400 (opsz 48) for small eyebrow words ("the menu", "your chair").
- Palettes: Brass and Smoke, Oxblood Leather, Emerald Club (hex values in the palette table below).
- Imagery: warm duotone or darkened color photos, strong vignette, grain overlay at 6 percent. SVG fallback: brass line drawing of a barber chair and a clipper, drawn with 1.5px strokes.
- Signature details: brass hairline rules; a numbered service menu (01, 02, 03) with dotted leaders that end in "ask" instead of a price; floating Book pill bottom right on desktop; phone bottom bar with Call and Book; section numbers in Fraunces italic.

### 2. `barber-fade-lab`: bright modern fade studio

Suits: barber, hair-salon. Mood: daytime, loud, friendly, fast, neighborhood shop with a sense of humor.

- Hero: split. Left, a huge italic extra condensed headline in two or three short lines (the promise, then the city). Right, a rounded 28px media card (stock fresh fade from behind, or an SVG clipper over a color block with a checkerboard corner). Two pill buttons in ink and volt. A tilted sticker badge with the real rating.
- Section order: header, hero, bento row of three color cards (Book online, rating, city or hours to confirm), service chips grid, how it works in three bold numbered cards, barbers placeholder as colored cards, gallery grid with rounded tiles, booking form in a volt panel, visit, FAQ accordion, footer with a checkerboard strip.
- Typography: Sofia Sans Extra Condensed 800 italic uppercase for display (100 to 140px desktop, 64px phone), DM Sans 400, 500 and 700 for body and buttons.
- Palettes: Chalk and Volt, Sky Court, Mint Shop.
- Imagery: bright, color, slightly high contrast, placed inside rounded cards, never full bleed. SVG fallback: flat clipper, comb and spray bottle icons on color blocks.
- Signature details: checkerboard SVG strips as dividers; rotated rating sticker (star and "4.9 on Google"); every card a different accent from the palette; chunky 2px ink outlines on cards and buttons with a hard 4px offset shadow.

### 3. `barber-cover-story`: editorial street magazine (recommended for Most Famous Cutz)

Suits: barber, hair-salon, tattoo. Mood: a magazine cover about the shop, bold, a little fashion, very sure of itself.

- Hero: the first screen is one flood color. The business name is the masthead across the full width in a display serif, roman with one italic word. Under it, a mono "issue line": city, state and today's month and year from `now`. Cover lines down one side: the rating and review count, the top three services, "Book your chair". One small inset image frame (stock or an SVG halftone portrait silhouette) overlapping the masthead.
- Section order: header (wordmark and Book only), cover hero, "The numbers" band in black (4.9 and 165 set as giant serif numerals, "Google reviews"), service contents page ("In this issue": numbered services with page style numbers), barbers as a "Cast" spread with placeholder frames, gallery as a contact sheet grid, booking form styled as a subscription card, visit, FAQ as "Letters" style Q and A, closing masthead repeat, footer.
- Typography: DM Serif Display 400 roman and italic for display (120 to 180px masthead on desktop, tracking -0.04em; 64 to 72px on phone), IBM Plex Mono 400 and 500 uppercase for small copy and labels, Inter Tight 500 and 600 for buttons and nav.
- Palettes: Blood Orange, Dallas Red, Electric Cobalt, Acid Lime (four, pick by hash).
- Imagery: black and white photos with a halftone dot treatment (CSS mask or SVG pattern), set inside hard edged frames with a thin black border. SVG fallback: halftone clipper or profile silhouette built from a dot pattern.
- Signature details: masthead name; mono issue line; cover lines with small arrows; a scrolling marquee of service names in italic serif; black pill Book button floating bottom right; page numbers in the section corners.

### 4. `barber-gallery-mono`: minimal monochrome gallery

Suits: barber, hair-salon, tattoo. Mood: calm, architectural, premium appointment only studio.

- Hero: near full screen image area in gray scale (stock empty shop, or an SVG of mirrors and chairs as flat gray planes). The business name set in very wide spaced caps across the image, bottom aligned. On phone the name, rating and Book sit above the image (fixing Bryant's phone weakness).
- Section order: header with a hard square Book button, hero, mono eyebrow and centered intro, rating figure, services as a two column list with thin rules, barbers as a four up grid of gray placeholder frames, gallery as an asymmetric 3 column grid, booking form, visit, FAQ, footer.
- Typography: Syncopate 700 uppercase for the wordmark only (letter spacing 0.4em), Geist 300, 400 and 600 for headings and body, Geist Mono 400 uppercase for eyebrow labels at 12px with 0.2em tracking.
- Palettes: Gallery White, Concrete, Midnight.
- Imagery: strict black and white, low contrast, generous margins, no duotone color. SVG fallback: flat gray geometric interior.
- Signature details: mono eyebrows over every heading; lots of whitespace (section padding 160px desktop); hard square buttons, no radius anywhere; a thin progress rule under the header on scroll.

### 5. `salon-linen-editorial`: soft editorial salon

Suits: hair-salon, nail-salon. Mood: light, warm, considered, like a salon with plants and good linen.

- Hero: asymmetric split on linen. Left, a large serif sentence with one italic phrase and a small sans intro line. Right, a tall arched image (border radius 999px 999px 0 0) holding a stock hair detail or an SVG of soft gradient waves. Book button in ink, a text link to call.
- Section order: header, hero, italic marquee (services or the city) with four point sparkle separators, rating block as a serif pull figure, "What we do best" service list with short descriptions, consultation callout for color and extensions, stylists placeholder grid, gallery of arched and rectangular tiles, booking request form, visit, FAQ, closing "Book your chair" band, footer.
- Typography: Instrument Serif 400 roman and italic for display (72 to 110px, tracking -0.02em), Figtree 400 and 500 for body and UI.
- Palettes: Linen, Clay, Sage Room.
- Imagery: warm, soft focus, natural light, light grain, arched and rounded masks. SVG fallback: layered soft gradients that suggest hair waves, and a sparkle glyph.
- Signature details: the arch mask; the sparkle separator; italic marquee; thin champagne rules; buttons as pills with 1px ink outline that fill on hover.

### 6. `nail-swatch-pop`: color swatch nail studio

Suits: nail-salon, hair-salon. Mood: playful, glossy, pastel sorbet, very social media native.

- Hero: full width pastel field with a row of large glossy polish swatch circles (SVG with a highlight) across the bottom, headline in condensed caps with one italic serif word, Book pill. Optional stock macro hand photo inside a rounded rectangle on the right.
- Section order: header, hero, rating card, service menu as swatch cards (each service its own pastel), "How your visit works" in three steps, nail art gallery as a masonry of rounded tiles, booking form (service, add ons, day and time, name, phone), visit, FAQ, footer with a swatch row.
- Typography: Archivo Narrow 600 and 700 uppercase for display, Newsreader italic 400 (opsz) for the accent word, Work Sans 400 and 500 body.
- Palettes: Peach Sorbet, Cherry Gloss, Lilac Chrome.
- Imagery: bright macro, soft shadow, pastel backgrounds; photos sit in rounded tiles. SVG fallback: swatch circles and a simple hand outline with colored nails.
- Signature details: glossy swatch circles as bullets and dividers; each section tinted a different sorbet; rounded 20px tiles; small chrome gradient accents on the rating card.

### 7. `tattoo-ink-noir`: black studio with flash sheet

Suits: tattoo, barber. Mood: serious craft, gallery at night, respectful of the art.

- Hero: full bleed black and white grainy image area (stock stencil, machine on a tray, or an SVG flash sheet pattern at low opacity). Centered wide tracked name, a one line promise, address or city in mono under it. Two buttons: "Start a custom piece" (inquiry) and Call.
- Section order: header, hero, rating strip in mono, styles offered (from services, as a grid of mono labeled tiles), artists placeholder grid (the main navigation on real tattoo sites), "How a custom piece works" (inquiry, consultation, appointment, aftercare), inquiry form (placement, approximate size, style, color or black and gray, preferred artist "Any artist", name, phone), visit, aftercare and FAQ (generic, no health claims), footer.
- Typography: Bebas Neue 400 uppercase for display with 0.18em tracking, Space Mono 400 and 700 for body and labels.
- Palettes: Bone and Black, Red Flash, Cobalt Stencil, Flash Sheet (a light option).
- Imagery: black and white only, heavy grain, high contrast. SVG fallback: an original flash sheet of simple line motifs (dagger, rose, swallow, star) drawn fresh, never traced from any studio's flash.
- Signature details: mono labels in brackets; one signal color used only for the primary button and the rating stars; thin white frames around images; 18+ and ID reminders only as generic FAQ language, never as a claim about the shop.

### 8. `pet-bath-club`: bright boutique groomer

Suits: pet-grooming. Mood: happy, clean, a little fancy, trustworthy for nervous owners.

- Hero: color field with a large soft blob shape holding a cutout dog (stock with transparent background, or an SVG dog silhouette), floating SVG props (comb, bubbles, bow, scissors), and a speech bubble sticker with the rating. Headline in a friendly grotesk, two buttons: Book a groom and Call.
- Section order: header, hero, rating card, services as rounded tiles with inline SVG icons (full groom, bath and brush, nail trim, de shed, puppy groom), "Your first visit" in four steps, gallery of rounded "fresh from the tub" tiles, booking request form (pet name, breed, size, coat notes, first visit), visit, FAQ (vaccination and temperament questions phrased generically), footer.
- Typography: Bricolage Grotesque 700 and 800 for display (tight tracking), Nunito Sans 400 and 600 body.
- Palettes: Bubblegum, Sky Bath, Walnut Club (a boutique option, see London Dog Grooming Co.).
- Imagery: cutout pets on color blobs, bright and clean; no full bleed photos. SVG fallback: dog silhouette, bubbles and props.
- Signature details: blob shapes behind every image; bubble particles as section dividers; speech bubble rating sticker; rounded 24px everything; paw prints used at most once.

## Palette tokens

Tokens: bg, surface, ink, muted, accent (primary button and stars), accent2 and accent3 (supporting). Check ink on bg and on-accent text for 4.5:1 before shipping a palette.

| Direction | Palette | bg | surface | ink | muted | accent | accent2 | accent3 |
|---|---|---|---|---|---|---|---|---|
| barber-after-hours | Brass and Smoke | #0f0d0b | #1a1612 | #f2eadf | #a89c8c | #c9a15a | #7a1f1f | #3a3129 |
| barber-after-hours | Oxblood Leather | #120a0a | #1f1212 | #f4e9dc | #b09a8c | #b0392e | #d8b27a | #3b2020 |
| barber-after-hours | Emerald Club | #0b1110 | #13201c | #efe8da | #98a69d | #caa35e | #1f5a47 | #2a3a33 |
| barber-fade-lab | Chalk and Volt | #f6f1ea | #ffffff | #111111 | #55504a | #e4ff3a | #ff6b5a | #2145d6 |
| barber-fade-lab | Sky Court | #eef4fb | #ffffff | #0d1b2a | #4a5a6b | #2f6bff | #ffd23f | #ff5fa2 |
| barber-fade-lab | Mint Shop | #f3f7f2 | #ffffff | #0f1a14 | #4f5d54 | #3ddc84 | #ff8a3d | #6b4eff |
| barber-cover-story | Blood Orange | #ff5a1f | #0a0a0a | #0a0a0a | #3a1a0e | #0a0a0a | #ffffff | #f4efe6 |
| barber-cover-story | Dallas Red | #e1261c | #0b0b0b | #0b0b0b | #3d0c09 | #0b0b0b | #ffffff | #f5f0e8 |
| barber-cover-story | Electric Cobalt | #2438ff | #0a0a0a | #ffffff | #c9ceff | #0a0a0a | #f5f3ee | #ff5a1f |
| barber-cover-story | Acid Lime | #d7ff3d | #0b0b0b | #0b0b0b | #3f4a12 | #0b0b0b | #f4f1ea | #ff4fa0 |
| barber-gallery-mono | Gallery White | #ffffff | #f2f2f2 | #111111 | #6b6b6b | #111111 | #e3e3e3 | #404040 |
| barber-gallery-mono | Concrete | #e9e7e3 | #dcd9d3 | #1b1b1b | #6f6b65 | #1b1b1b | #c9c5be | #8a857d |
| barber-gallery-mono | Midnight | #0e0f11 | #17191c | #ececec | #8a8f96 | #ececec | #2a2d31 | #5c6168 |
| salon-linen-editorial | Linen | #faf7f2 | #f1ebe1 | #16130f | #6f675c | #16130f | #b08d57 | #e7dccb |
| salon-linen-editorial | Clay | #f6efe8 | #ead9c9 | #2a1d16 | #7a6356 | #b4623d | #2a1d16 | #dcc3ad |
| salon-linen-editorial | Sage Room | #f4f3ee | #e2e6dc | #1d2320 | #5f6a63 | #1d2320 | #6f8466 | #c9d2c2 |
| nail-swatch-pop | Peach Sorbet | #fff3eb | #ffffff | #0b1320 | #5a5f68 | #0b1320 | #ffb990 | #b5d1c0 |
| nail-swatch-pop | Cherry Gloss | #fbf6f1 | #ffffff | #1a0b10 | #6b5a5f | #d7263d | #f7c6cf | #2b2b2b |
| nail-swatch-pop | Lilac Chrome | #f5f3fb | #ffffff | #16132a | #5e5a75 | #16132a | #b9a8ff | #ff9ecf |
| tattoo-ink-noir | Bone and Black | #0b0b0b | #151515 | #ededed | #9a9a9a | #ededed | #2a2a2a | #5a5a5a |
| tattoo-ink-noir | Red Flash | #0b0b0b | #161212 | #efe9df | #9e958b | #d11f2e | #2b1b1b | #efe9df |
| tattoo-ink-noir | Cobalt Stencil | #0c0d12 | #151722 | #ecebe6 | #8e909c | #3a4bff | #23263a | #ecebe6 |
| tattoo-ink-noir | Flash Sheet (light) | #efe7d6 | #e5dac4 | #111111 | #5b5448 | #c2272d | #1f4e79 | #111111 |
| pet-bath-club | Bubblegum | #fff7f0 | #ffffff | #2a1b3d | #6b5f78 | #ff6fa5 | #7cc8ff | #ffd166 |
| pet-bath-club | Sky Bath | #f2f8ff | #ffffff | #10233f | #56657a | #3a86ff | #ffbe0b | #8ce0c4 |
| pet-bath-club | Walnut Club | #faf6f0 | #ffffff | #2b1d14 | #6e5d50 | #7a4a2a | #e8d5bd | #d9534f |

Notes: on the cover story floods, body copy sits on the flood only at display sizes; paragraphs move onto the black surface or the paper color. The Chalk and Volt accent is a background color for ink text, never a text color on light backgrounds.

## Recommendation for Most Famous Cutz

Build it on `barber-cover-story` with the Dallas Red or Blood Orange palette. The shop's name already reads like a magazine masthead, and the lead's demo concept asks for "bold editorial". What the page may say, from the lead record only:

- Masthead: "Most Famous Cutz". Issue line: "Dallas, TX" and the build month.
- Cover line: "4.9 stars from 165 Google reviews" (exact values from the record).
- Services: category defaults (Haircuts, Fades, Beard trims, Hot towel shaves, Kids cuts, Line ups), introduced as "The menu, to confirm with the shop". No prices, no durations.
- Barbers: "The cast" with four placeholder frames labeled "Chair 01" to "Chair 04" and a note that barber names and photos come from the owner. No invented names.
- Reviews: the numbers band only. No quotes, no review wall text; the record has no `reviewThemes`.
- Hours and walk ins: not in the record, so the visit block says hours and walk in policy are to confirm with the owner.
- Booking: `presence.booking` is empty, so every Book button opens the in page concept booking form.
- Avoid in copy: "famous" as a claim beyond the name, "best", "#1", "since", "award", "licensed".

If Jamey wants a second option to compare, render `barber-after-hours` in Oxblood Leather; it is the safest fit for a classic Dallas shop.
