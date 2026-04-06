/**
 * eSIM Provider Abstraction Layer
 *
 * Supports: Celitech (primary), Airalo (secondary), Mock (development)
 * Set ESIM_PROVIDER=celitech|airalo|mock in env
 * Set CELITECH_API_KEY or AIRALO_API_KEY accordingly
 *
 * When no API key is configured, falls back to mock mode automatically.
 */

// ─── Types ───────────────────────────────────────────────

export interface EsimPlan {
  id: string;
  provider: "celitech" | "airalo" | "mock";
  name: string;
  destination: string;       // Country or region name
  destinationCode: string;   // ISO country code or region code
  dataAmountMB: number;
  dataAmountGB: number;
  validityDays: number;
  price: number;             // USD retail price
  wholesalePrice: number;    // USD cost price
  currency: string;
  networkType: "4G" | "5G" | "4G/5G";
  countries: string[];       // Covered countries
  operatorName?: string;
}

export interface EsimPurchaseResult {
  id: string;
  provider: "celitech" | "airalo" | "mock";
  providerEsimId: string;
  iccid: string;
  smdpAddress: string;
  activationCode: string;
  qrCodeData: string;        // SM-DP+ address + activation code for QR
  status: "purchased" | "installed" | "active" | "expired" | "depleted";
  plan: EsimPlan;
  createdAt: string;
}

export interface EsimUsage {
  esimId: string;
  dataUsedMB: number;
  dataRemainingMB: number;
  dataTotalMB: number;
  percentUsed: number;
  status: "active" | "inactive" | "expired" | "depleted";
  validUntil: string;
  lastUpdated: string;
}

export interface EsimTopupResult {
  success: boolean;
  newDataTotalMB: number;
  newValidUntil: string;
  transactionId: string;
}

// ─── Provider Interface ──────────────────────────────────

interface EsimProviderAdapter {
  name: string;
  getPlans(destination?: string): Promise<EsimPlan[]>;
  purchase(planId: string, email: string): Promise<EsimPurchaseResult>;
  getUsage(providerEsimId: string): Promise<EsimUsage>;
  topup(providerEsimId: string, planId: string): Promise<EsimTopupResult>;
}

// ─── Celitech Provider ───────────────────────────────────

class CelitechProvider implements EsimProviderAdapter {
  name = "celitech";
  private baseUrl = "https://api.celitech.net/v1";
  private apiKey: string;

  constructor(apiKey: string) {
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
      throw new Error(`Celitech API ${res.status}: ${err}`);
    }
    return res.json();
  }

  async getPlans(destination?: string): Promise<EsimPlan[]> {
    const params = destination ? `?destination=${encodeURIComponent(destination)}` : "";
    const data = await this.request("GET", `/destinations/packages${params}`);
    return (data.packages || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      provider: "celitech" as const,
      name: p.name as string || `${p.destination} ${p.dataAmountInGB}GB`,
      destination: p.destination as string,
      destinationCode: p.destinationCode as string || "",
      dataAmountMB: ((p.dataAmountInGB as number) || 0) * 1024,
      dataAmountGB: (p.dataAmountInGB as number) || 0,
      validityDays: (p.validityInDays as number) || 0,
      price: (p.retailPrice as number) || (p.price as number) || 0,
      wholesalePrice: (p.wholesalePrice as number) || (p.price as number) || 0,
      currency: "USD",
      networkType: "4G/5G" as const,
      countries: (p.countries as string[]) || [p.destination as string],
    }));
  }

  async purchase(planId: string, email: string): Promise<EsimPurchaseResult> {
    const data = await this.request("POST", "/purchases", {
      packageId: planId,
      email,
    });
    const esim = data.esim || data;
    return {
      id: esim.id || esim.purchaseId,
      provider: "celitech",
      providerEsimId: esim.esimId || esim.id,
      iccid: esim.iccid || "",
      smdpAddress: esim.smdpAddress || "",
      activationCode: esim.activationCode || "",
      qrCodeData: esim.qrCodeData || `LPA:1$${esim.smdpAddress || ""}$${esim.activationCode || ""}`,
      status: "purchased",
      plan: {
        id: planId,
        provider: "celitech",
        name: esim.packageName || "",
        destination: esim.destination || "",
        destinationCode: "",
        dataAmountMB: ((esim.dataAmountInGB || 0) * 1024),
        dataAmountGB: esim.dataAmountInGB || 0,
        validityDays: esim.validityInDays || 0,
        price: esim.retailPrice || 0,
        wholesalePrice: esim.wholesalePrice || 0,
        currency: "USD",
        networkType: "4G/5G",
        countries: [],
      },
      createdAt: new Date().toISOString(),
    };
  }

  async getUsage(providerEsimId: string): Promise<EsimUsage> {
    const data = await this.request("GET", `/esims/${providerEsimId}/usage`);
    const usage = data.usage || data;
    const totalMB = (usage.dataTotalInGB || 0) * 1024;
    const usedMB = (usage.dataUsedInGB || 0) * 1024;
    return {
      esimId: providerEsimId,
      dataUsedMB: usedMB,
      dataRemainingMB: totalMB - usedMB,
      dataTotalMB: totalMB,
      percentUsed: totalMB > 0 ? Math.round((usedMB / totalMB) * 100) : 0,
      status: usage.status || "active",
      validUntil: usage.expiresAt || "",
      lastUpdated: new Date().toISOString(),
    };
  }

  async topup(providerEsimId: string, planId: string): Promise<EsimTopupResult> {
    const data = await this.request("POST", `/esims/${providerEsimId}/top-up`, {
      packageId: planId,
    });
    return {
      success: true,
      newDataTotalMB: ((data.newDataTotalInGB || 0) * 1024),
      newValidUntil: data.newExpiresAt || "",
      transactionId: data.transactionId || data.id || "",
    };
  }
}

