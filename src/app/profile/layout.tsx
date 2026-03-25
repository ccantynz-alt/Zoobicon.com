import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Profile | Zoobicon",
  description:
    "View a Zoobicon creator's public portfolio. Browse their AI-generated websites, stats, and creation history. Follow creators and remix their work.",
  openGraph: {
    title: "Creator Profile | Zoobicon",
    description:
      "View a Zoobicon creator's public portfolio of AI-generated websites, stats, and creation history.",
    url: "https://zoobicon.com/profile",
    siteName: "Zoobicon",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
