/**
 * Domain Pricing Arbitrage Engine
 *
 * Wholesale costs sourced from OpenSRS/Tucows reseller pricing (USD).
 * Retail reference prices from publicly listed GoDaddy/Namecheap pricing as of 2026-04.
 *
 * All values stored in CENTS (USD) to avoid floating point errors.
 */

export interface ArbitrageOpportunity {
  tld: string;
  wholesale: number;
  ourPrice: number;
  competitorPrice: number;
  savingsPct: number;
  marginPct: number;
  recommendation: string;
}

export interface MarketSnapshotEntry {
  tld: string;
  wholesale: number;
  ourPrice: number;
  godaddy: number;
  namecheap: number;
  ourSavingsVsGodaddyPct: number;
  ourSavingsVsNamecheapPct: number;
  ourMarginPct: number;
  demandTier: DemandTier;
}

export interface PricingResult {
  tld: string;
  wholesale: number;
  retail: number;
  marginPct: number;
}

export type DemandTier = "premium" | "standard" | "budget";

/**
 * Wholesale cost in CENTS via OpenSRS/Tucows reseller pricing.
 * Top 30 TLDs covered. Source: OpenSRS price list 2026-Q1.
 */
export const WHOLESALE_COSTS: Readonly<Record<string, number>> = Object.freeze({
  com: 849,
  net: 1049,
  org: 1049,
  ai: 7000,
  io: 3300,
  sh: 2700,
  dev: 1500,
  app: 1500,
  co: 2400,
  xyz: 299,
  me: 1800,
  info: 399,
  biz: 1499,
  us: 999,
  tv: 3299,
  cc: 2299,
  online: 399,
  site: 299,
  store: 599,
  tech: 599,
  shop: 3499,
  blog: 2999,
  cloud: 1899,
  digital: 2999,
  agency: 1899,
  studio: 2299,
  design: 3999,
  art: 1499,
  page: 1099,
  link: 999,
});

/**
 * Publicly listed reference prices (CENTS) — competitors.
 * Source: GoDaddy.com / Namecheap.com listed prices as of 2026-04.
 */
const GODADDY_PRICES: Readonly<Record<string, number>> = Object.freeze({
  com: 1299, net: 1899, org: 1099, ai: 9999, io: 5999, sh: 4999,
  dev: 1999, app: 1999, co: 3499, xyz: 1299, me: 2499, info: 1999,
  biz: 2199, us: 1499, tv: 3999, cc: 2999, online: 3999, site: 2999,
  store: 5999, tech: 4999, shop: 4999, blog: 3499, cloud: 2999,
  digital: 3999, agency: 2999, studio: 3299, design: 4999, art: 1799,
  page: 1599, link: 1299,
});

const NAMECHEAP_PRICES: Readonly<Record<string, number>> = Object.freeze({
  com: 1098, net: 1398, org: 1098, ai: 8988, io: 4488, sh: 3988,
  dev: 1888, app: 1788, co: 2998, xyz: 999, me: 1988, info: 1488,
  biz: 1788, us: 898, tv: 3488, cc: 2588, online: 2988, site: 2488,
  store: 4988, tech: 3988, shop: 3988, blog: 2988, cloud: 2488,
  digital: 2988, agency: 2488, studio: 2788, design: 4488, art: 1588,
  page: 1388, link: 1188,
});

const PREMIUM_TLDS: ReadonlySet<string> = new Set(["ai", "io", "sh", "dev", "app", "tech"]);
const BUDGET_TLDS: ReadonlySet<string> = new Set(["xyz", "site", "online", "info"]);

function normalizeTld(tld: string): string {
  return tld.replace(/^\./, "").toLowerCase();
}

export function getDemandTier(tld: string): DemandTier {
  const t = normalizeTld(tld);
  if (PREMIUM_TLDS.has(t)) return "premium";
  if (BUDGET_TLDS.has(t)) return "budget";
  return "standard";
}

