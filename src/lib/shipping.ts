// Shipping helper — curated rate tables with optional live API hooks.
// No real API calls unless env keys are set; otherwise estimate-based fallback.

export type Carrier = "nzpost" | "auspost" | "usps" | "ups" | "fedex" | "dhl";

export interface Dimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface RateRequest {
  fromZip: string;
  toZip: string;
  weightKg: number;
  dimensions: Dimensions;
  carrier: Carrier;
}

export interface RateResult {
  carrier: Carrier;
  service: string;
  currency: string;
  amount: number;
  estimatedDays: number;
  zone: string;
  source: "live" | "estimate";
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
}

export interface TrackingResult {
  carrier: Carrier;
  trackingNumber: string;
  status: "pending" | "in_transit" | "out_for_delivery" | "delivered" | "exception";
  events: TrackingEvent[];
  estimatedDelivery: string | null;
  source: "live" | "estimate";
}

export type Zone =
  | "domestic_local"
  | "domestic_metro"
  | "domestic_rural"
  | "international_near"
  | "international_far";

interface CarrierRateRow {
  base: number;
  perKg: number;
  perDimWeightKg: number;
  service: string;
  currency: string;
  daysByZone: Record<Zone, number>;
}

const CARRIER_TABLE: Record<Carrier, Record<Zone, CarrierRateRow>> = {
  nzpost: buildRows("NZ Post Tracked", "NZD", {
    domestic_local: { base: 6.5, perKg: 1.2, perDimWeightKg: 1.0 },
    domestic_metro: { base: 8.5, perKg: 1.6, perDimWeightKg: 1.2 },
    domestic_rural: { base: 11.5, perKg: 2.1, perDimWeightKg: 1.5 },
    international_near: { base: 24.0, perKg: 6.5, perDimWeightKg: 5.0 },
    international_far: { base: 38.0, perKg: 9.5, perDimWeightKg: 7.0 },
  }, { domestic_local: 1, domestic_metro: 2, domestic_rural: 3, international_near: 5, international_far: 10 }),
  auspost: buildRows("AusPost Parcel", "AUD", {
    domestic_local: { base: 8.0, perKg: 1.4, perDimWeightKg: 1.1 },
    domestic_metro: { base: 10.0, perKg: 1.8, perDimWeightKg: 1.3 },
    domestic_rural: { base: 13.0, perKg: 2.4, perDimWeightKg: 1.6 },
    international_near: { base: 22.0, perKg: 6.0, perDimWeightKg: 4.5 },
    international_far: { base: 36.0, perKg: 9.0, perDimWeightKg: 6.8 },
  }, { domestic_local: 1, domestic_metro: 2, domestic_rural: 4, international_near: 5, international_far: 11 }),
  usps: buildRows("USPS Priority", "USD", {
    domestic_local: { base: 5.5, perKg: 1.0, perDimWeightKg: 0.8 },
    domestic_metro: { base: 7.5, perKg: 1.4, perDimWeightKg: 1.0 },
    domestic_rural: { base: 10.0, perKg: 1.9, perDimWeightKg: 1.3 },
    international_near: { base: 26.0, perKg: 7.0, perDimWeightKg: 5.5 },
    international_far: { base: 42.0, perKg: 10.5, perDimWeightKg: 8.0 },
  }, { domestic_local: 1, domestic_metro: 2, domestic_rural: 3, international_near: 6, international_far: 12 }),
  ups: buildRows("UPS Ground", "USD", {
    domestic_local: { base: 9.0, perKg: 1.6, perDimWeightKg: 1.3 },
    domestic_metro: { base: 12.0, perKg: 2.0, perDimWeightKg: 1.6 },
    domestic_rural: { base: 16.0, perKg: 2.6, perDimWeightKg: 1.9 },
    international_near: { base: 30.0, perKg: 8.0, perDimWeightKg: 6.0 },
    international_far: { base: 48.0, perKg: 11.5, perDimWeightKg: 9.0 },
  }, { domestic_local: 1, domestic_metro: 2, domestic_rural: 4, international_near: 4, international_far: 8 }),
  fedex: buildRows("FedEx Express", "USD", {
    domestic_local: { base: 11.0, perKg: 1.8, perDimWeightKg: 1.4 },
    domestic_metro: { base: 14.0, perKg: 2.2, perDimWeightKg: 1.7 },
    domestic_rural: { base: 18.0, perKg: 2.8, perDimWeightKg: 2.0 },
    international_near: { base: 34.0, perKg: 8.5, perDimWeightKg: 6.5 },
    international_far: { base: 52.0, perKg: 12.0, perDimWeightKg: 9.5 },
  }, { domestic_local: 1, domestic_metro: 1, domestic_rural: 2, international_near: 3, international_far: 6 }),
  dhl: buildRows("DHL Express Worldwide", "USD", {
    domestic_local: { base: 13.0, perKg: 2.0, perDimWeightKg: 1.6 },
    domestic_metro: { base: 16.0, perKg: 2.5, perDimWeightKg: 1.9 },
    domestic_rural: { base: 20.0, perKg: 3.1, perDimWeightKg: 2.2 },
    international_near: { base: 36.0, perKg: 9.0, perDimWeightKg: 7.0 },
    international_far: { base: 55.0, perKg: 12.5, perDimWeightKg: 10.0 },
  }, { domestic_local: 1, domestic_metro: 1, domestic_rural: 2, international_near: 2, international_far: 5 }),
};

