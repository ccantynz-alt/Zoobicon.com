import { NextRequest, NextResponse } from "next/server";

/**
 * Admin Template Management API
 *
 * GET  /api/admin/templates      → list curated templates
 * POST /api/admin/templates      → add/update template
 * DELETE /api/admin/templates?id= → remove template
 *
 * Templates are stored in-memory for now (no DB table needed).
 * They persist across requests within the same server instance.
 */

export interface CuratedTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  tier: "standard" | "premium";
  thumbnail?: string;
  tags: string[];
  featured: boolean;
  createdAt: string;
}

// Premium curated templates — these are the "agency-quality" starting points
const CURATED_TEMPLATES: CuratedTemplate[] = [
  {
    id: "luxury-real-estate",
    name: "Luxury Real Estate",
    category: "Real Estate",
    description: "High-end property listings with elegant typography and aspirational imagery",
    prompt: "A luxury real estate agency website for 'Prestige Properties' specializing in multi-million dollar homes in Beverly Hills. Feature elegant serif typography, warm white backgrounds, gold accents, full-bleed property photography, featured listings with pricing, agent profiles, neighborhood guides, and a sophisticated contact form. The design should feel like Sotheby's International Realty level of polish.",
    tier: "premium",
    tags: ["luxury", "real-estate", "elegant", "light-theme"],
    featured: true,
    createdAt: "2024-01-01",
  },
  {
    id: "tech-saas",
    name: "SaaS Platform",
    category: "Technology",
    description: "Modern SaaS product page with dashboard mockups and social proof",
    prompt: "A modern SaaS platform website for 'Flowline' — an AI-powered project management tool. Dark theme with indigo/violet accents, clean Inter/Space Grotesk typography, animated hero with gradient mesh background, product dashboard screenshots, feature grid with icons, pricing table (Free/Pro/Enterprise), customer logos (use placeholder squares), testimonials from tech CTOs, integration logos section, and a sleek footer. Think Linear.app meets Vercel level of design quality.",
    tier: "premium",
    tags: ["saas", "tech", "dark-theme", "modern"],
    featured: true,
    createdAt: "2024-01-01",
  },
  {
    id: "fine-dining",
    name: "Fine Dining Restaurant",
    category: "Restaurant",
    description: "Upscale restaurant with warm ambiance, menu showcase, and reservations",
    prompt: "An upscale fine dining restaurant website for 'Maison Laurent' — a French-Italian fusion restaurant in Manhattan. Warm color palette with cream backgrounds, deep burgundy and gold accents, Cormorant Garamond headings, atmospheric food photography, elegant menu presentation with courses and wine pairings, chef's story section, private dining information, reservation CTA, awards and press mentions, and an intimate footer with location details. The feel should be Michelin-star level sophistication.",
    tier: "premium",
    tags: ["restaurant", "fine-dining", "elegant", "warm"],
    featured: true,
    createdAt: "2024-01-01",
  },
  {
    id: "law-firm",
    name: "Corporate Law Firm",
    category: "Legal",
    description: "Authoritative law firm with attorney profiles and practice areas",
    prompt: "A prestigious corporate law firm website for 'Harrison, Cole & Associates' — a top-tier firm specializing in M&A, corporate litigation, and IP law. Classic light design with navy blue and warm gold accents, serif headings (DM Serif Display), professional attorney headshots, practice area pages, notable case results with statistics, client testimonials from Fortune 500 executives, awards and rankings (Chambers, Am Law 100), and a comprehensive footer with multiple office locations. Must convey absolute trust and authority.",
    tier: "premium",
    tags: ["law", "corporate", "professional", "trust"],
    featured: true,
    createdAt: "2024-01-01",
  },
  {
    id: "medical-practice",
    name: "Medical Practice",
    category: "Healthcare",
    description: "Clean, trustworthy medical practice with provider profiles and services",
    prompt: "A modern medical practice website for 'Pinnacle Health Partners' — a multi-specialty medical group. Clean, calming design with soft sage green and warm white, professional but approachable. Doctor profiles with credentials, comprehensive services list, patient testimonials, insurance accepted section, online appointment booking CTA, health resources blog section, virtual visit information, and a warm footer with multiple location addresses and hours. Must feel trustworthy and patient-centered.",
    tier: "premium",
    tags: ["medical", "healthcare", "clean", "trustworthy"],
    featured: true,
    createdAt: "2024-01-01",
  },
  {
    id: "creative-agency",
    name: "Creative Agency",
    category: "Agency",
    description: "Bold creative agency with portfolio showcase and case studies",
    prompt: "A bold creative agency website for 'Eleven Studio' — a branding and digital design agency. Editorial design with dramatic typography contrasts, asymmetric layouts, dark background with vibrant accent colors, portfolio grid with hover effects showing case study details, team section with creative headshots, client logo wall, process/methodology section, awards (Awwwards, FWA, CSS Design Awards), and a minimal footer. Think Pentagram meets Basic/Dept level of creative direction.",
    tier: "premium",
    tags: ["agency", "creative", "bold", "dark-theme"],
    featured: true,
    createdAt: "2024-01-01",
  },
  {
    id: "fitness-gym",
    name: "Premium Fitness",
    category: "Fitness",
    description: "High-energy fitness brand with class schedules and trainer profiles",
    prompt: "A premium fitness and wellness brand website for 'APEX Performance' — a boutique gym with personal training, group classes, and recovery services. Dark background with energetic orange/red accents, powerful action photography, class schedule grid, trainer profiles with specialties, membership tiers with pricing, transformation stories with before/after stats, facility tour section, and a bold CTA to book a free session. Think Equinox or Barry's Bootcamp level of brand energy.",
    tier: "premium",
    tags: ["fitness", "gym", "energetic", "dark-theme"],
    featured: false,
    createdAt: "2024-01-01",
  },
  {
    id: "ecommerce-fashion",
    name: "Fashion E-commerce",
    category: "E-commerce",
    description: "Clean fashion storefront with product grids and lookbook",
    prompt: "A high-end fashion e-commerce website for 'MAISON' — a contemporary women's fashion brand. Minimalist white design with black typography, editorial-quality product photography, hero with seasonal campaign imagery, product grid with hover quick-view, lookbook section, brand story with founder's vision, newsletter signup with 10% discount offer, size guide, and elegant footer with social links. Think SSENSE or COS level of minimal luxury.",
    tier: "premium",
    tags: ["ecommerce", "fashion", "minimal", "luxury"],
    featured: false,
    createdAt: "2024-01-01",
  },
  {
    id: "financial-advisor",
    name: "Financial Advisory",
    category: "Finance",
    description: "Trustworthy wealth management with advisor profiles and services",
    prompt: "A wealth management and financial advisory website for 'Sterling Wealth Partners' — a registered investment advisor managing $2B+ in assets. Conservative elegance with dark navy, gold accents on warm white, serif headings, team of advisors with CFP/CFA credentials, services (retirement planning, estate planning, tax optimization), client testimonials from business owners, AUM and client statistics, fiduciary commitment section, and a comprehensive footer. Must convey absolute financial trustworthiness.",
    tier: "premium",
    tags: ["finance", "wealth", "trust", "conservative"],
    featured: false,
    createdAt: "2024-01-01",
  },
  {
    id: "startup-landing",
    name: "Startup Landing Page",
    category: "Technology",
    description: "High-conversion startup landing page with waitlist signup",
    prompt: "A high-conversion startup landing page for 'Nexus AI' — an AI-powered data analytics platform launching soon. Modern gradient hero (dark purple to deep blue), animated text, email waitlist signup with social proof counter ('2,847 people on the waitlist'), 3 key value propositions with animated icons, comparison table vs competitors, backed by logos (YC, a16z style placeholders), founder quote, FAQ accordion, and minimal footer. Think early-stage YC company launch page.",
    tier: "premium",
    tags: ["startup", "landing-page", "conversion", "tech"],
    featured: false,
    createdAt: "2024-01-01",
  },
];

