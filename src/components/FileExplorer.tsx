"use client";

import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";

interface FileExplorerProps {
  files: Record<string, string>;
  activePath: string;
  onSelect: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
}

function buildTree(files: Record<string, string>): TreeNode {
  const root: TreeNode = { name: "", path: "", isDir: true, children: [] };

  for (const path of Object.keys(files).sort()) {
    const clean = path.startsWith("/") ? path.slice(1) : path;
    const parts = clean.split("/");
    let node = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = "/" + parts.slice(0, i + 1).join("/");

      let child = node.children.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          path: currentPath,
          isDir: !isLast,
          children: [],
        };
        node.children.push(child);
      }
      node = child;
    }
  }

  // Sort: directories first, then files alphabetically
  const sort = (n: TreeNode) => {
    n.children.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    n.children.forEach(sort);
  };
  sort(root);

  return root;
}

function TreeItem({
  node,
  depth,
  activePath,
  onSelect,
  expandedPaths,
  toggleExpanded,
}: {
  node: TreeNode;
  depth: number;
  activePath: string;
  onSelect: (path: string) => void;
  expandedPaths: Set<string>;
  toggleExpanded: (path: string) => void;
}) {
  const isExpanded = expandedPaths.has(node.path);
  const isActive = !node.isDir && node.path === activePath;

  return (
    <>
      <button
        onClick={() => (node.isDir ? toggleExpanded(node.path) : onSelect(node.path))}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-left text-[13px] hover:bg-white/5 transition-colors ${
          isActive ? "bg-[#6d5dfc]/15 text-white" : "text-white/70"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.isDir ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#6d5dfc]" />
            ) : (
              <Folder className="w-3.5 h-3.5 shrink-0 text-[#6d5dfc]" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <File className="w-3.5 h-3.5 shrink-0 text-white/40" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {node.isDir && isExpanded && node.children.map((child) => (
        <TreeItem
          key={child.path}
          node={child}
          depth={depth + 1}
          activePath={activePath}
          onSelect={onSelect}
          expandedPaths={expandedPaths}
          toggleExpanded={toggleExpanded}
        />
      ))}
    </>
  );
}

export default function FileExplorer({ files, activePath, onSelect }: FileExplorerProps) {
  const tree = useMemo(() => buildTree(files), [files]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    // Auto-expand all top-level directories
    const set = new Set<string>();
    tree.children.forEach((c) => {
      if (c.isDir) set.add(c.path);
    });
    return set;
  });

  const toggleExpanded = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (Object.keys(files).length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-white/30 text-xs p-4 text-center">
        No files yet. Generate a site to see them here.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto py-2">
      {tree.children.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          depth={0}
          activePath={activePath}
          onSelect={onSelect}
          expandedPaths={expandedPaths}
          toggleExpanded={toggleExpanded}
        />
      ))}
    </div>
  );
}
