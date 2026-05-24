"use client";

/**
 * /products/ai-twins — AI Twins viral product page.
 *
 * Single-screen conversion UI:
 *   1. Hero (display-italic headline, two CTAs)
 *   2. Demo widget (photo upload + script + voice + Generate → inline result)
 *   3. Trust strip (latency / price / length)
 *   4. Example outputs grid
 *   5. Pricing strip
 *   6. Footer-adjacent CTA
 *
 * Editorial-light palette only. Per Bible Law 8 every error path surfaces a
 * clear message + recovery action. SiteNavigation + SiteFooter come from the
 * root layout, so this page only renders content.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Camera,
  Sparkles,
  Wand2,
  Download,
  Share2,
  RotateCcw,
  Zap,
  DollarSign,
  Clock,
  Check,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  Mic,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCRIPT_PLACEHOLDERS = [
  "Hi, I'm Sarah from Zoobicon. Today I want to show you how to launch a complete website in under five minutes...",
  "Welcome to my brand. Let me tell you why we exist and what we're building for you...",
  "Three things changed everything for our team this year. Here's the first one...",
  "If you're a founder watching this — stop what you're doing. I want to share what just worked for us...",
  "Quick demo: this is the new feature we shipped last week. It takes one photo and a script...",
];

const VOICE_PRESETS: { id: string; label: string; tone: string }[] = [
  { id: "warm", label: "Warm — friendly, approachable", tone: "Best for founder intros, brand stories" },
  { id: "professional", label: "Professional — clear, confident", tone: "Best for product demos, pitches" },
  { id: "energetic", label: "Energetic — upbeat, punchy", tone: "Best for ads, social hooks" },
  { id: "calm", label: "Calm — measured, authoritative", tone: "Best for explainers, education" },
];

const TRUST_CARDS = [
  {
    icon: Zap,
    title: "Sub-100ms latency",
    stat: "Hedra Character-3",
    desc: "Real-time avatar generation. No more 60-second waits — you watch your face come alive as it renders.",
  },
  {
    icon: DollarSign,
    title: "$0.05 per minute",
    stat: "15× cheaper",
    desc: "HeyGen charges $0.50+ per minute. We charge $0.05. Same talking-head quality, fifteen times less cost.",
  },
  {
    icon: Clock,
    title: "Up to 10-minute videos",
    stat: "Long-form ready",
    desc: "Make a 30-second TikTok or a 10-minute course module. Same pipeline, no length penalty, no quality drop.",
  },
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "/forever",
    quota: "1 video / month",
    features: [
      "Up to 60 seconds per video",
      "All preset voices",
      "Watermark on output",
      "Powered by Hedra Character-3 + Fish Audio S1",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Creator",
    price: "$19",
    cadence: "/month",
    quota: "50 videos / month",
    features: [
      "Up to 5 minutes per video",
      "All preset voices",
      "No watermark",
      "Priority queue",
      "Powered by Hedra Character-3 + Fish Audio S1",
    ],
    cta: "Go Creator",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$49",
    cadence: "/month",
    quota: "500 videos / month",
    features: [
      "Up to 10 minutes per video",
      "Voice cloning (your own voice)",
      "No watermark",
      "Priority + dedicated capacity",
      "Powered by Hedra Character-3 + Fish Audio S1",
    ],
    cta: "Go Pro",
    highlighted: false,
  },
];

// 6 example output placeholders. We don't have real example videos yet, so we
// label them clearly as "Example output" and use thumbnail-only static cards
// that match the styling of the live result panel — feels consistent.
const EXAMPLES = [
  { label: "Founder intro", duration: "0:18", tone: "Warm" },
  { label: "Product demo", duration: "0:42", tone: "Professional" },
  { label: "Ad hook", duration: "0:09", tone: "Energetic" },
  { label: "Course module", duration: "2:15", tone: "Calm" },
  { label: "Brand story", duration: "1:04", tone: "Warm" },
  { label: "Launch teaser", duration: "0:22", tone: "Energetic" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compress an image File (<2MB output) by drawing it onto a canvas at max
 * 1024×1024, JPEG quality 0.85. Returns a `data:image/jpeg;base64,...` URL
 * suitable for posting straight to /api/video-creator/twin (which accepts
 * data: URLs per the route's validate() function).
 */
function compressImageToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the photo. Try a different file."));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () =>
        reject(new Error("That file isn't a valid image. JPG or PNG works best."));
      img.onload = () => {
        const MAX = 1024;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Your browser blocked the canvas. Try a different browser."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        // Sanity-check size — base64 inflates ~33%, so 2MB output ≈ 2.7MB data URL.
        if (dataUrl.length > 2_700_000) {
          // Re-encode at a lower quality
          const lower = canvas.toDataURL("image/jpeg", 0.7);
          resolve(lower);
        } else {
          resolve(dataUrl);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type GenStatus =
  | { state: "idle" }
  | { state: "generating"; step: string; progress: number; message: string }
  | { state: "done"; videoUrl: string; duration: number }
  | { state: "error"; message: string };

export default function AITwinsPage() {
  // ───────── Demo state ─────────
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [script, setScript] = useState("");
  const [voiceStyle, setVoiceStyle] = useState<string>("warm");
  const [status, setStatus] = useState<GenStatus>({ state: "idle" });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const demoSectionRef = useRef<HTMLDivElement | null>(null);

  // Rotating placeholder for the script textarea — every 4s pick a new one.
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % SCRIPT_PLACEHOLDERS.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  // ───────── Photo handling ─────────
  const handleFile = async (file: File) => {
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("That file isn't an image. Upload a JPG or PNG of your face.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setPhotoError("Photo is over 25MB. Try a smaller file or a JPG.");
      return;
    }
    setIsCompressing(true);
    try {
      const dataUrl = await compressImageToDataURL(file);
      setPhotoDataUrl(dataUrl);
      setPhotoFileName(file.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not process that photo.";
      setPhotoError(msg);
    } finally {
      setIsCompressing(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
    // Reset so selecting the same file again still fires onChange.
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const clearPhoto = () => {
    setPhotoDataUrl(null);
    setPhotoFileName(null);
    setPhotoError(null);
  };

  // ───────── Generate ─────────
  const canGenerate =
    !!photoDataUrl &&
    script.trim().length >= 1 &&
    script.trim().length <= 2000 &&
    status.state !== "generating";

  const handleGenerate = async () => {
    if (!photoDataUrl) {
      setStatus({ state: "error", message: "Upload a photo of your face first." });
      return;
    }
    if (!script.trim()) {
      setStatus({
        state: "error",
        message: "Type a script — even one sentence is enough to start.",
      });
      return;
    }

    setStatus({
      state: "generating",
      step: "starting",
      progress: 2,
      message: "Sending to the pipeline…",
    });

    try {
      const res = await fetch("/api/video-creator/twin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          faceImageUrl: photoDataUrl,
          script: script.trim(),
          voiceStyle,
          format: "portrait",
        }),
      });

      if (!res.ok || !res.body) {
        // Try to parse a JSON error body before falling back.
        let msg = `Server returned ${res.status}. Try again in a moment.`;
        try {
          const j = await res.json();
          if (j && typeof j.error === "string") msg = j.error;
        } catch {
          /* not JSON — keep generic msg */
        }
        setStatus({ state: "error", message: msg });
        return;
      }

      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        // Server didn't honour SSE — handle the plain JSON path.
        const j = (await res.json()) as { ok?: boolean; videoUrl?: string; duration?: number; error?: string };
        if (j.ok && j.videoUrl) {
          setStatus({ state: "done", videoUrl: j.videoUrl, duration: j.duration ?? 0 });
        } else {
          setStatus({
            state: "error",
            message: j.error || "Generation failed. Try again, or use a clearer photo.",
          });
        }
        return;
      }

      // SSE stream — parse line by line.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Split SSE events on blank-line boundary.
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const evt of events) {
          const dataLines = evt
            .split("\n")
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.slice(5).trim());
          if (dataLines.length === 0) continue;
          const dataStr = dataLines.join("\n");
          try {
            const obj = JSON.parse(dataStr) as {
              type?: string;
              step?: string;
              progress?: number;
              message?: string;
              videoUrl?: string;
              duration?: number;
              error?: string;
              ok?: boolean;
            };
            if (obj.type === "progress") {
              setStatus({
                state: "generating",
                step: obj.step || "working",
                progress: typeof obj.progress === "number" ? obj.progress : 50,
                message: obj.message || "Working…",
              });
            } else if (obj.type === "done" && obj.videoUrl) {
              setStatus({
                state: "done",
                videoUrl: obj.videoUrl,
                duration: obj.duration ?? 0,
              });
            } else if (obj.type === "error") {
              setStatus({
                state: "error",
                message:
                  obj.error || "Generation failed. Try a clearer photo or shorter script.",
              });
            }
          } catch {
            // Ignore unparseable chunks — they're usually keep-alives.
          }
        }
      }

      // If the stream ended without a "done" event, surface that explicitly.
      setStatus((s) =>
        s.state === "generating"
          ? {
              state: "error",
              message: "The connection closed before the video finished. Try again.",
            }
          : s
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Network error. Check your connection and retry.";
      setStatus({ state: "error", message: msg });
    }
  };

  const handleShare = async () => {
    if (status.state !== "done") return;
    const shareData = {
      title: "My AI Twin video — built with Zoobicon",
      text: "I made this talking-head video from one selfie + a script.",
      url: status.videoUrl,
    };
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share(shareData);
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(status.videoUrl);
      }
    } catch {
      /* user cancelled — ignore */
    }
  };

  const handleMakeAnother = () => {
    setStatus({ state: "idle" });
    setScript("");
    // Keep the photo — most users want to make a series with the same face.
    demoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToDemo = () => {
    demoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ───────── Render ─────────
  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      {/* ───────── HERO ───────── */}
      <section className="px-6 pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-6xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs uppercase tracking-[0.18em]"
            style={{
              background: "var(--gold-soft)",
              border: "1px solid var(--rule)",
              color: "var(--gold-deep)",
              borderRadius: 999,
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            New — AI Twins
          </div>

          <h1
            className="display-italic text-[3rem] sm:text-[4.5rem] lg:text-[6.5rem] leading-[0.95] tracking-tight"
            style={{ color: "var(--ink)" }}
          >
            Become your own
            <br />
            <span style={{ color: "var(--gold-deep)" }}>spokesperson.</span>
          </h1>

          <p
            className="mt-8 max-w-2xl text-lg sm:text-xl leading-relaxed"
            style={{ color: "var(--ink-secondary)" }}
          >
            Upload one photo. Type a script. Get a video of you reading it.
            <br className="hidden sm:block" />
            Sub-100ms latency, $0.05/minute, no studio.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={scrollToDemo}
              className="group inline-flex items-center gap-2 px-7 py-4 text-sm uppercase tracking-[0.18em] font-medium transition-all"
              style={{
                background: "var(--ink)",
                color: "var(--paper)",
                border: "1px solid var(--ink)",
                borderRadius: 4,
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--gold-deep)";
                e.currentTarget.style.borderColor = "var(--gold-deep)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--ink)";
                e.currentTarget.style.borderColor = "var(--ink)";
              }}
            >
              <Wand2 className="w-4 h-4" />
              Try free (1 video)
            </button>

            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 px-7 py-4 text-sm uppercase tracking-[0.18em] font-medium transition-all"
              style={{
                background: "transparent",
                color: "var(--ink)",
                border: "1px solid var(--rule-strong)",
                borderRadius: 4,
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--ink)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--rule-strong)";
              }}
            >
              Pricing
            </Link>
          </div>

          {/* hairline rule beneath hero */}
          <div className="mt-20 h-px w-full" style={{ background: "var(--rule)" }} />
        </div>
      </section>

      {/* ───────── DEMO WIDGET ───────── */}
      <section
        ref={demoSectionRef}
        id="demo"
        className="px-6 py-20 lg:py-28"
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p
              className="text-xs uppercase tracking-[0.2em] mb-3"
              style={{
                color: "var(--gold-deep)",
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
              }}
            >
              Live demo · 60 seconds
            </p>
            <h2
              className="display text-4xl sm:text-5xl lg:text-6xl"
              style={{ color: "var(--ink)" }}
            >
              Build your first twin.
            </h2>
            <p
              className="mt-4 max-w-2xl text-base sm:text-lg"
              style={{ color: "var(--ink-secondary)" }}
            >
              Photo → script → video. Most twins finish in under a minute. The first one is on us.
            </p>
          </div>

          <div
            className="grid lg:grid-cols-2 gap-6"
            style={{ minHeight: 480 }}
          >
            {/* ── PHOTO UPLOAD ── */}
            <div
              className="p-7 flex flex-col"
              style={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--rule)",
                borderRadius: 6,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-xs uppercase tracking-[0.2em]"
                  style={{
                    color: "var(--ink-muted)",
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                  }}
                >
                  01 · Your face
                </span>
                {photoDataUrl && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="inline-flex items-center gap-1 text-xs hover:underline"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>

              {!photoDataUrl ? (
                <div
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 cursor-pointer transition-all"
                  style={{
                    background: "var(--paper-input)",
                    border: `1px dashed ${isDragging ? "var(--gold-deep)" : "var(--rule-strong)"}`,
                    borderRadius: 4,
                    minHeight: 280,
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileInputChange}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={onFileInputChange}
                    className="hidden"
                  />
                  {isCompressing ? (
                    <>
                      <Loader2
                        className="w-10 h-10 mb-4 animate-spin"
                        style={{ color: "var(--gold-deep)" }}
                      />
                      <p style={{ color: "var(--ink-secondary)" }}>Preparing your photo…</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon
                        className="w-10 h-10 mb-4"
                        style={{ color: "var(--ink-muted)" }}
                      />
                      <p
                        className="text-base mb-1"
                        style={{ color: "var(--ink)" }}
                      >
                        Drop a selfie here, or click to browse.
                      </p>
                      <p
                        className="text-sm mb-6"
                        style={{ color: "var(--ink-muted)" }}
                      >
                        JPG or PNG. We compress to under 2MB on your device — nothing leaves your browser until you hit Generate.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.16em]"
                          style={{
                            background: "var(--ink)",
                            color: "var(--paper)",
                            border: "1px solid var(--ink)",
                            borderRadius: 4,
                            fontFamily: "JetBrains Mono, ui-monospace, monospace",
                          }}
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload photo
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cameraInputRef.current?.click();
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.16em]"
                          style={{
                            background: "transparent",
                            color: "var(--ink)",
                            border: "1px solid var(--rule-strong)",
                            borderRadius: 4,
                            fontFamily: "JetBrains Mono, ui-monospace, monospace",
                          }}
                        >
                          <Camera className="w-3.5 h-3.5" /> Use camera
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div
                    className="relative overflow-hidden"
                    style={{
                      borderRadius: 4,
                      border: "1px solid var(--rule)",
                      aspectRatio: "1",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoDataUrl}
                      alt={photoFileName || "Your selfie"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p
                    className="mt-3 text-xs"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {photoFileName || "Selfie ready"} · stays in your browser until you hit Generate.
                  </p>
                </div>
              )}

              {photoError && (
                <div
                  role="alert"
                  className="mt-4 px-4 py-3 text-sm flex items-start gap-2"
                  style={{
                    background: "var(--paper-input)",
                    border: "1px solid var(--rule-strong)",
                    borderRadius: 4,
                    color: "var(--ink)",
                  }}
                >
                  <AlertTriangle
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: "var(--gold-deep)" }}
                  />
                  <div>
                    <p className="font-medium">{photoError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoError(null);
                        fileInputRef.current?.click();
                      }}
                      className="text-xs underline mt-1"
                      style={{ color: "var(--gold-deep)" }}
                    >
                      Try a different photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── SCRIPT + VOICE + GENERATE ── */}
            <div
              className="p-7 flex flex-col"
              style={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--rule)",
                borderRadius: 6,
              }}
            >
              <div className="mb-4">
                <span
                  className="text-xs uppercase tracking-[0.2em]"
                  style={{
                    color: "var(--ink-muted)",
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                  }}
                >
                  02 · Your script
                </span>
              </div>

              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder={SCRIPT_PLACEHOLDERS[placeholderIndex]}
                rows={6}
                maxLength={2000}
                className="w-full px-4 py-3 text-base resize-y outline-none transition-colors"
                style={{
                  background: "var(--paper-input)",
                  border: "1px solid var(--rule)",
                  borderRadius: 4,
                  color: "var(--ink)",
                  fontFamily: "Inter, system-ui, sans-serif",
                  minHeight: 140,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--ink)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--rule)";
                }}
              />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span style={{ color: "var(--ink-muted)" }}>
                  {script.length} / 2000 characters · ~{Math.max(1, Math.round(script.trim().split(/\s+/).filter(Boolean).length / 2.5))}s of speech
                </span>
              </div>

              {/* Voice picker */}
              <div className="mt-6">
                <span
                  className="text-xs uppercase tracking-[0.2em]"
                  style={{
                    color: "var(--ink-muted)",
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                  }}
                >
                  03 · Voice
                </span>
                <div className="mt-3 flex items-center gap-3">
                  <Mic className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                  <select
                    value={voiceStyle}
                    onChange={(e) => setVoiceStyle(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm outline-none"
                    style={{
                      background: "var(--paper-input)",
                      border: "1px solid var(--rule)",
                      borderRadius: 4,
                      color: "var(--ink)",
                    }}
                  >
                    {VOICE_PRESETS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {VOICE_PRESETS.find((v) => v.id === voiceStyle)?.tone}
                </p>
                <p className="mt-3 text-xs">
                  <span
                    aria-disabled="true"
                    className="cursor-not-allowed select-none"
                    style={{ color: "var(--ink-muted)" }}
                    title="Coming soon — voice cloning lands with the Pro tier"
                  >
                    Clone my voice → <span style={{ color: "var(--gold-deep)" }}>Coming soon</span>
                  </span>
                </p>
              </div>

              {/* Generate button */}
              <div className="mt-7">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-sm uppercase tracking-[0.18em] font-medium transition-all"
                  style={{
                    background: canGenerate ? "var(--ink)" : "var(--rule-strong)",
                    color: "var(--paper)",
                    border: `1px solid ${canGenerate ? "var(--ink)" : "var(--rule-strong)"}`,
                    borderRadius: 4,
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                    cursor: canGenerate ? "pointer" : "not-allowed",
                    opacity: canGenerate ? 1 : 0.7,
                  }}
                  onMouseEnter={(e) => {
                    if (!canGenerate) return;
                    e.currentTarget.style.background = "var(--gold-deep)";
                    e.currentTarget.style.borderColor = "var(--gold-deep)";
                  }}
                  onMouseLeave={(e) => {
                    if (!canGenerate) return;
                    e.currentTarget.style.background = "var(--ink)";
                    e.currentTarget.style.borderColor = "var(--ink)";
                  }}
                >
                  {status.state === "generating" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate my AI Twin
                    </>
                  )}
                </button>
                {!photoDataUrl && (
                  <p
                    className="mt-3 text-xs text-center"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    Upload a photo to enable.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── RESULT / PROGRESS PANEL ── */}
          {status.state !== "idle" && (
            <div
              className="mt-6 p-7"
              style={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--rule)",
                borderRadius: 6,
              }}
            >
              {status.state === "generating" && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Loader2
                      className="w-5 h-5 animate-spin"
                      style={{ color: "var(--gold-deep)" }}
                    />
                    <span
                      className="text-sm uppercase tracking-[0.18em]"
                      style={{
                        color: "var(--ink)",
                        fontFamily: "JetBrains Mono, ui-monospace, monospace",
                      }}
                    >
                      {status.message}
                    </span>
                  </div>
                  <div
                    className="w-full h-1 overflow-hidden"
                    style={{ background: "var(--rule)", borderRadius: 999 }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(2, status.progress))}%`,
                        background: "var(--gold-deep)",
                      }}
                    />
                  </div>
                  <p
                    className="mt-3 text-xs"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    Step: {status.step}. Most twins finish in 30–90 seconds.
                  </p>
                </div>
              )}

              {status.state === "done" && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Check
                      className="w-5 h-5"
                      style={{ color: "var(--gold-deep)" }}
                    />
                    <span
                      className="text-sm uppercase tracking-[0.18em]"
                      style={{
                        color: "var(--ink)",
                        fontFamily: "JetBrains Mono, ui-monospace, monospace",
                      }}
                    >
                      Your twin is ready
                    </span>
                  </div>
                  <div
                    className="overflow-hidden mb-5"
                    style={{
                      borderRadius: 4,
                      border: "1px solid var(--rule)",
                      background: "var(--ink)",
                    }}
                  >
                    <video
                      key={status.videoUrl}
                      src={status.videoUrl}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-auto"
                      style={{ maxHeight: 600 }}
                    >
                      Your browser does not support HTML5 video.
                    </video>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={status.videoUrl}
                      download="ai-twin.mp4"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.18em]"
                      style={{
                        background: "var(--ink)",
                        color: "var(--paper)",
                        border: "1px solid var(--ink)",
                        borderRadius: 4,
                        fontFamily: "JetBrains Mono, ui-monospace, monospace",
                      }}
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.18em]"
                      style={{
                        background: "transparent",
                        color: "var(--ink)",
                        border: "1px solid var(--rule-strong)",
                        borderRadius: 4,
                        fontFamily: "JetBrains Mono, ui-monospace, monospace",
                      }}
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                    <button
                      type="button"
                      onClick={handleMakeAnother}
                      className="inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.18em]"
                      style={{
                        background: "transparent",
                        color: "var(--ink)",
                        border: "1px solid var(--rule-strong)",
                        borderRadius: 4,
                        fontFamily: "JetBrains Mono, ui-monospace, monospace",
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Make another
                    </button>
                  </div>
                </div>
              )}

              {status.state === "error" && (
                <div role="alert">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{ color: "var(--gold-deep)" }}
                    />
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--ink)" }}
                      >
                        We couldn't finish your video.
                      </p>
                      <p className="text-sm mt-1" style={{ color: "var(--ink-secondary)" }}>
                        {status.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.18em]"
                      style={{
                        background: "var(--ink)",
                        color: "var(--paper)",
                        border: "1px solid var(--ink)",
                        borderRadius: 4,
                        fontFamily: "JetBrains Mono, ui-monospace, monospace",
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus({ state: "idle" })}
                      className="inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.18em]"
                      style={{
                        background: "transparent",
                        color: "var(--ink)",
                        border: "1px solid var(--rule-strong)",
                        borderRadius: 4,
                        fontFamily: "JetBrains Mono, ui-monospace, monospace",
                      }}
                    >
                      Start over
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ───────── TRUST STRIP ───────── */}
      <section className="px-6 py-20" style={{ background: "var(--paper-elevated)" }}>
        <div className="max-w-6xl mx-auto">
          <div
            className="text-xs uppercase tracking-[0.2em] mb-10"
            style={{
              color: "var(--gold-deep)",
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
            }}
          >
            Why it works
          </div>
          <div className="grid md:grid-cols-3 gap-px" style={{ background: "var(--rule)" }}>
            {TRUST_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="p-8 lg:p-10"
                  style={{ background: "var(--paper)" }}
                >
                  <Icon
                    className="w-6 h-6 mb-6"
                    style={{ color: "var(--ink-muted)" }}
                  />
                  <h3
                    className="display text-3xl mb-3"
                    style={{ color: "var(--ink)" }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="text-xs uppercase tracking-[0.2em] mb-4"
                    style={{
                      color: "var(--gold-deep)",
                      fontFamily: "JetBrains Mono, ui-monospace, monospace",
                    }}
                  >
                    {card.stat}
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── EXAMPLE OUTPUTS ───────── */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <div>
              <p
                className="text-xs uppercase tracking-[0.2em] mb-3"
                style={{
                  color: "var(--gold-deep)",
                  fontFamily: "JetBrains Mono, ui-monospace, monospace",
                }}
              >
                What others are making
              </p>
              <h2
                className="display text-4xl sm:text-5xl"
                style={{ color: "var(--ink)" }}
              >
                Twins in the wild.
              </h2>
            </div>
            <p
              className="max-w-md text-sm"
              style={{ color: "var(--ink-secondary)" }}
            >
              Six placeholder examples — your own outputs land in the panel above. We don't show real customer videos here without permission.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EXAMPLES.map((ex, i) => (
              <ExamplePlaceholder key={i} index={i} {...ex} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── PRICING ───────── */}
      <section
        id="pricing"
        className="px-6 py-24"
        style={{ background: "var(--paper-elevated)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p
              className="text-xs uppercase tracking-[0.2em] mb-3"
              style={{
                color: "var(--gold-deep)",
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
              }}
            >
              Pricing
            </p>
            <h2
              className="display text-4xl sm:text-5xl"
              style={{ color: "var(--ink)" }}
            >
              Simple. Honest. Cheaper than every alternative.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className="p-8 flex flex-col"
                style={{
                  background: "var(--paper)",
                  border: tier.highlighted
                    ? "1px solid var(--gold-deep)"
                    : "1px solid var(--rule)",
                  borderRadius: 6,
                  boxShadow: tier.highlighted
                    ? "0 12px 40px -16px rgba(168, 137, 63, 0.25)"
                    : "none",
                }}
              >
                {tier.highlighted && (
                  <div
                    className="inline-flex w-fit items-center gap-1 px-2 py-1 mb-4 text-[10px] uppercase tracking-[0.2em]"
                    style={{
                      background: "var(--gold-soft)",
                      color: "var(--gold-deep)",
                      borderRadius: 999,
                      fontFamily: "JetBrains Mono, ui-monospace, monospace",
                    }}
                  >
                    Most popular
                  </div>
                )}
                <h3
                  className="display text-2xl mb-2"
                  style={{ color: "var(--ink)" }}
                >
                  {tier.name}
                </h3>
                <div className="mb-1 flex items-baseline gap-1">
                  <span
                    className="text-5xl font-medium"
                    style={{
                      color: "var(--ink)",
                      fontFamily: "JetBrains Mono, ui-monospace, monospace",
                    }}
                  >
                    {tier.price}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {tier.cadence}
                  </span>
                </div>
                <p
                  className="text-sm mb-6"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  {tier.quota}
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: "var(--ink-secondary)" }}
                    >
                      <Check
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: "var(--gold-deep)" }}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={scrollToDemo}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.18em] transition-all"
                  style={{
                    background: tier.highlighted ? "var(--ink)" : "transparent",
                    color: tier.highlighted ? "var(--paper)" : "var(--ink)",
                    border: tier.highlighted
                      ? "1px solid var(--ink)"
                      : "1px solid var(--rule-strong)",
                    borderRadius: 4,
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                  }}
                  onMouseEnter={(e) => {
                    if (tier.highlighted) {
                      e.currentTarget.style.background = "var(--gold-deep)";
                      e.currentTarget.style.borderColor = "var(--gold-deep)";
                    } else {
                      e.currentTarget.style.borderColor = "var(--ink)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tier.highlighted) {
                      e.currentTarget.style.background = "var(--ink)";
                      e.currentTarget.style.borderColor = "var(--ink)";
                    } else {
                      e.currentTarget.style.borderColor = "var(--rule-strong)";
                    }
                  }}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FOOTER-ADJACENT CTA ───────── */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="display-italic text-5xl sm:text-6xl lg:text-7xl leading-[1] mb-10"
            style={{ color: "var(--ink)" }}
          >
            Ship your first <span style={{ color: "var(--gold-deep)" }}>AI Twin</span> video today.
          </h2>
          <button
            type="button"
            onClick={scrollToDemo}
            className="inline-flex items-center gap-2 px-7 py-4 text-sm uppercase tracking-[0.18em] font-medium transition-all"
            style={{
              background: "var(--ink)",
              color: "var(--paper)",
              border: "1px solid var(--ink)",
              borderRadius: 4,
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--gold-deep)";
              e.currentTarget.style.borderColor = "var(--gold-deep)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--ink)";
              e.currentTarget.style.borderColor = "var(--ink)";
            }}
          >
            Try free →
          </button>
          <p
            className="mt-6 text-xs uppercase tracking-[0.2em]"
            style={{
              color: "var(--ink-muted)",
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
            }}
          >
            zoobicon.com · zoobicon.ai · zoobicon.io
          </p>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function ExamplePlaceholder({
  label,
  duration,
  tone,
  index,
}: {
  label: string;
  duration: string;
  tone: string;
  index: number;
}) {
  // Deterministic gradient angles so re-renders don't flicker.
  const angle = useMemo(() => 35 + index * 23, [index]);
  return (
    <div
      className="overflow-hidden group"
      style={{
        background: "var(--paper-elevated)",
        border: "1px solid var(--rule)",
        borderRadius: 6,
      }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          aspectRatio: "9 / 16",
          background: `linear-gradient(${angle}deg, var(--paper-elevated) 0%, var(--gold-soft) 60%, var(--paper-elevated) 100%)`,
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: "var(--ink-muted)" }}
        >
          <ImageIcon className="w-10 h-10" />
        </div>
        <div
          className="absolute top-3 left-3 px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
          style={{
            background: "var(--paper)",
            color: "var(--ink-muted)",
            border: "1px solid var(--rule)",
            borderRadius: 4,
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
          }}
        >
          Example output
        </div>
        <div
          className="absolute bottom-3 right-3 px-2 py-1 text-[10px]"
          style={{
            background: "var(--ink)",
            color: "var(--paper)",
            borderRadius: 4,
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
          }}
        >
          {duration}
        </div>
      </div>
      <div className="p-4 flex items-center justify-between">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--ink)" }}
        >
          {label}
        </span>
        <span
          className="text-xs"
          style={{ color: "var(--ink-muted)" }}
        >
          {tone}
        </span>
      </div>
    </div>
  );
}
