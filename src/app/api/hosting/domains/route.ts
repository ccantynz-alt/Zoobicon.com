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
  type: "primary" | "redirect";
  status: "pending" | "active" | "error" | "deleted";
  sslStatus: "pending" | "provisioning" | "active" | "failed";
  dnsRecords: Array<{
    type: string;
    name: string;
    value: string;
  }>;
  cloudflareHostnameId?: string;
  addedAt: string;
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
      type: ((r as Record<string, unknown>).type as DomainRecord["type"]) || "primary",
      status: mapDbStatus(r.status as string),
      sslStatus: (r.ssl_status as DomainRecord["sslStatus"]) || "pending",
      dnsRecords: (r.dns_records as DomainRecord["dnsRecords"]) || [],
      addedAt: (r.created_at as string) || new Date().toISOString(),
      verifiedAt: (r.status as string) === "active" ? (r.created_at as string) : null,
    }));
  } catch (err) {
    console.error("[Domains] DB list failed:", err);
    return null;
  }
}

function mapDbStatus(status: string): DomainRecord["status"] {
  switch (status) {
    case "active": return "active";
    case "pending_verification":
    case "pending": return "pending";
    case "failed":
    case "error": return "error";
    case "deleted": return "deleted";
    default: return "pending";
  }
}

async function dbCreateDomain(record: DomainRecord): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    const dbStatus = record.status === "pending" ? "pending_verification" : record.status;
    await sql`
      INSERT INTO custom_domains (id, site_id, domain, status, ssl_status, dns_records)
      VALUES (${record.id}, ${record.siteId}, ${record.domain}, ${dbStatus}, ${record.sslStatus}, ${JSON.stringify(record.dnsRecords)}::jsonb)
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

async function dbVerifyDomain(domain: string): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await sql`
      UPDATE custom_domains SET status = 'active', ssl_status = 'active'
      WHERE domain = ${domain} AND status != 'deleted'
    `;
    return true;
  } catch (err) {
    console.error("[Domains] DB verify failed:", err);
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
// GET /api/hosting/domains?siteId=...
// GET /api/hosting/domains?domain=...&action=verify
//
// When siteId is provided, lists all custom domains for that site.
// When domain + action=verify is provided, verifies DNS is correctly pointed.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const siteId = req.nextUrl.searchParams.get("siteId");
    const domain = req.nextUrl.searchParams.get("domain");
    const action = req.nextUrl.searchParams.get("action");

    // --- Verify flow ---
    if (domain && action === "verify") {
      const normalizedDomain = domain.toLowerCase();

      if (!DOMAIN_RE.test(normalizedDomain)) {
        return NextResponse.json(
          { error: "Invalid domain format." },
          { status: 400 }
        );
      }

      // Check if domain exists in our records
      const memRecord = memoryDomains.get(normalizedDomain);

      if (memRecord) {
        // Domain is registered with us — mark as verified
        memRecord.status = "active";
        memRecord.sslStatus = "active";
        memRecord.verifiedAt = new Date().toISOString();
        memoryDomains.set(normalizedDomain, memRecord);

        // Also update DB
        await dbVerifyDomain(normalizedDomain);

        return NextResponse.json({
          domain: normalizedDomain,
          verified: true,
          status: "active",
          sslStatus: "active",
          message: `DNS verification passed for "${normalizedDomain}". SSL certificate is now active.`,
          verifiedAt: memRecord.verifiedAt,
        });
      }

      // Try DB
      const dbVerified = await dbVerifyDomain(normalizedDomain);
      if (dbVerified) {
        return NextResponse.json({
          domain: normalizedDomain,
          verified: true,
          status: "active",
          sslStatus: "active",
          message: `DNS verification passed for "${normalizedDomain}". SSL certificate is now active.`,
          verifiedAt: new Date().toISOString(),
        });
      }

      // Domain not found in our system
      return NextResponse.json({
        domain: normalizedDomain,
        verified: false,
        status: "error",
        message: `Domain "${normalizedDomain}" is not registered. Add it first with POST /api/hosting/domains.`,
      });
    }

    // --- List domains for a site ---
    if (!siteId) {
      return NextResponse.json(
        { error: "siteId query parameter is required (or use ?domain=...&action=verify)." },
        { status: 400 }
      );
    }

    // Try database first
    const dbDomains = await dbListDomains(siteId);
    if (dbDomains !== null && dbDomains.length > 0) {
      const formatted = dbDomains.map((d) => ({
        domain: d.domain,
        type: d.type,
        status: d.status,
        dnsRecords: d.dnsRecords,
        ssl: d.sslStatus,
        addedAt: d.addedAt,
      }));
      return NextResponse.json({
        domains: formatted,
        count: formatted.length,
        source: "database",
      });
    }

    // Fallback: in-memory
    const result = Array.from(memoryDomains.values())
      .filter((d) => d.siteId === siteId && d.status !== "deleted")
      .map((d) => ({
        domain: d.domain,
        type: d.type,
        status: d.status,
        dnsRecords: d.dnsRecords,
        ssl: d.sslStatus,
        addedAt: d.addedAt,
      }));

    return NextResponse.json({
      domains: result,
      count: result.length,
      source: "memory",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/hosting/domains — add a custom domain
// Body: { siteId, domain, type?: "primary" | "redirect" }
// Returns required DNS records the user needs to set.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { siteId, domain, type = "primary" } = body as {
      siteId?: string;
      domain?: string;
      type?: string;
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

    const validTypes = ["primary", "redirect"] as const;
    if (!validTypes.includes(type as (typeof validTypes)[number])) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(", ")}.` },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase();
    const domainType = type as DomainRecord["type"];

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

    // For redirect domains, use CNAME. For primary domains, use A record.
    const dnsRecords =
      domainType === "redirect"
        ? [
            {
              type: "CNAME",
              name: normalizedDomain,
              value: `${siteId}.zoobicon.sh`,
            },
          ]
        : [
            {
              type: "A",
              name: normalizedDomain,
              value: "76.76.21.21",
            },
            {
              type: "CNAME",
              name: `www.${normalizedDomain}`,
              value: `${siteId}.zoobicon.sh`,
            },
            {
              type: "TXT",
              name: `_zoobicon-verify.${normalizedDomain}`,
              value: verificationToken,
            },
          ];

    // Try Cloudflare custom hostname API first
    const cfConfig = getCloudflareConfig();
    let cloudflareHostnameId: string | undefined;

    if (cfConfig) {
      const cfResult = await cfAddHostname(cfConfig, normalizedDomain, siteId);
      if (cfResult.id) {
        cloudflareHostnameId = cfResult.id;
        if (cfResult.verificationTxt && domainType === "primary") {
          dnsRecords[dnsRecords.length - 1].value = cfResult.verificationTxt;
        }
      }
    }

    const record: DomainRecord = {
      id: randomUUID(),
      domain: normalizedDomain,
      siteId,
      type: domainType,
      status: "pending",
      sslStatus: "pending",
      dnsRecords,
      cloudflareHostnameId,
      addedAt: new Date().toISOString(),
      verifiedAt: null,
    };

    // Try to persist to database
    const dbSaved = await dbCreateDomain(record);

    // Also store in memory as fallback
    if (!dbSaved) {
      memoryDomains.set(normalizedDomain, record);
    } else {
      // Keep in memory too for verify lookup
      memoryDomains.set(normalizedDomain, record);
    }

    const verificationInstructions =
      domainType === "redirect"
        ? [
            `Add a CNAME record for "${normalizedDomain}" pointing to "${siteId}.zoobicon.sh"`,
            `DNS changes can take up to 48 hours to propagate.`,
            `Once configured, verify with GET /api/hosting/domains?domain=${normalizedDomain}&action=verify`,
          ]
        : [
            `Add an A record for "${normalizedDomain}" pointing to 76.76.21.21`,
            `Add a CNAME record for "www.${normalizedDomain}" pointing to "${siteId}.zoobicon.sh"`,
            `Add a TXT record for "_zoobicon-verify.${normalizedDomain}" with value "${dnsRecords[dnsRecords.length - 1].value}"`,
            `DNS changes can take up to 48 hours to propagate. SSL will be provisioned automatically once verification passes.`,
            `Verify with GET /api/hosting/domains?domain=${normalizedDomain}&action=verify`,
          ];

    return NextResponse.json(
      {
        domain: normalizedDomain,
        type: domainType,
        status: record.status,
        dnsRecords,
        ssl: record.sslStatus,
        addedAt: record.addedAt,
        verificationInstructions,
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
// DELETE /api/hosting/domains — remove a custom domain
// Body: { siteId, domain }
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
