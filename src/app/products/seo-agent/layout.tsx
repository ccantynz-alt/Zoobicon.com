import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI SEO Agent — Automated SEO Optimization | Zoobicon",
  description:
    "AI-powered SEO analysis and optimization. Automated meta tags, schema markup, heading hierarchy, keyword density, and content scoring. Boost rankings with one click.",
  openGraph: {
    title: "AI SEO Agent — Automated SEO Optimization | Zoobicon",
    description:
      "AI-powered SEO analysis and optimization. Automated meta tags, schema markup, heading hierarchy, keyword density, and content scoring. Boost rankings with one click.",
    url: "https://zoobicon.com/products/seo-agent",
    siteName: "Zoobicon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "AI SEO Agent — Automated SEO Optimization | Zoobicon",
    description:
      "AI-powered SEO analysis and optimization. Automated meta tags, schema markup, heading hierarchy, keyword density, and content scoring. Boost rankings with one click.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/products/seo-agent" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
