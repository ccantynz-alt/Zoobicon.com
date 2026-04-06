/**
 * White-Label Brand Configuration
 *
 * Supports multiple brands from a single codebase:
 * - zoobicon.com / zoobicon.ai / zoobicon.sh — Primary brand
 * - dominat8.io / dominat8.com — Secondary income stream brand
 *
 * Usage:
 *   import { getBrandConfig, getCurrentBrand } from "@/lib/brand-config";
 *   const brand = getCurrentBrand(); // auto-detects from hostname
 *   // or
 *   const brand = getBrandConfig("dominat8");
 */

export interface BrandConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  domains: string[];
  logo: {
    text: string;
    icon: string; // Lucide icon name
  };
  colors: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    gradientFrom: string;
    gradientTo: string;
    accentGlow: string;
  };
  meta: {
    title: string;
    description: string;
    ogImage: string;
  };
  features: {
    headline: string;
    subheadline: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  pricing: {
    free: { name: string; price: string; features: string[] };
    pro: { name: string; price: string; features: string[] };
    enterprise: { name: string; price: string; features: string[] };
  };
  footer: {
    copyright: string;
    socialLinks: { platform: string; url: string }[];
  };
  analytics: {
    gaId?: string;
    pixelId?: string;
  };
}

const ZOOBICON_CONFIG: BrandConfig = {
  id: "zoobicon",
  name: "Zoobicon",
  tagline: "Build anything with AI",
  description: "The AI platform that generates production-ready websites, apps, dashboards, and marketing assets in seconds.",
  domains: ["zoobicon.com", "zoobicon.ai", "zoobicon.io", "zoobicon.sh", "localhost"],
  logo: {
    text: "Zoobicon",
    icon: "Zap",
  },
  colors: {
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    primaryLight: "rgba(37, 99, 235, 0.15)",
    gradientFrom: "#2563eb",
    gradientTo: "#0ea5e9",
    accentGlow: "rgba(37, 99, 235, 0.3)",
  },
  meta: {
    title: "Zoobicon — AI Website Builder & Generator Platform",
    description: "Generate production-ready websites, SaaS dashboards, landing pages, and 30+ application types with AI. The most powerful AI web builder.",
    ogImage: "/og-zoobicon.png",
  },
  features: {
    headline: "Build anything with AI",
    subheadline: "Describe what you need. Our AI agents build it in seconds — websites, dashboards, apps, marketing campaigns, and more.",
    ctaPrimary: "Start Building Free",
    ctaSecondary: "See All Generators",
  },
  pricing: {
    free: { name: "Starter", price: "Free", features: ["5 sites/month", "Basic templates", "Standard generation", "Community support"] },
    pro: { name: "Pro", price: "$49/mo", features: ["Unlimited sites", "All 32+ generators", "10-agent pipeline", "Priority support", "Custom domains", "API access"] },
    enterprise: { name: "Enterprise", price: "Custom", features: ["White-label", "Custom AI agents", "Dedicated infrastructure", "SLA", "Priority support"] },
  },
  footer: {
    copyright: "Zoobicon",
    socialLinks: [
      { platform: "twitter", url: "https://twitter.com/zoobicon" },
      { platform: "github", url: "https://github.com/zoobicon" },
    ],
  },
  analytics: {},
};

