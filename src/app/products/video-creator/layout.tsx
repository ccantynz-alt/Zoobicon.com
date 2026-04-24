import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Video Creator — Generate Marketing Videos | Zoobicon",
  description:
    "Create professional marketing videos with AI. Script generation, storyboard, scene images, voiceover, and subtitles in one pipeline. TikTok, YouTube, and Reels ready.",
  openGraph: {
    title: "AI Video Creator — Generate Marketing Videos | Zoobicon",
    description:
      "Create professional marketing videos with AI. Script generation, storyboard, scene images, voiceover, and subtitles in one pipeline. TikTok, YouTube, and Reels ready.",
    url: "https://zoobicon.com/products/video-creator",
    siteName: "Zoobicon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "AI Video Creator — Generate Marketing Videos | Zoobicon",
    description:
      "Create professional marketing videos with AI. Script generation, storyboard, scene images, voiceover, and subtitles in one pipeline. TikTok, YouTube, and Reels ready.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/products/video-creator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
