import { NextRequest, NextResponse } from "next/server";
import { unsubscribe, unsubscribeAll } from "@/lib/zoobicon-mail";

// ---------------------------------------------------------------------------
// GET /api/mail/unsubscribe?email=...&list=... — One-click unsubscribe (CAN-SPAM)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const listId = req.nextUrl.searchParams.get("list");

  if (!email) {
    return new Response(unsubscribePage("Error", "No email address provided."), {
      headers: { "Content-Type": "text/html" },
    });
  }

  if (listId) {
    await unsubscribe(email, listId);
  } else {
    await unsubscribeAll(email);
  }

  return new Response(
    unsubscribePage(
      "Unsubscribed",
      `<strong>${email}</strong> has been unsubscribed. You will no longer receive emails from this list.`
    ),
    { headers: { "Content-Type": "text/html" } }
  );
}

function unsubscribePage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Zoobicon Mail</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a12; color: #e5e5e5;
    display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .card { max-width: 440px; text-align: center; padding: 48px 32px; background: #0f2148;
    border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); }
  h1 { font-size: 24px; margin: 0 0 16px; }
  p { color: #999; line-height: 1.6; margin: 0; }
  strong { color: #fff; }
  a { color: #2563eb; text-decoration: none; }
</style></head><body>
<div class="card">
  <h1>${title}</h1>
  <p>${message}</p>
  <p style="margin-top:24px"><a href="https://zoobicon.com">← Back to Zoobicon</a></p>
</div></body></html>`;
}
