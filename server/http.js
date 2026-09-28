// Small HTTP helpers for the local server: JSON replies, body parsing and request guards.
// Nothing here reaches the network beyond answering the request it was given.

export const BODY_LIMIT_BYTES = 256 * 1024;

export const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".pdf": "application/pdf",
};

// A thrown HttpError becomes a JSON reply with its status and sentences.
export class HttpError extends Error {
  constructor(status, errors, { warnings = [], headers = {} } = {}) {
    const list = Array.isArray(errors) ? errors : [errors];
    super(list[0] ?? `HTTP ${status}`);
    this.status = status;
    this.errors = list;
    this.warnings = warnings;
    this.headers = headers;
  }
}

const BASE_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

export function sendJson(res, status, body, headers = {}) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    ...BASE_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    // The weekly run rewrites data from another process, so API replies are never cached.
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(text);
}

export function sendText(res, status, text, contentType = "text/plain; charset=utf-8", headers = {}) {
  const body = typeof text === "string" ? Buffer.from(text, "utf8") : text;
  res.writeHead(status, {
    ...BASE_HEADERS,
    "Content-Type": contentType,
    "Content-Length": body.length,
    ...headers,
  });
  res.end(body);
}

export function sendError(res, err, { api = true } = {}) {
  const status = err instanceof HttpError ? err.status : 500;
  const errors = err instanceof HttpError ? err.errors : [`The server hit an unexpected problem: ${err?.message ?? err}`];
  const warnings = err instanceof HttpError ? err.warnings : [];
  const headers = err instanceof HttpError ? err.headers : {};
  if (api) sendJson(res, status, { ok: false, errors, warnings }, headers);
  else sendText(res, status, `${errors.join("\n")}\n`, "text/plain; charset=utf-8", { "Cache-Control": "no-store", ...headers });
}

// Reads a JSON body up to the limit. An empty body reads as {}.
export function readJsonBody(req, { limit = BODY_LIMIT_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"]);
    if (Number.isFinite(declared) && declared > limit) {
      reject(new HttpError(413, `The request body is larger than ${Math.round(limit / 1024)} KB.`));
      req.resume();
      return;
    }
    const chunks = [];
    let size = 0;
    let failed = false;
    req.on("data", (chunk) => {
      if (failed) return;
      size += chunk.length;
      if (size > limit) {
        failed = true;
        reject(new HttpError(413, `The request body is larger than ${Math.round(limit / 1024)} KB.`));
        return;
      }
      chunks.push(chunk);
    });
    req.on("error", (err) => {
      if (!failed) reject(new HttpError(400, `The request body could not be read: ${err.message}`));
    });
    req.on("end", () => {
      if (failed) return;
      const text = Buffer.concat(chunks).toString("utf8").replace(/^﻿/, "");
      if (!text.trim()) {
        resolve({});
        return;
      }
      const type = String(req.headers["content-type"] ?? "").toLowerCase();
      // Requiring JSON keeps a cross site HTML form from posting here without a preflight.
      if (!type.startsWith("application/json")) {
        reject(new HttpError(415, "Send the body as JSON with Content-Type: application/json."));
        return;
      }
      try {
        resolve(JSON.parse(text));
      } catch (err) {
        reject(new HttpError(400, `The request body is not valid JSON: ${err.message}`));
      }
    });
  });
}

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

function hostOnly(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return "";
  if (text.startsWith("[")) return text.slice(0, text.indexOf("]") + 1);
  return text.split(":")[0];
}

// DNS rebinding guard: a page on another site that resolves its name to 127.0.0.1 would
// send its own Host header, so only local names are served.
export function isLocalHost(hostHeader) {
  const host = hostOnly(hostHeader);
  return LOCAL_HOSTS.has(host) || host.endsWith(".localhost");
}

// Browsers send Origin on cross origin requests; a mutation from any non local page is refused.
export function isLocalOrigin(origin) {
  if (origin === undefined || origin === "") return true;
  if (origin === "null") return false;
  try {
    const u = new URL(origin);
    return (u.protocol === "http:" || u.protocol === "https:") && isLocalHost(u.host);
  } catch {
    return false;
  }
}
