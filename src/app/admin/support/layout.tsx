import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Management | Zoobicon Admin",
  description: "Manage support tickets, knowledge base articles, and customer satisfaction metrics.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
