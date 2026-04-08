import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface InstantBody {
  businessName?: unknown;
  hint?: unknown;
}

interface InstantOnboardingModule {
  instantOnboard: (input: { businessName: string; hint?: string }) => Promise<unknown>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: InstantBody;
  try {
    body = (await req.json()) as InstantBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Send { businessName: string, hint?: string }." },
      { status: 400 }
    );
  }

  const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "";
  const hint = typeof body.hint === "string" ? body.hint : undefined;

  if (!businessName) {
    return NextResponse.json(
      { error: "businessName is required. Tell us what your business is called." },
      { status: 400 }
    );
  }

  try {
    const mod = (await import("@/lib/instant-onboarding")) as unknown as InstantOnboardingModule;
    if (typeof mod.instantOnboard !== "function") {
      return NextResponse.json(
        {
          error:
            "Instant onboarding engine not available. Missing export 'instantOnboard' in @/lib/instant-onboarding.",
        },
        { status: 503 }
      );
    }
    const payload = await mod.instantOnboard({ businessName, hint });
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: `Instant onboarding failed: ${message}. Check ANTHROPIC_API_KEY and OPENSRS_API_KEY in Vercel env vars.`,
      },
      { status: 500 }
    );
  }
}
