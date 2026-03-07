import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

/** GET /api/projects?email=... — list projects for a user */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return Response.json({ error: "email query param required" }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT id, user_email, name, prompt, code, template, created_at, updated_at
      FROM projects
      WHERE user_email = ${email}
      ORDER BY updated_at DESC
    `;
    return Response.json({ projects: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB error";
    return Response.json({ error: message }, { status: 500 });
  }
}

/** POST /api/projects — create a project */
export async function POST(request: NextRequest) {
  try {
    const { email, name, prompt, code, template } = await request.json();

    if (!email || !name) {
      return Response.json({ error: "email and name are required" }, { status: 400 });
    }

    const [row] = await sql`
      INSERT INTO projects (user_email, name, prompt, code, template)
      VALUES (${email}, ${name}, ${prompt ?? ""}, ${code ?? ""}, ${template ?? null})
      RETURNING *
    `;
    return Response.json({ project: row }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB error";
    return Response.json({ error: message }, { status: 500 });
  }
}
