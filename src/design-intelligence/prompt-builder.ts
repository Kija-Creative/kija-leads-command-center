// buildGenerationBrief: turns a lead, its industry profile, the chosen archetype, the Site DNA,
// the sourced facts and the available assets into a constrained frontend generation brief. It
// tells the building agent exactly which design system to execute; it is never a vague prompt
// such as "make ABC Roofing a nice website".
//
// Returns { markdown, json }: the same content for a person (BRIEF.md) and for a tool.
import type {
  BusinessFacts,
  IndustryArchetype,
  IndustryProfile,
  LeadRecord,
  SiteDNA,
  SiteDnaRecord,
  TruthPlan,
} from "./schema.ts";
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
import type { HistoryEntry, HistoryFile } from "./history.ts";
import { comparisonPool } from "./history.ts";
import { DNA_ATTRIBUTE_MAP, MARKER_ALIASES } from "./markers.ts";
import { moduleSpec, pageLabel } from "./modules.ts";
import { modulePlan } from "./renderer-contract.ts";
import { buildTruthPlan, pickFontPairing, resolvePalette } from "./select-site-dna.ts";
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
  history: HistoryFile | readonly HistoryEntry[];
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
  industry: { id: string; label: string; subIndustry: string; schemaOrgType: string };
  archetype: { id: string; label: string; family: string; description: string };
  conversion: { primary: string; secondary: string; allowed: string[] };
  axes: { dimension: string; label: string; value: string; meaning: string }[];
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
  targets: { lcpSeconds: number; inpMs: number; cls: number; accessibility: string[] };
  markers: { root: string[]; section: string; embedded: string; cta: string; placeholder: string; rootCss: string[] };
  divergence: { previous: { business: string; archetype: string; dna: Record<string, string> }[]; required: string[]; text: string };
  references: { id: string; title: string; path: string; takeaways: string[] }[];
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

