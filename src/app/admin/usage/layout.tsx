import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Usage Analytics | Zoobicon Admin",
  description: "Monitor platform usage, AI generation counts, API calls, and resource consumption.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
