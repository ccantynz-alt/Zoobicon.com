// ---------------------------------------------------------------------------
// Agency Plan Limits & Enforcement
//
// Controls seats, generation quotas, and feature access per agency plan.
// ---------------------------------------------------------------------------

export interface AgencyPlanLimits {
  maxMembers: number;       // Team seats (including owner)
  maxClients: number;       // Client accounts
  maxSites: number;         // Total sites under management
  monthlyGenerations: number; // AI generations per month
  bulkGeneration: boolean;  // Can use bulk generation
  whiteLabel: boolean;      // Custom branding on builder + output
  customDomain: boolean;    // Custom domain for client portal
  apiAccess: boolean;       // Programmatic access
}

const AGENCY_PLANS: Record<string, AgencyPlanLimits> = {
  starter: {
    maxMembers: 2,
    maxClients: 5,
    maxSites: 10,
    monthlyGenerations: 25,
    bulkGeneration: false,
    whiteLabel: false,
    customDomain: false,
    apiAccess: false,
  },
  growth: {
    maxMembers: 5,
    maxClients: 25,
    maxSites: 50,
    monthlyGenerations: 100,
    bulkGeneration: true,
    whiteLabel: true,
    customDomain: false,
    apiAccess: false,
  },
  professional: {
    maxMembers: 15,
    maxClients: 100,
    maxSites: 200,
    monthlyGenerations: 500,
    bulkGeneration: true,
    whiteLabel: true,
    customDomain: true,
    apiAccess: true,
  },
  enterprise: {
    maxMembers: Infinity,
    maxClients: Infinity,
    maxSites: Infinity,
    monthlyGenerations: Infinity,
    bulkGeneration: true,
    whiteLabel: true,
    customDomain: true,
    apiAccess: true,
  },
};

export function getAgencyPlanLimits(plan: string): AgencyPlanLimits {
  return AGENCY_PLANS[plan] || AGENCY_PLANS.starter;
}

export interface LimitCheck {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
}

export function checkMemberLimit(plan: string, currentMembers: number): LimitCheck {
  const limits = getAgencyPlanLimits(plan);
  return {
    allowed: currentMembers < limits.maxMembers,
    reason: currentMembers >= limits.maxMembers
      ? `Your ${plan} plan allows up to ${limits.maxMembers} team members. Upgrade to add more.`
      : undefined,
    current: currentMembers,
    limit: limits.maxMembers,
  };
}

export function checkClientLimit(plan: string, currentClients: number): LimitCheck {
  const limits = getAgencyPlanLimits(plan);
  return {
    allowed: currentClients < limits.maxClients,
    reason: currentClients >= limits.maxClients
      ? `Your ${plan} plan allows up to ${limits.maxClients} clients. Upgrade to add more.`
      : undefined,
    current: currentClients,
    limit: limits.maxClients,
  };
}

export function checkSiteLimit(plan: string, currentSites: number): LimitCheck {
  const limits = getAgencyPlanLimits(plan);
  return {
    allowed: currentSites < limits.maxSites,
    reason: currentSites >= limits.maxSites
      ? `Your ${plan} plan allows up to ${limits.maxSites} sites. Upgrade to add more.`
      : undefined,
    current: currentSites,
    limit: limits.maxSites,
  };
}

export function checkGenerationLimit(plan: string, currentGenerations: number): LimitCheck {
  const limits = getAgencyPlanLimits(plan);
  return {
    allowed: currentGenerations < limits.monthlyGenerations,
    reason: currentGenerations >= limits.monthlyGenerations
      ? `Your ${plan} plan allows ${limits.monthlyGenerations} generations/month. Upgrade for more.`
      : undefined,
    current: currentGenerations,
    limit: limits.monthlyGenerations,
  };
}

export function checkFeatureAccess(plan: string, feature: "bulkGeneration" | "whiteLabel" | "customDomain" | "apiAccess"): { allowed: boolean; reason?: string } {
  const limits = getAgencyPlanLimits(plan);
  const allowed = limits[feature];
  return {
    allowed,
    reason: !allowed ? `${feature.replace(/([A-Z])/g, " $1").trim()} requires the Growth plan or higher.` : undefined,
  };
}
