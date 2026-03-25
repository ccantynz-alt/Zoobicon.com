import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Invoicing & Proposals — Get Paid Faster | Zoobicon",
  description:
    "Generate professional invoices and proposals with AI. Auto-calculated taxes, email delivery, open tracking, and Stripe payments. Replace FreshBooks for free.",
  openGraph: {
    title: "AI Invoicing & Proposals — Get Paid Faster | Zoobicon",
    description:
      "Generate professional invoices and proposals with AI. Auto-calculated taxes, email delivery, and Stripe payments.",
    url: "https://zoobicon.com/invoicing",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/invoicing" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
