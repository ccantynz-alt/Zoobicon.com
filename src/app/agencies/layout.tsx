import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "White-Label Agency Platform | Zoobicon",
  description:
    "Build websites for clients under your brand. White-label dashboard, client portal, bulk generation, approval workflows, and quota tracking for agencies.",
  openGraph: {
    title: "White-Label Agency Platform | Zoobicon",
    description:
      "Build websites for clients under your brand. White-label dashboard, client portal, bulk generation, approval workflows, and quota tracking for agencies.",
    url: "https://zoobicon.com/agencies",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/agencies" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
