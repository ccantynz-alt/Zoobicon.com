import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | Zoobicon",
  description:
    "Forgot your password? Enter your email to receive a password reset link. Get back to building websites with AI in minutes.",
  openGraph: {
    title: "Reset Password | Zoobicon",
    description:
      "Forgot your password? Enter your email to receive a password reset link and get back to building.",
    url: "https://zoobicon.com/auth/forgot-password",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/auth/forgot-password" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
