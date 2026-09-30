// The module catalog: what every ModuleKey is for and which lead fields may fill it. The truth
// kind decides how a module renders when the record lacks the fact:
//   structural   no business facts; copy stays free of claims
//   sourced      filled only from the listed fields; a missing field renders a "to confirm" line
//   placeholder  an owner-to-confirm slot (data-placeholder="owner-to-confirm") unless a listed
//                field sources it; lead records never carry most of these fields, on purpose
//   stock        built for the owner's own photos; ships with library stock captioned as
//                placeholders for the owner's work
import { MODULE_KEYS } from "./schema.ts";
import type { BusinessFacts, ModuleKey, ModuleTruth, TruthStatus } from "./schema.ts";

export type TruthKind = "structural" | "sourced" | "placeholder" | "stock";

export interface ModuleSpec {
  label: string;
  job: string;
  truth: TruthKind;
  sources: readonly string[];   // BusinessFacts fields (or future sourced lead fields)
}

function m(label: string, truth: TruthKind, sources: readonly string[], job: string): ModuleSpec {
  return { label, job, truth, sources };
}

export const MODULE_CATALOG: Record<ModuleKey, ModuleSpec> = {
  hero: m("Hero", "structural", ["business", "city"], "State who the business is, where, and the one promise that matters, with the primary conversion reachable without scrolling."),
  "phone-cta": m("Phone action", "sourced", ["phone"], "A tap to call control with the recorded number, 44px or taller, in the header and the mobile call bar."),
  "estimate-form": m("Estimate form", "structural", [], "A short estimate request (three to five labelled fields) that answers a submit with the concept notice; nothing is sent."),
  estimate: m("Estimate section", "structural", [], "The closing conversion section that holds the estimate form and the phone fallback."),
  quote: m("Quote request", "structural", [], "A quote request with the few details a quote needs, plus the phone fallback."),
  emergency: m("Urgent help", "placeholder", ["emergencyService"], "Tells an urgent visitor what to do right now. Any availability promise (24/7, same day) is an owner-to-confirm slot unless sourced."),
  "emergency-or-estimate": m("Urgent or planned", "structural", [], "Splits visitors into two clear paths right under the hero: call now for urgent problems, or request an estimate for planned work."),
  contact: m("Contact", "sourced", ["phone", "address", "city"], "Phone, address or area, and the request form in one closing block, from recorded facts only."),
  faq: m("FAQ", "structural", [], "Answers the questions buyers in this field ask before choosing, without stating any fact about this business."),
  process: m("Process", "structural", [], "Three to five steps from first contact to finished work, described generically for the trade."),
  services: m("Services", "sourced", ["services"], "Lists the recorded services; category defaults are labelled as examples to confirm. No prices."),
  "service-area": m("Service area", "sourced", ["city", "area", "metro"], "The recorded city and metro; any wider area list is an owner-to-confirm slot."),
  locations: m("Locations", "sourced", ["address", "city"], "Recorded address or city with a directions link; other locations are owner-to-confirm."),
  hours: m("Hours", "sourced", ["hours"], "Recorded hours, or a clear hours to confirm line."),
  availability: m("Availability", "sourced", ["hours"], "When the business can be reached or booked, from recorded hours only."),
  reviews: m("Reviews", "sourced", ["googleRating", "googleReviews", "reviewThemes"], "The recorded Google rating and review count with the words Google reviews, plus paraphrased review themes. Never quotes, names or invented reviews."),
  ratings: m("Rating strip", "sourced", ["googleRating", "googleReviews"], "A compact strip with the exact recorded rating and review count, within one scroll of the hero."),
  "trust-strip": m("Trust strip", "sourced", ["googleRating", "googleReviews", "city"], "A single line of sourced proof: rating, review count and place. No licenses or years unless sourced."),
  "why-us": m("Why customers choose them", "sourced", ["reviewThemes"], "The paraphrased review themes turned into reasons; omitted or a to confirm slot when there are none."),
  about: m("About", "placeholder", ["ownerStory"], "Who runs the business and how; an owner-to-confirm slot until the owner supplies the story."),
  story: m("Story", "placeholder", ["ownerStory"], "The business's own story in its voice; an owner-to-confirm slot until supplied."),
  team: m("Team", "placeholder", ["team"], "The people, as numbered owner-to-confirm slots. Never stock faces in a team section."),
  gallery: m("Gallery", "stock", ["ownerPhotos"], "A gallery built for the owner's own photos; library stand-ins are captioned as placeholders."),
  pricing: m("Pricing", "placeholder", ["prices"], "Prices or packages; an owner-to-confirm slot unless sourced. Never invent a price."),
  booking: m("Booking", "structural", [], "A booking request (service, day, time) that answers a submit with the concept notice."),
  appointment: m("Appointment", "structural", [], "An appointment request with the few details the practice needs."),
  consultation: m("Consultation", "structural", [], "A consultation request with a calm, low commitment framing and a short form."),
  "project-proof": m("Project proof", "stock", ["ownerPhotos"], "Finished work as evidence: captioned project images built for the owner's own photos."),
  projects: m("Projects", "stock", ["ownerPhotos"], "A set of projects with type and area captions; stock stand-ins captioned as placeholders."),
  "selected-projects": m("Selected projects", "stock", ["ownerPhotos"], "Two to four featured projects at large size, captioned as placeholders until the owner supplies real work."),
  "project-gallery": m("Project gallery", "stock", ["ownerPhotos"], "The gallery of work the hero and proof point to; captioned placeholders until real photos exist."),
  "before-after": m("Before and after", "stock", ["ownerPhotos"], "Before and after pairs; placeholder slots until the owner supplies real pairs."),
  craftsmanship: m("Craftsmanship", "structural", [], "How good work in this trade is done (details, materials, care), described for the trade, not claimed for this business."),
  materials: m("Materials", "placeholder", ["materials"], "The materials and brands the business uses; an owner-to-confirm slot unless sourced."),
  credentials: m("Credentials", "placeholder", ["licenses", "certifications", "insurance"], "The credentials buyers check in this trade, as owner-to-confirm slots unless sourced. Never state any."),
  warranty: m("Warranty", "placeholder", ["warranty"], "What happens if something goes wrong after the job; a labelled owner-to-confirm slot headed with its page label unless sourced."),
  financing: m("Financing", "placeholder", ["financing"], "How customers can pay for larger jobs; an owner-to-confirm slot headed with its page label unless sourced."),
  crew: m("Crew", "placeholder", ["team"], "The crew doing the work, as owner-to-confirm slots; no stock faces."),
  "brand-position": m("Brand position", "structural", [], "One positioning statement about the kind of work and client, without claims of tenure or awards."),
  "testimonial-story": m("Testimonial story", "placeholder", [], "A space for a real customer story the owner supplies with permission. Always a placeholder: no quotes are ever generated."),
  "practice-areas": m("Practice areas", "sourced", ["services"], "The recorded practice areas, each with who it helps; defaults labelled to confirm."),
  attorneys: m("Attorneys", "placeholder", ["team"], "Attorney profiles; owner-to-confirm slots with no invented names, bars or admissions."),
  experience: m("Experience", "placeholder", ["caseResults"], "Relevant experience and matters; owner-to-confirm slots. Never invent results."),
  "case-studies": m("Case studies", "placeholder", ["caseResults"], "Case studies or results; owner-to-confirm slots. Never invent outcomes or numbers."),
  providers: m("Providers", "placeholder", ["team"], "Provider profiles; owner-to-confirm slots with no invented credentials."),
  conditions: m("Conditions and services", "sourced", ["services"], "Conditions treated or services offered, from recorded services; defaults labelled to confirm."),
  insurance: m("Insurance accepted", "placeholder", ["insurance"], "Which plans the practice accepts; an owner-to-confirm slot headed with its page label unless sourced."),
  "patient-info": m("Patient information", "placeholder", ["patientPolicies"], "Forms, policies and what to bring; owner-to-confirm slots."),
  "patient-comfort": m("Patient comfort", "placeholder", ["amenities"], "Comfort measures and amenities; owner-to-confirm slots unless sourced."),
  "first-visit": m("First visit", "structural", [], "What a first visit is generally like in this field, without stating this practice's policies."),
  "property-search": m("Property search", "structural", [], "A working search control (area, price, beds) that explains it is a concept."),
  "featured-properties": m("Featured properties", "placeholder", ["listings"], "Listings; clearly labelled sample slots unless the record sources real listings."),
  neighborhoods: m("Neighborhoods", "sourced", ["city", "area", "metro"], "The recorded city and areas as a guide; other neighborhoods are owner-to-confirm."),
  agent: m("Agent", "placeholder", ["team"], "Agent credibility; owner-to-confirm slots with no invented sales figures."),
  valuation: m("Valuation", "structural", [], "A home valuation request form; nothing is sent."),
  tour: m("Tour", "structural", [], "A tour request with day and time choice."),
  menu: m("Menu", "placeholder", ["menu"], "The menu; an owner-to-confirm slot unless sourced. Never invent dishes or prices."),
  reservation: m("Reservation", "structural", [], "A reservation request (party size, date, time)."),
  order: m("Order", "structural", [], "An ordering entry point that explains it is a concept."),
  "food-gallery": m("Food gallery", "stock", ["ownerPhotos"], "Food and room photography built for the owner's photos; stand-ins captioned."),
  rooms: m("Rooms", "placeholder", ["rooms"], "Room types; owner-to-confirm slots unless sourced."),
  experiences: m("Experiences", "placeholder", ["experiences"], "Experiences on offer; owner-to-confirm slots unless sourced."),
  amenities: m("Amenities", "placeholder", ["amenities"], "Amenities; owner-to-confirm slots unless sourced."),
  treatments: m("Treatments", "sourced", ["services"], "The recorded treatments or services; defaults labelled to confirm. No prices."),
  results: m("Results", "placeholder", ["ownerPhotos"], "Results or portfolio of work; owner-to-confirm slots. Never before and after claims from stock."),
  portfolio: m("Portfolio", "stock", ["ownerPhotos"], "The work at large size; library stand-ins captioned as placeholders for the owner's work."),
  "intro-offer": m("Introductory offer", "placeholder", ["offers"], "An introductory offer; an owner-to-confirm slot unless sourced. Never invent a price or discount."),
  classes: m("Classes", "sourced", ["services"], "Class types from recorded services; defaults labelled to confirm."),
  methodology: m("Methodology", "structural", [], "How the method works, described for the discipline, not claimed for this studio."),
  schedule: m("Schedule", "placeholder", ["schedule"], "The class schedule; an owner-to-confirm slot unless sourced."),
  instructors: m("Instructors", "placeholder", ["team"], "Instructor profiles; owner-to-confirm slots, no stock faces."),
  memberships: m("Memberships", "placeholder", ["prices"], "Membership options; owner-to-confirm slots unless sourced."),
  community: m("Community", "placeholder", ["community"], "The people and rituals around the business (regulars, events, local ties); owner-to-confirm slots unless sourced, never invented names or counts."),
  "product-demo": m("Product demo", "placeholder", ["productMedia"], "A real product view; an owner-to-confirm slot until real screens exist. Never a fake dashboard."),
  "use-cases": m("Use cases", "sourced", ["services"], "Who uses the product and for what, from recorded services or labelled examples."),
  integrations: m("Integrations", "placeholder", ["integrations"], "Integrations; owner-to-confirm slots unless sourced. Never borrowed logos."),
  signup: m("Signup", "structural", [], "A signup or demo request form; nothing is sent."),
  "client-logos": m("Client logos", "placeholder", ["clients"], "Client names or logos; owner-to-confirm slots. Never another company's logo without permission."),
  "product-discovery": m("Product discovery", "structural", [], "Category entry points and search so shoppers find products fast."),
  "product-detail": m("Product detail", "placeholder", ["products"], "A product detail pattern; sample slots labelled until real products are supplied."),
  merchandising: m("Merchandising", "placeholder", ["products"], "Collections and featured products; labelled sample slots."),
  cart: m("Cart", "structural", [], "A cart pattern that explains it is a concept; nothing is purchased."),
  checkout: m("Checkout", "structural", [], "A checkout pattern that takes no payment details."),
  mission: m("Mission", "placeholder", ["mission"], "The organisation's mission in its own words; an owner-to-confirm slot."),
  impact: m("Impact", "placeholder", ["impact"], "Impact figures; owner-to-confirm slots. Never invent statistics."),
  programs: m("Programs", "sourced", ["services"], "Programs from recorded services; defaults labelled to confirm."),
  stories: m("Stories", "placeholder", [], "Stories of people served, supplied by the organisation with consent. Always placeholders."),
  volunteer: m("Volunteer", "structural", [], "A volunteer interest form; nothing is sent."),
  donate: m("Donate", "structural", [], "A donation entry point that takes no payment details."),
  transparency: m("Transparency", "placeholder", ["financials"], "Financial transparency; owner-to-confirm slots."),
  work: m("Work", "stock", ["ownerPhotos"], "The work leads the page at large size with minimal chrome."),
  philosophy: m("Philosophy", "placeholder", ["ownerStory"], "The studio's approach in its own words; an owner-to-confirm slot."),
  studio: m("Studio", "placeholder", ["ownerStory"], "The studio and its people; owner-to-confirm slots."),
  capabilities: m("Capabilities", "sourced", ["services"], "Capabilities from recorded services; defaults labelled to confirm."),
  "industries-served": m("Industries served", "placeholder", ["industriesServed"], "Industries served; owner-to-confirm slots unless sourced."),
  equipment: m("Equipment and process", "placeholder", ["equipment"], "Equipment and process; owner-to-confirm slots unless sourced."),
  certifications: m("Certifications", "placeholder", ["certifications"], "The standards buyers ask about; owner-to-confirm slots. Never stated unless sourced."),
  rfq: m("Request for quote", "structural", [], "An RFQ form with the specification fields buyers expect; nothing is sent."),
  admissions: m("Admissions", "placeholder", ["admissions"], "How to enrol; owner-to-confirm slots unless sourced."),
  events: m("Events", "placeholder", ["events"], "Upcoming events; owner-to-confirm slots unless sourced."),
  disclosures: m("Disclosures", "placeholder", ["disclosures"], "Regulatory disclosures; owner-to-confirm slots. Required before any financial page goes live."),
};

