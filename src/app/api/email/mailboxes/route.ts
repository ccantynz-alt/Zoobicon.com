import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Mailbox {
  id: string;
  address: string;
  domain: string;
  localPart: string;
  displayName: string;
  forwardTo: string | null;
  autoReply: string | null;
  status: "active" | "suspended" | "pending";
  storageUsedMb: number;
  storageLimitMb: number;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

const memoryMailboxes = new Map<string, Mailbox>();

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------
async function getDb() {
  try {
    const { sql } = await import("@/lib/db");
    return sql;
  } catch {
    return null;
  }
}

async function dbListMailboxes(userEmail: string, domain?: string): Promise<Mailbox[] | null> {
  const sql = await getDb();
  if (!sql) return null;
  try {
    const rows = domain
      ? await sql`
          SELECT * FROM email_mailboxes
          WHERE user_email = ${userEmail} AND domain = ${domain}
          ORDER BY address
        `
      : await sql`
          SELECT * FROM email_mailboxes
          WHERE user_email = ${userEmail}
          ORDER BY domain, address
        `;
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      address: r.address as string,
      domain: r.domain as string,
      localPart: r.local_part as string,
      displayName: r.display_name as string,
      forwardTo: (r.forward_to as string) || null,
      autoReply: (r.auto_reply as string) || null,
      status: r.status as Mailbox["status"],
      storageUsedMb: (r.storage_used_mb as number) || 0,
      storageLimitMb: (r.storage_limit_mb as number) || 1000,
      userEmail: r.user_email as string,
      createdAt: (r.created_at as Date).toISOString(),
      updatedAt: (r.updated_at as Date).toISOString(),
    }));
  } catch {
    return null;
  }
}

async function dbCreateMailbox(mailbox: Mailbox): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await sql`
      INSERT INTO email_mailboxes (
        id, address, domain, local_part, display_name, forward_to, auto_reply,
        status, storage_used_mb, storage_limit_mb, user_email, created_at, updated_at
      ) VALUES (
        ${mailbox.id}, ${mailbox.address}, ${mailbox.domain}, ${mailbox.localPart},
        ${mailbox.displayName}, ${mailbox.forwardTo}, ${mailbox.autoReply},
        ${mailbox.status}, ${mailbox.storageUsedMb}, ${mailbox.storageLimitMb},
        ${mailbox.userEmail}, ${mailbox.createdAt}, ${mailbox.updatedAt}
      )
    `;
    return true;
  } catch {
    return false;
  }
}

async function dbUpdateMailbox(
  id: string,
  updates: Partial<Mailbox>
): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    const now = new Date().toISOString();
    if (updates.forwardTo !== undefined) {
      await sql`UPDATE email_mailboxes SET forward_to = ${updates.forwardTo}, updated_at = ${now} WHERE id = ${id}`;
    }
    if (updates.autoReply !== undefined) {
      await sql`UPDATE email_mailboxes SET auto_reply = ${updates.autoReply}, updated_at = ${now} WHERE id = ${id}`;
    }
    if (updates.displayName !== undefined) {
      await sql`UPDATE email_mailboxes SET display_name = ${updates.displayName}, updated_at = ${now} WHERE id = ${id}`;
    }
    if (updates.status !== undefined) {
      await sql`UPDATE email_mailboxes SET status = ${updates.status}, updated_at = ${now} WHERE id = ${id}`;
    }
    return true;
  } catch {
    return false;
  }
}

