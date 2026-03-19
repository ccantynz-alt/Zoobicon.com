import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

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
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#050508;color:#e4e4e7;margin:0;font-family:system-ui,-apple-system,sans-serif}` }} />
        {/* Preconnect to Google Fonts CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Async font loading — never blocks rendering */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';document.head.appendChild(l)})()` }} />
        {/* Fallback for users with JS disabled */}
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </noscript>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="msapplication-TileColor" content="#050508" />
        <meta name="msapplication-config" content="none" />
      </head>
      <body className="grain">{children}</body>
    </html>
  );
}
