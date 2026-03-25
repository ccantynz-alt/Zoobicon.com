import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hosting — Zoobicon",
  description:
    "Deploy your AI-generated websites instantly. Global CDN, SSL, custom domains, and version history included.",
  openGraph: {
    title: "Hosting — Zoobicon",
    description:
      "Deploy your AI-generated websites instantly. Global CDN, SSL, custom domains, and version history included.",
    url: "https://zoobicon.com/hosting",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/hosting" },
};

export default function HostingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
