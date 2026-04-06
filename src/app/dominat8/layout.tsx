import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dominat8 — AI Website Builder for Bold Brands",
  description:
    "Build websites that dominate your market. Bold designs, aggressive copy, high-conversion layouts. The AI website builder for brands that refuse to blend in.",
  openGraph: {
    title: "Dominat8 — AI Website Builder for Bold Brands",
    description:
      "Build websites that dominate your market. Bold designs, aggressive copy, high-conversion layouts. The AI website builder for brands that refuse to blend in.",
    url: "https://dominat8.io",
    siteName: "Dominat8",
    type: "website",
  },
  alternates: { canonical: "https://dominat8.io" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
