// Concrete meaning of every axis value: the font pairings each typography classification may
// use, the radius tokens of each geometry, the limits of each motion level, and the sentences
// the prompt builder uses so a building agent never has to guess what "editorial-split" means.
// The renderer and the audit read the same tables, so a declared DNA and a measured page agree.
import type {
  FontFace,
  FontPairing,
  GeometryStyle,
  HeroStyle,
  ImageryStyle,
  LayoutRhythm,
  MotionStyle,
  NavigationStyle,
  TypographyStyle,
} from "./schema.ts";

// ---------------------------------------------------------------------------------------------
// Typography: Google Fonts pairings per classification. Inter is never a default here, and the
// Kija brand faces (League Gothic, Hanken Grotesk) are kept for Kija's own pages.
// ---------------------------------------------------------------------------------------------

const SANS = "system-ui, -apple-system, \"Segoe UI\", Roboto, Arial, sans-serif";
const SERIF = "Georgia, \"Times New Roman\", serif";
const MONO = "ui-monospace, \"SFMono-Regular\", Menlo, Consolas, monospace";

function face(family: string, weights: number[], fallback: string, classification: string, italic = false): FontFace {
  return italic ? { family, weights, italic, fallback, classification } : { family, weights, fallback, classification };
}

export const FONT_PAIRINGS: readonly FontPairing[] = [
  // serif-sans: editorial serif display over a restrained sans
  { id: "newsreader-public-sans", typography: "serif-sans", display: face("Newsreader", [500, 600], SERIF, "transitional text serif, optical sizes", true), body: face("Public Sans", [400, 500, 600], SANS, "neutral grotesk"), note: "Quiet authority: headlines read like a well set magazine, body stays plain and legible." },
  { id: "dm-serif-work-sans", typography: "serif-sans", display: face("DM Serif Display", [400], SERIF, "high contrast display serif", true), body: face("Work Sans", [400, 500, 600], SANS, "grotesk with open counters"), note: "Warmer and more confident; suits craftsmanship and residential premium." },
  { id: "playfair-source-sans", typography: "serif-sans", display: face("Playfair Display", [600, 700], SERIF, "high contrast didone", true), body: face("Source Sans 3", [400, 600], SANS, "humanist sans"), note: "Classic contrast pairing; keep Playfair at display sizes only." },
  // sans-only: one well drawn sans family carries everything
  { id: "archivo-only", typography: "sans-only", display: face("Archivo", [700, 800], SANS, "grotesk with width axis"), body: face("Archivo", [400, 500], SANS, "grotesk"), note: "One family, hierarchy from weight and size; honest and sturdy." },
  { id: "ibm-plex-sans-only", typography: "sans-only", display: face("IBM Plex Sans", [600, 700], SANS, "engineered grotesk"), body: face("IBM Plex Sans", [400, 500], SANS, "engineered grotesk"), note: "Engineered and practical; good for dense service information." },
  { id: "figtree-only", typography: "sans-only", display: face("Figtree", [700, 800], SANS, "friendly geometric grotesk"), body: face("Figtree", [400, 500], SANS, "friendly geometric grotesk"), note: "Friendly and clear without looking like a SaaS default." },
  // condensed-sans: condensed display plus a readable sans
  { id: "barlow-condensed-barlow", typography: "condensed-sans", display: face("Barlow Condensed", [600, 700, 800], SANS, "condensed grotesk"), body: face("Barlow", [400, 500, 600], SANS, "slightly rounded grotesk"), note: "Signage energy for trades; the condensed face stays in headings and labels." },
  { id: "oswald-source-sans", typography: "condensed-sans", display: face("Oswald", [500, 600, 700], SANS, "condensed gothic"), body: face("Source Sans 3", [400, 600], SANS, "humanist sans"), note: "Bold, blue-collar headline voice over a calm humanist body." },
  { id: "big-shoulders-ibm-plex", typography: "condensed-sans", display: face("Big Shoulders Display", [700, 800], SANS, "industrial condensed display"), body: face("IBM Plex Sans", [400, 500], SANS, "engineered grotesk"), note: "Industrial and loud at display sizes; strictly for headlines and numerals." },
  // editorial-serif: serif led for headings and reading text
  { id: "fraunces-newsreader", typography: "editorial-serif", display: face("Fraunces", [500, 600, 700], SERIF, "soft old style display serif", true), body: face("Newsreader", [400, 500], SERIF, "text serif"), note: "Serif throughout, like a printed feature; body at 18px or larger." },
  { id: "playfair-lora", typography: "editorial-serif", display: face("Playfair Display", [600, 700], SERIF, "didone display", true), body: face("Lora", [400, 500], SERIF, "calligraphic text serif"), note: "Rich and literary; restrained colour so the type carries the page." },
  { id: "libre-caslon-display-text", typography: "editorial-serif", display: face("Libre Caslon Display", [400], SERIF, "caslon display"), body: face("Libre Caslon Text", [400, 700], SERIF, "caslon text", true), note: "Old world bookish authority; generous leading and measure." },
  // humanist-sans: warm, legible, human
  { id: "fira-sans-only", typography: "humanist-sans", display: face("Fira Sans", [600, 700], SANS, "humanist sans"), body: face("Fira Sans", [400, 500], SANS, "humanist sans"), note: "Warm and readable at every size; suits care and family services." },
  { id: "alegreya-sans-source-sans", typography: "humanist-sans", display: face("Alegreya Sans", [700, 800], SANS, "calligraphic humanist sans"), body: face("Source Sans 3", [400, 600], SANS, "humanist sans"), note: "Personable headings with a quiet body; approachable without being cute." },
  { id: "mulish-nunito-sans", typography: "humanist-sans", display: face("Mulish", [700, 800], SANS, "minimal humanist sans"), body: face("Nunito Sans", [400, 600], SANS, "rounded humanist sans"), note: "Soft and calm; good for comfort-led pages." },
  // grotesk: contemporary grotesques
  { id: "schibsted-grotesk-only", typography: "grotesk", display: face("Schibsted Grotesk", [700, 800], SANS, "newspaper grotesk"), body: face("Schibsted Grotesk", [400, 500], SANS, "newspaper grotesk"), note: "Heavy grotesk headlines with the same family for body; confident and modern." },
  { id: "familjen-public-sans", typography: "grotesk", display: face("Familjen Grotesk", [600, 700], SANS, "characterful grotesk"), body: face("Public Sans", [400, 500], SANS, "neutral grotesk"), note: "A grotesk with character over a neutral body; contemporary without trend clichés." },
  { id: "bricolage-figtree", typography: "grotesk", display: face("Bricolage Grotesque", [700, 800], SANS, "expressive grotesk"), body: face("Figtree", [400, 500], SANS, "friendly grotesk"), note: "Expressive display grotesk; use large sizes and tight tracking sparingly." },
  // geometric
  { id: "outfit-figtree", typography: "geometric", display: face("Outfit", [600, 700], SANS, "geometric sans"), body: face("Figtree", [400, 500], SANS, "friendly grotesk"), note: "Clean geometric display over a softer body; modern and bright." },
  { id: "jost-only", typography: "geometric", display: face("Jost", [500, 600, 700], SANS, "futura style geometric"), body: face("Jost", [400, 500], SANS, "futura style geometric"), note: "Futura lineage: stylish, architectural, good with wide letterspaced labels." },
  { id: "red-hat-display-text", typography: "geometric", display: face("Red Hat Display", [700, 900], SANS, "geometric display"), body: face("Red Hat Text", [400, 500], SANS, "geometric text"), note: "Paired optical cuts for display and text; crisp and product-like." },
  // mono-accent: grotesk plus a mono for labels, specs and numerals
  { id: "ibm-plex-sans-mono", typography: "mono-accent", display: face("IBM Plex Sans", [600, 700], SANS, "engineered grotesk"), body: face("IBM Plex Sans", [400, 500], SANS, "engineered grotesk"), accent: face("IBM Plex Mono", [400, 500], MONO, "monospace"), note: "Technical and exact; mono only for labels, specs and data." },
  { id: "work-sans-dm-mono", typography: "mono-accent", display: face("Work Sans", [600, 700], SANS, "grotesk"), body: face("Work Sans", [400, 500], SANS, "grotesk"), accent: face("DM Mono", [400, 500], MONO, "monospace"), note: "Friendlier technical voice; mono accents for numbers and part names." },
  // high-contrast-serif
  { id: "bodoni-moda-karla", typography: "high-contrast-serif", display: face("Bodoni Moda", [500, 600], SERIF, "didone", true), body: face("Karla", [400, 500], SANS, "grotesk"), note: "Fashion contrast at display sizes only; the body stays quiet and small caps carry labels." },
  { id: "playfair-display-manrope", typography: "high-contrast-serif", display: face("Playfair Display", [600, 700], SERIF, "high contrast didone", true), body: face("Manrope", [400, 500], SANS, "modern grotesk"), note: "Classic high contrast over a crisp modern body; luxury without costume." },
  // industrial-condensed
  { id: "anton-roboto-flex", typography: "industrial-condensed", display: face("Anton", [400], SANS, "heavy condensed gothic"), body: face("Roboto Flex", [400, 500], SANS, "neutral grotesk"), note: "Signage weight headlines; body neutral and compact." },
  { id: "saira-condensed-saira", typography: "industrial-condensed", display: face("Saira Extra Condensed", [700, 800], SANS, "industrial condensed"), body: face("Saira", [400, 500], SANS, "technical sans"), note: "Machined display with a matching technical body." },
  // neo-grotesk
  { id: "inter-tight-only", typography: "neo-grotesk", display: face("Inter Tight", [600, 700], SANS, "neo-grotesk display"), body: face("Inter Tight", [400, 500], SANS, "neo-grotesk"), note: "A tight neo-grotesk for precise Swiss hierarchy; never plain Inter." },
  { id: "geist-only", typography: "neo-grotesk", display: face("Geist", [600, 700], SANS, "neo-grotesk"), body: face("Geist", [400, 500], SANS, "neo-grotesk"), note: "Contemporary neo-grotesk; pair with strict grids and generous spacing so it never reads as a default SaaS page." },
  // warm-serif
  { id: "fraunces-nunito-sans", typography: "warm-serif", display: face("Fraunces", [500, 600], SERIF, "soft old style serif", true), body: face("Nunito Sans", [400, 600], SANS, "humanist sans"), note: "Warm and crafted; soft serif headings over a friendly humanist body." },
  { id: "young-serif-source-sans", typography: "warm-serif", display: face("Young Serif", [400], SERIF, "warm display serif"), body: face("Source Sans 3", [400, 600], SANS, "humanist sans"), note: "Neighbourly and confident; suits family, food and local trades." },
  { id: "archivo-jetbrains-mono", typography: "mono-accent", display: face("Archivo", [700, 800], SANS, "grotesk"), body: face("Archivo", [400, 500], SANS, "grotesk"), accent: face("JetBrains Mono", [400, 500], MONO, "monospace"), note: "Workshop spec sheet feel; mono for measurements, codes and hours." },
];

