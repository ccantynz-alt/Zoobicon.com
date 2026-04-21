import { NextResponse, type NextRequest } from "next/server";
import { runZap } from "@/lib/integrations-hub";

export const runtime = "nodejs";

interface RunBody {
  zapId?: string;
  payload?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }
  let body: RunBody;
  try {
    body = (await req.json()) as RunBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body.zapId) {
    return NextResponse.json({ error: "zapId required" }, { status: 400 });
  }
  const result = await runZap(body.zapId, body.payload ?? {});
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
