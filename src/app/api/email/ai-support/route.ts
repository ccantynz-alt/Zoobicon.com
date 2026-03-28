import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { sql } from "@/lib/db";
import { sendViaMailgun } from "@/lib/mailgun";
import { notifyTicketEscalation } from "@/lib/admin-notify";

// ---------------------------------------------------------------------------
// POST /api/email/ai-support — AI-powered support response
// Called by the webhook when a new support ticket arrives,
// or manually from the support dashboard to regenerate a draft.
// ---------------------------------------------------------------------------

const AI_CONFIDENCE_AUTO_REPLY_THRESHOLD = 0.85;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getKnowledgeBase(): Promise<string> {
  try {
    const articles = await sql`
      SELECT title, category, content FROM knowledge_base
      WHERE is_active = true
      ORDER BY category, title
    `;
    if (articles.length === 0) return "";

    return articles
      .map(
        (a: Record<string, unknown>) =>
          `## ${a.title} [${a.category}]\n${a.content}`
      )
      .join("\n\n");
  } catch {
    return "";
  }
}

const SYSTEM_PROMPT = `You are Zoe, Zoobicon's AI support agent. You handle customer support emails for Zoobicon, an AI website builder platform.

GUIDELINES:
- Be warm, professional, and solution-focused
- Acknowledge the customer's issue before providing solutions
- Give specific, actionable steps when possible
- If you're confident in the solution, state it clearly
- If it requires engineering or is beyond your scope, say so honestly and set expectations
- Keep replies concise — 2-4 short paragraphs max
- Use the customer's name naturally
- Never make up features or information
- Sign off as "Zoe — Zoobicon Support"

ZOOBICON CONTEXT:
- AI website builder using Claude, GPT-4o, and Gemini
- Plans: Starter (Free), Pro ($49/mo), Enterprise (Custom)
- Features: Multi-page sites, e-commerce, full-stack apps, 32 generators, SEO tools
- Hosting at zoobicon.sh with custom domain support
- Support email: support@zoobicon.com
- Docs: zoobicon.com/docs
- Dashboard: zoobicon.com/dashboard

CONFIDENCE SCORING:
Assess your confidence (0.0 to 1.0) in fully resolving this issue:
- 0.9+ = FAQ/common question you can fully answer
- 0.7-0.9 = You can help but may need follow-up
- 0.5-0.7 = Partial answer, likely needs human review
- Below 0.5 = Needs human attention (billing disputes, outages, account issues)

RESPONSE FORMAT — Return valid JSON only:
{
  "reply": "your drafted reply text",
  "confidence": 0.85,
  "category": "billing|technical|feature-request|feedback|account|general",
  "priority": "low|medium|high|urgent",
  "suggestedActions": ["action1", "action2"]
}`;

