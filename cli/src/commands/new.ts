import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { streamGenerate } from "../lib/api.js";
import { success, fail, info, spinner, c, header } from "../lib/ui.js";

interface NewOptions {
  out?: string;       // directory to write into
  force?: boolean;    // overwrite existing files
  plan?: boolean;     // print the planner output then exit (no generation)
}

interface FilesEvent { files?: Record<string, string>; fileCount?: number; totalComponents?: number }
interface PhaseEvent { phase?: string; message?: string }

export async function newCommand(prompt: string, opts: NewOptions): Promise<void> {
  if (!prompt || prompt.trim().length < 3) {
    fail("Please provide a prompt: zoobicon new \"AI email client for legal teams\"");
    process.exit(1);
  }

  const outDir = resolve(opts.out || `./zoobicon-${slugify(prompt).slice(0, 20)}`);
  if (existsSync(outDir) && !opts.force) {
    fail(`Output directory exists: ${outDir}`);
    info(`Pass --force to overwrite, or --out <path> to choose another directory.`);
    process.exit(1);
  }

  header(`Generating: "${prompt}"`);
  info(c.gray(`→ ${outDir}`));

  let lastFiles: Record<string, string> = {};
  let totalComponents = 0;
  let completed = 0;
  const stop = spinner("Planning components…");

  try {
    await streamGenerate(prompt, (type, data) => {
      if (type === "phase") {
        const msg = (data as PhaseEvent).message || (data as PhaseEvent).phase || "";
        if (msg) {
          stop();
          info(msg);
        }
      } else if (type === "files") {
        const evt = data as FilesEvent;
        if (evt.files) lastFiles = evt.files;
        if (evt.fileCount != null) completed = evt.fileCount;
        if (evt.totalComponents != null) totalComponents = evt.totalComponents;
      } else if (type === "error") {
        stop();
        const detail = typeof data === "string" ? data : JSON.stringify(data);
        throw new Error(`Generation failed: ${detail}`);
      }
    });
  } catch (err) {
    stop();
    fail(err instanceof Error ? err.message : "Generation failed.");
    process.exit(1);
  }
  stop();

  if (Object.keys(lastFiles).length === 0) {
    fail("No files received from the generator. Try again or check your network.");
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });
  for (const [path, contents] of Object.entries(lastFiles)) {
    const full = join(outDir, path);
    await mkdir(join(full, ".."), { recursive: true });
    await writeFile(full, contents, "utf8");
  }

  success(`Wrote ${Object.keys(lastFiles).length} files to ${c.bold(outDir)}.`);
  info(`Components rendered: ${completed}/${totalComponents || "?"}`);
  info(`Next: ${c.cyan(`cd ${outDir} && zoobicon deploy`)} to publish on zoobicon.sh.`);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
