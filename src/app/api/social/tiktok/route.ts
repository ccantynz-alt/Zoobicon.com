import { NextRequest, NextResponse } from "next/server";

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || "";
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || "";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://zoobicon.com";

/**
 * GET /api/social/tiktok — Initiate TikTok OAuth flow
 * Redirects user to TikTok authorization page
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Handle OAuth callback
  if (action === "callback") {
    return handleCallback(request);
  }

  // Handle status check
  if (action === "status") {
    return NextResponse.json({
      configured: !!(TIKTOK_CLIENT_KEY && TIKTOK_CLIENT_SECRET),
      clientKey: TIKTOK_CLIENT_KEY ? "configured" : "missing",
    });
  }

  // Initiate OAuth
  if (!TIKTOK_CLIENT_KEY) {
    return NextResponse.json(
      { error: "TikTok integration not configured. Add TIKTOK_CLIENT_KEY to environment." },
      { status: 503 }
    );
  }

  const csrfState = Math.random().toString(36).substring(2, 15);
  const redirectUri = `${BASE_URL}/api/social/tiktok?action=callback`;

  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", TIKTOK_CLIENT_KEY);
  authUrl.searchParams.set("scope", "user.info.basic,video.publish,video.upload");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", csrfState);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("tiktok_csrf", csrfState, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });
  return response;
}

/**
 * Handle TikTok OAuth callback — exchange code for access token
 */
async function handleCallback(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${BASE_URL}/video-creator?tiktok_error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${BASE_URL}/video-creator?tiktok_error=no_code`
    );
  }

  // Verify CSRF state
  const storedState = request.cookies.get("tiktok_csrf")?.value;
  if (state !== storedState) {
    return NextResponse.redirect(
      `${BASE_URL}/video-creator?tiktok_error=csrf_mismatch`
    );
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${BASE_URL}/api/social/tiktok?action=callback`,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      return NextResponse.redirect(
        `${BASE_URL}/video-creator?tiktok_error=${encodeURIComponent(tokenData.error_description || "token_exchange_failed")}`
      );
    }

    // Get user info
    const userRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    const userData = await userRes.json();
    const userInfo = userData.data?.user || {};

    // Redirect back to video creator with token in fragment (not exposed to server logs)
    // The client stores this in localStorage
    const tokenPayload = JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      open_id: tokenData.open_id,
      display_name: userInfo.display_name || "TikTok User",
      avatar_url: userInfo.avatar_url || "",
      connected_at: new Date().toISOString(),
    });

    const encoded = Buffer.from(tokenPayload).toString("base64");
    const response = NextResponse.redirect(
      `${BASE_URL}/video-creator?tiktok_connected=1#tiktok_token=${encoded}`
    );
    response.cookies.delete("tiktok_csrf");
    return response;
  } catch (err) {
    return NextResponse.redirect(
      `${BASE_URL}/video-creator?tiktok_error=server_error`
    );
  }
}

/**
 * POST /api/social/tiktok — Upload video to TikTok
 * Uses TikTok Content Posting API (direct post)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, videoUrl, title, privacyLevel = "SELF_ONLY" } = body;

    if (!accessToken) {
      return NextResponse.json({ error: "Not connected to TikTok. Please connect your account first." }, { status: 401 });
    }

    if (!videoUrl) {
      return NextResponse.json({ error: "No video URL provided. Render a video first." }, { status: 400 });
    }

    // Step 1: Initialize upload via "pull from URL" method
    const initRes = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          post_info: {
            title: (title || "").substring(0, 150),
            privacy_level: privacyLevel,
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: videoUrl,
          },
        }),
      }
    );

    const initData = await initRes.json();

    if (initData.error?.code !== "ok" && initData.error?.code) {
      const errMsg = initData.error?.message || "TikTok upload failed";
      // Handle common errors with user-friendly messages
      if (errMsg.includes("token") || errMsg.includes("auth")) {
        return NextResponse.json(
          { error: "TikTok session expired. Please reconnect your account." },
          { status: 401 }
        );
      }
      if (errMsg.includes("scope") || errMsg.includes("permission")) {
        return NextResponse.json(
          { error: "TikTok permissions missing. Please reconnect with video upload permission." },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      publishId: initData.data?.publish_id,
      message: "Video submitted to TikTok! It may take a few minutes to process and appear on your profile.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to upload to TikTok. Please try again." },
      { status: 500 }
    );
  }
}
