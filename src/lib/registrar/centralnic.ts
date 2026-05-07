/**
 * CentralNic Reseller (RRPproxy / Hexonet) — Wholesale Registrar Provider
 *
 * Why CentralNic: it's the wholesale market leader for resellers who don't
 * have ICANN accreditation. Near-cost pricing on .com/.net, 800+ TLDs
 * (the strongest ccTLD coverage of any non-accredited reseller), simple
 * HTTP form-API instead of the OpenSRS XML envelope, and no quota
 * gotchas. This is the natural #2 in the registrar fallback chain.
 *
 * API reference:  https://www.centralnicreseller.com/api/
 * Endpoint:       https://api.rrpproxy.net/api/call.cgi
 * Wire format:    HTTP GET/POST with form-encoded params
 * Auth:           s_login + s_pw   (account credentials)
 *                 OR s_apiKey      (preferred — issuable + revokable from
 *                                   the reseller dashboard)
 * Response:       text/plain, key=value lines, "code=200" on success
 *
 * Required env vars:
 *   CENTRALNIC_API_KEY        — preferred. From dashboard → API → Keys
 *   CENTRALNIC_LOGIN          — fallback if no API key (account user)
 *   CENTRALNIC_PASSWORD       — fallback if no API key (account password)
 *   CENTRALNIC_ENV            — "live" or "ote" (test). Default "ote".
 *
 * Status: COMPLETE WIRE IMPLEMENTATION. Until env vars are set,
 * isConfigured() returns false and the chain skips this provider —
 * existing OpenSRS-only behaviour is unchanged. The moment Craig
 * onboards with CentralNic and sets the keys, fallover is live.
 */

import type {
  AvailabilityResult,
  ContactInfo,
  DomainRegistrar,
  RegistrationRequest,
  RegistrationResult,
} from "./types";

// ── Config ─────────────────────────────────────────────────────────────────
function getEndpoint(): string {
  return process.env.CENTRALNIC_ENV === "live"
    ? "https://api.rrpproxy.net/api/call.cgi"
    : "https://api-ote.rrpproxy.net/api/call.cgi";
}

function authParams(): Record<string, string> | null {
  const apiKey = process.env.CENTRALNIC_API_KEY;
  if (apiKey) return { s_apiKey: apiKey };
  const login = process.env.CENTRALNIC_LOGIN;
  const password = process.env.CENTRALNIC_PASSWORD;
  if (login && password) return { s_login: login, s_pw: password };
  return null;
}

function isConfigured(): boolean {
  return authParams() !== null;
}

// ── HTTP helpers ───────────────────────────────────────────────────────────
const API_TIMEOUT_MS = 15_000;

async function call(
  command: string,
  params: Record<string, string | number | undefined>,
): Promise<{ ok: boolean; code: string; description: string; properties: Record<string, string[]> }> {
  const auth = authParams();
  if (!auth) {
    return {
      ok: false,
      code: "503",
      description: "CentralNic credentials not configured",
      properties: {},
    };
  }

  const form = new URLSearchParams({ ...auth, command });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") form.append(k, String(v));
  }

  let raw = "";
  try {
    const res = await fetch(getEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    raw = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, code: "599", description: `network: ${msg}`, properties: {} };
  }

  return parseResponse(raw);
}

/**
 * Parse the RRPproxy text response.
 * Format:
 *   [RESPONSE]
 *   code = 200
 *   description = Command completed successfully
 *   property[<key>][<idx>] = <value>
 *   ...
 *   EOF
 */
function parseResponse(raw: string): {
  ok: boolean;
  code: string;
  description: string;
  properties: Record<string, string[]>;
} {
  let code = "";
  let description = "";
  const properties: Record<string, string[]> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("code")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) code = trimmed.slice(eq + 1).trim();
      continue;
    }
    if (trimmed.startsWith("description")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) description = trimmed.slice(eq + 1).trim();
      continue;
    }
    const propMatch = trimmed.match(/^property\[([^\]]+)\](?:\[\d+\])?\s*=\s*(.*)$/);
    if (propMatch) {
      const key = propMatch[1].toLowerCase();
      (properties[key] ||= []).push(propMatch[2].trim());
    }
  }

  // RRPproxy success codes are 200/210/218/219. Anything else = failure.
  const ok = /^(200|210|218|219)$/.test(code);
  return { ok, code, description, properties };
}

function flattenError(code: string, description: string): string {
  if (!code && !description) return "CentralNic returned no response";
  if (!description) return `CentralNic ${code}`;
  return `CentralNic ${code}: ${description}`;
}

