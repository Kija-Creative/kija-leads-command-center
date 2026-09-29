// CSV in the exact column order of the sheet's Lead Pipeline tab, so rows paste back. Pure.

import { scoreLead } from "./score.js";

export const SHEET_COLUMNS = [
  "Score", "Business", "Category", "City", "Google Rating", "Reviews", "Website Gap (1-3)", "Ticket Value (1-3)",
  "Visual Fit (1-3)", "Phone", "Website Status", "Confidence", "Why Kija", "Pitch Angle", "Private Demo Concept",
  "Outreach Status", "Next Action", "Next Date", "Source 1", "Source 2",
];

// RFC 4180: quote when the value holds a comma, quote or line break; double inner quotes.
export function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function sourceUrl(s) {
  if (!s) return "";
  return typeof s === "string" ? s : s.url ?? "";
}

export function leadRow(lead, { thresholds } = {}) {
  const sources = Array.isArray(lead.sources) ? lead.sources : [];
  // A rating read from the Places API may not leave the app (research/places-api.md).
  const placesRating = lead.ratingSource === "places-api";
  return [
    scoreLead(lead, { thresholds }).total,
    lead.business,
    lead.category,
    lead.area ? `${lead.city} / ${lead.area}` : lead.city,
    placesRating ? "" : lead.googleRating,
    placesRating ? "" : lead.googleReviews,
    lead.websiteGap,
    lead.ticketValue,
    lead.visualFit,
    lead.phone,
    lead.websiteStatus,
    lead.confidence,
    lead.whyKija,
    lead.pitchAngle,
    lead.demoConcept,
    lead.outreach?.status ?? "",
    lead.outreach?.nextAction ?? "",
    lead.outreach?.nextDate ?? "",
    sourceUrl(sources[0]),
    sourceUrl(sources[1]),
  ];
}

// Highest score first, then business name, like the sheet is usually read.
export function leadsToCsv(leads, { thresholds } = {}) {
  const rows = (leads ?? [])
    .map((lead) => ({ lead, row: leadRow(lead, { thresholds }) }))
    .sort((a, b) => b.row[0] - a.row[0] || String(a.lead.business).localeCompare(String(b.lead.business)))
    .map((x) => x.row);
  return [SHEET_COLUMNS, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
