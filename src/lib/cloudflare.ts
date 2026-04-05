// ---------------------------------------------------------------------------
// Cloudflare API Integration Layer
// Uses env vars: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID, CLOUDFLARE_ACCOUNT_ID
// ---------------------------------------------------------------------------

export interface CloudflareConfig {
  apiToken: string;
  zoneId: string;
  accountId?: string;
}

export interface DnsRecord {
  id: string;
  type: "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "NS" | "SRV";
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  priority?: number;
  created_on?: string;
  modified_on?: string;
}

interface CloudflareApiResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: T;
}

const CF_BASE = "https://api.cloudflare.com/client/v4";

// ---------------------------------------------------------------------------
// Helper: get config from environment
// ---------------------------------------------------------------------------
export function getCloudflareConfig(): CloudflareConfig | null {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!apiToken || !zoneId) {
    return null;
  }

  return {
    apiToken,
    zoneId,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  };
}

// ---------------------------------------------------------------------------
// Internal fetch wrapper
// ---------------------------------------------------------------------------
async function cfFetch<T>(
  config: CloudflareConfig,
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const res = await fetch(`${CF_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
      },
    });

    const data = (await res.json()) as CloudflareApiResponse<T>;

    if (!data.success) {
      const errMsg = data.errors?.map((e) => e.message).join(", ") || "Unknown Cloudflare error";
      console.error(`[Cloudflare] API error: ${errMsg}`);
      return null;
    }

    return data.result;
  } catch (err) {
    console.error("[Cloudflare] Request failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// DNS Management
// ---------------------------------------------------------------------------

export async function createDnsRecord(
  config: CloudflareConfig,
  record: {
    type: "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "NS" | "SRV";
    name: string;
    content: string;
    ttl?: number;
    proxied?: boolean;
    priority?: number;
  }
): Promise<{ id: string; success: boolean }> {
  const result = await cfFetch<DnsRecord>(
    config,
    `/zones/${config.zoneId}/dns_records`,
    {
      method: "POST",
      body: JSON.stringify({
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl ?? 1, // 1 = automatic
        proxied: record.proxied ?? false,
        ...(record.priority !== undefined ? { priority: record.priority } : {}),
      }),
    }
  );

  if (!result) {
    return { id: "", success: false };
  }

  return { id: result.id, success: true };
}

export async function deleteDnsRecord(
  config: CloudflareConfig,
  recordId: string
): Promise<boolean> {
  const result = await cfFetch<{ id: string }>(
    config,
    `/zones/${config.zoneId}/dns_records/${recordId}`,
    { method: "DELETE" }
  );

  return result !== null;
}

export async function listDnsRecords(
  config: CloudflareConfig,
  domain?: string
): Promise<DnsRecord[]> {
  const params = new URLSearchParams({ per_page: "100" });
  if (domain) {
    params.set("name", domain);
  }

  const result = await cfFetch<DnsRecord[]>(
    config,
    `/zones/${config.zoneId}/dns_records?${params.toString()}`
  );

  return result ?? [];
}

// ---------------------------------------------------------------------------
// SSL Management
// ---------------------------------------------------------------------------

interface SslSettings {
  value: string; // "off" | "flexible" | "full" | "strict"
}

export async function provisionSsl(
  config: CloudflareConfig,
  _hostname: string
): Promise<{ status: string }> {
  // Cloudflare automatically provisions SSL for proxied records.
  // For custom hostnames, SSL is provisioned via the custom hostname API.
  // Here we ensure the zone SSL setting is "full" (strict).
  const result = await cfFetch<SslSettings>(
    config,
    `/zones/${config.zoneId}/settings/ssl`,
    {
      method: "PATCH",
      body: JSON.stringify({ value: "full" }),
    }
  );

  if (!result) {
    return { status: "failed" };
  }

  return { status: "provisioning" };
}

export async function getSslStatus(
  config: CloudflareConfig,
  _hostname: string
): Promise<{ status: string; certificate?: object }> {
  // Check zone SSL verification status
  const result = await cfFetch<{
    status: string;
    certificate_status?: string;
    certificates?: object[];
  }>(config, `/zones/${config.zoneId}/ssl/verification`);

  if (!result) {
    return { status: "unknown" };
  }

  return {
    status: result.certificate_status || result.status || "unknown",
    certificate: result.certificates?.[0],
  };
}

// ---------------------------------------------------------------------------
// CDN Cache Management
// ---------------------------------------------------------------------------

export async function purgeCache(
  config: CloudflareConfig,
  paths?: string[]
): Promise<boolean> {
  const body = paths?.length
    ? { files: paths }
    : { purge_everything: true };

  const result = await cfFetch<{ id: string }>(
    config,
    `/zones/${config.zoneId}/purge_cache`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return result !== null;
}

// ---------------------------------------------------------------------------
// Custom Hostname Management (for client domains pointing to zoobicon.sh)
// ---------------------------------------------------------------------------

interface CustomHostnameResult {
  id: string;
  hostname: string;
  status: string;
  ssl: {
    status: string;
    method: string;
    type: string;
    validation_records?: Array<{
      txt_name: string;
      txt_value: string;
    }>;
  };
  ownership_verification?: {
    type: string;
    name: string;
    value: string;
  };
}

export async function addCustomHostname(
  config: CloudflareConfig,
  hostname: string,
  _siteSlug: string
): Promise<{
  id: string;
  status: string;
  verificationTxt: string;
}> {
  if (!config.accountId) {
    console.warn("[Cloudflare] accountId required for custom hostnames");
    return { id: "", status: "failed", verificationTxt: "" };
  }

  const result = await cfFetch<CustomHostnameResult>(
    config,
    `/zones/${config.zoneId}/custom_hostnames`,
    {
      method: "POST",
      body: JSON.stringify({
        hostname,
        ssl: {
          method: "http",
          type: "dv",
          settings: {
            http2: "on",
            min_tls_version: "1.2",
          },
        },
      }),
    }
  );

  if (!result) {
    return { id: "", status: "failed", verificationTxt: "" };
  }

  // Extract the TXT verification value from ownership_verification or ssl validation
  const verificationTxt =
    result.ownership_verification?.value ||
    result.ssl?.validation_records?.[0]?.txt_value ||
    "";

  return {
    id: result.id,
    status: result.status,
    verificationTxt,
  };
}

export async function verifyCustomHostname(
  config: CloudflareConfig,
  hostnameId: string
): Promise<{
  verified: boolean;
  sslStatus: string;
}> {
  const result = await cfFetch<CustomHostnameResult>(
    config,
    `/zones/${config.zoneId}/custom_hostnames/${hostnameId}`
  );

  if (!result) {
    return { verified: false, sslStatus: "unknown" };
  }

  return {
    verified: result.status === "active",
    sslStatus: result.ssl?.status || "unknown",
  };
}

export async function removeCustomHostname(
  config: CloudflareConfig,
  hostnameId: string
): Promise<boolean> {
  const result = await cfFetch<{ id: string }>(
    config,
    `/zones/${config.zoneId}/custom_hostnames/${hostnameId}`,
    { method: "DELETE" }
  );

  return result !== null;
}

// ---------------------------------------------------------------------------
// Zone Info (for diagnostics)
// ---------------------------------------------------------------------------

export async function getZoneInfo(
  config: CloudflareConfig
): Promise<{ name: string; status: string } | null> {
  return cfFetch<{ name: string; status: string }>(
    config,
    `/zones/${config.zoneId}`
  );
}

// ---------------------------------------------------------------------------
// Zone Creation (for newly purchased domains)
// ---------------------------------------------------------------------------

interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  name_servers: string[];
  original_name_servers?: string[];
}

/**
 * Create a new Cloudflare zone for a purchased domain.
 * Returns the zone ID and Cloudflare nameservers that the domain must point to.
 *
 * Requires CLOUDFLARE_ACCOUNT_ID in environment.
 */
export async function createZone(
  config: CloudflareConfig,
  domain: string
): Promise<{
  success: boolean;
  zoneId?: string;
  nameservers?: string[];
  error?: string;
}> {
  if (!config.accountId) {
    return { success: false, error: "CLOUDFLARE_ACCOUNT_ID required to create zones" };
  }

  try {
    const res = await fetch(`${CF_BASE}/zones`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: domain,
        account: { id: config.accountId },
        type: "full", // Full zone — Cloudflare manages DNS
      }),
    });

    const data = (await res.json()) as CloudflareApiResponse<CloudflareZone>;

    if (!data.success) {
      const errMsg = data.errors?.map((e) => e.message).join(", ") || "Unknown error";
      // "already exists" is not a failure — domain was added previously
      if (errMsg.includes("already exists")) {
        console.log(`[Cloudflare] Zone already exists for ${domain}, looking up nameservers...`);
        const existing = await lookupZoneByName(config, domain);
        if (existing) {
          return {
            success: true,
            zoneId: existing.id,
            nameservers: existing.name_servers,
          };
        }
      }
      console.error(`[Cloudflare] Failed to create zone for ${domain}: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    console.log(`[Cloudflare] Zone created for ${domain}: ${data.result.id}, NS: ${data.result.name_servers.join(", ")}`);

    return {
      success: true,
      zoneId: data.result.id,
      nameservers: data.result.name_servers,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    console.error(`[Cloudflare] createZone error for ${domain}:`, msg);
    return { success: false, error: msg };
  }
}

/**
 * Look up an existing Cloudflare zone by domain name.
 */
async function lookupZoneByName(
  config: CloudflareConfig,
  domain: string
): Promise<CloudflareZone | null> {
  try {
    const res = await fetch(`${CF_BASE}/zones?name=${encodeURIComponent(domain)}`, {
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = (await res.json()) as CloudflareApiResponse<CloudflareZone[]>;
    if (data.success && data.result.length > 0) {
      return data.result[0];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Set default DNS records for a newly purchased domain.
 * Points the domain to Vercel for hosting.
 */
export async function setupDefaultDns(
  zoneId: string,
  domain: string,
  config: CloudflareConfig
): Promise<void> {
  // Override zoneId for this specific domain's zone (not the default zoobicon zone)
  const domainConfig = { ...config, zoneId };

  // A record → Vercel
  await createDnsRecord(domainConfig, {
    type: "A",
    name: domain,
    content: "76.76.21.21", // Vercel's IP
    proxied: true,
  });

  // www CNAME → Vercel
  await createDnsRecord(domainConfig, {
    type: "CNAME",
    name: `www.${domain}`,
    content: "cname.vercel-dns.com",
    proxied: true,
  });

  // MX records for email (Cloudflare Email Routing)
  await createDnsRecord(domainConfig, {
    type: "MX",
    name: domain,
    content: "route1.mx.cloudflare.net",
    priority: 69,
    proxied: false,
  });

  await createDnsRecord(domainConfig, {
    type: "MX",
    name: domain,
    content: "route2.mx.cloudflare.net",
    priority: 24,
    proxied: false,
  });

  await createDnsRecord(domainConfig, {
    type: "MX",
    name: domain,
    content: "route3.mx.cloudflare.net",
    priority: 98,
    proxied: false,
  });

  console.log(`[Cloudflare] Default DNS records created for ${domain}`);
}
