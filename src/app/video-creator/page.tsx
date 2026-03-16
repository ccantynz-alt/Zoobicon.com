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
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

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

  // Project history
  const [projects, setProjects] = useState<Project[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeScene, setActiveScene] = useState(0);

  // Auth check
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) {
        setUser(JSON.parse(stored));
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

  // Load project history
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_video_projects");
      if (stored) setProjects(JSON.parse(stored));
    } catch { /* ignore */ }
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
            <ChevronRight className="w-3.5 h-3.5 text-white/30" />
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
                <div className="p-8 text-center text-white/40 text-sm">No projects yet. Generate a storyboard to get started.</div>
              ) : (
                <div className="p-2">
                  {projects.map((project) => (
                    <div key={project.id} className="p-3 rounded-lg hover:bg-white/5 group flex items-start justify-between gap-2">
                      <button onClick={() => loadProject(project)} className="flex-1 text-left">
                        <div className="text-sm font-medium mb-0.5">{project.name}</div>
                        <div className="text-xs text-white/40">
                          {new Date(project.createdAt).toLocaleDateString()} {new Date(project.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </button>
                      <button onClick={() => deleteProject(project.id)} className="p-1.5 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-500/10">
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
                <p className="text-sm text-white/50">Generate storyboards and scripts with AI. Video rendering coming soon.</p>
              </motion.div>

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
                      <type.icon className={`w-4 h-4 mb-1.5 ${projectType === type.id ? "text-purple-400" : "text-white/40"}`} />
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
                  className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/30 transition-colors resize-none"
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
                      <span className="text-[10px] text-white/40">({p.aspect})</span>
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
                      <div className="text-[10px] text-white/40">{d.desc}</div>
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
                          className="w-8 h-8 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/40 transition-colors text-lg"
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
                          className="h-56 relative flex items-center justify-center"
                          style={{
                            background: storyboard.storyboard[activeScene]?.colorPalette?.length
                              ? `linear-gradient(135deg, ${storyboard.storyboard[activeScene].colorPalette[0]}40, ${(storyboard.storyboard[activeScene].colorPalette[1] || storyboard.storyboard[activeScene].colorPalette[0])}40)`
                              : `linear-gradient(135deg, ${brandColors[0]}40, ${brandColors[1]}40)`,
                          }}
                        >
                          <div className="text-center px-8">
                            <div className="text-3xl font-black mb-2 text-white/90">
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
                            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Visual Direction</div>
                            <div className="text-sm text-white/80">{storyboard.storyboard[activeScene]?.visualDescription}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Camera Movement</div>
                              <div className="text-xs text-white/70">{storyboard.storyboard[activeScene]?.cameraMovement}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Transition</div>
                              <div className="text-xs text-white/70">{storyboard.storyboard[activeScene]?.transition}</div>
                            </div>
                          </div>
                          {storyboard.storyboard[activeScene]?.colorPalette?.length > 0 && (
                            <div>
                              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Scene Palette</div>
                              <div className="flex gap-1.5">
                                {storyboard.storyboard[activeScene].colorPalette.map((color, i) => (
                                  <div key={i} className="flex items-center gap-1">
                                    <div className="w-4 h-4 rounded-sm border border-white/20" style={{ backgroundColor: color }} />
                                    <span className="text-[10px] text-white/40 font-mono">{color}</span>
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

                    {/* Coming soon notice */}
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <Film className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-amber-300 mb-0.5">Video rendering coming soon</div>
                        <div className="text-xs text-white/50">
                          Storyboard and script generation is live. Actual video rendering via AI (Runway, Pika, Sora) is in development.
                          Export your storyboard and use it with any video editing tool in the meantime.
                        </div>
                      </div>
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
                      <p className="text-sm text-white/40 max-w-sm">
                        Configure your project settings, write or generate a script, then hit &quot;Generate Video Storyboard&quot; to create a scene-by-scene breakdown.
                      </p>
                      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-white/30">
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