export function pairingsFor(typography: TypographyStyle): FontPairing[] {
  return FONT_PAIRINGS.filter((p) => p.typography === typography);
}

export function fontPairing(id: string): FontPairing | undefined {
  return FONT_PAIRINGS.find((p) => p.id === id);
}

function familyParam(f: FontFace): string {
  const name = f.family.replace(/ /g, "+");
  const weights = [...new Set(f.weights)].sort((a, b) => a - b);
  if (f.italic) return `family=${name}:ital,wght@${[...weights.map((w) => `0,${w}`), ...weights.map((w) => `1,${w}`)].join(";")}`;
  return `family=${name}:wght@${weights.join(";")}`;
}

// One Google Fonts request for the pairing, faces merged when display and body share a family.
export function fontsHref(pairing: FontPairing): string {
  const faces = [pairing.display, pairing.body, ...(pairing.accent ? [pairing.accent] : [])];
  const merged = new Map<string, FontFace>();
  for (const f of faces) {
    const seen = merged.get(f.family);
    merged.set(f.family, seen ? { ...seen, weights: [...seen.weights, ...f.weights], italic: Boolean(seen.italic || f.italic) } : { ...f });
  }
  return `https://fonts.googleapis.com/css2?${[...merged.values()].map(familyParam).join("&")}&display=swap`;
}