// On-page headings for modules whose catalog label is itself a claim word. src/demo/guardrails.js
// refuses warranty, financing, licensed, insured, insurance and certified anywhere on a page the
// record does not back, placeholders included, so slots are headed with these instead.
export const PAGE_LABELS: Partial<Record<ModuleKey, string>> = {
  warranty: "Coverage on the work",
  financing: "Payment options",
  credentials: "Credentials",
  certifications: "Standards",
  insurance: "Plans accepted",
  "testimonial-story": "A customer story",
  "case-studies": "Selected matters",
  experience: "Experience",
};

// The heading a module uses on the page (guardrail safe).
export function pageLabel(key: string): string {
  return (isModuleKey(key) && PAGE_LABELS[key]) || moduleSpec(key)?.label || key;
}

const MODULE_SET: ReadonlySet<string> = new Set(MODULE_KEYS);

export function isModuleKey(value: unknown): value is ModuleKey {
  return typeof value === "string" && MODULE_SET.has(value);
}

export function moduleSpec(key: string): ModuleSpec | undefined {
  return isModuleKey(key) ? MODULE_CATALOG[key] : undefined;
}

function hasFact(facts: BusinessFacts, field: string): boolean {
  const value = (facts as unknown as Record<string, unknown>)[field];
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return String(value).trim() !== "";
}

