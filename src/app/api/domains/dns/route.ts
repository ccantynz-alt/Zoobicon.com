import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// DNS Record Management
// GET  /api/domains/dns?domain=example.com  — List DNS records
// POST /api/domains/dns                     — Create DNS record
// DELETE /api/domains/dns                   — Delete DNS record
// ---------------------------------------------------------------------------

interface DnsRecord {
  id: string;
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA";
  name: string;
  value: string;
  ttl: number;
  priority?: number; // For MX and SRV records
  createdAt: string;
  updatedAt: string;
}

// In-memory store: domain -> DNS records
const dnsStore = new Map<string, DnsRecord[]>();

/**
 * Generate default DNS records for a newly queried domain.
 * These simulate what a freshly registered domain on Zoobicon would have.
 */
function getDefaultRecords(domain: string): DnsRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: randomUUID(),
      type: "A",
      name: "@",
      value: "76.76.21.21", // Vercel-style IP
      ttl: 3600,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      type: "A",
      name: "www",
      value: "76.76.21.21",
      ttl: 3600,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      type: "CNAME",
      name: "www",
      value: `${domain}.`,
      ttl: 3600,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      type: "MX",
      name: "@",
      value: "mx1.zoobicon.io",
      ttl: 3600,
      priority: 10,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      type: "MX",
      name: "@",
      value: "mx2.zoobicon.io",
      ttl: 3600,
      priority: 20,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      type: "TXT",
      name: "@",
      value: "v=spf1 include:_spf.zoobicon.io ~all",
      ttl: 3600,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      type: "NS",
      name: "@",
      value: "ns1.zoobicon.io",
      ttl: 86400,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      type: "NS",
      name: "@",
      value: "ns2.zoobicon.io",
      ttl: 86400,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Get records for a domain, initializing with defaults if first access.
 */
function getRecords(domain: string): DnsRecord[] {
  const normalized = domain.toLowerCase().trim();
  if (!dnsStore.has(normalized)) {
    dnsStore.set(normalized, getDefaultRecords(normalized));
  }
  return dnsStore.get(normalized)!;
}

// Valid record types
const VALID_TYPES = new Set(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA"]);

// Valid TTL values (in seconds)
const VALID_TTLS = [60, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 43200, 86400];

/**
 * Validate an IP address (v4).
 */
function isValidIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const num = Number(p);
    return !isNaN(num) && num >= 0 && num <= 255 && String(num) === p;
  });
}

/**
 * Validate an IPv6 address (basic check).
 */
function isValidIPv6(ip: string): boolean {
  return /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip) ||
    /^(([0-9a-fA-F]{1,4}:)*)?::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/.test(ip) ||
    ip === "::1" || ip === "::";
}

/**
 * Validate a hostname/domain.
 */
function isValidHostname(name: string): boolean {
  if (name === "@" || name === "*") return true;
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.?$/.test(name);
}

