"use client";

import { useState, useCallback, useRef, useEffect, useMemo, Suspense, Component, type ErrorInfo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getGeneratorDef } from "@/lib/generator-prompts";
import TopBar from "@/components/TopBar";
import PromptInput from "@/components/PromptInput";
import type { Tier, AIModel, GenerationMode } from "@/components/PromptInput";
import DomainHookModal from "@/components/DomainHookModal";
import VoiceToBuildButton from "@/components/VoiceToBuildButton";
import dynamic from "next/dynamic";

const SandpackPreview = dynamic(() => import("@/components/SandpackPreview"), { ssr: false });
const WebContainerPreview = dynamic(() => import("@/components/WebContainerPreview"), { ssr: false });

interface WCErrorBoundaryProps {
  onError: () => void;
  fallback: ReactNode;
  children: ReactNode;
}
interface WCErrorBoundaryState {
  hasError: boolean;
}
class WebContainerErrorBoundary extends Component<WCErrorBoundaryProps, WCErrorBoundaryState> {
  state: WCErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(): WCErrorBoundaryState {
    return { hasError: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    this.props.onError();
  }
  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface PreviewSwitcherProps {
  useWebContainers: boolean;
  onWebContainersFail: () => void;
  files: Record<string, string>;
  reactDeps: Record<string, string>;
}
function PreviewSwitcher({ useWebContainers, onWebContainersFail, files, reactDeps }: PreviewSwitcherProps): JSX.Element {
  const sandpack = (
    <SandpackPreview mode="react" files={files} dependencies={reactDeps} showEditor={false} />
  );
  if (!useWebContainers) return sandpack;
  return (
    <WebContainerErrorBoundary onError={onWebContainersFail} fallback={sandpack}>
      <WebContainerPreview files={files} entry="App.tsx" />
    </WebContainerErrorBoundary>
  );
}
import CodePanel from "@/components/CodePanel";
import ChatPanel from "@/components/ChatPanel";
import StatusBar from "@/components/StatusBar";
import SeoPreview from "@/components/SeoPreview";

import AutoDebugPanel from "@/components/AutoDebugPanel";
import GitHubImport from "@/components/GitHubImport";
import TranslatePanel from "@/components/TranslatePanel";
import WordPressExport from "@/components/WordPressExport";
import ScaffoldPanel from "@/components/ScaffoldPanel";
import AnimationEditor from "@/components/AnimationEditor";
import EcommerceGenerator from "@/components/EcommerceGenerator";
import CrmGenerator from "@/components/CrmGenerator";
import FigmaImport from "@/components/FigmaImport";
import SeoScorePanel from "@/components/SeoScorePanel";
import QAPanel from "@/components/QAPanel";
import AccessibilityPanel from "@/components/AccessibilityPanel";
import PerformancePanel from "@/components/PerformancePanel";
import ExportPanel from "@/components/ExportPanel";
import VariantsPanel from "@/components/VariantsPanel";
import EmailTemplatePanel from "@/components/EmailTemplatePanel";
import ClonePanel from "@/components/ClonePanel";
import AiImagesPanel from "@/components/AiImagesPanel";
import PipelinePanel from "@/components/PipelinePanel";
import DiffPanel from "@/components/DiffPanel";
import ProjectTree from "@/components/ProjectTree";
import WelcomeModal, { shouldShowWelcomeModal, dismissWelcomeModal } from "@/components/WelcomeModal";
import { downloadZip } from "@/lib/zip-export";
import CollaborationBar from "@/components/CollaborationBar";
import CursorOverlay from "@/components/CursorOverlay";
import { useCollaboration } from "@/hooks/useCollaboration";
import OnboardingTooltips, { shouldShowTour } from "@/components/OnboardingTooltips";
import OnboardingFlow from "@/components/OnboardingFlow";
import BuildSuccessModal, { shouldShowBuildSuccess, dismissBuildSuccess } from "@/components/BuildSuccessModal";
import MCPPanel from "@/components/MCPPanel";
import ShareModal from "@/components/ShareModal";
import GitHubSyncPanel from "@/components/GitHubSyncPanel";
import DeployModal from "@/components/DeployModal";
import { trackEvent } from "@/lib/achievements";
import { notifyDeploy } from "@/lib/notifications";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bug,
  GitBranchPlus,
  GitFork,
  Languages,
  FileArchive,
  Database,
  Wand2,
  ShoppingCart,
  Users,
  Layers,
  Search,
  X,
  Rocket,
  Check,
  ExternalLink,
  Shield,
  Accessibility,
  Gauge,
  Download,
  FileText,
  Boxes,
  Mail,
  Globe,
  ImagePlus,
  Workflow,
  Undo2,
  Redo2,
  Save,
  Sparkles,
  History,
  FolderTree,
  Package,
  Eye,
  Code2,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  Plus,
  ChevronRight,
  Zap,
  Loader2,
} from "lucide-react";

/** Sanitize raw API error messages for user display */
function cleanErrorMessage(raw: string): string {
  // Try to extract message from JSON error strings like {"type":"error","error":{"type":"rate_limit_error","message":"..."}}
  try {
    const parsed = JSON.parse(raw.replace(/^[^{]*/, "").replace(/[^}]*$/, ""));
    const msg = parsed?.error?.message || parsed?.message;
    if (msg) {
      // Strip org IDs, request IDs, and docs URLs
      return msg
        .replace(/\s*\(org:\s*[^)]+\)/g, "")
        .replace(/,?\s*model:\s*\S+/g, "")
        .replace(/\.\s*For details,?\s*refer to:.*$/s, ".")
        .replace(/\.\s*You can see the response.*$/s, ".")
        .replace(/,?\s*"?request_id"?:\s*"?[^"}\s]+"?/g, "")
        .trim();
    }
  } catch { /* not JSON */ }
  // If it looks like a raw JSON blob, return a generic message
  if (raw.includes('"type":"error"') || raw.includes('"rate_limit_error"')) {
    return "AI service is busy. Please wait a moment and try again.";
  }
  return raw;
}

type BuildStatus = "idle" | "generating" | "editing" | "complete" | "error";
type RightTab = "preview" | "code" | "seo";
type ToolId =
  | "pipeline"
  | "clone"
  | "ai-images"
  | "debug"
  | "github"
  | "github-sync"
  | "translate"
  | "wordpress"
  | "scaffold"
  | "animations"
  | "ecommerce"
  | "crm"
  | "figma"
  | "seo"
  | "qa"
  | "a11y"
  | "perf"
  | "export"
  | "variants"
  | "email"
  | "project"
  | "crawl"
  | "mcp"
  | null;

const TOOLS: { id: Exclude<ToolId, null>; label: string; icon: React.ReactNode }[] = [
  { id: "pipeline", label: "Agent Pipeline", icon: <Workflow size={18} /> },
  { id: "clone", label: "Clone Site", icon: <Globe size={18} /> },
  { id: "ai-images", label: "AI Images", icon: <ImagePlus size={18} /> },
  { id: "qa", label: "QA Check", icon: <Shield size={18} /> },
  { id: "a11y", label: "Accessibility", icon: <Accessibility size={18} /> },
  { id: "perf", label: "Performance", icon: <Gauge size={18} /> },
  { id: "variants", label: "A/B Variants", icon: <Layers size={18} /> },
  { id: "email", label: "Email Template", icon: <Mail size={18} /> },
  { id: "export", label: "Export", icon: <Download size={18} /> },
  { id: "github-sync", label: "Push to GitHub", icon: <GitBranchPlus size={18} /> },
  { id: "debug", label: "Auto Debug", icon: <Bug size={18} /> },
  { id: "seo", label: "SEO Score", icon: <Search size={18} /> },
  { id: "animations", label: "Animations", icon: <Wand2 size={18} /> },
  { id: "ecommerce", label: "E-commerce", icon: <ShoppingCart size={18} /> },
  { id: "crm", label: "CRM", icon: <Users size={18} /> },
  { id: "scaffold", label: "Scaffolding", icon: <Database size={18} /> },
  { id: "translate", label: "Translate", icon: <Languages size={18} /> },
  { id: "github", label: "GitHub Import", icon: <GitFork size={18} /> },
  { id: "figma", label: "Layers Import", icon: <Layers size={18} /> },
  { id: "wordpress", label: "Zoobicon Connect", icon: <FileArchive size={18} /> },
  { id: "project", label: "Project Mode", icon: <FolderTree size={18} /> },
  { id: "crawl", label: "Crawl Competitor", icon: <Eye size={18} /> },
  { id: "mcp", label: "Import From...", icon: <ExternalLink size={18} /> },
];

