import { NextResponse } from "next/server";
import { getProviderName, getVpnPlans, getVpnServers } from "@/lib/vpn-provider";

export async function GET() {
  try {
    const [plans, servers] = await Promise.all([getVpnPlans(), getVpnServers()]);

    return NextResponse.json({ provider: getProviderName(), plans, servers });
  } catch (error) {
    console.error("VPN plans error:", error);
    return NextResponse.json(
      { error: "Failed to fetch VPN plans" },
      { status: 500 }
    );
  }
}
