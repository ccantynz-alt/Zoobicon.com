"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Play, GitBranch, Download, Loader2 } from "lucide-react";
import MonacoEditor from "@/components/MonacoEditor";
import FileExplorer from "@/components/FileExplorer";
import SandpackPreview from "@/components/SandpackPreview";

/**
 * Developer IDE — full code editor for Zoobicon-generated projects.
 * Monaco editor + file tree + live preview. "Hook in mouth" retention.
 */
export default function BuilderIDEPage() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activePath, setActivePath] = useState<string>("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pushingToGitBranch, setPushingToGitBranch] = useState(false);

  // Load files from localStorage (saved by builder page)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zoobicon_ide_files");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setFiles(parsed);
          const first = Object.keys(parsed).find((p) => p.endsWith("App.tsx")) || Object.keys(parsed)[0];
          if (first) setActivePath(first);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist on change
  useEffect(() => {
    if (Object.keys(files).length > 0) {
      try {
        localStorage.setItem("zoobicon_ide_files", JSON.stringify(files));
      } catch {
        // quota exceeded — ignore
      }
    }
  }, [files]);

  const language = useMemo(() => {
    if (!activePath) return "typescript";
    if (activePath.endsWith(".tsx") || activePath.endsWith(".ts")) return "typescript";
    if (activePath.endsWith(".jsx") || activePath.endsWith(".js")) return "javascript";
    if (activePath.endsWith(".css")) return "css";
    if (activePath.endsWith(".html")) return "html";
    if (activePath.endsWith(".json")) return "json";
    if (activePath.endsWith(".md")) return "markdown";
    return "plaintext";
  }, [activePath]);

  const handleEdit = (value: string) => {
    if (!activePath) return;
    setFiles((prev) => ({ ...prev, [activePath]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem("zoobicon_ide_files", JSON.stringify(files));
      setDirty(false);
    } finally {
      setTimeout(() => setSaving(false), 300);
    }
  };

  // Ctrl/Cmd+S to save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const handlePushToGitBranch = async () => {
    setPushingToGitBranch(true);
    try {
      const repoName = prompt("Repository name:", "zoobicon-project");
      if (!repoName) {
        setPushingToGitBranch(false);
        return;
      }
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files,
          repoName,
          isPrivate: true,
          commitMessage: "Update from Zoobicon IDE",
          description: "Built with Zoobicon",
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(`GitHub error: ${data.error}`);
      } else if (data.repoUrl) {
        window.open(data.repoUrl, "_blank");
      }
    } catch (err) {
      alert(`Failed to push: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setPushingToGitBranch(false);
    }
  };

  const handleDownload = () => {
    // Download all files as a JSON blob
    const blob = new Blob([JSON.stringify(files, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zoobicon-project.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeContent = activePath ? (files[activePath] ?? "") : "";
  const fileCount = Object.keys(files).length;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0d17] text-white overflow-hidden">
      {/* Top toolbar */}
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-white/10 bg-[#131520]">
        <div className="flex items-center gap-3">
          <Link
            href="/builder"
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Builder
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <h1 className="text-sm font-medium">Zoobicon IDE</h1>
          <span className="text-xs text-white/40">
            {fileCount} {fileCount === 1 ? "file" : "files"}
          </span>
          {dirty && (
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
              Unsaved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
            <kbd className="ml-1 px-1 text-[10px] text-white/40">⌘S</kbd>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
          <button
            onClick={handlePushToGitBranch}
            disabled={pushingToGitBranch || fileCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {pushingToGitBranch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
            Push to GitHub
          </button>
          <Link
            href="/builder"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#6d5dfc] hover:bg-[#5a4de8] transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Back to Preview
          </Link>
        </div>
      </header>

      {/* Three-pane layout */}
      <div className="flex-1 min-h-0 flex">
        {/* File tree */}
        <aside className="w-60 shrink-0 border-r border-white/10 bg-[#131520] flex flex-col">
          <div className="h-9 shrink-0 px-3 flex items-center text-[11px] font-semibold uppercase tracking-wider text-white/40 border-b border-white/10">
            Files
          </div>
          <div className="flex-1 min-h-0">
            <FileExplorer files={files} activePath={activePath} onSelect={setActivePath} />
          </div>
        </aside>

        {/* Editor */}
        <section className="flex-1 min-w-0 flex flex-col border-r border-white/10">
          <div className="h-9 shrink-0 px-3 flex items-center text-[12px] text-white/60 bg-[#131520] border-b border-white/10">
            {activePath || "Select a file to edit"}
          </div>
          <div className="flex-1 min-h-0 bg-[#1e1e1e]">
            {activePath ? (
              <MonacoEditor
                key={activePath}
                value={activeContent}
                language={language}
                onChange={handleEdit}
                path={activePath}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-white/30 text-sm">
                Select a file from the tree to start editing
              </div>
            )}
          </div>
        </section>

        {/* Live preview */}
        <aside className="w-[40%] shrink-0 flex flex-col">
          <div className="h-9 shrink-0 px-3 flex items-center text-[11px] font-semibold uppercase tracking-wider text-white/40 bg-[#131520] border-b border-white/10">
            Live Preview
          </div>
          <div className="flex-1 min-h-0 relative bg-[#131520]">
            <SandpackPreview mode="react" files={files} />
          </div>
        </aside>
      </div>
    </div>
  );
}