export function fontStack(f: FontFace): string {
  return `"${f.family}", ${f.fallback}`;
}

// ---------------------------------------------------------------------------------------------
// Geometry: the radius tokens the renderer declares on :root and the audit measures.
// ---------------------------------------------------------------------------------------------

export interface GeometryTokens {
  control: string;          // --radius-control: buttons, inputs, chips
  surface: string;          // --radius-surface: panels, cards, dialogs
  media: string;            // --radius-media: photos and video frames
  controlRangePx: [number, number]; // what the audit accepts for --radius-control
  rules: string;            // what the geometry means for layout, one or two sentences
}

export const GEOMETRY_TOKENS: Record<GeometryStyle, GeometryTokens> = {
  square: { control: "0px", surface: "0px", media: "0px", controlRangePx: [0, 1], rules: "Hard 90 degree corners everywhere. Separation comes from rules, fills and spacing, never from rounded containers." },
  "subtle-radius": { control: "4px", surface: "6px", media: "4px", controlRangePx: [2, 8], rules: "A small, consistent 4px radius on controls and 6px on surfaces. No pills, no soft blobs, no rounded images beyond 4px." },
  rounded: { control: "10px", surface: "16px", media: "12px", controlRangePx: [8, 24], rules: "Friendly rounded corners, 10px controls and 16px surfaces. Keep radius consistent; never mix in hard square panels." },
  pill: { control: "999px", surface: "20px", media: "16px", controlRangePx: [999, 100000], rules: "Fully rounded buttons and chips as a deliberate signature. Surfaces stay at 20px, images at 16px; do not round everything into pills." },
  mixed: { control: "0px", surface: "14px", media: "999px", controlRangePx: [0, 100000], rules: "A deliberate contrast: square controls, softly rounded panels and one round media motif (portrait or badge). Each radius has one job." },
  architectural: { control: "0px", surface: "0px", media: "0px", controlRangePx: [0, 2], rules: "Square corners with 1px hairline rules, visible grid alignment and generous margins. Structure is drawn with lines, not boxes." },
  "hard-edge": { control: "0px", surface: "0px", media: "0px", controlRangePx: [0, 0], rules: "Zero radius with heavy 2 to 4px rules, solid colour blocks and hard offsets; industrial and loud, never softened." },
  organic: { control: "14px", surface: "28px", media: "40% 40% 40% 40% / 30% 30% 30% 30%", controlRangePx: [10, 999], rules: "Soft, uneven, natural shapes: generous radius on controls, pebble or arch crops on media, no hard rectangles as the main motif." },
  editorial: { control: "2px", surface: "0px", media: "0px", controlRangePx: [0, 3], rules: "Print geometry: square media, near square controls, column rules and wide margins; the grid shows in the type, not in boxes." },
};

