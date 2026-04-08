import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/diagnose
 *
 * Reports which auth env vars are set (boolean only — never leaks values).
 * Use this to verify Vercel env config when login is broken.
 *
 * Bible Law 8: clear, actionable diagnostics. No blank screens.
 */
export async function GET(_req: NextRequest) {
  const envs = {
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    DATABASE_URL: !!process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: !!process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: !!process.env.GITHUB_CLIENT_SECRET,
  };

  const issues: { var: string; hint: string }[] = [];

  if (!envs.ADMIN_EMAIL || !envs.ADMIN_PASSWORD) {
    issues.push({
      var: "ADMIN_EMAIL / ADMIN_PASSWORD",
      hint: "Set both in Vercel → Settings → Environment Variables, then redeploy. Without these, admin login is impossible.",
    });
  }

  if (!envs.GOOGLE_CLIENT_ID || !envs.GOOGLE_CLIENT_SECRET) {
    issues.push({
      var: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET",
      hint: "Create OAuth 2.0 Web Client at https://console.cloud.google.com/apis/credentials. Authorized redirect URI: https://zoobicon.com/api/auth/callback/google",
    });
  }

  if (!envs.GITHUB_CLIENT_ID || !envs.GITHUB_CLIENT_SECRET) {
    issues.push({
      var: "GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET",
      hint: "Create OAuth App at https://github.com/settings/developers. Callback URL: https://zoobicon.com/api/auth/callback/github",
    });
  }

  if (!envs.DATABASE_URL) {
    issues.push({
      var: "DATABASE_URL",
      hint: "Set Neon connection string in Vercel. Without this, only admin login (env-based) works — regular users + OAuth user persistence fail.",
    });
  }

  return Response.json(
    {
      ok: issues.length === 0,
      envs,
      issues,
      adminLoginReady: envs.ADMIN_EMAIL && envs.ADMIN_PASSWORD,
      googleOAuthReady: envs.GOOGLE_CLIENT_ID && envs.GOOGLE_CLIENT_SECRET,
      githubOAuthReady: envs.GITHUB_CLIENT_ID && envs.GITHUB_CLIENT_SECRET,
      checkedAt: new Date().toISOString(),
    },
    { status: 200 }
  );
}
