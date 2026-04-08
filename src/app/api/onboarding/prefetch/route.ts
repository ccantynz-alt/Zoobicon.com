import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface PrefetchBody {
  businessName?: unknown;
}

interface InstantOnboardingModule {
  prefetch?: (input: { businessName: string }) => Promise<unknown> | unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: PrefetchBody;
  try {
    body = (await req.json()) as PrefetchBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body. Send { businessName: string }." },
      { status: 400 }
    );
  }

  const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "";
  if (!businessName) {
    return NextResponse.json(
      { ok: false, error: "businessName is required." },
      { status: 400 }
    );
  }

  try {
    const mod = (await import("@/lib/instant-onboarding")) as unknown as InstantOnboardingModule;
    if (typeof mod.prefetch === "function") {
      await mod.prefetch({ businessName });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
