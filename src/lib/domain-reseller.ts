/**
 * Zoobicon.io Domain Reseller Service
 *
 * Integration with Tucows/OpenSRS for domain registration, transfers,
 * and management. Provides a clean API layer over the OpenSRS XML API.
 *
 * ENV vars needed:
 *   OPENSRS_API_KEY        — Your reseller API key
 *   OPENSRS_RESELLER_USER  — Your reseller username
 *   OPENSRS_ENV            — "live" or "test" (default: test)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DomainSearchResult {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
  premium?: boolean;
  period?: number;
}

export interface DomainRegistration {
  domain: string;
  period: number; // years
  registrant: ContactInfo;
  nameservers?: string[];
  autoRenew?: boolean;
  privacyProtection?: boolean;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  organization?: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string; // ISO 2-letter code
}

export interface DomainInfo {
  domain: string;
  status: "active" | "expired" | "pending" | "transferring" | "locked";
  registrant: ContactInfo;
  nameservers: string[];
  expiresAt: string;
  createdAt: string;
  autoRenew: boolean;
  privacyProtection: boolean;
  locked: boolean;
}

export interface DomainPrice {
  tld: string;
  registerPrice: number;
  renewPrice: number;
  transferPrice: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// OpenSRS Configuration
// ---------------------------------------------------------------------------

function getOpenSRSConfig() {
  return {
    apiKey: process.env.OPENSRS_API_KEY || "",
    resellerUser: process.env.OPENSRS_RESELLER_USER || "",
    isLive: process.env.OPENSRS_ENV === "live",
  };
}

function hasOpenSRSConfig(): boolean {
  const config = getOpenSRSConfig();
  return !!(config.apiKey && config.resellerUser);
}

function getBaseUrl(): string {
  const config = getOpenSRSConfig();
  return config.isLive
    ? "https://rr-n1-tor.opensrs.net:55443"
    : "https://horizon.opensrs.net:55443";
}

// ---------------------------------------------------------------------------
// OpenSRS XML API helpers
// ---------------------------------------------------------------------------

function buildXmlRequest(
  action: string,
  object: string,
  attributes: Record<string, unknown>
): string {
  function valueToXml(value: unknown): string {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return `<item>${String(value)}</item>`;
    }
    if (Array.isArray(value)) {
      const items = value
        .map(
          (v, i) =>
            `<item key="${i}">${typeof v === "object" ? valueToXml(v) : String(v)}</item>`
        )
        .join("");
      return `<dt_array>${items}</dt_array>`;
    }
    if (typeof value === "object" && value !== null) {
      const items = Object.entries(value as Record<string, unknown>)
        .map(
          ([k, v]) =>
            `<item key="${k}">${typeof v === "object" ? valueToXml(v) : String(v)}</item>`
        )
        .join("");
      return `<dt_assoc>${items}</dt_assoc>`;
    }
    return `<item></item>`;
  }

  const attrItems = Object.entries(attributes)
    .map(([k, v]) => `<item key="${k}">${typeof v === "object" ? valueToXml(v) : String(v)}</item>`)
    .join("\n            ");

  return `<?xml version='1.0' encoding='UTF-8' standalone='no' ?>
<!DOCTYPE OPS_envelope SYSTEM 'ops.dtd'>
<OPS_envelope>
  <header><version>0.9</version></header>
  <body>
    <data_block>
      <dt_assoc>
        <item key="protocol">XCP</item>
        <item key="action">${action}</item>
        <item key="object">${object}</item>
        <item key="attributes">
          <dt_assoc>
            ${attrItems}
          </dt_assoc>
        </item>
      </dt_assoc>
    </data_block>
  </body>
</OPS_envelope>`;
}

function generateSignature(xml: string, apiKey: string): string {
  // OpenSRS uses MD5(MD5(xml + apiKey) + apiKey)
  const { createHash } = require("crypto");
  const inner = createHash("md5").update(xml + apiKey).digest("hex");
  return createHash("md5").update(inner + apiKey).digest("hex");
}

async function callOpenSRS(
  action: string,
  object: string,
  attributes: Record<string, unknown>
): Promise<{ success: boolean; responseText?: string; data?: Record<string, unknown>; error?: string }> {
  const config = getOpenSRSConfig();

  if (!hasOpenSRSConfig()) {
    return { success: false, error: "OpenSRS not configured" };
  }

  const xml = buildXmlRequest(action, object, attributes);
  const signature = generateSignature(xml, config.apiKey);

  try {
    const response = await fetch(getBaseUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "X-Username": config.resellerUser,
        "X-Signature": signature,
        "Content-Length": String(Buffer.byteLength(xml)),
      },
      body: xml,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[OpenSRS] HTTP ${response.status}: ${response.statusText}`, body.slice(0, 500));
      return {
        success: false,
        error: `OpenSRS HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const text = await response.text();

    // Parse response
    const successMatch = text.match(
      /<item key="is_success">(\d)<\/item>/
    );
    const isSuccess = successMatch?.[1] === "1";

    const responseTextMatch = text.match(
      /<item key="response_text">(.+?)<\/item>/
    );
    const responseText = responseTextMatch?.[1] || "";

    if (!isSuccess) {
      return {
        success: false,
        responseText,
        error: responseText || "OpenSRS request failed",
      };
    }

    return { success: true, responseText, data: { raw: text } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "OpenSRS request failed",
    };
  }
}

// ---------------------------------------------------------------------------
// Domain Search / Availability
// ---------------------------------------------------------------------------

export async function searchDomains(
  query: string,
  tlds?: string[]
): Promise<DomainSearchResult[]> {
  const searchTlds = tlds || [
    "com", "net", "org", "io", "co", "ai", "sh", "dev",
    "app", "xyz", "me", "info", "biz", "us", "cc", "tv",
  ];

  // Clean the query — remove any existing TLD
  const baseName = query
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\.[a-z]{2,}$/, "");

  if (hasOpenSRSConfig()) {
    // For each TLD, do a lookup via OpenSRS
    const lookupPromises = searchTlds.map(async (tld) => {
      const domain = `${baseName}.${tld}`;
      const result = await callOpenSRS("LOOKUP", "DOMAIN", { domain });

      // OpenSRS LOOKUP: is_success=1 means API call worked.
      // Availability is determined by response_text:
      //   "Domain available" → available
      //   "Domain taken" → not available
      // If the API call itself fails, treat as unavailable.
      const available = result.success
        ? /available/i.test(result.responseText || "")
        : false;

      return {
        domain,
        available,
        price: getTldPrice(tld),
        currency: "USD",
        premium: false,
        period: 1,
        // Debug info (remove after confirming API works)
        _debug: {
          apiSuccess: result.success,
          responseText: result.responseText || null,
          error: result.error || null,
        },
      } as DomainSearchResult & { _debug: unknown };
    });

    return Promise.all(lookupPromises);
  }

  // Dev fallback: simulate availability
  return searchTlds.map((tld) => ({
    domain: `${baseName}.${tld}`,
    available: Math.random() > 0.3, // 70% available in dev mode
    price: getTldPrice(tld),
    currency: "USD",
    premium: false,
    period: 1,
  }));
}

// ---------------------------------------------------------------------------
// Domain Registration
// ---------------------------------------------------------------------------

export async function registerDomain(
  registration: DomainRegistration
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  if (!hasOpenSRSConfig()) {
    // Dev fallback
    console.log("[Domain Reseller] OpenSRS not configured. Registration logged:");
    console.log(`  Domain: ${registration.domain}`);
    console.log(`  Period: ${registration.period} year(s)`);
    return {
      success: true,
      orderId: `dev-order-${Date.now()}`,
    };
  }

  const contact = registration.registrant;
  const contactSet = {
    first_name: contact.firstName,
    last_name: contact.lastName,
    org_name: contact.organization || "",
    email: contact.email,
    phone: contact.phone,
    address1: contact.address1,
    address2: contact.address2 || "",
    city: contact.city,
    state: contact.state,
    postal_code: contact.postalCode,
    country: contact.country,
  };

  const nameservers = registration.nameservers || [
    "ns1.zoobicon.io",
    "ns2.zoobicon.io",
  ];

  const result = await callOpenSRS("SW_REGISTER", "DOMAIN", {
    domain: registration.domain,
    period: registration.period,
    reg_username: contact.email,
    reg_password: crypto.randomUUID().slice(0, 16),
    auto_renew: registration.autoRenew ? 1 : 0,
    whois_privacy: registration.privacyProtection ? 1 : 0,
    contact_set: {
      owner: contactSet,
      admin: contactSet,
      billing: contactSet,
      tech: contactSet,
    },
    nameserver_list: nameservers.map((ns, i) => ({
      [`name`]: ns,
      [`sortorder`]: i + 1,
    })),
    custom_nameservers: 1,
    custom_tech_contact: 1,
  });

  if (result.success) {
    // Parse the real OpenSRS order ID from the XML response if present.
    const raw: string = (result.data as { raw?: string } | undefined)?.raw || "";
    const orderIdMatch = raw.match(/<item key="id">(\d+)<\/item>/) ||
                         raw.match(/<item key="order_id">(\d+)<\/item>/);
    const orderId = orderIdMatch?.[1] || `opensrs-${Date.now()}`;
    return { success: true, orderId };
  }

  return { success: false, error: result.error };
}

// ---------------------------------------------------------------------------
// Domain Management
// ---------------------------------------------------------------------------

export async function getDomainInfo(
  domain: string
): Promise<{ success: boolean; info?: DomainInfo; error?: string }> {
  if (!hasOpenSRSConfig()) {
    return {
      success: true,
      info: {
        domain,
        status: "active",
        registrant: {
          firstName: "Dev",
          lastName: "User",
          email: "dev@example.com",
          phone: "+1.5555555555",
          address1: "123 Dev St",
          city: "San Francisco",
          state: "CA",
          postalCode: "94102",
          country: "US",
        },
        nameservers: ["ns1.zoobicon.io", "ns2.zoobicon.io"],
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        autoRenew: true,
        privacyProtection: true,
        locked: true,
      },
    };
  }

  const result = await callOpenSRS("GET", "DOMAIN", {
    domain,
    type: "all_info",
  });

  if (result.success) {
    return {
      success: true,
      info: {
        domain,
        status: "active",
        registrant: {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          address1: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
        nameservers: ["ns1.zoobicon.io", "ns2.zoobicon.io"],
        expiresAt: "",
        createdAt: "",
        autoRenew: true,
        privacyProtection: true,
        locked: true,
      },
    };
  }

  return { success: false, error: result.error };
}

export async function renewDomain(
  domain: string,
  period: number = 1
): Promise<{ success: boolean; error?: string }> {
  if (!hasOpenSRSConfig()) {
    console.log(`[Domain Reseller] Dev renewal: ${domain} for ${period} year(s)`);
    return { success: true };
  }

  const result = await callOpenSRS("RENEW", "DOMAIN", {
    domain,
    period,
    currentexpirationyear: new Date().getFullYear(),
  });

  return { success: result.success, error: result.error };
}

export async function transferDomain(
  domain: string,
  authCode: string,
  registrant: ContactInfo
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  if (!hasOpenSRSConfig()) {
    console.log(`[Domain Reseller] Dev transfer: ${domain}`);
    return { success: true, orderId: `dev-transfer-${Date.now()}` };
  }

  const result = await callOpenSRS("SW_REGISTER", "DOMAIN", {
    domain,
    period: 1,
    reg_type: "transfer",
    domain_auth_info: authCode,
  });

  return {
    success: result.success,
    orderId: result.success ? `opensrs-transfer-${Date.now()}` : undefined,
    error: result.error,
  };
}

export async function updateNameservers(
  domain: string,
  nameservers: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!hasOpenSRSConfig()) {
    console.log(`[Domain Reseller] Dev NS update: ${domain} → ${nameservers.join(", ")}`);
    return { success: true };
  }

  const result = await callOpenSRS(
    "ADVANCED_UPDATE_NAMESERVERS",
    "DOMAIN",
    {
      domain,
      op_type: "assign",
      assign_ns: nameservers,
    }
  );

  return { success: result.success, error: result.error };
}

// ---------------------------------------------------------------------------
// TLD Pricing (reseller markup built in)
// ---------------------------------------------------------------------------

const TLD_PRICES: Record<string, DomainPrice> = {
  com: { tld: "com", registerPrice: 12.99, renewPrice: 14.99, transferPrice: 12.99, currency: "USD" },
  net: { tld: "net", registerPrice: 13.99, renewPrice: 15.99, transferPrice: 13.99, currency: "USD" },
  org: { tld: "org", registerPrice: 11.99, renewPrice: 13.99, transferPrice: 11.99, currency: "USD" },
  io: { tld: "io", registerPrice: 39.99, renewPrice: 44.99, transferPrice: 39.99, currency: "USD" },
  co: { tld: "co", registerPrice: 29.99, renewPrice: 34.99, transferPrice: 29.99, currency: "USD" },
  ai: { tld: "ai", registerPrice: 79.99, renewPrice: 89.99, transferPrice: 79.99, currency: "USD" },
  sh: { tld: "sh", registerPrice: 24.99, renewPrice: 29.99, transferPrice: 24.99, currency: "USD" },
  dev: { tld: "dev", registerPrice: 14.99, renewPrice: 16.99, transferPrice: 14.99, currency: "USD" },
  app: { tld: "app", registerPrice: 14.99, renewPrice: 16.99, transferPrice: 14.99, currency: "USD" },
  xyz: { tld: "xyz", registerPrice: 9.99, renewPrice: 12.99, transferPrice: 9.99, currency: "USD" },
  me: { tld: "me", registerPrice: 8.99, renewPrice: 19.99, transferPrice: 8.99, currency: "USD" },
  info: { tld: "info", registerPrice: 4.99, renewPrice: 16.99, transferPrice: 4.99, currency: "USD" },
  biz: { tld: "biz", registerPrice: 9.99, renewPrice: 16.99, transferPrice: 9.99, currency: "USD" },
  us: { tld: "us", registerPrice: 8.99, renewPrice: 10.99, transferPrice: 8.99, currency: "USD" },
  cc: { tld: "cc", registerPrice: 12.99, renewPrice: 14.99, transferPrice: 12.99, currency: "USD" },
  tv: { tld: "tv", registerPrice: 34.99, renewPrice: 39.99, transferPrice: 34.99, currency: "USD" },
};

export function getTldPrice(tld: string): number {
  return TLD_PRICES[tld.toLowerCase()]?.registerPrice || 14.99;
}

export function getTldPricing(tld: string): DomainPrice {
  return (
    TLD_PRICES[tld.toLowerCase()] || {
      tld,
      registerPrice: 14.99,
      renewPrice: 16.99,
      transferPrice: 14.99,
      currency: "USD",
    }
  );
}

export function getAllTldPricing(): DomainPrice[] {
  return Object.values(TLD_PRICES);
}

export { hasOpenSRSConfig };
