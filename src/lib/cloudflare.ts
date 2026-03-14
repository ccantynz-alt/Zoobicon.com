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
