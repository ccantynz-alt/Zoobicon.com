import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hosting Dashboard — Manage Deployments | Zoobicon",
  description:
    "Monitor and manage your deployed websites. View uptime, bandwidth, SSL status, deployment history, and configure custom domains for all your sites.",
  openGraph: {
    title: "Hosting Dashboard — Manage Deployments | Zoobicon",
    description:
      "Monitor and manage your deployed websites. View uptime, bandwidth, SSL status, and deployment history.",
    url: "https://zoobicon.com/hosting/dashboard",
    siteName: "Zoobicon",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
