import { mkdirSync, readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

/**
 * Credentials live at ~/.zoobicon/credentials as a tiny JSON file with
 * 0600 perms. We avoid keychain integrations for now to keep the CLI
 * dependency-free across platforms — once we go enterprise, swap this
 * for `keytar` and the call sites stay identical.
 */

interface Credentials {
  apiKey: string;
  email?: string;
  savedAt: number;
}

function credentialsPath(): string {
  return join(homedir(), ".zoobicon", "credentials");
}

export function loadApiKey(): string | null {
  // Env var wins so CI / one-off scripts don't have to write a file.
  const fromEnv = process.env.ZOOBICON_API_KEY;
  if (fromEnv && fromEnv.startsWith("zbk_")) return fromEnv;

  const path = credentialsPath();
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as Credentials;
    return parsed.apiKey || null;
  } catch {
    return null;
  }
}

export function loadCredentials(): Credentials | null {
  const path = credentialsPath();
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf8");
    return JSON.parse(raw) as Credentials;
  } catch {
    return null;
  }
}

export function saveApiKey(apiKey: string, email?: string): void {
  const path = credentialsPath();
  mkdirSync(dirname(path), { recursive: true });
  const payload: Credentials = { apiKey, email, savedAt: Date.now() };
  writeFileSync(path, JSON.stringify(payload, null, 2), "utf8");
  // 0600 — owner read/write only. On Windows chmod is a no-op but safe.
  try {
    chmodSync(path, 0o600);
  } catch {
    /* Windows / non-POSIX — best effort */
  }
}

export function clearCredentials(): boolean {
  const path = credentialsPath();
  if (!existsSync(path)) return false;
  try {
    writeFileSync(path, "{}", "utf8");
    return true;
  } catch {
    return false;
  }
}

export function requireApiKey(): string {
  const key = loadApiKey();
  if (!key) {
    throw new Error(
      "Not logged in. Run `zoobicon login` first or export ZOOBICON_API_KEY=<your key>.",
    );
  }
  return key;
}
