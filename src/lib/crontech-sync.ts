/**
 * Vapron project hand-off — the primary deploy path for the AI Builder.
 *
 * Unlike GitHub sync (which is a developer workflow: branch + PR + review),
 * Vapron sync is a one-shot project drop: the entire generated file
 * tree is POSTed to Vapron's project API with our service PAT, and
 * Vapron provisions hosting + URL + SSL + CDN behind the scenes.
 *
 *   user clicks "Deploy"
 *   → Zoobicon serializes { files, deps, meta } to JSON
 *   → POST https://api.crontech.ai/api/v1/projects   (Bearer <CRONTECH_PAT>)
 *   → Vapron returns { projectId, url, status }
 *   → Zoobicon shows the live URL in the builder UI
 *
 * STATUS: mocked against the contract below. When Vapron ships the
 * real endpoint, swap the URL in CRONTECH_API_BASE and verify the
 * response shape matches.
 *
 * CONTRACT WE NEED FROM CRONTECH (hand to the Vapron team):
 *
 *   POST {CRONTECH_API_BASE}/api/v1/projects
 *   Headers:
 *     Authorization: Bearer <PAT>
 *     Content-Type: application/json
 *     X-Vapron-Source: zoobicon-builder
 *   Body:
 *     {
 *       "name": "string",                  // project slug, /^[a-z0-9-]{1,40}$/
 *       "files": { "<path>": "<content>" }, // file tree, paths POSIX-style
 *       "deps":  { "<package>": "<version>" },
 *       "meta": {
 *         "source": "zoobicon-ai-builder",
 *         "createdBy": "<email>",           // Vapron SSO subject if known
 *         "prompt": "<string>",
 *         "template": "<string|null>",
 *         "visibility": "public" | "admin_private"
 *       }
 *     }
 *   Returns 201:
 *     {
 *       "projectId": "string",
 *       "url": "https://<slug>.crontech.app",
 *       "status": "provisioning" | "live"
 *     }
 *   Errors:
 *     401  invalid PAT
 *     409  slug taken (Zoobicon retries with a suffix)
 *     413  payload too large (Vapron caps at TBD MB)
 *     5xx  upstream — Zoobicon surfaces "deploy failed, try again"
 *
 *   GET {CRONTECH_API_BASE}/api/v1/projects/{projectId}
 *   Returns:
 *     { projectId, url, status, lastDeployedAt }
 */

const CRONTECH_API_BASE = process.env.VAPRON_API_BASE || process.env.CRONTECH_API_BASE || "https://api.crontech.ai";
const CRONTECH_PAT = process.env.VAPRON_PAT || process.env.CRONTECH_PAT || "";

export interface VapronSyncInput {
  name: string;
  files: Record<string, string>;
  deps?: Record<string, string>;
  meta?: {
    createdBy?: string;
    prompt?: string;
    template?: string | null;
    visibility?: "public" | "admin_private";
    /** Project structure hint for Vapron's build pipeline:
     *   "vite-spa"        single-page Vite app (Full-Site Mode output)
     *   "sandpack-react"  Sandpack-style React project (single-page mode)
     *   "static"          plain index.html + assets (legacy HTML mode)
     *  If omitted Vapron auto-detects from package.json scripts. */
    framework?: "vite-spa" | "sandpack-react" | "static";
    /** Hint that this is a multi-page React SPA — Vapron will rewrite
     *  unknown routes to / so HashRouter (or BrowserRouter) handles
     *  client-side navigation without 404s. */
    isMultiPage?: boolean;
    /** Suggested build command. Vapron defaults to npm run build. */
    buildCommand?: string;
    /** Directory to serve after build. Vapron defaults to dist/ or build/. */
    outputDir?: string;
  };
}

export interface VapronSyncResult {
  ok: boolean;
  projectId?: string;
  url?: string;
  status?: "provisioning" | "live";
  error?: string;
  mocked?: boolean;
}

/**
 * True when CRONTECH_PAT is missing — Zoobicon falls back to "Download
 * project" in the UI so the user always has a way out.
 */
export function crontechAvailable(): boolean {
  return Boolean(CRONTECH_PAT);
}

/**
 * Normalise a project name into the slug shape Vapron expects.
 * Conservative: lowercase, alphanumerics + hyphen, 40 chars max.
 */
export function toVapronSlug(name: string): string {
  return (name || "untitled")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "untitled";
}