function entriesOf(history: HistoryFile | readonly HistoryEntry[]): { file: HistoryFile; entries: readonly HistoryEntry[] } {
  if (Array.isArray(history)) return { file: { version: 1, cap: 500, note: "", entries: [...history] }, entries: history };
  const file = history as HistoryFile;
  return { file, entries: file.entries };
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

export function buildGenerationBrief(input: BriefInput): { markdown: string; json: BriefJson } {
  const { lead, profile, archetype, dna, facts, assets, record, family, dialect } = input;
  const { file } = entriesOf(input.history);
  const pool = comparisonPool(file, lead.id);
  const previousSameIndustry = pool.predecessors.filter((e) => e.industry === dna.industry).slice(-3);
  const previousAny = pool.predecessors[pool.predecessors.length - 1];
  const divergence = divergenceBlock(dna, profile, previousSameIndustry);
  const pairing = dna.fontPairing || pickFontPairing(dna.typography, archetype, dna.seed);
  const palette = dna.palette || resolvePalette(profile, dna.paletteFamily);
  const geometry = GEOMETRY_TOKENS[dna.geometry];
  const motion = MOTION_RULES[dna.motion];
  const truth = record ? record.truth : buildTruthPlan(uniq([...dna.sectionOrder, ...dna.requiredModules]), facts);
  const truthOf = (m: string) => truth.modules.find((t) => t.module === m);
  const sub = profile.subIndustries?.[dna.subIndustry || ""];
  const schemaType = sub?.schemaOrgType || profile.schemaOrgType || "LocalBusiness";
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

  const json: BriefJson = {
    version: 1,
    leadId: lead.id,
    business: facts.business,
    fingerprint: dnaFingerprint(dna),
    industry: { id: profile.id, label: profile.label, subIndustry: dna.subIndustry || "", schemaOrgType: schemaType },
    archetype: { id: archetype.id, label: archetype.label, family: archetype.family || "", description: archetype.description || "" },
    conversion: { primary: dna.primaryConversion, secondary: dna.secondaryConversion || "", allowed: [...profile.primaryConversions] },
    axes,
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
    familyPrinciples: family ? [...family.principles] : [],
  };

  const md: string[] = [];
  md.push(`# Frontend generation brief: ${facts.business}`);
  md.push("");
  md.push(`Build exactly the design system below. Do not invent a different look, do not fall back to a generic template, and do not add facts. Site DNA ${json.fingerprint}, ${profile.label}, ${archetype.label}. Lead id \`${lead.id}\`.`);
  md.push("");
  md.push("## 1. Business and conversion");
  md.push("");
  md.push(`- Industry: ${profile.label} (${profile.id})${dna.subIndustry ? `, sub-industry ${dna.subIndustryLabel || dna.subIndustry} (${dna.subIndustry})` : ""}.`);
  md.push(`- Primary conversion: **${dna.primaryConversion}**${dna.secondaryConversion ? `; secondary: ${dna.secondaryConversion}` : ""}. Allowed conversions for this industry: ${profile.primaryConversions.join(", ")}.`);
  if (profile.conversionLogic) md.push(`- How customers choose: ${profile.conversionLogic}`);
  md.push(`- Brand traits (from verified fields only): ${record ? record.brandTraits.map((t) => `${t.trait} (${t.evidence[0].field})`).join(", ") || "none" : dna.brandTraits.join(", ") || "none"}.`);
  if (archetype.description) md.push(`- Archetype: ${archetype.label}. ${archetype.description}`);
  md.push(`- schema.org type: \`${schemaType}\` (JSON-LD with only the recorded facts below).`);
  md.push("");
  md.push("## 2. Site DNA, axis by axis");
  md.push("");
  md.push(table([["Dimension", "Value", "What it means concretely"], ...axes.map((a) => [a.label, `\`${a.value}\``, a.meaning])]));
  md.push("");
  md.push("## 3. Section order");
  md.push("");
  md.push("Render these sections in this order, each as `<section data-module=\"<key>\" data-section=\"<n>\">`.");
  md.push("");
  for (const s of sections) md.push(`${s.index + 1}. \`${s.module}\` (${s.label}${s.pageHeading !== s.label ? `, headed "${s.pageHeading}" on the page` : ""}): ${s.job} Truth: ${s.truth}. ${s.note}`);
  if (supporting.length) {
    md.push("");
    md.push("Required modules that are not sections of their own. Embed each one with `data-module=\"<key>\"`:");
    md.push("");
    for (const s of supporting) md.push(`- \`${s.module}\` in ${s.host}: ${s.job} Truth: ${s.truth}.`);
  }
  md.push("");
  md.push("## 4. Typography");
  md.push("");
  md.push(`Classification \`${dna.typography}\`: ${TYPOGRAPHY_MEANINGS[dna.typography]}`);
  md.push("");
  md.push(`- Display: **${pairing.display.family}** (${pairing.display.classification}), weights ${pairing.display.weights.join(", ")}${pairing.display.italic ? ", with italics" : ""}.`);
  md.push(`- Body: **${pairing.body.family}** (${pairing.body.classification}), weights ${pairing.body.weights.join(", ")}.`);
  if (pairing.accent) md.push(`- Accent: **${pairing.accent.family}** (${pairing.accent.classification}) for labels, specifications and numerals only.`);
  md.push(`- Google Fonts: \`${json.typography.href}\``);
  md.push(`- Tokens: ${Object.entries(stacks).map(([k, v]) => `\`${k}: ${v}\``).join("; ")}.`);
  md.push(`- ${pairing.note} Two families at most, font-display swap, no other typeface anywhere.`);
  md.push("");
  md.push("## 5. Palette");
  md.push("");
  if (palette) {
    md.push(`\`${dna.paletteFamily}\`: ${palette.label}, ${palette.tone}. Declare these on :root exactly:`);
    md.push("");
    md.push(table([["Token", "Value"], ...Object.entries(palette.tokens).map(([k, v]) => [`--${k}`, v])]));
    md.push("");
    md.push(`Contrast (WCAG AA needs ${AA_NORMAL}:1): ${contrast.map((c) => `${c.pair} ${c.ratio}:1`).join(", ")}. The primary colour is for actions and one accent per screen, never a background wash.`);
  } else {
    md.push(`No tokens are defined for \`${dna.paletteFamily}\` in the ${profile.label} profile. Stop and ask for them; do not invent colours.`);
  }
  md.push("");
  md.push("## 6. Geometry");
  md.push("");
  md.push(`\`${dna.geometry}\`: ${geometry.rules} Declare \`--radius-control: ${geometry.control}; --radius-surface: ${geometry.surface}; --radius-media: ${geometry.media}\` and use only these.`);
  md.push("");
  md.push("## 7. Imagery");
  md.push("");
  md.push(`\`${dna.imagery}\`: ${IMAGERY_MEANINGS[dna.imagery]}`);
  if (profile.imageryNotes) md.push(`Industry: ${profile.imageryNotes}`);
  if (archetype.imageryNotes) md.push(`Archetype: ${archetype.imageryNotes}`);
  md.push("");
  if (assets.length) {
    md.push("Stock photos available (library only, each captioned as below, alt text ending \", stock photo\", credited in the footer):");
    md.push("");
    md.push(table([["Photo id", "Subject", "Caption on the page", "Photographer", "People"], ...assets.map((a) => [a.id, a.subject, a.caption, a.photographer, a.people])]));
  } else {
    md.push("No stock photos fit this business. Design the imagery slots with an SVG or typographic fallback and captions that ask the owner for their own photos.");
  }
  md.push("");
  md.push("## 8. Motion");
  md.push("");
  md.push(`\`${dna.motion}\`: ${motion.rules} Longest duration ${motion.maxDurationMs}ms; keyframes ${motion.keyframes ? "allowed" : "not allowed"}; scroll reveal ${motion.scrollReveal ? "allowed" : "not allowed"}. ${REDUCED_MOTION_RULE} Motion never delays the primary conversion.`);
  md.push("");
  md.push("## 9. CTA and proof");
  md.push("");
  md.push(`- CTA \`${dna.ctaStyle}\`: ${json.cta.meaning} Every conversion control carries \`data-cta\`; the primary (\`${dna.primaryConversion}\`) appears in the hero and again at the close.`);
  md.push(`- Proof \`${dna.proofStyle}\`: ${json.proof.meaning}`);
  if (profile.proofNotes) md.push(`- ${profile.proofNotes}`);
  md.push("");
  md.push("## 10. Component dialect");
  md.push("");
  md.push(`\`${dna.componentDialect}\`${dialect ? `: ${dialect.summary}` : " (definition not written yet)"}`);
  md.push("");
  if (dialect) {
    md.push("Allowed:");
    md.push(...dialect.allowed.map((a) => `- ${a}`));
    md.push("");
    md.push("Forbidden:");
    md.push(...dialect.forbidden.map((a) => `- ${a}`));
    md.push("");
    if (dialect.primitivesPath) md.push(`Primitives: \`${dialect.primitivesPath}\` (button, sectionHeading, card, field, placeholder, css). Use them; restyle nothing outside the DNA tokens.`);
  } else {
    md.push("Until the dialect is written: build custom buttons, cards, header and section compositions from the tokens above; component libraries supply behaviour only.");
  }
  md.push("");
  md.push("## 11. Forbidden patterns");
  md.push("");
  md.push(...forbidden.map((f) => `- ${f.label} (\`${f.key}\`)${f.checked ? ", checked by the audit" : ", checked at review"}`));
  if (family && family.principles.length) {
    md.push("");
    md.push(`Principles of the ${family.label} family:`);
    md.push(...family.principles.map((p) => `- ${p}`));
  }
  md.push("");
  md.push("## 12. Truth rules");
  md.push("");
  md.push("Use only these recorded facts, exactly as written:");
  md.push("");
  md.push(truth.facts.length ? table([["Field", "Value"], ...truth.facts.map((f) => [f.label, f.value])]) : "No facts beyond the business name are recorded.");
  md.push("");
  if (truth.sources.length) md.push(`Sources: ${truth.sources.map((s) => `${s.label || s.url} (${s.url}${s.checkedAt ? `, checked ${s.checkedAt}` : ""})`).join("; ")}.`);
  md.push("");
  md.push(`Modules that must render as labelled owner-to-confirm placeholders (\`data-placeholder="owner-to-confirm"\`): ${truth.placeholders.length ? truth.placeholders.map((p) => `\`${p}\``).join(", ") : "none"}.`);
  md.push("");
  md.push("Never state or imply:");
  md.push(...truth.neverClaim.map((c) => `- ${c}`));
  md.push("- anything about the business that is not in the table above (review content appears only as paraphrased themes)");
  md.push("");
  md.push("Placeholder copy is checked by the same guardrail as claims: never write warranty, guarantee, financing, licensed, insured, insurance, bonded, certified, award, since a year or family owned anywhere on the page, placeholders included, unless the table above backs it. Head each slot with its page label, for example \"Coverage on the work: to confirm with the owner\".");
  md.push("");
  md.push("## 13. Performance and accessibility");
  md.push("");
  md.push(`- One HTML file, inline CSS and JS, Google Fonts and library photos as the only requests. LCP ${PERFORMANCE_TARGETS.lcpSeconds}s or less, INP ${PERFORMANCE_TARGETS.inpMs}ms or less, CLS ${PERFORMANCE_TARGETS.cls} or less: the hero photo loads eagerly with width and height, every other image lazy.`);
  md.push(...accessibility.map((a) => `- ${a}`));
  md.push("- Works at 375px wide with no horizontal scroll; the first screen shows the name and the primary action.");
  md.push("");
  md.push("## 14. Markers the audit reads");
  md.push("");
  md.push(`- Root element: ${rootMarkers.map((r) => `\`${r.trim()}\``).join(", ")} (build them with \`dnaAttributes(dna)\` from src/design-intelligence/markers.ts).`);
  md.push(`- Sections: ${json.markers.section}. Embedded modules: ${json.markers.embedded}. Write them with \`moduleAttributes(keys, index)\`: modules whose key is a claim word are written as neutral tokens (${Object.entries(MARKER_ALIASES).map(([k, v]) => `${k} as ${v}`).join(", ")}) so the guardrail passes.`);
  md.push(`- CTAs: ${json.markers.cta}. Placeholders: ${json.markers.placeholder}.`);
  md.push(`- :root CSS: ${json.markers.rootCss.map((c) => `\`${c}\``).join(", ")} (\`dnaRootCss(dna)\`).`);
  md.push("");
  md.push("## 15. Divergence from recent sites");
  md.push("");
  md.push("```");
  md.push(divergence.text);
  md.push("```");
  if (previousAny && previousAny.industry !== dna.industry) {
    md.push("");
    md.push(`The most recent site of any industry (${previousAny.business}, ${previousAny.industry}) used hero ${previousAny.dna.hero}, typography ${previousAny.dna.typography}, geometry ${previousAny.dna.geometry} and its own section order; do not share all four.`);
  }
  if (refs.length) {
    md.push("");
    md.push("## 16. References (principles only, never copy)");
    md.push("");
    for (const r of refs) md.push(`- ${r.title} (\`${r.path}\`): ${r.takeaways.join(" ")}`);
  }
  md.push("");
  md.push(`Before handing back, run the design audit (\`npm run audit -- --id ${lead.id}\`). It fails the page when it is too similar to recent sites, misses a required module, lets a forbidden pattern dominate, has the wrong CTA architecture, ignores this DNA, fabricates a trust signal, breaks responsive basics or accessibility, or looks like an unmodified component library demo.`);
  md.push("");
  return { markdown: md.join("\n"), json };
}
