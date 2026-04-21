import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Business Name Generator — Instant Domain Check | Zoobicon",
  description: "Generate creative business names with AI. Instantly check domain availability across .com, .ai, .io, .sh and 10 more extensions. Free, no signup required.",
  openGraph: {
    title: "Free AI Business Name Generator + Domain Check",
    description: "AI generates 20 creative names for your business. Each one instantly checked across 13 domain extensions. Free.",
    url: "https://zoobicon.com/tools/business-name-generator",
  },
  alternates: { canonical: "https://zoobicon.com/tools/business-name-generator" },
  keywords: [
    "business name generator", "company name generator", "brand name generator",
    "ai business name", "free business name generator", "domain name generator",
    "startup name generator", "business name ideas", "creative business names",
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
