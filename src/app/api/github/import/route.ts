import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

interface GitHubTreeItem {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

interface GitHubTreeResponse {
  sha: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

const PRIORITY_FILES = [
  "index.html",
  "package.json",
  "README.md",
  "readme.md",
];

const PRIORITY_EXTENSIONS = [
  ".html",
  ".htm",
  ".css",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".svg",
];

const PRIORITY_DIRS = ["src/", "app/", "pages/", "components/", "styles/", "public/"];

const MAX_FILES = 20;
const MAX_FILE_SIZE = 100_000; // 100KB per file

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Remove trailing slashes and .git suffix
  const cleaned = url.trim().replace(/\/+$/, "").replace(/\.git$/, "");

  // Match patterns:
  // https://github.com/user/repo
  // github.com/user/repo
  // http://github.com/user/repo
  const match = cleaned.match(
    /^(?:https?:\/\/)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/
  );

  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

function scoreFile(path: string): number {
  let score = 0;
  const lower = path.toLowerCase();
  const filename = lower.split("/").pop() || "";

  // Prioritize known important files
  if (PRIORITY_FILES.some((f) => lower.endsWith(f))) score += 100;

  // Prioritize files in key directories
  if (PRIORITY_DIRS.some((d) => lower.startsWith(d))) score += 50;

  // Prioritize by extension
  const ext = "." + filename.split(".").pop();
  const extIndex = PRIORITY_EXTENSIONS.indexOf(ext);
  if (extIndex !== -1) score += 40 - extIndex * 3;

  // Prefer shallower files
  const depth = path.split("/").length;
  score -= depth * 2;

  // Deprioritize test files, configs, and lock files
  if (lower.includes("test") || lower.includes("spec")) score -= 30;
  if (lower.includes("node_modules")) score -= 200;
  if (lower.includes(".lock") || lower.includes("lock.")) score -= 50;
  if (lower.includes(".min.")) score -= 20;
  if (lower.endsWith(".map")) score -= 50;
  if (lower.startsWith(".")) score -= 20;

  return score;
}

async function fetchGitHubAPI(url: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Zoobicon-Import",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, { headers });
}

async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<string | null> {
  try {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Zoobicon-Import" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length > MAX_FILE_SIZE) {
      return text.slice(0, MAX_FILE_SIZE) + "\n... (truncated)";
    }
    return text;
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `You are Zoobicon, an elite AI website modernizer. You analyze existing codebases and produce a single, complete, modern HTML file that preserves the original functionality and content while dramatically improving the design and code quality.

Rules:
- Output ONLY the HTML. No markdown, no explanation, no code fences.
- The HTML must be a complete document with <!DOCTYPE html>, <html>, <head>, and <body>.
- Include all CSS inline in a <style> tag in the <head>. Do NOT use external stylesheets (except Google Fonts).
- Include any JavaScript inline in a <script> tag before </body>.
- Use modern CSS (flexbox, grid, custom properties, gradients, animations).
- Make the design visually stunning, polished, and professional.
- The page must be fully responsive and work on mobile.
- Use Google Fonts via @import if typography is needed.
- Add subtle animations and micro-interactions where appropriate.
- Preserve the original project's core functionality, content, and purpose.
- Modernize outdated patterns (jQuery -> vanilla JS, old CSS -> modern CSS, etc.).
- If the original uses a framework (React, Vue, etc.), convert the key UI to a standalone HTML page.
- If images are needed, use placeholder services like https://picsum.photos or solid color blocks.
- The page should feel complete and production-ready.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoUrl, branch = "main" } = body;

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { error: "A GitHub repository URL is required" },
        { status: 400 }
      );
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub URL. Use format: github.com/user/repo or https://github.com/user/repo",
        },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // Fetch the repository tree
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const treeRes = await fetchGitHubAPI(treeUrl);

    if (treeRes.status === 404) {
      return NextResponse.json(
        {
          error: `Repository not found: ${owner}/${repo}. Make sure it exists and is public.`,
        },
        { status: 404 }
      );
    }

    if (treeRes.status === 403) {
      const remaining = treeRes.headers.get("x-ratelimit-remaining");
      if (remaining === "0") {
        const resetTime = treeRes.headers.get("x-ratelimit-reset");
        const resetDate = resetTime
          ? new Date(parseInt(resetTime) * 1000).toISOString()
          : "soon";
        return NextResponse.json(
          {
            error: `GitHub API rate limit exceeded. Resets at ${resetDate}. Try again later.`,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Access denied. The repository may be private." },
        { status: 403 }
      );
    }

    if (!treeRes.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${treeRes.status} ${treeRes.statusText}` },
        { status: 502 }
      );
    }

    const treeData: GitHubTreeResponse = await treeRes.json();

    // Filter to only blobs (files), score and sort them
    const files = treeData.tree
      .filter((item) => item.type === "blob")
      .filter((item) => !item.path.includes("node_modules"))
      .filter((item) => {
        const ext = item.path.split(".").pop()?.toLowerCase();
        const validExts = [
          "html",
          "htm",
          "css",
          "js",
          "ts",
          "tsx",
          "jsx",
          "json",
          "md",
          "svg",
          "vue",
          "svelte",
        ];
        return validExts.includes(ext || "");
      })
      .map((item) => ({ ...item, score: scoreFile(item.path) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_FILES);

    if (files.length === 0) {
      return NextResponse.json(
        {
          error:
            "No supported files found in this repository. Make sure it contains HTML, CSS, JS, or TS files.",
        },
        { status: 400 }
      );
    }

    // Download file contents in parallel
    const fileContents = await Promise.all(
      files.map(async (file) => {
        const content = await fetchFileContent(owner, repo, file.path, branch);
        return { path: file.path, content };
      })
    );

    const successfulFiles = fileContents.filter((f) => f.content !== null);

    // Detect technologies
    const technologies = detectTechnologies(successfulFiles);

    // Build the prompt for Claude
    const filesSection = successfulFiles
      .map((f) => `--- ${f.path} ---\n${f.content}`)
      .join("\n\n");

    const userPrompt = `Analyze this GitHub repository (${owner}/${repo}) and create a modernized, single-page HTML version that preserves its functionality and content.

Repository files:

${filesSection}

Create a stunning, modern single-page HTML version of this project. Preserve the original purpose, content, and key functionality while dramatically improving the design, code quality, and user experience.`;

    // Call Claude AI
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response generated from AI" },
        { status: 500 }
      );
    }

    let html = textBlock.text.trim();

    // Strip markdown code fences if present
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    // Generate suggestions based on analysis
    const suggestions = generateSuggestions(successfulFiles, technologies);

    return NextResponse.json({
      html,
      analysis: {
        files_analyzed: successfulFiles.length,
        technologies,
        suggestions,
      },
    });
  } catch (err) {
    console.error("GitHub import error:", err);

    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI API error: ${err.message}` },
        { status: err.status || 500 }
      );
    }

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function detectTechnologies(
  files: { path: string; content: string | null }[]
): string[] {
  const techs = new Set<string>();
  const allContent = files.map((f) => f.content || "").join("\n");
  const allPaths = files.map((f) => f.path).join("\n");

  if (allPaths.includes(".tsx") || allPaths.includes(".jsx"))
    techs.add("React");
  if (allContent.includes("vue") || allPaths.includes(".vue"))
    techs.add("Vue");
  if (allPaths.includes(".svelte")) techs.add("Svelte");
  if (allContent.includes("angular")) techs.add("Angular");
  if (allContent.includes("next") || allContent.includes("Next"))
    techs.add("Next.js");
  if (allPaths.includes(".ts") || allPaths.includes(".tsx"))
    techs.add("TypeScript");
  if (allContent.includes("tailwind")) techs.add("Tailwind CSS");
  if (allContent.includes("bootstrap")) techs.add("Bootstrap");
  if (allContent.includes("jquery") || allContent.includes("jQuery"))
    techs.add("jQuery");
  if (allContent.includes("express")) techs.add("Express");
  if (allPaths.includes(".html")) techs.add("HTML");
  if (allPaths.includes(".css")) techs.add("CSS");
  if (allPaths.includes(".js")) techs.add("JavaScript");

  return Array.from(techs);
}

function generateSuggestions(
  files: { path: string; content: string | null }[],
  technologies: string[]
): string[] {
  const suggestions: string[] = [];
  const allContent = files.map((f) => f.content || "").join("\n");

  if (technologies.includes("jQuery")) {
    suggestions.push(
      "Replace jQuery with modern vanilla JavaScript for better performance"
    );
  }

  if (!allContent.includes("@media") && !allContent.includes("tailwind")) {
    suggestions.push("Add responsive design with media queries or a utility framework");
  }

  if (!allContent.includes("aria-") && !allContent.includes("role=")) {
    suggestions.push("Improve accessibility with ARIA attributes and semantic HTML");
  }

  if (allContent.includes("<table") && allContent.includes("<td")) {
    suggestions.push("Replace table-based layouts with modern CSS Grid or Flexbox");
  }

  if (!allContent.includes("prefers-color-scheme") && !allContent.includes("dark")) {
    suggestions.push("Add dark mode support with prefers-color-scheme");
  }

  if (!allContent.includes("<meta name=\"viewport\"")) {
    suggestions.push("Add viewport meta tag for mobile responsiveness");
  }

  if (allContent.includes("var ") && !allContent.includes("const ") && !allContent.includes("let ")) {
    suggestions.push("Modernize JavaScript: use const/let instead of var");
  }

  if (!allContent.includes("loading=\"lazy\"")) {
    suggestions.push("Add lazy loading for images to improve performance");
  }

  return suggestions;
}
