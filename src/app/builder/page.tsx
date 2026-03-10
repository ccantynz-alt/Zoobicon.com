"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import TopBar from "@/components/TopBar";
import PromptInput from "@/components/PromptInput";
import type { Tier } from "@/components/PromptInput";
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
          setGeneratedCode(data.html);
          setStatus("complete");
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

        if (accumulated) setStatus("complete");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStatus("error");
      }
    },
    [tier]
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
      setGeneratedCode(data.html);
      setStatus("complete");
    } catch (err) {
      // Fallback to streaming Opus endpoint if pipeline fails
      setPipelineAgents([]);
      await streamGenerate(prompt.trim());
    }
  }, [prompt, tier, streamGenerate]);

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
      {/* Ambient atmospheric background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep base gradient */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 80%, rgba(37,99,235,0.04) 0%, transparent 60%)" }} />

        {/* Slow-drifting aurora along the top edge */}
        <div
          className="absolute -top-20 -left-[10%] w-[120%] h-[200px]"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.06) 30%, rgba(14,165,233,0.08) 50%, rgba(37,99,235,0.04) 70%, transparent)",
            filter: "blur(60px)",
            animation: "builder-aurora 25s ease-in-out infinite",
          }}
        />

        {/* Bottom edge glow */}
        <div
          className="absolute -bottom-10 -left-[10%] w-[120%] h-[150px]"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.04) 40%, rgba(37,99,235,0.05) 60%, transparent)",
            filter: "blur(50px)",
            animation: "builder-aurora 20s ease-in-out 8s infinite reverse",
          }}
        />

        {/* Right edge accent */}
        <div
          className="absolute top-[20%] -right-10 w-[150px] h-[60%]"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(96,165,250,0.04) 40%, rgba(37,99,235,0.03) 60%, transparent)",
            filter: "blur(40px)",
            animation: "builder-edge 18s ease-in-out infinite",
          }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <style>{`
        @keyframes builder-aurora {
          0%, 100% { transform: translateX(0) scaleY(1); opacity: 0.7; }
          50% { transform: translateX(60px) scaleY(1.2); opacity: 1; }
        }
        @keyframes builder-edge {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(30px); opacity: 1; }
        }
      `}</style>

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
