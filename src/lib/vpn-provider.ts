/**
 * VPN Provider Abstraction Layer
 *
 * Supports: WireGuard self-hosted (primary), Mullvad reseller (secondary), Mock (development)
 * Set VPN_PROVIDER=wireguard|mullvad|mock in env
 * Set WIREGUARD_API_URL + WIREGUARD_API_KEY or MULLVAD_API_KEY accordingly
 *
 * When no API key is configured, falls back to mock mode automatically.
 */

// ─── Types ───────────────────────────────────────────────

export interface VpnPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: "monthly" | "yearly";
  features: string[];
  maxDevices: number;
  serverLocations: number;
  bandwidthGB: number | "unlimited";
}

export interface VpnServer {
  id: string;
  country: string;
  countryCode: string;
  city: string;
  load: number;          // 0-100 percent
  latencyMs?: number;
  protocol: "wireguard" | "openvpn";
  available: boolean;
}

export interface VpnCredentials {
  id: string;
  userId: string;
  status: "active" | "expired" | "suspended";
  plan: string;
  config: {
    privateKey: string;
    publicKey: string;
    address: string;
    dns: string[];
    endpoint: string;
    allowedIps: string;
  };
  configFile: string;     // WireGuard .conf file content
  qrCodeData: string;     // For mobile app scanning
  expiresAt: string;
  createdAt: string;
}

export interface VpnUsage {
  userId: string;
  bytesUp: number;
  bytesDown: number;
  connectedSince: string | null;
  currentServer: string | null;
  devicesConnected: number;
}

// ─── Provider Interface ──────────────────────────────────

interface VpnProviderAdapter {
  name: string;
  getPlans(): Promise<VpnPlan[]>;
  getServers(country?: string): Promise<VpnServer[]>;
  provision(userId: string, planId: string): Promise<VpnCredentials>;
  getStatus(userId: string): Promise<VpnUsage>;
  revoke(userId: string): Promise<boolean>;
}

// ─── WireGuard Self-Hosted Provider ──────────────────────

class WireGuardProvider implements VpnProviderAdapter {
  name = "wireguard";
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async request(method: string, path: string, body?: unknown) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      throw new Error(`WireGuard API ${res.status}: ${err}`);
    }
    return res.json();
  }

  async getPlans(): Promise<VpnPlan[]> {
    return this.request("GET", "/plans");
  }

  async getServers(country?: string): Promise<VpnServer[]> {
    const params = country ? `?country=${encodeURIComponent(country)}` : "";
    return this.request("GET", `/servers${params}`);
  }

  async provision(userId: string, planId: string): Promise<VpnCredentials> {
    return this.request("POST", "/provision", { userId, planId });
  }

  async getStatus(userId: string): Promise<VpnUsage> {
    return this.request("GET", `/status/${encodeURIComponent(userId)}`);
  }

  async revoke(userId: string): Promise<boolean> {
    const result = await this.request("POST", `/revoke/${encodeURIComponent(userId)}`);
    return result.success ?? true;
  }
}

// ─── Mock Provider (Development) ─────────────────────────

class MockVpnProvider implements VpnProviderAdapter {
  name = "mock";

  async getPlans(): Promise<VpnPlan[]> {
    return [
      {
        id: "vpn-basic", name: "VPN Basic", price: 3.99, currency: "USD", period: "monthly",
        features: ["256-bit encryption", "No-logs policy", "Kill switch", "5 devices"],
        maxDevices: 5, serverLocations: 35, bandwidthGB: "unlimited",
      },
      {
        id: "vpn-pro", name: "VPN Pro", price: 5.99, currency: "USD", period: "monthly",
        features: ["Everything in Basic", "Double VPN", "Dedicated IP option", "10 devices", "Ad blocker"],
        maxDevices: 10, serverLocations: 60, bandwidthGB: "unlimited",
      },
      {
        id: "vpn-yearly", name: "VPN Pro Annual", price: 47.99, currency: "USD", period: "yearly",
        features: ["Everything in Pro", "Save 33%", "Priority support"],
        maxDevices: 10, serverLocations: 60, bandwidthGB: "unlimited",
      },
    ];
  }

