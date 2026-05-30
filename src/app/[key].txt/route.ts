/**
 * /[key].txt — IndexNow ownership verification file.
 *
 * IndexNow's spec: to authenticate URL submissions for a host, you
 * host a text file at /[your-key].txt whose body is exactly the key.
 * Bing/Yandex/relay GET this URL before honouring submissions.
 *
 * We treat any URL ending in .txt as a potential IndexNow probe and
 * return the configured INDEXNOW_KEY if it matches. Mismatches return
 * 404 so we don't leak the key shape.
 *
 * If INDEXNOW_KEY isn't set the route 404s for everything — same
 * graceful-disabled pattern as the rest of the SEO surface.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  // Next.js's [key].txt directory pattern strips the literal ".txt"
  // suffix, so params.key here is the bare key from the URL.
  const { key: probedKey } = await params;
  const configured = process.env.INDEXNOW_KEY;
  if (!configured) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (probedKey !== configured) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(configured, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
