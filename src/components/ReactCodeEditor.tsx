"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FileText, ChevronRight } from "lucide-react";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface ReactCodeEditorProps {
  files: Record<string, string>;
  onFileChange?: (path: string, content: string) => void;
}

export default function ReactCodeEditor({ files, onFileChange }: ReactCodeEditorProps) {
  const paths = Object.keys(files).sort((a, b) => {
    if (a === "App.tsx") return -1;
    if (b === "App.tsx") return 1;
    return a.localeCompare(b);
  });

  const [activeFile, setActiveFile] = useState(paths[0] || "App.tsx");

  const getLanguage = (path: string) => {
    if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".json")) return "json";
    return "typescript";
  };

  return (
    <div className="flex h-full bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/10">
      {/* File Tree */}
      <div className="w-48 flex-shrink-0 bg-[#252526] border-r border-white/10 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Files</div>
        {paths.map(path => (
          <button
            key={path}
            onClick={() => setActiveFile(path)}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
              activeFile === path
                ? "bg-[#37373d] text-white"
                : "text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
            <span className="truncate">{path.includes("/") ? path.split("/").pop() : path}</span>
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0">
        {/* Tab bar */}
        <div className="h-9 bg-[#252526] border-b border-white/10 flex items-center px-3 gap-1">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            {activeFile.includes("/") && (
              <>
                <span className="text-gray-600">{activeFile.split("/").slice(0, -1).join("/")}</span>
                <ChevronRight className="w-3 h-3 text-gray-600" />
              </>
            )}
            <span className="text-gray-300">{activeFile.split("/").pop()}</span>
          </span>
        </div>

        <Editor
          height="calc(100% - 36px)"
          language={getLanguage(activeFile)}
          value={files[activeFile] || ""}
          theme="vs-dark"
          onChange={(value) => onFileChange?.(activeFile, value || "")}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            padding: { top: 12 },
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
          }}
        />
      </div>
    </div>
  );
}
