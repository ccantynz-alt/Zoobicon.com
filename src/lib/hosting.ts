// ---------------------------------------------------------------------------
// Zoobicon Hosting – Data types & helpers
// ---------------------------------------------------------------------------

/* -------------------------------- Types --------------------------------- */

export interface Site {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: "free" | "pro" | "business" | "enterprise";
  status: "active" | "suspended" | "deploying" | "error";
  url: string;
  createdAt: string;
  updatedAt: string;
  settings: Record<string, unknown>;
}

export interface Deployment {
  id: string;
  siteId: string;
  environment: "production" | "staging" | "preview";
  status: "building" | "deploying" | "live" | "failed" | "rolled-back";
  url: string;
  code: string;
  size: number;
  createdAt: string;
  commitMessage?: string;
}

export interface CustomDomain {
  id: string;
  siteId: string;
  domain: string;
  status: "pending" | "active" | "error" | "removing";
  sslStatus: "pending" | "provisioning" | "active" | "expired" | "error";
  dnsRecords: DnsRecord[];
  createdAt: string;
}

export interface DnsRecord {
  id: string;
  domain: string;
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA";
  name: string;
  value: string;
  ttl: number;
  priority?: number;
  proxied: boolean;
}

export interface SslCertificate {
  domain: string;
  status: "pending" | "active" | "expired" | "error";
  issuer: string;
  expiresAt: string;
  type: "lets-encrypt" | "custom" | "managed";
  autoRenew: boolean;
}

export interface CdnConfig {
  siteId: string;
  cacheEverything: boolean;
  minify: { html: boolean; css: boolean; js: boolean };
  compression: "gzip" | "brotli" | "none";
  edgeCaching: boolean;
  smartRouting: boolean;
  imageOptimization: boolean;
}

export interface SiteAnalytics {
  visitors: { total: number; unique: number; returning: number };
  pageViews: { total: number; perPage: Record<string, number> };
  bandwidth: { used: number; limit: number };
  performance: { ttfb: number; fcp: number; lcp: number; cls: number };
  geographic: { country: string; visitors: number }[];
  referrers: { source: string; visits: number }[];
  devices: { type: string; percentage: number }[];
  statusCodes: { code: number; count: number }[];
}

export interface HostingPlan {
  id: string;
  name: string;
  price: number;
  sites: number;
  storage: number;       // bytes
  bandwidth: number;     // bytes per month
  features: string[];
}

/* ------------------------------ Constants ------------------------------- */

export const HOSTING_PLANS: HostingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    sites: 1,
    storage: 500 * 1024 * 1024,          // 500 MB
    bandwidth: 1 * 1024 * 1024 * 1024,   // 1 GB
    features: [
      "1 site",
      "500 MB storage",
      "1 GB bandwidth",
      "Zoobicon subdomain",
      "Automatic HTTPS",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    sites: 10,
    storage: 10 * 1024 * 1024 * 1024,    // 10 GB
    bandwidth: 100 * 1024 * 1024 * 1024,  // 100 GB
    features: [
      "10 sites",
      "10 GB storage",
      "100 GB bandwidth",
      "Custom domains",
      "Automatic HTTPS",
      "Edge caching",
      "Priority support",
      "Deploy previews",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 49,
    sites: 50,
    storage: 50 * 1024 * 1024 * 1024,     // 50 GB
    bandwidth: 500 * 1024 * 1024 * 1024,   // 500 GB
    features: [
      "50 sites",
      "50 GB storage",
      "500 GB bandwidth",
      "Custom domains",
      "Automatic HTTPS",
      "Edge caching & smart routing",
      "Image optimization",
      "Advanced analytics",
      "Team collaboration",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 149,
    sites: -1, // unlimited
    storage: 500 * 1024 * 1024 * 1024,      // 500 GB
    bandwidth: 5 * 1024 * 1024 * 1024 * 1024, // 5 TB
    features: [
      "Unlimited sites",
      "500 GB storage",
      "5 TB bandwidth",
      "Custom domains",
      "Automatic HTTPS",
      "Edge caching & smart routing",
      "Image optimization",
      "Advanced analytics",
      "Team collaboration",
      "Dedicated support & SLA",
      "SSO / SAML",
      "Audit logs",
    ],
  },
];

/* ------------------------------- Helpers -------------------------------- */

/** Convert a human-readable name into a URL-safe slug. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Format a byte count into a human-readable string (e.g. 1.5 GB). */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

/** Format an uptime percentage (e.g. 99.95 → "99.95%"). */
export function formatUptime(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

/** Return a Tailwind color class string based on a generic status value. */
export function getStatusColor(status: string): string {
  switch (status) {
    case "active":
    case "live":
    case "healthy":
    case "provisioned":
      return "text-emerald-400";
    case "building":
    case "deploying":
    case "provisioning":
    case "pending":
      return "text-amber-400";
    case "error":
    case "failed":
    case "expired":
    case "suspended":
      return "text-red-400";
    case "rolled-back":
    case "removing":
      return "text-orange-400";
    default:
      return "text-gray-400";
  }
}

/** Calculate how much of a bandwidth (or storage) quota has been used. */
export function calculateBandwidthPercentage(
  used: number,
  limit: number,
): number {
  if (limit <= 0) return 0;
  return Math.min(100, (used / limit) * 100);
}
