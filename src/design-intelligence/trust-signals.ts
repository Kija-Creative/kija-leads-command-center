// Trust signals (IMPLEMENTATION-BRIEF-v2.md, Truthfulness): what each industry leans on to earn
// trust, and which lead fields may back each signal. A signal is "sourced" only when the lead
// record holds the fact; every other signal is an owner-to-confirm slot and is never stated.
// Most signals (licenses, warranties, awards, bar admissions, hospital affiliation) have no lead
// field on purpose: research never records them as facts, so they always go to the owner.
import { TRUST_SIGNAL_KEYS } from "./schema.ts";
import type { BusinessFacts, TrustSignalKey, TrustSignalTruth } from "./schema.ts";

interface SignalSpec {
  label: string;
  value?: (f: BusinessFacts) => string;   // the recorded value, "" when the record lacks it
}

const rating = (f: BusinessFacts) => (f.googleRating !== null && f.googleReviews !== null ? `${f.googleRating} from ${f.googleReviews} Google reviews` : "");
const place = (f: BusinessFacts) => [f.area, f.city, f.state].filter(Boolean).join(", ") + (f.metro ? ` (${f.metro} metro)` : "");

export const TRUST_SIGNALS: Record<TrustSignalKey, SignalSpec> = {
  "google-rating": { label: "Google rating and review count", value: rating },
  "review-themes": { label: "Paraphrased review themes", value: (f) => f.reviewThemes.join("; ") },
  "verified-reviews": { label: "Verified reviews", value: rating },
  "service-area": { label: "Service area", value: (f) => (f.city || f.metro ? place(f) : "") },
  locations: { label: "Location", value: (f) => f.address || [f.city, f.state].filter(Boolean).join(", ") },
  hours: { label: "Hours", value: (f) => f.hours },
  phone: { label: "Phone", value: (f) => f.phone },
  services: { label: "Services", value: (f) => (f.servicesFromDefaults ? "" : f.services.join("; ")) },
  team: { label: "Team" },
  credentials: { label: "Credentials" },
  certifications: { label: "Certifications" },
  licenses: { label: "Licenses" },
  "insurance-coverage": { label: "Insurance coverage" },
  "years-in-business": { label: "Years in business", value: (f) => (f.established !== null ? `established ${f.established} (sourced)` : "") },
  awards: { label: "Awards" },
  press: { label: "Press mentions" },
  "real-projects": { label: "Real projects" },
  "before-after": { label: "Before and after pairs" },
  warranty: { label: "Coverage on the work" },
  financing: { label: "Payment options" },
  crew: { label: "The crew" },
  "manufacturer-certifications": { label: "Manufacturer standards" },
  attorneys: { label: "Attorneys" },
  education: { label: "Education" },
  "bar-admissions": { label: "Bar admissions" },
  "practice-experience": { label: "Practice experience" },
  "case-experience": { label: "Case experience" },
  "consultation-structure": { label: "How a consultation works" },
  providers: { label: "Providers" },
  "insurance-accepted": { label: "Plans accepted" },
  "hospital-affiliation": { label: "Hospital affiliation" },
  "patient-process": { label: "Patient process" },
  technology: { label: "Technology" },
  "regulatory-disclosures": { label: "Regulatory disclosures" },
  process: { label: "Process" },
  resources: { label: "Resources" },
  food: { label: "Food" },
  menu: { label: "Menu" },
  chef: { label: "Chef" },
  environment: { label: "The room" },
  amenities: { label: "Amenities" },
  instructors: { label: "Instructors" },
  coaches: { label: "Coaches" },
  methodology: { label: "Methodology" },
  studio: { label: "The studio" },
  schedule: { label: "Class schedule" },
  community: { label: "Community" },
  "class-descriptions": { label: "Class descriptions" },
  portfolio: { label: "Portfolio" },
  "client-list": { label: "Clients" },
  impact: { label: "Impact" },
  transparency: { label: "Transparency" },
  programs: { label: "Programs" },
  equipment: { label: "Equipment" },
  capabilities: { label: "Capabilities" },
  "industries-served": { label: "Industries served" },
  "product-reviews": { label: "Product reviews" },
  "return-policy": { label: "Return policy" },
};

const KEYS: ReadonlySet<string> = new Set(TRUST_SIGNAL_KEYS);

export function isTrustSignalKey(value: unknown): value is TrustSignalKey {
  return typeof value === "string" && KEYS.has(value);
}

// Conservative defaults when a profile names no preferredTrustSignals.
export const DEFAULT_TRUST_SIGNALS: readonly TrustSignalKey[] = ["google-rating", "review-themes", "service-area", "services", "phone"];

// The truth of each trust signal for this business: sourced with the exact recorded value, or
// an owner-to-confirm slot with an empty value. Unknown keys are kept as owner-to-confirm.
export function trustSignalTruth(signals: readonly string[], facts: BusinessFacts): TrustSignalTruth[] {
  return signals.map((signal) => {
    const spec = isTrustSignalKey(signal) ? TRUST_SIGNALS[signal] : undefined;
    const label = spec ? spec.label : signal.replace(/-/g, " ");
    const value = spec && spec.value ? spec.value(facts).trim() : "";
    if (value) return { signal, label, status: "sourced", value, note: "Recorded in the lead record; state it exactly as written." };
    return { signal, label, status: "placeholder", value: "", note: "Not in the lead record: an owner-to-confirm slot, never stated or implied." };
  });
}
