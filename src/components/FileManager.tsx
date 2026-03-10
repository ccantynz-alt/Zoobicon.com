"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  File,
  Folder,
  FolderOpen,
  Upload,
  Download,
  Trash2,
  Edit3,
  Plus,
  Search,
  Grid,
  List,
  ChevronRight,
  ChevronDown,
  Image,
  FileText,
  FileCode,
  FileCog,
  Copy,
  MoreVertical,
  RefreshCw,
  Check,
  X,
  FolderPlus,
  ArrowUp,
} from "lucide-react";

/* -------------------------------- Types --------------------------------- */

export interface FileNode {
  name: string;
  type: "file" | "folder";
  size?: number;
  modified?: string;
  children?: FileNode[];
  path: string;
}

interface FileManagerProps {
  siteId: string;
  files?: FileNode[];
}

interface ContextMenu {
  x: number;
  y: number;
  node: FileNode;
}

/* ------------------------------ Mock Data ------------------------------- */

const DEFAULT_FILES: FileNode[] = [
  {
    name: "index.html",
    type: "file",
    size: 4520,
    modified: "2026-03-06T14:30:00Z",
    path: "/index.html",
  },
  {
    name: "about.html",
    type: "file",
    size: 3200,
    modified: "2026-03-05T10:15:00Z",
    path: "/about.html",
  },
  {
    name: "contact.html",
    type: "file",
    size: 2800,
    modified: "2026-03-04T09:45:00Z",
    path: "/contact.html",
  },
  {
    name: "css",
    type: "folder",
    path: "/css",
    children: [
      {
        name: "style.css",
        type: "file",
        size: 12800,
        modified: "2026-03-06T14:30:00Z",
        path: "/css/style.css",
      },
      {
        name: "responsive.css",
        type: "file",
        size: 5400,
        modified: "2026-03-05T11:20:00Z",
        path: "/css/responsive.css",
      },
    ],
  },
  {
    name: "js",
    type: "folder",
    path: "/js",
    children: [
      {
        name: "main.js",
        type: "file",
        size: 8900,
        modified: "2026-03-06T12:00:00Z",
        path: "/js/main.js",
      },
      {
        name: "analytics.js",
        type: "file",
        size: 3100,
        modified: "2026-03-03T16:45:00Z",
        path: "/js/analytics.js",
      },
    ],
  },
  {
    name: "images",
    type: "folder",
    path: "/images",
    children: [
      {
        name: "logo.png",
        type: "file",
        size: 24500,
        modified: "2026-03-01T08:00:00Z",
        path: "/images/logo.png",
      },
      {
        name: "hero.jpg",
        type: "file",
        size: 185000,
        modified: "2026-03-02T10:30:00Z",
        path: "/images/hero.jpg",
      },
      {
        name: "favicon.ico",
        type: "file",
        size: 1150,
        modified: "2026-02-28T14:00:00Z",
        path: "/images/favicon.ico",
      },
    ],
  },
  {
    name: "fonts",
    type: "folder",
    path: "/fonts",
    children: [],
  },
];

/* ------------------------------ Helpers --------------------------------- */

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const v = bytes / Math.pow(1024, i);
  return `${v % 1 === 0 ? v : v.toFixed(1)} ${units[i]}`;
}

function getExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function getFileIcon(name: string) {
  const ext = getExtension(name);
  switch (ext) {
    case "html":
    case "htm":
      return <FileCode className="w-4 h-4 text-orange-400" />;
    case "css":
    case "scss":
    case "less":
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    case "json":
    case "xml":
    case "yaml":
    case "yml":
      return <FileCog className="w-4 h-4 text-green-400" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "webp":
    case "ico":
      return <Image className="w-4 h-4 text-pink-400" />;
    case "md":
    case "txt":
    case "csv":
      return <FileText className="w-4 h-4 text-gray-400" />;
    default:
      return <File className="w-4 h-4 text-gray-500" />;
  }
}

