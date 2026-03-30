import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Domain Search — Check Availability Instantly | Zoobicon",
  description:
    "Search domain availability across 13 extensions (.com, .ai, .io, .sh, .dev, .app, .co, .net, .org, .tech, .xyz, .me, .us). Real-time registry checks via Tucows/OpenSRS. Free WHOIS privacy & SSL included. Domains from $2.99/yr.",
  keywords: [
    "domain search", "domain name search", "domain availability checker",
    "buy domain", "register domain", "cheap domains",
    "buy .ai domain", "buy .io domain", "buy .com domain",
    ".ai domain", ".io domain", ".sh domain", ".dev domain",
    "domain name generator", "free domain search",
    "wholesale domains", "domain registration",
    "zoobicon domains", "domain with free SSL",
    "domain with free hosting", "domain with website builder",
  ],
  openGraph: {
    title: "Free Domain Search — Real Availability, Wholesale Prices | Zoobicon",
    description:
      "Search 13 domain extensions with real-time registry checks. Includes free WHOIS privacy, SSL, DNS management & AI website builder. Domains from $2.99/yr.",
    url: "https://zoobicon.com/domains",
    siteName: "Zoobicon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Domain Search — Zoobicon",
    description: "Real-time domain availability across 13 extensions. Free WHOIS privacy & SSL included.",
  },
  alternates: { canonical: "https://zoobicon.com/domains" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "name": "Zoobicon Domain Search",
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "Any",
      "url": "https://zoobicon.com/domains",
      "description": "Search domain name availability across 13 extensions with real-time registry checks powered by Tucows/OpenSRS. Includes free WHOIS privacy, SSL certificates, and DNS management.",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": "2.99",
        "highPrice": "79.99",
        "offerCount": "13",
      },
      "creator": {
        "@type": "Organization",
        "name": "Zoobicon",
        "url": "https://zoobicon.com",
      },
      "featureList": "Real-time availability checks, 13 TLD extensions, Free WHOIS privacy, Free SSL certificate, DNS management, AI website builder included",
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does the Zoobicon domain search work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We connect directly to Tucows/OpenSRS, one of the world's largest domain registries. When you search, we check real-time availability against the live registry — not cached data. This means results are accurate to the second.",
          },
        },
        {
          "@type": "Question",
          "name": "What domain extensions can I search?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We support 13 extensions: .com ($12.99/yr), .ai ($79.99/yr), .io ($39.99/yr), .sh ($24.99/yr), .co ($29.99/yr), .dev ($14.99/yr), .app ($14.99/yr), .net ($13.99/yr), .org ($11.99/yr), .tech ($6.99/yr), .xyz ($2.99/yr), .me ($8.99/yr), and .us ($8.99/yr).",
          },
        },
        {
          "@type": "Question",
          "name": "Is the domain search free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, searching for domain availability is completely free with no limits. You only pay when you register a domain. Every domain includes free WHOIS privacy protection, SSL certificate, and DNS management.",
          },
        },
        {
          "@type": "Question",
          "name": "What's included with every domain?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Every domain registered through Zoobicon includes free WHOIS privacy protection, a free SSL certificate via Cloudflare, DNS management, instant activation, auto-renewal, and access to the Zoobicon AI website builder and hosting on zoobicon.sh.",
          },
        },
      ],
    },
  ],
};

export default function DomainsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
