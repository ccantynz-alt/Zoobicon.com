import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnthropicCheck {
  status: "ok" | "error" | "skipped";
  latencyMs: number;
  response: string;
  hint?: string;
}

interface RegistryCheck {
  available: boolean;
  componentCount: number;
  hint?: string;
}

interface BuilderHealthBody {
  ok: boolean;
  anthropic: AnthropicCheck;
  registry: RegistryCheck;
  hint?: string;
}

interface ClaudeContentBlock {
  type: string;
  text?: string;
}
interface ClaudeResponseShape {
  content?: ClaudeContentBlock[];
}

async function checkAnthropic(): Promise<AnthropicCheck> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      status: "skipped",
      latencyMs: 0,
      response: "",
      hint: "ANTHROPIC_API_KEY missing — set in Vercel env vars",
    };
  }
  const start = Date.now();
  try {
    const mod: typeof import("@/lib/anthropic-cached") = await import(
      "@/lib/anthropic-cached"
    );
    const res = (await mod.callClaude({
      model: "claude-haiku-4-5-20251001",
      maxTokens: 50,
      temperature: 0,
      messages: [{ role: "user", content: "Reply with just OK" }],
    })) as ClaudeResponseShape;
    const text = (res.content ?? [])
      .map((b) => b.text ?? "")
      .join("")
      .trim();
    return {
      status: "ok",
      latencyMs: Date.now() - start,
      response: text.slice(0, 200),
    };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      response: "",
      hint:
        err instanceof Error
          ? err.message
          : "anthropic call failed — check API key + model id",
    };
  }
}

interface RegistryModuleShape {
  REGISTRY?: unknown[];
  default?: unknown;
}

async function checkRegistry(): Promise<RegistryCheck> {
  try {
    const mod: RegistryModuleShape = await import("@/lib/component-registry");
    const reg = Array.isArray(mod.REGISTRY) ? mod.REGISTRY : [];
    return {
      available: true,
      componentCount: reg.length,
      hint:
        reg.length === 0
          ? "registry imported but empty — components may not be auto-registered"
          : undefined,
    };
  } catch (err) {
    return {
      available: false,
      componentCount: 0,
      hint:
        err instanceof Error
          ? `registry import failed: ${err.message}`
          : "registry import failed",
    };
  }
}

export async function GET(): Promise<NextResponse<BuilderHealthBody>> {
  try {
    const [anthropic, registry] = await Promise.all([
      checkAnthropic(),
      checkRegistry(),
    ]);
    const ok =
      anthropic.status === "ok" &&
      registry.available &&
      registry.componentCount > 0;
    return NextResponse.json<BuilderHealthBody>(
      {
        ok,
        anthropic,
        registry,
        hint: ok
          ? undefined
          : "builder health degraded — see anthropic.hint or registry.hint",
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json<BuilderHealthBody>(
      {
        ok: false,
        anthropic: {
          status: "error",
          latencyMs: 0,
          response: "",
          hint: "outer health check threw",
        },
        registry: {
          available: false,
          componentCount: 0,
          hint: "outer health check threw",
        },
        hint: err instanceof Error ? err.message : String(err),
      },
      { status: 200 },
    );
  }
}
