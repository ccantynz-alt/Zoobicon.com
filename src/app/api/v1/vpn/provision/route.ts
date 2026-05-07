import { NextRequest, NextResponse } from "next/server";
import { provisionVpn } from "@/lib/vpn-provider";
import { requireApiKey, isAuthenticated } from "@/lib/v1-auth";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  const auth = await requireApiKey(request);
  if (!isAuthenticated(auth)) return auth;

  try {
    const { planId } = await request.json();

    // Ownership is derived from the validated API key — never trust a
    // client-supplied userId. Previously this route accepted any userId
    // in the request body and would provision a VPN for that account.
    const userId = auth.ownerEmail;

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
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
