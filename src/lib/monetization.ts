// ---------------------------------------------------------------------------
// Monetization Utilities
//
// Gated generators, overage packs, build limits, annual discounts, and
// monthly Pro-exclusive template drops. Used by UpgradePrompt, builder,
// and generator pages to enforce plan limits.
// ---------------------------------------------------------------------------

export interface TemplateDrop {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  addedAt: string;
  proExclusive: boolean;
}

export interface BuildCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeOption?: string;
}

export interface OveragePack {
  builds: number;
  price: number;
  pricePerBuild: number;
}

// ---------------------------------------------------------------------------
// Gated Generators — Pro-only and Agency-only generator IDs
// ---------------------------------------------------------------------------

export const PRO_GENERATORS = [
  "fullstack-app",
  "ecommerce-store",
  "saas-dashboard",
  "agency-portfolio",
  "multi-page-site",
];

export const AGENCY_GENERATORS = [
  "white-label",
  "bulk-generator",
  "client-portal",
];

// ---------------------------------------------------------------------------
// Plan limits (monthly builds)
// ---------------------------------------------------------------------------

const PLAN_BUILD_LIMITS: Record<string, number> = {
  free: 3,
  creator: 15,
  pro: 50,
  agency: 200,
  enterprise: Infinity,
  admin: Infinity,
};

// ---------------------------------------------------------------------------
// Generator locking
// ---------------------------------------------------------------------------

export function isGeneratorLocked(generatorId: string, plan: string): boolean {
  const normalizedPlan = plan.toLowerCase();

  // Enterprise and admin have full access
  if (normalizedPlan === "enterprise" || normalizedPlan === "admin") {
    return false;
  }

  // Agency generators need agency plan or higher
  if (AGENCY_GENERATORS.includes(generatorId)) {
    return normalizedPlan !== "agency";
  }

  // Pro generators need pro plan or higher
  if (PRO_GENERATORS.includes(generatorId)) {
    return normalizedPlan !== "pro" && normalizedPlan !== "agency";
  }

  // All other generators are available to everyone
  return false;
}

// ---------------------------------------------------------------------------
// Overage packs
// ---------------------------------------------------------------------------

const OVERAGE_PACKS: OveragePack[] = [
  { builds: 5, price: 9, pricePerBuild: 1.8 },
  { builds: 10, price: 15, pricePerBuild: 1.5 },
  { builds: 25, price: 29, pricePerBuild: 1.16 },
];

export function getOveragePackPrice(builds: number): number {
  if (builds <= 5) return 9;
  if (builds <= 10) return 15;
  return 29;
}

export function getOveragePacks(): OveragePack[] {
  return OVERAGE_PACKS;
}

// ---------------------------------------------------------------------------
// Build allowance check
// ---------------------------------------------------------------------------

export function canUserBuild(
  plan: string,
  monthlyBuilds: number
): BuildCheckResult {
  const normalizedPlan = plan.toLowerCase();
  const limit = PLAN_BUILD_LIMITS[normalizedPlan] ?? PLAN_BUILD_LIMITS.free;

  if (limit === Infinity) {
    return { allowed: true };
  }

  if (monthlyBuilds < limit) {
    return { allowed: true };
  }

  // At or over limit
  const nextPlan = getNextPlan(normalizedPlan);

  if (nextPlan) {
    return {
      allowed: false,
      reason: `You've used all ${limit} builds for this month on the ${capitalize(normalizedPlan)} plan.`,
      upgradeOption: nextPlan,
    };
  }

  return {
    allowed: false,
    reason: `You've used all ${limit} builds for this month. Purchase an overage pack or wait until next month.`,
    upgradeOption: "overage",
  };
}

