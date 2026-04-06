import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "43 AI Website Generators — Zoobicon",
  description:
    "Specialized AI generators for every type of website. SaaS, portfolio, restaurant, real estate, e-commerce and 38 more.",
  openGraph: {
    title: "43 AI Website Generators — Zoobicon",
    description:
      "Specialized AI generators for every type of website. SaaS, portfolio, restaurant, real estate, e-commerce and 38 more.",
    url: "https://zoobicon.com/generators",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/generators" },
};

export default function GeneratorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
