import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Dictation & Voice-to-Text Software — Speak, It Types | Zoobicon",
  description:
    "Turn speech into text instantly with AI-powered dictation. 99% accuracy, 50+ languages, punctuation auto-added. Faster than typing. Works in any app.",
  keywords: [
    "AI dictation software",
    "voice to text",
    "speech recognition",
    "dictation app",
    "voice typing",
    "transcription software",
  ],
  openGraph: {
    title: "AI Dictation & Voice-to-Text Software — Speak, It Types | Zoobicon",
    description:
      "Turn speech into text instantly with AI-powered dictation. 99% accuracy, 50+ languages, punctuation auto-added. Faster than typing. Works in any app.",
    url: "https://zoobicon.com/products/dictation",
    siteName: "Zoobicon",
    images: [{ url: "https://zoobicon.com/og-image.png" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "AI Dictation & Voice-to-Text Software — Speak, It Types | Zoobicon",
    description:
      "Turn speech into text instantly with AI-powered dictation. 99% accuracy, 50+ languages, punctuation auto-added. Faster than typing. Works in any app.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/products/dictation" },
  robots: "index, follow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
