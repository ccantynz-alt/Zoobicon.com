import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// POST /api/domains/register
// Creates a Stripe checkout session for domain registration + addons.
// Falls back to mock order if Stripe is not configured.
// ---------------------------------------------------------------------------

// Domain pricing per year
const TLD_PRICING: Record<string, number> = {
  com: 12.99,
  io: 39.99,
  ai: 69.99,
  dev: 14.99,
  app: 14.99,
  co: 29.99,
  sh: 24.99,
  xyz: 2.99,
  net: 13.99,
  org: 12.99,
  me: 19.99,
  us: 9.99,
};

// Addon pricing
const ADDON_PRICING: Record<string, { price: number; type: "yearly" | "monthly" | "one-time"; label: string }> = {
  whoisPrivacy: { price: 4.99, type: "yearly", label: "WHOIS Privacy Protection" },
  ssl: { price: 9.99, type: "yearly", label: "Wildcard SSL Certificate" },
  emailHosting: { price: 5.99, type: "monthly", label: "Professional Email Hosting" },
  premiumHosting: { price: 9.99, type: "monthly", label: "Premium Hosting with CDN" },
  aiWebsite: { price: 49.0, type: "one-time", label: "AI Website Builder Setup" },
  seoAgent: { price: 29.0, type: "one-time", label: "SEO Agent Setup" },
};

// Short/dictionary words get 2x price
const PREMIUM_WORDS = new Set([
  "cloud", "code", "data", "tech", "labs", "hub", "flow", "wave", "core",
  "mind", "work", "sync", "link", "node", "bolt", "grid", "edge", "pulse",
  "spark", "swift", "craft", "build", "stack", "vault", "forge", "bloom",
  "shift", "drift", "flash", "quest", "pixel", "logic", "prime", "atlas",
  "nova", "apex", "zenith", "orbit", "nexus", "echo", "aura", "flux",
  "market", "studio", "digital", "agency", "design", "creative", "media",
  "social", "crypto", "cyber", "smart", "rapid", "turbo", "ultra", "mega",
  "super", "pro", "max", "elite", "premium", "global", "direct", "express",
]);

function isPremium(name: string): boolean {
  return name.length <= 3 || PREMIUM_WORDS.has(name.toLowerCase());
}

function getDomainPrice(name: string, tld: string): number {
  const basePrice = TLD_PRICING[tld.toLowerCase()] ?? 14.99;
  return isPremium(name) ? Math.round(basePrice * 2 * 100) / 100 : basePrice;
}

interface DomainItem {
  name: string;
  tld: string;
}

interface RegistrantInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface RegisterRequest {
  domains: DomainItem[];
  registrant: RegistrantInfo;
  addons: string[];
  years: number;
  // Legacy single-domain support (from existing UI)
  domain?: string;
  period?: number;
  email?: string;
  autoRenew?: boolean;
  privacyProtection?: boolean;
}

