/**
 * navbar-minimal — slot-locked variant.
 *
 * Editorial-light header. Brand mark + wordmark on the left, 3-6 link
 * items in the middle, optional primary CTA on the right. Scroll-aware
 * (uses local state to toggle bg opacity, mirrors SiteNavigation.tsx
 * pattern). Mobile menu collapses behind a hamburger.
 */

import type { ComponentSchema } from "../types";

export const NAVBAR_MINIMAL_SCHEMA: ComponentSchema = {
  id: "navbar-minimal-slot",
  category: "navbar",
  variant: "minimal",
  name: "Navbar — minimal",
  description: "Editorial header with brand mark + 3-6 nav links + optional CTA. Scroll-aware backdrop, mobile hamburger.",
  themes: ["editorial", "light", "warm"],
  slots: [
    {
      name: "brandName",
      type: "text",
      prompt: "Brand wordmark. 1-2 words.",
      maxLength: 24,
      required: true,
    },
    {
      name: "brandMonogram",
      type: "text",
      prompt: "Single letter or character for the round logo mark. Usually the first letter of the brand. Defaults to the first character of brandName if omitted.",
      maxLength: 2,
      default: "Z",
    },
    {
      name: "links",
      type: "list",
      prompt: "Top-level nav links. 3-6 items. Each is a label + href pair.",
      minItems: 3,
      maxItems: 6,
      itemSchema: [
        {
          name: "label",
          type: "text",
          prompt: "Link label. 1-2 words.",
          maxLength: 20,
          required: true,
        },
        {
          name: "href",
          type: "url",
          prompt: "Link href. Use anchor (#features) for in-page, /path for routes.",
          required: true,
        },
      ],
    },
    {
      name: "ctaLabel",
      type: "text",
      prompt: "Primary CTA label. Verb-led: 'Start free', 'Book a demo'.",
      maxLength: 18,
      default: "Get started",
    },
    {
      name: "ctaHref",
      type: "url",
      prompt: "Primary CTA href.",
      default: "/signup",
    },
    {
      name: "showCta",
      type: "boolean",
      prompt: "Whether to show the primary CTA at all.",
      default: true,
    },
  ],
};

export const NAVBAR_MINIMAL_TEMPLATE = `import React, { useEffect, useState } from "react";

export default function NavbarMinimal() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    {{#each slot.links}}
    { label: "{{item.label}}", href: "{{item.href | raw}}" },
    {{/each}}
  ];

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(252, 250, 243, 0.99)"
          : "rgba(254, 252, 245, 0.96)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        borderBottom: "1px solid var(--rule)",
        boxShadow: scrolled
          ? "0 8px 24px -8px rgba(10,10,11,0.10), 0 1px 0 0 rgba(184,146,63,0.32)"
          : "0 1px 0 0 rgba(184,146,63,0.22)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <a href="/" className="group flex items-center gap-3">
          <span
            className="grid h-10 w-10 place-items-center rounded-full text-base font-bold"
            style={{
              background: "var(--paper)",
              border: "1.5px solid var(--gold)",
              color: "var(--gold-deep)",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              boxShadow: "0 2px 6px -2px rgba(140,107,37,0.18), inset 0 0 0 3px var(--paper)",
            }}
          >
            {{slot.brandMonogram}}
          </span>
          <span
            className="text-lg tracking-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "var(--ink)",
            }}
          >
            {{slot.brandName}}
          </span>
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-[13px] font-medium transition-colors hover:opacity-100"
                style={{ color: "var(--ink-secondary)" }}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {{#if slot.showCta}}
          <a
            href="{{slot.ctaHref | raw}}"
            className="hidden rounded-lg px-4 py-2 text-sm font-semibold transition-all sm:inline-flex"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            {{slot.ctaLabel}}
          </a>
          {{/if}}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden"
            style={{ color: "var(--ink)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="border-t md:hidden"
          style={{ background: "var(--paper-elevated)", borderColor: "var(--rule)" }}
        >
          <ul className="flex flex-col gap-1 px-6 py-4">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  style={{ color: "var(--ink)" }}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </a>
              </li>
            ))}
            {{#if slot.showCta}}
            <li className="mt-2 border-t pt-3" style={{ borderColor: "var(--rule)" }}>
              <a
                href="{{slot.ctaHref | raw}}"
                className="block rounded-md px-3 py-2 text-center text-sm font-semibold"
                style={{ background: "var(--ink)", color: "var(--paper)" }}
              >
                {{slot.ctaLabel}}
              </a>
            </li>
            {{/if}}
          </ul>
        </div>
      )}
    </nav>
  );
}
`;

export const NAVBAR_MINIMAL_EXAMPLE = {
  brandName: "Acme",
  brandMonogram: "A",
  links: [
    { label: "Product", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Customers", href: "#customers" },
    { label: "Docs", href: "/docs" },
  ],
  ctaLabel: "Start free",
  ctaHref: "/signup",
  showCta: true,
};
