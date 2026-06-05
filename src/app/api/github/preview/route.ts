/**
 * POST /api/github/preview — fetch a GitHub repo's marketing-relevant
 * context (README + package.json + repo info + file tree) and compose
 * a builder prompt for a landing page.
 *
 * Body: { url }
 * Returns: { ok, repo, prompt, builderHref }
 *
 * Distinct from /api/github/import which does full HTML generation.
 * This route is lighter: pulls context, composes a prompt, lets the
 * regular builder generation pipeline run on it. Result: a
 * landing page built with the same six-agent contract + slot
 * registry + post-generation critique as any other build.
 */

import { NextResponse } from "next/server";
import { fetchGitHubContext } from "@/lib/mcp-context";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body. Expected { url: string }" },
      { status: 400 }
    );
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ ok: false, error: "url required" }, { status: 400 });
  }

  try {
    const ctx = await fetchGitHubContext(url);
    const repoName = ctx.source.name; // "owner/repo"
    const contentSummary = ctx.content || "";

    // Pull the project tagline out of the README's first non-empty line.
    const readmeMatch = contentSummary.match(/## README\.md\s*\n([\s\S]*?)(?=\n---|$)/);
    const readmeBody = (readmeMatch?.[1] || "").trim();
    const projectTagline =
      readmeBody.split("\n").find((l) => l.trim().length > 0 && !l.startsWith("#")) || "";

    // Compose builder prompt — same shape as composeBuilderPrompt in
    // url-extractor + wordpress-import for planner consistency.
    const parts: string[] = [
      `Build a modern 2026 landing page for the open-source project "${repoName}" on GitHub.`,
    ];
    if (projectTagline) {
      parts.push(`Project tagline / first README line: "${projectTagline.slice(0, 200)}".`);
    }
    parts.push(
      "Include sections: hero with project name + tagline + GitHub-style stats, features (extract from README), installation snippet (syntax-highlighted, copyable), screenshot/demo placeholder, contributors / star count, FAQ. The landing should make a developer want to clone the repo within 10 seconds of landing on the page."
    );
    parts.push(
      "Modernize: 2026 design patterns (bento grids, syntax-highlighted code blocks, dark/light toggle), mobile-first responsive, semantic HTML, JSON-LD SoftwareApplication schema, sub-second LCP. Hosting + custom domain via Crontech."
    );

    const prompt = parts.join(" ");

    return NextResponse.json({
      ok: true,
      repo: {
        name: repoName,
        url,
        tagline: projectTagline.slice(0, 200),
        contextBytes: contentSummary.length,
      },
      prompt,
      builderHref: `/builder?prompt=${encodeURIComponent(prompt)}&from=github`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "GitHub preview failed",
      },
      { status: 502 }
    );
  }
}
