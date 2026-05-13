/**
 * footer-editorial — slot-locked variant.
 *
 * Editorial 4-column footer. Brand block (logo + tagline + social) on
 * the left, 3 link groups on the right. Hairline rule top + bottom,
 * legal strip with copyright + four-domain signature (Rule 11).
 */

import type { ComponentSchema } from "../types";

export const FOOTER_EDITORIAL_SCHEMA: ComponentSchema = {
  id: "footer-editorial-slot",
  category: "footer",
  variant: "editorial",
  name: "Footer — editorial 4-column",
  description: "4-column editorial footer with brand block + 3 link groups + legal strip.",
  themes: ["editorial", "light", "warm"],
  slots: [
    {
      name: "brandName",
      type: "text",
      prompt: "Brand wordmark.",
      maxLength: 24,
      required: true,
    },
    {
      name: "brandTagline",
      type: "text",
      prompt: "One-line description of the brand. 6-14 words.",
      maxLength: 140,
      required: true,
    },
    {
      name: "linkGroups",
      type: "list",
      prompt: "Three column-groups of footer links. e.g. Product / Company / Resources.",
      minItems: 3,
      maxItems: 3,
      itemSchema: [
        {
          name: "title",
          type: "text",
          prompt: "Group title. 1-2 words.",
          maxLength: 20,
          required: true,
        },
        {
          name: "links",
          type: "list",
          prompt: "Links in this group. 3-6 items.",
          minItems: 3,
          maxItems: 6,
          itemSchema: [
            { name: "label", type: "text", prompt: "Link label.", maxLength: 24, required: true },
            { name: "href", type: "url", prompt: "Link href.", required: true },
          ],
        },
      ],
    },
    {
      name: "copyrightLine",
      type: "text",
      prompt: "Copyright line. Include the brand name + year.",
      maxLength: 100,
      default: "© 2026 Acme. All rights reserved.",
    },
    {
      name: "showZoobiconSignature",
      type: "boolean",
      prompt: "Show the four-domain Zoobicon signature in the footer (Rule 11 — required on every Zoobicon-built site).",
      default: true,
    },
  ],
};

export const FOOTER_EDITORIAL_TEMPLATE = `import React from "react";

export default function FooterEditorial() {
  const groups = [
    {{#each slot.linkGroups}}
    {
      title: "{{item.title}}",
      links: [
        {{#each item.links}}
        { label: "{{item.label}}", href: "{{item.href | raw}}" },
        {{/each}}
      ],
    },
    {{/each}}
  ];

  return (
    <footer
      className="px-6 py-16 sm:py-20"
      style={{
        background: "var(--paper-elevated)",
        color: "var(--ink-secondary)",
        borderTop: "1px solid var(--rule)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold"
                style={{
                  background: "var(--paper)",
                  border: "1.5px solid var(--gold)",
                  color: "var(--gold-deep)",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                {{slot.brandName}}[0]
              </span>
              <span
                className="text-base tracking-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: "var(--ink)",
                }}
              >
                {{slot.brandName}}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              {{slot.brandTagline}}
            </p>
          </div>

          {/* Three link groups */}
          {groups.map((g, i) => (
            <div key={i}>
              <h3
                className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--ink)" }}
              >
                {g.title}
              </h3>
              <ul className="space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="text-sm transition-colors hover:underline"
                      style={{ color: "var(--ink-muted)" }}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal strip */}
        <div
          className="mt-12 flex flex-col items-start justify-between gap-3 pt-6 text-xs md:flex-row md:items-center"
          style={{ borderTop: "1px solid var(--rule)", color: "var(--ink-muted)" }}
        >
          <span>{{slot.copyrightLine}}</span>
          {{#if slot.showZoobiconSignature}}
          <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}>
            zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh
          </span>
          {{/if}}
        </div>
      </div>
    </footer>
  );
}
`;

export const FOOTER_EDITORIAL_EXAMPLE = {
  brandName: "Acme",
  brandTagline: "The white-label AI platform. Domains, hosting, builder, video, email — all in one.",
  linkGroups: [
    {
      title: "Product",
      links: [
        { label: "AI Builder", href: "/builder" },
        { label: "Domains", href: "/domains" },
        { label: "Video creator", href: "/video-creator" },
        { label: "Pricing", href: "/pricing" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Customers", href: "/customers" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/docs" },
        { label: "API reference", href: "/api-docs" },
        { label: "Status", href: "/status" },
        { label: "Support", href: "/support" },
      ],
    },
  ],
  copyrightLine: "© 2026 Acme. All rights reserved.",
  showZoobiconSignature: true,
};
