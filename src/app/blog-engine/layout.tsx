import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Blog Engine — Auto-SEO Content Publishing | Zoobicon",
  description:
    "Publish blog posts with automatic SEO optimization. AI generates related posts, internal links, sitemaps, and social captions. Built-in content marketing engine.",
  openGraph: {
    title: "AI Blog Engine — Auto-SEO Content Publishing | Zoobicon",
    description:
      "Publish blog posts with automatic SEO optimization. AI generates related posts, internal links, sitemaps, and social captions.",
    url: "https://zoobicon.com/blog-engine",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/blog-engine" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
