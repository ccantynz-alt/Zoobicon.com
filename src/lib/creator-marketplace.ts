/* ============================================================
   Creator Marketplace — Template Selling Platform
   Users sell their generated sites as purchasable templates.
   70% creator / 30% platform revenue split.
   ============================================================ */

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number; // cents, 0 = free
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string; // gradient fallback if absent
  sales: number;
  revenue: number; // cents
  rating: number;
  ratingCount: number;
  tags: string[];
  status: "active" | "draft" | "suspended";
  createdAt: string;
  previewGradient: string;
}

export interface CreatorEarnings {
  totalEarnings: number; // cents
  monthEarnings: number; // cents
  activeListings: number;
  avgRating: number;
  pendingPayout: number; // cents
  stripeConnected: boolean;
}

export interface FeaturedCreator {
  name: string;
  bio: string;
  topTemplate: MarketplaceTemplate;
  totalSales: number;
  avatar: string;
}

/* ---------- categories ---------- */
export const MARKETPLACE_CATEGORIES = [
  "All",
  "Business",
  "Portfolio",
  "E-Commerce",
  "SaaS",
  "Restaurant",
  "Blog",
  "Agency",
  "Landing Page",
  "Personal",
] as const;

/* ---------- gradient palette ---------- */
const GRADIENTS: Record<string, string> = {
  Business: "from-blue-600 to-cyan-500",
  Portfolio: "from-purple-600 to-pink-500",
  "E-Commerce": "from-emerald-600 to-teal-400",
  SaaS: "from-indigo-600 to-violet-500",
  Restaurant: "from-orange-600 to-amber-400",
  Blog: "from-rose-600 to-pink-400",
  Agency: "from-violet-600 to-purple-400",
  "Landing Page": "from-cyan-600 to-blue-400",
  Personal: "from-fuchsia-600 to-rose-400",
};

export function gradientForCategory(cat: string): string {
  return GRADIENTS[cat] || "from-gray-600 to-gray-500";
}

