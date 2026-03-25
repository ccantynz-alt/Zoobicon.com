import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Domain Registration — Zoobicon",
  description:
    "Register your perfect domain. .com, .io, .ai, .dev and more. Instant DNS setup with your Zoobicon site.",
  openGraph: {
    title: "Domain Registration — Zoobicon",
    description:
      "Register your perfect domain. .com, .io, .ai, .dev and more. Instant DNS setup with your Zoobicon site.",
    url: "https://zoobicon.com/domains",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/domains" },
};

export default function DomainsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
