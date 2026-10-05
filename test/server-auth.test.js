// Team logins: open mode without users.json, then sign in, roles, forced password change,
// lockout, and the signed in person stamped on what they write. Temp roots only.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createServer } from "../server/server.js";
import { createAuth, hashPassword, verifyPassword } from "../server/auth.js";
import { placeholderBenchmarks, seedToData } from "../src/lib/seed.js";

const PROJECT = new URL("../", import.meta.url);

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kija-auth-"));
  fs.mkdirSync(path.join(root, "config"));
  fs.mkdirSync(path.join(root, "data", "runs"), { recursive: true });
  for (const f of ["settings.json", "categories.json", "geography.json", "chains.json"]) {
    fs.copyFileSync(new URL(`config/${f}`, PROJECT), path.join(root, "config", f));
  }
  const seed = JSON.parse(fs.readFileSync(new URL("seed/sheet-2026-09-28.json", PROJECT), "utf8"));
  const settings = JSON.parse(fs.readFileSync(path.join(root, "config", "settings.json"), "utf8"));
  const categories = JSON.parse(fs.readFileSync(path.join(root, "config", "categories.json"), "utf8"));
  const data = seedToData(seed, { now: "2026-09-28T15:00:00.000Z", thresholds: settings.thresholds });
  const write = (rel, value) => fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`);
  write("data/leads.json", data.leads);
  write("data/queue.json", data.queue);
  write("data/rejected.json", data.rejected);
  write("data/benchmarks.json", placeholderBenchmarks(categories, { updatedAt: "2026-09-28" }));
  write("data/notes.json", []);
  write("data/runs/2026-09-28.json", { runId: "2026-09-28", ingestedAt: "2026-09-28T15:00:00.000Z", mode: "weekly", counts: {} });
  return root;
}

const PW = "correct-horse-battery";
const NEW_PW = "another-long-passphrase";

async function start({ users = false } = {}) {
  const root = tempRoot();
  if (users) {
    const auth = createAuth({ root });
    for (const u of auth.init()) auth.update(u.key, { password: PW });
    // A temp password is forced to change; clear that for everyone but Kyia in these tests.
    const file = path.join(root, "data", "users.json");
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const u of data.users) if (u.key !== "Kyia") u.mustChange = false;
    fs.writeFileSync(file, JSON.stringify(data));
  }
  const server = createServer({ root, placesKey: () => false, log: () => {} });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, url, body, cookie = "") => {
    const res = await fetch(`${base}${url}`, {
      method,
      headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // not JSON
    }
    return { status: res.status, headers: res.headers, text, json };
  };
  const signIn = async (name, password = PW) => {
    const r = await call("POST", "/api/login", { name, password });
    const cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
    return { r, cookie };
  };
  return { root, call, signIn, close: () => new Promise((resolve) => server.close(resolve)).then(() => fs.rmSync(root, { recursive: true, force: true })) };
}

test("password hashing verifies the right password only", () => {
  const h = hashPassword("a-long-password");
  assert.ok(verifyPassword("a-long-password", h));
  assert.ok(!verifyPassword("a-long-passwore", h));
  assert.ok(!verifyPassword("x", "garbage"));
});

test("without data/users.json the app stays open and /api/me says logins are off", async (t) => {
  const s = await start();
  t.after(s.close);
  const me = await s.call("GET", "/api/me");
  assert.equal(me.json.authEnabled, false);
  assert.equal((await s.call("GET", "/api/state")).status, 200);
});

test("with logins on, data routes and generated pages need a session; the shell does not", async (t) => {
  const s = await start({ users: true });
  t.after(s.close);
  assert.equal((await s.call("GET", "/api/state")).status, 401);
  assert.equal((await s.call("GET", "/api/export.csv")).status, 401);
  assert.equal((await s.call("GET", "/demos/anything/")).status, 401);
  assert.equal((await s.call("GET", "/")).status, 200);
  assert.equal((await s.call("GET", "/app/app.js")).status, 200);
  const me = await s.call("GET", "/api/me");
  assert.equal(me.status, 401);
  assert.equal(me.json.ok, false);
});

test("sign in sets an HttpOnly strict cookie; wrong passwords and unknown names give one message", async (t) => {
  const s = await start({ users: true });
  t.after(s.close);
  const bad = await s.call("POST", "/api/login", { name: "Jamey", password: "nope-nope-nope" });
  const ghost = await s.call("POST", "/api/login", { name: "Nobody", password: PW });
  assert.equal(bad.status, 401);
  assert.deepEqual(bad.json.errors, ghost.json.errors);
  const { r, cookie } = await s.signIn("jamey");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("set-cookie"), /HttpOnly/);
  assert.match(r.headers.get("set-cookie"), /SameSite=Strict/);
  assert.equal(r.json.user.key, "Jamey");
  assert.equal(r.json.user.hash, undefined, "no hash ever leaves the server");
  assert.equal((await s.call("GET", "/api/state", undefined, cookie)).status, 200);
  assert.equal((await s.call("POST", "/api/logout", {}, cookie)).status, 200);
  assert.equal((await s.call("GET", "/api/state", undefined, cookie)).status, 401, "the old cookie is dead after sign out");
});

test("five wrong passwords lock the name for ten minutes, even with the right password", async (t) => {
  const s = await start({ users: true });
  t.after(s.close);
  for (let i = 0; i < 5; i += 1) await s.call("POST", "/api/login", { name: "Max", password: "wrong-wrong-wrong" });
  const locked = await s.call("POST", "/api/login", { name: "Max", password: PW });
  assert.equal(locked.status, 429);
});

test("employees cannot change settings or manage users; admins can", async (t) => {
  const s = await start({ users: true });
  t.after(s.close);
  const max = (await s.signIn("Max")).cookie;
  assert.equal((await s.call("PUT", "/api/settings", { offer: { price: 2600 } }, max)).status, 403);
  assert.equal((await s.call("GET", "/api/users", undefined, max)).status, 403);
  assert.equal((await s.call("POST", "/api/users", { key: "Sam", name: "Sam", role: "admin", password: PW }, max)).status, 403);
  const kiel = (await s.signIn("Kiel")).cookie;
  const list = await s.call("GET", "/api/users", undefined, kiel);
  assert.deepEqual(list.json.users.map((u) => u.key), ["Jamey", "Kiel", "Max", "Kyia"]);
  assert.deepEqual(list.json.users.map((u) => u.role), ["admin", "admin", "employee", "employee"]);
  const added = await s.call("POST", "/api/users", { key: "Sam", name: "Sam Lee", role: "employee", password: PW }, kiel);
  assert.equal(added.status, 200, added.text);
});

test("a temporary password blocks everything until the person chooses their own", async (t) => {
  const s = await start({ users: true });
  t.after(s.close);
  const { cookie } = await s.signIn("Kyia");
  assert.equal((await s.call("GET", "/api/state", undefined, cookie)).status, 403);
  assert.equal((await s.call("GET", "/api/me", undefined, cookie)).json.user.mustChange, true);
  assert.equal((await s.call("POST", "/api/password", { current: PW, next: "short" }, cookie)).status, 422);
  assert.equal((await s.call("POST", "/api/password", { current: "wrong-wrong-wrong", next: NEW_PW }, cookie)).status, 403);
  const changed = await s.call("POST", "/api/password", { current: PW, next: NEW_PW }, cookie);
  assert.equal(changed.status, 200, changed.text);
  const fresh = changed.headers.get("set-cookie").split(";")[0];
  assert.equal((await s.call("GET", "/api/state", undefined, fresh)).status, 200);
  assert.equal((await s.call("GET", "/api/state", undefined, cookie)).status, 401, "the old session ends");
  assert.equal((await s.signIn("Kyia", NEW_PW)).r.status, 200);
});

test("notes and history are stamped with the signed in person, whatever the request claims", async (t) => {
  const s = await start({ users: true });
  t.after(s.close);
  const kyia = createAuth({ root: s.root });
  kyia.update("Kyia", { password: PW });
  const file = path.join(s.root, "data", "users.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const u of data.users) u.mustChange = false;
  fs.writeFileSync(file, JSON.stringify(data));
  const cookie = (await s.signIn("Kyia")).cookie;
  const note = await s.call("POST", "/api/notes", { text: "Call Thursday", author: "Jamey" }, cookie);
  assert.equal(note.status, 200, note.text);
  assert.equal(note.json.note.author, "Kyia");
});

test("the last active admin cannot be demoted or disabled", async (t) => {
  const s = await start({ users: true });
  t.after(s.close);
  const jamey = (await s.signIn("Jamey")).cookie;
  assert.equal((await s.call("PATCH", "/api/users/Kiel", { active: false }, jamey)).status, 200);
  assert.equal((await s.call("PATCH", "/api/users/Jamey", { role: "employee" }, jamey)).status, 422);
  assert.equal((await s.call("GET", "/api/state", undefined, jamey)).status, 200);
});
