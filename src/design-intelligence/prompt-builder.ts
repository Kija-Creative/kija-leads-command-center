// buildGenerationBrief: turns a lead, its industry profile, the chosen archetype, the Site DNA,
// the sourced facts and the available assets into a constrained frontend generation brief. It
// tells the building agent exactly which design system to execute; it is never a vague prompt
// such as "make ABC Roofing a nice website".
//
// Returns { markdown, json }: the same content for a person (BRIEF.md) and for a tool. The
// markdown follows v2's shape exactly (BRIEF_SHAPE: BUSINESS, INDUSTRY, ARCHETYPE, PRIMARY
// CONVERSION, BRAND TRAITS, DESIGN LANGUAGE, HERO, TYPOGRAPHY, LAYOUT, GEOMETRY, IMAGERY, MOTION,
// PALETTE, COMPONENT DIALECT, SECTION ORDER, REQUIRED, AVOID), opens with the statement that
// Site DNA is the visual authority, and then carries the truth rules with the exact recorded
// facts, the RECENT <INDUSTRY> WEBSITE DNA divergence block, the reference and code source
// flows, performance and accessibility targets and the audit markers.
import type {
  BusinessFacts,
  IndustryArchetype,
  IndustryProfile,
  LeadRecord,
  SiteDNA,
  SiteDnaRecord,
  TreatmentField,
  TrustSignalTruth,
  TruthPlan,
} from "./schema.ts";
import { TREATMENT_AXES } from "./schema.ts";
import type { BaseArchetype } from "./archetypes.ts";
import type { ResolvedDialect } from "./component-dialects.ts";
import { AA_NORMAL, contrastRatio } from "./contrast.ts";
import {
  DETECTABLE_PATTERNS,
  DIMENSION_LABELS,
  fontsHref,
  fontStack,
  GEOMETRY_TOKENS,
  GLOBAL_FORBIDDEN_DEFAULTS,
  HERO_MEANINGS,
  IMAGERY_MEANINGS,
  LAYOUT_MEANINGS,
  MOTION_RULES,
  NAVIGATION_MEANINGS,
  PERFORMANCE_TARGETS,
  REDUCED_MOTION_RULE,
  styleMeaning,
  TYPOGRAPHY_MEANINGS,
} from "./design-tokens.ts";
import type { HistoryEntry, HistorySource } from "./history.ts";
import { comparisonPool, toHistoryFile } from "./history.ts";
import { DNA_ATTRIBUTE_MAP, MARKER_ALIASES } from "./markers.ts";
import { moduleSpec, pageLabel } from "./modules.ts";
import { modulePlan } from "./renderer-contract.ts";
import { buildTruthPlan, pickFontPairing, resolvePalette } from "./select-site-dna.ts";
import { trustSignalTruth } from "./trust-signals.ts";
import { compareSiteDNA, dnaFingerprint } from "./variation.ts";
import { uniq } from "./util.ts";

export interface StockAsset {
  id: string;
  subject: string;
  alt: string;
  caption: string;        // how the photo must be captioned on the page
  photographer: string;
  orientation: string;
  people: string;
  url?: string;
}

export interface BriefInput {
  lead: LeadRecord;
  profile: IndustryProfile;
  archetype: IndustryArchetype;
  dna: SiteDNA;
  facts: BusinessFacts;
  assets: readonly StockAsset[];
  history: HistorySource;
  record?: SiteDnaRecord;
  family?: BaseArchetype;
  dialect?: ResolvedDialect;
}

export interface BriefSection {
  index: number;
  module: string;
  label: string;
  pageHeading: string;      // guardrail safe heading for the page (modules.ts PAGE_LABELS)
  job: string;
  truth: string;
  note: string;
}

