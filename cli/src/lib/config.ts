// Default API endpoint. Override with ZOOBICON_API env var for staging
// or self-hosted instances (the CLI is the same; only the host changes).
export const DEFAULT_API = "https://zoobicon.com";

export function apiBase(): string {
  return process.env.ZOOBICON_API || DEFAULT_API;
}

// CLI version is read at build time from package.json. esbuild inlines
// this constant via --define if we want; for simplicity we hard-code and
// keep it in sync with package.json on every release.
export const CLI_VERSION = "0.1.0";

// User-Agent helps the server distinguish CLI traffic from browser hits
// in logs and rate-limit policies.
export const USER_AGENT = `zoobicon-cli/${CLI_VERSION} (+https://zoobicon.com/cli)`;
