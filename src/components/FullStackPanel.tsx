"use client";

import { useState } from "react";
import { Database, Loader2, Code, Server, Layout } from "lucide-react";

interface ApiRoute {
  path: string;
  method: string;
  handler: string;
}

interface FullStackResult {
  schema: string;
  api: ApiRoute[];
  html: string;
  description: string;
}

export default function FullStackPanel({
  onApplyCode,
}: {
  onApplyCode: (html: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FullStackResult | null>(null);
  const [activeView, setActiveView] = useState<"frontend" | "schema" | "api">("frontend");

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate/fullstack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), tier: "premium" }),
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

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-white/40">
        Vibe-to-Database — describe an app and get a real database schema, API routes, and interactive frontend.
      </p>

      <div>
        <label className="text-xs text-white/50 block mb-1.5">Describe your app</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A booking system for a hair salon with appointment scheduling, client management, and service catalog"
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/50 resize-none"
        />
      </div>

      <button
        onClick={generate}
        disabled={!prompt.trim() || loading}
        className="w-full py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-brand-500/30 to-cyan-500/20 text-brand-400 hover:from-brand-500/40 hover:to-cyan-500/30 transition-all disabled:opacity-40 border border-brand-500/20"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Building full-stack app...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Database size={16} /> Generate Full-Stack App
          </span>
        )}
      </button>

      {result && (
        <>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-xs text-emerald-400 font-medium">{result.description}</div>
          </div>

          <div className="flex gap-1 p-1 rounded-lg bg-white/5">
            {[
              { id: "frontend" as const, label: "Frontend", icon: <Layout size={12} /> },
              { id: "schema" as const, label: "Database", icon: <Database size={12} /> },
              { id: "api" as const, label: "API", icon: <Server size={12} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => tab.id === "frontend" ? onApplyCode(result.html) : setActiveView(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  activeView === tab.id
                    ? "bg-brand-500/20 text-brand-400"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {activeView === "schema" && (
            <div className="p-3 rounded-lg bg-black/30 border border-white/10 overflow-auto max-h-60">
              <pre className="text-[11px] text-emerald-400/80 font-mono whitespace-pre-wrap">
                {result.schema}
              </pre>
            </div>
          )}

          {activeView === "api" && (
            <div className="space-y-1.5">
              {result.api.map((route, i) => (
                <div key={i} className="p-2 rounded-lg bg-black/30 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      route.method === "GET" ? "bg-emerald-500/20 text-emerald-400" :
                      route.method === "POST" ? "bg-blue-500/20 text-blue-400" :
                      route.method === "PUT" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {route.method}
                    </span>
                    <span className="text-xs text-white/70 font-mono">{route.path}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
