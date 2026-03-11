import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_SEQUENCE_TYPES = [
  "welcome",
  "onboarding",
  "nurture",
  "sales",
  "re-engagement",
  "abandoned-cart",
  "post-purchase",
  "event-promotion",
  "product-launch",
  "educational",
];

const EMAIL_SEQUENCE_SYSTEM = `You are Zoobicon's Email Sequence Generator. You create complete multi-email marketing automation sequences with professional HTML email templates and send timing strategy.

## Output Format
- Output ONLY valid JSON:
{
  "sequenceName": "Name of the sequence",
  "sequenceType": "Type",
  "totalEmails": 5,
  "estimatedDuration": "14 days",
  "strategy": "Brief description of the sequence strategy and goals",
  "emails": [
    {
      "position": 1,
      "name": "Welcome Email",
      "subject": "Subject line",
      "preheader": "Preview text that appears in inbox",
      "sendDelay": "Immediately after signup",
      "sendTime": "Within 5 minutes",
      "goal": "What this email aims to achieve",
      "html": "Complete HTML email template",
      "plainText": "Plain text version"
    }
  ],
  "segmentationRules": [
    "If user clicks CTA in email 2, skip email 3",
    "If user doesn't open email 1, resend with different subject"
  ],
  "kpiBenchmarks": {
    "expectedOpenRate": "25-35%",
    "expectedClickRate": "3-5%",
    "expectedConversionRate": "1-2%"
  }
}

## Email Template Standards
- Table-based HTML layout (email client compatible).
- Max width 600px, centered.
- Inline CSS on all elements.
- Web-safe font stacks (Arial, Helvetica, Georgia).
- Bulletproof buttons (VML fallback or padding-based).
- MSO conditional comments for Outlook.
- Preheader text (hidden preview).
- Media queries for mobile responsiveness.
- Unsubscribe link in footer.
- Company address in footer (CAN-SPAM compliance).
- Alt text on all images.
- Use picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for placeholder images (unique descriptive keyword per image).

## Sequence Design Principles
- Each email builds on the previous one (progressive engagement).
- Vary email length: short → medium → detailed → short.
- Every email has ONE primary CTA (not multiple competing CTAs).
- Subject lines: mix curiosity, benefit, urgency, and personalization.
- Send timing based on behavioral research (Tue-Thu 10am or 2pm optimal).
- Include re-engagement forks for non-openers.
- A/B test suggestions for key emails.

## Email Types by Sequence
- **Welcome**: Warm intro → Brand story → Value delivery → Social proof → CTA to engage.
- **Onboarding**: Welcome → First action → Second action → Advanced feature → Success check-in.
- **Nurture**: Value content → Case study → Pain point → Solution → Soft sell → Hard CTA.
- **Sales**: Problem awareness → Solution intro → Features → Testimonials → Offer → Urgency → Last chance.
- **Re-engagement**: "We miss you" → Incentive → What's new → Last chance before removal.
- **Abandoned Cart**: Reminder → Social proof → Urgency → Incentive → Final notice.`;

export async function POST(req: NextRequest) {
  try {
    const { businessName, sequenceType, productOrService, targetAudience, emailCount } = await req.json();

    if (!businessName || typeof businessName !== "string") {
      return NextResponse.json({ error: "businessName is required" }, { status: 400 });
    }

    const type = VALID_SEQUENCE_TYPES.includes(sequenceType) ? sequenceType : "welcome";
    const count = typeof emailCount === "number" && emailCount >= 3 && emailCount <= 10 ? emailCount : 5;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: EMAIL_SEQUENCE_SYSTEM,
      messages: [{
        role: "user",
        content: `Create a ${count}-email ${type} sequence for "${businessName}".\n\nProduct/Service: ${productOrService || "Infer from business name"}\nTarget Audience: ${targetAudience || "Infer from business type"}\n\nEach email must have a complete HTML template (table-based, email-client compatible), plain text version, strategic subject line, preheader text, send timing, and clear goal. Include segmentation rules and KPI benchmarks.`,
      }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response generated" }, { status: 500 });
    }

    let responseText = textBlock.text.trim();
    if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      return NextResponse.json(JSON.parse(responseText));
    } catch {
      return NextResponse.json({ rawResponse: responseText, note: "Sequence generated but JSON parsing failed. Content is valid." });
    }
  } catch (err) {
    console.error("Email sequence generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
