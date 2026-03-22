import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import GlobalChat from "@/components/GlobalChat";


const BRAND_META: Record<string, {
  title: string;
  description: string;
  appleTitle: string;
  url: string;
  siteName: string;
  ogTitle: string;
  ogDescription: string;
}> = {
  zoobicon: {
    title: "ZOOBICON — AI Website Builder | Build Websites in 60 Seconds",
    description: "7 AI agents collaborate to build production-ready websites, SaaS apps, and e-commerce stores from a single prompt. No templates. No code. No limits.",
    appleTitle: "Zoobicon",
    url: "https://zoobicon.com",
    siteName: "Zoobicon",
    ogTitle: "Build Any Website in 60 Seconds with AI",
    ogDescription: "7 AI agents. One prompt. Production-ready websites, apps, and stores. Try free — no credit card required.",
  },
  dominat8: {
    title: "DOMINAT8 — AI Website Builder | Dominate Your Market",
    description: "Dominate your market with AI-powered websites. Build, deploy, conquer — in seconds, not weeks.",
    appleTitle: "Dominat8",
    url: "https://dominat8.io",
    siteName: "Dominat8",
    ogTitle: "Dominate Your Market with AI-Powered Websites",
    ogDescription: "Your competitors are not ready. Build killer websites, landing pages, and apps in seconds with AI.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const brandId = headersList.get("x-brand-id") || "zoobicon";
  const meta = BRAND_META[brandId] || BRAND_META.zoobicon;

  return {
    title: meta.title,
    description: meta.description,
    manifest: "/manifest.json",
    metadataBase: new URL(meta.url),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      siteName: meta.siteName,
      title: meta.ogTitle,
      description: meta.ogDescription,
      url: meta.url,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${meta.siteName} — AI Website Builder`,
        },
      ],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.ogTitle,
      description: meta.ogDescription,
      images: ["/og-image.png"],
      creator: "@zoobicon",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large" as const,
        "max-snippet": -1,
      },
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: meta.appleTitle,
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050508" },
    { media: "(prefers-color-scheme: light)", color: "#050508" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Critical inline styles — guarantees dark bg even before CSS bundle loads */}
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#050508;color:#e4e4e7;margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;letter-spacing:-0.011em}` }} />
        {/* Preconnect to Google Fonts CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Async font loading — never blocks rendering. Subset to Latin to reduce download. */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..900&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap&subset=latin';document.head.appendChild(l)})()` }} />
        {/* Fallback for users with JS disabled */}
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..900&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap&subset=latin"
            rel="stylesheet"
          />
        </noscript>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* DNS prefetch for external services used during checkout/auth */}
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://github.com" />
        <meta name="msapplication-TileColor" content="#050508" />
        <meta name="msapplication-config" content="none" />
        {/* Organization JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Zoobicon",
            "url": "https://zoobicon.com",
            "logo": "https://zoobicon.com/og-image.png",
            "description": "AI Website Builder — 7 AI agents build production-ready websites, SaaS apps, and e-commerce stores from a single prompt.",
            "sameAs": [
              "https://zoobicon.ai",
              "https://zoobicon.io",
              "https://zoobicon.sh"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "support@zoobicon.com",
              "contactType": "customer support"
            },
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "0",
              "highPrice": "99",
              "priceCurrency": "USD",
              "offerCount": "4"
            }
          }) }}
        />
        {/* SoftwareApplication JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Zoobicon AI Website Builder",
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "Web",
            "url": "https://zoobicon.com/builder",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Build production-ready websites with AI. 7 agents collaborate to generate full-stack apps, e-commerce stores, and multi-page sites from a single prompt."
          }) }}
        />
      </head>
      <body className="grain">
        {children}
        <GlobalChat />
      </body>
    </html>
  );
}
