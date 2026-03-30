"use client";

import { useState } from "react";
import {
  Mail,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

interface EmailResult {
  html: string;
  plainText: string;
  subject: string;
}

export default function EmailTemplatePanel({
  onApplyCode,
}: {
  onApplyCode: (html: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [emailType, setEmailType] = useState<"transactional" | "marketing" | "notification">("transactional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), type: emailType }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (data.html) onApplyCode(data.html);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const copyHtml = async () => {
    if (!result?.html) return;
    try { await navigator.clipboard.writeText(result.html); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const types = [
    { id: "transactional" as const, label: "Transactional", desc: "Order confirmations, receipts" },
    { id: "marketing" as const, label: "Marketing", desc: "Newsletters, promotions" },
    { id: "notification" as const, label: "Notification", desc: "Alerts, updates" },
  ];

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-white/50">
        Generate email templates compatible with Gmail, Outlook, and Apple Mail.
      </p>

      <div>
        <label className="text-xs text-white/50 block mb-1.5">Email Type</label>
        <div className="space-y-1.5">
          {types.map((t) => (
            <button
              key={t.id}
              onClick={() => setEmailType(t.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors border ${
                emailType === t.id
                  ? "bg-brand-500/10 border-brand-500/30 text-brand-400"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white/70"
              }`}
            >
              <div className="font-medium">{t.label}</div>
              <div className="text-[10px] opacity-60">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-white/50 block mb-1.5">Describe your email</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Booking confirmation for a hair salon appointment"
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/50 resize-none"
        />
      </div>

      <button
        onClick={generate}
        disabled={!prompt.trim() || loading}
        className="w-full py-2.5 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors disabled:opacity-40"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Generating email...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Mail size={16} /> Generate Email
          </span>
        )}
      </button>

      {result && (
        <>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/50 mb-1">Subject Line</div>
            <div className="text-sm text-white font-medium">{result.subject}</div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyHtml}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy HTML"}
            </button>
            <button
              onClick={() => result.html && onApplyCode(result.html)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors"
            >
              Preview
            </button>
          </div>

          <div className="p-3 rounded-lg bg-black/30 border border-white/10 max-h-32 overflow-auto">
            <div className="text-xs text-white/50 mb-1">Plain Text Version</div>
            <pre className="text-[11px] text-white/50 font-mono whitespace-pre-wrap">
              {result.plainText?.slice(0, 300)}
              {(result.plainText?.length || 0) > 300 ? "..." : ""}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