/* ─── Interactive particle constellation background ─── */
function BuilderBackground({ isGenerating }: { isGenerating: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const isGeneratingRef = useRef(isGenerating);
  isGeneratingRef.current = isGenerating;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0, h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Particles
    const PARTICLE_COUNT = 80;
    const CONNECTION_DIST = 140;
    const MOUSE_RADIUS = 200;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      baseVx: number; baseVy: number;
      size: number;
      hue: number;
      pulse: number;
      pulseSpeed: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const speed = 0.15 + Math.random() * 0.3;
      const angle = Math.random() * Math.PI * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx, vy,
        baseVx: vx, baseVy: vy,
        size: 1.2 + Math.random() * 2,
        hue: 260 + Math.random() * 30, // zoo purple/violet range
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
      });
    }

    // Track mouse on document level so canvas can be pointer-events:none
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Only track if mouse is within canvas bounds
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouseRef.current = { x, y };
      } else {
        mouseRef.current = { x: -1000, y: -1000 };
      }
    };
    document.addEventListener("mousemove", handleMouseMove);

    let time = 0;

    const draw = () => {
      time += 1;
      ctx.clearRect(0, 0, w, h);

      const gen = isGeneratingRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update particles
      for (const p of particles) {
        p.pulse += p.pulseSpeed;

        // During generation, particles orbit and speed up
        if (gen) {
          const cx = w / 2, cy = h / 2;
          const dx = p.x - cx, dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const orbitStrength = 0.0004;
          p.vx += (-dy / dist) * orbitStrength + (cx - p.x) * 0.00003;
          p.vy += (dx / dist) * orbitStrength + (cy - p.y) * 0.00003;
        } else {
          // Slowly return to base velocity
          p.vx += (p.baseVx - p.vx) * 0.005;
          p.vy += (p.baseVy - p.vy) * 0.005;
        }

        // Mouse repulsion with elastic return
        const dmx = p.x - mx;
        const dmy = p.y - my;
        const distMouse = Math.sqrt(dmx * dmx + dmy * dmy);
        if (distMouse < MOUSE_RADIUS) {
          const force = (1 - distMouse / MOUSE_RADIUS) * 0.8;
          p.vx += (dmx / distMouse) * force;
          p.vy += (dmy / distMouse) * force;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * (gen ? 0.25 : 0.12);
            const hue = gen ? 265 + Math.sin(time * 0.02) * 20 : 270;
            ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
            ctx.lineWidth = (1 - dist / CONNECTION_DIST) * 1.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw mouse attraction lines
      if (mx > 0 && my > 0) {
        for (const p of particles) {
          const dx = p.x - mx, dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS * 1.2) {
            const alpha = (1 - dist / (MOUSE_RADIUS * 1.2)) * 0.15;
            ctx.strokeStyle = `hsla(270, 90%, 70%, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        const pulseSize = p.size + Math.sin(p.pulse) * 0.6;
        const brightness = gen ? 70 + Math.sin(p.pulse * 2) * 15 : 55;
        const alpha = gen ? 0.7 + Math.sin(p.pulse) * 0.3 : 0.4 + Math.sin(p.pulse) * 0.15;

        // Outer glow
        const glowRadius = pulseSize * (gen ? 4 : 2.5);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        glow.addColorStop(0, `hsla(${p.hue}, 80%, ${brightness}%, ${alpha * 0.4})`);
        glow.addColorStop(1, `hsla(${p.hue}, 80%, ${brightness}%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `hsla(${p.hue}, 85%, ${brightness + 15}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Generation energy ring
      if (gen) {
        const cx = w / 2, cy = h / 2;
        const ringRadius = 100 + Math.sin(time * 0.03) * 30;
        const ringGlow = ctx.createRadialGradient(cx, cy, ringRadius - 20, cx, cy, ringRadius + 40);
        ringGlow.addColorStop(0, "hsla(270, 90%, 60%, 0)");
        ringGlow.addColorStop(0.5, `hsla(270, 90%, 60%, ${0.04 + Math.sin(time * 0.05) * 0.02})`);
        ringGlow.addColorStop(1, "hsla(270, 90%, 60%, 0)");
        ctx.fillStyle = ringGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius + 40, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

export default function BuilderPageWrapper() {
  return (
    <Suspense>
      <BuilderPage />
    </Suspense>
  );
}

function BuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [status, setStatus] = useState<BuildStatus>("idle");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<RightTab>("preview");
  const [activeTool, setActiveTool] = useState<ToolId>(null);
  const [tier, setTier] = useState<Tier>("premium");
  const [isAdmin, setIsAdmin] = useState(false);
  const [useWebContainers, setUseWebContainers] = useState<boolean>(true);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent;
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    if (isSafari || isIOS) setUseWebContainers(false);
  }, []);

  const handleWebContainersFail = useCallback(() => {
    setUseWebContainers(false);
  }, []);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState("");
  const [deployStatus, setDeployStatus] = useState<"idle" | "deploying" | "deployed" | "error">("idle");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [pipelineAgents, setPipelineAgents] = useState<string[]>([]);
  const [buildProgress, setBuildProgress] = useState<{ current: number; total: number; section: string } | null>(null);
  const [sectionTimeline, setSectionTimeline] = useState<Array<{ section: string; label: string; status: "pending" | "scaffolding" | "customizing" | "done"; startedAt: number; finishedAt?: number }>>([]);
  const [buildError, setBuildError] = useState<{ message: string; suggestion: string } | null>(null);
  const [streamWarning, setStreamWarning] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("");  // Empty = use pipeline's smart routing (Haiku/Opus/Sonnet)
  const [instantMode, setInstantMode] = useState(true); // Default to fast registry assembly (scaffold <1s + AI customize ~10s)
  const [fullStack, setFullStack] = useState(false); // Full-stack mode: auto-provisions Supabase backend (auth, database, storage)
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [reactSource, setReactSource] = useState<Record<string, string> | null>(null);
  const [reactFiles, setReactFiles] = useState<Record<string, string> | null>(null);
  const [reactDeps, setReactDeps] = useState<Record<string, string>>({});
  const [generationMode, setGenerationMode] = useState<GenerationMode>("react");
  const [domainHookOpen, setDomainHookOpen] = useState(false);
  const [domainHookShownForThisBuild, setDomainHookShownForThisBuild] = useState(false);
  const [mcpContext, setMcpContext] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  // Phase 2: Visual editing
  // Phase 3: Project mode
  const [projectFiles, setProjectFiles] = useState<{ path: string; content: string; language: string; isModified?: boolean }[]>([]);
  const [activeProjectFile, setActiveProjectFile] = useState<string | null>(null);
  const [isGeneratingProject, setIsGeneratingProject] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [generatorBanner, setGeneratorBanner] = useState<{ id: string; name: string } | null>(null);
  const [showDiffPanel, setShowDiffPanel] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showBuildSuccess, setShowBuildSuccess] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Recording mode — ?record=1 hides all chrome for clean screen captures
  const [recordingMode, setRecordingMode] = useState(false);

  // Agency white-label branding (loaded from user's agency membership)
  const [agencyBrand, setAgencyBrand] = useState<{ agencyName: string; primaryColor: string; secondaryColor: string; logoUrl?: string } | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewRect, setPreviewRect] = useState<DOMRect | null>(null);

  // Show welcome modal on first visit
  useEffect(() => {
    if (shouldShowWelcomeModal()) {
      setShowWelcome(true);
    }
  }, []);

  // Show onboarding flow for first-time users who haven't completed it
  useEffect(() => {
    if (!localStorage.getItem("zoobicon_onboarded")) {
      setShowOnboarding(true);
    }
  }, []);

  // Generator routing — read ?generator=TYPE from URL and pre-fill prompt
  const searchParams = useSearchParams();
  useEffect(() => {
    const generatorId = searchParams.get("generator");
    if (generatorId && !hasCode) {
      const def = getGeneratorDef(generatorId);
      setPrompt(def.prompt);
      setGeneratorBanner({ id: generatorId, name: def.name });
    }
    // Recording mode detection
    if (searchParams.get("record") === "1") {
      setRecordingMode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Snapshot system — captures state on every AI action for perfect undo
  interface Snapshot {
    html: string;
    label: string;      // e.g., "Initial build", "Edit: change color to blue"
    timestamp: number;
  }
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotIndex, setSnapshotIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  // Legacy compat
  const history = snapshots.map(s => s.html);
  const historyIndex = snapshotIndex;

  const abortRef = useRef<AbortController | null>(null);
  const generationIdRef = useRef(0); // Tracks current generation to prevent stale image replacements
  const watchdogSlowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogStuckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  // hasCode must check for REAL content — not just the "<!-- react-app-mode -->" marker
  // which can linger after a failed generation, leaving the builder stuck in "AI Editor" mode
  const hasCode = generatedCode.length > 0 && (
    generatedCode !== "<!-- react-app-mode -->" || (reactFiles !== null && Object.keys(reactFiles).length > 0)
  );

  // Get user email for auth headers
  const getUserEmail = useCallback(() => {
    try {
      const u = localStorage.getItem("zoobicon_user");
      if (u) return JSON.parse(u).email || "";
    } catch {}
    return "";
  }, []);

  const authHeaders = useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    try {
      const u = localStorage.getItem("zoobicon_user");
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed.email) headers["x-user-email"] = parsed.email;
        if (parsed.role === "admin" || parsed.plan === "unlimited") headers["x-admin"] = "1";
      }
    } catch { /* ignore */ }
    return headers;
  }, []);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Restore saved prompt after signup redirect
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zoobicon_pending_prompt");
      if (saved && !prompt) {
        setPrompt(saved);
        localStorage.removeItem("zoobicon_pending_prompt");
      }
      // Also check URL params for prompt
      const params = new URLSearchParams(window.location.search);
      const urlPrompt = params.get("prompt");
      if (urlPrompt && !prompt) {
        setPrompt(decodeURIComponent(urlPrompt));
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Admin always gets premium tier locked + load agency branding
  useEffect(() => {
    try {
      const user = localStorage.getItem("zoobicon_user");
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.email) setUserEmail(parsed.email);
        if (parsed.name) setUserName(parsed.name);
        if (parsed.role === "admin" || parsed.plan === "unlimited") {
          setTier("premium");
          setIsAdmin(true);
        }
        // Load agency brand config if user belongs to an agency
        if (parsed.agencyId && parsed.email) {
          fetch(`/api/agencies?email=${encodeURIComponent(parsed.email)}`)
            .then(r => r.json())
            .then(data => {
              const agency = data.agencies?.[0];
              if (agency?.id) setAgencyId(agency.id);
              if (agency?.brand_config?.agencyName) {
                setAgencyBrand({
                  agencyName: agency.brand_config.agencyName,
                  primaryColor: agency.brand_config.primaryColor || "#3b82f6",
                  secondaryColor: agency.brand_config.secondaryColor || "#8b5cf6",
                  logoUrl: agency.brand_config.logoUrl,
                });
                // Store for TopBar to pick up
                localStorage.setItem("zoobicon_agency_brand", JSON.stringify(agency.brand_config));
              }
            })
            .catch(() => { /* agency API not available */ });
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Fetch available models on mount
  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (data.models?.length) setAvailableModels(data.models);
      })
      .catch(() => { /* models API not available, use defaults */ });
  }, []);

  // --- Real-Time Collaboration ---
  const collabSlug = useMemo(() => {
    // Use site slug from URL or a generated session key
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("slug") || params.get("site") || "";
    }
    return "";
  }, []);

  const collab = useCollaboration({
    slug: collabSlug,
    email: userEmail,
    name: userName,
    enabled: !!collabSlug && !!userEmail,
    onRemoteCodeUpdate: useCallback((html: string, _version: number, updatedBy: string) => {
      // Apply remote code update
      setGeneratedCode(html);
      setStatus("complete");
      console.log(`Code updated by ${updatedBy}`);
    }, []),
  });

  // Auto-join collab room from invite code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get("collab");
    if (inviteCode && userEmail && !collab.isConnected) {
      collab.joinRoom(inviteCode);
    }
  }, [userEmail, collab.isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Push code changes to collab room
  const prevCodeRef = useRef("");
  useEffect(() => {
    if (collab.isConnected && generatedCode && generatedCode !== prevCodeRef.current) {
      prevCodeRef.current = generatedCode;
      collab.pushCode(generatedCode);
    }
  }, [generatedCode, collab.isConnected, collab.pushCode]);

  // Track preview container rect for cursor overlay
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setPreviewRect(el.getBoundingClientRect());
    });
    observer.observe(el);

    // Send cursor position on mousemove (throttled)
    let lastSent = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (!collab.isConnected) return;
      const now = Date.now();
      if (now - lastSent < 100) return; // Throttle to 10fps
      lastSent = now;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      collab.sendCursorPosition(x, y, null);
    };
    el.addEventListener("mousemove", handleMouseMove);

    return () => {
      observer.disconnect();
      el.removeEventListener("mousemove", handleMouseMove);
    };
  }, [collab.isConnected, collab.sendCursorPosition]);

  // Track code changes in snapshot system
  const pendingLabelRef = useRef<string>("Manual change");
  const addSnapshot = useCallback((html: string, label: string) => {
    if (!html) return;
    isUndoRedoRef.current = true; // Prevent the effect from double-adding
    setSnapshots(prev => {
      const truncated = prev.slice(0, snapshotIndex + 1);
      const newSnapshots = [...truncated, { html, label, timestamp: Date.now() }].slice(-50);
      setSnapshotIndex(newSnapshots.length - 1);
      return newSnapshots;
    });
    setGeneratedCode(html);
  }, [snapshotIndex]);

  // Auto-snapshot on generatedCode changes (manual edits, code panel updates)
  useEffect(() => {
    if (!generatedCode || isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    setSnapshots(prev => {
      const truncated = prev.slice(0, snapshotIndex + 1);
      const label = pendingLabelRef.current || "Manual change";
      pendingLabelRef.current = "Manual change"; // Reset
      const newSnapshots = [...truncated, { html: generatedCode, label, timestamp: Date.now() }].slice(-50);
      setSnapshotIndex(newSnapshots.length - 1);
      return newSnapshots;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedCode]);

  // Show build success modal on first successful generation
  useEffect(() => {
    if (status === "complete" && generatedCode && shouldShowBuildSuccess()) {
      setShowBuildSuccess(true);
    }
  }, [status, generatedCode]);

  // Open the Domain Hook modal once per build when a site finishes generating.
  // This is the #1 monetization hook: free site → paid domain + deploy + email.
  useEffect(() => {
    if (status === "complete" && reactFiles && Object.keys(reactFiles).length > 0 && !domainHookShownForThisBuild) {
      const t = setTimeout(() => {
        setDomainHookOpen(true);
        setDomainHookShownForThisBuild(true);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [status, reactFiles, domainHookShownForThisBuild]);

  // Reset the "shown once" flag whenever the user starts a new prompt
  useEffect(() => {
    if (status === "idle") setDomainHookShownForThisBuild(false);
  }, [status]);

  // Derive a site name from the current prompt for the Domain Hook
  const siteNameForHook = useMemo(() => {
    const raw = (prompt || "").trim().toLowerCase();
    if (!raw) return "mysite";
    const slug = raw.replace(/[^a-z0-9\s-]/g, "").split(/\s+/).slice(0, 3).join("").slice(0, 32);
    return slug || "mysite";
  }, [prompt]);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    isUndoRedoRef.current = true;
    const newIndex = snapshotIndex - 1;
    setSnapshotIndex(newIndex);
    setGeneratedCode(snapshots[newIndex].html);
  }, [canUndo, snapshotIndex, snapshots]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    isUndoRedoRef.current = true;
    const newIndex = snapshotIndex + 1;
    setSnapshotIndex(newIndex);
    setGeneratedCode(snapshots[newIndex].html);
  }, [canRedo, snapshotIndex, snapshots]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      // Escape exits recording mode
      if (e.key === "Escape" && recordingMode) {
        setRecordingMode(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo, recordingMode]);

  // Auto-replace picsum placeholder images with contextually relevant ones
  // Paid users get AI-generated images (DALL-E/Stability), free users get Unsplash
  const autoReplaceImages = useCallback(async (html: string): Promise<string> => {
    if (!html.includes("picsum.photos")) return html;
    let useAI = false;
    try {
      const u = localStorage.getItem("zoobicon_user");
      if (u) {
        const p = JSON.parse(u);
        useAI = p.plan === "unlimited" || p.plan === "pro" || p.plan === "premium" || p.role === "admin";
      }
    } catch { /* ignore */ }
    try {
      const res = await fetch("/api/generate/images", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ html, useAI }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.html && data.imageCount > 0) {
          console.log(`[Auto-Images] Replaced ${data.imageCount} placeholder images`);
          return data.html;
        }
      }
    } catch (err) {
      console.warn("[Auto-Images] Failed to replace images, using placeholders:", err);
    }
    return html;
  }, []);

  // streamGenerate removed — all generation now uses /api/generate/react SSE stream
  // via handleGenerate (new builds) and handleEdit (edits)
  const _legacyStreamRemoved = useCallback(
    async () => {
      setStatus("generating");
      setError("");
      setActiveTab("preview");

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/generate/react", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            prompt: userPrompt,
            tier,
            ...(existingCode ? { existingCode } : {}),
            ...(selectedModel ? { model: selectedModel } : {}),
            ...(generatorBanner ? { generator: generatorBanner.id } : {}),
            ...(agencyBrand ? { agencyBrand } : {}),
            ...(agencyId ? { agencyId } : {}),
            ...(mcpContext ? { externalContext: mcpContext } : {}),
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          // Check if this is a non-retryable error — don't fallback, surface immediately
          try {
            const errData = await res.clone().json();
            const isNonRetryable = res.status === 401 || res.status === 403 || res.status === 429 ||
              (errData.error && (errData.error.includes("API_KEY") || errData.error.includes("not configured") || errData.error.includes("API key")));
            if (isNonRetryable && errData.error) {
              setError(cleanErrorMessage(errData.error));
              setStatus("error");
              return;
            }
          } catch { /* not JSON, continue to fallback */ }

          // Fallback to non-streaming endpoint
          const fallbackRes = await fetch("/api/generate/react", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              prompt: userPrompt,
              tier,
              ...(existingCode ? { existingCode } : {}),
              ...(selectedModel ? { model: selectedModel } : {}),
              ...(generatorBanner ? { generator: generatorBanner.id } : {}),
              ...(agencyBrand ? { agencyBrand } : {}),
            ...(agencyId ? { agencyId } : {}),
            }),
          });
          if (!fallbackRes.ok) {
            let fbErrMsg = `Generation returned HTTP ${fallbackRes.status}`;
            try {
              const data = await fallbackRes.json();
              fbErrMsg = data.error || fbErrMsg;
            } catch {
              if (fallbackRes.status === 504 || fallbackRes.status === 502) {
                fbErrMsg = "AI model timed out. Try again with a simpler prompt.";
              }
            }
            throw new Error(fbErrMsg);
          }
          const data = await fallbackRes.json();
          let fbHtml = (data.html || "").trim();
          fbHtml = fbHtml.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
          const fbStart = fbHtml.search(/<!doctype\s+html|<html/i);
          if (fbStart > 0) fbHtml = fbHtml.slice(fbStart);
          const fbEnd = fbHtml.lastIndexOf("</html>");
          if (fbEnd !== -1) fbHtml = fbHtml.slice(0, fbEnd + "</html>".length);
          // Validate body content before accepting fallback
          const fbBodyM = fbHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          const fbBodyChars = fbBodyM
            ? fbBodyM[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().length
            : 0;
          if (fbBodyChars < 50) {
            throw new Error(`Fallback generation produced empty body (${fbBodyChars} chars). The AI model may be unavailable — check /api/health for diagnostics.`);
          }
          setGeneratedCode(fbHtml);
          setStatus("complete");
          // Auto-replace placeholder images
          autoReplaceImages(fbHtml).then((improved) => {
            if (improved !== fbHtml) setGeneratedCode(improved);
          });
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";
        let lineBuffer = ""; // Buffer for incomplete SSE lines split across chunks
        let streamAborted = false; // Set when edit_failed or error terminates the stream early

        const processStreamLines = (lines: string[]) => {
          for (const line of lines) {
            if (streamAborted) return;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "chunk" && event.content) {
                accumulated += event.content;
                setGeneratedCode(accumulated);
              } else if (event.type === "replace" && event.content) {
                // Server retried due to empty body — replace accumulated HTML entirely
                accumulated = event.content;
                setGeneratedCode(accumulated);
              } else if (event.type === "status") {
                // Informational status update (e.g., "Retrying...")
              } else if (event.type === "done") {
                if (!streamAborted) {
                  setStatus("complete");
                  trackEvent("build");
                }
              } else if (event.type === "edit_failed") {
                // Edit produced empty body — preserve original code, show warning
                streamAborted = true;
                if (existingCode) {
                  setGeneratedCode(existingCode);
                }
                setError(event.message || "Edit failed — original site preserved.");
                setStatus("error");
                return;
              } else if (event.type === "error") {
                // Clear empty/partial code so Sandpack shows clean state
                setGeneratedCode("");
                setError(cleanErrorMessage(event.message || "Stream error"));
                setStatus("error");
                return;
              }
            } catch {
              // Skip malformed SSE lines — non-JSON data lines are harmless
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          lineBuffer += text;
          const lines = lineBuffer.split("\n");
          // Keep the last (potentially incomplete) line in the buffer
          lineBuffer = lines.pop() || "";
          processStreamLines(lines);
        }

        // Flush any remaining data after stream closes
        if (lineBuffer.trim()) {
          const finalText = decoder.decode();
          lineBuffer += finalText;
          processStreamLines(lineBuffer.split("\n"));
        }

  const clearWatchdog = useCallback(() => {
    if (watchdogSlowRef.current) clearTimeout(watchdogSlowRef.current);
    if (watchdogStuckRef.current) clearTimeout(watchdogStuckRef.current);
    watchdogSlowRef.current = null;
    watchdogStuckRef.current = null;
    setStreamWarning(null);
  }, []);

        if (accumulated) {
          // Clean accumulated HTML — strip code fences, JSON preamble
          let clean = accumulated.trim();
          clean = clean.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
          // Strip any leading JSON config that leaked through
          clean = clean.replace(/^\s*\{[\s\S]*?\}\s*(?=<[a-zA-Z!])/, "");
          const ds = clean.search(/<!doctype\s+html|<html/i);
          if (ds > 0) clean = clean.slice(ds);
          const he = clean.lastIndexOf("</html>");
          if (he !== -1) clean = clean.slice(0, he + "</html>".length);

          // Client-side body check — last line of defense against empty pages
          const bodyM = clean.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          const bodyChars = bodyM
            ? bodyM[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().length
            : 0;

          if (existingCode && bodyChars < 50) {
            // Edit produced empty body — restore original code
            console.warn(`[Builder] Edit produced empty body (${bodyChars} chars). Restoring original code.`);
            setGeneratedCode(existingCode);
            setError("Edit response was incomplete. Your original site has been preserved. Try a simpler edit or try again.");
            setStatus("error");
            return;
          } else if (!existingCode && bodyChars < 50) {
            // Body is empty even after server retry — do one client-side retry via non-streaming endpoint
            console.warn(`[Builder] Empty body after stream (${bodyChars} chars). Client-side retry...`);
            try {
              const retryRes = await fetch("/api/generate/react", {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                  prompt: userPrompt,
                  tier,
                  ...(selectedModel ? { model: selectedModel } : {}),
                  ...(agencyBrand ? { agencyBrand } : {}),
            ...(agencyId ? { agencyId } : {}),
                }),
                signal: controller.signal,
              });
              if (retryRes.ok) {
                const retryData = await retryRes.json();
                let retryHtml = (retryData.html || "").trim();
                retryHtml = retryHtml.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
                const rds = retryHtml.search(/<!doctype\s+html|<html/i);
                if (rds > 0) retryHtml = retryHtml.slice(rds);
                const rhe = retryHtml.lastIndexOf("</html>");
                if (rhe !== -1) retryHtml = retryHtml.slice(0, rhe + "</html>".length);
                // Only accept retry if it actually has body content
                const retryBodyM = retryHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                const retryBodyChars = retryBodyM
                  ? retryBodyM[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().length
                  : 0;
                if (retryBodyChars >= 50) {
                  clean = retryHtml;
                } else {
                  console.warn(`[Builder] Client-side retry also empty (${retryBodyChars} body chars)`);
                  // All retries exhausted — clear HTML and show error instead of empty page warning
                  setGeneratedCode("");
                  setError("Generation produced empty content after multiple retries. Your API key may be invalid or rate-limited — check /api/health for diagnostics, then try again.");
                  setStatus("error");
                  return;
                }
              } else {
                // Retry request failed — read actual error and show it
                let retryErrMsg = "Generation failed after retries. Please try again.";
                try {
                  const retryErrData = await retryRes.json();
                  if (retryErrData.error) retryErrMsg = retryErrData.error;
                } catch { /* ignore parse errors */ }
                setGeneratedCode("");
                setError(retryErrMsg);
                setStatus("error");
                return;
              }
            } catch (retryErr) {
              console.error("[Builder] Client-side retry failed:", retryErr);
              setGeneratedCode("");
              setError("Generation failed — please try again.");
              setStatus("error");
              return;
            }
          }

          setGeneratedCode(clean);
          addSnapshot(clean, prompt?.slice(0, 40) || "Build");
          setStatus("complete");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Generation failed";
        setError(cleanErrorMessage(msg));
        setStatus("error");
      }
    },
    [],
  );

  // Update timeline based on section state transitions
  const upsertSection = useCallback((section: string, status: "scaffolding" | "customizing" | "done") => {
    if (!section) return;
    const now = Date.now();
    setSectionTimeline(prev => {
      const idx = prev.findIndex(s => s.section === section);
      if (idx === -1) {
        console.log("[builder]", section, status, 0);
        return [...prev, { section, label: section, status, startedAt: now }];
      }
      const existing = prev[idx];
      const elapsed = now - existing.startedAt;
      console.log("[builder]", section, status, elapsed);
      const next = [...prev];
      next[idx] = {
        ...existing,
        status,
        finishedAt: status === "done" ? now : existing.finishedAt,
      };
      return next;
    });
    // Auto-scroll active section into view
    requestAnimationFrame(() => {
      const el = timelineScrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    // CHECK AUTH FIRST — don't waste the user's time
    const userStr = typeof window !== "undefined" ? localStorage.getItem("zoobicon_user") : null;
    if (!userStr) {
      // Save their prompt so it's not lost after signup
      try { localStorage.setItem("zoobicon_pending_prompt", prompt.trim()); } catch {}
      window.location.href = `/auth/signup?redirect=/builder&prompt=${encodeURIComponent(prompt.trim().slice(0, 200))}`;
      return;
    }

    // Close welcome modal if open
    if (showWelcome) {
      setShowWelcome(false);
      dismissWelcomeModal();
    }

    const currentGenId = ++generationIdRef.current;
    setStatus("generating");
    setError("");
    setGeneratedCode("");
    setActiveTab("preview");
    setPipelineAgents([]);
    setBuildProgress(null);
    setSectionTimeline([]);
    setBuildError(null);
    setStreamWarning(null);
    resetWatchdog();
    pendingLabelRef.current = `Build: ${prompt.trim().slice(0, 50)}`;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // ── React App mode: server handles everything via streaming ──
    if (generationMode === "react") {
      setStatus("generating");

      // TWO PATHS:
      // 1. Fast path (instantMode=true, DEFAULT): Registry scaffold (<1s) + AI customization (~10s)
      // 2. Full path (instantMode=false): Opus generates everything from scratch (~30s)
      const useFastPath = instantMode;
      const endpoint = useFastPath ? "/api/generate/react-stream" : "/api/generate/react";
      setPipelineAgents([useFastPath ? "Assembling components from registry..." : "AI generating full application..."]);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            prompt: prompt.trim(),
            tier: useFastPath ? "standard" : "premium",
            fullStack,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        // Read SSE stream — update preview as files arrive
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let lineBuffer = "";
        let receivedFiles = false;
        let receivedDone = false;
        const STREAM_TIMEOUT_MS = 270000; // 4.5 minutes — leaves headroom before Vercel's 5min limit
        let lastDataAt = Date.now();

        while (true) {
          const readPromise = reader.read();
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              if (Date.now() - lastDataAt > STREAM_TIMEOUT_MS) {
                reject(new Error("Generation timed out — no data received for 4 minutes. Please try again."));
              }
            }, STREAM_TIMEOUT_MS);
          });
          const { done, value } = await Promise.race([readPromise, timeoutPromise]);
          if (done) break;
          lastDataAt = Date.now();
          resetWatchdog();
          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split("\n");
          lineBuffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === "status") {
                setPipelineAgents(prev => [...prev, event.message]);
                // Update progress bar if event carries progress numbers
                if (event.current != null && event.total != null) {
                  setBuildProgress({ current: event.current, total: event.total, section: event.section || "" });
                }
                if (event.section && event.phase === "building") {
                  upsertSection(event.section, "customizing");
                }
              } else if (event.type === "scaffold" && event.files) {
                // Legacy scaffold event (full assembly at once) — still supported
                if (generationIdRef.current === currentGenId) {
                  setReactFiles(event.files);
                  setGeneratedCode("<!-- react-app-mode -->");
                  receivedFiles = true;
                  setPipelineAgents(prev => [...prev, `Scaffold ready — ${event.componentCount} components assembled`]);
                }
              } else if (event.type === "customization" && event.data) {
                // Legacy customization event
                if (generationIdRef.current === currentGenId) {
                  setPipelineAgents(prev => [...prev, `Customizing for "${event.data.brandName || "your business"}"...`]);
                }
              } else if (event.type === "scaffold-update" && event.files) {
                // Legacy scaffold update
                if (generationIdRef.current === currentGenId) {
                  setReactFiles(event.files);
                  setGeneratedCode("<!-- react-app-mode -->");
                  receivedFiles = true;
                }
              } else if (event.type === "partial" && event.files) {
                // Progressive streaming: each partial carries the full file map so far
                if (generationIdRef.current === currentGenId) {
                  setReactFiles(event.files);
                  setGeneratedCode("<!-- react-app-mode -->");
                  receivedFiles = true;
                  // Update progress indicator
                  if (event.fileCount != null && event.totalComponents != null) {
                    setBuildProgress({ current: event.fileCount, total: event.totalComponents, section: event.section || "" });
                  }
                  if (event.section && event.customized) {
                    upsertSection(event.section, "done");
                  } else if (event.section) {
                    upsertSection(event.section, "scaffolding");
                  }
                }
              } else if ((event.type === "done" && event.files) || (event.type === "done")) {
                // Generation complete
                if (generationIdRef.current === currentGenId) {
                  if (event.files) {
                    setReactFiles(event.files);
                    setReactDeps(event.dependencies || {});
                    setReactSource(event.files);
                    receivedFiles = true;
                  }
                  setGeneratedCode("<!-- react-app-mode -->");
                  setStatus("complete");
                  setBuildProgress(null);
                  receivedDone = true;
                  clearWatchdog();
                  setSectionTimeline(prev => prev.map(s => s.status === "done" ? s : { ...s, status: "done", finishedAt: Date.now() }));
                  setPipelineAgents(prev => [...prev, "Build complete"]);
                  trackEvent("build");
                }
              } else if (event.type === "error") {
                const msg = event.message || "Generation failed";
                setBuildError({ message: cleanErrorMessage(msg), suggestion: errorSuggestion(msg) });
                throw new Error(msg);
              }
            } catch (e) {
              if (e instanceof Error && (e.message.includes("failed") || e.message.includes("Generation") || e.message.includes("unavailable") || e.message.includes("busy"))) {
                throw e;
              }
              // Skip JSON parse errors from partial chunks
            }
          }
        }

        // Flush remaining buffer — handle all event types, not just "done"
        if (lineBuffer.trim()) {
          for (const line of lineBuffer.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "status") {
                setPipelineAgents(prev => [...prev, event.message]);
                if (event.current != null && event.total != null) {
                  setBuildProgress({ current: event.current, total: event.total, section: event.section || "" });
                }
              } else if (event.type === "scaffold" && event.files) {
                if (generationIdRef.current === currentGenId) {
                  setReactFiles(event.files);
                  setGeneratedCode("<!-- react-app-mode -->");
                }
              } else if (event.type === "scaffold-update" && event.files) {
                if (generationIdRef.current === currentGenId) {
                  setReactFiles(event.files);
                  setGeneratedCode("<!-- react-app-mode -->");
                }
              } else if (event.type === "partial" && event.files) {
                if (generationIdRef.current === currentGenId) {
                  setReactFiles(event.files);
                  setGeneratedCode("<!-- react-app-mode -->");
                  if (event.fileCount != null && event.totalComponents != null) {
                    setBuildProgress({ current: event.fileCount, total: event.totalComponents, section: event.section || "" });
                  }
                }
              } else if (event.type === "done" && generationIdRef.current === currentGenId) {
                if (event.files) {
                  setReactFiles(event.files);
                  setReactDeps(event.dependencies || {});
                  setReactSource(event.files);
                }
                setGeneratedCode("<!-- react-app-mode -->");
                setStatus("complete");
                setBuildProgress(null);
                setPipelineAgents(prev => [...prev, "Build complete"]);
                trackEvent("build");
              } else if (event.type === "error") {
                throw new Error(event.message || "Generation failed");
              }
            } catch (e) {
              if (e instanceof Error && (e.message.includes("failed") || e.message.includes("Generation") || e.message.includes("unavailable") || e.message.includes("busy"))) {
                throw e;
              }
              // Skip JSON parse errors from partial chunks
            }
          }
        }

        // Safety net: if stream ended but we never received files, show a clear error
        if (generationIdRef.current === currentGenId && !receivedFiles) {
          setError("No components were generated. The AI service may be unavailable or misconfigured. Please try again in a moment.");
          setStatus("error");
          setBuildProgress(null);
        } else if (generationIdRef.current === currentGenId && !receivedDone) {
          // Got partial files but stream ended without "done" — show what we have
          setStatus("complete");
          setBuildProgress(null);
          setPipelineAgents(prev => [...prev, "Build complete (stream ended early — partial results shown)"]);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") { clearWatchdog(); return; }
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[React Generate] Failed:", errMsg);
        setGeneratedCode("");
        setReactFiles(null);
        setBuildProgress(null);
        clearWatchdog();
        const cleaned = cleanErrorMessage(errMsg);
        setError(cleaned);
        setBuildError(prev => prev || { message: cleaned, suggestion: errorSuggestion(errMsg) });
        setStatus("error");
      }
      return;
    }
  }, [prompt, tier, autoReplaceImages, selectedModel, instantMode, generationMode, fullStack, resetWatchdog, clearWatchdog, errorSuggestion, upsertSection]);

  // Edit existing React files via the same streaming endpoint
  const handleEdit = useCallback(async () => {
    if (!editPrompt.trim() || !reactFiles) return;

    const instruction = editPrompt.trim();
    setStatus("generating");
    setError("");
    setPipelineAgents([`Editing: ${instruction.slice(0, 60)}...`]);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Use diff-based editing — only regenerate changed files (2-5s vs 30s)
      const res = await fetch("/api/generate/edit", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          instruction,
          files: reactFiles,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let lineBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6).trim());
            if (event.type === "status") {
              setPipelineAgents(prev => [...prev, event.message]);
            } else if (event.type === "partial" && event.files) {
              // Merge changed files into existing files (diff-based)
              setReactFiles(prev => ({ ...prev, ...event.files }));
            } else if (event.type === "done" && event.files) {
              // Merge ONLY the changed files — keep everything else
              setReactFiles(prev => {
                const merged = { ...prev, ...event.files };
                setReactSource(merged);
                return merged;
              });
              setStatus("complete");
              setEditPrompt("");
              setPipelineAgents(prev => [...prev, `Edit complete — ${event.changedCount || Object.keys(event.files).length} file(s) changed`]);
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (e) {
            if (e instanceof Error && (e.message.includes("failed") || e.message.includes("unavailable"))) throw e;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Edit] Failed:", errMsg);
      setError(cleanErrorMessage(errMsg));
      setStatus("error");
    }
  }, [editPrompt, reactFiles, tier, selectedModel]);

  const handleCodeUpdate = useCallback((newCode: string) => {
    setGeneratedCode(newCode);
    setStatus("complete");
    setActiveTab("preview");
  }, []);

  const handleNewSite = useCallback(() => {
    setGeneratedCode("");
    setPrompt("");
    setReactSource(null);
    setReactFiles(null);
    setReactDeps({});
    setStatus("idle");
    setError("");
    setActiveTool(null);
    setSnapshots([]);
    setSnapshotIndex(-1);
  }, []);

  const handleSeoFixRequest = useCallback(
    (instruction: string) => {
      setEditPrompt(instruction);
    },
    []
  );

  /** Build the deployable HTML code from current state (React files or raw HTML) */
  const buildDeployCode = useCallback((siteName: string): string | null => {
    const files = reactFiles ?? {};
    const hasReactFiles = Object.keys(files).length > 0;
    const hasHtml = generatedCode && generatedCode !== "<!-- react-app-mode -->";

    if (!hasReactFiles && !hasHtml) return null;

    if (hasReactFiles && !hasHtml) {
      // React mode: combine all files into a single deployable HTML page
      const appCode = files["App.tsx"] || "";
      const cssCode = files["styles.css"] || "";
      const componentCodes = Object.entries(files)
        .filter(([path]) => path.startsWith("components/") && path.endsWith(".tsx"))
        .map(([path, code]) => {
          const name = path.replace("components/", "").replace(".tsx", "");
          return `// --- ${name} ---\n${code}`;
        })
        .join("\n\n");

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>${cssCode}</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
${componentCodes}

${appCode}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
  <\/script>
</body>
</html>`;
    }

    return generatedCode;
  }, [generatedCode, reactFiles]);

  /** Called by DeployModal when user confirms deploy */
  const handleDeployWithName = useCallback(async (siteName: string): Promise<{ url: string; slug: string; deployTimeMs?: number } | null> => {
    const deployCode = buildDeployCode(siteName);
    if (!deployCode) throw new Error("No code to deploy");

    setIsDeploying(true);
    setDeployStatus("deploying");

    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("zoobicon_user") : null;
      const user = userStr ? JSON.parse(userStr) : null;
      const email = user?.email || "anonymous@zoobicon.com";

      const res = await fetch("/api/hosting/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: siteName, email, code: deployCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Deploy failed");
      }

      const data = await res.json();
      setDeployUrl(data.url);
      setDeployStatus("deployed");

      // Track deploy achievement + send notification
      trackEvent("deploy");
      notifyDeploy(siteName, data.url);

      return { url: data.url, slug: data.siteSlug, deployTimeMs: data.deployTimeMs };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deploy failed");
      setDeployStatus("error");
      throw err;
    } finally {
      setIsDeploying(false);
    }
  }, [buildDeployCode]);

  /** Quick deploy handler for inline button and BuildSuccessModal */
  const handleDeploy = useCallback(() => {
    setShowDeployModal(true);
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    if (!generatedCode || saveStatus === "saving") return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prompt.trim().slice(0, 80) || "Untitled Template",
          html: generatedCode,
          prompt: prompt.trim(),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("idle");
    }
  }, [generatedCode, saveStatus, prompt]);

  const toggleTool = useCallback((toolId: Exclude<ToolId, null>) => {
    setActiveTool((prev) => {
      const next = prev === toolId ? null : toolId;
      return next;
    });
  }, []);

  const renderToolPanel = () => {
    switch (activeTool) {
      case "pipeline":
        return <PipelinePanel onApplyCode={handleCodeUpdate} />;
      case "clone":
        return <ClonePanel onClone={handleCodeUpdate} />;
      case "ai-images":
        return <AiImagesPanel code={generatedCode} onApplyImages={handleCodeUpdate} />;
      case "debug":
        return <AutoDebugPanel code={generatedCode} onApplyFix={handleCodeUpdate} />;
      case "github":
        return <GitHubImport onImport={handleCodeUpdate} />;
      case "github-sync":
        return (
          <GitHubSyncPanel
            files={reactFiles || {}}
            suggestedName={prompt.trim().slice(0, 50) || "zoobicon-project"}
          />
        );
      case "translate":
        return (
          <TranslatePanel code={generatedCode} onApplyTranslation={handleCodeUpdate} />
        );
      case "wordpress":
        return <WordPressExport code={generatedCode} />;
      case "scaffold":
        return (
          <ScaffoldPanel code={generatedCode} onApplyScaffold={handleCodeUpdate} />
        );
      case "animations":
        return (
          <AnimationEditor code={generatedCode} onApplyAnimations={handleCodeUpdate} />
        );
      case "ecommerce":
        return <EcommerceGenerator onGenerate={handleCodeUpdate} />;
      case "crm":
        return <CrmGenerator onGenerate={handleCodeUpdate} />;
      case "figma":
        return <FigmaImport onImport={handleCodeUpdate} />;
      case "seo":
        return <SeoScorePanel code={generatedCode} onFixRequest={handleSeoFixRequest} />;
      case "qa":
        return <QAPanel code={generatedCode} />;
      case "a11y":
        return <AccessibilityPanel code={generatedCode} />;
      case "perf":
        return <PerformancePanel code={generatedCode} />;
      case "export":
        return <ExportPanel code={generatedCode} reactSource={reactSource} />;
      case "variants":
        return <VariantsPanel code={generatedCode} onApplyVariant={handleCodeUpdate} />;
      case "email":
        return <EmailTemplatePanel onApplyCode={handleCodeUpdate} />;
      case "project":
        return (
          <div className="flex flex-col gap-4 p-4">
            <button
              onClick={async () => {
                setIsGeneratingProject(true);
                try {
                  const res = await fetch("/api/generate/project", {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({ prompt: prompt || "Convert the current site", framework: "nextjs" }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setProjectFiles(data.files || []);
                    if (data.files?.length) setActiveProjectFile(data.files[0].path);
                  }
                } finally {
                  setIsGeneratingProject(false);
                }
              }}
              disabled={isGeneratingProject}
              className="btn btn-primary text-sm"
            >
              <Package size={16} />
              {isGeneratingProject ? "Generating..." : "Generate Project"}
            </button>
            {projectFiles.length > 0 && (
              <>
                <ProjectTree
                  files={projectFiles}
                  activeFile={activeProjectFile}
                  onFileSelect={setActiveProjectFile}
                  projectName="my-project"
                />
                <button
                  onClick={() => downloadZip(projectFiles.map(f => ({ path: f.path, content: f.content })), "my-project")}
                  className="btn btn-secondary text-sm mt-2"
                >
                  <Download size={16} />
                  Download ZIP
                </button>
              </>
            )}
          </div>
        );
      case "crawl":
        return (
          <div className="flex flex-col gap-4 p-4">
            <p className="text-xs text-white/50 leading-relaxed">
              Crawl a competitor&apos;s website to detect their tech stack, features, and design patterns.
              Use insights to build something better.
            </p>
            <Link
              href="/crawl"
              target="_blank"
              className="btn btn-primary text-sm flex items-center gap-2"
            >
              <Eye size={16} />
              Open Intelligent Crawler
              <ExternalLink size={12} />
            </Link>
          </div>
        );
      case "mcp":
        return <MCPPanel onContextChange={setMcpContext} />;
      default:
        return null;
    }
  };

  const activeToolLabel = TOOLS.find((t) => t.id === activeTool)?.label ?? "";

  /* ─── Recording Mode: fullscreen preview only ─── */
  if (recordingMode) {
    return (
      <div className="h-screen w-screen bg-[#050508] relative overflow-hidden">
        {/* Minimal recording chrome — press Escape to exit */}
        <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            REC
          </div>
          <button
            onClick={() => setRecordingMode(false)}
            className="px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-xs hover:bg-white/20 transition-colors"
          >
            Exit (Esc)
          </button>
        </div>

        {/* Pipeline status overlay — shows during generation with progress bar */}
        {status === "generating" && pipelineAgents.length > 0 && (
          <div className="absolute bottom-6 left-6 right-6 z-40">
            <div className="max-w-xl mx-auto px-5 py-3 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/[0.08] shadow-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse flex-shrink-0" />
                <span className="text-sm text-white/80 font-medium truncate">
                  {pipelineAgents[pipelineAgents.length - 1]}
                </span>
                {buildProgress && buildProgress.total > 0 && (
                  <span className="text-xs text-white/40 ml-auto flex-shrink-0">
                    {buildProgress.current}/{buildProgress.total}
                  </span>
                )}
              </div>
              {buildProgress && buildProgress.total > 0 && (
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-out"
                    style={{ width: `${Math.round((buildProgress.current / buildProgress.total) * 100)}%` }}
                  />
                </div>
              )}
              {streamWarning && (
                <div className="flex items-center gap-2 text-[10px] text-amber-400 mt-2">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{streamWarning}</span>
                </div>
              )}
              {sectionTimeline.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 mt-2">
                  {sectionTimeline.map((s) => {
                    const elapsed = s.finishedAt ? ((s.finishedAt - s.startedAt) / 1000).toFixed(1) : null;
                    return (
                      <div key={s.section} className="flex items-center gap-2 text-[10px]">
                        {s.status === "done" ? (
                          <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse flex-shrink-0" />
                        )}
                        <span className={s.status === "done" ? "text-white/60" : "text-white/90"}>{s.label}</span>
                        {elapsed && <span className="text-white/30 ml-auto tabular-nums">{elapsed}s</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {buildError && (
          <div className="absolute top-16 left-6 right-6 z-50">
            <div className="max-w-2xl mx-auto px-4 py-3 rounded-xl bg-red-950/90 backdrop-blur-xl border border-red-500/40 shadow-2xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-red-200">{buildError.message}</div>
                  <div className="text-xs text-red-300/80 mt-0.5">{buildError.suggestion}</div>
                </div>
                <button
                  onClick={() => { setBuildError(null); handleGenerate(); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs text-red-100 border border-red-500/40 transition"
                >
                  <RotateCcw className="w-3 h-3" /> Retry
                </button>
                <button
                  onClick={() => setBuildError(null)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-300 transition"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen preview */}
        <PreviewSwitcher
          useWebContainers={useWebContainers}
          onWebContainersFail={handleWebContainersFail}
          files={reactFiles || {}}
          reactDeps={reactDeps}
        />
        {isAdmin && (
          <button
            type="button"
            onClick={() => setUseWebContainers((v) => !v)}
            className="absolute top-2 right-2 z-50 px-2 py-1 text-[10px] rounded bg-black/70 text-white border border-white/20"
          >
            Preview: {useWebContainers ? "WebContainers" : "Sandpack"}
          </button>
        )}

        {/* Prompt input overlay at bottom — for recording demo sequences */}
        {!hasCode && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-6">
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/[0.1] shadow-2xl">
              <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && prompt.trim()) handleGenerate(); }}
                placeholder="Describe the website you want to build..."
                className="flex-1 bg-transparent text-white text-base placeholder-white/50 outline-none"
              />
              <button
                onClick={() => setInstantMode(!instantMode)}
                className={`px-3 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all border ${
                  instantMode
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-violet-500/10 border-violet-500/30 text-violet-400"
                }`}
                title={instantMode ? "Instant: <3s preview from component library" : "Deep Build: full AI generation with Opus (~30s)"}
              >
                {instantMode ? "Instant" : "Deep Build"}
              </button>
              <button
                onClick={() => setFullStack(!fullStack)}
                className={`px-3 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all border ${
                  fullStack
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                    : "bg-white/5 border-white/10 text-white/40"
                }`}
                title={fullStack ? "Full-Stack: auto-provisions database, auth, and storage" : "Frontend only: no backend services"}
              >
                <Database size={12} className="inline mr-1" />
                {fullStack ? "Full-Stack" : "Frontend"}
              </button>
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || status === "generating"}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 transition-all"
              >
                {status === "generating" ? "Building..." : "Generate"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 relative overflow-hidden">
      {/* Welcome modal for first-time users */}
      {showWelcome && (
        <WelcomeModal onClose={() => { setShowWelcome(false); dismissWelcomeModal(); setTimeout(() => { if (shouldShowTour()) setShowTour(true); }, 500); }} />
      )}
      {showOnboarding && (
        <OnboardingFlow onComplete={(prompt) => {
          setShowOnboarding(false);
          localStorage.setItem("zoobicon_onboarded", "true");
          if (prompt) setPrompt(prompt);
        }} />
      )}
      {showDiffPanel && (
        <div className="fixed inset-0 z-50">
          <DiffPanel
            snapshots={snapshots}
            currentIndex={snapshotIndex}
            onClose={() => setShowDiffPanel(false)}
            onRestore={(index) => {
              addSnapshot(snapshots[index].html, `Restored: ${snapshots[index].label}`);
              setShowDiffPanel(false);
            }}
          />
        </div>
      )}
      {/* Interactive particle constellation background */}
      <BuilderBackground isGenerating={status === "generating"} />

      {/* ── Top Bar ── minimal, dark, premium */}
      <div className="relative z-10 flex items-center h-12 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl px-3 gap-3">
        {/* Logo + branding */}
        <Link href="/" className="flex items-center gap-2 mr-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white/80 hidden sm:inline">Zoobicon</span>
        </Link>

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.08]" />

        {/* Project name / status */}
        <div className="flex items-center gap-2 min-w-0">
          {hasCode && (
            <span className="text-xs text-white/40 truncate max-w-[200px]">
              {prompt.trim().slice(0, 40) || "Untitled Project"}
            </span>
          )}
          {status === "generating" && (
            <div className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
              <span className="text-[11px] text-violet-400 font-medium">Building...</span>
            </div>
          )}
          {status === "complete" && hasCode && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-emerald-400/70">Ready</span>
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[11px] text-red-400/70">Error</span>
            </div>
          )}
        </div>

        {/* Undo / Redo — center area */}
        {hasCode && (
          <div className="flex items-center gap-0.5 ml-auto mr-auto">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Redo2 size={14} />
            </button>
            <button
              onClick={() => setShowDiffPanel(true)}
              disabled={snapshots.length < 2}
              title="Version History"
              className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <History size={14} />
            </button>
          </div>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          <CollaborationBar
            room={collab.room}
            participants={collab.participants}
            myColor={collab.myColor}
            isConnected={collab.isConnected}
            onCreateRoom={collab.createRoom}
            onJoinRoom={collab.joinRoom}
            onLeaveRoom={collab.leaveRoom}
            userEmail={userEmail}
          />
          {hasCode && (
            <>
              <button
                onClick={() => {
                  if (reactFiles && Object.keys(reactFiles).length > 0) {
                    try { localStorage.setItem("zoobicon_ide_files", JSON.stringify(reactFiles)); } catch { /* quota */ }
                  }
                  window.open("/builder/ide", "_blank");
                }}
                title="Open full code editor"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all bg-white/[0.05] text-white/50 hover:text-white/70 hover:bg-white/[0.08] border border-white/[0.06]"
              >
                <Code2 size={13} />
                <span className="hidden sm:inline">IDE</span>
              </button>
              <button
                onClick={() => setActiveTool(activeTool === "github-sync" ? null : "github-sync")}
                title="Push to GitHub"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                  activeTool === "github-sync"
                    ? "bg-white/[0.08] text-white/80 border-white/[0.12]"
                    : "bg-white/[0.05] text-white/50 hover:text-white/70 hover:bg-white/[0.08] border-white/[0.06]"
                }`}
              >
                <GitBranchPlus size={13} />
                <span className="hidden sm:inline">GitHub</span>
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saveStatus === "saving"}
                title="Save as reusable template"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all bg-white/[0.05] text-white/50 hover:text-white/70 hover:bg-white/[0.08] border border-white/[0.06]"
              >
                {saveStatus === "saved" ? <Check size={13} className="text-emerald-400" /> : <Save size={13} />}
                <span className="hidden sm:inline">{saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save"}</span>
              </button>
              <button
                onClick={() => setShowDeployModal(true)}
                disabled={isDeploying}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  isDeploying
                    ? "bg-violet-500/10 text-violet-300/50 cursor-wait border border-violet-500/20"
                    : "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 border border-violet-400/20"
                }`}
              >
                <Rocket size={13} className={isDeploying ? "animate-pulse" : ""} />
                {isDeploying ? "Deploying..." : "Deploy"}
              </button>
            </>
          )}
          {deployStatus === "deployed" && deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors px-2"
            >
              <Check size={12} />
              <span>Live</span>
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* ── Left Panel — Chat / Prompt ── */}
        <div className="w-[380px] min-w-[320px] flex flex-col border-r border-white/[0.06] bg-zinc-950/60 backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {!hasCode ? (
              <motion.div
                key="prompt-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                {/* Panel header */}
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  {generatorBanner ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-white/80">
                          {generatorBanner.name}
                        </span>
                      </div>
                      <button
                        onClick={() => setGeneratorBanner(null)}
                        className="text-white/30 hover:text-white/50 text-xs transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/15 to-purple-600/15 border border-violet-500/10 flex items-center justify-center">
                        <MessageSquare className="w-3 h-3 text-violet-400" />
                      </div>
                      <span className="text-xs font-medium text-white/50">
                        AI Website Builder
                      </span>
                    </div>
                  )}
                </div>

                {/* Context import strip */}
                {mcpContext && (
                  <div className="px-4 py-1.5 border-b border-white/[0.04] flex items-center gap-2 bg-indigo-500/[0.03]">
                    <span className="text-[10px] text-indigo-400/70">Context imported</span>
                    <button onClick={() => setActiveTool("mcp")} className="text-[10px] text-indigo-400/50 hover:text-indigo-400 transition-colors">Manage</button>
                  </div>
                )}
                {!mcpContext && !hasCode && (
                  <div className="px-4 py-1.5 border-b border-white/[0.04]">
                    <button onClick={() => setActiveTool("mcp")} className="flex items-center gap-1.5 text-[10px] text-white/25 hover:text-violet-400/70 transition-colors">
                      <ExternalLink size={10} />
                      Import from GitHub, Figma, or URL
                    </button>
                  </div>
                )}

                {/* Voice input */}
                <div className="px-4 pt-2 flex items-center justify-end">
                  <VoiceToBuildButton
                    size="sm"
                    onTranscript={(text) => {
                      if (hasCode) { setEditPrompt(text); } else { setPrompt(text); }
                    }}
                  />
                </div>

                {/* Prompt input area */}
                <div className="flex-1 overflow-hidden">
                  <PromptInput
                    prompt={prompt}
                    onPromptChange={setPrompt}
                    onGenerate={handleGenerate}
                    isGenerating={status === "generating"}
                    tier={tier}
                    onTierChange={setTier}
                    hasExistingCode={hasCode}
                    editPrompt={editPrompt}
                    onEditPromptChange={setEditPrompt}
                    onEdit={handleEdit}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    availableModels={availableModels}
                    generationMode={generationMode}
                    onGenerationModeChange={setGenerationMode}
                    fullStack={fullStack}
                    onFullStackChange={setFullStack}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                {/* Chat header */}
                <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-violet-500/10 flex items-center justify-center">
                      <MessageSquare className="w-3 h-3 text-violet-400" />
                    </div>
                    <span className="text-xs font-medium text-white/50">Chat</span>
                  </div>
                  <button
                    onClick={handleNewSite}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                  >
                    <Plus size={12} />
                    New
                  </button>
                </div>

                {/* Chat messages + edit input */}
                <div className="flex-1 overflow-hidden">
                  <ChatPanel
                    reactFiles={reactFiles}
                    onFilesUpdate={(changedFiles) => {
                      setReactFiles(prev => {
                        const merged = { ...prev, ...changedFiles };
                        setReactSource(merged);
                        return merged;
                      });
                      setStatus("complete");
                      pendingLabelRef.current = `Edit: ${Object.keys(changedFiles).join(", ")}`;
                    }}
                    isVisible={true}
                    isGenerating={status === "generating"}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center panel — Preview / Code */}
        <div className="flex-1 flex flex-col bg-[#050508]/80 backdrop-blur-sm">
          {/* Tabs — Premium UI */}
          <div className="flex items-center border-b border-white/[0.06] px-3 bg-[#0a0a12]/50">
            <div className="flex items-center gap-1 mr-4">
              {(["preview", "code", ...(hasCode ? ["seo"] : [])] as const).map(tab => (
                <button
                  key={tab}
                  className={`px-4 py-2.5 text-xs font-medium transition-all rounded-t-lg ${
                    activeTab === tab
                      ? "bg-white/[0.06] text-white border-b-2 border-violet-500"
                      : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
                  }`}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                >
                  {tab === "preview" ? "Preview" : tab === "code" ? "Code" : "SEO"}
                </button>
              ))}
            </div>

            {/* Undo / Redo */}
            {hasCode && (
              <div className="flex items-center gap-0.5 ml-3 border-l border-white/[0.10] pl-3">
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                  className="p-1.5 rounded text-white/50 hover:text-white/60 hover:bg-white/[0.07] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <Undo2 size={14} />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  title="Redo (Ctrl+Shift+Z)"
                  className="p-1.5 rounded text-white/50 hover:text-white/60 hover:bg-white/[0.07] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <Redo2 size={14} />
                </button>
                <button
                  onClick={() => setShowDiffPanel(true)}
                  disabled={snapshots.length < 2}
                  title="Version History"
                  className="p-1.5 rounded text-white/50 hover:text-white/60 hover:bg-white/[0.07] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <History size={14} />
                </button>
              </div>
            )}

            {/* Deploy button */}
            {hasCode && (
              <div className="ml-auto flex items-center gap-2 pr-3">
                {deployStatus === "deployed" && deployUrl && (
                  <div className="flex items-center gap-3">
                    <a
                      href={deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Check size={14} />
                      <span>Live</span>
                      <ExternalLink size={12} />
                    </a>
                    {(() => {
                      try {
                        const u = localStorage.getItem("zoobicon_user");
                        const parsed = u ? JSON.parse(u) : null;
                        const isPaid = parsed?.plan === "unlimited" || parsed?.plan === "pro" || parsed?.plan === "premium" || parsed?.role === "admin";
                        if (!isPaid) {
                          return (
                            <a href="/pricing" className="text-[10px] text-amber-400/60 hover:text-amber-400 transition-colors">
                              7-day free preview — Upgrade to keep
                            </a>
                          );
                        }
                      } catch { /* ignore */ }
                      return null;
                    })()}
                  </div>
                )}
                <button
                  onClick={() => {
                    if (reactFiles && Object.keys(reactFiles).length > 0) {
                      try {
                        localStorage.setItem("zoobicon_ide_files", JSON.stringify(reactFiles));
                      } catch { /* quota */ }
                    }
                    window.open("/builder/ide", "_blank");
                  }}
                  title="Open full code editor"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-white/[0.07] text-white/60 hover:text-white/60 hover:bg-white/[0.08]"
                >
                  <Code2 size={14} />
                  IDE
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === "github-sync" ? null : "github-sync")}
                  title="Push to GitHub"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTool === "github-sync"
                      ? "bg-white/10 text-white/80"
                      : "bg-white/[0.07] text-white/60 hover:text-white/60 hover:bg-white/[0.08]"
                  }`}
                >
                  <GitBranchPlus size={14} />
                  GitHub
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saveStatus === "saving"}
                  title="Save as reusable template"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-white/[0.07] text-white/60 hover:text-white/60 hover:bg-white/[0.08]"
                >
                  {saveStatus === "saved" ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
                  {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save"}
                </button>
                <button
                  onClick={() => setShowDeployModal(true)}
                  disabled={isDeploying}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isDeploying
                      ? "bg-amber-500/10 text-amber-400/50 cursor-wait"
                      : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20"
                  }`}
                >
                  <Rocket size={14} className={isDeploying ? "animate-pulse" : ""} />
                  {isDeploying ? "Deploying..." : "Deploy"}
                </button>
              </div>
            )}

            {status === "error" && !hasCode && (
              <span className="ml-auto text-xs text-red-400 pr-3">
                {error}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden relative">
            {status === "error" && error && !hasCode ? (
              <div className="h-full flex items-center justify-center bg-[#050508]">
                <div className="max-w-md text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-red-300 mb-2">Generation Failed</h3>
                  <p className="text-red-200/50 text-sm mb-6 leading-relaxed">{error}</p>
                  <button
                    onClick={() => { setError(""); setStatus("idle"); }}
                    className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : status === "generating" ? (
              <div className="h-full flex flex-col items-center justify-center bg-[#050508] relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-[120px] animate-pulse" />
                  <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
                </div>
                <div className="relative z-10 text-center px-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-violet-500/30">
                    <Sparkles className="w-10 h-10 text-white animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Building your website</h3>
                  <p className="text-white/40 text-sm mb-8 max-w-sm">AI is generating production-ready React components with TypeScript and Tailwind CSS</p>
                  <div className="flex flex-col items-center gap-3">
                    {pipelineAgents.slice(-3).map((msg, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs ${i === pipelineAgents.length - 1 ? "text-violet-400" : "text-white/30"}`}>
                        {i === pipelineAgents.slice(-3).length - 1 ? (
                          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                        ) : (
                          <Check size={12} className="text-emerald-400" />
                        )}
                        {msg}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === "preview" && !hasCode ? (
              <div className="h-full relative overflow-hidden bg-[#050508]">
                {/*
                  PRE-WARM: Mount Sandpack in the background (hidden behind the welcome screen)
                  so the bundler, iframe, Tailwind CDN, and react-ts deps all initialize before
                  the user submits a prompt. When real files arrive the swap is instant instead
                  of paying a 20-30s cold start. SandpackPreview's own pre-warm path supplies a
                  minimal placeholder app when files are empty.
                */}
                <div className="absolute inset-0 opacity-0 pointer-events-none" aria-hidden="true">
                  <SandpackPreview
                    mode="react"
                    files={{}}
                    dependencies={reactDeps}
                    showEditor={false}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Subtle background glow */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-violet-600/3 blur-[150px]" />
                  </div>
                  <div className="relative z-10 text-center px-6 max-w-lg">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-700/20 border border-violet-500/10 mx-auto mb-8 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-violet-400/50" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Describe your dream website</h2>
                    <p className="text-white/30 text-sm mb-8 leading-relaxed">
                      Type a description in the prompt panel and click Build. Our AI will generate a complete, production-ready React application in under 60 seconds.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {["SaaS Landing", "Restaurant", "Portfolio", "E-Commerce", "Agency"].map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/30">{tag}</span>
                      ))}
                    </div>
                    <div className="mt-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-400/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Sandbox pre-warmed · instant preview ready
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "preview" ? (
              <div ref={previewContainerRef} className="relative h-full">
                <PreviewSwitcher
                  useWebContainers={useWebContainers}
                  onWebContainersFail={handleWebContainersFail}
                  files={reactFiles || {}}
                  reactDeps={reactDeps}
                />
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setUseWebContainers((v) => !v)}
                    className="absolute top-2 right-2 z-50 px-2 py-1 text-[10px] rounded bg-black/70 text-white border border-white/20"
                  >
                    Preview: {useWebContainers ? "WebContainers" : "Sandpack"}
                  </button>
                )}
                {collab.isConnected && (
                  <CursorOverlay
                    participants={collab.participants}
                    containerRect={previewRect}
                  />
                )}
                {status === "generating" && pipelineAgents.length > 0 && (
                  <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-none">
                    <div className="max-w-lg mx-auto px-4 py-3 rounded-xl bg-black/70 backdrop-blur-xl border border-white/[0.08] shadow-2xl pointer-events-auto">
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse flex-shrink-0" />
                        <span className="text-xs text-white/80 font-medium truncate">
                          {pipelineAgents[pipelineAgents.length - 1]}
                        </span>
                        {buildProgress && buildProgress.total > 0 && (
                          <span className="text-[10px] text-white/40 ml-auto flex-shrink-0 tabular-nums">
                            {buildProgress.current}/{buildProgress.total}
                          </span>
                        )}
                      </div>
                      {buildProgress && buildProgress.total > 0 && (
                        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-out"
                            style={{ width: `${Math.round((buildProgress.current / buildProgress.total) * 100)}%` }}
                          />
                        </div>
                      )}
                      {streamWarning && (
                        <div className="flex items-center gap-2 text-[10px] text-amber-400 mb-2">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{streamWarning}</span>
                        </div>
                      )}
                      {sectionTimeline.length > 0 && (
                        <div ref={timelineScrollRef} className="max-h-32 overflow-y-auto space-y-1 pr-1">
                          {sectionTimeline.map((s) => {
                            const elapsed = s.finishedAt ? ((s.finishedAt - s.startedAt) / 1000).toFixed(1) : null;
                            return (
                              <div key={s.section} className="flex items-center gap-2 text-[10px]">
                                {s.status === "done" ? (
                                  <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                ) : s.status === "customizing" || s.status === "scaffolding" ? (
                                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse flex-shrink-0" />
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-white/30 flex-shrink-0" />
                                )}
                                <span className={s.status === "done" ? "text-white/60" : "text-white/90"}>{s.label}</span>
                                {elapsed && <span className="text-white/30 ml-auto tabular-nums">{elapsed}s</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {buildError && (
                  <div className="absolute top-4 left-4 right-4 z-40">
                    <div className="max-w-2xl mx-auto px-4 py-3 rounded-xl bg-red-950/90 backdrop-blur-xl border border-red-500/40 shadow-2xl">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-red-200">{buildError.message}</div>
                          <div className="text-xs text-red-300/80 mt-0.5">{buildError.suggestion}</div>
                        </div>
                        <button
                          onClick={() => { setBuildError(null); handleGenerate(); }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs text-red-100 border border-red-500/40 transition"
                        >
                          <RotateCcw className="w-3 h-3" /> Retry
                        </button>
                        <button
                          onClick={() => setBuildError(null)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-300 transition"
                          aria-label="Dismiss"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === "seo" ? (
              <SeoPreview html={generatedCode} />
            ) : (
              <CodePanel html={generatedCode} reactSource={reactSource} />
            )}
          </div>
        </div>

        {/* Tool panel (slides open when a tool is active) */}
        {activeTool && (
          <div className="w-[380px] flex flex-col border-l border-white/[0.08] bg-[#0a0a0f]/90 backdrop-blur-sm animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.10]">
              <span className="text-[11px] uppercase tracking-[2px] text-brand-400/50">
                {activeToolLabel}
              </span>
              <button
                onClick={() => setActiveTool(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderToolPanel()}</div>
          </div>
        )}

        {/* Right toolbar — Tool icons */}
        <div className="w-12 flex flex-col items-center py-2 gap-1 border-l border-white/[0.08] bg-[#0a0a0f]/90 backdrop-blur-sm">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => toggleTool(tool.id)}
              title={tool.label}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150 ${
                activeTool === tool.id
                  ? "bg-brand-500/20 text-brand-400 shadow-glow"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              {tool.icon}
            </button>
          ))}
        </div>
      </div>

      <StatusBar status={status} pipelineStep={pipelineAgents.length > 0 ? pipelineAgents[pipelineAgents.length - 1] : undefined} />

      <OnboardingTooltips active={showTour} />
      <DomainHookModal
        open={domainHookOpen}
        onClose={() => setDomainHookOpen(false)}
        siteName={siteNameForHook}
        generatedFiles={reactFiles || undefined}
      />
      <BuildSuccessModal
        isOpen={showBuildSuccess}
        onClose={() => { setShowBuildSuccess(false); dismissBuildSuccess(); }}
        onAction={(action) => {
          setShowBuildSuccess(false);
          dismissBuildSuccess();
          if (action === "deploy") handleDeploy();
          // "chat" — ChatPanel is always visible in the left sidebar, no action needed
        }}
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        siteUrl={deployUrl}
        siteName={prompt.trim().slice(0, 50) || "My Site"}
      />
      <DeployModal
        isOpen={showDeployModal}
        onClose={() => {
          setShowDeployModal(false);
          // If deploy succeeded, show share modal
          if (deployStatus === "deployed" && deployUrl) {
            setShowShareModal(true);
          }
        }}
        onDeploy={handleDeployWithName}
        defaultName={prompt.trim().slice(0, 50) || "My Site"}
      />
    </div>
  );
}
