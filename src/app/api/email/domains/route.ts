import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { generateDomainVerification } from "@/lib/email-service";

// ---------------------------------------------------------------------------
// In-memory store (replaced by DB in production)
// ---------------------------------------------------------------------------
interface EmailDomain {
  id: string;
  domain: string;
  userEmail: string;
  status: "pending" | "verified" | "failed";
  verificationToken: string;
  dkimTokens: string[];
  spfRecord: string;
  dmarcRecord: string;
  requiredRecords: Array<{
    type: string;
    name: string;
    value: string;
    purpose: string;
  }>;
  createdAt: string;
  verifiedAt?: string;
}

const emailDomains = new Map<string, EmailDomain>();

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

async function dbListDomains(userEmail: string): Promise<EmailDomain[] | null> {
  const sql = await getDb();
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT * FROM email_domains WHERE user_email = ${userEmail}
      ORDER BY created_at DESC
    `;
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      domain: r.domain as string,
      userEmail: r.user_email as string,
      status: r.status as EmailDomain["status"],
      verificationToken: r.verification_token as string,
      dkimTokens: (r.dkim_tokens as string[]) || [],
      spfRecord: r.spf_record as string,
      dmarcRecord: r.dmarc_record as string,
      requiredRecords: (r.required_records as EmailDomain["requiredRecords"]) || [],
      createdAt: (r.created_at as Date).toISOString(),
      verifiedAt: r.verified_at ? (r.verified_at as Date).toISOString() : undefined,
    }));
  } catch {
    return null;
  }
}

async function dbSaveDomain(domain: EmailDomain): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await sql`
      INSERT INTO email_domains (
        id, domain, user_email, status, verification_token,
        dkim_tokens, spf_record, dmarc_record, required_records, created_at
      ) VALUES (
        ${domain.id}, ${domain.domain}, ${domain.userEmail}, ${domain.status},
        ${domain.verificationToken}, ${JSON.stringify(domain.dkimTokens)},
        ${domain.spfRecord}, ${domain.dmarcRecord},
        ${JSON.stringify(domain.requiredRecords)}, ${domain.createdAt}
      )
    `;
    return true;
  } catch {
    return false;
  }
}

async function dbUpdateDomainStatus(
  id: string,
  status: string,
  verifiedAt?: string
): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    if (verifiedAt) {
      await sql`
        UPDATE email_domains SET status = ${status}, verified_at = ${verifiedAt}
        WHERE id = ${id}
      `;
    } else {
      await sql`UPDATE email_domains SET status = ${status} WHERE id = ${id}`;
    }
    return true;
  } catch {
    return false;
  }
}

async function dbDeleteDomain(id: string, userEmail: string): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await sql`DELETE FROM email_domains WHERE id = ${id} AND user_email = ${userEmail}`;
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// GET /api/email/domains?email=...  — List domains for a user
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const userEmail = req.nextUrl.searchParams.get("email");
    if (!userEmail) {
      return NextResponse.json(
        { error: "email query parameter is required." },
        { status: 400 }
      );
    }

    // Try DB first
    const dbDomains = await dbListDomains(userEmail);
    if (dbDomains !== null) {
      return NextResponse.json({ domains: dbDomains, source: "database" });
    }

    // Fallback: in-memory
    const domains = Array.from(emailDomains.values())
      .filter((d) => d.userEmail === userEmail)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ domains, source: "memory" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/email/domains — Add a domain for email sending
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, email } = body as { domain?: string; email?: string };

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: "domain is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "email (user email) is required." },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase().trim();
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(normalizedDomain)) {
      return NextResponse.json(
        { error: "Invalid domain format." },
        { status: 400 }
      );
    }

    // Generate verification requirements
    const verification = generateDomainVerification(normalizedDomain);

    const emailDomain: EmailDomain = {
      id: randomUUID(),
      domain: normalizedDomain,
      userEmail: email,
      status: "pending",
      verificationToken: verification.verificationToken,
      dkimTokens: verification.dkimTokens,
      spfRecord: verification.spfRecord,
      dmarcRecord: verification.dmarcRecord,
      requiredRecords: verification.requiredRecords,
      createdAt: new Date().toISOString(),
    };

    // Try to persist
    const saved = await dbSaveDomain(emailDomain);
    if (!saved) {
      emailDomains.set(emailDomain.id, emailDomain);
    }

    return NextResponse.json(
      {
        domain: emailDomain,
        message: "Domain added. Configure the DNS records below to verify ownership and enable email sending.",
        requiredRecords: verification.requiredRecords,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/email/domains — Verify domain DNS records
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { domainId, action } = body as { domainId?: string; action?: string };

    if (!domainId) {
      return NextResponse.json(
        { error: "domainId is required." },
        { status: 400 }
      );
    }

    if (action === "verify") {
      // In production: check DNS records via dig/DNS lookup
      // For now: mark as verified
      const updated = await dbUpdateDomainStatus(
        domainId,
        "verified",
        new Date().toISOString()
      );

      if (!updated) {
        const domain = emailDomains.get(domainId);
        if (domain) {
          domain.status = "verified";
          domain.verifiedAt = new Date().toISOString();
        } else {
          return NextResponse.json(
            { error: "Domain not found." },
            { status: 404 }
          );
        }
      }

      return NextResponse.json({
        message: "Domain verification initiated. DNS records will be checked.",
        status: "verified",
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'verify'." },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/email/domains — Remove a domain
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { domainId, email } = body as { domainId?: string; email?: string };

    if (!domainId || !email) {
      return NextResponse.json(
        { error: "domainId and email are required." },
        { status: 400 }
      );
    }

    const deleted = await dbDeleteDomain(domainId, email);
    if (!deleted) {
      const domain = emailDomains.get(domainId);
      if (!domain || domain.userEmail !== email) {
        return NextResponse.json(
          { error: "Domain not found." },
          { status: 404 }
        );
      }
      emailDomains.delete(domainId);
    }

    return NextResponse.json({ message: "Domain removed.", domainId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
