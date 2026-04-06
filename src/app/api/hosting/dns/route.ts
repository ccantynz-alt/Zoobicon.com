import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getCloudflareConfig,
  createDnsRecord as cfCreateDnsRecord,
  deleteDnsRecord as cfDeleteDnsRecord,
  listDnsRecords as cfListDnsRecords,
} from "@/lib/cloudflare";

// ---------------------------------------------------------------------------
// Fallback: in-memory storage (last resort when DB + Cloudflare unavailable)
// ---------------------------------------------------------------------------
interface DnsRecord {
  id: string;
  domain: string;
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV";
  name: string;
  value: string;
  ttl: number;
  priority: number | null;
  proxied: boolean;
  createdAt: string;
  updatedAt: string;
}

const memoryRecords = new Map<string, DnsRecord>();

// ---------------------------------------------------------------------------
// Database helpers (graceful — returns null if DB unavailable)
// ---------------------------------------------------------------------------
async function getDb() {
  try {
    const { sql } = await import("@/lib/db");
    return sql;
  } catch {
    return null;
  }
}

async function dbListRecords(domain: string): Promise<DnsRecord[] | null> {
  const sql = await getDb();
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT id, domain, type, name, value, ttl, priority, proxied
      FROM dns_records WHERE domain = ${domain}
      ORDER BY type, name
    `;
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      domain: r.domain as string,
      type: r.type as DnsRecord["type"],
      name: r.name as string,
      value: r.value as string,
      ttl: (r.ttl as number) || 3600,
      priority: (r.priority as number) ?? null,
      proxied: (r.proxied as boolean) || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.error("[DNS] DB list failed:", err);
    return null;
  }
}

async function dbCreateRecord(record: DnsRecord): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await sql`
      INSERT INTO dns_records (id, domain, type, name, value, ttl, priority, proxied)
      VALUES (${record.id}, ${record.domain}, ${record.type}, ${record.name}, ${record.value}, ${record.ttl}, ${record.priority}, ${record.proxied})
    `;
    return true;
  } catch (err) {
    console.error("[DNS] DB create failed:", err);
    return false;
  }
}

async function dbDeleteRecord(recordId: string, domain: string): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    const result = await sql`
      DELETE FROM dns_records WHERE id = ${recordId} AND domain = ${domain}
    `;
    return (result as unknown[]).length >= 0;
  } catch (err) {
    console.error("[DNS] DB delete failed:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DOMAIN_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const VALID_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"] as const;
type RecordType = (typeof VALID_TYPES)[number];

const IPV4_RE =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const IPV6_RE = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;

function validateRecordValue(
  type: RecordType,
  value: string
): string | null {
  switch (type) {
    case "A":
      if (!IPV4_RE.test(value)) return "A record value must be a valid IPv4 address.";
      break;
    case "AAAA":
      if (!IPV6_RE.test(value))
        return "AAAA record value must be a valid IPv6 address.";
      break;
    case "CNAME":
      if (!DOMAIN_RE.test(value) && value !== "@")
        return "CNAME record value must be a valid domain.";
      break;
    case "MX":
      if (!DOMAIN_RE.test(value))
        return "MX record value must be a valid domain.";
      break;
    case "TXT":
      if (!value || value.trim().length === 0)
        return "TXT record value must not be empty.";
      break;
    case "NS":
      if (!DOMAIN_RE.test(value))
        return "NS record value must be a valid domain.";
      break;
    case "SRV":
      if (!value || value.trim().length === 0)
        return "SRV record value must not be empty.";
      break;
  }
  return null;
}

// ---------------------------------------------------------------------------
// GET /api/hosting/dns?domain=...
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

    // Strategy: Cloudflare -> Database -> In-memory
    const cfConfig = getCloudflareConfig();
    if (cfConfig) {
      const cfRecords = await cfListDnsRecords(cfConfig, normalizedDomain);
      if (cfRecords.length > 0) {
        const records = cfRecords.map((r) => ({
          id: r.id,
          domain: normalizedDomain,
          type: r.type,
          name: r.name,
          value: r.content,
          ttl: r.ttl,
          priority: r.priority ?? null,
          proxied: r.proxied,
          createdAt: r.created_on || new Date().toISOString(),
          updatedAt: r.modified_on || new Date().toISOString(),
        }));
        return NextResponse.json({ domain: normalizedDomain, records, count: records.length, source: "cloudflare" });
      }
    }

    // Try database
    const dbRecords = await dbListRecords(normalizedDomain);
    if (dbRecords !== null) {
      return NextResponse.json({ domain: normalizedDomain, records: dbRecords, count: dbRecords.length, source: "database" });
    }

    // Fallback: in-memory
    const records = Array.from(memoryRecords.values())
      .filter((r) => r.domain === normalizedDomain)
      .sort((a, b) => {
        const typeOrder = VALID_TYPES.indexOf(a.type) - VALID_TYPES.indexOf(b.type);
        if (typeOrder !== 0) return typeOrder;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({
      domain: normalizedDomain,
      records,
      count: records.length,
      source: "memory",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/hosting/dns — add a DNS record
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      domain,
      type,
      name,
      value,
      ttl = 3600,
      priority,
      proxied = false,
    } = body as {
      domain?: string;
      type?: string;
      name?: string;
      value?: string;
      ttl?: number;
      priority?: number;
      proxied?: boolean;
    };

    // --- Validation -----------------------------------------------------------
    if (!domain || !DOMAIN_RE.test(domain)) {
      return NextResponse.json(
        { error: "A valid domain is required." },
        { status: 400 }
      );
    }

    if (!type || !VALID_TYPES.includes(type as RecordType)) {
      return NextResponse.json(
        { error: `type must be one of: ${VALID_TYPES.join(", ")}.` },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "name is required (e.g. '@', 'www', 'mail')." },
        { status: 400 }
      );
    }

    if (!value || typeof value !== "string") {
      return NextResponse.json(
        { error: "value is required." },
        { status: 400 }
      );
    }

    const recordType = type as RecordType;
    const valueError = validateRecordValue(recordType, value);
    if (valueError) {
      return NextResponse.json({ error: valueError }, { status: 400 });
    }

    if (typeof ttl !== "number" || ttl < 60 || ttl > 86400) {
      return NextResponse.json(
        { error: "ttl must be a number between 60 and 86400 seconds." },
        { status: 400 }
      );
    }

    if (recordType === "MX" || recordType === "SRV") {
      if (priority !== undefined && (typeof priority !== "number" || priority < 0 || priority > 65535)) {
        return NextResponse.json(
          { error: "priority must be a number between 0 and 65535." },
          { status: 400 }
        );
      }
    }

    if (proxied && recordType !== "A" && recordType !== "AAAA" && recordType !== "CNAME") {
      return NextResponse.json(
        { error: "Only A, AAAA, and CNAME records can be proxied." },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase();
    const now = new Date().toISOString();

    // Strategy: Try Cloudflare first, then DB, then in-memory
    const cfConfig = getCloudflareConfig();
    if (cfConfig) {
      const cfResult = await cfCreateDnsRecord(cfConfig, {
        type: recordType,
        name: name.trim(),
        content: value,
        ttl,
        proxied: Boolean(proxied),
        ...(priority !== undefined ? { priority } : {}),
      });

      if (cfResult.success) {
        const record: DnsRecord = {
          id: cfResult.id,
          domain: normalizedDomain,
          type: recordType,
          name: name.trim(),
          value,
          ttl,
          priority: recordType === "MX" || recordType === "SRV" ? priority ?? 10 : null,
          proxied: Boolean(proxied),
          createdAt: now,
          updatedAt: now,
        };
        return NextResponse.json({ record, source: "cloudflare" }, { status: 201 });
      }
    }

    // Build the record
    const recordId = randomUUID();
    const record: DnsRecord = {
      id: recordId,
      domain: normalizedDomain,
      type: recordType,
      name: name.trim(),
      value,
      ttl,
      priority:
        recordType === "MX" || recordType === "SRV"
          ? priority ?? 10
          : null,
      proxied: Boolean(proxied),
      createdAt: now,
      updatedAt: now,
    };

    // Try database
    const dbSaved = await dbCreateRecord(record);
    if (dbSaved) {
      return NextResponse.json({ record, source: "database" }, { status: 201 });
    }

    // Fallback: in-memory
    memoryRecords.set(recordId, record);
    return NextResponse.json({ record, source: "memory" }, { status: 201 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/hosting/dns — remove a DNS record
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, recordId } = body as {
      domain?: string;
      recordId?: string;
    };

    if (!domain || !recordId) {
      return NextResponse.json(
        { error: "Both domain and recordId are required." },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase();

    // Strategy: Try Cloudflare first, then DB, then in-memory
    const cfConfig = getCloudflareConfig();
    if (cfConfig) {
      const deleted = await cfDeleteDnsRecord(cfConfig, recordId);
      if (deleted) {
        return NextResponse.json({
          message: `DNS record ${recordId} deleted via Cloudflare.`,
          recordId,
          source: "cloudflare",
        });
      }
    }

    // Try database
    const dbDeleted = await dbDeleteRecord(recordId, normalizedDomain);
    if (dbDeleted) {
      return NextResponse.json({
        message: `DNS record ${recordId} deleted from database.`,
        recordId,
        source: "database",
      });
    }

    // Fallback: in-memory
    const record = memoryRecords.get(recordId);
    if (!record) {
      return NextResponse.json(
        { error: "DNS record not found." },
        { status: 404 }
      );
    }

    if (record.domain !== normalizedDomain) {
      return NextResponse.json(
        { error: "Record does not belong to the specified domain." },
        { status: 403 }
      );
    }

    memoryRecords.delete(recordId);

    return NextResponse.json({
      message: `DNS record ${recordId} (${record.type} ${record.name}) deleted.`,
      recordId,
      source: "memory",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
