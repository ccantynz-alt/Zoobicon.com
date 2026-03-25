import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Content Writer — Blog & Copy Generation | Zoobicon",
  description:
    "Generate blog posts, marketing copy, product descriptions, and landing page content with AI. SEO-optimized writing in your brand voice.",
  openGraph: {
    title: "AI Content Writer — Blog & Copy Generation | Zoobicon",
    description:
      "Generate blog posts, marketing copy, and product descriptions with AI. SEO-optimized writing in your brand voice.",
    url: "https://zoobicon.com/content-writer",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/content-writer" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
