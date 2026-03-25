/**
 * User segmentation helpers for onboarding personalization.
 * Stores build type + role selections from the onboarding flow in localStorage.
 */

export interface UserSegment {
  buildType: "business" | "store" | "app" | "marketing";
  role: "freelancer" | "business-owner" | "agency" | "developer";
}

export function getUserSegment(): UserSegment | null {
  try {
    const data = localStorage.getItem("zoobicon_user_segment");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setUserSegment(buildType: string, role: string): void {
  localStorage.setItem(
    "zoobicon_user_segment",
    JSON.stringify({ buildType, role })
  );
}

/** Suggested prompt based on user segment selections */
export function getSuggestedPrompt(buildType: string, role: string): string {
  const prompts: Record<string, Record<string, string>> = {
    business: {
      freelancer: "A modern portfolio website for a freelance designer with project gallery, testimonials, and contact form",
      "business-owner": "A professional website for a local bakery with menu, photo gallery, and contact form",
      agency: "A sleek digital agency website with case studies, team bios, and a client inquiry form",
      developer: "A developer portfolio with GitHub integration, blog, and project showcase",
    },
    store: {
      freelancer: "An online store selling handmade jewelry with shopping cart, product filters, and checkout",
      "business-owner": "An e-commerce storefront for a clothing boutique with product catalog, cart, and checkout",
      agency: "A multi-vendor marketplace with product listings, seller profiles, and shopping cart",
      developer: "A developer merch store with product API, cart system, and Stripe checkout integration",
    },
    app: {
      freelancer: "A freelance project management dashboard with task boards, time tracking, and invoicing",
      "business-owner": "A customer appointment booking app with calendar, reminders, and admin dashboard",
      agency: "A SaaS dashboard with user management, analytics charts, and settings panel",
      developer: "A SaaS dashboard with user management, analytics, API key management, and settings",
    },
    marketing: {
      freelancer: "A professional email newsletter template for a creative agency with clean layout and CTA buttons",
      "business-owner": "An email marketing template for a restaurant announcing seasonal menu updates",
      agency: "A set of branded email templates for client campaign reporting and weekly updates",
      developer: "A developer-focused email template for API changelog notifications and product updates",
    },
  };

  return prompts[buildType]?.[role] || "A modern professional website with hero section, features, testimonials, and contact form";
}

/** Recommended generators based on user segment */
export function getRecommendedGenerators(segment: UserSegment | null): { id: string; label: string; description: string }[] {
  if (!segment) return getDefaultRecommendations();

  const recommendations: Record<string, { id: string; label: string; description: string }[]> = {
    business: [
      { id: "landing-page", label: "Landing Page", description: "High-converting single-page site" },
      { id: "portfolio", label: "Portfolio", description: "Showcase your work beautifully" },
      { id: "blog", label: "Blog", description: "Content-driven site with posts" },
      { id: "restaurant", label: "Restaurant", description: "Menu, hours, and reservations" },
      { id: "saas", label: "SaaS Landing", description: "Product launch page with pricing" },
    ],
    store: [
      { id: "ecommerce", label: "E-commerce Store", description: "Full store with cart and checkout" },
      { id: "product-catalog", label: "Product Catalog", description: "Browse and filter products" },
      { id: "landing-page", label: "Product Launch", description: "Single product landing page" },
      { id: "marketplace", label: "Marketplace", description: "Multi-seller storefront" },
      { id: "pricing-page", label: "Pricing Page", description: "Plans and feature comparison" },
    ],
    app: [
      { id: "saas-dashboard", label: "SaaS Dashboard", description: "Admin panel with analytics" },
      { id: "admin-panel", label: "Admin Panel", description: "CRUD interface with data tables" },
      { id: "fullstack", label: "Full-Stack App", description: "DB + API + frontend in one" },
      { id: "crm", label: "CRM Dashboard", description: "Contact and lead management" },
      { id: "documentation", label: "API Docs", description: "Developer documentation site" },
    ],
    marketing: [
      { id: "email-template", label: "Email Template", description: "Newsletter and campaign emails" },
      { id: "landing-page", label: "Campaign Landing", description: "Ad-driven conversion page" },
      { id: "social-links", label: "Link in Bio", description: "Social media link hub" },
      { id: "event", label: "Event Page", description: "Conference or webinar registration" },
      { id: "newsletter", label: "Newsletter", description: "Email signup with content preview" },
    ],
  };

  return recommendations[segment.buildType] || getDefaultRecommendations();
}

function getDefaultRecommendations(): { id: string; label: string; description: string }[] {
  return [
    { id: "landing-page", label: "Landing Page", description: "High-converting single-page site" },
    { id: "ecommerce", label: "E-commerce", description: "Online store with cart" },
    { id: "portfolio", label: "Portfolio", description: "Showcase your work" },
    { id: "saas-dashboard", label: "SaaS Dashboard", description: "Admin panel with analytics" },
    { id: "blog", label: "Blog", description: "Content-driven site" },
  ];
}
