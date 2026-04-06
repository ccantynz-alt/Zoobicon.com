import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Email Marketing — Newsletters & Campaigns | Zoobicon",
  description:
    "Built-in email marketing with AI-written newsletters, automated list building, and one-click send. Replace ConvertKit and Mailchimp. Included in Pro plan.",
  openGraph: {
    title: "AI Email Marketing — Newsletters & Campaigns | Zoobicon",
    description:
      "Built-in email marketing with AI-written newsletters, automated list building, and one-click send.",
    url: "https://zoobicon.com/email-marketing",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/email-marketing" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
