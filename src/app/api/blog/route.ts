import { NextRequest, NextResponse } from "next/server";

/* ─── Blog API — GET / POST / PUT ─── */

// Mock data mirrors what the client lib provides (server can't use localStorage)
// In production this would hit the database

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  metaDescription: string;
  tags: string[];
  status: "published" | "draft" | "scheduled";
  publishedAt?: string;
  scheduledAt?: string;
  views: number;
  seoScore: number;
  featuredImage?: string;
  tone?: string;
  createdAt: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function calculateSEOScore(post: Partial<BlogPost>): number {
  let score = 40;
  if (post.title && post.title.length >= 30 && post.title.length <= 65) score += 10;
  if (post.metaDescription && post.metaDescription.length >= 120 && post.metaDescription.length <= 160) score += 10;
  if (post.tags && post.tags.length >= 3) score += 5;
  if (post.body && post.body.length > 1000) score += 10;
  if (post.body && (post.body.includes("<h2>") || post.body.includes("<h3>"))) score += 10;
  if (post.body && post.body.includes("<strong>")) score += 5;
  if (post.body && (post.body.includes("<ul>") || post.body.includes("<ol>"))) score += 5;
  if (post.featuredImage) score += 5;
  return Math.min(score, 100);
}

/* GET — list posts, stats, keywords */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "posts";

  if (type === "stats") {
    return NextResponse.json({
      totalPosts: 8,
      totalViews: 14528,
      avgSeoScore: 85,
      impressions: 61018,
    });
  }

  if (type === "keywords") {
    return NextResponse.json([
      { keyword: "AI website builder", position: 4, change: 2, url: "/blog/ai-revolutionizing-web-design-2026" },
      { keyword: "website design trends 2026", position: 7, change: -1, url: "/blog/website-design-trends-2026" },
      { keyword: "SEO AI content", position: 12, change: 5, url: "/blog/seo-age-of-ai" },
      { keyword: "small business website", position: 18, change: 3, url: "/blog/small-business-website-2026" },
      { keyword: "ecommerce features checklist", position: 9, change: 0, url: "/blog/ecommerce-website-features-guide" },
      { keyword: "web design agency pricing", position: 15, change: -2, url: "/blog/agency-pricing-guide-2026" },
    ]);
  }

  // Default: return message indicating client-side storage
  return NextResponse.json({
    message: "Blog posts are stored in localStorage for MVP. Use the client library for CRUD operations.",
    hint: "POST to create, PUT to update. GET ?type=stats for stats, ?type=keywords for keyword rankings.",
  });
}

/* POST — create a new blog post */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, metaDescription, tags, status, body: postBody, tone, featuredImage } = body;

    if (!title || !postBody) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
    }

    const post: BlogPost = {
      id: `bp-${Date.now()}`,
      title,
      slug: generateSlug(title),
      body: postBody,
      metaDescription: metaDescription || "",
      tags: tags || [],
      status: status || "draft",
      publishedAt: status === "published" ? new Date().toISOString() : undefined,
      views: 0,
      seoScore: 0,
      featuredImage,
      tone,
      createdAt: new Date().toISOString(),
    };
    post.seoScore = calculateSEOScore(post);

    return NextResponse.json({ success: true, post });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/* PUT — update a blog post */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const seoScore = calculateSEOScore(updates);

    return NextResponse.json({
      success: true,
      post: { id, ...updates, seoScore, slug: updates.title ? generateSlug(updates.title) : undefined },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
