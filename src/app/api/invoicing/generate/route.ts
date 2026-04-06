import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// POST /api/invoicing/generate
// AI-powered invoice / proposal generation from a natural language description.
//
// Body: { description: string, type: "invoice" | "proposal", clientName?: string }
//
// In production this would call an LLM to parse the description into structured
// line items. For now it returns smart mock data based on keyword matching.
// ---------------------------------------------------------------------------

interface GeneratedItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

function generateInvoiceItems(description: string): GeneratedItem[] {
  const lower = description.toLowerCase();
  const items: GeneratedItem[] = [];

  // Website / redesign
  if (lower.includes("website") || lower.includes("redesign") || lower.includes("landing page")) {
    const pages = lower.match(/(\d+)\s*page/);
    const pageCount = pages ? parseInt(pages[1]) : 5;
    items.push({
      description: `Website ${lower.includes("redesign") ? "redesign" : "development"} — ${pageCount} pages`,
      quantity: 1,
      rate: pageCount <= 3 ? 1200 : pageCount <= 6 ? 1800 : 2800,
      amount: pageCount <= 3 ? 1200 : pageCount <= 6 ? 1800 : 2800,
    });
  }

  // E-commerce / store
  if (lower.includes("ecommerce") || lower.includes("e-commerce") || lower.includes("store") || lower.includes("shop")) {
    items.push({ description: "E-commerce storefront with product catalog", quantity: 1, rate: 2400, amount: 2400 });
    items.push({ description: "Shopping cart & Stripe checkout integration", quantity: 1, rate: 800, amount: 800 });
  }

  // SEO
  if (lower.includes("seo")) {
    items.push({ description: "SEO optimization — meta tags, schema markup, sitemap", quantity: 1, rate: 600, amount: 600 });
  }

  // Animations / custom
  if (lower.includes("animation") || lower.includes("custom")) {
    items.push({ description: "Custom animations & micro-interactions", quantity: 1, rate: 500, amount: 500 });
  }

  // Mobile / responsive
  if (lower.includes("mobile") || lower.includes("responsive")) {
    items.push({ description: "Mobile-responsive optimization", quantity: 1, rate: 400, amount: 400 });
  }

  // Logo / branding
  if (lower.includes("logo") || lower.includes("brand")) {
    items.push({ description: "Brand identity — logo, colors, typography guide", quantity: 1, rate: 900, amount: 900 });
  }

  // Blog
  if (lower.includes("blog")) {
    items.push({ description: "Blog engine with CMS integration", quantity: 1, rate: 700, amount: 700 });
  }

  // Booking
  if (lower.includes("booking") || lower.includes("appointment") || lower.includes("schedule")) {
    items.push({ description: "Online booking & scheduling system", quantity: 1, rate: 800, amount: 800 });
  }

  // Portal / dashboard
  if (lower.includes("portal") || lower.includes("dashboard")) {
    items.push({ description: "Client portal with secure access", quantity: 1, rate: 1400, amount: 1400 });
  }

  // Hosting / maintenance
  if (lower.includes("hosting") || lower.includes("maintenance")) {
    items.push({ description: "Hosting setup & 3-month maintenance plan", quantity: 3, rate: 200, amount: 600 });
  }

  // Fallback — generic consulting
  if (items.length === 0) {
    items.push({ description: "Web development consulting & implementation", quantity: 1, rate: 1500, amount: 1500 });
    items.push({ description: "Project setup & configuration", quantity: 1, rate: 300, amount: 300 });
  }

  return items;
}

function generateProposal(description: string, clientName: string) {
  const lower = description.toLowerCase();
  const items = generateInvoiceItems(description);
  const total = items.reduce((s, i) => s + i.amount, 0);

  const isEcommerce = lower.includes("ecommerce") || lower.includes("store");
  const isRedesign = lower.includes("redesign");

  const title = clientName
    ? `${clientName} — ${isEcommerce ? "E-Commerce Solution" : isRedesign ? "Website Redesign" : "Digital Project"}`
    : isEcommerce ? "E-Commerce Solution Proposal" : isRedesign ? "Website Redesign Proposal" : "Digital Project Proposal";

  return {
    title,
    summary: `A comprehensive ${isEcommerce ? "e-commerce" : "web development"} project to ${isRedesign ? "modernize and enhance" : "build"} your online presence. This proposal covers design, development, testing, and deployment with ongoing support.`,
    scope: [
      "Discovery & requirements gathering",
      "UI/UX design with 2 revision rounds",
      ...items.map((i) => i.description),
      "Quality assurance & cross-browser testing",
      "Deployment & launch support",
    ],
    timeline: total > 5000 ? "4-6 weeks" : total > 2000 ? "2-3 weeks" : "1-2 weeks",
    deliverables: [
      ...items.map((i) => i.description),
      "Source files & documentation",
      "30-day post-launch support",
    ],
    pricing: items,
    total,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, type, clientName } = body;

    if (!description || !type) {
      return NextResponse.json(
        { success: false, error: "Missing description or type" },
        { status: 400 }
      );
    }

    if (type === "invoice") {
      const items = generateInvoiceItems(description);
      const subtotal = items.reduce((s, i) => s + i.amount, 0);
      const taxRate = 0.09;
      const tax = Math.round(subtotal * taxRate);
      const total = subtotal + tax;

      return NextResponse.json({
        success: true,
        type: "invoice",
        result: {
          items,
          subtotal,
          tax,
          taxRate,
          total,
          notes: "Payment due within 14 days. Thank you for your business!",
          paymentTerms: "Net 14",
        },
      });
    }

    if (type === "proposal") {
      const proposal = generateProposal(description, clientName || "");

      return NextResponse.json({
        success: true,
        type: "proposal",
        result: proposal,
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown type: ${type}` },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
