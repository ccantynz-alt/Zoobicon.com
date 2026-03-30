import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * GET /api/admin/tech-check
 *
 * Returns a real-time technology currency report.
 * Reads package.json, checks versions against latest known,
 * scans for outdated AI models, and returns a score.
 */

const LATEST: Record<string, { latest: string; critical: boolean; category: string }> = {
  "next": { latest: "16.2.1", critical: true, category: "Core Framework" },
  "react": { latest: "19.2.4", critical: true, category: "Core Framework" },
  "react-dom": { latest: "19.2.4", critical: true, category: "Core Framework" },
  "typescript": { latest: "6.0.2", critical: false, category: "Core Framework" },
  "tailwindcss": { latest: "4.2.2", critical: false, category: "Core Framework" },
  "@anthropic-ai/sdk": { latest: "0.80.0", critical: true, category: "AI" },
  "framer-motion": { latest: "12.38.0", critical: false, category: "UI" },
  "@codesandbox/sandpack-react": { latest: "2.20.0", critical: false, category: "UI" },
  "lucide-react": { latest: "1.7.0", critical: false, category: "UI" },
  "stripe": { latest: "21.0.1", critical: true, category: "Payments" },
  "@neondatabase/serverless": { latest: "1.0.2", critical: false, category: "Database" },
  "qrcode": { latest: "1.5.4", critical: false, category: "Utilities" },
};

const OLD_AI_MODELS = [
  "claude-3-opus", "claude-3-sonnet", "claude-3-haiku",
  "claude-3-5-sonnet", "claude-3-5-haiku",
  "gpt-4-turbo", "gpt-4-0613", "gpt-3.5",
  "gemini-1.5", "gemini-1.0",
];

export async function GET() {
  try {
    let score = 100;
    const deps: Array<{
      name: string;
      installed: string;
      latest: string;
      status: "current" | "patch" | "minor" | "major";
      critical: boolean;
      category: string;
    }> = [];

    // Read package.json
    let pkg: Record<string, Record<string, string>> = { dependencies: {}, devDependencies: {} };
    try {
      const pkgPath = path.resolve(process.cwd(), "package.json");
      const raw = fs.readFileSync(pkgPath, "utf-8");
      pkg = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Could not read package.json" }, { status: 500 });
    }

    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    for (const [name, info] of Object.entries(LATEST)) {
      const raw = allDeps[name];
      if (!raw) continue;
      const installed = String(raw).replace(/[\^~>=<\s]/g, "");
      const latest = info.latest;

      let status: "current" | "patch" | "minor" | "major" = "current";
      if (installed !== latest) {
        const [iMaj, iMin] = installed.split(".").map(Number);
        const [lMaj, lMin] = latest.split(".").map(Number);
        if (iMaj < lMaj) { status = "major"; score -= info.critical ? 15 : 5; }
        else if (iMin < lMin) { status = "minor"; score -= info.critical ? 5 : 2; }
        else { status = "patch"; score -= 1; }
      }

      deps.push({ name, installed, latest, status, critical: info.critical, category: info.category });
    }

    // Check for old AI models in key files
    const oldModelsFound: Array<{ file: string; model: string }> = [];
    const filesToScan = [
      "src/lib/agents.ts",
      "src/lib/llm-provider.ts",
      "src/app/api/generate/react/route.ts",
    ];

    for (const filePath of filesToScan) {
      try {
        const fullPath = path.resolve(process.cwd(), filePath);
        const content = fs.readFileSync(fullPath, "utf-8");
        for (const model of OLD_AI_MODELS) {
          if (content.includes(model)) {
            oldModelsFound.push({ file: filePath, model });
            score -= 20;
          }
        }
      } catch {
        // File doesn't exist or unreadable
      }
    }

    score = Math.max(0, Math.min(100, score));

    const current = deps.filter(d => d.status === "current").length;
    const outdated = deps.filter(d => d.status !== "current");
    const majorBehind = outdated.filter(d => d.status === "major");

    return NextResponse.json({
      score,
      status: score >= 90 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "needs-attention" : "critical",
      summary: `${current}/${deps.length} packages current. ${majorBehind.length} major versions behind. ${oldModelsFound.length} old AI models.`,
      dependencies: deps,
      oldAiModels: oldModelsFound,
      recommendations: [
        ...(majorBehind.length > 0 ? [`${majorBehind.length} packages have major updates: ${majorBehind.map(d => d.name).join(", ")}`] : []),
        ...(oldModelsFound.length > 0 ? ["Old AI models found — replace with latest generation"] : []),
        ...(score >= 90 ? ["Stack is current — no urgent action needed"] : []),
      ],
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[TechCheck] Error:", err);
    return NextResponse.json({ error: "Tech check failed" }, { status: 500 });
  }
}
