// Tax calculation library — curated rate tables for 50+ countries.
// All rates are decimals (0.15 = 15%). Sources: OECD, EU Commission, IRS, IRD NZ, ATO AU (2025-2026).

export type TaxType = "vat" | "gst" | "sales" | "income";

export interface CalculateTaxInput {
  amount: number;
  country: string;
  region?: string;
  type: TaxType;
}

export interface CalculateTaxResult {
  amount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  type: TaxType;
  country: string;
  region?: string;
  label: string;
}

export interface LineItem {
  description?: string;
  quantity: number;
  unitPrice: number;
  taxable?: boolean;
}

export interface InvoiceTaxInput {
  lineItems: LineItem[];
  country: string;
  region?: string;
}

export interface InvoiceTaxResult {
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  country: string;
  region?: string;
  label: string;
}

export interface IncomeTaxInput {
  income: number;
  country: string;
  year?: number;
}

export interface IncomeTaxBracket {
  min: number;
  max: number; // Number.POSITIVE_INFINITY for top
  rate: number;
}

export interface IncomeTaxResult {
  income: number;
  country: string;
  year: number;
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
  brackets: ReadonlyArray<IncomeTaxBracket>;
}

// ---- VAT / GST table (50+ countries) ----
// ISO-3166 alpha-2. Label notes which scheme applies.
interface VatEntry {
  rate: number;
  label: string;
}

const VAT_TABLE: Readonly<Record<string, VatEntry>> = {
  NZ: { rate: 0.15, label: "GST" },
  AU: { rate: 0.10, label: "GST" },
  GB: { rate: 0.20, label: "VAT" },
  UK: { rate: 0.20, label: "VAT" },
  IE: { rate: 0.23, label: "VAT" },
  DE: { rate: 0.19, label: "VAT" },
  FR: { rate: 0.20, label: "VAT" },
  IT: { rate: 0.22, label: "VAT" },
  ES: { rate: 0.21, label: "VAT" },
  PT: { rate: 0.23, label: "VAT" },
  NL: { rate: 0.21, label: "VAT" },
  BE: { rate: 0.21, label: "VAT" },
  LU: { rate: 0.17, label: "VAT" },
  AT: { rate: 0.20, label: "VAT" },
  DK: { rate: 0.25, label: "VAT" },
  SE: { rate: 0.25, label: "VAT" },
  NO: { rate: 0.25, label: "VAT" },
  FI: { rate: 0.255, label: "VAT" },
  IS: { rate: 0.24, label: "VAT" },
  PL: { rate: 0.23, label: "VAT" },
  CZ: { rate: 0.21, label: "VAT" },
  SK: { rate: 0.23, label: "VAT" },
  HU: { rate: 0.27, label: "VAT" },
  RO: { rate: 0.19, label: "VAT" },
  BG: { rate: 0.20, label: "VAT" },
  HR: { rate: 0.25, label: "VAT" },
  SI: { rate: 0.22, label: "VAT" },
  EE: { rate: 0.22, label: "VAT" },
  LV: { rate: 0.21, label: "VAT" },
  LT: { rate: 0.21, label: "VAT" },
  GR: { rate: 0.24, label: "VAT" },
  CY: { rate: 0.19, label: "VAT" },
  MT: { rate: 0.18, label: "VAT" },
  CH: { rate: 0.081, label: "VAT" },
  LI: { rate: 0.081, label: "VAT" },
  TR: { rate: 0.20, label: "VAT" },
  RU: { rate: 0.20, label: "VAT" },
  UA: { rate: 0.20, label: "VAT" },
  ZA: { rate: 0.15, label: "VAT" },
  EG: { rate: 0.14, label: "VAT" },
  MA: { rate: 0.20, label: "VAT" },
  NG: { rate: 0.075, label: "VAT" },
  KE: { rate: 0.16, label: "VAT" },
  IN: { rate: 0.18, label: "GST" },
  PK: { rate: 0.18, label: "GST" },
  BD: { rate: 0.15, label: "VAT" },
  LK: { rate: 0.18, label: "VAT" },
  CN: { rate: 0.13, label: "VAT" },
  HK: { rate: 0, label: "None" },
  TW: { rate: 0.05, label: "VAT" },
  JP: { rate: 0.10, label: "Consumption Tax" },
  KR: { rate: 0.10, label: "VAT" },
  SG: { rate: 0.09, label: "GST" },
  MY: { rate: 0.08, label: "SST" },
  TH: { rate: 0.07, label: "VAT" },
  VN: { rate: 0.10, label: "VAT" },
  ID: { rate: 0.11, label: "VAT" },
  PH: { rate: 0.12, label: "VAT" },
  AE: { rate: 0.05, label: "VAT" },
  SA: { rate: 0.15, label: "VAT" },
  IL: { rate: 0.17, label: "VAT" },
  CA: { rate: 0.05, label: "GST" }, // federal only; provinces add HST/PST
  MX: { rate: 0.16, label: "VAT" },
  BR: { rate: 0.17, label: "ICMS" },
  AR: { rate: 0.21, label: "VAT" },
  CL: { rate: 0.19, label: "VAT" },
  CO: { rate: 0.19, label: "VAT" },
  PE: { rate: 0.18, label: "VAT" },
  US: { rate: 0, label: "Sales Tax (state-based)" },
};

