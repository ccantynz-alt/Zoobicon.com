import { NextRequest, NextResponse } from "next/server";

/* ---------- types ---------- */
interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  creator: string;
  creatorTier: "Rising" | "Pro" | "Master" | "Legend";
  thumbnail: string;
  sales: number;
  rating: number;
  reviews: number;
  featured: boolean;
  createdAt: string;
  tags: string[];
}

/* ---------- demo listings ---------- */
const LISTINGS: MarketplaceListing[] = [
  { id: "ml1", title: "Modern SaaS Landing Page", description: "Conversion-optimized landing page with hero, features, pricing, and testimonial sections. Dark theme with gradient accents.", price: 15, category: "Landing Page", creator: "alex_dev", creatorTier: "Master", thumbnail: "/placeholder-template.png", sales: 234, rating: 4.9, reviews: 67, featured: true, createdAt: "2026-02-10T10:00:00Z", tags: ["saas", "landing", "dark-theme"] },
  { id: "ml2", title: "Restaurant & Cafe Complete", description: "Full restaurant website with menu, reservations, gallery, and about sections. Warm, inviting color palette.", price: 12, category: "Restaurant", creator: "jenny_ux", creatorTier: "Pro", thumbnail: "/placeholder-template.png", sales: 189, rating: 4.7, reviews: 42, featured: true, createdAt: "2026-01-25T14:00:00Z", tags: ["restaurant", "food", "menu"] },
  { id: "ml3", title: "Developer Portfolio Pro", description: "Minimal portfolio with project showcase, skills timeline, blog section, and contact form. Code-inspired design.", price: 10, category: "Portfolio", creator: "code_ninja", creatorTier: "Pro", thumbnail: "/placeholder-template.png", sales: 312, rating: 4.8, reviews: 89, featured: false, createdAt: "2026-03-05T09:00:00Z", tags: ["portfolio", "developer", "minimal"] },
  { id: "ml4", title: "E-Commerce Starter Store", description: "Complete storefront with product grid, cart, checkout, filters, and wishlist. Mobile-first responsive design.", price: 25, category: "E-Commerce", creator: "sarah_designs", creatorTier: "Master", thumbnail: "/placeholder-template.png", sales: 156, rating: 4.6, reviews: 31, featured: true, createdAt: "2026-02-20T11:00:00Z", tags: ["ecommerce", "store", "cart"] },
  { id: "ml5", title: "Fitness & Gym Template", description: "High-energy gym website with class schedule, trainer profiles, membership plans, and contact form.", price: 8, category: "Business", creator: "fit_builder", creatorTier: "Rising", thumbnail: "/placeholder-template.png", sales: 87, rating: 4.5, reviews: 18, featured: false, createdAt: "2026-03-12T16:00:00Z", tags: ["fitness", "gym", "health"] },
  { id: "ml6", title: "Creative Agency Showcase", description: "Bold agency site with case studies, team section, services grid, and animated hero. Premium feel.", price: 20, category: "Agency", creator: "creative_studio", creatorTier: "Legend", thumbnail: "/placeholder-template.png", sales: 201, rating: 4.9, reviews: 54, featured: true, createdAt: "2026-01-15T13:00:00Z", tags: ["agency", "creative", "bold"] },
  { id: "ml7", title: "Tech Blog Theme", description: "Clean blog layout with syntax highlighting, tag system, newsletter signup, and dark/light mode toggle.", price: 9, category: "Blog", creator: "blog_master", creatorTier: "Pro", thumbnail: "/placeholder-template.png", sales: 143, rating: 4.4, reviews: 26, featured: false, createdAt: "2026-02-05T08:00:00Z", tags: ["blog", "tech", "writing"] },
  { id: "ml8", title: "Real Estate Listings", description: "Property listing site with search filters, map integration placeholders, image galleries, and agent profiles.", price: 18, category: "Real Estate", creator: "property_pro", creatorTier: "Pro", thumbnail: "/placeholder-template.png", sales: 98, rating: 4.6, reviews: 20, featured: false, createdAt: "2026-03-18T10:00:00Z", tags: ["real-estate", "listings", "property"] },
  { id: "ml9", title: "Event & Conference", description: "Event landing page with speaker lineup, schedule timeline, ticket tiers, and venue map section.", price: 14, category: "Events", creator: "event_wizard", creatorTier: "Rising", thumbnail: "/placeholder-template.png", sales: 65, rating: 4.3, reviews: 12, featured: false, createdAt: "2026-03-08T15:00:00Z", tags: ["event", "conference", "speakers"] },
  { id: "ml10", title: "Nonprofit & Charity", description: "Cause-driven website with donation CTA, impact stats, volunteer signup, and stories section.", price: 5, category: "Nonprofit", creator: "give_back", creatorTier: "Rising", thumbnail: "/placeholder-template.png", sales: 42, rating: 4.7, reviews: 9, featured: false, createdAt: "2026-02-28T12:00:00Z", tags: ["nonprofit", "charity", "donation"] },
];

const CATEGORIES = ["All", "Landing Page", "Restaurant", "Portfolio", "E-Commerce", "Business", "Agency", "Blog", "Real Estate", "Events", "Nonprofit"];

/* ---------- GET: list marketplace ---------- */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "12", 10);
  const category = url.searchParams.get("category") || "All";
  const sort = url.searchParams.get("sort") || "popular";
  const search = url.searchParams.get("search")?.toLowerCase();

  let filtered = [...LISTINGS];

  if (category !== "All") filtered = filtered.filter((l) => l.category === category);
  if (search) filtered = filtered.filter((l) => l.title.toLowerCase().includes(search) || l.description.toLowerCase().includes(search) || l.tags.some((t) => t.includes(search)));

  if (sort === "newest") filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  else if (sort === "price_low") filtered.sort((a, b) => a.price - b.price);
  else if (sort === "price_high") filtered.sort((a, b) => b.price - a.price);
  else if (sort === "rating") filtered.sort((a, b) => b.rating - a.rating);
  else filtered.sort((a, b) => b.sales - a.sales);

  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return NextResponse.json({
    listings: items,
    categories: CATEGORIES,
    featured: LISTINGS.filter((l) => l.featured).slice(0, 4),
    stats: {
      totalListings: LISTINGS.length,
      totalCreators: new Set(LISTINGS.map((l) => l.creator)).size,
      totalSales: LISTINGS.reduce((s, l) => s + l.sales, 0),
    },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

/* ---------- POST: submit listing ---------- */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, price, category, tags } = body;

    if (!title || !description || price == null || !category) {
      return NextResponse.json({ error: "Missing required fields: title, description, price, category." }, { status: 400 });
    }
    if (!CATEGORIES.includes(category) && category !== "Other") {
      return NextResponse.json({ error: `Invalid category. Choose from: ${CATEGORIES.join(", ")}` }, { status: 400 });
    }

    const listing: MarketplaceListing = {
      id: `ml_${Date.now()}`,
      title,
      description,
      price: Number(price),
      category,
      creator: "current_user",
      creatorTier: "Rising",
      thumbnail: "/placeholder-template.png",
      sales: 0,
      rating: 0,
      reviews: 0,
      featured: false,
      createdAt: new Date().toISOString(),
      tags: tags || [],
    };

    return NextResponse.json({ success: true, listing }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
