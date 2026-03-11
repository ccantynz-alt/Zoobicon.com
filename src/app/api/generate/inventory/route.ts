import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_FEATURES = [
  "product-catalog",
  "stock-tracking",
  "order-management",
  "supplier-management",
  "barcode-scanner",
  "low-stock-alerts",
  "reports-analytics",
  "purchase-orders",
  "warehouse-locations",
  "batch-tracking",
];

const INVENTORY_SYSTEM = `You are Zoobicon's Inventory Management System Generator. You create comprehensive inventory and warehouse management dashboards as single HTML files. Think Sortly, inFlow, or Cin7 quality.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.

## Inventory System Features

### Dashboard
- KPI cards: total products, total stock value, low stock items, pending orders.
- Stock level chart (bar chart by category).
- Recent activity feed.
- Alerts panel (low stock, expiring items).

### Product Catalog
- Product table: SKU, name, category, quantity, price, status (in stock/low/out).
- Color-coded stock status badges.
- Search and filter by category, status, supplier.
- Add/edit product form with all fields.
- Product detail: history, stock movements, supplier info.
- Bulk import placeholder.

### Stock Tracking
- Stock adjustment form: product, quantity +/-, reason, date.
- Movement history log.
- Real-time quantity updates.
- Minimum stock level settings per product.
- Automatic low stock alerts.

### Order Management
- Orders table: order #, date, customer, items, total, status.
- Order detail with line items.
- Status workflow: Pending → Processing → Shipped → Delivered.
- Create order form.
- Order fulfillment: pick, pack, ship workflow.

### Supplier Management
- Supplier directory: name, contact, products supplied, lead time.
- Create purchase orders to suppliers.
- Supplier performance metrics.

### Reports
- Stock valuation report.
- Movement report (in/out over time period).
- Top selling/moving products.
- Dead stock identification.
- Reorder point analysis.
- All charts in pure CSS/SVG.

### Design
- Professional, data-dense but organized.
- Sidebar with inventory-specific navigation.
- Status colors: green (in stock), orange (low), red (out of stock).
- Clean tables with proper sorting and pagination.
- Print-friendly report layouts.
- Mobile: stacked card views for products.

### Data
- Seed with 30-50 products across 5-6 categories.
- 5-8 suppliers.
- 10-15 sample orders.
- Stock movement history.
- All CRUD operations with localStorage.
- Calculations must be mathematically correct.`;

export async function POST(req: NextRequest) {
  try {
    const { businessName, businessType, features, categories } = await req.json();

    if (!businessName || typeof businessName !== "string") {
      return NextResponse.json({ error: "businessName is required" }, { status: 400 });
    }

    const selectedFeatures = Array.isArray(features) && features.length > 0
      ? features.filter((f: string) => VALID_FEATURES.includes(f))
      : ["product-catalog", "stock-tracking", "order-management", "low-stock-alerts", "reports-analytics"];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: INVENTORY_SYSTEM,
      messages: [{
        role: "user",
        content: `Create an inventory management system for "${businessName}".\n\nBusiness type: ${businessType || "retail"}\nCategories: ${Array.isArray(categories) ? categories.join(", ") : "Generate appropriate product categories"}\nFeatures: ${selectedFeatures.join(", ")}\n\nSeed with 30-50 realistic products, suppliers, and orders. Stock calculations must be accurate. All CRUD operations functional with localStorage. Include dashboard with KPIs and charts.`,
      }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response generated" }, { status: 500 });
    }

    let html = textBlock.text.trim();
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({ html, businessName, featuresIncluded: selectedFeatures });
  } catch (err) {
    console.error("Inventory system generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
