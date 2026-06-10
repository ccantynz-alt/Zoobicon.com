/**
 * POST /api/generate/site-build
 *
 * Phase 2 of Full-Site Mode. Consumes an approved SitePlan from
 * /api/generate/site-plan and orchestrates a parallel multi-page build:
 *
 *   1. Customise shared navbar + footer ONCE.
 *   2. For each page in the plan (parallel, 2 wide), resolve each
 *      section's registry component and customise its copy.
 *   3. Merge all per-page file trees + shared chrome + router into a
 *      single React file map.
 *   4. Stream SSE progress so the UI can show per-page status.
 *
 * Body:   { plan: SitePlan }
 * Stream: data: { type, ... }
 *   - phase    { phase: "shared"|"pages"|"merging"|"done", message }
 *   - page     { slug, name, status: "queued"|"building"|"done"|"failed" }
 *   - section  { pageSlug, category, ok }
 *   - files    { files }              (progressive — each page on completion)
 *   - done     { files, dependencies, durationMs, pageCount, failedSections }
 *   - error    { message, hint, fatal }
 *
 * Output file structure:
 *   /package.json
 *   /tailwind.config.js
 *   /styles.css
 *   /App.tsx                              (HashRouter, routes per plan page)
 *   /components/SharedNavbar.tsx
 *   /components/SharedFooter.tsx
 *   /pages/<PageName>/index.tsx           (stitches its sections)
 *   /pages/<PageName>/<SectionName>.tsx   (per-section component)
 *
 * Cost: ~$0.30 for a 6-page site (1 Haiku call per section + 2 shared).
 * Budget: maxDuration 300s. Pages run 2-wide so a 6-page site finishes
 * in ~3-4 minutes.
 */

import { NextRequest } from "next/server";
import type { SitePlan, SitePlanPage } from "@/lib/site-planner";
import {
  buildPage,
  buildSharedChrome,
  buildAppRouter,
} from "@/lib/page-builder";
import type { RegistryComponent } from "@/lib/component-registry/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PAGE_PARALLELISM = 2;

const GENERATED_SITE_DEPS: Record<string, string> = {
  react: "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.28.0",
  "lucide-react": "^1.7.0",
  "framer-motion": "^12.38.0",
  clsx: "^2.1.1",
  "tailwind-merge": "^2.5.5",
};

const GENERATED_SITE_DEV_DEPS: Record<string, string> = {
  "@types/react": "^18.3.12",
  "@types/react-dom": "^18.3.1",
  "@vitejs/plugin-react": "^4.3.4",
  autoprefixer: "^10.4.20",
  postcss: "^8.4.49",
  tailwindcss: "^3.4.16",
  typescript: "^5.6.3",
  vite: "^5.4.11",
};

function buildPackageJson(brandName: string): string {
  return JSON.stringify(
    {
      name: brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "zoobicon-site",
      version: "1.0.0",
      private: true,
      type: "module",
      scripts: {
        // Vapron's build pipeline runs `npm install && npm run build`
        // by default. Vite outputs a static SPA into ./dist that
        // Vapron can serve directly — no SSR config needed.
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
      },
      dependencies: GENERATED_SITE_DEPS,
      devDependencies: GENERATED_SITE_DEV_DEPS,
    },
    null,
    2,
  );
}

function buildViteConfig(): string {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
`;
}

function buildPostcssConfig(): string {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

function buildTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: false,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noFallthroughCasesInSwitch: true,
      },
      include: ["**/*.ts", "**/*.tsx"],
      exclude: ["node_modules", "dist"],
    },
    null,
    2,
  );
}

function buildIndexHtml(brandName: string): string {
  const safeName = brandName.replace(/[<>&"]/g, "");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
`;
}

/**
 * Client-side session module. Emitted into the generated site whenever
 * the plan flags backend.needsAuth=true. Wraps Vapron's session API
 * (POST /api/auth/login, /api/auth/logout, /api/auth/me) which is the
 * standard contract Vapron's hosting layer provides. Pages import:
 *
 *   import { useSession, signIn, signOut } from "./lib/session";
 *
 * Locally (dev / Sandpack preview) the endpoints don't exist — the
 * module degrades to a no-op so login pages render their forms
 * without runtime errors.
 */
