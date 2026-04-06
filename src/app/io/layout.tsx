import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zoobicon API — Programmatic Website Generation",
  description:
    "Build, deploy, and manage websites programmatically via REST API. Generate sites with code, automate deployments, and integrate AI website building into your workflow.",
  openGraph: {
    title: "Zoobicon API — Programmatic Website Generation",
    description:
      "Build, deploy, and manage websites programmatically via REST API. Generate sites with code, automate deployments, and integrate AI website building into your workflow.",
    url: "https://zoobicon.io",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.io" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
