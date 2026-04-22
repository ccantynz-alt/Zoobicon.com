"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FileCode,
  FileType,
  FileJson,
  File,
  FolderOpen,
  FolderClosed,
  ChevronRight,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  isModified?: boolean;
}

interface ProjectTreeProps {
  files: ProjectFile[];
  activeFile: string | null;
  onFileSelect: (path: string) => void;
  onFileCreate?: (path: string) => void;
  onFileDelete?: (path: string) => void;
  onFileRename?: (oldPath: string, newPath: string) => void;
  projectName: string;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  file?: ProjectFile;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
      return <FileCode size={14} className="text-stone-400 shrink-0" />;
    case "css":
    case "scss":
    case "less":
      return <FileType size={14} className="text-stone-400 shrink-0" />;
    case "json":
      return <FileJson size={14} className="text-stone-400 shrink-0" />;
    case "html":
      return <FileCode size={14} className="text-stone-400 shrink-0" />;
    default:
      return <File size={14} className="text-white/50 shrink-0" />;
  }
}

function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const partialPath = parts.slice(0, i + 1).join("/");

      let existing = current.find((n) => n.name === name && n.isFolder === !isLast);

      if (!existing) {
        existing = {
          name,
          path: partialPath,
          isFolder: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        current.push(existing);
      }

      if (!isLast) {
        current = existing.children;
      }
    }
  }

  // Sort: folders first, then files, alphabetically within each group
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.isFolder) sortNodes(node.children);
    }
  };
  sortNodes(root);

  return root;
}

interface ContextMenuState {
  x: number;
  y: number;
  path: string;
  isFolder: boolean;
}