// ---------------------------------------------------------------------------------------------
// Motion: limits per level. Every level honours prefers-reduced-motion and never delays content
// or the primary conversion.
// ---------------------------------------------------------------------------------------------

export interface MotionRules {
  maxDurationMs: number;
  keyframes: boolean;       // whether @keyframes animation is allowed at all
  scrollReveal: boolean;
  rules: string;
}

export const MOTION_RULES: Record<MotionStyle, MotionRules> = {
  none: { maxDurationMs: 150, keyframes: false, scrollReveal: false, rules: "No animation. Only instant or very short colour transitions on hover and focus (150ms or less). Nothing moves on scroll." },
  subtle: { maxDurationMs: 300, keyframes: false, scrollReveal: true, rules: "Short fades and 8px rises on first reveal, 300ms or less, once per element. Hover changes colour or underline, never scale." },
  moderate: { maxDurationMs: 500, keyframes: true, scrollReveal: true, rules: "Staggered reveals up to 500ms, image scale on hover up to 1.03, one looping element at most (a slow marquee or ticker)." },
  kinetic: { maxDurationMs: 800, keyframes: true, scrollReveal: true, rules: "Energetic: marquee strips, type that slides in, sticky scroll sequences, up to 800ms. Motion supports hierarchy and never blocks reading." },
  cinematic: { maxDurationMs: 1200, keyframes: true, scrollReveal: true, rules: "Slow, film-like: long crossfades and gentle image pans (scale 1.06 at most) up to 1200ms. Content and CTAs are usable before any motion ends." },
};

export const REDUCED_MOTION_RULE = "Under @media (prefers-reduced-motion: reduce) every animation and transform transition is removed, content is visible without JavaScript, and nothing loops.";

// ---------------------------------------------------------------------------------------------
// Axis meanings for the brief.
// ---------------------------------------------------------------------------------------------

export const HERO_MEANINGS: Record<HeroStyle, string> = {
  "full-bleed": "One edge to edge photograph fills the first screen; the business name and promise sit on a legible scrim in a fixed corner, with the primary CTA visible without scrolling.",
  "editorial-split": "A two column first screen: a large headline block with the promise and CTA on one side, one tall photograph on the other, aligned to a strict grid with generous whitespace.",
  centered: "A centred headline and CTA stack on a calm field, with the image below or behind at low contrast. Use only when the archetype calls for it; it is not a default.",
  "search-first": "The first screen is a working search or finder (address, property, product, service) with the headline above it; results or suggestions sit directly below.",
  cinematic: "A dark, wide, film-like first screen: a slow image or loop, oversized type in a letterboxed band, and one understated CTA.",
  asymmetric: "An off-grid composition: headline, photo and proof overlap or offset deliberately, with one element breaking the column grid.",
  "product-demo": "The product itself is the hero: a real interface or product view with annotations, a one line value statement and a demo CTA.",
  utility: "Action first: the phone number, the estimate or booking action and the service promise dominate; the photo is secondary and cropped tight. Built for a stressed visitor on a phone.",
  "type-led": "Typography is the image: an oversized headline set in the display face fills the first screen, with a small photo or none.",
  gallery: "The first screen is a grid or strip of work images; the name and CTA are compact and let the work speak.",
  "project-led": "One finished project fills the first screen with its caption (type, area), the name and CTA set beside it like a case study opener.",
  "image-left": "A two column first screen with the photograph on the left and the headline, promise and CTA on the right.",
  "image-right": "A two column first screen with the headline, promise and CTA on the left and the photograph on the right.",
  layered: "Type, photograph and a colour field overlap in depth (the headline crossing the image edge), composed, not collaged.",
  "minimal-copy": "Almost no words: the name, one short line and one action over generous space or a single image.",
  "conversion-form": "The request form sits in the first screen beside the promise, so a visitor can act without scrolling.",
  "split-screen": "Two equal halves, often two paths (urgent and planned, or two services), each with its own action.",
};

