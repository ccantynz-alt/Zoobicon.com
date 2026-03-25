import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Your Email | Zoobicon",
  description:
    "Verify your email address to activate your Zoobicon account and start building AI-powered websites.",
  openGraph: {
    title: "Verify Your Email | Zoobicon",
    description: "Verify your email address to activate your Zoobicon account.",
    url: "https://zoobicon.com/auth/verify-email",
    siteName: "Zoobicon",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
