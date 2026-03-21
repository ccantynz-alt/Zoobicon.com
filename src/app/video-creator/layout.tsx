import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Video Creator — Zoobicon",
  description:
    "Create TikTok, YouTube, and Instagram videos with AI. Storyboard, scene images, video rendering, voiceover, and subtitles.",
  openGraph: {
    title: "AI Video Creator — Zoobicon",
    description:
      "Create TikTok, YouTube, and Instagram videos with AI. Storyboard, scene images, video rendering, voiceover, and subtitles.",
    url: "https://zoobicon.com/video-creator",
    siteName: "Zoobicon",
    type: "website",
  },
};

export default function VideoCreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
