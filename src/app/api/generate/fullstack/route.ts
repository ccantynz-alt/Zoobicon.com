import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, checkUsageQuota, trackUsage } from "@/lib/auth-guard";

const FULLSTACK_SYSTEM = `You are Zoobicon, a world-class AI full-stack application generator. When given an app description, you produce a complete full-stack application with a database schema, API routes, and a premium interactive frontend.

## Output Format
- Output ONLY a valid JSON object. No markdown, no explanation, no code fences.
- The JSON must have exactly these keys:
  - "schema": A string containing SQL CREATE TABLE statements for Neon PostgreSQL.
  - "api": An array of objects, each with { "path": string, "method": string, "handler": string }.
  - "html": A complete HTML file as a string with embedded JS that uses fetch() to interact with the API endpoints.
  - "description": A brief 1-2 sentence description of what was built.

## Database Schema Rules
- Use PostgreSQL syntax compatible with Neon.
- Use UUID primary keys with gen_random_uuid() as default: id UUID PRIMARY KEY DEFAULT gen_random_uuid().
- Use TIMESTAMPTZ for all timestamp columns, with DEFAULT NOW() where appropriate.
- Use appropriate column types: TEXT, VARCHAR, INTEGER, NUMERIC, BOOLEAN, JSONB, etc.
- Include created_at TIMESTAMPTZ DEFAULT NOW() and updated_at TIMESTAMPTZ DEFAULT NOW() on every table.
- Add proper foreign key constraints with ON DELETE CASCADE where appropriate.
- Add CHECK constraints for data validation (e.g., CHECK (email ~* '^[^@]+@[^@]+\\.[^@]+$')).
- Add useful indexes on frequently queried columns.
- Include INSERT statements with 5-10 rows of realistic sample data per table.
- Wrap everything in a transaction: BEGIN; ... COMMIT;.

## API Route Rules
- Design RESTful endpoints following Next.js App Router conventions.
- Each object in the "api" array represents one route handler file.
- "path" should be the API route path (e.g., "/api/bookings", "/api/bookings/[id]").
- "method" should be the HTTP method (GET, POST, PUT, DELETE).
- "handler" should be a complete Next.js route handler function as a string, using the App Router pattern (export async function GET/POST/PUT/DELETE).
- Handlers should use parameterized queries to prevent SQL injection.
- Include proper error handling with try/catch blocks.
- Return appropriate HTTP status codes (200, 201, 400, 404, 500).
- Include input validation in POST/PUT handlers.

## Frontend HTML Rules — THIS IS CRITICAL
You must produce a frontend that looks premium, sophisticated, and visually stunning. NOT a generic template. Follow these rules meticulously:

**Typography:**
- Import 2 complementary Google Fonts (one for headings, one for body). Good combos: Inter + DM Sans, Poppins + Open Sans, Playfair Display + Source Sans 3, Space Grotesk + Inter, Sora + Inter.
- Headings: clamp(2rem, 4vw, 3.5rem), font-weight 800, letter-spacing -0.03em.
- Body text: 17-18px, line-height 1.7, font-weight 400. Subheadings: font-weight 600.

**Color & Visual Design:**
- Create a unique, cohesive color palette: primary, secondary, accent, plus 3+ neutrals.
- Never use pure black (#000) or pure white (#fff). Use near-black (#0a0a0f, #111827, #1a1a2e) and warm whites (#fafaf9, #f8fafc).
- Use the accent color sparingly — only for CTAs, badges, and key highlights.
- Create depth with multi-layered box-shadows.
- Use rich gradients on headers and buttons.

**Layout & Spacing:**
- Generous whitespace — sections: 60-100px vertical padding.
- Max content width 1200px, centered. Use CSS Grid and Flexbox masterfully.
- Cards: border-radius 16-24px, subtle borders, multi-layer shadows.

**Visual Polish:**
- CSS transitions on ALL interactive elements: transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1).
- Button hover: shadow lift, translateY(-2px), color shift, scale(1.02).
- Card hover: translateY(-4px), enhanced shadow.
- Glass-morphism effects where appropriate.
- Scroll-triggered animations using Intersection Observer.
- Smooth scroll behavior.

**Application Features:**
- Full CRUD operations: Create, Read, Update, Delete for all resources.
- A beautiful data table or card grid to display records.
- Modal or inline forms for creating and editing records.
- Confirmation dialogs before deleting.
- Form validation with clear error messages.
- Loading states and success/error toast notifications.
- Search and filter functionality where appropriate.
- Responsive design — works perfectly on mobile.
- Navigation bar with app name and relevant links.
- Empty state illustrations or messages when no data exists.

**Fetch Integration:**
- Use fetch() to call the API endpoints defined in the "api" array.
- Handle loading, success, and error states properly.
- Refresh data after mutations (create, update, delete).
- Use proper HTTP methods and Content-Type headers.
- Parse and display API error messages to the user.

**Images:**
- Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for any placeholder images (unique descriptive keyword per image).
- Use inline SVGs for icons with brand colors.

**Responsive:**
- Mobile-first approach. Use clamp() for typography.
- Touch-friendly: buttons min 44px tap target.
- Cards stack vertically on mobile.

## What to AVOID
- ANYTHING that looks like a free template, Bootstrap default, or student project.
- Flat, boring layouts with no visual hierarchy.
- Missing hover states, transitions, or animations.
- Cramped spacing or walls of text.
- Non-functional CRUD — every button must work.
- Placeholder "TODO" comments — everything must be fully implemented.`;

export async function POST(req: NextRequest) {
  try {
    // Auth + quota enforcement — prevent unauthenticated abuse
    const auth = await authenticateRequest(req, { requireAuth: true });
    if (auth.error) return auth.error;
    const quota = await checkUsageQuota(auth.user.email, auth.user.plan, "generation");
    if (quota.error) return quota.error;

    const { prompt, tier } = await req.json();

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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again later." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const userMessage = `Build me a complete full-stack application: ${prompt}

Generate a production-quality database schema, RESTful API routes, and a jaw-droppingly beautiful interactive frontend with full CRUD operations. The frontend must use fetch() to call the API endpoints you define. Include realistic sample data in the schema.

Return ONLY a JSON object with keys: schema, api, html, description.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: FULLSTACK_SYSTEM,
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

    let parsed: {
      schema: string;
      api: { path: string; method: string; handler: string }[];
      html: string;
      description: string;
    };

    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse generated output as JSON" },
        { status: 500 }
      );
    }

    if (!parsed.schema || !parsed.api || !parsed.html || !parsed.description) {
      return NextResponse.json(
        { error: "Generated output is missing required fields" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      schema: parsed.schema,
      api: parsed.api,
      html: parsed.html,
      description: parsed.description,
    });
  } catch (err) {
    console.error("Fullstack generation error:", err);

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
