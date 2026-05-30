"use client";

/**
 * EscapeHatchPreview — Sandpack-free React preview.
 *
 * The hosted Sandpack bundler (sandpack-bundler.codesandbox.io) has
 * documented reliability problems — TIME_OUT errors and silent
 * shut-downs. Craig hit them repeatedly on a real build. This
 * component is the escape hatch: it renders a generated React file
 * tree in a plain iframe using browser-native ES modules, esm.sh for
 * npm packages, and Babel-standalone for JSX/TSX → JS transpilation.
 * Zero dependency on any external bundler service.
 *
 * Limitations vs Sandpack:
 *  - No hot-reload (a re-render unmounts + remounts the iframe)
 *  - No code editor (just preview)
 *  - Slower first paint (~3-5s while Babel + React + esm.sh load)
 *
 * Tradeoffs accepted because the alternative (Sandpack timing out
 * silently) is a launch blocker.
 */

import { useEffect, useMemo, useState } from "react";

interface EscapeHatchPreviewProps {
  files: Record<string, string>;
  onDownload?: () => void;
}

// Sprint 1 S1+I1+I3: self-host preview deps. scripts/vendor-sync.mjs
// runs at build time and populates public/vendor/ with the same esm.sh
// bundles. At runtime we PREFER /vendor/ paths so the user's iframe
// loads from zoobicon.com — no esm.sh in the runtime hot path.
//
// Fallback chain (per dep):
//   1. /vendor/<pkg>.js  — self-hosted, populated by prebuild script
//   2. https://esm.sh/<pkg>@<ver>  — fallback if vendor file is missing
//
// We probe the manifest at /vendor/manifest.json on mount and rewrite
// ESM_MAP to local paths for whichever deps actually shipped. If the
// manifest is unreachable or empty, we fall through to esm.sh and the
// preview still works exactly as before.
const ESM_FALLBACK: Record<string, string> = {
  react: "https://esm.sh/react@18.3.1",
  "react-dom": "https://esm.sh/react-dom@18.3.1",
  "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
  "lucide-react": "https://esm.sh/lucide-react@1.7.0?external=react",
  "framer-motion": "https://esm.sh/framer-motion@12.38.0?external=react,react-dom",
  clsx: "https://esm.sh/clsx@2.1.1",
  "tailwind-merge": "https://esm.sh/tailwind-merge@2.5.5",
};

// Specifier → vendor filename (when populated). Lines up with
// VENDOR_TARGETS in scripts/vendor-sync.mjs.
const VENDOR_PATHS: Record<string, string> = {
  react: "/vendor/react.js",
  "react-dom": "/vendor/react-dom.js",
  "react-dom/client": "/vendor/react-dom-client.js",
  "lucide-react": "/vendor/lucide-react.js",
  "framer-motion": "/vendor/framer-motion.js",
  clsx: "/vendor/clsx.js",
  "tailwind-merge": "/vendor/tailwind-merge.js",
};

const BABEL_FALLBACK_URL = "https://esm.sh/@babel/standalone@7.25.6";
const BABEL_VENDOR_PATH = "/vendor/babel-standalone.js";

interface VendorManifest {
  syncedAt: string;
  files: Array<{ name: string; status: "downloaded" | "cached" | "failed" }>;
}

