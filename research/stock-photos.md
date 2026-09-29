# Stock photography for demos

Researched and verified 2026-09-29. Readers: whoever wires photos into `src/demo/` templates, and Jamey when he reviews a demo before sharing it. The library itself is `src/demo/stock-library.json`. Terms interpretations here are research notes, not legal advice. No em or en dashes are used in this file.

## 1. Why this exists

Strong barber, salon, auto, collision, home service and contractor sites are photo led: work in progress, hands, tools, the room. Our demos have had no photos at all, which is part of why they read as one template with a palette swap. This library gives the generator 58 licensed, hand checked stock photos in six groups so a demo can look like the best sites in its field without using anyone else's photos, logos or trade dress.

| group | photos | covers |
|---|---|---|
| barber | 10 | fades and lineups in progress, straight razor and hot towel shaves, beard trims, tools, a shop interior |
| salon | 10 | two salon interiors, shampoo, color, foils, manicure, polish, tattoo in progress, two pet grooming |
| auto | 10 | undercarriage, bench engine work, an independent shop bay, electrical diagnostics, tire change on a lift, engine bay hands, two diesel truck shots, under lift repair |
| collision | 9 | spray gun and paint booth, bare metal bodywork, paint correction polishing, finish inspection, wipe down, interior detail |
| home | 9 | rooftop HVAC repair, outdoor condenser, electrical panel, two plumbing, service van, technician at van, two clean interiors |
| contractor | 10 | roof tear off, roof detail, concrete screed, two fences, pool, hedge trimming, landscaped front yard, painting, kitchen remodel |
| **total** | **58** | |

## 2. The licenses

### Unsplash License ([unsplash.com/license](https://unsplash.com/license))

