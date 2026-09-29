// Fetch wrappers for the local API. Every call resolves to { ok, errors, warnings, ... }
// so views can show what the server said, including network failures.

async function call(method, url, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      cache: "no-store",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, errors: ["Could not reach the local server. Check that npm start is still running."], warnings: [] };
  }
  let data;
  try {
    data = await res.json();
  } catch {
    data = { ok: false, errors: [`The server answered ${res.status} without a readable body.`], warnings: [] };
  }
  if (typeof data !== "object" || data === null) data = { ok: false, errors: ["The server sent an unexpected reply."], warnings: [] };
  if (data.ok === undefined) data.ok = res.ok;
  data.errors = Array.isArray(data.errors) ? data.errors : [];
  data.warnings = Array.isArray(data.warnings) ? data.warnings : [];
  data.status = res.status;
  return data;
}

const enc = encodeURIComponent;

export const api = {
  state: () => call("GET", "/api/state"),
  patchLead: (id, body) => call("PATCH", `/api/leads/${enc(id)}`, body),
  addHistory: (id, body) => call("POST", `/api/leads/${enc(id)}/history`, body),
  suppress: (id, body) => call("POST", `/api/leads/${enc(id)}/suppress`, body),
  buildDemo: (id) => call("POST", `/api/leads/${enc(id)}/demo`),
  buildPitch: (id) => call("POST", `/api/leads/${enc(id)}/pitch`),
  exportShare: (id) => call("POST", `/api/leads/${enc(id)}/export`),
  queueDecision: (id, body) => call("POST", `/api/queue/${enc(id)}/decision`, body),
  putSettings: (body) => call("PUT", "/api/settings", body),
  addNote: (body) => call("POST", "/api/notes", body),
  editNote: (id, body) => call("PATCH", `/api/notes/${enc(id)}`, body),
  deleteNote: (id) => call("DELETE", `/api/notes/${enc(id)}`),
};