export interface BriefJson {
  version: 1;
  leadId: string;
  business: string;
  fingerprint: string;
  authority: string;                                  // AUTHORITY_STATEMENT
  shape: { heading: string; body: string }[];         // the seventeen v2 blocks, in BRIEF_SHAPE order
  industry: { id: string; label: string; subIndustry: string; schemaOrgType: string };
  archetype: { id: string; label: string; family: string; description: string };
  conversion: { primary: string; secondary: string; allowed: string[] };
  axes: { dimension: string; label: string; value: string; meaning: string }[];
  treatments: { field: TreatmentField; value: string }[];
  sections: BriefSection[];
  supportingModules: { module: string; job: string; host: string; truth: string }[];
  typography: { classification: string; pairing: string; display: string; body: string; accent: string; href: string; stacks: Record<string, string> };
  palette: { family: string; label: string; tone: string; tokens: Record<string, string>; contrast: { pair: string; ratio: number | null }[] };
  geometry: { style: string; tokens: Record<string, string>; rules: string };
  imagery: { style: string; meaning: string; industryNotes: string; archetypeNotes: string; assets: StockAsset[] };
  motion: { style: string; maxDurationMs: number; keyframes: boolean; scrollReveal: boolean; rules: string; reducedMotion: string };
  cta: { style: string; meaning: string };
  proof: { style: string; meaning: string };
  dialect: { id: string; allowed: string[]; forbidden: string[]; behaviors: string[]; primitives: string };
  forbiddenPatterns: { key: string; label: string; checked: boolean }[];
  truth: TruthPlan;
  trustSignals: TrustSignalTruth[];
  targets: { lcpSeconds: number; inpMs: number; cls: number; accessibility: string[] };
  markers: { root: string[]; section: string; embedded: string; cta: string; placeholder: string; rootCss: string[] };
  divergence: { previous: { business: string; archetype: string; dna: Record<string, string> }[]; required: string[]; text: string };
  references: { id: string; title: string; path: string; takeaways: string[] }[];
  referenceFlow: string[];
  codeSources: { library: string; role: string }[];
  familyPrinciples: string[];
}

// Where an embedded required module lives, from the same modulePlan the renderer uses.
function hostOf(dna: SiteDNA, module: string): string {
  const plan = modulePlan(dna);
  if ((plan.header as readonly string[]).includes(module)) return "the header (and the mobile call bar)";
  const host = plan.sections.find((s) => (s.embedded as readonly string[]).includes(module));
  return host ? `section ${host.index + 1} (\`${host.key}\`)` : "the most relevant section";
}

function archetypeLabel(profile: IndustryProfile, id: string): string {
  return profile.archetypes.find((a) => a.id === id)?.label || id;
}

const DIVERGENCE_ORDER = ["hero", "typography", "sectionOrder", "geometry", "navigation", "imagery", "layoutRhythm", "motion", "componentDialect", "ctaStyle", "proofStyle", "paletteFamily", "archetype"] as const;

// The RECENT <INDUSTRY> WEBSITE DNA block, in the exact form of the brief's example: each
// previous site in the same industry, then the current target and the required divergence.
export function divergenceBlock(dna: SiteDNA, profile: IndustryProfile, previous: readonly HistoryEntry[]): { text: string; required: string[] } {
  const lines: string[] = [`RECENT ${profile.label.toUpperCase()} WEBSITE DNA`, ""];
  if (!previous.length) {
    lines.push(`No previous ${profile.label.toLowerCase()} site in the history.`, "");
  }
  for (const p of previous) {
    lines.push(
      "Previous site:",
      `Archetype: ${archetypeLabel(profile, p.dna.archetype)}`,
      `Hero: ${p.dna.hero}`,
      `Typography: ${p.dna.typography}`,
      `Layout: ${p.dna.layoutRhythm}`,
      `Geometry: ${p.dna.geometry}`,
      `Imagery: ${p.dna.imagery}`,
      `Navigation: ${p.dna.navigation}`,
      `Motion: ${p.dna.motion}`,
      "",
      "YOU MAY NOT reproduce this combination.",
      "",
    );
  }
  lines.push("Current target:", archetypeLabel(profile, dna.archetype), "");
  let required: string[] = [];
  if (previous.length) {
    const differing = previous.map((p) => new Set(compareSiteDNA(dna, p.dna).differingDimensions));
    const everywhere = DIVERGENCE_ORDER.filter((d) => differing.every((s) => s.has(d)));
    const latest = differing[differing.length - 1];
    required = [...everywhere];
    for (const d of DIVERGENCE_ORDER) {
      if (required.length >= 6) break;
      if (latest.has(d) && !required.includes(d)) required.push(d);
    }
    lines.push("Required divergence:", ...required.map((d) => DIMENSION_LABELS[d]));
  } else {
    lines.push("Required divergence:", "None from this industry yet; still differ from the most recent site of any industry on at least six dimensions.");
  }
  return { text: lines.join("\n"), required: required.map((d) => DIMENSION_LABELS[d]) };
}

function table(rows: string[][]): string {
  const [head, ...body] = rows;
  return [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...body.map((r) => `| ${r.map((c) => c.replace(/\|/g, "/")).join(" | ")} |`)].join("\n");
}

