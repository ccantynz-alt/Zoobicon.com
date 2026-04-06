import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competitor Intelligence | Zoobicon Admin",
  description: "Analyze competitor websites. Tech stack detection, SEO analysis, design pattern comparison.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
