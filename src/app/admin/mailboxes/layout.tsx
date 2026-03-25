import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mailboxes | Zoobicon Admin",
  description: "Manage email mailboxes, routing rules, and forwarding configuration for the platform.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
