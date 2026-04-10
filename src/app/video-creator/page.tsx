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
  const [presenterGender, setPresenterGender] = useState<"female" | "male">("female");
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
          avatarDescription: presenterGender === "female"
            ? "Beautiful professional woman, mid-30s, warm confident smile, friendly expression, business casual attire, looking at camera"
            : "Professional man, mid-30s, confident smile, business casual attire, looking at camera",
          voiceGender: presenterGender,
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
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-stone-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-stone-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-500 to-stone-500 flex items-center justify-center shadow-lg shadow-stone-500/20 group-hover:shadow-stone-500/40 transition-shadow">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white tracking-tight">Zoobicon</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <span className="text-sm text-white/50 font-medium">Video Studio</span>
          </div>

          {/* Steps indicator - compact in nav */}
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
                  {i > 0 && <div className={`w-6 h-[1.5px] rounded-full transition-all duration-500 ${isCompleted || isActive ? "bg-gradient-to-r from-stone-500 to-stone-500" : "bg-white/[0.08]"}`} />}
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide transition-all duration-300 ${
                    isActive ? "bg-gradient-to-r from-stone-500/20 to-stone-500/20 text-white border border-stone-500/30" :
                    isCompleted ? "text-stone-400" :
                    "text-white/25"
                  }`}>
                    {isCompleted ? <Check className="w-3 h-3" /> : <span className="text-[10px] opacity-60">{s.num}</span>}
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/80 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] flex items-center gap-1.5 transition-all">
              <LayoutDashboard className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button onClick={handleLogout} className="text-xs text-white/40 hover:text-white/80 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-6">

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

        {/* ═══ STEP 1: DESCRIBE ═══ */}
        {step === "describe" && (
          <div className="flex flex-col items-center pt-12 sm:pt-20">
            {/* Hero area */}
            <div className="text-center mb-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/50 font-medium tracking-wide mb-6">
                <Sparkles className="w-3 h-3 text-stone-400" />
                AI-POWERED VIDEO STUDIO
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-[1.1] tracking-tight">
                <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">Create a video</span>
                <br />
                <span className="bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 bg-clip-text text-transparent">that converts</span>
              </h1>
              <p className="text-base sm:text-lg text-white/40 max-w-md mx-auto leading-relaxed">
                Describe your video. Our AI director writes the script, generates the voice, and produces your video.
              </p>
            </div>

            {/* Input area */}
            <div className="w-full max-w-2xl">
              <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl overflow-hidden transition-all focus-within:border-stone-500/30 focus-within:bg-white/[0.04] group">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerateScripts(); } }}
                  placeholder="Describe your video... e.g. A 30-second promo featuring an excited presenter explaining our AI website builder"
                  rows={4}
                  className="w-full px-5 py-4 bg-transparent text-white text-[15px] placeholder-white/20 focus:outline-none resize-none leading-relaxed"
                  autoFocus
                />
                <div className="flex items-center justify-between px-4 pb-3">
                  <div className="text-[11px] text-white/20 font-medium tracking-wide">
                    {description.length > 0 && <span>{description.length} chars</span>}
                  </div>
                  <button
                    onClick={handleGenerateScripts}
                    disabled={generatingScripts || description.trim().length < 10}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-stone-500/20 hover:shadow-stone-500/30"
                  >
                    {generatingScripts ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Writing scripts...</>
                    ) : (
                      <><Wand2 className="w-4 h-4" /> Generate Scripts</>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick prompt chips */}
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {[
                  { label: "Product Demo", prompt: "30-second product demo for Zoobicon showing the AI builder and domain search — professional, confident presenter" },
                  { label: "Testimonial", prompt: "Testimonial-style video about how AI is making web development accessible to everyone" },
                  { label: "Explainer", prompt: "Short explainer about Zoobicon for small business owners who need a website fast" },
                  { label: "Social Ad", prompt: "Product launch video for our free domain search tool — energetic, hook-first opening for social media" },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => setDescription(chip.prompt)}
                    className="group/chip flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] text-xs text-white/40 font-medium hover:text-white/80 hover:border-stone-500/30 hover:bg-stone-500/[0.06] transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-white/20 group-hover/chip:text-stone-400 transition-colors" />
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Bottom feature badges */}
              <div className="flex items-center justify-center gap-6 mt-10 text-[11px] text-white/20 font-medium tracking-wide">
                <span className="flex items-center gap-1.5"><Mic className="w-3 h-3" /> AI Voice</span>
                <span className="flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> AI Avatar</span>
                <span className="flex items-center gap-1.5"><Film className="w-3 h-3" /> Lip Sync</span>
                <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Auto-Edit</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: PICK SCRIPT ═══ */}
        {step === "scripts" && (
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <button onClick={() => setStep("describe")} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-3">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <h2 className="text-2xl font-bold tracking-tight">Choose your script</h2>
                <p className="text-sm text-white/30 mt-1">Our AI director wrote two approaches. Pick one and refine it.</p>
              </div>
            </div>

            {/* Script cards */}
            <div className="grid gap-4 mb-6">
              {scripts.map((script, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectScript(i)}
                  className={`relative p-6 rounded-2xl border text-left transition-all duration-300 group/script ${
                    selectedScript === i
                      ? "border-stone-500/40 bg-stone-500/[0.06] backdrop-blur-xl"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] backdrop-blur-xl"
                  }`}
                >
                  {/* Gradient top edge when selected */}
                  {selectedScript === i && (
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-stone-500 via-stone-500 to-stone-500 rounded-t-2xl" />
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                        selectedScript === i ? "bg-gradient-to-br from-stone-500 to-stone-500 text-white" : "bg-white/[0.06] text-white/40"
                      }`}>
                        {i + 1}
                      </div>
                      <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${selectedScript === i ? "text-stone-400" : "text-white/30"}`}>
                        {i === 0 ? "Direct Approach" : "Creative Approach"}
                      </span>
                    </div>
                    {selectedScript === i && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-500/15 text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
                        <Check className="w-3 h-3" /> Selected
                      </div>
                    )}
                  </div>
                  <div className="text-[14px] text-white/60 leading-relaxed whitespace-pre-wrap group-hover/script:text-white/70 transition-colors">{script}</div>
                </button>
              ))}
            </div>

            {/* Edit + proceed */}
            {selectedScript !== null && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Refine your script</label>
                  <span className="text-[11px] text-white/20">{editedScript.length} chars</span>
                </div>
                <textarea
                  value={editedScript}
                  onChange={(e) => setEditedScript(e.target.value)}
                  rows={6}
                  className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white/80 text-[14px] focus:outline-none focus:border-stone-500/30 focus:bg-white/[0.04] resize-none leading-relaxed transition-all backdrop-blur-xl"
                />
                <button
                  onClick={handleProceedToProduction}
                  className="w-full py-4 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-stone-500/20 hover:shadow-xl hover:shadow-stone-500/30"
                >
                  Continue to Production <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 3: PRODUCE ═══ */}
        {step === "produce" && !videoUrl && (
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <button onClick={() => setStep("scripts")} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-3">
                  <ArrowLeft className="w-3 h-3" /> Back to scripts
                </button>
                <h2 className="text-2xl font-bold tracking-tight">Production settings</h2>
                <p className="text-sm text-white/30 mt-1">Configure your presenter and format, then generate.</p>
              </div>
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

                {/* Presenter + Format row */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Presenter */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 block">Presenter</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPresenterGender("female")}
                        className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                          presenterGender === "female"
                            ? "border-stone-500/40 bg-stone-500/[0.08]"
                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                        }`}
                      >
                        <div className={`text-sm font-semibold transition-colors ${presenterGender === "female" ? "text-white" : "text-white/50"}`}>Female</div>
                        <div className="text-[11px] text-white/25 mt-0.5">Warm, professional</div>
                      </button>
                      <button
                        onClick={() => setPresenterGender("male")}
                        className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                          presenterGender === "male"
                            ? "border-stone-500/40 bg-stone-500/[0.08]"
                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                        }`}
                      >
                        <div className={`text-sm font-semibold transition-colors ${presenterGender === "male" ? "text-white" : "text-white/50"}`}>Male</div>
                        <div className="text-[11px] text-white/25 mt-0.5">Confident, clear</div>
                      </button>
                    </div>
                  </div>

                  {/* Format */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 block">Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: "landscape" as const, icon: Monitor, label: "16:9" },
                        { id: "portrait" as const, icon: Smartphone, label: "9:16" },
                        { id: "square" as const, icon: Square, label: "1:1" },
                      ]).map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFormat(f.id)}
                          className={`p-2.5 rounded-xl border text-center transition-all duration-300 ${
                            format === f.id
                              ? "border-stone-500/40 bg-stone-500/[0.08]"
                              : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                          }`}
                        >
                          <f.icon className={`w-4 h-4 mx-auto mb-1 transition-colors ${format === f.id ? "text-stone-400" : "text-white/30"}`} />
                          <div className={`text-[11px] font-medium transition-colors ${format === f.id ? "text-white/80" : "text-white/30"}`}>{f.label}</div>
                        </button>
                      ))}
                    </div>
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
                    className="w-full py-4 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-stone-500/20 hover:shadow-2xl hover:shadow-stone-500/30 group/gen"
                  >
                    <Sparkles className="w-5 h-5 group-hover/gen:rotate-12 transition-transform" /> Generate Video
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
          <div className="max-w-3xl mx-auto pt-4">
            {/* Success badge */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-500/[0.06] border border-stone-500/20 text-stone-400 text-xs font-semibold uppercase tracking-wider mb-4">
                <div className="w-4 h-4 rounded-full bg-stone-500/15 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                Production complete
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Your video is ready</h2>
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
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <a
                href={videoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 text-white font-semibold text-sm transition-all shadow-lg shadow-stone-500/20"
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
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.04] text-sm font-medium transition-all backdrop-blur-xl"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button
                onClick={handleStartOver}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.04] text-sm font-medium transition-all backdrop-blur-xl"
              >
                <RefreshCw className="w-4 h-4" /> New Video
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
