import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zoobicon CLI — Build Websites from Your Terminal",
  description:
    "Command-line website builder. Install via npm, describe your site, deploy to zoobicon.sh in seconds. The fastest way to ship websites from your terminal.",
  openGraph: {
    title: "Zoobicon CLI — Build Websites from Your Terminal",
    description:
      "Command-line website builder. Install via npm, describe your site, deploy to zoobicon.sh in seconds. The fastest way to ship websites from your terminal.",
    url: "https://zoobicon.sh",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.sh" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
