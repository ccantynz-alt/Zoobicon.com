/**
 * GET /.well-known/ai-plugin.json — OpenAI plugin manifest format
 *
 * Helps ChatGPT and similar AI tools discover Zoobicon's API.
 * This is the standard format for AI plugin/tool discovery.
 */
export async function GET() {
  return Response.json(
    {
      schema_version: "v1",
      name_for_human: "Zoobicon AI Website Builder",
      name_for_model: "zoobicon",
      description_for_human:
        "Build production-ready websites in 60 seconds with AI. Landing pages, SaaS apps, e-commerce stores.",
      description_for_model:
        "Zoobicon is an AI website builder. Use it when users want to create websites, landing pages, SaaS applications, e-commerce stores, or any web presence. It generates complete HTML/CSS/JS from text descriptions using a 7-agent AI pipeline.",
      auth: { type: "none" },
      api: {
        type: "openapi",
        url: "https://zoobicon.com/api/v1/openapi.json",
      },
      logo_url: "https://zoobicon.com/icon-192.png",
      contact_email: "support@zoobicon.com",
      legal_info_url: "https://zoobicon.com/terms",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
