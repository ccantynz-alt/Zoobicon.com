import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Word Counter — Count Words, Characters & Reading Time | Zoobicon",
  description: "Count words, characters, sentences, and paragraphs instantly. See estimated reading time and keyword density. Free online word counter tool.",
  openGraph: {
    title: "Free Word Counter — Count Words, Characters & Reading Time",
    description: "Count words, characters, sentences, and paragraphs instantly. See estimated reading time and keyword density. Free online word counter tool.",
    url: "https://zoobicon.com/tools/word-counter",
    images: [{ url: "https://zoobicon.com/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "Free Word Counter — Count Words, Characters & Reading Time | Zoobicon",
    description: "Count words, characters, sentences, and paragraphs instantly. See estimated reading time and keyword density. Free online word counter tool.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/tools/word-counter" },
  keywords: [
    "word counter", "character counter", "word count tool",
    "reading time calculator", "online word count",
  ],
  robots: "index, follow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
