import Stripe from "stripe";

let _stripe: Stripe;

export function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});

// ---------------------------------------------------------------------------
// Plan + Price configuration
// ---------------------------------------------------------------------------

export type PlanSlug = "creator" | "pro" | "agency" | "whitelabel";
export type BillingInterval = "monthly" | "annual";

export interface PlanConfig {
  name: string;
  monthlyPrice: number;
  annualPrice: number; // per month when billed annually
  annualTotal: number; // total per year
  features: string[];
}

export const PLANS: Record<PlanSlug, PlanConfig> = {
  creator: {
    name: "Creator",
    monthlyPrice: 29,
    annualPrice: 23, // ~20% off
    annualTotal: 276,
    features: [
      "15 AI-generated websites per month",
      "100 AI edits per month",
      "Full 10-agent pipeline",
      "Custom domain support",
      "React + Next.js export",
      "GitHub & WordPress export",
      "Permanent hosting included",
      "SEO tools",
      "Email support",
      "API access (10K req/mo)",
    ],
  },
  pro: {
    name: "Pro",
    monthlyPrice: 79,
    annualPrice: 63, // ~20% off
    annualTotal: 756,
    features: [
      "50 AI-generated websites per month",
      "500 AI edits per month",
      "Everything in Creator, plus:",
      "AI-generated images (DALL-E / FLUX)",
      "Full SEO Campaign Agent",
      "AI Video Creator",
      "AI Email Support & Marketing",
      "AI Brand Kit",
      "Chatbot Builder",
      "A/B Testing & Analytics",
      "Priority support",
      "API access (100K req/mo)",
    ],
  },
  agency: {
    name: "Agency",
    monthlyPrice: 299,
    annualPrice: 239, // ~20% off
    annualTotal: 2868,
    features: [
      "200 AI-generated websites per month",
      "Unlimited AI edits",
      "Everything in Pro, plus:",
      "White-label platform (your brand)",
      "Client handoff & management",
      "Team seats (up to 10)",
      "Template marketplace access",
      "Bulk operations & automation",
      "API access (500K req/mo)",
      "Priority Slack support",
    ],
  },
  whitelabel: {
    name: "White-Label",
    monthlyPrice: 499,
    annualPrice: 399, // ~20% off
    annualTotal: 4788,
    features: [
      "Unlimited generations & edits",
      "Everything in Agency, plus:",
      "Full platform reseller licence",
      "Custom AI model training",
      "Dedicated AI agents",
      "Unlimited API access",
      "SSO / SAML authentication",
      "Custom integrations",
      "SLA guarantee (99.99%)",
      "Dedicated account manager",
      "Invoiced billing (NET 30)",
    ],
  },
};

// Monthly Stripe Price IDs (set in Vercel env vars)
export const PRICE_IDS_MONTHLY: Record<PlanSlug, string> = {
  creator: process.env.STRIPE_PRICE_CREATOR ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
  agency: process.env.STRIPE_PRICE_AGENCY ?? "",
  whitelabel: process.env.STRIPE_PRICE_WHITELABEL ?? "",
};

// Annual Stripe Price IDs (set in Vercel env vars)
export const PRICE_IDS_ANNUAL: Record<PlanSlug, string> = {
  creator: process.env.STRIPE_PRICE_CREATOR_ANNUAL ?? "",
  pro: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "",
  agency: process.env.STRIPE_PRICE_AGENCY_ANNUAL ?? "",
  whitelabel: process.env.STRIPE_PRICE_WHITELABEL_ANNUAL ?? "",
};

/** Resolve plan + interval → Stripe Price ID */
export function getPriceId(
  plan: string,
  interval: BillingInterval = "monthly"
): string {
  const slug = plan as PlanSlug;
  if (interval === "annual") {
    return PRICE_IDS_ANNUAL[slug] || PRICE_IDS_MONTHLY[slug] || "";
  }
  return PRICE_IDS_MONTHLY[slug] || "";
}

// Backwards compat exports
export const CREATOR_PRICE_ID = PRICE_IDS_MONTHLY.creator;
export const PRO_PRICE_ID = PRICE_IDS_MONTHLY.pro;
export const AGENCY_PRICE_ID = PRICE_IDS_MONTHLY.agency;

export const PLAN_PRICE_IDS: Record<string, string> = {
  creator: CREATOR_PRICE_ID,
  pro: PRO_PRICE_ID,
  agency: AGENCY_PRICE_ID,
  whitelabel: PRICE_IDS_MONTHLY.whitelabel,
};

export const PLAN_NAMES: Record<string, string> = {
  creator: "Creator",
  pro: "Pro",
  agency: "Agency",
  whitelabel: "White-Label",
};
