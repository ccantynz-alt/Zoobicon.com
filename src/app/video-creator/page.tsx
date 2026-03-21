"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
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
  { id: "fun-playful", label: "Fun / Playful", icon: Smile, color: "from-pink-500 to-purple-500" },
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
  const [brandColors, setBrandColors] = useState(["#7c3aed", "#ec4899"]);
  const [brandFont, setBrandFont] = useState("Inter");

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
  }, []);

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
        throw new Error(data.error || "Failed to generate storyboard");
      }
      const data: Storyboard = await res.json();
      setStoryboard(data);
      setActiveScene(0);
      if (!script && data.script) setScript(data.script);
      saveProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
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
      const scenes = storyboard.storyboard.map((s) => ({
        sceneNumber: s.sceneNumber,
        duration: s.duration,
        visualDescription: s.visualDescription,
        textOverlay: s.textOverlay,
        colorPalette: s.colorPalette,
        cameraMovement: s.cameraMovement,
        imageUrl: imageMap.get(s.sceneNumber),
      }));
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
        throw new Error(d.error || "Render failed");
      }
      const data = await res.json();
      setRenderJobs(data.jobs || []);
      // Start polling
      pollRenderStatus(data.jobs || []);
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
      setVoiceoverUrl(data.audioUrl || null);
      setPipelineStage("idle");
      fetchQuota(); // Refresh usage
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voiceover generation failed");
      setPipelineStage("idle");
    }
  };

  // --- Pipeline: Generate Subtitles ---
  const handleGenerateSubtitles = async () => {
    if (!requireVideoAddon()) return;
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
  const handleFullPipeline = async () => {
    if (!requireVideoAddon()) return;
    if (!storyboard) return;
    setShowPipeline(true);
    // Step 1: Images
    await handleGenerateImages();
    // Step 2: Voiceover (parallel with subtitles)
    await Promise.all([
      handleGenerateVoiceover(),
      handleGenerateSubtitles(),
    ]);
    // Step 3: Video render (if provider available)
    if (capabilities?.videoRender?.available) {
      await handleStartRender();
    }
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

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch {}
    setUser(null);
    router.push("/");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-950 text-white">
      <BackgroundEffects preset="technical" />
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Video className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight">Zoobicon</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-white/50" />
            <span className="text-sm text-white/60 font-medium">Video Creator</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link href="/builder" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Builder</span>
            </Link>
            <button onClick={() => setShowHistory(!showHistory)} className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
              {projects.length > 0 && (
                <span className="bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0.5 rounded-full">{projects.length}</span>
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
                <h1 className="text-2xl font-black tracking-tight mb-1">AI Video Creator</h1>
                <p className="text-sm text-white/50">Full video pipeline: storyboard, images, rendering, voiceover & subtitles.</p>
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
                            className="p-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-left group"
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
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Project Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PROJECT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setProjectType(type.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        projectType === type.id
                          ? "border-purple-500/50 bg-purple-500/10 ring-1 ring-purple-500/20"
                          : "border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <type.icon className={`w-4 h-4 mb-1.5 ${projectType === type.id ? "text-purple-400" : "text-white/50"}`} />
                      <div className="text-xs font-semibold">{type.label}</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Script Input */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Script</label>
                  <button
                    onClick={handleGenerateScript}
                    disabled={generatingScript}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 disabled:opacity-50"
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
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Describe your video or paste a script... Leave empty and we'll generate one for you."
                  rows={4}
                  className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-purple-500/30 transition-colors resize-none"
                />
              </motion.div>

              {/* Visual Style */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-2">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Visual Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VISUAL_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        style === s.id
                          ? "border-purple-500/50 bg-purple-500/10 ring-1 ring-purple-500/20"
                          : "border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
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
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
                        platform === p.id
                          ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
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
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Duration</label>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={`flex-1 py-2.5 rounded-lg border text-center transition-all ${
                        duration === d.value
                          ? "border-purple-500/50 bg-purple-500/10 ring-1 ring-purple-500/20"
                          : "border-white/[0.08] bg-white/[0.03] hover:border-white/20"
                      }`}
                    >
                      <div className={`text-sm font-bold ${duration === d.value ? "text-purple-300" : "text-white/80"}`}>{d.label}</div>
                      <div className="text-[10px] text-white/50">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Music */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-2">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                  <Music className="w-3 h-3" /> Music
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSIC_CATEGORIES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMusic(m.id)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                        music === m.id
                          ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
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
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
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
                      className="w-full bg-white/[0.07] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/30 transition-colors"
                    >
                      {FONTS.map((f) => (
                        <option key={f} value={f} className="bg-gray-900">{f}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Generate Button */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
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
                    {error}
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
                              ? "border-purple-500 ring-2 ring-purple-500/30"
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
                        <div className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
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
                        <div className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                          <Music className="w-3 h-3" /> Music Cues
                        </div>
                        <div className="space-y-1">
                          {storyboard.musicCues.map((cue, i) => (
                            <div key={i} className="text-xs text-white/60 flex items-start gap-2">
                              <span className="text-purple-400 mt-0.5">-</span>
                              {cue}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ---- Video Production Pipeline ---- */}
                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Wand2 className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-purple-300">Video Production Pipeline</div>
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
                              className="text-[10px] font-medium text-purple-400 hover:text-purple-300 transition-colors"
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
                                    className={`h-full rounded-full transition-all ${item.data.pct >= 90 ? "bg-red-500" : item.data.pct >= 70 ? "bg-amber-500" : "bg-purple-500"}`}
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
                                      <div className="text-xs font-bold text-purple-400">{pack.priceDisplay}</div>
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
                              className="px-3 py-1.5 rounded-md bg-purple-600 text-white text-[10px] font-semibold hover:bg-purple-500 transition-colors"
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
                          { label: "Images", done: sceneImages.length > 0, active: pipelineStage === "images", icon: ImagePlus },
                          { label: "Video", done: renderJobs.some((j) => j.status === "succeeded"), active: pipelineStage === "video", icon: Film },
                          { label: "Voice", done: !!voiceoverUrl, active: pipelineStage === "voiceover", icon: Mic },
                          { label: "Subs", done: !!subtitleData, active: pipelineStage === "subtitles", icon: Subtitles },
                        ].map((s) => (
                          <div key={s.label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium ${
                            s.active ? "bg-purple-500/20 text-purple-300" : s.done ? "bg-green-500/10 text-green-400" : "bg-white/[0.03] text-white/50"
                          }`}>
                            {s.active ? <Loader2 className="w-3 h-3 animate-spin" /> : s.done ? <CheckCircle2 className="w-3 h-3" /> : <CircleDashed className="w-3 h-3" />}
                            {s.label}
                          </div>
                        ))}
                      </div>

                      {/* Full pipeline button */}
                      <button
                        onClick={handleFullPipeline}
                        disabled={pipelineStage !== "idle"}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {pipelineStage !== "idle" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Running pipeline...
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
                                        ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
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
                                disabled={pipelineStage !== "idle"}
                                className="py-2 rounded-lg border border-white/[0.10] bg-white/[0.05] text-xs text-white/70 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center gap-1.5 disabled:opacity-30"
                              >
                                {pipelineStage === "images" ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
                                {sceneImages.length > 0 ? "Regenerate Images" : "Generate Images"}
                              </button>
                              <button
                                onClick={handleStartRender}
                                disabled={pipelineStage !== "idle"}
                                className="py-2 rounded-lg border border-white/[0.10] bg-white/[0.05] text-xs text-white/70 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center gap-1.5 disabled:opacity-30"
                              >
                                {pipelineStage === "video" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Film className="w-3 h-3" />}
                                Render Video
                              </button>
                              <button
                                onClick={handleGenerateVoiceover}
                                disabled={pipelineStage !== "idle"}
                                className="py-2 rounded-lg border border-white/[0.10] bg-white/[0.05] text-xs text-white/70 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center gap-1.5 disabled:opacity-30"
                              >
                                {pipelineStage === "voiceover" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mic className="w-3 h-3" />}
                                {voiceoverUrl ? "Regenerate Voice" : "Generate Voice"}
                              </button>
                              <button
                                onClick={handleGenerateSubtitles}
                                disabled={pipelineStage !== "idle"}
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
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
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
                                    }`}>
                                      S{job.sceneNumber}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Voiceover player */}
                            {voiceoverUrl && (
                              <div className="space-y-1.5">
                                <div className="text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-1">
                                  <Volume2 className="w-3 h-3" /> Voiceover Preview
                                </div>
                                <audio controls src={voiceoverUrl} className="w-full h-8 [&::-webkit-media-controls-panel]:bg-white/5 rounded" />
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

                            {/* Provider status */}
                            {capabilities && (
                              <div className="text-[10px] text-white/50 space-y-0.5 pt-1 border-t border-white/[0.06]">
                                <div className="flex items-center gap-1">
                                  {capabilities.imageGen.available ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                                  Image Gen: {capabilities.imageGen.available ? "Ready" : "No provider configured"}
                                </div>
                                <div className="flex items-center gap-1">
                                  {capabilities.videoRender.available ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                                  Video Render: {capabilities.videoRender.available ? "Ready (Runway/Luma/Pika/Kling)" : "No provider configured"}
                                </div>
                                <div className="flex items-center gap-1">
                                  {capabilities.voiceover.available ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                                  Voiceover: {capabilities.voiceover.available ? "Ready" : "No provider configured"}
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
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center mx-auto mb-4">
                        <Film className="w-8 h-8 text-purple-400/60" />
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-white/80">Your storyboard will appear here</h3>
                      <p className="text-sm text-white/50 max-w-sm">
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
