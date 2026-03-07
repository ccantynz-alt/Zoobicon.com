import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// In-memory storage — would be backed by a database in production.
// ---------------------------------------------------------------------------
export interface SslCertificate {
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

const sslCertificates = new Map<string, SslCertificate>();

export { sslCertificates };

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

    // --- Validation -----------------------------------------------------------
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

    // Check for existing active certificate
    const existing = sslCertificates.get(normalizedDomain);
    if (
      existing &&
      (existing.sslStatus === "active" ||
        existing.sslStatus === "provisioning")
    ) {
      return NextResponse.json(
        {
          error: `An SSL certificate is already ${existing.sslStatus} for "${normalizedDomain}".`,
          certificate: existing,
        },
        { status: 409 }
      );
    }

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

    sslCertificates.set(normalizedDomain, cert);

    return NextResponse.json(
      {
        domain: normalizedDomain,
        sslStatus: cert.sslStatus,
        issuer: cert.issuer,
        expiresAt: cert.expiresAt,
        type: cert.type,
        autoRenew: cert.autoRenew,
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
    const cert = sslCertificates.get(normalizedDomain);

    if (!cert) {
      return NextResponse.json(
        {
          error: `No SSL certificate found for "${normalizedDomain}".`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ certificate: cert });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
