import { api } from "../lib/api.js";
import { requireApiKey } from "../lib/auth.js";
import { success, fail, info, c, header } from "../lib/ui.js";

interface Site {
  slug: string;
  name?: string;
  url?: string;
  status?: string;
  updated_at?: string;
  created_at?: string;
}

interface ListResponse {
  sites?: Site[];
}

export async function listCommand(): Promise<void> {
  requireApiKey();

  let res: ListResponse;
  try {
    res = await api<ListResponse>("/api/v1/sites", { method: "GET" });
  } catch (err) {
    fail(err instanceof Error ? err.message : "Failed to list sites.");
    process.exit(1);
  }

  const sites = res.sites || [];
  header(`Your Zoobicon sites (${sites.length})`);
  if (sites.length === 0) {
    info(`Nothing deployed yet. Run ${c.cyan("zoobicon new \"<your idea>\"")} to start.`);
    return;
  }

  for (const s of sites) {
    const url = s.url || `https://${s.slug}.zoobicon.sh`;
    const status = s.status === "live" ? c.green("● live") : c.gray(`○ ${s.status || "unknown"}`);
    console.log(`  ${status}  ${c.bold(url)}`);
    if (s.name) console.log("    " + c.gray(s.name));
  }
  console.log("");
  success(`${sites.length} site${sites.length === 1 ? "" : "s"}.`);
}
