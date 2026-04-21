import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import SpeculationRules from "@/components/SpeculationRules";
import AutoIndexNow from "@/components/AutoIndexNow";
import StagingBanner from "@/components/StagingBanner";
import MaintenanceBanner from "@/components/MaintenanceBanner";
import ComingSoonBanner from "@/components/ComingSoonBanner";
import SiteNavigation from "@/components/SiteNavigation";
import SiteFooter from "@/components/SiteFooter";


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
      languages: {
        "en": "https://zoobicon.com",
        "x-default": "https://zoobicon.com",
      },
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
    { media: "(prefers-color-scheme: dark)", color: "#060e1f" },
    { media: "(prefers-color-scheme: light)", color: "#060e1f" },
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
        {/* Hreflang alternate links for multi-domain SEO */}
        <link rel="alternate" hrefLang="en" href="https://zoobicon.com" />
        <link rel="alternate" hrefLang="x-default" href="https://zoobicon.com" />
        <link rel="alternate" href="https://zoobicon.ai" title="Zoobicon AI" />
        <link rel="alternate" href="https://zoobicon.io" title="Zoobicon for Developers" />
        <link rel="alternate" href="https://zoobicon.sh" title="Zoobicon Hosting & CLI" />
        {/* Critical inline styles — guarantees dark bg even before CSS bundle loads */}
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#060e1f;color:#e4e4e7;margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;letter-spacing:-0.011em;overscroll-behavior:none;-webkit-overflow-scrolling:touch}html{overflow-x:hidden}` }} />
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
        {/* apple-touch-icon is auto-generated by src/app/apple-icon.tsx */}
        {/* DNS prefetch for external services used during checkout/auth */}
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://github.com" />
        <meta name="msapplication-TileColor" content="#060e1f" />
        <meta name="msapplication-config" content="none" />
        {/* AI Discovery — llms.txt is the "robots.txt for AI" */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt — AI-readable site description" />
        {/* Google Search Console verification — set NEXT_PUBLIC_GSC_VERIFICATION in env */}
        {process.env.NEXT_PUBLIC_GSC_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GSC_VERIFICATION} />
        )}
        {/* Google Analytics 4 — set NEXT_PUBLIC_GA_ID in env (e.g. G-XXXXXXXXXX) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}',{page_path:window.location.pathname})` }} />
          </>
        )}
        {/* Organization JSON-LD structured data — enhanced for GEO (Generative Engine Optimization) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Zoobicon",
            "url": "https://zoobicon.com",
            "logo": "https://zoobicon.com/og-image.png",
            "description": "AI Website Builder — 7 AI agents build production-ready websites, SaaS apps, and e-commerce stores from a single prompt.",
            "foundingDate": "2025",
            "sameAs": [
              "https://zoobicon.ai",
              "https://zoobicon.io",
              "https://zoobicon.sh",
              "https://dominat8.io"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "support@zoobicon.com",
              "contactType": "customer support",
              "availableLanguage": "English"
            },
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "0",
              "highPrice": "99",
              "priceCurrency": "USD",
              "offerCount": "4"
            },
            "knowsAbout": [
              "AI website generation",
              "Multi-agent AI pipelines",
              "Website hosting and deployment",
              "E-commerce storefront generation",
              "Full-stack application generation",
              "SEO optimization",
              "AI-powered web design",
              "White-label website builder platforms",
              "Multi-page website generation",
              "Visual website editing",
              "AI code generation",
              "Responsive web design",
              "Website templates",
              "SaaS application development",
              "Agency website management"
            ],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Zoobicon Products",
              "itemListElement": [
                {
                  "@type": "OfferCatalog",
                  "name": "AI Website Builder",
                  "description": "Generate production-ready websites from text prompts using a 7-agent AI pipeline",
                  "url": "https://zoobicon.com/products/website-builder"
                },
                {
                  "@type": "OfferCatalog",
                  "name": "AI SEO Agent",
                  "description": "Automated SEO analysis and optimization for websites",
                  "url": "https://zoobicon.com/products/seo-agent"
                },
                {
                  "@type": "OfferCatalog",
                  "name": "AI Video Creator",
                  "description": "AI-powered video script, storyboard, and scene generation pipeline",
                  "url": "https://zoobicon.com/products/video-creator"
                },
                {
                  "@type": "OfferCatalog",
                  "name": "Email Support System",
                  "description": "AI-powered email ticketing and support system with Mailgun integration",
                  "url": "https://zoobicon.com/products/email-support"
                },
                {
                  "@type": "OfferCatalog",
                  "name": "Website Hosting",
                  "description": "One-click deploy to zoobicon.sh with SSL, CDN, and custom domains",
                  "url": "https://zoobicon.com/products/hosting"
                },
                {
                  "@type": "OfferCatalog",
                  "name": "Agency White-Label Platform",
                  "description": "White-label website builder for agencies with client portal, bulk generation, and approval workflows",
                  "url": "https://zoobicon.com/agencies"
                }
              ]
            },
            "areaServed": [
              { "@type": "Country", "name": "United States" },
              { "@type": "Country", "name": "United Kingdom" },
              { "@type": "Country", "name": "Canada" },
              { "@type": "Country", "name": "Australia" },
              { "@type": "Country", "name": "Germany" },
              { "@type": "Country", "name": "France" },
              { "@type": "Country", "name": "Netherlands" },
              { "@type": "Country", "name": "Spain" },
              { "@type": "Country", "name": "Italy" },
              { "@type": "Country", "name": "Brazil" },
              { "@type": "Country", "name": "Mexico" },
              { "@type": "Country", "name": "India" },
              { "@type": "Country", "name": "Japan" },
              { "@type": "Country", "name": "South Korea" },
              { "@type": "Country", "name": "Singapore" },
              { "@type": "Country", "name": "Sweden" },
              { "@type": "Country", "name": "Norway" },
              { "@type": "Country", "name": "Denmark" },
              { "@type": "Country", "name": "New Zealand" },
              { "@type": "Country", "name": "Ireland" }
            ]
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
        {/* FAQ JSON-LD for rich snippets in Google search results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does Zoobicon build websites with AI?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Zoobicon uses a 7-agent AI pipeline. You describe what you want in plain English, and 7 specialized AI agents (strategist, brand designer, copywriter, architect, developer, SEO optimizer, animation specialist) collaborate to build a production-ready website in about 95 seconds."
                }
              },
              {
                "@type": "Question",
                "name": "How much does Zoobicon cost?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Zoobicon offers a free starter plan with limited builds. Paid plans start at $19/month (Creator), $49/month (Pro), and $99/month (Agency). All paid plans include a 14-day free trial. Enterprise pricing is available on request."
                }
              },
              {
                "@type": "Question",
                "name": "What types of websites can Zoobicon generate?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Zoobicon can generate any type of website: business sites, e-commerce stores, SaaS dashboards, portfolios, blogs, restaurants, real estate, healthcare, and more. It includes 43 specialized generators and 100+ templates across 13 categories."
                }
              },
              {
                "@type": "Question",
                "name": "Can I edit the website after it's generated?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Zoobicon includes a full visual editor with click-to-select editing, a code editor, AI-powered chat editing, version history with rollback, and 16+ sidebar tools for SEO, accessibility, performance, animations, and more."
                }
              },
              {
                "@type": "Question",
                "name": "Where are Zoobicon sites hosted?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Generated sites are deployed to zoobicon.sh with free hosting. You can also connect a custom domain, export as HTML/ZIP/React, or export as a WordPress theme."
                }
              }
            ]
          }) }}
        />
      </head>
      <body className="grain fs-grain">
        {/* Site-wide navy backdrop + dot-grid pattern. Fixed behind all
            content (z-index: -1) so every page inherits the same chrome
            without individual pages needing to render <BackgroundEffects />. */}
        <div className="site-backdrop" aria-hidden="true" />
        <ComingSoonBanner />
        <MaintenanceBanner />
        <StagingBanner />
        <SiteNavigation />
        {children}
        <SiteFooter />
        <CookieConsent />
        <AutoIndexNow />
        <SpeculationRules />
      </body>
    </html>
  );
}