function getNextPlan(current: string): string | null {
  const hierarchy = ["free", "creator", "pro", "agency"];
  const idx = hierarchy.indexOf(current);
  if (idx === -1 || idx >= hierarchy.length - 1) return null;
  return hierarchy[idx + 1];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Annual discount
// ---------------------------------------------------------------------------

export function getAnnualDiscount(): number {
  return 0.2; // 20% off
}

export function getAnnualPrice(monthlyPrice: number): number {
  const yearlyTotal = monthlyPrice * 12;
  return Math.round(yearlyTotal * (1 - getAnnualDiscount()));
}

// ---------------------------------------------------------------------------
// Monthly Pro-exclusive template drops
// ---------------------------------------------------------------------------

export function getMonthlyTemplateDrops(): TemplateDrop[] {
  // Templates rotate monthly. In production, this would pull from the DB.
  // For now, return curated templates for the current month.
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const seed = `${year}-${month}`;

  const allDrops: TemplateDrop[][] = [
    // Rotate through sets based on month
    [
      { id: `drop-${seed}-1`, name: "Neon SaaS Dashboard", category: "Technology", thumbnail: "https://picsum.photos/seed/neon-saas/400/300", addedAt: new Date(year, month, 1).toISOString(), proExclusive: true },
      { id: `drop-${seed}-2`, name: "Minimalist Agency", category: "Business", thumbnail: "https://picsum.photos/seed/min-agency/400/300", addedAt: new Date(year, month, 1).toISOString(), proExclusive: true },
      { id: `drop-${seed}-3`, name: "Dark Portfolio Pro", category: "Portfolio", thumbnail: "https://picsum.photos/seed/dark-port/400/300", addedAt: new Date(year, month, 1).toISOString(), proExclusive: true },
      { id: `drop-${seed}-4`, name: "Luxury Real Estate", category: "Real Estate", thumbnail: "https://picsum.photos/seed/lux-real/400/300", addedAt: new Date(year, month, 1).toISOString(), proExclusive: true },
      { id: `drop-${seed}-5`, name: "Modern Restaurant", category: "Food & Drink", thumbnail: "https://picsum.photos/seed/mod-rest/400/300", addedAt: new Date(year, month, 1).toISOString(), proExclusive: true },
    ],
    [
      { id: `drop-${seed}-1`, name: "Glassmorphism Landing", category: "Technology", thumbnail: "https://picsum.photos/seed/glass-land/400/300", addedAt: new Date(year, month, 1).toISOString(), proExclusive: true },
      { id: `drop-${seed}-2`, name: "Creator Hub", category: "Portfolio", thumbnail: "https://picsum.photos/seed/creator-hub/400/300", addedAt: new Date(year, month, 1).toISOString(), proExclusive: true },
      { id: `drop-${seed}-3`, name: "E-Commerce Boutique", category: "E-Commerce", thumbnail: "https://picsum.photos/seed/ecom-bout/400/300", addedAt: new Date(year, month, 1).toISOString(), proExclusive: true },
      { id: `drop-${seed}-4`, name: "Health & Wellness", category: "Health", thumbnail: "https://picsum.photos/seed/health-well/400/300", addedAt: new Date(year, month, 1).toISOString(), proExclusive: true },
      { id: `drop-${seed}-5`, name: "Event Conference", category: "Events", thumbnail: "https://picsum.photos/seed/event-conf/400/300", addedAt: new Date(year, month, 1).toISOString(), proExclusive: true },
    ],
  ];

  return allDrops[month % allDrops.length];
}

// ---------------------------------------------------------------------------
// Plan feature comparison (for upgrade modals)
// ---------------------------------------------------------------------------

export interface PlanFeature {
  name: string;
  free: string | boolean;
  creator: string | boolean;
  pro: string | boolean;
  agency: string | boolean;
}

export function getPlanFeatures(): PlanFeature[] {
  return [
    { name: "Monthly builds", free: "3", creator: "15", pro: "50", agency: "200" },
    { name: "Generators", free: "Basic (30+)", creator: "All (43)", pro: "All (43)", agency: "All (43)" },
    { name: "Custom domains", free: false, creator: true, pro: true, agency: true },
    { name: "Remove watermark", free: false, creator: true, pro: true, agency: true },
    { name: "Multi-page sites", free: false, creator: false, pro: true, agency: true },
    { name: "Full-stack apps", free: false, creator: false, pro: true, agency: true },
    { name: "E-commerce", free: false, creator: false, pro: true, agency: true },
    { name: "White-label", free: false, creator: false, pro: false, agency: true },
    { name: "Client portal", free: false, creator: false, pro: false, agency: true },
    { name: "Priority support", free: false, creator: false, pro: true, agency: true },
    { name: "API access", free: false, creator: false, pro: true, agency: true },
  ];
}

export const PLAN_PRICES: Record<string, number> = {
  creator: 19,
  pro: 49,
  agency: 99,
};
