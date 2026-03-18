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

export const CREATOR_PRICE_ID = process.env.STRIPE_CREATOR_PRICE_ID ?? "";
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";
export const AGENCY_PRICE_ID = process.env.STRIPE_AGENCY_PRICE_ID ?? "";

export type PlanSlug = "creator" | "pro" | "agency";

export const PLAN_PRICE_IDS: Record<PlanSlug, string> = {
  creator: CREATOR_PRICE_ID,
  pro: PRO_PRICE_ID,
  agency: AGENCY_PRICE_ID,
};

export const PLAN_NAMES: Record<PlanSlug, string> = {
  creator: "Creator",
  pro: "Pro",
  agency: "Agency",
};
