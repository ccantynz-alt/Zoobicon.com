/**
 * testimonials-quotes — slot-locked variant.
 *
 * Three editorial testimonial cards (quote + author + role/company).
 * Optional aggregate-rating header. Editorial-light styling, hairline
 * borders, gold quotation accent. Deterministic — the AI supplies only
 * the quote text and attribution, never layout code.
 */

import type { ComponentSchema } from "../types";

export const TESTIMONIALS_QUOTES_SCHEMA: ComponentSchema = {
  id: "testimonials-quotes-slot",
  category: "testimonials",
  variant: "quotes",
  name: "Testimonials — quote cards",
  description: "Three editorial testimonial cards (quote + author + role). Optional aggregate rating.",
  themes: ["editorial", "light"],
  slots: [
    {
      name: "eyebrow",
      type: "text",
      prompt: "Short kicker above the headline. ALL CAPS. e.g. 'WHAT THEY SAY'.",
      maxLength: 28,
      default: "TESTIMONIALS",
    },
    {
      name: "headline",
      type: "text",
      prompt: "Section headline. 3-8 words. Wrap one word in <em>…</em> for italic accent.",
      maxLength: 70,
      required: true,
    },
    {
      name: "rating",
      type: "text",
      prompt: "Optional aggregate rating line. e.g. '4.9/5 from 1,200+ reviews'. Leave blank if unknown.",
      maxLength: 48,
    },
    {
      name: "testimonials",
      type: "list",
      prompt: "EXACTLY THREE testimonials. Each quote should sound like a real customer, specific not generic.",
      minItems: 3,
      maxItems: 3,
      itemSchema: [
        {
          name: "quote",
          type: "richText",
          prompt: "The testimonial quote. 1-3 sentences. Specific and credible. No marketing clichés.",
          maxLength: 260,
          required: true,
        },
        {
          name: "author",
          type: "text",
          prompt: "Author full name.",
          maxLength: 40,
          required: true,
        },
        {
          name: "role",
          type: "text",
          prompt: "Author role + company. e.g. 'Founder, Lumen Studio'.",
          maxLength: 56,
          required: true,
        },
      ],
    },
  ],
};

export const TESTIMONIALS_QUOTES_TEMPLATE = `import React from "react";

export default function TestimonialsQuotes() {
  const testimonials = [
    {{#each slot.testimonials}}
    { quote: \`{{item.quote}}\`, author: "{{item.author}}", role: "{{item.role}}" },
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
            className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "var(--ink)" }}
            dangerouslySetInnerHTML={{ __html: "{{slot.headline | raw}}" }}
          />
          {{#if slot.rating}}
          <p className="mt-4 text-sm font-medium" style={{ color: "var(--gold-deep)" }}>
            ★★★★★ &nbsp;{{slot.rating}}
          </p>
          {{/if}}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-2xl p-7 transition-all hover:-translate-y-1"
              style={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--rule)",
                boxShadow: "0 1px 2px rgba(10,10,11,0.04)",
              }}
            >
              <div aria-hidden="true" className="mb-4 text-5xl leading-none" style={{ color: "var(--gold)", fontFamily: "Georgia, serif" }}>
                &ldquo;
              </div>
              <blockquote className="flex-1 text-base leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 border-t pt-4" style={{ borderColor: "var(--rule)" }}>
                <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{t.author}</div>
                <div className="text-xs" style={{ color: "var(--ink-muted)" }}>{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

export const TESTIMONIALS_QUOTES_EXAMPLE = {
  eyebrow: "TESTIMONIALS",
  headline: "Loved by the people who <em>shipped</em> with us.",
  rating: "4.9/5 from 1,200+ builders",
  testimonials: [
    {
      quote:
        "I described my bakery in one sentence and had a live, deployable site in under a minute. I tried Lovable and Bolt first — this was faster and the design was better out of the box.",
      author: "Mara Delgado",
      role: "Owner, Rye & Salt Bakery",
    },
    {
      quote:
        "We pasted our old WordPress URL and it rebuilt the whole thing modern. Same colors, same content, but it finally looks like 2027 instead of 2014.",
      author: "Tom Whitfield",
      role: "Director, Whitfield Legal",
    },
    {
      quote:
        "The preview never breaks anymore. Even when one section had a weird edit, the rest stayed perfect. That reliability is why we switched our whole agency over.",
      author: "Priya Nair",
      role: "Founder, Northlight Studio",
    },
  ],
};
