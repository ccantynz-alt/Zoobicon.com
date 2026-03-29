import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage-provider";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucketId = formData.get("bucketId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!bucketId) {
      return NextResponse.json({ error: "bucketId is required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFile(bucketId, file.name, buffer, file.type);

    return NextResponse.json({ success: true, file: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upload file" },
      { status: 500 }
    );
  }
}