async function dbDeleteMailbox(id: string, userEmail: string): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await sql`DELETE FROM email_mailboxes WHERE id = ${id} AND user_email = ${userEmail}`;
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// GET /api/email/mailboxes?email=...&domain=...
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const userEmail = req.nextUrl.searchParams.get("email");
    const domain = req.nextUrl.searchParams.get("domain") || undefined;

    if (!userEmail) {
      return NextResponse.json(
        { error: "email query parameter is required." },
        { status: 400 }
      );
    }

    const dbMailboxes = await dbListMailboxes(userEmail, domain);
    if (dbMailboxes !== null) {
      return NextResponse.json({ mailboxes: dbMailboxes, source: "database" });
    }

    const mailboxes = Array.from(memoryMailboxes.values())
      .filter((m) => m.userEmail === userEmail && (!domain || m.domain === domain))
      .sort((a, b) => a.address.localeCompare(b.address));

    return NextResponse.json({ mailboxes, source: "memory" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/email/mailboxes — Create a mailbox
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { localPart, domain, displayName, forwardTo, email } = body as {
      localPart?: string;
      domain?: string;
      displayName?: string;
      forwardTo?: string;
      email?: string;
    };

    if (!localPart || typeof localPart !== "string") {
      return NextResponse.json(
        { error: "localPart is required (e.g. 'info', 'support', 'hello')." },
        { status: 400 }
      );
    }

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: "domain is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "email (user account email) is required." },
        { status: 400 }
      );
    }

    // Validate local part (no spaces, no special chars except . - _)
    const localPartRegex = /^[a-zA-Z0-9._-]+$/;
    if (!localPartRegex.test(localPart)) {
      return NextResponse.json(
        { error: "localPart can only contain letters, numbers, dots, hyphens, and underscores." },
        { status: 400 }
      );
    }

    const address = `${localPart.toLowerCase()}@${domain.toLowerCase()}`;
    const now = new Date().toISOString();

    const mailbox: Mailbox = {
      id: randomUUID(),
      address,
      domain: domain.toLowerCase(),
      localPart: localPart.toLowerCase(),
      displayName: displayName || localPart,
      forwardTo: forwardTo || null,
      autoReply: null,
      status: "active",
      storageUsedMb: 0,
      storageLimitMb: 1000, // 1GB default
      userEmail: email,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await dbCreateMailbox(mailbox);
    if (!saved) {
      memoryMailboxes.set(mailbox.id, mailbox);
    }

    return NextResponse.json(
      {
        mailbox,
        message: `Mailbox ${address} created successfully.`,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/email/mailboxes — Update a mailbox
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { mailboxId, displayName, forwardTo, autoReply, status } = body as {
      mailboxId?: string;
      displayName?: string;
      forwardTo?: string;
      autoReply?: string;
      status?: "active" | "suspended";
    };

    if (!mailboxId) {
      return NextResponse.json(
        { error: "mailboxId is required." },
        { status: 400 }
      );
    }

    const updates: Partial<Mailbox> = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (forwardTo !== undefined) updates.forwardTo = forwardTo;
    if (autoReply !== undefined) updates.autoReply = autoReply;
    if (status !== undefined) updates.status = status;

    const dbUpdated = await dbUpdateMailbox(mailboxId, updates);
    if (!dbUpdated) {
      const mailbox = memoryMailboxes.get(mailboxId);
      if (!mailbox) {
        return NextResponse.json(
          { error: "Mailbox not found." },
          { status: 404 }
        );
      }
      Object.assign(mailbox, updates, { updatedAt: new Date().toISOString() });
    }

    return NextResponse.json({
      message: "Mailbox updated.",
      mailboxId,
      updates,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/email/mailboxes
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { mailboxId, email } = body as { mailboxId?: string; email?: string };

    if (!mailboxId || !email) {
      return NextResponse.json(
        { error: "mailboxId and email are required." },
        { status: 400 }
      );
    }

    const deleted = await dbDeleteMailbox(mailboxId, email);
    if (!deleted) {
      const mailbox = memoryMailboxes.get(mailboxId);
      if (!mailbox || mailbox.userEmail !== email) {
        return NextResponse.json(
          { error: "Mailbox not found." },
          { status: 404 }
        );
      }
      memoryMailboxes.delete(mailboxId);
    }

    return NextResponse.json({ message: "Mailbox deleted.", mailboxId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