// ── Contact handle management ──────────────────────────────────────────────
/**
 * RRPproxy uses contact handles, not inline contact data. Every domain
 * registration references a previously-created handle for owner/admin/tech/
 * billing. We create a fresh handle for every registration so customers
 * see their own data, then reuse the four handles within that one call.
 */
async function addContact(contact: ContactInfo): Promise<{ handle?: string; error?: string }> {
  const res = await call("AddContact", {
    firstname: contact.firstName,
    lastname: contact.lastName,
    organization: contact.organization || "",
    street0: contact.address1,
    street1: contact.address2 || "",
    city: contact.city,
    state: contact.state,
    zip: contact.postalCode,
    country: contact.country.toUpperCase(),
    email: contact.email,
    phone: contact.phone,
  });

  if (!res.ok) return { error: flattenError(res.code, res.description) };
  const handle = res.properties["contact"]?.[0];
  if (!handle) return { error: "CentralNic AddContact returned no handle" };
  return { handle };
}

// ── DomainRegistrar implementation ─────────────────────────────────────────
export const centralNicRegistrar: DomainRegistrar = {
  name: "centralnic",
  displayName: "CentralNic Reseller",
  // CentralNic supports 800+ TLDs — same effectively-all coverage as OpenSRS.
  supportedTlds: "*",

  isConfigured,

  async checkAvailability(domain: string): Promise<AvailabilityResult> {
    if (!isConfigured()) {
      return { domain, available: null, source: "centralnic (not configured)" };
    }

    const res = await call("CheckDomain", { domain });
    if (!res.ok) {
      return {
        domain,
        available: null,
        source: `centralnic (${res.code})`,
      };
    }

    // RRPproxy CheckDomain returns property[status] = "available" | "registered"
    const status = (res.properties["status"]?.[0] || "").toLowerCase();
    const priceStr = res.properties["price"]?.[0];
    const wholesalePrice = priceStr ? Number(priceStr) : undefined;
    const currency = res.properties["currency"]?.[0];
    const isPremium = res.properties["premium"]?.[0]?.toLowerCase() === "yes";

    if (status === "available") {
      return {
        domain,
        available: true,
        premium: isPremium,
        wholesalePrice: Number.isFinite(wholesalePrice) ? wholesalePrice : undefined,
        currency,
        source: "centralnic",
      };
    }
    if (status === "registered") {
      return { domain, available: false, source: "centralnic" };
    }
    return { domain, available: null, source: `centralnic (status: ${status || "unknown"})` };
  },

  async registerDomain(req: RegistrationRequest): Promise<RegistrationResult> {
    if (!isConfigured()) {
      const missing: string[] = [];
      if (!process.env.CENTRALNIC_API_KEY && !process.env.CENTRALNIC_LOGIN) {
        missing.push("CENTRALNIC_API_KEY (or CENTRALNIC_LOGIN+CENTRALNIC_PASSWORD)");
      }
      return {
        success: false,
        error: `CentralNic Reseller not configured. Missing env: ${missing.join(", ")}. Sign up at centralnicreseller.com → API → Keys.`,
        source: "centralnic",
      };
    }

    // Step 1: create the contact handle
    const contactResult = await addContact(req.registrant);
    if (contactResult.error) {
      return { success: false, error: contactResult.error, source: "centralnic" };
    }
    const handle = contactResult.handle!;

    // Step 2: register the domain referencing that handle for all four roles
    const ns = req.nameservers && req.nameservers.length > 0
      ? req.nameservers
      : ["ns1.zoobicon.io", "ns2.zoobicon.io"];

    const params: Record<string, string | number> = {
      domain: req.domain,
      period: req.period,
      ownercontact0: handle,
      admincontact0: handle,
      techcontact0: handle,
      billingcontact0: handle,
      transferlock: 1,
    };
    ns.forEach((host, idx) => {
      params[`nameserver${idx}`] = host;
    });
    if (req.privacyProtection) {
      // Not all TLDs allow whoisprivacy via RRPproxy; the API ignores
      // this for unsupported TLDs rather than failing the registration.
      params["X-WHOISPRIVACY"] = 1;
    }
    if (req.autoRenew !== undefined) {
      params["renewalmode"] = req.autoRenew ? "AUTORENEW" : "AUTOEXPIRE";
    }

    const res = await call("AddDomain", params);
    if (!res.ok) {
      return {
        success: false,
        error: flattenError(res.code, res.description),
        source: "centralnic",
      };
    }

    return {
      success: true,
      orderId: res.properties["orderid"]?.[0] || res.properties["roid"]?.[0],
      source: "centralnic",
    };
  },
};
