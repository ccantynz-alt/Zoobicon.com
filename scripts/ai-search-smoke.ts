/**
 * AI Search Live Smoke Test
 *
 * Proves the /api/domains/ai-search coinage engine actually works end-to-end.
 * Hits a real, running server with a real mission, parses the SSE stream, and
 * prints every phase verdict + the final ranked shortlist.
 *
 * Usage:
 *   npx tsx scripts/ai-search-smoke.ts                                  # defaults to localhost
 *   npx tsx scripts/ai-search-smoke.ts https://zoobicon.com              # hit production
 *   npx tsx scripts/ai-search-smoke.ts https://zoobicon.com "edge AI platform for autonomous teams"
 *
 * Exit code is 0 only if the stream completed with a non-empty shortlist.
 * Anything else (error event, zero shortlist, HTTP failure, timeout) exits 1.
 * That makes this safe to drop into CI as the end-to-end proof of life.
 */

const BASE = process.argv[2] || "http://localhost:3000";
const MISSION =
  process.argv[3] ||
  "A unified compute edge platform for AI teams — velocity, autonomous scale, real-time orchestration.";

interface ShortlistEntry {
  name: string;
  slug: string;
  pattern: string;
  rationale: string;
  availability: Record<string, boolean | null>;
  availableTlds: string[];
  score: number;
  scoreBreakdown: Record<string, number>;
}

interface ParsedEvent {
  event: string;
  data: unknown;
}

function parseBlock(block: string): ParsedEvent | null {
  const lines = block.split("\n");
  let event = "message";
  let dataLine = "";
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLine = line.slice(5).trim();
  }
  if (!dataLine) return null;
  try {
    return { event, data: JSON.parse(dataLine) };
  } catch {
    return null;
  }
}

// Tiny ANSI colours — no deps.
const c = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
};

