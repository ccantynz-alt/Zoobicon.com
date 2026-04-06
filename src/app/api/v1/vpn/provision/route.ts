import { NextRequest, NextResponse } from "next/server";
import { provisionVpn } from "@/lib/vpn-provider";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    const { userId, planId } = await request.json();

    if (!userId || !planId) {
      return NextResponse.json(
        { error: "userId and planId are required" },
        { status: 400 }
      );
    }

    const result = await provisionVpn(userId, planId);
    const qrCodeImage = await QRCode.toDataURL(result.qrCodeData);

    return NextResponse.json({
      success: true,
      vpn: { ...result, qrCodeImage },
    });
  } catch (error) {
    console.error("VPN provision error:", error);
    return NextResponse.json(
      { error: "Failed to provision VPN" },
      { status: 500 }
    );
  }
}
