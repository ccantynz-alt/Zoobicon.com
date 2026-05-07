import { Command } from "commander";
import { CLI_VERSION } from "./lib/config.js";
import { loginCommand } from "./commands/login.js";
import { newCommand } from "./commands/new.js";
import { deployCommand } from "./commands/deploy.js";
import { domainsCommand } from "./commands/domains.js";
import { listCommand } from "./commands/list.js";
import { fail } from "./lib/ui.js";

/**
 * Zoobicon CLI entry. Each command lives in its own file under
 * src/commands and is wired in here. Adding a new verb is just:
 *   1. Drop a file in src/commands/<name>.ts that exports a fn
 *   2. Wire it up below
 *   3. Add a section to README.md
 */

const program = new Command();
program
  .name("zoobicon")
  .description("Zoobicon CLI — generate, deploy, and manage AI-built websites from your terminal.")
  .version(CLI_VERSION, "-v, --version", "Show version and exit");

program
  .command("login")
  .description("Save an API key so the CLI can talk to Zoobicon on your behalf.")
  .option("--key <key>", "API key to save (skip the interactive prompt)")
  .option("--logout", "Remove the saved API key")
  .action(loginCommand);

program
  .command("new <prompt...>")
  .description("Generate a website from a prompt and write the files to a folder.")
  .option("-o, --out <dir>", "Output directory (default: ./zoobicon-<slug>)")
  .option("--force", "Overwrite the output directory if it already exists")
  .action((promptParts: string[], opts) => newCommand(promptParts.join(" "), opts));

program
  .command("deploy [path]")
  .description("Deploy a project directory to <slug>.zoobicon.sh.")
  .option("--slug <slug>", "Custom subdomain slug (defaults to a generated one)")
  .option("--name <name>", "Friendly site name shown in your dashboard")
  .action(deployCommand);

program
  .command("domains <description...>")
  .alias("domain")
  .description("AI-generate domain names and check .com availability live.")
  .option("-c, --count <n>", "How many names to generate (5-100)", "25")
  .option("--word <count>", "Force '1' (single-word) or '2' (compound) or 'either'", "either")
  .option("--length <mode>", "'short' (≤6 chars) or 'any'", "any")
  .option("--type <type>", "'real' / 'invented' / 'either'", "either")
  .option("--tlds <list>", "Comma-separated TLDs to check (default: com)", "com")
  .action((descParts: string[], opts) => domainsCommand(descParts.join(" "), opts));

program
  .command("list")
  .alias("ls")
  .description("List your deployed sites.")
  .action(listCommand);

program
  .showHelpAfterError("(Run `zoobicon --help` for usage.)")
  .configureOutput({
    outputError: (str, write) => write(str),
  });

// Top-level error handling — keep stack traces out of users' terminals
// unless ZOOBICON_DEBUG is set.
program.parseAsync(process.argv).catch((err: unknown) => {
  if (process.env.ZOOBICON_DEBUG) {
    console.error(err);
  } else {
    fail(err instanceof Error ? err.message : String(err));
  }
  process.exit(1);
});
