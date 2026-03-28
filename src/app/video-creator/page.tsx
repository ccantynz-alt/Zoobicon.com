"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import SocialPublishPanel from "@/components/SocialPublishPanel";
import VideoSeriesPanel from "@/components/VideoSeriesPanel";
import type { VideoSeriesEpisode } from "@/lib/video-social-publish";
import {
  Video,
  Sparkles,
  Play,
  Clock,
  Type,
  Music,
  Palette,
  Image,
  Download,
  FileJson,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Loader2,
  Trash2,
  Eye,
  Film,
  Megaphone,
  BookOpen,
  MessageSquareQuote,
  Briefcase,
  GraduationCap,
  Zap,
  Crown,
  Gem,
  Smile,
  Building2,
  Clapperboard,
  Monitor,
  Smartphone,
  Square,
  History,
  X,
  Check,
  ArrowRight,
  Mic,
  MicOff,
  ImagePlus,
  Subtitles,
  Wand2,
  LayoutTemplate,
  Volume2,
  FileText,
  Settings2,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  RefreshCw,
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
  { id: "social-ad", label: "Social Media Ad", icon: Megaphone, desc: "Eye-catching ads for social platforms" },
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
  { id: "instagram-reels", label: "Instagram Reels", aspect: "9:16", icon: Smartphone },
  { id: "youtube", label: "YouTube", aspect: "16:9", icon: Monitor },
  { id: "linkedin", label: "LinkedIn", aspect: "16:9", icon: Monitor },
  { id: "twitter", label: "Twitter / X", aspect: "1:1", icon: Square },
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
  const [user, setUser] = useState<{ email: string; name?: string; plan?: string; role?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasVideoAddon, setHasVideoAddon] = useState(false);

  // Form state
  const [projectType, setProjectType] = useState("social-ad");
  const [script, setScript] = useState("");
  const [style, setStyle] = useState("modern-minimalist");
  const [platform, setPlatform] = useState("tiktok");
  const [duration, setDuration] = useState(30);
  const [music, setMusic] = useState("upbeat");
  const [brandColors, setBrandColors] = useState(["#06b6d4", "#2563eb"]);
  const [brandFont, setBrandFont] = useState("Inter");

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);

  const [recognition, setRecognition] = useState<any>(null);

  const toggleVoiceInput = useCallback(() => {
    if (isRecording && recognition) {
      recognition.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognitionCtor =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }

  
    const recog = new (SpeechRecognitionCtor as any)();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";

    let finalTranscript = "";

  
    recog.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t + " ";
        } else {
          interim = t;
        }
      }
      setScript((prev: string) => {
        const base = prev.replace(/\u200B.*$/, "").trimEnd();
        const combined = base ? base + " " + finalTranscript : finalTranscript;
        return interim ? combined + "\u200B" + interim : combined.trimEnd();
      });
    };

    recog.onerror = () => {
      setIsRecording(false);
    };

    recog.onend = () => {
      setIsRecording(false);
      setScript((prev: string) => prev.replace(/\u200B/g, "").trimEnd());
    };

    recog.start();
    setRecognition(recog);
    setIsRecording(true);
  }, [isRecording, recognition]);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [error, setError] = useState("");

  // Pipeline state
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");
  const [capabilities, setCapabilities] = useState<PipelineCapabilities | null>(null);
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([]);
  const [renderProgress, setRenderProgress] = useState(0);
  const [sceneImages, setSceneImages] = useState<{ sceneNumber: number; imageUrl: string }[]>([]);
  const [voiceoverUrl, setVoiceoverUrl] = useState<string | null>(null);
  const [voicePresets, setVoicePresets] = useState<VoicePreset[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("rachel");
  const [subtitleData, setSubtitleData] = useState<{ srt: string; vtt: string } | null>(null);
  const [showPipeline, setShowPipeline] = useState(false);
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [fullPipelineProgress, setFullPipelineProgress] = useState<FullPipelineProgress | null>(null);

  // Project history
  const [projects, setProjects] = useState<Project[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeScene, setActiveScene] = useState(0);

  // Quota / usage state
  const [quota, setQuota] = useState<{
    videos: { used: number; limit: number; pct: number; overage: number };
    images: { used: number; limit: number; pct: number; overage: number };
    renders: { used: number; limit: number; pct: number; overage: number };
    voiceovers: { used: number; limit: number; pct: number; overage: number };
  } | null>(null);
  const [overagePacks, setOveragePacks] = useState<{ id: string; name: string; price: number; priceDisplay: string; videos: number; savings?: string }[]>([]);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [buyingCredits, setBuyingCredits] = useState(false);

  // TikTok connection state
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [tiktokUser, setTiktokUser] = useState<{ display_name: string; avatar_url: string } | null>(null);
  const [tiktokUploading, setTiktokUploading] = useState(false);
  const [tiktokStatus, setTiktokStatus] = useState("");

  // HeyGen AI Spokesperson state
  const [showSpokesperson, setShowSpokesperson] = useState(false);
  const [spokespersonAvatarId, setSpokespersonAvatarId] = useState("Angela-inTshirt-20220820");
  const [spokespersonVoiceId, setSpokespersonVoiceId] = useState("");
  const [spokespersonFormat, setSpokespersonFormat] = useState<"portrait" | "landscape" | "square">("portrait");
  const [spokespersonBg, setSpokespersonBg] = useState("#1a1a2e");
  const [spokespersonGenerating, setSpokespersonGenerating] = useState(false);
  const [spokespersonVideoId, setSpokespersonVideoId] = useState<string | null>(null);
  const [spokespersonVideoUrl, setSpokespersonVideoUrl] = useState<string | null>(null);
  const [spokespersonStatus, setSpokespersonStatus] = useState<string | null>(null);
  const [spokespersonError, setSpokespersonError] = useState("");
  const [heygenAvailable, setHeygenAvailable] = useState<boolean | null>(null);
  const [heygenAvatars, setHeygenAvatars] = useState<{ id: string; name: string; gender: string; style: string; description: string }[]>([]);
  const [heygenVoices, setHeygenVoices] = useState<{ voice_id: string; name: string; gender: string }[]>([]);

  // Auth check + addon/plan check
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);

        // Check if user has video addon OR is on a paid plan
        const installedAddons = localStorage.getItem("zoobicon_installed_addons");
        const addons: string[] = installedAddons ? JSON.parse(installedAddons) : [];
        const isPaidPlan = parsed.plan === "unlimited" || parsed.plan === "pro" || parsed.plan === "agency" || parsed.plan === "enterprise";
        const isAdmin = parsed.role === "admin";
        const hasAddon = addons.includes("ai-video-creator");
        setHasVideoAddon(hasAddon || isPaidPlan || isAdmin);
      } else {
        router.push("/auth/login");
        return;
      }
    } catch {
      router.push("/auth/login");
      return;
    }
    setAuthChecked(true);

    // Check for existing TikTok connection in localStorage
    try {
      const storedTiktok = localStorage.getItem("zoobicon_tiktok");
      if (storedTiktok) {
        const parsed = JSON.parse(storedTiktok);
        if (parsed.access_token && new Date(parsed.connected_at).getTime() + (parsed.expires_in || 86400) * 1000 > Date.now()) {
          setTiktokConnected(true);
          setTiktokUser({ display_name: parsed.display_name, avatar_url: parsed.avatar_url });
        } else {
          localStorage.removeItem("zoobicon_tiktok");
        }
      }
    } catch { /* ignore */ }

    // Handle TikTok OAuth callback (token in URL fragment)
    if (window.location.hash.includes("tiktok_token=")) {
      try {
        const encoded = window.location.hash.split("tiktok_token=")[1];
        const decoded = JSON.parse(atob(encoded));
        localStorage.setItem("zoobicon_tiktok", JSON.stringify(decoded));
        setTiktokConnected(true);
        setTiktokUser({ display_name: decoded.display_name, avatar_url: decoded.avatar_url });
        // Clean up URL
        window.history.replaceState(null, "", window.location.pathname);
      } catch { /* ignore */ }
    }

    // Handle TikTok OAuth error
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("tiktok_error")) {
      setError(`TikTok connection failed: ${urlParams.get("tiktok_error")}`);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [router]);

  // Helper: get quota fields to include in API request bodies
  const getQuotaFields = () => {
    if (!user) return {};
    const installedAddons = localStorage.getItem("zoobicon_installed_addons");
    const addons: string[] = installedAddons ? JSON.parse(installedAddons) : [];
    return {
      email: user.email,
      plan: user.plan || "free",
      hasAddon: addons.includes("ai-video-creator"),
    };
  };

  // Fetch usage quota from server
  const fetchQuota = useCallback(async () => {
    if (!user?.email) return;
    try {
      const installedAddons = localStorage.getItem("zoobicon_installed_addons");
      const addons: string[] = installedAddons ? JSON.parse(installedAddons) : [];
      const hasAddon = addons.includes("ai-video-creator");
      const params = new URLSearchParams({
        email: user.email,
        plan: user.plan || "free",
        addon: hasAddon ? "true" : "false",
        scenes: storyboard ? String(storyboard.storyboard.length) : "6",
      });
      const res = await fetch(`/api/video-creator/quota?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.usage) setQuota(data.usage);
        if (data.overagePacks) setOveragePacks(data.overagePacks);
      }
    } catch { /* ignore */ }
  }, [user, storyboard]);

  // Fetch quota on auth and after pipeline actions
  useEffect(() => {
    if (user?.email && hasVideoAddon) fetchQuota();
  }, [user, hasVideoAddon, fetchQuota]);

  // Load project history
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_video_projects");
      if (stored) setProjects(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Load pipeline capabilities and templates
  useEffect(() => {
    fetch("/api/video-creator/assembly")
      .then((r) => r.json())
      .then((d) => { if (d.capabilities) setCapabilities(d.capabilities); })
      .catch(() => {});
    fetch("/api/video-creator/voiceover")
      .then((r) => r.json())
      .then((d) => { if (d.voices) setVoicePresets(d.voices); })
      .catch(() => {});
    fetch("/api/video-creator/templates")
      .then((r) => r.json())
      .then((d) => { if (d.templates) setTemplates(d.templates); })
      .catch(() => {});
    // Check HeyGen availability + load presets
    fetch("/api/video-creator/heygen")
      .then((r) => r.json())
      .then((d) => {
        setHeygenAvailable(d.available ?? false);
        if (d.presets) setHeygenAvatars(d.presets);
      })
      .catch(() => setHeygenAvailable(false));
  }, []);

  // --- HeyGen Spokesperson Handlers ---
  const handleSpokespersonGenerate = useCallback(async () => {
    if (!script.trim()) { setSpokespersonError("Write a script first."); return; }
    if (!spokespersonAvatarId) { setSpokespersonError("Select a presenter."); return; }

    setSpokespersonGenerating(true);
    setSpokespersonError("");
    setSpokespersonVideoUrl(null);
    setSpokespersonVideoId(null);
    setSpokespersonStatus("starting");

    try {
      const res = await fetch("/api/video-creator/heygen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: script.trim(),
          avatarId: spokespersonAvatarId,
          voiceId: spokespersonVoiceId || "1bd001e7e50f421d891986aad5158bc8", // default HeyGen voice
          background: { type: "color", value: spokespersonBg },
          format: spokespersonFormat,
          caption: true,
          test: false,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSpokespersonError(data.error || "Failed to start video generation.");
        setSpokespersonGenerating(false);
        setSpokespersonStatus(null);
        return;
      }

      setSpokespersonVideoId(data.videoId);
      setSpokespersonStatus("processing");

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/video-creator/heygen?action=status&videoId=${data.videoId}`);
          const statusData = await statusRes.json();

          if (statusData.status === "completed" && statusData.videoUrl) {
            clearInterval(pollInterval);
            setSpokespersonVideoUrl(statusData.videoUrl);
            setSpokespersonStatus("completed");
            setSpokespersonGenerating(false);
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval);
            setSpokespersonError(statusData.error || "Video generation failed.");
            setSpokespersonStatus("failed");
            setSpokespersonGenerating(false);
          }
          // else still processing — keep polling
        } catch {
          // Network error — keep polling
        }
      }, 5000); // Check every 5 seconds

      // Safety timeout — stop polling after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (spokespersonStatus === "processing") {
          setSpokespersonError("Video is taking longer than expected. Check back in a few minutes.");
          setSpokespersonGenerating(false);
        }
      }, 600000);
    } catch {
      setSpokespersonError("Failed to generate video. Please try again.");
      setSpokespersonGenerating(false);
      setSpokespersonStatus(null);
    }
  }, [script, spokespersonAvatarId, spokespersonVoiceId, spokespersonBg, spokespersonFormat, spokespersonStatus]);

  const loadHeygenVoices = useCallback(async () => {
    if (heygenVoices.length > 0) return;
    try {
      const res = await fetch("/api/video-creator/heygen?action=voices");
      const data = await res.json();
      if (data.voices) setHeygenVoices(data.voices);
    } catch { /* ignore */ }
  }, [heygenVoices.length]);

  const saveProject = useCallback((sb: Storyboard) => {
    const project: Project = {
      id: Date.now().toString(36),
      name: `${PROJECT_TYPES.find((t) => t.id === projectType)?.label || "Video"} - ${PLATFORMS.find((p) => p.id === platform)?.label || ""}`,
      createdAt: new Date().toISOString(),
      projectType,
      platform,
      storyboard: sb,
    };
    const updated = [project, ...projects].slice(0, 20);
    setProjects(updated);
    try {
      localStorage.setItem("zoobicon_video_projects", JSON.stringify(updated));
    } catch { /* quota */ }
  }, [projects, projectType, platform]);

  const deleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    try {
      localStorage.setItem("zoobicon_video_projects", JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const loadProject = (project: Project) => {
    if (project.storyboard) {
      setStoryboard(project.storyboard);
      setProjectType(project.projectType);
      setPlatform(project.platform);
      setScript(project.storyboard.script);
      setShowHistory(false);
      setActiveScene(0);
    }
  };

  // Load a series episode into the video creator
  const handleLoadSeriesEpisode = useCallback((episode: VideoSeriesEpisode, seriesName: string) => {
    if (episode.script) {
      setScript(episode.script);
    }
    // Scroll to the script textarea area
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Generate script with AI
  const handleGenerateScript = async () => {
    setGeneratingScript(true);
    setError("");
    try {
      const res = await fetch("/api/video-creator/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectType,
          topic: script || "a compelling video",
          targetAudience: "general audience",
          tone: style.includes("corporate") ? "professional" : style.includes("fun") ? "casual and energetic" : "engaging",
          duration: `${duration}s`,
          keyPoints: [],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate script");
      }
      const data = await res.json();
      setScript(data.script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Script generation failed");
    } finally {
      setGeneratingScript(false);
    }
  };

  // Generate storyboard
  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setStoryboard(null);
    try {
      const res = await fetch("/api/video-creator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectType,
          script,
          style,
          platform,
          duration,
          music,
          brandSettings: {
            colors: brandColors,
            font: brandFont,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Map specific error codes to clear messages
        if (res.status === 503) {
          throw new Error("AI service is temporarily unavailable. Please try again in a moment.");
        }
        throw new Error(data.error || "Storyboard generation failed. Please try again.");
      }
      let data: Storyboard;
      try {
        data = await res.json();
      } catch {
        throw new Error("Storyboard generation failed. Please try again.");
      }
      if (!data.storyboard || !Array.isArray(data.storyboard) || data.storyboard.length === 0) {
        throw new Error("Storyboard generation failed. Please try again.");
      }
      setStoryboard(data);
      setActiveScene(0);
      if (!script && data.script) setScript(data.script);
      saveProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Storyboard generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // --- Buy more credits ---
  const handleBuyCredits = async (packId: string) => {
    if (!user?.email) return;
    setBuyingCredits(true);
    try {
      const res = await fetch("/api/video-creator/overage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, packId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to start checkout");
      }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to purchase credits");
    } finally {
      setBuyingCredits(false);
    }
  };

  // Handle returning from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("credits") === "purchased") {
      // Refresh quota to show new credits
      fetchQuota();
      // Clean URL
      window.history.replaceState({}, "", "/video-creator");
    }
  }, [fetchQuota]);

  // --- Pipeline: Access check ---
  const requireVideoAddon = (): boolean => {
    if (hasVideoAddon) return true;
    setError("Video pipeline requires the AI Video Creator add-on or a paid plan. Visit the Marketplace to purchase.");
    return false;
  };

  // --- Pipeline: Generate Scene Images ---
  const handleGenerateImages = async () => {
    if (!requireVideoAddon()) return;
    if (!storyboard) return;
    setPipelineStage("images");
    setError("");
    try {
      const scenes = storyboard.storyboard.map((s) => ({
        sceneNumber: s.sceneNumber,
        visualDescription: s.visualDescription,
        colorPalette: s.colorPalette,
        style,
        platform,
        textOverlay: s.textOverlay,
      }));
      const res = await fetch("/api/video-creator/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenes, ...getQuotaFields() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Image generation failed");
      }
      const data = await res.json();
      setSceneImages(data.images || []);
      setPipelineStage("idle");
      fetchQuota(); // Refresh usage
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation failed");
      setPipelineStage("idle");
    }
  };

  // --- Pipeline: Start Video Render ---
  const handleStartRender = async () => {
    if (!requireVideoAddon()) return;
    if (!storyboard) return;
    setPipelineStage("video");
    setError("");
    setRenderJobs([]);
    setRenderProgress(0);
    try {
      const imageMap = new Map(sceneImages.map((i) => [i.sceneNumber, i.imageUrl]));
      const scenes = storyboard.storyboard
        .map((s) => ({
          sceneNumber: s.sceneNumber,
          duration: s.duration,
          visualDescription: s.visualDescription,
          textOverlay: s.textOverlay,
          colorPalette: s.colorPalette,
          cameraMovement: s.cameraMovement,
          imageUrl: imageMap.get(s.sceneNumber),
        }))
        .filter((s) => s.imageUrl && s.imageUrl.startsWith("http"));

      if (scenes.length === 0) {
        throw new Error("Generate scene images first — video rendering requires images for each scene.");
        return;
      }

      const missingCount = storyboard.storyboard.length - scenes.length;
      if (missingCount > 0) {
        setError(`${missingCount} scene(s) skipped — no images. Rendering ${scenes.length} scene(s) that have images.`);
      }

      const res = await fetch("/api/video-creator/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes,
          style,
          platform,
          provider: selectedProvider || undefined,
          ...getQuotaFields(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (res.status === 503) {
          throw new Error("Video rendering is not available yet. Your storyboard, images, voiceover, and subtitles are ready — video rendering via Runway/Luma/Pika is coming soon.");
        }
        throw new Error(d.error || "Render failed");
      }
      const data = await res.json();

      // Check if all jobs failed immediately (provider misconfigured)
      const allFailed = data.jobs?.length > 0 && data.jobs.every((j: RenderJob) => j.status === "failed");
      if (allFailed || data.error) {
        setRenderJobs(data.jobs || []);
        throw new Error("Video rendering is not yet available. Your images, voiceover, and subtitles are still ready.");
      }

      setRenderJobs(data.jobs || []);
      // Start polling only if some jobs are pending/processing
      const pendingJobs = (data.jobs || []).filter((j: RenderJob) => j.status !== "failed");
      if (pendingJobs.length > 0) {
        pollRenderStatus(data.jobs || []);
      } else {
        setPipelineStage("idle");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Render failed");
      setPipelineStage("idle");
    }
  };

  const pollRenderStatus = async (jobs: RenderJob[]) => {
    let attempts = 0;
    const maxAttempts = 120; // 10 min max
    const poll = async () => {
      if (attempts++ > maxAttempts) {
        setPipelineStage("idle");
        return;
      }
      try {
        const res = await fetch("/api/video-creator/render", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobs }),
        });
        if (res.ok) {
          const data = await res.json();
          setRenderJobs(data.jobs);
          setRenderProgress(data.progress || 0);
          jobs = data.jobs;
          if (data.status === "completed" || data.status === "failed") {
            setPipelineStage("idle");
            fetchQuota(); // Refresh usage
            return;
          }
        }
      } catch { /* retry */ }
      setTimeout(poll, 5000);
    };
    setTimeout(poll, 5000);
  };

  // --- Pipeline: Generate Voiceover ---
  const handleGenerateVoiceover = async () => {
    if (!requireVideoAddon()) return;
    if (!storyboard) return;
    setPipelineStage("voiceover");
    setError("");
    try {
      const res = await fetch("/api/video-creator/voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: storyboard.script,
          voiceId: selectedVoice,
          mode: "full",
          ...getQuotaFields(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Voiceover generation failed");
      }
      const data = await res.json();
      if (data.provider === "browser" && !data.audioUrl) {
        // AI voice fell back to browser TTS
        if (data.fallbackReason) {
          setError("Using browser preview voice. Premium AI voices will be available shortly.");
        }
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(storyboard.script);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
          setVoiceoverUrl("browser-tts");
        } else {
          setError("Browser does not support text-to-speech.");
        }
      } else {
        setVoiceoverUrl(data.audioUrl || null);
      }
      setPipelineStage("idle");
      fetchQuota(); // Refresh usage
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voiceover generation failed");
      setPipelineStage("idle");
    }
  };

  // --- Pipeline: Generate Subtitles (no addon required — pure text processing) ---
  const handleGenerateSubtitles = async () => {
    if (!storyboard) return;
    setPipelineStage("subtitles");
    setError("");
    try {
      const res = await fetch("/api/video-creator/subtitles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: storyboard.script,
          totalDuration: parseInt(storyboard.totalDuration) || duration,
          format: "both",
          captionPreset: platform.includes("tiktok") ? "tiktok-bold" : "youtube-standard",
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Subtitle generation failed");
      }
      const data = await res.json();
      setSubtitleData({ srt: data.srt, vtt: data.vtt });
      setPipelineStage("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subtitle generation failed");
      setPipelineStage("idle");
    }
  };

  // --- Pipeline: Run Full Pipeline ---
  // Self-contained orchestrator that passes data directly between stages
  // instead of relying on React state (which is async and causes race conditions)
  const handleFullPipeline = async () => {
    if (!requireVideoAddon()) return;
    if (!storyboard) return;
    setShowPipeline(true);
    setError("");

    const initStage = (): PipelineStageStatus => ({ status: "pending" });
    const progress: FullPipelineProgress = {
      running: true,
      images: initStage(),
      video: initStage(),
      voiceover: initStage(),
      subtitles: initStage(),
    };
    setFullPipelineProgress({ ...progress });

    // --- Step 1: Generate scene images ---
    let generatedImages: { sceneNumber: number; imageUrl: string }[] = [];
    progress.images = { status: "running" };
    setFullPipelineProgress({ ...progress });
    try {
      const scenes = storyboard.storyboard.map((s) => ({
        sceneNumber: s.sceneNumber,
        visualDescription: s.visualDescription,
        colorPalette: s.colorPalette,
        style,
        platform,
        textOverlay: s.textOverlay,
      }));
      const res = await fetch("/api/video-creator/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenes, ...getQuotaFields() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Image generation failed");
      }
      const data = await res.json();
      generatedImages = data.images || [];
      setSceneImages(generatedImages);
      progress.images = { status: "done" };
    } catch (err) {
      progress.images = { status: "failed", error: err instanceof Error ? err.message : "Image generation failed" };
    }
    setFullPipelineProgress({ ...progress });

    // --- Step 2: Voiceover + Subtitles in parallel ---
    progress.voiceover = { status: "running" };
    progress.subtitles = { status: "running" };
    setFullPipelineProgress({ ...progress });

    const [voiceResult, subsResult] = await Promise.allSettled([
      // Voiceover
      (async () => {
        const res = await fetch("/api/video-creator/voiceover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            script: storyboard.script,
            voiceId: selectedVoice,
            mode: "full",
            ...getQuotaFields(),
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Voiceover generation failed");
        }
        return res.json();
      })(),
      // Subtitles (no addon required — pure text processing)
      (async () => {
        const res = await fetch("/api/video-creator/subtitles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            script: storyboard.script,
            totalDuration: parseInt(storyboard.totalDuration) || duration,
            format: "both",
            captionPreset: platform.includes("tiktok") ? "tiktok-bold" : "youtube-standard",
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Subtitle generation failed");
        }
        return res.json();
      })(),
    ]);

    // Handle voiceover result
    if (voiceResult.status === "fulfilled") {
      const data = voiceResult.value;
      if (data.provider === "browser" && !data.audioUrl) {
        if ("speechSynthesis" in window) {
          setVoiceoverUrl("browser-tts");
        }
        // Show fallback reason so user knows why AI voice didn't work
        if (data.fallbackReason) {
          progress.voiceover = { status: "done", error: "Using browser preview voice" };
        } else {
          progress.voiceover = { status: "done" };
        }
      } else {
        setVoiceoverUrl(data.audioUrl || null);
        progress.voiceover = { status: "done" };
      }
    } else {
      progress.voiceover = { status: "failed", error: voiceResult.reason?.message || "Voiceover failed" };
    }

    // Handle subtitles result
    if (subsResult.status === "fulfilled") {
      const data = subsResult.value;
      setSubtitleData({ srt: data.srt, vtt: data.vtt });
      progress.subtitles = { status: "done" };
    } else {
      progress.subtitles = { status: "failed", error: subsResult.reason?.message || "Subtitle generation failed" };
    }
    setFullPipelineProgress({ ...progress });

    // --- Step 3: Video render (if provider available) ---
    if (capabilities?.videoRender?.available) {
      // Use pipeline-generated images, fall back to previously generated scene images
      const imagesToUse = generatedImages.length > 0 ? generatedImages : sceneImages;
      const imageMap = new Map(imagesToUse.map((i) => [i.sceneNumber, i.imageUrl]));
      const renderScenes = storyboard.storyboard
        .map((s) => ({
          sceneNumber: s.sceneNumber,
          duration: s.duration,
          visualDescription: s.visualDescription,
          textOverlay: s.textOverlay,
          colorPalette: s.colorPalette,
          cameraMovement: s.cameraMovement,
          imageUrl: imageMap.get(s.sceneNumber),
        }))
        .filter((s) => s.imageUrl && s.imageUrl.startsWith("http"));

      if (renderScenes.length === 0) {
        progress.video = { status: "failed", error: "No scene images for rendering. Try running the pipeline again." };
      } else {
        progress.video = { status: "running" };
        setFullPipelineProgress({ ...progress });
        try {
          const res = await fetch("/api/video-creator/render", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scenes: renderScenes,
              style,
              platform,
              provider: selectedProvider || undefined,
              ...getQuotaFields(),
            }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            throw new Error(d.error || "Render failed");
          }
          const data = await res.json();
          // Check if all jobs failed immediately (provider broken)
          const allFailed = data.jobs?.length > 0 && data.jobs.every((j: RenderJob) => j.status === "failed");
          if (allFailed || data.error) {
            setRenderJobs(data.jobs || []);
            throw new Error("Video rendering is not yet available.");
          }
          setRenderJobs(data.jobs || []);
          pollRenderStatus(data.jobs || []);
          progress.video = { status: "done" };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "";
          // Use a short, clear message that won't be genericized by sanitizeError
          progress.video = {
            status: "failed",
            error: msg.includes("not yet available") || msg.includes("coming soon")
              ? "Video rendering is coming soon. Other assets are ready!"
              : "Video rendering unavailable. Other assets are ready!",
          };
        }
      }
    } else {
      progress.video = { status: "skipped", error: "Video rendering coming soon. Images, voiceover, and subtitles are ready!" };
    }

    progress.running = false;
    setFullPipelineProgress({ ...progress });
    fetchQuota();
  };

  // --- Template: Apply template ---
  const handleApplyTemplate = (template: VideoTemplate) => {
    setProjectType(template.projectType);
    setPlatform(template.platform);
    setDuration(template.duration);
    setStyle(template.style);
    setMusic(template.music);
    setScript(template.script);
    setShowTemplates(false);
  };

  // --- Export: Download subtitle files ---
  const exportSubtitleSRT = () => {
    if (!subtitleData?.srt) return;
    const blob = new Blob([subtitleData.srt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subtitles-${Date.now()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSubtitleVTT = () => {
    if (!subtitleData?.vtt) return;
    const blob = new Blob([subtitleData.vtt], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subtitles-${Date.now()}.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export functions
  const exportStoryboardJSON = () => {
    if (!storyboard) return;
    const blob = new Blob([JSON.stringify({ projectType, style, platform, duration, music, brandSettings: { colors: brandColors, font: brandFont }, ...storyboard }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `storyboard-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportStoryboardText = () => {
    if (!storyboard) return;
    let text = `VIDEO STORYBOARD\n${"=".repeat(50)}\n\n`;
    text += `Type: ${PROJECT_TYPES.find((t) => t.id === projectType)?.label}\n`;
    text += `Platform: ${PLATFORMS.find((p) => p.id === platform)?.label} (${PLATFORMS.find((p) => p.id === platform)?.aspect})\n`;
    text += `Duration: ${storyboard.totalDuration}\n`;
    text += `Style: ${VISUAL_STYLES.find((s) => s.id === style)?.label}\n\n`;
    text += `SCRIPT\n${"-".repeat(50)}\n${storyboard.script}\n\n`;
    text += `SCENES\n${"-".repeat(50)}\n`;
    storyboard.storyboard.forEach((scene) => {
      text += `\nScene ${scene.sceneNumber} (${scene.duration})\n`;
      text += `  Visual: ${scene.visualDescription}\n`;
      text += `  Text Overlay: ${scene.textOverlay}\n`;
      text += `  Camera: ${scene.cameraMovement}\n`;
      text += `  Transition: ${scene.transition}\n`;
    });
    if (storyboard.musicCues?.length) {
      text += `\nMUSIC CUES\n${"-".repeat(50)}\n`;
      storyboard.musicCues.forEach((cue) => { text += `- ${cue}\n`; });
    }
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `storyboard-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- TikTok Integration ---
  const handleConnectTikTok = () => {
    window.location.href = "/api/social/tiktok";
  };

  const handleDisconnectTikTok = () => {
    localStorage.removeItem("zoobicon_tiktok");
    setTiktokConnected(false);
    setTiktokUser(null);
    setTiktokStatus("");
  };

  const handleUploadToTikTok = async () => {
    // Find first successful render job with video URL
    const successJob = renderJobs.find((j) => j.status === "succeeded" && j.videoUrl);
    if (!successJob?.videoUrl) {
      setError("No rendered video available. Render a video first, then upload to TikTok.");
      return;
    }

    const stored = localStorage.getItem("zoobicon_tiktok");
    if (!stored) {
      setError("Not connected to TikTok. Please connect your account first.");
      return;
    }

    const { access_token } = JSON.parse(stored);
    setTiktokUploading(true);
    setTiktokStatus("Uploading to TikTok...");
    setError("");

    try {
      const caption = storyboard
        ? `${script.substring(0, 100)}${script.length > 100 ? "..." : ""} #AI #video #zoobicon`
        : "Created with Zoobicon AI #AI #video #zoobicon";

      const res = await fetch("/api/social/tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: access_token,
          videoUrl: successJob.videoUrl,
          title: caption,
          privacyLevel: "SELF_ONLY", // Start as private, user can change on TikTok
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          handleDisconnectTikTok();
          throw new Error("TikTok session expired. Please reconnect your account.");
        }
        throw new Error(data.error || "Upload failed");
      }

      setTiktokStatus("Uploaded to TikTok! Check your drafts to publish.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "TikTok upload failed");
      setTiktokStatus("");
    } finally {
      setTiktokUploading(false);
    }
  };

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch {}
    setUser(null);
    router.push("/");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#06080f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#06080f] text-white antialiased">
      <BackgroundEffects preset="technical" />
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#06080f]/80 backdrop-blur-2xl saturate-150">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Video className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-white">Zoobicon</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-white/30" />
            <span className="text-sm text-white/80 font-medium tracking-tight">Video Creator</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="text-[13px] text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.06] flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link href="/builder" className="text-[13px] text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.06] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Builder</span>
            </Link>
            <button onClick={() => setShowHistory(!showHistory)} className="text-[13px] text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.06] flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
              {projects.length > 0 && (
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-1.5 py-0.5 rounded-full">{projects.length}</span>
              )}
            </button>
            <button onClick={handleLogout} className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <CursorGlowTracker />

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-gray-900 border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-sm">Project History</h3>
                <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {projects.length === 0 ? (
                <div className="p-8 text-center text-white/50 text-sm">No projects yet. Generate a storyboard to get started.</div>
              ) : (
                <div className="p-2">
                  {projects.map((project) => (
                    <div key={project.id} className="p-3 rounded-lg hover:bg-white/5 group flex items-start justify-between gap-2">
                      <button onClick={() => loadProject(project)} className="flex-1 text-left">
                        <div className="text-sm font-medium mb-0.5">{project.name}</div>
                        <div className="text-xs text-white/50">
                          {new Date(project.createdAt).toLocaleDateString()} {new Date(project.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </button>
                      <button onClick={() => deleteProject(project.id)} className="p-1.5 text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative pt-14">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Controls */}
            <div className="lg:col-span-5 space-y-5">
              {/* Header */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                <h1 className="text-2xl font-extrabold tracking-tighter mb-1 text-white">AI Video Creator</h1>
                <p className="text-[13px] text-white/60 tracking-snug leading-relaxed">Full video pipeline — storyboard, images, rendering, voiceover & subtitles.</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="px-3 py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.05] text-xs text-white/60 hover:text-white hover:bg-white/[0.10] transition-all flex items-center gap-1.5"
                  >
                    <LayoutTemplate className="w-3 h-3" />
                    Templates ({templates.length})
                  </button>
                </div>
              </motion.div>

              {/* Template selector */}
              <AnimatePresence>
                {showTemplates && templates.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-white/[0.10] bg-white/[0.03] p-3 space-y-2">
                      <div className="text-xs font-semibold text-white/60">Quick Start Templates</div>
                      <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                        {templates.slice(0, 12).map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleApplyTemplate(t)}
                            className="p-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
                          >
                            <div className={`w-full h-6 rounded bg-gradient-to-r ${t.thumbnail} mb-1.5`} />
                            <div className="text-[10px] font-semibold text-white/80 group-hover:text-white truncate">{t.name}</div>
                            <div className="text-[9px] text-white/50 truncate">{t.description}</div>
                            <div className="flex gap-1 mt-1">
                              <span className="text-[8px] bg-white/[0.06] px-1 py-0.5 rounded text-white/50">{t.duration}s</span>
                              <span className="text-[8px] bg-white/[0.06] px-1 py-0.5 rounded text-white/50">{t.platform}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Project Type */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-2">
                <label className="text-xs font-semibold text-white/90 uppercase tracking-wider">Project Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PROJECT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setProjectType(type.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        projectType === type.id
                          ? "border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/20"
                          : "border-white/[0.10] bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
                      }`}
                    >
                      <type.icon className={`w-4 h-4 mb-1.5 ${projectType === type.id ? "text-cyan-400" : "text-white/50"}`} />
                      <div className="text-xs font-semibold">{type.label}</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Video Series Panel */}
              <VideoSeriesPanel
                onLoadEpisode={handleLoadSeriesEpisode}
                currentPlatform={platform}
                currentStyle={style}
              />

              {/* Script Input */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/90 uppercase tracking-wider">Script</label>
                  <button
                    onClick={handleGenerateScript}
                    disabled={generatingScript}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {generatingScript ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Generate Script with AI
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Describe your video or paste a script... Or tap the mic to speak."
                    rows={4}
                    className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/35 outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all duration-150 resize-none"
                  />
                  <button
                    onClick={toggleVoiceInput}
                    type="button"
                    className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all ${
                      isRecording
                        ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30"
                        : "bg-white/[0.05] text-white/50 hover:text-white hover:bg-white/[0.10] border border-white/[0.10]"
                    }`}
                    title={isRecording ? "Stop recording" : "Describe your video with voice"}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                {isRecording && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Listening... speak your video description
                  </p>
                )}
              </motion.div>

              {/* Visual Style */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-2">
                <label className="text-xs font-semibold text-white/90 uppercase tracking-wider">Visual Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VISUAL_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        style === s.id
                          ? "border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/20"
                          : "border-white/[0.10] bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${s.color} mb-1.5 flex items-center justify-center`}>
                        <s.icon className="w-3 h-3 text-white" />
                      </div>
                      <div className="text-xs font-semibold">{s.label}</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Platform */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-2">
                <label className="text-xs font-semibold text-white/90 uppercase tracking-wider">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
                        platform === p.id
                          ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                          : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-white/20"
                      }`}
                    >
                      <p.icon className="w-3 h-3" />
                      {p.label}
                      <span className="text-[10px] text-white/50">({p.aspect})</span>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Duration */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-2">
                <label className="text-xs font-semibold text-white/90 uppercase tracking-wider">Duration</label>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={`flex-1 py-2.5 rounded-lg border text-center transition-all ${
                        duration === d.value
                          ? "border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/20"
                          : "border-white/[0.08] bg-white/[0.03] hover:border-white/20"
                      }`}
                    >
                      <div className={`text-sm font-bold ${duration === d.value ? "text-cyan-300" : "text-white/80"}`}>{d.label}</div>
                      <div className="text-[10px] text-white/50">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Music */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-2">
                <label className="text-xs font-semibold text-white/90 uppercase tracking-wider flex items-center gap-1.5">
                  <Music className="w-3 h-3" /> Music Direction
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSIC_CATEGORIES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMusic(m.id)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                        music === m.id
                          ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                          : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-white/20"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Brand Settings */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-3">
                <label className="text-xs font-semibold text-white/90 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3 h-3" /> Brand Settings
                </label>
                <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] space-y-3">
                  <div>
                    <div className="text-[10px] text-white/50 mb-1.5 uppercase tracking-wider">Brand Colors</div>
                    <div className="flex items-center gap-2">
                      {brandColors.map((color, i) => (
                        <div key={i} className="relative">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => {
                              const updated = [...brandColors];
                              updated[i] = e.target.value;
                              setBrandColors(updated);
                            }}
                            className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                          />
                        </div>
                      ))}
                      {brandColors.length < 4 && (
                        <button
                          onClick={() => setBrandColors([...brandColors, "#10b981"])}
                          className="w-8 h-8 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/50 hover:text-white/60 hover:border-white/40 transition-colors text-lg"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/50 mb-1.5 uppercase tracking-wider">Font</div>
                    <select
                      value={brandFont}
                      onChange={(e) => setBrandFont(e.target.value)}
                      className="w-full bg-white/[0.07] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/30 transition-colors"
                    >
                      {FONTS.map((f) => (
                        <option key={f} value={f} className="bg-gray-900">{f}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* ── AI Spokesperson (HeyGen) ── */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-2">
                <button
                  onClick={() => { setShowSpokesperson(!showSpokesperson); if (!showSpokesperson) loadHeygenVoices(); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-all text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Smile className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white">AI Spokesperson</span>
                      <span className="text-[10px] text-purple-300/60 block">Real-looking presenter reads your script</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showSpokesperson ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showSpokesperson && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-purple-500/15 bg-white/[0.03] p-3 space-y-3">
                        {/* Avatar Selection */}
                        <div>
                          <label className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">Choose Presenter</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {heygenAvatars.map((avatar) => (
                              <button
                                key={avatar.id}
                                onClick={() => setSpokespersonAvatarId(avatar.id)}
                                className={`p-2 rounded-lg border text-center transition-all ${
                                  spokespersonAvatarId === avatar.id
                                    ? "border-purple-500/50 bg-purple-500/10 ring-1 ring-purple-500/20"
                                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 mx-auto mb-1 flex items-center justify-center text-white text-[10px] font-bold">
                                  {avatar.name[0]}
                                </div>
                                <div className="text-[9px] font-semibold text-white/80 truncate">{avatar.name}</div>
                                <div className="text-[8px] text-white/40">{avatar.style}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Voice Selection */}
                        {heygenVoices.length > 0 && (
                          <div>
                            <label className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">Voice</label>
                            <select
                              value={spokespersonVoiceId}
                              onChange={(e) => setSpokespersonVoiceId(e.target.value)}
                              className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-xs text-white/80 focus:border-purple-500/50 focus:outline-none"
                            >
                              <option value="">Default Voice</option>
                              {heygenVoices.map((v) => (
                                <option key={v.voice_id} value={v.voice_id}>
                                  {v.name} ({v.gender})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Format & Background */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-1 block">Format</label>
                            <div className="flex gap-1">
                              {([["portrait", Smartphone, "9:16"], ["landscape", Monitor, "16:9"], ["square", Square, "1:1"]] as const).map(([fmt, Icon, label]) => (
                                <button
                                  key={fmt}
                                  onClick={() => setSpokespersonFormat(fmt)}
                                  className={`flex-1 p-1.5 rounded-lg border text-center transition-all ${
                                    spokespersonFormat === fmt
                                      ? "border-purple-500/50 bg-purple-500/10"
                                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                                  }`}
                                >
                                  <Icon className="w-3 h-3 mx-auto mb-0.5 text-white/60" />
                                  <div className="text-[8px] text-white/60">{label}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-1 block">Background</label>
                            <div className="flex gap-1.5 items-center">
                              <input
                                type="color"
                                value={spokespersonBg}
                                onChange={(e) => setSpokespersonBg(e.target.value)}
                                className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                              />
                              <span className="text-[10px] text-white/50 font-mono">{spokespersonBg}</span>
                            </div>
                          </div>
                        </div>

                        {/* Generate Spokesperson Video */}
                        <button
                          onClick={handleSpokespersonGenerate}
                          disabled={spokespersonGenerating || !script.trim()}
                          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                          {spokespersonGenerating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              {spokespersonStatus === "processing" ? "Rendering video (~2 min)..." : "Starting..."}
                            </>
                          ) : (
                            <>
                              <Video className="w-3.5 h-3.5" />
                              Generate Spokesperson Video
                            </>
                          )}
                        </button>

                        {/* Status / Video Result */}
                        {spokespersonError && (
                          <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-2">
                            {spokespersonError}
                          </div>
                        )}

                        {spokespersonVideoUrl && (
                          <div className="space-y-2">
                            <div className="text-[10px] font-semibold text-green-400 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Video Ready!
                            </div>
                            <video
                              src={spokespersonVideoUrl}
                              controls
                              className="w-full rounded-lg border border-white/10"
                              style={{ maxHeight: 300 }}
                            />
                            <a
                              href={spokespersonVideoUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-white/[0.10] bg-white/[0.05] text-xs text-white/70 hover:text-white hover:bg-white/[0.10] transition-all"
                            >
                              <Download className="w-3 h-3" /> Download Video
                            </a>
                          </div>
                        )}

                        {heygenAvailable === false && (
                          <div className="text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/15 rounded-lg px-2.5 py-2 flex items-start gap-1.5">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>AI spokesperson videos are coming soon. The script you write here will also be used for the storyboard pipeline below.</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Generate Button */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold text-sm tracking-tight transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Storyboard...
                    </>
                  ) : (
                    <>
                      <Film className="w-4 h-4" />
                      Generate Video Storyboard
                    </>
                  )}
                </button>
                {error && (
                  <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {sanitizeError(error)}
                    {error.includes("add-on") && (
                      <Link href="/marketplace?search=video" className="ml-2 text-amber-400 underline hover:text-amber-300">
                        Get the add-on
                      </Link>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Column: Preview */}
            <div className="lg:col-span-7">
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="sticky top-20">
                {storyboard ? (
                  <div className="space-y-4">
                    {/* Storyboard Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold">Storyboard Preview</h2>
                        <div className="flex items-center gap-3 text-xs text-white/50 mt-0.5">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {storyboard.totalDuration}</span>
                          <span>{storyboard.storyboard.length} scenes</span>
                          <span className="text-amber-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Est. render: {storyboard.estimatedRenderTime}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={exportStoryboardText} className="px-3 py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.05] text-xs text-white/70 hover:text-white hover:bg-white/[0.10] transition-all flex items-center gap-1.5">
                          <Download className="w-3 h-3" /> Storyboard
                        </button>
                        <button onClick={exportStoryboardJSON} className="px-3 py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.05] text-xs text-white/70 hover:text-white hover:bg-white/[0.10] transition-all flex items-center gap-1.5">
                          <FileJson className="w-3 h-3" /> JSON
                        </button>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                      {storyboard.storyboard.map((scene, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveScene(i)}
                          className={`flex-shrink-0 w-24 h-16 rounded-lg border-2 transition-all relative overflow-hidden ${
                            activeScene === i
                              ? "border-cyan-500 ring-2 ring-cyan-500/30"
                              : "border-white/10 hover:border-white/30"
                          }`}
                        >
                          <div
                            className="absolute inset-0"
                            style={{
                              background: scene.colorPalette?.length
                                ? `linear-gradient(135deg, ${scene.colorPalette[0]}, ${scene.colorPalette[1] || scene.colorPalette[0]})`
                                : `linear-gradient(135deg, ${brandColors[0]}, ${brandColors[1] || brandColors[0]})`,
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">Scene {scene.sceneNumber}</span>
                          </div>
                          <div className="absolute bottom-0.5 right-1 text-[8px] text-white/60">{scene.duration}</div>
                        </button>
                      ))}
                    </div>

                    {/* Active Scene Detail */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeScene}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl border border-white/[0.10] bg-white/[0.03] overflow-hidden"
                      >
                        {/* Scene visual preview */}
                        <div
                          className="h-56 relative flex items-center justify-center overflow-hidden"
                          style={{
                            background: storyboard.storyboard[activeScene]?.colorPalette?.length
                              ? `linear-gradient(135deg, ${storyboard.storyboard[activeScene].colorPalette[0]}40, ${(storyboard.storyboard[activeScene].colorPalette[1] || storyboard.storyboard[activeScene].colorPalette[0])}40)`
                              : `linear-gradient(135deg, ${brandColors[0]}40, ${brandColors[1]}40)`,
                          }}
                        >
                          {/* Show AI-generated scene image if available */}
                          {sceneImages.find((img) => img.sceneNumber === storyboard.storyboard[activeScene]?.sceneNumber) && (
                            <img
                              src={sceneImages.find((img) => img.sceneNumber === storyboard.storyboard[activeScene]?.sceneNumber)?.imageUrl}
                              alt={`Scene ${storyboard.storyboard[activeScene]?.sceneNumber}`}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                          {/* Show rendered video if available */}
                          {renderJobs.find((j) => j.sceneNumber === storyboard.storyboard[activeScene]?.sceneNumber && j.status === "succeeded" && j.videoUrl) && (
                            <video
                              src={renderJobs.find((j) => j.sceneNumber === storyboard.storyboard[activeScene]?.sceneNumber && j.status === "succeeded")?.videoUrl || undefined}
                              className="absolute inset-0 w-full h-full object-cover"
                              controls
                              muted
                              loop
                            />
                          )}
                          <div className="relative text-center px-8 z-10">
                            <div className="text-3xl font-black mb-2 text-white/90 drop-shadow-lg">
                              Scene {storyboard.storyboard[activeScene]?.sceneNumber}
                            </div>
                            {storyboard.storyboard[activeScene]?.textOverlay && (
                              <div className="text-sm text-white/70 bg-black/30 px-4 py-2 rounded-lg inline-block backdrop-blur-sm">
                                {storyboard.storyboard[activeScene].textOverlay}
                              </div>
                            )}
                          </div>
                          {/* Aspect ratio indicator */}
                          <div className="absolute top-3 right-3 text-[10px] bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-white/60">
                            {PLATFORMS.find((p) => p.id === platform)?.aspect}
                          </div>
                          <div className="absolute bottom-3 left-3 text-[10px] bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-white/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {storyboard.storyboard[activeScene]?.duration}
                          </div>
                        </div>

                        {/* Scene details */}
                        <div className="p-5 space-y-3">
                          <div>
                            <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Visual Direction</div>
                            <div className="text-sm text-white/80">{storyboard.storyboard[activeScene]?.visualDescription}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Camera Movement</div>
                              <div className="text-xs text-white/70">{storyboard.storyboard[activeScene]?.cameraMovement}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Transition</div>
                              <div className="text-xs text-white/70">{storyboard.storyboard[activeScene]?.transition}</div>
                            </div>
                          </div>
                          {storyboard.storyboard[activeScene]?.colorPalette?.length > 0 && (
                            <div>
                              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Scene Palette</div>
                              <div className="flex gap-1.5">
                                {storyboard.storyboard[activeScene].colorPalette.map((color, i) => (
                                  <div key={i} className="flex items-center gap-1">
                                    <div className="w-4 h-4 rounded-sm border border-white/20" style={{ backgroundColor: color }} />
                                    <span className="text-[10px] text-white/50 font-mono">{color}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Script preview */}
                    <div className="rounded-xl border border-white/[0.10] bg-white/[0.03] p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-white/90 uppercase tracking-wider flex items-center gap-1.5">
                          <Type className="w-3 h-3" /> Script
                        </div>
                      </div>
                      <div className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                        {storyboard.script}
                      </div>
                    </div>

                    {/* Music cues */}
                    {storyboard.musicCues && storyboard.musicCues.length > 0 && (
                      <div className="rounded-xl border border-white/[0.10] bg-white/[0.03] p-5">
                        <div className="text-xs font-semibold text-white/90 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                          <Music className="w-3 h-3" /> Music Cues
                        </div>
                        <div className="space-y-1">
                          {storyboard.musicCues.map((cue, i) => (
                            <div key={i} className="text-xs text-white/60 flex items-start gap-2">
                              <span className="text-cyan-400 mt-0.5">-</span>
                              {cue}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ---- Video Production Pipeline ---- */}
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                            <Wand2 className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-cyan-300">Video Production Pipeline</div>
                            <div className="text-[10px] text-white/50">Generate images, render video, add voiceover & subtitles</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowPipeline(!showPipeline)}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${showPipeline ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                      {/* Upgrade prompt for free users */}
                      {!hasVideoAddon && (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-amber-300 mb-0.5">Add-on required for full pipeline</div>
                            <div className="text-[10px] text-white/50 mb-2">
                              Storyboard and script generation are free. Video rendering, voiceover, image generation, and subtitles require the AI Video Creator add-on ($19/mo) or a paid plan.
                            </div>
                            <div className="flex gap-2">
                              <Link
                                href="/marketplace?search=video"
                                className="px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-semibold hover:bg-amber-500/30 transition-colors"
                              >
                                Get Video Add-on — $19/mo
                              </Link>
                              <Link
                                href="/pricing"
                                className="px-3 py-1.5 rounded-md bg-white/[0.06] text-white/50 text-[10px] font-medium hover:bg-white/[0.10] transition-colors"
                              >
                                View Plans
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Usage meter */}
                      {hasVideoAddon && quota && (
                        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Monthly Usage</div>
                            <button
                              onClick={() => setShowBuyCredits(!showBuyCredits)}
                              className="text-[10px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              Buy More Credits
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            {[
                              { label: "Videos", data: quota.videos },
                              { label: "Images", data: quota.images },
                              { label: "Renders", data: quota.renders },
                              { label: "Voiceovers", data: quota.voiceovers },
                            ].map((item) => (
                              <div key={item.label} className="space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-white/50">{item.label}</span>
                                  <span className="text-[10px] text-white/60">
                                    {item.data.used}/{item.data.limit}
                                    {item.data.overage > 0 && (
                                      <span className="text-emerald-400"> +{item.data.overage}</span>
                                    )}
                                  </span>
                                </div>
                                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${item.data.pct >= 90 ? "bg-red-500" : item.data.pct >= 70 ? "bg-amber-500" : "bg-cyan-500"}`}
                                    style={{ width: `${Math.min(100, item.data.pct)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Buy credits panel */}
                          <AnimatePresence>
                            {showBuyCredits && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-2 space-y-1.5 border-t border-white/[0.06]">
                                  <div className="text-[10px] text-white/50 mb-1">One-time credit packs (valid 90 days):</div>
                                  {overagePacks.map((pack) => (
                                    <button
                                      key={pack.id}
                                      onClick={() => handleBuyCredits(pack.id)}
                                      disabled={buyingCredits}
                                      className="w-full flex items-center justify-between p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors text-left disabled:opacity-50"
                                    >
                                      <div>
                                        <div className="text-[11px] font-medium text-white/80">{pack.name}</div>
                                        {pack.savings && (
                                          <div className="text-[9px] text-emerald-400 font-medium">{pack.savings}</div>
                                        )}
                                      </div>
                                      <div className="text-xs font-bold text-cyan-400">{pack.priceDisplay}</div>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Quota exceeded prompt */}
                      {error && error.includes("limit reached") && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2">
                          <div className="text-xs font-semibold text-red-300">Usage Limit Reached</div>
                          <div className="text-[10px] text-white/50">{error}</div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowBuyCredits(true)}
                              className="px-3 py-1.5 rounded-md bg-cyan-600 text-white text-[10px] font-semibold hover:bg-cyan-500 transition-colors"
                            >
                              Buy More Credits
                            </button>
                            <Link
                              href="/pricing"
                              className="px-3 py-1.5 rounded-md bg-white/[0.06] text-white/50 text-[10px] font-medium hover:bg-white/[0.10] transition-colors"
                            >
                              Upgrade Plan
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Pipeline stages summary */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          {
                            label: "Images",
                            done: sceneImages.length > 0,
                            active: pipelineStage === "images" || fullPipelineProgress?.images.status === "running",
                            failed: fullPipelineProgress?.images.status === "failed",
                            icon: ImagePlus,
                          },
                          {
                            label: "Video",
                            done: renderJobs.some((j) => j.status === "succeeded"),
                            active: pipelineStage === "video" || fullPipelineProgress?.video.status === "running",
                            failed: fullPipelineProgress?.video.status === "failed",
                            skipped: fullPipelineProgress?.video.status === "skipped",
                            icon: Film,
                          },
                          {
                            label: "Voice",
                            done: !!voiceoverUrl,
                            active: pipelineStage === "voiceover" || fullPipelineProgress?.voiceover.status === "running",
                            failed: fullPipelineProgress?.voiceover.status === "failed",
                            icon: Mic,
                          },
                          {
                            label: "Subs",
                            done: !!subtitleData,
                            active: pipelineStage === "subtitles" || fullPipelineProgress?.subtitles.status === "running",
                            failed: fullPipelineProgress?.subtitles.status === "failed",
                            icon: Subtitles,
                          },
                        ].map((s) => (
                          <div key={s.label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium ${
                            s.active ? "bg-cyan-500/20 text-cyan-300" :
                            s.failed ? "bg-red-500/10 text-red-400" :
                            s.skipped ? "bg-amber-500/10 text-amber-400" :
                            s.done ? "bg-green-500/10 text-green-400" :
                            "bg-white/[0.03] text-white/50"
                          }`}>
                            {s.active ? <Loader2 className="w-3 h-3 animate-spin" /> :
                             s.failed ? <AlertCircle className="w-3 h-3" /> :
                             s.skipped ? <AlertCircle className="w-3 h-3" /> :
                             s.done ? <CheckCircle2 className="w-3 h-3" /> :
                             <CircleDashed className="w-3 h-3" />}
                            {s.label}
                          </div>
                        ))}
                      </div>

                      {/* Full pipeline progress detail */}
                      {fullPipelineProgress && (
                        <div className="space-y-1.5">
                          {fullPipelineProgress.running && (
                            <div className="flex items-center gap-2 text-[10px] text-cyan-300">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Pipeline running — generating your video assets...
                            </div>
                          )}
                          {!fullPipelineProgress.running && (
                            <div className="text-[10px] text-white/50">
                              Pipeline complete.
                              {fullPipelineProgress.images.status === "done" && " Images generated."}
                              {fullPipelineProgress.voiceover.status === "done" && " Voiceover ready."}
                              {fullPipelineProgress.subtitles.status === "done" && " Subtitles ready."}
                              {fullPipelineProgress.video.status === "skipped" && " Video rendering skipped (coming soon)."}
                            </div>
                          )}
                          {/* Show any stage errors (user-friendly, never raw API) */}
                          {Object.entries(fullPipelineProgress).filter(([key, val]) =>
                            key !== "running" && typeof val === "object" && val.status === "failed" && val.error
                          ).map(([key, val]) => (
                            <div key={key} className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                              {key}: {sanitizeError((val as PipelineStageStatus).error || "")}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Full pipeline button */}
                      <button
                        onClick={handleFullPipeline}
                        disabled={pipelineStage !== "idle" || (fullPipelineProgress?.running ?? false)}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {fullPipelineProgress?.running ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Running pipeline...
                          </>
                        ) : pipelineStage !== "idle" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3.5 h-3.5" />
                            Run Full Pipeline
                          </>
                        )}
                      </button>

                      {/* Expanded pipeline controls */}
                      <AnimatePresence>
                        {showPipeline && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-3 overflow-hidden"
                          >
                            {/* Voice selection */}
                            <div className="space-y-1.5">
                              <div className="text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-1">
                                <Volume2 className="w-3 h-3" /> Voice
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {(voicePresets.length > 0 ? voicePresets : [
                                  { id: "rachel", name: "Rachel", category: "female", tone: "professional" },
                                  { id: "drew", name: "Drew", category: "male", tone: "warm" },
                                  { id: "domi", name: "Domi", category: "female", tone: "energetic" },
                                  { id: "josh", name: "Josh", category: "male", tone: "dynamic" },
                                ] as VoicePreset[]).slice(0, 6).map((v) => (
                                  <button
                                    key={v.id}
                                    onClick={() => setSelectedVoice(v.id)}
                                    className={`px-2.5 py-1 rounded-md border text-[10px] font-medium transition-all ${
                                      selectedVoice === v.id
                                        ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                                        : "border-white/[0.08] text-white/50 hover:border-white/20"
                                    }`}
                                  >
                                    {v.name} <span className="text-white/50">({v.tone})</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Individual stage buttons */}
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={handleGenerateImages}
                                disabled={pipelineStage !== "idle" || (fullPipelineProgress?.running ?? false)}
                                className="py-2 rounded-lg border border-white/[0.10] bg-white/[0.05] text-xs text-white/70 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center gap-1.5 disabled:opacity-30"
                              >
                                {pipelineStage === "images" ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
                                {sceneImages.length > 0 ? "Regenerate Images" : "Generate Images"}
                              </button>
                              <button
                                onClick={handleStartRender}
                                disabled={pipelineStage !== "idle" || (fullPipelineProgress?.running ?? false)}
                                className="py-2 rounded-lg border border-white/[0.10] bg-white/[0.05] text-xs text-white/70 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center gap-1.5 disabled:opacity-30"
                              >
                                {pipelineStage === "video" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Film className="w-3 h-3" />}
                                Render Video
                              </button>
                              <button
                                onClick={handleGenerateVoiceover}
                                disabled={pipelineStage !== "idle" || (fullPipelineProgress?.running ?? false)}
                                className="py-2 rounded-lg border border-white/[0.10] bg-white/[0.05] text-xs text-white/70 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center gap-1.5 disabled:opacity-30"
                              >
                                {pipelineStage === "voiceover" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mic className="w-3 h-3" />}
                                {voiceoverUrl ? "Regenerate Voice" : "Generate Voice"}
                              </button>
                              <button
                                onClick={handleGenerateSubtitles}
                                disabled={pipelineStage !== "idle" || (fullPipelineProgress?.running ?? false)}
                                className="py-2 rounded-lg border border-white/[0.10] bg-white/[0.05] text-xs text-white/70 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center gap-1.5 disabled:opacity-30"
                              >
                                {pipelineStage === "subtitles" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Subtitles className="w-3 h-3" />}
                                {subtitleData ? "Regenerate Subs" : "Generate Subtitles"}
                              </button>
                            </div>

                            {/* Render progress */}
                            {renderJobs.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[10px] text-white/50">
                                  <span>Render Progress</span>
                                  <span>{renderProgress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${renderProgress}%` }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </div>
                                <div className="grid grid-cols-5 gap-1">
                                  {renderJobs.map((job) => (
                                    <div key={job.id} className={`text-center py-1 rounded text-[9px] font-medium ${
                                      job.status === "succeeded" ? "bg-green-500/10 text-green-400" :
                                      job.status === "failed" ? "bg-red-500/10 text-red-400" :
                                      job.status === "processing" ? "bg-blue-500/10 text-blue-400" :
                                      "bg-white/[0.03] text-white/50"
                                    }`} title={job.error ? sanitizeError(job.error) : undefined}>
                                      S{job.sceneNumber}
                                    </div>
                                  ))}
                                </div>
                                {renderJobs.some((j) => j.status === "failed" && j.error) && (
                                  <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-300 space-y-0.5">
                                    <span className="font-medium">Render issues:</span>
                                    {renderJobs.filter((j) => j.status === "failed" && j.error).slice(0, 3).map((j) => (
                                      <div key={j.id} className="truncate">Scene {j.sceneNumber}: {sanitizeError(j.error || "")}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Voiceover player */}
                            {voiceoverUrl && (
                              <div className="space-y-1.5">
                                <div className="text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-1">
                                  <Volume2 className="w-3 h-3" /> Voiceover Preview
                                </div>
                                {voiceoverUrl === "browser-tts" ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        if ("speechSynthesis" in window && storyboard) {
                                          window.speechSynthesis.cancel();
                                          const u = new SpeechSynthesisUtterance(storyboard.script);
                                          u.rate = 1.0;
                                          window.speechSynthesis.speak(u);
                                        }
                                      }}
                                      className="py-1.5 px-3 rounded-lg bg-white/[0.05] border border-white/[0.10] text-[10px] text-white/60 hover:text-white hover:bg-white/[0.10] transition-all flex items-center gap-1"
                                    >
                                      <Play className="w-3 h-3" /> Play Browser TTS
                                    </button>
                                    <button
                                      onClick={() => window.speechSynthesis?.cancel()}
                                      className="py-1.5 px-3 rounded-lg bg-white/[0.05] border border-white/[0.10] text-[10px] text-white/60 hover:text-white hover:bg-white/[0.10] transition-all flex items-center gap-1"
                                    >
                                      <Square className="w-3 h-3" /> Stop
                                    </button>
                                    <span className="text-[9px] text-amber-400/60">Browser TTS — free preview mode</span>
                                  </div>
                                ) : (
                                  <audio controls src={voiceoverUrl} className="w-full h-8 [&::-webkit-media-controls-panel]:bg-white/5 rounded" />
                                )}
                              </div>
                            )}

                            {/* Subtitle exports */}
                            {subtitleData && (
                              <div className="flex gap-2">
                                <button onClick={exportSubtitleSRT} className="flex-1 py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.05] text-[10px] text-white/60 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center gap-1">
                                  <FileText className="w-3 h-3" /> Download .srt
                                </button>
                                <button onClick={exportSubtitleVTT} className="flex-1 py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.05] text-[10px] text-white/60 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center gap-1">
                                  <FileText className="w-3 h-3" /> Download .vtt
                                </button>
                              </div>
                            )}

                            {/* TikTok Upload */}
                            <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
                              <div className="text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-1">
                                <Smartphone className="w-3 h-3" /> TikTok
                              </div>
                              {tiktokConnected ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 text-[10px]">
                                    {tiktokUser?.avatar_url && (
                                      <Image src={tiktokUser.avatar_url} alt="" width={20} height={20} unoptimized className="rounded-full" />
                                    )}
                                    <span className="text-green-400">{tiktokUser?.display_name || "Connected"}</span>
                                    <button onClick={handleDisconnectTikTok} className="ml-auto text-white/30 hover:text-red-400 transition-colors text-[9px]">
                                      Disconnect
                                    </button>
                                  </div>
                                  <button
                                    onClick={handleUploadToTikTok}
                                    disabled={tiktokUploading || !renderJobs.some((j) => j.status === "succeeded" && j.videoUrl)}
                                    className="w-full py-1.5 rounded-lg bg-gradient-to-r from-[#ff0050] to-[#00f2ea] text-white text-[10px] font-medium hover:opacity-90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    {tiktokUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                                    {tiktokUploading ? "Uploading..." : "Upload to TikTok"}
                                  </button>
                                  {!renderJobs.some((j) => j.status === "succeeded" && j.videoUrl) && (
                                    <p className="text-[9px] text-white/30">Render a video first to enable TikTok upload</p>
                                  )}
                                  {tiktokStatus && (
                                    <p className="text-[9px] text-green-400">{tiktokStatus}</p>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={handleConnectTikTok}
                                  className="w-full py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.05] text-[10px] text-white/60 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center gap-1.5"
                                >
                                  <Smartphone className="w-3 h-3" /> Connect TikTok Account
                                </button>
                              )}
                            </div>

                            {/* Social Media Publishing */}
                            <div className="pt-1 border-t border-white/[0.06]">
                              <SocialPublishPanel
                                script={script}
                                videoUrl={renderJobs.find((j) => j.status === "succeeded" && j.videoUrl)?.videoUrl || spokespersonVideoUrl}
                                sceneImages={sceneImages}
                                voiceoverUrl={voiceoverUrl}
                              />
                            </div>

                            {/* Pipeline capability status */}
                            {capabilities && (
                              <div className="text-[10px] text-white/50 space-y-0.5 pt-1 border-t border-white/[0.06]">
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  Storyboard & Script: Ready
                                </div>
                                <div className="flex items-center gap-1">
                                  {capabilities.imageGen.available ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                                  AI Image Generation: {capabilities.imageGen.available ? "Ready" : "Coming Soon"}
                                </div>
                                <div className="flex items-center gap-1">
                                  {capabilities.videoRender.available ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                                  Video Rendering: {capabilities.videoRender.available ? "Ready" : "Coming Soon"}
                                </div>
                                <div className="flex items-center gap-1">
                                  {capabilities.voiceover.available && (capabilities.voiceover as { premium?: boolean }).premium
                                    ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    : <AlertCircle className="w-3 h-3 text-amber-500" />}
                                  Voiceover: {capabilities.voiceover.available && (capabilities.voiceover as { premium?: boolean }).premium ? "Ready (ElevenLabs)" : "Browser TTS (upgrade for premium voices)"}
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  Subtitles & Captions: Ready (SRT/VTT)
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  /* Empty state */
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] h-[600px] flex items-center justify-center">
                    <div className="text-center px-8">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-700/20 flex items-center justify-center mx-auto mb-4">
                        <Film className="w-8 h-8 text-cyan-400/60" />
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-white/80">Your storyboard will appear here</h3>
                      <p className="text-sm text-white/60 max-w-sm">
                        Configure your project settings, write or generate a script, then hit &quot;Generate Video Storyboard&quot; to create a scene-by-scene breakdown.
                      </p>
                      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-white/50">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Scene visuals</span>
                        <span className="flex items-center gap-1"><Type className="w-3 h-3" /> Text overlays</span>
                        <span className="flex items-center gap-1"><Music className="w-3 h-3" /> Music cues</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
