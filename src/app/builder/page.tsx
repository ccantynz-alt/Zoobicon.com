"use client";

import { useState } from "react";
import Link from "next/link";
import PromptInput from "@/components/PromptInput";
import PreviewPanel from "@/components/PreviewPanel";
import CodePanel from "@/components/CodePanel";
import StatusBar from "@/components/StatusBar";
import { ArrowLeft, Zap } from "lucide-react";

export default function BuilderPage() {
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [buildLog, setBuildLog] = useState<string[]>([]);

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    setError("");
    setGeneratedCode("");
    setBuildLog(["Initializing...", "Parsing prompt..."]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Generation failed");
      }

      setBuildLog((prev) => [...prev, "Building your site..."]);

      const data = await response.json();
      const code = data.code || "";

      setGeneratedCode(code);
      setBuildLog((prev) => [
        ...prev,
        "Code generated successfully",
        `Output: ${code.length} characters`,
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
  };

  return (
    <div className="flex flex-col h-screen bg-dark-400">
      {/* Builder Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-dark-300/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-semibold text-white/90">
              Zoobicon Builder
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
          <span className="text-xs text-white/40">AI Ready</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-[380px] flex flex-col border-r border-white/[0.06] bg-dark-300/50">
          <PromptInput onGenerate={handleGenerate} isGenerating={isGenerating} />

          {/* Build Log */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
            <div className="text-[11px] font-medium text-white/30 mb-2 uppercase tracking-wider">
              Activity log
            </div>
            {buildLog.map((line, i) => (
              <div
                key={i}
                className={`py-0.5 ${
                  line.startsWith("Error")
                    ? "text-red-400"
                    : line.includes("Ready")
                    ? "text-accent-cyan"
                    : "text-white/40"
                }`}
              >
                {line}
              </div>
            ))}
            {isGenerating && (
              <div className="text-brand-400 animate-pulse">Processing...</div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {error && (
              <div className="m-4 p-3 border border-red-500/20 bg-red-500/10 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {activeTab === "preview" ? (
              <PreviewPanel code={generatedCode} isGenerating={isGenerating} />
            ) : (
              <CodePanel code={generatedCode} />
            )}
          </div>
        </div>
      </div>

      <StatusBar isGenerating={isGenerating} codeLength={generatedCode.length} />
    </div>
  );
}
