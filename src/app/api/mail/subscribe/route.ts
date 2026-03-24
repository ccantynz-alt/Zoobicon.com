import { NextRequest, NextResponse } from "next/server";
import { addSubscriber, triggerAutomation } from "@/lib/zoobicon-mail";

// ---------------------------------------------------------------------------
// POST /api/mail/subscribe — Public endpoint for signup forms
//
// Accepts form POST (from embedded forms) or JSON.
// Auto-triggers "subscriber_added" automations (welcome series, etc.)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    let email: string;
    let name: string;
    let listId: string;
    let source: "form" | "api" = "form";
    let tags: string[] = [];

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      email = (formData.get("email") as string) || "";
      name = (formData.get("name") as string) || "";
      listId = (formData.get("list") as string) || (formData.get("listId") as string) || "default";
      const formTags = formData.get("tags") as string;
      if (formTags) tags = formTags.split(",").map((t) => t.trim());
    } else {
      const body = await req.json();
      email = body.email || "";
      name = body.name || "";
      listId = body.listId || body.list || "default";
      source = body.source || "api";
      tags = body.tags || [];
    }

    if (!email || !email.includes("@")) {
      // For form submissions, redirect back with error
      if (contentType.includes("form")) {
        return NextResponse.redirect(new URL("/?subscribed=error", req.url));
      }
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const subscriber = await addSubscriber(listId, email, name, source, tags);

    // Trigger welcome automations
    triggerAutomation("subscriber_added", email, listId).catch(() => {});

    // For form submissions, redirect to success page
    if (contentType.includes("form")) {
      return NextResponse.redirect(new URL("/?subscribed=success", req.url));
    }

    return NextResponse.json({
      success: true,
      subscriber: subscriber ? { email: subscriber.email, name: subscriber.name } : null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Subscribe failed" },
      { status: 500 }
    );
  }
}