export const NAVIGATION_MEANINGS: Record<NavigationStyle, string> = {
  "transparent-overlay": "The header sits over the hero image with no fill, then gains a solid fill after the first scroll. Links and phone stay AA legible on the image.",
  solid: "A solid, always visible header bar with the wordmark, four to six links and one primary action.",
  "two-tier": "A thin top tier (phone, hours or service area) above the main bar with the wordmark, links and primary CTA.",
  "utility-bar": "A utility strip carries the phone, area and a short promise; the main navigation below it stays conventional.",
  minimal: "Wordmark and one or two actions only; the rest of the navigation sits in a compact menu.",
  editorial: "A centred masthead wordmark with small uppercase section links beneath, like a publication.",
  "mega-menu": "A full width dropdown groups many services or products with short descriptions; only for large catalogues.",
  sidebar: "A fixed side rail on desktop holds the wordmark and links; on mobile it becomes a top bar.",
  floating: "A compact bar floating inside the page margins, detached from the edges, with one action.",
  "centered-brand": "The wordmark centred with links split to either side, like a boutique storefront sign.",
  "conversion-heavy": "The bar is mostly actions: phone, the primary CTA and a secondary CTA, with links reduced to a menu.",
};

export const TYPOGRAPHY_MEANINGS: Record<TypographyStyle, string> = {
  "serif-sans": "A serif display face for headings over a restrained sans for body and UI.",
  "sans-only": "A single sans family; hierarchy comes from weight, size and spacing only.",
  "condensed-sans": "A condensed display face for headings, labels and numerals over a readable sans body.",
  "editorial-serif": "Serif led for headings and reading text, set like a printed feature.",
  "humanist-sans": "A humanist sans with open, warm letterforms throughout.",
  grotesk: "A contemporary grotesque, heavy at display sizes, with a neutral body.",
  geometric: "A geometric sans built from circles and straight lines, clean and bright.",
  "mono-accent": "A grotesk for reading plus a monospace accent for labels, specifications and numerals.",
  "high-contrast-serif": "A high contrast display serif (didone or fashion serif) at large sizes over a restrained sans.",
  "industrial-condensed": "A heavy industrial condensed display over a neutral sans; signage and stencil energy.",
  "neo-grotesk": "A single neutral neo-grotesk family set with precision; hierarchy from size and weight alone.",
  "warm-serif": "A warm, soft serif for headings over a humanist sans; friendly, crafted, approachable.",
};

export const LAYOUT_MEANINGS: Record<LayoutRhythm, string> = {
  editorial: "Long measure text columns with generous margins, pull statements and images placed like a magazine spread. Sections vary in width.",
  "dense-grid": "Compact, information rich grids with tight gutters, for scanning many services, products or listings quickly.",
  "wide-cinematic": "Full width bands alternating image and text, large vertical rhythm, few elements per band.",
  alternating: "Image and text blocks alternate left and right down the page, each section a clear two column unit.",
  modular: "A 12 column grid of repeated but varied modules (not identical cards), each with one job; strong alignment, practical spacing.",
  asymmetric: "Off-centre compositions with uneven columns (for example 7 and 5), overlaps and deliberate white space.",
  gallery: "Imagery leads every section; text is compact captions and short statements between image groups.",
  technical: "Spec sheet structure: numbered sections, rules, tables and labelled data, left aligned and exact.",
  narrative: "A story told in sequence: chapters with large section numbers, one idea per screen, scrolling as reading.",
  "conversion-heavy": "Every section ends in an action; short sections, repeated CTAs, forms placed early and again at the close.",
  catalog: "A browsable catalogue: filters or categories, consistent item rows or tiles, quick scanning.",
  magazine: "Mixed column counts, pull statements in our own copy, features and briefs like a magazine issue.",
  portfolio: "Work first: large images in sequence with minimal text between; the interface steps back.",
  documentary: "Photo essays: full width documentary images with captions carrying the story section by section.",
};

