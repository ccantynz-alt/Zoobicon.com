"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-[#131520] text-white/40 text-sm">
      Loading editor...
    </div>
  ),
});

interface MonacoEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  path?: string;
}

export default function MonacoEditor({
  value,
  language = "typescript",
  onChange,
  readOnly = false,
  path,
}: MonacoEditorProps) {
  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      path={path}
      theme="vs-dark"
      onChange={(v) => onChange?.(v || "")}
      options={{
        readOnly,
        fontSize: 13,
        fontFamily: '"Fira Code", "Fira Mono", monospace',
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: "on",
        tabSize: 2,
        padding: { top: 12, bottom: 12 },
        smoothScrolling: true,
        cursorBlinking: "smooth",
        renderLineHighlight: "line",
        lineNumbers: "on",
        folding: true,
        bracketPairColorization: { enabled: true },
      }}
    />
  );
}
