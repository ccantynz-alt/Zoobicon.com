/**
 * pricing-tiers — slot-locked variant.
 *
 * 3-tier pricing grid. Middle tier marked "Most popular" with gold
 * accent ring. Each tier has name + price + period + 4-7 feature
 * bullets + CTA. Optional monthly/yearly toggle (visual only — the
 * slot fill carries both prices, the toggle swaps which one shows).
 */

import type { ComponentSchema } from "../types";

export const PRICING_TIERS_SCHEMA: ComponentSchema = {
  id: "pricing-tiers-slot",
  category: "pricing",
  variant: "three-tier",
  name: "Pricing — 3 tiers",
  description: "Three-card pricing grid with optional monthly/yearly toggle. Middle tier highlighted.",
  themes: ["editorial", "light"],
  slots: [
    {
      name: "eyebrow",
      type: "text",
      prompt: "Section kicker. ALL CAPS.",
      maxLength: 28,
      default: "PRICING",
    },
    {
      name: "headline",
      type: "text",
      prompt: "Section headline. 3-7 words. Use <em>…</em> for italic accent.",
      maxLength: 70,
      default: "Pricing that <em>scales</em> with you.",
    },
    {
      name: "subhead",
      type: "text",
      prompt: "One-sentence reassurance about pricing fairness, transparency, or guarantee.",
      maxLength: 140,
      default: "No surprises, no overage fees, no hidden seat costs. Cancel anytime.",
    },
    {
      name: "showBillingToggle",
      type: "boolean",
      prompt: "Whether to show the monthly/yearly toggle above the cards.",
      default: true,
    },
    {
      name: "tiers",
      type: "list",
      prompt: "Three tier definitions. Free/Starter on the left, the recommended tier in the middle, the highest tier on the right.",
      minItems: 3,
      maxItems: 3,
      itemSchema: [
        {
          name: "name",
          type: "text",
          prompt: "Tier name. 1-2 words. e.g. 'Starter', 'Pro', 'Agency'.",
          maxLength: 18,
          required: true,
        },
        {
          name: "tagline",
          type: "text",
          prompt: "One-sentence audience tag. e.g. 'For freelancers shipping their first site.'",
          maxLength: 100,
          required: true,
        },
        {
          name: "priceMonthly",
          type: "text",
          prompt: "Monthly price as a string. e.g. '$0', '$49', '$299', 'Custom'.",
          maxLength: 12,
          required: true,
        },
        {
          name: "priceYearly",
          type: "text",
          prompt: "Yearly price (per month, billed annually). e.g. '$39' if monthly is $49. Same string if not discounted.",
          maxLength: 12,
          required: true,
        },
        {
          name: "ctaLabel",
          type: "text",
          prompt: "Tier CTA label. e.g. 'Start free', 'Choose Pro', 'Contact sales'.",
          maxLength: 28,
          required: true,
        },
        {
          name: "ctaHref",
          type: "url",
          prompt: "Tier CTA href.",
          required: true,
        },
        {
          name: "highlighted",
          type: "boolean",
          prompt: "Whether this tier is the 'Most popular' one (gold ring, scale-up). Set to true on EXACTLY ONE tier.",
          default: false,
        },
        {
          name: "features",
          type: "list",
          prompt: "4-7 feature bullets. Each is short text. Lead with the differentiator vs the cheaper tier.",
          minItems: 4,
          maxItems: 7,
          itemSchema: [
            {
              name: "text",
              type: "text",
              prompt: "Feature bullet. 3-8 words. Concrete, not aspirational.",
              maxLength: 70,
              required: true,
            },
          ],
        },
      ],
    },
  ],
};