function buildSrcDoc(
  files: Record<string, string>,
  esmMap: Record<string, string>,
  babelUrl: string
): string {
  // Normalise paths — Sandpack uses leading-slash convention; esm
  // import resolution doesn't.
  const normalized: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    normalized[path.replace(/^\/+/, "")] = content;
  }

  const stylesCss = normalized["styles.css"] || "";

  // The runtime script is the meat. It runs INSIDE the iframe and:
  //  1. Loads Babel-standalone (vendor or esm.sh fallback)
  //  2. Topologically sorts the project's TSX/TS files
  //  3. Transpiles each file, rewrites relative imports to Blob URLs,
  //     creates a Blob URL per file
  //  4. Dynamically imports App and renders to #root
  //
  // Errors at any step are surfaced to the visible DOM so the user
  // sees a real message instead of a blank iframe.
  const runtime = String.raw`
    const FILES = __FILES_JSON__;
    const BABEL_URL = __BABEL_URL__;

    function showError(title, detail) {
      const root = document.getElementById("root");
      root.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:24px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#1a1a1c;background:#fcfaf3;border:1px solid #ebe7d6;border-radius:12px;margin:24px;max-width:640px';
      const h = document.createElement('div');
      h.style.cssText = 'font-weight:600;color:#8c6b25;margin-bottom:8px;';
      h.textContent = title;
      const p = document.createElement('pre');
      p.style.cssText = 'font:11px/1.5 ui-monospace,monospace;color:#2a2a30;white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid #ebe7d6;border-radius:8px;padding:10px;margin:0;max-height:240px;overflow:auto';
      p.textContent = detail;
      wrap.appendChild(h); wrap.appendChild(p);
      root.appendChild(wrap);
    }

    (async () => {
      try {
        const babelMod = await import(BABEL_URL);
        const Babel = babelMod.default || babelMod;

        function resolveRel(imp, from) {
          const fromDir = from.includes("/") ? from.substring(0, from.lastIndexOf("/") + 1) : "";
          let p = imp;
          if (p.startsWith("./")) p = fromDir + p.slice(2);
          else if (p.startsWith("../")) {
            let dir = fromDir;
            while (p.startsWith("../")) {
              dir = dir.replace(/[^/]+\/$/, "");
              p = p.slice(3);
            }
            p = dir + p;
          }
          // Try common extensions
          const candidates = [p, p + ".tsx", p + ".ts", p + ".jsx", p + ".js", p + "/index.tsx", p + "/index.ts"];
          for (const c of candidates) if (FILES[c]) return c;
          return null;
        }

        // Strip imports of non-JS static assets (CSS, images, fonts).
        // CSS is already inlined as a <style> tag in the iframe head;
        // images and fonts will 404 inside the iframe but at least the
        // module graph can resolve. Without this, browser-native ESM
        // throws "Invalid relative url or base scheme isn't hierarchical"
        // because Blob URLs aren't hierarchical and can't resolve
        // ./styles.css.
        function stripAssetImports(code) {
          return code
            // Side-effect imports:   import "./styles.css";
            .replace(/^\s*import\s+["'][^"']+\.(css|scss|sass|less|svg|png|jpe?g|gif|webp|woff2?|ttf|otf)["']\s*;?\s*$/gm, "")
            // Default/namespace imports of assets: import styles from "./styles.css"
            .replace(/^\s*import\s+[\w\s{},*]+\s+from\s+["'][^"']+\.(css|scss|sass|less|svg|png|jpe?g|gif|webp|woff2?|ttf|otf)["']\s*;?\s*$/gm, "");
        }

        function depsOf(path, code) {
          const deps = [];
          const re = /from\s+["'](\.[^"']+)["']/g;
          let m;
          while ((m = re.exec(code))) {
            const r = resolveRel(m[1], path);
            // Only count deps that are JS — CSS/img imports might be
            // resolvable by file name but they're not processable
            // through the Babel + Blob URL pipeline.
            if (r && /\.(tsx?|jsx?)$/.test(r)) deps.push(r);
          }
          return deps;
        }

        const codeFiles = Object.keys(FILES).filter(p => /\.(tsx?|jsx?)$/.test(p));
        const moduleUrls = {};
        const pending = new Set(codeFiles);
        let stalls = 0;

        // Sprint 1 S2: content-hash transpile cache.
        // Babel.transform is the single most expensive step (~10-50ms
        // per file × 13 files = 130-650ms even on warm runs). The vast
        // majority of edits change ONE file; the other 12 are byte-
        // identical to the previous build. We cache by SHA-256 of
        // (sourceForBabel + path) in localStorage so cross-rebuild
        // transpilation is skipped for unchanged files.
        //
        // Why localStorage and not in-memory: the iframe is torn down
        // and rebuilt on every preview update, so an in-memory cache
        // would die between builds. localStorage persists across the
        // iframe lifecycle as long as the origin (srcdoc) is the same.
        const CACHE_PREFIX = "zoobicon:transpile:v1:";
        const CACHE_MAX = 200; // hard cap on cached entries — LRU sweep below
        async function sha256Hex(s) {
          const buf = new TextEncoder().encode(s);
          const hash = await crypto.subtle.digest("SHA-256", buf);
          return Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        }
        function cacheGet(key) {
          try { return localStorage.getItem(CACHE_PREFIX + key); } catch { return null; }
        }
        function cacheSet(key, value) {
          try {
            localStorage.setItem(CACHE_PREFIX + key, value);
            // Simple LRU sweep: if we've exceeded CACHE_MAX entries,
            // drop the oldest 25%. localStorage doesn't track recency
            // natively so we use insertion order from key enumeration
            // which is reasonable for this size.
            let count = 0;
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith(CACHE_PREFIX)) count++;
            }
            if (count > CACHE_MAX) {
              const toDrop = Math.ceil(count * 0.25);
              const dropped = [];
              for (let i = 0; i < localStorage.length && dropped.length < toDrop; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(CACHE_PREFIX)) dropped.push(k);
              }
              for (const k of dropped) localStorage.removeItem(k);
            }
          } catch {
            // Storage quota / private mode — silently skip caching.
          }
        }

        let cacheHits = 0;
        let cacheMisses = 0;

        while (pending.size > 0) {
          let progress = false;
          for (const path of [...pending]) {
            const deps = depsOf(path, FILES[path]);
            if (deps.every(d => moduleUrls[d])) {
              // Strip CSS/image imports BEFORE Babel — Babel preserves
              // them as-is and they'd leak into the Blob URL module.
              const sourceForBabel = stripAssetImports(FILES[path]);
              let transpiled;
              // Cache key includes filename because tsx/ts/jsx/js
              // toggling changes the Babel presets and the path is
              // part of the transform input.
              const cacheKey = await sha256Hex(path + "\0" + sourceForBabel);
              const cached = cacheGet(cacheKey);
              if (cached !== null) {
                transpiled = cached;
                cacheHits++;
              } else {
                try {
                  transpiled = Babel.transform(sourceForBabel, {
                    presets: [
                      ["typescript", { onlyRemoveTypeImports: true, isTSX: /\.tsx$/.test(path), allExtensions: true }],
                      ["react", { runtime: "classic" }],
                    ],
                    filename: path,
                  }).code;
                } catch (err) {
                  showError("Failed to transpile " + path, String(err && err.message || err));
                  return;
                }
                cacheSet(cacheKey, transpiled);
                cacheMisses++;
              }

              // Rewrite relative imports → blob URLs we already created.
              // Leave bare-package imports alone — the <importmap> handles
              // them (react, lucide-react, framer-motion, clsx, tw-merge).
              const rewritten = transpiled.replace(
                /from\s+["']([^"']+)["']/g,
                (whole, imp) => {
                  if (imp.startsWith(".")) {
                    const r = resolveRel(imp, path);
                    if (r && moduleUrls[r]) return 'from "' + moduleUrls[r] + '"';
                    return whole;
                  }
                  return whole;
                }
              );

              const blob = new Blob([rewritten], { type: "application/javascript" });
              moduleUrls[path] = URL.createObjectURL(blob);
              pending.delete(path);
              progress = true;
            }
          }
          if (!progress) {
            stalls++;
            if (stalls > 3) {
              showError(
                "Circular or unresolved imports",
                "Remaining: " + [...pending].join(", ")
              );
              return;
            }
          }
        }

        // Cache telemetry — visible in DevTools console. Useful when
        // tuning whether the transpile cache is actually paying off
        // for the user's edit patterns.
        if (cacheHits + cacheMisses > 0) {
          console.log(
            "[zoobicon-preview] transpile cache: " + cacheHits + " hits / " +
              (cacheHits + cacheMisses) + " files (" +
              Math.round((cacheHits / (cacheHits + cacheMisses)) * 100) + "% hit rate)"
          );
        }

        // Find entry
        const entry =
          FILES["App.tsx"] ? "App.tsx" :
          FILES["App.jsx"] ? "App.jsx" :
          FILES["App.ts"] ? "App.ts" :
          FILES["index.tsx"] ? "index.tsx" :
          codeFiles.find(p => /^App\./.test(p));
        if (!entry || !moduleUrls[entry]) {
          showError("No App entry point", "Expected App.tsx in the file tree. Got: " + Object.keys(FILES).join(", "));
          return;
        }

        const [{ default: React }, { createRoot }, AppMod] = await Promise.all([
          import("react"),
          import("react-dom/client"),
          import(moduleUrls[entry]),
        ]);
        const App = AppMod.default || AppMod;
        if (!App) {
          showError("App.tsx has no default export", "Make sure App.tsx exports a default function.");
          return;
        }
        createRoot(document.getElementById("root")).render(React.createElement(App));
      } catch (err) {
        showError("Preview failed", String(err && err.stack || err));
      }
    })();
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Zoobicon preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>html,body,#root{margin:0;min-height:100vh;background:#ffffff}</style>
  <style>${stylesCss.replace(/<\/style>/g, "<\\/style>")}</style>
  <script type="importmap">
${JSON.stringify({ imports: esmMap }, null, 2)}
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module">
${runtime
  .replace("__FILES_JSON__", JSON.stringify(normalized))
  .replace("__BABEL_URL__", JSON.stringify(babelUrl))}
  </script>
</body>
</html>`;
}

