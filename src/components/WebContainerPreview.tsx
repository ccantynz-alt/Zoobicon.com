"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { prepareProject } from "@/lib/webcontainers-preview";

interface WebContainerPreviewProps {
  /** Flat file map: { "App.tsx": "...", "index.tsx": "..." } */
  files: Record<string, string>;
  /**
   * If true, boot the WebContainer immediately on mount even if no files are
   * provided yet. The container will be ready the moment files arrive. This is
   * the key speed win — boot takes ~2-3s, so pre-warming while the user types
   * their prompt means zero wait on the container itself.
   */
  prewarm?: boolean;
  /** Callback when the WebContainer cannot load (package missing, unsupported browser, etc.) */
  onFallback?: () => void;
}

type Status =
  | { kind: "idle" }
  | { kind: "booting"; message: string }
  | { kind: "installing"; message: string }
  | { kind: "starting"; message: string }
  | { kind: "ready"; url: string }
  | { kind: "error"; message: string; hint?: string };

/* ── Minimal type stubs for @webcontainer/api ── */
interface WCProcess {
  exit: Promise<number>;
  output: { pipeTo: (sink: WritableStream<string>) => Promise<void> };
}
interface WCInstance {
  mount: (tree: unknown) => Promise<void>;
  spawn: (cmd: string, args: string[]) => Promise<WCProcess>;
  on: (event: "server-ready", cb: (port: number, url: string) => void) => void;
  teardown: () => void;
}
interface WCModule {
  WebContainer: { boot: () => Promise<WCInstance> };
}

/**
 * Singleton promise so multiple <WebContainerPreview> mounts (or React
 * StrictMode double-invocations) share a single boot. WebContainers can
 * only have one instance per page.
 */
let bootPromise: Promise<WCInstance | null> | null = null;
let bootedInstance: WCInstance | null = null;
let bootError: string | null = null;

function getOrBootInstance(): Promise<WCInstance | null> {
  if (bootedInstance) return Promise.resolve(bootedInstance);
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    let mod: WCModule;
    try {
      mod = (await import(
        /* webpackIgnore: true */ "@webcontainer/api" as string
      )) as unknown as WCModule;
    } catch {
      bootError = "WebContainers package not available — using Sandpack preview.";
      return null;
    }

    try {
      const instance = await mod.WebContainer.boot();
      bootedInstance = instance;
      return instance;
    } catch (err) {
      bootError =
        err instanceof Error ? err.message : "Failed to boot WebContainer.";
      return null;
    }
  })();

  return bootPromise;
}

/** Pre-warm by starting the boot sequence. Call this on page mount. */
export function prewarmWebContainer(): void {
  getOrBootInstance().catch(() => {
    /* swallow — errors surface through component state */
  });
}

/** Check synchronously whether boot has already failed (package missing, etc.) */
export function isWebContainerAvailable(): boolean | null {
  if (bootError) return false;
  if (bootedInstance) return true;
  return null; // Unknown yet
}

