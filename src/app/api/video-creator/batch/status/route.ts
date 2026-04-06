import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getVideoStatus, isHeyGenConfigured } from "@/lib/heygen";

export const maxDuration = 30;

/* ------------------------------------------------------------------ */
/*  GET /api/video-creator/batch/status?batchId=xxx                   */
/*  Poll the status of a batch personalized video job                 */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const batchId = req.nextUrl.searchParams.get("batchId");
    if (!batchId) {
      return Response.json({ error: "batchId query parameter is required." }, { status: 400 });
    }

    const rows = await sql`
      SELECT * FROM video_batches WHERE id = ${batchId} LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return Response.json({ error: "Batch not found." }, { status: 404 });
    }

    const batch = rows[0];
    let videos: Array<{
      index: number;
      recipientName: string;
      recipientCompany: string;
      recipientRole: string;
      personalizedScript: string;
      status: string;
      videoId: string | null;
      videoUrl: string | null;
      error: string | null;
    }> = typeof batch.videos === "string" ? JSON.parse(batch.videos) : batch.videos;

    // For videos that are "processing" with a videoId, poll HeyGen for their status
    let updated = false;
    if (isHeyGenConfigured()) {
      for (const video of videos) {
        if (video.status === "processing" && video.videoId) {
          try {
            const heygenStatus = await getVideoStatus(video.videoId);
            if (heygenStatus.status === "completed" && heygenStatus.videoUrl) {
              video.status = "completed";
              video.videoUrl = heygenStatus.videoUrl;
              updated = true;
            } else if (heygenStatus.status === "failed") {
              video.status = "failed";
              video.error = heygenStatus.error || "Video generation failed on HeyGen.";
              updated = true;
            }
            // "pending" and "processing" stay as-is
          } catch {
            // Status check failed, leave as processing
          }
        }
      }
    }

    const completedCount = videos.filter((v) => v.status === "completed").length;
    const failedCount = videos.filter((v) => v.status === "failed").length;
    const totalCount = videos.length;
    const allDone = completedCount + failedCount === totalCount;

    // Update DB if any status changed
    if (updated || (allDone && batch.status !== "completed" && batch.status !== "failed")) {
      const batchStatus = allDone
        ? failedCount === totalCount
          ? "failed"
          : "completed"
        : batch.status;

      await sql`
        UPDATE video_batches
        SET videos = ${JSON.stringify(videos)}::jsonb,
            completed = ${completedCount},
            failed = ${failedCount},
            status = ${batchStatus},
            updated_at = NOW()
        WHERE id = ${batchId}
      `.catch(() => {});
    }

    return Response.json({
      batchId,
      total: totalCount,
      completed: completedCount,
      failed: failedCount,
      status: allDone
        ? failedCount === totalCount
          ? "failed"
          : "completed"
        : "processing",
      videos: videos.map((v) => ({
        recipientName: v.recipientName,
        recipientCompany: v.recipientCompany || "",
        status: v.status,
        videoUrl: v.videoUrl,
        error: v.error,
      })),
    });
  } catch (err) {
    console.error("[video-creator/batch/status] Error:", err);
    return Response.json(
      { error: "Failed to check batch status. Please try again." },
      { status: 500 }
    );
  }
}
