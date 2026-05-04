import { NextRequest, NextResponse } from "next/server";
import { listBuckets, createBucket, getProviderName, getStoragePlans } from "@/lib/storage-provider";
import { requireApiKey, isAuthenticated } from "@/lib/v1-auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiKey(req);
  if (!isAuthenticated(auth)) return auth;

  try {
    // Ownership is derived from the validated API key — never trust a
    // client-supplied userId. The previous version listed buckets for
    // any user in the query string.
    const userId = auth.ownerEmail;

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
  const auth = await requireApiKey(req);
  if (!isAuthenticated(auth)) return auth;

  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
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
