/**
 * /api/crontech/catalog — Zoobicon's proxy for Vapron's add-on
 * catalog. Powers the marketplace UI at /marketplace.
 *
 * Returns { source, fetchedAt, addOns, pricingProvisional }. When
 * CRONTECH_PAT is set, fetches Vapron's real catalog. When unset
 * (or fetch fails), falls back to the stub catalog in
 * src/lib/crontech-catalog.ts.
 *
 * pricingProvisional is honest signal: in stub mode it's always true
 * (we haven't seen Vapron's final pricing yet); in live mode it
 * mirrors whatever Vapron reports.
 */

import { NextResponse } from "next/server";
import { getVapronCatalog } from "@/lib/crontech-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await getVapronCatalog();
    return NextResponse.json(catalog);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load catalog" },
      { status: 500 }
    );
  }
}
