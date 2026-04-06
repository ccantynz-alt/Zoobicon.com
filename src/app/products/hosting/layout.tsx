import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Hosting — Deploy to zoobicon.sh | Zoobicon",
  description:
    "One-click deployment to zoobicon.sh with free SSL, global CDN, version history, and custom domains. Your AI-built websites go live in seconds.",
  openGraph: {
    title: "Website Hosting — Deploy to zoobicon.sh | Zoobicon",
    description:
      "One-click deployment to zoobicon.sh with free SSL, global CDN, version history, and custom domains. Your AI-built websites go live in seconds.",
    url: "https://zoobicon.com/products/hosting",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/products/hosting" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
