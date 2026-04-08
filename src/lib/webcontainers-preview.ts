/**
 * WebContainers preview helpers.
 *
 * WebContainers run in the browser but require specific COOP/COEP headers
 * served by the host page. These helpers centralise that config and the
 * file-tree shape WebContainers expects.
 */

export interface WebContainerHeaders {
  coopHeader: "same-origin";
  coepHeader: "require-corp";
}

export function getWebContainerConfig(): WebContainerHeaders {
  return {
    coopHeader: "same-origin",
    coepHeader: "require-corp",
  };
}

export interface WebContainerFileNode {
  file: { contents: string };
}

export interface WebContainerDirectoryNode {
  directory: WebContainerFileTree;
}

export type WebContainerEntry = WebContainerFileNode | WebContainerDirectoryNode;

export interface WebContainerFileTree {
  [name: string]: WebContainerEntry;
}

/**
 * Convert a flat {path: contents} map into the nested tree WebContainers
 * expects: {[dir]: {directory: {...}}} / {[file]: {file: {contents}}}.
 */
export function prepareProject(files: Record<string, string>): WebContainerFileTree {
  const root: WebContainerFileTree = {};

  for (const rawPath of Object.keys(files)) {
    const contents = files[rawPath];
    const path = rawPath.replace(/^\/+/, "");
    if (!path) continue;

    const parts = path.split("/").filter(Boolean);
    let cursor: WebContainerFileTree = root;

    for (let i = 0; i < parts.length; i++) {
      const segment = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        cursor[segment] = { file: { contents } };
      } else {
        const existing = cursor[segment];
        if (existing && "directory" in existing) {
          cursor = existing.directory;
        } else {
          const dirNode: WebContainerDirectoryNode = { directory: {} };
          cursor[segment] = dirNode;
          cursor = dirNode.directory;
        }
      }
    }
  }

  return root;
}

/**
 * Inverse of prepareProject — flatten a WebContainer file tree back into
 * a {path: contents} map.
 */
export function filesToFlat(tree: WebContainerFileTree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};

  for (const name of Object.keys(tree)) {
    const node = tree[name];
    const path = prefix ? `${prefix}/${name}` : name;

    if ("file" in node) {
      out[path] = node.file.contents;
    } else {
      Object.assign(out, filesToFlat(node.directory, path));
    }
  }

  return out;
}
