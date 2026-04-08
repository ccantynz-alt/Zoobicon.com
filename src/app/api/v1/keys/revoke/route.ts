import { NextRequest, NextResponse } from "next/server";
import { revokeApiKey } from "@/lib/api-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RevokeBody {
  keyId?: string;
  customerId?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!req.headers.get("x-admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: RevokeBody;
  try {
    body = (await req.json()) as RevokeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const keyId = body.keyId?.trim();
  const customerId = body.customerId?.trim();
  if (!keyId || !customerId) {
    return NextResponse.json(
      { error: "keyId and customerId are required" },
      { status: 400 }
    );
  }

  try {
    const ok = await revokeApiKey(keyId, customerId);
    if (!ok) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to revoke key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
