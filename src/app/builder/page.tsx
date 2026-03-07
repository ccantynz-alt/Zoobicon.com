"use client";

import { useState, useCallback } from "react";
import TopBar from "@/components/TopBar";
import PromptInput from "@/components/PromptInput";
import PreviewPanel from "@/components/PreviewPanel";
import CodePanel from "@/components/CodePanel";
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
} from "lucide-react";

type BuildStatus = "idle" | "generating" | "complete" | "error";
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
  | null;

const TOOLS: { id: Exclude<ToolId, null>; label: string; icon: React.ReactNode }[] = [
  { id: "debug", label: "Auto Debug", icon: <Bug size={18} /> },
  { id: "github", label: "GitHub Import", icon: <Github size={18} /> },
  { id: "translate", label: "Translate", icon: <Languages size={18} /> },
  { id: "wordpress", label: "WordPress Export", icon: <FileArchive size={18} /> },
  { id: "scaffold", label: "Scaffolding", icon: <Database size={18} /> },
  { id: "animations", label: "Animations", icon: <Wand2 size={18} /> },
  { id: "ecommerce", label: "E-commerce", icon: <ShoppingCart size={18} /> },
  { id: "crm", label: "CRM", icon: <Users size={18} /> },
  { id: "figma", label: "Figma Import", icon: <Figma size={18} /> },
  { id: "seo", label: "SEO Score", icon: <Search size={18} /> },
];

export default function BuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [status, setStatus] = useState<BuildStatus>("idle");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<RightTab>("preview");
  const [activeTool, setActiveTool] = useState<ToolId>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setStatus("generating");
    setError("");
    setGeneratedCode("");
    setActiveTab("preview");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setGeneratedCode(data.html);
      setStatus("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }, [prompt]);

  const handleCodeUpdate = useCallback((newCode: string) => {
    setGeneratedCode(newCode);
    setStatus("complete");
  }, []);

  const handleSeoFixRequest = useCallback(
    (instruction: string) => {
      setPrompt((prev) =>
        prev ? `${prev}\n\nSEO fix: ${instruction}` : `SEO fix: ${instruction}`
      );
    },
    []
  );

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
      default:
        return null;
    }
  };

  const activeToolLabel = TOOLS.find((t) => t.id === activeTool)?.label ?? "";

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f]">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Prompt */}
        <div className="w-[400px] min-w-[340px] flex flex-col border-r border-cyber-border bg-cyber-dark">
          <div className="px-4 py-3 border-b border-cyber-border">
            <span className="text-[11px] uppercase tracking-[2px] text-cyber-cyan/60">
              Prompt
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PromptInput
              prompt={prompt}
              onPromptChange={setPrompt}
              onGenerate={handleGenerate}
              isGenerating={status === "generating"}
            />
          </div>
        </div>

        {/* Center panel — Preview / Code */}
        <div className="flex-1 flex flex-col bg-cyber-black">
          {/* Tabs */}
          <div className="flex items-center border-b border-cyber-border px-2">
            <button
              className={`cyber-tab ${activeTab === "preview" ? "active" : ""}`}
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </button>
            <button
              className={`cyber-tab ${activeTab === "code" ? "active" : ""}`}
              onClick={() => setActiveTab("code")}
            >
              Code
            </button>

            {status === "error" && (
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
          <div className="w-[380px] flex flex-col border-l border-cyber-border bg-[#0a0a0f] animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border">
              <span className="text-[11px] uppercase tracking-[2px] text-cyber-cyan/60">
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
        <div className="w-12 flex flex-col items-center py-2 gap-1 border-l border-cyber-border bg-[#0a0a0f]">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => toggleTool(tool.id)}
              title={tool.label}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150 ${
                activeTool === tool.id
                  ? "bg-cyber-cyan/20 text-cyber-cyan shadow-[0_0_8px_rgba(0,255,255,0.15)]"
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
