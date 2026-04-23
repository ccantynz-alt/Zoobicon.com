import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Invoice Generator — Create Professional Invoices | Zoobicon",
  description: "Create and download professional invoices in seconds. Add your logo, line items, tax, and payment terms. Free invoice maker — no account needed.",
  openGraph: {
    title: "Free Invoice Generator — Create Professional Invoices",
    description: "Create and download professional invoices in seconds. Add your logo, line items, tax, and payment terms. Free invoice maker — no account needed.",
    url: "https://zoobicon.com/tools/invoice-generator",
    images: [{ url: "https://zoobicon.com/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "Free Invoice Generator — Create Professional Invoices | Zoobicon",
    description: "Create and download professional invoices in seconds. Add your logo, line items, tax, and payment terms. Free invoice maker — no account needed.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/tools/invoice-generator" },
  keywords: [
    "free invoice generator", "invoice maker", "create invoice online",
    "invoice template", "PDF invoice",
  ],
  robots: "index, follow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
