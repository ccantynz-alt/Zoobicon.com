import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/lib/zoobicon-mail";

// ---------------------------------------------------------------------------
// GET /api/mail/track/open?cid=...&e=... — Open tracking pixel
// GET /api/mail/track/click?cid=...&e=...&url=... — Click tracking redirect
// ---------------------------------------------------------------------------

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid");
  const email = req.nextUrl.searchParams.get("e");
  const type = req.nextUrl.searchParams.get("type") || "open";
  const url = req.nextUrl.searchParams.get("url");

  if (cid && email) {
    // Non-blocking tracking
    trackEvent(cid, decodeURIComponent(email), type as "open" | "click").catch(() => {});
  }

  // Click tracking: redirect to destination URL
  if (type === "click" && url) {
    return NextResponse.redirect(decodeURIComponent(url));
  }

  // Open tracking: return transparent pixel
  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
