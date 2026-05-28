"use client";

/**
 * PrewarmFrame — populates the browser HTTP cache with every external
 * resource that EscapeHatchPreview needs before the user submits their
 * first prompt.
 *
 * HOW IT WORKS:
 *   The browser's HTTP cache is shared across all frames in a tab.  A hidden
 *   iframe that fetches react@18.3.1 from esm.sh fills the cache; when the
 *   real preview iframe requests the same URL seconds later, it gets a cache
 *   hit (~100ms) instead of a cold network fetch (~600ms per package).
 *   Babel-standalone alone is ~1MB — caching it shaves 2-3s off the first
 *   render.
 *
 * TIMING:
 *   Mounted statically (not via next/dynamic) in builder/page.tsx so the
 *   fetches start the moment the route loads — while the user is still
 *   reading the page or composing their first prompt.  By the time files
 *   arrive from the SSE stream the cache is already warm.
 *
 * The URLs here are intentionally identical to ESM_MAP in
 * EscapeHatchPreview.tsx — any mismatch means a cache miss.
 */

// Matches ESM_MAP in EscapeHatchPreview.tsx exactly.
const IMPORT_MAP = {
  imports: {
    react: "https://esm.sh/react@18.3.1",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
    "lucide-react": "https://esm.sh/lucide-react@1.7.0?external=react",
    "framer-motion":
      "https://esm.sh/framer-motion@12.38.0?external=react,react-dom",
    clsx: "https://esm.sh/clsx@2.1.1",
    "tailwind-merge": "https://esm.sh/tailwind-merge@2.5.5",
  },
};

const SRCDOC = `<!DOCTYPE html><html><head>
<script type="importmap">${JSON.stringify(IMPORT_MAP)}<\/script>
</head><body>
<script type="module">
// Fire-and-forget — just populate the HTTP cache.  Errors are silently
// swallowed so a CDN hiccup never breaks the main page.
Promise.all([
  import("https://esm.sh/@babel/standalone@7.25.6"),
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

export default function PrewarmFrame() {
  return (
    <iframe
      srcDoc={SRCDOC}
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
