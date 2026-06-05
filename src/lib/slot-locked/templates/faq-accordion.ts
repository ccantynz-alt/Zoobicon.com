/**
 * faq-accordion — slot-locked variant.
 *
 * A two-column-on-desktop FAQ built on native <details>/<summary> so it
 * needs ZERO JavaScript to be interactive — the most bulletproof
 * accordion possible. Editorial-light styling, hairline dividers, gold
 * accent on the open marker. Deterministic — the AI supplies only the
 * question/answer pairs.
 */

import type { ComponentSchema } from "../types";

export const FAQ_ACCORDION_SCHEMA: ComponentSchema = {
  id: "faq-accordion-slot",
  category: "faq",
  variant: "accordion",
  name: "FAQ — accordion",
  description: "Native <details> accordion of 4-6 Q&A pairs. Zero JS, fully interactive.",
  themes: ["editorial", "light"],
  slots: [
    {
      name: "eyebrow",
      type: "text",
      prompt: "Short kicker above the headline. ALL CAPS. e.g. 'QUESTIONS'.",
      maxLength: 28,
      default: "FAQ",
    },
    {
      name: "headline",
      type: "text",
      prompt: "Section headline. 3-7 words. Wrap one word in <em>…</em> for italic accent.",
      maxLength: 64,
      required: true,
    },
    {
      name: "items",
      type: "list",
      prompt: "FOUR to SIX frequently-asked questions with clear, honest answers.",
      minItems: 4,
      maxItems: 6,
      itemSchema: [
        {
          name: "question",
          type: "text",
          prompt: "The question, phrased as a real customer would ask it.",
          maxLength: 110,
          required: true,
        },
        {
          name: "answer",
          type: "richText",
          prompt: "A clear, direct answer. 1-3 sentences. Honest, no hedging.",
          maxLength: 280,
          required: true,
        },
      ],
    },
  ],
};

export const FAQ_ACCORDION_TEMPLATE = `import React from "react";

export default function FaqAccordion() {
  const items = [
    {{#each slot.items}}
    { question: "{{item.question}}", answer: \`{{item.answer}}\` },
    {{/each}}
  ];

  return (
    <section className="px-6 py-24 sm:py-32" style={{ background: "var(--paper-elevated)", color: "var(--ink)", borderTop: "1px solid var(--rule)" }}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <span className="h-px w-6" style={{ background: "var(--gold)" }} />
            <span className="text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: "var(--gold-deep)" }}>
              {{slot.eyebrow}}
            </span>
            <span className="h-px w-6" style={{ background: "var(--gold)" }} />
          </div>
          <h2
            className="text-balance text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "var(--ink)" }}
            dangerouslySetInnerHTML={{ __html: "{{slot.headline | raw}}" }}
          />
        </div>

        <div className="divide-y" style={{ borderColor: "var(--rule)" }}>
          {items.map((it, i) => (
            <details
              key={i}
              className="group py-5"
              style={{ borderColor: "var(--rule)" }}
            >
              <summary
                className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold"
                style={{ color: "var(--ink)" }}
              >
                <span>{it.question}</span>
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-lg leading-none transition-transform group-open:rotate-45"
                  style={{ background: "var(--gold-soft)", color: "var(--gold-deep)" }}
                >
                  +
                </span>
              </summary>
              <p className="mt-3 pr-10 text-base leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                {it.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

export const FAQ_ACCORDION_EXAMPLE = {
  eyebrow: "FAQ",
  headline: "Questions, <em>answered</em>.",
  items: [
    {
      question: "How fast is a build?",
      answer:
        "Most sites generate a live preview in under 10 seconds. The components are assembled in parallel, so the total time is the slowest single section, not the sum.",
    },
    {
      question: "Can I import my existing website?",
      answer:
        "Yes. Paste your current URL — WordPress, Wix, Squarespace, anything — and we extract your colors, fonts and content, then rebuild a modern React version you can keep editing.",
    },
    {
      question: "What if a section comes out wrong?",
      answer:
        "Just describe the change in the chat and only that section regenerates in a couple of seconds. The preview is fault-isolated, so one edit never breaks the rest of the page.",
    },
    {
      question: "Do I own the site?",
      answer:
        "Completely. Export the full React + Tailwind source any time, or deploy it with one click. There's no lock-in.",
    },
    {
      question: "How much does it cost?",
      answer:
        "Your first build is free to generate. Paid plans start at $49/mo and unlock more builds, custom domains and agency features.",
    },
  ],
};
