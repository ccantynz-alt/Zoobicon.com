import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Website Builder — Zoobicon",
  description:
    "Describe your website and watch 7 AI agents build it live. Full-stack apps, e-commerce stores, multi-page sites — all from a single prompt.",
  openGraph: {
    title: "AI Website Builder — Zoobicon",
    description:
      "Describe your website and watch 7 AI agents build it live. Full-stack apps, e-commerce stores, multi-page sites — all from a single prompt.",
    url: "https://zoobicon.com/builder",
    siteName: "Zoobicon",
    type: "website",
  },
};

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
