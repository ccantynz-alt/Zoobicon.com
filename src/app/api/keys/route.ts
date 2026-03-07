import { NextRequest } from "next/server";
import { generateApiKey, ApiKeyPlan } from "@/lib/apiKey";

/**
 * POST /api/keys — generate a new API key for the requesting user.
 * Body: { email: string, plan: ApiKeyPlan, version?: number }
 *
 * This is called client-side from settings. No auth token needed because
 * the user's session is in localStorage (client-only). The generated key
 * is returned to the client to store in localStorage.
 *
 * TODO: once Supabase is added, require a session token and store a hash
 * of the key server-side so individual keys can be revoked.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, plan, version } = await request.json();

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validPlans: ApiKeyPlan[] = ["free", "pro", "enterprise"];
    const resolvedPlan: ApiKeyPlan = validPlans.includes(plan) ? plan : "free";

    const key = await generateApiKey(email, resolvedPlan, version ?? 1);

    return new Response(JSON.stringify({ key }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
