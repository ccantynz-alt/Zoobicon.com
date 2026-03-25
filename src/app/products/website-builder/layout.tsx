import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Website Builder — Build Sites in 60 Seconds | Zoobicon",
  description:
    "The most powerful AI website builder. 7-agent pipeline powered by Claude Opus builds production-ready sites in 60 seconds. 100+ templates, visual editor, one-click deploy.",
  openGraph: {
    title: "AI Website Builder — Build Sites in 60 Seconds | Zoobicon",
    description:
      "The most powerful AI website builder. 7-agent pipeline powered by Claude Opus builds production-ready sites in 60 seconds. 100+ templates, visual editor, one-click deploy.",
    url: "https://zoobicon.com/products/website-builder",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/products/website-builder" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
