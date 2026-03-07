"use client";

import { Sparkles, Monitor, Tablet, Smartphone } from "lucide-react";

type DeviceMode = "desktop" | "tablet" | "mobile";

interface PreviewPanelProps {
  code: string;
  isGenerating: boolean;
  deviceMode: DeviceMode;
  onDeviceModeChange: (mode: DeviceMode) => void;
}

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export default function PreviewPanel({
  code,
  isGenerating,
  deviceMode,
  onDeviceModeChange,
}: PreviewPanelProps) {
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-full bg-dark-400">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-12 h-12 border-2 border-white/10 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-brand-500 rounded-full animate-spin" />
          </div>
          <div className="text-sm font-medium text-white/70">
            Building your website...
          </div>
          <div className="text-xs text-white/30 mt-1">
            Watch the code stream in real-time
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
            Describe a website or pick a template to start.
          </div>
          <div className="text-xs text-white/15 mt-4">
            Your preview will appear here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Device toggle bar */}
      <div className="flex items-center justify-center gap-1 px-4 py-2 border-b border-white/[0.06] bg-dark-300/50">
        <button
          onClick={() => onDeviceModeChange("desktop")}
          className={`p-1.5 rounded-md transition-colors ${
            deviceMode === "desktop" ? "bg-white/[0.08] text-brand-400" : "text-white/25 hover:text-white/50"
          }`}
          title="Desktop"
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDeviceModeChange("tablet")}
          className={`p-1.5 rounded-md transition-colors ${
            deviceMode === "tablet" ? "bg-white/[0.08] text-brand-400" : "text-white/25 hover:text-white/50"
          }`}
          title="Tablet"
        >
          <Tablet className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDeviceModeChange("mobile")}
          className={`p-1.5 rounded-md transition-colors ${
            deviceMode === "mobile" ? "bg-white/[0.08] text-brand-400" : "text-white/25 hover:text-white/50"
          }`}
          title="Mobile"
        >
          <Smartphone className="w-4 h-4" />
        </button>
        <span className="ml-2 text-[10px] text-white/15">
          {deviceMode === "desktop" ? "100%" : DEVICE_WIDTHS[deviceMode]}
        </span>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 overflow-auto bg-dark-400 flex justify-center">
        <div
          className="h-full transition-all duration-300 ease-out bg-white"
          style={{
            width: DEVICE_WIDTHS[deviceMode],
            maxWidth: "100%",
            boxShadow: deviceMode !== "desktop" ? "0 0 60px -15px rgba(0,0,0,0.5)" : "none",
          }}
        >
          <iframe
            srcDoc={code}
            title="Website Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
