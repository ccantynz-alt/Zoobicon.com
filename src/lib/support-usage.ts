// ---------------------------------------------------------------------------
// Live Support Usage Tracking & Session Management
//
// Manages per-user support minutes, session time limits, token budgets,
// and plan-based access gating.
// ---------------------------------------------------------------------------

import { sql } from "@/lib/db";

// ---------------------------------------------------------------------------
// Plan limits
// ---------------------------------------------------------------------------
export interface PlanLimits {
  monthlyMinutes: number;
  sessionMaxMinutes: number;
  sessionTokenBudget: number; // max tokens per session
  messageCooldownSecs: number;
  hasLiveAgent: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    monthlyMinutes: 0,
    sessionMaxMinutes: 0,
    sessionTokenBudget: 0,
    messageCooldownSecs: 0,
    hasLiveAgent: false, // Zoe auto-reply only
  },
  starter: {
    monthlyMinutes: 0,
    sessionMaxMinutes: 0,
    sessionTokenBudget: 0,
    messageCooldownSecs: 0,
    hasLiveAgent: false,
  },
  creator: {
    monthlyMinutes: 0,
    sessionMaxMinutes: 0,
    sessionTokenBudget: 0,
    messageCooldownSecs: 0,
    hasLiveAgent: false, // Not included in Creator
  },
  pro: {
    monthlyMinutes: 30,
    sessionMaxMinutes: 10,
    sessionTokenBudget: 50_000,
    messageCooldownSecs: 30,
    hasLiveAgent: true,
  },
  agency: {
    monthlyMinutes: 0,
    sessionMaxMinutes: 0,
    sessionTokenBudget: 0,
    messageCooldownSecs: 0,
    hasLiveAgent: false, // Agencies have Priority Slack — they don't need hand-holding
  },
  enterprise: {
    monthlyMinutes: 0,
    sessionMaxMinutes: 0,
    sessionTokenBudget: 0,
    messageCooldownSecs: 0,
    hasLiveAgent: false, // Dedicated account manager instead
  },
  unlimited: {
    monthlyMinutes: 0,
    sessionMaxMinutes: 0,
    sessionTokenBudget: 0,
    messageCooldownSecs: 0,
    hasLiveAgent: false, // Admin — uses Zoe or direct access
  },
};

// Premium Support add-on: +60 min/mo, 20 min sessions
const PREMIUM_ADDON_BONUS: Partial<PlanLimits> = {
  monthlyMinutes: 60,
  sessionMaxMinutes: 20,
  hasLiveAgent: true,
};

export function getPlanLimits(plan: string, hasPremiumAddon: boolean): PlanLimits {
  const base = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  if (!hasPremiumAddon) return base;

  return {
    ...base,
    monthlyMinutes: base.monthlyMinutes + (PREMIUM_ADDON_BONUS.monthlyMinutes || 0),
    sessionMaxMinutes: Math.max(
      base.sessionMaxMinutes,
      PREMIUM_ADDON_BONUS.sessionMaxMinutes || 0
    ),
    hasLiveAgent: base.hasLiveAgent || (PREMIUM_ADDON_BONUS.hasLiveAgent || false),
  };
}

// ---------------------------------------------------------------------------
// Current month key (e.g., "2026-03")
// ---------------------------------------------------------------------------
function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

