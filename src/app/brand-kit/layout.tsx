import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Brand Kit — Colors, Fonts & Voice | Zoobicon",
  description:
    "Create and manage your brand identity with AI. Persistent colors, logos, fonts, brand voice, and tone. Every AI generation automatically pulls from your brand kit.",
  openGraph: {
    title: "AI Brand Kit — Colors, Fonts & Voice | Zoobicon",
    description:
      "Create and manage your brand identity with AI. Persistent colors, logos, fonts, and brand voice for consistent generation.",
    url: "https://zoobicon.com/brand-kit",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/brand-kit" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
