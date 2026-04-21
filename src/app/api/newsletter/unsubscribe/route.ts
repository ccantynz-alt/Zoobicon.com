import { NextRequest, NextResponse } from "next/server";
import { confirmSubscription, unsubscribe } from "@/lib/newsletter-engine";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const email = url.searchParams.get("email");
    const listId = url.searchParams.get("listId") ?? undefined;

    if (token) {
      const ok = await confirmSubscription(token);
      const msg = ok
        ? "Subscription confirmed. Welcome aboard."
        : "Invalid or expired confirmation token.";
      return new NextResponse(msg, {
        status: ok ? 200 : 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (email) {
      const count = await unsubscribe(email, listId);
      const msg =
        count > 0
          ? `Unsubscribed ${email}. You will not receive further emails.`
          : `No active subscription found for ${email}.`;
      return new NextResponse(msg, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new NextResponse("Missing token or email parameter.", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