const DOMINAT8_CONFIG: BrandConfig = {
  id: "dominat8",
  name: "Dominat8",
  tagline: "Dominate your market with AI",
  description: "AI-powered weapon for businesses that refuse to be second. Generate killer websites, landing pages, and marketing assets that crush the competition.",
  domains: ["dominat8.io", "dominat8.com"],
  logo: {
    text: "Dominat8",
    icon: "Target",
  },
  colors: {
    primary: "#ef4444",
    primaryHover: "#dc2626",
    primaryLight: "rgba(239, 68, 68, 0.15)",
    gradientFrom: "#ef4444",
    gradientTo: "#f97316",
    accentGlow: "rgba(239, 68, 68, 0.3)",
  },
  meta: {
    title: "Dominat8 — AI-Powered Competitive Advantage",
    description: "Generate high-converting websites, landing pages, and marketing assets with AI. Built for businesses that dominate their market.",
    ogImage: "/og-dominat8.png",
  },
  features: {
    headline: "Dominate your market with AI",
    subheadline: "While your competitors spend weeks building websites, you'll launch in seconds. AI-generated sites, landing pages, and marketing that convert.",
    ctaPrimary: "Start Dominating Free",
    ctaSecondary: "See the Arsenal",
  },
  pricing: {
    free: { name: "Recon", price: "Free", features: ["5 sites/month", "Basic templates", "Standard AI generation", "Community access"] },
    pro: { name: "Strike", price: "$49/mo", features: ["Unlimited sites", "All AI generators", "10-agent pipeline", "Priority support", "Custom domains", "API access", "A/B testing"] },
    enterprise: { name: "Command", price: "Custom", features: ["White-label for your agency", "Custom AI training", "Dedicated infrastructure", "SLA guarantee", "Dedicated success manager"] },
  },
  footer: {
    copyright: "Dominat8",
    socialLinks: [
      { platform: "twitter", url: "https://twitter.com/dominat8io" },
    ],
  },
  analytics: {},
};

const BRAND_CONFIGS: Record<string, BrandConfig> = {
  zoobicon: ZOOBICON_CONFIG,
  dominat8: DOMINAT8_CONFIG,
};

export function getBrandConfig(brandId: string): BrandConfig {
  return BRAND_CONFIGS[brandId] || ZOOBICON_CONFIG;
}

export function getCurrentBrand(): BrandConfig {
  if (typeof window === "undefined") return ZOOBICON_CONFIG;

  const hostname = window.location.hostname;

  for (const config of Object.values(BRAND_CONFIGS)) {
    if (config.domains.some((d) => hostname.includes(d.replace("www.", "")))) {
      return config;
    }
  }

  return ZOOBICON_CONFIG;
}

export function getAllBrands(): BrandConfig[] {
  return Object.values(BRAND_CONFIGS);
}

/**
 * Create a BrandConfig from agency brand_config JSONB.
 * Used for white-label agencies — their branding overrides the default.
 */
export interface AgencyBrandInput {
  agencyName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  tagline?: string;
  customDomain?: string;
}

export function createAgencyBrand(input: AgencyBrandInput): BrandConfig {
  const primary = input.primaryColor || "#2563eb";
  const secondary = input.secondaryColor || "#0ea5e9";

  return {
    id: `agency-${input.agencyName.toLowerCase().replace(/\s+/g, "-")}`,
    name: input.agencyName,
    tagline: input.tagline || `${input.agencyName} — AI Website Builder`,
    description: `${input.agencyName}'s AI-powered website builder platform.`,
    domains: input.customDomain ? [input.customDomain] : [],
    logo: {
      text: input.agencyName,
      icon: "Zap",
    },
    colors: {
      primary,
      primaryHover: primary,
      primaryLight: `${primary}26`,
      gradientFrom: primary,
      gradientTo: secondary,
      accentGlow: `${primary}4D`,
    },
    meta: {
      title: `${input.agencyName} — AI Website Builder`,
      description: `Build production-ready websites with AI. Powered by ${input.agencyName}.`,
      ogImage: input.logoUrl || "/og-zoobicon.png",
    },
    features: {
      headline: `Build anything with ${input.agencyName}`,
      subheadline: "AI-powered website generation — describe what you need, get it in seconds.",
      ctaPrimary: "Start Building",
      ctaSecondary: "View Templates",
    },
    pricing: {
      free: { name: "Starter", price: "Free", features: ["3 sites/month", "Standard generation"] },
      pro: { name: "Pro", price: "Contact us", features: ["Unlimited sites", "All generators", "Priority support"] },
      enterprise: { name: "Enterprise", price: "Custom", features: ["Custom AI", "Dedicated infrastructure", "SLA"] },
    },
    footer: {
      copyright: input.agencyName,
      socialLinks: [],
    },
    analytics: {},
  };
}

/**
 * Get brand config for a user — checks if they belong to a white-label agency.
 * Called client-side with agency data from localStorage.
 */
export function getAgencyBrandConfig(agencyBrandConfig: AgencyBrandInput | null): BrandConfig | null {
  if (!agencyBrandConfig || !agencyBrandConfig.agencyName) return null;
  return createAgencyBrand(agencyBrandConfig);
}

