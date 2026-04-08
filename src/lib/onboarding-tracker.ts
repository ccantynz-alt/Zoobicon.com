import { sql } from "@/lib/db";

export interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  order: number;
  ctaLabel: string;
  ctaHref: string;
  points: number;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "verify_email",
    name: "Verify your email",
    description: "Confirm your email address to secure your account.",
    order: 1,
    ctaLabel: "Verify email",
    ctaHref: "/auth/verify",
    points: 10,
  },
  {
    id: "set_business_name",
    name: "Set your business name",
    description: "Tell us what to call your workspace.",
    order: 2,
    ctaLabel: "Set name",
    ctaHref: "/onboarding/business",
    points: 10,
  },
  {
    id: "pick_template",
    name: "Pick a starter template",
    description: "Choose from 100+ premium templates to begin.",
    order: 3,
    ctaLabel: "Browse templates",
    ctaHref: "/templates",
    points: 15,
  },
  {
    id: "first_site_generated",
    name: "Generate your first site",
    description: "Use the AI builder to create your first site.",
    order: 4,
    ctaLabel: "Open builder",
    ctaHref: "/builder",
    points: 25,
  },
  {
    id: "connect_domain",
    name: "Connect a domain",
    description: "Search and register your perfect domain.",
    order: 5,
    ctaLabel: "Find domain",
    ctaHref: "/domains",
    points: 20,
  },
  {
    id: "invite_team",
    name: "Invite your team",
    description: "Bring collaborators into your workspace.",
    order: 6,
    ctaLabel: "Invite",
    ctaHref: "/team/invite",
    points: 15,
  },
  {
    id: "connect_github",
    name: "Connect GitHub",
    description: "Sync your generated projects to GitHub.",
    order: 7,
    ctaLabel: "Connect GitHub",
    ctaHref: "/integrations/github",
    points: 15,
  },
  {
    id: "enable_email",
    name: "Enable business email",
    description: "Set up hello@yourdomain with one click.",
    order: 8,
    ctaLabel: "Enable email",
    ctaHref: "/email/setup",
    points: 15,
  },
  {
    id: "first_video",
    name: "Create your first AI video",
    description: "Generate a marketing video with our AI pipeline.",
    order: 9,
    ctaLabel: "Open video creator",
    ctaHref: "/video-creator",
    points: 20,
  },
  {
    id: "first_deploy",
    name: "Deploy your site live",
    description: "Push your first site to production on zoobicon.sh.",
    order: 10,
    ctaLabel: "Deploy now",
    ctaHref: "/builder?action=deploy",
    points: 25,
  },
  {
    id: "pricing_chosen",
    name: "Choose a plan",
    description: "Pick the plan that fits your business.",
    order: 11,
    ctaLabel: "View pricing",
    ctaHref: "/pricing",
    points: 30,
  },
];

export interface OnboardingProgressRow {
  user_id: string;
  completed_steps: string[];
  current_step: string | null;
  started_at: string;
  completed_at: string | null;
  total_points: number;
}

export interface ProgressResult {
  row: OnboardingProgressRow;
  nextStep: OnboardingStep | null;
  completionPct: number;
}

export async function ensureOnboardingTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS onboarding_progress (
      user_id TEXT PRIMARY KEY,
      completed_steps TEXT[] NOT NULL DEFAULT '{}',
      current_step TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      total_points INTEGER NOT NULL DEFAULT 0
    )
  `;
}

function computeNext(completed: string[]): OnboardingStep | null {
  const ordered = [...ONBOARDING_STEPS].sort((a, b) => a.order - b.order);
  for (const step of ordered) {
    if (!completed.includes(step.id)) return step;
  }
  return null;
}

function pct(completed: string[]): number {
  return Math.round((completed.length / ONBOARDING_STEPS.length) * 100);
}

export async function getProgress(userId: string): Promise<ProgressResult> {
  await ensureOnboardingTables();
  const rows = (await sql`
    SELECT user_id, completed_steps, current_step, started_at, completed_at, total_points
    FROM onboarding_progress WHERE user_id = ${userId}
  `) as OnboardingProgressRow[];

  let row: OnboardingProgressRow;
  if (rows.length === 0) {
    const firstStep = ONBOARDING_STEPS[0];
    const inserted = (await sql`
      INSERT INTO onboarding_progress (user_id, completed_steps, current_step, total_points)
      VALUES (${userId}, '{}', ${firstStep.id}, 0)
      RETURNING user_id, completed_steps, current_step, started_at, completed_at, total_points
    `) as OnboardingProgressRow[];
    row = inserted[0];
  } else {
    row = rows[0];
  }

  const completed = row.completed_steps ?? [];
  return {
    row,
    nextStep: computeNext(completed),
    completionPct: pct(completed),
  };
}

export async function markComplete(
  userId: string,
  stepId: string
): Promise<ProgressResult> {
  const step = ONBOARDING_STEPS.find((s) => s.id === stepId);
  if (!step) {
    throw new Error(`Unknown onboarding step: ${stepId}`);
  }

  const current = await getProgress(userId);
  const completed = current.row.completed_steps ?? [];
  if (completed.includes(stepId)) {
    return current;
  }

  const newCompleted = [...completed, stepId];
  const newPoints = (current.row.total_points ?? 0) + step.points;
  const next = computeNext(newCompleted);
  const allDone = next === null;

  const updated = (await sql`
    UPDATE onboarding_progress
    SET completed_steps = ${newCompleted},
        current_step = ${next ? next.id : null},
        total_points = ${newPoints},
        completed_at = ${allDone ? new Date().toISOString() : null}
    WHERE user_id = ${userId}
    RETURNING user_id, completed_steps, current_step, started_at, completed_at, total_points
  `) as OnboardingProgressRow[];

  const row = updated[0];
  return {
    row,
    nextStep: next,
    completionPct: pct(newCompleted),
  };
}

const FALLBACK_RECOMMENDATION =
  "You're doing great. Tackle the next step in your onboarding checklist to keep momentum — every step unlocks more of the Zoobicon platform.";

export async function getRecommendation(userId: string): Promise<string> {
  const { row, nextStep, completionPct } = await getProgress(userId);
  if (!nextStep) {
    return "Onboarding complete. Explore advanced features like AI video, white-label agency, and the public API.";
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return `${nextStep.name}: ${nextStep.description} ${FALLBACK_RECOMMENDATION}`;
  }

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const completedNames = (row.completed_steps ?? [])
      .map((id) => ONBOARDING_STEPS.find((s) => s.id === id)?.name ?? id)
      .join(", ");
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are an onboarding coach for Zoobicon, an AI website builder platform. The user is ${completionPct}% through onboarding. Completed: ${completedNames || "nothing yet"}. Their next step is "${nextStep.name}" — ${nextStep.description}. Write a friendly, motivating 2-3 sentence message recommending they do this next step now. No emojis. No buzzwords.`,
        },
      ],
    });
    const block = message.content[0];
    if (block && block.type === "text") {
      return block.text.trim();
    }
    return `${nextStep.name}: ${nextStep.description} ${FALLBACK_RECOMMENDATION}`;
  } catch {
    return `${nextStep.name}: ${nextStep.description} ${FALLBACK_RECOMMENDATION}`;
  }
}

export interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  completed_count: number;
}

export async function leaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  await ensureOnboardingTables();
  const rows = (await sql`
    SELECT user_id, total_points, COALESCE(array_length(completed_steps, 1), 0) AS completed_count
    FROM onboarding_progress
    ORDER BY total_points DESC
    LIMIT ${limit}
  `) as LeaderboardEntry[];
  return rows;
}