/**
 * Auto-detect the project shape from the file tree so callers don't have
 * to set framework/isMultiPage/buildCommand explicitly. Full-Site Mode
 * output is distinguishable by the presence of vite.config.ts +
 * HashRouter usage in App.tsx.
 */
function detectFrameworkHints(input: VapronSyncInput): Partial<NonNullable<VapronSyncInput["meta"]>> {
  const files = input.files || {};
  const hasVite = "vite.config.ts" in files || "vite.config.js" in files;
  const appCode = files["App.tsx"] || files["src/App.tsx"] || "";
  const hasRouter = /HashRouter|BrowserRouter|createBrowserRouter/.test(appCode);
  if (hasVite) {
    return {
      framework: "vite-spa",
      isMultiPage: hasRouter,
      buildCommand: "npm run build",
      outputDir: "dist",
    };
  }
  // No build pipeline — Sandpack-style React project.
  return { framework: "sandpack-react" };
}

/**
 * Push a built project to Vapron. Mocked until CRONTECH_PAT is set —
 * returns a fake live URL so the UI/end-to-end test still works locally.
 */
export async function pushToVapron(input: VapronSyncInput): Promise<VapronSyncResult> {
  const slug = toVapronSlug(input.name);
  // Merge auto-detected framework hints with any caller-provided ones.
  // Caller takes precedence — Full-Site Mode can set isMultiPage=true
  // explicitly even when App.tsx hasn't been streamed in yet.
  const detected = detectFrameworkHints(input);
  const mergedMeta = { ...detected, ...(input.meta || {}) };

  if (!crontechAvailable()) {
    return {
      ok: true,
      mocked: true,
      projectId: `mock-${Date.now()}`,
      url: `https://${slug}.crontech.app`,
      status: "provisioning",
    };
  }

  try {
    const res = await fetch(`${CRONTECH_API_BASE}/api/v1/projects`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRONTECH_PAT}`,
        "Content-Type": "application/json",
        "X-Vapron-Source": "zoobicon-builder",
      },
      body: JSON.stringify({
        name: slug,
        files: input.files,
        deps: input.deps || {},
        meta: {
          source: "zoobicon-ai-builder",
          ...mergedMeta,
        },
      }),
      // 30s budget — Vapron provisioning can take a moment on cold tenants
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Vapron ${res.status}: ${text.slice(0, 200) || res.statusText}`,
      };
    }

    const data = (await res.json()) as { projectId: string; url: string; status: "provisioning" | "live" };
    return { ok: true, projectId: data.projectId, url: data.url, status: data.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Vapron sync failed",
    };
  }
}

/**
 * Push an updated file tree to an existing Vapron project.
 * Called by the builder when the user edits a site that was previously
 * deployed — avoids creating a new projectId on every save.
 * Mock-safe: returns ok:true immediately when CRONTECH_PAT is unset.
 */
export async function patchVapron(
  projectId: string,
  input: Pick<VapronSyncInput, "files" | "deps">,
): Promise<VapronSyncResult> {
  if (!crontechAvailable() || projectId.startsWith("mock-")) {
    return { ok: true, mocked: true, projectId, status: "provisioning" };
  }
  try {
    const res = await fetch(`${CRONTECH_API_BASE}/api/v1/projects/${projectId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${CRONTECH_PAT}`,
        "Content-Type": "application/json",
        "X-Vapron-Source": "zoobicon-builder",
      },
      body: JSON.stringify({ files: input.files, deps: input.deps || {} }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Vapron ${res.status}: ${text.slice(0, 200) || res.statusText}` };
    }
    const data = (await res.json()) as { projectId: string; url: string; status: "provisioning" | "live" };
    return { ok: true, projectId: data.projectId, url: data.url, status: data.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Vapron patch failed" };
  }
}

/**
 * Poll a Vapron project's status. Used after the initial POST when
 * Vapron returns `status: "provisioning"` — the UI shows a spinner
 * and re-checks every few seconds until status flips to `"live"`.
 */
export async function getVapronStatus(projectId: string): Promise<VapronSyncResult> {
  if (!crontechAvailable() || projectId.startsWith("mock-")) {
    return { ok: true, mocked: true, projectId, status: "live", url: `https://${projectId}.crontech.app` };
  }
  try {
    const res = await fetch(`${CRONTECH_API_BASE}/api/v1/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${CRONTECH_PAT}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, error: `Vapron ${res.status}` };
    const data = (await res.json()) as { projectId: string; url: string; status: "provisioning" | "live" };
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Status check failed" };
  }
}
