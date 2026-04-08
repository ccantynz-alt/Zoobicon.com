import { NextRequest, NextResponse } from "next/server";
import { MCP_TOOLS } from "@/lib/mcp-tools";

export const runtime = "nodejs";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getOrigin(req: NextRequest): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  const host = req.headers.get("host") ?? "zoobicon.com";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const origin = getOrigin(req);
  const mcpUrl = `${origin}/api/mcp`;
  const pingUrl = `${origin}/api/mcp/ping`;
  const keysUrl = `${origin}/dashboard/api-keys`;
  const toolCount = MCP_TOOLS.length;

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        zoobicon: {
          url: mcpUrl,
          transport: "http",
          headers: {
            Authorization: "Bearer zbk_live_YOUR_KEY_HERE",
          },
        },
      },
    },
    null,
    2,
  );

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        zoobicon: {
          url: mcpUrl,
          type: "http",
          headers: {
            Authorization: "Bearer zbk_live_YOUR_KEY_HERE",
          },
        },
      },
    },
    null,
    2,
  );

  const windsurfConfig = JSON.stringify(
    {
      mcpServers: {
        zoobicon: {
          serverUrl: mcpUrl,
          headers: {
            Authorization: "Bearer zbk_live_YOUR_KEY_HERE",
          },
        },
      },
    },
    null,
    2,
  );

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Install Zoobicon MCP — ${toolCount} AI tools for Claude, Cursor & Windsurf</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body{background:radial-gradient(ellipse at top,#1e1b4b 0%,#0b0b15 60%);min-height:100vh}
  pre{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;line-height:1.55}
  .glow{box-shadow:0 0 80px -20px rgba(139,92,246,.45)}
  .code-block{background:#0a0a14;border:1px solid rgba(139,92,246,.25)}
  .copy-btn:hover{background:rgba(139,92,246,.2)}
</style>
</head>
<body class="text-white antialiased">
<div class="max-w-4xl mx-auto px-6 py-16">
  <div class="mb-12">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-200 text-xs font-medium mb-6">
      <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
      MCP Server Live · ${toolCount} tools · Protocol 2025-06-18
    </div>
    <h1 class="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-br from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
      Install Zoobicon MCP
    </h1>
    <p class="text-lg text-gray-400 max-w-2xl">
      Plug ${toolCount} Zoobicon AI tools directly into Claude Desktop, Cursor, or Windsurf. Generate sites, search domains, create videos — all from inside your editor.
    </p>
  </div>

  <div class="rounded-xl p-5 mb-10 code-block glow">
    <div class="text-xs uppercase tracking-wider text-purple-300 mb-2">Server URL</div>
    <code class="text-purple-200 text-lg">${escapeHtml(mcpUrl)}</code>
  </div>

  <div class="mb-6 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
    <div class="text-amber-200 text-sm">
      <strong>Need an API key?</strong> Create one at
      <a href="${escapeHtml(keysUrl)}" class="underline hover:text-amber-100">${escapeHtml(keysUrl)}</a>.
      Public tools work without a key; full access requires <code class="text-amber-100">zbk_live_*</code>.
    </div>
  </div>

  <section class="mb-10">
    <h2 class="text-2xl font-semibold mb-1">Claude Desktop</h2>
    <p class="text-gray-400 text-sm mb-3">Add to <code class="text-purple-300">~/Library/Application Support/Claude/claude_desktop_config.json</code></p>
    <div class="rounded-xl code-block overflow-hidden">
      <div class="flex items-center justify-between px-4 py-2 border-b border-purple-500/20 bg-purple-500/5">
        <span class="text-xs text-purple-300">claude_desktop_config.json</span>
        <button onclick="navigator.clipboard.writeText(document.getElementById('claude-cfg').innerText)" class="copy-btn text-xs px-2 py-1 rounded border border-purple-500/30 text-purple-200">Copy</button>
      </div>
      <pre id="claude-cfg" class="p-4 text-purple-100 overflow-x-auto">${escapeHtml(claudeDesktopConfig)}</pre>
    </div>
  </section>

  <section class="mb-10">
    <h2 class="text-2xl font-semibold mb-1">Cursor</h2>
    <p class="text-gray-400 text-sm mb-3">Add to <code class="text-purple-300">~/.cursor/mcp.json</code></p>
    <div class="rounded-xl code-block overflow-hidden">
      <div class="flex items-center justify-between px-4 py-2 border-b border-purple-500/20 bg-purple-500/5">
        <span class="text-xs text-purple-300">mcp.json</span>
        <button onclick="navigator.clipboard.writeText(document.getElementById('cursor-cfg').innerText)" class="copy-btn text-xs px-2 py-1 rounded border border-purple-500/30 text-purple-200">Copy</button>
      </div>
      <pre id="cursor-cfg" class="p-4 text-purple-100 overflow-x-auto">${escapeHtml(cursorConfig)}</pre>
    </div>
  </section>

  <section class="mb-10">
    <h2 class="text-2xl font-semibold mb-1">Windsurf</h2>
    <p class="text-gray-400 text-sm mb-3">Add to <code class="text-purple-300">~/.codeium/windsurf/mcp_config.json</code></p>
    <div class="rounded-xl code-block overflow-hidden">
      <div class="flex items-center justify-between px-4 py-2 border-b border-purple-500/20 bg-purple-500/5">
        <span class="text-xs text-purple-300">mcp_config.json</span>
        <button onclick="navigator.clipboard.writeText(document.getElementById('wind-cfg').innerText)" class="copy-btn text-xs px-2 py-1 rounded border border-purple-500/30 text-purple-200">Copy</button>
      </div>
      <pre id="wind-cfg" class="p-4 text-purple-100 overflow-x-auto">${escapeHtml(windsurfConfig)}</pre>
    </div>
  </section>

  <section class="mb-10">
    <h2 class="text-2xl font-semibold mb-1">Verify the server</h2>
    <div class="rounded-xl code-block overflow-hidden">
      <div class="flex items-center justify-between px-4 py-2 border-b border-purple-500/20 bg-purple-500/5">
        <span class="text-xs text-purple-300">shell</span>
      </div>
      <pre class="p-4 text-green-300 overflow-x-auto">curl ${escapeHtml(pingUrl)}</pre>
    </div>
  </section>

  <footer class="pt-10 mt-10 border-t border-purple-500/15 text-sm text-gray-500">
    zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh
  </footer>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
