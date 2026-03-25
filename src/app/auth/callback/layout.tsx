import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signing In... | Zoobicon",
  description: "Completing authentication. You will be redirected shortly.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
