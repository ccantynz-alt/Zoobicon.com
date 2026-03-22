import { NextRequest, NextResponse } from "next/server";

/* ---------- types ---------- */
export interface GalleryItem {
  id: string;
  prompt: string;
  siteName: string;
  creator: string;
  category: string;
  upvotes: number;
  comments: number;
  buildTime: number;
  url: string;
  createdAt: string;
  staffPick?: boolean;
  tags?: string[];
}

/* ---------- fallback data ---------- */
const GALLERY_ITEMS: GalleryItem[] = [
  { id: "1", prompt: "A modern yoga studio website with class schedules, instructor bios, and an online booking system. Calm earth-tone palette with elegant typography.", siteName: "Zen Flow Studio", creator: "Sarah M.", category: "Business", upvotes: 234, comments: 18, buildTime: 92, url: "#", createdAt: "2026-03-20T14:30:00Z", staffPick: true, tags: ["booking", "wellness"] },
  { id: "2", prompt: "Portfolio site for a 3D artist specializing in character design. Dark theme with neon accents, interactive project showcases, and a contact form.", siteName: "PixelForge Studio", creator: "Jake R.", category: "Portfolio", upvotes: 189, comments: 12, buildTime: 88, url: "#", createdAt: "2026-03-20T10:15:00Z", tags: ["3d", "creative"] },
  { id: "3", prompt: "E-commerce store for handmade candles. Warm, cozy aesthetic with product filtering, shopping cart, and checkout. Show scent profiles and burn time.", siteName: "Lumina Candles", creator: "Emily T.", category: "E-Commerce", upvotes: 312, comments: 27, buildTime: 95, url: "#", createdAt: "2026-03-19T22:00:00Z", staffPick: true, tags: ["shop", "handmade"] },
  { id: "4", prompt: "SaaS landing page for an AI-powered project management tool. Hero with animated demo, pricing tiers, testimonials, integration logos, and FAQ section.", siteName: "TaskPilot AI", creator: "Marcus D.", category: "SaaS", upvotes: 421, comments: 34, buildTime: 91, url: "#", createdAt: "2026-03-19T18:45:00Z", staffPick: true, tags: ["ai", "productivity"] },
  { id: "5", prompt: "Italian restaurant site with full menu, reservation system, photo gallery of dishes, chef's story, and location map. Rich, appetizing design.", siteName: "Trattoria Bella", creator: "Lucia V.", category: "Restaurant", upvotes: 178, comments: 9, buildTime: 89, url: "#", createdAt: "2026-03-19T15:20:00Z", tags: ["food", "booking"] },
  { id: "6", prompt: "Tech blog with dark mode, syntax highlighting, newsletter signup, tag filtering, and reading time estimates. Minimalist developer aesthetic.", siteName: "ByteStream Blog", creator: "Alex K.", category: "Blog", upvotes: 156, comments: 14, buildTime: 85, url: "#", createdAt: "2026-03-19T12:00:00Z", tags: ["dev", "blog"] },
  { id: "7", prompt: "Digital marketing agency website. Bold gradients, case study showcase, team section with hover effects, service packages, and a lead capture form.", siteName: "Pulse Digital", creator: "Nina W.", category: "Agency", upvotes: 267, comments: 21, buildTime: 94, url: "#", createdAt: "2026-03-18T20:30:00Z", staffPick: true, tags: ["marketing", "agency"] },
  { id: "8", prompt: "Minimal landing page for a meditation app. Serene blue/purple gradients, breathing animation, feature highlights, app store badges, and testimonials.", siteName: "Stillness App", creator: "David L.", category: "Landing Page", upvotes: 198, comments: 11, buildTime: 78, url: "#", createdAt: "2026-03-18T16:45:00Z", tags: ["app", "wellness"] },
  { id: "9", prompt: "Online course platform for photography lessons. Module navigation, video embeds, progress tracking, instructor credentials, and student reviews.", siteName: "ShutterSchool", creator: "Mia C.", category: "Business", upvotes: 145, comments: 8, buildTime: 96, url: "#", createdAt: "2026-03-18T11:15:00Z", tags: ["education", "courses"] },
  { id: "10", prompt: "Fitness coaching website with workout plans, transformation gallery, pricing tiers, and a free consultation booking form. High-energy dark design.", siteName: "IronWill Fitness", creator: "Chris P.", category: "Business", upvotes: 203, comments: 16, buildTime: 90, url: "#", createdAt: "2026-03-17T19:00:00Z", tags: ["fitness", "coaching"] },
  { id: "11", prompt: "Freelance web developer portfolio with animated skill bars, project timeline, GitHub integration section, and a sleek contact form. Cyberpunk aesthetic.", siteName: "DevMatrix", creator: "Raj S.", category: "Portfolio", upvotes: 287, comments: 22, buildTime: 87, url: "#", createdAt: "2026-03-17T14:30:00Z", tags: ["developer", "portfolio"] },
  { id: "12", prompt: "Organic skincare e-commerce store with ingredient spotlight, skin type quiz, subscription boxes, and eco-friendly packaging highlight. Clean, natural design.", siteName: "PureGlow Skin", creator: "Hannah B.", category: "E-Commerce", upvotes: 176, comments: 13, buildTime: 93, url: "#", createdAt: "2026-03-17T09:45:00Z", tags: ["beauty", "eco"] },
  { id: "13", prompt: "SaaS dashboard landing page for a financial analytics tool. Interactive charts demo, security badges, enterprise features, and ROI calculator.", siteName: "FinScope Analytics", creator: "Tom H.", category: "SaaS", upvotes: 334, comments: 29, buildTime: 97, url: "#", createdAt: "2026-03-16T21:15:00Z", tags: ["fintech", "analytics"] },
  { id: "14", prompt: "Japanese ramen shop with atmospheric photography, menu with descriptions in English and Japanese, ordering system, and location with street view.", siteName: "Nori Ramen House", creator: "Yuki A.", category: "Restaurant", upvotes: 219, comments: 17, buildTime: 86, url: "#", createdAt: "2026-03-16T17:00:00Z", tags: ["food", "japanese"] },
  { id: "15", prompt: "Personal travel blog with map visualization of visited countries, photo galleries per trip, packing list templates, and travel tips section.", siteName: "Wanderlust Diaries", creator: "Sophia N.", category: "Blog", upvotes: 162, comments: 10, buildTime: 91, url: "#", createdAt: "2026-03-16T13:30:00Z", tags: ["travel", "blog"] },
  { id: "16", prompt: "Creative agency portfolio featuring interactive case studies with before/after sliders, team culture section, awards wall, and client testimonial videos.", siteName: "Prism Creative", creator: "Leo F.", category: "Agency", upvotes: 298, comments: 25, buildTime: 94, url: "#", createdAt: "2026-03-15T22:45:00Z", staffPick: true, tags: ["creative", "agency"] },
  { id: "17", prompt: "Startup landing page for an AI writing assistant. Side-by-side comparison demo, typing animation, pricing with annual toggle, and integration logos.", siteName: "WriteWise AI", creator: "Priya G.", category: "Landing Page", upvotes: 256, comments: 20, buildTime: 82, url: "#", createdAt: "2026-03-15T18:00:00Z", tags: ["ai", "writing"] },
  { id: "18", prompt: "Online pet store with breed-specific recommendations, subscription treat boxes, pet health resources, and community photo gallery.", siteName: "PawPalace", creator: "Ben O.", category: "E-Commerce", upvotes: 191, comments: 15, buildTime: 92, url: "#", createdAt: "2026-03-15T14:15:00Z", tags: ["pets", "ecommerce"] },
  { id: "19", prompt: "Architecture firm website with 3D project renders, timeline of notable buildings, sustainability commitment section, and career opportunities.", siteName: "Vertex Architecture", creator: "Diana M.", category: "Portfolio", upvotes: 224, comments: 19, buildTime: 95, url: "#", createdAt: "2026-03-14T20:30:00Z", tags: ["architecture", "design"] },
  { id: "20", prompt: "Music producer portfolio with embedded audio players, beat licensing store, collaboration request form, and studio tour virtual walkthrough.", siteName: "808 Studios", creator: "Jay W.", category: "Portfolio", upvotes: 167, comments: 11, buildTime: 88, url: "#", createdAt: "2026-03-14T16:00:00Z", tags: ["music", "creative"] },
  { id: "21", prompt: "Crypto dashboard landing page with live ticker animation, feature comparison table, security audit badges, and multi-chain support showcase.", siteName: "ChainVault", creator: "Oscar Z.", category: "SaaS", upvotes: 345, comments: 31, buildTime: 90, url: "#", createdAt: "2026-03-14T11:45:00Z", tags: ["crypto", "fintech"] },
  { id: "22", prompt: "Plant nursery e-commerce with care difficulty ratings, watering schedule reminders, plant of the month subscription, and garden planning tool.", siteName: "Green Thumb Co.", creator: "Lily R.", category: "E-Commerce", upvotes: 183, comments: 14, buildTime: 93, url: "#", createdAt: "2026-03-13T19:30:00Z", tags: ["plants", "gardening"] },
  { id: "23", prompt: "Real estate agency site with property search and filters, virtual tour embeds, mortgage calculator, agent profiles, and neighborhood guides.", siteName: "Skyline Realty", creator: "Michael T.", category: "Business", upvotes: 271, comments: 23, buildTime: 97, url: "#", createdAt: "2026-03-13T15:00:00Z", tags: ["realestate", "property"] },
  { id: "24", prompt: "Non-profit animal rescue with adoption listings, donation progress bars, volunteer signup, success stories, and event calendar.", siteName: "Safe Paws Rescue", creator: "Katie J.", category: "Landing Page", upvotes: 302, comments: 26, buildTime: 89, url: "#", createdAt: "2026-03-13T10:30:00Z", staffPick: true, tags: ["nonprofit", "animals"] },
];

