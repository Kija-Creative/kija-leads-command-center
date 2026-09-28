// Static routes: the app shell and its modules, generated pages, the pure lib modules the
// browser imports, and refusal of everything else, including traversal attempts.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "../server/server.js";
import { BROWSER_LIB_MODULES } from "../server/static.js";

const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ID = "gm-auto-care-dallas-tx";

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kija-static-"));
  fs.mkdirSync(path.join(root, "config"));
  fs.mkdirSync(path.join(root, "data"));
  for (const f of ["settings.json", "categories.json", "geography.json", "chains.json"]) {
    fs.copyFileSync(path.join(PROJECT_DIR, "config", f), path.join(root, "config", f));
  }
  fs.writeFileSync(path.join(root, "data", "leads.json"), "[]\n");
  fs.writeFileSync(path.join(root, "data", "secret.json"), "{\"do-not-serve\": true}\n");
  fs.mkdirSync(path.join(root, "demos", ID), { recursive: true });
  fs.writeFileSync(path.join(root, "demos", ID, "index.html"), "<!doctype html><title>Demo</title>");
  fs.mkdirSync(path.join(root, "exports"));
  fs.writeFileSync(path.join(root, "exports", `${ID}-concept.html`), "<p>share</p>");
  return root;
}

async function start() {
  const root = tempRoot();
  const server = createServer({ root, now: () => new Date("2026-09-28T15:00:00Z"), placesKey: () => false, log: () => {} });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  return { root, port, base: `http://127.0.0.1:${port}`, close: () => new Promise((resolve) => server.close(resolve)).then(() => fs.rmSync(root, { recursive: true, force: true })) };
}

// Raw request: the path is sent exactly as written, so dot segments are not normalised away.
function raw(port, rawPath, { method = "GET", headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path: rawPath, method, headers }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => {
        body += c;
      });
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

test("the app shell and its assets are served with the right content types", async (t) => {
  const s = await start();
  t.after(s.close);
  const home = await raw(s.port, "/");
  assert.equal(home.status, 200);
  assert.match(home.headers["content-type"], /^text\/html; charset=utf-8/);
  assert.match(home.body, /<script type="module" src="\/app\/app\.js"><\/script>/);
  assert.equal(home.headers["x-content-type-options"], "nosniff");
  const css = await raw(s.port, "/app/styles.css");
  assert.equal(css.status, 200);
  assert.match(css.headers["content-type"], /^text\/css/);
  const js = await raw(s.port, "/app/app.js");
  assert.equal(js.status, 200);
  assert.match(js.headers["content-type"], /^text\/javascript/);
  const icon = await raw(s.port, "/app/favicon.svg");
  assert.equal(icon.status, 200);
  assert.match(icon.headers["content-type"], /^image\/svg\+xml/);
  const appIndex = await raw(s.port, "/app/");
  assert.equal(appIndex.status, 200);
});

test("every local reference in the app resolves on the server", async (t) => {
  const s = await start();
  t.after(s.close);
  const appDir = path.join(PROJECT_DIR, "app");
  const urls = new Set();
  const html = fs.readFileSync(path.join(appDir, "index.html"), "utf8");
  for (const m of html.matchAll(/(?:src|href)="(\/[^"]*)"/g)) if (!m[1].startsWith("/api/")) urls.add(m[1]);
  for (const file of walk(appDir).filter((f) => f.endsWith(".js"))) {
    const text = fs.readFileSync(file, "utf8");
    const fileUrl = `/app/${path.relative(appDir, file).split(path.sep).join("/")}`;
    for (const m of text.matchAll(/(?:^|\n)\s*import\s[^;]*?from\s+"([^"]+)"/g)) {
      urls.add(new URL(m[1], `http://x${fileUrl}`).pathname);
    }
  }
  assert.ok(urls.size > 15, `found ${urls.size} references`);
  for (const url of urls) {
    const r = await raw(s.port, url);
    assert.equal(r.status, 200, `${url} should be served`);
    if (url.endsWith(".js")) assert.match(r.headers["content-type"], /^text\/javascript/, url);
  }
});

