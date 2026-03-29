"use client";

import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getGeneratorDef } from "@/lib/generator-prompts";
import TopBar from "@/components/TopBar";
import PromptInput from "@/components/PromptInput";
import type { Tier, AIModel, GenerationMode } from "@/components/PromptInput";
import dynamic from "next/dynamic";

const SandpackPreview = dynamic(() => import("@/components/SandpackPreview"), { ssr: false });
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
import { trackEvent } from "@/lib/achievements";
import { notifyDeploy } from "@/lib/notifications";

import {
  Bug,
  Github,
  Languages,
  FileArchive,
  Database,
  Wand2,
  ShoppingCart,
  Users,
  Figma,
  Search,
  X,
  Rocket,
  Check,
  ExternalLink,
  Shield,
  Accessibility,
  Gauge,
  Download,
  Layers,
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
  { id: "debug", label: "Auto Debug", icon: <Bug size={18} /> },
  { id: "seo", label: "SEO Score", icon: <Search size={18} /> },
  { id: "animations", label: "Animations", icon: <Wand2 size={18} /> },
  { id: "ecommerce", label: "E-commerce", icon: <ShoppingCart size={18} /> },
  { id: "crm", label: "CRM", icon: <Users size={18} /> },
  { id: "scaffold", label: "Scaffolding", icon: <Database size={18} /> },
  { id: "translate", label: "Translate", icon: <Languages size={18} /> },
  { id: "github", label: "GitHub Import", icon: <Github size={18} /> },
  { id: "figma", label: "Figma Import", icon: <Figma size={18} /> },
  { id: "wordpress", label: "Zoobicon Connect", icon: <FileArchive size={18} /> },
  { id: "project", label: "Project Mode", icon: <FolderTree size={18} /> },
  { id: "crawl", label: "Crawl Competitor", icon: <Eye size={18} /> },
  { id: "mcp", label: "MCP Context", icon: <ExternalLink size={18} /> },
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
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState("");
  const [deployStatus, setDeployStatus] = useState<"idle" | "deploying" | "deployed" | "error">("idle");
  const [showShareModal, setShowShareModal] = useState(false);
  const [pipelineAgents, setPipelineAgents] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");  // Empty = use pipeline's smart routing (Haiku/Opus/Sonnet)
  const [instantMode, setInstantMode] = useState(false); // Default to full AI generation for premium quality
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [reactSource, setReactSource] = useState<Record<string, string> | null>(null);
  const [reactFiles, setReactFiles] = useState<Record<string, string> | null>(null);
  const [reactDeps, setReactDeps] = useState<Record<string, string>>({});
  const [generationMode, setGenerationMode] = useState<GenerationMode>("react");
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
  const hasCode = generatedCode.length > 0;

  // Get user email for auth headers
  const getUserEmail = useCallback(() => {
    try {
      const u = localStorage.getItem("zoobicon_user");
      if (u) return JSON.parse(u).email || "";
    } catch {}
    return "";
  }, []);

  const authHeaders = useCallback(() => {
    const email = getUserEmail();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (email) headers["x-user-email"] = email;
    return headers;
  }, [getUserEmail]);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

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

  const streamGenerate = useCallback(
    async (userPrompt: string, existingCode?: string) => {
      setStatus("generating");
      setError("");
      if (!existingCode) setGeneratedCode("");
      setActiveTab("preview");

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/generate/stream", {
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
          const fallbackRes = await fetch("/api/generate", {
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

        if (streamAborted) {
          // edit_failed or error already handled — don't process accumulated HTML
          return;
        }

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
              const retryRes = await fetch("/api/generate", {
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
          setStatus("complete");
          trackEvent("build");
          // Auto-replace placeholder images
          autoReplaceImages(clean).then((improved) => {
            if (improved !== clean) setGeneratedCode(improved);
          });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(cleanErrorMessage(err instanceof Error ? err.message : "Something went wrong"));
        setStatus("error");
      }
    },
    [tier, autoReplaceImages, selectedModel]
  );

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

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
    pendingLabelRef.current = `Build: ${prompt.trim().slice(0, 50)}`;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // ── React App mode: instant template snapshot + AI customization ──
    if (generationMode === "react") {
      // Phase 1: Load premium template snapshot instantly (<1 second)
      try {
        const { findBestTemplate } = await import("@/lib/snapshots");
        const template = findBestTemplate(prompt.trim());
        setReactFiles(template.files);
        setReactDeps({});
        setStatus("generating");
        setPipelineAgents([`Template loaded: ${template.name} — customizing with AI...`]);
      } catch {
        // Fallback to basic scaffold if snapshots fail
        try {
          const { classifyIndustry, getScaffoldForIndustry } = await import("@/lib/react-scaffolds");
          const industry = classifyIndustry(prompt.trim());
          const { files: scaffoldFiles } = getScaffoldForIndustry(industry);
          setReactFiles(scaffoldFiles);
          setReactDeps({});
          setStatus("generating");
          setPipelineAgents(["Scaffold loaded — customizing with AI..."]);
        } catch {
          setPipelineAgents(["Generating React components..."]);
        }
      }

      // Phase 2: AI generates custom components (replaces scaffold)
      try {
        const res = await fetch("/api/generate/react", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            prompt: prompt.trim(),
            tier,
            ...(selectedModel ? { model: selectedModel } : {}),
            ...(generatorBanner ? { generator: generatorBanner.id } : {}),
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!data.files || !data.files["App.tsx"]) {
          throw new Error("React generation returned invalid response. Please try again.");
        }

        if (generationIdRef.current === currentGenId) {
          setReactFiles(data.files);
          setReactDeps(data.dependencies || {});
          setReactSource(data.files);
          // Set generatedCode to a marker so hasCode is true (enables deploy/save/tabs)
          setGeneratedCode("<!-- react-app-mode -->");
          setStatus("complete");
          setPipelineAgents(prev => [...prev, `Generated ${Object.keys(data.files).length} React files`]);
          trackEvent("build");
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[React Generate] Failed:", errMsg);
        setGeneratedCode("");
        setReactFiles(null);
        setError(cleanErrorMessage(errMsg));
        setStatus("error");
      }
      return;
    }
  }, [prompt, tier, autoReplaceImages, selectedModel, instantMode, generationMode]);

  const handleEdit = useCallback(async () => {
    if (!editPrompt.trim() || !generatedCode) return;

    const instruction = editPrompt.trim();
    setStatus("generating");
    setError("");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Try diff-based edit first (5-10x faster than full rewrite)
      const res = await fetch("/api/generate/edit-diff", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          prompt: instruction,
          existingCode: generatedCode,
          ...(selectedModel ? { model: selectedModel } : {}),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // Diff endpoint failed — fall back to full rewrite
        throw new Error("Diff endpoint unavailable");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let lineBuffer = "";
      let modifiedHtml = generatedCode;
      let usedFallback = false;
      let diffCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        lineBuffer += text;
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "diff" && event.search && event.replace !== undefined) {
              // Apply diff to the HTML
              const before = modifiedHtml;
              modifiedHtml = modifiedHtml.replace(event.search, event.replace);
              if (modifiedHtml !== before) {
                diffCount++;
                setGeneratedCode(modifiedHtml); // Live update preview
              }
            } else if (event.type === "fallback" && event.html) {
              // Full HTML fallback from server
              modifiedHtml = event.html;
              usedFallback = true;
            } else if (event.type === "done") {
              // Diff complete
              console.log(`[Edit-Diff] ${event.diffCount || diffCount} diffs applied${event.fallback ? " (fallback)" : ""}`);
            } else if (event.type === "error") {
              throw new Error(event.message || "Edit error");
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue; // Skip malformed SSE
            throw e;
          }
        }
      }

      // Create a labeled snapshot for this edit
      pendingLabelRef.current = `Edit: ${instruction.slice(0, 50)}`;
      setGeneratedCode(modifiedHtml);
      setStatus("complete");
      setEditPrompt("");

      const method = usedFallback ? "full rewrite" : `${diffCount} diffs`;
      setPipelineAgents(prev => [...prev, `Edit applied (${method})`]);

    } catch (err) {
      if ((err as Error).name === "AbortError") return;

      // Fall back to stream-based full rewrite
      console.warn("[Edit] Diff failed, falling back to full rewrite:", err instanceof Error ? err.message : err);
      pendingLabelRef.current = `Edit: ${instruction.slice(0, 50)}`;
      await streamGenerate(instruction, generatedCode);
      setEditPrompt("");
    }
  }, [editPrompt, generatedCode, streamGenerate, selectedModel]);

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

  const handleDeploy = useCallback(async () => {
    if (!generatedCode || isDeploying) return;

    setIsDeploying(true);
    setDeployStatus("deploying");

    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("zoobicon_user") : null;
      const user = userStr ? JSON.parse(userStr) : null;
      const email = user?.email || "anonymous@zoobicon.com";
      const siteName = prompt.trim().slice(0, 50) || "My Site";

      const res = await fetch("/api/hosting/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: siteName, email, code: generatedCode }),
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

      // Show share modal after successful deploy
      setShowShareModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deploy failed");
      setDeployStatus("error");
    } finally {
      setIsDeploying(false);
    }
  }, [generatedCode, isDeploying, prompt]);

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

        {/* Pipeline status overlay — shows during generation */}
        {status === "generating" && pipelineAgents.length > 0 && (
          <div className="absolute bottom-6 left-6 right-6 z-40">
            <div className="max-w-xl mx-auto px-5 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-sm text-white/80 font-medium">
                  {pipelineAgents[pipelineAgents.length - 1]}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen preview */}
        <SandpackPreview
          mode="react"
          files={reactFiles || {}}
          dependencies={reactDeps}
          showEditor={false}
        />

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
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                }`}
                title={instantMode ? "Quick: 3s scaffold preview (lower quality)" : "Premium: full AI generation (best quality)"}
              >
                {instantMode ? "⚡ Quick" : "✨ Premium"}
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
    <div className="flex flex-col h-screen bg-[#050508] relative overflow-hidden">
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

      <div className="flex items-center border-b border-white/[0.08]">
        <div className="flex-1"><TopBar /></div>
        <div className="px-3">
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
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Prompt (before generation) or Chat editor (after) */}
        <div className="w-[400px] min-w-[340px] flex flex-col border-r border-white/[0.08] bg-[#0a0a0f]">
          {!hasCode ? (
            <>
              <div className="px-4 py-3 border-b border-white/[0.10]">
                {generatorBanner ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                      <span className="text-[11px] uppercase tracking-[2px] text-brand-400">
                        {generatorBanner.name} Generator
                      </span>
                    </div>
                    <button
                      onClick={() => setGeneratorBanner(null)}
                      className="text-white/50 hover:text-white/60 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] uppercase tracking-[2px] text-brand-400/50">
                    Prompt
                  </span>
                )}
              </div>
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
                />
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-white/[0.10] flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[2px] text-brand-400/50">
                  AI Editor
                </span>
                <button
                  onClick={handleNewSite}
                  className="text-[10px] uppercase tracking-wider text-red-400/60 hover:text-red-400 transition-colors"
                >
                  New Site
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatPanel
                  currentCode={generatedCode}
                  onCodeUpdate={handleCodeUpdate}
                  isVisible={true}
                />
              </div>
            </>
          )}
        </div>

        {/* Center panel — Preview / Code */}
        <div className="flex-1 flex flex-col bg-[#050508]/80 backdrop-blur-sm">
          {/* Tabs */}
          <div className="flex items-center border-b border-white/[0.10] px-2">
            <button
              className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === "preview"
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-white/50 hover:text-white/65"
              }`}
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </button>
            <button
              className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === "code"
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-white/50 hover:text-white/65"
              }`}
              onClick={() => setActiveTab("code")}
            >
              Code
            </button>
            {hasCode && (
              <button
                className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                  activeTab === "seo"
                    ? "border-brand-500 text-brand-400"
                    : "border-transparent text-white/50 hover:text-white/65"
                }`}
                onClick={() => setActiveTab("seo")}
              >
                SEO
              </button>
            )}

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
                  onClick={handleSaveTemplate}
                  disabled={saveStatus === "saving"}
                  title="Save as reusable template"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-white/[0.07] text-white/60 hover:text-white/60 hover:bg-white/[0.08]"
                >
                  {saveStatus === "saved" ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
                  {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save"}
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isDeploying
                      ? "bg-brand-500/10 text-brand-400/50 cursor-wait"
                      : "bg-brand-500/20 text-brand-400 hover:bg-brand-500/30"
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
              <div className="h-full flex items-center justify-center bg-gray-950">
                <div className="max-w-md text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  </div>
                  <p className="text-red-300 text-sm font-medium mb-2">Generation Failed</p>
                  <p className="text-red-200/60 text-xs mb-4">{error}</p>
                  <button
                    onClick={() => { setError(""); setStatus("idle"); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : activeTab === "preview" ? (
              <div ref={previewContainerRef} className="relative h-full">
                <SandpackPreview
                  mode="react"
                  files={reactFiles || {}}
                  dependencies={reactDeps}
                  showEditor={false}
                />
                {collab.isConnected && (
                  <CursorOverlay
                    participants={collab.participants}
                    containerRect={previewRect}
                  />
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
    </div>
  );
}
