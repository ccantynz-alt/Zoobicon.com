import { NextRequest, NextResponse } from "next/server";
import {
  getUsage,
  canStartSession,
  startSession,
  endSession,
  getActiveSession,
  getPlanLimits,
} from "@/lib/support-usage";

// ---------------------------------------------------------------------------
// GET /api/support/usage?email=xxx — get usage stats and session status
// POST /api/support/usage — start or end a session
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  try {
    const usage = await getUsage(email);
    const sessionCheck = await canStartSession(email);
    const activeSession = await getActiveSession(email);

    return NextResponse.json({
      plan: usage.plan,
      hasPremiumAddon: usage.hasPremiumAddon,
      minutesUsed: Math.round(usage.minutesUsed * 10) / 10,
      minutesRemaining: Math.round(usage.minutesRemaining * 10) / 10,
      monthlyLimit: usage.limits.monthlyMinutes,
      tokensUsed: usage.tokensUsed,
      sessionsCount: usage.sessionsCount,
      sessionMaxMinutes: usage.limits.sessionMaxMinutes,
      sessionTokenBudget: usage.limits.sessionTokenBudget,
      messageCooldownSecs: usage.limits.messageCooldownSecs,
      hasLiveAgent: usage.limits.hasLiveAgent,
      canStartSession: sessionCheck.allowed,
      sessionBlockReason: sessionCheck.reason || null,
      activeSession: activeSession
        ? {
            sessionId: activeSession.sessionId,
            elapsedMinutes: Math.round(activeSession.elapsedMinutes * 10) / 10,
            messagesCount: activeSession.messagesCount,
            tokensUsed: activeSession.tokensUsed,
            remainingMinutes: Math.max(
              0,
              Math.round(
                (usage.limits.sessionMaxMinutes - activeSession.elapsedMinutes) * 10
              ) / 10
            ),
          }
        : null,
    });
  } catch (err) {
    console.error("[Support Usage API] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, action, sessionId } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    if (action === "start") {
      const check = await canStartSession(email);
      if (!check.allowed) {
        return NextResponse.json(
          {
            error: check.reason,
            canUpgrade: true,
            minutesRemaining: check.minutesRemaining,
          },
          { status: 403 }
        );
      }

      // Check for existing active session first
      const existing = await getActiveSession(email);
      if (existing) {
        return NextResponse.json({
          sessionId: existing.sessionId,
          resumed: true,
          elapsedMinutes: existing.elapsedMinutes,
          sessionMaxMinutes: check.sessionMaxMinutes,
          minutesRemaining: check.minutesRemaining,
        });
      }

      const newSessionId = await startSession(email);
      if (!newSessionId) {
        return NextResponse.json(
          { error: "Failed to start session" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        sessionId: newSessionId,
        resumed: false,
        sessionMaxMinutes: check.sessionMaxMinutes,
        minutesRemaining: check.minutesRemaining,
      });
    }

    if (action === "end" && sessionId) {
      await endSession(sessionId, email);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[Support Usage API] POST Error:", err);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
