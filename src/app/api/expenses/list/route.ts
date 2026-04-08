import { NextResponse } from "next/server";
import { listExpenses, type DateRange } from "@/lib/expense-tracker";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const range: DateRange | undefined = from && to ? { from, to } : undefined;
  try {
    const expenses = await listExpenses(userId, range);
    return NextResponse.json({ expenses });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
