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
    <div className="flex flex-col h-screen">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-[380px] flex flex-col border-r border-gray-200 bg-white">
          <PromptInput onGenerate={handleGenerate} isGenerating={isGenerating} />

          {/* Build Log */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
            <div className="text-[11px] font-medium text-gray-400 mb-2">
              Activity log
            </div>
            {buildLog.map((line, i) => (
              <div
                key={i}
                className={`py-0.5 ${
                  line.startsWith("Error")
                    ? "text-red-500"
                    : line.includes("Ready")
                    ? "text-emerald-500"
                    : "text-gray-500"
                }`}
              >
                {line}
              </div>
            ))}
            {isGenerating && (
              <div className="text-brand-500 animate-pulse">
                Processing...
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-5 py-2.5 text-xs font-medium transition-all ${
                activeTab === "preview"
                  ? "text-brand-600 border-b-2 border-brand-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-5 py-2.5 text-xs font-medium transition-all ${
                activeTab === "code"
                  ? "text-brand-600 border-b-2 border-brand-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Code
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {error && (
              <div className="m-4 p-3 border border-red-200 bg-red-50 text-red-600 rounded-lg text-sm">
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
