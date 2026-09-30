// Small shared helpers for the loaders. File IO lives only in the loaders and history.ts; the
// selection, prompt and audit functions are pure.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The project root (two levels above this file).
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

export function uniq<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

export type JsonRead = { ok: true; value: unknown } | { ok: false; error: string };

// Reads and parses one JSON file, returning a sentence instead of throwing.
export function readJson(file: string): JsonRead {
  let text: string;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (err) {
    return { ok: false, error: `${relative(file)} could not be read (${(err as Error).message}).` };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: `${relative(file)} is not valid JSON (${(err as Error).message}).` };
  }
}

export function writeJsonAtomic(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, file);
}

export function writeTextAtomic(file: string, text: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, file);
}

// A path relative to the project root with forward slashes, for sentences.
export function relative(file: string, root = PROJECT_ROOT): string {
  const rel = path.relative(root, file);
  return (rel && !rel.startsWith("..") ? rel : file).split(path.sep).join("/");
}

export function toIso(now: string | Date | undefined): string {
  if (now instanceof Date) return now.toISOString();
  if (typeof now === "string" && now.trim()) {
    const d = new Date(now);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  throw new Error("The engine needs an injected `now` (an ISO string or Date); it never reads the clock itself.");
}

// Every value in `values` that is not in `allowed`, for "unknown value" sentences.
export function unknownValues(values: readonly string[], allowed: readonly string[]): string[] {
  const set = new Set(allowed);
  return values.filter((v) => !set.has(v));
}
