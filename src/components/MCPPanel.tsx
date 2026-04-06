"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  GitFork,
  BookOpen,
  Layers,
  Sheet,
  Database,
  Link,
  Download,
  Eye,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Check,
  X,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MCPToolInfo {
  name: string;
  description: string;
  provider: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  connected: boolean;
}

interface MCPResultData {
  success: boolean;
  data: unknown;
  contentType: string;
  summary: string;
}

interface ContextSource {
  id: string;
  toolName: string;
  provider: string;
  params: Record<string, string>;
  result: MCPResultData | null;
  loading: boolean;
  included: boolean;
  expanded: boolean;
}

// ---------------------------------------------------------------------------
// Provider metadata
// ---------------------------------------------------------------------------

const PROVIDER_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  github: { icon: <GitFork className="w-4 h-4" />, label: "GitHub", color: "text-white" },
  notion: { icon: <BookOpen className="w-4 h-4" />, label: "Notion", color: "text-white" },
  figma: { icon: <Layers className="w-4 h-4" />, label: "Layers", color: "text-purple-400" },
  "google-sheets": { icon: <Sheet className="w-4 h-4" />, label: "Google Sheets", color: "text-green-400" },
  custom: { icon: <Database className="w-4 h-4" />, label: "Custom", color: "text-blue-400" },
};

// ---------------------------------------------------------------------------
// Quick-add presets per provider
// ---------------------------------------------------------------------------

interface QuickAddPreset {
  toolName: string;
  label: string;
  description: string;
  fields: { key: string; label: string; placeholder: string }[];
}