function TreeNodeItem({
  node,
  depth,
  activeFile,
  expandedFolders,
  onToggleFolder,
  onFileSelect,
  onContextMenu,
}: {
  node: TreeNode;
  depth: number;
  activeFile: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onFileSelect: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, path: string, isFolder: boolean) => void;
}) {
  const isExpanded = expandedFolders.has(node.path);
  const isActive = !node.isFolder && node.path === activeFile;
  const isModified = node.file?.isModified;

  return (
    <div>
      <button
        onClick={() => {
          if (node.isFolder) {
            onToggleFolder(node.path);
          } else {
            onFileSelect(node.path);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, node.path, node.isFolder);
        }}
        className={`w-full flex items-center gap-1.5 py-1 pr-2 text-[12px] transition-colors group hover:bg-white/[0.04] ${
          isActive
            ? "bg-white/[0.08] text-brand-400"
            : "text-white/60 hover:text-white/80"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Nesting guide lines */}
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0"
            style={{ width: depth * 16 + 8 }}
          >
            {Array.from({ length: depth }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-white/[0.06]"
                style={{ left: `${(i + 1) * 16}px` }}
              />
            ))}
          </div>
        )}

        {node.isFolder ? (
          <>
            <ChevronRight
              size={12}
              className={`shrink-0 transition-transform duration-150 text-white/50 ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
            {isExpanded ? (
              <FolderOpen size={14} className="text-stone-400/80 shrink-0" />
            ) : (
              <FolderClosed size={14} className="text-stone-400/60 shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            {getFileIcon(node.name)}
          </>
        )}

        <span className="truncate">{node.name}</span>

        {isModified && (
          <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0 ml-auto" />
        )}
      </button>

      {node.isFolder && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onFileSelect={onFileSelect}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectTree({
  files,
  activeFile,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  projectName,
}: ProjectTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const tree = buildTree(files);

  // Auto-expand folders containing the active file
  useEffect(() => {
    if (!activeFile) return;
    const parts = activeFile.split("/");
    const newExpanded = new Set(expandedFolders);
    let changed = false;
    for (let i = 1; i < parts.length; i++) {
      const folderPath = parts.slice(0, i).join("/");
      if (!newExpanded.has(folderPath)) {
        newExpanded.add(folderPath);
        changed = true;
      }
    }
    if (changed) setExpandedFolders(newExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile]);

  // Auto-expand all top-level folders on mount
  useEffect(() => {
    const topFolders = tree.filter((n) => n.isFolder).map((n) => n.path);
    if (topFolders.length > 0) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        topFolders.forEach((f) => next.add(f));
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.length]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contextMenu]);

  // Focus new file input
  useEffect(() => {
    if (isCreating && newFileInputRef.current) {
      newFileInputRef.current.focus();
    }
  }, [isCreating]);

  // Focus rename input
  useEffect(() => {
    if (renamingPath && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingPath]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, path: string, isFolder: boolean) => {
      setContextMenu({ x: e.clientX, y: e.clientY, path, isFolder });
    },
    []
  );

  const handleNewFile = () => {
    if (!newFileName.trim()) {
      setIsCreating(false);
      return;
    }
    onFileCreate?.(newFileName.trim());
    setNewFileName("");
    setIsCreating(false);
  };

  const handleRename = () => {
    if (!renamingPath || !renameValue.trim()) {
      setRenamingPath(null);
      return;
    }
    onFileRename?.(renamingPath, renameValue.trim());
    setRenamingPath(null);
    setRenameValue("");
  };

  return (
    <div className="flex flex-col h-full bg-[#0f2148] border-r border-white/10 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <span className="text-[11px] uppercase tracking-[1.5px] text-white/50 font-medium truncate">
          {projectName}
        </span>
        {onFileCreate && (
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 rounded hover:bg-white/[0.06] text-white/50 hover:text-white/60 transition-colors"
            title="New File"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* New file input */}
      {isCreating && (
        <div className="px-3 py-1.5 border-b border-white/[0.06]">
          <input
            ref={newFileInputRef}
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNewFile();
              if (e.key === "Escape") {
                setIsCreating(false);
                setNewFileName("");
              }
            }}
            onBlur={handleNewFile}
            placeholder="path/to/file.tsx"
            className="w-full bg-white/[0.06] border border-white/10 rounded px-2 py-1 text-[12px] text-white/80 placeholder:text-white/50 outline-none focus:border-brand-400/50"
          />
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {tree.map((node) => (
          <TreeNodeItem
            key={node.path}
            node={node}
            depth={0}
            activeFile={activeFile}
            expandedFolders={expandedFolders}
            onToggleFolder={toggleFolder}
            onFileSelect={onFileSelect}
            onContextMenu={handleContextMenu}
          />
        ))}

        {files.length === 0 && (
          <p className="text-[11px] text-white/50 text-center py-6">
            No files yet
          </p>
        )}
      </div>

      {/* File count */}
      <div className="px-3 py-1.5 border-t border-white/[0.06]">
        <span className="text-[10px] text-white/50">
          {files.length} file{files.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-[#0f2148] border border-white/10 rounded-md shadow-xl py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {!contextMenu.isFolder && onFileRename && (
            <button
              onClick={() => {
                setRenamingPath(contextMenu.path);
                const fileName = contextMenu.path.split("/").pop() || contextMenu.path;
                setRenameValue(fileName);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
            >
              <Pencil size={12} />
              Rename
            </button>
          )}
          {!contextMenu.isFolder && onFileDelete && (
            <button
              onClick={() => {
                onFileDelete(contextMenu.path);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-stone-400/70 hover:bg-stone-400/10 hover:text-stone-400 transition-colors"
            >
              <Trash2 size={12} />
              Delete
            </button>
          )}
          {contextMenu.isFolder && (
            <button
              onClick={() => {
                setIsCreating(true);
                setNewFileName(contextMenu.path + "/");
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
            >
              <Plus size={12} />
              New File Here
            </button>
          )}
        </div>
      )}

      {/* Rename dialog */}
      {renamingPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#0f2148] border border-white/10 rounded-lg p-4 w-80 shadow-2xl">
            <p className="text-[12px] text-white/50 mb-2">Rename file</p>
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setRenamingPath(null);
                  setRenameValue("");
                }
              }}
              className="w-full bg-white/[0.06] border border-white/10 rounded px-3 py-1.5 text-[12px] text-white/80 outline-none focus:border-brand-400/50"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setRenamingPath(null);
                  setRenameValue("");
                }}
                className="px-3 py-1 text-[11px] text-white/50 hover:text-white/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="px-3 py-1 text-[11px] bg-brand-400/20 text-brand-400 rounded hover:bg-brand-400/30 transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
