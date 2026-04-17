/**
 * Zoobicon Site Smoke Test
 *
 * Hits every critical page and API endpoint to verify they respond.
 * Run: npx tsx scripts/smoke-test.ts https://zoobicon.com
 * Or:  npx tsx scripts/smoke-test.ts http://localhost:3000
 */

const BASE = process.argv[2] || "http://localhost:3000";

interface TestResult {
  name: string;
  url: string;
  status: number | "ERROR";
  ok: boolean;
  ms: number;
  error?: string;
}

async function testUrl(name: string, path: string, options?: { method?: string; body?: string; headers?: Record<string, string> }): Promise<TestResult> {
  const url = `${BASE}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: options?.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: options?.body,
      signal: AbortSignal.timeout(30000),
      redirect: "follow",
    });
    const ms = Date.now() - start;
    return { name, url, status: res.status, ok: res.status < 500, ms };
  } catch (err) {
    const ms = Date.now() - start;
    return { name, url, status: "ERROR", ok: false, ms, error: err instanceof Error ? err.message : String(err) };
  }
}

async function run() {
  console.log(`\n🔍 ZOOBICON SMOKE TEST — ${BASE}\n`);
  console.log("=" .repeat(80));

  const results: TestResult[] = [];

  // ── PAGES (must return 200) ──
  const pages = [
    ["Homepage", "/"],
    ["Builder", "/builder"],
    ["Video Creator", "/video-creator"],
    ["Domains", "/domains"],
    ["Pricing", "/pricing"],
    ["Login", "/auth/login"],
    ["Signup", "/auth/signup"],
    ["Tools", "/tools"],
    ["Developers", "/developers"],
  ];

  console.log("\n📄 PAGES\n");
  for (const [name, path] of pages) {
    const r = await testUrl(name, path);
    results.push(r);
    const icon = r.ok ? "✅" : "❌";
    console.log(`  ${icon} ${r.status} ${name.padEnd(20)} ${r.ms}ms  ${r.url}`);
  }

  // ── API HEALTH ENDPOINTS ──
  const healthEndpoints = [
    ["Auth Diagnose", "/api/auth/diagnose"],
    ["MCP Ping", "/api/mcp/ping"],
    ["DB Init Check", "/api/db/init"],
  ];

  console.log("\n🏥 HEALTH CHECKS\n");
  for (const [name, path] of healthEndpoints) {
    const r = await testUrl(name, path);
    results.push(r);
    const icon = r.ok ? "✅" : "❌";
    console.log(`  ${icon} ${r.status} ${name.padEnd(20)} ${r.ms}ms  ${r.url}`);
  }

  // ── API ENDPOINTS (must not 500) ──
  const apiTests = [
    ["Domain Search", "/api/domains/search?q=testdomain&tlds=com,ai"],
    ["Business Names", "/api/tools/business-names", { method: "POST", body: JSON.stringify({ description: "test", count: 1 }) }],
    ["Builder Stream", "/api/generate/react-stream", { method: "POST", body: JSON.stringify({ prompt: "test", mode: "fast" }) }],
    ["Video Chat", "/api/video-creator/chat", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "test" }] }) }],
    ["Edit Endpoint", "/api/generate/edit", { method: "POST", body: JSON.stringify({ prompt: "make it blue", files: {} }) }],
    ["Captions Styles", "/api/video-creator/captions"],
    ["Voice Clone Info", "/api/video-creator/voice-clone"],
    ["MCP Tools List", "/api/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }) }],
  ];

  console.log("\n🔌 API ENDPOINTS\n");
  for (const [name, path, opts] of apiTests) {
    const r = await testUrl(name, path as string, opts as { method?: string; body?: string });
    results.push(r);
    const icon = r.ok ? "✅" : "❌";
    console.log(`  ${icon} ${r.status} ${name.padEnd(20)} ${r.ms}ms  ${r.url}`);
  }

  // ── SUMMARY ──
  console.log("\n" + "=".repeat(80));
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  const total = results.length;

  console.log(`\n📊 RESULTS: ${passed}/${total} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log("❌ FAILURES:\n");
    for (const r of results.filter(r => !r.ok)) {
      console.log(`  ${r.name}: ${r.status} — ${r.error || r.url}`);
    }
  }

  console.log(`\n⏱️  Total time: ${results.reduce((s, r) => s + r.ms, 0)}ms`);
  console.log("");

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(console.error);
