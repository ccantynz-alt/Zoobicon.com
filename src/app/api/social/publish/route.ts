import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/social/publish — Handle video publishing to social platforms
 *
 * For now, since OAuth app registration isn't complete for TikTok/YouTube/Instagram,
 * this endpoint:
 * 1. Validates the request
 * 2. Returns platform-specific upload URLs for manual upload
 * 3. When OAuth is connected, will handle actual API publishing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, videoUrl, title, description, hashtags, connected, scheduledAt } = body;

    if (!platform || !["tiktok", "youtube", "instagram"].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform. Must be tiktok, youtube, or instagram." },
        { status: 400 }
      );
    }

    // Platform-specific upload URLs for manual upload fallback
    const uploadUrls: Record<string, string> = {
      tiktok: "https://www.tiktok.com/upload",
      youtube: "https://www.youtube.com/upload",
      instagram: "https://www.instagram.com/",
    };

    // Platform display names
    const platformNames: Record<string, string> = {
      tiktok: "TikTok",
      youtube: "YouTube Shorts",
      instagram: "Instagram Reels",
    };

    // If scheduling for later
    if (scheduledAt) {
      return NextResponse.json({
        status: "scheduled",
        message: `Post scheduled for ${new Date(scheduledAt).toLocaleString()}. ${
          connected
            ? "It will be auto-published at the scheduled time."
            : `You'll get a reminder to upload to ${platformNames[platform]} manually.`
        }`,
        scheduledAt,
        uploadUrl: uploadUrls[platform],
      });
    }

    // If connected, attempt actual publish (placeholder for future OAuth flow)
    if (connected) {
      // Future: Use stored OAuth tokens to publish via platform APIs
      // TikTok: Content Posting API
      // YouTube: YouTube Data API v3 (videos.insert)
      // Instagram: Instagram Graph API (media publish)

      // For now, return success with manual upload fallback
      return NextResponse.json({
        status: "draft",
        message: `Auto-posting to ${platformNames[platform]} is coming soon. Your post has been prepared with optimized caption and hashtags. Download your video and upload it manually.`,
        uploadUrl: uploadUrls[platform],
        prepared: {
          title: title || "",
          description: description || "",
          hashtags: hashtags || [],
        },
      });
    }

    // Not connected — provide manual upload instructions
    return NextResponse.json({
      status: "draft",
      message: `Post prepared for ${platformNames[platform]}. Connect your account to enable auto-publishing, or download and upload manually.`,
      uploadUrl: uploadUrls[platform],
      prepared: {
        title: title || "",
        description: description || "",
        hashtags: hashtags || [],
      },
    });
  } catch (err) {
    console.error("Social publish error:", err);
    return NextResponse.json(
      { error: "Failed to process publish request." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/social/publish — Check platform connection status
 */
export async function GET() {
  // Return available platforms and their OAuth configuration status
  const platforms = [
    {
      id: "tiktok",
      name: "TikTok",
      oauthConfigured: !!process.env.TIKTOK_CLIENT_KEY,
      uploadUrl: "https://www.tiktok.com/upload",
      maxDuration: 180,
    },
    {
      id: "youtube",
      name: "YouTube Shorts",
      oauthConfigured: !!process.env.YOUTUBE_CLIENT_ID,
      uploadUrl: "https://www.youtube.com/upload",
      maxDuration: 60,
    },
    {
      id: "instagram",
      name: "Instagram Reels",
      oauthConfigured: !!process.env.INSTAGRAM_CLIENT_ID,
      uploadUrl: "https://www.instagram.com/",
      maxDuration: 90,
    },
  ];

  return NextResponse.json({ platforms });
}
