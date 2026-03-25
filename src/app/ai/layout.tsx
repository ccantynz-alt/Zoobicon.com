import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zoobicon AI — Intelligent Website Generation",
  description:
    "The AI-first website builder. Powered by Claude Opus, GPT-4o, and Gemini 2.5 Pro. 7 specialized agents build production-ready sites from a single prompt.",
  openGraph: {
    title: "Zoobicon AI — Intelligent Website Generation",
    description:
      "The AI-first website builder. Powered by Claude Opus, GPT-4o, and Gemini 2.5 Pro. 7 specialized agents build production-ready sites from a single prompt.",
    url: "https://zoobicon.ai",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.ai" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
