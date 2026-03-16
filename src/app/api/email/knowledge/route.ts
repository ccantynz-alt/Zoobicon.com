import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// ---------------------------------------------------------------------------
// Knowledge Base API
// GET    /api/email/knowledge — list articles
// POST   /api/email/knowledge — create article
// PUT    /api/email/knowledge — update article
// DELETE /api/email/knowledge — delete article
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  try {
    let articles;
    if (search) {
      const q = `%${search}%`;
      articles = await sql`
        SELECT * FROM knowledge_base
        WHERE (title ILIKE ${q} OR content ILIKE ${q})
        ORDER BY category, title
      `;
    } else if (category) {
      articles = await sql`
        SELECT * FROM knowledge_base
        WHERE category = ${category}
        ORDER BY title
      `;
    } else {
      articles = await sql`
        SELECT * FROM knowledge_base
        ORDER BY category, title
      `;
    }

    // Get category counts
    const categories = await sql`
      SELECT category, COUNT(*)::int AS count
      FROM knowledge_base
      GROUP BY category
      ORDER BY category
    `;

    return NextResponse.json({ articles, categories });
  } catch (err) {
    console.error("[Knowledge API] GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch knowledge base" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, category, content, keywords } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }

    const rows = await sql`
      INSERT INTO knowledge_base (title, category, content, keywords)
      VALUES (${title}, ${category || "general"}, ${content}, ${JSON.stringify(keywords || [])})
      RETURNING *
    `;

    return NextResponse.json({ article: rows[0] }, { status: 201 });
  } catch (err) {
    console.error("[Knowledge API] POST Error:", err);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, title, category, content, keywords, is_active } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (title !== undefined) {
      await sql`UPDATE knowledge_base SET title = ${title}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (category !== undefined) {
      await sql`UPDATE knowledge_base SET category = ${category}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (content !== undefined) {
      await sql`UPDATE knowledge_base SET content = ${content}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (keywords !== undefined) {
      await sql`UPDATE knowledge_base SET keywords = ${JSON.stringify(keywords)}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (is_active !== undefined) {
      await sql`UPDATE knowledge_base SET is_active = ${is_active}, updated_at = NOW() WHERE id = ${id}`;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Knowledge API] PUT Error:", err);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await sql`DELETE FROM knowledge_base WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Knowledge API] DELETE Error:", err);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
