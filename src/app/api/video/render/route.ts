import { NextResponse } from "next/server";

/**
 * Video render endpoint — assembles shots into a video project.
 *
 * Phase 1 (current): Exports an EDL/timeline JSON that can be imported
 * into CapCut, Premiere, or DaVinci Resolve.
 *
 * Phase 2 (future): Use Remotion or FFmpeg to render server-side.
 *
 * Phase 3 (future): Use Runway/Kling/Minimax APIs to generate actual
 * video clips from shot descriptions, then stitch together.
 */

interface RenderShot {
  shotNumber: number;
  duration: number;
  visual: string;
  textOverlay: string;
  voiceover: string;
  transition: string;
  startTime: number;
  endTime: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { script, format = "json" } = body;

    if (!script?.shots?.length) {
      return NextResponse.json({ error: "Script with shots is required" }, { status: 400 });
    }

    // Calculate start/end times for each shot
    let currentTime = 0;
    const timeline: RenderShot[] = script.shots.map((shot: { shotNumber: number; duration: number; visual: string; textOverlay: string; voiceover: string; transition: string }) => {
      const renderShot: RenderShot = {
        ...shot,
        startTime: currentTime,
        endTime: currentTime + shot.duration,
      };
      currentTime += shot.duration;
      return renderShot;
    });

    if (format === "srt") {
      // Generate SRT subtitle file from voiceover
      const srt = timeline.map((shot, i) => {
        const startH = Math.floor(shot.startTime / 3600);
        const startM = Math.floor((shot.startTime % 3600) / 60);
        const startS = shot.startTime % 60;
        const endH = Math.floor(shot.endTime / 3600);
        const endM = Math.floor((shot.endTime % 3600) / 60);
        const endS = shot.endTime % 60;

        return `${i + 1}
${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:${String(startS).padStart(2, "0")},000 --> ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:${String(endS).padStart(2, "0")},000
${shot.textOverlay}
`;
      }).join("\n");

      return new Response(srt, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="${script.title || "video"}.srt"`,
        },
      });
    }

    if (format === "edl") {
      // Generate a simplified EDL (Edit Decision List)
      const edl = [
        `TITLE: ${script.title || "Untitled"}`,
        `FCM: NON-DROP FRAME`,
        "",
        ...timeline.map((shot, i) => {
          const srcIn = formatTC(0);
          const srcOut = formatTC(shot.duration);
          const recIn = formatTC(shot.startTime);
          const recOut = formatTC(shot.endTime);
          return `${String(i + 1).padStart(3, "0")}  AX       V     C        ${srcIn} ${srcOut} ${recIn} ${recOut}
* FROM CLIP NAME: Shot ${shot.shotNumber} - ${shot.visual.slice(0, 50)}
* TEXT OVERLAY: ${shot.textOverlay}
`;
        }),
      ].join("\n");

      return new Response(edl, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="${script.title || "video"}.edl"`,
        },
      });
    }

    // Default: return enriched timeline JSON
    return NextResponse.json({
      title: script.title,
      totalDuration: currentTime,
      aspectRatio: script.aspectRatio || "9:16",
      timeline,
      voiceoverFull: script.voiceoverFull,
      musicStyle: script.musicStyle,
      ctaText: script.ctaText,
      exportFormats: ["json", "srt", "edl"],
      instructions: {
        capcut: "Import your screen recordings, drag to timeline matching shot timings, add text overlays from the script, import the .srt for captions.",
        premiere: "Import .edl for timeline structure, replace placeholder clips with your footage, use Essential Graphics for text overlays.",
        davinci: "Import .edl, match shots to clips on the media pool, use Fusion for text overlays and transitions.",
      },
    });
  } catch (err) {
    console.error("Video render error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Render failed" },
      { status: 500 }
    );
  }
}

function formatTC(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
}