// How one module must render for this business.
export function moduleTruth(key: string, facts: BusinessFacts): ModuleTruth {
  const spec = moduleSpec(key);
  if (!spec) return { module: key, status: "placeholder", note: `"${key}" is not in the module catalog, so it renders as an owner-to-confirm slot.` };
  const present = spec.sources.filter((f) => hasFact(facts, f));
  let status: TruthStatus;
  let note: string;
  if (spec.truth === "structural") {
    status = "structural";
    note = "No business facts; copy must make no claim about this business.";
  } else if (spec.truth === "stock") {
    status = "stock-placeholder";
    note = "Built for the owner's own photos; library stock only, each captioned as a placeholder for the owner's work.";
  } else if (present.length) {
    status = "sourced";
    note = `Filled from ${present.join(", ")} exactly as recorded.`;
    if (facts.servicesFromDefaults && present.every((f) => f === "services")) {
      status = "to-confirm";
      note = "The record has no sourced services; the category defaults render labelled as examples to confirm with the owner.";
    }
  } else if (spec.truth === "sourced") {
    status = "to-confirm";
    note = `The record has no ${spec.sources.join(" or ")}; render a clear "to confirm with the owner" line instead.`;
  } else {
    status = "placeholder";
    note = "Not in the lead record: render a labelled owner-to-confirm slot with data-placeholder=\"owner-to-confirm\".";
  }
  return { module: key, status, note };
}
