/**
 * POST /api/brand-assets — generate the full brand kit (favicon,
 * email signature, social cards, business card) from a BrandSpec.
 *
 * Body:
 *   {
 *     brandSpec: BrandSpec,
 *     contactInfo?: { name, role, email, phone, website }
 *   }
 *
 * Returns:
 *   {
 *     ok: true,
 *     assets: { favicon, emailSignature, socialCardOG,
 *               socialCardTwitter, businessCard }
 *   }
 *
 * No LLM calls; all template-based. Used by /brand-kit page after a
 * build completes — the BrandSpec from the planner gets passed in
 * and the kit derives in milliseconds.
 */

import { NextResponse } from "next/server";
import {
  generateBrandAssets,
  type BrandSpec,
} from "@/lib/brand-assets";

export const dynamic = "force-dynamic";

interface RequestBody {
  brandSpec?: BrandSpec;
  contactInfo?: {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const spec = body.brandSpec;
  if (!spec || !spec.brandName || !spec.primaryColor || !spec.bgColor) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "brandSpec required with at minimum { brandName, primaryColor, bgColor, textPrimary, textSecondary, accentColor, headlineFont, bodyFont }",
      },
      { status: 400 }
    );
  }

  try {
    const assets = generateBrandAssets(spec, body.contactInfo);
    return NextResponse.json({ ok: true, assets });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Generation failed",
      },
      { status: 500 }
    );
  }
}
