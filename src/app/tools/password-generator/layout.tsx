import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Password Generator — Strong Secure Passwords | Zoobicon",
  description:
    "Generate strong, secure passwords instantly. Customize length, characters, and complexity. Free, no signup required.",
  openGraph: {
    title: "Free Password Generator — Strong Secure Passwords | Zoobicon",
    description:
      "Generate strong, secure passwords instantly. Customize length, characters, and complexity. Free, no signup required.",
    url: "https://zoobicon.com/tools/password-generator",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/tools/password-generator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
