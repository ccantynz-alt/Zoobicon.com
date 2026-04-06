import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WordPress Theme Export — AI to WordPress | Zoobicon",
  description:
    "Export AI-generated websites as WordPress themes. Compatible with any WordPress installation. One-click download, no coding required.",
  openGraph: {
    title: "WordPress Theme Export — AI to WordPress | Zoobicon",
    description:
      "Export AI-generated websites as WordPress themes. Compatible with any WordPress installation. One-click download, no coding required.",
    url: "https://zoobicon.com/wordpress",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/wordpress" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
