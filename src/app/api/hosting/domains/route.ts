import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getCloudflareConfig,
  addCustomHostname as cfAddHostname,
  removeCustomHostname as cfRemoveHostname,
} from "@/lib/cloudflare";

// ---------------------------------------------------------------------------
// Fallback: in-memory storage
// ---------------------------------------------------------------------------
interface DomainRecord {
  id: string;
  domain: string;
  siteId: string;
  status: "pending_verification" | "active" | "failed" | "deleted";
  sslStatus: "pending" | "provisioning" | "active" | "failed";
  dnsRecords: Array<{
    type: string;
    name: string;
    value: string;
    ttl: number;
  }>;
  cloudflareHostnameId?: string;
  createdAt: string;
  verifiedAt: string | null;
}

const memoryDomains = new Map<string, DomainRecord>();

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

async function dbListDomains(siteId: string): Promise<DomainRecord[] | null> {
  const sql = await getDb();
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT id, domain, site_id, status, ssl_status, dns_records, created_at
      FROM custom_domains WHERE site_id = ${siteId} AND status != 'deleted'
      ORDER BY created_at DESC
    `;
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      domain: r.domain as string,
      siteId: r.site_id as string,
      status: (r.status as DomainRecord["status"]) || "pending_verification",
      sslStatus: (r.ssl_status as DomainRecord["sslStatus"]) || "pending",
      dnsRecords: (r.dns_records as DomainRecord["dnsRecords"]) || [],
      createdAt: (r.created_at as string) || new Date().toISOString(),
      verifiedAt: null,
    }));
  } catch (err) {
    console.error("[Domains] DB list failed:", err);
    return null;
  }
}

async function dbCreateDomain(record: DomainRecord): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await sql`
      INSERT INTO custom_domains (id, site_id, domain, status, ssl_status, dns_records)
      VALUES (${record.id}, ${record.siteId}, ${record.domain}, ${record.status}, ${record.sslStatus}, ${JSON.stringify(record.dnsRecords)}::jsonb)
    `;
    return true;
  } catch (err) {
    console.error("[Domains] DB create failed:", err);
    return false;
  }
}

async function dbDeleteDomain(domain: string, siteId: string): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await sql`
      UPDATE custom_domains SET status = 'deleted'
      WHERE domain = ${domain} AND site_id = ${siteId}
    `;
    return true;
  } catch (err) {
    console.error("[Domains] DB delete failed:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DOMAIN_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

function generateVerificationToken(): string {
  return `zoobicon-verify-${randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

// ---------------------------------------------------------------------------
// POST /api/hosting/domains — add a custom domain
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { siteId, domain } = body as {
      siteId?: string;
      domain?: string;
    };

    // --- Validation ---
    if (!siteId || typeof siteId !== "string") {
      return NextResponse.json(
        { error: "A valid siteId is required." },
        { status: 400 }
      );
    }

    if (!domain || !DOMAIN_RE.test(domain)) {
      return NextResponse.json(
        {
          error:
            "A valid domain is required (e.g. example.com or sub.example.com).",
        },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase();

    // Check for duplicates in memory
    if (memoryDomains.has(normalizedDomain)) {
      const existing = memoryDomains.get(normalizedDomain)!;
      if (existing.status !== "deleted") {
        return NextResponse.json(
          { error: `Domain "${normalizedDomain}" is already registered.` },
          { status: 409 }
        );
      }
    }

    // --- Generate DNS records the user needs to configure ---
    const verificationToken = generateVerificationToken();

    const dnsRecords = [
      {
        type: "A",
        name: normalizedDomain,
        value: "76.76.21.21",
        ttl: 3600,
      },
      {
        type: "CNAME",
        name: `www.${normalizedDomain}`,
        value: `${siteId}.zoobicon.sh`,
        ttl: 3600,
      },
      {
        type: "TXT",
        name: `_zoobicon-verify.${normalizedDomain}`,
        value: verificationToken,
        ttl: 3600,
      },
    ];

    // Try Cloudflare custom hostname API first
    const cfConfig = getCloudflareConfig();
    let cloudflareHostnameId: string | undefined;

    if (cfConfig) {
      const cfResult = await cfAddHostname(cfConfig, normalizedDomain, siteId);
      if (cfResult.id) {
        cloudflareHostnameId = cfResult.id;
        // If Cloudflare provides a verification TXT, replace our generated one
        if (cfResult.verificationTxt) {
          dnsRecords[2].value = cfResult.verificationTxt;
        }
      }
    }

    const record: DomainRecord = {
      id: randomUUID(),
      domain: normalizedDomain,
      siteId,
      status: "pending_verification",
      sslStatus: "pending",
      dnsRecords,
      cloudflareHostnameId,
      createdAt: new Date().toISOString(),
      verifiedAt: null,
    };

    // Try to persist to database
    const dbSaved = await dbCreateDomain(record);

    // Also store in memory as fallback
    if (!dbSaved) {
      memoryDomains.set(normalizedDomain, record);
    }

    return NextResponse.json(
      {
        domain: normalizedDomain,
        status: record.status,
        dnsRecords,
        sslStatus: record.sslStatus,
        verificationInstructions: [
          `Add an A record for "${normalizedDomain}" pointing to 76.76.21.21`,
          `Add a CNAME record for "www.${normalizedDomain}" pointing to "${siteId}.zoobicon.sh"`,
          `Add a TXT record for "_zoobicon-verify.${normalizedDomain}" with value "${dnsRecords[2].value}"`,
          `DNS changes can take up to 48 hours to propagate. SSL will be provisioned automatically once verification passes.`,
        ],
        source: dbSaved ? "database" : cloudflareHostnameId ? "cloudflare" : "memory",
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
// GET /api/hosting/domains?siteId=...
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const siteId = req.nextUrl.searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId query parameter is required." },
        { status: 400 }
      );
    }

    // Try database first
    const dbDomains = await dbListDomains(siteId);
    if (dbDomains !== null && dbDomains.length > 0) {
      return NextResponse.json({ domains: dbDomains, count: dbDomains.length, source: "database" });
    }

    // Fallback: in-memory
    const result = Array.from(memoryDomains.values()).filter(
      (d) => d.siteId === siteId && d.status !== "deleted"
    );

    return NextResponse.json({ domains: result, count: result.length, source: "memory" });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/hosting/domains — remove a custom domain
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, siteId } = body as {
      domain?: string;
      siteId?: string;
    };

    if (!domain || !siteId) {
      return NextResponse.json(
        { error: "Both domain and siteId are required." },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase();

    // Try Cloudflare removal
    const cfConfig = getCloudflareConfig();
    const memRecord = memoryDomains.get(normalizedDomain);
    if (cfConfig && memRecord?.cloudflareHostnameId) {
      await cfRemoveHostname(cfConfig, memRecord.cloudflareHostnameId);
    }

    // Try database deletion
    const dbDeleted = await dbDeleteDomain(normalizedDomain, siteId);

    // Also clean up in-memory
    const record = memoryDomains.get(normalizedDomain);
    if (record) {
      if (record.status === "deleted") {
        if (!dbDeleted) {
          return NextResponse.json(
            { error: "Domain not found." },
            { status: 404 }
          );
        }
      }
      if (record.siteId !== siteId && !dbDeleted) {
        return NextResponse.json(
          { error: "Domain does not belong to the specified site." },
          { status: 403 }
        );
      }
      record.status = "deleted";
      memoryDomains.set(normalizedDomain, record);
    }

    if (!record && !dbDeleted) {
      return NextResponse.json(
        { error: "Domain not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Domain "${normalizedDomain}" has been removed.`,
      domain: normalizedDomain,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