// ─── Airalo Provider ─────────────────────────────────────

class AiraloProvider implements EsimProviderAdapter {
  name = "airalo";
  private baseUrl = "https://partners-api.airalo.com/v2";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(method: string, path: string, body?: unknown) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      throw new Error(`Airalo API ${res.status}: ${err}`);
    }
    return res.json();
  }

  async getPlans(destination?: string): Promise<EsimPlan[]> {
    const path = destination ? `/packages?filter[country]=${encodeURIComponent(destination)}` : "/packages";
    const data = await this.request("GET", path);
    return (data.data || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      provider: "airalo" as const,
      name: p.title as string || "",
      destination: p.country as string || "",
      destinationCode: p.country_code as string || "",
      dataAmountMB: ((p.data_amount as number) || 0) * 1024,
      dataAmountGB: (p.data_amount as number) || 0,
      validityDays: (p.validity as number) || 0,
      price: (p.price as number) || 0,
      wholesalePrice: (p.net_price as number) || (p.price as number) || 0,
      currency: "USD",
      networkType: "4G" as const,
      countries: (p.countries as string[]) || [],
      operatorName: p.operator as string || "",
    }));
  }

  async purchase(planId: string, email: string): Promise<EsimPurchaseResult> {
    const data = await this.request("POST", "/orders", {
      package_id: planId,
      quantity: 1,
      description: `eSIM for ${email}`,
    });
    const esim = data.data?.sims?.[0] || data.data || {};
    return {
      id: data.data?.id || "",
      provider: "airalo",
      providerEsimId: esim.id || "",
      iccid: esim.iccid || "",
      smdpAddress: esim.lpa?.split("$")[1] || "",
      activationCode: esim.lpa?.split("$")[2] || "",
      qrCodeData: esim.lpa || esim.qrcode || "",
      status: "purchased",
      plan: {
        id: planId,
        provider: "airalo",
        name: "",
        destination: "",
        destinationCode: "",
        dataAmountMB: 0,
        dataAmountGB: 0,
        validityDays: 0,
        price: 0,
        wholesalePrice: 0,
        currency: "USD",
        networkType: "4G",
        countries: [],
      },
      createdAt: new Date().toISOString(),
    };
  }

  async getUsage(providerEsimId: string): Promise<EsimUsage> {
    const data = await this.request("GET", `/sims/${providerEsimId}/usage`);
    const usage = data.data || {};
    const totalMB = (usage.total || 0);
    const usedMB = (usage.used || 0);
    return {
      esimId: providerEsimId,
      dataUsedMB: usedMB,
      dataRemainingMB: usage.remaining || (totalMB - usedMB),
      dataTotalMB: totalMB,
      percentUsed: totalMB > 0 ? Math.round((usedMB / totalMB) * 100) : 0,
      status: usage.status || "active",
      validUntil: usage.expired_at || "",
      lastUpdated: new Date().toISOString(),
    };
  }

  async topup(providerEsimId: string, planId: string): Promise<EsimTopupResult> {
    const data = await this.request("POST", `/sims/${providerEsimId}/topup`, {
      package_id: planId,
    });
    return {
      success: true,
      newDataTotalMB: data.data?.total || 0,
      newValidUntil: data.data?.expired_at || "",
      transactionId: data.data?.id || "",
    };
  }
}

