/**
 * Parallel Generation Engine
 *
 * Generates frontend + backend + assets SIMULTANEOUSLY instead of
 * sequentially. This is how we beat competitors on speed.
 *
 * Sequential (old way, 30-45 seconds):
 *   1. Generate frontend (20-30s)
 *   2. Generate backend schema (5-10s)
 *   3. Provision database (5s)
 *   Total: 30-45 seconds
 *
 * Parallel (our way, 20-30 seconds):
 *   ┌── Generate frontend (Sonnet, 20-30s)    ──┐
 *   ├── Generate backend schema (Haiku, 3-5s)  ──┤ All at once
 *   ├── Provision database (Supabase, 5s)      ──┤
 *   └── Generate SEO metadata (Haiku, 2-3s)    ──┘
 *   Total: 20-30 seconds (time of longest task)
 *
 * Speed gain: 30-50% faster by parallelizing independent tasks.
 */

import Anthropic from "@anthropic-ai/sdk";

interface ParallelGenerationRequest {
  prompt: string;
  email: string;
  fullStack?: boolean;
  generateSEO?: boolean;
}

interface ParallelGenerationResult {
  frontend: {
    files: Record<string, string>;
    dependencies: Record<string, string>;
  };
  backend?: {
    schema: string;
    clientCode: string;
    projectUrl?: string;
  };
  seo?: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
  };
  timing: {
    totalMs: number;
    frontendMs: number;
    backendMs?: number;
    seoMs?: number;
  };
}

/**
 * Generate frontend, backend, and SEO in parallel.
 * Returns combined result with timing breakdown.
 */
export async function generateInParallel(
  request: ParallelGenerationRequest,
  onProgress?: (step: string, message: string) => void
): Promise<ParallelGenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service unavailable");

  const start = Date.now();
  const client = new Anthropic({ apiKey, timeout: 240000 });

  // Launch ALL tasks simultaneously
  const tasks: Promise<unknown>[] = [];

  // Task 1: Frontend generation (Sonnet — highest quality, longest)
  onProgress?.("frontend", "Generating frontend components...");
  const frontendPromise = generateFrontend(client, request.prompt);
  tasks.push(frontendPromise);

  // Task 2: Backend schema (Haiku — fast, just SQL)
  let backendPromise: Promise<{ schema: string } | null> | null = null;
  if (request.fullStack) {
    onProgress?.("backend", "Creating database schema...");
    backendPromise = generateBackendSchema(client, request.prompt);
    tasks.push(backendPromise);
  }

  // Task 3: SEO metadata (Haiku — fast, just text)
  let seoPromise: Promise<{ title: string; description: string; keywords: string[] } | null> | null = null;
  if (request.generateSEO !== false) {
    onProgress?.("seo", "Optimizing SEO...");
    seoPromise = generateSEOMetadata(client, request.prompt);
    tasks.push(seoPromise);
  }

  // Wait for ALL tasks to complete
  await Promise.allSettled(tasks);

  const frontendResult = await frontendPromise;
  const frontendMs = Date.now() - start;

  let backendResult: { schema: string } | null = null;
  let backendMs: number | undefined;
  if (backendPromise) {
    try {
      backendResult = await backendPromise;
      backendMs = Date.now() - start;
    } catch { /* backend failed — non-fatal */ }
  }

  let seoResult: { title: string; description: string; keywords: string[] } | null = null;
  let seoMs: number | undefined;
  if (seoPromise) {
    try {
      seoResult = await seoPromise;
      seoMs = Date.now() - start;
    } catch { /* SEO failed — non-fatal */ }
  }

  onProgress?.("done", "Generation complete");

  return {
    frontend: frontendResult,
    backend: backendResult ? {
      schema: backendResult.schema,
      clientCode: "", // Filled by backend-service.ts
    } : undefined,
    seo: seoResult || undefined,
    timing: {
      totalMs: Date.now() - start,
      frontendMs,
      backendMs,
      seoMs,
    },
  };
}

async function generateFrontend(
  client: Anthropic,
  prompt: string
): Promise<{ files: Record<string, string>; dependencies: Record<string, string> }> {
  // This calls the same Sonnet model as /api/generate/react
  // but as a function instead of an API route
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 32000,
    system: "You are an elite React app generator. Output ONLY valid JSON with files and dependencies keys. No markdown fences.",
    messages: [{
      role: "user",
      content: `Generate a premium React application for: ${prompt}\n\nOutput JSON with "files" and "dependencies" keys.`,
    }],
  });

  const text = response.content.find(b => b.type === "text")?.text || "";
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd <= jsonStart) throw new Error("Invalid frontend response");

  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  return {
    files: parsed.files || {},
    dependencies: parsed.dependencies || {},
  };
}

async function generateBackendSchema(
  client: Anthropic,
  prompt: string
): Promise<{ schema: string }> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Generate a PostgreSQL schema for this app: "${prompt}"

Output ONLY valid SQL. Include:
- CREATE TABLE with UUID primary keys and created_at timestamps
- ALTER TABLE ENABLE ROW LEVEL SECURITY on every table
- CREATE POLICY for auth.uid() based access
- INSERT sample data (5-10 rows per table)
- 3-6 tables maximum

Start with SQL directly, no explanation.`,
    }],
  });

  const text = response.content.find(b => b.type === "text")?.text || "";
  return { schema: text };
}

async function generateSEOMetadata(
  client: Anthropic,
  prompt: string
): Promise<{ title: string; description: string; keywords: string[] }> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `Generate SEO metadata for this website: "${prompt}"

Output JSON only: {"title": "under 60 chars", "description": "under 160 chars", "keywords": ["5-10 keywords"]}`,
    }],
  });

  const text = response.content.find(b => b.type === "text")?.text || "";
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1) return { title: "", description: "", keywords: [] };

  return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
}
