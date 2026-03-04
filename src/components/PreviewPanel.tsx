"use client";

import { Sparkles } from "lucide-react";

interface PreviewPanelProps {
  code: string;
  isGenerating: boolean;
}

export default function PreviewPanel({ code, isGenerating }: PreviewPanelProps) {
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-full bg-dark-400">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-10 h-10 border-2 border-white/10 rounded-full" />
            <div className="absolute inset-0 w-10 h-10 border-2 border-transparent border-t-brand-500 rounded-full animate-spin" />
          </div>
          <div className="text-sm font-medium text-white/70">
            Building your website...
          </div>
          <div className="text-xs text-white/30 mt-1">
            This may take a few seconds
          </div>
        </div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full bg-dark-400">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/10 to-accent-purple/10 border border-brand-500/10 mb-4">
            <Sparkles className="w-7 h-7 text-brand-400/60" />
          </div>
          <div className="text-lg font-semibold text-white/20 mb-2 tracking-tight">
            Zoobicon Builder
          </div>
          <div className="text-sm text-white/30">
            Describe a website and watch it come to life.
          </div>
          <div className="text-xs text-white/15 mt-4">
            Your preview will appear here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white">
      <iframe
        srcDoc={code}
        title="Website Preview"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
