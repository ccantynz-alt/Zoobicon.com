import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getCloudflareConfig,
  provisionSsl as cfProvisionSsl,
  getSslStatus as cfGetSslStatus,
} from "@/lib/cloudflare";

// ---------------------------------------------------------------------------
// Fallback: in-memory storage
// ---------------------------------------------------------------------------
interface SslCertificate {
  id: string;
  domain: string;
  siteId: string;
  type: "auto" | "custom";
  sslStatus: "provisioning" | "active" | "failed" | "expired" | "revoked";
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  createdAt: string;
}

const memoryCerts = new Map<string, SslCertificate>();

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

async function dbGetSslStatus(domain: string): Promise<SslCertificate | null> {
  const sql = await getDb();
  if (!sql) return null;
  try {
    const [row] = await sql`
      SELECT id, domain, site_id, status, ssl_status, dns_records, created_at
      FROM custom_domains WHERE domain = ${domain} LIMIT 1
    `;
    if (!row) return null;
    return {
      id: row.id as string,
      domain: row.domain as string,
      siteId: row.site_id as string,
      type: "auto",
      sslStatus: (row.ssl_status as SslCertificate["sslStatus"]) || "pending",
      issuer: "Zoobicon CA (Let's Encrypt)",
      issuedAt: (row.created_at as string) || new Date().toISOString(),
      expiresAt: futureDate(90),
      autoRenew: true,
      createdAt: (row.created_at as string) || new Date().toISOString(),
    };
  } catch (err) {
    console.error("[SSL] DB get failed:", err);
    return null;
  }
}

