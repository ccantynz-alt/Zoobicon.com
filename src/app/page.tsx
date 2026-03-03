"use client";

import { useState } from "react";
import PromptInput from "@/components/PromptInput";
import PreviewPanel from "@/components/PreviewPanel";
import CodePanel from "@/components/CodePanel";
import TopBar from "@/components/TopBar";
import StatusBar from "@/components/StatusBar";

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
    setBuildLog(["[ZOOBICON] Initializing AI core...", "[ZOOBICON] Parsing prompt..."]);

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

      setBuildLog((prev) => [...prev, "[ZOOBICON] AI is building your site..."]);

      const data = await response.json();
      const code = data.code || "";

      setGeneratedCode(code);
      setBuildLog((prev) => [
        ...prev,
        "[ZOOBICON] Code generated successfully",
        `[ZOOBICON] Output: ${code.length} characters`,
        "[ZOOBICON] Ready for preview ✓",
      ]);
      setActiveTab("preview");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setBuildLog((prev) => [...prev, `[ERROR] ${message}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Prompt & Build Log */}
        <div className="w-[400px] flex flex-col border-r border-cyber-border bg-cyber-dark/50">
          <PromptInput onGenerate={handleGenerate} isGenerating={isGenerating} />

          {/* Build Log */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
            <div className="text-cyber-cyan/50 mb-2 font-display text-[10px] uppercase tracking-widest">
              // Build Log
            </div>
            {buildLog.map((line, i) => (
              <div
                key={i}
                className={`py-0.5 ${
                  line.includes("[ERROR]")
                    ? "text-cyber-magenta"
                    : line.includes("✓")
                    ? "text-cyber-green"
                    : "text-cyber-cyan/70"
                }`}
              >
                {line}
              </div>
            ))}
            {isGenerating && (
              <div className="text-cyber-yellow animate-pulse">
                [ZOOBICON] Processing...
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview / Code */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="flex border-b border-cyber-border bg-cyber-dark/30">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-6 py-3 font-display text-xs uppercase tracking-widest transition-all ${
                activeTab === "preview"
                  ? "text-cyber-magenta border-b-2 border-cyber-magenta bg-cyber-magenta/5"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              ◈ Preview
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-6 py-3 font-display text-xs uppercase tracking-widest transition-all ${
                activeTab === "code"
                  ? "text-cyber-cyan border-b-2 border-cyber-cyan bg-cyber-cyan/5"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              ◈ Code
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {error && (
              <div className="m-4 p-4 border border-cyber-magenta bg-cyber-magenta/10 text-cyber-magenta font-mono text-sm">
                ⚠ {error}
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
