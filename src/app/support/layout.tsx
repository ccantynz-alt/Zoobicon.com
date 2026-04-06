import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support — Zoobicon",
  description:
    "Get help with Zoobicon. Browse FAQs, contact support, or submit a ticket.",
  openGraph: {
    title: "Support — Zoobicon",
    description:
      "Get help with Zoobicon. Browse FAQs, contact support, or submit a ticket.",
    url: "https://zoobicon.com/support",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/support" },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
