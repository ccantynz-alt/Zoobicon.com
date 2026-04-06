import { NextRequest } from "next/server";
import { ADDONS } from "../_addons";

/**
 * GET /api/marketplace/addons
 *
 * Returns the full catalog of marketplace add-ons.
 * Supports query params:
 *   ?category=   — filter by category name
 *   ?search=     — full-text search across name + description
 *   ?pricing=    — "free" | "paid" | "all" (default "all")
 *   ?email=      — marks add-ons as installed if they appear in that user's installs
 *                   (currently localStorage-based; this is a placeholder for DB lookup)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category") || "";
    const search = (searchParams.get("search") || "").toLowerCase();
    const pricing = searchParams.get("pricing") || "all";
    // email param reserved for future DB-based install tracking
    // const email = searchParams.get("email") || "";

    let results = ADDONS;

    // --- Category filter ---
    if (category && category !== "All") {
      results = results.filter((a) => a.category === category);
    }

    // --- Search filter ---
    if (search) {
      results = results.filter(
        (a) =>
          a.name.toLowerCase().includes(search) ||
          a.description.toLowerCase().includes(search)
      );
    }

    // --- Pricing filter ---
    if (pricing === "free") {
      results = results.filter((a) => a.price === 0);
    } else if (pricing === "paid") {
      results = results.filter((a) => a.price > 0);
    }

    // Build response objects (strip internal fields, add computed ones)
    const addons = results.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      price: a.price,
      priceType: a.priceType,
      priceLabel: a.priceLabel,
      category: a.category,
      featured: a.featured,
      tag: a.tag ?? null,
      rating: a.rating,
      installs: a.installs,
      gradient: a.gradient,
      iconName: a.iconName,
    }));

    return Response.json({
      success: true,
      count: addons.length,
      addons,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch add-ons";
    console.error("[marketplace/addons]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