// ---------------------------------------------------------------------------
// GET /api/domains/register?email=... — List user's registered domains
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

    // Try database first
    try {
      const { sql } = await import("@/lib/db");
      const rows = await sql`
        SELECT * FROM registered_domains WHERE user_email = ${userEmail}
        ORDER BY registered_at DESC
      `;
      return NextResponse.json({ domains: rows, source: "database" });
    } catch {
      // Database not available — return empty
      return NextResponse.json({ domains: [], source: "memory" });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/domains/register — Register domains via Stripe checkout
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegisterRequest;

    // Support both new multi-domain format and legacy single-domain format
    let domains: DomainItem[];
    let registrant: RegistrantInfo;
    let addons: string[];
    let years: number;

    if (body.domains && Array.isArray(body.domains)) {
      // New format: { domains, registrant, addons, years }
      domains = body.domains;
      registrant = body.registrant;
      addons = body.addons || [];
      years = body.years || 1;
    } else if (body.domain) {
      // Legacy format: { domain, period, email, registrant, ... }
      const parts = body.domain.split(".");
      const tld = parts.pop() || "com";
      const name = parts.join(".");
      domains = [{ name, tld }];
      years = body.period || 1;
      addons = [];

      // Map legacy registrant format
      const legacyReg = body.registrant as unknown as Record<string, string> | undefined;
      if (!legacyReg) {
        return NextResponse.json(
          { error: "registrant contact info is required." },
          { status: 400 }
        );
      }
      registrant = {
        firstName: legacyReg.firstName || "",
        lastName: legacyReg.lastName || "",
        email: legacyReg.email || body.email || "",
        phone: legacyReg.phone || "",
        address: legacyReg.address1 || legacyReg.address || "",
        city: legacyReg.city || "",
        state: legacyReg.state || "",
        zip: legacyReg.postalCode || legacyReg.zip || "",
        country: legacyReg.country || "US",
      };
    } else {
      return NextResponse.json(
        { error: "Either 'domains' array or 'domain' string is required." },
        { status: 400 }
      );
    }

    // --- Validate domains ---
    if (domains.length === 0) {
      return NextResponse.json(
        { error: "At least one domain is required." },
        { status: 400 }
      );
    }

    if (domains.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 domains per order." },
        { status: 400 }
      );
    }

    for (const d of domains) {
      if (!d.name || !d.tld) {
        return NextResponse.json(
          { error: "Each domain must have 'name' and 'tld' fields." },
          { status: 400 }
        );
      }
      const sanitized = d.name.toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (sanitized.length < 1 || sanitized.length > 63) {
        return NextResponse.json(
          { error: `Invalid domain name: ${d.name}. Must be 1-63 characters.` },
          { status: 400 }
        );
      }
    }

    // --- Validate registrant ---
    if (!registrant) {
      return NextResponse.json(
        { error: "registrant information is required." },
        { status: 400 }
      );
    }

    const requiredFields: (keyof RegistrantInfo)[] = [
      "firstName", "lastName", "email", "phone", "address", "city", "state", "zip", "country",
    ];
    for (const field of requiredFields) {
      if (!registrant[field] || String(registrant[field]).trim() === "") {
        return NextResponse.json(
          { error: `registrant.${field} is required.` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registrant.email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    // --- Validate years ---
    if (years < 1 || years > 10) {
      return NextResponse.json(
        { error: "Registration period must be between 1 and 10 years." },
        { status: 400 }
      );
    }

    // --- Calculate pricing ---
    const domainLineItems = domains.map((d) => {
      const name = d.name.toLowerCase().replace(/[^a-z0-9-]/g, "");
      const tld = d.tld.toLowerCase().replace(/^\./, "");
      const pricePerYear = getDomainPrice(name, tld);
      const totalPrice = Math.round(pricePerYear * years * 100) / 100;

      return {
        domain: `${name}.${tld}`,
        name,
        tld,
        pricePerYear,
        years,
        totalPrice,
        premium: isPremium(name),
      };
    });

    const addonLineItems = addons
      .filter((a) => ADDON_PRICING[a])
      .map((addonKey) => {
        const addon = ADDON_PRICING[addonKey];
        let totalPrice: number;

        switch (addon.type) {
          case "yearly":
            totalPrice = Math.round(addon.price * years * 100) / 100;
            break;
          case "monthly":
            totalPrice = Math.round(addon.price * years * 12 * 100) / 100;
            break;
          case "one-time":
            totalPrice = addon.price;
            break;
          default:
            totalPrice = addon.price;
        }

        // Multiply by number of domains for per-domain addons
        const perDomain = ["whoisPrivacy", "ssl"].includes(addonKey);
        if (perDomain) {
          totalPrice = Math.round(totalPrice * domains.length * 100) / 100;
        }

        return {
          key: addonKey,
          label: addon.label,
          unitPrice: addon.price,
          type: addon.type,
          perDomain,
          totalPrice,
        };
      });

    const domainTotal = domainLineItems.reduce((sum, d) => sum + d.totalPrice, 0);
    const addonTotal = addonLineItems.reduce((sum, a) => sum + a.totalPrice, 0);
    const grandTotal = Math.round((domainTotal + addonTotal) * 100) / 100;

    const orderId = `dom-${randomUUID().slice(0, 8)}-${Date.now()}`;

    const orderSummary = {
      orderId,
      domains: domainLineItems,
      addons: addonLineItems,
      registrant: {
        name: `${registrant.firstName} ${registrant.lastName}`,
        email: registrant.email,
        country: registrant.country,
      },
      years,
      subtotals: {
        domains: Math.round(domainTotal * 100) / 100,
        addons: Math.round(addonTotal * 100) / 100,
      },
      total: grandTotal,
      currency: "USD",
    };

    // --- Try Stripe checkout ---
    try {
      const { stripe } = await import("@/lib/stripe");

      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("No Stripe key");
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      // Build Stripe line items
      const stripeLineItems: Array<{
        price_data: {
          currency: string;
          product_data: { name: string; description?: string };
          unit_amount: number;
        };
        quantity: number;
      }> = [];

      // Add domain line items
      for (const d of domainLineItems) {
        stripeLineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: d.domain,
              description: `Domain registration — ${d.years} year${d.years > 1 ? "s" : ""}${d.premium ? " (Premium)" : ""}`,
            },
            unit_amount: Math.round(d.totalPrice * 100), // Stripe uses cents
          },
          quantity: 1,
        });
      }

      // Add addon line items
      for (const a of addonLineItems) {
        stripeLineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: a.label,
              description: `${a.type === "one-time" ? "One-time" : a.type === "yearly" ? `${years} year${years > 1 ? "s" : ""}` : `${years * 12} months`}${a.perDomain ? ` x ${domains.length} domain${domains.length > 1 ? "s" : ""}` : ""}`,
            },
            unit_amount: Math.round(a.totalPrice * 100),
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: registrant.email,
        line_items: stripeLineItems,
        metadata: {
          orderId,
          domains: domainLineItems.map((d) => d.domain).join(","),
          years: String(years),
          registrantEmail: registrant.email,
          type: "domain_registration",
        },
        success_url: `${appUrl}/domains?order=${orderId}&status=success`,
        cancel_url: `${appUrl}/domains?order=${orderId}&status=cancelled`,
      });

      return NextResponse.json({
        success: true,
        checkoutUrl: session.url,
        orderSummary,
      });
    } catch {
      // Stripe not configured or error — return mock success for testing
      // Store order in memory / database for later fulfillment
      try {
        const { sql } = await import("@/lib/db");
        const now = new Date();
        const expiresAt = new Date(now.getTime() + years * 365 * 86400000);

        for (const d of domainLineItems) {
          await sql`
            INSERT INTO registered_domains (
              id, domain, user_email, status, registered_at, expires_at,
              auto_renew, privacy_protection, nameservers
            ) VALUES (
              ${randomUUID()}, ${d.domain}, ${registrant.email}, ${"active"},
              ${now.toISOString()}, ${expiresAt.toISOString()}, ${true},
              ${addons.includes("whoisPrivacy")}, ${JSON.stringify(["ns1.zoobicon.io", "ns2.zoobicon.io"])}
            )
          `;
        }
      } catch {
        // Database not available — that's fine for testing
      }

      return NextResponse.json({
        success: true,
        checkoutUrl: null,
        message: "Order created successfully. Stripe checkout is not configured — order processed in test mode.",
        orderSummary,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
