import prompts from "prompts";
import { saveApiKey, loadCredentials, clearCredentials } from "../lib/auth.js";
import { api, ApiError } from "../lib/api.js";
import { success, fail, info, c, header } from "../lib/ui.js";
import { apiBase } from "../lib/config.js";

interface VerifyResponse {
  ok?: boolean;
  email?: string;
  plan?: string;
  sub?: string;
  reason?: string;
}

export async function loginCommand(opts: { logout?: boolean; key?: string }): Promise<void> {
  if (opts.logout) {
    const cleared = clearCredentials();
    if (cleared) success("Logged out.");
    else info("Not logged in — nothing to clear.");
    return;
  }

  const existing = loadCredentials();
  if (existing?.apiKey && !opts.key) {
    info(`Already logged in${existing.email ? ` as ${c.bold(existing.email)}` : ""}.`);
    info(`Use ${c.cyan("zoobicon login --logout")} to sign out, or ${c.cyan("zoobicon login --key <key>")} to swap keys.`);
    return;
  }

  let key = opts.key;
  if (!key) {
    header("Sign in to Zoobicon");
    info(`Create or copy an API key from ${c.cyan(`${apiBase()}/admin/api-keys`)}`);
    info(`Keys look like ${c.gray("zbk_live_…")}`);
    const answer = await prompts({
      type: "password",
      name: "key",
      message: "Paste your API key",
      validate: (val: string) => val.startsWith("zbk_") || "API keys start with zbk_",
    });
    if (!answer.key) {
      fail("Cancelled.");
      process.exit(1);
    }
    key = answer.key as string;
  }

  // Save first so the verify call below uses it.
  saveApiKey(key);

  // Verify the key against the public auth endpoint. We don't fail the
  // login if /api/v1/auth happens not to exist or returns 404 — the key
  // file is still saved and the user can keep going. But if the server
  // says 401/403 we wipe the bad key so they retry cleanly.
  try {
    const res = await api<VerifyResponse>("/api/v1/auth/verify", { method: "GET" });
    saveApiKey(key, res.email);
    const who = res.email
      ? c.bold(res.email)
      : res.sub
      ? c.bold(`user_${res.sub}`)
      : "your account";
    success(`Logged in as ${who}${res.plan ? c.gray(` (${res.plan} plan)`) : ""}.`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      clearCredentials();
      fail("That API key was rejected by the server. Please check it and try again.");
      process.exit(1);
    }
    // Non-auth error — treat the save as successful and warn.
    success("API key saved.");
    info(c.gray("(Could not verify against the server — your key is saved locally.)"));
  }
}
