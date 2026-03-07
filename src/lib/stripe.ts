import Stripe from "stripe";

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
  });
}

let _stripe: Stripe | null = null;
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    if (!_stripe) _stripe = getStripe();
    return Reflect.get(_stripe, prop, receiver);
  },
});

export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";