// ---------------------------------------------------------------------------
// GET /api/domains/dns?domain=example.com
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const domain = req.nextUrl.searchParams.get("domain");

    if (!domain || domain.trim().length < 3) {
      return NextResponse.json(
        { error: "domain query parameter is required." },
        { status: 400 }
      );
    }

    const normalized = domain.toLowerCase().trim();
    const records = getRecords(normalized);

    return NextResponse.json({
      domain: normalized,
      records,
      count: records.length,
      nameservers: ["ns1.zoobicon.io", "ns2.zoobicon.io"],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/domains/dns — Create a DNS record
// Body: { domain, type, name, value, ttl, priority? }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, type, name, value, ttl, priority } = body as {
      domain?: string;
      type?: string;
      name?: string;
      value?: string;
      ttl?: number;
      priority?: number;
    };

    // --- Validation ---
    if (!domain || domain.trim().length < 3) {
      return NextResponse.json(
        { error: "domain is required." },
        { status: 400 }
      );
    }

    if (!type || !VALID_TYPES.has(type.toUpperCase())) {
      return NextResponse.json(
        { error: `type must be one of: ${Array.from(VALID_TYPES).join(", ")}` },
        { status: 400 }
      );
    }

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "name is required (use '@' for root domain)." },
        { status: 400 }
      );
    }

    if (!isValidHostname(name)) {
      return NextResponse.json(
        { error: "Invalid record name. Use '@' for root, or a valid subdomain." },
        { status: 400 }
      );
    }

    if (!value || value.trim() === "") {
      return NextResponse.json(
        { error: "value is required." },
        { status: 400 }
      );
    }

    // Type-specific value validation
    const upperType = type.toUpperCase();
    if (upperType === "A" && !isValidIPv4(value)) {
      return NextResponse.json(
        { error: "A record value must be a valid IPv4 address." },
        { status: 400 }
      );
    }

    if (upperType === "AAAA" && !isValidIPv6(value)) {
      return NextResponse.json(
        { error: "AAAA record value must be a valid IPv6 address." },
        { status: 400 }
      );
    }

    if (upperType === "CNAME" && !isValidHostname(value.replace(/\.$/, ""))) {
      return NextResponse.json(
        { error: "CNAME record value must be a valid hostname." },
        { status: 400 }
      );
    }

    if (upperType === "MX" && !isValidHostname(value.replace(/\.$/, ""))) {
      return NextResponse.json(
        { error: "MX record value must be a valid hostname." },
        { status: 400 }
      );
    }

    // TTL validation
    const recordTtl = ttl || 3600;
    if (!VALID_TTLS.includes(recordTtl) && recordTtl !== ttl) {
      // Allow custom TTL if explicitly set, but warn on non-standard values
    }
    if (recordTtl < 60 || recordTtl > 86400) {
      return NextResponse.json(
        { error: "TTL must be between 60 and 86400 seconds." },
        { status: 400 }
      );
    }

    // MX/SRV priority validation
    if ((upperType === "MX" || upperType === "SRV") && priority !== undefined) {
      if (priority < 0 || priority > 65535) {
        return NextResponse.json(
          { error: "Priority must be between 0 and 65535." },
          { status: 400 }
        );
      }
    }

    // --- Create record ---
    const normalized = domain.toLowerCase().trim();
    const records = getRecords(normalized);

    // Check for duplicate
    const isDuplicate = records.some(
      (r) =>
        r.type === upperType &&
        r.name === name.trim() &&
        r.value === value.trim()
    );

    if (isDuplicate) {
      return NextResponse.json(
        { error: "A record with the same type, name, and value already exists." },
        { status: 409 }
      );
    }

    // CNAME conflict check: can't have CNAME and other records for same name
    if (upperType === "CNAME") {
      const hasOther = records.some(
        (r) => r.name === name.trim() && r.type !== "CNAME"
      );
      if (hasOther) {
        return NextResponse.json(
          { error: "Cannot add CNAME record — other record types already exist for this name." },
          { status: 409 }
        );
      }
    } else {
      const hasCname = records.some(
        (r) => r.name === name.trim() && r.type === "CNAME"
      );
      if (hasCname) {
        return NextResponse.json(
          { error: "Cannot add record — a CNAME record already exists for this name." },
          { status: 409 }
        );
      }
    }

    const now = new Date().toISOString();
    const record: DnsRecord = {
      id: randomUUID(),
      type: upperType as DnsRecord["type"],
      name: name.trim(),
      value: value.trim(),
      ttl: recordTtl,
      ...(priority !== undefined && { priority }),
      createdAt: now,
      updatedAt: now,
    };

    records.push(record);
    dnsStore.set(normalized, records);

    return NextResponse.json(
      {
        record,
        message: `${upperType} record created for ${normalized}.`,
        totalRecords: records.length,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/domains/dns — Delete a DNS record
// Body: { domain, recordId }
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, recordId } = body as {
      domain?: string;
      recordId?: string;
    };

    if (!domain || domain.trim().length < 3) {
      return NextResponse.json(
        { error: "domain is required." },
        { status: 400 }
      );
    }

    if (!recordId) {
      return NextResponse.json(
        { error: "recordId is required." },
        { status: 400 }
      );
    }

    const normalized = domain.toLowerCase().trim();
    const records = getRecords(normalized);

    const recordIndex = records.findIndex((r) => r.id === recordId);
    if (recordIndex === -1) {
      return NextResponse.json(
        { error: "Record not found." },
        { status: 404 }
      );
    }

    const deletedRecord = records[recordIndex];

    // Prevent deleting NS records (nameservers are managed at registrar level)
    if (deletedRecord.type === "NS") {
      return NextResponse.json(
        { error: "Cannot delete NS records. Manage nameservers through your registrar settings." },
        { status: 403 }
      );
    }

    records.splice(recordIndex, 1);
    dnsStore.set(normalized, records);

    return NextResponse.json({
      deleted: deletedRecord,
      message: `${deletedRecord.type} record for "${deletedRecord.name}" deleted.`,
      remainingRecords: records.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
