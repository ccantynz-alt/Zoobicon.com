import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operations Dashboard — Zoobicon Admin",
  description: "Platform mission control — health, agents, metrics, and operations.",
  robots: { index: false, follow: false },
};

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
