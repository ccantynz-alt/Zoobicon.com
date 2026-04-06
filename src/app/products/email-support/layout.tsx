import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Email Support — Smart Ticketing System | Zoobicon",
  description:
    "AI-powered email support with automatic ticket routing, CSAT tracking, canned responses, SLA monitoring, and smart auto-replies. Handle support 10x faster.",
  openGraph: {
    title: "AI Email Support — Smart Ticketing System | Zoobicon",
    description:
      "AI-powered email support with automatic ticket routing, CSAT tracking, canned responses, SLA monitoring, and smart auto-replies. Handle support 10x faster.",
    url: "https://zoobicon.com/products/email-support",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/products/email-support" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