export function vatRate(country: string): number {
  const key = country.toUpperCase();
  const entry = VAT_TABLE[key];
  return entry ? entry.rate : 0;
}

function vatLabel(country: string): string {
  const key = country.toUpperCase();
  const entry = VAT_TABLE[key];
  return entry ? entry.label : "Tax";
}

// ---- US sales tax by state (combined avg state + local) ----
const US_STATE_SALES_TAX: Readonly<Record<string, number>> = {
  AL: 0.0924, AK: 0.0182, AZ: 0.0840, AR: 0.0947, CA: 0.0882,
  CO: 0.0791, CT: 0.0635, DE: 0, FL: 0.0700, GA: 0.0738,
  HI: 0.0444, ID: 0.0603, IL: 0.0888, IN: 0.0700, IA: 0.0694,
  KS: 0.0870, KY: 0.0600, LA: 0.0956, ME: 0.0550, MD: 0.0600,
  MA: 0.0625, MI: 0.0600, MN: 0.0810, MS: 0.0707, MO: 0.0839,
  MT: 0, NE: 0.0697, NV: 0.0823, NH: 0, NJ: 0.0660,
  NM: 0.0778, NY: 0.0853, NC: 0.0700, ND: 0.0697, OH: 0.0725,
  OK: 0.0900, OR: 0, PA: 0.0634, RI: 0.0700, SC: 0.0744,
  SD: 0.0640, TN: 0.0955, TX: 0.0820, UT: 0.0719, VT: 0.0636,
  VA: 0.0577, WA: 0.0938, WV: 0.0557, WI: 0.0543, WY: 0.0544,
  DC: 0.0600,
};

