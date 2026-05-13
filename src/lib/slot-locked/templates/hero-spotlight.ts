/**
 * hero-spotlight — slot-locked variant.
 *
 * The hero component. Editorial-light by default (Rule 29). Cursor-
 * tracking radial spotlight on hover, gold accent strip above the
 * headline, optional metrics strip below the CTAs. Eight slots, two
 * with constraints, one list of stats.
 *
 * Structural code is hand-written here. The AI customiser fills
 * SLOTS only — it cannot break the JSX, mis-import lucide, or ship
 * banned imports.
 */

import type { ComponentSchema } from "../types";

export const HERO_SPOTLIGHT_SCHEMA: ComponentSchema = {
  id: "hero-spotlight-slot",
  category: "hero",
  variant: "spotlight",
  name: "Hero — spotlight",
  description: "Editorial-light hero with gold accent strip, headline, sub-head, primary + secondary CTA, and optional 3-item metrics strip.",
  industries: ["saas", "agency", "startup", "professional-services", "fintech"],
  themes: ["editorial", "light"],
  slots: [
    {
      name: "eyebrow",
      type: "text",
      prompt: "Short kicker text shown above the headline. Style: ALL CAPS, letter-spacing tight. Brand category or audience signal. Examples: 'AI PLATFORM', 'FOR FOUNDERS', 'PRIVATE BANKING'.",
      maxLength: 28,
      required: true,
    },
    {
      name: "headline",
      type: "text",
      prompt: "Main hero headline. Editorial voice — restrained, specific, no AI-slop adjectives ('revolutionary', 'unleash', 'transform'). 6-12 words. Wrap ONE word in <em>…</em> for the italic serif accent.",
      maxLength: 90,
      required: true,
    },
    {
      name: "subhead",
      type: "richText",
      prompt: "Sub-headline paragraph below the headline. 1-2 sentences. Specific value claim, not a tagline restatement.",
      maxLength: 180,
      required: true,
    },
    {
      name: "primaryCtaLabel",
      type: "text",
      prompt: "Primary CTA button label. 2-4 words. Verb-led: 'Start building', 'See pricing', 'Book a demo'.",
      maxLength: 28,
      default: "Get started",
      required: true,
    },
    {
      name: "primaryCtaHref",
      type: "url",
      prompt: "Primary CTA href. Use /signup, /pricing, or /book if internal. Full URL if external.",
      default: "/signup",
      required: true,
    },
    {
      name: "secondaryCtaLabel",
      type: "text",
      prompt: "Secondary CTA label (text link). 2-4 words. 'See how it works', 'View case studies'.",
      maxLength: 28,
      default: "Learn more",
    },
    {
      name: "secondaryCtaHref",
      type: "url",
      prompt: "Secondary CTA href.",
      default: "#features",
    },
    {
      name: "showMetrics",
      type: "boolean",
      prompt: "Whether to show the 3-item metrics strip below the CTAs. Set false for early-stage brands without proof points.",
      default: true,
    },
    {
      name: "metrics",
      type: "list",
      prompt: "Three trust-signal metrics. Each: { value, label }. Use ROUND numbers, no fake precision. Examples: { value: '500+', label: 'companies' }.",
      minItems: 3,
      maxItems: 3,
      itemSchema: [
        {
          name: "value",
          type: "text",
          prompt: "The numeric value, with unit or modifier. e.g. '500+', '99.9%', '<2s', '$2M'.",
          maxLength: 12,
          required: true,
        },
        {
          name: "label",
          type: "text",
          prompt: "What the value represents. 1-3 words.",
          maxLength: 28,
          required: true,
        },
      ],
    },
  ],
};

// ───────────────────────────────────────────────────────────────────────
// Template — hand-written TSX with mustache-style slot tokens.
//
// The assembler replaces {{slot.X}} tokens with HTML-escaped slot
// values, {{slot.X | raw}} with un-escaped values (use only for slot
// types whose value is itself sanitised — colors, hrefs that passed
// the URL validator).
//
// Editorial-light styling. Cursor-tracking radial spotlight via the
// existing src/lib/component-registry pattern (mousemove updates CSS
// vars). Mobile-first (uses Tailwind responsive prefixes).
// ───────────────────────────────────────────────────────────────────────

export const HERO_SPOTLIGHT_TEMPLATE = `import React, { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function HeroSpotlight() {
  const sectionRef = useRef<HTMLElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMove}
      className="relative overflow-hidden bg-[color:var(--paper)] px-6 py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 transition-opacity"
        style={{
          background: \`radial-gradient(600px circle at \${pos.x}% \${pos.y}%, rgba(184, 146, 63, 0.10), transparent 60%)\`,
        }}
      />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-6 inline-flex items-center gap-2">
          <span className="h-px w-8 bg-[color:var(--gold)]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-[color:var(--gold-deep)]">
            {{slot.eyebrow}}
          </span>
          <span className="h-px w-8 bg-[color:var(--gold)]" />
        </div>

        <h1
          className="mb-6 text-balance text-5xl font-bold tracking-tight text-[color:var(--ink)] sm:text-6xl md:text-7xl"
          dangerouslySetInnerHTML={{ __html: "{{slot.headline | raw}}" }}
        />

        <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg leading-relaxed text-[color:var(--ink-secondary)] sm:text-xl">
          {{slot.subhead}}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="{{slot.primaryCtaHref | raw}}"
            className="group inline-flex items-center gap-2 rounded-xl bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-[color:var(--paper)] transition-all hover:bg-[color:var(--gold-deep)] hover:shadow-lg"
          >
            {{slot.primaryCtaLabel}}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="{{slot.secondaryCtaHref | raw}}"
            className="inline-flex items-center gap-1.5 px-2 py-3 text-sm font-medium text-[color:var(--ink-secondary)] underline-offset-4 transition-colors hover:text-[color:var(--ink)] hover:underline"
          >
            {{slot.secondaryCtaLabel}} →
          </a>
        </div>

        {{#if slot.showMetrics}}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-8 border-t border-[color:var(--rule)] pt-10">
          {{#each slot.metrics}}
          <div className="text-center">
            <div className="text-3xl font-bold tabular-nums text-[color:var(--ink)] sm:text-4xl">
              {{item.value}}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[color:var(--ink-muted)]">
              {{item.label}}
            </div>
          </div>
          {{/each}}
        </div>
        {{/if}}
      </div>
    </section>
  );
}
`;

/**
 * Sample slot fill — used by the registry preview page, A/B tests,
 * and the development fallback when no AI customiser is available.
 * Demonstrates a fully valid input for this schema.
 */
export const HERO_SPOTLIGHT_EXAMPLE = {
  eyebrow: "AI PLATFORM",
  headline: "Build a website that <em>actually</em> works.",
  subhead:
    "Type a prompt, get a production site in under 30 seconds. Real domain. Real email. Real customers paying you by tomorrow morning.",
  primaryCtaLabel: "Start building",
  primaryCtaHref: "/signup",
  secondaryCtaLabel: "See how it works",
  secondaryCtaHref: "#features",
  showMetrics: true,
  metrics: [
    { value: "500+", label: "businesses" },
    { value: "8s", label: "first build" },
    { value: "99.5%", label: "reliability" },
  ],
};
