"use client";

interface PreviewPanelProps {
  code: string;
  isGenerating: boolean;
}

export default function PreviewPanel({ code, isGenerating }: PreviewPanelProps) {
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            {/* Spinning ring */}
            <div className="w-20 h-20 border-2 border-cyber-magenta/20 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-2 border-transparent border-t-cyber-magenta rounded-full animate-spin" />
            <div className="absolute inset-2 w-16 h-16 border border-transparent border-b-cyber-cyan rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <div className="font-display text-sm text-cyber-magenta tracking-widest uppercase animate-pulse">
            Building...
          </div>
          <div className="font-mono text-[10px] text-gray-600 mt-2">
            AI is constructing your website
          </div>
        </div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="font-display text-4xl font-black text-cyber-magenta/20 mb-4 tracking-wider">
            ZOOBICON
          </div>
          <div className="font-body text-gray-600 text-sm">
            Describe a website and watch it come to life.
          </div>
          <div className="font-mono text-[10px] text-cyber-cyan/30 mt-6">
            [ AWAITING INPUT ]
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