/* ---------- mock data: 20 templates ---------- */
const MOCK_TEMPLATES: MarketplaceTemplate[] = [
  { id: "tpl-001", name: "Modern SaaS Landing", description: "Conversion-optimized SaaS landing page with hero, features grid, pricing table, testimonials, and CTA sections. Dark mode included.", category: "SaaS", price: 2900, creatorId: "u-sarah", creatorName: "Sarah M.", sales: 234, revenue: 474810, rating: 4.9, ratingCount: 87, tags: ["saas", "dark-mode", "conversion"], status: "active", createdAt: "2026-02-15T10:30:00Z", previewGradient: "from-indigo-600 to-violet-500" },
  { id: "tpl-002", name: "Restaurant Elegance", description: "Beautiful restaurant website with menu sections, reservation form, chef spotlight, gallery, and location map. Warm earthy tones.", category: "Restaurant", price: 1900, creatorId: "u-james", creatorName: "James K.", sales: 189, revenue: 251370, rating: 4.8, ratingCount: 62, tags: ["restaurant", "food", "elegant"], status: "active", createdAt: "2026-02-10T14:00:00Z", previewGradient: "from-orange-600 to-amber-400" },
  { id: "tpl-003", name: "Portfolio Minimalist", description: "Clean, minimal portfolio for designers and developers. Project grid, about section, contact form. Whitespace-focused.", category: "Portfolio", price: 0, creatorId: "u-alex", creatorName: "Alex R.", sales: 567, revenue: 0, rating: 4.7, ratingCount: 134, tags: ["portfolio", "minimal", "free"], status: "active", createdAt: "2026-01-20T08:00:00Z", previewGradient: "from-purple-600 to-pink-500" },
  { id: "tpl-004", name: "E-Commerce Pro", description: "Full-featured online store with product grid, cart, checkout, filters, wishlist, and promotional banners. Built for conversions.", category: "E-Commerce", price: 4900, creatorId: "u-designstudio", creatorName: "Design Studio", sales: 145, revenue: 497175, rating: 4.9, ratingCount: 56, tags: ["ecommerce", "store", "premium"], status: "active", createdAt: "2026-03-01T12:00:00Z", previewGradient: "from-emerald-600 to-teal-400" },
  { id: "tpl-005", name: "Startup Launch Kit", description: "Everything a startup needs: hero with email capture, problem/solution, team, investors logos, and a bold CTA. Vibrant gradients.", category: "SaaS", price: 3900, creatorId: "u-nina", creatorName: "Nina P.", sales: 98, revenue: 267540, rating: 4.6, ratingCount: 33, tags: ["startup", "launch", "gradient"], status: "active", createdAt: "2026-03-05T09:00:00Z", previewGradient: "from-indigo-600 to-violet-500" },
  { id: "tpl-006", name: "Creative Agency", description: "Bold agency website with case studies, services grid, team carousel, and a client logo strip. Dark with neon accents.", category: "Agency", price: 3500, creatorId: "u-marco", creatorName: "Marco D.", sales: 112, revenue: 274400, rating: 4.8, ratingCount: 45, tags: ["agency", "creative", "neon"], status: "active", createdAt: "2026-02-20T11:00:00Z", previewGradient: "from-violet-600 to-purple-400" },
  { id: "tpl-007", name: "Personal Blog", description: "Elegant personal blog with featured posts, category sidebar, newsletter signup, and reading time estimates. Typography-focused.", category: "Blog", price: 900, creatorId: "u-emma", creatorName: "Emma L.", sales: 321, revenue: 202230, rating: 4.5, ratingCount: 98, tags: ["blog", "personal", "typography"], status: "active", createdAt: "2026-01-15T16:00:00Z", previewGradient: "from-rose-600 to-pink-400" },
  { id: "tpl-008", name: "Fitness Trainer", description: "Personal trainer website with class schedule, pricing plans, transformation gallery, testimonials, and booking integration.", category: "Personal", price: 2400, creatorId: "u-jake", creatorName: "Jake T.", sales: 76, revenue: 127680, rating: 4.7, ratingCount: 28, tags: ["fitness", "trainer", "booking"], status: "active", createdAt: "2026-02-28T13:00:00Z", previewGradient: "from-fuchsia-600 to-rose-400" },
  { id: "tpl-009", name: "Law Firm Professional", description: "Authoritative law firm site with practice areas, attorney profiles, case results, and consultation booking. Navy and gold.", category: "Business", price: 3900, creatorId: "u-sarah", creatorName: "Sarah M.", sales: 67, revenue: 182910, rating: 4.8, ratingCount: 24, tags: ["law", "professional", "corporate"], status: "active", createdAt: "2026-03-10T10:00:00Z", previewGradient: "from-blue-600 to-cyan-500" },
  { id: "tpl-010", name: "Photography Showcase", description: "Stunning photography portfolio with full-width gallery, lightbox, client galleries, and booking form. Minimal chrome.", category: "Portfolio", price: 1500, creatorId: "u-luna", creatorName: "Luna W.", sales: 203, revenue: 213150, rating: 4.6, ratingCount: 71, tags: ["photography", "gallery", "lightbox"], status: "active", createdAt: "2026-01-28T15:00:00Z", previewGradient: "from-purple-600 to-pink-500" },
  { id: "tpl-011", name: "Coffee Shop Vibes", description: "Warm, inviting coffee shop site with menu, locations, loyalty program, and online ordering. Cozy earth tones.", category: "Restaurant", price: 1200, creatorId: "u-alex", creatorName: "Alex R.", sales: 156, revenue: 131040, rating: 4.4, ratingCount: 52, tags: ["coffee", "cafe", "warm"], status: "active", createdAt: "2026-02-05T09:30:00Z", previewGradient: "from-orange-600 to-amber-400" },
  { id: "tpl-012", name: "Digital Product Store", description: "Sell ebooks, courses, and templates with this Gumroad-style storefront. Product cards, reviews, instant download.", category: "E-Commerce", price: 2900, creatorId: "u-designstudio", creatorName: "Design Studio", sales: 89, revenue: 180810, rating: 4.7, ratingCount: 31, tags: ["digital", "products", "download"], status: "active", createdAt: "2026-03-08T14:30:00Z", previewGradient: "from-emerald-600 to-teal-400" },
  { id: "tpl-013", name: "Tech Newsletter", description: "Newsletter landing page with social proof counters, issue archive, sponsor showcase, and animated subscribe form.", category: "Landing Page", price: 500, creatorId: "u-emma", creatorName: "Emma L.", sales: 412, revenue: 144200, rating: 4.5, ratingCount: 109, tags: ["newsletter", "subscribe", "tech"], status: "active", createdAt: "2026-01-10T08:00:00Z", previewGradient: "from-cyan-600 to-blue-400" },
  { id: "tpl-014", name: "Real Estate Luxury", description: "High-end real estate listing site with property cards, virtual tour embeds, agent profiles, and mortgage calculator.", category: "Business", price: 5900, creatorId: "u-marco", creatorName: "Marco D.", sales: 43, revenue: 177570, rating: 4.9, ratingCount: 18, tags: ["realestate", "luxury", "property"], status: "active", createdAt: "2026-03-12T11:00:00Z", previewGradient: "from-blue-600 to-cyan-500" },
  { id: "tpl-015", name: "Event Landing", description: "Conference/event landing page with speaker lineup, schedule, ticket tiers, venue map, and countdown timer.", category: "Landing Page", price: 1900, creatorId: "u-nina", creatorName: "Nina P.", sales: 134, revenue: 178220, rating: 4.6, ratingCount: 47, tags: ["event", "conference", "tickets"], status: "active", createdAt: "2026-02-18T10:00:00Z", previewGradient: "from-cyan-600 to-blue-400" },
  { id: "tpl-016", name: "Nonprofit Cause", description: "Donation-focused nonprofit site with impact stats, volunteer signup, stories, and integrated donation form.", category: "Business", price: 0, creatorId: "u-jake", creatorName: "Jake T.", sales: 289, revenue: 0, rating: 4.8, ratingCount: 93, tags: ["nonprofit", "charity", "free"], status: "active", createdAt: "2026-01-05T12:00:00Z", previewGradient: "from-blue-600 to-cyan-500" },
  { id: "tpl-017", name: "Developer Portfolio", description: "GitHub-inspired developer portfolio with project cards, tech stack badges, contribution graph, and blog.", category: "Portfolio", price: 1200, creatorId: "u-luna", creatorName: "Luna W.", sales: 178, revenue: 149520, rating: 4.7, ratingCount: 64, tags: ["developer", "github", "code"], status: "active", createdAt: "2026-02-22T16:00:00Z", previewGradient: "from-purple-600 to-pink-500" },
  { id: "tpl-018", name: "Bakery Sweet", description: "Delightful bakery website with product showcase, online ordering, catering info, and Instagram feed embed.", category: "Restaurant", price: 1500, creatorId: "u-emma", creatorName: "Emma L.", sales: 97, revenue: 101850, rating: 4.5, ratingCount: 35, tags: ["bakery", "sweet", "order"], status: "active", createdAt: "2026-03-02T09:00:00Z", previewGradient: "from-orange-600 to-amber-400" },
  { id: "tpl-019", name: "SaaS Dashboard UI", description: "Admin dashboard template with charts, tables, sidebar nav, user management, and settings panels. Fully responsive.", category: "SaaS", price: 7900, creatorId: "u-designstudio", creatorName: "Design Studio", sales: 56, revenue: 309540, rating: 4.9, ratingCount: 22, tags: ["dashboard", "admin", "ui"], status: "active", createdAt: "2026-03-15T10:30:00Z", previewGradient: "from-indigo-600 to-violet-500" },
  { id: "tpl-020", name: "Yoga & Wellness", description: "Calming wellness site with class schedule, instructor bios, pricing, testimonials, and meditation timer widget.", category: "Personal", price: 1900, creatorId: "u-luna", creatorName: "Luna W.", sales: 124, revenue: 164920, rating: 4.6, ratingCount: 41, tags: ["yoga", "wellness", "calm"], status: "active", createdAt: "2026-02-25T14:00:00Z", previewGradient: "from-fuchsia-600 to-rose-400" },
];

