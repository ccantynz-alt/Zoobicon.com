import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * CRM contacts CRUD.
 *
 * GET    /api/crm/contacts?q=&limit=
 * POST   /api/crm/contacts  { name, company?, email?, phone?, ownerId? }
 * DELETE /api/crm/contacts?id=
 *
 * Tables are created by /api/crm on first use.
 */

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const q = params.get("q") || "";
    const limitRaw = parseInt(params.get("limit") || "200", 10);
    const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 200 : limitRaw), 1000);

    const rows = q
      ? await sql`
          SELECT id, name, company, email, phone, created_at
          FROM crm_contacts
          WHERE name ILIKE ${"%" + q + "%"}
             OR company ILIKE ${"%" + q + "%"}
             OR email ILIKE ${"%" + q + "%"}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT id, name, company, email, phone, created_at
          FROM crm_contacts
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;

    return NextResponse.json({ contacts: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load contacts";
    return NextResponse.json({ error: message, contacts: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, company, email, phone, ownerId } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const id = `contact_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await sql`
      INSERT INTO crm_contacts (id, name, company, email, phone, owner_id)
      VALUES (${id}, ${name}, ${company || null}, ${email || null},
              ${phone || null}, ${ownerId || null})
    `;

    return NextResponse.json({ contact: { id, name, company, email, phone } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create contact";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await sql`DELETE FROM crm_contacts WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
