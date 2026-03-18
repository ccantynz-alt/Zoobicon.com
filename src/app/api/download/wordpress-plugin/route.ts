import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "public", "zoobicon-connect.zip");
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="zoobicon-connect.zip"',
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }
}