- Photos can be downloaded and used for free, for commercial and noncommercial purposes, and modified. No permission is needed from the photographer or Unsplash.
- Attribution is not required but appreciated. Unsplash suggests "Photo by Name on Unsplash".
- Not allowed: selling photos without significant modification, and compiling Unsplash photos to build a similar or competing service.
- The [Unsplash Terms](https://unsplash.com/terms) say the license does not cover trademarks, logos or brands that appear in a photo, or the likeness of recognizable people. Depending on the use, permission from the brand owner or the person may be needed. This is why the library excludes logos and signage and records whether a face is visible.
- Unsplash+ photos (served from `plus.unsplash.com`) are under a different, paid license. Every Unsplash photo here was checked on its own page data as `premium: false, plus: false` and is served from `images.unsplash.com`.
- Hotlinking: the [Unsplash hotlinking guideline](https://help.unsplash.com/en/articles/2511271-guideline-hotlinking-images) and the [API Terms](https://unsplash.com/api-terms) require API apps to display the `images.unsplash.com` URLs the API returns, so every view counts for the photographer, and to credit the photographer and Unsplash with a link. We picked these photos by hand, not through the API, so those API rules do not strictly bind us, but we follow them anyway: hotlink, credit, link.

### Pexels License ([pexels.com/license](https://www.pexels.com/license/))

- All photos are free to use and modify. Attribution is not required but appreciated. Pexels suggests "Photo by Name on Pexels".
- Not allowed: showing identifiable people in a bad light or in an offensive way; selling unaltered copies (posters, prints, products); implying that people or brands in the image endorse your product; redistributing or selling the photos on other stock or wallpaper platforms; using a photo as part of a trademark, design mark, trade name, business name or service mark.
- The [Pexels Terms](https://www.pexels.com/terms-of-service/) (last updated November 15, 2024) say some content may carry other rights, including identifiable people, logos and brands, that Pexels does not warrant any consents were obtained, and that deciding whether permission is needed is the user's responsibility. Same conclusion as Unsplash: no logos, and be careful with faces.
- Hotlinking: neither the license nor the terms mention it. The [Pexels API documentation](https://www.pexels.com/api/documentation/) returns `images.pexels.com` URLs for apps to display and asks for a prominent link to Pexels and a photographer credit where possible. On 2026-09-29 `images.pexels.com` served every library URL with `Access-Control-Allow-Origin: *` and a one year cache, including to a third party referrer.

### What this means for a demo

1. Using these photos in a private concept, and later on the owner's real site, is within both licenses.
2. Using a photo as the business's logo or as part of its name is not allowed (Pexels), and would be misleading anyway.
3. A photo must never suggest that the people in it work at, own or endorse the business. See section 4.
4. Duotone, darkening, grain and cropping are fine. Both licenses allow modification.

## 3. The library file

`src/demo/stock-library.json`:

```js
{
  updatedAt: "2026-09-29",
  licenses: { unsplash: { name, url, commercialUse, attributionRequired, notes, termsUrl, hotlinking }, pexels: { ... } },
  photos: [
    {
      id: "barber-fade-trimmer-closeup",   // stable, unique, group prefixed
      group: "barber",                     // barber | salon | auto | collision | home | contractor
      subject: "Skin fade with a trimmer, close up",
      alt: "Barber's hands edging a skin fade above a client's ear with a trimmer",
      orientation: "landscape",            // every photo in this version is landscape
      source: "unsplash",                  // unsplash | pexels
      pageUrl: "https://unsplash.com/photos/...",   // the photo's own page, where subject and photographer were confirmed
      url: "https://images.unsplash.com/photo-...?auto=format&fit=crop&w=1600&q=80",
      photographer: "William Argueta",
      photographerUrl: "https://unsplash.com/@willarguetamedia",
      licenseUrl: "https://unsplash.com/license",
      verifiedAt: "2026-09-29",
      // added beyond the requested shape, because the design research needs them:
      people: "partial",                   // none | hands | partial | face (see section 4)
      focus: "60% 40%",                    // CSS object-position that keeps the subject in a 4:5 or 16:9 crop
      sourceWidth: 6016, sourceHeight: 4016
    }
  ]
}
```

- Group mapping from `config/categories.json` keys: `barber` uses barber; `hair-salon`, `nail-salon`, `tattoo`, `pet-grooming` use salon; `auto-body-collision` and `auto-detailing` use collision first, then auto; every other auto key uses auto; `hvac`, `plumbing`, `electrical`, `septic`, `garage-door`, `restoration`, `appliance-repair`, `pest-control` use home; contractor keys use contractor; `general` uses no photos unless Jamey picks a group. Within a group, prefer photos whose subject matches the lead's sourced `services` (for example the diesel shots for `diesel-truck-repair`, the pet photos for `pet-grooming`, the tattoo photo for `tattoo`).
- Choose deterministically (hash the lead id, like palettes) so a rebuild shows the same photos, and never repeat a photo within one demo.
- Sizes: `url` is about 1600 wide. To change size, change only the query parameters: Unsplash `w`, `h`, `fit=crop`, `q`; Pexels `w`, `h`, `fit=crop`. Never change the path. A `srcset` at 800, 1200 and 1600 wide is a good default.
- Crops: all 58 are landscape and crop cleanly to 16:9 and 3:2. For a 4:5 or taller crop set `object-fit: cover` and `object-position` from `focus`; the focus values were estimated from the photos, so check the crop at 390 wide before a demo ships.
- Unsplash URLs use `auto=format`, so modern browsers get AVIF or WebP and older clients get the original JPEG. Pexels URLs return JPEG (AVIF when the browser asks for it).

## 4. People, captions and credits (required)

### People

The `people` field says what a photo shows:

| value | meaning | count |
|---|---|---|
| none | no people | 15 |
| hands | only hands or arms | 17 |
| partial | people with no clear face: backs of heads, cropped bodies, a small far figure, a face hidden by a hat or towel | 17 |
| face | a recognizable face | 9 |

Rules:

- Home service and contractor directions use `none` and `hands` photos by default (research/design-home-contractor.md: a stock person implies staff or customers who do not exist). `partial` is acceptable for a crew or work in progress shot. `face` photos in those groups are for Jamey to opt into, never automatic.
- Barber and salon directions may use `partial` and `face` photos, because strong sites in those fields show work on real heads, but always as mood images treated in the direction's style, never as a team section.
- Never place any photo with people next to a team section, a named staff member, a rating block, review themes or anything that reads as a customer or employee of this business. Never caption a photo "our team", "our shop", "our work", "our customers" or with a name.
- No before and after pairs. A stock "after" photo would read as the business's result.

### Captions and alt text

- Use `alt` as written and end it with ", stock photo" so screen reader users get the same disclosure (research/design-home-contractor.md).
- Visible captions are optional. If used, describe the scene generically ("Hot towel shave"), never as this business's work.
- Optional small corner tag on each photo, per research/design-barber-salon.md: "Stock photo. Your work goes here."

### Concept ribbon

The ribbon sentence the guardrails require stays exactly as it is. When a demo shows any library photo, add this sentence after it, in the same ribbon:

> Photos are stock placeholders for the owner's own.

So the full ribbon reads: "Private concept by Kija Creative for {business}. Not the official website. Details to confirm with the owner. Photos are stock placeholders for the owner's own."

### Footer credit line

When a demo shows any library photo, the footer carries one small credit line listing every photo used, in page order, grouped by source:

> Stock photos: William Argueta and Antonio Reynoso on Unsplash; Daniel Cosma and Gustavo Fring on Pexels.

- Link each photographer name to its `photographerUrl`, and "Unsplash" and "Pexels" to `https://unsplash.com` and `https://www.pexels.com`. Links carry `rel="noopener"`. Linking the name to `pageUrl` instead is also fine.
- Use the `photographer` value as stored. A few names were cleaned for house style (an emoji flag and a trademark sign removed, a trailing period dropped).
- The credit line is part of the demo, not decoration: the licenses do not require it, but the Unsplash API rules and the Pexels API guidelines ask for it, and it tells the owner these are not their photos.

## 5. What has to change before a demo can use this

The library is data only. Using it in a demo needs changes in files this research does not own:

1. **SPEC.md, Demo generator section**: it says every demo is one self contained file with no external requests besides Google Fonts and "no images required". Add a rule that a demo may load images only from URLs listed in `src/demo/stock-library.json`, with the ribbon sentence and footer credit above.
2. **`src/demo/guardrails.js`**: today it rejects any `<img>`, `<picture>` or media tag (line 219), any `<img src="https://...">` or `srcset` URL (line 203), any remote CSS `url()` (line 211) and image data URLs (line 222). It needs an allow list built from the library file: an image may appear only if its URL, ignoring size parameters, matches a library `url`, and then the demo must contain the photos sentence in the ribbon and a footer credit naming each photographer used. Everything else stays rejected, so no other business's image can slip in.
3. **Templates**: keep the no photo mode (CSS and inline SVG) as the fallback. A photo slot must render correctly if the image fails to load.
4. Add `referrerpolicy="no-referrer"`, `loading="lazy"` (except the hero), `decoding="async"`, explicit `width` and `height`, and `alt` to every `<img>`. No referrer means the image hosts never see a local path or lead id.

Hotlinking versus inlining: research/design-barber-salon.md suggested saving photos locally and inlining them. Hotlinking is the better default here: it is what Unsplash asks for, it keeps demo files small (the 16MB limit), and photographer view counts stay honest. The trade off is that a shared concept file needs a network connection to show photos. Both licenses allow downloading, so an export step may inline the chosen images later if Jamey wants offline files; the ribbon sentence and footer credit stay either way.

## 6. How the photos were chosen and verified

Selection rules applied to every photo:

- Looks like a premium small business site: sharp, well lit, real work or real rooms, no cheesy thumbs up or handshake stock.
- No visible business names, logos, license plates, readable signage or watermarks, and nothing that implies a specific real shop.
- Crops well to 16:9 and 4:5 (landscape originals with a clear subject).

Process:

1. Searched Unsplash (free photos only, landscape) and Pexels with 6 to 15 queries per group, about 2,500 candidates.
2. Reviewed about 2,300 of them as contact sheets, then about 230 shortlisted photos at 1,000 wide, then zoomed into signage, shirts, vehicles and equipment at 1,600 wide for anything readable.
3. For every pick: an HTTP GET of `url` returned 200 with an image content type (all 58 JPEG for a plain request, AVIF when the request accepts AVIF); the photo's own page loaded and confirmed the photographer and subject; for Unsplash the page data confirmed it is not Unsplash+; for Pexels the page data confirmed the Pexels license. The 1600 wide URL was fetched again from the finished file on 2026-09-29.

Rejected during review, as examples of what the rules catch: a condenser with a manufacturer logo on its face; a roofing crew wearing a solar company's branded shirts and caps; a salon photo whose Unsplash description names and advertises the real salon it was shot in; a fence with a fence company's sign on the post; a wheelbarrow with a readable tool brand; roofing underlayment printed with a brand name; a shop with branded oil drums; a mixer truck with a readable plate and company name; shirts with printed company names; car maker badges in focus (several European car shots); and photos posted by accounts named after a lawn care company, a pool company, a tile retailer and a trade fair, whose credit line would name a business.

Known small compromises Jamey may want to swap:

- `contractor-concrete-screed`: the Pexels account that posted it is a Vietnamese concrete company, so the credit line shows a company name ("SÀI GÒN CÔNG TY CP SẢN XUẤT - THƯƠNG MẠI"). Nothing in the photo names them. It was the only strong concrete pour photo without branded vests or plates.
- `auto-underside-inspection`: the mechanic's shirt has a small plain white patch with no readable text.
- `home-electrical-panel-work`: the panel carries an equipment tag ("AEPL-010"), not a business name.
- Vehicles in some auto and collision photos are recognizable by shape (a red semi, a vintage body shell) but show no badge in focus.

## 7. Keeping it current

- Re-run the URL check before building a share file, and at least monthly: a GET of every `url` must return 200 and an image type. Drop any photo that fails, and update `verifiedAt` on the ones that pass.
- Add photos only after the same review: licensed page confirmed, no logos or signage, `people` and `focus` set, alt written plainly, no dash characters (`npm run check` scans the file).
- Never add a photo from a business's Google profile, social accounts or website, and never add Unsplash+ or paid stock without recording its license.

## 8. Photo list

| id | subject | source | photographer | people |
|---|---|---|---|---|
| `barber-fade-trimmer-closeup` | Skin fade with a trimmer, close up | Unsplash | William Argueta | partial |
| `barber-fade-from-behind` | Fade in progress, seen from behind | Pexels | Daniel Cosma | partial |
| `barber-lineup-clipper-comb` | Lineup with clipper and comb | Pexels | Brian Silva | partial |
| `barber-clipper-cut-in-chair` | Clipper cut in the chair | Pexels | Gustavo Fring | partial |
| `barber-razor-detail` | Straight razor detail on a fade | Pexels | izzet çakallı | partial |
| `barber-hot-towel-shave` | Hot towel straight razor shave | Pexels | alexandre saraiva carniato | partial |
| `barber-straight-razor-beard` | Straight razor beard shave | Unsplash | Antonio Reynoso | face |
| `barber-beard-trim-clipper` | Beard trim with a clipper | Pexels | Gustavo Fring | partial |
| `barber-tools-razors-brush` | Razors and shaving brush on a towel | Pexels | Nikolaos Dimou | none |
| `barber-vintage-chairs-interior` | Barbershop interior with vintage chairs | Pexels | wal_ 172619 | none |
| `salon-interior-styling-stations` | Salon interior with styling stations | Unsplash | Giorgio Trovato | partial |
| `salon-interior-backwash` | Salon floor with backwash chairs | Pexels | Max Vakhtbovych | none |
| `salon-shampoo-backwash` | Shampoo at the backwash | Unsplash | Lindsay Cash | face |
| `salon-color-application` | Color application | Pexels | Maria Geller | hands |
| `salon-foil-highlights` | Foil highlights | Unsplash | Ionela Mat | partial |
| `salon-manicure-at-table` | Manicure at the table | Unsplash | Giorgio Trovato | hands |
| `salon-nail-polish-red` | Red polish application | Pexels | Gabriel Puyén | hands |
| `salon-tattoo-machine-detail` | Tattoo in progress | Unsplash | benjamin lehman | hands |
| `salon-dog-grooming-scissors` | Scissor finish on a small dog | Unsplash | Buddy AN | hands |
| `salon-dog-grooming-table` | Grooming at the table | Pexels | Tima Miroshnichenko | face |
| `auto-underside-inspection` | Undercarriage inspection | Pexels | Jose Ricardo Barraza Morachis | partial |
| `auto-engine-head-rebuild` | Engine rebuild on the bench | Pexels | Artem Podrez | partial |
| `auto-independent-shop-bay` | Independent shop bay | Unsplash | Kato Blackmore | partial |
| `auto-electrical-diagnostics` | Electrical diagnostics | Unsplash | Maxim Hopman | hands |
| `auto-tire-change-on-lift` | Tire change on the lift | Pexels | Gustavo Fring | face |
| `auto-engine-wrench-hands` | Hands on the engine | Unsplash | Christian Buehner | hands |
| `auto-diesel-truck-engine` | Truck engine service | Pexels | Gustavo Fring | face |
| `auto-diesel-semi-in-bay` | Semi truck in the bay | Pexels | cottonbro studio | partial |
| `auto-under-lift-repair` | Repair under the lift | Pexels | Enis Yavuz | partial |
| `auto-engine-bay-hands` | Engine bay work | Pexels | Jose Ricardo Barraza Morachis | hands |
| `collision-spray-gun-parts` | Spray gun on painted parts | Pexels | Dextar Studio | hands |
| `collision-paint-booth-shell` | Body shell in the paint booth | Pexels | Vladan Rajkovic | none |
| `collision-bare-metal-bodywork` | Bare metal bodywork | Unsplash | Egor Vikhrev | none |
| `collision-dual-action-polish` | Paint correction polish | Pexels | Khunkorn Laowisit | hands |
| `collision-polisher-red-pad` | Polisher with a red pad | Pexels | Khunkorn Laowisit | hands |
| `collision-rotary-polish-white` | Polishing a white car | Pexels | Khunkorn Laowisit | hands |
| `collision-finish-inspection` | Finish inspection | Unsplash | Mohamed Gado | hands |
| `collision-microfiber-wipe` | Microfiber wipe down | Unsplash | Luay Barani | hands |
| `collision-interior-detail` | Interior detail | Unsplash | Luay Barani | hands |
| `home-hvac-rooftop-repair` | Rooftop AC repair | Pexels | José Andrés Pacheco Cortes | partial |
| `home-hvac-condenser-rain` | Outdoor AC condenser | Unsplash | Sam Jotham Sutharson | none |
| `home-electrical-panel-work` | Electrical panel work | Pexels | ranjeet | face |
| `home-plumbing-under-sink` | Under sink plumbing | Unsplash | Timur Shakerzianov | face |
| `home-plumbing-rough-in` | Plumbing rough in | Pexels | Mikael Blomkvist | face |
| `home-service-van-ladder` | Service van | Pexels | Sonny Sixteen | none |
| `home-technician-at-van` | Technician at the van | Pexels | Tima Miroshnichenko | face |
| `home-living-room-bright` | Bright living room | Pexels | Curtis Adams | none |
| `home-living-room-fireplace` | Living room with fireplace | Unsplash | Zac Gudakov | none |
| `contractor-roof-tear-off` | Roof tear off | Unsplash | Zohair Mirza | partial |
| `contractor-roof-shakes-detail` | Roof detail | Unsplash | Christian Harb | none |
| `contractor-concrete-screed` | Concrete pour and screed | Pexels | SÀI GÒN CÔNG TY CP SẢN XUẤT - THƯƠNG MẠI | partial |
| `contractor-wood-rail-fence` | Wood rail fence | Pexels | Lynn Elder | none |
| `contractor-privacy-fence-yard` | Privacy fence | Unsplash | kev | none |
| `contractor-backyard-pool` | Backyard pool | Pexels | Max Vakhtbovych | none |
| `contractor-hedge-trimming` | Hedge trimming | Pexels | Magda Ehlers | hands |
| `contractor-landscaped-front-yard` | Landscaped front yard | Pexels | Christopher Moon | none |
| `contractor-paint-roller-wall` | Painting a wall | Unsplash | Andrew Itaga | hands |
| `contractor-kitchen-remodel` | Kitchen remodel | Pexels | Curtis Adams | none |
