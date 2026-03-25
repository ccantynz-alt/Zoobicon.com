import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weekly Design Challenges | Zoobicon",
  description:
    "Compete in weekly AI website design challenges. Build the best site for each theme, get featured, and win free Pro months. Join the Zoobicon creator community.",
  openGraph: {
    title: "Weekly Design Challenges | Zoobicon",
    description:
      "Compete in weekly AI website design challenges. Build the best site, get featured, and win prizes.",
    url: "https://zoobicon.com/challenges",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/challenges" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
