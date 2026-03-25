import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Marketplace — Sell Website Templates | Zoobicon",
  description:
    "List and sell your AI-generated website templates. Earn 70% on every sale. Join the Zoobicon creator economy and monetize your design skills.",
  openGraph: {
    title: "Creator Marketplace — Sell Website Templates | Zoobicon",
    description:
      "List and sell your AI-generated website templates. Earn 70% on every sale in the creator economy.",
    url: "https://zoobicon.com/creator-marketplace",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/creator-marketplace" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
