/**
 * features-bento — slot-locked variant.
 *
 * Asymmetric bento grid of 5 features (1 featured + 4 supporting).
 * Featured card spans 2 columns × 2 rows; the other 4 fill the
 * remaining cells. Each card has lucide icon + title + description +
 * optional link. Editorial-light styling, hover-lift, gold accent on
 * the featured card.
 */

import type { ComponentSchema } from "../types";

export const FEATURES_BENTO_SCHEMA: ComponentSchema = {
  id: "features-bento-slot",
  category: "features",
  variant: "bento",
  name: "Features — bento grid",
  description: "Asymmetric 5-card bento (1 featured + 4 supporting). Each card has icon + title + description.",
  themes: ["editorial", "light"],
  slots: [
    {
      name: "eyebrow",
      type: "text",
      prompt: "Short kicker above the headline. ALL CAPS.",
      maxLength: 28,
      default: "WHY US",
    },
    {
      name: "headline",
      type: "text",
      prompt: "Section headline. 4-9 words. Wrap one word in <em>…</em> for italic accent.",
      maxLength: 80,
      required: true,
    },
    {
      name: "subhead",
      type: "richText",
      prompt: "One-paragraph elaboration of the headline.",
      maxLength: 200,
    },
    {
      name: "featured",
      type: "list",
      prompt: "The single featured (large) card. EXACTLY ONE item. The most important benefit gets here.",
      minItems: 1,
      maxItems: 1,
      itemSchema: [
        {
          name: "icon",
          type: "icon",
          prompt: "Lucide icon name in PascalCase. e.g. 'Sparkles', 'Zap', 'Shield'.",
          required: true,
          default: "Sparkles",
        },
        {
          name: "title",
          type: "text",
          prompt: "Card title. 2-6 words.",
          maxLength: 60,
          required: true,
        },
        {
          name: "description",
          type: "richText",
          prompt: "Specific, evidence-rich description. 2-3 sentences. Real numbers preferred.",
          maxLength: 240,
          required: true,
        },
      ],
    },
    {
      name: "supporting",
      type: "list",
      prompt: "The 4 supporting cards. EXACTLY FOUR items.",
      minItems: 4,
      maxItems: 4,
      itemSchema: [
        {
          name: "icon",
          type: "icon",
          prompt: "Lucide icon name in PascalCase.",
          required: true,
          default: "Circle",
        },
        {
          name: "title",
          type: "text",
          prompt: "Card title. 1-4 words.",
          maxLength: 40,
          required: true,
        },
        {
          name: "description",
          type: "text",
          prompt: "One-sentence description. Concrete, not aspirational.",
          maxLength: 120,
          required: true,
        },
      ],
    },
  ],
};

export const FEATURES_BENTO_TEMPLATE = `import React from "react";
import * as LucideIcons from "lucide-react";

type IconName = keyof typeof LucideIcons;

function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const Cmp = (LucideIcons as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>>)[name as IconName] || LucideIcons.Circle;
  return <Cmp size={size} strokeWidth={1.5} />;
}

export default function FeaturesBento() {
  const featured = [
    {{#each slot.featured}}
    { icon: "{{item.icon}}", title: "{{item.title}}", description: \`{{item.description}}\` },
    {{/each}}
  ][0];
  const supporting = [
    {{#each slot.supporting}}
    { icon: "{{item.icon}}", title: "{{item.title}}", description: "{{item.description}}" },
    {{/each}}
  ];

  return (
    <section className="px-6 py-24 sm:py-32" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <span className="h-px w-6" style={{ background: "var(--gold)" }} />
            <span className="text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: "var(--gold-deep)" }}>
              {{slot.eyebrow}}
            </span>
            <span className="h-px w-6" style={{ background: "var(--gold)" }} />
          </div>
          <h2
            className="mx-auto max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-5xl"
            style={{ color: "var(--ink)" }}
            dangerouslySetInnerHTML={{ __html: "{{slot.headline | raw}}" }}
          />
          {{#if slot.subhead}}
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg" style={{ color: "var(--ink-secondary)" }}>
            {{slot.subhead}}
          </p>
          {{/if}}
        </div>

        <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-3">
          {/* Featured card — spans 2 cols × 2 rows on md+ */}
          <article
            className="group relative col-span-1 row-span-2 overflow-hidden rounded-2xl p-8 transition-all hover:-translate-y-1 md:col-span-2"
            style={{
              background: "linear-gradient(135deg, var(--paper-elevated) 0%, var(--paper-bright) 100%)",
              border: "1px solid var(--rule)",
              boxShadow: "0 1px 2px rgba(10,10,11,0.05), 0 4px 16px rgba(10,10,11,0.06)",
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full transition-opacity group-hover:opacity-80"
              style={{ background: "radial-gradient(circle, rgba(184, 146, 63, 0.18), transparent 70%)", filter: "blur(40px)" }}
            />
            <div className="relative">
              <div
                className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "var(--gold-soft)", color: "var(--gold-deep)" }}
              >
                <Icon name={featured.icon} size={24} />
              </div>
              <h3 className="mb-3 text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                {featured.title}
              </h3>
              <p className="text-base leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                {featured.description}
              </p>
            </div>
          </article>

          {/* 4 supporting cards */}
          {supporting.map((s, i) => (
            <article
              key={i}
              className="group rounded-2xl p-6 transition-all hover:-translate-y-1"
              style={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--rule)",
                boxShadow: "0 1px 2px rgba(10,10,11,0.04)",
              }}
            >
              <div
                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors group-hover:bg-[color:var(--gold-soft)] group-hover:text-[color:var(--gold-deep)]"
                style={{ background: "var(--paper)", color: "var(--ink-secondary)", border: "1px solid var(--rule)" }}
              >
                <Icon name={s.icon} size={20} />
              </div>
              <h3 className="mb-2 text-base font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                {s.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

export const FEATURES_BENTO_EXAMPLE = {
  eyebrow: "WHY US",
  headline: "Software that <em>actually</em> ships.",
  subhead: "Five things we do that the other AI builders do not. Each one earned us a customer who tried both.",
  featured: [
    {
      icon: "Sparkles",
      title: "Slot-locked composition",
      description:
        "Our AI fills hand-crafted templates instead of generating raw React. Result: zero structural defects, 8-second builds, 50× cheaper repairs. The competition can't copy this without rebuilding their stream parser.",
    },
  ],
  supporting: [
    { icon: "Globe", title: "Real domains", description: "Search + register a .com directly inside the builder, no third-party round-trip." },
    { icon: "Zap", title: "30-second deploy", description: "One click ships to *.zoobicon.sh with SSL and CDN already wired." },
    { icon: "Languages", title: "50-language video", description: "Hero video dubbed automatically in every target market language." },
    { icon: "Sparkles", title: "Sites that improve", description: "Hot-swap template upgrades mean your live site gets better every week." },
  ],
};
