import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import {
  generateVideo,
  isHeyGenConfigured,
  type HeyGenVideoRequest,
} from "@/lib/heygen";

export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/*  Variable replacement helpers                                      */
/* ------------------------------------------------------------------ */

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

function extractVariables(template: string): string[] {
  const vars: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = VARIABLE_PATTERN.exec(template)) !== null) {
    if (!vars.includes(match[1])) vars.push(match[1]);
  }
  return vars;
}

interface Recipient {
  name: string;
  company?: string;
  role?: string;
  customFields?: Record<string, string>;
}

function personalizeScript(template: string, recipient: Recipient): string {
  return template.replace(VARIABLE_PATTERN, (_match, varName: string) => {
    const lower = varName.toLowerCase();
    if (lower === "name") return recipient.name || "";
    if (lower === "company") return recipient.company || "";
    if (lower === "role") return recipient.role || "";
    // custom1 through custom5 — check customFields
    if (lower.startsWith("custom") && recipient.customFields) {
      return recipient.customFields[varName] || recipient.customFields[lower] || "";
    }
    return "";
  });
}

/* ------------------------------------------------------------------ */
/*  POST /api/video-creator/batch — Start a batch personalized job    */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    if (!isHeyGenConfigured()) {
      return Response.json(
        { error: "AI spokesperson videos are coming soon. Stay tuned!", comingSoon: true },
        { status: 503 }
      );
    }

    const body = await req.json();
    const {
      script,
      avatarId,
      voiceId,
      format,
      recipients,
      email,
      plan,
    } = body as {
      script: string;
      avatarId: string;
      voiceId?: string;
      format?: "9:16" | "16:9" | "1:1";
      recipients: Recipient[];
      email?: string;
      plan?: string;
    };

    // --- Validation ---
    if (!script?.trim()) {
      return Response.json({ error: "Script template is required." }, { status: 400 });
    }
    if (!avatarId) {
      return Response.json({ error: "Please select a presenter (avatar)." }, { status: 400 });
    }

    const variables = extractVariables(script);
    if (variables.length === 0) {
      return Response.json(
        { error: "Script must contain at least one {{variable}} like {{name}} or {{company}}." },
        { status: 400 }
      );
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return Response.json({ error: "At least one recipient is required." }, { status: 400 });
    }
    if (recipients.length > 500) {
      return Response.json({ error: "Maximum 500 recipients per batch." }, { status: 400 });
    }

    // Validate every recipient has a name
    for (let i = 0; i < recipients.length; i++) {
      if (!recipients[i]?.name?.trim()) {
        return Response.json(
          { error: `Recipient #${i + 1} is missing a name.` },
          { status: 400 }
        );
      }
    }

    // Map format to HeyGen dimensions
    let dimension = { width: 1920, height: 1080 }; // 16:9 default
    if (format === "9:16") dimension = { width: 1080, height: 1920 };
    else if (format === "1:1") dimension = { width: 1080, height: 1080 };

    // --- Create batch record ---
    const batchId = crypto.randomUUID();
    const videoItems = recipients.map((r, idx) => ({
      index: idx,
      recipientName: r.name,
      recipientCompany: r.company || "",
      recipientRole: r.role || "",
      personalizedScript: personalizeScript(script, r),
      status: "pending" as const,
      videoId: null as string | null,
      videoUrl: null as string | null,
      error: null as string | null,
    }));

    await sql`
      CREATE TABLE IF NOT EXISTS video_batches (
        id              TEXT PRIMARY KEY,
        email           TEXT,
        plan            TEXT,
        script_template TEXT NOT NULL,
        avatar_id       TEXT NOT NULL,
        voice_id        TEXT,
        format          TEXT NOT NULL DEFAULT '16:9',
        variables       JSONB NOT NULL DEFAULT '[]',
        total           INTEGER NOT NULL DEFAULT 0,
        completed       INTEGER NOT NULL DEFAULT 0,
        failed          INTEGER NOT NULL DEFAULT 0,
        status          TEXT NOT NULL DEFAULT 'processing',
        videos          JSONB NOT NULL DEFAULT '[]',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      INSERT INTO video_batches (id, email, plan, script_template, avatar_id, voice_id, format, variables, total, status, videos)
      VALUES (${batchId}, ${email || null}, ${plan || null}, ${script}, ${avatarId}, ${voiceId || null}, ${format || "16:9"}, ${JSON.stringify(variables)}, ${recipients.length}, 'processing', ${JSON.stringify(videoItems)})
    `;

    // --- Fire off HeyGen generation for each recipient (async, don't await all) ---
    // We process them sequentially in a background-style loop to avoid slamming the API.
    // The status endpoint lets the client poll for progress.
    processVideosInBackground(batchId, videoItems, avatarId, voiceId || "", dimension);

    const estimatedMinutes = Math.ceil(recipients.length * 2.5); // ~2-3 min per video

    return Response.json({
      batchId,
      totalVideos: recipients.length,
      status: "processing",
      variables,
      estimatedTime: estimatedMinutes <= 5
        ? `${estimatedMinutes} minutes`
        : `${estimatedMinutes} minutes (~${Math.round(estimatedMinutes / 60 * 10) / 10} hours)`,
    });
  } catch (err) {
    console.error("[video-creator/batch] Error:", err);
    return Response.json(
      { error: "Failed to start batch video generation. Please try again." },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Background processing — generate videos one at a time             */
/* ------------------------------------------------------------------ */

async function processVideosInBackground(
  batchId: string,
  videoItems: Array<{
    index: number;
    recipientName: string;
    personalizedScript: string;
    status: string;
    videoId: string | null;
    videoUrl: string | null;
    error: string | null;
  }>,
  avatarId: string,
  voiceId: string,
  dimension: { width: number; height: number }
) {
  let completed = 0;
  let failed = 0;

  for (const item of videoItems) {
    try {
      const request: HeyGenVideoRequest = {
        script: item.personalizedScript,
        avatarId,
        voiceId: voiceId || "en-US-AriaNeural",
        background: { type: "color", value: "#1a1a2e" },
        dimension,
        speed: 1.0,
        caption: true,
        test: false,
      };

      const heygenVideoId = await generateVideo(request);
      item.videoId = heygenVideoId;
      item.status = "processing";
    } catch (err) {
      item.status = "failed";
      item.error = err instanceof Error ? err.message : "Generation failed";
      failed++;
    }

    // Update DB after each video submission
    try {
      await sql`
        UPDATE video_batches
        SET videos = ${JSON.stringify(videoItems)}::jsonb,
            completed = ${completed},
            failed = ${failed},
            updated_at = NOW()
        WHERE id = ${batchId}
      `;
    } catch {
      // DB update failed, continue processing
    }
  }

  // Mark batch as complete (all submitted) — individual videos still processing on HeyGen side
  const allFailed = failed === videoItems.length;
  await sql`
    UPDATE video_batches
    SET status = ${allFailed ? "failed" : "submitted"},
        completed = ${completed},
        failed = ${failed},
        videos = ${JSON.stringify(videoItems)}::jsonb,
        updated_at = NOW()
    WHERE id = ${batchId}
  `.catch(() => {});
}
