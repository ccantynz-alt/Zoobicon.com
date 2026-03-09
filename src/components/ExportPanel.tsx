"use client";

import { useState } from "react";
import { Download, Github, Loader2, FileCode, FolderOpen } from "lucide-react";

interface ExportResult {
  files: Record<string, string>;
  projectName: string;
}

export default function ExportPanel({ code }: { code: string }) {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<"static" | "nextjs">("static");
  const [projectName, setProjectName] = useState("my-zoobicon-site");

  const handleExport = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const res = await fetch("/api/export/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: code, name: projectName, type: exportType }),
      });

      if (!res.ok) return;

      const data: ExportResult = await res.json();

      // Create a downloadable zip-like structure as individual files
      // For now, download as a single JSON with all files
      const blob = new Blob([JSON.stringify(data.files, null, 2)], {
        type: "application/json",
      });

      // Create individual file downloads
      for (const [path, content] of Object.entries(data.files)) {
        const fileBlob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(fileBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = path.replace(/\//g, "_");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // Small delay between downloads
        await new Promise((r) => setTimeout(r, 200));
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
        Export your site as a clean, professional project ready for GitHub or any hosting platform.
      </p>

      <div>
        <label className="text-xs text-white/50 block mb-1.5">Project Name</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value.replace(/[^a-z0-9-]/g, ""))}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/50"
          placeholder="my-site"
        />
      </div>

      <div>
        <label className="text-xs text-white/50 block mb-1.5">Export Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => setExportType("static")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${
              exportType === "static"
                ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                : "bg-white/5 text-white/50 border border-white/10 hover:text-white/70"
            }`}
          >
            <FileCode size={14} />
            Static HTML
          </button>
          <button
            onClick={() => setExportType("nextjs")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${
              exportType === "nextjs"
                ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                : "bg-white/5 text-white/50 border border-white/10 hover:text-white/70"
            }`}
          >
            <FolderOpen size={14} />
            Next.js
          </button>
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={!code || loading}
        className="w-full py-2.5 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors disabled:opacity-40"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Exporting...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Download size={16} /> Export Project
          </span>
        )}
      </button>

      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="text-xs text-white/40 mb-2">Included files:</div>
        {exportType === "static" ? (
          <div className="text-xs text-white/60 space-y-0.5 font-mono">
            <div>index.html</div>
            <div>package.json</div>
            <div>README.md</div>
            <div>.gitignore</div>
            <div>vercel.json</div>
            <div>netlify.toml</div>
          </div>
        ) : (
          <div className="text-xs text-white/60 space-y-0.5 font-mono">
            <div>src/app/page.tsx</div>
            <div>src/app/layout.tsx</div>
            <div>src/app/globals.css</div>
            <div>package.json</div>
            <div>next.config.js</div>
            <div>tailwind.config.ts</div>
            <div>tsconfig.json</div>
            <div>.gitignore</div>
          </div>
        )}
      </div>
    </div>
  );
}
