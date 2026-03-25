import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Site Analytics — Traffic & Performance | Zoobicon",
  description:
    "Monitor your website traffic, page views, visitor locations, and conversion rates. Real-time analytics dashboard for all your Zoobicon-hosted sites.",
  openGraph: {
    title: "Site Analytics — Traffic & Performance | Zoobicon",
    description:
      "Monitor your website traffic, page views, visitor locations, and conversion rates. Real-time analytics dashboard for all your Zoobicon-hosted sites.",
    url: "https://zoobicon.com/analytics",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/analytics" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
