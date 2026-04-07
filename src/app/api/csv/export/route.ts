import { NextRequest, NextResponse } from "next/server";
import { writeCsv, type CsvRow } from "@/lib/csv-etl";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { rows?: unknown; headers?: unknown };
    if (!Array.isArray(body.rows)) {
      return NextResponse.json({ error: "rows (array) is required" }, { status: 400 });
    }
    const headers =
      Array.isArray(body.headers) && body.headers.every((h) => typeof h === "string")
        ? (body.headers as string[])
        : undefined;
    const csv = writeCsv(body.rows as CsvRow[], headers);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="export.csv"',
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "export failed" },
      { status: 500 }
    );
  }
}
