import { NextRequest, NextResponse } from "next/server";
import { parseCsv, detectSchema } from "@/lib/csv-etl";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { csv?: unknown };
    if (typeof body.csv !== "string") {
      return NextResponse.json({ error: "csv (string) is required" }, { status: 400 });
    }
    const result = parseCsv(body.csv);
    const schema = detectSchema(result.rows);
    return NextResponse.json({ ...result, schema });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "parse failed" },
      { status: 500 }
    );
  }
}
