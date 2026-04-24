"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Video,
  Send,
  Loader2,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Check,
  Download,
  RefreshCw,
  User,
  Bot,
  Monitor,
  Smartphone,
  Square,
  Play,
  AlertCircle,
  Megaphone,
  BookOpen,
  MessageSquareQuote,
  Briefcase,
  GraduationCap,
  Building2,
  Clapperboard,
  Crown,
  Smile,
  Zap,
  Share2,
  Wand2,
  Film,
  Mic,
  ImageIcon,
  ArrowLeft,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Scene {
  sceneNumber: number;
  duration: string;
  visualDescription: string;
  textOverlay: string;
  transition: string;
  cameraMovement: string;
  colorPalette: string[];
}

interface Storyboard {
  storyboard: Scene[];
  totalDuration: string;
  estimatedRenderTime: string;
  script: string;
  musicCues?: string[];
}

interface Project {
  id: string;
  name: string;
  createdAt: string;
  projectType: string;
  platform: string;
  storyboard: Storyboard | null;
}

interface RenderJob {
  id: string;
  provider: string;
  sceneNumber: number;
  status: "pending" | "processing" | "succeeded" | "failed";
  videoUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
  progress?: number;
}

interface VoicePreset {
  id: string;
  name: string;
  description: string;
  category: "male" | "female" | "neutral";
  tone: string;
}

interface PipelineCapabilities {
  videoRender: { available: boolean };
  voiceover: { available: boolean };
  imageGen: { available: boolean };
}

type PipelineStage = "idle" | "images" | "video" | "voiceover" | "subtitles" | "complete";

interface PipelineStageStatus {
  status: "pending" | "running" | "done" | "failed" | "skipped";
  error?: string;
}