// US ZIP → state prefix mapping (first 3 digits → state).
function zipToState(zip: string): string | null {
  const z = zip.replace(/\D/g, "").slice(0, 5);
  if (z.length < 5) return null;
  const n = parseInt(z, 10);
  if (n >= 99500 && n <= 99999) return "AK";
  if (n >= 35000 && n <= 36999) return "AL";
  if (n >= 71600 && n <= 72999) return "AR";
  if (n >= 85000 && n <= 86999) return "AZ";
  if (n >= 90000 && n <= 96199) return "CA";
  if (n >= 80000 && n <= 81999) return "CO";
  if (n >= 6000 && n <= 6999) return "CT";
  if (n >= 20000 && n <= 20099) return "DC";
  if (n >= 19700 && n <= 19999) return "DE";
  if (n >= 32000 && n <= 34999) return "FL";
  if (n >= 30000 && n <= 31999) return "GA";
  if (n >= 96700 && n <= 96899) return "HI";
  if (n >= 50000 && n <= 52999) return "IA";
  if (n >= 83200 && n <= 83899) return "ID";
  if (n >= 60000 && n <= 62999) return "IL";
  if (n >= 46000 && n <= 47999) return "IN";
  if (n >= 66000 && n <= 67999) return "KS";
  if (n >= 40000 && n <= 42799) return "KY";
  if (n >= 70000 && n <= 71499) return "LA";
  if (n >= 1000 && n <= 2799) return "MA";
  if (n >= 20600 && n <= 21999) return "MD";
  if (n >= 3900 && n <= 4999) return "ME";
  if (n >= 48000 && n <= 49999) return "MI";
  if (n >= 55000 && n <= 56999) return "MN";
  if (n >= 63000 && n <= 65999) return "MO";
  if (n >= 38600 && n <= 39799) return "MS";
  if (n >= 59000 && n <= 59999) return "MT";
  if (n >= 27000 && n <= 28999) return "NC";
  if (n >= 58000 && n <= 58899) return "ND";
  if (n >= 68000 && n <= 69399) return "NE";
  if (n >= 3000 && n <= 3899) return "NH";
  if (n >= 7000 && n <= 8999) return "NJ";
  if (n >= 87000 && n <= 88499) return "NM";
  if (n >= 88900 && n <= 89899) return "NV";
  if (n >= 10000 && n <= 14999) return "NY";
  if (n >= 43000 && n <= 45999) return "OH";
  if (n >= 73000 && n <= 74999) return "OK";
  if (n >= 97000 && n <= 97999) return "OR";
  if (n >= 15000 && n <= 19699) return "PA";
  if (n >= 2800 && n <= 2999) return "RI";
  if (n >= 29000 && n <= 29999) return "SC";
  if (n >= 57000 && n <= 57799) return "SD";
  if (n >= 37000 && n <= 38599) return "TN";
  if ((n >= 75000 && n <= 79999) || (n >= 88500 && n <= 88599)) return "TX";
  if (n >= 84000 && n <= 84799) return "UT";
  if (n >= 22000 && n <= 24699) return "VA";
  if (n >= 5000 && n <= 5999) return "VT";
  if (n >= 98000 && n <= 99499) return "WA";
  if (n >= 53000 && n <= 54999) return "WI";
  if (n >= 24700 && n <= 26899) return "WV";
  if (n >= 82000 && n <= 83199) return "WY";
  return null;
}

export function salesTaxByZip(zip: string, country: string = "US"): number {
  if (country.toUpperCase() !== "US") return 0;
  const state = zipToState(zip);
  if (!state) return 0;
  return US_STATE_SALES_TAX[state] ?? 0;
}

// ---- Income tax brackets (progressive) ----
type BracketTable = Readonly<Record<string, ReadonlyArray<IncomeTaxBracket>>>;

const INCOME_TAX_BRACKETS_2025: BracketTable = {
  NZ: [
    { min: 0, max: 15600, rate: 0.105 },
    { min: 15600, max: 53500, rate: 0.175 },
    { min: 53500, max: 78100, rate: 0.30 },
    { min: 78100, max: 180000, rate: 0.33 },
    { min: 180000, max: Number.POSITIVE_INFINITY, rate: 0.39 },
  ],
  AU: [
    { min: 0, max: 18200, rate: 0 },
    { min: 18200, max: 45000, rate: 0.16 },
    { min: 45000, max: 135000, rate: 0.30 },
    { min: 135000, max: 190000, rate: 0.37 },
    { min: 190000, max: Number.POSITIVE_INFINITY, rate: 0.45 },
  ],
  GB: [
    { min: 0, max: 12570, rate: 0 },
    { min: 12570, max: 50270, rate: 0.20 },
    { min: 50270, max: 125140, rate: 0.40 },
    { min: 125140, max: Number.POSITIVE_INFINITY, rate: 0.45 },
  ],
  US: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  CA: [
    { min: 0, max: 55867, rate: 0.15 },
    { min: 55867, max: 111733, rate: 0.205 },
    { min: 111733, max: 173205, rate: 0.26 },
    { min: 173205, max: 246752, rate: 0.29 },
    { min: 246752, max: Number.POSITIVE_INFINITY, rate: 0.33 },
  ],
  DE: [
    { min: 0, max: 11604, rate: 0 },
    { min: 11604, max: 17005, rate: 0.14 },
    { min: 17005, max: 66760, rate: 0.24 },
    { min: 66760, max: 277825, rate: 0.42 },
    { min: 277825, max: Number.POSITIVE_INFINITY, rate: 0.45 },
  ],
  FR: [
    { min: 0, max: 11294, rate: 0 },
    { min: 11294, max: 28797, rate: 0.11 },
    { min: 28797, max: 82341, rate: 0.30 },
    { min: 82341, max: 177106, rate: 0.41 },
    { min: 177106, max: Number.POSITIVE_INFINITY, rate: 0.45 },
  ],
  IE: [
    { min: 0, max: 42000, rate: 0.20 },
    { min: 42000, max: Number.POSITIVE_INFINITY, rate: 0.40 },
  ],
  SG: [
    { min: 0, max: 20000, rate: 0 },
    { min: 20000, max: 30000, rate: 0.02 },
    { min: 30000, max: 40000, rate: 0.035 },
    { min: 40000, max: 80000, rate: 0.07 },
    { min: 80000, max: 120000, rate: 0.115 },
    { min: 120000, max: 160000, rate: 0.15 },
    { min: 160000, max: 200000, rate: 0.18 },
    { min: 200000, max: 240000, rate: 0.19 },
    { min: 240000, max: 280000, rate: 0.195 },
    { min: 280000, max: 320000, rate: 0.20 },
    { min: 320000, max: 500000, rate: 0.22 },
    { min: 500000, max: 1000000, rate: 0.23 },
    { min: 1000000, max: Number.POSITIVE_INFINITY, rate: 0.24 },
  ],
};

