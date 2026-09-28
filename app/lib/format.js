// Display formatting. Dates in data are YYYY-MM-DD or ISO timestamps.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDay(value, { year = false } = {}) {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!m) return String(value);
  const text = `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`;
  return year ? `${text}, ${m[1]}` : text;
}

export function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const day = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${day}, ${time}`;
}

export function formatTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function dollars(n) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "";
  const whole = Math.round(Number(n));
  return `${whole < 0 ? "-" : ""}$${Math.abs(whole).toLocaleString("en-US")}`;
}

export function number(n) {
  if (n === null || n === undefined || n === "") return "";
  return Number(n).toLocaleString("en-US");
}

export function one(n) {
  const r = Math.round(Number(n) * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export function rating(n) {
  if (n === null || n === undefined || n === "") return "";
  return Number(n).toFixed(1);
}

export function plural(n, word, many = `${word}s`) {
  return `${number(n)} ${n === 1 ? word : many}`;
}

export function place(lead) {
  const city = lead.area ? `${lead.city} (${lead.area})` : lead.city;
  return [city, lead.state].filter(Boolean).join(", ");
}

// Local calendar date, YYYY-MM-DD.
export function today(now = new Date()) {
  const d = now instanceof Date ? now : new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(dateString, days) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
