import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Zoobicon AI Website Builder",
  description:
    "Simple, transparent pricing. Start free, upgrade when you're ready. Creator $19/mo, Pro $49/mo, Agency $99/mo.",
  openGraph: {
    title: "Pricing — Zoobicon AI Website Builder",
    description:
      "Simple, transparent pricing. Start free, upgrade when you're ready. Creator $19/mo, Pro $49/mo, Agency $99/mo.",
    url: "https://zoobicon.com/pricing",
    siteName: "Zoobicon",
    type: "website",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
