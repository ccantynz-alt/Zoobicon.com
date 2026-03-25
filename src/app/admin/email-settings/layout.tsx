import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Settings — Mailgun Configuration | Zoobicon Admin",
  description:
    "Configure Mailgun email integration, SMTP settings, and notification preferences for the Zoobicon platform.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