export const IMAGERY_MEANINGS: Record<ImageryStyle, string> = {
  "full-bleed": "Large edge to edge photographs used as section backgrounds or dividers.",
  documentary: "Unposed, real working photography: crews, hands, job sites, the actual place. Natural light, no heavy filters.",
  "project-gallery": "A structured gallery of finished work with captions (project type, area), built for the owner's own project photos.",
  "product-ui": "Real product screens or product photography, annotated. Never a fake dashboard.",
  portfolio: "Work images dominate the interface at large sizes with minimal chrome, like a studio portfolio.",
  cutout: "Subjects cut out from their background over flat colour fields; graphic and punchy.",
  technical: "Close technical imagery: equipment, parts, materials, diagrams, measured details.",
  editorial: "Art directed, composed photography with consistent colour grading and considered crops, used sparingly.",
  lifestyle: "People enjoying the result in context (a home, a table, a room); warm and aspirational without stock clichés.",
  "macro-detail": "Tight close ups of materials and craft: texture, joints, finish, ingredients.",
  collage: "Several photos layered or grid-cut together with type, energetic and handmade in feel.",
  "before-after": "Paired before and after images of the same subject, captioned, with a comparison control where useful.",
  "people-first": "People lead the imagery (staff, clients in context), only with rights and never presented as this business without its own photos.",
  "environment-first": "The place leads: rooms, studio, shop floor, neighbourhood, shot wide with natural light.",
  "material-detail": "Close studies of materials (stone, timber, metal, fabric, product) as the visual system.",
};

export const DIMENSION_LABELS: Record<string, string> = {
  archetype: "Archetype",
  hero: "Hero architecture",
  navigation: "Navigation architecture",
  typography: "Typography family",
  paletteFamily: "Palette family",
  layoutRhythm: "Layout rhythm",
  geometry: "Geometry",
  imagery: "Photography treatment",
  motion: "Motion level",
  ctaStyle: "CTA treatment",
  proofStyle: "Proof treatment",
  componentDialect: "Component dialect",
  sectionOrder: "Section composition",
};

// Generic meanings of ctaStyle and proofStyle words, used when an industry gives no styleNotes.
export const STYLE_WORD_MEANINGS: readonly { pattern: RegExp; meaning: string }[] = [
  { pattern: /call/, meaning: "The phone number is the primary action: a large tap to call control in the header, hero and a sticky mobile bar." },
  { pattern: /estimate|quote/, meaning: "The estimate request is the primary action: a short form (three to five fields) reachable from every section, with the phone as the fallback." },
  { pattern: /consult/, meaning: "A calm consultation request: one clear button to a short form or scheduling step, repeated at the end of each major section." },
  { pattern: /book|appointment|reserv/, meaning: "Booking first: a visible Book action in the header and hero, a booking section with time or service choice, and a sticky mobile Book control." },
  { pattern: /bold/, meaning: "Oversized, high contrast CTA blocks in the display face; impossible to miss, never gimmicky." },
  { pattern: /review/, meaning: "Proof leads with the recorded Google rating and review count, then paraphrased review themes. Never quotes, never names." },
  { pattern: /credential/, meaning: "A compact strip of sourced facts (rating, service area, hours). Licenses, insurance and warranties appear only as owner-to-confirm slots unless sourced." },
  { pattern: /project|craft/, meaning: "Proof through the work: project photography with captions, process and materials. Stock stand-ins are captioned as placeholders for the owner's projects." },
  { pattern: /crew/, meaning: "Proof through the people doing the work, shown as owner-to-confirm team slots (no stock faces in a team section)." },
  { pattern: /before-after/, meaning: "Before and after pairs of work. Until the owner supplies real pairs, the slots are captioned placeholders." },
  { pattern: /story/, meaning: "A narrative proof block about a project or the business, written only from sourced facts; everything else is an owner-to-confirm slot." },
];

export function styleMeaning(id: string, notes?: Record<string, string>): string {
  if (notes && notes[id]) return notes[id];
  const hits = STYLE_WORD_MEANINGS.filter((m) => m.pattern.test(id)).map((m) => m.meaning);
  return hits.length ? hits.join(" ") : `Apply "${id}" as the industry profile describes; no generic meaning is defined for it.`;
}

