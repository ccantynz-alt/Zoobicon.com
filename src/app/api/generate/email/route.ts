import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_SYSTEM = `You are Zoobicon, an AI email template generator. When given a description, produce email-compatible HTML and a plain text version.

## Output Format
Return a JSON object with exactly three fields:
{
  "subject": "The email subject line",
  "html": "The complete HTML email",
  "plainText": "The plain text version of the email"
}

Output ONLY valid JSON. No markdown, no explanation, no code fences.

## HTML Email Rules

**Layout:**
- Use table-based layout for maximum email client compatibility.
- All content within a centered wrapper table with max-width 600px.
- Use role="presentation" on layout tables.
- Nest tables for structure: outer wrapper > inner content tables.
- Set cellpadding="0" cellspacing="0" border="0" on all tables.

**Styling:**
- Use INLINE styles only on every element. Email clients strip <style> blocks unpredictably.
- Exception: Include a <style> block with media queries for responsive behavior (Gmail supports this). Use !important in media queries.
- Use web-safe font stacks: Arial, Helvetica, sans-serif or Georgia, Times New Roman, serif as fallbacks.
- You may specify a preferred web font first (e.g., 'Helvetica Neue', Arial, sans-serif).
- Background colors via bgcolor attribute AND inline style for maximum compatibility.

**Structure:**
- Complete HTML document with DOCTYPE (use XHTML 1.0 Transitional for email).
- Include xmlns attributes on <html> tag.
- Add meta tags for charset (UTF-8) and viewport.
- Include MSO conditional comments for Outlook compatibility where needed.
- Include preheader text (hidden preview text) at the top of the body using a span with display:none, max-height:0, overflow:hidden, mso-hide:all styling.

**Images:**
- Always include alt text on images.
- Always specify width and height attributes.
- Use absolute URLs for image sources (use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for placeholders, with a unique descriptive keyword per image).
- Add display:block and border:0 to images.

**Buttons/CTAs:**
- Use bulletproof buttons: table-based with VML fallback for Outlook, or padding-based links inside table cells.
- Ensure buttons have adequate padding and clear hover states via the <style> block.

**Type-specific rules:**
- For "marketing" type: include an unsubscribe link in the footer (e.g., <a href="{{unsubscribe_url}}">Unsubscribe</a>), include company address, and social media links.
- For "transactional" type: focus on clarity and action items. Include transaction details prominently.
- For "notification" type: concise format, clear notification message, and a single primary CTA.

**Responsive:**
- Add media queries in a <style> block for screens under 600px.
- Stack columns vertically on mobile using display:block !important and width:100% !important.
- Increase font sizes slightly on mobile for readability.
- Make buttons full-width on mobile.

**Compatibility targets:**
- Gmail (web and mobile)
- Apple Mail
- Outlook (2016+)
- Yahoo Mail
- Samsung Mail

## Plain Text Version
- Include all the same content as the HTML version.
- Use clear formatting: headers in CAPS, separators with dashes, indentation for structure.
- Include all links as full URLs.
- Keep line length under 78 characters where possible.

## Content Quality
- Write compelling, professional copy appropriate to the email type.
- Use a clear visual hierarchy with headings, subheadings, and body text.
- Include a clear primary call-to-action.
- For subject lines: keep under 50 characters, be specific and compelling.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, type } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        { error: "Prompt too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    const validTypes = ["transactional", "marketing", "notification"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        {
          error:
            'Invalid type. Must be one of: "transactional", "marketing", "notification"',
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const userMessage = `Generate a ${type} email template for the following:\n\n${prompt}\n\nThe email type is "${type}"${type === "marketing" ? " — include an unsubscribe link and company address in the footer" : ""}. Return the result as a JSON object with "subject", "html", and "plainText" fields.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: EMAIL_SYSTEM,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response generated" },
        { status: 500 }
      );
    }

    let raw = textBlock.text.trim();

    // Strip markdown code fences if present
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let result: { html: string; plainText: string; subject: string };

    try {
      result = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse generated email template" },
        { status: 500 }
      );
    }

    if (!result.html || !result.plainText || !result.subject) {
      return NextResponse.json(
        { error: "Incomplete email template generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      html: result.html,
      plainText: result.plainText,
      subject: result.subject,
    });
  } catch (err) {
    console.error("Email generation error:", err);

    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error: ${err.message}` },
        { status: err.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
