import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Content Calendar — Social Media Planner | Zoobicon",
  description:
    "Plan 30 days of social media content with AI. Auto-generated captions, hashtags, and image prompts for TikTok, Instagram, Twitter, and LinkedIn.",
  openGraph: {
    title: "AI Content Calendar — Social Media Planner | Zoobicon",
    description:
      "Plan 30 days of social media content with AI. Auto-generated captions, hashtags, and scheduling.",
    url: "https://zoobicon.com/content-calendar",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/content-calendar" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
