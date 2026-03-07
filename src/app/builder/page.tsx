"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PromptInput from "@/components/PromptInput";
import PreviewPanel from "@/components/PreviewPanel";
import CodePanel from "@/components/CodePanel";
import StatusBar from "@/components/StatusBar";
import TemplateGallery from "@/components/TemplateGallery";
import ChatPanel from "@/components/ChatPanel";
import { saveProject, updateProject, getProject } from "@/lib/storage";
import type { Template } from "@/lib/templates";
import {
  ArrowLeft,
  Zap,
  Layout,
  MessageSquare,
  Save,
  Check,
  FolderOpen,
  Download,
} from "lucide-react";

type DeviceMode = "desktop" | "tablet" | "mobile";
type SidebarTab = "prompt" | "templates";

function BuilderContent() {
  const searchParams = useSearchParams();

  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [buildLog, setBuildLog] = useState<string[]>([]);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("prompt");
  const [showChat, setShowChat] = useState(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Load project from URL param
  useEffect(() => {
    const projectId = searchParams.get("project");
    if (projectId) {
      const project = getProject(projectId);
      if (project) {
        setGeneratedCode(project.code);
        setLastPrompt(project.prompt);
        setCurrentProjectId(project.id);
        setBuildLog([`Loaded project: ${project.name}`, `${project.code.length} characters`]);
      }
    }
  }, [searchParams]);

  const handleGenerate = useCallback(async (prompt: string, templateName?: string) => {
    setIsGenerating(true);
    setError("");
    setGeneratedCode("");
    setCharCount(0);
    setLastPrompt(prompt);
    setIsSaved(false);
    setBuildLog(["Initializing Zoobicon AI...", "Parsing prompt...", "Streaming generation started..."]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, template: templateName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Generation failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream available");

      const decoder = new TextDecoder();
      let fullCode = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "chunk") {
              fullCode += data.content;
              setCharCount(fullCode.length);
              // Update preview periodically for streaming effect
              if (fullCode.length % 200 < data.content.length) {
                setGeneratedCode(fullCode);
              }
            } else if (data.type === "done") {
              setBuildLog((prev) => [...prev, "Generation complete!"]);
            } else if (data.type === "error") {
              throw new Error(data.content);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      // Final cleanup and set
      const cleanCode = fullCode
        .replace(/^```html?\n?/i, "")
        .replace(/\n?```$/i, "")
        .trim();

      setGeneratedCode(cleanCode);
      setCharCount(cleanCode.length);
      setBuildLog((prev) => [
        ...prev,
        `Output: ${cleanCode.length.toLocaleString()} characters`,
        "Ready for preview",
      ]);
      setActiveTab("preview");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setBuildLog((prev) => [...prev, `Error: ${message}`]);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleTemplateSelect = (template: Template) => {
    handleGenerate(template.prompt, template.name);
    setSidebarTab("prompt");
  };

  const handleChatCodeUpdate = (newCode: string) => {
    setGeneratedCode(newCode);
    setCharCount(newCode.length);
    setIsSaved(false);
    setBuildLog((prev) => [...prev, "AI edit applied", `Updated: ${newCode.length.toLocaleString()} chars`]);
  };

  const handleExport = () => {
    if (!generatedCode) return;
    const filename = (lastPrompt.slice(0, 40) || "zoobicon-site").replace(/[^a-z0-9]/gi, "-").toLowerCase() + ".html";
    const blob = new Blob([generatedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setBuildLog((prev) => [...prev, `Exported as ${filename}`]);
  };

  const handleSave = () => {
    if (!generatedCode) return;

    const name = lastPrompt.slice(0, 50) || "Untitled Project";

    if (currentProjectId) {
      updateProject(currentProjectId, { code: generatedCode, prompt: lastPrompt, name });
    } else {
      const project = saveProject({ name, prompt: lastPrompt, code: generatedCode });
      setCurrentProjectId(project.id);
    }

    setIsSaved(true);
    setBuildLog((prev) => [...prev, "Project saved"]);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-dark-400">
      {/* Builder Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-dark-300/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-sm font-semibold text-white/80">Builder</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!generatedCode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${isSaved
                          ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20"
                          : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60 hover:bg-white/[0.06]"
                        } disabled:opacity-30`}
          >
            {isSaved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {isSaved ? "Saved" : "Save"}
          </button>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={!generatedCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60 hover:bg-white/[0.06] transition-all disabled:opacity-30"
          >
            <Download className="w-3 h-3" />
            Export
          </button>

          {/* Dashboard link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            <FolderOpen className="w-3 h-3" />
            Projects
          </Link>

          {/* Chat toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${showChat
                          ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                          : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60"
                        }`}
          >
            <MessageSquare className="w-3 h-3" />
            AI Editor
          </button>

          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            <span className="text-[10px] text-white/30">
              {isGenerating ? "Generating..." : "Ready"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-[340px] flex flex-col border-r border-white/[0.06] bg-dark-300/50">
          {/* Sidebar tabs */}
          <div className="flex border-b border-white/[0.06]">
            <button
              onClick={() => setSidebarTab("prompt")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                sidebarTab === "prompt"
                  ? "text-brand-400 border-b-2 border-brand-500 bg-white/[0.02]"
                  : "text-white/30 hover:text-white/50"
              }`}
            >
              <Zap className="w-3 h-3" />
              Generate
            </button>
            <button
              onClick={() => setSidebarTab("templates")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                sidebarTab === "templates"
                  ? "text-brand-400 border-b-2 border-brand-500 bg-white/[0.02]"
                  : "text-white/30 hover:text-white/50"
              }`}
            >
              <Layout className="w-3 h-3" />
              Templates
            </button>
          </div>

          {sidebarTab === "prompt" ? (
            <>
              <PromptInput onGenerate={handleGenerate} isGenerating={isGenerating} />
              {/* Build Log */}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                <div className="text-[10px] font-medium text-white/20 mb-2 uppercase tracking-wider">
                  Activity log
                </div>
                {buildLog.map((line, i) => (
                  <div
                    key={i}
                    className={`py-0.5 ${
                      line.startsWith("Error")
                        ? "text-red-400"
                        : line.includes("complete") || line.includes("saved") || line.includes("Ready")
                        ? "text-accent-cyan"
                        : "text-white/30"
                    }`}
                  >
                    <span className="text-white/10 mr-2">{String(i + 1).padStart(2, "0")}</span>
                    {line}
                  </div>
                ))}
                {isGenerating && (
                  <div className="text-brand-400 animate-pulse py-0.5">
                    <span className="text-white/10 mr-2">{String(buildLog.length + 1).padStart(2, "0")}</span>
                    Streaming... {charCount.toLocaleString()} chars
                  </div>
                )}
              </div>
            </>
          ) : (
            <TemplateGallery onSelect={handleTemplateSelect} isGenerating={isGenerating} />
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="flex border-b border-white/[0.06] bg-dark-300/50">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-5 py-2.5 text-xs font-medium transition-all ${
                activeTab === "preview"
                  ? "text-brand-400 border-b-2 border-brand-500"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-5 py-2.5 text-xs font-medium transition-all ${
                activeTab === "code"
                  ? "text-brand-400 border-b-2 border-brand-500"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              Code
            </button>
            {isGenerating && (
              <div className="ml-auto flex items-center gap-2 px-4">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                <span className="text-[10px] text-brand-400/60 font-mono">
                  {charCount.toLocaleString()} chars
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 overflow-hidden">
              {error && (
                <div className="m-4 p-4 border border-red-500/20 bg-red-500/10 rounded-lg">
                  <div className="text-red-400 text-sm font-medium mb-1">Generation Failed</div>
                  <div className="text-red-400/70 text-xs">{error}</div>
                  {error.includes("API key") && (
                    <div className="mt-2 text-xs text-white/40">
                      The AI builder is temporarily unavailable. Please try again later or contact support.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "preview" ? (
                <PreviewPanel
                  code={generatedCode}
                  isGenerating={isGenerating}
                  deviceMode={deviceMode}
                  onDeviceModeChange={setDeviceMode}
                />
              ) : (
                <CodePanel code={generatedCode} />
              )}
            </div>

            {/* Chat Panel */}
            <ChatPanel
              currentCode={generatedCode}
              onCodeUpdate={handleChatCodeUpdate}
              isVisible={showChat}
            />
          </div>
        </div>
      </div>

      <StatusBar isGenerating={isGenerating} codeLength={generatedCode.length} />
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-dark-400">
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center mx-auto mb-3">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm text-white/40">Loading builder...</div>
        </div>
      </div>
    }>
      <BuilderContent />
    </Suspense>
  );
}
