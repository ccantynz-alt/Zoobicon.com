"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ChevronDown,
  Upload,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  Download,
  Eye,
  X,
  FileText,
  Copy,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Recipient {
  name: string;
  company?: string;
  role?: string;
  customFields?: Record<string, string>;
}

interface BatchVideoStatus {
  recipientName: string;
  recipientCompany: string;
  status: string;
  videoUrl: string | null;
  error: string | null;
}

interface BatchVideoPanelProps {
  /** The script from the main video creator (used as default template) */
  currentScript: string;
  /** Currently selected avatar */
  avatarId: string;
  /** Currently selected voice */
  voiceId: string;
  /** Current video format */
  format: "portrait" | "landscape" | "square";
  /** User email for tracking */
  email?: string;
  /** User plan */
  plan?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

const SUPPORTED_VARIABLES = [
  { name: "name", label: "Recipient Name", required: true },
  { name: "company", label: "Company", required: false },
  { name: "role", label: "Job Title", required: false },
  { name: "custom1", label: "Custom 1", required: false },
  { name: "custom2", label: "Custom 2", required: false },
  { name: "custom3", label: "Custom 3", required: false },
  { name: "custom4", label: "Custom 4", required: false },
  { name: "custom5", label: "Custom 5", required: false },
];

function extractVariables(template: string): string[] {
  const vars: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(VARIABLE_PATTERN.source, "g");
  while ((match = regex.exec(template)) !== null) {
    if (!vars.includes(match[1])) vars.push(match[1]);
  }
  return vars;
}

function personalizeScript(template: string, recipient: Recipient): string {
  return template.replace(VARIABLE_PATTERN, (_match, varName: string) => {
    const lower = varName.toLowerCase();
    if (lower === "name") return recipient.name || "";
    if (lower === "company") return recipient.company || "";
    if (lower === "role") return recipient.role || "";
    if (lower.startsWith("custom") && recipient.customFields) {
      return recipient.customFields[varName] || recipient.customFields[lower] || "";
    }
    return "";
  });
}

function parseCSV(text: string): Recipient[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));

  const nameIdx = headers.findIndex((h) => h === "name" || h === "full name" || h === "first name");
  const companyIdx = headers.findIndex((h) => h === "company" || h === "organization" || h === "org");
  const roleIdx = headers.findIndex((h) => h === "role" || h === "title" || h === "job title" || h === "position");
  const custom1Idx = headers.findIndex((h) => h === "custom1" || h === "custom 1");
  const custom2Idx = headers.findIndex((h) => h === "custom2" || h === "custom 2");
  const custom3Idx = headers.findIndex((h) => h === "custom3" || h === "custom 3");
  const custom4Idx = headers.findIndex((h) => h === "custom4" || h === "custom 4");
  const custom5Idx = headers.findIndex((h) => h === "custom5" || h === "custom 5");

  if (nameIdx === -1) return [];

  const recipients: Recipient[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV split (handles basic quoting)
    const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const name = cols[nameIdx]?.trim();
    if (!name) continue;

    const customFields: Record<string, string> = {};
    if (custom1Idx >= 0 && cols[custom1Idx]) customFields.custom1 = cols[custom1Idx];
    if (custom2Idx >= 0 && cols[custom2Idx]) customFields.custom2 = cols[custom2Idx];
    if (custom3Idx >= 0 && cols[custom3Idx]) customFields.custom3 = cols[custom3Idx];
    if (custom4Idx >= 0 && cols[custom4Idx]) customFields.custom4 = cols[custom4Idx];
    if (custom5Idx >= 0 && cols[custom5Idx]) customFields.custom5 = cols[custom5Idx];

    recipients.push({
      name,
      company: companyIdx >= 0 ? cols[companyIdx] || "" : "",
      role: roleIdx >= 0 ? cols[roleIdx] || "" : "",
      customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
    });
  }
  return recipients;
}

/* ------------------------------------------------------------------ */
/*  Highlighted script renderer                                        */
/* ------------------------------------------------------------------ */