// ---------------------------------------------------------------------------------------------
// Trait affinity: which brand traits pull an axis value forward. Suitability outranks the seed:
// options are sorted by affinity first and the seed only orders options of equal affinity.
// ---------------------------------------------------------------------------------------------

export const VALUE_TRAIT_AFFINITY: Record<string, readonly string[]> = {
  // heroes
  "hero:full-bleed": ["premium", "visual", "cinematic", "residential", "luxury"],
  "hero:editorial-split": ["editorial", "craftsmanship", "premium", "established", "calm"],
  "hero:centered": ["minimal", "calm", "institutional"],
  "hero:search-first": ["practical", "fast"],
  "hero:cinematic": ["cinematic", "luxury", "high-end"],
  "hero:asymmetric": ["expressive", "artistic", "bold", "modern"],
  "hero:product-demo": ["technical", "innovative"],
  "hero:utility": ["urgent-need", "fast", "practical", "direct", "commercial"],
  "hero:type-led": ["bold", "energetic", "straightforward", "expressive"],
  "hero:gallery": ["visual", "artistic", "craftsmanship", "detail-oriented"],
  "hero:project-led": ["craftsmanship", "visual", "residential"],
  "hero:conversion-form": ["urgent-need", "fast", "value"],
  "hero:split-screen": ["urgent-need", "practical"],
  "hero:minimal-copy": ["minimal", "luxury", "artistic"],
  "hero:layered": ["expressive", "creative", "bold"],
  // navigation
  "navigation:transparent-overlay": ["premium", "cinematic", "visual"],
  "navigation:solid": ["practical", "straightforward", "reliable"],
  "navigation:two-tier": ["commercial", "established", "reliable"],
  "navigation:utility-bar": ["urgent-need", "fast", "local", "practical"],
  "navigation:minimal": ["minimal", "premium", "artistic"],
  "navigation:editorial": ["editorial", "old-school", "heritage"],
  "navigation:mega-menu": ["commercial"],
  // typography
  "typography:serif-sans": ["premium", "craftsmanship", "editorial", "high-end", "old-school", "established"],
  "typography:sans-only": ["straightforward", "practical", "modern", "value"],
  "typography:condensed-sans": ["bold", "energetic", "hardworking", "commercial", "direct", "urgent-need"],
  "typography:editorial-serif": ["editorial", "heritage", "old-school", "luxury"],
  "typography:humanist-sans": ["warm", "approachable", "personal", "calm", "community"],
  "typography:grotesk": ["modern", "direct", "practical", "precise", "reliable"],
  "typography:geometric": ["modern", "playful", "boutique"],
  "typography:mono-accent": ["technical", "precise", "specialist"],
  "typography:high-contrast-serif": ["luxury", "high-end", "premium", "boutique"],
  "typography:industrial-condensed": ["industrial", "hardworking", "bold", "working-class"],
  "typography:neo-grotesk": ["modern", "precise", "minimal", "institutional"],
  "typography:warm-serif": ["warm", "approachable", "traditional", "community-oriented", "old-school"],
  // layout
  "layoutRhythm:editorial": ["editorial", "premium", "craftsmanship"],
  "layoutRhythm:dense-grid": ["value", "practical", "commercial"],
  "layoutRhythm:wide-cinematic": ["cinematic", "visual", "premium"],
  "layoutRhythm:alternating": ["approachable", "straightforward", "local"],
  "layoutRhythm:modular": ["practical", "reliable", "commercial"],
  "layoutRhythm:asymmetric": ["expressive", "bold", "artistic", "modern"],
  "layoutRhythm:gallery": ["visual", "artistic", "detail-oriented"],
  "layoutRhythm:technical": ["technical", "precise", "specialist"],
  "layoutRhythm:narrative": ["documentary", "personal", "community"],
  // geometry
  "geometry:square": ["bold", "hardworking", "commercial", "direct"],
  "geometry:subtle-radius": ["reliable", "practical", "approachable"],
  "geometry:rounded": ["warm", "approachable", "playful"],
  "geometry:pill": ["playful", "modern"],
  "geometry:mixed": ["expressive", "artistic"],
  "geometry:architectural": ["premium", "architectural", "precise", "editorial"],
  "geometry:hard-edge": ["industrial", "bold", "working-class"],
  "geometry:organic": ["organic", "calm", "warm"],
  "geometry:editorial": ["editorial", "premium"],
  // imagery
  "imagery:full-bleed": ["visual", "premium", "cinematic"],
  "imagery:documentary": ["hardworking", "documentary", "local", "community"],
  "imagery:project-gallery": ["craftsmanship", "visual", "residential"],
  "imagery:portfolio": ["artistic", "visual"],
  "imagery:technical": ["technical", "precise", "commercial"],
  "imagery:editorial": ["editorial", "premium"],
  "imagery:lifestyle": ["warm", "residential"],
  "imagery:macro-detail": ["detail-oriented", "craftsmanship", "precise"],
  "imagery:collage": ["energetic", "expressive", "bold"],
  "imagery:before-after": ["visual", "craftsmanship"],
  "imagery:people-first": ["personal", "community", "warm"],
  "imagery:environment-first": ["calm", "boutique", "local"],
  "imagery:material-detail": ["craftsmanship", "detail-oriented", "architectural"],
  // motion
  "motion:none": ["practical", "urgent-need", "institutional"],
  "motion:subtle": ["reliable", "calm", "premium", "trusted"],
  "motion:moderate": ["modern", "energetic", "visual"],
  "motion:kinetic": ["energetic", "bold", "performance"],
  "motion:cinematic": ["cinematic", "luxury"],
  // dialects
  "componentDialect:utility": ["practical", "direct", "value", "urgent-need", "straightforward"],
  "componentDialect:industrial": ["commercial", "hardworking", "technical", "bold"],
  "componentDialect:editorial": ["editorial", "craftsmanship", "premium", "old-school"],
  "componentDialect:luxury": ["luxury", "high-end", "premium"],
  "componentDialect:editorial-luxury": ["luxury", "editorial", "high-end"],
  "componentDialect:clinical": ["clinical", "precise", "calm"],
  "componentDialect:technical": ["technical", "precise", "specialist"],
  "componentDialect:boutique": ["boutique", "personal", "warm"],
  "componentDialect:kinetic": ["energetic", "bold", "performance"],
  "componentDialect:commerce": ["value", "practical"],
  "componentDialect:portfolio": ["artistic", "visual"],
  "componentDialect:institutional": ["institutional", "established", "trusted"],
  "componentDialect:minimal": ["minimal", "calm"],
};

