import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to your environment variables to enable billing."
    );
  }
  _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  return _stripe;
}

export interface PlanLimits {
  sites: number;
  storage: number;
  apiCalls: number;
  videos: number;
}

export interface PlanTier {
  id: "starter" | "pro" | "agency" | "whitelabel";
  name: string;
  priceCents: number;
  features: string[];
  limits: PlanLimits;
  stripePriceId: string;
}

export const STRIPE_PRICE_IDS: Record<PlanTier["id"], string> = {
  starter: process.env.STRIPE_PRICE_STARTER || "",
  pro: process.env.STRIPE_PRICE_PRO || "",
  agency: process.env.STRIPE_PRICE_AGENCY || "",
  whitelabel: process.env.STRIPE_PRICE_WHITELABEL || "",
};

export const PLAN_TIERS: PlanTier[] = [
  {
    id: "starter",
    name: "Starter",
    priceCents: 4900,
    features: [
      "1 site + domain",
      "3 mailboxes",
      "SSL included",
      "AI website builder",
      "Community support",
    ],
    limits: { sites: 1, storage: 5, apiCalls: 1000, videos: 5 },
    stripePriceId: STRIPE_PRICE_IDS.starter,
  },
  {
    id: "pro",
    name: "Pro",
    priceCents: 12900,
    features: [
      "5 sites",
      "AI auto-reply",
      "AI SEO monitor",
      "Priority support",
      "Custom domain",
    ],
    limits: { sites: 5, storage: 50, apiCalls: 25000, videos: 50 },
    stripePriceId: STRIPE_PRICE_IDS.pro,
  },
  {
    id: "agency",
    name: "Agency",
    priceCents: 29900,
    features: [
      "Unlimited sites",
      "AI video creator",
      "All AI add-ons",
      "Team collaboration",
      "Phone support",
    ],
    limits: { sites: 999, storage: 500, apiCalls: 250000, videos: 500 },
    stripePriceId: STRIPE_PRICE_IDS.agency,
  },
  {
    id: "whitelabel",
    name: "White-label",
    priceCents: 49900,
    features: [
      "Full reseller licence",
      "Custom branding",
      "Reseller dashboard",
      "Client billing",
      "Dedicated support",
    ],
    limits: { sites: 99999, storage: 5000, apiCalls: 2500000, videos: 5000 },
    stripePriceId: STRIPE_PRICE_IDS.whitelabel,
  },
];

export async function createCheckoutSession(
  customerId: string | null | undefined,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string
): Promise<string> {
  const stripe = getStripe();
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  };
  if (customerId) {
    params.customer = customerId;
  } else if (customerEmail) {
    params.customer_email = customerEmail;
  }
  const session = await stripe.checkout.sessions.create(params);
  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }
  return session.url;
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

export async function upgradeSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const itemId = sub.items.data[0]?.id;
  if (!itemId) {
    throw new Error(`Subscription ${subscriptionId} has no items to upgrade`);
  }
  const updated = await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: itemId, price: newPriceId }],
    proration_behavior: "create_prorations",
    payment_behavior: "pending_if_incomplete",
  });
  return updated;
}

export function getPlanById(id: string): PlanTier | undefined {
  return PLAN_TIERS.find((p) => p.id === id);
}
