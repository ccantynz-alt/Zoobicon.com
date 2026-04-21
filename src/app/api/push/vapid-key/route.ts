import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json(
      { error: "VAPID_PUBLIC_KEY missing" },
      { status: 503 },
    );
  }
  return NextResponse.json({ publicKey });
}