function HighlightedScript({ text }: { text: string }) {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return (
    <span>
      {parts.map((part, i) =>
        VARIABLE_PATTERN.test(part) ? (
          <span key={i} className="bg-stone-500/20 text-stone-300 rounded px-1 font-mono text-xs">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BatchVideosPanel({
  currentScript,
  avatarId,
  voiceId,
  format,
  email,
  plan,
}: BatchVideoPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [scriptTemplate, setScriptTemplate] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [generating, setGenerating] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<{
    total: number;
    completed: number;
    failed: number;
    status: string;
    videos: BatchVideoStatus[];
  } | null>(null);
  const [error, setError] = useState("");
  const [previewIdx, setPreviewIdx] = useState(0);
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualRole, setManualRole] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use current script as default template if user hasn't typed one
  const effectiveScript = scriptTemplate || currentScript;
  const variables = extractVariables(effectiveScript);
  const formatMap: Record<string, string> = { portrait: "9:16", landscape: "16:9", square: "1:1" };

  // Preview personalized script for a random recipient
  const previewRecipient = recipients[previewIdx] || { name: "Sarah Johnson", company: "Acme Corp", role: "CEO" };
  const previewScript = personalizeScript(effectiveScript, previewRecipient);

  /* ---- CSV Upload ---- */
  const handleCSVUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError("Could not parse CSV. Make sure it has a 'name' column header.");
        return;
      }
      setRecipients((prev) => [...prev, ...parsed]);
      setError("");
    };
    reader.readAsText(file);
    // Reset input so re-uploading same file triggers change
    e.target.value = "";
  }, []);

  /* ---- Add manual recipient ---- */
  const addManualRecipient = useCallback(() => {
    if (!manualName.trim()) return;
    setRecipients((prev) => [
      ...prev,
      { name: manualName.trim(), company: manualCompany.trim(), role: manualRole.trim() },
    ]);
    setManualName("");
    setManualCompany("");
    setManualRole("");
    setShowAddManual(false);
  }, [manualName, manualCompany, manualRole]);

  /* ---- Remove recipient ---- */
  const removeRecipient = useCallback((idx: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  /* ---- Poll batch status ---- */
  const startPolling = useCallback(
    (id: string) => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/video-creator/batch/status?batchId=${id}`);
          if (!res.ok) return;
          const data = await res.json();
          setBatchStatus(data);
          if (data.status === "completed" || data.status === "failed") {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            setGenerating(false);
          }
        } catch {
          // Continue polling on network error
        }
      }, 8000); // Poll every 8 seconds
    },
    []
  );

  /* ---- Start batch generation ---- */
  const handleGenerate = useCallback(async () => {
    if (!effectiveScript.trim()) {
      setError("Write a script template with {{variables}} first.");
      return;
    }
    if (variables.length === 0) {
      setError("Script must contain at least one {{variable}} like {{name}} or {{company}}.");
      return;
    }
    if (recipients.length === 0) {
      setError("Add at least one recipient.");
      return;
    }

    setError("");
    setGenerating(true);
    setBatchStatus(null);

    try {
      const res = await fetch("/api/video-creator/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: effectiveScript,
          avatarId,
          voiceId: voiceId || undefined,
          format: formatMap[format] || "16:9",
          recipients,
          email,
          plan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start batch generation.");
        setGenerating(false);
        return;
      }

      setBatchId(data.batchId);
      setBatchStatus({
        total: data.totalVideos,
        completed: 0,
        failed: 0,
        status: "processing",
        videos: recipients.map((r) => ({
          recipientName: r.name,
          recipientCompany: r.company || "",
          status: "pending",
          videoUrl: null,
          error: null,
        })),
      });
      startPolling(data.batchId);
    } catch {
      setError("Network error. Please try again.");
      setGenerating(false);
    }
  }, [effectiveScript, variables, recipients, avatarId, voiceId, format, email, plan, formatMap, startPolling]);

  /* ---- Insert variable into script ---- */
  const insertVariable = useCallback((varName: string) => {
    setScriptTemplate((prev) => prev + `{{${varName}}}`);
  }, []);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* Header — click to expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-stone-600/30 to-stone-600/30 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white/90">Batch Personalized Videos</div>
            <div className="text-[10px] text-white/50">
              One template, hundreds of personalized videos
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Script Template */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                  Script Template
                </label>
                <p className="text-[10px] text-white/40">
                  Use {"{{name}}"}, {"{{company}}"}, {"{{role}}"}, or {"{{custom1}}"}-{"{{custom5}}"} as placeholders.
                </p>
                {/* Variable buttons */}
                <div className="flex flex-wrap gap-1">
                  {SUPPORTED_VARIABLES.slice(0, 3).map((v) => (
                    <button
                      key={v.name}
                      onClick={() => insertVariable(v.name)}
                      className="text-[10px] px-2 py-0.5 rounded bg-stone-500/10 text-stone-400 hover:bg-stone-500/20 transition-colors border border-stone-500/20"
                    >
                      {`{{${v.name}}}`}
                    </button>
                  ))}
                  <button
                    onClick={() => insertVariable("custom1")}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 hover:bg-white/10 transition-colors border border-white/10"
                  >
                    + custom
                  </button>
                </div>
                <textarea
                  value={scriptTemplate}
                  onChange={(e) => setScriptTemplate(e.target.value)}
                  placeholder={`Hi {{name}}, I noticed {{company}} is doing incredible things. As {{role}}, you know how important...`}
                  rows={4}
                  className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-stone-500/50 resize-none"
                />
                {variables.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                    <FileText className="w-3 h-3" />
                    Variables found: {variables.map((v) => `{{${v}}}`).join(", ")}
                  </div>
                )}
              </div>

              {/* Preview */}
              {effectiveScript && recipients.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Preview
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewIdx((p) => (p > 0 ? p - 1 : recipients.length - 1))}
                        className="text-[10px] text-white/40 hover:text-white/70 px-1"
                      >
                        Prev
                      </button>
                      <span className="text-[10px] text-white/30">
                        {previewIdx + 1}/{recipients.length}
                      </span>
                      <button
                        onClick={() => setPreviewIdx((p) => (p < recipients.length - 1 ? p + 1 : 0))}
                        className="text-[10px] text-white/40 hover:text-white/70 px-1"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 text-xs text-white/70 leading-relaxed">
                    {previewScript}
                  </div>
                </div>
              )}

              {/* Recipients */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                    Recipients ({recipients.length})
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCSVUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/60 hover:bg-white/10 transition-colors flex items-center gap-1 border border-white/10"
                    >
                      <Upload className="w-3 h-3" /> Upload CSV
                    </button>
                    <button
                      onClick={() => setShowAddManual(true)}
                      className="text-[10px] px-2 py-0.5 rounded bg-stone-500/10 text-stone-400 hover:bg-stone-500/20 transition-colors flex items-center gap-1 border border-stone-500/20"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                </div>

                {/* CSV format hint */}
                <p className="text-[10px] text-white/30">
                  CSV columns: name, company, role, custom1-custom5
                </p>

                {/* Manual add form */}
                <AnimatePresence>
                  {showAddManual && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-2 space-y-1.5">
                        <input
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          placeholder="Name (required)"
                          className="w-full rounded bg-white/[0.05] border border-white/[0.08] px-2 py-1 text-xs text-white/90 placeholder:text-white/30 focus:outline-none focus:border-stone-500/50"
                        />
                        <div className="flex gap-1.5">
                          <input
                            value={manualCompany}
                            onChange={(e) => setManualCompany(e.target.value)}
                            placeholder="Company"
                            className="flex-1 rounded bg-white/[0.05] border border-white/[0.08] px-2 py-1 text-xs text-white/90 placeholder:text-white/30 focus:outline-none focus:border-stone-500/50"
                          />
                          <input
                            value={manualRole}
                            onChange={(e) => setManualRole(e.target.value)}
                            placeholder="Role"
                            className="flex-1 rounded bg-white/[0.05] border border-white/[0.08] px-2 py-1 text-xs text-white/90 placeholder:text-white/30 focus:outline-none focus:border-stone-500/50"
                          />
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setShowAddManual(false)}
                            className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 hover:bg-white/10"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={addManualRecipient}
                            disabled={!manualName.trim()}
                            className="text-[10px] px-2 py-0.5 rounded bg-stone-600 text-white hover:bg-stone-500 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Add Recipient
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Recipient list */}
                {recipients.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-0.5 rounded-lg bg-white/[0.02] border border-white/[0.06] p-1.5">
                    {recipients.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-0.5 px-1.5 rounded hover:bg-white/[0.03] group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-stone-500/30 to-stone-500/30 flex items-center justify-center text-[9px] text-stone-300 font-bold flex-shrink-0">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] text-white/80 truncate">{r.name}</div>
                            {(r.company || r.role) && (
                              <div className="text-[9px] text-white/40 truncate">
                                {[r.role, r.company].filter(Boolean).join(" at ")}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeRecipient(idx)}
                          className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-stone-400 transition-all p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {recipients.length === 0 && (
                  <div className="rounded-lg border border-dashed border-white/[0.08] p-4 text-center">
                    <Users className="w-5 h-5 text-white/20 mx-auto mb-1" />
                    <p className="text-[10px] text-white/30">
                      Upload a CSV or add recipients manually
                    </p>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-stone-500/10 border border-stone-500/20 p-2 text-[11px] text-stone-300">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Generate button */}
              {!batchStatus && (
                <button
                  onClick={handleGenerate}
                  disabled={generating || recipients.length === 0 || variables.length === 0}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 text-white text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting {recipients.length} videos...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Generate {recipients.length} Personalized Video{recipients.length !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              )}

              {/* Batch Progress */}
              {batchStatus && (
                <div className="space-y-2">
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/60">
                        {batchStatus.status === "completed"
                          ? "Batch complete"
                          : batchStatus.status === "failed"
                          ? "Batch failed"
                          : "Processing..."}
                      </span>
                      <span className="text-white/40">
                        {batchStatus.completed + batchStatus.failed} / {batchStatus.total}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          batchStatus.status === "failed"
                            ? "bg-stone-500"
                            : batchStatus.status === "completed"
                            ? "bg-stone-500"
                            : "bg-stone-500"
                        }`}
                        style={{
                          width: `${Math.round(
                            ((batchStatus.completed + batchStatus.failed) / batchStatus.total) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <span className="text-stone-400">
                        {batchStatus.completed} completed
                      </span>
                      {batchStatus.failed > 0 && (
                        <span className="text-stone-400">{batchStatus.failed} failed</span>
                      )}
                      <span className="text-white/30">
                        {batchStatus.total - batchStatus.completed - batchStatus.failed} remaining
                      </span>
                    </div>
                  </div>

                  {/* Individual video statuses */}
                  <div className="max-h-48 overflow-y-auto space-y-0.5 rounded-lg bg-white/[0.02] border border-white/[0.06] p-1.5">
                    {batchStatus.videos.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-white/[0.03]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {v.status === "completed" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                          ) : v.status === "failed" ? (
                            <AlertCircle className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                          ) : v.status === "processing" ? (
                            <Loader2 className="w-3.5 h-3.5 text-stone-400 animate-spin flex-shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-[11px] text-white/80 truncate">{v.recipientName}</div>
                            {v.recipientCompany && (
                              <div className="text-[9px] text-white/40 truncate">{v.recipientCompany}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {v.status === "completed" && v.videoUrl && (
                            <a
                              href={v.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] px-1.5 py-0.5 rounded bg-stone-500/10 text-stone-400 hover:bg-stone-500/20 flex items-center gap-0.5"
                            >
                              <Download className="w-3 h-3" /> Download
                            </a>
                          )}
                          {v.status === "failed" && v.error && (
                            <span className="text-[9px] text-stone-400 truncate max-w-[120px]">{v.error}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reset button when done */}
                  {(batchStatus.status === "completed" || batchStatus.status === "failed") && (
                    <button
                      onClick={() => {
                        setBatchId(null);
                        setBatchStatus(null);
                        setGenerating(false);
                      }}
                      className="w-full py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-white/60 text-[11px] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" /> Start New Batch
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