/**
 * Resolve ESM_MAP + Babel URL — checks /vendor/manifest.json on mount
 * and prefers local paths when the file is present and reported
 * downloaded/cached. Falls back to esm.sh per-dep if vendor missing.
 *
 * This is the Sprint 1 S1+I1+I3 self-hosting move. Users never hit
 * esm.sh at runtime once Vercel has populated /vendor/.
 */
function useResolvedEsm() {
  const [esmMap, setEsmMap] = useState<Record<string, string>>(ESM_FALLBACK);
  const [babelUrl, setBabelUrl] = useState<string>(BABEL_FALLBACK_URL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/vendor/manifest.json", { cache: "force-cache" });
        if (!res.ok) return; // manifest missing — keep esm.sh fallbacks
        const manifest = (await res.json()) as VendorManifest;
        const okFiles = new Set(
          manifest.files
            .filter((f) => f.status === "downloaded" || f.status === "cached")
            .map((f) => f.name)
        );
        if (cancelled) return;

        // Build a hybrid map: local path if vendor file present, else esm.sh
        const hybrid: Record<string, string> = {};
        for (const [spec, fallback] of Object.entries(ESM_FALLBACK)) {
          const localPath = VENDOR_PATHS[spec];
          const localFile = localPath?.replace("/vendor/", "");
          hybrid[spec] = localFile && okFiles.has(localFile) ? localPath : fallback;
        }
        setEsmMap(hybrid);

        if (okFiles.has("babel-standalone.js")) {
          setBabelUrl(BABEL_VENDOR_PATH);
        }
      } catch {
        // Network / parse failure — keep esm.sh fallbacks
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { esmMap, babelUrl };
}

export default function EscapeHatchPreview({ files, onDownload }: EscapeHatchPreviewProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const { esmMap, babelUrl } = useResolvedEsm();
  // Re-build srcDoc when files OR the resolved ESM map change. The
  // reloadKey trick lets the user manually retry a stuck preview
  // without changing files.
  const srcDoc = useMemo(() => buildSrcDoc(files, esmMap, babelUrl), [files, esmMap, babelUrl]);
  const hasFiles = Object.keys(files).length > 0;

  if (!hasFiles) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: "var(--paper)", color: "var(--ink-muted)", fontSize: 13 }}
      >
        No build yet — describe a site to begin.
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      <iframe
        key={reloadKey}
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        className="flex-1 w-full border-0"
        title="Site preview (direct)"
        loading="lazy"
      />
      <div
        className="flex items-center justify-between px-3 py-1.5 border-t text-[11px]"
        style={{
          background: "var(--paper-elevated)",
          borderColor: "var(--rule)",
          color: "var(--ink-muted)",
        }}
      >
        <span>
          Direct preview — Zoobicon&apos;s own sandbox. Self-hosted React +
          Babel from /vendor/.
        </span>
        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="rounded px-2 py-0.5 text-[11px]"
              style={{ color: "var(--ink)" }}
            >
              Download ZIP
            </button>
          )}
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded px-2 py-0.5 text-[11px]"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
