import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pre-Launch Checklist | Zoobicon Admin",
  description:
    "75+ checklist items across 12 categories for production readiness. Infrastructure, security, payments, SEO, performance, and more.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