// ─── Mock Provider (Development) ─────────────────────────

class MockProvider implements EsimProviderAdapter {
  name = "mock";

  private mockPlans: EsimPlan[] = [
    { id: "mock-nz-1gb", provider: "mock", name: "New Zealand 1GB", destination: "New Zealand", destinationCode: "NZ", dataAmountMB: 1024, dataAmountGB: 1, validityDays: 7, price: 4.99, wholesalePrice: 2.00, currency: "USD", networkType: "4G/5G", countries: ["New Zealand"] },
    { id: "mock-nz-3gb", provider: "mock", name: "New Zealand 3GB", destination: "New Zealand", destinationCode: "NZ", dataAmountMB: 3072, dataAmountGB: 3, validityDays: 15, price: 9.99, wholesalePrice: 4.50, currency: "USD", networkType: "4G/5G", countries: ["New Zealand"] },
    { id: "mock-nz-5gb", provider: "mock", name: "New Zealand 5GB", destination: "New Zealand", destinationCode: "NZ", dataAmountMB: 5120, dataAmountGB: 5, validityDays: 30, price: 14.99, wholesalePrice: 7.00, currency: "USD", networkType: "4G/5G", countries: ["New Zealand"] },
    { id: "mock-au-1gb", provider: "mock", name: "Australia 1GB", destination: "Australia", destinationCode: "AU", dataAmountMB: 1024, dataAmountGB: 1, validityDays: 7, price: 4.99, wholesalePrice: 2.50, currency: "USD", networkType: "4G/5G", countries: ["Australia"] },
    { id: "mock-au-5gb", provider: "mock", name: "Australia 5GB", destination: "Australia", destinationCode: "AU", dataAmountMB: 5120, dataAmountGB: 5, validityDays: 30, price: 14.99, wholesalePrice: 7.50, currency: "USD", networkType: "4G/5G", countries: ["Australia"] },
    { id: "mock-au-10gb", provider: "mock", name: "Australia 10GB", destination: "Australia", destinationCode: "AU", dataAmountMB: 10240, dataAmountGB: 10, validityDays: 30, price: 24.99, wholesalePrice: 12.00, currency: "USD", networkType: "4G/5G", countries: ["Australia"] },
    { id: "mock-fiji-1gb", provider: "mock", name: "Fiji 1GB", destination: "Fiji", destinationCode: "FJ", dataAmountMB: 1024, dataAmountGB: 1, validityDays: 7, price: 8.99, wholesalePrice: 5.00, currency: "USD", networkType: "4G", countries: ["Fiji"] },
    { id: "mock-fiji-3gb", provider: "mock", name: "Fiji 3GB", destination: "Fiji", destinationCode: "FJ", dataAmountMB: 3072, dataAmountGB: 3, validityDays: 15, price: 19.99, wholesalePrice: 12.00, currency: "USD", networkType: "4G", countries: ["Fiji"] },
    { id: "mock-sea-5gb", provider: "mock", name: "Southeast Asia 5GB", destination: "Southeast Asia", destinationCode: "SEA", dataAmountMB: 5120, dataAmountGB: 5, validityDays: 30, price: 14.99, wholesalePrice: 5.00, currency: "USD", networkType: "4G/5G", countries: ["Thailand", "Vietnam", "Indonesia", "Philippines", "Malaysia", "Singapore"] },
    { id: "mock-eu-5gb", provider: "mock", name: "Europe 5GB", destination: "Europe", destinationCode: "EU", dataAmountMB: 5120, dataAmountGB: 5, validityDays: 30, price: 14.99, wholesalePrice: 5.50, currency: "USD", networkType: "4G/5G", countries: ["UK", "France", "Germany", "Spain", "Italy", "Netherlands", "Portugal", "Switzerland", "Austria", "Belgium"] },
    { id: "mock-usa-5gb", provider: "mock", name: "USA 5GB", destination: "United States", destinationCode: "US", dataAmountMB: 5120, dataAmountGB: 5, validityDays: 30, price: 14.99, wholesalePrice: 6.00, currency: "USD", networkType: "5G", countries: ["United States"] },
    { id: "mock-global-5gb", provider: "mock", name: "Global 5GB", destination: "Global", destinationCode: "GLOBAL", dataAmountMB: 5120, dataAmountGB: 5, validityDays: 30, price: 29.99, wholesalePrice: 15.00, currency: "USD", networkType: "4G/5G", countries: ["190+ countries"] },
  ];

