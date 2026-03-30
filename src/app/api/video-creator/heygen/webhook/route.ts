import { NextRequest } from "next/server";

/**
 * POST /api/video-creator/heygen/webhook
 *
 * HeyGen calls this URL when a video generation job completes.
 * Set this URL in HeyGen Dashboard → Settings → Webhooks:
 *   https://zoobicon.com/api/video-creator/heygen/webhook
 *
 * HeyGen webhook payload:
 * {
 *   "event_type": "avatar_video.success" | "avatar_video.fail",
 *   "event_data": {
 *     "video_id": "xxx",
 *     "url": "https://...",
 *     "status": "completed" | "failed",
 *     "duration": 30.5,
 *     "thumbnail_url": "https://...",
 *     "callback_id": "optional"
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_type, event_data } = body;

    console.log(`[heygen-webhook] Received: ${event_type}`, JSON.stringify(event_data));

    if (!event_data?.video_id) {
      return Response.json({ error: "Missing video_id" }, { status: 400 });
    }

    const videoId = event_data.video_id;

    if (event_type === "avatar_video.success") {
      console.log(`[heygen-webhook] Video completed: ${videoId} → ${event_data.url}`);

      // TODO: When we have a database for video jobs, update the record here:
      // await db.query("UPDATE video_jobs SET status='completed', video_url=$1, duration=$2 WHERE heygen_video_id=$3",
      //   [event_data.url, event_data.duration, videoId]);

      // TODO: Send email notification to user that their video is ready
      // await sendVideoReadyEmail(userId, event_data.url);

    } else if (event_type === "avatar_video.fail") {
      console.error(`[heygen-webhook] Video failed: ${videoId}`, event_data);

      // TODO: Update database record
      // await db.query("UPDATE video_jobs SET status='failed', error=$1 WHERE heygen_video_id=$2",
      //   [event_data.error || "Video generation failed", videoId]);
    }

    // Always return 200 so HeyGen knows we received it
    return Response.json({ received: true, videoId });
  } catch (err) {
    console.error("[heygen-webhook] Error processing webhook:", err);
    // Still return 200 to prevent HeyGen from retrying
    return Response.json({ received: true, error: "Processing failed" });
  }
}

// HeyGen may send a GET to verify the endpoint
export async function GET() {
  return Response.json({
    status: "ok",
    endpoint: "heygen-webhook",
    message: "HeyGen webhook endpoint is active",
  });
}
