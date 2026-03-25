import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voice Dictation — Speak to Build | Zoobicon",
  description:
    "Build websites by speaking. Voice-to-text AI dictation converts your spoken description into a production-ready website. Hands-free website creation.",
  openGraph: {
    title: "Voice Dictation — Speak to Build | Zoobicon",
    description:
      "Build websites by speaking. Voice-to-text AI dictation converts spoken descriptions into production-ready websites.",
    url: "https://zoobicon.com/dictation",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/dictation" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
