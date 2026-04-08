/**
 * fal.ai gateway client (raw fetch, no SDK).
 *
 * Supported model name patterns:
 *   - fal-ai/veo3
 *   - fal-ai/kling-v2.5-turbo/text-to-video
 *   - fal-ai/sora-2
 *   - fal-ai/elevenlabs/tts/multilingual-v2
 *   - fal-ai/hedra/character-3
 *   - fal-ai/bytedance/omnihuman
 *   - fal-ai/musicgen
 *   - fal-ai/whisper
 */

export const RUNTIME_HINT = "nodejs";

const FAL_BASE = "https://queue.fal.run";

export class FalError extends Error {
  status: number;
  model: string;
  cause?: unknown;
  constructor(message: string, opts: { status: number; model: string; cause?: unknown }) {
    super(message);
    this.name = "FalError";
    this.status = opts.status;
    this.model = opts.model;
    this.cause = opts.cause;
  }
}

interface QueueSubmitResponse {
  request_id: string;
  status_url: string;
  response_url: string;
}

interface QueueStatusResponse {
  status: string;
  queue_position?: number;
  logs?: unknown;
}

function getKey(model: string): string {
  const key = process.env.FAL_KEY;
  if (!key) {
    throw new FalError("FAL_KEY environment variable is not set", {
      status: 503,
      model,
    });
  }
  return key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export interface RunFalOptions<TInput> {
  model: string;
  input: TInput;
  pollMs?: number;
  maxWaitMs?: number;
}

export async function runFal<TResult, TInput = unknown>(
  opts: RunFalOptions<TInput>,
): Promise<TResult> {
  const { model, input } = opts;
  const pollMs = opts.pollMs ?? 1500;
  const maxWaitMs = opts.maxWaitMs ?? 180_000;
  const key = getKey(model);

  const submitRes = await fetch(`${FAL_BASE}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const submitBody = await parseJson(submitRes);
  if (!submitRes.ok) {
    throw new FalError(`fal submit failed (${submitRes.status})`, {
      status: submitRes.status,
      model,
      cause: submitBody,
    });
  }

  if (!isRecord(submitBody)) {
    throw new FalError("fal submit returned invalid payload", {
      status: 502,
      model,
      cause: submitBody,
    });
  }

  const statusUrl = asString(submitBody.status_url);
  const responseUrl = asString(submitBody.response_url);
  if (!statusUrl || !responseUrl) {
    throw new FalError("fal submit missing status_url or response_url", {
      status: 502,
      model,
      cause: submitBody,
    });
  }

  const started = Date.now();
  while (true) {
    if (Date.now() - started > maxWaitMs) {
      throw new FalError(`fal poll timed out after ${maxWaitMs}ms`, {
        status: 504,
        model,
      });
    }

    const statusRes = await fetch(statusUrl, {
      headers: { Authorization: `Key ${key}` },
    });
    const statusBody = await parseJson(statusRes);

    if (!statusRes.ok) {
      throw new FalError(`fal status failed (${statusRes.status})`, {
        status: statusRes.status,
        model,
        cause: statusBody,
      });
    }

    if (isRecord(statusBody)) {
      const status = asString((statusBody as QueueStatusResponse).status);
      if (status === "COMPLETED") break;
      if (status === "FAILED" || status === "CANCELLED" || status === "ERROR") {
        throw new FalError(`fal job ${status}`, {
          status: 500,
          model,
          cause: statusBody,
        });
      }
    }

    await new Promise((r) => setTimeout(r, pollMs));
  }

  const resultRes = await fetch(responseUrl, {
    headers: { Authorization: `Key ${key}` },
  });
  const resultBody = await parseJson(resultRes);
  if (!resultRes.ok) {
    throw new FalError(`fal result fetch failed (${resultRes.status})`, {
      status: resultRes.status,
      model,
      cause: resultBody,
    });
  }

  return resultBody as TResult;
}

export interface RunFalWithFallbackOptions<TInput> {
  models: string[];
  input: TInput;
  pollMs?: number;
  maxWaitMs?: number;
}

export async function runFalWithFallback<TResult, TInput = unknown>(
  opts: RunFalWithFallbackOptions<TInput>,
): Promise<TResult> {
  const errors: FalError[] = [];
  for (const model of opts.models) {
    try {
      return await runFal<TResult, TInput>({
        model,
        input: opts.input,
        pollMs: opts.pollMs,
        maxWaitMs: opts.maxWaitMs,
      });
    } catch (err) {
      const falErr =
        err instanceof FalError
          ? err
          : new FalError(
              err instanceof Error ? err.message : "unknown fal error",
              { status: 500, model, cause: err },
            );
      errors.push(falErr);
      continue;
    }
  }
  const aggregate = new FalError(
    `all fal models failed: ${errors.map((e) => `${e.model}(${e.status})`).join(", ")}`,
    {
      status: errors[errors.length - 1]?.status ?? 500,
      model: opts.models.join(","),
      cause: errors,
    },
  );
  throw aggregate;
}

// Used to satisfy QueueSubmitResponse import shape if needed externally.
export type { QueueSubmitResponse, QueueStatusResponse };