export default function WebContainerPreview({
  files,
  prewarm = false,
  onFallback,
}: WebContainerPreviewProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const instanceRef = useRef<WCInstance | null>(null);
  const serverUrlRef = useRef<string | null>(null);
  const mountedFilesHashRef = useRef<string>("");
  const devProcessRef = useRef<WCProcess | null>(null);
  const hasNotifiedFallback = useRef(false);

  const notifyFallback = useCallback(() => {
    if (!hasNotifiedFallback.current && onFallback) {
      hasNotifiedFallback.current = true;
      onFallback();
    }
  }, [onFallback]);

  // ── Phase 1: Boot the WebContainer (pre-warm) ──
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setStatus({ kind: "booting", message: "Loading WebContainers runtime..." });

      const instance = await getOrBootInstance();

      if (cancelled) return;

      if (!instance) {
        setStatus({
          kind: "error",
          message: bootError || "WebContainers unavailable.",
          hint: "Falling back to Sandpack preview.",
        });
        notifyFallback();
        return;
      }

      instanceRef.current = instance;

      // Listen for dev server ready
      instance.on("server-ready", (_port, url) => {
        if (cancelled) return;
        serverUrlRef.current = url;
        setStatus({ kind: "ready", url });
        if (iframeRef.current) {
          iframeRef.current.src = url;
        }
      });

      setStatus({ kind: "booting", message: "WebContainer ready — waiting for files..." });
    }

    void boot();

    return () => {
      cancelled = true;
    };
    // Run once on mount — pre-warm is the whole point
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Phase 2: Mount files + install + run dev server ──
  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;

    const fileKeys = Object.keys(files);
    if (fileKeys.length === 0) return;

    // Simple hash to avoid re-mounting identical files
    const hash = fileKeys.sort().map(k => `${k}:${files[k].length}`).join("|");
    if (hash === mountedFilesHashRef.current) return;
    mountedFilesHashRef.current = hash;

    let cancelled = false;

    async function mountAndRun() {
      try {
        setStatus({ kind: "installing", message: "Mounting project files..." });

        // Build the WebContainer file tree including a package.json for the
        // generated project so `npm install` has something to work with.
        const projectFiles: Record<string, string> = { ...files };

        // Ensure package.json exists
        if (!projectFiles["package.json"]) {
          // Scan files for import statements to detect dependencies
          const deps: Record<string, string> = {
            react: "^18.3.0",
            "react-dom": "^18.3.0",
          };
          const allCode = Object.values(files).join("\n");
          if (allCode.includes("framer-motion")) deps["framer-motion"] = "^12.0.0";
          if (allCode.includes("lucide-react")) deps["lucide-react"] = "^1.7.0";
          if (allCode.includes("@headlessui")) deps["@headlessui/react"] = "^2.0.0";

          projectFiles["package.json"] = JSON.stringify(
            {
              name: "zoobicon-preview",
              private: true,
              type: "module",
              scripts: {
                dev: "vite",
              },
              dependencies: deps,
              devDependencies: {
                vite: "^6.0.0",
                "@vitejs/plugin-react": "^4.0.0",
              },
            },
            null,
            2,
          );
        }

        // Ensure vite.config.ts exists
        if (!projectFiles["vite.config.ts"] && !projectFiles["vite.config.js"]) {
          projectFiles["vite.config.ts"] = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: true },
});
`;
        }

        // Ensure index.html exists (Vite entry)
        if (!projectFiles["index.html"]) {
          projectFiles["index.html"] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"><\/script>
</body>
</html>`;
        }

        // Ensure src/main.tsx exists
        if (!projectFiles["src/main.tsx"] && !projectFiles["main.tsx"]) {
          const appPath = projectFiles["src/App.tsx"]
            ? "./App"
            : projectFiles["App.tsx"]
              ? "../App"
              : "./App";
          projectFiles["src/main.tsx"] = `import React from "react";
import { createRoot } from "react-dom/client";
import App from "${appPath}";

createRoot(document.getElementById("root")!).render(<App />);
`;
        }

        // Move root-level component files into src/ if they aren't already there
        // (Vite expects src/main.tsx to import from relative paths)
        const movedFiles: Record<string, string> = {};
        for (const [path, content] of Object.entries(projectFiles)) {
          // Don't move config files, package.json, or files already in src/
          if (
            path.startsWith("src/") ||
            path === "package.json" ||
            path === "index.html" ||
            path === "vite.config.ts" ||
            path === "vite.config.js" ||
            path === "tsconfig.json" ||
            path === "tailwind.config.js" ||
            path === "tailwind.config.ts"
          ) {
            movedFiles[path] = content;
          } else if (path.endsWith(".tsx") || path.endsWith(".ts") || path.endsWith(".css")) {
            movedFiles[`src/${path}`] = content;
          } else {
            movedFiles[path] = content;
          }
        }

        // Fix the main.tsx import if we moved App.tsx into src/
        if (movedFiles["src/App.tsx"] && movedFiles["src/main.tsx"]) {
          movedFiles["src/main.tsx"] = movedFiles["src/main.tsx"].replace(
            /from\s+["']\.\.\/App["']/,
            'from "./App"',
          );
        }

        const tree = prepareProject(movedFiles);
        await instance!.mount(tree);
        if (cancelled) return;

        // If dev server is already running (re-mount), Vite HMR will pick up
        // the changes. No need to re-install or restart.
        if (serverUrlRef.current) {
          setStatus({ kind: "ready", url: serverUrlRef.current });
          // Reload iframe to pick up new files
          if (iframeRef.current) {
            iframeRef.current.src = serverUrlRef.current;
          }
          return;
        }

        setStatus({ kind: "installing", message: "Installing dependencies (npm install)..." });
        const install = await instance!.spawn("npm", ["install", "--prefer-offline"]);

        // Pipe output for debugging (silent to user)
        install.output.pipeTo(
          new WritableStream({
            write(chunk) {
              if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console
                console.log("[wc:npm]", chunk);
              }
            },
          }),
        ).catch(() => { /* stream closed */ });

        const installCode = await install.exit;
        if (cancelled) return;

        if (installCode !== 0) {
          setStatus({
            kind: "error",
            message: `npm install failed (exit ${installCode}).`,
            hint: "Check the generated package.json for invalid dependencies.",
          });
          notifyFallback();
          return;
        }

        setStatus({ kind: "starting", message: "Starting dev server..." });
        const dev = await instance!.spawn("npm", ["run", "dev"]);
        devProcessRef.current = dev;

        // Pipe dev server output
        dev.output.pipeTo(
          new WritableStream({
            write(chunk) {
              if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console
                console.log("[wc:dev]", chunk);
              }
            },
          }),
        ).catch(() => { /* stream closed */ });

        // server-ready event will flip status to "ready"
        // Set a timeout in case server-ready never fires
        setTimeout(() => {
          if (!cancelled && serverUrlRef.current === null) {
            setStatus({
              kind: "error",
              message: "Dev server did not start within 30 seconds.",
              hint: "Falling back to Sandpack preview.",
            });
            notifyFallback();
          }
        }, 30_000);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setStatus({
          kind: "error",
          message: "Failed to run project in WebContainer.",
          hint: message,
        });
        notifyFallback();
      }
    }

    void mountAndRun();

    return () => {
      cancelled = true;
    };
    // Re-run when files change or instance becomes available
  }, [files, instanceRef.current, notifyFallback]);

  // ── Render ──

  if (status.kind === "error") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gray-900 p-8 text-center">
        <div className="text-lg font-semibold text-red-400">{status.message}</div>
        {status.hint && (
          <div className="max-w-md text-sm text-gray-300">{status.hint}</div>
        )}
        <button
          onClick={() => {
            // Reset singleton so boot re-attempts
            bootPromise = null;
            bootedInstance = null;
            bootError = null;
            instanceRef.current = null;
            serverUrlRef.current = null;
            mountedFilesHashRef.current = "";
            hasNotifiedFallback.current = false;
            setStatus({ kind: "idle" });
          }}
          className="mt-2 rounded-md bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
        >
          Retry
        </button>
      </div>
    );
  }

  const isLoading = status.kind !== "ready";
  const statusMessage =
    status.kind === "booting"
      ? status.message
      : status.kind === "installing"
        ? status.message
        : status.kind === "starting"
          ? status.message
          : "Initializing...";

  return (
    <div className="relative h-full w-full bg-gray-950">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-950/90">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
          </div>
          <span className="text-sm text-gray-300">{statusMessage}</span>
          {(status.kind === "installing" || status.kind === "starting") && (
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500/60 rounded-full animate-pulse" style={{ width: status.kind === "starting" ? "80%" : "40%" }} />
            </div>
          )}
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="WebContainers preview"
        className="h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
}
