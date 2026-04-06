import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared Website Preview | Zoobicon",
  description:
    "Preview a shared AI-generated website. Built with Zoobicon — the AI website builder that creates production-ready sites in 60 seconds.",
  openGraph: {
    title: "Shared Website Preview | Zoobicon",
    description: "Preview a shared AI-generated website built with Zoobicon.",
    url: "https://zoobicon.com/shared",
    siteName: "Zoobicon",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
