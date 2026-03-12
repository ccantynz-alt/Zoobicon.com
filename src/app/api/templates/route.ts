import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

// GET /api/templates — list public templates
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    // Auto-create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        prompt TEXT,
        html TEXT NOT NULL,
        thumbnail TEXT,
        author_email VARCHAR(255),
        is_public BOOLEAN DEFAULT true,
        fork_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    const templates = await sql`
      SELECT id, name, prompt, thumbnail, author_email, fork_count, created_at
      FROM templates
      WHERE is_public = true
      ORDER BY fork_count DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return Response.json({ templates, count: templates.length });
  } catch (err) {
    console.error("Templates fetch error:", err);
    return Response.json({ templates: [], count: 0 });
  }
}

// POST /api/templates — save a template
export async function POST(request: NextRequest) {
  try {
    const { name, html, prompt } = await request.json();

    if (!html || typeof html !== "string") {
      return Response.json({ error: "HTML content is required" }, { status: 400 });
    }

    // Auto-create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        prompt TEXT,
        html TEXT NOT NULL,
        thumbnail TEXT,
        author_email VARCHAR(255),
        is_public BOOLEAN DEFAULT true,
        fork_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Extract a title from HTML for fallback name
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const templateName = (name || titleMatch?.[1] || "Untitled").slice(0, 100);

    const result = await sql`
      INSERT INTO templates (name, prompt, html, is_public)
      VALUES (${templateName}, ${prompt || ""}, ${html}, true)
      RETURNING id, name, created_at
    `;

    return Response.json({
      id: result[0].id,
      name: result[0].name,
      message: "Template saved",
    });
  } catch (err) {
    console.error("Template save error:", err);
    return Response.json({ error: "Failed to save template" }, { status: 500 });
  }
}
