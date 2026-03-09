import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const CHROME_EXT_SYSTEM = `You are Zoobicon's Chrome Extension Generator. You generate complete Chrome extension projects with popup UI, content scripts, and background workers.

## Output Format
- Output ONLY valid JSON:
{
  "manifest": "Complete manifest.json content (Manifest V3)",
  "popup": {
    "html": "popup.html content",
    "css": "popup.css content",
    "js": "popup.js content"
  },
  "background": "background.js service worker content",
  "contentScript": "content.js content script (if needed)",
  "options": {
    "html": "options.html content (if needed)",
    "js": "options.js content (if needed)"
  },
  "icons": "SVG icon placeholder data",
  "readme": "Setup and installation instructions"
}

## Manifest V3 Standards
- Use Manifest V3 format (required for Chrome Web Store).
- Proper permissions (only request what's needed).
- Service worker for background (not background pages).
- Content scripts with proper host permissions.
- Action (not browser_action or page_action).

## Popup UI
- Clean, compact design (400px wide max, appropriate height).
- Styled with modern CSS (consistent with Chrome's design language).
- Inter or system font stack.
- Responsive within popup constraints.
- Loading states for async operations.
- Dark mode support matching system preference.

## Extension Types to Handle
- **Productivity**: Tab management, note-taking, timer, clipboard.
- **Developer tools**: JSON formatter, color picker, CSS inspector.
- **Content modifier**: Text highlighter, ad blocker, reading mode.
- **Data**: Screenshot, bookmark manager, form filler.
- **Communication**: Quick compose, notification manager.

## Code Quality
- Clean, well-commented code.
- chrome.storage.sync for settings persistence.
- Proper error handling.
- Message passing between popup, background, and content scripts.
- Manifest permissions kept minimal.`;

export async function POST(req: NextRequest) {
  try {
    const { extensionName, extensionType, description, features } = await req.json();

    if (!extensionName || typeof extensionName !== "string") {
      return NextResponse.json({ error: "extensionName is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: CHROME_EXT_SYSTEM,
      messages: [{
        role: "user",
        content: `Generate a complete Chrome extension called "${extensionName}".\n\nType: ${extensionType || "productivity"}\nDescription: ${description || "A useful browser extension"}\nFeatures: ${Array.isArray(features) ? features.join(", ") : "Core functionality based on extension type"}\n\nGenerate all files: manifest.json (V3), popup HTML/CSS/JS, background service worker, content script if needed, and options page. Return as JSON with each file as a separate field.`,
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
      return NextResponse.json({ rawResponse: responseText, note: "Extension generated but JSON parsing failed." });
    }
  } catch (err) {
    console.error("Chrome extension generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
