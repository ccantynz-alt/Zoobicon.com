import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal — Project Review & Approval | Zoobicon",
  description:
    "Review and approve websites built by your agency. White-labeled client portal with project status, deliverable previews, and feedback tools.",
  openGraph: {
    title: "Client Portal — Project Review & Approval | Zoobicon",
    description:
      "Review and approve agency-built websites. White-labeled client portal with project status and feedback.",
    url: "https://zoobicon.com/agencies/portal",
    siteName: "Zoobicon",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