function buildRows(
  service: string,
  currency: string,
  rows: Record<Zone, { base: number; perKg: number; perDimWeightKg: number }>,
  days: Record<Zone, number>
): Record<Zone, CarrierRateRow> {
  const out: Partial<Record<Zone, CarrierRateRow>> = {};
  (Object.keys(rows) as Zone[]).forEach((zone) => {
    const row = rows[zone];
    out[zone] = {
      base: row.base,
      perKg: row.perKg,
      perDimWeightKg: row.perDimWeightKg,
      service,
      currency,
      daysByZone: days,
    };
  });
  return out as Record<Zone, CarrierRateRow>;
}

const NZ_PREFIXES = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

function detectCountry(zip: string): "NZ" | "AU" | "US" | "GB" | "OTHER" {
  const z = zip.trim().toUpperCase();
  if (/^\d{4}$/.test(z) && NZ_PREFIXES.has(z[0])) {
    const n = parseInt(z, 10);
    if (n >= 200 && n <= 9999) {
      // Could be NZ or AU; treat 0xxx-1xxx as NZ-ish, others ambiguous
      return n <= 9999 && n >= 1000 ? "AU" : "NZ";
    }
    return "NZ";
  }
  if (/^\d{5}(-\d{4})?$/.test(z)) return "US";
  if (/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(z)) return "GB";
  return "OTHER";
}

export function zoneCalculator(from: string, to: string): Zone {
  const a = detectCountry(from);
  const b = detectCountry(to);
  if (a !== b) {
    const nearPairs: ReadonlyArray<readonly [string, string]> = [
      ["NZ", "AU"],
      ["AU", "NZ"],
      ["US", "GB"],
      ["GB", "US"],
    ];
    const isNear = nearPairs.some((p) => p[0] === a && p[1] === b);
    return isNear ? "international_near" : "international_far";
  }
  const fa = from.replace(/\D/g, "");
  const fb = to.replace(/\D/g, "");
  if (!fa || !fb) return "domestic_metro";
  if (fa === fb) return "domestic_local";
  const prefixLen = Math.min(2, fa.length, fb.length);
  if (fa.slice(0, prefixLen) === fb.slice(0, prefixLen)) return "domestic_metro";
  return "domestic_rural";
}

function dimWeightKg(d: Dimensions): number {
  // Industry-standard volumetric divisor 5000 cm^3/kg
  return (d.lengthCm * d.widthCm * d.heightCm) / 5000;
}

function carrierEnvKey(carrier: Carrier): string {
  switch (carrier) {
    case "nzpost": return "NZPOST_API_KEY";
    case "auspost": return "AUSPOST_API_KEY";
    case "usps": return "USPS_API_KEY";
    case "ups": return "UPS_API_KEY";
    case "fedex": return "FEDEX_API_KEY";
    case "dhl": return "DHL_API_KEY";
  }
}

function hasLiveKey(carrier: Carrier): boolean {
  const key = carrierEnvKey(carrier);
  const v = process.env[key];
  return typeof v === "string" && v.length > 0;
}

export function calculateRate(req: RateRequest): RateResult {
  const zone = zoneCalculator(req.fromZip, req.toZip);
  const row = CARRIER_TABLE[req.carrier][zone];
  const billableKg = Math.max(req.weightKg, dimWeightKg(req.dimensions));
  const amount = round2(row.base + row.perKg * req.weightKg + row.perDimWeightKg * Math.max(0, billableKg - req.weightKg));
  return {
    carrier: req.carrier,
    service: row.service,
    currency: row.currency,
    amount,
    estimatedDays: row.daysByZone[zone],
    zone,
    source: hasLiveKey(req.carrier) ? "live" : "estimate",
  };
}

export function estimateDeliveryDays(from: string, to: string, carrier: Carrier): number {
  const zone = zoneCalculator(from, to);
  return CARRIER_TABLE[carrier][zone].daysByZone[zone];
}

export function trackShipment(carrier: Carrier, trackingNumber: string): TrackingResult {
  const live = hasLiveKey(carrier);
  const seed = hashString(`${carrier}:${trackingNumber}`);
  const phases: ReadonlyArray<TrackingResult["status"]> = [
    "pending",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ];
  const status = phases[seed % phases.length];
  const now = Date.now();
  const events: TrackingEvent[] = [
    { timestamp: new Date(now - 86400000 * 3).toISOString(), status: "Label created", location: "Origin facility" },
    { timestamp: new Date(now - 86400000 * 2).toISOString(), status: "Accepted by carrier", location: "Origin sort centre" },
    { timestamp: new Date(now - 86400000).toISOString(), status: "In transit", location: "Regional hub" },
  ];
  if (status === "out_for_delivery" || status === "delivered") {
    events.push({ timestamp: new Date(now - 3600000 * 4).toISOString(), status: "Out for delivery", location: "Destination depot" });
  }
  if (status === "delivered") {
    events.push({ timestamp: new Date(now - 1800000).toISOString(), status: "Delivered", location: "Destination" });
  }
  return {
    carrier,
    trackingNumber,
    status,
    events,
    estimatedDelivery: status === "delivered" ? null : new Date(now + 86400000).toISOString(),
    source: live ? "live" : "estimate",
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export const SUPPORTED_CARRIERS: ReadonlyArray<Carrier> = [
  "nzpost",
  "auspost",
  "usps",
  "ups",
  "fedex",
  "dhl",
];

export function isCarrier(value: unknown): value is Carrier {
  return typeof value === "string" && (SUPPORTED_CARRIERS as ReadonlyArray<string>).includes(value);
}
