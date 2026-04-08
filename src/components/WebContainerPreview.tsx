"use client";

import { useEffect, useRef, useState } from "react";
import { prepareProject } from "@/lib/webcontainers-preview";

interface WebContainerPreviewProps {
  files: Record<string, string>;
  entry?: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "booting"; message: string }
  | { kind: "ready"; url: string }
  | { kind: "error"; message: string; hint?: string };

interface WebContainerInstance {
  mount: (tree: unknown) => Promise<void>;
  spawn: (
    command: string,
    args: string[]
  ) => Promise<{
    exit: Promise<number>;
    output: { pipeTo: (sink: WritableStream<string>) => Promise<void> };
  }>;
  on: (event: "server-ready", listener: (port: number, url: string) => void) => void;
}

interface WebContainerModule {
  WebContainer: {
    boot: () => Promise<WebContainerInstance>;
  };
}

export default function WebContainerPreview({ files, entry }: WebContainerPreviewProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const bootedRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    let cancelled = false;

    async function boot() {
      setStatus({ kind: "booting", message: "Loading WebContainers runtime..." });

      let mod: WebContainerModule;
      try {
        // Dynamic import so SSR + missing-package both fail gracefully.
        mod = (await import(
          /* webpackIgnore: true */ "@webcontainer/api" as string
        )) as unknown as WebContainerModule;
      } catch (err) {
        if (cancelled) return;
        setStatus({
          kind: "error",
          message: "WebContainers package not available.",
          hint:
            "Install @webcontainer/api to enable WebContainers preview. " +
            "Run: npm install @webcontainer/api",
        });
        return;
      }

      try {
        setStatus({ kind: "booting", message: "Booting WebContainer..." });
        const instance = await mod.WebContainer.boot();
        if (cancelled) return;

        setStatus({ kind: "booting", message: "Mounting project files..." });
        const tree = prepareProject(files);
        await instance.mount(tree);
        if (cancelled) return;

        instance.on("server-ready", (_port, url) => {
          if (cancelled) return;
          setStatus({ kind: "ready", url });
          if (iframeRef.current) {
            iframeRef.current.src = url;
          }
        });

        setStatus({ kind: "booting", message: "Installing dependencies (npm install)..." });
        const install = await instance.spawn("npm", ["install"]);
        const installCode = await install.exit;
        if (cancelled) return;
        if (installCode !== 0) {
          setStatus({
            kind: "error",
            message: `npm install failed with exit code ${installCode}.`,
            hint: "Check package.json in the generated project.",
          });
          return;
        }

        setStatus({ kind: "booting", message: "Starting dev server (npm run dev)..." });
        const devScript = entry ?? "dev";
        await instance.spawn("npm", ["run", devScript]);
        // Server ready event will flip status to "ready".
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setStatus({
          kind: "error",
          message: "Failed to boot WebContainer.",
          hint: message,
        });
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, [files, entry]);

  if (status.kind === "error") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gray-900 p-8 text-center">
        <div className="text-lg font-semibold text-red-400">{status.message}</div>
        {status.hint ? (
          <div className="max-w-md text-sm text-gray-300">{status.hint}</div>
        ) : null}
        <button
          onClick={() => {
            bootedRef.current = false;
            setStatus({ kind: "idle" });
          }}
          className="mt-2 rounded-md bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-gray-950">
      {status.kind !== "ready" ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950/90 text-sm text-gray-300">
          {status.kind === "booting" ? status.message : "Initialising..."}
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        title="WebContainers preview"
        className="h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