export async function POST(req: NextRequest) {
  try {
    const { ticketId, ticketNumber, subject, body, customerName, customerEmail, autoSend } = await req.json();

    if (!ticketId || !subject || !body) {
      return NextResponse.json(
        { error: "ticketId, subject, and body are required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again later." },
        { status: 500 }
      );
    }

    // Fetch knowledge base articles for context
    const knowledgeBase = await getKnowledgeBase();

    const userMessage = `${knowledgeBase ? `KNOWLEDGE BASE:\n${knowledgeBase}\n\n---\n\n` : ""}Customer Name: ${customerName || "Customer"}
Subject: ${subject}
Message: ${body}

Draft a professional support reply using the knowledge base if relevant. Return JSON only.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse AI response
    let reply = text;
    let confidence = 0.5;
    let category = "general";
    let priority = "medium";
    let suggestedActions: string[] = [];

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        reply = parsed.reply || text;
        confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.5;
        category = parsed.category || "general";
        priority = parsed.priority || "medium";
        suggestedActions = Array.isArray(parsed.suggestedActions)
          ? parsed.suggestedActions
          : [];
      }
    } catch {
      // JSON parse failed, use raw text
    }

    // Update ticket with AI analysis
    await sql`
      UPDATE support_tickets
      SET ai_confidence = ${confidence},
          priority = ${priority},
          tags = ${JSON.stringify([category])},
          updated_at = NOW()
      WHERE id = ${ticketId}
    `;

    // Store AI draft as a message
    await sql`
      INSERT INTO support_messages (ticket_id, sender, body_text)
      VALUES (${ticketId}, 'ai-draft', ${reply})
    `;

    // Auto-reply if confidence is high enough AND autoSend is enabled
    const shouldAutoReply =
      (autoSend !== false) &&
      confidence >= AI_CONFIDENCE_AUTO_REPLY_THRESHOLD &&
      category !== "billing" &&
      priority !== "urgent";

    if (shouldAutoReply) {
      // Get ticket info for sending
      const tickets = await sql`
        SELECT from_email, subject, mailgun_message_id FROM support_tickets WHERE id = ${ticketId}
      `;

      if (tickets.length > 0) {
        const ticket = tickets[0];
        const domain = process.env.MAILGUN_DOMAIN || "zoobicon.com";
        const sendResult = await sendViaMailgun({
          from: `Zoobicon Support <support@${domain}>`,
          to: ticket.from_email as string,
          subject: `Re: ${ticket.subject}`,
          text: reply,
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${reply.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #6b7280; font-size: 13px;">This reply was sent by Zoe, Zoobicon's AI support assistant. A human agent may follow up if needed.</p>
  <p style="color: #9ca3af; font-size: 11px;"><a href="https://zoobicon.com/unsubscribe?email=${encodeURIComponent(ticket.from_email as string)}" style="color: #9ca3af;">Unsubscribe</a></p>
</div>`,
          inReplyTo: ticket.mailgun_message_id as string,
          tags: ["support", "ai-auto-reply"],
          tracking: true,
          trackingOpens: true,
          trackingClicks: "htmlonly",
          unsubscribeUrl: `https://zoobicon.com/unsubscribe?email=${encodeURIComponent(ticket.from_email as string)}`,
        });

        if (sendResult.success) {
          // Record outbound email
          await sql`
            INSERT INTO email_outbound (from_address, to_address, subject, body_text, mailgun_id, ticket_id)
            VALUES (${"support@" + (process.env.MAILGUN_DOMAIN || "zoobicon.com")}, ${ticket.from_email}, ${"Re: " + ticket.subject}, ${reply}, ${sendResult.messageId || ""}, ${ticketId})
          `;

          // Mark ticket
          await sql`
            UPDATE support_tickets
            SET ai_auto_replied = true, status = 'pending', updated_at = NOW()
            WHERE id = ${ticketId}
          `;

          // Store as sent message
          await sql`
            INSERT INTO support_messages (ticket_id, sender, body_text)
            VALUES (${ticketId}, 'ai', ${reply})
          `;
        }
      }
    }

    // ── Escalation: notify owner when AI can't fully handle the ticket ──
    const needsEscalation =
      priority === "urgent" ||
      priority === "high" ||
      category === "billing" ||
      confidence < 0.7;

    if (needsEscalation) {
      let reason = "";
      if (priority === "urgent") {
        reason = "Ticket marked as URGENT by AI — requires immediate human attention.";
      } else if (priority === "high") {
        reason = "High priority ticket — AI handled initial response but human review recommended.";
      } else if (category === "billing") {
        reason = "Billing issue detected — AI does not auto-reply to billing tickets. Human review required.";
      } else if (confidence < 0.5) {
        reason = `Low AI confidence (${Math.round(confidence * 100)}%) — AI could not determine a reliable answer. Human response needed.`;
      } else {
        reason = `Moderate AI confidence (${Math.round(confidence * 100)}%) — AI drafted a response but it may need human review before sending.`;
      }

      // Look up ticket number if not passed
      let effectiveTicketNumber = ticketNumber || "";
      let effectiveFrom = customerEmail || "";
      if (!effectiveTicketNumber || !effectiveFrom) {
        try {
          const tkRows = await sql`
            SELECT ticket_number, from_email, from_name FROM support_tickets WHERE id = ${ticketId} LIMIT 1
          `;
          if (tkRows.length > 0) {
            effectiveTicketNumber = effectiveTicketNumber || (tkRows[0].ticket_number as string);
            effectiveFrom = effectiveFrom || (tkRows[0].from_email as string);
          }
        } catch { /* use what we have */ }
      }

      notifyTicketEscalation({
        ticketNumber: effectiveTicketNumber || ticketId,
        ticketId,
        subject,
        from: effectiveFrom,
        fromName: customerName,
        reason,
        priority,
        category,
        confidence,
        aiDraft: reply,
      }).catch((err) =>
        console.error("[AI Support] Escalation notification failed:", err)
      );

      // Mark ticket as needing human attention
      await sql`
        UPDATE support_tickets
        SET assignee = 'unassigned',
            status = CASE WHEN ${priority} = 'urgent' THEN 'urgent' ELSE 'open' END,
            updated_at = NOW()
        WHERE id = ${ticketId}
      `;
    }

    return NextResponse.json({
      reply,
      confidence,
      category,
      priority,
      suggestedActions,
      autoReplied: shouldAutoReply,
      escalated: needsEscalation,
    });
  } catch (err) {
    console.error("[AI Support] Error:", err);
    const message = err instanceof Error ? err.message : "AI support failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
