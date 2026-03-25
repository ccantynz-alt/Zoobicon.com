import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digital Product Store — Sell Online | Zoobicon",
  description:
    "Sell PDFs, templates, courses, and digital products directly on your Zoobicon site. Stripe checkout, automatic file delivery, and license key management.",
  openGraph: {
    title: "Digital Product Store — Sell Online | Zoobicon",
    description:
      "Sell PDFs, templates, courses, and digital products directly on your site. Stripe checkout and automatic delivery.",
    url: "https://zoobicon.com/store",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/store" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