function isTextFile(name: string): boolean {
  const textExts = [
    "html", "htm", "css", "scss", "less", "js", "ts", "jsx", "tsx",
    "json", "xml", "yaml", "yml", "md", "txt", "csv", "svg",
  ];
  return textExts.includes(getExtension(name));
}

function isImageFile(name: string): boolean {
  const imgExts = ["png", "jpg", "jpeg", "gif", "webp", "ico"];
  return imgExts.includes(getExtension(name));
}

function flattenNodes(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  for (const n of nodes) {
    result.push(n);
    if (n.children) result.push(...flattenNodes(n.children));
  }
  return result;
}

/* ========================== Component =================================== */

export default function FileManager({ siteId, files }: FileManagerProps) {
  const rootFiles = files ?? DEFAULT_FILES;

  // State
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/css", "/js", "/images"]));
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPath, setCurrentPath] = useState("/");
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [previewNode, setPreviewNode] = useState<FileNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Toggle folder expand / collapse
  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  // Toggle selection
  const toggleSelect = useCallback((path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  // Context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: FileNode) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, node });
    },
    [],
  );

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p === null || p >= 100) {
          clearInterval(interval);
          setTimeout(() => setUploadProgress(null), 800);
          return 100;
        }
        return Math.min(100, p + 12);
      });
    }, 150);
  }, []);

  // Navigate breadcrumb
  const breadcrumbSegments = useMemo(() => {
    if (currentPath === "/") return [{ label: "root", path: "/" }];
    const parts = currentPath.split("/").filter(Boolean);
    const segments = [{ label: "root", path: "/" }];
    let accumulated = "";
    for (const p of parts) {
      accumulated += "/" + p;
      segments.push({ label: p, path: accumulated });
    }
    return segments;
  }, [currentPath]);

  // Filtered files (search)
  const allFlat = useMemo(() => flattenNodes(rootFiles), [rootFiles]);
  const filteredFlat = useMemo(() => {
    if (!searchQuery) return null;
    return allFlat.filter((n) =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, allFlat]);

  // Get nodes for the current directory view (grid mode)
  const currentDirNodes = useMemo(() => {
    if (currentPath === "/") return rootFiles;
    const find = (nodes: FileNode[], target: string): FileNode[] | null => {
      for (const n of nodes) {
        if (n.path === target && n.type === "folder") return n.children ?? [];
        if (n.children) {
          const r = find(n.children, target);
          if (r) return r;
        }
      }
      return null;
    };
    return find(rootFiles, currentPath) ?? rootFiles;
  }, [currentPath, rootFiles]);

  /* ----------------------------- Renderers ------------------------------ */

  // Render a single tree row (list mode, recursive)
  function renderTreeNode(node: FileNode, depth: number = 0) {
    const isFolder = node.type === "folder";
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedPaths.has(node.path);

    return (
      <React.Fragment key={node.path}>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-md transition-colors group
            ${isSelected ? "bg-blue-600/20 border border-blue-500/30" : "hover:bg-white/5 border border-transparent"}
          `}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          onClick={() => {
            if (isFolder) toggleFolder(node.path);
            else setPreviewNode(node);
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSelect(node.path);
            }}
            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
              ${isSelected ? "bg-blue-600 border-blue-500" : "border-gray-600 hover:border-gray-400"}
            `}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </button>

          {/* Expand / collapse chevron (folders only) */}
          {isFolder ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.path);
              }}
              className="text-gray-500 hover:text-gray-300 flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* Icon */}
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )
          ) : (
            getFileIcon(node.name)
          )}

          {/* Name */}
          <span className="text-sm text-gray-200 truncate flex-1">
            {node.name}
          </span>

          {/* Size */}
          {node.size !== undefined && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatBytes(node.size)}
            </span>
          )}

          {/* Modified */}
          {node.modified && (
            <span className="text-xs text-gray-600 flex-shrink-0 hidden lg:block">
              {new Date(node.modified).toLocaleDateString()}
            </span>
          )}

          {/* More button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, node);
            }}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 flex-shrink-0"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Children */}
        {isFolder && isExpanded && node.children?.map((child) => renderTreeNode(child, depth + 1))}
      </React.Fragment>
    );
  }

  // Render grid card
  function renderGridCard(node: FileNode) {
    const isFolder = node.type === "folder";
    const isSelected = selectedPaths.has(node.path);

    return (
      <div
        key={node.path}
        className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-all
          ${isSelected ? "bg-blue-600/20 border-blue-500/40" : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10"}
        `}
        onClick={() => {
          if (isFolder) setCurrentPath(node.path);
          else setPreviewNode(node);
        }}
        onContextMenu={(e) => handleContextMenu(e, node)}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSelect(node.path);
          }}
          className={`absolute top-2 left-2 w-4 h-4 rounded border flex items-center justify-center
            ${isSelected ? "bg-blue-600 border-blue-500" : "border-gray-600 hover:border-gray-400"}
          `}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </button>

        {isFolder ? (
          <Folder className="w-10 h-10 text-amber-400" />
        ) : isImageFile(node.name) ? (
          <Image className="w-10 h-10 text-pink-400" />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center">
            {getFileIcon(node.name)}
          </div>
        )}

        <span className="text-sm text-gray-200 truncate max-w-full text-center">
          {node.name}
        </span>
        {node.size !== undefined && (
          <span className="text-xs text-gray-500">{formatBytes(node.size)}</span>
        )}
      </div>
    );
  }

  /* ----------------------------- Main render ----------------------------- */

  return (
    <div
      className="min-h-screen bg-[#0a0a0f] text-gray-200"
      onClick={closeContextMenu}
    >
      <div className="max-w-7xl mx-auto p-6 flex flex-col gap-4">
        {/* ====== Upload drop zone ====== */}
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors
            ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/20 bg-white/[0.02]"}
          `}
        >
          <Upload className={`w-8 h-8 ${isDragging ? "text-blue-400" : "text-gray-500"}`} />
          <p className="text-sm text-gray-400">
            Drag & drop files here or{" "}
            <button className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
              browse
            </button>
          </p>

          {/* Upload progress bar */}
          {uploadProgress !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 rounded-b-xl overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* ====== Toolbar ====== */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm flex-1 min-w-0">
            {breadcrumbSegments.map((seg, i) => (
              <React.Fragment key={seg.path}>
                {i > 0 && <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />}
                <button
                  onClick={() => setCurrentPath(seg.path)}
                  className={`hover:text-blue-400 truncate ${i === breadcrumbSegments.length - 1 ? "text-gray-200" : "text-gray-500"}`}
                >
                  {seg.label}
                </button>
              </React.Fragment>
            ))}
          </nav>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm rounded-lg bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 w-52"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-white/10 overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 ${viewMode === "list" ? "bg-blue-600/30 text-blue-400" : "text-gray-500 hover:text-gray-300"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 ${viewMode === "grid" ? "bg-blue-600/30 text-blue-400" : "text-gray-500 hover:text-gray-300"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white transition-colors">
            <Plus className="w-4 h-4" /> New
          </button>
          <button className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Bulk actions bar */}
        {selectedPaths.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-sm">
            <span className="text-blue-300">{selectedPaths.size} selected</span>
            <button className="flex items-center gap-1 text-gray-400 hover:text-gray-200">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button className="flex items-center gap-1 text-gray-400 hover:text-gray-200">
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button className="flex items-center gap-1 text-red-400 hover:text-red-300">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button
              onClick={() => setSelectedPaths(new Set())}
              className="ml-auto text-gray-500 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ====== Main content area (files + preview) ====== */}
        <div className="flex gap-4 min-h-[500px]">
          {/* File listing */}
          <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            {/* Search results */}
            {filteredFlat ? (
              <div className="p-2 flex flex-col gap-0.5">
                {filteredFlat.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No files match your search.</p>
                ) : (
                  filteredFlat.map((node) => renderTreeNode(node, 0))
                )}
              </div>
            ) : viewMode === "list" ? (
              /* Tree / list view */
              <div className="p-2 flex flex-col gap-0.5">
                {/* Up button when inside a folder */}
                {currentPath !== "/" && (
                  <button
                    onClick={() => {
                      const parent = currentPath.substring(0, currentPath.lastIndexOf("/")) || "/";
                      setCurrentPath(parent);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-md"
                  >
                    <ArrowUp className="w-4 h-4" />
                    ..
                  </button>
                )}
                {rootFiles.map((node) => renderTreeNode(node))}
              </div>
            ) : (
              /* Grid view */
              <div className="p-4">
                {currentPath !== "/" && (
                  <button
                    onClick={() => {
                      const parent = currentPath.substring(0, currentPath.lastIndexOf("/")) || "/";
                      setCurrentPath(parent);
                    }}
                    className="flex items-center gap-2 mb-4 text-sm text-gray-500 hover:text-gray-300"
                  >
                    <ArrowUp className="w-4 h-4" /> Back
                  </button>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {currentDirNodes.map((node) => renderGridCard(node))}
                </div>
              </div>
            )}
          </div>

          {/* Preview panel */}
          {previewNode && (
            <div className="w-80 flex-shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 min-w-0">
                  {getFileIcon(previewNode.name)}
                  <span className="text-sm text-gray-200 truncate">{previewNode.name}</span>
                </div>
                <button
                  onClick={() => setPreviewNode(null)}
                  className="text-gray-500 hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview body */}
              <div className="flex-1 p-4 overflow-auto">
                {isImageFile(previewNode.name) ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-full aspect-video rounded-lg bg-white/5 flex items-center justify-center">
                      <Image className="w-12 h-12 text-gray-600" />
                      <span className="sr-only">Image preview placeholder</span>
                    </div>
                  </div>
                ) : isTextFile(previewNode.name) ? (
                  <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">
                    {`/* ${previewNode.name} */\n\n// File contents would load here\n// Path: ${previewNode.path}`}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
                    <File className="w-10 h-10" />
                    <p className="text-sm">No preview available</p>
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="px-4 py-3 border-t border-white/[0.06] text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Size</span>
                  <span>{previewNode.size !== undefined ? formatBytes(previewNode.size) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Modified</span>
                  <span>
                    {previewNode.modified
                      ? new Date(previewNode.modified).toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Path</span>
                  <span className="truncate ml-4">{previewNode.path}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====== Context menu ====== */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[180px] rounded-lg border border-white/10 bg-[#16161e] shadow-xl py-1 text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.node.type === "folder" && (
            <>
              <ContextMenuItem icon={<Plus className="w-4 h-4" />} label="New File" onClick={closeContextMenu} />
              <ContextMenuItem icon={<FolderPlus className="w-4 h-4" />} label="New Folder" onClick={closeContextMenu} />
              <div className="my-1 border-t border-white/5" />
            </>
          )}
          <ContextMenuItem icon={<Edit3 className="w-4 h-4" />} label="Rename" onClick={closeContextMenu} />
          {contextMenu.node.type === "file" && (
            <ContextMenuItem icon={<Edit3 className="w-4 h-4" />} label="Edit" onClick={closeContextMenu} />
          )}
          <ContextMenuItem icon={<Copy className="w-4 h-4" />} label="Copy" onClick={closeContextMenu} />
          <ContextMenuItem icon={<Download className="w-4 h-4" />} label="Download" onClick={closeContextMenu} />
          <div className="my-1 border-t border-white/5" />
          <ContextMenuItem
            icon={<Trash2 className="w-4 h-4" />}
            label="Delete"
            onClick={closeContextMenu}
            danger
          />
        </div>
      )}
    </div>
  );
}

/* ====== Sub-components ================================================== */

function ContextMenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors
        ${danger ? "text-red-400 hover:bg-red-500/10" : "text-gray-300 hover:bg-white/5"}
      `}
    >
      {icon}
      {label}
    </button>
  );
}
