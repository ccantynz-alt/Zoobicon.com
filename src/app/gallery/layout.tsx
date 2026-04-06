import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prompt Gallery — Community Creations | Zoobicon",
  description:
    "Browse websites built by the Zoobicon community. See the prompts behind each site, get inspired, and remix your favorites. Updated daily.",
  openGraph: {
    title: "Prompt Gallery — Community Creations | Zoobicon",
    description:
      "Browse websites built by the Zoobicon community. See the prompts behind each site, get inspired, and remix your favorites. Updated daily.",
    url: "https://zoobicon.com/gallery",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/gallery" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
