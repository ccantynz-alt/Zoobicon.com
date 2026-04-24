import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Privacy Policy Generator — GDPR & CCPA Compliant | Zoobicon",
  description: "Generate a free privacy policy for your website or app in seconds. GDPR, CCPA, and CalOPPA compliant. Customise for your business and download instantly.",
  openGraph: {
    title: "Free Privacy Policy Generator — GDPR & CCPA Compliant",
    description: "Generate a free privacy policy for your website or app in seconds. GDPR, CCPA, and CalOPPA compliant. Customise for your business and download instantly.",
    url: "https://zoobicon.com/tools/privacy-policy-generator",
    images: [{ url: "https://zoobicon.com/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "Free Privacy Policy Generator — GDPR & CCPA Compliant | Zoobicon",
    description: "Generate a free privacy policy for your website or app in seconds. GDPR, CCPA, and CalOPPA compliant. Customise for your business and download instantly.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/tools/privacy-policy-generator" },
  keywords: [
    "free privacy policy generator", "GDPR privacy policy", "CCPA privacy policy",
    "privacy policy template", "website privacy policy",
  ],
  robots: "index, follow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
