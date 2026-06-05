/**
 * stats-strip — slot-locked variant.
 *
 * A horizontal strip of 3-4 headline metrics (value + label + optional
 * sub-label). Editorial-light styling with hairline dividers between
 * stats and a gold accent rule. Deterministic: the AI only supplies the
 * numbers and labels — it never writes layout code, so this can never
 * render broken.
 */

import type { ComponentSchema } from "../types";

export const STATS_STRIP_SCHEMA: ComponentSchema = {
  id: "stats-strip-slot",
  category: "stats",
  variant: "strip",
  name: "Stats — metric strip",
  description: "A row of 3-4 headline metrics (value + label). Editorial-light, hairline dividers.",
  themes: ["editorial", "light"],
  slots: [
    {
      name: "eyebrow",
      type: "text",
      prompt: "Short kicker above the stats. ALL CAPS. e.g. 'BY THE NUMBERS'.",
      maxLength: 28,
      default: "BY THE NUMBERS",
    },
    {
      name: "headline",
      type: "text",
      prompt: "Optional one-line headline above the metrics. 3-8 words. Wrap one word in <em>…</em> for italic accent.",
      maxLength: 70,
    },
    {
      name: "stats",
      type: "list",
      prompt: "The headline metrics. THREE or FOUR items. Each is a single impressive, concrete number.",
      minItems: 3,
      maxItems: 4,
      itemSchema: [
        {
          name: "value",
          type: "text",
          prompt: "The metric value, formatted for display. e.g. '98%', '10k+', '3.2s', '$4M'.",
          maxLength: 12,
          required: true,
        },
        {
          name: "label",
          type: "text",
          prompt: "What the number measures. 1-4 words. e.g. 'Faster builds', 'Happy customers'.",
          maxLength: 40,
          required: true,
        },
        {
          name: "sub",
          type: "text",
          prompt: "Optional one-line context under the label. e.g. 'vs the industry average'.",
          maxLength: 60,
        },
      ],
    },
  ],
};

export const STATS_STRIP_TEMPLATE = `import React from "react";

export default function StatsStrip() {
  const stats = [
    {{#each slot.stats}}
    { value: "{{item.value}}", label: "{{item.label}}", sub: "{{item.sub}}" },
    {{/each}}
  ];

  return (
    <section className="px-6 py-20 sm:py-24" style={{ background: "var(--paper-elevated)", color: "var(--ink)", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <span className="h-px w-6" style={{ background: "var(--gold)" }} />
            <span className="text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: "var(--gold-deep)" }}>
              {{slot.eyebrow}}
            </span>
            <span className="h-px w-6" style={{ background: "var(--gold)" }} />
          </div>
          {{#if slot.headline}}
          <h2
            className="mx-auto max-w-2xl text-balance text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "var(--ink)" }}
            dangerouslySetInnerHTML={{ __html: "{{slot.headline | raw}}" }}
          />
          {{/if}}
        </div>

        <div className="grid grid-cols-2 gap-y-10 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center px-4 text-center sm:border-l"
              style={{ borderColor: i === 0 ? "transparent" : "var(--rule)" }}
            >
              <div className="text-4xl font-bold tracking-tight sm:text-5xl" style={{ color: "var(--ink)" }}>
                {s.value}
              </div>
              <div className="mt-2 text-sm font-semibold" style={{ color: "var(--ink-secondary)" }}>
                {s.label}
              </div>
              {s.sub ? (
                <div className="mt-1 text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                  {s.sub}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

export const STATS_STRIP_EXAMPLE = {
  eyebrow: "BY THE NUMBERS",
  headline: "Built to <em>outperform</em>.",
  stats: [
    { value: "8s", label: "Average build", sub: "prompt to live preview" },
    { value: "118", label: "Components", sub: "all $100K-agency quality" },
    { value: "99.9%", label: "Render success", sub: "fault-isolated preview" },
    { value: "30s", label: "Deploy", sub: "one click, SSL included" },
  ],
};
