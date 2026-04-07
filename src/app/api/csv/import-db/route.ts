import { NextRequest, NextResponse } from "next/server";
import { importToDb, type CsvRow } from "@/lib/csv-etl";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      tableName?: unknown;
      rows?: unknown;
      userId?: unknown;
    };
    if (typeof body.tableName !== "string" || body.tableName.length === 0) {
      return NextResponse.json(
        { error: "tableName (string) is required" },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.rows)) {
      return NextResponse.json({ error: "rows (array) is required" }, { status: 400 });
    }
    if (typeof body.userId !== "string" || body.userId.length === 0) {
      return NextResponse.json(
        { error: "userId (string) is required" },
        { status: 400 }
      );
    }
    const result = await importToDb({
      tableName: body.tableName,
      rows: body.rows as CsvRow[],
      userId: body.userId,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "import failed" },
      { status: 500 }
    );
  }
}
