import { NextResponse } from "next/server";

const DEMO_LISTINGS = [
  { id: "t1", name: "Minimal SaaS Landing", creator: "designpro", price: 15, category: "SaaS", sales: 89, rating: 4.9, featured: true, previewUrl: "https://minimal-saas.zoobicon.sh" },
  { id: "t2", name: "Bold Agency Portfolio", creator: "webcraft", price: 25, category: "Agency", sales: 67, rating: 4.8, featured: true, previewUrl: "https://bold-agency.zoobicon.sh" },
  { id: "t3", name: "Elegant Restaurant", creator: "foodie_dev", price: 12, category: "Restaurant", sales: 134, rating: 4.7, featured: false, previewUrl: "https://elegant-resto.zoobicon.sh" },
  { id: "t4", name: "Developer Portfolio Dark", creator: "codesmith", price: 10, category: "Portfolio", sales: 201, rating: 4.6, featured: false, previewUrl: "https://dev-dark.zoobicon.sh" },
  { id: "t5", name: "E-Commerce Starter", creator: "shopbuilder", price: 35, category: "E-Commerce", sales: 45, rating: 4.9, featured: true, previewUrl: "https://ecom-start.zoobicon.sh" },
  { id: "t6", name: "Blog + Newsletter", creator: "contentpro", price: 18, category: "Blog", sales: 78, rating: 4.5, featured: false, previewUrl: "https://blog-news.zoobicon.sh" },
  { id: "t7", name: "Fitness Studio", creator: "wellnessweb", price: 14, category: "Business", sales: 56, rating: 4.7, featured: false, previewUrl: "https://fit-studio.zoobicon.sh" },
  { id: "t8", name: "Event Landing Page", creator: "eventmaker", price: 8, category: "Events", sales: 312, rating: 4.4, featured: false, previewUrl: "https://event-land.zoobicon.sh" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") || "popular";
  const search = searchParams.get("search");
  const featured = searchParams.get("featured");

  let filtered = [...DEMO_LISTINGS];
  if (category && category !== "all") filtered = filtered.filter((l) => l.category.toLowerCase() === category.toLowerCase());
  if (featured === "true") filtered = filtered.filter((l) => l.featured);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((l) => l.name.toLowerCase().includes(q) || l.creator.toLowerCase().includes(q) || l.category.toLowerCase().includes(q));
  }

  if (sort === "newest") filtered.reverse();
  else if (sort === "price_low") filtered.sort((a, b) => a.price - b.price);
  else if (sort === "price_high") filtered.sort((a, b) => b.price - a.price);
  else if (sort === "rating") filtered.sort((a, b) => b.rating - a.rating);
  else filtered.sort((a, b) => b.sales - a.sales);

  return NextResponse.json({ listings: filtered, total: filtered.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, category, siteId } = body;
    if (!name || !price || !category || !siteId) {
      return NextResponse.json({ error: "Missing required fields: name, price, category, siteId" }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      listing: {
        id: `t${Date.now()}`,
        name,
        price,
        category,
        siteId,
        creator: "you",
        sales: 0,
        rating: 0,
        featured: false,
        status: "pending_review",
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
