import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agency Dashboard — Client Management | Zoobicon",
  description:
    "Manage agency clients, track AI generation quotas, review approval workflows, and monitor white-label deployments from your agency command center.",
  openGraph: {
    title: "Agency Dashboard — Client Management | Zoobicon",
    description:
      "Manage agency clients, track quotas, and monitor white-label deployments from your agency dashboard.",
    url: "https://zoobicon.com/agencies/dashboard",
    siteName: "Zoobicon",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
