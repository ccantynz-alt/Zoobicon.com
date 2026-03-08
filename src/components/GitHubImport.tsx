"use client";

import { useState } from "react";
import {
  Github,
  GitBranch,
  FileCode,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react";

interface AnalysisResult {
  files_analyzed: number;
  technologies: string[];
  suggestions: string[];
}

interface ImportResult {
  html: string;
  analysis: AnalysisResult;
}

interface GitHubImportProps {
  onImport: (html: string) => void;
}

type ProgressStep = "fetching" | "analyzing" | "generating";

const PROGRESS_STEPS: { key: ProgressStep; label: string }[] = [
  { key: "fetching", label: "Fetching repository..." },
  { key: "analyzing", label: "Analyzing codebase..." },
  { key: "generating", label: "Generating modern version..." },
];

export default function GitHubImport({ onImport }: GitHubImportProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProgressStep | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!repoUrl.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep("fetching");

    try {
      // Simulate progress steps since the API does all work in one call
      const stepTimer = setTimeout(() => setCurrentStep("analyzing"), 2000);
      const stepTimer2 = setTimeout(() => setCurrentStep("generating"), 5000);

      const response = await fetch("/api/github/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim(), branch }),
      });

      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      setResult(data);
      setCurrentStep(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setCurrentStep(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.includes("github.com")) {
      e.preventDefault();
      setRepoUrl(pasted.trim());
    }
  };

  const getStepStatus = (stepKey: ProgressStep): "pending" | "active" | "done" => {
    if (!currentStep) return "pending";
    const currentIndex = PROGRESS_STEPS.findIndex((s) => s.key === currentStep);
    const stepIndex = PROGRESS_STEPS.findIndex((s) => s.key === stepKey);
    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Input Section */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0f] p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-white/5">
            <Github className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Import from GitHub</h3>
        </div>

        {/* Repo URL Input */}
        <div className="space-y-2">
          <label className="text-sm text-white/60" htmlFor="repo-url">
            Repository URL
          </label>
          <div className="relative">
            <input
              id="repo-url"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              placeholder="https://github.com/user/repo"
              disabled={isLoading}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:ring-1 focus:ring-white/25 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Branch Selector */}
        <div className="space-y-2">
          <label className="text-sm text-white/60" htmlFor="branch">
            Branch
          </label>
          <div className="relative">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              id="branch"
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              disabled={isLoading}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:ring-1 focus:ring-white/25 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Import Button */}
        <button
          onClick={handleImport}
          disabled={isLoading || !repoUrl.trim()}
          className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium rounded-lg px-4 py-3 hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <FileCode className="w-4 h-4" />
              Import & Modernize
            </>
          )}
        </button>
      </div>

      {/* Progress Steps */}
      {isLoading && (
        <div className="rounded-xl border border-white/10 bg-[#0a0a0f] p-6 space-y-3">
          {PROGRESS_STEPS.map((step) => {
            const status = getStepStatus(step.key);
            return (
              <div key={step.key} className="flex items-center gap-3">
                {status === "done" ? (
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  </div>
                ) : status === "active" ? (
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10" />
                )}
                <span
                  className={`text-sm ${
                    status === "active"
                      ? "text-white"
                      : status === "done"
                      ? "text-white/60"
                      : "text-white/30"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Results Panel */}
      {result && (
        <div className="rounded-xl border border-white/10 bg-[#0a0a0f] p-6 space-y-5">
          <h4 className="text-lg font-semibold text-white">Import Complete</h4>

          {/* Files Analyzed */}
          <div className="flex items-center gap-2 text-sm text-white/60">
            <FileCode className="w-4 h-4" />
            <span>
              <span className="text-white font-medium">
                {result.analysis.files_analyzed}
              </span>{" "}
              files analyzed
            </span>
          </div>

          {/* Technologies Detected */}
          <div className="space-y-2">
            <p className="text-sm text-white/60">Technologies detected</p>
            <div className="flex flex-wrap gap-2">
              {result.analysis.technologies.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10 text-white/80"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          {result.analysis.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-white/60">Improvement suggestions</p>
              <ul className="space-y-1.5">
                {result.analysis.suggestions.map((suggestion, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-white/70"
                  >
                    <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/40" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Use This Code Button */}
          <button
            onClick={() => onImport(result.html)}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium rounded-lg px-4 py-3 hover:bg-white/90 transition-colors"
          >
            <Check className="w-4 h-4" />
            Use This Code
          </button>
        </div>
      )}
    </div>
  );
}
