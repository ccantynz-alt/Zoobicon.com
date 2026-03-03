"use client";

import { useState, useCallback } from "react";
import TopBar from "@/components/TopBar";
import PromptInput from "@/components/PromptInput";
import PreviewPanel from "@/components/PreviewPanel";
import CodePanel from "@/components/CodePanel";
import StatusBar from "@/components/StatusBar";

type BuildStatus = "idle" | "generating" | "complete" | "error";
type RightTab = "preview" | "code";

export default function BuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [status, setStatus] = useState<BuildStatus>("idle");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<RightTab>("preview");

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

  return (
    <div className="flex flex-col h-screen">
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

        {/* Right panel — Preview / Code */}
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
      </div>

      <StatusBar status={status} />
    </div>
  );
}
