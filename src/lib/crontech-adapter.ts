/**
 * Crontech Adapter
 * =====================================================================
 *
 * WHAT THIS IS
 * ------------
 * Provider adapter for Crontech — Craig's combined backend+frontend
 * serverless platform. Zoobicon-generated apps can deploy to Crontech
 * instead of (or in addition to) Vercel for faster cold starts and
 * unified backend/frontend provisioning in one deploy.
 *
 * THE INTEGRATION CONTRACT
 * ------------------------
 * When a user clicks "Deploy" in the builder, the pipeline asks:
 *   "Which provider?" → vercel | crontech | zoobicon.sh
 * Crontech gets selected when:
 *   - User picks it explicitly, OR
 *   - The generated app uses a feature Crontech is faster at
 *     (edge functions, scheduled jobs, combined frontend+API deploys)
 *
 * STATUS
 * ------
 * STUB. Waiting on Craig's Crontech admin credentials + API docs.
 * Once CRONTECH_API_URL + CRONTECH_API_KEY are set in Vercel, the
 * deploy() function below will POST the build output and return a
 * live URL. Until then, isCrontechEnabled() returns false and the
 * deploy UI hides the Crontech option.
 *
 * WHY CRAIG SAID THIS MATTERS
 * ---------------------------
 * Direct quote: "it's my combined back end and front end serverless
 * platform" — one deploy, backend + frontend, no CDN/edge split. If
 * the speed claim holds, this is our unique moat over Vercel and
 * Lovable Cloud.
 */

export interface CrontechDeployResult {
  url: string;
  deployId: string;
  logs: string[];
  durationMs: number;
}

export interface CrontechDeployInput {
  projectId: string;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  envVars?: Record<string, string>;
  region?: string;
}

export function isCrontechEnabled(): boolean {
  return Boolean(process.env.CRONTECH_API_URL && process.env.CRONTECH_API_KEY);
}

/**
 * Deploy a generated app to Crontech.
 * Real implementation wire-up waits on Craig's API docs.
 */
export async function deployToCrontech(
  input: CrontechDeployInput,
): Promise<CrontechDeployResult> {
  if (!isCrontechEnabled()) {
    throw new Error(
      "Crontech not configured. Set CRONTECH_API_URL and CRONTECH_API_KEY in environment.",
    );
  }

  const start = Date.now();
  const res = await fetch(`${process.env.CRONTECH_API_URL}/v1/deploys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CRONTECH_API_KEY}`,
    },
    body: JSON.stringify({
      projectId: input.projectId,
      files: input.files,
      dependencies: input.dependencies,
      env: input.envVars ?? {},
      region: input.region ?? "auto",
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Crontech deploy failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    url: string;
    deploy_id: string;
    logs?: string[];
  };

  return {
    url: data.url,
    deployId: data.deploy_id,
    logs: data.logs ?? [],
    durationMs: Date.now() - start,
  };
}

/**
 * List available providers for the deploy UI.
 */
export function listDeployProviders(): Array<{
  id: "zoobicon-sh" | "vercel" | "crontech";
  label: string;
  enabled: boolean;
  description: string;
}> {
  return [
    {
      id: "zoobicon-sh",
      label: "Zoobicon Cloud",
      enabled: true,
      description: "Instant preview at [slug].zoobicon.sh — fastest, no config",
    },
    {
      id: "vercel",
      label: "Vercel",
      enabled: Boolean(process.env.VERCEL_API_TOKEN),
      description: "Production hosting with your own domain",
    },
    {
      id: "crontech",
      label: "Crontech",
      enabled: isCrontechEnabled(),
      description: "Combined backend+frontend serverless — fastest cold starts",
    },
  ];
}
