import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Manage Your Sites | Zoobicon",
  description:
    "View and manage all your AI-generated websites. Track deployments, monitor traffic, access your build history, and manage account settings.",
  openGraph: {
    title: "Dashboard — Manage Your Sites | Zoobicon",
    description:
      "View and manage all your AI-generated websites. Track deployments, monitor traffic, access your build history, and manage account settings.",
    url: "https://zoobicon.com/dashboard",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/dashboard" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
