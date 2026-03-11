import { NextResponse } from "next/server";
import { AVAILABLE_MODELS, getAvailableProviders } from "@/lib/llm-provider";

/**
 * GET /api/models — returns available AI models based on configured API keys
 */
export async function GET() {
  const providers = getAvailableProviders();
  const models = AVAILABLE_MODELS.filter((m) => providers.includes(m.provider));

  return NextResponse.json({
    providers,
    models,
    default: "claude-sonnet-4-6",
  });
}
