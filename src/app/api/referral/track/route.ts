import { NextResponse } from "next/server";

/**
 * POST /api/referral/track — Track a referral link click
 * Body: { referralCode: string }
 *
 * Used for analytics on referral link performance.
 * MVP: acknowledges the click. When DB is wired, increment click counter.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode) {
      return NextResponse.json(
        { error: "Missing referralCode" },
        { status: 400 }
      );
    }

    if (!referralCode.startsWith("ref_")) {
      return NextResponse.json(
        { error: "Invalid referral code format" },
        { status: 400 }
      );
    }

    // MVP: acknowledge the click tracking
    // In production: INSERT INTO referral_clicks (code, ip, user_agent, timestamp)
    return NextResponse.json({
      success: true,
      message: "Click tracked",
      referralCode,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Referral track error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
