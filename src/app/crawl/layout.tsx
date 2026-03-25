import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Crawler — Competitor Analysis | Zoobicon",
  description:
    "Crawl and analyze any website. Detect tech stacks, SEO structure, design patterns, and performance metrics. AI-powered competitive intelligence.",
  openGraph: {
    title: "Website Crawler — Competitor Analysis | Zoobicon",
    description:
      "Crawl and analyze any website. Detect tech stacks, SEO structure, and performance metrics.",
    url: "https://zoobicon.com/crawl",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/crawl" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
