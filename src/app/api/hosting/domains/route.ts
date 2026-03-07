import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// In-memory storage — would be backed by a database in production.
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
  createdAt: string;
  verifiedAt: string | null;
}

const domainRecords = new Map<string, DomainRecord>();

/** Expose store for sibling routes. */
// Internal storage — not exported

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DOMAIN_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const SITE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

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

    // --- Validation -----------------------------------------------------------
    if (!siteId || !SITE_ID_RE.test(siteId)) {
      return NextResponse.json(
        { error: "A valid siteId is required (alphanumeric with hyphens)." },
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

    if (domainRecords.has(normalizedDomain)) {
      const existing = domainRecords.get(normalizedDomain)!;
      if (existing.status !== "deleted") {
        return NextResponse.json(
          { error: `Domain "${normalizedDomain}" is already registered.` },
          { status: 409 }
        );
      }
    }

    // --- Generate DNS records the user needs to configure ----------------------
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

    const record: DomainRecord = {
      id: randomUUID(),
      domain: normalizedDomain,
      siteId,
      status: "pending_verification",
      sslStatus: "pending",
      dnsRecords,
      createdAt: new Date().toISOString(),
      verifiedAt: null,
    };

    domainRecords.set(normalizedDomain, record);

    return NextResponse.json(
      {
        domain: normalizedDomain,
        status: record.status,
        dnsRecords,
        sslStatus: record.sslStatus,
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

    const result = Array.from(domainRecords.values()).filter(
      (d) => d.siteId === siteId && d.status !== "deleted"
    );

    return NextResponse.json({ domains: result, count: result.length });
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
    const record = domainRecords.get(normalizedDomain);

    if (!record || record.status === "deleted") {
      return NextResponse.json(
        { error: "Domain not found." },
        { status: 404 }
      );
    }

    if (record.siteId !== siteId) {
      return NextResponse.json(
        { error: "Domain does not belong to the specified site." },
        { status: 403 }
      );
    }

    record.status = "deleted";
    domainRecords.set(normalizedDomain, record);

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
