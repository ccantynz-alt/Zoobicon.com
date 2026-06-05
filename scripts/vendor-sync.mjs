#!/usr/bin/env node
/**
 * vendor-sync — download the in-browser preview deps from esm.sh to
 * public/vendor/ so EscapeHatchPreview can load them from the
 * zoobicon.com origin instead of esm.sh at runtime.
 *
 * Goal: kill the esm.sh dependency in the preview hot path. Users
 * never hit esm.sh; their iframes load /vendor/*.js from the same
 * origin as the rest of the page. Build-time still pulls from esm.sh
 * because we don't yet have a self-built bundler — but that's once
 * per deploy, not once per user preview.
 *
 * Runs as a `prebuild` step in package.json. Idempotent — if a file
 * already exists in public/vendor/ it skips the download (so local
 * `npm run build` is fast on a populated tree).
 *
 * If a download fails (esm.sh down, network blocked) the script
 * EXITS 0 — it does not block the build. EscapeHatchPreview has a
 * built-in fallback to esm.sh when /vendor/ is missing, so the
 * preview still works.
 */

import { writeFile, mkdir, access, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VENDOR_DIR = join(__dirname, "..", "public", "vendor");

// Same versions as src/components/EscapeHatchPreview.tsx ESM_MAP.
// If you bump a version there, bump it here.
const VENDOR_TARGETS = [
  {
    name: "react.js",
    url: "https://esm.sh/react@18.3.1",
  },
  {
    name: "react-dom.js",
    url: "https://esm.sh/react-dom@18.3.1",
  },
  {
    name: "react-dom-client.js",
    url: "https://esm.sh/react-dom@18.3.1/client",
  },
  {
    name: "lucide-react.js",
    url: "https://esm.sh/lucide-react@1.7.0?external=react",
  },
  {
    name: "framer-motion.js",
    url: "https://esm.sh/framer-motion@12.38.0?external=react,react-dom",
  },
  {
    name: "clsx.js",
    url: "https://esm.sh/clsx@2.1.1",
  },
  {
    name: "tailwind-merge.js",
    url: "https://esm.sh/tailwind-merge@2.5.5",
  },
  {
    name: "babel-standalone.js",
    url: "https://esm.sh/@babel/standalone@7.25.6",
  },
];

async function hasValidCache(p) {
  // A cached vendor file counts as valid only if it exists AND is at
  // least 2 KB — anything smaller is almost certainly an error
  // response from a previous failed download (rate-limit page,
  // "Host not in allowlist" stub, etc.) that we should retry rather
  // than ship.
  try {
    await access(p);
    const s = await stat(p);
    return s.size >= 2048;
  } catch {
    return false;
  }
}

async function downloadOne({ name, url }) {
  const out = join(VENDOR_DIR, name);
  if (await hasValidCache(out)) {
    console.log(`[vendor-sync] skip ${name} — already present`);
    return { name, status: "cached" };
  }
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ZoobiconVendorSync/1.0 (+https://zoobicon.com)" },
      // 30s is generous — esm.sh sometimes does fresh bundling on a cold
      // request.
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      console.warn(`[vendor-sync] ${name}: HTTP ${res.status} — leaving missing, runtime will fall back to esm.sh`);
      return { name, status: "failed", code: res.status };
    }
    const body = await res.text();
    // Sanity check — esm.sh bundles should be >2KB. If we got back
    // something tiny (rate-limit / block page), don't write it.
    if (body.length < 2000 && !body.includes("export")) {
      console.warn(`[vendor-sync] ${name}: response too small (${body.length} bytes) — likely rate-limit or block`);
      return { name, status: "failed", code: 0 };
    }
    // esm.sh returns ESM source pointing at /v135/<hash>/<pkg>/es2022/...
    // Those nested URLs are also on esm.sh — to truly self-host we'd
    // need to follow + rewrite each. For now we accept the runtime
    // still fetches the nested artifacts from esm.sh (transparently
    // cached by browser); the entry point is local, which is the
    // biggest reliability win.
    await writeFile(out, body, "utf-8");
    console.log(`[vendor-sync] saved ${name} (${(body.length / 1024).toFixed(1)} KB)`);
    return { name, status: "downloaded", bytes: body.length };
  } catch (err) {
    console.warn(`[vendor-sync] ${name}: ${err instanceof Error ? err.message : err}`);
    return { name, status: "failed", code: 0 };
  }
}

async function writeManifest(results) {
  const manifest = {
    syncedAt: new Date().toISOString(),
    files: results,
  };
  await writeFile(
    join(VENDOR_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );
  console.log(`[vendor-sync] manifest written`);
}

async function main() {
  await mkdir(VENDOR_DIR, { recursive: true });
  console.log(`[vendor-sync] target: ${VENDOR_DIR}`);

  const results = [];
  for (const target of VENDOR_TARGETS) {
    results.push(await downloadOne(target));
  }

  await writeManifest(results);

  const downloaded = results.filter((r) => r.status === "downloaded").length;
  const cached = results.filter((r) => r.status === "cached").length;
  const failed = results.filter((r) => r.status === "failed").length;
  console.log(
    `[vendor-sync] done — ${downloaded} downloaded, ${cached} cached, ${failed} failed of ${results.length} targets`
  );
  // Always exit 0 — failures are non-fatal (runtime falls back).
}

main().catch((err) => {
  console.warn(`[vendor-sync] script error (non-fatal):`, err);
  process.exit(0);
});
