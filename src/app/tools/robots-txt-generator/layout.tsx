import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Robots.txt Generator — Control Search Engine Crawling | Zoobicon",
  description: "Generate a robots.txt file for your website in seconds. Block bad bots, control Googlebot crawling, and protect sensitive pages. Free tool.",
  openGraph: {
    title: "Free Robots.txt Generator — Control Search Engine Crawling",
    description: "Generate a robots.txt file for your website in seconds. Block bad bots, control Googlebot crawling, and protect sensitive pages. Free tool.",
    url: "https://zoobicon.com/tools/robots-txt-generator",
    images: [{ url: "https://zoobicon.com/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "Free Robots.txt Generator — Control Search Engine Crawling | Zoobicon",
    description: "Generate a robots.txt file for your website in seconds. Block bad bots, control Googlebot crawling, and protect sensitive pages. Free tool.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/tools/robots-txt-generator" },
  keywords: [
    "robots txt generator", "robots.txt file", "block bots",
    "SEO robots file", "search engine crawling", "disallow directives",
  ],
  robots: "index, follow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
