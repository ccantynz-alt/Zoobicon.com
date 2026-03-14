import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  registerDomain,
  getDomainInfo,
  renewDomain,
  transferDomain,
  updateNameservers,
  type ContactInfo,
} from "@/lib/domain-reseller";

// ---------------------------------------------------------------------------
// In-memory store for registered domains
// ---------------------------------------------------------------------------
interface DomainRecord {
  id: string;
  domain: string;
  userEmail: string;
  status: "active" | "expired" | "pending" | "transferring";
  registeredAt: string;
  expiresAt: string;
  autoRenew: boolean;
  privacyProtection: boolean;
  nameservers: string[];
}

const registeredDomains = new Map<string, DomainRecord>();

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

async function dbSaveDomain(record: DomainRecord): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await sql`
      INSERT INTO registered_domains (
        id, domain, user_email, status, registered_at, expires_at,
        auto_renew, privacy_protection, nameservers
      ) VALUES (
        ${record.id}, ${record.domain}, ${record.userEmail}, ${record.status},
        ${record.registeredAt}, ${record.expiresAt}, ${record.autoRenew},
        ${record.privacyProtection}, ${JSON.stringify(record.nameservers)}
      )
    `;
    return true;
  } catch {
    return false;
  }
}

async function dbListDomains(userEmail: string): Promise<DomainRecord[] | null> {
  const sql = await getDb();
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT * FROM registered_domains WHERE user_email = ${userEmail}
      ORDER BY registered_at DESC
    `;
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      domain: r.domain as string,
      userEmail: r.user_email as string,
      status: r.status as DomainRecord["status"],
      registeredAt: (r.registered_at as Date).toISOString(),
      expiresAt: (r.expires_at as Date).toISOString(),
      autoRenew: r.auto_renew as boolean,
      privacyProtection: r.privacy_protection as boolean,
      nameservers: (r.nameservers as string[]) || [],
    }));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// GET /api/domains/register?email=...  — List user's registered domains
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

    const dbDomains = await dbListDomains(userEmail);
    if (dbDomains !== null) {
      return NextResponse.json({ domains: dbDomains, source: "database" });
    }

    const domains = Array.from(registeredDomains.values())
      .filter((d) => d.userEmail === userEmail)
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));

    return NextResponse.json({ domains, source: "memory" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/domains/register — Register a new domain
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      domain,
      period = 1,
      registrant,
      nameservers,
      autoRenew = true,
      privacyProtection = true,
      email,
    } = body as {
      domain?: string;
      period?: number;
      registrant?: ContactInfo;
      nameservers?: string[];
      autoRenew?: boolean;
      privacyProtection?: boolean;
      email?: string;
    };

    // --- Validation ---
    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: "domain is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "email (user account) is required." },
        { status: 400 }
      );
    }

    if (!registrant) {
      return NextResponse.json(
        { error: "registrant contact info is required." },
        { status: 400 }
      );
    }

    const required = ["firstName", "lastName", "email", "phone", "address1", "city", "state", "postalCode", "country"];
    for (const field of required) {
      if (!registrant[field as keyof ContactInfo]) {
        return NextResponse.json(
          { error: `registrant.${field} is required.` },
          { status: 400 }
        );
      }
    }

    if (period < 1 || period > 10) {
      return NextResponse.json(
        { error: "period must be between 1 and 10 years." },
        { status: 400 }
      );
    }

    // Register via OpenSRS
    const result = await registerDomain({
      domain: domain.toLowerCase(),
      period,
      registrant,
      nameservers: nameservers || ["ns1.zoobicon.io", "ns2.zoobicon.io"],
      autoRenew,
      privacyProtection,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Registration failed." },
        { status: 500 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + period * 365 * 86400000);

    const record: DomainRecord = {
      id: randomUUID(),
      domain: domain.toLowerCase(),
      userEmail: email,
      status: "active",
      registeredAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      autoRenew,
      privacyProtection,
      nameservers: nameservers || ["ns1.zoobicon.io", "ns2.zoobicon.io"],
    };

    const saved = await dbSaveDomain(record);
    if (!saved) {
      registeredDomains.set(record.id, record);
    }

    return NextResponse.json(
      {
        domain: record,
        orderId: result.orderId,
        message: `${domain} registered successfully for ${period} year(s).`,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/domains/register — Manage domain (renew, transfer, update NS)
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, domain, period, authCode, registrant, nameservers } = body as {
      action?: "renew" | "transfer" | "update-ns" | "info";
      domain?: string;
      period?: number;
      authCode?: string;
      registrant?: ContactInfo;
      nameservers?: string[];
    };

    if (!action || !domain) {
      return NextResponse.json(
        { error: "action and domain are required." },
        { status: 400 }
      );
    }

    switch (action) {
      case "renew": {
        const result = await renewDomain(domain, period || 1);
        if (!result.success) {
          return NextResponse.json(
            { error: result.error || "Renewal failed." },
            { status: 500 }
          );
        }
        return NextResponse.json({
          message: `${domain} renewed for ${period || 1} year(s).`,
        });
      }

      case "transfer": {
        if (!authCode) {
          return NextResponse.json(
            { error: "authCode is required for transfers." },
            { status: 400 }
          );
        }
        if (!registrant) {
          return NextResponse.json(
            { error: "registrant is required for transfers." },
            { status: 400 }
          );
        }
        const result = await transferDomain(domain, authCode, registrant);
        if (!result.success) {
          return NextResponse.json(
            { error: result.error || "Transfer failed." },
            { status: 500 }
          );
        }
        return NextResponse.json({
          message: `Transfer initiated for ${domain}.`,
          orderId: result.orderId,
        });
      }

      case "update-ns": {
        if (!nameservers || nameservers.length < 2) {
          return NextResponse.json(
            { error: "At least 2 nameservers required." },
            { status: 400 }
          );
        }
        const result = await updateNameservers(domain, nameservers);
        if (!result.success) {
          return NextResponse.json(
            { error: result.error || "NS update failed." },
            { status: 500 }
          );
        }
        return NextResponse.json({
          message: `Nameservers updated for ${domain}.`,
          nameservers,
        });
      }

      case "info": {
        const result = await getDomainInfo(domain);
        if (!result.success) {
          return NextResponse.json(
            { error: result.error || "Lookup failed." },
            { status: 500 }
          );
        }
        return NextResponse.json({ domain: result.info });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: renew, transfer, update-ns, info." },
          { status: 400 }
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
