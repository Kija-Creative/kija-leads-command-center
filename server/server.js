// Local HTTP server and JSON API for the Kija Lead Command Center.
// Binds 127.0.0.1 only. Reads the data files fresh on every request, because the weekly
// run writes them from another process. Nothing here contacts a business or publishes.
//
//   npm start                 serve on http://127.0.0.1:4242
//   PORT=5000 npm start       another port

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveSecret } from "../src/discovery/env.js";
import { createApi } from "./api.js";
import { HttpError, isLocalHost, isLocalOrigin, readJsonBody, sendError, sendJson, sendText } from "./http.js";
import { DEFAULT_LOADERS } from "./modules.js";
import { safeSegments, serveStatic } from "./static.js";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const HOST = "127.0.0.1";
export const DEFAULT_PORT = 4242;

// Only a presence flag for the Places key ever leaves this process.
function placesKeyPresent(root) {
  let dotenv = "";
  try {
    dotenv = fs.readFileSync(path.join(root, ".env"), "utf8");
  } catch {
    // no .env is the normal case
  }
  return Boolean(resolveSecret("GOOGLE_PLACES_API_KEY", process.env, dotenv).value);
}

// Routes: [method, pattern segments, handler name]. ":id" matches one safe segment.
const ROUTES = [
  ["GET", ["api", "state"], "state"],
  ["GET", ["api", "export.csv"], "csv"],
  ["PATCH", ["api", "leads", ":id"], "patchLead"],
  ["POST", ["api", "leads", ":id", "history"], "addHistory"],
  ["POST", ["api", "leads", ":id", "suppress"], "suppressLead"],
  ["POST", ["api", "leads", ":id", "demo"], "regenerateDemo"],
  ["POST", ["api", "leads", ":id", "pitch"], "regeneratePitch"],
  ["POST", ["api", "leads", ":id", "export"], "exportShare"],
  ["POST", ["api", "queue", ":id", "decision"], "queueDecision"],
  ["PUT", ["api", "settings"], "putSettings"],
  ["POST", ["api", "notes"], "addNote"],
  ["PATCH", ["api", "notes", ":id"], "patchNote"],
  ["DELETE", ["api", "notes", ":id"], "deleteNote"],
];

function matchRoute(segs) {
  const hits = [];
  for (const [method, pattern, name] of ROUTES) {
    if (pattern.length !== segs.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < pattern.length; i += 1) {
      if (pattern[i].startsWith(":")) {
        if (!segs[i]) ok = false;
        else params[pattern[i].slice(1)] = segs[i];
      } else if (pattern[i] !== segs[i]) ok = false;
      if (!ok) break;
    }
    if (ok) hits.push({ method, name, params });
  }
  return hits;
}