export const PRICING_TIERS_TEMPLATE = `import React, { useState } from "react";
import { Check } from "lucide-react";

export default function PricingTiers() {
  const [yearly, setYearly] = useState(false);
  const tiers = [
    {{#each slot.tiers}}
    {
      name: "{{item.name}}",
      tagline: "{{item.tagline}}",
      priceMonthly: "{{item.priceMonthly}}",
      priceYearly: "{{item.priceYearly}}",
      ctaLabel: "{{item.ctaLabel}}",
      ctaHref: "{{item.ctaHref | raw}}",
      highlighted: {{item.highlighted | raw}},
      features: [
        {{#each item.features}}
        "{{item.text}}",
        {{/each}}
      ],
    },
    {{/each}}
  ];

  return (
    <section id="pricing" className="px-6 py-24 sm:py-32" style={{ background: "var(--paper)", color: "var(--ink)" }}>
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
            className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-5xl"
            style={{ color: "var(--ink)" }}
            dangerouslySetInnerHTML={{ __html: "{{slot.headline | raw}}" }}
          />
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base" style={{ color: "var(--ink-secondary)" }}>
            {{slot.subhead}}
          </p>

          {{#if slot.showBillingToggle}}
          <div
            className="mx-auto mt-8 inline-flex items-center rounded-full p-1"
            style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule)" }}
          >
            <button
              type="button"
              onClick={() => setYearly(false)}
              className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: !yearly ? "var(--ink)" : "transparent",
                color: !yearly ? "var(--paper)" : "var(--ink-secondary)",
              }}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: yearly ? "var(--ink)" : "transparent",
                color: yearly ? "var(--paper)" : "var(--ink-secondary)",
              }}
            >
              Yearly · save 20%
            </button>
          </div>
          {{/if}}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
          {tiers.map((t, i) => (
            <article
              key={i}
              className="relative flex flex-col rounded-2xl p-7 transition-all hover:-translate-y-1"
              style={{
                background: t.highlighted ? "var(--paper-bright)" : "var(--paper-elevated)",
                border: t.highlighted ? "1.5px solid var(--gold)" : "1px solid var(--rule)",
                boxShadow: t.highlighted
                  ? "0 8px 24px -8px rgba(184,146,63,0.30), 0 1px 2px rgba(10,10,11,0.05)"
                  : "0 1px 2px rgba(10,10,11,0.04)",
              }}
            >
              {t.highlighted && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: "var(--gold)", color: "var(--paper)" }}
                >
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                {t.name}
              </h3>
              <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
                {t.tagline}
              </p>
              <div className="mt-5 mb-6">
                <span className="text-4xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                  {yearly ? t.priceYearly : t.priceMonthly}
                </span>
                {!/^\\D/.test(yearly ? t.priceYearly : t.priceMonthly) && (
                  <span className="ml-1 text-sm" style={{ color: "var(--ink-muted)" }}>/mo</span>
                )}
              </div>
              <ul className="mb-6 flex-1 space-y-2.5">
                {t.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--ink-secondary)" }}>
                    <Check size={16} strokeWidth={2} style={{ color: "var(--gold-deep)", marginTop: 2, flexShrink: 0 }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={t.ctaHref}
                className="block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors"
                style={{
                  background: t.highlighted ? "var(--ink)" : "var(--paper)",
                  color: t.highlighted ? "var(--paper)" : "var(--ink)",
                  border: t.highlighted ? "1px solid var(--ink)" : "1px solid var(--rule)",
                }}
              >
                {t.ctaLabel}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

export const PRICING_TIERS_EXAMPLE = {
  eyebrow: "PRICING",
  headline: "Pricing that <em>scales</em> with you.",
  subhead: "No surprises, no overage fees, no hidden seat costs. Cancel anytime.",
  showBillingToggle: true,
  tiers: [
    {
      name: "Starter",
      tagline: "For solos shipping their first site.",
      priceMonthly: "$49",
      priceYearly: "$39",
      ctaLabel: "Start building",
      ctaHref: "/signup?plan=starter",
      highlighted: false,
      features: [
        { text: "1 production site" },
        { text: "Domain + email included" },
        { text: "AI builder, unlimited prompts" },
        { text: "Free *.zoobicon.sh hosting" },
      ],
    },
    {
      name: "Pro",
      tagline: "For teams growing past a single site.",
      priceMonthly: "$129",
      priceYearly: "$99",
      ctaLabel: "Choose Pro",
      ctaHref: "/signup?plan=pro",
      highlighted: true,
      features: [
        { text: "5 production sites" },
        { text: "5 domains + 25 mailboxes" },
        { text: "AI video pipeline included" },
        { text: "Custom domains + SSL" },
        { text: "Priority support" },
      ],
    },
    {
      name: "Agency",
      tagline: "For agencies serving 20+ clients.",
      priceMonthly: "$299",
      priceYearly: "$239",
      ctaLabel: "Contact sales",
      ctaHref: "/contact?plan=agency",
      highlighted: false,
      features: [
        { text: "25 production sites" },
        { text: "White-label dashboard" },
        { text: "Client billing built in" },
        { text: "AI Twins for every site" },
        { text: "Dedicated success manager" },
      ],
    },
  ],
};
