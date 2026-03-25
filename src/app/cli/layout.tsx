import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zoobicon CLI — Terminal Website Builder",
  description:
    "Build and deploy websites from your terminal. npm install -g zoobicon, describe your site, deploy to zoobicon.sh. Developer-first AI website generation.",
  openGraph: {
    title: "Zoobicon CLI — Terminal Website Builder",
    description:
      "Build and deploy websites from your terminal. npm install -g zoobicon, describe your site, deploy to zoobicon.sh. Developer-first AI website generation.",
    url: "https://zoobicon.com/cli",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/cli" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
