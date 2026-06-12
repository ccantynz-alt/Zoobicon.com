/**
 * Vapron catalog client — surfaces Vapron's add-on inventory
 * inside Zoobicon's UI.
 *
 * Rule 34: "once Zoobicon is connected via API the Customer can go
 * shopping and add anything that they want from the Vapron website."
 * The customer never leaves zoobicon.com — they browse Vapron
 * add-ons inside the Zoobicon dashboard, check out via Zoobicon's
 * Stripe billing, and Vapron provisions the add-on via its API on
 * payment success.
 *
 * Two-mode design:
 *   Live mode  — CRONTECH_PAT is set. Fetches the real catalog from
 *                {CRONTECH_API_BASE}/api/v1/catalog. Used in production
 *                once Vapron ships the endpoint.
 *   Stub mode  — CRONTECH_PAT is unset (or fetch fails). Returns a
 *                hard-coded catalog with realistic add-ons reflecting
 *                what we expect Vapron to expose. Lets the marketplace
 *                UI ship + render + be reviewable before Vapron is
 *                live.
 *
 * Honesty: when in stub mode, the API response includes
 * { source: "stub" } so the UI can label the catalog as a preview.
 */

import { crontechAvailable } from "@/lib/crontech-sync";

const CRONTECH_API_BASE = process.env.VAPRON_API_BASE || process.env.CRONTECH_API_BASE || "https://api.crontech.ai";
const CRONTECH_PAT = process.env.VAPRON_PAT || process.env.CRONTECH_PAT || "";

export type AddOnCategory =
  | "domains"
  | "hosting"
  | "email"
  | "security"
  | "cdn"
  | "storage"
  | "backups"
  | "analytics";

export type BillingMode = "one_time" | "monthly" | "annual";

export interface AddOn {
  /** Stable identifier — used as Stripe metadata key on checkout */
  id: string;
  category: AddOnCategory;
  name: string;
  tagline: string;
  description: string;
  /** Price in USD cents */
  priceCents: number;
  billing: BillingMode;
  /** "Best for" line — surfaces in the card subhead */
  bestFor?: string;
  /** What the customer actually gets, three bullets max */
  features: string[];
  /** Pre-purchase requirements (e.g. "requires a connected project") */
  prerequisites?: string[];
  /** Featured add-ons render larger on the marketplace grid */
  featured?: boolean;
  /** Optional capacity figure (e.g. "10 GB" or "5 mailboxes") */
  capacity?: string;
}

export interface Catalog {
  source: "live" | "stub";
  fetchedAt: string;
  addOns: AddOn[];
  /** When true, prices shown are Zoobicon's best-guess placeholders
   *  pending Vapron's final pricing model. The UI surfaces a banner
   *  so customers + admins know not to treat these as commitments. */
  pricingProvisional: boolean;
}

// ────────────────────────────────────────────────────────────────────
// Stub catalog — what we expect Vapron to expose. Update as their
// real catalog lands; the rendering UI is shape-stable across both.
// ────────────────────────────────────────────────────────────────────