async function main() {
  const url = `${BASE}/api/domains/ai-search`;
  console.log(c.bold("\n┌─────────────────────────────────────────────────┐"));
  console.log(c.bold("│  ZOOBICON AI DOMAIN COINAGE — LIVE SMOKE TEST   │"));
  console.log(c.bold("└─────────────────────────────────────────────────┘\n"));
  console.log(`${c.dim("Endpoint:")} ${url}`);
  console.log(`${c.dim("Mission :")} ${MISSION}\n`);

  const started = Date.now();
  let errorEvent: { message?: string } | null = null;
  let shortlist: ShortlistEntry[] = [];
  let phaseSeen = new Set<string>();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mission: MISSION }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(c.red(`✗ Network error: ${msg}`));
    process.exit(1);
  }

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    console.error(c.red(`✗ HTTP ${res.status}: ${body.slice(0, 400) || "no body"}`));
    process.exit(1);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep = buffer.indexOf("\n\n");
    while (sep !== -1) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const ev = parseBlock(block);
      if (ev) handleEvent(ev);
      sep = buffer.indexOf("\n\n");
    }
  }

  function handleEvent(ev: ParsedEvent) {
    const d = ev.data as Record<string, unknown>;
    phaseSeen.add(ev.event);
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    const prefix = c.dim(`[${elapsed}s]`);

    switch (ev.event) {
      case "start":
        console.log(`${prefix} ${c.cyan("▸")} ${c.bold("Pipeline started")}`);
        console.log(`${c.dim("   tlds:")}           ${(d.tlds as string[]).join(", ")}`);
        console.log(`${c.dim("   candidates:")}     ${d.candidateCount}`);
        console.log(`${c.dim("   shortlistSize:")}  ${d.shortlistSize}`);
        console.log();
        break;

      case "phase:patterns": {
        const patterns = (d.patterns as Array<{ id: string; label: string; rationale: string }>) || [];
        const themes = (d.themes as string[]) || [];
        console.log(`${prefix} ${c.magenta("◆")} ${c.bold("Phase 1 — Coinage Inference")}`);
        console.log(`${c.dim("   phonetic_target:")} ${d.phonetic_target}`);
        for (const p of patterns) {
          console.log(`   ${c.cyan(p.id.padEnd(22))} ${c.dim(p.label)}`);
          console.log(`      ${c.dim(p.rationale)}`);
        }
        if (themes.length) console.log(`${c.dim("   themes:")} ${themes.join(", ")}`);
        console.log();
        break;
      }

      case "phase:candidates": {
        const cands = (d.candidates as Array<{ name: string }>) || [];
        console.log(`${prefix} ${c.magenta("◆")} ${c.bold(`Phase 2 — ${cands.length} candidates generated`)}`);
        console.log(`   ${cands.map((x) => x.name).join(", ")}`);
        console.log();
        break;
      }

      case "phase:trademark":
        console.log(
          `${prefix} ${c.magenta("◆")} ${c.bold("Phase 3 — Trademark screen")}  ${c.green(
            `kept ${d.kept}`,
          )}  ${c.red(`dropped ${d.dropped}`)}`,
        );
        if (Array.isArray(d.flagged) && d.flagged.length) {
          for (const f of d.flagged as Array<{ candidate: string; collision: string; type: string }>) {
            console.log(`   ${c.red("✗")} ${f.candidate.padEnd(14)} → ${f.collision} (${f.type})`);
          }
        }
        console.log();
        break;

      case "phase:linguistic":
        console.log(
          `${prefix} ${c.magenta("◆")} ${c.bold("Phase 4 — Linguistic safety (18 langs)")}  ${c.green(
            `kept ${d.kept}`,
          )}  ${c.red(`dropped ${d.dropped}`)}`,
        );
        if (Array.isArray(d.multilingual_flagged)) {
          for (const f of d.multilingual_flagged as Array<{ name: string; reason: string }>) {
            console.log(`   ${c.red("✗")} ${f.name.padEnd(14)} → ${f.reason}`);
          }
        }
        console.log();
        break;

      case "phase:availability": {
        const name = String(d.name);
        const availability = d.availability as Record<string, boolean | null>;
        const summary = Object.entries(availability)
          .map(([tld, ok]) =>
            ok === true ? c.green(`.${tld}✓`) : ok === false ? c.red(`.${tld}✗`) : c.dim(`.${tld}?`),
          )
          .join(" ");
        console.log(
          `${prefix} ${c.cyan("·")} ${name.padEnd(14)} ${summary}   ${c.dim(
            `score ${d.score}  (${d.index}/${d.total})`,
          )}`,
        );
        break;
      }

      case "phase:shortlist":
        shortlist = (d.shortlist as ShortlistEntry[]) || [];
        console.log();
        console.log(`${prefix} ${c.magenta("◆")} ${c.bold("Phase 6 — Ranked shortlist")}`);
        console.log();
        break;

      case "done":
        console.log(`${prefix} ${c.green("✓")} ${c.bold("Pipeline complete")}`);
        console.log(
          `   ${c.dim("candidates:")} ${d.total_candidates}  ${c.dim("→ post-trademark:")} ${d.total_after_trademark}  ${c.dim(
            "→ post-linguistic:",
          )} ${d.total_after_linguistic}  ${c.dim("→ with availability:")} ${d.total_with_availability}`,
        );
        break;

      case "error":
        errorEvent = d as { message?: string };
        console.error(`${prefix} ${c.red("✗ ERROR")} ${errorEvent?.message}`);
        break;

      default:
        break;
    }
  }

  // ── Final verdict ─────────────────────────────────────────────────────
  console.log();
  console.log(c.bold("┌─────────────────────────────────────────────────┐"));
  console.log(c.bold("│               FINAL SHORTLIST                    │"));
  console.log(c.bold("└─────────────────────────────────────────────────┘"));
  console.log();

  if (errorEvent) {
    console.error(c.red(`✗ Engine reported error: ${errorEvent.message || "unknown"}`));
    console.error(c.red(`  Phases seen: ${Array.from(phaseSeen).join(", ")}`));
    process.exit(1);
  }

  if (shortlist.length === 0) {
    console.error(c.red("✗ Shortlist is empty. Engine ran but returned zero cleared names."));
    console.error(c.red(`  Phases seen: ${Array.from(phaseSeen).join(", ")}`));
    process.exit(1);
  }

  for (let i = 0; i < shortlist.length; i++) {
    const x = shortlist[i];
    const avail = x.availableTlds.length
      ? x.availableTlds.map((t) => c.green(`.${t}`)).join(" ")
      : c.red("(none)");
    console.log(
      `${c.bold(`#${i + 1}`)} ${c.cyan(x.name.padEnd(14))} ${c.dim(x.pattern.padEnd(22))} ${c.yellow(
        `score ${x.score}`,
      )}`,
    );
    console.log(`   ${avail}`);
    console.log(`   ${c.dim(x.rationale)}`);
    console.log();
  }

  const totalMs = Date.now() - started;
  console.log(c.green(`✓ PASS — ${shortlist.length} names cleared in ${(totalMs / 1000).toFixed(1)}s`));
  process.exit(0);
}

main().catch((err) => {
  console.error(c.red(`✗ Unhandled: ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