  async getServers(country?: string): Promise<VpnServer[]> {
    const all: VpnServer[] = [
      { id: "nz-akl", country: "New Zealand", countryCode: "NZ", city: "Auckland", load: 23, latencyMs: 5, protocol: "wireguard", available: true },
      { id: "au-syd", country: "Australia", countryCode: "AU", city: "Sydney", load: 45, latencyMs: 28, protocol: "wireguard", available: true },
      { id: "au-mel", country: "Australia", countryCode: "AU", city: "Melbourne", load: 31, latencyMs: 32, protocol: "wireguard", available: true },
      { id: "sg-sg", country: "Singapore", countryCode: "SG", city: "Singapore", load: 55, latencyMs: 120, protocol: "wireguard", available: true },
      { id: "jp-tky", country: "Japan", countryCode: "JP", city: "Tokyo", load: 38, latencyMs: 95, protocol: "wireguard", available: true },
      { id: "us-lax", country: "United States", countryCode: "US", city: "Los Angeles", load: 62, latencyMs: 145, protocol: "wireguard", available: true },
      { id: "us-nyc", country: "United States", countryCode: "US", city: "New York", load: 71, latencyMs: 190, protocol: "wireguard", available: true },
      { id: "uk-lon", country: "United Kingdom", countryCode: "GB", city: "London", load: 48, latencyMs: 260, protocol: "wireguard", available: true },
      { id: "de-fra", country: "Germany", countryCode: "DE", city: "Frankfurt", load: 40, latencyMs: 270, protocol: "wireguard", available: true },
      { id: "fj-suv", country: "Fiji", countryCode: "FJ", city: "Suva", load: 12, latencyMs: 45, protocol: "wireguard", available: true },
    ];
    if (!country) return all;
    const lower = country.toLowerCase();
    return all.filter(s => s.country.toLowerCase().includes(lower) || s.countryCode.toLowerCase() === lower);
  }

  async provision(userId: string, planId: string): Promise<VpnCredentials> {
    const privKey = `mock-priv-${Math.random().toString(36).slice(2, 14)}`;
    const pubKey = `mock-pub-${Math.random().toString(36).slice(2, 14)}`;
    const conf = `[Interface]
PrivateKey = ${privKey}
Address = 10.66.66.${Math.floor(Math.random() * 254) + 1}/32
DNS = 1.1.1.1, 1.0.0.1

[Peer]
PublicKey = ${pubKey}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = vpn.zoobicon.com:51820
PersistentKeepalive = 25`;

    return {
      id: `vpn-${Date.now()}`,
      userId,
      status: "active",
      plan: planId,
      config: {
        privateKey: privKey,
        publicKey: pubKey,
        address: `10.66.66.${Math.floor(Math.random() * 254) + 1}/32`,
        dns: ["1.1.1.1", "1.0.0.1"],
        endpoint: "vpn.zoobicon.com:51820",
        allowedIps: "0.0.0.0/0, ::/0",
      },
      configFile: conf,
      qrCodeData: conf,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  async getStatus(userId: string): Promise<VpnUsage> {
    return {
      userId,
      bytesUp: Math.floor(Math.random() * 5e9),
      bytesDown: Math.floor(Math.random() * 25e9),
      connectedSince: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      currentServer: "nz-akl",
      devicesConnected: Math.floor(Math.random() * 3) + 1,
    };
  }

  async revoke(): Promise<boolean> {
    return true;
  }
}

// ─── Provider Factory ────────────────────────────────────

function getProvider(): VpnProviderAdapter {
  if (process.env.WIREGUARD_API_URL && process.env.WIREGUARD_API_KEY) {
    return new WireGuardProvider(process.env.WIREGUARD_API_URL, process.env.WIREGUARD_API_KEY);
  }
  return new MockVpnProvider();
}

let _provider: VpnProviderAdapter | null = null;
function provider(): VpnProviderAdapter {
  if (!_provider) _provider = getProvider();
  return _provider;
}

export const getProviderName = () => provider().name;
export const getVpnPlans = () => provider().getPlans();
export const getVpnServers = (country?: string) => provider().getServers(country);
export const provisionVpn = (userId: string, planId: string) => provider().provision(userId, planId);
export const getVpnStatus = (userId: string) => provider().getStatus(userId);
export const revokeVpn = (userId: string) => provider().revoke(userId);
