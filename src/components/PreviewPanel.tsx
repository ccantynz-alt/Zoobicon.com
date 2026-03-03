"use client";

interface PreviewPanelProps {
  code: string;
  isGenerating: boolean;
}

export default function PreviewPanel({ code, isGenerating }: PreviewPanelProps) {
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-10 h-10 border-2 border-gray-200 rounded-full" />
            <div className="absolute inset-0 w-10 h-10 border-2 border-transparent border-t-brand-500 rounded-full animate-spin" />
          </div>
          <div className="text-sm font-medium text-gray-700">
            Building your website...
          </div>
          <div className="text-xs text-gray-400 mt-1">
            This may take a few seconds
          </div>
        </div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center max-w-sm">
          <div className="text-2xl font-semibold text-gray-200 mb-2 tracking-tight">
            Zoobicon
          </div>
          <div className="text-sm text-gray-400">
            Describe a website and watch it come to life.
          </div>
          <div className="text-xs text-gray-300 mt-4">
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
