import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace — Zoobicon Add-ons & Extensions",
  description:
    "Extend your Zoobicon sites with premium add-ons. AI Video Creator, SEO tools, analytics, and more.",
  openGraph: {
    title: "Marketplace — Zoobicon Add-ons & Extensions",
    description:
      "Extend your Zoobicon sites with premium add-ons. AI Video Creator, SEO tools, analytics, and more.",
    url: "https://zoobicon.com/marketplace",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/marketplace" },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
