import Stripe from "stripe";

let _stripe: Stripe;

export function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
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

export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";
export const CREATOR_PRICE_ID = process.env.STRIPE_CREATOR_PRICE_ID ?? "";
export const AGENCY_PRICE_ID = process.env.STRIPE_AGENCY_PRICE_ID ?? "";

/** Map plan name → Stripe Price ID */
export function getPriceId(plan: string): string {
  switch (plan) {
    case "creator": return CREATOR_PRICE_ID;
    case "pro": return PRO_PRICE_ID;
    case "agency": return AGENCY_PRICE_ID;
    default: return PRO_PRICE_ID;
  }
}
