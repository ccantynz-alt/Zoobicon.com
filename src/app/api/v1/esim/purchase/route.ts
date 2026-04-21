import { NextRequest, NextResponse } from "next/server";
import { purchaseEsim, getEsimPlans } from "@/lib/esim-provider";
import QRCode from "qrcode";

/**
 * POST /api/v1/esim/purchase
 *
 * Body: { planId: string, email: string }
 * Returns: eSIM details including QR code as data URL
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, email } = body;

    if (!planId || !email) {
      return NextResponse.json(
        { error: "planId and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Verify plan exists
    const plans = await getEsimPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Purchase eSIM from provider
    const result = await purchaseEsim(planId, email);

    // Generate QR code as data URL
    let qrCodeImage = "";
    try {
      qrCodeImage = await QRCode.toDataURL(result.qrCodeData, {
        width: 400,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      });
    } catch {
      // QR generation failed — still return the raw data
    }

    return NextResponse.json({
      success: true,
      esim: {
        id: result.id,
        iccid: result.iccid,
        status: result.status,
        plan: {
          name: result.plan.name || plan.name,
          destination: result.plan.destination || plan.destination,
          dataGB: result.plan.dataAmountGB || plan.dataAmountGB,
          validityDays: result.plan.validityDays || plan.validityDays,
          price: result.plan.price || plan.price,
        },
        activation: {
          smdpAddress: result.smdpAddress,
          activationCode: result.activationCode,
          qrCodeData: result.qrCodeData,
          qrCodeImage,
          // Deep link for iOS 17.4+ / Android 14+ direct install
          deepLink: result.smdpAddress && result.activationCode
            ? `esim://install?smdp=${encodeURIComponent(result.smdpAddress)}&code=${encodeURIComponent(result.activationCode)}`
            : null,
        },
        createdAt: result.createdAt,
      },
    });
  } catch (err) {
    console.error("eSIM purchase error:", err);
    return NextResponse.json(
      { error: "eSIM purchase failed. Please try again." },
      { status: 500 }
    );
  }
}
