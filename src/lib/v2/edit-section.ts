/**
 * V2 conversational edit — apply a single targeted change to one section of a
 * built page, fast. The hot-swap plumbing already exists (the streaming build
 * postMessages a section into the iframe by index), so an edit only needs to:
 *
 *   1. route the instruction to the section it targets (cheap Haiku call —
 *      intent classification only, a single index, ≤ a few tokens; this is the
 *      ONLY Haiku use permitted by Rule 35 and it never touches component code)
 *   2. rewrite that one section's code with Sonnet (Rule 35: Sonnet is the only
 *      model allowed to generate/customise/edit website components)
 *
 * The caller then renders + compiles the returned section and hot-swaps it in
 * place — no full rebuild, no spinner on the rest of the page.
 */

import { callLLMWithFailover } from "@/lib/llm-provider";

export interface EditSection {
  index: number;
  category: string;
  code: string;
}

/**
 * Decide which section an edit targets. Returns the section index, or -1 if
 * the instruction is page-wide / ambiguous (the caller asks the user to be
 * specific rather than guessing and mangling the page).
 *
 * Haiku is used ONLY here, for classification with a tiny numeric output —
 * explicitly the permitted exception in Rule 35. It never sees or edits code.
 */
export async function routeEdit(instruction: string, sections: EditSection[]): Promise<number> {
  // Fast deterministic shortcut: if the instruction names a category, use it.
  const lower = instruction.toLowerCase();
  const named = sections.find((s) => lower.includes(s.category.toLowerCase()));
  // Common synonyms → category keywords.
  const SYNONYMS: Record<string, string[]> = {
    hero: ["hero", "banner", "headline", "top of the page", "masthead"],
    navbar: ["nav", "menu", "header", "navigation"],
    features: ["feature", "benefits", "what we do"],
    pricing: ["pricing", "price", "plans", "tiers"],
    testimonials: ["testimonial", "review", "quotes", "social proof"],
    footer: ["footer", "bottom"],
    cta: ["cta", "call to action", "sign up", "get started"],
    faq: ["faq", "questions"],
    stats: ["stats", "numbers", "metrics"],
    contact: ["contact", "get in touch"],
    gallery: ["gallery", "photos", "images"],
  };
  if (!named) {
    for (const s of sections) {
      const syns = SYNONYMS[s.category.toLowerCase()] || [];
      if (syns.some((w) => lower.includes(w))) return s.index;
    }
  } else {
    return named.index;
  }

  // Otherwise ask Haiku to pick one (classification only, tiny output).
  try {
    const list = sections.map((s) => `${s.index}: ${s.category}`).join("\n");
    const fb = await callLLMWithFailover({
      model: "claude-haiku-4-5",
      system:
        "You route a website edit to the single section it applies to. " +
        "Reply with ONLY the integer index of that section. If the edit is page-wide " +
        "or you cannot tell, reply -1. No words, just the number.",
      userMessage: `Sections:\n${list}\n\nEdit: ${instruction}\n\nIndex:`,
      maxTokens: 8,
    });
    const m = (fb.text || "").match(/-?\d+/);
    if (!m) return -1;
    const idx = parseInt(m[0], 10);
    return sections.some((s) => s.index === idx) ? idx : -1;
  } catch {
    return -1;
  }
}

/**
 * Apply the user's edit to one component. Returns the complete edited code, or
 * null on any failure (the caller keeps the existing section unchanged).
 */
export async function editSection(
  instruction: string,
  code: string,
  category: string,
): Promise<string | null> {
  try {
    const fb = await callLLMWithFailover({
      model: "claude-sonnet-4-6",
      system:
        "You are editing ONE React component from a live website, per the user's instruction. " +
        "Apply EXACTLY the change requested — and nothing else. Keep `import React`, every other " +
        "import, the default export, and the overall structure intact unless the instruction " +
        "specifically requires changing them. Use Tailwind utility classes consistent with the " +
        "existing component. Keep the copy specific and on-brand — never generic placeholder text. " +
        "Return ONLY the complete edited component code — no markdown fences, no commentary.",
      userMessage: `Section type: ${category}\nEdit instruction: ${instruction}\n\nComponent code:\n\n${code}`,
      maxTokens: 4000,
    });
    let out = (fb.text || "").trim();
    out = out.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
    if (out.length < 80 || !/export\s+default/.test(out)) return null;
    return out;
  } catch {
    return null;
  }
}
