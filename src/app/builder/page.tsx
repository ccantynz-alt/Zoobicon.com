"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import TopBar from "@/components/TopBar";
import PromptInput from "@/components/PromptInput";
import type { Tier, AIModel } from "@/components/PromptInput";
import PreviewPanel from "@/components/PreviewPanel";
import CodePanel from "@/components/CodePanel";
import ChatPanel from "@/components/ChatPanel";
import StatusBar from "@/components/StatusBar";

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
import MultiPagePanel from "@/components/MultiPagePanel";
import FullStackPanel from "@/components/FullStackPanel";
import EmailTemplatePanel from "@/components/EmailTemplatePanel";
import ClonePanel from "@/components/ClonePanel";
import AiImagesPanel from "@/components/AiImagesPanel";
import PipelinePanel from "@/components/PipelinePanel";

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
} from "lucide-react";

type BuildStatus = "idle" | "generating" | "editing" | "complete" | "error";
type RightTab = "preview" | "code";
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
  | "multipage"
  | "fullstack"
  | "email"
  | null;

const TOOLS: { id: Exclude<ToolId, null>; label: string; icon: React.ReactNode }[] = [
  { id: "pipeline", label: "Agent Pipeline", icon: <Workflow size={18} /> },
  { id: "clone", label: "Clone Site", icon: <Globe size={18} /> },
  { id: "ai-images", label: "AI Images", icon: <ImagePlus size={18} /> },
  { id: "fullstack", label: "Full-Stack App", icon: <Boxes size={18} /> },
  { id: "multipage", label: "Multi-Page", icon: <FileText size={18} /> },
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
  { id: "wordpress", label: "WordPress Export", icon: <FileArchive size={18} /> },
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
        hue: 210 + Math.random() * 30, // blue range
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
            const hue = gen ? 200 + Math.sin(time * 0.02) * 20 : 220;
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
            ctx.strokeStyle = `hsla(200, 90%, 70%, ${alpha})`;
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
        ringGlow.addColorStop(0, "hsla(210, 90%, 60%, 0)");
        ringGlow.addColorStop(0.5, `hsla(210, 90%, 60%, ${0.04 + Math.sin(time * 0.05) * 0.02})`);
        ringGlow.addColorStop(1, "hsla(210, 90%, 60%, 0)");
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

export default function BuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [status, setStatus] = useState<BuildStatus>("idle");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<RightTab>("preview");
  const [activeTool, setActiveTool] = useState<ToolId>(null);
  const [tier, setTier] = useState<Tier>("premium");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState("");
  const [deployStatus, setDeployStatus] = useState<"idle" | "deploying" | "deployed" | "error">("idle");
  const [pipelineAgents, setPipelineAgents] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");  // Empty = use pipeline's smart routing (Haiku/Opus/Sonnet)
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const hasCode = generatedCode.length > 0;

  // Admin always gets premium tier locked
  useEffect(() => {
    try {
      const user = localStorage.getItem("zoobicon_user");
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.role === "admin" || parsed.plan === "unlimited") {
          setTier("premium");
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

  // Auto-replace picsum placeholder images with contextually relevant ones
  const autoReplaceImages = useCallback(async (html: string): Promise<string> => {
    // Only replace if HTML contains picsum placeholder images
    if (!html.includes("picsum.photos")) return html;
    try {
      const res = await fetch("/api/generate/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userPrompt,
            tier,
            ...(existingCode ? { existingCode } : {}),
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          // Fallback to non-streaming endpoint
          const fallbackRes = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: userPrompt,
              tier,
              ...(existingCode ? { existingCode } : {}),
            }),
          });
          if (!fallbackRes.ok) {
            const data = await fallbackRes.json();
            throw new Error(data.error || "Generation failed");
          }
          const data = await fallbackRes.json();
          let fbHtml = (data.html || "").trim();
          fbHtml = fbHtml.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
          const fbStart = fbHtml.search(/<!doctype\s+html|<html/i);
          if (fbStart > 0) fbHtml = fbHtml.slice(fbStart);
          const fbEnd = fbHtml.lastIndexOf("</html>");
          if (fbEnd !== -1) fbHtml = fbHtml.slice(0, fbEnd + "</html>".length);
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

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "chunk" && event.content) {
                accumulated += event.content;
                setGeneratedCode(accumulated);
              } else if (event.type === "done") {
                setStatus("complete");
              } else if (event.type === "error") {
                throw new Error(event.message || "Stream error");
              }
            } catch (parseErr) {
              // Skip malformed SSE lines
            }
          }
        }

        if (accumulated) {
          // Clean accumulated HTML — strip code fences, preamble
          let clean = accumulated.trim();
          clean = clean.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
          const ds = clean.search(/<!doctype\s+html|<html/i);
          if (ds > 0) clean = clean.slice(ds);
          const he = clean.lastIndexOf("</html>");
          if (he !== -1) clean = clean.slice(0, he + "</html>".length);
          setGeneratedCode(clean);
          setStatus("complete");
          // Auto-replace placeholder images
          autoReplaceImages(clean).then((improved) => {
            if (improved !== clean) setGeneratedCode(improved);
          });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStatus("error");
      }
    },
    [tier, autoReplaceImages]
  );

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    // Use the full 10-agent pipeline for new builds
    setStatus("generating");
    setError("");
    setGeneratedCode("");
    setActiveTab("preview");
    setPipelineAgents([]);

    try {
      // Show pipeline progress in status
      const agentSteps = [
        "Strategist analyzing market...",
        "Brand Designer + Copywriter working...",
        "Architect planning structure...",
        "Developer building website (Opus)...",
        "Animation + SEO + Forms enhancing...",
        "Integrations agent adding features...",
        "QA reviewing quality...",
      ];
      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < agentSteps.length) {
          setPipelineAgents(prev => [...prev, agentSteps[stepIndex]]);
          stepIndex++;
        }
      }, 8000);

      const res = await fetch("/api/generate/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: "modern",
          tier,
          model: selectedModel,
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Pipeline failed");
      }

      const data = await res.json();
      setPipelineAgents(
        (data.agents || []).map((a: { name: string; duration: number }) =>
          `${a.name} — ${(a.duration / 1000).toFixed(1)}s`
        )
      );

      // Client-side HTML safety net — ensure clean HTML reaches preview
      let finalHtml = (data.html || "").trim();
      // Strip code fences if model wrapped output
      finalHtml = finalHtml.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
      // Extract from <!DOCTYPE or <html to </html>
      const docStart = finalHtml.search(/<!doctype\s+html|<html/i);
      if (docStart > 0) finalHtml = finalHtml.slice(docStart);
      const htmlEnd = finalHtml.lastIndexOf("</html>");
      if (htmlEnd !== -1) finalHtml = finalHtml.slice(0, htmlEnd + "</html>".length);

      console.log("[Pipeline] HTML length:", finalHtml.length, "starts with:", finalHtml.substring(0, 50));
      setGeneratedCode(finalHtml);
      setStatus("complete");

      // Auto-replace placeholder images with contextually relevant ones
      autoReplaceImages(finalHtml).then((improved) => {
        if (improved !== finalHtml) setGeneratedCode(improved);
      });
    } catch (err) {
      // Fallback to streaming endpoint if pipeline fails
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn("[Pipeline] Failed, falling back to stream:", errMsg);
      setPipelineAgents([`Pipeline fallback — generating directly (${errMsg})`]);

      try {
        await streamGenerate(prompt.trim());
      } catch (streamErr) {
        // If stream also fails, show a clear error instead of white screen
        console.error("[Stream fallback] Also failed:", streamErr);
        setError(
          "Generation temporarily unavailable. Please try again in a moment."
        );
        setStatus("idle");
      }
    }
  }, [prompt, tier, streamGenerate, autoReplaceImages]);

  const handleEdit = useCallback(async () => {
    if (!editPrompt.trim() || !generatedCode) return;
    await streamGenerate(editPrompt.trim(), generatedCode);
    setEditPrompt("");
  }, [editPrompt, generatedCode, streamGenerate]);

  const handleCodeUpdate = useCallback((newCode: string) => {
    setGeneratedCode(newCode);
    setStatus("complete");
    setActiveTab("preview");
  }, []);

  const handleNewSite = useCallback(() => {
    setGeneratedCode("");
    setPrompt("");
    setStatus("idle");
    setError("");
    setActiveTool(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deploy failed");
      setDeployStatus("error");
    } finally {
      setIsDeploying(false);
    }
  }, [generatedCode, isDeploying, prompt]);

  const toggleTool = useCallback((toolId: Exclude<ToolId, null>) => {
    setActiveTool((prev) => (prev === toolId ? null : toolId));
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
        return <ExportPanel code={generatedCode} />;
      case "variants":
        return <VariantsPanel code={generatedCode} onApplyVariant={handleCodeUpdate} />;
      case "multipage":
        return <MultiPagePanel onApplyPage={handleCodeUpdate} />;
      case "fullstack":
        return <FullStackPanel onApplyCode={handleCodeUpdate} />;
      case "email":
        return <EmailTemplatePanel onApplyCode={handleCodeUpdate} />;
      default:
        return null;
    }
  };

  const activeToolLabel = TOOLS.find((t) => t.id === activeTool)?.label ?? "";

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Interactive particle constellation background */}
      <BuilderBackground isGenerating={status === "generating"} />

      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Prompt (before generation) or Chat editor (after) */}
        <div className="w-[400px] min-w-[340px] flex flex-col border-r border-white/[0.06] bg-[#12121a]">
          {!hasCode ? (
            <>
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <span className="text-[11px] uppercase tracking-[2px] text-brand-400/50">
                  Prompt
                </span>
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
                />
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
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
        <div className="flex-1 flex flex-col bg-[#0a0a0f]/80 backdrop-blur-sm">
          {/* Tabs */}
          <div className="flex items-center border-b border-white/[0.06] px-2">
            <button
              className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === "preview"
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-white/30 hover:text-white/50"
              }`}
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </button>
            <button
              className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === "code"
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-white/30 hover:text-white/50"
              }`}
              onClick={() => setActiveTab("code")}
            >
              Code
            </button>

            {/* Deploy button */}
            {hasCode && (
              <div className="ml-auto flex items-center gap-2 pr-3">
                {deployStatus === "deployed" && deployUrl && (
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
                )}
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
            {activeTab === "preview" ? (
              <PreviewPanel
                html={generatedCode}
                isGenerating={status === "generating"}
              />
            ) : (
              <CodePanel html={generatedCode} />
            )}
          </div>
        </div>

        {/* Tool panel (slides open when a tool is active) */}
        {activeTool && (
          <div className="w-[380px] flex flex-col border-l border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-sm animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
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
        <div className="w-12 flex flex-col items-center py-2 gap-1 border-l border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-sm">
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
    </div>
  );
}
