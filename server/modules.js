// Lazy loaders for modules owned by other parts of the build (demo generator, pitch pages,
// outreach drafts). They load on demand so the server runs, and degrades with a clear
// sentence, while any of them is missing.

export const DEFAULT_LOADERS = {
  demoBuild: () => import("../src/cli/build-demos.js"),
  demoRender: () => import("../src/demo/render.js"),
  guardrails: () => import("../src/demo/guardrails.js"),
  pitchBuild: () => import("../src/cli/build-pitches.js"),
  pitch: () => import("../src/pitch/render.js"),
  drafts: () => import("../src/pitch/drafts.js"),
};

// Resolves to { mod, error }. mod is null when the file is missing or fails to load;
// error then says which, so a broken module is not mistaken for an absent one.
export async function tryLoad(loaders, name) {
  const loader = loaders?.[name];
  if (typeof loader !== "function") return { mod: null, error: "not configured" };
  try {
    return { mod: await loader(), error: "" };
  } catch (err) {
    const missing = err?.code === "ERR_MODULE_NOT_FOUND";
    return { mod: null, error: missing ? "not installed yet" : `failed to load: ${err?.message ?? err}` };
  }
}