// ---------------------------------------------------------------------------
// Get or create usage record for this month
// ---------------------------------------------------------------------------
export async function getUsage(userEmail: string): Promise<{
  minutesUsed: number;
  tokensUsed: number;
  sessionsCount: number;
  minutesRemaining: number;
  plan: string;
  hasPremiumAddon: boolean;
  limits: PlanLimits;
}> {
  const month = currentMonth();

  // Get user plan
  let plan = "free";
  let hasPremiumAddon = false;
  try {
    const users = await sql`SELECT plan FROM users WHERE email = ${userEmail} LIMIT 1`;
    if (users.length > 0) plan = (users[0].plan as string) || "free";
  } catch {
    // Fallback to free
  }

  // Check for premium add-on (stored in user settings or subscription metadata)
  // For now, check a simple flag in the usage table
  try {
    const existing = await sql`
      SELECT minutes_used, tokens_used, sessions_count, addon_premium
      FROM support_usage
      WHERE user_email = ${userEmail} AND month = ${month}
    `;
    if (existing.length > 0) {
      hasPremiumAddon = existing[0].addon_premium as boolean;
      const limits = getPlanLimits(plan, hasPremiumAddon);
      const minutesUsed = existing[0].minutes_used as number;
      return {
        minutesUsed,
        tokensUsed: existing[0].tokens_used as number,
        sessionsCount: existing[0].sessions_count as number,
        minutesRemaining: Math.max(0, limits.monthlyMinutes - minutesUsed),
        plan,
        hasPremiumAddon,
        limits,
      };
    }
  } catch {
    // Table might not exist yet
  }

  const limits = getPlanLimits(plan, hasPremiumAddon);
  return {
    minutesUsed: 0,
    tokensUsed: 0,
    sessionsCount: 0,
    minutesRemaining: limits.monthlyMinutes,
    plan,
    hasPremiumAddon,
    limits,
  };
}

// ---------------------------------------------------------------------------
// Check if user can start a new session
// ---------------------------------------------------------------------------
export interface SessionCheck {
  allowed: boolean;
  reason?: string;
  minutesRemaining: number;
  sessionMaxMinutes: number;
  limits: PlanLimits;
}

export async function canStartSession(userEmail: string): Promise<SessionCheck> {
  const usage = await getUsage(userEmail);

  if (!usage.limits.hasLiveAgent) {
    return {
      allowed: false,
      reason: "Live agent support is included with Pro, or available as a Premium Support add-on ($19/mo) on any plan.",
      minutesRemaining: 0,
      sessionMaxMinutes: 0,
      limits: usage.limits,
    };
  }

  if (usage.minutesRemaining <= 0) {
    return {
      allowed: false,
      reason: "You've used all your support minutes for this month. Add Premium Support for +60 minutes, or wait until next month.",
      minutesRemaining: 0,
      sessionMaxMinutes: usage.limits.sessionMaxMinutes,
      limits: usage.limits,
    };
  }

  // Check for existing active session
  try {
    const active = await sql`
      SELECT id, started_at FROM support_sessions
      WHERE user_email = ${userEmail} AND status = 'active'
      ORDER BY started_at DESC LIMIT 1
    `;
    if (active.length > 0) {
      const started = new Date(active[0].started_at as string);
      const elapsedMin = (Date.now() - started.getTime()) / 60000;
      if (elapsedMin < usage.limits.sessionMaxMinutes) {
        // Session still valid
        return {
          allowed: true,
          minutesRemaining: usage.minutesRemaining,
          sessionMaxMinutes: usage.limits.sessionMaxMinutes,
          limits: usage.limits,
        };
      }
      // Auto-close expired session
      await endSession(active[0].id as string, userEmail);
    }
  } catch {
    // Table might not exist
  }

  return {
    allowed: true,
    minutesRemaining: usage.minutesRemaining,
    sessionMaxMinutes: usage.limits.sessionMaxMinutes,
    limits: usage.limits,
  };
}

