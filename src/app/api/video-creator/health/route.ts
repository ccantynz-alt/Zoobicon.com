import { NextRequest } from "next/server";

/**
 * GET /api/video-creator/health
 *
 * Diagnostic endpoint — checks if the Replicate API token is valid
 * by making a lightweight API call. Returns clear status.
 *
 * Only accessible with admin query param for security.
 */
export async function GET(req: NextRequest) {
  const isAdmin = req.nextUrl.searchParams.get("admin") === "true";

  // Check which env vars are set (never expose actual values)
  const envStatus = {
    REPLICATE_API_TOKEN: !!process.env.REPLICATE_API_TOKEN,
    REPLICATE_API_KEY: !!process.env.REPLICATE_API_KEY,
    REPLICATE_TOKEN: !!process.env.REPLICATE_TOKEN,
    REPLICATE_KEY: !!process.env.REPLICATE_KEY,
    ZOOBICON_VIDEO_API_URL: !!process.env.ZOOBICON_VIDEO_API_URL,
  };

  const token =
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN ||
    process.env.REPLICATE_KEY;

  if (!token) {
    return Response.json({
      status: "error",
      message: "No Replicate API token found in any environment variable.",
      envVarsSet: isAdmin ? envStatus : undefined,
      fix: "Add REPLICATE_API_TOKEN to your Vercel environment variables and redeploy.",
    });
  }

  // Mask the token for display (show first 4 and last 4 chars)
  const masked = token.length > 10
    ? `${token.slice(0, 4)}...${token.slice(-4)}`
    : "***";

  // Test the token by hitting a lightweight Replicate endpoint
  try {
    const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      return Response.json({
        status: "ok",
        message: "Replicate API token is valid and working.",
        tokenPreview: isAdmin ? masked : undefined,
        envVarsSet: isAdmin ? envStatus : undefined,
        replicateResponse: res.status,
      });
    }

    // Token exists but API rejected it
    const errText = await res.text().catch(() => "");
    return Response.json({
      status: "error",
      message: `Replicate API returned ${res.status}. Token may be invalid or expired.`,
      tokenPreview: isAdmin ? masked : undefined,
      envVarsSet: isAdmin ? envStatus : undefined,
      replicateStatus: res.status,
      detail: isAdmin ? errText.slice(0, 200) : undefined,
      fix: res.status === 401
        ? "The API token is invalid. Go to replicate.com/account/api-tokens to get a new one, update it in Vercel environment variables, and redeploy."
        : `Replicate returned HTTP ${res.status}. Check your account at replicate.com.`,
    });
  } catch (err) {
    return Response.json({
      status: "error",
      message: "Could not reach Replicate API.",
      detail: err instanceof Error ? err.message : "Network error",
      tokenPreview: isAdmin ? masked : undefined,
      envVarsSet: isAdmin ? envStatus : undefined,
    });
  }
}
