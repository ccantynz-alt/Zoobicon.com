import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In to Your Account | Zoobicon",
  description:
    "Log in to your Zoobicon account. Access your AI website builder, manage deployments, and continue building. Sign in with email, Google, or GitHub.",
  openGraph: {
    title: "Sign In to Your Account | Zoobicon",
    description:
      "Log in to your Zoobicon account. Access your AI website builder, manage deployments, and continue building.",
    url: "https://zoobicon.com/auth/login",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/auth/login" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
