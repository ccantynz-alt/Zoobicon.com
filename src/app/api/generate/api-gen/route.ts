import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const API_SYSTEM = `You are Zoobicon's REST API Generator. You generate complete, production-ready REST API code with documentation, schema, and an interactive API documentation page.

## Output Format
- Output ONLY valid JSON:
{
  "apiName": "API name",
  "baseUrl": "/api/v1",
  "schema": "PostgreSQL CREATE TABLE statements",
  "seedData": "INSERT statements for demo data",
  "endpoints": [
    {
      "method": "GET",
      "path": "/api/v1/users",
      "description": "List all users with pagination",
      "handler": "// Complete Next.js API route handler",
      "request": { "query": { "page": "number", "limit": "number" } },
      "response": { "200": { "data": "User[]", "total": "number" } },
      "auth": true
    }
  ],
  "middleware": {
    "auth": "// JWT authentication middleware code",
    "rateLimit": "// Rate limiting middleware code",
    "cors": "// CORS configuration code",
    "validation": "// Input validation helper code"
  },
  "docsHtml": "Complete interactive API documentation HTML page",
  "envExample": "ENV_VAR=value\\nDATABASE_URL=..."
}

## API Design Standards

### Endpoint Patterns
- RESTful: GET /resources, GET /resources/:id, POST /resources, PUT /resources/:id, DELETE /resources/:id.
- Pagination: ?page=1&limit=20 with total count in response.
- Filtering: ?status=active&sort=created_at&order=desc.
- Search: ?q=searchterm.
- Include relationships: ?include=author,comments.

### Response Format
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 100 }
}

Error format:
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Details", "fields": {} }
}

### Authentication
- JWT-based with access + refresh tokens.
- Login returns tokens, register creates user + returns tokens.
- Auth middleware validates Bearer token.
- Protected routes marked with auth: true.
- Rate limiting per IP and per user.

### Database Schema
- PostgreSQL compatible.
- UUID primary keys.
- created_at / updated_at timestamps.
- Foreign key constraints.
- Indexes on frequently queried columns.
- Proper data types (TEXT, INTEGER, DECIMAL, BOOLEAN, JSONB, TIMESTAMPTZ).

### Documentation Page
The docsHtml must be a complete, interactive API documentation page (Swagger-style):
- Endpoint list with method badges (GET=green, POST=blue, PUT=orange, DELETE=red).
- Expandable endpoint details.
- Request parameters table.
- Response schema display.
- Authentication instructions.
- "Try it" section with request builder and response viewer.
- Code examples in JavaScript fetch and cURL.
- Styled dark theme (developer-friendly).

### Handler Code
- Next.js App Router format (export async function GET/POST/PUT/DELETE).
- Parameterized SQL queries (prevent injection).
- Input validation at the start of each handler.
- Proper HTTP status codes (200, 201, 400, 401, 403, 404, 500).
- Try/catch error handling.
- Comments explaining key logic.`;

export async function POST(req: NextRequest) {
  try {
    const { apiName, resources, features } = await req.json();

    if (!apiName || typeof apiName !== "string") {
      return NextResponse.json({ error: "apiName is required" }, { status: 400 });
    }

    if (!Array.isArray(resources) || resources.length === 0) {
      return NextResponse.json({ error: "At least one resource is required (e.g., ['users', 'posts', 'comments'])" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: API_SYSTEM,
      messages: [{
        role: "user",
        content: `Generate a complete REST API called "${apiName}".\n\nResources: ${resources.join(", ")}\nFeatures: ${Array.isArray(features) ? features.join(", ") : "auth, pagination, filtering, rate-limiting"}\n\nGenerate: database schema, seed data, all CRUD endpoints with handlers, auth middleware, rate limiting, CORS config, interactive documentation page, and .env example. Return as JSON.`,
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
      return NextResponse.json({ rawResponse: responseText, note: "API generated but JSON parsing failed." });
    }
  } catch (err) {
    console.error("API generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
