import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Inbox | Zoobicon Admin",
  description: "Admin email inbox for Zoobicon platform. View and manage inbound emails.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