const PRESETS: QuickAddPreset[] = [
  {
    toolName: "github_read_file",
    label: "Pull from GitHub File",
    description: "Fetch a specific file from a GitHub repo",
    fields: [
      { key: "owner", label: "Owner", placeholder: "e.g. vercel" },
      { key: "repo", label: "Repo", placeholder: "e.g. next.js" },
      { key: "path", label: "File Path", placeholder: "e.g. README.md" },
    ],
  },
  {
    toolName: "github_read_repo_structure",
    label: "GitHub Repo Structure",
    description: "List all files in a repository",
    fields: [
      { key: "owner", label: "Owner", placeholder: "e.g. vercel" },
      { key: "repo", label: "Repo", placeholder: "e.g. next.js" },
    ],
  },
  {
    toolName: "notion_read_page",
    label: "Import from Notion Page",
    description: "Pull content from a Notion page",
    fields: [{ key: "pageId", label: "Page ID", placeholder: "Paste Notion page ID or URL" }],
  },
  {
    toolName: "notion_read_database",
    label: "Notion Database Query",
    description: "Read rows from a Notion database",
    fields: [{ key: "databaseId", label: "Database ID", placeholder: "Paste Notion database ID" }],
  },
  {
    toolName: "figma_get_design",
    label: "Reference Layers Design",
    description: "Fetch design metadata from Layers",
    fields: [{ key: "fileKey", label: "File Key", placeholder: "From URL: figma.com/file/<KEY>/..." }],
  },
  {
    toolName: "google_sheets_read",
    label: "Read Google Sheet",
    description: "Import data from a Google Sheet",
    fields: [
      { key: "spreadsheetId", label: "Spreadsheet ID", placeholder: "From Sheet URL" },
      { key: "range", label: "Range", placeholder: "e.g. Sheet1!A1:D50 (optional)" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MCPPanelProps {
  onContextChange?: (contextString: string) => void;
}

export default function MCPPanel({ onContextChange }: MCPPanelProps) {
  const [tools, setTools] = useState<MCPToolInfo[]>([]);
  const [sources, setSources] = useState<ContextSource[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [loadingTools, setLoadingTools] = useState(true);
  // Quick-import state
  const [quickUrl, setQuickUrl] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState("");

  // Load available tools on mount
  useEffect(() => {
    const loadTools = async () => {
      try {
        const res = await fetch("/api/mcp");
        if (res.ok) {
          const data = await res.json();
          setTools(data.tools || []);
        }
      } catch {
        // Silently fail — tools will be empty
      } finally {
        setLoadingTools(false);
      }
    };
    loadTools();
  }, []);

  // Quick-import: paste any URL and auto-detect source type
  const handleQuickImport = async () => {
    if (!quickUrl.trim() || quickLoading) return;
    setQuickLoading(true);
    setQuickError("");

    try {
      const res = await fetch("/api/mcp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: quickUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuickError(data.error || "Failed to fetch context");
        return;
      }

      // Add as a resolved source
      const newSource: ContextSource = {
        id: `mcp-quick-${Date.now()}`,
        toolName: `${data.source.type}_import`,
        provider: data.source.type === "github" ? "github" : data.source.type === "notion" ? "notion" : data.source.type === "figma" ? "figma" : "custom",
        params: { url: quickUrl.trim() },
        result: {
          success: true,
          data: data.content,
          contentType: "text",
          summary: `Imported from ${data.source.name} (${data.tokens} tokens)`,
        },
        loading: false,
        included: true,
        expanded: false,
      };
      setSources((prev) => [...prev, newSource]);
      setQuickUrl("");
    } catch {
      setQuickError("Network error — could not reach the server");
    } finally {
      setQuickLoading(false);
    }
  };

  // Notify parent when included context changes
  const buildContextString = useCallback(() => {
    const included = sources.filter((s) => s.included && s.result?.success);
    if (included.length === 0) return "";

    return included
      .map((s, i) => {
        const data =
          s.result?.contentType === "json"
            ? JSON.stringify(s.result.data, null, 2)
            : String(s.result?.data || "");
        const truncated = data.length > 4000 ? data.slice(0, 4000) + "\n... [truncated]" : data;
        return `### External Context ${i + 1}: ${s.toolName}\n${s.result?.summary}\n\`\`\`\n${truncated}\n\`\`\``;
      })
      .join("\n\n");
  }, [sources]);

  useEffect(() => {
    onContextChange?.(buildContextString());
  }, [buildContextString, onContextChange]);

  // Add a new context source from a preset
  const addSource = (preset: QuickAddPreset) => {
    const newSource: ContextSource = {
      id: `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      toolName: preset.toolName,
      provider: tools.find((t) => t.name === preset.toolName)?.provider || "custom",
      params: Object.fromEntries(preset.fields.map((f) => [f.key, ""])),
      result: null,
      loading: false,
      included: true,
      expanded: true,
    };
    setSources((prev) => [...prev, newSource]);
    setShowAddMenu(false);
  };

  // Update params for a source
  const updateParam = (sourceId: string, key: string, value: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, params: { ...s.params, [key]: value } } : s))
    );
  };

  // Execute a tool fetch
  const fetchSource = async (sourceId: string) => {
    setSources((prev) => prev.map((s) => (s.id === sourceId ? { ...s, loading: true } : s)));

    const source = sources.find((s) => s.id === sourceId);
    if (!source) return;

    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: source.toolName,
          params: source.params,
          userEmail: "", // Will use env var fallbacks
        }),
      });
      const data = await res.json();
      setSources((prev) =>
        prev.map((s) =>
          s.id === sourceId ? { ...s, result: data.result || null, loading: false } : s
        )
      );
    } catch {
      setSources((prev) =>
        prev.map((s) =>
          s.id === sourceId
            ? {
                ...s,
                result: { success: false, data: null, contentType: "text", summary: "Network error" },
                loading: false,
              }
            : s
        )
      );
    }
  };

  // Remove a source
  const removeSource = (sourceId: string) => {
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
  };

  // Toggle include
  const toggleInclude = (sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, included: !s.included } : s))
    );
  };

  // Toggle expand
  const toggleExpand = (sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, expanded: !s.expanded } : s))
    );
  };

  const getPresetForTool = (toolName: string) => PRESETS.find((p) => p.toolName === toolName);
  const includedCount = sources.filter((s) => s.included && s.result?.success).length;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold">External Context (MCP)</h3>
          </div>
          {includedCount > 0 && (
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
              {includedCount} source{includedCount !== 1 ? "s" : ""} active
            </span>
          )}
        </div>
        <p className="text-xs text-white/50 mt-1">
          Pull context from GitHub, Notion, Layers, or Google Sheets into your AI generation.
        </p>
      </div>

      {/* Quick Import — paste any URL */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={quickUrl}
            onChange={(e) => { setQuickUrl(e.target.value); setQuickError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleQuickImport(); }}
            placeholder="Paste GitHub, Notion, Figma, or any URL..."
            className="flex-1 px-2.5 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500/50 focus:outline-none text-white placeholder-white/30"
          />
          <button
            onClick={handleQuickImport}
            disabled={quickLoading || !quickUrl.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors disabled:opacity-40"
          >
            {quickLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            Import
          </button>
        </div>
        {quickError && (
          <p className="mt-1.5 text-[10px] text-red-400">{quickError}</p>
        )}
        <p className="mt-1.5 text-[10px] text-white/30">
          Auto-detects GitHub repos, Notion pages, Figma files, or crawls any website.
        </p>
      </div>

      {/* Provider status bar */}
      <div className="px-4 py-2 border-b border-white/10 flex gap-3 flex-wrap">
        {loadingTools ? (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading tools...
          </div>
        ) : (
          <>
            {["github", "notion", "figma", "google-sheets"].map((provider) => {
              const meta = PROVIDER_META[provider];
              const providerTools = tools.filter((t) => t.provider === provider);
              const isConnected = providerTools.some((t) => t.connected);
              return (
                <div
                  key={provider}
                  className="flex items-center gap-1.5 text-xs"
                  title={isConnected ? `${meta.label}: Connected` : `${meta.label}: Using demo mode`}
                >
                  <span className={meta.color}>{meta.icon}</span>
                  <span className="text-white/60">{meta.label}</span>
                  {isConnected ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <span className="text-[10px] text-white/50 bg-white/5 px-1 rounded">demo</span>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Sources list */}
      <div className="flex-1 overflow-y-auto">
        {sources.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Database className="w-8 h-8 text-white/50 mx-auto mb-2" />
            <p className="text-xs text-white/50">No context sources added yet.</p>
            <p className="text-xs text-white/50 mt-1">
              Add a source below to pull external data into your generation.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {sources.map((source) => {
              const preset = getPresetForTool(source.toolName);
              const meta = PROVIDER_META[source.provider] || PROVIDER_META.custom;

              return (
                <div key={source.id} className="px-4 py-3">
                  {/* Source header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={meta.color}>{meta.icon}</span>
                      <span className="text-xs font-medium">{preset?.label || source.toolName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Include toggle */}
                      <button
                        onClick={() => toggleInclude(source.id)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title={source.included ? "Included in generation" : "Excluded from generation"}
                      >
                        {source.included ? (
                          <ToggleRight className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-white/50" />
                        )}
                      </button>
                      {/* Expand/collapse */}
                      <button
                        onClick={() => toggleExpand(source.id)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-white/50 transition-transform ${
                            source.expanded ? "" : "-rotate-90"
                          }`}
                        />
                      </button>
                      {/* Remove */}
                      <button
                        onClick={() => removeSource(source.id)}
                        className="p-1 rounded hover:bg-red-500/20 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-white/50 hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {source.expanded && (
                    <>
                      {/* Parameter inputs */}
                      <div className="space-y-2 mb-2">
                        {preset?.fields.map((field) => (
                          <div key={field.key}>
                            <label className="text-[10px] text-white/50 uppercase tracking-wider">
                              {field.label}
                            </label>
                            <input
                              type="text"
                              value={source.params[field.key] || ""}
                              onChange={(e) => updateParam(source.id, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full mt-0.5 px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded focus:border-indigo-500/50 focus:outline-none text-white placeholder-white/50"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Fetch button */}
                      <button
                        onClick={() => fetchSource(source.id)}
                        disabled={source.loading}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-indigo-500/20 text-indigo-300 rounded hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
                      >
                        {source.loading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3" />
                            Fetch Context
                          </>
                        )}
                      </button>

                      {/* Result display */}
                      {source.result && (
                        <div
                          className={`mt-2 p-2 rounded border text-xs ${
                            source.result.success
                              ? "bg-green-500/5 border-green-500/20"
                              : "bg-red-500/5 border-red-500/20"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {source.result.success ? (
                              <Check className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                            ) : (
                              <X className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                            )}
                            <p
                              className={`leading-relaxed ${
                                source.result.success ? "text-green-300/80" : "text-red-300/80"
                              }`}
                            >
                              {source.result.summary}
                            </p>
                          </div>

                          {/* Preview data */}
                          {source.result.success && source.result.data != null && (
                            <details className="mt-2">
                              <summary className="text-[10px] text-white/50 cursor-pointer hover:text-white/60 flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Preview data
                              </summary>
                              <pre className="mt-1 p-2 bg-black/30 rounded text-[10px] text-white/50 overflow-x-auto max-h-40 overflow-y-auto">
                                {typeof source.result.data === "string"
                                  ? (source.result.data as string).slice(0, 2000)
                                  : JSON.stringify(source.result.data, null, 2).slice(0, 2000)}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add source button / menu */}
      <div className="border-t border-white/10 p-3">
        {showAddMenu ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/60">Add Context Source</span>
              <button
                onClick={() => setShowAddMenu(false)}
                className="p-1 rounded hover:bg-white/10"
              >
                <X className="w-3 h-3 text-white/50" />
              </button>
            </div>
            {PRESETS.map((preset) => {
              const tool = tools.find((t) => t.name === preset.toolName);
              const provider = tool?.provider || "custom";
              const meta = PROVIDER_META[provider] || PROVIDER_META.custom;
              return (
                <button
                  key={preset.toolName}
                  onClick={() => addSource(preset)}
                  className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded hover:bg-white/5 transition-colors text-left"
                >
                  <span className={`mt-0.5 ${meta.color}`}>{meta.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-white/80">{preset.label}</div>
                    <div className="text-[10px] text-white/50 mt-0.5">{preset.description}</div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-white/50 mt-0.5 ml-auto flex-shrink-0" />
                </button>
              );
            })}
          </div>
        ) : (
          <button
            onClick={() => setShowAddMenu(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium border border-dashed border-white/20 rounded hover:border-indigo-500/40 hover:bg-indigo-500/5 text-white/50 hover:text-indigo-300 transition-colors"
          >
            <Link className="w-3.5 h-3.5" />
            Add Context Source
          </button>
        )}
      </div>
    </div>
  );
}