/* ---------- GET handler ---------- */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "trending";
  const category = searchParams.get("category") || "All";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);

  let items = [...GALLERY_ITEMS];

  // Filter by category
  if (category && category !== "All") {
    items = items.filter((i) => i.category === category);
  }

  // Filter by search
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (i) =>
        i.prompt.toLowerCase().includes(q) ||
        i.siteName.toLowerCase().includes(q) ||
        i.creator.toLowerCase().includes(q) ||
        (i.tags && i.tags.some((t) => t.includes(q)))
    );
  }

  // Sort
  switch (sort) {
    case "newest":
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "most_upvoted":
      items.sort((a, b) => b.upvotes - a.upvotes);
      break;
    case "staff_picks":
      items = items.filter((i) => i.staffPick);
      break;
    case "trending":
    default:
      // Trending = upvotes weighted by recency
      items.sort((a, b) => {
        const ageA = (Date.now() - new Date(a.createdAt).getTime()) / 3600000;
        const ageB = (Date.now() - new Date(b.createdAt).getTime()) / 3600000;
        return b.upvotes / (1 + ageB * 0.1) - a.upvotes / (1 + ageA * 0.1);
      });
      break;
  }

  // Paginate
  const total = items.length;
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);

  return NextResponse.json({
    items: paged,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

/* ---------- POST handler ---------- */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, siteName, siteUrl, category } = body;

    if (!prompt || !siteName || !category) {
      return NextResponse.json(
        { error: "Missing required fields: prompt, siteName, category" },
        { status: 400 }
      );
    }

    // MVP: Return a mock created item (no DB yet)
    const newItem: GalleryItem = {
      id: `gallery_${Date.now()}`,
      prompt,
      siteName,
      creator: "You",
      category,
      upvotes: 0,
      comments: 0,
      buildTime: 90,
      url: siteUrl || "#",
      createdAt: new Date().toISOString(),
      tags: [],
    };

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
