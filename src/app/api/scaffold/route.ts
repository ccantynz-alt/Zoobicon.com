import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_FEATURES = [
  "auth-email",
  "auth-google",
  "auth-github",
  "database-users",
  "database-posts",
  "database-products",
  "database-orders",
  "admin-panel",
  "user-profiles",
  "file-uploads",
  "comments",
  "notifications",
];

function buildSystemPrompt(features: string[]): string {
  const featureDescriptions: Record<string, string> = {
    "auth-email": "Email/password authentication with signup and login forms, input validation, JWT token generation, and localStorage-based session management",
    "auth-google": "Google OAuth login button and flow with JWT token handling and localStorage session",
    "auth-github": "GitHub OAuth login button and flow with JWT token handling and localStorage session",
    "database-users": "Users table with id, email, password_hash, name, avatar_url, created_at, updated_at fields",
    "database-posts": "Posts/Blog table with id, title, slug, content, author_id (FK to users), published, created_at, updated_at fields",
    "database-products": "Products table with id, name, description, price, image_url, stock, category, created_at fields",
    "database-orders": "Orders table with id, user_id (FK to users), total, status, created_at and order_items table with id, order_id, product_id, quantity, price",
    "admin-panel": "Admin dashboard page with stats overview, user management table, and content moderation controls",
    "user-profiles": "User profile page with avatar, bio, settings form, and activity history",
    "file-uploads": "File upload component with drag-and-drop, preview, and progress bar",
    "comments": "Comments system with threaded replies, timestamps, and user avatars",
    "notifications": "Notification bell with dropdown, unread count badge, and mark-as-read functionality",
  };

  const selectedDescriptions = features
    .map((f) => `- ${f}: ${featureDescriptions[f] || f}`)
    .join("\n");

  return `You are Zoobicon's full-stack scaffolding engine. You take existing HTML code and enhance it with full-stack features.

Your task:
1. Take the provided HTML code and ADD the requested features directly into it.
2. Generate a SQL schema for the selected database features.
3. Generate API endpoint stubs as comments in the code.

Rules for enhanced HTML:
- Keep ALL existing HTML content and styling intact.
- Add new sections/components for the requested features.
- For auth features: add login/signup modal/forms with proper validation (email format, password strength).
- Use JWT-based auth flow with localStorage for token storage.
- Add a navigation bar auth section (Login/Signup buttons, or user avatar when logged in).
- All new CSS should be added to the existing <style> block.
- All new JavaScript should be added to the existing <script> block or a new one before </body>.
- The result must be a single, complete, valid HTML file.
- Make new UI elements match the existing design style.
- Add subtle animations for modals and transitions.

Rules for SQL schema:
- Use standard SQL (PostgreSQL-compatible).
- Include proper primary keys, foreign keys, indexes, and constraints.
- Add created_at and updated_at timestamps where appropriate.
- Use appropriate data types.

Rules for API endpoints:
- Define RESTful endpoints for each feature.
- Include the HTTP method, path, and a brief description.
- Add these as structured comments in the JavaScript section of the HTML.

The selected features to implement:
${selectedDescriptions}

You MUST respond in the following JSON format (no markdown fences, just raw JSON):
{
  "enhancedCode": "<the full enhanced HTML code as a string>",
  "schema": "<the SQL schema as a string>",
  "apiEndpoints": [{"method": "POST", "path": "/api/auth/login", "description": "Authenticate user and return JWT"}],
  "features": ["list of feature names that were added"]
}`;
}

export async function POST(req: NextRequest) {
  try {
    const { code, features } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "HTML code is required" },
        { status: 400 }
      );
    }

    if (!features || !Array.isArray(features) || features.length === 0) {
      return NextResponse.json(
        { error: "At least one feature must be selected" },
        { status: 400 }
      );
    }

    const invalidFeatures = features.filter((f: string) => !VALID_FEATURES.includes(f));
    if (invalidFeatures.length > 0) {
      return NextResponse.json(
        { error: `Invalid features: ${invalidFeatures.join(", ")}` },
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

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: buildSystemPrompt(features),
      messages: [
        {
          role: "user",
          content: `Here is the existing HTML code to enhance with the selected full-stack features:\n\n${code}`,
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

    let responseText = textBlock.text.trim();

    // Strip markdown code fences if present
    if (responseText.startsWith("```")) {
      responseText = responseText
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON" },
        { status: 500 }
      );
    }

    if (!result.enhancedCode || !result.schema || !result.apiEndpoints || !result.features) {
      return NextResponse.json(
        { error: "AI response is missing required fields" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      enhancedCode: result.enhancedCode,
      schema: result.schema,
      apiEndpoints: result.apiEndpoints,
      features: result.features,
    });
  } catch (err) {
    console.error("Scaffold generation error:", err);

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
