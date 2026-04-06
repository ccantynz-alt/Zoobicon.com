import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Starter Kits — Pre-Built Website Templates | Zoobicon",
  description:
    "Jump-start your project with 100+ AI-curated starter kits. Business, e-commerce, portfolio, SaaS, restaurant, and more. One click to customize with AI.",
  openGraph: {
    title: "Starter Kits — Pre-Built Website Templates | Zoobicon",
    description:
      "Jump-start your project with 100+ AI-curated starter kits. Business, e-commerce, portfolio, SaaS, restaurant, and more. One click to customize with AI.",
    url: "https://zoobicon.com/starter-kits",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/starter-kits" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
