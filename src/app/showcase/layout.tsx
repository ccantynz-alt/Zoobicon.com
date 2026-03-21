import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Showcase — Sites Built with Zoobicon",
  description:
    "Browse websites, apps, and stores built by Zoobicon's AI. Get inspired and start building your own.",
  openGraph: {
    title: "Showcase — Sites Built with Zoobicon",
    description:
      "Browse websites, apps, and stores built by Zoobicon's AI. Get inspired and start building your own.",
    url: "https://zoobicon.com/showcase",
    siteName: "Zoobicon",
    type: "website",
  },
};

export default function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
