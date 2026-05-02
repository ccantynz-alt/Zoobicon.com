import { readFile, readdir } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { api } from "../lib/api.js";
import { requireApiKey } from "../lib/auth.js";
import { success, fail, info, spinner, c, header } from "../lib/ui.js";

interface DeployOptions {
  slug?: string;
  name?: string;
}

interface DeployResponse {
  url?: string;
  slug?: string;
  siteId?: string;
  ok?: boolean;
  error?: string;
}

/**
 * Walk a directory and collect all source files relative to the root.
 * Skips node_modules, dist, .git — anything obvious that shouldn't ship.
 */
async function collectFiles(root: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const skip = new Set(["node_modules", ".git", "dist", "build", ".next", ".vercel"]);

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir);
    for (const name of entries) {
      if (skip.has(name) || name.startsWith(".env")) continue;
      const full = join(dir, name);
      const s = statSync(full);
      if (s.isDirectory()) {
        await walk(full);
      } else if (s.isFile()) {
        // Cap individual files at 1MB so a stray binary doesn't blow up
        // the deploy payload.
        if (s.size > 1024 * 1024) continue;
        const rel = relative(root, full).split(/[\\/]/).join("/");
        out[rel] = await readFile(full, "utf8");
      }
    }
  }

  await walk(root);
  return out;
}

export async function deployCommand(path: string | undefined, opts: DeployOptions): Promise<void> {
  requireApiKey(); // bail early with a clear message if not logged in

  const dir = resolve(path || ".");
  if (!existsSync(dir)) {
    fail(`Directory not found: ${dir}`);
    process.exit(1);
  }

  header(`Deploying ${dir}`);
  const stop = spinner("Collecting files…");

  let files: Record<string, string>;
  try {
    files = await collectFiles(dir);
  } catch (err) {
    stop();
    fail(err instanceof Error ? err.message : "Failed to read directory.");
    process.exit(1);
  }

  const fileCount = Object.keys(files).length;
  if (fileCount === 0) {
    stop();
    fail("No deployable files found in that directory.");
    process.exit(1);
  }

  stop();
  info(`Collected ${fileCount} files (${formatBytes(totalSize(files))}).`);

  const stop2 = spinner("Uploading to zoobicon.sh…");
  let result: DeployResponse;
  try {
    result = await api<DeployResponse>("/api/v1/deploy", {
      method: "POST",
      body: {
        files,
        slug: opts.slug,
        name: opts.name,
      },
      timeoutMs: 90000,
    });
  } catch (err) {
    stop2();
    fail(err instanceof Error ? err.message : "Deploy failed.");
    process.exit(1);
  }
  stop2();

  if (!result.url) {
    fail(result.error || "Deploy returned no URL.");
    process.exit(1);
  }

  success(`Deployed: ${c.bold().cyan(result.url)}`);
  if (result.slug) info(c.gray(`slug: ${result.slug}`));
  if (result.siteId) info(c.gray(`siteId: ${result.siteId}`));
}

function totalSize(files: Record<string, string>): number {
  let n = 0;
  for (const v of Object.values(files)) n += Buffer.byteLength(v, "utf8");
  return n;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / 1024 / 1024).toFixed(2)}MB`;
}
