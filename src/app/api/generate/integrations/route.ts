import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_INTEGRATIONS = [
  "google-analytics",
  "facebook-pixel",
  "hotjar",
  "intercom",
  "calendly",
  "google-maps",
  "whatsapp",
  "social-share",
  "cookie-consent",
  "live-chat",
  "newsletter-popup",
  "back-to-top",
];

const INTEGRATION_DESCRIPTIONS: Record<string, string> = {
  "google-analytics":
    "Google Analytics 4 setup with: gtag.js snippet, custom event tracking on all CTA buttons, form submissions, outbound link clicks, scroll depth tracking (25%, 50%, 75%, 100%), and page section views via Intersection Observer. Use placeholder GA_MEASUREMENT_ID.",
  "facebook-pixel":
    "Meta/Facebook Pixel: base pixel code, PageView event, Lead event on form submit, ViewContent on section view, InitiateCheckout if checkout exists. Use placeholder PIXEL_ID.",
  hotjar:
    "Hotjar snippet for heatmaps and session recording. Use placeholder HOTJAR_ID. Add identify call if user info available.",
  intercom:
    "Intercom messenger widget: launcher button in bottom-right, custom styling to match site colors, auto-open on scroll past 70% of page, hide on mobile by default with toggle. Use placeholder INTERCOM_APP_ID.",
  calendly:
    "Calendly integration: 'Book a Call' button that opens Calendly inline popup, styled to match the site's CTA design. If a CTA already says 'Book' or 'Schedule', attach Calendly to it. Use placeholder CALENDLY_URL.",
  "google-maps":
    "Google Maps embed in the contact/footer section: responsive iframe, styled container with address text, directions link, custom map styling hint. If an address exists in the page, use it. Otherwise add a placeholder.",
  whatsapp:
    "WhatsApp Business floating button: bottom-right position (above Intercom if both), WhatsApp green styling, click opens wa.me link with pre-filled message, pulse animation on idle, hide after first interaction. Use placeholder PHONE_NUMBER.",
  "social-share":
    "Social share buttons: floating sidebar or section with share buttons for Twitter, Facebook, LinkedIn, and copy-link. Use native Web Share API on mobile with fallback to individual share URLs. Include share count placeholders.",
  "cookie-consent":
    "GDPR cookie consent banner: bottom bar or bottom-left card, 'Accept All', 'Reject Non-Essential', and 'Customize' options. Categories: Essential, Analytics, Marketing. Save preference in localStorage. Block analytics/marketing scripts until consent. Smooth slide-up animation.",
  "live-chat":
    "Simple live chat widget (standalone, no third-party): floating button bottom-right, expandable chat window, pre-filled welcome message, input field, simulated bot responses for demo ('Thanks for reaching out! A team member will be with you shortly.'). Store messages in localStorage.",
  "newsletter-popup":
    "Newsletter signup popup: trigger after 30 seconds or 60% scroll (whichever first), show only once per session (sessionStorage), overlay modal with email input, success state, close button, 'No thanks' dismissal. Smooth fade-in animation.",
  "back-to-top":
    "Back to top button: appears after scrolling 500px, smooth scroll to top on click, subtle design matching site accent color, circular button with arrow icon, fade-in/out animation, fixed bottom-right position.",
};

const INTEGRATIONS_SYSTEM = `You are Zoobicon's Integration Injection Agent. You take existing HTML and inject third-party integrations and conversion tools without changing the visible design or content.

## Your Task
- You receive HTML and a list of integrations to add.
- Inject each integration's code in the correct location (head, body start, body end, or inline).
- Output ONLY the complete updated HTML. No markdown, no explanation, no code fences.

## Integration Placement Rules
- Analytics/pixels: <script> in <head> after existing meta tags.
- Chat widgets: <script> before </body>.
- UI elements (WhatsApp button, back-to-top, cookie banner): HTML + CSS + JS before </body>.
- Cookie consent: Must load BEFORE analytics scripts and gate them.
- Calendar embeds: inline where appropriate (near CTAs).
- Maps: inline in contact/footer section.

## Design Integration Rules
- All injected UI elements must visually match the existing site design.
- Extract the accent/primary color from the existing CSS and use it.
- Floating buttons: z-index high enough to float above content.
- Spacing: don't overlap with each other (stack vertically in bottom-right if multiple).
- Mobile: ensure floating elements don't block content or overlap.
- Animations: subtle, professional (no bouncing or shaking).

## Placeholder Values
Use clear placeholder values that users can find-and-replace:
- GA_MEASUREMENT_ID for Google Analytics
- PIXEL_ID for Facebook Pixel
- HOTJAR_ID for Hotjar
- INTERCOM_APP_ID for Intercom
- CALENDLY_URL for Calendly
- PHONE_NUMBER for WhatsApp
- MAP_EMBED_URL for Google Maps

Add HTML comments above each integration block:
\`<!-- INTEGRATION: Google Analytics - Replace GA_MEASUREMENT_ID with your ID -->\`

## Rules
- Do NOT change any existing content, design, or layout.
- Do NOT break existing JavaScript functionality.
- Each integration must be self-contained and removable.
- Cookie consent must actually gate analytics/marketing scripts if included.
- All integrations must be mobile-responsive.`;

export async function POST(req: NextRequest) {
  try {
    const { html, integrations } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(integrations) || integrations.length === 0) {
      return NextResponse.json(
        {
          error: `At least one integration required. Available: ${VALID_INTEGRATIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const validIntegrations = integrations.filter((i: string) =>
      VALID_INTEGRATIONS.includes(i)
    );
    if (validIntegrations.length === 0) {
      return NextResponse.json(
        {
          error: `No valid integrations. Available: ${VALID_INTEGRATIONS.join(", ")}`,
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

    const integrationList = validIntegrations
      .map((i: string) => `- ${i}: ${INTEGRATION_DESCRIPTIONS[i] || i}`)
      .join("\n");

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: INTEGRATIONS_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Inject these integrations into this HTML website:\n\nIntegrations to add:\n${integrationList}\n\n---\n\nHTML:\n${html}\n\nAdd each integration with proper placement, placeholder IDs, and HTML comments marking each section. Ensure nothing conflicts and the design stays consistent.`,
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

    let enhancedHtml = textBlock.text.trim();
    if (enhancedHtml.startsWith("```")) {
      enhancedHtml = enhancedHtml
        .replace(/^```(?:html)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    return NextResponse.json({
      html: enhancedHtml,
      integrationsAdded: validIntegrations,
      placeholders: validIntegrations.reduce(
        (acc: Record<string, string>, i: string) => {
          const placeholderMap: Record<string, string> = {
            "google-analytics": "GA_MEASUREMENT_ID",
            "facebook-pixel": "PIXEL_ID",
            hotjar: "HOTJAR_ID",
            intercom: "INTERCOM_APP_ID",
            calendly: "CALENDLY_URL",
            "google-maps": "MAP_EMBED_URL",
            whatsapp: "PHONE_NUMBER",
          };
          if (placeholderMap[i]) {
            acc[i] = placeholderMap[i];
          }
          return acc;
        },
        {}
      ),
    });
  } catch (err) {
    console.error("Integration injection error:", err);

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
