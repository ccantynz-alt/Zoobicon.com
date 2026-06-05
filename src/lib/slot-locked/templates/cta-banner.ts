/**
 * cta-banner — slot-locked variant.
 *
 * A centred call-to-action banner with headline, sub-line, and one or
 * two buttons. Editorial-light card on paper-elevated with a soft gold
 * glow. Deterministic — the AI supplies copy + button labels/hrefs only.
 */

import type { ComponentSchema } from "../types";

export const CTA_BANNER_SCHEMA: ComponentSchema = {
  id: "cta-banner-slot",
  category: "cta",
  variant: "banner",
  name: "CTA — centred banner",
  description: "Centred call-to-action with headline, sub-line, and one or two buttons.",
  themes: ["editorial", "light"],
  slots: [
    {
      name: "headline",
      type: "text",
      prompt: "The CTA headline. 3-9 words. Action-oriented. Wrap one word in <em>…</em> for italic accent.",
      maxLength: 80,
      required: true,
    },
    {
      name: "subhead",
      type: "richText",
      prompt: "One sentence reinforcing the value or removing a risk. e.g. 'No credit card. Live in 60 seconds.'",
      maxLength: 160,
    },
    {
      name: "primaryLabel",
      type: "text",
      prompt: "Primary button label. 1-4 words. e.g. 'Start building'.",
      maxLength: 28,
      required: true,
      default: "Get started",
    },
    {
      name: "primaryHref",
      type: "url",
      prompt: "Primary button link. Use a relative path like '/builder' when in doubt.",
      default: "/builder",
    },
    {
      name: "secondaryLabel",
      type: "text",
      prompt: "Optional secondary button label. e.g. 'See pricing'. Leave blank for a single-button banner.",
      maxLength: 28,
    },
    {
      name: "secondaryHref",
      type: "url",
      prompt: "Optional secondary button link. e.g. '/pricing'.",
      default: "/pricing",
    },
  ],
};

export const CTA_BANNER_TEMPLATE = `import React from "react";

export default function CtaBanner() {
  return (
    <section className="px-6 py-24 sm:py-32" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <div
        className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-16"
        style={{
          background: "linear-gradient(135deg, var(--paper-elevated) 0%, var(--paper-bright) 100%)",
          border: "1px solid var(--rule)",
          boxShadow: "0 1px 2px rgba(10,10,11,0.05), 0 12px 40px rgba(10,10,11,0.08)",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(184, 146, 63, 0.16), transparent 70%)", filter: "blur(50px)" }}
        />
        <div className="relative">
          <h2
            className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-5xl"
            style={{ color: "var(--ink)" }}
            dangerouslySetInnerHTML={{ __html: "{{slot.headline | raw}}" }}
          />
          {{#if slot.subhead}}
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg" style={{ color: "var(--ink-secondary)" }}>
            {{slot.subhead}}
          </p>
          {{/if}}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="{{slot.primaryHref}}"
              className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{
                background: "var(--ink)",
                color: "var(--paper)",
                boxShadow: "0 8px 24px rgba(10,10,11,0.18)",
              }}
            >
              {{slot.primaryLabel}}
            </a>
            {{#if slot.secondaryLabel}}
            <a
              href="{{slot.secondaryHref}}"
              className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--rule-strong)" }}
            >
              {{slot.secondaryLabel}}
            </a>
            {{/if}}
          </div>
        </div>
      </div>
    </section>
  );
}
`;

export const CTA_BANNER_EXAMPLE = {
  headline: "Describe it. <em>Watch</em> it build.",
  subhead: "Your first site is free to generate. No credit card, live preview in seconds.",
  primaryLabel: "Start building",
  primaryHref: "/builder",
  secondaryLabel: "See pricing",
  secondaryHref: "/pricing",
};
