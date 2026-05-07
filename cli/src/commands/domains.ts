import { api } from "../lib/api.js";
import { success, fail, info, spinner, c, header, domainRow } from "../lib/ui.js";

interface GenerateResponse {
  names?: Array<{ name: string; slug: string; tagline: string; score?: number }>;
  source?: string;
}

interface SearchResponse {
  results?: Array<{ domain: string; tld: string; available: boolean | null; price: number }>;
}

interface DomainsOptions {
  count?: string;
  word?: string;       // "1" / "2" / "either"
  length?: string;     // "short" / "any"
  type?: string;       // "real" / "invented" / "either"
  tlds?: string;       // comma-separated TLDs to check beyond .com
}

/**
 * `zoobicon domains "<description>"` — runs the same AI-powered finder as
 * the web UI and prints available domains to the terminal. No auth
 * required (matches the public web behaviour).
 */
export async function domainsCommand(description: string, opts: DomainsOptions): Promise<void> {
  if (!description || description.trim().length < 3) {
    fail("Please describe your business: zoobicon domains \"AI email client\"");
    process.exit(1);
  }

  const count = Math.min(Math.max(parseInt(opts.count || "25", 10) || 25, 5), 100);
  const wordCount = opts.word === "1" || opts.word === "2" ? Number(opts.word) : "either";
  const length = opts.length === "short" ? "short" : "any";
  const wordType = opts.type === "real" || opts.type === "invented" ? opts.type : "either";

  header(`Generating ${count} names for: "${description}"`);

  const stop1 = spinner("AI is generating brandable names…");
  let gen: GenerateResponse;
  try {
    gen = await api<GenerateResponse>("/api/domains/generate", {
      method: "POST",
      body: { description: description.trim(), count, wordCount, length, wordType },
      skipAuth: true,
      timeoutMs: 60000,
    });
  } catch (err) {
    stop1();
    fail(err instanceof Error ? err.message : "Name generation failed.");
    process.exit(1);
  }
  stop1();

  const names = gen.names || [];
  if (names.length === 0) {
    fail("No names returned. Try a more detailed description.");
    process.exit(1);
  }
  success(`Generated ${names.length} names. Checking .com availability…`);

  const tldList = (opts.tlds || "com").split(",").map((t) => t.trim()).filter(Boolean);

  // Sequential .com checks at concurrency 5 — same as the web UI.
  const CONCURRENCY = 5;
  const results: Array<{ slug: string; tagline: string; score?: number; com: boolean | null; price: number | null }> = [];
  let cursor = 0;
  const stop2 = spinner(`Checking ${names.length} domains…`);

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, names.length) }, async () => {
      while (true) {
        const idx = cursor++;
        if (idx >= names.length) return;
        const n = names[idx];
        try {
          const r = await api<SearchResponse>(
            `/api/domains/search?q=${encodeURIComponent(n.slug)}&tlds=${tldList.join(",")}&mode=com-priority`,
            { skipAuth: true, timeoutMs: 14000 },
          );
          const com = (r.results || []).find((x) => x.tld === "com");
          results[idx] = {
            slug: n.slug,
            tagline: n.tagline,
            score: n.score,
            com: com?.available ?? null,
            price: com?.price ?? null,
          };
        } catch {
          results[idx] = { slug: n.slug, tagline: n.tagline, score: n.score, com: null, price: null };
        }
      }
    }),
  );
  stop2();

  const available = results.filter((r) => r.com === true);
  available.sort((a, b) => {
    const sa = a.score ?? 0, sb = b.score ?? 0;
    if (sa !== sb) return sb - sa;
    return a.slug.length - b.slug.length;
  });

  console.log("");
  if (available.length === 0) {
    info(c.yellow("No .com domains were available in this batch — try a different description, or run again."));
    return;
  }
  success(`${available.length} of ${results.length} .com domains available:`);
  console.log("");
  for (const r of available) {
    console.log(domainRow({
      domain: `${r.slug}.com`,
      available: true,
      price: r.price,
      badge: r.score && r.score >= 90 ? `Premium ${r.score}` : r.score && r.score >= 75 ? `Score ${r.score}` : undefined,
    }));
    if (r.tagline) console.log("  " + c.gray(r.tagline));
  }
  console.log("");
  info(`Register: ${c.cyan(`zoobicon domains register <name>.com`)} (or visit https://zoobicon.com/domains)`);
}
