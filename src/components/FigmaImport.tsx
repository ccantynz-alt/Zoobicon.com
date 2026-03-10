"use client";

import { useState } from "react";
import {
  Figma,
  Upload,
  FileJson,
  Palette,
  Type,
  Ruler,
  Loader2,
  Check,
  ArrowRight,
  Link,
} from "lucide-react";

interface DesignTokens {
  colors: string[];
  fonts: string[];
  spacing: number[];
}

interface ImportResult {
  html: string;
  designTokens: DesignTokens;
  layers: number;
}

interface FigmaImportProps {
  onImport: (html: string) => void;
}

type ImportTab = "url" | "json";

const LOADING_STEPS = [
  "Connecting to Figma...",
  "Extracting design elements...",
  "Converting to HTML/CSS...",
];

export default function FigmaImport({ onImport }: FigmaImportProps) {
  const [activeTab, setActiveTab] = useState<ImportTab>("url");
  const [figmaUrl, setFigmaUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [figmaJson, setFigmaJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const handleImport = async () => {
    setError("");
    setResult(null);
    setLoading(true);
    setLoadingStep(0);

    try {
      // Simulate step progression
      const stepInterval = setInterval(() => {
        setLoadingStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
      }, 2000);

      const body =
        activeTab === "url"
          ? { figmaUrl, accessToken: accessToken || undefined }
          : { figmaJson: figmaJson };

      const response = await fetch("/api/figma/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      clearInterval(stepInterval);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      setLoadingStep(LOADING_STEPS.length - 1);
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    activeTab === "url"
      ? figmaUrl.trim().length > 0 && accessToken.trim().length > 0
      : figmaJson.trim().length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tab Selector */}
      <div className="flex gap-1 p-1 bg-[#12121a] rounded-xl border border-[#1e1e2e] mb-6">
        <button
          onClick={() => {
            setActiveTab("url");
            setError("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "url"
              ? "bg-[#1a1a2e] text-white shadow-lg"
              : "text-[#666] hover:text-[#999]"
          }`}
        >
          <Link className="w-4 h-4" />
          Figma URL
        </button>
        <button
          onClick={() => {
            setActiveTab("json");
            setError("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "json"
              ? "bg-[#1a1a2e] text-white shadow-lg"
              : "text-[#666] hover:text-[#999]"
          }`}
        >
          <FileJson className="w-4 h-4" />
          Paste JSON
        </button>
      </div>

      {/* URL Tab */}
      {activeTab === "url" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#999] mb-2">
              Figma File URL
            </label>
            <div className="relative">
              <Figma className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
              <input
                type="url"
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                placeholder="https://www.figma.com/file/..."
                className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#3b82f6] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#999] mb-2">
              Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="figd_xxxxxxxxxxxxxxxxxx"
              className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl py-3 px-4 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>

          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
            <p className="text-xs text-[#666] leading-relaxed">
              <span className="text-[#888] font-medium">
                How to get your access token:
              </span>{" "}
              Open Figma, go to{" "}
              <span className="text-[#3b82f6]">
                Settings &rarr; Account &rarr; Personal access tokens
              </span>
              , then click{" "}
              <span className="text-[#3b82f6]">
                &quot;Generate new token&quot;
              </span>
              . Copy the token and paste it above. Tokens provide read-only
              access to your files.
            </p>
          </div>
        </div>
      )}

      {/* JSON Tab */}
      {activeTab === "json" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#999] mb-2">
              Figma JSON Export
            </label>
            <textarea
              value={figmaJson}
              onChange={(e) => setFigmaJson(e.target.value)}
              placeholder='Paste your Figma JSON here... (e.g., from Figma API response or "Copy as JSON" plugin)'
              rows={10}
              className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl py-3 px-4 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#3b82f6] transition-colors font-mono resize-y"
            />
          </div>

          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
            <p className="text-xs text-[#666] leading-relaxed">
              <span className="text-[#888] font-medium">
                How to export JSON:
              </span>{" "}
              Use a Figma plugin like{" "}
              <span className="text-[#3b82f6]">
                &quot;JSON from Design&quot;
              </span>{" "}
              or copy the API response from{" "}
              <span className="text-[#3b82f6]">
                api.figma.com/v1/files/&#123;key&#125;
              </span>
              . The JSON should contain node structure with layout, style, and
              text data.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Import Button */}
      {!result && (
        <button
          onClick={handleImport}
          disabled={!canSubmit || loading}
          className={`mt-6 w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-semibold transition-all duration-200 ${
            canSubmit && !loading
              ? "bg-gradient-to-r from-[#3b82f6] to-[#3b82f6] text-white hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer"
              : "bg-[#1a1a2e] text-[#444] cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {LOADING_STEPS[loadingStep]}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Import Design
            </>
          )}
        </button>
      )}

      {/* Loading Steps */}
      {loading && (
        <div className="mt-6 space-y-3">
          {LOADING_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              {i < loadingStep ? (
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
              ) : i === loadingStep ? (
                <Loader2 className="w-5 h-5 text-[#3b82f6] animate-spin" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#1a1a2e]" />
              )}
              <span
                className={`text-sm ${
                  i <= loadingStep ? "text-[#ccc]" : "text-[#444]"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Results Panel */}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2 text-green-400">
              <Check className="w-5 h-5" />
              <span className="text-sm font-semibold">
                Design imported successfully
              </span>
            </div>

            {/* Color Swatches */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-[#3b82f6]" />
                <span className="text-sm font-medium text-[#999]">
                  Colors ({result.designTokens.colors.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.designTokens.colors.slice(0, 12).map((color) => (
                  <div key={color} className="flex items-center gap-1.5 group">
                    <div
                      className="w-6 h-6 rounded-md border border-[#2a2a3a] shadow-inner"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="text-xs text-[#555] group-hover:text-[#888] transition-colors font-mono">
                      {color}
                    </span>
                  </div>
                ))}
                {result.designTokens.colors.length > 12 && (
                  <span className="text-xs text-[#444] self-center">
                    +{result.designTokens.colors.length - 12} more
                  </span>
                )}
              </div>
            </div>

            {/* Fonts */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Type className="w-4 h-4 text-[#3b82f6]" />
                <span className="text-sm font-medium text-[#999]">
                  Fonts ({result.designTokens.fonts.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.designTokens.fonts.map((font) => (
                  <span
                    key={font}
                    className="px-3 py-1.5 bg-[#1a1a2e] border border-[#2a2a3a] rounded-lg text-xs text-[#ccc] font-medium"
                  >
                    {font}
                  </span>
                ))}
              </div>
            </div>

            {/* Spacing */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Ruler className="w-4 h-4 text-[#f59e0b]" />
                <span className="text-sm font-medium text-[#999]">
                  Spacing Scale ({result.designTokens.spacing.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.designTokens.spacing.map((sp) => (
                  <span
                    key={sp}
                    className="px-2.5 py-1 bg-[#1a1a2e] border border-[#2a2a3a] rounded-lg text-xs text-[#ccc] font-mono"
                  >
                    {sp}px
                  </span>
                ))}
              </div>
            </div>

            {/* Layer Count */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#1e1e2e]">
              <Figma className="w-4 h-4 text-[#666]" />
              <span className="text-sm text-[#666]">
                {result.layers} layers processed
              </span>
            </div>
          </div>

          {/* Use This Design Button */}
          <button
            onClick={() => onImport(result.html)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#3b82f6] to-[#3b82f6] text-white hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 cursor-pointer"
          >
            Use This Design
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