function buildSessionModule(): string {
  return `import React, { createContext, useContext, useEffect, useState } from "react";

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface SessionState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
}

interface SessionContextValue extends SessionState {
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

async function fetchMe(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ user: null, loading: true, error: null });

  const refresh = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const user = await fetchMe();
    setState({ user, loading: false, error: null });
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <SessionContext.Provider value={{ ...state, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

export async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || "Sign in failed" };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function signUp(email: string, password: string, name?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || "Sign up failed" };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function signOut(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    /* no-op — session will be cleared on next refresh */
  }
}
`;
}

function buildTailwindConfig(): string {
  return `module.exports = {
  content: ["./**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
`;
}

function buildStylesFile(primaryColor: string): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: ${primaryColor};
}

html, body, #root { height: 100%; margin: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
`;
}

function buildIndexFile(): string {
  return `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
`;
}

interface SSEWriter {
  send: (event: string, data: Record<string, unknown>) => void;
  close: () => void;
}

function makeWriter(controller: ReadableStreamDefaultController<Uint8Array>): SSEWriter {
  const encoder = new TextEncoder();
  let closed = false;
  return {
    send: (type, data) => {
      if (closed) return;
      try {
        const payload = JSON.stringify({ type, ...data });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      } catch (err) {
        console.error("[site-build] writer.send failed:", err);
      }
    },
    close: () => {
      if (closed) return;
      closed = true;
      try { controller.close(); } catch { /* already closed */ }
    },
  };
}

/**
 * Resolve a registry component for a section. Tries the variantHint
 * first, then falls back to any component in the requested category.
 * Returns null if nothing matches (caller skips the section).
 */
async function resolveComponent(
  registry: typeof import("@/lib/component-registry"),
  section: SitePlanPage["sections"][number],
): Promise<RegistryComponent | null> {
  const all = registry.REGISTRY.filter((c) => c.category === section.category);
  if (all.length === 0) return null;
  if (section.variantHint) {
    const exact = all.find((c) => c.id === section.variantHint);
    if (exact) return exact;
  }
  // Deterministic fallback: pick the first variant in the category.
  // (Phase 3 can score by tags + brief similarity.)
  return all[0];
}

/**
 * Run N async tasks with a concurrency limit. Returns results in input
 * order. Errors don't abort the batch — each result captures its own
 * success/failure.
 */
async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

interface RequestBody {
  plan?: SitePlan;
}

export async function POST(req: NextRequest): Promise<Response> {
  const startedAt = Date.now();

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON. Expected { plan: SitePlan }" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const plan = body.plan;
  if (!plan || !plan.pages || plan.pages.length === 0) {
    return new Response(
      JSON.stringify({ error: "plan with at least one page is required" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writer = makeWriter(controller);
      const slugList = plan.pages.map((p) => p.slug);
      // Lazy-load registry to avoid TDZ at module init time (same pattern
      // as react-stream). MUST call ensureRegistryLoaded() — REGISTRY is
      // [] until the side-effect imports for navbars/heroes/etc. fire.
      const registry = await import("@/lib/component-registry");
      registry.ensureRegistryLoaded();

      try {
        // ── PHASE 1: shared chrome (navbar + footer) ──
        writer.send("phase", {
          phase: "shared",
          message: "Customising shared navbar + footer…",
        });

        // Resolve navbar + footer registry entries from the plan.
        const navbarReg = registry.REGISTRY.find((c) => c.id === plan.shared.navbarVariant)
          || registry.REGISTRY.find((c) => c.category === "navbar")
          || null;
        const footerReg = registry.REGISTRY.find((c) => c.id === plan.shared.footerVariant)
          || registry.REGISTRY.find((c) => c.category === "footer")
          || null;

        const wrapWithAuth = plan.backend.needsAuth;
        const sharedRes = await buildSharedChrome(plan.brand, navbarReg, footerReg, slugList, {
          authAvailable: wrapWithAuth,
        });
        const failedShared = sharedRes.failedNames.slice();

        // ── PHASE 2: pages, 2-wide parallel ──
        writer.send("phase", {
          phase: "pages",
          message: `Building ${plan.pages.length} pages (${PAGE_PARALLELISM}-wide parallel)…`,
        });
        for (const page of plan.pages) {
          writer.send("page", { slug: page.slug, name: page.name, status: "queued" });
        }

        const allPageFiles: Record<string, string> = {};
        const failedSections: string[] = [];

        // Resolve all per-section components up-front so the parallel
        // workers don't fight over the registry import promise.
        const resolvedPerPage: Array<RegistryComponent[]> = await Promise.all(
          plan.pages.map(async (page) =>
            Promise.all(page.sections.map((s) => resolveComponent(registry, s))).then(
              (arr) => arr.filter((c): c is RegistryComponent => Boolean(c)),
            ),
          ),
        );

        const pageRoutes: Array<{ slug: string; exportName: string; importPath: string }> = [];

        await runWithConcurrency(plan.pages, PAGE_PARALLELISM, async (page, idx) => {
          writer.send("page", { slug: page.slug, name: page.name, status: "building" });
          try {
            const result = await buildPage(
              {
                page,
                brand: plan.brand,
                components: resolvedPerPage[idx],
                authAvailable: wrapWithAuth,
              },
              {
                slugList,
                onSectionDone: (section, _i, ok) => {
                  writer.send("section", {
                    pageSlug: page.slug,
                    category: section.category,
                    ok,
                  });
                },
              },
            );
            Object.assign(allPageFiles, result.files);
            failedSections.push(...result.failedSections);
            pageRoutes[idx] = {
              slug: page.slug,
              exportName: result.pageExport,
              importPath: result.pageImport,
            };
            // Progressive emit: send the current file map so Sandpack
            // can re-render the homepage as soon as it's ready.
            writer.send("page", { slug: page.slug, name: page.name, status: "done" });
            writer.send("files", {
              files: {
                ...sharedRes.files,
                ...allPageFiles,
              },
              fileCount: Object.keys(allPageFiles).length + Object.keys(sharedRes.files).length,
              totalPages: plan.pages.length,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(`[site-build] page ${page.slug} failed:`, msg);
            writer.send("page", { slug: page.slug, name: page.name, status: "failed", error: msg.slice(0, 200) });
            failedSections.push(`${page.slug}::page-error: ${msg.slice(0, 80)}`);
          }
        });

        // ── PHASE 3: merge ──
        writer.send("phase", {
          phase: "merging",
          message: "Assembling project + router…",
        });

        // Drop holes in pageRoutes (failed pages) before wiring the
        // router so the App doesn't try to import a missing module.
        const validRoutes = pageRoutes.filter(Boolean);
        if (validRoutes.length === 0) {
          throw new Error("Every page in the plan failed to build. Try again or simplify the prompt.");
        }

        // Auth provider — when the plan flagged needsAuth, wrap the
        // router with a real session provider so login/signup pages
        // actually authenticate. We emit a small client module that
        // talks to Vapron's session endpoint via fetch (no SDK
        // dependency). Pages can import { useSession, signIn, signOut }
        // from "./lib/session".
        // wrapWithAuth is hoisted to the top of the route so the shared
        // chrome + per-page builds can pass it as authAvailable to the
        // customiser. Re-using it here to gate the auth helper module
        // + the SessionProvider wrap in App.tsx.
        const authFiles: Record<string, string> = {};
        if (wrapWithAuth) {
          authFiles["lib/session.tsx"] = buildSessionModule();
        }

        const appFile = buildAppRouter(validRoutes, plan.brand, {
          wrapWithAuth,
        });

        const finalFiles: Record<string, string> = {
          // Build pipeline scaffolding so Vapron can run
          // `npm install && npm run build` and serve ./dist.
          "package.json": buildPackageJson(plan.brand.name),
          "vite.config.ts": buildViteConfig(),
          "tsconfig.json": buildTsConfig(),
          "postcss.config.js": buildPostcssConfig(),
          "tailwind.config.js": buildTailwindConfig(),
          "index.html": buildIndexHtml(plan.brand.name),
          "styles.css": buildStylesFile(plan.brand.primaryColor),
          "index.tsx": buildIndexFile(),
          "App.tsx": appFile,
          ...authFiles,
          ...sharedRes.files,
          ...allPageFiles,
        };

        writer.send("phase", {
          phase: "done",
          message: "Build complete.",
        });

        writer.send("done", {
          files: finalFiles,
          dependencies: GENERATED_SITE_DEPS,
          durationMs: Date.now() - startedAt,
          pageCount: validRoutes.length,
          totalPages: plan.pages.length,
          failedSections,
          failedShared,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[site-build] fatal:", msg);
        writer.send("error", {
          message: msg,
          hint: "Try simplifying the prompt or running a single-page build instead.",
          fatal: true,
        });
      } finally {
        writer.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
