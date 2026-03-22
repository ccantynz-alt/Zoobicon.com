import { NextRequest, NextResponse } from "next/server";

/* ─── Brand Kit API ─── */

/* GET: return brand kit (placeholder — real data lives in localStorage on client) */
export async function GET() {
  return NextResponse.json({
    kit: null,
    message: "Brand kit is stored client-side. Use the Brand Kit page to manage your brand.",
  });
}

/* PUT: save brand kit (placeholder for future DB persistence) */
export async function PUT(request: NextRequest) {
  try {
    const kit = await request.json();
    if (!kit.colors || !kit.typography || !kit.voice) {
      return NextResponse.json({ error: "Invalid brand kit format" }, { status: 400 });
    }
    // In production this would save to the database
    return NextResponse.json({ kit, message: "Brand kit saved" });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/* POST: generate suggestions (colors by industry, voice sample) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "suggest-colors") {
      const { industry } = body;
      if (!industry) {
        return NextResponse.json({ error: "Industry is required" }, { status: 400 });
      }

      const INDUSTRY_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
        technology: { primary: "#6366f1", secondary: "#8b5cf6", accent: "#06b6d4" },
        healthcare: { primary: "#0ea5e9", secondary: "#14b8a6", accent: "#22c55e" },
        finance: { primary: "#1e40af", secondary: "#3b82f6", accent: "#f59e0b" },
        education: { primary: "#7c3aed", secondary: "#a78bfa", accent: "#f97316" },
        food: { primary: "#dc2626", secondary: "#f97316", accent: "#facc15" },
        fashion: { primary: "#ec4899", secondary: "#f43f5e", accent: "#a855f7" },
        fitness: { primary: "#16a34a", secondary: "#22c55e", accent: "#eab308" },
        real_estate: { primary: "#0d9488", secondary: "#14b8a6", accent: "#f59e0b" },
        creative: { primary: "#e11d48", secondary: "#be185d", accent: "#8b5cf6" },
        legal: { primary: "#1e3a5f", secondary: "#374151", accent: "#d4a853" },
        nonprofit: { primary: "#059669", secondary: "#10b981", accent: "#6366f1" },
        ecommerce: { primary: "#7c3aed", secondary: "#6366f1", accent: "#f59e0b" },
      };

      const key = industry.toLowerCase().replace(/[\s&-]+/g, "_");
      const colors = INDUSTRY_COLORS[key] || INDUSTRY_COLORS.technology;

      return NextResponse.json({ colors, message: `Color palette suggested for ${industry}` });
    }

    if (action === "voice-sample") {
      const { kit } = body;
      if (!kit?.voice) {
        return NextResponse.json({ error: "Brand kit with voice settings is required" }, { status: 400 });
      }

      const brandName = kit.logo?.text || "our company";
      const industry = kit.audience?.industry || "business";
      const tone = kit.voice.tone ?? 50;
      const formality = kit.voice.formality ?? 50;

      let sample: string;
      if (tone > 66 && formality > 66) {
        sample = `Hey there! Welcome to ${brandName} - we're shaking up the ${industry} world and having a blast doing it. No boring corporate speak here. Just real talk, real results, and maybe a few high-fives along the way. Ready to join the fun?`;
      } else if (tone < 33 && formality < 33) {
        sample = `${brandName} delivers enterprise-grade ${industry} solutions engineered for measurable impact. Our methodology combines data-driven strategy with proven frameworks to drive sustainable growth. We partner with organizations committed to operational excellence.`;
      } else {
        sample = `Welcome to ${brandName}. We're a ${industry} company built on the belief that great results come from genuine partnerships. Our team brings deep expertise and a collaborative approach to every project. Let's build something meaningful together.`;
      }

      return NextResponse.json({ sample, message: "Voice sample generated" });
    }

    if (action === "generate-logo") {
      const { brandName, industry } = body;
      // Generate a simple SVG text-based logo
      const colors = body.colors || { primary: "#6366f1" };
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
        <rect width="200" height="60" rx="8" fill="${colors.primary}" opacity="0.1"/>
        <text x="100" y="38" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="700" fill="${colors.primary}">${brandName || "Brand"}</text>
      </svg>`;

      return NextResponse.json({
        svg,
        message: `Logo generated for ${brandName || industry || "brand"}`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
