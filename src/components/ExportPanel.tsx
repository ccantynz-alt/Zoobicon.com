"use client";

import { useState, useMemo } from "react";
import { Download, Loader2, FileCode, FolderOpen } from "lucide-react";
import { transpileHtmlToReact, buildReactProjectFiles } from "@/lib/html-to-react";

interface ExportResult {
  files: Record<string, string>;
  projectName: string;
}

export default function ExportPanel({ code, reactSource }: { code: string; reactSource?: Record<string, string> | null }) {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<"static" | "nextjs" | "react">("static");
  const [projectName, setProjectName] = useState("my-zoobicon-site");

  // Check if user has a paid plan
  const isPaidUser = (() => {
    try {
      const user = localStorage.getItem("zoobicon_user");
      if (!user) return false;
      const parsed = JSON.parse(user);
      return parsed.plan === "unlimited" || parsed.plan === "pro" || parsed.plan === "premium" || parsed.role === "admin";
    } catch { return false; }
  })();

  const hasReact = reactSource && Object.keys(reactSource).length >= 3;

  // Auto-transpile HTML to React when no pre-decomposed source is available
  const autoTranspiled = useMemo(() => {
    if (hasReact || !code) return null;
    try {
      return transpileHtmlToReact(code, projectName);
    } catch {
      return null;
    }
  }, [code, projectName, hasReact]);

  const canExportReact = hasReact || !!autoTranspiled;

  const downloadFiles = async (files: Record<string, string>) => {
    for (const [path, content] of Object.entries(files)) {
      const fileBlob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = path.replace(/\//g, "_");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      await new Promise((r) => setTimeout(r, 200));
    }
  };

  const buildReactProject = (name: string, components: Record<string, string>): Record<string, string> => {
    const files: Record<string, string> = {};

    files["package.json"] = JSON.stringify({
      name,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: {
        next: "^14.2.0",
        react: "^18.3.0",
        "react-dom": "^18.3.0",
        "class-variance-authority": "^0.7.0",
        clsx: "^2.1.0",
        "tailwind-merge": "^2.2.0",
        "lucide-react": "^0.400.0",
      },
      devDependencies: {
        typescript: "^5.4.0",
        "@types/node": "^20.0.0",
        "@types/react": "^18.3.0",
        "@types/react-dom": "^18.3.0",
        tailwindcss: "^3.4.0",
        postcss: "^8.4.0",
        autoprefixer: "^10.4.0",
      },
    }, null, 2);

    files["tsconfig.json"] = JSON.stringify({
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./src/*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    }, null, 2);

    files["next.config.js"] = `/** @type {import('next').NextConfig} */\nconst nextConfig = {};\nmodule.exports = nextConfig;\n`;

    files["tailwind.config.ts"] = `import type { Config } from "tailwindcss";\n\nconst config: Config = {\n  content: ["./src/**/*.{ts,tsx}"],\n  theme: { extend: {} },\n  plugins: [],\n};\nexport default config;\n`;

    files["postcss.config.js"] = `module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n`;

    files[".gitignore"] = "node_modules/\n.next/\nout/\n.env*.local\n";

    files["src/app/globals.css"] = "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n";

    files["src/app/layout.tsx"] = `import type { Metadata } from "next";\nimport "./globals.css";\n\nexport const metadata: Metadata = {\n  title: "${name}",\n  description: "Built with Zoobicon",\n};\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}\n`;

    files["src/lib/utils.ts"] = `import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n`;

    // Add all decomposed components
    for (const [filename, source] of Object.entries(components)) {
      const path = filename.startsWith("src/") ? filename : `src/components/${filename}`;
      files[path] = source;
    }

    return files;
  };

  const handleExport = async () => {
    if (!code) return;
    if (!isPaidUser) return; // Guard rail: free tier cannot export
    setLoading(true);
    try {
      // React export: use pre-decomposed components or auto-transpile
      if (exportType === "react") {
        if (reactSource && Object.keys(reactSource).length > 0) {
          const files = buildReactProject(projectName, reactSource);
          await downloadFiles(files);
          return;
        }
        if (autoTranspiled) {
          const files = buildReactProjectFiles(autoTranspiled, projectName);
          await downloadFiles(files);
          return;
        }
      }

      const res = await fetch("/api/export/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: code, name: projectName, type: exportType }),
      });

      if (!res.ok) return;

      const data: ExportResult = await res.json();

      await downloadFiles(data.files);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // Free tier guard rail: show upgrade prompt
  if (!isPaidUser) {
    return (
      <div className="p-4 space-y-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-brand-500/10 to-purple-500/10 border border-brand-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Download size={18} className="text-brand-400" />
            <h3 className="text-sm font-semibold text-white">Export Your Site</h3>
          </div>
          <p className="text-xs text-white/50 leading-relaxed mb-4">
            Your site is live for 7 days on free hosting. Upgrade to export as a clean project and keep it hosted permanently — ready for GitHub, Vercel, Netlify, or any hosting platform.
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="w-1 h-1 rounded-full bg-brand-400" /> Static HTML export
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="w-1 h-1 rounded-full bg-brand-400" /> Next.js project scaffold
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="w-1 h-1 rounded-full bg-purple-400" /> React + shadcn/ui components
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="w-1 h-1 rounded-full bg-brand-400" /> GitHub-ready with configs
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="w-1 h-1 rounded-full bg-brand-400" /> Unlimited exports
            </div>
          </div>
          <a
            href="/pricing"
            className="block w-full py-2.5 rounded-lg text-sm font-medium text-center bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors"
          >
            Upgrade to Export
          </a>
        </div>
        <p className="text-[10px] text-white/20 text-center">
          Free sites are hosted for 7 days. Upgrade to keep them permanently.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-white/40">
        Export your site as a clean, professional project ready for GitHub or any hosting platform.
      </p>

      <div>
        <label className="text-xs text-white/50 block mb-1.5">Project Name</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value.replace(/[^a-z0-9-]/g, ""))}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/50"
          placeholder="my-site"
        />
      </div>

      <div>
        <label className="text-xs text-white/50 block mb-1.5">Export Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => setExportType("static")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${
              exportType === "static"
                ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                : "bg-white/5 text-white/50 border border-white/10 hover:text-white/70"
            }`}
          >
            <FileCode size={14} />
            Static HTML
          </button>
          <button
            onClick={() => setExportType("nextjs")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${
              exportType === "nextjs"
                ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                : "bg-white/5 text-white/50 border border-white/10 hover:text-white/70"
            }`}
          >
            <FolderOpen size={14} />
            Next.js
          </button>
          <button
            onClick={() => setExportType("react")}
            disabled={!canExportReact}
            title={canExportReact ? "Export as React + Next.js components" : "Generate a site first to export as React"}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${
              exportType === "react"
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                : canExportReact
                  ? "bg-white/5 text-white/50 border border-white/10 hover:text-white/70"
                  : "bg-white/5 text-white/20 border border-white/10 cursor-not-allowed"
            }`}
          >
            <FileCode size={14} />
            React
          </button>
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={!code || loading}
        className="w-full py-2.5 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors disabled:opacity-40"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Exporting...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Download size={16} /> Export Project
          </span>
        )}
      </button>

      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="text-xs text-white/40 mb-2">Included files:</div>
        {exportType === "static" ? (
          <div className="text-xs text-white/60 space-y-0.5 font-mono">
            <div>index.html</div>
            <div>package.json</div>
            <div>README.md</div>
            <div>.gitignore</div>
            <div>vercel.json</div>
            <div>netlify.toml</div>
          </div>
        ) : exportType === "nextjs" ? (
          <div className="text-xs text-white/60 space-y-0.5 font-mono">
            <div>src/app/page.tsx</div>
            <div>src/app/layout.tsx</div>
            <div>src/app/globals.css</div>
            <div>package.json</div>
            <div>next.config.js</div>
            <div>tailwind.config.ts</div>
            <div>tsconfig.json</div>
            <div>.gitignore</div>
          </div>
        ) : (
          <div className="text-xs text-white/60 space-y-0.5 font-mono">
            <div>src/app/page.tsx</div>
            <div>src/app/layout.tsx</div>
            <div>src/app/globals.css</div>
            {hasReact && Object.keys(reactSource!).map((f) => (
              <div key={f}>{f.startsWith("src/") ? f : `src/components/${f}`}</div>
            ))}
            {!hasReact && autoTranspiled && autoTranspiled.components.map((c) => (
              <div key={c.filename}>src/components/{c.filename}</div>
            ))}
            <div>package.json</div>
            <div>tailwind.config.ts</div>
            <div>tsconfig.json</div>
          </div>
        )}
      </div>
    </div>
  );
}
