import type { Metadata } from "next";

const TLD_META: Record<string, { title: string; description: string; keywords: string[] }> = {
  ai: {
    title: "Buy .ai Domain — AI Domain Registration from $79.99/yr | Zoobicon",
    description: "Register .ai domain names at wholesale prices. Real-time availability checks via Tucows/OpenSRS. Includes free WHOIS privacy, SSL certificate, DNS management, and AI website builder. The #1 domain for artificial intelligence companies.",
    keywords: ["buy .ai domain", "register .ai domain", ".ai domain price", ".ai domain registration", "ai domain name", "artificial intelligence domain", "cheap .ai domain", ".ai domain search"],
  },
  io: {
    title: "Buy .io Domain — Startup Domain Registration from $39.99/yr | Zoobicon",
    description: "Register .io domain names at wholesale prices. Real-time availability checks. Includes free WHOIS privacy, SSL, and AI website builder. The developer-favorite domain for startups and SaaS.",
    keywords: ["buy .io domain", "register .io domain", ".io domain price", ".io domain registration", "io domain for startups", "tech domain name", "cheap .io domain"],
  },
  com: {
    title: "Buy .com Domain — Domain Registration from $12.99/yr | Zoobicon",
    description: "Register .com domain names at wholesale prices. Real-time registry availability checks. Includes free WHOIS privacy, SSL certificate, DNS management, and AI website builder.",
    keywords: ["buy .com domain", "cheap .com domain", "register .com domain", ".com domain price", "domain registration", "buy domain name"],
  },
  sh: {
    title: "Buy .sh Domain — Developer Domain Registration from $24.99/yr | Zoobicon",
    description: "Register .sh domain names for developer tools, hosting platforms, and DevOps. Real-time availability, free WHOIS privacy, SSL, and AI website builder included.",
    keywords: ["buy .sh domain", "register .sh domain", ".sh domain price", "developer domain", "devops domain name", "shell domain"],
  },
  dev: {
    title: "Buy .dev Domain — Developer Portfolio Domain from $14.99/yr | Zoobicon",
    description: "Register .dev domain names — Google's TLD for developers. HTTPS required by default. Includes free WHOIS privacy, SSL, DNS management, and AI website builder.",
    keywords: ["buy .dev domain", "register .dev domain", ".dev domain price", "developer portfolio domain", "coding domain name", "google dev domain"],
  },
  app: {
    title: "Buy .app Domain — Application Domain from $14.99/yr | Zoobicon",
    description: "Register .app domain names — Google's secure TLD for mobile and web apps. HTTPS by default. Includes free WHOIS privacy, SSL, and AI website builder.",
    keywords: ["buy .app domain", "register .app domain", ".app domain price", "mobile app domain", "application domain name", "google app domain"],
  },
};

export function generateMetadata({ params }: { params: { tld: string } }): Metadata {
  const tld = params.tld?.toLowerCase();
  const meta = TLD_META[tld];

  if (!meta) {
    return {
      title: `Register .${tld} Domain | Zoobicon`,
      description: `Search and register .${tld} domain names at wholesale prices. Free WHOIS privacy, SSL, and AI website builder included.`,
    };
  }

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://zoobicon.com/domains/${tld}`,
      siteName: "Zoobicon",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    alternates: { canonical: `https://zoobicon.com/domains/${tld}` },
  };
}

const jsonLdForTld = (tld: string) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": `.${tld} Domain Registration`,
  "description": TLD_META[tld]?.description || `Register .${tld} domain names at wholesale prices.`,
  "url": `https://zoobicon.com/domains/${tld}`,
  "brand": { "@type": "Organization", "name": "Zoobicon" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": tld === "ai" ? "79.99" : tld === "io" ? "39.99" : tld === "com" ? "12.99" : tld === "sh" ? "24.99" : "14.99",
    "priceValidUntil": "2027-12-31",
    "availability": "https://schema.org/InStock",
    "seller": { "@type": "Organization", "name": "Zoobicon" },
  },
});

export default function TldLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tld: string };
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdForTld(params.tld)) }}
      />
      {children}
    </>
  );
}
