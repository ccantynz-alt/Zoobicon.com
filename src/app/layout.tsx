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
    { media: "(prefers-color-scheme: dark)", color: "#f7f5ee" },
    { media: "(prefers-color-scheme: light)", color: "#f7f5ee" },
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
        {/* Critical inline styles — paints the warm bone palette before the CSS bundle loads */}
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#ffffff;color:#0a0a0b;margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;letter-spacing:-0.011em;-webkit-overflow-scrolling:touch}body{overflow-x:hidden;overscroll-behavior:none}` }} />
        {/* Preconnect to Google Fonts CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Async font loading — never blocks rendering. Subset to Latin to reduce download.
            Playfair Display (italic + roman) is the editorial display face used in
            holdenmercer.com; we keep Fraunces too as a fallback for any legacy uses. */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,700&family=Fraunces:ital,opsz,wght@1,9..144,400&family=Inter:opsz,wght@14..32,400..900&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap&subset=latin';document.head.appendChild(l)})()` }} />
        {/* Fallback for users with JS disabled */}
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,700&family=Fraunces:ital,opsz,wght@1,9..144,400&family=Inter:opsz,wght@14..32,400..900&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap&subset=latin"
            rel="stylesheet"
          />
        </noscript>
        {/* apple-touch-icon is auto-generated by src/app/apple-icon.tsx */}
        {/* DNS prefetch for external services used during checkout/auth */}
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://github.com" />
        {/* Preconnect for builder preview: warms TCP/TLS before the user's
            first build so esm.sh package fetches start instantly. */}
        <link rel="preconnect" href="https://esm.sh" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://esm.sh" />
        <link rel="dns-prefetch" href="https://cdn.tailwindcss.com" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="theme-color" content="#ffffff" />
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
        {/* Organization JSON-LD — site-wide authority signal. Refreshed
            for Rule 33 (six agents, $49-299 builder tiers, Vapron-
            provisioned hosting + domain). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Zoobicon",
            "url": "https://zoobicon.com",
            "logo": "https://zoobicon.com/og-image.png",
            "description": "AI Website Builder. Six agents build a production-ready React site from a single prompt; hosting + custom domain provisioned via Vapron at deploy.",
            "foundingDate": "2024",
            "sameAs": [
              "https://zoobicon.ai",
              "https://zoobicon.io"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "support@zoobicon.com",
              "contactType": "customer support",
              "availableLanguage": "English"
            },
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "49",
              "highPrice": "299",
              "priceCurrency": "USD",
              "offerCount": "3"
            },
            "knowsAbout": [
              "AI website generation",
              "Multi-agent AI pipelines",
              "Domain registration",
              "SEO optimization",
              "AI-powered web design",
              "White-label website builder platforms",
              "Multi-page website generation",
              "Visual website editing",
              "AI code generation",
              "Responsive web design",
              "Website templates",
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
        {/* SoftwareApplication JSON-LD — drives Google Software Knowledge Panel */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Zoobicon AI Website Builder",
            "applicationCategory": "WebApplication",
            "operatingSystem": "Web",
            "url": "https://zoobicon.com/builder",
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "49",
              "highPrice": "299",
              "priceCurrency": "USD",
              "offerCount": "3"
            },
            "description": "Six AI agents collaborate to generate a production-ready React website from a single prompt. Hosting + custom domain provisioned via Vapron at deploy."
          }) }}
        />
        {/* WebSite JSON-LD with SearchAction — enables Google Sitelinks
            search box for branded queries. High-leverage SEO signal. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Zoobicon",
            "url": "https://zoobicon.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://zoobicon.com/builder?prompt={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
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
                  "text": "Zoobicon uses a six-agent AI pipeline. You describe what you want in plain English; the Strategist, Brand Designer, Architect, Copywriter, Developer, and SEO agents collaborate live in your browser to ship a production-ready React site in roughly 60 seconds."
                }
              },
              {
                "@type": "Question",
                "name": "How much does Zoobicon cost?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Three tiers: Starter $49/mo (1 site, 1 custom domain included), Pro $129/mo (3 sites, 3 domains, Opus 4.7), Agency $299/mo (10 sites, white-label, API access). All domains and hosting are provisioned via the Vapron API at deploy time."
                }
              },
              {
                "@type": "Question",
                "name": "What types of websites can Zoobicon generate?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Restaurants, photographers, SaaS startups, lawyers, coaches, ecommerce stores, portfolios, real estate, nonprofits, hotels — Zoobicon ships tuned niche templates for 28+ industries, plus open-ended generation from any prompt."
                }
              },
              {
                "@type": "Question",
                "name": "Can I edit the website after it's generated?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Diff-based chat editing means a one-line change re-renders in roughly two seconds without regenerating the whole site. The output is a real React + Tailwind codebase you can export and host anywhere."
                }
              },
              {
                "@type": "Question",
                "name": "Where are Zoobicon sites hosted?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Hosting + custom domains are provisioned via the Vapron API at deploy time — one platform, free SSL, global CDN. The generated codebase is portable, so you can also export and host anywhere else."
                }
              }
            ]
          }) }}
        />
      </head>
      <body className="fs-grain">
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
