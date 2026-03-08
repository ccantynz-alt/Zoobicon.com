"use client";

import { useMemo } from "react";

interface PreviewPanelProps {
  html: string;
  isGenerating: boolean;
}

export default function PreviewPanel({ html, isGenerating }: PreviewPanelProps) {
  const srcDoc = useMemo(() => html || "", [html]);

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="flex gap-1 justify-center mb-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-8 bg-brand-500/30 rounded-sm"
                style={{
                  animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scaleY(0.4); opacity: 0.3; }
              50% { transform: scaleY(1); opacity: 1; }
            }
          `}</style>
          <p className="text-sm text-brand-400/60 uppercase tracking-[3px]">
            Generating
          </p>
          <p className="text-[10px] text-white/20 mt-2">
            Claude is building your website...
          </p>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-8">
          <div className="text-6xl mb-6 opacity-10">Z</div>
          <p className="text-sm text-white/30 uppercase tracking-[2px] mb-3">
            No preview yet
          </p>
          <p className="text-xs text-white/20 leading-relaxed">
            Describe a website in the prompt panel and hit Build Website to see
            it rendered here in real time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={srcDoc}
      className="w-full h-full border-0 bg-white"
      title="Website preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
