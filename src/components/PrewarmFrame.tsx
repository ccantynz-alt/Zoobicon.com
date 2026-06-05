"use client";

/**
 * PrewarmFrame — populates the browser HTTP cache with every external
 * resource that EscapeHatchPreview needs before the user submits their
 * first prompt.
 *
 * HOW IT WORKS:
 *   The browser's HTTP cache is shared across all frames in a tab. A
 *   hidden iframe that fetches react from /vendor/react.js (same-origin)
 *   or https://esm.sh/react@18.3.1 (fallback) fills the cache; when the
 *   real preview iframe requests the same URL seconds later, it gets a
 *   cache hit instead of a cold network fetch. Babel-standalone is the
 *   biggest win — caching it shaves 2-3s off the first render.
 *
 * SPRINT 1 S3 UPDATE: this component now matches the manifest-driven
 * fallback logic in EscapeHatchPreview. We probe /vendor/manifest.json
 * first; for any dep marked "downloaded"/"cached" we pre-warm the
 * local /vendor/ path, otherwise we fall back to esm.sh per-dep. Same
 * code path, same URLs, so the real preview iframe sees a fully warm
 * cache.
 *
 * TIMING:
 *   Mounted statically in builder/page.tsx so the fetches start the
 *   moment the route loads — while the user is still reading the page
 *   or composing their first prompt. By the time files arrive from
 *   the SSE stream the cache is already warm.
 */

import { useEffect, useState } from "react";

// Same fallback URL map as EscapeHatchPreview's ESM_FALLBACK.
const ESM_FALLBACK: Record<string, string> = {
  react: "https://esm.sh/react@18.3.1",
  "react-dom": "https://esm.sh/react-dom@18.3.1",
  "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
  "lucide-react": "https://esm.sh/lucide-react@1.7.0?external=react",
  "framer-motion":
    "https://esm.sh/framer-motion@12.38.0?external=react,react-dom",
  clsx: "https://esm.sh/clsx@2.1.1",
  "tailwind-merge": "https://esm.sh/tailwind-merge@2.5.5",
};

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

function buildSrcDoc(esmMap: Record<string, string>, babelUrl: string): string {
  return `<!DOCTYPE html><html><head>
<script type="importmap">${JSON.stringify({ imports: esmMap })}<\/script>
</head><body>
<script type="module">
// Fire-and-forget — just populate the HTTP cache. Errors are silently
// swallowed so a CDN hiccup never breaks the main page.
Promise.all([
  import(${JSON.stringify(babelUrl)}),
  import("react"),
  import("react-dom/client"),
  import("lucide-react"),
  import("framer-motion"),
  import("clsx"),
  import("tailwind-merge"),
]).catch(function(){});
// Tailwind CDN is loaded as a <script>, so we prime its cache the same way.
var s=document.createElement("script");
s.src="https://cdn.tailwindcss.com";
s.onerror=function(){};
document.head.appendChild(s);
<\/script></body></html>`;
}

export default function PrewarmFrame() {
  // Same resolution logic as EscapeHatchPreview's useResolvedEsm —
  // we want identical URLs so the cache fills land on the same keys.
  const [srcDoc, setSrcDoc] = useState<string>(() =>
    buildSrcDoc(ESM_FALLBACK, BABEL_FALLBACK_URL)
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/vendor/manifest.json", { cache: "force-cache" });
        if (!res.ok) return;
        const manifest = (await res.json()) as VendorManifest;
        const okFiles = new Set(
          manifest.files
            .filter((f) => f.status === "downloaded" || f.status === "cached")
            .map((f) => f.name)
        );
        if (cancelled) return;

        const hybrid: Record<string, string> = {};
        for (const [spec, fallback] of Object.entries(ESM_FALLBACK)) {
          const localPath = VENDOR_PATHS[spec];
          const localFile = localPath?.replace("/vendor/", "");
          hybrid[spec] = localFile && okFiles.has(localFile) ? localPath : fallback;
        }
        const babelUrl = okFiles.has("babel-standalone.js")
          ? BABEL_VENDOR_PATH
          : BABEL_FALLBACK_URL;
        setSrcDoc(buildSrcDoc(hybrid, babelUrl));
      } catch {
        // keep ESM_FALLBACK srcdoc
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <iframe
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        top: -9999,
        left: -9999,
        opacity: 0,
        pointerEvents: "none",
        border: "none",
      }}
      aria-hidden="true"
      title=""
      tabIndex={-1}
    />
  );
}