const STUB_CATALOG: AddOn[] = [
  // ── Domains ──────────────────────────────────────────────────
  {
    id: "domain-com-annual",
    category: "domains",
    name: "Extra .com domain",
    tagline: "Register an additional .com for your project",
    description:
      "Add another custom domain to a connected Zoobicon project. Registered via Vapron's registrar at deploy time; DNS auto-configures.",
    priceCents: 1499,
    billing: "annual",
    bestFor: "Brand variants, redirect domains, alt-spellings",
    features: ["Free WHOIS privacy", "Auto-DNS to your Vapron project", "1-year registration"],
    prerequisites: ["A connected Vapron project"],
    featured: true,
  },
  {
    id: "domain-premium-tld",
    category: "domains",
    name: "Premium TLD pack (.ai · .io · .app)",
    tagline: "Lock the matching premium TLDs before someone else does",
    description:
      "Register all three premium TLDs (.ai, .io, .app) in one purchase. Each forwards to your primary site or stands on its own.",
    priceCents: 14900,
    billing: "annual",
    features: [".ai .io .app — three TLDs", "1-year registration each", "Free 301 redirects"],
    prerequisites: ["A connected Vapron project"],
  },

  // ── Hosting ──────────────────────────────────────────────────
  {
    id: "hosting-pro",
    category: "hosting",
    name: "Hosting · Pro tier",
    tagline: "100 GB bandwidth, sub-100ms global edge, dedicated IP",
    description:
      "Upgrade your Vapron hosting from the default tier to Pro. Includes a dedicated IP, global edge cache, and 100 GB monthly bandwidth.",
    priceCents: 2900,
    billing: "monthly",
    bestFor: "Sites doing >10k visits/mo",
    features: ["100 GB monthly bandwidth", "Sub-100ms global edge", "Dedicated IPv4 + IPv6"],
    capacity: "100 GB / mo",
    featured: true,
  },
  {
    id: "hosting-business",
    category: "hosting",
    name: "Hosting · Business tier",
    tagline: "1 TB bandwidth, SLA, priority support",
    description:
      "Vapron Business hosting tier. 1 TB monthly bandwidth, 99.99% uptime SLA, priority human support, dedicated build queue.",
    priceCents: 9900,
    billing: "monthly",
    bestFor: "Sites doing >100k visits/mo or production-critical",
    features: ["1 TB monthly bandwidth", "99.99% uptime SLA", "Priority build queue"],
    capacity: "1 TB / mo",
  },

  // ── Email ────────────────────────────────────────────────────
  {
    id: "email-mailbox-pack-5",
    category: "email",
    name: "5 extra mailboxes",
    tagline: "Add 5 more custom-domain mailboxes",
    description:
      "Extra mailboxes on your Vapron-managed domain. Full IMAP/SMTP, spam filtering, web client, 25 GB per mailbox.",
    priceCents: 1900,
    billing: "monthly",
    features: ["5 mailboxes", "25 GB per mailbox", "Spam + virus filtering"],
    capacity: "5 mailboxes",
    prerequisites: ["A Vapron-registered domain"],
  },
  {
    id: "email-marketing",
    category: "email",
    name: "Marketing email · 10k sends",
    tagline: "Send up to 10,000 marketing emails per month",
    description:
      "Vapron's transactional + marketing email service. 10k monthly sends, deliverability monitoring, bounce + complaint handling, DMARC reports.",
    priceCents: 2900,
    billing: "monthly",
    features: ["10,000 sends per month", "Deliverability dashboard", "Auto-DKIM + SPF + DMARC"],
    capacity: "10,000 sends / mo",
  },

  // ── Security ─────────────────────────────────────────────────
  {
    id: "ssl-wildcard",
    category: "security",
    name: "Wildcard SSL",
    tagline: "Covers all subdomains under your custom domain",
    description:
      "Wildcard SSL certificate covering *.yourdomain.com. Auto-renewed, served from Vapron's edge.",
    priceCents: 4900,
    billing: "annual",
    features: ["Covers unlimited subdomains", "Auto-renewal", "Edge-served"],
    prerequisites: ["A Vapron-managed custom domain"],
  },
  {
    id: "ssl-ev",
    category: "security",
    name: "Extended Validation (EV) SSL",
    tagline: "Maximum trust signal for ecommerce + finance",
    description:
      "Extended Validation SSL — the green-bar / verified-business badge. Required for some high-trust verticals (banking, insurance, enterprise).",
    priceCents: 14900,
    billing: "annual",
    features: ["Verified-business badge", "Highest browser trust tier", "Phone + document verification"],
    prerequisites: ["A registered business with verifiable docs"],
  },
  {
    id: "ddos-pro",
    category: "security",
    name: "DDoS protection · Pro",
    tagline: "Layer 3-7 mitigation, no bandwidth cap",
    description:
      "Vapron's premium DDoS shield. Layer 3 + 4 + 7 mitigation, no surge bandwidth cap, 24/7 monitoring with auto-response.",
    priceCents: 4900,
    billing: "monthly",
    features: ["L3-L7 mitigation", "No bandwidth surge cap", "24/7 auto-response"],
  },

  // ── CDN ──────────────────────────────────────────────────────
  {
    id: "cdn-dedicated-regions",
    category: "cdn",
    name: "Extra CDN regions (5)",
    tagline: "Add 5 dedicated edge regions to your hosting",
    description:
      "Pin your site at 5 additional Vapron edge regions (e.g. Tokyo, Mumbai, São Paulo, Cape Town, Sydney). Reduces latency for global audiences.",
    priceCents: 1900,
    billing: "monthly",
    features: ["5 additional edge regions", "Choose any from Vapron's 40+ POPs", "Sub-50ms regional latency"],
    capacity: "5 regions",
  },

  // ── Storage ──────────────────────────────────────────────────
  {
    id: "storage-100gb",
    category: "storage",
    name: "100 GB object storage",
    tagline: "S3-compatible storage for site assets",
    description:
      "Vapron-managed object storage for images, video, downloads. S3-compatible API, free egress to your own Vapron-hosted sites.",
    priceCents: 990,
    billing: "monthly",
    features: ["100 GB capacity", "S3-compatible API", "Free egress to Vapron hosting"],
    capacity: "100 GB",
  },
  {
    id: "storage-1tb",
    category: "storage",
    name: "1 TB object storage",
    tagline: "Bigger storage tier for media-heavy sites",
    description:
      "Same as the 100 GB tier, scaled to 1 TB. Ideal for video portfolios, photography sites, and downloadable products.",
    priceCents: 4900,
    billing: "monthly",
    features: ["1 TB capacity", "S3-compatible API", "Free egress to Vapron hosting"],
    capacity: "1 TB",
  },

  // ── Backups ──────────────────────────────────────────────────
  {
    id: "backups-30day",
    category: "backups",
    name: "30-day point-in-time backups",
    tagline: "Daily backups with 30-day retention",
    description:
      "Vapron-managed automated backups of your site + database. Daily snapshots, 30-day retention, one-click restore to any point.",
    priceCents: 990,
    billing: "monthly",
    features: ["Daily automated snapshots", "30-day retention", "One-click restore"],
  },

  // ── Analytics ────────────────────────────────────────────────
  {
    id: "analytics-pro",
    category: "analytics",
    name: "Privacy-first analytics",
    tagline: "Cookie-free analytics with country + device breakdowns",
    description:
      "Vapron's bundled analytics (Plausible-style). No cookies, GDPR-friendly, no consent banner needed. Country + device + referrer breakdowns.",
    priceCents: 990,
    billing: "monthly",
    features: ["No cookies, no consent banner", "Per-site dashboards", "Goal + funnel tracking"],
  },
];