// The v2 brief shape, in this exact order (IMPLEMENTATION-BRIEF-v2.md, Prompt builder).
export const BRIEF_SHAPE = [
  "BUSINESS",
  "INDUSTRY",
  "ARCHETYPE",
  "PRIMARY CONVERSION",
  "BRAND TRAITS",
  "DESIGN LANGUAGE",
  "HERO",
  "TYPOGRAPHY",
  "LAYOUT",
  "GEOMETRY",
  "IMAGERY",
  "MOTION",
  "PALETTE",
  "COMPONENT DIALECT",
  "SECTION ORDER",
  "REQUIRED",
  "AVOID",
] as const;

export type BriefHeading = (typeof BRIEF_SHAPE)[number];

export const AUTHORITY_STATEMENT = "SITE DNA IS THE VISUAL AUTHORITY. The Site DNA below was selected and saved before this brief was written. It may not be ignored, silently changed or replaced with a generic template, a library default or a look of your own. If an instruction cannot be met, stop and name it instead of substituting a different design. Add no facts.";

// Library roles (IMPLEMENTATION-BRIEF-v2.md, Component dialects). Behaviour only: appearance
// always comes from the Site DNA tokens and the dialect.
export const CODE_SOURCES: readonly { library: string; role: string }[] = [
  { library: "shadcn/ui", role: "forms, dialogs, sheets, accessible primitives, menus and interaction behaviour" },
  { library: "Preline", role: "alternate blocks, navigation, forms and marketing structures" },
  { library: "Origin UI", role: "alternate component compositions" },
  { library: "HyperUI", role: "marketing, commerce and service business structures" },
  { library: "Magic UI", role: "motion, technology and creative experiences (only where the DNA's motion allows)" },
  { library: "Cult UI", role: "expressive or experimental UI" },
  { library: "KokonutUI", role: "contemporary alternates" },
];

// How the two research repositories are used (IMPLEMENTATION-BRIEF.md, Design references).
export const REFERENCE_FLOW: readonly string[] = [
  "design-playbooks-skill (.design-references/design-playbooks-skill, MIT): pattern discovery and reference reasoning for this archetype. Pick references appropriate to this Site DNA and never average unrelated palettes together.",
  "skynet-site-system (.design-references/skynet-site-system, MIT): niche rules, token ideas, conversion observations and anti-patterns as research input. Do not inherit its fixed funnel order or its style system; this Site DNA is the higher authority.",
  "Principles only: never copy another business's copy, photos, logos, testimonials or distinctive layout, and check a repository's license before reusing any code.",
];

function list(items: readonly string[]): string[] {
  return items.map((i) => `- ${i}`);
}

