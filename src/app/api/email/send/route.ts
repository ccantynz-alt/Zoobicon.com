import { NextRequest, NextResponse } from "next/server";
import { sendViaMailgun } from "@/lib/mailgun";
import { analyzeEmailContent } from "@/lib/email-service";

// ---------------------------------------------------------------------------
// POST /api/email/send — Send transactional or marketing email
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, to, subject, html, text, replyTo, tags, analyze } = body as {
      from?: string;
      to?: string | string[];
      subject?: string;
      html?: string;
      text?: string;
      replyTo?: string;
      tags?: string[];
      analyze?: boolean;
    };

    // --- Validation ---
    if (!from || typeof from !== "string") {
      return NextResponse.json(
        { error: "from address is required." },
        { status: 400 }
      );
    }

    if (!to) {
      return NextResponse.json(
        { error: "to address is required." },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { error: "subject is required." },
        { status: 400 }
      );
    }

    if (!html && !text) {
      return NextResponse.json(
        { error: "Either html or text body is required." },
        { status: 400 }
      );
    }

    // Email format validation — supports both "user@domain" and "Name <user@domain>"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const namedEmailRegex = /^.+<([^\s@]+@[^\s@]+\.[^\s@]+)>$/;

    function extractEmail(addr: string): string | null {
      const trimmed = addr.trim();
      if (emailRegex.test(trimmed)) return trimmed;
      const match = trimmed.match(namedEmailRegex);
      if (match) return match[1];
      return null;
    }

    if (!extractEmail(from)) {
      return NextResponse.json(
        { error: "Invalid from email address." },
        { status: 400 }
      );
    }

    const toAddresses = Array.isArray(to) ? to : [to];
    for (const addr of toAddresses) {
      if (!extractEmail(addr)) {
        return NextResponse.json(
          { error: `Invalid to email address: ${addr}` },
          { status: 400 }
        );
      }
    }

    // Rate limit: max 50 recipients per request
    if (toAddresses.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 recipients per request." },
        { status: 400 }
      );
    }

    // Optional: analyze content before sending
    let analysis = undefined;
    if (analyze && html) {
      analysis = analyzeEmailContent(html);
      if (analysis.spamScore > 70) {
        return NextResponse.json(
          {
            error: "Email content has a high spam score. Please review the issues.",
            analysis,
          },
          { status: 422 }
        );
      }
    }

    const result = await sendViaMailgun({
      from,
      to: toAddresses,
      subject,
      html,
      text,
      replyTo,
      tags,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipients: toAddresses.length,
      ...(analysis ? { analysis } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