interface FullPipelineProgress {
  running: boolean;
  images: PipelineStageStatus;
  video: PipelineStageStatus;
  voiceover: PipelineStageStatus;
  subtitles: PipelineStageStatus;
}

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  projectType: string;
  platform: string;
  duration: number;
  style: string;
  music: string;
  thumbnail: string;
  script: string;
  tags: string[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PROJECT_TYPES = [
  { id: "social-ad", label: "Social Media Ad", icon: Sparkles, desc: "Eye-catching ads for social platforms" },
  { id: "product-demo", label: "Product Demo", icon: Play, desc: "Showcase your product in action" },
  { id: "explainer", label: "Explainer", icon: BookOpen, desc: "Break down complex ideas simply" },
  { id: "testimonial", label: "Testimonial", icon: MessageSquareQuote, desc: "Customer stories that convert" },
  { id: "brand-story", label: "Brand Story", icon: Briefcase, desc: "Tell your brand narrative" },
  { id: "tutorial", label: "Tutorial", icon: GraduationCap, desc: "Step-by-step how-to content" },
];

const VISUAL_STYLES = [
  { id: "modern-minimalist", label: "Modern / Minimalist", icon: Zap, color: "from-slate-400 to-slate-600" },
  { id: "bold-dynamic", label: "Bold / Dynamic", icon: Sparkles, color: "from-stone-500 to-stone-500" },
  { id: "elegant-luxury", label: "Elegant / Luxury", icon: Crown, color: "from-stone-400 to-stone-600" },
  { id: "fun-playful", label: "Fun / Playful", icon: Smile, color: "from-stone-500 to-stone-500" },
  { id: "corporate-professional", label: "Corporate / Professional", icon: Building2, color: "from-stone-500 to-stone-600" },
  { id: "cinematic", label: "Cinematic", icon: Clapperboard, color: "from-stone-500 to-stone-600" },
];

const PLATFORMS = [
  { id: "tiktok", label: "TikTok", aspect: "9:16", icon: Smartphone },
  { id: "instagram-reels", label: "Camera Reels", aspect: "9:16", icon: Smartphone },
  { id: "youtube", label: "YouTube", aspect: "16:9", icon: Monitor },
  { id: "linkedin", label: "LinkedIn", aspect: "16:9", icon: Monitor },
  { id: "twitter", label: "MessageCircle / X", aspect: "1:1", icon: Square },
];

const DURATIONS = [
  { value: 15, label: "15s", desc: "Quick hook" },
  { value: 30, label: "30s", desc: "Standard" },
  { value: 60, label: "60s", desc: "Detailed" },
  { value: 90, label: "90s", desc: "In-depth" },
];

const MUSIC_CATEGORIES = [
  { id: "upbeat", label: "Upbeat", emoji: "~" },
  { id: "chill", label: "Chill", emoji: "~" },
  { id: "corporate", label: "Corporate", emoji: "~" },
  { id: "dramatic", label: "Dramatic", emoji: "~" },
  { id: "none", label: "None", emoji: "" },
];

const FONTS = [
  "Inter", "Montserrat", "Playfair Display", "Poppins", "Space Grotesk", "DM Sans",
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ------------------------------------------------------------------ */
/*  User-friendly error messages (never show raw API responses)        */
/* ------------------------------------------------------------------ */
function sanitizeError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("authentication failed") || lower.includes("invalid api key") || lower.includes("unauthorized") || lower.includes("auth error"))
    return "Voice generation encountered an issue. Please try again — if this persists, contact support.";
  if (lower.includes("all models failed") || lower.includes("voice generation failed"))
    return "Voice generation is temporarily unavailable. Please try again in a moment.";
  if (lower.includes("payment_required") || lower.includes("paid_plan") || lower.includes("upgrade your subscription"))
    return "This voice model is not available on your current plan. The system will try alternative models automatically.";
  if (lower.includes("requires a scene image") || lower.includes("generate images first"))
    return "Generate scene images before rendering video.";
  if (lower.includes("validation of body failed") || lower.includes("too_big"))
    return "Video render request was too large. Try shorter scenes.";
  if (lower.includes("base64") || lower.includes("embedded images") || lower.includes("too large for video"))
    return "Scene images are too large for video rendering. Click 'Regenerate Images' to fix this.";
  if (lower.includes("rate limit") || lower.includes("429"))
    return "Rate limited. Please wait a moment and try again.";
  // Video rendering "coming soon" or provider not configured
  if (lower.includes("coming soon") || lower.includes("no provider configured") || lower.includes("not configured") || lower.includes("no video rendering"))
    return "Video rendering is coming soon. Images, voiceover, and subtitles are ready!";
  // Video rendering failures (provider issues, all scenes failed, etc.)
  if (lower.includes("render") && (lower.includes("fail") || lower.includes("error") || lower.includes("unavailable")))
    return "Video rendering is not yet available. Images, voiceover, and subtitles are still ready!";
  if (lower.includes("provider") && (lower.includes("fail") || lower.includes("unavailable") || lower.includes("error") || lower.includes("not configured")))
    return "Video rendering provider is not yet available. Other pipeline stages completed successfully.";
  // Storyboard / AI generation failures
  if (lower.includes("storyboard") && (lower.includes("fail") || lower.includes("error")))
    return "Storyboard generation failed. Please try again.";
  if (lower.includes("all ai providers") || lower.includes("ai service") || lower.includes("temporarily unavailable"))
    return "AI service is temporarily unavailable. Please try again in a moment.";
  if (lower.includes("parse") && lower.includes("storyboard"))
    return "Storyboard generation encountered an issue. Please try again.";
  if (lower.includes("api error") || lower.includes("api_error"))
    return "Service temporarily unavailable. Please try again.";
  if (lower.includes("add api") || lower.includes("environment"))
    return "This feature is coming soon.";
  if (lower.includes("timeout") || lower.includes("timed out"))
    return "Request timed out. Please try again.";
  if (lower.includes("image generation") && lower.includes("fail"))
    return "Image generation failed. Please try again.";
  if (lower.includes("voiceover") && lower.includes("fail"))
    return "Voiceover generation failed. Please try again.";
  if (lower.includes("subtitle") && lower.includes("fail"))
    return "Subtitle generation failed. Please try again.";
  // Strip any JSON, env var references, and technical details from the message
  let cleaned = raw.replace(/\{[\s\S]*\}/, "").replace(/\[[\s\S]*\]/, "").trim();
  cleaned = cleaned.replace(/[A-Z_]{3,}_[A-Z_]+/g, "").trim(); // Strip env var names like ELEVENLABS_API_KEY
  // If what's left still looks technical, genericize — but keep reasonably short user-friendly messages
  if (cleaned.includes("error:") || cleaned.includes("Error:") || cleaned.includes("env") || cleaned.includes("key") || cleaned.includes("API") || cleaned.includes("module"))
    return "Something went wrong. Please try again.";
  // Keep cleaned messages up to 120 chars (previous limit of 80 was too aggressive)
  if (cleaned.length > 120)
    return "Something went wrong. Please try again.";
  return cleaned || "Something went wrong. Please try again.";
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function VideoCreatorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);

  // Step tracking
  const [step, setStep] = useState<"describe" | "scripts" | "produce">("describe");

  // Step 1: Describe
  const [description, setDescription] = useState("");
  const [generatingScripts, setGeneratingScripts] = useState(false);

  // Step 2: Scripts
  const [scripts, setScripts] = useState<string[]>([]);
  const [selectedScript, setSelectedScript] = useState<number | null>(null);
  const [editedScript, setEditedScript] = useState("");

  // Step 3: Produce
  const [selectedAvatarId, setSelectedAvatarId] = useState("emma");
  const [format, setFormat] = useState<"landscape" | "portrait" | "square">("landscape");
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState("");
  const [videoStatus, setVideoStatus] = useState("");

  // Auth
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
      else router.push("/auth/login");
    } catch { router.push("/auth/login"); }
  }, [router]);

  // Step 1: Generate scripts from description
  const handleGenerateScripts = async () => {
    if (!description.trim()) return;
    setGeneratingScripts(true);
    setScripts([]);
    setVideoError("");

    try {
      const res = await fetch("/api/video-creator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Write exactly 2 video scripts for this: ${description.trim()}

Output ONLY the scripts in this exact format, nothing else:

SCRIPT_1:
[First script here - 30-60 seconds, natural conversational tone]

SCRIPT_2:
[Second script here - different approach, same length]`
          }],
        }),
      });

      if (!res.ok) throw new Error("Failed to generate scripts");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "text") fullText += event.content;
          } catch {}
        }
      }

      // Parse scripts from response
      const parsed: string[] = [];
      const script1Match = fullText.match(/SCRIPT_1:\s*([\s\S]*?)(?=SCRIPT_2:|$)/);
      const script2Match = fullText.match(/SCRIPT_2:\s*([\s\S]*?)$/);

      if (script1Match?.[1]?.trim()) parsed.push(script1Match[1].trim().replace(/^\[|\]$/g, "").replace(/\*\*/g, ""));
      if (script2Match?.[1]?.trim()) parsed.push(script2Match[1].trim().replace(/^\[|\]$/g, "").replace(/\*\*/g, ""));

      // Fallback: if parsing failed, split by double newline
      if (parsed.length === 0) {
        const chunks = fullText.split(/\n\n+/).filter(c => c.trim().length > 50);
        if (chunks.length >= 2) {
          parsed.push(chunks[0].trim());
          parsed.push(chunks[1].trim());
        } else if (chunks.length === 1) {
          parsed.push(chunks[0].trim());
        } else {
          parsed.push(fullText.trim());
        }
      }

      setScripts(parsed);
      setStep("scripts");
    } catch (err) {
      setVideoError("Failed to generate scripts. Please try again.");
    }
    setGeneratingScripts(false);
  };

  // Step 2: Select and move to production
  const handleSelectScript = (index: number) => {
    setSelectedScript(index);
    setEditedScript(scripts[index]);
  };

  const handleProceedToProduction = () => {
    if (editedScript.trim().length < 10) {
      setVideoError("Script is too short. Please write at least a few sentences.");
      return;
    }
    setStep("produce");
    setVideoError("");
  };

  // Step 3: Generate video using our Replicate pipeline
  const handleGenerateVideo = async () => {
    if (!editedScript.trim()) return;

    setGenerating(true);
    setVideoError("");
    setVideoUrl(null);
    setVideoStatus("Starting video generation...");

    // Track URL locally — React state is async, can't be read mid-loop
    let receivedVideoUrl: string | null = null;

    try {
      const res = await fetch("/api/v1/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: editedScript.trim(),
          avatarPresetId: selectedAvatarId,
          voiceGender: (["james", "michael", "david"].includes(selectedAvatarId) ? "male" : "female") as "female" | "male",
          voiceStyle: "professional",
          background: "#0f172a",
          format,
        }),
      });

      // Non-streaming error responses (4xx, 503)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ||
            (res.status === 503
              ? "Video generation is being configured. REPLICATE_API_TOKEN may be missing in Vercel env. Please contact support."
              : `Video generation failed (HTTP ${res.status})`)
        );
      }

      // Read SSE stream for progress updates
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream from video API.");

      const decoder = new TextDecoder();
      let buf = "";
      let streamError: Error | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let event: { type?: string; message?: string; videoUrl?: string; step?: string; progress?: number };
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue; // Ignore unparseable SSE chunks
          }
          if (event.type === "status") {
            setVideoStatus(event.message || "Processing...");
          } else if (event.type === "done" && event.videoUrl) {
            receivedVideoUrl = event.videoUrl;
            setVideoUrl(event.videoUrl);
            setVideoStatus("");
            setGenerating(false);
            return;
          } else if (event.type === "error") {
            streamError = new Error(event.message || "Video generation failed.");
            break;
          }
        }

        if (streamError) break;
      }

      if (streamError) throw streamError;

      // Stream ended without a done event — something silently failed upstream
      if (!receivedVideoUrl) {
        throw new Error("Video generation ended without producing a video. Please try again.");
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Video generation failed.";
      // Pass through clear errors verbatim, sanitize fuzzy ones
      const msg = raw.includes("REPLICATE_API_TOKEN") || raw.includes("HTTP") || raw.includes("model")
        ? raw
        : sanitizeError(raw);
      setVideoError(msg);
      setGenerating(false);
      setVideoStatus("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("zoobicon_user");
    window.location.href = "/";
  };

  const handleStartOver = () => {
    setStep("describe");
    setDescription("");
    setScripts([]);
    setSelectedScript(null);
    setEditedScript("");
    setVideoUrl(null);
    setVideoError("");
    setVideoStatus("");
    setGenerating(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0b1530] text-white relative overflow-hidden fs-grain pt-[72px]">
      {/* Ambient cinematic glow — matches Filmora standard */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-[10%] h-[720px] w-[1200px] -translate-x-1/2 rounded-full blur-[160px]"
          style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.09), transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-[15%] h-[500px] w-[700px] rounded-full blur-[140px]"
          style={{ background: "radial-gradient(closest-side, rgba(224,139,176,0.05), transparent 70%)" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
      </div>

      {/* Step indicator sub-header — below global nav */}
      <div className="relative z-40 border-b border-white/[0.04] bg-[#0b1530]/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, #E8D4B0 0%, #F7C8A0 60%, #E08BB0 100%)",
                boxShadow: "0 8px 20px -10px rgba(232,212,176,0.5)",
              }}
            >
              <Film className="h-3.5 w-3.5 text-black" />
            </div>
            <span className="text-[13px] font-medium text-white/80 tracking-tight">Video Studio</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            {[
              { key: "describe", label: "Describe", num: "1" },
              { key: "scripts", label: "Script", num: "2" },
              { key: "produce", label: "Generate", num: "3" },
            ].map((s, i) => {
              const isActive = step === s.key;
              const isCompleted = (s.key === "describe" && step !== "describe") || (s.key === "scripts" && step === "produce");
              return (
                <div key={s.key} className="flex items-center gap-1.5">
                  {i > 0 && <div className={`w-6 h-[1.5px] rounded-full transition-all duration-500 ${isCompleted || isActive ? "bg-[#E8D4B0]" : "bg-white/[0.08]"}`} />}
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide transition-all duration-300 ${
                    isActive ? "bg-[#E8D4B0]/[0.08] text-[#E8D4B0] border border-[#E8D4B0]/30" :
                    isCompleted ? "text-[#E8D4B0]/70" :
                    "text-white/25 border border-transparent"
                  }`}>
                    {isCompleted ? <Check className="w-3 h-3" /> : <span className="text-[10px] opacity-60">{s.num}</span>}
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="text-[12px] text-white/50 hover:text-white/90 px-3 py-1.5 rounded-full hover:bg-white/[0.04] flex items-center gap-1.5 transition-all">
              <LayoutDashboard className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button onClick={handleLogout} className="text-[12px] text-white/50 hover:text-white/90 px-2 py-1.5 rounded-full hover:bg-white/[0.04] transition-all">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-10">

        {/* Error display */}
        {videoError && (
          <div className="mb-6 p-4 rounded-2xl bg-stone-500/[0.06] border border-stone-500/20 backdrop-blur-xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-500/10 flex items-center justify-center shrink-0 border border-stone-500/20">
              <AlertCircle className="w-4 h-4 text-stone-400" />
            </div>
            <div className="pt-0.5 flex-1">
              <div className="text-sm font-medium text-stone-300">{videoError}</div>
              <div className="flex items-center gap-3 mt-3">
                {step === "produce" && editedScript && (
                  <button
                    onClick={() => { setVideoError(""); handleGenerateVideo(); }}
                    className="text-xs font-medium text-white hover:text-white px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                )}
                <button onClick={() => setVideoError("")} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 1: DESCRIBE — cinematic hero ═══ */}
        {step === "describe" && (
          <div className="flex flex-col items-center pt-16 sm:pt-24">
            {/* Hero */}
            <div className="text-center mb-12 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
                <Sparkles className="h-3 w-3" />
                Cinematic AI video studio
              </div>
              <h1 className="fs-display-lg text-white">
                Make a video that{" "}
                <span
                  className="font-normal"
                  style={{
                    fontFamily: "Fraunces, ui-serif, Georgia, serif",
                    fontStyle: "italic",
                    color: "#E8D4B0",
                  }}
                >
                  converts.
                </span>
              </h1>
              <p className="mt-6 text-[17px] sm:text-lg text-white/55 max-w-xl mx-auto leading-relaxed">
                Describe the video. Our AI director writes the script, clones the voice, renders the avatar, and burns the captions — all in a single take.
              </p>
            </div>

            {/* Input panel — Filmora-tier card */}
            <div className="w-full max-w-2xl">
              <div
                className="relative overflow-hidden rounded-[28px] border border-white/[0.08] backdrop-blur-xl transition-all focus-within:border-[#E8D4B0]/35"
                style={{
                  background: "linear-gradient(135deg, rgba(20,40,95,0.85) 0%, rgba(10,10,15,0.7) 100%)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 60px -28px rgba(0,0,0,0.7)",
                }}
              >
                <div
                  className="pointer-events-none absolute -right-24 -top-24 h-[300px] w-[300px] rounded-full blur-[100px]"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.18), transparent 70%)" }}
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerateScripts(); } }}
                  placeholder="A 30-second promo featuring an excited presenter explaining our AI website builder…"
                  rows={4}
                  className="relative w-full px-6 pt-6 pb-2 bg-transparent text-white text-[15px] placeholder-white/25 focus:outline-none resize-none leading-relaxed"
                  autoFocus
                />
                <div className="relative flex items-center justify-between px-5 pb-5 pt-2">
                  <div className="text-[11px] text-white/25 font-medium tracking-wide">
                    {description.length > 0 && <span>{description.length} chars</span>}
                  </div>
                  <button
                    onClick={handleGenerateScripts}
                    disabled={generatingScripts || description.trim().length < 10}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-semibold transition-all duration-500 hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={{
                      background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                      color: "#0a1628",
                      boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                    }}
                  >
                    {generatingScripts ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Writing scripts…</>
                    ) : (
                      <><Wand2 className="w-4 h-4" /> Generate scripts</>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick prompt chips */}
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {[
                  { label: "Product demo", prompt: "30-second product demo for Zoobicon showing the AI builder and domain search — professional, confident presenter" },
                  { label: "Testimonial", prompt: "Testimonial-style video about how AI is making web development accessible to everyone" },
                  { label: "Explainer", prompt: "Short explainer about Zoobicon for small business owners who need a website fast" },
                  { label: "Social ad", prompt: "Product launch video for our free domain search tool — energetic, hook-first opening for social media" },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => setDescription(chip.prompt)}
                    className="group/chip inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[12px] font-medium text-white/55 transition-all hover:-translate-y-0.5 hover:border-[#E8D4B0]/30 hover:bg-[#E8D4B0]/[0.04] hover:text-[#E8D4B0]"
                  >
                    <Sparkles className="w-3 h-3 text-white/25 group-hover/chip:text-[#E8D4B0] transition-colors" />
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Pipeline trust strip */}
              <div className="mt-12 flex items-center justify-center gap-6 text-[11px] text-white/30 font-medium tracking-[0.12em] uppercase">
                <span className="flex items-center gap-1.5"><Mic className="w-3 h-3" /> Fish Audio S1</span>
                <span className="h-1 w-1 rounded-full bg-white/15" />
                <span className="flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> FLUX avatar</span>
                <span className="h-1 w-1 rounded-full bg-white/15" />
                <span className="flex items-center gap-1.5"><Film className="w-3 h-3" /> Lip sync</span>
                <span className="h-1 w-1 rounded-full bg-white/15" />
                <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Whisper captions</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: PICK SCRIPT ═══ */}
        {step === "scripts" && (
          <div className="max-w-3xl mx-auto pt-6">
            {/* Header */}
            <div className="mb-10">
              <button onClick={() => setStep("describe")} className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-[#E8D4B0] transition-colors mb-4 uppercase tracking-[0.12em]">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <h2 className="fs-display-sm text-white">
                Choose your{" "}
                <span
                  className="font-normal"
                  style={{ fontFamily: "Fraunces, ui-serif, Georgia, serif", fontStyle: "italic", color: "#E8D4B0" }}
                >
                  script.
                </span>
              </h2>
              <p className="mt-3 text-[15px] text-white/55 max-w-lg">Our AI director wrote two approaches. Pick one and refine it.</p>
            </div>

            {/* Script cards */}
            <div className="grid gap-5 mb-8">
              {scripts.map((script, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectScript(i)}
                  className={`relative overflow-hidden p-7 rounded-[24px] border text-left transition-all duration-500 hover:-translate-y-0.5 group/script ${
                    selectedScript === i
                      ? "border-[#E8D4B0]/40"
                      : "border-white/[0.08] hover:border-white/[0.15]"
                  }`}
                  style={{
                    background: selectedScript === i
                      ? "linear-gradient(135deg, rgba(232,212,176,0.07) 0%, rgba(224,139,176,0.04) 100%)"
                      : "linear-gradient(135deg, rgba(20,40,95,0.6) 0%, rgba(10,10,15,0.4) 100%)",
                    boxShadow: selectedScript === i
                      ? "0 1px 0 rgba(232,212,176,0.15) inset, 0 28px 70px -32px rgba(232,212,176,0.35)"
                      : "0 1px 0 rgba(255,255,255,0.03) inset, 0 20px 50px -30px rgba(0,0,0,0.6)",
                  }}
                >
                  {selectedScript === i && (
                    <div
                      className="absolute inset-x-0 top-0 h-[2px]"
                      style={{ background: "linear-gradient(90deg, transparent, #E8D4B0, #E08BB0, transparent)" }}
                    />
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-[13px] font-bold transition-all ${
                          selectedScript === i ? "text-black" : "bg-white/[0.06] text-white/40"
                        }`}
                        style={selectedScript === i ? {
                          background: "linear-gradient(135deg, #E8D4B0 0%, #F7C8A0 60%, #E08BB0 100%)",
                          boxShadow: "0 8px 20px -10px rgba(232,212,176,0.5)",
                        } : undefined}
                      >
                        {i + 1}
                      </div>
                      <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${selectedScript === i ? "text-[#E8D4B0]" : "text-white/35"}`}>
                        {i === 0 ? "Direct approach" : "Creative approach"}
                      </span>
                    </div>
                    {selectedScript === i && (
                      <div className="flex items-center gap-1.5 rounded-full bg-[#E8D4B0]/15 px-2.5 py-1 text-[10px] font-semibold text-[#E8D4B0] uppercase tracking-[0.18em] border border-[#E8D4B0]/25">
                        <Check className="w-3 h-3" /> Selected
                      </div>
                    )}
                  </div>
                  <div className="text-[14px] text-white/65 leading-[1.7] whitespace-pre-wrap group-hover/script:text-white/80 transition-colors">{script}</div>
                </button>
              ))}
            </div>

            {/* Edit + proceed */}
            {selectedScript !== null && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#E8D4B0]/80 uppercase tracking-[0.18em]">Refine your script</label>
                  <span className="text-[11px] text-white/25">{editedScript.length} chars</span>
                </div>
                <textarea
                  value={editedScript}
                  onChange={(e) => setEditedScript(e.target.value)}
                  rows={6}
                  className="w-full px-6 py-5 bg-white/[0.03] border border-white/[0.08] rounded-[24px] text-white/85 text-[14px] focus:outline-none focus:border-[#E8D4B0]/35 focus:bg-white/[0.04] resize-none leading-[1.7] transition-all backdrop-blur-xl"
                />
                <button
                  onClick={handleProceedToProduction}
                  className="w-full py-5 rounded-full font-semibold text-[15px] transition-all duration-500 hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
                  style={{
                    background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                    color: "#0a1628",
                    boxShadow: "0 18px 48px -18px rgba(232,212,176,0.55)",
                  }}
                >
                  Continue to production <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 3: PRODUCE ═══ */}
        {step === "produce" && !videoUrl && (
          <div className="max-w-4xl mx-auto pt-6">
            {/* Header */}
            <div className="mb-10">
              <button onClick={() => setStep("scripts")} className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-[#E8D4B0] transition-colors mb-4 uppercase tracking-[0.12em]">
                <ArrowLeft className="w-3 h-3" /> Back to scripts
              </button>
              <h2 className="fs-display-sm text-white">
                Production{" "}
                <span
                  className="font-normal"
                  style={{ fontFamily: "Fraunces, ui-serif, Georgia, serif", fontStyle: "italic", color: "#E8D4B0" }}
                >
                  settings.
                </span>
              </h2>
              <p className="mt-3 text-[15px] text-white/55 max-w-lg">Configure your presenter and format, then roll camera.</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
              {/* Left: Settings (3 cols) */}
              <div className="lg:col-span-3 space-y-5">
                {/* Script preview */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-stone-500/20 to-stone-500/20 flex items-center justify-center">
                      <BookOpen className="w-3 h-3 text-stone-400" />
                    </div>
                    <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Script</span>
                  </div>
                  <div className="text-[13px] text-white/50 leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto">{editedScript}</div>
                </div>

                {/* Presenter picker — real photos for authentic lip-sync */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4 block">Choose Your Presenter</label>
                  <div className="grid grid-cols-6 gap-2.5">
                    {[
                      { id: "emma",    name: "Emma",    thumb: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=face&q=80" },
                      { id: "sarah",   name: "Sarah",   thumb: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=face&q=80" },
                      { id: "jessica", name: "Jessica", thumb: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face&q=80" },
                      { id: "james",   name: "James",   thumb: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face&q=80" },
                      { id: "michael", name: "Michael", thumb: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=face&q=80" },
                      { id: "david",   name: "David",   thumb: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face&q=80" },
                    ].map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => setSelectedAvatarId(avatar.id)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 aspect-square ${
                          selectedAvatarId === avatar.id
                            ? "border-amber-400/80 shadow-lg shadow-amber-400/20 scale-105"
                            : "border-white/[0.06] hover:border-white/20 hover:scale-102"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={avatar.thumb}
                          alt={avatar.name}
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-1.5 transition-opacity duration-200 ${selectedAvatarId === avatar.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                          <span className="text-[10px] font-semibold text-white">{avatar.name}</span>
                        </div>
                        {selectedAvatarId === avatar.id && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/30 mt-3">Real professional presenters — authentic lip-sync quality</p>
                </div>

                {/* Format */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 block">Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: "landscape" as const, icon: Monitor, label: "16:9", desc: "YouTube / LinkedIn" },
                      { id: "portrait" as const, icon: Smartphone, label: "9:16", desc: "TikTok / Reels" },
                      { id: "square" as const, icon: Square, label: "1:1", desc: "Instagram" },
                    ]).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                          format === f.id
                            ? "border-amber-400/40 bg-amber-400/[0.06]"
                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                        }`}
                      >
                        <f.icon className={`w-4 h-4 mx-auto mb-1.5 transition-colors ${format === f.id ? "text-amber-400" : "text-white/30"}`} />
                        <div className={`text-xs font-semibold transition-colors ${format === f.id ? "text-white" : "text-white/40"}`}>{f.label}</div>
                        <div className="text-[10px] text-white/20 mt-0.5">{f.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate button or progress */}
                {generating ? (
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-8">
                    {/* Cinematic progress */}
                    <div className="text-center mb-8">
                      <div className="relative w-16 h-16 mx-auto mb-5">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-stone-500/20 to-stone-500/20 animate-pulse" />
                        <div className="relative w-full h-full rounded-2xl bg-zinc-900/80 flex items-center justify-center border border-white/[0.08]">
                          <Film className="w-7 h-7 text-stone-400" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-1 tracking-tight">Producing your video</h3>
                      <p className="text-sm text-white/30">{videoStatus || "Initializing pipeline..."}</p>
                    </div>

                    {/* Animated progress bar */}
                    <div className="relative h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-stone-500 via-stone-500 to-stone-500 rounded-full animate-pulse" style={{
                        width: (() => {
                          const s = videoStatus?.toLowerCase() || "";
                          if (s.includes("render") || s.includes("final")) return "85%";
                          if (s.includes("animat") || s.includes("lip")) return "65%";
                          if (s.includes("voice") || s.includes("speech")) return "40%";
                          if (s.includes("present") || s.includes("avatar") || s.includes("image") || s.includes("flux")) return "20%";
                          return "5%";
                        })(),
                        transition: "width 1.5s ease-in-out",
                      }} />
                    </div>

                    {/* Stage list */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Avatar", icon: ImageIcon, keywords: ["present", "avatar", "image", "flux"] },
                        { label: "Voice", icon: Mic, keywords: ["voice", "speech", "audio"] },
                        { label: "Lip Sync", icon: Film, keywords: ["animat", "lip", "omni", "sync"] },
                        { label: "Render", icon: Video, keywords: ["render", "final", "compos"] },
                      ].map((stage, i) => {
                        const stageStatus = videoStatus?.toLowerCase() || "";
                        const myKeywordActive = stage.keywords.some(k => stageStatus.includes(k));
                        // A stage is done if a LATER stage is active
                        const laterActive = [1,2,3].slice(i).some(j => {
                          const later = [
                            { label: "Avatar", keywords: ["present", "avatar", "image", "flux"] },
                            { label: "Voice", keywords: ["voice", "speech", "audio"] },
                            { label: "Lip Sync", keywords: ["animat", "lip", "omni", "sync"] },
                            { label: "Render", keywords: ["render", "final", "compos"] },
                          ][j];
                          return later && later.keywords.some(k => stageStatus.includes(k));
                        });
                        const isDone = laterActive && !myKeywordActive;
                        const isActive = myKeywordActive;
                        return (
                          <div key={stage.label} className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-500 ${
                            isDone ? "bg-stone-500/[0.06]" : isActive ? "bg-stone-500/[0.06]" : "bg-white/[0.01]"
                          }`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              isDone ? "bg-stone-500/15 text-stone-400" : isActive ? "bg-stone-500/15 text-stone-400" : "bg-white/[0.04] text-white/15"
                            }`}>
                              {isDone ? <Check className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <stage.icon className="w-4 h-4" />}
                            </div>
                            <span className={`text-[11px] font-medium transition-colors ${
                              isDone ? "text-stone-400" : isActive ? "text-stone-400" : "text-white/20"
                            }`}>{stage.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateVideo}
                    className="w-full py-5 rounded-full font-semibold text-[15px] transition-all duration-500 hover:-translate-y-0.5 flex items-center justify-center gap-2.5 group/gen"
                    style={{
                      background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                      color: "#0a1628",
                      boxShadow: "0 18px 48px -18px rgba(232,212,176,0.55)",
                    }}
                  >
                    <Sparkles className="w-5 h-5 group-hover/gen:rotate-12 transition-transform" /> Generate video
                  </button>
                )}
              </div>

              {/* Right: Preview area (2 cols) */}
              <div className="lg:col-span-2">
                <div className="sticky top-20">
                  {/* Cinema-style preview frame */}
                  <div className="rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-xl overflow-hidden aspect-video flex items-center justify-center relative">
                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
                    <div className="relative text-center p-6">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                        <Play className="w-5 h-5 text-white/15" />
                      </div>
                      <p className="text-xs text-white/20 font-medium">Video preview will appear here</p>
                    </div>
                  </div>
                  {/* Pipeline info */}
                  <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-[11px] text-white/30 space-y-1.5">
                      <div className="flex items-center justify-between"><span>FLUX avatar generation</span><span className="text-white/15">~15s</span></div>
                      <div className="flex items-center justify-between"><span>Fish Speech voiceover</span><span className="text-white/15">~10s</span></div>
                      <div className="flex items-center justify-between"><span>Lip sync animation</span><span className="text-white/15">~30s</span></div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04]">
                        <span className="font-semibold text-white/40">Total estimated</span>
                        <span className="font-semibold text-stone-400/70">~60-90s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ VIDEO RESULT ═══ */}
        {videoUrl && (
          <div className="max-w-3xl mx-auto pt-6">
            {/* Success badge */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.06] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E8D4B0] mb-5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#E8D4B0]/15">
                  <Check className="w-2.5 h-2.5" />
                </div>
                Production complete
              </div>
              <h2 className="fs-display-sm text-white">
                Your video is{" "}
                <span
                  className="font-normal"
                  style={{ fontFamily: "Fraunces, ui-serif, Georgia, serif", fontStyle: "italic", color: "#E8D4B0" }}
                >
                  ready.
                </span>
              </h2>
            </div>

            {/* Cinema-style video frame */}
            <div className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/50 bg-black/60 backdrop-blur-xl">
              {/* Top bar mimicking a player chrome */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-500/60" />
                  <span className="text-[11px] text-white/30 font-medium">zoobicon-video.mp4</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                </div>
              </div>
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <a
                href={videoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full py-4 text-[13px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                  color: "#0a1628",
                  boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                }}
              >
                <Download className="w-4 h-4" /> Download
              </a>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "Zoobicon Video", url: videoUrl ?? "" }).catch(() => {});
                  } else if (videoUrl) {
                    navigator.clipboard.writeText(videoUrl);
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] py-4 text-[13px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button
                onClick={handleStartOver}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] py-4 text-[13px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
              >
                <RefreshCw className="w-4 h-4" /> New video
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