export function createServer({
  root = REPO_ROOT,
  codeRoot = REPO_ROOT,
  now = () => new Date(),
  loaders = DEFAULT_LOADERS,
  placesKey = () => placesKeyPresent(root),
  log = (line) => process.stderr.write(`${line}\n`),
} = {}) {
  const api = createApi({ root, now, loaders, env: { placesKey } });

  async function handleApi(req, res, segs) {
    const hits = matchRoute(segs);
    if (hits.length === 0) throw new HttpError(404, `There is no API route ${req.method} /${segs.join("/")}.`);
    const hit = hits.find((h) => h.method === req.method);
    if (!hit) {
      const allow = [...new Set(hits.map((h) => h.method))].join(", ");
      throw new HttpError(405, `Use ${allow} for /${segs.join("/")}.`, { headers: { Allow: allow } });
    }
    if (hit.method !== "GET" && !isLocalOrigin(req.headers.origin)) {
      throw new HttpError(403, "Changes are only accepted from the app on this machine.");
    }
    const id = hit.params.id;
    switch (hit.name) {
      case "state":
        return sendJson(res, 200, await api.getState());
      case "csv": {
        const { text, date } = api.csv();
        return sendText(res, 200, text, "text/csv; charset=utf-8", {
          "Cache-Control": "no-store",
          "Content-Disposition": `attachment; filename="lead-pipeline-${date}.csv"`,
        });
      }
      case "patchLead":
        return sendJson(res, 200, await api.patchLead(id, await readJsonBody(req)));
      case "addHistory":
        return sendJson(res, 200, await api.addHistory(id, await readJsonBody(req)));
      case "suppressLead":
        return sendJson(res, 200, await api.suppressLead(id, await readJsonBody(req)));
      case "regenerateDemo":
        await readJsonBody(req);
        return sendJson(res, 200, await api.regenerateDemo(id));
      case "regeneratePitch":
        await readJsonBody(req);
        return sendJson(res, 200, await api.regeneratePitch(id));
      case "exportShare":
        await readJsonBody(req);
        return sendJson(res, 200, await api.exportShare(id));
      case "queueDecision":
        return sendJson(res, 200, await api.queueDecision(id, await readJsonBody(req)));
      case "putSettings":
        return sendJson(res, 200, await api.putSettings(await readJsonBody(req)));
      case "addNote":
        return sendJson(res, 200, await api.addNote(await readJsonBody(req)));
      case "patchNote":
        return sendJson(res, 200, await api.patchNote(id, await readJsonBody(req)));
      case "deleteNote":
        await readJsonBody(req);
        return sendJson(res, 200, await api.deleteNote(id));
      default:
        throw new HttpError(404, "Unknown route.");
    }
  }

  async function handle(req, res) {
    let rawPath = String(req.url ?? "/");
    if (!rawPath.startsWith("/")) {
      try {
        rawPath = new URL(rawPath).pathname;
      } catch {
        rawPath = "/";
      }
    }
    rawPath = rawPath.split("?")[0].split("#")[0];
    const isApi = rawPath === "/api" || rawPath.startsWith("/api/");
    try {
      if (!isLocalHost(req.headers.host)) {
        throw new HttpError(403, "This server only answers requests addressed to 127.0.0.1 or localhost.");
      }
      // Decoded, traversal checked segments; the raw path is used so no normalisation hides "..".
      const segs = safeSegments(rawPath).filter((s, i, all) => s !== "" || i < all.length - 1);
      if (isApi) return await handleApi(req, res, segs.slice(0));
      if (req.method !== "GET" && req.method !== "HEAD") {
        throw new HttpError(405, "Static files are read only.", { headers: { Allow: "GET, HEAD" } });
      }
      if (serveStatic(req, res, rawPath, { codeRoot, dataRoot: root })) return undefined;
      throw new HttpError(404, `Nothing is served at ${rawPath}.`);
    } catch (err) {
      if (!(err instanceof HttpError)) log(`[server] ${req.method} ${rawPath}: ${err?.stack ?? err}`);
      if (res.headersSent) {
        res.end();
        return undefined;
      }
      return sendError(res, err, { api: isApi });
    }
  }

  const server = http.createServer((req, res) => {
    handle(req, res);
  });
  // Keep a slow client from holding the process; this is a single user tool.
  server.requestTimeout = 30000;
  server.headersTimeout = 15000;
  return server;
}

export function startServer({ port = Number(process.env.PORT) || DEFAULT_PORT, ...options } = {}) {
  const server = createServer(options);
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, HOST, () => {
      server.off("error", reject);
      resolve(server);
    });
  });
}

async function main() {
  const port = Number(process.env.PORT) || DEFAULT_PORT;
  try {
    const server = await startServer({ port });
    const address = server.address();
    process.stdout.write(`Kija Lead Command Center: http://${HOST}:${address.port}/\n`);
    process.stdout.write("Local only. Nothing in this app contacts a business or publishes anything.\n");
  } catch (err) {
    if (err.code === "EADDRINUSE") {
      process.stderr.write(`Port ${port} is already in use. Stop the other server or run with PORT=<another port>.\n`);
    } else {
      process.stderr.write(`The server could not start: ${err.message}\n`);
    }
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
