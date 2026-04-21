import { NextRequest, NextResponse } from "next/server";
import { getVpnStatus } from "@/lib/vpn-provider";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const usage = await getVpnStatus(userId);
    const bytesToGB = (bytes: number) =>
      Math.round((bytes / 1_073_741_824) * 100) / 100;

    return NextResponse.json({
      ...usage,
      gbUp: bytesToGB(usage.bytesUp),
      gbDown: bytesToGB(usage.bytesDown),
    });
  } catch (error) {
    console.error("VPN status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch VPN status" },
      { status: 500 }
    );
  }
}
