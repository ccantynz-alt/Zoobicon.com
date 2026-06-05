/**
 * POST /api/v2/build — Builder V2 server-side build + render.
 *
 * The whole V2 reliability thesis lives here: the server assembles the
 * slot-locked page and renders it to static HTML. The client receives
 * finished HTML and shows it in an iframe — it never transpiles, hashes,
 * or module-loads generated code, so it can't hit the WebKit/iPad failures
 * that plagued V1.
 *
 * Body: { prompt, brandName?, industry?, theme?, useExampleFill? }
 * Returns: { ok, html, componentIds, industry, theme, aiUsed }
 *
 * Runtime is nodejs (react-dom/server + the TypeScript transpiler need it).
 */

import { NextRequest } from "next/server";
import { renderSlotPage } from "@/lib/v2/render-page";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest): Promise<Response> {
  let body: {
    prompt?: string;
    brandName?: string;
    industry?: string;
    theme?: string;
    useExampleFill?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  if (!prompt && !body.useExampleFill) {
    return Response.json(
      { ok: false, error: "Describe the site you want (or pass useExampleFill)." },
      { status: 400 },
    );
  }

  try {
    const page = await renderSlotPage({
      prompt,
      brandName: body.brandName,
      industry: body.industry,
      theme: body.theme,
      useExampleFill: body.useExampleFill,
    });
    return Response.json({ ok: true, ...page });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Build failed unexpectedly.";
    return Response.json(
      { ok: false, error: message, hint: "This is on us — the build is deterministic, so a retry should succeed." },
      { status: 500 },
    );
  }
}