// Default anti-AI-design patterns (brief, Anti-AI-design rules). Banned as defaults: each one is
// dropped from a DNA only when the DNA itself calls for it (see releasedBy).
export const GLOBAL_FORBIDDEN_DEFAULTS: readonly { key: string; label: string; releasedBy?: (dna: { geometry: string; hero: string; imagery: string; typography: string; layoutRhythm: string }) => boolean }[] = [
  { key: "inter-everywhere", label: "Inter as the main typeface" },
  { key: "purple-blue-gradient", label: "Purple or blue gradient backgrounds" },
  { key: "glowing-blobs", label: "Glowing blobs and radial glow effects" },
  { key: "excessive-glassmorphism", label: "Glassmorphism (backdrop blur panels)" },
  { key: "three-feature-cards", label: "Three identical feature cards" },
  { key: "generic-saas-bento", label: "Bento grids" },
  { key: "pill-buttons-everywhere", label: "Pill buttons everywhere", releasedBy: (d) => d.geometry === "pill" },
  { key: "giant-rounded-rectangles", label: "Giant rounded rectangles", releasedBy: (d) => d.geometry === "rounded" || d.geometry === "pill" },
  { key: "fake-dashboard-ui", label: "Generic dashboard screenshots", releasedBy: (d) => d.imagery === "product-ui" },
  { key: "centered-hero-default", label: "A centred hero by default", releasedBy: (d) => d.hero === "centered" },
  { key: "identical-testimonial-cards", label: "Identical testimonial cards" },
  { key: "generic-icon-grid", label: "Generic icon grids" },
  { key: "default-shadcn-look", label: "Default shadcn, Preline or other library styling" },
];

// Forbidden pattern keys the audit can measure. Any other key is an instruction to the builder
// that a person checks at review.
export const DETECTABLE_PATTERNS: readonly string[] = [
  "inter-everywhere",
  "purple-blue-gradient",
  "unrelated-tech-gradients",
  "neon-gradient",
  "glowing-blobs",
  "gradient-blobs",
  "excessive-glassmorphism",
  "three-feature-cards",
  "generic-saas-bento",
  "generic-saas",
  "pill-buttons-everywhere",
  "rounded-pill-cards",
  "identical-testimonial-cards",
  "default-shadcn-look",
  "default-shadcn-card",
  "fake-dashboard-ui",
];

export const PERFORMANCE_TARGETS = {
  lcpSeconds: 2.5,
  inpMs: 200,
  cls: 0.1,
};
