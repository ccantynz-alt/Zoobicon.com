import { NextRequest, NextResponse } from "next/server";

/* ---------- types ---------- */
interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  type: "template" | "pdf" | "course" | "preset" | "plugin";
  creator: string;
  thumbnail: string;
  downloads: number;
  rating: number;
  reviews: number;
  createdAt: string;
  tags: string[];
}

/* ---------- demo catalog ---------- */
const PRODUCTS: DigitalProduct[] = [
  { id: "dp1", title: "SaaS Dashboard UI Kit", description: "Complete dashboard template with charts, tables, and analytics widgets. Dark and light themes included.", price: 29, type: "template", creator: "alex_dev", thumbnail: "/placeholder-product.png", downloads: 342, rating: 4.8, reviews: 47, createdAt: "2026-02-15T10:00:00Z", tags: ["dashboard", "saas", "ui-kit"] },
  { id: "dp2", title: "Freelancer Business Starter Pack", description: "Contract templates, proposal templates, invoice templates, and client onboarding checklist. All editable.", price: 19, type: "pdf", creator: "sarah_designs", thumbnail: "/placeholder-product.png", downloads: 891, rating: 4.9, reviews: 112, createdAt: "2026-01-20T14:00:00Z", tags: ["freelance", "business", "contracts"] },
  { id: "dp3", title: "AI Website Building Masterclass", description: "12-module video course on building professional websites with AI tools. Includes prompt engineering techniques.", price: 49, type: "course", creator: "mike_agency", thumbnail: "/placeholder-product.png", downloads: 156, rating: 4.7, reviews: 31, createdAt: "2026-03-01T09:00:00Z", tags: ["course", "ai", "web-design"] },
  { id: "dp4", title: "E-Commerce Starter Template", description: "Ready-to-deploy online store with product grid, cart, checkout, and order tracking. Mobile-first design.", price: 39, type: "template", creator: "jenny_ux", thumbnail: "/placeholder-product.png", downloads: 267, rating: 4.6, reviews: 38, createdAt: "2026-02-28T11:00:00Z", tags: ["ecommerce", "store", "template"] },
  { id: "dp5", title: "SEO Optimization Playbook", description: "Step-by-step guide to ranking on Google. Includes keyword research worksheets and on-page audit checklists.", price: 15, type: "pdf", creator: "seo_master", thumbnail: "/placeholder-product.png", downloads: 1203, rating: 4.5, reviews: 89, createdAt: "2025-12-10T08:00:00Z", tags: ["seo", "guide", "marketing"] },
  { id: "dp6", title: "Restaurant Website Template Pack", description: "5 restaurant website templates with menu sections, reservation forms, and gallery layouts.", price: 24, type: "template", creator: "creative_studio", thumbnail: "/placeholder-product.png", downloads: 178, rating: 4.7, reviews: 22, createdAt: "2026-03-10T16:00:00Z", tags: ["restaurant", "food", "template"] },
  { id: "dp7", title: "Animation Presets Collection", description: "50 scroll animation presets for websites. Copy-paste CSS and JS snippets with live previews.", price: 12, type: "preset", creator: "motion_lab", thumbnail: "/placeholder-product.png", downloads: 534, rating: 4.4, reviews: 56, createdAt: "2026-01-05T13:00:00Z", tags: ["animation", "css", "presets"] },
  { id: "dp8", title: "Portfolio Website Course", description: "Build a portfolio that gets you hired. 8 lessons covering layout, copywriting, and case study structure.", price: 35, type: "course", creator: "hire_me", thumbnail: "/placeholder-product.png", downloads: 89, rating: 4.8, reviews: 15, createdAt: "2026-03-15T10:00:00Z", tags: ["portfolio", "career", "course"] },
];

/* ---------- GET: list products ---------- */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const type = url.searchParams.get("type");
  const search = url.searchParams.get("search")?.toLowerCase();
  const sort = url.searchParams.get("sort") || "newest";

  let filtered = [...PRODUCTS];

  if (type) filtered = filtered.filter((p) => p.type === type);
  if (search) filtered = filtered.filter((p) => p.title.toLowerCase().includes(search) || p.description.toLowerCase().includes(search) || p.tags.some((t) => t.includes(search)));

  if (sort === "popular") filtered.sort((a, b) => b.downloads - a.downloads);
  else if (sort === "price_low") filtered.sort((a, b) => a.price - b.price);
  else if (sort === "price_high") filtered.sort((a, b) => b.price - a.price);
  else if (sort === "rating") filtered.sort((a, b) => b.rating - a.rating);
  else filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return NextResponse.json({
    products: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

/* ---------- POST: create listing ---------- */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, price, type, tags } = body;

    if (!title || !description || price == null || !type) {
      return NextResponse.json({ error: "Missing required fields: title, description, price, type." }, { status: 400 });
    }

    const product: DigitalProduct = {
      id: `dp_${Date.now()}`,
      title,
      description,
      price: Number(price),
      type,
      creator: "current_user",
      thumbnail: "/placeholder-product.png",
      downloads: 0,
      rating: 0,
      reviews: 0,
      createdAt: new Date().toISOString(),
      tags: tags || [],
    };

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
