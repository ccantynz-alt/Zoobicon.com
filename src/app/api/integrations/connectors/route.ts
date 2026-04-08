import { NextResponse, type NextRequest } from "next/server";
import { listConnectors } from "@/lib/integrations-hub";

export const runtime = "nodejs";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ connectors: listConnectors() });
}
