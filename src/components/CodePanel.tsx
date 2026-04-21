"use client";

import { useState, useRef, useCallback } from "react";
import {
  FileCode,
  FileText,
  FileType,
  FileJson,
  File,
  Save,
  Download,
} from "lucide-react";
import type { ProjectFile } from "./ProjectTree";

interface CodePanelProps {
  html: string;
  reactSource?: Record<string, string> | null;
  projectFiles?: ProjectFile[];
  activeProjectFile?: string | null;
  onProjectFileSelect?: (path: string) => void;
  onProjectFileChange?: (path: string, content: string) => void;
}

function getTabIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
      return <FileCode size={12} />;
    case "css":
    case "scss":
      return <FileType size={12} />;
    case "json":
      return <FileJson size={12} />;
    case "html":
      return <FileCode size={12} />;
    default:
      return <File size={12} />;
  }
}

function getShortName(path: string): string {
  const parts = path.split("/");
  if (parts.length <= 2) return path;
  return parts.slice(-2).join("/");
}

export default function CodePanel({
  html,
  reactSource,
  projectFiles,
  activeProjectFile,
  onProjectFileSelect,
  onProjectFileChange,
}: CodePanelProps) {
  const [copied, setCopied] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isProjectMode = projectFiles && projectFiles.length > 0;

  // Determine what code to display
  let displayCode: string;
  let displayLabel: string;

  if (isProjectMode) {
    const currentFile = projectFiles.find((f) => f.path === activeProjectFile);
    displayCode = currentFile?.content || "// Select a file from the tree";
    displayLabel = activeProjectFile || "No file selected";
  } else {
    const hasReact = reactSource && Object.keys(reactSource).length >= 3;
    displayCode =
      activeFile && reactSource?.[activeFile] ? reactSource[activeFile] : html;
    displayLabel = activeFile || "Generated HTML";
    // If we're in the legacy react mode, we use the hasReact variable below
    void 0; // keep hasReact usage below
  }

  const hasReact =
    !isProjectMode && reactSource && Object.keys(reactSource).length >= 3;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silently fail
    }
  };

  const handleDownload = () => {
    if (isProjectMode) {
      // Download current file
      const ext = activeProjectFile?.split(".").pop() || "txt";
      const mimeMap: Record<string, string> = {
        html: "text/html",
        css: "text/css",
        js: "text/javascript",
        ts: "text/typescript",
        tsx: "text/typescript",
        jsx: "text/javascript",
        json: "application/json",
      };
      const mime = mimeMap[ext] || "text/plain";
      const blob = new Blob([displayCode], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeProjectFile?.split("/").pop() || "file.txt";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const isReact = activeFile !== null;
      const blob = new Blob([displayCode], {
        type: isReact ? "text/plain" : "text/html",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeFile || "zoobicon-site.html";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isProjectMode && activeProjectFile && onProjectFileChange) {
        onProjectFileChange(activeProjectFile, e.target.value);
      }
    },
    [isProjectMode, activeProjectFile, onProjectFileChange]
  );

  if (!html && !isProjectMode) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-white/50 uppercase tracking-[2px]">
          No code generated yet
        </p>
      </div>
    );
  }

  // Find current project file's modified state
  const currentProjectFile = isProjectMode
    ? projectFiles.find((f) => f.path === activeProjectFile)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Project mode file tabs */}
      {isProjectMode && (
        <div className="flex items-center gap-1 px-2 pt-2 pb-0 overflow-x-auto border-b border-white/[0.06] scrollbar-thin">
          {projectFiles.map((file) => {
            const isActive = file.path === activeProjectFile;
            return (
              <button
                key={file.path}
                onClick={() => onProjectFileSelect?.(file.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? "bg-white/[0.06] text-brand-400 border-b-2 border-brand-400"
                    : "text-white/50 hover:text-white/60"
                }`}
                title={file.path}
              >
                {getTabIcon(file.path)}
                {getShortName(file.path)}
                {file.isModified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Legacy React source file tabs */}
      {hasReact && (
        <div className="flex items-center gap-1 px-2 pt-2 pb-0 overflow-x-auto border-b border-white/[0.06]">
          <button
            onClick={() => setActiveFile(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-[11px] font-medium whitespace-nowrap transition-colors ${
              activeFile === null
                ? "bg-white/[0.06] text-brand-400 border-b-2 border-brand-400"
                : "text-white/50 hover:text-white/60"
            }`}
          >
            <FileText size={12} />
            HTML
          </button>
          {Object.keys(reactSource!).map((filename) => (
            <button
              key={filename}
              onClick={() => setActiveFile(filename)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-[11px] font-medium whitespace-nowrap transition-colors ${
                activeFile === filename
                  ? "bg-white/[0.06] text-stone-400 border-b-2 border-stone-400"
                  : "text-white/50 hover:text-white/60"
              }`}
            >
              <FileCode size={12} />
              {filename
                .replace(/^src\/components\//, "")
                .replace(/^src\/app\//, "")}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
        <span className="text-[10px] uppercase tracking-[2px] text-white/50 flex-1 truncate">
          {displayLabel}
        </span>
        {isProjectMode && currentProjectFile?.isModified && (
          <span className="flex items-center gap-1 text-[10px] text-stone-400/70">
            <Save size={10} />
            Modified
          </span>
        )}
        <button
          onClick={handleCopy}
          className="text-[11px] text-brand-400/60 hover:text-brand-400 transition-colors px-2 py-1 rounded hover:bg-white/[0.03]"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={handleDownload}
          className="text-[11px] text-stone-400/60 hover:text-stone-400 transition-colors px-2 py-1 rounded hover:bg-white/[0.03] flex items-center gap-1"
        >
          <Download size={10} />
          Download
        </button>
      </div>

      {/* Code display — editable in project mode, read-only otherwise */}
      {isProjectMode && onProjectFileChange ? (
        <textarea
          ref={textareaRef}
          value={displayCode}
          onChange={handleContentChange}
          spellCheck={false}
          className="flex-1 overflow-auto p-4 text-xs leading-relaxed text-stone-400/80 bg-transparent resize-none outline-none font-mono"
        />
      ) : (
        <pre className="flex-1 overflow-auto p-4 text-xs leading-relaxed text-stone-400/80">
          <code>{displayCode}</code>
        </pre>
      )}
    </div>
  );
}