// In-memory custom templates (added via admin)
const customTemplates: CuratedTemplate[] = [];

export async function GET() {
  const all = [...CURATED_TEMPLATES, ...customTemplates];
  return NextResponse.json({
    templates: all,
    total: all.length,
    categories: [...new Set(all.map((t) => t.category))],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const template: CuratedTemplate = {
      id: body.id || `custom-${Date.now()}`,
      name: body.name || "Untitled Template",
      category: body.category || "Custom",
      description: body.description || "",
      prompt: body.prompt || "",
      tier: body.tier || "premium",
      thumbnail: body.thumbnail,
      tags: body.tags || [],
      featured: body.featured || false,
      createdAt: new Date().toISOString(),
    };

    // Update if exists, otherwise add
    const existingIdx = customTemplates.findIndex((t) => t.id === template.id);
    if (existingIdx >= 0) {
      customTemplates[existingIdx] = template;
    } else {
      customTemplates.push(template);
    }

    return NextResponse.json({ template, success: true });
  } catch (err) {
    console.error("Template save error:", err);
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Template ID required" }, { status: 400 });

  const idx = customTemplates.findIndex((t) => t.id === id);
  if (idx >= 0) {
    customTemplates.splice(idx, 1);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Template not found (built-in templates cannot be deleted)" }, { status: 404 });
}
