"use client";

import { useState, useCallback, useRef } from "react";
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
} from "lucide-react";

type BuildStatus = "idle" | "generating" | "editing" | "complete" | "error";
type RightTab = "preview" | "code";
type ToolId =
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

  const abortRef = useRef<AbortController | null>(null);
  const hasCode = generatedCode.length > 0;

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
    await streamGenerate(prompt.trim());
  }, [prompt, streamGenerate]);

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
      {/* Ambient background glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "ambient-float 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-32 right-1/4 w-80 h-80 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,150,255,0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "ambient-float 15s ease-in-out 5s infinite reverse",
          }}
        />
        <div
          className="absolute top-1/3 -right-20 w-64 h-64 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)",
            filter: "blur(50px)",
            animation: "ambient-float 18s ease-in-out 3s infinite",
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <style>{`
        @keyframes ambient-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
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

      <StatusBar status={status} />
    </div>
  );
}
