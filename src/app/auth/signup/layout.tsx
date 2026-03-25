import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Start Building Free | Zoobicon",
  description:
    "Sign up for Zoobicon and start building websites with AI for free. No credit card required. Create your first site in 60 seconds with 7 AI agents.",
  openGraph: {
    title: "Create Account — Start Building Free | Zoobicon",
    description:
      "Sign up for Zoobicon and start building websites with AI for free. No credit card required. Create your first site in 60 seconds.",
    url: "https://zoobicon.com/auth/signup",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/auth/signup" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
