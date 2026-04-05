import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free QR Code Generator — Create QR Codes Instantly | Zoobicon",
  description:
    "Generate QR codes for URLs, text, email, phone numbers, and WiFi networks. Free, no signup required. Download as PNG or SVG.",
  openGraph: {
    title: "Free QR Code Generator — Create QR Codes Instantly | Zoobicon",
    description:
      "Generate QR codes for URLs, text, email, phone numbers, and WiFi networks. Free, no signup required.",
    url: "https://zoobicon.com/tools/qr-code-generator",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/tools/qr-code-generator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
