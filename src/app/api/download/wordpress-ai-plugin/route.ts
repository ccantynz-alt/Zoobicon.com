import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const zipPath = join(process.cwd(), "public", "zoobicon-ai.zip");
    const buffer = await readFile(zipPath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="zoobicon-ai.zip"',
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "Plugin download not available" }, { status: 404 });
  }
}