/* ---------- localStorage keys ---------- */
const STORAGE_KEY = "zoobicon_creator_marketplace";
const LISTINGS_KEY = "zoobicon_creator_listings";
const PURCHASES_KEY = "zoobicon_creator_purchases";

/* ---------- storage helpers ---------- */
function loadTemplates(): MarketplaceTemplate[] {
  if (typeof window === "undefined") return MOCK_TEMPLATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* noop */ }
  return MOCK_TEMPLATES;
}

function saveTemplates(templates: MarketplaceTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch { /* noop */ }
}

function loadMyListings(): MarketplaceTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LISTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return [];
}

function saveMyListings(listings: MarketplaceTemplate[]) {
  try {
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
  } catch { /* noop */ }
}

function loadPurchases(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PURCHASES_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* noop */ }
  return new Set();
}

function savePurchases(ids: Set<string>) {
  try {
    localStorage.setItem(PURCHASES_KEY, JSON.stringify([...ids]));
  } catch { /* noop */ }
}

/* ---------- public API ---------- */

export function getMarketplaceTemplates(filters?: {
  category?: string;
  sort?: string;
  search?: string;
}): MarketplaceTemplate[] {
  let results = loadTemplates().filter((t) => t.status === "active");

  if (filters?.category && filters.category !== "All") {
    results = results.filter((t) => t.category === filters.category);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        t.creatorName.toLowerCase().includes(q)
    );
  }

  switch (filters?.sort) {
    case "newest":
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "best_selling":
      results.sort((a, b) => b.sales - a.sales);
      break;
    case "price_low":
      results.sort((a, b) => a.price - b.price);
      break;
    case "price_high":
      results.sort((a, b) => b.price - a.price);
      break;
    case "trending":
    default:
      // Trending = weighted combo of recency + sales
      results.sort((a, b) => {
        const recencyA = new Date(a.createdAt).getTime();
        const recencyB = new Date(b.createdAt).getTime();
        const scoreA = a.sales * 1000 + recencyA / 1e9;
        const scoreB = b.sales * 1000 + recencyB / 1e9;
        return scoreB - scoreA;
      });
      break;
  }

  return results;
}

