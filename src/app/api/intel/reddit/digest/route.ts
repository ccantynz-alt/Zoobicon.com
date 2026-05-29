import { NextResponse } from "next/server";
import { ensureRedditTables, getLatestRedditDigest } from "@/lib/reddit-flywheel";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureRedditTables();
    const digest = await getLatestRedditDigest();
    return NextResponse.json({ digest });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
