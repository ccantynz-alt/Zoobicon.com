import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// In-memory storage — would be backed by a DNS zone database (e.g. PowerDNS,
// Route 53 API) in production.
// ---------------------------------------------------------------------------
export interface DnsRecord {
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

const dnsRecords = new Map<string, DnsRecord>();

export { dnsRecords };

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
      // SRV records have a complex format; we do a basic length check.
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

    const records = Array.from(dnsRecords.values())
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

    // Only A and AAAA records can be proxied
    if (proxied && recordType !== "A" && recordType !== "AAAA" && recordType !== "CNAME") {
      return NextResponse.json(
        { error: "Only A, AAAA, and CNAME records can be proxied." },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase();
    const now = new Date().toISOString();
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

    dnsRecords.set(recordId, record);

    return NextResponse.json({ record }, { status: 201 });
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

    const record = dnsRecords.get(recordId);

    if (!record) {
      return NextResponse.json(
        { error: "DNS record not found." },
        { status: 404 }
      );
    }

    if (record.domain !== domain.toLowerCase()) {
      return NextResponse.json(
        { error: "Record does not belong to the specified domain." },
        { status: 403 }
      );
    }

    dnsRecords.delete(recordId);

    return NextResponse.json({
      message: `DNS record ${recordId} (${record.type} ${record.name}) deleted.`,
      recordId,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
