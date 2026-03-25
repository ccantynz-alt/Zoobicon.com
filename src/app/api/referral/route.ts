import { NextResponse } from "next/server";
import {
  generateReferralCode,
  getReferralStatsFromDB,
  trackReferral,
  getReferralTier,
  anonymizeEmail,
} from "@/lib/referral";

/**
 * GET /api/referral — Get referral stats for a user
 * Query: ?email=user@example.com
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Missing email parameter" },
        { status: 400 }
      );
    }

    const stats = await getReferralStatsFromDB(email);
    const tier = getReferralTier(stats.totalReferred);

    return NextResponse.json({
      referralCode: stats.code,
      signups: stats.totalReferred,
      buildsEarned: stats.creditsEarned,
      history: stats.history,
      tier: { name: tier.name, badge: tier.badge, color: tier.color },
    });
  } catch (err) {
    console.error("Referral GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/referral — Process a referral signup
 * Body: { referralCode: string, referredEmail: string }
 *
 * Called by the signup flow when a user signs up with ?ref= in the URL.
 * Awards 1 free build to both the referrer and the referred user.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { referralCode, referredEmail } = body;

    if (!referralCode || !referredEmail) {
      return NextResponse.json(
        { error: "Missing referralCode or referredEmail" },
        { status: 400 }
      );
    }

    // Validate referral code format
    if (!referralCode.startsWith("ref_")) {
      return NextResponse.json(
        { error: "Invalid referral code format" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(referredEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const success = await trackReferral(referralCode, referredEmail);

    if (!success) {
      return NextResponse.json({
        success: false,
        message: "Referral could not be processed (invalid code, self-referral, or already referred)",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Referral recorded! Both users received 1 free build credit.",
      buildsAwarded: 1,
      referralCode,
      referredEmail: anonymizeEmail(referredEmail),
    });
  } catch (err) {
    console.error("Referral POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
