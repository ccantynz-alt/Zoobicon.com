import { NextResponse } from "next/server";

/**
 * GET /api/referral — Get referral stats for a user
 * Query: ?code=ref_xxxxx
 *
 * MVP: returns placeholder stats. When DB is wired, query referral tables.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Missing referral code" },
        { status: 400 }
      );
    }

    // MVP: return structure that the client can merge with localStorage data
    return NextResponse.json({
      referralCode: code,
      linkCopied: 0,
      signups: 0,
      buildsEarned: 0,
      history: [],
      tier: { name: "Newcomer", badge: "🌱", color: "text-gray-400" },
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
 * Body: { referrerCode: string, referredEmail: string }
 *
 * MVP: validates input, returns success. When DB is wired,
 * create referral record and credit builds to referrer.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { referrerCode, referredEmail } = body;

    if (!referrerCode || !referredEmail) {
      return NextResponse.json(
        { error: "Missing referrerCode or referredEmail" },
        { status: 400 }
      );
    }

    // Validate referral code format
    if (!referrerCode.startsWith("ref_")) {
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

    // MVP: acknowledge the referral. In production, this would:
    // 1. Check referrerCode exists in DB
    // 2. Ensure referredEmail hasn't already been referred
    // 3. Create referral record
    // 4. Credit 5 builds to referrer when referred user builds first site

    return NextResponse.json({
      success: true,
      message: "Referral recorded successfully",
      buildsAwarded: 5,
      referrerCode,
      referredEmail: referredEmail.replace(
        /^(.)(.*)(@.*)$/,
        (_: string, first: string, _mid: string, domain: string) => `${first}***${domain}`
      ),
    });
  } catch (err) {
    console.error("Referral POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
