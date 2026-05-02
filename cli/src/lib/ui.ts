import kleur from "kleur";

/**
 * Tiny terminal UX helpers. Kept free of `ora` and similar so the CLI
 * stays under 5 deps total — `kleur` and node built-ins are enough.
 */

export const c = kleur;

export function info(msg: string): void {
  console.log(kleur.cyan("·"), msg);
}

export function success(msg: string): void {
  console.log(kleur.green("✓"), msg);
}

export function warn(msg: string): void {
  console.log(kleur.yellow("⚠"), msg);
}

export function fail(msg: string): void {
  console.error(kleur.red("✗"), msg);
}

export function header(msg: string): void {
  console.log("");
  console.log(kleur.bold().white(msg));
  console.log(kleur.gray("─".repeat(Math.min(msg.length, 60))));
}

export function dim(msg: string): string {
  return kleur.gray(msg);
}

/**
 * Minimal spinner — uses braille frames, refreshes every 80ms.
 * Returns a stop function. Falls back to a single-line message if stdout
 * isn't a TTY (CI, pipes).
 */
export function spinner(message: string): () => void {
  if (!process.stdout.isTTY) {
    console.log(kleur.cyan("·"), message);
    return () => {};
  }
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const tick = () => {
    process.stdout.write(`\r${kleur.cyan(frames[i % frames.length])} ${message}   `);
    i++;
  };
  tick();
  const handle = setInterval(tick, 80);
  return () => {
    clearInterval(handle);
    process.stdout.write(`\r${" ".repeat(message.length + 6)}\r`);
  };
}

/**
 * Format a domain availability row consistently across commands.
 */
export function domainRow(opts: {
  domain: string;
  available: boolean | null;
  price?: number | null;
  badge?: string;
}): string {
  const status = opts.available === true
    ? kleur.green("✓ available")
    : opts.available === false
    ? kleur.gray("· taken    ")
    : kleur.yellow("? unknown  ");
  const price = opts.price != null ? kleur.gray(`  $${opts.price}/yr`) : "";
  const badge = opts.badge ? "  " + kleur.bold().yellow(opts.badge) : "";
  return `${status}  ${kleur.bold(opts.domain)}${price}${badge}`;
}
