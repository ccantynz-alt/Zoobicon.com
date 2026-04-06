import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations | Zoobicon Admin",
  description: "Manage third-party integrations. Stripe, Mailgun, OAuth providers, and API connections.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
