import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "eSIM for Travel — Instant Data in 190+ Countries | Zoobicon",
  description:
    "Get instant mobile data in 190+ countries with Zoobicon eSIM. No physical SIM needed. Activate in 2 minutes. Plans from $4.99. Works on iPhone & Android.",
  keywords: [
    "eSIM travel",
    "international eSIM",
    "travel data plan",
    "eSIM for iPhone",
    "eSIM for Android",
    "global data SIM",
  ],
  openGraph: {
    title: "eSIM for Travel — Instant Data in 190+ Countries | Zoobicon",
    description:
      "Get instant mobile data in 190+ countries with Zoobicon eSIM. No physical SIM needed. Activate in 2 minutes. Plans from $4.99. Works on iPhone & Android.",
    url: "https://zoobicon.com/products/esim",
    siteName: "Zoobicon",
    images: [{ url: "https://zoobicon.com/og-image.png" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "eSIM for Travel — Instant Data in 190+ Countries | Zoobicon",
    description:
      "Get instant mobile data in 190+ countries with Zoobicon eSIM. No physical SIM needed. Activate in 2 minutes. Plans from $4.99. Works on iPhone & Android.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/products/esim" },
  robots: "index, follow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
