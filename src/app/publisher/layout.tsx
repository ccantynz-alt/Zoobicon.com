import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cross-Platform Publisher — Post Everywhere | Zoobicon",
  description:
    "Publish one post to every platform simultaneously. AI reformats for TikTok, Instagram, Twitter, LinkedIn, Facebook, and Reddit. Replace Buffer for free.",
  openGraph: {
    title: "Cross-Platform Publisher — Post Everywhere | Zoobicon",
    description:
      "Publish one post to every platform simultaneously. AI reformats for TikTok, Instagram, Twitter, LinkedIn, and more.",
    url: "https://zoobicon.com/publisher",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/publisher" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