  async getPlans(destination?: string): Promise<EsimPlan[]> {
    if (!destination) return this.mockPlans;
    const lower = destination.toLowerCase();
    return this.mockPlans.filter(p =>
      p.destination.toLowerCase().includes(lower) ||
      p.destinationCode.toLowerCase() === lower ||
      p.countries.some(c => c.toLowerCase().includes(lower))
    );
  }

  async purchase(planId: string, email: string): Promise<EsimPurchaseResult> {
    const plan = this.mockPlans.find(p => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const iccid = `8901${Math.random().toString().slice(2, 18)}`;
    const smdpAddress = "smdp.mock.zoobicon.com";
    const activationCode = `MOCK-${Math.random().toString(36).slice(2, 14).toUpperCase()}`;
    return {
      id,
      provider: "mock",
      providerEsimId: id,
      iccid,
      smdpAddress,
      activationCode,
      qrCodeData: `LPA:1$${smdpAddress}$${activationCode}`,
      status: "purchased",
      plan,
      createdAt: new Date().toISOString(),
    };
  }

  async getUsage(providerEsimId: string): Promise<EsimUsage> {
    // Simulate some usage
    const totalMB = 5120;
    const usedMB = Math.floor(Math.random() * totalMB * 0.6);
    return {
      esimId: providerEsimId,
      dataUsedMB: usedMB,
      dataRemainingMB: totalMB - usedMB,
      dataTotalMB: totalMB,
      percentUsed: Math.round((usedMB / totalMB) * 100),
      status: "active",
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  }

  async topup(providerEsimId: string): Promise<EsimTopupResult> {
    return {
      success: true,
      newDataTotalMB: 10240,
      newValidUntil: new Date(Date.now() + 60 * 86400000).toISOString(),
      transactionId: `mock-topup-${Date.now()}`,
    };
  }
}

// ─── Provider Factory ────────────────────────────────────

function getProvider(): EsimProviderAdapter {
  const providerName = process.env.ESIM_PROVIDER || "auto";

  if (providerName === "celitech" || (providerName === "auto" && process.env.CELITECH_API_KEY)) {
    if (!process.env.CELITECH_API_KEY) throw new Error("CELITECH_API_KEY required");
    return new CelitechProvider(process.env.CELITECH_API_KEY);
  }

  if (providerName === "airalo" || (providerName === "auto" && process.env.AIRALO_API_KEY)) {
    if (!process.env.AIRALO_API_KEY) throw new Error("AIRALO_API_KEY required");
    return new AiraloProvider(process.env.AIRALO_API_KEY);
  }

  // No API key configured — fall back to mock
  return new MockProvider();
}

// ─── Exported Functions ──────────────────────────────────

let _provider: EsimProviderAdapter | null = null;
function provider(): EsimProviderAdapter {
  if (!_provider) _provider = getProvider();
  return _provider;
}

export function getProviderName(): string {
  return provider().name;
}

export async function getEsimPlans(destination?: string): Promise<EsimPlan[]> {
  return provider().getPlans(destination);
}

export async function purchaseEsim(planId: string, email: string): Promise<EsimPurchaseResult> {
  return provider().purchase(planId, email);
}

export async function getEsimUsage(providerEsimId: string): Promise<EsimUsage> {
  return provider().getUsage(providerEsimId);
}

export async function topupEsim(providerEsimId: string, planId: string): Promise<EsimTopupResult> {
  return provider().topup(providerEsimId, planId);
}
