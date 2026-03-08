"use client";

import { useState, useCallback } from "react";
import {
  FileArchive,
  Download,
  Copy,
  Check,
  Loader2,
  FolderTree,
  FileCode,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface ThemeResult {
  themeFiles: Record<string, string>;
  wxrXml: string;
  instructions: string[];
}

interface WordPressExportProps {
  code: string;
}

export default function WordPressExport({ code }: WordPressExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ThemeResult | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [copiedWxr, setCopiedWxr] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const themeName = siteName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const handleGenerate = useCallback(async () => {
    if (!siteName.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/export/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          siteName: siteName.trim(),
          siteDescription: siteDescription.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate WordPress theme");
      }

      const data: ThemeResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [code, siteName, siteDescription]);

  const toggleFile = (filename: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, id?: string) => {
    await navigator.clipboard.writeText(text);
    if (id === "wxr") {
      setCopiedWxr(true);
      setTimeout(() => setCopiedWxr(false), 2000);
    } else if (id) {
      setCopiedFile(id);
      setTimeout(() => setCopiedFile(null), 2000);
    }
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    if (!result) return;

    // Build a simple ZIP file manually (no external dependency)
    const files = Object.entries(result.themeFiles);
    const zipParts: Uint8Array[] = [];
    const centralDir: Uint8Array[] = [];
    let offset = 0;

    for (const [name, content] of files) {
      const nameBytes = new TextEncoder().encode(name);
      const contentBytes = new TextEncoder().encode(content);

      // Local file header
      const localHeader = new ArrayBuffer(30 + nameBytes.length);
      const lhView = new DataView(localHeader);
      lhView.setUint32(0, 0x04034b50, true); // signature
      lhView.setUint16(4, 20, true); // version needed
      lhView.setUint16(6, 0, true); // flags
      lhView.setUint16(8, 0, true); // compression (store)
      lhView.setUint16(10, 0, true); // mod time
      lhView.setUint16(12, 0, true); // mod date
      lhView.setUint32(14, crc32(contentBytes), true); // crc32
      lhView.setUint32(18, contentBytes.length, true); // compressed size
      lhView.setUint32(22, contentBytes.length, true); // uncompressed size
      lhView.setUint16(26, nameBytes.length, true); // filename length
      lhView.setUint16(28, 0, true); // extra length
      new Uint8Array(localHeader).set(nameBytes, 30);

      const localHeaderBytes = new Uint8Array(localHeader);
      zipParts.push(localHeaderBytes);
      zipParts.push(contentBytes);

      // Central directory entry
      const cdEntry = new ArrayBuffer(46 + nameBytes.length);
      const cdView = new DataView(cdEntry);
      cdView.setUint32(0, 0x02014b50, true); // signature
      cdView.setUint16(4, 20, true); // version made by
      cdView.setUint16(6, 20, true); // version needed
      cdView.setUint16(8, 0, true); // flags
      cdView.setUint16(10, 0, true); // compression
      cdView.setUint16(12, 0, true); // mod time
      cdView.setUint16(14, 0, true); // mod date
      cdView.setUint32(16, crc32(contentBytes), true); // crc32
      cdView.setUint32(20, contentBytes.length, true); // compressed size
      cdView.setUint32(24, contentBytes.length, true); // uncompressed size
      cdView.setUint16(28, nameBytes.length, true); // filename length
      cdView.setUint16(30, 0, true); // extra length
      cdView.setUint16(32, 0, true); // comment length
      cdView.setUint16(34, 0, true); // disk number start
      cdView.setUint16(36, 0, true); // internal attributes
      cdView.setUint32(38, 0, true); // external attributes
      cdView.setUint32(42, offset, true); // local header offset
      new Uint8Array(cdEntry).set(nameBytes, 46);

      centralDir.push(new Uint8Array(cdEntry));
      offset += localHeaderBytes.length + contentBytes.length;
    }

    const cdOffset = offset;
    let cdSize = 0;
    for (const cd of centralDir) {
      zipParts.push(cd);
      cdSize += cd.length;
    }

    // End of central directory
    const eocd = new ArrayBuffer(22);
    const eocdView = new DataView(eocd);
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true); // disk number
    eocdView.setUint16(6, 0, true); // disk with cd
    eocdView.setUint16(8, files.length, true); // entries on disk
    eocdView.setUint16(10, files.length, true); // total entries
    eocdView.setUint32(12, cdSize, true); // cd size
    eocdView.setUint32(16, cdOffset, true); // cd offset
    eocdView.setUint16(20, 0, true); // comment length
    zipParts.push(new Uint8Array(eocd));

    const totalLength = zipParts.reduce((s, p) => s + p.length, 0);
    const zipData = new Uint8Array(totalLength);
    let pos = 0;
    for (const part of zipParts) {
      zipData.set(part, pos);
      pos += part.length;
    }

    const blob = new Blob([zipData], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${themeName || "theme"}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 transition-colors text-sm font-medium"
      >
        <FileArchive className="w-4 h-4" />
        Export to WordPress
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <FileArchive className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-zinc-100">
              Export to WordPress
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-zinc-200 text-xl leading-none px-2"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Form */}
          {!result && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Site Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="My Awesome Website"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Site Description
                </label>
                <textarea
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  placeholder="A brief description of your website..."
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Theme Slug
                </label>
                <input
                  type="text"
                  value={themeName || "enter-a-site-name"}
                  readOnly
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-400 text-sm cursor-default"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Auto-generated from site name
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isLoading || !siteName.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium text-sm transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Converting to WordPress theme...
                  </>
                ) : (
                  <>
                    <FolderTree className="w-4 h-4" />
                    Generate WordPress Theme
                  </>
                )}
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-5">
              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={downloadAllAsZip}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Theme ZIP
                </button>
                <button
                  onClick={() => copyToClipboard(result.wxrXml, "wxr")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg font-medium text-sm transition-colors"
                >
                  {copiedWxr ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy WXR Import File
                    </>
                  )}
                </button>
              </div>

              {/* File tree */}
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-blue-400" />
                  Theme Files
                </h3>
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg divide-y divide-zinc-700">
                  {Object.entries(result.themeFiles).map(
                    ([filename, content]) => (
                      <div key={filename}>
                        <button
                          onClick={() => toggleFile(filename)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-700/50 transition-colors"
                        >
                          {expandedFiles.has(filename) ? (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          )}
                          <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="text-sm text-zinc-200 font-mono">
                            {filename}
                          </span>
                          <span className="ml-auto text-xs text-zinc-500">
                            {content.length.toLocaleString()} chars
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(content, filename);
                            }}
                            className="p-1 hover:bg-zinc-600 rounded transition-colors"
                            title="Copy file content"
                          >
                            {copiedFile === filename ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-zinc-400" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFile(filename, content);
                            }}
                            className="p-1 hover:bg-zinc-600 rounded transition-colors"
                            title="Download file"
                          >
                            <Download className="w-3 h-3 text-zinc-400" />
                          </button>
                        </button>
                        {expandedFiles.has(filename) && (
                          <div className="px-3 pb-3">
                            <pre className="bg-zinc-900 border border-zinc-700 rounded-md p-3 text-xs text-zinc-300 font-mono overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                              {content}
                            </pre>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* WXR download */}
              <div>
                <button
                  onClick={() =>
                    downloadFile(`${themeName || "export"}.xml`, result.wxrXml)
                  }
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download WXR XML Import File
                </button>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-2">
                  Installation Instructions
                </h3>
                <ol className="space-y-1.5 bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  {result.instructions.map((step, i) => (
                    <li
                      key={i}
                      className="text-sm text-zinc-300 leading-relaxed"
                    >
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Reset */}
              <button
                onClick={() => {
                  setResult(null);
                  setExpandedFiles(new Set());
                }}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                &larr; Generate another theme
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** CRC32 lookup table and computation for ZIP file generation */
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  const table = getCRC32Table();
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let _crc32Table: Uint32Array | null = null;
function getCRC32Table(): Uint32Array {
  if (_crc32Table) return _crc32Table;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  _crc32Table = table;
  return table;
}
