/**
 * Crontech project hand-off — the primary deploy path for the AI Builder.
 *
 * Unlike GitHub sync (which is a developer workflow: branch + PR + review),
 * Crontech sync is a one-shot project drop: the entire generated file
 * tree is POSTed to Crontech's project API with our service PAT, and
 * Crontech provisions hosting + URL + SSL + CDN behind the scenes.
 *
 *   user clicks "Deploy"
 *   → Zoobicon serializes { files, deps, meta } to JSON
 *   → POST https://api.crontech.ai/api/v1/projects   (Bearer <CRONTECH_PAT>)
 *   → Crontech returns { projectId, url, status }
 *   → Zoobicon shows the live URL in the builder UI
 *
 * STATUS: mocked against the contract below. When Crontech ships the
 * real endpoint, swap the URL in CRONTECH_API_BASE and verify the
 * response shape matches.
 *
 * CONTRACT WE NEED FROM CRONTECH (hand to the Crontech team):
 *
 *   POST {CRONTECH_API_BASE}/api/v1/projects
 *   Headers:
 *     Authorization: Bearer <PAT>
 *     Content-Type: application/json
 *     X-Crontech-Source: zoobicon-builder
 *   Body:
 *     {
 *       "name": "string",                  // project slug, /^[a-z0-9-]{1,40}$/
 *       "files": { "<path>": "<content>" }, // file tree, paths POSIX-style
 *       "deps":  { "<package>": "<version>" },
 *       "meta": {
 *         "source": "zoobicon-ai-builder",
 *         "createdBy": "<email>",           // Crontech SSO subject if known
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
 *     413  payload too large (Crontech caps at TBD MB)
 *     5xx  upstream — Zoobicon surfaces "deploy failed, try again"
 *
 *   GET {CRONTECH_API_BASE}/api/v1/projects/{projectId}
 *   Returns:
 *     { projectId, url, status, lastDeployedAt }
 */

const CRONTECH_API_BASE = process.env.CRONTECH_API_BASE || "https://api.crontech.ai";
const CRONTECH_PAT = process.env.CRONTECH_PAT || "";

export interface CrontechSyncInput {
  name: string;
  files: Record<string, string>;
  deps?: Record<string, string>;
  meta?: {
    createdBy?: string;
    prompt?: string;
    template?: string | null;
    visibility?: "public" | "admin_private";
  };
}

export interface CrontechSyncResult {
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
 * Normalise a project name into the slug shape Crontech expects.
 * Conservative: lowercase, alphanumerics + hyphen, 40 chars max.
 */
export function toCrontechSlug(name: string): string {
  return (name || "untitled")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "untitled";
}

/**
 * Push a built project to Crontech. Mocked until CRONTECH_PAT is set —
 * returns a fake live URL so the UI/end-to-end test still works locally.
 */
export async function pushToCrontech(input: CrontechSyncInput): Promise<CrontechSyncResult> {
  const slug = toCrontechSlug(input.name);

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
        "X-Crontech-Source": "zoobicon-builder",
      },
      body: JSON.stringify({
        name: slug,
        files: input.files,
        deps: input.deps || {},
        meta: {
          source: "zoobicon-ai-builder",
          ...input.meta,
        },
      }),
      // 30s budget — Crontech provisioning can take a moment on cold tenants
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Crontech ${res.status}: ${text.slice(0, 200) || res.statusText}`,
      };
    }

    const data = (await res.json()) as { projectId: string; url: string; status: "provisioning" | "live" };
    return { ok: true, projectId: data.projectId, url: data.url, status: data.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Crontech sync failed",
    };
  }
}

/**
 * Poll a Crontech project's status. Used after the initial POST when
 * Crontech returns `status: "provisioning"` — the UI shows a spinner
 * and re-checks every few seconds until status flips to `"live"`.
 */
export async function getCrontechStatus(projectId: string): Promise<CrontechSyncResult> {
  if (!crontechAvailable() || projectId.startsWith("mock-")) {
    return { ok: true, mocked: true, projectId, status: "live", url: `https://${projectId}.crontech.app` };
  }
  try {
    const res = await fetch(`${CRONTECH_API_BASE}/api/v1/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${CRONTECH_PAT}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, error: `Crontech ${res.status}` };
    const data = (await res.json()) as { projectId: string; url: string; status: "provisioning" | "live" };
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Status check failed" };
  }
}
