"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Monitor, Tablet, Smartphone, ExternalLink, Loader2 } from "lucide-react";

type Viewport = "desktop" | "tablet" | "mobile";

const viewportConfig: Record<Viewport, { width: string; icon: typeof Monitor; label: string }> = {
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  mobile: { width: "375px", icon: Smartphone, label: "Mobile" },
};

export default function SharedProjectPage({ params }: { params: { token: string } }) {
  const [html, setHtml] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewport, setViewport] = useState<Viewport>("desktop");

  useEffect(() => {
    async function fetchShared() {
      try {
        const res = await fetch(`/api/projects/share?token=${encodeURIComponent(params.token)}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load shared project");
          return;
        }

        setName(data.name || "Shared Project");
        setHtml(data.html || "");
      } catch {
        setError("Failed to load shared project. Please check the URL and try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchShared();
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Loading shared project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <ExternalLink className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Project Not Found</h1>
          <p className="text-white/50 text-sm mb-8">{error}</p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Build Your Own
          </Link>
        </div>
      </div>
    );
  }

  const currentConfig = viewportConfig[viewport];

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#12121a]/90 backdrop-blur-sm shrink-0">
        {/* Left: branding + project name */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
              Z
            </div>
          </Link>
          <div className="h-5 w-px bg-white/10 shrink-0" />
          <h1 className="text-sm font-medium text-white/80 truncate">{name}</h1>
        </div>

        {/* Center: viewport toggles */}
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1">
          {(Object.keys(viewportConfig) as Viewport[]).map((vp) => {
            const config = viewportConfig[vp];
            const Icon = config.icon;
            const isActive = viewport === vp;
            return (
              <button
                key={vp}
                onClick={() => setViewport(vp)}
                className={`p-1.5 rounded-md transition-all ${
                  isActive
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-white/50 hover:text-white/60 hover:bg-white/[0.04]"
                }`}
                title={config.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Right: branding + CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] text-white/50 tracking-wider uppercase hidden sm:inline">
            Built with Zoobicon
          </span>
          <Link
            href="/builder"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Build Your Own
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Preview area */}
      <div className="flex-1 flex items-start justify-center overflow-auto bg-[#0a0a0f] p-0">
        <div
          className="h-full transition-all duration-300 ease-in-out bg-white"
          style={{
            width: currentConfig.width,
            maxWidth: "100%",
            ...(viewport !== "desktop"
              ? {
                  borderLeft: "1px solid rgba(255,255,255,0.06)",
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                }
              : {}),
          }}
        >
          <iframe
            srcDoc={html}
            className="w-full h-full border-0"
            title={`Preview of ${name}`}
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}
