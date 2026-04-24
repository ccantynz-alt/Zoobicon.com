import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free JSON Formatter & Validator — Beautify JSON Online | Zoobicon",
  description: "Format, validate, and minify JSON instantly in your browser. Syntax highlighting, error detection, and one-click copy. Free JSON beautifier tool.",
  openGraph: {
    title: "Free JSON Formatter & Validator — Beautify JSON Online",
    description: "Format, validate, and minify JSON instantly in your browser. Syntax highlighting, error detection, and one-click copy. Free JSON beautifier tool.",
    url: "https://zoobicon.com/tools/json-formatter",
    images: [{ url: "https://zoobicon.com/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "Free JSON Formatter & Validator — Beautify JSON Online | Zoobicon",
    description: "Format, validate, and minify JSON instantly in your browser. Syntax highlighting, error detection, and one-click copy. Free JSON beautifier tool.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/tools/json-formatter" },
  keywords: [
    "JSON formatter", "JSON validator", "JSON beautifier",
    "format JSON online", "minify JSON", "JSON editor",
  ],
  robots: "index, follow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
