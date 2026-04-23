"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Key,
  Brain,
  History,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Check,
  AlertCircle,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types (inline to avoid importing server-only flywheel module)
// ---------------------------------------------------------------------------

interface MemoryEntry {
  id: string;
  type: "preference" | "brand" | "instruction" | "feedback" | "context";
  content: string;
  source: string;
  timestamp: string;
}

interface BuildRecord {
  id: string;
  prompt: string;
  model: string;
  duration: number;
  timestamp: string;
  status: "success" | "error" | "partial";
  filesGenerated?: number;
}

interface ApiKeyConfig {
  key: string;
  label: string;
  description: string;
  envVar: string;
  required: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LS_SETTINGS = "zbk_settings";
const LS_MEMORIES = "zbk_memories";
const LS_BUILDS = "zbk_builds";

const API_KEYS: ApiKeyConfig[] = [
  {
    key: "anthropic",
    label: "Anthropic (Claude)",
    description: "Powers AI generation, editing, and the build pipeline. Required.",
    envVar: "ANTHROPIC_API_KEY",
    required: true,
  },
  {
    key: "openai",
    label: "OpenAI (GPT)",
    description: "Failover provider for generation when Anthropic is unavailable.",
    envVar: "OPENAI_API_KEY",
    required: false,
  },
  {
    key: "google",
    label: "Google AI (Gemini)",
    description: "Second failover provider. Free tier: 1,500 requests/day.",
    envVar: "GOOGLE_AI_API_KEY",
    required: false,
  },
];

const MEMORY_TYPES: MemoryEntry["type"][] = [
  "preference",
  "brand",
  "instruction",
  "feedback",
  "context",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "...";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusDot({ set }: { set: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        set ? "bg-emerald-500" : "bg-red-400"
      }`}
      title={set ? "Key is set" : "Key not set"}
    />
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-500/20 to-stone-600/10 border border-stone-500/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-stone-500" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ApiKeyRow
// ---------------------------------------------------------------------------

function ApiKeyRow({
  config,
  value,
  onSave,
  onRemove,
}: {
  config: ApiKeyConfig;
  value: string;
  onSave: (key: string, val: string) => void;
  onRemove: (key: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  const isSet = value.length > 0;

  const handleSave = () => {
    if (!draft.trim()) return;
    onSave(config.key, draft.trim());
    setEditing(false);
    setDraft("");
    setVisible(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemove = () => {
    onRemove(config.key);
    setEditing(false);
    setDraft("");
    setVisible(false);
  };

  return (
    <div className="py-4 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <StatusDot set={isSet} />
          <span className="text-sm font-medium text-slate-700">{config.label}</span>
          {config.required && (
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-600 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5">
              Required
            </span>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
        <code className="text-xs text-slate-600 font-mono">{config.envVar}</code>
      </div>
      <p className="text-xs text-slate-600 mb-3">{config.description}</p>

      {isSet && !editing ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 font-mono text-sm text-slate-700 tracking-widest">
            {visible ? value : "●●●●●●●●●●●●"}
          </div>
          <button
            onClick={() => setVisible(!visible)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={visible ? "Hide" : "Show"}
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setEditing(true);
              setDraft(value);
            }}
            className="px-3 py-2 rounded-lg text-xs font-medium text-stone-600 bg-stone-50 border border-stone-200/80 hover:bg-stone-100 transition-colors"
          >
            Update
          </button>
          <button
            onClick={handleRemove}
            className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Remove key"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type={visible ? "text" : "password"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Paste your ${config.envVar} here...`}
            className="flex-1 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 font-mono text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-stone-400/40 focus:border-stone-400 transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setEditing(false);
                setDraft("");
              }
            }}
            autoFocus={editing}
          />
          <button
            onClick={() => setVisible(!visible)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={handleSave}
            disabled={!draft.trim()}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-stone-600 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          {editing && (
            <button
              onClick={() => {
                setEditing(false);
                setDraft("");
              }}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminSettingsPage() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [builds, setBuilds] = useState<BuildRecord[]>([]);

  // New memory form
  const [newMemoryContent, setNewMemoryContent] = useState("");
  const [newMemoryType, setNewMemoryType] = useState<MemoryEntry["type"]>("preference");
  const [showMemoryForm, setShowMemoryForm] = useState(false);

  // Build detail expansion
  const [expandedBuild, setExpandedBuild] = useState<string | null>(null);

  // Loading
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Load from localStorage on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const settings = readLS<Record<string, string>>(LS_SETTINGS, {});
    setApiKeys(settings);

    const mems = readLS<MemoryEntry[]>(LS_MEMORIES, []);
    setMemories(mems);

    const blds = readLS<BuildRecord[]>(LS_BUILDS, []);
    setBuilds(blds);

    setLoading(false);
  }, []);

  // ---------------------------------------------------------------------------
  // API Key handlers
  // ---------------------------------------------------------------------------
  const handleSaveKey = useCallback(
    (key: string, value: string) => {
      const updated = { ...apiKeys, [key]: value };
      setApiKeys(updated);
      writeLS(LS_SETTINGS, updated);
    },
    [apiKeys]
  );

  const handleRemoveKey = useCallback(
    (key: string) => {
      const updated = { ...apiKeys };
      delete updated[key];
      setApiKeys(updated);
      writeLS(LS_SETTINGS, updated);
    },
    [apiKeys]
  );

  // ---------------------------------------------------------------------------
  // Memory handlers
  // ---------------------------------------------------------------------------
  const handleAddMemory = useCallback(() => {
    if (!newMemoryContent.trim()) return;
    const entry: MemoryEntry = {
      id: generateId(),
      type: newMemoryType,
      content: newMemoryContent.trim(),
      source: "admin-manual",
      timestamp: new Date().toISOString(),
    };
    const updated = [entry, ...memories];
    setMemories(updated);
    writeLS(LS_MEMORIES, updated);
    setNewMemoryContent("");
    setShowMemoryForm(false);
  }, [memories, newMemoryContent, newMemoryType]);

  const handleDeleteMemory = useCallback(
    (id: string) => {
      const updated = memories.filter((m) => m.id !== id);
      setMemories(updated);
      writeLS(LS_MEMORIES, updated);
    },
    [memories]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage API keys, AI memory, and review build history.
        </p>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 1: API Keys */}
      {/* ------------------------------------------------------------------- */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <SectionHeader
          icon={Key}
          title="API Keys"
          subtitle="Configure provider keys for AI generation and failover."
        />

        <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Keys saved here are stored in your browser for local development only.
            For production, set these as environment variables in Vercel.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {API_KEYS.map((cfg) => (
            <ApiKeyRow
              key={cfg.key}
              config={cfg}
              value={apiKeys[cfg.key] || ""}
              onSave={handleSaveKey}
              onRemove={handleRemoveKey}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 2: Flywheel Memory */}
      {/* ------------------------------------------------------------------- */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <SectionHeader
          icon={Brain}
          title="Flywheel Memory"
          subtitle="Persistent AI context injected into every interaction."
        />

        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          These memories are injected into every AI interaction, making each
          conversation smarter than the last. Add brand guidelines, style
          preferences, or recurring instructions so the AI remembers them across
          sessions.
        </p>

        {/* Add memory form */}
        {showMemoryForm ? (
          <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 mb-5 space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-700 whitespace-nowrap">Type</label>
              <div className="relative">
                <select
                  value={newMemoryType}
                  onChange={(e) => setNewMemoryType(e.target.value as MemoryEntry["type"])}
                  className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-stone-400/40 cursor-pointer"
                >
                  {MEMORY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <textarea
              value={newMemoryContent}
              onChange={(e) => setNewMemoryContent(e.target.value)}
              placeholder="e.g. Always use the brand color #4F46E5 for primary buttons..."
              rows={3}
              className="w-full bg-white border border-slate-200/80 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-stone-400/40 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleAddMemory();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Ctrl+Enter to save</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowMemoryForm(false);
                    setNewMemoryContent("");
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMemory}
                  disabled={!newMemoryContent.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-stone-600 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3 h-3" />
                  Save Memory
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowMemoryForm(true)}
            className="mb-5 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-stone-600 bg-stone-50 border border-stone-200/80 hover:bg-stone-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Memory Entry
          </button>
        )}

        {/* Memory list */}
        {memories.length === 0 ? (
          <div className="text-center py-10 text-slate-300">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-slate-600">No memories yet</p>
            <p className="text-xs text-slate-600 mt-1">
              Add preferences, brand info, or instructions above.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {memories.map((mem) => (
              <div
                key={mem.id}
                className="group flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs uppercase tracking-wider font-semibold rounded px-1.5 py-0.5 ${
                        mem.type === "preference"
                          ? "text-blue-600 bg-blue-50 border border-blue-200/60"
                          : mem.type === "brand"
                          ? "text-purple-600 bg-purple-50 border border-purple-200/60"
                          : mem.type === "instruction"
                          ? "text-emerald-600 bg-emerald-50 border border-emerald-200/60"
                          : mem.type === "feedback"
                          ? "text-amber-600 bg-amber-50 border border-amber-200/60"
                          : "text-slate-600 bg-slate-100 border border-slate-200/60"
                      }`}
                    >
                      {mem.type}
                    </span>
                    <span className="text-xs text-slate-300">{formatDate(mem.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{mem.content}</p>
                  {mem.source && mem.source !== "admin-manual" && (
                    <p className="text-xs text-slate-300 mt-1">Source: {mem.source}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteMemory(mem.id)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  title="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 3: Build History */}
      {/* ------------------------------------------------------------------- */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <SectionHeader
          icon={History}
          title="Build History"
          subtitle="Recent AI generation runs and their results."
        />

        {builds.length === 0 ? (
          <div className="text-center py-10 text-slate-300">
            <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-slate-600">No builds recorded</p>
            <p className="text-xs text-slate-600 mt-1">
              Build history will appear here after your first AI generation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs uppercase tracking-wider text-slate-600 font-semibold px-6 py-2.5">
                    Prompt
                  </th>
                  <th className="text-left text-xs uppercase tracking-wider text-slate-600 font-semibold px-4 py-2.5 hidden sm:table-cell">
                    Model
                  </th>
                  <th className="text-left text-xs uppercase tracking-wider text-slate-600 font-semibold px-4 py-2.5 hidden md:table-cell">
                    Duration
                  </th>
                  <th className="text-left text-xs uppercase tracking-wider text-slate-600 font-semibold px-4 py-2.5">
                    Status
                  </th>
                  <th className="text-left text-xs uppercase tracking-wider text-slate-600 font-semibold px-6 py-2.5 hidden lg:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {builds.slice(0, 50).map((build) => {
                  const isExpanded = expandedBuild === build.id;
                  return (
                    <tr
                      key={build.id}
                      onClick={() => setExpandedBuild(isExpanded ? null : build.id)}
                      className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3">
                        <span className="text-slate-700 font-medium">
                          {isExpanded ? build.prompt : truncate(build.prompt, 50)}
                        </span>
                        {build.filesGenerated !== undefined && (
                          <span className="ml-2 text-xs text-slate-600">
                            {build.filesGenerated} file{build.filesGenerated !== 1 ? "s" : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <code className="text-xs text-slate-700 font-mono bg-slate-50 px-1.5 py-0.5 rounded">
                          {build.model}
                        </code>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-700">
                          {build.duration < 1000
                            ? `${build.duration}ms`
                            : `${(build.duration / 1000).toFixed(1)}s`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${
                            build.status === "success"
                              ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                              : build.status === "error"
                              ? "text-red-700 bg-red-50 border border-red-200/60"
                              : "text-amber-700 bg-amber-50 border border-amber-200/60"
                          }`}
                        >
                          {build.status === "success" && <Check className="w-3 h-3" />}
                          {build.status === "error" && <AlertCircle className="w-3 h-3" />}
                          {build.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 hidden lg:table-cell">
                        <span className="text-xs text-slate-600">{formatDate(build.timestamp)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {builds.length > 50 && (
              <p className="text-center text-xs text-slate-600 py-3">
                Showing 50 of {builds.length} builds
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
