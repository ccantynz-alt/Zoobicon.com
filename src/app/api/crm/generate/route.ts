import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_FEATURES = [
  "contact-management",
  "lead-tracking",
  "invoice-generation",
  "payment-tracking",
  "email-templates",
  "pipeline-view",
  "analytics-dashboard",
  "task-management",
  "client-portal",
  "appointment-scheduling",
];

function buildSystemPrompt(
  businessName: string,
  businessType: string,
  features: string[]
): string {
  const featureDescriptions: Record<string, string> = {
    "contact-management":
      "Full contact management with add, edit, delete, and search functionality. Include a contacts table with name, email, phone, company, status, and notes. Add a modal form for adding/editing contacts.",
    "lead-tracking":
      "Lead tracking system with lead status (New, Contacted, Qualified, Proposal, Negotiation, Won, Lost), lead source, estimated value, and conversion tracking.",
    "invoice-generation":
      "Invoice generator with professional PDF-style layout. Include line items with description, quantity, rate, and amount. Auto-calculate subtotal, tax, and total. Add business branding and print-ready styling.",
    "payment-tracking":
      "Payment tracking dashboard showing paid, pending, and overdue invoices. Include payment history, payment methods, and outstanding balance summary.",
    "email-templates":
      "Email template system with pre-built templates for follow-ups, proposals, thank-you notes, and meeting requests. Include a template editor with variable placeholders.",
    "pipeline-view":
      "Kanban-style pipeline board with drag-and-drop columns for each deal stage. Show deal cards with contact name, value, and expected close date.",
    "analytics-dashboard":
      "Analytics dashboard with revenue charts, lead conversion rates, monthly trends, top clients, and deal pipeline value. Use pure CSS/SVG charts - no external libraries.",
    "task-management":
      "Task management with to-do lists, due dates, priorities (High, Medium, Low), assignment, and completion tracking. Include task categories and filters.",
    "client-portal":
      "Client portal view showing client-specific information, their invoices, project status, communication history, and shared documents list.",
    "appointment-scheduling":
      "Appointment scheduling with a calendar view, time slots, booking form, and upcoming appointments list. Include reminders and status tracking.",
  };

  const selectedDescriptions = features
    .map((f) => `- ${f}: ${featureDescriptions[f] || f}`)
    .join("\n");

  return `You are Zoobicon's CRM Dashboard Generator. You create complete, production-quality CRM dashboard HTML files.

Business Details:
- Business Name: ${businessName}
- Business Type: ${businessType}

Rules:
- Output ONLY the HTML. No markdown, no explanation, no code fences.
- The HTML must be a complete document with <!DOCTYPE html>, <html>, <head>, and <body>.
- Include all CSS inline in a <style> tag in the <head>. Do NOT use external stylesheets (except Google Fonts via @import).
- Include all JavaScript inline in a <script> tag before </body>.
- Use modern CSS (flexbox, grid, custom properties, gradients, animations, transitions).
- Make the design visually stunning, polished, and professional with a dark theme.
- The dashboard must be fully responsive and work on mobile.
- Use Google Fonts via @import for professional typography.
- All data should be stored in and loaded from localStorage for demo purposes.
- Include sample/seed data so the dashboard looks populated on first load.
- For charts and analytics, use pure CSS and inline SVG only - NO external charting libraries.
- Add subtle animations, hover effects, and micro-interactions.
- Include a sidebar navigation with icons (use Unicode/emoji icons).
- Include a top header bar with the business name, search, and notifications.
- Each feature should be a navigable section/tab within the single-page dashboard.
- Make forms fully functional with localStorage persistence.
- Use a cohesive color scheme with CSS custom properties.
- Include toast notifications for actions (save, delete, etc.).

Selected features to implement:
${selectedDescriptions}

The CRM must feel like a real, usable application - not a mockup. All buttons should work, forms should save data, and the UI should update dynamically.`;
}

export async function POST(req: NextRequest) {
  try {
    const { businessName, businessType, features } = await req.json();

    if (!businessName || typeof businessName !== "string") {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    if (!businessType || typeof businessType !== "string") {
      return NextResponse.json(
        { error: "Business type is required" },
        { status: 400 }
      );
    }

    if (!features || !Array.isArray(features) || features.length === 0) {
      return NextResponse.json(
        { error: "At least one feature must be selected" },
        { status: 400 }
      );
    }

    const invalidFeatures = features.filter(
      (f: string) => !VALID_FEATURES.includes(f)
    );
    if (invalidFeatures.length > 0) {
      return NextResponse.json(
        { error: `Invalid features: ${invalidFeatures.join(", ")}` },
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

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: buildSystemPrompt(businessName, businessType, features),
      messages: [
        {
          role: "user",
          content: `Generate a complete CRM dashboard for "${businessName}" (${businessType}) with the following features: ${features.join(", ")}. Make it professional, fully functional with localStorage, and visually impressive.`,
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

    let html = textBlock.text.trim();

    // Strip markdown code fences if present
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({
      html,
      featuresIncluded: features,
    });
  } catch (err) {
    console.error("CRM generation error:", err);

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
