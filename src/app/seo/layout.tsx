import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO Dashboard — Analyze & Optimize | Zoobicon",
  description:
    "AI-powered SEO analysis for your websites. Scan meta tags, headings, schema markup, keyword density, and performance. Get actionable optimization recommendations.",
  openGraph: {
    title: "SEO Dashboard — Analyze & Optimize | Zoobicon",
    description:
      "AI-powered SEO analysis for your websites. Scan meta tags, headings, schema markup, keyword density, and performance. Get actionable optimization recommendations.",
    url: "https://zoobicon.com/seo",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/seo" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
