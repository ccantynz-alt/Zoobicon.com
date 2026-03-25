import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set New Password | Zoobicon",
  description:
    "Create a new password for your Zoobicon account. Enter your new password to regain access to the AI website builder.",
  openGraph: {
    title: "Set New Password | Zoobicon",
    description: "Create a new password for your Zoobicon account.",
    url: "https://zoobicon.com/auth/reset-password",
    siteName: "Zoobicon",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
