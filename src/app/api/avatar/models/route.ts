import { NextResponse } from "next/server";
import { AVATAR_MODEL_CHAIN } from "@/lib/avatar-talking";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    count: AVATAR_MODEL_CHAIN.length,
    models: AVATAR_MODEL_CHAIN,
  });
}
