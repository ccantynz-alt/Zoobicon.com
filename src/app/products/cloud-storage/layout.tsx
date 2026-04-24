import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Cloud Storage — File Hosting for Websites & Apps | Zoobicon",
  description:
    "Store, share, and serve files for your websites and apps. Fast global CDN, automatic backups, and S3-compatible API. Scales with your business.",
  keywords: [
    "cloud storage",
    "file hosting",
    "S3 compatible storage",
    "website file storage",
    "secure cloud backup",
  ],
  openGraph: {
    title: "Secure Cloud Storage — File Hosting for Websites & Apps | Zoobicon",
    description:
      "Store, share, and serve files for your websites and apps. Fast global CDN, automatic backups, and S3-compatible API. Scales with your business.",
    url: "https://zoobicon.com/products/cloud-storage",
    siteName: "Zoobicon",
    images: [{ url: "https://zoobicon.com/og-image.png" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "Secure Cloud Storage — File Hosting for Websites & Apps | Zoobicon",
    description:
      "Store, share, and serve files for your websites and apps. Fast global CDN, automatic backups, and S3-compatible API. Scales with your business.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/products/cloud-storage" },
  robots: "index, follow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
