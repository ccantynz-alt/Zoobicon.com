import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { sql } from "@/lib/db";
import {
  OVERAGE_PACKS,
  addOverageCredits,
  getOverageCredits,
} from "@/lib/video-usage";

/**
 * GET /api/video-creator/overage — List available credit packs + user's current overage balance
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  let credits = { videos: 0, images: 0, renders: 0, voiceovers: 0 };
  if (email) {
    credits = await getOverageCredits(email);
  }

  return Response.json({
    packs: OVERAGE_PACKS,
    credits,
  });
}

/**
 * POST /api/video-creator/overage — Purchase a credit pack via Stripe
 * Body: { email: string, packId: string }
 * Returns: { url: string } — Stripe Checkout URL
 */
export async function POST(req: NextRequest) {
  try {
    const { email, packId } = await req.json();

    if (!email || typeof email !== "string") {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    const pack = OVERAGE_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return Response.json(
        { error: `Unknown credit pack: ${packId}. Available: ${OVERAGE_PACKS.map((p) => p.id).join(", ")}` },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Re-use existing Stripe customer
    let customerId: string | undefined;
    try {
      const [existing] = await sql`
        SELECT stripe_customer_id FROM users WHERE email = ${email} LIMIT 1
      `;
      if (existing?.stripe_customer_id) {
        customerId = existing.stripe_customer_id;
      }
    } catch { /* DB may not have stripe_customer_id column yet */ }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pack.name,
              description: `${pack.videos} video credits, ${pack.images} image credits, ${pack.renders} render credits, ${pack.voiceovers} voiceover credits. Valid for 90 days.`,
            },
            unit_amount: pack.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "video_overage",
        email,
        packId: pack.id,
      },
      success_url: `${appUrl}/video-creator?credits=purchased&pack=${pack.id}`,
      cancel_url: `${appUrl}/video-creator?credits=cancelled`,
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[video-creator/overage] Error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/video-creator/overage — Fulfill a credit pack (called by Stripe webhook or manually)
 * Body: { email: string, packId: string, stripeSessionId?: string }
 */
export async function PUT(req: NextRequest) {
  try {
    const { email, packId, stripeSessionId } = await req.json();

    if (!email || !packId) {
      return Response.json({ error: "email and packId required" }, { status: 400 });
    }

    const pack = OVERAGE_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return Response.json({ error: `Unknown pack: ${packId}` }, { status: 400 });
    }

    await addOverageCredits(email, pack, stripeSessionId);
    const credits = await getOverageCredits(email);

    return Response.json({
      success: true,
      pack: pack.name,
      credits,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fulfill credits";
    console.error("[video-creator/overage] Fulfillment error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
