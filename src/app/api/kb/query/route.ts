import { NextRequest, NextResponse } from "next/server";
import { queryKb } from "@/lib/knowledge-base";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface QueryBody {
  ownerId?: string;
  question?: string;
  topK?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: QueryBody;
  try {
    body = (await req.json()) as QueryBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { ownerId, question, topK } = body;
  if (!ownerId || typeof ownerId !== "string") {
    return NextResponse.json({ error: "ownerId is required" }, { status: 400 });
  }
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  const k = typeof topK === "number" && topK > 0 && topK <= 50 ? topK : 5;

  try {
    const result = await queryKb(ownerId, question, k);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status =
      err instanceof Error && typeof (err as Error & { status?: number }).status === "number"
        ? ((err as Error & { status?: number }).status as number)
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
