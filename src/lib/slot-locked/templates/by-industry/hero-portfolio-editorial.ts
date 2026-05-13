/**
 * hero-portfolio-editorial — slot-locked variant for personal-brand /
 * portfolio sites.
 *
 * Single-column editorial hero. Massive serif name treatment with
 * italic accent, restrained typographic kicker, one-paragraph
 * positioning statement, single understated CTA. Designed to look
 * like a Sotheby's catalogue, not a SaaS landing page.
 */

import type { ComponentSchema } from "../../types";

export const HERO_PORTFOLIO_EDITORIAL_SCHEMA: ComponentSchema = {
  id: "hero-portfolio-editorial-slot",
  category: "hero",
  variant: "portfolio-editorial",
  name: "Hero — portfolio (editorial)",
  description: "Massive Playfair name + role kicker + positioning paragraph + single CTA. Editorial restraint. For portfolios, personal brands, consultants, photographers.",
  industries: ["portfolio", "personal-brand", "agency"],
  themes: ["editorial"],
  slots: [
    {
      name: "kicker",
      type: "text",
      prompt: "Tiny role line shown above the name. ALL CAPS, letter-spaced. e.g. 'INDEPENDENT DESIGNER', 'PRODUCT STRATEGIST', 'WEDDING PHOTOGRAPHER · WELLINGTON'.",
      maxLength: 44,
      required: true,
    },
    {
      name: "displayName",
      type: "text",
      prompt: "The person or studio name. 1-4 words. Wrap one word in <em>…</em> for italic accent.",
      maxLength: 50,
      required: true,
    },
    {
      name: "positioning",
      type: "richText",
      prompt: "One-paragraph positioning statement. 2-3 sentences. Editorial voice. Show, don't tell. No 'passionate', 'creative', 'unique'. Include one specific detail (where they're based, what they last shipped, who they've worked with).",
      maxLength: 280,
      required: true,
    },
    {
      name: "ctaLabel",
      type: "text",
      prompt: "Primary CTA label. Restrained. 'See selected work', 'Get in touch', 'Read the journal'.",
      maxLength: 28,
      default: "See selected work",
    },
    {
      name: "ctaHref",
      type: "url",
      prompt: "Primary CTA href. Anchor or internal path.",
      default: "#work",
    },
    {
      name: "availabilityLine",
      type: "text",
      prompt: "Small availability line under the CTA. Honest. e.g. 'Currently booking Q3 2026', 'Open to inquiries · responds within 48 hours'.",
      maxLength: 80,
      default: "",
    },
  ],
};

export const HERO_PORTFOLIO_EDITORIAL_TEMPLATE = `import React from "react";

export default function HeroPortfolioEditorial() {
  return (
    <section
      className="relative px-6 py-24 sm:py-40"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-px w-10" style={{ background: "var(--gold)" }} />
          <span className="text-[11px] font-medium uppercase tracking-[0.28em]" style={{ color: "var(--gold-deep)" }}>
            {{slot.kicker}}
          </span>
        </div>

        <h1
          className="mb-10 text-balance text-6xl tracking-tight sm:text-7xl md:text-8xl"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "var(--ink)",
            fontWeight: 500,
            lineHeight: 0.98,
            letterSpacing: "-0.035em",
          }}
          dangerouslySetInnerHTML={{ __html: "{{slot.displayName | raw}}" }}
        />

        <p
          className="mb-12 max-w-2xl text-pretty text-xl leading-relaxed sm:text-2xl"
          style={{ color: "var(--ink-secondary)", fontWeight: 300 }}
        >
          {{slot.positioning}}
        </p>

        <div className="flex flex-col items-start gap-3">
          <a
            href="{{slot.ctaHref | raw}}"
            className="group inline-flex items-center gap-2 border-b pb-1 text-sm font-medium tracking-tight transition-colors hover:opacity-100"
            style={{ borderColor: "var(--ink)", color: "var(--ink)" }}
          >
            {{slot.ctaLabel}}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </a>
          {{#if slot.availabilityLine}}
          <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
            {{slot.availabilityLine}}
          </span>
          {{/if}}
        </div>
      </div>
    </section>
  );
}
`;

export const HERO_PORTFOLIO_EDITORIAL_EXAMPLE = {
  kicker: "INDEPENDENT DESIGNER · WELLINGTON",
  displayName: "Holden <em>Mercer</em>",
  positioning:
    "A small studio working at the intersection of brand, editorial, and software. Most recently a year inside a private bank in Auckland; before that, six years building visual systems for product teams. Available for selected briefs through 2026.",
  ctaLabel: "See selected work",
  ctaHref: "#work",
  availabilityLine: "Currently booking Q3 2026 · responds within 48 hours",
};
