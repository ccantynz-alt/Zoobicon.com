import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Twins — Become your own spokesperson | Zoobicon",
  description:
    "Upload one photo, type a script, get a video of you reading it. Sub-100ms latency, $0.05/minute, no studio. Powered by Hedra Character-3 + Fish Audio S1.",
  keywords: [
    "ai twins",
    "ai spokesperson video",
    "talking head ai video",
    "ai avatar from photo",
    "captions ai twins alternative",
    "hedra character-3",
    "ai video generator",
  ],
  openGraph: {
    title: "AI Twins — Become your own spokesperson | Zoobicon",
    description:
      "Upload one photo, type a script, get a video of you reading it. Sub-100ms latency, $0.05/minute, no studio.",
    url: "https://zoobicon.com/products/ai-twins",
    siteName: "Zoobicon",
    images: [{ url: "https://zoobicon.com/og-image.png" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "AI Twins — Become your own spokesperson | Zoobicon",
    description:
      "Upload one photo, type a script, get a video of you reading it. Sub-100ms latency, $0.05/minute, no studio.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/products/ai-twins" },
  robots: "index, follow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
