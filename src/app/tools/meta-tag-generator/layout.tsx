import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Meta Tag Generator — SEO Title & Description Tool | Zoobicon",
  description: "Generate SEO-optimised meta titles, descriptions, and Open Graph tags instantly. Preview how your page appears in Google and social media. Free.",
  openGraph: {
    title: "Free Meta Tag Generator — SEO Title & Description Tool",
    description: "Generate SEO-optimised meta titles, descriptions, and Open Graph tags instantly. Preview how your page appears in Google and social media. Free.",
    url: "https://zoobicon.com/tools/meta-tag-generator",
    images: [{ url: "https://zoobicon.com/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "Free Meta Tag Generator — SEO Title & Description Tool | Zoobicon",
    description: "Generate SEO-optimised meta titles, descriptions, and Open Graph tags instantly. Preview how your page appears in Google and social media. Free.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/tools/meta-tag-generator" },
  keywords: [
    "meta tag generator", "SEO meta tags", "og tags",
    "meta description generator", "title tag tool",
  ],
  robots: "index, follow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
