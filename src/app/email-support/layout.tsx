import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Support Dashboard — Ticket Management | Zoobicon",
  description:
    "Manage support tickets with AI-powered auto-replies, CSAT tracking, SLA monitoring, canned responses, and agent collision detection. Enterprise-grade ticketing.",
  openGraph: {
    title: "Email Support Dashboard — Ticket Management | Zoobicon",
    description:
      "Manage support tickets with AI-powered auto-replies, CSAT tracking, SLA monitoring, canned responses, and agent collision detection. Enterprise-grade ticketing.",
    url: "https://zoobicon.com/email-support",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/email-support" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
