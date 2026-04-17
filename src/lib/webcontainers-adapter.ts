/**
 * WebContainers Adapter (StackBlitz)
 * =====================================================================
 *
 * WHAT THIS IS
 * ------------
 * A runtime switch between Sandpack (our current in-browser React preview)
 * and WebContainers (StackBlitz's full Node.js in the browser — what Bolt.new
 * uses to get 3-5 second first-preview times).
 *
 * WHY IT MATTERS
 * --------------
 * Sandpack bundles React in the browser but has NO Node.js — so generated
 * apps can't run `npm install`, can't run a real dev server, can't run
 * backend code. WebContainers runs a full Node.js + npm in a WASM VM inside
 * the browser tab. That's how Bolt runs full-stack apps without ever touching
 * a server. Match that and we match Bolt's speed.
 *
 * STATUS
 * ------
 * ADAPTER SCAFFOLD ONLY. WebContainers requires a commercial license from
 * StackBlitz for any production (non-open-source) use. Craig needs to:
 *   1. Sign up at https://webcontainers.io/enterprise
 *   2. Get a license key
 *   3. Set WEBCONTAINERS_LICENSE_KEY in Vercel
 *   4. Add @webcontainer/api to package.json
 *
 * Once those are done, uncomment the real implementation below and flip
 * `isWebContainersEnabled()` to return true.
 *
 * THE SPEED MATH
 * --------------
 * - Sandpack first preview: 20-30s cold (bundler + transform + mount)
 * - Sandpack first preview WITH our new pre-warm: ~3-5s (target)
 * - WebContainers first preview: 1-2s (WASM Node already booted)
 *
 * Pre-warming closes most of the gap. WebContainers is the final 50%.
 */

export interface PreviewAdapter {
  name: "sandpack" | "webcontainers";
  isReady: boolean;
  mount(files: Record<string, string>, deps: Record<string, string>): Promise<void>;
  updateFiles(files: Record<string, string>): Promise<void>;
  runCommand?(cmd: string): Promise<{ stdout: string; stderr: string; code: number }>;
  destroy(): Promise<void>;
}

/**
 * Feature flag — flip to true once WEBCONTAINERS_LICENSE_KEY is set
 * and @webcontainer/api is installed.
 */
export function isWebContainersEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (!process.env.NEXT_PUBLIC_WEBCONTAINERS_ENABLED) return false;
  return process.env.NEXT_PUBLIC_WEBCONTAINERS_ENABLED === "true";
}

/**
 * Factory: picks WebContainers if enabled, falls back to Sandpack.
 * UI code should call this instead of importing either implementation directly.
 */
export async function createPreviewAdapter(): Promise<PreviewAdapter["name"]> {
  if (isWebContainersEnabled()) {
    try {
      // Dynamic import so we don't bundle WebContainers unless enabled.
      // @ts-expect-error — package not installed yet
      await import("@webcontainer/api");
      return "webcontainers";
    } catch {
      console.warn("[preview-adapter] WebContainers enabled but @webcontainer/api not installed — falling back to Sandpack");
      return "sandpack";
    }
  }
  return "sandpack";
}

/**
 * Real WebContainers boot. Uncomment and wire once license + package are in.
 * Left commented so the file type-checks without the package installed.
 */
/*
export async function bootWebContainer(files: Record<string, string>) {
  const { WebContainer } = await import("@webcontainer/api");
  const wc = await WebContainer.boot();
  await wc.mount(filesToSnapshot(files));
  const install = await wc.spawn("npm", ["install"]);
  if ((await install.exit) !== 0) throw new Error("npm install failed");
  const dev = await wc.spawn("npm", ["run", "dev"]);
  return { wc, devProcess: dev };
}
*/
