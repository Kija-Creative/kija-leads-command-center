// Static routes: the app, generated demos and pitches, share exports, and the pure lib
// modules the browser imports. Every path is checked so nothing outside these folders,
// and nothing that touches disk, is ever served.

import fs from "node:fs";
import path from "node:path";
import { CONTENT_TYPES, HttpError, sendText } from "./http.js";

// Pure modules the browser may import. store.js, ingest.js and seed.js are deliberately absent.
export const BROWSER_LIB_MODULES = new Set(["roi.js", "score.js", "week.js", "normalize.js"]);

const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_FILE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

// Splits a URL pathname into decoded segments, refusing anything that could climb out of a
// folder: dot segments, encoded slashes or backslashes, drive letters and null bytes.
export function safeSegments(pathname) {
  const raw = String(pathname ?? "").split("/").slice(1);
  const out = [];
  for (const part of raw) {
    let seg;
    try {
      seg = decodeURIComponent(part);
    } catch {
      throw new HttpError(400, "The path is not valid URL encoding.");
    }
    if (seg === "") {
      out.push("");
      continue;
    }
    if (seg === "." || seg === ".." || /[\\/:\0]/.test(seg) || seg.startsWith(".")) {
      throw new HttpError(403, "That path is outside what this server shares.");
    }
    out.push(seg);
  }
  return out;
}

function within(base, file) {
  const b = path.resolve(base);
  const f = path.resolve(file);
  return f === b || f.startsWith(b + path.sep);
}

function contentType(file) {
  return CONTENT_TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
}

function serveFile(req, res, base, rel, { cache = "no-cache", headers = {} } = {}) {
  const file = path.resolve(base, ...rel);
  if (!within(base, file)) throw new HttpError(403, "That path is outside what this server shares.");
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    return false;
  }
  if (!stat.isFile()) return false;
  const body = req.method === "HEAD" ? Buffer.alloc(0) : fs.readFileSync(file);
  sendText(res, 200, body, contentType(file), {
    "Cache-Control": cache,
    ...(req.method === "HEAD" ? { "Content-Length": stat.size } : {}),
    ...headers,
  });
  return true;
}

function redirect(res, location) {
  res.writeHead(301, { Location: location, "Cache-Control": "no-store" });
  res.end();
}

// Returns true when the request was answered. Throws HttpError for refusals.
export function serveStatic(req, res, pathname, { codeRoot, dataRoot }) {
  const segs = safeSegments(pathname);
  const appDir = path.join(codeRoot, "app");
  const [first, ...rest] = segs;

  if (pathname === "/" || pathname === "/index.html") {
    return serveFile(req, res, appDir, ["index.html"]);
  }

  if (first === "app") {
    const rel = rest.filter((s, i) => s !== "" || i !== rest.length - 1);
    if (rel.length === 0) return serveFile(req, res, appDir, ["index.html"]);
    if (rel.some((s) => s === "")) return false;
    return serveFile(req, res, appDir, rel);
  }

  // Generated pages: /demos/<id>/ and /pitches/<id>/ map to <folder>/<id>/index.html.
  if (first === "demos" || first === "pitches") {
    const [id, tail, ...more] = rest;
    if (!id || !SAFE_ID.test(id) || more.length) return false;
    if (tail === undefined) {
      redirect(res, `/${first}/${id}/`);
      return true;
    }
    if (tail !== "" && tail !== "index.html") return false;
    // Generated pages are private concepts; keep them out of any index even by accident.
    return serveFile(req, res, path.join(dataRoot, first), [id, "index.html"], { headers: { "X-Robots-Tag": "noindex, nofollow" } });
  }

  if (first === "exports") {
    if (rest.length !== 1 || !SAFE_FILE.test(rest[0])) return false;
    return serveFile(req, res, path.join(dataRoot, "exports"), rest, { cache: "no-store", headers: { "X-Robots-Tag": "noindex, nofollow" } });
  }

  if (first === "src" && rest[0] === "lib" && rest.length === 2) {
    if (!BROWSER_LIB_MODULES.has(rest[1])) return false;
    return serveFile(req, res, path.join(codeRoot, "src", "lib"), [rest[1]]);
  }

  return false;
}
