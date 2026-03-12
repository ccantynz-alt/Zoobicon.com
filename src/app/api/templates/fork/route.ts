import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

// POST /api/templates/fork — fork a template (get its HTML to use in builder)
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return Response.json({ error: "Template ID is required" }, { status: 400 });
    }

    const templates = await sql`
      SELECT id, name, html, prompt FROM templates WHERE id = ${id} AND is_public = true
    `;

    if (templates.length === 0) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    // Increment fork count
    await sql`UPDATE templates SET fork_count = fork_count + 1 WHERE id = ${id}`;

    return Response.json({
      html: templates[0].html,
      name: templates[0].name,
      prompt: templates[0].prompt,
    });
  } catch (err) {
    console.error("Template fork error:", err);
    return Response.json({ error: "Failed to fork template" }, { status: 500 });
  }
}
