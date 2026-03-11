/**
 * Zoobicon Health Check Script
 *
 * Tests all critical builder flows to ensure the product works end-to-end.
 * Run with: npx tsx scripts/health-check.ts
 *
 * Requires the dev server running on localhost:3000 (or set BASE_URL env var).
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`  ✓ ${name} (${Date.now() - start}ms)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, duration: Date.now() - start, error: msg });
    console.log(`  ✗ ${name} — ${msg}`);
  }
}

function assertBodyContent(html: string, minChars = 100): void {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error("No <body> tag found in HTML");
  const bodyText = bodyMatch[1]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (bodyText.length < minChars) {
    throw new Error(`Body text too short: ${bodyText.length} chars (need ${minChars}+). First 200: ${bodyText.substring(0, 200)}`);
  }
}

function assertHtmlStructure(html: string): void {
  if (!/<html/i.test(html)) throw new Error("Missing <html> tag");
  if (!/<head/i.test(html)) throw new Error("Missing <head> tag");
  if (!/<body/i.test(html)) throw new Error("Missing <body> tag");
  if (!/<\/html>/i.test(html)) throw new Error("Missing </html> tag");
}

async function fetchJson(path: string, body: Record<string, unknown>, timeoutMs = 180000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${data.error || JSON.stringify(data)}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log(`\n🔍 Zoobicon Health Check — ${BASE_URL}\n`);

  // ── Page Route Checks ──
  console.log("Page Routes:");

  const criticalPages = [
    "/",
    "/builder",
    "/pricing",
    "/dashboard",
    "/auth/login",
    "/auth/signup",
    "/generators",
  ];

  for (const page of criticalPages) {
    await test(`GET ${page}`, async () => {
      const res = await fetch(`${BASE_URL}${page}`, { redirect: "follow" });
      if (!res.ok && res.status !== 307 && res.status !== 308) {
        throw new Error(`HTTP ${res.status}`);
      }
    });
  }

  // ── API Route Checks ──
  console.log("\nAPI Routes:");

  await test("POST /api/contact (form submission)", async () => {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", email: "test@test.com", message: "Health check" }),
    });
    // Accept 200 or 500 (no DB) — just confirm route exists
    if (res.status === 404) throw new Error("Route not found");
  });

  // ── Generation Tests (the core product) ──
  console.log("\nGeneration (Core Product):");

  await test("Non-stream generate — simple site", async () => {
    const data = await fetchJson("/api/generate", {
      prompt: "A simple landing page for a dog walking service called Happy Paws in Auckland",
      tier: "standard",
    });
    if (!data.html) throw new Error("No HTML returned");
    assertHtmlStructure(data.html);
    assertBodyContent(data.html, 200);
  });

  await test("Stream generate — returns valid SSE", async () => {
    const res = await fetch(`${BASE_URL}/api/generate/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "A one-page site for a coffee shop called Bean There in Wellington",
        tier: "standard",
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/event-stream")) {
      throw new Error(`Expected SSE, got: ${contentType}`);
    }

    // Read the stream and accumulate
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");
    const decoder = new TextDecoder();
    let accumulated = "";
    let gotDone = false;
    let gotReplace = false;

    const timeout = setTimeout(() => reader.cancel(), 180000);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "chunk") accumulated += event.content;
            if (event.type === "replace") { accumulated = event.content; gotReplace = true; }
            if (event.type === "done") gotDone = true;
          } catch { /* skip malformed */ }
        }
      }
    } finally {
      clearTimeout(timeout);
    }

    if (!gotDone) throw new Error("Never received 'done' event");
    if (!accumulated) throw new Error("No HTML accumulated from stream");

    // Clean
    let html = accumulated.trim()
      .replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    const ds = html.search(/<!doctype\s+html|<html/i);
    if (ds > 0) html = html.slice(ds);
    const he = html.lastIndexOf("</html>");
    if (he !== -1) html = html.slice(0, he + "</html>".length);

    assertHtmlStructure(html);
    assertBodyContent(html, 200);
  });

  await test("Edit existing site", async () => {
    // First generate a simple site
    const genData = await fetchJson("/api/generate", {
      prompt: "A bakery called Sweet Rise in Christchurch",
      tier: "standard",
    });
    if (!genData.html) throw new Error("Initial generation failed");

    // Now edit it
    const editData = await fetchJson("/api/generate", {
      prompt: "Change the primary color to green and add a new 'Our Story' section",
      tier: "standard",
      existingCode: genData.html,
    });
    if (!editData.html) throw new Error("Edit returned no HTML");
    assertHtmlStructure(editData.html);
    assertBodyContent(editData.html, 200);
  });

  // ── Summary ──
  console.log("\n" + "═".repeat(50));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n  ${passed}/${total} passed, ${failed} failed (${(totalTime / 1000).toFixed(1)}s total)\n`);

  if (failed > 0) {
    console.log("  Failed tests:");
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`    ✗ ${r.name}: ${r.error}`);
    }
    console.log("");
    process.exit(1);
  } else {
    console.log("  All critical flows working! ✓\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Health check crashed:", err);
  process.exit(1);
});