// ---------------------------------------------------------------------------
// Start a new session
// ---------------------------------------------------------------------------
export async function startSession(userEmail: string): Promise<string | null> {
  const check = await canStartSession(userEmail);
  if (!check.allowed) return null;

  try {
    const rows = await sql`
      INSERT INTO support_sessions (user_email, status)
      VALUES (${userEmail}, 'active')
      RETURNING id
    `;

    const month = currentMonth();
    // Get current plan
    let plan = "free";
    try {
      const users = await sql`SELECT plan FROM users WHERE email = ${userEmail} LIMIT 1`;
      if (users.length > 0) plan = (users[0].plan as string) || "free";
    } catch {}

    // Upsert usage record
    await sql`
      INSERT INTO support_usage (user_email, month, sessions_count, plan_at_time)
      VALUES (${userEmail}, ${month}, 1, ${plan})
      ON CONFLICT (user_email, month)
      DO UPDATE SET sessions_count = support_usage.sessions_count + 1, updated_at = NOW()
    `;

    return rows[0].id as string;
  } catch (err) {
    console.error("[Support Usage] Start session error:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Record usage for a message (called after each AI response)
// ---------------------------------------------------------------------------
export async function recordMessageUsage(
  sessionId: string,
  userEmail: string,
  tokensUsed: number,
  durationSecs: number
): Promise<{ sessionExpired: boolean; minutesRemaining: number }> {
  const month = currentMonth();
  const minutesUsed = durationSecs / 60;

  try {
    // Update session
    await sql`
      UPDATE support_sessions
      SET messages_count = messages_count + 1,
          tokens_used = tokens_used + ${tokensUsed},
          duration_secs = duration_secs + ${durationSecs}
      WHERE id = ${sessionId}
    `;

    // Update monthly usage
    await sql`
      INSERT INTO support_usage (user_email, month, minutes_used, tokens_used)
      VALUES (${userEmail}, ${month}, ${minutesUsed}, ${tokensUsed})
      ON CONFLICT (user_email, month)
      DO UPDATE SET
        minutes_used = support_usage.minutes_used + ${minutesUsed},
        tokens_used = support_usage.tokens_used + ${tokensUsed},
        updated_at = NOW()
    `;

    // Check if session should end
    const session = await sql`
      SELECT started_at, tokens_used FROM support_sessions WHERE id = ${sessionId}
    `;
    if (session.length > 0) {
      const usage = await getUsage(userEmail);
      const started = new Date(session[0].started_at as string);
      const elapsedMin = (Date.now() - started.getTime()) / 60000;
      const sessionTokens = session[0].tokens_used as number;

      if (
        elapsedMin >= usage.limits.sessionMaxMinutes ||
        sessionTokens >= usage.limits.sessionTokenBudget ||
        usage.minutesRemaining <= 0
      ) {
        await endSession(sessionId, userEmail);
        return { sessionExpired: true, minutesRemaining: usage.minutesRemaining };
      }

      return { sessionExpired: false, minutesRemaining: usage.minutesRemaining };
    }
  } catch (err) {
    console.error("[Support Usage] Record usage error:", err);
  }

  return { sessionExpired: false, minutesRemaining: 0 };
}

// ---------------------------------------------------------------------------
// End a session
// ---------------------------------------------------------------------------
export async function endSession(sessionId: string, userEmail: string): Promise<void> {
  try {
    await sql`
      UPDATE support_sessions
      SET status = 'ended', ended_at = NOW()
      WHERE id = ${sessionId}
    `;
  } catch (err) {
    console.error("[Support Usage] End session error:", err);
  }
}

// ---------------------------------------------------------------------------
// Get active session for user (if any)
// ---------------------------------------------------------------------------
export async function getActiveSession(userEmail: string): Promise<{
  sessionId: string;
  startedAt: string;
  elapsedMinutes: number;
  messagesCount: number;
  tokensUsed: number;
} | null> {
  try {
    const rows = await sql`
      SELECT id, started_at, messages_count, tokens_used
      FROM support_sessions
      WHERE user_email = ${userEmail} AND status = 'active'
      ORDER BY started_at DESC LIMIT 1
    `;
    if (rows.length === 0) return null;

    const started = new Date(rows[0].started_at as string);
    const elapsedMinutes = (Date.now() - started.getTime()) / 60000;

    return {
      sessionId: rows[0].id as string,
      startedAt: rows[0].started_at as string,
      elapsedMinutes,
      messagesCount: rows[0].messages_count as number,
      tokensUsed: rows[0].tokens_used as number,
    };
  } catch {
    return null;
  }
}
