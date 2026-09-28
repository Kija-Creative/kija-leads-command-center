// Minimal .env parsing: KEY=value lines, optional quotes, # comments.
// Values never leave this process except as a presence boolean.

export function parseDotenv(text) {
  const out = {};
  for (const rawLine of String(text ?? "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    const quote = value[0];
    if ((quote === "\"" || quote === "'") && value.endsWith(quote) && value.length >= 2) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    out[m[1]] = value;
  }
  return out;
}

// The environment wins over .env, and a blank value counts as unset.
export function resolveSecret(name, env, dotenvText) {
  const fromEnv = String(env?.[name] ?? "").trim();
  if (fromEnv) return { value: fromEnv, from: "environment" };
  const fromFile = String(parseDotenv(dotenvText)[name] ?? "").trim();
  if (fromFile) return { value: fromFile, from: ".env" };
  return { value: "", from: "" };
}