test("only the pure lib modules are served to the browser", async (t) => {
  const s = await start();
  t.after(s.close);
  const roi = await raw(s.port, "/src/lib/roi.js");
  assert.equal(roi.status, 200);
  assert.match(roi.headers["content-type"], /^text\/javascript/);
  assert.match(roi.body, /export function computeRoi/);
  for (const name of BROWSER_LIB_MODULES) {
    const text = fs.readFileSync(path.join(PROJECT_DIR, "src", "lib", name), "utf8");
    assert.ok(!/node:/.test(text), `${name} is pure and imports no node built ins`);
    for (const m of text.matchAll(/from\s+"\.\/([^"]+)"/g)) assert.ok(BROWSER_LIB_MODULES.has(m[1]), `${name} imports ${m[1]}, which must also be served`);
  }
  for (const p of ["/src/lib/store.js", "/src/lib/ingest.js", "/src/lib/seed.js", "/src/cli/check.js", "/src/discovery/env.js", "/server/server.js", "/package.json", "/SPEC.md"]) {
    const r = await raw(s.port, p);
    assert.equal(r.status, 404, `${p} must not be served`);
  }
});

test("path traversal is rejected and nothing outside the served folders leaks", async (t) => {
  const s = await start();
  t.after(s.close);
  const attempts = [
    "/app/../data/secret.json",
    "/app/../../package.json",
    "/app/..%2fdata%2fsecret.json",
    "/app/%2e%2e/%2e%2e/package.json",
    "/app/..%5c..%5cpackage.json",
    "/app/.%2e/data/secret.json",
    "/demos/..%2f..%2fdata/",
    "/demos/../data/secret.json",
    "/exports/..%2fdata%2fsecret.json",
    "/exports/../data/secret.json",
    "/app/%00index.html",
    "/src/lib/..%2fcli%2fcheck.js",
    "/app/C:%5cWindows%5cwin.ini",
    "/.env",
    "/data/secret.json",
    "/config/settings.json",
  ];
  for (const p of attempts) {
    const r = await raw(s.port, p);
    assert.ok(r.status === 403 || r.status === 404 || r.status === 400, `${p} answered ${r.status}`);
    assert.ok(!r.body.includes("do-not-serve"), `${p} leaked data`);
    assert.ok(!r.body.includes("\"scripts\""), `${p} leaked package.json`);
  }
  const dots = await raw(s.port, "/app/../data/secret.json");
  assert.equal(dots.status, 403);
  assert.match(dots.body, /outside what this server shares/);
});

test("generated demos, pitches and exports are served from their folders only", async (t) => {
  const s = await start();
  t.after(s.close);
  const demo = await raw(s.port, `/demos/${ID}/`);
  assert.equal(demo.status, 200);
  assert.match(demo.headers["content-type"], /^text\/html/);
  assert.equal(demo.headers["x-robots-tag"], "noindex, nofollow");
  const redirect = await raw(s.port, `/demos/${ID}`);
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.location, `/demos/${ID}/`);
  const missingPitch = await raw(s.port, `/pitches/${ID}/`);
  assert.equal(missingPitch.status, 404);
  const badId = await raw(s.port, "/demos/Not_A_Slug/");
  assert.equal(badId.status, 404);
  const deeper = await raw(s.port, `/demos/${ID}/other.html`);
  assert.equal(deeper.status, 404);
  const share = await raw(s.port, `/exports/${ID}-concept.html`);
  assert.equal(share.status, 200);
  assert.equal(share.headers["cache-control"], "no-store");
  const unknown = await raw(s.port, "/nothing/here");
  assert.equal(unknown.status, 404);
  const post = await raw(s.port, "/app/app.js", { method: "POST" });
  assert.equal(post.status, 405);
});

test("API replies are never cached, and a foreign Host header is refused", async (t) => {
  const s = await start();
  t.after(s.close);
  const state = await raw(s.port, "/api/state");
  assert.equal(state.status, 200);
  assert.equal(state.headers["cache-control"], "no-store");
  assert.match(state.headers["content-type"], /^application\/json/);
  const rebind = await raw(s.port, "/api/state", { headers: { Host: "attacker.example:4242" } });
  assert.equal(rebind.status, 403);
  const localhost = await raw(s.port, "/api/state", { headers: { Host: `localhost:${s.port}` } });
  assert.equal(localhost.status, 200);
});

test("server and app files contain no em or en dashes", () => {
  const dash = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
  const files = [...walk(path.join(PROJECT_DIR, "app")), ...walk(path.join(PROJECT_DIR, "server"))];
  files.push(path.join(PROJECT_DIR, "test", "server-api.test.js"), path.join(PROJECT_DIR, "test", "server-static.test.js"));
  for (const file of files) {
    assert.ok(!dash.test(fs.readFileSync(file, "utf8")), `${path.relative(PROJECT_DIR, file)} has a dash`);
  }
});
