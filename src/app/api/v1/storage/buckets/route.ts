import { NextRequest, NextResponse } from "next/server";
import { listBuckets, createBucket, getProviderName, getStoragePlans } from "@/lib/storage-provider";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const buckets = await listBuckets(userId);
    const plans = await getStoragePlans();

    return NextResponse.json({
      provider: getProviderName(),
      buckets,
      plans,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list buckets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, userId } = await req.json();
    if (!name || !userId) {
      return NextResponse.json({ error: "name and userId are required" }, { status: 400 });
    }

    const bucket = await createBucket(name);

    return NextResponse.json({ success: true, bucket });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create bucket" },
      { status: 500 }
    );
  }
}
