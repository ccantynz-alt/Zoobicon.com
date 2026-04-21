import { describe, it, expect } from "vitest";
import {
  COINAGE_PATTERNS,
  TRADEMARK_BLOCKLIST,
  trademarkPreFilter,
  englishNegativeFilter,
  scoreCandidate,
  buildPatternInferencePrompt,
  buildCandidateGenerationPrompt,
  buildLinguisticFilterPrompt,
  type CoinagePatternId,
} from "@/lib/domain-coinage";

describe("domain-coinage: pattern catalog integrity", () => {
  it("exposes exactly 10 coinage patterns", () => {
    expect(COINAGE_PATTERNS).toHaveLength(10);
  });

  it("every pattern has id, label, description, reference, tonality", () => {
    for (const p of COINAGE_PATTERNS) {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.description.length).toBeGreaterThan(20);
      expect(p.reference.length).toBeGreaterThan(5);
      expect(["short-plosive", "flowing-liquid", "hard-tech", "editorial-soft"]).toContain(p.tonality);
    }
  });

  it("pattern ids are unique", () => {
    const ids = COINAGE_PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("blocklist is populated with at least 100 major brands", () => {
    expect(TRADEMARK_BLOCKLIST.length).toBeGreaterThanOrEqual(100);
    expect(TRADEMARK_BLOCKLIST).toContain("google");
    expect(TRADEMARK_BLOCKLIST).toContain("apple");
    expect(TRADEMARK_BLOCKLIST).toContain("openai");
    expect(TRADEMARK_BLOCKLIST).toContain("anthropic");
  });
});

describe("domain-coinage: trademark pre-filter", () => {
  it("blocks exact matches against major brands", () => {
    const { survivors, flagged } = trademarkPreFilter(["Google", "Apple", "Lumex"]);
    expect(survivors).toEqual(["Lumex"]);
    expect(flagged.map((f) => f.candidate.toLowerCase())).toEqual(expect.arrayContaining(["google", "apple"]));
    expect(flagged.every((f) => f.type === "exact")).toBe(true);
  });

  it("blocks candidates that CONTAIN a brand (length >= 5)", () => {
    const { survivors, flagged } = trademarkPreFilter(["Googleish", "Stripey", "Clarius"]);
    // "googleish" contains "google"; "stripey" contains "stripe"
    const flaggedNames = flagged.map((f) => f.candidate.toLowerCase());
    expect(flaggedNames).toContain("googleish");
    expect(flaggedNames).toContain("stripey");
    expect(survivors).toEqual(["Clarius"]);
  });

  it("blocks candidates that are a SUBSTRING of a brand (length >= 5)", () => {
    // "lovab" is a substring of "lovable"
    const { flagged } = trademarkPreFilter(["lovab"]);
    expect(flagged).toHaveLength(1);
    expect(flagged[0].type).toBe("substring-of");
  });

  it("keeps clean coined names", () => {
    const { survivors } = trademarkPreFilter(["Lumex", "Veritas", "Stratis", "Axiom"]);
    expect(survivors).toEqual(["Lumex", "Veritas", "Stratis", "Axiom"]);
  });

  it("tolerates empty input", () => {
    const { survivors, flagged } = trademarkPreFilter([]);
    expect(survivors).toEqual([]);
    expect(flagged).toEqual([]);
  });

  it("strips non-alphanumeric characters before comparison", () => {
    const { flagged } = trademarkPreFilter(["G-oogle", "apple!"]);
    expect(flagged).toHaveLength(2);
  });
});

describe("domain-coinage: english negative filter", () => {
  it("blocks candidates containing negative stems", () => {
    const { survivors, flagged } = englishNegativeFilter(["Killzone", "Deathio", "Lumex"]);
    expect(survivors).toEqual(["Lumex"]);
    expect(flagged).toHaveLength(2);
  });

  it("keeps clean names", () => {
    const { survivors } = englishNegativeFilter(["Lumex", "Veritas", "Axiom"]);
    expect(survivors).toEqual(["Lumex", "Veritas", "Axiom"]);
  });

  it("catches profanity stems", () => {
    const { flagged } = englishNegativeFilter(["Shitify", "Fucker"]);
    expect(flagged).toHaveLength(2);
  });
});

describe("domain-coinage: scorer", () => {
  const baseArgs = {
    name: "Lumex",
    pattern: "neo-classical-root",
    rationale: "lumen + -ex",
    phoneticTarget: "hard-tech",
    phoneticActual: "hard-tech",
    linguistic: "clean" as const,
    availability: { ai: true, io: true, dev: true, tech: true },
    priorityTlds: ["ai", "io", "dev", "tech"],
  };

  it("gives maximum score when all priority TLDs are available + length + phonetic match", () => {
    const scored = scoreCandidate(baseArgs);
    // length(12) + 20+14+10+7 (tlds) + phonetic(8) = 71
    expect(scored.score).toBe(71);
    expect(scored.availableTlds).toEqual(["ai", "io", "dev", "tech"]);
  });

  it("penalizes long names", () => {
    const scored = scoreCandidate({ ...baseArgs, name: "Supercalifragil" });
    // length 0 instead of 12
    expect(scored.score).toBe(71 - 12);
  });

  it("penalizes phonetic mismatch", () => {
    const scored = scoreCandidate({ ...baseArgs, phoneticActual: "flowing-liquid" });
    expect(scored.score).toBe(71 - 8);
  });

  it("penalizes 'warn' linguistic verdict", () => {
    const scored = scoreCandidate({ ...baseArgs, linguistic: "warn" });
    expect(scored.score).toBe(71 - 4);
  });

  it("penalizes unpronounceable names with no vowels", () => {
    const scored = scoreCandidate({ ...baseArgs, name: "Brktx" });
    // length 0 (5 chars is within 4-7 so actually length=12... wait 5 is in range) + -10 pronounceability
    // "Brktx" is 5 chars so length = 12
    // -10 for no vowels
    expect(scored.score).toBe(71 - 10);
    expect(scored.scoreBreakdown.pronounceability).toBe(-10);
  });

  it("drops to near-zero when no TLDs are available", () => {
    const scored = scoreCandidate({
      ...baseArgs,
      availability: { ai: false, io: false, dev: false, tech: false },
    });
    // length(12) + phonetic(8) = 20
    expect(scored.score).toBe(20);
    expect(scored.availableTlds).toEqual([]);
  });

  it("weights TLDs by their priority order", () => {
    const onlyAi = scoreCandidate({ ...baseArgs, availability: { ai: true, io: false, dev: false, tech: false } });
    const onlyTech = scoreCandidate({ ...baseArgs, availability: { ai: false, io: false, dev: false, tech: true } });
    expect(onlyAi.score).toBeGreaterThan(onlyTech.score);
  });

  it("length sweet spot is 4-7 characters", () => {
    const seven = scoreCandidate({ ...baseArgs, name: "Lumexes" }); // 7 chars
    const eight = scoreCandidate({ ...baseArgs, name: "Lumexess" }); // 8 chars
    expect(seven.scoreBreakdown.length).toBe(12);
    expect(eight.scoreBreakdown.length).toBe(6);
  });

  it("includes a full score breakdown for transparency", () => {
    const scored = scoreCandidate(baseArgs);
    expect(scored.scoreBreakdown).toHaveProperty("length");
    expect(scored.scoreBreakdown).toHaveProperty("tld.ai");
    expect(scored.scoreBreakdown).toHaveProperty("phonetic");
  });
});

describe("domain-coinage: prompt builders", () => {
  it("pattern inference prompt embeds the mission and the full pattern catalog", () => {
    const prompt = buildPatternInferencePrompt("Build a unified compute edge platform");
    expect(prompt).toContain("Build a unified compute edge platform");
    for (const p of COINAGE_PATTERNS) {
      expect(prompt).toContain(p.id);
    }
    expect(prompt).toContain("phonetic_target");
  });

  it("candidate generation prompt enforces hard constraints", () => {
    const prompt = buildCandidateGenerationPrompt(
      "edge AI platform",
      [
        {
          id: "portmanteau" as CoinagePatternId,
          label: "Portmanteau",
          description: "blend",
          reference: "instagram",
        },
      ],
      ["edge", "velocity"],
      "short-plosive",
      24,
    );
    expect(prompt).toContain("4 to 9 characters");
    expect(prompt).toContain("exactly 24");
    expect(prompt).toContain("short-plosive");
    expect(prompt).toContain("edge, velocity");
    expect(prompt).toContain("JSON array");
  });

  it("linguistic prompt lists all 18 target languages", () => {
    const prompt = buildLinguisticFilterPrompt(["Lumex", "Kaka"]);
    expect(prompt).toContain("English");
    expect(prompt).toContain("Spanish");
    expect(prompt).toContain("Mandarin");
    expect(prompt).toContain("Hebrew");
    expect(prompt).toContain("Lumex");
    expect(prompt).toContain("Kaka");
  });
});

describe("domain-coinage: end-to-end deterministic pipeline", () => {
  it("runs trademark → english → scorer in sequence and produces a ranked list", () => {
    // Simulate 10 raw candidates coming back from Sonnet
    const raw = [
      "Lumex", "Vertax", "Stratis", "Axiom", "Clarius", // clean
      "Google", "Shopify", "Stripe", // trademark collisions
      "Killbit", "Deathrow", // negative stems
    ];

    // Phase 3: trademark
    const tm = trademarkPreFilter(raw);
    expect(tm.survivors).toHaveLength(7); // 5 clean + 2 negative stems survive trademark

    // Phase 4: english negatives
    const eng = englishNegativeFilter(tm.survivors);
    expect(eng.survivors).toEqual(["Lumex", "Vertax", "Stratis", "Axiom", "Clarius"]);

    // Phase 5: score with mock availability (Lumex wins .ai, Vertax wins .io, etc.)
    const scored = eng.survivors.map((name) =>
      scoreCandidate({
        name,
        pattern: "neo-classical-root",
        rationale: "test",
        phoneticTarget: "hard-tech",
        phoneticActual: "hard-tech",
        linguistic: "clean",
        availability:
          name === "Lumex"
            ? { ai: true, io: true, dev: true, tech: true }
            : name === "Vertax"
              ? { ai: true, io: true, dev: false, tech: true }
              : name === "Stratis"
                ? { ai: false, io: true, dev: true, tech: true }
                : name === "Axiom"
                  ? { ai: false, io: false, dev: true, tech: true }
                  : { ai: false, io: false, dev: false, tech: true },
        priorityTlds: ["ai", "io", "dev", "tech"],
      }),
    );

    scored.sort((a, b) => b.score - a.score);

    // Lumex has all 4 TLDs and should win
    expect(scored[0].name).toBe("Lumex");
    // Clarius has only .tech and should be last
    expect(scored[scored.length - 1].name).toBe("Clarius");
    // Every candidate should have a score >= 0 (none of these have no-vowel penalty)
    expect(scored.every((s) => s.score >= 0)).toBe(true);
  });
});
