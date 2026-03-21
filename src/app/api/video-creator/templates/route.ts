import { NextRequest } from "next/server";
import {
  VIDEO_TEMPLATES,
  VIDEO_TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates,
  type VideoTemplateCategory,
} from "@/lib/video-templates";

/**
 * GET /api/video-creator/templates — List video templates
 *
 * Query params:
 *   ?category=marketing    — Filter by category
 *   ?search=pitch          — Search by query
 *   ?id=startup-pitch-60   — Get specific template
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const id = searchParams.get("id");

  // Get specific template
  if (id) {
    const template = getTemplateById(id);
    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }
    return Response.json({ template });
  }

  // Search
  if (search) {
    const results = searchTemplates(search);
    return Response.json({
      templates: results,
      total: results.length,
      query: search,
    });
  }

  // Filter by category
  if (category) {
    const results = getTemplatesByCategory(category as VideoTemplateCategory);
    return Response.json({
      templates: results,
      total: results.length,
      category,
    });
  }

  // Return all
  return Response.json({
    templates: VIDEO_TEMPLATES,
    total: VIDEO_TEMPLATES.length,
    categories: VIDEO_TEMPLATE_CATEGORIES,
  });
}
