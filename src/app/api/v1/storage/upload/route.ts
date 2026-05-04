import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage-provider";
import { requireApiKey, isAuthenticated } from "@/lib/v1-auth";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB hard cap

export async function POST(req: NextRequest) {
  const auth = await requireApiKey(req);
  if (!isAuthenticated(auth)) return auth;

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
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File too large (${file.size} bytes). Max ${MAX_UPLOAD_BYTES} bytes.` },
        { status: 413 }
      );
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
