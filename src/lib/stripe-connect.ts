import Stripe from "stripe";

const PLATFORM_FEE_PCT = 0.15;

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY missing — set it in Vercel environment variables to enable Stripe Connect payouts"
    );
  }
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

export interface ConnectedAccountResult {
  accountId: string;
  onboardingUrl: string;
}

export async function createConnectedAccount(
  agencyId: string,
  email: string,
  country: string = "US"
): Promise<ConnectedAccountResult> {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    country,
    email,
    metadata: { agencyId },
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL || "https://zoobicon.com";
  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${base}/agency/connect?refresh=1&agency=${encodeURIComponent(agencyId)}`,
    return_url: `${base}/agency/connect?done=1&agency=${encodeURIComponent(agencyId)}`,
    type: "account_onboarding",
  });

  return { accountId: account.id, onboardingUrl: link.url };
}

export interface AccountStatus {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

export async function getAccountStatus(accountId: string): Promise<AccountStatus> {
  const stripe = getStripe();
  const acct = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: acct.charges_enabled ?? false,
    payoutsEnabled: acct.payouts_enabled ?? false,
    detailsSubmitted: acct.details_submitted ?? false,
  };
}

export async function createTransfer(
  accountId: string,
  amountCents: number,
  currency: string,
  description: string
): Promise<Stripe.Transfer> {
  const stripe = getStripe();
  if (amountCents <= 0) {
    throw new Error("Transfer amount must be greater than zero");
  }
  return stripe.transfers.create({
    amount: Math.round(amountCents),
    currency: currency.toLowerCase(),
    destination: accountId,
    description,
  });
}

export interface MonthlyPayout {
  agencyId: string;
  grossCents: number;
  platformFeeCents: number;
  netCents: number;
  currency: string;
}

export async function computeMonthlyPayout(agencyId: string): Promise<MonthlyPayout> {
  const mod = (await import("./agency-reseller")) as {
    getBillingReport: (agencyId: string) => Promise<{
      monthlyMargin: number;
      monthlyRevenue: number;
    }>;
  };
  const report = await mod.getBillingReport(agencyId);
  // Reseller earns the margin (revenue minus our wholesale cost). Platform takes 15% of that.
  const grossCents = Math.max(0, Math.round((report.monthlyMargin || 0) * 100));
  const platformFeeCents = Math.round(grossCents * PLATFORM_FEE_PCT);
  const netCents = grossCents - platformFeeCents;
  return {
    agencyId,
    grossCents,
    platformFeeCents,
    netCents,
    currency: "usd",
  };
}
