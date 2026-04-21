import { NextRequest, NextResponse } from "next/server";
import {
  transformRows,
  cleanData,
  dedupe,
  type CsvRow,
  type Mapping,
} from "@/lib/csv-etl";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      rows?: unknown;
      mapping?: unknown;
      clean?: unknown;
      dedupeKeys?: unknown;
    };
    if (!Array.isArray(body.rows)) {
      return NextResponse.json({ error: "rows (array) is required" }, { status: 400 });
    }
    if (!body.mapping || typeof body.mapping !== "object") {
      return NextResponse.json(
        { error: "mapping (object) is required" },
        { status: 400 }
      );
    }
    const safeMapping: Mapping = {};
    const rawMapping = body.mapping as Record<string, unknown>;
    for (const k of Object.keys(rawMapping)) {
      const v = rawMapping[k];
      if (typeof v === "string") safeMapping[k] = v;
    }
    let out = transformRows(body.rows as CsvRow[], safeMapping);
    if (body.clean === true) out = cleanData(out);
    if (Array.isArray(body.dedupeKeys)) {
      const keys = (body.dedupeKeys as unknown[]).filter(
        (k): k is string => typeof k === "string"
      );
      out = dedupe(out, keys);
    }
    return NextResponse.json({ rows: out, count: out.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "transform failed" },
      { status: 500 }
    );
  }
}