async function dbProvisionSsl(domain: string, siteId: string): Promise<SslCertificate | null> {
  const sql = await getDb();
  if (!sql) return null;
  try {
    // Check if domain exists in custom_domains
    const [existing] = await sql`
      SELECT id FROM custom_domains WHERE domain = ${domain} LIMIT 1
    `;

    if (existing) {
      // Update SSL status
      const [updated] = await sql`
        UPDATE custom_domains SET ssl_status = 'provisioning'
        WHERE domain = ${domain}
        RETURNING id, domain, site_id, ssl_status, created_at
      `;
      if (!updated) return null;
      return {
        id: updated.id as string,
        domain: updated.domain as string,
        siteId: updated.site_id as string,
        type: "auto",
        sslStatus: "provisioning",
        issuer: "Zoobicon CA (Let's Encrypt)",
        issuedAt: new Date().toISOString(),
        expiresAt: futureDate(90),
        autoRenew: true,
        createdAt: (updated.created_at as string) || new Date().toISOString(),
      };
    } else {
      // Create new entry
      const [created] = await sql`
        INSERT INTO custom_domains (id, site_id, domain, status, ssl_status)
        VALUES (${randomUUID()}, ${siteId}, ${domain}, 'pending', 'provisioning')
        RETURNING id, domain, site_id, ssl_status, created_at
      `;
      if (!created) return null;
      return {
        id: created.id as string,
        domain: created.domain as string,
        siteId: created.site_id as string,
        type: "auto",
        sslStatus: "provisioning",
        issuer: "Zoobicon CA (Let's Encrypt)",
        issuedAt: new Date().toISOString(),
        expiresAt: futureDate(90),
        autoRenew: true,
        createdAt: (created.created_at as string) || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error("[SSL] DB provision failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DOMAIN_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// POST /api/hosting/ssl — provision SSL for a domain
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, siteId, type = "auto" } = body as {
      domain?: string;
      siteId?: string;
      type?: string;
    };

    // --- Validation ---
    if (!domain || !DOMAIN_RE.test(domain)) {
      return NextResponse.json(
        { error: "A valid domain is required." },
        { status: 400 }
      );
    }

    if (!siteId || typeof siteId !== "string") {
      return NextResponse.json(
        { error: "siteId is required." },
        { status: 400 }
      );
    }

    const validTypes = ["auto", "custom"] as const;
    if (!validTypes.includes(type as (typeof validTypes)[number])) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(", ")}.` },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase();
    const certType = type as SslCertificate["type"];

    // Check for existing active certificate (in-memory)
    const existing = memoryCerts.get(normalizedDomain);
    if (
      existing &&
      (existing.sslStatus === "active" || existing.sslStatus === "provisioning")
    ) {
      return NextResponse.json(
        {
          error: `An SSL certificate is already ${existing.sslStatus} for "${normalizedDomain}".`,
          certificate: existing,
        },
        { status: 409 }
      );
    }

    // Strategy: Try Cloudflare first
    const cfConfig = getCloudflareConfig();
    if (cfConfig) {
      const cfResult = await cfProvisionSsl(cfConfig, normalizedDomain);
      if (cfResult.status !== "failed") {
        const cert: SslCertificate = {
          id: randomUUID(),
          domain: normalizedDomain,
          siteId,
          type: certType,
          sslStatus: "provisioning",
          issuer: "Cloudflare Edge (Let's Encrypt)",
          issuedAt: new Date().toISOString(),
          expiresAt: futureDate(certType === "auto" ? 90 : 365),
          autoRenew: certType === "auto",
          createdAt: new Date().toISOString(),
        };

        // Also persist to DB
        await dbProvisionSsl(normalizedDomain, siteId);

        return NextResponse.json(
          {
            domain: normalizedDomain,
            sslStatus: cert.sslStatus,
            issuer: cert.issuer,
            expiresAt: cert.expiresAt,
            type: cert.type,
            autoRenew: cert.autoRenew,
            source: "cloudflare",
          },
          { status: 201 }
        );
      }
    }

    // Try database
    const dbCert = await dbProvisionSsl(normalizedDomain, siteId);
    if (dbCert) {
      return NextResponse.json(
        {
          domain: normalizedDomain,
          sslStatus: dbCert.sslStatus,
          issuer: dbCert.issuer,
          expiresAt: dbCert.expiresAt,
          type: dbCert.type,
          autoRenew: dbCert.autoRenew,
          source: "database",
        },
        { status: 201 }
      );
    }

    // Fallback: in-memory
    const now = new Date().toISOString();
    const cert: SslCertificate = {
      id: randomUUID(),
      domain: normalizedDomain,
      siteId,
      type: certType,
      sslStatus: "provisioning",
      issuer:
        certType === "auto"
          ? "Zoobicon CA (Let's Encrypt)"
          : "Custom Certificate",
      issuedAt: now,
      expiresAt: futureDate(certType === "auto" ? 90 : 365),
      autoRenew: certType === "auto",
      createdAt: now,
    };

    memoryCerts.set(normalizedDomain, cert);

    return NextResponse.json(
      {
        domain: normalizedDomain,
        sslStatus: cert.sslStatus,
        issuer: cert.issuer,
        expiresAt: cert.expiresAt,
        type: cert.type,
        autoRenew: cert.autoRenew,
        source: "memory",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/hosting/ssl?domain=...
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const domain = req.nextUrl.searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        { error: "domain query parameter is required." },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase();

    // Strategy: Try Cloudflare first
    const cfConfig = getCloudflareConfig();
    if (cfConfig) {
      const cfStatus = await cfGetSslStatus(cfConfig, normalizedDomain);
      if (cfStatus.status !== "unknown") {
        return NextResponse.json({
          certificate: {
            domain: normalizedDomain,
            sslStatus: cfStatus.status,
            certificate: cfStatus.certificate,
            source: "cloudflare",
          },
        });
      }
    }

    // Try database
    const dbCert = await dbGetSslStatus(normalizedDomain);
    if (dbCert) {
      return NextResponse.json({ certificate: { ...dbCert, source: "database" } });
    }

    // Fallback: in-memory
    const cert = memoryCerts.get(normalizedDomain);
    if (!cert) {
      return NextResponse.json(
        { error: `No SSL certificate found for "${normalizedDomain}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({ certificate: { ...cert, source: "memory" } });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
