import { NextResponse } from "next/server";
import { deleteSecret, VaultUnavailableError } from "@/lib/password-vault";

export const runtime = "nodejs";

interface Body {
  userId?: unknown;
  secretId?: unknown;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Body;
    const { userId, secretId } = body;
    if (typeof userId !== "string" || typeof secretId !== "string") {
      return NextResponse.json(
        { error: "userId and secretId required" },
        { status: 400 },
      );
    }
    const ok = await deleteSecret(userId, secretId);
    if (!ok) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    if (err instanceof VaultUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