export function getMyListings(): MarketplaceTemplate[] {
  return loadMyListings();
}

export function createListing(partial: Partial<MarketplaceTemplate>): MarketplaceTemplate {
  const listings = loadMyListings();
  const template: MarketplaceTemplate = {
    id: `tpl-my-${Date.now()}`,
    name: partial.name || "Untitled Template",
    description: partial.description || "",
    category: partial.category || "Business",
    price: partial.price || 0,
    creatorId: "me",
    creatorName: partial.creatorName || "You",
    sales: 0,
    revenue: 0,
    rating: 0,
    ratingCount: 0,
    tags: partial.tags || [],
    status: "active",
    createdAt: new Date().toISOString(),
    previewGradient: gradientForCategory(partial.category || "Business"),
  };
  listings.push(template);
  saveMyListings(listings);

  // Also add to browse pool
  const all = loadTemplates();
  all.unshift(template);
  saveTemplates(all);

  return template;
}

export function getCreatorEarnings(): CreatorEarnings {
  const listings = loadMyListings();
  const active = listings.filter((l) => l.status === "active");
  const totalRev = listings.reduce((sum, l) => sum + l.revenue, 0);
  const avgRating =
    listings.length > 0
      ? listings.reduce((sum, l) => sum + l.rating, 0) / listings.length
      : 0;

  return {
    totalEarnings: Math.round(totalRev * 0.7), // 70% creator share
    monthEarnings: Math.round(totalRev * 0.7 * 0.3), // mock: ~30% of total is this month
    activeListings: active.length,
    avgRating: Math.round(avgRating * 10) / 10,
    pendingPayout: Math.round(totalRev * 0.7 * 0.15), // 15% pending
    stripeConnected: false,
  };
}

export function getFeaturedCreator(): FeaturedCreator {
  const templates = loadTemplates();
  // Pick "Design Studio" as featured
  const dsTemplates = templates.filter((t) => t.creatorId === "u-designstudio");
  const top = dsTemplates.sort((a, b) => b.sales - a.sales)[0] || templates[0];
  const totalSales = dsTemplates.reduce((sum, t) => sum + t.sales, 0);

  return {
    name: "Design Studio",
    bio: "A collective of 3 designers who've been selling templates since day one. Their E-Commerce Pro template is the highest-earning template on the platform.",
    topTemplate: top,
    totalSales,
    avatar: "DS",
  };
}

export function purchaseTemplate(templateId: string): { success: boolean; message: string } {
  const purchased = loadPurchases();
  if (purchased.has(templateId)) {
    return { success: false, message: "You already own this template." };
  }

  const templates = loadTemplates();
  const tpl = templates.find((t) => t.id === templateId);
  if (!tpl) {
    return { success: false, message: "Template not found." };
  }

  // Increment sales
  tpl.sales += 1;
  tpl.revenue += Math.round(tpl.price * 0.7);
  saveTemplates(templates);

  // Track purchase
  purchased.add(templateId);
  savePurchases(purchased);

  return { success: true, message: `Successfully purchased "${tpl.name}"!` };
}

export function isPurchased(templateId: string): boolean {
  return loadPurchases().has(templateId);
}

export function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}