export function buildGenerationBrief(input: BriefInput): { markdown: string; json: BriefJson } {
  const { lead, profile, archetype, dna, facts, assets, record, family, dialect } = input;
  const file = toHistoryFile(input.history);
  const pool = comparisonPool(file, lead.id);
  const previousSameIndustry = pool.predecessors.filter((e) => e.industry === dna.industry).slice(-3);
  const previousAny = pool.predecessors[pool.predecessors.length - 1];
  const divergence = divergenceBlock(dna, profile, previousSameIndustry);
  const pairing = dna.fontPairing || pickFontPairing(dna.typography, archetype, dna.seed);
  const palette = dna.palette || resolvePalette(profile, dna.paletteFamily);
  const geometry = GEOMETRY_TOKENS[dna.geometry];
  const motion = MOTION_RULES[dna.motion];
  const trustKeys = dna.trustSignals && dna.trustSignals.length ? dna.trustSignals : profile.preferredTrustSignals || [];
  const truth = record ? record.truth : buildTruthPlan(uniq([...dna.sectionOrder, ...dna.requiredModules]), facts, trustKeys);
  const trust = truth.trustSignals && truth.trustSignals.length ? truth.trustSignals : trustSignalTruth(trustKeys, facts);
  const truthOf = (m: string) => truth.modules.find((t) => t.module === m);
  const sub = profile.subIndustries?.[dna.subIndustry || ""];
  const schemaType = dna.schemaType || sub?.schemaOrgType || profile.schemaOrgType || "LocalBusiness";
  const jobOf = (m: string) => profile.moduleJobs?.[m] || moduleSpec(m)?.job || "No catalog job; ask the architect to add this module.";
  const labelOf = (m: string) => moduleSpec(m)?.label || m;

  const axes = [
    { dimension: "hero", value: dna.hero, meaning: HERO_MEANINGS[dna.hero] },
    { dimension: "navigation", value: dna.navigation, meaning: NAVIGATION_MEANINGS[dna.navigation] },
    { dimension: "typography", value: dna.typography, meaning: TYPOGRAPHY_MEANINGS[dna.typography] },
    { dimension: "layoutRhythm", value: dna.layoutRhythm, meaning: LAYOUT_MEANINGS[dna.layoutRhythm] },
    { dimension: "geometry", value: dna.geometry, meaning: geometry.rules },
    { dimension: "imagery", value: dna.imagery, meaning: IMAGERY_MEANINGS[dna.imagery] },
    { dimension: "motion", value: dna.motion, meaning: motion.rules },
    { dimension: "paletteFamily", value: dna.paletteFamily, meaning: palette ? `${palette.label} (${palette.tone}).` : "No tokens defined for this palette family." },
    { dimension: "ctaStyle", value: dna.ctaStyle, meaning: styleMeaning(dna.ctaStyle, profile.styleNotes) },
    { dimension: "proofStyle", value: dna.proofStyle, meaning: styleMeaning(dna.proofStyle, profile.styleNotes) },
    { dimension: "componentDialect", value: dna.componentDialect, meaning: dialect ? dialect.summary : "Dialect definition not written yet; follow the allowed and forbidden rules below." },
  ].map((a) => ({ ...a, label: DIMENSION_LABELS[a.dimension] }));

  const sections: BriefSection[] = dna.sectionOrder.map((m, index) => {
    const t = truthOf(m);
    return { index, module: m, label: labelOf(m), pageHeading: pageLabel(m), job: jobOf(m), truth: t ? t.status : "structural", note: t ? t.note : "" };
  });
  const supporting = dna.requiredModules.filter((m) => !dna.sectionOrder.includes(m)).map((m) => ({ module: m, job: jobOf(m), host: hostOf(dna, m), truth: truthOf(m)?.status || "structural" }));

  const contrast = palette
    ? [
        { pair: "ink on bg", ratio: contrastRatio(palette.tokens.ink, palette.tokens.bg) },
        { pair: "ink on surface", ratio: contrastRatio(palette.tokens.ink, palette.tokens.surface) },
        { pair: "muted on bg", ratio: contrastRatio(palette.tokens.muted, palette.tokens.bg) },
        { pair: "on-primary on primary", ratio: contrastRatio(palette.tokens["on-primary"], palette.tokens.primary) },
      ]
    : [];

  const forbidden = dna.forbiddenPatterns.map((key) => ({ key, label: GLOBAL_FORBIDDEN_DEFAULTS.find((g) => g.key === key)?.label || key.replace(/-/g, " "), checked: DETECTABLE_PATTERNS.includes(key) }));
  const refs = (record?.referencesUsed || []).map((r) => ({ id: r.id, title: r.title, path: r.path, takeaways: r.takeaways }));
  const stacks: Record<string, string> = { "--font-display": fontStack(pairing.display), "--font-body": fontStack(pairing.body) };
  if (pairing.accent) stacks["--font-accent"] = fontStack(pairing.accent);
  const accessibility = [
    "One h1 (the business name or the promise), headings in order without skipped levels.",
    "Landmarks: header, nav, main, footer; html lang set.",
    "Every image has alt text ending \", stock photo\" for library photos; decorative SVG is aria-hidden.",
    "Every input has a visible label; errors and the concept notice are announced (aria-live).",
    `Text and buttons meet WCAG AA ${AA_NORMAL}:1 using the palette tokens as given.`,
    "Visible :focus-visible styles on every interactive element, never outline: none without a replacement.",
    "Tap targets 44px or larger, the phone link included.",
    "Fully keyboard usable; dialogs trap focus and close on Escape (shadcn Dialog behaviour).",
  ];
  const rootMarkers = [" data-dna=\"<fingerprint>\"", ...Object.values(DNA_ATTRIBUTE_MAP).map((a) => `${a}="<value>"`)];
  const treatments = TREATMENT_AXES.map((t) => ({ field: t.field, value: (dna as unknown as Record<string, string | undefined>)[t.field] })).filter((t): t is { field: TreatmentField; value: string } => typeof t.value === "string");
  const treatment = (field: TreatmentField) => treatments.find((t) => t.field === field)?.value;
  const traitLine = record
    ? record.brandTraits.map((t) => `${t.trait} (${t.evidence[0].field})`).join(", ")
    : dna.brandTraits.join(", ");
  const sourcedTrust = trust.filter((t) => t.status === "sourced");
  const unsourcedTrust = trust.filter((t) => t.status !== "sourced");
  const fingerprint = dnaFingerprint(dna);

  // ---- The seventeen blocks -------------------------------------------------------------------
  const block: Record<BriefHeading, string[]> = {
    BUSINESS: [
      `${facts.business}${facts.city ? `, ${[facts.city, facts.state].filter(Boolean).join(", ")}` : ""}. Lead id \`${lead.id}\`. Site DNA \`${fingerprint}\`${dna.locked ? " (locked by a person)" : ""}.`,
      `schema.org type: \`${schemaType}\` (JSON-LD with only the recorded facts in the truth rules).${dna.localBusinessStrategy ? ` Local strategy: \`${dna.localBusinessStrategy}\`.` : ""}${dna.seoStrategy ? ` SEO: \`${dna.seoStrategy}\`.` : ""}`,
    ],
    INDUSTRY: [
      `${profile.label} (\`${profile.id}\`), sub-industry ${dna.subIndustryLabel || sub?.label || dna.subIndustry} (\`${dna.subIndustry}\`).`,
      ...(profile.conversionLogic ? [`How customers choose: ${profile.conversionLogic}`] : []),
    ],
    ARCHETYPE: [
      `${archetype.label} (\`${archetype.id}\`${archetype.family ? `, family \`${archetype.family}\`` : ""}).${archetype.description ? ` ${archetype.description}` : ""}`,
    ],
    "PRIMARY CONVERSION": [
      `\`${dna.primaryConversion}\`${dna.conversionSecondary || dna.secondaryConversion ? `; secondary \`${dna.conversionSecondary || dna.secondaryConversion}\`` : ""}. Allowed for this industry: ${profile.primaryConversions.join(", ")}.${dna.mobilePriority ? ` Mobile priority: \`${dna.mobilePriority}\`.` : ""}`,
      `CTA \`${dna.ctaStyle}\`: ${styleMeaning(dna.ctaStyle, profile.styleNotes)} The primary action appears in the hero and again at the close; every conversion control carries \`data-cta\`.`,
    ],
    "BRAND TRAITS": [
      `${traitLine || "none"} (from verified lead fields only; with too little information the industry defaults apply).`,
    ],
    "DESIGN LANGUAGE": [
      ...(family ? [`${family.label} family: ${family.summary}`] : []),
      `Proof \`${dna.proofStyle}\`: ${styleMeaning(dna.proofStyle, profile.styleNotes)}`,
      ...(treatments.length ? [`Treatments: ${treatments.filter((t) => !["mobilePriority", "localBusinessStrategy", "seoStrategy"].includes(t.field)).map((t) => `${t.field} \`${t.value}\``).join(", ")}.`] : []),
      ...(family && family.principles.length ? list(family.principles) : []),
    ],
    HERO: [`\`${dna.hero}\`: ${HERO_MEANINGS[dna.hero]} Navigation \`${dna.navigation}\`: ${NAVIGATION_MEANINGS[dna.navigation]}${treatment("headerBehavior") ? ` Header behaviour \`${treatment("headerBehavior")}\`.` : ""}`],
    TYPOGRAPHY: [
      `\`${dna.typography}\`: ${TYPOGRAPHY_MEANINGS[dna.typography]}`,
      `- Display: **${pairing.display.family}** (${pairing.display.classification}), weights ${pairing.display.weights.join(", ")}${pairing.display.italic ? ", with italics" : ""}.`,
      `- Body: **${pairing.body.family}** (${pairing.body.classification}), weights ${pairing.body.weights.join(", ")}.`,
      ...(pairing.accent ? [`- Accent: **${pairing.accent.family}** (${pairing.accent.classification}) for labels, specifications and numerals only.`] : []),
      `- Google Fonts: \`${fontsHref(pairing)}\``,
      `- Tokens: ${Object.entries(stacks).map(([k, v]) => `\`${k}: ${v}\``).join("; ")}.`,
      `- ${pairing.note} Two families at most, font-display swap, no other typeface anywhere.`,
    ],
    LAYOUT: [
      `\`${dna.layoutRhythm}\`: ${LAYOUT_MEANINGS[dna.layoutRhythm]}${treatment("backgroundTreatment") ? ` Backgrounds \`${treatment("backgroundTreatment")}\` (never a white, grey, white, grey alternation).` : " Never a white, grey, white, grey alternation."}${treatment("spacingDensity") ? ` Spacing \`${treatment("spacingDensity")}\`.` : ""}${treatment("contentDensity") ? ` Content \`${treatment("contentDensity")}\`.` : ""}${treatment("footerStyle") ? ` Footer \`${treatment("footerStyle")}\`.` : ""}`,
    ],
    GEOMETRY: [`\`${dna.geometry}\`: ${geometry.rules} Declare \`--radius-control: ${geometry.control}; --radius-surface: ${geometry.surface}; --radius-media: ${geometry.media}\` and use only these.`],
    IMAGERY: [
      `\`${dna.imagery}\`: ${IMAGERY_MEANINGS[dna.imagery]}${treatment("imageShape") ? ` Image shape \`${treatment("imageShape")}\`.` : ""}`,
      ...(profile.imageryNotes ? [`Industry: ${profile.imageryNotes}`] : []),
      ...(archetype.imageryNotes ? [`Archetype: ${archetype.imageryNotes}`] : []),
      "Never fabricate imagery of the actual business: concept and stock imagery is captioned so it is never presented as documented reality.",
      "",
      ...(assets.length
        ? ["Stock photos available (library only, each captioned as below, alt text ending \", stock photo\", credited in the footer):", "", table([["Photo id", "Subject", "Caption on the page", "Photographer", "People"], ...assets.map((a) => [a.id, a.subject, a.caption, a.photographer, a.people])])]
        : ["No stock photos fit this business. Design the imagery slots with an SVG or typographic fallback and captions that ask the owner for their own photos."]),
    ],
    MOTION: [`\`${dna.motion}\`: ${motion.rules} Longest duration ${motion.maxDurationMs}ms; keyframes ${motion.keyframes ? "allowed" : "not allowed"}; scroll reveal ${motion.scrollReveal ? "allowed" : "not allowed"}. ${REDUCED_MOTION_RULE} Motion never delays the primary conversion.`],
    PALETTE: palette
      ? [
          `\`${dna.paletteFamily}\`: ${palette.label}, ${palette.tone}. Declare these on :root exactly:`,
          "",
          table([["Token", "Value"], ...Object.entries(palette.tokens).map(([k, v]) => [`--${k}`, v])]),
          "",
          `Contrast (WCAG AA needs ${AA_NORMAL}:1): ${contrast.map((c) => `${c.pair} ${c.ratio}:1`).join(", ")}. The primary colour is for actions and one accent per screen, never a background wash. Colour alone never makes this site different from another.`,
        ]
      : [`No tokens are defined for \`${dna.paletteFamily}\` in the ${profile.label} profile. Stop and ask for them; do not invent colours.`],
    "COMPONENT DIALECT": dialect
      ? [
          `\`${dna.componentDialect}\`: ${dialect.summary}${treatment("buttonTreatment") ? ` Buttons \`${treatment("buttonTreatment")}\`.` : ""}${treatment("cardTreatment") ? ` Cards \`${treatment("cardTreatment")}\`.` : ""}${treatment("iconStyle") ? ` Icons \`${treatment("iconStyle")}\`.` : ""}`,
          "",
          "Allowed:",
          ...list(dialect.allowed),
          "",
          "Forbidden:",
          ...list(dialect.forbidden),
          ...(dialect.primitivesPath ? ["", `Primitives: \`${dialect.primitivesPath}\` (button, sectionHeading, card, field, placeholder, css). Use them; restyle nothing outside the DNA tokens.`] : []),
        ]
      : [`\`${dna.componentDialect}\` (definition not written yet). Build custom buttons, cards, header and section compositions from the tokens above; component libraries supply behaviour only.`],
    "SECTION ORDER": [
      "Render these sections in this order, each as `<section data-module=\"<key>\" data-section=\"<n>\">`.",
      "",
      ...sections.map((s) => `${s.index + 1}. \`${s.module}\` (${s.label}${s.pageHeading !== s.label ? `, headed "${s.pageHeading}" on the page` : ""}): ${s.job} Truth: ${s.truth}. ${s.note}`),
    ],
    REQUIRED: [
      `Every section above, plus every required module: ${dna.requiredModules.map((m) => `\`${m}\``).join(", ")}.`,
      ...(supporting.length ? ["", "Required modules that are not sections of their own. Embed each one with `data-module=\"<key>\"`:", "", ...supporting.map((s) => `- \`${s.module}\` in ${s.host}: ${s.job} Truth: ${s.truth}.`)] : []),
      "",
      `Owner-to-confirm placeholders (\`data-placeholder="owner-to-confirm"\`): ${truth.placeholders.length ? truth.placeholders.map((p) => `\`${p}\``).join(", ") : "none"}.`,
    ],
    AVOID: [
      ...forbidden.map((f) => `- ${f.label} (\`${f.key}\`)${f.checked ? ", checked by the audit" : ", checked at review"}`),
      "- Solving similarity with colour alone; the same template with different colours and content is a failure.",
    ],
  };

  const shape = BRIEF_SHAPE.map((heading) => ({ heading, body: block[heading].join("\n") }));

  const json: BriefJson = {
    version: 1,
    leadId: lead.id,
    business: facts.business,
    fingerprint,
    authority: AUTHORITY_STATEMENT,
    shape,
    industry: { id: profile.id, label: profile.label, subIndustry: dna.subIndustry || "", schemaOrgType: schemaType },
    archetype: { id: archetype.id, label: archetype.label, family: archetype.family || "", description: archetype.description || "" },
    conversion: { primary: dna.primaryConversion, secondary: dna.conversionSecondary || dna.secondaryConversion || "", allowed: [...profile.primaryConversions] },
    axes,
    treatments,
    sections,
    supportingModules: supporting,
    typography: { classification: dna.typography, pairing: pairing.id, display: pairing.display.family, body: pairing.body.family, accent: pairing.accent ? pairing.accent.family : "", href: fontsHref(pairing), stacks },
    palette: { family: dna.paletteFamily, label: palette?.label || "", tone: palette?.tone || "", tokens: palette ? { ...palette.tokens } : {}, contrast },
    geometry: { style: dna.geometry, tokens: { "--radius-control": geometry.control, "--radius-surface": geometry.surface, "--radius-media": geometry.media }, rules: geometry.rules },
    imagery: { style: dna.imagery, meaning: IMAGERY_MEANINGS[dna.imagery], industryNotes: profile.imageryNotes || "", archetypeNotes: archetype.imageryNotes || "", assets: [...assets] },
    motion: { style: dna.motion, maxDurationMs: motion.maxDurationMs, keyframes: motion.keyframes, scrollReveal: motion.scrollReveal, rules: motion.rules, reducedMotion: REDUCED_MOTION_RULE },
    cta: { style: dna.ctaStyle, meaning: styleMeaning(dna.ctaStyle, profile.styleNotes) },
    proof: { style: dna.proofStyle, meaning: styleMeaning(dna.proofStyle, profile.styleNotes) },
    dialect: { id: dna.componentDialect, allowed: dialect ? dialect.allowed : [], forbidden: dialect ? dialect.forbidden : [], behaviors: dialect ? dialect.behaviors : [], primitives: dialect ? dialect.primitivesPath : "" },
    forbiddenPatterns: forbidden,
    truth,
    trustSignals: trust,
    targets: { ...PERFORMANCE_TARGETS, accessibility },
    markers: {
      root: rootMarkers,
      section: "<section data-module=\"<key> [embedded keys]\" data-section=\"<index in sectionOrder>\">",
      embedded: "data-module=\"<key>\" on the element, no data-section",
      cta: "data-cta=\"<conversion>\" on every conversion control",
      placeholder: "data-placeholder=\"owner-to-confirm\" on every owner-to-confirm slot",
      rootCss: ["--radius-control", "--radius-surface", "--radius-media", "--font-display", "--font-body", "--bg", "--surface", "--ink", "--muted", "--line", "--primary", "--on-primary", "--accent"],
    },
    divergence: { previous: previousSameIndustry.map((p) => ({ business: p.business, archetype: archetypeLabel(profile, p.dna.archetype), dna: { hero: p.dna.hero, typography: p.dna.typography, layout: p.dna.layoutRhythm, geometry: p.dna.geometry, imagery: p.dna.imagery, navigation: p.dna.navigation, motion: p.dna.motion } })), required: divergence.required, text: divergence.text },
    references: refs,
    referenceFlow: [...REFERENCE_FLOW],
    codeSources: CODE_SOURCES.map((c) => ({ ...c })),
    familyPrinciples: family ? [...family.principles] : [],
  };

  const md: string[] = [];
  md.push(`# Frontend generation brief: ${facts.business}`);
  md.push("");
  md.push(AUTHORITY_STATEMENT);
  md.push("");
  for (const s of shape) {
    md.push(`## ${s.heading}`);
    md.push("");
    md.push(s.body);
    md.push("");
  }
  md.push("## TRUTH RULES");
  md.push("");
  md.push("Use only these recorded facts, exactly as written:");
  md.push("");
  md.push(truth.facts.length ? table([["Field", "Value"], ...truth.facts.map((f) => [f.label, f.value])]) : "No facts beyond the business name are recorded.");
  md.push("");
  if (truth.sources.length) {
    md.push(`Sources: ${truth.sources.map((s) => `${s.label || s.url} (${s.url}${s.checkedAt ? `, checked ${s.checkedAt}` : ""})`).join("; ")}.`);
    md.push("");
  }
  md.push(`Trust signals this industry leans on. Sourced, state exactly: ${sourcedTrust.length ? sourcedTrust.map((t) => `${t.label} (${t.value})`).join("; ") : "none"}.`);
  md.push("");
  md.push(`Not in the record, so owner-to-confirm slots that are never stated or implied: ${unsourcedTrust.length ? unsourcedTrust.map((t) => t.label.toLowerCase()).join(", ") : "none"}.`);
  md.push("");
  md.push("Never state or imply:");
  md.push(...list(truth.neverClaim));
  md.push("- anything about the business that is not in the table above (review content appears only as paraphrased themes)");
  md.push("");
  md.push("Placeholder copy is checked by the same guardrail as claims: never write warranty, guarantee, financing, licensed, insured, insurance, bonded, certified, award, since a year or family owned anywhere on the page, placeholders included, unless the table above backs it. Head each slot with its page label, for example \"Coverage on the work: to confirm with the owner\".");
  md.push("");
  md.push("## DIVERGENCE FROM RECENT SITES");
  md.push("");
  md.push("```");
  md.push(divergence.text);
  md.push("```");
  if (previousAny && previousAny.industry !== dna.industry) {
    md.push("");
    md.push(`The most recent site of any industry (${previousAny.business}, ${previousAny.industry}) used hero ${previousAny.dna.hero}, typography ${previousAny.dna.typography}, geometry ${previousAny.dna.geometry} and its own section order; do not share all four.`);
  }
  md.push("");
  md.push("## REFERENCES");
  md.push("");
  if (refs.length) {
    md.push("Selected for this Site DNA (principles only, never copy):");
    md.push(...refs.map((r) => `- ${r.title} (\`${r.path}\`): ${r.takeaways.join(" ")}`));
    md.push("");
  }
  md.push(...list(REFERENCE_FLOW));
  md.push("");
  md.push("## CODE SOURCES");
  md.push("");
  md.push("Component libraries are ingredients, not the visual identity. Take behaviour and structure from them, then restyle to the Site DNA tokens and the dialect; never let a library's default appearance take over.");
  md.push("");
  md.push(...CODE_SOURCES.map((c) => `- ${c.library}: ${c.role}.`));
  if (dialect && dialect.behaviors.length) md.push(`- This dialect's behaviour sources: ${dialect.behaviors.join("; ")}.`);
  md.push("");
  md.push("## PERFORMANCE AND ACCESSIBILITY");
  md.push("");
  md.push(`- One HTML file, inline CSS and JS, Google Fonts and library photos as the only requests. LCP ${PERFORMANCE_TARGETS.lcpSeconds}s or less, INP ${PERFORMANCE_TARGETS.inpMs}ms or less, CLS ${PERFORMANCE_TARGETS.cls} or less: the hero photo loads eagerly with width and height, every other image lazy.`);
  md.push(...list(accessibility));
  md.push(`- Works at 375px wide with no horizontal scroll; the first screen shows the name and the primary action${dna.mobilePriority ? ` (mobile priority \`${dna.mobilePriority}\`)` : ""}.`);
  md.push("");
  md.push("## MARKERS THE AUDIT READS");
  md.push("");
  md.push(`- Root element: ${rootMarkers.map((r) => `\`${r.trim()}\``).join(", ")} (build them with \`dnaAttributes(dna)\` from src/design-intelligence/markers.ts).`);
  md.push(`- Sections: ${json.markers.section}. Embedded modules: ${json.markers.embedded}. Write them with \`moduleAttributes(keys, index)\`: modules whose key is a claim word are written as neutral tokens (${Object.entries(MARKER_ALIASES).map(([k, v]) => `${k} as ${v}`).join(", ")}) so the guardrail passes.`);
  md.push(`- CTAs: ${json.markers.cta}. Placeholders: ${json.markers.placeholder}.`);
  md.push(`- :root CSS: ${json.markers.rootCss.map((c) => `\`${c}\``).join(", ")} (\`dnaRootCss(dna)\`).`);
  md.push("");
  md.push(`Before handing back, run the design audit (\`npm run audit -- --id ${lead.id}\`). It fails the page when it is too similar to recent sites, misses a required module, lets a forbidden pattern dominate, has the wrong CTA architecture, ignores this DNA, fabricates a trust signal, breaks responsive basics or accessibility, or looks like an unmodified component library demo.`);
  md.push("");
  return { markdown: md.join("\n"), json };
}