export function getWholesaleCost(tld: string): number {
  const t = normalizeTld(tld);
  const cost = WHOLESALE_COSTS[t];
  if (cost === undefined) {
    throw new Error(`Unknown TLD: .${t} — not in wholesale price list`);
  }
  return cost;
}

export function getRetailPrice(tld: string, marginPct = 40): number {
  const wholesale = getWholesaleCost(tld);
  return Math.round(wholesale * (1 + marginPct / 100));
}

function defaultMarginForTier(tier: DemandTier): number {
  switch (tier) {
    case "premium": return 60;
    case "standard": return 35;
    case "budget": return 80;
  }
}

export function computeArbitrageOpportunity(
  tld: string,
  competitorPriceCents: number,
): ArbitrageOpportunity {
  const t = normalizeTld(tld);
  const wholesale = getWholesaleCost(t);
  const tier = getDemandTier(t);
  const marginPct = defaultMarginForTier(tier);
  const ourPrice = Math.round(wholesale * (1 + marginPct / 100));
  const savingsPct = competitorPriceCents > 0
    ? Math.round(((competitorPriceCents - ourPrice) / competitorPriceCents) * 1000) / 10
    : 0;

  let recommendation: string;
  if (ourPrice < competitorPriceCents && savingsPct >= 20) {
    recommendation = `STRONG ARBITRAGE — undercut by ${savingsPct}% while keeping ${marginPct}% margin`;
  } else if (ourPrice < competitorPriceCents) {
    recommendation = `MODEST ARBITRAGE — undercut by ${savingsPct}%`;
  } else if (ourPrice === competitorPriceCents) {
    recommendation = `PARITY — match competitor, compete on bundle`;
  } else {
    recommendation = `OVERPRICED — drop margin to undercut competitor`;
  }

  return {
    tld: t,
    wholesale,
    ourPrice,
    competitorPrice: competitorPriceCents,
    savingsPct,
    marginPct,
    recommendation,
  };
}

export function getMarketSnapshot(tlds?: readonly string[]): MarketSnapshotEntry[] {
  const list = tlds && tlds.length > 0 ? tlds : Object.keys(WHOLESALE_COSTS);
  const out: MarketSnapshotEntry[] = [];
  for (const raw of list) {
    const t = normalizeTld(raw);
    const wholesale = WHOLESALE_COSTS[t];
    if (wholesale === undefined) continue;
    const tier = getDemandTier(t);
    const marginPct = defaultMarginForTier(tier);
    const ourPrice = Math.round(wholesale * (1 + marginPct / 100));
    const godaddy = GODADDY_PRICES[t] ?? 0;
    const namecheap = NAMECHEAP_PRICES[t] ?? 0;
    const vsGd = godaddy > 0 ? Math.round(((godaddy - ourPrice) / godaddy) * 1000) / 10 : 0;
    const vsNc = namecheap > 0 ? Math.round(((namecheap - ourPrice) / namecheap) * 1000) / 10 : 0;
    out.push({
      tld: t,
      wholesale,
      ourPrice,
      godaddy,
      namecheap,
      ourSavingsVsGodaddyPct: vsGd,
      ourSavingsVsNamecheapPct: vsNc,
      ourMarginPct: marginPct,
      demandTier: tier,
    });
  }
  return out;
}

export function bulkPriceOptimizer(tlds: readonly string[]): PricingResult[] {
  const out: PricingResult[] = [];
  for (const raw of tlds) {
    const t = normalizeTld(raw);
    const wholesale = WHOLESALE_COSTS[t];
    if (wholesale === undefined) continue;
    const tier = getDemandTier(t);
    const marginPct = defaultMarginForTier(tier);
    const retail = Math.round(wholesale * (1 + marginPct / 100));
    out.push({ tld: t, wholesale, retail, marginPct });
  }
  return out;
}
