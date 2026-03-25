import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Health Monitor | Zoobicon Admin",
  description: "Monitor Zoobicon platform health, API status, database connections, and service uptime.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
