import { NextRequest, NextResponse } from "next/server";
import { getCommandCenterSnapshot } from "@/lib/command-center";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-admin")) return true;
  const cookie = req.cookies.get("admin")?.value;
  return cookie === "1";
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message:
          "Admin access required. Send header 'x-admin: 1' or set cookie 'admin=1'.",
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const snapshot = await getCommandCenterSnapshot();
    return NextResponse.json(snapshot, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "snapshot_failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
