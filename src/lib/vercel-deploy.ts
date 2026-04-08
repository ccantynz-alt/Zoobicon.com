/**
 * Vercel one-click deploy wrapper.
 * Uses the Vercel REST API directly (no SDK dependency).
 */

export interface VercelDeployRequest {
  projectName: string;
  files: Record<string, string>;
  framework?: "nextjs" | "vite" | "static";
  envVars?: Record<string, string>;
}

export interface VercelDeployResult {
  url: string;
  inspectorUrl: string;
  deploymentId: string;
  state: "READY" | "BUILDING" | "ERROR";
  cost: number;
}

export function isVercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN);
}

export function getVercelToken(): string {
  const token = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN;
  if (!token) {
    throw new Error(
      "Vercel deploy is not configured. Set VERCEL_TOKEN (or VERCEL_API_TOKEN) in your environment to enable one-click deploy."
    );
  }
  return token;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52) || "zoobicon-app";
}

function frameworkSettings(framework: VercelDeployRequest["framework"]): {
  framework: string | null;
  buildCommand: string | null;
  outputDirectory: string | null;
  installCommand: string | null;
  devCommand: string | null;
} {
  switch (framework) {
    case "nextjs":
      return {
        framework: "nextjs",
        buildCommand: "next build",
        outputDirectory: ".next",
        installCommand: "npm install",
        devCommand: "next dev",
      };
    case "static":
      return {
        framework: null,
        buildCommand: null,
        outputDirectory: null,
        installCommand: null,
        devCommand: null,
      };
    case "vite":
    default:
      return {
        framework: "vite",
        buildCommand: "vite build",
        outputDirectory: "dist",
        installCommand: "npm install",
        devCommand: "vite",
      };
  }
}

interface VercelDeploymentResponse {
  id?: string;
  url?: string;
  inspectorUrl?: string;
  readyState?: string;
  state?: string;
  error?: { message?: string; code?: string };
}

function isDeploymentResponse(value: unknown): value is VercelDeploymentResponse {
  return typeof value === "object" && value !== null;
}

function readState(resp: VercelDeploymentResponse): "READY" | "BUILDING" | "ERROR" {
  const raw = (resp.readyState || resp.state || "").toUpperCase();
  if (raw === "READY") return "READY";
  if (raw === "ERROR" || raw === "CANCELED" || raw === "FAILED") return "ERROR";
  return "BUILDING";
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function vercelFetch(
  url: string,
  init: RequestInit,
  attempts = 4
): Promise<unknown> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status >= 500) {
        lastErr = new Error(`Vercel API ${res.status}: ${await res.text()}`);
      } else {
        const json: unknown = await res.json();
        if (!res.ok) {
          const msg =
            isDeploymentResponse(json) && json.error?.message
              ? json.error.message
              : `Vercel API error ${res.status}`;
          throw new Error(msg);
        }
        return json;
      }
    } catch (err) {
      lastErr = err;
    }
    await sleep(500 * Math.pow(2, i));
  }
  throw lastErr instanceof Error ? lastErr : new Error("Vercel API failed");
}

export async function deployToVercel(
  req: VercelDeployRequest
): Promise<VercelDeployResult> {
  const token = getVercelToken();
  const name = slugify(req.projectName);
  const settings = frameworkSettings(req.framework);

  const fileEntries = Object.entries(req.files);
  if (fileEntries.length === 0) {
    throw new Error("No files provided to deploy. Generate a project first.");
  }

  const files = fileEntries.map(([file, data]) => ({
    file: file.replace(/^\/+/, ""),
    data,
    encoding: "utf-8" as const,
  }));

  const env = req.envVars
    ? Object.entries(req.envVars).map(([key, value]) => ({
        key,
        value,
        target: ["production", "preview"],
        type: "encrypted",
      }))
    : undefined;

  const body: Record<string, unknown> = {
    name,
    files,
    target: "production",
    projectSettings: {
      framework: settings.framework,
      buildCommand: settings.buildCommand,
      outputDirectory: settings.outputDirectory,
      installCommand: settings.installCommand,
      devCommand: settings.devCommand,
    },
  };
  if (env) body.env = env;

  const created = (await vercelFetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })) as unknown;

  if (!isDeploymentResponse(created) || !created.id) {
    throw new Error("Vercel did not return a deployment id.");
  }

  const deploymentId = created.id;
  const initialUrl = created.url ? `https://${created.url}` : "";
  const inspectorUrl =
    created.inspectorUrl ||
    `https://vercel.com/deployments/${deploymentId}`;

  // Poll up to 5 minutes (150 * 2s)
  let state: "READY" | "BUILDING" | "ERROR" = readState(created);
  let liveUrl = initialUrl;

  for (let i = 0; i < 150 && state === "BUILDING"; i++) {
    await sleep(2000);
    try {
      const status = (await vercelFetch(
        `https://api.vercel.com/v13/deployments/${deploymentId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      )) as unknown;
      if (isDeploymentResponse(status)) {
        state = readState(status);
        if (status.url) liveUrl = `https://${status.url}`;
      }
    } catch {
      // transient — keep polling
    }
  }

  if (state === "ERROR") {
    throw new Error(
      `Vercel deployment ${deploymentId} failed. Inspect at ${inspectorUrl}`
    );
  }

  return {
    url: liveUrl,
    inspectorUrl,
    deploymentId,
    state,
    cost: 0,
  };
}