// ────────────────────────────────────────────────────────────────────
// Catalog fetcher — live mode hits Vapron, stub mode returns above.
// ────────────────────────────────────────────────────────────────────

export async function getVapronCatalog(): Promise<Catalog> {
  // Stub-mode helper — used in three places below so it stays consistent.
  // pricingProvisional: true is the honest signal that these prices are
  // Zoobicon's best guess, NOT Vapron's final pricing (which Craig is
  // still working through).
  const stubCatalog = (): Catalog => ({
    source: "stub",
    fetchedAt: new Date().toISOString(),
    addOns: STUB_CATALOG,
    pricingProvisional: true,
  });

  if (!crontechAvailable() || !CRONTECH_PAT) {
    return stubCatalog();
  }

  try {
    const res = await fetch(`${CRONTECH_API_BASE}/api/v1/catalog`, {
      headers: {
        Authorization: `Bearer ${CRONTECH_PAT}`,
        Accept: "application/json",
        "X-Vapron-Source": "zoobicon-marketplace",
      },
      signal: AbortSignal.timeout(8000),
      // Catalog can be cached at the edge for a minute — add-ons don't
      // change every second and this saves Vapron API quota.
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      // Live mode failed — fall back to stub rather than blank-screen.
      return stubCatalog();
    }
    const data = (await res.json()) as {
      addOns?: AddOn[];
      pricingProvisional?: boolean;
    };
    return {
      source: "live",
      fetchedAt: new Date().toISOString(),
      addOns: data.addOns || [],
      // Vapron may flag its own catalog as still provisional (e.g.
      // during a beta period) — honour that flag if set.
      pricingProvisional: Boolean(data.pricingProvisional),
    };
  } catch {
    return stubCatalog();
  }
}

export function getAddOn(catalog: Catalog, id: string): AddOn | undefined {
  return catalog.addOns.find((a) => a.id === id);
}

export const CATEGORY_LABELS: Record<AddOnCategory, string> = {
  domains: "Domains",
  hosting: "Hosting",
  email: "Email",
  security: "Security + SSL",
  cdn: "CDN",
  storage: "Storage",
  backups: "Backups",
  analytics: "Analytics",
};

export const CATEGORY_ORDER: AddOnCategory[] = [
  "domains",
  "hosting",
  "email",
  "security",
  "cdn",
  "storage",
  "backups",
  "analytics",
];

export function formatPrice(addOn: AddOn): string {
  const dollars = (addOn.priceCents / 100).toFixed(addOn.priceCents % 100 === 0 ? 0 : 2);
  const suffix =
    addOn.billing === "monthly" ? "/mo" : addOn.billing === "annual" ? "/yr" : " one-time";
  return `$${dollars}${suffix}`;
}
