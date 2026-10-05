// Team logins. Users live in data/users.json (gitignored: it holds password hashes). Passwords
// are hashed with scrypt, sessions are random tokens held in memory, and the cookie is HttpOnly
// and SameSite=Strict. When data/users.json does not exist the app runs open, as before; run
// npm run users -- init to turn logins on. Nothing here contacts anyone.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { HttpError } from "./http.js";

export const COOKIE = "kija_session";
export const ROLES = ["admin", "employee"];
export const MIN_PASSWORD = 10;
const SESSION_MS = 12 * 60 * 60 * 1000;
const MAX_FAILS = 5;
const LOCK_MS = 10 * 60 * 1000;

// Keys match the owner and author keys the records already store.
export const DEFAULT_TEAM = [
  { key: "Jamey", name: "Jamey White", role: "admin" },
  { key: "Kiel", name: "Kiel Jared", role: "admin" },
  { key: "Max", name: "Max Miller", role: "employee" },
  { key: "Kyia", name: "Kyia Brocken", role: "employee" },
];

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [alg, saltHex, hashHex] = String(stored ?? "").split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const want = Buffer.from(hashHex, "hex");
  const got = crypto.scryptSync(String(password), Buffer.from(saltHex, "hex"), want.length);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

export function generatePassword() {
  return crypto.randomBytes(12).toString("base64url");
}

function publicUser(u) {
  return { key: u.key, name: u.name, role: u.role, active: u.active !== false, mustChange: Boolean(u.mustChange) };
}

export function parseCookies(header) {
  const out = {};
  for (const part of String(header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

export function createAuth({ root, now = () => new Date() }) {
  const file = path.join(root, "data", "users.json");
  const sessions = new Map();
  const fails = new Map();

  function read() {
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      return Array.isArray(data.users) ? data.users : [];
    } catch {
      return [];
    }
  }
  function write(users) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify({ users }, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(tmp, file);
  }
  const find = (users, key) => users.find((u) => u.key.toLowerCase() === String(key ?? "").trim().toLowerCase());
  const enabled = () => read().length > 0;

  function checkPassword(pw) {
    if (typeof pw !== "string" || pw.length < MIN_PASSWORD) {
      throw new HttpError(422, `A password needs at least ${MIN_PASSWORD} characters.`);
    }
  }

  function userFor(req) {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    const s = token && sessions.get(token);
    if (!s) return null;
    if (s.expires < now().getTime()) {
      sessions.delete(token);
      return null;
    }
    const u = find(read(), s.key);
    return u && u.active !== false ? u : null;
  }

  function startSession(key) {
    const token = crypto.randomBytes(32).toString("base64url");
    sessions.set(token, { key, expires: now().getTime() + SESSION_MS });
    return token;
  }
  const dropSessions = (key) => {
    for (const [t, s] of sessions) if (s.key === key) sessions.delete(t);
  };

  function login(key, password) {
    const k = String(key ?? "").trim().toLowerCase();
    const f = fails.get(k);
    if (f && f.until > now().getTime()) throw new HttpError(429, "Too many wrong passwords. Wait ten minutes and try again.");
    const u = find(read(), key);
    // One message for every failure so the form does not reveal which names exist.
    if (!u || u.active === false || !verifyPassword(password, u.hash)) {
      const n = (f && f.until && f.until <= now().getTime() ? 0 : f?.count ?? 0) + 1;
      fails.set(k, { count: n, until: n >= MAX_FAILS ? now().getTime() + LOCK_MS : 0 });
      throw new HttpError(401, "That name and password do not match.");
    }
    fails.delete(k);
    return { token: startSession(u.key), user: publicUser(u) };
  }

  function logout(req) {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (token) sessions.delete(token);
  }

  function changePassword(user, current, next) {
    const users = read();
    const u = find(users, user.key);
    if (!u || !verifyPassword(current, u.hash)) throw new HttpError(403, "The current password is not right.");
    checkPassword(next);
    if (next === current) throw new HttpError(422, "Choose a password different from the current one.");
    u.hash = hashPassword(next);
    u.mustChange = false;
    write(users);
    dropSessions(u.key);
    return { token: startSession(u.key), user: publicUser(u) };
  }

  // Admin tools. Each returns the public user list.
  function list() {
    return read().map(publicUser);
  }
  function add({ key, name, role, password }) {
    const users = read();
    const k = String(key ?? "").trim();
    if (!/^[A-Za-z][A-Za-z0-9]{1,23}$/.test(k)) throw new HttpError(422, "A login name is 2 to 24 letters or digits, starting with a letter.");
    if (find(users, k)) throw new HttpError(409, `${k} already has a login.`);
    if (!ROLES.includes(role)) throw new HttpError(422, `Role must be ${ROLES.join(" or ")}.`);
    if (typeof name !== "string" || !name.trim()) throw new HttpError(422, "A full name is required.");
    checkPassword(password);
    users.push({ key: k, name: name.trim(), role, hash: hashPassword(password), mustChange: true, active: true });
    write(users);
    return list();
  }
  function update(key, { role, active, password }) {
    const users = read();
    const u = find(users, key);
    if (!u) throw new HttpError(404, `There is no login named ${key}.`);
    if (role !== undefined) {
      if (!ROLES.includes(role)) throw new HttpError(422, `Role must be ${ROLES.join(" or ")}.`);
      u.role = role;
    }
    if (active !== undefined) u.active = Boolean(active);
    if (!users.some((x) => x.role === "admin" && x.active !== false)) throw new HttpError(422, "At least one active admin must remain.");
    if (password !== undefined) {
      checkPassword(password);
      u.hash = hashPassword(password);
      u.mustChange = true;
    }
    if (u.active === false || password !== undefined || role !== undefined) dropSessions(u.key);
    write(users);
    return list();
  }

  // For the CLI: create the default team with random temporary passwords. Returns them once.
  function init(team = DEFAULT_TEAM) {
    const users = read();
    const issued = [];
    for (const t of team) {
      if (find(users, t.key)) continue;
      const password = generatePassword();
      users.push({ ...t, hash: hashPassword(password), mustChange: true, active: true });
      issued.push({ key: t.key, name: t.name, role: t.role, password });
    }
    if (issued.length) write(users);
    return issued;
  }

  return { enabled, userFor, login, logout, changePassword, list, add, update, init };
}
