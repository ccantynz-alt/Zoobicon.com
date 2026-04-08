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
  { id: "bold-dynamic", label: "Bold / Dynamic", icon: Sparkles, color: "from-red-500 to-orange-500" },
  { id: "elegant-luxury", label: "Elegant / Luxury", icon: Crown, color: "from-amber-400 to-yellow-600" },
  { id: "fun-playful", label: "Fun / Playful", icon: Smile, color: "from-violet-500 to-indigo-500" },
  { id: "corporate-professional", label: "Corporate / Professional", icon: Building2, color: "from-blue-500 to-indigo-600" },
  { id: "cinematic", label: "Cinematic", icon: Clapperboard, color: "from-emerald-500 to-teal-600" },
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
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Nav */}
      <nav className="border-b border-amber-500/[0.08] bg-[#0a0a14]/95 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Video className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Zoobicon</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-amber-500/30" />
            <span className="text-sm text-amber-200/70 font-medium">AI Video Creator</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="text-xs text-white/50 hover:text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/5 flex items-center gap-1.5 transition-colors">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <button onClick={handleLogout} className="text-xs text-white/50 hover:text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/5 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Steps indicator */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="flex items-center gap-2">
          {[
            { key: "describe", label: "1. Describe", icon: Sparkles },
            { key: "scripts", label: "2. Pick Script", icon: Bot },
            { key: "produce", label: "3. Generate Video", icon: Video },
          ].map((s, i) => {
            const isActive = step === s.key;
            const isCompleted = (s.key === "describe" && step !== "describe") || (s.key === "scripts" && step === "produce");
            const isReachable = isActive || isCompleted;
            return (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && <div className={`w-10 h-[2px] rounded-full transition-all ${isReachable ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-white/[0.08]"}`} />}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  isActive ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25" :
                  isCompleted ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20" :
                  "bg-white/[0.04] text-white/30 ring-1 ring-white/[0.06]"
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.label.split(". ")[0]}.</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">

        {/* Error display */}
        {videoError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/[0.08] border border-red-500/20 backdrop-blur-sm flex items-start gap-3 shadow-lg shadow-red-500/5">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4.5 h-4.5 text-red-400" />
            </div>
            <div className="pt-1 flex-1">
              <div className="text-sm font-semibold text-red-300">Something went wrong</div>
              <div className="text-sm text-red-400/70 mt-1 leading-relaxed">{videoError}</div>
              <div className="flex items-center gap-3 mt-3">
                {step === "produce" && editedScript && (
                  <button
                    onClick={() => { setVideoError(""); handleGenerateVideo(); }}
                    className="text-xs font-semibold text-amber-300 hover:text-amber-200 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                )}
                <button onClick={() => setVideoError("")} className="text-xs text-red-400/50 hover:text-red-300 transition-colors">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 1: DESCRIBE ═══ */}
        {step === "describe" && (
          <div className="space-y-6">
            <div className="text-center pt-8 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/20">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">What video do you want to create?</h1>
              <p className="text-lg text-slate-400 max-w-md mx-auto">
                Describe it in plain English. We&apos;ll write the script and generate a professional AI spokesperson video.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerateScripts(); } }}
                placeholder="e.g. A 30-second promo video for Zoobicon featuring an excited female presenter explaining our AI website builder and domain search tools..."
                rows={4}
                className="w-full px-5 py-4 bg-white/[0.05] border border-white/[0.10] rounded-2xl text-white text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 resize-none transition-all"
                autoFocus
              />

              <button
                onClick={handleGenerateScripts}
                disabled={generatingScripts || description.trim().length < 10}
                className="w-full mt-4 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-2xl font-bold text-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
              >
                {generatingScripts ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Writing scripts...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Write 2 Script Options</>
                )}
              </button>

              {/* Quick suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                {[
                  "30-second promo for Zoobicon — excited female presenter showing off the AI builder and domain search",
                  "Product launch video for our free domain search tool — professional, confident tone",
                  "Short explainer about Zoobicon for small business owners who need a website fast",
                  "Testimonial-style video about how AI is making web development accessible to everyone",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setDescription(suggestion)}
                    className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-left text-sm text-slate-400 hover:text-white hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: PICK SCRIPT ═══ */}
        {step === "scripts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Pick your script</h2>
                <p className="text-sm text-slate-400 mt-1">Select one, edit it if needed, then proceed.</p>
              </div>
              <button onClick={() => setStep("describe")} className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                &larr; Back
              </button>
            </div>

            <div className="grid gap-4">
              {scripts.map((script, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectScript(i)}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    selectedScript === i
                      ? "border-amber-500/40 bg-amber-500/[0.08] ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/5"
                      : "border-white/[0.08] bg-white/[0.03] hover:border-amber-500/20 hover:bg-amber-500/[0.03]"
                  }`}
                >
                  <div className="text-xs font-semibold text-amber-400 mb-2">Draft {i + 1}</div>
                  <div className="text-[15px] text-slate-300 leading-relaxed whitespace-pre-wrap">{script}</div>
                </button>
              ))}
            </div>

            {selectedScript !== null && (
              <div className="space-y-4">
                <label className="text-sm font-semibold text-white/70">Edit your script (optional)</label>
                <textarea
                  value={editedScript}
                  onChange={(e) => setEditedScript(e.target.value)}
                  rows={6}
                  className="w-full px-5 py-4 bg-white/[0.05] border border-white/[0.10] rounded-2xl text-white text-[15px] focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 resize-none leading-relaxed transition-all"
                />
                <button
                  onClick={handleProceedToProduction}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
                >
                  <Play className="w-5 h-5" /> Proceed to Generate Video
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 3: PRODUCE ═══ */}
        {step === "produce" && !videoUrl && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Generate your video</h2>
                <p className="text-sm text-slate-400 mt-1">Choose your presenter style, then hit generate.</p>
              </div>
              <button onClick={() => setStep("scripts")} className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                &larr; Back to scripts
              </button>
            </div>

            {/* Script preview */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-amber-500/10">
              <div className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2">Your Script</div>
              <div className="text-[15px] text-slate-300 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">{editedScript}</div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Presenter gender */}
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3 block">Presenter</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPresenterGender("female")}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      presenterGender === "female"
                        ? "border-pink-500/50 bg-pink-500/10 ring-1 ring-pink-500/20"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="text-base font-semibold">Female</div>
                    <div className="text-xs text-slate-500">Warm, professional</div>
                  </button>
                  <button
                    onClick={() => setPresenterGender("male")}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      presenterGender === "male"
                        ? "border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/20"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="text-base font-semibold">Male</div>
                    <div className="text-xs text-slate-500">Confident, clear</div>
                  </button>
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3 block">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "landscape" as const, icon: Monitor, label: "16:9" },
                    { id: "portrait" as const, icon: Smartphone, label: "9:16" },
                    { id: "square" as const, icon: Square, label: "1:1" },
                  ]).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        format === f.id
                          ? "border-amber-500/40 bg-amber-500/10 shadow-sm shadow-amber-500/10"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-amber-500/20"
                      }`}
                    >
                      <f.icon className="w-5 h-5 mx-auto mb-1 text-white/60" />
                      <div className="text-xs text-white/60">{f.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3 block">Pipeline</label>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-amber-500/[0.08] text-xs text-slate-500 space-y-1.5">
                  <div>1. FLUX generates your presenter</div>
                  <div>2. Fish Speech creates the voice</div>
                  <div>3. OmniHuman animates the face</div>
                  <div className="text-amber-400 font-medium pt-1">~60-90 seconds total</div>
                </div>
              </div>
            </div>

            {generating ? (
              <div className="rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10 p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 mx-auto mb-4 flex items-center justify-center shadow-xl shadow-amber-500/30">
                    <Video className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Generating your video</h3>
                  <p className="text-sm text-amber-400/70">{videoStatus || "Starting pipeline..."}</p>
                </div>
                <div className="space-y-3 max-w-sm mx-auto">
                  {["FLUX generates presenter", "AI creates voiceover", "OmniHuman animates face", "Final rendering"].map((stage, i) => {
                    const stageStatus = videoStatus?.toLowerCase() || "";
                    const isDone = (i === 0 && stageStatus.includes("voice")) || (i === 1 && stageStatus.includes("animat")) || (i === 2 && stageStatus.includes("render"));
                    const isActive = !isDone && ((i === 0 && stageStatus.includes("present")) || (i === 1 && stageStatus.includes("voice")) || (i === 2 && stageStatus.includes("animat")) || (i === 3 && stageStatus.includes("render")));
                    return (
                      <div key={stage} className={`flex items-center gap-3 text-sm ${isDone ? "text-emerald-400" : isActive ? "text-amber-400" : "text-white/20"}`}>
                        {isDone ? <Check className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border border-white/10" />}
                        {stage}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerateVideo}
                className="w-full py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-500/30"
              >
                <Sparkles className="w-6 h-6" /> Generate Video
              </button>
            )}
          </div>
        )}

        {/* ═══ VIDEO RESULT ═══ */}
        {videoUrl && (
          <div className="space-y-6 pt-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-base mb-6">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
                Your video is ready!
              </div>
            </div>

            <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/40 bg-black/40">
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <a
                href={videoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-semibold transition-all shadow-lg shadow-amber-500/20"
              >
                <Download className="w-4 h-4" /> Download Video
              </a>
              <button
                onClick={handleStartOver}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/[0.10] text-white/70 hover:text-white hover:bg-white/[0.05] transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