function bracketsFor(country: string): ReadonlyArray<IncomeTaxBracket> {
  const key = country.toUpperCase();
  return INCOME_TAX_BRACKETS_2025[key] ?? INCOME_TAX_BRACKETS_2025.US;
}

export function incomeTaxBracket(input: IncomeTaxInput): IncomeTaxResult {
  const { income, country } = input;
  const year = input.year ?? 2025;
  const brackets = bracketsFor(country);
  let totalTax = 0;
  let marginalRate = 0;
  for (const b of brackets) {
    if (income > b.min) {
      const taxable = Math.min(income, b.max) - b.min;
      if (taxable > 0) {
        totalTax += taxable * b.rate;
        marginalRate = b.rate;
      }
    }
  }
  const effectiveRate = income > 0 ? totalTax / income : 0;
  return {
    income,
    country: country.toUpperCase(),
    year,
    totalTax: round2(totalTax),
    effectiveRate: Math.round(effectiveRate * 10000) / 10000,
    marginalRate,
    brackets,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateTax(input: CalculateTaxInput): CalculateTaxResult {
  const { amount, country, region, type } = input;
  let rate = 0;
  let label = "Tax";
  if (type === "vat" || type === "gst") {
    rate = vatRate(country);
    label = vatLabel(country);
  } else if (type === "sales") {
    if (country.toUpperCase() === "US" && region) {
      rate = US_STATE_SALES_TAX[region.toUpperCase()] ?? 0;
      label = `US Sales Tax (${region.toUpperCase()})`;
    } else {
      rate = vatRate(country);
      label = vatLabel(country);
    }
  } else if (type === "income") {
    const r = incomeTaxBracket({ income: amount, country });
    return {
      amount,
      taxRate: r.effectiveRate,
      taxAmount: r.totalTax,
      total: round2(amount - r.totalTax),
      type,
      country: country.toUpperCase(),
      region,
      label: `Income Tax (${country.toUpperCase()})`,
    };
  }
  const taxAmount = round2(amount * rate);
  return {
    amount: round2(amount),
    taxRate: rate,
    taxAmount,
    total: round2(amount + taxAmount),
    type,
    country: country.toUpperCase(),
    region,
    label,
  };
}

export function invoiceTax(input: InvoiceTaxInput): InvoiceTaxResult {
  const { lineItems, country, region } = input;
  let subtotal = 0;
  let taxableBase = 0;
  for (const li of lineItems) {
    const line = li.quantity * li.unitPrice;
    subtotal += line;
    if (li.taxable !== false) taxableBase += line;
  }
  let rate = 0;
  let label = vatLabel(country);
  if (country.toUpperCase() === "US" && region) {
    rate = US_STATE_SALES_TAX[region.toUpperCase()] ?? 0;
    label = `US Sales Tax (${region.toUpperCase()})`;
  } else {
    rate = vatRate(country);
  }
  const tax = round2(taxableBase * rate);
  return {
    subtotal: round2(subtotal),
    taxRate: rate,
    tax,
    total: round2(subtotal + tax),
    country: country.toUpperCase(),
    region,
    label,
  };
}
