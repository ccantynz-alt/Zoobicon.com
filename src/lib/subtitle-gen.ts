// ---------------------------------------------------------------------------
// Subtitle / Caption Generation
//
// Generates SRT, VTT, and burned-in caption data from video scripts.
// Supports word-level timing for animated captions (TikTok/Instagram style).
// ---------------------------------------------------------------------------

export interface SubtitleEntry {
  index: number;
  startTime: number;  // seconds
  endTime: number;    // seconds
  text: string;
}

export interface SubtitleResult {
  entries: SubtitleEntry[];
  srt: string;
  vtt: string;
  totalDuration: number;
}

export interface CaptionStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  position: "bottom" | "center" | "top";
  animation: "none" | "word-by-word" | "fade" | "typewriter" | "bounce" | "karaoke";
}

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  fontSize: 32,
  fontFamily: "Inter",
  color: "#ffffff",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  position: "bottom",
  animation: "word-by-word",
};

// Caption style presets
export const CAPTION_PRESETS: Record<string, CaptionStyle> = {
  "tiktok-bold": {
    fontSize: 42,
    fontFamily: "Inter",
    color: "#ffffff",
    backgroundColor: "transparent",
    position: "center",
    animation: "word-by-word",
  },
  "instagram-clean": {
    fontSize: 28,
    fontFamily: "Inter",
    color: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    position: "bottom",
    animation: "fade",
  },
  "youtube-standard": {
    fontSize: 24,
    fontFamily: "Arial",
    color: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    position: "bottom",
    animation: "none",
  },
  "cinematic": {
    fontSize: 20,
    fontFamily: "Playfair Display",
    color: "#f5f5dc",
    backgroundColor: "transparent",
    position: "bottom",
    animation: "typewriter",
  },
  "energetic": {
    fontSize: 48,
    fontFamily: "Montserrat",
    color: "#ffff00",
    backgroundColor: "transparent",
    position: "center",
    animation: "bounce",
  },
  "karaoke": {
    fontSize: 36,
    fontFamily: "Inter",
    color: "#ffffff",
    backgroundColor: "transparent",
    position: "center",
    animation: "karaoke",
  },
};

/**
 * Generate subtitles from a script with timing based on word count and duration.
 */
export function generateSubtitles(
  script: string,
  totalDuration: number,
  options: {
    maxCharsPerLine?: number;
    maxLinesPerEntry?: number;
    wordsPerMinute?: number;
  } = {}
): SubtitleResult {
  const {
    maxCharsPerLine = 42,
    maxLinesPerEntry = 2,
    wordsPerMinute = 150,
  } = options;

  // Guard: empty script → return empty subtitles
  if (!script?.trim()) {
    return { entries: [], srt: "", vtt: "WEBVTT\n\n", totalDuration: totalDuration || 0 };
  }

  // Clean script of stage directions
  const cleanScript = script
    .replace(/\(VISUAL CUE:.*?\)/gi, "")
    .replace(/\(SFX:.*?\)/gi, "")
    .replace(/\[SCENE \d+\]/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Split into sentences
  const sentences = cleanScript
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  // Break sentences into subtitle-sized chunks
  const chunks: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    let currentChunk = "";

    for (const word of words) {
      const testChunk = currentChunk ? `${currentChunk} ${word}` : word;
      // Check if adding this word exceeds line limit
      if (testChunk.length > maxCharsPerLine * maxLinesPerEntry) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        currentChunk = testChunk;
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());
  }

  // Calculate timing — guard against divide-by-zero
  const totalWords = cleanScript.split(/\s+/).filter(Boolean).length;
  if (totalWords === 0 || chunks.length === 0) {
    return { entries: [], srt: "", vtt: "WEBVTT\n\n", totalDuration: totalDuration || 0 };
  }
  const actualDuration = totalDuration > 0 ? totalDuration : (totalWords / wordsPerMinute) * 60;
  const wordsPerSecond = totalWords / (actualDuration || 1); // Prevent NaN

  let currentTime = 0;
  const entries: SubtitleEntry[] = chunks.map((text, index) => {
    const wordCount = text.split(/\s+/).length;
    const duration = wordCount / wordsPerSecond;
    // Handle [PAUSE] markers
    const pauseCount = (text.match(/\.\.\./g) || []).length;
    const adjustedDuration = duration + pauseCount * 0.4;

    const entry: SubtitleEntry = {
      index: index + 1,
      startTime: currentTime,
      endTime: currentTime + adjustedDuration,
      text: text.replace(/\.\.\./g, "").trim(),
    };

    currentTime += adjustedDuration + 0.1; // 100ms gap between entries
    return entry;
  });

  // Generate SRT and VTT
  const srt = entries
    .map((e) => `${e.index}\n${formatTimeSRT(e.startTime)} --> ${formatTimeSRT(e.endTime)}\n${e.text}`)
    .join("\n\n");

  const vtt = `WEBVTT\n\n` + entries
    .map((e) => `${formatTimeVTT(e.startTime)} --> ${formatTimeVTT(e.endTime)}\n${e.text}`)
    .join("\n\n");

  return {
    entries,
    srt,
    vtt,
    totalDuration: currentTime,
  };
}

/**
 * Generate per-scene subtitles (timed to individual scenes).
 */
export function generateSceneSubtitles(
  scenes: { sceneNumber: number; duration: string; narration: string }[]
): SubtitleResult {
  let globalTime = 0;
  const allEntries: SubtitleEntry[] = [];
  let entryIndex = 1;

  for (const scene of scenes) {
    const sceneDuration = parseDurationSeconds(scene.duration);
    if (!scene.narration.trim()) {
      globalTime += sceneDuration;
      continue;
    }

    const sceneResult = generateSubtitles(scene.narration, sceneDuration);
    for (const entry of sceneResult.entries) {
      allEntries.push({
        index: entryIndex++,
        startTime: globalTime + entry.startTime,
        endTime: globalTime + entry.endTime,
        text: entry.text,
      });
    }
    globalTime += sceneDuration;
  }

  const srt = allEntries
    .map((e) => `${e.index}\n${formatTimeSRT(e.startTime)} --> ${formatTimeSRT(e.endTime)}\n${e.text}`)
    .join("\n\n");

  const vtt = `WEBVTT\n\n` + allEntries
    .map((e) => `${formatTimeVTT(e.startTime)} --> ${formatTimeVTT(e.endTime)}\n${e.text}`)
    .join("\n\n");

  return {
    entries: allEntries,
    srt,
    vtt,
    totalDuration: globalTime,
  };
}

/**
 * Generate word-level timing data for animated captions (TikTok style).
 */
export function generateWordTimings(
  text: string,
  startTime: number,
  endTime: number
): { word: string; start: number; end: number }[] {
  const words = text.split(/\s+/).filter(Boolean);
  const totalDuration = endTime - startTime;
  const wordDuration = totalDuration / words.length;

  return words.map((word, i) => ({
    word,
    start: startTime + i * wordDuration,
    end: startTime + (i + 1) * wordDuration,
  }));
}

// --- Formatters ---

function formatTimeSRT(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function formatTimeVTT(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
}

function pad(n: number, width: number = 2): string {
  return String(n).padStart(width, "0");
}

function parseDurationSeconds(duration: string): number {
  const match = duration.match(/(\d+\.?\d*)/);
  const seconds = match ? parseFloat(match[1]) : 5;
  // Clamp to reasonable range: 1s min, 600s (10 min) max
  return Math.min(600, Math.max(1, seconds));
}
