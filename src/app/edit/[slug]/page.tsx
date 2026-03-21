"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/TopBar";
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
  Save,
  Check,
  ExternalLink,
  Shield,
  Accessibility,
  Gauge,
  Download,
  Layers,
  Mail,
  Clock,
  Loader2,
  RotateCcw,
} from "lucide-react";

type EditStatus = "loading" | "loaded" | "saving" | "saved" | "error";
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
  | "email"
  | "versions"
  | null;

const TOOLS: { id: Exclude<ToolId, null>; label: string; icon: React.ReactNode }[] = [
  { id: "versions", label: "Version History", icon: <Clock size={18} /> },
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
  { id: "wordpress", label: "Zoobicon Connect", icon: <FileArchive size={18} /> },
];

interface SiteInfo {
  name: string;
  slug: string;
  url: string;
  email: string;
}

interface Version {
  id: string;
  commit_message: string;
  created_at: string;
  size: number;
}

export default function EditSitePage() {
  const { slug } = useParams<{ slug: string }>();
  const [code, setCode] = useState("");
  const [originalCode, setOriginalCode] = useState("");
  const [site, setSite] = useState<SiteInfo | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [status, setStatus] = useState<EditStatus>("loading");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<RightTab>("preview");
  const [activeTool, setActiveTool] = useState<ToolId>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const hasCode = code.length > 0;
  const isDirty = code !== originalCode;

  // Load the site's current code
  useEffect(() => {
    if (!slug) return;

    async function loadSite() {
      setStatus("loading");
      try {
        const res = await fetch(`/api/hosting/sites/${slug}/code`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load site");
        }
        const data = await res.json();
        setCode(data.code);
        setOriginalCode(data.code);
        setSite(data.site);
        setVersions(data.versions || []);
        setStatus("loaded");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load site");
        setStatus("error");
      }
    }

    loadSite();
  }, [slug]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(code !== originalCode);
  }, [code, originalCode]);

  const handleCodeUpdate = useCallback((newCode: string) => {
    setCode(newCode);
    setActiveTab("preview");
  }, []);

  const handleSeoFixRequest = useCallback((instruction: string) => {
    // Will be handled by the chat panel
  }, []);

  // Save (publish) changes
  const handleSave = useCallback(async () => {
    if (!slug || !code || isSaving) return;

    setIsSaving(true);
    setSaveMessage("");

    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("zoobicon_user") : null;
      const user = userStr ? JSON.parse(userStr) : null;

      const res = await fetch(`/api/hosting/sites/${slug}/code`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          email: user?.email,
          message: "Updated via live editor",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      const data = await res.json();
      setOriginalCode(code);
      setStatus("saved");
      setSaveMessage("Published!");

      // Refresh versions
      const versionsRes = await fetch(`/api/hosting/sites/${slug}/code`);
      if (versionsRes.ok) {
        const vData = await versionsRes.json();
        setVersions(vData.versions || []);
      }

      setTimeout(() => {
        setSaveMessage("");
        setStatus("loaded");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [slug, code, isSaving]);

  // AI edit via streaming
  const handleAIEdit = useCallback(
    async (editPrompt: string) => {
      if (!editPrompt.trim() || !code) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/generate/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: editPrompt.trim(),
            tier: "premium",
            existingCode: code,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          // Fallback to non-streaming
          const fallbackRes = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: editPrompt.trim(),
              tier: "premium",
              existingCode: code,
            }),
          });
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            setCode(data.html);
          }
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) return;

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
                setCode(accumulated);
              }
            } catch {
              // skip
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("AI edit error:", err);
        }
      }
    },
    [code]
  );

  // Rollback to a version
  const rollbackToVersion = useCallback(
    async (versionId: string) => {
      try {
        const res = await fetch(`/api/hosting/sites/${slug}/versions/${versionId}`);
        if (res.ok) {
          const data = await res.json();
          setCode(data.version.code);
          setActiveTab("preview");
        }
      } catch {
        // silent
      }
    },
    [slug]
  );

  const toggleTool = useCallback((toolId: Exclude<ToolId, null>) => {
    setActiveTool((prev) => (prev === toolId ? null : toolId));
  }, []);

  const renderToolPanel = () => {
    switch (activeTool) {
      case "versions":
        return (
          <div className="p-4 space-y-3">
            <p className="text-xs text-white/60">
              View and rollback to previous versions of your site.
            </p>
            {versions.length === 0 ? (
              <p className="text-xs text-white/50 text-center py-4">No versions yet</p>
            ) : (
              versions.map((v, i) => (
                <div
                  key={v.id}
                  className={`p-3 rounded-lg border transition-all ${
                    i === 0
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white font-medium">
                      {i === 0 ? "Current" : `v${versions.length - i}`}
                    </span>
                    <span className="text-[10px] text-white/50">
                      {new Date(v.created_at).toLocaleDateString()} {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/65 mb-2">
                    {v.commit_message || "No description"}
                  </p>
                  {i > 0 && (
                    <button
                      onClick={() => rollbackToVersion(v.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-white/5 text-white/65 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <RotateCcw size={10} /> Restore this version
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        );
      case "debug":
        return <AutoDebugPanel code={code} onApplyFix={handleCodeUpdate} />;
      case "github":
        return <GitHubImport onImport={handleCodeUpdate} />;
      case "translate":
        return <TranslatePanel code={code} onApplyTranslation={handleCodeUpdate} />;
      case "wordpress":
        return <WordPressExport code={code} />;
      case "scaffold":
        return <ScaffoldPanel code={code} onApplyScaffold={handleCodeUpdate} />;
      case "animations":
        return <AnimationEditor code={code} onApplyAnimations={handleCodeUpdate} />;
      case "ecommerce":
        return <EcommerceGenerator onGenerate={handleCodeUpdate} />;
      case "crm":
        return <CrmGenerator onGenerate={handleCodeUpdate} />;
      case "figma":
        return <FigmaImport onImport={handleCodeUpdate} />;
      case "seo":
        return <SeoScorePanel code={code} onFixRequest={handleSeoFixRequest} />;
      case "qa":
        return <QAPanel code={code} />;
      case "a11y":
        return <AccessibilityPanel code={code} />;
      case "perf":
        return <PerformancePanel code={code} />;
      case "export":
        return <ExportPanel code={code} />;
      case "variants":
        return <VariantsPanel code={code} onApplyVariant={handleCodeUpdate} />;
      case "email":
        return <EmailTemplatePanel onApplyCode={handleCodeUpdate} />;
      default:
        return null;
    }
  };

  const activeToolLabel = TOOLS.find((t) => t.id === activeTool)?.label ?? "";

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex flex-col h-screen bg-[#111a2e]">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={32} className="text-brand-400 animate-spin mx-auto mb-4" />
            <div className="text-sm text-white/65">Loading {slug}...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error" && !hasCode) {
    return (
      <div className="flex flex-col h-screen bg-[#111a2e]">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">404</div>
            <div className="text-lg font-bold text-white mb-2">Site Not Found</div>
            <div className="text-sm text-white/60 mb-6">{error}</div>
            <a
              href="/builder"
              className="px-6 py-2.5 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors text-sm font-medium"
            >
              Go to Builder
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#111a2e] relative overflow-hidden">
      <TopBar />

      {/* Site info bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.10] bg-[#141e33]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-white">{site?.name || slug}</span>
          </div>
          {site?.url && (
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-white/50 hover:text-white/60 transition-colors"
            >
              {site.url} <ExternalLink size={10} />
            </a>
          )}
          {hasUnsavedChanges && (
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-medium">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Check size={14} /> {saveMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isDirty
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                : "bg-white/5 text-white/50 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Publishing...
              </>
            ) : (
              <>
                <Save size={14} /> Publish
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — AI Chat Editor */}
        <div className="w-[400px] min-w-[340px] flex flex-col border-r border-white/[0.10] bg-[#141e33]">
          <div className="px-4 py-3 border-b border-white/[0.10] flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[2px] text-brand-400/50">
              AI Editor
            </span>
            <span className="text-[10px] text-white/50">
              Editing live site
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              currentCode={code}
              onCodeUpdate={handleCodeUpdate}
              isVisible={true}
            />
          </div>
        </div>

        {/* Center panel — Preview / Code */}
        <div className="flex-1 flex flex-col bg-[#111a2e]/80 backdrop-blur-sm">
          <div className="flex items-center border-b border-white/[0.10] px-2">
            <button
              className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === "preview"
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-white/50 hover:text-white/65"
              }`}
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </button>
            <button
              className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === "code"
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-white/50 hover:text-white/65"
              }`}
              onClick={() => setActiveTab("code")}
            >
              Code
            </button>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {activeTab === "preview" ? (
              <PreviewPanel html={code} isGenerating={false} />
            ) : (
              <CodePanel html={code} />
            )}
          </div>
        </div>

        {/* Tool panel */}
        {activeTool && (
          <div className="w-[380px] flex flex-col border-l border-white/[0.10] bg-[#111a2e]/90 backdrop-blur-sm animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.10]">
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

        {/* Right toolbar */}
        <div className="w-12 flex flex-col items-center py-2 gap-1 border-l border-white/[0.10] bg-[#111a2e]/90 backdrop-blur-sm overflow-y-auto">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => toggleTool(tool.id)}
              title={tool.label}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150 shrink-0 ${
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

      <StatusBar status={hasUnsavedChanges ? "editing" : "complete"} />
    </div>
  );
}
