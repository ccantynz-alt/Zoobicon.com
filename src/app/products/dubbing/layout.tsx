import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Video Dub — One click, 50+ languages | Zoobicon",
  description:
    "Translate any video into 50+ languages in seconds. Native voice, lip-synced. Powered by Fish Audio S1 + Hedra Character-3. HeyGen sells this for $29-149/mo. We charge cents per dub.",
  keywords: [
    "ai video dubbing",
    "video translation",
    "multi-language video",
    "ai dubbing",
    "ai video translator",
    "fish audio s1",
    "hedra character-3",
    "heygen alternative",
    "lip sync translation",
  ],
  openGraph: {
    title: "AI Video Dub — One click, 50+ languages | Zoobicon",
    description:
      "Translate any video into 50+ languages in seconds. Native voice, lip-synced. Cents per dub.",
    url: "https://zoobicon.com/products/dubbing",
    siteName: "Zoobicon",
    images: [{ url: "https://zoobicon.com/og-image.png" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "AI Video Dub — One click, 50+ languages | Zoobicon",
    description:
      "Translate any video into 50+ languages in seconds. Native voice, lip-synced. Cents per dub.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/products/dubbing" },
  robots: "index, follow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
